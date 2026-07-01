import { useCallback, useEffect, useRef, useState } from "react";
import { Embedder } from "./embedder";
import { chunkText } from "./chunk";
import {
  addChunks,
  allChunks,
  deleteBySource,
  listSources,
  search,
  type Chunk,
} from "./vectorStore";
import { readFileText } from "./readFile";
import { EMBED_MODEL_ID } from "../lib";

export type EmbedderStatus = "idle" | "loading" | "ready" | "error";
export type DocSource = { source: string; count: number };

const TOP_K = 4;
const BATCH = 16;

export function useRag() {
  const embedderRef = useRef<Embedder | null>(null);
  const [status, setStatus] = useState<EmbedderStatus>("idle");
  const [progress, setProgress] = useState("");
  const [indexing, setIndexing] = useState(false);
  const [sources, setSources] = useState<DocSource[]>([]);

  useEffect(() => {
    void listSources().then(setSources);
  }, []);

  const loadEmbedder = useCallback(async (): Promise<void> => {
    if (embedderRef.current?.ready) return;
    setStatus("loading");
    try {
      const embedder = new Embedder();
      await embedder.load(EMBED_MODEL_ID, ({ text }) => setProgress(text));
      embedderRef.current = embedder;
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  // Embed arbitrary text under a source key, replacing any prior chunks for it
  // (idempotent re-index). Shared by document upload and journal entries.
  const indexSource = useCallback(
    async (source: string, text: string): Promise<void> => {
      const embedder = embedderRef.current;
      if (!embedder?.ready) return;
      setIndexing(true);
      try {
        await deleteBySource(source);
        const pieces = chunkText(text);
        const chunks: Chunk[] = [];
        for (let i = 0; i < pieces.length; i += BATCH) {
          const slice = pieces.slice(i, i + BATCH);
          const vecs = await embedder.embed(slice);
          slice.forEach((t, j) =>
            chunks.push({
              id: crypto.randomUUID(),
              source,
              text: t,
              embedding: vecs[j],
              createdAt: Date.now(),
            }),
          );
        }
        if (chunks.length > 0) await addChunks(chunks);
        setSources(await listSources());
      } finally {
        setIndexing(false);
      }
    },
    [],
  );

  const addDocument = useCallback(
    async (file: File): Promise<void> => {
      await indexSource(file.name, await readFileText(file));
    },
    [indexSource],
  );

  const removeSource = useCallback(async (source: string): Promise<void> => {
    await deleteBySource(source);
    setSources(await listSources());
  }, []);

  const retrieve = useCallback(
    async (queryText: string): Promise<string | null> => {
      const embedder = embedderRef.current;
      if (!embedder?.ready || sources.length === 0) return null;
      const [queryVec] = await embedder.embed([queryText]);
      const hits = search(queryVec, await allChunks(), TOP_K);
      if (hits.length === 0) return null;
      return formatContext(hits.map((h) => h.chunk));
    },
    [sources.length],
  );

  return {
    status,
    progress,
    indexing,
    sources,
    docSources: sources.filter((s) => !s.source.startsWith("journal/")),
    ready: status === "ready",
    loadEmbedder,
    addDocument,
    indexSource,
    removeSource,
    retrieve,
  };
}

function formatContext(chunks: Chunk[]): string {
  const blocks = chunks
    .map((c) => `[${c.source}]\n${c.text}`)
    .join("\n\n---\n\n");
  return [
    "Answer using ONLY the private context below. Cite the source in brackets",
    "like [filename] after each claim. If the answer isn't in the context, say so.",
    "",
    "CONTEXT:",
    blocks,
  ].join("\n");
}
