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
  /**
   * The catalogue product this hit belongs to, where it has one.
   *
   * Search is scoped to the account like everything else: a barbershop on five
   * products should not be able to search its way to Funnels, and "Build a
   * funnel" is not an action it can take. Rows without an id — a contact, a
   * generic action — are account-agnostic and always show.
   */
  productId?: string;
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
  { id: "p-email-campaigns", kind: "product", title: "Email Campaigns", chip: "Engage", meta: "Build and send broadcast emails.", icon: Mail, keywords: ["email", "broadcast", "marketing"], productId: "email-campaigns" },
  { id: "p-email-templates", kind: "product", title: "Email Templates", chip: "Engage", meta: "Reusable layouts for your sends.", icon: FileText, keywords: ["email", "template"], productId: "email-templates" },
  { id: "p-conversations", kind: "product", title: "Conversations", chip: "Engage", meta: "Unified inbox — SMS, email, chat & social.", icon: MessageCircle, keywords: ["inbox", "email", "sms", "chat"], productId: "conversations" },
  { id: "p-contacts", kind: "product", title: "Contacts", chip: "Engage", meta: "People, companies and smart lists.", icon: Users, keywords: ["people", "leads"], productId: "contacts" },
  { id: "p-calendars", kind: "product", title: "Calendars", chip: "Engage", meta: "Scheduling, availability and appointments.", icon: Calendar, keywords: ["booking", "appointments"], productId: "calendars" },
  { id: "p-reputation", kind: "product", title: "Reputation", chip: "Engage", meta: "Reviews, ratings and business listings.", icon: Star, keywords: ["reviews"], productId: "reputation" },
  { id: "p-opportunities", kind: "product", title: "Opportunities", chip: "Convert", meta: "Pipelines, deals and forecasting.", icon: Target, keywords: ["deals", "pipeline"], productId: "opportunities" },
  { id: "p-invoices", kind: "product", title: "Invoices & estimates", chip: "Convert", meta: "Send invoices, quotes and estimates.", icon: Receipt, keywords: ["billing", "quote"], productId: "invoices" },
  { id: "p-payments", kind: "product", title: "Payments", chip: "Convert", meta: "Orders, transactions and subscriptions.", icon: CreditCard, keywords: ["billing"], productId: "payments" },
  { id: "p-marketing", kind: "product", title: "Social Planner", chip: "Market", meta: "Plan and post across every social channel.", icon: Megaphone, keywords: ["campaign", "ads", "social", "marketing"], productId: "social-planner" },
  { id: "p-sites", kind: "product", title: "Sites & funnels", chip: "Market", meta: "Websites, funnels and forms.", icon: LayoutTemplate, keywords: ["landing", "page"], productId: "sites" },
  { id: "p-automation", kind: "product", title: "Automation", chip: "Automate", meta: "Workflows, triggers and campaigns.", icon: Workflow, keywords: ["workflow", "trigger"], productId: "automation" },
  { id: "p-reporting", kind: "product", title: "Reporting", chip: "Analyze", meta: "Attribution, calls and appointments.", icon: ChartLine, keywords: ["dashboard", "analytics"], productId: "reporting" },

  // Records
  { id: "r-summer-blast", kind: "record", title: "Summer email blast", meta: "Email campaign · Draft", icon: FileText, keywords: ["email", "campaign"], productId: "email-campaigns" },
  { id: "r-ella", kind: "record", title: "Ella", meta: "Contact · fewogok504@wqeather.com", icon: User, keywords: ["email", "contact"], productId: "contacts" },
  { id: "r-july-newsletter", kind: "record", title: "July Newsletter", meta: "Email campaign · Sent", icon: Mail, keywords: ["email", "campaign"], productId: "email-campaigns" },
  { id: "r-jatin", kind: "record", title: "Jatin", meta: "Contact · Inquiry received", icon: User, keywords: ["contact"], productId: "contacts" },
  { id: "r-q3-pipeline", kind: "record", title: "Q3 Enterprise Pipeline", meta: "Opportunities · 24 deals", icon: Target, keywords: ["pipeline", "deals"], productId: "opportunities" },
  { id: "r-inv-2041", kind: "record", title: "INV-2041 · Ella", meta: "Invoice · Paid", icon: Receipt, keywords: ["invoice", "billing"], productId: "invoices" },
  { id: "r-spring-funnel", kind: "record", title: "Spring Promo Funnel", meta: "Sites & funnels · Live", icon: LayoutTemplate, keywords: ["funnel", "page"], productId: "sites" },

  // Actions
  { id: "a-create-email", kind: "action", title: "Create email campaign", icon: Plus, keywords: ["email", "new", "campaign"], productId: "email-campaigns" },
  { id: "a-import-contacts", kind: "action", title: "Import contacts", icon: Upload, keywords: ["csv", "contacts"], productId: "contacts" },
  { id: "a-go-templates", kind: "action", title: "Go to email templates", icon: ArrowUpRight, keywords: ["email", "template"], productId: "email-templates" },
  { id: "a-add-contact", kind: "action", title: "Add a contact", icon: Plus, keywords: ["new", "contact"], productId: "contacts" },
  { id: "a-create-invoice", kind: "action", title: "Create an invoice", icon: Plus, keywords: ["new", "invoice", "billing"], productId: "invoices" },
  { id: "a-build-funnel", kind: "action", title: "Build a funnel", icon: Plus, keywords: ["new", "funnel", "page"], productId: "sites" },
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

/**
 * Case-insensitive substring match, grouped in the designs' order.
 *
 * `enabled` is the account's provisioned products. Passing it scopes the index
 * to what this tenant actually has; omitting it searches everything, which is
 * what a surface with no account context (none today) would want.
 */
export function searchResults(
  query: string,
  enabled?: ReadonlySet<string>,
): SearchGroup[] {
  const q = query.trim().toLowerCase();
  const index = enabled
    ? searchIndex.filter(
        (r) => r.productId === undefined || enabled.has(r.productId),
      )
    : searchIndex;
  const matches = q
    ? index.filter((r) => haystack(r).includes(q))
    : index.filter((r) => DEFAULT_IDS.has(r.id));

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
