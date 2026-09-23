/**
 * The marketplace's agents, and the facets the rail filters them by.
 *
 * Dummy rows. The makers, the install counts and the ratings are invented, but
 * the SHAPE is not: every card carries a maker, a price, a rating and a listen
 * count because those four are what a buyer compares, and a gallery whose cards
 * carry different facts from one another is a gallery you cannot scan.
 */

export type AgentChannel = "voice" | "conversation";

export interface AgentTemplate {
  id: string;
  /** The line on the poster — the agent's own name, not the listing's title. */
  persona: string;
  title: string;
  maker: string;
  blurb: string;
  channel: AgentChannel;
  category: string;
  useCase: string;
  niche: string;
  paid: boolean;
  installed?: boolean;
  /** 0–5, one decimal. */
  rating: number;
  /** How many ratings that average is over. Zero means no reviews yet. */
  reviews: number;
  /** Demo calls played, the way the marketplace counts interest. */
  listens: string;
  /** The poster's gradient — stands in for the maker's artwork. */
  poster: string;
  /** Two letters in the avatar ring. */
  initials: string;
}

export const agentTemplates: AgentTemplate[] = [
  {
    id: "samantha",
    persona: "AI sells itself",
    title: "Samantha — she sells and books",
    maker: "Josh Ads",
    blurb:
      "Let Samantha do the talking, from the first hello to a slot on your calendar.",
    channel: "voice",
    category: "Sales",
    useCase: "Book appointments",
    niche: "Agencies",
    paid: false,
    installed: true,
    rating: 4.4,
    reviews: 15,
    listens: "201.6K",
    poster: "linear-gradient(135deg,#4c1d95 0%,#7c3aed 55%,#f472b6 100%)",
    initials: "SA",
  },
  {
    id: "maya",
    persona: "Maya",
    title: "All-in-one receptionist",
    maker: "Maximos AI",
    blurb:
      "The all-in-one voice agent for sales and support, on every line you own.",
    channel: "voice",
    category: "Support",
    useCase: "Answer calls",
    niche: "Local business",
    paid: false,
    rating: 5,
    reviews: 5,
    listens: "155.6K",
    poster: "linear-gradient(135deg,#0c4a6e 0%,#0ea5e9 55%,#a5f3fc 100%)",
    initials: "MA",
  },
  {
    id: "extendly",
    persona: "Receptionist (FAQ) +1 more",
    title: "#1 AI voice receptionist and FAQ desk",
    maker: "Extendly",
    blurb:
      "The local business receptionist that answers the twenty questions you are asked every day.",
    channel: "voice",
    category: "Support",
    useCase: "Answer FAQs",
    niche: "Local business",
    paid: false,
    rating: 3.7,
    reviews: 3,
    listens: "55.6K",
    poster: "linear-gradient(135deg,#1e293b 0%,#475569 55%,#cbd5e1 100%)",
    initials: "RE",
  },
  {
    id: "frontdoor",
    persona: "FrontDoor AI",
    title: "FrontDoor AI",
    maker: "Dellwing Online GmbH",
    blurb: "An AI voice receptionist that books appointments while you work.",
    channel: "voice",
    category: "Front desk",
    useCase: "Book appointments",
    niche: "Home services",
    paid: false,
    rating: 5,
    reviews: 1,
    listens: "30.1K",
    poster: "linear-gradient(135deg,#134e4a 0%,#0d9488 55%,#5eead4 100%)",
    initials: "FD",
  },
  {
    id: "leadflow",
    persona: "Ava",
    title: "LeadFlow receptionist AI",
    maker: "The One Technologies",
    blurb: "Book in a breeze — just say the word.",
    channel: "voice",
    category: "Sales",
    useCase: "Qualify leads",
    niche: "Agencies",
    paid: true,
    rating: 5,
    reviews: 1,
    listens: "20.5K",
    poster: "linear-gradient(135deg,#312e81 0%,#4f46e5 55%,#c7d2fe 100%)",
    initials: "AV",
  },
  {
    id: "auto-repair",
    persona: "Auto repair & services",
    title: "Auto repair and services voice agent",
    maker: "CRM Pros LLC",
    blurb: "Answers the shop's phone so nobody has to put a wrench down.",
    channel: "voice",
    category: "Front desk",
    useCase: "Answer calls",
    niche: "Automotive",
    paid: true,
    rating: 4,
    reviews: 1,
    listens: "20.0K",
    poster: "linear-gradient(135deg,#7c2d12 0%,#ea580c 55%,#fed7aa 100%)",
    initials: "AR",
  },
  {
    id: "justin",
    persona: "Justin",
    title: "Justin — your unbreakable front desk",
    maker: "BeVisible Online Solutions Ltd.",
    blurb:
      "A voice assistant built for the calls that come in at 11 PM on a Sunday.",
    channel: "voice",
    category: "Front desk",
    useCase: "Answer calls",
    niche: "Local business",
    paid: false,
    rating: 5,
    reviews: 1,
    listens: "17.4K",
    poster: "linear-gradient(135deg,#0f172a 0%,#334155 55%,#94a3b8 100%)",
    initials: "JU",
  },
  {
    id: "emma",
    persona: "Emma — AI voice medical receptionist",
    title: "Emma — AI voice medical receptionist",
    maker: "Personaline",
    blurb: "Smarter support for clinics, from triage questions to rebooking.",
    channel: "voice",
    category: "Support",
    useCase: "Book appointments",
    niche: "Healthcare",
    paid: true,
    rating: 0,
    reviews: 0,
    listens: "16.8K",
    poster: "linear-gradient(135deg,#0e7490 0%,#06b6d4 55%,#cffafe 100%)",
    initials: "EM",
  },
  {
    id: "real-estate",
    persona: "Real estate services",
    title: "Real estate services voice agent",
    maker: "CRM Pros LLC",
    blurb: "Answers the listing line, qualifies the buyer, books the viewing.",
    channel: "voice",
    category: "Sales",
    useCase: "Qualify leads",
    niche: "Real estate",
    paid: false,
    rating: 0,
    reviews: 0,
    listens: "15.6K",
    poster: "linear-gradient(135deg,#3f6212 0%,#65a30d 55%,#d9f99d 100%)",
    initials: "RS",
  },
  {
    id: "webchat",
    persona: "Nova",
    title: "Website chat that qualifies",
    maker: "Fieldstone Labs",
    blurb:
      "Greets the visitor, asks the three questions your sales team always asks.",
    channel: "conversation",
    category: "Sales",
    useCase: "Qualify leads",
    niche: "Agencies",
    paid: false,
    rating: 4.6,
    reviews: 22,
    listens: "44.2K",
    poster: "linear-gradient(135deg,#581c87 0%,#a855f7 55%,#f5d0fe 100%)",
    initials: "NO",
  },
  {
    id: "sms-followup",
    persona: "Rally",
    title: "SMS follow-up that never forgets",
    maker: "Northbeam Studio",
    blurb: "Chases a quiet lead for two weeks and stops the moment they reply.",
    channel: "conversation",
    category: "Nurture",
    useCase: "Follow up",
    niche: "Home services",
    paid: true,
    installed: true,
    rating: 4.8,
    reviews: 9,
    listens: "31.7K",
    poster: "linear-gradient(135deg,#7f1d1d 0%,#dc2626 55%,#fecaca 100%)",
    initials: "RA",
  },
  {
    id: "review-reply",
    persona: "Echo",
    title: "Review replies in your voice",
    maker: "Extendly",
    blurb: "Drafts a reply to every review and waits for your nod before it posts.",
    channel: "conversation",
    category: "Reputation",
    useCase: "Follow up",
    niche: "Local business",
    paid: false,
    rating: 4.1,
    reviews: 6,
    listens: "12.3K",
    poster: "linear-gradient(135deg,#164e63 0%,#0891b2 55%,#bae6fd 100%)",
    initials: "EC",
  },
];

/**
 * The rail's facets, as data.
 *
 * The channel is a radio and everything else is a set of checkboxes, which is
 * the real distinction rather than a styling one: an agent has exactly one
 * channel and any number of the rest, so a channel is a question with one
 * answer and the others are filters you stack.
 */
export interface FacetGroup {
  id: keyof Pick<AgentTemplate, "category" | "useCase" | "niche"> | "pricing";
  label: string;
  options: string[];
}

export const FACETS: FacetGroup[] = [
  {
    id: "category",
    label: "Categories",
    options: ["Sales", "Support", "Front desk", "Nurture", "Reputation"],
  },
  {
    id: "useCase",
    label: "Use cases",
    options: [
      "Answer calls",
      "Book appointments",
      "Qualify leads",
      "Answer FAQs",
      "Follow up",
    ],
  },
  {
    id: "niche",
    label: "Business niche",
    options: [
      "Agencies",
      "Local business",
      "Home services",
      "Healthcare",
      "Automotive",
      "Real estate",
    ],
  },
  { id: "pricing", label: "Pricing", options: ["Free", "Paid"] },
];
