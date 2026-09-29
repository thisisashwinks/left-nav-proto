"use client";

import * as React from "react";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import type { AssocCompany } from "@/components/contacts/associations-data";

/**
 * The Companies object: its records, its columns, its saved lists and the
 * filter/sort model the page cuts them with.
 *
 * Module stores rather than page state, like contacts-jobs: a company you
 * added survives a visit to another product, and the saved lists the tab
 * strip shows are the same ones Manage smart lists edits.
 *
 * The account holds 117,568 companies. About 200 are materialised as real
 * rows; the rest are a deterministic tail (row N is a function of N) that is
 * only paged through when nothing narrows the list — filters, sort and search
 * work on the real rows and report their true count.
 */

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type CompanyType = "Customer" | "Supplier" | "Subcontractor" | "Partner";

export type CreatedBy =
  | { kind: "system" }
  | { kind: "user"; name: string; tone: AvatarTone };

/** Keeps the AssocCompany names, so a contact's association drawer can take one. */
export interface Company extends AssocCompany {
  country?: string;
  /** ISO code of the phone's country, for the flag select. */
  phoneCountry?: string;
  type: CompanyType;
  /** Associated contacts. */
  contacts: number;
  created: number;
  updated: number;
  createdBy: CreatedBy;
  tone: AvatarTone;
}

export type ColumnId =
  | "name"
  | "phone"
  | "email"
  | "website"
  | "address"
  | "state"
  | "city"
  | "description"
  | "postalCode"
  | "country"
  | "contacts"
  | "created"
  | "updated"
  | "createdBy"
  | "type";

export type FieldKind = "text" | "number" | "date" | "select";

export interface ColumnDef {
  id: ColumnId;
  label: string;
  width: number;
  kind: FieldKind;
  options?: string[];
}

export const COLUMN_DEFS: ColumnDef[] = [
  { id: "name", label: "Company name", width: 220, kind: "text" },
  { id: "phone", label: "Phone", width: 160, kind: "text" },
  { id: "email", label: "Email", width: 200, kind: "text" },
  { id: "website", label: "Website", width: 170, kind: "text" },
  { id: "address", label: "Address", width: 180, kind: "text" },
  { id: "state", label: "State", width: 140, kind: "text" },
  { id: "city", label: "City", width: 130, kind: "text" },
  { id: "description", label: "Description", width: 200, kind: "text" },
  { id: "postalCode", label: "Postal code", width: 120, kind: "text" },
  { id: "country", label: "Country", width: 100, kind: "text" },
  { id: "contacts", label: "Contacts", width: 100, kind: "number" },
  { id: "created", label: "Created on", width: 140, kind: "date" },
  { id: "updated", label: "Updated on", width: 140, kind: "date" },
  { id: "createdBy", label: "Created by", width: 110, kind: "text" },
  {
    id: "type",
    label: "Company type",
    width: 140,
    kind: "select",
    options: ["Customer", "Supplier", "Subcontractor", "Partner"],
  },
];

export const columnDef = (id: ColumnId) => COLUMN_DEFS.find((c) => c.id === id)!;

export interface ColumnState {
  id: ColumnId;
  visible: boolean;
}

/** Every column but Company type, in the live product's order. */
export const DEFAULT_COLUMNS: ColumnState[] = COLUMN_DEFS.map((c) => ({
  id: c.id,
  visible: c.id !== "type",
}));

export interface CompanyFilter {
  id: string;
  field: ColumnId;
  operator: string;
  value: string;
}

export interface CompanySort {
  field: ColumnId;
  dir: "asc" | "desc";
}

export const OPERATORS: Record<FieldKind, string[]> = {
  text: ["Is", "Is not", "Contains", "Does not contain", "Is empty", "Is not empty"],
  number: ["Is", "Greater than", "Less than"],
  date: ["Is before", "Is after"],
  select: ["Is", "Is not"],
};

export const needsValue = (op: string) => op !== "Is empty" && op !== "Is not empty";

/* ─── Formatting ────────────────────────────────────────────────────────── */

