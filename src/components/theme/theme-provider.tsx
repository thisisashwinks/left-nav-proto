"use client";

import * as React from "react";
import {
  DEFAULT_THEME,
  type Accent,
  type SurfaceTheme,
  type ThemeState,
} from "@/design/theme";

interface ThemeContextValue extends ThemeState {
  setAccent: (accent: Accent) => void;
  setAppTheme: (theme: SurfaceTheme) => void;
  setNavTheme: (theme: SurfaceTheme) => void;
  setHeaderTheme: (theme: SurfaceTheme) => void;
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used inside <ThemeProvider>");
  }
  return ctx;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  initial?: ThemeState;
}

export function ThemeProvider({
  children,
  initial = DEFAULT_THEME,
}: ThemeProviderProps) {
  const [state, setState] = React.useState<ThemeState>(initial);

  // The two document-level axes live on <html>, which React does not own here,
  // so they are mirrored imperatively. layout.tsx renders the same defaults so
  // the first paint already matches.
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = state.accent;
    root.dataset.appTheme = state.appTheme;
  }, [state.accent, state.appTheme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      ...state,
      setAccent: (accent) => setState((s) => ({ ...s, accent })),
      setAppTheme: (appTheme) => setState((s) => ({ ...s, appTheme })),
      setNavTheme: (navTheme) => setState((s) => ({ ...s, navTheme })),
      setHeaderTheme: (headerTheme) => setState((s) => ({ ...s, headerTheme })),
    }),
    [state],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
