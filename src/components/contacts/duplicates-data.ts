"use client";

import * as React from "react";
import type { AvatarTone } from "./contacts-data";

/**
 * The duplicate groups Manage duplicates lists, one set per matching rule.
 *
 * A module store, like contacts-jobs, so a merge survives leaving the screen:
 * a group you merged coming back because you glanced at another product would
 * make the merge look like it never happened.
 */

export type DuplicateRule = "email" | "phone" | "name";

export const RULE_LABELS: Record<DuplicateRule, string> = {
  email: "Email",
  phone: "Phone",
  name: "Name",
};

export interface DuplicateRecord {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created: number;
  lastActivity: string;
  tags: string[];
  tone: AvatarTone;
}

export interface DuplicateGroup {
  id: string;
  /** The value the records share — the group card's heading. */
  value: string;
  records: DuplicateRecord[];
}

const at = (iso: string) => new Date(iso).getTime();

type Row = [
  name: string,
  email: string | null,
  phone: string | null,
  created: string,
  lastActivity: string,
  tags: string[],
  tone: AvatarTone,
];

function group(rule: DuplicateRule, i: number, value: string, rows: Row[]): DuplicateGroup {
  return {
    id: `${rule}-${i}`,
    value,
    records: rows.map(([name, email, phone, created, lastActivity, tags, tone], j) => ({
      id: `${rule}-${i}-${j}`,
      name,
      email,
      phone,
      created: at(created),
      lastActivity,
      tags,
      tone,
    })),
  };
}

