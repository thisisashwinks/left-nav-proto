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
  navRowFontSize: number;
  navRowGap: number;
  navRowPaddingY: number;
  navRowPaddingX: number;
  navRowRadius: number;
  navRowSpacing: number;
  dockIconSize: number;
  dockLabelSize: number;
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

/** Defaults are the measured Pencil values — resetting returns to the design. */
export const TUNING_DEFAULTS: TuningState = {
  navIconSize: 16,
  navRowFontSize: 14,
  navRowGap: 10,
  navRowPaddingY: 9,
  navRowPaddingX: 8,
  navRowRadius: 7,
  navRowSpacing: 2,
  dockIconSize: 16,
  dockLabelSize: 8,
  dockLabelOffset: 16,
  dockLift: 5,
  dockScale: 125,
  flyoutIconSize: 20,
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
  { id: "navIconSize", cssVar: "--t-nav-icon", label: "Icon size", group: "Nav rows", min: 12, max: 24, step: 1, unit: "px", hint: "Design: 16" },
  { id: "navRowFontSize", cssVar: "--t-nav-font", label: "Label size", group: "Nav rows", min: 11, max: 18, step: 0.5, unit: "px", hint: "Design: 14" },
  { id: "navRowGap", cssVar: "--t-nav-gap", label: "Icon → label gap", group: "Nav rows", min: 4, max: 20, step: 1, unit: "px", hint: "Design: 10" },
  { id: "navRowPaddingY", cssVar: "--t-nav-py", label: "Row padding Y", group: "Nav rows", min: 4, max: 16, step: 1, unit: "px", hint: "Design: 9" },
  { id: "navRowPaddingX", cssVar: "--t-nav-px", label: "Row padding X", group: "Nav rows", min: 4, max: 16, step: 1, unit: "px", hint: "Design: 8" },
  { id: "navRowRadius", cssVar: "--t-nav-radius", label: "Row radius", group: "Nav rows", min: 0, max: 16, step: 1, unit: "px", hint: "Design: 7" },
  { id: "navRowSpacing", cssVar: "--t-nav-space", label: "Between rows", group: "Nav rows", min: 0, max: 10, step: 1, unit: "px", hint: "Design: 2" },

  { id: "dockIconSize", cssVar: "--t-dock-icon", label: "Icon size", group: "Favourites dock", min: 12, max: 24, step: 1, unit: "px", hint: "Design: 16" },
  { id: "dockLabelSize", cssVar: "--t-dock-label", label: "Caption size", group: "Favourites dock", min: 6, max: 12, step: 0.5, unit: "px" },
  { id: "dockLabelOffset", cssVar: "--t-dock-label-top", label: "Caption offset", group: "Favourites dock", min: 8, max: 26, step: 1, unit: "px" },
  { id: "dockLift", cssVar: "--t-dock-lift", label: "Hover lift", group: "Favourites dock", min: 0, max: 12, step: 1, unit: "px" },
  { id: "dockScale", cssVar: "--t-dock-scale", label: "Hover scale %", group: "Favourites dock", min: 100, max: 180, step: 5, unit: "px" },

  { id: "flyoutIconSize", cssVar: "--t-fly-icon", label: "Icon size", group: "Flyout", min: 14, max: 26, step: 1, unit: "px", hint: "Design: 20" },
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
  return out;
}
