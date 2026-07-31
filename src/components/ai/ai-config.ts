import {
  ListFilter,
  PenLine,
  Search,
  Waypoints,
  Wand2,
  type LucideIcon,
} from "lucide-react";

/**
 * What the AI surface offers and what it answers with.
 *
 * The old three prompts were all one shape — a question with no object. These
 * are written against the five things a user actually comes to the assistant
 * for, so the list reads as a menu of capabilities rather than a list of
 * questions: find something, ask about it, draft a message, explain what the
 * system did, build a saved thing. Every prompt names a real object (a count, a
 * date range, a workflow) because a vague prompt produces a vague answer, and
 * the suggestion is also the demo.
 *
 * Copy follows the HighRise rules: sentence case, numerals, MM/DD/YYYY dates,
 * verb-first for anything that acts.
 */

export type AiIntent = "find" | "ask" | "draft" | "explain" | "build";

/** The tile icon each intent gets, so the list is scannable by shape. */
export const AI_INTENT_ICONS: Record<AiIntent, LucideIcon> = {
  find: Search,
  ask: ListFilter,
  draft: PenLine,
  explain: Waypoints,
  build: Wand2,
};

export interface AiReply {
  /** The lede. One or two sentences, always with a concrete number in it. */
  answer: string;
  /** Follow-on actions. Verb-first. */
  points?: string[];
  /** A composed message, shown as a quoted block. */
  draft?: string;
}

export interface AiSuggestion {
  id: string;
  intent: AiIntent;
  /** What actually gets asked. Full sentence — this is what the answer replies to. */
  prompt: string;
  /**
   * The nav-width label. 272px minus the icon and padding is about 26
   * characters, and three two-line rows turn a glance into a read, so the tray
   * shows the gist and the window shows the question in full.
   */
  short: string;
  reply: AiReply;
}

/**
 * Nine prompts, shown three at a time. A pool rather than a fixed trio so the
 * dock can offer a different slice without ever showing something the user has
 * no context for — every one of these is answerable from Contacts.
 */
