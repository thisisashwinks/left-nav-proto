import {
  Bot,
  Boxes,
  Building2,
  CalendarCheck,
  CalendarPlus,
  Calendar,
  ChartColumn,
  ChartLine,
  Compass,
  CreditCard,
  FileText,
  Gauge,
  Globe,
  Headset,
  History,
  Layers,
  LayoutTemplate,
  Mail,
  Megaphone,
  MessageCircle,
  MessageSquarePlus,
  Package,
  PhoneCall,
  Puzzle,
  Receipt,
  Repeat,
  Rocket,
  Settings2,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Star,
  Target,
  Ticket,
  UserPlus,
  User,
  Users,
  Video,
  Workflow,
  Wrench,
} from "lucide-react";
import type { FlyoutConfig, FlyoutEntry, FlyoutItem } from "./types";

const item = (i: FlyoutItem): FlyoutEntry => ({ kind: "item", item: i });
const label = (id: string, text: string): FlyoutEntry => ({
  kind: "label",
  id,
  text,
});

/**
 * Content for every flyout.
 *
 * Engage, Convert, Market, Automate, Analyze, Favorites, Recent and Quick
 * Actions are ported verbatim from left-nav.pen — same labels, descriptions,
 * icons and ordering.
 *
 * AI Agents and Everything have no design in the file, so their content is
 * authored from the HighLevel product surface and is the part most likely to
 * need editing. Both follow the same structure as their designed siblings.
 */

const engage: FlyoutConfig = {
  id: "engage",
  title: "Engage",
  variant: "product",
  entries: [
    item({
      id: "conversations",
      label: "Conversations",
      description: "Unified inbox — SMS, email, chat & social in one place.",
      icon: MessageCircle,
    }),
    item({
      id: "contacts",
      label: "Contacts",
      description: "People, companies and smart lists.",
      icon: Users,
    }),
    item({
      id: "calendars",
      label: "Calendars",
      description: "Scheduling, availability and appointments.",
      icon: Calendar,
    }),
    item({
      id: "reputation",
      label: "Reputation",
      description: "Reviews, ratings and business listings.",
      icon: Star,
    }),
    label("engage-new", "New in Engage"),
    item({
      id: "meetings",
      label: "Meetings",
      description: "Online meetings and collaboration",
      icon: Video,
      badge: "New",
    }),
  ],
  cta: {
    id: "explore-engage",
    icon: Compass,
    title: "Explore Engage",
    subtitle: "See everything in this area",
  },
  bottom: {
    kind: "featured",
    icon: Sparkles,
    title: "Meet AI Employee",
    body: "Your always-on AI that replies, qualifies leads and books appointments — 24/7.",
    linkLabel: "Watch 60s demo",
  },
};

const convert: FlyoutConfig = {
  id: "convert",
  title: "Convert",
  variant: "product",
  entries: [
    item({
      id: "opportunities",
      label: "Opportunities",
      description: "Pipelines, deals and forecasting.",
      icon: Target,
    }),
    item({
      id: "invoices",
      label: "Invoices & estimates",
      description: "Send invoices, quotes and estimates.",
      icon: Receipt,
    }),
    item({
      id: "products",
      label: "Products",
      description: "Catalogue, pricing and subscriptions.",
      icon: Package,
    }),
  ],
  cta: {
    id: "explore-convert",
    icon: Compass,
    title: "Explore Convert",
    subtitle: "See everything in this area",
  },
};

const market: FlyoutConfig = {
  id: "market",
  title: "Market",
  variant: "product",
  entries: [
    item({
      id: "marketing",
      label: "Marketing",
      description: "Email, social and ad campaigns.",
      icon: Megaphone,
    }),
    item({
      id: "sites",
      label: "Sites & funnels",
      description: "Websites, funnels and forms.",
      icon: LayoutTemplate,
    }),
    item({
      id: "events",
      label: "Events",
      description: "Ticketing, registration and check-in.",
      icon: Ticket,
    }),
    item({
      id: "memberships",
      label: "Memberships",
      description: "Courses, communities and portals.",
      icon: Globe,
    }),
  ],
  cta: {
    id: "explore-market",
    icon: Compass,
    title: "Explore Market",
    subtitle: "See everything in this area",
  },
};

