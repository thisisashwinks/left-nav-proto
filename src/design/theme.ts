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
  // Near-black: the round-2 decision — the product's own accent is quiet, and
  // colour is something a brand brings, not something we impose.
  "black",
  // Follows the current sub-account's logo colour; see [data-accent="account"]
  // in tokens.css.
  "account",
  // An arbitrary swatch — theme-provider writes --custom-accent on <html>.
  "custom",
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
 * Below this viewport width the nav starts collapsed.
 *
 * Measured, not guessed: on a tablet in portrait the viewport is 834px wide, where
 * the 272px nav is 33% of the screen and leaves a 562px canvas. The review flagged
 * tablets without saying what should happen; giving the canvas back is the obvious
 * answer, and 900px sits above the tablet and below any laptop.
 */
export const AUTO_COLLAPSE_WIDTH = 900;

/**
 * How many inline recent rows the nav carries.
 *
 * The 04 Aug review's objection: pinned and recents overlap, and both eat the
 * default menu's real estate. Pinned should show everything pinned; recents need
 * two or three to be worth having; and the two together crowd the product list.
 *
 * `adaptive` is the middle ground the group landed on — recents give way as pins
 * accumulate, because a user who has curated pins has already told you what they
 * reach for. The other two are the endpoints, for comparison.
 *
 * `fixed-three` is the default, and deliberately: the account ships with five pins,
 * so adaptive would open on a single recent row and the designed block — three
 * destinations and a More row — would never be what anyone saw first.
 */
export const RECENTS_MODES = ["adaptive", "flyout-only", "fixed-three"] as const;

export type RecentsMode = (typeof RECENTS_MODES)[number];

export const RECENTS_MODE_LABELS: Record<RecentsMode, string> = {
  adaptive: "Adaptive",
  "flyout-only": "Flyout only",
  "fixed-three": "Always three",
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
  split: "Bottom edge",
  top: "Under the logo",
};

/**
 * How a group row's flyout opens. `click` — Khoi's Aug 10 suggestion, and the
 * default — opens nothing until the row is actually clicked, trading
 * discoverability for calm; `hover` previews on rollover with the
 * direction-aware dwell. Default listed first, as everywhere else.
 */
export const FLYOUT_TRIGGERS = ["click", "hover"] as const;

export type FlyoutTrigger = (typeof FLYOUT_TRIGGERS)[number];

export const FLYOUT_TRIGGER_LABELS: Record<FlyoutTrigger, string> = {
  hover: "On hover",
  click: "On click",
};

/**
 * How the workspace switch is presented — the round-2 models from the
 * exploration board.
 *
 *  rail    Model C: a 56px account rail on the far left. The agency is the
 *          first tile, the clients you have open sit under it, and switching
 *          is one click that costs nothing. The rail is a capped working set,
 *          curated from its own panel — not the full account list.
 *  header  Model A: one nav whose identity row names the scope. The agency is
 *          the marked case — squircle mark plus an AGENCY eyebrow — and a
 *          sub-account is a plain circle with no eyebrow. Mark the exception,
 *          not the rule.
 */
/**
 * How the nav's bands are named, and which of them fold.
 *
 *  plain   What we shipped: one continuous list, bands separated by rules, only
 *          Recent named, nothing folds.
 *  recent  Same, but Recent's heading folds it — the smallest useful version of
 *          the idea, since Recent is the band that goes stale fastest. Its
 *          chevron lines up with the rows' own, so the fold reads as belonging
 *          to the list rather than sitting outside it.
 *  all     Every band named and foldable: Recent, Shortcuts, Products, More.
 *
 * A review axis, so the three can be seen side by side rather than argued about.
 */
export const NAV_SECTIONS = ["plain", "recent", "all"] as const;

export type NavSections = (typeof NAV_SECTIONS)[number];

export const NAV_SECTION_LABELS: Record<NavSections, string> = {
  plain: "Rules only",
  recent: "Recent folds",
  all: "All headings",
};

/**
 * How the app bar and the page canvas are arranged.
 *
 *  plane    What we shipped: the bar paints nothing. Breadcrumb and utilities sit
 *           directly on the shell plane beside the nav card, and the canvas floats
 *           below them as its own inset surface.
 *  canvas   The bar is the canvas's own top edge — one card holding the bar and
 *           the page, the band filled (white, or near-black when the header is
 *           themed dark) with a hairline under it, and the page keeping its own
 *           ground below that line.
 *  surface  The same one card, filled all the way down: bar and page on a single
 *           white surface, with the hairline the only thing dividing them. The
 *           page's ground disappears, so its cards read by their rings alone.
 *
 * A review axis — the question is whether orientation belongs to the window or to
 * the page it names — so all three are built to be switched between live.
 */
export const PAGE_SHELLS = ["plane", "canvas", "surface"] as const;

export type PageShell = (typeof PAGE_SHELLS)[number];

export const PAGE_SHELL_LABELS: Record<PageShell, string> = {
  plane: "Bar on the plane",
  canvas: "Bar in the canvas",
  surface: "One surface",
};

export const SCOPE_MODELS = ["rail", "header"] as const;

export type ScopeModel = (typeof SCOPE_MODELS)[number];

export const SCOPE_MODEL_LABELS: Record<ScopeModel, string> = {
  rail: "Account rail",
  header: "Header only",
};

