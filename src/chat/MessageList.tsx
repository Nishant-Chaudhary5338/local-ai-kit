import { useEffect, useRef } from "react";
import { MessageView } from "./MessageView";
import type { Message } from "./types";

type Props = { messages: Message[]; modelReady: boolean };

export function MessageList({ messages, modelReady }: Props): React.JSX.Element {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="messages messages--empty">
        <p>
          {modelReady
            ? "Ask anything. It runs entirely on your device."
            : "Load a model to start a fully-private conversation."}
        </p>
      </div>
    );
  }

  return (
    <div className="messages">
      {messages.map((m) => (
        <MessageView key={m.id} message={m} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
