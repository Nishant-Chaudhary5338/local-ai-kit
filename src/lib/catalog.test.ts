import { describe, it, expect } from "vitest";
import { CATALOG, modelById, defaultModelId, resolveModelId } from "./catalog";

describe("catalog", () => {
  it("has unique model ids", () => {
    const ids = CATALOG.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("modelById finds an entry and returns undefined otherwise", () => {
    expect(modelById(CATALOG[0].id)?.id).toBe(CATALOG[0].id);
    expect(modelById("nope")).toBeUndefined();
  });

  it("defaultModelId maps tiers to real catalog entries", () => {
    for (const tier of [0, 1, 2] as const) {
      expect(modelById(defaultModelId(tier))).toBeDefined();
    }
  });

  it("resolveModelId keeps the q4f16 id when shader-f16 is available", () => {
    const withFallback = CATALOG.find((m) => m.fallbackId);
    expect(withFallback).toBeDefined();
    expect(resolveModelId(withFallback!.id, true)).toBe(withFallback!.id);
  });

  it("resolveModelId swaps to the q4f32 fallback without shader-f16", () => {
    const withFallback = CATALOG.find((m) => m.fallbackId)!;
    expect(resolveModelId(withFallback.id, false)).toBe(withFallback.fallbackId);
  });

  it("resolveModelId returns the id unchanged when no fallback exists", () => {
    const noFallback = CATALOG.find((m) => !m.fallbackId)!;
    expect(resolveModelId(noFallback.id, false)).toBe(noFallback.id);
  });
});
