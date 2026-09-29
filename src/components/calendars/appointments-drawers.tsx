"use client";

import * as React from "react";
import {
  ArrowLeft,
  ArrowUpDown,
  Check,
  ChevronRight,
  Columns3,
  GripVertical,
  ListFilter,
  Lock,
  Pencil,
  Plus,
  SlidersHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { Checkbox, Select, TextInput } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";

/**
 * The four right-hand drawers the appointment list opens: Advanced filters,
 * Sort by, Manage columns, and Customize list.
 *
 * Written against a description of the list rather than against one scope's
 * rows, because Meetings, Services and Rentals disagree about every column and
 * agree completely about how a filter, a sort and a column picker behave. The
 * list hands each drawer its fields, options and columns; the drawers never
 * see a row.
 *
 * Every drawer works on a draft. Nothing reaches the table until Apply, and
 * Cancel, Escape or the X throw the draft away — the same contract the
 * contacts Filters drawer keeps, so the two products' drawers behave alike.
 *
 * Customize list is the one that holds the others. Its rows are doors: each
 * opens the SAME drawer the filter row opens, pushed into Customize's slot
 * with a back arrow, and its Apply writes into Customize's draft instead of
 * into the table. A second filter builder that lived only inside list
 * creation would drift from the first within a week.
 */

/* ── the list's description ─────────────────────────────────────────────── */

export interface FilterField {
  id: string;
  label: string;
  kind: "date" | "select";
  /** For `select` fields — the values the Value menu offers. */
  options?: readonly string[];
}

export type FilterOperator = "is" | "is-not";
export type DateMode = "after" | "before" | "on";

export interface FilterCondition {
  id: string;
  fieldId: string;
  operator: FilterOperator;
  /** Date fields only. */
  mode: DateMode;
  /** "2026-09-28" for a date, the option itself for a select. Empty = incomplete. */
  value: string;
}

/** Conditions inside a group are AND-ed; groups are OR-ed with each other. */
export interface FilterGroup {
  id: string;
  conditions: FilterCondition[];
}

export interface SortOption {
  id: string;
  label: string;
}

export interface ColumnDescriptor {
  id: string;
  label: string;
  /** Always shown, never moved — Title, or the first column where there is none. */
  locked?: boolean;
}

/** One column's place and visibility, in table order. */
export interface ColumnPref {
  id: string;
  visible: boolean;
}

const OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: "is", label: "Is" },
  { value: "is-not", label: "Is not" },
];

const DATE_MODES: { value: DateMode; label: string }[] = [
  { value: "after", label: "After date" },
  { value: "before", label: "Before date" },
  { value: "on", label: "On date" },
];

let seq = 0;
export const newFilterId = (prefix: string) => `${prefix}-${++seq}`;

export function newCondition(fieldId: string): FilterCondition {
  return { id: newFilterId("c"), fieldId, operator: "is", mode: "after", value: "" };
}

/** Drops the conditions nobody finished, and the groups that leaves empty. */
export function completeGroups(groups: FilterGroup[]): FilterGroup[] {
  return groups
    .map((g) => ({ ...g, conditions: g.conditions.filter((c) => c.value !== "") }))
    .filter((g) => g.conditions.length > 0);
}

/** What the count badge says: finished conditions, across every group. */
export function countFilters(groups: FilterGroup[]): number {
  return completeGroups(groups).reduce((n, g) => n + g.conditions.length, 0);
}

/**
 * Whether a row passes the filters, given a way to read a field off it.
 *
 * Dates compare on the calendar day and nothing finer: the value control is a
 * date input, and "After Sep 28" letting a 9 AM Sep 28 booking through would
 * be the filter disagreeing with the words it is drawn in.
 */
export function matchesFilters(
  groups: FilterGroup[],
  fields: readonly FilterField[],
  read: (fieldId: string) => string,
): boolean {
  const live = completeGroups(groups);
  if (live.length === 0) return true;
  return live.some((g) =>
    g.conditions.every((c) => {
      const field = fields.find((f) => f.id === c.fieldId);
      const raw = read(c.fieldId);
      let hit: boolean;
      if (field?.kind === "date") {
        const day = raw.slice(0, 10);
        hit =
          c.mode === "after" ? day > c.value : c.mode === "before" ? day < c.value : day === c.value;
      } else {
        hit = raw === c.value;
      }
      return c.operator === "is" ? hit : !hit;
    }),
  );
}

const cloneGroups = (gs: FilterGroup[]) =>
  gs.map((g) => ({ ...g, conditions: g.conditions.map((c) => ({ ...c })) }));

