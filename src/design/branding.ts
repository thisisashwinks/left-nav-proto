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

/** HighRise first — it is the platform default and equals "unbranded". */
export const BRANDING_PRESETS: readonly BrandingPreset[] = [
  { id: "highrise", label: "HighLevel", brand: "#155eef", accent: null, chrome: "light" },
  // Nov 19 set (Ashwin's reference): exact colours for light and dark.
  { id: "zesty-citrus", label: "Zesty Citrus", brand: "#fbcfba", accent: "#c25826", chrome: "brand",
    fine: presetFine(["#fbcfba", "#c25826", "#fbcfba"], ["#3b1a0f", "#e8875a", "#2e140b"]) },
  { id: "royal-velvet", label: "Royal Velvet", brand: "#3d1f4a", accent: "#c99be0", chrome: "brand",
    fine: presetFine(["#3d1f4a", "#c99be0", "#311a3c"], ["#1f1026", "#c99be0", "#180c1e"]) },
  { id: "sunny-delight", label: "Sunny Delight", brand: "#fdf0b5", accent: "#a87b00", chrome: "brand",
    fine: presetFine(["#fdf0b5", "#a87b00", "#fdf0b5"], ["#2b2306", "#f2cf55", "#221b04"]) },
  { id: "lush-meadow", label: "Lush Meadow", brand: "#d3e6da", accent: "#3d7356", chrome: "brand",
    fine: presetFine(["#d3e6da", "#3d7356", "#d3e6da"], ["#11261b", "#74b791", "#0c1d14"]) },
  { id: "azure-dreams", label: "Azure Dreams", brand: "#dbe9f6", accent: "#2f6496", chrome: "brand",
    fine: presetFine(["#dbe9f6", "#2f6496", "#dbe9f6"], ["#0e1e2f", "#7fb1e3", "#0a1724"]) },
  { id: "bubblegum-bliss", label: "Bubblegum Bliss", brand: "#fbe3ec", accent: "#b4587a", chrome: "brand",
    fine: presetFine(["#fbe3ec", "#b4587a", "#fbe3ec"], ["#2b111b", "#eb9cb8", "#210c14"]) },
  { id: "ivory-whisper", label: "Ivory Whisper", brand: "#eeeeec", accent: "#2a2a2a", chrome: "brand",
    fine: presetFine(["#eeeeec", "#2a2a2a", "#eeeeec"], ["#1b1b1b", "#e6e6e6", "#131313"]) },
  { id: "midnight-deep", label: "Midnight Deep", brand: "#e3e6fb", accent: "#1f2675", chrome: "brand",
    fine: presetFine(["#e3e6fb", "#1f2675", "#e3e6fb"], ["#0d1033", "#9aa2f2", "#090b26"]) },
  // Nov 18 set.
  { id: "midnight", label: "Midnight", brand: "#155eef", accent: null, chrome: "dark" },
  { id: "plum", label: "Plum", brand: "#4a1d5c", accent: "#e8b04a", chrome: "brand" },
  { id: "forest", label: "Forest", brand: "#1e4d3a", accent: "#7bd3a0", chrome: "brand" },
  { id: "ocean", label: "Ocean", brand: "#0b5c8f", accent: "#5ec8f0", chrome: "brand" },
  // Coral accent (Nov 19): with none, the accent WAS the brand red, so the
  // swatch was one colour and selected rows vanished into the sidebar.
  { id: "ember", label: "Ember", brand: "#b42318", accent: "#fda29b", chrome: "brand" },
  { id: "sand", label: "Sand", brand: "#c08a3e", accent: null, chrome: "light" },
  { id: "graphite", label: "Graphite", brand: "#2b2f36", accent: "#f79009", chrome: "brand" },
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
  return { ...themeFromPreset(p), appearance: theme.appearance, gradient: theme.gradient, font: theme.font };
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

export type AvatarStyle = "solid" | "gradient";
export const AVATAR_STYLE_LABELS: Record<AvatarStyle, string> = {
  solid: "Solid color",
  gradient: "Gradient",
};
export type OnboardingStyle = "stepper" | "split";
export const ONBOARDING_STYLE_LABELS: Record<OnboardingStyle, string> = {
  stepper: "Stepper",
  split: "Split preview",
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
  /** Onboarding's look (Nov 23): step list + preview, or card + big preview. */
  onboardingStyle: OnboardingStyle;
  /** No square icon: initials on a solid colour from the logo, or a gradient. */
  avatarStyle: AvatarStyle;
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
  onboarding: false,
  onboardingStyle: "stepper",
  avatarStyle: "solid",
  priorLogos: "full",
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
  "branding brand theme theming colors colours palette customize customise logo favicon tab title sidebar rail top bar chrome white label hex preset font typeface gradient color mode appearance dark light system layout save agency edit nav button speed dial fab floating action modal white label customize onboarding setup coachmarks";

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
