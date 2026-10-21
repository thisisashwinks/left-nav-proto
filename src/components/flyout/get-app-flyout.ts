import { Monitor, Smartphone } from "lucide-react";
import { BETA_BADGE, NEW_BADGE, type FlyoutConfig } from "./types";

/**
 * The companion apps behind one nav row instead of two.
 *
 * The `nav` placement put "Get mobile app" and "Get desktop app" side by side
 * at the bottom of the sidebar, which spends two of the nav's rows on something
 * you do exactly once — and reads as two products when they are one offer in
 * two flavours. This is the same offer one level down: a single L1 row that
 * says what it is about, and the choice of platform inside the panel it opens,
 * where a row costs nothing.
 *
 * Named for what is behind it — see GET_APP_NAV_LABEL. It briefly said
 * "White-label apps", which is the agency's word for the feature and means
 * nothing to the sub-account user who just wants the app on their phone.
 */
export const GET_APP_FLYOUT_ID = "white-label-apps";

/**
 * The L1's name: what the row leads to, not what the platform calls it.
 *
 * "White-label apps" named the FEATURE — an agency branding a client — which
 * is a fact about who the apps belong to rather than about what is behind the
 * row. A sub-account user reading it has no white label to think about and no
 * way to guess that the two downloads they wanted are in there.
 *
 * Settled on "Download apps", Oct 9, and the six-way naming axis that stood
 * here was deleted with the decision. "Desktop & mobile apps" was the longest
 * label in a column of one- and two-word names and the first row to truncate
 * at 240px; this one is the plainest thing the row could say and fits.
 */
export const GET_APP_NAV_LABEL = "Download apps";

/**
 * The L2 rows: the platform, and nothing else.
 *
 * These used to be the platform-qualified names — "Get Android & iOS app",
 * "Get Windows & macOS app" — on the argument that two rows with room can
 * afford to answer "is my phone in there?" before anyone has to click. In the
 * nav they had the room on paper and not on screen: at 240px both truncated
 * mid-phrase to "Get Android & iOS …" and "Get Windows & m…", so the clause
 * that was there to name the platforms was the exact part that disappeared.
 *
 * "Get" was also doing no work at this level. It earns its place on a single
 * row standing alone in an app bar, where "Mobile apps" would read as a place
 * in the product; under a parent row already called Download apps, the verb is
 * said twice and the panel is plainly a pair of downloads. Ashwin, Oct 13.
 *
 * The platform detail is not lost — it is in the sheet each row opens, which
 * is where someone checking for their phone can actually read it.
 */
export const GET_APP_ROW_LABELS: Record<"mobile" | "desktop", string> = {
  mobile: "Mobile apps",
  desktop: "Desktop app",
};

/**
 * The same two rows, with the verb in front.
 *
 * The panel can leave it out: its own title says "Download apps" two rows
 * up, so a row reading "Mobile apps" inside it is plainly a download. The
 * avatar menu has no such header — the rows sit between "Login As" and
 * "Signout" with nothing naming the offer — and "Mobile apps" there reads as
 * a place in the product rather than a thing to fetch. Same names, one word
 * of context. Ashwin, Oct 21.
 */
export const GET_APP_MENU_LABELS: Record<"mobile" | "desktop", string> = {
  mobile: `Download ${GET_APP_ROW_LABELS.mobile.toLowerCase()}`,
  desktop: `Download ${GET_APP_ROW_LABELS.desktop.toLowerCase()}`,
};

/**
 * Which tag each row wears, named once.
 *
 * The panel set these inline on its two entries, which was fine while the
 * panel was the only surface drawing them. The avatar menu draws the same two
 * rows now (see GET_APP_PLACEMENTS), and a maturity tag is a fact about the
 * APP rather than about the surface it is read on — so both places take it
 * from here. Ashwin, Oct 21.
 */
export const GET_APP_ROW_BADGES = {
  mobile: BETA_BADGE,
  desktop: NEW_BADGE,
} as const;

/** The ids the shell routes to the sheet. See app-shell's `onNavigate`. */
export const GET_APP_ROW_IDS = {
  mobile: "get-app-mobile",
  desktop: "get-app-desktop",
} as const;

export const getAppFlyout: FlyoutConfig = {
  id: GET_APP_FLYOUT_ID,
  title: GET_APP_NAV_LABEL,
  // The same rows every other L2 list draws, so the panel is not a special
  // surface — it is the nav's own panel with two rows in it.
  variant: "product",
  entries: [
    {
      kind: "item",
      item: {
        id: GET_APP_ROW_IDS.mobile,
        label: GET_APP_ROW_LABELS.mobile,
        icon: Smartphone,
        // description: "iOS & Android, under your own name.",
        badge: GET_APP_ROW_BADGES.mobile,
      },
    },
    {
      kind: "item",
      item: {
        id: GET_APP_ROW_IDS.desktop,
        label: GET_APP_ROW_LABELS.desktop,
        icon: Monitor,
        // description: "macOS & Windows, in one download.",
        badge: GET_APP_ROW_BADGES.desktop,
      },
    },
  ],
};

/**
 * The L1's name, for the surfaces that draw the row.
 *
 * Still a function, though the name is a constant again: the five callers —
 * the nav, the collapsed rail, the View all directory, the flyout's own header
 * and the breadcrumb — all read it through here, which is what kept them from
 * disagreeing while it was an axis and is what would keep them in step if it
 * ever becomes one again. Nothing is gained by scattering the import back out
 * to five modules on the way past.
 */
export function useGetAppNavLabel(): string {
  return GET_APP_NAV_LABEL;
}
