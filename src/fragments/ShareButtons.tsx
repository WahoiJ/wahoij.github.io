import { useState } from "react";
import { useLocation } from "react-router-dom";
import { SITE_NAME, SITE_URL } from "../seo/urls";

/** 記事を X（旧 Twitter）に共有するボタンと、リンクのコピーボタン */
function ShareButtons({ title }: { title?: string | null }) {
  const { pathname } = useLocation();
  const [copied, setCopied] = useState(false);
  const url = SITE_URL + pathname;
  const text = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("このURLをコピーしてください", url);
    }
  };

  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 14px",
    fontSize: "0.9rem",
    fontWeight: 600,
    borderRadius: 999,
    lineHeight: 1.4,
    textDecoration: "none",
    cursor: "pointer",
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "24px 0 8px" }}>
      <a
        href={xUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X でシェア"
        className="share-x"
        style={{ ...base, background: "var(--share-x-bg)", border: "1px solid var(--share-x-bg)" }}
      >
        <span style={{ color: "var(--share-x-fg)" }}>𝕏 でシェア</span>
      </a>
      <button
        type="button"
        onClick={copy}
        style={{ ...base, background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {copied ? "✅ コピーしました" : "🔗 リンクをコピー"}
      </button>
    </div>
  );
}

export default ShareButtons;
