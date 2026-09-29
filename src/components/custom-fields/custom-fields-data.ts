"use client";

import * as React from "react";
import {
  Boxes,
  Building2,
  Contact,
  Home,
  Layers,
  Package,
  Scissors,
  SquareCheckBig,
  Store,
  Target,
  type LucideIcon,
} from "lucide-react";

/**
 * CRM ▸ Custom fields as live state: the objects, their folders and fields.
 *
 * One module store, like the contact settings, so the Fields table, the
 * Folders table and the create/edit drawer all read and write the same rows
 * and every count on the page — the object cards, the Fields/Folders tabs,
 * a folder's "Number of fields" — is derived rather than stored.
 */

/* ─── Objects ───────────────────────────────────────────────────────────── */

export type ObjectId =
  | "contact"
  | "opportunity"
  | "business"
  | "task"
  | "property"
  | "product"
  | "barber"
  | "barber-supply";

export interface CrmObject {
  id: ObjectId;
  label: string;
  /** The key prefix: {{contact.url}}, {{opportunity.deal_size}}. */
  keyPrefix: string;
  icon: LucideIcon;
  /** Custom objects are the tenant's own; standard ones ship with the CRM. */
  custom: boolean;
}

export const OBJECTS: CrmObject[] = [
  { id: "contact", label: "Contact", keyPrefix: "contact", icon: Contact, custom: false },
  { id: "opportunity", label: "Opportunity", keyPrefix: "opportunity", icon: Target, custom: false },
  { id: "business", label: "Business", keyPrefix: "business", icon: Building2, custom: false },
  { id: "task", label: "Task", keyPrefix: "task", icon: SquareCheckBig, custom: false },
  { id: "property", label: "Property", keyPrefix: "custom_objects.property", icon: Home, custom: true },
  { id: "product", label: "Product", keyPrefix: "custom_objects.product", icon: Package, custom: true },
  { id: "barber", label: "Barber", keyPrefix: "custom_objects.barber", icon: Scissors, custom: true },
  { id: "barber-supply", label: "Barber Supply", keyPrefix: "custom_objects.barber_supply", icon: Store, custom: true },
];

/** The "All" card's glyph, beside the eight object glyphs above. */
export const ALL_ICON: LucideIcon = Layers;
export const CUSTOM_OBJECT_ICON: LucideIcon = Boxes;

export const objectById = (id: ObjectId) => OBJECTS.find((o) => o.id === id)!;

/* ─── Field types ───────────────────────────────────────────────────────── */

export type FieldType =
  | "single-line"
  | "multi-line"
  | "text-box-list"
  | "number"
  | "phone"
  | "monetary"
  | "dropdown-single"
  | "dropdown-multiple"
  | "radio"
  | "checkbox"
  | "date"
  | "file-upload"
  | "signature"
  | "email";

export const FIELD_TYPES: { id: FieldType; label: string; hint: string }[] = [
  { id: "single-line", label: "Single line", hint: "Capture short text inputs like names or titles" },
  { id: "multi-line", label: "Multi line", hint: "Collect longer text responses such as notes or addresses" },
  { id: "text-box-list", label: "Text box list", hint: "Capture several short answers under one label" },
  { id: "number", label: "Number", hint: "Store whole or decimal numbers" },
  { id: "phone", label: "Phone", hint: "Store a phone number with its country code" },
  { id: "monetary", label: "Monetary", hint: "Store an amount in the account currency" },
  { id: "dropdown-single", label: "Dropdown (single)", hint: "Pick one option from a list" },
  { id: "dropdown-multiple", label: "Dropdown (multiple)", hint: "Pick any number of options from a list" },
  { id: "radio", label: "Radio select", hint: "Pick one option, with every option visible" },
  { id: "checkbox", label: "Checkbox", hint: "Tick any number of options" },
  { id: "date", label: "Date picker", hint: "Store a calendar date" },
  { id: "file-upload", label: "File upload", hint: "Attach documents or images to a record" },
  { id: "signature", label: "Signature", hint: "Capture a drawn signature" },
  { id: "email", label: "Email", hint: "Store a validated email address" },
];

