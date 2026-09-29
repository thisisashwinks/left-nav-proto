"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, ListFilter, Plus, Search, X } from "lucide-react";
import {
  useCustomFields,
  type CustomField,
  type CustomFolder,
  type FieldType,
} from "@/components/custom-fields/custom-fields-data";
import { Toggle } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import {
  CONTACT_TYPES,
  COUNTRIES,
  PHONE_TYPES,
  STD,
  countryByCode,
  formatDateValue,
  type PhoneEntry,
  type RecordCardState,
} from "./contact-record-data";
import { FloatingMenu, OptionMenu, anchorOf, type Anchor } from "./contact-record-popover";

export type Patch = (fn: (s: RecordCardState) => RecordCardState) => void;

/* ─── Accordion ─────────────────────────────────────────────────────────── */

/**
 * The card's folder. Controlled, because All fields has to open and shut
 * every folder at once and search has to force the matching ones open.
 */
export function RecordAccordion({
  label,
  open,
  onToggle,
  extra,
  children,
}: {
  label: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  /** Sits before the chevron — "+ Add", a score badge. */
  extra?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex h-[44px] items-center gap-[8px] bg-pg px-[16px]">
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="min-w-0 flex-1 truncate text-left text-[14px] leading-[20px] font-medium text-pg-heading motion-tap"
        >
          {label}
        </button>
        {extra}
        <button
          type="button"
          aria-label={open ? "Collapse" : "Expand"}
          onClick={onToggle}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:text-pg-heading"
        >
          {open ? (
            <ChevronUp size={16} aria-hidden="true" />
          ) : (
            <ChevronDown size={16} aria-hidden="true" />
          )}
        </button>
      </div>
      {open ? (
        <div className="border-t border-pg-row-border px-[16px] py-[6px]">{children}</div>
      ) : null}
    </div>
  );
}

/** An uncontrolled accordion for the DND and Actions tabs. */
export function OwnAccordion({
  defaultOpen = false,
  ...rest
}: Omit<React.ComponentProps<typeof RecordAccordion>, "open" | "onToggle"> & {
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return <RecordAccordion {...rest} open={open} onToggle={() => setOpen((v) => !v)} />;
}

/* ─── Values ────────────────────────────────────────────────────────────── */

type Kind = "text" | "textarea" | "number" | "date" | "select" | "multi";

function kindOf(t: FieldType): Kind {
  switch (t) {
    case "multi-line":
      return "textarea";
    case "number":
    case "monetary":
      return "number";
    case "date":
      return "date";
    case "dropdown-single":
    case "radio":
      return "select";
    case "dropdown-multiple":
    case "checkbox":
      return "multi";
    default:
      return "text";
  }
}

function display(v: string, t: FieldType | "std-date"): string {
  if (!v) return "--";
  if (t === "date" || t === "std-date") return formatDateValue(v);
  if (t === "monetary") return `$${Number(v).toLocaleString("en-US")}`;
  if (t === "number") return Number(v).toLocaleString("en-US");
  return v;
}

/**
 * The inline editor. Enter or blur saves, Escape cancels; the cancel flag is
 * a ref so the blur that follows unmounting cannot save what Escape dropped.
 */
function InlineEditor({
  kind,
  initial,
  onSave,
  onCancel,
  placeholder,
}: {
  kind: "text" | "textarea" | "number" | "date";
  initial: string;
  onSave: (v: string) => void;
  onCancel: () => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState(initial);
  const done = React.useRef(false);
  const commit = () => {
    if (done.current) return;
    done.current = true;
    onSave(draft.trim());
  };
  const cancel = () => {
    done.current = true;
    onCancel();
  };
  const cls =
    "w-full rounded-[6px] bg-pg-surface px-[8px] text-[14px] leading-[20px] text-pg-text shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)] placeholder:text-pg-faint focus:outline-none";

  if (kind === "textarea") {
    return (
      <textarea
        autoFocus
        rows={3}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            e.stopPropagation();
            cancel();
          }
        }}
        className={cn(cls, "resize-none py-[6px]")}
      />
    );
  }
  return (
    <input
      autoFocus
      type={kind}
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.stopPropagation();
          cancel();
        }
      }}
      className={cn(cls, "h-[32px]")}
    />
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[13px] leading-[18px] break-words text-pg-muted">{children}</span>
  );
}

