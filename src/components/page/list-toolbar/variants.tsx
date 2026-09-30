"use client";

import * as React from "react";
import { ArrowUpDown, ChevronDown, Columns3, ListFilter, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import type { ListToolbarVariant } from "@/design/theme";
import { cn } from "@/lib/utils";
import { MenuDivider, MenuItem, Popover, usePopover } from "./popover";
import {
  AdvancedButton,
  Badge,
  Chip,
  ClearAllButton,
  ColumnsButton,
  ColumnsOptions,
  FilterChips,
  FilterPicker,
  QuickFilterOptions,
  QuickFilters,
  ResultCount,
  SearchField,
  SortButton,
  SortOptions,
  ToolButton,
  ViewsDropdown,
  ViewsPills,
  ViewsSideList,
  ViewsTabs,
  appliedCount,
  clearAll,
  collectChips,
  filterSummary,
  hasFilterControls,
  useFitLevel,
  useWidth,
  type Model,
  type QuickFilter,
} from "./parts";

/*
 * The six toolbars. Each is a different answer to where views, search, quick
 * filters, advanced filters, sort and columns go — built from the same parts,
 * so the comparison is the arrangement and nothing else.
 *
 * Width is measured on the toolbar itself, not the window: the list sits
 * beside a nav whose width changes, and the question every rung below asks is
 * "does this row have room", which only the row can answer.
 */

type Props = { model: Model; children?: React.ReactNode };

/** Search, quick filters, Advanced, Sort, Columns, trailing — at a given density. */
function Controls({
  model,
  search,
  searchWidth = 240,
  collapseFilters,
  glyph,
}: {
  model: Model;
  search: "fixed" | "grow" | "collapse" | "none";
  searchWidth?: number;
  collapseFilters?: boolean;
  glyph?: boolean;
}) {
  return (
    <>
      {model.search && search !== "none" ? (
        <SearchField search={model.search} mode={search} width={searchWidth} />
      ) : null}
      <QuickFilters filters={model.quickFilters} collapse={collapseFilters} />
      <AdvancedButton advanced={model.advanced} glyph={glyph} />
      <SortButton sort={model.sort} glyph={glyph} />
      <ColumnsButton columns={model.columns} glyph={glyph} />
      {model.trailing ? <span className="flex shrink-0 items-center gap-[8px]">{model.trailing}</span> : null}
    </>
  );
}

/* 1. Tabs and filters in one row ------------------------------------------ */

function OneRow({ model, children }: Props) {
  const views = model.views;
  const filters = model.quickFilters?.length ?? 0;
  const viewCount = views?.items.length ?? 0;
  /*
   * The rungs, widest first. Controls give way before tabs do, because the
   * active view is what the row is for; tabs then drop one at a time into
   * "More" until one is left.
   *   0 full · 1 narrower search · 2 icon-only buttons · 3 quick filters in
   *   one menu · 4 search as an icon · 5+ one fewer tab each
   */
  const maxTabs = Math.min(5, Math.max(1, viewCount));
  const max = 4 + (maxTabs - 1);
  const applied = (model.quickFilters ?? []).map((f) => f.value.join(",")).join("|");
  const [ref, level] = useFitLevel<HTMLDivElement>(
    max,
    [viewCount, views?.activeId, applied, model.advanced?.count, model.sort?.value?.field, model.search?.value ? 1 : 0].join("·"),
  );
  const tabs = Math.max(1, maxTabs - Math.max(0, level - 4));
  return (
    <>
      <div className="flex shrink-0 flex-col gap-[10px]">
        {views || hasFilterControls(model) ? (
          <div
            ref={ref}
            className={cn(
              "flex h-[44px] min-w-0 items-stretch gap-[12px]",
              views && "border-b border-pg-head-border",
            )}
          >
            {views ? (
              // shrink-0 so a crowded row shows up as overflow and steps down,
              // rather than silently truncating every tab label.
              <span className="flex shrink-0 items-stretch">
                <ViewsTabs views={views} maxVisible={tabs} />
              </span>
            ) : null}
            <div className="ml-auto flex shrink-0 items-center gap-[8px] pb-[4px]">
              <Controls
                model={model}
                search={level >= 4 ? "collapse" : "fixed"}
                searchWidth={level >= 1 ? 200 : 240}
                collapseFilters={level >= 3 || filters > 3}
                glyph={level >= 2}
              />
            </div>
          </div>
        ) : null}
        <FilterChips model={model} showCount />
      </div>
      {children}
    </>
  );
}

/* 2. Views in a dropdown -------------------------------------------------- */

function ViewDropdown({ model, children }: Props) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const filters = model.quickFilters?.length ?? 0;
  return (
    <>
      <div ref={ref} className="flex shrink-0 flex-col gap-[10px]">
        {model.views || hasFilterControls(model) ? (
          <div className="flex min-w-0 items-center gap-[8px]">
            {model.views ? <ViewsDropdown views={model.views} /> : null}
            {model.search ? (
              <SearchField search={model.search} mode="grow" />
            ) : (
              <span aria-hidden="true" className="flex-1" />
            )}
            <Controls
              model={model}
              search="none"
              collapseFilters={w < 960 || filters > 3}
              glyph={w < 1180}
            />
          </div>
        ) : null}
        <FilterChips model={model} showCount />
      </div>
      {children}
    </>
  );
}

