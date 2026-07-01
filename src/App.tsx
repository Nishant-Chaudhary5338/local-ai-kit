import { useEffect, useMemo, useState } from "react";
import { useLocalEngine } from "./useLocalEngine";
import {
  detectCapability,
  recommendedTier,
  defaultModelId,
  resolveModelId,
  CATALOG,
  type Capability,
} from "./lib";
import "./App.css";

export default function App(): React.JSX.Element {
  const [cap, setCap] = useState<Capability | null>(null);
  const [modelId, setModelId] = useState<string>(defaultModelId(1));
  const [prompt, setPrompt] = useState<string>(
    "In two sentences, explain why running an LLM in the browser is good for privacy.",
  );
  const { state, load, generate } = useLocalEngine();

  useEffect(() => {
    void detectCapability().then((c) => {
      setCap(c);
      setModelId(defaultModelId(recommendedTier(c)));
    });
  }, []);

  const gpuStatus = useMemo(() => {
    if (cap === null) return "checking";
    return cap.adapter ? "available" : "unavailable";
  }, [cap]);

  const busy = state.status === "loading" || state.status === "generating";

  return (
    <main className="app">
      <header>
        <h1>local-ai-kit</h1>
        <p className="tag">Phase 1 · 100% in-browser inference</p>
        <span className={`badge badge--${gpuStatus}`}>
          WebGPU: {gpuStatus === "checking" ? "…" : gpuStatus}
        </span>
      </header>

      {gpuStatus === "unavailable" && (
        <div className="panel panel--warn">
          WebGPU is not available in this browser. Use Chrome/Edge 113+, Safari
          26+, or Firefox 141+ (Windows). This is the fallback case the real app
          must handle.
        </div>
      )}

      <section className="row">
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          disabled={busy}
        >
          {CATALOG.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · {m.params} · ~{Math.round(m.vramMb)}MB
              {m.tier === 2 ? " · large" : ""}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            void load(resolveModelId(modelId, cap?.shaderF16 ?? false))
          }
          disabled={busy || gpuStatus !== "available"}
        >
          {state.status === "loading" ? "Loading…" : "Load model"}
        </button>
      </section>

      {state.status === "loading" && (
        <div className="bar">
          <div
            className="bar__fill"
            style={{ width: `${Math.round(state.progressPct * 100)}%` }}
          />
        </div>
      )}
      {state.progress && <p className="progress">{state.progress}</p>}

      {state.status === "error" && (
        <div className="panel panel--warn">Error: {state.error}</div>
      )}

      <section className="row">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          disabled={busy}
        />
        <button
          onClick={() => void generate(prompt)}
          disabled={state.status !== "ready" || !prompt.trim()}
        >
          {state.status === "generating" ? "Generating…" : "Send"}
        </button>
      </section>

      {state.output && (
        <article className="output">
          <p>{state.output}</p>
        </article>
      )}

      {state.stats && (
        <footer className="stats">
          prefill {state.stats.prefillTokPerSec.toFixed(1)} tok/s · decode{" "}
          {state.stats.decodeTokPerSec.toFixed(1)} tok/s
        </footer>
      )}
    </main>
  );
}
