import type { AvatarTone } from "@/components/contacts/contacts-data";
import { ME, TEAMMATES } from "@/components/product/conversations/conversations-data";
import { workflows } from "@/components/automation/workflows-data";

/**
 * Conversations ▸ Manual actions — the seed and its vocabulary.
 *
 * A manual action is a step a workflow or campaign parks for a person: the
 * automation got as far as "call this contact" or "text this contact" and
 * handed the rest to whoever it is assigned to.
 */

export type ManualActionType = "call" | "sms";
export type ManualActionStatus = "in_progress" | "yet_to_start" | "completed" | "skipped";
export type ManualActionSource = "workflow" | "campaign";

export interface Person {
  name: string;
  tone: AvatarTone;
}

export interface ManualAction {
  id: string;
  contact: Person & { phone: string };
  workflow: string;
  source: ManualActionSource;
  assignee: Person;
  type: ManualActionType;
  status: ManualActionStatus;
  /** Epoch ms, built from local components so server and client agree. */
  added: number;
  /** The SMS the step drafted, for SMS actions. */
  message?: string;
}

export const TYPE_LABEL: Record<ManualActionType, string> = {
  call: "Call",
  sms: "SMS",
};

export const STATUS_LABEL: Record<ManualActionStatus, string> = {
  in_progress: "In progress",
  yet_to_start: "Yet to start",
  completed: "Completed",
  skipped: "Skipped",
};

export const SOURCE_LABEL: Record<ManualActionSource, string> = {
  workflow: "Workflows",
  campaign: "Campaigns",
};

const RONAK: Person = { name: "Ronak Jindal", tone: "blue" };
const SHUBHAM: Person = { name: "Shubham Gupta", tone: "purple" };
const me: Person = { name: ME.name, tone: ME.tone };
const aarat: Person = { name: TEAMMATES[0].name, tone: TEAMMATES[0].tone };
const prathamesh: Person = { name: TEAMMATES[4].name, tone: TEAMMATES[4].tone };
const samrina: Person = { name: TEAMMATES[6].name, tone: TEAMMATES[6].tone };

const wf = (id: string) => workflows.find((w) => w.id === id)?.name ?? id;
const at = (m: number, d: number, h: number, min: number) => new Date(2026, m - 1, d, h, min).getTime();

const POWER_DIALLER = "Power dialler automation testing Ronak/Shubham";

export const SEED_ACTIONS: ManualAction[] = [
  {
    id: "ma-1",
    contact: { ...RONAK, phone: "(415) 555-0147" },
    workflow: POWER_DIALLER,
    source: "workflow",
    assignee: RONAK,
    type: "call",
    status: "in_progress",
    added: at(9, 21, 19, 17),
  },
  {
    id: "ma-2",
    contact: { ...RONAK, phone: "(415) 555-0147" },
    workflow: POWER_DIALLER,
    source: "workflow",
    assignee: RONAK,
    type: "call",
    status: "yet_to_start",
    added: at(9, 21, 19, 17),
  },
  {
    id: "ma-3",
    contact: { name: "Maria Lopez", tone: "pink", phone: "(212) 555-0198" },
    workflow: wf("w4"),
    source: "workflow",
    assignee: me,
    type: "sms",
    status: "yet_to_start",
    added: at(9, 24, 10, 5),
    message: "Hi Maria, sorry we missed your call. When's a good time to call you back?",
  },
  {
    id: "ma-4",
    contact: { name: "Daniel Brooks", tone: "green", phone: "(646) 555-0132" },
    workflow: wf("w2"),
    source: "workflow",
    assignee: aarat,
    type: "call",
    status: "yet_to_start",
    added: at(9, 25, 14, 40),
  },
  {
    id: "ma-5",
    contact: { name: "Priya Nair", tone: "orange", phone: "(312) 555-0176" },
    workflow: "Spring reactivation",
    source: "campaign",
    assignee: prathamesh,
    type: "sms",
    status: "completed",
    added: at(9, 18, 9, 12),
    message: "Hi Priya, it's been a while! Book your spring tune-up this week and get 15% off.",
  },
  {
    id: "ma-6",
    contact: { name: "Tom Becker", tone: "teal", phone: "(503) 555-0121" },
    workflow: wf("w6"),
    source: "workflow",
    assignee: me,
    type: "sms",
    status: "skipped",
    added: at(9, 17, 16, 48),
    message: "Hi Tom, you were almost done booking. Want us to hold your 3:00 PM slot?",
  },
  {
    id: "ma-7",
    contact: { name: "Grace Kim", tone: "yellow", phone: "(617) 555-0164" },
    workflow: wf("w3"),
    source: "workflow",
    assignee: samrina,
    type: "call",
    status: "yet_to_start",
    added: at(9, 27, 11, 30),
  },
  {
    id: "ma-8",
    contact: { name: "Haris Saeed", tone: "purple", phone: "(206) 555-0189" },
    workflow: "Spring reactivation",
    source: "campaign",
    assignee: SHUBHAM,
    type: "sms",
    status: "in_progress",
    added: at(9, 28, 8, 55),
    message: "Hi Haris, your last service was 6 months ago. Reply YES and we'll book you in.",
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Sep 21, 2026 7:17 PM" — the HighRise date-and-time shape for data. */
export function formatStamp(ms: number) {
  const d = new Date(ms);
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
}

export function isPending(a: ManualAction) {
  return a.status === "yet_to_start" || a.status === "in_progress";
}
