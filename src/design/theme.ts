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

import type {
  ListHeaderVariant,
  RecordHeaderVariant,
  BuilderCanvas,
  BuilderControls,
  BuilderExit,
  PanelHeaderVariant,
  DeepHeaderVariant,
} from "@/components/page/header-variants";

/**
 * How a list page draws its views, search, filters, sort and columns.
 *
 * `page` is whatever each page built for itself — the default, and the thing
 * the others are compared against. Every other value hands the whole band to
 * the shared ListToolbar, which draws the same controls one way everywhere,
 * so a variant is judged on every list page at once rather than on the one
 * page someone happened to mock it on.
 */
export const LIST_TOOLBARS = [
  "page",
  "one-row",
  "view-dropdown",
  "pills",
  "side-views",
  "filter-bar",
  "view-menu",
] as const;
export type ListToolbarVariant = (typeof LIST_TOOLBARS)[number];
export const LIST_TOOLBAR_LABELS: Record<ListToolbarVariant, string> = {
  page: "Page default",
  "one-row": "Tabs and filters in one row",
  "view-dropdown": "Views in a dropdown",
  pills: "Views as pills",
  "side-views": "Views in a side list",
  "filter-bar": "One filter bar",
  "view-menu": "Tabs and a View menu",
};

/** Icons on every crumb, or only the Home glyph. */
export type CrumbIcons = "all" | "home";
export const CRUMB_ICONS: readonly CrumbIcons[] = ["all", "home"];
export const CRUMB_ICON_LABELS: Record<CrumbIcons, string> = {
  all: "Every level",
  home: "Home only",
};

/** What a record's crumb calls itself. */
export type RecordCrumbLabel = "name" | "generic";
export const RECORD_CRUMB_LABELS: readonly RecordCrumbLabel[] = [
  "name",
  "generic",
];
export const RECORD_CRUMB_LABEL_LABELS: Record<RecordCrumbLabel, string> = {
  name: "The record's name",
  generic: "What kind of thing it is",
};

/**
 * Where a record's back control sits.
 *
 * Three places, not a boolean, because each one is a different claim about
 * what the exit IS. `recordBackButton` still decides whether there is one at
 * all; this decides where, and the two together are the whole question.
 */
export type RecordBackPlace = "crumb" | "header" | "inline";
export const RECORD_BACK_PLACES: readonly RecordBackPlace[] = [
  "crumb",
  "header",
  "inline",
];
export const RECORD_BACK_PLACE_LABELS: Record<RecordBackPlace, string> = {
  crumb: "In the breadcrumb",
  header: "In the page header",
  inline: "In the canvas",
};

/** Where the tree's own search sits in the column. */
export type TreeSearchPlace = "launchpad" | "recents" | "products" | "off";
export const TREE_SEARCH_PLACES: readonly TreeSearchPlace[] = [
  "launchpad",
  "recents",
  "products",
  "off",
];
export const TREE_SEARCH_PLACE_LABELS: Record<TreeSearchPlace, string> = {
  launchpad: "Above Launchpad",
  recents: "Above Recents",
  products: "Above all products",
  off: "No search",
};

/** Where the trail begins. */
export type CrumbStart = "group" | "product";
export const CRUMB_STARTS: readonly CrumbStart[] = ["group", "product"];
export const CRUMB_START_LABELS: Record<CrumbStart, string> = {
  group: "The bucket (CRM)",
  product: "The product (Contacts)",
};

/** How a long trail folds. */
export type CrumbCollapse = "off" | "middle" | "deep";
export const CRUMB_COLLAPSES: readonly CrumbCollapse[] = [
  "off",
  "middle",
  "deep",
];
export const CRUMB_COLLAPSE_LABELS: Record<CrumbCollapse, string> = {
  off: "Never",
  middle: "Past four",
  deep: "Home + parent",
};

/** Two views of one collection: a tab strip, or one segmented control. */
export type CalendarViewSwitch = "tabs" | "switcher";
export const CALENDAR_VIEW_SWITCHES: readonly CalendarViewSwitch[] = [
  "tabs",
  "switcher",
];
export const CALENDAR_VIEW_SWITCH_LABELS: Record<CalendarViewSwitch, string> = {
  tabs: "Tabs",
  switcher: "Content switcher",
};

/** Rows of chrome, or islands floating on the canvas. */
export type BuilderChromeStyle = "rows" | "floating";
export const BUILDER_CHROME_STYLES: readonly BuilderChromeStyle[] = [
  "rows",
  "floating",
];
export const BUILDER_CHROME_STYLE_LABELS: Record<BuilderChromeStyle, string> = {
  rows: "Rows",
  floating: "Floating on the canvas",
};

/**
 * What the product tree draws down its left edge.
 *
 * `l2-only` is the fifth and the most opinionated (Ashwin, Sep 30): the
 * PRODUCT is the only level that gets a picture. The group above it is a word
 * — it names a shelf, and shelves have no icons in any filing system — and the
 * pages below it get a hairline guide instead, because what a page needs said
 * about it is which product it belongs to, which is a line's job and not a
 * glyph's. It is `hide-l3` and `rails` and the group's own de-emphasis
 * combined into the one arrangement that uses each of them where it is right,
 * rather than applying one rule uniformly to three levels that are not alike.
 */
export type TreeIcons = "all" | "hide-l3" | "l2-only" | "none" | "rails";
export const TREE_ICONS: readonly TreeIcons[] = [
  "all",
  "hide-l3",
  "l2-only",
  "none",
  "rails",
];
export const TREE_ICON_LABELS: Record<TreeIcons, string> = {
  all: "Every level",
  "hide-l3": "Not on L3",
  "l2-only": "Products only",
  none: "No icons",
  rails: "Guide lines",
};

/**
 * How much the trail's text is worth.
 *
 * 13px is the bar's own reading size, chosen when the trail was chrome sitting
 * beside the utilities. The argument for 15px is the one the emphasis axis
 * makes one step further: a page that has dropped its title has nothing else
 * saying what it is, and 13px is a caption being asked to do a heading's work.
 */
export type CrumbScale = "default" | "large";
export const CRUMB_SCALES: readonly CrumbScale[] = ["default", "large"];
export const CRUMB_SCALE_LABELS: Record<CrumbScale, string> = {
  default: "13px",
  large: "15px",
};
/** Base size in px, which the leaf's own emphasis then builds on. */
export const CRUMB_SCALE_PX: Record<CrumbScale, number> = {
  default: 13,
  large: 15,
};

/**
 * What marks the last crumb out, on top of the semibold it always carries.
 *
 * Two independent means, so all four combinations are reachable: a ground to
 * sit on, and type that outweighs the crumbs behind it. They answer different
 * objections — the chip says "this segment is not like the others", the type
 * says "this is the page's name" — and which one a page needs depends on
 * whether it kept its title.
 */
export type CrumbEmphasis = "off" | "chip" | "type" | "both";
export const CRUMB_EMPHASES: readonly CrumbEmphasis[] = [
  "off",
  "chip",
  "type",
  "both",
];
export const CRUMB_EMPHASIS_LABELS: Record<CrumbEmphasis, string> = {
  off: "Off",
  chip: "Chip",
  type: "Type",
  both: "Both",
};
/** What the leaf adds to `CRUMB_SCALE_PX` under each answer. */
export const CRUMB_EMPHASIS_BUMP_PX = 2;

/**
 * What the trail's LAST segment is.
 *
 * Every value keeps the ancestors and their separators untouched — this axis
 * is only ever about the end of the line, which is the one crumb that names
 * the page you are already on. That is what makes it worth an axis: the leaf
 * is the segment with the weakest claim to being there (you know where you
 * are; you are looking at it) and the strongest claim to being useful (its
 * menu is the fastest way to the sibling you actually want).
 *
 *  full   The word and its caret — "Smart lists ▾". What ships. The leaf
 *         states the page and offers its siblings, and pays a full segment's
 *         width to do it.
 *  caret  The caret alone — "CRM › Contacts › ▾". The switching survives and
 *         the naming goes, on the argument that the page header a few pixels
 *         below says the same word. Worth seeing because it is the cheapest
 *         possible way to keep the move, and because it asks whether a
 *         control with no label is still discoverable.
 *  dots   "⋯", the overflow idiom, doing the same job. Says "there is more
 *         here" without claiming to be a place, which is the honest reading
 *         of a control whose menu holds siblings rather than children — and
 *         it is a mark people already know how to press.
 *  none   No leaf at all. The trail stops at the parent and the page names
 *         itself. The strictest reading of "do not say it twice", and the
 *         only value that gives the move up entirely.
 *  title  No leaf in the trail; the PAGE TITLE grows the caret and the menu
 *         instead. One name on screen and the switching attached to it — the
 *         arrangement the Aug 18 Contacts work argued for, generalised. It
 *         needs a title to attach to, so it falls back to `none` when the
 *         page header has none to give.
 */
export type CrumbLeaf = "full" | "caret" | "dots" | "title";
export const CRUMB_LEAVES: readonly CrumbLeaf[] = [
  "full",
  "caret",
  "dots",
  "title",
];
export const CRUMB_LEAF_LABELS: Record<CrumbLeaf, string> = {
  full: "Word and caret",
  caret: "Caret only",
  dots: "Three dots",
  title: "On the page title",
};

/**
 * How much of the trail's tail is printed at all.
 *
 * Split out of `crumbLeaf` on Sep 29, which had been answering two questions
 * with one control: how many trailing segments to SHOW, and how to DRAW the
 * one that ends up last. That was fine while the only answer to the first was
 * "all of them or one fewer" — `crumbLeaf: "none"` carried it. Folders broke
 * it: a two-level path makes Automation ▸ Workflows ▸ Sales ▸ Quotes, and
 * Ashwin wanted to stop at Workflows, which is not a way of drawing a leaf.
 *
 *  full      Every segment. The trail states the whole path.
 *  last      Drop the leaf. The page names itself in its own header, and the
 *            trail is the way back rather than a second title.
 *  last-two  Drop the leaf and its parent. On a foldered list that means the
 *            trail stops at the collection — Automation ▸ Workflows — and
 *            everything below it is the canvas's business.
 *
 * Never trims below two segments: see `trimTrail`. A trail cut to one word is
 * not a shorter path, it is a label, and the option that produced it would be
 * indistinguishable from the one that turns the trail off.
 *
 * The bar only. The table's own trail (see `tableCrumb`) always states the
 * whole path, because that one is the file browser's and a browser that hid
 * where you were standing would be useless. Ashwin, Sep 29.
 */
export type CrumbDepth = "full" | "last" | "last-two";
export const CRUMB_DEPTHS: readonly CrumbDepth[] = ["full", "last", "last-two"];
export const CRUMB_DEPTH_LABELS: Record<CrumbDepth, string> = {
  full: "Every crumb",
  last: "Drop the last",
  "last-two": "Drop the last two",
};

/**
 * Trims a finished trail to the chosen depth.
 *
 * Here rather than in the bar because two surfaces draw this array — the app
 * bar and a builder's own row — and a rule applied in one of them is the kind
 * of difference nobody notices until a screenshot of the builder disagrees
 * with the screenshot of the list it was opened from.
 */
export function trimTrail<T>(trail: readonly T[], depth: CrumbDepth): T[] {
  const drop = depth === "last" ? 1 : depth === "last-two" ? 2 : 0;
  // Two is the floor. Below that there is no path left to state.
  const keep = Math.max(2, trail.length - drop);
  return trail.slice(0, Math.min(trail.length, keep));
}

/**
 * Which crumbs carry a dropdown onto their siblings.
 *
 * It was a boolean, and the boolean hid the interesting answer. The argument
 * against switchers is about the ANCESTORS: a rank of carets down a row makes
 * the trail read as a toolbar, and the levels above you are ones the nav can
 * already reach. The argument for them is almost entirely about the LEAF —
 * "which other smart list", "which other page of this product" — a sideways
 * move with no other home, asked at the level you are standing on.
 *
 * Off and on could not separate those, so the option was a trade between two
 * things that do not have to be traded. `leaf` is the arrangement that falls
 * out once you notice: the trail reads as a path, and the one segment whose
 * menu earns its caret keeps it.
 *
 *  all   Every segment switches. The Aug 13 arrangement.
 *  leaf  Only the last. Ancestors are words — still clickable, still walking
 *        you back up (see `crumbTargetFor`), just without menus.
 *  off   None. The trail states where you are and nothing more.
 */
/**
 * What a folder's crumb does to the view crumb already in the trail.
 *
 * Workflows is the first collection with a level BETWEEN the list and the
 * record — Automation ▸ Workflows ▸ Intake ▸ New enquiry — and it arrives on a
 * trail that in L-E is already ending in a scope control. Two answers, both
 * asked for on Sep 28, because both are real arrangements rather than one
 * being a mistake.
 *
 *  replace  The folder IS the scope change, so it takes the slot the view was
 *           holding and the cuts go back to a tab strip inside the folder. One
 *           scope control at a time, and the trail stays the length it was.
 *  beside   Folder then view: Intake ▸ Drafts. The trail grows a level, each
 *           segment switching its own axis. Says more, and is the arrangement
 *           that gets long fastest — which is the thing to look at.
 */
/**
 * Where the table's own path is drawn, if anywhere.
 *
 * A boolean until Sep 29, when the placement turned out to be the interesting
 * part rather than the presence. Inside the card the trail reads as the
 * table's own header — which is what the real screen does, and what makes it
 * feel like a file browser. Above it, the trail belongs to the page and the
 * card stays a plain table; that is the arrangement that survives a card with
 * its own toolbar band, and the one that looks least like a second header.
 *
 *  off     No second trail. The bar is saying the path already.
 *  inside  First band of the card, above the column heads.
 *  above   Its own line between the filter row and the card.
 */
export type TableCrumb = "off" | "inside" | "above";
export const TABLE_CRUMBS: readonly TableCrumb[] = ["off", "inside", "above"];
export const TABLE_CRUMB_LABELS: Record<TableCrumb, string> = {
  off: "Off",
  inside: "Inside the table",
  above: "Above the table",
};

export type FolderCrumb = "replace" | "beside";
export const FOLDER_CRUMBS: readonly FolderCrumb[] = ["replace", "beside"];
export const FOLDER_CRUMB_LABELS: Record<FolderCrumb, string> = {
  replace: "Takes the view's place",
  beside: "Sits before the view",
};

export type CrumbSwitchers = "all" | "leaf" | "off";
export const CRUMB_SWITCHER_MODES: readonly CrumbSwitchers[] = [
  "all",
  "leaf",
  "off",
];
export const CRUMB_SWITCHER_LABELS: Record<CrumbSwitchers, string> = {
  all: "Every crumb",
  leaf: "Last only",
  off: "None",
};

