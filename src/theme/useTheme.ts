import { useCallback, useEffect, useState } from "react";

// Theme is driven by <html data-theme>, which switches the CSS token layer and
// Tailwind's `dark:` variant. `color-scheme` is set alongside it so native
// controls and scrollbars match. Defaults to the OS preference, then persists.

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
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return { theme, toggle };
}
