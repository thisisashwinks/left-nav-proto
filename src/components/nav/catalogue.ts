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
 * Everything the account owns, and the two ways the product ships it grouped.
 *
 * One source of truth for the pieces that need to agree: the pinned row, the
 * grid launcher, the nav's own rows, and the label overrides. Anything pinnable
 * lives here.
 *
 * Each product carries both a `groupId` (the SKU grouping we ship today) and a
 * `jobId` (the outcome it serves). Two organizing units on the same catalogue is
 * what makes the grouping modes views rather than separate data — see
 * grouping.ts.
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
  /** SKU grouping — Engage, Convert, Market, Automate, Analyze. */
  groupId: string;
  /** Outcome grouping — the job the user came here to get done. */
  jobId: string;
  /** One line of what it is. Feeds the flyout rows for generated panels. */
  blurb: string;
}

/** The five product groupings, in nav order. */
export const catalogueGroups: CatalogueGroup[] = [
  { id: "engage", defaultLabel: "Engage", icon: MessageCircle },
  { id: "convert", defaultLabel: "Convert", icon: Target },
  { id: "market", defaultLabel: "Market", icon: Megaphone },
  { id: "automate", defaultLabel: "Automate", icon: Workflow },
  { id: "analyze", defaultLabel: "Analyze", icon: ChartLine },
];

/**
 * The same catalogue grouped by the job the user is trying to get done.
 *
 * Straight out of the nav research: "Group by the user's job, not by team or
 * SKU. HubSpot's job-based nav validated this (Tenet 4); grouping by feature/SKU
 * is the failure the earlier IA exercise hit." Labels are verb-first for the
 * same reason — a job is something you do, not a department you visit.
 */
export const catalogueJobs: CatalogueGroup[] = [
  { id: "job-attract", defaultLabel: "Get customers", icon: Megaphone },
  { id: "job-talk", defaultLabel: "Talk to customers", icon: MessageCircle },
  { id: "job-paid", defaultLabel: "Get paid", icon: CreditCard },
  { id: "job-autopilot", defaultLabel: "Run on autopilot", icon: Workflow },
  { id: "job-measure", defaultLabel: "See how it's going", icon: ChartLine },
];

export const catalogue: CatalogueProduct[] = [
  {
    id: "conversations",
    label: "Conversations",
    icon: MessageCircle,
    groupId: "engage",
    jobId: "job-talk",
    blurb: "Unified inbox — SMS, email, chat and social in one place.",
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: Users,
    groupId: "engage",
    jobId: "job-talk",
    blurb: "People, companies and smart lists.",
  },
  {
    id: "calendars",
    label: "Calendars",
    icon: Calendar,
    groupId: "engage",
    jobId: "job-talk",
    blurb: "Scheduling, availability and appointments.",
  },
  {
    id: "reputation",
    label: "Reputation",
    icon: Star,
    groupId: "engage",
    jobId: "job-attract",
    blurb: "Reviews, ratings and business listings.",
  },
  {
    id: "meetings",
    label: "Meetings",
    icon: Video,
    groupId: "engage",
    jobId: "job-talk",
    blurb: "Online meetings and collaboration.",
  },

  {
    id: "opportunities",
    label: "Opportunities",
    icon: Target,
    groupId: "convert",
    jobId: "job-paid",
    blurb: "Pipelines, stages and deal value.",
  },
  {
    id: "invoices",
    label: "Invoices & estimates",
    icon: Receipt,
    groupId: "convert",
    jobId: "job-paid",
    blurb: "Bill customers and chase what is owed.",
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    groupId: "convert",
    jobId: "job-paid",
    blurb: "Take card payments and reconcile payouts.",
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    groupId: "convert",
    jobId: "job-paid",
    blurb: "Your catalogue, pricing and inventory.",
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: Repeat,
    groupId: "convert",
    jobId: "job-paid",
    blurb: "Recurring plans, trials and dunning.",
  },

  {
    id: "marketing",
    label: "Marketing",
    icon: Megaphone,
    groupId: "market",
    jobId: "job-attract",
    blurb: "Campaigns, audiences and ad connections.",
  },
  {
    id: "sites",
    label: "Sites & funnels",
    icon: LayoutTemplate,
    groupId: "market",
    jobId: "job-attract",
    blurb: "Landing pages, funnels and forms.",
  },
  {
    id: "stores",
    label: "Stores",
    icon: ShoppingCart,
    groupId: "market",
    jobId: "job-paid",
    blurb: "Sell online with a hosted storefront.",
  },
  {
    id: "events",
    label: "Events",
    icon: Ticket,
    groupId: "market",
    jobId: "job-attract",
    blurb: "Ticketing, registration and check-in.",
  },
  {
    id: "memberships",
    label: "Memberships",
    icon: Globe,
    groupId: "market",
    jobId: "job-paid",
    blurb: "Courses, communities and gated content.",
  },
  {
    id: "email-campaigns",
    label: "Email Campaigns",
    icon: Mail,
    groupId: "market",
    jobId: "job-attract",
    blurb: "Broadcasts, sequences and deliverability.",
  },
  {
    id: "email-templates",
    label: "Email Templates",
    icon: FileText,
    groupId: "market",
    jobId: "job-attract",
    blurb: "Reusable layouts and saved blocks.",
  },

  {
    id: "automation",
    label: "Automation",
    icon: Workflow,
    groupId: "automate",
    jobId: "job-autopilot",
    blurb: "Workflows, triggers and handoffs.",
  },
  {
    id: "ai-agents-product",
    label: "AI Agents",
    icon: Bot,
    groupId: "automate",
    jobId: "job-autopilot",
    blurb: "Agents that reply, qualify and book for you.",
  },
  {
    id: "agent-library",
    label: "Agent library",
    icon: Boxes,
    groupId: "automate",
    jobId: "job-autopilot",
    blurb: "Prebuilt agents you can clone and tune.",
  },

  {
    id: "reporting",
    label: "Reporting",
    icon: ChartLine,
    groupId: "analyze",
    jobId: "job-measure",
    blurb: "Attribution, call and conversion reports.",
  },
  {
    id: "dashboards",
    label: "Dashboards",
    icon: Gauge,
    groupId: "analyze",
    jobId: "job-measure",
    blurb: "Live widgets across every product.",
  },

  {
    id: "mobile-app",
    label: "Mobile App",
    icon: Smartphone,
    groupId: "engage",
    jobId: "job-talk",
    blurb: "Take the workspace with you on iOS and Android.",
  },
];

const BY_ID = new Map(catalogue.map((p) => [p.id, p]));

export function productById(id: string): CatalogueProduct | undefined {
  return BY_ID.get(id);
}

export function productsInGroup(groupId: string): CatalogueProduct[] {
  return catalogue.filter((p) => p.groupId === groupId);
}

export function productsInJob(jobId: string): CatalogueProduct[] {
  return catalogue.filter((p) => p.jobId === jobId);
}

/** What a fresh account starts pinned with — the five from the design. */
export const DEFAULT_PINNED = [
  "conversations",
  "contacts",
  "email-campaigns",
  "opportunities",
  "payments",
];