/* 3. Views as pills ------------------------------------------------------- */

function Pills({ model, children }: Props) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const filters = model.quickFilters?.length ?? 0;
  const pills = w >= 1400 ? 6 : w >= 1100 ? 5 : w >= 880 ? 4 : 3;
  const countOnTop = !!model.views;
  return (
    <>
      <div ref={ref} className="flex shrink-0 flex-col gap-[10px]">
        {model.views ? (
          <div className="flex min-w-0 items-center gap-[12px]">
            <ViewsPills views={model.views} maxVisible={pills} />
            {model.resultCount ? <ResultCount resultCount={model.resultCount} className="ml-auto" /> : null}
          </div>
        ) : null}
        {hasFilterControls(model) || (!countOnTop && model.resultCount) ? (
          <div className="flex min-w-0 items-center gap-[8px]">
            {model.search ? (
              <SearchField search={model.search} mode={w < 900 ? "grow" : "fixed"} width={w >= 1200 ? 280 : 240} />
            ) : null}
            <span aria-hidden="true" className={cn(w < 900 && model.search ? "hidden" : "min-w-[8px] flex-1")} />
            {!countOnTop && model.resultCount ? <ResultCount resultCount={model.resultCount} className="mr-[4px]" /> : null}
            <Controls model={model} search="none" collapseFilters={w < 960 || filters > 3} glyph={w < 1100} />
          </div>
        ) : null}
        <FilterChips model={model} />
      </div>
      {children}
    </>
  );
}

/* 4. Views in a side list ------------------------------------------------- */

