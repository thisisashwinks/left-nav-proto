"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ListFilter, Pencil, Plus, Trash2, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { cn } from "@/lib/utils";
import { TEAMMATES, type InboxView } from "./conversations-data";

/**
 * Conversations ▸ Inbox ▸ Create view.
 *
 * The inbox's cousin of the contacts Filters drawer, and deliberately the same
 * object: a card on the right, 36px controls, conditions in a tinted group.
 * Two things differ, and both are the inbox's own. A view is one flat list
 * joined by a single and/or rather than groups of nested filters — the live
 * product saves views that way, and a builder that could express more than
 * the save can hold would be lying. And it takes a scrim: the Filters drawer
 * narrows the table while you watch, but a view only exists once it is saved,
 * so there is nothing behind worth working alongside.
 */

/* ─── The catalog ───────────────────────────────────────────────────────── */

export interface ViewFilterType {
  /** Stored as-is in `InboxView.filters[].type`. */
  label: string;
  operators: string[];
  values: string[];
}

export const VIEW_FILTER_TYPES: ViewFilterType[] = [
  {
    label: "Channel",
    operators: ["Is", "Is not"],
    values: ["SMS", "Email", "WhatsApp", "Facebook", "Instagram", "Live chat", "Call"],
  },
  {
    label: "Status",
    operators: ["Is", "Is not"],
    values: ["Unread", "Read", "Starred", "Pending reply"],
  },
  {
    label: "Assigned to",
    operators: ["Is", "Is not"],
    values: ["Unassigned", ...TEAMMATES.map((t) => t.name)],
  },
  {
    label: "Tag",
    operators: ["Is", "Is not"],
    values: ["VIP", "Hot lead", "Onboarding", "Billing", "Churn risk"],
  },
  {
    label: "Last message",
    operators: ["Is"],
    values: ["Inbound", "Outbound"],
  },
  {
    label: "Date",
    operators: ["Is"],
    values: ["Today", "Last 7 days", "Last 30 days"],
  },
];

const typeByLabel = (label: string) => VIEW_FILTER_TYPES.find((t) => t.label === label);

/**
 * Words that keep their capital mid-sentence. Everything else in the catalog
 * is sentence case, so "Status is Unread" reads as "status is unread".
 */
const PROPER = new Set<string>([
  "SMS",
  "WhatsApp",
  "Facebook",
  "Instagram",
  "VIP",
  ...TEAMMATES.map((t) => t.name),
]);

const lowerFirst = (s: string) => (PROPER.has(s) ? s : s.charAt(0).toLowerCase() + s.slice(1));

/** One line for a tooltip — "Channel is WhatsApp and status is unread". */
export function describeView(view: InboxView): string {
  if (view.filters.length === 0) return "No filters";
  const parts = view.filters.map(
    (f) => `${lowerFirst(f.type)} ${f.operator.toLowerCase()} ${lowerFirst(f.value)}`,
  );
  const line = parts.join(` ${view.join} `);
  return line.charAt(0).toUpperCase() + line.slice(1);
}

/* ─── The drawer ────────────────────────────────────────────────────────── */

interface Row {
  id: string;
  type: string;
  operator: string;
  value: string;
}

let rowSeq = 0;
const blankRow = (): Row => ({ id: `row-${++rowSeq}`, type: "", operator: "", value: "" });
const isComplete = (r: Row) => r.type !== "" && r.operator !== "" && r.value !== "";

const DEFAULT_NAME = "New view";

/**
 * Where the selects float their menus.
 *
 * The drawer body scrolls, so a menu positioned inside it gets clipped at the
 * footer — the bottom row's Value list would open into nothing. Menus portal
 * to the overlay root instead, which sits outside the scroll box but still
 * carries the page theme.
 */
const MenuHost = React.createContext<HTMLElement | null>(null);

