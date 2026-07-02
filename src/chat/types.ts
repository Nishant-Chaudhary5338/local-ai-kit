export type Role = "user" | "assistant";

export type Message = {
  id: string;
  role: Role;
  content: string;
  citations?: string[];
};

export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  modelId: string | null;
  createdAt: number;
  updatedAt: number;
};

export function newConversation(): Conversation {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    modelId: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function newMessage(role: Role, content: string): Message {
  return { id: crypto.randomUUID(), role, content };
}
