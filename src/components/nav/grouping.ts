import type { LucideIcon } from "lucide-react";
import type { CatalogueChild } from "./catalogue-types";
import {
  Folder,
  GamepadDirectional,
  History,
  Pin,
  Rocket,
} from "lucide-react";
import {
  allProducts,
  catalogue,
  catalogueGroups,
  catalogueJobs,
  catalogueSuites,
  childById,
  DEFAULT_PINNED,
  productById,
  type CatalogueEntry,
  type CatalogueGroup,
} from "./catalogue";
import {
  PROPOSED_DESTINATION_IDS,
  PROPOSED_PRODUCT_IDS,
  PROPOSED_UNLISTED_IDS,
  proposedBuckets,
} from "./proposed-ia";
import { resolveOwned } from "./catalogue-equivalents";
import { iconByName, nameForIcon } from "./icon-catalogue";
import { chromePlace, isChromePlace } from "./chrome-places";
import { iconForChildLabel } from "./l3-icons";

/**
 * How the nav's middle section is organized.
 *
 * The five modes are five answers to the first question in the nav research
 * — "what is the rail *for*?" — rather than five cosmetic layouts:
 *
 *  default  Grouped by product area: CRM, Marketing, Content, Sales, Revenue,
 *           Agents, Automation, Reporting. The tree new accounts get, locked in
 *           the Aug 18 review — HubSpot's shape, chosen because the market has
 *           already validated it and nobody in the room claimed to be the expert
 *           on ideal grouping. Revisit on usage data, not on taste.
 *  product  Grouped by SKU: Engage, Convert, Market, Automate, Analyze. What we
 *           ship today. The Console/Catalog archetype — "a grouped shelf of
 *           products I've provisioned."
 *  job      Grouped by the outcome the user came for. Tenet 4, validated by
 *           HubSpot's job-based nav; the research calls this the right unit and
 *           the highest-risk change, which is exactly why it needs a prototype.
 *  flat     No groups at all. Every product is a top-level row, alphabetical,
 *           with search carrying the long tail — the Command-first archetype.
 *           Honest about the tradeoff: it is the right shape for a small account
 *           and visibly the wrong one for a large one.
 *  custom   The user's own groups. The third controller the research says the
 *           field has and we lack.
 *
 * The first four are views of one catalogue — every product carries a groupId, a
 * jobId and a suiteId — so switching is lossless. Custom is a real tree, seeded
 * from whichever mode was showing when the user switched, so "start over"
 * never means "start from nothing".
 */
export type GroupingMode =
  | "default"
  | "product"
  | "job"
  | "flat"
  | "custom"
  /**
   * The Aug 19 proposal: twelve buckets over their own product set.
   *
   * Deliberately absent from `GROUPING_MODES` below, so it never appears in the
   * mode picker. The other five are views of one catalogue and switching between
   * them is lossless; this one has its own products, so pointing an existing
   * account at it would leave every bucket empty — `populated()` would drop the
   * lot. It is reached by seeding an account onto it, not by a switch.
   */
  | "proposed";

// Default first, as everywhere else in this codebase — the order here is the
// order of both the picker grid and the prototype panel's segmented control.
export const GROUPING_MODES: readonly GroupingMode[] = [
  "default",
  "product",
  "job",
  "flat",
  "custom",
] as const;

export const GROUPING_LABELS: Record<GroupingMode, string> = {
  default: "Default",
  product: "Product",
  job: "Jobs",
  flat: "Flat",
  custom: "Custom",
  proposed: "Proposed",
};

export const GROUPING_BLURBS: Record<GroupingMode, string> = {
  default:
    "Grouped by area — CRM, marketing, sales, revenue. What new accounts get.",
  product: "Grouped by SKU — what ships today.",
  job: "Grouped by outcome. Tenet 4, validated by HubSpot.",
  flat: "No groups. Every product a row, search for the tail.",
  custom: "The user's own groups, seeded from the mode you left.",
  proposed:
    "The Aug 19 proposal — twelve buckets over their own product set.",
};

/**
 * How much the account has bolted onto its nav.
 *
 * A stress control, not a product setting. Overflow only showed up before by
 * switching to flat grouping, which changes row *structure* as well as row count
 * — two variables at once, and not the case the review actually named. The real
 * one is "users who add many custom links", so this varies exactly that.
 */
export const NAV_VOLUMES = ["default", "busy", "heavy", "overloaded"] as const;

export type NavVolume = (typeof NAV_VOLUMES)[number];

export const NAV_VOLUME_LABELS: Record<NavVolume, string> = {
  default: "Default",
  busy: "Busy",
  heavy: "Heavy",
  overloaded: "Overloaded",
};

/**
 * How many custom links each setting adds.
 *
 * Chosen against measurements, not by feel: the nav has zero spare height on a
 * 14-inch screen, so `busy` is deliberately the smallest number that tips it over
 * — that is the point it makes. `heavy` overflows a 16.2-inch screen too, and
 * `overloaded` is enough to exercise the floor tier.
 */
export const NAV_VOLUME_EXTRA_LINKS: Record<NavVolume, number> = {
  default: 0,
  busy: 6,
  heavy: 14,
  overloaded: 30,
};

/** Who a label override belongs to. Both levels exist so the tradeoff is demoable. */
export type LabelScope = "agency" | "account";

/**
 * Who is editing. Straight from the research's second question, "who *controls*
 * it?" — the field layers product-curated, agency-configured and
 * user-personalized, and the answer decides what each role may touch.
 *
 * Three roles across TWO tenancies, which the old labels — "User", "Admin",
 * "Agency" — did not say:
 *
 *  user    A person inside a sub-account. Pins and their own labels; no
 *          structure, and no edit mode at all.
 *  admin   An administrator OF a sub-account. Everything `user` has, plus
 *          grouping, order, icons and names that every user in THAT
 *          sub-account sees. Cannot write anything the agency inherits.
 *  agency  An administrator of the agency, above all of its sub-accounts. The
 *          only role that may write at agency scope — see `writeAgencyScope` —
 *          which is what makes a change a default every account picks up.
 *
 * So `admin` is the sub-account admin and `agency` is the agency admin. Both
 * are "admin" in conversation, which is exactly why the labels now say which.
 */
export type NavRole = "user" | "admin" | "agency";

export const NAV_ROLES: readonly NavRole[] = ["user", "admin", "agency"] as const;

/**
 * The roles the prototype panel offers, which is not all of them.
 *
 * `admin` is withheld for now: with restructuring moved up to the agency it
 * has exactly the nav permissions a plain user has, so offering it would be a
 * third button that changes nothing on screen — and a control whose options
 * are indistinguishable teaches the reader that the axis does not matter.
 *
 * It stays in `NAV_ROLES`, and in the model, because the sub-account admin is
 * a real role that the product distinguishes elsewhere; the moment nav gives
 * it something of its own back, this list is where it returns.
 */
export const NAV_ROLES_OFFERED: readonly NavRole[] = ["user", "agency"] as const;

export const ROLE_LABELS: Record<NavRole, string> = {
  user: "Sub-account user",
  admin: "Sub-account admin",
  agency: "Agency admin",
};

export interface NavPermissions {
  /** Everyone can curate their own fast-path. The lowest-risk win. */
  pin: boolean;
  /** Rename groups and products for themselves only. */
  renameForSelf: boolean;
  /** Rename for every user in the sub-account. */
  renameForEveryone: boolean;
  /** Change the grouping mode, reorder groups, change icons. */
  regroup: boolean;
  /** Build and edit custom groups. */
  customise: boolean;
  /** Write at agency scope, which becomes the default every account inherits. */
  writeAgencyScope: boolean;
}

/**
 * What each role may do.
 *
 * A plain user gets the personalization layer and nothing structural: pins,
 * order, and labels only they see. Structure is governed, which is the property
 * the research says HighLevel should keep while adding a personal fast-path on
 * top of it.
 */
export function permissionsFor(role: NavRole): NavPermissions {
  /*
   * Restructuring is an AGENCY capability, not an administrative one.
   *
   * It used to be `role !== "user"`, which handed the whole editor to a
   * sub-account admin. That reads reasonably until you notice what the editor
   * is for: this nav is the agency's product surface, the thing it white-labels
   * and sells, and a client-side admin rearranging it is the tenant editing
   * something the agency is on the hook for. It also collided with the plan
   * ladder — nav editing is priced at the AGENCY tier, and a sub-account admin
   * has no plan of their own to have bought it with.
   *
   * So the sub-account keeps what is genuinely personal — pins, their order,
   * and labels only that person sees — and everything structural moves up.
   * Which leaves `admin` and `user` with identical nav permissions today; the
   * role stays in the model because the distinction is real everywhere else in
   * the product and may come back here.
   */
  const agency = role === "agency";
  return {
    pin: true,
    renameForSelf: true,
    renameForEveryone: agency,
    regroup: agency,
    customise: agency,
    writeAgencyScope: agency,
  };
}

/** The nav's non-tree blocks, each of which the account can switch off. */
export type NavBlock = "launchpad" | "recent" | "quickActions" | "pinned";

/**
 * In the order the nav draws them: the dock, the setup card, Recent, then Quick
 * Actions. A settings list whose order does not match what it is describing makes
 * the reader map one onto the other every time they look.
 */
export const NAV_BLOCKS: readonly NavBlock[] = [
  "pinned",
  "launchpad",
  "recent",
  "quickActions",
];

/** The names the nav itself uses. "Pinned", not "Favourites" — the row says Pinned. */
export const NAV_BLOCK_LABELS: Record<NavBlock, string> = {
  pinned: "Pinned",
  launchpad: "Launchpad",
  recent: "Recent",
  quickActions: "Quick Actions",
};

/**
 * The glyph each block wears in the nav.
 *
 * The same icons, not near-misses: the list is a list of things you can see on
 * screen, so recognising one should not require reading its name.
 */
export const NAV_BLOCK_ICONS: Record<NavBlock, LucideIcon> = {
  pinned: Pin,
  launchpad: Rocket,
  recent: History,
  quickActions: GamepadDirectional,
};

