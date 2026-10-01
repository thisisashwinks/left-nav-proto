import type { AvatarTone } from "@/components/contacts/contacts-data";

/**
 * Commerce ▸ Orders ▸ Order list — the seed, in the live account's shape.
 *
 * Kept deliberately untidy where the live data is: walk-in point-of-sale
 * orders carry no customer (the "?" avatar), the source column mixes a raw
 * channel key (`point_of_sale`) with store names, and the currencies differ
 * row to row because the account sells in two of them.
 */

export type OrderStatus = "completed" | "pending";
export type Currency = "USD" | "INR";

export interface OrderLine {
  name: string;
  qty: number;
  /** Unit price, in the order's currency. */
  price: number;
}

export interface Order {
  id: string;
  /** "#10234" — what the drawer and the receipt call it. */
  number: string;
  customer: { name: string; email: string; tone: AvatarTone } | null;
  source: string;
  lines: OrderLine[];
  /** Epoch ms. */
  placedAt: number;
  currency: Currency;
  discount: number;
  /** Fraction, 0.08 = 8%. */
  taxRate: number;
  status: OrderStatus;
  payment: "Card" | "Cash" | "UPI";
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  completed: "Completed",
  pending: "Pending",
};

const at = (iso: string) => new Date(iso).getTime();

const C = (name: string, tone: AvatarTone) => ({
  name,
  email: `${name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "")}@example.com`,
  tone,
});

const SPA = "Services Elegant Touch Salon & Spa";
const POS = "point_of_sale";

const HAIRCUT = { name: "Signature haircut", qty: 1, price: 65 };
const MANICURE = { name: "Classic manicure", qty: 1, price: 20 };
const FACIAL = { name: "Hydrating facial", qty: 1, price: 85 };
const KIT = { name: "Skincare starter kit", qty: 1, price: 999 };

