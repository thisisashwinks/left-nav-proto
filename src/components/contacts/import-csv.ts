/**
 * The import wizard's file handling: parse a CSV, guess what each column is,
 * and ship a sample for demos that have no file to hand.
 *
 * Hand-rolled rather than a dependency because the wizard needs exactly one
 * thing — RFC 4180 quoting — and a prototype that pulls in a parser for one
 * screen carries it forever.
 */

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/**
 * Splits CSV text into rows of cells. Handles quoted fields, doubled quotes
 * inside them, and newlines inside quotes — the three things a real export
 * from a spreadsheet will contain. The first row is the header.
 */
export function parseCsv(text: string): ParsedCsv {
  const src = text.replace(/^﻿/, "");
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    out.push(row);
  }

  // Blank lines — a trailing newline, a spacer row — are not records.
  const nonEmpty = out.filter((r) => r.some((c) => c.trim() !== ""));
  const [head = [], ...rest] = nonEmpty;
  const headers = head.map((h, i) => h.trim() || `Column ${i + 1}`);
  const rows = rest.map((r) =>
    headers.map((_, i) => (r[i] ?? "").trim()),
  );
  return { headers, rows };
}

/* ─── Fields ────────────────────────────────────────────────────────────── */

export interface ContactField {
  value: string;
  label: string;
}

/** The contact field catalog the Field picker offers. */
export const CONTACT_FIELDS: ContactField[] = [
  { value: "contact_id", label: "Contact ID" },
  { value: "first_name", label: "First name" },
  { value: "last_name", label: "Last name" },
  { value: "full_name", label: "Full name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "company", label: "Business name" },
  { value: "tags", label: "Tags" },
  { value: "address", label: "Street address" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "postal_code", label: "Postal code" },
  { value: "country", label: "Country" },
  { value: "website", label: "Website" },
  { value: "source", label: "Source" },
  { value: "dob", label: "Date of birth" },
  { value: "notes", label: "Notes" },
];

export const SKIP_FIELD = "__skip";

export function fieldLabel(value: string | null): string {
  if (!value) return "";
  if (value === SKIP_FIELD) return "Don't import";
  return CONTACT_FIELDS.find((f) => f.value === value)?.label ?? value;
}

/**
 * Header → field, by name. Normalised to letters only so "First Name",
 * "first_name" and "FIRSTNAME" all land in the same place. Deliberately
 * conservative: a column the guess is unsure of stays unmapped, because a
 * wrong mapping imports bad data silently and an unmapped one asks.
 */
const ALIASES: Record<string, string> = {
  contactid: "contact_id",
  id: "contact_id",
  firstname: "first_name",
  first: "first_name",
  givenname: "first_name",
  lastname: "last_name",
  last: "last_name",
  surname: "last_name",
  familyname: "last_name",
  fullname: "full_name",
  name: "full_name",
  contactname: "full_name",
  email: "email",
  emailaddress: "email",
  mail: "email",
  phone: "phone",
  phonenumber: "phone",
  mobile: "phone",
  mobilephone: "phone",
  tags: "tags",
  tag: "tags",
  company: "company",
  companyname: "company",
  business: "company",
  businessname: "company",
  notes: "notes",
  city: "city",
  state: "state",
  country: "country",
  website: "website",
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
    // Two "Name" columns should not both claim full name.
    if (!f || taken.has(f)) return null;
    taken.add(f);
    return f;
  });
}

/** Map at least one of first name, last name, email, or phone. */
export function canCreate(mapping: (string | null)[]): boolean {
  return mapping.some(
    (m) =>
      m === "first_name" ||
      m === "last_name" ||
      m === "full_name" ||
      m === "email" ||
      m === "phone",
  );
}

/** Map one of contact ID, email, or phone. */
export function canUpdate(mapping: (string | null)[]): boolean {
  return mapping.some((m) => m === "contact_id" || m === "email" || m === "phone");
}

/* ─── Rows → records ────────────────────────────────────────────────────── */

export interface RowRecord {
  name: string;
  firstName: string;
  email: string;
  phone: string;
}

/** Reads the identifying fields out of one row, through the mapping. */
export function readRow(row: string[], mapping: (string | null)[]): RowRecord {
  const get = (field: string) => {
    const i = mapping.indexOf(field);
    return i < 0 ? "" : (row[i] ?? "").trim();
  };
  const first = get("first_name");
  const last = get("last_name");
  const full = get("full_name");
  const name = full || [first, last].filter(Boolean).join(" ");
  return {
    name,
    firstName: first || full.split(/\s+/)[0] || "",
    email: get("email"),
    phone: get("phone"),
  };
}

/* ─── Sample ────────────────────────────────────────────────────────────── */

/**
 * The built-in sample: what "Download a sample file" saves and what "Use a
 * sample file" loads. Two rows carry no name, email, or phone so a demo
 * import finishes with real errors to open in the stats modal.
 */
export const SAMPLE_FILE_NAME = "contacts-sample.csv";

export const SAMPLE_CSV = [
  "First name,Last name,Email,Phone,Tags,Company,Line,Notes",
  "Ameet,Kang,ameet.kang@example.com,(415) 555-0132,lead,Northwind Traders,1,Met at the Austin expo",
  "Jared,Schoolcraft,jared@schoolcraft.co,(512) 555-0178,\"lead, webinar\",Schoolcraft & Co,2,",
  "Haris,Saeed,haris.saeed@example.com,,customer,Saeed Dental,3,\"Prefers email, not calls\"",
  "Marcel,van den Hoven,,(646) 555-0101,partner,Hoven Logistics,4,",
  "Andrew,McEwan,andrew@mcewan.io,(206) 555-0199,lead,,5,Asked for pricing",
  ",,,,,,6,Blank row exported by mistake",
  "Hugo,Lam,hugo.lam@example.com,(213) 555-0145,customer,Lam Bakery,7,",
  "Aaron,Bailey,aaron.bailey@example.com,(305) 555-0112,webinar,Bailey Fitness,8,",
  "Pat,Friedl,pat@friedl.com,,lead,Friedl Roofing,9,",
  ",,,,newsletter,Unknown,10,No contact details",
  "Sam,Howard,sam.howard@example.com,(702) 555-0163,customer,Howard Plumbing,11,",
  "Annie,Martin,annie.martin@example.com,(617) 555-0120,\"lead, referral\",Martin Studio,12,Referred by Hugo",
].join("\n");

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Saves text as a file through a Blob — the sample download. */
export function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
