import { describe, it, expect } from "vitest";
import { splitThinking } from "./thinking";

describe("splitThinking", () => {
  it("returns the whole content as the answer when there is no think block", () => {
    expect(splitThinking("just an answer")).toEqual({
      thinking: null,
      answer: "just an answer",
    });
  });

  it("separates a completed think block from the answer", () => {
    const { thinking, answer } = splitThinking(
      "<think>weigh options</think>Final answer.",
    );
    expect(thinking).toBe("weigh options");
    expect(answer).toBe("Final answer.");
  });

  it("treats an unclosed think block as still-streaming thought", () => {
    const { thinking, answer } = splitThinking("<think>still reasoning");
    expect(thinking).toBe("still reasoning");
    expect(answer).toBe("");
  });
});
