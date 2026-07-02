import { useEffect, useState } from "react";
import { cn } from "../lib";

export type Command = {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
};

type Props = {
  open: boolean;
  commands: Command[];
  onClose: () => void;
};

export function CommandPalette({
  open,
  commands,
  onClose,
}: Props): React.JSX.Element | null {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );

  useEffect(() => {
    setQuery("");
    setIndex(0);
  }, [open]);

  useEffect(() => setIndex(0), [query]);

  if (!open) return null;

  const run = (command: Command | undefined): void => {
    if (!command) return;
    onClose();
    command.run();
  };

  const onKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(filtered[index]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[15vh]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-hairline bg-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a command…"
          aria-label="Search commands"
          className="w-full border-b border-hairline bg-transparent px-4 py-3 outline-none placeholder:text-faint"
        />
        <ul className="max-h-72 overflow-y-auto p-1.5">
          {filtered.map((c, i) => (
            <li key={c.id}>
              <button
                onMouseEnter={() => setIndex(i)}
                onClick={() => run(c)}
                className={cn(
                  "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm",
                  i === index ? "bg-surface-2" : "hover:bg-surface-2",
                )}
              >
                <span>{c.label}</span>
                {c.hint && <span className="text-xs text-faint">{c.hint}</span>}
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-2 text-sm text-faint">No commands</li>
          )}
        </ul>
      </div>
    </div>
  );
}
