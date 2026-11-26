/**
 * Agency branding — the contract every branding surface builds on (Nov 18).
 *
 * Phase 1 of the Agency Customizer covers the first four branding items:
 *
 *   1. Logo         light + dark, per sub-account if needed
 *   2. Browser tab  favicon + tab title, per sub-account
 *   3. Brand colours one or two hexes; we derive every shade
 *   4. Chrome       sidebar, sub-account rail and top bar: light, brand or dark
 *
 * Decisions (Ashwin, Nov 18):
 *   - Only an agency on the $497 plan (Agency Pro / `elite`) with edit access
 *     can change it. Sub-accounts never pick; the agency can override per
 *     sub-account.
 *   - The brand colour reaches the chrome only — the rail, sidebar and top bar,
 *     including the buttons that live in them (edit-mode Done, top-bar
 *     controls). The PRIMARY BUTTON ON THE CANVAS IS NOT BRANDED in phase 1.
 *   - Low contrast warns, never auto-fixes. Text colour on a surface is still
 *     picked (white or near-black, whichever reads better) — that is how the
 *     surface works, not a fix — but an accent that fails is left as chosen and
 *     reported.
 *   - "Style together" is the default: one chrome style for all three surfaces.
 *     Unticked, each surface takes its own.
 *   - Light and dark come from one input: keep the hue, move the lightness
 *     (Slack's approach). Brand chrome in dark mode sinks to L ≤ 17%; the
 *     accent lifts to L ≥ 62% so it still reads on a dark surface.
 *
 * Pure module: no React, no DOM. `design/` imports nothing back.
 */

/* ---------------------------------------------------------------------- */
/* Types                                                                   */
/* ---------------------------------------------------------------------- */

export type ChromeStyle = "light" | "brand" | "dark" | "custom";

export const CHROME_STYLES: readonly ChromeStyle[] = [
  "light",
  "brand",
  "dark",
  "custom",
];

export const CHROME_STYLE_LABELS: Record<ChromeStyle, string> = {
  light: "Light",
  brand: "Brand",
  dark: "Dark",
  custom: "Custom",
};

export type ChromeSurface = "rail" | "sidebar" | "topbar";

export const CHROME_SURFACES: readonly ChromeSurface[] = [
  "rail",
  "sidebar",
  "topbar",
];

export const CHROME_SURFACE_LABELS: Record<ChromeSurface, string> = {
  rail: "Sub-account rail",
  sidebar: "Sidebar",
  topbar: "Top bar",
};

export interface SurfaceChoice {
  style: ChromeStyle;
  /** Only read when `style === "custom"`. */
  hex?: string;
}

/** Color mode (Nov 19). "system" follows the device. */
export type Appearance = "light" | "dark" | "system";
export const APPEARANCES: readonly Appearance[] = ["light", "dark", "system"];
export const APPEARANCE_LABELS: Record<Appearance, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

/** Hand-set colours per mode, from the Custom theme tab or a theme code. */
export type FineKey = "sidebar" | "accent" | "rail" | "topbar";
export type FineTune = Partial<Record<Mode, Partial<Record<FineKey, string>>>>;

export interface BrandingTheme {
  /** Light / dark / follow the device. Chrome only unless proto.modeScope = "app". */
  appearance: Appearance;
  /** One gradient across the rail, sidebar, and top bar. */
  gradient: boolean;
  /** BRAND_FONTS id. Chrome only unless proto.fontScope = "app". */
  font: string;
  /**
   * Exact colours that win over the derived ones, per mode (Nov 19). Empty =
   * everything follows `brand`. Presets from the Nov 19 set carry all six.
   */
  fine: FineTune;
  /** The preset this came from, or null once anything was edited by hand. */
  presetId: string | null;
  /** The brand colour. Drives the ramp, `brand` chrome and the default accent. */
  brand: string;
  /** Optional second colour: selected states, rail ring, chrome buttons. */
  accent: string | null;
  /** True (default): one `chrome` choice for all three surfaces. */
  together: boolean;
  /** The shared choice, used while `together`. */
  chrome: SurfaceChoice;
  /** Per-surface choices, used while `!together`. */
  surfaces: Record<ChromeSurface, SurfaceChoice>;
  /** Extended theme only (Nov 24, 2026). See ThemeExtras. */
  extras?: ThemeExtras;
}

export interface BrandAssets {
  /** Data URLs (uploads) or public paths. Absent = platform default. */
  logoLight?: string;
  logoDark?: string;
  favicon?: string;
  /** Tab title prefix, e.g. "Acme Marketing" → "Acme Marketing · Contacts". */
  tabTitle?: string;
}

export interface AgencyBranding {
  theme: BrandingTheme;
  assets: BrandAssets;
}

/**
 * What the agency set for ONE sub-account. Per field: anything absent falls
 * through to the agency default. `theme` absent = "Use agency theme".
 */
export interface SubAccountBranding {
  theme?: BrandingTheme;
  assets?: BrandAssets;
}

export interface BrandingState {
  agency: AgencyBranding;
  /**
   * Per sub-account. `theme` here is the account's OWN theme — set when a
   * layout carrying a theme is applied to it, or when it is edited in place —
   * exactly like the account's own nav arrangement. `assets` are per-account
   * logo / favicon / title overrides set on the Settings › Branding page.
   */
  overrides: Record<string, SubAccountBranding>;
  /**
   * Themes carried by layouts (nav templates), keyed by template id (Nov 18).
   *
   * Mirrors how a layout carries an arrangement, with no change to the layout
   * flow: applying a layout copies its theme onto the account
   * (overrides[id].theme); saving an account into a layout ("Save to <layout>"
   * / "Save as new layout") captures the account's theme into it. Absent = the
   * layout carries no theme, and applying it leaves the account's theme alone.
   * The HighLevel default layout never carries one.
   */
  layoutThemes: Record<string, BrandingTheme>;
}

/* ---------------------------------------------------------------------- */
/* Presets                                                                 */
/* ---------------------------------------------------------------------- */

export interface BrandingPreset {
  id: string;
  label: string;
  brand: string;
  accent: string | null;
  chrome: ChromeStyle;
  /** Exact light + dark colours (the Nov 19 set). */
  fine?: FineTune;
}

const fine6 = (
  l: [string, string, string],
  d: [string, string, string],
): FineTune => ({
  light: { sidebar: l[0], accent: l[1], rail: l[2] },
  dark: { sidebar: d[0], accent: d[1], rail: d[2] },
});

/**
 * Preset colours: the rail IS the sidebar (Ashwin, Nov 19). Only a custom
 * theme (fine-tune or a pasted code) gives the rail a colour of its own.
 */
const presetFine = (l: [string, string, string], d: [string, string, string]): FineTune =>
  fine6([l[0], l[1], l[0]], [d[0], d[1], d[0]]);

/** BRAND_FONTS id of the platform font. Up here: presets read it at module load. */
export const DEFAULT_FONT_ID = "inter";

/**
 * The theme set (redone Nov 24). Each theme is a hand-picked pair per mode —
 * sidebar + accent for light, sidebar + accent for dark — not one brand
 * colour pushed through maths, which is what made the first sets read as
 * generated.
 *
 * Two families, the way Slack, Apple, and shadcn each split theirs:
 *
 *   Calm     near-white sidebars with the faintest tint (L 95–97, low
 *            chroma), and a deep accent (the 700–800 step) for the selected
 *            row's text and tint. Quiet enough to live with all day.
 *   Bold     the sidebar IS the colour — deep, saturated, Slack-style — with
 *            white ink, and a light, clean accent for the indicators.
 *
 * Dark mode is never an inversion: every theme gets its own deep, tinted
 * dark sidebar (L 6–13) and a lifted accent that clears 3:1 on it.
 *
 * Rail = sidebar on every preset (Ashwin, Nov 19).
 */
