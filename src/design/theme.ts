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
export const RECENTS_MODES = [
  "adaptive",
  "flyout-only",
  "fixed-three",
  "merged",
] as const;

export type RecentsMode = (typeof RECENTS_MODES)[number];

export const RECENTS_MODE_LABELS: Record<RecentsMode, string> = {
  adaptive: "Adaptive",
  "flyout-only": "Flyout only",
  "fixed-three": "Always three",
  merged: "Merged with pinned",
};

/*
 * ---------------------------------------------------------------------------
 * Merged recents — the Cloudflare arrangement
 * ---------------------------------------------------------------------------
 *
 * The 04 Aug objection, answered a fourth way: instead of rationing the space
 * between two blocks, there is only one block. Pins sit at the top of Recents
 * and recently visited places follow them — so pinning becomes "keep this at the
 * top of the list I already read" rather than "put this in a second list
 * somewhere else". Cloudflare ships exactly this, and it is the reason a pinned
 * bar and a recents block stop competing for the same 200 vertical pixels.
 *
 * Everything below is an axis of that arrangement rather than a setting we would
 * ship. The merge raises about six questions with no obvious answer, and the
 * only honest way to choose is to look at all of them on screen.
 */

/**
 * How completely the pinned capsule goes away in merged mode.
 *
 *  capsule-off  No floating capsule in the expanded nav, but the collapsed rail
 *               keeps its pinned icons — an icon rail has no room for a titled
 *               list, and pins are the only rows worth an unlabelled glyph.
 *  everywhere   The rail loses them too, and gets a single Recent glyph. The
 *               purest reading of "one list", at the cost of pinning being
 *               invisible whenever the nav is collapsed.
 *  both         Capsule AND merged block, so the two can be compared side by
 *               side. Deliberately the duplication the review objected to — it
 *               is here to be looked at, not to be shipped.
 */
export const MERGED_PIN_SCOPES = ["capsule-off", "everywhere", "both"] as const;

export type MergedPinScope = (typeof MERGED_PIN_SCOPES)[number];

export const MERGED_PIN_SCOPE_LABELS: Record<MergedPinScope, string> = {
  "capsule-off": "Capsule off, rail keeps pins",
  everywhere: "Gone everywhere",
  both: "Keep both",
};

/**
 * How a pinned row is told apart from a recently visited one.
 *
 *  glyph     A filled pin trails the row, and a hairline closes the pinned run.
 *            One list, with the ordering rule made legible.
 *  sublabel  Small-caps PINNED and RECENT headings. Unambiguous, and arguably
 *            re-creates the two blocks the merge was supposed to remove.
 *  none      Nothing. Truly one list — and no way to explain why the order is
 *            stable for some rows and not others.
 */
export const MERGED_PIN_MARKS = ["glyph", "sublabel", "none"] as const;

export type MergedPinMark = (typeof MERGED_PIN_MARKS)[number];

export const MERGED_PIN_MARK_LABELS: Record<MergedPinMark, string> = {
  glyph: "Pin glyph + rule",
  sublabel: "Pinned / Recent headings",
  none: "Nothing",
};

/**
 * What happens past the visible row budget.
 *
 *  expand   "Show N more" opens the rest in place, with the full history still
 *           one click further on. Cheap for a short list, and the list does not
 *           vanish when the pointer leaves.
 *  flyout   A More row opens the existing Recent panel, grouped by day.
 *  cap      Nothing. The block is exactly its budget and the tail falls off,
 *           which makes over-pinning a visible cost.
 */
export const MERGED_OVERFLOWS = ["expand", "flyout", "cap"] as const;

export type MergedOverflow = (typeof MERGED_OVERFLOWS)[number];

export const MERGED_OVERFLOW_LABELS: Record<MergedOverflow, string> = {
  expand: "Expand in place",
  flyout: "More opens the panel",
  cap: "Hard cap",
};

/**
 * Whether a row names its place in the tree underneath itself.
 *
 * The screenshot's distinguishing feature: "Argo Smart Routing" over
 * "content-mobbin.xyz / Traffic". It is what makes a merged list survive pinned
 * L3s, whose names collide constantly — three products have a Settings. It also
 * roughly doubles row height, so it trades legibility for count, which is the
 * whole reason it is a switch and not a decision.
 */
