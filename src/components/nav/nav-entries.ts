import { CreditCard, Link2, Smartphone } from "lucide-react";
import {
  iconForProduct,
  labelForProduct,
  NAV_VOLUME_EXTRA_LINKS,
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
 */
const workspaceLinks: NavItem[] = [
  { id: "mobile-app-link", label: "Mobile App", icon: Smartphone },
  { id: "payments-link", label: "Payments", icon: CreditCard },
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

function customLinks(count: number): NavItem[] {
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
  const extra = customLinks(NAV_VOLUME_EXTRA_LINKS[state.navVolume]);
  const extraEntries: NavEntry[] =
    extra.length === 0
      ? []
      : [
          ...extra.map((item): NavEntry => ({ kind: "item", item })),
          { kind: "divider", id: "div-custom" },
        ];

  if (state.grouping === "flat") {
    // No headings and no chevrons: in flat mode a row is a destination, not a
    // door to a panel, which is the whole point of the mode.
    const products = groups[0]?.productIds ?? [];
    return [
      ...products.map(
        (id): NavEntry => ({
          kind: "item",
          item: {
            id,
            label: labelForProduct(state, id),
            icon: iconForProduct(state, id),
          },
        }),
      ),
      { kind: "divider", id: "div-flat" },
      ...extraEntries,
    ];
  }

  return [
    ...groups.map(
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
  return null;
}
