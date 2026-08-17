import type { LucideIcon } from "lucide-react";
import { Folder } from "lucide-react";
import {
  catalogue,
  catalogueGroups,
  catalogueJobs,
  DEFAULT_PINNED,
  productById,
  type CatalogueGroup,
  type CatalogueProduct,
} from "./catalogue";
import { iconByName, nameForIcon } from "./icon-catalogue";

/**
 * How the nav's middle section is organized.
 *
 * The four modes are the four answers to the first question in the nav research
 * — "what is the rail *for*?" — rather than four cosmetic layouts:
 *
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
 * The first three are views of one catalogue — every product carries both a
 * groupId and a jobId — so switching is lossless. Custom is a real tree, seeded
 * from whichever mode was showing when the user switched, so "start over"
 * never means "start from nothing".
 */
export type GroupingMode = "product" | "job" | "flat" | "custom";

export const GROUPING_MODES: readonly GroupingMode[] = [
  "product",
  "job",
  "flat",
  "custom",
] as const;

export const GROUPING_LABELS: Record<GroupingMode, string> = {
  product: "Product",
  job: "Jobs",
  flat: "Flat",
  custom: "Custom",
};

export const GROUPING_BLURBS: Record<GroupingMode, string> = {
  product: "Grouped by SKU — what ships today.",
  job: "Grouped by outcome. Tenet 4, validated by HubSpot.",
  flat: "No groups. Every product a row, search for the tail.",
  custom: "The user's own groups, seeded from the mode you left.",
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
  pinned: DEFAULT_PINNED,
  // Jobs by default. The research calls this the right organizing unit and the
  // highest-risk change — "group by the user's job, not by team or SKU" — so the
  // prototype should open on the proposal, not on the thing being replaced. Product
  // groups are one click away for the comparison.
  grouping: "job",
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
  [...catalogueGroups, ...catalogueJobs].map((g) => [g.id, g]),
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
  if (custom) return iconByName(custom.iconName) ?? Folder;
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

/** The account's products, in catalogue order. */
export function enabledProducts(state: NavLayoutState): CatalogueProduct[] {
  const enabled = enabledSetFor(state);
  return catalogue.filter((p) => enabled.has(p.id));
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
      enabledProducts: catalogue.filter((p) => next.has(p.id)).map((p) => p.id),
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

/** Every group the active mode shows, in the order it shows them. */
export function resolveGroups(state: NavLayoutState): ResolvedGroup[] {
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
  const source: GroupingMode = state.grouping === "job" ? "job" : "product";
  const groups = resolveGroups({ ...state, grouping: source });
  return groups.map((g) => ({
    id: `custom-${g.id}`,
    label: g.label,
    iconName: iconNameFor(state, g.id),
    productIds: g.productIds,
  }));
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
  return catalogue
    .filter((p) => enabled.has(p.id) && !filed.has(p.id))
    .map((p) => p.id);
}

/** The custom group holding a product, or null when it sits at top level. */
export function groupIdForProduct(
  state: NavLayoutState,
  productId: string,
): string | null {
  return (
    state.customGroups.find((g) => g.productIds.includes(productId))?.id ?? null
  );
}

/**
 * The state as an editable tree.
 *
 * Structure can only be edited in the custom tree — the other three modes are
 * views of what ships, and letting a move rewrite them would mean an account
 * silently diverging from the product with no way back. So the first structural
 * edit switches to custom, seeded from whatever was showing: the tree the user
 * starts editing is the tree they were looking at.
 */
export function customTreeFor(state: NavLayoutState): NavLayoutState {
  if (state.grouping === "custom" && state.customGroups.length > 0) return state;
  return { ...state, grouping: "custom", customGroups: seedCustomGroups(state) };
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
): NavLayoutState {
  const base = customTreeFor(state);
  return {
    ...base,
    customGroups: [
      ...base.customGroups,
      { id: nextGroupIdFor(base), label, iconName: "Folder", productIds: [] },
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
  const custom = state.groupOrder.custom?.filter((id) => id !== groupId);
  return {
    ...state,
    customGroups: state.customGroups.filter((g) => g.id !== groupId),
    groupOrder: custom ? { ...state.groupOrder, custom } : state.groupOrder,
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
  const order = applyOrder(
    base.groupOrder.custom,
    base.customGroups.map((g) => g.id),
  );
  const from = order.indexOf(groupId);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return state;
  const next = [...order];
  next[from] = order[to] as string;
  next[to] = order[from] as string;
  return { ...base, groupOrder: { ...base.groupOrder, custom: next } };
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
): NavLayoutState {
  if (!isProductEnabled(state, productId)) return state;
  const target = groupId === UNGROUPED_ID ? null : groupId;
  const base = customTreeFor(state);
  if (target !== null && !base.customGroups.some((g) => g.id === target)) {
    return state;
  }
  if (base === state && groupIdForProduct(state, productId) === target) {
    return state;
  }
  return {
    ...base,
    customGroups: base.customGroups.map((g) => {
      const has = g.productIds.includes(productId);
      if (g.id === target) {
        return has ? g : { ...g, productIds: [...g.productIds, productId] };
      }
      return has
        ? { ...g, productIds: g.productIds.filter((id) => id !== productId) }
        : g;
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

/** The stored icon name for a group, falling back to its shipped icon's name. */
function iconNameFor(state: NavLayoutState, groupId: string): string {
  return (
    state.icons[groupId] ??
    nameForIcon(SHIPPED_GROUPS.get(groupId)?.icon) ??
    "Folder"
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
