import { ME, TEAMMATES, type Teammate } from "@/components/product/conversations/conversations-data";

/**
 * Sample data for the New booking builder — services, listings, the staff who
 * run them, and the timezones the appointment can be pinned to.
 *
 * Its own file rather than a section of calendars-data: the week grid and the
 * list read that one, and nothing about what a service costs or how a cabin
 * is billed has any business changing the shape of a calendar row.
 *
 * Staff are the conversations teammates, not a third roster. The booking
 * modal on the contact record already assigns from that list, and a staff
 * member who exists in one booking surface and not the other is the kind of
 * seam a reviewer finds by accident.
 */

/* ─── Staff ─────────────────────────────────────────────────────────────── */

export type StaffMember = Teammate;

export const STAFF: readonly StaffMember[] = [ME, ...TEAMMATES];

export function staffById(id: string | null): StaffMember | undefined {
  return id ? STAFF.find((s) => s.id === id) : undefined;
}

/* ─── Services (the Appointment type) ───────────────────────────────────── */

export interface ServiceItem {
  id: string;
  name: string;
  category: string;
  /** Minutes. */
  duration: number;
  /** Dollars. */
  price: number;
  /** Who can run it. The first is the default when a row is added. */
  staffIds: readonly string[];
}

export const SERVICES: readonly ServiceItem[] = [
  { id: "sv-consult", name: "Initial consultation", category: "Consulting", duration: 30, price: 0, staffIds: ["t-me", "t-aarat", "t-aayush"] },
  { id: "sv-strategy", name: "Strategy session", category: "Consulting", duration: 60, price: 149, staffIds: ["t-me", "t-aayushi"] },
  { id: "sv-audit", name: "Funnel audit", category: "Consulting", duration: 90, price: 299, staffIds: ["t-aayush", "t-prathamesh"] },
  { id: "sv-onboard", name: "Account onboarding", category: "Onboarding", duration: 45, price: 99, staffIds: ["t-abhilasha", "t-samrina", "t-me"] },
  { id: "sv-migration", name: "CRM data migration", category: "Onboarding", duration: 120, price: 1299, staffIds: ["t-rabbani", "t-prathamesh"] },
  { id: "sv-training", name: "Team training", category: "Onboarding", duration: 60, price: 199, staffIds: ["t-samrina", "t-aayushi"] },
  { id: "sv-haircut", name: "Haircut and style", category: "Salon", duration: 45, price: 49, staffIds: ["t-aayushi", "t-abhilasha"] },
  { id: "sv-color", name: "Color treatment", category: "Salon", duration: 90, price: 120, staffIds: ["t-abhilasha"] },
  { id: "sv-massage", name: "Deep tissue massage", category: "Wellness", duration: 60, price: 89.5, staffIds: ["t-samrina", "t-rabbani"] },
];

/* ─── Listings (the Booking type) ───────────────────────────────────────── */

/** How a listing is billed. A cabin is priced by the night, a studio by the hour. */
export type ListingUnit = "night" | "hour";

export interface Listing {
  id: string;
  name: string;
  /** "Cabin · Lake Tahoe" — the second line in the picker and the row. */
  detail: string;
  unit: ListingUnit;
  /** Dollars per unit. */
  rate: number;
  /**
   * The window a freshly added row opens on, as minutes after midnight and a
   * day offset for the end. Check-in 3:00 PM, check-out 11:00 AM the next day
   * for a stay; 10:00 AM–12:00 PM for anything billed by the hour.
   */
  defaultStart: number;
  defaultEnd: number;
  defaultNights: number;
}

export const LISTINGS: readonly Listing[] = [
  { id: "ls-cabin", name: "Lakeside cabin", detail: "Cabin · Lake Tahoe", unit: "night", rate: 240, defaultStart: 15 * 60, defaultEnd: 11 * 60, defaultNights: 2 },
  { id: "ls-loft", name: "Downtown loft", detail: "Apartment · Austin", unit: "night", rate: 185, defaultStart: 15 * 60, defaultEnd: 11 * 60, defaultNights: 1 },
  { id: "ls-villa", name: "Hillside villa", detail: "Villa · Napa Valley", unit: "night", rate: 1299, defaultStart: 16 * 60, defaultEnd: 10 * 60, defaultNights: 3 },
  { id: "ls-studio", name: "Podcast studio", detail: "Studio · Room 2B", unit: "hour", rate: 45, defaultStart: 10 * 60, defaultEnd: 12 * 60, defaultNights: 0 },
  { id: "ls-meeting", name: "Boardroom", detail: "Meeting room · 12 seats", unit: "hour", rate: 60, defaultStart: 14 * 60, defaultEnd: 16 * 60, defaultNights: 0 },
  { id: "ls-kayak", name: "Tandem kayak", detail: "Equipment · Pier 4", unit: "hour", rate: 25, defaultStart: 9 * 60, defaultEnd: 12 * 60, defaultNights: 0 },
];

