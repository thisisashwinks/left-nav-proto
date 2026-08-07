import {
  Award,
  Bot,
  Calendar,
  ChartLine,
  FileSignature,
  FileText,
  Globe,
  Layout,
  LayoutTemplate,
  Link2,
  ListChecks,
  Mail,
  MailCheck,
  Megaphone,
  MessageCircle,
  MessageSquareText,
  MessagesSquare,
  Phone,
  PhoneMissed,
  QrCode,
  Receipt,
  Rocket,
  Share2,
  Smartphone,
  Star,
  Target,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * The customizer's inventory, transcribed from the production sub-account
 * settings (Features and Limits, Advanced Settings, Calendar Settings,
 * Rebilling, Usage Billing, Reselling, Marketplace) and regrouped under the
 * prototype's job groups — so the switch you flip lives next to the nav
 * group it will appear in, not in an alphabet-soup grid.
 */

export interface FeatureDef {
  id: string;
  label: string;
  icon: LucideIcon;
  desc: string;
  /** Job group heading it files under. */
  group: string;
  /** On by default — the deny-list model: everything is on until turned off. */
  defaultOn?: boolean;
  /** Core features render a lock, not a toggle. */
  core?: boolean;
  /** Sub-features and policies revealed while the parent is on. */
  children?: { id: string; label: string; desc: string; defaultOn: boolean }[];
}

export const FEATURE_GROUPS = [
  "Talk to customers",
  "Get customers",
  "Get paid",
  "Run on autopilot",
  "Grow with content",
  "See how it's going",
] as const;

export const FEATURES: FeatureDef[] = [
  // Talk to customers
  { id: "conversations", label: "2-way text & email", icon: MessageCircle, desc: "The unified inbox — SMS, email, chat and social.", group: "Talk to customers", core: true },
  { id: "crm", label: "CRM & contacts", icon: Users, desc: "People, companies and smart lists.", group: "Talk to customers", core: true },
  {
    id: "calendar", label: "Calendars", icon: Calendar, desc: "Scheduling, availability and appointments.", group: "Talk to customers",
    children: [
      { id: "cal-meetings", label: "Meetings", desc: "Sales calendars, round-robin, class bookings.", defaultOn: true },
      { id: "cal-services", label: "Services", desc: "Bookings for service businesses — staff, locations, pricing.", defaultOn: true },
      { id: "cal-rentals", label: "Rentals", desc: "Hourly and multi-day bookings for rental assets.", defaultOn: false },
    ],
  },
  { id: "web-chat", label: "Web chat", icon: MessagesSquare, desc: "The chat widget on their site, wired to the inbox.", group: "Talk to customers" },
  { id: "fb-messenger", label: "Facebook Messenger", icon: MessageSquareText, desc: "Messenger conversations in the inbox.", group: "Talk to customers" },
  { id: "gmb-messaging", label: "Google Business messaging", icon: MessageSquareText, desc: "Chats started from the business profile.", group: "Talk to customers" },
  { id: "gmb-call-tracking", label: "Google Business call tracking", icon: Phone, desc: "Attribute calls from the profile.", group: "Talk to customers" },
  { id: "missed-call", label: "Missed-call text back", icon: PhoneMissed, desc: "Auto-text anyone whose call was missed.", group: "Talk to customers" },
  { id: "launchpad", label: "Launchpad", icon: Rocket, desc: "The guided setup checklist.", group: "Talk to customers" },

  // Get customers
  { id: "reputation", label: "Reputation management", icon: Star, desc: "Reviews, ratings and listings.", group: "Get customers" },
  { id: "social-planner", label: "Social planner", icon: Share2, desc: "Plan and post across networks.", group: "Get customers" },
  {
    id: "email-marketing", label: "Email marketing", icon: Mail, desc: "Broadcasts, sequences and templates.", group: "Get customers",
    children: [
      { id: "email-reverify", label: "Re-verify addresses every 90 days", desc: "Protects sender reputation and deliverability.", defaultOn: true },
      { id: "email-own-provider", label: "Let this account add its own email service", desc: "Off routes everything through yours.", defaultOn: true },
    ],
  },
  { id: "email-verification", label: "Email verification", icon: MailCheck, desc: "Verify addresses before sending.", group: "Get customers" },
  { id: "forms", label: "Forms", icon: ListChecks, desc: "Embeddable forms that create contacts.", group: "Get customers" },
  { id: "surveys", label: "Surveys", icon: ListChecks, desc: "Multi-step surveys with logic.", group: "Get customers" },
  { id: "trigger-links", label: "Trigger links", icon: Link2, desc: "Links that fire automations when clicked.", group: "Get customers" },
  { id: "templates", label: "SMS & email templates", icon: FileText, desc: "Snippets and reusable layouts.", group: "Get customers" },
  { id: "funnels", label: "Funnels", icon: LayoutTemplate, desc: "Landing pages and multi-step funnels.", group: "Get customers" },
  { id: "websites", label: "Websites", icon: Globe, desc: "Full sites on their domain.", group: "Get customers" },
  { id: "blogs", label: "Blogs", icon: FileText, desc: "Hosted blog with SEO controls.", group: "Get customers" },
  { id: "qr-codes", label: "QR codes", icon: QrCode, desc: "Trackable codes for offline campaigns.", group: "Get customers" },
  { id: "affiliate", label: "Affiliate manager", icon: Users, desc: "Recruit and pay referral partners.", group: "Get customers" },

  // Get paid
  { id: "opportunities", label: "Opportunities", icon: Target, desc: "Pipelines, stages and deal value.", group: "Get paid" },
  { id: "invoice", label: "Invoicing", icon: Receipt, desc: "Bill customers and chase what is owed.", group: "Get paid" },
  { id: "text-to-pay", label: "Text to pay", icon: Smartphone, desc: "Payment links dropped into a text.", group: "Get paid" },
  { id: "documents", label: "Documents & contracts", icon: FileSignature, desc: "Proposals, estimates and e-signature.", group: "Get paid" },

  // Run on autopilot
  { id: "workflows", label: "Workflows", icon: Workflow, desc: "Triggers, actions and handoffs.", group: "Run on autopilot" },
  { id: "triggers", label: "Triggers", icon: Zap, desc: "The legacy rule builder.", group: "Run on autopilot", defaultOn: false },
  { id: "campaigns", label: "Campaigns", icon: Megaphone, desc: "Legacy outreach sequences.", group: "Run on autopilot", defaultOn: false },
  { id: "conversation-ai", label: "Conversation AI", icon: Bot, desc: "The bot replies and books on its own.", group: "Run on autopilot" },

  // Grow with content
  { id: "memberships", label: "Memberships & courses", icon: Layout, desc: "Courses and gated content.", group: "Grow with content" },
  { id: "communities", label: "Communities", icon: Users, desc: "Discussion spaces under their brand.", group: "Grow with content" },
  { id: "certificates", label: "Certificates", icon: Award, desc: "Completion certificates for courses.", group: "Grow with content" },
  { id: "gokollab", label: "GoKollab", icon: Users, desc: "The community network.", group: "Grow with content", defaultOn: false },
  { id: "quizzes", label: "Quizzes", icon: ListChecks, desc: "Scored quizzes inside courses.", group: "Grow with content" },

  // See how it's going
  { id: "reporting", label: "All reporting", icon: ChartLine, desc: "Attribution, call and conversion reports.", group: "See how it's going" },
];

/** id -> on, seeded from the defaults above. */
export function defaultFeatureState(): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (const f of FEATURES) {
    state[f.id] = f.defaultOn ?? true;
    for (const c of f.children ?? []) state[c.id] = c.defaultOn;
  }
  return state;
}

