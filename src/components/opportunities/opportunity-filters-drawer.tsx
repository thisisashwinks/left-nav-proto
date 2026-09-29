"use client";

import * as React from "react";
import { ArrowLeft, ChevronDown, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SideDrawer } from "@/components/page/side-drawer";
import { Select, TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import {
  OPERATORS,
  newFilterId,
  operatorNeedsValue,
  type FilterCondition,
  type FilterGroup,
  type FilterSection,
} from "@/components/contacts/contact-filters";
import { opportunities, type Opportunity } from "./opportunities-data";
import {
  completeOppGroups,
  getOppField,
  newOppCondition,
  oppFilterSections,
} from "./opportunity-filters";

/** What the field picker is choosing a field FOR. */
type PickerTarget =
  | { mode: "group" }
  | { mode: "nested"; groupId: string }
  | { mode: "change"; groupId: string; conditionId: string };

/**
 * The opportunities Filters drawer — the contacts drawer 1:1, over the
 * opportunity field catalog.
 *
 * Works on a draft so the list behind doesn't reflow on every keystroke —
 * nothing reaches the page until Apply, and Cancel, Escape, or the X throw the
 * draft away. `rows` feeds the select options (owners, sources, tags…), so
 * pass the full collection rather than the filtered cut.
 */
export function OpportunityFiltersDrawer({
  value,
  onApply,
  onClose,
  rows = opportunities,
}: {
  value: FilterGroup[];
  onApply: (groups: FilterGroup[]) => void;
  onClose: () => void;
  rows?: Opportunity[];
}) {
  const sections = React.useMemo(() => oppFilterSections(rows), [rows]);
  const optionsFor = (fieldId: string) =>
    sections.flatMap((s) => s.fields).find((f) => f.id === fieldId)?.options ?? [];
  const [draft, setDraft] = React.useState<FilterGroup[]>(() =>
    value.map((g) => ({ ...g, conditions: g.conditions.map((c) => ({ ...c })) })),
  );
  const [picker, setPicker] = React.useState<PickerTarget | null>(null);

  // With nothing built yet the picker IS the drawer, so it needs no way back.
  const picking = picker ?? (draft.length === 0 ? { mode: "group" as const } : null);

  const updateCondition = (
    groupId: string,
    conditionId: string,
    patch: Partial<FilterCondition>,
  ) =>
    setDraft((gs) =>
      gs.map((g) =>
        g.id !== groupId
          ? g
          : {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, ...patch } : c,
              ),
            },
      ),
    );

  const removeCondition = (groupId: string, conditionId: string) =>
    setDraft((gs) =>
      gs
        .map((g) =>
          g.id !== groupId
            ? g
            : { ...g, conditions: g.conditions.filter((c) => c.id !== conditionId) },
        )
        .filter((g) => g.conditions.length > 0),
    );

  const pick = (fieldId: string) => {
    const target = picking;
    if (!target) return;
    if (target.mode === "group") {
      setDraft((gs) => [...gs, { id: newFilterId("g"), conditions: [newOppCondition(fieldId)] }]);
    } else if (target.mode === "nested") {
      setDraft((gs) =>
        gs.map((g) =>
          g.id === target.groupId
            ? { ...g, conditions: [...g.conditions, newOppCondition(fieldId)] }
            : g,
        ),
      );
    } else {
      const fresh = newOppCondition(fieldId);
      updateCondition(target.groupId, target.conditionId, {
        fieldId,
        operator: fresh.operator,
        value: "",
      });
    }
    setPicker(null);
  };

  const apply = () => {
    onApply(completeOppGroups(draft));
    onClose();
  };

  return (
    <SideDrawer
      title="Filters"
      width={520}
      onClose={onClose}
      bodyClassName="px-0"
      footer={
        <>
          <button
            type="button"
            onClick={() => {
              setDraft([]);
              setPicker(null);
            }}
            disabled={draft.length === 0}
            className="rounded-[6px] px-[4px] text-[14px] leading-[20px] font-medium text-pg-muted motion-tap hover:text-pg-text disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-pg-muted"
          >
            Clear all filters
          </button>
          <span className="flex-1" />
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={apply}>Apply</PrimaryButton>
        </>
      }
    >
      {picking ? (
        <FieldPicker
          sections={sections}
          onPick={pick}
          onBack={picker && draft.length > 0 ? () => setPicker(null) : undefined}
        />
      ) : (
        <div className="flex flex-col p-[16px]">
          {draft.map((g, gi) => (
            <React.Fragment key={g.id}>
              {gi > 0 ? <Joiner label="and" /> : null}
              <div className="flex flex-col rounded-[8px] bg-pg p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                {g.conditions.map((c, ci) => (
                  <React.Fragment key={c.id}>
                    {ci > 0 ? <Joiner label="or" /> : null}
                    <ConditionRows
                      condition={c}
                      options={optionsFor(c.fieldId)}
                      onChangeField={() =>
                        setPicker({ mode: "change", groupId: g.id, conditionId: c.id })
                      }
                      onChange={(patch) => updateCondition(g.id, c.id, patch)}
                      onRemove={() => removeCondition(g.id, c.id)}
                    />
                  </React.Fragment>
                ))}
                <button
                  type="button"
                  onClick={() => setPicker({ mode: "nested", groupId: g.id })}
                  className="mt-[12px] flex items-center gap-[6px] self-start rounded-[6px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add nested filter
                </button>
              </div>
            </React.Fragment>
          ))}
          <OutlineButton
            onClick={() => setPicker({ mode: "group" })}
            className="mt-[16px] h-[36px] self-start text-[14px]"
          >
            <Plus size={15} aria-hidden="true" />
            Add filter
          </OutlineButton>
        </div>
      )}
    </SideDrawer>
  );
}

