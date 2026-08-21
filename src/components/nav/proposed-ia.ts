import {
  AppWindow,
  Award,
  BadgeDollarSign,
  Banknote,
  Blocks,
  BookOpen,
  Bot,
  Boxes,
  Braces,
  Brain,
  BriefcaseBusiness,
  Building2,
  Calendar,
  Car,
  ChartColumn,
  ChartLine,
  ChartPie,
  CircleQuestionMark,
  CircleUser,
  ClipboardList,
  Cog,
  Compass,
  Contact,
  CornerUpRight,
  CreditCard,
  Database,
  Factory,
  FileChartColumn,
  FileClock,
  Files,
  FileSignature,
  FileText,
  FlaskConical,
  FolderOpen,
  Gauge,
  Gift,
  GitBranch,
  Globe,
  GraduationCap,
  Handshake,
  Headset,
  HeartHandshake,
  House,
  IdCard,
  KeyRound,
  LayoutTemplate,
  Library,
  Link,
  Link2,
  ListChecks,
  ListTodo,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  MessagesSquare,
  Mic,
  MonitorSmartphone,
  Package,
  Palette,
  PanelsTopLeft,
  Plug,
  Presentation,
  Puzzle,
  QrCode,
  Quote,
  Radar,
  RadioTower,
  Receipt,
  Repeat,
  Rocket,
  Rss,
  ScrollText,
  SearchCheck,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Target,
  TextCursorInput,
  Ticket,
  TicketPercent,
  Timer,
  Upload,
  Users,
  UsersRound,
  Wallet,
  Wand,
  Workflow,
  Zap,
} from "lucide-react";

import type { CatalogueEntry, CatalogueGroup } from "./catalogue-types";

/**
 * The proposed information architecture — 12 buckets, one product set.
 *
 * Transcribed from the Aug 19 proposal sheet, whose three meaningful columns are
 * L1 (the bucket), L2 (the product) and "Local Nav - On Page" (the L3 tabs).
 * `X -> Y` in that sheet means *rename X to Y*, and those renames are applied
 * here rather than recorded — the sheet's `Smart List -> List` is simply "List".
 *
 * Why this is a second product set rather than a fourth key on the shipped
 * catalogue: the four existing trees are lossless re-projections of one
 * 31-product catalogue, because every product carries a groupId, a jobId and a
 * suiteId at once. This proposal *promotes* roughly thirty of today's children
 * to products (Orders, Transactions, Payment Links, Courses, Communities, Forms,
 * Surveys …) and adds products that do not exist at all (Ticketing, Object
 * Settings, Domains, URL Redirect). A different set of places cannot be a view
 * of the same rows.
 *
 * Two shapes to know:
 *
 *  - **Membership lives on the bucket**, in `productIds`, not on the product as
 *    `suiteId` does. The source is a nested list with an authored order at both
 *    levels, and one array keeps the order from drifting. `resolveGroups` reads
 *    it the same way it already reads `CustomGroup.productIds`.
 *  - **One bucket owns no products.** Mobile is a destination — the row *is* the
 *    page. It is marked `destination` and filed as a loose product rather than an
 *    empty bucket, so `populated()` never has an empty group to drop. Launchpad
 *    is not a bucket at all: it is the getting-started card above Recent.
 *
 * The settings-placement rule this IA encodes is worth stating, because it drives
 * dozens of rows: a product owns its own settings. The global Settings bucket
 * keeps only what is genuinely account-wide. That is why `Settings` appears as an
 * L3 in nine products — intentional repetition of a pattern, each one a distinct
 * destination, not the duplication the Aug 13 audit flagged.
 */

export interface ProposedBucket extends CatalogueGroup {
  /** Authored order, not derived — see the docblock. */
  productIds: string[];
  /**
   * Owns no products; renders as a chevron-less top-level row that opens a page.
   * Never becomes a group, so it is never dropped by `populated()`.
   */
  destination?: boolean;
}

/* ------------------------------------------------------------------ products */

/**
 * AI — the seven the Aug 19 review named, in that order, then the five it asked
 * to keep once we traced where they came from.
 *
 * All five ship in spm-ts today: Agent Templates, Industry Agents and AI Memory
 * are AI Agents tabs (navigation.ts:3673/3752/3819), AI Evaluations is its own L1
 * with an Ask AI Evaluations tab (:3878), and Ask AI is an L1 of its own (:108).
 * Knowledge Base is the same class of thing (:3647) so it sits with them.
 *
 * Two rows are not L2s. `Overview` was cut in review. `Eliza Service` — today a
 * Settings-sidebar row — is a configured support agent rather than a product, so
 * it hangs under Conversation AI.
 */