export const BRANDING_PRESETS: readonly BrandingPreset[] = [
  // First two rows (shown before "Show more") mix calm and bold, so the
  // range is visible at a glance. Calm: near-white + deep accent. Bold: the
  // sidebar is the colour, with a light accent.
  { id: "highrise", label: "Default", brand: "#155eef", accent: null, chrome: "light" },
  { id: "mist", label: "Mist", brand: "#1d4f91", accent: "#1d4f91", chrome: "brand",
    fine: presetFine(["#edf3fa", "#1d4f91", ""], ["#0b1726", "#8db6ec", ""]) },
  { id: "plum", label: "Plum", brand: "#3f0e40", accent: "#e1b3e2", chrome: "brand",
    fine: presetFine(["#3f0e40", "#e1b3e2", ""], ["#1e081f", "#e1b3e2", ""]) },
  { id: "sage", label: "Sage", brand: "#2f5d3a", accent: "#2f5d3a", chrome: "brand",
    fine: presetFine(["#eef3ee", "#2f5d3a", ""], ["#0f1b13", "#8cc59b", ""]) },
  { id: "midnight", label: "Midnight", brand: "#1c2433", accent: "#86aefc", chrome: "brand",
    fine: presetFine(["#1c2433", "#86aefc", ""], ["#0e131c", "#86aefc", ""]) },
  { id: "lavender", label: "Lavender", brand: "#553c9a", accent: "#553c9a", chrome: "brand",
    fine: presetFine(["#f3f0fa", "#553c9a", ""], ["#16112a", "#b8a5f0", ""]) },
  { id: "forest", label: "Forest", brand: "#163a2b", accent: "#86d3ac", chrome: "brand",
    fine: presetFine(["#163a2b", "#86d3ac", ""], ["#0b1d15", "#86d3ac", ""]) },
  { id: "slate", label: "Slate", brand: "#1e293b", accent: "#1e293b", chrome: "brand",
    fine: presetFine(["#f1f5f9", "#1e293b", ""], ["#0f172a", "#94a3b8", ""]) },
  { id: "zinc", label: "Zinc", brand: "#18181b", accent: "#18181b", chrome: "brand",
    fine: presetFine(["#f4f4f5", "#18181b", ""], ["#18181b", "#d4d4d8", ""]) },
  { id: "blush", label: "Blush", brand: "#9f1239", accent: "#9f1239", chrome: "brand",
    fine: presetFine(["#fbf0f2", "#9f1239", ""], ["#200b10", "#f9a8b8", ""]) },
  { id: "indigo", label: "Indigo", brand: "#24275a", accent: "#a9b4fb", chrome: "brand",
    fine: presetFine(["#24275a", "#a9b4fb", ""], ["#121430", "#a9b4fb", ""]) },
  { id: "sand", label: "Sand", brand: "#57401f", accent: "#7a4a12", chrome: "brand",
    fine: presetFine(["#f6f2ea", "#7a4a12", ""], ["#1b160f", "#e2bd7e", ""]) },
  { id: "lagoon", label: "Lagoon", brand: "#0d3b47", accent: "#79d4e2", chrome: "brand",
    fine: presetFine(["#0d3b47", "#79d4e2", ""], ["#071f26", "#79d4e2", ""]) },
  { id: "apricot", label: "Apricot", brand: "#9a3412", accent: "#9a3412", chrome: "brand",
    fine: presetFine(["#fcf2ea", "#9a3412", ""], ["#1f1109", "#fdba8c", ""]) },
  { id: "oxblood", label: "Oxblood", brand: "#4a1219", accent: "#f2a9b0", chrome: "brand",
    fine: presetFine(["#4a1219", "#f2a9b0", ""], ["#250a0d", "#f2a9b0", ""]) },
  { id: "espresso", label: "Espresso", brand: "#2e221b", accent: "#e3c19b", chrome: "brand",
    fine: presetFine(["#2e221b", "#e3c19b", ""], ["#17110d", "#e3c19b", ""]) },
  { id: "ink", label: "Ink", brand: "#111113", accent: "#e4e4e7", chrome: "brand",
    fine: presetFine(["#111113", "#e4e4e7", ""], ["#09090b", "#e4e4e7", ""]) },
];

export function themeFromPreset(p: BrandingPreset): BrandingTheme {
  return {
    appearance: "light",
    gradient: false,
    font: DEFAULT_FONT_ID,
    fine: p.fine ?? {},
    presetId: p.id,
    brand: p.brand,
    accent: p.accent,
    together: true,
    chrome: { style: p.chrome },
    surfaces: { rail: { style: p.chrome }, sidebar: { style: p.chrome }, topbar: { style: p.chrome } },
  };
}

/** Picking a preset swaps the colours only: color mode, gradient, and font stay. */
export function applyPreset(theme: BrandingTheme, p: BrandingPreset): BrandingTheme {
  return {
    ...themeFromPreset(p),
    appearance: theme.appearance,
    gradient: theme.gradient,
    font: theme.font,
    ...(theme.extras ? { extras: theme.extras } : {}),
  };
}

export const DEFAULT_THEME: BrandingTheme = themeFromPreset(BRANDING_PRESETS[0]!);

export const DEFAULT_BRANDING: BrandingState = {
  agency: { theme: DEFAULT_THEME, assets: {} },
  overrides: {},
  layoutThemes: {},
};

/**
 * Agency-wide save (proto.saveTarget "agency"): the agency theme becomes
 * `theme` and no sub-account keeps a theme of its own.
 */
export function withAgencyTheme(s: BrandingState, theme: BrandingTheme): BrandingState {
  const overrides: Record<string, SubAccountBranding> = {};
  for (const [id, o] of Object.entries(s.overrides)) {
    const { theme: _drop, ...rest } = o;
    void _drop;
    overrides[id] = rest;
  }
  return { ...s, agency: { ...s.agency, theme }, overrides };
}

/** True when a theme is the untouched platform default — apply nothing. */
export function isDefaultTheme(t: BrandingTheme): boolean {
  return (
    t.presetId === "highrise" &&
    t.together &&
    t.appearance === "light" &&
    !t.gradient &&
    t.font === DEFAULT_FONT_ID &&
    Object.keys(t.fine ?? {}).length === 0
  );
}

/* ---------------------------------------------------------------------- */
/* Prototype-only axes (prototype controls → Branding)                     */
/* ---------------------------------------------------------------------- */

/** The three doors into branding. Settings page is always the home. */
export interface BrandingEntryPoints {
  /** A — Settings › Branding page. */
  settingsPage: boolean;
  /** B — "Customize" side panel over the app (Slack-style, applies instantly). */
  customizePanel: boolean;
  /** C — palette button in nav edit mode. */
  editPalette: boolean;
}

export type CustomizePanelEntry = "agency-menu" | "edit-mode" | "top-bar";
export const CUSTOMIZE_PANEL_ENTRIES: readonly CustomizePanelEntry[] = ["agency-menu", "edit-mode", "top-bar"];
export const CUSTOMIZE_PANEL_ENTRY_LABELS: Record<CustomizePanelEntry, string> = {
  "agency-menu": "Agency menu",
  "edit-mode": "Nav edit mode",
  "top-bar": "Top bar icon",
};

export type BrandingAccess = "edit" | "view";
export const BRANDING_ACCESS_LABELS: Record<BrandingAccess, string> = {
  edit: "Edit access",
  view: "View only",
};

/** Settings page preview: the real app chrome, or a mock inside the page. */
export type BrandingPreviewTarget = "live" | "inline";
export const BRANDING_PREVIEW_TARGET_LABELS: Record<BrandingPreviewTarget, string> = {
  live: "Live app",
  inline: "Inline mock",
};

/** Under `together`, whether the rail sits one step off the sidebar. */
export type RailStep = "step" | "same";
export const RAIL_STEP_LABELS: Record<RailStep, string> = {
  step: "One step off",
  same: "Same as sidebar",
};

