import {
  ChartLine,
  CreditCard,
  GamepadDirectional,
  History,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Send,
  Settings,
  Smartphone,
  Target,
  Users,
  Workflow,
} from "lucide-react";
import type { NavConfig } from "./types";

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
    { id: "recent", label: "Recent", icon: History, hasFlyout: true },
    { id: "ai-agents", label: "AI Agents", ai: true, hasFlyout: true },
    {
      id: "quick-actions",
      label: "Quick Actions",
      icon: GamepadDirectional,
      hasFlyout: true,
    },
  ],
  entries: [
    {
      kind: "item",
      item: {
        id: "engage",
        label: "Engage",
        icon: MessagesSquare,
        hasFlyout: true,
      },
    },
    {
      kind: "item",
      item: { id: "convert", label: "Convert", icon: Target, hasFlyout: true },
    },
    {
      kind: "item",
      item: { id: "market", label: "Market", icon: Megaphone, hasFlyout: true },
    },
    {
      kind: "item",
      item: {
        id: "automate",
        label: "Automate",
        icon: Workflow,
        hasFlyout: true,
      },
    },
    {
      kind: "item",
      item: { id: "analyze", label: "Analyze", icon: ChartLine, hasFlyout: true },
    },
    { kind: "divider", id: "div-3" },
    {
      kind: "item",
      item: { id: "mobile-app", label: "Mobile App", icon: Smartphone },
    },
    {
      kind: "item",
      item: { id: "payments-nav", label: "Payments", icon: CreditCard },
    },
    { kind: "divider", id: "div-4" },
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
