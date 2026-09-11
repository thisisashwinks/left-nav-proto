"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Pin,
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
import { RailTooltip } from "./rail-tooltip";

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
 * The merged list itself, given rows that someone else resolved.
 *
 * Split from the two derivations below because the arrangement is the same in
 * both scopes and the vocabulary is not: a sub-account merges products with
 * products, the agency merges areas with areas or with whole clients. Every
 * axis, every count and every pixel of this is shared; only what goes in it
 * differs, which is exactly the seam.
 */
function MergedList({
  pins,
  recents,
  selectedId,
  onSelect,
  onOpenPanel,
}: {
  pins: MergedRow[];
  recents: MergedRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Opens the panel behind "View all" — the full pin list and history. */
  onOpenPanel: () => void;
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
   * Only a pin can be the page you are on; a recent is a way back to one.
   *
   * Recents are a redirect list. The row is not where that destination LIVES —
   * the tree is, and the tree marks it, trail and all — so filling the recent
   * as well meant one page was marked twice in two different places, and the
   * copy at the top of the nav was the one that had nothing beneath it to
   * explain where you were. Clicking a recent takes you somewhere; it does not
   * make the recent itself somewhere you are.
   */
  const row = (r: MergedRow, kind: "pin" | "recent") => (
    <MergedItemRow
      key={r.id}
      row={r}
      active={kind === "pin" && selectedId === r.id}
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
      {visiblePins.map((r) => row(r, "pin"))}

      {sublabelled && visibleRecents.length > 0 ? (
        <BlockHeading
          text="Recent"
          {...(visiblePins.length === 0 ? { action: viewAll } : {})}
        />
      ) : null}
      {visibleRecents.map((r) => row(r, "recent"))}

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
  selectedId,
  onSelect,
  onOpenPanel,
}: {
  selectedId: string | null;
  onSelect: (id: string) => void;
  onOpenPanel: () => void;
}) {
  const { state, groups, productLabelFor, togglePin, pinsFull } =
    useNavLayout();
  const { mergedRowDetail, mergedPinOrder } = useTheme().effective;

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

  return (
    <MergedList
      pins={pins}
      recents={recents}
      selectedId={selectedId}
      onSelect={onSelect}
      onOpenPanel={onOpenPanel}
    />
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
  selectedId,
  onSelect,
  onOpenPanel,
  accounts,
  onSwitchAccount,
}: {
  selectedId: string | null;
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
      selectedId={selectedId}
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
  const pinnedInk = usePinnedInk();
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
        {row.avatar ??
          (Icon ? (
            <ComposedIcon
              icon={Icon}
              {...(row.badge ? { badge: row.badge } : {})}
              size={16}
              className={active ? "text-nav-fg" : "text-nav-fg-muted"}
            />
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
      {row.onTogglePin ? (
        <MaybeCapHint blocked={row.pinBlocked ?? false}>
        <button
          type="button"
          // Live, not disabled — the hover is where the refusal explains
          // itself. See PinButton for the whole of that reasoning.
          aria-disabled={row.pinBlocked ?? false}
          title={
            row.pinned ? "Unpin" : row.pinBlocked ? PIN_CAP_HINT : "Pin"
          }
          aria-label={row.pinned ? "Unpin" : "Pin"}
          aria-pressed={row.pinned}
          onClick={row.pinBlocked ? undefined : row.onTogglePin}
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
