import { useEffect, useState } from "react";
import { useLocalEngine } from "./useLocalEngine";
import { SPIKE_MODELS, DEFAULT_MODEL_ID } from "./models";
import "./App.css";

type Gpu = "checking" | "available" | "unavailable";

export default function App(): React.JSX.Element {
  const [gpu, setGpu] = useState<Gpu>("checking");
  const [modelId, setModelId] = useState<string>(DEFAULT_MODEL_ID);
  const [prompt, setPrompt] = useState<string>(
    "In two sentences, explain why running an LLM in the browser is good for privacy.",
  );
  const { state, load, generate } = useLocalEngine();

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (!("gpu" in navigator) || !navigator.gpu) {
        if (!cancelled) setGpu("unavailable");
        return;
      }
      // navigator.gpu can exist while yielding no usable adapter (e.g. under
      // automation, or on hardware without a supported backend). Only a real
      // adapter means inference will actually work.
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!cancelled) setGpu(adapter ? "available" : "unavailable");
      } catch {
        if (!cancelled) setGpu("unavailable");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const busy = state.status === "loading" || state.status === "generating";

  return (
    <main className="app">
      <header>
        <h1>local-ai-kit</h1>
        <p className="tag">Phase 0 spike · 100% in-browser inference</p>
        <span className={`badge badge--${gpu}`}>
          WebGPU: {gpu === "checking" ? "…" : gpu}
        </span>
      </header>

      {gpu === "unavailable" && (
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
          {SPIKE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · ~{Math.round(m.vramMb)}MB · tier {m.tier}
            </option>
          ))}
        </select>
        <button
          onClick={() => void load(modelId)}
          disabled={busy || gpu !== "available"}
        >
          {state.status === "loading" ? "Loading…" : "Load model"}
        </button>
      </section>

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
