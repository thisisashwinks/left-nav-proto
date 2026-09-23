/**
 * The rows, steps and transcript behind Content ▸ Sites ▸ Funnel.
 *
 * Split out for the same reason workflows-data is: the three screens here all
 * read the same fiction, and a funnel that is called one thing in the list and
 * another in the trail is the kind of seam a reviewer spots in a screenshot
 * before they see the thing the screenshot was taken for.
 *
 * Fabricated, but plausible — the opposite of the demo stage's skeleton rows.
 * The stage is grey bars because the page it lives on exists to demo the
 * header; these screens exist to be judged AS funnel screens, and a table of
 * grey bars cannot be judged as one.
 */

/**
 * A row in the funnel list.
 *
 * Folders and funnels share one shape because the real list mixes them in one
 * table and sorts them together — the only difference is what the count column
 * counts, which is why `count` carries its own noun rather than the row's kind
 * being read twice.
 */
export interface FunnelRow {
  id: string;
  name: string;
  kind: "folder" | "funnel";
  /** Relative, the way every "last updated" column in this prototype reads. */
  updated: string;
  /** "4 Funnels" / "7 Steps" — the noun belongs to the row, not the column. */
  count: string;
}

export const funnelRows: readonly FunnelRow[] = [
  { id: "f-coaching", name: "Coaching offers", kind: "folder", updated: "2 hours ago", count: "6 Funnels" },
  { id: "f-webinar", name: "Webinar registration", kind: "funnel", updated: "4 hours ago", count: "5 Steps" },
  { id: "f-meeting", name: "Book a meeting", kind: "funnel", updated: "Yesterday", count: "3 Steps" },
  { id: "f-leadmagnet", name: "Lead magnet — SEO checklist", kind: "funnel", updated: "Yesterday", count: "4 Steps" },
  { id: "f-seasonal", name: "Seasonal campaigns", kind: "folder", updated: "2 days ago", count: "9 Funnels" },
  { id: "f-trial", name: "Free trial signup", kind: "funnel", updated: "3 days ago", count: "6 Steps" },
  { id: "f-consult", name: "Free consultation", kind: "funnel", updated: "4 days ago", count: "3 Steps" },
  { id: "f-archive", name: "Archive 2025", kind: "folder", updated: "6 days ago", count: "14 Funnels" },
  { id: "f-upsell", name: "Order form + upsell", kind: "funnel", updated: "1 week ago", count: "7 Steps" },
  { id: "f-newsletter", name: "Newsletter opt-in", kind: "funnel", updated: "1 week ago", count: "2 Steps" },
  { id: "f-realestate", name: "Property valuation", kind: "funnel", updated: "2 weeks ago", count: "5 Steps" },
  { id: "f-clients", name: "Client onboarding", kind: "folder", updated: "3 weeks ago", count: "4 Funnels" },
  { id: "f-vsl", name: "VSL — agency offer", kind: "funnel", updated: "1 month ago", count: "4 Steps" },
  { id: "f-quiz", name: "Quiz funnel", kind: "funnel", updated: "1 month ago", count: "8 Steps" },
];

/**
 * One step of an opened funnel.
 *
 * A single step for now, and deliberately: the detail screen's argument is
 * about the step ▸ variation relationship — a CONTROL that exists and a
 * VARIATION that does not yet — and a column of eight rows would push the
 * empty variation card, which is the thing being looked at, below the fold.
 */
export interface FunnelStep {
  id: string;
  name: string;
  /** Shown whole, the way the real panel shows it — operators copy this. */
  url: string;
  path: string;
}

export const funnelSteps: readonly FunnelStep[] = [
  {
    id: "step-booking",
    name: "Book a meeting",
    url: "https://link.mycompany.com/book-a-meeting",
    path: "/book-a-meeting",
  },
];