export function isBlockHidden(state: NavLayoutState, block: NavBlock): boolean {
  return state.hiddenBlocks.includes(block);
}

/**
 * Whether this category or row is switched off.
 *
 * Hiding is not removing. A category the account does not want is still a
 * category the agency provisioned, and a product taken out of the nav is still a
 * product they are paying for — so the tree keeps them and the nav stops drawing
 * them. Which also means the way back is the same gesture as the way out, in the
 * same place, instead of a search through a list of everything.
 */
export function isRowHidden(state: NavLayoutState, id: string): boolean {
  return state.hiddenRows.includes(id);
}

export function withRowHidden(
  state: NavLayoutState,
  id: string,
  hidden: boolean,
): NavLayoutState {
  const has = state.hiddenRows.includes(id);
  if (has === hidden) return state;
  return {
    ...state,
    hiddenRows: hidden
      ? [...state.hiddenRows, id]
      : state.hiddenRows.filter((x) => x !== id),
  };
}

export interface CustomGroup {
  id: string;
  label: string;
  /** Stored by name so the tree survives serialisation. */
  iconName: string;
  productIds: string[];
}

export interface NavLayoutState {
  /**
   * What the agency provisioned for this account — the products the nav is
   * allowed to show at all.
   *
   * The catalogue is what HighLevel ships; this is what one tenant bought. A
   * dentist has no storefront and a roofer has no courses, so every view of the
   * catalogue filters through this, and a group left with nothing in it is
   * dropped rather than drawn empty. Seeded per account in
   * `account-nav-profiles.ts`.
   */
  enabledProducts: string[];
  /**
   * The links this account bolted on beside the products — its own portals and
   * tools, not catalogue rows. Separate from the volume switch's generated
   * links, which are a stress control rather than something a tenant chose.
   */
  customLinks: string[];
  /**
   * The order of the nav's tail — the rows that belong to no category.
   *
   * Its own list because the tail is not one kind of thing: it holds products no
   * category claims AND the account's own links, and the two have nowhere else
   * to be ordered together. Empty means "however they came out", which is
   * catalogue order followed by the account's links.
   */
  tailOrder: string[];
  /**
   * Row order inside the nav's own panels, keyed by panel id.
   *
   * The companion-app panel is the case: its two rows are authored, not
   * catalogue, so no group holds them and `tailOrder` has nothing to say about
   * rows that are not in the tail. Held as a diff against the authored order —
   * a panel that gains a row in a later release shows it rather than having it
   * swallowed by a saved list that predates it. Same rule, and the same reason,
   * as the agency store's `childOrder`.
   */
  panelOrder: Record<string, string[]>;
  /**
   * Children the account has moved under a different product.
   *
   * Keyed by CHILD id, valued with the product that now owns it — the
   * narrowest thing that can express the move, and deliberately not a
   * per-parent list of children. A list would have to be kept in step with
   * the catalogue's own (a product that gains a child in a later release must
   * show it, not have it swallowed by a saved array that predates it), and
   * keeping two orderings honest is the bug `panelOrder` exists to avoid. An
   * override map answers one question — "has this child been re-homed?" — and
   * says nothing about the ones nobody has touched.
   *
   * The catalogue stays frozen, which is the point. A child still belongs to
   * the product that authored it; this is the ACCOUNT saying where it wants
   * the row drawn, exactly as `tailOrder` does for a lifted one.
   *
   * Order within the new parent is `panelOrder`'s job, as it already is for
   * the children that never moved — one of those two records where, the other
   * records how far down.
   */
  childOf: Record<string, string>;
  /**
   * The standing blocks the account has switched off.
   *
   * Recent, Quick Actions and the favourites dock are the three things in the nav
   * that are not the account's tree — they are conveniences over it. Which means
   * an agency can reasonably decide their clients do not want them, and until now
   * had no way to say so. Held as a set of what is OFF rather than what is on, so
   * a block added later is on by default.
   */
  hiddenBlocks: NavBlock[];
  /**
   * Categories and rows switched off, by id.
   *
   * Separate from `enabledProducts`, which is what the agency sold this account —
   * a different question with a different owner. This is what the account chose to
   * look at, and it is held as a set of what is OFF so a product added later
   * arrives visible.
   */
  hiddenRows: string[];
  /**
   * Ordered pinned product ids. Unlimited — the chip row is a window onto this
   * list, not a capacity, so nothing here is capped.
   */
  pinned: string[];
  grouping: GroupingMode;
  /** Group label overrides, keyed by group id, per scope. */
  agencyLabels: Record<string, string>;
  accountLabels: Record<string, string>;
  /** Product label overrides. Same two scopes, same precedence. */
  agencyProductLabels: Record<string, string>;
  accountProductLabels: Record<string, string>;
  /** Icon overrides by group or product id, as Lucide names. */
  icons: Record<string, string>;
  /** Group order per mode, only once the user has reordered it. */
  groupOrder: Partial<Record<GroupingMode, string[]>>;
  /** The user's own tree. Empty until they first switch to custom. */
  customGroups: CustomGroup[];
  /** Prototype switches: who is editing, and whether edit mode is on. */
  role: NavRole;
  labelScope: LabelScope;
  editing: boolean;
  /** How many custom links the account has piled on. A stress control. */
  navVolume: NavVolume;
}

export const DEFAULT_LAYOUT: NavLayoutState = {
  // An unconfigured account is on everything — which is precisely the state
  // every account used to be stuck in, and is now only the fallback.
  enabledProducts: catalogue.map((p) => p.id),
  customLinks: [],
  tailOrder: [],
  panelOrder: {},
  childOf: {},
  /*
   * Quick actions starts off (Aug 28).
   *
   * A block rather than a theme axis, so it is the ACCOUNT's answer and it
   * lands here — every seeded profile spreads this layout, so one entry turns
   * the row off for the whole demo set while leaving each account free to turn
   * it back on. Reachable from the nav's own Show / hide control and from the
   * prototype panel, which are the same switch.
   */
  hiddenBlocks: ["quickActions"],
  hiddenRows: [],
  pinned: DEFAULT_PINNED,
  // Areas by default, per the Aug 18 review: ship the tree the market has already
  // validated, and let usage data rather than taste decide whether it stays. Jobs
  // — which the research argued for and which this prototype opened on until now
  // — is one click away, and four sub-accounts are still seeded onto it so the
  // comparison has real tenants behind it rather than a switch on a panel.
  grouping: "default",
  agencyLabels: {},
  accountLabels: {},
  agencyProductLabels: {},
  accountProductLabels: {},
  icons: {},
  groupOrder: {},
  customGroups: [],
  role: "agency",
  labelScope: "account",
  editing: false,
  navVolume: "default",
};

/**
 * Modes that draw real headings.
 *
 * Flat has none by definition and custom is the user's own, so anything that
 * needs "a shipped tree worth copying" asks here rather than listing the modes
 * inline — a list that silently went stale the moment a fifth mode arrived.
 */
/**
 * Whether structure can be edited without leaving the mode.
 *
 * Custom is the tree the user built. Proposed joined it because the proposal is
 * an authored nested list with an order at both levels — exactly the shape the
 * custom tree stores — so an account can be handed the proposal and then adjust
 * it without the first edit throwing the whole arrangement away. The three
 * shipped modes stay views: a move there would mean the account silently
 * diverging from the product with no way back, so they seed a custom tree first.
 */
export function isStructuralMode(mode: GroupingMode): boolean {
  return mode === "custom" || mode === "proposed";
}

export function isGroupedMode(mode: GroupingMode): boolean {
  return (
    mode === "default" ||
    mode === "product" ||
    mode === "job" ||
    mode === "proposed"
  );
}

/** A group as the nav should render it, after grouping mode and overrides. */
export interface ResolvedGroup {
  id: string;
  /** After overrides. What the user sees. */
  label: string;
  /** The shipped name, which routes, permissions and search keep using. */
  defaultLabel: string;
  icon: LucideIcon;
  productIds: string[];
  /** True for groups the user created — those can be deleted and truly renamed. */
  custom: boolean;
}

const SHIPPED_GROUPS = new Map<string, CatalogueGroup>(
  [
    ...catalogueGroups,
    ...catalogueJobs,
    ...catalogueSuites,
    ...proposedBuckets,
  ].map((g) => [g.id, g]),
);

/**
 * Whether a group is one the PLATFORM authored, rather than one this account made.
 *
 * The distinction only started mattering when the default tree stopped being
 * pruned: a bucket can now be empty because the account owns nothing in it, and
 * that is not a mistake anyone can fix — there is no product to put in it. A
 * group the admin created and left empty is a different thing entirely, and
 * still theirs to finish.
 *
 * By id rather than by "is it in customGroups", because the first structural
 * edit materialises the authored tree INTO customGroups: after that every
 * bucket is a custom group by storage while still being the platform's by
 * origin. The ids survive that copy, so they are what the question hangs on.
 */
export function isAuthoredGroup(groupId: string): boolean {
  return SHIPPED_GROUPS.has(groupId);
}

/** The single flat pseudo-group. Flat mode has no headings, but surfaces that
 *  list groups (the launcher) still need something to list. */
const FLAT_GROUP_ID = "all-products";

/**
 * Where a product sits when no custom group claims it.
 *
 * Not a group the user manages — a destination. Products filed here draw as
 * plain top-level rows in the nav, which is how an account keeps three or four
 * things it uses constantly out from under a heading while everything else
 * stays filed.
 */
export const UNGROUPED_ID = "ungrouped";

export function defaultLabelForGroup(
  state: NavLayoutState,
  groupId: string,
): string {
  if (groupId === FLAT_GROUP_ID) return "All products";
  const custom = state.customGroups.find((g) => g.id === groupId);
  // A custom group's own label *is* its shipped name — there is nothing above
  // it to fall back to, so renaming it writes the group rather than an override.
  if (custom) return custom.label;
  return SHIPPED_GROUPS.get(groupId)?.defaultLabel ?? groupId;
}

