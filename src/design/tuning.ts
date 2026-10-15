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
  /**
   * The gap inside the row's TRAILING run only — eye, kebab, chevron and the
   * rest. Separate from `navRowGap` because those are 20px glyph boxes packed
   * against the row's edge, where the gap between an icon and a label is
   * setting a word off from a picture. One number for both made the controls
   * read as loose the moment the label gap was opened up.
   */
  navRowTrailGap: number;
  navRowPaddingY: number;
  navRowPaddingX: number;
  navRowRadius: number;
  navRowSpacing: number;
  /**
   * The L1 column's own horizontal inset — the gutter its rows sit in, not the
   * padding inside a row. One number for the header, the lists and every block
   * between them, so the column has a single edge rather than several that
   * happen to agree.
   */
  navPadX: number;
  /**
   * The three phases of the L1 collapse, in ms.
   *
   * The nav used to do all of it at once — width, outgoing face and incoming
   * face all on one 300ms transition — which is what a frame-by-frame review
   * on Oct 6 called out: "a bunch of things happening all at once to achieve
   * an end result, but it's not really pulling it all together into one
   * coherent visual narrative."
   *
   * The story is now three beats in order: the contents LEAVE, then the
   * surface RESIZES, then the new contents ARRIVE. Each beat is a knob
   * because the balance between them is the whole design question — too even
   * and it reads as a machine stepping through states, too lopsided and the
   * middle beat looks like a stall.
   */
  navCollapseFade: number;
  navCollapseSize: number;
  navCollapseSettle: number;
  dockIconSize: number;
  dockLabelSize: number;
  /** The centred caption's own size — it has room the tracking one does not. */
  dockCenterLabelSize: number;
  dockLabelOffset: number;
  dockLift: number;
  dockScale: number;
  dragGhostOpacity: number;
  flyoutIconSize: number;
  flyoutTitleSize: number;
  flyoutDescSize: number;
  flyoutRowGap: number;
  /** The L2 panel's own horizontal inset — header, rows and bottom slot. */
  flyoutPadX: number;
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
  navIconSize: 16,
  // Hover takes the icon to the design's 16 — the resting size is the one that
  // came down, so growing back to 16 is the row saying "this is the one".
  navIconHoverSize: 16,
  navRowFontSize: 14,
  navRowGap: 8,
  /*
   * 6, not the 8 live tuning landed on (Ashwin, Oct 14).
   *
   * The run is three 20px glyph boxes packed against a row's edge, and the
   * boxes already carry their own breathing room — so the gap is measuring
   * the space BETWEEN two pieces of padding. At 8 the eye, kebab and chevron
   * read as three separate controls that happen to be near each other; at 6
   * they read as one cluster, which is what they are.
   */
  navRowTrailGap: 6,
  navRowPaddingY: 8,
  navRowPaddingX: 8,
  navRowRadius: 7,
  navRowSpacing: 2,
  navPadX: 10,
  navCollapseFade: 90,
  navCollapseSize: 220,
  navCollapseSettle: 120,
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
  /*
   * 72, dialled on the real thing (Ashwin, Oct 15).
   *
   * The drag picture has to be opaque enough that the row it is carried
   * over does not read through its label — that was the whole point of
   * giving it a surface — and sheer enough that the drop line underneath
   * stays visible, since that line is the thing you are actually aiming at.
   * Those pull opposite ways; 72 is where both hold. It stays a knob
   * because the balance shifts with the nav's theme, and a dark nav is a
   * different problem from a light one.
   */
  dragGhostOpacity: 72,
  // 16 (Aug 28): the same glyph a nav row draws. At 20 an L2 row read as a
  // heavier thing than the L1 that opened it, when it is the same kind of row
  // one level down. Still tunable — the knob is how the old 20 gets compared.
  flyoutIconSize: 16,
  flyoutTitleSize: 14,
  flyoutDescSize: 12.5,
  flyoutRowGap: 10,
  flyoutPadX: 10,
  flyoutRowPaddingY: 9,
  flyoutBlockGap: 10,
  durFast: 140,
  durBase: 220,
  durSlow: 300,
  durDock: 260,
};

