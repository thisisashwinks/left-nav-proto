"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  EllipsisVertical,
  GripVertical,
  Keyboard,
  Pin,
  Shapes,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MERGED_HEADING_LABELS } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { agencyPlaces } from "./agency-config";
import { useAgencyLayout } from "./agency-layout";
import { childById, productById } from "./catalogue";
import { glyphFor, type NavLayoutState } from "./grouping";
import { ComposedIcon } from "./composed-icon";
import { useNavLayout } from "./nav-layout-provider";
import { PIN_CAP_HINT, usePinnedInk } from "./pin-button";
import { usePinFeedback, usePinLanded } from "./pin-feedback";
import { RailTooltip } from "./rail-tooltip";
import { EditAffordance } from "./inline-rename";
import { usePinShortcuts } from "./pin-shortcuts";
import { ShortcutChip } from "./shortcut-chip";
import { ShortcutModal } from "./shortcut-modal";
import { IconPicker, useIconPicker } from "./icon-picker";
import { RowMenu, useRowMenu, type RowMenuAction } from "./row-menu";
import { RowSeam } from "./row-seam";
import { PIN_MIME } from "./nav-drag";
import { useDragTypes } from "@/lib/use-drag-active";

/**
 * Recents and Pinned as one list — the Cloudflare arrangement.
 *
 * The 04 Aug review's objection was that pinned and recents overlap and both eat
 * the same 200 vertical pixels. Every earlier answer rationed that space between
 * two blocks. This one removes the second block: pins sit at the top of Recents
 * and recently visited places follow them, so pinning means "keep this at the top
 * of the list I already read" instead of "put this in a different list somewhere
 * else".
 *
 * Drawn here rather than assembled as `NavEntry`s in nav-config, because almost
 * nothing about these rows is a nav row: they carry a subtitle, a trailing pin,
 * a hairline between two runs of the same list, and an overflow control that
 * grows the block in place. Threading all of that through the entry pipeline
 * would put five merged-mode branches inside the renderer every other mode uses.
 *
 * Every visible decision here is an axis on the theme — see MERGED_* in
 * design/theme.ts. The merge raises about six questions with no obvious answer,
 * and the only honest way to choose between them is to look at all of them.
 */

/**
 * Stand-ins for real history: the account's own products, minus anything
 * already pinned.
 *
 * The minus is the whole point of the merge. In two separate blocks a pinned
 * product could also be a recent one and nobody noticed; in one list it would be
 * the same row twice, a few pixels apart.
 *
 * Exported because the panel behind "View all" has to show the same history the
 * block does — two derivations of "recent" that can disagree is exactly the bug
 * a reviewer would find and nobody could explain.
 */
export function recentIdsFor(state: NavLayoutState): string[] {
  return state.enabledProducts.filter((id) => !state.pinned.includes(id));
}

/** One resolved row: a pin or a recent visit, already named and iconed. */
export interface MergedRow {
  id: string;
  label: string;
  icon: LucideIcon | undefined;
  /** The row's own glyph, when `icon` is its parent's. See ComposedIcon. */
  badge?: LucideIcon;
  /**
   * Drawn in the icon's place when the row is not a place at all.
   *
   * The agency list can hold sub-accounts, and a client is recognised by its
   * mark rather than by a glyph from the same set every page uses.
   */
  avatar?: React.ReactNode;
  /** The trail under the name. Empty when the row is a top-level product. */
  detail: string;
  pinned: boolean;
  /**
   * Pinning this row, when it is a thing that can be pinned.
   *
   * Passed in rather than read from a store, because the two scopes keep their
   * pins in different ones — and because some rows are not pinnable at all: a
   * sub-account in the agency list is somewhere you switch to, not a page you
   * keep, so it simply has no pin.
   */
  onTogglePin?: () => void;
  /**
   * Pinnable in principle, refused right now — the list is full.
   *
   * Carried on the row rather than read from a store inside it, for the same
   * reason `onTogglePin` is: the two scopes cap different lists.
   */
  pinBlocked?: boolean;
}

/**
 * What a pinned row may do to itself, in edit mode.
 *
 * Exactly the affordances an L1 row has, and no others: a grip, an icon you
 * press to change, and a kebab. NO RENAME — a pin names an L2 or an L3, and
 * those have no label override behind them, so a pencil here would be a
 * control that either does nothing or writes to the wrong place. Removing is
 * in the menu instead, which is the useful half of what a rename field was
 * standing in for.
 *
 * Recents never get a bundle — see PINNED_ROW_EDIT_DEFAULT for why the
 * capability stops at the pinned run.
 */
export interface PinRowEdit {
  /**
   * Opens the icon picker, anchored on the glyph the reader pressed.
   *
   * The GLYPH is the trigger, not a button beside it — an L1 row in edit mode
   * works exactly this way, and a pinned row that grew a separate picker
   * button would be a second answer to a question this nav settled.
   */
  onPickIcon?: (trigger: HTMLElement) => void;
  /** Native drag wiring for the six-dot grip and the row as a drop target. */
  drag: {
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    dragging: boolean;
  };
  /** The kebab: move up, move down, shortcut keys, remove. */
  onOpenMenu: (trigger: HTMLElement) => void;
}

