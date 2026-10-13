import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { albumsOf, sortPhotos, type Photo } from "../gallery/types";
import styles from "./Gallery.module.css";
import { cleanSplat, galleryUrl } from "../seo/urls";
import { usePageMeta } from "../seo/usePageMeta";

const formatDate = (d: string) => (d ? d.replace(/-/g, "/") : "");

function Lightbox({
  photos,
  index,
  onMove,
  onClose,
}: {
  photos: Photo[];
  index: number;
  onMove: (index: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  const touchX = useRef<number | null>(null);
  const hasPrev = index > 0;
  const hasNext = index < photos.length - 1;

  const prev = useCallback(() => hasPrev && onMove(index - 1), [hasPrev, index, onMove]);
  const next = useCallback(() => hasNext && onMove(index + 1), [hasNext, index, onMove]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    // 背景のスクロールを止める
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, prev, next]);

  // 前後の写真を先読み
  useEffect(() => {
    [photos[index - 1], photos[index + 1]].forEach((p) => {
      if (p) new Image().src = p.src;
    });
  }, [photos, index]);

  return (
    <div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (dx > 50) prev();
        else if (dx < -50) next();
      }}
    >
      <button className={`${styles.lbButton} ${styles.lbClose}`} onClick={onClose} aria-label="閉じる">
        ×
      </button>
      {hasPrev && (
        <button className={`${styles.lbButton} ${styles.lbPrev}`} onClick={prev} aria-label="前の写真">
          ‹
        </button>
      )}
      {hasNext && (
        <button className={`${styles.lbButton} ${styles.lbNext}`} onClick={next} aria-label="次の写真">
          ›
        </button>
      )}
      <figure className={styles.lbFigure} onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img
          key={photo.id}
          src={photo.src}
          alt={photo.caption || photo.album || "写真"}
          width={photo.width}
          height={photo.height}
          className={styles.lbImage}
        />
        <figcaption className={styles.lbCaption}>
          {photo.caption && <div>{photo.caption}</div>}
          <div className={styles.lbMeta}>
            {[formatDate(photo.takenAt), photo.album, `${index + 1} / ${photos.length}`]
              .filter(Boolean)
              .join("　·　")}
          </div>
        </figcaption>
      </figure>
    </div>
  );
}

const Gallery = () => {
  const params = useParams<{ "*": string }>();
  const openId = cleanSplat(params["*"]) || null;
  const [searchParams] = useSearchParams();
  const album = searchParams.get("album") ?? "";
  const navigate = useNavigate();
  const [allPhotos, setAllPhotos] = useState<Photo[] | null>(null);

  useEffect(() => {
    fetch("/gallery/gallery.json", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => setAllPhotos(sortPhotos(data.photos ?? [])))
      .catch(() => setAllPhotos([]));
  }, []);

  const photos = allPhotos ? (album ? allPhotos.filter((p) => p.album === album) : allPhotos) : null;
  const albums = allPhotos ? albumsOf(allPhotos) : [];
  const openIndex = openId && photos ? photos.findIndex((p) => p.id === openId) : -1;

  const move = useCallback(
    (i: number) => photos && navigate(galleryUrl(photos[i].id, album), { replace: true }),
    [photos, navigate, album]
  );
  const close = useCallback(() => navigate(galleryUrl(undefined, album)), [navigate, album]);

  const opened = photos && openIndex >= 0 ? photos[openIndex] : null;
  usePageMeta({
    title: opened ? opened.caption || `${opened.album || "ギャラリー"}の写真` : album ? `${album} - ギャラリー` : "ギャラリー",
    description: opened
      ? [opened.caption, opened.album, opened.takenAt.replace(/-/g, "/")].filter(Boolean).join(" / ")
      : "撮りためた写真のギャラリーです。",
  });

  return (
    <div className={styles.gallery}>
      <h1>ギャラリー</h1>

      {albums.length > 0 && (
        <nav className={styles.albums}>
          <Link to={galleryUrl()} className={`${styles.album} ${!album ? styles.albumActive : ""}`}>
            すべて ({allPhotos?.length})
          </Link>
          {albums.map(([name, n]) => (
            <Link
              key={name}
              to={galleryUrl(undefined, name)}
              className={`${styles.album} ${name === album ? styles.albumActive : ""}`}
            >
              {name} ({n})
            </Link>
          ))}
        </nav>
      )}

      {photos === null && <p>読み込み中…</p>}
      {photos?.length === 0 && <p>まだ写真がありません。</p>}

      <div className={styles.grid}>
        {photos?.map((p) => (
          <Link key={p.id} to={galleryUrl(p.id, album)} className={styles.cell} title={p.caption}>
            <img src={p.thumb} alt={p.caption || p.album || "写真"} loading="lazy" decoding="async" />
          </Link>
        ))}
      </div>

      <Link to="/">トップ画面へ</Link>

      {photos && openIndex >= 0 && (
        <Lightbox photos={photos} index={openIndex} onMove={move} onClose={close} />
      )}
    </div>
  );
};

export default Gallery;
