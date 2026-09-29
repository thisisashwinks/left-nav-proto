import {
  Clock,
  Flame,
  Layers,
  ListChecks,
  Snowflake,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { AvatarTone } from "@/components/contacts/contacts-data";

/**
 * Pipelines are views, not places.
 *
 * Each one re-cuts the same Opportunity collection, which is exactly the test
 * the view bar applies — so they belong on the chip rail, and "Pipelines" the
 * settings screen does not. That tab in the shipped product is configuration
 * and has one home, in Settings.
 */
export interface Pipeline {
  id: string;
  label: string;
  count: string;
  icon: LucideIcon;
}

export const pipelines: Pipeline[] = [
  { id: "services", label: "AC services", count: "48", icon: Wrench },
  { id: "install", label: "New installs", count: "31", icon: Layers },
  { id: "hot", label: "Hot leads", count: "12", icon: Flame },
  { id: "winter", label: "Winter service", count: "26", icon: Snowflake },
];

export interface Stage {
  id: string;
  label: string;
  /** Won and lost paint their own way, and never carry a default action. */
  tone: "open" | "won" | "lost";
}

export const stages: Stage[] = [
  { id: "new", label: "New lead", tone: "open" },
  { id: "reached", label: "Reached out", tone: "open" },
  { id: "quoted", label: "Quote sent", tone: "open" },
  { id: "won", label: "Won", tone: "won" },
  { id: "lost", label: "Lost", tone: "lost" },
];

export interface Opportunity {
  id: string;
  name: string;
  contact: string;
  value: string;
  stageId: string;
  owner: string;
  updated: string;
  source: string;
  tone: AvatarTone;
  /*
   * What the board card and the edit modal draw beyond the table's columns.
   * Optional so a row can be as bare as the shipped one ("Ansh", value only):
   * the card leaves out what the record does not have rather than printing
   * a dash for it.
   */
  business?: string;
  phone?: string;
  tags?: string[];
  notes?: number;
  tasks?: number;
  unread?: number;
  /** ISO, local — the card's "next confirmed appointment" chip. */
  nextAppointment?: string;
  status?: "open" | "won" | "lost" | "abandoned";
  followers?: string[];
  expectedClose?: string;
  lostReason?: string;
}

/** The card's extras, seeded apart so the rows above stay readable. */
const EXTRAS: Record<string, Partial<Opportunity>> = {
  o1: { business: "Closer System.", phone: "(415) 555-0142", notes: 1, tags: ["whatsapp_webhook", "whatsapp_onboard_fail", "mmlite", "voice ai limit increase", "wa_1_oct"], unread: 2 },
  o2: { phone: "(646) 555-0199", notes: 2 },
  o3: { business: "Singh Cold Storage", tags: ["hot lead", "commercial", "q4"], notes: 1, tasks: 1, nextAppointment: "2026-10-02T11:00" },
  o4: { business: "Kumar & Co.", phone: "(312) 555-0177", tags: ["retrofit"], tasks: 2, unread: 1 },
  o5: {},
  o6: { business: "VenueFlow", tags: ["audit", "warehouse", "enterprise", "q4", "referral", "priority", "multi-site"], notes: 3 },
  o7: { business: "Mukim Hotels", phone: "(206) 555-0143", tasks: 1, nextAppointment: "2026-09-30T15:00" },
  o8: { status: "won" },
  o9: { status: "won", phone: "(415) 555-0118" },
  o10: { status: "lost", lostReason: "Budget constraints", business: "Chauhan Builders" },
};

export const opportunities: Opportunity[] = ([
  { id: "o1", name: "Ducted split — 3 bed", contact: "Jatin", value: "$4,200", stageId: "new", owner: "Samrina Shabha", updated: "1 day ago", source: "WhatsApp", tone: "blue" },
  { id: "o2", name: "Annual service plan", contact: "Shivani", value: "$690", stageId: "new", owner: "Unassigned", updated: "2 days ago", source: "Web form", tone: "pink" },
  { id: "o3", name: "Compressor replacement", contact: "Tridev Singh", value: "$2,850", stageId: "reached", owner: "Samrina Shabha", updated: "2 days ago", source: "Inbound call", tone: "green" },
  { id: "o4", name: "Office retrofit — floor 2", contact: "Pradeep Kumar", value: "$18,400", stageId: "reached", owner: "Dev Anand", updated: "3 days ago", source: "Referral", tone: "orange" },
  { id: "o5", name: "Split unit — bedroom", contact: "Arman Ali", value: "$1,150", stageId: "reached", owner: "Unassigned", updated: "4 days ago", source: "WhatsApp", tone: "purple" },
  { id: "o6", name: "Warehouse cooling audit", contact: "Ella", value: "$7,300", stageId: "quoted", owner: "Dev Anand", updated: "5 days ago", source: "Web form", tone: "yellow" },
  { id: "o7", name: "Ceiling cassette × 4", contact: "Ritesh Mukim", value: "$9,600", stageId: "quoted", owner: "Samrina Shabha", updated: "6 days ago", source: "Referral", tone: "teal" },
  { id: "o8", name: "Duct clean — annual", contact: "Sachin", value: "$430", stageId: "won", owner: "Dev Anand", updated: "1 week ago", source: "Inbound call", tone: "blue" },
  { id: "o9", name: "Thermostat upgrade", contact: "Vishnu", value: "$320", stageId: "won", owner: "Samrina Shabha", updated: "1 week ago", source: "WhatsApp", tone: "pink" },
  { id: "o10", name: "Full system — new build", contact: "Abhilash Chauhan", value: "$22,000", stageId: "lost", owner: "Dev Anand", updated: "2 weeks ago", source: "Referral", tone: "green" },
] as Opportunity[]).map((o) => ({ status: "open" as const, ...o, ...EXTRAS[o.id] }));

/** "$4,200" → 4200. Values are stored formatted, as the table prints them. */
export function parseMoney(value: string): number {
  return Number(value.replace(/[$,]/g, "")) || 0;
}

/** 4200 → "$4,200"; cents only when there are some. */
export function formatMoney(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  });
}