const automate: FlyoutConfig = {
  id: "automate",
  title: "Automate",
  variant: "product",
  entries: [
    item({
      id: "automation",
      label: "Automation",
      description: "Workflows, triggers and campaigns.",
      icon: Workflow,
    }),
    item({
      id: "ai-agents",
      label: "AI Agents",
      description: "Voice and chat agents that work for you.",
      icon: Bot,
    }),
    item({
      id: "vertical-ai",
      label: "Vertical AI",
      description: "Industry-tuned agents and playbooks.",
      icon: Layers,
    }),
    item({
      id: "superagents",
      label: "Superagents",
      description: "Multi-step agents that use your tools.",
      ai: true,
    }),
  ],
  cta: {
    id: "explore-automate",
    icon: Compass,
    title: "Explore Automate",
    subtitle: "See everything in this area",
  },
  // Carousel of the three slot types from the "Pinned items, labels, flatten &
  // flyout surface" board, scoped to Automate as the design specifies.
  bottom: {
    kind: "carousel",
    slides: [
      {
        kind: "whatsNew",
        pill: "New",
        title: "Branching just got simpler",
        body: "Conditions now read in plain language, and you can test a branch without publishing.",
        linkLabel: "See what changed",
      },
      {
        kind: "contextualHelp",
        label: "Help with Automate",
        questions: [
          "Why did my workflow stop?",
          "How do I test before publishing?",
          "What triggers on a form fill?",
        ],
        askLabel: "Ask AI about Automate",
      },
      {
        kind: "shortLoop",
        label: "See it work",
        duration: "0:12",
        title: "Build a follow-up in 40 seconds",
        caption: "Muted · plays on hover · stops on mouse-out",
      },
    ],
  },
};

const analyze: FlyoutConfig = {
  id: "analyze",
  title: "Analyze",
  variant: "product",
  entries: [
    item({
      id: "reporting",
      label: "Reporting",
      description: "Attribution, calls and appointments.",
      icon: ChartLine,
    }),
    item({
      id: "dashboards",
      label: "Dashboards",
      description: "Custom dashboards and widgets.",
      icon: Gauge,
    }),
  ],
  cta: {
    id: "explore-analyze",
    icon: Compass,
    title: "Explore Analyze",
    subtitle: "See everything in this area",
  },
};

const favorites: FlyoutConfig = {
  id: "favorites",
  title: "Favorites",
  variant: "compact",
  entries: [
    item({
      id: "fav-conversations",
      label: "Conversations",
      description: "Unified inbox",
      icon: MessageCircle,
    }),
    item({
      id: "fav-contacts",
      label: "Contacts",
      description: "People & smart lists",
      icon: Users,
    }),
    item({
      id: "fav-marketing",
      label: "Marketing",
      description: "Campaigns & social",
      icon: Megaphone,
    }),
    item({
      id: "fav-opportunities",
      label: "Opportunities",
      description: "Pipelines & deals",
      icon: Target,
    }),
    item({
      id: "fav-payments",
      label: "Payments",
      description: "Invoices & orders",
      icon: CreditCard,
    }),
    item({
      id: "fav-reputation",
      label: "Reputation",
      description: "Reviews & requests",
      icon: Star,
    }),
  ],
  bottom: {
    kind: "action",
    row: {
      id: "manage-favorites",
      icon: Settings2,
      title: "Manage favorites",
      subtitle: "Reorder or remove pinned areas",
    },
  },
};

const recent: FlyoutConfig = {
  id: "recent",
  title: "Recent",
  variant: "recent",
  spaciousLabels: true,
  entries: [
    label("recent-today", "Today"),
    item({ id: "r-jatin", label: "Jatin", description: "Contact", icon: User, time: "2m" }),
    item({
      id: "r-pipeline",
      label: "Q3 Enterprise Pipeline",
      description: "Opportunities",
      icon: Target,
      time: "18m",
    }),
    item({
      id: "r-newsletter",
      label: "July Newsletter",
      description: "Email campaign",
      icon: Mail,
      time: "1h",
    }),
    label("recent-yesterday", "Yesterday"),
    item({ id: "r-shivani", label: "Shivani", description: "Contact", icon: User, time: "1d" }),
    item({
      id: "r-bookings",
      label: "Service bookings",
      description: "Calendar",
      icon: Calendar,
      time: "1d",
    }),
    item({
      id: "r-funnel",
      label: "Spring Promo Funnel",
      description: "Sites & funnels",
      icon: LayoutTemplate,
      time: "1d",
    }),
    label("recent-earlier", "Earlier this week"),
    item({
      id: "r-onboarding",
      label: "Onboarding sequence",
      description: "Automation",
      icon: Workflow,
      time: "3d",
    }),
    item({
      id: "r-revenue",
      label: "Revenue dashboard",
      description: "Reporting",
      icon: ChartColumn,
      time: "4d",
    }),
  ],
  bottom: {
    kind: "action",
    row: {
      id: "view-all-activity",
      icon: History,
      title: "View all activity",
      subtitle: "Full history across your workspace",
    },
  },
};

