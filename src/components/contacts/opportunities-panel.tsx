"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  EllipsisVertical,
  PenLine,
  Plus,
  Search,
  Target,
  Unlink,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import {
  opportunities as BOARD_OPPORTUNITIES,
  pipelines as BOARD_PIPELINES,
  stages as BOARD_STAGES,
} from "@/components/opportunities/opportunities-data";
import { ME, TEAMMATES } from "@/components/product/conversations/conversations-data";
import { cn } from "@/lib/utils";

/**
 * The Opportunities panel of the record rail.
 *
 * A record's deals are the same deals the Opportunities board draws — the
 * panel is a window onto them from the contact's side, not a second store. So
 * the pipelines, stages, and the "existing" deals offered for linking all come
 * off the board's data, and the panel only owns which of them this record is
 * attached to. The list itself is controlled: the host keeps it per record, so
 * flipping between conversations does not cross-wire anyone's deals.
 *
 * Every sub-view (create, edit, link) REPLACES the body rather than stacking a
 * modal over it. The rail is already a laid-on card; a modal on a drawer is
 * two layers of "not the page" and the second one has nowhere to sit.
 */

export interface LinkedOpportunity {
  id: string;
  name: string;
  pipeline: string;
  stage: string;
  status: "open" | "won" | "lost" | "abandoned";
  value: number;
  owner?: string;
}

type Status = LinkedOpportunity["status"];

/* ─── Option data ───────────────────────────────────────────────────────── */

/**
 * Stages per pipeline.
 *
 * The board ships one stage ladder and shows it under every pipeline, which
 * is fine for a board you are standing in. A create form is different: the
 * Stage select visibly re-cuts when Pipeline changes, and a re-cut that
 * changes nothing reads as broken. So installs get their own ladder; the rest
 * keep the board's open stages (won/lost are statuses here, not stages).
 */
const OPEN_STAGES = BOARD_STAGES.filter((s) => s.tone === "open").map((s) => s.label);

const PIPELINE_STAGES: Record<string, string[]> = Object.fromEntries(
  BOARD_PIPELINES.map((p) => [
    p.label,
    p.id === "install"
      ? ["Site survey", "Quote sent", "Install booked", "Installed"]
      : OPEN_STAGES,
  ]),
);

const PIPELINE_NAMES = BOARD_PIPELINES.map((p) => p.label);

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
  { value: "abandoned", label: "Abandoned" },
];

const OWNER_NAMES = [ME.name, ...TEAMMATES.map((t) => t.name)];

function stageLabel(stageId: string): string {
  return BOARD_STAGES.find((s) => s.id === stageId)?.label ?? "New lead";
}

function statusFromStage(stageId: string): Status {
  const tone = BOARD_STAGES.find((s) => s.id === stageId)?.tone;
  return tone === "won" ? "won" : tone === "lost" ? "lost" : "open";
}

/**
 * Deals already on the board, as the Link existing picker offers them.
 *
 * Six, off the board's own rows, so a deal linked here is one you could go and
 * find in the pipeline — won/lost stages fold into the status pill and the
 * stage column falls back to where the deal last stood.
 */
const EXISTING: LinkedOpportunity[] = BOARD_OPPORTUNITIES.slice(0, 7)
  .filter((o) => o.id !== "o2")
  .map((o) => ({
    id: `board-${o.id}`,
    name: o.name,
    pipeline: BOARD_PIPELINES[0].label,
    stage:
      statusFromStage(o.stageId) === "open" ? stageLabel(o.stageId) : "Quote sent",
    status: statusFromStage(o.stageId),
    value: Number(o.value.replace(/[$,]/g, "")),
    owner: o.owner === "Unassigned" ? undefined : o.owner,
  }));

/** Most records start with nothing; the two demo threads carry a deal or two. */
export function seedOpportunities(recordId: string): LinkedOpportunity[] {
  const id = recordId.toLowerCase();
  if (id.includes("pietro")) {
    return [
      {
        id: "seed-pietro-1",
        name: "Office retrofit — floor 3",
        pipeline: "New installs",
        stage: "Quote sent",
        status: "open",
        value: 12500,
        owner: "Samrina Shaikh",
      },
      {
        id: "seed-pietro-2",
        name: "Annual service plan",
        pipeline: "AC services",
        stage: "Quote sent",
        status: "won",
        value: 690,
        owner: ME.name,
      },
    ];
  }
  if (id.includes("sukarto")) {
    return [
      {
        id: "seed-sukarto-1",
        name: "Split unit — bedroom",
        pipeline: "AC services",
        stage: "Reached out",
        status: "open",
        value: 1299,
        owner: "Aayush Singhal",
      },
    ];
  }
  return [];
}

