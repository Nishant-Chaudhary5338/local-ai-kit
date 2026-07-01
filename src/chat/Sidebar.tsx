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
    <aside className="sidebar">
      <div className="sidebar__head">
        <strong>local-ai-kit</strong>
        <button className="btn-new" onClick={onNew}>
          + New
        </button>
      </div>
      <nav className="sidebar__list">
        {conversations.map((c) => (
          <div
            key={c.id}
            className={`conv ${c.id === activeId ? "conv--active" : ""}`}
          >
            <button className="conv__title" onClick={() => onSelect(c.id)}>
              {c.title}
            </button>
            <button
              className="conv__del"
              aria-label={`Delete ${c.title}`}
              onClick={() => onRemove(c.id)}
            >
              ×
            </button>
          </div>
        ))}
      </nav>
      {children}
      <p className="sidebar__foot">🔒 Nothing leaves your device</p>
    </aside>
  );
}
