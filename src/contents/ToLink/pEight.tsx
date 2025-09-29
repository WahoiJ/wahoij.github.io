import styles from "../Bike.module.css";
import stylesThumbNail from "../ThumbNail.module.css";
import { useRef } from 'react';
import ReactMarkdown from "react-markdown";

const pEight = () => {
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
        <img src="bike/md/thumbNail/SPEED_P8.jpg" alt="Dahon Speed P8" />
        <h2>Dahon Speed P8編</h2>
      </div>
      <details>
        <ReactMarkdown>
          {`
- [ミニベロブレーキレバー交換](./P8/1.md)
- [ミニベロリアキャリヤー](./P8/2.md)
- [シートポスト交換](./P8/3.md)
- [ライトについて考える](./P8/4.md)
- [リムダイナモの設置](./P8/5.md)
- [シュワルベのチューブは英米スペーサー搭載](./P8/6.md)
- [前カゴをつけようその１](./P8/7.md)
- [前カゴをつけようその2](./P8/8.md)
- [ライトをCtoC充電したくてBFL900を導入した](./P8/9.md)
- [DAHONのトーフ売り場を探せ](./P8/10.md)
- [20x1.95の世界へ](./P8/11.md)
- [プロムナードバーにしよう](./P8/12.md)
- [Altus8速のその先へ 前編](./P8/13.md)
- [Altus8速のその先へ 中編](./P8/14.md)
- [Altus8速のその先へ 後編](./P8/15.md)
- [最近したメンテとか](./P8/16.md)
- [Deore RD-M5120を取り付け](./P8/17.md)
- [Speed P8打ち切りへ](./P8/18.md)
            `}
        </ReactMarkdown>
      </details>
    </div>
  );
};

export default pEight;