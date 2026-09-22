import { Flame, Layers, Snowflake, Wrench, type LucideIcon } from "lucide-react";
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