function SideViews({ model, children }: Props) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [collapsed, setCollapsed] = React.useState(false);
  const filters = model.quickFilters?.length ?? 0;
  return (
    <div className="flex min-h-0 min-w-0 flex-1 gap-[16px]">
      {model.views ? (
        <ViewsSideList views={model.views} collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      ) : null}
      <div ref={ref} className="flex min-h-0 min-w-0 flex-1 flex-col gap-[12px]">
        {hasFilterControls(model) ? (
          <div className="flex min-w-0 shrink-0 items-center gap-[8px]">
            {model.search ? (
              <SearchField search={model.search} mode="grow" />
            ) : (
              <span aria-hidden="true" className="flex-1" />
            )}
            <Controls model={model} search="none" collapseFilters={w < 900 || filters > 3} glyph={w < 1080} />
          </div>
        ) : null}
        <FilterChips model={model} showCount />
        {!collectChips(model).length && model.resultCount ? (
          <ResultCount resultCount={model.resultCount} className="-mt-[4px]" />
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </div>
  );
}

/* 5. One filter bar ------------------------------------------------------- */

function FilterBar({ model, children }: Props) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const [picker, pickerAnchor] = usePopover();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const chips = collectChips(model);
  const canFilter = !!(model.quickFilters?.length || model.advanced);
  const right = !!(model.sort?.fields.length || model.columns?.items.length || chips.length);
  return (
    <>
      <div ref={ref} className="flex shrink-0 items-start gap-[8px]">
        <div
          onClick={(e) => {
            // A click on the bar's empty space lands in the search, like a field.
            if (e.target === e.currentTarget) inputRef.current?.focus();
          }}
          className="motion-tap flex min-h-[36px] min-w-0 flex-1 items-start gap-[4px] rounded-[8px] bg-pg-surface px-[5px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]"
        >
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) inputRef.current?.focus();
            }}
            className="flex min-w-0 flex-1 flex-wrap items-center gap-[4px] py-[5px]"
          >
            <Search size={15} aria-hidden="true" className="mx-[4px] shrink-0 text-pg-faint" />
            {model.views ? <ViewsDropdown views={model.views} token /> : null}
            {chips.map((c) => (
              <Chip key={c.id} chip={c} size="sm" />
            ))}
            {canFilter ? (
              <span ref={pickerAnchor} className="flex shrink-0">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={picker.open}
                  onClick={picker.toggle}
                  className="motion-tap flex h-[24px] items-center gap-[4px] rounded-[6px] px-[6px] text-[13px] leading-[18px] font-medium text-pg-muted hover:bg-pg hover:text-pg-heading"
                >
                  <Plus size={14} aria-hidden="true" />
                  Filter
                </button>
                {picker.open ? (
                  <Popover anchor={picker.anchor} onClose={picker.close} label="Add filter" role="menu" width={264}>
                    <FilterPicker
                      filters={model.quickFilters ?? []}
                      advanced={model.advanced}
                      onDone={picker.close}
                    />
                  </Popover>
                ) : null}
              </span>
            ) : null}
            {model.search ? (
              <input
                ref={inputRef}
                type="search"
                value={model.search.value}
                placeholder={chips.length ? "Search" : model.search.placeholder}
                aria-label={model.search.placeholder}
                onChange={(e) => model.search?.onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape" && model.search?.value) {
                    e.stopPropagation();
                    model.search.onChange("");
                  }
                  // Backspace in an empty field takes the last token, as in
                  // every token field.
                  if (e.key === "Backspace" && !model.search?.value && chips.length) {
                    chips[chips.length - 1].onRemove();
                  }
                }}
                className="h-[24px] min-w-[120px] flex-1 bg-transparent px-[4px] text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
            ) : null}
          </div>
          {right ? (
            <div className="flex h-[36px] shrink-0 items-center gap-[2px]">
              {chips.length || model.search?.value ? (
                <button
                  type="button"
                  aria-label="Clear all"
                  title="Clear all"
                  onClick={() => {
                    model.search?.onChange("");
                    clearAll(model);
                  }}
                  className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
                >
                  <X size={15} aria-hidden="true" />
                </button>
              ) : null}
              {model.sort?.fields.length || model.columns?.items.length ? (
                <span aria-hidden="true" className="mx-[4px] h-[18px] w-px bg-pg-border" />
              ) : null}
              <SortButton sort={model.sort} ghost />
              <ColumnsButton columns={model.columns} ghost />
            </div>
          ) : null}
        </div>
        {model.resultCount && w >= 1000 ? (
          <ResultCount resultCount={model.resultCount} className="flex h-[36px] items-center px-[4px]" />
        ) : null}
        {model.trailing ? <span className="flex h-[36px] shrink-0 items-center gap-[8px]">{model.trailing}</span> : null}
      </div>
      {children}
    </>
  );
}

