import { useRef } from 'react';
import { Link } from "react-router-dom";
import styles from "../Bike.module.css";
import stylesThumbNail from "../ThumbNail.module.css";
import ReactMarkdown from "react-markdown";

const EscapeR3 = () => {
  const targetRef = useRef<HTMLDivElement>(null);


  const openList = () => {
    console.log("Clicked");
    const targetElement = targetRef.current;
    console.log(targetElement);
    if (targetElement) {
      const detailsElement = targetElement.nextElementSibling as HTMLDetailsElement;
      console.log(detailsElement);
      if (detailsElement && detailsElement.tagName == 'DETAILS') {
        detailsElement.open = !detailsElement.open;
      }
    }
  };
  return (
    <div className={styles.bikeArticle}>
      <div ref={targetRef}
        className={stylesThumbNail.target}
        onClick={openList}
      >
        <div className={stylesThumbNail.filter}></div>
        <img src="bike/md/thumbNail/ESCAPE_R3.jpg" alt="番外編"
        />
        <h2>番外編</h2>
      </div>
      <details>
        <ReactMarkdown
                components={{
          a: ({ href, children, ...props }) => {
            const h = href ?? "";
            if (h.endsWith(".md")) {
              const file = h.replace("./", "");
              return <Link to={`/Bike/${file}`}>{children}</Link>;
            }
            return <a href={h} {...props}>{children}</a>;
          }
        }}
        >
          {`
- [EscapeR3を振り返る](./EscapeR3/EscapeR3.md)
- [ママチャリブレーキメンテ](./P8/0.md)
`}
        </ReactMarkdown>
      </details>


    </div>
  );
};

export default EscapeR3;