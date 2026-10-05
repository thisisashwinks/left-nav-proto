/**
 * AI ▸ Content AI — the fixture behind both tabs.
 *
 * Everything here is invented. The shape follows the live screen: one row per
 * generation, a transaction ID per charge, and a "where it was made" type that
 * the segmented filter cuts on. Words are counted across every variation of a
 * row, which is how the live "Total words count" column adds up (3 variations
 * of a ~20-word headline reads "61 words").
 *
 * Dates are wall-clock strings in the account's zone (IST in the screenshot),
 * parsed by hand so server and client render the same text.
 */

export type ContentTab = "text" | "image";

export const CONTENT_TYPES = [
  { value: "social", label: "Social Planner", goTo: "Social Planner" },
  { value: "blog", label: "Blog", goTo: "Blogs" },
  { value: "funnel", label: "Funnel", goTo: "Funnels" },
  { value: "website", label: "Website", goTo: "Websites" },
  { value: "email", label: "Email", goTo: "Email builder" },
  { value: "conversation", label: "Conversation", goTo: "Conversations" },
] as const;

export type ContentType = (typeof CONTENT_TYPES)[number]["value"];

export const TYPE_LABEL = Object.fromEntries(
  CONTENT_TYPES.map((t) => [t.value, t.label]),
) as Record<ContentType, string>;

export const TYPE_DESTINATION = Object.fromEntries(
  CONTENT_TYPES.map((t) => [t.value, t.goTo]),
) as Record<ContentType, string>;

/** Image generation is not offered in Conversations. */
export const IMAGE_TYPES = CONTENT_TYPES.filter((t) => t.value !== "conversation");

export interface TextRow {
  id: string;
  /** "YYYY-MM-DDTHH:MM", account time. */
  at: string;
  /** The first is what shows in the Content column. */
  variations: string[];
  txn: string;
  type: ContentType;
  tone: string;
}

export interface ImageRow {
  id: string;
  at: string;
  prompt: string;
  /** One hue per generated image — drawn as a gradient tile. */
  images: number[];
  txn: string;
  type: ContentType;
  style: string;
  resolution: string;
}

/* ------------------------------------------------------------------ pricing */

/** Per 1,000 words, and per image. Invented, plausible. */
export const PRICE_PER_1K_WORDS = 0.09;
export const PRICE_PER_IMAGE = 0.06;

/* -------------------------------------------------------------------- dates */

/** The prototype's "today". */
export const TODAY = "2026-10-01";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parts(at: string) {
  const [d, t = "00:00"] = at.split("T");
  const [y, m, day] = d!.split("-").map(Number);
  const [hh, mm] = t.split(":").map(Number);
  return { y: y!, m: m!, day: day!, hh: hh!, mm: mm! };
}

/** "Sep 29, 2026" */
export function formatDate(at: string) {
  const p = parts(at);
  return `${MONTHS[p.m - 1]} ${p.day}, ${p.y}`;
}

/** "12:48 AM" */
export function formatTime(at: string) {
  const p = parts(at);
  const h12 = p.hh % 12 === 0 ? 12 : p.hh % 12;
  return `${h12}:${String(p.mm).padStart(2, "0")} ${p.hh < 12 ? "AM" : "PM"}`;
}

/** Whole days between the row and TODAY (0 = today). */
export function daysAgo(at: string) {
  const a = parts(at);
  const b = parts(TODAY);
  return Math.round(
    (Date.UTC(b.y, b.m - 1, b.day) - Date.UTC(a.y, a.m - 1, a.day)) / 86_400_000,
  );
}

/** A minutes value that sorts rows by time. */
export function sortKey(at: string) {
  const p = parts(at);
  return Date.UTC(p.y, p.m - 1, p.day, p.hh, p.mm);
}

