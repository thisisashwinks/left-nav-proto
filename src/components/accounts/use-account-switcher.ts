"use client";

import * as React from "react";
import { matchAccounts, type Account } from "./accounts-data";
import type { AccountsSession } from "./use-accounts";

export interface AccountGroup {
  id: string;
  /**
   * Absent means no heading is drawn.
   *
   * The dropdown has no sections at all now — see the grouping below — so
   * every group it returns is unlabelled. Kept as a field rather than removed
   * because the group is still the unit the keyboard cursor flattens, and a
   * labelled variant is one line away if a surface ever wants headings back.
   */
  label?: string;
  accounts: Account[];
}

/**
 * How many recents ride along behind the pinned set.
 *
 * Five, which is what the rail's own recent run shows. The whole list is
 * below them anyway — this band is a shortcut, and a shortcut long enough to
 * scroll is just the list again with a different order.
 */
const RECENT_IN_SWITCHER = 5;

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
  /**
   * Restricts the panel to these accounts, for a member who belongs to some of
   * them rather than owning all of them.
   *
   * Undefined means every account, which is the agency's case. Filtered here
   * rather than in the component so search, the grouping and the keyboard
   * cursor all see the same restricted set — filtering only the rendered rows
   * would leave Enter selecting an account that is not on screen.
   */
  only?: readonly string[],
): UseAccountSwitcher {
  const [query, setQueryRaw] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  const { current } = session;
  const accounts = React.useMemo(
    () =>
      only === undefined
        ? session.accounts
        : session.accounts.filter((a) => only.includes(a.id)),
    [session.accounts, only],
  );

  /*
   * Grouping is snapshotted when the panel opens, while the stars themselves
   * stay live. Regrouping on every toggle lifted the row out from under the
   * pointer and reflowed everything below it, so a second star click landed on
   * whatever slid into place. The new grouping applies the next time it opens.
   */
  const [snapshot] = React.useState(() => ({
    recentIds: session.recentIds,
    pinnedIds: session.pinnedIds,
  }));
  const { recentIds, pinnedIds } = snapshot;

  const groups = React.useMemo<AccountGroup[]>(() => {
    const byId = (id: string) => accounts.find((a) => a.id === id);

    if (query.trim() !== "") {
      // The current account stays searchable: hiding the one you are in reads
      // as a missing account rather than as a filter.
      return [{ id: "results", accounts: matchAccounts(query, accounts) }];
    }

    /*
     * One list, in one order: pinned, then a few recents, then the rest.
     *
     * It was three labelled sections, and the headings were the smaller half
     * of the problem. The same account appeared in two of them — Harborview
     * Hotels sat under RECENT and again under PINNED — so a forty-account
     * panel drew forty-four rows, the pin you pressed moved in one copy and
     * not the other, and the arrow keys walked the duplicate twice. Sections
     * are a reasonable way to show a list you READ; this is a list you aim
     * at, and ordering says everything the headings were saying without
     * spending a row to say it.
     *
     * Pinned leads because it is the set a person curated on purpose, recents
     * follow because that is where they have actually been, and the remainder
     * is the catalogue. Each account appears exactly once, in the first band
     * that claims it.
     */
    const pinnedAccounts = pinnedIds
      .map(byId)
      .filter((a): a is Account => a !== undefined);

    const claimed = new Set(pinnedAccounts.map((a) => a.id));

    // The current account is left out of the recents band only — you are
    // already in it, so offering it as somewhere to go back to is noise. It
    // still appears below with everything else, where its tick reads as "you
    // are here" and its pin stays reachable.
    const recent = recentIds
      .map(byId)
      .filter(
        (a): a is Account =>
          a !== undefined && a.id !== current.id && !claimed.has(a.id),
      )
      .slice(0, RECENT_IN_SWITCHER);

    for (const a of recent) claimed.add(a.id);

    const rest = accounts.filter((a) => !claimed.has(a.id));

    return [
      { id: "all", accounts: [...pinnedAccounts, ...recent, ...rest] },
    ].filter((g) => g.accounts.length > 0);
  }, [accounts, current.id, pinnedIds, query, recentIds]);

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
