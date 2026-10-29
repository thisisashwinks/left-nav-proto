"use client";

import * as React from "react";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { labelForProduct } from "@/components/nav/grouping";
import { announce } from "@/lib/a11y";
import {
  flattenGroups,
  searchResults,
  targetOf,
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
  /** Open a result: navigate where it points, then close. Attach to the rows. */
  pick: (r: SearchResult) => void;
  /** Attach to the input. Handles ↑ ↓ ↵ and Escape. */
  onKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Query state plus keyboard navigation, shared by the command palette and the
 * nav search flyout so the two variants behave identically and only differ in
 * how they are presented.
 */
export function useSearch(
  onClose: () => void,
  /**
   * Where a chosen result lands. Optional only so a surface can mount
   * without one; every surface in the shell passes it.
   */
  onNavigate?: (id: string) => void,
): UseSearch {
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
  /*
   * The account's own names, so a renamed row is findable by what it is
   * called here rather than only by what it shipped as. `labelForProduct`
   * resolves products and children alike and falls back to the catalogue,
   * so the fallback this passes is only reached for ids it has never heard
   * of — which is none of the ones the walk produces.
   */
  const labelFor = React.useCallback(
    (id: string, fallback: string) => labelForProduct(state, id) || fallback,
    [state],
  );
  const groups = React.useMemo(
    () => searchResults(query, enabled, labelFor),
    [query, enabled, labelFor],
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

  /*
   * Opening a result used to close search and leave the canvas where it was,
   * so ↵ on a row that said "Jump to" jumped nowhere (Ashwin, Oct 29). The
   * row knows its destination; this is where it gets used. A hit with no
   * destination — a generic action — still closes, which is the honest half.
   */
  const pick = React.useCallback(
    (r: SearchResult) => {
      const target = targetOf(r, enabled);
      if (target) onNavigate?.(target);
      onClose();
    },
    [enabled, onNavigate, onClose],
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
      } else if (e.key === "Enter") {
        e.preventDefault();
        const hit = flat[Math.min(activeIndex, flat.length - 1)];
        if (hit) pick(hit);
      }
    },
    [flat, activeIndex, pick, onClose],
  );

  return {
    query,
    setQuery,
    groups,
    flat,
    activeIndex: clamped,
    activeId: clamped >= 0 ? flat[clamped].id : null,
    setActiveIndex,
    pick,
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
