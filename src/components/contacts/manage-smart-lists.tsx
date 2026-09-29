"use client";

import * as React from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Copy,
  Globe,
  GripVertical,
  Info,
  Pencil,
  Search,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { Checkbox, InfoCallout, TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { TableCard, usePagination } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  deleteList,
  duplicateList,
  isManageable,
  moveList,
  renameList,
  shareList,
  useSmartLists,
  type ManagedList,
} from "./smart-lists-store";

type TypeFilter = "all" | "global" | "private";

const TYPE_LABEL: Record<TypeFilter, string> = {
  all: "All",
  global: "Global",
  private: "Private",
};

const COLS = "28px 56px minmax(0,1fr) 160px";
const HEAD = "text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted";

/** The account's users, as the live Share modal lists them. */
const USERS = [
  "Aayush Singhal", "Aayushi Somani", "Abhilasha Rathore", "Abhishek Chauhan",
  "Aditi Sharma", "Aditya Rao", "Ajay Menon", "Akash Verma", "Amrita Nair",
  "Ananya Iyer", "Ankit Jain", "Arjun Pillai", "Ashwin K S", "Chetan Dhole",
  "Deepak Reddy", "Divya Krishnan", "Emma Jackson", "Gaurav Mehta",
  "Harsha Vardhan", "Karthik Subramanian", "Koushik K", "Maruthi L",
  "Mayur Patil", "Meghana M", "Neha Gupta", "Nikhil Satish", "Pooja Hegde",
  "Pratik Zinjurde", "Rahul Desai", "Ronak Jindal", "Ryan Howell", "Sneha Kulkarni",
  "Sugandha", "Umar Ranginwala", "Vishnupriya Poduval",
].map((name) => `${name} (Admin)`);

type Dialog = { kind: "share" | "edit" | "delete"; list: ManagedList } | null;

/**
 * Manage smart lists — the Contacts area page for reordering, sharing,
 * renaming and deleting saved lists. Every change goes to smart-lists-store,
 * so the contacts tab strip follows without a refresh.
 */
