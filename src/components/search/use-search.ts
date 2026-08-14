"use client";

import * as React from "react";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import {
  flattenGroups,
  searchResults,
  type SearchGroup,
  type SearchResult,
} from "./search-data";

interface UseSearch {
  query: string;
  setQuery: (q: string) => void;
  groups: SearchGroup[];
  /** Flat list in display order — what the arrow keys walk. */
  flat: SearchResult[];
  activeIndex: number;
  activeId: string | null;
  setActiveIndex: (i: number) => void;
  /** Attach to the input. Handles ↑ ↓ ↵ and Escape. */
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Query state plus keyboard navigation, shared by the command palette and the
 * nav search flyout so the two variants behave identically and only differ in
 * how they are presented.
 */
export function useSearch(onClose: () => void): UseSearch {
  const [query, setQueryRaw] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(0);

  // Scoped to the account the session is in, so search and the nav agree about
  // what exists. A product the account never bought is not a search result.
  const { state } = useNavLayout();
  const enabled = React.useMemo(
    () => new Set(state.enabledProducts),
    [state.enabledProducts],
  );
  const groups = React.useMemo(
    () => searchResults(query, enabled),
    [query, enabled],
  );
  const flat = React.useMemo(() => flattenGroups(groups), [groups]);

  // Typing re-ranks, so the highlight goes back to the top hit.
  const setQuery = React.useCallback((q: string) => {
    setQueryRaw(q);
    setActiveIndex(0);
  }, []);

  const clamped = flat.length === 0 ? -1 : Math.min(activeIndex, flat.length - 1);

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
      } else if (e.key === "Enter") {
        e.preventDefault();
        // Nothing to route to in a prototype; opening a result closes search,
        // which is the observable half of the interaction.
        onClose();
      }
    },
    [flat.length, onClose],
  );

  return {
    query,
    setQuery,
    groups,
    flat,
    activeIndex: clamped,
    activeId: clamped >= 0 ? flat[clamped].id : null,
    setActiveIndex,
    onKeyDown,
  };
}
