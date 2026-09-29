"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  FileUp,
  GripVertical,
  List,
  Lock,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Modal } from "@/components/page/modal";
import { SideDrawer } from "@/components/page/side-drawer";
import { Checkbox, TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { addJob, labelStamp } from "@/components/contacts/contacts-jobs";
import { cn } from "@/lib/utils";
import {
  COLUMN_DEFS,
  OPERATORS,
  addCompanies,
  columnDef,
  deleteList,
  needsValue,
  newCompanyId,
  newFilterId,
  saveList,
  type ColumnId,
  type ColumnState,
  type Company,
  type CompanyFilter,
  type CompanyList,
  type CompanySort,
} from "./companies-data";
import { Field, PopoverSelect, Scrim, SoftIcon, useEscapeLayer } from "./companies-ui";

const BTN = "h-[36px] text-[14px]";
const PRIMARY_DISABLED =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100";

/** Fields you can filter on. Created by is a person, not a value to type. */
const FILTERABLE = COLUMN_DEFS.filter((c) => c.id !== "createdBy");

/* ─── Filters ───────────────────────────────────────────────────────────── */

/**
 * Field / operator / value rows, AND'ed. Works on a draft, so the table does
 * not reflow while you type — nothing lands until Apply.
 */
export function CompanyFiltersDrawer({
  applied,
  onApply,
  onClose,
}: {
  applied: CompanyFilter[];
  onApply: (filters: CompanyFilter[]) => void;
  onClose: () => void;
}) {
  useEscapeLayer(onClose);
  const [draft, setDraft] = React.useState<CompanyFilter[]>(() =>
    applied.length
      ? applied.map((f) => ({ ...f }))
      : [{ id: newFilterId(), field: "name", operator: "Contains", value: "" }],
  );

  const patch = (id: string, p: Partial<CompanyFilter>) =>
    setDraft((d) => d.map((f) => (f.id === id ? { ...f, ...p } : f)));

  const apply = () => {
    onApply(
      draft.filter((f) => !needsValue(f.operator) || f.value.trim() !== ""),
    );
    onClose();
  };

  return (
    <>
      <Scrim onClose={onClose} />
      <SideDrawer
        width={520}
        onClose={onClose}
        title={<span className="text-[16px] leading-[22px] font-semibold text-pg-heading">Filters</span>}
        subtitle="Show companies that match all of these conditions"
        bodyClassName="px-[16px]"
        footer={
          <>
            <button
              type="button"
              disabled={draft.length === 0}
              onClick={() => setDraft([])}
              className="rounded-[6px] px-[4px] text-[14px] leading-[20px] font-medium text-pg-muted motion-tap hover:text-pg-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear all filters
            </button>
            <span className="flex-1" />
            <OutlineButton onClick={onClose} className={BTN}>
              Cancel
            </OutlineButton>
            <PrimaryButton onClick={apply} className={BTN}>
              Apply
            </PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col gap-[8px] py-[16px]">
          {draft.length === 0 ? (
            <p className="py-[8px] text-[14px] leading-[20px] text-pg-muted">
              No filters yet. Add one to narrow the list.
            </p>
          ) : null}
          {draft.map((f, i) => {
            const def = columnDef(f.field);
            return (
              <React.Fragment key={f.id}>
                {i > 0 ? (
                  <span className="text-[13px] leading-[18px] font-medium text-pg-muted">and</span>
                ) : null}
                <div className="flex flex-col gap-[8px] rounded-[8px] bg-pg p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                  <div className="grid grid-cols-2 gap-[8px]">
                    <PopoverSelect
                      aria-label="Field"
                      value={f.field}
                      searchable
                      options={FILTERABLE.map((c) => ({ value: c.id, label: c.label }))}
                      onChange={(v) => {
                        const kind = columnDef(v as ColumnId).kind;
                        patch(f.id, { field: v as ColumnId, operator: OPERATORS[kind][0], value: "" });
                      }}
                    />
                    <PopoverSelect
                      aria-label="Operator"
                      value={f.operator}
                      options={OPERATORS[def.kind].map((o) => ({ value: o, label: o }))}
                      onChange={(v) => patch(f.id, { operator: v, value: needsValue(v) ? f.value : "" })}
                    />
                  </div>
                  <div className="flex items-center gap-[8px]">
                    {!needsValue(f.operator) ? (
                      <span className="flex-1" />
                    ) : def.kind === "select" ? (
                      <PopoverSelect
                        aria-label="Value"
                        value={f.value || null}
                        placeholder="Select value"
                        options={(def.options ?? []).map((o) => ({ value: o, label: o }))}
                        onChange={(v) => patch(f.id, { value: v })}
                        className="flex-1"
                      />
                    ) : (
                      <TextInput
                        aria-label="Value"
                        type={def.kind === "number" ? "number" : def.kind === "date" ? "date" : "text"}
                        value={f.value}
                        onChange={(e) => patch(f.id, { value: e.target.value })}
                        placeholder={def.kind === "number" ? "Enter a number" : "Enter value"}
                        className="flex-1"
                      />
                    )}
                    <button
                      type="button"
                      aria-label="Remove condition"
                      onClick={() => setDraft((d) => d.filter((x) => x.id !== f.id))}
                      className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:text-pg-danger"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          <OutlineButton
            onClick={() =>
              setDraft((d) => [...d, { id: newFilterId(), field: "name", operator: "Contains", value: "" }])
            }
            className={cn(BTN, "mt-[8px] self-start")}
          >
            <Plus size={15} aria-hidden="true" />
            Add filter
          </OutlineButton>
        </div>
      </SideDrawer>
    </>
  );
}

/* ─── Sort ──────────────────────────────────────────────────────────────── */

/** The sort popover's body: one field, one direction. No nested menus. */
export function SortPanel({
  sort,
  onChange,
}: {
  sort: CompanySort | null;
  onChange: (next: CompanySort | null) => void;
}) {
  const dir = sort?.dir ?? "asc";
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b border-pg-head-border px-[12px] py-[10px]">
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Sort by</span>
        <div className="flex items-center gap-[4px]">
          {(["asc", "desc"] as const).map((d) => {
            const Icon = d === "asc" ? ArrowUp : ArrowDown;
            const on = !!sort && dir === d;
            return (
              <button
                key={d}
                type="button"
                disabled={!sort}
                aria-pressed={on}
                onClick={() => sort && onChange({ ...sort, dir: d })}
                className={cn(
                  "flex h-[28px] items-center gap-[4px] rounded-[6px] px-[8px] text-[13px] leading-[18px] font-medium motion-tap disabled:opacity-50",
                  on ? "bg-brand-soft text-brand" : "text-pg-muted hover:bg-pg",
                )}
              >
                <Icon size={13} aria-hidden="true" />
                {d === "asc" ? "Ascending" : "Descending"}
              </button>
            );
          })}
        </div>
      </div>
      <div role="listbox" aria-label="Sort field" className="max-h-[320px] overflow-y-auto p-[4px]">
        {COLUMN_DEFS.map((c) => {
          const on = sort?.field === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => onChange({ field: c.id, dir })}
              className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
            >
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                  on ? "font-medium text-pg-heading" : "text-pg-text",
                )}
              >
                {c.label}
              </span>
              {on ? <Check size={14} aria-hidden="true" className="text-brand" /> : null}
            </button>
          );
        })}
      </div>
      <div className="flex justify-end border-t border-pg-head-border px-[12px] py-[8px]">
        <button
          type="button"
          disabled={!sort}
          onClick={() => onChange(null)}
          className="text-[13px] leading-[18px] font-medium text-pg-muted motion-tap enabled:hover:text-pg-heading disabled:opacity-50"
        >
          Clear sort
        </button>
      </div>
    </div>
  );
}

/* ─── Manage fields ─────────────────────────────────────────────────────── */

export function ManageFieldsDrawer({
  columns,
  onApply,
  onClose,
}: {
  columns: ColumnState[];
  onApply: (next: ColumnState[]) => void;
  onClose: () => void;
}) {
  useEscapeLayer(onClose);
  const [draft, setDraft] = React.useState(columns);
  const [dragId, setDragId] = React.useState<ColumnId | null>(null);

  const move = (from: number, to: number) =>
    setDraft((d) => {
      // Company name stays first: it is the sticky column.
      if (to < 1 || to >= d.length || from < 1) return d;
      const next = [...d];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  const shown = draft.filter((c) => c.visible).length;

  return (
    <>
      <Scrim onClose={onClose} />
      <SideDrawer
        width={400}
        onClose={onClose}
        title={<span className="text-[16px] leading-[22px] font-semibold text-pg-heading">Manage fields</span>}
        subtitle={`${shown} of ${draft.length} fields shown`}
        bodyClassName="px-[16px]"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDraft(COLUMN_DEFS.map((c) => ({ id: c.id, visible: c.id !== "type" })))}
              className="text-[14px] leading-[20px] font-medium text-pg-muted motion-tap hover:text-pg-text"
            >
              Reset
            </button>
            <span className="flex-1" />
            <OutlineButton onClick={onClose} className={BTN}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              onClick={() => {
                onApply(draft);
                onClose();
              }}
              className={BTN}
            >
              Apply
            </PrimaryButton>
          </>
        }
      >
        <ul className="flex flex-col py-[12px]">
          {draft.map((c, i) => {
            const locked = c.id === "name";
            return (
              <li
                key={c.id}
                draggable={!locked}
                onDragStart={() => setDragId(c.id)}
                onDragEnd={() => setDragId(null)}
                onDragOver={(e) => {
                  if (!dragId || locked) return;
                  e.preventDefault();
                  const from = draft.findIndex((x) => x.id === dragId);
                  if (from !== i) move(from, i);
                }}
                className={cn(
                  "flex h-[40px] items-center gap-[8px] rounded-[8px] px-[4px] hover:bg-pg",
                  dragId === c.id && "bg-brand-soft",
                )}
              >
                <GripVertical
                  size={15}
                  aria-hidden="true"
                  className={cn("shrink-0", locked ? "text-pg-disabled" : "cursor-grab text-pg-faint")}
                />
                <Checkbox
                  checked={c.visible}
                  disabled={locked}
                  onChange={(v) =>
                    setDraft((d) => d.map((x) => (x.id === c.id ? { ...x, visible: v } : x)))
                  }
                  label={columnDef(c.id).label}
                  className="min-w-0 flex-1"
                />
                {locked ? (
                  <Lock size={13} aria-label="Always shown" className="mr-[8px] shrink-0 text-pg-faint" />
                ) : (
                  <span className="flex shrink-0">
                    <button
                      type="button"
                      aria-label={`Move ${columnDef(c.id).label} up`}
                      disabled={i <= 1}
                      onClick={() => move(i, i - 1)}
                      className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap enabled:hover:bg-pg-surface enabled:hover:text-pg-heading disabled:opacity-30"
                    >
                      <ChevronUp size={15} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${columnDef(c.id).label} down`}
                      disabled={i === draft.length - 1}
                      onClick={() => move(i, i + 1)}
                      className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap enabled:hover:bg-pg-surface enabled:hover:text-pg-heading disabled:opacity-30"
                    >
                      <ChevronDown size={15} aria-hidden="true" />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </SideDrawer>
    </>
  );
}

/* ─── Lists ─────────────────────────────────────────────────────────────── */

export function ListNameModal({
  title,
  initial = "",
  confirmLabel,
  onClose,
  onSave,
}: {
  title: string;
  initial?: string;
  confirmLabel: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  useEscapeLayer(onClose);
  const [name, setName] = React.useState(initial);
  const ok = name.trim() !== "";
  return (
    <Modal
      width={440}
      title={title}
      onClose={onClose}
      footer={
        <>
          <OutlineButton onClick={onClose} className={BTN}>
            Cancel
          </OutlineButton>
          <PrimaryButton disabled={!ok} onClick={() => ok && onSave(name.trim())} className={cn(BTN, PRIMARY_DISABLED)}>
            {confirmLabel}
          </PrimaryButton>
        </>
      }
    >
      <p className="text-[13px] leading-[18px] text-pg-muted">
        The list keeps the current filters, sort, and columns.
      </p>
      <Field label="List name" required htmlFor="list-name">
        <TextInput
          id="list-name"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && ok) onSave(name.trim());
          }}
          placeholder="Enter list name"
          maxLength={60}
        />
      </Field>
    </Modal>
  );
}

export function ManageListsDrawer({
  lists,
  onClose,
  onDeleted,
}: {
  lists: CompanyList[];
  onClose: () => void;
  /** So the page can fall back to All when the lit list goes. */
  onDeleted: (id: string) => void;
}) {
  useEscapeLayer(onClose);
  const [editing, setEditing] = React.useState<{ id: string; label: string } | null>(null);
  const [confirming, setConfirming] = React.useState<string | null>(null);

  const commit = () => {
    if (editing && editing.label.trim()) {
      saveList(editing.id, { label: editing.label.trim() });
      showToast("List renamed.");
    }
    setEditing(null);
  };

  return (
    <>
      <Scrim onClose={onClose} />
      <SideDrawer
        width={440}
        onClose={onClose}
        title={<span className="text-[16px] leading-[22px] font-semibold text-pg-heading">Manage smart lists</span>}
        subtitle={`${lists.length} lists`}
        bodyClassName="px-[16px]"
        footer={
          <>
            <span className="flex-1" />
            <PrimaryButton onClick={onClose} className={BTN}>
              Done
            </PrimaryButton>
          </>
        }
      >
        <ul className="flex flex-col py-[12px]">
          {lists.map((l) => {
            const locked = l.id === "all";
            const isEditing = editing?.id === l.id;
            return (
              <li
                key={l.id}
                className="flex min-h-[48px] items-center gap-[10px] border-b border-pg-row-border px-[4px] last:border-b-0"
              >
                <List size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
                {isEditing ? (
                  <TextInput
                    autoFocus
                    aria-label="List name"
                    value={editing.label}
                    onChange={(e) => setEditing({ id: l.id, label: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commit();
                    }}
                    onBlur={commit}
                    className="flex-1"
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">
                    {l.label}
                  </span>
                )}
                {locked ? (
                  <span className="text-[13px] leading-[18px] text-pg-faint">Default</span>
                ) : confirming === l.id ? (
                  <span className="flex shrink-0 items-center gap-[6px]">
                    <button
                      type="button"
                      onClick={() => {
                        deleteList(l.id);
                        onDeleted(l.id);
                        setConfirming(null);
                        showToast(`"${l.label}" deleted.`);
                      }}
                      className="h-[28px] rounded-[6px] bg-[var(--hr-error-600)] px-[10px] text-[13px] leading-[18px] font-semibold text-white motion-tap hover:brightness-110"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      aria-label="Keep list"
                      onClick={() => setConfirming(null)}
                      className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg"
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-[2px]">
                    <button
                      type="button"
                      aria-label={`Rename ${l.label}`}
                      onClick={() => setEditing({ id: l.id, label: l.label })}
                      className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading"
                    >
                      <Pencil size={14} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Delete ${l.label}`}
                      onClick={() => setConfirming(l.id)}
                      className="flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-danger"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </SideDrawer>
    </>
  );
}

/* ─── Import ────────────────────────────────────────────────────────────── */

const HEADER_MAP: Record<string, keyof Company> = {
  name: "name",
  "company name": "name",
  company: "name",
  phone: "phone",
  email: "email",
  website: "website",
  address: "address",
  state: "state",
  city: "city",
  description: "description",
  "postal code": "postalCode",
  postcode: "postalCode",
  zip: "postalCode",
  country: "country",
};

const SAMPLE = `Company name,Email,Website,City,State,Country
Brightwater Pools,hello@brightwaterpools.com,https://brightwaterpools.com,Tampa,FL,US
Kestrel Accountancy,info@kestrelaccounts.co.uk,https://kestrelaccounts.co.uk,Leeds,England,GB
Pinecrest Veterinary,,https://pinecrestvet.com,Boise,ID,US`;

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function parseCsv(text: string): Company[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => HEADER_MAP[h.toLowerCase()]);
  const now = Date.now();
  const tones = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"] as const;
  return lines.slice(1).flatMap((line, i) => {
    const cells = splitCsvLine(line);
    const rec: Partial<Record<keyof Company, string>> = {};
    headers.forEach((key, j) => {
      if (key && cells[j]) rec[key] = cells[j];
    });
    if (!rec.name) return [];
    return [
      {
        name: rec.name,
        phone: rec.phone,
        email: rec.email,
        website: rec.website,
        address: rec.address,
        state: rec.state,
        city: rec.city,
        description: rec.description,
        postalCode: rec.postalCode,
        country: rec.country,
        id: newCompanyId(),
        type: "Customer" as const,
        contacts: 0,
        created: now - i * 1000,
        updated: now - i * 1000,
        createdBy: { kind: "system" as const },
        tone: tones[i % tones.length],
      },
    ];
  });
}

export function ImportCompaniesModal({ onClose }: { onClose: () => void }) {
  useEscapeLayer(onClose);
  const [file, setFile] = React.useState<{ name: string; rows: Company[] } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const read = (f: File) => {
    f.text().then((text) => {
      const rows = parseCsv(text);
      if (rows.length === 0) {
        setError("We couldn't find any companies in that file. Check it has a Company name column.");
        setFile(null);
      } else {
        setError(null);
        setFile({ name: f.name, rows });
      }
    });
  };

  const start = () => {
    if (!file) return;
    addCompanies(file.rows);
    addJob({
      label: `${file.name}-${labelStamp()}`,
      operation: "Import",
      records: file.rows.length,
      objects: "Companies",
      speed: 50,
    });
    showToast(`${file.rows.length} ${file.rows.length === 1 ? "company" : "companies"} imported.`);
    onClose();
  };

  return (
    <Modal
      width={560}
      title="Import companies"
      icon={
        <SoftIcon size={40}>
          <Upload size={18} />
        </SoftIcon>
      }
      onClose={onClose}
      bodyClassName="gap-[16px]"
      footer={
        <>
          <OutlineButton onClick={onClose} className={BTN}>
            Cancel
          </OutlineButton>
          <PrimaryButton disabled={!file} onClick={start} className={cn(BTN, PRIMARY_DISABLED)}>
            Start import
          </PrimaryButton>
        </>
      }
    >
      <p className="-mt-[4px] text-[14px] leading-[20px] text-pg-muted">
        Upload a CSV with a Company name column. Email, Website, Address, City, State, Postal code, and
        Country map automatically.
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) read(f);
        }}
        className="flex flex-col items-center gap-[8px] rounded-[8px] border border-dashed border-pg-border-strong bg-pg px-[16px] py-[28px] text-center motion-tap hover:border-brand"
      >
        <FileUp size={22} aria-hidden="true" className="text-pg-muted" />
        <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
          {file ? file.name : "Choose a CSV file or drag it here"}
        </span>
        <span className="text-[13px] leading-[18px] text-pg-muted">
          {file ? `${file.rows.length} companies found` : "CSV up to 25 MB"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) read(f);
          e.target.value = "";
        }}
      />
      {error ? (
        <p role="alert" className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => {
          setError(null);
          setFile({ name: "sample-companies.csv", rows: parseCsv(SAMPLE) });
        }}
        className="self-start text-[14px] leading-[20px] font-medium text-brand motion-tap hover:underline"
      >
        Use the sample file
      </button>
    </Modal>
  );
}
