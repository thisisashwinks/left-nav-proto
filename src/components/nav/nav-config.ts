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
import type { NavConfig, NavItem } from "./types";

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
  settings: { id: "settings", label: "Settings", icon: Settings },
};

/**
 * Which flyout a nav row opens. The Pencil reference renders Engage in its open
 * state, but nothing is selected on first load here — selection follows what the
 * user actually clicks.
 */
export function flyoutIdFor(item: { id: string; flyoutId?: string }): string {
  return item.flyoutId ?? item.id;
}
