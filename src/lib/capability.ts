// WebGPU capability detection. `navigator.gpu` can exist while yielding no
// usable adapter (e.g. under automation), so presence alone is never trusted —
// a real adapter is requested. shader-f16 support decides q4f16 vs q4f32.

export type Capability = {
  webgpu: boolean;
  adapter: boolean;
  shaderF16: boolean;
  deviceMemoryGb: number | null;
};

export type Tier = 0 | 1 | 2;

export async function detectCapability(): Promise<Capability> {
  const base: Capability = {
    webgpu: false,
    adapter: false,
    shaderF16: false,
    deviceMemoryGb: readDeviceMemory(),
  };
  if (!("gpu" in navigator) || !navigator.gpu) return base;
  base.webgpu = true;
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return base;
    base.adapter = true;
    base.shaderF16 = adapter.features.has("shader-f16");
  } catch {
    return base;
  }
  return base;
}

// Tier 2 (large models) is never auto-selected — it is always an explicit
// opt-in — so this only distinguishes "can't run" (0) from "run a mid model" (1).
export function recommendedTier(cap: Capability): Tier {
  if (!cap.adapter) return 0;
  if (cap.deviceMemoryGb !== null && cap.deviceMemoryGb < 8) return 0;
  return 1;
}

function readDeviceMemory(): number | null {
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  return typeof mem === "number" ? mem : null;
}
