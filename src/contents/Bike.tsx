import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { Link, useParams } from "react-router-dom";
import styles from "./Bike.module.css";
const BASE_PATH = "/bike/md/";
import CommonToLink from "./ToLink/CommonToLink";
// import EscapeR3 from "./ToLink/EscapeR3"; 
// import MuddyFox from "./ToLink/MuddyFox"; 
// import BoardWalk from "./ToLink/BoardWalk";
// import PEight from "./ToLink/P8";
// import PRper from "./ToLink/PRper";

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
            return <CommonToLink id={props.id} />;
          },
          // div: ({ ...props }) => {
          //   return props.id === "targetEscapeR3" ? (
          //     <EscapeR3 />
          //   )
          //     : props.id === "targetP8" ? (
          //       <PEight />
          //     ) : props.id === "targetParatrooper" ? (
          //       <PRper />
          //     ) : props.id === "targetMuddyFox" ? (
          //       <MuddyFox />
          //     ) : props.id === "targetBoardWalk"?(
          //       <BoardWalk id={props.id}/>
          //     ):(
          //       <div {...props}>{props.children}</div>
          //     );
          // },
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
    </div>
  );

};

export default BikeArticle;