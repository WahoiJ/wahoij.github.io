import { setPref, useColorMode, type ColorPref } from "./colorMode";

const NEXT: Record<ColorPref, ColorPref> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<ColorPref, string> = { system: "自動", light: "ライト", dark: "ダーク" };
const ICON: Record<ColorPref, string> = { system: "🖥️", light: "☀️", dark: "🌙" };

/** 自動 → ライト → ダーク の順に切り替えるボタン */
export default function ThemeToggle() {
  const { pref } = useColorMode();
  return (
    <button
      type="button"
      onClick={() => setPref(NEXT[pref])}
      aria-label={`表示モード: ${LABEL[pref]}（クリックで切り替え）`}
      title={`表示モード: ${LABEL[pref]}`}
      className="theme-toggle"
      style={{
        position: "absolute",
        top: 8,
        right: 8,
        width: 34,
        height: 34,
        padding: 0,
        fontSize: "1rem",
        lineHeight: 1,
        background: "rgba(255, 255, 255, 0.18)",
        border: "1px solid rgba(255, 255, 255, 0.35)",
        borderRadius: 999,
      }}
    >
      {ICON[pref]}
    </button>
  );
}