/** One label/value row; clicking the value edits it with the type's control. */
function FieldRow({
  label,
  value,
  type,
  options,
  editing,
  onEdit,
  onDone,
  onSave,
}: {
  label: string;
  value: string;
  type: FieldType | "std-date";
  options: string[];
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onSave: (v: string) => void;
}) {
  const [menu, setMenu] = React.useState<Anchor | null>(null);
  const kind: Kind = type === "std-date" ? "date" : kindOf(type);
  const isMenu = kind === "select" || kind === "multi";
  const selected = value ? value.split(", ") : [];

  return (
    <div className="flex flex-col gap-[4px] py-[8px]">
      <FieldLabel>{label}</FieldLabel>
      {editing && !isMenu ? (
        <InlineEditor
          kind={kind as "text" | "textarea" | "number" | "date"}
          initial={value}
          onCancel={onDone}
          onSave={(v) => {
            onSave(v);
            onDone();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={(e) => (isMenu ? setMenu(anchorOf(e.currentTarget)) : onEdit())}
          className="-mx-[6px] flex min-h-[28px] items-center gap-[8px] rounded-[6px] px-[6px] text-left motion-tap hover:bg-pg"
        >
          <span
            className={cn(
              "min-w-0 flex-1 text-[14px] leading-[20px] break-words",
              value ? "font-medium text-pg-heading" : "text-pg-text",
            )}
          >
            {display(value, type)}
          </span>
          {isMenu ? (
            <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
          ) : null}
        </button>
      )}
      {menu ? (
        <OptionMenu
          anchor={menu}
          onClose={() => setMenu(null)}
          width={Math.max(220, menu.right - menu.left)}
          multiple={kind === "multi"}
          selected={selected}
          options={options.map((o) => ({ value: o, label: o }))}
          onChange={(vals) => onSave(vals.join(", "))}
        />
      ) : null}
    </div>
  );
}

/* ─── Phone ─────────────────────────────────────────────────────────────── */

function PhoneLine({
  phone,
  editing,
  onEdit,
  onDone,
  onChange,
  onRemove,
}: {
  phone: PhoneEntry;
  editing: boolean;
  onEdit: () => void;
  onDone: () => void;
  onChange: (p: PhoneEntry) => void;
  onRemove?: () => void;
}) {
  const [menu, setMenu] = React.useState<{ kind: "country" | "type"; at: Anchor } | null>(null);
  const country = countryByCode(phone.country);

  return (
    <div className="flex min-h-[32px] items-center gap-[6px]">
      <button
        type="button"
        aria-label={`Country: ${country.name}`}
        onClick={(e) => setMenu({ kind: "country", at: anchorOf(e.currentTarget) })}
        className="flex h-[28px] shrink-0 items-center gap-[2px] rounded-[6px] px-[2px] motion-tap hover:bg-pg"
      >
        <span className="text-[18px] leading-none">{country.flag}</span>
        <ChevronDown size={13} aria-hidden="true" className="text-pg-muted" />
      </button>
      {editing ? (
        <div className="min-w-0 flex-1">
          <InlineEditor
            kind="text"
            initial={phone.number}
            placeholder="Phone number"
            onCancel={onDone}
            onSave={(v) => {
              onChange({ ...phone, number: v });
              onDone();
            }}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={onEdit}
          className="min-w-0 flex-1 truncate rounded-[6px] px-[4px] py-[4px] text-left text-[14px] leading-[20px] font-medium text-pg-heading motion-tap hover:bg-pg"
        >
          {phone.number ? `${country.dial} ${phone.number}` : "--"}
        </button>
      )}
      <button
        type="button"
        onClick={(e) => setMenu({ kind: "type", at: anchorOf(e.currentTarget) })}
        className="flex h-[28px] shrink-0 items-center gap-[4px] rounded-[6px] px-[6px] text-[14px] leading-[20px] font-medium text-pg-heading motion-tap hover:bg-pg"
      >
        {phone.type ?? "Select"}
        <ChevronDown size={14} aria-hidden="true" className="text-pg-muted" />
      </button>
      {onRemove ? (
        <button
          type="button"
          aria-label="Remove phone"
          onClick={onRemove}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint motion-tap hover:text-pg-heading"
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}

      {menu?.kind === "country" ? (
        <OptionMenu
          anchor={menu.at}
          onClose={() => setMenu(null)}
          width={240}
          clearable={false}
          selected={[phone.country]}
          options={COUNTRIES.map((c) => ({
            value: c.code,
            search: `${c.name} ${c.dial}`,
            label: (
              <span className="flex items-center gap-[8px]">
                <span className="text-[16px] leading-none">{c.flag}</span>
                <span className="min-w-0 flex-1 truncate">{c.name}</span>
                <span className="text-[13px] text-pg-muted">{c.dial}</span>
              </span>
            ),
          }))}
          onChange={([code]) => code && onChange({ ...phone, country: code })}
        />
      ) : null}
      {menu?.kind === "type" ? (
        <OptionMenu
          anchor={menu.at}
          onClose={() => setMenu(null)}
          width={160}
          align="right"
          selected={phone.type ? [phone.type] : []}
          options={PHONE_TYPES.map((t) => ({ value: t, label: t }))}
          onChange={([t]) =>
            onChange({ ...phone, type: (t as PhoneEntry["type"]) ?? null })
          }
        />
      ) : null}
    </div>
  );
}

/* ─── The pane ──────────────────────────────────────────────────────────── */

interface Row {
  id: string;
  label: string;
  type: FieldType | "std-date" | "phone-list";
  options: string[];
}

const PINNED: Row[] = [
  { id: "std-phone", label: "Phone", type: "phone-list", options: [] },
  { id: STD.dob, label: "Date of birth", type: "std-date", options: [] },
  { id: STD.source, label: "Contact source", type: "single-line", options: [] },
  { id: STD.type, label: "Contact type", type: "dropdown-single", options: CONTACT_TYPES },
];

const FIRST = ["contact", "general-info", "additional-info"];

/** The contact object's folders, Contact → General Info → Additional Info → rest. */
function orderFolders(folders: CustomFolder[]): CustomFolder[] {
  const mine = folders.filter((f) => f.object === "contact");
  const rank = (f: CustomFolder) => {
    const i = FIRST.indexOf(f.id);
    return i === -1 ? FIRST.length : i;
  };
  // Array.prototype.sort is stable, so the rest keep the store's order.
  return [...mine].sort((a, b) => rank(a) - rank(b));
}

export function AllFieldsPane({
  state,
  patch,
}: {
  state: RecordCardState;
  patch: Patch;
}) {
  const { folders, fields } = useCustomFields();
  const [query, setQuery] = React.useState("");
  const [showEmpty, setShowEmpty] = React.useState(true);
  const [openIds, setOpenIds] = React.useState<Set<string>>(() => new Set(["contact"]));
  const [editing, setEditing] = React.useState<string | null>(null);
  const [filterMenu, setFilterMenu] = React.useState<Anchor | null>(null);

  const ordered = React.useMemo(() => orderFolders(folders), [folders]);
  const byFolder = React.useMemo(() => {
    const m = new Map<string, CustomField[]>();
    fields.forEach((f) => {
      if (f.object !== "contact") return;
      const list = m.get(f.folderId);
      if (list) list.push(f);
      else m.set(f.folderId, [f]);
    });
    return m;
  }, [fields]);

  const q = query.trim().toLowerCase();
  const filtering = q !== "" || !showEmpty;
  const hasValue = (r: Row) =>
    r.type === "phone-list"
      ? state.phones.some((p) => p.number)
      : Boolean(state.values[r.id]);

  const sections = ordered
    .map((folder) => {
      const folderHit = q !== "" && folder.name.toLowerCase().includes(q);
      const rows: Row[] = [
        ...(folder.id === "contact" ? PINNED : []),
        ...(byFolder.get(folder.id) ?? []).map((f) => ({
          id: f.id,
          label: f.name,
          type: f.type,
          options: f.options,
        })),
      ].filter(
        (r) =>
          (!q || folderHit || r.label.toLowerCase().includes(q)) && (showEmpty || hasValue(r)),
      );
      return { folder, rows, folderHit };
    })
    .filter((s) => !filtering || s.rows.length > 0 || s.folderHit);

  const allOpen = ordered.every((f) => openIds.has(f.id));
  const setValue = (id: string, v: string) =>
    patch((s) => ({ ...s, values: { ...s.values, [id]: v } }));
  const setPhones = (phones: PhoneEntry[]) => patch((s) => ({ ...s, phones }));

  return (
    <div className="flex flex-col gap-[12px]">
      <div className="flex h-[36px] items-center gap-[8px] rounded-[8px] px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
        <input
          aria-label="Search fields and folders"
          placeholder="Search fields and folders"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-muted focus:outline-none"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="shrink-0 text-pg-faint motion-tap hover:text-pg-heading"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : null}
        <button
          type="button"
          aria-label="Field view options"
          onClick={(e) => setFilterMenu(anchorOf(e.currentTarget))}
          className={cn(
            "flex size-[24px] shrink-0 items-center justify-center rounded-[6px] motion-tap hover:bg-pg",
            showEmpty ? "text-pg-muted" : "text-brand",
          )}
        >
          <ListFilter size={15} aria-hidden="true" />
        </button>
      </div>

      {filterMenu ? (
        <FloatingMenu
          anchor={filterMenu}
          onClose={() => setFilterMenu(null)}
          width={220}
          align="right"
          className="p-[4px]"
        >
          <label className="flex h-[36px] cursor-pointer items-center gap-[8px] rounded-[6px] px-[10px] hover:bg-pg">
            <span className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text">
              Show empty fields
            </span>
            <Toggle checked={showEmpty} onChange={setShowEmpty} aria-label="Show empty fields" />
          </label>
          <button
            type="button"
            onClick={() => {
              setOpenIds(allOpen ? new Set() : new Set(ordered.map((f) => f.id)));
              setFilterMenu(null);
            }}
            className="flex h-[36px] items-center rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] text-pg-text motion-tap hover:bg-pg"
          >
            {allOpen ? "Collapse all" : "Expand all"}
          </button>
        </FloatingMenu>
      ) : null}

      {sections.length === 0 ? (
        <p className="py-[16px] text-center text-[13px] leading-[18px] text-pg-muted">
          {q ? `No fields match "${query.trim()}"` : "No filled fields yet"}
        </p>
      ) : null}

      {sections.map(({ folder, rows }) => (
        <RecordAccordion
          key={folder.id}
          label={folder.name}
          // Search forces matching folders open; the user's set is kept for later.
          open={q !== "" || openIds.has(folder.id)}
          onToggle={() =>
            setOpenIds((s) => {
              const n = new Set(s);
              if (n.has(folder.id)) n.delete(folder.id);
              else n.add(folder.id);
              return n;
            })
          }
        >
          {rows.length === 0 ? (
            <p className="py-[8px] text-[13px] leading-[18px] text-pg-muted">
              No fields in this folder
            </p>
          ) : null}
          {rows.map((r) =>
            r.type === "phone-list" ? (
              <div key={r.id} className="flex flex-col gap-[2px] py-[8px]">
                <span className="flex items-center gap-[4px]">
                  <FieldLabel>Phone</FieldLabel>
                  <button
                    type="button"
                    aria-label="Add phone"
                    onClick={() => {
                      const id = `p${Date.now()}`;
                      setPhones([...state.phones, { id, country: "US", number: "", type: null }]);
                      setEditing(`phone:${id}`);
                    }}
                    className="flex size-[16px] items-center justify-center rounded-full text-brand shadow-[inset_0_0_0_1.25px_var(--brand)] motion-tap hover:bg-brand-soft"
                  >
                    <Plus size={11} aria-hidden="true" />
                  </button>
                </span>
                {state.phones.map((p, i) => (
                  <PhoneLine
                    key={p.id}
                    phone={p}
                    editing={editing === `phone:${p.id}`}
                    onEdit={() => setEditing(`phone:${p.id}`)}
                    onDone={() => setEditing(null)}
                    onChange={(next) =>
                      setPhones(state.phones.map((x) => (x.id === p.id ? next : x)))
                    }
                    onRemove={
                      i > 0
                        ? () => setPhones(state.phones.filter((x) => x.id !== p.id))
                        : undefined
                    }
                  />
                ))}
              </div>
            ) : (
              <FieldRow
                key={r.id}
                label={r.label}
                value={state.values[r.id] ?? ""}
                type={r.type}
                options={r.options}
                editing={editing === r.id}
                onEdit={() => setEditing(r.id)}
                onDone={() => setEditing(null)}
                onSave={(v) => setValue(r.id, v)}
              />
            ),
          )}
        </RecordAccordion>
      ))}
    </div>
  );
}