/** Account override wins over agency, agency over the shipped name. */
export function labelForGroup(
  state: NavLayoutState,
  groupId: string,
): string {
  return (
    state.accountLabels[groupId] ??
    state.agencyLabels[groupId] ??
    defaultLabelForGroup(state, groupId)
  );
}

export function isGroupRenamed(
  state: NavLayoutState,
  groupId: string,
): boolean {
  return (
    state.accountLabels[groupId] !== undefined ||
    state.agencyLabels[groupId] !== undefined
  );
}

/**
 * A row's own name, before anything is said about where it came from.
 *
 * The rename overrides first — an explicit name is the whole answer, and the
 * qualifier below deliberately does not survive one. Then the catalogue: a
 * product's label, or a child's, since an L3 can be pinned and promoted and
 * every id that reaches the dock, the rail or the launcher has to resolve.
 */
export function baseLabelForProduct(
  state: NavLayoutState,
  productId: string,
): string {
  return (
    state.accountProductLabels[productId] ??
    state.agencyProductLabels[productId] ??
    productById(productId)?.label ??
    childById(productId)?.child.label ??
    // The nav's own rows — companion apps and whatever joins them. See
    // chrome-places: without this a pinned one reaches the dock as its id.
    chromePlace(productId)?.label ??
    productId
  );
}

/**
 * Every id the nav has lifted out of the tree and stood on its own.
 *
 * Pins, the tail, and whatever has been filed into a custom category — the
 * three places a row appears away from the panel it came from, which is
 * exactly where a bare "Settings" stops naming anything. Rows still sitting
 * inside their parent's flyout are not here: that panel's own title says which
 * Settings it is.
 */
function liftedRowIds(state: NavLayoutState): string[] {
  return [
    ...state.pinned,
    ...state.tailOrder,
    ...state.customGroups.flatMap((g) => g.productIds),
  ];
}

/**
 * Whether this L3 has to say which product it came from.
 *
 * Only on a real collision: a lifted row keeps its plain name until something
 * else standing beside it answers to the same one, at which point the ambiguity
 * is real and worth four extra words. The alternative — qualifying every L3 on
 * principle — makes "Sites › Blogs" out of a row nothing else is competing
 * with, and pays for it in every truncated nav row.
 */
function collidesWhenLifted(
  state: NavLayoutState,
  productId: string,
  label: string,
): boolean {
  const seen = new Set<string>();
  for (const id of liftedRowIds(state)) {
    // The same id can be pinned AND in the tail — that is one row in two
    // places, not two rows sharing a name.
    if (id === productId || seen.has(id)) continue;
    seen.add(id);
    if (baseLabelForProduct(state, id) === label) return true;
  }
  return false;
}

export function labelForProduct(
  state: NavLayoutState,
  productId: string,
): string {
  const base = baseLabelForProduct(state, productId);
  // A rename replaces the name outright, qualifier included: renaming is
  // usually how someone answers this very problem, and prefixing their answer
  // would be arguing with it.
  if (
    state.accountProductLabels[productId] !== undefined ||
    state.agencyProductLabels[productId] !== undefined
  ) {
    return base;
  }
  const hit = childById(productId);
  // Products are already unique names at the top of the tree. Only a row that
  // was lifted out of one can need to say where it came from.
  if (!hit || productById(productId)) return base;
  if (!collidesWhenLifted(state, productId, base)) return base;
  /*
   * The immediate parent, not the whole trail.
   *
   * At L3 that IS the product — "Opportunities › Settings", which is the case
   * this exists for. One level deeper it is the L3 above it, which is both
   * shorter and more use than repeating the product two rows running.
   *
   * Resolved through `labelForProduct` so a renamed parent carries its new name
   * into every child that names it.
   */
  const parentId = hit.path[hit.path.length - 1]?.id ?? hit.product.id;
  const parentLabel = labelForProduct(state, parentId);
  /*
   * A child that shares its parent's name says it once.
   *
   * Workflows ships a child called Workflows — the index under the product —
   * and lifting it out produced "Workflows › Workflows", which is the
   * qualifier doing the opposite of its job: the prefix exists to say WHICH
   * Workflows this is, and naming the same word twice answers nothing while
   * costing a truncated row. The collision that triggered it is real (the
   * product is standing right there), but it is not a collision the prefix
   * can resolve, so the row keeps its plain name. Ashwin, Oct 21.
   */
  if (parentLabel === base) return base;
  return `${parentLabel} › ${base}`;
}

/**
 * The parent a lifted row should wear the glyph of, or null.
 *
 * The exact condition `labelForProduct` uses to prefix a row with "Opportunities
 * › ", deliberately: the icon and the label are answering one question — "which
 * Settings is this" — and a row whose name says it was lifted while its glyph
 * says nothing is a row that solved the problem in text only. Three products
 * ship a Settings, and in a 16px dock there is no text at all.
 *
 * Null when nothing is ambiguous. A pinned "Pipelines" is unique, keeps its
 * plain name, and has no business wearing a badge that implies otherwise.
 */
export function qualifiedParentFor(
  state: NavLayoutState,
  productId: string,
): string | null {
  /*
   * A rename or a chosen icon is the user answering this themselves.
   *
   * Both are the gesture someone reaches for when two rows look alike, and
   * composing over the top of either would be arguing with the answer. The
   * rename rule is `labelForProduct`'s own; the icon rule is its equivalent for
   * the glyph, and it has to be here rather than there because only this
   * function is about the glyph.
   */
  if (
    state.accountProductLabels[productId] !== undefined ||
    state.agencyProductLabels[productId] !== undefined ||
    state.icons[productId] !== undefined
  ) {
    return null;
  }
  const hit = childById(productId);
  // Products are already unique at the top of the tree; only a lifted row can
  // need to say where it came from.
  if (!hit || productById(productId)) return null;
  if (!collidesWhenLifted(state, productId, baseLabelForProduct(state, productId))) {
    return null;
  }
  // The immediate parent, matching the label's own qualifier exactly — at L3
  // that is the product, one level deeper it is the L3 above.
  const parentId = hit.path[hit.path.length - 1]?.id ?? hit.product.id;
  /*
   * And no badge where the label takes no prefix — same rule, same reason.
   * The pair has to agree: a row reading plain "Workflows" while wearing its
   * parent's glyph badged with its own would be the glyph claiming a
   * distinction the name has just dropped.
   */
  if (
    labelForProduct(state, parentId) === baseLabelForProduct(state, productId)
  ) {
    return null;
  }
  return parentId;
}

/**
 * What a row draws: one glyph, or a parent's glyph badged with its own.
 *
 * The base is the PARENT, not the row — which reads backwards until you look at
 * a dock. Five gears in a row say nothing; five different marks, each with a
 * small gear on the corner, say "settings for five different things", and the
 * thing you are actually looking for is the part that differs.
 */
export function glyphFor(
  state: NavLayoutState,
  productId: string,
): { icon: LucideIcon; badge?: LucideIcon } {
  const parentId = qualifiedParentFor(state, productId);
  if (!parentId) return { icon: iconForProduct(state, productId) };
  return {
    icon: iconForProduct(state, parentId),
    badge: iconForProduct(state, productId),
  };
}

export function isProductRenamed(
  state: NavLayoutState,
  productId: string,
): boolean {
  return (
    state.accountProductLabels[productId] !== undefined ||
    state.agencyProductLabels[productId] !== undefined
  );
}

function defaultIconForGroup(
  state: NavLayoutState,
  groupId: string,
): LucideIcon {
  if (groupId === FLAT_GROUP_ID) return Folder;
  const custom = state.customGroups.find((g) => g.id === groupId);
  if (custom) {
    /*
     * The shipped icon before the folder.
     *
     * A stored group only holds its icon's *name*, and a name can only be
     * resolved back if the icon is one the picker offers — which most of the
     * proposal's bucket glyphs are not. So a proposed account that seeded its
     * tree on the first edit had every category turn into a folder. Falling
     * through to the group's own id is right in general: a seeded bucket keeps
     * the id it was authored under, so the authored icon is still its default.
     */
    return (
      iconByName(custom.iconName) ?? SHIPPED_GROUPS.get(groupId)?.icon ?? Folder
    );
  }
  return SHIPPED_GROUPS.get(groupId)?.icon ?? Folder;
}

export function iconForGroup(
  state: NavLayoutState,
  groupId: string,
): LucideIcon {
  return iconByName(state.icons[groupId]) ?? defaultIconForGroup(state, groupId);
}

export function iconForProduct(
  state: NavLayoutState,
  productId: string,
): LucideIcon {
  const hit = childById(productId);
  const shipped =
    productById(productId)?.icon ??
    // The same rule the panel uses, so a row keeps the glyph it was pinned
    // with: its own if authored, otherwise the one its label earns. Never the
    // parent's — a pinned "SEO" wearing the Sites icon is indistinguishable
    // from Sites itself in the dock.
    hit?.child.icon ??
    (hit ? iconForChildLabel(hit.child.label) : undefined) ??
    chromePlace(productId)?.icon ??
    Folder;
  return iconByName(state.icons[productId]) ?? shipped;
}

export function isIconOverridden(
  state: NavLayoutState,
  targetId: string,
): boolean {
  return state.icons[targetId] !== undefined;
}

/**
 * Applies the user's group order to a mode's default order.
 *
 * Ids the saved order does not mention keep their shipped position at the end,
 * so a group added by a later release appears rather than vanishing — the order
 * is a preference, not a whitelist.
 */
export function applyOrder(
  saved: string[] | undefined,
  defaults: string[],
): string[] {
  if (!saved) return defaults;
  const known = saved.filter((id) => defaults.includes(id));
  const missing = defaults.filter((id) => !known.includes(id));
  return [...known, ...missing];
}

/**
 * The products this account is actually on.
 *
 * One place to ask, so no surface can accidentally reason about the catalogue
 * when it means the tenant's slice of it.
 */