/**
 * The transcript the AI builder opens on.
 *
 * Two turns, not one: a single prompt with no answer shows the composer but
 * not the SHAPE of the conversation, and the shape — how far the assistant's
 * reply pushes the composer down, how a long reply scrolls against a fixed
 * preview — is most of what the layout has to survive.
 */
export interface BuilderMessage {
  id: string;
  role: "user" | "assistant";
  /** Paragraphs, so the reply can carry a lead-in and a next-step line. */
  body: readonly string[];
  /** Assistant only: the bulleted "what I built" list under the lead-in. */
  bullets?: readonly string[];
}

export const builderTranscript: readonly BuilderMessage[] = [
  {
    id: "m1",
    role: "user",
    body: [
      "Create a landing page where people can book a 30 minute meeting with me. Dark hero with our logo, then the calendar below it.",
    ],
  },
  {
    id: "m2",
    role: "assistant",
    body: [
      "Done — I built a single-step booking page and connected it to your Meeting calendar.",
    ],
    bullets: [
      "A dark hero with your logo, headline and a one-line subtitle",
      "A booking card with the month calendar and time slots side by side",
      "Timezone detection, set to America / New York",
    ],
  },
  {
    id: "m3",
    role: "assistant",
    body: [
      "Next, tell me what to change — try “make the hero lighter”, “add a testimonial under the calendar”, or select a section on the right and ask for an edit there.",
    ],
  },
];

/** The dummy page the preview column draws. See funnel-ai-preview. */
export const previewPage = {
  brand: "NORTHSIDE",
  title: "Book a meeting",
  subtitle: "Pick a time that works for you. We will send the link straight to your inbox.",
  eventName: "Discovery call",
  duration: "30 min",
  month: "September 2026",
  /** Sep 2026 starts on a Tuesday, so the grid is offset by two. */
  monthOffset: 2,
  days: 30,
  /** Bookable dates — everything else in the grid is drawn as unavailable. */
  open: [8, 9, 10, 11, 15, 16, 17, 18, 22, 23, 24, 25, 29, 30],
  selected: 23,
  slots: ["9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "1:00 PM"],
  timezone: "America / New York (GMT-4)",
} as const;

/**
 * The four numbers the Stats tab opens with.
 *
 * Added Sep 23 with the tab strip, and kept as data rather than inlined in the
 * panel for the same reason the rows are: the detail screen is meant to be
 * judged AS a funnel screen, and a component that hard-codes "1,284" is one
 * nobody can restate the fiction of without editing JSX.
 *
 * Pre-formatted strings, not numbers. Every count in this prototype is —
 * `FunnelRow.count` carries its own noun for the same reason. A formatter here
 * would be a locale decision made by a mock.
 */
export interface FunnelMetric {
  label: string;
  value: string;
  /** Period-over-period, already signed. Omit where there is no comparison. */
  delta?: string;
  /** Whether `delta` is good news — drawn in brand, not green: the palette has
   *  no green, and inventing one for a stat tile would be a new colour token
   *  arriving through the back door of a demo screen. */
  up?: boolean;
}

export const funnelMetrics: readonly FunnelMetric[] = [
  { label: "Page views", value: "1,284", delta: "+12%", up: true },
  { label: "Opt-ins", value: "318", delta: "+8%", up: true },
  { label: "Conversion rate", value: "24.8%", delta: "-1.4%", up: false },
  { label: "Revenue", value: "$4,720", delta: "+21%", up: true },
];

/**
 * The same numbers cut by step.
 *
 * Keyed by `stepId` rather than positional, so a step that gains a row in
 * `funnelSteps` does not silently inherit the one below it. The panel prints an
 * em dash where there is no match — a zero would be a measurement, and would
 * read as a step nobody visited, which is a different and much worse claim than
 * "the fiction does not cover this yet".
 */
export interface FunnelStepStat {
  stepId: string;
  views: string;
  conversions: string;
  rate: string;
}

export const funnelStepStats: readonly FunnelStepStat[] = [
  { stepId: "step-booking", views: "1,284", conversions: "318", rate: "24.8%" },
];
