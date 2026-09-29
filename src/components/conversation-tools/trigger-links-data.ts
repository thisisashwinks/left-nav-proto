/**
 * Conversations ▸ Trigger links — the seed.
 *
 * The first 17 rows are the live account's, verbatim, in the order the
 * screenshot shows them; the rest pad the list to 40 so the pager has a
 * second page to walk to. Everything is generated from a fixed seed so the
 * server and client render the same keys and dates.
 */

export interface TriggerLink {
  id: string;
  name: string;
  url: string;
  key: string;
  /** Epoch ms, built from local components. */
  added: number;
}

export interface LinkClick {
  linkId: string;
  at: number;
}

const at = (y: number, m: number, d: number, h: number, min: number) =>
  new Date(y, m - 1, d, h, min).getTime();

const LIVE: Omit<TriggerLink, "id">[] = [
  { name: "twilioISVHelpDoc", url: "https://help.gohighlevel.com/support/solutions/articles/48001204027-twilio-isv-a2p-10dlc", key: "n0AXdUoqOkh7qgrGpD1W", added: at(2021, 12, 16, 4, 47) },
  { name: "Suresh - Shopify Calendar", url: "https://link.gohighlevel.com/widget/appointment/suresh", key: "vCIVP2gDmdiQVRWsqJe3", added: at(2021, 12, 2, 17, 1) },
  { name: "High Rating", url: "https://search.google.com/local/writereview?placeid=ChIJwxidJgXhwFQREUI9E2nWweQ", key: "X2dtY3vXW2aFfp3rF0zN", added: at(2021, 6, 8, 15, 51) },
  { name: "Segmentation Survey URL", url: "https://link.gohighlevel.com/widget/survey/955iTha5Uur7e8FaJUxe?email={{contact.email}}", key: "dcnX7EchUjXODPpsScFN", added: at(2020, 6, 19, 20, 28) },
  { name: "Review Link", url: "https://app.gohighlevel.com/v2/preview/VGI3mFrWEFRhEBQX8TUh", key: "XWxvG99CNuhM68nLGhD1", added: at(2021, 6, 7, 21, 44) },
  { name: "Low Rating", url: "https://app.gohighlevel.com/v2/preview/q5KCyyVIVQy8QQfNUTb4", key: "IEFZAZt3juM7LLCm6Fd0", added: at(2021, 6, 8, 15, 48) },
  { name: "Mobile App Issue Form", url: "https://link.gohighlevel.com/widget/form/LO8Sse4LJZVAc6gK80MB?email={{contact.email}}", key: "tcucUW4vhFqkt1UDFKeR", added: at(2021, 4, 15, 16, 29) },
  { name: "Twilio Rebilling Survey Trigger", url: "https://link.gohighlevel.com/widget/survey/naVupMdqmt96tnZSvlad?first_name={{contact.first_name}}", key: "Oi4HqPElfxAKA0403GmA", added: at(2021, 3, 25, 18, 49) },
  { name: "WordPress Hosting Guide", url: "https://help.gohighlevel.com/support/solutions/folders/48000682017", key: "Xue1YOvFvtxF0243VAsW", added: at(2022, 5, 19, 19, 40) },
  { name: "Shopify Integration - Guide", url: "https://doc.clickup.com/d/h/87cpx-32964/eb6027270a1fce6", key: "QyDFcowcN6uBsBSnQ7eU", added: at(2021, 12, 2, 16, 59) },
  { name: "google", url: "gmail.com", key: "7kEqqElpOU316Bd26HlZ", added: at(2021, 6, 23, 17, 34) },
  { name: "Twilio rebilling setup calendar", url: "https://link.gohighlevel.com/widget/appointment/prod-usa/twiliolimitedaccess", key: "cuwlBHA2TqjQmxEeCLQi", added: at(2021, 3, 15, 17, 43) },
  { name: "Shivam's calendar", url: "https://speakwith.us/s/shivam", key: "RzM4WOqRhWPRSbqpetWV", added: at(2020, 11, 12, 20, 34) },
  { name: "demo link", url: "https://app.gohighlevel.com/v2/location/bbdl5v24f80cq7wMgvdD/conversations/links/link", key: "rrkKl1qHAnHv0hN8pxoZ", added: at(2023, 2, 24, 13, 16) },
  { name: "Booking Link With Sid", url: "https://www.figma.com/file/lpW1cnt8M4AEERScm4OG4q/Contact%2C-Conversations", key: "CDkBD3xxgUAXtOeF5wLX", added: at(2023, 2, 28, 11, 34) },
  { name: "AG - Test Trigger Link", url: "www.aryan.com/{{contact.name}}", key: "ZmVVEQJMpsBxUrW5yxml", added: at(2023, 6, 19, 20, 8) },
  { name: "Townhall invite", url: "https://community.gohighlevel.com/communities/groups/highlevel-townhall-community/home", key: "O1JA41Qx5zo1J4H5s4KA", added: at(2023, 11, 16, 14, 59) },
];