export function enabledSetFor(state: NavLayoutState): Set<string> {
  return new Set(state.enabledProducts);
}

export function isProductEnabled(
  state: NavLayoutState,
  productId: string,
): boolean {
  return state.enabledProducts.includes(productId);
}

/** The account's products, in catalogue order — from either IA. */
export function enabledProducts(state: NavLayoutState): CatalogueEntry[] {
  const enabled = enabledSetFor(state);
  return allProducts.filter((p) => enabled.has(p.id));
}

/**
 * Provisions or de-provisions a product, and repairs everything that pointed
 * at it.
 *
 * Turning a product off has to take it out of the dock and out of whatever
 * custom group it was filed in, or it survives as a pin to a place the account
 * no longer has. Turning one on is the easy direction: it appears in its group
 * and nothing else has to move.
 */
export function withProduct(
  state: NavLayoutState,
  productId: string,
  enabled: boolean,
): NavLayoutState {
  const has = state.enabledProducts.includes(productId);
  if (has === enabled) return state;
  if (enabled) {
    // Catalogue order, so a product returns to where it was rather than to the
    // end of the list.
    const next = new Set([...state.enabledProducts, productId]);
    return {
      ...state,
      enabledProducts: allProducts
        .filter((p) => next.has(p.id))
        .map((p) => p.id),
    };
  }
  return {
    ...state,
    enabledProducts: state.enabledProducts.filter((id) => id !== productId),
    pinned: state.pinned.filter((id) => id !== productId),
    customGroups: state.customGroups.map((g) =>
      g.productIds.includes(productId)
        ? { ...g, productIds: g.productIds.filter((id) => id !== productId) }
        : g,
    ),
  };
}

/**
 * Every group the active mode shows, in the order it shows them.
 *
 * The tree, then what the account chose to look at. Filtering here rather than in
 * each surface means the nav, the rail, the launcher, search, the breadcrumb and
 * every flyout inherit one answer — and that edit mode, which filters nothing,
 * can show a hidden row so it can be switched back on.
 */
export function resolveGroups(state: NavLayoutState): ResolvedGroup[] {
  const groups = resolveTree(state);
  if (state.editing || state.hiddenRows.length === 0) return groups;
  const hidden = new Set(state.hiddenRows);
  const out: ResolvedGroup[] = [];
  for (const group of groups) {
    if (hidden.has(group.id)) continue;
    const productIds = group.productIds.filter((id) => !hidden.has(id));
    /*
     * A category whose every row is hidden is a door to an empty panel, so it
     * goes too. One the admin simply has not filled yet is a different thing and
     * stays — which is why this asks whether HIDING emptied it rather than
     * whether it is empty.
     */
    if (productIds.length === 0 && group.productIds.length > 0) continue;
    out.push(
      productIds.length === group.productIds.length
        ? group
        : { ...group, productIds },
    );
  }
  return out;
}

function resolveTree(state: NavLayoutState): ResolvedGroup[] {
  const enabled = enabledSetFor(state);
  const build = (
    ids: string[],
    productsFor: (id: string) => string[],
    custom: boolean,
  ): ResolvedGroup[] =>
    ids.map((id) => ({
      id,
      label: labelForGroup(state, id),
      defaultLabel: defaultLabelForGroup(state, id),
      icon: iconForGroup(state, id),
      /*
        Enabled, or a CHILD of something enabled.

        `enabledSetFor` answers for products, because provisioning is a
        product-level fact — an account buys Conversations, not Inbox. Once a
        child can be filed into a category as a row of its own (Oct 9), that
        filter started throwing those rows away: the move committed, the toast
        named it, and the panel drew the category without it. The third time
        today that a row was written to state and filtered back out on the
        way to the screen.

        A child rides on its product's provisioning, which is the honest rule
        — switch Conversations off and its Inbox row goes with it, wherever
        the account has since put it.
      */
      productIds: productsFor(id).filter(
        (pid) =>
          enabled.has(pid) ||
          (childById(pid) !== undefined &&
            enabled.has(childById(pid)!.product.id)),
      ),
      custom,
    }));

  /**
   * A heading with nothing under it is worse than no heading: it opens an empty
   * panel and implies the account owns something it does not. Shipped groups
   * therefore disappear for accounts that bought none of their products — which
   * is how a five-product barbershop ends up with two groups rather than five.
   * Custom groups are exempt: the user made them, so an empty one is a shelf
   * they are still filling, not a mistake.
   */
  const populated = (groups: ResolvedGroup[]): ResolvedGroup[] =>
    groups.filter((g) => g.productIds.length > 0);

  switch (state.grouping) {
    case "default": {
      const ids = applyOrder(
        state.groupOrder.default,
        catalogueSuites.map((g) => g.id),
      );
      return populated(
        build(
          ids,
          (id) => catalogue.filter((p) => p.suiteId === id).map((p) => p.id),
          false,
        ),
      );
    }
    case "product": {
      const ids = applyOrder(
        state.groupOrder.product,
        catalogueGroups.map((g) => g.id),
      );
      return populated(
        build(
          ids,
          (id) => catalogue.filter((p) => p.groupId === id).map((p) => p.id),
          false,
        ),
      );
    }
    case "job": {
      const ids = applyOrder(
        state.groupOrder.job,
        catalogueJobs.map((g) => g.id),
      );
      return populated(
        build(
          ids,
          (id) => catalogue.filter((p) => p.jobId === id).map((p) => p.id),
          false,
        ),
      );
    }
    case "flat": {
      const ids = [...catalogue]
        .sort((a, b) =>
          labelForProduct(state, a.id).localeCompare(
            labelForProduct(state, b.id),
          ),
        )
        .map((p) => p.id);
      return build([FLAT_GROUP_ID], () => ids, false);
    }
    case "proposed": {
      /*
       * Membership lives on the bucket here, not on the product — the proposal
       * is an authored nested list with an order at both levels, so one array
       * holds it rather than a key repeated across ninety products. Which makes
       * this case a near-copy of `custom` below rather than of the three
       * shipped-tree cases above.
       */
      /*
       * Once the account has edited its tree, the edited tree IS the proposal.
       *
       * customGroups is empty until the first structural edit, so what the nav
       * draws is the authored buckets; after one it draws what the admin left
       * behind, still in proposed mode. Editing in place would otherwise cost
       * the account everything the mode carries — the band order, Settings as a
       * flyout rather than a row — for the sake of renaming one heading.
       */
      const edited = state.customGroups.length > 0;
      const ids = applyOrder(
        state.groupOrder.proposed,
        (edited ? state.customGroups : proposedBuckets).map((b) => b.id),
      );
      // Only membership is read here, and a bucket and a stored group agree on
      // that much even though they disagree about everything else.
      const byId = new Map<string, { productIds: readonly string[] }>(
        (edited ? state.customGroups : proposedBuckets).map(
          (g) => [g.id, g] as const,
        ),
      );
      /*
       * Membership resolved through the equivalence map, not matched literally.
       *
       * The buckets name `ia-*` ids, and an account provisioned on the shipped
       * catalogue owns `conversations` rather than `ia-crm-conversations`. A
       * literal `enabled.has` therefore matched nothing for every account but
       * the one seeded on the proposed set — so this tree was unreachable for
       * the other sixteen, and the HighLevel default meant two different navs
       * depending on which catalogue an account happened to be provisioned on.
       *
       * `resolveOwned` is the same translation templates already use to cross
       * between the two namings. A bucket is a statement about which PRODUCTS
       * belong together, and that survives the account calling them something
       * else.
       */
      const built = build(
        ids,
        (id) =>
          (byId.get(id)?.productIds ?? [])
            .map((pid) => {
              /*
                A CHILD rides on its product's provisioning, and keeps its
                own id.

                `resolveOwned` answers for products: it looks the id up in
                `enabled`, which holds product ids only, so a child spliced
                into a bucket resolved to undefined and was filtered out —
                the same disappearance the custom branch had, reached by a
                different route. Translating it would be wrong as well as
                unnecessary: a child id is not a product id in either
                catalogue, so there is nothing to cross over to.

                Chrome rows are admitted for the same reason they are in the
                custom branch — once "Move to" can file one into a category,
                an edited proposed tree can hold one too. Ashwin, Oct 21.
              */
              const child = childById(pid);
              if (child)
                return enabled.has(child.product.id) ? pid : undefined;
              if (isChromePlace(pid)) return pid;
              return resolveOwned(pid, enabled);
            })
            .filter((pid): pid is string => pid !== undefined),
        edited,
      );
      /*
       * The authored tree keeps every bucket, whether or not this account owns
       * anything in it.
       *
       * Pruning was right while this tree belonged to one account seeded on the
       * proposed catalogue: a bucket with nothing in it was an authoring
       * mistake. It is the platform's default tree now, handed to every
       * sub-account by the HighLevel default template — and there, pruning
       * means the same template produces a different nav for every account,
       * which is the one thing a default cannot do. Two accounts on it are
       * meant to be looking at the same thing.
       *
       * A bucket an account owns nothing in opens an empty panel, which is a
       * real cost and the honest one: the alternative is a nav whose shape
       * silently encodes billing. An edited tree still keeps everything, for
       * the reason it always did.
       */
      const groups = built;
      /*
       * Launchpad owns no products, so it is never a bucket — it is a
       * top-level row, filed exactly as the custom tree files what no group
       * claims. Which is also why the edited tree asks the same question the
       * custom case does rather than naming it: by then a row can be loose
       * because the admin pulled it out of a bucket.
       *
       * Mobile used to be the other one. It left when the companion apps became
       * a placement axis — see GET_APP_PLACEMENTS — so the destination band is
       * empty for now and this simply produces no extra group.
       */
      const loose = edited
        ? // Launchpad is reachable and never a row — the card above Recent is
          // its only nav affordance. `looseProductIds` answers "filed nowhere",
          // which after an edit is true of it, so it has to be excluded or the
          // first drag puts a second Launchpad in the nav. See
          // `withoutUnlistedIds` for why the same line appears four times.
          withoutUnlistedIds(looseProductIds(state, groups))
        : PROPOSED_DESTINATION_IDS.filter((id) => enabled.has(id));
      if (loose.length === 0) return groups;
      return [
        ...groups,
        {
          id: UNGROUPED_ID,
          label: labelForGroup(state, UNGROUPED_ID),
          defaultLabel: "Top level",
          icon: iconForGroup(state, UNGROUPED_ID),
          productIds: [...loose],
          custom: false,
        },
      ];
    }
    case "custom": {
      const ids = applyOrder(
        state.groupOrder.custom,
        state.customGroups.map((g) => g.id),
      );
      const byId = new Map(state.customGroups.map((g) => [g.id, g]));
      const groups = build(
        ids,
        (id) =>
          (byId.get(id)?.productIds ?? []).filter(
            /*
              A category holds products, the nav's own chrome rows — since
              "Move to" started offering them — and, since Oct 21, CHILDREN.
              All three draw the same way: the resolvers answer for any of
              them. Anything else is a stale id from a catalogue this account
              no longer has.

              The child case is what `withChildInGroup` has always written
              and this has never admitted. Drag an L3 out to the panel it
              sits in and the move committed, the toast said so, the undo
              was real — and then this filter dropped the id on the way to
              the screen, so the row simply was not there. State said one
              thing and the nav drew another. See `lostAllChildren` for the
              sibling case, and the note on the entitlement filter above:
              this is the same bug one function along.
            */
            (pid) =>
              productById(pid) !== undefined ||
              isChromePlace(pid) ||
              childById(pid) !== undefined,
          ),
        true,
      );
      // Anything no group claims is a top-level row: still reachable, still
      // ordered, just without a heading over it. Collected here rather than in
      // each surface so the nav, the launcher and search agree on what is loose.
      /*
       * Excluded here for the reason given on `withoutUnlistedIds`, and this
       * is the branch where the omission actually showed.
       *
       * Launchpad is permanently "filed nowhere", which was harmless while
       * the account sat on `proposed` — the branch above catches it by name.
       * But saving a template flips the account to `custom`, and this branch
       * took every unclaimed id at face value, so a Launchpad row appeared in
       * the nav after a save nobody had asked for it in. An account that is
       * genuinely custom never owned the id, so the filter is inert there.
       */
      const loose = withoutUnlistedIds(looseProductIds(state, groups));
      if (loose.length === 0) return groups;
      return [
        ...groups,
        {
          id: UNGROUPED_ID,
          label: labelForGroup(state, UNGROUPED_ID),
          defaultLabel: "Top level",
          icon: iconForGroup(state, UNGROUPED_ID),
          productIds: loose,
          custom: false,
        },
      ];
    }
  }
}