function Joiner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-[8px] py-[10px]" aria-hidden="true">
      <span className="h-px flex-1 bg-pg-border" />
      <span className="text-[13px] leading-[18px] font-medium text-pg-muted">{label}</span>
      <span className="h-px flex-1 bg-pg-border" />
    </div>
  );
}

function ConditionRows({
  condition,
  options,
  onChangeField,
  onChange,
  onRemove,
}: {
  condition: FilterCondition;
  /** Select options, derived from the live rows. */
  options: string[];
  onChangeField: () => void;
  onChange: (patch: Partial<FilterCondition>) => void;
  onRemove: () => void;
}) {
  const field = getOppField(condition.fieldId);
  const kind = field?.kind ?? "text";
  const needsValue = operatorNeedsValue(condition.operator);

  let valueControl: React.ReactNode = null;
  if (needsValue) {
    if (kind === "select") {
      valueControl = (
        <Select
          aria-label="Value"
          value={condition.value || null}
          options={options.map((o) => ({ value: o, label: o }))}
          onChange={(value) => onChange({ value })}
          className="flex-1"
        />
      );
    } else if (kind === "date") {
      valueControl = (
        <TextInput
          type="date"
          aria-label="Date"
          value={condition.value}
          onChange={(e) => onChange({ value: e.target.value })}
          className="flex-1"
        />
      );
    } else {
      const numeric = kind === "number" || kind === "relative";
      valueControl = (
        <TextInput
          type={numeric ? "number" : "text"}
          min={kind === "relative" ? 0 : undefined}
          aria-label="Value"
          value={condition.value}
          onChange={(e) => onChange({ value: e.target.value })}
          placeholder={
            kind === "relative" ? "Number of days" : kind === "number" ? "Enter a number" : "Enter value"
          }
          className="flex-1"
        />
      );
    }
  }

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="grid grid-cols-2 gap-[8px]">
        <button
          type="button"
          onClick={onChangeField}
          aria-label={`Change field: ${field?.label ?? "Field"}`}
          className="flex h-[36px] min-w-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
        >
          <span className="min-w-0 flex-1 truncate">{field?.label ?? "Select field"}</span>
          <Pencil size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        </button>
        <Select
          aria-label="Operator"
          value={condition.operator}
          options={OPERATORS[kind].map((o) => ({ value: o, label: o }))}
          onChange={(operator) =>
            onChange(operatorNeedsValue(operator) ? { operator } : { operator, value: "" })
          }
        />
      </div>
      <div className="flex items-center gap-[8px]">
        {valueControl ?? <span className="flex-1" />}
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

function FieldPicker({
  sections: catalog,
  onPick,
  onBack,
}: {
  sections: FilterSection[];
  onPick: (fieldId: string) => void;
  /** Present when there's a builder to return to. */
  onBack?: () => void;
}) {
  const [query, setQuery] = React.useState("");
  const [collapsed, setCollapsed] = React.useState<Set<string>>(() => new Set());
  const q = query.trim().toLowerCase();

  const sections = catalog.map((s) => ({
    ...s,
    fields: q ? s.fields.filter((f) => f.label.toLowerCase().includes(q)) : s.fields,
  })).filter((s) => s.fields.length > 0);

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex flex-col">
      <div className="sticky top-0 z-[1] flex flex-col gap-[8px] bg-pg-surface px-[16px] pt-[12px] pb-[12px]">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-[6px] self-start rounded-[6px] text-[13px] leading-[18px] font-medium text-pg-muted motion-tap hover:text-pg-text"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to filters
          </button>
        ) : null}
        <div className="relative">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-pg-faint"
          />
          <TextInput
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search filters"
            aria-label="Search filters"
            className="pl-[34px]"
          />
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="px-[16px] py-[24px] text-center text-[14px] leading-[20px] text-pg-muted">
          No filters match
        </p>
      ) : null}

      {sections.map((s) => {
        // A search always shows its hits, even inside a section left collapsed.
        const open = q !== "" || !collapsed.has(s.id);
        return (
          <div key={s.id} className="flex flex-col">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => toggle(s.id)}
              className="flex h-[40px] items-center gap-[8px] bg-pg px-[16px] text-left text-[14px] leading-[20px] font-semibold text-pg-heading motion-tap"
            >
              <ChevronDown
                size={15}
                aria-hidden="true"
                className={cn("shrink-0 text-pg-muted transition-transform", !open && "-rotate-90")}
              />
              {s.label}
            </button>
            {open
              ? s.fields.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => onPick(f.id)}
                    className="flex h-[40px] items-center border-b border-pg-head-border px-[16px] pl-[39px] text-left text-[14px] leading-[20px] text-pg-text motion-tap last:border-b-0 hover:bg-pg"
                  >
                    {f.label}
                  </button>
                ))
              : null}
          </div>
        );
      })}
    </div>
  );
}
