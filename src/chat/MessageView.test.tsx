import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageView } from "./MessageView";
import type { Message } from "./types";

function msg(patch: Partial<Message>): Message {
  return { id: "1", role: "assistant", content: "hello", ...patch };
}

describe("MessageView", () => {
  it("renders assistant markdown as HTML", () => {
    render(<MessageView message={msg({ content: "**bold**" })} />);
    expect(screen.getByText("bold").tagName).toBe("STRONG");
    expect(screen.getByText("Local model")).toBeInTheDocument();
  });

  it("labels user messages", () => {
    render(<MessageView message={msg({ role: "user", content: "hi" })} />);
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("shows citation chips when present", () => {
    render(<MessageView message={msg({ citations: ["notes.md", "Journal entry"] })} />);
    expect(screen.getByText("Sources")).toBeInTheDocument();
    expect(screen.getByText("notes.md")).toBeInTheDocument();
    expect(screen.getByText("Journal entry")).toBeInTheDocument();
  });

  it("collapses reasoning traces into a details element", () => {
    render(<MessageView message={msg({ content: "<think>reasoning</think>Answer." })} />);
    expect(screen.getByText("reasoning")).toBeInTheDocument();
    expect(screen.getByText("Answer.")).toBeInTheDocument();
  });

  describe("copy", () => {
    beforeEach(() => {
      Object.defineProperty(navigator, "clipboard", {
        value: { writeText: vi.fn().mockResolvedValue(undefined) },
        configurable: true,
      });
    });

    it("copies the message content to the clipboard", async () => {
      render(<MessageView message={msg({ content: "copy me" })} />);
      await userEvent.click(screen.getByRole("button", { name: "Copy" }));
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("copy me");
      expect(screen.getByText("Copied ✓")).toBeInTheDocument();
    });
  });
});
