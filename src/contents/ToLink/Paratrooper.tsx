import styles from "../Bike.module.css";
import stylesThumbNail from "../ThumbNail.module.css";
import { useRef } from 'react';
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

const Paratrooper = () => {
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
        <img src="bike/md/thumbNail/PARATROOPER.JPG" alt="Montague Paratrooper編" />
        <h2>Montague Paratrooper編</h2>
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
- [購入](./Paratrooper/0.md)
- [改造](./Paratrooper/1.md)
                    `}
        </ReactMarkdown>
      </details>

    </div>
  );
};

export default Paratrooper;