export function CreateViewDrawer({
  onClose,
  onCreate,
  initial,
}: {
  onClose: () => void;
  onCreate: (view: InboxView) => void;
  /** When given, the drawer edits this view instead ("Edit view" / "Save changes"). */
  initial?: InboxView;
}) {
  const { effective } = useTheme();
  const [host, setHost] = React.useState<HTMLDivElement | null>(null);
  const editing = initial !== undefined;

  const [name, setName] = React.useState(initial?.name ?? DEFAULT_NAME);
  const [join, setJoin] = React.useState<InboxView["join"]>(initial?.join ?? "and");
  const [rows, setRows] = React.useState<Row[]>(() =>
    initial && initial.filters.length > 0
      ? initial.filters.map((f) => ({ ...blankRow(), ...f }))
      : [blankRow()],
  );

  React.useEffect(() => {
    // Bubble phase: an open menu catches Escape first and keeps the drawer.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const complete = rows.filter(isComplete);
  const canSave = name.trim() !== "" && complete.length > 0;

  const update = (id: string, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addRow = (nextJoin?: InboxView["join"]) => {
    if (nextJoin) setJoin(nextJoin);
    setRows((rs) => [...rs, blankRow()]);
  };

  const clear = () => {
    setName(DEFAULT_NAME);
    setJoin("and");
    setRows([blankRow()]);
  };

  const save = () => {
    if (!canSave) return;
    onCreate({
      id: initial?.id ?? `view-${Date.now()}`,
      name: name.trim(),
      join,
      filters: complete.map(({ type, operator, value }) => ({ type, operator, value })),
    });
  };

  // Opens from a click, never on first paint — the guard only keeps SSR off
  // `document`.
  if (typeof document === "undefined") return <></>;

  const title = editing ? "Edit view" : "Create view";

  return createPortal(
    <div ref={setHost} data-page-theme={effective.appTheme} className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="motion-fade-in absolute inset-0 cursor-default bg-[#1018284d]"
      />
      <MenuHost.Provider value={host}>
        <aside
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className="motion-slot-in absolute top-[8px] right-[8px] bottom-[8px] flex w-[360px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_12px_32px_-8px_rgba(15,23,42,0.22),0_0_0_1px_var(--pg-card-border)]"
        >
          <header className="flex h-[48px] shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[16px]">
            <ListFilter size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
            <h2 className="min-w-0 flex-1 truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
              {title}
            </h2>
            <button
              type="button"
              onClick={clear}
              className="rounded-[6px] px-[6px] py-[2px] text-[14px] leading-[20px] font-medium text-pg-muted motion-tap hover:text-pg-text"
            >
              Clear
            </button>
            <button
              type="button"
              aria-label="Close panel"
              onClick={onClose}
              className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text active:scale-90"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-[16px]">
            <NameField value={name} onChange={setName} />

            <div className="mt-[16px] flex flex-col rounded-[8px] bg-pg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              {rows.map((r, i) => (
                <React.Fragment key={r.id}>
                  {i > 0 ? <JoinToggle value={join} onChange={setJoin} /> : null}
                  <FilterRow
                    row={r}
                    index={i}
                    onChange={(patch) => update(r.id, patch)}
                    onRemove={
                      i > 0 ? () => setRows((rs) => rs.filter((x) => x.id !== r.id)) : undefined
                    }
                  />
                </React.Fragment>
              ))}
            </div>

            {/* Below the group the toggle is an adder: picking a join is
                asking for another condition joined that way. */}
            <JoinToggle
              value={rows.length > 1 ? join : null}
              onChange={(j) => addRow(j)}
              label="Add a filter joined by"
              tail
            />

            <button
              type="button"
              onClick={() => addRow()}
              className="flex h-[28px] items-center gap-[6px] self-start rounded-[6px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
            >
              <Plus size={15} aria-hidden="true" />
              Add filter
            </button>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-[12px] border-t border-pg-head-border px-[16px] py-[12px]">
            <OutlineButton onClick={onClose} className="h-[36px] text-[14px]">
              Cancel
            </OutlineButton>
            <PrimaryButton
              onClick={save}
              disabled={!canSave}
              className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
            >
              {editing ? "Save changes" : "Create view"}
            </PrimaryButton>
          </footer>
        </aside>
      </MenuHost.Provider>
    </div>,
    document.body,
  );
}

/* ─── Pieces ────────────────────────────────────────────────────────────── */

/** The view's name, edited in place — reads as a heading until it's touched. */
function NameField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[13px] leading-[18px] font-medium text-pg-muted">View name</span>
      <div className="group flex h-[36px] items-center gap-[8px] rounded-[8px] px-[12px] shadow-[inset_0_0_0_1px_transparent] motion-tap focus-within:bg-pg-surface focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] hover:shadow-[inset_0_0_0_1px_var(--pg-border)] -mx-[12px]">
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => e.target.select()}
          placeholder={DEFAULT_NAME}
          aria-label="View name"
          maxLength={60}
          className="min-w-0 flex-1 bg-transparent text-[16px] leading-[22px] font-semibold text-pg-heading placeholder:font-normal placeholder:text-pg-faint focus:outline-none"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="Rename view"
          onClick={() => ref.current?.focus()}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint motion-tap group-hover:text-pg-muted"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * The and/or switch, on a spine.
 *
 * A short vertical line runs through it so consecutive conditions read as
 * one chain. `tail` draws only the upper half — the one under the group,
 * hanging off it, with nothing yet below.
 */
