import {
  CircleCheck,
  FileEdit,
  Layers,
  TriangleAlert,
  Trash2,
  type LucideIcon,
} from "lucide-react";

/** Saved cuts of one workflow collection — the view-bar test, passed. */
export interface WorkflowView {
  id: string;
  label: string;
  count: string;
  icon: LucideIcon;
}

export const workflowViews: WorkflowView[] = [
  { id: "all", label: "All", count: "34", icon: Layers },
  { id: "live", label: "Live", count: "19", icon: CircleCheck },
  { id: "review", label: "Needs review", count: "4", icon: TriangleAlert },
  { id: "drafts", label: "Drafts", count: "9", icon: FileEdit },
  { id: "deleted", label: "Deleted", count: "2", icon: Trash2 },
];

export type WorkflowStatus = "live" | "draft" | "review";

export interface Workflow {
  id: string;
  name: string;
  /**
   * The folder this sits in, or null at the root.
   *
   * It was a `folder` STRING until Sep 28, back when the list had a Folder
   * column and the string was the cell's text. Folders are rows now, nested
   * two deep, so the field has to name a folder that exists rather than
   * describe one — "Web forms" is a label two different parents could use.
   */
  folderId: string | null;
  status: WorkflowStatus;
  enrolled: string;
  updated: string;
  updatedBy: string;
  created: string;
}

/**
 * The eight that were authored, kept exactly as they were.
 *
 * These are the ones every screenshot in the thread was taken on, so they stay
 * at the top and keep their names: a seed list that reshuffles when it grows
 * makes every earlier review unrepeatable.
 */
const authored: Workflow[] = [
  { id: "w1", name: "New enquiry — WhatsApp", folderId: "intake-web", status: "live", enrolled: "1,204", updated: "2 hours ago", updatedBy: "Samrina Shabha", created: "Apr 28 2025, 12:22 PM" },
  { id: "w2", name: "Quote follow-up × 3", folderId: "sales-quotes", status: "live", enrolled: "486", updated: "1 day ago", updatedBy: "Dev Anand", created: "May 15 2024, 7:10 PM" },
  { id: "w3", name: "Winter service reminder", folderId: "retention", status: "review", enrolled: "0", updated: "2 days ago", updatedBy: "Samrina Shabha", created: "Nov 04 2025, 12:26 PM" },
  { id: "w4", name: "Missed call text-back", folderId: "intake-phone", status: "live", enrolled: "912", updated: "3 days ago", updatedBy: "Dev Anand", created: "Jul 29 2026, 11:32 AM" },
  { id: "w5", name: "Review request — 3 days post-job", folderId: "retention", status: "live", enrolled: "331", updated: "5 days ago", updatedBy: "Samrina Shabha", created: "Aug 20 2025, 11:27 PM" },
  { id: "w6", name: "Abandoned booking recovery", folderId: "sales", status: "draft", enrolled: "0", updated: "1 week ago", updatedBy: "Dev Anand", created: "Jul 19 2023, 9:47 PM" },
  { id: "w7", name: "Annual contract renewal", folderId: "retention", status: "review", enrolled: "0", updated: "1 week ago", updatedBy: "Samrina Shabha", created: "Feb 11 2025, 9:03 AM" },
  { id: "w8", name: "Lead scoring — inbound", folderId: null, status: "draft", enrolled: "0", updated: "2 weeks ago", updatedBy: "Dev Anand", created: "Apr 28 2025, 12:22 PM" },
];

/*
 * And enough more to make a pager mean something.
 *
 * Generated rather than typed out, and generated DETERMINISTICALLY — indexes
 * into fixed word lists, no Math.random anywhere. A seed list that differs
 * between the server render and the client one is a hydration mismatch, and a
 * list that differs between two runs makes "is page 7 still right" a question
 * nobody can answer.
 *
 * The names are combinations rather than filler because the pager is judged on
 * a real-looking table: "Item 47" tells you the control works and nothing
 * about whether the row is readable at 140 of them.
 */
