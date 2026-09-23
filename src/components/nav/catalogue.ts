import {
  ArrowLeftRight,
  Award,
  BadgeDollarSign,
  Banknote,
  BookOpen,
  Bot,
  Boxes,
  Building2,
  Calendar,
  CalendarCheck,
  ChartLine,
  ClipboardList,
  CreditCard,
  DoorOpen,
  FileSignature,
  FileText,
  Filter,
  Gauge,
  Gift,
  Globe,
  GraduationCap,
  Handshake,
  Image,
  Landmark,
  LayoutDashboard,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  ListChecks,
  ListTodo,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  MessagesSquare,
  Mic,
  Newspaper,
  Package,
  PanelsTopLeft,
  Phone,
  Presentation,
  Radar,
  Receipt,
  RefreshCw,
  Repeat,
  Route,
  Scissors,
  ScrollText,
  Send,
  Share2,
  ShoppingBag,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Ticket,
  TrendingUp,
  Users,
  Video,
  Workflow,
} from "lucide-react";

import type {
  CatalogueChild,
  CatalogueEntry,
  CatalogueGroup,
  ChildHit,
} from "./catalogue-types";
import { proposedCatalogue } from "./proposed-ia";
// The shipped tree already agreed with these pages' headings; it reads the
// shared names so it cannot quietly stop agreeing. See screen-names.ts.
import { SCREEN_NAMES } from "./screen-names";

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

export type {
  CatalogueChild,
  CatalogueEntry,
  CatalogueGroup,
  ChildHit,
} from "./catalogue-types";

