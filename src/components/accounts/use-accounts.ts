"use client";

import * as React from "react";
import { hashId } from "@/lib/account-color";
import {
  accounts as allAccounts,
  agency,
  INITIAL_ACCOUNT_ID,
  INITIAL_PINNED_IDS,
  INITIAL_RAIL_IDS,
  INITIAL_RECENT_IDS,
  RECENT_LIMIT,
  type Account,
} from "./accounts-data";

/**
 * Where the session is looking. `account` means inside the current
 * sub-account; `agency` means the roll-up across all of them. The two models
 * present the switch differently — a rail tile versus the header trigger —
 * but they read and write this one field.
 */
export type WorkspaceScope = "agency" | "account";

/**
 * How long a switch takes.
 *
 * Production is 2–3 seconds and sometimes longer — the whole app bundle for the
 * arriving account has to come down. That is far past the ~400ms where a
 * spinner is the right answer, so the prototype simulates the real duration
 * rather than a token delay: a transition that reads well at 200ms can be
 * unbearable at 3s, and this is the number the design has to survive.
 *
 * Jittered per account so the demo does not feel metronomic, and so the slow
 * path below is genuinely reachable rather than a branch nobody ever sees.
 */
const SWITCH_MIN_MS = 1800;
const SWITCH_MAX_MS = 4200;

/** Past this, the wait stops being a pause and needs saying out loud. */
export const SWITCH_SLOW_MS = 3500;

function latencyFor(id: string): number {
  // Scaled across the range, not modulo'd into it: `hashId` is itself taken
  // mod 997, so `% 2400` could never wrap and the spread silently collapsed to
  // 1800–2796 — which put the slow path below out of reach entirely.
  const spread = hashId(id) / 997;
  return Math.round(
    SWITCH_MIN_MS + spread * (SWITCH_MAX_MS - SWITCH_MIN_MS),
  );
}

/**
 * A switch in flight.
 *
 * Carries the account being switched TO, so the chrome can wear the arriving
 * identity immediately while its contents are still coming. Showing the
 * destination at once is most of what makes a three-second wait tolerable —
 * you are somewhere new that is loading, rather than somewhere old that is
 * stuck.
 */
export interface PendingSwitch {
  scope: WorkspaceScope;
  account: Account;
  /** Wall-clock ms this switch is expected to take, for the progress hint. */
  duration: number;
}

export interface AccountsSession {
  accounts: readonly Account[];
  /** The current sub-account. Meaningful even at agency scope — it is where "back" goes. */
  current: Account;
  scope: WorkspaceScope;
  /** The agency identity, for headers and the rail's first tile. */
  agency: Account;
  /** Most recently visited first, current account excluded. */
  recentIds: readonly string[];
  pinnedIds: readonly string[];
  /** Ordered open set for the account rail (Model C). Never includes the agency. */
  railIds: readonly string[];
  isPinned: (id: string) => boolean;
  onRail: (id: string) => boolean;
  switchTo: (id: string) => void;
  switchToAgency: () => void;
  /** Non-null while a switch is loading. */
  pending: PendingSwitch | null;
  togglePinned: (id: string) => void;
  addToRail: (id: string) => void;
  removeFromRail: (id: string) => void;
}

/**
 * Which sub-account the session is in, plus the recents and favourites the
 * switcher groups by, plus the rail's working set and the agency/account
 * scope the round-2 models added.
 *
 * Owned by the shell rather than any panel: the nav header, the rail and
 * both switcher panels all read it, and it has to survive any of them
 * closing.
 */
export function useAccounts(): AccountsSession {
  const [currentId, setCurrentId] = React.useState(INITIAL_ACCOUNT_ID);
  const [scope, setScope] = React.useState<WorkspaceScope>("account");
  const [recentIds, setRecentIds] =
    React.useState<readonly string[]>(INITIAL_RECENT_IDS);
  const [pinnedIds, setPinnedIds] =
    React.useState<readonly string[]>(INITIAL_PINNED_IDS);
  const [railIds, setRailIds] =
    React.useState<readonly string[]>(INITIAL_RAIL_IDS);

  const current =
    allAccounts.find((a) => a.id === currentId) ?? allAccounts[0];

  const [pending, setPending] = React.useState<PendingSwitch | null>(null);
  /*
   * One timer, cancelled on the next switch and on unmount.
   *
   * Without the cancel, switching twice quickly lands the first commit after
   * the second and the session ends up in the account you left — the classic
   * out-of-order-response bug, which a real implementation hits for the same
   * reason and fixes the same way.
   */
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancel = React.useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  React.useEffect(() => cancel, [cancel]);

  const begin = React.useCallback(
    (next: PendingSwitch, commit: () => void) => {
      cancel();
      setPending(next);
      timer.current = setTimeout(() => {
        timer.current = null;
        commit();
        setPending(null);
      }, next.duration);
    },
    [cancel],
  );

  const switchTo = React.useCallback(
    (id: string) => {
      const target = allAccounts.find((a) => a.id === id);
      if (!target) return;
      // Already here and not looking from the agency: nothing to load.
      if (id === currentId && scope === "account") return;

      begin(
        { scope: "account", account: target, duration: latencyFor(id) },
        () => {
          setScope("account");
          setCurrentId((previousId) => {
            if (id === previousId) return previousId;
            // The account being left becomes the newest recent, which is what
            // makes switching back and forth a two-click round trip.
            setRecentIds((ids) =>
              [
                previousId,
                ...ids.filter((i) => i !== previousId && i !== id),
              ].slice(0, RECENT_LIMIT),
            );
            return id;
          });
        },
      );
    },
    [begin, currentId, scope],
  );

  // Scope moves, the current account does not: agency scope is a place you
  // look from, and leaving it puts you back exactly where you were.
  const switchToAgency = React.useCallback(() => {
    if (scope === "agency") return;
    begin(
      { scope: "agency", account: agency, duration: latencyFor("agency") },
      () => setScope("agency"),
    );
  }, [begin, scope]);

  const togglePinned = React.useCallback((id: string) => {
    setPinnedIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  }, []);

  const addToRail = React.useCallback((id: string) => {
    setRailIds((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }, []);

  const removeFromRail = React.useCallback((id: string) => {
    setRailIds((ids) => ids.filter((i) => i !== id));
  }, []);

  const isPinned = React.useCallback(
    (id: string) => pinnedIds.includes(id),
    [pinnedIds],
  );

  const onRail = React.useCallback(
    (id: string) => railIds.includes(id),
    [railIds],
  );

  return {
    accounts: allAccounts,
    current,
    scope,
    agency,
    // Defensive: the current account never belongs in its own Recent list.
    recentIds: recentIds.filter((id) => id !== currentId),
    pinnedIds,
    railIds,
    isPinned,
    onRail,
    switchTo,
    switchToAgency,
    pending,
    togglePinned,
    addToRail,
    removeFromRail,
  };
}
