import {
  Calendar,
  CheckCheck,
  CreditCard,
  Ellipsis,
  GamepadDirectional,
  History,
  Mail,
  MessageCircle,
  Send,
  Settings,
  Target,
  Users,
} from "lucide-react";
import {
  iconForProduct,
  labelForProduct,
  type NavLayoutState,
} from "./grouping";
import type { NavConfig, NavEntry, NavItem } from "./types";

/**
 * The Recent block, straight from "Screen A · Nav open + Contacts" in
 * left-nav.pen: a RECENT label, three compact rows with no chevron, then a
 * "More" row that opens the full Recent panel.
 *
 * The three rows are the last places the user was, so they are real
 * destinations, not a preview of a menu — which is why they carry no chevron and
 * sit on the design's tighter 6px padding rather than the standard 9px.
 */
const recentItems: NavItem[] = [
  { id: "recent-tasks", label: "Tasks", icon: CheckCheck, density: "compact" },
  {
    id: "recent-email-campaigns",
    label: "Email Campaigns",
    icon: Mail,
    density: "compact",
  },
  {
    id: "recent-calendars",
    label: "Calendars",
    icon: Calendar,
    density: "compact",
  },
];

/** Standard row density and a chevron: this one is the door to the panel. */
const recentMore: NavItem = {
  id: "recent-more",
  label: "More",
  icon: Ellipsis,
  hasFlyout: true,
  flyoutId: "recent",
};

const aiAgents: NavItem = {
  id: "ai-agents",
  label: "AI Agents",
  ai: true,
  hasFlyout: true,
};

const quickActions: NavItem = {
  id: "quick-actions",
  label: "Quick Actions",
  icon: GamepadDirectional,
  hasFlyout: true,
};

/**
 * Mirrors "Screen A · Nav open + Contacts" in left-nav.pen, top to bottom.
 * Kept as data so labels and ordering can be overridden later without
 * touching the components.
 */
export const navConfig: NavConfig = {
  logoAlt: "Account logo",
  pinned: [
    { id: "conversations", label: "Conversations", icon: MessageCircle },
    { id: "contacts", label: "Contacts", icon: Users },
    { id: "campaigns", label: "Campaigns", icon: Send },
    { id: "opportunities", label: "Opportunities", icon: Target },
    { id: "payments", label: "Payments", icon: CreditCard },
  ],
  // Fixed cluster: the standing entry points, above anything that scrolls.
  fixed: [
    { kind: "label", id: "recent-label", text: "Recent" },
    ...recentItems.map((item) => ({ kind: "item" as const, item })),
    { kind: "item", item: recentMore },
    { kind: "divider", id: "div-recent" },
    { kind: "item", item: aiAgents },
    { kind: "item", item: quickActions },
  ],
  railFixed: [
    // The rail has no section labels and no room for three rows, so Recent goes
    // back to being one icon — the panel behind "More" is the same one.
    { id: "recent", label: "Recent", icon: History, hasFlyout: true, flyoutId: "recent" },
    aiAgents,
    quickActions,
  ],
  // Last row in the scroll region, so the nav's bottom edge is free for the AI
  // dock rather than being taken by a pinned Settings footer.
  settings: {
    id: "settings",
    label: "Settings",
    icon: Settings,
    hasFlyout: true,
    flyoutId: "settings-menu",
  },
};

/** How many places the inline Recent block can name at most. */
const RECENT_ROWS = 3;

/**
 * The fixed cluster with its Recent rows resolved against the account.
 *
 * The authored rows name Tasks, Email Campaigns and Calendars — fine for the
 * account the design was drawn from, wrong for a barbershop that has none of
 * them. Recent is a claim about where this user has been, so it can only name
 * places this account has, under this account's own names.
 *
 * Stand-ins for real history: the account's products that are NOT already in
 * the dock, since somewhere you pinned is somewhere you no longer need a
 * recent row for.
 */
export function fixedEntriesFor(
  state: NavLayoutState,
  fixed: NavEntry[],
): NavEntry[] {
  const candidates = state.enabledProducts
    .filter((id) => !state.pinned.includes(id))
    .slice(0, RECENT_ROWS);

  let next = 0;
  const resolved: NavEntry[] = [];
  for (const entry of fixed) {
    const isRecentRow =
      entry.kind === "item" &&
      entry.item.id.startsWith("recent-") &&
      entry.item.id !== "recent-more";
    if (!isRecentRow) {
      resolved.push(entry);
      continue;
    }
    const productId = candidates[next];
    next += 1;
    // Fewer products than authored rows simply means fewer rows.
    if (productId === undefined) continue;
    resolved.push({
      kind: "item",
      item: {
        id: `recent-${productId}`,
        label: labelForProduct(state, productId),
        icon: iconForProduct(state, productId),
        density: "compact",
      },
    });
  }

  /*
   * The proposed tree drops the two standing entry points.
   *
   * AI Agents is a bucket of its own there, so the row was the same place twice,
   * and Quick Actions is a demo affordance the proposal never asked for. Scoped
   * to the mode rather than deleted, so every other account keeps both.
   */
  const trimmed =
    state.grouping === "proposed"
      ? resolved.filter(
          (e) =>
            !(
              e.kind === "item" &&
              (e.item.id === "ai-agents" || e.item.id === "quick-actions")
            ) && !(e.kind === "divider" && e.id === "div-recent"),
        )
      : resolved;

  // A heading over nothing is worse than no heading — the same rule
  // `trimRecents` applies at the floor tier.
  if (candidates.length > 0) return trimmed;
  return trimmed.filter(
    (e) => !(e.kind === "label" && e.id === "recent-label"),
  );
}

/**
 * Which flyout a nav row opens. The Pencil reference renders Engage in its open
 * state, but nothing is selected on first load here — selection follows what the
 * user actually clicks.
 */
export function flyoutIdFor(item: { id: string; flyoutId?: string }): string {
  return item.flyoutId ?? item.id;
}
