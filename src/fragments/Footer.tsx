import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "./Footer.module.css";
import { SITE_NAME, bikeUrl, blogUrl, galleryUrl } from "../seo/urls";
import { NICONICO_URL, X_URL, YOUTUBE_URL } from "../links";

const CONTACT = "wahoijbusiness2025@gmail.com";

const LINKS = [
  { to: "/", label: "トップ" },
  { to: blogUrl(), label: "ブログ" },
  { to: bikeUrl(), label: "自転車" },
  { to: galleryUrl(), label: "ギャラリー" },
  { to: "/Vending/", label: "自販機" },
];

function Footer() {
  const [updatedAt, setUpdatedAt] = useState("");
  useEffect(() => {
    fetch("/fileList.json", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) =>
        setUpdatedAt(
          new Date(data.updatedAt).toLocaleDateString("ja-JP", {
            timeZone: "Asia/Tokyo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
        )
      )
      .catch(() => setUpdatedAt(""));
  }, []);

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <div className={styles.siteName}>{SITE_NAME}</div>
          <div className={styles.small}>管理人：わほい</div>
          {updatedAt && <div className={styles.small}>最終更新：{updatedAt}</div>}
        </div>

        <nav aria-label="サイト内リンク" className={styles.col}>
          <div className={styles.heading}>コンテンツ</div>
          <ul className={styles.links}>
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={`${styles.col} ${styles.contact}`}>
          <div className={styles.heading}>お問い合わせ・ポリシー</div>
          <ul className={styles.links}>
            <li>
              <a href={`mailto:${CONTACT}`}>✉️ {CONTACT}</a>
            </li>
            <li>
              <Link to="/GAPolicy/">Google Analytics の利用について</Link>
            </li>
            {YOUTUBE_URL && (
              <li>
                <a href={YOUTUBE_URL} target="_blank" rel="noopener noreferrer">
                  ▶ YouTube チャンネル
                </a>
              </li>
            )}
            {NICONICO_URL && (
              <li>
                <a href={NICONICO_URL} target="_blank" rel="noopener noreferrer">
                  📺 ニコニコ動画
                </a>
              </li>
            )}
            {X_URL && (
              <li>
                <a href={X_URL} target="_blank" rel="noopener noreferrer">
                  𝕏 @WahoiJ_hobby
                </a>
              </li>
            )}
            <li>
              <a href="/feed.xml">RSS フィード</a>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.copy}>
        © {new Date().getFullYear()} {SITE_NAME}
      </div>
    </footer>
  );
}

export default Footer;
