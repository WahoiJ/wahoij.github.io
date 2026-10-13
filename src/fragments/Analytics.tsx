import { useEffect } from "react";
import { useLocation } from "react-router-dom";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * ページ移動ごとに GA4 へ page_view を送る。
 * タイトルはページ側で非同期に設定されるため、少し待ってから送る。
 * 管理画面は集計に含めない。
 */
function Analytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (/^\/Admin(\/|$)/.test(pathname)) return;
    const path = pathname + search;

    const timer = window.setTimeout(() => {
      window.gtag?.("event", "page_view", {
        page_location: window.location.origin + path,
        page_path: path,
        page_title: document.title,
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pathname, search]);

  return null;
}

export default Analytics;
