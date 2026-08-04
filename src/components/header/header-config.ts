import { Bell, Info, Phone, Rocket, type LucideIcon } from "lucide-react";

export interface HeaderTab {
  id: string;
  label: string;
}

/**
 * How the action is drawn.
 *
 * Only one filled treatment survives. Four saturated discs in a row — green,
 * orange, red, grey — competed with each other and with the accent, and colour
 * that means nothing but "this is a button" spends the loudest thing on the page
 * on chrome. `plain` is the default; `call` keeps its fill because placing a call
 * is the one irreversible action up here and worth the emphasis.
 */
export type HeaderActionTone = "call" | "plain";

export interface HeaderAction {
  id: string;
  label: string;
  tone: HeaderActionTone;
  icon: LucideIcon;
  /** Unread marker. Carries the signal the red disc used to. */
  dot?: boolean;
}

export interface HeaderConfig {
  tabs: HeaderTab[];
  activeTabId: string;
  actions: HeaderAction[];
  avatarInitials: string;
}

/** Mirrors the AppBar in "Screen A · Nav open + Contacts". */
export const headerConfig: HeaderConfig = {
  tabs: [
    { id: "contacts", label: "Contacts" },
    { id: "smart-lists", label: "Smart lists" },
    { id: "bulk-actions", label: "Bulk actions" },
    { id: "custom-fields", label: "Custom fields" },
    { id: "tasks", label: "Tasks" },
    { id: "companies", label: "Companies" },
  ],
  activeTabId: "smart-lists",
  actions: [
    // No AI action here. The assistant is a standing entry point in the nav
    // now, and two doors to the same thing — one of which vanishes inside a
    // builder — is worse than one that is always in the same place.
    { id: "call", label: "Call", tone: "call", icon: Phone },
    { id: "launch", label: "What's shipping", tone: "plain", icon: Rocket },
    { id: "alerts", label: "Notifications", tone: "plain", icon: Bell, dot: true },
    { id: "help", label: "Help", tone: "plain", icon: Info },
  ],
  avatarInitials: "NS",
};
