"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Calendar,
  Check,
  Filter,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { AnchoredPopover, toneFor } from "@/components/contacts/associated-objects";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import {
  CONTACT_OPTIONS,
  DEFAULT_SORT,
  EMPTY_FILTERS,
  PEOPLE,
  extraFilterCount,
  formatDate,
  personById,
  personLabel,
  type DueFilter,
  type SortField,
  type StatusFilter,
  type TaskFilters,
  type TaskSort,
} from "./tasks-data";
import { OptionRow, PersonAvatar, PopoverSearch, SECTION_HEAD } from "./tasks-ui";

/**
 * The filter-chip row: Assignee, Status, Due date, Filters, Sort.
 *
 * Every chip opens a portalled popover (the canvas clips, and the drawer's
 * pickers need the same trick), and every chip that differs from its resting
 * value turns brand-soft and grows a ✕ that puts it back.
 */

type OpenChip = { which: "assignee" | "status" | "due" | "filters" | "sort"; anchor: HTMLElement } | null;

function Chip({
  icon: Icon,
  label,
  active,
  open,
  onOpen,
  onClear,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  open: boolean;
  onOpen: (el: HTMLElement) => void;
  onClear?: () => void;
}) {
  return (
    <span
      className={cn(
        "flex h-[36px] max-w-[240px] shrink-0 items-center rounded-full motion-tap",
        active
          ? "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_30%,transparent)]"
          : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        open && !active && "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        title={label}
        onClick={(e) => onOpen(e.currentTarget)}
        className={cn(
          "flex h-full min-w-0 items-center gap-[6px] pl-[14px] text-[14px] leading-[20px] font-medium",
          active && onClear ? "pr-[4px]" : "pr-[14px]",
        )}
      >
        <Icon size={15} aria-hidden="true" className="shrink-0" />
        <span className="truncate">{label}</span>
      </button>
      {active && onClear ? (
        <button
          type="button"
          aria-label={`Clear ${label.split(":")[0].toLowerCase()}`}
          onClick={onClear}
          className="mr-[8px] flex size-[20px] shrink-0 items-center justify-center rounded-full motion-tap hover:bg-[color-mix(in_oklab,var(--brand)_14%,transparent)]"
        >
          <X size={13} aria-hidden="true" />
        </button>
      ) : null}
    </span>
  );
}

function assigneeLabel(ids: string[]) {
  if (ids.length === 0) return "Any";
  if (ids.length > 1) return `${ids.length} selected`;
  if (ids[0] === "none") return "Unassigned";
  return personById(ids[0])?.name ?? "1 selected";
}

const STATUS_LABEL: Record<StatusFilter, string> = { all: "All", pending: "Pending", completed: "Completed" };

function dueLabel(d: DueFilter) {
  switch (d.kind) {
    case "any":
      return "Any";
    case "today":
      return "Today";
    case "week":
      return "This week";
    case "overdue":
      return "Overdue";
    case "upcoming":
      return "Upcoming";
    case "custom":
      return d.from && d.to
        ? `${formatDate(d.from)}–${formatDate(d.to)}`
        : d.from
          ? `After ${formatDate(d.from)}`
          : d.to
            ? `Before ${formatDate(d.to)}`
            : "Custom range";
  }
}

const SORT_LABEL: Record<SortField, string> = { due: "Due date", title: "Title", created: "Created" };

const DIR_LABEL: Record<SortField, [string, string]> = {
  due: ["Earliest first", "Latest first"],
  title: ["A–Z", "Z–A"],
  created: ["Oldest first", "Newest first"],
};

function sameSort(a: TaskSort, b: TaskSort) {
  return a.field === b.field && a.dir === b.dir;
}

export function FilterChips({
  filters,
  onFilters,
  sort,
  onSort,
}: {
  filters: TaskFilters;
  onFilters: (f: TaskFilters) => void;
  sort: TaskSort;
  onSort: (s: TaskSort) => void;
}) {
  const [open, setOpen] = React.useState<OpenChip>(null);
  const close = React.useCallback(() => setOpen(null), []);
  const toggle = (which: NonNullable<OpenChip>["which"]) => (anchor: HTMLElement) =>
    setOpen((o) => (o?.which === which ? null : { which, anchor }));
  const extra = extraFilterCount(filters);

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-[8px]">
      <Chip
        icon={UserRound}
        label={`Assignee: ${assigneeLabel(filters.assignees)}`}
        active={filters.assignees.length > 0}
        open={open?.which === "assignee"}
        onOpen={toggle("assignee")}
        onClear={() => onFilters({ ...filters, assignees: [] })}
      />
      <Chip
        icon={Check}
        label={`Status: ${STATUS_LABEL[filters.status]}`}
        active={filters.status !== "all"}
        open={open?.which === "status"}
        onOpen={toggle("status")}
        onClear={() => onFilters({ ...filters, status: "all" })}
      />
      <Chip
        icon={Calendar}
        label={`Due date: ${dueLabel(filters.due)}`}
        active={filters.due.kind !== "any"}
        open={open?.which === "due"}
        onOpen={toggle("due")}
        onClear={() => onFilters({ ...filters, due: { kind: "any" } })}
      />
      <Chip
        icon={Filter}
        label={extra ? `Filters (${extra})` : "Filters"}
        active={extra > 0}
        open={open?.which === "filters"}
        onOpen={toggle("filters")}
        onClear={() =>
          onFilters({
            ...filters,
            contactIds: EMPTY_FILTERS.contactIds,
            description: EMPTY_FILTERS.description,
            recurring: EMPTY_FILTERS.recurring,
          })
        }
      />
      <Chip
        icon={ArrowUpDown}
        label="Sort (1)"
        active
        open={open?.which === "sort"}
        onOpen={toggle("sort")}
        onClear={sameSort(sort, DEFAULT_SORT) ? undefined : () => onSort(DEFAULT_SORT)}
      />

      {open?.which === "assignee" ? (
        <AnchoredPopover anchor={open.anchor} onClose={close} width={280} label="Filter by assignee">
          <AssigneeFilter value={filters.assignees} onChange={(assignees) => onFilters({ ...filters, assignees })} />
        </AnchoredPopover>
      ) : null}

      {open?.which === "status" ? (
        <AnchoredPopover anchor={open.anchor} onClose={close} width={200} label="Filter by status">
          <div role="listbox" className="flex flex-col p-[4px]">
            {(Object.keys(STATUS_LABEL) as StatusFilter[]).map((s) => (
              <OptionRow
                key={s}
                selected={filters.status === s}
                onClick={() => {
                  onFilters({ ...filters, status: s });
                  close();
                }}
              >
                {STATUS_LABEL[s]}
              </OptionRow>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}

      {open?.which === "due" ? (
        <AnchoredPopover anchor={open.anchor} onClose={close} width={260} label="Filter by due date">
          <DueFilterMenu
            value={filters.due}
            onChange={(due, done) => {
              onFilters({ ...filters, due });
              if (done) close();
            }}
          />
        </AnchoredPopover>
      ) : null}

      {open?.which === "filters" ? (
        <AnchoredPopover anchor={open.anchor} onClose={close} width={300} label="More filters">
          <MoreFilters filters={filters} onFilters={onFilters} />
        </AnchoredPopover>
      ) : null}

      {open?.which === "sort" ? (
        <AnchoredPopover anchor={open.anchor} onClose={close} width={220} label="Sort">
          <div className="flex flex-col p-[4px]">
            <div className={SECTION_HEAD}>Sort by</div>
            {(Object.keys(SORT_LABEL) as SortField[]).map((f) => (
              <OptionRow key={f} selected={sort.field === f} onClick={() => onSort({ ...sort, field: f })}>
                {SORT_LABEL[f]}
              </OptionRow>
            ))}
            <div className="mx-[6px] my-[4px] h-px bg-pg-head-border" />
            <div className={SECTION_HEAD}>Direction</div>
            {(
              [
                ["asc", DIR_LABEL[sort.field][0], ArrowUp],
                ["desc", DIR_LABEL[sort.field][1], ArrowDown],
              ] as const
            ).map(([dir, label, Icon]) => (
              <OptionRow key={dir} selected={sort.dir === dir} onClick={() => onSort({ ...sort, dir })}>
                <Icon size={14} aria-hidden="true" className="text-pg-muted" />
                {label}
              </OptionRow>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </div>
  );
}

function AssigneeFilter({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const people = q ? PEOPLE.filter((p) => personLabel(p).toLowerCase().includes(q)) : PEOPLE;
  const showNone = !q || "unassigned".includes(q);
  const flip = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  return (
    <div className="flex max-h-[340px] flex-col">
      <PopoverSearch value={query} onChange={setQuery} placeholder="Search people" />
      <div role="listbox" aria-multiselectable="true" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
        {showNone ? (
          <OptionRow multi selected={value.includes("none")} onClick={() => flip("none")}>
            <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-pg text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <UserRound size={13} aria-hidden="true" />
            </span>
            <span className="truncate">Unassigned</span>
          </OptionRow>
        ) : null}
        {people.map((p) => (
          <OptionRow key={p.id} multi selected={value.includes(p.id)} onClick={() => flip(p.id)}>
            <PersonAvatar person={p} />
            <span className="truncate">{personLabel(p)}</span>
          </OptionRow>
        ))}
        {people.length === 0 && !showNone ? (
          <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No people match your search</p>
        ) : null}
      </div>
      {value.length ? (
        <div className="flex shrink-0 justify-end border-t border-pg-head-border px-[10px] py-[8px]">
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
          >
            Clear selection
          </button>
        </div>
      ) : null}
    </div>
  );
}

const DATE_INPUT =
  "h-[36px] w-full min-w-0 rounded-[8px] bg-pg-surface px-[10px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none";

function DueFilterMenu({
  value,
  onChange,
}: {
  value: DueFilter;
  onChange: (d: DueFilter, done: boolean) => void;
}) {
  const [custom, setCustom] = React.useState(value.kind === "custom");
  const [from, setFrom] = React.useState(value.kind === "custom" ? value.from : "");
  const [to, setTo] = React.useState(value.kind === "custom" ? value.to : "");
  const presets: [DueFilter["kind"], string][] = [
    ["any", "Any"],
    ["today", "Today"],
    ["week", "This week"],
    ["overdue", "Overdue"],
    ["upcoming", "Upcoming"],
  ];

  return (
    <div className="flex flex-col p-[4px]">
      <div role="listbox">
        {presets.map(([kind, label]) => (
          <OptionRow
            key={kind}
            selected={!custom && value.kind === kind}
            onClick={() => onChange({ kind } as DueFilter, true)}
          >
            {label}
          </OptionRow>
        ))}
        <OptionRow selected={custom} onClick={() => setCustom(true)}>
          Custom range
        </OptionRow>
      </div>
      {custom ? (
        <div className="flex flex-col gap-[8px] border-t border-pg-head-border px-[6px] pt-[10px] pb-[6px]">
          <div className="flex items-center gap-[8px]">
            <input type="date" aria-label="From" value={from} onChange={(e) => setFrom(e.target.value)} className={DATE_INPUT} />
            <span className="text-pg-faint">–</span>
            <input type="date" aria-label="To" value={to} onChange={(e) => setTo(e.target.value)} className={DATE_INPUT} />
          </div>
          <button
            type="button"
            disabled={!from && !to}
            onClick={() => onChange({ kind: "custom", from, to }, true)}
            className="flex h-[32px] items-center justify-center rounded-[8px] bg-brand text-[13px] font-semibold text-brand-fg motion-tap hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply range
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MoreFilters({ filters, onFilters }: { filters: TaskFilters; onFilters: (f: TaskFilters) => void }) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? CONTACT_OPTIONS.filter((c) => c.name.includes(q)) : CONTACT_OPTIONS;
  const flip = (id: string) =>
    onFilters({
      ...filters,
      contactIds: filters.contactIds.includes(id)
        ? filters.contactIds.filter((x) => x !== id)
        : [...filters.contactIds, id],
    });
  const seg = <T extends string>(
    label: string,
    value: T,
    options: [T, string][],
    set: (v: T) => void,
  ) => (
    <div className="flex flex-col gap-[6px] px-[10px] py-[8px]">
      <span className="text-[13px] leading-[18px] font-semibold text-pg-heading">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex h-[32px] overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {options.map(([v, l], i) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => set(v)}
            className={cn(
              "flex flex-1 items-center justify-center text-[13px] leading-[18px] font-medium motion-tap",
              i > 0 && "shadow-[inset_1px_0_0_0_var(--pg-border)]",
              value === v ? "bg-brand-soft text-brand" : "text-pg-text hover:bg-pg",
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex max-h-[460px] flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-pg-head-border px-[12px] py-[10px]">
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Filters</span>
        {extraFilterCount(filters) ? (
          <button
            type="button"
            onClick={() => onFilters({ ...filters, contactIds: [], description: "any", recurring: "any" })}
            className="text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
          >
            Clear all
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {seg("Description", filters.description, [["any", "Any"], ["with", "Has one"], ["without", "None"]], (description) =>
          onFilters({ ...filters, description }),
        )}
        {seg("Recurring", filters.recurring, [["any", "All tasks"], ["only", "Recurring only"]], (recurring) =>
          onFilters({ ...filters, recurring }),
        )}
        <div className="flex flex-col pt-[8px]">
          <span className="px-[10px] pb-[6px] text-[13px] leading-[18px] font-semibold text-pg-heading">
            Associated contact{filters.contactIds.length ? ` (${filters.contactIds.length})` : ""}
          </span>
          <div className="border-t border-pg-head-border">
            <PopoverSearch value={query} onChange={setQuery} placeholder="Search contacts" />
          </div>
          <div role="listbox" aria-multiselectable="true" className="p-[4px]">
            {shown.length === 0 ? (
              <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No contacts match your search</p>
            ) : null}
            {shown.map((c) => (
              <OptionRow key={c.id} multi selected={filters.contactIds.includes(c.id)} onClick={() => flip(c.id)}>
                <ToneAvatar name={c.name} initials={c.initials} tone={toneFor(c.id)} size={24} round />
                <span className="truncate">{c.name}</span>
              </OptionRow>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** "Status: Pending, due date: Today" — for the + List modal. */
export function describeFilters(f: TaskFilters) {
  const parts: string[] = [];
  if (f.assignees.length) parts.push(`assignee ${assigneeLabel(f.assignees).toLowerCase()}`);
  if (f.status !== "all") parts.push(`status ${STATUS_LABEL[f.status].toLowerCase()}`);
  if (f.due.kind !== "any") parts.push(`due date ${dueLabel(f.due).toLowerCase()}`);
  const extra = extraFilterCount(f);
  if (extra) parts.push(`${extra} more ${extra > 1 ? "filters" : "filter"}`);
  return parts.length ? parts.join(", ") : "no filters, every task";
}
