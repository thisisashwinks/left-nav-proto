import {
  CircleDollarSign,
  FileText,
  ListChecks,
  MessageSquareText,
  Receipt,
  RefreshCw,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import type { PageView } from "@/components/page/view-bar";

/**
 * Commerce ▸ Invoices & Estimates, as dummy data.
 *
 * Seeded from the production screenshots Ashwin supplied on Sep 23 rather
 * than generated: the same invoice numbers, the same customers, the same
 * lopsided status mix — 58 overdue against 17 received — because the shape of
 * the data is part of what the screen is being judged on. A tidy list where
 * every row is Paid would make the status column look decorative and the
 * four summary tiles look balanced, and neither is true of this product.
 *
 * Amounts are strings, already formatted. Nothing here sums, and a number
 * that cannot be summed should not pretend it can — the tiles carry their own
 * totals for the same reason the view counts do.
 */

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

/**
 * What KIND of document the row is, which is the glyph in the first column.
 *
 * Three kinds share this one list in production, and the icon is the only
 * thing that says which: a plain invoice, an estimate that has not been
 * converted, and a Text2Pay link sent over SMS. Worth keeping because it is
 * the one place the list admits it is holding more than one object — the
 * proposed tree splits estimates onto their own L3, and a review of that
 * split needs to see what the merged list looks like first.
 */
export type InvoiceKind = "invoice" | "estimate" | "text2pay";

export const KIND_ICON: Record<InvoiceKind, LucideIcon> = {
  invoice: Receipt,
  estimate: FileText,
  text2pay: MessageSquareText,
};

export const KIND_LABEL: Record<InvoiceKind, string> = {
  invoice: "Invoice",
  estimate: "Estimate",
  text2pay: "Text2Pay",
};

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

export interface Invoice {
  id: string;
  name: string;
  number: string;
  kind: InvoiceKind;
  customer: string;
  tone: AvatarTone;
  /** Pre-formatted "Sep 21, 2026" — headings and summaries, per the copy rules. */
  issued: string;
  due: string;
  amount: string;
  status: InvoiceStatus;
  /**
   * Whether the amount carries the little info glyph the production table
   * shows beside $0.00 rows. It means "this total is not what was billed" —
   * a partial payment, a credit, a voided line — and it is on the row rather
   * than derived because nothing here computes a total to compare against.
   */
  amountNote?: boolean;
}

export const invoices: Invoice[] = [
  {
    id: "inv-231",
    name: "Estimate for field service",
    number: "INV-000231",
    kind: "estimate",
    customer: "nikhil satish",
    tone: "blue",
    issued: "Sep 21, 2026",
    due: "Sep 22, 2026",
    amount: "$91.00",
    status: "overdue",
  },
  {
    id: "inv-226",
    name: "Nikhil Kumar",
    number: "INV-000226",
    kind: "invoice",
    customer: "Nikhil Kumar",
    tone: "green",
    issued: "Jun 30, 2026",
    due: "Jun 30, 2026",
    amount: "$0.00",
    status: "paid",
    amountNote: true,
  },
  {
    id: "inv-230",
    name: "Text2Pay - vishnupriya",
    number: "INV-000230",
    kind: "text2pay",
    customer: "vishnupriya undefined",
    tone: "purple",
    issued: "Sep 2, 2026",
    due: "Sep 3, 2026",
    amount: "$4.00",
    status: "overdue",
    amountNote: true,
  },
  {
    id: "inv-229",
    name: "New Estimate test",
    number: "INV-000229",
    kind: "estimate",
    customer: "nikhil satish siddasamudra",
    tone: "purple",
    issued: "Aug 27, 2026",
    due: "Aug 28, 2026",
    amount: "$89.00",
    status: "overdue",
  },
  {
    id: "inv-228",
    name: "Text2Pay - Vishnupriya",
    number: "INV-000228",
    kind: "text2pay",
    customer: "Vishnupriya Poduval",
    tone: "teal",
    issued: "Jul 9, 2026",
    due: "Jul 10, 2026",
    amount: "$1.00",
    status: "overdue",
  },
  {
    id: "inv-227",
    name: "Text2Pay - Vishnupriya",
    number: "INV-000227",
    kind: "text2pay",
    customer: "Vishnupriya Poduval",
    tone: "teal",
    issued: "Jul 8, 2026",
    due: "Jul 9, 2026",
    amount: "$1.00",
    status: "overdue",
  },
  {
    id: "inv-225",
    name: "Nikhil Kumar",
    number: "INV-000225",
    kind: "invoice",
    customer: "Nikhil Kumar",
    tone: "green",
    issued: "Jun 30, 2026",
    due: "Jun 30, 2026",
    amount: "$0.00",
    status: "paid",
    amountNote: true,
  },
  {
    id: "inv-224",
    name: "Nikhil Kumar",
    number: "INV-000224",
    kind: "invoice",
    customer: "Nikhil Kumar",
    tone: "green",
    issued: "Jun 30, 2026",
    due: "Jun 30, 2026",
    amount: "$0.00",
    status: "paid",
    amountNote: true,
  },
  {
    id: "inv-223",
    name: "Retainer — June",
    number: "INV-000223",
    kind: "invoice",
    customer: "Dallas Barber Co.",
    tone: "orange",
    issued: "Jun 1, 2026",
    due: "Jun 15, 2026",
    amount: "$1,450.00",
    status: "paid",
  },
  {
    id: "inv-222",
    name: "Website refresh — phase 2",
    number: "INV-000222",
    kind: "invoice",
    customer: "Marta Ruiz",
    tone: "pink",
    issued: "May 28, 2026",
    due: "Jun 11, 2026",
    amount: "$3,200.00",
    status: "sent",
  },
  {
    id: "inv-221",
    name: "Estimate — patio rebuild",
    number: "INV-000221",
    kind: "estimate",
    customer: "Oak & Iron Landscaping",
    tone: "yellow",
    issued: "May 19, 2026",
    due: "Jun 2, 2026",
    amount: "$12,500.00",
    status: "sent",
  },
  {
    id: "inv-220",
    name: "Ad management — May",
    number: "INV-000220",
    kind: "invoice",
    customer: "Harper Dental",
    tone: "blue",
    issued: "May 1, 2026",
    due: "May 15, 2026",
    amount: "$900.00",
    status: "overdue",
  },
  {
    id: "inv-219",
    name: "Text2Pay - deposit",
    number: "INV-000219",
    kind: "text2pay",
    customer: "Jon Alvarez",
    tone: "teal",
    issued: "Apr 24, 2026",
    due: "Apr 24, 2026",
    amount: "$250.00",
    status: "paid",
  },
  {
    id: "inv-218",
    name: "Onboarding package",
    number: "INV-000218",
    kind: "invoice",
    customer: "Brightline Fitness",
    tone: "purple",
    issued: "Apr 12, 2026",
    due: "Apr 26, 2026",
    amount: "$4,800.00",
    status: "draft",
  },
  {
    id: "inv-217",
    name: "Quarterly SEO retainer",
    number: "INV-000217",
    kind: "invoice",
    customer: "Cedar Law Group",
    tone: "orange",
    issued: "Apr 1, 2026",
    due: "Apr 30, 2026",
    amount: "$2,100.00",
    status: "draft",
  },
  {
    id: "inv-216",
    name: "Estimate — signage refit",
    number: "INV-000216",
    kind: "estimate",
    customer: "Northside Auto",
    tone: "green",
    issued: "Mar 22, 2026",
    due: "Apr 5, 2026",
    amount: "$680.00",
    status: "draft",
  },
];

/**
 * The saved cuts of the collection — status, because that is the only
 * question anyone asks a list of invoices.
 *
 * "What is still out there" and "what came back" is the whole job, and it
 * maps one-to-one onto the four states. Counts are the production numbers
 * from the tiles, not `rows.length`: the table holds sixteen dummy rows and
 * the account holds 184, and a tab reading "Overdue 6" beside a tile reading
 * "58 Invoice(s) Overdue" would make the tiles look wrong rather than the
 * tabs look honest.
 */
export const invoiceViews: PageView[] = [
  { id: "all", label: "All", count: "184" },
  { id: "draft", label: "Draft", count: "109" },
  { id: "sent", label: "Sent", count: "17" },
  { id: "paid", label: "Paid", count: "17" },
  { id: "overdue", label: "Overdue", count: "58" },
];

/**
 * The four summary tiles above the table.
 *
 * A stat tile rather than a chart, deliberately: each is one number with no
 * shape to it — there is no trend, no comparison and no part-of-whole — and
 * the dataviz rule for that case is that the honest form is the number
 * itself, set large, with the label saying what it counts. Four of them in a
 * row is the closest thing this page has to a chart and it should stay that
 * way; the trend belongs in Reporting, which has one.
 *
 * `tone` is the money state, matched to the status pill's colour, so the red
 * total and the red pills below it read as the same fact stated twice rather
 * than as two unrelated reds.
 */
export interface InvoiceTile {
  id: string;
  label: string;
  value: string;
  tone: "neutral" | "paid" | "overdue";
  icon: LucideIcon;
}

export const invoiceTiles: InvoiceTile[] = [
  {
    id: "draft",
    label: "109 Invoice(s) in Draft",
    value: "$19,056.39",
    tone: "neutral",
    icon: FileText,
  },
  {
    id: "due",
    label: "0 Invoice(s) in Due",
    value: "$0.00",
    tone: "neutral",
    icon: CircleDollarSign,
  },
  {
    id: "received",
    label: "17 Invoice(s) received",
    value: "$9,263.93",
    tone: "paid",
    icon: Receipt,
  },
  {
    id: "overdue",
    label: "58 Invoice(s) Overdue",
    value: "$6,132.15",
    tone: "overdue",
    icon: CircleDollarSign,
  },
];

/** A line on the invoice being edited. */
export interface InvoiceLine {
  id: string;
  item: string;
  price: string;
  quantity: number;
  tax: string | null;
  subtotal: string;
  description?: string;
}

export const invoiceLines: InvoiceLine[] = [
  {
    id: "line-1",
    item: "Hair Cut - Premium",
    price: "35",
    quantity: 1,
    tax: null,
    subtotal: "$35.00",
  },
  {
    id: "line-2",
    item: "Test",
    price: "56",
    quantity: 1,
    tax: null,
    subtotal: "$56.00",
  },
];

/**
 * The account's own details, as they print on the document.
 *
 * Here rather than in the builder because the preview and the form both read
 * them — the left pane shows "Product @ HighLevel" as an editable business
 * card and the right pane prints the same lines in the letterhead, and two
 * copies of one address is how a preview starts lying about what will be
 * sent.
 */
export const invoiceBusiness = {
  name: "Product @ HighLevel",
  site: "https://example.com",
  phone: "+1 (437) 255-0180",
  address: ["1801 N. Lamar, Suite 250", "Dallas, TX", "75202", "AG"],
};

export const invoiceCustomer = {
  name: "nikhil satish",
  printedName: "Nikhil Satish",
  email: "nikhil.siddasamudra@gohighlevel.com",
  country: "US",
};

/** The terms block at the foot of the document. */
export const invoiceTerms = "invoice terms";

/* ── Layouts ─────────────────────────────────────────────────────────────
 *
 * The newest L3 in the product (Sep 23), and its own small collection: a
 * layout is a reusable document design, not an invoice, which is why it gets
 * a place rather than a tab. The list page's `initialView` carries the word
 * `layouts` to reach it.
 */

export interface InvoiceLayout {
  id: string;
  name: string;
  /** Draft or Published — a layout is editable until it is put into service. */
  state: "Draft" | "Published";
  /** Which document kind it renders. The two print differently. */
  kind: "Invoice" | "Estimate";
  size: "A4" | "Letter";
  updated: string;
}

export const invoiceLayouts: InvoiceLayout[] = [
  {
    id: "lay-1",
    name: "New Layout",
    state: "Draft",
    kind: "Invoice",
    size: "A4",
    updated: "Sep 22, 2026",
  },
  {
    id: "lay-2",
    name: "Barber services — branded",
    state: "Published",
    kind: "Invoice",
    size: "A4",
    updated: "Sep 14, 2026",
  },
  {
    id: "lay-3",
    name: "Retainer, monthly",
    state: "Published",
    kind: "Invoice",
    size: "Letter",
    updated: "Aug 30, 2026",
  },
  {
    id: "lay-4",
    name: "Field service estimate",
    state: "Draft",
    kind: "Estimate",
    size: "A4",
    updated: "Aug 11, 2026",
  },
  {
    id: "lay-5",
    name: "Minimal, no logo",
    state: "Published",
    kind: "Invoice",
    size: "A4",
    updated: "Jul 28, 2026",
  },
  {
    id: "lay-6",
    name: "Product sales, itemised",
    state: "Published",
    kind: "Invoice",
    size: "Letter",
    updated: "Jul 2, 2026",
  },
];

/**
 * The starter prompts under the generator.
 *
 * Four, and each names a BUSINESS rather than a style — "SaaS subscription",
 * not "modern" or "minimal". A style chip asks someone to have an opinion
 * about typography before they have seen anything; a business chip asks a
 * question they already know the answer to, and the style falls out of it.
 */
export const layoutPresets: {
  id: string;
  label: string;
  icon: LucideIcon;
  prompt: string;
}[] = [
  {
    id: "saas",
    label: "SaaS subscription",
    icon: RefreshCw,
    prompt:
      "A recurring subscription invoice with the plan name, the billing period, prorated credits, and the card on file.",
  },
  {
    id: "product",
    label: "Product sales invoice",
    icon: FileText,
    prompt:
      "A product sales invoice with SKUs, quantities, per-line tax, shipping, and a totals panel.",
  },
  {
    id: "boutique",
    label: "Boutique store invoice",
    icon: Sparkles,
    prompt:
      "A warm boutique invoice with my logo at the top, generous spacing, and a thank-you note under the total.",
  },
  {
    id: "services",
    label: "Add service items",
    icon: ListChecks,
    prompt:
      "An itemised services invoice with hours, rates, a discount line, and payment terms at the foot.",
  },
];
