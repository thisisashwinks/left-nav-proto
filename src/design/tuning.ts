/**
 * Live-tunable layout values for demoing.
 *
 * Each knob writes a CSS custom property on <html>, and the components read
 * those properties instead of hardcoded px. That way the control panel can
 * retune the nav during a demo without a rebuild, and the defaults stay exactly
 * the values measured from left-nav.pen.
 */

export interface TuningKnob {
  id: keyof TuningState;
  /** The CSS custom property the value is written to. */
  cssVar: string;
  label: string;
  group: "Nav rows" | "Favourites dock" | "Flyout" | "Motion";
  min: number;
  max: number;
  step: number;
  unit: "px" | "ms";
  /** Short note on what the design specifies, shown under the control. */
  hint?: string;
}

export interface TuningState {
  navIconSize: number;
  /** What a nav icon grows to on hover, in px. Drives the scale, not a width. */
  navIconHoverSize: number;
  navRowFontSize: number;
  navRowGap: number;
  navRowPaddingY: number;
  navRowPaddingX: number;
  navRowRadius: number;
  navRowSpacing: number;
  dockIconSize: number;
  dockLabelSize: number;
  /** The centred caption's own size — it has room the tracking one does not. */
  dockCenterLabelSize: number;
  dockLabelOffset: number;
  dockLift: number;
  dockScale: number;
  flyoutIconSize: number;
  flyoutTitleSize: number;
  flyoutDescSize: number;
  flyoutRowGap: number;
  flyoutRowPaddingY: number;
  flyoutBlockGap: number;
  durFast: number;
  durBase: number;
  durSlow: number;
  durDock: number;
}

/**
 * Where the prototype starts.
 *
 * Mostly the values measured out of left-nav.pen, with one deliberate departure:
 * icons default to 14px, not the design's 16. That came out of live testing in the
 * review — 14 against a 14px label was the size everyone settled on — so it is the
 * baseline the prototype should present, and Reset should return to it rather than
 * to a size we have already decided against. Each knob's hint still names the
 * design's own value where the two differ.
 */
export const TUNING_DEFAULTS: TuningState = {
  navIconSize: 14,
  // Hover takes the icon to the design's 16 — the resting size is the one that
  // came down, so growing back to 16 is the row saying "this is the one".
  navIconHoverSize: 16,
  navRowFontSize: 14,
  navRowGap: 10,
  navRowPaddingY: 9,
  navRowPaddingX: 8,
  navRowRadius: 7,
  navRowSpacing: 2,
  // The dock keeps 16. Its icons carry no label beside them, so they are the only
  // thing naming the row and drop off faster than a nav row's icon does.
  dockIconSize: 16,
  dockLabelSize: 8,
  // Inside the band it is a label on a surface rather than a hover hint squeezed
  // between two sections, so it can carry real size — one step under a nav row's
  // 14, which keeps the dock subordinate to the rows below it.
  dockCenterLabelSize: 12,
  dockLabelOffset: 16,
  // No lift by default: the icons grow in place. Lifting made the row feel like
  // it was reflowing on every pass, and with the caption now inside the band
  // there is nowhere above an icon for it to go. The knob stays so the lift can
  // still be demoed.
  dockLift: 0,
  dockScale: 125,
  // 16 (Aug 28): the same glyph a nav row draws. At 20 an L2 row read as a
  // heavier thing than the L1 that opened it, when it is the same kind of row
  // one level down. Still tunable — the knob is how the old 20 gets compared.
  flyoutIconSize: 16,
  flyoutTitleSize: 14,
  flyoutDescSize: 12.5,
  flyoutRowGap: 10,
  flyoutRowPaddingY: 9,
  flyoutBlockGap: 10,
  durFast: 140,
  durBase: 220,
  durSlow: 300,
  durDock: 260,
};

