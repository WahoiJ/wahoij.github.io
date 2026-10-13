// 記事 Markdown の組み立て・分解（generateFileList.cjs / Blog.tsx と同じ書式）
export type PostDraft = {
  slug: string;
  title: string;
  tags: string; // カンマ区切り
  body: string;
};

export const parseTags = (s: string) => [
  ...new Set(
    s
      .split(/[,、]/)
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean)
  ),
];

export function composePost(d: PostDraft) {
  const tags = parseTags(d.tags);
  const front = tags.length ? `---\ntags: [${tags.join(", ")}]\n---\n\n` : "";
  return `${front}# ${d.title.trim()}\n\n${d.body.trim()}\n`;
}

export function parsePost(slug: string, text: string): PostDraft {
  let rest = text.replace(/\r\n/g, "\n");
  let tags = "";
  const fm = rest.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    const t = fm[1].match(/^tags:\s*(.*)$/m);
    if (t) tags = parseTags(t[1].replace(/^\[|\]$/g, "").replace(/["']/g, "")).join(", ");
    rest = rest.slice(fm[0].length);
  }
  let title = "";
  const h = rest.match(/^\s*#\s+(.+)\n?/);
  if (h) {
    title = h[1].trim();
    rest = rest.slice(h[0].length);
  }
  return { slug, title, tags, body: rest.trim() };
}

export const SLUG_RE = /^[A-Za-z0-9_-]+$/;
