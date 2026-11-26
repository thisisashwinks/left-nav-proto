"use client";

import * as React from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { agency as AGENCY_ACCOUNT, type Account } from "@/components/accounts/accounts-data";
import {
  INK,
  WHITE,
  deriveChrome,
  fontById,
  googleFontsHref,
  isDefaultTheme,
  minimalTheme,
  resolveAppearance,
  isLightSurface,
  mix,
  resolveAssets,
  resolveTheme,
  type BrandAssets,
  type BrandingTheme,
  type DerivedChrome,
  type Appearance,
  type Mode,
  type SurfaceTokens,
} from "@/design/branding";
import { useBranding, useBrandingOptional } from "./branding-provider";

/**
 * Paints the live branding onto the real app chrome (Nov 18).
 *
 * Reads `live` (draft ?? saved) for the active account, derives the chrome for
 * the current mode and writes it to <html> as custom properties plus
 * `data-branding="on"`. `design/branding.css` maps those onto the nav, rail and
 * header token families — on <html> rather than on the shell because the
 * flyouts, menus and tooltips that open off the chrome are portalled to <body>.
 *
 * Default theme → nothing is written and everything written before is removed,
 * so an unbranded prototype is byte-for-byte what it was.
 *
 * Variables, per palette P in rail | rail-fly | sidebar | sidebar-fly | topbar:
 *   --brd-P-<key>   for every key in PALETTE_KEYS below.
 * `-fly` palettes are the same surface with `flyBg`/`flyLine` as the ground —
 * what L2/L3 flyouts and menus opening off that surface wear.
 */

export const BRANDING_PALETTES = ["rail", "rail-fly", "sidebar", "sidebar-fly", "topbar"] as const;
export type BrandingPalette = (typeof BRANDING_PALETTES)[number];

/** The keys each palette carries. branding.css reads every one of them. */
export const PALETTE_KEYS = [
  "bg",
  "fg",
  "muted",
  "subtle",
  "hover",
  "active",
  "line",
  "dash",
  "seam",
  "sel-bg",
  "sel-fg",
  "sel-fg-muted",
  "sel-fg-subtle",
  "indicator",
  "button-bg",
  "button-fg",
  "button-hover",
  "tooltip-bg",
  "tooltip-fg",
  "raise",
  "key-bg",
  "scrollbar",
  "scrollbar-hover",
  "entry-border",
  "soft",
  "soft-2",
  "strong",
  "shadow",
  "card-bg",
  "tile-bg",
  "highlight",
  "ai-icon",
  "ai-fg",
] as const;
type PaletteKey = (typeof PALETTE_KEYS)[number];

function palette(t: SurfaceTokens, fly: boolean): Record<PaletteKey, string> {
  const bg = fly ? t.flyBg : t.bg;
  const light = isLightSurface(bg);
  return {
    bg,
    fg: t.fg,
    muted: t.muted,
    subtle: t.subtle,
    hover: t.hover,
    active: t.active,
    line: fly ? t.flyLine : t.line,
    dash: t.dash,
    seam: mix(t.fg, bg, 0.2),
    "sel-bg": t.selBg,
    "sel-fg": t.selFg,
    "sel-fg-muted": mix(t.selFg, t.selBg, 0.74),
    "sel-fg-subtle": mix(t.selFg, t.selBg, 0.6),
    indicator: t.indicator,
    "button-bg": t.buttonBg,
    "button-fg": t.buttonFg,
    // Toward its own ink: darker under white text, lighter under dark text.
    "button-hover": mix(t.buttonFg, t.buttonBg, 0.12),
    "tooltip-bg": t.tooltipBg,
    "tooltip-fg": t.tooltipFg,
    // A step UP from the ground: white on a light surface, a lift on a dark one.
    raise: light ? WHITE : t.hover,
    "key-bg": light ? WHITE : t.active,
    scrollbar: mix(t.fg, bg, 0.22),
    "scrollbar-hover": mix(t.fg, bg, 0.34),
    "entry-border": mix(t.fg, bg, 0.2),
    soft: mix(t.indicator, bg, light ? 0.12 : 0.22),
    "soft-2": mix(t.indicator, bg, light ? 0.22 : 0.32),
    strong: light ? mix(t.indicator, INK, 0.8) : mix(t.indicator, WHITE, 0.7),
    shadow: light ? "#0000001f" : "#00000066",
    "card-bg": mix(t.fg, bg, 0.03),
    "tile-bg": t.hover,
    // The pin wash: HighRise warning 100 on light, 900 on dark.
    highlight: light ? "#fef0c7" : "#7a2e0e",
    // Ask AI keeps its purple; only the lightness follows the surface.
    "ai-icon": light ? "#9333ea" : "#cb76ff",
    "ai-fg": light ? "#7e22ce" : "#e39fff",
  };
}

