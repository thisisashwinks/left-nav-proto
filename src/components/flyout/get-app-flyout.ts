import { Monitor, Smartphone } from "lucide-react";
import { GET_APP_LABELS } from "@/components/header/get-app-modal";
import type { FlyoutConfig } from "./types";

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
 * "White-label apps", not "Get the app": at agency scope these ARE the
 * agency's apps, carrying its name and its mark, and the row is read by someone
 * deciding whether to hand them to a client rather than by someone installing
 * one for themselves.
 */
export const GET_APP_FLYOUT_ID = "white-label-apps";

export const GET_APP_NAV_LABEL = "White-label apps";

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
        label: GET_APP_LABELS.mobile,
        icon: Smartphone,
        description: "iOS and Android, under your own name.",
      },
    },
    {
      kind: "item",
      item: {
        id: GET_APP_ROW_IDS.desktop,
        label: GET_APP_LABELS.desktop,
        icon: Monitor,
        description: "macOS and Windows, in one download.",
      },
    },
  ],
};