function JoinToggle({
  value,
  onChange,
  label = "Join filters with",
  tail,
}: {
  value: InboxView["join"] | null;
  onChange: (join: InboxView["join"]) => void;
  label?: string;
  tail?: boolean;
}) {
  return (
    <div className="relative flex justify-center py-[8px]">
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-1/2 w-px -translate-x-1/2 bg-[var(--pg-border-strong)]",
          tail ? "top-0 h-[8px]" : "inset-y-0",
        )}
      />
      <div
        role="radiogroup"
        aria-label={label}
        className="relative flex h-[24px] items-center gap-[2px] rounded-[6px] bg-pg-surface p-[2px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
      >
        {(["and", "or"] as const).map((j) => {
          const on = value === j;
          return (
            <button
              key={j}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(j)}
              className={cn(
                "flex h-[20px] min-w-[36px] items-center justify-center rounded-[4px] px-[8px] text-[12px] leading-[16px] font-semibold motion-tap",
                on ? "bg-brand text-brand-fg" : "text-pg-muted hover:bg-pg hover:text-pg-text",
              )}
            >
              {j === "and" ? "And" : "Or"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Type → operator → value, stacked; each list depends on the one above. */
function FilterRow({
  row,
  index,
  onChange,
  onRemove,
}: {
  row: Row;
  index: number;
  onChange: (patch: Partial<Row>) => void;
  onRemove?: () => void;
}) {
  const type = typeByLabel(row.type);
  return (
    <div className="group/row flex items-start gap-[8px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
        <FloatingSelect
          aria-label={`Filter ${index + 1} type`}
          placeholder="Filter type"
          value={row.type || null}
          options={VIEW_FILTER_TYPES.map((t) => t.label)}
          onChange={(label) =>
            onChange({
              type: label,
              operator: typeByLabel(label)?.operators[0] ?? "",
              value: "",
            })
          }
        />
        <FloatingSelect
          aria-label={`Filter ${index + 1} operator`}
          placeholder="Is"
          value={row.operator || null}
          options={type?.operators ?? []}
          disabled={!type}
          onChange={(operator) => onChange({ operator })}
        />
        <FloatingSelect
          aria-label={`Filter ${index + 1} value`}
          placeholder="Value"
          value={row.value || null}
          options={type?.values ?? []}
          disabled={!type}
          onChange={(value) => onChange({ value })}
        />
      </div>
      {/* The column is always there so every row's selects line up. */}
      <div className="flex w-[28px] shrink-0 justify-center pt-[4px]">
        {onRemove ? (
          <button
            type="button"
            aria-label={`Remove filter ${index + 1}`}
            onClick={onRemove}
            className="flex size-[28px] items-center justify-center rounded-[7px] text-pg-muted opacity-0 motion-tap group-hover/row:opacity-100 hover:bg-pg-surface hover:text-pg-danger focus-visible:opacity-100 active:scale-90"
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

/**
 * The 36px select from form-controls, with its menu lifted out of the
 * drawer's scroll box.
 *
 * Same trigger and menu styling; the only change is where the menu lives —
 * fixed to the viewport off the trigger's rect, portalled to the overlay
 * root, flipping upward when there isn't room below. It closes on scroll
 * rather than chasing the trigger.
 */
function FloatingSelect({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: string | null;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  "aria-label": string;
}) {
  const host = React.useContext(MenuHost);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const [place, setPlace] = React.useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
  } | null>(null);
  const open = place !== null;
  const menuRef = React.useRef<HTMLDivElement>(null);

  const openMenu = () => {
    const el = trigger.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuH = Math.min(280, options.length * 34 + 8);
    const below = window.innerHeight - r.bottom;
    setPlace(
      below < menuH + 12 && r.top > below
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4 }
        : { left: r.left, width: r.width, top: r.bottom + 4 },
    );
  };

  React.useEffect(() => {
    if (!open) return;
    const close = () => setPlace(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    // Scrolls inside the menu itself are fine; anything else moves the trigger.
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? setPlace(null) : openMenu())}
        className={cn(
          "flex h-[36px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap",
          disabled
            ? "cursor-not-allowed bg-pg text-pg-muted"
            : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", value ? "text-pg-text" : "text-pg-faint")}>
          {value ?? placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {open && host
        ? createPortal(
            <>
              <button
                type="button"
                aria-label="Close options"
                tabIndex={-1}
                onClick={() => setPlace(null)}
                className="fixed inset-0 z-[90] cursor-default"
              />
              <div
                ref={menuRef}
                role="listbox"
                aria-label={ariaLabel}
                style={{
                  left: place.left,
                  width: place.width,
                  top: place.top,
                  bottom: place.bottom,
                }}
                className="fixed z-[91] flex max-h-[280px] flex-col overflow-y-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
              >
                {options.map((o) => {
                  const on = o === value;
                  return (
                    <button
                      key={o}
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => {
                        onChange(o);
                        setPlace(null);
                      }}
                      className="flex w-full shrink-0 items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
                    >
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                          on ? "font-medium text-pg-heading" : "text-pg-text",
                        )}
                      >
                        {o}
                      </span>
                      {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
                    </button>
                  );
                })}
              </div>
            </>,
            host,
          )
        : null}
    </>
  );
}