export const MERGED_ROW_DETAILS = ["name", "breadcrumb"] as const;

export type MergedRowDetail = (typeof MERGED_ROW_DETAILS)[number];

export const MERGED_ROW_DETAIL_LABELS: Record<MergedRowDetail, string> = {
  name: "Name only",
  breadcrumb: "Name + breadcrumb",
};

/**
 * What the merged block is called.
 *
 * The merge's sharpest edge case, and the one a name can dissolve: you can pin
 * a page you have never opened, and it lands in a block headed RECENT. The
 * heading is then simply false, and no amount of ordering or marking fixes a
 * false heading.
 *
 * `recents` is Cloudflare's own answer — they get away with it because their
 * pins are shallow and usually recent anyway. `quick-access` is Drive's, and it
 * is the honest one: curated things and recent things are both quick access, so
 * the block can hold either without the label lying and without needing to
 * explain the ordering rule. `shortcuts` says the same thing in a shorter word
 * and gives up the "recent" idea entirely.
 */
export const MERGED_HEADINGS = ["recents", "quick-access", "shortcuts"] as const;

export type MergedHeading = (typeof MERGED_HEADINGS)[number];

export const MERGED_HEADING_LABELS: Record<MergedHeading, string> = {
  recents: "Recents",
  "quick-access": "Quick access",
  shortcuts: "Shortcuts",
};

/**
 * What "recent" means in the agency nav.
 *
 * The one place the merge does not simply port across. A sub-account's Recent
 * names places; the agency's names ACCOUNTS — the clients you last had open —
 * and the agency's pins name places again (Prospecting, Snapshots, rollup
 * reporting). So merging pins into the agency's Recent asks a question the
 * sub-account never had to answer: which of the two units is the list made of.
 *
 *  places    Pins and recently visited agency areas. Recent accounts keeps its
 *            own block, because switching client is not navigating — it changes
 *            what the whole nav is about, and burying that in a list of pages
 *            makes the most consequential row in the agency nav the least
 *            marked one.
 *  accounts  Pins and recently visited accounts in one list. Closest to what
 *            the agency nav shows today, and the version where a pinned page
 *            and a client sit a row apart.
 *  both      Pins, then places, then accounts. Everything reachable in one
 *            list, and three runs deep — worth seeing before ruling out.
 */
export const MERGED_AGENCY_RECENTS = ["places", "accounts", "both"] as const;

export type MergedAgencyRecents = (typeof MERGED_AGENCY_RECENTS)[number];

export const MERGED_AGENCY_RECENTS_LABELS: Record<MergedAgencyRecents, string> = {
  places: "Agency areas",
  accounts: "Accounts",
  both: "Areas + accounts",
};

/**
 * Which end of the pinned run a new pin lands on.
 *
 *  newest    Prepended, so the row you just pinned is the first thing under the
 *            heading. The merge loses the capsule's "it flew over there"
 *            feedback, and this is the cheapest way to give it back.
 *  arranged  Pin order as stored, which is what the launcher lets you drag. One
 *            order everywhere, at the cost of a new pin appearing several rows
 *            down — sometimes below the fold.
 */
export const MERGED_PIN_ORDERS = ["newest", "arranged"] as const;

export type MergedPinOrder = (typeof MERGED_PIN_ORDERS)[number];

