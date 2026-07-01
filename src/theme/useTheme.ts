import { useCallback, useEffect, useState } from "react";

// The UI is built on the system color keywords Canvas/CanvasText, which follow
// `color-scheme`. Setting it on the root element flips the whole app between
// light and dark with no per-property theming. Defaults to the OS preference,
// then persists the user's choice.

export type Theme = "light" | "dark";

const STORAGE_KEY = "local-ai-kit:theme";

function initialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme(): { theme: Theme; toggle: () => void } {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return { theme, toggle };
}
