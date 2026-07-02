import { cn } from "../lib";
import { sectionLabel } from "../ui/styles";
import { useNetMonitor } from "./useNetMonitor";
import { DataControls } from "../data/DataControls";
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
    <aside
      data-testid="trust-panel"
      className="flex flex-col gap-[1.15rem] overflow-y-auto border-l border-hairline bg-surface px-4 py-3.5"
    >
      <div className="flex items-center justify-between font-semibold tracking-tight">
        Trust panel
        <button
          aria-label="Close"
          onClick={onClose}
          className="rounded-md border border-hairline-strong px-2 py-0.5 text-muted transition hover:bg-surface-hover"
        >
          ›
        </button>
      </div>

      <div className="flex items-center gap-2.5 rounded-xl border border-accent/25 bg-accent-soft px-3.5 py-2.5">
        <ShieldIcon />
        <div>
          <strong className="block text-[0.86rem]">Private by design</strong>
          <span className="text-[0.74rem] text-muted">
            Inference runs on-device · 0 bytes sent
          </span>
        </div>
      </div>

      <Section title="Live">
        <div
          className={cn(
            "mb-1 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[0.82rem]",
            generating ? "bg-accent-soft text-accent-strong" : "bg-surface-2 text-muted",
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full",
              generating ? "animate-ping-ring bg-accent" : "bg-faint",
            )}
          />
          {generating ? "Generating · 0 bytes sent" : "Idle"}
        </div>
        <Row label="Model">{modelStatus}</Row>
        {stats && (
          <>
            <Row label="Prefill">{stats.prefillTokPerSec.toFixed(1)} tok/s</Row>
            <Row label="Decode">{stats.decodeTokPerSec.toFixed(1)} tok/s</Row>
          </>
        )}
      </Section>

      <Section title="Capability">
        <Row label="WebGPU">
          <Dot on={cap?.webgpu} />
        </Row>
        <Row label="Adapter">
          <Dot on={cap?.adapter} />
        </Row>
        <Row label="shader-f16">
          <Dot on={cap?.shaderF16} />
        </Row>
        <Row label="Device memory">
          {cap?.deviceMemoryGb ? `${cap.deviceMemoryGb} GB` : "unknown"}
        </Row>
      </Section>

      <Section title="Network">
        <Row label="Requests">{entries.length}</Row>
        <Row label="Downloaded">{formatBytes(totalBytes)}</Row>
        <Row label="Non-model">{other.length === 0 ? "0 ✓" : other.length}</Row>
        <p className="my-1.5 text-[0.75rem] leading-snug text-faint">
          {entries.length === 0
            ? "No requests yet."
            : "All requests are one-time model-weight downloads. Inference sends nothing."}
        </p>
        <ul className="mt-0.5 font-mono text-[0.72rem]">
          {entries
            .slice(-6)
            .reverse()
            .map((e) => (
              <li
                key={e.id}
                className={cn(
                  "truncate border-t border-hairline py-1",
                  e.kind === "other" ? "text-danger" : "text-muted",
                )}
              >
                <span className="mr-1.5 text-faint">{e.method}</span>
                {shortUrl(e.url)}
              </li>
            ))}
        </ul>
      </Section>

      <DataControls />
    </aside>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section className="flex flex-col gap-0.5">
      <h3 className={cn(sectionLabel, "mb-1")}>{title}</h3>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm tabular-nums">
      <span className="text-muted">{label}</span>
      <span className="inline-flex items-center gap-1.5 font-medium">
        {children}
      </span>
    </div>
  );
}

function Dot({ on }: { on: boolean | undefined }): React.JSX.Element {
  return (
    <>
      <span
        className={cn(
          "size-[7px] rounded-full",
          on ? "bg-accent ring-accent-soft" : "bg-danger",
        )}
      />
      {on ? "yes" : "no"}
    </>
  );
}

function ShieldIcon(): React.JSX.Element {
  return (
    <svg
      className="shrink-0 text-accent-strong"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path
        d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