/** "1 opportunity", "4 opportunities" — the shipped board says "1 opportunities". */
export function countOpportunities(n: number): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? "opportunity" : "opportunities"}`;
}

/** Column totals, computed rather than seeded, so dragging keeps them honest. */
export function stageTotal(rows: Opportunity[], stageId: string): string {
  const sum = rows
    .filter((o) => o.stageId === stageId)
    .reduce((n, o) => n + Number(o.value.replace(/[$,]/g, "")), 0);
  return sum >= 1000
    ? `$${(sum / 1000).toFixed(sum % 1000 === 0 ? 0 : 1)}k`
    : `$${sum}`;
}

/**
 * Saved views over the pipeline you are standing in — NOT the pipelines.
 *
 * Added Sep 23, off the screenshot Ashwin sent of the shipped Opportunities
 * header: the real page carries a pipeline picker AND a row of saved lists
 * under it ("Open opportunities", plus a `+ List` to make another). That is
 * two axes, not one, and the whole page turns on keeping them apart.
 *
 * The tempting shortcut was to reuse the board's existing tab strip — which
 * has always drawn the PIPELINES as tabs — and call those the saved views.
 * It is wrong twice over. A pipeline is the SCOPE: it decides which stages
 * exist and therefore what a board can even draw. A saved view is a CUT
 * inside that scope. Fold them together and `listShowViews: false` deletes
 * the pipeline picker, and a board with no pipeline selected is not a state
 * this product has.
 *
 * Three views, where the screenshot shows one lit. A strip with a single tab
 * is a label wearing an underline, and it would settle nothing about the row
 * L-D, L-F and L-B are arguing over — which is the only reason the strip is
 * in the prototype at all.
 */
export interface OpportunityView {
  id: string;
  label: string;
  count: string;
  icon: LucideIcon;
}

export const opportunityViews: OpportunityView[] = [
  { id: "open", label: "Open opportunities", count: "7", icon: ListChecks },
  { id: "mine", label: "My deals", count: "4", icon: UserRound },
  { id: "idle", label: "No activity in 7 days", count: "3", icon: Clock },
];

/**
 * The tabs actually re-cut the rows.
 *
 * A strip whose tabs only change a label is the thing the tenets warn about:
 * it teaches people that tabs here do not mean anything, and then the variant
 * review is judging chrome over a table that never moves. The cuts are
 * deterministic so a view holds still between visits, and the last one lands
 * on three rows on purpose — the narrow saved list is the case a table has to
 * survive.
 */
export function cutByView(rows: Opportunity[], viewId: string): Opportunity[] {
  switch (viewId) {
    case "mine":
      return rows.filter((o) => o.owner === "Samrina Shabha" || o.owner === "Dev Anand").slice(0, 4);
    case "idle":
      return rows.filter((o) => o.updated.includes("week"));
    case "open":
    default:
      return rows.filter((o) => o.stageId !== "won" && o.stageId !== "lost");
  }
}
