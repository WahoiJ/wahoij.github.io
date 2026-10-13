import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Link, Navigate, useParams } from "react-router-dom";
import styles from "./Bike.module.css";
import CommonToLink from "./ToLink/CommonToLink";
import NextPage from "../fragments/NextPage";
import Comments from "../fragments/Comments";
import { bikeUrl, cleanSplat, resolveBikeHref } from "../seo/urls";
import { usePageMeta } from "../seo/usePageMeta";
import { mdDescription, mdTitle, promoteTitle } from "../seo/mdText";

const BASE_PATH = "/bike/md/";

const BikeArticle = () => {
  const params = useParams<{ "*": string }>();
  const raw = cleanSplat(params["*"]);
  // 旧URL（/Bike/P8/0.md）は新URLへ
  const legacy = raw.endsWith(".md");
  const path = raw.replace(/\.md$/, "") || "Link";
  const isIndex = path === "Link";
  const [folder, name] = path.includes("/") ? path.split("/") : [undefined, undefined];

  const [content, setContent] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  usePageMeta({
    title: isIndex ? "自転車の記事一覧" : content ? mdTitle(content) : null,
    description: isIndex
      ? "自転車いじりの記録。ミニベロ Dahon Speed P8、Montague Paratrooper、EscapeR3 などのカスタムやメンテナンス。"
      : content
        ? mdDescription(content)
        : null,
  });

  useEffect(() => {
    if (legacy) return;
    window.scrollTo(0, 0);
    fetch(`${BASE_PATH}${path}.md`)
      .then((res) => {
        const type = res.headers.get("content-type") ?? "";
        return res.ok && !type.includes("text/html") ? res.text() : Promise.reject(res.status);
      })
      .then(setContent)
      .catch(() => setContent("記事の読み込みに失敗しました。"));
  }, [path, legacy]);

  useEffect(() => {
    setCreatedAt(null);
    setUpdatedAt(null);
    if (legacy || !folder) return;
    fetch("/fileList.json")
      .then((res) => res.json())
      .then((data) => {
        const articles: { name: string; createdAt: string; updatedAt: string }[] =
          data.files[folder] || [];
        const article = articles.find((a) => a.name === `${name}.md`);
        if (article) {
          setCreatedAt(article.createdAt);
          setUpdatedAt(article.updatedAt);
        }
      });
  }, [folder, name, legacy]);

  if (legacy) return <Navigate to={bikeUrl(raw)} replace />;

  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ja-JP") : null;

  return (
    <div className={styles.bikeArticle}>
      <NextPage folder={folder} name={name} />
      {isIndex && <h1>自転車の記事一覧</h1>}

      {createdAt && (
        <div style={{ color: "#888", fontSize: "0.85rem", margin: "8px 0" }}>
          投稿日: {formatDate(createdAt)}
          {updatedAt && updatedAt !== createdAt && <> 更新日: {formatDate(updatedAt)}</>}
        </div>
      )}

      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ href, children, ...props }) => {
            const h = href ?? "";
            const to = resolveBikeHref(h, folder);
            if (to) return <Link to={to}>{children}</Link>;
            return (
              <a href={h} {...props}>
                {children}
              </a>
            );
          },
          div: ({ ...props }) => {
            return <CommonToLink id={props.id ?? "targetDefault"} />;
          },
          img: ({ ...props }) => {
            return (
              <img
                {...props}
                loading="lazy"
                style={{
                  maxWidth: "80%",
                  height: "auto",
                  padding: "10px",
                }}
              />
            );
          },
        }}
      >
        {promoteTitle(content)}
      </ReactMarkdown>
      <NextPage folder={folder} name={name} />
      {/* 一覧ページ以外の記事にコメント欄 */}
      {!isIndex && <Comments term={`bike/${path}`} />}
    </div>
  );
};

export default BikeArticle;