const SEED: Record<DuplicateRule, DuplicateGroup[]> = {
  name: [
    group("name", 0, "Jared Schoolcraft", [
      ["Jared Schoolcraft", "jared@schoolcraftfit.com", "+1 (512) 555-0182", "2026-03-14T10:12:00", "2 days ago", ["gym owner"], "blue"],
      ["Jared Schoolcraft", "jschoolcraft@gmail.com", null, "2026-08-02T16:40:00", "3 weeks ago", ["webinar"], "blue"],
    ]),
    group("name", 1, "vishnupriya", [
      ["vishnupriya", "vishnupriya@gohighlevel.com", "+91 94470 21108", "2026-01-09T09:05:00", "Yesterday", ["internal", "qa"], "orange"],
      ["vishnupriya", null, "+91 94470 21108", "2026-05-21T11:30:00", "1 month ago", [], "orange"],
      ["vishnupriya", "vishnu.p@outlook.com", null, "2026-09-25T16:07:00", "4 days ago", ["whatsapp"], "orange"],
    ]),
    group("name", 2, "Meghana M", [
      ["Meghana M", "meghana.m@gohighlevel.com", "+91 98450 33271", "2026-02-18T14:22:00", "Today", ["internal"], "pink"],
      ["Meghana M", "meghana.m+test@gohighlevel.com", null, "2026-07-30T08:48:00", "2 weeks ago", ["qa"], "pink"],
    ]),
    group("name", 3, "Guest Visitor", [
      ["Guest Visitor", null, null, "2026-06-11T19:02:00", "3 months ago", ["chat widget"], "teal"],
      ["Guest Visitor", null, null, "2026-09-20T21:15:00", "9 days ago", ["chat widget"], "teal"],
    ]),
    group("name", 4, "Andrew McEwan", [
      ["Andrew McEwan", "andrew@mcewanroofing.com", "+1 (416) 555-0119", "2025-11-03T13:00:00", "1 week ago", ["lead", "roofing"], "green"],
      ["Andrew McEwan", "a.mcewan@gmail.com", "+1 (416) 555-0119", "2026-04-17T10:44:00", "5 months ago", [], "green"],
    ]),
    group("name", 5, "Priya Raman", [
      ["Priya Raman", "priya@ramanstudio.in", null, "2026-02-02T12:10:00", "Yesterday", ["beauty & fashion"], "purple"],
      ["Priya Raman", null, "+91 99001 45520", "2026-06-29T17:35:00", "2 months ago", ["form submission"], "purple"],
      ["Priya Raman", "priya.raman@yahoo.com", "+91 99001 45520", "2026-09-12T04:18:00", "2 weeks ago", ["import"], "purple"],
    ]),
    group("name", 6, "Hugo Lam", [
      ["Hugo Lam", "hugo@lamdental.com", "+1 (604) 555-0147", "2026-05-05T09:20:00", "3 days ago", ["dental"], "yellow"],
      ["Hugo Lam", "hugo.lam@icloud.com", null, "2026-08-19T15:55:00", "1 month ago", [], "yellow"],
    ]),
    group("name", 7, "Annie Martin", [
      ["Annie Martin", "annie@martinevents.co", null, "2026-04-01T11:11:00", "6 days ago", ["events", "vip"], "pink"],
      ["Annie Martin", "annie.martin@gmail.com", "+1 (305) 555-0166", "2026-09-01T18:26:00", "2 weeks ago", ["webinar"], "pink"],
    ]),
  ],
  email: [
    group("email", 0, "meghana.m@gohighlevel.com", [
      ["Meghana M", "meghana.m@gohighlevel.com", "+91 98450 33271", "2026-02-18T14:22:00", "Today", ["internal"], "pink"],
      ["Meghana", "meghana.m@gohighlevel.com", null, "2026-08-27T10:03:00", "1 month ago", ["qa"], "pink"],
    ]),
    group("email", 1, "ritesh.mukim@gohighlevel.com", [
      ["Ritesh Mukim", "ritesh.mukim@gohighlevel.com", "+91 90040 78812", "2025-12-08T09:45:00", "Yesterday", ["internal", "product"], "blue"],
      ["ritesh", "ritesh.mukim@gohighlevel.com", null, "2026-09-03T13:12:00", "3 weeks ago", [], "blue"],
    ]),
    group("email", 2, "jamie@educogym.com", [
      ["Jamie Cole", "jamie@educogym.com", "+1 (720) 555-0134", "2026-01-22T15:30:00", "4 days ago", ["gym owner", "lead"], "green"],
      ["Jamie", "jamie@educogym.com", null, "2026-07-14T08:10:00", "2 months ago", ["form submission"], "green"],
    ]),
    group("email", 3, "hello@clearviewwindows.com", [
      ["Clearview Window Cleaning", "hello@clearviewwindows.com", "+1 (206) 555-0171", "2025-10-19T10:00:00", "1 week ago", ["customer"], "teal"],
      ["Sam Howard", "hello@clearviewwindows.com", "+1 (206) 555-0172", "2026-03-06T12:40:00", "1 month ago", [], "teal"],
      ["Clearview", "hello@clearviewwindows.com", null, "2026-09-18T09:14:00", "11 days ago", ["import"], "teal"],
    ]),
    group("email", 4, "drew.burks@gmail.com", [
      ["Drew Burks", "drew.burks@gmail.com", "+1 (615) 555-0190", "2026-04-11T16:20:00", "2 days ago", ["lead"], "orange"],
      ["Drew B", "drew.burks@gmail.com", null, "2026-08-08T20:05:00", "7 weeks ago", ["webinar"], "orange"],
    ]),
    group("email", 5, "kaleb@pushardplumbing.com", [
      ["Kaleb Pushard", "kaleb@pushardplumbing.com", "+1 (207) 555-0128", "2026-02-27T07:50:00", "5 days ago", ["plumbing", "customer"], "purple"],
      ["Kaleb", "kaleb@pushardplumbing.com", "+1 (207) 555-0128", "2026-06-02T11:35:00", "3 months ago", [], "purple"],
    ]),
    group("email", 6, "grace.kim@outlook.com", [
      ["Grace Kim", "grace.kim@outlook.com", null, "2026-05-13T14:00:00", "Today", ["beauty & fashion"], "yellow"],
      ["Grace", "grace.kim@outlook.com", "+1 (213) 555-0159", "2026-09-10T10:30:00", "2 weeks ago", ["form submission"], "yellow"],
    ]),
    group("email", 7, "omar@haddadlaw.com", [
      ["Omar Haddad", "omar@haddadlaw.com", "+1 (312) 555-0143", "2025-09-30T09:00:00", "3 weeks ago", ["legal", "vip"], "blue"],
      ["Omar Haddad", "omar@haddadlaw.com", "+1 (312) 555-0143", "2026-07-21T17:45:00", "2 months ago", ["import"], "blue"],
    ]),
  ],
  phone: [
    group("phone", 0, "+91 70340 60134", [
      ["Arjun Nair", "arjun.nair@gmail.com", "+91 70340 60134", "2026-01-05T10:20:00", "Yesterday", ["lead"], "green"],
      ["Arjun", null, "+91 70340 60134", "2026-03-18T12:00:00", "4 months ago", ["whatsapp"], "green"],
      ["Guest Visitor", null, "+91 70340 60134", "2026-06-24T19:30:00", "3 months ago", ["chat widget"], "teal"],
      ["arjun n", "arjun@nairdesigns.in", "+91 70340 60134", "2026-09-22T09:41:00", "1 week ago", ["form submission"], "green"],
    ]),
    group("phone", 1, "+91 83748 77543", [
      ["Ronak Jindal", "ronak.jindal@gohighlevel.com", "+91 83748 77543", "2025-12-15T11:15:00", "2 days ago", ["internal"], "blue"],
      ["Ronak", null, "+91 83748 77543", "2026-05-09T15:50:00", "2 months ago", ["dialer"], "blue"],
      ["Ronak J", "ronakj@gmail.com", "+91 83748 77543", "2026-09-21T19:17:00", "8 days ago", [], "blue"],
    ]),
    group("phone", 2, "+1 (512) 555-0182", [
      ["Jared Schoolcraft", "jared@schoolcraftfit.com", "+1 (512) 555-0182", "2026-03-14T10:12:00", "2 days ago", ["gym owner"], "blue"],
      ["Schoolcraft Fitness", "info@schoolcraftfit.com", "+1 (512) 555-0182", "2026-06-06T13:25:00", "1 month ago", ["customer"], "orange"],
    ]),
    group("phone", 3, "+91 94470 21108", [
      ["vishnupriya", "vishnupriya@gohighlevel.com", "+91 94470 21108", "2026-01-09T09:05:00", "Yesterday", ["internal", "qa"], "orange"],
      ["Vishnupriya Poduval", null, "+91 94470 21108", "2026-05-21T11:30:00", "1 month ago", [], "orange"],
    ]),
    group("phone", 4, "+1 (416) 555-0119", [
      ["Andrew McEwan", "andrew@mcewanroofing.com", "+1 (416) 555-0119", "2025-11-03T13:00:00", "1 week ago", ["lead", "roofing"], "green"],
      ["McEwan Roofing", "office@mcewanroofing.com", "+1 (416) 555-0119", "2026-04-17T10:44:00", "5 months ago", ["customer"], "purple"],
    ]),
    group("phone", 5, "+91 99001 45520", [
      ["Priya Raman", null, "+91 99001 45520", "2026-06-29T17:35:00", "2 months ago", ["form submission"], "purple"],
      ["Priya Raman", "priya.raman@yahoo.com", "+91 99001 45520", "2026-09-12T04:18:00", "2 weeks ago", ["import"], "purple"],
    ]),
    group("phone", 6, "+1 (206) 555-0171", [
      ["Clearview Window Cleaning", "hello@clearviewwindows.com", "+1 (206) 555-0171", "2025-10-19T10:00:00", "1 week ago", ["customer"], "teal"],
      ["Marcel van den Hoven", "marcel@clearviewwindows.com", "+1 (206) 555-0171", "2026-02-10T08:30:00", "6 weeks ago", ["staff"], "yellow"],
      ["Front desk", null, "+1 (206) 555-0171", "2026-08-15T12:05:00", "1 month ago", [], "teal"],
    ]),
    group("phone", 7, "+1 (312) 555-0143", [
      ["Omar Haddad", "omar@haddadlaw.com", "+1 (312) 555-0143", "2025-09-30T09:00:00", "3 weeks ago", ["legal", "vip"], "blue"],
      ["Haddad Law", "intake@haddadlaw.com", "+1 (312) 555-0143", "2026-07-21T17:45:00", "2 months ago", ["import"], "pink"],
    ]),
  ],
};