const DATE = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export const formatDate = (ms: number) => DATE.format(ms);
export const formatTime = (ms: number) => TIME.format(ms);
export const formatCount = (n: number) => n.toLocaleString("en-US");
export const plural = (n: number, one: string, many: string) =>
  `${formatCount(n)} ${n === 1 ? one : many}`;

/* ─── Seed ──────────────────────────────────────────────────────────────── */

const at = (iso: string) => new Date(iso).getTime();
const SEP29 = at("2026-09-29T12:19:00");
const SEP28 = at("2026-09-28T13:00:00");

const USERS: { name: string; tone: AvatarTone }[] = [
  { name: "Ashwin K S", tone: "blue" },
  { name: "Koushik K", tone: "pink" },
  { name: "Emma Jackson", tone: "purple" },
  { name: "Umar Ranginwala", tone: "green" },
  { name: "Abhilasha Rathore", tone: "yellow" },
];

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];
const TYPES: CompanyType[] = [
  "Customer", "Supplier", "Customer", "Subcontractor", "Customer",
  "Partner", "Supplier", "Customer", "Subcontractor", "Customer",
];

/** A cheap integer hash, so every derived attribute is fixed per row. */
function hash(n: number, salt: number): number {
  let x = (n + 1) * 2654435761 + salt * 40503;
  x = (x ^ (x >>> 13)) * 1274126177;
  return Math.abs(x ^ (x >>> 16));
}

type Handmade = Pick<Company, "name" | "address" | "state" | "city" | "postalCode" | "country"> & {
  website?: string;
  description?: string;
  type: CompanyType;
  contacts: number;
  by: number | null;
};

/** Page 1 of the live account, as screenshotted on Sep 29. */
const PAGE_ONE: Handmade[] = [
  { name: "Covent Garden Market Traders", address: "Carriage Hall, 29 Floral Street", state: "England", city: "London", postalCode: "WC2E 9DS", country: "GB", type: "Customer", contacts: 48, by: null, description: "Covent Garden traders' association and market management." },
  { name: "Roofwise Contractors", website: "https://www.roofwise.co.uk", address: "Michelin House, 81 Fulham Road", state: "England", city: "London", postalCode: "SW3 6RD", country: "GB", type: "Subcontractor", contacts: 12, by: 0 },
  { name: "The London Wine Cellars", website: "https://thelondonwinecellars.com", address: "25 Whitehall Place", state: "England", city: "London", postalCode: "SW1A 2BS", country: "GB", type: "Supplier", contacts: 7, by: 0 },
  { name: "Onespace Workspaces", website: "https://onespace.london", address: "35 Sackville Street", state: "England", city: "London", postalCode: "W1S 3EG", country: "GB", type: "Customer", contacts: 63, by: 1 },
  { name: "Kite Boost", address: "Condominio Plaza del Mar, Suite 402", state: "Puerto Rico", city: "San Juan", postalCode: "00912", country: "US", type: "Partner", contacts: 3, by: null },
  { name: "Lidify", address: "Avenida Independencia 1452", state: "San Salvador", city: "San Salvador", postalCode: "1101", country: "US", type: "Customer", contacts: 19, by: null },
  { name: "RFM Group", address: "22 wainsfort road", state: "Lenister", city: "Dublin", postalCode: "d6wx004", country: "AG", type: "Supplier", contacts: 5, by: null },
  { name: "Baas Systems", address: "Cole Porterstraat 14", state: "Noord-Holland", city: "Hoorn", postalCode: "1628TJ", country: "AG", type: "Subcontractor", contacts: 2, by: null },
  { name: "Soluciones Digitales GT", address: "Blvd Tulasne 4-12, Zona 10", state: "Guatemala", city: "Guatemala", postalCode: "02004", country: "US", type: "Customer", contacts: 41, by: null },
  { name: "Digital One Media", address: "1208 West Pender Street", state: "BC", city: "Vancouver", postalCode: "V6E 2S8", country: "US", type: "Partner", contacts: 9, by: null },
  { name: "GoHighLevel", address: "2851 S Parker Road, Suite 1100", state: "CO", city: "Aurora", postalCode: "80014", country: "AG", type: "Customer", contacts: 112, by: null, description: "All-in-one sales and marketing platform for agencies." },
  { name: "Impact Signs & Print", address: "27 Rupert Street", state: "Buckinghamshire", city: "HIGH WYCOMBE", postalCode: "HP12 3NG", country: "US", type: "Supplier", contacts: 4, by: null },
  { name: "Ads Pros Agency", address: "500 Market Street, Floor 3", state: "California", city: "San Francisco", postalCode: "94103", country: "US", type: "Customer", contacts: 27, by: null },
  { name: "digitalmotion GmbH", address: "Neue Reihe 8", state: "Niedersachsen", city: "Wunstorf", postalCode: "31515", country: "US", type: "Subcontractor", contacts: 6, by: null },
  { name: "EXPAND Marketing Ltd", address: "71-75 Shelton Street", state: "London", city: "London", postalCode: "WC2H9JQ", country: "US", type: "Customer", contacts: 52, by: null },
  { name: "Strobe Comunicação", address: "Rua Doutor Pereira dos Santos 210", state: "Minas Gerais", city: "Itajubá", postalCode: "37500-048", country: "US", type: "Partner", contacts: 8, by: null },
  { name: "The Search Engine Co", address: "Suite 35, Hollinwood Business Centre", state: "Gtr Manchester", city: "Oldham", postalCode: "OL8 2PF", country: "AG", type: "Supplier", contacts: 15, by: null },
];

