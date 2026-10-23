"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronUp, Minus, Search, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { restoreFocus } from "@/lib/a11y";
import { lastRowMenuTrigger } from "./row-menu";
import type { AddPickerCommit } from "@/design/theme";
import { childById, productById } from "./catalogue";
import {
  canDemote,
  childrenFor,
  isRowHidden,
  labelForProduct,
  stockTreeFor,
  type NavLayoutState,
} from "./grouping";
import { iconForChildLabel } from "./l3-icons";

/**
 * One picker for adding rows, wherever the adding happens.
 *
 * The cascading menu it replaces asked you to walk a tree one rung at a time
 * and pick exactly one thing at the bottom of it — so adding four rows meant
 * opening the same menu four times and re-walking the same path, and the menu
 * never once showed you what you had chosen. Worse, the rung you landed on
 * silently decided what KIND of row you were adding, which is the distinction
 * Ashwin says nobody can hold: "product" and "sub-product" are words for a
 * shape in the data, not for anything a reader wants.
 *
 * So: one flat, searchable list with checkboxes, parents and children in it
 * together, and the selection visible the whole time. You tick what you want
 * and press add once. Nothing names a level. Ashwin, Oct 21.
 *
 * WHAT A TICK MEANS, which is the only rule here worth stating:
 *
 *   A ticked PARENT lands as a row of its own and keeps the children that
 *   stayed ticked. Unticking one of its children leaves that child out of the
 *   nav rather than cancelling the parent — the box says "include this row",
 *   and it says it the same way at both depths.
 *
 *   Ticked CHILDREN whose parent is NOT ticked land on their own, directly at
 *   the destination, with no parent and no category over them. This is the
 *   case the old menu could only reach by adding the parent and then deleting
 *   it.
 *
 * Both rules are the same sentence read twice: what you ticked is what you
 * get. The structure follows from the ticks rather than from which submenu
 * you were standing in when you clicked.
 */

const GAP = 4;

/*
 * ONE row, at every rung — Ashwin, Oct 21.
 *
 * The three levels had drifted into three different rows: 13.5px medium for
 * a category, 13px for a product, 13px muted with a 14px glyph for a child,
 * and three paddings that put them at three heights. Read down the column it
 * looked like three lists that happened to be stacked, and the size
 * differences read as importance rather than as depth.
 *
 * Depth is carried by INDENT alone now. That is the one signal here that
 * cannot be mistaken for emphasis: a row further right is further in, and
 * nothing about its weight or colour claims it matters less. Everything
 * else — height, size, leading, ink, glyph — is identical, and shared from
 * here so the next rung added cannot quietly invent a fourth.
 */
const ROW =
  "motion-tap flex h-[32px] items-center gap-[9px] rounded-[7px] text-left hover:bg-nav-hover";
const ROW_TEXT = "min-w-0 flex-1 truncate text-[13.5px] leading-[18px] text-nav-fg";
const ROW_ICON = 15;
/** The step between one rung and the next, in px of left inset. */
const INDENT = 18;
/*
 * The picker is as wide as the nav it adds to — Ashwin, Oct 21.
 *
 * It was a 300px literal, which at the default nav width overhung the
 * sidebar on both sides and read as a surface belonging to the page rather
 * than to the nav. Taking the L1 width means the popover's edges line up
 * with the column whose contents it is editing, and it follows the width
 * slider instead of drifting out of agreement with it.
 */

/** One row in the picker: a product, or one of its children. */
interface PickRow {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number | string; className?: string }>;
  /** Present on a parent, and only when at least one child is offerable. */
  children?: PickRow[];
  /**
   * Filable under another row — see `canDemote`, whose answer this is.
   *
   * Not "has no children": a product whose children are TABS has none in
   * the nav's sense, and the picker's own `kids` already knows that. The
   * two have to be read from the same rule or the box lies.
   */
  leaf?: boolean;
  /**
   * Already in the destination — so its box starts ticked.
   *
   * It used to mean "greyed out": the row was shown but could not be
   * touched, on the argument that you cannot add what is already there.
   * That reading was too clever by half — Ashwin, Oct 23. A reader opening
   * "Add to CRM" sees Contacts dimmed and has to reconstruct WHY from the
   * name of the destination, which is the one piece of context a popover
   * is worst at carrying.
   *
   * So the box simply tells the truth: ticked means "in CRM". Ticking adds,
   * unticking removes, and the list reads as the destination's contents
   * rather than as a catalogue with holes punched in it.
   */
  present?: boolean;
}