export interface CatalogueProduct extends CatalogueEntry {
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
  /*
   * AI leads, and it is called AI.
   *
   * It was "Agents" in sixth place while the proposed tree's first bucket was
   * "AI" — so the same products had two names and two positions depending on
   * which tree an account happened to be on, and an agency switching between
   * two sub-accounts saw AI at the top of one nav and nowhere obvious in the
   * other. The two trees disagree about plenty on purpose; this was not one of
   * the arguments, it was drift.
   *
   * First rather than sixth because that is the claim the product is making.
   * The id stays `suite-agents`: it is what every product's `suiteId` and the
   * SaaS tier map are keyed by, and renaming a key to match a label is how a
   * tier silently stops granting anything.
   */
  { id: "suite-agents", defaultLabel: "AI", icon: Sparkles },
  { id: "suite-crm", defaultLabel: "CRM", icon: Users },
  { id: "suite-marketing", defaultLabel: "Marketing", icon: Megaphone },
  { id: "suite-content", defaultLabel: "Content", icon: LayoutTemplate },
  { id: "suite-sales", defaultLabel: "Sales", icon: Handshake },
  { id: "suite-revenue", defaultLabel: "Revenue", icon: CreditCard },
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
    blurb: "Take the workspace with you on Android & iOS.",
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
      { id: "sites-funnels", label: SCREEN_NAMES.funnels, icon: Filter },
      { id: "sites-websites", label: "Websites", icon: Globe },
      { id: "sites-blogs", label: "Blogs", icon: Newspaper },
      { id: "sites-forms", label: "Forms", icon: ClipboardList },
      { id: "sites-surveys", label: "Surveys", icon: ListChecks },
      { id: "sites-wordpress", label: "WordPress", icon: PanelsTopLeft },
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
      { id: "reputation-requests", label: "Requests", icon: Send },
      { id: "reputation-reviews", label: "Reviews", icon: Star },
      { id: "reputation-testimonials", label: "Video testimonials", icon: Video },
      { id: "reputation-widgets", label: "Widgets", icon: LayoutGrid },
      { id: "reputation-gbp", label: "GBP optimization", icon: MapPin },
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
      { id: "affiliate-campaigns", label: "Campaigns", icon: Megaphone },
      { id: "affiliate-partners", label: "Affiliates", icon: Users },
      { id: "affiliate-payouts", label: "Payouts", icon: Banknote },
      { id: "affiliate-media", label: "Media", icon: Image },
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
      { id: "templates-snippets", label: "Snippets", icon: Scissors },
      { id: "templates-email", label: "Email templates", icon: Mail },
      { id: "templates-invoice", label: "Invoice templates", icon: Receipt },
      { id: "templates-document", label: "Document templates", icon: FileText },
    ],
    // The One Templates home (Duplicates sheet): Snippets shipped twice, and
    // four products each grew their own template store.
  },

  /* ---- Get paid ---- */
  {
    id: "opportunities",
    label: SCREEN_NAMES.opportunities,
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
      { id: "invoices-all", label: "All invoices", icon: Receipt },
      /*
       * Layouts (Sep 23), second in the list and badged New.
       *
       * Second rather than last, which is where a newly shipped feature
       * usually lands: the order of this menu is the order of the WORK —
       * you design how an invoice looks, then you send invoices, then you
       * reconcile them — and a layout is the thing that exists before any
       * invoice does. Filing it after Accounting sync would have put the
       * first step of the job at the bottom of the list.
       */
      {
        id: "invoices-layouts",
        label: "Layouts",
        icon: LayoutTemplate,
        badge: { label: "New", tone: "new" },
      },
      { id: "invoices-recurring", label: "Recurring invoices", icon: RefreshCw },
      { id: "invoices-estimates", label: "Estimates", icon: FileText },
      { id: "invoices-accounting", label: "Accounting sync", icon: Landmark },
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
      { id: "payments-orders", label: "Orders", icon: ShoppingBag },
      { id: "payments-abandoned", label: "Abandoned checkouts", icon: ShoppingCart },
      { id: "payments-transactions", label: "Transactions", icon: ArrowLeftRight },
      { id: "payments-links", label: "Payment links", icon: Link2 },
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
      { id: "products-collections", label: "Collections", icon: Boxes },
      { id: "products-inventory", label: "Inventory", icon: Package },
      { id: "products-reviews", label: "Reviews", icon: Star },
      { id: "products-coupons", label: "Coupons", icon: Ticket },
      { id: "products-gift-cards", label: "Gift cards", icon: Gift },
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
      { id: "memberships-courses", label: "Courses", icon: GraduationCap },
      { id: "memberships-communities", label: "Communities", icon: Users },
      { id: "memberships-credentials", label: "Credentials", icon: Award },
      { id: "memberships-client", label: "Client portal", icon: DoorOpen },
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
      { id: "automation-workflows", label: SCREEN_NAMES.workflows, icon: Workflow },
      { id: "automation-overview", label: "Overview", icon: LayoutDashboard, badge: { label: "Beta", tone: "beta" } },
      { id: "automation-trigger-links", label: "Trigger links", icon: Link2 },
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
      { id: "ai-voice", label: SCREEN_NAMES.voiceAi, icon: Mic },
      { id: "ai-conversation", label: "Conversation AI", icon: MessagesSquare },
      { id: "ai-knowledge", label: "Knowledge base", icon: BookOpen },
      { id: "ai-logs", label: "Agent logs", icon: ScrollText },
    ],
    // Agent Templates → All Products/marketplace; Content AI → Templates/
    // builders; the Getting Started upsell tab is not navigation.
  },
  {
    id: "ai-studio",
    label: SCREEN_NAMES.aiStudio,
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
      { id: "reporting-attribution", label: "Attribution", icon: Route },
      { id: "reporting-ads", label: "Ads", icon: Megaphone },
      { id: "reporting-calls", label: "Calls", icon: Phone },
      { id: "reporting-appointments", label: "Appointments", icon: CalendarCheck },
      { id: "reporting-conversations", label: "Conversations", icon: MessageCircle },
      { id: "reporting-sites", label: "Sites & funnels", icon: Globe },
      { id: "reporting-email", label: "Email", icon: Mail },
      { id: "reporting-forecast", label: "Sales forecast", icon: TrendingUp },
      { id: "reporting-agents", label: "AI agents", icon: Bot },
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

/**
 * Every product either IA can file, for lookup only.
 *
 * Deliberately not a merge of the trees: `catalogue` stays exactly 31 entries so
 * `DEFAULT_LAYOUT.enabledProducts`, ACME's seed and the three shipped-tree
 * branches of `resolveGroups` keep meaning what they mean today. Only the index
 * spans both, which is what lets `productById`/`childById` — and therefore the
 * pin buttons, the crumbs and every product page — work for both IAs without a
 * single call site learning that a second tree exists.
 */
/**
 * Products that shipped after an agency would have saved its templates.
 *
 * A template is a stored arrangement, and a catalogue that grows underneath it
 * asks a question nobody wrote down: where does a product that did not exist
 * when this was saved appear? The answer the model takes is "wherever the
 * default puts it" — the template never claimed it, so it keeps the placement
 * the account already had, which is exactly what `patchForArrangement` does
 * with any unclaimed product.
 *
 * What is left is the telling. These two ids are the standing example of an
 * arrival, so a template can say "2 rows arrived since you saved this" and the
 * agency can go and file them. See `templateNewProductMark`.
 *
 * Data rather than a date comparison, because the prototype's catalogue is a
 * constant: nothing is ever really added at runtime, and a launch list is the
 * honest way to stage the case rather than faking a clock.
 */
export const LAUNCHED_SINCE: readonly string[] = ["ai-studio", "agent-library"];

export const allProducts: readonly CatalogueEntry[] = [
  ...catalogue,
  ...proposedCatalogue,
];

const BY_ID = new Map<string, CatalogueEntry>(
  allProducts.map((p) => [p.id, p]),
);

/** Child id → the product that owns it, plus the ancestors above it. */
const CHILD_INDEX = new Map<string, ChildHit>();
function indexChildren(
  product: CatalogueEntry,
  kids: readonly CatalogueChild[],
  path: readonly CatalogueChild[],
) {
  for (const child of kids) {
    CHILD_INDEX.set(child.id, { product, child, path });
    if (child.children?.length) {
      indexChildren(product, child.children, [...path, child]);
    }
  }
}
for (const product of allProducts) {
  indexChildren(product, product.children ?? [], []);
}

if (process.env.NODE_ENV !== "production") {
  // Both IAs share one index, so a duplicate id would silently shadow a product
  // in the launcher, the pins and the breadcrumbs. Prefixes (`suite-`, `ia-`)
  // are the convention; this is the proof.
  const total = catalogue.length + proposedCatalogue.length;
  if (BY_ID.size !== total) {
    throw new Error(
      `Duplicate product id across the two catalogues: ${total - BY_ID.size} collision(s)`,
    );
  }
}

export function productById(id: string): CatalogueEntry | undefined {
  return BY_ID.get(id);
}

export function childById(id: string): ChildHit | undefined {
  return CHILD_INDEX.get(id);
}

export function productsInGroup(groupId: string): CatalogueProduct[] {
  return catalogue.filter((p) => p.groupId === groupId);
}

export function productsInJob(jobId: string): CatalogueProduct[] {
  return catalogue.filter((p) => p.jobId === jobId);
}

/** What a fresh account starts pinned with — the five from the design. */
/**
 * What a fresh account starts pinned with.
 *
 * Three, not five (Sep 10). Five was the dock's width and it was also
 * PIN_LIMIT, so a new account opened at the cap: every pin button in the
 * product, on every surface, was disabled from the first paint — which reads
 * as "pinning is broken here" rather than as "you are full". Three leaves room
 * to try the gesture the nav is largely about.
 */
export const DEFAULT_PINNED = [
  "conversations",
  "contacts",
  "opportunities",
];