let groups: Record<DuplicateRule, DuplicateGroup[]> = SEED;

export interface ScanState {
  rule: DuplicateRule;
  scanning: boolean;
  lastCheck: number | null;
}

let scan: ScanState = { rule: "email", scanning: false, lastCheck: null };
let scanTimer: ReturnType<typeof setTimeout> | null = null;

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useDuplicateGroups(rule: DuplicateRule): DuplicateGroup[] {
  return React.useSyncExternalStore(
    subscribe,
    () => groups[rule],
    () => groups[rule],
  );
}

export function useScan(): ScanState {
  return React.useSyncExternalStore(
    subscribe,
    () => scan,
    () => scan,
  );
}

/**
 * Starts a scan and finishes it about 2.5s later.
 *
 * A second call restarts the clock rather than stacking timers, so Refresh
 * pressed mid-scan cannot end the new scan early on the old one's timeout.
 */
export function startScan(rule: DuplicateRule) {
  if (scanTimer) clearTimeout(scanTimer);
  scan = { rule, scanning: true, lastCheck: Date.now() };
  emit();
  scanTimer = setTimeout(() => {
    scanTimer = null;
    scan = { ...scan, scanning: false };
    emit();
  }, 2500);
}

/** Merges a group into its master record. Returns how many records merged. */
export function mergeGroup(
  rule: DuplicateRule,
  groupId: string,
  masterId: string,
): number {
  const target = groups[rule].find((g) => g.id === groupId);
  if (!target || !target.records.some((r) => r.id === masterId)) return 0;
  groups = { ...groups, [rule]: groups[rule].filter((g) => g.id !== groupId) };
  emit();
  return target.records.length;
}
