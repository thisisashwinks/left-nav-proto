/**
 * The marketplace's agents, and the facets the sidebar filters them by.
 *
 * Dummy rows modelled on the live marketplace's first screen (the top six
 * voice listings keep their real titles, makers, ratings and listen counts so
 * the prototype reads like the page reviewers know). Every facet is an ARRAY on
 * the agent rather than a single value: a receptionist that also books is both
 * use cases, and a filter that could only tick one would hide it from half the
 * people looking for it.
 */

export type AgentChannel = "voice" | "conversation";

/** Which HighRise ramp tints the portrait — stands in for the maker's photo. */
export type PortraitTone = "violet" | "primary" | "warning" | "success" | "error" | "gray";

export interface AgentTemplate {
  id: string;
  /** The line on the band — the agent's own name, not the listing's title. */
  persona: string;
  title: string;
  author: string;
  description: string;
  channel: AgentChannel;
  categories: string[];
  useCases: string[];
  niches: string[];
  paid: boolean;
  actions: string[];
  contains: string[];
  installers: string[];
  /** 0–5, one decimal. */
  rating: number;
  reviews: number;
  /** Demo calls played, the way the marketplace counts interest. */
  listens: number;
  tone: PortraitTone;
  initials: string;
}

export type FacetId =
  | "categories"
  | "useCases"
  | "niches"
  | "pricing"
  | "actions"
  | "contains"
  | "installers";

export interface Facet {
  id: FacetId;
  label: string;
  options: string[];
}

/** Collapsed accordion sections under the channel radio, in the live order. */
export const FACETS: Facet[] = [
  {
    id: "categories",
    label: "Categories",
    options: ["Sales", "Customer support", "Front desk", "Marketing", "Reputation"],
  },
  {
    id: "useCases",
    label: "Use cases",
    options: ["Receptionist", "Appointment booking", "Lead qualification", "FAQ", "Sales", "Follow-up"],
  },
  {
    id: "niches",
    label: "Business niche",
    options: ["Real estate", "Healthcare", "Automotive", "Home services", "Legal", "Salon & spa", "Agencies"],
  },
  { id: "pricing", label: "Pricing", options: ["Free", "Paid"] },
  {
    id: "actions",
    label: "Actions",
    options: ["Book appointment", "Transfer call", "Send SMS", "Update contact", "Trigger workflow"],
  },
  {
    id: "contains",
    label: "Agent contains",
    options: ["Knowledge base", "Custom prompt", "Workflows", "Calendar"],
  },
  {
    id: "installers",
    label: "Who can install the app?",
    options: ["Agency", "Sub-account"],
  },
];

/** The value an agent holds for a facet, as a list to match against. */
export function facetValues(agent: AgentTemplate, id: FacetId): string[] {
  return id === "pricing" ? [agent.paid ? "Paid" : "Free"] : agent[id];
}

