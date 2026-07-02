import { describe, it, expect } from "vitest";
import { search, type Chunk } from "./vectorStore";

function chunk(id: string, embedding: number[]): Chunk {
  return { id, source: id, text: id, embedding, createdAt: 0 };
}

describe("search", () => {
  const chunks = [
    chunk("a", [1, 0]),
    chunk("b", [0, 1]),
    chunk("c", [0.9, 0.1]),
  ];

  it("ranks the most cosine-similar chunk first", () => {
    const hits = search([1, 0], chunks, 3);
    expect(hits[0].chunk.id).toBe("a");
    expect(hits[1].chunk.id).toBe("c");
  });

  it("respects the k limit", () => {
    expect(search([1, 0], chunks, 1)).toHaveLength(1);
  });

  it("returns descending scores", () => {
    const hits = search([1, 0], chunks, 3);
    expect(hits[0].score).toBeGreaterThanOrEqual(hits[1].score);
    expect(hits[1].score).toBeGreaterThanOrEqual(hits[2].score);
  });
});