/* 6. Tabs and a View menu ------------------------------------------------- */

type ViewTab = "filter" | "sort" | "columns";

function ViewMenu({ model, children }: Props) {
  const [pop, popAnchor] = usePopover();
  const views = model.views;
  const tabs: { id: ViewTab; label: string; icon: typeof ListFilter }[] = [];
  if (model.quickFilters?.length || model.advanced) tabs.push({ id: "filter", label: "Filter", icon: ListFilter });
  if (model.sort?.fields.length) tabs.push({ id: "sort", label: "Sort", icon: ArrowUpDown });
  if (model.columns?.items.length) tabs.push({ id: "columns", label: "Columns", icon: Columns3 });
  const applied = appliedCount(model);
  /*
   * Measured, like one-row: 0 full · 1 narrower search · 2 search as an
   * icon · 3+ one fewer tab each, down to the active one.
   */
  const maxTabs = Math.min(6, Math.max(1, views?.items.length ?? 0));
  const [ref, level] = useFitLevel<HTMLDivElement>(
    2 + (maxTabs - 1),
    [views?.items.length, views?.activeId, applied, model.search?.value ? 1 : 0].join("·"),
  );
  const tabCount = Math.max(1, maxTabs - Math.max(0, level - 2));
  const any = views || model.search || tabs.length || model.trailing;
  return (
    <>
      <div className="flex shrink-0 flex-col">
        {any ? (
          <div
            ref={ref}
            className={cn(
              "flex h-[44px] min-w-0 items-stretch gap-[12px]",
              views && "border-b border-pg-head-border",
            )}
          >
            {views ? (
              <span className="flex shrink-0 items-stretch">
                <ViewsTabs views={views} maxVisible={tabCount} />
              </span>
            ) : null}
            <div className={cn("flex items-center gap-[8px] pb-[4px]", views ? "ml-auto shrink-0" : "min-w-0 flex-1")}>
              {model.search ? (
                <SearchField
                  search={model.search}
                  mode={views ? (level >= 2 ? "collapse" : "fixed") : "grow"}
                  width={level >= 1 ? 200 : 240}
                />
              ) : (
                !views && <span aria-hidden="true" className="flex-1" />
              )}
              {tabs.length ? (
                <span ref={popAnchor} className="flex shrink-0">
                  <ToolButton
                    icon={SlidersHorizontal}
                    label="View"
                    count={applied || undefined}
                    chevron
                    expanded={pop.open}
                    onClick={pop.toggle}
                  />
                  {pop.open ? (
                    <Popover anchor={pop.anchor} onClose={pop.close} label="View options" align="end" width={340}>
                      <ViewMenuPanel model={model} tabs={tabs} onDone={pop.close} />
                    </Popover>
                  ) : null}
                </span>
              ) : null}
              {model.trailing ? <span className="flex shrink-0 items-center gap-[8px]">{model.trailing}</span> : null}
            </div>
          </div>
        ) : null}
      </div>
      {children}
    </>
  );
}

