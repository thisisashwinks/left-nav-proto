"use client";

import * as React from "react";
import {
  ArrowLeft,
  Building2,
  ChevronDown,
  Download,
  Eye,
  ListTodo,
  Pencil,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  Target,
  Trash2,
  User,
  type LucideIcon,
} from "lucide-react";
import { ToneAvatar } from "@/components/page/avatar";
import { Checkbox, Select, StatusTag, TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { TableCard, usePagination } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import { ViewBar } from "@/components/page/view-bar";
import {
  ListToolbar,
  useListToolbar,
  type ListToolbarModel,
} from "@/components/page/list-toolbar";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTRIES,
  AUDIT_MODULES,
  AUDIT_USERS,
  EXPORT_JOBS,
  formatAt,
  nowIst,
  toneFor,
  type AuditEntry,
  type ExportJob,
} from "./audit-logs-data";

export type { AuditEntry } from "./audit-logs-data";

const HEAD = "text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted";
/** The log table's columns; `name` is locked, the rest can be hidden. */
const LOG_COLUMNS: { id: string; label: string; width: string; locked?: boolean }[] = [
  { id: "name", label: "Name", width: "1.7fr", locked: true },
  { id: "module", label: "Module", width: "1fr" },
  { id: "action", label: "Action", width: "1fr" },
  { id: "by", label: "Done by", width: "1.5fr" },
  { id: "at", label: "Date and time", width: "1.3fr" },
];

const LOG_SORT_FIELDS = [
  { value: "at", label: "Date and time" },
  { value: "name", label: "Name" },
];
const EXPORT_COLS = "2fr 1.3fr 1.2fr 0.9fr 110px";

const DEFAULT_FROM = "2026-07-31";
const DEFAULT_TO = "2026-09-29";
const ALL = "all";

const MODULE_ICON: Record<AuditEntry["module"], LucideIcon> = {
  Opportunity: Target,
  Contact: User,
  Company: Building2,
  Task: ListTodo,
};

const MODULE_NOUN: Record<AuditEntry["module"], [string, string]> = {
  Opportunity: ["opportunity", "opportunities"],
  Contact: ["contact", "contacts"],
  Company: ["company", "companies"],
  Task: ["task", "tasks"],
};

const ACTION_STYLE: Record<
  AuditEntry["action"],
  { tone: "danger" | "success" | "brand"; icon: LucideIcon }
> = {
  Deleted: { tone: "danger", icon: Trash2 },
  Created: { tone: "success", icon: Plus },
  Updated: { tone: "brand", icon: Pencil },
  Restored: { tone: "brand", icon: RotateCcw },
};

/** Who is doing the restoring in this prototype. */
const ME = { name: "Ashwin KS", initials: "AK", via: "Web app" };

