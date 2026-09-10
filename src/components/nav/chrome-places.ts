import { Monitor, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  GET_APP_ROW_IDS,
  GET_APP_ROW_LABELS,
} from "@/components/flyout/get-app-flyout";

/**
 * Places the nav can send you that the catalogue has never heard of.
 *
 * Every resolver in here answers "what is this id" by asking the catalogue and
 * then the L3 index, and returning the raw id when both miss. That was correct
 * while the only rows were products and their pages. It is not any more: the
 * companion-app rows are destinations you can pin, rename, re-icon and reorder,
 * and a pinned one arriving in the dock as the string `get-app-mobile` is what
 * "the catalogue is the only source of names" costs once the nav has rows the
 * catalogue does not own.
 *
 * A registry rather than a special case in each resolver, because there are six
 * of them and they have to agree — a label resolved in the dock and an icon
 * resolved in the rail reading different tables is the bug this prevents.
 *
 * What it deliberately is NOT: a second catalogue. Nothing here has children,
 * a group, a blurb or a page of its own; these are chrome rows with a name and
 * a glyph, which is exactly as much as the resolvers need.
 */
export interface ChromePlace {
  label: string;
  icon: LucideIcon;
}

export const CHROME_PLACES: Readonly<Record<string, ChromePlace>> = {
  [GET_APP_ROW_IDS.mobile]: {
    label: GET_APP_ROW_LABELS.mobile,
    icon: Smartphone,
  },
  [GET_APP_ROW_IDS.desktop]: {
    label: GET_APP_ROW_LABELS.desktop,
    icon: Monitor,
  },
};

/** The shipped record for a chrome id, or null for anything else. */
export function chromePlace(id: string): ChromePlace | null {
  return CHROME_PLACES[id] ?? null;
}

/**
 * Whether an id names something the nav can draw a row for.
 *
 * The guard every pinnable surface uses, widened once: a pin can name a
 * product, an L3 page, or one of these.
 */
export function isChromePlace(id: string): boolean {
  return id in CHROME_PLACES;
}
