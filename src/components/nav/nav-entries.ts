import { Link2 } from "lucide-react";
import {
  iconForProduct,
  labelForProduct,
  NAV_VOLUME_EXTRA_LINKS,
  UNGROUPED_ID,
  type NavLayoutState,
  type ResolvedGroup,
} from "./grouping";
import { PROPOSED_SETTINGS_ID } from "./proposed-ia";
import type { NavEntry, NavItem } from "./types";

/**
 * The custom links the volume switch piles on.
 *
 * Named like the real thing rather than "Item 7" — an agency's nav fills up with
 * links to their own tools, and a nav full of placeholder text does not read like
 * the problem it is standing in for. They carry no flyout, because a custom link is
 * a destination.
 */
const CUSTOM_LINK_NAMES = [
  "Client portal",
  "Onboarding hub",
  "Support desk",
  "Billing portal",
  "Brand assets",
  "Training library",
  "Partner directory",
  "Status page",
  "Release notes",
  "Community",
  "Referral program",
  "Templates vault",
  "Reporting exports",
  "Compliance centre",
  "Vendor invoices",
];

function volumeLinks(count: number): NavItem[] {
  return Array.from({ length: count }, (_, i) => ({
    // Wraps rather than running out, so `overloaded` can exceed the name list.
    id: `custom-link-${i + 1}`,
    label:
      i < CUSTOM_LINK_NAMES.length
        ? (CUSTOM_LINK_NAMES[i] as string)
        : `${CUSTOM_LINK_NAMES[i % CUSTOM_LINK_NAMES.length]} ${
            Math.floor(i / CUSTOM_LINK_NAMES.length) + 1
          }`,
    icon: Link2,
  }));
}

/**
 * The account's own links — its portals, wikis and supplier tools.
 *
 * Real per tenant rather than generated, because the point they make is
 * different from the volume switch's: these are the handful of links a
 * roofing company genuinely has, and they are what makes one account's nav
 * read as a different business from its neighbour's.
 */
function accountLinks(labels: string[]): NavItem[] {
  return labels.map((label, i) => ({
    id: `account-link-${i + 1}`,
    label,
    icon: Link2,
  }));
}

/**
 * The middle of the nav, derived from the active grouping.
 *
 * One function for both nav faces so the rail and the expanded nav can never
 * disagree about what the nav contains — they only differ in how they draw it.
 * That includes the volume switch's custom links, which is why it belongs here
 * rather than in either face.
 */
/**
 * The tail's rows, in the account's own order.
 *
 * Products no category claims and the account's own links are one list here,
 * because on screen they are one run of rows — and because a drag has to be able
 * to put a product between two links. The volume switch's generated links stay at
 * the end: they are stress-test scaffolding, not something anyone arranges.
 */
export function tailRowsFor(
  state: NavLayoutState,
  looseIds: readonly string[],
): NavItem[] {
  const links = accountLinks(state.customLinks);
  const byId = new Map<string, NavItem>();
  for (const id of looseIds) {
    byId.set(id, {
      id,
      label: labelForProduct(state, id),
      icon: iconForProduct(state, id),
    });
  }
  for (const link of links) byId.set(link.id, link);
  const defaults = [...looseIds, ...links.map((l) => l.id)];
  const known = state.tailOrder.filter((id) => byId.has(id));
  const missing = defaults.filter((id) => !known.includes(id));
  return [...known, ...missing]
    .map((id) => byId.get(id))
    .filter((item): item is NavItem => item !== undefined);
}

