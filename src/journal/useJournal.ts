import { useCallback, useEffect, useRef, useState } from "react";
import { listEntries, saveEntry, deleteEntry } from "./db";
import { newEntry, entrySource, type JournalEntry } from "./types";

type IndexFn = (source: string, text: string) => Promise<void>;
type RemoveFn = (source: string) => Promise<void>;

const EMBED_DEBOUNCE_MS = 1500;

export function useJournal(
  indexSource: IndexFn,
  removeSource: RemoveFn,
  embedderReady: boolean,
) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const embedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void listEntries().then(setEntries);
  }, []);

  const active = entries.find((e) => e.id === activeId) ?? null;

  const create = useCallback(async (): Promise<void> => {
    const entry = newEntry();
    await saveEntry(entry);
    setEntries((es) => [entry, ...es]);
    setActiveId(entry.id);
  }, []);

  const select = useCallback((id: string): void => setActiveId(id), []);

  const update = useCallback(
    (id: string, patch: Partial<Pick<JournalEntry, "title" | "text">>): void => {
      setEntries((es) => {
        const next = es
          .map((e) => (e.id === id ? { ...e, ...patch, updatedAt: Date.now() } : e))
          .sort((a, b) => b.updatedAt - a.updatedAt);
        const updated = next.find((e) => e.id === id);
        if (updated) {
          void saveEntry(updated);
          if (embedTimer.current) clearTimeout(embedTimer.current);
          if (embedderReady && updated.text.trim()) {
            embedTimer.current = setTimeout(() => {
              void indexSource(
                entrySource(id),
                `${updated.title}\n\n${updated.text}`,
              );
            }, EMBED_DEBOUNCE_MS);
          }
        }
        return next;
      });
    },
    [embedderReady, indexSource],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await deleteEntry(id);
      await removeSource(entrySource(id));
      setEntries((es) => {
        const next = es.filter((e) => e.id !== id);
        setActiveId((prev) => (prev === id ? (next[0]?.id ?? null) : prev));
        return next;
      });
    },
    [removeSource],
  );

  return { entries, active, activeId, create, select, update, remove };
}