const quickActions: FlyoutConfig = {
  id: "quick-actions",
  title: "Quick Actions",
  variant: "action",
  entries: [
    label("qa-create", "Create"),
    item({
      id: "qa-contact",
      label: "Add a contact",
      description: "Add a new contact from scratch",
      icon: UserPlus,
    }),
    item({
      id: "qa-opportunity",
      label: "Create an opportunity",
      description: "Add a deal to your pipeline",
      icon: Target,
    }),
    item({
      id: "qa-invoice",
      label: "Create an invoice",
      description: "Bill a customer for work",
      icon: Receipt,
    }),
    label("qa-reach-out", "Reach out"),
    item({
      id: "qa-conversation",
      label: "Start a conversation",
      description: "Send an SMS, email or chat",
      icon: MessageSquarePlus,
    }),
    item({
      id: "qa-review",
      label: "Send a review request",
      description: "Ask a customer for a review",
      icon: Star,
    }),
    item({
      id: "qa-campaign",
      label: "Launch a campaign",
      description: "Send a broadcast to a list",
      icon: Megaphone,
    }),
    label("qa-schedule", "Schedule"),
    item({
      id: "qa-appointment",
      label: "Book an appointment",
      description: "Add a booking to your calendar",
      icon: CalendarPlus,
    }),
    item({
      id: "qa-funnel",
      label: "Build a funnel",
      description: "Create a funnel or landing page",
      icon: LayoutTemplate,
    }),
  ],
};

/**
 * Not in the Pencil file — authored from the HighLevel AI surface. Structured
 * like Automate (product rows, an explore CTA, a promo slot).
 */
const aiAgents: FlyoutConfig = {
  id: "ai-agents",
  title: "AI Agents",
  variant: "product",
  entries: [
    item({
      id: "ai-employee",
      label: "AI Employee",
      description: "The full suite of AI that works across your account.",
      ai: true,
      badge: "New",
    }),
    item({
      id: "conversation-ai",
      label: "Conversation AI",
      description: "Replies to leads over SMS, chat and social.",
      icon: MessageCircle,
    }),
    item({
      id: "voice-ai",
      label: "Voice AI",
      description: "Answers calls, qualifies and books appointments.",
      icon: PhoneCall,
    }),
    item({
      id: "workflow-ai",
      label: "Workflow AI",
      description: "Lets AI decide the next step in a run.",
      icon: Workflow,
    }),
    item({
      id: "reviews-ai",
      label: "Reviews AI",
      description: "Drafts replies to every review you receive.",
      icon: Star,
    }),
    item({
      id: "content-ai",
      label: "Content AI",
      description: "Writes emails, posts and landing page copy.",
      icon: FileText,
    }),
    item({
      id: "funnel-ai",
      label: "Funnel AI",
      description: "Builds a funnel from a single prompt.",
      icon: LayoutTemplate,
    }),
    label("ai-manage", "Manage"),
    item({
      id: "agent-library",
      label: "Agent library",
      description: "Browse, clone and publish agent templates.",
      icon: Boxes,
    }),
    item({
      id: "agent-usage",
      label: "Usage & billing",
      description: "Credits, limits and per-agent spend.",
      icon: Gauge,
    }),
  ],
  cta: {
    id: "explore-ai",
    icon: Compass,
    title: "Explore AI Agents",
    subtitle: "See everything in this area",
  },
  bottom: {
    kind: "carousel",
    slides: [
      {
        kind: "featured",
        icon: Sparkles,
        title: "Meet AI Employee",
        body: "Your always-on AI that replies, qualifies leads and books appointments — 24/7.",
        linkLabel: "Watch 60s demo",
      },
      {
        kind: "contextualHelp",
        label: "Help with AI Agents",
        questions: [
          "How do I train an agent on my business?",
          "When does an agent hand off to a human?",
          "What do AI credits cost?",
        ],
        askLabel: "Ask AI about AI Agents",
      },
    ],
  },
};

