/**
 * The fiction behind AI Agents ▸ Voice AI — the agent list and one agent open.
 *
 * Split out for the reason funnels-data and workflows-data are: the list and
 * the builder read the same agent, and an agent called "My Agent 629" in the
 * table and "Voice agent" in the trail is the seam a reviewer spots in a
 * screenshot before they see the thing the screenshot was taken for.
 *
 * Transcribed from the live product's own screens rather than invented, down
 * to the ugly names — `gtr5y`, `Test 2`, `whatsapp test`. That is not colour.
 * A Voice AI list in a real sub-account is mostly abandoned experiments with
 * zero numbers attached, and a table of tidy names ("Sales qualifier",
 * "Support triage") would quietly make the density argument easier than it is.
 * The dashes in Numbers and Widgets are the same point: most rows carry
 * nothing, and the columns still have to hold their width.
 */

/**
 * A row in the agent list.
 *
 * Folders and agents share one shape because the real table sorts them
 * together in one body — there is no folder band above the agents. `count` is
 * what separates them and is null on an agent, rather than the row carrying a
 * `kind` that would then be read twice (once to pick the glyph, once to decide
 * whether the count renders).
 */
export interface VoiceAgentRow {
  id: string;
  name: string;
  /** Agents inside a folder. Null means this row IS an agent. */
  count: number | null;
  /** The number the agent answers on, pre-formatted. Null renders the dash. */
  number: string | null;
  /** Two lines in one cell: the day, then the time under it. */
  updatedDate: string;
  updatedTime: string;
}

export const voiceAgentRows: readonly VoiceAgentRow[] = [
  { id: "va-newtest", name: "new test", count: 3, number: null, updatedDate: "21 May 2026", updatedTime: "11:27 PM" },
  { id: "va-gtr5y", name: "gtr5y", count: 0, number: null, updatedDate: "21 May 2026", updatedTime: "10:04 PM" },
  { id: "va-test2", name: "Test 2", count: 2, number: null, updatedDate: "19 May 2026", updatedTime: "4:41 PM" },
  { id: "va-whatsapp", name: "whatsapp test", count: null, number: "+1 (415) 555-0142", updatedDate: "19 May 2026", updatedTime: "2:13 PM" },
  { id: "va-lock", name: "Lock AI", count: null, number: "+1 (628) 555-0175", updatedDate: "18 May 2026", updatedTime: "9:58 AM" },
  { id: "va-629", name: "My Agent 629", count: null, number: "+1 (312) 555-0198", updatedDate: "17 May 2026", updatedTime: "6:22 PM" },
  { id: "va-archive", name: "Archive — 2025 agents", count: 7, number: null, updatedDate: "16 May 2026", updatedTime: "11:40 AM" },
  { id: "va-intake", name: "Front desk intake", count: null, number: "+1 (206) 555-0110", updatedDate: "15 May 2026", updatedTime: "8:05 PM" },
  { id: "va-441", name: "My Agent 441", count: null, number: null, updatedDate: "14 May 2026", updatedTime: "3:36 PM" },
  { id: "va-demo", name: "demo demo demo", count: null, number: null, updatedDate: "12 May 2026", updatedTime: "1:19 PM" },
  { id: "va-spanish", name: "Spanish callback", count: null, number: "+1 (786) 555-0163", updatedDate: "09 May 2026", updatedTime: "7:47 AM" },
  { id: "va-sandbox", name: "Sandbox", count: 1, number: null, updatedDate: "06 May 2026", updatedTime: "5:02 PM" },
];

/**
 * The agent the builder opens with when the list is skipped.
 *
 * A named constant rather than `voiceAgentRows[0]`, because the first row is a
 * folder and folders do not open into the builder. Clicking any agent row
 * re-labels the trail; the prompt below is the same in every case, which is
 * the honest limit of a static prototype and not worth twelve copies of.
 */
export const defaultVoiceAgent = "My Agent 629";

/**
 * The prompt, as one string with its own newlines.
 *
 * Deliberately long and deliberately shaped like the real thing — headed
 * sections in caps, numbered rules, a call flow at the bottom. The left column
 * is being judged on whether a prompt of realistic LENGTH is still workable
 * beside two other columns, and a four-line lorem prompt would answer a
 * question nobody asked. It scrolls; that is the finding the column is here to
 * produce.
 */
