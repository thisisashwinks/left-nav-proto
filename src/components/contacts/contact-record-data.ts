import type { CustomField } from "@/components/custom-fields/custom-fields-data";
import { USERS } from "./settings/object-settings-store";

/**
 * The seed and the shape behind the contact record card.
 *
 * Everything is derived from the contact id, so a contact reads the same on
 * every visit until someone edits it — and the edits live in record-store,
 * keyed by that same id.
 */

/** FNV-1a — cheap, stable, and good enough to scatter seeds. */
export function hashOf(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 1–100, fixed per contact. */
export const engagementScore = (id: string) => (hashOf(`score:${id}`) % 100) + 1;

/* ─── Phones ────────────────────────────────────────────────────────────── */

export interface Country {
  code: string;
  flag: string;
  dial: string;
  name: string;
}

export const COUNTRIES: Country[] = [
  { code: "US", flag: "🇺🇸", dial: "+1", name: "United States" },
  { code: "NL", flag: "🇳🇱", dial: "+31", name: "Netherlands" },
  { code: "ES", flag: "🇪🇸", dial: "+34", name: "Spain" },
  { code: "CY", flag: "🇨🇾", dial: "+357", name: "Cyprus" },
  { code: "IN", flag: "🇮🇳", dial: "+91", name: "India" },
  { code: "GB", flag: "🇬🇧", dial: "+44", name: "United Kingdom" },
  { code: "AU", flag: "🇦🇺", dial: "+61", name: "Australia" },
  { code: "DE", flag: "🇩🇪", dial: "+49", name: "Germany" },
];

export const countryByCode = (code: string) =>
  COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

export const PHONE_TYPES = ["Mobile", "Home", "Work"] as const;
export type PhoneType = (typeof PHONE_TYPES)[number];

export interface PhoneEntry {
  id: string;
  country: string;
  number: string;
  type: PhoneType | null;
}

/* ─── Standard fields ───────────────────────────────────────────────────── */

export const CONTACT_TYPES = ["Lead", "Customer", "Partner", "Vendor"];
const SOURCES = [
  "whatsapp - coexistence",
  "ad manager",
  "CSV import",
  "Facebook form",
  "Website chat",
  "",
  "",
];

/* ─── Tags ──────────────────────────────────────────────────────────────── */

/** The live account's own tag vocabulary — long, machine-made and messy. */
export const TAG_POOL = [
  "number intelligence 22-11-24",
  "aiemployee-outreach",
  "whatsapp-coex-10-12-2024",
  "whatsapp-coex-10-12",
  "whatsapp_webhook",
  "whatsapp_cancellation_webhook",
  "proagencyadmin",
  "number validation enabled agency admins",
  "h&w",
  "whatsapp_company_past_due",
  "model_deprication_aug_26_2nd_batch",
  "voice ai s2s email send",
  "wa_1_oct",
  "owner_whatsapp_one_oct",
  "whatsapp_location_subscribe",
  "requested ad manager beta",
  "whatsapp_onboard_fail",
  "whatsapp account that are live",
  "saas-fasttrack",
  "webinar-sep-2026",
  "conversation ai trial",
  "reputation-upsell",
  "churn-risk",
  "agency-pro",
  "lc-phone-ported",
  "email-builder-beta",
];

/* ─── Actions ───────────────────────────────────────────────────────────── */

export interface RecordOpportunity {
  id: string;
  name: string;
  stage: string;
  value: number;
}

export interface RecordWorkflow {
  id: string;
  name: string;
  status: "Active" | "Finished";
}

const OPP_SEEDS: Omit<RecordOpportunity, "id">[] = [
  { name: "WhatsApp onboarding", stage: "Qualified", value: 297 },
  { name: "SaaS FastTrack upgrade", stage: "Proposal sent", value: 1299 },
  { name: "Voice AI add-on", stage: "New lead", value: 97 },
];
const WORKFLOW_SEEDS: Omit<RecordWorkflow, "id">[] = [
  { name: "WhatsApp coexistence nurture", status: "Active" },
  { name: "Ad manager beta onboarding", status: "Active" },
  { name: "Webinar follow-up", status: "Finished" },
];

/* ─── The record ────────────────────────────────────────────────────────── */

export interface RecordCardState {
  ownerId: string | null;
  followerIds: string[];
  tags: string[];
  phones: PhoneEntry[];
  /** Standard and custom field values by id; multi-selects join with ", ". */
  values: Record<string, string>;
  dndAll: boolean;
  dnd: string[];
  opportunities: RecordOpportunity[];
  workflows: RecordWorkflow[];
  portalInvited: boolean;
}

/** Ids for the pinned standard rows, beside the custom field ids. */
export const STD = {
  dob: "std-dob",
  source: "std-source",
  type: "std-type",
} as const;

const TEXT_SEEDS = ["Referral", "Instagram", "Q4 promo", "Enterprise", "Returning"];

function seedValue(f: CustomField, h: number): string | null {
  switch (f.type) {
    case "dropdown-single":
    case "radio":
      return f.options[h % Math.max(f.options.length, 1)] ?? null;
    case "number":
      return String((h % 90) + 5);
    case "monetary":
      return String(((h % 40) + 1) * 50);
    case "date": {
      const d = new Date(Date.UTC(2025, h % 12, (h % 27) + 1));
      return d.toISOString().slice(0, 10);
    }
    case "single-line":
      return TEXT_SEEDS[h % TEXT_SEEDS.length];
    default:
      return null;
  }
}

export function seedRecordCard(id: string, fields: CustomField[]): RecordCardState {
  const h = hashOf(id);
  const pick = (salt: string, n: number) => hashOf(`${salt}:${id}`) % n;

  // 6–16 tags, a contiguous-ish walk through the pool so neighbours agree.
  const tagCount = 6 + pick("tags", 11);
  const start = pick("tag0", TAG_POOL.length);
  const tags: string[] = [];
  for (let i = 0; tags.length < tagCount && i < TAG_POOL.length * 2; i++) {
    const t = TAG_POOL[(start + i * (1 + (h % 3))) % TAG_POOL.length];
    if (!tags.includes(t)) tags.push(t);
  }

  const country = COUNTRIES[pick("country", COUNTRIES.length)];
  const digits = String(hashOf(`phone:${id}`)).padStart(10, "0").slice(0, 9);
  const number = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;

  const followerCount = pick("followers", 3);
  const followerIds = Array.from(
    { length: followerCount },
    (_, i) => USERS[(pick("f", USERS.length) + i * 7) % USERS.length].id,
  );

  const values: Record<string, string> = {
    [STD.source]: SOURCES[pick("source", SOURCES.length)],
    [STD.type]: pick("type", 4) === 0 ? "" : CONTACT_TYPES[pick("type2", 2)],
  };
  // Roughly one field in four arrives filled, so "Show empty fields" means something.
  fields.forEach((f) => {
    const fh = hashOf(`${id}:${f.id}`);
    if (fh % 4 !== 0) return;
    const v = seedValue(f, fh);
    if (v) values[f.id] = v;
  });

  const oppCount = pick("opps", 3);
  const wfCount = pick("wfs", 3);

  return {
    ownerId: USERS[pick("owner", USERS.length)].id,
    followerIds,
    tags,
    phones: [{ id: "p0", country: country.code, number, type: null }],
    values,
    dndAll: false,
    dnd: pick("dnd", 3) === 0 ? ["sms"] : [],
    opportunities: OPP_SEEDS.slice(0, oppCount).map((o, i) => ({ ...o, id: `o${i}` })),
    workflows: WORKFLOW_SEEDS.slice(0, wfCount).map((w, i) => ({ ...w, id: `w${i}` })),
    portalInvited: pick("portal", 2) === 0,
  };
}

/* ─── Formatting ────────────────────────────────────────────────────────── */

/** "22 Nov 2024, 4:35 AM (IST)" — the time is seeded; the list only stores a date. */
export function formatCreatedOn(created: string, id: string): string {
  const d = new Date(created);
  if (Number.isNaN(d.getTime())) return created;
  const h = hashOf(`created:${id}`);
  const hour = h % 12 === 0 ? 12 : h % 12;
  const min = String(h % 60).padStart(2, "0");
  const ampm = h % 2 === 0 ? "AM" : "PM";
  const date = `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })} ${d.getFullYear()}`;
  return `${date}, ${hour}:${min} ${ampm} (IST)`;
}

/** yyyy-mm-dd → MM/DD/YYYY, the data format. */
export function formatDateValue(iso: string): string {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${m}/${d}/${y}` : iso;
}
