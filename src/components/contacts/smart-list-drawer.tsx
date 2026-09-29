"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronRight,
  Columns3,
  Copy,
  ListFilter,
  Pencil,
  Search,
  Share2,
  Trash2,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { cn } from "@/lib/utils";
import { ManageFieldsDrawer } from "./contact-drawers";
import { completeGroups, type FilterGroup } from "./contact-filters";
import { FiltersDrawer } from "./filters-drawer";
import { SORT_FIELDS, type ContactSort, type SortField } from "./sort-popover";

/** The table's default column set — Manage fields opens with all seven on. */
const FIELD_COUNT = 7;

/**
 * "Save as new smart list" and "Add smart list", as one drawer.
 *
 * The rows under the name are doors, not controls: Filters, Sort by and
 * Fields each open the SAME drawer the page uses for that job, in this
 * drawer's slot, and hand back to it on close. A second filter builder that
 * lived only inside list creation would drift from the first within a week.
 *
 * The lower group acts on a list that exists, so on a list being created it
 * is drawn but disabled — the live product shows it that way, and it tells
 * you what you will be able to do once you press Create.
 */
export function AddSmartListDrawer({
  initialFilters,
  initialSort,
  onClose,
  onCreate,
}: {
  initialFilters: FilterGroup[];
  initialSort: ContactSort | null;
  onClose: () => void;
  onCreate: (list: {
    label: string;
    filters: FilterGroup[];
    sort: ContactSort | null;
  }) => void;
}) {
  const [label, setLabel] = React.useState("New smart list");
  const [filters, setFilters] = React.useState(initialFilters);
  const [sort, setSort] = React.useState(initialSort);
  const [sub, setSub] = React.useState<"filters" | "sort" | "fields" | null>(
    null,
  );

  if (sub === "filters") {
    return (
      <FiltersDrawer
        applied={filters}
        onApply={setFilters}
        onClose={() => setSub(null)}
      />
    );
  }
  if (sub === "sort") {
    return (
      <SortDrawer
        sort={sort}
        onApply={setSort}
        onClose={() => setSub(null)}
      />
    );
  }
  if (sub === "fields") {
    return <ManageFieldsDrawer onClose={() => setSub(null)} />;
  }

  const filterCount = completeGroups(filters).length;
  const name = label.trim();

  return (
    <SideDrawer
      width={440}
      title="Add smart list"
      onClose={onClose}
      footer={
        <>
          <span className="flex-1" />
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton
            disabled={!name}
            onClick={() => onCreate({ label: name, filters, sort })}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            Create
          </PrimaryButton>
        </>
      }
    >
      <label className="mt-[16px] flex h-[40px] items-center gap-[12px] rounded-[8px] px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Pencil size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
        <input
          autoFocus
          aria-label="Smart list name"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name) onCreate({ label: name, filters, sort });
          }}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text focus:outline-none"
        />
      </label>

      <div className="flex flex-col py-[8px]">
        <DoorRow
          icon={ListFilter}
          label="Filters"
          meta={filterCount ? `${filterCount} applied` : undefined}
          onClick={() => setSub("filters")}
        />
        <DoorRow
          icon={ArrowUpDown}
          label="Sort by"
          meta={sort ? "1 applied" : undefined}
          onClick={() => setSub("sort")}
        />
        <DoorRow
          icon={Columns3}
          label="Fields"
          meta={`${FIELD_COUNT} selected`}
          onClick={() => setSub("fields")}
        />
      </div>

      <div className="flex flex-col border-t border-pg-head-border py-[8px]">
        <DoorRow icon={Copy} label="Duplicate" disabled />
        <DoorRow icon={Upload} label="Export" disabled />
        <DoorRow icon={Share2} label="Sharing & permissions" disabled />
        <DoorRow icon={Trash2} label="Delete list" disabled />
      </div>
    </SideDrawer>
  );
}

