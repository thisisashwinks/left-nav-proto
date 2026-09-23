import {
  BadgeCheck,
  Calculator,
  CalendarClock,
  ChartNoAxesColumn,
  ClipboardList,
  CreditCard,
  DatabaseZap,
  FileSignature,
  Mailbox,
  Megaphone,
  MessagesSquare,
  MessageSquareText,
  PhoneCall,
  Repeat,
  ScrollText,
  Truck,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { AvatarTone } from "@/components/contacts/contacts-data";

/**
 * What the marketplace has on the shelf, and which of it this account bought.
 *
 * Every app here is invented. That is a constraint, not a shortcut: a
 * prototype that draws Stripe's wordmark and Zapier's orange is making a
 * partnership claim on a screenshot that will be shared, and the one thing a
 * marketplace mock must not do is look like a signed deal. So the names are
 * plausible-but-fictional and the marks are the repo's own tone squares with
 * a lucide glyph in them — see `AppMark` in marketplace-page.tsx for why they
 * are not ToneAvatar's initials.
 *
 * The proportions are the part that has to be real. Seventeen apps across
 * seven categories with seven installed is what a working account looks like
 * three months in: the shelf is bigger than the shelf you use, and every
 * category has at least one thing in it, so no filter in the page lands on an
 * empty grid by accident. A fixture where everything is installed would make
 * the Installed cut indistinguishable from All apps, which is precisely the
 * cut this page was rebuilt around.
 */

export type AppCategoryId =
  | "payments"
  | "communication"
  | "marketing"
  | "analytics"
  | "scheduling"
  | "commerce"
  | "productivity";

export interface MarketplaceApp {
  id: string;
  name: string;
  /** One line, and it says what the app DOES — not what it is. */
  blurb: string;
  category: AppCategoryId;
  icon: LucideIcon;
  tone: AvatarTone;
  /** Who publishes it. "HighLevel" earns the verified mark on the card. */
  publisher: string;
  /**
   * Pre-formatted with its thousands separator, because it is a fixture
   * string and not a live sum — the same call media-data.ts makes about file
   * sizes. Formatting at render would imply a number that can change.
   */
  installs: string;
  rating: string;
  /**
   * The seed, not the truth. The page owns install state from mount, so the
   * Install button can actually install something and the Installed cut can
   * be watched to grow — a marketplace whose only verb is disabled is a
   * screenshot, not a prototype.
   */
  installed: boolean;
}

/** The category filter's options, with "All categories" as the first row. */
export const APP_CATEGORIES: { id: AppCategoryId | "all"; label: string }[] = [
  { id: "all", label: "All categories" },
  { id: "payments", label: "Payments" },
  { id: "communication", label: "Communication" },
  { id: "marketing", label: "Marketing" },
  { id: "analytics", label: "Analytics" },
  { id: "scheduling", label: "Scheduling" },
  { id: "commerce", label: "Commerce" },
  { id: "productivity", label: "Productivity" },
];

/** Category id → the word on the card's chip. Derived, so the two cannot drift. */
export const CATEGORY_LABEL: Record<AppCategoryId, string> = Object.fromEntries(
  APP_CATEGORIES.filter((c) => c.id !== "all").map((c) => [c.id, c.label]),
) as Record<AppCategoryId, string>;

export const marketplaceApps: MarketplaceApp[] = [
  {
    id: "northgate",
    name: "Northgate Payments",
    blurb: "Take card and ACH payments on invoices and funnels.",
    category: "payments",
    icon: CreditCard,
    tone: "blue",
    publisher: "HighLevel",
    installs: "48,200",
    rating: "4.8",
    installed: true,
  },
  {
    id: "ledgerline",
    name: "Ledgerline Books",
    blurb: "Push every paid invoice into your ledger overnight.",
    category: "payments",
    icon: Calculator,
    tone: "green",
    publisher: "Ledgerline",
    installs: "12,400",
    rating: "4.5",
    installed: true,
  },
  {
    id: "cartwright",
    name: "Cartwright Subscriptions",
    blurb: "Bill on a schedule and retry the cards that fail.",
    category: "payments",
    icon: Repeat,
    tone: "purple",
    publisher: "Cartwright",
    installs: "6,180",
    rating: "4.3",
    installed: false,
  },
  {
    id: "cadence",
    name: "Cadence Dialer",
    blurb: "Power-dial a smart list and log every call to the contact.",
    category: "communication",
    icon: PhoneCall,
    tone: "orange",
    publisher: "Cadence Labs",
    installs: "21,900",
    rating: "4.6",
    installed: true,
  },
  {
    id: "relaypoint",
    name: "Relaypoint SMS",
    blurb: "A second sending number for high-volume campaigns.",
    category: "communication",
    icon: MessageSquareText,
    tone: "teal",
    publisher: "Relaypoint",
    installs: "9,740",
    rating: "4.1",
    installed: false,
  },
  {
    id: "brightsite",
    name: "Brightsite Chat",
    blurb: "Live chat on your site that files into the shared inbox.",
    category: "communication",
    icon: MessagesSquare,
    tone: "pink",
    publisher: "Brightsite",
    installs: "15,300",
    rating: "4.4",
    installed: false,
  },
  {
    id: "wavelength",
    name: "Wavelength Ads",
    blurb: "Sync smart lists to your ad audiences every hour.",
    category: "marketing",
    icon: Megaphone,
    tone: "yellow",
    publisher: "HighLevel",
    installs: "33,600",
    rating: "4.7",
    installed: true,
  },
  {
    id: "beacon",
    name: "Beacon Reviews",
    blurb: "Ask for a review the day after an appointment closes.",
    category: "marketing",
    icon: BadgeCheck,
    tone: "blue",
    publisher: "Beacon",
    installs: "18,050",
    rating: "4.6",
    installed: true,
  },
  {
    id: "kiln",
    name: "Kiln Direct Mail",
    blurb: "Trigger a printed postcard from any workflow step.",
    category: "marketing",
    icon: Mailbox,
    tone: "orange",
    publisher: "Kiln Print",
    installs: "3,420",
    rating: "4.0",
    installed: false,
  },
  {
    id: "tidepool",
    name: "Tidepool Analytics",
    blurb: "Attribution across every funnel, ad and form you run.",
    category: "analytics",
    icon: ChartNoAxesColumn,
    tone: "purple",
    publisher: "Tidepool",
    installs: "27,800",
    rating: "4.5",
    installed: false,
  },
  {
    id: "harbour",
    name: "Harbour Data Sync",
    blurb: "Two-way sync between this account and your warehouse.",
    category: "analytics",
    icon: DatabaseZap,
    tone: "teal",
    publisher: "Harbour",
    installs: "4,960",
    rating: "4.2",
    installed: true,
  },
  {
    id: "almanac",
    name: "Almanac Scheduling",
    blurb: "Round-robin booking across a whole team's calendars.",
    category: "scheduling",
    icon: CalendarClock,
    tone: "green",
    publisher: "Almanac",
    installs: "24,100",
    rating: "4.7",
    installed: true,
  },
  {
    id: "stagehand",
    name: "Stagehand Webinars",
    blurb: "Run a webinar and drop attendees into a workflow.",
    category: "scheduling",
    icon: Video,
    tone: "pink",
    publisher: "Stagehand",
    installs: "11,270",
    rating: "4.3",
    installed: false,
  },
  {
    id: "parcelwise",
    name: "Parcelwise Shipping",
    blurb: "Rates, labels and tracking on every store order.",
    category: "commerce",
    icon: Truck,
    tone: "yellow",
    publisher: "Parcelwise",
    installs: "7,830",
    rating: "4.1",
    installed: false,
  },
  {
    id: "slate",
    name: "Slate Forms",
    blurb: "Long forms with branching logic, mapped to contact fields.",
    category: "productivity",
    icon: ClipboardList,
    tone: "blue",
    publisher: "Slate",
    installs: "16,490",
    rating: "4.4",
    installed: false,
  },
  {
    id: "quotient",
    name: "Quotient Proposals",
    blurb: "Send a proposal and collect the signature in one link.",
    category: "productivity",
    icon: FileSignature,
    tone: "purple",
    publisher: "Quotient",
    installs: "10,120",
    rating: "4.5",
    installed: false,
  },
  {
    id: "cornerstone",
    name: "Cornerstone Contracts",
    blurb: "E-signature with countersigning and chase reminders.",
    category: "productivity",
    icon: ScrollText,
    tone: "orange",
    publisher: "Cornerstone",
    installs: "5,640",
    rating: "4.2",
    installed: false,
  },
];
