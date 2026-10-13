// ビルド後に実行し、ページごとの HTML（title・description・OGP・構造化データ・本文）と
// sitemap.xml / robots.txt / feed.xml / 404.html を dist に書き出す。
// GitHub Pages は /Blog/hello/ → dist/Blog/hello/index.html を返すので、
// 検索エンジンや SNS のクローラーが JavaScript なしでも各ページの内容を読める。
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const ROOT = process.cwd();
const DIST = path.join(ROOT, "dist");
const PUB = path.join(ROOT, "public");

const SITE_URL = "https://wahoij.github.io";
const SITE_NAME = "ミンミンゼミの最終定理";
const AUTHOR = "わほい";
const SITE_DESCRIPTION = fs
  .readFileSync(path.join(ROOT, "src/seo/site.ts"), "utf-8")
  .match(/SITE_DESCRIPTION\s*=\s*"([^"]+)"/)[1];
const DEFAULT_IMAGE = "/assets/favicons/icon.png";

// ---------- helpers ----------
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const abs = (u) => new URL(u, SITE_URL).href;
const readJSON = (rel, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(PUB, rel), "utf-8"));
  } catch {
    return fallback;
  }
};
const readText = (rel) => {
  try {
    return fs.readFileSync(path.join(PUB, rel), "utf-8");
  } catch {
    return null;
  }
};
const fmtDate = (iso) => (iso ? iso.slice(0, 10).replace(/-/g, "/") : "");

