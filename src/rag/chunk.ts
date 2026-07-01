// Paragraph-aware chunking with a character cap and overlap, so retrieved
// context stays coherent without exploding chunk count.

const MAX_CHARS = 800;
const OVERLAP = 120;

export function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length <= MAX_CHARS) return clean ? [clean] : [];

  const paragraphs = clean.split(/\n{2,}/);
  const chunks: string[] = [];
  let buffer = "";

  for (const para of paragraphs) {
    if (buffer.length + para.length + 2 <= MAX_CHARS) {
      buffer = buffer ? `${buffer}\n\n${para}` : para;
      continue;
    }
    if (buffer) chunks.push(buffer);
    if (para.length <= MAX_CHARS) {
      buffer = para;
    } else {
      chunks.push(...splitLong(para));
      buffer = "";
    }
  }
  if (buffer) chunks.push(buffer);
  return chunks.filter((c) => c.trim().length > 0);
}

function splitLong(text: string): string[] {
  const parts: string[] = [];
  let i = 0;
  while (i < text.length) {
    parts.push(text.slice(i, i + MAX_CHARS));
    i += MAX_CHARS - OVERLAP;
  }
  return parts;
}
