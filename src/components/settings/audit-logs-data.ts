import type { AvatarTone } from "@/components/contacts/contacts-data";

/**
 * Settings › Audit logs — seed data.
 *
 * Timestamps are written in IST with their offset and read back by pattern
 * rather than through `Date`, so the server render and the client render print
 * the same "Sep 08, 2026 at 12:13 PM IST" whatever the machine's zone is.
 */

export type AuditModule = "Opportunity" | "Contact" | "Company" | "Task";
export type AuditAction = "Created" | "Updated" | "Deleted" | "Restored";

export interface AuditEntry {
  id: string;
  name: string;
  docId: string;
  module: AuditModule;
  action: AuditAction;
  by: { name: string; initials: string; via: string };
  /** ISO, IST offset. */
  at: string;
  changes?: { field: string; from: string; to: string }[];
}

export const AUDIT_MODULES: AuditModule[] = ["Opportunity", "Contact", "Company", "Task"];
export const AUDIT_ACTIONS: AuditAction[] = ["Created", "Updated", "Deleted", "Restored"];

export interface AuditUser {
  name: string;
  initials: string;
  tone: AvatarTone;
}

export const AUDIT_USERS: AuditUser[] = [
  { name: "Samrina Shabha", initials: "SS", tone: "pink" },
  { name: "Dev Anand", initials: "DA", tone: "orange" },
  { name: "Ashwin KS", initials: "AK", tone: "blue" },
  { name: "Priya Menon", initials: "PM", tone: "purple" },
  { name: "Automation", initials: "AU", tone: "teal" },
];

export function toneFor(name: string): AvatarTone {
  return AUDIT_USERS.find((u) => u.name === name)?.tone ?? "green";
}

const U = Object.fromEntries(AUDIT_USERS.map((u) => [u.name, u])) as Record<string, AuditUser>;
const by = (name: string, via: string) => ({ name, initials: U[name]?.initials ?? name.slice(0, 2).toUpperCase(), via });