// src/seo/mdText.ts と同じ規則
const stripInline = (s) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const stripFrontMatter = (md) => md.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
const mdTitle = (md) => {
  const body = stripFrontMatter(md);
  const h = body.match(/^#\s+(.+)$/m);
  if (h) return stripInline(h[1]) || null;
  return body.split(/\r?\n/).map((l) => stripInline(l.replace(/^\s*#+\s*/, ""))).find(Boolean) || null;
};
const mdDescription = (md, max = 120) => {
  const title = mdTitle(md);
  const text = stripFrontMatter(md)
    .split(/\r?\n/)
    .filter((l) => !/^\s*(#|---|\||```|<div|投稿日)/.test(l))
    .map(stripInline)
    .filter((l) => l && l !== title)
    .join(" ");
  if (!text) return null;
  return text.length > max ? text.slice(0, max) + "…" : text;
};
// 「# 見出し」がない記事は、先頭の **太字** や ## 見出しを h1 にする（src/seo/mdText.ts と同じ）
const promoteTitle = (md) => {
  if (/^#\s+/m.test(stripFrontMatter(md))) return md;
  return md.replace(/^(\s*)(?:\*\*([^*\n]+)\*\*[ \t]*|#{2,6}\s+(.+?)\s*)$/m, (m, sp, bold, h) => `${sp}# ${(bold ?? h).trim()}`);
};

const firstImage = (md) => {
  const m = md.match(/!\[[^\]]*\]\(([^)\s]+)/) || md.match(/<img[^>]+src="([^"]+)"/);
  return m && m[1].startsWith("/") ? m[1] : null;
};

// サイト内URL（src/seo/urls.ts と同じ規則）
const blogUrl = (slug) => (slug ? `/Blog/${slug}/` : "/Blog/");
const blogTagUrl = (tag) => `/Blog/tag/${encodeURIComponent(tag)}/`;
const bikeUrl = (p) => {
  const s = (p ?? "").replace(/^\.?\//, "").replace(/\.md$/, "").replace(/\/$/, "");
  return !s || s === "Link" ? "/Bike/" : `/Bike/${s}/`;
};
const galleryUrl = (id) => (id ? `/Gallery/${id}/` : "/Gallery/");

const renderMd = (md, resolveHref) =>
  renderToStaticMarkup(
    React.createElement(
      Markdown,
      {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeRaw],
        components: {
          a: ({ href, children }) => {
            const h = href ?? "";
            return React.createElement("a", { href: resolveHref?.(h) ?? h }, children);
          },
          // 自転車一覧の <div id="target..."> は React 側で描画する部品なので静的HTMLでは省く
          div: ({ children, id }) => (id?.startsWith("target") ? null : React.createElement("div", null, children)),
          img: ({ node: _node, ...props }) => React.createElement("img", { ...props, loading: "lazy" }),
        },
      },
      stripFrontMatter(md)
    )
  );

const resolveBikeHref = (folder) => (h) => {
  if (/^(\.\.\/)+index\.html$/.test(h)) return "/";
  if (/BCLinks\.html$/.test(h)) return bikeUrl();
  if (/^[a-z]+:|^\/\/|^#|^\//i.test(h)) return null;
  const clean = h.replace(/^\.\//, "");
  if (clean.endsWith(".md")) {
    if (folder && !clean.includes("/") && clean !== "Link.md") return bikeUrl(`${folder}/${clean}`);
    return bikeUrl(clean);
  }
  const html = clean.match(/^(\d+)\.html(#.*)?$/);
  if (html && folder) return bikeUrl(`${folder}/${html[1]}`) + (html[2] ?? "");
  return null;
};

// ---------- template ----------
const template = fs.readFileSync(path.join(DIST, "index.html"), "utf-8");
if (!/<!-- seo:start[\s\S]*?seo:end -->/.test(template)) throw new Error("index.html に seo マーカーがありません");

const NAV = `<nav><a href="/">トップ</a> | <a href="${bikeUrl()}">自転車</a> | <a href="${blogUrl()}">ブログ</a> | <a href="${galleryUrl()}">ギャラリー</a> | <a href="/Vending/">自販機</a></nav>`;

const pages = [];
const sitemap = [];

/**
 * @param {string} route  "/Blog/hello/" のような末尾スラッシュ付きのパス
 */
function page(route, { title, description, image, type = "website", jsonLd = [], body = "", noindex = false, lastmod, images = [] }) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description || SITE_DESCRIPTION;
  const url = abs(route);
  const img = abs(image || DEFAULT_IMAGE);
  const head = [
    `<title>${esc(fullTitle)}</title>`,
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta name="robots" content="${noindex ? "noindex,follow" : "index,follow"}" />`,
    `<meta property="og:site_name" content="${esc(SITE_NAME)}" />`,
    `<meta property="og:locale" content="ja_JP" />`,
    `<meta property="og:type" content="${type}" />`,
    `<meta property="og:title" content="${esc(fullTitle)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}" />`,
    ...jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`),
  ].join("\n    ");

  const staticBody = `<div style="max-width:760px;margin:0 auto;padding:16px;line-height:1.8;font-family:sans-serif">${NAV}<main>${body}</main></div>`;
  const html = template
    .replace(/<!-- seo:start[\s\S]*?seo:end -->/, head)
    .replace('<div id="root"></div>', `<div id="root">${staticBody}</div>`);

  pages.push({ route, html });
  if (!noindex) sitemap.push({ url, lastmod, images });
}

const breadcrumb = (items) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(([name, route], i) => ({
    "@type": "ListItem",
    position: i + 1,
    name,
    item: abs(route),
  })),
});

const articleLd = ({ title, description, route, image, createdAt, updatedAt }) => ({
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: title,
  description,
  mainEntityOfPage: abs(route),
  url: abs(route),
  ...(image ? { image: [abs(image)] } : {}),
  ...(createdAt ? { datePublished: createdAt } : {}),
  ...(updatedAt || createdAt ? { dateModified: updatedAt || createdAt } : {}),
  author: { "@type": "Person", name: AUTHOR, url: SITE_URL + "/" },
  publisher: { "@type": "Person", name: AUTHOR, url: SITE_URL + "/" },
  inLanguage: "ja",
});

const list = (items) => `<ul>${items.join("")}</ul>`;

// ---------- data ----------
const blogPosts = (readJSON("blogList.json", { files: {} }).files.root ?? [])
  .map((p) => {
    const slug = p.name.replace(/\.md$/, "");
    const md = readText(`blog/md/${p.name}`) ?? "";
    return { ...p, slug, md, title: p.title || mdTitle(md) || slug, tags: p.tags ?? [] };
  })
  .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

const bikeFiles = readJSON("fileList.json", { files: {} }).files;
const bikeArticles = Object.entries(bikeFiles)
  .filter(([folder]) => folder !== "root")
  .flatMap(([folder, files]) =>
    files.map((f) => {
      const name = f.name.replace(/\.md$/, "");
      const md = readText(`bike/md/${folder}/${f.name}`) ?? "";
      return { ...f, folder, name, md, title: mdTitle(md) || `${folder} ${name}` };
    })
  );

const photos = (readJSON("gallery/gallery.json", { photos: [] }).photos ?? []).sort(
  (a, b) => b.takenAt.localeCompare(a.takenAt) || b.uploadedAt.localeCompare(a.uploadedAt)
);

const maxDate = (...dates) => dates.filter(Boolean).sort().pop();

// ---------- pages ----------
// トップ
page("/", {
  description: SITE_DESCRIPTION,
  lastmod: maxDate(...blogPosts.map((p) => p.updatedAt), ...bikeArticles.map((a) => a.updatedAt)),
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL + "/",
      description: SITE_DESCRIPTION,
      inLanguage: "ja",
      author: { "@type": "Person", name: AUTHOR },
    },
  ],
  body:
    `<h1>${esc(SITE_NAME)}</h1><p>${esc(SITE_DESCRIPTION)}</p>` +
    (blogPosts.length
      ? `<h2>新着ブログ</h2>` +
        list(blogPosts.slice(0, 5).map((p) => `<li><a href="${blogUrl(p.slug)}">${esc(p.title)}</a> ${fmtDate(p.createdAt)}</li>`))
      : ""),
});

// ブログ一覧
page(blogUrl(), {
  title: "ブログ",
  description: "日々のことや作ったものについて書いているブログです。",
  lastmod: maxDate(...blogPosts.map((p) => p.updatedAt)),
  jsonLd: [breadcrumb([["トップ", "/"], ["ブログ", blogUrl()]])],
  body:
    `<h1>ブログ</h1>` +
    list(blogPosts.map((p) => `<li><a href="${blogUrl(p.slug)}">${esc(p.title)}</a> ${fmtDate(p.createdAt)}</li>`)),
});

// ブログ記事
for (const p of blogPosts) {
  const route = blogUrl(p.slug);
  const description = mdDescription(p.md);
  const image = firstImage(p.md);
  page(route, {
    title: p.title,
    description,
    image,
    type: "article",
    lastmod: p.updatedAt,
    images: image ? [image] : [],
    jsonLd: [
      articleLd({ title: p.title, description, route, image, createdAt: p.createdAt, updatedAt: p.updatedAt }),
      breadcrumb([["トップ", "/"], ["ブログ", blogUrl()], [p.title, route]]),
    ],
    body:
      `<article><p>投稿日: ${fmtDate(p.createdAt)}</p>` +
      (p.tags.length ? `<p>${p.tags.map((t) => `<a href="${blogTagUrl(t)}">#${esc(t)}</a>`).join(" ")}</p>` : "") +
      renderMd(p.md, (h) => (h.endsWith(".md") && !/^[a-z]+:/i.test(h) ? blogUrl(h.replace(/^\.\//, "").replace(/\.md$/, "")) : null)) +
      `</article>`,
  });
}

// タグ別一覧（中身が一覧だけなので検索結果には出さない）
const tags = [...new Set(blogPosts.flatMap((p) => p.tags))];
for (const tag of tags) {
  page(blogTagUrl(tag), {
    title: `「${tag}」タグの記事`,
    description: `「${tag}」タグが付いたブログ記事の一覧です。`,
    noindex: true,
    body:
      `<h1>#${esc(tag)}</h1>` +
      list(blogPosts.filter((p) => p.tags.includes(tag)).map((p) => `<li><a href="${blogUrl(p.slug)}">${esc(p.title)}</a></li>`)),
  });
}

// 自転車一覧
const bikeByFolder = new Map();
bikeArticles.forEach((a) => bikeByFolder.set(a.folder, [...(bikeByFolder.get(a.folder) ?? []), a]));
page(bikeUrl(), {
  title: "自転車の記事一覧",
  description: "自転車いじりの記録。ミニベロ Dahon Speed P8、Montague Paratrooper、EscapeR3 などのカスタムやメンテナンス。",
  lastmod: maxDate(...bikeArticles.map((a) => a.updatedAt)),
  jsonLd: [breadcrumb([["トップ", "/"], ["自転車", bikeUrl()]])],
  body:
    `<h1>自転車の記事一覧</h1>` +
    [...bikeByFolder.entries()]
      .map(([folder, arts]) => `<h2>${esc(folder)}</h2>` + list(arts.map((a) => `<li><a href="${bikeUrl(`${folder}/${a.name}`)}">${esc(a.title)}</a></li>`)))
      .join(""),
});

// 自転車記事
for (const a of bikeArticles) {
  const route = bikeUrl(`${a.folder}/${a.name}`);
  const description = mdDescription(a.md);
  const image = firstImage(a.md);
  page(route, {
    title: a.title,
    description,
    image,
    type: "article",
    lastmod: a.updatedAt,
    images: image ? [image] : [],
    jsonLd: [
      articleLd({ title: a.title, description, route, image, createdAt: a.createdAt, updatedAt: a.updatedAt }),
      breadcrumb([["トップ", "/"], ["自転車", bikeUrl()], [a.title, route]]),
    ],
    body: `<article>${renderMd(promoteTitle(a.md), resolveBikeHref(a.folder))}</article>`,
  });
}

// ギャラリー
page(galleryUrl(), {
  title: "ギャラリー",
  description: "撮りためた写真のギャラリーです。",
  image: photos[0]?.src,
  lastmod: maxDate(...photos.map((p) => p.uploadedAt)),
  images: photos.slice(0, 1000).map((p) => p.src),
  jsonLd: [breadcrumb([["トップ", "/"], ["ギャラリー", galleryUrl()]])],
  body:
    `<h1>ギャラリー</h1>` +
    photos
      .map((p) => `<a href="${galleryUrl(p.id)}"><img src="${esc(p.thumb)}" alt="${esc(p.caption || p.album || "写真")}" width="160" loading="lazy" /></a>`)
      .join(" "),
});

// 写真ごとのページ（共有用。中身が薄いので検索結果には出さず、画像はギャラリーのサイトマップに載せる）
for (const p of photos) {
  const desc = [p.caption, p.album, fmtDate(p.takenAt)].filter(Boolean).join(" / ");
  page(galleryUrl(p.id), {
    title: p.caption || `${p.album || "ギャラリー"}の写真`,
    description: desc,
    image: p.src,
    noindex: true,
    body: `<figure><img src="${esc(p.src)}" alt="${esc(p.caption || p.album || "写真")}" width="${p.width}" height="${p.height}" /><figcaption>${esc(desc)}</figcaption></figure>`,
  });
}

page("/Vending/", {
  title: "自販機コレクション",
  description: "旅先や街角で見つけた、ちょっと変わった自動販売機の写真集です。",
  image: "/VM_images/VM1_1.jpg",
  body: `<h1>自販機コレクション</h1><p>旅先や街角で見つけた、ちょっと変わった自動販売機の写真集です。</p>`,
});

page("/GAPolicy/", {
  title: "Google Analyticsについて",
  description: "当サイトでのGoogleアナリティクスの利用とCookieについて。",
  body: `<h1>Google Analyticsについて</h1><p>当サイトでは、Googleによるアクセス解析ツール「Googleアナリティクス」を使用しています。</p>`,
});

page("/Admin/", { title: "管理画面", noindex: true });

// ---------- write ----------
for (const { route, html } of pages) {
  // GitHub Pages はURLをデコードしてファイルを探すので、フォルダ名もデコードした名前にする
  const file = path.join(DIST, decodeURIComponent(route), "index.html");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

// 404.html: 存在しないURLや、デプロイ前の新しいページもアプリ側で表示できるようにする
const notFoundHead = [
  `<title>ページが見つかりません | ${esc(SITE_NAME)}</title>`,
  `<meta name="robots" content="noindex" />`,
].join("\n    ");
fs.writeFileSync(path.join(DIST, "404.html"), template.replace(/<!-- seo:start[\s\S]*?seo:end -->/, notFoundHead));

// sitemap.xml
const xmlEsc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const sitemapXml =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n` +
  sitemap
    .map(
      ({ url, lastmod, images }) =>
        `  <url>\n    <loc>${xmlEsc(url)}</loc>\n` +
        (lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>\n` : "") +
        images.map((i) => `    <image:image><image:loc>${xmlEsc(abs(i))}</image:loc></image:image>\n`).join("") +
        `  </url>`
    )
    .join("\n") +
  `\n</urlset>\n`;
fs.writeFileSync(path.join(DIST, "sitemap.xml"), sitemapXml);

// robots.txt
fs.writeFileSync(
  path.join(DIST, "robots.txt"),
  `User-agent: *\nAllow: /\nDisallow: /Admin/\n\nSitemap: ${SITE_URL}/sitemap.xml\n`
);

// feed.xml（ブログの Atom フィード）
const feedUpdated = maxDate(...blogPosts.map((p) => p.updatedAt)) ?? new Date().toISOString();
const feed =
  `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n` +
  `  <title>${xmlEsc(SITE_NAME)} ブログ</title>\n  <link href="${SITE_URL}${blogUrl()}" />\n  <link rel="self" href="${SITE_URL}/feed.xml" />\n` +
  `  <id>${SITE_URL}${blogUrl()}</id>\n  <updated>${feedUpdated}</updated>\n  <author><name>${xmlEsc(AUTHOR)}</name></author>\n` +
  blogPosts
    .slice(0, 20)
    .map(
      (p) =>
        `  <entry>\n    <title>${xmlEsc(p.title)}</title>\n    <link href="${SITE_URL}${blogUrl(p.slug)}" />\n    <id>${SITE_URL}${blogUrl(p.slug)}</id>\n` +
        `    <published>${p.createdAt ?? feedUpdated}</published>\n    <updated>${p.updatedAt ?? p.createdAt ?? feedUpdated}</updated>\n` +
        `    <summary>${xmlEsc(mdDescription(p.md) ?? "")}</summary>\n  </entry>`
    )
    .join("\n") +
  `\n</feed>\n`;
fs.writeFileSync(path.join(DIST, "feed.xml"), feed);

console.log(`prerender: ${pages.length} pages, sitemap ${sitemap.length} URLs, feed ${Math.min(blogPosts.length, 20)} entries`);
