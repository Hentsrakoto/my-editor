import { useCallback, useEffect, useState } from "react";

export default function useTheme(defaultTheme = "dark") {
  const [theme, setTheme] = useState(() => localStorage.getItem("app-theme") || defaultTheme);

  useEffect(() => {
    localStorage.setItem("app-theme", theme);
    // Optionally toggle a class on <html> for global theming
    document.documentElement.classList.toggle("theme-light", theme === "light");
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  const toggle = useCallback(() => setTheme(t => (t === "dark" ? "light" : "dark")), []);
  const set = useCallback((t) => setTheme(t), []);

  return { theme, toggle, set };
}