const PREFIX = [
  "Northwind", "Bluepeak", "Clearview", "Harbor", "Summit", "Brightpath", "Ironwood",
  "Evergreen", "Silverline", "Redstone", "Oakridge", "Lumen", "Keystone", "Pioneer",
  "Crescent", "Atlas", "Meridian", "Horizon", "Granite", "Cobalt", "Juniper", "Maple",
  "Riverside", "Sterling", "Vantage", "Willow", "Zenith", "Falcon", "Beacon", "Cedar",
];
const SUFFIX = [
  "Roofing", "Dental", "Logistics", "Media", "Builders", "Plumbing", "Consulting",
  "Electrical", "Marketing", "Landscaping", "Supplies", "Joinery", "Analytics",
  "Realty", "Fitness", "Studios", "Solutions", "Engineering", "Catering", "Motors",
];
const FORM = ["Ltd", "LLC", "Inc", "Group", "Co", "", "", "Partners"];

const PLACES: { city: string; state: string; postal: string; country: string; streets: string[] }[] = [
  { city: "London", state: "England", postal: "EC1V 2NX", country: "GB", streets: ["Old Street", "Hoxton Square", "Great Eastern Street"] },
  { city: "Manchester", state: "Gtr Manchester", postal: "M1 4BT", country: "GB", streets: ["Deansgate", "Portland Street", "Oxford Road"] },
  { city: "Austin", state: "TX", postal: "78701", country: "US", streets: ["Congress Avenue", "Lavaca Street", "E 6th Street"] },
  { city: "Denver", state: "CO", postal: "80202", country: "US", streets: ["Larimer Street", "Blake Street", "Wazee Street"] },
  { city: "Seattle", state: "WA", postal: "98101", country: "US", streets: ["Pike Street", "Pine Street", "1st Avenue"] },
  { city: "Toronto", state: "ON", postal: "M5V 2T6", country: "CA", streets: ["King Street W", "Spadina Avenue", "Queen Street W"] },
  { city: "Sydney", state: "NSW", postal: "2000", country: "AU", streets: ["George Street", "Pitt Street", "Kent Street"] },
  { city: "Bengaluru", state: "Karnataka", postal: "560001", country: "IN", streets: ["MG Road", "Brigade Road", "Residency Road"] },
  { city: "Dublin", state: "Leinster", postal: "D02 X285", country: "IE", streets: ["Grafton Street", "Dame Street", "Baggot Street"] },
  { city: "Miami", state: "FL", postal: "33131", country: "US", streets: ["Brickell Avenue", "Biscayne Blvd", "SE 2nd Avenue"] },
];

