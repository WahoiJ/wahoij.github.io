import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Link, useParams } from "react-router-dom";
import styles from "./Blog.module.css";
import Comments from "../fragments/Comments";

const BASE_PATH = "/blog/md/";
const LIST_PATH = "/blogList.json";

type Post = {
  name: string;
  title?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

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

function BlogList() {
  const posts = useBlogList();

  return (
    <div className={styles.blog}>
      <h1>ブログ</h1>
      {posts === null && <p>読み込み中…</p>}
      {posts?.length === 0 && <p>まだ記事がありません。</p>}
      <ul className={styles.list}>
        {posts?.map((p) => (
          <li key={p.name} className={styles.item}>
            <Link to={`/Blog/${slugOf(p.name)}`} className={styles.itemTitle}>
              {p.title || slugOf(p.name)}
            </Link>
            {p.createdAt && <time className={styles.meta}>{formatDate(p.createdAt)}</time>}
          </li>
        ))}
      </ul>
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
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
          components={{
            a: ({ href, children, ...props }) => {
              const h = href ?? "";
              // 記事内の ./xxx.md リンクはブログ内遷移にする
              if (h.endsWith(".md") && !/^https?:/.test(h)) {
                return <Link to={`/Blog/${slugOf(h.replace(/^\.\//, ""))}`}>{children}</Link>;
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
          {content}
        </ReactMarkdown>
      </article>

      <nav className={styles.pager}>
        <div>{older && <Link to={`/Blog/${slugOf(older.name)}`}>← {older.title || slugOf(older.name)}</Link>}</div>
        <div>{newer && <Link to={`/Blog/${slugOf(newer.name)}`}>{newer.title || slugOf(newer.name)} →</Link>}</div>
      </nav>
      <div>
        <Link to="/Blog">ブログ一覧</Link> ／ <Link to="/">トップ画面へ</Link>
      </div>

      <Comments term={`blog/${slug}`} />
    </div>
  );
}

const Blog = () => {
  const params = useParams<{ "*": string }>();
  const slug = slugOf(params["*"] ?? "");
  return slug ? <BlogPost key={slug} slug={slug} /> : <BlogList />;
};

export default Blog;
