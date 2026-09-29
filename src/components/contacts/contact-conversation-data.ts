import type { Contact } from "./contacts-data";

/**
 * The data behind the contact page's conversation column: what a thread is
 * made of, the filters that cut it, the templates WhatsApp allows outside its
 * 24-hour window, and the seed history each contact opens with.
 *
 * Kept apart from the inbox's `contact-thread` on purpose. The inbox thread is
 * a conversation; this one is a RECORD's timeline, so it also carries the CRM
 * events (appointments, payments, DnD changes) the channel filter has to be
 * able to switch off — a shape the inbox never needed.
 */

/* ─── Channels and filters ──────────────────────────────────────────────── */

/** Everything the channel filter can switch on or off, in menu order. */
export type ThreadChannel =
  | "sms"
  | "call"
  | "whatsapp"
  | "email"
  | "internal"
  | "contacts"
  | "appointments"
  | "opportunities"
  | "payments"
  | "invoice"
  | "ai"
  | "sla"
  | "wa-permission";

export const FILTER_OPTIONS: { id: ThreadChannel; label: string; group: "conversations" | "activities" }[] = [
  { id: "sms", label: "SMS / RCS", group: "conversations" },
  { id: "call", label: "Call", group: "conversations" },
  { id: "whatsapp", label: "WhatsApp", group: "conversations" },
  { id: "email", label: "Email", group: "conversations" },
  { id: "internal", label: "Internal Comment", group: "conversations" },
  { id: "contacts", label: "Contacts", group: "activities" },
  { id: "appointments", label: "Appointments", group: "activities" },
  { id: "opportunities", label: "Opportunities", group: "activities" },
  { id: "payments", label: "Payments", group: "activities" },
  { id: "invoice", label: "Invoice", group: "activities" },
  { id: "ai", label: "AI Action Logs", group: "activities" },
  { id: "sla", label: "SLA", group: "activities" },
  { id: "wa-permission", label: "WhatsApp Permission", group: "activities" },
];

export const ALL_CHANNELS: ThreadChannel[] = FILTER_OPTIONS.map((o) => o.id);

/** The four channels a message can be written on. */
export type ComposerChannel = "sms" | "whatsapp" | "email" | "internal";

export const COMPOSER_CHANNELS: { id: ComposerChannel; label: string }[] = [
  { id: "sms", label: "SMS / RCS" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "email", label: "Email" },
  { id: "internal", label: "Internal Comment" },
];

/* ─── Thread items ──────────────────────────────────────────────────────── */

export type DeliveryStatus = "sending" | "delivered" | "read" | "failed";

/** Which glyph an event pill wears; resolved to a lucide icon in the view. */
export type EventIcon =
  | "bell"
  | "user"
  | "calendar"
  | "target"
  | "dollar"
  | "file"
  | "sparkles"
  | "timer"
  | "shield";

export type ThreadItem =
  | {
      kind: "message";
      id: string;
      channel: "sms" | "whatsapp";
      direction: "in" | "out";
      /** Plain text; `**x**` is bold, newlines are kept. */
      body: string;
      time: string;
      status?: DeliveryStatus;
      /** A WhatsApp template: green header block and a CTA under the bubble. */
      template?: { button: string };
    }
  | {
      kind: "email";
      id: string;
      channel: "email";
      direction: "in" | "out";
      from: string;
      fromInitials: string;
      fromAddress: string;
      to: string;
      subject: string;
      body: string;
      time: string;
      /** Shown as a ⚠ beside the time — a bounce on one of the recipients. */
      warning?: string;
    }
  | {
      kind: "call";
      id: string;
      channel: "call";
      direction: "in" | "out";
      duration: string;
      time: string;
    }
  | {
      kind: "note";
      id: string;
      channel: "internal";
      author: string;
      authorInitials: string;
      body: string;
      time: string;
    }
  | {
      kind: "event";
      id: string;
      channel: Exclude<ThreadChannel, "sms" | "call" | "whatsapp" | "email" | "internal">;
      icon: EventIcon;
      /** `**x**` is bold, like a message body. */
      text: string;
      time: string;
    };

/** The signed-in user — who everything sent from the composer is from. */
export const ME = { name: "Ashwin K S", initials: "AK" };

/** The account's own WhatsApp senders, for the composer's From row. */
export const FROM_NUMBERS = ["+1 548-290-8685", "+1 548-290-1142"];
export const FROM_EMAIL = "product@highlevel.com";

