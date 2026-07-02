import { cn } from "../lib";
import { btn } from "../ui/styles";
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
    <div data-testid="journal-view" className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2.5">
        <button className={cn(btn, "px-2.5 py-1.5 text-[0.82rem]")} onClick={onCreate}>
          + New entry
        </button>
        <div className="flex flex-1 gap-1.5 overflow-x-auto">
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => onSelect(e.id)}
              className={cn(
                "whitespace-nowrap rounded-full border px-2.5 py-1 text-sm transition",
                e.id === activeId
                  ? "border-transparent bg-accent-soft text-fg"
                  : "border-hairline bg-surface-2 text-muted hover:text-fg",
              )}
            >
              {e.title || "Untitled"}
            </button>
          ))}
        </div>
        <button className={cn(btn, "px-2.5 py-1.5 text-[0.82rem]")} onClick={onReflect}>
          Reflect ›
        </button>
      </div>

      {active ? (
        <div className="mx-auto flex min-h-0 w-full max-w-[46rem] flex-1 flex-col gap-2.5 p-6">
          <input
            value={active.title}
            onChange={(e) => onUpdate(active.id, { title: e.target.value })}
            placeholder="Title"
            className="border-b border-hairline bg-transparent py-1.5 text-[1.3rem] font-bold tracking-tight outline-none focus:border-accent"
          />
          <textarea
            value={active.text}
            onChange={(e) => onUpdate(active.id, { text: e.target.value })}
            placeholder="Write freely — it stays on your device and is indexed for reflection."
            className="min-h-0 flex-1 resize-none bg-transparent py-1.5 text-base leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="flex items-center justify-between text-xs text-faint">
            <span>
              {embedderReady
                ? indexing
                  ? "Indexing for reflection…"
                  : "Autosaved · indexed for reflection"
                : "Autosaved · enable document search to index for reflection"}
            </span>
            <button
              className="text-faint transition hover:text-danger"
              onClick={() => onRemove(active.id)}
            >
              Delete
            </button>
          </div>
        </div>
      ) : (
        <div className="grid flex-1 place-items-center text-muted">
          <p>No entries yet. Start writing — nothing leaves your device.</p>
        </div>
      )}
    </div>
  );
}