const AI: CatalogueEntry[] = [
  {
    id: "ia-ai-getting-started",
    label: "Getting Started",
    icon: Compass,
    blurb: "Pick an agent and switch it on.",
  },
  {
    id: "ia-ai-agent-studio",
    label: "Agent Studio",
    icon: Bot,
    blurb: "Build, tune and publish agents.",
  },
  {
    id: "ia-ai-studio",
    label: "AI Studio",
    icon: Wand,
    blurb: "Generate sites, copy and creative.",
  },
  {
    id: "ia-ai-voice",
    label: "Voice AI",
    icon: Mic,
    blurb: "Agents that answer and place calls.",
    tabs: true,
    children: [
      { id: "ia-ai-voice-dashboard", label: "Dashboard" },
      { id: "ia-ai-voice-agents", label: "Agents List" },
    ],
  },
  {
    id: "ia-ai-conversation",
    label: "Conversation AI",
    icon: MessagesSquare,
    blurb: "Agents that reply across the inbox.",
    tabs: true,
    children: [
      { id: "ia-ai-conversation-dashboard", label: "Dashboard" },
      { id: "ia-ai-conversation-agents", label: "Agents List" },
      // Today a Settings-sidebar row. A configured support agent, so it sits
      // with the agents rather than in the global Settings bucket.
      { id: "ia-ai-eliza", label: "Eliza Service" },
    ],
  },
  {
    id: "ia-ai-content",
    label: "Content AI",
    icon: FileText,
    blurb: "Drafting and rewriting inside the builders.",
    tabs: true,
    children: [
      { id: "ia-ai-content-text", label: "Text" },
      { id: "ia-ai-content-image", label: "Image" },
    ],
  },
  {
    // Homed once rather than repeated as a tab under all five agent products,
    // which is how the sheet drew it. The logs filter by agent.
    id: "ia-ai-logs",
    label: "Agent Logs",
    icon: ScrollText,
    blurb: "Every run, every handoff, every failure.",
    tabs: true,
    children: [
      { id: "ia-ai-logs-sessions", label: "Sessions" },
      { id: "ia-ai-logs-contacts", label: "Contacts" },
      { id: "ia-ai-logs-metrics", label: "Metrics" },
    ],
  },
  {
    id: "ia-ai-templates",
    label: "Agent Templates",
    icon: Files,
    blurb: "Prebuilt agents to start from.",
  },
  {
    id: "ia-ai-industry",
    label: "Industry Agents",
    icon: Factory,
    blurb: "Agents tuned to a vertical.",
  },
  {
    id: "ia-ai-knowledge",
    label: "Knowledge Base",
    icon: BookOpen,
    blurb: "What your agents are allowed to know.",
  },
  {
    id: "ia-ai-memory",
    label: "AI Memory",
    icon: Brain,
    blurb: "What agents remember between runs.",
  },
  {
    id: "ia-ai-evaluations",
    label: "AI Evaluations",
    icon: SearchCheck,
    blurb: "Score agent answers before customers see them.",
    tabs: true,
    children: [{ id: "ia-ai-evaluations-ask", label: "Ask AI Evaluations" }],
  },
  {
    id: "ia-ai-ask",
    label: "Ask AI",
    icon: MessageSquareText,
    blurb: "The assistant, its history and its templates.",
  },
];

