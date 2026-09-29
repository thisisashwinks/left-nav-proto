/**
 * Snippets — the seed, the shapes and the small pure helpers the page and
 * its modals share.
 *
 * The first 14 rows are the live account's, verbatim, so the list reads like
 * the screenshot. The other 94 are generated from fixed tables, not
 * randomness, so a reload always paints the same 108 rows in the same order.
 */

export type SnippetType = "text" | "email" | "rcs";
export type RcsKind = "plain" | "card" | "carousel";

export interface RcsCard {
  title: string;
  description: string;
  imageUrl: string;
  buttons: string[];
}

export interface Snippet {
  id: string;
  name: string;
  type: SnippetType;
  /** Plain text for text and RCS plain; HTML for email. */
  body: string;
  subject?: string;
  attachments: string[];
  folderId: string | null;
  /** Local wall time, "YYYY-MM-DDTHH:mm" — parsed by hand, so no time zone drift. */
  updatedAt: string;
  rcs?: { kind: RcsKind; cards: RcsCard[] };
}

export interface SnippetFolder {
  id: string;
  name: string;
  updatedAt: string;
}

export const TYPE_LABEL: Record<SnippetType, string> = { text: "Text", email: "Email", rcs: "RCS" };

/* ─── Formatting ────────────────────────────────────────────────────────── */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2025-03-04T08:18" → "Mar 4, 2025 8:18 AM". */
export function formatUpdated(stamp: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(stamp);
  if (!m) return stamp;
  const [, y, mo, d, h, mi] = m;
  const hour = Number(h);
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${MONTHS[Number(mo) - 1]} ${Number(d)}, ${y} ${h12}:${mi} ${hour < 12 ? "AM" : "PM"}`;
}

/** The current local time as a stamp. Only ever called from event handlers. */
export function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Tags out, <style> contents kept — the live list shows exactly that. */
export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** For rendering authored HTML in the preview: no styles, scripts or handlers. */
export function safeHtml(html: string): string {
  return html
    .replace(/<(style|script)[\s\S]*?<\/\1>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

/** What the Body column prints: the first line, and "…" when there is more. */
export function bodyPreview(s: Snippet): string {
  if (s.type === "email") {
    const t = htmlToText(s.body).trim();
    return t || "…";
  }
  const lines = s.body.split("\n").map((l) => l.trim());
  const first = lines[0] ?? "";
  const more = lines.slice(1).some(Boolean);
  if (!first) return "…";
  return more ? `${first} …` : first;
}

/** Characters, words and SMS segments — 160 characters a segment. */
export function smsStats(text: string) {
  const chars = [...text].length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const segs = chars === 0 ? 0 : Math.max(1, Math.ceil(chars / 160));
  const cost = Math.ceil(segs * 0.0079 * 100 - 1e-9) / 100;
  return { chars, words, segs, cost };
}

/** The last path segment of a URL, for "Add file through URL". */
export function fileNameFromUrl(raw: string): string {
  const clean = raw.trim().split(/[?#]/)[0].replace(/\/+$/, "");
  const last = clean.split("/").pop() ?? "";
  return decodeURIComponent(last) || "file";
}

export const MERGE_FIELDS: { group: string; fields: { label: string; token: string }[] }[] = [
  {
    group: "Contact",
    fields: [
      { label: "First name", token: "{{contact.first_name}}" },
      { label: "Last name", token: "{{contact.last_name}}" },
      { label: "Full name", token: "{{contact.name}}" },
      { label: "Email", token: "{{contact.email}}" },
      { label: "Phone", token: "{{contact.phone}}" },
    ],
  },
  {
    group: "Account",
    fields: [
      { label: "Business name", token: "{{location.name}}" },
      { label: "Business phone", token: "{{location.phone}}" },
      { label: "Business address", token: "{{location.full_address}}" },
    ],
  },
  {
    group: "Appointment",
    fields: [
      { label: "Start time", token: "{{appointment.start_time}}" },
      { label: "Meeting location", token: "{{appointment.meeting_location}}" },
      { label: "Calendar name", token: "{{appointment.calendar_name}}" },
    ],
  },
];

/* ─── Seed ──────────────────────────────────────────────────────────────── */

export const SEED_FOLDERS: SnippetFolder[] = [
  { id: "f-workflow-1", name: "Workflow 1", updatedAt: "2026-05-05T11:28" },
  { id: "f-umar", name: "Umar", updatedAt: "2026-08-04T11:47" },
  { id: "f-onboarding", name: "Onboarding", updatedAt: "2026-02-11T09:30" },
  { id: "f-billing", name: "Billing", updatedAt: "2025-12-02T15:05" },
  { id: "f-support", name: "Support replies", updatedAt: "2026-07-19T10:12" },
  { id: "f-promotions", name: "Promotions", updatedAt: "2025-10-28T16:40" },
];

const LIVE: Omit<Snippet, "id">[] = [
  { name: "A nice snippet PARTH", type: "text", body: "Hello, This is a snippet test", attachments: ["bird_small_animal_feathers_river_679.mp4"], folderId: "f-workflow-1", updatedAt: "2025-03-04T08:18" },
  { name: "AAA Cross Domain Image", type: "email", subject: "Cross domain image test", body: "<p>w3school<a href=\"https://www.leadconnectorhq.com\">Lead Connectro</a></p>", attachments: ["w3schools_logo.png"], folderId: "f-umar", updatedAt: "2025-03-04T10:43" },
  { name: "abc video", type: "text", body: "Hi", attachments: ["abc_video.mp4"], folderId: "f-workflow-1", updatedAt: "2026-05-05T11:28" },
  { name: "API Key Generation", type: "email", subject: "Generate your API key", body: "<style>body{font-family: sans-serif;}</style><p>Dear Agency Admins,</p><p>In our latest update, you can generate API keys for each sub-account from Settings. Keys can be rotated at any time.</p>", attachments: [], folderId: "f-umar", updatedAt: "2026-08-04T11:47" },
  { name: "appointment template check", type: "text", body: "{{appointment.meeting_location}} test message 1", attachments: [], folderId: "f-umar", updatedAt: "2025-04-16T16:17" },
  { name: "attachmont snippet", type: "text", body: "attachmont snippet", attachments: ["attachmont.pdf"], folderId: null, updatedAt: "2025-08-27T16:44" },
  { name: "Beta Invite Email", type: "email", subject: "You're invited to the beta", body: "<p><br></p>", attachments: [], folderId: "f-umar", updatedAt: "2026-08-04T11:47" },
  { name: "button", type: "email", subject: "Button test", body: "<p>Hey</p>", attachments: [], folderId: null, updatedAt: "2025-03-07T17:18" },
  {
    name: "Carousel", type: "rcs", body: "Fallback Test", attachments: [], folderId: null, updatedAt: "2026-06-22T12:05",
    rcs: {
      kind: "carousel",
      cards: [
        { title: "Fallback Test", description: "The first card in the carousel.", imageUrl: "", buttons: ["Learn more"] },
        { title: "Second card", description: "Swipe to see more.", imageUrl: "", buttons: ["Book now"] },
      ],
    },
  },
  { name: "Cat Image", type: "text", body: "Hi {{contact.name}},\nHere's a picture of our office cat. Have a great day!", attachments: ["cat.jpg"], folderId: "f-umar", updatedAt: "2024-11-25T17:24" },
  { name: "CUSTOMER_TEST_SNIPPET_FOR_SPACES", type: "text", body: "fyi, fresh Oct vs Nov ( -0.375 @ Flat )\nDec vs Jan ( -0.250 @ Flat )", attachments: [], folderId: null, updatedAt: "2025-11-07T14:28" },
  { name: "Default - Order Confirmation SMS for Shopify", type: "text", body: "Hi,\nThanks for your order {{order.number}}. We'll text you when it ships.", attachments: [], folderId: null, updatedAt: "2025-09-30T13:15" },
  { name: "demo snippet", type: "email", subject: "Demo", body: "<p>link here -&nbsp; <a href=\"https://google.com\">google link</a></p>", attachments: [], folderId: null, updatedAt: "2024-10-25T21:01" },
  { name: "demo template", type: "email", subject: "Demo template", body: "<p><br></p>", attachments: ["demo_template.pdf"], folderId: null, updatedAt: "2024-09-26T13:54" },
];

const TOPICS: { name: string; text: string; email: string }[] = [
  { name: "Event reminder", text: "Hi {{contact.first_name}}, a reminder that our event starts tomorrow at 6:00 PM.", email: "Our event starts tomorrow at 6:00 PM. Save your seat and bring a friend." },
  { name: "Feedback request", text: "Hi {{contact.first_name}}, how did we do? Reply with a score from 1–10.", email: "We'd love your feedback. It takes 2 minutes and helps us improve." },
  { name: "Follow-up after call", text: "Thanks for the call today, {{contact.first_name}}. Here's the summary we discussed.", email: "Thanks for your time today. Here's a recap of what we covered and the next steps." },
  { name: "Holiday hours", text: "Heads up: we're closed Dec 24–26 and back on Dec 27.", email: "Our holiday hours are Dec 24–26 closed. We're back on Dec 27 at 9:00 AM." },
  { name: "Invoice due", text: "Hi {{contact.first_name}}, your invoice of $149 is due on Friday.", email: "Your invoice is ready. You can pay online in under a minute." },
  { name: "Job status update", text: "Your job is in progress. We'll share photos when it's done.", email: "Here's the latest on your job, with photos from today's visit." },
  { name: "Lead welcome", text: "Welcome, {{contact.first_name}}! Reply YES to book a free consult.", email: "Welcome aboard! Here's what to expect in your first week with us." },
  { name: "Missed call", text: "Sorry we missed your call. How can we help? Reply here anytime.", email: "We missed your call. Pick a time that works and we'll call you back." },
  { name: "New lead intro", text: "Hi {{contact.first_name}}, this is {{user.name}} from {{location.name}}.", email: "Thanks for reaching out. I'm your point of contact from here on." },
  { name: "Order shipped", text: "Good news! Your order has shipped. Track it here: {{order.tracking_url}}", email: "Your order is on its way. Track your package with the link below." },
  { name: "Payment received", text: "Thanks! We received your payment of $1,299.", email: "We've received your payment. Your receipt is attached." },
  { name: "Quote ready", text: "Your quote is ready, {{contact.first_name}}. Tap to review and approve.", email: "Your quote is ready to review. Approve it online to lock in your date." },
  { name: "Referral thanks", text: "Thanks for the referral! Your $25 credit is on its way.", email: "Thank you for referring a friend. We've added a $25 credit to your account." },
  { name: "Review request", text: "Loved working with you! Mind leaving us a quick review? {{review_link}}", email: "If you enjoyed working with us, a short review would mean a lot." },
  { name: "Service reminder", text: "It's time for your annual service. Reply to pick a date.", email: "Your annual service is due. Book a time that suits you." },
  { name: "Trial ending", text: "Your trial ends in 3 days. Upgrade to keep your data.", email: "Your free trial ends in 3 days. Here's how to keep everything you've set up." },
  { name: "Upsell offer", text: "Add a second service this month and save 15%.", email: "Customers like you also book our premium plan. Save 15% this month." },
  { name: "VIP offer", text: "As a VIP, you get early access to our spring sale.", email: "You're on the VIP list. Shop the spring sale 24 hours early." },
  { name: "Webinar invite", text: "Join our free webinar on Thursday at 11:00 AM.", email: "Join us Thursday at 11:00 AM for a 30-minute live walkthrough." },
  { name: "Year-end promo", text: "Our year-end promo is live. Book by Dec 31 to save.", email: "Our biggest promo of the year is live until Dec 31." },
];

const VARIANTS = ["", " v2", " short", " for new clients", " final"];
const GEN_FOLDERS = [null, "f-onboarding", "f-billing", "f-support", "f-promotions", null, "f-umar"];
const FILES = ["brochure.pdf", "price_list.pdf", "welcome.png", "map.jpg", "intro_video.mp4"];

function generated(): Omit<Snippet, "id">[] {
  const out: Omit<Snippet, "id">[] = [];
  for (let i = 0; out.length < 94; i++) {
    const t = TOPICS[i % TOPICS.length];
    const v = VARIANTS[Math.floor(i / TOPICS.length) % VARIANTS.length];
    const k = (i * 7 + 3) % 11;
    const type: SnippetType = k < 6 ? "text" : k < 10 ? "email" : "rcs";
    const month = ((i * 5) % 12) + 1;
    const year = 2024 + (i % 3);
    const day = ((i * 11) % 27) + 1;
    const hour = (i * 7) % 24;
    const minute = (i * 13) % 60;
    const p = (n: number) => String(n).padStart(2, "0");
    out.push({
      name: `${t.name}${v}`,
      type,
      subject: type === "email" ? t.name : undefined,
      body: type === "email" ? `<p>${t.email}</p>` : t.text,
      attachments: i % 6 === 2 ? [FILES[i % FILES.length]] : [],
      folderId: GEN_FOLDERS[i % GEN_FOLDERS.length],
      updatedAt: `${year}-${p(month)}-${p(day)}T${p(hour)}:${p(minute)}`,
      rcs: type === "rcs" ? { kind: "plain", cards: [] } : undefined,
    });
  }
  return out;
}

/** Plain code-point order on the lowercased name — what puts "A nice…" above "AAA…". */
export function byName(a: { name: string }, b: { name: string }): number {
  const x = a.name.toLowerCase();
  const y = b.name.toLowerCase();
  return x < y ? -1 : x > y ? 1 : 0;
}

export const SEED_SNIPPETS: Snippet[] = [...LIVE, ...generated()]
  .map((s, i) => ({ ...s, id: `sn-${i + 1}` }))
  .sort(byName);

let nextId = 1000;
export function newId(prefix: string): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}