/** Minutes between generated rows' creation, walking back from Sep 28. */
const STEP_MIN = 4;

/** Row N of the account (N ≥ 17). A pure function, so the tail needs no array. */
function makeCompany(n: number): Company {
  const h = hash(n, 1);
  const prefix = PREFIX[h % PREFIX.length];
  const suffix = SUFFIX[hash(n, 2) % SUFFIX.length];
  const form = FORM[hash(n, 3) % FORM.length];
  const name = [prefix, suffix, form].filter(Boolean).join(" ");
  const place = PLACES[hash(n, 4) % PLACES.length];
  const slug = `${prefix}${suffix}`.toLowerCase();
  const hasWeb = hash(n, 5) % 3 !== 0;
  const hasEmail = hash(n, 6) % 2 === 0;
  const hasPhone = hash(n, 7) % 5 < 3;
  const created =
    SEP28 - ((n - 16) * STEP_MIN + (hash(n, 8) % STEP_MIN)) * 60_000;
  const updated = created + (hash(n, 9) % 5 === 0 ? (hash(n, 10) % 72) * 3_600_000 : 0);
  const byUser = hash(n, 11) % 3 === 0;
  const phone =
    place.country === "US" || place.country === "CA"
      ? `+1 (${200 + (hash(n, 12) % 700)}) ${String(200 + (hash(n, 13) % 700))}-${String(hash(n, 14) % 10000).padStart(4, "0")}`
      : undefined;
  return {
    id: `co-${n}`,
    name,
    phone: hasPhone ? phone : undefined,
    phoneCountry: hasPhone && phone ? place.country : undefined,
    email: hasEmail ? `hello@${slug}.com` : undefined,
    website: hasWeb ? `https://www.${slug}.com` : undefined,
    address: `${1 + (hash(n, 15) % 240)} ${place.streets[hash(n, 16) % place.streets.length]}`,
    state: place.state,
    city: place.city,
    postalCode: place.postal,
    country: place.country,
    description:
      hash(n, 17) % 4 === 0 ? `${suffix} services for ${place.city} and the surrounding area.` : undefined,
    type: TYPES[hash(n, 18) % TYPES.length],
    contacts: hash(n, 19) % 60,
    created,
    updated,
    createdBy: byUser
      ? { kind: "user", ...USERS[hash(n, 20) % USERS.length] }
      : { kind: "system" },
    tone: TONES[n % TONES.length],
  };
}

export const VIRTUAL_TOTAL = 117_568;
const REAL_COUNT = 200;

function seedRows(): Company[] {
  const handmade = PAGE_ONE.map<Company>((c, i) => ({
    id: `co-${i}`,
    name: c.name,
    website: c.website,
    address: c.address,
    state: c.state,
    city: c.city,
    postalCode: c.postalCode,
    country: c.country,
    description: c.description,
    type: c.type,
    contacts: c.contacts,
    created: i < 4 ? SEP29 : SEP28,
    updated: i < 4 ? SEP29 : SEP28,
    createdBy: c.by == null ? { kind: "system" } : { kind: "user", ...USERS[c.by] },
    tone: TONES[i % TONES.length],
  }));
  const generated = Array.from({ length: REAL_COUNT - PAGE_ONE.length }, (_, i) =>
    makeCompany(PAGE_ONE.length + i),
  );
  return [...handmade, ...generated];
}

/* ─── Companies store ───────────────────────────────────────────────────── */

interface CompaniesState {
  real: Company[];
  /** How many generated rows follow the real ones, before removals. */
  tailCount: number;
  /** Tail indices removed, ascending. */
  tailRemoved: number[];
  /** Tail rows edited in this session, by tail index. */
  tailEdits: Record<number, Company>;
}

let state: CompaniesState = {
  real: seedRows(),
  tailCount: VIRTUAL_TOTAL - REAL_COUNT,
  tailRemoved: [],
  tailEdits: {},
};