const TRIGGERS = ["Missed call", "Form submitted", "Tag added", "Payment failed", "Appointment booked", "Review left", "Cart abandoned", "Invoice overdue", "Chat started", "Deal won"];
const ACTIONS = ["text-back", "nurture", "handoff", "reminder", "follow-up", "escalation", "win-back", "survey", "digest", "re-engage"];
const OWNERS = ["Samrina Shabha", "Dev Anand", "Priya Raman", "Marcus Hale", "Yuki Tanaka"];
/*
 * Where the generated rows land, and why so many stay at the root.
 *
 * Weighted rather than even. An account that had filed everything would put
 * two pages at the top level and nine inside, which tests the pager on the one
 * screen nobody opens first. Most real accounts are the other way round —
 * folders made late, over a pile that was never sorted — and that is also the
 * shape the pager has to survive: a long run under a short row of directories.
 */
const FOLDER_SPREAD: (string | null)[] = [
  null, "intake", null, "intake-web", null,
  "intake-phone", null, "sales", null, "sales-quotes",
  null, "retention", null, "onboarding", null,
  "reactivation", null, "intake-web", null, "sales",
];
const STATUSES: WorkflowStatus[] = ["live", "live", "live", "draft", "review"];
const AGES = ["2 hours ago", "1 day ago", "3 days ago", "1 week ago", "2 weeks ago", "1 month ago", "3 months ago"];
const CREATED = ["Apr 28 2025, 12:22 PM", "Aug 04 2026, 6:22 PM", "Jul 29 2026, 11:32 AM", "May 15 2024, 7:10 PM", "Jul 19 2023, 9:47 PM", "Nov 04 2025, 12:26 PM", "Aug 20 2025, 11:27 PM"];

const generated: Workflow[] = Array.from({ length: 236 }, (_, i) => {
  const trigger = TRIGGERS[i % TRIGGERS.length]!;
  const action = ACTIONS[Math.floor(i / TRIGGERS.length) % ACTIONS.length]!;
  const status = STATUSES[i % STATUSES.length]!;
  return {
    id: `wg${i + 1}`,
    name: `${trigger} — ${action}`,
    folderId: FOLDER_SPREAD[i % FOLDER_SPREAD.length]!,
    status,
    // Zero enrolled unless it is live, which is the rule the authored eight
    // already follow — a draft nobody has published cannot have anyone in it.
    enrolled: status === "live" ? String(((i * 137) % 1800) + 12) : "0",
    updated: AGES[i % AGES.length]!,
    updatedBy: OWNERS[i % OWNERS.length]!,
    created: CREATED[i % CREATED.length]!,
  };
});

export const workflows: Workflow[] = [...authored, ...generated];

/** The workflows filed directly in a folder — not in its sub-folders. */
export function workflowsIn(folderId: string | null): Workflow[] {
  return workflows.filter((w) => w.folderId === folderId);
}

/**
 * The folders the list files workflows into.
 *
 * Authored rather than derived from the rows, because a folder is a place even
 * when it is empty — deriving would make "Retention" disappear the moment its
 * last workflow moved out, which is the one moment someone is looking for it.
 * The blurb is here for the same reason the list's is: a folder page is a
 * listing page, and a listing page with a bare title reads half-built.
 */
export interface WorkflowFolder {
  id: string;
  label: string;
  description: string;
  /**
   * The folder above this one, or null at the root. Two levels, no deeper.
   *
   * A depth LIMIT rather than a tree, deliberately: Ashwin asked for two on
   * Sep 28 because two is where the trail gets long enough to test the
   * collapse and leaf options — Automation ▸ Workflows ▸ Intake ▸ Web forms ▸
   * <record> is six segments — and a third level would only make the same
   * point again while giving every screen one more state to be wrong in.
   */
  parentId: string | null;
  updated: string;
  created: string;
}

