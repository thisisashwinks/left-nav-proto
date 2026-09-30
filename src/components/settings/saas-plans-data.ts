import type { SaasTier } from "@/design/plans";

/**
 * Agency › SaaS configurator, as the production screen actually holds it.
 *
 * The configurator already had a Plans tab in this prototype, built as three
 * tier cards with a navigation-layout picker on each. That was a sketch of
 * the model, not of the screen — production has a plan LIST whose rows open a
 * seven-tab editor, and the navigation template belongs on one of those tabs
 * beside the two attachments already there. Ashwin supplied the screens on
 * Sep 30; this is the data behind them.
 *
 * Keyed by `SaasTier` so the three plans are the same three the rest of the
 * prototype prices, entitles and upgrades between. A parallel list of plan
 * objects would have been quicker and would have left the configurator
 * selling plans the plan wall has never heard of.
 */

export interface SaasPlan {
  tier: SaasTier;
  /** What the agency called it. Renameable on the editor's Plan details tab. */
  name: string;
  /** The hierarchy a plan sits in, for upgrade paths. A chip beside the name. */
  category: string;
  /** Shown under the name with a copy button. Opaque on purpose. */
  productId: string;
  description: string;
  monthly: string;
  annual: string;
  trialDays: number;
  /** Complimentary credits, already formatted. */
  credits: string;
  /**
   * The account snapshot this plan hands to new sub-accounts, if any.
   *
   * Distinct from the navigation template, and the distinction is the reason
   * both buttons exist: a snapshot is the account's CONTENT — funnels,
   * workflows, calendars — copied in once at creation. A template is the
   * shape of the navigation, which the agency keeps managing afterwards. They
   * arrive together and diverge immediately.
   */
  snapshot: string | null;
  /** The navigation template attached on the Features tab. See the modal. */
  templateId: string | null;
  customLinks: number;
}

export const saasPlans: SaasPlan[] = [
  {
    tier: "basic",
    name: "Starter",
    category: "Category1",
    productId: "prod_R4kQ2mXb",
    description: "The core CRM for a business getting its first system.",
    monthly: "$100",
    annual: "$970",
    trialDays: 12,
    credits: "$5",
    snapshot: null,
    templateId: null,
    customLinks: 0,
  },
  {
    tier: "growth",
    name: "Professional",
    category: "Category1",
    productId: "prod_R4kQ7pLd",
    description: "Marketing, automation and reporting on top of the CRM.",
    monthly: "$197",
    annual: "$1970",
    trialDays: 7,
    credits: "$0",
    snapshot: "Industry Template - Day Spa",
    templateId: null,
    customLinks: 1,
  },
  {
    tier: "premium",
    name: "Charge_V5",
    category: "Category1",
    productId: "prod_R4kQ9wNe",
    description: "Everything, including commerce and the AI suite.",
    monthly: "$197",
    annual: "$1970",
    trialDays: 0,
    credits: "$0",
    snapshot: null,
    templateId: null,
    customLinks: 0,
  },
];

/** The tabs the plan editor carries. Only two of the seven are built out. */
export const PLAN_TABS = [
  "Plan details",
  "Pricing",
  "Features",
  "Addons",
  "Marketplace apps",
  "Trial and credits",
  "Rebilling",
] as const;

export type PlanTab = (typeof PLAN_TABS)[number];

/** The dashboard's own tabs. Only Plans & pricing is built out. */
export const SAAS_TABS = [
  "Plans & pricing",
  "Advanced settings",
  "Security",
  "Configure",
  "Cancellation settings",
  "Downgrade settings",
  "Automatic Tax",
] as const;

export type SaasTab = (typeof SAAS_TABS)[number];

/**
 * One row of the Features table: a product area and how much of it is on.
 *
 * `of` is how many features the area holds and `on` how many this plan
 * enables, which is what the `(3/8)` beside each name reads out. The toggle
 * is "Enable all" rather than a state of its own — it is the row's shortcut
 * to `on === of`, and the group discloses to the individual features
 * underneath.
 *
 * Deliberately not derived from the nav catalogue, close as the names are. A
 * plan's features are entitlements the platform sells; the catalogue is the
 * navigation those entitlements light up. They correspond today and the
 * moment one ships a feature the other has no row for, a derivation would
 * either invent a nav row or hide a billable feature.
 */
