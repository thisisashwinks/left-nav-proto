import type { LucideIcon } from "lucide-react";
import { Folder } from "lucide-react";
import {
  catalogue,
  catalogueGroups,
  catalogueJobs,
  DEFAULT_PINNED,
  productById,
  type CatalogueGroup,
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
}

export const DEFAULT_LAYOUT: NavLayoutState = {
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

/** Every group the active mode shows, in the order it shows them. */
export function resolveGroups(state: NavLayoutState): ResolvedGroup[] {
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
      productIds: productsFor(id),
      custom,
    }));

  switch (state.grouping) {
    case "product": {
      const ids = applyOrder(
        state.groupOrder.product,
        catalogueGroups.map((g) => g.id),
      );
      return build(
        ids,
        (id) => catalogue.filter((p) => p.groupId === id).map((p) => p.id),
        false,
      );
    }
    case "job": {
      const ids = applyOrder(
        state.groupOrder.job,
        catalogueJobs.map((g) => g.id),
      );
      return build(
        ids,
        (id) => catalogue.filter((p) => p.jobId === id).map((p) => p.id),
        false,
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
      // Anything not filed anywhere still has to be reachable, so it collects in
      // a group the user cannot delete rather than disappearing from the nav.
      const filed = new Set(groups.flatMap((g) => g.productIds));
      const loose = catalogue.filter((p) => !filed.has(p.id)).map((p) => p.id);
      if (loose.length === 0) return groups;
      return [
        ...groups,
        {
          id: "ungrouped",
          label: labelForGroup(state, "ungrouped"),
          defaultLabel: "Everything else",
          icon: iconForGroup(state, "ungrouped"),
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
