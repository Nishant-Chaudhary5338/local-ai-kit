import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Conversation } from "./types";

// Conversations persist to IndexedDB — never a server. This is the local-first
// substrate the Vault app builds on (journal entries + doc chunks land here too).

interface VaultDB extends DBSchema {
  conversations: {
    key: string;
    value: Conversation;
    indexes: { "by-updated": number };
  };
}

let dbPromise: Promise<IDBPDatabase<VaultDB>> | null = null;

function db(): Promise<IDBPDatabase<VaultDB>> {
  dbPromise ??= openDB<VaultDB>("local-ai-kit", 1, {
    upgrade(database) {
      const store = database.createObjectStore("conversations", {
        keyPath: "id",
      });
      store.createIndex("by-updated", "updatedAt");
    },
  });
  return dbPromise;
}

export async function listConversations(): Promise<Conversation[]> {
  const all = await (await db()).getAllFromIndex("conversations", "by-updated");
  return all.reverse(); // most recently updated first
}

export async function saveConversation(conv: Conversation): Promise<void> {
  await (await db()).put("conversations", conv);
}

export async function deleteConversation(id: string): Promise<void> {
  await (await db()).delete("conversations", id);
}
