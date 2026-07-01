import { useCallback, useEffect, useRef, useState } from "react";
import { LocalAI } from "../lib";
import { listConversations, saveConversation, deleteConversation } from "./db";
import {
  newConversation,
  newMessage,
  type Conversation,
} from "./types";

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

export function useChat() {
  const clientRef = useRef<LocalAI | null>(null);
  const [model, setModel] = useState<ModelState>(MODEL_IDLE);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState<ChatStats>(null);

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
      setModel({
        status: "ready",
        progress: "Model ready.",
        progressPct: 1,
        error: null,
      });
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

  const send = useCallback(
    async (text: string, context?: string | null): Promise<void> => {
      const client = clientRef.current;
      const trimmed = text.trim();
      if (!client?.ready || !activeId || !trimmed || generating) return;
      const current = conversations.find((c) => c.id === activeId);
      if (!current) return;

      const userMsg = newMessage("user", trimmed);
      const assistantMsg = newMessage("assistant", "");
      const history = [...current.messages, userMsg];
      let working: Conversation = {
        ...current,
        title: current.messages.length === 0 ? deriveTitle(trimmed) : current.title,
        modelId: current.modelId,
        messages: [...history, assistantMsg],
        updatedAt: Date.now(),
      };
      setConversations((cs) => upsert(cs, working));
      setGenerating(true);
      setStats(null);

      const apiMessages = history.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      try {
        const chunks = await client.chat.completions.create({
          messages: context
            ? [{ role: "system" as const, content: context }, ...apiMessages]
            : apiMessages,
          stream: true,
          stream_options: { include_usage: true },
        });
        let reply = "";
        for await (const chunk of chunks) {
          reply += chunk.choices[0]?.delta?.content ?? "";
          const extra = chunk.usage?.extra;
          if (extra) {
            setStats({
              prefillTokPerSec: extra.prefill_tokens_per_s ?? 0,
              decodeTokPerSec: extra.decode_tokens_per_s ?? 0,
            });
          }
          working = patchAssistant(working, assistantMsg.id, reply);
          setConversations((cs) => upsert(cs, working));
        }
      } catch (err) {
        working = patchAssistant(working, assistantMsg.id, `⚠️ ${toMessage(err)}`);
        setConversations((cs) => upsert(cs, working));
      } finally {
        setGenerating(false);
        await saveConversation(working);
      }
    },
    [activeId, conversations, generating],
  );

  return {
    model,
    conversations,
    active,
    activeId,
    generating,
    stats,
    loadModel,
    newChat,
    selectChat,
    removeChat,
    send,
  };
}

function upsert(list: Conversation[], conv: Conversation): Conversation[] {
  return [conv, ...list.filter((c) => c.id !== conv.id)];
}

function patchAssistant(
  conv: Conversation,
  messageId: string,
  content: string,
): Conversation {
  return {
    ...conv,
    updatedAt: Date.now(),
    messages: conv.messages.map((m) =>
      m.id === messageId ? { ...m, content } : m,
    ),
  };
}

function deriveTitle(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > 40 ? `${clean.slice(0, 40)}…` : clean;
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