const listeners = new Set<() => void>();
function setState(next: CompaniesState) {
  state = next;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useCompanies(): CompaniesState {
  return React.useSyncExternalStore(subscribe, () => state, () => state);
}

export const tailLength = (s: CompaniesState) => s.tailCount - s.tailRemoved.length;
export const virtualTotal = (s: CompaniesState) => s.real.length + tailLength(s);

/** Tail position t (after removals) → the generator's tail index. */
function tailIndex(s: CompaniesState, t: number): number {
  let k = t;
  for (const r of s.tailRemoved) {
    if (r <= k) k += 1;
    else break;
  }
  return k;
}

const TAIL_ID = /^tail-(\d+)$/;

export function tailRow(s: CompaniesState, t: number): Company {
  const k = tailIndex(s, t);
  return s.tailEdits[k] ?? { ...makeCompany(REAL_COUNT + k), id: `tail-${k}` };
}

export function addCompany(c: Company) {
  setState({ ...state, real: [c, ...state.real] });
}

export function addCompanies(cs: Company[]) {
  setState({ ...state, real: [...cs, ...state.real] });
}

export function updateCompany(c: Company) {
  const m = c.id.match(TAIL_ID);
  if (m) {
    setState({ ...state, tailEdits: { ...state.tailEdits, [Number(m[1])]: c } });
    return;
  }
  setState({ ...state, real: state.real.map((r) => (r.id === c.id ? c : r)) });
}

export function removeCompanies(ids: Set<string>) {
  const removed = [...state.tailRemoved];
  ids.forEach((id) => {
    const m = id.match(TAIL_ID);
    if (m && !removed.includes(Number(m[1]))) removed.push(Number(m[1]));
  });
  removed.sort((a, b) => a - b);
  setState({
    ...state,
    real: state.real.filter((r) => !ids.has(r.id)),
    tailRemoved: removed,
  });
}

/** "Select all" then Delete on the unfiltered list: the whole account. */
export function removeAllCompanies() {
  setState({ real: [], tailCount: 0, tailRemoved: [], tailEdits: {} });
}

let idCounter = 0;
export function newCompanyId() {
  idCounter += 1;
  return `co-new-${Date.now()}-${idCounter}`;
}

/* ─── Filter + sort ─────────────────────────────────────────────────────── */

function fieldValue(c: Company, field: ColumnId): string | number {
  switch (field) {
    case "contacts":
    case "created":
    case "updated":
      return c[field];
    case "createdBy":
      return c.createdBy.kind === "system" ? "System" : c.createdBy.name;
    default:
      return (c[field] as string | undefined) ?? "";
  }
}

function matches(c: Company, f: CompanyFilter): boolean {
  const def = columnDef(f.field);
  const raw = fieldValue(c, f.field);
  if (def.kind === "number") {
    const n = Number(f.value);
    if (f.value === "" || Number.isNaN(n)) return true;
    const v = raw as number;
    return f.operator === "Greater than" ? v > n : f.operator === "Less than" ? v < n : v === n;
  }
  if (def.kind === "date") {
    if (!f.value) return true;
    const d = new Date(`${f.value}T00:00:00`).getTime();
    return f.operator === "Is before" ? (raw as number) < d : (raw as number) >= d + 86_400_000;
  }
  const v = String(raw).toLowerCase();
  const q = f.value.trim().toLowerCase();
  switch (f.operator) {
    case "Is empty":
      return v === "";
    case "Is not empty":
      return v !== "";
    case "Is not":
      return q === "" || v !== q;
    case "Contains":
      return v.includes(q);
    case "Does not contain":
      return q === "" || !v.includes(q);
    default:
      return q === "" || v === q;
  }
}

export function applyFilters(rows: Company[], filters: CompanyFilter[]): Company[] {
  if (filters.length === 0) return rows;
  return rows.filter((c) => filters.every((f) => matches(c, f)));
}

export function applySearch(rows: Company[], query: string): Company[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((c) =>
    [c.name, c.email, c.website, c.city].some((v) => v?.toLowerCase().includes(q)),
  );
}

export function sortCompanies(rows: Company[], sort: CompanySort | null): Company[] {
  if (!sort) return rows;
  const sign = sort.dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const ka = fieldValue(a, sort.field);
    const kb = fieldValue(b, sort.field);
    // Blanks sink to the end whichever way the column is sorted.
    if (ka === "" && kb !== "") return 1;
    if (kb === "" && ka !== "") return -1;
    if (typeof ka === "number" && typeof kb === "number") return (ka - kb) * sign;
    return String(ka).localeCompare(String(kb), "en", { sensitivity: "base" }) * sign;
  });
}

