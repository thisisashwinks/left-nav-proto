import {
  CalendarDays,
  Funnel,
  Gauge,
  Megaphone,
  MessagesSquare,
  Network,
  ReplyAll,
  Sun,
  UserRoundPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * What the account still has to do, in the order it should do it.
 *
 * Held apart from the page because it is not only the page's: the nav's setup
 * card states the same progress two hundred pixels away, and the two saying
 * different numbers is the failure a launchpad cannot survive — the card is an
 * advert for the page, and an advert that lies about the page is worse than no
 * card. `LAUNCHPAD_DONE` and `LAUNCHPAD_TOTAL` below are derived rather than
 * written down, so a task added here moves both surfaces at once.
 */
export interface LaunchpadTask {
  id: string;
  /** Verb-first, and the thing itself rather than the feature's name. */
  title: string;
  blurb: string;
  icon: LucideIcon;
  /**
   * How far through this step the account is, 0–100.
   *
   * A percentage rather than a boolean because a step is several actions —
   * "set up multi-channel communication" is email, then SMS, then a number —
   * and a half-finished step reading as not started is what makes a setup
   * guide feel like it is ignoring you. 100 is what counts as done, here and
   * in the two totals below.
   */
  percent: number;
  /** The tutorial the step opens with, where one exists. */
  tutorial?: {
    /** Printed on the poster, two lines at most. */
    title: string;
    /** The poster's own gradient — no video file in a prototype. */
    poster: string;
  };
}

export interface LaunchpadSection {
  id: string;
  label: string;
  icon: LucideIcon;
  tasks: LaunchpadTask[];
}

export const LAUNCHPAD_SECTIONS: LaunchpadSection[] = [
  {
    id: "foundational",
    label: "Foundational setup",
    icon: Sun,
    tasks: [
      {
        id: "contact",
        title: "Create a new contact",
        blurb:
          "Add your first contact and start building a record of every conversation you have with them.",
        icon: UserRoundPlus,
        percent: 100,
        tutorial: {
          title: "Create a new contact",
          poster: "linear-gradient(135deg,#2b1055 0%,#7b2d6b 55%,#c2410c 100%)",
        },
      },
      {
        id: "channels",
        title: "Set up multi-channel communication",
        blurb:
          "Connect email, SMS, and phone in minutes so every reply lands in one inbox instead of three.",
        icon: MessagesSquare,
        percent: 100,
        tutorial: {
          title: "Connect your channels",
          poster: "linear-gradient(135deg,#0b2f6b 0%,#1d4ed8 55%,#06b6d4 100%)",
        },
      },
      {
        id: "funnel",
        title: "Generate new leads with a high-converting funnel",
        blurb:
          "Publish a funnel and a form that capture leads, so the contacts arrive without anyone typing them in.",
        icon: Funnel,
        percent: 100,
        tutorial: {
          title: "Build your first funnel",
          poster: "linear-gradient(135deg,#122d2b 0%,#0f766e 55%,#84cc16 100%)",
        },
      },
      {
        id: "nurture",
        title: "Nurture leads with automated drip campaigns",
        blurb:
          "Follow up on a schedule with email and SMS, so a lead that went quiet hears from you anyway.",
        icon: Megaphone,
        percent: 40,
        tutorial: {
          title: "Write a drip campaign",
          poster: "linear-gradient(135deg,#3b0764 0%,#7c3aed 55%,#f472b6 100%)",
        },
      },
      {
        id: "calendar",
        title: "Book more appointments with automated scheduling",
        blurb:
          "Put your calendar behind a booking link and let reminders do the chasing — 25% fewer no-shows.",
        icon: CalendarDays,
        percent: 0,
        tutorial: {
          title: "Set up your calendar",
          poster: "linear-gradient(135deg,#7c2d12 0%,#ea580c 55%,#fbbf24 100%)",
        },
      },
    ],
  },
  {
    id: "sales",
    label: "Sales & conversations",
    icon: Gauge,
    tasks: [
      {
        id: "pipeline",
        title: "Accelerate deal closures with a streamlined sales pipeline",
        blurb:
          "Track every lead's stage and automate the follow-ups, so no opportunity sits still without anyone noticing.",
        icon: Network,
        percent: 100,
        tutorial: {
          title: "Shape your pipeline",
          poster: "linear-gradient(135deg,#0c1e3a 0%,#155eef 55%,#38bdf8 100%)",
        },
      },
      {
        id: "replies",
        title: "Reply faster with saved responses",
        blurb:
          "Save the answers your team types every day and drop one into a conversation in a keystroke.",
        icon: ReplyAll,
        percent: 0,
      },
    ],
  },
];

/** How many tasks are finished, across every section. */
export const LAUNCHPAD_DONE = LAUNCHPAD_SECTIONS.reduce(
  (n, section) => n + section.tasks.filter((t) => t.percent === 100).length,
  0,
);

/** How many there are in total. The nav card's "4 of 7" is these two. */
export const LAUNCHPAD_TOTAL = LAUNCHPAD_SECTIONS.reduce(
  (n, section) => n + section.tasks.length,
  0,
);

/**
 * A section's own progress, as the bar above its list states it.
 *
 * The mean of its tasks rather than the share of them finished: a section of
 * five where one step is 40% through reads as 68%, not 60%, and the number
 * moving when you make partial progress is the whole argument for holding
 * percentages on the tasks in the first place.
 */
export function sectionPercent(section: LaunchpadSection): number {
  const total = section.tasks.reduce((n, t) => n + t.percent, 0);
  return Math.round(total / section.tasks.length);
}