/** "$49", "$1,299" — cents only when there are some. */
function formatMoney(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function metaLine(o: LinkedOpportunity): string {
  return `${o.pipeline} · ${o.stage} · ${formatMoney(o.value)}`;
}

/* ─── Floating menus ────────────────────────────────────────────────────── */

/**
 * A menu laid on the viewport, anchored to the control that opened it.
 *
 * Portalled because the drawer body is a scroll container — a menu inside it
 * gets clipped at the card's edge, which on a 340px rail is most menus. Fixed
 * position is written straight onto the node in a layout effect, so it lands
 * placed on the first paint and flips above the trigger when there is no room
 * below. Escape is caught in the capture phase and stopped there: the drawer
 * listens for Escape too, and closing a menu must not close the panel.
 */
function FloatingMenu({
  anchor,
  onClose,
  align = "start",
  matchWidth = true,
  minWidth = 160,
  children,
  className,
}: {
  anchor: HTMLElement | null;
  onClose: () => void;
  align?: "start" | "end";
  matchWidth?: boolean;
  minWidth?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !anchor) return;
    const place = () => {
      const r = anchor.getBoundingClientRect();
      if (matchWidth) el.style.width = `${Math.max(r.width, minWidth)}px`;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const gap = 4;
      const below = r.bottom + gap;
      const top =
        below + h > window.innerHeight - 8 && r.top - gap - h >= 8
          ? r.top - gap - h
          : below;
      const rawLeft = align === "end" ? r.right - w : r.left;
      const left = Math.min(Math.max(8, rawLeft), window.innerWidth - w - 8);
      el.style.top = `${top}px`;
      el.style.left = `${left}px`;
      el.style.visibility = "visible";
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchor, align, matchWidth, minWidth]);

  React.useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
      anchor?.focus();
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [anchor, onClose]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      style={{ position: "fixed", top: 0, left: 0, visibility: "hidden" }}
      className={cn(
        "z-[90] flex flex-col rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),0_0_0_1px_var(--pg-card-border)]",
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
}

const TRIGGER =
  "flex h-[36px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] focus-visible:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

/** A single-choice select whose menu escapes the drawer's scroll clip. */
function Select({
  id,
  value,
  options,
  placeholder,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  options: string[];
  placeholder: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}) {
  const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  return (
    <>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
        className={TRIGGER}
      >
        <span className={cn("min-w-0 flex-1 truncate", value ? "text-pg-text" : "text-pg-faint")}>
          {value || placeholder}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-faint transition-transform", anchor && "rotate-180")}
        />
      </button>
      {anchor ? (
        <FloatingMenu anchor={anchor} onClose={close} className="max-h-[280px] overflow-auto">
          {options.map((o) => {
            const on = o === value;
            return (
              <button
                key={o}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                onClick={() => {
                  onChange(o);
                  close();
                  anchor.focus();
                }}
                className={cn(
                  "flex h-[34px] shrink-0 items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] motion-tap hover:bg-pg",
                  on ? "font-medium text-pg-text-strong" : "text-pg-text",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{o}</span>
                {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
              </button>
            );
          })}
        </FloatingMenu>
      ) : null}
    </>
  );
}

/* ─── Shared pieces ─────────────────────────────────────────────────────── */

function Field({
  htmlFor,
  label,
  required,
  children,
}: {
  htmlFor: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <label
        htmlFor={htmlFor}
        className="text-[14px] leading-[20px] font-medium text-pg-text-strong"
      >
        {label}
        {required ? <span className="text-[var(--hr-error-500)]"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

/** The footer every sub-view pins to the bottom of the body, above a rule. */
function SubFooter({
  onCancel,
  confirm,
  disabled,
  onConfirm,
}: {
  onCancel: () => void;
  confirm: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <div className="sticky bottom-0 -mx-[14px] mt-auto flex shrink-0 justify-end gap-[12px] border-t border-pg-head-border bg-pg-surface px-[16px] py-[12px]">
      <OutlineButton className="h-[36px]" onClick={onCancel}>
        Cancel
      </OutlineButton>
      <PrimaryButton
        className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
        disabled={disabled}
        onClick={onConfirm}
      >
        {confirm}
      </PrimaryButton>
    </div>
  );
}

function BackRow({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="flex min-w-0 items-center gap-[8px] pt-[14px] text-left motion-tap hover:text-brand"
    >
      <ArrowLeft size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
      <span className="min-w-0 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
        {label}
      </span>
    </button>
  );
}

/**
 * Status pill tones. Brand for open, the paid/overdue status tokens for won
 * and lost — both carry dark values in tokens.css — and a plain chip for
 * abandoned, which is neither good news nor bad.
 */
const STATUS_TONE: Record<Status, string> = {
  open: "bg-brand-soft text-brand",
  won: "bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] text-[var(--pg-status-paid-fg)]",
  lost: "bg-[color-mix(in_oklab,var(--hr-error-600)_12%,transparent)] text-[var(--pg-status-overdue-fg)]",
  abandoned: "bg-pg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]",
};

function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex h-[20px] shrink-0 items-center rounded-full px-[8px] text-[12px] leading-none font-medium",
        STATUS_TONE[status],
      )}
    >
      {STATUS_OPTIONS.find((s) => s.value === status)?.label}
    </span>
  );
}

/* ─── List ──────────────────────────────────────────────────────────────── */

function CardMenu({
  onEdit,
  onUnlink,
}: {
  onEdit: () => void;
  onUnlink: () => void;
}) {
  const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  const items: { label: string; icon: LucideIcon; run: () => void }[] = [
    { label: "Edit", icon: PenLine, run: onEdit },
    { label: "Unlink", icon: Unlink, run: onUnlink },
  ];
  return (
    <>
      <button
        type="button"
        aria-label="Opportunity actions"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
        className={cn(
          "flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text focus-visible:opacity-100",
          anchor ? "bg-pg text-pg-text opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <EllipsisVertical size={15} aria-hidden="true" />
      </button>
      {anchor ? (
        <FloatingMenu anchor={anchor} onClose={close} align="end" matchWidth={false} className="w-[160px]">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                it.run();
              }}
              className="flex h-[34px] items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] text-pg-text motion-tap hover:bg-pg"
            >
              <it.icon size={14} aria-hidden="true" className="shrink-0 text-pg-muted" />
              {it.label}
            </button>
          ))}
        </FloatingMenu>
      ) : null}
    </>
  );
}

function OpportunityCard({
  o,
  onEdit,
  onUnlink,
}: {
  o: LinkedOpportunity;
  onEdit: () => void;
  onUnlink: () => void;
}) {
  return (
    <div className="group flex flex-col gap-[6px] rounded-[8px] bg-pg-surface px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex items-start gap-[8px]">
        <span className="min-w-0 flex-1 truncate pt-[3px] text-[14px] leading-[20px] font-semibold text-pg-text-strong">
          {o.name}
        </span>
        <CardMenu onEdit={onEdit} onUnlink={onUnlink} />
      </div>
      <span className="flex min-w-0 items-center gap-[3px] text-[13px] leading-[18px] text-pg-muted">
        <span className="min-w-0 truncate">{o.pipeline}</span>
        <ChevronRight size={12} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <span className="min-w-0 truncate">{o.stage}</span>
      </span>
      <div className="flex items-center justify-between gap-[8px]">
        <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong tabular-nums">
          {formatMoney(o.value)}
        </span>
        <StatusPill status={o.status} />
      </div>
      {o.owner ? (
        <span className="flex items-center gap-[5px] text-[13px] leading-[18px] text-pg-faint">
          <UserRound size={12} aria-hidden="true" className="shrink-0" />
          <span className="truncate">{o.owner}</span>
        </span>
      ) : null}
    </div>
  );
}

function EmptyState({
  onCreate,
  onLink,
}: {
  onCreate: () => void;
  onLink: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-[8px] px-[12px] pt-[40px] pb-[24px] text-center">
      <span className="flex size-[40px] items-center justify-center rounded-full bg-pg text-pg-muted">
        <Target size={20} aria-hidden="true" />
      </span>
      <span className="pt-[4px] text-[14px] leading-[20px] font-semibold text-pg-text-strong">
        No opportunities yet
      </span>
      <span className="text-[13px] leading-[18px] text-pg-muted">
        Track opportunities by creating or linking one.
      </span>
      <span className="flex items-center gap-[12px] pt-[8px]">
        <OutlineButton className="h-[30px] px-[11px] text-[13px]" onClick={onCreate}>
          Create new
        </OutlineButton>
        <button
          type="button"
          onClick={onLink}
          className="flex h-[30px] items-center rounded-[8px] bg-brand-soft px-[11px] text-[13px] leading-none font-medium text-brand motion-tap hover:brightness-105 active:scale-[0.97]"
        >
          Link existing
        </button>
      </span>
    </div>
  );
}

/* ─── Create / edit ─────────────────────────────────────────────────────── */

function OpportunityForm({
  record,
  initial,
  onCancel,
  onSubmit,
}: {
  record: { id: string; name: string };
  /** Present when editing; the form is a create form otherwise. */
  initial?: LinkedOpportunity;
  onCancel: () => void;
  onSubmit: (o: LinkedOpportunity) => void;
}) {
  const [name, setName] = React.useState(initial?.name ?? `${record.name} – New deal`);
  const [pipeline, setPipeline] = React.useState(initial?.pipeline ?? PIPELINE_NAMES[0]);
  const [stage, setStage] = React.useState(
    initial?.stage ?? PIPELINE_STAGES[PIPELINE_NAMES[0]][0],
  );
  const [status, setStatus] = React.useState<Status>(initial?.status ?? "open");
  const [value, setValue] = React.useState(initial ? String(initial.value) : "");
  const [owner, setOwner] = React.useState(initial?.owner ?? ME.name);

  const stageOptions = PIPELINE_STAGES[pipeline] ?? [];
  const ready = name.trim() !== "" && pipeline !== "" && stage !== "";
  const f = `opp-${record.id}`;

  return (
    <div className="flex min-h-full flex-col">
      <form
        className="flex flex-col gap-[16px] pt-[14px] pb-[20px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!ready) return;
          onSubmit({
            id: initial?.id ?? `opp-${Date.now()}`,
            name: name.trim(),
            pipeline,
            stage,
            status,
            value: Number(value) || 0,
            owner: owner || undefined,
          });
        }}
        id={`${f}-form`}
      >
        <span className="text-[16px] leading-[24px] font-semibold text-pg-heading">
          {initial ? "Edit opportunity" : "Add opportunity"}
        </span>

        <Field htmlFor={`${f}-name`} label="Opportunity name" required>
          <input
            id={`${f}-name`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="h-[36px] w-full rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] placeholder:text-pg-faint focus:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] focus:outline-none"
          />
        </Field>

        <Field htmlFor={`${f}-pipeline`} label="Pipeline" required>
          <Select
            id={`${f}-pipeline`}
            value={pipeline}
            options={PIPELINE_NAMES}
            placeholder="Select pipeline"
            onChange={(next) => {
              setPipeline(next);
              // A stage only means something inside its own pipeline.
              if (!(PIPELINE_STAGES[next] ?? []).includes(stage)) {
                setStage(PIPELINE_STAGES[next]?.[0] ?? "");
              }
            }}
          />
        </Field>

        <Field htmlFor={`${f}-stage`} label="Stage" required>
          <Select
            id={`${f}-stage`}
            value={stage}
            options={stageOptions}
            placeholder="Select stage"
            disabled={!pipeline}
            onChange={setStage}
          />
        </Field>

        <Field htmlFor={`${f}-status`} label="Status">
          <Select
            id={`${f}-status`}
            value={STATUS_OPTIONS.find((s) => s.value === status)?.label ?? ""}
            options={STATUS_OPTIONS.map((s) => s.label)}
            placeholder="Select status"
            onChange={(label) =>
              setStatus(STATUS_OPTIONS.find((s) => s.label === label)?.value ?? "open")
            }
          />
        </Field>

        <Field htmlFor={`${f}-value`} label="Opportunity value">
          <div className="flex h-[36px] items-center rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <span
              aria-hidden="true"
              className="flex h-full items-center border-r border-pg-border px-[12px] text-[14px] leading-[20px] text-pg-muted"
            >
              $
            </span>
            <input
              id={`${f}-value`}
              inputMode="decimal"
              placeholder="0"
              value={value}
              onChange={(e) => {
                // Digits and one decimal point; the "$" lives outside the box.
                const clean = e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
                setValue(clean);
              }}
              className="h-full min-w-0 flex-1 bg-transparent px-[12px] text-[14px] leading-[20px] text-pg-text tabular-nums placeholder:text-pg-faint focus:outline-none"
            />
          </div>
        </Field>

        <Field htmlFor={`${f}-owner`} label="Owner">
          <Select
            id={`${f}-owner`}
            value={owner}
            options={OWNER_NAMES}
            placeholder="Select owner"
            onChange={setOwner}
          />
        </Field>
      </form>

      <SubFooter
        onCancel={onCancel}
        confirm={initial ? "Save changes" : "Create"}
        disabled={!ready}
        onConfirm={() =>
          (document.getElementById(`${f}-form`) as HTMLFormElement | null)?.requestSubmit()
        }
      />
    </div>
  );
}