/** "1 opportunity" / "3 opportunities", or "records" when modules are mixed. */
function nounFor(entries: AuditEntry[]): string {
  const n = entries.length;
  const modules = new Set(entries.map((e) => e.module));
  if (modules.size !== 1) return n === 1 ? "record" : "records";
  const [one, many] = MODULE_NOUN[entries[0].module];
  return n === 1 ? one : many;
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Settings › Audit logs.
 *
 * Also the trash for opportunities: "Restore opportunities" lands here with
 * Module = Opportunity and Action = Deleted already set, and a deleted row's
 * drawer (or the bulk bar) puts it back. A restore is logged as its own
 * Restored entry rather than rewriting the Deleted one, because an audit log
 * that edits its own history is not one.
 */
export function AuditLogsPage({
  initialModule,
  initialAction,
  onBack,
}: {
  initialModule?: AuditEntry["module"];
  initialAction?: AuditEntry["action"];
  onBack?: () => void;
}) {
  const [tab, setTab] = React.useState<"logs" | "exports">("logs");
  const [entries, setEntries] = React.useState<AuditEntry[]>(AUDIT_ENTRIES);
  /** Deleted entry id → the Restored entry that undid it. */
  const [restored, setRestored] = React.useState<Map<string, string>>(() => new Map());
  const [jobs, setJobs] = React.useState<ExportJob[]>(EXPORT_JOBS);

  const [query, setQuery] = React.useState("");
  const [users, setUsers] = React.useState<Set<string>>(() => new Set());
  const [moduleFilter, setModuleFilter] = React.useState<string>(initialModule ?? ALL);
  const [action, setAction] = React.useState<string>(initialAction ?? ALL);
  const [from, setFrom] = React.useState(DEFAULT_FROM);
  const [to, setTo] = React.useState(DEFAULT_TO);

  const [refreshing, setRefreshing] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [confirming, setConfirming] = React.useState<string[] | null>(null);

  // Sort and column visibility only have controls under the shared toolbar.
  const { shared } = useListToolbar();
  const [sort, setSort] = React.useState<{ field: string; dir: "asc" | "desc" } | null>(null);
  const [hiddenCols, setHiddenCols] = React.useState<Set<string>>(() => new Set());
  const activeSort = shared ? sort : null;

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const found = entries.filter((e) => {
      if (q && !e.docId.toLowerCase().includes(q) && !e.name.toLowerCase().includes(q)) return false;
      if (users.size > 0 && !users.has(e.by.name)) return false;
      if (moduleFilter !== ALL && e.module !== moduleFilter) return false;
      if (action !== ALL && e.action !== action) return false;
      const day = e.at.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    });
    if (!activeSort) return found;
    const sign = activeSort.dir === "asc" ? 1 : -1;
    return [...found].sort(
      (a, b) =>
        (activeSort.field === "name" ? a.name.localeCompare(b.name) : a.at.localeCompare(b.at)) *
        sign,
    );
  }, [entries, query, users, moduleFilter, action, from, to, activeSort]);

  const pager = usePagination(rows, 20);
  const selecting = action === "Deleted";
  const restorable = (e: AuditEntry) => e.action === "Deleted" && !restored.has(e.id);

  const pageIds = pager.pageRows.filter(restorable).map((r) => r.id);
  const onPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPage = pageIds.length > 0 && onPage === pageIds.length;
  // Only what is still on screen and still restorable counts toward the bar.
  const liveSelected = rows.filter((r) => selected.has(r.id) && restorable(r)).map((r) => r.id);

  const open = openId ? entries.find((e) => e.id === openId) ?? null : null;

  const refresh = () => {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 700);
  };

  const startExport = () => {
    const stamp = nowIst();
    setJobs((prev) => [
      {
        id: `x-${Date.now()}`,
        file: `audit-logs-${stamp.slice(0, 10)}.csv`,
        requestedBy: ME.name,
        at: stamp,
        status: "Processing",
      },
      ...prev,
    ]);
    showToast("Audit log export started");
  };

  const restore = (ids: string[]) => {
    const targets = entries.filter((e) => ids.includes(e.id) && restorable(e));
    if (targets.length === 0) return;
    const at = nowIst();
    const made = targets.map<AuditEntry>((e, i) => ({
      id: `r-${Date.now()}-${i}`,
      name: e.name,
      docId: e.docId,
      module: e.module,
      action: "Restored",
      by: ME,
      at,
    }));
    setEntries((prev) => [...made, ...prev]);
    setRestored((prev) => {
      const next = new Map(prev);
      targets.forEach((e, i) => next.set(e.id, made[i].id));
      return next;
    });
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    // Keep the new entry inside the range the table is showing.
    if (to && at.slice(0, 10) > to) setTo(at.slice(0, 10));
    setConfirming(null);
    const noun = nounFor(targets);
    showToast(
      targets.length === 1 ? `${capitalize(noun)} restored` : `${targets.length} ${noun} restored`,
    );
  };

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const togglePage = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (allOnPage ? next.delete(id) : next.add(id)));
      return next;
    });

  const filtered =
    query !== "" || users.size > 0 || moduleFilter !== ALL || action !== ALL || from !== DEFAULT_FROM || to !== DEFAULT_TO;

  const clearFilters = () => {
    setQuery("");
    setUsers(new Set());
    setModuleFilter(ALL);
    setAction(ALL);
    setFrom(DEFAULT_FROM);
    setTo(DEFAULT_TO);
  };

  const hidden = shared ? hiddenCols : undefined;
  const shownCols = LOG_COLUMNS.filter((c) => c.locked || !hidden?.has(c.id));
  const baseCols = `${shownCols.map((c) => c.width).join(" ")} 32px`;
  const cols = selecting ? `20px ${baseCols}` : baseCols;

  const model = React.useMemo<ListToolbarModel>(
    () => ({
      search: { value: query, onChange: setQuery, placeholder: "Search by document ID" },
      quickFilters: [
        {
          id: "users",
          label: "Users",
          icon: User,
          multiple: true,
          options: AUDIT_USERS.map((u) => ({ value: u.name, label: u.name })),
          value: [...users],
          onChange: (v) => setUsers(new Set(v)),
        },
        {
          id: "module",
          label: "Module",
          options: AUDIT_MODULES.map((m) => ({ value: m, label: m })),
          value: moduleFilter === ALL ? [] : [moduleFilter],
          onChange: (v) => setModuleFilter(v[0] ?? ALL),
        },
        {
          id: "action",
          label: "Action",
          options: AUDIT_ACTIONS.map((a) => ({ value: a, label: a })),
          value: action === ALL ? [] : [action],
          onChange: (v) => {
            setAction(v[0] ?? ALL);
            setSelected(new Set());
          },
        },
      ],
      sort: { fields: LOG_SORT_FIELDS, value: sort, onChange: setSort },
      columns: {
        items: LOG_COLUMNS.map((c) => ({
          id: c.id,
          label: c.label,
          visible: c.locked || !hiddenCols.has(c.id),
          locked: c.locked,
        })),
        onChange: (items) =>
          setHiddenCols(new Set(items.filter((i) => !i.visible && !i.locked).map((i) => i.id))),
      },
      resultCount: { value: rows.length, noun: rows.length === 1 ? "entry" : "entries" },
    }),
    [query, users, moduleFilter, action, sort, hiddenCols, rows.length],
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="motion-tap -mb-[6px] flex w-fit items-center gap-[6px] rounded-[6px] text-[13px] leading-[18px] font-medium text-pg-muted hover:text-brand"
        >
          <ArrowLeft size={14} aria-hidden="true" />
          Back to opportunities
        </button>
      ) : null}

      <PageHeader
        title="Audit logs"
        description="Track system activity, user actions, and data changes across your account."
        aside={
          <>
            <OutlineButton onClick={startExport}>
              <Download size={15} aria-hidden="true" className="text-pg-text-strong" />
              Export
            </OutlineButton>
            <PrimaryButton onClick={refresh} aria-busy={refreshing}>
              <RotateCw
                size={15}
                aria-hidden="true"
                className={cn(refreshing && "animate-spin")}
              />
              Refresh
            </PrimaryButton>
          </>
        }
      />

      <ViewBar
        label="Audit log sections"
        views={[
          { id: "logs", label: "Audit logs" },
          { id: "exports", label: "Exports", count: String(jobs.length) },
        ]}
        activeId={tab}
        onSelect={(id) => setTab(id as "logs" | "exports")}
      />

      {tab === "exports" ? (
        <ExportsTable jobs={jobs} />
      ) : (
        <>
          {shared ? (
            /*
             * The shared toolbar draws search, users, module, and action; the
             * date range has no slot there, so it keeps a row of its own.
             */
            <div className="flex shrink-0 flex-wrap items-center gap-[8px]">
              <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
              {filtered ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="motion-tap ml-auto rounded-[6px] px-[8px] py-[6px] text-[13px] leading-[18px] font-medium text-brand hover:bg-brand-soft"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex shrink-0 flex-wrap items-center gap-[8px] rounded-[10px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
              <div className="relative w-[240px]">
                <Search
                  size={15}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-[11px] -translate-y-1/2 text-pg-faint"
                />
                <TextInput
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by document ID"
                  aria-label="Search by document ID"
                  className="pl-[32px]"
                />
              </div>
              <UserPicker value={users} onChange={setUsers} />
              <Select
                aria-label="Module"
                className="w-[170px]"
                value={moduleFilter}
                onChange={setModuleFilter}
                options={[
                  { value: ALL, label: "All modules" },
                  ...AUDIT_MODULES.map((m) => ({ value: m, label: m })),
                ]}
              />
              <Select
                aria-label="Action"
                className="w-[160px]"
                value={action}
                onChange={(v) => {
                  setAction(v);
                  setSelected(new Set());
                }}
                options={[
                  { value: ALL, label: "All actions" },
                  ...AUDIT_ACTIONS.map((a) => ({ value: a, label: a })),
                ]}
              />
              <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo} />
              {filtered ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="motion-tap ml-auto rounded-[6px] px-[8px] py-[6px] text-[13px] leading-[18px] font-medium text-brand hover:bg-brand-soft"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          )}

          {(() => {
            const table = (
              <TableCard pager={pager}>
                {selecting ? (
                  <div className="flex h-[48px] items-center justify-between gap-[12px] px-[16px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
                    <span className="text-[13px] leading-[18px] text-pg-muted">
                      {liveSelected.length > 0
                        ? `${liveSelected.length} selected`
                        : "Select deleted records to restore them."}
                    </span>
                    <PrimaryButton
                      disabled={liveSelected.length === 0}
                      onClick={() => setConfirming(liveSelected)}
                      className="disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
                    >
                      <RotateCcw size={15} aria-hidden="true" />
                      {liveSelected.length > 1 ? `Restore (${liveSelected.length})` : "Restore"}
                    </PrimaryButton>
                  </div>
                ) : null}

                {rows.length === 0 ? (
                  <div className="flex h-[240px] flex-col items-center justify-center gap-[4px] px-[16px] text-center">
                    <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                      No activity matches these filters
                    </p>
                    <p className="text-[13px] leading-[18px] text-pg-muted">
                      Try a wider date range or clear the filters.
                    </p>
                  </div>
                ) : (
                  <div className="min-w-[860px]">
                    <div
                      style={{ gridTemplateColumns: cols }}
                      className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
                    >
                      {selecting ? (
                        <Checkbox
                          checked={allOnPage}
                          mixed={!allOnPage && onPage > 0}
                          disabled={pageIds.length === 0}
                          onChange={togglePage}
                        />
                      ) : null}
                      {shownCols.map((c) => (
                        <span key={c.id} className={HEAD}>
                          {c.label}
                        </span>
                      ))}
                      <span />
                    </div>

                    {pager.pageRows.map((r) => (
                      <Row
                        key={r.id}
                        entry={r}
                        cols={cols}
                        hidden={hidden}
                        selecting={selecting}
                        canSelect={restorable(r)}
                        checked={selected.has(r.id)}
                        active={r.id === openId}
                        onToggle={(on) => toggle(r.id, on)}
                        onOpen={() => setOpenId(r.id)}
                      />
                    ))}
                  </div>
                )}
              </TableCard>
            );
            return shared ? <ListToolbar model={model}>{table}</ListToolbar> : table;
          })()}
        </>
      )}

      {open ? (
        <EntryDrawer
          entry={open}
          restoredBy={
            restored.has(open.id)
              ? entries.find((e) => e.id === restored.get(open.id)) ?? null
              : null
          }
          onClose={() => setOpenId(null)}
          onRestore={() => setConfirming([open.id])}
        />
      ) : null}

      {confirming ? (
        <ConfirmRestore
          targets={entries.filter((e) => confirming.includes(e.id))}
          onClose={() => setConfirming(null)}
          onConfirm={() => restore(confirming)}
        />
      ) : null}
    </div>
  );
}