/**
 * The merged list itself, given rows that someone else resolved.
 *
 * Split from the two derivations below because the arrangement is the same in
 * both scopes and the vocabulary is not: a sub-account merges products with
 * products, the agency merges areas with areas or with whole clients. Every
 * axis, every count and every pixel of this is shared; only what goes in it
 * differs, which is exactly the seam.
 */
function MergedList({
  pins: givenPins,
  recents: givenRecents,
  onSelect,
  onOpenPanel,
  pinEditFor,
  pinSeam,
}: {
  pins: MergedRow[];
  recents: MergedRow[];
  onSelect: (id: string) => void;
  /** Opens the panel behind "View all" — the full pin list and history. */
  onOpenPanel: () => void;
  /**
   * Editing affordances for one pinned row, by its place in the run.
   *
   * A function of the INDEX as well as the id, because two of the three verbs
   * are about position — the first row has no "up" and the last none of
   * "down" — and the index a row is drawn at is this component's to know, not
   * the caller's: the hold that keeps an unpinned row in its slot can shift
   * everything below it for the length of an animation.
   */
  pinEditFor?: (id: string, index: number) => PinRowEdit | undefined;
  /**
   * The drop line above the pinned row at `index`, and one past the last.
   *
   * Rendered by the caller because only it knows the store indices a drop
   * resolves against — this component draws the run in whatever order the
   * axis asks for, and can hold a leaving row in a slot that no longer
   * matches the array.
   */
  pinSeam?: (index: number) => React.ReactNode;
}) {
  const {
    mergedPinMark,
    mergedOverflow,
    mergedHeading,
    mergedVisibleRows,
    mergedPinCap,
    mergedRecentFloor,
    mergedExpandedRows,
  } = useTheme().effective;

  /*
   * How much of the list is showing, face-local on purpose.
   *
   * "How much of this do I want to see right now" is a property of the nav in
   * front of you rather than of the account — the same reasoning the banded
   * sections use for their folds.
   *
   * There is no folded state any more. The heading used to carry a caret that
   * took the whole block away, which a block holding your pins cannot afford:
   * the caret's slot now belongs to "View all", which is the thing you actually
   * want from a heading over a truncated list.
   */
  const [expanded, setExpanded] = React.useState(false);

  /*
   * A row that has just been unpinned is held in the pinned run while it goes.
   *
   * The store is instant and correct: press unpin and the row is out of
   * `pins` and into `recents` before this renders. That leaves the exit
   * animation with nothing to play on — the row it would animate is already
   * somewhere else, wearing a different position in a different run, and what
   * the eye sees is a jump.
   *
   * So for the length of the exit the list lies in exactly one way: the row
   * stays where it was. It is removed from the history it has joined for the
   * same beat, or it would be in the list twice. Everything downstream —
   * budget, caps, "show more" — counts it where it is drawn, which is the
   * point: the slot stays open until the row has finished leaving it.
   */
  const { landed } = usePinFeedback();
  /*
   * The row comes back with the announcement, rather than being looked up.
   *
   * It used to be found in `recents`, on the reasonable-sounding assumption
   * that an unpinned row lands there. It only does sometimes: `recentIdsFor`
   * is `enabledProducts` minus `pinned`, so a pinned row that is not an
   * enabled PRODUCT — every pinned L3, and any product switched off in the
   * layout — leaves the pinned run and appears nowhere. There was then
   * nothing to hold and nothing to animate, and the treatment looked broken
   * on exactly the pins this list is most often used for.
   *
   * `PinHold` fixes that at the source: the row and its index are read in the
   * click handler, which is the last moment either is knowable, and travel
   * with the event. See the note on PinHold.
   */
  const leavingId =
    landed?.event === "unpin" &&
    !givenPins.some((p) => p.id === landed.productId)
      ? landed.productId
      : null;
  /*
   * The hold first, then the old lookup as a fallback.
   *
   * Both paths are live because both presses are real. An unpin performed on
   * THIS list carries a hold — the row knows its own slot — and lands back
   * in it exactly. An unpin performed from a flyout, the search results or a
   * nav row goes through PinButton, which has no idea this list exists and
   * cannot say where in it the row sat; there the best available answer is
   * still "find it in recents and let it leave from the end", which is what
   * shipped and what works for an enabled product.
   *
   * The cast is safe by construction and confined to this line: the only
   * thing that ever attaches a hold on this surface is the row below, and it
   * attaches a MergedRow.
   */
  const leaving = leavingId
    ? ((landed?.hold?.row as MergedRow | undefined) ??
      givenRecents.find((r) => r.id === leavingId))
    : undefined;
  /*
   * Put back where it was, not on the end.
   *
   * Appending held the row for the right length of time in the wrong slot: it
   * jumped to the bottom of the pinned run and animated out from there, which
   * is the jump the hold exists to prevent, merely relocated. At the cap it
   * was worse than that — the appended row fell outside `pins.slice(0,
   * pinsShown)` and was not drawn at all, so the exit silently did nothing on
   * a full list. Splicing it back into its own index keeps both the position
   * and the budget exactly as they were before the press.
   */
  const heldIndex = Math.min(
    landed?.hold?.index ?? givenPins.length,
    givenPins.length,
  );
  const pins = leaving
    ? [...givenPins.slice(0, heldIndex), leaving, ...givenPins.slice(heldIndex)]
    : givenPins;
  const recents = leaving
    ? givenRecents.filter((r) => r.id !== leaving.id)
    : givenRecents;

  const budget = expanded
    ? Math.max(mergedExpandedRows, mergedVisibleRows)
    : mergedVisibleRows;
  // Expanded, the cap lifts: "show more" that still hides pins is not showing more.
  const { pinsShown, recentsShown } = allocate({
    pinCount: pins.length,
    recentCount: recents.length,
    budget,
    pinCap: expanded ? pins.length : mergedPinCap,
    recentFloor: mergedRecentFloor,
  });

  const visiblePins = pins.slice(0, pinsShown);
  const visibleRecents = recents.slice(0, recentsShown);

  const hasMore = pins.length > pinsShown || recents.length > recentsShown;

  if (pins.length === 0 && recents.length === 0) return null;

  /*
   * `index` is the row's place in the PINNED run, and only the pinned run
   * passes one: it is what an exit needs to put the row back where it was,
   * and a recent row has no slot to be put back into.
   */
  const row = (r: MergedRow, index?: number) => {
    // Only the pinned run passes an index, so only the pinned run can be
    // edited — the capability and the run are the same test.
    const pinEdit =
      index === undefined ? undefined : pinEditFor?.(r.id, index);
    return (
      <MergedItemRow
        key={r.id}
        row={r}
        index={index}
        mark={mergedPinMark}
        onSelect={() => onSelect(r.id)}
        {...(pinEdit ? { pinEdit } : {})}
      />
    );
  };

  /*
   * Where "View all" lives.
   *
   * Top right of the block's first heading, wherever that heading is. With
   * sub-headings there is no master heading to hang it on, so it rides the
   * Pinned row — adding a third heading purely to hold one link would cost more
   * rows than the link saves.
   */
  const sublabelled = mergedPinMark === "sublabel";
  const viewAll = { label: "View all", onClick: onOpenPanel };

  return (
    /*
      The destination a pinned row is shown flying to.

      The block rather than the first row: the row a pin lands in does not exist
      until the pin has happened, and reading a slot that is about to appear is
      how you aim at the wrong place by exactly one row height. See
      PIN_FEEDBACKS.
    */
    <div
      data-pin-target=""
      className="flex w-full shrink-0 flex-col gap-[var(--t-nav-space,2px)]"
    >
      {sublabelled ? null : (
        <BlockHeading
          text={MERGED_HEADING_LABELS[mergedHeading]}
          action={viewAll}
        />
      )}

      {sublabelled && visiblePins.length > 0 ? (
        <BlockHeading text="Pinned" action={viewAll} />
      ) : null}
      {visiblePins.map((r, i) => (
        <React.Fragment key={`pin-slot-${r.id}`}>
          {pinSeam?.(i)}
          {row(r, i)}
        </React.Fragment>
      ))}
      {/* The seam that closes the run, so a pin can be dropped last. */}
      {visiblePins.length > 0 ? pinSeam?.(visiblePins.length) : null}

      {sublabelled && visibleRecents.length > 0 ? (
        <BlockHeading
          text="Recent"
          {...(visiblePins.length === 0 ? { action: viewAll } : {})}
        />
      ) : null}
      {visibleRecents.map((r) => row(r))}

      <MergedOverflowRow
        mode={mergedOverflow}
        hasMore={hasMore}
        expanded={expanded}
        onExpand={() => setExpanded(true)}
        onCollapse={() => setExpanded(false)}
        onOpenPanel={onOpenPanel}
      />

      {/*
        The rule that closes the block, and the only one it has.

        It used to sit between the pinned run and the recent run, where it was
        answering "why does the order change halfway down" — a question the pin
        glyph already answers, and answering it twice made the merged list look
        like the two blocks it replaced. Down here it draws the boundary that is
        actually there: everything above is a shortcut, everything below is the
        account's tree.
      */}
      <div
        aria-hidden="true"
        className="my-[6px] ml-[8px] h-px w-[calc(100%-16px)] bg-nav-border"
      />
    </div>
  );
}

