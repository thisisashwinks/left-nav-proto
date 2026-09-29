"use client";

import * as React from "react";
import {
  Building2,
  Calendar,
  ChevronDown,
  CircleMinus,
  CirclePlus,
  Clock,
  Info,
  Plus,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  AnchoredPopover,
  MenuRow,
  toneFor,
  type AssociatedObject,
} from "@/components/contacts/associated-objects";
import { RichTextField, plainTextLength } from "@/components/contacts/rich-text-field";
import { ToneAvatar } from "@/components/page/avatar";
import { TextInput, Toggle } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  COMPANY_OPTIONS,
  CONTACT_OPTIONS,
  PEOPLE,
  TIME_SLOTS,
  TODAY,
  newTaskId,
  personById,
  personLabel,
  upsertTask,
  type CrmTask,
} from "./tasks-data";
import { FIELD_BOX, LABEL, OptionRow, PersonAvatar, PopoverSearch } from "./tasks-ui";

/**
 * New task / edit task — the right drawer over a scrim (screenshots 57, 59).
 *
 * The drawer is a form first, so it gets the page's 36px controls rather
 * than the rail's dense ones, and its actions are pinned in the footer so
 * Save never scrolls away while the description grows.
 */

const DEFAULT_DUE = "2026-09-30";
const DEFAULT_TIME = "12:00 AM";
const MAX_PER_KIND = 10;

