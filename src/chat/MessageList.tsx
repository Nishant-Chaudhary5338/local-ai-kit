import { useEffect, useRef } from "react";
import { MessageView } from "./MessageView";
import type { Message } from "./types";

type Props = { messages: Message[]; modelReady: boolean };

const CHIPS = ["On-device", "Zero-server", "Works offline"] as const;

export function MessageList({ messages, modelReady }: Props): React.JSX.Element {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6">
        <div className="flex max-w-[30rem] flex-col items-center gap-1.5 text-center">
          <span className="mb-1 grid size-14 place-items-center rounded-2xl bg-linear-to-b from-accent to-accent-strong text-white glow-accent">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 10V8a6 6 0 1 1 12 0v2"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x="4.5"
                y="10"
                width="15"
                height="10"
                rx="2.5"
                fill="currentColor"
              />
            </svg>
          </span>
          <h2 className="text-[1.4rem] font-bold tracking-tight">
            {modelReady ? "Ask anything — privately" : "Private AI, in your browser"}
          </h2>
          <p className="text-[0.95rem] leading-relaxed text-muted">
            {modelReady
              ? "Your messages never leave this device. Add documents or journal entries and ask across them."
              : "Load a model to start. Inference runs 100% on your device — no server, no API key, nothing sent anywhere."}
          </p>
          <div className="mt-3.5 flex flex-wrap justify-center gap-2">
            {CHIPS.map((c) => (
              <span
                key={c}
                className="rounded-full border border-hairline bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[1.1rem] overflow-y-auto p-6">
      {messages.map((m) => (
        <MessageView key={m.id} message={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
