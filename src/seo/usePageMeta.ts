import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SITE_NAME, SITE_URL } from "./urls";

const setMeta = (selector: string, attr: string, key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
};

/**
 * ページ移動のたびに title / description / canonical / OGP を更新する。
 * （初回表示分はビルド時に scripts/prerender.mjs が HTML に書き込んでいる）
 */
export function usePageMeta({
  title,
  description,
  noindex = false,
}: {
  title?: string | null;
  description?: string | null;
  noindex?: boolean;
}) {
  const { pathname } = useLocation();

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;
    setMeta('meta[property="og:title"]', "property", "og:title", fullTitle);
    if (description) {
      setMeta('meta[name="description"]', "name", "description", description);
      setMeta('meta[property="og:description"]', "property", "og:description", description);
    }
    const url = SITE_URL + pathname;
    setMeta('meta[property="og:url"]', "property", "og:url", url);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
    setMeta('meta[name="robots"]', "name", "robots", noindex ? "noindex,follow" : "index,follow");
  }, [title, description, noindex, pathname]);
}
