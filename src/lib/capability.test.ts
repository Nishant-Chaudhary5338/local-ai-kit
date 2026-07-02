import { describe, it, expect } from "vitest";
import { detectCapability, recommendedTier, type Capability } from "./capability";

function cap(patch: Partial<Capability> = {}): Capability {
  return {
    webgpu: true,
    adapter: true,
    shaderF16: true,
    deviceMemoryGb: 8,
    ...patch,
  };
}

describe("detectCapability", () => {
  it("reports no WebGPU when navigator.gpu is absent (jsdom)", async () => {
    const result = await detectCapability();
    expect(result.webgpu).toBe(false);
    expect(result.adapter).toBe(false);
  });
});

describe("recommendedTier", () => {
  it("returns 0 when there is no usable adapter", () => {
    expect(recommendedTier(cap({ adapter: false }))).toBe(0);
  });

  it("returns 0 on low-memory devices", () => {
    expect(recommendedTier(cap({ deviceMemoryGb: 4 }))).toBe(0);
  });

  it("returns 1 on a capable device", () => {
    expect(recommendedTier(cap())).toBe(1);
  });

  it("never auto-selects tier 2", () => {
    expect(recommendedTier(cap({ deviceMemoryGb: 8 }))).not.toBe(2);
  });
});
