"use client";

import * as React from "react";
import { BadgePercent, Building2, Clapperboard, CreditCard, PhoneCall, Play, Rocket, Star, Video, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme/theme-provider";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { resolveGroups } from "@/components/nav/grouping";
import type { CatalogueEntry } from "@/components/nav/catalogue-types";
import { AiSparkleIcon } from "@/components/icons/ai-sparkle";

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

import { FEATURED_PAGES, featuredPinId, type FeaturedKey } from "@/components/nav/featured-pages";
import { usePromosHeld } from "@/components/nav/nav-tour";
import { PROPOSED_HOME_ID } from "@/components/nav/proposed-ia";
export type { FeaturedKey };

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
  /**
   * The product's still: a 16:10 crop of its real screen in this prototype,
   * from public/featured/<key>.png — replaced the gradient SVG art, which
   * read as filler. Client portal keeps its SVG until it has a screen to crop.
   * Ashwin, Nov 17.
   */
  image: string;
}

export const FEATURED_PRODUCTS: Record<FeaturedKey, FeaturedProduct> = {
  /*
   * Not a product: a time-bound sale, featured the same way so it can take a
   * card. Its "Try" opens a landing page with a promo banner. See
   * NAV_PROMO_PLACEMENTS. Ashwin, Nov 17.
   */
  promos: {
    key: "promos",
    image: "/featured/promos.svg",
    name: "Holiday Promos",
    icon: BadgePercent,
    home: "Promotions",
    homeCategory: null,
    ends: "Dec 6",
    tagline: "Black Friday and Cyber Monday offers.",
    blurb: "Save on plans and add-ons this Black Friday and Cyber Monday. Offers run Nov 23–Dec 6.",
    points: ["Up to 40% off annual plans", "Bundle deals on AI add-ons", "Live Nov 23–Dec 6"],
  },
  /*
   * Not a product either: the account's own setup guide, featured the same
   * way for the spot that draws it down here instead of as the progress card
   * under search. Its "Try" opens the Launchpad page the card's own door
   * opens. See LAUNCHPAD_SPOTS.
   */
  launchpad: {
    key: "launchpad",
    image: "/featured/launchpad.svg",
    name: "Finish setting up",
    icon: Rocket,
    home: "Launchpad",
    homeCategory: null,
    ends: "",
    /*
     * No numbers in the tagline: the progress axis owns them, and two
     * surfaces for one fact is how one of them goes stale. See
     * LAUNCHPAD_CARD_PROGRESS.
     */
    tagline: "A few steps left to go.",
    blurb: "Finish setting up before your account is ready to take work.",
    points: [
      "Connect a phone number and a domain",
      "Import your contacts",
      "Publish your first funnel",
    ],
  },
  creator: {
    key: "creator",
    image: "/featured/creator.png",
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
    image: "/featured/meetings.png",
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
    image: "/featured/askai.png",
    name: "Ask AI",
    // The Ask AI product's own outline sparkle, not lucide's. Ashwin, Nov 17.
    icon: AiSparkleIcon,
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
  voice: {
    key: "voice",
    image: "/featured/voice.png",
    name: "Voice AI",
    icon: PhoneCall,
    home: "Automation",
    homeCategory: "Automation",
    ends: "Mar 31",
    tagline: "An AI agent that answers every call.",
    blurb: "An AI agent that answers calls, books appointments, and logs every call to the contact.",
    points: ["Answers 24/7 in your brand’s voice", "Books straight into your calendars", "Call summaries saved to the contact"],
  },
  reviews: {
    key: "reviews",
    image: "/featured/reviews.png",
    name: "Reviews AI",
    icon: Star,
    home: "Reputation",
    homeCategory: "Reputation",
    ends: "Mar 31",
    tagline: "Replies to every review, on brand.",
    blurb: "Reply to every Google and Facebook review in your brand’s voice, automatically or after a check.",
    points: ["Drafts a reply to each new review", "Approve first, or send automatically", "Flags unhappy customers for follow-up"],
  },
  textpay: {
    key: "textpay",
    image: "/featured/textpay.png",
    name: "Text to pay",
    icon: CreditCard,
    home: "Payments",
    homeCategory: "Payments",
    ends: "Apr 15",
    tagline: "Get paid with a link in a text.",
    blurb: "Send a payment link by text and get paid from the conversation, with no invoice to chase.",
    points: ["Payment links from any conversation", "Cards, Apple Pay, and Google Pay", "Paid status logged to the contact"],
  },
};

const ORDER: readonly FeaturedKey[] = ["creator", "meetings", "askai"];
/**
 * Everything View all lists: the slot's 3 plus 3 more that never take a card.
 * The cards still show only the first N (the count axis). Ashwin, Nov 17.
 */
const ALL_ORDER: readonly FeaturedKey[] = [...ORDER, "voice", "reviews", "textpay"];

/**
 * The floating card's copy, one slide per product: the eyebrow's category,
 * a title that says what it does for you, one line of description, 3 points
 * and a verb-first button. Plain product language, sentence case — the card
 * sits over someone's work, so it has 1 job: say what's new and how to try
 * it. Ashwin, Nov 17.
 */
export interface FeaturedFloatCopy {
  category: string;
  title: string;
  description: string;
  points: readonly [string, string, string];
  cta: string;
}

// The setup guide joins the sale in the exclusion: the floating card cycles
// products, and neither of those is one.
export type FeaturedFloatKey = Exclude<FeaturedKey, "agency" | "promos" | "launchpad">;

/** The 6 products the floating card cycles through, in order. */
export const FEATURED_FLOAT_ORDER: readonly FeaturedFloatKey[] = [
  "creator",
  "meetings",
  "askai",
  "voice",
  "reviews",
  "textpay",
];

export const FEATURED_FLOAT_COPY: Record<FeaturedFloatKey, FeaturedFloatCopy> = {
  creator: {
    category: "Content",
    title: "Make short videos in minutes",
    description: "Plan, film, and publish short videos for every channel from one place.",
    points: [
      "Turn 1 recording into clips for 5 channels",
      "Captions and your brand kit, applied for you",
      "Schedule straight to Social Planner",
    ],
    cta: "Open Creator Studio",
  },
  meetings: {
    category: "Meetings",
    title: "Host video calls in your own room",
    description: "Branded video calls that save notes and next steps to the contact.",
    points: [
      "A join link on every appointment",
      "AI notes saved to the contact",
      "Guests join from the browser, no downloads",
    ],
    cta: "Set up Meeting Rooms",
  },
  askai: {
    category: "AI",
    title: "Ask your account anything",
    description: "Get answers about your contacts, pipelines, and reports from any page.",
    points: [
      "Answers grounded in this sub-account",
      "Drafts emails, workflows, and replies",
      "Press ⌘J from anywhere",
    ],
    cta: "Try Ask AI",
  },
  voice: {
    category: "AI agents",
    title: "Answer every call, day or night",
    description: "An AI agent picks up, books appointments, and logs each call to the contact.",
    points: [
      "Answers 24/7 in your brand’s voice",
      "Books straight into your calendars",
      "Call summaries saved to the contact",
    ],
    cta: "Set up Voice AI",
  },
  reviews: {
    category: "Reputation",
    title: "Reply to every review, on brand",
    description: "Reviews AI drafts a reply to each Google and Facebook review in your voice.",
    points: [
      "Approve first, or send automatically",
      "Flags unhappy customers for follow-up",
      "Replies in minutes, not days",
    ],
    cta: "Turn on Reviews AI",
  },
  textpay: {
    category: "Payments",
    title: "Get paid with a text",
    description: "Send a payment link from any conversation, with no invoice to chase.",
    points: [
      "Cards, Apple Pay, and Google Pay",
      "Paid status logged to the contact",
      "Reminders go out if it’s still unpaid",
    ],
    cta: "Send a payment link",
  },
};

/** The placeholder page for a featured product's id, if it has one. */
export function featuredPageById(id: string): (CatalogueEntry & { home: string }) | null {
  return Object.values(FEATURED_PAGES).find((p) => p.id === id && p.id !== FEATURED_PAGES.askai?.id) ?? null;
}

/** Fired to open a featured product's page. `detail` is the page's product id. */
export const NAV_FEATURED_OPEN_PAGE_EVENT = "nav-featured:open-page";

/** Fired to open the real Ask AI panel from its featured card. */
export const NAV_FEATURED_OPEN_AI_EVENT = "nav-featured:open-ai";

/** Opens the product, or says it is not here yet when it has no page. */
export function openFeaturedProduct(key: FeaturedKey): string | null {
  /*
   * The setup guide has a real page already — the one the card's own door
   * opens — so it needs no placeholder in FEATURED_PAGES. Same event, same
   * handler; only the id comes from the IA rather than from the page table.
   */
  if (key === "launchpad") {
    window.dispatchEvent(
      new CustomEvent(NAV_FEATURED_OPEN_PAGE_EVENT, { detail: PROPOSED_HOME_ID }),
    );
    return null;
  }
  if (key === "askai") {
    window.dispatchEvent(new Event(NAV_FEATURED_OPEN_AI_EVENT));
    return null;
  }
  const page = FEATURED_PAGES[key];
  if (!page) return `${FEATURED_PRODUCTS[key].name} isn’t in this prototype yet.`;
  window.dispatchEvent(new CustomEvent(NAV_FEATURED_OPEN_PAGE_EVENT, { detail: page.id }));
  return null;
}

/** Fired by the prototype controls. */
export const NAV_FEATURED_END_EVENT = "nav-featured:end";
export const NAV_FEATURED_RESET_EVENT = "nav-featured:reset";

/**
 * What the L2 panel shows: one product's explainer, the grouped list, or the
 * View all list. A product opened from View all says so (`from: "all"`), so
 * its explainer gets a Back to the list.
 */
export type FeaturedOpen =
  | { kind: "product"; key: FeaturedKey; from?: "all" }
  | { kind: "whatsnew" }
  | { kind: "all" }
  | null;

interface FeaturedContextValue {
  /** The products in the slot right now, lead first. Empty when the slot is off or the run ended. */
  list: readonly FeaturedProduct[];
  /** Every featured product, for View all: the slot's line-up first, then the rest. */
  all: readonly FeaturedProduct[];
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
  /**
   * The product whose launch video is playing in the video modal, if any.
   * Held here rather than on the card that asked, so a carousel stepping on
   * (or a card unmounting) never takes the modal with it.
   */
  video: FeaturedKey | null;
  playVideo: (key: FeaturedKey | null) => void;
  /** A short confirmation, for whichever toast the shell shows. */
  message: string | null;
  clearMessage: () => void;
}

const FeaturedContext = React.createContext<FeaturedContextValue | null>(null);

/** One frozen empty list, so a held provider is referentially stable. */
const EMPTY: readonly FeaturedProduct[] = [];

export function FeaturedProvider({ children }: { children: React.ReactNode }) {
  const {
    navFeaturedSlot,
    navFeaturedCount,
    navFeaturedLead,
    navFeaturedAgency,
    navFeaturedPromo,
    navPromoPlacement,
    launchpadTreatment,
    launchpadOffered,
    launchpad: launchpadOn,
  } = useTheme().effective;
  const [open, setOpen] = React.useState<FeaturedOpen>(null);
  /*
   * Pins live in the nav's own pin list, as the product's page id — a pinned
   * featured product is an ordinary pin: top of Recents, same order, same
   * row, same cap and toast. Ashwin, Nov 17.
   */
  const layout = useNavLayout();
  const pinnedIds = layout.state.pinned;
  const pinned = React.useMemo(
    () =>
      (Object.keys(FEATURED_PRODUCTS) as FeaturedKey[]).filter((k) => {
        const id = featuredPinId(k);
        return id !== null && pinnedIds.includes(id);
      }),
    [pinnedIds],
  );
  const unpinAll = React.useEffectEvent(() => {
    for (const k of pinned) {
      const id = featuredPinId(k);
      if (id) layout.unpin(id);
    }
  });
  const [slide, setSlide] = React.useState(0);
  const [promoDismissed, setPromoDismissed] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const [dismissed, setDismissed] = React.useState<FeaturedKey[]>([]);
  const [message, setMessage] = React.useState<string | null>(null);
  const [video, setVideo] = React.useState<FeaturedKey | null>(null);

  const list = React.useMemo(() => {
    // The floating card is off the sidebar entirely: it cycles all 6 on its own, so the slot's list is empty.
    // Rows after categories draws its own rows (see FeaturedListRows), so it has no cards either.
    if (ended || navFeaturedSlot === "off" || navFeaturedSlot === "float" || navFeaturedSlot === "list" || navFeaturedAgency === "off")
      return [];
    const keys: FeaturedKey[] = [navFeaturedLead, ...ORDER.filter((k) => k !== navFeaturedLead)].slice(
      0,
      Number(navFeaturedCount),
    );
    if (navFeaturedAgency === "custom") keys.splice(0, 1, "agency");
    // Holiday Promos leads the cards, on top of the product count.
    if (navPromoPlacement === "card" || navPromoPlacement === "cardRow") keys.unshift("promos");
    /*
     * ...and the setup guide leads both, when the axis puts it here.
     *
     * In front of the sale because it is the account's own unfinished
     * business and the sale is an offer: of the two, only one of them stops
     * being true once it is done. Gated on the same two flags the card is —
     * the build ships Launchpad, and this account has not finished — so
     * moving it down here never shows a setup guide to an activated account
     * the card would have spared. See LAUNCHPAD_SPOTS.
     */
    if (launchpadTreatment === "featured" && launchpadOffered && launchpadOn)
      keys.unshift("launchpad");
    return keys.filter((k) => !dismissed.includes(k)).map((k) => FEATURED_PRODUCTS[k]);
  }, [
    ended,
    navFeaturedSlot,
    navFeaturedAgency,
    navFeaturedLead,
    navFeaturedCount,
    navPromoPlacement,
    launchpadTreatment,
    launchpadOffered,
    launchpadOn,
    dismissed,
  ]);

  /*
   * "Row at bottom of list": each featured product in the line-up is filed
   * into its home category as an ordinary L2 item, through the layout, so
   * edit mode treats it like any product. See withFeaturedFiled.
   */
  const filing = navFeaturedPromo === "row";
  const wantKey = filing
    ? list
        .filter((p) => p.homeCategory)
        .map((p) => `${featuredPinId(p.key)}>${p.homeCategory}`)
        .join("|")
    : "";
  const sync = React.useEffectEvent((key: string) => {
    const want = new Map<string, string>();
    const groups = resolveGroups(layout.state);
    for (const pair of key ? key.split("|") : []) {
      const [id, home] = pair.split(">");
      const group = groups.find((g) => g.defaultLabel.toLowerCase() === home.toLowerCase());
      if (id && group) want.set(id, group.id);
    }
    layout.syncFeatured(want);
  });
  React.useEffect(() => {
    sync(wantKey);
  }, [wantKey, layout.state.grouping]);

  const all = React.useMemo(() => {
    // More products lists products; the sale is not one.
    const first: FeaturedKey[] = list
      .map((p) => p.key)
      .filter((k) => k !== "promos" && k !== "launchpad");
    return [...first, ...ALL_ORDER.filter((k) => !first.includes(k))].map((k) => FEATURED_PRODUCTS[k]);
  }, [list]);

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
      unpinAll();
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

  /*
   * Held while onboarding is still running. See PROMO_GATES.
   *
   * At the PROVIDER rather than at the half-dozen things that read it,
   * because every one of those is the same decision — "is there anything
   * featured right now" — and a surface that asked separately is a surface
   * that gets forgotten the next time one is added. With the lists empty,
   * the slot, the rows, the promo card and the panel all draw nothing of
   * their own accord; none of them needs to learn about the tour.
   */
  const held = usePromosHeld();
  const value = React.useMemo<FeaturedContextValue>(
    () => ({
      list: held ? EMPTY : list,
      /*
        `all` too, and it is the one that would have been missed: it
        backfills the full catalogue rather than deriving from `list`, so
        the "Rows after categories" slot kept drawing all six products
        through an empty list. The existing `ended` switch has that bug.
      */
      all: held ? EMPTY : all,
      open: held ? null : open,
      setOpen,
      pinned,
      togglePin: (key) => {
        const id = featuredPinId(key);
        if (id) layout.togglePin(id);
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
        held || navFeaturedPromo === "off" || promoDismissed
          ? null
          : (list.find((p) => p.homeCategory === category) ?? null),
      video: held ? null : video,
      // The sale has no video: its still opens the landing page instead.
      playVideo: (key) => {
        if (key === "promos" || key === "launchpad") {
          setOpen(null);
          openFeaturedProduct(key);
        } else setVideo(key);
      },
      message: held ? null : message,
      clearMessage: () => setMessage(null),
    }),
    [held, list, all, open, pinned, layout, slide, promoDismissed, ended, navFeaturedPromo, message, video],
  );

  return <FeaturedContext.Provider value={value}>{children}</FeaturedContext.Provider>;
}

export function useFeatured(): FeaturedContextValue {
  const ctx = React.useContext(FeaturedContext);
  if (!ctx) throw new Error("useFeatured needs a FeaturedProvider");
  return ctx;
}

/** The play badge's diameter, per surface: rows, cards, and the larger heroes. */
const PLAY_SIZE = { xs: 16, sm: 32, lg: 44 } as const;

/**
 * A featured product's still, framed the same way on every surface: a white
 * ground (the stills are mostly white UI), a 1px gray hairline, the surface's
 * radius, and object-cover from the top-left so the crop keeps the part of
 * the screen it was framed on. With `play`, a round white button with a dark
 * glyph sits in the middle — decoration only; the surface owns the click.
 * Ashwin, Nov 17.
 */
export function FeaturedStill({
  product,
  play = false,
  size = "sm",
  tone = "page",
  className,
}: {
  product: FeaturedProduct;
  play?: boolean;
  size?: keyof typeof PLAY_SIZE;
  /** Nav surfaces take the nav's divider for the hairline; the page takes gray-200. */
  tone?: "nav" | "page";
  /** Size, aspect and radius come from the surface. */
  className?: string;
}) {
  const d = PLAY_SIZE[size];
  return (
    <span
      aria-hidden="true"
      data-featured-still={product.key}
      className={cn(
        "relative block overflow-hidden border bg-white",
        tone === "nav" ? "border-[var(--nav-divider)]" : "border-[var(--hr-gray-200)]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static stills from public/featured */}
      <img src={product.image} alt="" draggable={false} className="block size-full object-cover object-left-top" />
      {/* Neither the sale nor the setup guide has a launch video. */}
      {play && product.key !== "promos" && product.key !== "launchpad" ? (
        <span className="absolute inset-0 grid place-items-center">
          <span
            style={{ width: d, height: d }}
            className="motion-tap grid place-items-center rounded-full bg-white text-[var(--hr-gray-900)] shadow-[0_2px_8px_rgba(16,24,40,0.18),0_0_0_1px_rgba(16,24,40,0.06)] group-hover/still:scale-105 group-active/still:scale-95"
          >
            <Play
              size={Math.round(d * 0.42)}
              aria-hidden="true"
              fill="currentColor"
              strokeWidth={size === "xs" ? 3 : 2}
              className="translate-x-[6%]"
            />
          </span>
        </span>
      ) : null}
    </span>
  );
}