/**
 * Not in the Pencil file — this is what the nav's "More" row opens. Every area
 * of the product in one panel, grouped the way the nav groups them.
 */
const everything: FlyoutConfig = {
  id: "everything",
  title: "Everything",
  variant: "compact",
  entries: [
    label("ev-engage", "Engage"),
    item({ id: "ev-conversations", label: "Conversations", description: "Unified inbox", icon: MessageCircle }),
    item({ id: "ev-contacts", label: "Contacts", description: "People & smart lists", icon: Users }),
    item({ id: "ev-companies", label: "Companies", description: "Accounts & org records", icon: Building2 }),
    item({ id: "ev-calendars", label: "Calendars", description: "Scheduling & appointments", icon: Calendar }),
    item({ id: "ev-reputation", label: "Reputation", description: "Reviews & listings", icon: Star }),
    item({ id: "ev-meetings", label: "Meetings", description: "Online meetings", icon: Video }),

    label("ev-convert", "Convert"),
    item({ id: "ev-opportunities", label: "Opportunities", description: "Pipelines & deals", icon: Target }),
    item({ id: "ev-invoices", label: "Invoices & estimates", description: "Quotes & billing", icon: Receipt }),
    item({ id: "ev-payments", label: "Payments", description: "Orders & transactions", icon: CreditCard }),
    item({ id: "ev-products", label: "Products", description: "Catalogue & pricing", icon: Package }),
    item({ id: "ev-subscriptions", label: "Subscriptions", description: "Recurring revenue", icon: Repeat }),

    label("ev-market", "Market"),
    item({ id: "ev-marketing", label: "Marketing", description: "Campaigns & social", icon: Megaphone }),
    item({ id: "ev-sites", label: "Sites & funnels", description: "Pages & forms", icon: LayoutTemplate }),
    item({ id: "ev-stores", label: "Stores", description: "Ecommerce storefronts", icon: ShoppingCart }),
    item({ id: "ev-events", label: "Events", description: "Ticketing & registration", icon: Ticket }),
    item({ id: "ev-memberships", label: "Memberships", description: "Courses & communities", icon: Globe }),

    label("ev-automate", "Automate"),
    item({ id: "ev-automation", label: "Automation", description: "Workflows & triggers", icon: Workflow }),
    item({ id: "ev-ai-agents", label: "AI Agents", description: "Voice & chat agents", icon: Bot }),
    item({ id: "ev-vertical-ai", label: "Vertical AI", description: "Industry playbooks", icon: Layers }),

    label("ev-analyze", "Analyze"),
    item({ id: "ev-reporting", label: "Reporting", description: "Attribution & calls", icon: ChartLine }),
    item({ id: "ev-dashboards", label: "Dashboards", description: "Custom widgets", icon: Gauge }),

    label("ev-workspace", "Workspace"),
    item({ id: "ev-mobile", label: "Mobile App", description: "iOS & Android", icon: Smartphone }),
    item({ id: "ev-marketplace", label: "App Marketplace", description: "Integrations & apps", icon: Puzzle }),
    item({ id: "ev-launchpad", label: "Launchpad", description: "Setup & onboarding", icon: Rocket }),
    item({ id: "ev-support", label: "Support", description: "Help & live chat", icon: Headset }),
    item({ id: "ev-tasks", label: "Tasks", description: "To-dos & assignments", icon: CalendarCheck }),
    item({ id: "ev-settings", label: "Settings", description: "Account & team", icon: Wrench }),
  ],
  bottom: {
    kind: "action",
    row: {
      id: "customise-nav",
      icon: Settings2,
      title: "Customise navigation",
      subtitle: "Choose what shows and in what order",
    },
  },
};

export const flyouts: Record<string, FlyoutConfig> = {
  favorites,
  recent,
  "ai-agents": aiAgents,
  "quick-actions": quickActions,
  engage,
  convert,
  market,
  automate,
  analyze,
  everything,
};