export interface FeatureArea {
  id: string;
  label: string;
  desc: string;
  of: number;
}

export const featureAreas: FeatureArea[] = [
  {
    id: "ai-agents",
    label: "AI Agents",
    desc: "Automate conversations, content, reviews, and tasks using AI agents.",
    of: 8,
  },
  {
    id: "automation",
    label: "Automation",
    desc: "Automate workflows, triggers, and customer communication sequences.",
    of: 3,
  },
  {
    id: "calendar",
    label: "Calendar",
    desc: "Manage appointments, bookings, availability, and scheduling automation.",
    of: 1,
  },
  {
    id: "crm",
    label: "CRM",
    desc: "Manage contacts, conversations, pipelines, and customer relationships.",
    of: 7,
  },
  {
    id: "labs",
    label: "Labs",
    desc: "Access experimental and upcoming platform features.",
    of: 1,
  },
  {
    id: "landing",
    label: "Landing",
    desc: "Overview and quick access to account setup and performance.",
    of: 2,
  },
  {
    id: "marketing",
    label: "Marketing",
    desc: "Plan, automate, and optimize marketing campaigns and outreach.",
    of: 7,
  },
  {
    id: "media",
    label: "Media Storage",
    desc: "Store and organize images, videos, and files.",
    of: 1,
  },
  {
    id: "memberships",
    label: "Memberships",
    desc: "Create communities, courses, and exclusive member experiences.",
    of: 5,
  },
  {
    id: "mobile",
    label: "Mobile App",
    desc: "Manage your business on the go using mobile tools.",
    of: 1,
  },
  {
    id: "payments",
    label: "Payments",
    desc: "Collect payments, manage invoices, and handle transactions easily.",
    of: 4,
  },
  {
    id: "private-integrations",
    label: "Private Integrations",
    desc: "Connect custom integrations and external APIs securely.",
    of: 1,
  },
  {
    id: "reporting",
    label: "Reporting",
    desc: "Analyze performance with marketing, sales, and attribution reports.",
    of: 8,
  },
  {
    id: "sites",
    label: "Sites",
    desc: "Build funnels, websites, forms, and surveys.",
    of: 9,
  },
  {
    id: "reputation",
    label: "Reputation",
    desc: "Request, monitor, and respond to reviews across platforms.",
    of: 3,
  },
  {
    id: "commerce",
    label: "Commerce",
    desc: "Sell products, manage orders, and run an online store.",
    of: 4,
  },
];

/** Every feature this account could sell, for the `48/65 selected` readout. */
export const totalFeatures = featureAreas.reduce((n, a) => n + a.of, 0);

/**
 * What each plan starts with switched on, as area id → count.
 *
 * Seeded per tier rather than uniformly so the three plans differ the way the
 * screenshots do — Starter at 48/65, Professional at 63/65. A reviewer
 * comparing two plans needs them to actually differ, or the tab looks like
 * one screen drawn three times.
 */
export const planFeatureSeed: Record<SaasTier, Record<string, number>> = {
  basic: {
    "ai-agents": 8,
    automation: 0,
    calendar: 1,
    crm: 7,
    labs: 1,
    landing: 2,
    marketing: 6,
    media: 1,
    memberships: 2,
    mobile: 1,
    payments: 3,
    "private-integrations": 1,
    reporting: 3,
    sites: 9,
    reputation: 3,
    commerce: 0,
  },
  growth: {
    "ai-agents": 8,
    automation: 3,
    calendar: 1,
    crm: 7,
    labs: 1,
    landing: 2,
    marketing: 7,
    media: 1,
    memberships: 5,
    mobile: 1,
    payments: 4,
    "private-integrations": 1,
    reporting: 8,
    sites: 9,
    reputation: 3,
    commerce: 3,
  },
  premium: Object.fromEntries(featureAreas.map((a) => [a.id, a.of])),
};