/**
 * Seeds the custom tree from whichever mode is showing.
 *
 * Switching to Custom with an empty tree would drop the user into a nav made
 * entirely of "Everything else" — technically correct, useless as a starting
 * point. Seeding means the first custom edit is a rename, not a rebuild.
 */
export function seedCustomGroups(state: NavLayoutState): CustomGroup[] {
  if (state.customGroups.length > 0) return state.customGroups;
  // Only a grouped mode is worth copying. Seeding from flat produces exactly one
  // group holding all 23 products, which is not a starting point for building
  // groups — it is the absence of them.
  const source: GroupingMode = isGroupedMode(state.grouping)
    ? state.grouping
    : "default";
  const groups = resolveGroups({ ...state, grouping: source });
  return (
    groups
      /*
       * "Top level" is not a group. It is the name resolveGroups gives to what
       * no group claimed, so seeding it would turn the absence of a shelf into
       * a shelf — and in the proposal's case put Launchpad and Mobile behind a
       * heading they were deliberately kept out of.
       */
      .filter((g) => g.id !== UNGROUPED_ID)
      .map((g) => ({
        /*
         * Proposed keeps its ids. The prefix exists so a custom group cannot
         * collide with a shipped suite it was copied from, but the proposal's
         * buckets ARE the ids the rest of the nav is keyed on — the Settings
         * bucket nav-entries holds back, the labels and icons SHIPPED_GROUPS
         * supplies, the order stored under groupOrder.proposed. Rename them and
         * the account keeps its products and loses its arrangement.
         */
        id: source === "proposed" ? g.id : `custom-${g.id}`,
        label: g.label,
        iconName: iconNameFor(state, g.id),
        productIds: g.productIds,
      }))
  );
}

/**
 * The products no custom group claims — the nav's top-level rows.
 *
 * Takes already-resolved groups when the caller has them, so resolveGroups does
 * not resolve itself twice, and falls back to the stored tree for callers that
 * only hold state (the editor, which needs to know where a product sits before
 * it draws the control that moves it).
 */
/**
 * A product's children, as this account has arranged them.
 *
 * The catalogue's own list, minus any child the account has re-homed
 * elsewhere, plus any it has brought in from another product. Both halves
 * read from `childOf`, which is why they cannot disagree: one map, asked in
 * two directions.
 *
 * Lifted children are taken out too. A child standing at the top level is a
 * row in the nav already, and drawing it inside its old parent as well would
 * be the same page in two places — the thing `withProductFiled` has always
 * guaranteed for products and this now guarantees for children.
 *
 * Catalogue order is kept; `panelRowsFor` is what reorders, and an arrival
 * from another product lands at the end until someone drags it, which is
 * where a "move to" has always put things.
 */
/**
 * Whether a row READS as hidden, counting its ancestors.
 *
 * `isRowHidden` answers about the row itself, which is the right question for
 * the store and the wrong one for the screen: hide CRM and its products were
 * still drawn at full strength inside it, hide a product and its pages were.
 * The eye said one thing and the rows under it said another. Ashwin, Oct 12.
 *
 * INHERITED, not written. Hiding a category does not mark every row beneath
 * it — that would be unrecoverable in the only way that matters: unhiding the
 * category could not tell which of its rows had been switched off on their
 * own and which had merely been carried. The flag stays on the row the eye
 * was clicked on, and everything below reads through to it.
 *
 * Which also means the child's own eye keeps working while an ancestor is
 * hidden. It is switching its OWN flag, and the row stays faded until the
 * ancestor comes back — the state is honest even though the pixels do not
 * change, and the alternative is an eye that silently refuses.
 */
export function isRowHiddenDeep(
  state: NavLayoutState,
  groups: readonly ResolvedGroup[],
  id: string,
): boolean {
  if (isRowHidden(state, id)) return true;
  const child = childById(id);
  if (child) {
    // Its parent as the ACCOUNT has it, which is not always the catalogue's.
    const parentId = state.childOf[id] ?? child.product.id;
    // A page lifted to the top level has no parent to inherit from: it is a
    // row of the nav now, and only its own flag speaks for it.
    if (state.tailOrder.includes(id)) return false;
    /*
     * Detached and filed into a category: it inherits from that category, the
     * same as any product sitting there. Recursing on the sentinel would ask
     * whether a product that does not exist is hidden, which is false for the
     * wrong reason — right answer, no reasoning behind it.
     */
    if (parentId === DETACHED) {
      const home = groups.find(
        (g) => g.id !== UNGROUPED_ID && g.productIds.includes(id),
      );
      return home ? isRowHidden(state, home.id) : false;
    }
    return isRowHiddenDeep(state, groups, parentId);
  }
  const owner = groups.find(
    (g) => g.id !== UNGROUPED_ID && g.productIds.includes(id),
  );
  return owner ? isRowHidden(state, owner.id) : false;
}

/**
 * `childOf`'s answer for "nowhere".
 *
 * A child that has been moved OUT of its catalogue parent but is not under
 * another product — filed into a category as a row of its own, say — needs a
 * record saying so. Deleting its `childOf` entry cannot do that: absence is
 * already read as "still where the catalogue put it", so the row stayed in
 * its old flyout while also standing in its new home. Two places at once,
 * which is the one thing the tree must never allow.
 *
 * So the detach writes a value rather than clearing one. It is a product id
 * no product has, which makes every existing comparison fail closed without
 * any of them having to learn about it: `childOf[c.id] === productId` is
 * false for every real product, and the adopted-children pass skips it for
 * the same reason. Ashwin, Oct 12.
 */
export const DETACHED = "\u0000detached";

/**
 * A row that HAD children in the catalogue and has none left in this nav.
 *
 * The L2 equivalent of an empty category, and it arrives the same way: not by
 * being authored empty, but by the admin moving every child out of it — to
 * another parent, into a category as rows of their own, or up to the top
 * level. What is left is a row that opens a flyout with nothing in it, which
 * is the exact failure `emptyCategories` exists to prevent one level up.
 *
 * `own.length === 0` is the whole of the exemption, and it has to be. Most
 * products are leaves: they never had children, they open a page rather than
 * a panel, and warning about them would mark most of the nav. Only a row that
 * was a PARENT can be orphaned. Ashwin, Oct 21.
 */
export function lostAllChildren(
  state: NavLayoutState,
  productId: string,
): boolean {
  const own =
    (productById(productId) ?? childById(productId)?.child)?.children ?? [];
  if (own.length === 0) return false;
  /*
   * A hidden row is not a fault, because it is not a row.
   *
   * The whole complaint is "this opens a panel with nothing in it" — and a
   * row the account has hidden opens nothing, because it is not drawn. So
   * hiding an emptied row is a legitimate answer to the warning, alongside
   * filling it and removing it, and it is the cheapest of the three: the
   * row keeps its place and its children's place if the account changes its
   * mind. Holding the save after that would be refusing the fix it just
   * asked for. Ashwin, Oct 21.
   */
  if (isRowHidden(state, productId)) return false;
  return childrenFor(state, productId).length === 0;
}

/**
 * Every row in the drawn nav that has been emptied of its children.
 *
 * Walks what is DRAWN rather than the catalogue: a product sitting in no
 * category and no tail is not in this nav, so it cannot be an empty row in
 * it. See `lostAllChildren`.
 */
