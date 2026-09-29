"use client";

import * as React from "react";
import type { AvatarTone, Contact } from "./contacts-data";

/**
 * Contacts that have been deleted and can still be restored.
 *
 * A module store, like contacts-jobs, so a delete made on the list is waiting
 * on Restore contacts after the page unmounts — and so a restore can hand the
 * full Contact back to whoever owns the live list, rather than a row that only
 * knows its name.
 */
export interface DeletedContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  deletedOn: number;
  tone: AvatarTone;
  contact: Contact;
}

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

type Seed = [name: string, email: string | null, phone: string | null, deleted: string];

/** The live account's trash, as screenshotted — oldest deletion first. */
const SEED: Seed[] = [
  ["Mayur Is Testing", "mayurmack09@gmail.com", "+91 12345 67890", "2026-08-06T22:38:00"],
  ["Guest Visitor nnpht", null, null, "2026-08-07T11:02:00"],
  ["Guest Visitor awfcd", null, null, "2026-08-07T11:04:00"],
  ["vishnupriya", "vishnupriya@gohighlevel.com", "+91 70340 60134", "2026-08-11T15:21:00"],
  ["vishnupriya", "vishnupriya@gohighlevel.com", "+91 70340 60134", "2026-08-11T15:22:00"],
  ["vishnupriya", null, "+91 70340 60134", "2026-08-11T15:24:00"],
  ["vishnupriya poduval", "vishnupriya.p@gohighlevel.com", "+91 70340 60134", "2026-08-12T10:47:00"],
  ["Meghana M", "meghana.m@gohighlevel.com", "+91 98450 21736", "2026-08-14T13:09:00"],
  ["Meghana M", "meghana.m@gohighlevel.com", null, "2026-08-14T13:10:00"],
  ["Maruthi L", "maruthi.l@gohighlevel.com", "+91 99001 45823", "2026-08-18T17:33:00"],
  ["Sugandha", "sugandha@gohighlevel.com", "+91 88611 30492", "2026-08-20T09:15:00"],
  ["Koushik K", "koushik.k@gohighlevel.com", "+91 97411 58260", "2026-08-22T16:40:00"],
  ["Guest Visitor qkzre", null, null, "2026-08-25T08:12:00"],
  ["Abhilasha Rathore", "abhilasha@gohighlevel.com", "+91 90087 11294", "2026-08-27T14:56:00"],
  ["Test Contact", "test.contact@example.com", "+1 (415) 555-0132", "2026-08-29T19:03:00"],
  ["Pratik Zinjurde", "pratik.z@gohighlevel.com", "+91 95035 77618", "2026-09-01T11:28:00"],
  ["Ronak Jindal", null, "+91 98183 40277", "2026-09-03T20:44:00"],
  ["Emma Jackson", "emma.jackson@example.com", "+1 (646) 555-0187", "2026-09-05T02:17:00"],
  ["Guest Visitor mbtyx", null, null, "2026-09-08T12:30:00"],
  ["Umar Ranginwala", "umar.r@gohighlevel.com", "+91 91234 88520", "2026-09-10T18:05:00"],
];

function handleFor(name: string, email: string | null): string {
  const base = email ? email.split("@")[0] : name.toLowerCase().replace(/\s+/g, "");
  return `@${base}`;
}

function build(name: string, email: string | null, phone: string | null, deletedOn: number, tone: AvatarTone, id: string): DeletedContact {
  return {
    id,
    name,
    email,
    phone,
    deletedOn,
    tone,
    contact: {
      id,
      name,
      handle: handleFor(name, email),
      email,
      created: "Aug 1, 2026",
      lastActivity: "1 month ago",
      status: "inquiry",
      tone,
    },
  };
}

let deleted: DeletedContact[] = SEED.map(([name, email, phone, at], i) =>
  build(name, email, phone, new Date(at).getTime(), TONES[i % TONES.length], `deleted-${i}`),
);

const listeners = new Set<() => void>();
function set(next: DeletedContact[]) {
  deleted = next;
  listeners.forEach((l) => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Oldest deletion first, which is the order the live list shows. */
export function useDeletedContacts(): DeletedContact[] {
  return React.useSyncExternalStore(subscribe, () => deleted, () => deleted);
}

/**
 * Moves contacts into the trash. The Contact itself is kept whole — including
 * its original id — so a restore puts back exactly the row that left.
 */
export function trashContacts(contacts: Contact[]) {
  const now = Date.now();
  const ids = new Set(contacts.map((c) => c.id));
  const added = contacts.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: null,
    deletedOn: now,
    tone: c.tone,
    contact: { ...c, selected: false },
  }));
  set([...deleted.filter((d) => !ids.has(d.id)), ...added]);
}

/** Removes these from the trash and returns their Contacts, in list order. */
export function takeDeleted(ids: string[]): Contact[] {
  const wanted = new Set(ids);
  const taken = deleted.filter((d) => wanted.has(d.id));
  if (taken.length === 0) return [];
  set(deleted.filter((d) => !wanted.has(d.id)));
  return taken.map((d) => d.contact);
}

const DATE = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const TIME = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

/** "Aug 6, 2026, 10:38 PM". */
export function formatDeletedOn(ms: number): string {
  const d = new Date(ms);
  return `${DATE.format(d)}, ${TIME.format(d)}`;
}
