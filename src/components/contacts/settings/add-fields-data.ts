"use client";

import * as React from "react";

/**
 * The add-contact form as live state — which fields it asks for, in what
 * order, and which of them it insists on.
 *
 * A module store like object-settings-store, so the saved form survives a
 * trip to another tab and back. Only the SAVED form lives here: the tab keeps
 * its own draft and commits it with Save, which is what lets Cancel mean
 * something.
 */

export type FieldKind =
  | "text"
  | "large-text"
  | "email"
  | "phone"
  | "number"
  | "date"
  | "single"
  | "multi"
  | "checkbox"
  | "url"
  | "dnd";

export const KIND_LABEL: Record<FieldKind, string> = {
  text: "Text",
  "large-text": "Large text",
  email: "Email",
  phone: "Phone",
  number: "Number",
  date: "Date",
  single: "Single options",
  multi: "Multiple options",
  checkbox: "Checkbox",
  url: "URL",
  dnd: "DND channels",
};

export interface FieldDef {
  id: string;
  label: string;
  kind: FieldKind;
  /** Which Manage fields folder lists it. Core fields are listed in General Info. */
  folder: "general" | "additional" | null;
  /** On every form, required, and not movable out of it — First name. */
  locked?: boolean;
  /** The required box doesn't apply — DND is a preference, not an answer. */
  noRequired?: boolean;
  /** Options for a single-options field, drawn in the preview. */
  options?: string[];
}

/** One row of the form: a field and whether it must be filled in. */
export interface FormField {
  id: string;
  required: boolean;
}

export const FIELD_CATALOG: FieldDef[] = [
  { id: "first-name", label: "First name", kind: "text", folder: null, locked: true },
  { id: "last-name", label: "Last name", kind: "text", folder: "general" },
  { id: "email", label: "Email", kind: "email", folder: "general" },
  { id: "phone", label: "Phone", kind: "phone", folder: "general" },
  {
    id: "contact-type",
    label: "Contact type",
    kind: "single",
    folder: "general",
    options: ["Lead", "Customer"],
  },
  {
    id: "time-zone",
    label: "Time zone",
    kind: "single",
    folder: "general",
    options: [
      "(GMT-10:00) Hawaii",
      "(GMT-08:00) Pacific Time (US & Canada)",
      "(GMT-07:00) Mountain Time (US & Canada)",
      "(GMT-06:00) Central Time (US & Canada)",
      "(GMT-05:00) Eastern Time (US & Canada)",
      "(GMT+00:00) London",
      "(GMT+01:00) Berlin",
      "(GMT+05:30) India Standard Time",
      "(GMT+10:00) Sydney",
    ],
  },
  { id: "dnd", label: "DnD channels", kind: "dnd", folder: "general", noRequired: true },

  // General Info, in the order the live folder lists them.
  { id: "street", label: "Street address", kind: "text", folder: "general" },
  { id: "business", label: "Business name", kind: "text", folder: "general" },
  { id: "city", label: "City", kind: "text", folder: "general" },
  { id: "country", label: "Country", kind: "single", folder: "general" },
  { id: "state", label: "State", kind: "text", folder: "general" },
  { id: "postal", label: "Postal code", kind: "text", folder: "general" },
  { id: "website", label: "Website", kind: "url", folder: "general" },
  { id: "wl-app", label: "Do you have WL mobile app", kind: "single", folder: "general" },
  { id: "wl-beta", label: "WL mobile app customiser beta", kind: "checkbox", folder: "general" },
  { id: "app-name", label: "App name", kind: "text", folder: "general" },
  { id: "has-app", label: "Do you have mobile app?", kind: "single", folder: "general" },
  { id: "designation", label: "Designation", kind: "text", folder: "general" },
  { id: "github-email", label: "GitHub user email", kind: "email", folder: "general" },
  { id: "button-group", label: "Button group", kind: "single", folder: "general" },
  { id: "www", label: "www", kind: "url", folder: "general" },
  { id: "dob", label: "Date of birth", kind: "date", folder: "general" },
  { id: "source", label: "Source", kind: "text", folder: "general" },
  { id: "company-size", label: "Company size", kind: "single", folder: "general" },
  { id: "industry", label: "Industry", kind: "single", folder: "general" },
  { id: "job-title", label: "Job title", kind: "text", folder: "general" },
  { id: "linkedin", label: "LinkedIn URL", kind: "url", folder: "general" },
  { id: "secondary-phone", label: "Secondary phone", kind: "phone", folder: "general" },
  { id: "preferred-language", label: "Preferred language", kind: "single", folder: "general" },
  { id: "anniversary", label: "Anniversary", kind: "date", folder: "general" },
  { id: "notes", label: "Notes", kind: "large-text", folder: "general" },

  // Additional info.
  { id: "lead-score", label: "Lead score", kind: "number", folder: "additional" },
  { id: "budget", label: "Budget", kind: "number", folder: "additional" },
  { id: "referral", label: "Referred by", kind: "text", folder: "additional" },
  { id: "interests", label: "Interests", kind: "multi", folder: "additional" },
  { id: "service-needed", label: "Service needed", kind: "single", folder: "additional" },
  { id: "hear-about", label: "How did you hear about us?", kind: "text", folder: "additional" },
  { id: "newsletter", label: "Newsletter opt-in", kind: "checkbox", folder: "additional" },
  { id: "renewal-date", label: "Renewal date", kind: "date", folder: "additional" },
];

const BY_ID = new Map(FIELD_CATALOG.map((f) => [f.id, f]));
export const fieldDef = (id: string) => BY_ID.get(id);

export const FIELD_FOLDERS = [
  { id: "general" as const, label: "General Info" },
  { id: "additional" as const, label: "Additional info" },
];

export const DEFAULT_FORM: FormField[] = [
  { id: "first-name", required: true },
  { id: "last-name", required: false },
  { id: "email", required: false },
  { id: "phone", required: false },
  { id: "contact-type", required: false },
  { id: "time-zone", required: false },
  { id: "dnd", required: false },
];

export const sameForm = (a: FormField[], b: FormField[]) =>
  a.length === b.length &&
  a.every((f, i) => f.id === b[i].id && f.required === b[i].required);

/** Moves the item at `from` to `to`, the way a drop reads. */
export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0) return list;
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/* ─── Store ─────────────────────────────────────────────────────────────── */

let saved: FormField[] = DEFAULT_FORM;
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSavedForm = () =>
  React.useSyncExternalStore(subscribe, () => saved, () => saved);

export function saveForm(next: FormField[]) {
  saved = next;
  listeners.forEach((l) => l());
}