/** How brand chrome looks in dark mode. */
export type DarkStrength = "deep" | "tinted";
export const DARK_STRENGTH_LABELS: Record<DarkStrength, string> = {
  deep: "Deep brand",
  tinted: "Tinted neutral",
};

/** What the settings page does with unsaved edits. */
export type UnsavedUi = "bar-and-modal" | "modal";
export const UNSAVED_UI_LABELS: Record<UnsavedUi, string> = {
  "bar-and-modal": "Save bar + leave prompt",
  modal: "Leave prompt only",
};

/** Color mode / font reach: just the chrome (default) or the whole app. */
export type BrandingReach = "chrome" | "app";
export const BRANDING_REACH_LABELS: Record<BrandingReach, string> = {
  chrome: "Sidebar, rail, top bar",
  app: "Whole app",
};

/**
 * Where a saved theme goes (Nov 19). "agency" (default): one theme for the
 * agency and every sub-account under it. "layout": themes ride on layouts,
 * the Nov 18 behaviour.
 */
export type BrandingSaveTarget = "agency" | "layout";
export const BRANDING_SAVE_TARGET_LABELS: Record<BrandingSaveTarget, string> = {
  agency: "Agency-wide",
  layout: "With layouts",
};

/** What the nav's Edit pill does (Nov 19). */
export type EditEntry = "direct" | "speed-dial";
export const EDIT_ENTRY_LABELS: Record<EditEntry, string> = {
  direct: "Straight to edit mode",
  "speed-dial": "Speed dial",
};

/** How the speed dial's options look (Nov 19). */
export type SpeedDialStyle = "buttons" | "menu";
export const SPEED_DIAL_STYLE_LABELS: Record<SpeedDialStyle, string> = {
  buttons: "Stacked buttons",
  menu: "Dropdown menu",
};

export type SpeedDialDir = "auto" | "above" | "below";
export const SPEED_DIAL_DIR_LABELS: Record<SpeedDialDir, string> = {
  auto: "Above if room",
  above: "Always above",
  below: "Always below",
};

/** The Edit pill's label. "auto" = the existing rule (Edit / Edit nav). */
export type EditLabel = "auto" | "edit" | "edit-nav" | "edit-layout" | "customize" | "customize-nav" | "personalize";
export const EDIT_LABELS: readonly EditLabel[] = ["auto", "edit", "edit-nav", "edit-layout", "customize", "customize-nav", "personalize"];
export const EDIT_LABEL_TEXT: Record<EditLabel, string> = {
  auto: "Auto",
  edit: "Edit",
  "edit-nav": "Edit nav",
  "edit-layout": "Edit layout",
  customize: "Customize",
  "customize-nav": "Customize nav",
  personalize: "Personalize",
};

/** Where "Customize theme" goes (Nov 19). */
export type CustomizeTarget = "modal" | "popover" | "panel" | "white-label-section" | "branding-tab" | "settings-page";
export const CUSTOMIZE_TARGETS: readonly CustomizeTarget[] = ["modal", "popover", "panel", "white-label-section", "branding-tab", "settings-page"];
export const CUSTOMIZE_TARGET_LABELS: Record<CustomizeTarget, string> = {
  modal: "Modal",
  popover: "Popover beside button",
  panel: "Side panel",
  "white-label-section": "White label section",
  "branding-tab": "Tab beside White label",
  "settings-page": "Settings › Branding",
};

/** The modal's way out to White label (Nov 19). */
export type MoreOptionsLabel = "logo-css" | "more-options" | "white-label";
export const MORE_OPTIONS_LABELS: Record<MoreOptionsLabel, string> = {
  "logo-css": "Logo, CSS, and more",
  "more-options": "More options",
  "white-label": "White label settings",
};

/**
 * How many themes agencies get (Nov 24, 2026, Ashwin).
 *
 *  minimal  The default. 6–8 light themes — up to 2 built from the agency's
 *           logo, the rest curated — and nothing else: no light / dark /
 *           system mode, no font, no window gradient. Custom theme stays.
 *  full     Every preset, color mode, font, and gradient.
 */
/**
 * The White label section's footer-left control (Nov 24, 2026, Ashwin).
 *  toggle  The default. A "Customizations" switch: off previews the default
 *          theme without saving, on brings your edits back.
 *  button  "Reset to default", as before.
 */
export type ResetControl = "toggle" | "button";
export const RESET_CONTROL_LABELS: Record<ResetControl, string> = {
  toggle: "Preview toggle",
  button: "Reset button",
};

/**
 * Full logo guidelines (Nov 24, 2026, Ashwin): do's and don'ts.
 *  logoGuide            White label / Business profile: the "Logo
 *                       guidelines" button opens a modal or an accordion.
 *  onboardingLogoGuide  Onboarding's Logos step: always shown under the Full
 *                       logo row, or behind the same button (modal).
 */
export type LogoGuide = "modal" | "accordion";
export const LOGO_GUIDE_LABELS: Record<LogoGuide, string> = {
  modal: "Modal",
  accordion: "Accordion",
};
export type OnboardingLogoGuide = "accordion" | "split" | "inline" | "below" | "button";
export const ONBOARDING_LOGO_GUIDE_LABELS: Record<OnboardingLogoGuide, string> = {
  accordion: "One accordion",
  split: "Do's and don'ts accordions",
  inline: "Always shown",
  below: "Below both rows",
  button: "Behind a button",
};

/**
 * What a sub-account's logo uploads do to its sidebar (Nov 25, 2026, Ashwin).
 *  update  The default: the full logo, sidebar icon, and avatar show in the
 *          sidebar, rail, and header as soon as they are saved.
 *  keep    Saved on Business profile, but the sidebar stays as it is.
 */
/**
 * A sub-account header once it has a full logo (Nov 25, 2026, Ashwin):
 *  logo  The full logo replaces the name.
 *  both  The default. The full logo, with the name under it, above search.
 *  name  The name only, as text.
 */
export type SubHeaderShows = "logo" | "both" | "name";
export const SUB_HEADER_SHOWS_LABELS: Record<SubHeaderShows, string> = {
  logo: "Logo only",
  both: "Logo and name",
  name: "Name only",
};

/**
 * "Logo and name" arrangement (Nov 25, 2026, Ashwin):
 *  name-top  The name above the logo.
 *  logo-top  The logo above the name (the default, as first built).
 *  side      Side by side; the name truncates, full name on hover.
 */
export type SubHeaderLayout = "name-top" | "logo-top" | "side";
export const SUB_HEADER_LAYOUT_LABELS: Record<SubHeaderLayout, string> = {
  "name-top": "Name above logo",
  "logo-top": "Logo above name",
  side: "Side by side",
};

/**
 * The "We adjusted your logo" message (Nov 25, 2026, Ashwin) — shown when
 * "Fix logo edge cases" changed an upload.
 *  placement  below the row's text, below the whole row (default), or hidden
 *  style      text, tag, info callout (default), success alert, neutral note
 *  fixBadge   a wand badge on the preview's corner (default on)
 *  fixTooltip the message on hover over that badge (default off)
 */
export type FixNotePlacement = "text" | "row" | "none";
export const FIX_NOTE_PLACEMENT_LABELS: Record<FixNotePlacement, string> = {
  text: "Below text",
  row: "Below row",
  none: "Hidden",
};
export type FixNoteStyle = "text" | "tag" | "callout" | "success" | "neutral";
export const FIX_NOTE_STYLE_LABELS: Record<FixNoteStyle, string> = {
  text: "Text",
  tag: "Tag",
  callout: "Callout",
  success: "Success",
  neutral: "Neutral",
};

/**
 * A hairline round uploaded sidebar icons, agency and sub-account (Nov 25,
 * 2026, Ashwin): so a transparent, white, or pale icon keeps its edge.
 */