export const voiceAgentPrompt = `## AGENT ROLE & OBJECTIVE

You are Riley, the front-desk voice assistant for Northgate Dental. Your
objective on every call is to identify why the caller is ringing, answer it if
you can, and book or route them if you cannot. You are not a salesperson and
you never quote a price you have not been given below.

Speak in short sentences. One question at a time. Never read a list of more
than three options aloud.

## HANDLING CALLER QUERIES

1. Opening hours — Mon to Thu 8:00 AM–6:00 PM, Fri 8:00 AM–4:00 PM. Closed
   weekends and public holidays.
2. Location — 1140 Northgate Way, Suite 210. Parking is free in the rear lot.
3. New patients — yes, we are accepting them. Collect name, phone and reason
   for the visit, then offer the first two open slots.
4. Emergencies — if the caller says "bleeding", "knocked out", "swelling" or
   "severe pain", stop the script and transfer immediately.
5. Insurance — confirm the carrier name only. Do NOT confirm coverage,
   deductibles or whether a specific procedure is covered.
6. Billing questions — take a message and promise a callback within one
   business day.

## GENERAL RULES

- Never invent an appointment time. Only offer the slots returned by the
  calendar action.
- Never say you are an AI unless the caller asks directly. If they ask, say
  yes, plainly, and continue.
- If the caller interrupts, stop talking immediately and listen.
- If you have not understood twice in a row, apologise once and transfer.
- Do not collect card numbers, social security numbers or full dates of birth
  on this line.
- End every call by repeating back the booked time and the practice name.

## STRUCTURED CALL FLOW SCRIPT

Step 1 — Greet, then ask how you can help.
Step 2 — Classify: booking, rescheduling, question, emergency, other.
Step 3 — If booking, collect name and preferred day, then call
  \`check_availability\` and offer the first two slots.
Step 4 — Confirm the slot out loud, then call \`book_appointment\`.
Step 5 — Offer to send the confirmation over WhatsApp. If yes, call
  \`send_whatsapp\`.
Step 6 — Ask if there is anything else. If not, thank them and hang up.`;

/** The greeting, and the counter under the textarea that counts it. */
export const voiceWelcomeMessage =
  "Hi, thanks for calling Northgate Dental, this is Riley. How can I help you today?";

/**
 * An action the agent can take, grouped by when it can take it.
 *
 * `during` and `after` are two genuinely different contracts — one runs while
 * the caller is on the line and can change what the agent says next, the other
 * runs against a finished transcript — so they are a grouped list rather than
 * one flat set with a badge. The AFTER group ships empty on purpose: the empty
 * state inside a populated card is the part of this pattern that usually goes
 * undesigned, and it is on screen here so it can be looked at.
 */
export interface VoiceAction {
  id: string;
  label: string;
  /** The handler's own name, shown under the label the way the product does. */
  handler: string;
  phase: "during" | "after";
}

export const voiceActions: readonly VoiceAction[] = [
  { id: "act-whatsapp", label: "Send WhatsApp message", handler: "send_whatsapp", phase: "during" },
  { id: "act-end", label: "End call", handler: "Hangup prompt", phase: "during" },
];

/**
 * The configuration the middle column keeps folded away.
 *
 * All five ship collapsed, which is the claim this column is making: an agent
 * is defined by its prompt and its actions, and everything below is a setting
 * you visit once. Each carries a one-line summary so a closed accordion still
 * says whether it has been touched — a stack of five bare chevrons tells you
 * nothing about the agent and is the version of this pattern worth arguing
 * against.
 */
export interface VoiceSection {
  id: string;
  label: string;
  summary: string;
}

export const voiceSections: readonly VoiceSection[] = [
  { id: "kb", label: "Knowledge base", summary: "2 sources connected" },
  { id: "translation", label: "Translation", summary: "Off" },
  { id: "postcall", label: "Post-Call", summary: "Transcript and summary" },
  { id: "reporting", label: "Reporting", summary: "Default metrics" },
  { id: "outbound", label: "Outbound Settings", summary: "Not configured" },
];
