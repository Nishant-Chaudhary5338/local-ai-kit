import { listConversations } from "../chat/db";
import { listEntries } from "../journal/db";
import { allChunks } from "../rag/vectorStore";

// Full ownership of local data: export everything to a file, or wipe it all.
// This is the privacy promise made tangible — no server ever held any of it.

export type StorageEstimate = { usage: number; quota: number };

export async function exportAll(): Promise<void> {
  const [conversations, journal, chunks] = await Promise.all([
    listConversations(),
    listEntries(),
    allChunks(),
  ]);
  const payload = {
    app: "local-ai-kit",
    exportedAt: new Date().toISOString(),
    conversations,
    journal,
    // Drop raw embedding vectors — keep the readable text only.
    documents: chunks.map(({ source, text }) => ({ source, text })),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "local-ai-kit-export.json";
  a.click();
  URL.revokeObjectURL(url);
}

const DB_NAMES = [
  "local-ai-kit",
  "local-ai-kit-journal",
  "local-ai-kit-vectors",
];

export async function wipeAll(): Promise<void> {
  await Promise.all(DB_NAMES.map(deleteDatabase));
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
  });
}

export async function getStorageEstimate(): Promise<StorageEstimate | null> {
  if (!navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}
