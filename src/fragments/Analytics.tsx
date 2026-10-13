import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * HashRouter のページ移動ごとに GA4 へ page_view を送る。
 * GA4 は URL の # 以降を無視するため、#/Blog/hello を /Blog/hello というパスに直して送る。
 * 管理画面は集計に含めない。
 */
function Analytics() {
  const { pathname, search } = useLocation();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (/^\/Admin(\/|$)/.test(pathname)) return;
    const path = pathname + search;
    if (last.current === path) return; // StrictMode の二重実行対策
    last.current = path;

    window.gtag?.("event", "page_view", {
      page_location: window.location.origin + path,
      page_path: path,
      page_title: document.title,
    });
  }, [pathname, search]);

  return null;
}

export default Analytics;
