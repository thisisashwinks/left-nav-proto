"use client";

import * as React from "react";
import { ChevronDown, EllipsisVertical, GripVertical } from "lucide-react";
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
 * What editing this row offers, when the nav is in edit mode and this panel
 * belongs to a category.
 *
 * The panel owns it rather than the row: which row is being renamed is one
 * decision for the whole list, and the drag needs to know a row's position
 * among its siblings, which only the list knows.
 */
export interface FlyoutRowEdit {
  renaming: boolean;
  onStartRename: () => void;
  onCommitRename: (next: string) => void;
  onCancelRename: () => void;
  onOpenMenu: (trigger: HTMLElement) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  over: boolean;
  lifted: boolean;
}

interface FlyoutRowProps {
  item: FlyoutItem;
  variant: FlyoutItemVariant;
  active?: boolean;
  /** Position in the stagger sequence when the panel opens. */
  rowIndex?: number;
  /** Start expanded — set when this row is the panel's only expandable one. */
  defaultOpen?: boolean;
  onSelect?: (id: string) => void;
  edit?: FlyoutRowEdit;
}

export function FlyoutRow({
  item,
  variant,
  active = false,
  rowIndex = 0,
  defaultOpen = false,
  onSelect,
  edit,
}: FlyoutRowProps) {
  const v = VARIANT[variant];
  const Icon = item.icon;
  /*
   * When the review axis is on, a tabs-parent discloses like any other parent —
   * its tabs become nav rows and pages. Read here rather than threaded through
   * FlyoutPanel and group-flyout, because this is the only place the decision
   * changes anything.
   */
  const { tabsInNav } = useTheme();
  /** Only rows that map to a pinnable product get a pin. */
  const pinnable = productById(item.id) !== undefined;
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
    // Replaces the padding the pin used to occupy as a flex child. Editing
    // reuses it for the kebab, which stands exactly where the pin was — you
    // are not favouriting a row while you are restructuring the nav, and
    // sharing the column is what keeps every measurement in this file true.
    (pinnable || edit) && v.pinReserve,
    active ? "bg-nav-hover" : "hover:bg-nav-hover",
    !edit?.renaming && "active:scale-[0.99] motion-press",
    // The grab cursor lives on the grip, not the row.
    edit?.over && "bg-nav-hover shadow-[inset_0_0_0_1px_var(--brand)]",
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
  const onRowClick = () =>
    hasChildren ? setOpen((o) => !o) : onSelect?.(item.id);

  const inner = (
    <>
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

      <div className={cn("flex h-fit flex-1 flex-col items-start", v.text)}>
        <div className="flex w-full shrink-0 items-center gap-[7px]">
          {edit?.renaming ? (
            <InlineRename
              value={item.label}
              onCommit={edit.onCommitRename}
              onCancel={edit.onCancelRename}
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
                // In edit mode the text is the rename target, same as in the
                // nav. The row itself keeps its own job — expanding, or opening
                // the page — so the two gestures stay separate targets.
                edit && "-mx-[3px] rounded-[4px] px-[3px] hover:bg-nav-active",
              )}
              {...(edit
                ? {
                    role: "button",
                    tabIndex: 0,
                    onClick: (e: React.MouseEvent) => {
                      e.stopPropagation();
                      edit.onStartRename();
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

        {item.description ? (
          <span
            className={cn("text-left text-nav-fg-subtle font-normal", v.desc)}
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
      {hasChildren ? (
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={cn(
            "ml-auto mt-[3px] shrink-0 self-start text-nav-fg-subtle motion-move",
            open && "rotate-180",
          )}
        />
      ) : null}
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
  const withTrailing = (node: React.ReactNode) =>
    edit ? (
      <div className="group/row relative w-full shrink-0">
        {node}
        {edit.renaming ? null : (
          <span className={cn("absolute right-[8px] z-10", v.pinTop)}>
            <EditAffordance
              label={`Edit ${item.label}`}
              onClick={edit.onOpenMenu}
              pinned
            >
              <EllipsisVertical size={13} aria-hidden="true" />
            </EditAffordance>
          </span>
        )}
      </div>
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
            onSelect={onSelect}
            tabsInNav={tabsInNav}
          />
        </div>
      ) : null}
    </div>
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
  onSelect,
  tabsInNav,
}: {
  nodes: readonly FlyoutChildItem[];
  depth: number;
  onSelect?: (id: string) => void;
  tabsInNav: boolean;
}) {
  return (
    <div
      className={cn(
        "motion-menu-in mt-[2px] flex w-auto flex-col gap-[1px] border-l border-[var(--nav-divider,var(--nav-border))] pr-[8px]",
        depth === 0 ? "ml-[19px] pl-[13px]" : "ml-[9px] pl-[11px]",
      )}
    >
      {nodes.map((child) => (
        <FlyoutChildRow
          key={child.id}
          child={child}
          depth={depth}
          onSelect={onSelect}
          tabsInNav={tabsInNav}
        />
      ))}
    </div>
  );
}

function FlyoutChildRow({
  child,
  depth,
  onSelect,
  tabsInNav,
}: {
  child: FlyoutChildItem;
  depth: number;
  onSelect?: (id: string) => void;
  tabsInNav: boolean;
}) {
  const nested =
    (child.children?.length ?? 0) > 0 &&
    (tabsInNav || !child.tabs) &&
    depth < MAX_CHILD_DEPTH;
  const [open, setOpen] = React.useState(false);
  const panelId = React.useId();

  return (
    <div className="relative w-full">
      <button
        type="button"
        aria-expanded={nested ? open : undefined}
        aria-controls={nested ? panelId : undefined}
        onClick={() => (nested ? setOpen((o) => !o) : onSelect?.(child.id))}
        className={cn(
          "motion-tap flex h-[30px] w-full items-center gap-[7px] rounded-[7px] px-[9px] text-left leading-[normal] font-medium text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg active:scale-[0.99]",
          // One notch down per level, so depth is legible without a marker.
          depth === 0 ? "text-[13px]" : "text-[12.5px]",
        )}
      >
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
      </button>
      {nested && open ? (
        <div id={panelId}>
          <FlyoutChildRows
            nodes={child.children ?? []}
            depth={depth + 1}
            onSelect={onSelect}
            tabsInNav={tabsInNav}
          />
        </div>
      ) : null}
    </div>
  );
}