const CRM: CatalogueEntry[] = [
  {
    id: "ia-crm-contacts",
    label: "Contacts",
    icon: Contact,
    blurb: "Every person you know, and how you know them.",
    children: [
      {
        id: "ia-crm-contacts-list",
        label: "List",
        tabs: true,
        // Saved lists, named the way operators name them rather than the way a
        // spec would. "All" first, because it is the one that always exists.
        children: [
          { id: "ia-crm-contacts-list-all", label: "All" },
          { id: "ia-crm-contacts-list-hot", label: "Hot leads" },
          { id: "ia-crm-contacts-list-stale", label: "No activity 30d" },
          { id: "ia-crm-contacts-list-service", label: "Winter service due" },
        ],
      },
      { id: "ia-crm-contacts-tags", label: "Tags" },
      { id: "ia-crm-contacts-scoring", label: "Engagement Score" },
    ],
    // Custom Fields is NOT here: it has one home, the L2 of the same name below.
    // Bulk Actions is absent too — the sheet moves it under the row's three-dots
    // menu, matching Companies. An action is not a place.
  },
  {
    id: "ia-crm-conversations",
    label: "Conversations",
    icon: MessageCircle,
    blurb: "Unified inbox — SMS, email, chat and social.",
    children: [
      { id: "ia-crm-conversations-inbox", label: "Inbox" },
      { id: "ia-crm-conversations-manual", label: "Manual Actions" },
      { id: "ia-crm-conversations-snippets", label: "Snippets" },
      { id: "ia-crm-conversations-links", label: "Trigger Links" },
      { id: "ia-crm-conversations-analytics", label: "Analytics" },
      { id: "ia-crm-conversations-settings", label: "Settings" },
    ],
  },
  {
    id: "ia-crm-opportunities",
    label: "Opportunities",
    icon: Target,
    blurb: "Deals moving through your pipelines.",
    children: [
      {
        id: "ia-crm-opportunities-list",
        label: "List",
        tabs: true,
        children: [
          { id: "ia-crm-opps-list-all", label: "All" },
          { id: "ia-crm-opps-list-mine", label: "My open deals" },
          { id: "ia-crm-opps-list-closing", label: "Closing this month" },
          { id: "ia-crm-opps-list-stalled", label: "Stalled 14d" },
        ],
      },
      {
        id: "ia-crm-opportunities-forecast",
        label: "Forecast",
        tabs: true,
        // Summary first, then the whole book, then a pipeline at a time — the
        // forecast is only readable once you have said which pipeline you mean.
        children: [
          { id: "ia-crm-opps-forecast-summary", label: "Summary" },
          { id: "ia-crm-opps-forecast-all", label: "All pipelines" },
          { id: "ia-crm-opps-forecast-installs", label: "New installs" },
          { id: "ia-crm-opps-forecast-service", label: "Service contracts" },
        ],
      },
      { id: "ia-crm-opportunities-pipeline", label: "Pipeline" },
      { id: "ia-crm-opportunities-settings", label: "Settings" },
    ],
  },
  {
    id: "ia-crm-companies",
    label: "Companies",
    icon: Building2,
    blurb: "The organisations behind your contacts.",
    tabs: true,
    // Saved views rather than individual companies: records in a nav do not
    // scale, and the growth rule this IA exists to enforce says so.
    children: [
      { id: "ia-crm-companies-all", label: "All" },
      { id: "ia-crm-companies-key", label: "Key accounts" },
      { id: "ia-crm-companies-suppliers", label: "Suppliers" },
      { id: "ia-crm-companies-subs", label: "Subcontractors" },
    ],
  },
  {
    /*
     * The generic row, kept because the sheet drew it: what a brand-new custom
     * object looks like before it is named.
     */
    id: "ia-crm-custom-object",
    label: "Custom Object",
    icon: Database,
    blurb: "Every record type this account has.",
    tabs: true,
    /*
     * The admin surface for object types, standard and custom together — which is
     * why the standard three appear here as well as owning their own L2 rows.
     * Those rows are where you work; this is where you change their shape.
     */
    children: [
      { id: "ia-crm-objects-standard", label: "Standard objects" },
      { id: "ia-crm-objects-custom", label: "Custom objects" },
    ],
  },
  /*
   * The three this tenant actually provisioned.
   *
   * Custom objects append to the nav forever — the Aug 13 crawl found six on one
   * live account, plus a "Plicies" typo shipping in production — so a demo with
   * a single generic row cannot show the growth problem the IA has to survive.
   * Each one is a native-looking L2 with its own list, never labelled "custom"
   * (Varun's directive).
   */
  {
    id: "ia-crm-policies",
    label: "Policies",
    icon: ShieldCheck,
    blurb: "Insurance policies, renewals and carriers.",
    tabs: true,
    children: [
      { id: "ia-crm-policies-all", label: "All" },
      { id: "ia-crm-policies-active", label: "Active" },
      { id: "ia-crm-policies-renewals", label: "Renewals due" },
    ],
  },
  {
    id: "ia-crm-vehicles",
    label: "Vehicles",
    icon: Car,
    blurb: "Make, model and service history.",
    tabs: true,
    children: [
      { id: "ia-crm-vehicles-all", label: "All" },
      { id: "ia-crm-vehicles-service", label: "In service" },
      { id: "ia-crm-vehicles-warranty", label: "Out of warranty" },
    ],
  },
  {
    id: "ia-crm-properties",
    label: "Properties",
    icon: House,
    blurb: "Sites, units and the people attached to them.",
    tabs: true,
    children: [
      { id: "ia-crm-properties-all", label: "All" },
      { id: "ia-crm-properties-occupied", label: "Occupied" },
      { id: "ia-crm-properties-vacant", label: "Vacant" },
    ],
  },
  {
    id: "ia-crm-tasks",
    label: "Tasks",
    icon: ListTodo,
    blurb: "What your team owes, and by when.",
    tabs: true,
    children: [
      { id: "ia-crm-tasks-all", label: "All" },
      { id: "ia-crm-tasks-today", label: "Do today" },
      { id: "ia-crm-tasks-upcoming", label: "Upcoming" },
    ],
  },
  {
    id: "ia-crm-calendars",
    label: "Calendars",
    icon: Calendar,
    blurb: "Booking, availability and appointments.",
    children: [
      // One place, two views — the toggle lives on the page, not in the nav.
      { id: "ia-crm-calendars-appointments", label: "Appointments" },
      {
        // L4. Today these six are a mini-product inside the Settings nav-swap
        // (Settings › Calendars › …). The product-owns-its-settings rule brings
        // them here, and they are the reason L4 exists rather than a hypothetical.
        id: "ia-crm-calendars-settings",
        label: "Settings",
        tabs: true,
        children: [
          { id: "ia-crm-calendars-meetings", label: "Meetings" },
          { id: "ia-crm-calendars-services", label: "Services" },
          { id: "ia-crm-calendars-rentals", label: "Rentals" },
          { id: "ia-crm-calendars-connections", label: "Connections" },
          { id: "ia-crm-calendars-preferences", label: "Preferences" },
          { id: "ia-crm-calendars-availability", label: "Availability" },
        ],
      },
    ],
  },
  {
    id: "ia-crm-custom-values",
    label: "Custom Values",
    icon: Braces,
    blurb: "Reusable merge fields across every product.",
  },
  {
    id: "ia-crm-custom-fields",
    label: "Custom Fields",
    icon: TextCursorInput,
    blurb: "The shape of your records.",
    tabs: true,
    // Fields belong to an object, so the object is how you find them. Car is a
    // custom object; the other three are standard.
    children: [
      { id: "ia-crm-fields-all", label: "All" },
      { id: "ia-crm-fields-contact", label: "Contact" },
      { id: "ia-crm-fields-opportunity", label: "Opportunity" },
      { id: "ia-crm-fields-business", label: "Business" },
      { id: "ia-crm-fields-car", label: "Car" },
    ],
  },
  {
    id: "ia-crm-ticketing",
    label: "Ticketing",
    icon: Headset,
    blurb: "Support requests with an owner and an SLA.",
  },
  {
    id: "ia-crm-media",
    label: "Media Storage",
    icon: FolderOpen,
    blurb: "Every asset the account has uploaded.",
  },
  {
    id: "ia-crm-object-settings",
    label: "Object Settings",
    icon: Boxes,
    blurb: "Records, relationships and permissions.",
  },
];

const AUTOMATION: CatalogueEntry[] = [
  {
    id: "ia-automation-workflows",
    label: "Workflows",
    icon: GitBranch,
    blurb: "Triggers, actions and handoffs.",
    children: [
      {
        // First, and a saved list like Contacts' and Opportunities' — a workflow
        // list is filtered the same way a contact list is.
        id: "ia-automation-list",
        label: "List",
        tabs: true,
        children: [
          { id: "ia-automation-list-all", label: "All" },
          { id: "ia-automation-list-review", label: "Needs review" },
          { id: "ia-automation-list-drafts", label: "Drafts" },
          { id: "ia-automation-list-deleted", label: "Deleted" },
        ],
      },
      { id: "ia-automation-analytics", label: "Analytics" },
      { id: "ia-automation-settings", label: "Settings" },
    ],
  },
  /*
   * Campaigns and Triggers are two products, not one row.
   *
   * The sheet drew them as a single "Campaigns, Triggers" child marked "only
   * visible to older accounts", which collapsed two separate things into one and
   * then labelled the pair Legacy. They are separate Automation tabs in the app
   * today, so they are separate L2s here. No badge: whether either is on its way
   * out is a decision the nav should not be pre-announcing.
   */
  {
    id: "ia-automation-campaigns",
    label: "Campaigns",
    icon: Send,
    blurb: "The older sequence builder.",
  },
  {
    id: "ia-automation-triggers",
    label: "Triggers",
    icon: Zap,
    blurb: "The older single-step automations.",
  },
];

