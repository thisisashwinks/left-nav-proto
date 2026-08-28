"use client";

import * as React from "react";
import {
  ChevronDown,
  EllipsisVertical,
  Eye,
  EyeOff,
  GripVertical,
} from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { EditAffordance, InlineRename } from "@/components/nav/inline-rename";
import { WithPin } from "@/components/nav/with-pin";
import { productById } from "@/components/nav/catalogue";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
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

/**
 * Per-variant geometry, read off the Pencil export. The differences are small
 * but real — gap, vertical alignment, icon size, and title weight all shift
 * between the product panels and the Favorites/Recent/Quick Actions panels.
 */
const VARIANT = {
  product: {
    row: "gap-[var(--t-fly-gap,10px)] px-[8px] py-[var(--t-fly-py,9px)] items-start",
    iconBox: "w-[24px] h-[22px]",
    iconSize: 20,
    text: "gap-[2px]",
    title: "font-semibold whitespace-nowrap",
    desc: "text-[length:var(--t-fly-desc,12.5px)] leading-[17px] w-full",
    // Space held for the pin, which is no longer a flex child. Exactly the pin's
    // 22px plus the gap it used to sit behind, so the text wraps where it did.
    pinReserve: "pr-[calc(8px+22px+var(--t-fly-gap,10px))]",
    // items-start rows align the pin with the title, not the row's middle.
    pinTop: "top-[var(--t-fly-py,9px)]",
  },
  compact: {
    row: "gap-[calc(var(--t-fly-gap,10px)+1px)] px-[8px] py-[var(--t-fly-py,9px)] items-center",
    iconBox: "w-[24px] h-[22px]",
    iconSize: 19,
    text: "gap-[1px]",
    title: "font-semibold whitespace-nowrap",
    desc: "text-[length:var(--t-fly-desc,12.5px)] leading-[normal] whitespace-nowrap",
    pinReserve: "pr-[calc(8px+22px+var(--t-fly-gap,10px)+1px)]",
    pinTop: "top-1/2 -translate-y-1/2",
  },
  recent: {
    row: "gap-[11px] p-[8px] items-center",
    iconBox: "w-[26px] h-[22px]",
    iconSize: 19,
    text: "gap-[1px]",
    title: "font-medium whitespace-nowrap",
    desc: "text-[12px] leading-[normal] whitespace-nowrap",
    pinReserve: "pr-[41px]",
    pinTop: "top-1/2 -translate-y-1/2",
  },
  action: {
    row: "gap-[var(--t-fly-gap,10px)] px-[8px] py-[var(--t-fly-py,9px)] items-center",
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
}: FlyoutRowProps) {
  const v = VARIANT[variant];
  const Icon = item.icon;
  /*
   * When the review axis is on, a tabs-parent discloses like any other parent —
   * its tabs become nav rows and pages. Read here rather than threaded through
   * FlyoutPanel and group-flyout, because this is the only place the decision
   * changes anything.
   */
  const { tabsInNav, l2ClickAction } = useTheme();
  /** Only rows that map to a pinnable product get a pin. */
  const pinnable = productById(item.id) !== undefined;
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
  const [open, setOpen] = React.useState(defaultOpen);
  const panelId = React.useId();

  const rowClass = cn(
    "motion-row-in group group/row flex w-full shrink-0 rounded-[9px] text-left",
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
    pinnable && !edit && v.pinReserve,
    active ? "bg-nav-hover" : "hover:bg-nav-hover",
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
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (l2ClickAction !== "open-first") return;
    const first = firstPlaceUnder(item.children, tabsInNav);
    if (first) onSelect?.(first, true);
  };

  const iconBox = (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center",
          // The icon leans in a touch on hover — enough to feel responsive
          // without shifting the text beside it.
          "motion-tap group-hover:scale-110",
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
              width: "var(--t-fly-icon, 20px)",
              height: "var(--t-fly-icon, 20px)",
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

      <div className={cn("flex h-fit flex-1 flex-col items-start", v.text)}>
        <div className="flex w-full shrink-0 items-center gap-[7px]">
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
              className={cn(
                "text-[length:var(--t-fly-title,14px)] leading-[normal] text-nav-fg",
                v.title,
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
        {hasChildren ? (
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={cn(
              "shrink-0 text-nav-fg-subtle motion-move",
              open && "rotate-180",
            )}
          />
        ) : edit && !edit.renaming ? (
          /*
           * The slot, held empty.
           *
           * Without it a leaf row's kebab slides into the chevron's place and the
           * column of controls zig-zags down the list — the eye and the kebab
           * have to be in the same place on every row for the cluster to read as
           * one column you can aim at. Only in edit mode: outside it there is no
           * column, and a leaf row should simply be narrower.
           */
          <span aria-hidden="true" className="w-[14px] shrink-0" />
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
      type="button"
      aria-current={active ? "true" : undefined}
      aria-expanded={hasChildren ? open : undefined}
      aria-controls={hasChildren ? panelId : undefined}
      onClick={onRowClick}
      style={rowStyle}
      className={rowClass}
    >
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
      <WithPin productId={item.id} pinClass={v.pinTop}>
        {node}
      </WithPin>
    );

  if (!hasChildren) return withTrailing(row);

  return (
    <div className="relative w-full shrink-0">
      {withTrailing(row)}
      {open ? (
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
  children,
  ...rest
}: {
  edit?: FlyoutChildEdit;
  /** Empty for a row that discloses — see WithPin's own note. */
  childId: string;
  children: React.ReactNode;
  onClick: () => void;
  className: string;
  "aria-current"?: "page" | undefined;
  "aria-expanded"?: boolean | undefined;
  "aria-controls"?: string | undefined;
}) {
  if (edit) {
    return (
      <div
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
    <WithPin productId={childId}>
      <button type="button" {...rest}>
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
function FlyoutChildRows({
  nodes,
  depth,
  activeId,
  onSelect,
  tabsInNav,
  edit,
}: {
  nodes: readonly FlyoutChildItem[];
  depth: number;
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
        "motion-menu-in mt-[2px] flex w-auto flex-col gap-[1px]",
        depth === 0 ? "ml-[19px] pl-[14px]" : "ml-[9px] pl-[12px]",
      )}
    >
      {nodes.map((child) => (
        <FlyoutChildRow
          key={child.id}
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
}: {
  child: FlyoutChildItem;
  depth: number;
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
  const nested =
    (child.children?.length ?? 0) > 0 &&
    (tabsInNav || !child.tabs) &&
    depth < MAX_CHILD_DEPTH;
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();

  return (
    <div className="relative w-full">
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
        childId={nested ? "" : child.id}
        aria-current={child.id === activeId ? "page" : undefined}
        aria-expanded={nested ? open : undefined}
        aria-controls={nested ? panelId : undefined}
        onClick={() => {
          // The same bargain the L2 rows strike — see `onRowClick` above.
          if (!nested) {
            onSelect?.(child.id);
            return;
          }
          if (open) {
            setOpen(false);
            return;
          }
          setOpen(true);
          if (openFirst) {
            const first = firstPlaceUnder(child.children, tabsInNav, depth + 1);
            if (first) onSelect?.(first, true);
          }
        }}
        className={cn(
          "motion-tap flex h-[30px] w-full items-center gap-[7px] rounded-[7px] px-[9px] text-left leading-[normal] font-medium text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg active:scale-[0.99]",
          // The same fill an active row wears anywhere else in the nav, so
          // "you are here" looks the same at every level.
          child.id === activeId && "bg-nav-hover text-nav-fg",
          // The pin's own width plus the gap the L2 rows leave in front of
          // theirs — stated the same way so retuning the flyout gap moves both.
          // Not while editing: the kebab is a flex child there, so the trailing
          // column is real width rather than reserved space behind an overlay.
          !nested && !edit && "pr-[calc(8px+22px+var(--t-fly-gap,10px))]",
          edit && "pr-[4px]",
          // One notch down per level, so depth is legible without a marker.
          depth === 0 ? "text-[13px]" : "text-[12.5px]",
        )}
      >
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
        <span className="truncate">{child.label}</span>
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
        {nested ? (
          <ChevronDown
            size={13}
            aria-hidden="true"
            className={cn(
              "ml-auto shrink-0 text-nav-fg-subtle motion-move",
              open && "rotate-180",
            )}
          />
        ) : null}
        {edit ? (
          <span className={cn("shrink-0", !nested && "ml-auto")}>
            <EditAffordance
              label={`Edit ${child.label}`}
              onClick={(trigger) => edit.onOpenMenu(child.id, trigger)}
              pinned
            >
              <EllipsisVertical size={12} aria-hidden="true" />
            </EditAffordance>
          </span>
        ) : null}
      </Row>
      </ChildShell>
      {nested && open ? (
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
