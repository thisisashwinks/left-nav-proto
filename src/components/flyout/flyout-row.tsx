"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { EditAffordance, InlineRename } from "@/components/nav/inline-rename";
import { isPinnable, WithPin } from "@/components/nav/with-pin";
import {
  HereBar,
  useHere,
  useHereStyle,
  useMarking,
} from "@/components/nav/here";
import { productById } from "@/components/nav/catalogue";
import { isChromePlace } from "@/components/nav/chrome-places";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useTruncationTitle } from "@/lib/use-truncation-title";
import type {
  FlyoutBadgeTone,
  FlyoutChildItem,
  FlyoutItem,
  FlyoutItemVariant,
} from "./types";

/** Same gradient angle and stops in both tones; only the ramp differs. */
const BADGE_TONE: Record<FlyoutBadgeTone, string> = {
  new: "bg-[linear-gradient(-53.271deg,var(--fly-badge-from)_20.741%,var(--fly-badge-to)_61.206%)] text-fly-badge-fg",
  beta: "bg-[linear-gradient(-53.271deg,var(--fly-badge-beta-from)_20.741%,var(--fly-badge-beta-to)_61.206%)] text-fly-badge-beta-fg",
};

/*
 * A row that lists a place, in the nav's own measurements.
 *
 * Same gap, same padding, same radius, same weight — read from the SAME tokens
 * the nav rows read, not from numbers that happen to match today. The two
 * levels are one list seen at two depths, and the panel is already framed as a
 * panel: it has its own surface, its own title and its own edge, so the rows
 * inside it have nothing left to prove by looking different.
 *
 * `items-center`: with the blurb off there is no second line to top-align to.
 */
const PLACE_ROW =
  "gap-[var(--t-nav-gap,10px)] px-[var(--t-nav-px,8px)] py-[var(--t-nav-py,9px)] items-center " +
  /*
   * The row's height is its own, not its contents'.
   *
   * Same padding as a nav row was not the same height as one: a 14px label's
   * line box is 17px, so 9 + 17 + 9 came to 35 against L1's 38. The nav pins
   * its content box to 20px — the height of the trailing affordance — so that
   * a row is the same height with a pencil in it, with a rename field in it,
   * and with neither. This row carries a 22px pin and had nothing holding the
   * floor, so it sat three pixels short of the list it is a continuation of.
   *
   * The same expression, not the number it currently evaluates to, so the
   * density knob moves all three levels together.
   */
  "min-h-[calc(var(--t-nav-py,9px)*2+20px)]";

/** The nav's label: regular weight, and it truncates rather than overflowing. */
const PLACE_TITLE = "font-normal whitespace-nowrap";

/**
 * Handed down when the L3 rows live in a dropdown beside the panel rather than
 * inline beneath their parent — see L3_DISCLOSURES.
 *
 * The rows themselves are unchanged: a disclosure still discloses, it just
 * reports upward instead of expanding in place. Which level a list is at
 * travels with it, because a cascade replaces everything BELOW the level you
 * opened from and needs to know where that is.
 */
export interface FlyoutCascadeApi {
  /** Open this row's children as the next level, anchored to its element. */
  open: (
    id: string,
    label: string,
    nodes: readonly FlyoutChildItem[],
    el: HTMLElement,
    level: number,
  ) => void;
  /**
   * Swap a level that is already open, on rollover. Absent unless the trigger
   * is sticky — see FLYOUT_TRIGGERS.
   */
  hover?: (
    id: string,
    label: string,
    nodes: readonly FlyoutChildItem[],
    el: HTMLElement,
    level: number,
  ) => void;
  /** The row id open at each level, so a parent can show itself as expanded. */
  openIds: readonly string[];
  /** Which level the list being rendered sits at. L2's own children are 0. */
  level: number;
}

/**
 * The row's own trailing padding, and nothing more.
 *
 * It used to reserve the pin's width on top of this, which was right while the
 * pin was the only trailing mark and there was nothing in flow holding its
 * column open. Both changed: the cluster below carries a spacer of the pin's
 * width, so reserving it again spent 22px twice and left every L2 label
 * stopping a good 40px short of an edge whose marks sit 8px in. The panel read
 * as having a wider right margin than left, because it did.
 */
const PLACE_PIN_RESERVE = "pr-[var(--t-nav-px,8px)]";

/**
 * The trailing marks, and the one arithmetic they share.
 *
 * The chevron is the LAST thing on a row that has one and the pin sits just
 * inboard of it, so the pin lands on the same line whether a row discloses or
 * not. The pin cannot be a flex child — it is a control and the row is a
 * button — so it is an overlay hung at `PIN_INSET` while a spacer of its width
 * holds the column open in flow. The numbers have to agree, which is why they
 * are here rather than inline at either site.
 */
const CHEVRON_SLOT = 14;
const PIN_SLOT = 22;
const TRAILING_GAP = 10;
const ROW_EDGE = 8;
const PIN_INSET = ROW_EDGE + CHEVRON_SLOT + TRAILING_GAP;

/**
 * What the panel's header has to pad by to line up with its rows.
 *
 * Exported because the header is the one part of a panel that is NOT a row, and
 * it has to agree with them anyway: the title sits over the icon column and the
 * close button over the chevron. Derived from the row's own numbers so the two
 * cannot drift — the alternative is a pair of literals in another file that are
 * correct until somebody retunes a gap.
 *
 * Written out as literal class strings rather than composed from the constants
 * above: Tailwind reads the SOURCE for class names, so a name built by a
 * template at runtime is one it never sees — the utility is never generated and
 * the padding silently does nothing. 14px is the scroll region's own inset,
 * which the rows sit inside.
 */

/** Title left edge = the panel's inset plus the row's own = the icon's edge. */
export const PANEL_HEADER_PL = "pl-[calc(14px+var(--t-nav-px,8px))]";

/**
 * Close button right edge = the row's right edge, and the same 22px line the
 * chevron ends on.
 *
 * It briefly carried a -4px correction, to centre a 15px glyph in a 22px target
 * on a 14px chevron's centre. That arithmetic is right and the approach is
 * wrong: it holds only while both glyphs stay their current sizes, and it reads
 * as a fudge because it is one. The close button pushes its glyph to the END of
 * its box instead — see the header — so both marks are flush against one line
 * and the alignment survives either glyph changing size.
 */
