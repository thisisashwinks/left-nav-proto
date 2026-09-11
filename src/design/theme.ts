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
 *  flyout  One L1 row, "Desktop and mobile apps", opening a panel with the two
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
 * How the product directory opens a level.
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
 * The product directory used to carry its own disclosure axis here.
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
  stacked: "Directory below",
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
 */
export const SELECTED_STATES = ["off", "leaf", "trail"] as const;

export type SelectedState = (typeof SELECTED_STATES)[number];

export const SELECTED_STATE_LABELS: Record<SelectedState, string> = {
  off: "Off",
  leaf: "The row only",
  trail: "Row and its trail",
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
  /** Where the Get the app offer is reached from. See GET_APP_PLACEMENTS. */
  getAppPlacement: GetAppPlacement;
  /** Whether the agency's entry pill carries search. See AGENCY_SEARCH_DEFAULT. */
  agencySearch: boolean;
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
  /** How replacing my layout is confirmed. See LAYOUT_REPLACE_DIALOGS. */
  layoutReplaceDialog: LayoutReplaceDialog;
  /** How a multi-account sub-account person switches. See SUB_ACCOUNT_SWITCHERS. */
  subAccountSwitcher: SubAccountSwitcher;
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
   * The product directory as a place of its own, reached from a standing row.
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
  accent: "account",
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
  selectedState: "trail",
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
  layoutReplaceDialog: "simple",
  // The rail: one mechanism for both audiences beats a second one to learn.
  subAccountSwitcher: "rail",
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
  // Tabs on top: the switcher governs the whole body, so the panel stops
  // having unswitched content sitting above its own switcher.
  recentsPanelLayout: "tabs-top",
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
