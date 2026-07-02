import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib";
import { splitThinking } from "./thinking";
import type { Message } from "./types";

type Props = { message: Message };

const bubbleProse =
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-hairline [&_pre]:bg-surface-2 [&_pre]:p-3 [&_code]:font-mono [&_code]:text-[0.88em]";

export function MessageView({ message }: Props): React.JSX.Element {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const { thinking, answer } = isUser
    ? { thinking: null, answer: message.content }
    : splitThinking(message.content);

  const copy = (): void => {
    void navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      className={cn(
        "group max-w-[82%] animate-rise",
        isUser ? "self-end" : "self-start",
      )}
    >
      <div
        className={cn(
          "mb-1.5 flex items-center gap-2 text-[0.68rem] uppercase tracking-wide text-faint",
          isUser && "flex-row-reverse",
        )}
      >
        {isUser ? "You" : "Local model"}
        {!isUser && message.content && (
          <button
            onClick={copy}
            className="normal-case opacity-0 transition hover:text-fg group-hover:opacity-100"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        )}
      </div>

      {thinking && (
        <details className="mb-1.5 rounded-xl border border-hairline bg-surface-2 px-3 py-2 text-[0.82rem] text-muted">
          <summary className="cursor-pointer select-none text-faint">
            {answer ? "Thought process" : "Thinking…"}
          </summary>
          <div className="mt-1.5 whitespace-pre-wrap">{thinking}</div>
        </details>
      )}

      <div
        data-testid={isUser ? "msg-user" : "msg-assistant"}
        className={cn(
          "inline-block rounded-2xl px-3.5 py-2.5 text-left",
          bubbleProse,
          isUser
            ? "bg-linear-to-b from-accent to-accent-strong text-white"
            : "border border-hairline bg-surface shadow-sm",
        )}
      >
        {message.image && (
          <img
            src={message.image}
            alt="attachment"
            className="mb-2 max-h-48 rounded-lg"
          />
        )}
        {answer ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
        ) : thinking ? (
          <span className="text-faint">Reasoning…</span>
        ) : (
          <span className="animate-blink text-accent">▍</span>
        )}
      </div>

      {message.citations && message.citations.length > 0 && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.68rem] uppercase tracking-wide text-faint">
            Sources
          </span>
          {message.citations.map((c) => (
            <span
              key={c}
              className="rounded-full border border-hairline bg-surface-2 px-2 py-0.5 text-[0.72rem] text-muted"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