/** "2026-10-01T14:05" for a row created right now. */
export function nowStamp() {
  const d = new Date();
  return `${TODAY}T${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function shiftDays(days: number, hh: number, mm: number) {
  const b = parts(TODAY);
  const d = new Date(Date.UTC(b.y, b.m - 1, b.day - days));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export const RANGES = [
  { value: "7", label: "Last 7 days", days: 7 },
  { value: "30", label: "Last 30 days", days: 30 },
  { value: "90", label: "Last 90 days", days: 90 },
  { value: "all", label: "All time", days: null },
] as const;

export type RangeId = (typeof RANGES)[number]["value"];

/* ---------------------------------------------------------------- utilities */

export function wordCount(s: string) {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

export function rowWords(r: TextRow) {
  return r.variations.reduce((n, v) => n + wordCount(v), 0);
}

export function fmt(n: number) {
  return n.toLocaleString("en-US");
}

export function money(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** A Mongo-looking 24-character ID, deterministic per seed. */
export function txnFor(seed: number) {
  let x = (seed * 2654435761) >>> 0;
  let out = "6716a9";
  while (out.length < 24) {
    x = (x * 1103515245 + 12345) >>> 0;
    out += (x >>> 16).toString(16).padStart(4, "0");
  }
  return out.slice(0, 24);
}

export function randomTxn() {
  return txnFor(Math.floor(Math.random() * 1e9));
}

/* ------------------------------------------------------------- text fixture */

/**
 * The seeds: a headline per row and its alternates. The live product writes
 * 1–5 variations per request; most of these carry 3.
 */
const TEXT_SEEDS: {
  type: ContentType;
  tone: string;
  v: string[];
  d: number;
  t: [number, number];
}[] = [
  {
    type: "funnel", tone: "Persuasive", d: 0, t: [9, 12],
    v: [
      "Book your free strategy call and leave with a 90-day growth plan built for your business.",
      "Get a custom 90-day growth plan on a free strategy call. No pitch, just a plan.",
      "Ready to grow? Claim your free strategy call and walk away with a clear 90-day roadmap.",
    ],
  },
  {
    type: "social", tone: "Friendly", d: 1, t: [16, 40],
    v: [
      "Fall is here, and so are our new seasonal menus. Swing by this weekend and try the pumpkin chai latte.",
      "New fall menu just dropped. Pumpkin chai latte, maple scones, and cozy corners waiting for you.",
      "Sweater weather calls for something warm. Our fall menu is live starting today.",
    ],
  },
  {
    type: "email", tone: "Professional", d: 1, t: [11, 5],
    v: [
      "Your October account review is ready. Here is what changed, what is working, and where we recommend focusing next.",
      "Quick summary of your October results, plus 3 recommendations for the month ahead.",
    ],
  },
  {
    type: "blog", tone: "Professional", d: 2, t: [14, 22],
    v: [
      "7 ways local dental practices can fill their calendars without spending more on ads",
      "How dental practices fill their calendars with follow-ups, reviews, and reminders",
      "The dental practice playbook for a fully booked schedule in 30 days",
    ],
  },
  {
    type: "website", tone: "Persuasive", d: 3, t: [10, 48],
    v: [
      "Roofing you can trust, backed by a 25-year workmanship warranty and same-week inspections.",
      "Same-week roof inspections and a 25-year warranty. That is the Summit Roofing promise.",
      "Protect your home with Summit Roofing: licensed crews, honest quotes, and a 25-year warranty.",
    ],
  },
  {
    type: "conversation", tone: "Friendly", d: 3, t: [18, 3],
    v: [
      "Hi Jordan, thanks for reaching out! We have openings Thursday at 3:00 PM or Friday at 10:00 AM. Which works better?",
      "Hey Jordan! Happy to help. Thursday at 3:00 PM or Friday at 10:00 AM are open. Want me to lock one in?",
    ],
  },
  {
    type: "funnel", tone: "Playful", d: 4, t: [0, 48],
    v: [
      "Unlock the mystery: dive into the enigma everyone is whispering about and see what the buzz is really about!",
      "Curious? So is everyone else. Find out what the whispers are about before the doors close.",
      "The secret is almost out. Get early access before everyone else finds out.",
    ],
  },
  {
    type: "social", tone: "Playful", d: 5, t: [12, 30],
    v: [
      "POV: you finally automated your follow-ups and got your evenings back.",
      "Tell me you automated your follow-ups without telling me. We will go first: we leave at 5:00 PM now.",
      "Your CRM should work while you sleep. Ours does.",
    ],
  },
  {
    type: "email", tone: "Persuasive", d: 6, t: [8, 15],
    v: [
      "Last chance: 30% off annual memberships ends tonight at midnight.",
      "Only a few hours left to save 30% on your annual membership.",
      "Tonight only. Lock in 30% off before midnight.",
    ],
  },
  {
    type: "blog", tone: "Friendly", d: 7, t: [15, 10],
    v: [
      "A beginner's guide to meal prep that actually fits a busy week",
      "Meal prep for busy people: 5 recipes, 1 hour, a whole week sorted",
    ],
  },
  {
    type: "website", tone: "Professional", d: 8, t: [13, 42],
    v: [
      "Bookkeeping, payroll, and tax filing for small businesses, handled by certified accountants.",
      "Certified accountants for small business books, payroll, and taxes, all in one place.",
      "Spend less time on spreadsheets. We handle your books, payroll, and filings every month.",
    ],
  },
  {
    type: "funnel", tone: "Professional", d: 9, t: [9, 55],
    v: [
      "Download the 2026 real estate market report: prices, inventory, and what buyers expect next quarter.",
      "Get the free 2026 market report with local price trends and buyer demand forecasts.",
      "What is next for your local market? Download our free 2026 report to find out.",
    ],
  },
  {
    type: "conversation", tone: "Professional", d: 10, t: [17, 20],
    v: [
      "Thanks for your patience. Your refund of $49 has been processed and should appear within 3–5 business days.",
      "Good news: your $49 refund is on its way. Expect it in 3–5 business days.",
    ],
  },
  {
    type: "social", tone: "Friendly", d: 12, t: [11, 0],
    v: [
      "Meet Priya, our newest stylist! She specializes in balayage and color correction. Book with her this month for 15% off.",
      "Welcome to the team, Priya! Balayage lovers, this month is your month: 15% off with Priya.",
      "New stylist alert. Priya is here and taking balayage bookings now.",
    ],
  },
  {
    type: "email", tone: "Friendly", d: 13, t: [7, 45],
    v: [
      "Welcome aboard! Here are 3 quick steps to get your account set up in under 10 minutes.",
      "You are in. Let's get you set up: 3 steps, 10 minutes, and you are ready to go.",
      "Thanks for joining us. Start here to set up your account the easy way.",
    ],
  },
  {
    type: "blog", tone: "Persuasive", d: 15, t: [10, 30],
    v: [
      "Why every HVAC company needs a review strategy before peak season",
      "Reviews win HVAC jobs. Here is how to collect 50 before summer hits.",
      "The HVAC owner's guide to getting more 5-star reviews this season",
    ],
  },
  {
    type: "funnel", tone: "Persuasive", d: 17, t: [19, 5],
    v: [
      "Join the free 5-day fitness challenge and build a habit that sticks.",
      "5 days. 20 minutes a day. Join the free challenge and feel the difference.",
      "Start the free 5-day challenge today. Your future self says thanks.",
    ],
  },
  {
    type: "website", tone: "Friendly", d: 19, t: [14, 14],
    v: [
      "Family-owned since 1998, we treat every pet like our own.",
      "Caring for your pets like family since 1998.",
    ],
  },
  {
    type: "social", tone: "Persuasive", d: 21, t: [9, 0],
    v: [
      "Our open house is this Saturday from 11:00 AM–2:00 PM. Tour the model home and meet the builders.",
      "Open house Saturday, 11:00 AM–2:00 PM. Come see the model home in person.",
      "See it before it is gone. Model home tours this Saturday only.",
    ],
  },
  {
    type: "conversation", tone: "Friendly", d: 23, t: [16, 50],
    v: [
      "No worries at all! I have moved your appointment to Tuesday at 2:30 PM. See you then.",
      "All set! You are now booked for Tuesday at 2:30 PM.",
    ],
  },
  {
    type: "email", tone: "Professional", d: 26, t: [10, 10],
    v: [
      "Your invoice for September is ready. The total due is $1,299, payable by Oct 15, 2026.",
      "September invoice: $1,299 due Oct 15, 2026. View and pay online in 1 click.",
    ],
  },
  {
    type: "blog", tone: "Professional", d: 29, t: [13, 0],
    v: [
      "Email deliverability in 2026: what changed and how to stay out of spam",
      "Staying out of the spam folder: the 2026 deliverability checklist",
      "New sender rules for 2026 and the 6 settings to check today",
    ],
  },
  {
    type: "funnel", tone: "Friendly", d: 33, t: [12, 12],
    v: [
      "Grab your free photography starter kit: presets, shot lists, and a pricing guide.",
      "Free for new photographers: presets, shot lists, and a pricing guide in one kit.",
      "Start your photography business the right way with our free starter kit.",
    ],
  },
  {
    type: "website", tone: "Persuasive", d: 38, t: [11, 30],
    v: [
      "Fast, friendly IT support for teams of 5–500. Most tickets solved in under 1 hour.",
      "Most tickets solved in under 1 hour. IT support that feels like part of your team.",
      "IT support for growing teams, from 5 people to 500.",
    ],
  },
  {
    type: "social", tone: "Playful", d: 44, t: [17, 0],
    v: [
      "Monday motivation, but make it tacos. 2-for-1 all day.",
      "Mondays are better with tacos. 2-for-1, all day long.",
      "Beat the Monday blues with 2-for-1 tacos.",
    ],
  },
  {
    type: "email", tone: "Friendly", d: 52, t: [9, 25],
    v: [
      "We miss you! Here is $20 off your next visit, valid through the end of the month.",
      "It has been a while. Come back and enjoy $20 off your next visit.",
      "A little something to welcome you back: $20 off, this month only.",
    ],
  },
  {
    type: "blog", tone: "Friendly", d: 61, t: [15, 45],
    v: [
      "10 questions to ask before hiring a wedding planner",
      "Hiring a wedding planner? Ask these 10 questions first.",
    ],
  },
  {
    type: "conversation", tone: "Professional", d: 70, t: [10, 40],
    v: [
      "Thanks for your interest in our Pro plan. I have attached a comparison so you can see what is included.",
      "Here is a side-by-side of our plans so you can pick the right fit.",
    ],
  },
  {
    type: "funnel", tone: "Persuasive", d: 84, t: [20, 0],
    v: [
      "Free webinar: how agencies scale to $50,000 a month without hiring 10 more people.",
      "Scale your agency to $50,000 a month. Free live webinar, limited seats.",
      "Learn the systems top agencies use to hit $50,000 a month.",
    ],
  },
  {
    type: "website", tone: "Professional", d: 103, t: [12, 0],
    v: [
      "Personal injury attorneys serving Austin for over 20 years. Free consultations, no fees unless we win.",
      "No fees unless we win. Talk to an Austin injury attorney today.",
    ],
  },
  {
    type: "social", tone: "Friendly", d: 121, t: [8, 30],
    v: [
      "Happy 5th birthday to our studio! Thank you for every class, every sweat, and every smile.",
      "5 years of classes, community, and you. Thank you!",
      "We are turning 5 and celebrating all week with free classes.",
    ],
  },
  {
    type: "email", tone: "Persuasive", d: 145, t: [11, 11],
    v: [
      "Early-bird pricing for our annual conference ends Friday. Save $200 when you register today.",
      "Save $200 on conference tickets. Early-bird ends Friday.",
      "Register by Friday and keep $200 in your pocket.",
    ],
  },
];

export const textRows: TextRow[] = TEXT_SEEDS.map((s, i) => ({
  id: `txt-${i + 1}`,
  at: shiftDays(s.d, s.t[0], s.t[1]),
  variations: s.v,
  txn: txnFor(i + 101),
  type: s.type,
  tone: s.tone,
}));

/* ------------------------------------------------------------ image fixture */

export const IMAGE_STYLES = ["Photographic", "Illustration", "3D render", "Flat graphic"] as const;
export const RESOLUTIONS = ["1024 × 1024", "1792 × 1024", "1024 × 1792"] as const;

const IMAGE_SEEDS: {
  type: ContentType;
  prompt: string;
  n: number;
  hue: number;
  style: (typeof IMAGE_STYLES)[number];
  res: (typeof RESOLUTIONS)[number];
  d: number;
  t: [number, number];
}[] = [
  { type: "social", prompt: "Cozy coffee shop interior at golden hour, steam rising from a latte", n: 4, hue: 28, style: "Photographic", res: "1024 × 1024", d: 0, t: [10, 2] },
  { type: "funnel", prompt: "Confident business coach on stage, warm spotlight, blurred audience", n: 2, hue: 210, style: "Photographic", res: "1792 × 1024", d: 1, t: [15, 33] },
  { type: "blog", prompt: "Flat illustration of a dentist chair with a calendar and checkmarks", n: 3, hue: 190, style: "Flat graphic", res: "1792 × 1024", d: 2, t: [14, 50] },
  { type: "website", prompt: "Modern suburban home with a new slate roof under a clear blue sky", n: 4, hue: 200, style: "Photographic", res: "1792 × 1024", d: 3, t: [11, 15] },
  { type: "email", prompt: "Autumn leaves frame with space for a discount headline", n: 2, hue: 18, style: "Illustration", res: "1024 × 1024", d: 5, t: [9, 40] },
  { type: "social", prompt: "Colorful taco spread on a wooden table, top-down shot", n: 4, hue: 45, style: "Photographic", res: "1024 × 1024", d: 6, t: [17, 5] },
  { type: "funnel", prompt: "3D render of a gift box opening with glowing particles", n: 1, hue: 280, style: "3D render", res: "1024 × 1024", d: 8, t: [12, 20] },
  { type: "blog", prompt: "Meal prep containers with grains, greens, and roasted vegetables", n: 3, hue: 95, style: "Photographic", res: "1792 × 1024", d: 10, t: [8, 10] },
  { type: "website", prompt: "Friendly veterinarian holding a golden retriever puppy in a clinic", n: 2, hue: 35, style: "Photographic", res: "1024 × 1792", d: 12, t: [13, 45] },
  { type: "social", prompt: "Hair salon with balayage results, soft natural light", n: 4, hue: 330, style: "Photographic", res: "1024 × 1792", d: 14, t: [16, 0] },
  { type: "email", prompt: "Minimal welcome banner with abstract waves in brand colors", n: 2, hue: 225, style: "Flat graphic", res: "1792 × 1024", d: 16, t: [10, 30] },
  { type: "funnel", prompt: "Fitness challenge hero image, runner at sunrise on a bridge", n: 3, hue: 15, style: "Photographic", res: "1792 × 1024", d: 19, t: [6, 55] },
  { type: "blog", prompt: "Isometric illustration of an HVAC unit with star ratings floating above", n: 2, hue: 170, style: "Illustration", res: "1792 × 1024", d: 24, t: [14, 5] },
  { type: "website", prompt: "Team of IT specialists collaborating around a laptop, bright office", n: 4, hue: 215, style: "Photographic", res: "1792 × 1024", d: 31, t: [11, 0] },
  { type: "social", prompt: "Model home living room with large windows and neutral decor", n: 3, hue: 40, style: "Photographic", res: "1024 × 1024", d: 37, t: [9, 15] },
  { type: "email", prompt: "Conference stage with a large screen and colorful lights", n: 2, hue: 260, style: "3D render", res: "1792 × 1024", d: 49, t: [15, 20] },
  { type: "funnel", prompt: "Photography starter kit flat lay: camera, lenses, notebook", n: 4, hue: 0, style: "Photographic", res: "1024 × 1024", d: 63, t: [12, 40] },
  { type: "blog", prompt: "Elegant wedding table setting with candles and white flowers", n: 3, hue: 350, style: "Photographic", res: "1792 × 1024", d: 78, t: [17, 30] },
  { type: "website", prompt: "Austin skyline at dusk behind a law office window", n: 2, hue: 240, style: "Photographic", res: "1792 × 1024", d: 96, t: [10, 50] },
  { type: "social", prompt: "Yoga studio birthday celebration with balloons and mats", n: 4, hue: 300, style: "Illustration", res: "1024 × 1024", d: 120, t: [8, 0] },
];

export const imageRows: ImageRow[] = IMAGE_SEEDS.map((s, i) => ({
  id: `img-${i + 1}`,
  at: shiftDays(s.d, s.t[0], s.t[1]),
  prompt: s.prompt,
  images: Array.from({ length: s.n }, (_, k) => (s.hue + k * 37) % 360),
  txn: txnFor(i + 501),
  type: s.type,
  style: s.style,
  resolution: s.res,
}));

/* ------------------------------------------------------------- generation */

const TONE_OPENERS: Record<string, string[]> = {
  Professional: ["", "Here is what you need to know: ", "In short: "],
  Friendly: ["", "Good news! ", "Hey there! "],
  Persuasive: ["", "Don't miss out: ", "Ready? "],
  Playful: ["", "Plot twist: ", "Psst! "],
};

const LENGTH_TAIL: Record<string, string> = {
  short: "",
  medium:
    " It takes a few minutes to get started, and our team is here to help every step of the way.",
  long:
    " It takes a few minutes to get started, and our team is here to help every step of the way. Customers tell us the difference shows up in the first week, from fewer missed messages to more booked appointments. Reply to this message or book a time that works for you, and we will walk you through it.",
};

/** Turns the form's brief into N plausible variations. */
export function draftVariations(brief: string, tone: string, length: string, n: number) {
  const clean = brief.trim().replace(/\s+/g, " ").replace(/[.!?]+$/, "");
  const base = clean.charAt(0).toUpperCase() + clean.slice(1);
  const openers = TONE_OPENERS[tone] ?? TONE_OPENERS.Professional!;
  const closers = [".", ". Get started today.", ". Learn more in 1 click.", ". See how it works.", ". Try it free."];
  return Array.from({ length: n }, (_, i) => {
    const op = openers[i % openers.length]!;
    const head = op ? op + base.charAt(0).toLowerCase() + base.slice(1) : base;
    return head + closers[i % closers.length] + (LENGTH_TAIL[length] ?? "");
  });
}