export const PANEL_HEADER_PR = "pr-[calc(14px+var(--t-nav-px,8px))]";

/**
 * Per-variant geometry, read off the Pencil export.
 *
 * Three of the four are place lists now — a category's panel, Pinned, Recent —
 * and they share one row with the nav. Quick Actions keeps its own: its rows
 * are commands rather than destinations, and a row that reads exactly like a
 * nav row is read as somewhere you can go.
 */
const VARIANT = {
  product: {
    row: PLACE_ROW,
    /*
     * The glyph's own size, both ways — no stage around it.
     *
     * The 24px stage dated from 20px icons of differing widths, and it bought
     * label alignment across rows. Every glyph now renders at exactly
     * `--t-fly-icon`, so it bought nothing and cost the panel its symmetry:
     * the icon sat 4px further in than the chevron sat from the other edge, so
     * the left margin read as smaller and the right as "quite large". A row's
     * icon box is the icon, which is what a nav row has always done.
     */
    iconBox: "w-[var(--t-fly-icon,16px)] h-[var(--t-fly-icon,16px)]",
    iconSize: 20,
    text: "gap-[2px]",
    title: PLACE_TITLE,
    desc: "text-[length:var(--t-fly-desc,12.5px)] leading-[17px] w-full",
    // Space held for the pin, which is no longer a flex child. Exactly the pin's
    // 22px plus the gap it used to sit behind, so the text wraps where it did.
    pinReserve: PLACE_PIN_RESERVE,
    pinTop: "top-1/2 -translate-y-1/2",
  },
  compact: {
    row: PLACE_ROW,
    iconBox: "w-[var(--t-fly-icon,16px)] h-[var(--t-fly-icon,16px)]",
    iconSize: 19,
    text: "gap-[1px]",
    title: PLACE_TITLE,
    desc: "text-[length:var(--t-fly-desc,12.5px)] leading-[normal] whitespace-nowrap",
    pinReserve: PLACE_PIN_RESERVE,
    pinTop: "top-1/2 -translate-y-1/2",
  },
  recent: {
    row: PLACE_ROW,
    iconBox: "w-[var(--t-fly-icon,16px)] h-[var(--t-fly-icon,16px)]",
    iconSize: 19,
    text: "gap-[1px]",
    title: PLACE_TITLE,
    desc: "text-[12px] leading-[normal] whitespace-nowrap",
    pinReserve: PLACE_PIN_RESERVE,
    pinTop: "top-1/2 -translate-y-1/2",
  },
  action: {
    /*
      Its own treatment, the shared height.

      Quick Actions keeps a semibold title and a wider icon box because its
      rows are commands rather than destinations — but that argument is about
      what a row SAYS, not how tall it is, and a command list three pixels
      shorter than every other list in the panel just looked misaligned.
    */
    row:
      "gap-[var(--t-fly-gap,10px)] px-[8px] py-[var(--t-fly-py,9px)] items-center " +
      "min-h-[calc(var(--t-nav-py,9px)*2+20px)]",
    iconBox: "w-[24px] h-[22px]",
    iconSize: 20,
    text: "gap-[2px]",
    title: "font-semibold whitespace-nowrap",
    desc: "text-[length:var(--t-fly-desc,12.5px)] leading-[17px] w-full",
    pinReserve: "pr-[calc(8px+22px+var(--t-fly-gap,10px))]",
    pinTop: "top-1/2 -translate-y-1/2",
  },
} as const satisfies Record<FlyoutItemVariant, unknown>;

/**
 * Whether an L2 row shows its one-line blurb under the title.
 *
 * Off (Aug 27): the descriptions were doing the work of a first visit on every
 * visit — two lines of explanation under a row whose name already says what it
 * is, on a surface people open dozens of times a day. Titles alone halve the
 * panel's height and let a category's shape be read in one glance.
 *
 * The `product` variant only, which is the L2 list in the screenshot — the
 * category panels and the agency's buckets. Recent is deliberately untouched:
 * its second line is the row's KIND ("Jatin — Contact", "Q3 Enterprise Pipeline
 * — Opportunities"), which is the only thing telling those names apart, not a
 * blurb explaining a product people already know.
 *
 * A constant rather than a deletion: the copy is still authored on every entry
 * in the catalogue and the agency config, and flipping this back is the whole
 * of bringing it back.
 */
const SHOW_ROW_DESCRIPTIONS = false;

/**
 * What editing this row offers, when the nav is in edit mode and this panel
 * belongs to a category.
 *
 * The panel owns it rather than the row: which row is being renamed is one
 * decision for the whole list, and the drag needs to know a row's position
 * among its siblings, which only the list knows.
 */
export interface FlyoutRowEdit {
  /*
   * Everything but the drag is optional.
   *
   * The agency tree's panels reorder and nothing else: their rows are platform
   * IA, with no override map to write a rename into and no kebab's worth of
   * verbs behind them. Rendering a pencil and an eye that did nothing would be
   * a worse answer than not rendering them, so each affordance appears only
   * when its handler does.
   */
  renaming?: boolean;
  onStartRename?: () => void;
  onCommitRename?: (next: string) => void;
  onCancelRename?: () => void;
  onOpenMenu?: (trigger: HTMLElement) => void;
  /**
   * What the rename field starts from, when the row is drawn with a qualifier.
   * See NavRowEdit.renameValue — same reason, same rule.
   */
  renameValue?: string;
  /**
   * Clicking the row's own glyph opens the picker.
   *
   * The nav's rows have had this since the picker landed; the panel's had only
   * the kebab, so the obvious gesture — click the icon you want to change —
   * did nothing on exactly the rows most people change.
   */
  onPickIcon?: (trigger: HTMLElement) => void;
  /** Switching the row off, and back on. Hover-only until it is off. */
  onToggleHidden?: () => void;
  hidden?: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  over: boolean;
  lifted: boolean;
}

/**
 * What editing offers on an L3 row — the nested ones inside a panel.
 *
 * Narrower than `FlyoutRowEdit` on purpose. An L3 is a page inside a product,
 * not a row of the account's tree: there is nowhere to move it TO, nothing to
 * remove it from, and no order to nudge it in that the product itself does not
 * own. Its icon is the exception — it is drawn from the row's LABEL when the
 * catalogue gives it none, so it is a guess, and a guess is exactly the kind of
 * thing an admin should be able to correct.
 *
 * Both handlers take the child's id: one bundle serves every row in the
 * dropdown rather than one built per row, which would mean rebuilding the whole
 * tree of callbacks on each render of the panel.
 */