/**
 * The block's heading, with an optional link riding its right edge.
 *
 * Not `NavSectionLabel`: that component's right-hand slot is a fold caret, and
 * the two cannot share it. A heading over a list that is knowingly truncated
 * wants a way into the whole list far more than it wants a way to hide what is
 * left, so this one gives the slot to "View all" and drops folding entirely.
 */
function BlockHeading({
  text,
  action,
}: {
  text: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex w-full shrink-0 items-center justify-between gap-2 pt-[14px] pr-[4px] pb-[6px] pl-[8px]">
      <span className="text-[11px] leading-[13px] font-semibold tracking-[0.4px] whitespace-nowrap text-nav-fg-subtle uppercase">
        {text}
      </span>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="motion-tap group flex shrink-0 items-center gap-[2px] rounded-[5px] py-[2px] pr-[3px] pl-[5px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted"
        >
          {/*
            Medium, against the heading's semibold.

            The heading is a label and this is a control, and at 11px there is
            not enough size between them to say which is which — regular read as
            a caption sitting next to a title rather than as something to click.
            One step of weight is the whole difference.
          */}
          <span className="text-[11px] leading-[13px] font-medium whitespace-nowrap">
            {action.label}
          </span>
          <ChevronRight
            size={13}
            aria-hidden="true"
            className="shrink-0 motion-tap group-hover:translate-x-[1px]"
          />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Puts the pinned run the way up the axis asks for.
 *
 * Both stores append on pin, so the stored tail is the newest. Shared because
 * "where does the row I just pinned appear" has one answer for the product, and
 * having it drift between scopes would make the axis untestable.
 */
export function orderPins(
  pinned: readonly string[],
  newestFirst: boolean,
): string[] {
  return newestFirst ? [...pinned].reverse() : [...pinned];
}

/**
 * The sub-account's merged list: products and L3 rows, pinned and recent.
 */
export function MergedRecentsBlock({
  onSelect,
  onOpenPanel,
}: {
  onSelect: (id: string) => void;
  onOpenPanel: () => void;
}) {
  const {
    state,
    groups,
    productLabelFor,
    togglePin,
    pinsFull,
    movePin,
    can,
    setIcon,
    resetIcon,
    hasIconOverride,
  } = useNavLayout();
  const { mergedRowDetail, mergedPinOrder, pinnedRowEdit } =
    useTheme().effective;
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  /*
   * This block's own picker and menu, not the nav column's.
   *
   * Which row has a popover open is transient UI, and sharing it would mean
   * pressing the glyph here also opened a picker over the tree's copy of the
   * same row. Same argument `useNavRowEdit` makes about rename state.
   */
  const picker = useIconPicker();
  const menu = useRowMenu();
  const dragTypes = useDragTypes();
  /*
   * The element the menu came out of, kept so an action inside it can anchor
   * a popover of its own. `useRowMenu` stores a rect, and the picker wants a
   * live node to measure — see IconPicker.
   */
  const [iconTrigger, setIconTrigger] = React.useState<HTMLElement | null>(null);

  /** Which group a product sits in, for the breadcrumb under its name. */
  const groupOf = React.useCallback(
    (productId: string) =>
      groups.find((g) => g.productIds.includes(productId))?.label ?? "",
    [groups],
  );

  const detailFor = React.useCallback(
    (id: string): string => {
      if (mergedRowDetail === "name") return "";
      /*
       * A pinned L3 is the case that makes the breadcrumb load-bearing: three
       * products ship a Settings, and a merged list showing three rows called
       * Settings is a list you cannot use. The trail names the product and any
       * ancestors between it and the row.
       */
      const child = childById(id);
      if (child) {
        return [
          productLabelFor(child.product.id),
          ...child.path.map((c) => c.label),
        ].join(" / ");
      }
      return groupOf(id);
    },
    [mergedRowDetail, productLabelFor, groupOf],
  );

  const resolve = React.useCallback(
    (id: string, pinned: boolean): MergedRow | null => {
      // The same guard the dock uses: a pin can name an L3 as well as a product,
      // and an id that resolves to neither is a row the nav cannot draw.
      if (!productById(id) && !childById(id)) return null;
      // The same composite the dock and the panel draw, so one pin looks like
      // itself wherever you meet it.
      const glyph = glyphFor(state, id);
      return {
        id,
        label: productLabelFor(id),
        icon: glyph.icon,
        ...(glyph.badge ? { badge: glyph.badge } : {}),
        detail: detailFor(id),
        pinned,
        onTogglePin: () => togglePin(id),
        ...(!pinned && pinsFull ? { pinBlocked: true } : {}),
      };
    },
    [state, productLabelFor, detailFor, togglePin, pinsFull],
  );

  const pins = React.useMemo(
    () =>
      orderPins(state.pinned, mergedPinOrder === "newest")
        .map((id) => resolve(id, true))
        .filter((row): row is MergedRow => row !== null),
    [state.pinned, mergedPinOrder, resolve],
  );

  const recents = React.useMemo(
    () =>
      recentIdsFor(state)
        .map((id) => resolve(id, false))
        .filter((row): row is MergedRow => row !== null),
    [state, resolve],
  );

  /*
   * The pinned run's editing, or nothing at all.
   *
   * Three gates, three different questions: the axis (is this prototype
   * showing the feature), the mode (is the reader arranging rather than
   * using), and whether the id is actually pinned.
   *
   * Everything resolves against the STORE's order, never the drawn one. With
   * `mergedPinOrder: "newest"` the list is reversed for display, so "up the
   * screen" is "later in the array" — and a drop lands on the store index of
   * the row it was dropped on, whichever way round the list is being read.
   */
  const pinEditFor = React.useCallback(
    (id: string): PinRowEdit | undefined => {
      if (!pinnedRowEdit || !state.editing) return undefined;
      const at = state.pinned.indexOf(id);
      if (at < 0) return undefined;
      return {
        ...(can.regroup
          ? {
              onPickIcon: (trigger: HTMLElement) => picker.open(id, trigger),
            }
          : {}),
        drag: {
          dragging: draggingId === id,
          onDragStart: (e) => {
            /*
             * The index, under the pin type — `dataTransfer.types` is the
             * only part readable mid-drag, so the KIND of thing in flight
             * has to be the MIME. `text/plain` alongside it because some
             * browsers refuse a drag carrying no standard type at all.
             */
            e.dataTransfer.setData(PIN_MIME, String(at));
            e.dataTransfer.setData("text/plain", `pin:${at}`);
            e.dataTransfer.effectAllowed = "move";
            setDraggingId(id);
          },
          onDragEnd: () => setDraggingId(null),
          onDragOver: (e) => e.preventDefault(),
          onDrop: (e) => {
            e.preventDefault();
            const from = e.dataTransfer.getData("text/plain");
            setDraggingId(null);
            const fromIndex = Number(from.split(":")[1]);
            if (from.startsWith("pin:") && !Number.isNaN(fromIndex)) {
              movePin(fromIndex, at);
            }
          },
        },
        onOpenMenu: (trigger: HTMLElement) => {
          setIconTrigger(trigger);
          menu.open(id, trigger);
        },
      };
    },
    [pinnedRowEdit, state.editing, state.pinned, can.regroup, picker, menu, movePin, draggingId],
  );

  /*
   * The kebab's verbs, in the order a reader reaches for them.
   *
   * Move first because arranging is what the mode is FOR; the shortcut next
   * because it is a property of the position just established; remove last
   * and alone, as the one action that cannot be undone by doing it again.
   *
   * No rename. See PinRowEdit: a pin names an L2 or an L3 and there is no
   * label override behind those, so the verb would be a lie.
   */
  const menuActionsFor = (id: string): RowMenuAction[] => {
    const at = state.pinned.indexOf(id);
    const last = state.pinned.length - 1;
    return [
      {
        id: "pin-up",
        label: "Move up",
        icon: ArrowUp,
        // Absent rather than greyed at the ends of the run: the position
        // already says why, and a dead row in a four-item menu is noise.
        ...(at > 0 ? { onSelect: () => movePin(at, at - 1) } : {}),
      },
      {
        id: "pin-down",
        label: "Move down",
        icon: ArrowDown,
        ...(at < last ? { onSelect: () => movePin(at, at + 1) } : {}),
      },
      {
        id: "pin-icon",
        label: "Change icon",
        icon: Shapes,
        /*
          The same picker the glyph itself opens, anchored on the kebab the
          reader just pressed — a popover has to come from the thing that
          summoned it, and by the time this fires the glyph is under a menu.
          Duplicated on purpose: pressing the icon is the fast path for
          someone who knows it is a button, and this is how everyone else
          finds out it is one.
        */
        ...(iconTrigger
          ? {
              onSelect: () => {
                menu.close();
                picker.open(id, iconTrigger);
              },
            }
          : {}),
      },
      {
        id: "pin-shortcut",
        label: "Configure shortcut key",
        icon: Keyboard,
        onSelect: () => setShortcutsOpen(true),
      },
    ];
  };

  /*
   * The line that says where a dragged pin would land.
   *
   * The same `RowSeam` the L1 rows use, and for the reason its own note
   * gives: a highlighted ROW would mean "drop it inside this one", which is
   * not a move the pinned run has. Without them this list had the gesture and
   * none of the signposting — you could drag, and nothing on screen said
   * where to let go.
   *
   * Drop-only, no plus. A seam's plus means "add one here", and pins are
   * added by pinning something, never by a control in this list.
   */
  const pinSeam = (index: number) =>
    pinnedRowEdit && state.editing ? (
      <RowSeam
        key={`pin-seam-${index}`}
        dragTypes={dragTypes}
        accepts={[PIN_MIME]}
        onDrop={(payload) => {
          const from = Number(payload);
          if (!Number.isNaN(from)) movePin(from, index);
        }}
      />
    ) : null;

  return (
    <>
    {picker.targetId && picker.anchor ? (
      <IconPicker
        anchor={picker.anchor}
        selected={state.icons[picker.targetId]}
        onPick={(name) => setIcon(picker.targetId!, name)}
        {...(hasIconOverride(picker.targetId)
          ? { onReset: () => resetIcon(picker.targetId!) }
          : {})}
        onClose={picker.close}
      />
    ) : null}
    {menu.openId && menu.anchor ? (
      <RowMenu
        anchor={menu.anchor}
        title={productLabelFor(menu.openId)}
        actions={menuActionsFor(menu.openId)}
        onClose={menu.close}
      />
    ) : null}
    {shortcutsOpen ? (
      <ShortcutModal
        rows={pins.map((p) => ({
          id: p.id,
          label: p.label,
          ...(p.icon ? { icon: p.icon } : {}),
          ...(p.detail ? { detail: p.detail } : {}),
        }))}
        onClose={() => setShortcutsOpen(false)}
      />
    ) : null}
    <MergedList
      pins={pins}
      recents={recents}
      onSelect={onSelect}
      onOpenPanel={onOpenPanel}
      pinEditFor={pinEditFor}
      pinSeam={pinSeam}
    />
    </>
  );
}

/**
 * The agency's merged list.
 *
 * Same arrangement, different vocabulary. The agency pins AREAS — Prospecting,
 * SaaS configurator, rollup reporting — and its Recent has always named
 * ACCOUNTS, the clients it last had open. Which of those the merged list is
 * made of is the one question the sub-account never had to answer, so it is an
 * axis rather than a decision: see MERGED_AGENCY_RECENTS.
 *
 * Accounts never carry a pin. Switching client is not navigating — it changes
 * what the whole nav is about — and "keep this at the top of my list" is not a
 * thing you can coherently say about it. They ride in the recent run only.
 */
export function AgencyMergedRecentsBlock({
  onSelect,
  onOpenPanel,
  accounts,
  onSwitchAccount,
}: {
  onSelect: (id: string) => void;
  onOpenPanel: () => void;
  /** Recently visited sub-accounts, in the order they were last open. */
  accounts: { id: string; label: string; mark: React.ReactNode }[];
  onSwitchAccount: (id: string) => void;
}) {
  const agency = useAgencyLayout();
  const { mergedRowDetail, mergedPinOrder, mergedAgencyRecents } =
    useTheme().effective;

  const resolvePlace = React.useCallback(
    (id: string, pinned: boolean): MergedRow | null => {
      const place = agencyPlaces[id];
      if (!place) return null;
      /*
       * The trail names the bucket the row sits under, and the L2 above an L3.
       * An agency row is one or two levels deep, so this is shorter than a
       * sub-account's — but it is doing the same job: three buckets have a
       * Reselling, and the list has to say which one this is.
       */
      const trail =
        mergedRowDetail === "name"
          ? ""
          : [
              place.bucket.id === id ? "" : place.bucket.label,
              place.parent?.label ?? "",
            ]
              .filter(Boolean)
              .join(" / ");
      return {
        id,
        label: agency.labelFor(id, place.label),
        icon: place.icon,
        detail: trail,
        pinned,
        onTogglePin: () => agency.togglePin(id),
      };
    },
    [agency, mergedRowDetail],
  );

  const pins = React.useMemo(
    () =>
      orderPins(agency.pinned, mergedPinOrder === "newest")
        .map((id) => resolvePlace(id, true))
        .filter((row): row is MergedRow => row !== null),
    [agency.pinned, mergedPinOrder, resolvePlace],
  );

  const recents = React.useMemo(() => {
    const places =
      mergedAgencyRecents === "accounts"
        ? []
        : agencyRecentPlaceIds(agency.state.order, agency.pinned)
            .map((id) => resolvePlace(id, false))
            .filter((row): row is MergedRow => row !== null);

    const clients: MergedRow[] =
      mergedAgencyRecents === "places"
        ? []
        : accounts.map((account) => ({
            id: `account:${account.id}`,
            label: account.label,
            icon: undefined,
            avatar: account.mark,
            detail: mergedRowDetail === "name" ? "" : "Sub-account",
            pinned: false,
          }));

    return [...places, ...clients];
  }, [
    mergedAgencyRecents,
    agency.state.order,
    agency.pinned,
    resolvePlace,
    accounts,
    mergedRowDetail,
  ]);

  return (
    <MergedList
      pins={pins}
      recents={recents}
      onSelect={(id) =>
        id.startsWith("account:")
          ? onSwitchAccount(id.slice("account:".length))
          : onSelect(id)
      }
      onOpenPanel={onOpenPanel}
    />
  );
}

/**
 * Stand-ins for the agency's own history: its buckets, in nav order, minus
 * anything pinned.
 *
 * The same shape as the sub-account's stand-in and for the same reason — there
 * is no visit log behind this prototype, and a Recent block that named the same
 * three rows for every agency would be worse than one derived from the tree in
 * front of you.
 */
export function agencyRecentPlaceIds(
  order: readonly string[],
  pinned: readonly string[],
): string[] {
  return order.filter((id) => !pinned.includes(id));
}

/**
 * How the budget is split between the two runs.
 *
 * Pins win, up to their cap — a user who curated pins has already told you what
 * they reach for, which is the same argument the adaptive mode makes. But the
 * floor wins over the cap: a block whose recents have been squeezed to nothing
 * is not Recents, it is a pinned bar wearing a history label. Whichever run runs
 * out first hands its unspent rows to the other, so the block is never short of
 * its budget while there are rows left to draw.
 */
export function allocate({
  pinCount,
  recentCount,
  budget,
  pinCap,
  recentFloor,
}: {
  pinCount: number;
  recentCount: number;
  budget: number;
  pinCap: number;
  recentFloor: number;
}): { pinsShown: number; recentsShown: number } {
  const floor = Math.min(recentFloor, recentCount);
  let pinsShown = Math.min(pinCount, pinCap, Math.max(0, budget - floor));
  const recentsShown = Math.min(recentCount, Math.max(0, budget - pinsShown));
  if (pinsShown + recentsShown < budget) {
    pinsShown = Math.min(pinCount, pinCap, budget - recentsShown);
  }
  return { pinsShown, recentsShown };
}

/**
 * One row of the merged list.
 *
 * Geometry follows the compact nav row — 6px/8px padding, 16px leading icon,
 * 7px radius — with two additions the plain row has no notion of: a 12px trail
 * under the name, and a trailing pin. The pin is the gesture the whole
 * arrangement exists for, so it is on every row, not only the pinned ones: this
 * is where you pin from now that the capsule is gone.
 */
/*
 * No selected state, at all, on any row of this block.
 *
 * Every row here is a shortcut — a pin you kept or a page you were on — and a
 * shortcut is not where its destination LIVES. The tree is, and the tree marks
 * it: row, trail and all. Filling the shortcut too meant one page was marked
 * twice in two places, and the copy at the top of the nav was the one with
 * nothing beneath it to say where you were.
 *
 * So this block reroutes and nothing more. Hover, the pin, and that is the
 * whole vocabulary.
 */
function MergedItemRow({
  row,
  index,
  mark,
  onSelect,
  pinEdit,
}: {
  row: MergedRow;
  /** Its slot in the pinned run, when it is in the pinned run. */
  index?: number;
  mark: "glyph" | "sublabel" | "none";
  onSelect: () => void;
  /** Editing affordances. Pinned rows in edit mode, and nothing else. */
  pinEdit?: PinRowEdit;
}) {
  const Icon = row.icon;
  const pinnedInk = usePinnedInk();
  const { announce } = usePinFeedback();
  const shortcuts = usePinShortcuts();
  // Empty for every treatment that does not animate the destination.
  const landed = usePinLanded(row.id);
  const combo = shortcuts.comboFor(row.id);
  return (
    <div
      data-pin-row=""
      // `group/row` rather than a bare group: PinButton's hover variant names
      // this row specifically, and an unnamed group would also match any
      // hovered ancestor.
      {...(pinEdit
        ? {
            onDragOver: pinEdit.drag.onDragOver,
            onDrop: pinEdit.drag.onDrop,
          }
        : {})}
      className={cn(
        "group/row motion-tap relative flex w-full shrink-0 items-center",
        "gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)]",
        "px-[var(--t-nav-px,8px)] py-[calc(var(--t-nav-py,9px)*0.667)]",
        pinEdit?.drag.dragging ? "opacity-40" : "hover:bg-nav-hover",
        landed,
      )}
    >
      {/*
        The six-dot grip, always up in edit mode rather than on hover.

        A handle you have to hover to discover is a handle nobody finds, and
        in a mode whose whole point is rearranging every row is draggable —
        so every row says so. Same element, same animation and same
        `-ml-[5px]` as the L1 rows', which is what slides the glyph and the
        label over instead of snapping them.
      */}
      {pinEdit ? (
        <span
          data-drag-handle=""
          draggable
          role="button"
          tabIndex={-1}
          aria-label={`Reorder ${row.label}`}
          title="Drag to reorder"
          onDragStart={pinEdit.drag.onDragStart}
          onDragEnd={pinEdit.drag.onDragEnd}
          onClick={(e) => e.stopPropagation()}
          className="motion-grip-in -ml-[5px] flex size-[16px] shrink-0 cursor-grab items-center justify-center overflow-hidden rounded-[4px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:cursor-grabbing"
        >
          <GripVertical size={13} aria-hidden="true" />
        </span>
      ) : null}
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-[var(--t-nav-gap,10px)] text-left"
      >
        {/*
          The glyph, and in edit mode the glyph IS the picker — pressed, not
          accompanied by a button that does the pressing. An L1 row works
          this way; see IconTrigger, whose dashed outline on row-hover is the
          same hint repeated here so the two read as one control.
        */}
        {row.avatar ??
          (Icon ? (
            pinEdit?.onPickIcon ? (
              <span
                role="button"
                tabIndex={0}
                aria-label="Change icon"
                title="Change icon"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  pinEdit.onPickIcon?.(e.currentTarget);
                }}
                className="motion-tap -m-[3px] flex shrink-0 cursor-pointer items-center justify-center rounded-[5px] p-[3px] outline-[1px] outline-offset-0 outline-transparent group-hover/row:outline-dashed group-hover/row:outline-[var(--nav-divider)] hover:bg-nav-hover"
              >
                <ComposedIcon
                  icon={Icon}
                  {...(row.badge ? { badge: row.badge } : {})}
                  size={16}
                  className="text-nav-fg-muted"
                />
              </span>
            ) : (
              <ComposedIcon
                icon={Icon}
                {...(row.badge ? { badge: row.badge } : {})}
                size={16}
                className="text-nav-fg-muted"
              />
            )
          ) : null)}
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[length:var(--t-nav-font,14px)] leading-[18px] text-nav-fg">
            {row.label}
          </span>
          {row.detail ? (
            <span className="truncate text-[11px] leading-[15px] text-nav-fg-subtle">
              {row.detail}
            </span>
          ) : null}
        </span>
      </button>

      {/*
        The keycap, on hover and nowhere else — see PINNED_SHORTCUTS_DEFAULT.

        Before the pin rather than after it, so the pin keeps the edge it
        holds on every row in the list: a column that moves depending on
        whether a row has a shortcut is a column you cannot aim at.

        In edit mode it is live and the hover gate comes off: an affordance
        you can only reach by hovering the thing you are about to change is
        fine for a read-out and wrong for a control.
      */}
      {combo ? (
        <span
          className={cn(
            "flex shrink-0 items-center",
            pinEdit
              ? null
              : "opacity-0 group-hover/row:opacity-100 focus-within:opacity-100",
          )}
        >
          <ShortcutChip
            combo={combo}
            {...(pinEdit
              ? {
                  editable: true,
                  onBind: (next: string) => shortcuts.bind(row.id, next),
                  onClear: () => shortcuts.clear(row.id),
                }
              : {})}
          />
        </span>
      ) : null}

      {row.onTogglePin ? (
        <MaybeCapHint blocked={row.pinBlocked ?? false}>
          <button
            type="button"
            // Live, not disabled — the hover is where the refusal explains
            // itself. See PinButton for the whole of that reasoning.
            aria-disabled={row.pinBlocked ?? false}
            title={row.pinned ? "Unpin" : row.pinBlocked ? PIN_CAP_HINT : "Pin"}
            aria-label={row.pinned ? "Unpin" : "Pin"}
            aria-pressed={row.pinned}
            /*
            Announce, THEN toggle — the same order PinButton uses, and for
            the same two reasons: the source has to be measured while this
            button is still where it was, and the treatments that hold a
            leaving row need to be told before the store takes it away.

            This was the bug behind "the exit animation stopped working".
            Every other pin control in the nav goes through PinButton, which
            announces; this block draws its own because its pin is grey
            rather than brand and sits at 12px instead of 14. The styling
            diverged and the behaviour came with it — so pinning from a
            flyout animated in, and unpinning from the list it landed in did
            nothing at all, because the only control that can perform that
            unpin was the one control that never said it had happened.
          */
            onClick={
              row.pinBlocked
                ? undefined
                : (e) => {
                    e.stopPropagation();
                    announce(
                      row.id,
                      e.currentTarget,
                      row.pinned ? "unpin" : "pin",
                      // Read here, because here is the last moment it is true.
                      row.pinned ? { index: index ?? 0, row } : undefined,
                    );
                    row.onTogglePin?.();
                  }
            }
            className={cn(
              "motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px]",
              "hover:bg-nav-hover active:scale-90 motion-press",
              /*
              Grey, not brand — and only in this block.
              
              Everywhere else the pin is the brand colour because it is the
              gesture that surface exists for. Here it is on every row of a list
              you read top to bottom, so five brand-coloured pins down the right
              edge became the loudest thing in the nav and pulled the eye off the
              names. Ink at gray-500 still says "kept" without competing.
            */
              row.pinned
                ? cn(pinnedInk, "opacity-100")
                : "text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 hover:text-nav-fg focus-visible:opacity-100",
              // "Nothing" means nothing: the pin is still reachable, but a pinned
              // row may not advertise itself, or the mode would be marking pins
              // after all.
              mark === "none" &&
                "text-nav-fg-subtle opacity-0 group-hover/row:opacity-100",
              row.pinBlocked &&
                "cursor-not-allowed opacity-0 group-hover/row:opacity-30 hover:bg-transparent hover:text-nav-fg-subtle",
            )}
          >
            <Pin
              // 12, not 14: it sits beside a 16px leading glyph, and a trailing
              // mark that matches the icon it trails reads as a second icon.
              size={12}
              fill={row.pinned && mark !== "none" ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
        </MaybeCapHint>
      ) : (
        // A row nobody can pin still gives up the column, so every label in the
        // list truncates at the same place.
        <span aria-hidden="true" className="size-[22px] shrink-0" />
      )}

      {/*
        One kebab, and it holds the row's trailing edge.

        AFTER the pin, which is the one control that is not an edit: unpinning
        is a thing you do to a row in either mode, so it keeps the column it
        holds on every row of this list. The kebab is the mode's own
        affordance and arrives beside it, at the very end — the same order an
        L1 row uses.

        The five glyphs this used to draw crowded a 272px row so badly that
        "Conversations" truncated to "C." — the controls were literally louder
        than the names they belonged to. Everything they did now lives in the
        menu, which is where an L1 row has always kept its verbs.
      */}
      {pinEdit ? (
        <EditAffordance
          label={`Edit ${row.label}`}
          onClick={pinEdit.onOpenMenu}
          pinned
        >
          <EllipsisVertical size={13} aria-hidden="true" />
        </EditAffordance>
      ) : null}
    </div>
  );
}

/**
 * The refusal's explanation, and only when there is one to give.
 *
 * Wrapping every pin would put a tooltip on a control whose glyph already says
 * what it does; wrapping only the blocked ones means the pill appears exactly
 * where the click would have failed.
 */
function MaybeCapHint({
  blocked,
  children,
}: {
  blocked: boolean;
  children: React.ReactNode;
}) {
  if (!blocked) return <>{children}</>;
  // Below, not beside: a pill to the right of a pin at the nav's own right edge
  // lands off the surface it belongs to.
  return (
    <RailTooltip label={PIN_CAP_HINT} placement="below">
      {children}
    </RailTooltip>
  );
}

/** The tail of the block: grow it, shrink it, or leave for the full panel. */
function MergedOverflowRow({
  mode,
  hasMore,
  expanded,
  onExpand,
  onCollapse,
  onOpenPanel,
}: {
  mode: "expand" | "flyout" | "cap";
  hasMore: boolean;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onOpenPanel: () => void;
}) {
  if (mode === "cap") return null;

  if (mode === "flyout") {
    return <TailRow label="More" icon={ChevronRight} onClick={onOpenPanel} />;
  }

  if (expanded) {
    return <TailRow label="Show less" icon={ChevronUp} onClick={onCollapse} />;
  }

  /*
   * "Show more", not "Show 80 more".
   *
   * The count was true and useless: expanding does not show 80, it shows the
   * expanded budget and leaves the rest to the panel — so the number named a
   * quantity the button does not deliver. Whether there is anything left at all
   * is the only part of it the reader can act on.
   */
  if (!hasMore) return null;
  return <TailRow label="Show more" icon={ChevronDown} onClick={onExpand} />;
}

function TailRow({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "motion-tap group flex w-full shrink-0 items-center justify-between",
        "rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)]",
        "py-[calc(var(--t-nav-py,9px)*0.667)] text-left hover:bg-nav-hover",
      )}
    >
      <span className="truncate text-[13px] leading-[18px] text-nav-fg-subtle group-hover:text-nav-fg-muted">
        {label}
      </span>
      <Icon
        size={15}
        aria-hidden="true"
        className="shrink-0 text-nav-fg-subtle group-hover:text-nav-fg-muted"
      />
    </button>
  );
}
