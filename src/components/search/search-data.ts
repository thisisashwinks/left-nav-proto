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
import { resolveOwned } from "@/components/nav/catalogue-equivalents";
import { allProducts } from "@/components/nav/catalogue";
import { iconForChildLabel } from "@/components/nav/l3-icons";
import type { CatalogueChild, CatalogueEntry } from "@/components/nav/catalogue-types";

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
/**
 * How many nav rows the palette will show for one query.
 *
 * The tree is several hundred rows deep across both catalogues, and a query
 * like "a" matches most of them. The palette is a shortcut, not the
 * directory: past about eight the list stops being scannable and the thing
 * you actually wanted is below the fold either way. "All products" is where
 * an exhaustive answer belongs, and it is one row away.
 */
const NAV_HIT_CAP = 8;

/**
 * The sidebar's own rows, as search hits.
 *
 * Ashwin, Oct 27: the palette knew about a hand-written index and nothing
 * about the nav, so searching "smart list" found a contact record and not
 * the page — while the identical query in All products found the page. Two
 * searches over the same product, disagreeing.
 *
 * Walked from the catalogue rather than from the rendered nav, deliberately.
 * The rendered tree is one arrangement of it: rows the account has hidden,
 * or buried under a category it collapsed, are still places it can go, and
 * a search that could only reach what is currently on screen would be a
 * worse index than the sidebar it is standing in for. Scoping stays with
 * `enabled`, which is the question that does matter — what the account owns.
 *
 * `labelFor` is how a rename reaches this. The catalogue holds the shipped
 * name; the account may have typed its own, and searching for the name you
 * gave something is the first thing anyone tries.
 */
function navHits(
  q: string,
  owned: (id: string) => boolean,
  labelFor: (id: string, fallback: string) => string,
): SearchResult[] {
  const out: SearchResult[] = [];
  const push = (
    id: string,
    title: string,
    icon: LucideIcon,
    productId: string,
    chip?: string,
    meta?: string,
  ) => {
    if (out.length >= NAV_HIT_CAP) return;
    if (!title.toLowerCase().includes(q)) return;
    out.push({
      // Prefixed: a nav row and an index entry can name the same product,
      // and two results sharing a key is a list that loses its highlight.
      id: `nav:${id}`,
      kind: "product",
      title,
      icon,
      productId,
      ...(chip ? { chip } : {}),
      ...(meta ? { meta } : {}),
    });
  };

  const walk = (
    product: CatalogueEntry,
    kids: readonly CatalogueChild[],
    parentLabel: string,
  ) => {
    for (const child of kids) {
      const label = labelFor(child.id, child.label);
      push(
        child.id,
        label,
        child.icon ?? iconForChildLabel(child.label),
        product.id,
        parentLabel,
      );
      if (child.children?.length) walk(product, child.children, label);
    }
  };

  for (const product of allProducts) {
    if (!owned(product.id)) continue;
    const label = labelFor(product.id, product.label);
    push(product.id, label, product.icon, product.id, undefined, product.blurb);
    walk(product, product.children ?? [], label);
    if (out.length >= NAV_HIT_CAP) break;
  }
  return out;
}

export function searchResults(
  query: string,
  enabled?: ReadonlySet<string>,
  /** The account's own name for a row, where it has given one. */
  labelFor: (id: string, fallback: string) => string = (_id, fallback) =>
    fallback,
): SearchGroup[] {
  const q = query.trim().toLowerCase();
  // Through `resolveOwned`, because the index names products by the shipped
  // catalogue's ids and an account on the proposed one owns `ia-crm-contacts`,
  // not `contacts` — a plain `has` hid every result there.
  const index = enabled
    ? searchIndex.filter(
        (r) =>
          r.productId === undefined ||
          resolveOwned(r.productId, enabled) !== undefined,
      )
    : searchIndex;
  const matches = q
    ? index.filter((r) => haystack(r).includes(q))
    : index.filter((r) => DEFAULT_IDS.has(r.id));

  /*
   * The nav's rows join "Navigate to", under the hand-written entries.
   *
   * Under, not over: the index is curated — it knows "ema" should reach
   * Email campaigns — and the tree walk is exhaustive. Curation first, then
   * completeness, is the order that makes the top hit usually right.
   *
   * Only while there is a query. With the field empty the palette shows its
   * default shortcuts, and appending eight catalogue rows to that would turn
   * a short list of suggestions into a directory nobody asked for.
   */
  /*
   * The walk is scoped STRICTLY, unlike the hand-written index above.
   *
   * The index names shipped ids only, so a proposed account has to reach it
   * through `resolveOwned`. The catalogue walk does not: both catalogues are
   * in `allProducts`, so resolving there let a proposed account walk the
   * shipped twin as well and every product landed twice under one name —
   * Ashwin, Oct 29: "courses" returned Courses and Courses. An account is on
   * one catalogue, and the walk should only produce rows from that one.
   */
  const owned = (id: string) => enabled === undefined || enabled.has(id);
  const seen = new Set(
    matches.map((r) => r.title.toLowerCase()),
  );
  const fromNav = q
    ? navHits(q, owned, labelFor).filter((r) => !seen.has(r.title.toLowerCase()))
    : [];

  const order: SearchResultKind[] = ["product", "record", "action"];
  return order
    .map((kind) => ({
      id: kind,
      label: GROUP_LABELS[kind],
      results:
        kind === "product"
          ? [...matches.filter((r) => r.kind === kind), ...fromNav]
          : matches.filter((r) => r.kind === kind),
    }))
    .filter((g) => g.results.length > 0);
}

/**
 * The nav row a hit opens, or undefined for one that names no destination.
 *
 * Nav hits already carry the id of the row they were walked from. The
 * hand-written entries carry a SHIPPED product id, which a proposed account
 * does not have — so those resolve through the equivalents the same way the
 * scoping above does.
 */
export function targetOf(
  r: SearchResult,
  enabled?: ReadonlySet<string>,
): string | undefined {
  if (r.id.startsWith("nav:")) return r.id.slice(4);
  if (!r.productId) return undefined;
  return enabled ? resolveOwned(r.productId, enabled) : r.productId;
}

/** Flat list in display order, for arrow-key navigation. */
export function flattenGroups(groups: SearchGroup[]): SearchResult[] {
  return groups.flatMap((g) => g.results);
}
