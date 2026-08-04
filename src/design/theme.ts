/**
 * Theme axes for the prototype.
 *
 * Each axis maps to a data attribute that `src/design/tokens.css` keys off:
 *   accent      -> [data-accent]        on <html>
 *   appTheme    -> [data-app-theme]     on <html>
 *   navTheme    -> [data-nav-theme]     on the nav element
 *   headerTheme -> [data-header-theme]  on the header element
 *
 * `navTheme` is deliberately independent of `appTheme` so the nav can be dark
 * while the rest of the app stays light.
 */

export const ACCENTS = [
  // Follows the current sub-account's logo colour; see [data-accent="account"]
  // in tokens.css. First in the list because it is the default.
  "account",
  "highrise",
  "pencil-blue",
  "blue",
  "blue-light",
  "success",
  "warning",
  "error",
] as const;

export type Accent = (typeof ACCENTS)[number];

export const SURFACE_THEMES = ["light", "dark"] as const;

export type SurfaceTheme = (typeof SURFACE_THEMES)[number];

/**
 * The two search treatments explored in the review: a ⌘K takeover, and a panel
 * docked in the nav. Both are built so they can be compared live.
 */
export const SEARCH_MODES = ["spotlight", "flyout"] as const;

export type SearchMode = (typeof SEARCH_MODES)[number];

export const SEARCH_MODE_LABELS: Record<SearchMode, string> = {
  spotlight: "Spotlight (⌘K)",
  flyout: "Nav panel",
};

/**
 * How far the accent reaches into the neutrals — surfaces, borders and text.
 *
 * `off` keeps the design's own neutral ramps verbatim, so the accent only
 * repaints the things that are already accent-coloured. The other two rebuild
 * every neutral at its measured lightness but on the accent's hue, which is
 * what turns a recolour into a whole-workspace theme rather than a button swap.
 */
export const TINTS = ["off", "subtle", "full"] as const;

export type Tint = (typeof TINTS)[number];

export const TINT_LABELS: Record<Tint, string> = {
  off: "Off",
  subtle: "Subtle",
  full: "Full",
};

/**
 * Where the favourites dock puts an icon's name.
 *
 * `under` is what the dock shipped with — the caption tracks the hovered icon,
 * macOS-style. The review flagged two problems with it: the caption moves, and it
 * reads as content appearing under the row. So two alternatives:
 *
 *  center  One caption, fixed inside the band along its bottom edge, whose *text*
 *          changes with the hovered icon. Nothing moves, so nothing can be nudged.
 *  none    No caption at all — the current default. The native tooltip carries
 *          the name instead.
 */
export const DOCK_LABELS = ["under", "center", "none"] as const;

export type DockLabel = (typeof DOCK_LABELS)[number];

export const DOCK_LABEL_LABELS: Record<DockLabel, string> = {
  under: "Under the icon",
  center: "Centred, fixed",
  none: "None",
};

/**
 * Where the favourites dock sits in the nav.
 *
 * `top` is the design: directly under the logo, the first thing you see. `bottom`
 * pins it to the nav's last edge instead — a thumb-rail, always in the same place
 * regardless of how far the product list has scrolled, and out of the way of the
 * cluster of standing entry points at the top.
 *
 * Worth testing because the two answer different questions. At the top the dock is
 * a statement of what matters; at the bottom it is a tool you reach for.
 */
export const DOCK_POSITIONS = ["top", "bottom"] as const;

export type DockPosition = (typeof DOCK_POSITIONS)[number];

export const DOCK_POSITION_LABELS: Record<DockPosition, string> = {
  top: "Under the logo",
  bottom: "Nav bottom edge",
};

/**
 * Where search and Ask AI live.
 *
 * `split` is today's arrangement: search is an icon in the logo row, Ask AI holds
 * the nav's bottom edge. `top` is the review's open question — both together as
 * the second thing in the nav, directly under the logo and above Favorites, so
 * they are the first thing a user meets on entry.
 */
export const ENTRY_LAYOUTS = ["split", "top"] as const;

export type EntryLayout = (typeof ENTRY_LAYOUTS)[number];

export const ENTRY_LAYOUT_LABELS: Record<EntryLayout, string> = {
  split: "Header + bottom",
  top: "Both under the logo",
};

export interface ThemeState {
  accent: Accent;
  /** Whether the accent also tints the whites, greys and text. */
  tint: Tint;
  appTheme: SurfaceTheme;
  navTheme: SurfaceTheme;
  headerTheme: SurfaceTheme;
  searchMode: SearchMode;
  /** Search defaults to dark so it never reads as part of the nav. */
  searchTheme: SurfaceTheme;
  dockLabel: DockLabel;
  dockPosition: DockPosition;
  entryLayout: EntryLayout;
}

/**
 * Rendered by the server and used as the client provider's initial state, so
 * the two agree on first paint and hydration stays clean.
 */
export const DEFAULT_THEME: ThemeState = {
  // Falls back to the HighRise primary until the switcher writes an account
  // colour, so this is identical to `highrise` on first paint.
  accent: "account",
  tint: "off",
  appTheme: "light",
  navTheme: "light",
  headerTheme: "light",
  searchMode: "spotlight",
  searchTheme: "dark",
  // No caption by default. The dock is five icons the user chose and put there,
  // so it is the one row where recognition is already solved; the tooltip covers
  // the rest. `center` and `under` stay one click away for the comparison.
  dockLabel: "none",
  dockPosition: "top",
  // Both under the logo is the default now: it is the arrangement the review
  // wanted to see, and it closes the search/Ask AI overlap rather than keeping one
  // at each end of the nav.
  entryLayout: "top",
};

/** Human-readable labels, for the controls UI added later. */
export const ACCENT_LABELS: Record<Accent, string> = {
  account: "Sub-account logo",
  highrise: "HighRise primary",
  "pencil-blue": "Pencil blue",
  blue: "Blue",
  "blue-light": "Blue light",
  success: "Success",
  warning: "Warning",
  error: "Error",
};
