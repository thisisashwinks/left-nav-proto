"use client";

import * as React from "react";
import {
  DEFAULT_THEME,
  type Accent,
  type DockLabel,
  type EntryLayout,
  type SearchMode,
  type SurfaceTheme,
  type ThemeState,
  type Tint,
} from "@/design/theme";

interface ThemeContextValue extends ThemeState {
  setAccent: (accent: Accent) => void;
  setTint: (tint: Tint) => void;
  setAppTheme: (theme: SurfaceTheme) => void;
  setNavTheme: (theme: SurfaceTheme) => void;
  setHeaderTheme: (theme: SurfaceTheme) => void;
  setSearchMode: (mode: SearchMode) => void;
  setSearchTheme: (theme: SurfaceTheme) => void;
  setDockLabel: (mode: DockLabel) => void;
  setEntryLayout: (layout: EntryLayout) => void;
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

  // The document-level axes live on <html>, which React does not own here, so
  // they are mirrored imperatively. layout.tsx renders the same defaults so the
  // first paint already matches.
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = state.accent;
    root.dataset.appTheme = state.appTheme;
    root.dataset.tint = state.tint;
  }, [state.accent, state.appTheme, state.tint]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      ...state,
      setAccent: (accent) => setState((s) => ({ ...s, accent })),
      setTint: (tint) => setState((s) => ({ ...s, tint })),
      setAppTheme: (appTheme) => setState((s) => ({ ...s, appTheme })),
      setNavTheme: (navTheme) => setState((s) => ({ ...s, navTheme })),
      setHeaderTheme: (headerTheme) => setState((s) => ({ ...s, headerTheme })),
      setSearchMode: (searchMode) => setState((s) => ({ ...s, searchMode })),
      setSearchTheme: (searchTheme) => setState((s) => ({ ...s, searchTheme })),
      setDockLabel: (dockLabel) => setState((s) => ({ ...s, dockLabel })),
      setEntryLayout: (entryLayout) => setState((s) => ({ ...s, entryLayout })),
    }),
    [state],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
