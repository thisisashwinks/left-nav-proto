import {
  Activity,
  CircleCheck,
  Download,
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

/** Chips from the SmartListRail in left-nav.pen, in order. */
export const smartLists: SmartList[] = [
  { id: "all", label: "All contacts", count: "1,469", icon: Users },
  { id: "inquiries", label: "Inquiries", count: "962", icon: Inbox },
  { id: "subscribed", label: "Subscribed", count: "341", icon: CircleCheck },
  { id: "hot-leads", label: "Hot leads", count: "48", icon: Flame },
  { id: "engaged", label: "Engaged · 30d", count: "214", icon: Activity },
  { id: "imported", label: "Imported · Jul", count: "156", icon: Download },
  { id: "no-email", label: "No email", count: "89", icon: MailX },
];

/** The 16 rows from the TableCard, verbatim. */
export const contacts: Contact[] = [
  { id: "jatin", name: "Jatin", handle: "@jatin", email: null, created: "Jul 28, 2026", lastActivity: "1 day ago", status: "inquiry", tone: "blue", selected: true },
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
