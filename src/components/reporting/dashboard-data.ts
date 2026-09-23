/** Seeded numbers for the reporting dashboards. Fixed, so a demo repeats. */

export interface Dashboard {
  id: string;
  label: string;
  /** What the switcher says under the name. */
  meta: string;
}

export const dashboards: Dashboard[] = [
  {
    id: "comms",
    label: "Customer Communication Insights Dashboard",
    meta: "Shared · updated 2 hours ago",
  },
  { id: "sales", label: "Sales pipeline health", meta: "Private · updated yesterday" },
  { id: "marketing", label: "Marketing attribution", meta: "Shared · updated Sep 18" },
  { id: "support", label: "Support response times", meta: "Shared · updated Sep 12" },
];

export const DAYS = [
  "Aug 25", "Aug 27", "Aug 29", "Aug 31", "Sep 2", "Sep 4", "Sep 6", "Sep 8",
  "Sep 10", "Sep 12", "Sep 14", "Sep 16", "Sep 18", "Sep 20", "Sep 22",
];

export const conversationVolume = [
  { label: "Inbound", values: [412, 468, 441, 502, 538, 497, 566, 604, 588, 641, 672, 630, 698, 726, 754] },
  { label: "Outbound", values: [388, 402, 421, 444, 460, 438, 489, 512, 505, 548, 571, 559, 588, 601, 624] },
];

export const responseMinutes = [
  { label: "First response", values: [34, 31, 33, 28, 26, 29, 24, 22, 23, 19, 18, 20, 17, 16, 14] },
  { label: "Resolution", values: [186, 174, 181, 168, 159, 163, 148, 142, 145, 133, 128, 131, 122, 119, 112] },
];

export const channelVolume = [
  { label: "WhatsApp", value: 4820 },
  { label: "SMS", value: 3140 },
  { label: "Email", value: 2760 },
  { label: "Calls", value: 1290 },
  { label: "Web chat", value: 880 },
];

export const statusSplit = [
  { label: "Unread", value: 1462 },
  { label: "Awaiting reply", value: 934 },
  { label: "Resolved", value: 3218 },
  { label: "Snoozed", value: 386 },
];

export const topAgents = [
  { label: "Samrina Shabha", value: 486 },
  { label: "Johnny Niumata", value: 412 },
  { label: "Erik Isbrandt", value: 377 },
  { label: "Rodrigo Greco", value: 298 },
  { label: "Cristobal Gomez", value: 241 },
];

export const recentThreads = [
  { contact: "Sukarto Sudjono", channel: "WhatsApp", waiting: "3m", owner: "Samrina Shabha", status: "Unread" },
  { contact: "Pietro Mauro", channel: "Email", waiting: "11m", owner: "Johnny Niumata", status: "Awaiting reply" },
  { contact: "Johnny Niumata", channel: "SMS", waiting: "47m", owner: "Unassigned", status: "Unread" },
  { contact: "Business 360 Marketing", channel: "WhatsApp", waiting: "1h 12m", owner: "Erik Isbrandt", status: "Awaiting reply" },
  { contact: "Rodrigo Greco Palmeira", channel: "WhatsApp", waiting: "2h 04m", owner: "Samrina Shabha", status: "Unread" },
  { contact: "Mohammad Alfarhan", channel: "Email", waiting: "3h 38m", owner: "Cristobal Gomez", status: "Snoozed" },
];

export const tiles = [
  { label: "Unread conversations", value: "1,462", delta: "+12.4%", up: true, spark: [980, 1020, 1105, 1080, 1210, 1288, 1340, 1462] },
  { label: "Avg first response", value: "14m", delta: "−38%", up: false, spark: [34, 31, 28, 26, 22, 19, 17, 14] },
  { label: "Messages sent", value: "12,890", delta: "+6.1%", up: true, spark: [9800, 10250, 10870, 11040, 11560, 11980, 12440, 12890] },
  { label: "Resolution rate", value: "86%", delta: "+3.2 pts", up: true, spark: [74, 76, 79, 78, 81, 83, 84, 86] },
];
