import { useRef } from "react";
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
    <div className="docs">
      <div className="docs__head">Documents · private</div>

      {status !== "ready" ? (
        <button
          className="docs__enable"
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
            className="docs__enable"
            onClick={() => fileRef.current?.click()}
            disabled={indexing}
          >
            {indexing ? "Indexing…" : "+ Add document (.txt, .md, .pdf)"}
          </button>
        </>
      )}

      {status === "loading" && progress && (
        <p className="progress">{progress}</p>
      )}
      {status === "error" && (
        <p className="progress">Embedder failed to load.</p>
      )}

      <ul className="docs__list">
        {sources.map((s) => (
          <li key={s.source}>
            <span className="docs__name">{s.source}</span>
            <span className="docs__count">{s.count}</span>
            <button
              className="conv__del"
              aria-label={`Remove ${s.source}`}
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
