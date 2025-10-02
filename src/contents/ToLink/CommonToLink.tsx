import styles from "../Bike.module.css";
import stylesThumbNail from "../ThumbNail.module.css";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

type CommonToLinkProps = {
  id: string|undefined;
  //後でデフォルトidを設定してbikeのcomponentに注釈しておく
  //<CommonToLink id={id ?? "targetDefault"} />
};

const CommonToLink = ({ id }: CommonToLinkProps) => {

  const targetRef = useRef<HTMLDivElement>(null);

  const detailText = () => {
    switch (id) {
      case "targetBoardWalk":
        return {
          thumbnail: (
            <>
              <img src="bike/md/thumbNail/BoardWalk.jpg" alt="ボードウォーク編" />
              <h2>ボードウォーク編</h2>
            </>
          ),
          message: "ボードウォークの詳細は準備中です。",
        };
      case "targetEscapeR3":
        return {
          thumbnail: (
            <>
              <img src="bike/md/thumbNail/ESCAPE_R3.jpg" alt="番外編" />
              <h2>番外編</h2>
            </>
          ),
          message: `
- [EscapeR3を振り返る](./EscapeR3/EscapeR3.md)
- [ママチャリブレーキメンテ](./P8/0.md)
`
        };
      case "targetParatrooper":
        return {
          thumbnail: (
            <>
              <img src="bike/md/thumbNail/PARATROOPER.JPG" alt="Montague Paratrooper編" />
              <h2>Montague Paratrooper編</h2>
            </>
          ),
          message:
            `
- [購入](./Paratrooper/0.md)
- [改造](./Paratrooper/1.md)

          `
        }

      case "targetP8":
        return {
          thumbnail: (
            <>
              <img src="bike/md/thumbNail/SPEED_P8.jpg" alt="Dahon Speed P8" />
              <h2>Dahon Speed P8編</h2>
            </>
          ),
          message:
            `
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
      case "targetMuddyFox":
        return {
          thumbnail: (
            <>
              <img src="bike/md/thumbNail/MUDDY_FOX.jpg" alt="マディフォックス編" />
              <h2>MuddyFox編</h2>
            </>
          ),
          message: "準備中",
        }

      default:
        return {
          thumbnail: <h2>準備中</h2>,
          message: "詳細は準備中です。",
        };
    }
  };
  const { thumbnail, message } = detailText();

  const openList = () => {
    const targetElement = targetRef.current;

    if (targetElement) {
      const detailsElement = targetElement.nextElementSibling as HTMLDetailsElement;
      if (detailsElement && detailsElement.tagName === "DETAILS") {
        detailsElement.open = !detailsElement.open;
      }
    }
  }

  return (
    <div className={styles.bikeArticle}>
      <div
        ref={targetRef}
        className={stylesThumbNail.target}
        onClick={openList}
      >
        <div className={stylesThumbNail.filter}></div>
        {thumbnail}
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
              return (
                <a href={h} {...props}>
                  {children}
                </a>
              );
            },
          }}
        >
          {message}
        </ReactMarkdown>
      </details>
    </div>
  );
};

export default CommonToLink;