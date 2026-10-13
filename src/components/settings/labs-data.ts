/**
 * Agency › Labs — the beta programme's feature list.
 *
 * Two audiences on two tabs, and they are not the same list seen twice. An
 * AGENCY flag is something the agency switches on for itself; a SUB-ACCOUNT
 * flag is something the agency decides on behalf of accounts it administers,
 * which is why only that tab carries visibility, a rollout state and a
 * Preferences control. Modelling them as one list with a `scope` field was
 * the obvious move and the wrong one: half the fields would be null on half
 * the rows, and the two tabs would drift into pretending to be the same
 * screen.
 *
 * Copy is lifted from the real Labs page where the screenshots show it, and
 * invented in the same register where they do not. Flag names in production
 * are written by engineers and read like it — "AI Suite Usage Rebilling
 * Details", a title and a body that say the same six words — so the fixtures
 * keep that flatness rather than improving it. A Labs page full of
 * well-written marketing copy is a prototype lying about what the screen
 * will hold.
 */

/** Where a flag has got to. Drives the footer control and the status pill. */
export type LabsState =
  /** Shipped. No action left, just the badge and a feedback door. */
  | "live"
  /** Switched on for this agency. The toggle is the control. */
  | "on"
  /** Available, not taken. Counts down to the date it goes live for all. */
  | "available";

export interface LabsFlag {
  id: string;
  /** The card's heading — the flag's human name. */
  name: string;
  /** The body heading. Often the flag name again; see the note above. */
  headline: string;
  /** The body. Long ones collapse behind "Show more". */
  blurb: string;
  state: LabsState;
  /** Days until general availability, for `available`. */
  liveIn?: number;
  /**
   * Switchyard's own card is the one flag this prototype actually honours —
   * see `labs-page.tsx`. Everything else is a picture.
   */
  live?: boolean;
}

export interface SubAccountFlag extends LabsFlag {
  /**
   * Whether sub-accounts can see the flag at all, independent of whether it
   * is on. Visibility and activation are two decisions and the real page
   * keeps them apart: an agency can let its accounts SEE a beta without
   * turning it on for them.
   */
  visible: "all" | "none";
  /** How far activation has reached. Drawn as the outlined pill. */
  reach: "all" | "specific" | "none" | null;
}

/**
 * The flag this prototype is actually about.
 *
 * Declared once and spread into both tabs, because it is one feature with
 * two audiences — the agency turns it on for itself, and then decides
 * whether its accounts get it. Two literals would be two things to keep in
 * step, and the day they disagreed the page would be quietly teaching that
 * a flag can mean different things at different scopes.
 */
const SWITCHYARD = {
  id: "switchyard",
  /*
   * Named for what it IS, not for what it is called internally.
   *
   * "Switchyard" is the project's name and means nothing to an agency owner
   * reading Labs — it is the sort of codename that gets shipped by accident
   * and then has to be explained in every support thread afterwards. The
   * title is the promise instead, with the colon-prefixed codename of the
   * reference card deliberately dropped. Ashwin, Oct 13.
   *
   * The id stays `switchyard`: that is what the rollout store, the shell and
   * every preview link key off, and renaming data to match a label is how a
   * prototype ends up with two names for one flag.
   */
  name: "A New Design Experience, Starting with Navigation",
  headline: "A New Design Experience, Starting with Navigation",
  /*
   * Not rendered on this card — see SWITCHYARD_POINTS, which replaces it —
   * but kept, and kept accurate.
   *
   * It is what the card would say if it ever fell back to the ordinary
   * treatment, and `LabsFlag` requires it of every flag so that the search
   * and the two pictured tabs have one shape to read. A placeholder here
   * would be a lie waiting for the first person who widens the filter.
   */
  blurb:
    "A rebuilt left navigation: categories you can arrange, pinned items with keyboard shortcuts, and a product directory that replaces the old flyout. Switching it on changes the nav for everyone in this agency — sub-accounts keep the old one until you enable it for them below.",
} as const;

/**
 * What the card promises, as four claims rather than a paragraph.
 *
 * The ordinary flag gets a blurb because the ordinary flag is a sentence
 * long. This one is a navigation replacing a navigation, and the question
 * its reader actually has is "what do I get, and what breaks" — which a
 * paragraph answers only by being read in full. Four ticked lines answer it
 * by being scanned.
 *
 * The fourth is the one that matters and it is deliberately last: every
 * other line is an offer, and that one is the reassurance the offer needs.
 * An agency owner reading a nav beta is not asking what it adds, they are
 * asking what it takes away.
 */
export const SWITCHYARD_POINTS: readonly { title: string; body: string }[] = [
  {
    title: "Make it theirs",
    body: "Rename, reorder and hide groups so each sub-account looks built for its business.",
  },
  {
    title: "Build once, apply everywhere",
    body: "Save a layout as a template and push it to every sub-account. One push updates them all.",
  },
  {
    title: "Stop hunting",
    body: "Pin the pages you live in, jump back to recent ones, and search any page, setting or record.",
  },
  {
    title: "Nothing else changes",
    body: "Every feature works as it does today. This changes how you move, not what you can do.",
  },
];