function cssVarsFor(chrome: DerivedChrome): Record<string, string> {
  const sets: Record<BrandingPalette, Record<PaletteKey, string>> = {
    rail: palette(chrome.rail, false),
    "rail-fly": palette(chrome.rail, true),
    sidebar: palette(chrome.sidebar, false),
    "sidebar-fly": palette(chrome.sidebar, true),
    topbar: palette(chrome.topbar, false),
  };
  const out: Record<string, string> = { "--brd-accent": chrome.accent };
  for (const p of BRANDING_PALETTES) {
    for (const k of PALETTE_KEYS) out[`--brd-${p}-${k}`] = sets[p][k];
  }
  return out;
}

/* ---------------------------------------------------------------------- */
/* Hooks                                                                   */
/* ---------------------------------------------------------------------- */

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");
const subscribeSystem = (cb: () => void) => {
  const q = darkQuery();
  q.addEventListener("change", cb);
  return () => q.removeEventListener("change", cb);
};

/** The device's light/dark, live. False on the server. */
export function useSystemDark(): boolean {
  return React.useSyncExternalStore(subscribeSystem, () => darkQuery().matches, () => false);
}

/**
 * The mode a theme paints the chrome in (Nov 19): the branding preview's if
 * one is set, else the theme's own color mode ("system" → the device). The
 * untouched default theme paints nothing, so it follows the app.
 */
export function useModeFor(theme: BrandingTheme | null): Mode {
  const ctx = useBrandingOptional();
  const { effective } = useTheme();
  const systemDark = useSystemDark();
  const previewMode = ctx?.previewMode ?? null;
  // Every theme is light (Nov 25, 2026): no theme set offers color mode.
  if (ctx && theme && !isDefaultTheme(minimalTheme(theme, true))) return "light";
  if (previewMode) return previewMode;
  if (!theme || isDefaultTheme(theme)) return effective.appTheme === "dark" ? "dark" : "light";
  return resolveAppearance(theme.appearance as Appearance, systemDark);
}

/** The mode the chrome paints in for the active account's live theme. */
export function useChromeMode(): Mode {
  const { live } = useBranding();
  const { activeThemeAccount } = useTheme();
  return useModeFor(resolveTheme(live, activeThemeAccount));
}

export interface LiveChrome {
  accountId: string | null;
  theme: BrandingTheme;
  mode: Mode;
  /** Null while the theme is the platform default — nothing is painted. */
  chrome: DerivedChrome | null;
  assets: BrandAssets;
}

