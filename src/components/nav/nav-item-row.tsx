"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { cn } from "@/lib/utils";
import { useTruncationTitle } from "@/lib/use-truncation-title";
import { EditAffordance, InlineRename } from "./inline-rename";
import { RailTooltip } from "./rail-tooltip";
import { useTheme } from "@/components/theme/theme-provider";
import type { RowMenuAction } from "./row-menu";
import type { NavItem } from "./types";
import { HereBar, useHereStyle, type Marking } from "./here";
import { NewDot, NewDotIcon, useCarriesNew } from "./new-flag";

/**
 * What editing this row offers. Absent when the role has no permission to rename
 * this row, or when the row is chrome rather than a group or a product — which is
 * what keeps a read-only row exactly as it was designed.
 */
export interface NavRowEdit {
  renaming: boolean;
  /** Show the pencil without a hover. The prototype panel's forcing switch. */
  pinned?: boolean;
  /**
   * Why this row's label cannot be renamed, if it cannot.
   *
   * Set, the row draws a greyed pencil carrying this string as its tooltip
   * instead of a live one, and the label stops opening the field on click.
   * See renameBlockedFor in nav-entries.ts for the rule and the argument.
   */
  renameBlocked?: string;
  /**
   * Every row in this run is blocked for the same reason, so draw no pencil.
   *
   * The greyed pencil earns its place by being the odd one out: a product
   * promoted to the top level sits among categories that CAN be renamed, and
   * without the mark the reader would just find the label inert. Inside a
   * category the whole run is products, so the same mark becomes a column of
   * dead controls explaining a rule with no exception on screen. Ashwin asked
   * for it gone there on Sep 28; this is the difference between the two.
   */
  renameBlockedUniform?: boolean;
  onStartRename: () => void;
  onCommitRename: (next: string) => void;
  onCancelRename: () => void;
  /** Absent when the role may not change icons. */
  onPickIcon?: (trigger: HTMLElement) => void;
  /** Present only when this row is showing an override to clear. */
  onReset?: () => void;
  /**
   * Opens the row's kebab. Present only in edit mode.
   *
   * When it is present the pencil and the reset button are gone: the menu
   * carries both, and a 272px row cannot hold a third and fourth affordance
   * without the label truncating to make room for controls nobody asked for.
   */
  onOpenMenu?: (trigger: HTMLElement) => void;
  /**
   * Switching this row off, and back on.
   *
   * Hover-only while the row is showing — a nav that wears an eye on every row
   * reads as a settings screen. Once hidden the eye stays out, because a dimmed
   * row with no visible control is a row you cannot get back without guessing
   * where its switch went.
   */
  onToggleHidden?: () => void;
  hidden?: boolean;
  /**
   * What that menu contains.
   *
   * Built with the rest of the row's edit bundle and read back by whoever
   * renders the portal, so one row cannot show a kebab whose menu was assembled
   * from a different row's position in the list.
   */
  menuActions?: RowMenuAction[];
  /**
   * Something about this row is not finished, said in one short phrase.
   *
   * A state of the row rather than a message somewhere else: the row is what is
   * wrong, and an admin with twelve categories needs to see WHICH one before
   * they can fix it. Amber, and it blocks saving — see the Save control, which
   * counts these.
   */
  warning?: string;
  /**
   * The label starts the rename instead of the row acting.
   *
   * Set in edit mode only. Off, the label is inert and the row owns every click,
   * which is what a nav row should be — this turns the text into a field you can
   * reach, without taking the row's own job away from it.
   */
  renameOnLabelClick?: boolean;
  /** Reordering. Present only in edit mode, and only for rows that may move. */
  /**
   * What the rename field starts from, when it differs from what the row shows.
   *
   * A lifted L3 whose name collides is drawn as "Opportunities › Settings", and
   * that string is the nav explaining the row rather than the row's name — so
   * the field opens on "Settings" and a rename replaces the name, not the
   * explanation.
   */
  renameValue?: string;
  drag?: NavRowDrag;
}

/**
 * Native HTML5 drag wiring for a row.
 *
 * Native because the row is a `<div>` in a scrolling box and the gesture has to
 * cross into a portalled flyout — which is what a drag library would have to be
 * taught, and what the browser already does. `over` is the highlight state; the
 * owner decides what a hovered row means, since the same row is both a place to
 * drop an L1 beside and a category to drop an L2 into.
 */
export interface NavRowDrag {
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  /** Drawn as a ring when a drop here would land. */
  over: boolean;
  /**
   * Something this row would accept is in flight, but is not over it yet.
   *
   * A drop target that only appears once the pointer is already on it is a
   * target you find by feel — which is why "can I drag a product into another
   * category" read as no. Every category advertises while a product is being
   * dragged, the same way the seams advertise while a category is.
   */
  eligible?: boolean;
  /** Faded while this row is the one in flight. */
  lifted: boolean;
}