/**
 * Five at the root, two of which hold folders of their own.
 *
 * Uneven on purpose. "Some of them have no folders at all, while others have
 * folders" — a list where every folder nests the same way would hide the case
 * that actually needs designing, which is the folder page with no folders on
 * it: a table that opens with rows rather than with a run of directories.
 */
export const workflowFolders: WorkflowFolder[] = [
  { id: "intake", label: "Intake", description: "First touch, before anyone picks up", parentId: null, updated: "Apr 28 2025, 12:22 PM", created: "Apr 28 2025, 12:22 PM" },
  { id: "intake-web", label: "Web forms", description: "Everything that starts on the site", parentId: "intake", updated: "Aug 04 2026, 6:22 PM", created: "Aug 04 2026, 6:22 PM" },
  { id: "intake-phone", label: "Phone and SMS", description: "Missed calls, text-backs and voicemail", parentId: "intake", updated: "Jul 29 2026, 11:32 AM", created: "Jul 29 2026, 11:32 AM" },
  { id: "sales", label: "Sales", description: "Quotes, follow-ups and bookings", parentId: null, updated: "May 15 2024, 7:10 PM", created: "May 15 2024, 7:10 PM" },
  { id: "sales-quotes", label: "Quotes", description: "From sent to signed", parentId: "sales", updated: "Jul 19 2023, 9:47 PM", created: "Jul 19 2023, 9:47 PM" },
  { id: "retention", label: "Retention", description: "Reminders and renewals after the job", parentId: null, updated: "Nov 04 2025, 12:26 PM", created: "Nov 04 2025, 12:26 PM" },
  { id: "onboarding", label: "Onboarding", description: "The first two weeks of a new account", parentId: null, updated: "Aug 20 2025, 11:27 PM", created: "Aug 20 2025, 11:27 PM" },
  { id: "reactivation", label: "Reactivation", description: "Winning back a lapsed customer", parentId: null, updated: "Feb 11 2025, 9:03 AM", created: "Feb 11 2025, 9:03 AM" },
];

/** A folder's own children, in the order the table prints them. */
export function foldersIn(parentId: string | null): WorkflowFolder[] {
  return workflowFolders.filter((f) => f.parentId === parentId);
}

/** Every folder from the root down to this one, for the trail. */
export function folderPath(id: string | null): WorkflowFolder[] {
  const out: WorkflowFolder[] = [];
  let cursor = id;
  // Bounded by the depth limit rather than trusting the data: a parentId typo
  // that pointed at itself would otherwise hang the page rather than draw a
  // short trail.
  for (let i = 0; cursor && i < 4; i += 1) {
    const node = workflowFolders.find((f) => f.id === cursor);
    if (!node) break;
    out.unshift(node);
    cursor = node.parentId;
  }
  return out;
}

export const STATUS_LABEL: Record<WorkflowStatus, string> = {
  live: "Live",
  draft: "Draft",
  review: "Needs review",
};

/** One workflow's steps — enough to make the detail page a real page. */
export interface WorkflowStep {
  id: string;
  kind: "trigger" | "action" | "wait" | "branch";
  label: string;
  detail: string;
}

export const workflowSteps: WorkflowStep[] = [
  { id: "s1", kind: "trigger", label: "Customer replies on WhatsApp", detail: "Any inbound message · first reply only" },
  { id: "s2", kind: "action", label: "Create contact if new", detail: "Source = WhatsApp · tag whatsapp_webhook" },
  { id: "s3", kind: "branch", label: "Has an open opportunity?", detail: "Two paths · 62% yes over 30 days" },
  { id: "s4", kind: "action", label: "Notify owner in Conversations", detail: "Assign to pipeline owner, else round-robin" },
  { id: "s5", kind: "wait", label: "Wait 15 minutes", detail: "Skip if a human replies first" },
  { id: "s6", kind: "action", label: "Send holding reply", detail: "Snippet: first-response-sla" },
];
