import type { Contact } from "./contacts-data";

/**
 * The contact filter model: a field catalog, the operators each kind of field
 * takes, and the evaluator that narrows the table.
 *
 * Conditions inside a group are OR'ed (the live product calls these "nested
 * filters"); groups are AND'ed. Only a handful of fields have data behind them
 * in this prototype — the rest are catalog-only and never narrow, so picking
 * one is harmless rather than emptying the table.
 */

export type FilterKind = "text" | "number" | "date" | "select" | "relative";

export interface FilterField {
  id: string;
  label: string;
  kind: FilterKind;
  /** Only for select kinds. */
  options?: string[];
}

export interface FilterSection {
  id: string;
  label: string;
  fields: FilterField[];
}

export interface FilterCondition {
  id: string;
  fieldId: string;
  operator: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
}

export const OPERATORS: Record<FilterKind, string[]> = {
  text: ["Is", "Is not", "Contains", "Does not contain", "Is empty", "Is not empty"],
  number: ["Is", "Is not", "Greater than", "Less than"],
  date: ["Is before", "Is after", "Is empty", "Is not empty"],
  select: ["Is", "Is not", "Is empty", "Is not empty"],
  relative: ["Within last", "More than"],
};

const VALUELESS = new Set(["Is empty", "Is not empty"]);

export function operatorNeedsValue(operator: string): boolean {
  return !VALUELESS.has(operator);
}

const CAMPAIGNS = ["Welcome series", "Spring promo", "Re-engagement"];
const WORKFLOWS = ["New lead nurture", "Appointment reminder", "Review request"];
const STATUS_TAGS = ["Inquiry received", "Subscribed"];

