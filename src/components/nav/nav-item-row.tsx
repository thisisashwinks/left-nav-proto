"use client";

import * as React from "react";
import { ChevronRight, Pencil, RotateCcw } from "lucide-react";
import { NavAiSparkle } from "@/components/icons/ai-sparkle";
import { cn } from "@/lib/utils";
import { EditAffordance, InlineRename } from "./inline-rename";
import type { NavItem } from "./types";

/**
 * What editing this row offers. Absent when edit mode is off or the role has no
 * permission, which is what keeps the read-only row exactly as it was designed.
 */
export interface NavRowEdit {
  renaming: boolean;
  onStartRename: () => void;
  onCommitRename: (next: string) => void;
  onCancelRename: () => void;
  /** Absent when the role may not change icons. */
  onPickIcon?: (trigger: HTMLElement) => void;
  /** Present only when this row is showing an override to clear. */
  onReset?: () => void;
}

interface NavItemRowProps {
  item: NavItem;
  active?: boolean;
  onSelect?: () => void;
  /** Pointer entered — used to preview this row's flyout. */
  onHover?: () => void;
  edit?: NavRowEdit;
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
 */
export function NavItemRow({
  item,
  active = false,
  onSelect,
  onHover,
  edit,
}: NavItemRowProps) {
  const compact = item.density === "compact";

  const rowClass = cn(
    "flex w-full shrink-0 items-center text-left",
    "gap-[var(--t-nav-gap,10px)] rounded-[var(--t-nav-radius,7px)] px-[var(--t-nav-px,8px)]",
    "motion-tap",
    // Compact rows keep their tighter padding proportionally.
    compact ? "py-[calc(var(--t-nav-py,9px)*0.667)]" : "py-[var(--t-nav-py,9px)]",
  );

  const icon = <RowIcon item={item} active={active} />;

  const label = (
    <span
      className={cn(
        "truncate text-[length:var(--t-nav-font,14px)] leading-[normal]",
        item.hasFlyout ? "flex-1" : "whitespace-nowrap",
        item.ai ? "text-nav-ai-fg" : "text-nav-fg",
      )}
    >
      {item.label}
    </span>
  );

  const chevron = item.hasFlyout ? (
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
      )}
    />
  ) : null;

  if (!edit) {
    return (
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={onSelect}
        onPointerEnter={onHover}
        onFocus={onHover}
        className={cn(
          rowClass,
          "group",
          active ? "bg-nav-hover" : "hover:bg-nav-hover active:bg-nav-active",
          "active:scale-[0.99] motion-press",
        )}
      >
        {icon}
        {label}
        {chevron}
      </button>
    );
  }

  return (
    <div
      // `group/row` rather than a bare group: the affordances key off this row
      // specifically, and an unnamed group would also match any hovered ancestor.
      className={cn(rowClass, "group/row group", active && "bg-nav-hover", "hover:bg-nav-hover")}
      onPointerEnter={onHover}
    >
      {edit.onPickIcon ? (
        <IconTrigger onOpen={edit.onPickIcon}>{icon}</IconTrigger>
      ) : (
        icon
      )}

      {edit.renaming ? (
        <InlineRename
          value={item.label}
          onCommit={edit.onCommitRename}
          onCancel={edit.onCancelRename}
          ariaLabel={`Rename ${item.label}`}
          className="text-[length:var(--t-nav-font,14px)] leading-[normal]"
        />
      ) : (
        <button
          type="button"
          aria-current={active ? "page" : undefined}
          onClick={onSelect}
          onFocus={onHover}
          // Fills the row so the whole width still navigates. `min-w-0` lets the
          // label truncate instead of pushing the affordances out of the nav.
          className="flex min-w-0 flex-1 items-center text-left"
        >
          {label}
        </button>
      )}

      {!edit.renaming ? (
        <>
          <EditAffordance label={`Rename ${item.label}`} onClick={edit.onStartRename}>
            <Pencil size={11} aria-hidden="true" />
          </EditAffordance>
          {edit.onReset ? (
            <EditAffordance
              label={`Reset ${item.label} to the shipped name`}
              onClick={edit.onReset}
            >
              <RotateCcw size={11} aria-hidden="true" />
            </EditAffordance>
          ) : null}
          {chevron}
        </>
      ) : null}
    </div>
  );
}

function RowIcon({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  if (item.ai) return <NavAiSparkle className="text-nav-ai-icon" />;
  if (!Icon) return null;
  return (
    <Icon
      size={16}
      aria-hidden="true"
      style={{ width: "var(--t-nav-icon, 16px)", height: "var(--t-nav-icon, 16px)" }}
      className={cn(
        "shrink-0 motion-tap group-hover:scale-110",
        active ? "text-nav-fg" : "text-nav-fg-muted group-hover:text-nav-fg",
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
