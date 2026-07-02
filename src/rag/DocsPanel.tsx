import { useRef } from "react";
import { cn } from "../lib";
import { btn, sectionLabel } from "../ui/styles";
import type { DocSource, EmbedderStatus } from "./useRag";

type Props = {
  status: EmbedderStatus;
  progress: string;
  indexing: boolean;
  sources: DocSource[];
  onEnable: () => void;
  onAddDoc: (file: File) => void;
  onRemoveDoc: (source: string) => void;
};

export function DocsPanel({
  status,
  progress,
  indexing,
  sources,
  onEnable,
  onAddDoc,
  onRemoveDoc,
}: Props): React.JSX.Element {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-2 border-t border-hairline pt-2.5">
      <span className={sectionLabel}>Documents · private</span>

      {status !== "ready" ? (
        <button
          className={cn(btn, "border-dashed text-left text-[0.82rem]")}
          onClick={onEnable}
          disabled={status === "loading"}
        >
          {status === "loading" ? "Loading embedder…" : "Enable document search"}
        </button>
      ) : (
        <>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,.markdown,.pdf"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onAddDoc(file);
              e.target.value = "";
            }}
          />
          <button
            className={cn(btn, "border-dashed text-left text-[0.82rem]")}
            onClick={() => fileRef.current?.click()}
            disabled={indexing}
          >
            {indexing ? "Indexing…" : "+ Add document (.txt, .md, .pdf)"}
          </button>
        </>
      )}

      {status === "loading" && progress && (
        <p className="text-[0.82rem] text-muted">{progress}</p>
      )}
      {status === "error" && (
        <p className="text-[0.82rem] text-danger">Embedder failed to load.</p>
      )}

      <ul className="flex flex-col gap-0.5">
        {sources.map((s) => (
          <li
            key={s.source}
            className="flex items-center gap-1.5 rounded-md bg-surface-2 px-1.5 py-1 text-sm"
          >
            <span className="flex-1 truncate">{s.source}</span>
            <span className="text-xs tabular-nums text-faint">{s.count}</span>
            <button
              aria-label={`Remove ${s.source}`}
              className="text-faint transition hover:text-danger"
              onClick={() => onRemoveDoc(s.source)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
