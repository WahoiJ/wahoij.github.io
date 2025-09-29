import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Link, useParams } from "react-router-dom";
import styles from "./Bike.module.css";
const BASE_PATH = "/bike/md/";
import EscapeR3 from "./ToLink/EscapeR3"; 
import MuddyFox from "./ToLink/MuddyFox"; 
import BoardWalk from "./ToLink/BoardWalk";
import Paratrooper from "./ToLink/Paratrooper"; 
import PEight from "./ToLink/PEight"; 


const BikeArticle = () => {
  const params = useParams<{ "*": string }>();
  const mdPath = params["*"] || "Link.md";
  const [content, setContent] = useState("");
  // Markdown ファイルを取得
  useEffect(() => {
    fetch(BASE_PATH + mdPath)
      .then((res) => (res.ok ? res.text() : Promise.reject(res.status)))
      .then(setContent)
      .catch(() => setContent("記事の読み込みに失敗しました。"));
  }, [mdPath]);
  console.log(content);

  return (
    <div className={styles.bikeArticle}>
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
            return props.id === "targetEscapeR3" ? (
              <EscapeR3 />
            )
              : props.id === "targetP8" ? (
                <PEight />
              ) : props.id === "targetParatrooper" ? (
                <Paratrooper />
              ) : props.id === "targetMuddyFox" ? (
                <MuddyFox />
              ) : props.id === "targetBoardWalk"?(
                <BoardWalk />
              ):(
                <div {...props}>{props.children}</div>
              );
          }

        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
  
};

export default BikeArticle;