import { CATALOG, type Capability } from "../lib";
import type { ModelState } from "./useChat";

type Props = {
  cap: Capability | null;
  gpuStatus: "checking" | "available" | "unavailable";
  modelId: string;
  onModelId: (id: string) => void;
  model: ModelState;
  onLoad: (id: string) => void;
};

export function ModelBar({
  gpuStatus,
  modelId,
  onModelId,
  model,
  onLoad,
}: Props): React.JSX.Element {
  const loading = model.status === "loading";
  return (
    <div className="modelbar">
      <div className="modelbar__row">
        <span className={`badge badge--${gpuStatus}`}>
          WebGPU: {gpuStatus === "checking" ? "…" : gpuStatus}
        </span>
        <select
          value={modelId}
          onChange={(e) => onModelId(e.target.value)}
          disabled={loading}
        >
          {CATALOG.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} · {m.params} · ~{Math.round(m.vramMb)}MB
              {m.tier === 2 ? " · large" : ""}
            </option>
          ))}
        </select>
        <button
          onClick={() => onLoad(modelId)}
          disabled={loading || gpuStatus !== "available"}
        >
          {model.status === "ready"
            ? "Reload"
            : loading
              ? "Loading…"
              : "Load model"}
        </button>
      </div>

      {loading && (
        <div className="bar">
          <div
            className="bar__fill"
            style={{ width: `${Math.round(model.progressPct * 100)}%` }}
          />
        </div>
      )}
      {model.progress && <p className="progress">{model.progress}</p>}
      {model.status === "error" && (
        <div className="panel panel--warn">Error: {model.error}</div>
      )}
      {gpuStatus === "unavailable" && (
        <div className="panel panel--warn">
          WebGPU unavailable. Use Chrome/Edge 113+, Safari 26+, or Firefox 141+
          (Windows).
        </div>
      )}
    </div>
  );
}