export function emptiedParents(
  state: NavLayoutState,
  groups: readonly ResolvedGroup[],
): readonly string[] {
  const seen = new Set<string>();
  for (const g of groups) for (const id of g.productIds) seen.add(id);
  for (const id of state.tailOrder) seen.add(id);
  /*
   * `isRowHiddenDeep`, not the shallow test `lostAllChildren` applies.
   *
   * The row's own flag is handled in there; this is the other way it goes
   * off screen — the CATEGORY above it is hidden, so nothing inside it is
   * drawn whatever each row says about itself. Same rule, one rung up: what
   * nobody can see cannot be a fault worth blocking a save for.
   */
  return [...seen].filter(
    (id) => !isRowHiddenDeep(state, groups, id) && lostAllChildren(state, id),
  );
}

/**
 * A category whose every row is hidden, while the category itself is not.
 *
 * The third way to leave a heading over nothing, after an empty category and
 * a row emptied of its children. The panel still opens; there is simply
 * nothing in it to read, which is the failure the other two are blocked for.
 *
 * `isRowHidden`, NOT `isRowHiddenDeep`, and the distinction is the whole of
 * the function. The deep test reports a row hidden when an ANCESTOR is — so
 * a category someone has deliberately hidden would report every member
 * hidden too, and every such category would be flagged for the crime of
 * being hidden on purpose. The shallow test asks only about the row itself,
 * and the `!isRowHidden(state, group.id)` guard says the category is still
 * meant to be seen. Credit to the peer session for spotting this one before
 * it shipped. Ashwin, Oct 21.
 *
 * An EMPTY category is not this: it has no rows to hide, and
 * `emptyCategories` already holds it. Requiring at least one member keeps
 * the two faults from both claiming the same row and counting it twice.
 */
export function allRowsHidden(
  state: NavLayoutState,
  group: ResolvedGroup,
): boolean {
  if (group.productIds.length === 0) return false;
  if (isRowHidden(state, group.id)) return false;
  return group.productIds.every((id) => isRowHidden(state, id));
}

/** Every drawn category that has been hidden out. See `allRowsHidden`. */
export function blankedCategories(
  state: NavLayoutState,
  groups: readonly ResolvedGroup[],
): readonly ResolvedGroup[] {
  return groups.filter((g) => allRowsHidden(state, g));
}

/**
 * Where a row actually LIVES, for the purposes of lighting the nav.
 *
 * The nav marks a position as a product plus an optional child under it, and
 * for a catalogue child that pairing is free — its parent is written in the
 * catalogue. It stops being free the moment the child is moved: a child
 * lifted to the top level is a row in its own right and has no parent to put
 * in the first slot, and a child refiled under a different product has a
 * parent that the catalogue does not know about.
 *
 * Reading the catalogue anyway is the bug Ashwin reported: lift Inbox to the
 * sidebar, click it, and CRM lit up as well — because the position still
 * said "the Conversations product, child Inbox", and CRM is the category
 * Conversations lives in. Two rows marked, one of them a place you are not.
 *
 * Three answers, which is one per state `childOf` can be in:
 *
 *   detached   Its own destination. No parent, nothing above it to light.
 *   refiled    A child of wherever it was filed, not of where it started.
 *   untouched  The catalogue's answer, as before.
 *
 * Ashwin, Oct 21.
 */
export function placeOf(
  state: NavLayoutState,
  productId: string | null,
  childId: string | null,
): { productId: string | null; childId: string | null } {
  if (!childId) return { productId, childId };
  const filed = state.childOf[childId];
  if (filed === undefined) return { productId, childId };
  if (filed === DETACHED) return { productId: childId, childId: null };
  return { productId: filed, childId };
}

/**
 * Authored buckets this account could not fill even if it wanted to.
 *
 * `isAuthoredGroup` was being used as the whole exemption, and it is too
 * blunt: it says a bucket came from the platform, not that it is empty for a
 * reason nobody chose. Move every row out of Automation and the save stayed
 * enabled, because Automation is a shipped bucket — the admin had emptied it
 * deliberately and the nav called it entitlement. Ashwin, Oct 21.
 *
 * The real question is whether there is anything to PUT there. `stockTreeFor`
 * answers it: it files the account's products under their catalogue home,
 * independently of where the admin has since moved them. A bucket with no
 * stock is one a bakery can never fill — there is no product for it and the
 * warning would be a scolding with no remedy. A bucket WITH stock that is
 * sitting empty is a choice, and choices are what the save gate is for.
 */
export function unfillableGroupIds(state: NavLayoutState): ReadonlySet<string> {
  const stocked = new Set(
    stockTreeFor(state)
      .categories.filter((c) => c.productIds.length > 0)
      .map((c) => c.id),
  );
  return new Set(
    [...SHIPPED_GROUPS.keys()].filter((id) => !stocked.has(id)),
  );
}

export function childrenFor(
  state: NavLayoutState,
  productId: string,
): readonly CatalogueChild[] {
  /*
   * A CHILD can own children too, once it has been lifted to the top level.
   *
   * `productById` only answers for the catalogue's top rung, so asking it
   * about a promoted L3 returned nothing and the row drew as a dead end.
   * Falling through to `childById` lets one resolver answer for every rung,
   * which is what stops the lifted-row flyout needing a resolver of its own —
   * and a second resolver is exactly how the two drifted apart.
   */
  const own =
    (productById(productId) ?? childById(productId)?.child)?.children ?? [];
  const lifted = new Set(state.tailOrder);
  const kept = own.filter(
    (c) =>
      (state.childOf[c.id] ?? productId) === productId && !lifted.has(c.id),
  );
  const adopted: CatalogueChild[] = [];
  for (const [childId, parentId] of Object.entries(state.childOf)) {
    if (parentId !== productId) continue;
    if (lifted.has(childId)) continue;
    if (kept.some((c) => c.id === childId)) continue;
    const hit = childById(childId);
    if (hit) {
      adopted.push(hit.child);
      continue;
    }
    /*
     * A product demoted into this row. See `withChildFiled`.
     *
     * Presented as a child because that is what it now is: everything
     * downstream reads this list as L3s, and handing back a product would
     * make every consumer ask which kind of row it had. The id is unchanged,
     * so the resolvers that answer by id — labels, icons, hidden state —
     * keep answering.
     */
    const demoted = productById(childId);
    if (demoted)
      adopted.push({
        id: demoted.id,
        label: demoted.label,
        ...(demoted.icon ? { icon: demoted.icon } : {}),
      });
  }
  /*
   * ...and in the account's own order, which is the half this was missing.
   *
   * `panelOrder` was written by every reorder — the kebab's move up/down and
   * the drag alike — and read by nothing that draws a child list, so a row
   * moved to the end committed, the panel redrew, and the row was exactly
   * where it started. The order existed; the list never asked for it. Same
   * class of bug as the lifted child that was written to `tailOrder` and
   * filtered straight back out.
   *
   * Applied as a diff against the resolved list rather than replacing it: a
   * product that gains a child in a later release shows it, at its authored
   * place, instead of being swallowed by a saved array that predates it.
   */
  /*
   * Hidden children go, except while editing.
   *
   * The same rule `resolveGroups` applies one rung up, and for the same
   * reason: hiding is not removing, so the row stays in the tree and the nav
   * stops drawing it — but edit mode is where you take the decision back, and
   * a row you cannot see is a row you cannot restore. In the mode it is drawn
   * faded with the eye on it; out of the mode it is gone.
   */
  const visible = state.editing
    ? [...kept, ...adopted]
    : [...kept, ...adopted].filter((c) => !isRowHidden(state, c.id));
  const resolved = visible;
  const saved = state.panelOrder[productId];
  if (!saved) return resolved;
  const known = saved.filter((id) => resolved.some((c) => c.id === id));
  const order = [...known, ...resolved.map((c) => c.id).filter((id) => !known.includes(id))];
  return order
    .map((id) => resolved.find((c) => c.id === id))
    .filter((c): c is CatalogueChild => c !== undefined);
}

/**
 * Takes a row out of wherever it currently is, whatever that was.
 *
 * Three records can claim a row — a category's `productIds`, the top level's
 * `tailOrder`, and now `childOf` — and every placement verb used to clear
 * only the ones it happened to know about. That was survivable while a row
 * could be in exactly two of them; with children re-homeable it is not, and a
 * row claimed twice is drawn twice.
 *
 * So one helper clears all three and every verb calls it first. Cut, then
 * place: that is the whole of the rule Ashwin asked for, in one function
 * rather than spread across five.
 */
export function withRowDetached(
  state: NavLayoutState,
  rowId: string,
): NavLayoutState {
  const unfiled = productById(rowId)
    ? withProductFiled(state, rowId, null)
    : state;
  const childOf = { ...unfiled.childOf };
  /*
   * A CHILD is marked detached; anything else has its entry cleared.
   *
   * The asymmetry is the point. A child has a home in the catalogue that no
   * amount of deleting can take away, so "cut" has to be written down. A
   * product has no such default — absence genuinely means unfiled — and
   * writing a sentinel for it would only leave a key nothing reads.
   */
  if (childById(rowId)) childOf[rowId] = DETACHED;
  else delete childOf[rowId];
  return {
    ...unfiled,
    childOf,
    tailOrder: unfiled.tailOrder.filter((id) => id !== rowId),
  };
}

/**
 * Files a child under a product, taking it out of wherever it was.
 *
 * Refuses a move that would make a row its own ancestor, and refuses a
 * parent that is not a product — both are states the resolvers cannot
 * represent, and a store that can reach them is a store that will.
 */
/**
 * Files a CHILD into a category, as a row of its own.
 *
 * `withProductFiled` refuses it: its gate asks whether the id is an enabled
 * product, and a child is neither. But "drag Inbox onto Marketing" is a move
 * the nav can express perfectly well — the row leaves its parent and becomes
 * one of that category's rows, which is what dropping onto a category has
 * always meant for a product.
 *
 * So the child is detached and then spliced into the group's own list, which
 * is the same shape `withProductFiled` writes. Everything downstream reads
 * groups by id and resolves labels through `labelForProduct`, which already
 * answers for children — so nothing else has to learn a new kind of row.
 */
