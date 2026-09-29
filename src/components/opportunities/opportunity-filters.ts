import {
  OPERATORS,
  newFilterId,
  operatorNeedsValue,
  type FilterCondition,
  type FilterField,
  type FilterGroup,
  type FilterSection,
} from "@/components/contacts/contact-filters";
import { opportunities, parseMoney, stages, type Opportunity } from "./opportunities-data";

/**
 * The opportunity filter model — the contacts one, re-pointed at an
 * Opportunity: a field catalog, the operators each kind takes (shared with
 * contacts), and the evaluator that narrows the list.
 *
 * Conditions inside a group are OR'ed; groups are AND'ed. Every field here
 * reads off the record, so unlike contacts nothing is catalog-only.
 *
 * Select options are derived from the rows, so a stage, owner, or tag that
 * exists is always one you can pick. `OPP_FILTER_SECTIONS` is the catalog over
 * the seed; `oppFilterSections(rows)` rebuilds it over live rows.
 */

export type { FilterCondition, FilterGroup, FilterSection };

const STATUS_LABEL: Record<NonNullable<Opportunity["status"]>, string> = {
  open: "Open",
  won: "Won",
  lost: "Lost",
  abandoned: "Abandoned",
};

const STAGE_LABEL = new Map(stages.map((s) => [s.id, s.label]));

