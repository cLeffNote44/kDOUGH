"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function setThemeCookie(theme: Theme) {
  document.cookie = `kd-theme=${theme};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
}

export default function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: Theme;
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // On first mount, sync localStorage/system preference with cookie if they differ
  useEffect(() => {
    const stored = localStorage.getItem("kd-theme") as Theme | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const clientTheme = stored || (prefersDark ? "dark" : "light");

    if (clientTheme !== initialTheme) {
      // Client preference differs from the SSR cookie — reconcile once after
      // hydration. localStorage/matchMedia are client-only, so this can't be a
      // render-time initializer; the post-hydration setState is intentional.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(clientTheme);
      setThemeCookie(clientTheme);
      document.documentElement.classList.toggle("dark", clientTheme === "dark");
    }
  }, [initialTheme]);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("kd-theme", next);
    setThemeCookie(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
