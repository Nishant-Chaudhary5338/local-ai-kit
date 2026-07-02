import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DocsPanel } from "./DocsPanel";

const base = {
  progress: "",
  indexing: false,
  sources: [],
  onEnable: vi.fn(),
  onAddDoc: vi.fn(),
  onRemoveDoc: vi.fn(),
};

describe("DocsPanel", () => {
  it("offers to enable document search before the embedder is ready", async () => {
    const onEnable = vi.fn();
    render(<DocsPanel {...base} status="idle" onEnable={onEnable} />);
    const button = screen.getByRole("button", { name: /Enable document search/ });
    await userEvent.click(button);
    expect(onEnable).toHaveBeenCalledOnce();
  });

  it("lists indexed sources with their chunk counts once ready", () => {
    render(
      <DocsPanel
        {...base}
        status="ready"
        sources={[{ source: "notes.md", count: 3 }]}
      />,
    );
    expect(screen.getByText("notes.md")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Add document/ }),
    ).toBeInTheDocument();
  });

  it("removes a source", async () => {
    const onRemoveDoc = vi.fn();
    render(
      <DocsPanel
        {...base}
        status="ready"
        sources={[{ source: "notes.md", count: 1 }]}
        onRemoveDoc={onRemoveDoc}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Remove notes.md" }));
    expect(onRemoveDoc).toHaveBeenCalledWith("notes.md");
  });
});
