"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MERGED_HEADING_LABELS } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { childById, productById } from "./catalogue";
import type { NavLayoutState } from "./grouping";
import { useNavLayout } from "./nav-layout-provider";
import { PinButton } from "./pin-button";

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
interface MergedRow {
  id: string;
  label: string;
  icon: LucideIcon | undefined;
  /** The trail under the name. Empty when the row is a top-level product. */
  detail: string;
  pinned: boolean;
}

export function MergedRecentsBlock({
  selectedId,
  onSelect,
  onOpenPanel,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Opens the full Recent panel — the day-grouped history. */
  onOpenPanel: () => void;
}) {
  const { state, groups, productLabelFor, productIconFor } = useNavLayout();
  const {
    mergedPinMark,
    mergedOverflow,
    mergedRowDetail,
    mergedPinOrder,
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
      return {
        id,
        label: productLabelFor(id),
        icon: productIconFor(id),
        detail: detailFor(id),
        pinned,
      };
    },
    [productLabelFor, productIconFor, detailFor],
  );

  const pins = React.useMemo(() => {
    const ordered =
      mergedPinOrder === "newest"
        ? // `pin()` appends, so the stored tail is the newest pin. Reversing puts
          // the row you just pinned directly under the heading — the merge's
          // replacement for the capsule's "it flew over there" feedback.
          [...state.pinned].reverse()
        : state.pinned;
    return ordered
      .map((id) => resolve(id, true))
      .filter((row): row is MergedRow => row !== null);
  }, [state.pinned, mergedPinOrder, resolve]);

  const recents = React.useMemo(
    () =>
      recentIdsFor(state)
        .map((id) => resolve(id, false))
        .filter((row): row is MergedRow => row !== null),
    [state, resolve],
  );

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

  const row = (r: MergedRow) => (
    <MergedItemRow
      key={r.id}
      row={r}
      active={selectedId === r.id}
      mark={mergedPinMark}
      onSelect={() => onSelect(r.id)}
    />
  );

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
    <div className="flex w-full shrink-0 flex-col gap-[var(--t-nav-space,2px)]">
      {sublabelled ? null : (
        <BlockHeading
          text={MERGED_HEADING_LABELS[mergedHeading]}
          action={viewAll}
        />
      )}

      {sublabelled && visiblePins.length > 0 ? (
        <BlockHeading text="Pinned" action={viewAll} />
      ) : null}
      {visiblePins.map(row)}

      {sublabelled && visibleRecents.length > 0 ? (
        <BlockHeading
          text="Recent"
          {...(visiblePins.length === 0 ? { action: viewAll } : {})}
        />
      ) : null}
      {visibleRecents.map(row)}

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
          <span className="text-[11px] leading-[13px] whitespace-nowrap">
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
 * How the budget is split between the two runs.
 *
 * Pins win, up to their cap — a user who curated pins has already told you what
 * they reach for, which is the same argument the adaptive mode makes. But the
 * floor wins over the cap: a block whose recents have been squeezed to nothing
 * is not Recents, it is a pinned bar wearing a history label. Whichever run runs
 * out first hands its unspent rows to the other, so the block is never short of
 * its budget while there are rows left to draw.
 */
function allocate({
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
function MergedItemRow({
  row,
  active,
  mark,
  onSelect,
}: {
  row: MergedRow;
  active: boolean;
  mark: "glyph" | "sublabel" | "none";
  onSelect: () => void;
}) {
  const Icon = row.icon;
  return (
    <div
      // `group/row` rather than a bare group: PinButton's hover variant names
      // this row specifically, and an unnamed group would also match any
      // hovered ancestor.
      className={cn(
        "group/row motion-tap relative flex w-full shrink-0 items-center",
        "gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)]",
        "px-[var(--t-nav-px,8px)] py-[calc(var(--t-nav-py,9px)*0.667)]",
        active ? "bg-nav-hover" : "hover:bg-nav-hover",
      )}
    >
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-[var(--t-nav-gap,10px)] text-left"
      >
        {Icon ? (
          <Icon
            size={16}
            aria-hidden="true"
            className={cn(
              "shrink-0",
              active ? "text-nav-fg" : "text-nav-fg-muted",
            )}
          />
        ) : null}
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
      <PinButton
        productId={row.id}
        className={cn(
          // "Nothing" means nothing: the pin is still reachable, but a pinned row
          // may not advertise itself, or the mode would be marking pins after all.
          mark === "none" &&
            "text-nav-fg-subtle opacity-0 group-hover/row:opacity-100",
        )}
      />
    </div>
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
