import { BadgePercent, Building2, Clapperboard, CreditCard, PhoneCall, Star, Video } from "lucide-react";
import type { CatalogueEntry } from "@/components/nav/catalogue-types";
import { AiSparkleIcon } from "@/components/icons/ai-sparkle";

/** Which featured product. Plain module so the catalogue can read the pages. */
export type FeaturedKey =
  | "creator"
  | "meetings"
  | "askai"
  | "agency"
  | "voice"
  | "reviews"
  | "textpay"
  // Holiday Promos: a sale, not a product. See NAV_PROMO_PLACEMENTS.
  | "promos";

/**
 * The featured products that have a page to land on.
 *
 * Creator Studio and Meeting Rooms are not in the catalogue — they are
 * the next launches, not shipped products — but "Try" and a card with no L2
 * should land somewhere, so each gets the same placeholder stage every
 * unbuilt product opens on. Kept out of the catalogue on purpose: in it they
 * would turn up in All products and the add picker as if they had shipped.
 * Ashwin, Oct 29.
 *
 * Out of `catalogue`, but in `productById` (see FEATURED_PAGE_BY_ID), so a
 * pinned featured product is an ordinary pin: same list, same order, same
 * row. Ask AI's entry is only for that; its Try opens the real panel.
 * Ashwin, Nov 17.
 */
export const FEATURED_PAGES: Partial<Record<FeaturedKey, CatalogueEntry & { home: string }>> = {
  creator: {
    id: "featured-creator-studio",
    label: "Creator Studio",
    home: "Marketing",
    icon: Clapperboard,
    blurb: "Plan, film, and publish short videos for every channel from one place.",
    badge: { label: "New", tone: "new" },
  },
  meetings: {
    id: "featured-meeting-rooms",
    label: "Meeting Rooms",
    home: "CRM",
    icon: Video,
    blurb: "Host branded video calls that log notes and next steps to the contact.",
    badge: { label: "New", tone: "new" },
  },
  /*
   * The rest get the same placeholder page, so no Try ends on a "not in this
   * prototype" toast. Ask AI has none: it is a real product here and opens
   * the Ask AI panel. Ashwin, Nov 17.
   */
  askai: {
    id: "featured-ask-ai",
    label: "Ask AI",
    home: "the top bar",
    // The Ask AI product's own outline sparkle, not lucide's. Ashwin, Nov 17.
    icon: AiSparkleIcon,
    blurb: "Ask questions about your contacts, pipelines, and reports, from any page.",
    badge: { label: "New", tone: "new" },
  },
  promos: {
    id: "featured-holiday-promos",
    label: "Holiday Promos",
    home: "Promotions",
    icon: BadgePercent,
    blurb: "Black Friday and Cyber Monday offers on plans and add-ons, Nov 23–Dec 6.",
    badge: { label: "New", tone: "new" },
  },
  voice: {
    id: "featured-voice-ai",
    label: "Voice AI",
    home: "Automation",
    icon: PhoneCall,
    blurb: "An AI agent that answers calls, books appointments, and logs every call to the contact.",
    badge: { label: "New", tone: "new" },
  },
  reviews: {
    id: "featured-reviews-ai",
    label: "Reviews AI",
    home: "Reputation",
    icon: Star,
    blurb: "Reply to every Google and Facebook review in your brand’s voice, automatically or after a check.",
    badge: { label: "New", tone: "new" },
  },
  textpay: {
    id: "featured-text-to-pay",
    label: "Text to pay",
    home: "Payments",
    icon: CreditCard,
    blurb: "Send a payment link by text and get paid from the conversation, with no invoice to chase.",
    badge: { label: "New", tone: "new" },
  },
  agency: {
    id: "featured-client-portal",
    label: "Client portal",
    home: "Sites",
    icon: Building2,
    blurb: "Your agency’s client portal, with reports and requests in one place.",
    badge: { label: "New", tone: "new" },
  },
};

/** Featured page id → its entry. Read by `productById`. */
export const FEATURED_PAGE_BY_ID = new Map<string, CatalogueEntry & { home: string }>(
  Object.values(FEATURED_PAGES).map((p) => [p.id, p]),
);

/** The page id a featured product pins as. */
export const featuredPinId = (key: FeaturedKey): string | null => FEATURED_PAGES[key]?.id ?? null;
