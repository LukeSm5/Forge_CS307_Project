import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ColorMode = "system" | "light" | "dark";

type AccessibilityState = {
  colorMode: ColorMode;
  textScale: number;
  setColorMode: (m: ColorMode) => void;
  setTextScale: (s: number) => void;

  effectiveScheme: "light" | "dark";
};

const STORAGE_KEYS = {
  colorMode: "forge.accessibility.colorMode",
  textScale: "forge.accessibility.textScale",
} as const;

const AccessibilityContext = createContext<AccessibilityState | null>(null);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [colorMode, setColorModeState] = useState<ColorMode>("system");
  const [textScale, setTextScaleState] = useState<number>(1.0);

  const systemScheme = Appearance.getColorScheme();

  const effectiveScheme: "light" | "dark" = useMemo(() => {
    if (colorMode === "light") return "light";
    if (colorMode === "dark") return "dark";
    return systemScheme === "dark" ? "dark" : "light";
  }, [colorMode, systemScheme]);

  useEffect(() => {
    (async () => {
      try {
        const [savedMode, savedScale] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.colorMode),
          AsyncStorage.getItem(STORAGE_KEYS.textScale),
        ]);

        if (savedMode === "system" || savedMode === "light" || savedMode === "dark") {
          setColorModeState(savedMode);
        }
        if (savedScale) {
          const n = Number(savedScale);
          if (!Number.isNaN(n) && n >= 0.9 && n <= 1.6) {
            setTextScaleState(n);
          }
        }
      } catch {
      }
    })();
  }, []);

  const setColorMode = async (m: ColorMode) => {
    setColorModeState(m);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.colorMode, m);
    } catch {}
  };

  const setTextScale = async (s: number) => {
    const clamped = Math.max(0.9, Math.min(1.6, Number(s)));
    setTextScaleState(clamped);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.textScale, String(clamped));
    } catch {}
  };

  const value: AccessibilityState = {
    colorMode,
    textScale,
    setColorMode,
    setTextScale,
    effectiveScheme,
  };

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) throw new Error("useAccessibility must be used inside AccessibilityProvider");
  return ctx;
}

export function useAppColorScheme(): ColorSchemeName {
  const { effectiveScheme } = useAccessibility();
  return effectiveScheme;
}