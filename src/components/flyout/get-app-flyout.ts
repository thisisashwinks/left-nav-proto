import { Monitor, Smartphone } from "lucide-react";
import { GET_APP_LABELS } from "@/components/header/get-app-modal";
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
 */
export const GET_APP_NAV_LABEL = "Desktop and mobile apps";

/**
 * The L2 rows, with the platforms each one covers.
 *
 * The brackets are the answer to the question the row otherwise invites — "is
 * my phone in there?" — asked at the moment someone is choosing between two
 * rows. Cheap here, where there are two rows and room; not carried into the
 * avatar menu, where the same words would be a paragraph beside a sign-out.
 */
export const GET_APP_ROW_LABELS: Record<"mobile" | "desktop", string> = {
  mobile: `${GET_APP_LABELS.mobile}`,
  desktop: `${GET_APP_LABELS.desktop}`,
};

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
        badge: BETA_BADGE,
      },
    },
    {
      kind: "item",
      item: {
        id: GET_APP_ROW_IDS.desktop,
        label: GET_APP_ROW_LABELS.desktop,
        icon: Monitor,
        // description: "macOS & Windows, in one download.",
        badge: NEW_BADGE,
      },
    },
  ],
};