const MARKETING: CatalogueEntry[] = [
  {
    id: "ia-marketing-social",
    label: "Social Planner",
    icon: Share2,
    blurb: "Plan, queue and publish across networks.",
    tabs: true,
    // The tab bar the product ships today. Its 13 route-only children in
    // spm-ts (Post Edit, CSV Create …) are pages, not places.
    children: [
      { id: "ia-marketing-social-planner", label: "Planner" },
      { id: "ia-marketing-social-content", label: "Content" },
      { id: "ia-marketing-social-comments", label: "Comments" },
      { id: "ia-marketing-social-stats", label: "Statistics" },
      { id: "ia-marketing-social-listening", label: "Social Listening" },
      { id: "ia-marketing-social-settings", label: "Settings" },
    ],
  },
  {
    id: "ia-marketing-email",
    label: "Email Builder",
    icon: Mail,
    blurb: "Broadcasts, sequences and templates.",
    tabs: true,
    children: [
      { id: "ia-marketing-email-stats", label: "Statistics" },
      { id: "ia-marketing-email-campaigns", label: "Campaigns" },
      { id: "ia-marketing-email-templates", label: "Templates" },
      { id: "ia-marketing-email-settings", label: "Settings" },
    ],
  },
  {
    id: "ia-marketing-ads",
    label: "Ad Manager",
    icon: BadgeDollarSign,
    blurb: "Launch and watch paid campaigns.",
  },
  {
    // Shipped today as a Marketing tab; not on the sheet. Kept.
    id: "ia-marketing-messages",
    label: "Marketing Messages",
    icon: Rss,
    blurb: "Broadcast over WhatsApp and Messenger.",
  },
  {
    id: "ia-marketing-affiliate",
    label: "Affiliate Manager",
    icon: Handshake,
    blurb: "Partners, commissions and payouts.",
    children: [
      { id: "ia-marketing-affiliate-dashboard", label: "Dashboard" },
      { id: "ia-marketing-affiliate-campaign", label: "Campaign" },
      { id: "ia-marketing-affiliate-affiliates", label: "Affiliate" },
      { id: "ia-marketing-affiliate-payout", label: "Payout" },
      { id: "ia-marketing-affiliate-media", label: "Media" },
      { id: "ia-marketing-affiliate-settings", label: "Settings" },
    ],
  },
  {
    id: "ia-marketing-prospecting",
    label: "Prospecting",
    icon: Radar,
    blurb: "Find businesses that need what you sell.",
    tabs: true,
    children: [
      { id: "ia-marketing-prospecting-accounts", label: "All accounts" },
      { id: "ia-marketing-prospecting-ai", label: "Prospect AI" },
      { id: "ia-marketing-prospecting-widgets", label: "Widgets" },
      { id: "ia-marketing-prospecting-reports", label: "Report builder" },
      { id: "ia-marketing-prospecting-analytics", label: "Analytics" },
      { id: "ia-marketing-prospecting-settings", label: "Settings" },
    ],
  },
  {
    id: "ia-marketing-countdown",
    label: "Countdown Timer",
    icon: Timer,
    blurb: "Urgency you can drop into a page or an email.",
  },
  {
    // Shipped twice today — a Conversations tab and a Marketing tab. Homed once.
    id: "ia-marketing-snippets",
    label: "Snippets",
    icon: Quote,
    blurb: "Reusable message blocks.",
    tabs: true,
    children: [
      { id: "ia-marketing-snippets-all", label: "All snippets" },
      { id: "ia-marketing-snippets-folders", label: "Folders" },
    ],
  },
  {
    // Also shipped twice today (Conversations and Marketing). Homed once.
    id: "ia-marketing-trigger-links",
    label: "Trigger Links",
    icon: Link2,
    blurb: "Trackable links that fire automations.",
    tabs: true,
    children: [
      { id: "ia-marketing-trigger-links-list", label: "Links" },
      { id: "ia-marketing-trigger-links-analyze", label: "Analyze" },
    ],
  },
  {
    id: "ia-marketing-brand-boards",
    label: "Brand Boards",
    icon: Palette,
    blurb: "Fonts, colours and logos in one place.",
    tabs: true,
    children: [
      { id: "ia-marketing-brand-kit", label: "Design kit" },
      { id: "ia-marketing-brand-voice", label: "Brand voice" },
    ],
  },
  {
    /*
     * Marketing, not Settings (Abhishek, Aug 19).
     *
     * Consent and opt-outs read as account-wide plumbing, which is the argument
     * for Settings — but the people who work in it are the ones sending the
     * campaigns, and a preference is the reason a send is suppressed. It belongs
     * next to the sending tools.
     */
    id: "ia-marketing-preferences",
    label: "Preference Management Hub",
    icon: SlidersHorizontal,
    blurb: "Consent, opt-outs and quiet hours.",
  },
  {
    id: "ia-marketing-reputation",
    label: "Reputation",
    icon: Star,
    blurb: "Reviews, listings and testimonials.",
    children: [
      { id: "ia-marketing-reputation-overview", label: "Overview" },
      { id: "ia-marketing-reputation-requests", label: "Requests" },
      { id: "ia-marketing-reputation-reviews", label: "Reviews" },
      { id: "ia-marketing-reputation-video", label: "Video Testimonials" },
      { id: "ia-marketing-reputation-widgets", label: "Widgets" },
      { id: "ia-marketing-reputation-listings", label: "Listings" },
      { id: "ia-marketing-reputation-gbp", label: "GBP Optimisation" },
      { id: "ia-marketing-reputation-settings", label: "Settings" },
    ],
  },
];

