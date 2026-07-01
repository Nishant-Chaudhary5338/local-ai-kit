import { useCallback, useRef, useState } from "react";
import { LocalAI } from "./lib";

// Perf stats WebLLM reports in the final streamed usage chunk (usage.extra).
export type GenStats = {
  prefillTokPerSec: number;
  decodeTokPerSec: number;
};

type EngineState = {
  status: "idle" | "loading" | "ready" | "generating" | "error";
  progress: string;
  progressPct: number;
  output: string;
  stats: GenStats | null;
  error: string | null;
};

const INITIAL: EngineState = {
  status: "idle",
  progress: "",
  progressPct: 0,
  output: "",
  stats: null,
  error: null,
};

export function useLocalEngine() {
  const clientRef = useRef<LocalAI | null>(null);
  const [state, setState] = useState<EngineState>(INITIAL);

  const load = useCallback(async (modelId: string): Promise<void> => {
    setState({ ...INITIAL, status: "loading", progress: "Starting…" });
    try {
      const client = new LocalAI();
      await client.load(modelId, ({ text, progress }) =>
        setState((s) => ({ ...s, progress: text, progressPct: progress })),
      );
      clientRef.current = client;
      setState((s) => ({
        ...s,
        status: "ready",
        progress: "Model ready.",
        progressPct: 1,
      }));
    } catch (err) {
      setState((s) => ({ ...s, status: "error", error: toMessage(err) }));
    }
  }, []);

  const generate = useCallback(async (prompt: string): Promise<void> => {
    const client = clientRef.current;
    if (!client?.ready) return;
    setState((s) => ({ ...s, status: "generating", output: "", stats: null }));
    try {
      const chunks = await client.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        stream: true,
        stream_options: { include_usage: true },
      });
      let reply = "";
      let stats: GenStats | null = null;
      for await (const chunk of chunks) {
        reply += chunk.choices[0]?.delta?.content ?? "";
        const extra = chunk.usage?.extra;
        if (extra) {
          stats = {
            prefillTokPerSec: extra.prefill_tokens_per_s ?? 0,
            decodeTokPerSec: extra.decode_tokens_per_s ?? 0,
          };
        }
        setState((s) => ({ ...s, output: reply, stats }));
      }
      setState((s) => ({ ...s, status: "ready" }));
    } catch (err) {
      setState((s) => ({ ...s, status: "error", error: toMessage(err) }));
    }
  }, []);

  return { state, load, generate };
}

function toMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
