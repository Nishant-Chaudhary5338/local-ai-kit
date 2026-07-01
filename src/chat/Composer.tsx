import { useState } from "react";

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
    <div className="composer">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder={
          disabled ? "Load a model first…" : "Message (Enter to send)…"
        }
        rows={2}
        disabled={disabled}
      />
      <button onClick={submit} disabled={disabled || !text.trim()}>
        {generating ? "…" : "Send"}
      </button>
    </div>
  );
}