/* ─── Deterministic per-contact values ──────────────────────────────────── */

/** A small stable hash, so every contact always gets the same history. */
export function hashOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function firstName(contact: Contact) {
  return contact.name.trim().split(/\s+/)[0];
}

/*
 * A phone number per contact, in the formats the live account's screenshots
 * show — US, Dutch and Spanish — so the call popover and the composer's To
 * row read like real records rather than one number repeated.
 */
export function contactPhone(contact: Contact) {
  const h = hashOf(contact.id);
  const d = (n: number) => String((Math.floor(h / 10 ** n) + n * 7) % 10);
  switch (h % 3) {
    case 0:
      return `+1 914 ${d(1)}${d(2)}${d(3)} ${d(4)}${d(5)}${d(6)}${d(7)}`;
    case 1:
      return `+31 6 ${d(1)}${d(2)}${d(3)}${d(4)}${d(5)}${d(6)}${d(7)}${d(8)}`;
    default:
      return `+34 684 ${d(1)}${d(2)} ${d(3)}${d(4)} ${d(5)}${d(6)}`;
  }
}

export function contactEmail(contact: Contact) {
  return (
    contact.email ??
    `${contact.name.trim().toLowerCase().replace(/\s+/g, ".")}@gmail.com`
  );
}

const SUB_ACCOUNTS = [
  "BOOSTR. clinic",
  "OBD CONSULTING",
  "Northside Dental",
  "Harbor Fitness",
  "Lumen Studio",
  "Greenleaf Realty",
];

export function subAccountOf(contact: Contact) {
  return SUB_ACCOUNTS[hashOf(contact.id) % SUB_ACCOUNTS.length];
}

/* ─── WhatsApp templates ────────────────────────────────────────────────── */

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  body: (first: string, sub: string) => string;
  button?: string;
}

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "onboarding",
    name: "whatsapp_onboarding_followup",
    category: "Utility",
    body: (first, sub) =>
      `Hi ${first},\n\nJust checking in on **${sub}** — your WhatsApp setup is almost done. Want me to walk you through the last step?`,
    button: "Book Appointment",
  },
  {
    id: "reminder",
    name: "appointment_reminder",
    category: "Utility",
    body: (first) =>
      `Hi ${first}, this is a reminder about your appointment tomorrow at 10:00 AM. Reply 1 to confirm or 2 to reschedule.`,
  },
  {
    id: "payment",
    name: "payment_link",
    category: "Utility",
    body: (first, sub) =>
      `Hi ${first}, here's the payment link for **${sub}**'s WhatsApp subscription ($49/month). Tap below to complete checkout.`,
    button: "Pay now",
  },
  {
    id: "reengage",
    name: "reengagement_offer",
    category: "Marketing",
    body: (first) =>
      `Hi ${first} 👋 We haven't heard from you in a while. Reply to this message and we'll pick up right where we left off.`,
  },
];

/* ─── Seed history ──────────────────────────────────────────────────────── */

/**
 * The thread a contact opens with.
 *
 * One story per contact rather than one fixture for all: the contact asks
 * about WhatsApp, the team books a walkthrough, an SMS bounces off a DnD the
 * customer switched on, and the success manager follows up by email and a
 * WhatsApp template. Which CRM events appear varies with the contact's hash,
 * so paging between records changes more than the name.
 */