/* ─── Timezones ─────────────────────────────────────────────────────────── */

export const TIMEZONES: readonly { value: string; label: string }[] = [
  { value: "Pacific/Honolulu", label: "GMT-10:00 Pacific/Honolulu (HST)" },
  { value: "America/Los_Angeles", label: "GMT-07:00 America/Los_Angeles (PDT)" },
  { value: "America/Denver", label: "GMT-06:00 America/Denver (MDT)" },
  { value: "America/Chicago", label: "GMT-05:00 America/Chicago (CDT)" },
  { value: "America/New_York", label: "GMT-04:00 America/New_York (EDT)" },
  { value: "America/Sao_Paulo", label: "GMT-03:00 America/Sao_Paulo (BRT)" },
  { value: "Europe/London", label: "GMT+01:00 Europe/London (BST)" },
  { value: "Europe/Berlin", label: "GMT+02:00 Europe/Berlin (CEST)" },
  { value: "Asia/Dubai", label: "GMT+04:00 Asia/Dubai (GST)" },
  { value: "Asia/Kolkata", label: "GMT+05:30 Asia/Kolkata (IST)" },
  { value: "Asia/Singapore", label: "GMT+08:00 Asia/Singapore (SGT)" },
  { value: "Asia/Tokyo", label: "GMT+09:00 Asia/Tokyo (JST)" },
  { value: "Australia/Sydney", label: "GMT+10:00 Australia/Sydney (AEST)" },
];

export const DEFAULT_TIMEZONE = "Asia/Kolkata";

/* ─── Customer details ──────────────────────────────────────────────────── */

/**
 * Phone numbers for the contacts table's people.
 *
 * The contacts sample carries no phone column, and the builder's whole point
 * about the Phone field is that it fills the moment a contact is picked — so
 * the numbers live here, keyed by contact id, rather than widening a table
 * this builder does not own. A contact missing from the map simply has no
 * number on file, which is a state the field has to handle anyway.
 */
export const CONTACT_PHONES: Readonly<Record<string, string>> = {
  jatin: "+91 98765 43210",
  shivani: "+91 99887 66554",
  tridev: "+91 91234 56789",
  pradeep: "+91 90000 12345",
  arman: "+91 98111 22233",
  ella: "(415) 555-0132",
  ritesh: "+91 98450 67890",
  reviewer: "(408) 555-0199",
  abhilash: "+91 97410 11223",
  alisha: "+91 93333 44455",
};

/* ─── Title merge fields ────────────────────────────────────────────────── */

export const MERGE_FIELDS: readonly { label: string; token: string }[] = [
  { label: "Contact name", token: "{{contact.name}}" },
  { label: "Contact first name", token: "{{contact.first_name}}" },
  { label: "Service name", token: "{{appointment.service}}" },
  { label: "Staff name", token: "{{appointment.staff}}" },
  { label: "Appointment date", token: "{{appointment.date}}" },
];

/* ─── Statuses ──────────────────────────────────────────────────────────── */

export type AppointmentStatus = "confirmed" | "unconfirmed";

export const APPOINTMENT_STATUSES: readonly { value: AppointmentStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "unconfirmed", label: "Unconfirmed" },
];

export type RentalStatus = "booked" | "reserved" | "pending";

export const RENTAL_STATUSES: readonly { value: RentalStatus; label: string }[] = [
  { value: "booked", label: "Booked" },
  { value: "reserved", label: "Reserved" },
  { value: "pending", label: "Pending" },
];

/* ─── Formatting ────────────────────────────────────────────────────────── */

/** "$49", "$1,299", "$89.50" — cents only when there are any. */
export function formatMoney(n: number): string {
  const whole = Math.round(n * 100) % 100 === 0;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}

/** "30 min", "1 hr", "1 hr 30 min". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
