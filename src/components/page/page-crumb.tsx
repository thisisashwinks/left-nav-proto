"use client";

import * as React from "react";
import type { Crumb } from "@/components/header/app-header";

/**
 * A crumb the open PAGE owns, published up to the shell's trail.
 *
 * RecordCrumb already lets a page say "I have drilled into one record"; this
 * is the other half of the same idea and the one the Sep 22 header variants
 * need. Several of them (L-E, K-C, X-6) move a page-level SCOPE control —
 * the smart list, the pipeline, the sub-section — out of the canvas and into
 * the trail, where it becomes the last crumb and switches from there. Only the
 * page knows what those siblings are, and only the shell draws the bar, so the
 * page publishes and the shell renders.
 *
 * Deliberately generic: `label` + `options` + `onSelect` is all AppHeader's
 * Crumb needs, so any page can use this for any switcher without the shell
 * learning a second thing about contacts.
 */
/** One published segment — everything AppHeader's Crumb can draw, no more. */
export interface PageCrumbSegment {
  label: string;
  icon?: Crumb["icon"];
  /** The siblings this crumb switches between. Omit for a plain label. */
  options?: Crumb["options"];
  onSelect?: (id: string) => void;
}

export interface PageCrumb extends PageCrumbSegment {
  /**
   * Levels hanging below this one, deepest last.
   *
   * One segment covered the scope-picker variants, which is what this file was
   * written for. X-2 is the case that needed a second: its whole argument is
   * that the bar can state the WHOLE path — AI Agents ▸ Voice AI ▸ Dashboard &
   * logs ▸ Inbound — and be judged against the tab strips it leaves standing.
   * A page that published one crumb at a time could not say that, and two
   * contexts racing to own the tail would have been worse than one that can
   * carry a chain.
   *
   * Only the head may `replace`: the tail is always below it by construction.
   */
  tail?: readonly PageCrumbSegment[];
  /**
   * Whether this takes the place of the trail's own last crumb rather than
   * hanging below it.
   *
   * Append is the default because the usual case adds a level the shell cannot
   * see (Contacts ▸ Smart lists ▸ All contacts). Replace is for the page whose
   * scope IS the thing the shell's tail already names, where appending would
   * put the same word in the trail twice.
   */
  replace?: boolean;
}

type Ctx = readonly [PageCrumb | null, (crumb: PageCrumb | null) => void];

export const PageCrumbContext = React.createContext<Ctx>([null, () => undefined]);

export function usePageCrumbState() {
  return React.useContext(PageCrumbContext);
}

/**
 * Publishes a crumb for as long as the caller passes one.
 *
 * Pages build the crumb inline every render, so publishing the object itself
 * would re-publish on every render and loop. What is compared instead is the
 * crumb's VISIBLE shape — its label and the ids, labels and selection of its
 * options — and the handlers ride along in a ref, which is the same trick
 * useRecordCrumb plays with `onExit`.
 */
export function usePageCrumb(crumb: PageCrumb | null) {
  const [, setCrumb] = usePageCrumbState();
  const latest = React.useRef(crumb);
  React.useEffect(() => {
    latest.current = crumb;
  });

  const shapeOf = (seg: PageCrumbSegment) => [
    seg.label,
    (seg.options ?? []).map((o) => [o.id, o.label, o.selected ?? false]),
  ];
  const key = crumb
    ? JSON.stringify([
        crumb.replace ?? false,
        shapeOf(crumb),
        (crumb.tail ?? []).map(shapeOf),
      ])
    : null;

  React.useEffect(() => {
    const published = latest.current;
    if (!key || !published) return;
    setCrumb({
      ...published,
      onSelect: (id: string) => latest.current?.onSelect?.(id),
      // Each tail segment keeps its own index rather than its own closure, so
      // a re-render that rebuilds the array does not strand a stale handler on
      // a crumb the bar is still showing.
      tail: (published.tail ?? []).map((seg, i) => ({
        ...seg,
        onSelect: (id: string) => latest.current?.tail?.[i]?.onSelect?.(id),
      })),
    });
    return () => setCrumb(null);
  }, [key, setCrumb]);
}

/**
 * The shell's side: fold the published crumb into a trail.
 *
 * Kept here rather than in the shell so the two halves of the contract sit in
 * one file — what a page may publish, and exactly what that does to the bar.
 */
export function withPageCrumb(
  trail: readonly (string | Crumb)[],
  crumb: PageCrumb | null,
): (string | Crumb)[] {
  if (!crumb) return [...trail];
  const toSeg = (s: PageCrumbSegment): Crumb => ({
    label: s.label,
    icon: s.icon,
    options: s.options,
    onSelect: s.onSelect,
  });
  const kept = crumb.replace ? trail.slice(0, -1) : trail;
  return [...kept, toSeg(crumb), ...(crumb.tail ?? []).map(toSeg)];
}
