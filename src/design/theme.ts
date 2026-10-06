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
 *         needs a title to attach to, so it falls back to the full word when
 *         the page header has none to give.
 *  none   Nothing at the end of the line, on every page and at every depth.
 *         The trail stops at the parent, the page names itself, and the
 *         sideways move goes with the segment.
 *
 * WHY `none` IS BACK (Sep 30), having left for `crumbDepth` the day before.
 * The two are not the same option and the split was the mistake. `crumbDepth`
 * trims the ARRAY and refuses to cut below two segments — a sound floor for a
 * control about path length, since one word is a label rather than a path.
 * But that floor is exactly what made "no last crumb" unreachable on the
 * pages that most wanted it: a listing page's trail IS two segments, so
 * "Drop the last" silently did nothing there and the option looked broken.
 * This one is about the LEAF, so it has no floor to respect: it drops the end
 * of the line wherever the line ends, which is what was asked for. Keep both
 * — depth shortens a long path, this removes a redundant name.
 */
export type CrumbLeaf = "full" | "caret" | "dots" | "title" | "none";
export const CRUMB_LEAVES: readonly CrumbLeaf[] = [
  "full",
  "caret",
  "dots",
  "title",
  "none",
];
export const CRUMB_LEAF_LABELS: Record<CrumbLeaf, string> = {
  full: "Word and caret",
  caret: "Caret only",
  dots: "Three dots",
  title: "On the page title",
  none: "No last crumb",
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

/**
 * Which crumbs carry a dropdown.
 *
 *  all        Every segment, the leaf included. A rank of carets down the
 *             row, which is what makes it read as a toolbar rather than a
 *             path.
 *  ancestors  Every crumb EXCEPT the last. The mirror of `leaf`, and the
 *             reading that follows from the crumb being two controls now
 *             (see `CrumbMenu`): an ancestor is a level you are passing
 *             through, so its siblings are a real sideways move, while the
 *             leaf is the page under your feet and its menu is the one
 *             offering to take you somewhere you did not ask to go. It also
 *             leaves the end of the trail as a plain name, which is what the
 *             page header is already saying.
 *  leaf       Only the last. The ancestors are levels the nav can already
 *             reach, so they go back to being words you click; the leaf's
 *             menu is the sideways move with no other home.
 *  off        Plain text. The trail states where you are and nothing more.
 */
export type CrumbSwitchers = "all" | "ancestors" | "leaf" | "off";
export const CRUMB_SWITCHER_MODES: readonly CrumbSwitchers[] = [
  "all",
  "ancestors",
  "leaf",
  "off",
];
export const CRUMB_SWITCHER_LABELS: Record<CrumbSwitchers, string> = {
  all: "Every crumb",
  ancestors: "All but the last",
  leaf: "Last only",
  off: "None",
};

/**
 * What a crumb does when you press it.
 *
 *  split  The word navigates and the caret opens the siblings — two controls
 *         inside one box, each with its own hover chip. Pressing "Contacts"
 *         lands on Contacts's first page; pressing the arrow beside it lists
 *         the other products. This is the default because it is the one
 *         reading under which a breadcrumb does the job breadcrumbs exist
 *         for: walking back up a path. Under the other, that gesture does
 *         not exist anywhere in the trail.
 *  whole  The whole crumb is the dropdown, word and caret together — what
 *         this shipped with. Nothing in the trail navigates; every press
 *         opens a menu, and you move by choosing from it. The argument for
 *         it is that one crumb is one target, so there is no aiming and no
 *         explaining which half does what; the argument against is that the
 *         trail is then a rank of menus wearing a path's clothes.
 *
 * Kept as an axis rather than settled because the two are genuinely worth
 * demonstrating side by side — Ashwin, Oct 1. The gap between the word and
 * the caret is the same under both, so the only difference a reviewer sees
 * is the behaviour.
 */
export type CrumbTrigger = "split" | "whole";
export const CRUMB_TRIGGERS: readonly CrumbTrigger[] = ["split", "whole"];
export const CRUMB_TRIGGER_LABELS: Record<CrumbTrigger, string> = {
  split: "Word goes, caret opens",
  whole: "Whole crumb opens it",
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
 * The same question one scope down, and it only became a question on Sep 30.
 *
 * `AGENCY_NAV_MARK_DEFAULT` above says a sub-account is left alone because
 * "nothing above them repeats anything". That was true while the rail was the
 * agency's. It is not true for a member of several accounts: `memberRail`
 * gives that person the same 56px column, their own account's tile is on it,
 * and the nav header beside it draws the same logo again — the identical
 * within-60px repetition the agency axis exists to remove.
 *
 * Read ONLY while that rail is up. A member of one account has no rail, so
 * their header mark is the only identity on screen and hiding it would leave
 * the nav anonymous — which is the whole reason this is a separate axis rather
 * than `agencyNavMark` widened to both scopes.
 *
 * Off by default, matching the agency: one identity stated once.
 */
export const SUB_ACCOUNT_NAV_MARK_DEFAULT = false;

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
/*
 * On, as of Oct 1.
 *
 * It was off because it was the proposal and the floating card was what
 * shipped. Enough now hangs off it — the seam, the panel shapes, the
 * directory's edges, the edit button's stroke, the L1 drawer — that a review
 * opening with it off opens on the arrangement none of those were designed
 * for, and every one of them has to be switched on by hand before it can be
 * looked at. The card is one click away.
 */
export const NAV_ON_PLANE_DEFAULT = true;

/**
 * A hairline on the hovered and selected rows, while the nav is on the plane.
 *
 * Off the plane this would be noise and the token resolves to `transparent`:
 * a white nav gives gray-100 and gray-200 fills two unmistakable steps of
 * contrast, and an edge on top of them is a second signal for a state that
 * already has one. On the plane there is no such room — the ground IS grey, so
 * the fills have gone white-on-near-white and the difference between "my
 * pointer is here" and "this is the page I am on" is a few points of
 * lightness. The ring is what carries it, two steps apart to match the two
 * fills: gray-200 selected, gray-100 hovered.
 *
 * An axis rather than a fact because it is the smaller half of a decision
 * still open — the other half is the plane's grey itself, and an edge is one
 * answer to a dim row where a darker ground is the other. Being able to put
 * them side by side is the point.
 *
 * ON by default, Oct 1 — it was briefly off while the plane's grey was the
 * open question, and the pair settled it: an edge and the lift below read as
 * one treatment, and the row is legible on gray-50 without having to darken
 * the whole plane to get there. Switch either off to see the ground do the
 * work alone.
 *
 * Plane-only by construction: the attribute that turns the tokens on is set
 * only when `navOnPlane` is also on, so this cannot paint rings onto the
 * floating card by being left switched on.
 */
export const NAV_ROW_RING_DEFAULT = true;

/**
 * A drop shadow under the selected row, while the nav is on the plane.
 *
 * The sibling of NAV_ROW_RING_DEFAULT and the third answer to the same
 * question: on a grey plane the selected row's white fill is only a few points
 * from its ground, and it needs help. The ring draws the row's EDGE; this
 * raises the row off the ground instead. They are independent switches because
 * the two can be judged against each other and because both at once is a real
 * arrangement — an outlined card is a thing — even if it is probably one
 * signal too many.
 *
 * Selected only, never hover. A shadow says "this is lifted", which is a claim
 * about what a thing IS; hover is a claim about where your pointer is, and a
 * row that rises and falls as the pointer crosses it is a nav that twitches.
 *
 * The Launchpad card's lift by reference — see --nav-raise-shadow — which is
 * shadow/xs and no larger. Plane-only by construction, like the ring, and dark
 * navs opt out in CSS because a shadow on the darkest surface on screen reads
 * as grime rather than as height.
 *
 * OFF by default as of Oct 6, with the ring left on. The pair was on together
 * for five days and the edge turned out to be doing the work: once a row has a
 * hairline it is already a distinct object, and the lift underneath it is a
 * second answer to a question the first one closed. It also now has further to
 * reach — the account directory's current row wears this same treatment, so
 * what was one lifted row in a column is a lifted row on every surface that
 * marks one.
 */
export const NAV_ROW_SHADOW_DEFAULT = false;

/**
 * What colour the selected row is filled with.
 *
 * Everything up to here has treated "selected" as a LIGHTER step — gray-200 on
 * a white nav, white on the plane — and given it an edge and a lift once the
 * steps ran out of contrast. This axis asks the opposite question: make the
 * selected row the DARKEST thing in the column rather than the brightest, and
 * the contrast problem stops being a problem rather than being compensated
 * for. Both are defensible and they look nothing alike, which is why they are
 * worth seeing side by side.
 *
 *  default    As declared. White on the plane, gray-200 off it, with whatever
 *             edge and lift the two switches above are set to.
 *  gray-400   A mid grey, and the last step that keeps DARK ink — white on
 *             gray-400 is 2.2:1 and fails outright. The quietest way to make
 *             the row darker than its neighbours.
 *  gray-500   The first step that is properly a dark surface: white ink,
 *             still unmistakably grey, still carrying no hue of its own.
 *  dark       gray-800. The row becomes a near-black plate — the treatment
 *             macOS and VS Code use for the same job.
 *  blue-grey  gray-blue 700. The dark plate with enough hue to belong to a
 *             blue product. The middle of the two arguments.
 *  blue       The accent itself, the loudest of the six, and the one that
 *             makes "where I am" the same colour as every primary button on
 *             the page — which is either the clearest signal in the nav or
 *             one brand surface too many.
 *
 * Gray 200 and Gray 300 (Oct 5) are the other half of the question. The five
 * above ask whether the mark should be a dark OBJECT; these ask whether it
 * should be a recess — on the plane the selected row is white, lifted off a
 * grey ground, and a light grey fill is the same row pressed into it instead.
 * Both read as "here"; one comes forward and one recedes.
 *
 * Light navs only, by construction. On a dark nav the selected row is already
 * a lighter step of its ground and a dark fill would vanish into it.
 *
 * The dark five carry their own ink; the two light steps keep the nav's. All
 * of them drop the hairline: see the [data-nav-sel] blocks in tokens.css,
 * where the reasoning per colour lives next to the values.
 */
/**
 * How wide the two nav columns are.
 *
 * The pair moves together on purpose. The L1 and the L2 are read as one
 * object — the panel docks on the column's edge and the two share a seam —
 * so narrowing one alone changes the proportion between them rather than the
 * size of the thing, and the proportion is not what is being asked about.
 *
 *  default  272 / 360. What left-nav.pen drew and what every spacing decision
 *           in this prototype was made inside.
 *  narrow   240 / 300. 32px and 60px back to the canvas, which is the whole
 *           argument: at 1440 the chrome is giving up a tenth of the window
 *           before the page has drawn anything. 240 is the width most product
 *           navs land on, and 300 still holds a two-line L2 row.
 *  even     264 / 264. The one set where the two columns are the SAME width,
 *           which is a different proposition rather than a third point on the
 *           same line: the panel stops reading as a wider thing the column
 *           opened and starts reading as a second column of equal standing.
 *           Costs the L2 96px against the default — the rows truncate sooner,
 *           and that is the thing to look at. Ashwin, Oct 6.
 *
 * Both numbers are published as CSS custom properties as well as JS, because
 * the two columns are measured in both places: the shell positions the panel
 * against the column arithmetically, and the panel sets its own width in CSS.
 * One source, two readers — see --nav-w and --fly-w.
 */
export const NAV_WIDTH_SETS = ["default", "narrow", "even"] as const;

export type NavWidthSet = (typeof NAV_WIDTH_SETS)[number];

export const NAV_WIDTH_SET_LABELS: Record<NavWidthSet, string> = {
  default: "272 / 360",
  narrow: "240 / 300",
  even: "264 / 264",
};

/**
 * Whether edit mode borrows the wider pair.
 *
 * Only the narrow set has anything to gain. Edit mode is the one state that
 * ADDS to a row rather than rearranging it — a six-dot grip on the left, a
 * kebab on the right, a pin and a shortcut cap between them — and those four
 * come out of the label's width, not out of the margins. At 272 the row
 * absorbs them; at 240 the names start truncating at the exact moment the
 * task is reading names to reorder them.
 *
 * So the column widens for the duration and goes back. The alternative is
 * either a narrow nav that is bad to edit or a wide nav that is wide all day
 * for the sake of a mode most people enter twice, and the width is already
 * animated — collapse does the same thing in the other direction, so the
 * motion is the one the nav already has rather than a new one invented for
 * this.
 *
 * Both columns move together, as everywhere else: the L2 is where the
 * reordering happens, so widening the L1 alone would leave the crowded half
 * crowded.
 *
 * On by default. The option exists to see the narrow nav edited at its own
 * width — which is the honest test of whether 240 is wide enough — not
 * because widening is in doubt.
 */
export const EDIT_WIDTH_FULL_DEFAULT = true;

/**
 * Whether the collapsed rail keeps a door into All accounts.
 *
 * The waffle sits under the expand toggle whenever the account rail itself has
 * stood down, so the way into the directory does not move depending on which
 * arrangement is up. That is the argument for having it. The argument against
 * is what it costs in a 64px strip: the collapsed face is a list of PLACES in
 * this account, and one glyph in it changes which account you are in at all.
 * It is the only control there that leaves, and at 16px with no label it is
 * indistinguishable in weight from the twelve products under it.
 *
 * OFF by default, Oct 5. Switching accounts is a deliberate act and the
 * collapsed rail is a glanceable one; expanding first is a fair price, and it
 * is one keystroke. The strip keeps the expand toggle, which is the door to
 * the door.
 *
 * Only ever asked when the account rail is absent — with the rail up it is
 * already the accounts door, and this would be the second of two.
 */
export const RAIL_ACCOUNTS_DOOR_DEFAULT = false;

/**
 * Whether an account row carries its address under the name.
 *
 * The directory is a list you SCAN — seventeen rows, and the question being
 * asked of it is "which one is Fieldstone". The address answers a different
 * question, and it answers it on every row at once: it doubles each row's
 * height, so half as much of the directory is on screen, and it puts a second
 * line of grey text under every name the eye is trying to run down.
 *
 * It earns its place in the one case the name does not settle — two accounts
 * with the same or nearly the same name, where the street is the only thing
 * telling them apart. That is a real case and it is why this is an axis rather
 * than a deletion.
 *
 * OFF by default, Oct 5. A list optimised for the common scan, with the
 * disambiguator available for the demo where it matters.
 *
 * Both panels, deliberately: the hover directory and the click-through one are
 * two arrangements of one list, and a row that is two lines tall in one and
 * one line tall in the other is two designs of the same row.
 */
export const ACCOUNT_ROW_META_DEFAULT = false;

/**
 * How the accounts directory offers its way out.
 *
 * close  A ✕ at the far right. What the panel shipped with, and what every
 *        other dismissable surface in this shell wears — it says "this closes
 *        and you are where you were".
 * back   A ◀ at the far left, ahead of the title. It says something
 *        different: that the directory is a PLACE you stepped into and the
 *        arrow is the step back out. Which is truer depends on how the panel
 *        is reached — summoned over the nav it is an overlay, but filling the
 *        sidebar it is the whole left column and ✕ on a full column reads as
 *        closing the nav itself.
 *
 * The pair are exclusive on purpose. Two exits on one 340px header is the
 * thing that made the select state truncate, and a panel with a back arrow
 * AND a close asks the reader which kind of leaving they meant.
 */
export const DIRECTORY_EXITS = ["close", "back"] as const;

export type DirectoryExit = (typeof DIRECTORY_EXITS)[number];

export const DIRECTORY_EXIT_LABELS: Record<DirectoryExit, string> = {
  close: "Close, right",
  back: "Back, left",
};

/** L1 column and L2 panel, in px. See NAV_WIDTH_SETS. */
export const NAV_WIDTHS: Record<NavWidthSet, { l1: number; l2: number }> = {
  default: { l1: 272, l2: 360 },
  narrow: { l1: 240, l2: 300 },
  even: { l1: 264, l2: 264 },
};

/**
 * The pair in force right now, which is not always the one the axis names.
 *
 * Two surfaces resolve this independently — the shell, which positions the
 * panel against the column, and the portalled L1 drawer, which inherits
 * nothing and has to publish the properties itself — so the rule lives here
 * rather than being written out twice and drifting the first time one of them
 * is edited.
 */
export function navWidthsFor(
  set: NavWidthSet,
  editing: boolean,
  editWidthFull: boolean,
): { l1: number; l2: number } {
  /*
   * Only `narrow` ever borrows the wider pair.
   *
   * The switch exists because edit mode ADDS to a row — grip, kebab, pin,
   * shortcut cap — and at 240 those four come out of the label just as you
   * start reading labels to reorder them. At 264 the row still absorbs them,
   * and Ashwin asked on Oct 6 for `even` to hold its width in edit mode: the
   * point of a column the same width as its panel is lost if entering the one
   * mode that rearranges it springs the column 8px wider and the panel 96.
   */
  return NAV_WIDTHS[editing && editWidthFull && set === "narrow" ? "default" : set];
}

export const NAV_SELECTED_FILLS = [
  "default",
  "gray-200",
  "gray-300",
  "gray-400",
  "gray-500",
  "dark",
  "blue-gray",
  "blue",
] as const;

export type NavSelectedFill = (typeof NAV_SELECTED_FILLS)[number];

export const NAV_SELECTED_FILL_LABELS: Record<NavSelectedFill, string> = {
  default: "Default",
  "gray-200": "Gray 200",
  "gray-300": "Gray 300",
  "gray-400": "Gray 400",
  "gray-500": "Gray 500",
  dark: "Dark",
  "blue-gray": "Blue grey",
  blue: "Accent",
};

/**
 * The grey the plane is painted in.
 *
 * The other half of the row-state question — see NAV_ROW_RING_DEFAULT. Once the
 * nav sits on the plane with no card of its own, every state in it is read
 * against this one colour: white rows on gray-50 are a few points apart, and
 * the fix is either an edge on the row or a ground that stands further back.
 * This axis is the second of those, so the two can be tried against each other
 * rather than argued about.
 *
 * All fourteen are HighRise ramp steps (highrise.gohighlevel.com/components/colors),
 * which is the whole point: the answer has to be a colour the design system
 * already has, or it is a swatch this prototype invented and nobody can ship.
 * They fall into three families worth naming, because the choice between them
 * is a choice about what the chrome is made of:
 *
 *  Primary 25/50   The brand hue at its faintest. The nav reads as part of the
 *                  product rather than as a neutral frame around it, and white
 *                  rows lift off it further than off any grey at the same
 *                  lightness — blue behind white is a hue difference as well as
 *                  a lightness one.
 *  Gray blue /     Cool neutrals. Blue, cool and modern each carry a little
 *  cool / modern   blue; they hold the brand's temperature without claiming to
 *                  be the brand, which is what most product chrome wants.
 *  Gray neutral /  Flat and warm. Neutral is the true grey; warm leans brown and
 *  warm            is the only family here that puts the chrome at a different
 *                  temperature from the blue in it.
 *
 * The 100s and 200s are offered beside the 50s deliberately. A 200 is a long
 * way down from white — it stops being a tint and becomes a surface — and the
 * question of whether chrome should be a surface is exactly what the plane
 * arrangement opened.
 *
 * `default` means the token as declared, which is `--hr-gray-50` and, with a
 * brand tint on, the tinted derivation of it. Picking anything else sets the
 * colour literally and takes it out of the tint's hands.
 */
export const PLANE_GROUNDS = [
  "default",
  "primary-25",
  "primary-50",
  "gray-blue-50",
  "gray-blue-100",
  "gray-blue-200",
  "gray-cool-50",
  "gray-cool-100",
  "gray-cool-200",
  "gray-modern-100",
  "gray-modern-200",
  "gray-neutral-100",
  "gray-neutral-200",
  "gray-warm-100",
  "gray-warm-200",
] as const;

export type PlaneGround = (typeof PLANE_GROUNDS)[number];

export const PLANE_GROUND_LABELS: Record<PlaneGround, string> = {
  default: "Default",
  "primary-25": "Primary 25",
  "primary-50": "Primary 50",
  "gray-blue-50": "Blue 50",
  "gray-blue-100": "Blue 100",
  "gray-blue-200": "Blue 200",
  "gray-cool-50": "Cool 50",
  "gray-cool-100": "Cool 100",
  "gray-cool-200": "Cool 200",
  "gray-modern-100": "Modern 100",
  "gray-modern-200": "Modern 200",
  "gray-neutral-100": "Neutral 100",
  "gray-neutral-200": "Neutral 200",
  "gray-warm-100": "Warm 100",
  "gray-warm-200": "Warm 200",
};

/**
 * The hex behind each, straight from the HighRise ramps.
 *
 * Literals rather than tokens because most of these ramps are not in this
 * prototype's token file — it carries one grey ramp, and these are six. Copying
 * the published values in is the honest version of "try the design system's
 * greys"; deriving near-misses in oklch would be trying something else.
 *
 * `default` is absent on purpose: it means "do not set the property", which is
 * what lets the declared token and the brand tint keep doing their work.
 */
export const PLANE_GROUND_HEX: Partial<Record<PlaneGround, string>> = {
  "primary-25": "#F5F8FF",
  "primary-50": "#EFF4FF",
  "gray-blue-50": "#F8F9FC",
  "gray-blue-100": "#EAECF5",
  "gray-blue-200": "#D5D9EB",
  "gray-cool-50": "#F9F9FB",
  "gray-cool-100": "#F0F1F5",
  "gray-cool-200": "#DCDFEA",
  "gray-modern-100": "#EEF2F6",
  "gray-modern-200": "#E3E8EF",
  "gray-neutral-100": "#F3F4F6",
  "gray-neutral-200": "#E5E7EB",
  "gray-warm-100": "#F5F5F4",
  "gray-warm-200": "#E7E5E4",
};

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
 *
 * ON by default (Sep 30). Off, entering edit mode left the pinned block
 * looking like the only part of the nav you are not allowed to touch — every
 * row below it grew a grip and a kebab while the pins sat inert, which reads
 * as an omission rather than as a decision. Pins are the rows people
 * rearrange most, so edit mode reaching them is the unsurprising answer; the
 * axis stays because "should a pin be renameable at all" is still a fair
 * question to put in front of a reviewer.
 */
export const PINNED_ROW_EDIT_DEFAULT = true;

/**
 * Whether pinned rows answer to a keyboard shortcut.
 *
 * ⌃⌥1 for the first pin, ⌃⌥2 for the second, up to ⌃⌥5 — the pin cap, so that
 * is every default there can be. The key belongs to the POSITION and not to
 * the row, so moving a pin to the top makes it the one ⌃⌥1 opens, and an
 * account has working shortcuts without anyone opening a settings screen. See `pin-shortcuts.tsx` for the
 * resolution rule, why ⌃⌥ and not ⌘⇧, and why bindings live outside the
 * layout store.
 *
 * The cap shows on hover and nowhere else. A pinned run wearing five
 * permanent keycaps is a nav advertising its own settings; the shortcut is for
 * someone who knows it already, and the chip is for the moment they have
 * forgotten. Same reasoning, and the same treatment, as the ⌘K cap in search.
 *
 * ON by default (Sep 30). Off, the first thing anyone reviewing the pinned run
 * saw was a block with no keys in it — which is a fair picture of a nav
 * nobody has configured and a poor one of the feature, since the whole claim
 * here is that the defaults arrive already working. There is nothing to opt
 * into: five pins, five keys, counted off the order.
 */
export const PINNED_SHORTCUTS_DEFAULT = true;

/**
 * What the nav's top edge lines up with, on the plane. Plane variant only.
 *
 * The identity row is already built to centre on the app bar's midline —
 * 9 + 30 + 9 = 48, the bar's own height, so mark, name, collapse glyph,
 * breadcrumb and header icons sit on one line across the top of the screen.
 * That arithmetic assumed both columns started at the same y, which is true
 * off the plane: the nav card and the page column each take the 4px canvas
 * gap at the top. On the plane the nav card goes away and takes its margin
 * with it, while the page column keeps its own — so the whole sidebar rode
 * 4px high and the row it was built to align with sat 4px low.
 *
 *  bar  The nav takes the same top inset the page column does, so the two
 *       midlines meet again. The default from Oct 5, and really a bug fix
 *       wearing an axis: nothing about the plane variant wanted the sidebar
 *       misaligned, it just inherited the gap from a card that no longer
 *       exists. Everything docked against the nav moves with it: the account
 *       rail, the L2 flyout and the recents panel. None of them is a column
 *       — the rail is an overlay and the two panels are positioned against
 *       the shell — so each takes the inset through a rule or a number of
 *       its own rather than inheriting the column's padding.
 *
 * Bare plane only. With `flyoutShape: "card"` the nav is a card again and
 * brings back its own margin, so the inset is already there.
 *  top  The nav starts at the window's top edge, 4px above the canvas. What
 *       the plane variant has been doing.
 */
export type PlaneHead = "bar" | "top";
export const PLANE_HEADS: readonly PlaneHead[] = ["bar", "top"];
export const PLANE_HEAD_LABELS: Record<PlaneHead, string> = {
  bar: "Level with the breadcrumb",
  top: "Flush to the window",
};

/**
 * Where the plane shows between the nav and the canvas. Plane variant only.
 *
 *  flush  One edge. The whole right-hand column — app bar, banner slot and
 *         page — takes a single canvas gap from the nav, and the canvas
 *         gives up its own left margin so the breadcrumb row and the page
 *         surface start at the same x. The radius is untouched: the card
 *         keeps its shape and only moves. The default from Oct 5, and the
 *         reading the plane arrangement was always arguing for — with no
 *         nav card, the bar sat hard against the sidebar while the canvas
 *         stood 4px off it, so the two surfaces on the right disagreed
 *         about where the right-hand side began.
 *  gap    The canvas keeps its own inset on all four sides and the column
 *         takes none, so the plane runs behind and around the page while the
 *         bar still reaches the sidebar. What this did before the axis
 *         existed, kept as the comparison.
 *
 * Nothing changes on the other three sides under either value: the canvas is
 * still inset from the window top, right and bottom. This is only the seam
 * the sidebar is on.
 *
 * The joined arrangement (`barInCanvas`) is already this: one card holding
 * bar and page, inset on all four sides. It is left alone.
 */
export type PlaneSeam = "flush" | "gap";
export const PLANE_SEAMS: readonly PlaneSeam[] = ["flush", "gap"];
export const PLANE_SEAM_LABELS: Record<PlaneSeam, string> = {
  flush: "Canvas meets the nav",
  gap: "Plane shows between",
};

/**
 * How the promo banner meets the window.
 *
 *  flush  Edge to edge and square — no side margins, no radius, no gap above.
 *         The default from Oct 5. A banner is the platform talking over the
 *         top of the app, and the thing that says so is that it owns the
 *         full width: it is not part of the workspace, it is sitting on it.
 *         It is also the only treatment that costs the page nothing but the
 *         strip's own height.
 *  card   Inset to the shell gap and rounded to the shell radius, so the
 *         strip reads as a card on the plane beside the nav and the flyout.
 *         What this shipped with, and the better answer if you think the
 *         banner should look like it belongs to the same surface family as
 *         everything else rather than like an interruption.
 */
export type BannerEdge = "flush" | "card";
export const BANNER_EDGES: readonly BannerEdge[] = ["flush", "card"];
export const BANNER_EDGE_LABELS: Record<BannerEdge, string> = {
  flush: "Full width",
  card: "Inset card",
};

/**
 * Which way the L2 panel casts a shadow.
 *
 * It had none for a long time, and `flyout-panel.tsx` says why: the
 * canvas-sized shadow it shipped with spilled LEFT over the nav and read as a
 * dark seam BETWEEN L1 and L2, when the panel is supposed to be the nav
 * continuing. Hairlines replaced it.
 *
 * That argument is about a shadow thrown in every direction, and it does not
 * reach one thrown away from the column. Nothing is ever cast left.
 *
 *  right  Out over the page and nowhere else. The default from Oct 1: it
 *         says the panel is in front of the workspace — the one claim worth
 *         making here — and it says it along the only edge where the panel
 *         actually meets the page. The bottom edge usually meets the window.
 *  both   Right and bottom. Reads as a card floating clear of everything,
 *         which is truer when the panel is short and stops mid-screen, and
 *         overstated when it runs the full height.
 *  off    Hairlines alone, which is what this shipped with.
 *
 * None of them paints a ground. The panel's fill is its own and does not
 * change with this axis — a soft shadow against a white page lifts the
 * perceived value of everything inside its falloff, which is a shadow doing
 * its job rather than a background appearing. Ashwin asked on Oct 1; checked,
 * and there is no `bg-` anywhere in these branches.
 */
export type FlyoutShadow = "right" | "both" | "off";
export const FLYOUT_SHADOWS: readonly FlyoutShadow[] = ["right", "both", "off"];
export const FLYOUT_SHADOW_LABELS: Record<FlyoutShadow, string> = {
  right: "Right only",
  both: "Right and bottom",
  off: "None",
};
export const FLYOUT_SHADOW_DEFAULT: FlyoutShadow = "right";

/**
 * What shape the L2 panel is.
 *
 *  docked  What shipped. Squared left edge, no left border, right corners
 *          rounded — the panel is the nav continuing past its own edge, and
 *          the seam between them is one hairline rather than two cards
 *          meeting.
 *  card    A full outline and a radius on all four corners: an object
 *          floating beside the nav rather than an extension of it. It costs
 *          the seam — two strokes now run down the gap — and buys a panel
 *          that is unmistakably a separate surface, which is the right
 *          answer if the nav is a plane rather than a card.
 *
 * A comparison axis, and the comparison is the point: "is L2 part of the nav
 * or in front of it" is the question the arrangement turns on, and it is far
 * easier to answer with both on screen than in the abstract.
 */
export const FLYOUT_SHAPES = ["docked", "card"] as const;

export type FlyoutShape = (typeof FLYOUT_SHAPES)[number];

export const FLYOUT_SHAPE_LABELS: Record<FlyoutShape, string> = {
  docked: "Docked to the nav",
  card: "Its own card",
};

/**
 * Whether the card shape draws an outline around the PAIR.
 *
 * The card's own change is the margin: the panel lifts off the window's top
 * and bottom edges so it lines up with the nav beside it. That is the whole
 * variant, and it is legible with no strokes at all.
 *
 * Outlined is the other half. One border, around both — the nav closes its
 * left, top and bottom, the panel closes its right, top and bottom, and
 * neither rounds the corners where they meet. Two separate outlines would
 * put a 2px rule down a seam the pointer crosses constantly, and four
 * rounded corners in the middle of it would notch that rule at each end.
 *
 * It appears only while a panel is actually open, which is the rule the
 * shape cannot break: an outline is around the pair, and with nothing beside
 * the nav there is no pair to draw one around — just a box that has grown a
 * border for no reason anyone watching could name.
 */
export const FLYOUT_CARD_BORDER_DEFAULT = false;

/**
 * Whether the All accounts flyout runs to the top of the window.
 *
 * Flush by default, and on the plane that is the only coherent answer: the
 * sidebar has no card and no margin there, so a directory inset from the top
 * would be the one surface on the left still behaving as though it were
 * floating on something. Flush, it needs no radius either — a corner is how
 * a card ends, and this one does not end, it meets the edge.
 *
 * Inset is the other half of the comparison, and it brings the radius and
 * the shadow back with it, because those are what an inset surface needs in
 * order to read as deliberate rather than as short.
 */
export const DIRECTORY_FLUSH_DEFAULT = true;

/**
 * Whether anyone can REBIND those keys.
 *
 * Off, and deliberately: ⌃⌥1–5 counted off the pinned order is the whole
 * feature, and it is a better one for being fixed. A shortcut people can
 * rebind is a shortcut nobody can write down — support cannot say "press
 * ⌃⌥2", documentation cannot show it, and the second pin on one machine
 * answers to a different key than the second pin on the next. Reordering is
 * already the way to change which page a key opens, and it is the honest way:
 * you move the row you want first, and the first key opens it.
 *
 * On, the chip in edit mode becomes a control, the kebab grows "Configure
 * shortcut key", and the modal that lists every binding at once is reachable.
 * All of that machinery stays built — see `pin-shortcuts.tsx`, which keeps
 * explicit bindings out of the positional pass so no combo is ever bound
 * twice — because "can people rebind these" is exactly the sort of question
 * this prototype exists to put in front of someone.
 */
export const PINNED_SHORTCUT_EDIT_DEFAULT = false;

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

/**
 * Which mark every AI surface wears.
 *
 * One glyph, four mountings. The sparkle is the product's own `auto_awesome`,
 * handed over Oct 5; what the axis compares is how much of an OBJECT the mark
 * should be, and how loud its ground is.
 *
 *  disc      Sparkles on a purple gradient disc. The default since Oct 5,
 *            when the squircle it replaced was cut — a rounded square was the
 *            right argument (every other round thing here is a person or a
 *            place) and the wrong shape in the pill, where it read as a
 *            button inside a button.
 *  discSoft  The same disc on a lighter ramp: a pale purple into the brand
 *            purple rather than violet into near-black indigo. Carries far
 *            less weight at the foot of the nav, which is either the relief
 *            or the point of losing it.
 *  glyph     No ground at all: the sparkle in purple, nothing behind it. The
 *            lightest answer, and the only one that reads as an icon in a row
 *            of icons rather than as a badge. Also the only one with no
 *            contrast floor of its own — it sits on whatever is behind it.
 *  pinwheel  The Aug 13 mark: a conic gradient donut with a star in the hole.
 *            Kept because a replacement nobody can see the before of is a
 *            replacement nobody can judge — though the motion came off every
 *            mark, so this is the pinwheel standing still.
 */
/**
 * Where the accounts directory opens.
 *
 *  rail     The Aug 13 arrangement: the 56px rail WIDENS into a 340px panel —
 *           one surface growing rather than two meeting at an edge. It ends up
 *           standing over the nav beside it, which is the complaint: the panel
 *           is 340 and the sidebar is 328, so it overhangs by 12px and casts
 *           onto the canvas, and nothing on screen says whether the nav is
 *           still there underneath.
 *  sidebar  The panel takes the sidebar's own footprint exactly — rail plus
 *           nav, full height — and the canvas is untouched beside it. The
 *           sidebar has BECOME the directory rather than been covered by it,
 *           which is the reading Ashwin asked for on Oct 5.
 *
 * A collapsed sidebar widens to the expanded width while this is up and
 * shrinks back on close: the alternative is a 120px directory, and account
 * names with addresses under them do not survive 120px. The sidebar moving is
 * the lesser cost.
 *
 * `sidebar` is the default as of Oct 5. `rail` shipped first only because it
 * was the arrangement that already existed — and the 12px overhang it leaves
 * is not a tuning problem but the shape of the idea: a panel that grows out of
 * one column and lands across two has no edge it can honestly stop at.
 */
/**
 * Whether the account rail survives the nav collapsing.
 *
 *  keep  Both columns stay. Collapsing the nav narrows one of two strips and
 *        leaves 120px of chrome down the left — which is the state Ashwin
 *        called out on Oct 5: you collapse to look at the work, and the work
 *        got 208px back out of a possible 328.
 *  hide  The rail goes with it, and the collapsed nav grows an All accounts
 *        door in its place. One strip, 64px, and switching account is still
 *        one click — it just costs a panel instead of a column.
 *
 * `hide` is the default, as of Oct 5. It shipped as `keep` on the argument
 * that the rail is the thing being evaluated here and one that disappears
 * under a common state is one nobody sees — which was a worry about the
 * PROTOTYPE rather than about the product, and the wrong thing to settle a
 * default on. Collapsing is a request for room; answering it by returning
 * 208px of a possible 328 is answering most of a question. The rail is still
 * one click away, and `keep` is one click away in here.
 */
export const COLLAPSED_RAILS = ["keep", "hide"] as const;

export type CollapsedRail = (typeof COLLAPSED_RAILS)[number];

export const COLLAPSED_RAIL_LABELS: Record<CollapsedRail, string> = {
  keep: "Stays",
  hide: "Hides, with a door in the nav",
};

/**
 * Where the Recents panel's tab switcher sits.
 *
 *  row     A control of its own under the panel's title — today's layout.
 *          Title names the panel, switcher chooses the half.
 *  header  The switcher REPLACES the title, so the header row is tabs and a
 *          close and nothing else. The tabs name the panel better than the
 *          title did — "Recently visited" says what you are looking at, where
 *          "Recents" says it again one line up — and it buys back a whole row
 *          in a panel that is mostly list. Ashwin, Oct 5.
 *
 * `row` stays the default: the header version is the thing being evaluated.
 */
export const PANEL_TAB_PLACES = ["row", "header"] as const;

export type PanelTabPlace = (typeof PANEL_TAB_PLACES)[number];

export const PANEL_TAB_PLACE_LABELS: Record<PanelTabPlace, string> = {
  row: "A row of its own",
  header: "In the header, instead of the title",
};

/**
 * How that switcher is drawn.
 *
 *  segmented  Two halves in a track, the chosen one filled. Reads as a
 *             CONTROL — a thing you operate — which is right for a choice
 *             between two views of one panel.
 *  line       Tabs hugging their labels with a rule under the chosen one.
 *             Reads as NAVIGATION — places you move between — and takes less
 *             ink, which matters once the switcher is sharing the header row
 *             with a close button.
 *
 * Left-aligned and hugging rather than split evenly: a line tab's underline is
 * a mark under the WORDS, and stretching each half to 50% leaves the rule
 * running out past the label into empty space. That is also what keeps room
 * for the close button in the header placement.
 */
/**
 * Which half the Recents panel opens on.
 *
 *  recent     Recently visited, which is what the row you clicked is called.
 *  directory  All products, treating "View all" as a request for the
 *             catalogue rather than for more of the history.
 *
 * The question is what "View all" means on a block headed Recents: all of the
 * RECENTS, or all of the products. The row's own words say the first and the
 * second is what a reader short of a destination usually wants, which is why
 * this is an axis rather than a fix. Ashwin, Oct 5.
 *
 * Read only when the panel is actually showing both halves — with one, there
 * is no choice to make and the axis is silent rather than wrong.
 */
export const PANEL_OPEN_TABS = ["recent", "directory"] as const;

export type PanelOpenTab = (typeof PANEL_OPEN_TABS)[number];

export const PANEL_OPEN_TAB_LABELS: Record<PanelOpenTab, string> = {
  recent: "Recently visited",
  directory: "All products",
};

export const PANEL_TAB_STYLES = ["segmented", "line"] as const;

export type PanelTabStyle = (typeof PANEL_TAB_STYLES)[number];

export const PANEL_TAB_STYLE_LABELS: Record<PanelTabStyle, string> = {
  segmented: "Button group",
  line: "Line tabs",
};

/**
 * What resting on the account rail does.
 *
 *  expand  The strip slides out to 216px and the account names ride along —
 *          the shipped behaviour. Reads the whole list at a glance, at the
 *          cost of a column that moves whenever the pointer crosses it on the
 *          way somewhere else.
 *  static  It stays 56px and the names arrive as tooltips instead. Every
 *          interaction is unchanged: a tile switches account, the waffle opens
 *          All accounts, the agency plate goes to agency scope. Only the
 *          reading changes — one name on demand rather than all of them at
 *          once.
 *
 * Nothing is lost but the pin MARK, which the collapsed strip has never drawn:
 * a 32px tile with a logo in it has nowhere to put a second glyph, and the two
 * runs still sit pinned-first so position carries the distinction. It was
 * never a control — see RailRow's note — so there is nothing here you can only
 * do by hovering.
 *
 * The directory's own morph is NOT governed by this. Under
 * `directoryPlacement: "rail"` the strip widens to 340px to become the panel,
 * and that is a click, not a hover — suppressing it would leave that placement
 * with no way to open. Ashwin, Oct 5.
 *
 * `static` is the default, same day. The peek shipped first because reading
 * eleven logos is genuinely hard and the names fix it — but it fixes it by
 * moving a column that sits along the edge every pointer crosses on its way to
 * the nav, so the cost is paid constantly and the benefit only when you are
 * actually looking for an account. A tooltip pays it the other way round.
 */
/**
 * Where the sub-account tiles sit in the strip's height.
 *
 *  centre  The run is centred vertically, with the agency plate alone holding
 *          the top — the shipped arrangement. It puts the accounts on the
 *          screen's own midline, which is where a pointer travelling up the
 *          edge meets them soonest.
 *  top     They start directly under the agency block. The strip reads as one
 *          list from the top down, the way every other column in this shell
 *          does, and the tiles stop moving as the set changes length — a
 *          centred run of eleven and a centred run of four put the same
 *          account in two different places.
 *
 * Only ever a question when the list FITS. Outgrow the strip and both answers
 * are the same: the run starts at the top and scrolls, because there is
 * nothing left to centre. Ashwin asked for the choice on Oct 5.
 */
export const RAIL_TILE_ALIGNS = ["centre", "top"] as const;

export type RailTileAlign = (typeof RAIL_TILE_ALIGNS)[number];

export const RAIL_TILE_ALIGN_LABELS: Record<RailTileAlign, string> = {
  centre: "Centred",
  top: "Under the agency",
};

export const RAIL_HOVERS = ["expand", "static"] as const;

export type RailHover = (typeof RAIL_HOVERS)[number];

export const RAIL_HOVER_LABELS: Record<RailHover, string> = {
  expand: "Opens the names",
  static: "Stays collapsed",
};

/**
 * Where the accounts directory opens.
 *
 *  rail      A panel over the nav, docked to the rail's edge.
 *  sidebar   The whole left column becomes the directory.
 *  names     The rail itself fills. See RAIL_FILL_MORPHS for the animation.
 *
 * `names` is the Oct 6 proposal and a different idea from the other two: there
 * is no panel at all. The rail is already showing names — under this placement
 * its open width is the sidebar's less a hair, so hovering gives you the
 * named strip before you have clicked anything — and pressing All accounts
 * simply fills the column you are already looking at with every account there
 * is, pinned first. Nothing arrives from off-screen and nothing covers
 * anything: the surface you are pointing at becomes the surface you asked for.
 *
 * It locks open while it is filled, which the hover-expanded rail does not.
 * Browsing forty accounts is not a gesture you hold a pointer through, and a
 * column that collapsed when you crossed it would make the list unusable. It
 * leaves by the ✕ on its own header, by choosing an account, or by Esc.
 */
export const DIRECTORY_PLACEMENTS = ["rail", "sidebar", "names"] as const;

export type DirectoryPlacement = (typeof DIRECTORY_PLACEMENTS)[number];

export const DIRECTORY_PLACEMENT_LABELS: Record<DirectoryPlacement, string> = {
  rail: "Over the nav",
  sidebar: "Fills the sidebar",
  names: "Fills the rail",
};

/**
 * How the rail's head changes when the strip fills. See DIRECTORY_PLACEMENTS.
 *
 * Three readings of one moment, kept as an axis because the right answer is
 * the one that looks right rather than the one that argues best — Ashwin asked
 * to see all three.
 *
 *  header   The All accounts row changes job. It stays exactly where it is,
 *           the waffle gives way, a ✕ arrives at its right and the search
 *           field opens underneath, pushing the list down. One element,
 *           becoming the thing it opened.
 *  descend  The row holds still and a header block comes down over it from
 *           behind the agency plate. Two elements, one arriving — the
 *           reading where the directory is a thing that was always there.
 *  unfold   Nothing changes but the height: the row keeps its waffle, gains
 *           its ✕, and the search unfolds below. The most restrained of the
 *           three, and the one that treats filling as a disclosure rather
 *           than as a change of surface.
 */
/**
 * Whether the filled rail keeps the agency plate above the list.
 *
 * On, the plate is the fixed point the directory hangs from — you are still
 * inside this agency, and the list is its accounts. Off, the list is the whole
 * surface and the head starts at the window's top.
 *
 * The plate does not vanish when it goes: it travels up and out, and the list
 * closes the gap behind it. Which is the honest animation — the thing left,
 * it was not swapped for a different arrangement — and the only one that
 * keeps the rows' own morph legible, since they are moving at the same time.
 *
 * OFF by default, Oct 6. Seen filled, the plate is a row you cannot choose
 * sitting on top of forty you can — and the head already names the agency's
 * directory, so the scope is stated either way. The list gets the height
 * instead, which at forty rows is what the surface is short of.
 */
export const RAIL_FILL_AGENCY_DEFAULT = false;

/**
 * Whether an opened rail keeps the collapsed strip's own column.
 *
 * Collapsed, the marks are centred in a 56px strip — 14 left, 10 right of a
 * 32px tile — and that midline is where the eye has learned to find them.
 * Opening drops the inset to 6, because a 216px row has no midline to hold
 * and the names want the width; the cost is that every mark jumps 8px left at
 * the moment the column opens, which reads as the logos sliding rather than
 * the names arriving. Ashwin caught it on Oct 6 across all three placements.
 *
 * On, the open column is padded so the marks stay on the collapsed midline:
 * the row's own box is centred on x=30 whatever the open state is, so the
 * logos do not move at all and only the labels change. It costs the names
 * about 8px of width, which at this column's size they can afford.
 *
 * OFF by default, Oct 6. The open column pads by 10 now rather than the 6 it
 * did when this axis was written, which takes most of the jump out on its own
 * — and the remaining few pixels cost less than the inset does in a list of
 * forty names. On is still the arrangement where the logos do not move at all.
 */
export const RAIL_HOLD_INSET_DEFAULT = false;

/**
 * What the filled rail falls back to when it closes.
 *
 *  names     The strip stays open at its names width, exactly as a hovered
 *            rail does, and settles shut when the pointer leaves it.
 *  collapse  Straight back to the 56px strip.
 *
 * `names` by default. Closing the directory is a smaller act than leaving the
 * rail — you are done choosing, not done with the strip — and collapsing to
 * marks answers a question nobody asked. It also keeps the exit continuous
 * with the entrance: the fill began from the named column, so unfilling should
 * land back on it rather than two states further out.
 *
 * Only the `names` placement has anything to fall back TO; the other two are
 * panels, and a panel closing leaves the rail wherever the pointer has it.
 */
export const RAIL_FILL_RESTS = ["names", "collapse"] as const;

export type RailFillRest = (typeof RAIL_FILL_RESTS)[number];

export const RAIL_FILL_REST_LABELS: Record<RailFillRest, string> = {
  names: "Keeps the names",
  collapse: "Back to the strip",
};

export const RAIL_FILL_MORPHS = ["header", "descend", "unfold"] as const;

export type RailFillMorph = (typeof RAIL_FILL_MORPHS)[number];

export const RAIL_FILL_MORPH_LABELS: Record<RailFillMorph, string> = {
  header: "Row becomes header",
  descend: "Header descends",
  unfold: "Search unfolds",
};

/**
 * Whether the directory's checkboxes are standing or summoned.
 *
 *  always  Every row wears a checkbox the whole time the bulk switch is on.
 *  button  A "Select" in the header, iOS-style; the boxes arrive when it is
 *          pressed and leave on Cancel. In select mode a row TICKS rather
 *          than switching account — two meanings on one row is the thing the
 *          mode exists to avoid.
 *
 * `button` is the default. The panel's first job is switching account, and a
 * column of checkboxes down the left of it announces a second job before
 * anyone has asked for one — which is the hesitation the bulk switch's own
 * note already worries about. Ashwin, Oct 5.
 */
export const DIRECTORY_SELECTS = ["button", "always"] as const;

export type DirectorySelect = (typeof DIRECTORY_SELECTS)[number];

export const DIRECTORY_SELECT_LABELS: Record<DirectorySelect, string> = {
  button: "Behind \u201cSelect\u201d",
  always: "Always visible",
};

export const AI_MARKS = ["disc", "discSoft", "glyph", "pinwheel"] as const;

export type AiMarkStyle = (typeof AI_MARKS)[number];

export const AI_MARK_LABELS: Record<AiMarkStyle, string> = {
  disc: "Sparkle disc",
  discSoft: "Sparkle disc, light",
  glyph: "Sparkle only",
  pinwheel: "Gradient pinwheel",
};

export const AI_BUTTON_STYLES = ["gradient", "outline"] as const;

export type AiButtonStyle = (typeof AI_BUTTON_STYLES)[number];

export const AI_BUTTON_STYLE_LABELS: Record<AiButtonStyle, string> = {
  gradient: "Purple fill",
  outline: "Outline",
};

/**
 * Where the docked Ask AI panel's top edge sits.
 *
 *  canvas  Level with the canvas, below the app bar, taking the same top,
 *          bottom and right margins. The default: docked means the page has
 *          made room for the panel in the LAYOUT, and a column that starts
 *          at the canvas and a column that starts above the breadcrumb are
 *          not two columns side by side — the taller one reads as an
 *          overlay that happens to have pushed the page aside.
 *  shell   Full plane height, from under the banner to the window's foot,
 *          so the panel clears the app bar too. What this shipped with, and
 *          the right answer if you read the assistant as a second workspace
 *          rather than as something standing beside this one.
 *  pane    The same full height, and the app bar and the page JOIN into one
 *          card beside it — the joined-shell arrangement, switched on by the
 *          dock rather than by the shell axis. Two panes, equal margins top
 *          and bottom, nothing above either of them. It is the only value
 *          where the two surfaces are peers: under `shell` the panel stands
 *          beside a bar that has narrowed to make room, which reads as the
 *          page having been pushed, and under `canvas` the panel is plainly
 *          the junior of the two. Here neither is inside the other's frame.
 *
 * Floating and expanded are unaffected: neither is claiming a column, so
 * neither has a neighbour to line up with. The slide-in keeps the full plane
 * height it always had — an overlay has no reason to clear the bar.
 *
 * Under `canvas` the app bar keeps the window's full width and the panel
 * sits beneath it, because the width now comes out of the CANVAS rather
 * than out of the plane row. The bar narrowing was an artefact of the layout
 * hole sitting beside the whole page column; with the panel below the bar
 * there is nothing up there for it to make room for.
 */
export const AI_DOCK_TOPS = ["canvas", "shell", "pane"] as const;
export type AiDockTop = (typeof AI_DOCK_TOPS)[number];
export const AI_DOCK_TOP_LABELS: Record<AiDockTop, string> = {
  canvas: "Level with the canvas",
  shell: "Full plane height",
  pane: "Two panes",
};

/**
 * When the L1 row's flyout chevron is drawn.
 *
 *  always  On every row that has a panel behind it, at rest. What this
 *          ships: the glyph is a promise about the ROW — "there is more
 *          here, and it arrives from the side" — and a promise you can only
 *          see by pointing at the row is one you have to already know about.
 *          It is also what makes a column of leaves and a column of
 *          categories tell themselves apart at a glance.
 *  hover   Only under the pointer, and not on the selected row either. The
 *          case is that ten chevrons down a column is ten glyphs saying the
 *          same thing, and the one that matters is the one you are about to
 *          press. The case against is that the nav then looks flat until you
 *          touch it, and a reader deciding where to go has not touched it
 *          yet.
 *
 * The L2 disclosure caret is a different glyph and a different promise — it
 * reports whether a row is OPEN, which is state rather than affordance, and
 * state that disappears on mouse-out is not state. This axis leaves it alone.
 */
export const NAV_CHEVRONS = ["always", "hover"] as const;
export type NavChevron = (typeof NAV_CHEVRONS)[number];
export const NAV_CHEVRON_LABELS: Record<NavChevron, string> = {
  always: "Always",
  hover: "On hover only",
};

/**
 * Whether Ask AI can float over the page at all.
 *
 * OFF by default (Oct 5), which leaves the panel two modes: docked beside
 * the canvas, and full screen. Clicking Ask AI docks.
 *
 * Floating is the mode the panel shipped with and the one with the weakest
 * case. An overlay is right for something you glance at and dismiss — a
 * notification, a menu — and wrong for a conversation you are having ABOUT
 * the page underneath it, which is the whole premise here: it covers the
 * thing it is discussing, and the reader's first move is to drag it out of
 * the way or dock it. Docked asks the page to make room instead, which is
 * the honest arrangement for two surfaces that are both in use.
 *
 * Kept as an axis because "does this need to float" is a fair question to
 * put in front of someone, and because the floating card is the only mode
 * that costs the page no width. With it off, the float/dock control goes
 * from the panel's own header too — an affordance for a mode that cannot
 * be reached is worse than no affordance.
 */
export const AI_FLOATING_DEFAULT = false;

/**
 * What full screen does with the app's own chrome.
 *
 *  show  The panel fills the CANVAS only — below the app bar, right of the
 *        nav — and the trail names it "Ask AI". The default. Full screen is
 *        then the assistant as a place in the product rather than a takeover
 *        of it: the way back is the nav you were already using, and the bar
 *        says where you are, which is what the bar is for.
 *  hide  The panel takes the whole plane, nav and bar included. The default
 *        from Oct 5, and the stronger reading of the mode — the only exits
 *        are the panel's own two glyphs, top right, which is a thin thread
 *        for a surface that has taken the entire window, but it is the only
 *        value that makes expanding mean something the dock cannot already
 *        do.
 *
 * The objection to `show` is that it makes expanded a wider dock, and the
 * two-pane dock settled it: once docking gives the assistant a pane of its
 * own, "the same thing with the page still around it" is what docking
 * already is. Ashwin, Oct 5.
 */
export const AI_FULL_CHROMES = ["show", "hide"] as const;
export type AiFullChrome = (typeof AI_FULL_CHROMES)[number];
export const AI_FULL_CHROME_LABELS: Record<AiFullChrome, string> = {
  show: "Nav and bar stay",
  hide: "Takes the window",
};

/**
 * Whether search and Ask AI are one control or two.
 *
 *  merged    One pill: the orb at its left end, the placeholder, the
 *            magnifier and ⌘K. The orb alone opens the assistant and the
 *            rest is search — "one field you can talk to", which is the
 *            direction the review asked for.
 *  separate  A plain search field and an Ask AI button beside it. The
 *            honest version of what the two things currently are: the pill
 *            merges their SHAPE while their behaviours stay apart, and a
 *            control whose left 28px does something categorically
 *            different from the other 200 is a control people have to be
 *            told about. The default from Oct 5, and worth standing the
 *            merged pill next to it precisely because the merge is the
 *            interesting claim — you cannot judge it against nothing.
 *
 * Only where the entry carries search at all. Without it the pill is already
 * just the Ask AI button, which is this axis's second value with the field
 * removed.
 */
export const ENTRY_PAIRS = ["merged", "separate"] as const;
export type EntryPair = (typeof ENTRY_PAIRS)[number];
export const ENTRY_PAIR_LABELS: Record<EntryPair, string> = {
  merged: "One pill",
  separate: "Field and button",
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
 * shaped like every other field is one nobody has to learn — and the case
 * against is that it stops announcing itself, and that at 8px a 32px field
 * sitting against a 32px button reads as two halves of a segmented control
 * rather than as two controls. See ENTRY_PAIRS.
 *
 * Only the horizontal control answers to it. The 44px rail stack is a column
 * of round glyphs and an 8px box around them would be a box around circles.
 */
export const ENTRY_RADII = ["pill", "sm"] as const;

/**
 * Whether the nav's edit affordance follows the entry down to 8px.
 *
 * A sub-question of ENTRY_RADII, and only askable once that one has been
 * answered `sm`: while the entry is a pill, a pill beside it is not a
 * decision anybody made.
 *
 * It is a real question rather than a tidy-up. The edit control is a
 * capsule that grows sideways into its label on hover, and the full radius
 * is doing work there — a shape that changes width reads as one object
 * moving when its ends are round and as a box being stretched when they are
 * not. Against that: it floats directly over the entry, and two controls
 * one above the other at two radii is the kind of near-miss that looks like
 * an oversight rather than a choice.
 *
 * Both capsules follow it, the edit button and the nav switcher beside it.
 * They are the same object at two jobs and nothing is served by them
 * disagreeing about their own corners. Ashwin, Oct 5.
 */
/**
 * How dark the nav's resting rows are.
 *
 * The label and the icon together — they take one ink, and a list where
 * the word and the glyph disagree about their weight reads as two columns
 * rather than one row. The hover chevron follows, since it is the same
 * "this row, under the pointer" state the icon is in.
 *
 *  900  Near-black, which is what the nav shipped with. Every row is as
 *       emphatic as every other, the list competes with the page for first
 *       read, and the marked row has nothing to be darker than.
 *  700  A step back, and the default from Oct 6. The nav stops being the
 *       darkest thing on screen while each row is still plainly a
 *       destination rather than a caption — and the selected row's pinned
 *       900 becomes a mark rather than a coincidence.
 *  600  Two steps. Chrome that recedes until it is wanted — and the point
 *       at which "quiet" starts to shade into "secondary", which is the
 *       thing worth looking at rather than arguing about.
 *
 * The MARKED row is pinned at 900 under all three. The axis is about rows
 * you are not on: lightening those is what makes the one you are on carry,
 * and lightening it with them would spend the contrast the option exists to
 * create. Light navs only — a dark nav's ink runs the other way.
 */
export const NAV_INKS = ["900", "700", "600"] as const;
export type NavInk = (typeof NAV_INKS)[number];
export const NAV_INK_LABELS: Record<NavInk, string> = {
  "900": "Gray 900",
  "700": "Gray 700",
  "600": "Gray 600",
};

/**
 * How much heavier the row you are on is set.
 *
 *  medium    One step up from the body weight. The default from Oct 6: at
 *            14px a semibold label beside regular ones is a noticeable jump
 *            in colour as well as weight, and on a row that also carries a
 *            fill it tips into reading as a heading. Medium separates the
 *            row without changing what KIND of text it is.
 *  semibold  The account rail's own treatment, and the louder answer. Worth
 *            having beside medium precisely because "enough" is the whole
 *            question here — the lighter the rest of the list gets (see
 *            NAV_INKS), the more work this has to do.
 *
 * There is no "unweighted" value any more. The nav shipped without one and
 * `here.tsx` argued for it — the ground already says which row this is —
 * but that argument was about weight added to a FULL-strength list, and the
 * ink axis has moved the ground under it. Say the word if the comparison is
 * wanted back.
 *
 * Every marked row takes it, the trail as well as the leaf — see the note
 * in `useHereStyle` for why "leaf only" meant "not the L1" in the one
 * arrangement most people look at.
 */
export const NAV_SELECTED_WEIGHTS = ["medium", "semibold"] as const;
export type NavSelectedWeight = (typeof NAV_SELECTED_WEIGHTS)[number];
export const NAV_SELECTED_WEIGHT_LABELS: Record<NavSelectedWeight, string> = {
  medium: "Medium",
  semibold: "Semibold",
};
export const NAV_SELECTED_WEIGHT_CLASS: Record<NavSelectedWeight, string> = {
  medium: "font-medium",
  semibold: "font-semibold",
};

/**
 * Whether the row you are on draws a larger glyph.
 *
 * ON by default (Oct 6). On, the leading icon goes 16 → 18 wherever a row is
 * marked at all — L1, L2 and L3, the trail as well as the leaf, through the
 * same `useHereStyle` every other part of the mark comes from, so a level
 * cannot be left out by someone forgetting it. The trail is included
 * because in the default flyout arrangement the L1 IS the trail: the page
 * is behind a shut panel, so nothing in the column is ever `here`.
 *
 * The case for it is that weight and size are the same signal in two
 * channels: if the label gets heavier, a glyph that stays put reads as
 * having been left behind. The case against is that it is the one part of
 * the mark that moves LAYOUT — 2px of glyph in a fixed column — and a row
 * whose contents shift when it becomes current is a row that twitches as
 * you navigate. Which of those wins is exactly what the axis is for.
 */
export const NAV_SELECTED_ICON_DEFAULT = true;

/**
 * Whether the nav's edit control is on screen at rest.
 *
 * ON by default (Oct 6). The circle is simply there — still anonymous until
 * hovered, since the label grows out of it on the same timing, so the only
 * thing the axis decides is whether you have to find the control by
 * sweeping the nav with a pointer.
 *
 * What the nav shipped with is the other value: a 26px circle that fades in
 * on nav hover. The argument for it is that editing the nav is a rare,
 * deliberate act and a standing button advertises something most people do
 * once. That is true of the FREQUENCY and does not follow to the gate:
 * "rare" and "undiscoverable" are not the same claim, and hover is not a
 * discovery mechanism a touch screen has at all.
 */
export const EDIT_ALWAYS_DEFAULT = true;

export const EDIT_RADII = ["pill", "sm"] as const;
export type EditRadius = (typeof EDIT_RADII)[number];
export const EDIT_RADIUS_LABELS: Record<EditRadius, string> = {
  pill: "Fully rounded",
  sm: "8px",
};

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
 *  white    The same hairline over a white fill. The variant for the plane,
 *           where `outline` has no ground of its own and so shows the grey
 *           behind it — the card reads as a dent rather than as a card. Lifted
 *           off a grey plane it is the one arrangement where the brightest
 *           thing in the nav is the thing you are meant to finish.
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
  "white",
  "quiet",
  "plain",
  "solid",
] as const;

export type LaunchpadCard = (typeof LAUNCHPAD_CARDS)[number];

export const LAUNCHPAD_CARD_LABELS: Record<LaunchpadCard, string> = {
  tinted: "Tinted",
  outline: "Outline",
  white: "White",
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
  // "Tree nav" rather than "All products": the catalogue ALSO has a standing
  // row and a panel tab of its own called All products, and one name over two
  // different controls read as the same switch. The arrangement is named for
  // its shape; the row keeps the catalogue's name.
  tree: "Tree nav",
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
 *  fillBar  Both: the fill, with the accent rule on the leading edge. The two
 *           were written as alternatives because each is a complete answer,
 *           and the pairing is the arrangement most product navs actually
 *           ship — the fill says WHICH row and the bar says it is the page
 *           rather than a rollover, which is exactly the collision `fill`
 *           has on its own. It is also the only mark that still works when
 *           the fill is a light grey: a gray-200 row beside a gray-100
 *           hover is one shade apart, and the bar is what makes that
 *           difference legible. Ashwin, Oct 5.
 * `outline` — a hairline ring — is gone (Sep 10). A 1px line on a 272px row
 * was the quietest thing on a surface that also draws dividers, panel borders
 * and an edit ring, and in a review nobody could find it without being told
 * where to look. An option that has to be pointed out is not an option.
 *
 * The trail, where it is drawn at all, is the same treatment at lower strength
 * rather than a second treatment — so the eye reads it as less of the same
 * thing rather than as another kind of thing.
 */
export const SELECTED_MARKS = ["fill", "bar", "fillBar", "tint"] as const;

export type SelectedMark = (typeof SELECTED_MARKS)[number];

export const SELECTED_MARK_LABELS: Record<SelectedMark, string> = {
  fill: "Darker fill",
  bar: "Edge bar",
  fillBar: "Fill and bar",
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
  pill: "Round",
  squircle: "8px corners",
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
/**
 * How the centre canvas (`pageCanvas`) marks its edge against the plane.
 *
 *  - `shadow` — shadow/lg alone, the HighRise spec and what shipped first.
 *  - `border` — the card hairline alone: flat, the edge drawn instead of cast.
 *  - `both`   — the hairline and shadow/lg together.
 *
 * Only the edge changes; margin, radius, padding and scrolling are the same in
 * all three. Dark keeps its hairline whichever is picked, because shadow/lg
 * vanishes on a near-black plane.
 */
export const PAGE_CANVAS_EDGES = ["shadow", "border", "both"] as const;

export type PageCanvasEdge = (typeof PAGE_CANVAS_EDGES)[number];

export const PAGE_CANVAS_EDGE_LABELS: Record<PageCanvasEdge, string> = {
  shadow: "Shadow",
  border: "Border",
  both: "Border + shadow",
};

/**
 * What the centre canvas card is filled with.
 *
 *  - `white`  — the card is the page surface, as shipped.
 *  - `tinted` — the whole card takes the product's tint; the page's own cards
 *               stay white on it.
 *  - `frame`  — the card's 16px padding band takes the tint and the content
 *               area inside it is white.
 *
 * Only products listed in CANVAS_TINTS have a tint, so the setting only does
 * anything (and only shows in the panel) on those pages — unless
 * `canvasTintAllPages` asks to preview it everywhere.
 */
export const CANVAS_BGS = ["white", "tinted", "frame"] as const;
export type CanvasBg = (typeof CANVAS_BGS)[number];
export const CANVAS_BG_LABELS: Record<CanvasBg, string> = {
  white: "White",
  tinted: "Tinted",
  frame: "Tinted frame",
};

/**
 * Each product's canvas tint, keyed by product id — or by page id where a
 * tree files the product as a page (the shipped nav has Conversation AI as an
 * L3 of AI Agents). Both nav trees are listed.
 */
export const CANVAS_TINTS: Record<string, string> = {
  // AI ▸ Content AI
  "ia-ai-content": "#F2F7FA",
  // AI ▸ Conversation AI
  "ia-ai-conversation": "#FCFDFD",
  "ai-conversation": "#FCFDFD",
  // Payments ▸ Orders ▸ Order list (the list page only, not Abandoned checkout)
  "ia-commerce-orders-list": "#F2F7FA",
  "payments-orders": "#F2F7FA",
  // Marketing ▸ Social Planner
  "ia-marketing-social": "#F9FAFB",
  "social-planner": "#F9FAFB",
  // AI ▸ Agent templates
  "ia-ai-templates": "#F2F7FA",
  // Creator Hub ▸ Communities ▸ Groups
  "ia-creators-communities-groups": "#F2F7FA",
  "memberships-communities": "#F2F7FA",
  // Commerce ▸ Invoices — the list page only, not Layouts
  "ia-commerce-invoices-all": "#F2F7FA",
  "invoices-all": "#F2F7FA",
};

/** The tint pages without their own use when previewing on every page. */
export const DEFAULT_CANVAS_TINT = "#F2F7FA";

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
  /** Whether search and Ask AI are one control or two. See ENTRY_PAIRS. */
  entryPair: EntryPair;
  /** Where the docked Ask AI panel's top edge sits. See AI_DOCK_TOPS. */
  aiDockTop: AiDockTop;
  /** What full screen does with the app's own chrome. See AI_FULL_CHROMES. */
  aiFullChrome: AiFullChrome;
  /** Whether Ask AI can float over the page. See AI_FLOATING_DEFAULT. */
  aiFloating: boolean;
  /** When the L1 flyout chevron is drawn. See NAV_CHEVRONS. */
  navChevron: NavChevron;
  /** How dark the nav's resting rows are. See NAV_INKS. */
  navInk: NavInk;
  /** How much heavier the marked row's label is. See NAV_SELECTED_WEIGHTS. */
  navSelectedWeight: NavSelectedWeight;
  /** Larger glyph on the row you are on. See NAV_SELECTED_ICON_DEFAULT. */
  navSelectedIcon: boolean;
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
  /** Whether the edit capsules follow the entry to 8px. See EDIT_RADII. */
  editRadius: EditRadius;
  /** Whether the edit control is on screen at rest. See EDIT_ALWAYS_DEFAULT. */
  editAlways: boolean;
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
  /**
   * The sub-account logo in the nav header, while a member's rail is up.
   * See SUB_ACCOUNT_NAV_MARK_DEFAULT.
   */
  subAccountNavMark: boolean;
  /** Whether the nav drops its card and sits on the plane. See NAV_ON_PLANE_DEFAULT. */
  navOnPlane: boolean;
  /** Hairlines on the hovered and selected rows, on the plane. See NAV_ROW_RING_DEFAULT. */
  navRowRing: boolean;
  /** A lift under the selected row, on the plane. See NAV_ROW_SHADOW_DEFAULT. */
  navRowShadow: boolean;
  /** What colour the selected row is filled with. See NAV_SELECTED_FILLS. */
  navSelectedFill: NavSelectedFill;
  /** How wide the L1 column and L2 panel are. See NAV_WIDTH_SETS. */
  navWidthSet: NavWidthSet;
  /** Whether edit mode borrows the wider pair. See EDIT_WIDTH_FULL_DEFAULT. */
  editWidthFull: boolean;
  /** An All accounts door in the collapsed rail. See RAIL_ACCOUNTS_DOOR_DEFAULT. */
  railAccountsDoor: boolean;
  /** The address under an account's name. See ACCOUNT_ROW_META_DEFAULT. */
  accountRowMeta: boolean;
  /** How the accounts directory offers its way out. See DIRECTORY_EXITS. */
  directoryExit: DirectoryExit;
  /** The grey the plane is painted in. See PLANE_GROUNDS. */
  planeGround: PlaneGround;
  /** Arranging, renaming and re-iconing pins in edit mode. See PINNED_ROW_EDIT_DEFAULT. */
  pinnedRowEdit: boolean;
  /** Keyboard shortcuts on pinned rows. See PINNED_SHORTCUTS_DEFAULT. */
  pinnedShortcuts: boolean;
  /** Which way the L2 panel casts a shadow. See FLYOUT_SHADOWS. */
  flyoutShadow: FlyoutShadow;
  /** Whether the L2 panel is docked or a card. See FLYOUT_SHAPES. */
  flyoutShape: FlyoutShape;
  /** An outline around the nav+panel pair. See FLYOUT_CARD_BORDER_DEFAULT. */
  flyoutCardBorder: boolean;
  /** Whether All accounts runs to the top. See DIRECTORY_FLUSH_DEFAULT. */
  directoryFlush: boolean;
  /** Whether those shortcuts can be rebound. See PINNED_SHORTCUT_EDIT_DEFAULT. */
  pinnedShortcutEdit: boolean;
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
  /** Which mark every AI surface wears. See AI_MARKS. */
  aiMark: AiMarkStyle;
  /** Where the accounts directory opens. See DIRECTORY_PLACEMENTS. */
  directoryPlacement: DirectoryPlacement;
  /** How the rail's head changes as it fills. See RAIL_FILL_MORPHS. */
  railFillMorph: RailFillMorph;
  /** The agency plate above the filled rail. See RAIL_FILL_AGENCY_DEFAULT. */
  railFillAgency: boolean;
  /** An opened rail keeps the collapsed column. See RAIL_HOLD_INSET_DEFAULT. */
  railHoldInset: boolean;
  /** What the filled rail falls back to on close. See RAIL_FILL_RESTS. */
  railFillRest: RailFillRest;
  /** What resting on the account rail does. See RAIL_HOVERS. */
  railHover: RailHover;
  /** Where the sub-account tiles sit in the strip. See RAIL_TILE_ALIGNS. */
  railTileAlign: RailTileAlign;
  /** Where the Recents panel's switcher sits. See PANEL_TAB_PLACES. */
  panelTabPlace: PanelTabPlace;
  /** How that switcher is drawn. See PANEL_TAB_STYLES. */
  panelTabStyle: PanelTabStyle;
  /** Which half the panel opens on. See PANEL_OPEN_TABS. */
  panelOpenTab: PanelOpenTab;
  /** Whether the account rail survives a collapsed nav. See COLLAPSED_RAILS. */
  collapsedRail: CollapsedRail;
  /** Whether its checkboxes are standing or summoned. See DIRECTORY_SELECTS. */
  directorySelect: DirectorySelect;
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
  /** Whether the word navigates or the whole crumb opens the menu. See CRUMB_TRIGGERS. */
  crumbTrigger: CrumbTrigger;
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
  /** How the canvas marks its edge. See PAGE_CANVAS_EDGES. */
  pageCanvasEdge: PageCanvasEdge;
  /** What the canvas is filled with on tinted products. See CANVAS_BGS. */
  canvasBg: CanvasBg;
  /** Preview the canvas tint on every page, not only tinted products. */
  canvasTintAllPages: boolean;
  /** Under the tinted frame, whether the white sheet pads its content 16px. */
  canvasFramePadding: boolean;
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
  /** How the promo banner meets the window. See BANNER_EDGES. */
  bannerEdge: BannerEdge;
  /** Whether the plane shows between the nav and the canvas. See PLANE_SEAMS. */
  planeSeam: PlaneSeam;
  /** What the nav's top edge lines up with, on the plane. See PLANE_HEADS. */
  planeHead: PlaneHead;
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
  /*
   * Two controls, not one (Oct 5). The merged pill is the more interesting
   * claim and it is still one click away; what settled it is that the claim
   * is not yet true of the BEHAVIOUR — the orb opens the assistant and the
   * rest of the pill searches — so shipping the merged shape as the default
   * would have the prototype asserting something the prototype does not do.
   * See ENTRY_PAIRS.
   */
  entryPair: "separate",
  /*
   * Two panes (Oct 5). The pairing is the arrangement that reads as two
   * surfaces of equal standing rather than one making room for the other,
   * which is what docking an assistant is supposed to look like. The other
   * two stay for the comparison. See AI_DOCK_TOPS.
   */
  aiDockTop: "pane",
  /*
   * The whole window (Oct 5). `show` was the default for one turn and the
   * two-pane dock is what unseated it: that arrangement already gives the
   * assistant a pane of its own beside the product, so a full screen that
   * also keeps the nav and the bar is the same idea at a different width,
   * and the mode stops being worth a control. Expanding is now the move
   * that leaves the product behind — the one thing the dock cannot do.
   */
  aiFullChrome: "hide",
  aiFloating: AI_FLOATING_DEFAULT,
  /*
   * On hover, as of Oct 6.
   *
   * The argument against was that the nav looks flat until you touch it, and
   * the row states are what answered it: with an edge and a lift on the
   * selected row, the column no longer needs a glyph on every line to have
   * shape. What is left is ten chevrons saying the same thing, and the one
   * that matters is the one under the pointer.
   */
  navChevron: "hover",
  /*
   * Gray 700 (Oct 6). 900 made the nav the darkest thing on screen — every
   * row as emphatic as every other, competing with the page for first read
   * — and it left the marked row nothing to be darker THAN. A step back is
   * what lets the selected row's pinned 900 do the marking, which is the
   * same move the account rail already makes. See NAV_INKS.
   */
  navInk: "700",
  navSelectedWeight: "medium",
  navSelectedIcon: NAV_SELECTED_ICON_DEFAULT,
  attachTemplateInUse: true,
  /*
   * Back to the pill, same day.
   *
   * The 8px argument was that a split entry's search half is just a field,
   * so it should be shaped like one. True as far as it goes, and it loses
   * to what the pair actually looks like: both halves are 32px and sit
   * against each other, and at 8px they read as two slabs of a segmented
   * control rather than as a field and a button. The full radius is what
   * keeps them separate objects. See ENTRY_RADII and ENTRY_PAIRS.
   */
  entryRadius: "pill",
  editRadius: "pill",
  editAlways: EDIT_ALWAYS_DEFAULT,
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
  subAccountNavMark: SUB_ACCOUNT_NAV_MARK_DEFAULT,
  navOnPlane: NAV_ON_PLANE_DEFAULT,
  navRowRing: NAV_ROW_RING_DEFAULT,
  navRowShadow: NAV_ROW_SHADOW_DEFAULT,
  /*
   * The light treatment, until one of the dark five wins the argument. It is
   * the one every other decision on this nav was made against.
   */
  navSelectedFill: "default",
  // 272 / 360, which every spacing decision in this prototype was made inside.
  /*
   * 264 / 264 since Oct 6 — the even pair, where the panel is the column's
   * width rather than half again as wide. Chosen after looking at all three:
   * see NAV_WIDTH_SETS. The L2 gives up 96px against the shipped pair, which
   * is the cost to keep watching.
   */
  navWidthSet: "even",
  editWidthFull: EDIT_WIDTH_FULL_DEFAULT,
  railAccountsDoor: RAIL_ACCOUNTS_DOOR_DEFAULT,
  accountRowMeta: ACCOUNT_ROW_META_DEFAULT,
  /*
   * Back on Oct 5, and ✕ again on Oct 6 — because the default placement moved
   * underneath it.
   *
   * The arrow was right while the directory filled the SIDEBAR: a ✕ on a full
   * left column reads as closing the nav rather than leaving a list. The
   * default is now the filled rail, which is a narrower claim — the strip
   * stays a strip, the directory is what is in it for a moment, and it goes
   * back to showing names when you are done. ✕ is the word for dismissing
   * something that was put there; ◀ promises a place you came from, and under
   * this arrangement there is barely one. One click either way.
   */
  directoryExit: "close",
  /*
   * The declared token, until one of the fourteen wins the argument. A
   * prototype that opens on a hand-picked grey is a prototype that has already
   * answered the question it was built to ask.
   */
  planeGround: "default",
  pinnedRowEdit: PINNED_ROW_EDIT_DEFAULT,
  pinnedShortcuts: PINNED_SHORTCUTS_DEFAULT,
  flyoutShadow: FLYOUT_SHADOW_DEFAULT,
  bannerEdge: "flush",
  planeSeam: "flush",
  planeHead: "bar",
  flyoutShape: "docked",
  flyoutCardBorder: FLYOUT_CARD_BORDER_DEFAULT,
  directoryFlush: DIRECTORY_FLUSH_DEFAULT,
  pinnedShortcutEdit: PINNED_SHORTCUT_EDIT_DEFAULT,
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
   *
   * It went to "white" on Oct 1 and came back on Oct 5. The argument for white
   * was that an unfilled card on the plane shows the grey behind it; the
   * argument against is what the row states now do. With an edge and a lift on
   * the selected row, a white card is a second raised surface in the same
   * column, and the one thing in the nav that is a surface should be the row
   * you are on, not the onboarding notice above it. "White" is one click away
   * for the comparison.
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
  /*
   * Outline (Oct 5). The purple fill was right while the Ask AI button was
   * the whole entry and had to carry the assistant on its own. Beside a
   * search field it is one of two controls in a row, and the loudest fill on
   * the surface sitting next to a hairline field read as a promo rather than
   * as the other half of a pair. The orb still carries the purple; the box
   * around it no longer has to. See AI_BUTTON_STYLES and ENTRY_PAIRS.
   */
  aiButtonStyle: "outline",
  /*
   * The bare sparkle (Oct 5), in purple, on nothing.
   *
   * The disc was carrying the assistant on its own while the entry was one
   * filled pill. It is not any more: the entry splits by default, the Ask AI
   * button is outlined, and a saturated purple disc inside a hairline button
   * was the one filled shape left on the surface — a badge pinned to a
   * control rather than the control's own glyph. Bare, the sparkle is an
   * icon in a row of icons, which is what it is.
   *
   * It lands on the BUTTON and nowhere else, because the button is the only
   * place the mark still appears under the default arrangement: the split
   * entry's search half wears a magnifier. See AI_MARKS and ENTRY_PAIRS.
   */
  aiMark: "glyph",
  /*
   * The filled rail, as of Oct 6.
   *
   * It is the only one of the three where nothing arrives and nothing is
   * covered: the strip you are already pointing at is the strip that fills,
   * at a width it already had. The other two are a panel appearing — over the
   * nav, or in place of it — which is one more surface than the question
   * "which account" needs.
   */
  directoryPlacement: "names",
  railFillMorph: "header",
  railFillAgency: RAIL_FILL_AGENCY_DEFAULT,
  railHoldInset: RAIL_HOLD_INSET_DEFAULT,
  railFillRest: "names",
  /*
   * Expand, as of Oct 6.
   *
   * `static` was the safer answer to "a column that moves whenever the
   * pointer crosses it", and the arrangement around it has since changed the
   * sums: the directory no longer opens as a hovered overlay, so crossing the
   * rail on the way elsewhere costs a widening and nothing else. Against that,
   * a strip of eleven unlabelled discs is a memory test until you point at
   * each one in turn, and the names are the whole answer. Tooltips are one
   * click away.
   */
  railHover: "expand",
  railTileAlign: "centre",
  panelTabPlace: "row",
  panelTabStyle: "segmented",
  panelOpenTab: "recent",
  collapsedRail: "hide",
  directorySelect: "button",
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
  // "none" from Sep 30 (Ashwin). The page header states the page a row
  // below, so the leaf was the trail saying it twice; "title" was the
  // previous answer and it only held where a page HAD a title to hand the
  // caret to. This one needs nothing from the page. See CrumbLeaf.
  crumbTrigger: "split",
  crumbLeaf: "none",
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
  /*
   * The canvas, on, with both edges — Ashwin, Oct 1.
   *
   * Off was the shipped state and the honest baseline while the canvas was a
   * proposal. It is the arrangement every other axis is now being judged
   * against — the plane variant exists to put a page card on a ground, and
   * with no card there is nothing for the ground to be the ground OF — so a
   * review that has to switch it on first is a review that opens on a state
   * nobody is arguing for.
   *
   * `both` rather than `shadow` for the same reason the sidebar's own seam
   * got a stroke: a shadow alone says "lifted", and on a light plane that is
   * a few pixels of grey doing all the work of saying where the page starts.
   * The hairline states it and the shadow gives it height.
   */
  pageCanvas: true,
  pageCanvasEdge: "both",
  canvasBg: "white",
  canvasTintAllPages: false,
  canvasFramePadding: true,
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
