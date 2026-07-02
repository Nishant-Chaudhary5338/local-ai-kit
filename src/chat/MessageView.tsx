import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../lib";
import type { Message } from "./types";

type Props = { message: Message };

const bubbleProse =
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-hairline [&_pre]:bg-surface-2 [&_pre]:p-3 [&_code]:font-mono [&_code]:text-[0.88em]";

export function MessageView({ message }: Props): React.JSX.Element {
  const isUser = message.role === "user";
  return (
    <div className={cn("max-w-[82%] animate-rise", isUser ? "self-end" : "self-start")}>
      <div
        className={cn(
          "mb-1.5 text-[0.68rem] uppercase tracking-wide text-faint",
          isUser && "text-right",
        )}
      >
        {isUser ? "You" : "Local model"}
      </div>
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
        {message.content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        ) : (
          <span className="animate-blink text-accent">▍</span>
        )}
      </div>
    </div>
  );
}
