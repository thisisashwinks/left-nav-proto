"use client";

import * as React from "react";
import { matchAccounts, type Account } from "./accounts-data";
import type { AccountsSession } from "./use-accounts";

export interface AccountGroup {
  id: string;
  label: string;
  accounts: Account[];
}

interface UseAccountSwitcher {
  query: string;
  setQuery: (q: string) => void;
  groups: AccountGroup[];
  /** Flat list in display order — what the arrow keys walk. */
  flat: Account[];
  activeId: string | null;
  setActiveIndex: (i: number) => void;
  /** Switches and closes. The panel's one committing action. */
  select: (id: string) => void;
  /** Attach to the input. Handles ↑ ↓ ↵ and Escape. */
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Query state, grouping and keyboard navigation for the switcher.
 *
 * Grouping follows the production panel — Recent, then everything else — with
 * Favourites added between the two. A query collapses all three into one result
 * list, because grouping a search means the same account can appear three times.
 */
export function useAccountSwitcher(
  session: AccountsSession,
  onClose: () => void,
): UseAccountSwitcher {
  const [query, setQueryRaw] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const { accounts, current } = session;

  /*
   * Grouping is snapshotted when the panel opens, while the stars themselves
   * stay live. Regrouping on every toggle lifted the row out from under the
   * pointer and reflowed everything below it, so a second star click landed on
   * whatever slid into place. The new grouping applies the next time it opens.
   */
  const [snapshot] = React.useState(() => ({
    recentIds: session.recentIds,
    favoriteIds: session.favoriteIds,
  }));
  const { recentIds, favoriteIds } = snapshot;

  const groups = React.useMemo<AccountGroup[]>(() => {
    const byId = (id: string) => accounts.find((a) => a.id === id);

    if (query.trim() !== "") {
      // The current account stays searchable: hiding the one you are in reads
      // as a missing account rather than as a filter.
      return [
        { id: "results", label: "Results", accounts: matchAccounts(query, accounts) },
      ];
    }

    const recent = recentIds
      .map(byId)
      .filter((a): a is Account => a !== undefined && a.id !== current.id);

    const favorites = favoriteIds
      .map(byId)
      .filter((a): a is Account => a !== undefined);

    // "All accounts" is the remainder — anything not already shown above, so no
    // account is listed twice with the panel at rest. The current account is
    // only excluded from Recent: leaving it out of the other two would make it
    // read as missing, and would put its star out of reach.
    const shown = new Set([
      ...recent.map((a) => a.id),
      ...favorites.map((a) => a.id),
    ]);
    const rest = accounts.filter((a) => !shown.has(a.id));

    return [
      { id: "recent", label: "Recent", accounts: recent },
      { id: "favorites", label: "Favorites", accounts: favorites },
      { id: "all", label: "All accounts", accounts: rest },
    ].filter((g) => g.accounts.length > 0);
  }, [accounts, current.id, favoriteIds, query, recentIds]);

  const flat = React.useMemo(() => groups.flatMap((g) => g.accounts), [groups]);

  // Typing refilters, so the highlight goes back to the top hit.
  const setQuery = React.useCallback((q: string) => {
    setQueryRaw(q);
    setActiveIndex(0);
  }, []);

  const clamped =
    flat.length === 0 ? -1 : Math.min(activeIndex, flat.length - 1);

  const select = React.useCallback(
    (id: string) => {
      session.switchTo(id);
      onClose();
    },
    [onClose, session],
  );

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (flat.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flat.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
      } else if (e.key === "Enter" && clamped >= 0) {
        e.preventDefault();
        select(flat[clamped].id);
      }
    },
    [clamped, flat, onClose, select],
  );

  return {
    query,
    setQuery,
    groups,
    flat,
    activeId: clamped >= 0 ? flat[clamped].id : null,
    setActiveIndex,
    select,
    onKeyDown,
  };
}
