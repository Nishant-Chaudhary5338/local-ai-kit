import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommandPalette, type Command } from "./CommandPalette";

function setup(overrides: Partial<Parameters<typeof CommandPalette>[0]> = {}) {
  const run = vi.fn();
  const onClose = vi.fn();
  const commands: Command[] = [
    { id: "new", label: "New chat", run },
    { id: "journal", label: "Go to Journal", run },
  ];
  render(
    <CommandPalette open commands={commands} onClose={onClose} {...overrides} />,
  );
  return { run, onClose };
}

describe("CommandPalette", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <CommandPalette open={false} commands={[]} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("filters commands by query", async () => {
    setup();
    await userEvent.type(screen.getByPlaceholderText("Type a command…"), "journal");
    expect(screen.getByText("Go to Journal")).toBeInTheDocument();
    expect(screen.queryByText("New chat")).not.toBeInTheDocument();
  });

  it("runs the highlighted command on Enter and closes", async () => {
    const { run, onClose } = setup();
    await userEvent.type(screen.getByPlaceholderText("Type a command…"), "new{Enter}");
    expect(run).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
  });
});
