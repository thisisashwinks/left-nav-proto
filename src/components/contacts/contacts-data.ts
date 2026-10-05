import {
  CircleCheck,
  Flame,
  Inbox,
  MailX,
  Users,
  type LucideIcon,
} from "lucide-react";

/** Avatar tone, cycled per contact. Each maps to a --pg-av-* token pair. */
export type AvatarTone =
  | "blue"
  | "pink"
  | "green"
  | "orange"
  | "purple"
  | "yellow"
  | "teal";

export type ContactStatus = "inquiry" | "subscribed";

export interface Contact {
  id: string;
  name: string;
  handle: string;
  email: string | null;
  created: string;
  lastActivity: string;
  status: ContactStatus;
  tone: AvatarTone;
  selected?: boolean;
}

export interface SmartList {
  id: string;
  label: string;
  count: string;
  icon: LucideIcon;
}

export const STATUS_LABELS: Record<ContactStatus, string> = {
  inquiry: "Inquiry received",
  subscribed: "Subscribed",
};

/**
 * The saved views, renamed Sep 23 off the live account's own smart lists.
 *
 * "Inquiries", "Subscribed", "Hot leads" were the prototype's own inventions
 * and they were all one or two words long, which made the tab strip look
 * settled in a way the real one is not: people name a smart list after the
 * question they asked it, so the row that has to be designed for is the one
 * with "Mobile App Web Form Submissions" in it. Every truncation, every
 * overflow decision and the whole of L-F's width argument depend on these
 * labels being as long as the real ones — short names would have let the row
 * fit and the variant pass a test it should have failed.
 *
 * Five, not seven: the two cuts that went (a 30-day activity slice and a July
 * import) were the two that cost a tab and taught nothing the other five do
 * not. Five is also what the account screenshotted has, which is what makes
 * the overflow read `1 more` rather than a number chosen to look busy.
 *
 * The ids are untouched — `contacts-page` switches on them to do the actual
 * re-cutting, and `no-email` in particular is the deliberately narrow
 * three-row list a table has to survive.
 */
export const smartLists: SmartList[] = [
  { id: "all", label: "All", count: "1,469", icon: Users },
  {
    id: "inquiries",
    label: "Mobile App Web Form Submissions",
    count: "962",
    icon: Inbox,
  },
  {
    id: "subscribed",
    label: "Beauty & Fashion Buyers",
    count: "341",
    icon: CircleCheck,
  },
  { id: "hot-leads", label: "New smart list", count: "48", icon: Flame },
  { id: "no-email", label: "No email", count: "89", icon: MailX },
];

/** The 16 rows from the TableCard, verbatim. */
export const contacts: Contact[] = [
  // left-nav.pen draws this row selected to show the selection bar, but a fresh
  // page load has nothing selected — the same reasoning as the nav's own rows.
  { id: "jatin", name: "Jatin", handle: "@jatin", email: null, created: "Jul 28, 2026", lastActivity: "1 day ago", status: "inquiry", tone: "blue" },
  { id: "shivani", name: "Shivani", handle: "@shivani88426", email: null, created: "Jul 28, 2026", lastActivity: "2 days ago", status: "inquiry", tone: "pink" },
  { id: "tridev", name: "Tridev Singh", handle: "@tridevsingh", email: null, created: "Jul 28, 2026", lastActivity: "2 days ago", status: "inquiry", tone: "green" },
  { id: "pradeep", name: "Pradeep Kumar", handle: "@pradeep_k", email: null, created: "Jul 28, 2026", lastActivity: "2 days ago", status: "inquiry", tone: "orange" },
  { id: "arman", name: "Arman Ali", handle: "@arman.ali", email: null, created: "Jul 28, 2026", lastActivity: "2 days ago", status: "inquiry", tone: "blue" },
  { id: "raj", name: "Raj", handle: "@raj", email: null, created: "Jul 28, 2026", lastActivity: "2 days ago", status: "inquiry", tone: "purple" },
  { id: "pathak", name: "Pathak Baba", handle: "@pathak.baba", email: null, created: "Jul 28, 2026", lastActivity: "2 days ago", status: "inquiry", tone: "yellow" },
  { id: "sohaib", name: "Mohd Sohaib", handle: "@mohd_sohaib", email: null, created: "Jul 27, 2026", lastActivity: "2 days ago", status: "inquiry", tone: "teal" },
  { id: "jitendra", name: "Jitendra Kumar", handle: "@jitendra", email: null, created: "Jul 27, 2026", lastActivity: "2 days ago", status: "inquiry", tone: "blue" },
  { id: "ella", name: "Ella", handle: "@ella", email: "fewogok504@wqeather.com", created: "Jul 27, 2026", lastActivity: "3 days ago", status: "subscribed", tone: "pink" },
  { id: "ritesh", name: "Ritesh Mukim", handle: "@ritesh", email: "ritesh.mukim@gohighlevel.com", created: "Jul 23, 2026", lastActivity: "6 days ago", status: "subscribed", tone: "green" },
  { id: "sachin", name: "Sachin", handle: "@s.a.c.h.i.n", email: null, created: "Jul 23, 2026", lastActivity: "1 week ago", status: "inquiry", tone: "orange" },
  { id: "vishnu", name: "Vishnu", handle: "@1k__vishnu", email: null, created: "Jul 22, 2026", lastActivity: "1 week ago", status: "inquiry", tone: "blue" },
  { id: "reviewer", name: "App Reviewer", handle: "@appreviewer", email: "appletestapp83@gmail.com", created: "Jul 20, 2026", lastActivity: "1 week ago", status: "subscribed", tone: "purple" },
  { id: "abhilash", name: "Abhilash Chauhan", handle: "@abhilash", email: "abhilash.chauhan@gohighlevel.com", created: "Jul 20, 2026", lastActivity: "1 week ago", status: "subscribed", tone: "yellow" },
  { id: "alisha", name: "Alisha", handle: "@itz.alisha246", email: null, created: "Jul 20, 2026", lastActivity: "1 week ago", status: "inquiry", tone: "teal" },
];

/** Column widths from the table head; `name` is the flexible column. */
export const COLUMNS = {
  check: 52,
  email: 260,
  created: 150,
  activity: 160,
  status: 170,
  kebab: 56,
} as const;

/**
 * How far each data column may be squeezed before the table gives up.
 *
 * The widths above are what a column WANTS; these are what it will accept.
 * Until Oct 5 there was only the first set and every cell was `shrink-0`, so
 * the row was a fixed 848px plus the name — fine at full width and clipped
 * outright the moment anything took room away from the canvas, which the
 * docked Ask AI panel does by design. The card does not scroll horizontally
 * either, so the columns past the fold were not hidden, they were gone.
 *
 * Floors rather than a scrollbar because the content allows it: a date, a
 * relative time and a status chip are short strings in wide boxes, and the
 * padding is most of what compresses. Email is the one that truncates, and
 * it is the one people scan rather than read in full.
 *
 * Check and kebab are absent on purpose. Both hold a fixed-size control
 * centred in a box, so there is nothing in them to compress — shrinking
 * those is how a checkbox ends up clipped.
 */
export const COLUMN_FLOORS = {
  email: 132,
  created: 104,
  activity: 118,
  status: 118,
} as const;

/** The name column keeps this much before anything else gives. */
export const NAME_FLOOR = 180;
