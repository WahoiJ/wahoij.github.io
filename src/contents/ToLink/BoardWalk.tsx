
import styles from "../Bike.module.css";
import stylesThumbNail from "../ThumbNail.module.css";
import { useRef } from 'react';
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

const BoardWalk = (props:{ id: string}) => {
    const targetRef = useRef<HTMLDivElement>(null);

  const openList = () => {
    console.log("Clicked");
    console.log(props.id);

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
        <img src="bike/md/thumbNail/BoardWalk.jpg" alt="ボードウォーク編" />
        <h2>ボードウォーク編</h2>
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
                      準備中
            `}
                    </ReactMarkdown>
                  </details>
    </div>
  );
};

export default BoardWalk;