export function ManageSmartListsPage({ onBack }: { onBack: () => void }) {
  const all = useSmartLists();
  const manageable = React.useMemo(() => all.filter(isManageable), [all]);
  const [type, setType] = React.useState<TypeFilter>("all");
  const [query, setQuery] = React.useState("");
  const [dialog, setDialog] = React.useState<Dialog>(null);

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return manageable.filter(
      (l) =>
        (type === "all" || (type === "global") === l.global) &&
        (!q || l.label.toLowerCase().includes(q)),
    );
  }, [manageable, type, query]);
  const pager = usePagination(rows);

  // Indices are into the full manageable order, not the filtered view, so a
  // drag inside a filtered list still lands where it looks like it lands.
  const indexOf = (id: string) => manageable.findIndex((l) => l.id === id);

  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);

  const moveBy = (id: string, delta: number) => {
    const to = indexOf(id) + delta;
    if (to < 0 || to >= manageable.length) return;
    moveList(id, to);
    // The row's DOM node is moved on re-render, which can drop focus; put it
    // back so a held arrow key keeps walking the same list.
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>(`[data-drag-handle="${id}"]`)?.focus(),
    );
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <div className="flex shrink-0 items-center gap-[8px]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-pg-text-strong hover:bg-pg-surface hover:shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <h1 className="truncate text-[20px] leading-[normal] font-semibold tracking-[-0.2px] text-pg-heading">
          Manage smart lists
        </h1>
      </div>

      <TableCard pager={pager}>
        <div className="flex h-[54px] items-center justify-between gap-[12px] px-[16px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
          <TypeChip value={type} onChange={setType} />
          <label className="relative w-[260px] shrink-0">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-pg-faint"
            />
            <TextInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search smart list"
              aria-label="Search smart list"
              className="pl-[34px]"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <div className="flex h-[200px] flex-col items-center justify-center gap-[4px]">
            <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">
              No smart lists found
            </p>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              Try a different name or type.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{ gridTemplateColumns: COLS }}
              className="sticky top-0 z-10 grid h-[38px] items-center gap-[12px] border-b border-pg-head-border bg-pg-surface px-[16px]"
            >
              <span />
              <span className={HEAD}>Type</span>
              <span className={HEAD}>Smart list name</span>
              <span className={cn(HEAD, "text-right")}>Actions</span>
            </div>

            {pager.pageRows.map((l) => (
              <div
                key={l.id}
                style={{ gridTemplateColumns: COLS }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (overId !== l.id) setOverId(l.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId && dragId !== l.id) moveList(dragId, indexOf(l.id));
                  setDragId(null);
                  setOverId(null);
                }}
                className={cn(
                  "grid h-[52px] items-center gap-[12px] border-b border-pg-row-border px-[16px] last:border-b-0 hover:bg-pg",
                  dragId === l.id && "opacity-40",
                  overId === l.id &&
                    dragId !== l.id &&
                    "shadow-[inset_0_2px_0_0_var(--brand)]",
                )}
              >
                <span
                  role="button"
                  tabIndex={0}
                  draggable
                  data-drag-handle={l.id}
                  aria-label={`Reorder ${l.label}. Use the arrow keys to move it.`}
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", l.id);
                    setDragId(l.id);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                      e.preventDefault();
                      moveBy(l.id, e.key === "ArrowUp" ? -1 : 1);
                    }
                  }}
                  className="flex size-[24px] cursor-grab items-center justify-center rounded-[6px] text-pg-faint hover:text-pg-text-strong focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none active:cursor-grabbing"
                >
                  <GripVertical size={16} aria-hidden="true" />
                </span>
                <span className="flex items-center">
                  {l.global ? (
                    <span title="Global list" className="flex text-pg-muted">
                      <Globe size={16} aria-label="Global list" />
                    </span>
                  ) : null}
                </span>
                <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
                  {l.label}
                </span>
                <span className="flex items-center justify-end gap-[4px]">
                  <IconAction
                    label="Duplicate"
                    icon={Copy}
                    onClick={() => {
                      duplicateList(l.id);
                      showToast("Smart list duplicated.");
                    }}
                  />
                  <IconAction label="Share" icon={Share2} onClick={() => setDialog({ kind: "share", list: l })} />
                  <IconAction label="Edit" icon={Pencil} onClick={() => setDialog({ kind: "edit", list: l })} />
                  <IconAction label="Delete" icon={Trash2} danger onClick={() => setDialog({ kind: "delete", list: l })} />
                </span>
              </div>
            ))}
          </>
        )}
      </TableCard>

      {dialog?.kind === "share" ? (
        <ShareModal list={dialog.list} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "edit" ? (
        <EditModal list={dialog.list} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "delete" ? (
        <DeleteModal list={dialog.list} onClose={() => setDialog(null)} />
      ) : null}
    </div>
  );
}

function IconAction({
  label,
  icon: Icon,
  onClick,
  danger,
}: {
  label: string;
  icon: typeof Copy;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "motion-tap flex size-[30px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-surface hover:shadow-[inset_0_0_0_1px_var(--pg-border)]",
        danger ? "hover:text-pg-danger" : "hover:text-pg-text-strong",
      )}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}

