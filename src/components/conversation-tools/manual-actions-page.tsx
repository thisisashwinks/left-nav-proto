"use client";

import * as React from "react";
import { CircleX, MessageSquare, Phone, Play, Trash2 } from "lucide-react";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { Checkbox } from "@/components/page/form-controls";
import { ToneAvatar } from "@/components/page/avatar";
import { Modal } from "@/components/page/modal";
import { Toaster, showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  SEED_ACTIONS,
  SOURCE_LABEL,
  TYPE_LABEL,
  formatStamp,
  isPending,
  type ManualAction,
  type ManualActionSource,
  type ManualActionStatus,
} from "./manual-actions-data";
import { FilterSelect } from "./manual-actions-filter-select";
import { QueueModal } from "./manual-actions-queue-modal";
import { StatusCell } from "./manual-actions-status";

const COLS = "40px minmax(160px,1.3fr) minmax(220px,2fr) minmax(160px,1.3fr) 90px 130px minmax(180px,1.3fr) 44px";
const PER_PAGE = 10;
const CANVAS =
  "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]";
const PAGER_BTN =
  "motion-tap flex h-[32px] items-center rounded-[6px] px-[12px] text-[13px] leading-[18px] font-medium shadow-[inset_0_0_0_1px_var(--pg-border)] disabled:cursor-not-allowed disabled:text-pg-disabled enabled:text-pg-text-strong enabled:hover:bg-pg";

/**
 * Conversations ▸ Manual actions.
 *
 * The queue of calls and texts workflows and campaigns have handed to a
 * person. Selecting rows turns the filter row into a bulk bar and locks the
 * per-row trash and "Let's start", so a bulk delete and a single one can
 * never be in flight at once.
 */
