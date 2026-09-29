"use client";

import * as React from "react";
import { Info, RefreshCw } from "lucide-react";
import { ToneAvatar } from "@/components/page/avatar";
import { Checkbox, InfoCallout } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { TableCard, usePagination } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import type { Contact } from "./contacts-data";
import {
  formatDeletedOn,
  takeDeleted,
  useDeletedContacts,
  type DeletedContact,
} from "./deleted-contacts";

const COLS = "20px 1.6fr 1.6fr 1.1fr 1.3fr 32px";
const HEAD = "text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted";

const plural = (n: number) => (n === 1 ? "contact" : "contacts");

/**
 * Restore contacts — the trash, as a sub-screen of Contacts.
 *
 * A record-style crumb rather than a route: the trail is the way back, so the
 * page draws no back button of its own.
 */
export function RestoreContactsPage({
  onExit,
  onRestored,
}: {
  onExit: () => void;
  onRestored: (contacts: Contact[]) => void;
}) {
  useRecordCrumb({ name: "Restore contacts", kind: "Restore contacts" }, onExit);

  const rows = useDeletedContacts();
  const pager = usePagination(rows);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  // The ids the confirm modal is about — a row's own icon restores just that
  // row, without disturbing whatever else is ticked.
  const [confirming, setConfirming] = React.useState<string[] | null>(null);

  const pageIds = pager.pageRows.map((r) => r.id);
  const onPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPage = pageIds.length > 0 && onPage === pageIds.length;

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

  const confirm = () => {
    if (!confirming) return;
    const restored = takeDeleted(confirming);
    onRestored(restored);
    setSelected((prev) => {
      const next = new Set(prev);
      confirming.forEach((id) => next.delete(id));
      return next;
    });
    setConfirming(null);
    showToast(`${restored.length} ${plural(restored.length)} restored.`);
  };

  const count = selected.size;

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <PageHeader title="Restore contacts" description="Restore contacts that have been deleted." />

      <TableCard pager={pager}>
        <div className="flex h-[54px] items-center justify-end px-[16px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
          <PrimaryButton
            disabled={count === 0}
            onClick={() => setConfirming([...selected])}
            className="disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
          >
            <RefreshCw size={15} aria-hidden="true" />
            {count > 1 ? `Restore (${count})` : "Restore"}
          </PrimaryButton>
        </div>

        {rows.length === 0 ? (
          <div className="flex h-[240px] flex-col items-center justify-center gap-[4px]">
            <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">
              No deleted contacts
            </p>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              Contacts you delete show up here for 60 days.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{ gridTemplateColumns: COLS }}
              className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
            >
              <Checkbox
                checked={allOnPage}
                mixed={!allOnPage && onPage > 0}
                onChange={togglePage}
              />
              <span className={HEAD}>Name</span>
              <span className={HEAD}>Email</span>
              <span className={HEAD}>Phone</span>
              <span className={HEAD}>Deleted on</span>
              <span className="flex justify-center text-pg-faint">
                <RefreshCw size={14} aria-hidden="true" />
              </span>
            </div>

            {pager.pageRows.map((r) => (
              <Row
                key={r.id}
                row={r}
                checked={selected.has(r.id)}
                onToggle={(on) => toggle(r.id, on)}
                onRestore={() => setConfirming([r.id])}
              />
            ))}
          </>
        )}
      </TableCard>

      {confirming ? (
        <ConfirmRestore
          people={rows.filter((r) => confirming.includes(r.id))}
          onClose={() => setConfirming(null)}
          onConfirm={confirm}
        />
      ) : null}
    </div>
  );
}

function Row({
  row,
  checked,
  onToggle,
  onRestore,
}: {
  row: DeletedContact;
  checked: boolean;
  onToggle: (on: boolean) => void;
  onRestore: () => void;
}) {
  return (
    <div
      style={{ gridTemplateColumns: COLS }}
      className={cn(
        "grid h-[52px] items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0",
        checked ? "bg-pg-row-selected" : "hover:bg-pg",
      )}
    >
      <Checkbox checked={checked} onChange={onToggle} />
      <span className="flex min-w-0 items-center gap-[10px]">
        <ToneAvatar name={row.name} tone={row.tone} size={28} round />
        <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
          {row.name}
        </span>
      </span>
      <Cell value={row.email} />
      <Cell value={row.phone} />
      <span className="truncate text-[14px] leading-[20px] text-pg-text">
        {formatDeletedOn(row.deletedOn)}
      </span>
      <button
        type="button"
        onClick={onRestore}
        aria-label={`Restore ${row.name}`}
        title="Restore"
        className="motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-brand"
      >
        <RefreshCw size={15} aria-hidden="true" />
      </button>
    </div>
  );
}

function Cell({ value }: { value: string | null }) {
  return (
    <span
      className={cn(
        "truncate text-[14px] leading-[20px]",
        value ? "text-pg-text" : "text-pg-faint",
      )}
    >
      {value ?? "–"}
    </span>
  );
}

function ConfirmRestore({
  people,
  onClose,
  onConfirm,
}: {
  people: DeletedContact[];
  onClose: () => void;
  onConfirm: () => void;
}) {
  const n = people.length;
  const shown = people.slice(0, 5);
  const more = n - shown.length;

  return (
    <Modal
      width={520}
      onClose={onClose}
      title={
        <span className="flex items-center gap-[10px]">
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <RefreshCw size={16} aria-hidden="true" />
          </span>
          Restore contacts
        </span>
      }
      footer={
        <div className="-mx-[16px] flex flex-1 justify-end gap-[12px] border-t border-pg-head-border px-[16px] pt-[16px]">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={onConfirm}>Confirm</PrimaryButton>
        </div>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        You&rsquo;re about to restore {n} {plural(n)}. Select Confirm to restore{" "}
        {n === 1 ? "it" : "them"}.
      </p>

      <div className="flex items-center py-[4px] pl-[6px]">
        {shown.map((p) => (
          <span
            key={p.id}
            title={p.name}
            className="-ml-[6px] rounded-full shadow-[0_0_0_2px_var(--pg-surface)]"
          >
            <ToneAvatar name={p.name} tone={p.tone} size={32} round />
          </span>
        ))}
        {more > 0 ? (
          <span className="-ml-[6px] flex h-[32px] min-w-[32px] items-center justify-center rounded-full bg-pg px-[8px] text-[12px] leading-none font-semibold text-pg-muted shadow-[0_0_0_2px_var(--pg-surface),inset_0_0_0_1px_var(--pg-border)]">
            +{more}
          </span>
        ) : null}
      </div>

      <InfoCallout icon={<Info size={16} aria-hidden="true" />}>
        <span className="font-semibold">Note:</span> Restoring a contact also
        restores its conversations, notes, opportunities, documents, tasks,
        appointments, and manual actions.
      </InfoCallout>
    </Modal>
  );
}
