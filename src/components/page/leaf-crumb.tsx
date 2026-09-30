"use client";

import * as React from "react";
import type { Crumb } from "@/components/header/app-header";

/**
 * The trail's last segment, handed DOWN to the page.
 *
 * The fourth channel between the shell and the canvas, and the only one that
 * runs this way. RecordCrumb, PageCrumb and PageHeading all publish upward —
 * the page knows something the bar cannot derive — and each exists because
 * the shell has no business keeping a private table of what every screen
 * contains.
 *
 * This one is the reverse for the reverse reason. `crumbLeaf: "title"` takes
 * the last crumb out of the bar and puts its menu on the page's own title, so
 * the page needs the siblings the SHELL resolved: which products are beside
 * this one, which pages are beside this page, and the handler that moves
 * between them. None of that is the page's to know — a page that built its
 * own sibling list would be a second answer to a question the trail already
 * answers, and the two would part the first time a product was renamed.
 *
 * So the shell publishes the segment it would have drawn, and the page draws
 * it instead. The same object, one surface lower.
 */
export const LeafCrumbContext = React.createContext<Crumb | null>(null);

/**
 * The leaf, when the axis has moved it onto the title.
 *
 * Null in every other case — including when the axis is on but the shell has
 * no trail to take a leaf from — so a caller can render its title unchanged
 * without asking which value is set. The one question the page has to answer
 * is "did I get a menu", which is this being non-null.
 */
export function useLeafCrumb(): Crumb | null {
  return React.useContext(LeafCrumbContext);
}

/*
 * Whether a page has actually PUT the leaf on its title.
 *
 * `crumbLeaf: "title"` takes the last crumb out of the bar on the promise
 * that the title carries it. Pages that draw their own heading, or detail
 * screens titled after a record, never draw it — and the crumb then vanished
 * from both places (Opportunities read "CRM" alone). So the title claims the
 * leaf while it shows it, and the bar only drops the crumb when claimed.
 *
 * A counter, like the canvas opt-out, so two titles mounting and unmounting
 * in either order can never leave the claim stuck on.
 */
let claims = 0;
const claimListeners = new Set<() => void>();
function emitClaims() {
  claimListeners.forEach((l) => l());
}

/** Called by a title while it shows the leaf menu. */
export function useClaimLeaf(active: boolean) {
  React.useEffect(() => {
    if (!active) return;
    claims += 1;
    emitClaims();
    return () => {
      claims -= 1;
      emitClaims();
    };
  }, [active]);
}

/** Whether some title is showing the leaf — read by the bar. */
export function useLeafClaimed(): boolean {
  return React.useSyncExternalStore(
    (l) => {
      claimListeners.add(l);
      return () => claimListeners.delete(l);
    },
    () => claims > 0,
    () => false,
  );
}