function DoorRow({
  icon: Icon,
  label,
  meta,
  onClick,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  meta?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-[48px] w-full items-center gap-[12px] rounded-[8px] px-[10px] text-left motion-tap",
        disabled ? "cursor-not-allowed" : "hover:bg-pg",
      )}
    >
      <Icon
        size={17}
        aria-hidden="true"
        className={cn("shrink-0", disabled ? "text-pg-disabled" : "text-pg-text-strong")}
      />
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium",
          disabled ? "text-pg-disabled" : "text-pg-heading",
        )}
      >
        {label}
      </span>
      {meta ? (
        <span className="shrink-0 text-[14px] leading-[20px] text-pg-muted">{meta}</span>
      ) : null}
      <ChevronRight
        size={16}
        aria-hidden="true"
        className={cn("shrink-0", disabled ? "text-pg-disabled" : "text-pg-faint")}
      />
    </button>
  );
}

/**
 * Sort as a drawer, for list creation — the popover's job at full height.
 *
 * Each field carries its own direction arrow, so choosing a field and a
 * direction is one press rather than two: press a row to sort by it, press
 * its arrow to flip the direction. Only the fields this table can actually
 * order by are offered; a column that sorted nothing would be a lie told in
 * the one place you go to check what the order is.
 */
export function SortDrawer({
  sort,
  onApply,
  onClose,
}: {
  sort: ContactSort | null;
  onApply: (sort: ContactSort | null) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = React.useState(sort);
  const [query, setQuery] = React.useState("");
  const shown = SORT_FIELDS.filter((f) =>
    f.label.toLowerCase().includes(query.toLowerCase()),
  );
  const changed = JSON.stringify(draft) !== JSON.stringify(sort);

  const pick = (field: SortField, flip: boolean) =>
    setDraft((d) =>
      d?.field === field
        ? flip
          ? { field, dir: d.dir === "asc" ? "desc" : "asc" }
          : d
        : { field, dir: "asc" },
    );

  return (
    <SideDrawer
      width={440}
      title="Sort by"
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            disabled={!draft}
            onClick={() => setDraft(null)}
            className="text-[14px] leading-[20px] font-medium text-pg-muted motion-tap enabled:hover:text-pg-heading disabled:text-pg-disabled"
          >
            Clear sort
          </button>
          <span className="flex-1" />
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton
            disabled={!changed}
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apply
          </PrimaryButton>
        </>
      }
    >
      <label className="mt-[16px] flex h-[36px] items-center gap-[10px] rounded-[8px] px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search column"
          aria-label="Search column"
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </label>
      <p className="pt-[16px] pb-[4px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
        Fields available for sorting
      </p>
      {shown.length === 0 ? (
        <p className="py-[12px] text-[13px] leading-[18px] text-pg-muted">
          No columns match.
        </p>
      ) : null}
      <div role="radiogroup" aria-label="Sort field" className="flex flex-col">
        {shown.map((f) => {
          const on = draft?.field === f.value;
          const Dir = on && draft?.dir === "desc" ? ArrowDown : ArrowUp;
          return (
            <div
              key={f.value}
              className={cn(
                "flex h-[48px] items-center gap-[12px] border-b border-pg-row-border px-[4px]",
                on && "bg-[color-mix(in_oklab,var(--brand)_5%,transparent)]",
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(f.value, false)}
                className={cn(
                  "min-w-0 flex-1 truncate py-[12px] text-left text-[14px] leading-[20px] motion-tap",
                  on ? "font-semibold text-pg-heading" : "text-pg-text",
                )}
              >
                {f.label}
              </button>
              <button
                type="button"
                aria-label={
                  on
                    ? `${f.label}, ${draft?.dir === "desc" ? "descending" : "ascending"} — switch direction`
                    : `Sort by ${f.label}`
                }
                onClick={() => pick(f.value, true)}
                className={cn(
                  "flex size-[28px] shrink-0 items-center justify-center rounded-full motion-tap",
                  on
                    ? "bg-brand text-brand-fg"
                    : "bg-pg text-pg-muted hover:text-pg-heading",
                )}
              >
                <Dir size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </SideDrawer>
  );
}