interface NavItemRowProps {
  item: NavItem;
  active?: boolean;
  onSelect?: () => void;
  /** Pointer entered — used to preview this row's flyout. */
  onHover?: () => void;
  edit?: NavRowEdit;
  /**
   * Edit mode is on but this row is not part of what can be edited.
   *
   * Recent, Quick Actions, the favourites row and Settings are chrome or platform
   * surfaces, not the account's tree — so the mode simply does not apply to them.
   * Saying so with the cursor is cheaper than a tooltip and lands the moment the
   * pointer arrives, which is when the question gets asked. The row still works:
   * it is not editable, not inert.
   */
  locked?: boolean;
  /**
   * Whether this row is the page you are on, a step on the way to it, or
   * neither. Null unless the selected-state axis is on — see SELECTED_STATES.
   */
  marking?: Marking;
}

/**
 * One nav row. Geometry is taken from left-nav.pen:
 *   compact  padding 6px 8px   (recent rows)
 *   default  padding 9px 8px   (everything else)
 *   gap 10px, radius 7px, 16px leading icon, 15px trailing chevron
 *
 * Two renderings of the same row. Read-only it is a single `<button>`, which is
 * the correct element and the one every measurement was taken against. Editable
 * it becomes a `<div>` holding several buttons, because a rename field and a
 * pencil cannot live inside a button — nested interactive elements are invalid
 * and browsers disagree about what they do with the clicks.
 *
 * In the editable rendering the whole row carries the click, not the label
 * inside it. The label's button is only as wide as its text, so hanging the
 * handler there left the icon, the padding and the strip under the chevron dead
 * — a row that looks like one target and behaves like three. The button stays as
 * the focusable, named control and does NOT handle clicks itself: activating it
 * from the keyboard dispatches a click that bubbles to the row, so mouse and
 * keyboard both arrive at one handler. Every affordance in the row stops
 * propagation, so the pencil, the icon and the rename field never select.
 */
