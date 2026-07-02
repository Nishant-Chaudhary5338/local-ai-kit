import { describe, it, expect } from "vitest";
import { chunkText } from "./chunk";

describe("chunkText", () => {
  it("returns a single chunk for short text", () => {
    expect(chunkText("hello world")).toEqual(["hello world"]);
  });

  it("returns nothing for empty/whitespace input", () => {
    expect(chunkText("   \n  ")).toEqual([]);
  });

  it("keeps every chunk within the character cap", () => {
    const long = Array.from({ length: 50 }, (_, i) => `para ${i} `.repeat(20)).join(
      "\n\n",
    );
    const chunks = chunkText(long);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(800);
  });

  it("splits a single oversized paragraph", () => {
    const chunks = chunkText("x".repeat(2000));
    expect(chunks.length).toBeGreaterThan(1);
  });
});