/**
 * The three things that are true and unwelcome, stated before the switch.
 *
 * On the card rather than in a support article, and above the footer's
 * Activate rather than below it, because all three are only discoverable
 * AFTERWARDS: an agency finds out its custom CSS is dead by looking at a
 * sidebar that has lost it. A beta that surprises its first takers does not
 * get second ones.
 *
 * Plainly worded and not softened. "Doesn't keep your layout" is the whole
 * fact; "your layout may not be preserved in all cases" is the same fact
 * written by someone hoping not to be asked about it.
 */
export const SWITCHYARD_CAVEATS: readonly string[] = [
  "Custom CSS and JS for the old sidebar doesn't run on the new navigation. You can switch it back on to compare.",
  "Turning it off brings back the old navigation but doesn't keep your layout.",
  "How much you can customize depends on your plan.",
];

/** What sits beside the preview button: what the click costs, which is nothing. */
export const SWITCHYARD_TRY_NOTE =
  "Opens in a new tab, only for you. Nothing to undo.";

/**
 * Where the two preview links go.
 *
 * `?scope=` is read once at startup by `useAccounts`, so a new tab opens on
 * the sidebar the link names rather than on whatever the default happens to
 * be. Two links and not one because the two navs are genuinely different
 * objects — the agency's is buckets of settings, the sub-account's is the
 * product tree — and a card that offered to "preview Switchyard" from the
 * Sub-Account tab and then showed the agency nav would be demonstrating the
 * wrong thing to the person deciding.
 *
 * `preview=1` is a second, separate flag, and it is what the opened tab
 * puts a band across the top for — see PREVIEW_BANNER_DEFAULT. Separate
 * from `scope` because the two say different things: `scope` is which
 * sidebar to build, `preview` is that this window is a look rather than a
 * workspace. Someone landing on `?scope=agency` by hand is not previewing
 * anything and should not be told they are.
 *
 * Relative, so the link survives being served from localhost, a preview
 * deployment or a share URL without anybody editing it.
 */
export const SWITCHYARD_PREVIEW = {
  agency: "?scope=agency&preview=1",
  sub: "?scope=account&preview=1",
} as const;

export const AGENCY_FLAGS: readonly LabsFlag[] = [
  {
    id: "ai-rebilling",
    name: "AI Suite Usage Rebilling Details",
    headline: "AI Suite Usage Rebilling Details",
    blurb: "AI Suite Usage Rebilling Details",
    state: "live",
  },
  {
    id: "implementation-experts",
    name: "Implementation Experts",
    headline: "Attach a certified Implementation Expert to your agency",
    blurb:
      "Find and attach certified Implementation Experts who build and run HighLevel for your agency. Once enabled, Implementation Experts appears in your agency settings with a directory, their certifications and the work they have delivered for agencies like yours.",
    state: "on",
  },
  {
    ...SWITCHYARD,
    state: "available",
    liveIn: 46,
    live: true,
  },
  {
    id: "snapshot-deps",
    name: "Snapshot asset dependencies",
    headline: "Snapshot asset dependencies",
    blurb:
      "This key is for snapshot asset dependencies, which will enable the UI elements all the same.",
    state: "live",
  },
  {
    id: "wallet-v2",
    name: "Wallet and billing v2",
    headline: "A rebuilt wallet with per-sub-account spend",
    blurb:
      "Breaks agency spend down by sub-account, product and month, with CSV export and a reconciliation view that matches what the card was charged.",
    state: "available",
    liveIn: 112,
  },
];

export const SUB_ACCOUNT_FLAGS: readonly SubAccountFlag[] = [
  {
    id: "hosted-numbers",
    name: "Hosted Numbers",
    headline: "Hosted Number Feature Flag",
    blurb: "Feature flag for Hosted Numbers",
    state: "available",
    liveIn: 53,
    visible: "all",
    reach: null,
  },
  {
    id: "video-analytics",
    name: "Video analytics",
    headline: "Video analytics",
    blurb: "Video analytics",
    state: "available",
    liveIn: 1,
    visible: "all",
    reach: "specific",
  },
  {
    ...SWITCHYARD,
    state: "available",
    liveIn: 46,
    visible: "all",
    reach: "none",
    live: true,
  },
  {
    id: "email-verification",
    name: "Email Verification in Contact Imports",
    headline: "Verify email addresses while importing contacts",
    blurb:
      "Turn on email verification for your sub-account directly from the contact import flow. On the final Verify step, opt in to verify the email addresses in the file before the contacts are created, so bad addresses never enter the account.",
    state: "available",
    liveIn: 84,
    visible: "all",
    reach: "none",
  },
  {
    id: "conversation-ai-v3",
    name: "Conversation AI v3",
    headline: "Conversation AI v3",
    blurb:
      "A new model behind the conversational agent, with better intent matching on short replies and support for appointment booking mid-thread.",
    state: "available",
    liveIn: 7,
    visible: "none",
    reach: "none",
  },
];

/** What the outlined pill says about how far activation has reached. */
export const REACH_LABELS: Record<
  NonNullable<SubAccountFlag["reach"]>,
  string
> = {
  all: "Enabled for all sub-accounts",
  specific: "Enabled for specific sub-accounts",
  none: "Disabled for all sub-accounts",
};

/**
 * How long a blurb may run before it collapses.
 *
 * Measured in characters rather than lines because the card is fluid and a
 * line count would mean something different at every width. 150 is where
 * the two real examples in the screenshots sit — long enough that the one-
 * line flag names never collapse, short enough that the two paragraphs do.
 */
export const BLURB_CLAMP = 150;
