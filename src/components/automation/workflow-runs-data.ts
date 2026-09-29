/**
 * One workflow's runs — who entered it, and what each run did.
 *
 * Shared by Enrollment history and Execution logs because they are the same
 * runs read two ways: an enrollment is one row per time a contact came in, and
 * an execution log is one row per step that run took. A contact id and an
 * execution id are what the two facets hand each other, so both are defined
 * here once rather than invented separately on each side.
 *
 * Every run is the same three steps — Add to workflow, Add Tag, Removed by End
 * Of Workflow — because the workflow on the canvas is that short. Times are
 * fixed strings off a fixed "now" (Sep 29, 2026) so screenshots stay stable.
 */

export interface RunContact {
  id: string;
  name: string;
  email: string;
  /** Stable, opaque, and long — the id the path view prints in its info box. */
  crmId: string;
}

export const RUN_CONTACTS: RunContact[] = [
  { id: "gz", name: "Guillermo Zuluaga", email: "guillermo@centryka.com", crmId: "DB4ucDdoX5NiXSYWlA7o" },
  { id: "sg", name: "Sandi Griffin", email: "sandi.griffin@gmail.com", crmId: "Kq82LmTn0pWzR4vYcB1e" },
  { id: "lo", name: "Leidy Ortiz", email: "leidy.ortiz@outlook.com", crmId: "Hx3PaQ9sDkE7uJ2fNw6r" },
  { id: "ia", name: "Ilkay Ashton", email: "ilkay@ashton.io", crmId: "Tz5VbN1mCq8LpX4gRs0y" },
  { id: "kl", name: "Kristine Lestrange", email: "kristine.l@gmail.com", crmId: "Wd7FjK2hYn6MvB9aQe3t" },
  { id: "tn", name: "Thiago Nunes", email: "thiago.nunes@runo.ai", crmId: "Pl0GsR8cUx5NtZ1kHy4w" },
  { id: "as", name: "Aman Sehgal", email: "aman.sehgal@gmail.com", crmId: "Mb6TqE3rJw9CzL2vXn8d" },
  { id: "tb", name: "Tara Bulum", email: "tara.bulum@gmail.com", crmId: "Fn4YkP7sBa1HgW5mQc9e" },
  { id: "ks", name: "Karl Schnitzer", email: "karl@schnitzer.de", crmId: "Rj2XvM6nLd0TpC8bKs3u" },
  { id: "uz", name: "uzoraecom@gmail.com", email: "uzoraecom@gmail.com", crmId: "Ae9ZcW4qFt7NyR1hVm5o" },
  { id: "bn", name: "barnisorba@gmail.com", email: "barnisorba@gmail.com", crmId: "Qs1BnH8gYk3LxD6pTw0i" },
  { id: "ff", name: "Fahsham Farook", email: "fahsham@fahshamfarook.com", crmId: "Co5MrV2tJe9WqK4zGa7n" },
];

export function runContact(id: string): RunContact {
  return RUN_CONTACTS.find((c) => c.id === id) ?? RUN_CONTACTS[0]!;
}

/** Enrollment events the "All events" filter offers, in the live order. */
export const ENROLLMENT_EVENTS = [
  "All events",
  "Added to workflow",
  "Executed",
  "Finished",
  "Finished waiting",
  "Paused due to draft mode",
  "Processing step",
  "Retry step scheduled",
  "Skipped",
  "Waiting",
  "Error",
] as const;

export type RunStatus = "Finished" | "Executed" | "Added to workflow" | "Waiting" | "Error";

export interface Enrollment {
  /** The execution this enrollment started. */
  executionId: string;
  contactId: string;
  reason: string;
  /** "Sep 29th, 6:35:18 am" — shown on two lines, split at the comma. */
  enrolledAt: string;
  /** ISO, for date-range filtering and sorting. */
  enrolledIso: string;
  currentAction: string;
  status: RunStatus;
  nextExecution: string | null;
  /** The version of the workflow when this run started. */
  version: number;
}

