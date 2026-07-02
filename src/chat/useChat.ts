import { useCallback, useEffect, useRef, useState } from "react";
import { LocalAI, modelById } from "../lib";
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

const MODEL_IDLE: ModelState = {
  status: "idle",
  progress: "",
  progressPct: 0,
  error: null,
};
const DEFAULT_CONTEXT = 4096;

type ApiMessage = { role: "system" | "user" | "assistant"; content: string };

export function useChat() {
  const clientRef = useRef<LocalAI | null>(null);
  const [model, setModel] = useState<ModelState>(MODEL_IDLE);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<ChatStats>(null);
  const [contextTokens, setContextTokens] = useState(0);
  const [contextWindow, setContextWindow] = useState(DEFAULT_CONTEXT);

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
      setContextWindow(modelById(modelId)?.contextWindow ?? DEFAULT_CONTEXT);
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
          messages: apiMessages,
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
    async (text: string, context?: string | null, citations?: string[]): Promise<void> => {
      const client = clientRef.current;
      const trimmed = text.trim();
      if (!client?.ready || !activeId || !trimmed || generating) return;
      const current = conversations.find((c) => c.id === activeId);
      if (!current) return;

      const userMsg = newMessage("user", trimmed);
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
    loadModel,
    newChat,
    selectChat,
    removeChat,
    send,
    stop,
    regenerate,
  };
}

function toApi(messages: Message[]): ApiMessage[] {
  return messages.map((m) => ({ role: m.role, content: m.content }));
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
