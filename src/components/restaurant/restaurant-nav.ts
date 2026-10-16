import {
  BookOpen,
  CalendarDays,
  ChartLine,
  CreditCard,
  Gift,
  Globe,
  Image,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Puzzle,
  Receipt,
  Rocket,
  SlidersHorizontal,
  Sparkles,
  Star,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { FlyoutConfig } from "@/components/flyout/types";
import type { NavEntry } from "@/components/nav/types";

/**
 * The restaurant workspace's own sidebar.
 *
 * An account created from the Restaurant industry does not wake up on the
 * generic catalogue — it gets the tree the Figma ("Nav / Restaurant sidebar")
 * draws: six labelled sections, trade vocabulary throughout (Guests, not
 * Contacts), and Launchpad first because a brand-new restaurant's only job is
 * to finish setting up.
 *
 * Built the way the agency tree is built: one list of rows, panels derived from
 * it, and one place index so a row, its page and its breadcrumb read the same
 * record. Every id is `rst-` prefixed so nothing here can collide with a
 * catalogue product id.
 */

export const RESTAURANT_LAUNCHPAD_ID = "rst-launchpad";

export interface RestaurantChild {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface RestaurantRow {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Shown under the title on the row's stub page. */
  description: string;
  /** Rows with children open a flyout panel; the rest are destinations. */
  children?: RestaurantChild[];
}

export interface RestaurantSection {
  id: string;
  label: string;
  rows: RestaurantRow[];
}

const c = (
  id: string,
  label: string,
  icon: LucideIcon,
  description: string,
): RestaurantChild => ({ id: `rst-${id}`, label, icon, description });

export const RESTAURANT_SECTIONS: RestaurantSection[] = [
  {
    id: "home",
    label: "Home",
    rows: [
      {
        id: RESTAURANT_LAUNCHPAD_ID,
        label: "Launchpad",
        icon: Rocket,
        description: "Everything you need to get ready for service.",
      },
      {
        id: "rst-dashboard",
        label: "Restaurant Dashboard",
        icon: LayoutDashboard,
        description: "Covers, orders and revenue at a glance.",
      },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    rows: [
      {
        id: "rst-reservations",
        label: "Reservations",
        icon: CalendarDays,
        description: "Bookings, the waitlist and the floor.",
        children: [
          c("reservations-bookings", "Bookings", CalendarDays, "Every reservation, by day and time."),
          c("reservations-waitlist", "Waitlist", Users, "Quote a wait and text guests when it’s their turn."),
          c("reservations-floor", "Floor plan", LayoutDashboard, "Rooms and tables, as the host sees them."),
        ],
      },
      {
        id: "rst-orders",
        label: "Orders",
        icon: Receipt,
        description: "Every order across dine-in, pickup and delivery.",
        children: [
          c("orders-live", "Live orders", Receipt, "What the kitchen is working on right now."),
          c("orders-history", "Order history", ChartLine, "Every order, searchable."),
          c("orders-kitchen", "Kitchen display", SlidersHorizontal, "Where orders land in the kitchen."),
        ],
      },
      {
        id: "rst-menu",
        label: "Menu",
        icon: BookOpen,
        description: "Items, prices and modifiers for every channel.",
        children: [
          c("menu-items", "Items", BookOpen, "Dishes, drinks and their prices."),
          c("menu-modifiers", "Modifiers", SlidersHorizontal, "Sizes, add-ons and choices."),
          c("menu-availability", "Availability", CalendarDays, "When each menu is served."),
        ],
      },
      {
        id: "rst-online-presence",
        label: "Online Presence",
        icon: Globe,
        description: "Your ordering page, listings and website.",
        children: [
          c("presence-ordering-page", "Ordering page", Globe, "Your own page for pickup and delivery."),
          c("presence-listings", "Listings", Star, "Google and the marketplaces guests find you on."),
          c("presence-website", "Website", Globe, "The restaurant’s site."),
        ],
      },
      {
        id: "rst-settings",
        label: "Restaurant Settings",
        icon: SlidersHorizontal,
        description: "Hours, tax, service charge and locations.",
        children: [
          c("settings-hours", "Hours", CalendarDays, "Opening hours and holidays."),
          c("settings-taxes", "Tax and service charge", Receipt, "Set them once for every order."),
          c("settings-team", "Team", Users, "Managers, hosts and servers."),
        ],
      },
    ],
  },
  {
    id: "customers",
    label: "Customers",
    rows: [
      {
        id: "rst-guests",
        label: "Guests",
        icon: Users,
        description: "Everyone who has booked, ordered or visited.",
        children: [
          c("guests-all", "All guests", Users, "Every guest and their visits."),
          c("guests-segments", "Segments", SlidersHorizontal, "Regulars, lapsed guests and VIPs."),
        ],
      },
      {
        id: "rst-conversations",
        label: "Conversations",
        icon: MessageCircle,
        description: "Every message from guests, in one inbox.",
      },
      {
        id: "rst-ai-agents",
        label: "AI Agents",
        icon: Sparkles,
        description: "Agents that answer calls, take bookings and reply to reviews.",
        children: [
          c("ai-voice", "Voice agent", MessageCircle, "Answers the phone and takes bookings."),
          c("ai-chat", "Chat agent", Sparkles, "Replies to guests on your site and socials."),
        ],
      },
      {
        id: "rst-loyalty",
        label: "Loyalty & Rewards",
        icon: Gift,
        description: "Points, rewards and gift cards.",
        children: [
          c("loyalty-program", "Loyalty program", Gift, "Points guests earn on every visit."),
          c("loyalty-gift-cards", "Gift cards", CreditCard, "Sell and redeem gift cards."),
        ],
      },
      {
        id: "rst-reputation",
        label: "Reputation",
        icon: Star,
        description: "Reviews, ratings and replies.",
        children: [
          c("reputation-reviews", "Reviews", Star, "Every review, from every site."),
          c("reputation-requests", "Review requests", Megaphone, "Ask happy guests for a review."),
        ],
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    rows: [
      {
        id: "rst-marketing",
        label: "Marketing",
        icon: Megaphone,
        description: "Campaigns that bring guests back.",
        children: [
          c("marketing-email", "Email campaigns", Megaphone, "Newsletters and offers."),
          c("marketing-sms", "SMS campaigns", MessageCircle, "Texts for regulars and lapsed guests."),
          c("marketing-social", "Social planner", Globe, "Plan and publish posts."),
        ],
      },
      {
        id: "rst-automations",
        label: "Automations",
        icon: Workflow,
        description: "Follow-ups that run themselves.",
      },
      {
        id: "rst-content",
        label: "Content",
        icon: Globe,
        description: "Pages, forms and media for the restaurant.",
        children: [
          c("content-pages", "Pages", Globe, "Landing pages and promos."),
          c("content-forms", "Forms", SlidersHorizontal, "Catering and event enquiries."),
        ],
      },
    ],
  },
  {
    id: "insights",
    label: "Insights",
    rows: [
      {
        id: "rst-reporting",
        label: "Restaurant Reporting",
        icon: ChartLine,
        description: "Sales, covers and channel performance.",
        children: [
          c("reporting-sales", "Sales", ChartLine, "Revenue by day, channel and item."),
          c("reporting-guests", "Guest insights", Users, "Who comes back, and how often."),
        ],
      },
      {
        id: "rst-payments",
        label: "Payments & Transactions",
        icon: CreditCard,
        description: "Payouts, refunds and every transaction.",
      },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    rows: [
      {
        id: "rst-media",
        label: "Media Storage",
        icon: Image,
        description: "Photos of dishes, logos and files.",
      },
      {
        id: "rst-integrations",
        label: "Integrations",
        icon: Puzzle,
        description: "POS, delivery marketplaces and more.",
      },
    ],
  },
];

/** The sidebar's middle block, as the nav's own entry list. */
export const restaurantNavEntries: NavEntry[] = RESTAURANT_SECTIONS.flatMap(
  (section): NavEntry[] => [
    { kind: "label", id: `sec-rst-${section.id}`, text: section.label },
    ...section.rows.map(
      (row): NavEntry => ({
        kind: "item",
        item: {
          id: row.id,
          label: row.label,
          icon: row.icon,
          ...(row.children ? { hasFlyout: true, flyoutId: row.id } : {}),
        },
      }),
    ),
  ],
);

/** One panel per row that has children. */
export const restaurantFlyouts: Record<string, FlyoutConfig> =
  Object.fromEntries(
    RESTAURANT_SECTIONS.flatMap((s) => s.rows)
      .filter((row) => row.children)
      .map((row): [string, FlyoutConfig] => [
        row.id,
        {
          id: row.id,
          title: row.label,
          variant: "product",
          entries: row.children!.map((child) => ({
            kind: "item",
            item: {
              id: child.id,
              label: child.label,
              icon: child.icon,
              description: child.description,
            },
          })),
        },
      ]),
  );

export interface RestaurantPlace {
  label: string;
  icon: LucideIcon;
  description: string;
  /** The L1 row above an L2 place. */
  parent?: RestaurantRow;
}

/** Every place the restaurant tree can put you, by id. */
export const restaurantPlaces: Record<string, RestaurantPlace> = (() => {
  const out: Record<string, RestaurantPlace> = {};
  for (const row of RESTAURANT_SECTIONS.flatMap((s) => s.rows)) {
    out[row.id] = { label: row.label, icon: row.icon, description: row.description };
    for (const child of row.children ?? []) {
      out[child.id] = {
        label: child.label,
        icon: child.icon,
        description: child.description,
        parent: row,
      };
    }
  }
  return out;
})();
