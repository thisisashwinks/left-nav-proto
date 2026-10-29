"use client";

import * as React from "react";
import { Building2, Clapperboard, Sparkles, Video, type LucideIcon } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import type { CatalogueEntry } from "@/components/nav/catalogue-types";

/**
 * The featured-product slot: a rotating promo spot in the L1.
 *
 * Khoi's ask (Oct 28): we will keep needing to put a high-profile product in
 * front of people — Ask AI now, Creator Studio or Meeting Rooms next — without
 * reshuffling the L1 every month. One slot, a fixed run with an end date, an
 * L2 that explains the product and asks to be pinned, and a visible way out:
 * after the run the product lives in its home category, or wherever the user
 * pinned it. Explored first as an artifact mock, then built here as prototype
 * controls. Ashwin, Oct 29.
 *
 * This file is the shared contract: the product data, the slot's session state
 * (what is open, pinned, dismissed, whether the run has ended) and the events
 * the prototype controls fire. The L1 entries, the L2 panel and Ask AI's
 * placements each render from it.
 */

export type FeaturedKey = "creator" | "meetings" | "askai" | "agency";

export interface FeaturedProduct {
  key: FeaturedKey;
  name: string;
  icon: LucideIcon;
  /** Where it lives after the run, as a reader would name it. */
  home: string;
  /** The L1 category whose L2 carries the promo card or row, if any. */
  homeCategory: string | null;
  /** The run's last day, as shown ("Jan 31"). */
  ends: string;
  /** One line for cards. */
  tagline: string;
  /** Two lines for the explainer and the What's new list. */
  blurb: string;
  points: readonly string[];
  /** A placeholder 16:9 image for the card's media slot, from public/featured. */
  image: string;
}

export const FEATURED_PRODUCTS: Record<FeaturedKey, FeaturedProduct> = {
  creator: {
    key: "creator",
    image: "/featured/creator.svg",
    name: "Creator Studio",
    icon: Clapperboard,
    home: "Marketing",
    homeCategory: "Marketing",
    ends: "Jan 31",
    tagline: "Short videos for every channel.",
    blurb: "Plan, film, and publish short videos for every channel from one place.",
    points: [
      "Turn one recording into clips for 5 channels",
      "Captions and brand kit applied for you",
      "Schedule straight to Social Planner",
    ],
  },
  meetings: {
    key: "meetings",
    image: "/featured/meetings.svg",
    name: "Meeting Rooms",
    icon: Video,
    home: "CRM",
    homeCategory: "CRM",
    ends: "Feb 28",
    tagline: "Branded video calls, notes logged.",
    blurb: "Host branded video calls that log notes and next steps to the contact.",
    points: ["Join links on every appointment", "AI notes saved to the contact", "No downloads for guests"],
  },
  askai: {
    key: "askai",
    image: "/featured/askai.svg",
    name: "Ask AI",
    icon: Sparkles,
    home: "the top bar",
    homeCategory: null,
    ends: "Jan 31",
    tagline: "Answers from your account data.",
    blurb: "Ask questions about your contacts, pipelines, and reports, from any page.",
    points: ["Answers grounded in this sub-account", "Draft emails, workflows, and replies", "Press ⌘J from anywhere"],
  },
  agency: {
    key: "agency",
    image: "/featured/agency.svg",
    name: "Client portal",
    icon: Building2,
    home: "Sites",
    homeCategory: "Sites",
    ends: "Mar 15",
    tagline: "Reports and requests in one place.",
    blurb: "Your agency’s client portal, with reports and requests in one place.",
    points: ["Monthly performance reports", "Request changes from your agency", "Shared files and approvals"],
  },
};

const ORDER: readonly FeaturedKey[] = ["creator", "meetings", "askai"];

/**
 * The featured products that have a page to land on.
 *
 * Creator Studio and Meeting Rooms are not in the catalogue — they are
 * the next launches, not shipped products — but "Try" and a card with no L2
 * should land somewhere, so each gets the same placeholder stage every
 * unbuilt product opens on. Kept out of the catalogue on purpose: in it they
 * would turn up in All products and the add picker as if they had shipped.
 * Ashwin, Oct 29.
 */
const FEATURED_PAGES: Partial<Record<FeaturedKey, CatalogueEntry & { home: string }>> = {
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
};

/** The placeholder page for a featured product's id, if it has one. */
export function featuredPageById(id: string): (CatalogueEntry & { home: string }) | null {
  return Object.values(FEATURED_PAGES).find((p) => p.id === id) ?? null;
}

/** Fired to open a featured product's page. `detail` is the page's product id. */
export const NAV_FEATURED_OPEN_PAGE_EVENT = "nav-featured:open-page";

/** Opens the product, or says it is not here yet when it has no page. */
export function openFeaturedProduct(key: FeaturedKey): string | null {
  const page = FEATURED_PAGES[key];
  if (!page) return `${FEATURED_PRODUCTS[key].name} isn’t in this prototype yet.`;
  window.dispatchEvent(new CustomEvent(NAV_FEATURED_OPEN_PAGE_EVENT, { detail: page.id }));
  return null;
}

/** Fired by the prototype controls. */
export const NAV_FEATURED_END_EVENT = "nav-featured:end";
export const NAV_FEATURED_RESET_EVENT = "nav-featured:reset";

