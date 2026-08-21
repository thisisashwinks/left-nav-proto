import type { LucideIcon } from "lucide-react";
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
  DEFAULT_PINNED,
  productById,
  type CatalogueEntry,
  type CatalogueGroup,
} from "./catalogue";
import {
  PROPOSED_DESTINATION_IDS,
  PROPOSED_UNLISTED_IDS,
  proposedBuckets,
} from "./proposed-ia";
import { iconByName, nameForIcon } from "./icon-catalogue";

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
 */
export type NavRole = "user" | "admin" | "agency";

export const NAV_ROLES: readonly NavRole[] = ["user", "admin", "agency"] as const;

export const ROLE_LABELS: Record<NavRole, string> = {
  user: "User",
  admin: "Admin",
  agency: "Agency",
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
  return {
    pin: true,
    renameForSelf: true,
    renameForEveryone: role !== "user",
    regroup: role !== "user",
    customise: role !== "user",
    writeAgencyScope: role === "agency",
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
  hiddenBlocks: [],
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

export function labelForProduct(
  state: NavLayoutState,
  productId: string,
): string {
  return (
    state.accountProductLabels[productId] ??
    state.agencyProductLabels[productId] ??
    productById(productId)?.label ??
    productId
  );
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
  const shipped = productById(productId)?.icon ?? Folder;
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
function applyOrder(
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
      productIds: productsFor(id).filter((pid) => enabled.has(pid)),
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
      const built = build(
        ids,
        (id) =>
          (byId.get(id)?.productIds ?? []).filter((pid) => enabled.has(pid)),
        edited,
      );
      // An authored bucket with nothing in it is a mistake; one the admin is
      // still filling is not, which is why only the unedited tree is pruned.
      const groups = edited ? built : populated(built);
      /*
       * Launchpad and Mobile own no products, so they are never buckets — they
       * are top-level rows, filed exactly as the custom tree files what no group
       * claims. Which is also why the edited tree asks the same question the
       * custom case does rather than naming the two: by then a row can be loose
       * because the admin pulled it out of a bucket.
       */
      const loose = edited
        ? // Launchpad is reachable and never a row — the card above Recent is
          // its only nav affordance. `looseProductIds` answers "filed nowhere",
          // which after an edit is true of it, so it has to be excluded by name
          // or the first drag puts a second Launchpad in the nav.
          looseProductIds(state, groups).filter(
            (id) => !PROPOSED_UNLISTED_IDS.includes(id),
          )
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
            (pid) => productById(pid) !== undefined,
          ),
        true,
      );
      // Anything no group claims is a top-level row: still reachable, still
      // ordered, just without a heading over it. Collected here rather than in
      // each surface so the nav, the launcher and search agree on what is loose.
      const loose = looseProductIds(state, groups);
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
    loose: [...universe].filter((id) => !filed.has(id)),
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
  if (!isProductEnabled(state, productId)) return state;
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
 * Filing is a move — a product belongs to at most one shelf — but ADDING is not.
 * An admin putting Invoices under both Commerce and CRM is not making a mistake:
 * some products genuinely belong in two places, and the nav can show a row twice
 * without the tree becoming ambiguous, because membership is stored per bucket.
 * Moving one stays a move: the kebab's "Move to" and a drag both go through
 * `withProductFiled`, which still removes it from where it was.
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