export const fieldTypeLabel = (t: FieldType) =>
  FIELD_TYPES.find((f) => f.id === t)?.label ?? t;

/** Types whose value is picked from a list, so the drawer asks for options. */
export const HAS_OPTIONS: FieldType[] = ["dropdown-single", "dropdown-multiple", "radio", "checkbox"];

/* ─── Rows ──────────────────────────────────────────────────────────────── */

export interface CustomFolder {
  id: string;
  name: string;
  object: ObjectId;
  /** System folders (Contact, General Info…) cannot be renamed or deleted. */
  system: boolean;
  /** ISO timestamp. */
  createdAt: string;
}

export interface CustomField {
  id: string;
  name: string;
  type: FieldType;
  object: ObjectId;
  folderId: string;
  /** The part after the object prefix — "url" in {{contact.url}}. */
  key: string;
  description: string;
  placeholder: string;
  options: string[];
  /** "custom" fields were made here; "standard" ship with the object. */
  source: "custom" | "standard";
  createdAt: string;
}

export const slugKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);

export const fullKey = (f: Pick<CustomField, "object" | "key">) =>
  `{{${objectById(f.object).keyPrefix}.${f.key}}}`;

/** "Sep 25, 2026 01:23 PM" — the live table's exact shape, zero-padded. */
export function formatCreated(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date} ${time}`;
}

/* ─── Seed ──────────────────────────────────────────────────────────────── */

const SYSTEM_FOLDERS: [string, string, ObjectId, string][] = [
  ["contact", "Contact", "contact", "2022-09-08T19:06:00"],
  ["general-info", "General Info", "contact", "2022-09-08T19:06:00"],
  ["additional-info", "Additional Info", "contact", "2022-09-08T19:06:00"],
  ["opportunity-details", "Opportunity Details", "opportunity", "2023-06-22T13:40:00"],
  ["company-info", "Company Info", "business", "2024-12-17T18:59:00"],
];

const CUSTOM_FOLDERS: [string, ObjectId, string][] = [
  ["SaaS FastTrack", "contact", "2022-11-27T11:32:00"],
  ["Barber Info", "barber", "2026-03-11T16:16:00"],
  ["Barber Supply Info", "barber-supply", "2026-03-11T16:16:00"],
  ["Product Info", "product", "2026-02-10T12:43:00"],
  ["Property Info", "property", "2024-11-20T21:35:00"],
  ["CP Beta", "contact", "2024-07-09T14:33:00"],
  ["Folder for test", "contact", "2024-08-08T13:59:00"],
  ["Form | Form 93", "contact", "2024-10-18T13:08:00"],
  ["Survey | Survey 21", "contact", "2024-11-14T23:47:00"],
  ["Form | Form 115", "contact", "2025-01-23T16:41:00"],
  ["Quiz | Quiz 2", "contact", "2025-01-23T14:36:00"],
  ["Form | Workflow maps", "contact", "2026-09-25T11:20:00"],
  ["Form | Apps Interview – No Time", "contact", "2026-09-25T12:58:00"],
  ["Form | Apps Interview – Booking", "contact", "2026-09-25T12:50:00"],
  ["Survey | Survey 34", "contact", "2026-08-24T16:10:00"],
  ["Form | forms via flows WA", "contact", "2026-08-14T16:20:00"],
];

function seedFolders(): CustomFolder[] {
  const out: CustomFolder[] = SYSTEM_FOLDERS.map(([id, name, object, createdAt]) => ({
    id, name, object, system: true, createdAt,
  }));
  CUSTOM_FOLDERS.forEach(([name, object, createdAt]) =>
    out.push({ id: `f-${slugKey(name)}`, name, object, system: false, createdAt }),
  );
  // The account has 97 folders; the rest are form and survey folders.
  let n = 0;
  while (out.length < 97) {
    n += 1;
    const kind = n % 3 === 0 ? "Survey" : n % 3 === 1 ? "Form" : "Quiz";
    const d = new Date(Date.UTC(2023, 0, 1) + n * 6.5 * 86400000);
    out.push({
      id: `f-gen-${n}`,
      name: `${kind} | ${kind} ${100 + n}`,
      object: "contact",
      system: false,
      createdAt: d.toISOString().slice(0, 19),
    });
  }
  return out;
}

/** The first rows of the live table, verbatim — the rest are generated. */
const HEAD_FIELDS: [string, FieldType, string, string][] = [
  ["URL", "single-line", "f-form_workflow_maps", "2026-09-25T13:23:00"],
  ["What did you last have to build a webhook, custom code step, or external tool for?", "multi-line", "f-form_apps_interview_no_time", "2026-09-25T13:00:00"],
  ["Is there an app you tried and stopped using? What made you stop?", "multi-line", "f-form_apps_interview_no_time", "2026-09-25T13:00:00"],
  ["cohort", "single-line", "f-form_apps_interview_booking", "2026-09-25T12:54:00"],
  ["What's one thing you had to build a workaround for?", "multi-line", "f-form_apps_interview_booking", "2026-09-25T12:54:00"],
  ["Video recording (optional)", "single-line", "f-form_workflow_maps", "2026-09-25T11:28:00"],
  ["Feedback Type", "dropdown-single", "f-form_workflow_maps", "2026-09-25T11:25:00"],
  ["Screenshot (optional)", "file-upload", "f-form_workflow_maps", "2026-09-25T11:25:00"],
  ["Can we contact you about this?", "radio", "f-form_workflow_maps", "2026-09-25T11:25:00"],
  ["website url", "single-line", "contact", "2026-09-08T12:40:00"],
  ["Rating rat584 5yje", "number", "f-survey_survey_34", "2026-08-24T16:12:00"],
  ["Signature 11rj4", "signature", "f-form_forms_via_flows_wa", "2026-08-14T16:25:00"],
  ["Score 46qa", "number", "f-form_forms_via_flows_wa", "2026-08-14T16:25:00"],
  ["Multi Dropdown 33xyj", "dropdown-multiple", "f-form_forms_via_flows_wa", "2026-08-14T16:23:00"],
  ["Single Dropdown 528rj", "dropdown-single", "f-form_forms_via_flows_wa", "2026-08-14T16:23:00"],
  ["Monetary 6goq", "monetary", "f-form_forms_via_flows_wa", "2026-08-14T16:22:00"],
];

const NOUNS = [
  "Lead source", "Budget", "Preferred time", "Company size", "Industry", "Referral code",
  "Anniversary", "Membership tier", "Last purchase", "Notes", "Plan", "Region",
  "Account manager", "Renewal date", "Discount", "Interest", "Goal", "Team size",
  "Website", "Instagram", "LinkedIn", "Timezone", "Language", "Birthday",
];
const TYPE_CYCLE: FieldType[] = [
  "single-line", "multi-line", "number", "dropdown-single", "date", "checkbox",
  "radio", "monetary", "phone", "email", "dropdown-multiple", "text-box-list",
  "file-upload", "signature",
];
const OBJECT_COUNTS: [ObjectId, number, string][] = [
  ["opportunity", 12, "opportunity-details"],
  ["business", 11, "company-info"],
  ["property", 3, "f-property_info"],
  ["product", 1, "f-product_info"],
  ["barber", 1, "f-barber_info"],
  ["barber-supply", 1, "f-barber_supply_info"],
];

function seedFields(folders: CustomFolder[]): CustomField[] {
  const out: CustomField[] = [];
  const base = (name: string, type: FieldType, object: ObjectId, folderId: string, createdAt: string, i: number): CustomField => ({
    id: `cf-${i}`,
    name,
    type,
    object,
    folderId,
    key: slugKey(name),
    description: "",
    placeholder: "",
    options: HAS_OPTIONS.includes(type) ? ["Yes", "No", "Maybe"] : [],
    source: folderId === "contact" || folderId === "general-info" ? "standard" : "custom",
    createdAt,
  });
  HEAD_FIELDS.forEach(([name, type, folderId, at], i) =>
    out.push(base(name, type, "contact", folderId, at, out.length + i * 0)),
  );
  const contactFolders = folders.filter((f) => f.object === "contact").map((f) => f.id);
  let t = Date.UTC(2026, 7, 14, 10, 0);
  let i = 0;
  while (out.filter((f) => f.object === "contact").length < 565) {
    i += 1;
    t -= 37 * 3600 * 1000 + (i % 7) * 600000;
    const noun = NOUNS[i % NOUNS.length];
    const suffix = (i * 7919).toString(36).slice(-4);
    out.push(base(`${noun} ${suffix}`, TYPE_CYCLE[i % TYPE_CYCLE.length], "contact",
      contactFolders[i % contactFolders.length], new Date(t).toISOString().slice(0, 19), out.length));
  }
  OBJECT_COUNTS.forEach(([object, count, folderId]) => {
    for (let k = 0; k < count; k++) {
      i += 1;
      t -= 11 * 3600 * 1000;
      const noun = NOUNS[(i * 5) % NOUNS.length];
      out.push(base(k === 0 ? `${objectById(object).label} ${noun.toLowerCase()}` : `${noun} ${k + 1}`,
        TYPE_CYCLE[i % TYPE_CYCLE.length], object, folderId, new Date(t).toISOString().slice(0, 19), out.length));
    }
  });
  return out;
}

/* ─── Store ─────────────────────────────────────────────────────────────── */

interface State {
  folders: CustomFolder[];
  fields: CustomField[];
  /** Per-object searchable and unique field ids (the kebab's two modals). */
  searchable: Partial<Record<ObjectId, string[]>>;
  unique: Partial<Record<ObjectId, string[]>>;
}

const initialFolders = seedFolders();
let state: State = {
  folders: initialFolders,
  fields: seedFields(initialFolders),
  searchable: {},
  unique: {},
};
const listeners = new Set<() => void>();
const set = (next: Partial<State>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useCustomFields(): State {
  return React.useSyncExternalStore(subscribe, () => state, () => state);
}

const now = () => new Date().toISOString().slice(0, 19);
let seq = 0;
const nextId = (p: string) => `${p}-${Date.now().toString(36)}-${(seq += 1)}`;

export function addField(input: Omit<CustomField, "id" | "createdAt" | "source">): CustomField {
  const field: CustomField = { ...input, id: nextId("cf"), source: "custom", createdAt: now() };
  set({ fields: [field, ...state.fields] });
  return field;
}

export function updateField(id: string, patch: Partial<CustomField>) {
  set({ fields: state.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
}

export function deleteFields(ids: string[]) {
  set({ fields: state.fields.filter((f) => !ids.includes(f.id)) });
}

export function moveFields(ids: string[], folderId: string) {
  set({ fields: state.fields.map((f) => (ids.includes(f.id) ? { ...f, folderId } : f)) });
}

export function addFolder(name: string, object: ObjectId): CustomFolder {
  const folder: CustomFolder = { id: nextId("f"), name, object, system: false, createdAt: now() };
  set({ folders: [...state.folders, folder] });
  return folder;
}

export function renameFolder(id: string, name: string) {
  set({ folders: state.folders.map((f) => (f.id === id ? { ...f, name } : f)) });
}

/**
 * Deleting a folder does not delete its fields — they fall back to the
 * object's first system folder, the way the product keeps data it cannot
 * afford to lose silently.
 */
export function deleteFolder(id: string) {
  const folder = state.folders.find((f) => f.id === id);
  if (!folder || folder.system) return;
  const home =
    state.folders.find((f) => f.object === folder.object && f.system && f.id !== id) ??
    state.folders.find((f) => f.object === folder.object && f.id !== id);
  set({
    folders: state.folders.filter((f) => f.id !== id),
    fields: home ? state.fields.map((f) => (f.folderId === id ? { ...f, folderId: home.id } : f)) : state.fields,
  });
}

export function setSearchable(object: ObjectId, ids: string[]) {
  set({ searchable: { ...state.searchable, [object]: ids } });
}

export function setUnique(object: ObjectId, ids: string[]) {
  set({ unique: { ...state.unique, [object]: ids } });
}

export const folderById = (folders: CustomFolder[], id: string) => folders.find((f) => f.id === id);