export const TUNING_KNOBS: TuningKnob[] = [
  { id: "navIconSize", cssVar: "--t-nav-icon", label: "Icon size", group: "Nav rows", min: 12, max: 24, step: 1, unit: "px", hint: "16 — the design’s size, at rest as well as on hover" },
  { id: "navIconHoverSize", cssVar: "--t-nav-icon-hover", label: "Icon size on hover", group: "Nav rows", min: 12, max: 28, step: 1, unit: "px", hint: "Equal to the resting size, so rows no longer grow under the pointer" },
  { id: "navRowFontSize", cssVar: "--t-nav-font", label: "Label size", group: "Nav rows", min: 11, max: 18, step: 0.5, unit: "px", hint: "Design: 14 · expanded only" },
  { id: "navRowGap", cssVar: "--t-nav-gap", label: "Row gap (all items)", group: "Nav rows", min: 0, max: 20, step: 1, unit: "px", hint: "8 from live tuning · design ships 10" },
  { id: "navRowTrailGap", cssVar: "--t-nav-trail-gap", label: "Trailing controls gap", group: "Nav rows", min: 0, max: 20, step: 1, unit: "px", hint: "Design: 6 · eye, kebab, chevron — nav rows, L2 and L3" },
  { id: "navRowPaddingY", cssVar: "--t-nav-py", label: "Row padding Y", group: "Nav rows", min: 4, max: 16, step: 1, unit: "px", hint: "8 — every nav row is 36px: 8 + a 20px content box + 8" },
  { id: "navRowPaddingX", cssVar: "--t-nav-px", label: "Row padding X", group: "Nav rows", min: 4, max: 16, step: 1, unit: "px", hint: "Design: 8 · expanded only" },
  { id: "navRowRadius", cssVar: "--t-nav-radius", label: "Row radius", group: "Nav rows", min: 0, max: 16, step: 1, unit: "px", hint: "Design: 7" },
  { id: "navRowSpacing", cssVar: "--t-nav-space", label: "Between rows", group: "Nav rows", min: 0, max: 10, step: 1, unit: "px", hint: "Design: 2" },
  { id: "navPadX", cssVar: "--t-nav-pad", label: "Column padding", group: "Nav rows", min: 0, max: 24, step: 1, unit: "px", hint: "Design: 10 · the whole L1 gutter, header and lists" },

  { id: "navCollapseFade", cssVar: "--t-nav-collapse-fade", label: "1 · Contents leave", group: "Motion", min: 0, max: 400, step: 10, unit: "ms", hint: "The outgoing face fades. Nothing else moves yet." },
  { id: "navCollapseSize", cssVar: "--t-nav-collapse-size", label: "2 · Surface resizes", group: "Motion", min: 60, max: 600, step: 10, unit: "ms", hint: "The column narrows or widens, over an empty surface." },
  { id: "navCollapseSettle", cssVar: "--t-nav-collapse-settle", label: "3 · Contents arrive", group: "Motion", min: 0, max: 400, step: 10, unit: "ms", hint: "The incoming face fades in and slides the last few px." },

  { id: "dockIconSize", cssVar: "--t-dock-icon", label: "Icon size", group: "Favourites dock", min: 12, max: 24, step: 1, unit: "px", hint: "Design: 16" },
  { id: "dockLabelSize", cssVar: "--t-dock-label", label: "Caption size", group: "Favourites dock", min: 6, max: 12, step: 0.5, unit: "px", hint: "“Under the icon” only" },
  { id: "dockCenterLabelSize", cssVar: "--t-dock-center-label", label: "Centred caption size", group: "Favourites dock", min: 8, max: 16, step: 0.5, unit: "px", hint: "Inside the band, so it can be bigger" },
  { id: "dockLabelOffset", cssVar: "--t-dock-label-top", label: "Caption offset", group: "Favourites dock", min: 8, max: 26, step: 1, unit: "px", hint: "“Under the icon” only" },
  { id: "dockLift", cssVar: "--t-dock-lift", label: "Hover lift", group: "Favourites dock", min: 0, max: 12, step: 1, unit: "px", hint: "0 — icons grow in place" },
  { id: "dockScale", cssVar: "--t-dock-scale", label: "Hover scale %", group: "Favourites dock", min: 100, max: 180, step: 5, unit: "px" },
  { id: "dragGhostOpacity", cssVar: "--t-drag-ghost-opacity", label: "Drag ghost opacity %", group: "Nav rows", min: 50, max: 100, step: 1, unit: "px", hint: "Design: 72 · opaque enough to not read through, sheer enough to show the drop line" },

  { id: "flyoutIconSize", cssVar: "--t-fly-icon", label: "Icon size", group: "Flyout", min: 14, max: 26, step: 1, unit: "px", hint: "16, matching a nav row · design shipped 20" },
  { id: "flyoutTitleSize", cssVar: "--t-fly-title", label: "Title size", group: "Flyout", min: 11, max: 18, step: 0.5, unit: "px", hint: "Design: 14" },
  { id: "flyoutDescSize", cssVar: "--t-fly-desc", label: "Description size", group: "Flyout", min: 10, max: 16, step: 0.5, unit: "px", hint: "Design: 12.5" },
  { id: "flyoutRowGap", cssVar: "--t-fly-gap", label: "Row gap (all items)", group: "Flyout", min: 0, max: 20, step: 1, unit: "px", hint: "Design: 10 · the trailing run has its own, under Nav rows" },
  { id: "flyoutPadX", cssVar: "--t-fly-pad", label: "Panel padding", group: "Flyout", min: 0, max: 28, step: 1, unit: "px", hint: "10 from live tuning · the whole L2 gutter, header and rows" },
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
/**
 * Every knob that sizes a glyph in the navigation.
 *
 * Collected so one control can move them together. They are four separate
 * sliders because the design can want a flyout glyph larger than a nav one —
 * but "make the icons smaller" is a single thought, and asking someone to
 * have it four times, in two different sections, is how three of them end up
 * at 14 and the fourth stays 16. Ashwin, Oct 13.
 *
 * `navIconHoverSize` is in the list because hover is not a separate decision
 * here: it has matched the resting size since rows stopped growing under the
 * pointer, and leaving it behind would bring that back.
 */
export const NAV_ICON_KNOBS = [
  "navIconSize",
  "navIconHoverSize",
  "flyoutIconSize",
  "dockIconSize",
] as const satisfies readonly (keyof TuningState)[];

/**
 * The sizes the one control offers.
 *
 * 16 is the figure the design was drawn at, and the default. 14 is the
 * compact pass — the whole column a notch lighter, which is a question about
 * the nav as a whole rather than about any one row in it, and so belongs on a
 * control that can only answer it everywhere at once.
 *
 * 14 led the list and shipped as the default for part of Oct 13 before Ashwin
 * put it back; the order below keeps 14 first so the compact option is the
 * one under the cursor, which is the one being looked at.
 */
export const NAV_ICON_SIZES = ["compact", "design"] as const;
export type NavIconSize = (typeof NAV_ICON_SIZES)[number];

export const NAV_ICON_SIZE_PX: Record<NavIconSize, number> = {
  compact: 14,
  design: 16,
};

export const NAV_ICON_SIZE_LABELS: Record<NavIconSize, string> = {
  compact: "14px",
  design: "16px",
};

/**
 * Which preset the knobs currently spell, or null when they disagree.
 *
 * Derived rather than stored, so moving a single slider by hand is not
 * silently overwritten the next time the preset is read — and a nav with
 * three glyphs at 14 and one at 20 honestly matches neither option, which is
 * what null says.
 */
export function navIconSizeOf(state: TuningState): NavIconSize | null {
  const first = state[NAV_ICON_KNOBS[0]];
  const uniform = NAV_ICON_KNOBS.every((k) => state[k] === first);
  if (!uniform) return null;
  return NAV_ICON_SIZES.find((n) => NAV_ICON_SIZE_PX[n] === first) ?? null;
}

/** Knobs dialled as a percentage and written to CSS as a bare ratio. */
const UNITLESS_PERCENT = new Set<keyof TuningState>([
  "dockScale",
  "dragGhostOpacity",
]);

export function tuningToCssVars(state: TuningState): Record<string, string> {
  const out: Record<string, string> = {};
  for (const knob of TUNING_KNOBS) {
    const value = state[knob.id];
    /*
     * Percentages go out as bare numbers.
     *
     * `dockScale` feeds `scale()` and `dragGhostOpacity` feeds `opacity`,
     * and neither takes a unit — `scale(125px)` and `opacity: 92px` are
     * both simply invalid, so the declaration is dropped and the knob does
     * nothing. A set rather than the `=== "dockScale"` this used to be:
     * the second one of these arrived and quietly got `px` stapled to it.
     */
    out[knob.cssVar] = UNITLESS_PERCENT.has(knob.id)
      ? String(value / 100)
      : `${value}${knob.unit}`;
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
  /*
   * The selected row's glyph, two pixels up from whatever the base is.
   *
   * It used to be a flat 18px written into a class, which meant the one row
   * you are actually looking at ignored the icon-size preset entirely — pick
   * 14px and the whole column came down except the row under the pointer.
   * Derived here so "grows" stays a relationship rather than a number, and so
   * a level cannot be left behind by whoever changes the base next.
   *
   * CSS cannot do this on the element: `--t-nav-icon: calc(var(--t-nav-icon)
   * + 2px)` is a custom property referring to itself, which is invalid and
   * resolves to nothing. It needs a variable of its own. Ashwin, Oct 13.
   */
  out["--t-nav-icon-sel"] = `${state.navIconSize + 2}px`;
  out["--t-fly-icon-sel"] = `${state.flyoutIconSize + 2}px`;

  out["--t-nav-icon-scale"] = String(
    state.navIconSize > 0 ? state.navIconHoverSize / state.navIconSize : 1,
  );

  return out;
}