/** What the L2 panel shows: one product's explainer, or the grouped list. */
export type FeaturedOpen = { kind: "product"; key: FeaturedKey } | { kind: "whatsnew" } | null;

interface FeaturedContextValue {
  /** The products in the slot right now, lead first. Empty when the slot is off or the run ended. */
  list: readonly FeaturedProduct[];
  open: FeaturedOpen;
  setOpen: (open: FeaturedOpen) => void;
  /** Featured products the user pinned. They outlive the run. */
  pinned: readonly FeaturedKey[];
  togglePin: (key: FeaturedKey) => void;
  /** The carousel's and the deck's front card, as an index into `list`. */
  slide: number;
  setSlide: (slide: number) => void;
  /** Drop one product from the slot for this session (the card's close X). */
  dismiss: (key: FeaturedKey) => void;
  /** Go straight to the product, for cards with no L2. */
  launch: (key: FeaturedKey) => void;
  /** The L2 promo card was dismissed. */
  promoDismissed: boolean;
  dismissPromo: () => void;
  ended: boolean;
  /** The product whose promo belongs in this L1 category's L2, if any. */
  promoFor: (category: string) => FeaturedProduct | null;
  /** A short confirmation, for whichever toast the shell shows. */
  message: string | null;
  clearMessage: () => void;
}

const FeaturedContext = React.createContext<FeaturedContextValue | null>(null);

export function FeaturedProvider({ children }: { children: React.ReactNode }) {
  const { navFeaturedSlot, navFeaturedCount, navFeaturedLead, navFeaturedAgency, navFeaturedPromo } =
    useTheme().effective;
  const [open, setOpen] = React.useState<FeaturedOpen>(null);
  const [pinned, setPinned] = React.useState<FeaturedKey[]>([]);
  const [slide, setSlide] = React.useState(0);
  const [promoDismissed, setPromoDismissed] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const [dismissed, setDismissed] = React.useState<FeaturedKey[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);

  const list = React.useMemo(() => {
    if (ended || navFeaturedSlot === "off" || navFeaturedAgency === "off") return [];
    const keys: FeaturedKey[] = [navFeaturedLead, ...ORDER.filter((k) => k !== navFeaturedLead)].slice(
      0,
      Number(navFeaturedCount),
    );
    if (navFeaturedAgency === "custom") keys.splice(0, 1, "agency");
    return keys.filter((k) => !dismissed.includes(k)).map((k) => FEATURED_PRODUCTS[k]);
  }, [ended, navFeaturedSlot, navFeaturedAgency, navFeaturedLead, navFeaturedCount, dismissed]);

  // A different line-up starts a fresh run: nothing open, the first card in front.
  const lineup = list.map((p) => p.key).join();
  const [seenLineup, setSeenLineup] = React.useState(lineup);
  if (seenLineup !== lineup) {
    setSeenLineup(lineup);
    setSlide(0);
    setOpen(null);
  }

  React.useEffect(() => {
    const end = () => {
      setOpen(null);
      setEnded((was) => {
        if (was) return was;
        return true;
      });
      setMessage("This run ended. Pinned products stay; the rest went back to their home categories.");
    };
    const reset = () => {
      setOpen(null);
      setPinned([]);
      setSlide(0);
      setPromoDismissed(false);
      setEnded(false);
      setDismissed([]);
      setMessage(null);
    };
    window.addEventListener(NAV_FEATURED_END_EVENT, end);
    window.addEventListener(NAV_FEATURED_RESET_EVENT, reset);
    return () => {
      window.removeEventListener(NAV_FEATURED_END_EVENT, end);
      window.removeEventListener(NAV_FEATURED_RESET_EVENT, reset);
    };
  }, []);

  const value = React.useMemo<FeaturedContextValue>(
    () => ({
      list,
      open,
      setOpen,
      pinned,
      togglePin: (key) => {
        const name = FEATURED_PRODUCTS[key].name;
        setPinned((p) => (p.includes(key) ? p.filter((k) => k !== key) : [key, ...p]));
        setMessage(
          pinned.includes(key) ? `Unpinned ${name}` : `Pinned ${name}. It stays in your sidebar after this run ends.`,
        );
      },
      slide,
      setSlide,
      dismiss: (key) => {
        setDismissed((d) => (d.includes(key) ? d : [...d, key]));
        setOpen(null);
        setMessage(`Hid ${FEATURED_PRODUCTS[key].name}. Find it in ${FEATURED_PRODUCTS[key].home}.`);
      },
      launch: (key) => {
        setOpen(null);
        const missing = openFeaturedProduct(key);
        if (missing) setMessage(missing);
      },
      promoDismissed,
      dismissPromo: () => {
        setPromoDismissed(true);
        setMessage("Got it. We won’t show this again.");
      },
      ended,
      promoFor: (category) =>
        navFeaturedPromo === "off" || promoDismissed
          ? null
          : (list.find((p) => p.homeCategory === category) ?? null),
      message,
      clearMessage: () => setMessage(null),
    }),
    [list, open, pinned, slide, promoDismissed, ended, navFeaturedPromo, message],
  );

  return <FeaturedContext.Provider value={value}>{children}</FeaturedContext.Provider>;
}

export function useFeatured(): FeaturedContextValue {
  const ctx = React.useContext(FeaturedContext);
  if (!ctx) throw new Error("useFeatured needs a FeaturedProvider");
  return ctx;
}
