import { useAppColorScheme } from "@/core/accessibility";   
  
  export function usePalette () {
  const scheme = useAppColorScheme() ?? "light";
  const isDark = scheme === "dark";
  
  return {
    background: isDark ? "#0b0f14" : "#ffffff",
    surface: isDark ? "#131922" : "#f8fafc",
    surfaceAlt: isDark ? "#111827" : "#ffffff",
    border: isDark ? "#243041" : "#dbe3f0",
    mutedBorder: isDark ? "#334155" : "#cbd5e1",
    text: isDark ? "#f8fafc" : "#0f172a",
    mutedText: isDark ? "#94a3b8" : "#64748b",
    splitSurface: isDark ? "#0f172a" : "#eff6ff",
    splitBorder: isDark ? "#1d4ed8" : "#93c5fd",
  };
}