/** What sits between crumbs. */
export type CrumbSeparator = "chevron" | "slash";
export const CRUMB_SEPARATORS: readonly CrumbSeparator[] = ["chevron", "slash"];
/*
 * The mark is in the label, not just the word for it.
 *
 * "Chevron" and "Slash" name the options correctly and are the wrong thing to
 * read in a picker: Ashwin went hunting for the "/" option on Sep 23 and could
 * not see it, because nothing on screen was a "/". Showing the glyph beside
 * its name costs two characters and makes the control answer the question
 * someone actually arrives with.
 */
export const CRUMB_SEPARATOR_LABELS: Record<CrumbSeparator, string> = {
  chevron: "Chevron ›",
  slash: "Slash /",
};

/*
 * The accent, and what the product is by default (Sep 30, Ashwin).
 *
 * `highrise` — HighLevel primary/600, #155eef — is the default now, at every
 * scope. The platform has one colour and wears it everywhere: agency and
 * sub-account, nav, modals, toggles and primary buttons alike. The axis stays
 * because a tenant's own brand is a real thing this prototype has to be able
 * to show; what it no longer decides is what the product looks like when
 * nobody has said otherwise.
 *
 * It was `account`, which followed the current sub-account's logo colour and
 * left the agency deliberately grey — a defensible reading, and the wrong
 * default to review a platform in: half the screens in a walkthrough came out
 * a different colour from the other half for reasons that were about the
 * fixtures rather than about the design.
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
 * Which dark the dark nav is.
 *
 * The shipped one is a true neutral — #0f0f12, black with the colour taken
 * out — which is honest and, on a 272px column standing next to a white
 * canvas all day, reads as a hole rather than as a surface. Most products that
 * ship a dark chrome do not use black for exactly this reason: a trace of blue
 * gives the eye something to focus on and keeps the edge between chrome and
 * page from looking like a cut.
 *
 *  navy  #0F1828 and a ramp derived from it. Enough hue to read as a colour
 *        and little enough not to read as branded — the accent is the tenant's
 *        and the chrome must not compete with it.
 *  ink   The neutral as it ships, unchanged to the byte, so the two can be
 *        compared rather than remembered.
 *
 * Only the nav's own surfaces move. The AI palette, the accent ramps and the
 * page keep their own definitions: this is the colour of one piece of chrome,
 * not a second theme.
 */
export const NAV_DARK_TONES = ["navy", "ink"] as const;

export type NavDarkTone = (typeof NAV_DARK_TONES)[number];

