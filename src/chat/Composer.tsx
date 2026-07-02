import { useRef, useState } from "react";
import { cn } from "../lib";
import { btn, btnPrimary } from "../ui/styles";

type Props = {
  disabled: boolean;
  generating: boolean;
  allowImage: boolean;
  onSend: (text: string, image?: string) => void;
  onStop: () => void;
};

export function Composer({
  disabled,
  generating,
  allowImage,
  onSend,
  onStop,
}: Props): React.JSX.Element {
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (): void => {
    if (disabled || !text.trim()) return;
    onSend(text, image ?? undefined);
    setText("");
    setImage(null);
  };

  const pickImage = (file: File): void => {
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-hairline-strong bg-surface-2 p-1.5 transition focus-within:border-accent focus-within:ring-accent-soft">
      {image && (
        <div className="relative w-fit px-1 pt-1">
          <img src={image} alt="attachment" className="h-16 rounded-lg" />
          <button
            onClick={() => setImage(null)}
            aria-label="Remove image"
            className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-surface text-xs shadow"
          >
            ×
          </button>
        </div>
      )}
      <div className="flex items-stretch gap-2">
        {allowImage && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) pickImage(file);
                e.target.value = "";
              }}
            />
            <button
              className={cn(btn, "self-end px-3")}
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              aria-label="Attach image"
            >
              📎
            </button>
          </>
        )}
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
        {generating ? (
          <button className={cn(btn, "self-end px-5")} onClick={onStop}>
            Stop
          </button>
        ) : (
          <button
            className={cn(btnPrimary, "self-end px-5")}
            onClick={submit}
            disabled={disabled || !text.trim()}
          >
            Send
          </button>
        )}
      </div>
    </div>
  );
}