export function TaskDrawer({ task, onClose }: { task: CrmTask | null; onClose: () => void }) {
  const [title, setTitle] = React.useState(task?.title ?? "");
  const [showDesc, setShowDesc] = React.useState(!task || plainTextLength(task.html) > 0);
  const [html, setHtml] = React.useState(task?.html ?? "");
  const [due, setDue] = React.useState(task?.due ?? DEFAULT_DUE);
  const [time, setTime] = React.useState(task?.time ?? DEFAULT_TIME);
  const [recurOn, setRecurOn] = React.useState(Boolean(task?.recurring));
  const [every, setEvery] = React.useState(String(task?.recurring?.every ?? 1));
  const [unit, setUnit] = React.useState<"day" | "week" | "month">(task?.recurring?.unit ?? "week");
  const [endsOn, setEndsOn] = React.useState(Boolean(task?.recurring && task.recurring.ends !== "never"));
  const [endDate, setEndDate] = React.useState(
    task?.recurring && task.recurring.ends !== "never" ? task.recurring.ends : "2026-12-31",
  );
  const [assigneeId, setAssigneeId] = React.useState<string | null>(task?.assigneeId ?? null);
  const [associations, setAssociations] = React.useState<AssociatedObject[]>(task?.associations ?? []);
  const [shownKinds, setShownKinds] = React.useState<AssociatedObject["kind"][]>([]);

  const canSave = title.trim().length > 0 && (!showDesc || plainTextLength(html) <= 2000);
  const n = Math.max(1, Math.min(99, Number.parseInt(every, 10) || 1));

  const save = (another: boolean) => {
    if (!canSave) return;
    upsertTask({
      id: task?.id ?? newTaskId(),
      title: title.trim(),
      html: showDesc ? html : "",
      due: due || DEFAULT_DUE,
      time,
      recurring: recurOn ? { every: n, unit, ends: endsOn && endDate ? endDate : "never" } : null,
      assigneeId,
      done: task?.done ?? false,
      associations,
    });
    if (task) {
      showToast("Task updated.");
      onClose();
      return;
    }
    showToast("Task created.");
    if (!another) {
      onClose();
      return;
    }
    // A fresh form for the next one; the drawer stays where it is.
    setTitle("");
    setShowDesc(true);
    setHtml("");
    setDue(DEFAULT_DUE);
    setTime(DEFAULT_TIME);
    setRecurOn(false);
    setEvery("1");
    setUnit("week");
    setEndsOn(false);
    setAssigneeId(null);
    setAssociations([]);
    setShownKinds([]);
    document.getElementById("task-drawer-title")?.focus();
  };

  return (
    <>
      <button
        type="button"
        aria-label="Close task"
        tabIndex={-1}
        onClick={onClose}
        className="motion-fade-in fixed inset-0 z-[79] cursor-default bg-[#10182866]"
      />
      <SideDrawer
        width={560}
        onClose={onClose}
        lead={
          <span className="flex size-[28px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Plus size={15} aria-hidden="true" />
          </span>
        }
        title={
          <span className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
            {task ? task.title : "New task"}
          </span>
        }
        bodyClassName="px-[16px]"
        footer={
          <div className="flex w-full items-center gap-[12px] px-[2px]">
            <OutlineButton className="h-[36px] text-[14px]" onClick={onClose}>
              Cancel
            </OutlineButton>
            <span className="flex-1" />
            {task ? null : (
              <OutlineButton
                className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canSave}
                onClick={() => save(true)}
              >
                Save and add another
              </OutlineButton>
            )}
            <PrimaryButton
              className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
              disabled={!canSave}
              onClick={() => save(false)}
            >
              Save
            </PrimaryButton>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            save(false);
          }}
          className="flex flex-col gap-[20px] py-[16px]"
        >
          <div className="flex flex-col gap-[4px]">
            <label htmlFor="task-drawer-title" className={LABEL}>
              Title <span className="text-[var(--hr-error-500)]">*</span>
            </label>
            <TextInput
              id="task-drawer-title"
              autoFocus
              value={title}
              maxLength={200}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter"
            />
            <button
              type="button"
              onClick={() => setShowDesc((v) => !v)}
              className="mt-[10px] flex items-center gap-[6px] self-start text-[14px] leading-[20px] font-medium text-pg-text motion-tap hover:text-pg-heading"
            >
              {showDesc ? <CircleMinus size={16} aria-hidden="true" /> : <CirclePlus size={16} aria-hidden="true" />}
              {showDesc ? "Remove description" : "Add description"}
            </button>
            {showDesc ? (
              <div className="pt-[8px]">
                <RichTextField
                  value={html}
                  onChange={setHtml}
                  placeholder="Enter task description"
                  maxLength={2000}
                  minHeight={200}
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-[4px]">
            <span className={LABEL}>Due date and time (IST)</span>
            <div className="flex gap-[16px]">
              <DateField value={due} onChange={setDue} aria-label="Due date" className="w-[240px] min-w-0" />
              <TimeField value={time} onChange={setTime} />
            </div>
          </div>

          <div className="flex flex-col gap-[14px] rounded-[8px] bg-pg px-[16px] py-[14px]">
            <div className="flex items-center gap-[10px]">
              <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-semibold text-pg-heading">
                Setup recurring tasks
              </span>
              <Toggle checked={recurOn} onChange={setRecurOn} aria-label="Setup recurring tasks" />
            </div>
            {recurOn ? (
              <div className="flex flex-col gap-[14px] border-t border-pg-head-border pt-[14px]">
                <div className="flex flex-col gap-[4px]">
                  <span className={LABEL}>Repeat every</span>
                  <div className="flex gap-[8px]">
                    <TextInput
                      type="number"
                      min={1}
                      max={99}
                      value={every}
                      onChange={(e) => setEvery(e.target.value)}
                      onBlur={() => setEvery(String(n))}
                      aria-label="Repeat interval"
                      className="w-[80px] shrink-0"
                    />
                    <UnitSelect value={unit} plural={n > 1} onChange={setUnit} />
                  </div>
                </div>
                <div role="radiogroup" aria-label="Ends" className="flex flex-col gap-[8px]">
                  <span className={LABEL}>Ends</span>
                  <div className="flex items-center gap-[20px]">
                    {(
                      [
                        [false, "Never"],
                        [true, "On date"],
                      ] as const
                    ).map(([v, l]) => (
                      <button
                        key={l}
                        type="button"
                        role="radio"
                        aria-checked={endsOn === v}
                        onClick={() => setEndsOn(v)}
                        className="flex items-center gap-[8px] text-[14px] leading-[20px] text-pg-text motion-tap"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "size-[16px] rounded-full",
                            endsOn === v
                              ? "bg-pg-surface shadow-[inset_0_0_0_5px_var(--brand)]"
                              : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                          )}
                        />
                        {l}
                      </button>
                    ))}
                  </div>
                  {endsOn ? (
                    <DateField value={endDate} onChange={setEndDate} aria-label="End date" className="w-[240px]" />
                  ) : null}
                </div>
                <p className="text-[13px] leading-[18px] text-pg-muted">
                  Repeats every {n > 1 ? `${n} ${unit}s` : unit}
                  {endsOn && endDate ? ` until ${endDate.split("-").slice(1).join("/")}/${endDate.slice(0, 4)}` : ""}.
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-[4px]">
            <span className={LABEL}>Assign to</span>
            <AssigneeSelect value={assigneeId} onChange={setAssigneeId} />
          </div>

          <div className="h-px bg-pg-head-border" />

          <Associations
            value={associations}
            onChange={setAssociations}
            shownKinds={shownKinds}
            onShowKind={(k) => setShownKinds((s) => (s.includes(k) ? s : [...s, k]))}
          />
        </form>
      </SideDrawer>
    </>
  );
}

