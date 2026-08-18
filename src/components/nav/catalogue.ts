import {
  BadgeDollarSign,
  Bot,
  Boxes,
  Building2,
  Calendar,
  ChartLine,
  CreditCard,
  FileSignature,
  FileText,
  Gauge,
  Globe,
  Handshake,
  LayoutTemplate,
  ListTodo,
  Mail,
  Megaphone,
  MessageCircle,
  Package,
  Presentation,
  Radar,
  Receipt,
  Repeat,
  Share2,
  ShoppingCart,
  Smartphone,
  Sparkles,
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
 *
 * `children` is the L2 layer from the Aug 13 nav audit (kb/NAV_REDESIGN_REPORT
 * §2): the sub-places that today hide inside header-tab dropdowns (Invoices &
 * Estimates ▾, Products ▾, Client Portal ▾ …). They render as nested dropdowns
 * in the flyouts. Deliberately NOT here: views (Calendar/List), actions (Bulk
 * Actions), settings fragments, and analytics fragments — those map to in-page
 * controls, Settings, and Reporting respectively, per the Mapping sheet.
 */

export interface CatalogueGroup {
  id: string;
  /** The name we ship. Overrides never replace it — see the label store. */
  defaultLabel: string;
  icon: LucideIcon;
}

/** An L2 sub-place inside a product — one of today's tab-bar dropdowns, homed. */
export interface CatalogueChild {
  id: string;
  label: string;
  badge?: { label: string; tone: "new" | "beta" };
}

export interface CatalogueProduct {
  id: string;
  label: string;
  icon: LucideIcon;
  /** SKU grouping — Engage, Convert, Market, Automate, Analyze. */
  groupId: string;
  /** Outcome grouping — the job the user came here to get done. */
  jobId: string;
  /**
   * Area grouping — the tree a new account gets.
   *
   * Typed as `SuiteId` rather than `string` on purpose. This mode has no
   * `UNGROUPED_ID` fallback, so a product carrying a typo'd area would vanish
   * from the nav, the launcher and the breadcrumbs with no error anywhere. The
   * literal type turns that into a compile error, and makes a *missing* areaId
   * one too.
   */
  suiteId: SuiteId;
  /** One line of what it is. Feeds the flyout rows for generated panels. */
  blurb: string;
  /** L2 sub-places, rendered as a nested dropdown under the product row. */
  children?: CatalogueChild[];
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

/**
 * The same catalogue grouped by product area — the tree that ships as default.
 *
 * Locked in the Aug 18 review: HubSpot's grouping becomes HighLevel's default.
 * Roughly 5–7% of users arrive from HubSpot and it is a stated competitive
 * target, but the real argument was humility — nobody in the room claimed to be
 * the expert on ideal grouping, so ship a tree the market has already validated,
 * let accounts switch away from it, and revisit on real usage data in ~6 months.
 *
 * Order is HubSpot's own. Their "Data management" and "Development" areas are
 * deliberately absent: HighLevel ships nothing that maps to imports/objects/data
 * quality or to private apps, and a group no product references would be dropped
 * by `populated()` for every account forever — declared but unreachable data. The
 * cost of that omission is `mobile-app`, which HubSpot would file under connected
 * apps and which lands in CRM here: the same records, on a phone. It is the
 * weakest of the 31 assignments and the first to revisit.
 */
export const catalogueSuites = [
  { id: "suite-crm", defaultLabel: "CRM", icon: Users },
  { id: "suite-marketing", defaultLabel: "Marketing", icon: Megaphone },
  { id: "suite-content", defaultLabel: "Content", icon: LayoutTemplate },
  { id: "suite-sales", defaultLabel: "Sales", icon: Handshake },
  { id: "suite-revenue", defaultLabel: "Revenue", icon: CreditCard },
  { id: "suite-agents", defaultLabel: "Agents", icon: Bot },
  { id: "suite-automation", defaultLabel: "Automation", icon: Workflow },
  { id: "suite-reporting", defaultLabel: "Reporting", icon: ChartLine },
] as const satisfies readonly CatalogueGroup[];

/**
 * The area ids, derived from the array rather than written twice.
 *
 * Ids are prefixed `suite-` for the same reason jobs are prefixed `job-`: all
 * three trees are flattened into one lookup in grouping.ts, and a collision
 * there would silently shadow a group's label and icon in *every* mode.
 */
export type SuiteId = (typeof catalogueSuites)[number]["id"];

export const catalogue: CatalogueProduct[] = [
  /* ---- Talk to customers ---- */
  {
    id: "conversations",
    label: "Conversations",
    icon: MessageCircle,
    groupId: "engage",
    jobId: "job-talk",
    suiteId: "suite-crm",
    blurb: "Unified inbox — SMS, email, chat and social in one place.",
    // Manual Actions is a queue inside the inbox, not a place (Mapping row 8).
  },
  {
    id: "contacts",
    label: "Contacts",
    icon: Users,
    groupId: "engage",
    jobId: "job-talk",
    suiteId: "suite-crm",
    blurb: "People and smart lists.",
    // Bulk Actions → in-page control; Custom Fields → Settings (Mapping 3–4).
  },
  {
    id: "companies",
    label: "Companies",
    icon: Building2,
    groupId: "engage",
    jobId: "job-talk",
    suiteId: "suite-crm",
    blurb: "The businesses your contacts belong to.",
    // Varun (Jul 31): a parent-level object, beside Contacts — not a tab.
  },
  {
    id: "tasks",
    label: "Tasks & projects",
    icon: ListTodo,
    groupId: "engage",
    jobId: "job-talk",
    suiteId: "suite-crm",
    blurb: "Work to do — yours and the team's.",
    // Outgrown its Contacts tab; own destination (new release incoming).
  },
  {
    id: "calendars",
    label: "Calendars",
    icon: Calendar,
    groupId: "engage",
    jobId: "job-talk",
    suiteId: "suite-sales",
    blurb: "Scheduling, availability and appointments.",
    // Calendar vs list = a view toggle inside; settings live in Settings.
  },
  {
    id: "meetings",
    label: "Meetings",
    icon: Video,
    groupId: "engage",
    jobId: "job-talk",
    suiteId: "suite-crm",
    blurb: "Online meetings and collaboration.",
  },
  {
    id: "mobile-app",
    label: "Mobile App",
    icon: Smartphone,
    groupId: "engage",
    jobId: "job-talk",
    suiteId: "suite-crm",
    blurb: "Take the workspace with you on iOS and Android.",
  },

  /* ---- Get customers ---- */
  {
    id: "social-planner",
    label: "Social Planner",
    icon: Share2,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-marketing",
    blurb: "Plan and post across every social channel.",
    // Pulled out of Marketing's tab pile — a distinct daily job (Mapping 28).
  },
  {
    id: "email-campaigns",
    label: "Email Campaigns",
    icon: Mail,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-marketing",
    blurb: "Broadcasts, sequences and deliverability.",
  },
  {
    id: "sites",
    label: "Sites & funnels",
    icon: LayoutTemplate,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-content",
    blurb: "Landing pages, funnels and forms.",
    children: [
      { id: "sites-funnels", label: "Funnels" },
      { id: "sites-websites", label: "Websites" },
      { id: "sites-blogs", label: "Blogs" },
      { id: "sites-forms", label: "Forms" },
      { id: "sites-surveys", label: "Surveys" },
      { id: "sites-wordpress", label: "WordPress" },
    ],
    // Stores moved to Get paid; Analytics → Reporting; Chat Widget → Settings;
    // QR Codes → All Products (Mapping 40–51).
  },
  {
    id: "events",
    label: "Events",
    icon: Ticket,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-marketing",
    blurb: "Ticketing, registration and check-in.",
  },
  {
    id: "webinars",
    label: "Webinars",
    icon: Presentation,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-marketing",
    blurb: "Host, register and replay webinars.",
    // Its own product beside Events, not inside it (Aug 13 correction).
  },
  {
    id: "reputation",
    label: "Reputation",
    icon: Star,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-marketing",
    blurb: "Reviews, ratings and business listings.",
    children: [
      { id: "reputation-requests", label: "Requests" },
      { id: "reputation-reviews", label: "Reviews" },
      { id: "reputation-testimonials", label: "Video testimonials" },
      { id: "reputation-widgets", label: "Widgets" },
      { id: "reputation-gbp", label: "GBP optimization" },
    ],
  },
  {
    id: "affiliate-manager",
    label: "Affiliate Manager",
    icon: Handshake,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-marketing",
    blurb: "Campaigns, partners and payouts.",
    children: [
      { id: "affiliate-campaigns", label: "Campaigns" },
      { id: "affiliate-partners", label: "Affiliates" },
      { id: "affiliate-payouts", label: "Payouts" },
      { id: "affiliate-media", label: "Media" },
    ],
    // Six sub-pages were hiding in a Marketing tab dropdown — a whole product,
    // now a destination with its sub-nav intact (Mapping 33).
  },
  {
    id: "ad-manager",
    label: "Ad Manager",
    icon: BadgeDollarSign,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-marketing",
    blurb: "Google, Meta and LinkedIn ads in one place.",
  },
  {
    id: "prospecting",
    label: "Prospecting",
    icon: Radar,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-sales",
    blurb: "Score and pitch the accounts you want.",
    // Its Settings/Analytics tabs map to Settings and Reporting.
  },
  {
    id: "email-templates",
    label: "Templates",
    icon: FileText,
    groupId: "market",
    jobId: "job-attract",
    suiteId: "suite-content",
    blurb: "Snippets, email, invoice and document templates — one home.",
    children: [
      { id: "templates-snippets", label: "Snippets" },
      { id: "templates-email", label: "Email templates" },
      { id: "templates-invoice", label: "Invoice templates" },
      { id: "templates-document", label: "Document templates" },
    ],
    // The One Templates home (Duplicates sheet): Snippets shipped twice, and
    // four products each grew their own template store.
  },

  /* ---- Get paid ---- */
  {
    id: "opportunities",
    label: "Opportunities",
    icon: Target,
    groupId: "convert",
    jobId: "job-paid",
    suiteId: "suite-sales",
    blurb: "Pipelines, stages and deal value.",
    // Forecast → Reporting; Pipelines config → Settings; Bulk Actions →
    // in-page (the live app grew these four tabs after the Aug 4 crawl).
  },
  {
    id: "invoices",
    label: "Invoices & estimates",
    icon: Receipt,
    groupId: "convert",
    jobId: "job-paid",
    suiteId: "suite-revenue",
    blurb: "Bill customers and chase what is owed.",
    children: [
      { id: "invoices-all", label: "All invoices" },
      { id: "invoices-recurring", label: "Recurring invoices" },
      { id: "invoices-estimates", label: "Estimates" },
      { id: "invoices-accounting", label: "Accounting sync" },
    ],
  },
  {
    id: "documents",
    label: "Documents & contracts",
    icon: FileSignature,
    groupId: "convert",
    jobId: "job-paid",
    suiteId: "suite-sales",
    blurb: "Proposals and contracts, signed online.",
    // L1 vs L2-under-Invoices is an open tree test (Mapping 18).
  },
  {
    id: "payments",
    label: "Payments",
    icon: CreditCard,
    groupId: "convert",
    jobId: "job-paid",
    suiteId: "suite-revenue",
    blurb: "Orders, transactions and payment links.",
    children: [
      { id: "payments-orders", label: "Orders" },
      { id: "payments-abandoned", label: "Abandoned checkouts" },
      { id: "payments-transactions", label: "Transactions" },
      { id: "payments-links", label: "Payment links" },
    ],
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: Repeat,
    groupId: "convert",
    jobId: "job-paid",
    suiteId: "suite-revenue",
    blurb: "Recurring plans, trials and dunning.",
  },
  {
    id: "products",
    label: "Products",
    icon: Package,
    groupId: "convert",
    jobId: "job-paid",
    suiteId: "suite-revenue",
    blurb: "Your catalogue, pricing and inventory.",
    children: [
      { id: "products-collections", label: "Collections" },
      { id: "products-inventory", label: "Inventory" },
      { id: "products-reviews", label: "Reviews" },
      { id: "products-coupons", label: "Coupons" },
      { id: "products-gift-cards", label: "Gift cards" },
    ],
  },
  {
    id: "stores",
    label: "Stores",
    icon: ShoppingCart,
    groupId: "market",
    jobId: "job-paid",
    suiteId: "suite-revenue",
    blurb: "Sell online with a hosted storefront.",
    // Out of the Sites tab pile — selling is a money job (Mapping 42, T4).
  },
  {
    id: "memberships",
    label: "Memberships",
    icon: Globe,
    groupId: "market",
    jobId: "job-paid",
    suiteId: "suite-content",
    blurb: "Courses, communities and gated content.",
    children: [
      { id: "memberships-courses", label: "Courses" },
      { id: "memberships-communities", label: "Communities" },
      { id: "memberships-credentials", label: "Credentials" },
      { id: "memberships-client", label: "Client portal" },
    ],
    // Client portal's ONE home — it shipped identically under Sites too
    // (Duplicates sheet); the name users know stays. Live app also grew
    // Events (Beta).
  },

  /* ---- Run on autopilot ---- */
  {
    id: "automation",
    label: "Automation",
    icon: Workflow,
    groupId: "automate",
    jobId: "job-autopilot",
    suiteId: "suite-automation",
    blurb: "Workflows, triggers and handoffs.",
    children: [
      { id: "automation-workflows", label: "Workflows" },
      { id: "automation-overview", label: "Overview", badge: { label: "Beta", tone: "beta" } },
      { id: "automation-trigger-links", label: "Trigger links" },
    ],
    // Trigger links homed here from Conversations AND Marketing (workflow
    // assets); legacy Campaign/Triggers are sunset-review, not rows.
  },
  {
    id: "ai-agents-product",
    label: "AI Agents",
    icon: Bot,
    groupId: "automate",
    jobId: "job-autopilot",
    suiteId: "suite-agents",
    blurb: "Agents that reply, qualify and book for you.",
    children: [
      { id: "ai-voice", label: "Voice AI" },
      { id: "ai-conversation", label: "Conversation AI" },
      { id: "ai-knowledge", label: "Knowledge base" },
      { id: "ai-logs", label: "Agent logs" },
    ],
    // Agent Templates → All Products/marketplace; Content AI → Templates/
    // builders; the Getting Started upsell tab is not navigation.
  },
  {
    id: "ai-studio",
    label: "AI Studio",
    icon: Sparkles,
    groupId: "automate",
    jobId: "job-autopilot",
    suiteId: "suite-agents",
    blurb: "Build and tune your own agents.",
    // The strategic bet — named, time-boxed T6 exception (Mapping 63).
  },
  {
    id: "agent-library",
    label: "Agent library",
    icon: Boxes,
    groupId: "automate",
    jobId: "job-autopilot",
    suiteId: "suite-agents",
    blurb: "Prebuilt agents you can clone and tune.",
  },

  /* ---- See how it's going ---- */
  {
    id: "reporting",
    label: "Reporting",
    icon: ChartLine,
    groupId: "analyze",
    jobId: "job-measure",
    suiteId: "suite-reporting",
    blurb: "Every product's numbers, in one place.",
    children: [
      { id: "reporting-attribution", label: "Attribution" },
      { id: "reporting-ads", label: "Ads" },
      { id: "reporting-calls", label: "Calls" },
      { id: "reporting-appointments", label: "Appointments" },
      { id: "reporting-conversations", label: "Conversations" },
      { id: "reporting-sites", label: "Sites & funnels" },
      { id: "reporting-email", label: "Email" },
      { id: "reporting-forecast", label: "Sales forecast" },
      { id: "reporting-agents", label: "AI agents" },
    ],
    // One reporting home ends the fragmentation: the audit counted ELEVEN
    // analytics surfaces scattered across products.
  },
  {
    id: "dashboards",
    label: "Dashboards",
    icon: Gauge,
    groupId: "analyze",
    jobId: "job-measure",
    suiteId: "suite-reporting",
    blurb: "Live widgets across every product.",
  },
];

const BY_ID = new Map(catalogue.map((p) => [p.id, p]));

/** Child id → its parent product and the child itself, for navigation. */
const CHILD_INDEX = new Map<
  string,
  { product: CatalogueProduct; child: CatalogueChild }
>();
for (const product of catalogue) {
  for (const child of product.children ?? []) {
    CHILD_INDEX.set(child.id, { product, child });
  }
}

export function productById(id: string): CatalogueProduct | undefined {
  return BY_ID.get(id);
}

export function childById(
  id: string,
): { product: CatalogueProduct; child: CatalogueChild } | undefined {
  return CHILD_INDEX.get(id);
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
