// サイト内URLの組み立て（末尾スラッシュ付きで統一。GitHub Pages では /Blog/hello/ → Blog/hello/index.html）
export const SITE_URL = "https://wahoij.github.io";
export const SITE_NAME = "ミンミンゼミの最終定理";

export const blogUrl = (slug?: string) => (slug ? `/Blog/${slug}/` : "/Blog/");
export const blogTagUrl = (tag: string) => `/Blog/tag/${encodeURIComponent(tag)}/`;

/** "P8/0.md" / "P8/0" / "Link.md" → "/Bike/P8/0/"（Link は一覧なので "/Bike/"） */
export const bikeUrl = (path?: string) => {
  const p = (path ?? "").replace(/^\.?\//, "").replace(/\.md$/, "").replace(/\/$/, "");
  return !p || p === "Link" ? "/Bike/" : `/Bike/${p}/`;
};

export const galleryUrl = (id?: string, album?: string) =>
  (id ? `/Gallery/${id}/` : "/Gallery/") + (album ? `?album=${encodeURIComponent(album)}` : "");

/** ルートの "*" から前後のスラッシュを取り除く */
export const cleanSplat = (s: string | undefined) => (s ?? "").replace(/^\/+|\/+$/g, "");

/**
 * 記事内リンクをサイト内URLに変換する
 * - ./P8/0.md, ./Link.md → /Bike/P8/0/, /Bike/
 * - 5.html（旧サイトの相対リンク）→ 同じフォルダの /Bike/<folder>/5/
 */
export const resolveBikeHref = (href: string, folder?: string) => {
  if (/^(\.\.\/)+index\.html$/.test(href)) return "/"; // 旧サイトのトップ
  if (/BCLinks\.html$/.test(href)) return bikeUrl(); // 旧サイトの自転車リンク集
  if (/^[a-z]+:|^\/\/|^#|^\//i.test(href)) return null; // 外部・アンカー・絶対パスはそのまま
  const clean = href.replace(/^\.\//, "");
  if (clean.endsWith(".md")) {
    // 記事内の ./0.md は同じフォルダの記事、./P8/0.md や ./Link.md は自転車トップからの相対
    if (folder && !clean.includes("/") && clean !== "Link.md") return bikeUrl(`${folder}/${clean}`);
    return bikeUrl(clean);
  }
  const html = clean.match(/^(\d+)\.html(#.*)?$/);
  if (html && folder) return bikeUrl(`${folder}/${html[1]}`) + (html[2] ?? "");
  return null;
};
