import {
  ArrowUpRight,
  Calendar,
  ChartLine,
  CreditCard,
  FileText,
  LayoutTemplate,
  Mail,
  Megaphone,
  MessageCircle,
  Plus,
  Receipt,
  Star,
  Target,
  Upload,
  User,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

/**
 * Three kinds of hit, which is what the designs group by:
 *   product  a place in the app  ("Navigate to")
 *   record   a specific thing    ("Results")
 *   action   something to do     ("Actions")
 */
export type SearchResultKind = "product" | "record" | "action";

export interface SearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  /** Product rows carry the owning group as a chip, e.g. "Engage". */
  chip?: string;
  /** Product description, or the record's type and detail. */
  meta?: string;
  icon: LucideIcon;
  /** Extra match terms, so "ema" can reach a contact that has an email. */
  keywords?: string[];
}

export interface SearchGroup {
  id: SearchResultKind;
  label: string;
  results: SearchResult[];
}

const GROUP_LABELS: Record<SearchResultKind, string> = {
  product: "Navigate to",
  record: "Results",
  action: "Actions",
};

/**
 * Stand-in index. Broad enough that the demo query from the design ("ema")
 * reproduces its result set, and that a few other plausible queries land.
 */
export const searchIndex: SearchResult[] = [
  // Products
  { id: "p-email-campaigns", kind: "product", title: "Email Campaigns", chip: "Engage", meta: "Build and send broadcast emails.", icon: Mail, keywords: ["email", "broadcast", "marketing"] },
  { id: "p-email-templates", kind: "product", title: "Email Templates", chip: "Engage", meta: "Reusable layouts for your sends.", icon: FileText, keywords: ["email", "template"] },
  { id: "p-conversations", kind: "product", title: "Conversations", chip: "Engage", meta: "Unified inbox — SMS, email, chat & social.", icon: MessageCircle, keywords: ["inbox", "email", "sms", "chat"] },
  { id: "p-contacts", kind: "product", title: "Contacts", chip: "Engage", meta: "People, companies and smart lists.", icon: Users, keywords: ["people", "leads"] },
  { id: "p-calendars", kind: "product", title: "Calendars", chip: "Engage", meta: "Scheduling, availability and appointments.", icon: Calendar, keywords: ["booking", "appointments"] },
  { id: "p-reputation", kind: "product", title: "Reputation", chip: "Engage", meta: "Reviews, ratings and business listings.", icon: Star, keywords: ["reviews"] },
  { id: "p-opportunities", kind: "product", title: "Opportunities", chip: "Convert", meta: "Pipelines, deals and forecasting.", icon: Target, keywords: ["deals", "pipeline"] },
  { id: "p-invoices", kind: "product", title: "Invoices & estimates", chip: "Convert", meta: "Send invoices, quotes and estimates.", icon: Receipt, keywords: ["billing", "quote"] },
  { id: "p-payments", kind: "product", title: "Payments", chip: "Convert", meta: "Orders, transactions and subscriptions.", icon: CreditCard, keywords: ["billing"] },
  { id: "p-marketing", kind: "product", title: "Marketing", chip: "Market", meta: "Email, social and ad campaigns.", icon: Megaphone, keywords: ["email", "campaign", "ads", "social"] },
  { id: "p-sites", kind: "product", title: "Sites & funnels", chip: "Market", meta: "Websites, funnels and forms.", icon: LayoutTemplate, keywords: ["landing", "page"] },
  { id: "p-automation", kind: "product", title: "Automation", chip: "Automate", meta: "Workflows, triggers and campaigns.", icon: Workflow, keywords: ["workflow", "trigger"] },
  { id: "p-reporting", kind: "product", title: "Reporting", chip: "Analyze", meta: "Attribution, calls and appointments.", icon: ChartLine, keywords: ["dashboard", "analytics"] },

  // Records
  { id: "r-summer-blast", kind: "record", title: "Summer email blast", meta: "Email campaign · Draft", icon: FileText, keywords: ["email", "campaign"] },
  { id: "r-ella", kind: "record", title: "Ella", meta: "Contact · fewogok504@wqeather.com", icon: User, keywords: ["email", "contact"] },
  { id: "r-july-newsletter", kind: "record", title: "July Newsletter", meta: "Email campaign · Sent", icon: Mail, keywords: ["email", "campaign"] },
  { id: "r-jatin", kind: "record", title: "Jatin", meta: "Contact · Inquiry received", icon: User, keywords: ["contact"] },
  { id: "r-q3-pipeline", kind: "record", title: "Q3 Enterprise Pipeline", meta: "Opportunities · 24 deals", icon: Target, keywords: ["pipeline", "deals"] },
  { id: "r-inv-2041", kind: "record", title: "INV-2041 · Ella", meta: "Invoice · Paid", icon: Receipt, keywords: ["invoice", "billing"] },
  { id: "r-spring-funnel", kind: "record", title: "Spring Promo Funnel", meta: "Sites & funnels · Live", icon: LayoutTemplate, keywords: ["funnel", "page"] },

  // Actions
  { id: "a-create-email", kind: "action", title: "Create email campaign", icon: Plus, keywords: ["email", "new", "campaign"] },
  { id: "a-import-contacts", kind: "action", title: "Import contacts", icon: Upload, keywords: ["csv", "contacts"] },
  { id: "a-go-templates", kind: "action", title: "Go to email templates", icon: ArrowUpRight, keywords: ["email", "template"] },
  { id: "a-add-contact", kind: "action", title: "Add a contact", icon: Plus, keywords: ["new", "contact"] },
  { id: "a-create-invoice", kind: "action", title: "Create an invoice", icon: Plus, keywords: ["new", "invoice", "billing"] },
  { id: "a-build-funnel", kind: "action", title: "Build a funnel", icon: Plus, keywords: ["new", "funnel", "page"] },
];

function haystack(r: SearchResult): string {
  return [r.title, r.meta ?? "", ...(r.keywords ?? [])].join(" ").toLowerCase();
}

/** Empty query returns a sensible standing set rather than nothing. */
const DEFAULT_IDS = new Set([
  "p-contacts",
  "p-conversations",
  "p-opportunities",
  "r-jatin",
  "r-q3-pipeline",
  "a-add-contact",
  "a-create-email",
]);

/** Case-insensitive substring match, grouped in the designs' order. */
export function searchResults(query: string): SearchGroup[] {
  const q = query.trim().toLowerCase();
  const matches = q
    ? searchIndex.filter((r) => haystack(r).includes(q))
    : searchIndex.filter((r) => DEFAULT_IDS.has(r.id));

  const order: SearchResultKind[] = ["product", "record", "action"];
  return order
    .map((kind) => ({
      id: kind,
      label: GROUP_LABELS[kind],
      results: matches.filter((r) => r.kind === kind),
    }))
    .filter((g) => g.results.length > 0);
}

/** Flat list in display order, for arrow-key navigation. */
export function flattenGroups(groups: SearchGroup[]): SearchResult[] {
  return groups.flatMap((g) => g.results);
}
