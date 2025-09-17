import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext({
  mode: "system",        // "light" | "dark" | "system"
  setMode: () => {},
  resolved: "light",     // actual mode after resolving "system"
});

const THEME_KEY = "theme-mode"; // localStorage key

function applyTheme(mode, mql) {
  const root = document.documentElement;
  const resolved =
    mode === "system" ? (mql.matches ? "dark" : "light") : mode;
  root.setAttribute("data-theme", resolved);  // <html data-theme="dark">
  return resolved;
}

export function ThemeProvider({ children }) {
  const mql = useMemo(
    () => window.matchMedia?.("(prefers-color-scheme: dark)"),
    []
  );

  const [mode, setMode] = useState(
    () => localStorage.getItem(THEME_KEY) || "system"
  );
  const [resolved, setResolved] = useState("light");

  // Apply on mount and whenever mode or system setting changes
  useEffect(() => {
    setResolved(applyTheme(mode, mql));
    localStorage.setItem(THEME_KEY, mode);
  }, [mode, mql]);

  // React to system changes if user selected "system"
  useEffect(() => {
    if (!mql?.addEventListener) return;
    const onChange = () => {
      if (mode === "system") setResolved(applyTheme(mode, mql));
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [mode, mql]);

  const value = useMemo(() => ({ mode, setMode, resolved }), [mode, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