export const AUDIT_ENTRIES: AuditEntry[] = [
  { id: "a01", name: "Warehouse cooling audit", docId: "opp_8Kq2Lr91Xz", module: "Opportunity", action: "Deleted", by: by("Dev Anand", "Bulk action"), at: "2026-09-28T17:42:00+05:30" },
  { id: "a02", name: "Ceiling cassette × 4", docId: "opp_3Vn7Tp20Qa", module: "Opportunity", action: "Deleted", by: by("Dev Anand", "Bulk action"), at: "2026-09-28T17:42:00+05:30" },
  { id: "a03", name: "Thermostat upgrade", docId: "opp_5Hd1Mc44Wb", module: "Opportunity", action: "Deleted", by: by("Dev Anand", "Bulk action"), at: "2026-09-28T17:41:00+05:30" },
  { id: "a04", name: "Jatin", docId: "con_7Pw9Ya12Kd", module: "Contact", action: "Updated", by: by("Samrina Shabha", "Web app"), at: "2026-09-27T11:05:00+05:30", changes: [{ field: "Phone", from: "(415) 555-0132", to: "(415) 555-0198" }, { field: "Tags", from: "lead", to: "lead, hvac" }] },
  { id: "a05", name: "Ducted split — 3 bed", docId: "opp_1Rt6Bn83Ls", module: "Opportunity", action: "Updated", by: by("Samrina Shabha", "Web app"), at: "2026-09-26T16:20:00+05:30", changes: [{ field: "Stage", from: "New lead", to: "Reached out" }, { field: "Value", from: "$3,900", to: "$4,200" }] },
  { id: "a06", name: "Follow up with Tridev", docId: "tsk_4Gc8Qe57Nm", module: "Task", action: "Created", by: by("Automation", "Workflow"), at: "2026-09-25T09:00:00+05:30" },
  { id: "a07", name: "Split unit — bedroom", docId: "opp_9Zk3Wd16Hy", module: "Opportunity", action: "Deleted", by: by("Samrina Shabha", "Web app"), at: "2026-09-24T14:33:00+05:30" },
  { id: "a08", name: "VenueFlow", docId: "cmp_2Lm5Rs90Td", module: "Company", action: "Updated", by: by("Priya Menon", "Web app"), at: "2026-09-23T12:48:00+05:30", changes: [{ field: "Website", from: "venueflow.io", to: "venueflow.com" }] },
  { id: "a09", name: "Office retrofit — floor 2", docId: "opp_6Nb4Kx28Vc", module: "Opportunity", action: "Updated", by: by("Dev Anand", "Web app"), at: "2026-09-22T10:15:00+05:30", changes: [{ field: "Owner", from: "Unassigned", to: "Dev Anand" }] },
  { id: "a10", name: "Shivani", docId: "con_8Tq1Hn63Pe", module: "Contact", action: "Created", by: by("Automation", "Workflow"), at: "2026-09-21T08:30:00+05:30" },
  { id: "a11", name: "Duct clean — annual", docId: "opp_0Xs7Jg45Ur", module: "Opportunity", action: "Created", by: by("Ashwin KS", "Web app"), at: "2026-09-19T15:02:00+05:30" },
  { id: "a12", name: "Send quote to Ella", docId: "tsk_3Fy9Cv21Ob", module: "Task", action: "Deleted", by: by("Priya Menon", "Web app"), at: "2026-09-18T18:10:00+05:30" },
  { id: "a13", name: "Full system — new build", docId: "opp_7Wm2Pd39Ak", module: "Opportunity", action: "Deleted", by: by("Ashwin KS", "Web app"), at: "2026-09-17T13:27:00+05:30" },
  { id: "a14", name: "Coolbreeze Traders", docId: "cmp_5Qa8Ly74Zf", module: "Company", action: "Created", by: by("Priya Menon", "Web app"), at: "2026-09-16T11:40:00+05:30" },
  { id: "a15", name: "Pradeep Kumar", docId: "con_1Kd6Sw08Mg", module: "Contact", action: "Deleted", by: by("Dev Anand", "Web app"), at: "2026-09-15T16:55:00+05:30" },
  { id: "a16", name: "Annual service plan", docId: "opp_4Ej0Ru52Bx", module: "Opportunity", action: "Updated", by: by("Automation", "Workflow"), at: "2026-09-14T07:45:00+05:30", changes: [{ field: "Status", from: "Open", to: "Won" }] },
  { id: "a17", name: "Compressor replacement", docId: "opp_2Cv5Nh67Qt", module: "Opportunity", action: "Restored", by: by("Samrina Shabha", "Web app"), at: "2026-09-12T10:03:00+05:30" },
  { id: "a18", name: "Compressor replacement", docId: "opp_2Cv5Nh67Qt", module: "Opportunity", action: "Deleted", by: by("Dev Anand", "Bulk action"), at: "2026-09-10T19:21:00+05:30" },
  { id: "a19", name: "Arman Ali", docId: "con_6Ho3Te81Jw", module: "Contact", action: "Updated", by: by("Ashwin KS", "Web app"), at: "2026-09-09T14:12:00+05:30", changes: [{ field: "Email", from: "arman@mail.com", to: "arman.ali@mail.com" }] },
  { id: "a20", name: "Rooftop unit service", docId: "opp_8Dn1Xb30Ci", module: "Opportunity", action: "Deleted", by: by("Samrina Shabha", "Bulk action"), at: "2026-09-08T12:13:00+05:30" },
  { id: "a21", name: "Book site visit", docId: "tsk_9Mr4Gk16Ea", module: "Task", action: "Updated", by: by("Samrina Shabha", "Web app"), at: "2026-09-06T09:50:00+05:30", changes: [{ field: "Due date", from: "09/06/2026", to: "09/09/2026" }] },
  { id: "a22", name: "Ritesh Mukim", docId: "con_3Yb7Fp92Ls", module: "Contact", action: "Created", by: by("Priya Menon", "Web app"), at: "2026-09-04T17:18:00+05:30" },
  { id: "a23", name: "Heat pump install", docId: "opp_5Tg2Vz48Nd", module: "Opportunity", action: "Deleted", by: by("Ashwin KS", "Web app"), at: "2026-08-29T11:36:00+05:30" },
  { id: "a24", name: "Northwind HVAC", docId: "cmp_0Pe9Wq65Rh", module: "Company", action: "Deleted", by: by("Dev Anand", "Web app"), at: "2026-08-21T15:44:00+05:30" },
  { id: "a25", name: "Vishnu", docId: "con_4Az6Mu27Yk", module: "Contact", action: "Updated", by: by("Automation", "Workflow"), at: "2026-08-12T08:05:00+05:30", changes: [{ field: "Lead score", from: "40", to: "65" }] },
  { id: "a26", name: "Air purifier add-on", docId: "opp_1Lf8Oc53Gv", module: "Opportunity", action: "Created", by: by("Dev Anand", "Web app"), at: "2026-08-03T13:59:00+05:30" },
];

export interface ExportJob {
  id: string;
  file: string;
  requestedBy: string;
  at: string;
  status: "Completed" | "Processing" | "Failed";
}

export const EXPORT_JOBS: ExportJob[] = [
  { id: "x1", file: "audit-logs-2026-09-28.csv", requestedBy: "Ashwin KS", at: "2026-09-28T18:02:00+05:30", status: "Completed" },
  { id: "x2", file: "audit-logs-opportunity-deleted.csv", requestedBy: "Dev Anand", at: "2026-09-21T10:30:00+05:30", status: "Completed" },
  { id: "x3", file: "audit-logs-2026-09-14.csv", requestedBy: "Priya Menon", at: "2026-09-14T16:47:00+05:30", status: "Failed" },
  { id: "x4", file: "audit-logs-2026-08-31.csv", requestedBy: "Samrina Shabha", at: "2026-08-31T09:12:00+05:30", status: "Completed" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-08T12:13:00+05:30" → { date: "Sep 08, 2026", time: "12:13 PM IST" }. */
export function formatAt(iso: string): { date: string; time: string } {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso);
  if (!m) return { date: iso, time: "" };
  const [, y, mo, d, hh, mm] = m;
  const h = Number(hh);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return {
    date: `${MONTHS[Number(mo) - 1]} ${d}, ${y}`,
    time: `${h12}:${mm} ${h < 12 ? "AM" : "PM"} IST`,
  };
}

/** The current moment, written the way the seed is: IST with its offset. */
export function nowIst(): string {
  const shifted = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString();
  return `${shifted.slice(0, 16)}:00+05:30`;
}