/** "Type  All  ×" — a filter chip with its own three-item menu. */
function TypeChip({
  value,
  onChange,
}: {
  value: TypeFilter;
  onChange: (v: TypeFilter) => void;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <div className="flex h-[32px] items-center rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="motion-tap flex h-full items-center gap-[6px] pr-[6px] pl-[10px] text-[13px] leading-[18px]"
        >
          <span className="text-pg-muted">Type</span>
          <span className="font-medium text-pg-text-strong">{TYPE_LABEL[value]}</span>
          <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
        </button>
        <button
          type="button"
          aria-label="Clear type filter"
          onClick={() => {
            onChange("all");
            setOpen(false);
          }}
          className="motion-tap mr-[4px] flex size-[22px] items-center justify-center rounded-[4px] text-pg-faint hover:bg-pg hover:text-pg-text-strong"
        >
          <X size={13} aria-hidden="true" />
        </button>
      </div>
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
            className="absolute top-[calc(100%+4px)] left-0 z-[61] w-[180px] rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {(Object.keys(TYPE_LABEL) as TypeFilter[]).map((t) => (
              <button
                key={t}
                type="button"
                role="option"
                aria-selected={t === value}
                onClick={() => {
                  onChange(t);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
              >
                <span
                  className={cn(
                    "flex-1 text-[14px] leading-[20px]",
                    t === value ? "font-medium text-pg-heading" : "text-pg-text",
                  )}
                >
                  {TYPE_LABEL[t]}
                </span>
                {t === value ? (
                  <Check size={14} aria-hidden="true" className="text-brand" />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function TitleRow({
  icon,
  tone = "brand",
  children,
}: {
  icon: React.ReactNode;
  tone?: "brand" | "danger";
  children: React.ReactNode;
}) {
  return (
    <span className="flex items-center gap-[10px]">
      <span
        className={cn(
          "flex size-[32px] shrink-0 items-center justify-center rounded-full",
          tone === "brand"
            ? "bg-brand-soft text-brand"
            : "bg-[color-mix(in_oklab,var(--pg-danger)_12%,transparent)] text-pg-danger",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 break-words">{children}</span>
    </span>
  );
}

/** Footer with the divider the live modals draw above their buttons. */
function Footer({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-[16px] flex flex-1 justify-end gap-[12px] border-t border-pg-head-border px-[16px] pt-[16px]">
      {children}
    </div>
  );
}

const DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100";

function ShareModal({ list, onClose }: { list: ManagedList; onClose: () => void }) {
  const [global, setGlobal] = React.useState(list.global);
  const [shared, setShared] = React.useState<Set<string>>(() => new Set(list.sharedWith));

  const toggle = (user: string, on: boolean) =>
    setShared((prev) => {
      const next = new Set(prev);
      if (on) next.add(user);
      else next.delete(user);
      return next;
    });

  const line = (text: string) => (
    <span className="flex items-center gap-[8px]">
      <Info size={14} aria-hidden="true" className="shrink-0" />
      {text}
    </span>
  );

  return (
    <Modal
      width={620}
      onClose={onClose}
      bodyClassName="max-h-[60vh] gap-[12px]"
      title={<TitleRow icon={<Info size={16} aria-hidden="true" />}>Share &ldquo;{list.label}&rdquo; with</TitleRow>}
      footer={
        <Footer>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton
            onClick={() => {
              shareList(list.id, global, global ? [] : USERS.filter((u) => shared.has(u)));
              showToast("Sharing updated.");
              onClose();
            }}
          >
            Save
          </PrimaryButton>
        </Footer>
      }
    >
      <InfoCallout>
        <span className="flex flex-col gap-[4px]">
          {line("Global lists are shared with all users")}
          {line("Only admins can change global list settings")}
          {line("Only admins can modify filters for global lists")}
        </span>
      </InfoCallout>
      <Checkbox checked={global} onChange={setGlobal} label="Share with all users" />
      <div className="h-px shrink-0 bg-pg-head-border" />
      <div className="flex flex-col gap-[12px]">
        {USERS.map((u) => (
          <Checkbox
            key={u}
            checked={global || shared.has(u)}
            disabled={global}
            onChange={(on) => toggle(u, on)}
            label={u}
          />
        ))}
      </div>
    </Modal>
  );
}

function EditModal({ list, onClose }: { list: ManagedList; onClose: () => void }) {
  const [name, setName] = React.useState(list.label);
  const trimmed = name.trim();
  const canSave = trimmed !== "" && trimmed !== list.label;

  const save = () => {
    if (!canSave) return;
    renameList(list.id, trimmed);
    showToast("Smart list renamed.");
    onClose();
  };

  return (
    <Modal
      width={620}
      onClose={onClose}
      title={<TitleRow icon={<Info size={16} aria-hidden="true" />}>Edit smart list &ldquo;{list.label}&rdquo;</TitleRow>}
      footer={
        <Footer>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton disabled={!canSave} onClick={save} className={DISABLED}>
            Save
          </PrimaryButton>
        </Footer>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
        className="flex flex-col gap-[4px]"
      >
        <label htmlFor="smart-list-name" className="text-[14px] leading-[20px] font-medium text-pg-text-strong">
          Smart list name
        </label>
        <TextInput
          id="smart-list-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </form>
    </Modal>
  );
}

function DeleteModal({ list, onClose }: { list: ManagedList; onClose: () => void }) {
  return (
    <Modal
      width={620}
      onClose={onClose}
      title={
        <TitleRow tone="danger" icon={<Trash2 size={16} aria-hidden="true" />}>
          Delete smart list &ldquo;{list.label}&rdquo;?
        </TitleRow>
      }
      footer={
        <Footer>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <button
            type="button"
            onClick={() => {
              deleteList(list.id);
              showToast("Smart list deleted.");
              onClose();
            }}
            className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-danger px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-white hover:brightness-110 active:scale-[0.97]"
          >
            Delete
          </button>
        </Footer>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        Are you sure you want to delete &ldquo;{list.label}&rdquo;? This action can&rsquo;t be undone.
      </p>
    </Modal>
  );
}
