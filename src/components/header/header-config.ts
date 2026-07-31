import { Bell, Info, Phone, Rocket, type LucideIcon } from "lucide-react";

export interface HeaderTab {
  id: string;
  label: string;
}

/** Which token supplies the circular button's background. */
export type HeaderActionTone = "call" | "ai" | "launch" | "alert" | "neutral";

export interface HeaderAction {
  id: string;
  label: string;
  tone: HeaderActionTone;
  /** Omitted for the AI action, which uses the filled sparkle. */
  icon?: LucideIcon;
  ai?: boolean;
}

export interface HeaderConfig {
  tabs: HeaderTab[];
  activeTabId: string;
  whatsNewLabel: string;
  updatesLabel: string;
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
  whatsNewLabel: "What's new",
  updatesLabel: "Contact updates",
  actions: [
    { id: "call", label: "Call", tone: "call", icon: Phone },
    { id: "ai", label: "AI assistant", tone: "ai", ai: true },
    { id: "launch", label: "What's shipping", tone: "launch", icon: Rocket },
    { id: "alerts", label: "Notifications", tone: "alert", icon: Bell },
    { id: "help", label: "Help", tone: "neutral", icon: Info },
  ],
  avatarInitials: "NS",
};