function ViewMenuPanel({
  model,
  tabs,
  onDone,
}: {
  model: Model;
  tabs: { id: ViewTab; label: string; icon: typeof ListFilter }[];
  onDone: () => void;
}) {
  const [tab, setTab] = React.useState<ViewTab>(tabs[0].id);
  const current = tabs.some((t) => t.id === tab) ? tab : tabs[0].id;
  const applied = appliedCount(model);
  return (
    <div className="flex flex-col">
      <div role="tablist" aria-label="View options" className="flex gap-[4px] border-b border-pg-head-border px-[8px] pt-[6px]">
        {tabs.map((t) => {
          const on = t.id === current;
          const n =
            t.id === "filter"
              ? (model.quickFilters ?? []).filter((f) => f.value.length).length + (model.advanced?.count ?? 0)
              : t.id === "sort"
                ? model.sort?.value
                  ? 1
                  : 0
                : (model.columns?.items ?? []).filter((c) => !c.visible && !c.locked).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={cn(
                "motion-tap relative flex h-[32px] items-center gap-[6px] px-[8px] text-[14px] leading-[20px]",
                on ? "font-semibold text-brand" : "font-medium text-pg-muted hover:text-pg-text",
              )}
            >
              {t.label}
              {n ? <Badge>{n}</Badge> : null}
              <span
                aria-hidden="true"
                className={cn("absolute inset-x-0 -bottom-px h-[2px] rounded-full", on ? "bg-brand" : "bg-transparent")}
              />
            </button>
          );
        })}
      </div>
      {current === "filter" ? <FilterTab model={model} onDone={onDone} /> : null}
      {current === "sort" && model.sort ? <SortOptions sort={model.sort} /> : null}
      {current === "columns" && model.columns ? <ColumnsOptions columns={model.columns} /> : null}
      {applied ? (
        <div className="flex justify-end border-t border-pg-head-border px-[10px] py-[8px]">
          <ClearAllButton model={model} />
        </div>
      ) : null}
    </div>
  );
}

function FilterTab({ model, onDone }: { model: Model; onDone: () => void }) {
  const filters = model.quickFilters ?? [];
  return (
    <div className="flex flex-col gap-[12px] p-[12px]">
      {filters.map((f) => (
        <InlineFilterSelect key={f.id} filter={f} />
      ))}
      {model.advanced ? (
        <>
          {filters.length ? <MenuDivider /> : null}
          <MenuItem
            className="-mx-[6px] -my-[4px] w-auto font-medium text-brand"
            leading={<ListFilter size={15} aria-hidden="true" className="shrink-0" />}
            trailing={model.advanced.count ? <Badge>{model.advanced.count}</Badge> : null}
            onClick={() => {
              onDone();
              model.advanced?.onOpen();
            }}
          >
            Advanced filters…
          </MenuItem>
        </>
      ) : null}
    </div>
  );
}

/** Label over a 36px select-shaped button, which opens the filter's options. */
function InlineFilterSelect({ filter }: { filter: QuickFilter }) {
  const [pop, popAnchor] = usePopover();
  const summary = filterSummary(filter);
  return (
    <div className="flex flex-col gap-[4px]">
      <span className="text-[13px] leading-[18px] font-medium text-pg-text">{filter.label}</span>
      <span ref={popAnchor} className="flex">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={pop.open}
          aria-label={`${filter.label}: ${summary ?? "Any"}`}
          onClick={pop.toggle}
          className="motion-tap flex h-[36px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
        >
          <span className={cn("min-w-0 flex-1 truncate", summary ? "text-pg-text" : "text-pg-faint")}>
            {summary ?? "Any"}
          </span>
<ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
        </button>
        {pop.open ? (
          <Popover anchor={pop.anchor} onClose={pop.close} label={filter.label} role="menu" width={280}>
            <QuickFilterOptions filter={filter} onDone={pop.close} />
          </Popover>
        ) : null}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------------ */

export function ListToolbarVariantView({
  variant,
  model,
  children,
}: Props & { variant: ListToolbarVariant }) {
  switch (variant) {
    case "one-row":
      return <OneRow model={model}>{children}</OneRow>;
    case "view-dropdown":
      return <ViewDropdown model={model}>{children}</ViewDropdown>;
    case "pills":
      return <Pills model={model}>{children}</Pills>;
    case "side-views":
      return <SideViews model={model}>{children}</SideViews>;
    case "filter-bar":
      return <FilterBar model={model}>{children}</FilterBar>;
    case "view-menu":
      return <ViewMenu model={model}>{children}</ViewMenu>;
    default:
      // `page`: the page draws its own chrome.
      return <>{children}</>;
  }
}
