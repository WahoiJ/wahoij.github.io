import { useMemo, type ReactNode } from "react";
import { ThemeProvider, createTheme } from "@mui/material";
import { useColorMode } from "./colorMode";

/** MUI の部品（入力欄・ダイアログ・タブなど）もライト／ダークに合わせる */
export default function AppTheme({ children }: { children: ReactNode }) {
  const { mode } = useColorMode();
  const theme = useMemo(
    () =>
      createTheme({
        palette:
          mode === "dark"
            ? { mode, primary: { main: "#64b5f6" }, background: { default: "#121212", paper: "#1e1e1e" } }
            : { mode },
      }),
    [mode]
  );
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
