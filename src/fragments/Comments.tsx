import { useEffect, useRef } from "react";
import { useColorMode } from "../theme/colorMode";

/**
 * giscus（GitHub Discussions）を使ったコメント欄。
 * 設定値は https://giscus.app でリポジトリを入力すると表示される。
 * GISCUS_CATEGORY_ID が空のあいだはコメント欄を表示しない。
 */
const GISCUS_REPO = "WahoiJ/wahoij.github.io";
const GISCUS_REPO_ID = "R_kgDOHxjOeQ";
const GISCUS_CATEGORY = "Announcements";
const GISCUS_CATEGORY_ID = "DIC_kwDOHxjOec4DIXbA";

type Props = {
  /** 記事を識別するキー（例: "blog/hello"）。公開後は変更しないこと */
  term: string;
};

function Comments({ term }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { mode } = useColorMode();
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    const container = ref.current;
    if (!container || !GISCUS_CATEGORY_ID) return;

    container.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    const attrs: Record<string, string> = {
      "data-repo": GISCUS_REPO,
      "data-repo-id": GISCUS_REPO_ID,
      "data-category": GISCUS_CATEGORY,
      "data-category-id": GISCUS_CATEGORY_ID,
      // HashRouter なので pathname では記事を区別できない → term で固定
      "data-mapping": "specific",
      "data-term": term,
      "data-strict": "1",
      "data-reactions-enabled": "1",
      "data-emit-metadata": "0",
      "data-input-position": "bottom",
      "data-theme": modeRef.current,
      "data-lang": "ja",
      "data-loading": "lazy",
    };
    Object.entries(attrs).forEach(([k, v]) => script.setAttribute(k, v));
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [term]);

  // 表示モードを切り替えたら、読み込み済みのコメント欄にもテーマ変更を伝える
  useEffect(() => {
    const frame = ref.current?.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    frame?.contentWindow?.postMessage({ giscus: { setConfig: { theme: mode } } }, "https://giscus.app");
  }, [mode]);

  if (!GISCUS_CATEGORY_ID) return null;

  return (
    <section style={{ width: "100%", maxWidth: 760, marginTop: 40 }}>
      <h2 style={{ fontSize: "1.2rem" }}>コメント</h2>
      <div ref={ref} />
    </section>
  );
}

export default Comments;
