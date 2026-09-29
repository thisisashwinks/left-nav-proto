/**
 * The opportunity import's field catalog, header guessing, row reading and
 * sample file — the opportunity half of `contacts/import-csv.ts`.
 *
 * Parsing, file sizes and the download are not repeated here: they know
 * nothing about contacts, so the wizard imports them from there.
 */

import type { AvatarTone } from "@/components/contacts/contacts-data";
import {
  formatMoney,
  pipelines,
  stages,
  type Opportunity,
} from "./opportunities-data";

export { downloadText, formatFileSize, parseCsv } from "@/components/contacts/import-csv";

/* ─── Fields ────────────────────────────────────────────────────────────── */

export interface OpportunityField {
  value: string;
  label: string;
  /** Which record the column lands on — the Map table's Object column. */
  object: "Opportunity" | "Contact";
}

/** The field catalog the Field picker offers. */
export const OPPORTUNITY_FIELDS: OpportunityField[] = [
  { value: "name", label: "Opportunity name", object: "Opportunity" },
  { value: "pipeline", label: "Pipeline", object: "Opportunity" },
  { value: "stage", label: "Stage", object: "Opportunity" },
  { value: "status", label: "Status", object: "Opportunity" },
  { value: "value", label: "Value", object: "Opportunity" },
  { value: "owner", label: "Owner", object: "Opportunity" },
  { value: "source", label: "Source", object: "Opportunity" },
  { value: "business", label: "Business name", object: "Opportunity" },
  { value: "contact_name", label: "Primary contact name", object: "Contact" },
  { value: "contact_email", label: "Contact email", object: "Contact" },
  { value: "contact_phone", label: "Contact phone", object: "Contact" },
  { value: "tags", label: "Tags", object: "Opportunity" },
  { value: "expected_close", label: "Expected close date", object: "Opportunity" },
  { value: "lost_reason", label: "Lost reason", object: "Opportunity" },
];

export const SKIP_FIELD = "__skip";

export function fieldLabel(value: string | null): string {
  if (!value) return "";
  if (value === SKIP_FIELD) return "Don't import";
  return OPPORTUNITY_FIELDS.find((f) => f.value === value)?.label ?? value;
}

/** "Opportunity" or "Contact" for a mapped column; "Opportunity" otherwise. */
export function fieldObject(value: string | null): string {
  return OPPORTUNITY_FIELDS.find((f) => f.value === value)?.object ?? "Opportunity";
}

/**
 * Header → field, by name, normalised to letters only. As conservative as
 * the contacts guess: an unsure column stays unmapped and asks.
 */
const ALIASES: Record<string, string> = {
  opportunityname: "name",
  opportunity: "name",
  dealname: "name",
  deal: "name",
  name: "name",
  title: "name",
  pipeline: "pipeline",
  pipelinename: "pipeline",
  stage: "stage",
  stagename: "stage",
  pipelinestage: "stage",
  status: "status",
  opportunitystatus: "status",
  value: "value",
  amount: "value",
  dealvalue: "value",
  leadvalue: "value",
  opportunityvalue: "value",
  owner: "owner",
  assignedto: "owner",
  assignee: "owner",
  source: "source",
  leadsource: "source",
  business: "business",
  businessname: "business",
  company: "business",
  companyname: "business",
  primarycontactname: "contact_name",
  contactname: "contact_name",
  contact: "contact_name",
  primarycontact: "contact_name",
  contactemail: "contact_email",
  email: "contact_email",
  emailaddress: "contact_email",
  contactphone: "contact_phone",
  phone: "contact_phone",
  phonenumber: "contact_phone",
  tags: "tags",
  tag: "tags",
  expectedclosedate: "expected_close",
  expectedclose: "expected_close",
  closedate: "expected_close",
  lostreason: "lost_reason",
  lostreasonname: "lost_reason",
};

export function guessField(header: string): string | null {
  const key = header.toLowerCase().replace(/[^a-z]/g, "");
  return ALIASES[key] ?? null;
}

/** One mapping per column; null = not mapped yet. */
export function autoMap(headers: string[]): (string | null)[] {
  const taken = new Set<string>();
  return headers.map((h) => {
    const f = guessField(h);
    if (!f || taken.has(f)) return null;
    taken.add(f);
    return f;
  });
}

const REQUIRED_TO_CREATE = ["name", "pipeline", "stage", "contact_name"];

/** Map opportunity name, pipeline, stage, and primary contact name. */
export function canCreate(mapping: (string | null)[]): boolean {
  return REQUIRED_TO_CREATE.every((f) => mapping.includes(f));
}

/** Map opportunity name, plus contact email or contact phone. */
export function canUpdate(mapping: (string | null)[]): boolean {
  return (
    mapping.includes("name") &&
    (mapping.includes("contact_email") || mapping.includes("contact_phone"))
  );
}

