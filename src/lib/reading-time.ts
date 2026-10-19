const CJK_CHARACTER = /[㐀-䶿一-鿿豈-﫿]/g;

/**
 * Estimate reading time: 300 CJK characters or 200 Latin words per minute.
 * Code blocks and images are excluded; empty content returns 1 minute.
 */
export function readingTime(content: string): number {
  const text = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/~~~[\s\S]*?~~~/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');

  const cjkCount = (text.match(CJK_CHARACTER) ?? []).length;
  const latinWords = text.replace(CJK_CHARACTER, ' ').match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) ?? [];
  const minutes = Math.ceil(cjkCount / 300 + latinWords.length / 200);

  return Math.max(1, minutes);
}
