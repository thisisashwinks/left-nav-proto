import {
  Bot,
  Boxes,
  CalendarPlus,
  Calendar,
  ChartColumn,
  ChartLine,
  Compass,
  CreditCard,
  FileSignature,
  FileText,
  Gauge,
  Globe,
  History,
  Layers,
  LayoutTemplate,
  ListTodo,
  Mail,
  Megaphone,
  MessageCircle,
  Package,
  PhoneCall,
  Receipt,
  Settings2,
  Sparkles,
  Star,
  Target,
  Ticket,
  UserPlus,
  User,
  Users,
  Video,
  Workflow,
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
 * AI Agents has no design in the file, so its content is authored from the
 * HighLevel product surface and is the part most likely to need editing. It
 * follows the same structure as its designed siblings.
 *
 * The nav's "More" row opens the Recent panel — that is where the full recent
 * list lives, rather than in a separate all-products panel.
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
      badge: { label: "New", tone: "new" },
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
      badge: { label: "Beta", tone: "beta" },
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
  // "Pinned", not "Favorites" (Aug 13): the rail directory, the row pins and
  // the dock all say pin — one verb for one gesture, everywhere.
  title: "Pinned",
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
      title: "Manage pinned",
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

/*
 * The v3 data-backed shortlist (ClickUp 86d3zcfg7, Pendo 90-day unique human
 * actors): a quick action must CREATE something from a blank state, with the
 * contact at most a field in the form. Contact-centric verbs (send message,
 * make a call) belong on the contact and conversation surfaces; builder
 * sessions (workflow, funnel, campaign) are not 10-second actions; review
 * request demoted — its volume was automation, not humans.
 */
const quickActions: FlyoutConfig = {
  id: "quick-actions",
  title: "Quick Actions",
  variant: "action",
  entries: [
    // The category labels survive the reshuffle — "Reach out" went with its
    // contact-centric rows, and the revenue pair earned its own group.
    label("qa-create", "Create"),
    item({
      id: "qa-contact",
      label: "Add a contact",
      description: "New contact from scratch",
      icon: UserPlus,
    }),
    item({
      id: "qa-opportunity",
      label: "Add an opportunity",
      description: "Add a deal to your pipeline",
      icon: Target,
    }),
    item({
      id: "qa-task",
      label: "Add a task",
      description: "Something to do, for you or the team",
      icon: ListTodo,
    }),
    label("qa-schedule", "Schedule"),
    item({
      id: "qa-appointment",
      label: "Book an appointment",
      description: "Add a booking to your calendar",
      icon: CalendarPlus,
    }),
    label("qa-get-paid", "Get paid"),
    item({
      id: "qa-invoice",
      label: "Create an invoice",
      description: "Bill a customer — estimates live here too",
      icon: Receipt,
    }),
    item({
      id: "qa-document",
      label: "Send a document for signature",
      description: "Contract or proposal, signed online",
      icon: FileSignature,
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
      badge: { label: "New", tone: "new" },
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
};
