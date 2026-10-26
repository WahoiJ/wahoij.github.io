import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Link, useParams } from "react-router-dom";
import styles from "./Blog.module.css";
import Comments from "../fragments/Comments";
import ShareButtons from "../fragments/ShareButtons";
import { blogTagUrl, blogUrl, cleanSplat } from "../seo/urls";
import { usePageMeta } from "../seo/usePageMeta";
import { mdDescription } from "../seo/mdText";

const BASE_PATH = "/blog/md/";
const LIST_PATH = "/blogList.json";

type Post = {
  name: string;
  title?: string | null;
  tags?: string[];
  createdAt: string | null;
  updatedAt: string | null;
};

// 本文先頭の front matter を取り除く（react-markdown が文字として表示してしまうため）
const stripFrontMatter = (text: string) =>
  text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

const tagLink = blogTagUrl;

function TagChips({ tags }: { tags?: string[] }) {
  if (!tags?.length) return null;
  return (
    <div className={styles.tags}>
      {tags.map((t) => (
        <Link key={t} to={tagLink(t)} className={styles.tag}>
          #{t}
        </Link>
      ))}
    </div>
  );
}

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("ja-JP") : null;

const slugOf = (name: string) => name.replace(/\.md$/, "");

// blogList.json を取得（root 直下の記事のみ）
const useBlogList = () => {
  const [posts, setPosts] = useState<Post[] | null>(null);
  useEffect(() => {
    fetch(LIST_PATH, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        const list: Post[] = data.files?.root ?? [];
        // 新しい順
        setPosts(
          [...list].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
        );
      })
      .catch(() => setPosts([]));
  }, []);
  return posts;
};

function BlogList({ tag }: { tag?: string }) {
  const allPosts = useBlogList();
  const posts = tag ? allPosts?.filter((p) => p.tags?.includes(tag)) : allPosts;

  // 全タグと件数（記事数の多い順）
  const tagCounts = new Map<string, number>();
  allPosts?.forEach((p) => p.tags?.forEach((t) => tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)));
  const allTags = [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  usePageMeta({
    title: tag ? `「${tag}」タグの記事` : "ブログ",
    description: tag ? `「${tag}」タグが付いたブログ記事の一覧です。` : "日々のことや作ったものについて書いているブログです。",
    noindex: !!tag,
  });

  return (
    <div className={styles.blog}>
      <h1>{tag ? `#${tag}` : "ブログ"}</h1>
      {allTags.length > 0 && (
        <div className={styles.tags}>
          {allTags.map(([t, n]) => (
            <Link
              key={t}
              to={tagLink(t)}
              className={`${styles.tag} ${t === tag ? styles.tagActive : ""}`}
            >
              #{t} ({n})
            </Link>
          ))}
        </div>
      )}
      {posts === null && <p>読み込み中…</p>}
      {posts?.length === 0 && <p>{tag ? "このタグの記事はありません。" : "まだ記事がありません。"}</p>}
      <ul className={styles.list}>
        {posts?.map((p) => (
          <li key={p.name} className={styles.item}>
            <div>
              <Link to={blogUrl(slugOf(p.name))} className={styles.itemTitle}>
                {p.title || slugOf(p.name)}
              </Link>
              <TagChips tags={p.tags} />
            </div>
            {p.createdAt && <time className={styles.meta}>{formatDate(p.createdAt)}</time>}
          </li>
        ))}
      </ul>
      {tag && <Link to={blogUrl()}>すべての記事</Link>}
      <Link to="/">トップ画面へ</Link>
    </div>
  );
}

function BlogPost({ slug }: { slug: string }) {
  const posts = useBlogList();
  const [content, setContent] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`${BASE_PATH}${slug}.md`)
      .then((res) => {
        // SPA のフォールバックで index.html が返るケースも失敗扱い
        const type = res.headers.get("content-type") ?? "";
        return res.ok && !type.includes("text/html") ? res.text() : Promise.reject(res.status);
      })
      .then(setContent)
      .catch(() => setContent("記事の読み込みに失敗しました。"));
  }, [slug]);

  const index = posts?.findIndex((p) => slugOf(p.name) === slug) ?? -1;
  const post = index >= 0 ? posts![index] : undefined;
  // posts は新しい順なので、index+1 が1つ前（古い）の記事
  const older = index >= 0 ? posts![index + 1] : undefined;
  usePageMeta({
    title: post?.title ?? null,
    description: content ? mdDescription(content) : null,
  });
  const newer = index > 0 ? posts![index - 1] : undefined;

  return (
    <div className={styles.blog}>
      <article className={styles.article}>
        {post?.createdAt && (
          <div className={styles.meta}>
            投稿日: {formatDate(post.createdAt)}
            {post.updatedAt && post.updatedAt !== post.createdAt && (
              <> ／ 更新日: {formatDate(post.updatedAt)}</>
            )}
          </div>
        )}
        <TagChips tags={post?.tags} />
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ href, children, ...props }) => {
              const h = href ?? "";
              // 記事内の ./xxx.md リンクはブログ内遷移にする
              if (h.endsWith(".md") && !/^https?:/.test(h)) {
                return <Link to={blogUrl(slugOf(h.replace(/^\.\//, "")))}>{children}</Link>;
              }
              return (
                <a href={h} {...props}>
                  {children}
                </a>
              );
            },
            img: ({ ...props }) => <img {...props} className={styles.img} />,
          }}
        >
          {stripFrontMatter(content)}
        </ReactMarkdown>
        <ShareButtons title={post?.title} />
      </article>

      <nav className={styles.pager}>
        <div>{older && <Link to={blogUrl(slugOf(older.name))}>← {older.title || slugOf(older.name)}</Link>}</div>
        <div>{newer && <Link to={blogUrl(slugOf(newer.name))}>{newer.title || slugOf(newer.name)} →</Link>}</div>
      </nav>
      <div>
        <Link to={blogUrl()}>ブログ一覧</Link> ／ <Link to="/">トップ画面へ</Link>
      </div>

      <Comments term={`blog/${slug}`} />
    </div>
  );
}

const Blog = () => {
  const params = useParams<{ "*": string }>();
  const path = cleanSplat(params["*"]);
  // /Blog/tag/<タグ名>/ はタグ別一覧
  if (path.startsWith("tag/")) {
    let tag = path.slice(4);
    try {
      tag = decodeURIComponent(tag);
    } catch {
      /* そのまま使う */
    }
    return <BlogList key={tag} tag={tag} />;
  }
  const slug = slugOf(path);
  return slug ? <BlogPost key={slug} slug={slug} /> : <BlogList />;
};

export default Blog;
