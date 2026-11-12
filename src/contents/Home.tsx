import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Home.module.css";
import { bikeUrl, blogTagUrl, blogUrl, galleryUrl } from "../seo/urls";
import { usePageMeta } from "../seo/usePageMeta";
import { SITE_DESCRIPTION } from "../seo/site";
import { sortPhotos, type Photo } from "../gallery/types";
import { NICONICO_URL, X_URL, YOUTUBE_URL } from "../links";

type BlogEntry = { name: string; title?: string | null; tags?: string[]; createdAt: string | null };
type BikeNew = { name: string; title?: string | null; folder: string; createdAt: string };

const NEW_DAYS = 14;
const isNew = (iso?: string | null) => !!iso && Date.now() - new Date(iso).getTime() < NEW_DAYS * 86400_000;
const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("ja-JP") : "");
const slugOf = (name: string) => name.replace(/\.md$/, "");

const getJson = <T,>(url: string) =>
  fetch(url, { cache: "no-store" }).then((r) => (r.ok ? (r.json() as Promise<T>) : Promise.reject(r.status)));

type Card = {
  to: string;
  title: string;
  description: string;
  icon: string;
  iconIsPhoto?: boolean;
  meta?: string;
  isNew?: boolean;
  /** 画像の代わりに表示する絵文字 */
  emoji?: string;
  /** 絵文字タイルの色（未指定は赤） */
  emojiClass?: "nico" | "x";
  /** 外部サイト（新しいタブで開く） */
  external?: boolean;
};

function ContentCard({ card }: { card: Card }) {
  const inner = (
    <>
      <span
        className={
          card.iconIsPhoto
            ? styles.photoIcon
            : card.emoji
              ? `${styles.emojiTile} ${card.emojiClass === "nico" ? styles.emojiNico : card.emojiClass === "x" ? styles.emojiX : ""}`
              : styles.iconTile
        }
      >
        {card.emoji ? card.emoji : <img src={card.icon} alt="" loading="lazy" />}
      </span>
      <span className={styles.cardBody}>
        <span className={styles.cardTitle}>
          {card.title}
          {card.isNew && <span className={styles.newBadge}>NEW</span>}
        </span>
        <span className={styles.cardDesc}>{card.description}</span>
        {card.meta && <span className={styles.cardMeta}>{card.meta}</span>}
      </span>
    </>
  );
  return card.external ? (
    <a href={card.to} className={styles.card} target="_blank" rel="noopener noreferrer">
      {inner}
    </a>
  ) : (
    <Link to={card.to} className={styles.card}>
      {inner}
    </Link>
  );
}