export function ManualActionsPage() {
  const [actions, setActions] = React.useState<ManualAction[]>(SEED_ACTIONS);
  const [source, setSource] = React.useState<ManualActionSource>("workflow");
  const [workflow, setWorkflow] = React.useState<string | null>(null);
  const [assignee, setAssignee] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [page, setPage] = React.useState(1);
  const [pendingDelete, setPendingDelete] = React.useState<string[] | null>(null);
  const [queue, setQueue] = React.useState<string[] | null>(null);

  const bySource = actions.filter((a) => a.source === source);
  const workflowOptions = Array.from(new Set(bySource.map((a) => a.workflow)))
    .sort()
    .map((w) => ({ value: w, label: w }));
  const people = new Map(actions.map((a) => [a.assignee.name, a.assignee]));
  const assigneeOptions = Array.from(people.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({
      value: p.name,
      label: p.name,
      leading: <ToneAvatar name={p.name} tone={p.tone} size={20} round />,
    }));

  const rows = bySource
    .filter((a) => (workflow == null || a.workflow === workflow) && (assignee == null || a.assignee.name === assignee))
    .sort((a, b) => b.added - a.added);

  const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const anySelected = selected.size > 0;
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const resetView = () => {
    setSelected(new Set());
    setPage(1);
  };

  const toggle = (id: string, on: boolean) =>
    setSelected((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const ids = new Set(pendingDelete);
    setActions((list) => list.filter((a) => !ids.has(a.id)));
    setSelected((s) => new Set([...s].filter((id) => !ids.has(id))));
    showToast(ids.size === 1 ? "Manual action deleted." : `${ids.size} manual actions deleted.`);
    setPendingDelete(null);
  };

  const updateStatus = React.useCallback((id: string, status: ManualActionStatus) => {
    setActions((list) => list.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  const start = () => {
    const pending = rows
      .filter(isPending)
      .sort((a, b) => Number(b.status === "in_progress") - Number(a.status === "in_progress") || a.added - b.added);
    setQueue(pending.map((a) => a.id));
  };

  const deleteCount = pendingDelete?.length ?? 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <PageHeader
        title="Manual actions"
        description="Tasks that need you to place a call or send an SMS to a contact yourself."
        aside={
          <PrimaryButton
            className="h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
            disabled={anySelected}
            onClick={start}
          >
            <Play size={16} aria-hidden="true" />
            Let&rsquo;s start
          </PrimaryButton>
        }
      />

      <section className={CANVAS}>
        <div className="flex shrink-0 flex-wrap items-center gap-[12px] border-b border-pg-head-border px-[16px] py-[12px]">
          <FilterSelect
            aria-label="Source"
            className="w-[200px]"
            placeholder="Workflows"
            value={source}
            options={(Object.keys(SOURCE_LABEL) as ManualActionSource[]).map((s) => ({
              value: s,
              label: SOURCE_LABEL[s],
            }))}
            onChange={(v) => {
              if (!v) return;
              setSource(v as ManualActionSource);
              setWorkflow(null);
              resetView();
            }}
          />
          <FilterSelect
            aria-label={source === "workflow" ? "Workflow" : "Campaign"}
            className="w-[220px]"
            searchable
            placeholder={source === "workflow" ? "Select workflow" : "Select campaign"}
            allLabel={source === "workflow" ? "All workflows" : "All campaigns"}
            value={workflow}
            options={workflowOptions}
            onChange={(v) => {
              setWorkflow(v);
              resetView();
            }}
          />
          <FilterSelect
            aria-label="Assignee"
            className="w-[220px]"
            searchable
            placeholder="Select assignee"
            allLabel="All assignees"
            value={assignee}
            options={assigneeOptions}
            onChange={(v) => {
              setAssignee(v);
              resetView();
            }}
          />

          {anySelected ? (
            <div className="flex items-center gap-[12px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">
                {selected.size} {selected.size === 1 ? "row" : "rows"} selected
              </span>
              {!allSelected ? (
                <button
                  type="button"
                  onClick={() => setSelected(new Set(rows.map((r) => r.id)))}
                  className="motion-tap text-[13px] leading-[18px] font-medium text-brand hover:underline"
                >
                  Select all ({rows.length})
                </button>
              ) : null}
              <button
                type="button"
                aria-label="Clear selection"
                onClick={() => setSelected(new Set())}
                className="motion-tap flex size-[24px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
              >
                <CircleX size={16} aria-hidden="true" />
              </button>
            </div>
          ) : null}

          <span className="flex-1" />

          {anySelected ? (
            <OutlineButton
              className="h-[36px] text-[14px] text-[var(--hr-error-600)] shadow-[inset_0_0_0_1px_var(--hr-error-300)] hover:bg-[var(--hr-error-50)] hover:shadow-[inset_0_0_0_1px_var(--hr-error-500)]"
              onClick={() => setPendingDelete([...selected])}
            >
              <Trash2 size={16} aria-hidden="true" />
              Delete {selected.size} {selected.size === 1 ? "manual action" : "manual actions"}
            </OutlineButton>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="min-w-[1100px]">
            <div
              style={{ gridTemplateColumns: COLS }}
              className="sticky top-0 z-10 grid h-[40px] items-center gap-[12px] border-b border-pg-head-border bg-pg-surface px-[16px]"
            >
              <Checkbox
                checked={allSelected}
                mixed={anySelected && !allSelected}
                disabled={rows.length === 0}
                onChange={() => setSelected(anySelected ? new Set() : new Set(rows.map((r) => r.id)))}
              />
              {["Contacts", "Campaign/workflow", "Assigned to", "Type", "Status", "Date added", ""].map((h, i) => (
                <span key={h || i} className="truncate text-[13px] leading-[18px] font-medium text-pg-muted">
                  {h}
                </span>
              ))}
            </div>

            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-[4px] px-[16px] py-[56px] text-center">
                <p className="text-[14px] leading-[20px] font-medium text-pg-heading">No manual actions</p>
                <p className="text-[13px] leading-[18px] text-pg-muted">
                  Nothing matches these filters. Try a different workflow or assignee.
                </p>
              </div>
            ) : null}

            {pageRows.map((a) => {
              const on = selected.has(a.id);
              return (
                <div
                  key={a.id}
                  style={{ gridTemplateColumns: COLS }}
                  className={cn(
                    "grid h-[48px] items-center gap-[12px] border-b border-pg-row-border px-[16px]",
                    on ? "bg-pg-row-selected" : "hover:bg-pg",
                  )}
                >
                  <Checkbox checked={on} onChange={(v) => toggle(a.id, v)} />
                  <span className="flex min-w-0 items-center gap-[8px]">
                    <ToneAvatar name={a.contact.name} tone={a.contact.tone} size={24} round />
                    <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
                      {a.contact.name}
                    </span>
                  </span>
                  <span title={a.workflow} className="truncate text-[14px] leading-[20px] text-pg-text">
                    {a.workflow}
                  </span>
                  <span className="flex min-w-0 items-center gap-[8px]">
                    <ToneAvatar name={a.assignee.name} tone={a.assignee.tone} size={24} round />
                    <span className="truncate text-[14px] leading-[20px] text-pg-text">{a.assignee.name}</span>
                  </span>
                  <span className="flex items-center gap-[6px] text-[14px] leading-[20px] text-pg-text">
                    {a.type === "call" ? (
                      <Phone size={14} aria-hidden="true" className="text-pg-muted" />
                    ) : (
                      <MessageSquare size={14} aria-hidden="true" className="text-pg-muted" />
                    )}
                    {TYPE_LABEL[a.type]}
                  </span>
                  <span>
                    <StatusCell status={a.status} />
                  </span>
                  <span className="truncate text-[14px] leading-[20px] text-pg-text">{formatStamp(a.added)}</span>
                  <span>
                    <button
                      type="button"
                      aria-label={`Delete manual action for ${a.contact.name}`}
                      disabled={anySelected}
                      onClick={() => setPendingDelete([a.id])}
                      className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted enabled:hover:bg-[var(--hr-error-50)] enabled:hover:text-[var(--hr-error-600)] disabled:cursor-not-allowed disabled:text-pg-disabled"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-[8px] border-t border-pg-head-border px-[16px] py-[10px]">
          <button type="button" className={PAGER_BTN} disabled={current <= 1} onClick={() => setPage(current - 1)}>
            Previous
          </button>
          <button
            type="button"
            className={PAGER_BTN}
            disabled={current >= pageCount}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </section>

      {pendingDelete ? (
        <Modal
          title={deleteCount === 1 ? "Delete this manual action?" : `Delete ${deleteCount} manual actions?`}
          width={440}
          onClose={() => setPendingDelete(null)}
          footer={
            <>
              <OutlineButton className="h-[36px] text-[14px]" onClick={() => setPendingDelete(null)}>
                Cancel
              </OutlineButton>
              <PrimaryButton className="h-[36px] bg-pg-danger text-[14px] hover:shadow-none" onClick={confirmDelete}>
                Delete
              </PrimaryButton>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            {deleteCount === 1
              ? "This permanently deletes the manual action. You can't undo this."
              : `This permanently deletes the ${deleteCount} manual actions. You can't undo this.`}
          </p>
        </Modal>
      ) : null}

      {queue ? (
        <QueueModal actions={actions} queue={queue} onUpdate={updateStatus} onClose={() => setQueue(null)} />
      ) : null}

      <Toaster />
    </div>
  );
}
