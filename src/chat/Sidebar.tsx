import { cn } from "../lib";
import { btn } from "../ui/styles";
import type { Conversation } from "./types";

type Props = {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRemove: (id: string) => void;
  children?: React.ReactNode;
};

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onRemove,
  children,
}: Props): React.JSX.Element {
  return (
    <aside className="flex min-h-0 flex-col gap-2.5 border-r border-hairline bg-surface p-3.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[0.98rem] font-bold tracking-tight">
          <span className="grid size-7 place-items-center rounded-lg bg-linear-to-b from-accent to-accent-strong text-white glow-accent">
            <LockIcon size={14} />
          </span>
          local-ai-kit
        </span>
        <button className={cn(btn, "px-2.5 py-1.5 text-[0.82rem]")} onClick={onNew}>
          + New
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
        {conversations.map((c) => {
          const active = c.id === activeId;
          return (
            <div
              key={c.id}
              data-testid="conversation"
              className={cn(
                "group relative flex items-center rounded-lg transition",
                active ? "bg-surface-2" : "hover:bg-surface-2",
              )}
            >
              {active && (
                <span className="absolute inset-y-[20%] left-0 w-[3px] rounded-full bg-accent" />
              )}
              <button
                className="flex-1 truncate px-2.5 py-2 text-left text-sm"
                onClick={() => onSelect(c.id)}
              >
                {c.title}
              </button>
              <button
                aria-label={`Delete ${c.title}`}
                className="px-2 text-faint opacity-0 transition hover:text-danger group-hover:opacity-100"
                onClick={() => onRemove(c.id)}
              >
                ×
              </button>
            </div>
          );
        })}
      </nav>

      {children}

      <p className="flex items-center gap-1.5 text-xs text-faint">
        🔒 Nothing leaves your device
      </p>
    </aside>
  );
}

function LockIcon({ size }: { size: number }): React.JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6 10V8a6 6 0 1 1 12 0v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="4.5" y="10" width="15" height="10" rx="2.5" fill="currentColor" />
    </svg>
  );
}
