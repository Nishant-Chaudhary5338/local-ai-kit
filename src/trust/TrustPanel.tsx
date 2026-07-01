import { useNetMonitor } from "./useNetMonitor";
import type { Capability } from "../lib";
import type { ChatStats, ModelStatus } from "../chat/useChat";

type Props = {
  cap: Capability | null;
  modelStatus: ModelStatus;
  generating: boolean;
  stats: ChatStats;
  onClose: () => void;
};

export function TrustPanel({
  cap,
  modelStatus,
  generating,
  stats,
  onClose,
}: Props): React.JSX.Element {
  const entries = useNetMonitor();
  const other = entries.filter((e) => e.kind === "other");
  const totalBytes = entries.reduce((sum, e) => sum + (e.bytes ?? 0), 0);

  return (
    <aside className="trust">
      <div className="trust__head">
        <strong>Trust panel</strong>
        <button className="trust__close" aria-label="Close" onClick={onClose}>
          ›
        </button>
      </div>

      <section className="trust__sec">
        <h3>Live</h3>
        <div className={`pulse ${generating ? "pulse--on" : ""}`}>
          {generating ? "Generating · 0 bytes sent" : "Idle"}
        </div>
        <Row label="Model" value={modelStatus} />
        {stats && (
          <>
            <Row
              label="Prefill"
              value={`${stats.prefillTokPerSec.toFixed(1)} tok/s`}
            />
            <Row
              label="Decode"
              value={`${stats.decodeTokPerSec.toFixed(1)} tok/s`}
            />
          </>
        )}
      </section>

      <section className="trust__sec">
        <h3>Capability</h3>
        <Row label="WebGPU" value={yesNo(cap?.webgpu)} />
        <Row label="Adapter" value={yesNo(cap?.adapter)} />
        <Row label="shader-f16" value={yesNo(cap?.shaderF16)} />
        <Row
          label="Device memory"
          value={cap?.deviceMemoryGb ? `${cap.deviceMemoryGb} GB` : "unknown"}
        />
      </section>

      <section className="trust__sec">
        <h3>Network</h3>
        <Row label="Requests" value={String(entries.length)} />
        <Row label="Downloaded" value={formatBytes(totalBytes)} />
        <Row
          label="Non-model"
          value={other.length === 0 ? "0 ✓" : String(other.length)}
        />
        <p className="trust__note">
          {entries.length === 0
            ? "No requests yet."
            : "All requests are one-time model-weight downloads. Inference sends nothing."}
        </p>
        <ul className="trust__log">
          {entries.slice(-6).reverse().map((e) => (
            <li key={e.id} className={e.kind === "other" ? "log--other" : ""}>
              <span>{e.method}</span> {shortUrl(e.url)}
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="trust__row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function yesNo(v: boolean | undefined): string {
  return v ? "yes" : "no";
}

function formatBytes(n: number): string {
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    const tail = u.pathname.split("/").filter(Boolean).pop() ?? u.hostname;
    return tail.length > 28 ? `…${tail.slice(-28)}` : tail;
  } catch {
    return url.slice(0, 28);
  }
}