export function withChildInGroup(
  state: NavLayoutState,
  childId: string,
  groupId: string,
  index?: number,
): NavLayoutState {
  if (!childById(childId)) return state;
  const base = withRowDetached(state, childId);
  const tree = customTreeFor(base);
  return {
    ...base,
    customGroups: tree.customGroups.map((g) => {
      if (g.id !== groupId) {
        return g.productIds.includes(childId)
          ? { ...g, productIds: g.productIds.filter((id) => id !== childId) }
          : g;
      }
      const without = g.productIds.filter((id) => id !== childId);
      const at = Math.max(0, Math.min(index ?? without.length, without.length));
      const productIds = [...without];
      productIds.splice(at, 0, childId);
      return { ...g, productIds };
    }),
  };
}

export function withChildFiled(
  state: NavLayoutState,
  childId: string,
  parentId: string,
): NavLayoutState {
  /*
   * A PRODUCT can be filed here too, if it owns nothing — Ashwin, Oct 22.
   *
   * The gate used to be `childById` alone, which made "drag an L2 onto
   * another L2" a move the store could not express: the write would have
   * been fine and `childrenFor` would never have adopted the row back,
   * because that loop resolved ids through the catalogue's second rung
   * only. The row would have vanished — the failure this nav has produced
   * five times now, and the reason the picker still refuses to offer it.
   *
   * Only a CHILDLESS product. The nav is three rungs deep and a product
   * with pages of its own would arrive carrying a fourth, which nothing
   * below here can draw. Ashwin's own condition, and the one that keeps the
   * depth a fact rather than a hope.
   */
  const movingChild = childById(childId);
  const movingProduct = productById(childId);
  const demotable =
    movingProduct !== undefined && (movingProduct.children?.length ?? 0) === 0;
  if (!movingChild && !demotable) return state;
  if (!productById(parentId)) return state;
  if (childId === parentId) return state;
  const detached = withRowDetached(state, childId);
  return { ...detached, childOf: { ...detached.childOf, [childId]: parentId } };
}

export function looseProductIds(
  state: NavLayoutState,
  groups?: ResolvedGroup[],
): string[] {
  const enabled = enabledSetFor(state);
  const filed = new Set(
    groups
      ? groups.filter((g) => g.id !== UNGROUPED_ID).flatMap((g) => g.productIds)
      : state.customGroups.flatMap((g) => g.productIds),
  );
  return allProducts
    .filter((p) => enabled.has(p.id) && !filed.has(p.id))
    .map((p) => p.id);
}

/**
 * The products this account could add to its nav.
 *
 * Wider than `enabledProducts`, narrower than the catalogue. Wider, because a
 * product the agency switched off — or one an admin removed a moment ago — has to
 * be reachable again, or "remove" is a one-way door. Narrower, because the two
 * product sets share one lookup index: offering all of it put Conversations and
 * Contacts from the shipped catalogue in an Add menu on an account whose entire
 * nav is the proposal, which is not a product it has.
 *
 * The test is "does this account's own tree know where this product goes" —
 * either it is provisioned, or the tree it is filed in is this account's.
 */
/**
 * Drops the entries that are reachable but must never resolve to a nav row.
 *
 * Launchpad is the whole list: the card above Recent is its only affordance,
 * and it belongs to no bucket, which means every "what is filed nowhere?"
 * question in this file answers with it. That question gets asked in four
 * places — the proposed and custom branches of `resolveGroups`, the nav tree
 * the Move menus walk, and the stock tree the Add menu walks — and each one
 * was written as if it were the only one. Three of them took Launchpad at
 * face value, so saving a template put a Launchpad row in the nav and the Add
 * menu offered to put a second one there.
 *
 * Hence a named helper rather than a fourth inline filter: the next function
 * that asks "what is loose?" should find the exclusion already attached to
 * the answer instead of rediscovering it the way these did.
 */
function withoutUnlistedIds(ids: string[]): string[] {
  return ids.filter((id) => !PROPOSED_UNLISTED_IDS.includes(id));
}

export function addableProducts(state: NavLayoutState): CatalogueEntry[] {
  const enabled = enabledSetFor(state);
  return allProducts.filter(
    (p) => enabled.has(p.id) || groupIdForProduct(state, p.id) !== null,
  );
}

/**
 * The account's nav as a tree of ids: categories with their products under them,
 * and the rows that belong to no category alongside.
 *
 * For the menus that ask "which product?". Naming each product's parent in its own
 * label — "Snippets — in Marketing" — turned a ninety-row list into ninety
 * sentences, and still made the shelves impossible to see. The tree is what the
 * admin already knows: the same shape as the nav, and the same shape as the
 * breadcrumb's own menu.
 */
export interface NavTreeNode {
  id: string;
  productIds: readonly string[];
}

export function navTreeFor(state: NavLayoutState): {
  categories: NavTreeNode[];
  loose: string[];
} {
  const groups = resolveGroups(state);
  const universe = new Set(addableProducts(state).map((p) => p.id));
  const categories = groups
    .filter((g) => g.id !== UNGROUPED_ID)
    .map((g) => ({
      id: g.id,
      // The category's own membership, which for a de-provisioned product is
      // still where it belongs — that is how "remove" stays reversible.
      productIds: (state.customGroups.find((c) => c.id === g.id)?.productIds ??
        proposedBuckets.find((b) => b.id === g.id)?.productIds ??
        g.productIds
      ).filter((id) => universe.has(id)),
    }));
  const filed = new Set(categories.flatMap((c) => c.productIds));
  return {
    categories,
    loose: withoutUnlistedIds([...universe].filter((id) => !filed.has(id))),
  };
}

/**
 * The SHIPPED tree, ignoring everything this account did to its nav.
 *
 * `navTreeFor` above answers "what does this nav look like", which is right for
 * a Move-to menu — you are filing a row into the arrangement in front of you.
 * It is wrong for the Add-a-product picker, which was using it too: on an
 * account running a template, the picker offered that template's own
 * categories, in the template's order, under the template's renames. So the one
 * place an admin goes to find a product they do not have yet was organised by a
 * structure built around the products they already do.
 *
 * The picker is a view of the catalogue, not of the nav. Stock categories, stock
 * order, stock names, stock icons, stock membership — the same list every time,
 * so knowing where Snippets lives is knowledge that survives a template switch.
 *
 * Two things still come from the account, because they are about what CAN be
 * added rather than how it is arranged: only products this tenant was
 * provisioned appear, and a product filed nowhere in the shipped tree falls
 * loose exactly as it does in the nav.
 */
/**
 * The label a category already answers to, folded for comparison.
 *
 * Case and surrounding space are not a difference anyone can see in a nav
 * row, so "Sales", "sales" and " Sales " are the same name to a reader and
 * have to be the same name to the check. Anything stricter would be a
 * validator that passes a duplicate the moment someone holds shift.
 */
function foldLabel(label: string): string {
  return label.trim().toLocaleLowerCase();
}

/**
 * Whether another category already has this name.
 *
 * `exceptId` is the category being renamed, which must not collide with
 * itself — without it, confirming a rename that changed only the capitals
 * would be refused as a duplicate of the row you are standing on.
 *
 * Asked of RESOLVED groups, so it sees shipped categories under their
 * overridden names as well as the account's own. A category called "CRM"
 * because someone renamed "Sales" to it is exactly as confusing as two called
 * "sdfs", and the store that allows one allows the other. Ashwin, Oct 12.
 */
export function groupNameTaken(
  state: NavLayoutState,
  label: string,
  exceptId?: string,
): boolean {
  const wanted = foldLabel(label);
  if (!wanted) return false;
  return resolveGroups(state).some(
    (g) =>
      g.id !== UNGROUPED_ID &&
      g.id !== exceptId &&
      foldLabel(g.label) === wanted,
  );
}

/**
 * `base`, or `base 2`, `base 3` — the first spelling nothing else answers to.
 *
 * For the seed name a new category is born with. Two categories both called
 * "New category" is the duplicate state arriving before anyone has typed a
 * character, and refusing to create the second would be a strange way to
 * report it. Numbering is what every file manager does and needs no message.
 */
export function uniqueGroupLabel(state: NavLayoutState, base: string): string {
  if (!groupNameTaken(state, base)) return base;
  for (let n = 2; n < 500; n += 1) {
    const candidate = `${base} ${n}`;
    if (!groupNameTaken(state, candidate)) return candidate;
  }
  return base;
}

export function stockTreeFor(state: NavLayoutState): {
  categories: { id: string; label: string; icon: LucideIcon; productIds: string[] }[];
  loose: string[];
} {
  const universe = new Set(addableProducts(state).map((p) => p.id));

  /*
   * Which catalogue this tenant is on, worked out from what it owns.
   *
   * Not from `state.grouping`: an account seeded onto the proposed IA and then
   * switched to custom reports "custom", and the shipped suites hold none of
   * its ninety products — so keying off the mode would empty the picker for
   * exactly the accounts the proposal is about. The proposed IA's own twelve
   * buckets are its stock default; the suites are the shipped catalogue's.
   */
  const proposed = PROPOSED_PRODUCT_IDS.some((id) => universe.has(id));

  const source: { id: string; label: string; icon: LucideIcon; productIds: readonly string[] }[] =
    proposed
      ? proposedBuckets.map((b) => ({
          id: b.id,
          label: b.defaultLabel,
          icon: b.icon,
          productIds: b.productIds,
        }))
      : catalogueSuites.map((g) => ({
          id: g.id,
          label: g.defaultLabel,
          icon: g.icon,
          // Catalogue order within the suite, which is the order the shelf was
          // authored in — not the order this account dragged its rows into.
          productIds: catalogue
            .filter((p) => p.suiteId === g.id)
            .map((p) => p.id),
        }));

  const categories = source
    .map((g) => ({
      id: g.id,
      label: g.label,
      icon: g.icon,
      productIds: g.productIds.filter((id) => universe.has(id)),
    }))
    .filter((g) => g.productIds.length > 0);

  const filed = new Set(categories.flatMap((c) => c.productIds));
  return {
    categories,
    loose: withoutUnlistedIds([...universe].filter((id) => !filed.has(id))),
  };
}

