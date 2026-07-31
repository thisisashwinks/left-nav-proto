import { CreditCard, Smartphone } from "lucide-react";
import {
  iconForProduct,
  labelForProduct,
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
 * The middle of the nav, derived from the active grouping.
 *
 * One function for both nav faces so the rail and the expanded nav can never
 * disagree about what the nav contains — they only differ in how they draw it.
 */
export function navEntriesFor(
  state: NavLayoutState,
  groups: ResolvedGroup[],
): NavEntry[] {
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