export interface FlyoutChildEdit {
  onPickIcon: (childId: string, trigger: HTMLElement) => void;
  onOpenMenu: (childId: string, trigger: HTMLElement) => void;
}

interface FlyoutRowProps {
  item: FlyoutItem;
  variant: FlyoutItemVariant;
  active?: boolean;
  /** Which row the page behind the panel is on, for the nested dropdown. */
  activeId?: string | null;
  /** Position in the stagger sequence when the panel opens. */
  rowIndex?: number;
  /** Start expanded — set when this row is the panel's only expandable one. */
  defaultOpen?: boolean;
  /**
   * Go to this row's page.
   *
   * `keepOpen` marks a navigation that is a step rather than a destination — a
   * parent opening its first child behind the panel — so the caller knows not to
   * dismiss the list the user is about to pick from.
   */
  onSelect?: (id: string, keepOpen?: boolean) => void;
  edit?: FlyoutRowEdit;
  /** Editing for the rows INSIDE this one. Absent outside the mode. */
  childEdit?: FlyoutChildEdit;
  /** Present when L3 lives in a dropdown beside the panel. */
  cascade?: FlyoutCascadeApi;
}

export function FlyoutRow({
  item,
  variant,
  active = false,
  activeId = null,
  rowIndex = 0,
  defaultOpen = false,
  onSelect,
  edit,
  childEdit,
  cascade,
}: FlyoutRowProps) {
  const v = VARIANT[variant];
  const Icon = item.icon;
  /*
   * An L2 row is the page when the canvas is on it and nothing deeper is open,
   * and on the trail when one of its own L3s is.
   */
  const here = useHere();
  const marking = useMarking(
    here.productId === item.id && here.childId === null,
    here.productId === item.id,
  );
  const mark = useHereStyle(marking);
  /*
   * When the review axis is on, a tabs-parent discloses like any other parent —
   * its tabs become nav rows and pages. Read here rather than threaded through
   * FlyoutPanel and group-flyout, because this is the only place the decision
   * changes anything.
   */
  const { tabsInNav, l2ClickAction } = useTheme();
  /** Only rows that map to a pinnable product get a pin. */
  // A row is pinnable if it names somewhere the dock can send you: a product,
  // or one of the nav's own rows — see chrome-places.
  const pinnable = productById(item.id) !== undefined || isChromePlace(item.id);
  /**
   * The row's own element, for hanging the truncation tooltip on.
   *
   * `rowRef` below is only attached to rows that DISCLOSE — it anchors their
   * cascade — and the rows whose labels get cut are as often leaves. A title on
   * the label alone answers only a pointer sitting on the glyphs, which is not
   * where a reader points.
   */
  const { ref: labelRef, hostRef: rowHostRef } =
    useTruncationTitle<HTMLSpanElement>(item.label);
  const showDesc =
    item.description !== undefined &&
    (variant !== "product" || SHOW_ROW_DESCRIPTIONS);
  /*
   * A row with children is a disclosure, not a link.
   *
   * The whole row is the target: a parent has no page of its own worth landing
   * on, and an 18px chevron is too small a thing to make the only way in. So
   * clicking expands, you pick a child, and clicking the parent again collapses.
   * The chevron beside the label is the state indicator, not the control — which
   * is also why it is `aria-hidden` and the row carries `aria-expanded`.
   *
   * Leaf rows still navigate on click. Reaching a parent product's own page is
   * the breadcrumb's job, and it opens on the parent's first child.
   */
  // A tabs-parent is a destination: its children live on its page, so the row
  // navigates like a leaf rather than opening a nested list of non-places.
  const hasChildren =
    (item.children?.length ?? 0) > 0 && (tabsInNav || !item.tabs);
  const [inlineOpen, setInlineOpen] = React.useState(defaultOpen);
  /*
   * Two sources for one flag.
   *
   * Inline, the row owns whether it is open. Cascading, the PANEL owns it —
   * which row's dropdown is up is a fact about the panel, not about a row, or
   * two rows could both believe they were the open one.
   */
  const open = cascade ? cascade.openIds[0] === item.id : inlineOpen;
  const panelId = React.useId();
  /** The row's own box, for anchoring the dropdown that hangs off it. */
  const rowRef = React.useRef<HTMLDivElement>(null);

  const rowClass = cn(
    "motion-row-in group group/row relative flex w-full shrink-0 text-left",
    // The nav's radius on a place row, its own on an action row.
    variant === "action"
      ? "rounded-[9px]"
      : "rounded-[var(--t-nav-radius,7px)]",
    "motion-tap",
    // v.row carries the per-variant gap, padding and alignment. Losing it
    // is what collapsed every flyout row's breathing room.
    v.row,
    // The product variant tops out its children so the icon lines up with the
    // title rather than with the middle of a two-line row. With the blurb off
    // there is no second line to align against, so it centres like the rest.
    !showDesc && "items-center",
    /*
     * Reserved only for the pin, which is absolute.
     *
     * Edit mode's controls are flex children instead, laid out in the same order
     * and on the same gap as the nav's rows — so the two levels read as one row
     * treatment rather than two. Flex sizes the text against them, which is what
     * makes the reserve unnecessary AND what stops the eye and the chevron from
     * ever colliding, whatever the label's length.
     */
    // The pin's column is a flex spacer in the trailing cluster now, at both
    // levels and in both modes, so the row no longer pads for it.
    
    // The mark wins the ground, and keeps it under the pointer — see the note
    // on the same condition in nav-item-row.
    mark.row ? mark.row : active ? "bg-nav-hover" : "hover:bg-nav-hover",
    !edit?.renaming && "active:scale-[0.99] motion-press",
    // The grab cursor lives on the grip, not the row.
    edit?.over && "bg-nav-hover shadow-[inset_0_0_0_1px_var(--nav-fg)]",
    // Same as the nav's rows: the slot it left reads as a hole, not a ghost.
    edit?.lifted &&
      /*
       * Everything but the handle.
       *
       * `[&>*]:invisible` hid the grip too — and Chrome aborts a drag the instant
       * its source element stops being visible, so the row emptied out and the
       * gesture died in the same frame: dragstart, then dragend, no dragover in
       * between. The handle has to survive its own drag.
       */
      "bg-transparent outline-1 outline-dashed outline-[var(--nav-divider)] [&>*:not([data-drag-handle])]:invisible",
  );
  const rowStyle = { "--row-index": rowIndex } as React.CSSProperties;
  /*
   * A disclosure that also lands you somewhere — on the `open-first` axis.
   *
   * The two behaviours used to be exclusive: a leaf navigated, a parent only
   * expanded — so reaching a page under an L2 was two clicks, and the first of
   * them put you nowhere. On `open-first`, opening a parent also opens its
   * first child behind the panel; on `disclose` it expands and nothing else,
   * which is where this started. See L2_CLICK_ACTIONS. Click away and you are already on that page; pick a
   * different child and you go there instead, which is the click you were going
   * to make anyway.
   *
   * Only on the way OPEN. Collapsing an expanded parent must not navigate: by
   * then you are on one of its children, quite possibly not the first, and
   * dragging you back to the top of the list to close a dropdown would be the
   * panel undoing your last choice.
   *
   * `keepOpen` is what separates this from a leaf click. A leaf is the end of
   * the errand and the panel goes; this is the middle of one, and the list you
   * just opened has to still be there.
   */
  const onRowClick = () => {
    if (!hasChildren) {
      onSelect?.(item.id);
      return;
    }
    if (cascade) {
      // Toggling closed is the panel's job too: it clears the stack by opening
      // nothing, which is what an empty node list means at this level.
      cascade.open(
        open ? "" : item.id,
        item.label,
        open ? [] : (item.children ?? []),
        rowRef.current ?? document.body,
        0,
      );
      if (open || l2ClickAction !== "open-first") return;
      const firstCascade = firstPlaceUnder(item.children, tabsInNav);
      if (firstCascade) onSelect?.(firstCascade, true);
      return;
    }
    if (open) {
      setInlineOpen(false);
      return;
    }
    setInlineOpen(true);
    if (l2ClickAction !== "open-first") return;
    const first = firstPlaceUnder(item.children, tabsInNav);
    if (first) onSelect?.(first, true);
  };

  const iconBox = (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          // The icon leans in a touch on hover — enough to feel responsive
          // without shifting the text beside it. The nav's own factor, so both
          // levels lean by the same amount.
          "motion-tap group-hover:scale-[var(--t-nav-icon-scale,1.143)]",
          v.iconBox,
          active
            ? "text-nav-fg"
            : item.ai
              ? "text-nav-ai-icon"
              : "text-nav-fg-muted group-hover:text-nav-fg",
          // Content only. The eye is the way back, and opacity is multiplicative
          // — a child cannot climb out of a faded parent.
          edit?.hidden && "opacity-40",
        )}
      >
        {item.ai ? (
          <NavAiSparkle />
        ) : Icon ? (
          <Icon
            size={v.iconSize}
            aria-hidden="true"
            style={{
              // 16 is the fallback now, matching a nav row's glyph — the
              // knob's default, restated here for the frame before it lands.
              width: "var(--t-fly-icon, 16px)",
              height: "var(--t-fly-icon, 16px)",
            }}
          />
        ) : null}
      </div>
  );

  const inner = (
    <>
      {edit?.onPickIcon ? (
        /*
         * A button around the glyph, not a handler on the row.
         *
         * The row already owns a click — it navigates — so the icon has to stop
         * propagation or changing an icon would also leave the panel. Rendered
         * only in edit mode: outside it the icon is decoration and a focus stop
         * on every one of them is noise for keyboard users.
         */
        <span
          role="button"
          tabIndex={0}
          aria-label={`Change the ${item.label} icon`}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            edit.onPickIcon?.(e.currentTarget as HTMLElement);
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter" && e.key !== " ") return;
            e.stopPropagation();
            e.preventDefault();
            edit.onPickIcon?.(e.currentTarget as HTMLElement);
          }}
          className="motion-tap -m-[3px] cursor-pointer rounded-[6px] p-[3px] hover:bg-nav-active"
        >
          {iconBox}
        </span>
      ) : (
        iconBox
      )}

      {/*
        `min-w-0`, or a long label does not truncate — it overflows.

        A flex item's floor is its content width unless it is told otherwise, so
        "Get desktop app (macOS & Windows)" plus a badge simply ran past the
        row's trailing column and under the pin sitting there. The column is
        reserved in flow; what was missing was permission for the text to give
        ground to it.
      */}
      <div className={cn("flex h-fit min-w-0 flex-1 flex-col items-start", v.text)}>
        <div className="flex w-full min-w-0 shrink-0 items-center gap-[7px]">
          {edit?.renaming ? (
            <InlineRename
              value={edit.renameValue ?? item.label}
              onCommit={edit.onCommitRename ?? (() => {})}
              onCancel={edit.onCancelRename ?? (() => {})}
              ariaLabel={`Rename ${item.label}`}
              className={cn(
                "text-[length:var(--t-fly-title,14px)] leading-[normal]",
                v.title,
              )}
            />
          ) : (
            <span
              /*
                The full name on hover, but only once the row has cut it — see
                useTruncationTitle. The ellipsis is a promise that the rest
                exists; this is where it exists.
              */
              ref={labelRef}
              className={cn(
                "min-w-0 truncate text-[length:var(--t-fly-title,14px)] leading-[normal] text-nav-fg",
                v.title,
                mark.ink,
                // Faded, not struck through — a strike reads as deleted, and a
                // hidden row is only switched off. The pinned eye-off says which.
                edit?.hidden && "opacity-40",
                // In edit mode the text is the rename target, same as in the
                // nav. The row itself keeps its own job — expanding, or opening
                // the page — so the two gestures stay separate targets.
                edit?.onStartRename &&
                  "-mx-[3px] rounded-[4px] px-[3px] hover:bg-nav-active",
              )}
              {...(edit?.onStartRename
                ? {
                    role: "button",
                    tabIndex: 0,
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      edit.onStartRename?.();
                    },
                  }
                : {})}
            >
              {item.label}
            </span>
          )}
          {item.badge ? (
            <span
              className={cn(
                "shrink-0 rounded-[2px] px-[4px] py-[2px] text-[10px] leading-[normal] font-semibold whitespace-nowrap shadow-[0_2px_4px_0_#00000014]",
                BADGE_TONE[item.badge.tone],
              )}
            >
              {item.badge.label}
            </span>
          ) : null}
        </div>

        {showDesc && item.description ? (
          <span
            className={cn(
              "text-left text-nav-fg-subtle font-normal",
              v.desc,
              edit?.hidden && "opacity-40",
            )}
          >
            {item.description}
          </span>
        ) : null}
      </div>

      {item.time ? (
        <span className="shrink-0 text-[12px] leading-[normal] whitespace-nowrap text-nav-fg-subtle">
          {item.time}
        </span>
      ) : null}

      {/*
        State indicator at the row's far edge (Aug 13 ask — inline by the label
        read as part of the name). Top-aligned on the title's own line, and it
        sits just inside the pin's reserved column.
      */}
      {/*
        One trailing cluster, in one order, at both levels: eye, then kebab, then
        the disclosure chevron flush against the row's edge.
        
        It used to be two different rows wearing the same name — the nav spaced
        its three controls 10px apart in flow while the flyout crammed an
        absolutely-positioned pair 2px apart and dropped the chevron entirely to
        stop them colliding. Same order and the same gap in flow fixes the
        collision by construction rather than by removing the thing that
        collided.
      */}
      <span
        className={cn(
          "ml-auto flex shrink-0 items-center gap-[var(--t-fly-gap,10px)]",
          // items-start variants align the cluster to the title's line, not the
          // middle of a two-line row. A row with no blurb has only the one line,
          // so the cluster sits on the row's own middle.
          variant === "product" && showDesc
            ? "mt-[2px] self-start"
            : "self-center",
        )}
      >
        {edit && !edit.renaming ? (
          <>
            {edit.onToggleHidden ? (
              <EditAffordance
                label={edit.hidden ? `Show ${item.label}` : `Hide ${item.label}`}
                onClick={edit.onToggleHidden}
                // Pinned once hidden: the only way back has to be visible.
                pinned={edit.hidden ?? false}
              >
                {edit.hidden ? (
                  <EyeOff size={12} aria-hidden="true" />
                ) : (
                  <Eye size={12} aria-hidden="true" />
                )}
              </EditAffordance>
            ) : null}
            {edit.onOpenMenu ? (
              <EditAffordance
                label={`Edit ${item.label}`}
                onClick={edit.onOpenMenu}
                pinned
              >
                <EllipsisVertical size={13} aria-hidden="true" />
              </EditAffordance>
            ) : null}
          </>
        ) : null}
        {/*
          The pin's column, held open in flow.
          
          The pin itself is an overlay — it is a control and the row is a button
          — so nothing here but the width it needs. Editing hides the pin, and
          the kebab has already taken its place in the cluster above.
        */}
        {pinnable && !edit ? (
          <span
            aria-hidden="true"
            style={{ width: PIN_SLOT }}
            className="shrink-0"
          />
        ) : null}
        {hasChildren ? (
          /*
            The chevron points where the panel will appear.
            
            Down, then flipped up when open, is the accordion's own grammar: it
            describes a list growing downward and closing again. A dropdown
            opens to the RIGHT and does not push the list around, so a
            down-chevron there promised the wrong motion — and flipping it to
            point up while a panel sat off to the side said nothing at all.
          */
          cascade ? (
            <ChevronRight
              size={CHEVRON_SLOT}
              aria-hidden="true"
              className={cn(
                "shrink-0 motion-move",
                active || open
                  ? "text-nav-fg-muted"
                  : "text-nav-fg-subtle group-hover:text-nav-fg-muted",
              )}
            />
          ) : (
          <ChevronDown
            size={CHEVRON_SLOT}
            aria-hidden="true"
            className={cn(
              // Same ink and the same lift on hover as the nav row's chevron,
              // which is the same glyph pointing a different way.
              "shrink-0 motion-move",
              active
                ? "text-nav-fg-muted"
                : "text-nav-fg-subtle group-hover:text-nav-fg-muted",
              open && "rotate-180",
            )}
          />
          )
        ) : !edit?.renaming ? (
          /*
           * The slot, held empty.
           *
           * Without it a leaf row's last control slides into the chevron's place
           * and the trailing column zig-zags down the list — every mark has to
           * be in the same place on every row for the cluster to read as one
           * column you can aim at. In BOTH modes now: read-only the column is
           * the pin's, and it drifted for exactly the same reason.
           */
          <span
            aria-hidden="true"
            style={{ width: CHEVRON_SLOT }}
            className="shrink-0"
          />
        ) : null}
      </span>
    </>
  );

  /*
   * A div while editing, a button otherwise.
   *
   * The rename field and the kebab are interactive, and neither can live inside
   * a button — nested interactive elements are invalid markup that browsers
   * resolve differently. Same split NavItemRow makes, for the same reason; the
   * read-only path is untouched, so every measurement taken against it holds.
   */
  const row = edit ? (
    <div
      ref={rowHostRef}
      role="button"
      tabIndex={0}
      aria-current={active ? "true" : undefined}
      aria-expanded={hasChildren ? open : undefined}
      aria-controls={hasChildren ? panelId : undefined}
      onClick={edit.renaming ? undefined : onRowClick}
      onKeyDown={(e) => {
        if (edit.renaming) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onRowClick();
        }
      }}
      // Claimed on the way in as well as on the way over.
      onDragEnter={edit.onDragOver}
      onDragOver={edit.onDragOver}
      onDragLeave={edit.onDragLeave}
      onDrop={edit.onDrop}
      style={rowStyle}
      className={rowClass}
    >
      {mark.bar ? <HereBar marking={marking} /> : null}
      {/*
        The handle, for the same reason the nav's rows have one: the row is made
        of buttons and a mousedown inside a form control does not start an
        ancestor's drag. The grip is the element the browser drags.
      */}
      {edit.renaming ? null : (
        <span
          data-drag-handle=""
          draggable
          role="button"
          tabIndex={-1}
          aria-label={`Reorder ${item.label}`}
          title="Drag to reorder"
          onDragStart={edit.onDragStart}
          onDragEnd={edit.onDragEnd}
          onClick={(e) => e.stopPropagation()}
          // Always on in edit mode, and animating its width in, for the same
          // reasons as the nav's rows.
          className="motion-grip-in -ml-[4px] flex size-[18px] shrink-0 cursor-grab items-center justify-center self-center overflow-hidden rounded-[4px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:cursor-grabbing"
        >
          <GripVertical size={14} aria-hidden="true" />
        </span>
      )}
      {inner}
    </div>
  ) : (
    <button
      ref={rowHostRef}
      type="button"
      aria-current={active ? "true" : undefined}
      aria-expanded={hasChildren ? open : undefined}
      aria-controls={hasChildren ? panelId : undefined}
      onClick={onRowClick}
      style={rowStyle}
      className={rowClass}
    >
      {mark.bar ? <HereBar marking={marking} /> : null}
      {inner}
    </button>
  );

  /*
   * The kebab takes the pin's place while editing — same column, same vertical
   * rule, so the row's reserved trailing space serves whichever one is showing.
   */
  /*
   * The pin, for read-only rows only.
   *
   * Edit mode's controls are inside the row now, so there is nothing to hang
   * here — and the pin itself has no place in a mode about restructuring.
   */
  const withTrailing = (node: React.ReactNode) =>
    edit ? (
      <div className="group/row relative w-full shrink-0">{node}</div>
    ) : (
      <WithPin
        productId={item.id}
        pinClass={v.pinTop}
        pinInset={PIN_INSET}
        // 12, as the nav's own rows use: an L2 row is the same kind of row one
        // level down, so its trailing mark is the same mark at the same size.
        pinSize={12}
      >
        {node}
      </WithPin>
    );

  if (!hasChildren) return withTrailing(row);

  return (
    <div
      ref={rowRef}
      onPointerEnter={
        cascade?.hover
          ? () =>
              cascade.hover?.(
                item.id,
                item.label,
                hasChildren ? (item.children ?? []) : [],
                rowRef.current ?? document.body,
                0,
              )
          : undefined
      }
      className="relative w-full shrink-0"
    >
      {withTrailing(row)}
      {open && !cascade ? (
        <div id={panelId}>
          <FlyoutChildRows
            nodes={item.children ?? []}
            depth={0}
            activeId={activeId}
            onSelect={onSelect}
            tabsInNav={tabsInNav}
            {...(childEdit ? { edit: childEdit } : {})}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * The pin, or the space the kebab needs instead.
 *
 * Editing hides the pin at every level — the mode is about what the nav
 * contains, and a favourite is a shortcut to something already in it. So while
 * editing the row gets a plain positioned wrapper, and outside the mode it gets
 * `WithPin` exactly as before.
 */
function ChildShell({
  edit,
  children,
}: {
  edit?: FlyoutChildEdit;
  children: React.ReactNode;
}) {
  return edit ? (
    <div className="group/row relative w-full">{children}</div>
  ) : (
    <>{children}</>
  );
}

/**
 * The L3 row's own element: a button normally, a div while editing.
 *
 * The same split `FlyoutRow` makes one level up, for the same reason — the
 * glyph and the kebab are interactive and neither can live inside a button.
 */
function Row({
  edit,
  childId,
  hostRef,
  pinInset = PIN_INSET,
  children,
  ...rest
}: {
  edit?: FlyoutChildEdit;
  /**
   * Where the pin overlay sits, in px from the row's trailing edge.
   *
   * The pin cannot be a flex child, so it does not move when the cluster's
   * order does — the caller has to tell it. Inverted, the pin IS the trailing
   * edge and sits at `ROW_EDGE`; in the panel it stays inboard of the chevron's
   * column.
   */
  pinInset?: number;
  /** Empty for a row that discloses — see WithPin's own note. */
  childId: string;
  children: React.ReactNode;
  onClick: () => void;
  className: string;
  "aria-current"?: "page" | undefined;
  "aria-expanded"?: boolean | undefined;
  "aria-controls"?: string | undefined;
  /** Where a truncated label hangs its tooltip. See useTruncationTitle. */
  hostRef?: (el: HTMLElement | null) => void;
}) {
  if (edit) {
    return (
      <div
        ref={hostRef}
        role="button"
        tabIndex={0}
        {...rest}
        onKeyDown={(e) => {
          if (e.key !== "Enter" && e.key !== " ") return;
          e.preventDefault();
          rest.onClick();
        }}
      >
        {children}
      </div>
    );
  }
  return (
    <WithPin
      productId={childId}
      pinInset={pinInset}
      // 12, the same as L1 and L2. It was falling through to PinButton's own
      // default of 14, so the deepest rows — the ones drawn smallest in every
      // other respect — carried the largest pin in the nav.
      pinSize={12}
    >
      <button ref={hostRef} type="button" {...rest}>
        {children}
      </button>
    </WithPin>
  );
}

/** L4 is the stop. Deeper than that is a data mistake, not a level. */
const MAX_CHILD_DEPTH = 1;

/**
 * The nested dropdown, one level per call.
 *
 * Indented to the parent's text column and hung off a hairline that drops from
 * the icon's centreline, so the rows read as the parent's contents rather than
 * more siblings. Recursive because the proposed IA nests one level further —
 * Calendars ▸ Settings ▸ Services — and a flat `.map` silently dropped it.
 */
export function FlyoutChildRows({
  nodes,
  depth,
  activeId,
  onSelect,
  tabsInNav,
  edit,
  cascade,
}: {
  nodes: readonly FlyoutChildItem[];
  depth: number;
  cascade?: FlyoutCascadeApi;
  /**
   * The row the page behind the panel is currently on.
   *
   * Needed the moment opening a disclosure started navigating: the dropdown
   * appears, the page changes behind it, and without this nothing in the list
   * says which row you landed on. A user who then picks the second item has no
   * way to know they were on the first.
   */
  activeId: string | null;
  onSelect?: (id: string, keepOpen?: boolean) => void;
  tabsInNav: boolean;
  edit?: FlyoutChildEdit;
}) {
  return (
    <div
      className={cn(
        // No rule down the left edge — the indent alone carries the nesting
        // (Khoi, Aug 24: "the more visual elements we can remove, the better").
        // The border's 1px folds into the padding so the text does not shift.
        //
        // Indented on the LEFT only. It used to carry `pr-[8px]` as well, which
        // pulled every nested row's right edge 8px inboard — and since the pin
        // is positioned against that edge, an L3's pin sat 8px left of its
        // parent's. Nesting is a left-hand idea; the trailing column belongs to
        // the panel and every row in it shares one.
        "motion-menu-in flex w-auto flex-col gap-[1px]",
        /*
          The indent is a NESTING device, and a dropdown has nothing to nest
          under.
          
          Inline, these numbers hang the rows off their parent's text column —
          the parent is directly above them, and the offset is what says "these
          belong to that". In a dropdown the parent is in another panel
          entirely, so the same offset just pushed the list 19px right of
          centre: 25px of space on the left against 6px on the right, in a
          floating box whose padding is supposed to be even.
        */
        cascade ? "mt-0 ml-0 pl-0" : "mt-[2px]",
        !cascade && (depth === 0 ? "ml-[19px] pl-[14px]" : "ml-[9px] pl-[12px]"),
      )}
    >
      {nodes.map((child) => (
        <FlyoutChildRow
          key={child.id}
          {...(cascade ? { cascade } : {})}
          child={child}
          depth={depth}
          activeId={activeId}
          onSelect={onSelect}
          tabsInNav={tabsInNav}
          {...(edit ? { edit } : {})}
        />
      ))}
    </div>
  );
}

/**
 * The first row under this one that is actually a place.
 *
 * Descends the first branch until it reaches something that does not disclose:
 * an L2 whose first child is itself a parent has no page of its own to offer,
 * so the answer is that child's first child, and so on. A `tabs` node stops the
 * walk unless tabs are being drawn as nav rows — its children live on its page,
 * which makes the node itself the destination.
 *
 * Null when the branch bottoms out in nothing navigable, which is a tree bug
 * rather than a case to design for — the caller simply opens the disclosure and
 * navigates nowhere.
 */
function firstPlaceUnder(
  nodes: readonly FlyoutChildItem[] | undefined,
  tabsInNav: boolean,
  depth = 0,
): string | null {
  const first = nodes?.[0];
  if (!first) return null;
  const discloses =
    (first.children?.length ?? 0) > 0 &&
    (tabsInNav || !first.tabs) &&
    depth < MAX_CHILD_DEPTH;
  if (!discloses) return first.id;
  return firstPlaceUnder(first.children, tabsInNav, depth + 1) ?? first.id;
}

function FlyoutChildRow({
  child,
  depth,
  activeId,
  onSelect,
  tabsInNav,
  edit,
  cascade,
}: {
  child: FlyoutChildItem;
  depth: number;
  cascade?: FlyoutCascadeApi;
  /**
   * The row the page behind the panel is currently on.
   *
   * Needed the moment opening a disclosure started navigating: the dropdown
   * appears, the page changes behind it, and without this nothing in the list
   * says which row you landed on. A user who then picks the second item has no
   * way to know they were on the first.
   */
  activeId: string | null;
  onSelect?: (id: string, keepOpen?: boolean) => void;
  tabsInNav: boolean;
  edit?: FlyoutChildEdit;
}) {
  const { l2ClickAction } = useTheme();
  const openFirst = l2ClickAction === "open-first";
  /*
   * An L3 row is the page itself or nothing — there is no level below it to be
   * on the trail of. A deeper cascade marks its own parent through the same
   * call one level up.
   */
  const here = useHere();
  const marking = useMarking(
    here.childId !== null && here.childId === child.id,
    (child.children ?? []).some((n) => n.id === here.childId),
  );
  const mark = useHereStyle(marking);
  const { ref: childLabelRef, hostRef: childHostRef } =
    useTruncationTitle<HTMLSpanElement>(child.label);
  const nested =
    (child.children?.length ?? 0) > 0 &&
    (tabsInNav || !child.tabs) &&
    depth < MAX_CHILD_DEPTH;
  const [inlineOpen, setInlineOpen] = React.useState(false);
  // Cascading, the panel owns which row is open at this level — see the same
  // note on FlyoutRow.
  const open = cascade
    ? cascade.openIds[cascade.level + 1] === child.id
    : inlineOpen;
  const panelId = React.useId();
  /** This row's box, for anchoring the level that hangs off it. */
  const rowRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={rowRef}
      onPointerEnter={
        cascade?.hover
          ? () =>
              cascade.hover?.(
                child.id,
                child.label,
                nested ? (child.children ?? []) : [],
                rowRef.current ?? document.body,
                cascade.level + 1,
              )
          : undefined
      }
      className="relative w-full"
    >
      {/*
        Pinnable, like any other destination. The star is a sibling rather than
        a child of the row, because the row is itself a button and nesting one
        control inside another is invalid — the same reason WithPin exists for
        the product rows above.

        Only leaves: a row that discloses is a container, and pinning it would
        put something in the dock that opens a list rather than a place.
      */}
      <ChildShell edit={edit}>
      <Row
        edit={edit}
        hostRef={childHostRef}
        childId={nested ? "" : child.id}
        pinInset={cascade ? ROW_EDGE : PIN_INSET}
        aria-current={child.id === activeId ? "page" : undefined}
        aria-expanded={nested ? open : undefined}
        aria-controls={nested ? panelId : undefined}
        onClick={() => {
          // The same bargain the L2 rows strike — see `onRowClick` above.
          if (!nested) {
            onSelect?.(child.id);
            return;
          }
          if (cascade) {
            cascade.open(
              open ? "" : child.id,
              child.label,
              open ? [] : (child.children ?? []),
              rowRef.current ?? document.body,
              cascade.level + 1,
            );
            if (open || !openFirst) return;
            const firstDeep = firstPlaceUnder(
              child.children,
              tabsInNav,
              depth + 1,
            );
            if (firstDeep) onSelect?.(firstDeep, true);
            return;
          }
          if (open) {
            setInlineOpen(false);
            return;
          }
          setInlineOpen(true);
          if (openFirst) {
            const first = firstPlaceUnder(child.children, tabsInNav, depth + 1);
            if (first) onSelect?.(first, true);
          }
        }}
        className={cn(
          /*
            The nav's own vertical rhythm, not a height of its own.

            It was a flat 30px against L1 and L2's 38 — nine of padding either
            side of a 20px content box, read from --t-nav-py so the whole nav
            retunes together. Three levels of one list at two different row
            heights made the cascade read as a different KIND of menu rather
            than as the same list one step deeper, and it meant the tuning knob
            moved two of the three.

            Horizontal padding and gap stay tighter, and the type keeps its
            notch down per level: depth is still legible, it is just no longer
            legible by the rows being a different size.
          */
          "motion-tap relative flex w-full items-center gap-[7px] rounded-[7px] px-[9px] text-left leading-[normal] font-medium text-nav-fg-muted hover:text-nav-fg active:scale-[0.99]",
          mark.ink,
          mark.row,
          // Rollover only where there is no mark holding the ground already.
          !mark.row && child.id !== activeId && "hover:bg-nav-hover",
          "py-[var(--t-nav-py,9px)] min-h-[calc(var(--t-nav-py,9px)*2+20px)]",
          /*
            The same fill an active row wears anywhere else in the nav, so
            "you are here" looks the same at every level.

            That is what this line always claimed, and `bg-nav-hover` is what
            it did: the selected L3 and a hovered sibling were the identical
            grey, and the panel could not answer which row you were on the
            moment your pointer entered it. The selected neutral is a step
            darker than hover by construction — see --nav-selected.
          */
          child.id === activeId && "bg-nav-selected text-nav-fg",
          // 8px, matching the L2 row's own px — the two trailing clusters have
          // to start from the same right edge or nothing in them can line up.
          // In both modes: the pin's column is a flex spacer now rather than
          // padding behind an overlay, so there is nothing left to reserve.
          "pr-[8px]",
          // One notch down per level, so depth is legible without a marker.
          depth === 0 ? "text-[13px]" : "text-[12.5px]",
        )}
      >
        {mark.bar ? <HereBar marking={marking} /> : null}
        {child.icon ? (
          edit ? (
            /*
              The glyph is the picker's trigger, as it is one level up.

              A span with a role rather than a button: while editing the row is
              a div, but outside the mode it is still a real <button>, and a
              button inside a button is invalid markup browsers resolve however
              they like. This works in both.
            */
            <span
              role="button"
              tabIndex={0}
              aria-label={`Change the ${child.label} icon`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                edit.onPickIcon(child.id, e.currentTarget as HTMLElement);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter" && e.key !== " ") return;
                e.stopPropagation();
                e.preventDefault();
                edit.onPickIcon(child.id, e.currentTarget as HTMLElement);
              }}
              className="motion-tap -m-[3px] flex shrink-0 cursor-pointer items-center justify-center rounded-[5px] p-[3px] text-nav-fg-subtle hover:bg-nav-active"
            >
              <child.icon size={16} aria-hidden="true" />
            </span>
          ) : (
            // Same 16px box the nav's own rows use, so an L3 row reads as the
            // same kind of thing one level down rather than a sub-item of one.
            <child.icon
              size={16}
              aria-hidden="true"
              className="shrink-0 text-nav-fg-subtle"
            />
          )
        ) : null}
        {/* Same rule one level down: the cut label carries its own full text. */}
        <span ref={childLabelRef} className="truncate">
          {child.label}
        </span>
        {child.badge ? (
          <span
            className={cn(
              "shrink-0 rounded-[2px] px-[4px] py-[1.5px] text-[9.5px] leading-[normal] font-semibold whitespace-nowrap shadow-[0_2px_4px_0_#00000014]",
              BADGE_TONE[child.badge.tone],
            )}
          >
            {child.badge.label}
          </span>
        ) : null}
        {/*
          The same trailing cluster the L2 row builds, in the same order and on
          the same gap: the row's own mark — kebab while editing, the pin's
          reserved column outside it — then the disclosure chevron flush against
          the row's edge.

          The chevron used to come FIRST here, so a nested row put its mark
          where every other row puts its chevron and the column zig-zagged
          wherever a row happened to have children. Same order at both levels,
          and the same slot held empty on a leaf, so the marks sit on one line
          and the chevron is the last thing on every row that has one.
        */}
        {/*
          Inverted in a dropdown: chevron first, the row's own mark last.
          
          In the panel the two levels share one trailing column, so the chevron
          has to be the outermost thing or an L3's mark would sit where an L2's
          chevron is. A dropdown has no L2 list beside it to line up with — and
          almost no L3 row has children, so holding the chevron's column at the
          OUTER edge left a permanent strip of nothing to the right of every
          pin. Putting the mark last spends that space on the thing that is
          always there.
        */}
        <span
          className={cn(
            "ml-auto flex shrink-0 items-center gap-[var(--t-fly-gap,10px)]",
            cascade && "flex-row-reverse",
          )}
        >
          {edit ? (
            <EditAffordance
              label={`Edit ${child.label}`}
              onClick={(trigger) => edit.onOpenMenu(child.id, trigger)}
              pinned
            >
              <EllipsisVertical size={12} aria-hidden="true" />
            </EditAffordance>
          ) : isPinnable(child.id) ? (
            <span
              aria-hidden="true"
              style={{ width: PIN_SLOT }}
              className="shrink-0"
            />
          ) : null}
          {nested ? (
            // Right in a dropdown, down inline — see the L2 row's own note.
            cascade ? (
              <ChevronRight
                size={CHEVRON_SLOT}
                aria-hidden="true"
                className={cn(
                  "shrink-0 motion-move",
                  open ? "text-nav-fg-muted" : "text-nav-fg-subtle",
                )}
              />
            ) : (
              <ChevronDown
                size={CHEVRON_SLOT}
                aria-hidden="true"
                className={cn(
                  "shrink-0 text-nav-fg-subtle motion-move",
                  open && "rotate-180",
                )}
              />
            )
          ) : (
            <span
              aria-hidden="true"
              style={{ width: CHEVRON_SLOT }}
              className="shrink-0"
            />
          )}
        </span>
      </Row>
      </ChildShell>
      {nested && open && !cascade ? (
        <div id={panelId}>
          <FlyoutChildRows
            nodes={child.children ?? []}
            depth={depth + 1}
            activeId={activeId}
            onSelect={onSelect}
            tabsInNav={tabsInNav}
            {...(edit ? { edit } : {})}
          />
        </div>
      ) : null}
    </div>
  );
}