const CONTENT: CatalogueEntry[] = [
  {
    id: "ia-content-sites",
    label: "Sites",
    icon: AppWindow,
    blurb: "Funnels, websites and blogs.",
    children: [
      { id: "ia-content-sites-funnel", label: "Funnel" },
      { id: "ia-content-sites-website", label: "Website" },
      { id: "ia-content-sites-blogs", label: "Blogs" },
      { id: "ia-content-sites-seo", label: "SEO" },
      { id: "ia-content-sites-tracking", label: "External Tracking" },
    ],
  },
  {
    /*
     * The one analytics home for everything Content builds.
     *
     * Shipped today as a single Sites tab, which is why the Aug 13 audit counted
     * eleven analytics surfaces across the app: Forms and Surveys each hide their
     * own one level down, Blogs has another. One product, one child per surface,
     * so "how did the funnel do" and "how did the form do" are the same journey.
     */
    id: "ia-content-analytics",
    label: "Analytics",
    icon: ChartColumn,
    blurb: "How every page, form and funnel performed.",
    tabs: true,
    children: [
      { id: "ia-content-analytics-funnels", label: "Funnels" },
      { id: "ia-content-analytics-websites", label: "Websites" },
      { id: "ia-content-analytics-qr", label: "QR codes" },
      { id: "ia-content-analytics-webinars", label: "Webinars" },
      { id: "ia-content-analytics-blogs", label: "Blogs" },
      { id: "ia-content-analytics-forms", label: "Forms" },
      { id: "ia-content-analytics-surveys", label: "Surveys" },
    ],
  },
  {
    // Shipped as a Sites tab today; absent from the sheet. Stores sells from the
    // Commerce catalogue but the storefront itself is a built page, so it stays
    // with the builders rather than moving to Commerce.
    id: "ia-content-stores",
    label: "Stores",
    icon: Store,
    blurb: "Storefronts built on your product catalogue.",
  },
  {
    // Shipped as a Sites tab today; absent from the sheet. A whole hosting
    // product — dropping it silently would strand real customers.
    id: "ia-content-wordpress",
    label: "WordPress",
    icon: PanelsTopLeft,
    blurb: "Managed hosting for WordPress sites.",
  },
  {
    id: "ia-content-forms",
    label: "Forms",
    icon: ClipboardList,
    blurb: "Capture what you need to know.",
  },
  {
    id: "ia-content-surveys",
    label: "Surveys",
    icon: ListChecks,
    blurb: "Longer questions, branching logic.",
  },
  {
    id: "ia-content-quizzes",
    label: "Quizzes",
    icon: CircleQuestionMark,
    blurb: "Score answers and route on the result.",
  },
  {
    id: "ia-content-chat",
    label: "Chat Widget",
    icon: MessageSquare,
    blurb: "The bubble on your site.",
  },
  {
    id: "ia-content-qr",
    label: "QR Codes",
    icon: QrCode,
    blurb: "Print-to-web with tracking attached.",
  },
  {
    id: "ia-content-domains",
    label: "Domains",
    icon: Globe,
    blurb: "Connect and verify the names you own.",
  },
  {
    id: "ia-content-redirects",
    label: "URL Redirect",
    icon: CornerUpRight,
    blurb: "Send an old link somewhere new.",
  },
  {
    id: "ia-content-webinars",
    label: "Webinars",
    icon: Presentation,
    blurb: "Live and evergreen sessions.",
  },
];

const REPORTING: CatalogueEntry[] = [
  {
    id: "ia-reporting-dashboard",
    label: "Dashboard",
    icon: Gauge,
    blurb: "Live widgets across every product.",
  },
  {
    id: "ia-reporting-custom",
    label: "Custom reports",
    icon: ChartPie,
    blurb: "Your own questions, saved.",
  },
  {
    id: "ia-reporting-reports",
    label: "Reports",
    icon: FileChartColumn,
    blurb: "The shipped set, one per channel.",
    children: [
      { id: "ia-reporting-google", label: "Google Ads" },
      { id: "ia-reporting-meta", label: "Meta Ads" },
      { id: "ia-reporting-attribution", label: "Attribution" },
      { id: "ia-reporting-call", label: "Call" },
      { id: "ia-reporting-agent", label: "Agent" },
      { id: "ia-reporting-appointment", label: "Appointment" },
      { id: "ia-reporting-audit", label: "Local Marketing Audit" },
    ],
  },
];

