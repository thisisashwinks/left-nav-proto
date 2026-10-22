"use client";

import * as React from "react";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { announce } from "@/lib/a11y";
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
  // Whether the query has been edited since open — gates the announcement.
  const typed = React.useRef(false);

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
    typed.current = true;
    setQueryRaw(q);
    setActiveIndex(0);
  }, []);

  // Once typing pauses, say how many results there are. Not on open: the
  // untouched list is the default, not an answer.
  React.useEffect(() => {
    if (!typed.current) return;
    const t = window.setTimeout(() => {
      announce(
        flat.length === 0
          ? "No results"
          : `${flat.length} result${flat.length === 1 ? "" : "s"}`,
      );
    }, 400);
    return () => window.clearTimeout(t);
  }, [query, flat.length]);

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

const TABBABLE =
  'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])';

/**
 * Keeps Tab and Shift+Tab inside a modal search surface. Attach to the
 * dialog's onKeyDown. Keyboard only — pointer focus is never redirected.
 */
export function trapTab(e: React.KeyboardEvent<HTMLElement>) {
  if (e.key !== "Tab") return;
  const list = Array.from(
    e.currentTarget.querySelectorAll<HTMLElement>(TABBABLE),
  ).filter((el) => el.getClientRects().length > 0);
  if (list.length === 0) return;
  const first = list[0];
  const last = list[list.length - 1];
  const active = document.activeElement;
  if (e.shiftKey && (active === first || !e.currentTarget.contains(active))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && (active === last || !e.currentTarget.contains(active))) {
    e.preventDefault();
    first.focus();
  }
}
