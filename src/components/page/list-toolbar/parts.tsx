"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  GripVertical,
  ListFilter,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListToolbarModel } from "./types";
import {
  CheckBox,
  MenuDivider,
  MenuEmpty,
  MenuHeader,
  MenuItem,
  MenuSearch,
  Popover,
  usePopover,
} from "./popover";

/*
 * The shared parts every variant is assembled from. Built once, so the six
 * variants differ only in WHERE they put things — which is the comparison —
 * and never in how a sort menu or a filter chip behaves.
 */

export type Model = ListToolbarModel;
export type Views = NonNullable<Model["views"]>;
export type QuickFilter = NonNullable<Model["quickFilters"]>[number];
export type SortModel = NonNullable<Model["sort"]>;
export type ColumnsModel = NonNullable<Model["columns"]>;
export type AdvancedModel = NonNullable<Model["advanced"]>;
export type ColumnItem = ColumnsModel["items"][number];

/* ------------------------------------------------------------------------ */
/* Small helpers                                                             */
/* ------------------------------------------------------------------------ */

export function cap(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function viewNoun(views: Views): string {
  return views.noun ?? "view";
}

function plural(noun: string): string {
  if (/s$/i.test(noun)) return noun;
  if (/[^aeiou]y$/i.test(noun)) return `${noun.slice(0, -1)}ies`;
  return `${noun}s`;
}

function singular(noun: string): string {
  if (/ies$/i.test(noun)) return `${noun.slice(0, -3)}y`;
  if (/[^s]s$/i.test(noun)) return noun.slice(0, -1);
  return noun;
}

export function formatCount(v: string | number | undefined): string | undefined {
  if (v === undefined || v === "") return undefined;
  return typeof v === "number" ? v.toLocaleString("en-US") : v;
}

/** Tracks an element's content width. Starts at a desktop guess for SSR. */
export function useWidth<T extends HTMLElement>(): [(el: T | null) => void, number] {
  const [el, setEl] = React.useState<T | null>(null);
  const [width, setWidth] = React.useState(1200);
  React.useLayoutEffect(() => {
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const next = Math.round(entries[0]?.contentRect.width ?? 0);
      if (next > 0) setWidth((prev) => (prev === next ? prev : next));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [el]);
  return [setEl, width];
}

/**
 * Steps a row down until it fits, measured rather than guessed.
 *
 * Fixed breakpoints could not know what the row was carrying — an applied
 * filter ("Status: Inquiry received") or a long view name widens it by a
 * hundred pixels at the same window width. So the row renders at `level`,
 * checks whether its content spills past its box, and if so takes the next
 * step down; a wider box starts again from the top. `deps` are the things
 * that change the row's content without changing its width.
 */
/**
 * Whether a row's own children run past its right edge, or into each other.
 *
 * Measured on the direct children's boxes rather than `scrollWidth`, so a
 * corner badge or a focus ring hanging a few pixels off a button does not
 * count as the row being full — and so the row never needs `overflow-hidden`,
 * which is what clipped those badges.
 */
function spills(row: HTMLElement): boolean {
  const edge = row.getBoundingClientRect().right + 1;
  let prevRight = -Infinity;
  for (const child of Array.from(row.children)) {
    const r = (child as HTMLElement).getBoundingClientRect();
    if (r.width === 0) continue;
    if (r.right > edge || r.left < prevRight - 1) return true;
    prevRight = r.right;
  }
  return false;
}

export function useFitLevel<T extends HTMLElement>(
  max: number,
  /** Anything that changes the row's content without changing its width. */
  contentKey: string,
): [React.RefCallback<T>, number] {
  const [el, setEl] = React.useState<T | null>(null);
  const [fit, setFit] = React.useState({ key: contentKey, width: 0, level: 0 });

  // New content starts from the widest rung again (reset during render,
  // the documented way to adjust state to a changed input).
  let level = fit.level;
  if (fit.key !== contentKey) {
    level = 0;
    setFit({ key: contentKey, width: fit.width, level: 0 });
  }

  const check = React.useCallback(() => {
    if (!el) return;
    setFit((f) => {
      const w = el.clientWidth;
      // Any change of width re-fits from the top: narrower may now spill,
      // wider may have room for a rung that was given up.
      if (Math.abs(w - f.width) > 1) return { ...f, width: w, level: 0 };
      if (spills(el) && f.level < max) {
        return { ...f, level: f.level + 1 };
      }
      return f;
    });
  }, [el, max]);

  // Width changes arrive from the observer.
  React.useEffect(() => {
    if (!el) return;
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [el, check]);

  // After every rung, look again next frame — a step can leave the row still
  // spilling, and nothing else would fire.
  React.useEffect(() => {
    const id = requestAnimationFrame(check);
    return () => cancelAnimationFrame(id);
  }, [level, contentKey, check]);

  return [setEl, level];
}

function optionLabel(filter: QuickFilter, value: string): string {
  return filter.options.find((o) => o.value === value)?.label ?? value;
}

/** "Open", "Open, Won", "Open +2". */
export function filterSummary(filter: QuickFilter): string | null {
  if (!filter.value.length) return null;
  const first = optionLabel(filter, filter.value[0]);
  if (filter.value.length === 1) return first;
  if (filter.value.length === 2) return `${first}, ${optionLabel(filter, filter.value[1])}`;
  return `${first} +${filter.value.length - 1}`;
}

export interface ChipData {
  id: string;
  label: string;
  icon?: LucideIcon;
  onRemove: () => void;
}

/** Everything applied, in reading order: quick filters, advanced, sort. */
export function collectChips(model: Model): ChipData[] {
  const chips: ChipData[] = [];
  for (const f of model.quickFilters ?? []) {
    const summary = filterSummary(f);
    if (summary) {
      chips.push({ id: `qf:${f.id}`, label: `${f.label}: ${summary}`, onRemove: () => f.onChange([]) });
    }
  }
  const adv = model.advanced;
  if (adv) {
    if (adv.chips?.length) {
      for (const c of adv.chips) chips.push({ id: `adv:${c.id}`, label: c.label, onRemove: c.onRemove });
    } else if (adv.count > 0) {
      chips.push({
        id: "adv",
        label: `Advanced filters: ${adv.count}`,
        icon: ListFilter,
        onRemove: adv.onClear,
      });
    }
  }
  const sort = model.sort;
  if (sort?.value) {
    const field = sort.fields.find((f) => f.value === sort.value?.field)?.label ?? sort.value.field;
    chips.push({
      id: "sort",
      label: `Sort: ${field}`,
      icon: sort.value.dir === "asc" ? ArrowUp : ArrowDown,
      onRemove: () => sort.onChange(null),
    });
  }
  return chips;
}

/** Filters and sort applied — what a View ▾ badge counts. */
export function appliedCount(model: Model): number {
  let n = 0;
  for (const f of model.quickFilters ?? []) if (f.value.length) n += 1;
  n += model.advanced?.count ?? 0;
  if (model.sort?.value) n += 1;
  return n;
}

export function clearAll(model: Model) {
  for (const f of model.quickFilters ?? []) if (f.value.length) f.onChange([]);
  if (model.advanced && (model.advanced.count > 0 || model.advanced.chips?.length)) model.advanced.onClear();
  if (model.sort?.value) model.sort.onChange(null);
}

export function hasFilterControls(model: Model): boolean {
  return !!(
    model.search ||
    model.quickFilters?.length ||
    model.advanced ||
    model.sort?.fields.length ||
    model.columns?.items.length ||
    model.trailing
  );
}

/* ------------------------------------------------------------------------ */
/* Buttons                                                                   */
/* ------------------------------------------------------------------------ */

export function Badge({ children, corner }: { children: React.ReactNode; corner?: boolean }) {
  return (
    <span
      className={cn(
        "flex h-[17px] min-w-[17px] shrink-0 items-center justify-center rounded-full bg-brand px-[4px] text-[11px] leading-none font-semibold tabular-nums text-brand-fg",
        corner && "absolute -top-[5px] -right-[5px] h-[15px] min-w-[15px] px-[3px] text-[10px] shadow-[0_0_0_2px_var(--pg-surface)]",
      )}
    >
      {children}
    </span>
  );
}

/**
 * The 34px outline control, in the same shape as the page's OutlineButton —
 * or, with `glyph`, the square GlyphButton that keeps only its icon and badge.
 * `ghost` is the borderless 28px size that sits inside the filter bar.
 */
export function ToolButton({
  icon: Icon,
  label,
  value,
  count,
  glyph,
  ghost,
  active,
  chevron,
  expanded,
  onClick,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  /** The applied value, shown after the label: "Status: Open". */
  value?: string | null;
  count?: number;
  glyph?: boolean;
  ghost?: boolean;
  active?: boolean;
  chevron?: boolean;
  /** Set when the button opens a popover. */
  expanded?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const applied = !!count || !!value;
  const name = count ? `${label} (${count} applied)` : value ? `${label}: ${value}` : label;
  const tone =
    active || applied
      ? "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_30%,transparent)]"
      : "bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_3px_0_rgba(15,23,42,0.06)]";

  if (ghost) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={label}
        aria-label={name}
        aria-haspopup={expanded === undefined ? undefined : "dialog"}
        aria-expanded={expanded}
        className={cn(
          "motion-tap relative flex size-[28px] shrink-0 items-center justify-center rounded-[6px] hover:bg-pg",
          applied || active ? "text-brand" : "text-pg-text-strong",
          className,
        )}
      >
        {Icon ? <Icon size={16} aria-hidden="true" /> : null}
        {count ? <Badge corner>{count}</Badge> : null}
      </button>
    );
  }

  if (glyph && Icon) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={value ? `${label}: ${value}` : label}
        aria-label={name}
        aria-haspopup={expanded === undefined ? undefined : "dialog"}
        aria-expanded={expanded}
        className={cn(
          "motion-tap relative flex size-[34px] shrink-0 items-center justify-center rounded-[8px] active:scale-[0.94]",
          tone,
          className,
        )}
      >
        <Icon size={16} aria-hidden="true" className={applied ? "text-brand" : "text-pg-text-strong"} />
        {count ? <Badge corner>{count}</Badge> : value ? <Badge corner>1</Badge> : null}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={name}
      aria-haspopup={expanded === undefined ? undefined : "dialog"}
      aria-expanded={expanded}
      className={cn(
        "motion-tap flex h-[34px] min-w-0 shrink-0 items-center gap-[7px] rounded-[8px] px-[12px] text-[13px] leading-[normal] font-medium whitespace-nowrap active:scale-[0.97]",
        tone,
        className,
      )}
    >
      {Icon ? (
        <Icon size={15} aria-hidden="true" className={cn("shrink-0", applied ? "text-brand" : "text-pg-text-strong")} />
      ) : null}
      <span className="shrink-0">{label}</span>
      {value ? (
        <span className="max-w-[140px] truncate font-semibold">
          <span aria-hidden="true">: </span>
          {value}
        </span>
      ) : null}
      {count ? <Badge>{count}</Badge> : null}
      {chevron ? (
        <ChevronDown size={14} aria-hidden="true" className={cn("-mr-[2px] shrink-0", applied ? "text-brand" : "text-pg-muted")} />
      ) : null}
    </button>
  );
}

/* ------------------------------------------------------------------------ */
/* Search                                                                    */
/* ------------------------------------------------------------------------ */

export function SearchField({
  search,
  mode = "fixed",
  width = 240,
  className,
}: {
  search: NonNullable<Model["search"]>;
  /** `grow` takes the row's slack; `collapse` folds to a magnifier when empty. */
  mode?: "fixed" | "grow" | "collapse";
  width?: number;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Folded only when empty: a field that hides a live query behind an icon
  // hides an active filter.
  if (mode === "collapse" && !open && !search.value) {
    return <ToolButton glyph icon={Search} label={search.placeholder} onClick={() => setOpen(true)} />;
  }

  return (
    <div
      style={mode === "grow" ? undefined : { width }}
      className={cn(
        "motion-tap flex h-[34px] items-center gap-[8px] rounded-[8px] bg-pg-surface pr-[6px] pl-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        mode === "grow" ? "min-w-[160px] flex-1" : "shrink-0",
        className,
      )}
    >
      <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <input
        ref={inputRef}
        type="search"
        value={search.value}
        placeholder={search.placeholder}
        aria-label={search.placeholder}
        onChange={(e) => search.onChange(e.target.value)}
        onBlur={() => {
          if (!search.value) setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          search.onChange("");
          setOpen(false);
        }}
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {search.value ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => {
            search.onChange("");
            inputRef.current?.focus();
          }}
          className="motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[5px] text-pg-muted hover:bg-pg hover:text-pg-heading"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Quick filters                                                             */
/* ------------------------------------------------------------------------ */

/** A quick filter's options: checkboxes when multiple, a pick-one list otherwise. */
export function QuickFilterOptions({
  filter,
  onDone,
  onBack,
}: {
  filter: QuickFilter;
  onDone?: () => void;
  /** Draws a back arrow in the header — for menus that drill into a filter. */
  onBack?: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const searchable = filter.options.length > 8;
  const q = query.trim().toLowerCase();
  const options = q ? filter.options.filter((o) => o.label.toLowerCase().includes(q)) : filter.options;
  const selected = new Set(filter.value);

  return (
    <div className="flex flex-col gap-[2px] p-[6px]">
      <MenuHeader
        title={
          onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="motion-tap -ml-[6px] flex items-center gap-[4px] rounded-[6px] px-[4px] hover:bg-pg"
            >
              <ChevronLeft size={15} aria-hidden="true" className="text-pg-muted" />
              {filter.label}
            </button>
          ) : (
            filter.label
          )
        }
        action="Clear"
        actionDisabled={!filter.value.length}
        onAction={() => filter.onChange([])}
      />
      {searchable ? (
        <div className="px-[4px] pt-[4px] pb-[2px]">
          <MenuSearch value={query} onChange={setQuery} placeholder={`Search ${filter.label.toLowerCase()}`} />
        </div>
      ) : null}
      {options.length === 0 ? <MenuEmpty>No matches</MenuEmpty> : null}
      {options.map((o) => {
        const on = selected.has(o.value);
        return filter.multiple ? (
          <MenuItem
            key={o.value}
            role="menuitemcheckbox"
            checked={on}
            leading={<CheckBox checked={on} />}
            onClick={() =>
              filter.onChange(on ? filter.value.filter((v) => v !== o.value) : [...filter.value, o.value])
            }
          >
            {o.label}
          </MenuItem>
        ) : (
          <MenuItem
            key={o.value}
            role="menuitemradio"
            checked={on}
            selected={on}
            trailing={on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
            onClick={() => {
              filter.onChange(on ? [] : [o.value]);
              onDone?.();
            }}
          >
            {o.label}
          </MenuItem>
        );
      })}
    </div>
  );
}

export function QuickFilterButton({ filter, glyph }: { filter: QuickFilter; glyph?: boolean }) {
  const [pop, popAnchor] = usePopover();
  const summary = filterSummary(filter);
  return (
    <span ref={popAnchor} className="flex min-w-0 shrink-0">
      <ToolButton
        icon={filter.icon ?? (glyph ? ListFilter : undefined)}
        label={filter.label}
        value={filter.value.length > 1 ? null : summary}
        count={filter.value.length > 1 ? filter.value.length : undefined}
        glyph={glyph && !!filter.icon}
        chevron
        expanded={pop.open}
        onClick={pop.toggle}
      />
      {pop.open ? (
        <Popover anchor={pop.anchor} onClose={pop.close} label={filter.label} role="menu" width={248}>
          <QuickFilterOptions filter={filter} onDone={pop.close} />
        </Popover>
      ) : null}
    </span>
  );
}

/**
 * Every quick filter behind one control — the list, then a filter's options
 * in place. Used by "+ Filter" in the filter bar and by the other variants
 * when the row runs out of room for one button per filter.
 */
export function FilterPicker({
  filters,
  advanced,
  onDone,
}: {
  filters: QuickFilter[];
  advanced?: AdvancedModel;
  onDone: () => void;
}) {
  const [openId, setOpenId] = React.useState<string | null>(null);
  const current = filters.find((f) => f.id === openId);
  if (current) {
    return <QuickFilterOptions filter={current} onBack={() => setOpenId(null)} onDone={onDone} />;
  }
  return (
    <div className="flex flex-col gap-[2px] p-[6px]">
      {filters.length ? <MenuHeader title="Filter by" /> : null}
      {filters.map((f) => {
        const Icon = f.icon;
        const summary = filterSummary(f);
        return (
          <MenuItem
            key={f.id}
            leading={Icon ? <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" /> : null}
            trailing={
              <span className="flex shrink-0 items-center gap-[4px]">
                {summary ? (
                  <span className="max-w-[110px] truncate text-[13px] leading-[18px] font-medium text-brand">{summary}</span>
                ) : null}
                <ChevronRight size={14} aria-hidden="true" className="text-pg-faint" />
              </span>
            }
            onClick={() => setOpenId(f.id)}
          >
            {f.label}
          </MenuItem>
        );
      })}
      {advanced ? (
        <>
          {filters.length ? <MenuDivider /> : null}
          <MenuItem
            leading={<ListFilter size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />}
            trailing={advanced.count ? <Badge>{advanced.count}</Badge> : null}
            onClick={() => {
              onDone();
              advanced.onOpen();
            }}
          >
            Advanced filters…
          </MenuItem>
        </>
      ) : null}
    </div>
  );
}

/** "Filters ▾" — the collapsed form of a row of quick filter buttons. */
export function FiltersMenuButton({
  filters,
  advanced,
  glyph,
  label = "Filters",
}: {
  filters: QuickFilter[];
  advanced?: AdvancedModel;
  glyph?: boolean;
  label?: string;
}) {
  const [pop, popAnchor] = usePopover();
  const applied = filters.filter((f) => f.value.length).length + (advanced?.count ?? 0);
  return (
    <span ref={popAnchor} className="flex shrink-0">
      <ToolButton
        icon={ListFilter}
        label={label}
        count={applied || undefined}
        glyph={glyph}
        chevron
        expanded={pop.open}
        onClick={pop.toggle}
      />
      {pop.open ? (
        <Popover anchor={pop.anchor} onClose={pop.close} label={label} role="menu" width={264}>
          <FilterPicker filters={filters} advanced={advanced} onDone={pop.close} />
        </Popover>
      ) : null}
    </span>
  );
}

/** One button per filter while they fit, one "Filters ▾" once they do not. */
export function QuickFilters({
  filters,
  collapse,
  glyph,
}: {
  filters?: QuickFilter[];
  collapse?: boolean;
  glyph?: boolean;
}) {
  if (!filters?.length) return null;
  if (collapse && filters.length > 1) return <FiltersMenuButton filters={filters} glyph={glyph} />;
  return (
    <>
      {filters.map((f) => (
        <QuickFilterButton key={f.id} filter={f} glyph={glyph} />
      ))}
    </>
  );
}

export function AdvancedButton({ advanced, glyph }: { advanced?: AdvancedModel; glyph?: boolean }) {
  if (!advanced) return null;
  return (
    <ToolButton
      icon={ListFilter}
      label="Advanced filters"
      count={advanced.count || undefined}
      glyph={glyph}
      onClick={advanced.onOpen}
    />
  );
}

/* ------------------------------------------------------------------------ */
/* Sort                                                                      */
/* ------------------------------------------------------------------------ */

export function SortOptions({ sort }: { sort: SortModel }) {
  const v = sort.value;
  return (
    <div className="flex flex-col gap-[2px] p-[6px]">
      <MenuHeader title="Sort by" action="Clear sort" actionDisabled={!v} onAction={() => sort.onChange(null)} />
      {sort.fields.map((f) => {
        const on = v?.field === f.value;
        return (
          <MenuItem
            key={f.value}
            role="menuitemradio"
            checked={on}
            selected={on}
            trailing={on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
            onClick={() => sort.onChange({ field: f.value, dir: v?.dir ?? "asc" })}
          >
            {f.label}
          </MenuItem>
        );
      })}
      <MenuDivider />
      <div role="radiogroup" aria-label="Direction" className="flex gap-[4px] rounded-[8px] bg-pg p-[3px]">
        {(["asc", "desc"] as const).map((dir) => {
          const on = v?.dir === dir;
          const Icon = dir === "asc" ? ArrowUp : ArrowDown;
          return (
            <button
              key={dir}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={!v}
              onClick={() => v && sort.onChange({ ...v, dir })}
              className={cn(
                "motion-tap flex h-[28px] flex-1 items-center justify-center gap-[6px] rounded-[6px] text-[13px] leading-[18px] font-medium disabled:cursor-not-allowed disabled:text-pg-disabled",
                on
                  ? "bg-pg-surface text-pg-heading shadow-[0_1px_2px_0_rgba(16,24,40,0.08),inset_0_0_0_1px_var(--pg-border)]"
                  : "text-pg-muted enabled:hover:text-pg-heading",
              )}
            >
              <Icon size={14} aria-hidden="true" />
              {dir === "asc" ? "Ascending" : "Descending"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function SortButton({ sort, glyph, ghost }: { sort?: SortModel; glyph?: boolean; ghost?: boolean }) {
  const [pop, popAnchor] = usePopover();
  if (!sort?.fields.length) return null;
  return (
    <span ref={popAnchor} className="flex shrink-0">
      <ToolButton
        icon={ArrowUpDown}
        label="Sort"
        count={sort.value ? 1 : undefined}
        glyph={glyph}
        ghost={ghost}
        expanded={pop.open}
        onClick={pop.toggle}
      />
      {pop.open ? (
        <Popover anchor={pop.anchor} onClose={pop.close} label="Sort" align="end" width={248}>
          <SortOptions sort={sort} />
        </Popover>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Columns                                                                   */
/* ------------------------------------------------------------------------ */

export function ColumnsOptions({ columns }: { columns: ColumnsModel }) {
  const items = columns.items;
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const focusId = React.useRef<string | null>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // After a keyboard move the row re-renders in its new slot; put focus back on it.
  React.useEffect(() => {
    const id = focusId.current;
    if (!id) return;
    focusId.current = null;
    listRef.current?.querySelector<HTMLElement>(`[data-col="${CSS.escape(id)}"] [role=menuitemcheckbox]`)?.focus();
  }, [items]);

  const move = (id: string, to: number) => {
    const from = items.findIndex((c) => c.id === id);
    if (from < 0 || to < 0 || to >= items.length || from === to) return;
    // Locked columns hold their slot: nothing moves past one.
    const lo = Math.min(from, to);
    const hi = Math.max(from, to);
    for (let i = lo; i <= hi; i++) if (items[i].locked) return;
    const next = [...items];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row);
    columns.onChange(next);
  };

  const allVisible = items.every((c) => c.visible || c.locked);

  return (
    <div className="flex flex-col gap-[2px] p-[6px]">
      <MenuHeader
        title="Columns"
        action="Show all"
        actionDisabled={allVisible}
        onAction={() => columns.onChange(items.map((c) => ({ ...c, visible: true })))}
      />
      <div ref={listRef} className="flex flex-col gap-[1px]">
        {items.map((c, i) => {
          const locked = !!c.locked;
          return (
            <div
              key={c.id}
              data-col={c.id}
              draggable={!locked}
              onDragStart={(e) => {
                setDragId(c.id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", c.id);
              }}
              onDragOver={(e) => {
                if (!dragId || locked) return;
                e.preventDefault();
                if (overId !== c.id) setOverId(c.id);
              }}
              onDragLeave={() => setOverId((v) => (v === c.id ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId && !locked) move(dragId, i);
                setDragId(null);
                setOverId(null);
              }}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "group relative flex items-center rounded-[8px]",
                dragId === c.id && "opacity-50",
                overId === c.id && dragId !== c.id && "shadow-[inset_0_2px_0_0_var(--brand)]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex w-[18px] shrink-0 justify-center",
                  locked ? "text-pg-disabled" : "cursor-grab text-pg-faint group-hover:text-pg-muted",
                )}
              >
                {locked ? <Lock size={12} /> : <GripVertical size={14} />}
              </span>
              <MenuItem
                role="menuitemcheckbox"
                checked={c.visible}
                disabled={locked}
                title={locked ? `${c.label} is always shown` : "Drag, or press Alt+Up/Down to reorder"}
                leading={<CheckBox checked={c.visible || locked} disabled={locked} />}
                className="pl-[6px]"
                onClick={() =>
                  columns.onChange(items.map((x) => (x.id === c.id ? { ...x, visible: !x.visible } : x)))
                }
              >
                <span className={cn(locked && "text-pg-muted")}>{c.label}</span>
              </MenuItem>
              {/* Alt+Arrow reorders; caught on the row so the menu's own arrow walk stays intact. */}
              <KeyMove
                enabled={!locked}
                onMove={(dir) => {
                  focusId.current = c.id;
                  move(c.id, i + dir);
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="px-[10px] pt-[4px] pb-[2px] text-[13px] leading-[18px] text-pg-muted">
        Drag or press Alt+↑/↓ to reorder
      </div>
    </div>
  );
}

/**
 * Listens for Alt+Up/Down on the row it sits in. A zero-size element rather
 * than a handler on the row, so the row itself stays a plain drag target.
 */
function KeyMove({ enabled, onMove }: { enabled: boolean; onMove: (dir: -1 | 1) => void }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const moveRef = React.useRef(onMove);
  React.useEffect(() => {
    moveRef.current = onMove;
  });
  React.useEffect(() => {
    const row = ref.current?.parentElement;
    if (!row || !enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.altKey || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
      e.preventDefault();
      e.stopPropagation();
      moveRef.current(e.key === "ArrowUp" ? -1 : 1);
    };
    row.addEventListener("keydown", onKeyDown);
    return () => row.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
  return <span ref={ref} aria-hidden="true" className="hidden" />;
}

export function ColumnsButton({ columns, glyph, ghost }: { columns?: ColumnsModel; glyph?: boolean; ghost?: boolean }) {
  const [pop, popAnchor] = usePopover();
  if (!columns?.items.length) return null;
  const hidden = columns.items.filter((c) => !c.visible && !c.locked).length;
  return (
    <span ref={popAnchor} className="flex shrink-0">
      <ToolButton
        icon={Columns3}
        label="Columns"
        count={hidden || undefined}
        glyph={glyph}
        ghost={ghost}
        expanded={pop.open}
        onClick={pop.toggle}
      />
      {pop.open ? (
        <Popover anchor={pop.anchor} onClose={pop.close} label="Columns" align="end" width={264}>
          <ColumnsOptions columns={columns} />
        </Popover>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Chips                                                                     */
/* ------------------------------------------------------------------------ */

export function Chip({ chip, size = "md" }: { chip: ChipData; size?: "sm" | "md" }) {
  const Icon = chip.icon;
  return (
    <span
      title={chip.label}
      className={cn(
        "flex max-w-[260px] min-w-0 shrink-0 items-center gap-[4px] rounded-[6px] bg-brand-soft font-medium text-brand",
        size === "sm" ? "h-[24px] pr-[2px] pl-[8px] text-[13px] leading-[18px]" : "h-[26px] pr-[3px] pl-[9px] text-[13px] leading-[18px]",
      )}
    >
      {Icon ? <Icon size={13} aria-hidden="true" className="shrink-0" /> : null}
      <span className="truncate">{chip.label}</span>
      <button
        type="button"
        aria-label={`Remove ${chip.label}`}
        onClick={chip.onRemove}
        className="motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[4px] hover:bg-[color-mix(in_oklab,var(--brand)_14%,transparent)]"
      >
        <X size={13} aria-hidden="true" />
      </button>
    </span>
  );
}

export function ClearAllButton({ model, className }: { model: Model; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => clearAll(model)}
      className={cn(
        "motion-tap shrink-0 px-[4px] text-[13px] leading-[18px] font-medium text-pg-muted hover:text-pg-heading",
        className,
      )}
    >
      Clear all
    </button>
  );
}

/** What is applied, removable — rendered only when something is. */
export function FilterChips({ model, showCount }: { model: Model; showCount?: boolean }) {
  const chips = collectChips(model);
  if (!chips.length) return null;
  return (
    <div className="flex min-w-0 shrink-0 flex-wrap items-center gap-[6px]">
      {chips.map((c) => (
        <Chip key={c.id} chip={c} />
      ))}
      <ClearAllButton model={model} />
      {showCount && model.resultCount ? <ResultCount resultCount={model.resultCount} className="ml-auto" /> : null}
    </div>
  );
}

export function ResultCount({
  resultCount,
  className,
}: {
  resultCount: NonNullable<Model["resultCount"]>;
  className?: string;
}) {
  const { value, noun } = resultCount;
  const word = value === 1 ? singular(noun) : plural(noun);
  return (
    <span
      aria-live="polite"
      className={cn("shrink-0 text-[13px] leading-[18px] whitespace-nowrap tabular-nums text-pg-muted", className)}
    >
      {value.toLocaleString("en-US")} {word}
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Views                                                                     */
/* ------------------------------------------------------------------------ */

type ViewItem = Views["items"][number];

/** The first `max` views, with the active one never in the overflow. */
export function splitViews(views: Views, max: number): { shown: ViewItem[]; hidden: ViewItem[] } {
  const items = views.items;
  if (items.length <= max) return { shown: items, hidden: [] };
  const head = items.slice(0, max);
  const active = items.find((v) => v.id === views.activeId);
  if (!active || head.some((v) => v.id === active.id)) return { shown: head, hidden: items.slice(max) };
  const kept = head.slice(0, -1);
  return {
    shown: [...kept, active],
    hidden: items.filter((v) => v.id !== active.id && !kept.some((k) => k.id === v.id)),
  };
}

/** The views as a menu: search past 6, then "+ New {noun}". */
export function ViewsMenuContent({
  views,
  items = views.items,
  onDone,
}: {
  views: Views;
  items?: ViewItem[];
  onDone: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const q = query.trim().toLowerCase();
  const list = q ? items.filter((v) => v.label.toLowerCase().includes(q)) : items;
  const noun = viewNoun(views);
  return (
    <div className="flex flex-col gap-[2px] p-[6px]">
      {items.length > 6 ? (
        <div className="px-[4px] pt-[2px] pb-[4px]">
          <MenuSearch value={query} onChange={setQuery} placeholder={`Search ${plural(noun)}`} />
        </div>
      ) : null}
      {list.length === 0 ? <MenuEmpty>No matches</MenuEmpty> : null}
      {list.map((v) => {
        const on = v.id === views.activeId;
        const Icon = v.icon;
        const count = formatCount(v.count);
        return (
          <MenuItem
            key={v.id}
            role="menuitemradio"
            checked={on}
            selected={on}
            title={v.label}
            leading={Icon ? <Icon size={15} aria-hidden="true" className={cn("shrink-0", on ? "text-brand" : "text-pg-muted")} /> : null}
            trailing={
              <span className="flex shrink-0 items-center gap-[8px]">
                {count ? <span className="text-[13px] leading-[18px] tabular-nums text-pg-faint">{count}</span> : null}
                <Check size={14} aria-hidden="true" className={on ? "text-brand" : "invisible"} />
              </span>
            }
            onClick={() => {
              views.onSelect(v.id);
              onDone();
            }}
          >
            {v.label}
          </MenuItem>
        );
      })}
      {views.onCreate ? (
        <>
          <MenuDivider />
          <MenuItem
            className="font-medium text-brand"
            leading={<Plus size={15} aria-hidden="true" className="shrink-0" />}
            onClick={() => {
              onDone();
              views.onCreate?.();
            }}
          >
            New {noun}
          </MenuItem>
        </>
      ) : null}
    </div>
  );
}

/** Underline tabs, as ViewBar draws them; the rest behind "N more ▾". */
export function ViewsTabs({ views, maxVisible }: { views: Views; maxVisible: number }) {
  const { shown, hidden } = splitViews(views, Math.max(1, maxVisible));
  const [more, moreAnchor] = usePopover();
  return (
    <div role="tablist" aria-label={cap(plural(viewNoun(views)))} className="flex min-w-0 shrink items-stretch">
      <div className="flex min-w-0 shrink items-stretch gap-[2px]">
        {shown.map((v) => {
          const on = v.id === views.activeId;
          const Icon = v.icon;
          const count = formatCount(v.count);
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={on}
              title={v.label}
              onClick={() => views.onSelect(v.id)}
              className={cn(
                "motion-tap relative flex min-w-0 shrink items-center gap-[6px] px-[10px] text-[14px] leading-[20px] whitespace-nowrap",
                on ? "font-semibold text-brand" : "font-medium text-pg-muted hover:text-pg-text",
              )}
            >
              {Icon ? <Icon size={15} aria-hidden="true" className={cn("shrink-0", on ? "text-brand" : "text-pg-faint")} /> : null}
              <span className="max-w-[168px] truncate">{v.label}</span>
              {count ? (
                <span
                  className={cn(
                    "flex h-[18px] shrink-0 items-center rounded-[5px] px-[5px] text-[12px] leading-none font-semibold tabular-nums",
                    on ? "bg-brand-soft text-brand" : "text-pg-faint",
                  )}
                >
                  {count}
                </span>
              ) : null}
              <span
                aria-hidden="true"
                className={cn("motion-move absolute inset-x-0 -bottom-px h-[2px] rounded-full", on ? "bg-brand" : "bg-transparent")}
              />
            </button>
          );
        })}
      </div>
      {hidden.length ? (
        <span ref={moreAnchor} className="flex shrink-0 items-center">
          <button
            type="button"
            aria-haspopup="menu"
            aria-expanded={more.open}
            onClick={more.toggle}
            className="motion-tap flex h-[26px] items-center gap-[4px] rounded-[7px] px-[8px] text-[13px] leading-none font-medium whitespace-nowrap text-pg-muted hover:bg-pg hover:text-pg-text"
          >
            {hidden.length} more
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {more.open ? (
            <Popover anchor={more.anchor} onClose={more.close} label="More views" role="menu" width={260}>
              <ViewsMenuContent views={views} items={hidden} onDone={more.close} />
            </Popover>
          ) : null}
        </span>
      ) : null}
      {views.onCreate ? (
        <button
          type="button"
          onClick={views.onCreate}
          className="motion-tap flex shrink-0 items-center gap-[4px] px-[8px] text-[13px] leading-none font-medium whitespace-nowrap text-brand hover:brightness-110"
        >
          <Plus size={14} aria-hidden="true" />
          {cap(viewNoun(views))}
        </button>
      ) : null}
    </div>
  );
}

/** "Open opportunities ▾" — the active view as a button, the rest in its menu. */
export function ViewsDropdown({ views, token }: { views: Views; token?: boolean }) {
  const [pop, popAnchor] = usePopover();
  const active = views.items.find((v) => v.id === views.activeId) ?? views.items[0];
  if (!active) return null;
  const Icon = active.icon;
  const count = formatCount(active.count);
  return (
    <span ref={popAnchor} className="flex min-w-0 shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={pop.open}
        aria-label={`${cap(viewNoun(views))}: ${active.label}`}
        onClick={pop.toggle}
        className={cn(
          "motion-tap flex min-w-0 items-center gap-[6px] font-semibold whitespace-nowrap",
          token
            ? "h-[26px] max-w-[240px] rounded-[6px] bg-pg px-[8px] text-[13px] leading-[18px] text-pg-heading hover:bg-[color-mix(in_oklab,var(--pg-border)_60%,var(--pg-bg))]"
            : "h-[34px] max-w-[260px] rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_3px_0_rgba(15,23,42,0.06)]",
        )}
      >
        {Icon ? <Icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" /> : null}
        <span className="truncate">{active.label}</span>
        {count && !token ? (
          <span className="shrink-0 text-[12px] leading-none font-semibold tabular-nums text-pg-faint">{count}</span>
        ) : null}
        <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-pg-muted" />
      </button>
      {pop.open ? (
        <Popover anchor={pop.anchor} onClose={pop.close} label={cap(plural(viewNoun(views)))} role="menu" width={280}>
          <ViewsMenuContent views={views} onDone={pop.close} />
        </Popover>
      ) : null}
    </span>
  );
}

/** A segmented group; what does not fit goes in "More ▾". */
export function ViewsPills({ views, maxVisible }: { views: Views; maxVisible: number }) {
  const { shown, hidden } = splitViews(views, Math.max(1, maxVisible));
  const [more, moreAnchor] = usePopover();
  const pill =
    "motion-tap flex h-[28px] min-w-0 shrink items-center gap-[6px] rounded-[6px] px-[10px] text-[13px] leading-[18px] whitespace-nowrap";
  return (
    <div className="flex min-w-0 shrink items-center gap-[8px]">
      <div
        role="tablist"
        aria-label={cap(plural(viewNoun(views)))}
        className="flex min-w-0 shrink items-center gap-[2px] rounded-[8px] bg-pg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
      >
        {shown.map((v) => {
          const on = v.id === views.activeId;
          const Icon = v.icon;
          const count = formatCount(v.count);
          return (
            <button
              key={v.id}
              type="button"
              role="tab"
              aria-selected={on}
              title={v.label}
              onClick={() => views.onSelect(v.id)}
              className={cn(
                pill,
                on
                  ? "bg-pg-surface font-semibold text-pg-heading shadow-[0_1px_2px_0_rgba(16,24,40,0.08),inset_0_0_0_1px_var(--pg-border)]"
                  : "font-medium text-pg-muted hover:text-pg-heading",
              )}
            >
              {Icon ? <Icon size={14} aria-hidden="true" className={cn("shrink-0", on ? "text-brand" : "text-pg-faint")} /> : null}
              <span className="max-w-[150px] truncate">{v.label}</span>
              {count ? (
                <span className={cn("shrink-0 text-[12px] tabular-nums", on ? "text-brand" : "text-pg-faint")}>{count}</span>
              ) : null}
            </button>
          );
        })}
        {hidden.length ? (
          <span ref={moreAnchor} className="flex shrink-0">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={more.open}
              onClick={more.toggle}
              className={cn(pill, "shrink-0 font-medium text-pg-muted hover:text-pg-heading")}
            >
              More
              <ChevronDown size={14} aria-hidden="true" />
            </button>
            {more.open ? (
              <Popover anchor={more.anchor} onClose={more.close} label="More views" role="menu" width={260}>
                <ViewsMenuContent views={views} items={hidden} onDone={more.close} />
              </Popover>
            ) : null}
          </span>
        ) : null}
      </div>
      {views.onCreate ? (
        <button
          type="button"
          onClick={views.onCreate}
          className="motion-tap flex h-[34px] shrink-0 items-center gap-[4px] rounded-[8px] px-[8px] text-[13px] leading-none font-medium whitespace-nowrap text-brand hover:bg-brand-soft"
        >
          <Plus size={14} aria-hidden="true" />
          New {viewNoun(views)}
        </button>
      ) : null}
    </div>
  );
}

/** The vertical list for the side-views variant; folds to a 40px rail. */
export function ViewsSideList({
  views,
  collapsed,
  onToggle,
}: {
  views: Views;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const noun = viewNoun(views);
  const title = cap(plural(noun));
  if (collapsed) {
    return (
      <nav aria-label={title} className="flex w-[40px] shrink-0 flex-col items-center gap-[4px] border-r border-pg-head-border pr-[4px]">
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Show ${plural(noun)}`}
          title={`Show ${plural(noun)}`}
          className="motion-tap flex size-[32px] items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg hover:text-pg-heading"
        >
          <PanelLeftOpen size={16} aria-hidden="true" />
        </button>
        {views.items.map((v) => {
          const on = v.id === views.activeId;
          const Icon = v.icon;
          return (
            <button
              key={v.id}
              type="button"
              aria-current={on ? "true" : undefined}
              aria-label={v.label}
              title={v.label}
              onClick={() => views.onSelect(v.id)}
              className={cn(
                "motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-[12px] font-semibold",
                on ? "bg-brand-soft text-brand" : "text-pg-muted hover:bg-pg hover:text-pg-heading",
              )}
            >
              {Icon ? <Icon size={15} aria-hidden="true" /> : v.label.slice(0, 1).toUpperCase()}
            </button>
          );
        })}
        {views.onCreate ? (
          <button
            type="button"
            onClick={views.onCreate}
            aria-label={`New ${noun}`}
            title={`New ${noun}`}
            className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-brand hover:bg-brand-soft"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
        ) : null}
      </nav>
    );
  }
  return (
    <nav aria-label={title} className="flex w-[200px] shrink-0 flex-col gap-[2px] overflow-y-auto border-r border-pg-head-border pr-[12px]">
      <div className="flex h-[34px] shrink-0 items-center justify-between pl-[10px]">
        <span className="text-[13px] leading-[18px] font-semibold text-pg-muted">{title}</span>
        <button
          type="button"
          onClick={onToggle}
          aria-label={`Hide ${plural(noun)}`}
          title={`Hide ${plural(noun)}`}
          className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
        >
          <PanelLeftClose size={16} aria-hidden="true" />
        </button>
      </div>
      {views.items.map((v) => {
        const on = v.id === views.activeId;
        const Icon = v.icon;
        const count = formatCount(v.count);
        return (
          <button
            key={v.id}
            type="button"
            aria-current={on ? "true" : undefined}
            title={v.label}
            onClick={() => views.onSelect(v.id)}
            className={cn(
              "motion-tap flex h-[34px] w-full shrink-0 items-center gap-[8px] rounded-[8px] px-[10px] text-left text-[14px] leading-[20px]",
              on ? "bg-brand-soft font-semibold text-brand" : "font-medium text-pg-text hover:bg-pg",
            )}
          >
            {Icon ? <Icon size={15} aria-hidden="true" className={cn("shrink-0", on ? "text-brand" : "text-pg-muted")} /> : null}
            <span className="min-w-0 flex-1 truncate">{v.label}</span>
            {count ? (
              <span className={cn("shrink-0 text-[12px] tabular-nums", on ? "text-brand" : "text-pg-faint")}>{count}</span>
            ) : null}
          </button>
        );
      })}
      {views.onCreate ? (
        <button
          type="button"
          onClick={views.onCreate}
          className="motion-tap mt-[4px] flex h-[34px] w-full shrink-0 items-center gap-[8px] rounded-[8px] px-[10px] text-left text-[14px] leading-[20px] font-medium text-brand hover:bg-brand-soft"
        >
          <Plus size={15} aria-hidden="true" />
          New {noun}
        </button>
      ) : null}
    </nav>
  );
}