/* ── shared chrome ──────────────────────────────────────────────────────── */

/** The 32px brand tile every drawer here leads its header with. */
function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-brand-soft text-brand">
      <Icon size={16} aria-hidden="true" />
    </span>
  );
}

/**
 * The header's lead: a back arrow when the drawer was pushed inside Customize
 * list, then the tile. The arrow goes FIRST because it is about where you are,
 * and the tile is about what this is.
 */
function DrawerLead({ icon, onBack }: { icon: LucideIcon; onBack?: () => void }) {
  return (
    <>
      {onBack ? (
        <button
          type="button"
          aria-label="Back to customize list"
          onClick={onBack}
          className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted motion-tap hover:bg-pg-bg hover:text-pg-text active:scale-90"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
      ) : null}
      <IconTile icon={icon} />
    </>
  );
}

function CancelApply({
  onCancel,
  onApply,
  applyDisabled,
  before,
}: {
  onCancel: () => void;
  onApply: () => void;
  applyDisabled?: boolean;
  before?: React.ReactNode;
}) {
  return (
    <>
      {before}
      <span className="flex-1" />
      <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
      <PrimaryButton
        disabled={applyDisabled}
        onClick={onApply}
        className="disabled:cursor-not-allowed disabled:opacity-50"
      >
        Apply
      </PrimaryButton>
    </>
  );
}

/* ── Advanced filters ───────────────────────────────────────────────────── */

export function AdvancedFiltersDrawer({
  fields,
  applied,
  onApply,
  onClose,
  onBack,
}: {
  fields: readonly FilterField[];
  applied: FilterGroup[];
  onApply: (groups: FilterGroup[]) => void;
  onClose: () => void;
  /** Present when pushed inside Customize list. */
  onBack?: () => void;
}) {
  const [draft, setDraft] = React.useState<FilterGroup[]>(() => cloneGroups(applied));
  const firstField = fields[0]?.id ?? "";

  const patch = (groupId: string, conditionId: string, next: Partial<FilterCondition>) =>
    setDraft((gs) =>
      gs.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              conditions: g.conditions.map((c) => (c.id === conditionId ? { ...c, ...next } : c)),
            },
      ),
    );

  const remove = (groupId: string, conditionId: string) =>
    setDraft((gs) =>
      gs
        .map((g) =>
          g.id !== groupId
            ? g
            : { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) },
        )
        .filter((g) => g.conditions.length > 0),
    );

  const addAnd = (groupId: string) =>
    setDraft((gs) =>
      gs.map((g) =>
        g.id === groupId ? { ...g, conditions: [...g.conditions, newCondition(firstField)] } : g,
      ),
    );

  const addGroup = () =>
    setDraft((gs) => [...gs, { id: newFilterId("g"), conditions: [newCondition(firstField)] }]);

  const apply = () => {
    onApply(completeGroups(draft));
    (onBack ?? onClose)();
  };

  return (
    <SideDrawer
      width={480}
      lead={<DrawerLead icon={ListFilter} onBack={onBack} />}
      title="Advanced filters"
      subtitle="Apply filters to appointments"
      onClose={onBack ?? onClose}
      footer={
        <CancelApply
          onCancel={onBack ?? onClose}
          onApply={apply}
          before={
            <button
              type="button"
              onClick={() => setDraft([])}
              disabled={draft.length === 0}
              className="rounded-[6px] px-[4px] text-[14px] leading-[20px] font-medium text-pg-muted motion-tap hover:text-pg-text disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-pg-muted"
            >
              Clear all
            </button>
          }
        />
      }
    >
      <div className="flex flex-col py-[16px]">
        {draft.length === 0 ? (
          <p className="pb-[4px] text-[13px] leading-[18px] text-pg-muted">
            No filters yet. Add one to narrow the list.
          </p>
        ) : null}

        {draft.map((g, gi) => (
          <React.Fragment key={g.id}>
            {gi > 0 ? <Joiner label="Or" /> : null}
            <div className="flex flex-col rounded-[8px] bg-pg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              {g.conditions.map((c, ci) => (
                <React.Fragment key={c.id}>
                  {ci > 0 ? <Joiner label="And" /> : null}
                  <ConditionRow
                    fields={fields}
                    condition={c}
                    onChange={(next) => patch(g.id, c.id, next)}
                    onRemove={() => remove(g.id, c.id)}
                  />
                </React.Fragment>
              ))}
              <button
                type="button"
                onClick={() => addAnd(g.id)}
                className="mt-[10px] flex items-center gap-[4px] self-start rounded-[6px] text-[13px] leading-[18px] font-semibold text-brand motion-tap hover:underline"
              >
                <Plus size={14} aria-hidden="true" />
                AND
              </button>
            </div>
          </React.Fragment>
        ))}

        <OutlineButton onClick={addGroup} className="mt-[12px] h-[36px] self-start">
          <Plus size={15} aria-hidden="true" />
          Add filter
        </OutlineButton>
      </div>
    </SideDrawer>
  );
}