export function navEntriesFor(
  state: NavLayoutState,
  groups: ResolvedGroup[],
  /**
   * Headings instead of rules.
   *
   * Each band gets the small caps label Recent already wears, and the label is
   * what folds it — see `left-nav.tsx`, which owns the fold state because it is
   * a property of the face rather than of the tree.
   */
  sectionHeadings = false,
): NavEntry[] {
  /** A band opener: a heading when they are on, otherwise the rule we shipped. */
  const band = (id: string, text: string): NavEntry =>
    sectionHeadings
      ? { kind: "label", id: `sec-${id}`, text }
      : { kind: "divider", id: `div-${id}` };
  const extra = volumeLinks(NAV_VOLUME_EXTRA_LINKS[state.navVolume]);
  const extraEntries: NavEntry[] =
    extra.length === 0
      ? []
      : [
          ...extra.map((item): NavEntry => ({ kind: "item", item })),
          // With headings the band is opened by its label, so a closing rule
          // would draw a line between it and Settings for no reason.
          ...(sectionHeadings
            ? []
            : [{ kind: "divider" as const, id: "div-custom" }]),
        ];

  const productRow = (id: string): NavEntry => ({
    kind: "item",
    item: {
      id,
      label: labelForProduct(state, id),
      icon: iconForProduct(state, id),
    },
  });

  const shelfRow = (group: ResolvedGroup): NavEntry => ({
    kind: "item",
    item: {
      id: group.id,
      label: group.label,
      icon: group.icon,
      hasFlyout: true,
      flyoutId: group.id,
    },
  });

  if (state.grouping === "proposed") {
    /*
     * The proposal's band order, which is authored rather than derived: the
     * buckets that own products, a rule, the two destinations that own none, a
     * rule, then the account's own links. Settings is absent on purpose — it is
     * a bucket whose products fill the nav's existing bottom-anchored Settings
     * row, so putting it in this list would draw it twice.
     */
    const loose = groups.find((g) => g.id === UNGROUPED_ID)?.productIds ?? [];
    const buckets = groups.filter(
      (g) => g.id !== UNGROUPED_ID && g.id !== PROPOSED_SETTINGS_ID,
    );
    return [
      /*
       * No Launchpad row. The card above Recent is its only nav affordance — a
       * row as well would be the same door twice, which is what it looked like.
       * It still appears in the breadcrumb's top-level menu, since from AI or CRM
       * you have to be able to get back to it.
       */
      ...(sectionHeadings ? [band("ia-buckets", "Products")] : []),
      ...buckets.map(shelfRow),
      /*
       * One "More" band, not three.
       *
       * Mobile, the account's own links and Settings were a heading each, which
       * gave the tail of the nav more headings than rows. They are all the same
       * kind of thing — the stuff that is not a product — so they share a band.
       * Settings is appended by `left-nav`, since it is the face that owns the
       * bottom anchor.
       */
      /*
       * No rule between the categories and the tail.
       *
       * They read as one list because they behave as one: a row can be dragged
       * out of a category into the tail and back, and a line across the middle
       * made that look like a boundary the drag was not allowed to cross. The
       * heading survives for the arrangement that names its bands — a label is a
       * name for what follows, which a rule is not.
       */
      ...(sectionHeadings ? [band("ia-more", "More")] : []),
      ...tailRowsFor(state, loose).map((item): NavEntry => ({
        kind: "item",
        item,
      })),
      ...extraEntries,
    ];
  }

  if (state.grouping === "flat") {
    // No headings and no chevrons: in flat mode a row is a destination, not a
    // door to a panel, which is the whole point of the mode.
    const products = groups[0]?.productIds ?? [];
    return [
      ...(sectionHeadings ? [band("flat", "Products")] : []),
      ...products.map(productRow),
      ...(sectionHeadings
        ? [band("flat-more", "More")]
        : [{ kind: "divider" as const, id: "div-flat" }]),
      ...extraEntries,
    ];
  }

  /*
   * Products the custom tree leaves unfiled are rows, not a group.
   *
   * Drawing them under an "Everything else" heading made the nav lie twice: it
   * implied a shelf the user never built, and it buried the two or three things
   * they had deliberately pulled out of every group behind a chevron. As rows
   * they read as what they are — top level, no heading, one click.
   */
  const loose =
    groups.find((g) => g.id === UNGROUPED_ID)?.productIds ?? [];
  /*
   * The Settings bucket never becomes a row here either.
   *
   * Its products fill the nav's bottom-anchored Settings row, so drawing it as
   * a shelf as well is the same door twice. That exclusion lived only in the
   * `proposed` branch above — but the rule belongs to the TREE, not to the
   * mode: applying a template converts an account to `custom`, this branch
   * takes over, and Settings appeared as a bucket AND as the anchor.
   */
  const shelves = groups.filter(
    (g) =>
      g.id !== PROPOSED_SETTINGS_ID &&
      (loose.length === 0 || g.id !== UNGROUPED_ID),
  );

  return [
    ...(sectionHeadings ? [band("groups", "Products")] : []),
    ...shelves.map(shelfRow),
    ...(sectionHeadings
      ? [band("groups-more", "More")]
      : [{ kind: "divider" as const, id: "div-groups" }]),
    ...loose.map(productRow),
    ...extraEntries,
  ];
}

/** Which of a row's ids the override maps are keyed by, or null if it is chrome. */
export function editTargetFor(
  state: NavLayoutState,
  groups: ResolvedGroup[],
  itemId: string,
): { kind: "group" | "product"; id: string } | null {
  if (groups.some((g) => g.id === itemId)) return { kind: "group", id: itemId };
  if (state.grouping === "flat" && groups[0]?.productIds.includes(itemId)) {
    return { kind: "product", id: itemId };
  }
  // Top-level rows are products, so renaming one in the nav writes the product
  // override rather than doing nothing.
  if (
    (state.grouping === "custom" || state.grouping === "proposed") &&
    groups.find((g) => g.id === UNGROUPED_ID)?.productIds.includes(itemId)
  ) {
    return { kind: "product", id: itemId };
  }
  return null;
}