export const AI_SUGGESTIONS: AiSuggestion[] = [
  {
    id: "no-email",
    intent: "find",
    prompt: "Show contacts with no email address",
    short: "Contacts with no email",
    reply: {
      answer:
        "412 of your 5,286 contacts have no email on file. Most of them came in through the call widget, which never asks for one.",
      points: [
        "Add an email field to the call widget form",
        "Text the 412 asking for an address",
        "Save this as a smart list to watch it shrink",
      ],
    },
  },
  {
    id: "cold-leads",
    intent: "ask",
    prompt: "Which leads went cold in the last 14 days?",
    short: "Leads that went cold",
    reply: {
      answer:
        "38 leads have not replied since 07/17/2026. 24 of them opened your last email but never clicked through.",
      points: [
        "Send the 24 openers a shorter follow-up",
        "Move the other 14 to the re-engagement workflow",
        "Set a reminder to check again on 08/14/2026",
      ],
    },
  },
  {
    id: "follow-up",
    intent: "draft",
    prompt: "Draft a follow-up for today's new leads",
    short: "Draft today's follow-ups",
    reply: {
      answer:
        "Here is a follow-up for the 12 leads who came in today. It names the page each one converted on, so it does not read as a blast.",
      draft:
        "Hi {{first_name}} — thanks for looking at the pricing page earlier. I put together a 2 minute walkthrough of the plan that fits a team your size. Want me to send it over?",
      points: ["Review and send to 12 contacts", "Schedule it for 9:00 AM tomorrow"],
    },
  },
  {
    id: "workflow-stopped",
    intent: "explain",
    prompt: "Why did the welcome workflow stop?",
    short: "Why a workflow stopped",
    reply: {
      answer:
        "It paused on 07/28/2026 at 3:12 PM. The send SMS step failed for 9 contacts because their phone numbers were never verified, and the workflow is set to halt on error.",
      points: [
        "Verify the 9 numbers and resume",
        "Add an email fallback after the SMS step",
        "Change the step to skip on error instead of halting",
      ],
    },
  },
  {
    id: "smart-list",
    intent: "build",
    prompt: "Build a smart list of unresponsive leads",
    short: "Build a smart list",
    reply: {
      answer:
        "I can build one from 3 conditions: no reply in 14 days, no booked appointment, and at least 1 email opened. It matches 38 contacts right now.",
      points: ["Create the smart list", "Adjust the conditions first"],
    },
  },
  {
    id: "summarize",
    intent: "ask",
    prompt: "Summarize this smart list in 3 points",
    short: "Summarize this list",
    reply: {
      answer: "1,284 contacts, added over the last 90 days.",
      points: [
        "62% arrived from paid search, up from 41% last quarter",
        "Average time to first reply is 4 hours 20 minutes",
        "Only 9% have booked — the drop-off is at the pricing email",
      ],
    },
  },
  {
    id: "duplicates",
    intent: "find",
    prompt: "Find duplicate contacts by phone number",
    short: "Find duplicate contacts",
    reply: {
      answer:
        "94 phone numbers appear on more than one contact, covering 203 records. 61 of those pairs also share a last name, so they are near-certain duplicates.",
      points: [
        "Merge the 61 confident matches",
        "Review the remaining 33 by hand",
        "Turn on duplicate detection for new contacts",
      ],
    },
  },
  {
    id: "sms-july",
    intent: "draft",
    prompt: "Write an SMS for everyone who booked in July",
    short: "Text July bookings",
    reply: {
      answer:
        "148 contacts booked between 07/01/2026 and 07/31/2026. Here is a message short enough to land in 1 segment.",
      draft:
        "Hi {{first_name}}, it's Sarah at Northgate. You're booked for {{appointment_time}} — reply C to confirm or R to reschedule.",
      points: ["Send to 148 contacts", "Send only to the 39 who have not confirmed"],
    },
  },
  {
    id: "compare",
    intent: "explain",
    prompt: "Compare this month's conversions to last month",
    short: "Compare month over month",
    reply: {
      answer:
        "July closed at 214 conversions against June's 176 — up 22%. The gain is almost entirely the 2 new landing pages you launched on 07/09/2026.",
      points: [
        "Break the numbers down by source",
        "Show which pages lost volume",
        "Add this comparison to a dashboard",
      ],
    },
  },
];

/** Prompts shown at once, in the dock and in the window's empty state. */
export const AI_PAGE_SIZE = 3;

/**
 * A wrapping slice of the pool. Wrapping rather than clamping so shuffling
 * never dead-ends on a short final page, and index-based rather than random so
 * the server and client render the same thing.
 */
export function suggestionPage(page: number, size = AI_PAGE_SIZE): AiSuggestion[] {
  const start = (page * size) % AI_SUGGESTIONS.length;
  return Array.from(
    { length: size },
    (_, i) => AI_SUGGESTIONS[(start + i) % AI_SUGGESTIONS.length],
  );
}

/**
 * Honest about what this is. A prototype that invented an answer to a typed
 * question would be demoing a model it does not have; what it is actually
 * demoing is how an answer arrives, so free text says so and points back at
 * the prompts that have real content behind them.
 */
export const AI_FALLBACK_REPLY: AiReply = {
  answer:
    "This prototype does not run a model yet — it is here to show how an answer arrives, not to write one. Pick one of the suggested prompts to see a full response.",
};

/** Exact-match lookup, so a picked suggestion always gets its own answer. */
export function replyFor(prompt: string): AiReply {
  const normalized = prompt.trim().toLowerCase();
  const match = AI_SUGGESTIONS.find((s) => s.prompt.toLowerCase() === normalized);
  return match ? match.reply : AI_FALLBACK_REPLY;
}

/**
 * The surface the assistant is scoped to. Hard-coded because the prototype only
 * has one page; in the real app this comes from the route, and it is shown in
 * the window's header so the scope of an answer is never a guess.
 */
export const AI_CONTEXT_LABEL = "Contacts";