export const ENROLLMENTS: Enrollment[] = [
  { executionId: "01M3NB3N6AXF16PND4KQN3YZ2K", contactId: "gz", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 29th, 6:35:18 am", enrolledIso: "2026-09-29T06:35:18", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 4 },
  { executionId: "01M3MZ8H2QWE7RTY5UIO9PAS1D", contactId: "sg", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 29th, 1:47:18 am", enrolledIso: "2026-09-29T01:47:18", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 4 },
  { executionId: "01M3LX4F6GHJ8KLZ2XCV3BNM4Q", contactId: "lo", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 28th, 11:40:24 pm", enrolledIso: "2026-09-28T23:40:24", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 4 },
  { executionId: "01M3KW9E1RTY6UIO3PAS7DFG2H", contactId: "ia", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 28th, 9:44:46 am", enrolledIso: "2026-09-28T09:44:46", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 4 },
  { executionId: "01M3KV2D8JKL4ZXC9VBN1MQW5E", contactId: "kl", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 28th, 9:39:06 am", enrolledIso: "2026-09-28T09:39:06", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 4 },
  { executionId: "01M3HT7C3ERT5YUI8OPA2SDF6G", contactId: "tn", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 25th, 10:26:02 pm", enrolledIso: "2026-09-25T22:26:02", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 3 },
  { executionId: "01M3HS1B9HJK7LZX4CVB6NMQ3W", contactId: "as", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 25th, 8:58:29 pm", enrolledIso: "2026-09-25T20:58:29", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 3 },
  { executionId: "01M3HR6A4ERT2YUI9OPA5SDF8J", contactId: "tb", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 25th, 10:47:24 am", enrolledIso: "2026-09-25T10:47:24", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 3 },
  { executionId: "01M3GQ3Z7KLZ5XCV1BNM8QWE4R", contactId: "ks", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 24th, 3:40:45 pm", enrolledIso: "2026-09-24T15:40:45", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 3 },
  { executionId: "01M3FP8Y2TYU6IOP3ASD9FGH1K", contactId: "sg", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 23rd, 11:09:23 pm", enrolledIso: "2026-09-23T23:09:23", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 3 },
  { executionId: "01M3EN5X6UIO8PAS2DFG4HJK7L", contactId: "ff", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 22nd, 4:12:09 pm", enrolledIso: "2026-09-22T16:12:09", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 3 },
  { executionId: "01M3DM2W1ZXC9VBN5MQW7ERT3Y", contactId: "gz", reason: "Form Submitted: Project Management Beta", enrolledAt: "Sep 20th, 8:38:23 am", enrolledIso: "2026-09-20T08:38:23", currentAction: "Add Tag", status: "Finished", nextExecution: null, version: 3 },
];

/** Which canvas node a log row belongs to — "Go to action" opens that node. */
export type RunStepNode = "trigger" | "add-tag" | "end";

export interface ExecutionLog {
  id: string;
  executionId: string;
  contactId: string;
  /** "Add Tag", "Add to workflow", "Removed by - End Of Workflow". */
  action: string;
  node: RunStepNode;
  status: RunStatus;
  /** "Sep 29th, 6:35:19 am". */
  executedAt: string;
  executedIso: string;
  /** The Event details drawer's rows. */
  detailAction: string;
  addedFrom: { kind: "Trigger"; name: string };
  stepId: string;
  message: string;
  executedLong: string;
}

function addSeconds(iso: string, s: number): string {
  const d = new Date(`${iso}Z`);
  d.setUTCSeconds(d.getUTCSeconds() + s);
  return d.toISOString().slice(0, 19);
}

function shortStamp(iso: string): string {
  const d = new Date(`${iso}Z`);
  const day = d.getUTCDate();
  const suffix =
    day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
  const month = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  let h = d.getUTCHours();
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${month} ${day}${suffix}, ${h}:${mm}:${ss} ${ampm}`;
}

function longStamp(iso: string): string {
  const d = new Date(`${iso}Z`);
  const month = d.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  return `${month} ${shortStamp(iso).split(" ")[1]} ${d.getUTCFullYear()}, ${shortStamp(iso).split(", ")[1]}`;
}

/**
 * Three log rows per enrollment, newest first, derived rather than typed out
 * so an enrollment and its logs can never disagree about when a run happened.
 */
export const EXECUTION_LOGS: ExecutionLog[] = ENROLLMENTS.flatMap((e, i) => {
  const steps: [string, RunStepNode, RunStatus, string, number, string][] = [
    ["Removed by - End Of Workflow", "end", "Finished", "Remove from workflow", 1, "Stopped due to, execution reached the end of workflow"],
    ["Add Tag", "add-tag", "Executed", "Add contact tag", 0, "Added tag: project management - private beta"],
    ["Add to workflow", "trigger", "Added to workflow", "Add to workflow", 0, "Contact entered the workflow from its trigger"],
  ];
  return steps.map(([action, node, status, detailAction, offset, message], j) => {
    const iso = addSeconds(e.enrolledIso, offset);
    return {
      id: `${e.executionId}-${j}`,
      executionId: e.executionId,
      contactId: e.contactId,
      action,
      node,
      status,
      executedAt: shortStamp(iso),
      executedIso: iso,
      detailAction,
      addedFrom: { kind: "Trigger", name: "Form Submitted" },
      stepId: `2a286e60-f0ed-4aca-8f00-4cb4076b${String(60 + i * 3 + j).padStart(4, "b")}`,
      message,
      executedLong: longStamp(iso),
    };
  });
});

export const LOG_ACTIONS = ["All actions", "Add to workflow", "Add Tag", "Removed by - End Of Workflow"] as const;
export const LOG_STATUSES = ["All statuses", "Added to workflow", "Executed", "Finished", "Waiting", "Error"] as const;

/**
 * Where the Execution logs facet is, as data.
 *
 * Owned by workflow-detail so Enrollment history can send you straight into
 * one run ("View execution history") or its path ("See contact execution
 * path") — the two facets meet through this value and nothing else.
 */
export type LogsView =
  | { kind: "all" }
  | { kind: "contact"; contactId: string }
  | { kind: "execution"; contactId: string; executionId: string }
  | { kind: "path"; contactId: string; executionId: string };
