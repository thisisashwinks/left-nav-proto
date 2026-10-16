import { Monitor, Smartphone } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  BETA_BADGE,
  NEW_BADGE,
  type FlyoutBadge,
} from "@/components/flyout/types";
import {
  GET_APP_FLYOUT_ID,
  GET_APP_NAV_LABEL,
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
  /**
   * "New" or "Beta", for the rows that carry one.
   *
   * It lived only in the flyout's own config, so the badge was a property of
   * where the row was DRAWN rather than of the row. Drag Desktop app out to
   * L1 and it arrived bare — the same row, one level up, minus the one thing
   * on it that was time-sensitive. A catalogue child's badge travels with it;
   * this is what lets a chrome row's do the same. Ashwin, Oct 16.
   */
  badge?: FlyoutBadge;
}

export const CHROME_PLACES: Readonly<Record<string, ChromePlace>> = {
  /*
    The PARENT row, not just its two children.

    Only the children were registered, so every resolver that fell through
    to the raw id rendered this row as its own key: hiding it in edit mode
    toasted "White label apps hidden", which is the id `white-label-apps`
    title-cased, not a name anybody chose. The row has said "Download apps"
    in the nav since GET_APP_NAV_LABEL was introduced.

    This is exactly the failure the registry's own note predicts — six
    resolvers that have to agree, and one of them reading a different
    table. Ashwin, Oct 16.
  */
  [GET_APP_FLYOUT_ID]: {
    label: GET_APP_NAV_LABEL,
    icon: Smartphone,
  },
  [GET_APP_ROW_IDS.mobile]: {
    label: GET_APP_ROW_LABELS.mobile,
    icon: Smartphone,
    badge: BETA_BADGE,
  },
  [GET_APP_ROW_IDS.desktop]: {
    label: GET_APP_ROW_LABELS.desktop,
    icon: Monitor,
    badge: NEW_BADGE,
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