export const MERGED_PIN_ORDER_LABELS: Record<MergedPinOrder, string> = {
  newest: "Newest pin first",
  arranged: "As arranged",
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
 * Where the companion apps are handed to you.
 *
 * One modal either way — the komoot-style Get the app sheet — and three places
 * to reach it from. They are not the same offer:
 *
 *  header  Two glyphs in the app bar, left of the phone. Standing and visible,
 *          which is the point: an app nobody installs is an app nobody knew
 *          about, and the bar is the one strip of chrome every screen shows.
 *          The cost is two more glyphs in a row that is already six wide.
 *  menu    Two rows in the avatar menu, where production put them. Discreet and
 *          conventional — and behind a menu most users open once, to sign out.
 *  nav     Two rows in the sidebar, beside Settings. Reads as part of the
 *          product rather than as an ad for it, at the price of nav height
 *          spent on something you do exactly once.
 *
 * Exclusive, all three. The offer duplicated across two surfaces is the
 * duplication the review keeps objecting to everywhere else.
 */
export const GET_APP_PLACEMENTS = ["header", "menu", "nav"] as const;

export type GetAppPlacement = (typeof GET_APP_PLACEMENTS)[number];

export const GET_APP_PLACEMENT_LABELS: Record<GetAppPlacement, string> = {
  header: "App bar",
  menu: "Avatar menu",
  nav: "Sidebar",
};

/**
 * Where search and Ask AI live.
 *
 * `split` is today's arrangement: the merged pill holds the nav's bottom edge.
 * `top` is the review's open question — the same pill as the second thing in the
 * nav, directly under the logo and above Favorites, so it is the first thing a
 * user meets on entry. `header` takes it out of the nav altogether and puts it
 * in the app bar, left of the utility icons: the one placement that survives the
 * nav collapsing, since the bar never does.
 *
 * Exclusive, all three. The pill is a standing entry point and two of them on
 * one screen is the duplication the review flagged in the first place.
 */
export const ENTRY_LAYOUTS = ["split", "top", "header"] as const;

export type EntryLayout = (typeof ENTRY_LAYOUTS)[number];

export const ENTRY_LAYOUT_LABELS: Record<EntryLayout, string> = {
  split: "Bottom edge",
  top: "Under the logo",
  header: "Top bar",
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
 * The shape of a tile in the account rail.
 *
 *  pill      Fully rounded: the row, the agency's plate above it and the
 *            agency's own mark. One shape down the whole strip, which is what
 *            makes the rail read as a column of tokens rather than a stack of
 *            small cards.
 *  squircle  The 9px tile the rail shipped with, and the rounded square on the
 *            agency mark that set it apart from the tenant discs below.
 *
 * A review axis: it changes nothing but shape, and the argument for either is
 * one you have to see rather than read.
 */
/**
 * How the account rail marks the account you are in.
 *
 * The rail draws every tenant at one size, and says which one is live with a
 * filled tile and a bar at the strip's edge. Both are marks you have to READ:
 * they are the same shape as everything around them, differing only in fill.
 *
 *  uniform   What ships: one size down the strip, active carried by fill and
 *            the edge bar.
 *  active    Inactive tiles come down to 20px and the live one keeps 24, so
 *            size is the signal. One big disc in a column of small ones is
 *            seen rather than read — and it is the only treatment that also
 *            answers "none of them", which is what agency scope looks like.
 *
 * The cost is legibility: real tenant logos are already poor at 24px, which is
 * why the rail widens to names on hover. `railMagnify` is the counterweight —
 * see below.
 */
export const RAIL_SIZINGS = ["uniform", "active"] as const;

export type RailSizing = (typeof RAIL_SIZINGS)[number];

export const RAIL_SIZING_LABELS: Record<RailSizing, string> = {
  uniform: "One size",
  active: "Active is larger",
};

/** Resting diameter of a tile that is not the active account, in px. */
export const RAIL_TILE_SIZE = 24;
export const RAIL_TILE_SIZE_SMALL = 20;

export const RAIL_TILE_SHAPES = ["pill", "squircle"] as const;

export type RailTileShape = (typeof RAIL_TILE_SHAPES)[number];

export const RAIL_TILE_SHAPE_LABELS: Record<RailTileShape, string> = {
  pill: "Pill",
  squircle: "Squircle",
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
/**
 * What the edit card's colour control is.
 *
 * `toggle` — one icon that flips the nav between light and dark, and nothing
 *   else. The default, because light-or-dark is the only colour decision most
 *   admins make and it is the only one they make more than once. An icon that
 *   does it in a click beats a panel that does it in three.
 * `panel` — the full surface: light/dark, ten accents, and a custom picker with
 *   the contrast reading underneath.
 *
 * Both answers keep every capability. Under `toggle` the accents and the custom
 * picker move into the prototype controls rather than disappearing, so the axis
 * is about where the rarely-used half of the panel lives, not whether it exists.
 */
/**
 * What happens when edits made on the HighLevel default are about to replace
 * my layout.
 *
 *  simple    A message and two buttons. Save changes adopts the edited default
 *            as my layout; the one it replaces is simply gone. Nothing to name,
 *            nothing to file — the case for it is that most people editing the
 *            shipped nav are building the layout they actually want, and asking
 *            them to name and archive the arrangement they are deliberately
 *            leaving behind is a step about a thing they have stopped caring
 *            about.
 *  keep-old  The full version: the arrangement being replaced is offered as a
 *            named template first, so it can be put back later. Three answers,
 *            weighted, with a name field.
 *
 * A review axis rather than a setting: the question is how much ceremony this
 * one destructive moment deserves, and it is answered by watching people meet
 * it, not by arguing about it.
 */
/**
 * Which palette the Conversations inbox paints itself in.
 *
 *  tokens   The prototype's own page tokens, like every other surface here: it
 *           follows light and dark, and the accent, so the inbox changes with
 *           whatever is being reviewed.
 *  product  The colours the shipped inbox actually uses — the greys, the blue
 *           and the WhatsApp green off the real screen. Pixel-close to what a
 *           customer sees today, and deliberately fixed: it does not follow the
 *           app theme, because the page it is imitating does not either.
 *
 * Scoped to the inbox on purpose. It is the one page in the prototype drawn
 * from a screenshot rather than from the design system, so it is the one page
 * where "does our system change how this reads" is a question worth being able
 * to answer by flipping between the two.
 */
export const INBOX_PALETTES = ["product", "tokens"] as const;

export type InboxPalette = (typeof INBOX_PALETTES)[number];

export const INBOX_PALETTE_LABELS: Record<InboxPalette, string> = {
  product: "Product",
  tokens: "Prototype",
};

export const LAYOUT_REPLACE_DIALOGS = ["simple", "keep-old"] as const;

export type LayoutReplaceDialog = (typeof LAYOUT_REPLACE_DIALOGS)[number];

export const LAYOUT_REPLACE_DIALOG_LABELS: Record<LayoutReplaceDialog, string> =
  {
    simple: "Simple",
    "keep-old": "Save old layout",
  };

export const NAV_COLOUR_CONTROLS = ["toggle", "panel"] as const;

export type NavColourControl = (typeof NAV_COLOUR_CONTROLS)[number];

export const NAV_COLOUR_CONTROL_LABELS: Record<NavColourControl, string> = {
  toggle: "Light / dark icon",
  panel: "Full colours panel",
};

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
  /** Where the Get the app offer is reached from. See GET_APP_PLACEMENTS. */
  getAppPlacement: GetAppPlacement;
  flyoutTrigger: FlyoutTrigger;
  recentsMode: RecentsMode;
  /*
   * The merged arrangement's own axes. Read only when `recentsMode` is
   * "merged"; kept on the theme rather than behind it so switching modes back
   * and forth never loses how you had the merge tuned.
   */
  mergedPinScope: MergedPinScope;
  mergedPinMark: MergedPinMark;
  mergedOverflow: MergedOverflow;
  mergedRowDetail: MergedRowDetail;
  mergedPinOrder: MergedPinOrder;
  mergedHeading: MergedHeading;
  /**
   * Whether the merged panel carries a search field.
   *
   * The panel behind "View all" is the merge's manage surface — full history,
   * the pin list with its grips, and everything the account owns. Search makes
   * it a place you can also *find* things in, which is either the reason the
   * panel earns its width or the reason it stops being a nav panel and starts
   * being a second command palette. On, and one click from off.
   */
  mergedPanelSearch: boolean;
  /** What the agency nav's merged list is made of. See MERGED_AGENCY_RECENTS. */
  mergedAgencyRecents: MergedAgencyRecents;
  /** Rows the block shows before overflowing — pinned and recent together. */
  mergedVisibleRows: number;
  /** Most pinned rows the unexpanded block will spend its budget on. */
  mergedPinCap: number;
  /** Recent rows the pinned run may never squeeze out. */
  mergedRecentFloor: number;
  /** Rows the expanded block grows to, before the panel takes over. */
  mergedExpandedRows: number;
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
  /** Which palette the Conversations inbox uses. See INBOX_PALETTES. */
  inboxPalette: InboxPalette;
  /** How replacing my layout is confirmed. See LAYOUT_REPLACE_DIALOGS. */
  layoutReplaceDialog: LayoutReplaceDialog;
  /** Which colour control the edit card carries. See NAV_COLOUR_CONTROLS. */
  navColourControl: NavColourControl;
  /**
   * Whether the Editing nav card offers the layout switch.
   *
   * The same question as `navSwitchInEditCard` and just as contested: showing an
   * admin the shipped sidebar is a support tool, and putting it inside a
   * restructuring mode is a claim that it belongs to editing. Off, the menu keeps
   * only its template rows and the default layout is unreachable from the nav —
   * which is worth being able to see, because it is what the product would look
   * like if this idea were cut.
   */
  layoutSwitchInEditCard: boolean;
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
  /** The account rail's tile shape, agency plate and mark included. */
  railTileShape: RailTileShape;
  /** Whether size marks the active account. See RAIL_SIZINGS. */
  railSizing: RailSizing;
  /**
   * macOS-Dock magnification on the account rail.
   *
   * Kept separate from `railSizing` because they answer different questions —
   * one is how the rail marks state at rest, the other is what it does under
   * the pointer — and either is defensible without the other. Together they
   * are the whole proposal: shrink the tiles, then hand the size back to
   * whoever points at one.
   */
  railMagnify: boolean;
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
  /*
   * The app bar.
   *
   * Khoi's Aug 10 review put it on the nav's bottom edge, to clear the cluster
   * of icons that the header, the pill and the favourites capsule made of the
   * nav's top. The bar answers that objection better: the pill is out of the
   * nav altogether, so there is no cluster to break up — and it is the one
   * placement that survives the nav collapsing, since the bar never does.
   *
   * Both nav placements stay one click away for the comparison.
   */
  entryLayout: "header",
  /*
   * The avatar menu, which is where production puts it.
   *
   * The bar is the louder answer and it is one click away, but with search now
   * standing up there too the utility run is carrying the pill, five glyphs and
   * the avatar — and two more for the companion apps turns a row of things this
   * account DOES into a row that also advertises. The menu is the conventional
   * home for it; whether that is too quiet is exactly what the axis is for.
   */
  getAppPlacement: "menu",
  // Click is the default per the Aug 11 direction: Khoi's "maybe the L2
  // doesn't get exposed until the user actually clicks" — hover preview
  // (with its dwell) stays one toggle away for the comparison.
  flyoutTrigger: "click",
  recentsMode: "fixed-three",
  /*
   * The merge's defaults are the recommendation, not a neutral position: the
   * capsule goes, the block never folds, pins wear a glyph and a rule, the tail
   * expands in place, rows carry their breadcrumb, and a new pin lands on top.
   * Every one of them is one click from its alternatives.
   */
  mergedPinScope: "capsule-off",
  mergedPinMark: "glyph",
  mergedOverflow: "expand",
  mergedRowDetail: "breadcrumb",
  mergedPinOrder: "newest",
  mergedHeading: "quick-access",
  mergedPanelSearch: true,
  // Places, so Recent accounts keeps the block it has earned.
  mergedAgencyRecents: "places",
  /*
   * Five, three, two. Five is what the screenshot shows and about what a nav can
   * spend on history before the product list starts below the fold; three pins
   * is the point past which a pinned run stops reading as "a few favourites";
   * two recents is the floor below which the block stops being Recents at all
   * and quietly becomes a pinned bar with a history glyph on it.
   */
  mergedVisibleRows: 5,
  mergedPinCap: 3,
  mergedRecentFloor: 2,
  mergedExpandedRows: 12,
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
  // The icon, not the panel: one click for the decision people actually repeat.
  // The two-button version is the proposal: one destructive moment, one
  // sentence, two answers. The template-saving version is one click away.
  // The real thing by default: the page is a transcription of a screenshot, so
  // it opens looking like the screenshot. The tokened version is one click away.
  inboxPalette: "product",
  layoutReplaceDialog: "simple",
  navColourControl: "toggle",
  // On, for the same reason: the comparison should be one menu away.
  layoutSwitchInEditCard: true,
  // Production's own default, and the state both source screenshots were in.
  legacyNavTheme: "dark",
  // Off: the proposal's own answer. The toggle is how you argue with it.
  tabsInNav: false,
  navSections: "plain",
  // Fully rounded, which is the proposal. The squircle the rail shipped with is
  // one click away for the comparison.
  railTileShape: "pill",
  // Both off: this is a proposal, and the rail that ships is the thing it has
  // to be compared against.
  railSizing: "uniform",
  railMagnify: false,
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