export function seedThread(contact: Contact): ThreadItem[] {
  const h = hashOf(contact.id);
  const first = firstName(contact);
  const sub = subAccountOf(contact);
  const id = (k: string) => `${contact.id}-${k}`;
  const items: ThreadItem[] = [];

  items.push({
    kind: "event",
    id: id("created"),
    channel: "contacts",
    icon: "user",
    text: "Contact created via **CSV import**",
    time: "09:05 AM",
  });
  items.push({
    kind: "message",
    id: id("in-1"),
    channel: "sms",
    direction: "in",
    body: `Hey, I got an email about WhatsApp for ${sub}. What do I need to do?`,
    time: "10:12 AM",
  });
  items.push({
    kind: "message",
    id: id("out-1"),
    channel: "sms",
    direction: "out",
    body: `Hi ${first}! Happy to help — I'll send over the steps shortly.`,
    time: "10:15 AM",
    status: "read",
  });
  items.push({
    kind: "call",
    id: id("call"),
    channel: "call",
    direction: h % 2 ? "in" : "out",
    duration: `${2 + (h % 4)}m ${10 + (h % 49)}s`,
    time: "10:31 AM",
  });
  items.push({
    kind: "note",
    id: id("note"),
    channel: "internal",
    author: "Samrina Shabha",
    authorInitials: "SS",
    body: `${first} prefers WhatsApp over calls. Follow up once the subscription is live.`,
    time: "10:40 AM",
  });
  if (h % 3 !== 0) {
    items.push({
      kind: "event",
      id: id("appt"),
      channel: "appointments",
      icon: "calendar",
      text: "Appointment booked: **WhatsApp onboarding** on Oct 2, 2026",
      time: "10:44 AM",
    });
  }
  items.push({
    kind: "message",
    id: id("in-2"),
    channel: "sms",
    direction: "in",
    body: "Thanks! Is Thursday morning okay for the walkthrough?",
    time: "11:02 AM",
  });
  items.push(
    h % 2
      ? {
          kind: "event",
          id: id("invoice"),
          channel: "invoice",
          icon: "file",
          text: `Invoice **INV-${String(1000 + (h % 900))}** sent for $97`,
          time: "01:38 PM",
        }
      : {
          kind: "event",
          id: id("payment"),
          channel: "payments",
          icon: "dollar",
          text: "Payment received: **$49** for WhatsApp subscription",
          time: "01:40 PM",
        },
  );
  items.push({
    kind: "event",
    id: id("opp"),
    channel: "opportunities",
    icon: "target",
    text: "Opportunity moved to **Onboarding**",
    time: "01:45 PM",
  });
  items.push({
    kind: "event",
    id: id("ai"),
    channel: "ai",
    icon: "sparkles",
    text: "AI Agent drafted a reply for review",
    time: "01:50 PM",
  });
  if (h % 4 === 0) {
    items.push({
      kind: "event",
      id: id("sla"),
      channel: "sla",
      icon: "timer",
      text: "SLA warning: first response due in 30 min",
      time: "01:51 PM",
    });
  }
  items.push({
    kind: "event",
    id: id("wa-optin"),
    channel: "wa-permission",
    icon: "shield",
    text: "WhatsApp opt-in received from customer",
    time: "01:52 PM",
  });
  items.push({
    kind: "message",
    id: id("failed"),
    channel: "sms",
    direction: "out",
    body: `Hi ${first}, your WhatsApp onboarding for **${sub}** is still pending. Reply YES and we'll set up a quick call.\nReply STOP to unsubscribe.`,
    time: "01:57 PM",
    status: "failed",
  });
  items.push({
    kind: "event",
    id: id("dnd"),
    channel: "contacts",
    icon: "bell",
    text: "**DnD enabled by customer** for Text / RCS",
    time: "01:58 PM",
  });
  items.push({
    kind: "email",
    id: id("email"),
    channel: "email",
    direction: "out",
    from: "Customer Success Manager",
    fromInitials: "CS",
    fromAddress: "success@highlevel.com",
    to: contactEmail(contact),
    subject: "Your WhatsApp subscription is live",
    body: `Hi ${first},\n\nBig congrats — the sub-account ${sub} has just purchased a WhatsApp subscription. You're one step away from messaging leads straight from your CRM.\n\nBook a 15-minute walkthrough and we'll get everything connected together.\n\nBest regards,\nCustomer Success Manager\nHighLevel`,
    time: "01:59 PM",
    warning: "Couldn't deliver to 1 recipient",
  });
  items.push({
    kind: "message",
    id: id("wa-template"),
    channel: "whatsapp",
    direction: "out",
    body: [
      `Hi ${first},`,
      "",
      `Your sub-account **${sub}** has just purchased a WhatsApp subscription — you're one step away from putting it to work!`,
      "",
      "Here's what you unlock once set up:",
      "💬 Message leads instantly from your CRM",
      "⏰ Automate follow-ups & appointment reminders",
      "📲 Use WhatsApp on your phone and in HighLevel simultaneously with Coexistence",
      "",
      "📅 Tap **Book Appointment** below and I'll personally walk you through everything — it only takes a few minutes!",
      "",
      "Got questions? Just reply to this message.",
      "",
      "🚀 Let's get your WhatsApp up and running!",
      "",
      "Best regards,",
      "Customer Success Manager - WhatsApp",
      "HighLevel",
    ].join("\n"),
    time: "01:59 PM",
    status: "read",
    template: { button: "Book Appointment" },
  });

  return items;
}

/** The current time as the thread writes it: "01:59 PM". */
export function clockNow() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
