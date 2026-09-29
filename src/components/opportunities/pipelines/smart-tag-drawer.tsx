"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  ChevronDown,
  FileText,
  FilterX,
  Info,
  MessageSquareMore,
  PhoneCall,
  Plus,
  Search,
  SquareCheck,
  Tag,
  TriangleAlert,
  X,
} from "lucide-react";
import { Modal } from "@/components/page/modal";
import { Checkbox } from "@/components/page/form-controls";
import { ToneAvatar } from "@/components/page/avatar";
import { useTheme } from "@/components/theme/theme-provider";
import { OPERATORS, operatorNeedsValue, type FilterField } from "@/components/contacts/contact-filters";
import { cn } from "@/lib/utils";
import { CARD_FIELD_LABEL } from "../card-config";
import { OPP_FILTER_SECTIONS } from "../opportunity-filters";
import { TAG_COLORS, newId, type SmartTag, type SmartTagRule } from "./pipelines-store";

/* ------------------------------------------------------------------ */
/* Catalog                                                             */
/* ------------------------------------------------------------------ */

/**
 * The fields a rule can test: the board's filter catalog, plus the few
 * signals a smart tag needs that a one-off filter does not — how long since
 * anyone touched the deal, how close it is to closing, how often it slipped.
 */
const SIGNAL_FIELDS: FilterField[] = [
  { id: "daysInactive", label: "Days since last activity", kind: "number" },
  { id: "daysToClose", label: "Days until expected close", kind: "number" },
  { id: "closePushes", label: "Times close date pushed", kind: "number" },
];

const FIELD_SECTIONS: { label: string; fields: FilterField[] }[] = [
  ...OPP_FILTER_SECTIONS.map((s) => ({ label: s.label, fields: s.fields })),
  { label: "Signals", fields: SIGNAL_FIELDS },
];

const FIELD_INDEX = new Map(FIELD_SECTIONS.flatMap((s) => s.fields).map((f) => [f.id, f]));

const MULTI_SEP = ", ";

function operatorsFor(field: FilterField | undefined): string[] {
  if (!field) return [];
  return OPERATORS[field.kind] ?? [];
}

function isMulti(field: FilterField | undefined, operator: string): boolean {
  return field?.kind === "select" && (operator === "Is" || operator === "Is not");
}

function ruleComplete(r: SmartTagRule): boolean {
  const field = FIELD_INDEX.get(r.field);
  if (!field) return false;
  if (!operatorsFor(field).includes(r.operator)) return false;
  return !operatorNeedsValue(r.operator) || r.value.trim() !== "";
}

const blankRule = (): SmartTagRule => ({ field: "", operator: "", value: "" });
const defaultGroups = (): SmartTagRule[][] => [[{ field: "status", operator: "Is", value: "Open" }]];

export const PREBUILT_TAGS: {
  id: string;
  name: string;
  description: string;
  color: string;
  groups: SmartTagRule[][];
}[] = [
  {
    id: "stale",
    name: "Stale",
    description: "No activity in the last 90 days",
    color: TAG_COLORS[7]!,
    groups: [
      [{ field: "status", operator: "Is", value: "Open" }],
      [{ field: "daysInactive", operator: "Greater than", value: "90" }],
    ],
  },
  {
    id: "high-value",
    name: "High value",
    description: "Value over $10,000",
    color: TAG_COLORS[2]!,
    groups: [[{ field: "value", operator: "Greater than", value: "10000" }]],
  },
  {
    id: "closing-soon",
    name: "Closing soon",
    description: "Expected close in the next 14 days",
    color: TAG_COLORS[1]!,
    groups: [
      [{ field: "status", operator: "Is", value: "Open" }],
      [{ field: "daysToClose", operator: "Less than", value: "15" }],
    ],
  },
  {
    id: "at-risk",
    name: "At risk",
    description: "Close date pushed 2+ times",
    color: TAG_COLORS[3]!,
    groups: [[{ field: "closePushes", operator: "Greater than", value: "1" }]],
  },
  {
    id: "unassigned",
    name: "Unassigned",
    description: "No owner",
    color: TAG_COLORS[0]!,
    groups: [[{ field: "owner", operator: "Is", value: "Unassigned" }]],
  },
];

