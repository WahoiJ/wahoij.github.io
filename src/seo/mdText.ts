// Markdown 本文からタイトル・説明文を取り出す（scripts/prerender.mjs と同じ規則）

const stripInline = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const stripFrontMatter = (md: string) => md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

/** 先頭の「# 見出し」、なければ最初の行（**太字** のタイトル行など） */
export function mdTitle(md: string): string | null {
  const body = stripFrontMatter(md);
  const h = body.match(/^#\s+(.+)$/m);
  if (h) return stripInline(h[1]) || null;
  const first = body
    .split(/\r?\n/)
    .map((l) => stripInline(l.replace(/^\s*#+\s*/, "")))
    .find(Boolean);
  return first || null;
}

/**
 * 「# 見出し」がない記事は、先頭の **太字** や ## 見出しを h1 にする
 * （自転車記事はタイトルを太字で書いているため。検索エンジン向けに h1 を1つ置く）
 */
export function promoteTitle(md: string): string {
  if (/^#\s+/m.test(stripFrontMatter(md))) return md;
  return md.replace(
    /^(\s*)(?:\*\*([^*\n]+)\*\*[ \t]*|#{2,6}\s+(.+?)\s*)$/m,
    (_m, sp: string, bold?: string, h?: string) => `${sp}# ${(bold ?? h ?? "").trim()}`
  );
}

/** 本文の最初の段落から120字程度の説明文 */
export function mdDescription(md: string, max = 120): string | null {
  const title = mdTitle(md);
  const text = stripFrontMatter(md)
    .split(/\r?\n/)
    .filter((l) => !/^\s*(#|---|\||```|<div|投稿日)/.test(l))
    .map(stripInline)
    .filter((l) => l && l !== title)
    .join(" ");
  if (!text) return null;
  return text.length > max ? text.slice(0, max) + "…" : text;
}