function distinct(values: (string | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    const t = v?.trim();
    if (t) seen.add(t);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/** "1 day ago" → 1, "2 weeks ago" → 14 — so "Updated" options read in time order. */
function ageDays(s: string): number {
  const m = s.match(/(\d+)\s*(minute|hour|day|week|month|year)/i);
  if (!m) return 0;
  const per: Record<string, number> = { minute: 0, hour: 0, day: 1, week: 7, month: 30, year: 365 };
  return Number(m[1]) * per[m[2].toLowerCase()];
}

export function oppFilterSections(rows: Opportunity[]): FilterSection[] {
  const owners = distinct(rows.map((o) => o.owner)).filter((o) => o !== "Unassigned");
  const updated = [...new Set(rows.map((o) => o.updated.trim()).filter(Boolean))].sort(
    (a, b) => ageDays(a) - ageDays(b),
  );
  return [
    {
      id: "details",
      label: "Opportunity details",
      fields: [
        { id: "name", label: "Opportunity name", kind: "text" },
        { id: "value", label: "Opportunity value", kind: "number" },
        { id: "stageId", label: "Stage", kind: "select", options: stages.map((s) => s.label) },
        { id: "status", label: "Status", kind: "select", options: Object.values(STATUS_LABEL) },
        { id: "owner", label: "Owner", kind: "select", options: [...owners, "Unassigned"] },
        { id: "source", label: "Source", kind: "select", options: distinct(rows.map((o) => o.source)) },
        { id: "tags", label: "Tags", kind: "select", options: distinct(rows.flatMap((o) => o.tags ?? [])) },
        { id: "lostReason", label: "Lost reason", kind: "select", options: distinct(rows.map((o) => o.lostReason)) },
      ],
    },
    {
      id: "contact",
      label: "Primary contact",
      fields: [
        { id: "contact", label: "Contact name", kind: "text" },
        { id: "business", label: "Business name", kind: "text" },
      ],
    },
    {
      id: "activity",
      label: "Activity",
      fields: [
        { id: "updated", label: "Updated", kind: "select", options: updated },
        { id: "expectedClose", label: "Expected close date", kind: "date" },
      ],
    },
  ];
}

export const OPP_FILTER_SECTIONS: FilterSection[] = oppFilterSections(opportunities);

/**
 * Field ids and kinds never change with the rows — only select options do —
 * so the seed catalog is enough to look a field up.
 */
const FIELD_INDEX = new Map(
  OPP_FILTER_SECTIONS.flatMap((s) => s.fields).map((f) => [f.id, f]),
);

export function getOppField(fieldId: string): FilterField | undefined {
  return FIELD_INDEX.get(fieldId);
}

/** A fresh condition on a field: the kind's first operator, no value yet. */
export function newOppCondition(fieldId: string): FilterCondition {
  const kind = getOppField(fieldId)?.kind ?? "text";
  return { id: newFilterId("c"), fieldId, operator: OPERATORS[kind][0], value: "" };
}

export function isOppComplete(c: FilterCondition): boolean {
  if (!getOppField(c.fieldId)) return false;
  return !operatorNeedsValue(c.operator) || c.value.trim() !== "";
}

/** Drops incomplete conditions and the groups they leave empty. */
export function completeOppGroups(groups: FilterGroup[]): FilterGroup[] {
  return groups
    .map((g) => ({ ...g, conditions: g.conditions.filter(isOppComplete) }))
    .filter((g) => g.conditions.length > 0);
}

/** Complete conditions across every group. (Contacts' badge counts groups.) */
export function countConditions(groups: FilterGroup[]): number {
  return completeOppGroups(groups).reduce((n, g) => n + g.conditions.length, 0);
}

export function describeOppCondition(c: FilterCondition): string {
  const field = getOppField(c.fieldId);
  const label = field?.label ?? c.fieldId;
  if (!operatorNeedsValue(c.operator)) return `${label} ${c.operator.toLowerCase()}`;
  let value = c.value;
  if (field?.kind === "number") {
    const n = Number(c.value);
    if (!Number.isNaN(n)) value = `$${n.toLocaleString("en-US")}`;
  }
  return `${label} ${c.operator.toLowerCase()} ${value}`;
}

/* ---------- evaluation ---------- */

/** Midnight-local day number, so "Is before" compares calendar days. */
function dayNumber(d: Date): number {
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);
}

function parseDay(s: string): number | null {
  // Date inputs hand back YYYY-MM-DD, which Date() reads as UTC — build it local.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const d = iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : new Date(s);
  return Number.isNaN(d.getTime()) ? null : dayNumber(d);
}

/** The value a field reads off an opportunity. Tags read as a list. */
function readField(row: Opportunity, fieldId: string): string | string[] {
  switch (fieldId) {
    case "name":
      return row.name;
    case "contact":
      return row.contact;
    case "value":
      return row.value ? String(parseMoney(row.value)) : "";
    case "stageId":
      return STAGE_LABEL.get(row.stageId) ?? row.stageId;
    case "status":
      return row.status ? STATUS_LABEL[row.status] : "";
    case "owner":
      return row.owner?.trim() ? row.owner : "Unassigned";
    case "source":
      return row.source ?? "";
    case "business":
      return row.business ?? "";
    case "tags":
      return row.tags ?? [];
    case "updated":
      return row.updated ?? "";
    case "expectedClose":
      return row.expectedClose ?? "";
    case "lostReason":
      return row.lostReason ?? "";
    default:
      return "";
  }
}

function matches(row: Opportunity, c: FilterCondition): boolean {
  const field = getOppField(c.fieldId);
  if (!field) return true;
  const raw = readField(row, c.fieldId);

  // A list field ("Tags"): Is = has the tag, Is not = doesn't, empty = no tags.
  if (Array.isArray(raw)) {
    const list = raw.map((t) => t.trim().toLowerCase()).filter(Boolean);
    if (c.operator === "Is empty") return list.length === 0;
    if (c.operator === "Is not empty") return list.length > 0;
    const w = c.value.trim().toLowerCase();
    if (c.operator === "Is") return list.includes(w);
    if (c.operator === "Is not") return !list.includes(w);
    return true;
  }

  const actual = raw.trim();
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
      if (empty) return false;
      const x = Number(actual);
      const y = Number(want.replace(/[$,]/g, ""));
      if (Number.isNaN(x) || Number.isNaN(y)) return true;
      if (c.operator === "Is") return x === y;
      if (c.operator === "Is not") return x !== y;
      if (c.operator === "Greater than") return x > y;
      if (c.operator === "Less than") return x < y;
      return true;
    }
    case "date": {
      const y = parseDay(want);
      if (y === null) return true;
      // No close date can't be before or after anything.
      const x = parseDay(actual);
      if (x === null) return false;
      if (c.operator === "Is before") return x < y;
      if (c.operator === "Is after") return x > y;
      return true;
    }
    default:
      return true;
  }
}

export function applyOpportunityFilters(
  rows: Opportunity[],
  groups: FilterGroup[],
): Opportunity[] {
  const live = completeOppGroups(groups);
  if (live.length === 0) return rows;
  return rows.filter((row) => live.every((g) => g.conditions.some((c) => matches(row, c))));
}
