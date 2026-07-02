// Manage the WebLLM weight cache (Cache API / IndexedDB). Lets the user see
// which models are downloaded and reclaim space — "your device, your control".
// WebLLM is dynamically imported so it stays out of the initial bundle.

export async function listCachedModels(ids: string[]): Promise<Set<string>> {
  const { hasModelInCache } = await import("@mlc-ai/web-llm");
  const cached = new Set<string>();
  await Promise.all(
    ids.map(async (id) => {
      try {
        if (await hasModelInCache(id)) cached.add(id);
      } catch {
        // Uncached / unknown models simply aren't added.
      }
    }),
  );
  return cached;
}

export async function deleteCachedModel(id: string): Promise<void> {
  const { deleteModelAllInfoInCache } = await import("@mlc-ai/web-llm");
  await deleteModelAllInfoInCache(id);
}
