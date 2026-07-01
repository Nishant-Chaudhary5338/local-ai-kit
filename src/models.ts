// Phase 0 spike list. Real app reads this from WebLLM's live prebuiltAppConfig
// at runtime (versions drift). VRAM figures are WebLLM's declared vram_required_MB.
export type SpikeModel = {
  id: string;
  label: string;
  vramMb: number;
  tier: 0 | 1;
};

export const SPIKE_MODELS: readonly SpikeModel[] = [
  { id: "Qwen2.5-0.5B-Instruct-q4f16_1-MLC", label: "Qwen2.5 0.5B", vramMb: 945, tier: 0 },
  { id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", label: "Llama 3.2 1B", vramMb: 879, tier: 0 },
  { id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", label: "Llama 3.2 3B", vramMb: 2264, tier: 1 },
  { id: "Phi-3.5-mini-instruct-q4f16_1-MLC-1k", label: "Phi-3.5 mini (1k)", vramMb: 2520, tier: 1 },
];

export const DEFAULT_MODEL_ID = "Llama-3.2-1B-Instruct-q4f16_1-MLC";