export type IconEdge = "none" | "gray-50" | "gray-100" | "gray-200";
export const ICON_EDGE_LABELS: Record<IconEdge, string> = {
  none: "None",
  "gray-50": "Gray 50",
  "gray-100": "Gray 100",
  "gray-200": "Gray 200",
};

/**
 * A sample full logo for the sub-account header (Nov 26, 2026, Ashwin), to
 * settle the logo width against real shapes before an upload exists. "off"
 * shows whatever the account really has. Prototype only — goes once the
 * width is locked.
 */
export type TestLogo = "off" | "8x1" | "6x1" | "4x1" | "3x1" | "2x1";
export const TEST_LOGO_LABELS: Record<TestLogo, string> = {
  off: "Off",
  "8x1": "8:1",
  "6x1": "6:1",
  "4x1": "4:1",
  "3x1": "3:1",
  "2x1": "2:1",
};
export const TEST_LOGO_SRC: Record<Exclude<TestLogo, "off">, string> = {
  "8x1": "/test-logo-8x1.svg",
  "6x1": "/test-logo-6x1.svg",
  "4x1": "/test-logo-4x1.svg",
  "3x1": "/test-logo-3x1.svg",
  "2x1": "/test-logo-2x1.svg",
};

/**
 * How wide a full logo is drawn in the sidebar header, agency and
 * sub-account (Nov 26, 2026, Ashwin). "auto" is the earlier rule (same
 * visual weight, 16–28px tall, up to 168px). A number is the box the logo
 * fills: width first, height following the aspect, capped at 40px so a
 * squarer logo stops growing. Once one is picked it becomes the only rule.
 */
export type LogoWidth = "auto" | "120" | "140" | "160" | "180" | "200";
export const LOGO_WIDTH_LABELS: Record<LogoWidth, string> = {
  auto: "Auto",
  "120": "120px",
  "140": "140px",
  "160": "160px",
  "180": "180px",
  "200": "200px",
};
export type WlSections = "open" | "fold" | "accordion";
export const WL_SECTIONS_LABELS: Record<WlSections, string> = {
  open: "All open",
  fold: "Fold others",
  accordion: "Accordions",
};
export type WlNav = "none" | "side" | "tabs";
export const WL_NAV_LABELS: Record<WlNav, string> = { none: "None", side: "Scroll", tabs: "Tabs" };
/** Where a White label section's Save and Cancel sit (Nov 26, 2026). */
/** How the Logo check offers the guidelines once a logo is uploaded (Nov 26, 2026). */
export type CheckGuide = "tooltip" | "button" | "off";
export const CHECK_GUIDE_LABELS: Record<CheckGuide, string> = { tooltip: "Info tooltip", button: "Show guidelines button", off: "Hidden" };
/** Brand assets as cards, or open rows split by dividers (Nov 26, 2026). */
export type AssetFrame = "dividers" | "cards";
export const ASSET_FRAME_LABELS: Record<AssetFrame, string> = { dividers: "Dividers", cards: "Cards" };
export type WlSavePlace = "bottom" | "top";
export const WL_SAVE_PLACE_LABELS: Record<WlSavePlace, string> = { bottom: "Bottom of section", top: "Section header" };
/** Height cap under a fixed logo width. */
/**
 * Height cap under a fixed logo width: the original 28px (Nov 26, 2026).
 * The box got wider; the logo must not get taller with it.
 */
export const LOGO_MAX_HEIGHT = 28;

export type SubHeaderLogo = "agency" | "sub";
export const SUB_HEADER_LOGO_LABELS: Record<SubHeaderLogo, string> = {
  agency: "Agency logo",
  sub: "Sub-account logo",
};

export type SubLogoUploads = "update" | "keep";
export const SUB_LOGO_UPLOADS_LABELS: Record<SubLogoUploads, string> = {
  update: "Update sidebar",
  keep: "Keep sidebar as is",
};

export type ThemeSet = "minimal" | "full" | "extended" | "advanced";
export const THEME_SET_LABELS: Record<ThemeSet, string> = {
  minimal: "Minimal",
  full: "Full",
  extended: "Extended",
  advanced: "Advanced",
};

/**
 * Advanced (Nov 25, 2026, Ashwin): Minimal until "Advanced options" is
 * pressed, then everything — all themes, color mode, gradient, font, and the
 * Extended fields. They open in place below the button (default) or in a
 * modal, in onboarding, White label, and the theme modals alike.
 */
export type AdvancedOpens = "inline" | "modal";
export const ADVANCED_OPENS_LABELS: Record<AdvancedOpens, string> = {
  inline: "Expand below",
  modal: "Modal",
};

/**
 * Extended theme (Nov 24, 2026, Ashwin): Full, plus finer control of the
 * sidebar rows — font size, text color, icon color, and corner radius. Each
 * is optional; unset keeps the platform's own value. Painted only while the
 * prototype control "Theme options" is Extended.
 */
export interface ThemeExtras {
  /** Row label size, px. */
  fontSize?: number;
  /** Row label color. */
  textColor?: string;
  /** Row icon color. */
  iconColor?: string;
  /** Row corner radius, px. */
  radius?: number;
}
export const EXTRA_FONT_SIZES = [13, 14, 15, 16] as const;
export const EXTRA_RADII = [0, 4, 7, 10, 16] as const;

/** Curated light presets for the minimal set, in order. Filled to 8 after logo themes. */
export const MINIMAL_PRESET_IDS = [
  "highrise",
  "mist",
  "sage",
  "lavender",
  "blush",
  "slate",
  "apricot",
  "sand",
] as const;
export const MINIMAL_MAX_THEMES = 8;

/**
 * Shape of the sidebar icon's preview on White label, Business profile, and
 * onboarding (Nov 24, 2026, Ashwin): a circle by default, so the icon reads
 * as the account's avatar. Square is the comparison.
 */
export type IconShape = "circle" | "square";
export const ICON_SHAPE_LABELS: Record<IconShape, string> = {
  circle: "Circle",
  square: "Square",
};

export type AvatarStyle = "solid" | "gradient";
export const AVATAR_STYLE_LABELS: Record<AvatarStyle, string> = {
  solid: "Solid color",
  gradient: "Gradient",
};
export type LayoutThemeMode = "separate" | "combined";
export const LAYOUT_THEME_LABELS: Record<LayoutThemeMode, string> = {
  separate: "Separate",
  combined: "Combined",
};
export type CombinedTheme = "edit-card" | "current";
export const COMBINED_THEME_LABELS: Record<CombinedTheme, string> = {
  "edit-card": "Edit card icon",
  current: "As it is now",
};
export type PaletteOpens = "inline" | "door";
export const PALETTE_OPENS_LABELS: Record<PaletteOpens, string> = {
  inline: "Inline in edit mode",
  door: "Customize theme door",
};
export type ApplyScope = "all" | "ask";
export const APPLY_SCOPE_LABELS: Record<ApplyScope, string> = {
  all: "All sub-accounts",
  ask: "Ask: all or selected",
};
export type OnboardingThemeStep = "themes" | "full";
export const ONBOARDING_THEME_STEP_LABELS: Record<OnboardingThemeStep, string> = {
  themes: "Themes only",
  full: "Full controls",
};
export type OnboardingStyle = "stepper" | "split";
export const ONBOARDING_STYLE_LABELS: Record<OnboardingStyle, string> = {
  stepper: "Stepper",
  split: "Split preview",
};
export type IconDisplay = "logo" | "avatar";
export const ICON_DISPLAY_LABELS: Record<IconDisplay, string> = {
  logo: "Uploaded icon",
  avatar: "Avatar",
};
export type PriorLogos = "full" | "none";
export const PRIOR_LOGOS_LABELS: Record<PriorLogos, string> = {
  full: "Full logo only",
  none: "No logos",
};