/**
 * Which navigation the workspace draws: this proposal, or the one shipping today.
 *
 * The whole prototype is an argument about the nav, and an argument needs the
 * thing it is arguing with on screen. Reviewers had been comparing against a
 * memory of production, or against screenshots in another window — so `legacy`
 * draws production's own sidebar, transcribed, and the two become one click
 * apart.
 *
 * A review axis rather than a tenant setting, for the same reason `tabsInNav`
 * is: the point is to compare the two answers, not to ship both.
 */
export const NAV_GENERATIONS = ["new", "legacy"] as const;

export type NavGeneration = (typeof NAV_GENERATIONS)[number];

export const NAV_GENERATION_LABELS: Record<NavGeneration, string> = {
  new: "New nav",
  legacy: "Old nav",
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
  flyoutTrigger: FlyoutTrigger;
  recentsMode: RecentsMode;
  /** Start collapsed on narrow viewports. Off makes the tablet case demoable. */
  autoCollapse: boolean;
  /**
   * The zero-state setup guide (Mapping row 61): Launchpad is an onboarding
   * surface, not a permanent L1 — it shows while an account is still being
   * set up and hides after activation. Per-account, so one demo account can
   * be "new" while the rest are activated.
   */
  launchpad: boolean;
  /** Which workspace-switch model is live. See SCOPE_MODELS. */
  scopeModel: ScopeModel;
  /** Proposal or production. See NAV_GENERATIONS. */
  navGeneration: NavGeneration;
  /**
   * Whether the Editing nav card offers the generation switch.
   *
   * Its own axis because putting the control there is itself a proposal, and a
   * contested one: it lets an admin swap their whole navigation from inside a
   * mode they opened to rename a row, which is either a useful comparison or a
   * cliff edge depending on who you ask. Off, the card keeps its three tools and
   * the switch lives only in the prototype controls — which is what the shipped
   * product would most likely do.
   */
  navSwitchInEditCard: boolean;
  /**
   * Light or dark for the legacy nav, kept apart from `navTheme`.
   *
   * Its own setting rather than the shared one because the two navs are being
   * compared, not swapped: forcing `navTheme` dark on the way into the old nav
   * would leave the new nav dark on the way out, silently changing the thing
   * under review as a side effect of looking at the alternative.
   *
   * Dark by default, which is how production ships it.
   */
  legacyNavTheme: SurfaceTheme;
  /**
   * Whether a page's tabs ALSO appear as nested rows in the nav.
   *
   * The proposed IA marks a lot of nodes as tabs — saved lists, statuses,
   * settings sections — on the argument that a view is not a place. That is a
   * claim worth testing rather than asserting, so this flips it: on, every tab
   * is a nav row and a page with its own breadcrumb, which is roughly what the
   * app does today; off, tabs live only on the page they belong to.
   *
   * A review axis, so it is platform-wide and deliberately out of AccountTheme —
   * the point is to compare the two answers, not to ship one per tenant.
   */
  tabsInNav: boolean;
  /** How the nav's bands are named and whether they fold. See NAV_SECTIONS. */
  navSections: NavSections;
  /** Whether the app bar sits on the plane or inside the canvas. See PAGE_SHELLS. */
  pageShell: PageShell;
}

/**
 * Rendered by the server and used as the client provider's initial state, so
 * the two agree on first paint and hydration stays clean.
 */
export const DEFAULT_THEME: ThemeState = {
  // Account logo colour by default: every sub-account already carries a brand
  // swatch (`logo.from`), and black stays one click away if they want quiet.
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
  // The bottom edge is the default per Khoi's Aug 10 review: with the pill up
  // top, the header + pill + favourites capsule read as "a cluster of icons".
  // Moving the one merged control down clears the nav's entry. "Under the
  // logo" stays one click away for the comparison.
  entryLayout: "split",
  // Click is the default per the Aug 11 direction: Khoi's "maybe the L2
  // doesn't get exposed until the user actually clicks" — hover preview
  // (with its dwell) stays one toggle away for the comparison.
  flyoutTrigger: "click",
  recentsMode: "fixed-three",
  autoCollapse: true,
  // Activated accounts don't see the setup guide; Brightpath (the trial
  // account) carries it as a per-account override.
  launchpad: false,
  // The rail is the recommendation, so the prototype opens on it. Model A is
  // one click away for the comparison.
  scopeModel: "rail",
  // The proposal, obviously. `legacy` is the control group, not the default.
  navGeneration: "new",
  // On, so the comparison is one click from the nav being argued about.
  navSwitchInEditCard: true,
  // Production's own default, and the state both source screenshots were in.
  legacyNavTheme: "dark",
  // Off: the proposal's own answer. The toggle is how you argue with it.
  tabsInNav: false,
  navSections: "plain",
  // The bar in the canvas — the Aug 25 answer to "move back to a normal
  // layout". The nav keeps floating; the chrome joins the page it names, so the
  // arrangement reads as one surface rather than two detached ones.
  pageShell: "canvas",
};

/** Human-readable labels, for the controls UI added later. */
export const ACCENT_LABELS: Record<Accent, string> = {
  black: "Black",
  custom: "Brand colour",
  account: "Sub-account logo",
  highrise: "HighRise primary",
  "pencil-blue": "Pencil blue",
  blue: "Blue",
  "blue-light": "Blue light",
  success: "Success",
  warning: "Warning",
  error: "Error",
};
