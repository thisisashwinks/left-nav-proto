"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Kanban,
  LayoutDashboard,
  List,
  Loader2,
  MoreVertical,
  RotateCcw,
  SlidersHorizontal,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/page/modal";
import { Checkbox, Select, TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { downloadCsv } from "@/components/contacts/job-modals";
import { dashboards } from "@/components/reporting/dashboard-data";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { opportunities, stages, type Opportunity } from "./opportunities-data";

/* ------------------------------------------------------------------------- */
/* Anchored popover                                                          */
/* ------------------------------------------------------------------------- */

const MENU_SURFACE =
  "rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]";

/**
 * A card portalled to the body and pinned under its trigger with fixed
 * coordinates, so neither the board's scroller nor a modal's overflow can
 * clip it. Re-stamps the page theme (the portal leaves the subtree that
 * carries it) and climbs above the modal layer when its trigger sits inside
 * a dialog.
 */
function AnchoredPopover({
  anchor,
  align,
  width,
  label,
  onClose,
  children,
}: {
  anchor: HTMLElement;
  align: "left" | "right";
  width: number;
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { effective } = useTheme();
  const [rect, setRect] = React.useState(() => anchor.getBoundingClientRect());
  const [inDialog] = React.useState(() => !!anchor.closest("[role='dialog']"));

  React.useEffect(() => {
    const update = () => setRect(anchor.getBoundingClientRect());
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [anchor, onClose]);

  if (typeof document === "undefined") return null;

  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const left =
    align === "right"
      ? Math.max(8, rect.right - width)
      : Math.min(rect.left, vw - width - 8);

  return createPortal(
    <div data-page-theme={effective.appTheme} className={inDialog ? "relative z-[110]" : "relative z-[90]"}>
      <button
        type="button"
        aria-label="Close menu"
        tabIndex={-1}
        onClick={onClose}
        className={cn("fixed inset-0 cursor-default", inDialog ? "z-[110]" : "z-[90]")}
      />
      <div
        role="menu"
        aria-label={label}
        style={{ top: rect.bottom + 4, left, width }}
        className={cn(
          "motion-panel-in fixed",
          inDialog ? "z-[111]" : "z-[91]",
          MENU_SURFACE,
        )}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** The trigger element a popover is pinned to, captured on click. */
function useAnchor() {
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  const toggle = React.useCallback(
    (el: HTMLElement) => setAnchor((cur) => (cur ? null : el)),
    [],
  );
  return { anchor, close, toggle };
}

function MenuRow({
  icon: Icon,
  label,
  trailing,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  trailing?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="motion-tap flex h-[36px] w-full items-center gap-[10px] rounded-[6px] px-[10px] text-left text-pg-text hover:bg-pg"
    >
      <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
      <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px]">{label}</span>
      {trailing}
    </button>
  );
}

/* ------------------------------------------------------------------------- */
/* Board overflow menu                                                       */
/* ------------------------------------------------------------------------- */

export type OverflowAction = "export" | "restore" | "smartLists" | "insights" | "customize";

/**
 * The board's kebab. Export shows a spinner while a job runs in the
 * background, so closing the progress modal mid-way never loses the export.
 */
export function BoardOverflowMenu({
  onAction,
  exporting,
}: {
  onAction: (a: OverflowAction) => void;
  exporting?: boolean;
}) {
  const { anchor, close, toggle } = useAnchor();
  const pick = (a: OverflowAction) => {
    close();
    onAction(a);
  };

  return (
    <>
      <OutlineButton
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={!!anchor}
        onClick={(e) => toggle(e.currentTarget)}
        className="h-[36px] w-[36px] justify-center px-0"
      >
        <MoreVertical size={16} aria-hidden="true" className="text-pg-text-strong" />
      </OutlineButton>

      {anchor ? (
        <AnchoredPopover anchor={anchor} align="right" width={248} label="More actions" onClose={close}>
          <MenuRow
            icon={Upload}
            label="Export"
            onClick={() => pick("export")}
            trailing={
              exporting ? (
                <Loader2
                  size={14}
                  aria-label="Export in progress"
                  className="shrink-0 animate-spin text-brand"
                />
              ) : null
            }
          />
          <MenuRow
            icon={RotateCcw}
            label="Restore opportunities"
            onClick={() => pick("restore")}
            trailing={
              <ExternalLink size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            }
          />
          <MenuRow icon={List} label="Manage smart lists" onClick={() => pick("smartLists")} />
          <MenuRow
            icon={LayoutDashboard}
            label="Dashboard insights"
            onClick={() => pick("insights")}
          />
          <div aria-hidden="true" className="mx-[-4px] my-[4px] h-px bg-pg-row-border" />
          <MenuRow
            icon={SlidersHorizontal}
            label="Customize card"
            onClick={() => pick("customize")}
          />
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------------- */
/* Export job                                                                */
/* ------------------------------------------------------------------------- */

interface ExportJobState {
  status: "idle" | "running" | "ready";
  progress: number;
  total: number;
  rows: Opportunity[];
}

let job: ExportJobState = { status: "idle", progress: 0, total: 0, rows: [] };
const jobListeners = new Set<() => void>();
let jobTimer: ReturnType<typeof setInterval> | null = null;
/** How many progress modals are watching; 0 means the job runs unattended. */
let watchers = 0;

function setJob(next: ExportJobState) {
  job = next;
  jobListeners.forEach((l) => l());
}

function subscribeJob(l: () => void) {
  jobListeners.add(l);
  return () => {
    jobListeners.delete(l);
  };
}

function resetJob() {
  if (jobTimer) clearInterval(jobTimer);
  jobTimer = null;
  setJob({ status: "idle", progress: 0, total: 0, rows: [] });
}

function csvStamp() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function downloadOpportunities(rows: Opportunity[]) {
  const stageLabel = (id: string) => stages.find((s) => s.id === id)?.label ?? id;
  downloadCsv(`opportunities-${csvStamp()}.csv`, [
    ["Opportunity", "Contact", "Business", "Value", "Stage", "Status", "Owner", "Source", "Phone", "Tags", "Updated"],
    ...rows.map((o) => [
      o.name,
      o.contact,
      o.business ?? "",
      o.value,
      stageLabel(o.stageId),
      o.status ?? "open",
      o.owner,
      o.source,
      o.phone ?? "",
      (o.tags ?? []).join("; "),
      o.updated,
    ]),
  ]);
}

/** Runs for about 2.5s in uneven steps, so the bar reads as work, not a tween. */
const STEPS = [8, 17, 30, 38, 52, 61, 70, 84, 93, 100];

function startJob(rows: Opportunity[], total = rows.length) {
  if (job.status === "running") return;
  if (jobTimer) clearInterval(jobTimer);
  let i = 0;
  setJob({ status: "running", progress: 0, total, rows });
  jobTimer = setInterval(() => {
    const progress = STEPS[i++];
    if (progress < 100) {
      setJob({ ...job, progress });
      return;
    }
    if (jobTimer) clearInterval(jobTimer);
    jobTimer = null;
    if (watchers > 0) {
      setJob({ ...job, progress: 100, status: "ready" });
    } else {
      // Nobody is looking — hand over the file and say so.
      downloadOpportunities(job.rows);
      showToast("Export downloaded");
      resetJob();
    }
  }, 250);
}

/**
 * The export job, shared by the progress modal and the kebab's spinner.
 * `running` stays true until the export finishes, whether or not the modal
 * is still open.
 */
export function useExportJob() {
  const state = React.useSyncExternalStore(subscribeJob, () => job, () => job);
  return {
    start: startJob,
    running: state.status === "running",
    ready: state.status === "ready",
    progress: state.progress,
    total: state.total,
  };
}

/* ------------------------------------------------------------------------- */
/* Export progress modal                                                     */
/* ------------------------------------------------------------------------- */

function IconTile({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-[40px] items-center justify-center rounded-full bg-brand-soft text-brand">
      <Icon size={20} aria-hidden="true" />
    </span>
  );
}

/**
 * Starts an export on mount (or reattaches to one already running) and
 * follows it. Closing mid-way leaves the job running: it downloads by itself
 * when done, and the kebab spins until then.
 */
export function ExportProgressModal({
  total,
  rows,
  onClose,
  onDone,
}: {
  total: number;
  rows?: Opportunity[];
  onClose: () => void;
  onDone?: () => void;
}) {
  const state = React.useSyncExternalStore(subscribeJob, () => job, () => job);
  const source = rows ?? opportunities;

  React.useEffect(() => {
    watchers += 1;
    if (job.status === "idle") startJob(source, total);
    return () => {
      watchers -= 1;
      // Closed after it finished without downloading — clear the slate.
      if (job.status === "ready" && watchers === 0) resetJob();
    };
    // Mount-only: the job owns its rows once started.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const done = state.status === "ready";
  const onDoneRef = React.useRef(onDone);
  React.useEffect(() => {
    onDoneRef.current = onDone;
  });
  React.useEffect(() => {
    if (done) onDoneRef.current?.();
  }, [done]);

  const shownTotal = state.total || total;
  const exported = Math.round((state.progress / 100) * shownTotal);

  const download = () => {
    downloadOpportunities(state.rows);
    showToast("Export downloaded");
    resetJob();
    onClose();
  };

  return (
    <Modal
      width={520}
      onClose={onClose}
      icon={<IconTile icon={Download} />}
      title={done ? "Your export is ready" : "Preparing your export"}
      bodyClassName="gap-[16px]"
      footer={
        done ? (
          <>
            <OutlineButton onClick={onClose}>Close</OutlineButton>
            <PrimaryButton onClick={download}>
              <Download size={15} aria-hidden="true" />
              Download CSV
            </PrimaryButton>
          </>
        ) : (
          <PrimaryButton onClick={onClose}>Close</PrimaryButton>
        )
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-muted">
        {done
          ? "Download the CSV to save it to your computer."
          : "Don't reload this window or leave Opportunities while the export is in progress."}
      </p>

      <div className="flex items-center gap-[12px]">
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={state.progress}
          aria-label="Export progress"
          className="h-[8px] min-w-0 flex-1 overflow-hidden rounded-full bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          <div
            className="h-full rounded-full bg-brand transition-[width] duration-200 ease-out"
            style={{ width: `${state.progress}%` }}
          />
        </div>
        <span className="w-[40px] shrink-0 text-right text-[13px] leading-[18px] font-medium text-pg-text-strong tabular-nums">
          {state.progress}%
        </span>
      </div>

      <p className="text-[14px] leading-[20px] text-pg-text">
        <strong className="font-semibold text-pg-heading">{exported.toLocaleString("en-US")}</strong>{" "}
        of{" "}
        <strong className="font-semibold text-pg-heading">{shownTotal.toLocaleString("en-US")}</strong>{" "}
        {shownTotal === 1 ? "opportunity" : "opportunities"} exported
      </p>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/* Dashboard insights                                                        */
/* ------------------------------------------------------------------------- */

interface Widget {
  id: string;
  title: string;
  value: string;
  caption: string;
}

const WIDGETS: Widget[] = [
  { id: "count", title: "Opportunity count", value: "847", caption: "All pipelines" },
  { id: "open", title: "Open opportunities", value: "392", caption: "Across open stages" },
  { id: "won", title: "Won opportunities", value: "286", caption: "Last 30 days" },
  { id: "lost", title: "Lost opportunities", value: "169", caption: "Last 30 days" },
  { id: "rate", title: "Win rate", value: "34%", caption: "Won of closed" },
  { id: "value", title: "Pipeline value", value: "$1.2M", caption: "Open opportunities" },
  { id: "deal", title: "Average deal size", value: "$3,420", caption: "Won opportunities" },
  { id: "velocity", title: "Sales velocity", value: "$18.4K/day", caption: "Last 30 days" },
  { id: "conversion", title: "Stage conversion", value: "41%", caption: "New lead to won" },
  { id: "close", title: "Average time to close", value: "23 days", caption: "Won opportunities" },
];

const CREATE_NEW = "__create";

const DASHBOARD_OPTIONS = [
  { value: "sales-overview", label: "Sales overview" },
  ...dashboards.map((d) => ({ value: d.id, label: d.label, hint: d.meta.split(" · ")[0] })),
  { value: CREATE_NEW, label: "+ Create new dashboard" },
];

export function DashboardInsightsModal({ onClose }: { onClose: () => void }) {
  const [dashboard, setDashboard] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState("");
  const [picked, setPicked] = React.useState<Set<string>>(() => new Set(WIDGETS.map((w) => w.id)));
  const rail = React.useRef<HTMLDivElement>(null);
  const [edges, setEdges] = React.useState({ start: true, end: false });

  const creating = dashboard === CREATE_NEW;
  const dashboardName = creating
    ? newName.trim()
    : DASHBOARD_OPTIONS.find((o) => o.value === dashboard)?.label ?? "";
  const canConfirm = !!dashboardName && picked.size > 0;

  const syncEdges = () => {
    const el = rail.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 1,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 1,
    });
  };

  const scroll = (dir: -1 | 1) => {
    rail.current?.scrollBy({ left: dir * 512, behavior: "smooth" });
  };

  const toggle = (id: string, on: boolean) =>
    setPicked((cur) => {
      const next = new Set(cur);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const confirm = () => {
    if (!canConfirm) return;
    const n = picked.size;
    showToast(`${n} ${n === 1 ? "widget" : "widgets"} added to ${dashboardName}`);
    onClose();
  };

  return (
    <Modal
      width={900}
      onClose={onClose}
      title="Add relevant insights to your dashboard"
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton
            onClick={confirm}
            disabled={!canConfirm}
            className="disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
          >
            Confirm and add
          </PrimaryButton>
        </>
      }
    >
      <p className="-mt-[8px] text-[14px] leading-[20px] text-pg-muted">
        Select a dashboard and choose widgets. They&apos;re added right away.
      </p>

      <div className="flex flex-wrap items-end gap-[12px]">
        <label className="flex w-[320px] max-w-full flex-col gap-[4px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
            Select dashboard
          </span>
          <Select
            aria-label="Select dashboard"
            value={dashboard}
            options={DASHBOARD_OPTIONS}
            onChange={setDashboard}
            placeholder="Choose a dashboard"
          />
        </label>
        {creating ? (
          <label className="flex w-[320px] max-w-full flex-col gap-[4px]">
            <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
              Dashboard name
            </span>
            <TextInput
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Sales overview"
            />
          </label>
        ) : null}
      </div>

      <section className="flex flex-col gap-[12px] rounded-[12px] bg-pg p-[16px]">
        <div className="flex items-center justify-between gap-[12px]">
          <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
            Selected widgets ({picked.size})
          </h3>
          <div className="flex gap-[8px]">
            <OutlineButton
              aria-label="Previous widgets"
              onClick={() => scroll(-1)}
              disabled={edges.start}
              className="h-[32px] w-[32px] justify-center px-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </OutlineButton>
            <OutlineButton
              aria-label="Next widgets"
              onClick={() => scroll(1)}
              disabled={edges.end}
              className="h-[32px] w-[32px] justify-center px-0 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </OutlineButton>
          </div>
        </div>

        <div
          ref={rail}
          onScroll={syncEdges}
          className="-m-[4px] flex snap-x gap-[12px] overflow-x-auto p-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {WIDGETS.map((w) => {
            const on = picked.has(w.id);
            return (
              <div
                key={w.id}
                role="button"
                tabIndex={0}
                aria-pressed={on}
                onClick={() => toggle(w.id, !on)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(w.id, !on);
                  }
                }}
                className={cn(
                  "motion-tap flex h-[170px] w-[240px] shrink-0 cursor-pointer snap-start flex-col justify-between rounded-[8px] bg-pg-surface p-[16px] transition-opacity",
                  on
                    ? "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]"
                    : "opacity-55 shadow-[inset_0_0_0_1px_var(--pg-border)] hover:opacity-80",
                )}
              >
                <div className="flex items-start gap-[8px]">
                  <Checkbox checked={on} onChange={(next) => toggle(w.id, next)} className="mt-[2px]" />
                  <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-medium text-pg-text-strong">
                    {w.title}
                  </span>
                </div>
                <div className="flex flex-col gap-[2px]">
                  <span className="text-[36px] leading-[44px] font-semibold tracking-[-0.5px] text-pg-heading tabular-nums">
                    {w.value}
                  </span>
                  <span className="text-[13px] leading-[18px] text-pg-muted">{w.caption}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Modal>
  );
}

/* ------------------------------------------------------------------------- */
/* New list                                                                  */
/* ------------------------------------------------------------------------- */

type ListKind = "board" | "list";

const LIST_KINDS: { kind: ListKind; icon: LucideIcon; title: string; description: string }[] = [
  { kind: "board", icon: Kanban, title: "Board view", description: "View opportunities as cards in each stage." },
  { kind: "list", icon: List, title: "List view", description: "View opportunities in a table." },
];

function NewListRows({ onPick }: { onPick: (kind: ListKind) => void }) {
  return (
    <>
      {LIST_KINDS.map((k) => (
        <button
          key={k.kind}
          type="button"
          role="menuitem"
          onClick={() => onPick(k.kind)}
          className="motion-tap flex w-full items-start gap-[10px] rounded-[6px] px-[10px] py-[8px] text-left hover:bg-pg"
        >
          <span className="mt-[1px] flex size-[28px] shrink-0 items-center justify-center rounded-[6px] bg-brand-soft text-brand">
            <k.icon size={16} aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">{k.title}</span>
            <span className="text-[13px] leading-[18px] text-pg-muted">{k.description}</span>
          </span>
        </button>
      ))}
    </>
  );
}

/**
 * Wraps the `+ List` trigger: clicking it opens the board/list picker under
 * it. The trigger keeps its own markup — the wrapper only listens.
 */
export function NewListMenu({
  onPick,
  children,
}: {
  onPick: (kind: ListKind) => void;
  children: React.ReactElement;
}) {
  const { anchor, close, toggle } = useAnchor();
  return (
    <>
      <span
        className="inline-flex shrink-0"
        onClickCapture={(e) => {
          const el = (e.currentTarget.firstElementChild as HTMLElement | null) ?? e.currentTarget;
          toggle(el);
        }}
      >
        {children}
      </span>
      {anchor ? (
        <NewListPopover anchor={anchor} onClose={close} onPick={onPick} />
      ) : null}
    </>
  );
}

/**
 * The same picker without a wrapped trigger — for a `+ List` button someone
 * else renders (the ViewBar's `onCreate`). Pass the button as `anchor`, e.g.
 * `document.activeElement` captured inside the click handler.
 */
export function NewListPopover({
  anchor,
  onPick,
  onClose,
}: {
  anchor: HTMLElement;
  onPick: (kind: ListKind) => void;
  onClose: () => void;
}) {
  return (
    <AnchoredPopover anchor={anchor} align="left" width={300} label="New list" onClose={onClose}>
      <NewListRows
        onPick={(k) => {
          onClose();
          onPick(k);
        }}
      />
    </AnchoredPopover>
  );
}

/* ------------------------------------------------------------------------- */
/* Create list modal                                                         */
/* ------------------------------------------------------------------------- */

function slug(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CreateListModal({
  kind: initialKind,
  onClose,
  onCreate,
}: {
  kind: ListKind;
  onClose: () => void;
  onCreate: (l: { id: string; label: string; kind: ListKind }) => void;
}) {
  const [name, setName] = React.useState("");
  const [kind, setKind] = React.useState<ListKind>(initialKind);
  const [visibility, setVisibility] = React.useState<"me" | "everyone">("me");
  const [touched, setTouched] = React.useState(false);
  const label = name.trim();
  const invalid = touched && !label;

  const create = () => {
    setTouched(true);
    if (!label) return;
    onCreate({ id: `${slug(label) || "list"}-${Date.now().toString(36)}`, label, kind });
    showToast("List created");
    onClose();
  };

  return (
    <Modal
      width={480}
      onClose={onClose}
      title="Create list"
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={create}>Create list</PrimaryButton>
        </>
      }
    >
      <form
        className="flex flex-col gap-[16px]"
        onSubmit={(e) => {
          e.preventDefault();
          create();
        }}
      >
        <label className="flex flex-col gap-[4px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
            List name <span className="text-pg-danger">*</span>
          </span>
          <TextInput
            autoFocus
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Closing this month"
            aria-invalid={invalid}
            className={invalid ? "shadow-[inset_0_0_0_1px_var(--pg-danger)]" : undefined}
          />
          {invalid ? (
            <span className="text-[13px] leading-[18px] text-pg-danger">Enter a list name.</span>
          ) : null}
        </label>

        <div className="flex flex-col gap-[4px]">
          <span id="create-list-kind" className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
            Show as
          </span>
          <div
            role="radiogroup"
            aria-labelledby="create-list-kind"
            className="flex h-[36px] w-fit gap-[2px] rounded-[8px] bg-pg p-[2px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
          >
            {LIST_KINDS.map((k) => {
              const on = k.kind === kind;
              return (
                <button
                  key={k.kind}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setKind(k.kind)}
                  className={cn(
                    "motion-tap flex items-center gap-[6px] rounded-[6px] px-[14px] text-[14px] leading-[20px] font-medium",
                    on
                      ? "bg-pg-surface text-pg-heading shadow-[0_1px_2px_rgba(16,24,40,0.08),inset_0_0_0_1px_var(--pg-border)]"
                      : "text-pg-muted hover:text-pg-text-strong",
                  )}
                >
                  <k.icon size={15} aria-hidden="true" />
                  {k.kind === "board" ? "Board" : "List"}
                </button>
              );
            })}
          </div>
        </div>

        <fieldset className="flex flex-col gap-[8px]">
          <legend className="mb-[4px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
            Visible to
          </legend>
          {(
            [
              { id: "me", label: "Only me" },
              { id: "everyone", label: "Everyone" },
            ] as const
          ).map((o) => {
            const on = visibility === o.id;
            return (
              <label key={o.id} className="flex w-fit cursor-pointer items-center gap-[8px]">
                <input
                  type="radio"
                  name="create-list-visibility"
                  checked={on}
                  onChange={() => setVisibility(o.id)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-[16px] items-center justify-center rounded-full peer-focus-visible:shadow-[0_0_0_3px_var(--brand-soft)]",
                    on
                      ? "bg-brand"
                      : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                  )}
                >
                  {on ? <span className="size-[6px] rounded-full bg-brand-fg" /> : null}
                </span>
                <span className="text-[14px] leading-[20px] text-pg-text">{o.label}</span>
              </label>
            );
          })}
        </fieldset>
      </form>
    </Modal>
  );
}