const PADDING: [string, string][] = [
  ["Spring promo landing page", "https://acmeplumbing.com/spring-promo?utm_source=sms"],
  ["Webinar registration", "https://link.gohighlevel.com/widget/form/Wb7rQ2kLmN4pX9sTzY1c"],
  ["Holiday hours notice", "https://acmeplumbing.com/holiday-hours"],
  ["Referral program", "https://acmeplumbing.com/refer?ref={{contact.id}}"],
  ["Pricing page", "https://acmeplumbing.com/pricing"],
  ["Onboarding checklist", "https://help.gohighlevel.com/support/solutions/articles/48001156541-onboarding-checklist"],
  ["Free consultation booking", "https://link.gohighlevel.com/widget/booking/free-consultation"],
  ["Customer feedback survey", "https://link.gohighlevel.com/widget/survey/Fb3sK8dPq2LmW7xRtY0z?email={{contact.email}}"],
  ["Unsubscribe preferences", "https://acmeplumbing.com/preferences?email={{contact.email}}"],
  ["Black Friday offer", "https://acmeplumbing.com/black-friday"],
  ["Product demo video", "https://www.youtube.com/watch?v=Hq4dX2mTz8k"],
  ["Payment link - invoice", "https://link.gohighlevel.com/invoice/pay/Ip5nV3rKq8LmZ2wX"],
  ["Membership portal login", "https://members.acmeplumbing.com/login"],
  ["Case study download", "https://acmeplumbing.com/case-studies/commercial-retrofit.pdf"],
  ["Support ticket form", "https://link.gohighlevel.com/widget/form/St9pL4mQx7RkZ2vN8bWc"],
  ["Community group invite", "https://community.gohighlevel.com/communities/groups/local-pros/home"],
  ["Affiliate signup", "https://affiliates.acmeplumbing.com/signup"],
  ["Google review - Dallas", "https://search.google.com/local/writereview?placeid=ChIJS5dFe_cZTIYRj2dH9qSb7Lk"],
  ["Facebook review", "https://www.facebook.com/acmeplumbing/reviews"],
  ["Appointment reschedule", "https://link.gohighlevel.com/widget/appointment/reschedule/{{appointment.id}}"],
  ["Newsletter archive", "https://acmeplumbing.com/newsletter"],
  ["Partner directory", "https://acmeplumbing.com/partners"],
  ["Mobile app download", "https://apps.apple.com/us/app/leadconnector/id1564302502"],
];

/** mulberry32 — small, seeded, and the same on the server as in the browser. */
function prng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const KEY_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function makeKey(rand: () => number = Math.random) {
  let out = "";
  for (let i = 0; i < 20; i++) out += KEY_CHARS[Math.floor(rand() * KEY_CHARS.length)];
  return out;
}

const seedRand = prng(20260929);

export const SEED_LINKS: TriggerLink[] = [
  ...LIVE,
  ...PADDING.map(([name, url]) => ({
    name,
    url,
    key: makeKey(seedRand),
    added: at(
      2022 + Math.floor(seedRand() * 3),
      1 + Math.floor(seedRand() * 12),
      1 + Math.floor(seedRand() * 28),
      Math.floor(seedRand() * 24),
      Math.floor(seedRand() * 60),
    ),
  })),
].map((l, i) => ({ ...l, id: `tl-${i + 1}` }));

/**
 * Click events for September 2026.
 *
 * Weighted so the default week (09/22–09/29) has a populated table while
 * earlier weeks differ, which is what makes the range visibly filter.
 */
const CLICK_WEIGHTS: [string, number][] = [
  ["tl-5", 46], // Review Link
  ["tl-3", 31], // High Rating
  ["tl-17", 24], // Townhall invite
  ["tl-2", 18], // Suresh - Shopify Calendar
  ["tl-7", 12], // Mobile App Issue Form
  ["tl-14", 9], // demo link
  ["tl-6", 7], // Low Rating
  ["tl-24", 15], // Free consultation booking
  ["tl-29", 11], // Payment link - invoice
  ["tl-18", 6], // Spring promo landing page
];

const clickRand = prng(9222026);

export const SEED_CLICKS: LinkClick[] = CLICK_WEIGHTS.flatMap(([linkId, n]) =>
  Array.from({ length: n }, () => ({
    linkId,
    at: at(
      2026,
      9,
      1 + Math.floor(clickRand() * 29),
      Math.floor(clickRand() * 24),
      Math.floor(clickRand() * 60),
    ),
  })),
);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Dec 16, 2021 4:47 AM". */
export function formatStamp(ms: number) {
  const d = new Date(ms);
  const h = d.getHours();
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h12}:${mm} ${h < 12 ? "AM" : "PM"}`;
}

export const linkToken = (key: string) => `{{trigger_link.${key}}}`;

/**
 * Loose on purpose: the live list holds "gmail.com" and
 * "www.aryan.com/{{contact.name}}", so a scheme is not required — only
 * something host-shaped, or a merge field standing in for one.
 */
export function isValidUrl(raw: string) {
  const v = raw.trim();
  if (!v || /\s/.test(v.replace(/\{\{[^}]*\}\}/g, ""))) return false;
  return /^\{\{.+\}\}/.test(v) || /^(https?:\/\/)?[^\s/.]+\.[^\s]+/.test(v);
}
