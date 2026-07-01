import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { JournalEntry } from "./types";

// Journal entries persist to their own IndexedDB store. Their text is also
// embedded into the shared vector store (see useJournal), so reflection queries
// retrieve them alongside documents — one local corpus, two lenses.

interface JournalDB extends DBSchema {
  entries: {
    key: string;
    value: JournalEntry;
    indexes: { "by-updated": number };
  };
}

let dbPromise: Promise<IDBPDatabase<JournalDB>> | null = null;

function db(): Promise<IDBPDatabase<JournalDB>> {
  dbPromise ??= openDB<JournalDB>("local-ai-kit-journal", 1, {
    upgrade(database) {
      const store = database.createObjectStore("entries", { keyPath: "id" });
      store.createIndex("by-updated", "updatedAt");
    },
  });
  return dbPromise;
}

export async function listEntries(): Promise<JournalEntry[]> {
  const all = await (await db()).getAllFromIndex("entries", "by-updated");
  return all.reverse();
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
  await (await db()).put("entries", entry);
}

export async function deleteEntry(id: string): Promise<void> {
  await (await db()).delete("entries", id);
}
