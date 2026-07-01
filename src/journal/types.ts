export type JournalEntry = {
  id: string;
  title: string;
  text: string;
  createdAt: number;
  updatedAt: number;
};

export function newEntry(): JournalEntry {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "Untitled entry",
    text: "",
    createdAt: now,
    updatedAt: now,
  };
}

// Vector-store source key for a journal entry, kept namespaced so it can be
// filtered out of the document list while still joining the shared corpus.
export function entrySource(id: string): string {
  return `journal/${id}`;
}
