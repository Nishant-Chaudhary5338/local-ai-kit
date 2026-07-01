import { openDB, type DBSchema, type IDBPDatabase } from "idb";

// Local vector store. Chunks + embeddings live in IndexedDB — the corpus never
// leaves the device. Cosine search runs in JS (fine for personal-scale corpora;
// swap for an HNSW index if it ever grows past a few thousand chunks).

export type Chunk = {
  id: string;
  source: string;
  text: string;
  embedding: number[];
  createdAt: number;
};

export type SearchHit = { chunk: Chunk; score: number };

interface VectorDB extends DBSchema {
  chunks: {
    key: string;
    value: Chunk;
    indexes: { "by-source": string };
  };
}

let dbPromise: Promise<IDBPDatabase<VectorDB>> | null = null;

function db(): Promise<IDBPDatabase<VectorDB>> {
  dbPromise ??= openDB<VectorDB>("local-ai-kit-vectors", 1, {
    upgrade(database) {
      const store = database.createObjectStore("chunks", { keyPath: "id" });
      store.createIndex("by-source", "source");
    },
  });
  return dbPromise;
}

export async function addChunks(chunks: Chunk[]): Promise<void> {
  const tx = (await db()).transaction("chunks", "readwrite");
  await Promise.all(chunks.map((c) => tx.store.put(c)));
  await tx.done;
}

export async function allChunks(): Promise<Chunk[]> {
  return (await db()).getAll("chunks");
}

export async function deleteBySource(source: string): Promise<void> {
  const tx = (await db()).transaction("chunks", "readwrite");
  const keys = await tx.store.index("by-source").getAllKeys(source);
  await Promise.all(keys.map((k) => tx.store.delete(k)));
  await tx.done;
}

export async function listSources(): Promise<
  { source: string; count: number }[]
> {
  const counts = new Map<string, number>();
  for (const c of await allChunks()) {
    counts.set(c.source, (counts.get(c.source) ?? 0) + 1);
  }
  return [...counts.entries()].map(([source, count]) => ({ source, count }));
}

export function search(query: number[], chunks: Chunk[], k = 4): SearchHit[] {
  return chunks
    .map((chunk) => ({ chunk, score: cosine(query, chunk.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