function Joiner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[8px] py-[8px]" aria-hidden="true">
      <span className="h-px flex-1 bg-pg-border" />
      <span className="text-[12px] leading-[16px] font-semibold text-pg-muted uppercase">
        {label}
      </span>
      <span className="h-px flex-1 bg-pg-border" />
    </div>
  );
}

/**
 * Field and operator on one line, the value on the next.
 *
 * Two lines rather than four controls abreast because a date condition needs
 * a mode AND a date, and at 480px four 36px selects in a row would truncate
 * every one of them to its first word.
 */
function ConditionRow({
  fields,
  condition,
  onChange,
  onRemove,
}: {
  fields: readonly FilterField[];
  condition: FilterCondition;
  onChange: (next: Partial<FilterCondition>) => void;
  onRemove: () => void;
}) {
  const field = fields.find((f) => f.id === condition.fieldId);

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="grid grid-cols-2 gap-[8px]">
        <Select
          aria-label="Field"
          value={condition.fieldId}
          options={fields.map((f) => ({ value: f.id, label: f.label }))}
          // A new field keeps nothing: "Status is After date" is not a filter.
          onChange={(fieldId) => onChange({ fieldId, mode: "after", value: "" })}
        />
        <Select
          aria-label="Operator"
          value={condition.operator}
          options={OPERATORS}
          onChange={(operator) => onChange({ operator: operator as FilterOperator })}
        />
      </div>
      <div className="flex items-center gap-[8px]">
        {field?.kind === "date" ? (
          <>
            <Select
              aria-label="Date condition"
              value={condition.mode}
              options={DATE_MODES}
              onChange={(mode) => onChange({ mode: mode as DateMode })}
              className="w-[150px] shrink-0"
            />
            <TextInput
              type="date"
              aria-label="Date"
              value={condition.value}
              onChange={(e) => onChange({ value: e.target.value })}
              className="min-w-0 flex-1"
            />
          </>
        ) : (
          <Select
            aria-label="Value"
            placeholder="Select value"
            value={condition.value || null}
            options={(field?.options ?? []).map((o) => ({ value: o, label: o }))}
            onChange={(value) => onChange({ value })}
            className="flex-1"
          />
        )}
        <button
          type="button"
          aria-label="Delete condition"
          onClick={onRemove}
          className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:text-pg-danger hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-95"
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ── Sort by ────────────────────────────────────────────────────────────── */

/**
 * One order at a time, from a fixed list.
 *
 * Field and direction are one pick here, not two, because the live list only
 * sorts two fields and four rows is shorter than a field menu plus a
 * direction toggle. The check is on the row rather than in a radio dot so the
 * selected state reads the same as every menu on the page.
 */
export function SortByDrawer({
  options,
  value,
  onApply,
  onClose,
  onBack,
}: {
  options: readonly SortOption[];
  value: string;
  onApply: (id: string) => void;
  onClose: () => void;
  onBack?: () => void;
}) {
  const [draft, setDraft] = React.useState(value);

  return (
    <SideDrawer
      width={400}
      lead={<DrawerLead icon={ArrowUpDown} onBack={onBack} />}
      title="Sort by"
      subtitle="Apply sorting to appointments"
      onClose={onBack ?? onClose}
      footer={
        <CancelApply
          onCancel={onBack ?? onClose}
          onApply={() => {
            onApply(draft);
            (onBack ?? onClose)();
          }}
        />
      }
    >
      <div role="radiogroup" aria-label="Sort order" className="flex flex-col gap-[2px] py-[12px]">
        {options.map((o) => {
          const on = o.id === draft;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setDraft(o.id)}
              className={cn(
                "flex h-[40px] w-full items-center gap-[10px] rounded-[8px] px-[10px] text-left text-[14px] leading-[20px] motion-tap",
                on
                  ? "bg-[color-mix(in_oklab,var(--brand)_6%,transparent)] font-medium text-pg-heading"
                  : "text-pg-text hover:bg-pg",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {on ? <Check size={15} aria-hidden="true" className="shrink-0 text-brand" /> : null}
            </button>
          );
        })}
      </div>
    </SideDrawer>
  );
}

/* ── Manage columns ─────────────────────────────────────────────────────── */

/**
 * Which columns the table draws, and in what order.
 *
 * The locked column is pinned to the top and is neither a drag source nor a
 * drop target: a table whose Title can be dragged below Source is a table
 * whose rows have no name, and the product does not allow it either.
 */
export function ManageColumnsDrawer({
  columns,
  value,
  onApply,
  onClose,
  onBack,
}: {
  columns: readonly ColumnDescriptor[];
  value: ColumnPref[];
  onApply: (prefs: ColumnPref[]) => void;
  onClose: () => void;
  onBack?: () => void;
}) {
  const [draft, setDraft] = React.useState<ColumnPref[]>(() => value.map((p) => ({ ...p })));
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const describe = (id: string) => columns.find((c) => c.id === id);
  const shown = draft.filter((p) => p.visible || describe(p.id)?.locked).length;

  const move = (id: string, to: number) =>
    setDraft((d) => {
      const from = d.findIndex((p) => p.id === id);
      if (from < 0) return d;
      const next = [...d];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next;
    });

  // Never above a locked column — they hold the top of the list.
  const floor = draft.filter((p) => describe(p.id)?.locked).length;
  const moveBy = (id: string, delta: number) => {
    const at = draft.findIndex((p) => p.id === id);
    const to = Math.max(floor, Math.min(draft.length - 1, at + delta));
    if (to !== at) move(id, to);
  };

  return (
    <SideDrawer
      width={400}
      lead={<DrawerLead icon={Columns3} onBack={onBack} />}
      title="Manage columns"
      subtitle="Manage columns for the appointment list view"
      onClose={onBack ?? onClose}
      footer={
        <CancelApply
          onCancel={onBack ?? onClose}
          onApply={() => {
            onApply(draft);
            (onBack ?? onClose)();
          }}
        />
      }
    >
      <p className="pt-[14px] pb-[6px] text-[13px] leading-[18px] text-pg-muted">
        {shown} of {draft.length} shown. Drag to reorder.
      </p>
      <div className="flex flex-col pb-[12px]">
        {draft.map((p) => {
          const col = describe(p.id);
          if (!col) return null;
          const locked = !!col.locked;
          return (
            <div
              key={p.id}
              onDragOver={(e) => {
                if (!dragId || locked) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overId !== p.id) setOverId(p.id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (dragId && dragId !== p.id && !locked) {
                  move(dragId, draft.findIndex((x) => x.id === p.id));
                }
                setDragId(null);
                setOverId(null);
              }}
              className={cn(
                "flex h-[40px] items-center gap-[8px] rounded-[8px] px-[4px]",
                !locked && "hover:bg-pg",
                dragId === p.id && "opacity-40",
                overId === p.id && dragId !== p.id && "shadow-[inset_0_2px_0_0_var(--brand)]",
              )}
            >
              <span
                role={locked ? undefined : "button"}
                tabIndex={locked ? -1 : 0}
                draggable={!locked}
                aria-label={locked ? undefined : `Reorder ${col.label}. Use the arrow keys to move it.`}
                aria-hidden={locked ? true : undefined}
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = "move";
                  e.dataTransfer.setData("text/plain", p.id);
                  setDragId(p.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();
                    moveBy(p.id, e.key === "ArrowUp" ? -1 : 1);
                  }
                }}
                className={cn(
                  "flex size-[24px] shrink-0 items-center justify-center rounded-[6px]",
                  locked
                    ? "text-pg-disabled"
                    : "cursor-grab text-pg-faint hover:text-pg-text-strong focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none active:cursor-grabbing",
                )}
              >
                <GripVertical size={15} aria-hidden="true" />
              </span>
              <Checkbox
                checked={locked || p.visible}
                disabled={locked}
                onChange={(visible) =>
                  setDraft((d) => d.map((x) => (x.id === p.id ? { ...x, visible } : x)))
                }
                label={col.label}
                className="min-w-0 flex-1"
              />
              {locked ? (
                <Lock
                  size={14}
                  aria-label="Always shown"
                  className="mr-[6px] shrink-0 text-pg-faint"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </SideDrawer>
  );
}

/* ── Customize list ─────────────────────────────────────────────────────── */

export interface ListConfig {
  filters: FilterGroup[];
  sort: string;
  columns: ColumnPref[];
}

/**
 * The lit list, as a name and three doors.
 *
 * Opened on an existing tab, the name is that tab's and Save as new forks it;
 * opened from `+ Smart list`, the name is a placeholder to type over. Either
 * way the result is a NEW tab — overwriting a built-in view is not something
 * this list offers, for the reason UnsavedChanges gives in list-shape.
 */
export function CustomizeListDrawer({
  initialName,
  initial,
  fields,
  sortOptions,
  columns,
  onSaveAsNew,
  onClose,
}: {
  initialName: string;
  initial: ListConfig;
  fields: readonly FilterField[];
  sortOptions: readonly SortOption[];
  columns: readonly ColumnDescriptor[];
  onSaveAsNew: (list: ListConfig & { label: string }) => void;
  onClose: () => void;
}) {
  const [name, setName] = React.useState(initialName);
  const [config, setConfig] = React.useState<ListConfig>(initial);
  const [sub, setSub] = React.useState<"filters" | "sort" | "columns" | null>(null);
  const back = () => setSub(null);

  if (sub === "filters") {
    return (
      <AdvancedFiltersDrawer
        fields={fields}
        applied={config.filters}
        onApply={(filters) => setConfig((c) => ({ ...c, filters }))}
        onClose={onClose}
        onBack={back}
      />
    );
  }
  if (sub === "sort") {
    return (
      <SortByDrawer
        options={sortOptions}
        value={config.sort}
        onApply={(sort) => setConfig((c) => ({ ...c, sort }))}
        onClose={onClose}
        onBack={back}
      />
    );
  }
  if (sub === "columns") {
    return (
      <ManageColumnsDrawer
        columns={columns}
        value={config.columns}
        onApply={(cols) => setConfig((c) => ({ ...c, columns: cols }))}
        onClose={onClose}
        onBack={back}
      />
    );
  }

  const label = name.trim();
  const filterCount = countFilters(config.filters);
  const shown = config.columns.filter(
    (p) => p.visible || columns.find((c) => c.id === p.id)?.locked,
  ).length;
  const dirty =
    name !== initialName || JSON.stringify(config) !== JSON.stringify(initial);
  const save = () => {
    if (label) onSaveAsNew({ label, ...config });
  };

  return (
    <SideDrawer
      width={420}
      lead={<IconTile icon={SlidersHorizontal} />}
      title="Customize list"
      subtitle="Change how this list filters, sorts, and shows appointments"
      onClose={onClose}
      footer={
        <>
          <OutlineButton
            disabled={!dirty}
            onClick={() => {
              setName(initialName);
              setConfig(initial);
            }}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard changes
          </OutlineButton>
          <span className="flex-1" />
          <PrimaryButton
            disabled={!label}
            onClick={save}
            className="disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={15} aria-hidden="true" />
            Save as new
          </PrimaryButton>
        </>
      }
    >
      <label className="mt-[16px] flex h-[40px] items-center gap-[10px] rounded-[8px] px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Pencil size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
        <input
          aria-label="List name"
          value={name}
          placeholder="Name this list"
          onChange={(e) => setName(e.target.value)}
          onFocus={(e) => e.target.select()}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
          }}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] font-medium text-pg-heading placeholder:font-normal placeholder:text-pg-faint focus:outline-none"
        />
      </label>

      <div className="flex flex-col py-[8px]">
        <DoorRow
          icon={ListFilter}
          label="Advanced filters"
          meta={filterCount ? `${filterCount} ${filterCount === 1 ? "filter" : "filters"}` : "None"}
          onClick={() => setSub("filters")}
        />
        <DoorRow
          icon={ArrowUpDown}
          label="Sort by"
          meta={sortOptions.find((o) => o.id === config.sort)?.label}
          onClick={() => setSub("sort")}
        />
        <DoorRow
          icon={Columns3}
          label="Columns"
          meta={`${shown} shown`}
          onClick={() => setSub("columns")}
        />
      </div>
    </SideDrawer>
  );
}

function DoorRow({
  icon: Icon,
  label,
  meta,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  meta?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[48px] w-full items-center gap-[12px] rounded-[8px] px-[10px] text-left motion-tap hover:bg-pg"
    >
      <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-text-strong" />
      <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-pg-heading">
        {label}
      </span>
      {meta ? (
        <span className="min-w-0 shrink truncate text-[13px] leading-[18px] text-pg-muted">
          {meta}
        </span>
      ) : null}
      <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
    </button>
  );
}