/* ─── Fields ────────────────────────────────────────────────────────────── */

function DateField({
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  "aria-label": string;
}) {
  return (
    <label className={cn(FIELD_BOX, "cursor-pointer", className)}>
      <input
        type="date"
        value={value}
        min={ariaLabel === "End date" ? TODAY : undefined}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => {
          try {
            e.currentTarget.showPicker?.();
          } catch {
            // Some browsers refuse outside a trusted gesture; typing still works.
          }
        }}
        className="min-w-0 flex-1 cursor-pointer bg-transparent text-[14px] leading-[20px] text-pg-text focus:outline-none [&::-webkit-calendar-picker-indicator]:hidden"
      />
      <Calendar size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
    </label>
  );
}

function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  const slots = TIME_SLOTS.includes(value) ? TIME_SLOTS : [value, ...TIME_SLOTS];
  return (
    <>
      <button
        type="button"
        aria-label="Due time"
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        onClick={(e) => {
          const el = e.currentTarget;
          setAnchor((a) => (a ? null : el));
        }}
        className={cn(
          FIELD_BOX,
          "w-[150px] shrink-0 text-left motion-tap",
          anchor && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">{value}</span>
        <Clock size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {anchor ? (
        <AnchoredPopover anchor={anchor} onClose={close} width={150} label="Due time">
          <div role="listbox" className="flex max-h-[240px] flex-col overflow-y-auto p-[4px]">
            {slots.map((t) => {
              const on = t === value;
              return (
                <button
                  key={t}
                  ref={on ? (el) => el?.scrollIntoView({ block: "center" }) : undefined}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => {
                    onChange(t);
                    close();
                  }}
                  className={cn(
                    "flex h-[32px] shrink-0 items-center rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] tabular-nums motion-tap",
                    on ? "bg-brand-soft font-medium text-brand" : "text-pg-text hover:bg-pg",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function UnitSelect({
  value,
  plural,
  onChange,
}: {
  value: "day" | "week" | "month";
  plural: boolean;
  onChange: (v: "day" | "week" | "month") => void;
}) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  const label = (u: string) => `${u[0].toUpperCase()}${u.slice(1)}${plural ? "s" : ""}`;
  return (
    <>
      <button
        type="button"
        aria-label="Repeat unit"
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        onClick={(e) => {
          const el = e.currentTarget;
          setAnchor((a) => (a ? null : el));
        }}
        className={cn(FIELD_BOX, "w-[160px] text-left motion-tap")}
      >
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">{label(value)}</span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {anchor ? (
        <AnchoredPopover anchor={anchor} onClose={close} width={160} label="Repeat unit">
          <div role="listbox" className="flex flex-col p-[4px]">
            {(["day", "week", "month"] as const).map((u) => (
              <OptionRow
                key={u}
                selected={u === value}
                onClick={() => {
                  onChange(u);
                  close();
                }}
              >
                {label(u)}
              </OptionRow>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function AssigneeSelect({ value, onChange }: { value: string | null; onChange: (id: string | null) => void }) {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const [query, setQuery] = React.useState("");
  const close = React.useCallback(() => setAnchor(null), []);
  const current = personById(value);
  const q = query.trim().toLowerCase();
  const shown = q ? PEOPLE.filter((p) => personLabel(p).toLowerCase().includes(q)) : PEOPLE;

  return (
    <>
      <button
        type="button"
        aria-label="Assign to"
        aria-haspopup="listbox"
        aria-expanded={anchor !== null}
        onClick={(e) => {
          const el = e.currentTarget;
          setQuery("");
          setAnchor((a) => (a ? null : el));
        }}
        className={cn(
          FIELD_BOX,
          "w-full text-left motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          anchor && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        {current ? (
          <span className="flex min-w-0 flex-1 items-center gap-[8px]">
            <PersonAvatar person={current} size={22} />
            <span className="truncate text-[14px] leading-[20px] text-pg-text">{personLabel(current)}</span>
          </span>
        ) : (
          <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-faint">Select assignee</span>
        )}
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>
      {anchor ? (
        <AnchoredPopover anchor={anchor} onClose={close} width={anchor.offsetWidth} label="Assign to">
          <div className="flex max-h-[300px] flex-col">
            <PopoverSearch value={query} onChange={setQuery} placeholder="Search teammates" />
            <div role="listbox" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
              {shown.length === 0 ? (
                <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">No teammates match your search</p>
              ) : null}
              {shown.map((p) => (
                <OptionRow
                  key={p.id}
                  selected={p.id === value}
                  onClick={() => {
                    onChange(p.id === value ? null : p.id);
                    close();
                  }}
                >
                  <PersonAvatar person={p} size={22} />
                  <span className="truncate">{personLabel(p)}</span>
                </OptionRow>
              ))}
            </div>
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/* ─── Associated objects ────────────────────────────────────────────────── */

type Kind = "companies" | "contacts";

const KINDS: { kind: Kind; label: string; icon: LucideIcon; options: AssociatedObject[] }[] = [
  { kind: "companies", label: "Companies", icon: Building2, options: COMPANY_OPTIONS },
  { kind: "contacts", label: "Contacts", icon: UserRound, options: CONTACT_OPTIONS },
];

type AssocOpen = { what: "kinds"; anchor: HTMLElement } | { what: "picker"; kind: Kind; anchor: HTMLElement } | null;

function Associations({
  value,
  onChange,
  shownKinds,
  onShowKind,
}: {
  value: AssociatedObject[];
  onChange: (v: AssociatedObject[]) => void;
  shownKinds: AssociatedObject["kind"][];
  onShowKind: (k: Kind) => void;
}) {
  const [open, setOpen] = React.useState<AssocOpen>(null);
  const close = React.useCallback(() => setOpen(null), []);
  const info = "Link this task to records so it shows up on each of them.";

  return (
    <div className="flex flex-col gap-[16px] pb-[8px]">
      <div className="flex items-center gap-[6px]">
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Associated objects</span>
        <span title={info} className="flex text-pg-muted">
          <Info size={15} aria-label={info} />
        </span>
        <span className="flex-1" />
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open?.what === "kinds"}
          onClick={(e) => {
            const anchor = e.currentTarget;
            setOpen((o) => (o?.what === "kinds" ? null : { what: "kinds", anchor }));
          }}
          className="flex h-[32px] items-center gap-[6px] rounded-[6px] px-[6px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:bg-brand-soft"
        >
          Associate to
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>

      {KINDS.map((k) => {
        const items = value.filter((v) => v.kind === k.kind);
        if (items.length === 0 && !shownKinds.includes(k.kind)) return null;
        return (
          <div key={k.kind} className="flex flex-col gap-[8px] border-b border-pg-head-border pb-[16px] last:border-b-0">
            <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
              {k.label} ({items.length}/{MAX_PER_KIND})
            </span>
            <div className="flex flex-wrap items-center gap-[8px]">
              {items.map((item) => (
                <span
                  key={item.id}
                  className="flex h-[32px] max-w-full min-w-0 items-center gap-[6px] rounded-[6px] bg-pg-surface pr-[6px] pl-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
                >
                  {k.kind === "contacts" ? (
                    <ToneAvatar name={item.name} initials={item.initials} tone={toneFor(item.id)} size={20} round />
                  ) : null}
                  <span className="min-w-0 truncate text-[14px] leading-[20px] text-pg-text-strong">{item.name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onChange(value.filter((v) => v.id !== item.id))}
                    className="flex size-[20px] shrink-0 items-center justify-center rounded-[4px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </span>
              ))}
              {items.length < MAX_PER_KIND ? (
                <button
                  type="button"
                  onClick={(e) => {
                    const anchor = e.currentTarget;
                    setOpen({ what: "picker", kind: k.kind, anchor });
                  }}
                  className="flex h-[32px] items-center gap-[4px] rounded-[6px] bg-brand-soft px-[10px] text-[14px] leading-[20px] font-medium text-brand motion-tap hover:brightness-95"
                >
                  <Plus size={15} aria-hidden="true" />
                  Add
                </button>
              ) : null}
            </div>
          </div>
        );
      })}

      {open?.what === "kinds" ? (
        <AnchoredPopover anchor={open.anchor} onClose={close} width={200} align="end" label="Associate to">
          <div role="menu" className="flex flex-col p-[4px]">
            {KINDS.map((k) => (
              <MenuRow
                key={k.kind}
                icon={k.icon}
                label={k.label}
                onClick={() => {
                  onShowKind(k.kind);
                  setOpen({ what: "picker", kind: k.kind, anchor: open.anchor });
                }}
              />
            ))}
          </div>
        </AnchoredPopover>
      ) : null}

      {open?.what === "picker" ? (
        <AnchoredPopover
          key={open.kind}
          anchor={open.anchor}
          onClose={close}
          width={280}
          align={open.anchor.getAttribute("aria-haspopup") ? "end" : "start"}
          label={`Choose ${open.kind}`}
        >
          <Picker kind={open.kind} value={value} onChange={onChange} />
        </AnchoredPopover>
      ) : null}
    </div>
  );
}

function Picker({
  kind,
  value,
  onChange,
}: {
  kind: Kind;
  value: AssociatedObject[];
  onChange: (v: AssociatedObject[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const def = KINDS.find((k) => k.kind === kind)!;
  const q = query.trim().toLowerCase();
  const shown = q ? def.options.filter((o) => o.name.toLowerCase().includes(q)) : def.options;
  const full = value.filter((v) => v.kind === kind).length >= MAX_PER_KIND;

  return (
    <div className="flex max-h-[320px] flex-col">
      <PopoverSearch value={query} onChange={setQuery} placeholder={`Search ${def.label.toLowerCase()}`} />
      <div role="listbox" aria-multiselectable="true" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
        {shown.length === 0 ? (
          <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
            No {def.label.toLowerCase()} match your search
          </p>
        ) : null}
        {shown.map((o) => {
          const on = value.some((v) => v.id === o.id);
          return (
            <OptionRow
              key={o.id}
              multi
              selected={on}
              onClick={() => {
                if (!on && full) return;
                onChange(on ? value.filter((v) => v.id !== o.id) : [...value, o]);
              }}
            >
              <ToneAvatar name={o.name} initials={o.initials} tone={toneFor(o.id)} size={22} round={kind === "contacts"} />
              <span className={cn("truncate", !on && full && "opacity-50")}>{o.name}</span>
            </OptionRow>
          );
        })}
      </div>
    </div>
  );
}