/** What a commit hands back — already split by the rule above. */
export interface AddPickerResult {
  /** Parents to add, each with the children that stayed ticked. */
  parents: { id: string; keep: string[]; drop: string[] }[];
  /** Children to add on their own, parentless. */
  loose: string[];
  /**
   * Children ticked under a parent the destination ALREADY holds.
   *
   * Contacts is in CRM and you tick Tasks under it: nothing is being added
   * to the category, something is being added to a row of it. The parent
   * must not be re-placed, so this cannot ride in `parents`.
   */
  fill: { id: string; parentId: string }[];
  /**
   * Rows the destination holds that the reader UNTICKED.
   *
   * Hidden rather than deleted by every caller, which is this nav's only
   * reversible "leave it out" — see `toggleRowHidden`.
   */
  remove: string[];
}

/**
 * The tree to offer, minus whatever the destination already holds.
 *
 * Built here rather than reusing `productTreeOptionsDeep`, which shapes
 * itself for a cascading menu: it folds a product into its own submenu as the
 * first row, which is exactly the ambiguity this picker exists to remove. A
 * row appears once, at its own depth, with a box beside it.
 */
function rowsFor(
  state: NavLayoutState,
  /** Is this row already where we are adding to? */
  added: (id: string) => boolean,
): { id: string; label: string; icon: PickRow["icon"]; rows: PickRow[] }[] {
  const { categories } = stockTreeFor(state);
  return categories
    .map((c) => ({
      id: c.id,
      label: c.label,
      icon: c.icon as PickRow["icon"],
      rows: c.productIds.map((pid) => {
        const shipped = productById(pid);
        /*
         * `tabs: true` means a product's children are views on its own
         * page rather than places — see `productTreeOptionsDeep`, which
         * refuses them for the same reason. Offering one would file a tab
         * into the nav as a destination.
         */
        /*
         * A child of a product already in the destination is "present"
         * only if it is actually filed under it RIGHT NOW.
         *
         * `added` cannot answer this: the category's version of it asks
         * `productIds.includes(id)`, and a child is not on that list at any
         * depth. So the live tree is read instead — which is also what
         * makes the ticks honest after the reader has moved children
         * around in edit mode.
         */
        /*
         * Hidden is ABSENT, as far as this picker is concerned.
         *
         * Removing from here hides rather than deletes, so a row taken out
         * and then looked for again would otherwise come back ticked and
         * refuse to be re-added — the one state the picker must not get
         * into. Hidden reads as not-there, ticking it puts it back, and the
         * round trip closes. Ashwin, Oct 23.
         */
        const selfPresent = added(pid) && !isRowHidden(state, pid);
        const here = selfPresent
          ? new Set(
              childrenFor(state, pid)
                .filter((c) => !isRowHidden(state, c.id))
                .map((c) => c.id),
            )
          : null;
        const kids = (shipped?.tabs ? [] : (shipped?.children ?? [])).map(
          (k) => ({
            id: k.id,
            label: k.label,
            // Every rung carries a glyph. A child without one in the
            // catalogue takes the same label-derived icon the nav gives
            // it, so a row looks the same here as where it will land.
            icon: (k.icon ?? iconForChildLabel(k.label)) as PickRow["icon"],
            present: here
              ? here.has(k.id)
              : added(k.id) && !isRowHidden(state, k.id),
          }),
        );
        return {
          id: pid,
          label: shipped?.label ?? labelForProduct(state, pid),
          ...(shipped?.icon ? { icon: shipped.icon } : {}),
          present: selfPresent,
          leaf: canDemote(pid),
          ...(kids.length > 0 ? { children: kids } : {}),
        } satisfies PickRow;
      }),
    }))
    .filter((c) => c.rows.length > 0);
}

/** Every id in the tree that the destination already holds. */
function presentIds(
  groups: readonly { rows: readonly PickRow[] }[],
): Set<string> {
  const out = new Set<string>();
  for (const g of groups)
    for (const r of g.rows) {
      if (r.present) out.add(r.id);
      for (const k of r.children ?? []) if (k.present) out.add(k.id);
    }
  return out;
}

