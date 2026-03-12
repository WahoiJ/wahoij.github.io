import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Link, useParams } from "react-router-dom";
import styles from "./Bike.module.css";
const BASE_PATH = "/bike/md/";
import CommonToLink from "./ToLink/CommonToLink";
import NextPage from "../fragments/NextPage";



const BikeArticle = () => {
  const params = useParams<{ "*": string }>();
  const mdPath = params["*"] || "Link.md";
  const [content, setContent] = useState("");
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  // Markdown ファイルを取得
  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(BASE_PATH + mdPath)
      .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
      .then(setContent)
      .catch(() => setContent("記事の読み込みに失敗しました。"));
  }, [mdPath]);

    useEffect(() => {
    const parts = mdPath.split("/"); // ["Paratrooper", "0.md"]
    if (parts.length < 2) return;
    const folder = parts[0];
    const fileName = parts[1];

    fetch("/fileList.json")
      .then((res) => res.json())
      .then((data) => {
        const articles: { name: string; createdAt: string; updatedAt: string }[] =
          data.files[folder] || [];
        const article = articles.find((a) => a.name === fileName);
        if (article) {
          setCreatedAt(article.createdAt);
          setUpdatedAt(article.updatedAt);
        }
      });
  }, [mdPath]);

  // ✅ 追加：日付フォーマット用ヘルパー
  const formatDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("ja-JP") : null;


  return (
    <div className={styles.bikeArticle}>
      <NextPage />

      {/* ✅ 追加：投稿日・更新日の表示 */}
      {createdAt && (
        <div style={{ color: "#888", fontSize: "0.85rem", margin: "8px 0" }}>
          投稿日: {formatDate(createdAt)}
          {updatedAt && updatedAt !== createdAt && (
            <>更新日: {formatDate(updatedAt)}</>
          )}
        </div>
      )}

      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          a: ({ href, children, ...props }) => {
            const h = href ?? "";
            if (h.endsWith(".md")) {
              const file = h.replace("./", "");
              return <Link to={`/Bike/${file}`}>{children}</Link>;
            }
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
            return <img {...props}
              style={{
                maxWidth: '80%',
                height: 'auto',
                padding: '10px',
              }}
            />
          }
          ,

        }}
      >
        {content}

      </ReactMarkdown>
      <NextPage />
    </div>
  );

};

export default BikeArticle;