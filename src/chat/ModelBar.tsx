import { cn } from "../lib";
import { btn, btnPrimary, field } from "../ui/styles";
import { CATALOG, type Capability } from "../lib";
import type { ModelState } from "./useChat";

type GpuStatus = "checking" | "available" | "unavailable";

type Props = {
  cap: Capability | null;
  gpuStatus: GpuStatus;
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
  const ready = model.status === "ready";

  return (
    <div className="flex flex-col gap-2.5 border-b border-hairline px-4 py-3">
      <div className="flex items-center gap-2">
        <GpuBadge status={gpuStatus} />
        <select
          className={cn(field, "flex-1 cursor-pointer")}
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
          className={ready ? btn : btnPrimary}
          onClick={() => onLoad(modelId)}
          disabled={loading || gpuStatus !== "available"}
        >
          {ready ? "Reload" : loading ? "Loading…" : "Load model"}
        </button>
      </div>

      {loading && (
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-linear-to-r from-accent to-accent-strong transition-[width] duration-300"
            style={{ width: `${Math.round(model.progressPct * 100)}%` }}
          />
        </div>
      )}
      {model.progress && (
        <p className="text-[0.82rem] tabular-nums text-muted">{model.progress}</p>
      )}
      {model.status === "error" && (
        <Warn>Error: {model.error}</Warn>
      )}
      {gpuStatus === "unavailable" && (
        <Warn>
          WebGPU unavailable. Use Chrome/Edge 113+, Safari 26+, or Firefox 141+
          (Windows).
        </Warn>
      )}
    </div>
  );
}

function GpuBadge({ status }: { status: GpuStatus }): React.JSX.Element {
  const label = status === "checking" ? "…" : status;
  return (
    <span
      data-testid="gpu-badge"
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium",
        status === "available" && "border-transparent bg-accent-soft text-accent-strong",
        status === "unavailable" && "border-hairline-strong bg-surface-2 text-danger",
        status === "checking" && "border-hairline-strong bg-surface-2 text-muted",
      )}
    >
      <span
        className={cn(
          "size-[7px] rounded-full",
          status === "available" && "bg-accent ring-accent-soft",
          status === "unavailable" && "bg-danger",
          status === "checking" && "bg-faint",
        )}
      />
      WebGPU: {label}
    </span>
  );
}

function Warn({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="rounded-lg border border-warn/40 bg-warn-soft px-3.5 py-2.5 text-[0.88rem] text-warn">
      {children}
    </div>
  );
}
