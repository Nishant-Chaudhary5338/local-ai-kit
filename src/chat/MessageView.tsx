import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "./types";

type Props = { message: Message };

export function MessageView({ message }: Props): React.JSX.Element {
  const isUser = message.role === "user";
  return (
    <div className={`msg msg--${message.role}`}>
      <div className="msg__role">{isUser ? "You" : "Local model"}</div>
      <div className="msg__body md">
        {message.content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        ) : (
          <span className="msg__cursor">▍</span>
        )}
      </div>
    </div>
  );
}