const cloneGroups = (g: SmartTagRule[][]) => g.map((grp) => grp.map((r) => ({ ...r })));

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

const BTN_OUTLINE =
  "flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] bg-pg-surface px-[14px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap enabled:hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50";
const BTN_PRIMARY =
  "flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] bg-brand px-[16px] text-[14px] leading-[20px] font-semibold whitespace-nowrap text-brand-fg motion-tap enabled:hover:brightness-110 enabled:active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50";
const BTN_GHOST =
  "flex h-[32px] shrink-0 items-center gap-[6px] rounded-[8px] px-[8px] text-[14px] leading-[20px] font-medium whitespace-nowrap text-brand motion-tap hover:bg-brand-soft";
const FIELD =
  "h-[36px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none disabled:bg-pg disabled:text-pg-muted";
const LABEL = "text-[14px] leading-[20px] font-medium text-pg-heading";

/** The tag as the board draws it: outlined in its color, text leaning to it. */
function TagPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      style={{
        color: `color-mix(in oklab, ${color} 78%, var(--pg-heading))`,
        backgroundColor: `color-mix(in oklab, ${color} 8%, transparent)`,
        boxShadow: `inset 0 0 0 1px ${color}`,
      }}
      className="inline-flex max-w-full items-center truncate rounded-full px-[8px] py-[1px] text-[12px] leading-[16px] font-medium"
    >
      {name || "Tag name"}
    </span>
  );
}

function Radio({
  checked,
  onSelect,
  label,
}: {
  checked: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className="flex items-center gap-[8px] text-left motion-tap"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[16px] shrink-0 items-center justify-center rounded-full",
          checked
            ? "bg-brand"
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {checked ? <span className="size-[6px] rounded-full bg-white" /> : null}
      </span>
      <span className="text-[14px] leading-[20px] text-pg-text">{label}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Portalled select                                                    */
/* ------------------------------------------------------------------ */

interface Opt {
  value: string;
  label: string;
  group?: string;
}

/**
 * A menu anchored to its trigger but portalled to the body at z-90, so the
 * drawer's scroll area cannot clip it. Escape is caught in the capture phase
 * and stopped, so it closes the menu and nothing under it. Scrolling anything
 * other than the menu closes it rather than leaving it floating off its anchor.
 */
function FloatingMenu({
  anchorRef,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const a = anchorRef.current?.getBoundingClientRect();
    const m = ref.current;
    if (!a || !m) return;
    const below = window.innerHeight - a.bottom - 12;
    const above = a.top - 12;
    const flip = below < 200 && above > below;
    const max = Math.min(280, Math.max(120, flip ? above : below));
    m.style.maxHeight = `${max}px`;
    m.style.left = `${a.left}px`;
    m.style.width = `${Math.max(a.width, 200)}px`;
    const h = Math.min(m.scrollHeight, max);
    m.style.top = `${flip ? a.top - 4 - h : a.bottom + 4}px`;
    m.style.visibility = "visible";
  }, [anchorRef]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    const onScroll = (e: Event) => {
      if (ref.current && e.target instanceof Node && ref.current.contains(e.target)) return;
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onClose);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onClose);
    };
  }, [onClose]);

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[90]">
      <button
        type="button"
        aria-label="Close options"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={ref}
        role="listbox"
        style={{ position: "fixed", top: 0, left: 0, visibility: "hidden" }}
        className="flex flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

function MenuOptions({
  options,
  isOn,
  onPick,
  multi,
}: {
  options: Opt[];
  isOn: (v: string) => boolean;
  onPick: (v: string) => void;
  multi?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const searchable = options.length > 8;
  const shown = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;
  return (
    <>
      {searchable ? (
        <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </div>
      ) : null}
      <div className="min-h-0 flex-1 overflow-y-auto p-[4px]">
        {shown.length === 0 ? (
          <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No matches</p>
        ) : null}
        {shown.map((o, i) => {
          const on = isOn(o.value);
          const header = o.group && o.group !== shown[i - 1]?.group ? o.group : null;
          return (
            <React.Fragment key={o.value}>
              {header ? (
                <p className="px-[10px] pt-[8px] pb-[4px] text-[12px] leading-[16px] font-semibold text-pg-muted">
                  {header}
                </p>
              ) : null}
              <button
                type="button"
                role="option"
                aria-selected={on}
                onClick={() => onPick(o.value)}
                className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
              >
                {multi ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
                      on
                        ? "bg-brand text-brand-fg"
                        : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                    )}
                  >
                    {on ? <Check size={11} strokeWidth={3} /> : null}
                  </span>
                ) : null}
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                    on && !multi ? "font-medium text-pg-heading" : "text-pg-text",
                  )}
                >
                  {o.label}
                </span>
                {on && !multi ? (
                  <Check size={14} aria-hidden="true" className="shrink-0 text-brand" />
                ) : null}
              </button>
            </React.Fragment>
          );
        })}
      </div>
    </>
  );
}

function PSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  disabled,
  "aria-label": ariaLabel,
}: {
  value: string;
  options: Opt[];
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const anchor = React.useRef<HTMLButtonElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const current = options.find((o) => o.value === value);
  return (
    <>
      <button
        ref={anchor}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          FIELD,
          "flex items-center gap-[8px] text-left motion-tap",
          disabled
            ? "cursor-not-allowed bg-pg text-pg-muted"
            : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            current ? (disabled ? "text-pg-muted" : "text-pg-text") : "text-pg-faint",
          )}
        >
          {current?.label ?? placeholder}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {open ? (
        <FloatingMenu anchorRef={anchor} onClose={close}>
          <MenuOptions
            options={options}
            isOn={(v) => v === value}
            onPick={(v) => {
              onChange(v);
              setOpen(false);
            }}
          />
        </FloatingMenu>
      ) : null}
    </>
  );
}

function splitMulti(value: string): string[] {
  return value ? value.split(MULTI_SEP).filter(Boolean) : [];
}

function PMultiSelect({
  value,
  options,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const anchor = React.useRef<HTMLDivElement>(null);
  const close = React.useCallback(() => setOpen(false), []);
  const picked = splitMulti(value);
  const set = (next: string[]) => onChange(next.join(MULTI_SEP));

  return (
    <>
      <div
        ref={anchor}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
        className={cn(
          "flex min-h-[36px] w-full items-center gap-[6px] rounded-[8px] py-[5px] pr-[12px] pl-[6px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-visible:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
          disabled
            ? "cursor-not-allowed bg-pg"
            : "cursor-pointer bg-pg-surface hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <span className="flex min-w-0 flex-1 flex-wrap gap-[4px]">
          {picked.length === 0 ? (
            <span className="px-[6px] text-pg-faint">Select values</span>
          ) : (
            picked.map((p) => (
              <span
                key={p}
                className="inline-flex h-[24px] max-w-full items-center gap-[4px] rounded-[6px] bg-brand-soft pr-[4px] pl-[8px] text-[13px] leading-[18px] font-medium text-brand"
              >
                <span className="truncate">{p}</span>
                {disabled ? (
                  <span className="w-[2px]" />
                ) : (
                  <button
                    type="button"
                    aria-label={`Remove ${p}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      set(picked.filter((x) => x !== p));
                    }}
                    className="flex size-[16px] items-center justify-center rounded-[4px] hover:bg-[color-mix(in_oklab,var(--brand)_16%,transparent)]"
                  >
                    <X size={12} aria-hidden="true" />
                  </button>
                )}
              </span>
            ))
          )}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </div>
      {open ? (
        <FloatingMenu anchorRef={anchor} onClose={close}>
          <MenuOptions
            multi
            options={options.map((o) => ({ value: o, label: o }))}
            isOn={(v) => picked.includes(v)}
            onPick={(v) =>
              set(picked.includes(v) ? picked.filter((x) => x !== v) : [...picked, v])
            }
          />
        </FloatingMenu>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Rule editor                                                         */
/* ------------------------------------------------------------------ */

const FIELD_OPTIONS: Opt[] = FIELD_SECTIONS.flatMap((s) =>
  s.fields.map((f) => ({ value: f.id, label: f.label, group: s.label })),
);

function ConditionRow({
  rule,
  onChange,
  onRemove,
  readOnly,
}: {
  rule: SmartTagRule;
  onChange: (r: SmartTagRule) => void;
  onRemove: () => void;
  readOnly?: boolean;
}) {
  const field = FIELD_INDEX.get(rule.field);
  const ops = operatorsFor(field);
  const needsValue = rule.operator !== "" && operatorNeedsValue(rule.operator);

  let valueControl: React.ReactNode = null;
  if (field && needsValue) {
    if (isMulti(field, rule.operator)) {
      valueControl = (
        <PMultiSelect
          aria-label="Value"
          value={rule.value}
          options={field.options ?? []}
          disabled={readOnly}
          onChange={(value) => onChange({ ...rule, value })}
        />
      );
    } else if (field.kind === "select") {
      valueControl = (
        <PSelect
          aria-label="Value"
          value={rule.value}
          placeholder="Select value"
          options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
          disabled={readOnly}
          onChange={(value) => onChange({ ...rule, value })}
        />
      );
    } else {
      valueControl = (
        <input
          aria-label="Value"
          type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
          inputMode={field.kind === "number" ? "decimal" : undefined}
          value={rule.value}
          disabled={readOnly}
          placeholder={field.kind === "number" ? "Enter a number" : "Enter a value"}
          onChange={(e) => onChange({ ...rule, value: e.target.value })}
          className={FIELD}
        />
      );
    }
  } else if (!field) {
    valueControl = (
      <input aria-label="Value" disabled placeholder="Value" className={FIELD} />
    );
  }

  return (
    <div className="flex items-start gap-[8px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[8px]">
        <PSelect
          aria-label="Field"
          value={rule.field}
          placeholder="Select field"
          options={FIELD_OPTIONS}
          disabled={readOnly}
          onChange={(id) => {
            const f = FIELD_INDEX.get(id);
            onChange({ field: id, operator: operatorsFor(f)[0] ?? "", value: "" });
          }}
        />
        <PSelect
          aria-label="Operator"
          value={rule.operator}
          placeholder="Select operator"
          options={ops.map((o) => ({ value: o, label: o }))}
          disabled={readOnly || !field}
          onChange={(operator) => {
            // Keep the value only when it still means the same thing.
            const keep =
              operatorNeedsValue(operator) &&
              isMulti(field, operator) === isMulti(field, rule.operator);
            onChange({ ...rule, operator, value: keep ? rule.value : "" });
          }}
        />
        {valueControl}
      </div>
      {readOnly ? null : (
        <button
          type="button"
          aria-label="Remove condition"
          onClick={onRemove}
          className="mt-[4px] flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg-surface hover:text-[var(--hr-error-500)]"
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

function RuleGroups({
  groups,
  onChange,
  readOnly,
}: {
  groups: SmartTagRule[][];
  onChange?: (g: SmartTagRule[][]) => void;
  readOnly?: boolean;
}) {
  const update = (next: SmartTagRule[][]) => onChange?.(next);
  const setRule = (gi: number, ri: number, r: SmartTagRule) =>
    update(groups.map((g, i) => (i === gi ? g.map((x, j) => (j === ri ? r : x)) : g)));
  const removeRule = (gi: number, ri: number) =>
    update(
      groups
        .map((g, i) => (i === gi ? g.filter((_, j) => j !== ri) : g))
        .filter((g) => g.length > 0),
    );
  const addNested = (gi: number) =>
    update(groups.map((g, i) => (i === gi ? [...g, blankRule()] : g)));
  const addGroup = () => update([...groups, [blankRule()]]);

  return (
    <div className="flex flex-col">
      {groups.map((group, gi) => (
        <React.Fragment key={gi}>
          {gi > 0 ? (
            <div className="flex items-center gap-[8px] py-[4px] pl-[20px]">
              <span aria-hidden="true" className="h-[24px] border-l-2 border-dotted border-[var(--pg-border-strong)]" />
              <span className="text-[12px] leading-[16px] font-semibold text-pg-muted">And</span>
            </div>
          ) : null}
          <div className="flex flex-col gap-[8px] rounded-[8px] bg-[color-mix(in_oklab,var(--brand)_4%,var(--pg-surface))] p-[12px] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--brand)_28%,transparent)]">
            {group.map((rule, ri) => (
              <React.Fragment key={ri}>
                {ri > 0 ? (
                  <div className="flex items-center gap-[8px]">
                    <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--brand)_20%,transparent)]" />
                    <span className="text-[12px] leading-[16px] font-semibold text-brand">Or</span>
                    <span className="h-px flex-1 bg-[color-mix(in_oklab,var(--brand)_20%,transparent)]" />
                  </div>
                ) : null}
                <ConditionRow
                  rule={rule}
                  readOnly={readOnly}
                  onChange={(r) => setRule(gi, ri, r)}
                  onRemove={() => removeRule(gi, ri)}
                />
              </React.Fragment>
            ))}
            {readOnly ? null : (
              <button type="button" onClick={() => addNested(gi)} className={cn(BTN_GHOST, "self-start")}>
                <Plus size={16} aria-hidden="true" />
                Add nested filter
              </button>
            )}
          </div>
        </React.Fragment>
      ))}
      {readOnly ? null : (
        <>
          {groups.length > 0 ? (
            <span
              aria-hidden="true"
              className="ml-[20px] h-[20px] border-l-2 border-dotted border-[var(--pg-border-strong)]"
            />
          ) : null}
          <button type="button" onClick={addGroup} className={cn(BTN_GHOST, "self-start")}>
            <Plus size={16} aria-hidden="true" />
            Add filter
          </button>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preview card                                                        */
/* ------------------------------------------------------------------ */

/**
 * The board card's markup (opportunity-card.tsx), with the tag being built
 * in place of its fixed "Stale" pill — OpportunityCard can only draw that
 * one, so this mirrors it rather than bending the card for a preview.
 */
function PreviewCard({ name, color }: { name: string; color: string }) {
  const rows = [
    { id: "business", label: CARD_FIELD_LABEL.business, value: "Tech Innovators Inc." },
    { id: "source", label: CARD_FIELD_LABEL.source, value: "Referral" },
    { id: "value", label: CARD_FIELD_LABEL.value, value: "$50,000.00" },
    { id: "lostReason", label: CARD_FIELD_LABEL.lostReason, value: "Budget constraints" },
  ];
  const icons = [PhoneCall, MessageSquareMore, Tag, FileText, SquareCheck, CalendarPlus];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none flex w-full flex-col gap-[8px] rounded-[8px] bg-pg-surface p-[12px] text-left shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_rgba(16,24,40,0.05)] select-none"
    >
      <div className="flex items-start gap-[8px]">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[4px]">
          <span className="w-full truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
            Opportunity name
          </span>
          <TagPill name={name} color={color} />
        </div>
        <ToneAvatar name="John Doe" initials="JD" tone="blue" size={24} round />
      </div>
      <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-[8px] gap-y-[4px] text-[13px] leading-[18px]">
        {rows.map((r) => (
          <React.Fragment key={r.id}>
            <dt className="font-semibold whitespace-nowrap text-pg-muted">{r.label}:</dt>
            <dd className="truncate text-pg-text">{r.value}</dd>
          </React.Fragment>
        ))}
      </dl>
      <div className="flex flex-wrap items-center gap-[4px]">
        {icons.map((Icon, i) => (
          <span key={i} className="flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted">
            <Icon size={16} strokeWidth={1.75} />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drawer                                                              */
/* ------------------------------------------------------------------ */

interface FormState {
  mode: "new" | "prebuilt";
  prebuiltId: string;
  name: string;
  description: string;
  color: string;
  applyToAll: boolean;
  groups: SmartTagRule[][];
}

function initialState(initial?: SmartTag, prebuiltId?: string): FormState {
  if (initial) {
    return {
      mode: "new",
      prebuiltId: "",
      name: initial.name,
      description: initial.description,
      color: initial.color,
      applyToAll: initial.applyToAll,
      groups: initial.groups.length ? cloneGroups(initial.groups) : defaultGroups(),
    };
  }
  const pre = PREBUILT_TAGS.find((p) => p.id === prebuiltId);
  if (pre) {
    return {
      mode: "prebuilt",
      prebuiltId: pre.id,
      name: pre.name,
      description: pre.description,
      color: pre.color,
      applyToAll: false,
      groups: cloneGroups(pre.groups),
    };
  }
  return {
    mode: "new",
    prebuiltId: "",
    name: "",
    description: "",
    color: TAG_COLORS[0]!,
    applyToAll: false,
    groups: defaultGroups(),
  };
}

const DESC_MAX = 200;

export function SmartTagDrawer({
  pipelineName,
  initial,
  prebuiltId,
  onClose,
  onSave,
}: {
  pipelineName: string;
  initial?: SmartTag;
  prebuiltId?: string;
  onClose: () => void;
  onSave: (t: SmartTag) => void;
}) {
  const { effective } = useTheme();
  const [start] = React.useState(() => initialState(initial, prebuiltId));
  const [form, setForm] = React.useState<FormState>(start);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [previewing, setPreviewing] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const nameId = React.useId();
  const descId = React.useId();

  const patch = (p: Partial<FormState>) => setForm((f) => ({ ...f, ...p }));
  const dirty = JSON.stringify(form) !== JSON.stringify(start);
  const hasName = form.name.trim() !== "";
  const rulesReady = form.groups.length > 0 && form.groups.every((g) => g.length > 0 && g.every(ruleComplete));
  const canSave = hasName && rulesReady;

  const requestClose = React.useCallback(() => {
    if (dirty) setConfirming(true);
    else onClose();
  }, [dirty, onClose]);

  // Bubble phase on purpose: menus and the confirm modal catch Escape in the
  // capture phase and stop it, so this only fires when the drawer is on top.
  React.useEffect(() => {
    if (confirming) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose, confirming]);

  const save = () => {
    if (!canSave) return;
    onSave({
      id: initial?.id ?? newId("tag"),
      name: form.name.trim(),
      description: form.description.trim(),
      color: form.color,
      applyToAll: form.applyToAll,
      groups: form.groups,
      modifiedAt: new Date().toISOString(),
    });
    onClose();
  };

  const applyPrebuilt = (id: string) => {
    const pre = PREBUILT_TAGS.find((p) => p.id === id);
    if (!pre) return;
    patch({
      prebuiltId: id,
      name: pre.name,
      description: pre.description,
      color: pre.color,
      groups: cloneGroups(pre.groups),
    });
  };

  if (typeof document === "undefined") return <></>;

  const title = initial ? "Edit smart tag" : "Add smart tag";

  /* ---------- steps ---------- */

  const stepper = (
    <ol className="flex items-center gap-[8px] px-[16px] pb-[12px]" aria-label="Steps">
      {[
        { n: 1 as const, label: "Details" },
        { n: 2 as const, label: "Rule" },
      ].map((s, i) => {
        const active = step === s.n;
        const done = step > s.n;
        const reachable = s.n === 1 || hasName;
        return (
          <React.Fragment key={s.n}>
            {i > 0 ? (
              <span
                aria-hidden="true"
                className={cn("h-px flex-1", done || active ? "bg-brand" : "bg-[var(--pg-border)]")}
              />
            ) : null}
            <li>
              <button
                type="button"
                disabled={!reachable}
                aria-current={active ? "step" : undefined}
                onClick={() => {
                  setStep(s.n);
                  setPreviewing(false);
                }}
                className="flex items-center gap-[8px] rounded-[6px] motion-tap disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    "flex size-[24px] items-center justify-center rounded-full text-[12px] leading-none font-semibold",
                    active && "bg-brand text-brand-fg",
                    done && "bg-brand-soft text-brand",
                    !active && !done && "text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                  )}
                >
                  {done ? <Check size={14} strokeWidth={2.5} aria-hidden="true" /> : s.n}
                </span>
                <span
                  className={cn(
                    "text-[14px] leading-[20px] font-medium",
                    active ? "text-brand" : done ? "text-pg-heading" : "text-pg-muted",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );

  const details = (
    <div className="flex flex-col gap-[20px]">
      <div className="flex flex-col gap-[4px]">
        <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">Smart tag details</h3>
        <p className="text-[13px] leading-[18px] text-pg-muted">
          Give your tag a name and color so it&apos;s easy to spot in your pipeline
        </p>
      </div>

      {initial ? null : (
        <div className="flex flex-col gap-[12px]">
          <div role="radiogroup" aria-label="Tag source" className="flex items-center gap-[24px]">
            <Radio
              label="Create new tag"
              checked={form.mode === "new"}
              onSelect={() => patch({ mode: "new" })}
            />
            <Radio
              label="Prebuilt tags"
              checked={form.mode === "prebuilt"}
              onSelect={() => patch({ mode: "prebuilt" })}
            />
          </div>
          {form.mode === "prebuilt" ? (
            <div className="flex flex-col gap-[4px]">
              <span className={LABEL}>Prebuilt tag</span>
              <PSelect
                aria-label="Prebuilt tag"
                value={form.prebuiltId}
                placeholder="Select a prebuilt tag"
                options={PREBUILT_TAGS.map((p) => ({ value: p.id, label: p.name }))}
                onChange={applyPrebuilt}
              />
            </div>
          ) : null}
        </div>
      )}

      <div className="flex flex-col gap-[4px]">
        <label htmlFor={nameId} className={LABEL}>
          Tag name<span className="text-[var(--hr-error-500)]">*</span>
        </label>
        <input
          id={nameId}
          autoFocus
          value={form.name}
          maxLength={40}
          onChange={(e) => patch({ name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && hasName) setStep(2);
          }}
          placeholder="For example: Stale, Inactive"
          className={FIELD}
        />
      </div>

      <div className="flex flex-col gap-[4px]">
        <label htmlFor={descId} className={LABEL}>
          Description
        </label>
        <textarea
          id={descId}
          value={form.description}
          maxLength={DESC_MAX}
          rows={3}
          onChange={(e) => patch({ description: e.target.value.slice(0, DESC_MAX) })}
          placeholder="No activity in the last 90 days"
          className={cn(FIELD, "h-auto min-h-[84px] resize-y py-[8px]")}
        />
        <span className="self-end text-[13px] leading-[18px] text-pg-muted tabular-nums">
          {form.description.length} / {DESC_MAX}
        </span>
      </div>

      <div className="flex flex-col gap-[8px]">
        <span className={LABEL}>Pick a color</span>
        <div role="radiogroup" aria-label="Tag color" className="flex flex-wrap gap-[8px]">
          {TAG_COLORS.map((c) => {
            const on = form.color === c;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={c}
                onClick={() => patch({ color: c })}
                style={{ backgroundColor: c }}
                className={cn(
                  "flex size-[40px] items-center justify-center rounded-[8px] text-white motion-tap hover:brightness-110",
                  on && "shadow-[0_0_0_2px_var(--pg-surface),0_0_0_4px_var(--brand)]",
                )}
              >
                {on ? <Check size={18} strokeWidth={2.5} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-[4px]">
        <Checkbox
          checked={form.applyToAll}
          onChange={(v) => patch({ applyToAll: v })}
          label="Apply to all pipelines"
        />
        <span className="pl-[24px] text-[13px] leading-[18px] text-pg-muted">
          {form.applyToAll ? "Shows on cards in every pipeline" : `Shows only in ${pipelineName}`}
        </span>
      </div>
    </div>
  );

  const rule = (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <div className="flex items-center gap-[8px]">
          <h3 className="flex flex-1 items-center gap-[6px] text-[16px] leading-[22px] font-semibold text-pg-heading">
            Rule conditions
            <span title="Filters in the same box are joined by OR. Boxes are joined by AND." className="text-pg-faint">
              <Info size={15} aria-label="About rule conditions" />
            </span>
          </h3>
          <button
            type="button"
            onClick={() => patch({ groups: [[blankRule()]] })}
            className={BTN_GHOST}
          >
            <FilterX size={16} aria-hidden="true" />
            Clear filters
          </button>
        </div>
        <p className="text-[13px] leading-[18px] text-pg-muted">Use filters to decide when the tag appears</p>
      </div>
      <RuleGroups groups={form.groups} onChange={(groups) => patch({ groups })} />
    </div>
  );

  const preview = (
    <div className="flex flex-col gap-[16px]">
      <div className="flex items-start gap-[8px]">
        <button
          type="button"
          aria-label="Back to rule"
          onClick={() => setPreviewing(false)}
          className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <div className="flex flex-col gap-[4px] pt-[3px]">
          <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">Preview</h3>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            See how your smart tag looks in the pipeline.
          </p>
        </div>
      </div>

      <div className="rounded-[8px] bg-pg p-[16px]">
        <div className="mx-auto max-w-[300px]">
          <PreviewCard name={form.name.trim()} color={form.color} />
        </div>
      </div>

      <div className="flex flex-col gap-[12px] rounded-[8px] p-[16px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <h4 className="text-[14px] leading-[20px] font-semibold text-pg-heading">Smart tag details</h4>
        <dl className="grid grid-cols-[140px_minmax(0,1fr)] gap-x-[12px] gap-y-[8px] text-[14px] leading-[20px]">
          <dt className="text-pg-muted">Tag name</dt>
          <dd className="break-words text-pg-text">{form.name.trim()}</dd>
          <dt className="text-pg-muted">Description</dt>
          <dd className="break-words text-pg-text">{form.description.trim() || "—"}</dd>
          <dt className="text-pg-muted">Tag color</dt>
          <dd>
            <TagPill name={form.name.trim()} color={form.color} />
          </dd>
          <dt className="text-pg-muted">Apply to all pipelines</dt>
          <dd className="text-pg-text">{form.applyToAll ? "Yes" : "No"}</dd>
        </dl>
      </div>

      <div className="flex flex-col gap-[12px]">
        <h4 className="text-[14px] leading-[20px] font-semibold text-pg-heading">Rule conditions</h4>
        <RuleGroups groups={form.groups} readOnly />
      </div>
    </div>
  );

  /* ---------- footer ---------- */

  const saveBtn = (
    <button type="button" disabled={!canSave} onClick={save} className={BTN_PRIMARY}>
      Save
    </button>
  );

  const footer =
    step === 1 ? (
      <>
        <span className="flex-1" />
        <button type="button" onClick={requestClose} className={BTN_OUTLINE}>
          Cancel
        </button>
        <button type="button" disabled={!hasName} onClick={() => setStep(2)} className={BTN_PRIMARY}>
          Next: add rule
        </button>
      </>
    ) : previewing ? (
      <>
        <button type="button" onClick={() => setPreviewing(false)} className={BTN_OUTLINE}>
          Back
        </button>
        <span className="flex-1" />
        <button type="button" onClick={requestClose} className={BTN_OUTLINE}>
          Cancel
        </button>
        {saveBtn}
      </>
    ) : (
      <>
        <button type="button" onClick={() => setStep(1)} className={BTN_OUTLINE}>
          Back
        </button>
        <span className="flex-1" />
        <button type="button" disabled={!canSave} onClick={() => setPreviewing(true)} className={BTN_OUTLINE}>
          Preview tag
        </button>
        {saveBtn}
      </>
    );

  return (
    <>
      {createPortal(
        <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={requestClose}
            className="absolute inset-0 cursor-default bg-[#10182899]"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="motion-panel-in absolute top-0 right-0 bottom-0 flex w-[480px] max-w-full flex-col bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
          >
            <header className="flex shrink-0 items-center gap-[12px] px-[16px] pt-[12px] pb-[12px]">
              <h2 className="min-w-0 flex-1 truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
                {title}
              </h2>
              <button
                type="button"
                aria-label="Close"
                onClick={requestClose}
                className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>
            <div className="shrink-0 border-b border-pg-head-border">{stepper}</div>

            <div className="min-h-0 flex-1 overflow-y-auto p-[16px]">
              {step === 1 ? details : previewing ? preview : rule}
            </div>

            <footer className="flex shrink-0 items-center gap-[12px] border-t border-pg-head-border px-[16px] py-[12px]">
              {footer}
            </footer>
          </aside>
        </div>,
        document.body,
      )}
      {confirming ? (
        <Modal
          width={440}
          onClose={() => setConfirming(false)}
          icon={
            <span
              aria-hidden="true"
              className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[var(--pg-warn-bg)] text-[var(--pg-warn-icon)]"
            >
              <TriangleAlert size={18} />
            </span>
          }
          title="Unsaved changes"
          footer={
            <>
              <button type="button" onClick={() => setConfirming(false)} className={BTN_OUTLINE}>
                Keep editing
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setConfirming(false);
                  onClose();
                }}
                className="flex h-[36px] shrink-0 items-center rounded-[8px] bg-[var(--hr-warning-600)] px-[16px] text-[14px] leading-[20px] font-semibold whitespace-nowrap text-white motion-tap hover:brightness-110 active:scale-[0.97]"
              >
                Discard
              </button>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">You have unsaved changes. Discard them?</p>
        </Modal>
      ) : null}
    </>
  );
}