/** The custom group holding a product, or null when it sits at top level. */
export function groupIdForProduct(
  state: NavLayoutState,
  productId: string,
): string | null {
  const found = state.customGroups.find((g) =>
    g.productIds.includes(productId),
  );
  if (found) return found.id;
  // Before the first structural edit a proposed account has no stored tree, and
  // answering "top level" for all ninety of its rows would have every Move
  // control claim the row is somewhere it visibly is not.
  if (state.grouping === "proposed" && state.customGroups.length === 0) {
    return (
      proposedBuckets.find((b) => b.productIds.includes(productId))?.id ?? null
    );
  }
  return null;
}

/**
 * The state as an editable tree.
 *
 * The three shipped modes are views of what ships, and letting a move rewrite
 * them would mean an account silently diverging from the product with no way
 * back — so the first structural edit there switches to custom, seeded from
 * whatever was showing: the tree the user starts editing is the tree they were
 * looking at.
 *
 * Custom and proposed keep their mode. Both already store their structure the
 * same way, so an edit in either is an edit to the account's own tree rather
 * than a defection from a shipped one, and the mode carries rendering the tree
 * cannot: proposed keeps its band order and its Settings flyout.
 */
export function customTreeFor(state: NavLayoutState): NavLayoutState {
  if (isStructuralMode(state.grouping) && state.customGroups.length > 0) {
    return state;
  }
  return {
    ...state,
    grouping: isStructuralMode(state.grouping) ? state.grouping : "custom",
    customGroups: seedCustomGroups(state),
  };
}

/**
 * A group id nothing else in this account is using.
 *
 * Exported so a caller can know the id before it exists — the editor names a
 * new group by opening its rename field, which needs the id one render before
 * withNewGroup returns the tree containing it.
 */
export function nextGroupIdFor(state: NavLayoutState): string {
  const taken = new Set(state.customGroups.map((g) => g.id));
  let n = state.customGroups.length + 1;
  while (taken.has(`group-${n}`)) n += 1;
  return `group-${n}`;
}

/** Adds an empty group at the end of the tree, ready to be filled. */
export function withNewGroup(
  state: NavLayoutState,
  label = "New group",
  /**
   * The id to use, when the caller already holds one.
   *
   * Creating a group and opening its rename field is one gesture, and the field
   * needs the id a render before the tree containing it exists — so the caller
   * generates it and hands it down rather than guessing what this function
   * chose.
   */
  id?: string,
): NavLayoutState {
  const base = customTreeFor(state);
  return {
    ...base,
    customGroups: [
      ...base.customGroups,
      {
        id: id ?? nextGroupIdFor(base),
        label,
        iconName: "Folder",
        productIds: [],
      },
    ],
  };
}

/**
 * Deletes a group. Its products fall to top level rather than out of the nav —
 * a group is a shelf, not a container, so removing the shelf cannot lose what
 * was on it.
 */
export function withGroupDeleted(
  state: NavLayoutState,
  groupId: string,
): NavLayoutState {
  if (!state.customGroups.some((g) => g.id === groupId)) return state;
  // Whichever structural mode is showing owns the order, so proposed's stored
  // order is the one pruned when the nav is drawn from proposed.
  const key = state.grouping;
  const order = state.groupOrder[key]?.filter((id) => id !== groupId);
  return {
    ...state,
    customGroups: state.customGroups.filter((g) => g.id !== groupId),
    groupOrder: order
      ? { ...state.groupOrder, [key]: order }
      : state.groupOrder,
    // The overrides went with the group; leaving them would reattach a stale
    // name or icon to the next group that happens to take the same id.
    accountLabels: withoutKey(state.accountLabels, groupId),
    agencyLabels: withoutKey(state.agencyLabels, groupId),
    icons: withoutKey(state.icons, groupId),
  };
}

/** Moves a group one place up (-1) or down (+1) in the tree. */
export function withGroupMoved(
  state: NavLayoutState,
  groupId: string,
  delta: number,
): NavLayoutState {
  const base = customTreeFor(state);
  const key = base.grouping;
  const order = applyOrder(
    base.groupOrder[key],
    base.customGroups.map((g) => g.id),
  );
  const from = order.indexOf(groupId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return state;
  const next = [...order];
  next[from] = order[to] as string;
  next[to] = order[from] as string;
  return { ...base, groupOrder: { ...base.groupOrder, [key]: next } };
}

/**
 * Files a product into a group, or to top level when groupId is null.
 *
 * One function for both directions because they are the same edit: a product
 * belongs to at most one group, so moving it out of one and into another is a
 * single rewrite of the tree rather than a remove followed by an add that could
 * half-fail.
 */
export function withProductFiled(
  state: NavLayoutState,
  productId: string,
  groupId: string | null,
  /**
   * Where in the destination it lands. Omitted, it goes last.
   *
   * A menu that says "move to Marketing" has no position to offer, so appending
   * is the honest default; a drop does, and dropping a row onto the third row of
   * a panel has to leave it third or the gesture lied.
   */
  index?: number,
): NavLayoutState {
  /*
   * Chrome rows are filable without being provisioned.
   *
   * `enabledProducts` is what the agency sold this account, which is the right
   * gate for a product and meaningless for a row the platform puts in every
   * nav. Without the exception, "Move to Marketing" on Desktop & mobile apps
   * returned the state unchanged and the menu entry did nothing.
   */
  if (!isProductEnabled(state, productId) && !isChromePlace(productId)) {
    return state;
  }
  const target = groupId === UNGROUPED_ID ? null : groupId;
  const base = customTreeFor(state);
  if (target !== null && !base.customGroups.some((g) => g.id === target)) {
    return state;
  }
  if (
    base === state &&
    index === undefined &&
    groupIdForProduct(state, productId) === target
  ) {
    return state;
  }
  return {
    ...base,
    customGroups: base.customGroups.map((g) => {
      const has = g.productIds.includes(productId);
      if (g.id === target) {
        // Filed within its own group, the row has to come out before it goes
        // back in, or an index past its old position lands one place short.
        const without = has
          ? g.productIds.filter((id) => id !== productId)
          : g.productIds;
        if (has && index === undefined) return g;
        const at = Math.max(0, Math.min(index ?? without.length, without.length));
        const productIds = [...without];
        productIds.splice(at, 0, productId);
        return { ...g, productIds };
      }
      return has
        ? { ...g, productIds: g.productIds.filter((id) => id !== productId) }
        : g;
    }),
  };
}

/**
 * Adds a product to a group without taking it out of any other.
 *
 * UNUSED BY DECISION, kept deliberately. Duplication — one row living in two
 * categories — was cut for MVP (design review, Aug 21: ambiguous breadcrumbs,
 * unpredictable IA) and every "add" now goes through `withProductFiled`, which
 * relocates. The same review noted users may ask for duplication back after
 * launch; this recipe is what turning it back on costs.
 */
export function withProductAdded(
  state: NavLayoutState,
  productId: string,
  groupId: string,
  index?: number,
): NavLayoutState {
  const base = customTreeFor(state);
  const target = base.customGroups.find((g) => g.id === groupId);
  if (!target || target.productIds.includes(productId)) return state;
  return {
    ...base,
    customGroups: base.customGroups.map((g) => {
      if (g.id !== groupId) return g;
      const productIds = [...g.productIds];
      productIds.splice(
        Math.max(0, Math.min(index ?? productIds.length, productIds.length)),
        0,
        productId,
      );
      return { ...g, productIds };
    }),
  };
}

/** Moves a product one place up (-1) or down (+1) inside its group. */
export function withProductOrdered(
  state: NavLayoutState,
  groupId: string,
  productId: string,
  delta: number,
): NavLayoutState {
  const group = state.customGroups.find((g) => g.id === groupId);
  if (!group) return state;
  const from = group.productIds.indexOf(productId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= group.productIds.length) return state;
  const productIds = [...group.productIds];
  productIds[from] = group.productIds[to] as string;
  productIds[to] = group.productIds[from] as string;
  return {
    ...state,
    customGroups: state.customGroups.map((g) =>
      g.id === groupId ? { ...g, productIds } : g,
    ),
  };
}

/** A copy without one key, or the same reference when the key was absent. */
function withoutKey<T>(
  map: Record<string, T>,
  key: string,
): Record<string, T> {
  if (!(key in map)) return map;
  const next = { ...map };
  delete next[key];
  return next;
}

/**
 * The stored icon name for a group.
 *
 * Empty rather than "Folder" when the group's shipped glyph is not one the
 * picker offers. A name is only worth storing if it can be resolved back, and
 * writing "Folder" for an icon that merely has no name turned every proposed
 * bucket whose glyph is outside the picker's set — CRM, Creators Hub,
 * Integrations — into a folder the moment the account seeded its tree. Empty
 * misses in `iconByName`, which is what lets the group fall through to the icon
 * its id was authored with.
 */
function iconNameFor(state: NavLayoutState, groupId: string): string {
  return (
    state.icons[groupId] ?? nameForIcon(SHIPPED_GROUPS.get(groupId)?.icon) ?? ""
  );
}

/**
 * Density, computed rather than configured.
 *
 * The settled rule from the spec board: eight or fewer products is a flat list,
 * nine to fifteen is mixed, more than fifteen needs the full grouped treatment.
 * Surfaced so the prototype can say what it would do, and so crossing a
 * threshold can prompt rather than silently rearranging the nav.
 */
export type Density = "flat" | "mixed" | "grouped";

export function densityFor(productCount: number): Density {
  if (productCount <= 8) return "flat";
  if (productCount <= 15) return "mixed";
  return "grouped";
}