function Row({
  entry,
  cols,
  hidden,
  selecting,
  canSelect,
  checked,
  active,
  onToggle,
  onOpen,
}: {
  entry: AuditEntry;
  cols: string;
  /** Column ids switched off from the shared toolbar. */
  hidden?: ReadonlySet<string>;
  selecting: boolean;
  canSelect: boolean;
  checked: boolean;
  active: boolean;
  onToggle: (on: boolean) => void;
  onOpen: () => void;
}) {
  const ModuleIcon = MODULE_ICON[entry.module];
  const { date, time } = formatAt(entry.at);
  return (
    <div
      style={{ gridTemplateColumns: cols }}
      className={cn(
        "grid h-[56px] items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0",
        checked || active ? "bg-pg-row-selected" : "hover:bg-pg",
      )}
    >
      {selecting ? (
        <Checkbox checked={checked && canSelect} disabled={!canSelect} onChange={onToggle} />
      ) : null}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
          {entry.name}
        </span>
        <span className="truncate font-mono text-[12px] leading-[16px] text-pg-muted">
          {entry.docId}
        </span>
      </span>
      {hidden?.has("module") ? null : (
        <span className="flex min-w-0 items-center gap-[8px] text-[14px] leading-[20px] text-pg-text">
          <ModuleIcon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
          <span className="truncate">{entry.module}</span>
        </span>
      )}
      {hidden?.has("action") ? null : (
        <span>
          <ActionTag action={entry.action} />
        </span>
      )}
      {hidden?.has("by") ? null : <DoneBy by={entry.by} />}
      {hidden?.has("at") ? null : (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[14px] leading-[20px] text-pg-text">{date}</span>
          <span className="truncate text-[12px] leading-[16px] text-pg-muted">at {time}</span>
        </span>
      )}
      <button
        type="button"
        onClick={onOpen}
        aria-label={`View details for ${entry.name}`}
        title="View details"
        className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-brand"
      >
        <Eye size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function ActionTag({ action }: { action: AuditEntry["action"] }) {
  const { tone, icon: Icon } = ACTION_STYLE[action];
  return (
    <StatusTag tone={tone}>
      <Icon size={12} aria-hidden="true" />
      {action}
    </StatusTag>
  );
}

function DoneBy({ by }: { by: AuditEntry["by"] }) {
  return (
    <span className="flex min-w-0 items-center gap-[10px]">
      <ToneAvatar name={by.name} initials={by.initials} tone={toneFor(by.name)} size={28} round />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[14px] leading-[20px] text-pg-text-strong">{by.name}</span>
        <span className="truncate text-[12px] leading-[16px] text-pg-muted">via {by.via}</span>
      </span>
    </span>
  );
}

/** "Select users" — a multi-select, which the shared Select is not. */
function UserPicker({
  value,
  onChange,
}: {
  value: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  const label =
    value.size === 0
      ? "Select users"
      : value.size === 1
        ? [...value][0]
        : `${value.size} users`;

  return (
    <div className="relative w-[190px]">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select users"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "motion-tap flex h-[36px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", value.size ? "text-pg-text" : "text-pg-faint")}>
          {label}
        </span>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close options"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default"
          />
          <div
            role="listbox"
            aria-multiselectable="true"
            className="absolute top-[calc(100%+4px)] left-0 z-[61] flex w-[240px] flex-col overflow-hidden rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {AUDIT_USERS.map((u) => {
              const on = value.has(u.name);
              return (
                <div
                  key={u.name}
                  role="option"
                  aria-selected={on}
                  className="flex items-center rounded-[6px] px-[10px] py-[6px] hover:bg-pg"
                >
                  <Checkbox
                    checked={on}
                    className="w-full"
                    onChange={(next) => {
                      const s = new Set(value);
                      if (next) s.add(u.name);
                      else s.delete(u.name);
                      onChange(s);
                    }}
                    label={
                      <span className="flex items-center gap-[8px]">
                        <ToneAvatar name={u.name} initials={u.initials} tone={u.tone} size={22} round />
                        {u.name}
                      </span>
                    }
                  />
                </div>
              );
            })}
            {value.size > 0 ? (
              <button
                type="button"
                onClick={() => onChange(new Set())}
                className="motion-tap mt-[4px] rounded-[6px] border-t border-pg-head-border px-[10px] pt-[8px] pb-[6px] text-left text-[13px] leading-[18px] font-medium text-brand hover:bg-pg"
              >
                Clear selection
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function DateRange({
  from,
  to,
  onFrom,
  onTo,
}: {
  from: string;
  to: string;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
}) {
  const { effective } = useTheme();
  const style = { colorScheme: effective.appTheme === "dark" ? "dark" : "light" } as const;
  return (
    <div className="flex items-center gap-[6px]">
      <TextInput
        type="date"
        aria-label="From date"
        value={from}
        max={to || undefined}
        onChange={(e) => onFrom(e.target.value)}
        style={style}
        className="w-[150px]"
      />
      <span aria-hidden="true" className="text-[13px] text-pg-muted">
        –
      </span>
      <TextInput
        type="date"
        aria-label="To date"
        value={to}
        min={from || undefined}
        onChange={(e) => onTo(e.target.value)}
        style={style}
        className="w-[150px]"
      />
    </div>
  );
}

function EntryDrawer({
  entry,
  restoredBy,
  onClose,
  onRestore,
}: {
  entry: AuditEntry;
  restoredBy: AuditEntry | null;
  onClose: () => void;
  onRestore: () => void;
}) {
  const { date, time } = formatAt(entry.at);
  const ModuleIcon = MODULE_ICON[entry.module];
  const deleted = entry.action === "Deleted";
  const noun = MODULE_NOUN[entry.module][0];

  const meta: [string, React.ReactNode][] = [
    ["Document ID", <span key="d" className="font-mono text-[13px]">{entry.docId}</span>],
    [
      "Module",
      <span key="m" className="flex items-center gap-[6px]">
        <ModuleIcon size={14} aria-hidden="true" className="text-pg-muted" />
        {entry.module}
      </span>,
    ],
    ["Action", <ActionTag key="a" action={entry.action} />],
    ["Done by", <DoneBy key="b" by={entry.by} />],
    ["Date and time", `${date} at ${time}`],
  ];

  return (
    <SideDrawer
      width={420}
      title={entry.name}
      subtitle={`${entry.module} · ${entry.action.toLowerCase()}`}
      onClose={onClose}
      footer={
        deleted ? (
          restoredBy ? (
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Restored by {restoredBy.by.name} on {formatAt(restoredBy.at).date}.
            </span>
          ) : (
            <div className="flex flex-1 justify-end gap-[12px]">
              <OutlineButton onClick={onClose}>Close</OutlineButton>
              <PrimaryButton onClick={onRestore}>
                <RotateCcw size={15} aria-hidden="true" />
                Restore
              </PrimaryButton>
            </div>
          )
        ) : undefined
      }
    >
      <dl className="flex flex-col py-[8px]">
        {meta.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[120px_1fr] items-center gap-[12px] border-b border-pg-row-border py-[10px] last:border-b-0"
          >
            <dt className="text-[13px] leading-[18px] text-pg-muted">{k}</dt>
            <dd className="min-w-0 text-[14px] leading-[20px] text-pg-text-strong">{v}</dd>
          </div>
        ))}
      </dl>

      {entry.changes && entry.changes.length > 0 ? (
        <section className="flex flex-col gap-[8px] pt-[8px] pb-[16px]">
          <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">Changes</h3>
          <div className="overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            <div className="grid h-[34px] grid-cols-[1fr_1.2fr_1.2fr] items-center gap-[12px] border-b border-pg-head-border bg-pg px-[12px]">
              <span className={HEAD}>Field</span>
              <span className={HEAD}>Before</span>
              <span className={HEAD}>After</span>
            </div>
            {entry.changes.map((c) => (
              <div
                key={c.field}
                className="grid grid-cols-[1fr_1.2fr_1.2fr] items-start gap-[12px] border-b border-pg-row-border px-[12px] py-[9px] last:border-b-0"
              >
                <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">{c.field}</span>
                <span className="text-[13px] leading-[18px] break-words text-pg-muted line-through">
                  {c.from}
                </span>
                <span className="text-[13px] leading-[18px] break-words text-pg-text-strong">{c.to}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {deleted && !restoredBy ? (
        <p className="pb-[16px] text-[13px] leading-[18px] text-pg-muted">
          This {noun} is in the trash. Restore it to bring it back with its notes, tasks, and history.
        </p>
      ) : null}
    </SideDrawer>
  );
}

function ConfirmRestore({
  targets,
  onClose,
  onConfirm,
}: {
  targets: AuditEntry[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const n = targets.length;
  const noun = nounFor(targets);
  const shown = targets.slice(0, 5);
  return (
    <Modal
      width={480}
      onClose={onClose}
      title={
        <span className="flex items-center gap-[10px]">
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <RotateCcw size={16} aria-hidden="true" />
          </span>
          {n === 1 ? `Restore this ${noun}?` : `Restore ${n} ${noun}?`}
        </span>
      }
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={onConfirm}>{n === 1 ? "Restore" : `Restore ${n}`}</PrimaryButton>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        {n === 1
          ? `${targets[0].name} goes back where it was, and the restore is added to the audit log.`
          : `These ${noun} go back where they were, and each restore is added to the audit log.`}
      </p>
      {n > 1 ? (
        <ul className="flex flex-col gap-[2px] rounded-[8px] bg-pg px-[12px] py-[8px]">
          {shown.map((t) => (
            <li key={t.id} className="truncate text-[13px] leading-[20px] text-pg-text-strong">
              {t.name}
            </li>
          ))}
          {n > shown.length ? (
            <li className="text-[13px] leading-[20px] text-pg-muted">and {n - shown.length} more</li>
          ) : null}
        </ul>
      ) : null}
    </Modal>
  );
}

function ExportsTable({ jobs }: { jobs: ExportJob[] }) {
  return (
    <TableCard>
      <div className="min-w-[720px]">
        <div
          style={{ gridTemplateColumns: EXPORT_COLS }}
          className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
        >
          <span className={HEAD}>File</span>
          <span className={HEAD}>Requested by</span>
          <span className={HEAD}>Date</span>
          <span className={HEAD}>Status</span>
          <span className={cn(HEAD, "text-right")}>Download</span>
        </div>
        {jobs.map((j) => {
          const { date, time } = formatAt(j.at);
          return (
            <div
              key={j.id}
              style={{ gridTemplateColumns: EXPORT_COLS }}
              className="grid h-[52px] items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0 hover:bg-pg"
            >
              <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">{j.file}</span>
              <span className="flex min-w-0 items-center gap-[8px]">
                <ToneAvatar name={j.requestedBy} tone={toneFor(j.requestedBy)} size={24} round />
                <span className="truncate text-[14px] leading-[20px] text-pg-text">{j.requestedBy}</span>
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[14px] leading-[20px] text-pg-text">{date}</span>
                <span className="truncate text-[12px] leading-[16px] text-pg-muted">at {time}</span>
              </span>
              <span>
                <StatusTag
                  tone={j.status === "Completed" ? "success" : j.status === "Failed" ? "danger" : "warning"}
                >
                  {j.status}
                </StatusTag>
              </span>
              <span className="flex justify-end">
                <button
                  type="button"
                  disabled={j.status !== "Completed"}
                  onClick={() => showToast(`Downloading ${j.file}`)}
                  aria-label={`Download ${j.file}`}
                  title={j.status === "Completed" ? "Download" : "Not ready"}
                  className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-brand disabled:cursor-not-allowed disabled:text-pg-disabled disabled:hover:bg-transparent"
                >
                  <Download size={15} aria-hidden="true" />
                </button>
              </span>
            </div>
          );
        })}
      </div>
    </TableCard>
  );
}