/* ─── Saved lists ───────────────────────────────────────────────────────── */

export interface CompanyList {
  id: string;
  label: string;
  filters: CompanyFilter[];
  sort: CompanySort | null;
  columns: ColumnState[];
}

const DEFAULT_SORT: CompanySort = { field: "created", dir: "desc" };

let lists: CompanyList[] = [
  { id: "all", label: "All", filters: [], sort: DEFAULT_SORT, columns: DEFAULT_COLUMNS },
  {
    id: "key",
    label: "Key accounts",
    filters: [{ id: "f-key", field: "contacts", operator: "Greater than", value: "40" }],
    sort: { field: "contacts", dir: "desc" },
    columns: DEFAULT_COLUMNS,
  },
  {
    id: "suppliers",
    label: "Suppliers",
    filters: [{ id: "f-sup", field: "type", operator: "Is", value: "Supplier" }],
    sort: DEFAULT_SORT,
    columns: DEFAULT_COLUMNS,
  },
  {
    id: "subs",
    label: "Subcontractors",
    filters: [{ id: "f-sub", field: "type", operator: "Is", value: "Subcontractor" }],
    sort: DEFAULT_SORT,
    columns: DEFAULT_COLUMNS,
  },
];

const listListeners = new Set<() => void>();
function setLists(next: CompanyList[]) {
  lists = next;
  listListeners.forEach((l) => l());
}
function subscribeLists(l: () => void) {
  listListeners.add(l);
  return () => listListeners.delete(l);
}

export function useCompanyLists(): CompanyList[] {
  return React.useSyncExternalStore(subscribeLists, () => lists, () => lists);
}

let listCounter = 0;
export function createList(list: Omit<CompanyList, "id">): CompanyList {
  listCounter += 1;
  const made = { ...list, id: `list-${Date.now()}-${listCounter}` };
  setLists([...lists, made]);
  return made;
}

export function saveList(id: string, patch: Partial<Omit<CompanyList, "id">>) {
  setLists(lists.map((l) => (l.id === id ? { ...l, ...patch } : l)));
}

export function deleteList(id: string) {
  if (id === "all") return;
  setLists(lists.filter((l) => l.id !== id));
}

let filterCounter = 0;
export function newFilterId() {
  filterCounter += 1;
  return `f-${Date.now()}-${filterCounter}`;
}

/* ─── Phone countries ───────────────────────────────────────────────────── */

export const PHONE_COUNTRIES = [
  { code: "US", name: "United States", flag: "🇺🇸", dial: "+1", placeholder: "(201) 555-0123" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", dial: "+44", placeholder: "07400 123456" },
  { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬", dial: "+1", placeholder: "(268) 722-1234" },
  { code: "CA", name: "Canada", flag: "🇨🇦", dial: "+1", placeholder: "(506) 234-5678" },
  { code: "AU", name: "Australia", flag: "🇦🇺", dial: "+61", placeholder: "0412 345 678" },
  { code: "IN", name: "India", flag: "🇮🇳", dial: "+91", placeholder: "081234 56789" },
  { code: "DE", name: "Germany", flag: "🇩🇪", dial: "+49", placeholder: "01512 3456789" },
  { code: "IE", name: "Ireland", flag: "🇮🇪", dial: "+353", placeholder: "085 012 3456" },
];

export const phoneCountry = (code: string | undefined) =>
  PHONE_COUNTRIES.find((c) => c.code === code) ?? PHONE_COUNTRIES[0];