/** Rebilling markups, straight off the production Rebilling/Usage Billing tabs. */
export interface MarkupDef {
  id: string;
  label: string;
  desc: string;
  on: boolean;
  markup: number;
  /** "What $10 buys" at this markup — production's own framing. */
  tenBuys: string;
}

export const MARKUPS: MarkupDef[] = [
  { id: "phone", label: "Phone system", desc: "Calls and SMS through your numbers.", on: true, markup: 7.5, tenBuys: "≈ 95 outbound calls or 160 segments" },
  { id: "email", label: "Email sending", desc: "Delivery through your sending domain.", on: false, markup: 7.5, tenBuys: "≈ 1,975 emails" },
  { id: "wf-premium", label: "Premium workflow actions", desc: "Slack, custom code and webhook steps.", on: true, markup: 7.5, tenBuys: "≈ 1,300 executions" },
  { id: "wf-ai", label: "External AI models", desc: "GPT steps inside workflows.", on: true, markup: 3, tenBuys: "≈ 470 runs" },
  { id: "verify", label: "Email verification", desc: "Per-address verification.", on: true, markup: 2.3, tenBuys: "≈ 1,700 checks" },
  { id: "conv-ai", label: "Conversation AI", desc: "Per message the bot generates.", on: false, markup: 1, tenBuys: "≈ 500 messages" },
  { id: "reviews-ai", label: "Reviews AI", desc: "Per review response.", on: false, markup: 1, tenBuys: "≈ 125 responses" },
  { id: "whatsapp-usage", label: "WhatsApp usage", desc: "Conversation charges from Meta.", on: false, markup: 1.05, tenBuys: "varies by region" },
];

/** Reselling add-ons — flat monthly products with a set-your-price field. */
export interface ResellDef {
  id: string;
  label: string;
  desc: string;
  on: boolean;
  youPay: number;
  customerPays: number;
}

export const RESELL_ADDONS: ResellDef[] = [
  { id: "whatsapp", label: "WhatsApp", desc: "WhatsApp as an inbox channel.", on: true, youPay: 10, customerPays: 25 },
  { id: "prospecting", label: "Prospecting", desc: "Audit any business and pitch the gap.", on: true, youPay: 29, customerPays: 44 },
  { id: "branded-app", label: "Branded mobile app", desc: "Their logo on the App Store.", on: true, youPay: 49, customerPays: 64 },
  { id: "listings", label: "Listings", desc: "Sync their profile across directories.", on: false, youPay: 30, customerPays: 50 },
];
