import type { JournalEntry } from "./types";

type Props = {
  entries: JournalEntry[];
  active: JournalEntry | null;
  activeId: string | null;
  indexing: boolean;
  embedderReady: boolean;
  onCreate: () => void;
  onSelect: (id: string) => void;
  onUpdate: (id: string, patch: Partial<Pick<JournalEntry, "title" | "text">>) => void;
  onRemove: (id: string) => void;
  onReflect: () => void;
};

export function JournalView({
  entries,
  active,
  activeId,
  indexing,
  embedderReady,
  onCreate,
  onSelect,
  onUpdate,
  onRemove,
  onReflect,
}: Props): React.JSX.Element {
  return (
    <div className="journal">
      <div className="journal__bar">
        <button className="btn-new" onClick={onCreate}>
          + New entry
        </button>
        <div className="journal__tabs">
          {entries.map((e) => (
            <button
              key={e.id}
              className={`journal__tab ${e.id === activeId ? "journal__tab--active" : ""}`}
              onClick={() => onSelect(e.id)}
            >
              {e.title || "Untitled"}
            </button>
          ))}
        </div>
        <button className="btn-new" onClick={onReflect}>
          Reflect ›
        </button>
      </div>

      {active ? (
        <div className="journal__editor">
          <input
            className="journal__title"
            value={active.title}
            onChange={(e) => onUpdate(active.id, { title: e.target.value })}
            placeholder="Title"
          />
          <textarea
            className="journal__text"
            value={active.text}
            onChange={(e) => onUpdate(active.id, { text: e.target.value })}
            placeholder="Write freely — it stays on your device and is indexed for reflection."
          />
          <div className="journal__foot">
            <span>
              {embedderReady
                ? indexing
                  ? "Indexing for reflection…"
                  : "Autosaved · indexed for reflection"
                : "Autosaved · enable document search to index for reflection"}
            </span>
            <button
              className="conv__del"
              aria-label="Delete entry"
              onClick={() => onRemove(active.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="journal__empty">
          <p>No entries yet. Start writing — nothing leaves your device.</p>
        </div>
      )}
    </div>
  );
}
