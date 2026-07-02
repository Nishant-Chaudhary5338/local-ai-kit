// Reasoning models (e.g. DeepSeek-R1) emit their chain-of-thought inside
// <think>…</think> before the answer. Split it so the UI can show the thinking
// collapsibly. Handles the streaming case where </think> hasn't arrived yet.

export type SplitContent = { thinking: string | null; answer: string };

export function splitThinking(content: string): SplitContent {
  const open = content.indexOf("<think>");
  if (open === -1) return { thinking: null, answer: content };

  const rest = content.slice(open + "<think>".length);
  const close = rest.indexOf("</think>");
  if (close === -1) {
    // Still streaming the thought — nothing to answer yet.
    return { thinking: rest.trim(), answer: "" };
  }
  return {
    thinking: rest.slice(0, close).trim(),
    answer: rest.slice(close + "</think>".length).trim(),
  };
}