export const TUNING_KNOBS: TuningKnob[] = [
  { id: "navIconSize", cssVar: "--t-nav-icon", label: "Icon size", group: "Nav rows", min: 12, max: 24, step: 1, unit: "px", hint: "14 from live testing · design ships 16" },
  { id: "navIconHoverSize", cssVar: "--t-nav-icon-hover", label: "Icon size on hover", group: "Nav rows", min: 12, max: 28, step: 1, unit: "px", hint: "Grows to the design's 16" },
  { id: "navRowFontSize", cssVar: "--t-nav-font", label: "Label size", group: "Nav rows", min: 11, max: 18, step: 0.5, unit: "px", hint: "Design: 14 · expanded only" },
  { id: "navRowGap", cssVar: "--t-nav-gap", label: "Icon → label gap", group: "Nav rows", min: 4, max: 20, step: 1, unit: "px", hint: "Design: 10 · expanded only" },
  { id: "navRowPaddingY", cssVar: "--t-nav-py", label: "Row padding Y", group: "Nav rows", min: 4, max: 16, step: 1, unit: "px", hint: "Design: 9 · expanded only" },
  { id: "navRowPaddingX", cssVar: "--t-nav-px", label: "Row padding X", group: "Nav rows", min: 4, max: 16, step: 1, unit: "px", hint: "Design: 8 · expanded only" },
  { id: "navRowRadius", cssVar: "--t-nav-radius", label: "Row radius", group: "Nav rows", min: 0, max: 16, step: 1, unit: "px", hint: "Design: 7" },
  { id: "navRowSpacing", cssVar: "--t-nav-space", label: "Between rows", group: "Nav rows", min: 0, max: 10, step: 1, unit: "px", hint: "Design: 2" },

  { id: "dockIconSize", cssVar: "--t-dock-icon", label: "Icon size", group: "Favourites dock", min: 12, max: 24, step: 1, unit: "px", hint: "Design: 16" },
  { id: "dockLabelSize", cssVar: "--t-dock-label", label: "Caption size", group: "Favourites dock", min: 6, max: 12, step: 0.5, unit: "px", hint: "“Under the icon” only" },
  { id: "dockCenterLabelSize", cssVar: "--t-dock-center-label", label: "Centred caption size", group: "Favourites dock", min: 8, max: 16, step: 0.5, unit: "px", hint: "Inside the band, so it can be bigger" },
  { id: "dockLabelOffset", cssVar: "--t-dock-label-top", label: "Caption offset", group: "Favourites dock", min: 8, max: 26, step: 1, unit: "px", hint: "“Under the icon” only" },
  { id: "dockLift", cssVar: "--t-dock-lift", label: "Hover lift", group: "Favourites dock", min: 0, max: 12, step: 1, unit: "px", hint: "0 — icons grow in place" },
  { id: "dockScale", cssVar: "--t-dock-scale", label: "Hover scale %", group: "Favourites dock", min: 100, max: 180, step: 5, unit: "px" },

  { id: "flyoutIconSize", cssVar: "--t-fly-icon", label: "Icon size", group: "Flyout", min: 14, max: 26, step: 1, unit: "px", hint: "16, matching a nav row · design shipped 20" },
  { id: "flyoutTitleSize", cssVar: "--t-fly-title", label: "Title size", group: "Flyout", min: 11, max: 18, step: 0.5, unit: "px", hint: "Design: 14" },
  { id: "flyoutDescSize", cssVar: "--t-fly-desc", label: "Description size", group: "Flyout", min: 10, max: 16, step: 0.5, unit: "px", hint: "Design: 12.5" },
  { id: "flyoutRowGap", cssVar: "--t-fly-gap", label: "Icon → text gap", group: "Flyout", min: 4, max: 20, step: 1, unit: "px", hint: "Design: 10" },
  { id: "flyoutRowPaddingY", cssVar: "--t-fly-py", label: "Row padding Y", group: "Flyout", min: 4, max: 18, step: 1, unit: "px", hint: "Design: 9" },
  { id: "flyoutBlockGap", cssVar: "--t-fly-block-gap", label: "Between rows", group: "Flyout", min: 0, max: 20, step: 1, unit: "px", hint: "Design: 10" },

  { id: "durFast", cssVar: "--dur-fast", label: "Hover / tap", group: "Motion", min: 0, max: 400, step: 10, unit: "ms" },
  { id: "durBase", cssVar: "--dur-base", label: "Panel enter", group: "Motion", min: 0, max: 600, step: 10, unit: "ms" },
  { id: "durSlow", cssVar: "--dur-slow", label: "Collapse / morph", group: "Motion", min: 0, max: 900, step: 10, unit: "ms" },
  { id: "durDock", cssVar: "--dur-dock", label: "Dock lift", group: "Motion", min: 0, max: 700, step: 10, unit: "ms" },
];

export const TUNING_GROUPS = [
  "Nav rows",
  "Favourites dock",
  "Flyout",
  "Motion",
] as const;

/** Serialises the state into the CSS custom properties components read. */
export function tuningToCssVars(state: TuningState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const knob of TUNING_KNOBS) {
    const value = state[knob.id];
    // dockScale is a percentage fed to `scale()`, so it is unitless.
    out[knob.cssVar] =
      knob.id === "dockScale" ? String(value / 100) : `${value}${knob.unit}`;
  }

  /*
   * The nav icon's hover scale, derived rather than dialled.
   *
   * Both sizes are knobs, so the scale between them has to be computed. It cannot
   * be done in CSS: `calc(16px / 14px)` is dividing a length by a length, which
   * `calc()` does not accept, and a hardcoded 1.1 would only hit 16px while the
   * resting size happened to be 14.5. Computed here, hover always lands exactly on
   * the size the knob names, whatever the resting size is.
   */
  out["--t-nav-icon-scale"] = String(
    state.navIconSize > 0 ? state.navIconHoverSize / state.navIconSize : 1,
  );

  return out;
}