const COMMERCE: CatalogueEntry[] = [
  {
    id: "ia-commerce-invoices",
    label: "Invoices & Estimates",
    icon: Receipt,
    blurb: "Bill for work, one-off or recurring.",
    children: [
      { id: "ia-commerce-invoices-all", label: "All Invoices" },
      { id: "ia-commerce-invoices-recurring", label: "Recurring Invoices" },
      {
        id: "ia-commerce-invoices-templates",
        label: "Templates",
        tabs: true,
        children: [
          { id: "ia-commerce-invoices-templates-inv", label: "Invoices" },
          { id: "ia-commerce-invoices-templates-est", label: "Estimates" },
        ],
      },
      {
        // Status is the filter that matters on an estimate — the question is
        // always "what is still out there and what came back".
        id: "ia-commerce-invoices-estimates",
        label: "Estimates",
        tabs: true,
        children: [
          { id: "ia-commerce-est-all", label: "All" },
          { id: "ia-commerce-est-draft", label: "Draft" },
          { id: "ia-commerce-est-sent", label: "Sent" },
          { id: "ia-commerce-est-accepted", label: "Accepted" },
          { id: "ia-commerce-est-declined", label: "Declined" },
          { id: "ia-commerce-est-invoiced", label: "Invoiced" },
        ],
      },
      { id: "ia-commerce-invoices-sync", label: "Accounting Sync" },
    ],
  },
  {
    id: "ia-commerce-documents",
    label: "Documents & Contracts",
    icon: FileSignature,
    blurb: "Send, sign and store agreements.",
    children: [
      {
        id: "ia-commerce-documents-all",
        label: "All Documents & Contracts",
        tabs: true,
        children: [
          { id: "ia-commerce-docs-draft", label: "Draft" },
          { id: "ia-commerce-docs-waiting", label: "Waiting for others" },
          { id: "ia-commerce-docs-completed", label: "Completed" },
          { id: "ia-commerce-docs-payments", label: "Payments" },
          { id: "ia-commerce-docs-archived", label: "Archived" },
        ],
      },
      {
        id: "ia-commerce-documents-templates",
        label: "Templates",
        tabs: true,
        children: [
          { id: "ia-commerce-docs-templates-all", label: "All templates" },
          { id: "ia-commerce-docs-templates-public", label: "Public documents" },
          { id: "ia-commerce-docs-templates-library", label: "Content library" },
        ],
      },
    ],
  },
  {
    id: "ia-commerce-orders",
    label: "Orders",
    icon: ShoppingBag,
    blurb: "What sold, and what nearly did.",
    children: [
      { id: "ia-commerce-orders-list", label: "Order List" },
      { id: "ia-commerce-orders-abandoned", label: "Abandoned Checkout" },
    ],
  },
  {
    id: "ia-commerce-subscriptions",
    label: "Subscriptions",
    icon: Repeat,
    blurb: "Recurring revenue and its churn.",
  },
  {
    id: "ia-commerce-payment-links",
    label: "Payment Links",
    icon: Link,
    blurb: "Take a payment without a checkout page.",
  },
  {
    id: "ia-commerce-transactions",
    label: "Transactions",
    icon: Wallet,
    blurb: "Every charge, refund and dispute.",
  },
  {
    id: "ia-commerce-products",
    label: "Products",
    icon: Package,
    blurb: "The catalogue you sell from.",
    children: [
      { id: "ia-commerce-products-list", label: "Product List" },
      { id: "ia-commerce-products-collections", label: "Collections" },
      { id: "ia-commerce-products-inventory", label: "Inventory" },
      {
        id: "ia-commerce-products-reviews",
        label: "Reviews",
        tabs: true,
        children: [
          { id: "ia-commerce-reviews-pending", label: "Pending" },
          { id: "ia-commerce-reviews-approved", label: "Approved" },
          { id: "ia-commerce-reviews-unapproved", label: "Unapproved" },
          { id: "ia-commerce-reviews-trash", label: "Trash" },
        ],
      },
    ],
  },
  {
    id: "ia-commerce-coupons",
    label: "Coupons",
    icon: TicketPercent,
    blurb: "Discounts with rules attached.",
    tabs: true,
    children: [
      { id: "ia-commerce-coupons-all", label: "All" },
      { id: "ia-commerce-coupons-active", label: "Active" },
      { id: "ia-commerce-coupons-scheduled", label: "Scheduled" },
      { id: "ia-commerce-coupons-expired", label: "Expired" },
    ],
  },
  {
    id: "ia-commerce-gift-cards",
    label: "Gift Cards",
    icon: Gift,
    blurb: "Sell and redeem stored value.",
  },
  {
    id: "ia-commerce-settings",
    label: "Settings",
    icon: Cog,
    blurb: "Receipts, tax, shipping and notifications.",
  },
  {
    id: "ia-commerce-integrations",
    label: "Payment Integrations",
    icon: CreditCard,
    blurb: "Stripe, PayPal and the rest.",
  },
];

const CREATORS: CatalogueEntry[] = [
  {
    id: "ia-creators-portal",
    label: "Client Portal",
    icon: MonitorSmartphone,
    blurb: "One signed-in home for your members.",
    tabs: true,
    children: [
      { id: "ia-creators-portal-dashboard", label: "Dashboard" },
      {
        // L4 — the six rows today's Client Portal ▸ Settings cascade already has.
        id: "ia-creators-portal-settings",
        label: "Settings",
        children: [
          { id: "ia-creators-portal-dash-settings", label: "Dashboard Settings" },
          { id: "ia-creators-portal-domain", label: "Domain Setup" },
          { id: "ia-creators-portal-branding", label: "Branding" },
          { id: "ia-creators-portal-permissions", label: "App Permissions" },
          { id: "ia-creators-portal-email", label: "Email Settings" },
          { id: "ia-creators-portal-language", label: "Language Settings" },
          { id: "ia-creators-portal-chat", label: "Chat Widget" },
        ],
      },
      { id: "ia-creators-portal-app", label: "Branded Mobile App" },
    ],
  },
  {
    id: "ia-creators-courses",
    label: "Courses",
    icon: Library,
    blurb: "Lessons, offers and progress.",
    tabs: true,
    children: [
      { id: "ia-creators-courses-dashboard", label: "Dashboard" },
      { id: "ia-creators-courses-products", label: "Products" },
      {
        id: "ia-creators-courses-offers",
        label: "Offers",
        children: [
          { id: "ia-creators-courses-offers-list", label: "Offers List" },
          { id: "ia-creators-courses-offers-detail", label: "Offer Details" },
          { id: "ia-creators-courses-offers-upsell", label: "Offer Upsell" },
        ],
      },
      {
        id: "ia-creators-courses-analytics",
        label: "Analytics",
        children: [
          { id: "ia-creators-courses-analytics-overview", label: "Membership Analytics" },
          { id: "ia-creators-courses-analytics-progress", label: "Product Progress" },
          { id: "ia-creators-courses-analytics-assessments", label: "Assessments" },
        ],
      },
      {
        id: "ia-creators-courses-settings",
        label: "Settings",
        children: [
          { id: "ia-creators-courses-settings-general", label: "Membership Settings" },
          { id: "ia-creators-courses-settings-site", label: "Site Details" },
          { id: "ia-creators-courses-settings-domain", label: "Custom Domain" },
          { id: "ia-creators-courses-settings-email", label: "Email Settings" },
          { id: "ia-creators-courses-settings-app", label: "App Settings" },
        ],
      },
    ],
  },
  {
    id: "ia-creators-communities",
    label: "Communities",
    icon: UsersRound,
    blurb: "Groups, posts and moderation.",
    children: [
      { id: "ia-creators-communities-groups", label: "Groups" },
      { id: "ia-creators-communities-settings", label: "Settings" },
      { id: "ia-creators-communities-app", label: "Branded Mobile App" },
    ],
  },
  {
    id: "ia-creators-events",
    label: "Events",
    icon: Ticket,
    blurb: "Ticketed sessions, online or in person.",
  },
  {
    id: "ia-creators-credentials",
    label: "Credentials",
    icon: Award,
    blurb: "Certificates and badges members earn.",
    children: [
      { id: "ia-creators-credentials-dashboard", label: "Dashboards" },
      { id: "ia-creators-credentials-email", label: "Email Settings" },
    ],
  },
  {
    id: "ia-creators-gokollab",
    label: "GoKollab Marketplace",
    icon: HeartHandshake,
    blurb: "List your programme where buyers browse.",
  },
];

