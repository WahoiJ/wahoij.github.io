// ライト／ダークの切り替え。設定は localStorage に保存し、「自動」は OS の設定に従う。
// 初回表示のちらつきを防ぐため、同じ判定を index.html の <script> でも先に実行している。
import { useEffect, useState } from "react";

export type ColorPref = "system" | "light" | "dark";
export type ColorMode = "light" | "dark";

const KEY = "colorMode";
const EVENT = "colormodechange";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

export const getPref = (): ColorPref => {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
};

export const resolveMode = (pref: ColorPref): ColorMode =>
  pref === "system" ? (media().matches ? "dark" : "light") : pref;

const apply = (mode: ColorMode) => {
  document.documentElement.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", mode === "dark" ? "#0d3f78" : "#1976d2");
};

export const setPref = (pref: ColorPref) => {
  try {
    if (pref === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, pref);
  } catch {
    /* ignore */
  }
  apply(resolveMode(pref));
  window.dispatchEvent(new Event(EVENT));
};

/** 現在の設定（自動/ライト/ダーク）と、実際に使われている色（ライト/ダーク） */
export function useColorMode() {
  const [pref, setPrefState] = useState<ColorPref>(getPref);
  const [mode, setMode] = useState<ColorMode>(() => resolveMode(getPref()));

  useEffect(() => {
    const update = () => {
      const p = getPref();
      const m = resolveMode(p);
      apply(m);
      setPrefState(p);
      setMode(m);
    };
    update();
    const mq = media();
    mq.addEventListener("change", update);
    window.addEventListener(EVENT, update);
    window.addEventListener("storage", update); // 他のタブで切り替えたとき
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener(EVENT, update);
      window.removeEventListener("storage", update);
    };
  }, []);

  return { pref, mode, setPref };
}
