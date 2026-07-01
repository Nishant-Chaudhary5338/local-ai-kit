import type { Tier } from "./capability";

// Curated catalog (values from WebLLM's prebuiltAppConfig, v0.2.84). Kept static
// so the initial bundle carries no WebLLM code — the engine is code-split and
// only pulled in on load(). `fallbackId` is the q4f32 variant used when the
// adapter lacks shader-f16. `loadLiveCatalog()` reconciles against the live
// config at runtime for anyone who wants the full, current list.
export type CatalogModel = {
  id: string;
  label: string;
  params: string;
  vramMb: number;
  tier: Tier;
  fallbackId: string | null;
};

export const CATALOG: readonly CatalogModel[] = [
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", label: "Qwen2.5 0.5B", params: "0.5B", vramMb: 945, tier: 0, fallbackId: null },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B", params: "1B", vramMb: 879, tier: 0, fallbackId: "Llama-3.2-1B-Instruct-q4f32_1-MLC" },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B", params: "3B", vramMb: 2264, tier: 1, fallbackId: null },
  { id: "Qwen2.5-3B-Instruct-q4f16_1-MLC", label: "Qwen2.5 3B", params: "3B", vramMb: 2505, tier: 1, fallbackId: null },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC-1k", label: "Phi-3.5 mini", params: "3.8B", vramMb: 2520, tier: 1, fallbackId: null },
  { id: "Llama-3.1-8B-Instruct-q4f16_1-MLC", label: "Llama 3.1 8B", params: "8B", vramMb: 5001, tier: 2, fallbackId: "Llama-3.1-8B-Instruct-q4f32_1-MLC" },
  { id: "Qwen2.5-7B-Instruct-q4f16_1-MLC", label: "Qwen2.5 7B", params: "7B", vramMb: 5107, tier: 2, fallbackId: null },
];

// Verified fast/quality balance on an M1 base: 1B ~42 tok/s, 3B usable.
const TIER_DEFAULTS: Record<Tier, string> = {
  0: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
  1: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
  2: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
};

export function defaultModelId(tier: Tier): string {
  return TIER_DEFAULTS[tier];
}

// Small embedding model for local RAG (~239MB), loaded alongside the chat model.
export const EMBED_MODEL_ID = "snowflake-arctic-embed-s-q0f32-MLC-b4";

export function resolveModelId(id: string, shaderF16: boolean): string {
  if (shaderF16) return id;
  return CATALOG.find((m) => m.id === id)?.fallbackId ?? id;
}

export async function loadLiveCatalog(): Promise<string[]> {
  const { prebuiltAppConfig } = await import("@mlc-ai/web-llm");
  return prebuiltAppConfig.model_list.map((m) => m.model_id);
}