export function AddPicker({
  anchor,
  title,
  state,
  added,
  onCommit,
  onClose,
  align = "start",
  commit = "footer",
  childrenOnly = false,
  self = null,
  centreOn = null,
}: {
  anchor: DOMRect;
  /** Where the rows are going, named — "the nav", or a category's label. */
  title: string;
  state: NavLayoutState;
  /**
   * Is this row already in the destination?
   *
   * It used to be `exclude` and removed the row, then `disabled` and greyed
   * it. Now it seeds the TICK: present rows open checked, and clearing one
   * takes it back out. See `PickRow.present`.
   */
  added: (id: string) => boolean;
  onCommit: (result: AddPickerResult) => void;
  onClose: () => void;
  align?: "start" | "end";
  /** Where the selection lives while it is being built. See ADD_PICKER_COMMITS. */
  commit?: AddPickerCommit;
  /**
   * The destination is a ROW, not a list — so most products are the path.
   *
   * A product that HAS children cannot be filed under another product:
   * `withChildFiled` would write it, and then `childrenFor` — which
   * resolves ids through the catalogue's second rung, where a product is
   * not — would never adopt it back, so the row would simply vanish. Those
   * products keep their chevron and lose their box.
   *
   * A CHILDLESS product is a different matter, and gets its box — Ashwin,
   * Oct 23. There is nothing under it to lose, the store files it cleanly,
   * and dragging one onto a row already demotes it exactly this way. The
   * picker was the only door that disagreed.
   */
  childrenOnly?: boolean;
  /**
   * The row being added TO, when there is one.
   *
   * It has to be named rather than inferred. `added` says yes to the
   * destination and to everything in it alike, so once a childless product
   * has been demoted into this row there are two "present" products in the
   * list and no way to tell the container from its contents.
   */
  self?: string | null;
  /**
   * The surface to centre on, when it is not the nav.
   *
   * Opened from an L2 flyout the picker belongs to that panel: centring it
   * on the sidebar instead put it over a different column from the list it
   * was editing, which reads as a popover that has lost its parent. The
   * caller measures, because only it knows which surface it is — the panel
   * is a portalled dialog and the picker cannot find it by selector without
   * guessing at labels. Ashwin, Oct 21.
   */
  centreOn?: DOMRect | null;
}) {
  const { navTheme, effective } = useTheme();
  /*
   * 16px narrower than the nav, and centred on it — Ashwin, Oct 21.
   *
   * Matching the nav exactly made the popover's edges sit directly on the
   * column's, which reads as the nav having grown rather than as a surface
   * floating over it. Inset by 8 a side, the shadow has somewhere to fall
   * and the thing underneath still frames it.
   *
   * Centred on the NAV rather than aligned to whatever opened it: the four
   * triggers — the dashed row, a category's kebab, a product's kebab, the
   * panel's own plus — sit at four different heights and two different
   * columns, and a popover that chased each of them would land somewhere
   * different every time for a list that is always the same list.
   */
  const WIDTH = Math.max(200, effective.navWidthL1 - 16);
  const [query, setQuery] = React.useState("");
  /*
   * Opens holding what the destination already holds — Ashwin, Oct 23.
   *
   * Seeded once, from the tree as it stands when the picker opens, so the
   * list starts as a picture of CRM rather than of the catalogue. Every
   * later change is the reader's, which is what makes the diff at the
   * bottom of this file a diff rather than a guess.
   */
  const [ticked, setTicked] = React.useState<ReadonlySet<string>>(() =>
    presentIds(rowsFor(state, added)),
  );
  /*
   * Everything starts shut — Ashwin, Oct 21.
   *
   * The first cut drew every category open with every child under it, which
   * at this catalogue is 150-odd rows in a 264px column: a wall you scroll
   * rather than a list you read. Shut, the picker opens on about a dozen
   * category rows — the same shape as the nav it is adding to, which is also
   * the shape a reader already knows.
   *
   * Two sets rather than one, because the rungs nest: a product can only be
   * open inside an open category, and collapsing the category has to leave
   * the product's own state alone so reopening it shows what it showed
   * before.
   */
  const [openCats, setOpenCats] = React.useState<ReadonlySet<string>>(new Set());
  const [openRows, setOpenRows] = React.useState<ReadonlySet<string>>(new Set());
  const box = React.useRef<HTMLDivElement>(null);
  /*
   * Keyboard focus back on whatever opened the picker when it closes. Opened
   * from a row menu's item, that item is gone by then — so the menu's trigger.
   */
  const [opener] = React.useState<HTMLElement | null>(() => {
    if (typeof document === "undefined") return null;
    const active = document.activeElement as HTMLElement | null;
    return active?.closest('[role="menu"]') ? lastRowMenuTrigger() : active;
  });
  React.useEffect(() => () => restoreFocus(opener), [opener]);
  const [measured, setMeasured] = React.useState<number | null>(null);

  const groups = React.useMemo(
    () => rowsFor(state, added),
    [state, added],
  );

  /*
   * Search matches at either depth, and keeps the path to a hit.
   *
   * A child matching alone would otherwise appear under a parent the query
   * does not mention, which reads as the filter being wrong. Keeping the
   * parent row — unticked, as context — is what makes "analytics" show you
   * Reporting › Analytics rather than a bare Analytics with no provenance.
   */
  const q = query.trim().toLowerCase();
  const shown = React.useMemo(() => {
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        rows: g.rows
          .map((r) => {
            const hitSelf = r.label.toLowerCase().includes(q);
            const kids = (r.children ?? []).filter((k) =>
              k.label.toLowerCase().includes(q),
            );
            if (hitSelf) return r;
            if (kids.length > 0) return { ...r, children: kids };
            return null;
          })
          .filter((r): r is PickRow => r !== null),
      }))
      .filter((g) => g.rows.length > 0);
  }, [groups, q]);

  /*
   * A query opens whatever it matched, without touching what you opened.
   *
   * Filtering a collapsed tree and leaving it collapsed shows a list of
   * category names and no hits — the search appears to have found nothing
   * when it found plenty. So while there is a query the disclosure is
   * derived rather than stored, and clearing the field puts your own
   * expansions back exactly as they were.
   */
  const catOpen = (id: string) => (q ? true : openCats.has(id));
  const rowOpen = (id: string) => (q ? true : openRows.has(id));

  React.useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const read = () => setMeasured(el.offsetHeight);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = measured ?? 360;
  const below = anchor.bottom + GAP;
  const above = anchor.top - GAP - height;
  const top =
    below + height <= window.innerHeight - 8
      ? below
      : above >= 8
        ? above
        : Math.max(8, window.innerHeight - height - 8);
  /*
   * Centred on the nav column when there is one, else on the trigger.
   *
   * Read from the DOM rather than passed in: the picker is portalled to the
   * body and every caller would otherwise have to measure the same element
   * and hand over the same number. `align` is kept for the fallback, which
   * is what a surface outside the nav still needs.
   */
  const navRect =
    typeof document === "undefined"
      ? null
      : (document
          .querySelector("[data-nav-root]")
          ?.getBoundingClientRect() ?? null);
  /*
   * The surface this picker belongs to: the panel that opened it, or the
   * nav. `align` is the last resort, for a caller outside both.
   */
  const host = centreOn ?? navRect;
  const wanted = host
    ? host.left + (host.width - WIDTH) / 2
    : align === "end"
      ? anchor.left - WIDTH + anchor.width
      : anchor.left;
  /*
   * Centred where it fits, pushed back on where it does not.
   *
   * The clamp is what makes "no room on the left, so open to the right"
   * work without a branch: a popover centred on a panel near either edge
   * slides back inside the viewport rather than hanging off it, and the
   * 8px keeps it off the glass.
   */
  const left = Math.min(
    Math.max(8, wanted),
    Math.max(8, window.innerWidth - WIDTH - 8),
  );

  /** Every row the picker is currently offering, flat — for the parent box. */
  const kidsOf = (row: PickRow) => (row.children ?? []).map((k) => k.id);

  const toggleRow = (row: PickRow) => {
    /*
     * Ticking a row opens it — Ashwin, Oct 23.
     *
     * The tick takes the children with it, and a reader who cannot see
     * that happen has to take the footer's count on faith. Opening is not
     * the same as forcing it open: the chevron still closes it, and
     * unticking leaves whatever state the reader left behind.
     */
    if (!ticked.has(row.id) && (row.children?.length ?? 0) > 0)
      setOpenRows((prev) => new Set(prev).add(row.id));
    setTicked((prev) => {
      const next = new Set(prev);
      const kids = kidsOf(row);
      const kidIds = (row.children ?? []).map((k) => k.id);
      if (next.has(row.id)) {
        /*
          Unticking a parent takes its children with it.

          The alternative — leaving the children ticked — would turn one
          click into the "loose children" case silently, which is the exact
          surprise this picker is meant to remove. Untick means "not this
          row and not what is under it"; a reader who wants only the children
          ticks only the children.
        */
        next.delete(row.id);
        for (const k of kids) next.delete(k);
      } else {
        next.add(row.id);
        for (const k of kidIds) next.add(k);
      }
      return next;
    });
  };

  const toggleChild = (id: string) => {
    setTicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  /** Parent box state: on, off, or some-of. */
  const parentState = (row: PickRow): "on" | "off" | "some" => {
    if (ticked.has(row.id)) return "on";
    const kids = kidsOf(row);
    return kids.some((k) => ticked.has(k)) ? "some" : "off";
  };

  /** Everything the destination held when the picker opened. */
  const here = React.useMemo(() => presentIds(groups), [groups]);

  /*
   * The DIFF, computed once at commit from the ticks alone.
   *
   * No mode, no toggle, no second question: the shape of the selection IS
   * the instruction, and since the ticks start as the destination's own
   * contents, the difference between them and what is ticked now is the
   * whole errand. A parent in `parents` arrives and keeps its ticked
   * children; a child whose parent went untouched comes back in `loose` to
   * be placed on its own; a child ticked under a parent that is already
   * there is a `fill`; and anything that WAS there and is not ticked now
   * is a `remove`.
   */
  const result = (): AddPickerResult => {
    const parents: AddPickerResult["parents"] = [];
    const loose: string[] = [];
    const fill: AddPickerResult["fill"] = [];
    const remove: string[] = [];
    const claimed = new Set<string>();
    for (const g of groups) {
      for (const row of g.rows) {
        const kids = row.children ?? [];
        if (childrenOnly) {
          /*
           * The destination itself: not a row being added, a container
           * whose contents the ticks under it describe.
           */
          if (row.id === self) {
            for (const k of kids) {
              claimed.add(k.id);
              if (k.present && !ticked.has(k.id)) remove.push(k.id);
              else if (!k.present && ticked.has(k.id))
                fill.push({ id: k.id, parentId: row.id });
            }
            continue;
          }
          /*
           * A childless product, demoted into the row — the same move
           * dragging it there performs, and the same verb behind it.
           */
          if (row.leaf) {
            if (row.present && !ticked.has(row.id)) remove.push(row.id);
            else if (!row.present && ticked.has(row.id)) loose.push(row.id);
          }
          /*
           * Anything else is a path. Its children are still tickable and
           * come back through the sweep below, which is how an L3 moves
           * from one row to another.
           */
          continue;
        }
        /*
         * A row that is already there is never re-placed. The only thing
         * it can contribute is a change to what hangs under it — plus its
         * own removal, if the reader cleared the box.
         */
        if (row.present) {
          for (const k of kids) claimed.add(k.id);
          if (!ticked.has(row.id)) {
            remove.push(row.id);
            continue;
          }
          for (const k of kids) {
            if (k.present && !ticked.has(k.id)) remove.push(k.id);
            else if (!k.present && ticked.has(k.id))
              fill.push({ id: k.id, parentId: row.id });
          }
          continue;
        }
        if (ticked.has(row.id)) {
          parents.push({
            id: row.id,
            keep: kids.filter((k) => ticked.has(k.id)).map((k) => k.id),
            drop: kids.filter((k) => !ticked.has(k.id)).map((k) => k.id),
          });
          for (const k of kids) claimed.add(k.id);
        }
      }
    }
    for (const id of ticked) {
      if (claimed.has(id) || here.has(id)) continue;
      if (productById(id)) continue;
      if (childById(id)) loose.push(id);
    }
    return { parents, loose, fill, remove };
  };

  /** How many rows arrive, and how many leave — the two halves of the verb. */
  const [adds, removes] = (() => {
    const r = result();
    return [r.parents.length + r.loose.length + r.fill.length, r.remove.length];
  })();
  const count = adds + removes;

  /*
   * What the tag field shows: one chip per ROW THAT WILL BE ADDED.
   *
   * Not one per tick. Ticking a parent ticks its children too, and a chip
   * for each of those would say five things were being added when the nav
   * is getting one row with four children under it — the count beside the
   * button and the chips above it would disagree about the same selection.
   */
  const chips = (() => {
    const r = result();
    return [
      ...r.parents.map((p) => ({
        id: p.id,
        label: labelForProduct(state, p.id),
      })),
      ...r.loose.map((id) => ({ id, label: labelForProduct(state, id) })),
      ...r.fill.map((f) => ({ id: f.id, label: labelForProduct(state, f.id) })),
    ];
  })();

  /** Taking a chip out takes its children with it, as unticking the row does. */
  const untick = (id: string) => {
    setTicked((prev) => {
      const next = new Set(prev);
      next.delete(id);
      const shipped = productById(id);
      for (const k of shipped?.children ?? []) next.delete(k.id);
      return next;
    });
  };

  /*
   * What the button is about to do, counted — Ashwin, Oct 21.
   *
   * The footer used to carry "4 items selected" beside a bare "Add", which
   * said the same thing twice and left the button itself mute. Naming the
   * count ON the verb lets the other half go: "Add 4 products" is the whole
   * sentence, and at zero it is the label the control will have once you
   * tick something rather than a status line reading "Nothing selected".
   */
  /*
   * And a tick can now take something OUT, which the verb has to survive.
   *
   * "Add 3 products" over a selection that also drops one is a lie, and
   * naming both halves — "Add 3, remove 1" — gets wide enough to wrap in a
   * 248px footer for a sentence nobody reads twice. So the count stays on
   * the pure-add path, where it is the whole story, and anything with a
   * removal in it falls back to one neutral verb. Ashwin, Oct 23.
   */
  const addLabel =
    removes > 0
      ? "Update products"
      : adds > 1
        ? `Add ${adds} products`
        : "Add product";

  const Box = ({ state: s }: { state: "on" | "off" | "some" }) => (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
        s === "off"
          ? "shadow-[inset_0_0_0_1.5px_var(--fly-border)]"
          : "bg-[var(--brand)] text-white",
      )}
    >
      {s === "on" ? (
        <Check size={11} strokeWidth={3} />
      ) : s === "some" ? (
        <Minus size={11} strokeWidth={3} />
      ) : null}
    </span>
  );

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="fixed inset-0 z-[70] cursor-default"
      />
      <div
        ref={box}
        role="dialog"
        aria-label={`Add to ${title}`}
        data-nav-theme={navTheme}
        data-cursor="menu"
        style={{ top: Math.max(8, top), left, width: WIDTH }}
        className="motion-panel-in fixed z-[71] flex max-h-[420px] flex-col rounded-[10px] bg-nav shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
      >
        {/*
          Where these rows are going, said once at the top.

          The destination was only in the placeholder, which disappears the
          moment anybody types — so the one fact that changes what the Add
          button DOES was the first thing to leave the screen. Four entry
          points reach this picker and three of them look identical once it
          is open; the header is what tells them apart. Ashwin, Oct 23.

          `title` is already contextual at every call site: the category for
          a category's menu or the seam between its rows, the row itself for
          a row's menu or the seam between its items, and the nav for the
          dashed row at the foot. The header just stops hiding it.
        */}
        <div className="shrink-0 px-[10px] pt-[10px] pb-[2px]">
          <p className="truncate text-[12px] leading-[16px] font-medium text-nav-fg-subtle">
            Adding to {title}
          </p>
        </div>

        {/*
          A FIELD, not a row that happens to hold an input.

          It read as a title with a magnifier beside it — nothing said it
          could be typed into until you had already guessed. A ring, a
          height and a fill are what make a text input look like one, and
          this is the control the whole picker depends on at 150 rows.
        */}
        <div className="shrink-0 px-[8px] pt-[6px] pb-[6px]">
          <div className="flex h-[32px] items-center gap-[7px] rounded-[7px] px-[8px] shadow-[inset_0_0_0_1px_var(--fly-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]">
            <Search
              size={14}
              aria-hidden="true"
              className="shrink-0 text-nav-fg-subtle"
            />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label={`Find something to add to ${title}`}
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-nav-fg outline-none placeholder:text-nav-fg-subtle"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="motion-tap flex size-[18px] shrink-0 items-center justify-center rounded-[5px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
              >
                <X size={12} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        <div // No reserved gutter: the native overlay bar costs no width and
          // shows itself while you scroll. A `thin` gutter was 15px of
          // permanent empty column in a 248px popover.
          className="min-h-0 flex-1 overflow-y-auto px-[6px] pb-[6px]">
          {shown.length === 0 ? (
            <p className="px-[6px] py-[10px] text-[12.5px] leading-[17px] text-nav-fg-subtle">
              {q ? "Nothing matches that." : "Everything is already in here."}
            </p>
          ) : null}
          {shown.map((g) => {
            const CatIcon = g.icon;
            const open = catOpen(g.id);
            return (
              <div key={g.id}>
                {/*
                  The category is a DISCLOSURE, not a heading.

                  It cannot be ticked — none of the verbs behind this picker
                  can file a whole category into another one — so it carries
                  no box. What it does carry is its own glyph and a chevron,
                  which is the same row the nav draws for it: the picker
                  should look like the thing it is editing.
                */}
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() =>
                    setOpenCats((prev) => {
                      const next = new Set(prev);
                      if (next.has(g.id)) next.delete(g.id);
                      else next.add(g.id);
                      return next;
                    })
                  }
                  className={cn(ROW, "w-full pr-[2px] pl-[8px]")}
                >
                  {CatIcon ? (
                    <CatIcon size={ROW_ICON} className="shrink-0 text-nav-fg-muted" />
                  ) : null}
                  <span className={ROW_TEXT}>{g.label}</span>
                  {/*
                    The chevron trails the row — Ashwin, Oct 21.

                    Leading it pushed the icon and the label in by 20px, so
                    the categories started at a different x from the products
                    under them and the column read as two lists. Trailing, the
                    glyphs line up down the whole tree and the disclosure gets
                    a column of its own on the right, which is where the nav
                    this picker edits already puts it.
                  */}
                  {/*
                    A 24px box, the same one the product's chevron button
                    occupies, so the two land on one column rather than a few
                    pixels apart — the difference reads as misalignment long
                    before anyone works out which row is wrong.
                  */}
                  <span
                    aria-hidden="true"
                    className="flex size-[24px] shrink-0 items-center justify-center text-nav-fg-subtle"
                  >
                    {/*
                      Down when shut, up when open — Ashwin, Oct 23.

                      A right chevron promises a submenu beside the row,
                      which is exactly what this picker replaced. The list
                      opens UNDER the row, so the glyph points at where the
                      rows will appear and then reverses to point at the way
                      back.
                    */}
                    {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </span>
                </button>

                {open
                  ? g.rows.map((row) => {
                      const st = parentState(row);
                      const RowIcon = row.icon;
                      const kidsOpen = rowOpen(row.id);
                      /*
                       * Does this row carry a box, or is it just the path?
                       *
                       * Into a list, every row does. Into another ROW, only
                       * the ones the store can actually file there: not the
                       * destination itself, and not a product with children
                       * under it. See `childrenOnly`.
                       */
                      const boxed =
                        !childrenOnly || (row.id !== self && row.leaf === true);
                      return (
                        <React.Fragment key={row.id}>
                          <div
                            className="flex items-center gap-[2px] pr-[2px]"
                            style={{ paddingLeft: INDENT }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                boxed
                                  ? toggleRow(row)
                                  : setOpenRows((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(row.id)) next.delete(row.id);
                                      else next.add(row.id);
                                      return next;
                                    })
                              }
                              {...(boxed ? { "aria-pressed": st === "on" } : {})}
                              className={cn(ROW, "min-w-0 flex-1 px-[8px]")}
                            >
                              {boxed ? <Box state={st} /> : null}
                              {RowIcon ? (
                                <RowIcon size={ROW_ICON} className="shrink-0 text-nav-fg-muted" />
                              ) : null}
                              <span className={ROW_TEXT}>{row.label}</span>
                            </button>
                            {/*
                              The chevron is its own target, beside the box
                              rather than on it.

                              Ticking a row and looking inside it are two
                              different intentions, and one button cannot
                              carry both: a click that both selected four
                              children and revealed them would make the
                              selection a side effect of browsing.
                            */}
                            {row.children ? (
                              <button
                                type="button"
                                aria-expanded={kidsOpen}
                                aria-label={`${kidsOpen ? "Hide" : "Show"} items in ${row.label}`}
                                onClick={() =>
                                  setOpenRows((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(row.id)) next.delete(row.id);
                                    else next.add(row.id);
                                    return next;
                                  })
                                }
                                className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
                              >
                                {kidsOpen ? (
                                  <ChevronUp size={13} aria-hidden="true" />
                                ) : (
                                  <ChevronDown size={13} aria-hidden="true" />
                                )}
                              </button>
                            ) : (
                              <span aria-hidden="true" className="size-[24px] shrink-0" />
                            )}
                          </div>
                          {kidsOpen
                            ? (row.children ?? []).map((kid) => {
                                const KidIcon = kid.icon;
                                return (
                                  <button
                                    key={kid.id}
                                    type="button"
                                    onClick={() => toggleChild(kid.id)}
                                    aria-pressed={ticked.has(kid.id)}
                                    className={cn(ROW, "w-full pr-[34px]")}
                                    style={{ paddingLeft: INDENT * 2 + 8 }}
                                  >
                                    <Box state={ticked.has(kid.id) ? "on" : "off"} />
                                    {KidIcon ? (
                                      <KidIcon size={ROW_ICON} className="shrink-0 text-nav-fg-muted" />
                                    ) : null}
                                    <span className={ROW_TEXT}>{kid.label}</span>
                                  </button>
                                );
                              })
                            : null}
                        </React.Fragment>
                      );
                    })
                  : null}
              </div>
            );
          })}
        </div>

        {/*
          The commit, in whichever shape the axis asks for. See
          ADD_PICKER_COMMITS.

          Always drawn, disabled at zero rather than absent: a bar that
          appears on the first tick moves the list under the pointer at the
          exact moment someone is aiming at it.
        */}
        {commit === "tags" ? (
          <div className="flex shrink-0 flex-col gap-[7px] border-t border-[var(--fly-border)] px-[10px] py-[9px]">
            {/*
              The field the trigger became, with what you picked inside it.

              Each tag names one row and carries its own remove, so the
              selection can be edited where it is READ rather than only
              where it was found — the whole argument for this variant.
              Scrolls past four rows so a big selection cannot push the list
              off the screen it was picked from.
            */}
            <div className="flex max-h-[84px] flex-wrap items-center gap-[4px] overflow-y-auto rounded-[7px] px-[6px] py-[5px] shadow-[inset_0_0_0_1px_var(--fly-border)]">
              {chips.length === 0 ? (
                <span className="px-[2px] py-[2px] text-[12px] leading-[16px] text-nav-fg-subtle">
                  Nothing selected yet
                </span>
              ) : (
                chips.map((c) => (
                  <span
                    key={c.id}
                    className="flex max-w-full items-center gap-[4px] rounded-[5px] bg-nav-hover py-[2px] pr-[3px] pl-[6px] text-[12px] leading-[16px] text-nav-fg"
                  >
                    <span className="min-w-0 truncate">{c.label}</span>
                    <button
                      type="button"
                      aria-label={`Remove ${c.label}`}
                      onClick={() => untick(c.id)}
                      className="motion-tap flex size-[14px] shrink-0 items-center justify-center rounded-[4px] text-nav-fg-subtle hover:bg-nav hover:text-nav-fg"
                    >
                      <X size={10} aria-hidden="true" />
                    </button>
                  </span>
                ))
              )}
            </div>
            <button
              type="button"
              disabled={count === 0}
              onClick={() => {
                onCommit(result());
                onClose();
              }}
              className={cn(
                "motion-tap h-[30px] w-full shrink-0 rounded-[7px] text-[12.5px] leading-none font-medium",
                count === 0
                  ? "cursor-not-allowed bg-nav-hover text-nav-fg-subtle"
                  : "bg-[var(--admin-action)] text-[var(--admin-action-fg)] hover:brightness-95",
              )}
            >
{addLabel}
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center justify-end border-t border-[var(--fly-border)] px-[10px] py-[9px]">
            <button
              type="button"
              disabled={count === 0}
              onClick={() => {
                onCommit(result());
                onClose();
              }}
              className={cn(
                "motion-tap h-[28px] shrink-0 rounded-[7px] px-[10px] text-[12.5px] leading-none font-medium",
                count === 0
                  ? "cursor-not-allowed bg-nav-hover text-nav-fg-subtle"
                  : "bg-[var(--admin-action)] text-[var(--admin-action-fg)] hover:brightness-95",
              )}
            >
              {addLabel}
            </button>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}
