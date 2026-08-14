import { CreditCard, Link2, Smartphone } from "lucide-react";
import {
  iconForProduct,
  labelForProduct,
  NAV_VOLUME_EXTRA_LINKS,
  UNGROUPED_ID,
  type NavLayoutState,
  type ResolvedGroup,
} from "./grouping";
import type { NavEntry, NavItem } from "./types";

/**
 * The workspace links that sit below the product block in left-nav.pen.
 *
 * Kept out of the grouping entirely. They are shortcuts to places that already
 * live inside a group — the research's "cross-cutting entities" question, whose
 * working answer is one canonical destination plus contextual surfacing — so
 * they are pinned chrome rather than another view of the catalogue. Flat mode
 * drops them, because there they would be the same row twice.
 *
 * Each one names a product, so an account that never bought it gets no
 * shortcut: a barbershop with no mobile app should not carry a row to it.
 */
const WORKSPACE_LINKS: (NavItem & { productId: string })[] = [
  { id: "mobile-app-link", productId: "mobile-app", label: "Mobile App", icon: Smartphone },
  { id: "payments-link", productId: "payments", label: "Payments", icon: CreditCard },
];

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
export function navEntriesFor(
  state: NavLayoutState,
  groups: ResolvedGroup[],
): NavEntry[] {
  const extra = [
    ...accountLinks(state.customLinks),
    ...volumeLinks(NAV_VOLUME_EXTRA_LINKS[state.navVolume]),
  ];
  const extraEntries: NavEntry[] =
    extra.length === 0
      ? []
      : [
          ...extra.map((item): NavEntry => ({ kind: "item", item })),
          { kind: "divider", id: "div-custom" },
        ];

  const workspaceLinks = WORKSPACE_LINKS.filter((link) =>
    state.enabledProducts.includes(link.productId),
  );

  const productRow = (id: string): NavEntry => ({
    kind: "item",
    item: {
      id,
      label: labelForProduct(state, id),
      icon: iconForProduct(state, id),
    },
  });

  if (state.grouping === "flat") {
    // No headings and no chevrons: in flat mode a row is a destination, not a
    // door to a panel, which is the whole point of the mode.
    const products = groups[0]?.productIds ?? [];
    return [
      ...products.map(productRow),
      { kind: "divider", id: "div-flat" },
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
  const shelves = loose.length === 0 ? groups : groups.filter((g) => g.id !== UNGROUPED_ID);

  return [
    ...shelves.map(
      (group): NavEntry => ({
        kind: "item",
        item: {
          id: group.id,
          label: group.label,
          icon: group.icon,
          hasFlyout: true,
          flyoutId: group.id,
        },
      }),
    ),
    ...loose.map(productRow),
    { kind: "divider", id: "div-groups" },
    ...workspaceLinks.map((item): NavEntry => ({ kind: "item", item })),
    { kind: "divider", id: "div-workspace" },
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
    state.grouping === "custom" &&
    groups.find((g) => g.id === UNGROUPED_ID)?.productIds.includes(itemId)
  ) {
    return { kind: "product", id: itemId };
  }
  return null;
}
