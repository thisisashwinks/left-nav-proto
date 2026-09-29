"use client";

import * as React from "react";
import {
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  Clock,
  FileText,
  GripVertical,
  LayoutGrid,
  MessagesSquare,
  Network,
  PenLine,
  Plus,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULES, type ModuleId } from "./object-settings-store";

/**
 * The small pieces the view builder and its drawers share — module glyphs,
 * the two segmented controls, the "+ Add" menu and a reorderable row list.
 */

export const MODULE_ICON: Record<ModuleId, LucideIcon> = {
  conversations: MessagesSquare,
  activity: Clock,
  associations: Network,
  opportunities: LayoutGrid,
  tasks: ClipboardCheck,
  notes: PenLine,
  appointments: CalendarDays,
  documents: FileText,
  payments: CircleDollarSign,
  "agent-logs": Sparkles,
};

export const moduleLabel = (id: ModuleId) => MODULES.find((m) => m.id === id)?.label ?? id;

/** The settings card: 12px radius, hairline border, a breath of shadow. */
export const CARD =
  "rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_0_rgba(16,24,40,0.04)]";

export const ICON_BUTTON =
  "flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

/* ─── Segmented controls ────────────────────────────────────────────────── */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  title?: string;
}

/**
 * Two looks, one control. `track` is the grey rail with a raised pill
 * (Display mode); `boxed` is the full-width bordered strip the Edit tabs card
 * uses, where the selected cell fills grey instead of lifting.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  variant = "track",
  className,
  "aria-label": ariaLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (next: T) => void;
  variant?: "track" | "boxed";
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "flex",
        variant === "track"
          ? "h-[32px] gap-[2px] rounded-[8px] bg-pg p-[3px]"
          : "h-[32px] overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
        className,
      )}
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={o.disabled}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-w-0 truncate text-[13px] leading-[18px] motion-tap",
              variant === "track"
                ? cn(
                    "rounded-[6px] px-[16px]",
                    on
                      ? "bg-pg-surface font-medium text-pg-heading shadow-[0_1px_2px_0_rgba(16,24,40,0.08)]"
                      : "text-pg-muted hover:text-pg-heading",
                  )
                : cn(
                    "flex-1 px-[8px]",
                    i > 0 && "shadow-[inset_1px_0_0_0_var(--pg-border)]",
                    on ? "bg-pg font-medium text-pg-heading" : "text-pg-text hover:bg-pg",
                    o.disabled && "cursor-not-allowed text-pg-disabled hover:bg-transparent",
                  ),
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── "+ Add" ───────────────────────────────────────────────────────────── */

export interface AddItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  hint?: string;
}

/**
 * The small ghost "+ Add" and the menu of what is left to add.
 *
 * Hand-rolled like the other menus: a card over a full-screen click-catcher.
 * With nothing left to add it greys out rather than opening an empty menu.
 */
export function AddMenu({
  items,
  onPick,
  label = "Add",
  emptyTitle = "Nothing left to add",
  align = "right",
}: {
  items: AddItem[];
  onPick: (id: string) => void;
  label?: string;
  emptyTitle?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = React.useState(false);
  const empty = items.length === 0;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        disabled={empty}
        title={empty ? emptyTitle : undefined}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-[32px] items-center gap-[6px] rounded-[8px] px-[10px] text-[13px] leading-[18px] font-medium text-pg-text motion-tap hover:bg-pg",
          open && "bg-pg",
          empty && "cursor-not-allowed text-pg-disabled hover:bg-transparent",
        )}
      >
        <Plus size={14} aria-hidden="true" />
        {label}
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default"
          />
          <div
            role="menu"
            className={cn(
              "absolute top-[calc(100%+4px)] z-[61] flex max-h-[300px] w-[220px] flex-col overflow-y-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onPick(item.id);
                  }}
                  className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
                >
                  {Icon ? <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" /> : null}
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">
                    {item.label}
                  </span>
                  {item.hint ? (
                    <span className="shrink-0 text-[12px] leading-[16px] text-pg-faint">{item.hint}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ─── Grip ──────────────────────────────────────────────────────────────── */

/**
 * The drag handle. The whole row is what drags — the grip is the keyboard
 * way in, walking the row with the arrow keys the way the smart lists do.
 */
export function Grip({
  label,
  onMove,
  disabled,
}: {
  label: string;
  onMove?: (delta: -1 | 1) => void;
  disabled?: boolean;
}) {
  return (
    <span
      role={disabled ? undefined : "button"}
      tabIndex={disabled ? undefined : 0}
      aria-label={disabled ? undefined : `Reorder ${label}. Use the arrow keys to move it.`}
      aria-hidden={disabled ? true : undefined}
      onKeyDown={(e) => {
        if (!onMove) return;
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          onMove(e.key === "ArrowUp" ? -1 : 1);
        }
      }}
      className={cn(
        "flex size-[20px] shrink-0 items-center justify-center rounded-[4px] text-pg-faint focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-grab active:cursor-grabbing",
      )}
    >
      <GripVertical size={15} aria-hidden="true" />
    </span>
  );
}

/* ─── Reorderable rows ──────────────────────────────────────────────────── */

/**
 * One list, reordered in place by HTML5 drag or the grip's arrow keys, each
 * row removable. The contact-card drawer's Fields and Actions are both this.
 */
export function SortableRows({
  items,
  onChange,
  removable = true,
}: {
  items: string[];
  onChange: (next: string[]) => void;
  removable?: boolean;
}) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  const move = (id: string, to: number) => {
    const next = items.filter((i) => i !== id);
    next.splice(Math.max(0, Math.min(to, next.length)), 0, id);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-[8px]">
      {items.map((item, i) => (
        <div
          key={item}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", item);
            setDragId(item);
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverId(null);
          }}
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (overId !== item) setOverId(item);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragId && dragId !== item) move(dragId, i);
            setDragId(null);
            setOverId(null);
          }}
          className={cn(
            "group flex h-[44px] items-center gap-[10px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
            dragId === item && "opacity-40",
            overId === item &&
              dragId !== item &&
              "shadow-[inset_0_0_0_1px_var(--pg-border),inset_0_2px_0_0_var(--brand)]",
          )}
        >
          <Grip label={item} onMove={(d) => move(item, i + d)} />
          <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">
            {item}
          </span>
          {removable ? (
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(items.filter((x) => x !== item))}
              className={ICON_BUTTON}
            >
              <X size={15} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
