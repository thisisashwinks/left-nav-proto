"use client";

import * as React from "react";
import {
  DEFAULT_THEME,
  type Accent,
  type DockLabel,
  type DockPosition,
  type EntryLayout,
  type FlyoutTrigger,
  type RecentsMode,
  type NavSections,
  type PageShell,
  type ScopeModel,
  type NavGeneration,
  type SearchMode,
  type SurfaceTheme,
  type ThemeState,
  type Tint,
} from "@/design/theme";

/**
 * A tenant's own look and layout, layered over the platform theme: the
 * branded axes plus the nav-layout and search ones. Only the genuinely
 * platform-wide axis (scope model) stays out.
 */
export type AccountTheme = Partial<
  Pick<
    ThemeState,
    | "accent"
    | "tint"
    | "navTheme"
    | "headerTheme"
    | "appTheme"
    | "dockLabel"
    | "dockPosition"
    | "entryLayout"
    | "flyoutTrigger"
    | "recentsMode"
    | "autoCollapse"
    | "launchpad"
    | "searchMode"
    | "searchTheme"
  >
> & {
  /** The hex behind the `custom` accent, from the account's brand board. */
  customAccent?: string;
};

interface ThemeContextValue extends ThemeState {
  setAccent: (accent: Accent) => void;
  setTint: (tint: Tint) => void;
  setAppTheme: (theme: SurfaceTheme) => void;
  setNavTheme: (theme: SurfaceTheme) => void;
  setHeaderTheme: (theme: SurfaceTheme) => void;
  setSearchMode: (mode: SearchMode) => void;
  setSearchTheme: (theme: SurfaceTheme) => void;
  setDockLabel: (mode: DockLabel) => void;
  setDockPosition: (position: DockPosition) => void;
  setEntryLayout: (layout: EntryLayout) => void;
  setFlyoutTrigger: (trigger: FlyoutTrigger) => void;
  setRecentsMode: (mode: RecentsMode) => void;
  setAutoCollapse: (enabled: boolean) => void;
  setScopeModel: (model: ScopeModel) => void;
  setNavGeneration: (generation: NavGeneration) => void;
  setTabsInNav: (enabled: boolean) => void;
  setNavSections: (mode: NavSections) => void;
  setPageShell: (shell: PageShell) => void;
  /**
   * What the workspace actually renders: the platform theme with the active
   * account's overrides applied. Chrome reads this; the prototype-controls
   * panel keeps reading and writing the base fields above.
   */
  effective: ThemeState;
  /** Which account's overrides are live. The shell sets it on every switch. */
  setActiveThemeAccount: (accountId: string | null) => void;
  accountThemeFor: (accountId: string) => AccountTheme;
  setAccountTheme: (accountId: string, patch: AccountTheme) => void;
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
  const [accountThemes, setAccountThemes] = React.useState<
    Record<string, AccountTheme>
  >({
    // Brightpath is mid-trial — the one account still in its zero state, so
    // switching to it demos the setup guide appearing and leaving.
    brightpath: { launchpad: true },
    // Fieldstone's IA files Launchpad as the getting-started card rather than an
    // L1 row, so the card has to be on for the bucket to exist at all.
    fieldstone: { launchpad: true },
    // The agency has its own account to finish — white label, domains, billing
    // — and the Aug 25 mapping gives Launchpad an L1 row at agency scope. The
    // card is how that row reads in the nav, the same as in a sub-account.
    agency: { launchpad: true },
  });
  const [activeAccountId, setActiveAccountId] = React.useState<string | null>(
    null,
  );

  // The platform theme with the active account's own look on top. Switching
  // accounts swaps the override set, which is what makes a theme belong to a
  // tenant instead of to the browser tab.
  const activeOverride = React.useMemo(
    () => (activeAccountId && accountThemes[activeAccountId]) || {},
    [activeAccountId, accountThemes],
  );
  const effective: ThemeState = React.useMemo(
    () => ({ ...state, ...stripCustom(activeOverride) }),
    [state, activeOverride],
  );

  // The document-level axes live on <html>, which React does not own here, so
  // they are mirrored imperatively. layout.tsx renders the same defaults so the
  // first paint already matches.
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.accent = effective.accent;
    root.dataset.appTheme = effective.appTheme;
    root.dataset.tint = effective.tint;
    if (activeOverride.customAccent) {
      root.style.setProperty("--custom-accent", activeOverride.customAccent);
    }
  }, [effective.accent, effective.appTheme, effective.tint, activeOverride.customAccent]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      ...state,
      effective,
      setActiveThemeAccount: setActiveAccountId,
      accountThemeFor: (accountId) => accountThemes[accountId] ?? {},
      setAccountTheme: (accountId, patch) =>
        setAccountThemes((themes) => ({
          ...themes,
          [accountId]: { ...themes[accountId], ...patch },
        })),
      setAccent: (accent) => setState((s) => ({ ...s, accent })),
      setTint: (tint) => setState((s) => ({ ...s, tint })),
      setAppTheme: (appTheme) => setState((s) => ({ ...s, appTheme })),
      setNavTheme: (navTheme) => setState((s) => ({ ...s, navTheme })),
      setHeaderTheme: (headerTheme) => setState((s) => ({ ...s, headerTheme })),
      setSearchMode: (searchMode) => setState((s) => ({ ...s, searchMode })),
      setSearchTheme: (searchTheme) => setState((s) => ({ ...s, searchTheme })),
      setDockLabel: (dockLabel) => setState((s) => ({ ...s, dockLabel })),
      setDockPosition: (dockPosition) => setState((s) => ({ ...s, dockPosition })),
      setEntryLayout: (entryLayout) => setState((s) => ({ ...s, entryLayout })),
      setFlyoutTrigger: (flyoutTrigger) => setState((s) => ({ ...s, flyoutTrigger })),
      setRecentsMode: (recentsMode) => setState((s) => ({ ...s, recentsMode })),
      setAutoCollapse: (autoCollapse) => setState((s) => ({ ...s, autoCollapse })),
      setScopeModel: (scopeModel) => setState((s) => ({ ...s, scopeModel })),
      setNavGeneration: (navGeneration) =>
        setState((s) => ({ ...s, navGeneration })),
      setTabsInNav: (tabsInNav) => setState((s) => ({ ...s, tabsInNav })),
      setNavSections: (navSections) => setState((s) => ({ ...s, navSections })),
      setPageShell: (pageShell) => setState((s) => ({ ...s, pageShell })),
    }),
    [state, effective, accountThemes],
  );

  return <ThemeContext value={value}>{children}</ThemeContext>;
}

/** The ThemeState slice of an override — customAccent is not a theme axis. */
function stripCustom(override: AccountTheme): Partial<ThemeState> {
  const rest = { ...override };
  delete rest.customAccent;
  return rest;
}
