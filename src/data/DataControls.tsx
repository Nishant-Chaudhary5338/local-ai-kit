import { useCallback, useEffect, useState } from "react";
import { CATALOG, cn } from "../lib";
import { btn, sectionLabel } from "../ui/styles";
import {
  exportAll,
  wipeAll,
  getStorageEstimate,
  type StorageEstimate,
} from "./vault";
import { listCachedModels, deleteCachedModel } from "./modelCache";

export function DataControls(): React.JSX.Element {
  const [storage, setStorage] = useState<StorageEstimate | null>(null);
  const [cached, setCached] = useState<Set<string> | null>(null);
  const [busy, setBusy] = useState(false);

  // Storage estimate is cheap and runs on mount. Enumerating cached models
  // pulls in WebLLM, so it stays behind an explicit action to keep the initial
  // bundle from loading the engine.
  useEffect(() => {
    void getStorageEstimate().then(setStorage);
  }, []);

  const loadCached = useCallback(async (): Promise<void> => {
    setBusy(true);
    try {
      setCached(await listCachedModels(CATALOG.map((m) => m.id)));
    } finally {
      setBusy(false);
    }
  }, []);

  const remove = async (id: string): Promise<void> => {
    setBusy(true);
    try {
      await deleteCachedModel(id);
      setCached(await listCachedModels(CATALOG.map((m) => m.id)));
    } finally {
      setBusy(false);
    }
  };

  const wipe = async (): Promise<void> => {
    if (
      !window.confirm(
        "Erase all local data (chats, journal, documents)? This cannot be undone.",
      )
    )
      return;
    await wipeAll();
    window.location.reload();
  };

  const cachedModels = cached ? CATALOG.filter((m) => cached.has(m.id)) : [];
  const usedPct = storage ? Math.min(100, (storage.usage / (storage.quota || 1)) * 100) : 0;

  return (
    <section className="flex flex-col gap-2">
      <h3 className={sectionLabel}>Your data</h3>

      {storage && (
        <>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-accent"
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <p className="text-[0.72rem] text-faint">
            {formatBytes(storage.usage)} stored on this device
          </p>
        </>
      )}

      {cached === null ? (
        <button
          onClick={() => void loadCached()}
          disabled={busy}
          className={cn(btn, "py-1.5 text-[0.78rem]")}
        >
          {busy ? "Checking…" : "Manage cached models"}
        </button>
      ) : cachedModels.length === 0 ? (
        <p className="text-[0.72rem] text-faint">No models cached yet.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {cachedModels.map((m) => (
            <li key={m.id} className="flex items-center gap-1.5 text-[0.78rem]">
              <span className="flex-1 truncate">{m.label}</span>
              <span className="text-[0.7rem] text-faint">
                ~{Math.round(m.vramMb)}MB
              </span>
              <button
                disabled={busy}
                onClick={() => void remove(m.id)}
                aria-label={`Delete cached ${m.label}`}
                className="text-faint transition hover:text-danger disabled:opacity-40"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => void exportAll()}
          className={cn(btn, "flex-1 py-1.5 text-[0.78rem]")}
        >
          Export
        </button>
        <button
          onClick={() => void wipe()}
          className="flex-1 rounded-lg border border-danger/40 py-1.5 text-[0.78rem] text-danger transition hover:bg-danger/10"
        >
          Wipe all
        </button>
      </div>
    </section>
  );
}

function formatBytes(n: number): string {
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(n) / Math.log(1024));
  return `${(n / 1024 ** i).toFixed(1)} ${units[i]}`;
}