const INTEGRATIONS: CatalogueEntry[] = [
  {
    id: "ia-integrations-lead-connector",
    label: "Lead Connector Integrations",
    icon: Puzzle,
    blurb: "The first-party connections we maintain.",
    tabs: true,
    children: [
      { id: "ia-integrations-all", label: "All Integrations" },
      {
        // L4 — today three sibling rows inside Settings › Integrations. They are
        // per-network field maps, so they belong under the integration itself.
        id: "ia-integrations-mapping",
        label: "Form Field Mapping",
        children: [
          { id: "ia-integrations-mapping-facebook", label: "Facebook" },
          { id: "ia-integrations-mapping-tiktok", label: "TikTok" },
          { id: "ia-integrations-mapping-linkedin", label: "LinkedIn" },
        ],
      },
    ],
  },
  {
    id: "ia-integrations-private",
    label: "Private Integrations",
    icon: KeyRound,
    blurb: "Tokens your own systems use.",
  },
  {
    id: "ia-integrations-marketplace",
    label: "Marketplace Apps",
    icon: Blocks,
    blurb: "Browse, install and configure apps.",
    // Two tabs on one page. Installed apps was a page of its own until the
    // review pointed out it is a filter on the marketplace, not a destination.
    tabs: true,
    children: [
      { id: "ia-integrations-marketplace-browse", label: "Browse marketplace" },
      { id: "ia-integrations-marketplace-settings", label: "Settings" },
    ],
  },
];

/**
 * Settings — deliberately small.
 *
 * Every other setting has moved into its own product, which is why nine products
 * above carry a Settings L3 and CRM carries Object Settings. What is left here is
 * what is genuinely account-wide. Communications is the only row with grouping;
 * the other six open a page directly.
 */
const SETTINGS: CatalogueEntry[] = [
  {
    id: "ia-settings-business",
    label: "Business Profile",
    icon: BriefcaseBusiness,
    blurb: "Name, address and the details on your invoices.",
  },
  {
    id: "ia-settings-profile",
    label: "My Profile",
    icon: CircleUser,
    blurb: "Your own account and notifications.",
  },
  {
    id: "ia-settings-users",
    label: "Users",
    icon: Users,
    blurb: "Who can get in, and what they can do.",
  },
  {
    id: "ia-settings-communications",
    label: "Communications",
    icon: RadioTower,
    blurb: "The channels this account sends on.",
    children: [
      {
        // L4 — today's Settings › Email Services plus Custom Emails, which are
        // two views of the same thing: how this account sends mail.
        id: "ia-settings-comms-email",
        label: "Emails",
        children: [
          { id: "ia-settings-comms-email-services", label: "Email Services" },
          { id: "ia-settings-comms-email-custom", label: "Custom Emails" },
        ],
      },
      {
        id: "ia-settings-comms-phone",
        label: "Phone",
        children: [
          { id: "ia-settings-comms-phone-system", label: "Phone System" },
          { id: "ia-settings-comms-providers", label: "Conversation Providers" },
        ],
      },
      { id: "ia-settings-comms-whatsapp", label: "Whatsapp" },
    ],
  },
  {
    // Account-wide and shipped today (Settings › Billing), but absent from the
    // sheet. Nothing else in the tree could own it.
    id: "ia-settings-billing",
    label: "Billing",
    icon: Banknote,
    blurb: "Plan, wallet and invoices for this account.",
  },
  {
    id: "ia-settings-import",
    label: "Import",
    icon: Upload,
    blurb: "Bring records in from a file or another system.",
  },
  {
    id: "ia-settings-labs",
    label: "Labs",
    icon: FlaskConical,
    blurb: "Features you can switch on early.",
  },
  {
    id: "ia-settings-audit",
    label: "Audit Logs",
    icon: FileClock,
    blurb: "Who changed what, and when.",
  },
];

/**
 * Destinations — the row is the page, and there is no flyout.
 *
 * Launchpad is deliberately NOT here. It is the "Getting started · 4 of 7" card
 * at the top of the nav (`SetupGuideRow`), not an L1 row: the sheet's own note
 * called it a widget, and the card earns its exit at 7/7 where a permanent row
 * never would. Switched on per account via the `launchpad` theme axis.
 */