export function NavItemRow({
  item,
  active = false,
  onSelect,
  onHover,
  edit,
  locked = false,
  marking = null,
}: NavItemRowProps) {
  const compact = item.density === "compact";
  const mark = useHereStyle(marking);

  /*
   * Tree rows inset the ROW; every other arrangement insets the row's contents.
   *
   * `depth` is set by `product-tree.tsx` and by nothing else, so this branch is
   * the All-products tree talking and every nav that shipped before the axis
   * takes the `pl-` path below unchanged.
   *
   * In the tree the fill is the selection, and a selection that begins at the
   * nav's left edge is the tree claiming the page belongs to the whole column
   * rather than to the branch it is standing in. Margin instead of padding
   * moves the row's own left edge to where its level begins — so the fill,
   * the hover band and the here-mark all start under the parent's glyph, and
   * the row reads as a child of the thing above it.
   *
   * The margin is the indent MINUS the row's own `px`, which the row still
   * carries: margin + px puts the glyph exactly where the padding version put
   * it, so nothing inside the row moves a pixel. The width gives back what the
   * margin took, so the right edge stays where it was too.
   */
  const inset = item.depth != null;

  const rowClass = cn(
    "flex shrink-0 items-center text-left",
    /*
     * Depth 0 is inset by nothing, so it is full width like every other row.
     *
     * `inset` turns `w-full` off because the indented depths set an explicit
     * `w-[calc(100% - step)]` instead — and depth 0 matches none of those, so
     * it was left with width auto in a column whose `items-start` does not
     * stretch its children: the row shrank to its text, and the hover fill
     * with it, stopping short of the pin. That depth only exists in the
     * drill-in and scoped arrangements, where a category's products start
     * flush (see `ProductTreeBranch`'s `l2Depth`), which is why nothing saw
     * it until they landed.
     */
    (!inset || item.depth === 0) && "w-full",
    "gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)]",
    "motion-tap",
    /*
     * A disclosed child is indented by its parent's icon plus the row gap, so
     * the child labels line up with the parent LABEL rather than sitting in a
     * hanging indent of their own. Padding rather than margin here, because a
     * flyout's disclosed child is one band with the row above it: the hover
     * fill spans the full width and the pair reads as one list. The tree makes
     * the opposite argument one level up, in `inset`.
     */
    !inset &&
      (item.child ?? false) &&
      "pl-[calc(var(--t-nav-px,8px)+16px+var(--t-nav-gap,10px))]",
    /*
     * Written out per level and per step rather than computed: Tailwind scans
     * source text, so an `ml-[calc(...*${n}...)]` is a class nothing ever
     * emits. The tight column is the same arithmetic with the glyph's 16px
     * taken out of the step — see `NavItem.tightIndent`.
     */
    inset &&
      !item.tightIndent &&
      item.depth === 1 &&
      "ml-[calc(16px+var(--t-nav-gap,10px))] w-[calc(100%-16px-var(--t-nav-gap,10px))]",
    inset &&
      !item.tightIndent &&
      item.depth === 2 &&
      "ml-[calc(2*16px+2*var(--t-nav-gap,10px))] w-[calc(100%-2*16px-2*var(--t-nav-gap,10px))]",
    inset &&
      !item.tightIndent &&
      (item.depth ?? 0) >= 3 &&
      "ml-[calc(3*16px+3*var(--t-nav-gap,10px))] w-[calc(100%-3*16px-3*var(--t-nav-gap,10px))]",
    inset && item.tightIndent && item.depth === 1 && "ml-[16px] w-[calc(100%-16px)]",
    inset && item.tightIndent && item.depth === 2 && "ml-[32px] w-[calc(100%-32px)]",
    inset &&
      item.tightIndent &&
      (item.depth ?? 0) >= 3 &&
      "ml-[48px] w-[calc(100%-48px)]",
    // Compact rows keep their tighter padding proportionally.
    compact ? "py-[calc(var(--t-nav-py,9px)*0.667)]" : "py-[var(--t-nav-py,9px)]",
    /*
     * The row's height is its own, not its contents'.
     *
     * A 14px label's line box is 17px and the trailing affordance is 20px, so
     * the row used to be three pixels taller whenever a pencil was in it — and
     * three shorter the moment a rename replaced the label, which is the shrink
     * the review caught. Pinning the content box to the affordance's 20px makes
     * every state the same height: read-only, editable, and mid-rename, for
     * every role.
     */
    compact
      ? "min-h-[calc(var(--t-nav-py,9px)*1.334+20px)]"
      : "min-h-[calc(var(--t-nav-py,9px)*2+20px)]",
  );

  /*
   * Switched off: struck through and faded, but only the CONTENT.
   *
   * The dim used to sit on the row, which took the eye down with it — and opacity
   * is multiplicative, so no child can climb back out of a faded parent. Since the
   * eye is the only way back, it has to stay at full strength while everything it
   * is describing goes quiet.
   */
  const off = edit?.hidden ?? false;
  /*
   * The tooltip hangs on the ROW, not on the words — a title only answers a
   * pointer that is over the element carrying it, and a nav row is pointed at
   * anywhere along its 240px.
   */
  const { renameAffordance, navChevron } = useTheme().effective;
  /*
   * Whether the rename tip is the thing explaining this row on hover.
   *
   * Worked out up here, well above the branch that draws the label, because
   * the hook that writes the truncation `title` runs first and has to know to
   * stand down — two pills over one row is what Ashwin saw on Sep 28.
   *
   * Silent on a row blocked UNIFORMLY: that flag means every row in the run is
   * a product, so there is no odd one out to mark and a pill on each would
   * follow the pointer down the list saying the same thing. Silent too where
   * there is no rename either way — an account's own link has no override map
   * behind it, so "click to rename" would be a lie.
   */
  const labelTip =
    renameAffordance === "tooltip" && edit && !edit.renaming
      ? edit.renameBlocked
        ? edit.renameBlockedUniform
          ? null
          : edit.renameBlocked
        : edit.renameOnLabelClick
          ? "Click to rename"
          : null
      : null;
  /*
   * Whether that tip is a refusal, which the cursor has to agree with.
   *
   * The label is a `<button>`, so preflight hands it the pointer — and a hand
   * over words that have just said they cannot be renamed is the control
   * contradicting its own tooltip. Ashwin, Sep 28. Only the refusal case: a
   * label saying "click to rename" is pointing at a real click, and the row
   * underneath still opens its panel from anywhere along its length.
   */
  const labelRefuses = labelTip !== null && labelTip === edit?.renameBlocked;
  const { ref: labelRef, hostRef: rowHostRef } = useTruncationTitle<HTMLSpanElement>(
    item.label,
    // Stands down while the rename tip is up — see the hook's `enabled`.
    labelTip === null,
  );
  /*
    Whether something New is behind this row's door.

    Read from context rather than passed in: the answer comes from the panel
    this row opens, which the shell already builds, and the rows that need it
    are spread across the nav, the rail and the launcher.
  */
  const dotted = useCarriesNew(item.flyoutId ?? item.id);

  /*
    The glyph, wrapped so the dot has a corner to hang off when the axis puts it
    there. NewDotIcon is a pass-through in every other mode, so the row's layout
    is untouched unless the dot is actually on the icon.
  */
  const icon = (
    <NewDotIcon on={dotted}>
      <RowIcon item={item} active={active} dimmed={off} glyph={mark.glyph} />
    </NewDotIcon>
  );

  const label = (
    <span
      // The full name on hover once the row has cut it — the nav's own rows
      // truncate too, and a renamed one can be longer than the column.
      ref={labelRef}
      className={cn(
        "truncate text-[length:var(--t-nav-font,14px)] leading-[normal]",
        item.hasFlyout || item.expandable ? "flex-1" : "whitespace-nowrap",
        item.ai ? "text-nav-ai-fg" : "text-nav-fg",
        /*
         * Faded, not struck through.
         *
         * A strike reads as deleted, and it put a line through a name the admin
         * is still choosing between — which looked wrong for a row that is only
         * switched off. The fade goes a little further than it would have to on
         * its own, and the pinned eye-off beside it is what actually says which
         * state this is.
         */
        off && "opacity-40",
        mark.ink,
      )}
    >
      {item.label}
    </span>
  );

  /*
    Label and dot as one flexible unit.

    The dot cannot simply follow the label: the label carries `flex-1` so the
    chevron stays pinned to the row's edge, which would push the dot out there
    with it and leave it floating in the gap, unattached to anything. Wrapping
    moves that job up to the pair, so the label still truncates and the dot
    stays against the last word it belongs to.

    Only when there is a dot — otherwise the extra box is layout for nothing,
    on every row in the nav.
  */
  const labelled = dotted ? (
    <span
      className={cn(
        "flex min-w-0 items-center gap-[6px]",
        item.hasFlyout || item.expandable ? "flex-1" : null,
      )}
    >
      {label}
      <NewDot className={cn(off && "opacity-40")} />
    </span>
  ) : (
    label
  );

  /*
    How much is behind the chevron, said before you press it.

    Subtle and to the right of the label, not a filled pill: a pill reads as a
    badge — unread, new, needs attention — and this is none of those, it is the
    size of a list. Tabular figures so a column of them does not jitter between
    9 and 15, and `shrink-0` so the label gives up the width rather than the
    number being the thing that truncates.

    Nothing at all when the row carries no count, which is every row that
    existed before the product tree did.
  */
  const count =
    typeof item.count === "number" ? (
      <span
        aria-hidden="true"
        className={cn(
          "shrink-0 text-[11px] leading-none tabular-nums text-nav-fg-subtle",
          off && "opacity-40",
        )}
      >
        {item.count}
      </span>
    ) : null;

  /*
    The column the pin hangs in, held open by nothing.

    22px for the star plus the 10px gap the flyout's rows use, and — on a row
    with no chevron — the chevron's own 15px as well, so a leaf's pin and a
    parent's pin sit on the same vertical line. See `NavItem.pinSlot` for why
    the star cannot simply be a child of the row.
  */
  const pinSlot = item.pinSlot ? (
    <span
      aria-hidden="true"
      className={cn(
        "shrink-0",
        /*
          Measured from the row's trailing edge, which is where the overlay is
          anchored: 8px padding, then the 15px chevron, then the 10px gap, puts
          the pin's column at 33–55. A row with a chevron already has the first
          25 of that in flow and needs only the star's 22; a row without one has
          to buy the chevron's slot and its gap too, hence 47.
        */
        item.expandable ? "w-[22px]" : "w-[47px]",
      )}
    />
  ) : null;

  /*
   * Whether edit mode draws no chevron column at all. See NAV_CHEVRONS.
   *
   * Only under `hover`: with the glyph set to show always, edit mode keeps
   * it, because there the chevron is still saying which rows have a panel
   * behind them and that is worth knowing while you are rearranging them.
   */
  const editChevronGone = navChevron === "hover";

  const chevron = item.expandable ? (
    /*
     * A caret, not the flyout's chevron: down for shut, up for open.
     *
     * It was the flyout glyph rotated — right when shut — on the argument that
     * a disclosure and a panel-opener make the same promise. They do not make
     * the same promise about DIRECTION, and a row pointing right at content
     * that arrives underneath it is the one thing the glyph is there to say.
     * Right belongs to the flyout, where the panel really does come from the
     * side.
     *
     * No hover nudge. There is nowhere for the pointer to travel to; the content
     * appears under the row it is already on.
     */
    <ChevronDown
      size={15}
      aria-hidden="true"
      className={cn(
        "shrink-0 motion-tap",
        item.expanded && "rotate-180",
        active || item.expanded
          ? "text-nav-fg-muted"
          : "text-nav-fg-subtle group-hover:text-nav-fg-muted",
        off && "opacity-40",
      )}
    />
  ) : item.hasFlyout ? (
    <ChevronRight
      size={15}
      aria-hidden="true"
      // Nudges toward the flyout it opens, which is the direction the panel
      // arrives from.
      className={cn(
        "shrink-0 motion-tap group-hover:translate-x-[2px]",
        active
          ? "translate-x-[2px] text-nav-fg-muted"
          : "text-nav-fg-subtle group-hover:text-nav-fg-muted",
        off && "opacity-40",
        /*
          Hidden until pointed at, where the axis asks for it — see
          NAV_CHEVRONS.

          Opacity rather than not rendering it: the glyph holds a 15px
          column that the label's truncation is measured against, so a row
          that dropped it would re-flow its own text on hover. The selected
          row is deliberately not excepted; Ashwin's ask was that the mark
          for "here" and the mark for "there is more" stay separate things.

          `focus-within` so the keyboard still sees it: hover is the only
          trigger for a pointer, and the only one a tab stop never gets.
        */
        navChevron === "hover" &&
          !off &&
          "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
      )}
    />
  ) : null;

  if (!edit) {
    /*
      Wrapped so the bar has something to hang off.

      The bar is absolute and the row is a `<button>`; a span inside the button
      would sit in its padding box and move with the label. The wrapper adds no
      box of its own — `contents` — so the row's own layout is untouched when
      the axis is off, which it is by default.

      The rails hang off the same wrapper, and deliberately NOT off the button:
      the button carries `active:scale-[0.99]`, so rails inside it would shrink
      a pixel on every press and the continuous line down the branch would
      visibly break at whichever row was being clicked. The wrapper does not
      move.
    */
    return (
      <span
        className={cn(
          marking || item.rails ? "relative block w-full" : "contents",
        )}
      >
      {item.rails ? (
        <RowRails rails={item.rails} wide={item.railsWide === true} />
      ) : null}
      {mark.bar ? <HereBar marking={marking} /> : null}
      <button
        ref={rowHostRef}
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={onSelect}
        onPointerEnter={onHover}
        onFocus={onHover}
        className={cn(
          rowClass,
          "group",
          /*
            The mark takes the ground when there is one.

            Class ORDER in this string decides nothing — both fills are the
            same property in the same layer, so the winner is whichever
            Tailwind happens to emit last. The condition is what makes a marked
            row keep its fill, and it drops the rollover with it: a row you are
            already on has nowhere to go, and lightening it under the pointer
            reads as leaving the page rather than as feedback.
          */
          mark.row
            ? mark.row
            : active
              ? "bg-nav-hover"
              : "hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)] active:bg-nav-active",
          "active:scale-[0.99] motion-press",
          // `data-cursor="menu"` on the band forces `cursor: pointer` on every
          // descendant, so this has to be on the row itself to win.
          locked && "cursor-not-allowed",
        )}
      >
        {icon}
        {labelled}
        {count}
        {pinSlot}
        {chevron}
      </button>
      </span>
    );
  }

  /*
   * Clicking the label opens the field only where a rename is actually
   * allowed. Derived once rather than tested at each of the four places that
   * used to read the prop: a blocked row that still turned its label into an
   * input on click would be offering the edit and then refusing it, which is
   * worse than not offering it.
   */
  const labelRenames = edit.renameOnLabelClick && !edit.renameBlocked;


  /*
   * The label, built once and then either wrapped or not.
   *
   * It used to be written inline in the JSX, which was fine while there was
   * one of it. The rename tip needs the same button inside a RailTooltip, and
   * two copies of a control this fiddly is two places for the next change to
   * miss.
   */
  const labelButton = (
    <button
        type="button"
        aria-current={active ? "page" : undefined}
        aria-label={
          labelRenames ? `Rename ${item.label}` : undefined
        }
        onFocus={onHover}
        // Normally no onClick: the row above owns it, and this button's own
        // activation — mouse or keyboard — bubbles up to it. In edit mode it
        // takes the click for itself and renames, which is why the propagation
        // has to stop here or the row would also act on the same click.
        onClick={
          labelRenames
            ? (e) => {
                e.stopPropagation();
                edit.onStartRename();
              }
            : undefined
        }
        className={cn(
          "flex min-w-0 items-center text-left",
          /*
            On the TEXT as well as on the button.

            `[data-cursor="menu"] *` in globals.css sets the cursor on every
            descendant of the nav band, so the span holding the words carries
            its own `pointer` — and the span is what the pointer is actually
            over. Styling only the button left the rule applying everywhere
            except the one place anyone would look. The descendant utility
            wins the same way the button's does: equal specificity, later
            cascade layer.
          */
          labelRefuses && "cursor-not-allowed [&_*]:cursor-not-allowed",
          labelRenames
            ? /*
               * Only as wide as its text while editing.
               *
               * Normally the label fills the row so the row reads as one
               * target — but in edit mode it has its own job, and a full-width
               * label meant a click anywhere on a category renamed it instead
               * of opening its panel. Which is the one thing that has to keep
               * working: moving rows between categories means having a panel
               * open. The hover box is the only hint the text is a field; a
               * permanent one would make the nav read as a form.
               */
              "w-fit max-w-full shrink -mx-[3px] rounded-[4px] px-[3px] hover:bg-nav-active"
            : "flex-1",
        )}
      >
        {label}
      </button>
  );

  return (
    <div
      ref={rowHostRef}
      // `group/row` rather than a bare group: the affordances key off this row
      // specifically, and an unnamed group would also match any hovered ancestor.
      className={cn(
        rowClass,
        "group/row group",
        mark.row
          ? mark.row
          : active
            ? "bg-nav-hover shadow-[inset_0_0_0_1px_var(--nav-hover-ring)]"
            : "hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)]",
        // Matches the read-only row's press feedback, but not while renaming —
        // scaling a row mid-edit drags the text field with it.
        !edit.renaming && "active:bg-nav-active active:scale-[0.99] motion-press",
        // `data-cursor="menu"` on the band forces `cursor: pointer` on every
        // descendant, so the grab cursor has to be set on the row itself and win
        // on specificity. Not while renaming: a text field you cannot drag.
        // The cursor lives on the grip now, not the row.
        // Eligible first, so being ON the row always wins over merely being a
        // candidate.
        edit.drag?.eligible &&
          !edit.drag?.over &&
          "shadow-[inset_0_0_0_1px_var(--nav-divider)]",
        edit.drag?.over &&
          "shadow-[inset_0_0_0_1px_var(--nav-fg)] bg-nav-hover",
        /*
         * The row it came from reads as a hole, not as a ghost.
         *
         * At 40% opacity the row was still legible, so the list looked like it
         * had two of the thing being dragged. Emptying the slot — dashed outline,
         * contents hidden, height held — says "this is where it came from and it
         * is not there any more", which is the whole point of picking it up.
         */
        edit.drag?.lifted &&
          /*
       * Everything but the handle.
       *
       * `[&>*]:invisible` hid the grip too — and Chrome aborts a drag the instant
       * its source element stops being visible, so the row emptied out and the
       * gesture died in the same frame: dragstart, then dragend, no dragover in
       * between. The handle has to survive its own drag.
       */
      "bg-transparent outline-1 outline-dashed outline-[var(--nav-divider)] [&>*:not([data-drag-handle])]:invisible",
        // The drop ring wins while a drop is live — one ring at a time, and the
        // one answering the pointer is the one that matters.
        /*
         * Not while the name is being typed.
         *
         * A category is created empty and named second, so warning about it
         * mid-rename is telling the admin off for a step they are still on. The
         * ring arrives when the field closes, which is the first moment the
         * category is a finished thing that happens to be empty.
         */
        edit.warning &&
          !edit.renaming &&
          !edit.drag?.over &&
          "shadow-[inset_0_0_0_1px_var(--hr-warning-400)]",
      )}
      /*
       * The row receives drops; only its grip starts a drag.
       *
       * `draggable` on the row was the obvious wiring and it did not work: the
       * row is made of buttons — the icon, the label, the kebab — and a mousedown
       * inside a form control does not initiate an ancestor's drag in Chrome. The
       * only draggable pixels were the few of bare padding, so in practice
       * nothing dragged at all. A grip is the standard answer and the better
       * affordance: it says which pixels are the handle instead of leaving it to
       * be discovered.
       */
      // dragenter and dragover take the same answer — a target has to claim the
      // drag on the way in or it never gets asked again.
      onDragEnter={edit.drag?.onDragOver}
      onDragOver={edit.drag?.onDragOver}
      onDragLeave={edit.drag?.onDragLeave}
      onDrop={edit.drag?.onDrop}
      onDragEnd={edit.drag?.onDragEnd}
      onPointerEnter={onHover}
      onClick={edit.renaming ? undefined : onSelect}
    >
      {edit.drag && !edit.renaming ? (
        <span
          // A span, not a button: it has to be the element the browser starts the
          // drag from, and a button would swallow the mousedown the same way the
          // row's own children were doing.
          data-drag-handle=""
          draggable
          role="button"
          tabIndex={-1}
          aria-label={`Reorder ${item.label}`}
          title="Drag to reorder"
          onDragStart={edit.drag.onDragStart}
          onDragEnd={edit.drag.onDragEnd}
          // `data-cursor="menu"` on the band forces `cursor: pointer` on every
          // descendant, so the grab cursor has to be set here and win on
          // specificity.
          /*
           * Always visible in edit mode, not on hover.
           *
           * A handle you have to hover to discover is a handle nobody finds —
           * and in a mode whose whole point is rearranging, every row is
           * draggable, so every row should say so. It animates its own width in,
           * which is what slides the icon and label over instead of snapping
           * them.
           */
          className="motion-grip-in -ml-[5px] flex size-[16px] shrink-0 cursor-grab items-center justify-center overflow-hidden rounded-[4px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={13} aria-hidden="true" />
        </span>
      ) : null}

      {edit.onPickIcon ? (
        <IconTrigger onOpen={edit.onPickIcon}>{icon}</IconTrigger>
      ) : (
        icon
      )}

      {edit.renaming ? (
        <InlineRename
          value={edit.renameValue ?? item.label}
          onCommit={edit.onCommitRename}
          onCancel={edit.onCancelRename}
          ariaLabel={`Rename ${item.label}`}
          className="text-[length:var(--t-nav-font,14px)] leading-[normal]"
        />
      ) : labelTip ? (
        /*
          The label explains itself on hover, in the `tooltip` affordance.

          Wrapped rather than given a `title`: the pill has to arrive at once
          on a strip of text the pointer is already on, and it has to be the
          app's rather than the OS's. `above` anchors on the label's own
          centre, so a row carrying four other controls still says WHICH thing
          is being talked about. RailTooltip's wrapper is `display: contents`,
          so the row's flex layout is untouched.
        */
        <RailTooltip label={labelTip} placement="above">
          {labelButton}
        </RailTooltip>
      ) : (
        labelButton
      )}

      {/* Takes the width the label gave up, so the kebab and the chevron stay on
          the row's trailing edge rather than sliding in behind the text. */}
      {labelRenames && !edit.renaming ? (
        <span aria-hidden="true" className="min-w-0 flex-1 self-stretch" />
      ) : null}

      {edit.warning && !edit.renaming ? (
        <span
          title={edit.warning}
          aria-label={edit.warning}
          role="img"
          className="flex size-[20px] shrink-0 items-center justify-center text-[var(--hr-warning-500)]"
        >
          <TriangleAlert size={13} aria-hidden="true" />
        </span>
      ) : null}

      {!edit.renaming ? (
        <>
          {edit.onToggleHidden ? (
            <EditAffordance
              label={
                edit.hidden ? `Show ${item.label}` : `Hide ${item.label}`
              }
              onClick={edit.onToggleHidden}
              // Pinned once hidden: the only way back has to be visible.
              pinned={edit.hidden ?? false}
              className="-my-[2px]"
            >
              {edit.hidden ? (
                <EyeOff size={12} aria-hidden="true" />
              ) : (
                <Eye size={12} aria-hidden="true" />
              )}
            </EditAffordance>
          ) : null}
          {/*
            The pencil, on every editable row and on the blocked ones too.

            It used to appear only where there was no kebab, which left the
            commonest rows in the mode with no signifier at all: the label
            turned into a field when you clicked it, and nothing said so
            beforehand. Ashwin asked on Sep 28 for the affordance to be
            visible rather than discovered. Drawn beside the kebab rather than
            folded into it, because a menu is a thing you open to find out what
            is in it, and the whole complaint was about having to find out.

            Behind the axis since later that same day, when — having seen it —
            he asked for a quieter default that puts the same two answers on
            the label's own hover instead. See RENAME_AFFORDANCES.
          */}
          {renameAffordance !== "icon" ? null : edit.renameBlocked ? (
            edit.renameBlockedUniform ? null : (
              <EditAffordance
                label={edit.renameBlocked}
                disabled
                onClick={() => undefined}
                pinned={edit.pinned ?? false}
              >
                <Pencil size={11} aria-hidden="true" />
              </EditAffordance>
            )
          ) : (
            <EditAffordance
              label={`Rename ${item.label}`}
              onClick={edit.onStartRename}
              pinned={edit.pinned ?? false}
            >
              <Pencil size={11} aria-hidden="true" />
            </EditAffordance>
          )}
          {edit.onOpenMenu ? (
            <MenuAffordance
              label={`Edit ${item.label}`}
              onOpen={edit.onOpenMenu}
              pinned={edit.pinned ?? false}
            />
          ) : (
            <>
              {edit.onReset ? (
                <EditAffordance
                  label={`Reset ${item.label} to the shipped name`}
                  onClick={edit.onReset}
                  pinned={edit.pinned ?? false}
                >
                  <RotateCcw size={11} aria-hidden="true" />
                </EditAffordance>
              ) : null}
            </>
          )}
          {/*
            In edit mode the hover chevron is dropped outright — element,
            column and all — rather than faded. See NAV_CHEVRONS.

            Outside edit mode it is hidden with opacity because the 15px
            column is what the label's truncation is measured against, so a
            row that dropped it would re-flow its own text under the
            pointer. Edit mode has no such problem: NO row has a chevron
            there, so the column is 15px of nothing on every row, and the
            kebab is held one glyph short of the edit affordances it belongs
            with. Taking the column away puts the kebab where the chevron
            was, which is the rightmost thing in the row either way.
            Ashwin, Oct 6.
          */}
          {editChevronGone ? null : (
            <>
              {chevron}
              {/* And the slot held empty when there is no chevron, so the eye
                  and kebab sit in one column down the whole list. */}
              {chevron === null ? (
                <span aria-hidden="true" className="w-[15px] shrink-0" />
              ) : null}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}

/**
 * The kebab. Same 20px box as the pencil it replaces, so the row's trailing
 * cluster keeps its width whichever affordance is showing.
 *
 * It passes its own element up rather than a rect: the menu captures the anchor
 * on open, and the trigger is the only thing that knows where it ended up after
 * the list it sits in has been scrolled.
 */
function MenuAffordance({
  label,
  onOpen,
  pinned,
}: {
  label: string;
  onOpen: (trigger: HTMLElement) => void;
  pinned: boolean;
}) {
  return (
    <EditAffordance label={label} onClick={onOpen} pinned={pinned}>
      <EllipsisVertical size={13} aria-hidden="true" />
    </EditAffordance>
  );
}

/**
 * The depth guides, drawn per row so they read as lines down the branch.
 *
 * One `inset-y-0` rule per ancestor level: consecutive rows each draw their
 * own segment, the segments abut because the rows do, and what the eye gets is
 * an unbroken rule that starts where the branch opened and stops where it
 * closed — with no wrapper around the run, which is what a branch-level
 * element would have needed. That matters here because a branch is not a DOM
 * subtree: `ProductTreeBranch` renders its rows and its children as siblings
 * in one flat flow (see the fragment it returns), precisely so the hover fill
 * and the seams treat the whole tree as one list.
 *
 * `left` is computed rather than classed because it depends on the level, and
 * Tailwind scans source text — a `left-[calc(...${k}...)]` is a class nothing
 * ever emits. The formula mirrors the row's own indent literal for literal: `k`
 * of the 16px tight steps, then 8px to land in the middle of the step. Rails
 * are only ever drawn on rows carrying `tightIndent` — `treeIcons: "rails"`
 * sets both — so the two cannot drift.
 *
 * No `--t-nav-px` in it, and that is the fix for the rail that used to sit
 * under the selected row's own fill: the indent is a margin, so a row at depth
 * `d` has its left EDGE at `d * 16px` and its innermost rail belongs in the
 * gutter before it, not 8px into it. Half a step short of the edge puts every
 * rail in the middle of its own column and leaves the fill a clear 8px.
 */
function RowRails({ rails, wide }: { rails: number; wide: boolean }) {
  return (
    <span
      aria-hidden="true"
      /*
       * Half the row gap taller than the row, top and bottom.
       *
       * The rows are a flex column with `--t-nav-space` between them, so an
       * `inset-y-0` rail stops at each row's box and the guide came out as a
       * dashed line — which reads as a decorative rule rather than as the one
       * continuous thing that says "all of this is inside that". Overhanging
       * half the gap at each end makes consecutive segments meet exactly, and
       * at the ends of a run it tucks the rail a pixel under the row above and
       * below, which is where a file tree's guide starts and stops anyway.
       */
      className="pointer-events-none absolute left-0 w-full"
      style={{
        top: "calc(var(--t-nav-space, 2px) / -2)",
        bottom: "calc(var(--t-nav-space, 2px) / -2)",
      }}
    >
      {Array.from({ length: rails }, (_, level) => (
        <span
          key={level}
          className={cn(
            "absolute inset-y-0 w-px",
            /*
             * Every rail the same weight: divider, which is gray 200 in the
             * light themes and the theme's own hairline in the dark ones.
             *
             * The innermost rail used to be a step darker, to say which level
             * the run in front of you belonged to. On the screen it read as a
             * defect rather than as emphasis — the same vertical line changed
             * colour partway down, at a row whose own fill was already saying
             * where you are, so the two marks argued and the darker segment
             * looked like a rendering bug. Scaffolding is allowed to be one
             * colour.
             */
            "bg-nav-divider",
          )}
          style={{
            /*
             * Tight: `k` bare steps, then half a step to sit in the middle of
             * the gutter. Wide: the same idea against a step that also pays
             * for a glyph and its gap — `k + 1.5` steps puts the line midway
             * between the product's indent and its page's, which is the empty
             * column the glyph would have occupied one level down.
             */
            left: wide
              ? `calc(${level + 1.5} * (16px + var(--t-nav-gap, 10px)))`
              : `calc(${level} * 16px + 8px)`,
          }}
        />
      ))}
    </span>
  );
}

function RowIcon({
  item,
  active,
  dimmed = false,
  glyph,
}: {
  item: NavItem;
  active: boolean;
  dimmed?: boolean;
  /** The marked row's own glyph size, where the axis asks for one. */
  glyph?: string | false;
}) {
  const Icon = item.icon;
  /*
   * No glyph, and no column held open for one either. See `NavItem.iconHidden`.
   *
   * First, ahead of the AI sparkle and ahead of the "no icon at all" bail: the
   * flag is the tree saying this level draws no glyph, and a level that made an
   * exception for one row would be a level whose labels do not line up.
   *
   * The blank that used to stand here was the earlier reading of the axis — the
   * glyph goes, its column stays — and on the screen it was a band of empty
   * gutter beside every page name, saying nothing and costing 26px of the 272
   * the nav has to spend on labels. Dropping the element drops the row's flex
   * gap with it, so a glyphless child's label lands exactly on its parent's,
   * which is the alignment the row's own `pl-` steps were written for.
   *
   * The indent is padding, and the rails are absolutely positioned off the same
   * steps, so neither moves: what changes is only where the label starts inside
   * an already-indented row.
   */
  if (item.iconHidden) return null;
  if (item.ai) return <NavAiSparkle className="text-nav-ai-icon" />;
  if (!Icon) return null;
  return (
    <Icon
      size={16}
      aria-hidden="true"
      style={{ width: "var(--t-nav-icon, 16px)", height: "var(--t-nav-icon, 16px)" }}
      className={cn(
        // Grows to exactly the hover size the knob names — the ratio is computed
        // in tuningToCssVars, because CSS cannot divide one length by another.
        "shrink-0 motion-tap group-hover:scale-[var(--t-nav-icon-scale,1.143)]",
        active ? "text-nav-fg" : "text-nav-fg-muted group-hover:text-nav-fg",
        dimmed && "opacity-40",
        // Redeclares --t-nav-icon on this element, which the width and
        // height above already read. See NAV_SELECTED_ICON_DEFAULT.
        glyph,
      )}
    />
  );
}

/**
 * Makes the row's own icon the icon picker's trigger.
 *
 * No separate button: the thing you want to change is right there, and a nav row
 * has no room for a control that duplicates it. The dashed ring on hover is the
 * only hint that the glyph is now editable.
 */
function IconTrigger({
  onOpen,
  children,
}: {
  onOpen: (trigger: HTMLElement) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label="Change icon"
      title="Change icon"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(e.currentTarget);
      }}
      className="motion-tap -m-[3px] flex shrink-0 items-center justify-center rounded-[5px] p-[3px] outline-[1px] outline-offset-0 outline-transparent group-hover/row:outline-dashed group-hover/row:outline-[var(--nav-divider)] hover:bg-nav-hover"
    >
      {children}
    </button>
  );
}