export interface BrandingProto {
  editEntry: EditEntry;
  speedDialStyle: SpeedDialStyle;
  speedDialDir: SpeedDialDir;
  editLabel: EditLabel;
  customizeTarget: CustomizeTarget;
  moreOptions: MoreOptionsLabel;
  /**
   * White label section / Branding tab: "Save and apply" asks first, since
   * the theme reaches every sub-account (Ashwin, Nov 20). On by default.
   */
  applyConfirm: boolean;
  /**
   * Switchyard onboarding (Nov 20): when the agency owner turns Switchyard on
   * in Agency › Labs, a setup modal walks them through logos and theme.
   * Off by default.
   */
  onboarding: boolean;
  /**
   * Layout and theme (Nov 24): Separate (Edit offers "Edit layout" and
   * "Customize theme") or Combined (one Edit button; the theme lives in the
   * edit session).
   */
  layoutTheme: LayoutThemeMode;
  /** Combined only: the theme on the edit card's colour icon, or where it is today. */
  combinedTheme: CombinedTheme;
  /** Combined + edit card: the colour icon opens inline, or the Customize theme door. */
  paletteOpens: PaletteOpens;
  /** Saving an agency theme: always all sub-accounts, or ask all / selected. */
  applyScope: ApplyScope;
  /** Onboarding's Theme step: just the themes, or every control White label has. */
  onboardingThemeStep: OnboardingThemeStep;
  /** Onboarding's look (Nov 23): step list + preview, or card + big preview. */
  onboardingStyle: OnboardingStyle;
  /**
   * Sidebar icon shows (Nov 24): the uploaded square logo, or always the
   * initials avatar. With no upload it is the avatar either way.
   */
  iconDisplay: IconDisplay;
  /** No square icon: initials on a solid colour from the logo, or a gradient. */
  avatarStyle: AvatarStyle;
  /** Agency sidebar icon preview shape (square by default, like its rail mark). */
  agencyIconShape: IconShape;
  /** Sub-account sidebar icon preview shape (circle, like the rail avatars). */
  subIconShape: IconShape;
  /** Border round uploaded sidebar icons. See IconEdge. */
  iconEdge: IconEdge;
  /** Minimal (6–8 light themes, no mode / font / gradient) or Full. See ThemeSet. */
  themeSet: ThemeSet;
  /** Advanced theme set: options expand below, or open a modal. */
  advancedOpens: AdvancedOpens;
  /** White label footer: preview-default toggle or Reset button. See ResetControl. */
  resetControl: ResetControl;
  /** Settings: Logo guidelines open as a modal or an accordion. See LogoGuide. */
  logoGuide: LogoGuide;
  /** Onboarding: logo guidelines always shown, or behind a button. */
  onboardingLogoGuide: OnboardingLogoGuide;
  /**
   * Logo guidelines (Nov 25, 2026): on (default) shows the do's and don'ts in
   * onboarding and on White label / Business profile; off hides them.
   */
  logoGuides: boolean;
  /**
   * White label sections (Nov 26, 2026): all open, every section but Brand
   * and Theme folded, or every section a full accordion.
   */
  wlSections: WlSections;
  /** White label: a vertical section menu that scrolls to each section. */
  wlNav: WlNav;
  wlSavePlace: WlSavePlace;
  checkGuide: CheckGuide;
  assetFrame: AssetFrame;
  /** Light and dark logo slots, agency (Nov 26, 2026). On by default. */
  darkLogosAgency: boolean;
  /** Light and dark logo slots, sub-accounts. Off by default. */
  darkLogosSub: boolean;
  /** Crop step on upload: Upload opens a crop modal; no drag and drop on the row. */
  logoCrop: boolean;
  /**
   * Fix logo edge cases ourselves (Nov 25, 2026): light or dark logos get a
   * contrasting plate, logos on their own box get rounded with a hairline,
   * tall logos get a taller row. Off by default.
   */
  logoAutoFix: boolean;
  /** Where "We adjusted your logo" shows. See FixNotePlacement. */
  fixNotePlacement: FixNotePlacement;
  /** How it looks. See FixNoteStyle. */
  fixNoteStyle: FixNoteStyle;
  /** A wand badge on the adjusted logo's corner. */
  fixBadge: boolean;
  /** The message as a tooltip on that badge. */
  fixTooltip: boolean;
  /** Sub-account logo uploads update the sidebar, or leave it as is. */
  subLogoUploads: SubLogoUploads;
  /**
   * With "Keep sidebar as is": still apply the avatar's initials and colour
   * (on, default), or not — then Business profile hides the avatar editor.
   */
  keepSubAvatar: boolean;
  /** Sub-account header with a full logo: logo, logo + name, or name. */
  subHeaderShows: SubHeaderShows;
  /** "Logo and name": stacked either way, or side by side. */
  subHeaderLayout: SubHeaderLayout;
  /**
   * Which full logo a sub-account header shows (Nov 25, 2026): the AGENCY's
   * uploaded one with the sub-account name under it (default), or the
   * sub-account's own. See SubHeaderLogo.
   */
  subHeaderLogo: SubHeaderLogo;
  /** Sample full logo in the sub-account header. See TestLogo. */
  testLogo: TestLogo;
  /** Full logo width in the sidebar header. See LogoWidth. */
  logoWidth: LogoWidth;
  /**
   * Smart upload checks (Nov 26, 2026, Ashwin): after a full logo upload,
   * a pass/fail checklist drawn with the uploaded file — shape, size,
   * background, light and dark sidebars — in place of the sample "Acme"
   * guidelines. Off by default.
   */
  logoChecks: boolean;
  /**
   * With checks on: a logo that fails dark mode gets a background behind
   * it on dark sidebars automatically (default on). The user can switch it
   * off per logo from the checklist.
   */
  logoCheckBg: boolean;
  /** What the agency had uploaded before Switchyard — sets up the demo. */
  priorLogos: PriorLogos;
  modeScope: BrandingReach;
  fontScope: BrandingReach;
  saveTarget: BrandingSaveTarget;
  entryPoints: BrandingEntryPoints;
  panelEntry: CustomizePanelEntry;
  access: BrandingAccess;
  previewTarget: BrandingPreviewTarget;
  railStep: RailStep;
  darkStrength: DarkStrength;
  unsavedUi: UnsavedUi;
}

export const DEFAULT_BRANDING_PROTO: BrandingProto = {
  editEntry: "speed-dial",
  speedDialStyle: "menu",
  speedDialDir: "auto",
  editLabel: "customize",
  customizeTarget: "white-label-section",
  moreOptions: "more-options",
  applyConfirm: true,
  onboarding: true,
  layoutTheme: "separate",
  combinedTheme: "edit-card",
  paletteOpens: "inline",
  applyScope: "all",
  onboardingStyle: "stepper",
  onboardingThemeStep: "themes",
  iconDisplay: "logo",
  avatarStyle: "solid",
  agencyIconShape: "square",
  subIconShape: "circle",
  iconEdge: "gray-50",
  themeSet: "minimal",
  advancedOpens: "inline",
  resetControl: "toggle",
  logoGuide: "accordion",
  onboardingLogoGuide: "accordion",
  subLogoUploads: "keep",
  keepSubAvatar: true,
  logoGuides: true,
  wlSections: "accordion",
  wlNav: "side",
  wlSavePlace: "bottom",
  checkGuide: "button",
  assetFrame: "dividers",
  darkLogosAgency: true,
  darkLogosSub: false,
  logoCrop: true,
  logoAutoFix: false,
  fixNotePlacement: "row",
  fixNoteStyle: "callout",
  fixBadge: true,
  fixTooltip: false,
  subHeaderShows: "both",
  subHeaderLayout: "logo-top",
  subHeaderLogo: "agency",
  testLogo: "off",
  logoWidth: "180",
  logoChecks: true,
  logoCheckBg: true,
  priorLogos: "none",
  modeScope: "chrome",
  fontScope: "chrome",
  saveTarget: "agency",
  entryPoints: { settingsPage: true, customizePanel: true, editPalette: true },
  panelEntry: "agency-menu",
  access: "edit",
  previewTarget: "live",
  // Same colour as the sidebar by default (Nov 19); "One step off" stays a control.
  railStep: "same",
  darkStrength: "deep",
  unsavedUi: "bar-and-modal",
};

