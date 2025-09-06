import { useState, useCallback } from "react";

export default function useFontSize(initial = 14, min = 10, max = 24) {
  const [fontSize, setFontSize] = useState(initial);

  const increase = useCallback(() => setFontSize(s => Math.min(s + 1, max)), [max]);
  const decrease = useCallback(() => setFontSize(s => Math.max(s - 1, min)), [min]);
  const set = useCallback((v) => setFontSize(() => Math.min(Math.max(v, min), max)), [min, max]);

  return { fontSize, increase, decrease, set };
}