/* ─── Link existing ─────────────────────────────────────────────────────── */

function LinkExisting({
  record,
  linkedIds,
  onCancel,
  onSave,
}: {
  record: { id: string; name: string };
  linkedIds: Set<string>;
  onCancel: () => void;
  onSave: (picked: LinkedOpportunity[]) => void;
}) {
  const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
  const [query, setQuery] = React.useState("");
  const [picked, setPicked] = React.useState<string[]>([]);
  const close = React.useCallback(() => {
    setAnchor(null);
    setQuery("");
  }, []);

  const available = EXISTING.filter((o) => !linkedIds.has(o.id));
  const q = query.trim().toLowerCase();
  const shown = q
    ? available.filter((o) => `${o.name} ${metaLine(o)}`.toLowerCase().includes(q))
    : available;
  const pickedRows = available.filter((o) => picked.includes(o.id));

  const toggle = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="flex min-h-full flex-col">
      <BackRow label={`Add opportunity to ${record.name}`} onBack={onCancel} />

      <div className="flex flex-col gap-[4px] pt-[16px]">
        <label
          htmlFor={`link-opp-${record.id}`}
          className="text-[14px] leading-[20px] font-medium text-pg-text-strong"
        >
          Select opportunities
        </label>
        <button
          id={`link-opp-${record.id}`}
          type="button"
          aria-haspopup="menu"
          aria-expanded={anchor !== null}
          onClick={(e) => (anchor ? close() : setAnchor(e.currentTarget))}
          className={TRIGGER}
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate",
              picked.length ? "text-pg-text" : "text-pg-faint",
            )}
          >
            {picked.length ? `${picked.length} selected` : "Select opportunities"}
          </span>
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cn("shrink-0 text-pg-faint transition-transform", anchor && "rotate-180")}
          />
        </button>
      </div>

      {anchor ? (
        <FloatingMenu anchor={anchor} onClose={close} minWidth={240}>
          <div className="flex h-[34px] shrink-0 items-center gap-[8px] rounded-[6px] px-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              autoFocus
              aria-label="Search opportunities"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
          <div className="mt-[4px] flex max-h-[260px] flex-col overflow-auto">
            {shown.length === 0 ? (
              <span className="px-[10px] py-[10px] text-[13px] leading-[18px] text-pg-muted">
                {available.length === 0
                  ? "Every opportunity is already linked."
                  : "No opportunities match your search."}
              </span>
            ) : (
              shown.map((o) => {
                const on = picked.includes(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="menuitemcheckbox"
                    aria-checked={on}
                    onClick={() => toggle(o.id)}
                    className="flex shrink-0 items-start gap-[10px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "mt-[3px] flex size-[14px] shrink-0 items-center justify-center rounded-[4px]",
                        on
                          ? "bg-brand text-brand-fg"
                          : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                      )}
                    >
                      {on ? <Check size={10} strokeWidth={3} /> : null}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[14px] leading-[20px] text-pg-text-strong">
                        {o.name}
                      </span>
                      <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                        {metaLine(o)}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </FloatingMenu>
      ) : null}

      {pickedRows.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-[10px] py-[32px] text-center">
          <span className="flex size-[48px] items-center justify-center rounded-full bg-pg text-pg-muted">
            <UserRound size={22} aria-hidden="true" />
          </span>
          <span className="text-[13px] leading-[18px] font-semibold text-pg-text-strong">
            Select opportunities to proceed
          </span>
        </div>
      ) : (
        <div className="flex flex-1 flex-col gap-[8px] pt-[16px] pb-[20px]">
          {pickedRows.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-[10px] rounded-[8px] bg-pg-surface px-[12px] py-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
            >
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
                  {o.name}
                </span>
                <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                  {metaLine(o)}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Remove ${o.name}`}
                onClick={() => toggle(o.id)}
                className="flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text active:scale-90"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <SubFooter
        onCancel={onCancel}
        confirm="Save"
        disabled={pickedRows.length === 0}
        onConfirm={() => onSave(pickedRows)}
      />
    </div>
  );
}

/* ─── The body ──────────────────────────────────────────────────────────── */

type Mode =
  | { kind: "list" }
  | { kind: "create" }
  | { kind: "edit"; id: string }
  | { kind: "link" };

/**
 * The panel body. The host owns the list and the drawer chrome; the header's
 * "+ Add" bumps `addSignal`, which goes straight to the create form — a menu
 * asking "create or link?" would be one more click in front of the common
 * case, and Link existing sits one tap away on the list anyway.
 */
export function OpportunitiesBody({
  record,
  value,
  onChange,
  addSignal,
}: {
  record: { id: string; name: string };
  value: LinkedOpportunity[];
  onChange: (next: LinkedOpportunity[]) => void;
  addSignal: number;
}) {
  const [mode, setMode] = React.useState<Mode>({ kind: "list" });

  // Adjusted during render, not in an effect: a bumped signal or a different
  // record re-routes the body before it paints the stale view.
  const [seenSignal, setSeenSignal] = React.useState(addSignal);
  if (addSignal !== seenSignal) {
    setSeenSignal(addSignal);
    setMode({ kind: "create" });
  }
  const [seenRecord, setSeenRecord] = React.useState(record.id);
  if (record.id !== seenRecord) {
    setSeenRecord(record.id);
    setMode({ kind: "list" });
  }

  const back = () => setMode({ kind: "list" });

  if (mode.kind === "create" || mode.kind === "edit") {
    const editing = mode.kind === "edit" ? value.find((o) => o.id === mode.id) : undefined;
    return (
      <OpportunityForm
        key={`${record.id}-${mode.kind}-${editing?.id ?? addSignal}`}
        record={record}
        initial={editing}
        onCancel={back}
        onSubmit={(o) => {
          if (editing) {
            onChange(value.map((x) => (x.id === o.id ? o : x)));
            showToast("Opportunity updated");
          } else {
            onChange([o, ...value]);
            showToast("Opportunity created");
          }
          back();
        }}
      />
    );
  }

  if (mode.kind === "link") {
    return (
      <LinkExisting
        key={record.id}
        record={record}
        linkedIds={new Set(value.map((o) => o.id))}
        onCancel={back}
        onSave={(picked) => {
          onChange([...value, ...picked]);
          showToast(picked.length === 1 ? "Opportunity linked" : "Opportunities linked");
          back();
        }}
      />
    );
  }

  if (value.length === 0) {
    return (
      <EmptyState
        onCreate={() => setMode({ kind: "create" })}
        onLink={() => setMode({ kind: "link" })}
      />
    );
  }

  return (
    <div className="flex flex-col gap-[8px] py-[12px]">
      {value.map((o) => (
        <OpportunityCard
          key={o.id}
          o={o}
          onEdit={() => setMode({ kind: "edit", id: o.id })}
          onUnlink={() => {
            onChange(value.filter((x) => x.id !== o.id));
            showToast("Opportunity unlinked");
          }}
        />
      ))}
      <button
        type="button"
        onClick={() => setMode({ kind: "link" })}
        className="flex w-fit items-center gap-[4px] pt-[4px] text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
      >
        <Plus size={13} aria-hidden="true" />
        Link existing
      </button>
    </div>
  );
}