/** What the chrome is painting right now, for the active account. */
export function useLiveChrome(): LiveChrome {
  const { live, proto } = useBranding();
  const { activeThemeAccount } = useTheme();
  // Always light, no gradient; Minimal also paints the default font.
  const minimal = proto.themeSet === "minimal";
  const resolved = (st: typeof live) => minimalTheme(resolveTheme(st, activeThemeAccount), !minimal);
  const mode = useModeFor(resolved(live));
  const { railStep, darkStrength } = proto;
  return React.useMemo(() => {
    const theme = resolved(live);
    const chrome = isDefaultTheme(theme)
      ? null
      : deriveChrome(theme, mode, { railStep, darkStrength });
    return {
      accountId: activeThemeAccount,
      theme,
      mode,
      chrome,
      assets: resolveAssets(live, activeThemeAccount),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, activeThemeAccount, mode, railStep, darkStrength, minimal]);
}

/**
 * Swaps an account's mark for its branding logo, light or dark by the surface
 * the mark sits on. Identity-preserving when there is nothing to swap, like
 * `applyBrand` — call it on the result of `applyBrand`, so a branding logo
 * wins and a settings-page upload is the fallback.
 *
 * Whose logo: the agency account wears `agency.assets`; a sub-account wears
 * only ITS override's logo (not the agency's — the rail would otherwise show
 * one agency logo on every tile).
 *
 * Safe outside <BrandingProvider>: returns the identity function.
 */
/**
 * Whether the sidebar and the rail are painted dark right now (Nov 26,
 * 2026) — what picks an account's dark-mode logo and icon.
 */
export function useSurfacesDark(): { sidebar: boolean; rail: boolean } {
  const ctx = useBrandingOptional();
  const { activeThemeAccount } = useTheme();
  const live = ctx?.live ?? null;
  const minimal = ctx?.proto.themeSet === "minimal";
  const railStep = ctx?.proto.railStep ?? "step";
  const darkStrength = ctx?.proto.darkStrength ?? "deep";
  const theme = live ? minimalTheme(resolveTheme(live, activeThemeAccount), !minimal) : null;
  const mode: Mode = useModeFor(theme);
  return React.useMemo(() => {
    if (!theme || isDefaultTheme(theme)) return { sidebar: mode === "dark", rail: mode === "dark" };
    const c = deriveChrome(theme, mode, { railStep, darkStrength });
    return { sidebar: !isLightSurface(c.sidebar.bg), rail: !isLightSurface(c.rail.bg) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, activeThemeAccount, mode, railStep, darkStrength, minimal]);
}

export function useBrandLogo(): (account: Account) => Account {
  const ctx = useBrandingOptional();
  const { effective, activeThemeAccount } = useTheme();
  const live = ctx?.live ?? null;
  const railStep = ctx?.proto.railStep ?? "step";
  const darkStrength = ctx?.proto.darkStrength ?? "deep";
  const mode: Mode = useModeFor(live ? resolveTheme(live, activeThemeAccount) : null);
  void effective;
  // Dark ground = the branded sidebar is dark, or (unbranded) the app is dark.
  const darkGround = React.useMemo(() => {
    if (!live) return mode === "dark";
    const theme = resolveTheme(live, activeThemeAccount);
    if (isDefaultTheme(theme)) return mode === "dark";
    return !isLightSurface(deriveChrome(theme, mode, { railStep, darkStrength }).sidebar.bg);
  }, [live, activeThemeAccount, mode, railStep, darkStrength]);

  return React.useCallback(
    (account: Account) => {
      if (!live) return account;
      const assets =
        account.id === AGENCY_ACCOUNT.id ? live.agency.assets : live.overrides[account.id]?.assets;
      if (!assets) return account;
      const src = darkGround
        ? assets.logoDark || assets.logoLight
        : assets.logoLight || assets.logoDark;
      if (!src || src === account.logoSrc) return account;
      return { ...account, logoSrc: src };
    },
    [live, darkGround],
  );
}

/* ---------------------------------------------------------------------- */
/* Tab title                                                               */
/* ---------------------------------------------------------------------- */

/**
 * "Contacts – Switchyard" → "Acme Marketing · Contacts". The product name goes:
 * white label replaces it rather than standing beside it.
 */
function decorateTitle(raw: string, prefix: string): string {
  const base = raw
    .replace(/\s+[–-]\s+Switchyard$/, "")
    .trim();
  if (!base || base === "Switchyard" || base === "Left nav prototype") return prefix;
  return `${prefix} · ${base}`;
}

/**
 * Prefixes the tab title while `prefix` is set.
 *
 * The shell owns `document.title` and re-asserts it with a MutationObserver
 * whenever <head> drifts from what it wrote (app-shell.tsx). A second observer
 * re-prefixing would fight that one forever, so instead the document's own
 * `title` accessor is shadowed: writes are decorated on the way in, and reads
 * hand back the undecorated value, so the shell sees exactly what it wrote and
 * stays quiet. Text Next writes straight into <title> is caught by an observer
 * here. Removed (and the plain title restored) on clear.
 */
function useTabTitle(prefix: string | undefined) {
  React.useEffect(() => {
    // Read here, not at module scope: this file is also evaluated on the server.
    const titleDesc = Object.getOwnPropertyDescriptor(Document.prototype, "title");
    if (!prefix || !titleDesc?.get || !titleDesc.set) return;
    const get = () => titleDesc.get!.call(document) as string;
    const set = (v: string) => titleDesc.set!.call(document, v);
    let raw = get();
    let shown = decorateTitle(raw, prefix);
    set(shown);

    Object.defineProperty(document, "title", {
      configurable: true,
      get: () => {
        const now = get();
        return now === shown ? raw : now;
      },
      set: (v: string) => {
        raw = String(v);
        shown = decorateTitle(raw, prefix);
        if (get() !== shown) set(shown);
      },
    });

    const observer = new MutationObserver(() => {
      const now = get();
      if (now === shown) return;
      raw = now;
      shown = decorateTitle(raw, prefix);
      set(shown);
    });
    observer.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => {
      observer.disconnect();
      delete (document as unknown as { title?: string }).title;
      if (get() === shown) set(raw);
    };
  }, [prefix]);
}

/* ---------------------------------------------------------------------- */
/* Favicon                                                                 */
/* ---------------------------------------------------------------------- */

/** Appended last in <head> so it outranks Next's own icon link; removed on clear. */
function useFavicon(href: string | undefined) {
  React.useEffect(() => {
    if (!href) return;
    const link = document.createElement("link");
    link.rel = "icon";
    link.href = href;
    link.setAttribute("data-branding-favicon", "");
    document.head.appendChild(link);
    return () => link.remove();
  }, [href]);
}

/* ---------------------------------------------------------------------- */
/* The applier                                                             */
/* ---------------------------------------------------------------------- */

/** The selected font's stylesheet, appended while it is in use. */
function useFontLink(fontId: string | null) {
  React.useEffect(() => {
    const href = fontId ? googleFontsHref([fontById(fontId)]) : null;
    if (!href) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-branding-font", "");
    document.head.appendChild(link);
    return () => link.remove();
  }, [fontId]);
}

/**
 * Color mode for the whole app (prototype control `modeScope: "app"`, off by
 * default). Drives the app's own light/dark while it is on and puts back what
 * was there when it goes off. ThemeState is not persisted, so ⌘R resets it
 * with the rest of branding.
 */
function useAppModeReach(want: Mode | null) {
  const t = useTheme();
  const prev = React.useRef<{ appTheme: typeof t.appTheme; darkMode: boolean } | null>(null);
  const { appTheme, darkMode, setAppTheme, setDarkMode } = t;
  React.useEffect(() => {
    if (want) {
      if (!prev.current) prev.current = { appTheme, darkMode };
      if (want === "dark" && !darkMode) setDarkMode(true);
      if (appTheme !== want) setAppTheme(want);
    } else if (prev.current) {
      const p = prev.current;
      prev.current = null;
      setAppTheme(p.appTheme);
      setDarkMode(p.darkMode);
    }
  }, [want, appTheme, darkMode, setAppTheme, setDarkMode]);
}

export function BrandingApplier(): null {
  const { chrome, mode, assets, theme } = useLiveChrome();
  const { proto } = useBranding();
  const written = React.useRef<string[]>([]);
  const fontId = chrome ? theme.font : null;
  const font = fontId ? fontById(fontId) : null;

  React.useEffect(() => {
    const root = document.documentElement;
    const clear = () => {
      for (const k of written.current) root.style.removeProperty(k);
      written.current = [];
      delete root.dataset.branding;
      delete root.dataset.brandingMode;
      delete root.dataset.brandingGradient;
      delete root.dataset.brandingFont;
    };
    if (!chrome) {
      clear();
      return;
    }
    const vars = cssVarsFor(chrome);
    if (chrome.gradient) vars["--brd-gradient"] = chrome.gradient;
    if (font && font.id !== "inter") vars["--brd-font"] = font.stack;
    const keys = Object.keys(vars);
    for (const k of written.current) if (!(k in vars)) root.style.removeProperty(k);
    for (const k of keys) root.style.setProperty(k, vars[k]!);
    written.current = keys;
    root.dataset.branding = "on";
    root.dataset.brandingMode = mode;
    if (chrome.gradient) root.dataset.brandingGradient = "on";
    else delete root.dataset.brandingGradient;
    if (font && font.id !== "inter") root.dataset.brandingFont = proto.fontScope;
    else delete root.dataset.brandingFont;
  }, [chrome, mode, font, proto.fontScope]);

  /*
   * Extended theme (Nov 24, 2026): row font size, text color, icon color, and
   * radius. Independent of `chrome`, so they also work on the platform
   * default theme. One flag per property — an unset one leaves the nav's own
   * value alone (see branding.css "Extended theme").
   */
  const extras = proto.themeSet === "extended" || proto.themeSet === "advanced" ? theme.extras : undefined;
  const fontSize = extras?.fontSize, textColor = extras?.textColor;
  const iconColor = extras?.iconColor, radius = extras?.radius;
  React.useEffect(() => {
    const root = document.documentElement;
    const set = (flag: string, prop: string, v: string | undefined) => {
      if (v === undefined) {
        delete root.dataset[flag];
        root.style.removeProperty(prop);
      } else {
        root.dataset[flag] = "";
        root.style.setProperty(prop, v);
      }
    };
    set("brxFont", "--brx-font", fontSize === undefined ? undefined : `${fontSize}px`);
    set("brxFg", "--brx-fg", textColor);
    set("brxIcon", "--brx-icon", iconColor);
    set("brxRadius", "--brx-radius", radius === undefined ? undefined : `${radius}px`);
    return () => {
      for (const [f, prop] of [["brxFont", "--brx-font"], ["brxFg", "--brx-fg"], ["brxIcon", "--brx-icon"], ["brxRadius", "--brx-radius"]] as const) {
        delete root.dataset[f];
        root.style.removeProperty(prop);
      }
    };
  }, [fontSize, textColor, iconColor, radius]);

  // Border round uploaded sidebar icons (proto iconEdge, Nov 25, 2026).
  const iconEdge = proto.iconEdge;
  React.useEffect(() => {
    const root = document.documentElement;
    if (iconEdge === "none") root.style.removeProperty("--icon-edge");
    else root.style.setProperty("--icon-edge", `var(--hr-${iconEdge})`);
    return () => {
      root.style.removeProperty("--icon-edge");
    };
  }, [iconEdge]);

  // Unmount: leave the document as it found it.
  React.useEffect(
    () => () => {
      const root = document.documentElement;
      for (const k of written.current) root.style.removeProperty(k);
      delete root.dataset.branding;
      delete root.dataset.brandingMode;
      delete root.dataset.brandingGradient;
      delete root.dataset.brandingFont;
    },
    [],
  );

  useFontLink(fontId);
  useAppModeReach(chrome && proto.modeScope === "app" ? mode : null);

  useTabTitle(assets.tabTitle?.trim() || undefined);
  useFavicon(assets.favicon || undefined);
  return null;
}