export const FILTER_SECTIONS: FilterSection[] = [
  {
    id: "contact",
    label: "Contact information",
    fields: [
      { id: "firstName", label: "First name", kind: "text" },
      { id: "lastName", label: "Last name", kind: "text" },
      { id: "fullName", label: "Full name", kind: "text" },
      { id: "email", label: "Email", kind: "text" },
      { id: "phone", label: "Phone", kind: "text" },
      { id: "tags", label: "Tags", kind: "select", options: [...STATUS_TAGS, "VIP", "Newsletter"] },
      { id: "contactType", label: "Contact type", kind: "select", options: STATUS_TAGS },
      { id: "businessName", label: "Business name", kind: "text" },
      { id: "source", label: "Source", kind: "select", options: ["Instagram", "Facebook", "Website form", "Import", "Manual"] },
      { id: "age", label: "Age", kind: "number" },
      { id: "created", label: "Created", kind: "date" },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    fields: [
      { id: "activeCampaign", label: "Active campaign", kind: "select", options: CAMPAIGNS },
      { id: "campaignStatus", label: "Campaign status", kind: "select", options: ["Active", "Paused", "Finished", "Canceled"] },
      { id: "canceledCampaign", label: "Canceled campaign", kind: "select", options: CAMPAIGNS },
      { id: "finishedCampaign", label: "Finished campaign", kind: "select", options: CAMPAIGNS },
      { id: "import", label: "Import", kind: "select", options: ["contacts-jul.csv", "leads-2026.csv", "webinar-attendees.csv"] },
      { id: "lastActivity", label: "Last activity", kind: "relative" },
      { id: "lastActivityType", label: "Last activity type", kind: "select", options: ["Email", "SMS", "Call", "Form submitted", "Appointment"] },
      { id: "lastAppointment", label: "Last appointment", kind: "date" },
      { id: "pausedCampaign", label: "Paused campaign", kind: "select", options: CAMPAIGNS },
      { id: "updated", label: "Updated", kind: "date" },
      { id: "workflowActive", label: "Workflow (active)", kind: "select", options: WORKFLOWS },
      { id: "workflowFinished", label: "Workflow (finished)", kind: "select", options: WORKFLOWS },
    ],
  },
  {
    id: "opportunity",
    label: "Opportunity information",
    fields: [
      { id: "pipeline", label: "Opportunity pipeline", kind: "select", options: ["Sales pipeline", "Onboarding", "Renewals"] },
      { id: "stage", label: "Opportunity stage", kind: "select", options: ["New lead", "Contacted", "Proposal sent", "Won"] },
      { id: "oppStatus", label: "Opportunity status", kind: "select", options: ["Open", "Won", "Lost", "Abandoned"] },
    ],
  },
  {
    id: "portal",
    label: "Client portal",
    fields: [
      { id: "groups", label: "Groups", kind: "select", options: ["Members", "Beta testers", "Partners"] },
      { id: "offer", label: "Offer", kind: "select", options: ["Starter bundle", "Annual plan", "Free trial"] },
      { id: "product", label: "Product", kind: "select", options: ["Coaching program", "Online course", "Membership"] },
    ],
  },
  {
    id: "attribution",
    label: "Attribution",
    fields: [
      { id: "firstAttribution", label: "First attribution source", kind: "select", options: ["Google ads", "Facebook ads", "Organic search", "Direct"] },
      { id: "latestAttribution", label: "Latest attribution source", kind: "select", options: ["Google ads", "Facebook ads", "Organic search", "Direct"] },
      { id: "utmCampaign", label: "UTM campaign", kind: "text" },
      { id: "utmMedium", label: "UTM medium", kind: "text" },
    ],
  },
];

const FIELD_INDEX = new Map(
  FILTER_SECTIONS.flatMap((s) => s.fields).map((f) => [f.id, f]),
);

export function getField(fieldId: string): FilterField | undefined {
  return FIELD_INDEX.get(fieldId);
}

let seq = 0;
export function newFilterId(prefix = "f"): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq}`;
}

/** A fresh condition on a field: the kind's first operator, no value yet. */
export function newCondition(fieldId: string): FilterCondition {
  const kind = getField(fieldId)?.kind ?? "text";
  return { id: newFilterId("c"), fieldId, operator: OPERATORS[kind][0], value: "" };
}

export function isComplete(c: FilterCondition): boolean {
  if (!getField(c.fieldId)) return false;
  return !operatorNeedsValue(c.operator) || c.value.trim() !== "";
}

/** Drops incomplete conditions and the groups they leave empty. */
export function completeGroups(groups: FilterGroup[]): FilterGroup[] {
  return groups
    .map((g) => ({ ...g, conditions: g.conditions.filter(isComplete) }))
    .filter((g) => g.conditions.length > 0);
}

export function describeCondition(c: FilterCondition): string {
  const label = getField(c.fieldId)?.label ?? c.fieldId;
  if (!operatorNeedsValue(c.operator)) return `${label} ${c.operator.toLowerCase()}`;
  const value =
    getField(c.fieldId)?.kind === "relative" ? `${c.value} days` : c.value;
  return `${label} ${c.operator.toLowerCase()} ${value}`;
}

/* ---------- evaluation ---------- */

const STATUS_LABEL: Record<Contact["status"], string> = {
  inquiry: "Inquiry received",
  subscribed: "Subscribed",
};

/** "2 days ago" / "1 week ago" → days. Anything unreadable counts as today. */
function daysAgo(s: string): number {
  const m = s.match(/(\d+)\s*(minute|hour|day|week|month|year)/i);
  if (!m) return 0;
  const n = Number(m[1]);
  const per: Record<string, number> = { minute: 0, hour: 0, day: 1, week: 7, month: 30, year: 365 };
  return n * per[m[2].toLowerCase()];
}

/** Midnight-local day number, so "Is before" compares calendar days. */
function dayNumber(d: Date): number {
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);
}

function parseDay(s: string): number | null {
  // Date inputs hand back YYYY-MM-DD, which Date() reads as UTC — build it local.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const d = iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : dayNumber(d);
}

/** The value a field reads off a contact, or undefined when it has no data here. */
function readField(row: Contact, fieldId: string): string | null | undefined {
  const [first, ...rest] = row.name.trim().split(/\s+/);
  switch (fieldId) {
    case "firstName":
      return first ?? "";
    case "lastName":
      return rest.join(" ");
    case "fullName":
      return row.name;
    case "email":
      return row.email;
    case "tags":
    case "contactType":
      return STATUS_LABEL[row.status];
    case "created":
      return row.created;
    case "lastActivity":
      return row.lastActivity;
    default:
      return undefined;
  }
}

function matches(row: Contact, c: FilterCondition): boolean {
  const field = getField(c.fieldId);
  if (!field) return true;
  const raw = readField(row, c.fieldId);
  if (raw === undefined) return true;

  const actual = (raw ?? "").trim();
  const empty = actual === "";
  if (c.operator === "Is empty") return empty;
  if (c.operator === "Is not empty") return !empty;

  const want = c.value.trim();
  const a = actual.toLowerCase();
  const w = want.toLowerCase();

  switch (field.kind) {
    case "text":
    case "select":
      if (c.operator === "Is") return a === w;
      if (c.operator === "Is not") return a !== w;
      if (c.operator === "Contains") return a.includes(w);
      if (c.operator === "Does not contain") return !a.includes(w);
      return true;
    case "number": {
      const x = Number(actual);
      const y = Number(want);
      if (Number.isNaN(x) || Number.isNaN(y)) return true;
      if (c.operator === "Is") return x === y;
      if (c.operator === "Is not") return x !== y;
      if (c.operator === "Greater than") return x > y;
      if (c.operator === "Less than") return x < y;
      return true;
    }
    case "date": {
      const x = parseDay(actual);
      const y = parseDay(want);
      if (x === null || y === null) return true;
      if (c.operator === "Is before") return x < y;
      if (c.operator === "Is after") return x > y;
      return true;
    }
    case "relative": {
      const n = Number(want);
      if (Number.isNaN(n)) return true;
      const days = daysAgo(actual);
      if (c.operator === "Within last") return days <= n;
      if (c.operator === "More than") return days > n;
      return true;
    }
  }
}

export function applyFilters(rows: Contact[], groups: FilterGroup[]): Contact[] {
  const live = completeGroups(groups);
  if (live.length === 0) return rows;
  return rows.filter((row) =>
    live.every((g) => g.conditions.some((c) => matches(row, c))),
  );
}
