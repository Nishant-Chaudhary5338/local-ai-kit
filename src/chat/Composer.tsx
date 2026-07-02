import { useState } from "react";
import { cn } from "../lib";
import { btnPrimary } from "../ui/styles";

type Props = {
  disabled: boolean;
  generating: boolean;
  onSend: (text: string) => void;
};

export function Composer({
  disabled,
  generating,
  onSend,
}: Props): React.JSX.Element {
  const [text, setText] = useState("");

  const submit = (): void => {
    if (disabled || !text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="flex items-stretch gap-2 rounded-xl border border-hairline-strong bg-surface-2 p-1.5 transition focus-within:border-accent focus-within:ring-accent-soft">
      <textarea
        data-testid="composer-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={disabled ? "Load a model first…" : "Message (Enter to send)…"}
        rows={2}
        disabled={disabled}
        className="flex-1 resize-none border-none bg-transparent px-2.5 py-2 outline-none placeholder:text-faint"
      />
      <button
        className={cn(btnPrimary, "self-end px-5")}
        onClick={submit}
        disabled={disabled || !text.trim()}
      >
        {generating ? "…" : "Send"}
      </button>
    </div>
  );
}
