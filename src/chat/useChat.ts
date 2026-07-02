import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatCompletionMessageParam } from "@mlc-ai/web-llm";
import { LocalAI, modelById, type ModelCapability } from "../lib";
import { listConversations, saveConversation, deleteConversation } from "./db";
import { newConversation, newMessage, type Conversation, type Message } from "./types";

export type ModelStatus = "idle" | "loading" | "ready" | "error";
export type ModelState = {
  status: ModelStatus;
  progress: string;
  progressPct: number;
  error: string | null;
};
export type ChatStats = {
  prefillTokPerSec: number;
  decodeTokPerSec: number;
} | null;
export type BenchResult = {
  model: string;
  ttftMs: number;
  prefillTokPerSec: number;
  decodeTokPerSec: number;
};

const BENCH_PROMPT = "Write a short paragraph about the ocean at dawn.";

const MODEL_IDLE: ModelState = {
  status: "idle",
  progress: "",
  progressPct: 0,
  error: null,
};
const DEFAULT_CONTEXT = 4096;

type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };
type ApiMessage = {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
};

export function useChat() {
  const clientRef = useRef<LocalAI | null>(null);
  const [model, setModel] = useState<ModelState>(MODEL_IDLE);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<ChatStats>(null);
  const [contextTokens, setContextTokens] = useState(0);
  const [contextWindow, setContextWindow] = useState(DEFAULT_CONTEXT);
  const [modelCapability, setModelCapability] = useState<ModelCapability>("chat");
  const loadedModelRef = useRef<string>("");

  useEffect(() => {
    void (async () => {
      const list = await listConversations();
      if (list.length > 0) {
        setConversations(list);
        setActiveId(list[0].id);
        return;
      }
      const conv = newConversation();
      await saveConversation(conv);
      setConversations([conv]);
      setActiveId(conv.id);
    })();
  }, []);

  const active = conversations.find((c) => c.id === activeId) ?? null;

  const loadModel = useCallback(async (modelId: string): Promise<void> => {
    setModel({ ...MODEL_IDLE, status: "loading", progress: "Starting…" });
    try {
      const client = new LocalAI();
      await client.load(modelId, ({ text, progress }) =>
        setModel((m) => ({ ...m, progress: text, progressPct: progress })),
      );
      clientRef.current = client;
      loadedModelRef.current = modelId;
      setContextWindow(modelById(modelId)?.contextWindow ?? DEFAULT_CONTEXT);
      setModelCapability(modelById(modelId)?.capability ?? "chat");
      setContextTokens(0);
      setModel({ status: "ready", progress: "Model ready.", progressPct: 1, error: null });
    } catch (err) {
      setModel({ ...MODEL_IDLE, status: "error", error: toMessage(err) });
    }
  }, []);

  const newChat = useCallback(async (): Promise<void> => {
    const conv = newConversation();
    await saveConversation(conv);
    setConversations((cs) => [conv, ...cs]);
    setActiveId(conv.id);
  }, []);

  const selectChat = useCallback((id: string): void => setActiveId(id), []);

  const removeChat = useCallback(async (id: string): Promise<void> => {
    await deleteConversation(id);
    setConversations((cs) => {
      const next = cs.filter((c) => c.id !== id);
      setActiveId((prev) => (prev === id ? (next[0]?.id ?? null) : prev));
      return next;
    });
  }, []);

  const stop = useCallback((): void => clientRef.current?.interrupt(), []);

  const benchmark = useCallback(async (): Promise<BenchResult | null> => {
    const client = clientRef.current;
    if (!client?.ready || generating) return null;
    setGenerating(true);
    try {
      const start = performance.now();
      let ttftMs = 0;
      let result: BenchResult | null = null;
      const chunks = await client.chat.completions.create({
        messages: [{ role: "user", content: BENCH_PROMPT }],
        stream: true,
        stream_options: { include_usage: true },
      });
      for await (const chunk of chunks) {
        if (!ttftMs && chunk.choices[0]?.delta?.content) {
          ttftMs = Math.round(performance.now() - start);
        }
        if (chunk.usage?.extra) {
          result = {
            model: modelById(loadedModelRef.current)?.label ?? loadedModelRef.current,
            ttftMs,
            prefillTokPerSec: chunk.usage.extra.prefill_tokens_per_s ?? 0,
            decodeTokPerSec: chunk.usage.extra.decode_tokens_per_s ?? 0,
          };
        }
      }
      return result;
    } finally {
      setGenerating(false);
    }
  }, [generating]);

  // Streams a reply into `assistantId`, mutating a local working copy that is
  // pushed to state on every delta and returned for persistence.
  const run = useCallback(
    async (
      client: LocalAI,
      apiMessages: ApiMessage[],
      start: Conversation,
      assistantId: string,
    ): Promise<Conversation> => {
      setGenerating(true);
      setStats(null);
      let working = start;
      try {
        const chunks = await client.chat.completions.create({
          // Our ApiMessage widens content to arrays for all roles; only user
          // messages ever carry an image array, so this matches WebLLM at runtime.
          messages: apiMessages as ChatCompletionMessageParam[],
          stream: true,
          stream_options: { include_usage: true },
        });
        let reply = "";
        for await (const chunk of chunks) {
          reply += chunk.choices[0]?.delta?.content ?? "";
          const usage = chunk.usage;
          if (usage?.extra) {
            setStats({
              prefillTokPerSec: usage.extra.prefill_tokens_per_s ?? 0,
              decodeTokPerSec: usage.extra.decode_tokens_per_s ?? 0,
            });
          }
          if (usage?.prompt_tokens) setContextTokens(usage.prompt_tokens);
          working = patchAssistant(working, assistantId, reply);
          setConversations((cs) => upsert(cs, working));
        }
      } catch (err) {
        working = patchAssistant(working, assistantId, `⚠️ ${toMessage(err)}`);
        setConversations((cs) => upsert(cs, working));
      } finally {
        setGenerating(false);
      }
      return working;
    },
    [],
  );

  const send = useCallback(
    async (
      text: string,
      context?: string | null,
      citations?: string[],
      image?: string,
    ): Promise<void> => {
      const client = clientRef.current;
      const trimmed = text.trim();
      if (!client?.ready || !activeId || !trimmed || generating) return;
      const current = conversations.find((c) => c.id === activeId);
      if (!current) return;

      const userMsg: Message = { ...newMessage("user", trimmed), image };
      const assistantMsg: Message = { ...newMessage("assistant", ""), citations };
      const history = [...current.messages, userMsg];
      const working: Conversation = {
        ...current,
        title: current.messages.length === 0 ? deriveTitle(trimmed) : current.title,
        messages: [...history, assistantMsg],
        updatedAt: Date.now(),
      };
      setConversations((cs) => upsert(cs, working));

      const api = toApi(history);
      const messages = context ? [{ role: "system" as const, content: context }, ...api] : api;
      const final = await run(client, messages, working, assistantMsg.id);
      await saveConversation(final);
    },
    [activeId, conversations, generating, run],
  );

  const regenerate = useCallback(async (): Promise<void> => {
    const client = clientRef.current;
    if (!client?.ready || !activeId || generating) return;
    const current = conversations.find((c) => c.id === activeId);
    if (!current) return;
    const lastUser = findLastUserIndex(current.messages);
    if (lastUser === -1) return;

    const history = current.messages.slice(0, lastUser + 1);
    const assistantMsg = newMessage("assistant", "");
    const working: Conversation = {
      ...current,
      messages: [...history, assistantMsg],
      updatedAt: Date.now(),
    };
    setConversations((cs) => upsert(cs, working));
    const final = await run(client, toApi(history), working, assistantMsg.id);
    await saveConversation(final);
  }, [activeId, conversations, generating, run]);

  return {
    model,
    conversations,
    active,
    activeId,
    generating,
    stats,
    contextTokens,
    contextWindow,
    modelCapability,
    loadModel,
    newChat,
    selectChat,
    removeChat,
    send,
    stop,
    regenerate,
    benchmark,
  };
}

function toApi(messages: Message[]): ApiMessage[] {
  return messages.map((m) =>
    m.image
      ? {
          role: m.role,
          content: [
            { type: "text", text: m.content },
            { type: "image_url", image_url: { url: m.image } },
          ],
        }
      : { role: m.role, content: m.content },
  );
}

function findLastUserIndex(messages: Message[]): number {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return i;
  }
  return -1;
}

function upsert(list: Conversation[], conv: Conversation): Conversation[] {
  return [conv, ...list.filter((c) => c.id !== conv.id)];
}

function patchAssistant(conv: Conversation, messageId: string, content: string): Conversation {
  return {
    ...conv,
    updatedAt: Date.now(),
    messages: conv.messages.map((m) => (m.id === messageId ? { ...m, content } : m)),
  };
}

function deriveTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
