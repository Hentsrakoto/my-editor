import { useEffect, useState } from "react";

const extToLang = {
  js: "javascript",
  jsx: "javascript",
  ts: "typescript",
  tsx: "typescript",
  html: "html",
  css: "css",
  json: "json",
  md: "markdown",
  py: "python",
  java: "java",
  php: "php",
  xml: "xml",
  sql: "sql",
};

export default function useLanguageFromPath(path) {
  const [language, setLanguage] = useState("plaintext");

  useEffect(() => {
    if (!path) {
      setLanguage("plaintext");
      return;
    }
    const parts = path.split(".");
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : "";
    setLanguage(extToLang[ext] || "plaintext");
  }, [path]);

  return language;
}