const DESTINATIONS: CatalogueEntry[] = [
  {
    id: "ia-mobile",
    label: "Mobile",
    icon: Smartphone,
    blurb: "The same records, on a phone.",
  },
];

/**
 * Launchpad: a page with no nav row.
 *
 * It is where the workspace opens and what the Launchpad card at the top of the
 * nav leads to, so it needs a page, a title and a breadcrumb — but it is not an
 * L1 row, because the card already is one and the row would be the same door
 * twice. Filed in no bucket, so its trail is just Home ▸ Launchpad.
 *
 * One name for all three surfaces. It was briefly "Getting started" on the page
 * while the card said "Launchpad", which put three near-identical labels on one
 * screen — the card, this page, and AI's own Getting Started row.
 */
const LAUNCHPAD: CatalogueEntry[] = [
  {
    id: "ia-launchpad",
    label: "Launchpad",
    icon: Rocket,
    blurb: "Finish setting the account up.",
  },
];

export const proposedCatalogue: CatalogueEntry[] = [
  ...AI,
  ...CRM,
  ...AUTOMATION,
  ...MARKETING,
  ...CONTENT,
  ...REPORTING,
  ...COMMERCE,
  ...CREATORS,
  ...INTEGRATIONS,
  ...SETTINGS,
  ...DESTINATIONS,
  ...LAUNCHPAD,
];

/* ------------------------------------------------------------------- buckets */

const ids = (products: CatalogueEntry[]) => products.map((p) => p.id);

/**
 * The twelve buckets, in nav order.
 *
 * The nine that own products come first and each opens a flyout. The two
 * destinations follow, separated by a rule, and Settings is last — the nav
 * already anchors it there. That order is authored, not sorted.
 */
export const proposedBuckets: ProposedBucket[] = [
  { id: "ia-ai", defaultLabel: "AI", icon: Sparkles, productIds: ids(AI) },
  { id: "ia-crm", defaultLabel: "CRM", icon: IdCard, productIds: ids(CRM) },
  {
    id: "ia-automation",
    defaultLabel: "Automation",
    icon: Workflow,
    productIds: ids(AUTOMATION),
  },
  {
    id: "ia-marketing",
    defaultLabel: "Marketing",
    icon: Megaphone,
    productIds: ids(MARKETING),
  },
  {
    id: "ia-content",
    defaultLabel: "Content",
    icon: LayoutTemplate,
    productIds: ids(CONTENT),
  },
  {
    id: "ia-reporting",
    defaultLabel: "Reporting",
    icon: ChartLine,
    productIds: ids(REPORTING),
  },
  {
    id: "ia-commerce",
    defaultLabel: "Commerce",
    icon: ShoppingCart,
    productIds: ids(COMMERCE),
  },
  {
    id: "ia-creators",
    defaultLabel: "Creators Hub",
    icon: GraduationCap,
    productIds: ids(CREATORS),
  },
  {
    id: "ia-integrations",
    defaultLabel: "Integrations",
    icon: Plug,
    productIds: ids(INTEGRATIONS),
  },
  {
    id: "ia-mobile",
    defaultLabel: "Mobile",
    icon: Smartphone,
    productIds: [],
    destination: true,
  },
  {
    id: "ia-settings",
    defaultLabel: "Settings",
    icon: Settings,
    productIds: ids(SETTINGS),
  },
];

/** The bucket whose products fill the nav's bottom-anchored Settings panel. */
export const PROPOSED_SETTINGS_ID = "ia-settings";

/** Product ids that render as top-level destination rows rather than in a bucket. */
export const PROPOSED_DESTINATION_IDS: readonly string[] = ids(DESTINATIONS);

/** Where the workspace opens, and where the nav's Launchpad card leads. */
export const PROPOSED_HOME_ID = "ia-launchpad";

/**
 * Pages that are deliberately in no bucket and no destination band.
 *
 * Reachable — they have a page and a breadcrumb — but never a nav row, because
 * something else is already their entry point. Exempt from the filed-exactly-
 * once check below for that reason.
 */
export const PROPOSED_UNLISTED_IDS: readonly string[] = ids(LAUNCHPAD);

/** Local alias, kept so the invariant below reads as it did. */
const UNLISTED_IDS = PROPOSED_UNLISTED_IDS;

export const PROPOSED_PRODUCT_IDS: readonly string[] = ids(proposedCatalogue);

if (process.env.NODE_ENV !== "production") {
  // This mode has no fallback bucket, so a product no bucket claims would vanish
  // from the nav, the launcher and the breadcrumbs with no error anywhere — the
  // same failure the `SuiteId` literal type exists to prevent on the shipped
  // catalogue. Membership here lives on the bucket, so the check is a runtime
  // one: every product filed exactly once, every filed id real.
  const filed = proposedBuckets.flatMap((b) => b.productIds);
  const known = new Set(PROPOSED_PRODUCT_IDS);
  const unknown = filed.filter((id) => !known.has(id));
  const counts = new Map<string, number>();
  for (const id of filed) counts.set(id, (counts.get(id) ?? 0) + 1);
  const twice = [...counts].filter(([, n]) => n > 1).map(([id]) => id);
  const unfiled = PROPOSED_PRODUCT_IDS.filter(
    (id) =>
      !counts.has(id) &&
      !PROPOSED_DESTINATION_IDS.includes(id) &&
      !UNLISTED_IDS.includes(id),
  );
  if (unknown.length || twice.length || unfiled.length) {
    throw new Error(
      [
        "proposed-ia is inconsistent:",
        unknown.length && `filed but unknown: ${unknown.join(", ")}`,
        twice.length && `filed twice: ${twice.join(", ")}`,
        unfiled.length && `never filed: ${unfiled.join(", ")}`,
      ]
        .filter(Boolean)
        .join(" "),
    );
  }
}