/** The order newest-first, as the live list opens. */
export const ORDERS: Order[] = [
  { id: "o1", number: "#10248", customer: null, source: "Services", lines: [HAIRCUT, MANICURE], placedAt: at("2026-08-21T14:19:00"), currency: "USD", discount: 0, taxRate: 0, status: "completed", payment: "Card" },
  { id: "o2", number: "#10247", customer: null, source: POS, lines: [KIT], placedAt: at("2026-07-21T16:46:00"), currency: "INR", discount: 0, taxRate: 0, status: "pending", payment: "UPI" },
  { id: "o3", number: "#10246", customer: null, source: POS, lines: [KIT], placedAt: at("2026-07-21T16:35:00"), currency: "INR", discount: 0, taxRate: 0, status: "pending", payment: "Cash" },
  { id: "o4", number: "#10245", customer: C("Abhishek Chauhan", "blue"), source: POS, lines: [KIT], placedAt: at("2026-07-21T13:04:00"), currency: "INR", discount: 0, taxRate: 0, status: "pending", payment: "UPI" },
  { id: "o5", number: "#10244", customer: null, source: POS, lines: [KIT], placedAt: at("2026-07-21T12:00:00"), currency: "INR", discount: 0, taxRate: 0, status: "pending", payment: "Cash" },
  { id: "o6", number: "#10243", customer: C("Akshay S", "pink"), source: SPA, lines: [HAIRCUT, MANICURE], placedAt: at("2026-07-01T11:58:00"), currency: "USD", discount: 0, taxRate: 0, status: "completed", payment: "Card" },
  { id: "o7", number: "#10242", customer: C("askdaksldjl lkasjdladj", "green"), source: SPA, lines: [HAIRCUT], placedAt: at("2026-03-06T16:56:00"), currency: "USD", discount: 0, taxRate: 0, status: "pending", payment: "Card" },
  { id: "o8", number: "#10241", customer: C("khadskjd klaslkdja", "teal"), source: SPA, lines: [HAIRCUT], placedAt: at("2026-03-06T16:53:00"), currency: "USD", discount: 0, taxRate: 0, status: "pending", payment: "Card" },
  { id: "o9", number: "#10240", customer: C("Allegra Carver", "orange"), source: SPA, lines: [HAIRCUT], placedAt: at("2026-03-06T16:39:00"), currency: "USD", discount: 0, taxRate: 0, status: "completed", payment: "Card" },
  { id: "o10", number: "#10239", customer: C("Clinton Buchanan", "green"), source: SPA, lines: [HAIRCUT], placedAt: at("2025-09-09T10:12:00"), currency: "USD", discount: 0, taxRate: 0, status: "completed", payment: "Card" },
  { id: "o11", number: "#10238", customer: C("Maya Patel", "purple"), source: SPA, lines: [FACIAL, MANICURE], placedAt: at("2025-08-28T15:30:00"), currency: "USD", discount: 10, taxRate: 0.08, status: "completed", payment: "Card" },
  { id: "o12", number: "#10237", customer: C("Daniel Park", "blue"), source: "Services", lines: [FACIAL], placedAt: at("2025-08-14T09:45:00"), currency: "USD", discount: 0, taxRate: 0.08, status: "completed", payment: "Card" },
  { id: "o13", number: "#10236", customer: null, source: POS, lines: [{ ...KIT, qty: 2 }], placedAt: at("2025-07-30T18:20:00"), currency: "INR", discount: 100, taxRate: 0.18, status: "completed", payment: "UPI" },
  { id: "o14", number: "#10235", customer: C("Sofia Lopez", "yellow"), source: SPA, lines: [HAIRCUT, FACIAL], placedAt: at("2025-07-12T13:10:00"), currency: "USD", discount: 15, taxRate: 0.08, status: "pending", payment: "Card" },
  { id: "o15", number: "#10234", customer: C("Ravi Shah", "orange"), source: POS, lines: [KIT], placedAt: at("2025-06-25T11:05:00"), currency: "INR", discount: 0, taxRate: 0.18, status: "completed", payment: "Cash" },
  { id: "o16", number: "#10233", customer: C("Grace Kim", "pink"), source: "Services", lines: [MANICURE, { ...MANICURE, name: "Gel polish add-on", price: 12 }], placedAt: at("2025-06-03T16:40:00"), currency: "USD", discount: 0, taxRate: 0.08, status: "completed", payment: "Card" },
  { id: "o17", number: "#10232", customer: C("Liam Walsh", "teal"), source: SPA, lines: [HAIRCUT], placedAt: at("2025-05-19T10:30:00"), currency: "USD", discount: 0, taxRate: 0, status: "pending", payment: "Card" },
  { id: "o18", number: "#10231", customer: null, source: POS, lines: [KIT], placedAt: at("2025-05-02T19:15:00"), currency: "INR", discount: 0, taxRate: 0.18, status: "completed", payment: "Cash" },
];

/** Every source the seed uses, for the Filters drawer. */
export const ORDER_SOURCES = [...new Set(ORDERS.map((o) => o.source))];

export function orderTotals(o: Order) {
  const subtotal = o.lines.reduce((n, l) => n + l.qty * l.price, 0);
  const taxable = Math.max(0, subtotal - o.discount);
  const tax = Math.round(taxable * o.taxRate * 100) / 100;
  return { subtotal, discount: o.discount, tax, total: taxable + tax };
}

export const itemCount = (o: Order) => o.lines.reduce((n, l) => n + l.qty, 0);

const FMT: Record<Currency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
  INR: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }),
};

export const money = (n: number, c: Currency) => FMT[c].format(n);

/**
 * "Aug 21 at 02:19 PM" this year, "Sep 9, 2025" before it — the live list's
 * two formats, which drop the time once the year has to be shown.
 */
export function formatOrderDate(ms: number, now = Date.now()) {
  const d = new Date(ms);
  const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (d.getFullYear() !== new Date(now).getFullYear()) {
    return `${day}, ${d.getFullYear()}`;
  }
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${day} at ${time}`;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");

export { initialsOf };