export default function Home() {
  usePageMeta({ description: SITE_DESCRIPTION });
  const [blog, setBlog] = useState<BlogEntry[] | null>(null);
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [bikeCount, setBikeCount] = useState<number | null>(null);
  const [bikeNew, setBikeNew] = useState<BikeNew[]>([]);

  useEffect(() => {
    getJson<{ files: Record<string, BlogEntry[]> }>("/blogList.json")
      .then((d) =>
        setBlog([...(d.files.root ?? [])].sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")))
      )
      .catch(() => setBlog([]));
    getJson<{ photos: Photo[] }>("/gallery/gallery.json")
      .then((d) => setPhotos(sortPhotos(d.photos ?? [])))
      .catch(() => setPhotos([]));
    getJson<{ files: Record<string, unknown[]> }>("/fileList.json")
      .then((d) =>
        setBikeCount(Object.entries(d.files).reduce((n, [k, v]) => n + (k === "root" ? 0 : v.length), 0))
      )
      .catch(() => setBikeCount(null));
    getJson<{ newArticles: BikeNew[] }>("/newArticles.json")
      .then((d) => setBikeNew(d.newArticles ?? []))
      .catch(() => setBikeNew([]));
  }, []);

  const latestPhoto = photos?.[0];
  const cards: Card[] = [
    {
      to: blogUrl(),
      title: "ブログ",
      description: "日々のこと、作ったもの、考えたこと。",
      icon: "/assets/icons/Diary.png",
      meta: blog ? `${blog.length}本の記事` : undefined,
      isNew: isNew(blog?.[0]?.createdAt),
    },
    {
      to: bikeUrl(),
      title: "自転車",
      description: "ミニベロ Dahon Speed P8 などのカスタム・メンテナンス記録。",
      icon: "/assets/icons/Cycle.png",
      meta: bikeCount ? `${bikeCount}本の記事` : undefined,
      isNew: bikeNew.length > 0,
    },
    {
      to: galleryUrl(),
      title: "ギャラリー",
      description: "旅先やお出かけで撮った写真。",
      icon: latestPhoto?.thumb ?? "/assets/icons/dummy.png",
      iconIsPhoto: !!latestPhoto,
      meta: photos ? `${photos.length}枚の写真` : undefined,
      isNew: isNew(latestPhoto?.uploadedAt),
    },
    {
      to: "/Vending/",
      title: "自販機コレクション",
      description: "街角で見つけた、ちょっと変わった自動販売機。",
      icon: "/assets/icons/VendingMachine.png",
    },
    ...(YOUTUBE_URL
      ? [
          {
            to: YOUTUBE_URL,
            title: "YouTube",
            description: "YouTubeアカウントです。チャンネル登録してね。",
            icon: "",
            emoji: "▶",
            meta: "チャンネルを見る ↗",
            external: true,
          },
        ]
      : []),
    ...(NICONICO_URL
      ? [
          {
            to: NICONICO_URL,
            title: "ニコニコ動画",
            description: "ニコニコ動画にも動画を投稿しています。",
            icon: "",
            emoji: "📺",
            emojiClass: "nico" as const,
            meta: "投稿動画を見る ↗",
            external: true,
          },
        ]
      : []),
    ...(X_URL
      ? [
          {
            to: X_URL,
            title: "X（旧Twitter）",
            description: "@WahoiJ_hobby で更新情報などをつぶやいています。",
            icon: "",
            emoji: "𝕏",
            emojiClass: "x" as const,
            meta: "フォローする ↗",
            external: true,
          },
        ]
      : []),
  ];

  const recentPosts = blog?.slice(0, 3) ?? [];
  const recentPhotos = photos?.slice(0, 6) ?? [];

  return (
    <div className={styles.home}>
      <p className={styles.lead}>{SITE_DESCRIPTION}</p>

      <section aria-label="コンテンツ一覧" className={styles.cards}>
        {cards.map((c) => (
          <ContentCard key={c.to} card={c} />
        ))}
      </section>

      {bikeNew.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>自転車の新着記事</h2>
          <ul className={styles.postList}>
            {bikeNew.map((a) => (
              <li key={`${a.folder}/${a.name}`}>
                <time className={styles.date}>{fmt(a.createdAt)}</time>
                <Link to={bikeUrl(`${a.folder}/${a.name}`)} className={styles.postTitle}>
                  {a.title || `${a.folder} / ${slugOf(a.name)}`}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentPosts.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>最新のブログ</h2>
            <Link to={blogUrl()} className={styles.more}>
              すべて見る →
            </Link>
          </div>
          <ul className={styles.postList}>
            {recentPosts.map((p) => (
              <li key={p.name}>
                <time className={styles.date}>{fmt(p.createdAt)}</time>
                <Link to={blogUrl(slugOf(p.name))} className={styles.postTitle}>
                  {p.title || slugOf(p.name)}
                </Link>
                {isNew(p.createdAt) && <span className={styles.newBadge}>NEW</span>}
                {p.tags && p.tags.length > 0 && (
                  <span className={styles.tags}>
                    {p.tags.map((t) => (
                      <Link key={t} to={blogTagUrl(t)} className={styles.tag}>
                        #{t}
                      </Link>
                    ))}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recentPhotos.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>最近の写真</h2>
            <Link to={galleryUrl()} className={styles.more}>
              ギャラリーへ →
            </Link>
          </div>
          <div className={styles.photoGrid}>
            {recentPhotos.map((p) => (
              <Link key={p.id} to={galleryUrl(p.id)} className={styles.photo} title={p.caption || undefined}>
                <img src={p.thumb} alt={p.caption || "写真"} loading="lazy" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
