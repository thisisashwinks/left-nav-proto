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
}

export const opportunities: Opportunity[] = [
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
];

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