export const NAV_DARK_TONE_LABELS: Record<NavDarkTone, string> = {
  navy: "Navy",
  ink: "Neutral",
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
 *  places    Pins and recently visited agency areas, and nothing else: the
 *            clients are the account rail's, which is a whole column devoted to
 *            them. A Recent accounts block under this list used to hold them
 *            too — the same handful of names twice on one screen, in two
 *            treatments, one of which was the thing designed for the job.
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
 *            down — sometimes below the fold, where View all reaches it.
 *
 * `arranged` is the default (Aug 28). `newest` gave the pin useful feedback but
 * paid for it by reordering the block around the row you just acted on: with a
 * hard cap, pinning the fourth row moved it to the first and pushed the last
 * one out of sight. Two rows you did not touch moved, which reads as the nav
 * rearranging itself rather than as a pin landing.
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
 * One modal whichever way in you take — the komoot-style Get the app sheet —
 * and four places to reach it from. They are not the same offer:
 *
 *  flyout  One L1 row, "Desktop & mobile apps", opening a panel with the two
 *          platforms in it. The default: it spends one row rather than two on
 *          something done once, says what the thing IS before asking which
 *          flavour you want, and puts the choice where a row is free.
 *  header  Two glyphs in the app bar, left of the phone. Standing and visible,
 *          which is the point: an app nobody installs is an app nobody knew
 *          about, and the bar is the one strip of chrome every screen shows.
 *          The cost is two more glyphs in a row that is already six wide.
 *  menu    Two rows in the avatar menu, where production put them. Discreet and
 *          conventional — and behind a menu most users open once, to sign out.
 *  nav     Two rows in the sidebar, beside Settings. Reads as part of the
 *          product rather than as an ad for it, at the price of two nav rows
 *          and of one offer looking like two products.
 *
 * Exclusive, all four. The offer duplicated across two surfaces is the
 * duplication the review keeps objecting to everywhere else.
 */
export const GET_APP_PLACEMENTS = ["flyout", "header", "menu", "nav"] as const;

export type GetAppPlacement = (typeof GET_APP_PLACEMENTS)[number];

export const GET_APP_PLACEMENT_LABELS: Record<GetAppPlacement, string> = {
  flyout: "Sidebar flyout",
  header: "App bar",
  menu: "Avatar menu",
  nav: "Sidebar rows",
};

/**
 * Whether the agency's entry point offers search as well as Ask AI.
 *
 * The merged pill was built for a sub-account, where search has a corpus worth
 * searching — ninety products, their pages, the account's own links. The agency
 * nav is thirteen buckets and a client list, and the client list already has a
 * search field of its own in the directory. So the pill up there was offering a
 * second, worse way into a set small enough to read.
 *
 * Off, the pill keeps the orb and the label and drops the magnifier and the
 * keycap — one control that does one thing. On, the agency gets the same merged
 * pill a sub-account has, which is where this goes if the agency surface ever
 * grows a corpus.
 *
 * The sub-account is untouched either way; this axis only ever reads at agency
 * scope.
 */
export const AGENCY_SEARCH_DEFAULT = false;

/**
 * Whether the agency nav header draws the agency logo, when the account rail
 * beside it is already drawing the same logo.
 *
 * At agency scope the mark appears twice within 60px: once on the account
 * rail's plate, where it is the cap of the client column, and again in the nav
 * header beside the agency's name. Both are correct on their own terms — the
 * rail is saying "this is whose accounts these are" and the header is saying
 * "this is the workspace you are in" — but they are the same glyph at almost
 * the same size, and the second one teaches nothing the first did not.
 *
 * Off, the header keeps the NAME and drops the disc. The name is the half that
 * was carrying the information: the rail's mark is unlabelled, so the pair
 * together read as one identity stated once, in two halves, rather than twice.
 *
 * Only ever read at agency scope. A sub-account has no rail above it repeating
 * anything, so its header mark is the only one there is and the axis leaves it
 * alone. Collapsed, the same rule applies to the rail-width mark, which has an
 * Expand button directly beneath it doing the job it would lose.
 *
 * Off by default since Sep 30: one identity stated once.
 */
export const AGENCY_NAV_MARK_DEFAULT = false;

/**
 * Whether the sidebar gives up its own card and sits on the page's plane.
 *
 * Off, the nav is a floating card: its own ground, a hairline ring, the
 * canvas shadow, a 12px radius and a gap on three sides. Three surfaces on
 * screen — nav card, plane, canvas card — and the nav reads as an object laid
 * on the window.
 *
 * On, the card goes and the nav inherits the plane behind the canvas, so the
 * whole left side and the space around the page are one colour and the canvas
 * is the only thing floating. That is the point of the pairing Ashwin drew on
 * Sep 30: with `pageShell: "canvas"` the page is a card on a ground, and a nav
 * that is also a card makes two objects competing to be the figure. One
 * ground, one figure.
 *
 * It inherits rather than declaring a colour of its own, which is the whole
 * mechanism — so a dark nav theme over a light page will read as a light nav,
 * because the ground it is sitting on is the page's. The two themes are
 * meant to match while this is on, and the panel says so.
 */
export const NAV_ON_PLANE_DEFAULT = false;

/**
 * Whether a pinned row can be arranged, renamed and re-iconed in edit mode.
 *
 * A pin is the one row in the nav a person put there on purpose, so it is the
 * one row it is worth letting them make their own — the argument the dock's
 * own ordering already makes, extended from "which order" to "what it is
 * called and what it looks like". Recents get none of it: a row that will be
 * gone by Thursday is not worth naming, and an affordance on every history row
 * turns a list you read into a list you maintain.
 *
 * Edit mode only, like every other structural affordance in this nav — see
 * `useNavRowEdit`, which is already gated that way and which this reuses
 * rather than reimplements. The rename and the icon land on the PRODUCT, so a
 * pin renamed here is renamed in the tree, the flyout, the dock and the
 * breadcrumb too. A pin-local alias was the other reading and it loses the one
 * property a nav has to keep: the same place called the same thing everywhere
 * you meet it.
 */
export const PINNED_ROW_EDIT_DEFAULT = false;

/**
 * Whether pinned rows answer to a keyboard shortcut.
 *
 * ⌃⌥1 for the first pin, ⌃⌥2 for the second, up to ⌃⌥5 — the pin cap, so that
 * is every default there can be. They follow the pin ORDER rather than the
 * pin, so reordering reassigns, and an account has working shortcuts without
 * anyone opening a settings screen. See `pin-shortcuts.tsx` for the
 * resolution rule, why ⌃⌥ and not ⌘⇧, and why bindings live outside the
 * layout store.
 *
 * The cap shows on hover and nowhere else. A pinned run wearing five
 * permanent keycaps is a nav advertising its own settings; the shortcut is for
 * someone who knows it already, and the chip is for the moment they have
 * forgotten. Same reasoning, and the same treatment, as the ⌘K cap in search.
 */
export const PINNED_SHORTCUTS_DEFAULT = false;

/**
 * How the Ask AI button is drawn once it is a button rather than a field.
 *
 *  gradient  The tinted purple fill the AI dock and the composer wear — this
 *            app's standing answer to "this is the assistant, and it is a thing
 *            you press". It is also the loudest control in the nav's foot.
 *  outline   No fill at all, and the hairline the search field wears. The pill
 *            keeps its geometry, its orb and its label; what it gives up is the
 *            claim to be the most important thing on the surface. Worth looking
 *            at precisely because the agency nav has no corpus to search, so
 *            this control is alone down there and does not have to compete.
 *
 * Only read where the pill IS a button — agency scope with search off. With
 * search on, the field's own treatment is not a choice: an input has to look
 * like somewhere you can type.
 */
/**
 * How the old nav's own two controls are reached.
 *
 *  off    Nothing at the foot at all — the default. Both controls behind it
 *         are prototype scaffolding: an agency on the old nav cannot switch to
 *         a nav that does not exist yet, and the theme switch is a reviewer's
 *         tool. Driving the comparison from the panel keeps the transcription
 *         honest, which is the whole value of having a control group.
 *  menu   One always-visible ⋯ button, opening a small card: the theme choice
 *         with a Save, and the way back to the new nav. The default. Two pills
 *         that appear on hover are two things a reviewer has to discover by
 *         sweeping the nav's foot, and the theme switch is the control they
 *         most often came for — an always-visible affordance is the difference
 *         between a comparison someone can run and one they have to be shown.
 *  pills  The pair of grow-on-hover pills this shipped with, kept as the
 *         control group: it is the arrangement the new nav's foot uses, so it
 *         is the one that makes the two navs comparable on their chrome.
 *
 * Old nav only. The new nav's foot is the thing being reviewed and is not
 * touched by this.
 */
/**
 * How All products opens a level.
 *
 *  flyout  Cascading panels off the directory's edge — L1's products in one,
 *          an L2's pages in the next. The default, and the same three-level
 *          pattern the nav's own flyouts use, so the directory teaches nothing
 *          new: what you learn walking the nav is what walking the catalogue
 *          costs.
 *  inline  Accordion in place: the level opens under its parent, indented. The
 *          whole path stays visible at once, which is the argument for it — and
 *          it pushes everything below the open row down the panel, which is the
 *          argument against.
 */
/*
 * All products used to carry its own disclosure axis here.
 *
 * Removed (Sep 10): it asked the same question `l3Disclosure` asks — does a
 * level open beside its parent or under it — and having both meant the
 * catalogue could contradict every other panel in the nav. The directory now
 * reads `l3Disclosure` and `flyoutTrigger` like everything else.
 */

/**
 * How the Recents panel arranges its two corpora.
 *
 * The panel holds two different things — what you have been to, and everything
 * that exists — and they are not two views of one subject, which is why an
 * ordinary tab strip reads oddly here. These are the three answers.
 *
 *  pinned-first  Pinned as its own block above the switcher, then tabs, then
 *                the tab's own search. What shipped. Pinned is the reason most
 *                people open the panel, so it is held out of the choice — at
 *                the cost of a panel with unswitched content above a switcher,
 *                which is three levels of hierarchy in a 320px column.
 *  tabs-top      The switcher goes to the top, directly under the title, and
 *                the pins fold into the visited list as one seamless run —
 *                pinned rows first, wearing their pin mark, no headings and no
 *                divider between them. Each tab keeps its own search. The
 *                panel becomes a title, a choice, a query and a list, in that
 *                order.
 *  stacked       No switcher at all. The combined list runs first, capped, with
 *                the directory under it carrying its own search. Truest to the
 *                menu the panel actually is — at the cost of putting the
 *                catalogue below a list it has nothing to do with, which is the
 *                arrangement the tabs were introduced to get away from. The cap
 *                is what keeps that honest.
 */
export const RECENTS_PANEL_LAYOUTS = [
  "pinned-first",
  "tabs-top",
  "stacked",
] as const;

export type RecentsPanelLayout = (typeof RECENTS_PANEL_LAYOUTS)[number];

export const RECENTS_PANEL_LAYOUT_LABELS: Record<RecentsPanelLayout, string> = {
  "pinned-first": "Pinned above tabs",
  "tabs-top": "Tabs on top",
  stacked: "All products below",
};

/**
 * Where the template feature's messages appear.
 *
 * Four messages had four coordinate systems — the undo toast hung off the nav's
 * foot, the save-template card as a popover off the edit card, the "saved as
 * v2" receipt fixed to the top of the viewport, and the client notice inline in
 * the nav column. Each was placed where its own author was looking. Together
 * they read as four unrelated features.
 *
 *  by-kind   What a message ASKS decides where it goes. A decision you must
 *            answer before anything happens takes the centre of the screen,
 *            because it is blocking and should look it. A confirmation of
 *            something that already happened hangs off the nav, where the work
 *            was. The default: the two kinds are genuinely different errands
 *            and a single home flattens that.
 *  centred   Everything in the middle. One rule, no exceptions to learn — at
 *            the cost of an Undo you were free to ignore demanding the whole
 *            screen.
 *  nav       Everything hung off the nav column. Keeps the feature beside the
 *            thing it changes — at the cost of a decision that must be answered
 *            sitting in the corner of the eye.
 */
export const TEMPLATE_MESSAGE_PLACEMENTS = ["by-kind", "centred", "nav"] as const;

export type TemplateMessagePlacement =
  (typeof TEMPLATE_MESSAGE_PLACEMENTS)[number];

export const TEMPLATE_MESSAGE_PLACEMENT_LABELS: Record<
  TemplateMessagePlacement,
  string
> = {
  "by-kind": "By kind",
  centred: "All centred",
  nav: "All on the nav",
};

/**
 * What happens to the sub-accounts on a template when it is deleted.
 *
 *  unlink  They keep the navigation they have and simply stop receiving
 *          updates. Nothing on their screen changes. The default, because
 *          deleting a template is a tidying action in the agency's own list and
 *          should not reach into seven other people's workspaces.
 *  revert  They go back to the shipped navigation. Honest that the link is
 *          gone — at the price of changing seven navs as a side effect of a
 *          cleanup nobody else asked for.
 */
export const TEMPLATE_DELETE_MODES = ["unlink", "revert"] as const;

export type TemplateDeleteMode = (typeof TEMPLATE_DELETE_MODES)[number];

export const TEMPLATE_DELETE_MODE_LABELS: Record<TemplateDeleteMode, string> = {
  unlink: "Unlink, keep their nav",
  revert: "Revert them to default",
};

/**
 * How the templates menu is ordered.
 *
 *  verbs-first  What shipped: "Save to X", "Create new template", "Apply a
 *               template" as three rows, each opening a list or a form. The
 *               menu is a list of things you can DO, and the templates
 *               themselves are one level down inside one of them — so the
 *               question people actually arrive with, "which arrangements do I
 *               have", is the one thing the menu does not answer.
 *  list-first   The templates ARE the menu, and each row carries its own verbs
 *               — the Google Docs paragraph-styles model. Applying is the row;
 *               updating, renaming, duplicating and deleting are its ⋯. One
 *               row at the foot saves what you have as a new one. The default:
 *               it makes the set visible without a drill, and it puts every
 *               operation on the thing it operates on rather than asking you to
 *               pick the verb and then the noun.
 */
export const TEMPLATE_MENU_SHAPES = ["verbs-first", "list-first"] as const;

export type TemplateMenuShape = (typeof TEMPLATE_MENU_SHAPES)[number];

export const TEMPLATE_MENU_SHAPE_LABELS: Record<TemplateMenuShape, string> = {
  "verbs-first": "Verbs first",
  "list-first": "Templates first",
};

/**
 * What happens when a pushed template and a local change touch the same thing.
 *
 * The merge already keeps local edits: a push rebases onto whatever the account
 * did for itself, so a renamed row stays renamed. The question is what to do
 * when both sides moved the SAME property, where "keep local" is a decision
 * being taken silently on somebody's behalf.
 *
 *  silent    Local wins and nothing is said. What shipped.
 *  flag      Local still wins, and the account is marked as diverged from the
 *            template so it can be seen and counted. Says what happened without
 *            asking anyone to act.
 *  resolve   Local wins for now, and the account is offered the three ways out
 *            the note describes — take the template's version, keep mine, or
 *            split off into a template of my own. The default.
 */
export const TEMPLATE_CONFLICTS = ["silent", "flag", "resolve"] as const;

export type TemplateConflict = (typeof TEMPLATE_CONFLICTS)[number];

export const TEMPLATE_CONFLICT_LABELS: Record<TemplateConflict, string> = {
  silent: "Local wins, quietly",
  flag: "Flag the divergence",
  resolve: "Offer a way out",
};

/**
 * What an agency finds in the template list before it has made anything.
 *
 *  default-only  The HighLevel default and nothing else. The agency builds its
 *                own set, which is what actually happens — a dental preset
 *                written by us is a guess at somebody else's business, and an
 *                agency that has five of them has five arrangements it did not
 *                choose sitting above the ones it did. The default: an empty
 *                list is also the honest zero state, and it makes "Save as new
 *                template" the obvious next move rather than one row among six.
 *  presets       The five worked examples as well. Useful for showing the list
 *                full, and for arguing that a starting point beats a blank
 *                page — at the cost of a menu whose first impression is five
 *                things nobody here made.
 */
export const TEMPLATE_SEEDS = ["default-only", "presets"] as const;

export type TemplateSeed = (typeof TEMPLATE_SEEDS)[number];

export const TEMPLATE_SEED_LABELS: Record<TemplateSeed, string> = {
  "default-only": "Default only",
  presets: "Default and presets",
};

/**
 * Where saving an arrangement lives.
 *
 *  split    Two places: "Update to match" on the template's own ⋯, and "Save as
 *           new template" as a row at the foot. Which one you want depends on
 *           whether you are already on a template — a fact the menu knows and
 *           makes you work out anyway.
 *  unified  One row, "Save template", opening a dialog that asks which: update
 *           the one you are on, or keep this as a new one. The default. The two
 *           are the same gesture at different scopes, and the dialog is where
 *           the difference that matters — how many other accounts move — can
 *           actually be stated beside each option.
 */
export const TEMPLATE_SAVE_SHAPES = ["split", "unified"] as const;

export type TemplateSaveShape = (typeof TEMPLATE_SAVE_SHAPES)[number];

export const TEMPLATE_SAVE_SHAPE_LABELS: Record<TemplateSaveShape, string> = {
  split: "Two rows",
  unified: "One row",
};

/**
 * Where renaming, duplicating and deleting a template live.
 *
 * The ⋯ was doing two unrelated jobs. Applying is about the nav in front of
 * you; renaming and deleting are about the template as an object in a library,
 * which is a different errand on a different schedule.
 *
 *  on-row  Every row carries a ⋯ with all of it. Everything is one click away,
 *          and the picker is also a file manager.
 *  manage  The list is a pure picker — click a row, get that arrangement — and
 *          library work sits behind one "Manage templates" row: the menu
 *          people open twenty times a day stops carrying the controls they
 *          need twice a month.
 *
 * `on-row` is the shipped answer (Sep 16) — see the note at the default. This
 * block called `manage` "the default" until Sep 29, which it had not been for
 * a fortnight: the two sat four hundred lines apart and only one of them got
 * updated. Stated here as an argument and settled there, which is the way
 * round that survives the next change.
 */
export const TEMPLATE_ACTION_HOMES = ["on-row", "manage"] as const;

export type TemplateActionHome = (typeof TEMPLATE_ACTION_HOMES)[number];

export const TEMPLATE_ACTION_HOME_LABELS: Record<TemplateActionHome, string> = {
  "on-row": "On each row",
  manage: "Behind Manage",
};

/**
 * What a sub-account's layout IS — the model every other template axis sits on.
 *
 * The one axis in this file that is not a styling question or a placement
 * question. It decides whether a layout is a thing an account can hold for
 * itself, and the two answers produce different products.
 *
 * `one-template`  A sub-account is always on exactly one thing: the HighLevel
 *                 default, or one named template. There is no third state, no
 *                 per-account tweak sitting on top of a template, and no
 *                 private divergence for anyone to reconcile. Editing a nav is
 *                 therefore always editing a TEMPLATE, and the editor asks
 *                 which one the change belongs to — update the one this
 *                 account is on, which moves everybody on it, or split off
 *                 into a new one, which moves only this account. The default,
 *                 and the model the flow diagram describes.
 *
 *                 The case for it is not simplicity for its own sake: local
 *                 state means a version history per sub-account and a
 *                 reconciliation every time a template moves, which is the
 *                 machinery `templateConflict` exists to stage-manage. Ruling
 *                 it out deletes that whole class of question — at the price
 *                 of template proliferation, since the only way to make one
 *                 account differ is to name a template for it.
 *
 * `local-edits`   What was built first. An account takes a template as a
 *                 starting point and may then drift from it; a later push
 *                 rebases onto whatever it did for itself, and where both
 *                 sides moved the same row there is a collision to resolve.
 *                 Kept, not deleted: it is the model to argue the default
 *                 against, and several axes below only mean anything here.
 *
 * Switching to `one-template` settles four other axes, so they are clamped in
 * `theme-provider`'s `effective` rather than left to disagree: propagation is
 * `managed` (an update that reached nobody would make "update this template"
 * a lie), conflicts are moot, the delete mode becomes a question the delete
 * dialog asks out loud instead of a preference, and the "My layout / HighLevel
 * default" switch in the edit card is the third state by another name.
 */
export const LAYOUT_MODELS = ["one-template", "local-edits"] as const;

export type LayoutModel = (typeof LAYOUT_MODELS)[number];

export const LAYOUT_MODEL_LABELS: Record<LayoutModel, string> = {
  "one-template": "One template each",
  "local-edits": "Local edits",
};

/**
 * What happens on screen when a row is pinned.
 *
 * Pinning is the one action in the nav whose result lands somewhere other than
 * where you clicked — from a flyout, from the Recents panel, from search, the
 * row joins a list in the sidebar that you may not even have been looking at.
 * The state changes correctly and silently, and people press it twice because
 * nothing told them where it went.
 *
 *  off      What shipped. The pin fills, the list is different next time you
 *           look at it.
 *  mark     No travel: the row lands and its new home flashes once. Cheapest,
 *           and enough when the destination is already in view.
 *  flight   A ghost of the row arcs from the pin you pressed to the top of the
 *           list and fades into it. The only option that answers "where did it
 *           go" for somebody whose eye is on a panel three surfaces away.
 *  settle   No ghost: the row itself slides into its new slot and the list
 *           reflows around it — and slides back OUT of that slot when the pin
 *           is removed. Quieter than flight, and it only reads when the
 *           destination is on screen.
 *  hilite   The row's ground washes yellow and fades, arriving and leaving
 *           alike. No travel and no reflow to read: it marks WHICH row the
 *           press was about, which is the half of the question the other
 *           treatments answer by implication. The one option that treats
 *           pinning and unpinning as the same event seen twice.
 *
 * Unpinning is silent under `off`, `mark` and `flight`. Under `mark` it has
 * nothing to flash — the slot it would mark is the one being vacated — and a
 * chip flying back to a pin button nobody is looking at is an animation about
 * the wrong end of the action.
 */
export const PIN_FEEDBACKS = [
  "off",
  "mark",
  "flight",
  "settle",
  "hilite",
] as const;

export type PinFeedback = (typeof PIN_FEEDBACKS)[number];

export const PIN_FEEDBACK_LABELS: Record<PinFeedback, string> = {
  off: "Nothing",
  mark: "Flash the slot",
  flight: "Fly to the list",
  settle: "Slide into place",
  hilite: "Yellow highlight",
};

/**
 * How the save dialog's two answers are drawn.
 *
 * `accordion` each option owns what belongs to it: choosing "Update" opens the
 *            table of sub-accounts inside that option, choosing "Create a new
 *            template" opens the name field inside that one. The consequence of
 *            an answer sits under the answer, so the dialog only ever shows the
 *            detail for the branch you are actually on.
 *
 *            Only the update option carries a chevron. Its body is a disclosure
 *            — information you may or may not want — and the chevron says there
 *            is more behind it. The name field is not optional detail; it is the
 *            rest of the sentence, and a chevron over a required input invites
 *            you to close the thing you have to fill in.
 *
 * `list`     the options as two plain radios with their detail stacked below
 *            the pair. What was built first, and the comparison: it puts both
 *            bodies in one column, so the thing that opened is a row away from
 *            the thing that opened it.
 */
export const TEMPLATE_SAVE_LAYOUTS = ["accordion", "list"] as const;

export type TemplateSaveLayout = (typeof TEMPLATE_SAVE_LAYOUTS)[number];

export const TEMPLATE_SAVE_LAYOUT_LABELS: Record<TemplateSaveLayout, string> = {
  accordion: "Accordion",
  list: "Plain radios",
};

export const LEGACY_FOOT_CONTROLS = ["off", "menu", "pills"] as const;

export type LegacyFootControl = (typeof LEGACY_FOOT_CONTROLS)[number];

export const LEGACY_FOOT_CONTROL_LABELS: Record<LegacyFootControl, string> = {
  off: "Hidden",
  menu: "More menu",
  pills: "Hover pills",
};

/**
 * Whether the new nav carries a standing "Switch nav" button at its foot.
 *
 * Off by default (Sep 10). It is scaffolding: a real account has one nav, and
 * the button exists so a reviewer can cross between the two — which the
 * prototype panel already does, from outside the surface being reviewed. A
 * control that only exists because this is a prototype makes the prototype
 * slightly not the thing it is a prototype of.
 *
 * On, it is back beside Edit nav, which is where the comparison wants it when
 * someone is being walked through both navs live.
 */
export const NAV_SWITCH_BUTTON_DEFAULT = false;

/**
 * Whether the agency nav offers the edit experience.
 *
 * Off by default (Sep 10). The agency tree is thirteen fixed buckets of
 * platform IA: renaming one, hiding one and reordering them is a real and
 * smaller set of verbs than the sub-account's, and the card built for the
 * sub-account brings a mode, a Save, a Discard and an overflow menu of tools
 * that mostly do not apply. Reviewing the proposal is easier without a control
 * arguing for a story nobody has asked for yet.
 *
 * On, the agency gets the same card the sub-account does, backed by its own
 * store — which is how the question gets looked at if it comes back.
 */
export const AGENCY_EDIT_NAV_DEFAULT = false;

export const AI_BUTTON_STYLES = ["gradient", "outline"] as const;

export type AiButtonStyle = (typeof AI_BUTTON_STYLES)[number];

export const AI_BUTTON_STYLE_LABELS: Record<AiButtonStyle, string> = {
  gradient: "Purple fill",
  outline: "Outline",
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
 * How round the merged Search + Ask AI control is.
 *
 * `pill` is what shipped, and it is an argument: a fully rounded field reads as
 * a place to ASK rather than as one more form control, which is the whole
 * point of merging search with the assistant. It is also the one shape on the
 * screen that nothing else wears.
 *
 * `sm` is the platform's own 8px, the radius every other input, button and
 * select in HighRise uses. The case for it is consistency — a search field
 * that is shaped like every other field is a search field nobody has to learn
 * — and the case against is that it stops announcing itself. Worth seeing side
 * by side rather than argued about, which is why it is here.
 *
 * Only the horizontal control answers to it. The 44px rail stack is a column
 * of round glyphs and an 8px box around them would be a box around circles.
 */
export const ENTRY_RADII = ["pill", "sm"] as const;

export type EntryRadius = (typeof ENTRY_RADII)[number];

export const ENTRY_RADIUS_LABELS: Record<EntryRadius, string> = {
  pill: "Fully rounded",
  sm: "8px",
};

/**
 * Which end of the app bar the entry stands at, once `entryLayout` has put it
 * there.
 *
 * `right` is where it went first: beside the utilities, on the edge the bar
 * has always ended on, so nothing else in the row moves.
 *
 * `left` is the arrangement Ashwin paired with the tree on Sep 30, and it only
 * makes sense next to `crumbShown: false`. Turn the trail off and the whole
 * left of a 48px bar is empty — the tree in the column is already saying where
 * you are, which is the argument for dropping the trail in the first place —
 * and the search field is the obvious thing to spend that space on. It also
 * puts search at the top-left corner, which is where every other tool in this
 * category keeps it.
 *
 * Nothing stops it being set with the trail on; the two then share the row and
 * the trail loses 230px. That is worth being able to look at rather than being
 * forbidden, since "does the trail still fit" is the question the pairing is
 * actually asking.
 */
/*
 * Two more placements, both about the trail rather than the bar's ends
 * (Ashwin, Sep 30).
 *
 * `trail` puts the entry immediately after the last crumb, travelling with it:
 * on a shallow page it sits near the left, on a deep one it is pushed right.
 * The claim is that search belongs beside where you ARE rather than at a fixed
 * corner — and the cost is a control whose position moves as you navigate,
 * which is the thing to look at.
 *
 * `centre` pins it to the middle of the bar, the browser-omnibox arrangement:
 * one fixed, findable target with the trail to its left and the utilities to
 * its right. It is centred on the WINDOW rather than on the space between
 * them, so it does not move when the trail grows — and on a deep trail the two
 * can meet, which is the trade this one is here to show.
 */
export const HEADER_ENTRY_SIDES = [
  "right",
  "left",
  "trail",
  "centre",
] as const;

export type HeaderEntrySide = (typeof HEADER_ENTRY_SIDES)[number];

export const HEADER_ENTRY_SIDE_LABELS: Record<HeaderEntrySide, string> = {
  right: "Beside the utilities",
  left: "Where the trail was",
  trail: "After the last crumb",
  centre: "Centred in the bar",
};

/**
 * How loudly the Launchpad card announces itself.
 *
 * The card shipped at full strength — brand fill, a 1px brand ring all the way
 * round, brand text — which made the first thing in the nav the loudest thing
 * on the screen. That is defensible for a surface an account is meant to
 * finish and leave, and indefensible as the permanent neighbour of a product
 * list it is not part of. Every variant below is quieter than it; the argument
 * is how much quieter, and what is lost on the way down.
 *
 *  solid    What shipped. Brand fill and a full brand ring. The baseline.
 *  tinted   The same fill, no ring, and the words in the nav's own ink. Reads
 *           as a card without reading as an alert.
 *  outline  No fill at all — a neutral hairline. The card becomes a container
 *           rather than a highlight, and brand survives only in the meter.
 *  quiet    A neutral grey fill, the same one a hovered row wears. Present, and
 *           carrying no colour of its own.
 *  plain    No card. Two rows on the nav's ground with a meter under the first,
 *           indented to the nav's own column — the version that asks whether
 *           this needed to be a card at all.
 *
 * The meter keeps the brand in every variant, deliberately. It is the one part
 * that is genuinely status rather than decoration, and it is the card's exit
 * visa: at 7 of 7 the whole thing leaves the nav.
 */
export const LAUNCHPAD_CARDS = [
  "tinted",
  "outline",
  "quiet",
  "plain",
  "solid",
] as const;

export type LaunchpadCard = (typeof LAUNCHPAD_CARDS)[number];

export const LAUNCHPAD_CARD_LABELS: Record<LaunchpadCard, string> = {
  tinted: "Tinted",
  outline: "Outline",
  quiet: "Neutral",
  plain: "No card",
  solid: "Full brand",
};

/**
 * Whether a magnified rail tile stays inside its own row.
 *
 * The Dock analogy was taken literally: the mark carries the scale transform and
 * the row does not, so a hovered tile grows OVER its neighbours. That is right
 * for a Dock, where an icon floats on a translucent shelf and has no container
 * of its own. It is wrong here, because these tiles do have one — a pill with a
 * fill, a hairline and a name in it — and at 1.35x a 28px active mark reaches
 * 38px inside a 32px row. The disc breaks the pill's edge on every hover, and
 * the row you are pointing at is the one that looks broken.
 *
 *  overflow  What shipped: the mark scales, the pill holds still.
 *  contain   The whole row scales — fill, hairline, name and mark together — so
 *            the mark can never leave a box that is growing with it. The tile
 *            still swells under the pointer; it swells as one object.
 *
 * `contain` also resets the active tile's clearance. Its 28px mark sat in a
 * 32px row with 2px a side, against the 4px every other tile gets, so it read
 * as bursting out even at rest. The mark keeps its 28px — that size is how the
 * rail marks the active account — and the row grows to 36 to hold it properly.
 */
export const RAIL_ZOOM_FITS = ["contain", "overflow"] as const;

export type RailZoomFit = (typeof RAIL_ZOOM_FITS)[number];

export const RAIL_ZOOM_FIT_LABELS: Record<RailZoomFit, string> = {
  contain: "Inside the row",
  overflow: "Over the row",
};

/**
 * Where "All accounts" sits on the rail, and what travels with it.
 *
 * The waffle is the way into the directory — the only place you can search every
 * tenant — and it rides at the tail of the tile column, which puts it at the
 * bottom of a group that floats in the strip's vertical centre. So the one
 * control whose position you would want to learn is the one control that moves
 * every time the open set changes length.
 *
 *  tail        What shipped: last in the tile column, below the accounts it is
 *              the directory for.
 *  top         Directly under the agency plate, where the plate anchors it. A
 *              fixed target: same place in every account, at every rail length.
 *  top-active  The same, plus the account you are IN hoisted up beside it. The
 *              rest stay centred, so the top of the strip becomes "who you are,
 *              where you are, and how to leave" and the middle stays the set
 *              you arranged.
 *
 * `top-active` costs the active tile its place in the ordered set — it leaves a
 * hole where it was, and the tile you are looking at is no longer where you
 * last clicked it. Whether that is orientation or disorientation is the thing
 * to look at.
 */
export const RAIL_DIRECTORY_SPOTS = ["tail", "top", "top-active"] as const;

export type RailDirectorySpot = (typeof RAIL_DIRECTORY_SPOTS)[number];

export const RAIL_DIRECTORY_SPOT_LABELS: Record<RailDirectorySpot, string> = {
  tail: "Below the accounts",
  top: "Under the agency",
  "top-active": "Under the agency, with active",
};

/**
 * Whether the account rail shows recently visited accounts as well as its own.
 *
 * The rail is a CURATED working set — eight tenants an agency arranged, not a
 * history — which is the right shape until you visit a ninth. Switch to Coastal
 * from the directory and the rail it is not on carries no trace of it: getting
 * back means opening the directory and finding it again, for an account you were
 * in ten seconds ago. The tenth-account problem, and the rail has no answer.
 *
 *  pinned   Today. The rail is exactly what was arranged and nothing else.
 *  recent   A run of recents under the curated set, closed off by a hairline —
 *           the same bargain the sub-account nav's merged block strikes.
 *  auto     No second run at all: visiting an account puts it ON the rail, and
 *           the oldest tile nobody pinned falls off. The rail becomes an MRU
 *           with a pinned head. Fewer parts, and the trade is that a set you
 *           arranged keeps rearranging itself.
 *
 * `recent` and `auto` answer the same complaint from opposite directions, which
 * is why both are here: one adds a place for history, the other admits the rail
 * was always partly history and stops pretending otherwise.
 */
export const RAIL_RECENTS = ["pinned", "recent", "auto"] as const;

export type RailRecents = (typeof RAIL_RECENTS)[number];

export const RAIL_RECENTS_LABELS: Record<RailRecents, string> = {
  pinned: "Pinned only",
  recent: "Pinned + recent",
  auto: "Recents join the rail",
};

/**
 * How many recent accounts the rail carries, on the `recent` setting.
 *
 * Small on purpose. The rail's whole claim is that it is a glance, and a
 * history long enough to scroll is the directory with extra steps.
 */
export const RAIL_RECENT_LIMIT = 3;

/**
 * What clicking a row that has children does.
 *
 * The two-click problem, and whether it is a problem. A parent in a flyout has
 * always been a pure disclosure: click it, a list appears, click again in that
 * list to actually go somewhere. Which means the first click puts you nowhere,
 * and the row that names the thing you want is the one row that cannot take you
 * to it.
 *
 *  open-first  Clicking a parent expands it AND opens its first child behind the
 *              panel. Click away and you are already on that page; pick a
 *              different child and you go there instead, which is the click you
 *              were going to make anyway. One click now lands somewhere.
 *  disclose    The original: expanding and navigating stay separate verbs. The
 *              conservative reading, and not obviously wrong — it never takes
 *              you somewhere you did not ask for, and "show me what is in here"
 *              is a real thing to want without committing to a page.
 *
 * The cost of `open-first` is a page load you may not have wanted: browsing the
 * tree now navigates as a side effect. In this prototype that is free. In
 * production it is a fetch per parent row you open, which is the argument the
 * axis exists to have.
 */
export const L2_CLICK_ACTIONS = ["open-first", "disclose"] as const;

export type L2ClickAction = (typeof L2_CLICK_ACTIONS)[number];

export const L2_CLICK_ACTION_LABELS: Record<L2ClickAction, string> = {
  "open-first": "Opens first page",
  disclose: "Expands only",
};

/**
 * How the nav gets you from a category to a page — four whole arrangements.
 *
 * This was the boolean `navProductTree` (Sep 30). A second and a third
 * arrangement arrived that are neither "flyouts" nor "the tree", and a boolean
 * cannot hold four answers — so the axis names the shape instead of toggling
 * one of them.
 *
 *  flyout  What ships. The column lists L1 and a second surface opens beside
 *          it for what is inside. The nav stays short enough not to scroll,
 *          and never says where you are below L1.
 *  tree    The catalogue IS the nav: every group discloses in place to its
 *          products and their pages. Always says where you are, at the cost of
 *          a column long enough to scroll.
 *  drill   Vercel's answer. No floating surface at all: picking a category
 *          REPLACES the column with that category's rows, headed by a back
 *          button. One list at a time, full width, at the cost of the other
 *          categories being off screen while you read one.
 *  scoped  GCP's answer. The column is one category's rows — the category you
 *          are in — and the other categories live behind a switcher that opens
 *          the L1 list, with each of them cascading its own products. The nav
 *          re-scopes itself as you travel, so the sidebar is always about
 *          where you are rather than about everything.
 */
export const NAV_ARRANGEMENTS = ["flyout", "tree", "drill", "scoped"] as const;

export type NavArrangement = (typeof NAV_ARRANGEMENTS)[number];

export const NAV_ARRANGEMENT_LABELS: Record<NavArrangement, string> = {
  flyout: "Flyouts",
  tree: "All products",
  drill: "Drill in",
  scoped: "Scoped to a category",
};

/**
 * Where `scoped`'s way back to the other categories lives.
 *
 *  header     A row at the top of the column naming the category you are in,
 *             which opens the L1 list when pressed. The switch and the "where
 *             am I" are one control, and the column below it is nothing but
 *             the category's own rows.
 *  hamburger  The switch moves up into the nav's identity row, beside the
 *             workspace mark — GCP's literal arrangement. The column is rows
 *             all the way up, and the category is named by the trail instead.
 */
export const SCOPED_SWITCHES = ["header", "hamburger"] as const;

export type ScopedSwitch = (typeof SCOPED_SWITCHES)[number];

export const SCOPED_SWITCH_LABELS: Record<ScopedSwitch, string> = {
  header: "Category header",
  hamburger: "Hamburger in the header",
};

/**
 * Whether the nav says which page you are on, and how far up it says it.
 *
 * It currently says nothing. On a flat sidebar that is survivable — the row is
 * on screen and it is either filled or it is not — but this nav hides its
 * second and third levels behind panels that are shut most of the time. Open
 * Inbox and the row naming it is inside a flyout nobody is looking at, so the
 * nav answers "where can I go" and never "where am I". The breadcrumb answers
 * it, which is a different surface, above the canvas, that people read once.
 *
 * The awkward part is that the obvious marker is taken. A filled row already
 * means "this row's panel is open" — see the note on the nav's own rows — and
 * the two are not the same thing: the panel moves under the pointer while the
 * page stays put. Give selection the same fill and the nav shows two filled
 * rows disagreeing about what filled means.
 *
 * So selection gets its own channel: a bar on the row's leading edge and the
 * label in full ink, neither of which the hover or panel states use. The axis
 * is how far that travels:
 *
 *  off    Today. Nothing marked anywhere.
 *  leaf   Only the exact row. Honest and minimal — and invisible whenever the
 *         page lives behind a shut panel, which is most of the time.
 *  trail  The exact row, plus every ancestor that leads to it: the L1 category
 *         and, in a cascade, the L2 it came out of. The nav can then answer
 *         "where am I" while closed, which is the entire point — at the cost of
 *         marking rows you are not actually on.
 *  ends   The default (Sep 30). `trail`, with the L2 left unpainted: the
 *         category and the page are filled and the product between them is
 *         not. Three filled rows in a vertical run read as one block — the
 *         path and its destination lose each other — and the middle row is the
 *         one carrying the least, because it is named again by the page under
 *         it and it is the level you are least likely to have MEANT. Marking
 *         the two ends states the same path and leaves a gap the eye can
 *         land in.
 *
 *         Only ever a TRAIL rule. A product you are actually standing on —
 *         because it has no pages, or because its own page is what is open —
 *         is the exact row and is filled like any other.
 */
export const SELECTED_STATES = ["off", "leaf", "trail", "ends"] as const;

export type SelectedState = (typeof SELECTED_STATES)[number];

export const SELECTED_STATE_LABELS: Record<SelectedState, string> = {
  off: "Off",
  leaf: "The row only",
  trail: "Row and its trail",
  ends: "Trail, not on L2",
};

/**
 * What the mark actually looks like, once SELECTED_STATES has said where it goes.
 *
 * Split from that axis because they are two questions and mixing them gives
 * twelve values of one control. This one is pure appearance, and there is no
 * obviously right answer: the constraint is only that it must not be the fill
 * a hovered or panel-open row already wears, or the nav shows two rows in the
 * same state meaning different things.
 *
 *  bar      A 3px rule on the leading edge. Costs no width and cannot collide
 *           with any fill — and reads as chrome belonging to the nav rather
 *           than as a property of the row, which is the complaint against it.
 *  fill     A step darker than hover. Unmistakably the row, at the price of
 *           being the same KIND of signal as hover: on a row that is both, the
 *           difference is one shade.
 *  tint     The accent, softly. The loudest and the easiest to find; also the
 *           one that spends brand on a state that is true all day.
 * `outline` — a hairline ring — is gone (Sep 10). A 1px line on a 272px row
 * was the quietest thing on a surface that also draws dividers, panel borders
 * and an edit ring, and in a review nobody could find it without being told
 * where to look. An option that has to be pointed out is not an option.
 *
 * The trail, where it is drawn at all, is the same treatment at lower strength
 * rather than a second treatment — so the eye reads it as less of the same
 * thing rather than as another kind of thing.
 */
export const SELECTED_MARKS = ["fill", "bar", "tint"] as const;

export type SelectedMark = (typeof SELECTED_MARKS)[number];

export const SELECTED_MARK_LABELS: Record<SelectedMark, string> = {
  fill: "Darker fill",
  bar: "Edge bar",
  tint: "Accent tint",
};

/**
 * How a group row's flyout opens. `click` — Khoi's Aug 10 suggestion, and the
 * default — opens nothing until the row is actually clicked, trading
 * discoverability for calm; `hover` previews on rollover with the
 * direction-aware dwell. Default listed first, as everywhere else.
 */
/**
 * How an L2 row reveals its L3 rows.
 *
 *  inline  Today: the L3 rows drop open underneath their parent, indented, and
 *          the L2 panel grows. One surface, and the parent stays visible above
 *          the children — but a deep tree pushes everything below it far down a
 *          panel you then have to scroll.
 *  panel   A small dropdown beside the L2 panel, sized to its contents, which
 *          cascades again for L4. The panel behind it never moves, so the L2
 *          list stays where your eye left it — and the levels read as levels
 *          rather than as one list with indents.
 *
 * The dropdown is the default: the L2 panel is already a full-height surface,
 * and growing a second list inside it was the thing that made three levels feel
 * like one long page.
 */
export const L3_DISCLOSURES = ["panel", "inline"] as const;

export type L3Disclosure = (typeof L3_DISCLOSURES)[number];

export const L3_DISCLOSURE_LABELS: Record<L3Disclosure, string> = {
  panel: "Dropdown beside it",
  inline: "Inline, indented",
};

export const FLYOUT_TRIGGERS = ["click", "hover", "sticky"] as const;

export type FlyoutTrigger = (typeof FLYOUT_TRIGGERS)[number];

export const FLYOUT_TRIGGER_LABELS: Record<FlyoutTrigger, string> = {
  hover: "On hover",
  click: "On click",
  sticky: "Click, then hover",
};

/**
 * `sticky`, and why it is the default.
 *
 * The other two are the two halves of one argument that neither wins. Pure
 * hover opens panels at people who were only crossing the nav on their way
 * somewhere else; pure click makes comparing two categories a four-click job —
 * open, close, open, close — when the whole reason to look at a second one is
 * that the first was not it.
 *
 * Sticky is the menubar rule, and everyone already knows it without being
 * taught: nothing opens until you ask, and once something IS open the nav
 * behaves like an open menu — moving along it moves the panel with you. The
 * cost of a wrong first click is one more hover, not another click.
 *
 * Applies at both levels, the same way: the first L2 row you click opens its
 * L3, and after that hovering a sibling swaps it.
 */

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
 * How the nav says it is in edit mode.
 *
 * The mode changes what a click does — a label renames, a row drags — and the
 * affordances alone do not say so until you hover one. Something has to mark
 * the region the mode applies to.
 *
 *  ring  A neutral stroke around the nav, and the surround a step back behind
 *        it. Quiet, and the thing the review kept calling unclear: a 1.5px
 *        outline is also what a focus ring looks like.
 *  dim   No stroke at all. Everything outside the nav drops further and
 *        desaturates, so the mode is shown by what is WITHDRAWN rather than by
 *        what is added — which cannot be mistaken for a selection, and needs no
 *        colour of its own.
 *
 * Two hatched-edge and header-band variants were built and cut (Aug 28): both
 * read as louder versions of the same idea the ring already has, and neither
 * survived being seen next to `dim`.
 */
/**
 * How edit mode says a label is — or is not — renameable.
 *
 * Both answers were asked for within an hour of each other on Sep 28, which is
 * why this is an axis rather than a decision: the first ask was "provide a
 * signifier and affordance — an edit icon and a hover tooltip", and the second,
 * having seen it, was "I want another option where the edit icon won't be
 * there". Both are defensible and the prototype's job is to show them side by
 * side.
 *
 *  tooltip  No pencil anywhere. The label is the control, as it was before the
 *           icon existed, and hovering it says what it will do — "Click to
 *           rename", or the reason it will not. Edit mode stays a nav with its
 *           labels live rather than a row of tools. The cost is honest: until
 *           you hover, nothing on screen says the text is a field.
 *  icon     A pencil on every row that may be renamed, greyed with its reason
 *           on the top-level rows that may not. Says it without being asked,
 *           and costs a fourth control on a 272px row.
 *
 * `tooltip` is the default on Ashwin's call.
 *
 * Neither answer reaches the flyout's rows. Down there every row is a product
 * and none of them can be renamed, so there is no odd one out to mark and
 * nothing for a tooltip on every label to distinguish — see
 * NavRowEdit.renameBlockedUniform.
 */
export const RENAME_AFFORDANCES = ["tooltip", "icon"] as const;

export type RenameAffordance = (typeof RENAME_AFFORDANCES)[number];

export const RENAME_AFFORDANCE_LABELS: Record<RenameAffordance, string> = {
  tooltip: "Tooltip on the label",
  icon: "Edit icon on the row",
};

export const EDIT_TREATMENTS = ["ring", "dim"] as const;

export type EditTreatment = (typeof EDIT_TREATMENTS)[number];

export const EDIT_TREATMENT_LABELS: Record<EditTreatment, string> = {
  ring: "Border",
  dim: "Dimmed surround",
};

/**
 * How the account rail marks the account you are in.
 *
 * The rail draws every tenant at one size and says which is live with a filled
 * tile and a bar at the strip's edge. Both are marks you have to READ: same
 * shape as everything around them, differing only in fill.
 *
 *  uniform  One size down the strip. Active carried by the fill alone.
 *  active   The live tile goes to 28 and the rest to 16, so size is the
 *           signal. One big disc in a column of small ones is seen rather than
 *           read — and it is the only treatment that also answers "none of
 *           them", which is what agency scope looks like.
 *
 * A 12px spread, which is wide on purpose: at 4px the difference was there and
 * nobody saw it. The cost is that a 16px tenant mark is a colour rather than a
 * logo — which the rail can afford, because reading it is what hover
 * magnification and the names-on-hover width are both already for.
 */
export const RAIL_SIZINGS = ["uniform", "active"] as const;

export type RailSizing = (typeof RAIL_SIZINGS)[number];

export const RAIL_SIZING_LABELS: Record<RailSizing, string> = {
  uniform: "One size",
  active: "Active is larger",
};

/**
 * Rail mark diameters, in px: the one size, then the pair.
 *
 * `RAIL_TILE_BOX` is the constant the three are padded INTO. Every tile stays a
 * 32px circle whatever mark it holds, so the column's rhythm never changes and
 * the tap targets are all the size they always were — only the artwork inside
 * grows and shrinks.
 */
export const RAIL_TILE_SIZE = 24;
export const RAIL_TILE_SIZE_ACTIVE = 28;
export const RAIL_TILE_SIZE_REST = 16;
export const RAIL_TILE_BOX = 32;

/**
 * The gap after a row's last child, once the names are open.
 *
 * Fixed rather than derived from the mark, because what sits there is the pin —
 * and a mark that means "kept" has to land on the same column down the whole
 * list or it reads as noise rather than as a column.
 */
export const RAIL_ROW_END_PAD = 10;

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
/**
 * What the history section inside the merged panel is called.
 *
 * The panel is titled "Recents" and its second section was headed "Recent",
 * which reads as the same word twice and leaves the reader working out whether
 * the section is a subset of the panel or the panel itself repeated. Each of
 * these names the section by what is in it rather than by the panel it sits in.
 *
 *  history      Plainest, and the one word nobody has to interpret.
 *  visited      Says what put a row there: you went somewhere, not you kept it.
 *  recent       The original, kept as the control group.
 */
/**
 * What colour a set pin is drawn in, everywhere it appears.
 *
 *  grey   Ink at gray-400. A pin is a state, not an action — once set it is
 *         describing the row rather than asking to be pressed — and a column of
 *         brand-coloured pins down a list was the loudest thing in the nav.
 *  brand  The accent, as it shipped. The pin is the gesture these surfaces
 *         exist for, and colour is how it says so.
 *
 * One axis for every surface rather than a per-surface exception: a pin that is
 * blue in the dock and grey in the list reads as two different marks.
 */
export const PIN_MARK_COLOURS = ["grey", "brand"] as const;

export type PinMarkColour = (typeof PIN_MARK_COLOURS)[number];

export const PIN_MARK_COLOUR_LABELS: Record<PinMarkColour, string> = {
  grey: "Grey",
  brand: "Brand",
};

export const PANEL_RECENT_HEADINGS = ["history", "visited", "recent"] as const;

export type PanelRecentHeading = (typeof PANEL_RECENT_HEADINGS)[number];

export const PANEL_RECENT_HEADING_LABELS: Record<PanelRecentHeading, string> = {
  history: "History",
  visited: "Recently visited",
  recent: "Recent",
};

export const INBOX_PALETTES = ["product", "tokens"] as const;

export type InboxPalette = (typeof INBOX_PALETTES)[number];

export const INBOX_PALETTE_LABELS: Record<InboxPalette, string> = {
  product: "Product",
  tokens: "Prototype",
};

/**
 * At what scale the bar draws a heading that moved up into it.
 *
 * `compact` is the bar's own idiom: 13px semibold, the count in a pill and the
 * description trailing on the same line, all inside the 48px the bar already
 * spends. It keeps the bar a bar.
 *
 * `page` keeps the heading at PAGE scale — 20px semibold title, 13px
 * description on its own line underneath — which is the arrangement slot 05
 * draws, moved bodily upward. Ashwin asked for it on Sep 23 so the two can be
 * argued side by side, and the trade it puts on screen is height: the bar stops
 * being 48px and grows to fit, so what is saved is the gap and the page's own
 * top inset rather than the heading's band. Whether that is still a saving is
 * the question the option exists to answer.
 */
export const BAR_HEADING_SCALES = ["compact", "page"] as const;

export type BarHeadingScale = (typeof BAR_HEADING_SCALES)[number];

export const BAR_HEADING_SCALE_LABELS: Record<BarHeadingScale, string> = {
  compact: "Bar scale",
  page: "Page scale",
};

export const LAYOUT_REPLACE_DIALOGS = ["simple", "keep-old"] as const;

export type LayoutReplaceDialog = (typeof LAYOUT_REPLACE_DIALOGS)[number];

export const LAYOUT_REPLACE_DIALOG_LABELS: Record<LayoutReplaceDialog, string> =
  {
    simple: "Simple",
    "keep-old": "Save old layout",
  };

/**
 * How a sub-account person with access to several accounts switches between them.
 *
 * The rail was built for the agency: a working set of clients, curated out of
 * hundreds, with the agency itself as the first tile. But a sub-account owner
 * can belong to more than one account — two businesses, a franchise pair — and
 * today they get no switcher at all, because the rail is gated on not being a
 * plain user.
 *
 * `rail`     the same vertical rail, minus the parts that only make sense
 *            above the accounts. The default: it is one mechanism serving two
 *            audiences rather than a second thing to learn.
 * `dropdown` a control in the nav header that lists the accounts they can
 *            reach. Cheaper in horizontal space, and closer to what most
 *            products do — at the cost of hiding the set until opened.
 */
/**
 * What updating a template does to the accounts already on it.
 *
 * The one genuinely load-bearing decision in the templates feature, and it is
 * a decision because both answers are defensible for different agencies.
 *
 * `managed` a template is a live standard. Saving it re-arranges every account
 *           on it, right then. This is what an agency running forty dentists
 *           off one nav means by "template" — fix it once, fixed everywhere —
 *           and it is the default because the alternative makes the feature
 *           useless at exactly the scale it exists for: forty accounts to
 *           re-apply by hand is forty chances to miss one.
 * `copy`    a template is a starting point. Applying stamps a copy and the
 *           link is only provenance; later saves reach nobody. Safer, and
 *           right for an agency whose accounts diverge on purpose — but it
 *           means the fix you just made lives on one account.
 *
 * Either way, entitlement is untouched: a push re-filters against what each
 * account owns, so it can rearrange rows and never grant a product.
 */
export const TEMPLATE_PROPAGATIONS = ["managed", "copy"] as const;

export type TemplatePropagation = (typeof TEMPLATE_PROPAGATIONS)[number];

export const TEMPLATE_PROPAGATION_LABELS: Record<TemplatePropagation, string> = {
  managed: "Push to every account on it",
  copy: "Leave them as they are",
};

export const SUB_ACCOUNT_SWITCHERS = ["rail", "dropdown"] as const;

export type SubAccountSwitcher = (typeof SUB_ACCOUNT_SWITCHERS)[number];

export const SUB_ACCOUNT_SWITCHER_LABELS: Record<SubAccountSwitcher, string> = {
  rail: "Vertical rail",
  dropdown: "Header dropdown",
};

/**
 * Where the New dot sits, or whether it sits anywhere.
 *
 * Three answers to one question — how loudly should a closed door say there is
 * something new behind it — and they are genuinely different bets rather than
 * styling variants:
 *
 *   `label`   beside the words, on the text baseline. Reads as part of the row.
 *   `icon`    on the glyph's top-right, the shape every app uses for an unread
 *             count. Louder, and scannable down the icon column alone; the risk
 *             is that people read it as a notification and expect clearing it
 *             to mean something.
 *   `hidden`  no dot at all, and the default. The pill still sits on the
 *             product that launched, so nothing is lost for anyone who opens
 *             the panel — what goes is the nav's ability to tell you to open
 *             it. That turned out to be the right trade for a sidebar that is
 *             read a hundred times a day: a dot on a closed door is a standing
 *             interruption, and it is standing for as long as the product is
 *             "new", which is months. Both placements are one click away for
 *             looking at what announcing a launch would cost.
 *
 * Not per account. Whether the platform announces its launches in the sidebar
 * is a HighLevel decision, not a tenant's.
 */
export const NEW_DOT_PLACEMENTS = ["hidden", "label", "icon"] as const;

export type NewDotPlacement = (typeof NEW_DOT_PLACEMENTS)[number];

export const NEW_DOT_PLACEMENT_LABELS: Record<NewDotPlacement, string> = {
  label: "Beside the text",
  icon: "On the icon",
  hidden: "Hidden",
};

export const NAV_COLOUR_CONTROLS = ["toggle", "panel"] as const;

export type NavColourControl = (typeof NAV_COLOUR_CONTROLS)[number];

export const NAV_COLOUR_CONTROL_LABELS: Record<NavColourControl, string> = {
  toggle: "Light / dark icon",
  panel: "Full colours panel",
};

export const NAV_GENERATIONS = ["new", "legacy"] as const;

/**
 * How the choice between the two navigations is presented.
 *
 *  modal  Two cards, each showing the arrangement it names, one marked as
 *         current. The choice is between two products rather than between two
 *         settings, and the thing a person needs in order to make it is a look
 *         at both — which a menu row cannot give them.
 *  menu   The drill-down in the edit card's ⋯: a label and a sentence each.
 *         Cheaper, and three levels deep inside a mode you entered to rename a
 *         row.
 *
 * A presentation axis, not a placement one — both are opened from the same row.
 * Where that row should ALSO live is a separate and more serious question; see
 * the note on the row itself in edit-more-menu.tsx.
 */
export const NAV_SWITCH_SURFACES = ["modal", "menu"] as const;

export type NavSwitchSurface = (typeof NAV_SWITCH_SURFACES)[number];

export const NAV_SWITCH_SURFACE_LABELS: Record<NavSwitchSurface, string> = {
  modal: "Modal with previews",
  menu: "Dropdown",
};

export type NavGeneration = (typeof NAV_GENERATIONS)[number];

export const NAV_GENERATION_LABELS: Record<NavGeneration, string> = {
  new: "New nav",
  legacy: "Old nav",
};

export interface ThemeState {
  accent: Accent;
  /** Whether the accent also tints the whites, greys and text. */
  tint: Tint;
  /**
   * Whether the new nav offers a dark mode at all.
   *
   * Off (Sep 10): the proposal ships light-only, so the product shows no
   * light/dark control anywhere and `appTheme`, `navTheme` and `headerTheme`
   * are pinned to light however they are set. The whole dark palette stays
   * built — every token, every `[data-nav-theme="dark"]` rule — so turning this
   * back on restores it without rework, which is the point of it being an axis
   * rather than a deletion.
   *
   * Deliberately does NOT reach `searchTheme` or `legacyNavTheme`. Those are
   * dark on purpose and for reasons that have nothing to do with this: search
   * is dark so it never reads as part of the nav, and the legacy nav is dark
   * because production's nav is. Forcing them light would misrepresent the
   * thing the prototype is being compared against.
   */
  darkMode: boolean;
  appTheme: SurfaceTheme;
  navTheme: SurfaceTheme;
  /** Which dark the dark nav is. See NAV_DARK_TONES. */
  navDarkTone: NavDarkTone;
  headerTheme: SurfaceTheme;
  searchMode: SearchMode;
  /** Search defaults to dark so it never reads as part of the nav. */
  searchTheme: SurfaceTheme;
  dockLabel: DockLabel;
  dockPosition: DockPosition;
  entryLayout: EntryLayout;
  /**
   * Whether the attach-template modal keeps its "In use" column.
   *
   * How many sub-accounts a template already governs is the one fact that
   * makes attaching feel consequential rather than administrative — and it is
   * also a second column on a list whose rows are one word each, which is the
   * argument for dropping it. On by default; the switch is here so the two can
   * be looked at rather than argued about.
   */
  attachTemplateInUse: boolean;
  /** How round the merged entry is drawn. See ENTRY_RADII. */
  entryRadius: EntryRadius;
  /** Which end of the bar the header entry stands at. See HEADER_ENTRY_SIDES. */
  headerEntrySide: HeaderEntrySide;
  /** Where the Get the app offer is reached from. See GET_APP_PLACEMENTS. */
  getAppPlacement: GetAppPlacement;
  /** Whether the agency's entry pill carries search. See AGENCY_SEARCH_DEFAULT. */
  agencySearch: boolean;
  /**
   * Whether the agency nav header repeats the rail's logo. Agency scope only.
   * See AGENCY_NAV_MARK_DEFAULT.
   */
  agencyNavMark: boolean;
  /** Whether the nav drops its card and sits on the plane. See NAV_ON_PLANE_DEFAULT. */
  navOnPlane: boolean;
  /** Arranging, renaming and re-iconing pins in edit mode. See PINNED_ROW_EDIT_DEFAULT. */
  pinnedRowEdit: boolean;
  /** Keyboard shortcuts on pinned rows. See PINNED_SHORTCUTS_DEFAULT. */
  pinnedShortcuts: boolean;
  /** How an L2 row reveals its L3 rows. See L3_DISCLOSURES. */
  l3Disclosure: L3Disclosure;
  flyoutTrigger: FlyoutTrigger;
  /** Whether the nav marks the page you are on. See SELECTED_STATES. */
  selectedState: SelectedState;
  /** What that mark looks like. See SELECTED_MARKS. */
  selectedMark: SelectedMark;
  /** What clicking a parent row does. See L2_CLICK_ACTIONS. */
  l2ClickAction: L2ClickAction;
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
  /** How much contrast the Launchpad card carries. See LAUNCHPAD_CARDS. */
  launchpadCard: LaunchpadCard;
  /** Which workspace-switch model is live. See SCOPE_MODELS. */
  scopeModel: ScopeModel;
  /** Proposal or production. See NAV_GENERATIONS. */
  navGeneration: NavGeneration;
  /** How the two navigations are offered. See NAV_SWITCH_SURFACES. */
  navSwitchSurface: NavSwitchSurface;
  /** What saving a template does to the accounts on it. See TEMPLATE_PROPAGATIONS. */
  templatePropagation: TemplatePropagation;
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
  /** What colour a set pin wears. See PIN_MARK_COLOURS. */
  pinMarkColour: PinMarkColour;
  /** What pinning does on screen. See PIN_FEEDBACKS. */
  pinFeedback: PinFeedback;
  /** How the Ask AI button is drawn when it is not a field. See AI_BUTTON_STYLES. */
  aiButtonStyle: AiButtonStyle;
  /** How the old nav's own controls are reached. See LEGACY_FOOT_CONTROLS. */
  legacyFootControl: LegacyFootControl;
  /** The standing Switch nav button at the new nav's foot. */
  navSwitchButton: boolean;
  /** Whether the agency nav can be edited. See AGENCY_EDIT_NAV_DEFAULT. */
  agencyEditNav: boolean;
  /** What the merged panel's history section is headed. See PANEL_RECENT_HEADINGS. */
  panelRecentHeading: PanelRecentHeading;
  /** Which palette the Conversations inbox uses. See INBOX_PALETTES. */
  inboxPalette: InboxPalette;
  /**
   * Whether the page header shows its title.
   *
   * The trail already names the page, one line above and in the same
   * column — so the title is the second copy. Hidden, the header keeps the
   * count, the status and the actions, and collapses to a single action
   * row; shown, it is the full two-line block. Worth a knob because the two
   * are a real trade: the duplicate costs ~44px on every page, and the
   * heading is what makes a page feel like a place.
   */
  pageTitle: boolean;
  /**
   * Whether the header's one-line description survives.
   *
   * Dependent on the title: a description with no heading over it is a
   * sentence floating where a page name should be, and it explains a title
   * that is no longer there.
   */
  pageDescription: boolean;
  /**
   * Whether the header carries the collection's size.
   *
   * Also dependent on the title — it is a count OF something, and without
   * the heading there is nothing in the row for it to be counting.
   */
  pageCount: boolean;
  /**
   * Whether slot 05 is drawn at all.
   *
   * The strongest version of the question: no title, no count, no actions —
   * the trail names the page and the control bar carries the work. Worth
   * seeing, because it is what "the platform draws the page" looks like if
   * taken all the way.
   */
  pageHeader: boolean;
  /**
   * Whether a dashboard's own bar sticks while the widgets scroll.
   *
   * On, the title, the dashboard switcher and the date range stay put, so a
   * number three screens down still has a range attached to it. Off, only
   * the app bar is fixed and the whole page scrolls under it — which is what
   * ships today, and the thing this page exists to let you feel the
   * difference of.
   */
  stickyDashboardBar: boolean;
  /**
   * Whether the whole catalogue becomes the nav, as a tree.
   *
   * The arrangement the flyouts exist to avoid, built so it can be argued
   * against with a real screen rather than from memory: every group expands in
   * place to its products and their pages, so L1, L2 and L3 are all reachable
   * without a second surface opening. What it buys is that the nav always says
   * where you are; what it costs is a nav long enough to scroll, which is the
   * thing the flyout model was chosen to prevent.
   *
   * Pinned rows stay above it — the tree is for everything else — and the
   * catalogue's own entry goes, since the tree IS the catalogue. The trail is
   * deliberately left alone: one variable at a time, and whether a tree lets
   * the breadcrumb shorten is its own question.
   */
  navArrangement: NavArrangement;
  /** Where `scoped`'s category switcher sits. See SCOPED_SWITCHES. */
  scopedSwitch: ScopedSwitch;
  /**
   * Whether the tree's group rows carry a product count.
   *
   * Off by default. The count answers "how much is behind this" before you
   * open it, which is worth something on a flyout you are deciding whether to
   * pay for — but the tree opens in place, so the answer is one click away and
   * the number is competing with the label for the row. Kept as a switch
   * because the empty-bucket case is the one place it still earns its keep: a
   * bakery's Integrations shelf reading 0 is the same fact told before the
   * click instead of after it.
   */
  navTreeCounts: boolean;
  /**
   * What the tree draws beside its rows.
   *
   * A glyph per level is how the flyout's rows read, and the tree inherited it
   * — but the flyout shows one level at a time where the tree shows three, so
   * the same decision produces a column of pictures rather than a list of
   * names. `rails` replaces them with the hairline guides a file tree uses,
   * which say depth without competing with the label for the eye.
   */
  treeIcons: TreeIcons;
  /**
   * Whether the Recents panel's "View all" offers the whole catalogue.
   *
   * Only meaningful with the tree on: the tree already IS all products, so a
   * second copy behind View all is either a duplicate or the one place a
   * search can live without the tree filtering itself.
   */
  treeRecentsAllProducts: boolean;
  /**
   * Where the tree's search field sits, and whether it exists.
   *
   * The tree took the catalogue's place, and the catalogue panel had a search.
   * Without one the only way to the tail of a twelve-group tree is to open
   * groups until you find it — which is the scrolling problem the flyout model
   * was built to avoid, reintroduced by the arrangement meant to answer it.
   *
   * Above Launchpad by default. The earlier argument was that the search
   * belongs over the thing it filters — true while the rest of the column
   * stays put, and moot now that a query hides Launchpad, Recents and the
   * quick actions outright. With everything but the results gone, the field IS
   * the nav for as long as you are typing, and a control that becomes the
   * whole surface should not sit a third of the way down it.
   *
   * The other placements stay, because what they lose is an argument about the
   * SEARCHING state and what they keep is one about the RESTING state: over
   * the tree, the field reads as belonging to the catalogue rather than to the
   * account blocks above it. Which of those two states should win is the thing
   * the axis exists to let someone look at.
   */
  treeSearchPlace: TreeSearchPlace;

  /* ── the trail's own axes (Sep 22 round two) ──────────────────────────── */

  /**
   * How the last crumb is marked out — painted, outsized, both, or neither.
   *
   * The point is not decoration: if the trail's leaf is emphatic enough to read
   * as the page's name, the page does not need to print that name again. This
   * is the knob that makes "delete the title" defensible rather than merely
   * cheaper — so it belongs beside the title switches, not in a style menu.
   *
   * Was a boolean, and painting was all it could do (Sep 23 round three). The
   * chip alone turned out to be the weaker half of the argument: a ground says
   * the segment is special, but it is still 13px, and a 13px word is not a
   * title however it is backed. Splitting the means in two lets the type carry
   * the weight and leaves the chip optional rather than mandatory.
   */
  crumbEmphasis: CrumbEmphasis;
  /**
   * The size every crumb reads at, which `crumbEmphasis: "type"` then builds
   * on: 15px with an emphatic leaf puts the leaf at 17px, and the step between
   * the path and the page stays the same two pixels at either scale.
   */
  crumbScale: CrumbScale;
  /**
   * Icons on every crumb, or only on Home.
   *
   * Home only, by default (Sep 23). Home is the one crumb that is a
   * destination rather than a label — the rest are words, and a glyph beside
   * each of them competes with the word it is supposedly helping. At depth the
   * row becomes a line of small pictures the eye has to skip to read the path.
   *
   * Every level stays available because the trade flips on a shallow trail:
   * two or three crumbs with glyphs scan faster than they read, which is
   * exactly the case the option exists to show.
   */
  crumbIcons: CrumbIcons;
  /**
   * How a long trail folds, if at all.
   *
   *  off     Every level stays on the row.
   *  middle  Four items plus a `…`, folding from the middle — Home and the
   *          leaf always survive, because the two ends are the only segments
   *          whose absence you would notice.
   *  deep    Home ▸ … ▸ parent ▸ current, whatever the depth. The most compact
   *          that still answers both questions a trail is asked: where am I,
   *          and what am I inside. Dropping the parent too (Home ▸ … ▸ current)
   *          was the tempting version and it answers only the first.
   *
   * Off by default: today's trails top out at four segments, so any folding
   * would hide levels nobody needed hidden — see the note in the panel.
   */
  crumbCollapse: CrumbCollapse;
  /**
   * Whether the trail opens on the bucket or on the product.
   *
   * The bucket (CRM, Content, Automate) is a nav grouping, not a destination
   * you can stand on — so the first crumb is the one segment of the trail that
   * cannot be "where you came from". Starting at the product drops it
   * everywhere, including on pages with nothing below them, which is the point:
   * a rule that only applies at depth is a rule nobody can predict.
   */
  crumbStart: CrumbStart;
  /** Whether the trail is drawn at all. */
  crumbShown: boolean;
  /**
   * Whether the trail opens with the Home glyph.
   *
   * Off by default (Sep 30). Home is a destination rather than a label, which
   * is the argument FOR it — but the nav is already two clicks of Home away at
   * every moment, and a glyph that leads where the sidebar leads is a segment
   * of the trail spent on something the trail is not for. The separator rule
   * follows it: with no Home to point back at, the row opens on its first
   * crumb rather than on a mark aimed at the bar's left padding.
   */
  crumbHome: boolean;
  /**
   * Whether crumb segments open their siblings.
   *
   * The menus are what make the trail a navigator rather than a read-out. Off,
   * it states where you are and nothing more — which is the honest version if
   * the nav is already doing the switching.
   */
  /** Which crumbs carry a dropdown. See CRUMB_SWITCHER_MODES. */
  crumbSwitchers: CrumbSwitchers;
  crumbSeparator: CrumbSeparator;
  /**
   * What the trail's last segment is. See CRUMB_LEAVES.
   *
   * `title` by default (Sep 30): the leaf leaves the bar and the page title
   * grows the caret, so the page is named once on screen and the switching is
   * attached to the name rather than standing beside it. It needs a title to
   * attach to and degrades to `none` when there is none — a page with its
   * header switched off, or a leaf with no siblings to offer.
   */
  crumbLeaf: CrumbLeaf;
  /** What a folder's crumb does to the view crumb. See FOLDER_CRUMBS. */
  folderCrumb: FolderCrumb;
  /** How much of the trail's tail the bar prints. See CRUMB_DEPTHS. */
  crumbDepth: CrumbDepth;
  /**
   * A second trail INSIDE the table, above its header row.
   *
   * What the real product does on a screen with folders in it: Home ▸ Intake,
   * drawn in the card rather than in the chrome. Inside by default as of Sep
   * 30, and whenever it is on the folders leave the app bar's trail — the bar
   * stops at Workflows and the path is said once, by the thing being browsed.
   *
   * The argument for it is that a file browser's path belongs to the thing
   * being browsed: the bar names where the PAGE is, and inside a deep folder
   * those stop being the same sentence. The argument against is that it is a
   * second breadcrumb, and a screen with two of them has to explain which one
   * moves you. Ashwin, Sep 28.
   */
  tableCrumb: TableCrumb;
  /**
   * Whether a record opened from inside a folder keeps the folder in its
   * trail.
   *
   * On, the trail records the path you actually took, and every crumb above
   * the record lands you back where you were. Off, it flattens to the list —
   * shorter, and it means the same workflow has the same trail however you
   * reached it, at the cost of a Back that has to pick one of the two places
   * you might have come from. Ashwin asked for both on Sep 28.
   */
  recordKeepsFolder: boolean;
  /**
   * Whether a generic child folds its parent's name into its own.
   *
   * "Calendars ▸ Settings" tells you less than "Calendar settings" does in one
   * crumb: Settings alone is a word a dozen products own, and the trail spends
   * two segments saying what one could. Applies wherever a child's label is
   * generic enough to be ambiguous on its own.
   */
  crumbCompoundChild: boolean;
  /** Whether the record's own crumb says its name or the kind of thing it is. */
  recordCrumbLabel: RecordCrumbLabel;
  /** Whether a record publishes a crumb at all, or the trail stops at the list. */
  recordCrumbShown: boolean;
  /**
   * Whether L4/L5/L6 render as a second, inline trail under the page header.
   *
   * The alternative to stacking a tab bar per level: one path row that says
   * where you are inside the page, kept separate from the app bar's trail so
   * the two are never read as one chain.
   */
  deepInlineCrumb: boolean;
  /**
   * Whether a record page draws its own back control.
   *
   * `record-crumb.tsx` argues the trail IS the way out, and that a page with a
   * crumb above it does not need to draw a second one. That holds right up
   * until someone is reading a record rather than navigating to it: the trail
   * is 48px away at the top of the window, and the hand is down in the record.
   * A knob rather than a decision, because the duplication it re-introduces is
   * exactly what the crumb was meant to retire — so the two readings have to be
   * switchable side by side before either wins.
   *
   * Placed by the variant, not by this: D-B puts it in the panel's own header
   * row, D-D at the head of the meta strip, D-A in the page header's lead slot.
   * All three sit left of everything else, which is the side navigation lives
   * on.
   */
  recordBackButton: boolean;
  /**
   * WHERE that back control sits, once it is on.
   *
   * Three placements because the three are not the same argument. In the
   * trail it is navigation chrome, shared with every other page and always in
   * the same spot — the strongest case for consistency and the weakest for
   * reachability. In the page header it is the record's own row, beside the
   * record's own actions. Inline it is in the canvas, at the head of the first
   * column, which is where the reading hand already is and where HubSpot,
   * Attio and Close all put it.
   *
   * Added Sep 23 on Ashwin's ask. Until then "on" meant one placement chosen
   * by the variant, which made the knob a claim about the variant rather than
   * about the exit — and made it impossible to argue for the trail placement
   * at all, since no variant offered it.
   */
  recordBackPlace: RecordBackPlace;
  /**
   * Which header shape each page archetype draws. See header-variants.ts.
   *
   * One axis per archetype because the answer genuinely differs by page kind:
   * a table gives its title to the trail and loses nothing, a builder cannot
   * give up its publish row. Picking one writes the four knobs above, so the
   * variant and the knobs can never disagree.
   */
  listHeaderVariant: ListHeaderVariant;
  /** Whether a collection shows its saved-view tabs. */
  listShowViews: boolean;
  /** Whether a collection shows its filter controls. */
  listShowFilters: boolean;
  /** Which list toolbar every list page draws. See LIST_TOOLBARS. */
  listToolbar: ListToolbarVariant;
  /**
   * The HighRise centre canvas: everything below the breadcrumb row — page
   * header included — inside one white card with shadow/lg, scrolling inside
   * it. Off by default; builders keep their own layout.
   */
  pageCanvas: boolean;
  /**
   * Whether the canvas also holds the pages built from columns.
   *
   * The inbox, a contact record, Ask AI: surfaces that are already a row of
   * panes, each with its own edge. They were exempt outright — `useNoPageCanvas`
   * and `isInboxPlace` took them out of the canvas whatever the knob said — on
   * the argument that a card around a row of cards is a card holding cards.
   *
   * That is an argument, not a fact, and it was being made by the code rather
   * than being put on screen (Sep 30). On by default now, so the canvas is the
   * page shell everywhere and the exemption is the thing you switch on to see:
   * off, those pages run edge to edge exactly as they did, and every other page
   * is untouched either way.
   *
   * Only read while `pageCanvas` is on. There is no canvas to withhold from
   * them otherwise, which is why the panel disables this control rather than
   * offering a switch whose two settings look identical.
   */
  pageCanvasColumns: boolean;
  recordHeaderVariant: RecordHeaderVariant;
  /**
   * How a page with two views of one collection lets you change which.
   *
   * Calendars is the case: the week grid and the appointment table are the
   * same bookings drawn twice. `tabs` puts them in the page's tab strip,
   * where they read as two views of the page; `switcher` collapses them into
   * one segmented control in the control bar, where they read as a property
   * of the list — the way Opportunities switches board and table.
   *
   * Two answers to one question, and the difference is not cosmetic: a tab
   * strip claims the page has two halves, a switcher claims it has one
   * subject drawn two ways. Worth seeing side by side.
   */
  calendarViewSwitch: CalendarViewSwitch;
  /**
   * The builder's chrome, as two retain switches and a placement.
   *
   * Two axes rather than named shapes: whether the nav survives into the
   * builder, and whether the app bar does. `builderControls` only has anything
   * to say once the bar is gone — it is where the trail and the publish row go
   * when there is no bar to hold them — and `builderExit` only matters once the
   * sidebar is gone too, since a retained sidebar IS the way out.
   */
  builderKeepSidebar: boolean;
  builderKeepTopBar: boolean;
  builderControls: BuilderControls;
  builderExit: BuilderExit;
  /** What the workflow canvas draws inside whatever chrome is on. */
  builderCanvas: BuilderCanvas;
  /** Whether the promo banner survives into a builder. */
  builderKeepBanner: boolean;
  /**
   * Whether the builder's own chrome is rows, or islands over the canvas.
   *
   * `rows` is a band at the top and, where a builder has one, another at the
   * bottom: honest, predictable, and it costs the canvas its full width twice.
   * `floating` lifts the same controls into rounded islands ON the canvas —
   * the artifact's name top-left, the collaboration cluster top-right, the
   * tools bottom-centre, zoom bottom-left. Nothing is removed; the canvas
   * simply runs underneath, which is what makes a whiteboard feel like a
   * surface rather than a pane between two bars.
   *
   * The cost is that an island can sit on top of the work. That is the trade
   * worth looking at, and why this is an axis and not a decision.
   */
  builderChromeStyle: BuilderChromeStyle;
  /**
   * Whether a floating builder shows a tool palette at all.
   *
   * Off by default (Sep 23). The first cut copied ClickUp's whiteboard footer
   * onto a workflow canvas — cursor, hand, pen, colour, "Font" — on a surface
   * where nothing is drawn freehand, which is how an example becomes a claim.
   * The palette is worth having where a builder genuinely has drawing or
   * element tools; everywhere else it is furniture.
   */
  builderToolPalette: boolean;
  panelHeaderVariant: PanelHeaderVariant;
  deepHeaderVariant: DeepHeaderVariant;
  /*
   * `recordPageHeader` was here, and is now record variant D-A (Sep 23).
   *
   * "Does a record page need slot 05 at all" is still the question; it is just
   * asked by the picker that asks the other two answers, instead of by a lone
   * boolean underneath it that only meant anything under one of them.
   */
  /**
   * With no trail, whether the page's heading moves up into the 48px bar.
   *
   * Only reachable while `crumbShown` is false, and that dependency is the
   * whole idea rather than a guard bolted on: hiding the breadcrumb empties
   * the left half of the bar and leaves the page to name itself a band lower,
   * so the app pays 48px for a row of utilities and then pays again for a
   * title. Ashwin asked for this on Sep 23 — if the trail is gone, the bar has
   * room, and the title is the one thing that has to be somewhere.
   *
   * Off by default. Moving the heading up is a real trade, not a free win: the
   * bar is fixed and the page scrolls, so a title in the bar stops being the
   * top of the content and becomes chrome — which is right for a name and
   * wrong for a description, and that argument is exactly what this is here to
   * put on screen.
   */
  barPageHeading: boolean;
  /** At what scale the bar draws that heading. See BAR_HEADING_SCALES. */
  barHeadingScale: BarHeadingScale;
  /** How replacing my layout is confirmed. See LAYOUT_REPLACE_DIALOGS. */
  layoutReplaceDialog: LayoutReplaceDialog;
  /** How a multi-account sub-account person switches. See SUB_ACCOUNT_SWITCHERS. */
  subAccountSwitcher: SubAccountSwitcher;
  /** Where the New dot lands on a row that has one. See NEW_DOT_PLACEMENTS. */
  newDotPlacement: NewDotPlacement;
  /**
   * Whether the signed-in sub-account person belongs to more than one account.
   *
   * The switcher's precondition, and its own axis so the single-account case
   * stays demoable: with one account there is nothing to switch to, and BOTH
   * treatments have to disappear rather than offer a list of one.
   */
  userMultiAccount: boolean;
  /** Which colour control the edit card carries. See NAV_COLOUR_CONTROLS. */
  navColourControl: NavColourControl;
  /**
   * All products as a place of its own, reached from a standing row.
   *
   * This started as a second door to one panel, and two doors to one place was
   * the cost it was weighed against. On (Sep 9) it is no longer one place: the
   * panel splits along the seam that was already there. "View all" keeps what
   * you kept and where you have been; the directory keeps the catalogue,
   * walkable as L1 ▸ L2 ▸ L3 rather than listed flat, which is what makes it
   * answer "where does this live" instead of only "is it here".
   *
   * Off, the two halves live in one panel and the catalogue sits under Recent —
   * the arrangement this is being compared against.
   */
  productDirectoryRow: boolean;
  /** How the Recents panel arranges its two halves. See RECENTS_PANEL_LAYOUTS. */
  recentsPanelLayout: RecentsPanelLayout;
  /** Where the template feature's messages sit. See TEMPLATE_MESSAGE_PLACEMENTS. */
  templateMessagePlacement: TemplateMessagePlacement;
  /** What deleting a template does to the accounts on it. See TEMPLATE_DELETE_MODES. */
  templateDeleteMode: TemplateDeleteMode;
  /**
   * Whether a sub-account is told when its agency pushes a template update.
   *
   * Off. The person who sees that card did not make the change, cannot undo it,
   * and "Added 86 products" is the agency's authoring language rather than
   * anything they asked about. The agency manages the navigation; the client
   * uses it. On, the notice returns and follows the placement rule above.
   */
  templatePushNotice: boolean;
  /** How the templates menu is ordered. See TEMPLATE_MENU_SHAPES. */
  templateMenuShape: TemplateMenuShape;
  /** What the template list starts with. See TEMPLATE_SEEDS. */
  templateSeed: TemplateSeed;
  /** Where saving an arrangement lives. See TEMPLATE_SAVE_SHAPES. */
  templateSaveShape: TemplateSaveShape;
  /** Where library management lives. See TEMPLATE_ACTION_HOMES. */
  templateActionHome: TemplateActionHome;
  /** What a push does about a collision. See TEMPLATE_CONFLICTS. */
  templateConflict: TemplateConflict;
  /** Whether a layout can be held locally at all. See LAYOUT_MODELS. */
  layoutModel: LayoutModel;
  /**
   * Whether a SaaS plan can carry a template.
   *
   * Journey 4, and the only one of the five that reaches accounts nobody
   * selected: attach a template to a plan and every sub-account on it — and
   * every one added to it later — is on that template. On by default because a
   * plan is how agencies in SaaS mode actually provision, and because the
   * interesting half is what happens when an account LEAVES: nothing. A layout
   * arriving through a plan is indistinguishable afterwards from one applied by
   * hand, which is what keeps "exactly one thing" true.
   *
   * Off hides the plan column and the attach control, for reviewing the rest of
   * the model without the layer SaaS agencies alone care about.
   */
  templateSaasPlans: boolean;
  /**
   * Whether a template says which rows arrived after it was saved.
   *
   * A product added to the catalogue lands in every template at the position it
   * holds in the default, because the alternative is a template that silently
   * never shows a new product. That is the right behaviour and the wrong
   * silence: the agency chose this arrangement and something has been inserted
   * into it. On, the template's row carries a count and the nav marks the
   * arrivals, so the agency can look once and decide. Off, they simply appear.
   */
  templateNewProductMark: boolean;
  /**
   * Whether a template change can be taken back from the receipt.
   *
   * Off by default, and deliberately: every destructive move in this model is
   * already behind a dialog that names a count, and an undo standing behind the
   * dialog invites the dialog to be skimmed. On, applying and updating both
   * leave an undo on the receipt — worth seeing, because the argument for it is
   * that a count read too fast is exactly the case undo exists for.
   */
  templateUndo: boolean;
  /**
   * Whether the fleet starts out spread across a template each.
   *
   * Off, every sub-account starts on the HighLevel default and the list is one
   * row long — the honest zero state, and the one that makes "save as new
   * template" the obvious first move.
   *
   * On, each sub-account that ships with an arrangement of its own becomes a
   * named template holding exactly it, with that one account on it. This is the
   * proliferation the model implies, made visible: an agency that has tuned
   * thirty navs individually has thirty templates, and the question of what the
   * list looks like at that size is one you can only answer by looking at it.
   */
  templateAccountSpread: boolean;
  /**
   * Whether the edit card names the template being edited.
   *
   * On by default. "Editing template" says what KIND of thing is in front of
   * you and not which one — and under `one-template` that is the only question
   * worth answering before a keystroke lands, because the same gesture on the
   * default and on a shared template have very different consequences. A
   * reorder on Dental practice is about to move six navs; the card is the last
   * place that fact is free to state.
   *
   * Off for looking at the card without it: it costs a second line in a 256px
   * box that has run out of room twice already, and the argument for spending
   * that line is one you can only judge by seeing the card both ways.
   */
  editCardTemplateName: boolean;
  /** How the save dialog draws its two answers. See TEMPLATE_SAVE_LAYOUTS. */
  templateSaveLayout: TemplateSaveLayout;
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
  /** Whether the rail carries recents beside its curated set. See RAIL_RECENTS. */
  railRecents: RailRecents;
  /** Where the rail's directory button sits. See RAIL_DIRECTORY_SPOTS. */
  railDirectorySpot: RailDirectorySpot;
  /** How edit mode marks the nav. See EDIT_TREATMENTS. */
  editTreatment: EditTreatment;
  /** How a row says its label is renameable. See RENAME_AFFORDANCES. */
  renameAffordance: RenameAffordance;
  /** Whether size marks the active account. See RAIL_SIZINGS. */
  railSizing: RailSizing;
  /**
   * The bar at the strip's outer edge beside the active tile.
   *
   * Off by default (Aug 28). With the active tile now larger AND filled, the
   * bar was a third answer to a question already answered twice — and it is the
   * only one of the three that lives outside the tile, so it read as a piece of
   * chrome belonging to the rail rather than as a property of the account.
   */
  railActiveBar: boolean;
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
  /** Whether a magnified tile stays inside its row. See RAIL_ZOOM_FITS. */
  railZoomFit: RailZoomFit;
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
  accent: "highrise",
  tint: "off",
  darkMode: false,
  appTheme: "light",
  navTheme: "light",
  // Navy. The neutral is one click away for the comparison.
  navDarkTone: "navy",
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
  attachTemplateInUse: true,
  entryRadius: "pill",
  headerEntrySide: "right",
  /*
   * The avatar menu, which is where production puts it.
   *
   * The bar is the louder answer and it is one click away, but with search now
   * standing up there too the utility run is carrying the pill, five glyphs and
   * the avatar — and two more for the companion apps turns a row of things this
   * account DOES into a row that also advertises. The menu is the conventional
   * home for it; whether that is too quiet is exactly what the axis is for.
   */
  // One row that opens the pair, per the Sep 8 direction. See
  // GET_APP_PLACEMENTS for what the other three cost.
  getAppPlacement: "flyout",
  agencySearch: AGENCY_SEARCH_DEFAULT,
  agencyNavMark: AGENCY_NAV_MARK_DEFAULT,
  navOnPlane: NAV_ON_PLANE_DEFAULT,
  pinnedRowEdit: PINNED_ROW_EDIT_DEFAULT,
  pinnedShortcuts: PINNED_SHORTCUTS_DEFAULT,
  // Both back to the plain answer (Sep 10). The indented list and the
  // click-every-time trigger are what the nav shipped with, so they are what a
  // review should open on; the dropdown and the sticky swap are the proposals,
  // and a proposal that is already the default is not being compared to
  // anything. Click also stands on Khoi's Aug 11 note — "maybe the L2 doesn't
  // get exposed until the user actually clicks" — with the hover variants, and
  // their dwell, one toggle away.
  l3Disclosure: "inline",
  flyoutTrigger: "click",
  /*
   * On, and the whole trail (Sep 10).
   *
   * "Where am I" is a question the nav is asked all day and the breadcrumb was
   * answering alone. The trail rather than the leaf because the leaf is
   * invisible whenever its row lives behind a shut panel, which is most of the
   * time — a mark you cannot see is the same as no mark for the case it was
   * added for. Off and leaf are both one click away in the panel.
   */
  selectedState: "ends",
  // The fill: the one treatment that survives a row also being hovered, now
  // that the selected grey is a real step off the hover grey.
  selectedMark: "fill",
  // Opening the page too. A first click that lands nowhere is the thing this
  // answers; "Expands only" is the original, one click away for the comparison.
  l2ClickAction: "open-first",
  // Merged, per the Aug 28 walkthrough: one list with pins at its top and no
  // separate pinned bar. The other three arrangements stay one click away.
  recentsMode: "merged",
  /*
   * The merge's defaults are the recommendation, not a neutral position: the
   * capsule goes, the block never folds, pins wear a glyph and a rule, rows
   * carry their breadcrumb, and a new pin stays where the row already was.
   * Every one of them is one click from its alternatives.
   */
  mergedPinScope: "capsule-off",
  mergedPinMark: "glyph",
  // Hard cap and "Recents" settled on Aug 28: the block holds a fixed number of
  // rows rather than growing, and it is named after what is actually in it.
  mergedOverflow: "cap",
  /*
   * The name alone (Aug 28). The breadcrumb under every row roughly doubled the
   * block's height to answer a question the labels mostly answer themselves —
   * and it is the pinned L3s with colliding names that need it, which the
   * qualified label ("Opportunities › Settings") now handles on its own. The
   * second line is one click away for the cases it does not.
   */
  mergedRowDetail: "name",
  // Stored order: a new pin stays where the row already was instead of jumping
  // to the top. See MERGED_PIN_ORDERS.
  mergedPinOrder: "arranged",
  mergedHeading: "recents",
  /*
   * Off in the merged panel.
   *
   * The panel is a pin list plus a bounded history — a set you already know,
   * short enough to read. A field over it promises a corpus it does not hold:
   * the thing you would type a product name into is the catalogue, which is a
   * different panel one section down. Better to have no field than one whose
   * scope you have to learn.
   *
   * The axis stays, so "on" is one click away in the prototype controls.
   */
  mergedPanelSearch: false,
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
  /*
   * Five and zero (Aug 28), which is the pin limit and no reserved recents.
   *
   * The pair used to be 3 and 2, holding two history rows back from a pinned
   * run that could grow forever. With pinning capped at five — see PIN_LIMIT —
   * the run cannot crowd anything out that the cap does not already allow: pin
   * all five and the block is your five, pin fewer and the rest is history.
   * Reserving a floor on top of that would mean hiding a pin you set to make
   * room for a page you happened to open.
   */
  mergedPinCap: 5,
  mergedRecentFloor: 0,
  mergedExpandedRows: 12,
  autoCollapse: true,
  // Activated accounts don't see the setup guide; Brightpath (the trial
  // account) carries it as a per-account override.
  launchpad: false,
  /*
   * Outline, not the brand-filled original.
   *
   * The card sits above a product list it is not part of, and at full strength
   * it was the loudest thing on screen for as long as onboarding took. A
   * neutral hairline makes it a container rather than a highlight, and leaves
   * the only brand in it to the meter — which is the part that is actually
   * status. "Full brand" is one click away, at the end of the list.
   */
  launchpadCard: "outline",
  // The rail is the recommendation, so the prototype opens on it. Model A is
  // one click away for the comparison.
  scopeModel: "rail",
  // The proposal, obviously. `legacy` is the control group, not the default.
  navGeneration: "new",
  // The modal. Picking a navigation is a decision about the whole workspace,
  // and the menu could describe the two without ever showing them.
  navSwitchSurface: "modal",
  templatePropagation: "managed",
  /*
   * Off, now that the switch has a control of its own.
   *
   * The row was in this menu because there was nowhere else for it to be, and
   * it was always the odd one out: everything else in here adjusts the nav you
   * have, and that one replaces it. With Switch nav standing beside Edit nav —
   * outside the mode, and outside the plan gate that made the row unreachable
   * on Starter — keeping it here as well would be the same journey offered
   * twice, one of them three levels deep.
   *
   * The axis stays so the buried version can still be looked at.
   */
  navSwitchInEditCard: false,
  // The icon, not the panel: one click for the decision people actually repeat.
  // The two-button version is the proposal: one destructive moment, one
  // sentence, two answers. The template-saving version is one click away.
  // The real thing by default: the page is a transcription of a screenshot, so
  // it opens looking like the screenshot. The tokened version is one click away.
  // "Recently visited": names the section by what put a row in it — you went
  // there — rather than repeating the panel's own title one line above.
  pinMarkColour: "grey",
  // Slide into place (Sep 17): the quieter of the two that actually move
  // something. It only reads when the destination is on screen — the flight is
  // the answer for pinning from a panel that covers the nav.
  pinFeedback: "settle",
  // The fill, which is what ships. Outline is one click away.
  aiButtonStyle: "gradient",
  // Nothing (Sep 10): production's sidebar has no such control, and putting one
  // there makes the control group a slightly different product.
  legacyFootControl: "off",
  navSwitchButton: NAV_SWITCH_BUTTON_DEFAULT,
  agencyEditNav: AGENCY_EDIT_NAV_DEFAULT,
  // Cascading panels: the pattern the nav already taught.
  panelRecentHeading: "visited",
  inboxPalette: "product",
  pageTitle: true,
  pageDescription: true,
  pageCount: true,
  pageHeader: true,
  stickyDashboardBar: true,
  navArrangement: "flyout",
  /*
   * The hamburger, per Ashwin's Sep 30 correction.
   *
   * The named row with a caret was the default and it made two wrong
   * promises at once: a caret says the list drops open underneath, and the
   * row read as a heading for the products below it rather than as a way
   * out of them. GCP's control is a hamburger, and a hamburger is the one
   * glyph that means "everything" without implying where it will appear.
   */
  scopedSwitch: "hamburger",
  navTreeCounts: false,
  treeIcons: "all",
  treeRecentsAllProducts: false,
  treeSearchPlace: "launchpad",
  crumbEmphasis: "off",
  crumbScale: "default",
  crumbIcons: "home",
  crumbCollapse: "off",
  crumbStart: "group",
  crumbShown: true,
  crumbHome: false,
  crumbSwitchers: "all",
  crumbLeaf: "title",
  // Replace, so the default trail does not grow a level the moment anyone
  // opens a folder. Beside is one click away for the comparison.
  folderCrumb: "replace",
  // Inside the table by default (Sep 30): the folder path lives with the
  // thing being browsed, and the app bar's trail stops at Workflows.
  tableCrumb: "inside",
  crumbDepth: "full",
  recordKeepsFolder: true,
  crumbSeparator: "chevron",
  crumbCompoundChild: false,
  recordCrumbLabel: "name",
  recordCrumbShown: true,
  deepInlineCrumb: false,
  recordBackButton: true,
  recordBackPlace: "inline",
  listHeaderVariant: "L-D",
  listShowViews: true,
  listShowFilters: true,
  listToolbar: "page",
  pageCanvas: false,
  pageCanvasColumns: true,
  recordHeaderVariant: "D-B",
  calendarViewSwitch: "tabs",
  /*
   * Neither retained (Sep 23). The research argued for keeping the nav — a
   * builder session is minutes long inside a much longer CRM session — and the
   * canvas argued back: every pixel of chrome is drawing area, and the tools
   * that matter are the builder's own, not the platform's. Both readings are
   * still one switch away; this is which one the prototype opens on.
   */
  builderKeepSidebar: false,
  builderKeepTopBar: false,
  builderControls: "crumb-row",
  builderExit: "back",
  builderCanvas: "standard",
  builderKeepBanner: false,
  builderChromeStyle: "rows",
  builderToolPalette: false,
  panelHeaderVariant: "P-B",
  deepHeaderVariant: "X-2",
  barPageHeading: false,
  barHeadingScale: "compact",
  layoutReplaceDialog: "simple",
  // The rail: one mechanism for both audiences beats a second one to learn.
  subAccountSwitcher: "rail",
  // Hidden (Sep 16). The pill on the product still says what launched; the
  // nav does not also tap you on the shoulder about it every time you look at
  // it. Both placements stay one click away in the panel.
  newDotPlacement: "hidden",
  // On, so the case this exists for is what you see first.
  userMultiAccount: true,
  navColourControl: "toggle",
  /*
   * Off (Sep 10): the sidebar row is gone and the catalogue comes back into the
   * View all panel — not stacked under the history as it was before the split,
   * but behind a switcher beside it, each half with its own search. The row was
   * a standing seat in the nav spent on a destination almost nobody goes to
   * twice; the tree it opened was worth keeping, the row was not.
   *
   * On restores the split: a standing row above Settings, and a View all that
   * holds only Pinned and Recent.
   */
  productDirectoryRow: false,
  /*
   * Tabs on top (Sep 16).
   *
   * Pinned-above-tabs held the pin list out of the choice, on the argument
   * that it is the shortest list and the reason most people open the panel.
   * The cost was three levels of hierarchy in a 320px column — unswitched
   * content, then a switcher, then the content it switches — and the pins
   * read as a section the tabs were about to replace. With the switcher at
   * the top the panel is a title, a choice, a query and a list, and the pins
   * lead the visited run as pinned rows rather than as a block of their own.
   */
  recentsPanelLayout: "tabs-top",
  // Everything in the middle (Sep 16): one rule, no exceptions to learn.
  templateMessagePlacement: "centred",
  templateDeleteMode: "unlink",
  templatePushNotice: false,
  templateMenuShape: "list-first",
  templateSeed: "default-only",
  templateSaveShape: "unified",
  // On each row (Sep 16). The picker carrying its own library controls is the
  // shorter path; "Manage" is the alternative, one switch away.
  templateActionHome: "on-row",
  templateConflict: "resolve",
  /*
   * One template each (Sep 17), and the axis the whole templates feature now
   * hangs off. A sub-account is on the default or on one named template, and
   * nothing else — see LAYOUT_MODELS for why the alternative was rejected
   * rather than merely not chosen. `local-edits` is what was built before it
   * and is kept as the thing to compare against.
   */
  layoutModel: "one-template",
  templateSaasPlans: true,
  templateNewProductMark: true,
  // Off: the dialogs carry the count, and an undo behind a dialog is a reason
  // to skim the dialog. See ThemeState.
  templateUndo: false,
  // Off: the list starts at one row, which is where a real agency starts.
  templateAccountSpread: false,
  // On: which template you are about to change is the fact that decides
  // whether the next keystroke is safe.
  editCardTemplateName: true,
  // Each answer carries its own consequence, rather than both consequences
  // stacking under the pair.
  templateSaveLayout: "accordion",
  // On, for the same reason: the comparison should be one menu away.
  // Off (Sep 15). "My layout vs HighLevel default" was a second, parallel way
  // to say what a template says — and the shipped arrangement is now a row in
  // the template list, where it can be compared with the rest instead of
  // living in a drill of its own. See DEFAULT_TEMPLATE_ID.
  layoutSwitchInEditCard: false,
  // Production's own default, and the state both source screenshots were in.
  legacyNavTheme: "dark",
  // Off: the proposal's own answer. The toggle is how you argue with it.
  tabsInNav: false,
  navSections: "plain",
  // Fully rounded, which is the proposal. The squircle the rail shipped with is
  // one click away for the comparison.
  railTileShape: "pill",
  // Today's behaviour, so the rail opens as the thing being argued with rather
  // than as the proposal. Both answers are one click away.
  // Pinned + recent (Aug 29): the rail keeps its arrangement AND answers the
  // tenth-account problem, which is the complaint the axis exists for.
  railRecents: "recent",
  /*
   * Under the agency plate.
   *
   * The tail is where it shipped, and it is the one placement that cannot be
   * learned: the tile column floats in the strip's vertical centre, so the way
   * into search moves whenever the open set changes length. The plate is the
   * strip's only fixed point. "Below the accounts" is one click away.
   */
  railDirectorySpot: "top",
  /*
   * The rail's three answers to "which account am I in", all on (Aug 28).
   *
   * Size marks the active tile, the edge bar is retired to a switch, and
   * magnification hands the size back to whichever tile you point at — which is
   * what keeps a 24px tenant logo readable now that the active one is bigger.
   */
  // The dim, per the Aug 28 review: the surround carries the mode and the nav
  // needs no outline of its own. Border is one click away for the comparison.
  editTreatment: "dim",
  // The tooltip, per Ashwin on Sep 28 — having seen the pencil, he wanted the
  // quieter one as the default and the icon kept for comparison.
  renameAffordance: "tooltip",
  railSizing: "active",
  railActiveBar: false,
  railMagnify: true,
  // Contained. A tile that breaks its own pill on hover is a bug wearing an
  // animation; "Over the row" keeps the shipped behaviour for the comparison.
  railZoomFit: "contain",
  // Back to the bar on the plane (Aug 28). The joined card is one click away;
  // this is the arrangement the review opens on.
  pageShell: "plane",
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