/** 208_200 → "208.2K" — the marketplace's own compact count. */
export function formatListens(n: number): string {
  if (n < 1000) return `${n}`;
  return `${(n / 1000).toFixed(1)}K`;
}

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    id: "samantha",
    persona: "AI Sells Itself",
    title: "Samantha - She Sells and Books",
    author: "Josh Ads",
    description: "Let Samantha do the talking, from the first hello to a slot on your calendar.",
    channel: "voice",
    categories: ["Sales"],
    useCases: ["Sales", "Appointment booking"],
    niches: ["Agencies"],
    paid: false,
    actions: ["Book appointment", "Update contact", "Send SMS"],
    contains: ["Custom prompt", "Calendar"],
    installers: ["Agency", "Sub-account"],
    rating: 4.4,
    reviews: 15,
    listens: 208_200,
    tone: "violet",
    initials: "SA",
  },
  {
    id: "maya",
    persona: "Maya",
    title: "All-in-one Receptionist",
    author: "Maximos AI",
    description: "The all-in-one voice agent for sales and support, on every line you own.",
    channel: "voice",
    categories: ["Front desk", "Customer support"],
    useCases: ["Receptionist", "FAQ"],
    niches: ["Home services", "Salon & spa"],
    paid: false,
    actions: ["Transfer call", "Book appointment", "Update contact"],
    contains: ["Knowledge base", "Calendar"],
    installers: ["Agency", "Sub-account"],
    rating: 5,
    reviews: 5,
    listens: 164_100,
    tone: "primary",
    initials: "MA",
  },
  {
    id: "extendly",
    persona: "Receptionist (FAQ) +1 More",
    title: "#1 AI Voice Receptionist & FAQ Desk",
    author: "Extendly",
    description: "The local business receptionist that answers the 20 questions you hear every day.",
    channel: "voice",
    categories: ["Customer support"],
    useCases: ["Receptionist", "FAQ"],
    niches: ["Home services", "Legal"],
    paid: false,
    actions: ["Transfer call", "Send SMS"],
    contains: ["Knowledge base", "Custom prompt"],
    installers: ["Agency"],
    rating: 3.7,
    reviews: 3,
    listens: 57_700,
    tone: "gray",
    initials: "EX",
  },
  {
    id: "frontdoor",
    persona: "FrontDoor AI",
    title: "FrontDoor AI",
    author: "DELLWING ONLINE GmbH",
    description: "An AI voice receptionist that books appointments while you work.",
    channel: "voice",
    categories: ["Front desk"],
    useCases: ["Receptionist", "Appointment booking"],
    niches: ["Home services", "Salon & spa"],
    paid: false,
    actions: ["Book appointment", "Update contact"],
    contains: ["Calendar", "Workflows"],
    installers: ["Sub-account"],
    rating: 5,
    reviews: 1,
    listens: 31_000,
    tone: "success",
    initials: "FD",
  },
  {
    id: "leadflow",
    persona: "Ava",
    title: "LeadFlow Receptionist AI",
    author: "The One Technologies",
    description: "Book in a breeze — just say the word, and Ava finds the time.",
    channel: "voice",
    categories: ["Sales", "Front desk"],
    useCases: ["Lead qualification", "Receptionist"],
    niches: ["Real estate", "Agencies"],
    paid: true,
    actions: ["Book appointment", "Trigger workflow", "Update contact"],
    contains: ["Workflows", "Custom prompt"],
    installers: ["Agency", "Sub-account"],
    rating: 5,
    reviews: 1,
    listens: 21_100,
    tone: "warning",
    initials: "AV",
  },
  {
    id: "auto-repair",
    persona: "Auto Repair & Services",
    title: "Auto Repair & Services Voice Agent",
    author: "CRM Pros LLC",
    description: "Answers the shop's phone so nobody has to put a wrench down.",
    channel: "voice",
    categories: ["Front desk"],
    useCases: ["Receptionist", "Appointment booking"],
    niches: ["Automotive"],
    paid: true,
    actions: ["Book appointment", "Transfer call", "Send SMS"],
    contains: ["Knowledge base", "Calendar"],
    installers: ["Agency"],
    rating: 4,
    reviews: 1,
    listens: 20_300,
    tone: "error",
    initials: "AR",
  },
  {
    id: "emma",
    persona: "Emma",
    title: "Emma - AI Medical Receptionist",
    author: "Personaline",
    description: "Smarter front desk for clinics, from intake questions to rebooking.",
    channel: "voice",
    categories: ["Front desk", "Customer support"],
    useCases: ["Receptionist", "Appointment booking"],
    niches: ["Healthcare"],
    paid: true,
    actions: ["Book appointment", "Transfer call", "Update contact"],
    contains: ["Knowledge base", "Calendar"],
    installers: ["Sub-account"],
    rating: 4.5,
    reviews: 8,
    listens: 16_800,
    tone: "primary",
    initials: "EM",
  },
  {
    id: "realty",
    persona: "Listing Line",
    title: "Real Estate Listing Line Agent",
    author: "CRM Pros LLC",
    description: "Answers the listing line, qualifies the buyer, and books the viewing.",
    channel: "voice",
    categories: ["Sales"],
    useCases: ["Lead qualification", "Appointment booking"],
    niches: ["Real estate"],
    paid: false,
    actions: ["Book appointment", "Update contact", "Trigger workflow"],
    contains: ["Custom prompt", "Calendar", "Workflows"],
    installers: ["Agency", "Sub-account"],
    rating: 4.2,
    reviews: 6,
    listens: 15_600,
    tone: "success",
    initials: "LL",
  },
  {
    id: "counsel",
    persona: "Intake Desk",
    title: "Law Firm Intake Voice Agent",
    author: "Brightline Legal Tech",
    description: "Screens new matters, captures the facts, and routes urgent calls to an attorney.",
    channel: "voice",
    categories: ["Front desk"],
    useCases: ["Receptionist", "Lead qualification"],
    niches: ["Legal"],
    paid: true,
    actions: ["Transfer call", "Update contact"],
    contains: ["Knowledge base", "Custom prompt"],
    installers: ["Agency"],
    rating: 4.8,
    reviews: 4,
    listens: 9_400,
    tone: "gray",
    initials: "ID",
  },
  {
    id: "nova",
    persona: "Nova",
    title: "Website Chat That Qualifies",
    author: "Fieldstone Labs",
    description: "Greets every visitor and asks the 3 questions your sales team always asks.",
    channel: "conversation",
    categories: ["Sales", "Marketing"],
    useCases: ["Lead qualification", "Sales"],
    niches: ["Agencies", "Real estate"],
    paid: false,
    actions: ["Update contact", "Trigger workflow"],
    contains: ["Custom prompt", "Workflows"],
    installers: ["Agency", "Sub-account"],
    rating: 4.6,
    reviews: 22,
    listens: 44_200,
    tone: "violet",
    initials: "NO",
  },
  {
    id: "rally",
    persona: "Rally",
    title: "SMS Follow-up That Never Forgets",
    author: "Northbeam Studio",
    description: "Chases a quiet lead for 2 weeks and stops the moment they reply.",
    channel: "conversation",
    categories: ["Marketing", "Sales"],
    useCases: ["Follow-up", "Sales"],
    niches: ["Home services", "Automotive"],
    paid: true,
    actions: ["Send SMS", "Update contact"],
    contains: ["Workflows"],
    installers: ["Sub-account"],
    rating: 4.8,
    reviews: 9,
    listens: 31_700,
    tone: "error",
    initials: "RA",
  },
  {
    id: "glow",
    persona: "Glow",
    title: "Salon Booking Chat Assistant",
    author: "Maximos AI",
    description: "Books cuts and color over Instagram, Facebook, and SMS without the back-and-forth.",
    channel: "conversation",
    categories: ["Front desk"],
    useCases: ["Appointment booking", "FAQ"],
    niches: ["Salon & spa"],
    paid: false,
    actions: ["Book appointment", "Send SMS"],
    contains: ["Calendar", "Knowledge base"],
    installers: ["Agency", "Sub-account"],
    rating: 4.3,
    reviews: 11,
    listens: 18_900,
    tone: "warning",
    initials: "GL",
  },
  {
    id: "echo",
    persona: "Echo",
    title: "Review Replies in Your Voice",
    author: "Extendly",
    description: "Drafts a reply to every review and waits for your nod before it posts.",
    channel: "conversation",
    categories: ["Reputation"],
    useCases: ["Follow-up"],
    niches: ["Healthcare", "Home services", "Legal"],
    paid: false,
    actions: ["Update contact", "Trigger workflow"],
    contains: ["Custom prompt"],
    installers: ["Agency"],
    rating: 4.1,
    reviews: 6,
    listens: 12_300,
    tone: "primary",
    initials: "EC",
  },
  {
    id: "helpdesk",
    persona: "Support Desk",
    title: "24/7 Support Chat Agent",
    author: "The One Technologies",
    description: "Answers order and account questions from your knowledge base, day and night.",
    channel: "conversation",
    categories: ["Customer support"],
    useCases: ["FAQ"],
    niches: ["Agencies", "Healthcare"],
    paid: true,
    actions: ["Send SMS", "Update contact"],
    contains: ["Knowledge base"],
    installers: ["Agency", "Sub-account"],
    rating: 3.9,
    reviews: 7,
    listens: 8_600,
    tone: "gray",
    initials: "SD",
  },
];
