import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy class values", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values", () => {
    const off = false;
    expect(cn("a", off && "b", null, undefined, "c")).toBe("a c");
  });

  it("de-conflicts competing Tailwind utilities (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-muted", "text-fg")).toBe("text-fg");
  });
});
