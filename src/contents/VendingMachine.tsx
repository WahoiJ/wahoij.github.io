import { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./VendingMachine.module.css";
import data from "../data/vending.json";

// 自販機の写真と説明は src/data/vending.json で管理（画像は public/VM_images/、縮小版は thumbs/）
type Item = { id: string; title: string; place: string; year: string; images: string[]; comment: string };
const items: Item[] = data.items;

const full = (f: string) => `/VM_images/${f}`;
const thumb = (f: string) => `/VM_images/thumbs/${f}`;

// ライトボックスで前後に移動するための、全写真の通し番号
const slides = items.flatMap((item) => item.images.map((file, i) => ({ item, file, n: i + 1 })));

function Lightbox({ index, onClose, onMove }: { index: number; onClose: () => void; onMove: (d: number) => void }) {
  const { item, file, n } = slides[index];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onMove(-1);
      if (e.key === "ArrowRight") onMove(1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onMove]);

  // スワイプで前後へ
  const [touchX, setTouchX] = useState<number | null>(null);

  return (
    <div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      onClick={onClose}
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) onMove(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      <figure className={styles.lbFigure} onClick={(e) => e.stopPropagation()}>
        <img className={styles.lbImage} src={full(file)} alt={item.title} />
        <figcaption className={styles.lbCaption}>
          <strong>{item.title}</strong>
          {item.images.length > 1 && (
            <span className={styles.lbCount}>
              {n} / {item.images.length}
            </span>
          )}
          <span className={styles.lbMeta}>{[item.place, item.year && `${item.year}年`].filter(Boolean).join(" ・ ")}</span>
        </figcaption>
      </figure>
      <button type="button" className={`${styles.lbButton} ${styles.lbClose}`} onClick={onClose} aria-label="閉じる">
        ×
      </button>
      <button
        type="button"
        className={`${styles.lbButton} ${styles.lbPrev}`}
        onClick={(e) => {
          e.stopPropagation();
          onMove(-1);
        }}
        aria-label="前の写真"
      >
        ‹
      </button>
      <button
        type="button"
        className={`${styles.lbButton} ${styles.lbNext}`}
        onClick={(e) => {
          e.stopPropagation();
          onMove(1);
        }}
        aria-label="次の写真"
      >
        ›
      </button>
    </div>
  );
}

function Card({ item, onOpen }: { item: Item; onOpen: (file: string) => void }) {
  const [main, ...rest] = item.images;
  return (
    <article className={styles.card} id={item.id}>
      <button type="button" className={styles.photo} onClick={() => onOpen(main)} aria-label={`${item.title}の写真を拡大`}>
        <img src={thumb(main)} alt={item.title} loading="lazy" />
        {item.images.length > 1 && <span className={styles.count}>📷 {item.images.length}</span>}
      </button>
      {rest.length > 0 && (
        <div className={styles.subPhotos}>
          {rest.map((f) => (
            <button key={f} type="button" className={styles.subPhoto} onClick={() => onOpen(f)} aria-label="別の写真を拡大">
              <img src={thumb(f)} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div className={styles.body}>
        <h2 className={styles.title}>{item.title}</h2>
        {(item.place || item.year) && (
          <div className={styles.meta}>
            {item.place && <span>📍 {item.place}</span>}
            {item.year && <span>🗓 {item.year}年</span>}
          </div>
        )}
        <p className={styles.comment}>{item.comment}</p>
      </div>
    </article>
  );
}

function VendingMachine() {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const move = useCallback(
    (d: number) => setOpen((i) => (i === null ? i : (i + d + slides.length) % slides.length)),
    []
  );
  const indexOf = useMemo(() => new Map(slides.map((s, i) => [s.file, i])), []);

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <h1>自販機コレクション</h1>
        <p>旅先や街角で見つけた、ちょっと変わった自動販売機の記録。写真をタップすると大きく表示します。</p>
        <p className={styles.total}>
          {items.length}台 ・ 写真{slides.length}枚
        </p>
      </div>

      <div className={styles.grid}>
        {items.map((item) => (
          <Card key={item.id} item={item} onOpen={(f) => setOpen(indexOf.get(f) ?? 0)} />
        ))}
      </div>

      {open !== null && <Lightbox index={open} onClose={close} onMove={move} />}
    </div>
  );
}

export default VendingMachine;
