"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Info,
  Lock,
  Mail,
  MessageCircle,
  MessageSquareText,
  MoveDownLeft,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Trash2,
  UserRound,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
import { Checkbox, Select, TextInput } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import {
  FIELD_CATALOG,
  FIELD_FOLDERS,
  fieldDef,
  moveItem,
  sameForm,
  type FieldDef,
  type FormField,
} from "./add-fields-data";

export const DISABLED_BTN =
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100";

/* ─── Drag reorder ──────────────────────────────────────────────────────── */

/**
 * Row drag in the manage-smart-lists idiom: the grip is the drag source and
 * the whole row is the drop target, with an inset brand line where it lands.
 * Arrow keys on a focused grip do the same job for anyone not using a mouse.
 *
 * `ids` is the FULL order, not whatever a search is showing, so a drag in a
 * filtered list still lands where it looks like it lands.
 */
export function useRowDrag(ids: string[], move: (id: string, to: number) => void) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  const end = () => {
    setDragId(null);
    setOverId(null);
  };

  const rowProps = (id: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (overId !== id) setOverId(id);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragId && dragId !== id) move(dragId, ids.indexOf(id));
      end();
    },
  });

  const handleProps = (id: string, label: string) => ({
    role: "button",
    tabIndex: 0,
    draggable: true,
    "data-drag-handle": id,
    "aria-label": `Reorder ${label}. Use the arrow keys to move it.`,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", id);
      setDragId(id);
    },
    onDragEnd: end,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const to = ids.indexOf(id) + (e.key === "ArrowUp" ? -1 : 1);
      if (to < 0 || to >= ids.length) return;
      move(id, to);
      // The row's node moves on re-render, which can drop focus; put it back
      // so a held arrow key keeps walking the same list.
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-drag-handle="${id}"]`)?.focus(),
      );
    },
  });

  const rowClass = (id: string) =>
    cn(
      dragId === id && "opacity-40",
      overId === id && dragId !== id && "shadow-[inset_0_2px_0_0_var(--brand)]",
    );

  return { rowProps, handleProps, rowClass };
}

/* ─── Preview ───────────────────────────────────────────────────────────── */

const CHANNELS = [
  { id: "email", label: "Email", icon: Mail },
  { id: "sms", label: "Text / RCS messages", icon: MessageSquareText },
  { id: "calls", label: "Calls & voicemail", icon: Smartphone },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { id: "inbound", label: "Inbound calls and SMS", icon: MoveDownLeft },
];

const PHONE_TYPES = ["Mobile", "Home", "Work", "Other"].map((t) => ({
  value: t.toLowerCase(),
  label: t,
}));

const COUNTRIES = [
  { value: "us", label: "🇺🇸 +1", hint: "United States" },
  { value: "ca", label: "🇨🇦 +1", hint: "Canada" },
  { value: "gb", label: "🇬🇧 +44", hint: "United Kingdom" },
  { value: "au", label: "🇦🇺 +61", hint: "Australia" },
  { value: "in", label: "🇮🇳 +91", hint: "India" },
  { value: "de", label: "🇩🇪 +49", hint: "Germany" },
  { value: "mx", label: "🇲🇽 +52", hint: "Mexico" },
];

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
      {label}
      {required ? <span className="text-pg-danger"> *</span> : null}
    </span>
  );
}

function AddRowButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-[4px] self-start text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
    >
      <Plus size={14} aria-hidden="true" />
      {children}
    </button>
  );
}

function RemoveRowButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <OutlineButton
      aria-label={label}
      onClick={onClick}
      className="h-[36px] w-[36px] justify-center px-0"
    >
      <Trash2 size={15} aria-hidden="true" className="text-pg-muted" />
    </OutlineButton>
  );
}

/** The radio that marks which email or phone is the primary one. */
function PrimaryRadio({ on, label, onPick }: { on: boolean; label: string; onPick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      aria-label={label}
      onClick={onPick}
      className={cn(
        "flex size-[16px] shrink-0 items-center justify-center rounded-full motion-tap",
        on ? "bg-brand" : "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      {on ? <span className="size-[6px] rounded-full bg-brand-fg" /> : null}
    </button>
  );
}

/**
 * Repeating rows with a primary — the email and phone blocks. Rows are keyed
 * by a counter, so removing one never shuffles the others' input state.
 */
function useRepeatRows() {
  const [rows, setRows] = React.useState<number[]>([0]);
  const [next, setNext] = React.useState(1);
  const [primary, setPrimary] = React.useState(0);
  return {
    rows,
    primary,
    setPrimary,
    add: () => {
      setRows((r) => [...r, next]);
      setNext((n) => n + 1);
    },
    remove: (id: number) => {
      // The last row stays; the trash just gives you a fresh one.
      const left = rows.filter((r) => r !== id);
      const kept = left.length ? left : [next];
      if (!left.length) setNext((n) => n + 1);
      setRows(kept);
      if (primary === id || !left.length) setPrimary(kept[0]);
    },
  };
}

function EmailBlock({ def, required }: { def: FieldDef; required: boolean }) {
  const r = useRepeatRows();
  return (
    <div className="flex flex-col gap-[4px]">
      <FieldLabel label={def.label} required={required} />
      <div className="flex flex-col gap-[8px]">
        {r.rows.map((id) => (
          <div key={id} className="flex items-center gap-[8px]">
            <PrimaryRadio
              on={r.primary === id}
              label="Primary email"
              onPick={() => r.setPrimary(id)}
            />
            <TextInput type="email" placeholder="Enter email address" aria-label="Email" />
            <RemoveRowButton label="Remove email" onClick={() => r.remove(id)} />
          </div>
        ))}
      </div>
      <AddRowButton onClick={r.add}>Add email</AddRowButton>
    </div>
  );
}

function PhoneRow({ onRemove, radio }: { onRemove: () => void; radio: React.ReactNode }) {
  const [type, setType] = React.useState<string | null>(null);
  const [country, setCountry] = React.useState("us");
  return (
    <div className="flex items-center gap-[8px]">
      {radio}
      <Select
        value={type}
        options={PHONE_TYPES}
        onChange={setType}
        placeholder="Select"
        aria-label="Phone type"
        className="w-[104px] shrink-0"
      />
      <div className="flex min-w-0 flex-1">
        <Select
          value={country}
          options={COUNTRIES}
          onChange={setCountry}
          aria-label="Country code"
          className="w-[92px] shrink-0"
          menuClassName="min-w-[220px]"
        />
        <TextInput
          type="tel"
          placeholder="Enter phone number"
          aria-label="Phone number"
          className="ml-[-1px] min-w-0 flex-1"
        />
      </div>
      <RemoveRowButton label="Remove phone" onClick={onRemove} />
    </div>
  );
}

function PhoneBlock({ def, required }: { def: FieldDef; required: boolean }) {
  const r = useRepeatRows();
  return (
    <div className="flex flex-col gap-[4px]">
      <FieldLabel label={def.label} required={required} />
      <div className="flex flex-col gap-[8px]">
        {r.rows.map((id) => (
          <PhoneRow
            key={id}
            onRemove={() => r.remove(id)}
            radio={
              <PrimaryRadio
                on={r.primary === id}
                label="Primary phone"
                onPick={() => r.setPrimary(id)}
              />
            }
          />
        ))}
      </div>
      <AddRowButton onClick={r.add}>Add phone</AddRowButton>
    </div>
  );
}

function SingleBlock({ def, required }: { def: FieldDef; required: boolean }) {
  const [value, setValue] = React.useState<string | null>(null);
  const options = (def.options ?? ["Option 1", "Option 2", "Option 3"]).map((o) => ({
    value: o,
    label: o,
  }));
  return (
    <div className="flex flex-col gap-[4px]">
      <FieldLabel label={def.label} required={required} />
      <Select
        value={value}
        options={options}
        onChange={setValue}
        placeholder={`Select ${def.label}`}
        aria-label={def.label}
      />
    </div>
  );
}

function DndBlock() {
  const [all, setAll] = React.useState(false);
  const [on, setOn] = React.useState<string[]>([]);
  return (
    <div className="flex flex-col gap-[8px] rounded-[12px] px-[16px] py-[14px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <Checkbox checked={all} onChange={setAll} label="DND all channels" />
      <div className="flex items-center gap-[12px]">
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--pg-border)]" />
        <span className="text-[13px] leading-[18px] text-pg-muted">OR</span>
        <span aria-hidden="true" className="h-px flex-1 bg-[var(--pg-border)]" />
      </div>
      <span className="text-[14px] leading-[20px] font-medium text-pg-heading">Channels</span>
      <div className={cn("flex flex-col gap-[10px]", all && "pointer-events-none opacity-50")}>
        {CHANNELS.map((c) => (
          <div key={c.id} className="flex items-center gap-[6px]">
            <Checkbox
              checked={all || on.includes(c.id)}
              onChange={() =>
                setOn((cur) =>
                  cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id],
                )
              }
              label={
                <span className="flex items-center gap-[8px]">
                  <c.icon size={15} aria-hidden="true" className="text-pg-muted" />
                  {c.label}
                </span>
              }
            />
            {c.id === "inbound" ? (
              <span
                title="Blocks inbound calls and texts from this contact."
                className="flex text-pg-faint"
              >
                <Info size={14} aria-label="About inbound DND" />
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewField({ field }: { field: FormField }) {
  const def = fieldDef(field.id);
  if (!def) return null;
  if (def.kind === "email") return <EmailBlock def={def} required={field.required} />;
  if (def.kind === "phone") return <PhoneBlock def={def} required={field.required} />;
  if (def.kind === "single" && def.options) return <SingleBlock def={def} required={field.required} />;
  if (def.kind === "dnd") return <DndBlock />;
  // Everything else — including whatever Manage fields added — is a text box.
  return (
    <label className="flex flex-col gap-[4px]">
      <FieldLabel label={def.label} required={field.required} />
      <TextInput placeholder={`Enter ${def.label}`} />
    </label>
  );
}

/**
 * The add-contact form as the DRAFT would draw it — unsaved changes included,
 * which is the point of previewing before you save. The inputs work so the
 * form can be felt out, but nothing it holds goes anywhere.
 */
export function PreviewDrawer({
  singular,
  fields,
  onClose,
}: {
  singular: string;
  fields: FormField[];
  onClose: () => void;
}) {
  return (
    <SideDrawer
      width={480}
      onClose={onClose}
      title={`Preview: Add ${singular}`}
      bodyClassName="flex flex-col gap-[16px] px-[16px] py-[16px]"
    >
      <div className="flex flex-col gap-[8px]">
        <FieldLabel label={`${singular} image`} />
        <div className="relative size-[72px] rounded-full bg-pg text-pg-muted">
          <span className="flex size-full items-center justify-center">
            <UserRound size={32} aria-hidden="true" />
          </span>
          <button
            type="button"
            aria-label="Upload image"
            className="absolute right-[-2px] bottom-[-2px] flex size-[24px] items-center justify-center rounded-full bg-pg-surface text-pg-text-strong shadow-[0_0_0_1px_var(--pg-border)] motion-tap hover:text-pg-heading"
          >
            <Pencil size={12} aria-hidden="true" />
          </button>
        </div>
      </div>
      {fields.map((f) => (
        <PreviewField key={f.id} field={f} />
      ))}
    </SideDrawer>
  );
}

/* ─── Manage fields ─────────────────────────────────────────────────────── */

function FieldCard({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex h-[48px] w-full items-center gap-[8px] px-[12px] text-left motion-tap"
      >
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-pg-heading">
          {title}
        </span>
        {open ? (
          <ChevronUp size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
        ) : (
          <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
        )}
      </button>
      {open ? <div className="flex flex-col px-[12px] pb-[8px]">{children}</div> : null}
    </section>
  );
}

/**
 * Picking which fields the form asks for.
 *
 * Works on its own copy of the draft: Save hands the picks back to the table
 * (still unsaved — the page's Save commits them), Cancel drops them. Required
 * flags ride along for fields that were already on the form; anything newly
 * picked starts optional.
 */
export function ManageFormFieldsDrawer({
  fields,
  onClose,
  onApply,
}: {
  fields: FormField[];
  onClose: () => void;
  onApply: (next: FormField[]) => void;
}) {
  const [picked, setPicked] = React.useState<FormField[]>(fields);
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState<Record<string, boolean>>({
    selected: true,
    general: true,
    additional: false,
  });

  const q = query.trim().toLowerCase();
  const matches = (d: FieldDef | undefined) => !!d && (!q || d.label.toLowerCase().includes(q));
  const isPicked = (id: string) => picked.some((f) => f.id === id);
  const toggle = (id: string) =>
    setPicked((cur) =>
      cur.some((f) => f.id === id)
        ? cur.filter((f) => f.id !== id)
        : [...cur, { id, required: false }],
    );
  // A search opens every card, or a match could hide inside a closed one.
  const cardOpen = (id: string) => !!q || open[id];
  const flip = (id: string) => setOpen((o) => ({ ...o, [id]: !o[id] }));

  const ids = picked.map((f) => f.id);
  const drag = useRowDrag(ids, (id, to) =>
    setPicked((cur) => moveItem(cur, cur.findIndex((f) => f.id === id), to)),
  );

  const shownPicked = picked.filter((f) => matches(fieldDef(f.id)));
  const folders = FIELD_FOLDERS.map((g) => ({
    ...g,
    fields: FIELD_CATALOG.filter((d) => d.folder === g.id && matches(d)),
  })).filter((g) => g.fields.length > 0);
  const nothing = shownPicked.length === 0 && folders.length === 0;

  return (
    <SideDrawer
      width={480}
      onClose={onClose}
      title="Manage fields"
      bodyClassName="flex flex-col gap-[12px] px-[16px] pb-[16px]"
      footer={
        <>
          <span className="flex-1" />
          <OutlineButton onClick={onClose} className="h-[36px]">
            Cancel
          </OutlineButton>
          <PrimaryButton
            disabled={sameForm(picked, fields)}
            onClick={() => onApply(picked)}
            className={cn("h-[36px]", DISABLED_BTN)}
          >
            Save
          </PrimaryButton>
        </>
      }
    >
      <div className="sticky top-0 z-10 -mx-[16px] bg-pg-surface px-[16px] pt-[16px] pb-[4px]">
        <label className="relative block">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-pg-faint"
          />
          <TextInput
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search fields"
            className="pl-[34px]"
          />
        </label>
      </div>

      {nothing ? (
        <p className="py-[24px] text-center text-[13px] leading-[18px] text-pg-muted">
          No fields match “{query.trim()}”.
        </p>
      ) : null}

      {shownPicked.length > 0 ? (
        <FieldCard title="Selected fields" open={cardOpen("selected")} onToggle={() => flip("selected")}>
          {shownPicked.map((f) => {
            const def = fieldDef(f.id)!;
            return (
              <div
                key={f.id}
                {...drag.rowProps(f.id)}
                className={cn("flex h-[40px] items-center gap-[6px] rounded-[6px]", drag.rowClass(f.id))}
              >
                <span
                  {...drag.handleProps(f.id, def.label)}
                  className="flex size-[20px] shrink-0 cursor-grab items-center justify-center rounded-[4px] text-pg-faint hover:text-pg-text-strong focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none active:cursor-grabbing"
                >
                  <GripVertical size={14} aria-hidden="true" />
                </span>
                <Checkbox
                  checked
                  disabled={def.locked}
                  onChange={() => toggle(f.id)}
                  label={def.label}
                  className="min-w-0 flex-1"
                />
                {def.locked ? (
                  <Lock size={14} aria-label="Always on the form" className="shrink-0 text-pg-faint" />
                ) : null}
              </div>
            );
          })}
        </FieldCard>
      ) : null}

      {folders.map((g) => (
        <FieldCard key={g.id} title={g.label} open={cardOpen(g.id)} onToggle={() => flip(g.id)}>
          {g.fields.map((d) => (
            <div key={d.id} className="flex h-[40px] items-center">
              <Checkbox
                checked={isPicked(d.id)}
                onChange={() => toggle(d.id)}
                label={d.label}
                className="min-w-0 flex-1"
              />
            </div>
          ))}
        </FieldCard>
      ))}
    </SideDrawer>
  );
}