/* ─── Rows → records ────────────────────────────────────────────────────── */

/** An imported row carries the two fields the Opportunity type has no slot for. */
export type ImportedOpportunity = Opportunity & {
  pipelineId: string;
  contactEmail?: string;
};

export type RowResult =
  | { ok: true; identifier: string; record: Omit<ImportedOpportunity, "id" | "tone"> }
  | { ok: false; identifier: string };

const STATUSES = ["open", "won", "lost", "abandoned"] as const;

const norm = (s: string) => s.trim().toLowerCase();

function matchPipeline(raw: string) {
  const key = norm(raw);
  return key ? pipelines.find((p) => norm(p.label) === key || p.id === key) : undefined;
}

function matchStage(raw: string) {
  const key = norm(raw);
  return key ? stages.find((s) => norm(s.label) === key) : undefined;
}

/** "$4,200", "4200", "4,200.50" → "$4,200" / "$4,200.50"; blank → "$0". */
function formatValue(raw: string): string {
  const n = Number(raw.replace(/[^0-9.-]/g, ""));
  return formatMoney(Number.isFinite(n) ? n : 0);
}

/**
 * Reads one row through the mapping. A row imports only when it has a name,
 * a primary contact, and a pipeline and stage that exist — the same four
 * the mapping requires, now checked per row.
 */
export function readRow(row: string[], mapping: (string | null)[]): RowResult {
  const get = (field: string) => {
    const i = mapping.indexOf(field);
    return i < 0 ? "" : (row[i] ?? "").trim();
  };
  const name = get("name");
  const contact = get("contact_name");
  const identifier = name || contact || get("contact_email") || "Unnamed record";
  const pipeline = matchPipeline(get("pipeline"));
  const stage = matchStage(get("stage"));
  if (!name || !contact || !pipeline || !stage) return { ok: false, identifier };

  const rawStatus = norm(get("status"));
  const status =
    STATUSES.find((s) => s === rawStatus) ??
    (stage.tone === "won" ? "won" : stage.tone === "lost" ? "lost" : "open");
  const tags = get("tags")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return {
    ok: true,
    identifier,
    record: {
      name,
      contact,
      value: formatValue(get("value")),
      stageId: stage.id,
      pipelineId: pipeline.id,
      owner: get("owner") || "Unassigned",
      source: get("source") || "CSV import",
      updated: "Just now",
      status,
      business: get("business") || undefined,
      phone: get("contact_phone") || undefined,
      contactEmail: get("contact_email") || undefined,
      tags: tags.length > 0 ? tags : undefined,
      expectedClose: get("expected_close") || undefined,
      lostReason: get("lost_reason") || undefined,
    },
  };
}

export const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

/* ─── Sample ────────────────────────────────────────────────────────────── */

/**
 * The built-in sample. The last row names a stage no pipeline has, so a demo
 * import finishes with one real error to open in the stats modal.
 */
export const SAMPLE_FILE_NAME = "opportunities-sample.csv";

export const SAMPLE_CSV = [
  "Opportunity name,Pipeline,Stage,Status,Value,Owner,Source,Business name,Primary contact name,Contact email,Contact phone,Tags,Expected close date,Lost reason",
  "Rooftop unit replacement,New installs,Quote sent,Open,\"$12,400\",Dev Anand,Referral,Harbor Diner,Maria Lopez,maria@harbordiner.com,(415) 555-0134,\"commercial, q4\",10/24/2026,",
  "Heat pump tune-up,AC services,New lead,Open,$260,Samrina Shabha,Web form,,Kevin Brooks,kevin.brooks@example.com,(512) 555-0187,residential,10/08/2026,",
  "Clinic HVAC maintenance plan,AC services,Reached out,Open,\"$3,900\",Dev Anand,Inbound call,Eastside Family Clinic,Priya Raman,priya@eastsideclinic.org,(646) 555-0163,\"contract, annual\",11/15/2026,",
  "Furnace check before winter,Winter service,Won,Won,$480,Samrina Shabha,WhatsApp,,Tom Becker,tom.becker@example.com,(206) 555-0121,,09/28/2026,",
  "Office split system — 6 zones,Hot leads,Lost,Lost,\"$18,750\",Unassigned,Referral,Northwind Traders,Ameet Kang,ameet.kang@example.com,(312) 555-0195,enterprise,09/30/2026,Went with another vendor",
  "Warehouse ventilation,New installs,Negotiation,Open,\"$9,200\",Dev Anand,Web form,Lam Logistics,Hugo Lam,hugo.lam@example.com,(213) 555-0145,warehouse,12/01/2026,",
].join("\n");
