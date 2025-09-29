import styles from "../Bike.module.css";
import stylesThumbNail from "../ThumbNail.module.css";
import { useRef } from 'react';
import ReactMarkdown from "react-markdown";

const MuddyFox = () => {
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
        <img src="bike/md/thumbNail/MUDDY_FOX.jpg" alt="マディフォックス編" />
        <h2>MuddyFox編</h2>
      </div>
            <details>
              <ReactMarkdown>
                {`
                準備中
      `}
              </ReactMarkdown>
            </details>
    </div>
  );
};

export default MuddyFox;