/** Space-separated, for the tuning panel's search. Every branding control carries it. */
export const BRANDING_KEYWORDS =
  "branding brand theme theming colors colours palette customize customise logo favicon tab title sidebar rail top bar chrome white label hex preset font typeface gradient color mode appearance dark light system layout save agency edit nav button speed dial fab floating action modal white label customize onboarding setup coachmarks combined separate selective selected sub-accounts scope apply";

/* ---------------------------------------------------------------------- */
/* Colour engine                                                           */
/* ---------------------------------------------------------------------- */

export type Mode = "light" | "dark";

export const isHex = (h: string | null | undefined): h is string =>
  !!h && /^#[0-9a-f]{6}$/i.test(h);

export function normalizeHex(input: string): string | null {
  let v = input.trim();
  if (!v.startsWith("#")) v = "#" + v;
  if (/^#[0-9a-f]{3}$/i.test(v)) v = "#" + v.slice(1).split("").map((c) => c + c).join("");
  return isHex(v) ? v.toLowerCase() : null;
}

const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

export function toHsl(hex: string): [number, number, number] {
  const [r, g, b] = rgb(hex).map((v) => v / 255) as [number, number, number];
  const M = Math.max(r, g, b), m = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (M + m) / 2;
  if (M !== m) {
    const d = M - m;
    s = l > 0.5 ? d / (2 - M - m) : d / (M + m);
    h = M === r ? (g - b) / d + (g < b ? 6 : 0) : M === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

export function fromHsl(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

function luminance(hex: string): number {
  return rgb(hex)
    .map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i]!, 0);
}

export function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** `t` of `a` over `b`. */
export function mix(a: string, b: string, t: number): string {
  const A = rgb(a), B = rgb(b);
  return toHex(A[0] * t + B[0] * (1 - t), A[1] * t + B[1] * (1 - t), A[2] * t + B[2] * (1 - t));
}

export const INK = "#101828";
export const WHITE = "#ffffff";

/** White or near-black, whichever reads better on `bg`. */
export const readableOn = (bg: string) => (contrast(WHITE, bg) >= contrast(INK, bg) ? WHITE : INK);

export const isLightSurface = (bg: string) => luminance(bg) > 0.4;

const RAMP_STEPS: readonly [number, number][] = [
  [25, 98], [50, 96], [100, 92], [200, 84], [300, 74], [400, 64],
  [500, 54], [600, 46], [700, 38], [800, 30], [900, 22], [950, 14],
];

/** The brand's shades, 25–950, hue and saturation held. */
export function brandRamp(hex: string): { step: number; hex: string }[] {
  const [h, s] = toHsl(hex);
  return RAMP_STEPS.map(([step, l]) => ({ step, hex: fromHsl(h, Math.max(s, 12), l) }));
}

/* ---------------------------------------------------------------------- */
/* Derivation: theme + mode → tokens per surface                           */
/* ---------------------------------------------------------------------- */

export interface SurfaceTokens {
  bg: string;
  fg: string;
  muted: string;
  subtle: string;
  hover: string;
  active: string;
  line: string;
  /** Edit-mode dashed outlines. */
  dash: string;
  /** Selected row. */
  selBg: string;
  selFg: string;
  /** Ring / indicator colour for the selected thing (rail tile, active bar). */
  indicator: string;
  /** Buttons that live on this surface (edit-mode Done, top-bar actions). */
  buttonBg: string;
  buttonFg: string;
  tooltipBg: string;
  tooltipFg: string;
  /** L2 / L3 flyouts and menus that open off this surface. */
  flyBg: string;
  flyLine: string;
}

export interface ContrastIssue {
  surface: ChromeSurface;
  what: "text" | "selected" | "accent";
  ratio: number;
  min: number;
}

export interface DerivedChrome {
  mode: Mode;
  accent: string;
  rail: SurfaceTokens;
  sidebar: SurfaceTokens;
  topbar: SurfaceTokens;
  issues: ContrastIssue[];
  /** CSS gradient for the whole frame, or null when the theme has none. */
  gradient: string | null;
}

export interface DeriveOptions {
  railStep: RailStep;
  darkStrength: DarkStrength;
}

function surfaceBg(choice: SurfaceChoice, brand: string, mode: Mode, darkStrength: DarkStrength): string {
  const [h, s, l] = toHsl(brand);
  switch (choice.style) {
    case "light":
      return mode === "light" ? WHITE : fromHsl(h, Math.min(s, 14), 11);
    case "dark":
      return mode === "light" ? fromHsl(h, Math.min(s, 28), 12) : fromHsl(h, Math.min(s, 22), 7);
    case "brand":
    case "custom": {
      const base = choice.style === "custom" && isHex(choice.hex) ? choice.hex : brand;
      if (mode === "light") return base;
      const [H, S, L] = toHsl(base);
      return darkStrength === "deep"
        ? fromHsl(H, Math.min(S, 48), Math.min(L, 17))
        : fromHsl(H, Math.min(S, 16), 10);
    }
  }
}

/** The accent for a mode: as chosen in light, lifted in dark if it would sink. */
export function accentFor(theme: BrandingTheme, mode: Mode): string {
  let base = isHex(theme.accent) ? theme.accent : theme.brand;
  // A pale brand with no accent: take a deeper shade of it, or the accent
  // would vanish into the brand-coloured sidebar (Nov 19).
  if (!isHex(theme.accent)) {
    const [h, s, l] = toHsl(base);
    if (l > 70) base = fromHsl(h, Math.max(s, 45), 42);
  }
  if (mode === "light") return base;
  const [h, s, l] = toHsl(base);
  return l < 55 ? fromHsl(h, Math.min(s, 90), 62) : base;
}

function tokensFor(bg: string, accent: string, mode: Mode): SurfaceTokens {
  const fg = readableOn(bg);
  const light = isLightSurface(bg);
  // On a white/pale surface the selected row is an accent tint; on a coloured or
  // dark one it is a lift of the text colour, so the accent never fights the bg.
  const selBg = light ? mix(accent, bg, 0.12) : mix(fg, bg, 0.16);
  const selFg = light ? accent : fg;
  const [h, s] = toHsl(bg);
  const tooltipBg = mode === "light" ? fromHsl(h, Math.min(s, 30), 13) : fromHsl(h, Math.min(s, 20), 92);
  return {
    bg,
    fg,
    muted: mix(fg, bg, 0.62),
    subtle: mix(fg, bg, 0.45),
    hover: mix(fg, bg, 0.08),
    active: mix(fg, bg, 0.13),
    line: mix(fg, bg, 0.1),
    dash: mix(fg, bg, 0.38),
    selBg,
    selFg,
    indicator: accent,
    buttonBg: accent,
    buttonFg: readableOn(accent),
    tooltipBg,
    tooltipFg: readableOn(tooltipBg),
    // L2 / L3 panels wear the sidebar's own colour (Ashwin, Nov 19).
    flyBg: bg,
    flyLine: mix(fg, bg, 0.14),
  };
}

function choiceFor(theme: BrandingTheme, surface: ChromeSurface): SurfaceChoice {
  return theme.together ? theme.chrome : theme.surfaces[surface];
}

export function deriveChrome(
  theme: BrandingTheme,
  mode: Mode,
  opts: DeriveOptions = { railStep: "step", darkStrength: "deep" },
): DerivedChrome {
  const f = theme.fine?.[mode] ?? {};
  const pick = (k: FineKey) => (isHex(f[k]) ? f[k] : undefined);
  const accent = pick("accent") ?? accentFor(theme, mode);
  const bgOf = (k: ChromeSurface) => surfaceBg(choiceFor(theme, k), theme.brand, mode, opts.darkStrength);

  let sidebarBg: string, topbarBg: string, railBg: string;
  if (theme.together) {
    // Together: the top bar is the sidebar; the rail follows it unless set.
    sidebarBg = pick("sidebar") ?? bgOf("sidebar");
    topbarBg = sidebarBg;
    railBg = pick("rail") ?? sidebarBg;
    if (!pick("rail") && opts.railStep === "step") {
      const fg = readableOn(railBg);
      // One step toward the text colour: darker on a light rail, lighter on a dark one.
      railBg = isLightSurface(railBg) ? mix(INK, railBg, 0.04) : mix(fg, railBg, 0.06);
    }
  } else {
    sidebarBg = pick("sidebar") ?? bgOf("sidebar");
    topbarBg = pick("topbar") ?? bgOf("topbar");
    railBg = pick("rail") ?? bgOf("rail");
  }

  const rail = tokensFor(railBg, accent, mode);
  const sidebar = tokensFor(sidebarBg, accent, mode);
  const topbar = tokensFor(topbarBg, accent, mode);

  const issues: ContrastIssue[] = [];
  for (const [k, t] of [["rail", rail], ["sidebar", sidebar], ["topbar", topbar]] as const) {
    const text = contrast(t.fg, t.bg);
    if (text < 4.5) issues.push({ surface: k, what: "text", ratio: text, min: 4.5 });
    const sel = contrast(t.selFg, t.selBg);
    if (sel < 4.5) issues.push({ surface: k, what: "selected", ratio: sel, min: 4.5 });
    const acc = contrast(accent, t.bg);
    if (acc < 3) issues.push({ surface: k, what: "accent", ratio: acc, min: 3 });
  }
  const gradient = theme.gradient ? windowGradient(sidebarBg, accent) : null;
  return { mode, accent, rail, sidebar, topbar, issues, gradient };
}

/**
 * Slack-style window gradient (Nov 19, redone Nov 20).
 *
 * In Slack the whole window frame — workspace rail, sidebar, top bar, and the
 * gutters around the message pane — sits on ONE diagonal sweep from the
 * theme's colour to a sister colour. Same here: the CSS paints this on the
 * shell plane and on every opaque chrome layer with `fixed` attachment, so
 * each shows its slice of the same sheet.
 *
 * The sister colour: hue turned ~40° (toward the accent's family on a grey
 * sidebar, or it would sweep grey to grey), more saturated, lightness moved
 * only inside the band where the nav's ink still reads (dark: up to L38;
 * light: a pastel no darker than L84). A white or near-white sidebar starts
 * from a light tint rather than white — white-to-near-white was the first
 * cut's "it doesn't do anything".
 */
export function windowGradient(bg: string, accent: string): string {
  const [h0, s0, l] = toHsl(bg);
  const grey = s0 < 12;
  const base = grey ? toHsl(accent)[0] : h0;
  const turn = (d: number) => (base + d + 360) % 360;
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  if (!isLightSurface(bg)) {
    const s = clamp(s0 + 20, 40, 80);
    const endL = clamp(l + 14, 18, 38);
    return `linear-gradient(155deg, ${bg} 0%, ${fromHsl(turn(18), (s0 + s) / 2, (l + endL) / 2)} 50%, ${fromHsl(turn(40), s, endL)} 100%)`;
  }
  const s = clamp(Math.max(s0, 55) + 10, 55, 80);
  const start = grey || l > 95 ? fromHsl(base, 70, 95) : bg;
  return `linear-gradient(155deg, ${start} 0%, ${fromHsl(turn(20), s, Math.min(l, 91))} 50%, ${fromHsl(turn(40), s, Math.min(l - 4, 85))} 100%)`;
}

/** "system" → the device's answer. */
export const resolveAppearance = (a: Appearance, systemDark: boolean): Mode =>
  a === "system" ? (systemDark ? "dark" : "light") : a;

/* ---------------------------------------------------------------------- */
/* Theme code (Nov 19)                                                     */
/* ---------------------------------------------------------------------- */

/**
 * Six hexes: light sidebar, accent, rail, then the same for dark. Copied to
 * move a theme between browsers; pasted back as exact colours.
 */
export function themeCode(theme: BrandingTheme, opts?: DeriveOptions): string {
  const l = deriveChrome(theme, "light", opts);
  const d = deriveChrome(theme, "dark", opts);
  return [l.sidebar.bg, l.accent, l.rail.bg, d.sidebar.bg, d.accent, d.rail.bg]
    .map((h) => h.toUpperCase())
    .join(",");
}

/** Null unless the text holds exactly six hex colours. */
export function parseThemeCode(text: string): FineTune | null {
  const parts = text.split(/[\s,;]+/).filter(Boolean).map(normalizeHex);
  if (parts.length !== 6 || parts.some((p) => !p)) return null;
  const [a, b, c, d, e, f] = parts as string[];
  return fine6([a!, b!, c!], [d!, e!, f!]);
}

/* ---------------------------------------------------------------------- */
/* Fonts (Nov 19)                                                          */
/* ---------------------------------------------------------------------- */

export type FontCategory = "sans" | "rounded" | "serif" | "display" | "mono";
export const FONT_CATEGORIES: readonly FontCategory[] = ["sans", "rounded", "serif", "display", "mono"];
export const FONT_CATEGORY_LABELS: Record<FontCategory, string> = {
  sans: "Sans serif",
  rounded: "Rounded",
  serif: "Serif",
  display: "Display",
  mono: "Monospace",
};

export interface BrandFont {
  id: string;
  label: string;
  category: FontCategory;
  /** font-family value. */
  stack: string;
  /** Google Fonts css2 `family=` value, or absent for local fonts. */
  google?: string;
}

const SANS_TAIL = "ui-sans-serif, system-ui, sans-serif";
const g = (
  id: string,
  label: string,
  category: FontCategory,
  weights = "400;500;600",
  tail = SANS_TAIL,
): BrandFont => ({
  id,
  label,
  category,
  stack: `"${label}", ${tail}`,
  google: `${label.replace(/ /g, "+")}:wght@${weights}`,
});
const SERIF_TAIL = "ui-serif, Georgia, serif";
const MONO_TAIL = "ui-monospace, Menlo, monospace";

export const BRAND_FONTS: readonly BrandFont[] = [
  { id: "inter", label: "Inter", category: "sans", stack: `var(--font-inter), ${SANS_TAIL}` },
  {
    id: "system",
    label: "System UI",
    category: "sans",
    stack: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`,
  },
  g("geist", "Geist", "sans"),
  g("manrope", "Manrope", "sans"),
  g("dm-sans", "DM Sans", "sans"),
  g("ibm-plex-sans", "IBM Plex Sans", "sans"),
  g("josefin-sans", "Josefin Sans", "sans"),
  g("plus-jakarta-sans", "Plus Jakarta Sans", "sans"),
  g("figtree", "Figtree", "sans"),
  g("work-sans", "Work Sans", "sans"),
  g("source-sans-3", "Source Sans 3", "sans"),
  g("roboto", "Roboto", "sans", "400;500;700"),
  g("open-sans", "Open Sans", "sans"),
  g("lato", "Lato", "sans", "400;700"),
  g("poppins", "Poppins", "sans"),
  g("montserrat", "Montserrat", "sans"),
  g("nunito", "Nunito", "rounded"),
  g("quicksand", "Quicksand", "rounded"),
  g("varela-round", "Varela Round", "rounded", "400"),
  g("comfortaa", "Comfortaa", "rounded"),
  g("m-plus-rounded-1c", "M PLUS Rounded 1c", "rounded", "400;500;700"),
  g("merriweather", "Merriweather", "serif", "400;700", SERIF_TAIL),
  g("lora", "Lora", "serif", "400;500;600", SERIF_TAIL),
  g("source-serif-4", "Source Serif 4", "serif", "400;500;600", SERIF_TAIL),
  g("libre-baskerville", "Libre Baskerville", "serif", "400;700", SERIF_TAIL),
  g("playfair-display", "Playfair Display", "serif", "400;500;600", SERIF_TAIL),
  g("space-grotesk", "Space Grotesk", "display"),
  g("outfit", "Outfit", "display"),
  g("sora", "Sora", "display"),
  g("lexend", "Lexend", "display"),
  g("urbanist", "Urbanist", "display"),
  g("raleway", "Raleway", "display"),
  g("jetbrains-mono", "JetBrains Mono", "mono", "400;500;600", MONO_TAIL),
  g("ibm-plex-mono", "IBM Plex Mono", "mono", "400;500;600", MONO_TAIL),
  g("fira-code", "Fira Code", "mono", "400;500;600", MONO_TAIL),
  g("space-mono", "Space Mono", "mono", "400;700", MONO_TAIL),
];

export const fontById = (id: string): BrandFont =>
  BRAND_FONTS.find((f) => f.id === id) ?? BRAND_FONTS[0]!;

/** Google Fonts stylesheet for some fonts; `text` subsets to those glyphs. */
export function googleFontsHref(fonts: readonly BrandFont[], text?: string): string | null {
  const fam = fonts.filter((f) => f.google).map((f) => `family=${f.google}`);
  if (fam.length === 0) return null;
  const t = text ? `&text=${encodeURIComponent(text)}` : "";
  return `https://fonts.googleapis.com/css2?${fam.join("&")}&display=swap${t}`;
}

/** The theme in force for an account: its override, else the agency's. */
export function resolveTheme(state: BrandingState, accountId: string | null): BrandingTheme {
  return (accountId && state.overrides[accountId]?.theme) || state.agency.theme;
}

/** Assets in force for an account, per field. */
export function resolveAssets(state: BrandingState, accountId: string | null): BrandAssets {
  const own = (accountId && state.overrides[accountId]?.assets) || {};
  return { ...state.agency.assets, ...stripEmpty(own) };
}

function stripEmpty(a: BrandAssets): BrandAssets {
  const out: BrandAssets = {};
  for (const [k, v] of Object.entries(a)) if (v) (out as Record<string, string>)[k] = v;
  return out;
}

/* ---------------------------------------------------------------------- */
/* From the logo (Nov 20)                                                  */
/* ---------------------------------------------------------------------- */

/**
 * Themes suggested from a logo's colours (see lib/logo-colors). The first
 * colour leads; a second, when the logo has one, gives a two-tone option.
 *
 *   Light   a pale wash of the logo colour, its deep shade for selection
 *   Bold    the sidebar IS the logo colour, deepened until white reads on it
 *   Duo     the second colour's deep shade, the first colour for selection
 *
 * Shaped as presets so the picker draws and applies them like any other.
 */
export function logoThemes(colors: readonly string[]): BrandingPreset[] {
  const [first, second] = colors;
  if (!first || !isHex(first)) return [];
  const [h, s0] = toHsl(first);
  const s = Math.min(Math.max(s0, 35), 80);
  const deep = (hh: number, ss: number, l: number) => fromHsl(hh, Math.min(Math.max(ss, 30), 75), l);
  const out: BrandingPreset[] = [
    {
      id: "logo-light",
      label: "Logo · Light",
      brand: first,
      accent: deep(h, s, 38),
      chrome: "brand",
      fine: presetFine(
        [fromHsl(h, Math.min(s, 65), 94), deep(h, s, 38), ""],
        [fromHsl(h, Math.min(s, 40), 12), fromHsl(h, s, 72), ""],
      ),
    },
    {
      id: "logo-bold",
      label: "Logo · Bold",
      brand: first,
      accent: fromHsl(h, s, 78),
      chrome: "brand",
      fine: presetFine(
        [deep(h, s, 24), fromHsl(h, s, 78), ""],
        [deep(h, s, 12), fromHsl(h, s, 72), ""],
      ),
    },
  ];
  if (second && isHex(second)) {
    const [h2, s2] = toHsl(second);
    out.push({
      id: "logo-duo",
      label: "Logo · Duo",
      brand: second,
      accent: fromHsl(h, s, 70),
      chrome: "brand",
      fine: presetFine(
        [deep(h2, s2, 22), fromHsl(h, s, 70), ""],
        [deep(h2, s2, 11), fromHsl(h, s, 70), ""],
      ),
    });
  }
  return out;
}

/**
 * Light-sidebar themes from a logo, for the minimal set (Nov 24, 2026):
 * "Logo · Light" (a tint of the main colour), and "Logo · Soft" — a tint of
 * the second colour with the first as accent, or, with one colour, a near-
 * neutral sidebar carrying the logo colour as accent.
 */
export function logoLightThemes(colors: readonly string[]): BrandingPreset[] {
  const light = logoThemes(colors).find((p) => p.id === "logo-light");
  if (!light) return [];
  const [first, second] = colors as [string, string | undefined];
  const [h, s0] = toHsl(first);
  const s = Math.min(Math.max(s0, 35), 80);
  const deep = (hh: number, ss: number, l: number) => fromHsl(hh, Math.min(Math.max(ss, 30), 75), l);
  const two = second && isHex(second) ? toHsl(second) : null;
  const soft: BrandingPreset = {
    id: "logo-soft",
    label: "Logo · Soft",
    brand: first,
    accent: deep(h, s, 40),
    chrome: "brand",
    fine: presetFine(
      [two ? fromHsl(two[0], Math.min(two[1], 55), 95) : fromHsl(h, 12, 97), deep(h, s, 40), ""],
      [fromHsl(h, Math.min(s, 30), 11), fromHsl(h, s, 72), ""],
    ),
  };
  return [light, soft];
}

/** The minimal set: logo themes first, then curated light presets, 8 at most. */
export function minimalPresets(logo: readonly BrandingPreset[]): BrandingPreset[] {
  const curated = MINIMAL_PRESET_IDS.map((id) => BRANDING_PRESETS.find((p) => p.id === id)!).filter(Boolean);
  // Default always leads (Nov 26, 2026): it is how you go back.
  const def = curated.find((p) => p.id === "highrise");
  const rest = [...logo, ...curated].filter((p) => p !== def && p.id !== "highrise");
  return [...(def ? [def] : []), ...rest].slice(0, MINIMAL_MAX_THEMES);
}

/**
 * What a theme paints (Nov 25, 2026): always light, never a gradient — no
 * theme set offers color mode or the window gradient any more. Minimal also
 * drops the font; Full, Extended, and Advanced keep it.
 */
export function minimalTheme(t: BrandingTheme, keepFont = false): BrandingTheme {
  const font = keepFont ? t.font : DEFAULT_FONT_ID;
  if (t.appearance === "light" && !t.gradient && t.font === font) return t;
  return { ...t, appearance: "light", gradient: false, font };
}

/** The initials avatar's tile from one colour: flat, or a short diagonal. */
export function avatarTile(color: string, style: AvatarStyle): { from: string; to: string } {
  if (style === "solid") return { from: color, to: color };
  const [h, s, l] = toHsl(color);
  return { from: color, to: fromHsl((h + 30) % 360, Math.min(s + 10, 90), Math.min(l + 14, 70)) };
}

/**
 * A logo colour made fit for white initials: dark enough for 3:1, so a pale
 * yellow logo still gives a legible avatar.
 */
export function avatarColorFrom(color: string): string {
  let [h, s, l] = toHsl(color);
  while (l > 10 && contrast(WHITE, fromHsl(h, s, l)) < 3) l -= 4;
  return fromHsl(h, s, l);
}
