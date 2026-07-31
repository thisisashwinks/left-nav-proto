import {
  Bot,
  Boxes,
  Calendar,
  ChartLine,
  CreditCard,
  FileText,
  Gauge,
  Globe,
  LayoutTemplate,
  Mail,
  Megaphone,
  MessageCircle,
  Package,
  Receipt,
  Repeat,
  ShoppingCart,
  Smartphone,
  Star,
  Target,
  Ticket,
  Users,
  Video,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Everything the account owns, and which nav group owns it.
 *
 * One source of truth for the pieces that need to agree: the pinned row, the
 * grid launcher, and the group-label overrides. Anything pinnable lives here.
 */

export interface CatalogueGroup {
  id: string;
  /** The name we ship. Overrides never replace it — see the label store. */
  defaultLabel: string;
  icon: LucideIcon;
}

export interface CatalogueProduct {
  id: string;
  label: string;
  icon: LucideIcon;
  groupId: string;
}

/** The five product groupings, in nav order. */
export const catalogueGroups: CatalogueGroup[] = [
  { id: "engage", defaultLabel: "Engage", icon: MessageCircle },
  { id: "convert", defaultLabel: "Convert", icon: Target },
  { id: "market", defaultLabel: "Market", icon: Megaphone },
  { id: "automate", defaultLabel: "Automate", icon: Workflow },
  { id: "analyze", defaultLabel: "Analyze", icon: ChartLine },
];

export const catalogue: CatalogueProduct[] = [
  { id: "conversations", label: "Conversations", icon: MessageCircle, groupId: "engage" },
  { id: "contacts", label: "Contacts", icon: Users, groupId: "engage" },
  { id: "calendars", label: "Calendars", icon: Calendar, groupId: "engage" },
  { id: "reputation", label: "Reputation", icon: Star, groupId: "engage" },
  { id: "meetings", label: "Meetings", icon: Video, groupId: "engage" },

  { id: "opportunities", label: "Opportunities", icon: Target, groupId: "convert" },
  { id: "invoices", label: "Invoices & estimates", icon: Receipt, groupId: "convert" },
  { id: "payments", label: "Payments", icon: CreditCard, groupId: "convert" },
  { id: "products", label: "Products", icon: Package, groupId: "convert" },
  { id: "subscriptions", label: "Subscriptions", icon: Repeat, groupId: "convert" },

  { id: "marketing", label: "Marketing", icon: Megaphone, groupId: "market" },
  { id: "sites", label: "Sites & funnels", icon: LayoutTemplate, groupId: "market" },
  { id: "stores", label: "Stores", icon: ShoppingCart, groupId: "market" },
  { id: "events", label: "Events", icon: Ticket, groupId: "market" },
  { id: "memberships", label: "Memberships", icon: Globe, groupId: "market" },

  { id: "automation", label: "Automation", icon: Workflow, groupId: "automate" },
  { id: "ai-agents-product", label: "AI Agents", icon: Bot, groupId: "automate" },
  { id: "agent-library", label: "Agent library", icon: Boxes, groupId: "automate" },

  { id: "reporting", label: "Reporting", icon: ChartLine, groupId: "analyze" },
  { id: "dashboards", label: "Dashboards", icon: Gauge, groupId: "analyze" },
  { id: "email-campaigns", label: "Email Campaigns", icon: Mail, groupId: "market" },
  { id: "email-templates", label: "Email Templates", icon: FileText, groupId: "market" },
  { id: "mobile-app", label: "Mobile App", icon: Smartphone, groupId: "engage" },
];

const BY_ID = new Map(catalogue.map((p) => [p.id, p]));

export function productById(id: string): CatalogueProduct | undefined {
  return BY_ID.get(id);
}

export function productsInGroup(groupId: string): CatalogueProduct[] {
  return catalogue.filter((p) => p.groupId === groupId);
}

/** What a fresh account starts pinned with — the five from the design. */
export const DEFAULT_PINNED = [
  "conversations",
  "contacts",
  "email-campaigns",
  "opportunities",
  "payments",
];
