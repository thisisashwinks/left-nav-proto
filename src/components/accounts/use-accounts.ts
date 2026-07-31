"use client";

import * as React from "react";
import {
  accounts as allAccounts,
  INITIAL_ACCOUNT_ID,
  INITIAL_FAVORITE_IDS,
  INITIAL_RECENT_IDS,
  RECENT_LIMIT,
  type Account,
} from "./accounts-data";

export interface AccountsSession {
  accounts: readonly Account[];
  current: Account;
  /** Most recently visited first, current account excluded. */
  recentIds: readonly string[];
  favoriteIds: readonly string[];
  isFavorite: (id: string) => boolean;
  switchTo: (id: string) => void;
  toggleFavorite: (id: string) => void;
}

/**
 * Which sub-account the session is in, plus the recents and favourites the
 * switcher groups by.
 *
 * Owned by the shell rather than the panel: the nav header shows the current
 * account, and both have to survive the panel closing.
 */
export function useAccounts(): AccountsSession {
  const [currentId, setCurrentId] = React.useState(INITIAL_ACCOUNT_ID);
  const [recentIds, setRecentIds] =
    React.useState<readonly string[]>(INITIAL_RECENT_IDS);
  const [favoriteIds, setFavoriteIds] =
    React.useState<readonly string[]>(INITIAL_FAVORITE_IDS);

  const current =
    allAccounts.find((a) => a.id === currentId) ?? allAccounts[0];

  const switchTo = React.useCallback((id: string) => {
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

  const toggleFavorite = React.useCallback((id: string) => {
    setFavoriteIds((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  }, []);

  const isFavorite = React.useCallback(
    (id: string) => favoriteIds.includes(id),
    [favoriteIds],
  );

  return {
    accounts: allAccounts,
    current,
    // Defensive: the current account never belongs in its own Recent list.
    recentIds: recentIds.filter((id) => id !== currentId),
    favoriteIds,
    isFavorite,
    switchTo,
    toggleFavorite,
  };
}
