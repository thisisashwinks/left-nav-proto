"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, GripVertical, Info, Trash2 } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { TextInput, Toggle } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { cn } from "@/lib/utils";
import { DEFAULT_COLUMNS, type ColumnSetting } from "./tasks-data";

/* ─── Delete (58) ───────────────────────────────────────────────────────── */

export function DeleteTasksModal({
  titles,
  onClose,
  onConfirm,
}: {
  /** One title for a single delete; several for a bulk one. */
  titles: string[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const one = titles.length === 1;
  const n = titles.length.toLocaleString("en-US");
  return (
    <Modal
      width={520}
      onClose={onClose}
      icon={
        <span className="flex size-[40px] items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--hr-error-600)_12%,transparent)] text-[var(--hr-error-600)]">
          <Trash2 size={20} aria-hidden="true" />
        </span>
      }
      title={one ? `Delete task ${titles[0]}?` : `Delete ${n} tasks?`}
      footer={
        <>
          <OutlineButton className="h-[36px] text-[14px]" onClick={onClose}>
            Cancel
          </OutlineButton>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="flex h-[36px] items-center rounded-[8px] bg-[var(--hr-error-600)] px-[16px] text-[14px] font-semibold text-white motion-tap hover:brightness-110 active:scale-[0.97]"
          >
            {one ? "Delete task" : `Delete ${n} tasks`}
          </button>
        </>
      }
    >
      <p className="-mt-[6px] text-[14px] leading-[20px] text-pg-muted">
        {one ? "Are you sure you want to delete this task?" : "Are you sure you want to delete these tasks?"}
      </p>
      <div className="mt-[12px] mb-[8px] flex items-center gap-[10px] rounded-[8px] bg-pg px-[14px] py-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <Info size={18} aria-hidden="true" className="shrink-0 text-pg-muted" />
        Deleted tasks can be restored within 2 months.
      </div>
    </Modal>
  );
}

/* ─── + List ────────────────────────────────────────────────────────────── */

export function NewListModal({
  summary,
  onClose,
  onCreate,
}: {
  /** What the new list will hold — the filters it snapshots. */
  summary: string;
  onClose: () => void;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = React.useState("");
  const ok = name.trim().length > 0;
  return (
    <Modal
      width={440}
      onClose={onClose}
      title="Create list"
      footer={
        <>
          <OutlineButton className="h-[36px] text-[14px]" onClick={onClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton
            className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
            disabled={!ok}
            onClick={() => onCreate(name.trim())}
          >
            Create list
          </PrimaryButton>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) onCreate(name.trim());
        }}
        className="flex flex-col gap-[4px]"
      >
        <label htmlFor="task-list-name" className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
          List name
        </label>
        <TextInput
          id="task-list-name"
          autoFocus
          maxLength={40}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. My follow-ups"
        />
        <span className="pt-[4px] text-[13px] leading-[18px] text-pg-muted">Saves the current filters: {summary}.</span>
      </form>
    </Modal>
  );
}

/* ─── Manage fields ─────────────────────────────────────────────────────── */

export function ManageFieldsDrawer({
  columns,
  onChange,
  onClose,
}: {
  columns: ColumnSetting[];
  onChange: (c: ColumnSetting[]) => void;
  onClose: () => void;
}) {
  const [dragId, setDragId] = React.useState<string | null>(null);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= columns.length || from === to) return;
    const next = [...columns];
    const [c] = next.splice(from, 1);
    next.splice(to, 0, c);
    onChange(next);
  };

  const fixed = (label: string) => (
    <div className="flex h-[44px] items-center gap-[10px] rounded-[8px] bg-pg px-[12px] text-[14px] leading-[20px] text-pg-muted">
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-[13px] leading-[18px] text-pg-faint">Always shown</span>
    </div>
  );

  return (
    <>
      <button
        type="button"
        aria-label="Close manage fields"
        tabIndex={-1}
        onClick={onClose}
        className="motion-fade-in fixed inset-0 z-[79] cursor-default bg-[#10182866]"
      />
      <SideDrawer
        width={360}
        onClose={onClose}
        title={<span className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">Manage fields</span>}
        bodyClassName="px-[16px]"
        footer={
          <div className="flex w-full items-center gap-[12px] px-[2px]">
            <OutlineButton className="h-[36px] text-[14px]" onClick={() => onChange(DEFAULT_COLUMNS)}>
              Reset to default
            </OutlineButton>
            <span className="flex-1" />
            <PrimaryButton className="h-[36px] text-[14px]" onClick={onClose}>
              Done
            </PrimaryButton>
          </div>
        }
      >
        <div className="flex flex-col gap-[8px] py-[16px]">
          <p className="pb-[4px] text-[13px] leading-[18px] text-pg-muted">
            Choose which columns show in the table, and drag to reorder them.
          </p>
          {fixed("Status")}
          {fixed("Title")}
          <ul className="flex flex-col gap-[8px]">
            {columns.map((c, i) => (
              <li
                key={c.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  setDragId(c.id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!dragId || dragId === c.id) return;
                  move(
                    columns.findIndex((x) => x.id === dragId),
                    i,
                  );
                }}
                onDragEnd={() => setDragId(null)}
                className={cn(
                  "flex h-[44px] items-center gap-[8px] rounded-[8px] bg-pg-surface pr-[12px] pl-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
                  dragId === c.id && "opacity-60 shadow-[inset_0_0_0_1px_var(--brand)]",
                )}
              >
                <GripVertical size={16} aria-hidden="true" className="shrink-0 cursor-grab text-pg-faint" />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                    c.visible ? "text-pg-text-strong" : "text-pg-muted",
                  )}
                >
                  {c.label}
                </span>
                <button
                  type="button"
                  aria-label={`Move ${c.label} up`}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronUp size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${c.label} down`}
                  disabled={i === columns.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronDown size={15} aria-hidden="true" />
                </button>
                <Toggle
                  checked={c.visible}
                  aria-label={`Show ${c.label}`}
                  onChange={(visible) => onChange(columns.map((x) => (x.id === c.id ? { ...x, visible } : x)))}
                />
              </li>
            ))}
          </ul>
          {fixed("Actions")}
        </div>
      </SideDrawer>
    </>
  );
}
