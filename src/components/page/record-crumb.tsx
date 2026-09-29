"use client";

import * as React from "react";
import type { CrumbOption } from "@/components/header/app-header";

/**
 * A record the page has opened, published to the trail.
 *
 * Detail views are in-page state here, not routes, so the shell cannot know
 * it is looking at one contact rather than the list of them. A page that
 * opens a record says so through this, and the breadcrumb grows one crumb —
 * which is what a back button was standing in for. The trail is the way out,
 * so the page does not need to draw a second one.
 */
export interface RecordCrumb {
  /** The record's own name — "Jatin", "Northside webinar". */
  label: string;
  /**
   * What KIND of record it is — "Contact details", "Funnel details".
   *
   * Both readings travel together, and the page supplies both, because the
   * page is the only thing that knows what it opened. The shell CHOOSES
   * between them (`recordCrumbLabel`); it never derives one from the other.
   * A map in the shell from product id → noun was the alternative and it was
   * rejected on Sep 22: it would have made the shell hold a second, silent
   * catalogue of what every page contains, out of reach of the page that
   * actually knows, and wrong the moment a page opened two kinds of record.
   */
  kind: string;
  /**
   * The records BESIDE this one, so the crumb can switch between them.
   *
   * Optional, and the reason it has to be is the reason it was missing for a
   * week: not every record has siblings worth listing. A builder's trail
   * exists to get you out — a funnel page editor offering "the other pages
   * of this funnel" would be inviting you to leave mid-edit — and a door
   * that has not created a record yet (funnel-ai-builder's "Build with AI")
   * has nothing to be beside.
   *
   * Where they DO exist, this is what makes `crumbLeaf` mean anything on a
   * record page. Three of that axis's five values — caret, dots, and the
   * page-title menu — are shapes for a dropdown, and with no options the
   * last crumb fell through to plain text on every detail view in the
   * product. The axis worked on lists and died on records, which is half the
   * screens it was meant to be judged on. Ashwin, Sep 28.
   *
   * The PAGE supplies them, like `kind`, and for the same reason: the shell
   * cannot know that the siblings of this contact are the other members of
   * the lit smart list rather than every contact in the account. That is the
   * page's own cut, and it is the one the record pager already walks.
   */
  options?: CrumbOption[];
  /** Opens a sibling. Required for `options` to do anything. */
  onSelect?: (id: string) => void;
  /** Run when the trail leaves the record, so the page can close it. */
  onExit?: () => void;
}

type Ctx = readonly [RecordCrumb | null, (crumb: RecordCrumb | null) => void];

export const RecordCrumbContext = React.createContext<Ctx>([
  null,
  () => undefined,
]);

export function useRecordCrumbState() {
  return React.useContext(RecordCrumbContext);
}

/**
 * What a page may publish: the record's name, or both of its readings.
 *
 * The bare string is still legal and still means "this record is called X".
 * It is not a deprecated shape — it is what a screen with no generic noun
 * worth printing should pass, and funnel-ai-builder's "Build with AI" is
 * exactly that: a door that has not created a record yet, so there is no kind
 * of thing to name. When only a name arrives the kind falls back to it, which
 * keeps `generic` honest rather than blank.
 */
export type RecordCrumbName =
  | string
  | {
      name: string;
      kind: string;
      /** The records beside this one. See `RecordCrumb.options`. */
      options?: CrumbOption[];
      onSelect?: (id: string) => void;
    };

/**
 * Publishes a crumb for as long as the component is mounted.
 *
 * `onExit` is held in a ref so a fresh closure each render does not
 * re-publish the crumb, which would loop.
 *
 * Note that this publishes in every case, including when the tuning panel has
 * `recordCrumbShown` off. The page states that a record is open; the shell
 * decides what the bar does with that. Gating publication here would have
 * been shorter and it would have broken the way out: the shell also rewrites
 * every crumb ABOVE the record so that clicking one closes it first, and a
 * record that never announced itself would leave "Contacts ▸ Smart lists"
 * pointing at a list you are not looking at.
 */
export function useRecordCrumb(
  record: RecordCrumbName | null,
  onExit?: () => void,
) {
  const [, setCrumb] = useRecordCrumbState();
  const exitRef = React.useRef(onExit);
  React.useEffect(() => {
    exitRef.current = onExit;
  });

  // Destructured to two primitives before the effect so the deps stay strings:
  // a caller that builds `{ name, kind }` inline every render would otherwise
  // hand the effect a new object each time and re-publish forever.
  const name = typeof record === "string" ? record : (record?.name ?? null);
  const kind = typeof record === "string" ? record : (record?.kind ?? null);
  const options = typeof record === "string" ? undefined : record?.options;
  /*
   * The siblings, held the same way `onExit` is, and for the same reason one
   * step further.
   *
   * A page builds this array inline — `contacts.map(...)` — so it is a new
   * array on every render, and a new array in the effect's deps is a publish
   * on every render, which is a loop. The VALUE goes in a ref the effect
   * reads; a cheap string of what is in it goes in the deps. So the crumb
   * re-publishes when the list actually changes and not when it is merely
   * rebuilt.
   */
  const optionsRef = React.useRef(options);
  const selectRef = React.useRef(
    typeof record === "string" ? undefined : record?.onSelect,
  );
  React.useEffect(() => {
    optionsRef.current = options;
    selectRef.current =
      typeof record === "string" ? undefined : record?.onSelect;
  });
  const optionsKey = options
    ? options.map((o) => `${o.id}:${o.selected ? 1 : 0}`).join(",")
    : "";

  React.useEffect(() => {
    if (!name) return;
    const siblings = optionsRef.current;
    setCrumb({
      label: name,
      kind: kind ?? name,
      ...(siblings && siblings.length > 0
        ? {
            options: siblings,
            onSelect: (id: string) => selectRef.current?.(id),
          }
        : {}),
      onExit: () => exitRef.current?.(),
    });
    return () => setCrumb(null);
  }, [name, kind, optionsKey, setCrumb]);
}
