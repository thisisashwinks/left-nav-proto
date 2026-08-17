"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Plus, Search, X } from "lucide-react";
import {
  groupIdForProduct,
  iconForProduct,
  labelForProduct,
  UNGROUPED_ID,
  type NavLayoutState,
  type ResolvedGroup,
} from "@/components/nav/grouping";
import { ResolvedIcon } from "@/components/nav/resolved-icon";
import { cn } from "@/lib/utils";

/**
 * The moving parts of the tree editor.
 *
 * Filing is a select rather than drag and drop on purpose: a settings page is
 * read as often as it is edited, so every product states where it sits in words
 * you can scan down a column — and the same control works from a keyboard, at
 * 200% zoom, and on the trackpad of a laptop in a client meeting.
 */

/** Where a product sits, as a control that moves it. */
export function MoveSelect({
  productLabel,
  currentGroupId,
  groups,
  onMove,
}: {
  /** Only for the accessible name — filing is keyed by id upstream. */
  productLabel: string;
  /** null when the product sits at top level. */
  currentGroupId: string | null;
  groups: ResolvedGroup[];
  onMove: (groupId: string | null) => void;
}) {
  return (
    <select
      aria-label={`Move ${productLabel} to another group`}
      value={currentGroupId ?? UNGROUPED_ID}
      onChange={(e) =>
        onMove(e.target.value === UNGROUPED_ID ? null : e.target.value)
      }
      className="h-[28px] max-w-[168px] rounded-[7px] bg-pg-surface pr-[6px] pl-[8px] text-[12px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading focus:shadow-[inset_0_0_0_1.5px_var(--brand)] focus:outline-none"
    >
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.label}
        </option>
      ))}
      <option value={UNGROUPED_ID}>Top level — no group</option>
    </select>
  );
}

/** Up and down, for order that is a preference rather than a drag. */
export function NudgeButtons({
  label,
  onMove,
  canUp,
  canDown,
}: {
  label: string;
  onMove: (delta: number) => void;
  canUp: boolean;
  canDown: boolean;
}) {
  const btn =
    "motion-tap flex size-[22px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading disabled:cursor-not-allowed disabled:opacity-30";
  return (
    <span className="flex shrink-0 items-center">
      <button type="button" aria-label={`Move ${label} up`} disabled={!canUp} onClick={() => onMove(-1)} className={btn}>
        <ChevronUp size={14} aria-hidden="true" />
      </button>
      <button type="button" aria-label={`Move ${label} down`} disabled={!canDown} onClick={() => onMove(1)} className={btn}>
        <ChevronDown size={14} aria-hidden="true" />
      </button>
    </span>
  );
}

/**
 * The picker behind "Add products".
 *
 * Lists this account's products and says where each one currently sits, because
 * adding to a group is always a move — a product lives in one place, and the
 * honest version of the control admits what it is taking it away from.
 */
export function AddProductsPanel({
  state,
  groups,
  targetGroupId,
  onAdd,
  onClose,
}: {
  state: NavLayoutState;
  groups: ResolvedGroup[];
  targetGroupId: string;
  onAdd: (productId: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const target = groups.find((g) => g.id === targetGroupId);
  const candidates = state.enabledProducts.filter(
    (id) => !target?.productIds.includes(id),
  );
  const needle = query.trim().toLowerCase();
  const shown = needle
    ? candidates.filter((id) =>
        labelForProduct(state, id).toLowerCase().includes(needle),
      )
    : candidates;

  return (
    <div className="mt-[8px] rounded-[10px] bg-pg-bg p-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex items-center gap-[8px]">
        <label className="flex h-[30px] min-w-0 flex-1 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
          <Search size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Add to ${target?.label ?? "this group"}`}
            aria-label="Search products to add"
            className="min-w-0 flex-1 bg-transparent text-[12.5px] leading-none text-pg-heading placeholder:text-pg-faint focus:outline-none"
          />
        </label>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>

      <div className="mt-[8px] flex max-h-[188px] flex-col gap-[2px] overflow-y-auto">
        {shown.length === 0 ? (
          <p className="px-[4px] py-[6px] text-[12px] leading-[16px] text-pg-muted">
            {candidates.length === 0
              ? "Every product this account is on is already in this group."
              : `Nothing matches “${query.trim()}”.`}
          </p>
        ) : null}
        {shown.map((id) => {
          const from = groupIdForProduct(state, id);
          const fromLabel =
            from === null
              ? "Top level"
              : (groups.find((g) => g.id === from)?.label ?? "Another group");
          return (
            <button
              key={id}
              type="button"
              onClick={() => onAdd(id)}
              className="motion-tap flex items-center gap-[8px] rounded-[7px] px-[6px] py-[6px] text-left hover:bg-pg-surface"
            >
              <ResolvedIcon icon={iconForProduct(state, id)} size={14} className="text-pg-muted" />
              <span className="min-w-0 flex-1 truncate text-[12.5px] leading-[17px] font-medium text-pg-heading">
                {labelForProduct(state, id)}
              </span>
              <span className="shrink-0 text-[11px] leading-none text-pg-faint">
                in {fromLabel}
              </span>
              <Plus size={13} aria-hidden="true" className="shrink-0 text-pg-muted" />
            </button>
          );
        })}
      </div>

      <p className="mt-[8px] px-[4px] text-[11px] leading-[15px] text-pg-faint">
        Only products this account is on appear here. What it is on is set in
        Features and Limits.
      </p>
    </div>
  );
}

/** One product inside a group, or one top-level row. */
export function ProductRow({
  state,
  productId,
  groups,
  currentGroupId,
  editable,
  onMove,
  nudge,
  last,
}: {
  state: NavLayoutState;
  productId: string;
  groups: ResolvedGroup[];
  currentGroupId: string | null;
  editable: boolean;
  onMove: (groupId: string | null) => void;
  /** Absent for top-level rows, whose order is the catalogue's. */
  nudge?: { onMove: (delta: number) => void; canUp: boolean; canDown: boolean };
  last: boolean;
}) {
  const label = labelForProduct(state, productId);
  return (
    <div
      className={cn(
        "flex items-center gap-[10px] py-[7px] pl-[28px]",
        !last && "shadow-[inset_0_-1px_0_0_var(--pg-border)]",
      )}
    >
      <ResolvedIcon icon={iconForProduct(state, productId)} size={14} className="text-pg-muted" />
      <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-text">
        {label}
      </span>
      {editable && nudge ? (
        <NudgeButtons label={label} onMove={nudge.onMove} canUp={nudge.canUp} canDown={nudge.canDown} />
      ) : null}
      {editable ? (
        <MoveSelect
          productLabel={label}
          currentGroupId={currentGroupId}
          groups={groups}
          onMove={onMove}
        />
      ) : null}
    </div>
  );
}
