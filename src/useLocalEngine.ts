import { useCallback, useRef, useState } from "react";
import {
  CreateWebWorkerMLCEngine,
  type MLCEngineInterface,
  type InitProgressReport,
} from "@mlc-ai/web-llm";

// Perf stats WebLLM reports in the final streamed usage chunk (usage.extra).
export type GenStats = {
  prefillTokPerSec: number;
  decodeTokPerSec: number;
};

type EngineState = {
  status: "idle" | "loading" | "ready" | "generating" | "error";
  progress: string;
  output: string;
  stats: GenStats | null;
  error: string | null;
};

const INITIAL: EngineState = {
  status: "idle",
  progress: "",
  output: "",
  stats: null,
  error: null,
};

export function useLocalEngine() {
  const engineRef = useRef<MLCEngineInterface | null>(null);
  const [state, setState] = useState<EngineState>(INITIAL);

  const load = useCallback(async (modelId: string): Promise<void> => {
    setState({ ...INITIAL, status: "loading", progress: "Starting…" });
    try {
      const worker = new Worker(new URL("./worker.ts", import.meta.url), {
        type: "module",
      });
      const engine = await CreateWebWorkerMLCEngine(worker, modelId, {
        initProgressCallback: (r: InitProgressReport) =>
          setState((s) => ({ ...s, progress: r.text })),
      });
      engineRef.current = engine;
      setState((s) => ({ ...s, status: "ready", progress: "Model ready." }));
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  const generate = useCallback(async (prompt: string): Promise<void> => {
    const engine = engineRef.current;
    if (!engine) return;
    setState((s) => ({ ...s, status: "generating", output: "", stats: null }));
    try {
      const chunks = await engine.chat.completions.create({
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
      setState((s) => ({
        ...s,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }, []);

  return { state, load, generate };
}
