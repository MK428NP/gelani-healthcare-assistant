"use client";

import * as React from "react";
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

// Helper to get resolved theme
const getResolvedTheme = (theme: Theme): "light" | "dark" => {
  if (theme === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return theme;
};

// Helper to apply theme to DOM
const applyThemeToDOM = (resolved: "light" | "dark") => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
};

export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "gelani-theme",
}: ThemeProviderProps) {
  // Initialize theme - use lazy initialization to read from localStorage
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(storageKey) as Theme | null;
      if (stored) {
        // Apply theme to DOM immediately on initialization
        const resolved = getResolvedTheme(stored);
        applyThemeToDOM(resolved);
        return stored;
      }
    }
    return defaultTheme;
  });
  
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => getResolvedTheme(theme));

  // Apply theme changes to DOM (no setState here, just DOM manipulation)
  useEffect(() => {
    const resolved = getResolvedTheme(theme);
    applyThemeToDOM(resolved);
    // Use a microtask to update state after render
    const timer = setTimeout(() => {
      setResolvedTheme(resolved);
    }, 0);
    return () => clearTimeout(timer);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const resolved = getResolvedTheme("system");
      applyThemeToDOM(resolved);
      setTimeout(() => setResolvedTheme(resolved), 0);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  const value = {
    theme,
    setTheme,
    resolvedTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
