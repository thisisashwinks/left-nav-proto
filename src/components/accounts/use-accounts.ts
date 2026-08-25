"use client";

import * as React from "react";
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

  const switchTo = React.useCallback((id: string) => {
    setScope("account");
    setCurrentId((previousId) => {
      if (id === previousId) return previousId;
      // The account being left becomes the newest recent, which is what makes
      // switching back and forth a two-click round trip.
      setRecentIds((ids) =>
        [previousId, ...ids.filter((i) => i !== previousId && i !== id)].slice(
          0,
          RECENT_LIMIT,
        ),
      );
      return id;
    });
  }, []);

  // Scope moves, the current account does not: agency scope is a place you
  // look from, and leaving it puts you back exactly where you were.
  const switchToAgency = React.useCallback(() => setScope("agency"), []);

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
    togglePinned,
    addToRail,
    removeFromRail,
  };
}
