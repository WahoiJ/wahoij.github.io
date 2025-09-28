import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import styles from "./Bike.module.css";
const BASE_PATH = "/bike/md/";

const BikeArticle = () => {
  const [mdFile, setMdFile] = useState("Link.md");
  const [content, setContent] = useState("");

  // fetchでMarkdown取得
  useEffect(() => {
    fetch(BASE_PATH + mdFile)
      .then((res) => {
        if (!res.ok) throw new Error("ファイル取得失敗: " + res.status);
        return res.text();
      })
      .then((text) => setContent(text))
      .catch(() => setContent("記事の読み込みに失敗しました。"));
  }, [mdFile]);

  // Markdown内のリンククリックをフック
  const handleLinkClick = useCallback(
    (href: string, event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
      // .mdファイルへのリンクならfetchで切り替え
      if (href.endsWith(".md")) {
        event.preventDefault();
        setMdFile(href.replace("./", "")); // 例: ./0.md → 0.md
      }
    },
    []
  );

  return (
    <div className={styles.bikeArticle}>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
      <img src="/path/to/example.jpg" alt="Example" className={styles.img} />
    </div>
  );
};

export default BikeArticle;