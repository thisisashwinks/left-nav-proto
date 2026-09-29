"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronDown,
  ExternalLink,
  Home,
  Plus,
  Search,
  Unlink,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import {
  CreateCompanyDrawer,
  CreatePropertyDrawer,
} from "@/components/contacts/association-create-drawers";
import {
  LINKABLE,
  type AssocCompany,
  type AssocContact,
  type AssocProperty,
  type AssociationKind,
  type Associations,
} from "@/components/contacts/associations-data";
import { ToneAvatar } from "@/components/page/avatar";
import { TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The Associations panel — the records this contact is tied to, and the two
 * ways to tie another one on: make it here, or pick one that already exists.
 *
 * Controlled on purpose. The panel is one of several views of the same
 * record, and the inbox and the record page both open it; the associations
 * belong to the record, so whoever holds the record holds them, and this file
 * only draws them and reports edits.
 */

/* ─── Shared furniture ──────────────────────────────────────────────────── */

/*
 * Above SideDrawer (z-80) and the create drawers that portal over it, below
 * modals (z-95). Same pair the create-view drawer's dropdown uses.
 */
const Z_CATCHER = "z-[90]";
const Z_MENU = "z-[91]";

const MENU_SHADOW =
  "shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]";

/**
 * Portal to body, still in the page's theme.
 *
 * The --pg-* tokens hang off data-page-theme, and body sits outside the node
 * that carries it — so a bare portal would draw a light menu over a dark
 * drawer. Re-stating the attribute on the portal root is how the modal and
 * the toast solve the same thing.
 */
function ThemedPortal({ children }: { children: React.ReactNode }) {
  const { effective } = useTheme();
  return createPortal(
    <div data-page-theme={effective.appTheme}>{children}</div>,
    document.body,
  );
}

/**
 * Close on Escape, and on any scroll that is not inside the menu itself.
 *
 * The menus are fixed to the viewport, measured once from their trigger; a
 * scroll of the drawer body moves the trigger out from under them, and a menu
 * left hanging where its trigger used to be is worse than one that closes.
 * Escape is caught in the capture phase and stopped, so it closes the menu
 * and not the drawer the menu sits in.
 */
function useFloatingDismiss(
  open: boolean,
  close: () => void,
  menuRef: React.RefObject<HTMLElement | null>,
) {
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    const onScroll = (e: Event) => {
      if (e.target instanceof Node && menuRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", close);
    };
  }, [open, close, menuRef]);
}

/* ─── + Add menu ────────────────────────────────────────────────────────── */

export interface AddMenuItem {
  label: string;
  onSelect: () => void;
}

const ADD_MENU_W = 196;

/**
 * "+ Add", and the two-line menu it opens.
 *
 * Right-aligned under the trigger, because the trigger lives at the right
 * edge of a section header and a left-aligned menu would run off the drawer.
 * The caret stays over the trigger wherever the card lands, so the menu
 * still says which "+ Add" it came from when three of them are stacked.
 */
export function AddMenu({
  items,
  label = "Add",
  "aria-label": ariaLabel,
  className,
}: {
  items: AddMenuItem[];
  label?: React.ReactNode;
  "aria-label"?: string;
  className?: string;
}) {
  const trigger = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [place, setPlace] = React.useState<{
    left: number;
    top: number;
    caret: number;
  } | null>(null);
  const open = place !== null;
  const close = React.useCallback(() => setPlace(null), []);
  useFloatingDismiss(open, close, menuRef);

  const openMenu = () => {
    const el = trigger.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const left = Math.max(
      8,
      Math.min(r.right - ADD_MENU_W + 4, window.innerWidth - ADD_MENU_W - 8),
    );
    setPlace({ left, top: r.bottom + 8, caret: r.left + r.width / 2 - left });
  };

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        className={cn(
          "flex h-[24px] shrink-0 items-center gap-[3px] rounded-[6px] px-[5px] text-[12.5px] leading-none font-medium text-brand motion-tap hover:bg-brand-soft",
          open && "bg-brand-soft",
          className,
        )}
      >
        <Plus size={13} aria-hidden="true" />
        {label}
      </button>

      {open ? (
        <ThemedPortal>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={close}
            className={cn("fixed inset-0 cursor-default", Z_CATCHER)}
          />
          <div
            ref={menuRef}
            role="menu"
            style={{ left: place.left, top: place.top, width: ADD_MENU_W }}
            className={cn(
              "motion-panel-in fixed rounded-[8px] bg-pg-surface p-[4px]",
              MENU_SHADOW,
              Z_MENU,
            )}
          >
            {/* The caret: a rotated square whose top two edges carry the border. */}
            <span
              aria-hidden="true"
              style={{ left: place.caret - 5 }}
              className="absolute -top-[5px] size-[10px] rotate-45 rounded-tl-[2px] bg-pg-surface shadow-[inset_1px_1px_0_0_var(--pg-border)]"
            />
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  item.onSelect();
                }}
                className="relative flex w-full items-center rounded-[6px] px-[10px] py-[7px] text-left text-[13px] leading-[18px] text-pg-text motion-tap hover:bg-pg"
              >
                {item.label}
              </button>
            ))}
          </div>
        </ThemedPortal>
      ) : null}
    </>
  );
}

/* ─── Empty section ─────────────────────────────────────────────────────── */

/** "No company associated", and the two ways out of it. */
export function AssociateEmpty({
  title,
  hint,
  onCreate,
  onLink,
  createLabel = "Create new",
  linkLabel = "Link existing",
}: {
  title: string;
  hint?: string;
  onCreate: () => void;
  onLink: () => void;
  createLabel?: string;
  linkLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-[10px] py-[10px] text-center">
      <div className="flex flex-col gap-[2px]">
        <span className="text-[13px] leading-[18px] font-semibold text-pg-text-strong">
          {title}
        </span>
        {hint ? (
          <span className="text-[12.5px] leading-[17px] text-pg-muted">{hint}</span>
        ) : null}
      </div>
      <span className="flex gap-[8px]">
        <OutlineButton onClick={onCreate} className="h-[30px] px-[11px] text-[12.5px]">
          {createLabel}
        </OutlineButton>
        {/*
         * Tinted rather than filled: linking is the likelier of the two, but a
         * filled button in every empty section would put three primaries on
         * one panel.
         */}
        <button
          type="button"
          onClick={onLink}
          className="flex h-[30px] shrink-0 items-center rounded-[8px] bg-brand-soft px-[11px] text-[12.5px] leading-none font-medium whitespace-nowrap text-brand motion-tap hover:brightness-95 active:scale-[0.97]"
        >
          {linkLabel}
        </button>
      </span>
    </div>
  );
}

/* ─── Link existing ─────────────────────────────────────────────────────── */

type OptionText = { primary: string; secondary?: string };

/**
 * The "Add company to Deon Draijer" sub-view.
 *
 * It replaces the panel body rather than opening over it: picking from a
 * list is the only thing to do until it is done or abandoned, and a view that
 * owns the pane says so better than a popover would. The picks are held here
 * and only handed over on Save, so Cancel — or the back arrow — really is
 * nothing happened.
 *
 * Generic over the record so any panel that links things (an opportunity's
 * contacts, say) can reuse it with its own rows.
 */
export function LinkExistingView<T extends { id: string }>({
  title,
  fieldLabel,
  placeholder,
  emptyLabel,
  emptyIcon: EmptyIcon = UserRound,
  options,
  renderOption,
  onCancel,
  onSave,
}: {
  title: string;
  fieldLabel: string;
  placeholder: string;
  emptyLabel: string;
  emptyIcon?: LucideIcon;
  options: T[];
  renderOption: (o: T) => OptionText;
  onCancel: () => void;
  onSave: (picked: T[]) => void;
}) {
  const [picked, setPicked] = React.useState<T[]>([]);
  const pickedIds = new Set(picked.map((p) => p.id));
  const toggle = (o: T) =>
    setPicked((cur) =>
      cur.some((p) => p.id === o.id) ? cur.filter((p) => p.id !== o.id) : [...cur, o],
    );

  return (
    <div className="flex min-h-full flex-col">
      <button
        type="button"
        onClick={onCancel}
        className="-mx-[4px] mt-[10px] flex min-w-0 items-center gap-[7px] rounded-[6px] px-[4px] py-[4px] text-left motion-tap hover:bg-pg"
      >
        <ArrowLeft size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
        <span className="min-w-0 truncate text-[13.5px] leading-[18px] font-semibold text-pg-heading">
          {title}
        </span>
      </button>

      <div className="flex flex-col gap-[4px] pt-[12px]">
        <span className="text-[12.5px] leading-[16px] font-medium text-pg-text-strong">
          {fieldLabel}
        </span>
        <MultiSelect
          aria-label={fieldLabel}
          placeholder={placeholder}
          options={options}
          renderOption={renderOption}
          pickedIds={pickedIds}
          onToggle={toggle}
        />
      </div>

      {picked.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-[10px] py-[40px] text-center">
          <span className="flex size-[48px] items-center justify-center rounded-full bg-pg text-pg-muted">
            <EmptyIcon size={22} aria-hidden="true" />
          </span>
          <span className="text-[13px] leading-[18px] font-semibold text-pg-text-strong">
            {emptyLabel}
          </span>
        </div>
      ) : (
        <ul className="flex flex-1 flex-col gap-[2px] pt-[12px] pb-[12px]">
          {picked.map((p) => {
            const text = renderOption(p);
            return (
              <li
                key={p.id}
                className="group flex items-center gap-[9px] rounded-[8px] px-[6px] py-[6px] hover:bg-pg"
              >
                <ToneAvatar name={text.primary} tone={toneFor(p.id)} size={26} />
                <OptionLines text={text} />
                <button
                  type="button"
                  aria-label={`Remove ${text.primary}`}
                  onClick={() => toggle(p)}
                  className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint motion-tap hover:bg-pg-surface hover:text-pg-text active:scale-90"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/*
       * Pinned to the bottom of the drawer body, full-bleed so its rule
       * reaches both edges the way the drawer's own footer does.
       */}
      <div className="sticky bottom-0 -mx-[14px] mt-auto flex shrink-0 items-center justify-end gap-[8px] border-t border-pg-head-border bg-pg-surface px-[14px] py-[11px]">
        <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
        <PrimaryButton
          disabled={picked.length === 0}
          onClick={() => onSave(picked)}
          className="disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
        >
          {picked.length > 1 ? `Save ${picked.length}` : "Save"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function OptionLines({ text }: { text: OptionText }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate text-[13px] leading-[18px] font-medium text-pg-text-strong">
        {text.primary}
      </span>
      {text.secondary ? (
        <span className="truncate text-[12px] leading-[16px] text-pg-muted">
          {text.secondary}
        </span>
      ) : null}
    </span>
  );
}

/**
 * A select-shaped trigger over a searchable, checkable list.
 *
 * The list stays open across picks — you came here to pick several — and the
 * trigger shows how many are in, while the rows below the field show which.
 */
function MultiSelect<T extends { id: string }>({
  options,
  renderOption,
  pickedIds,
  onToggle,
  placeholder,
  "aria-label": ariaLabel,
}: {
  options: T[];
  renderOption: (o: T) => OptionText;
  pickedIds: Set<string>;
  onToggle: (o: T) => void;
  placeholder: string;
  "aria-label": string;
}) {
  const trigger = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState("");
  const [place, setPlace] = React.useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
  } | null>(null);
  const open = place !== null;
  const close = React.useCallback(() => setPlace(null), []);
  useFloatingDismiss(open, close, menuRef);

  const openMenu = () => {
    const el = trigger.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuH = 300;
    const below = window.innerHeight - r.bottom;
    setQuery("");
    setPlace(
      below < menuH + 12 && r.top > below
        ? { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 4 }
        : { left: r.left, width: r.width, top: r.bottom + 4 },
    );
  };

  const q = query.trim().toLowerCase();
  const shown = q
    ? options.filter((o) => {
        const t = renderOption(o);
        return `${t.primary} ${t.secondary ?? ""}`.toLowerCase().includes(q);
      })
    : options;
  const count = pickedIds.size;

  return (
    <>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => (open ? close() : openMenu())}
        className={cn(
          "flex h-[36px] w-full items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-left text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", count ? "text-pg-text" : "text-pg-faint")}>
          {count ? `${count} selected` : placeholder}
        </span>
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-faint transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <ThemedPortal>
          <button
            type="button"
            aria-label="Close options"
            tabIndex={-1}
            onClick={close}
            className={cn("fixed inset-0 cursor-default", Z_CATCHER)}
          />
          <div
            ref={menuRef}
            style={{ left: place.left, width: place.width, top: place.top, bottom: place.bottom }}
            className={cn(
              "fixed flex max-h-[300px] flex-col overflow-hidden rounded-[8px] bg-pg-surface",
              MENU_SHADOW,
              Z_MENU,
            )}
          >
            <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
              <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                aria-label="Search"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>
            <div
              role="listbox"
              aria-multiselectable="true"
              aria-label={ariaLabel}
              className="min-h-0 flex-1 overflow-y-auto p-[4px]"
            >
              {shown.length === 0 ? (
                <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                  {options.length === 0 ? "Everything here is already linked" : "No matches"}
                </p>
              ) : null}
              {shown.map((o) => {
                const on = pickedIds.has(o.id);
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => onToggle(o)}
                    className="flex w-full items-center gap-[9px] rounded-[6px] px-[8px] py-[6px] text-left motion-tap hover:bg-pg"
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
                        on
                          ? "bg-brand text-brand-fg"
                          : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                      )}
                    >
                      {on ? <Check size={11} strokeWidth={3} /> : null}
                    </span>
                    <OptionLines text={renderOption(o)} />
                  </button>
                );
              })}
            </div>
          </div>
        </ThemedPortal>
      ) : null}
    </>
  );
}

/* ─── Rows ──────────────────────────────────────────────────────────────── */

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

/** A stable tone per record, so a company keeps its colour between visits. */
function toneFor(id: string): AvatarTone {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

function contactText(c: AssocContact): OptionText {
  const secondary = [c.email, c.phone].filter(Boolean).join(" · ");
  return { primary: c.name, secondary: secondary || undefined };
}

function companyText(c: AssocCompany): OptionText {
  const place = [c.city, c.state].filter(Boolean).join(", ");
  const secondary = [place, c.website].filter(Boolean).join(" · ");
  return { primary: c.name, secondary: secondary || undefined };
}

/** "1428 Elm Street, Springfield, IL 62704" → street, then the rest. */
function propertyText(p: AssocProperty): OptionText {
  const at = p.address.indexOf(",");
  return at === -1
    ? { primary: p.address }
    : { primary: p.address.slice(0, at), secondary: p.address.slice(at + 1).trim() };
}

/**
 * One linked record. Unlink appears on hover — and on focus, so it is still
 * reachable from the keyboard — because a column of always-on X buttons reads
 * as a list waiting to be emptied.
 */
function AssocRow({
  lead,
  text,
  onUnlink,
}: {
  lead: React.ReactNode;
  text: OptionText;
  onUnlink: () => void;
}) {
  return (
    <div className="group -mx-[6px] flex items-center gap-[9px] rounded-[8px] px-[6px] py-[6px] hover:bg-pg">
      {lead}
      <OptionLines text={text} />
      <button
        type="button"
        title="Unlink"
        aria-label={`Unlink ${text.primary}`}
        onClick={onUnlink}
        className="flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted opacity-0 motion-tap group-hover:opacity-100 hover:bg-pg-surface hover:text-pg-danger focus-visible:opacity-100 active:scale-90"
      >
        <Unlink size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

function IconDisc({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
    >
      <Icon size={14} />
    </span>
  );
}

/* ─── Sections ──────────────────────────────────────────────────────────── */

const KIND: Record<
  AssociationKind,
  { label: string; one: string; many: string; icon: LucideIcon }
> = {
  contacts: { label: "Contacts", one: "contact", many: "contacts", icon: UserRound },
  companies: { label: "Companies", one: "company", many: "companies", icon: Building2 },
  properties: { label: "Properties", one: "property", many: "properties", icon: Home },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "Company linked", "3 companies linked". */
function countedToast(kind: AssociationKind, n: number, verb: string) {
  const k = KIND[kind];
  return n === 1 ? `${cap(k.one)} ${verb}` : `${n} ${k.many} ${verb}`;
}

function AssocSection({
  kind,
  count,
  open,
  onToggle,
  onCreate,
  onLink,
  children,
}: {
  kind: AssociationKind;
  count: number;
  open: boolean;
  onToggle: () => void;
  onCreate: () => void;
  onLink: () => void;
  children: React.ReactNode;
}) {
  const k = KIND[kind];
  const bodyId = React.useId();
  return (
    <div className="border-b border-pg-row-border py-[10px] last:border-b-0">
      <div className="flex items-center gap-[6px]">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="min-w-0 flex-1 text-left text-[13px] leading-[18px] font-semibold text-pg-heading motion-tap"
        >
          {k.label} ({count})
        </button>
        <AddMenu
          aria-label={`Add ${k.one}`}
          items={[
            { label: `Create new ${k.one}`, onSelect: onCreate },
            { label: `Link existing ${k.one}`, onSelect: onLink },
          ]}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={open ? `Collapse ${k.many}` : `Expand ${k.many}`}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-text"
        >
          <ChevronDown
            size={15}
            aria-hidden="true"
            className={cn("transition-transform duration-200", open ? "rotate-0" : "-rotate-90")}
          />
        </button>
      </div>
      {open ? (
        <div id={bodyId} className="pt-[6px]">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * "Create new" for a contact: three fields in the section itself.
 *
 * Companies and properties get a drawer because they carry a dozen fields; a
 * contact linked from here needs a name and one way to reach them, and a
 * drawer for that would be more furniture than form.
 */
function NewContactForm({
  onCancel,
  onSave,
}: {
  onCancel: () => void;
  onSave: (c: AssocContact) => void;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const ok = name.trim().length > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ok) return;
        onSave({
          id: `ac-new-${Date.now()}`,
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        });
      }}
      className="flex flex-col gap-[8px] rounded-[10px] bg-pg-surface p-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      <TextInput
        autoFocus
        aria-label="Name"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <TextInput
        type="email"
        aria-label="Email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextInput
        type="tel"
        aria-label="Phone"
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <div className="flex justify-end gap-[8px] pt-[2px]">
        <OutlineButton onClick={onCancel} className="h-[30px] px-[11px] text-[12.5px]">
          Cancel
        </OutlineButton>
        <PrimaryButton
          type="submit"
          disabled={!ok}
          className="h-[30px] px-[11px] text-[12.5px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
        >
          Add contact
        </PrimaryButton>
      </div>
    </form>
  );
}

/* ─── The panel ─────────────────────────────────────────────────────────── */

function withAdded<K extends AssociationKind>(
  v: Associations,
  kind: K,
  items: Associations[K],
): Associations {
  return { ...v, [kind]: [...v[kind], ...items] };
}

function withRemoved(v: Associations, kind: AssociationKind, id: string): Associations {
  return { ...v, [kind]: (v[kind] as { id: string }[]).filter((x) => x.id !== id) };
}

export function AssociationsBody({
  recordName,
  value,
  onChange,
}: {
  recordName: string;
  value: Associations;
  onChange: (next: Associations) => void;
}) {
  const [linking, setLinking] = React.useState<AssociationKind | null>(null);
  const [creating, setCreating] = React.useState<"companies" | "properties" | null>(null);
  const [newContact, setNewContact] = React.useState(false);
  /*
   * Contacts open regardless — it is the section people come here for — and
   * the others open only if there is something in them to see.
   */
  const [open, setOpen] = React.useState<Record<AssociationKind, boolean>>(() => ({
    contacts: true,
    companies: value.companies.length > 0,
    properties: value.properties.length > 0,
  }));
  const expand = (kind: AssociationKind) => setOpen((o) => ({ ...o, [kind]: true }));
  const toggle = (kind: AssociationKind) => setOpen((o) => ({ ...o, [kind]: !o[kind] }));

  const add = <K extends AssociationKind>(kind: K, items: Associations[K], verb: string) => {
    onChange(withAdded(value, kind, items));
    expand(kind);
    showToast(countedToast(kind, items.length, verb));
  };
  const unlink = (kind: AssociationKind, id: string) => {
    onChange(withRemoved(value, kind, id));
    showToast(countedToast(kind, 1, "unlinked"));
  };

  const startCreate = (kind: AssociationKind) => {
    if (kind === "contacts") {
      expand("contacts");
      setNewContact(true);
    } else {
      setCreating(kind);
    }
  };

  /** What "Link existing" offers: the pool, less what is already linked. */
  const unlinked = <T extends { id: string }>(pool: T[], linked: T[]) => {
    const have = new Set(linked.map((x) => x.id));
    return pool.filter((x) => !have.has(x.id));
  };

  if (linking) {
    const k = KIND[linking];
    const shared = {
      title: `Add ${k.one} to ${recordName}`,
      fieldLabel: `Select ${k.many}`,
      placeholder: `Select ${k.many}`,
      emptyLabel: `Select ${k.many} to proceed`,
      emptyIcon: k.icon,
      onCancel: () => setLinking(null),
    };
    const done = () => setLinking(null);
    if (linking === "contacts") {
      return (
        <LinkExistingView
          {...shared}
          options={unlinked(LINKABLE.contacts, value.contacts)}
          renderOption={contactText}
          onSave={(picked) => {
            add("contacts", picked, "linked");
            done();
          }}
        />
      );
    }
    if (linking === "companies") {
      return (
        <LinkExistingView
          {...shared}
          options={unlinked(LINKABLE.companies, value.companies)}
          renderOption={companyText}
          onSave={(picked) => {
            add("companies", picked, "linked");
            done();
          }}
        />
      );
    }
    return (
      <LinkExistingView
        {...shared}
        options={unlinked(LINKABLE.properties, value.properties)}
        renderOption={propertyText}
        onSave={(picked) => {
          add("properties", picked, "linked");
          done();
        }}
      />
    );
  }

  const section = (kind: AssociationKind, rows: React.ReactNode, extra?: React.ReactNode) => (
    <AssocSection
      kind={kind}
      count={value[kind].length}
      open={open[kind]}
      onToggle={() => toggle(kind)}
      onCreate={() => startCreate(kind)}
      onLink={() => setLinking(kind)}
    >
      {extra}
      {value[kind].length === 0 && !extra ? (
        <AssociateEmpty
          title={`No ${KIND[kind].one} associated`}
          onCreate={() => startCreate(kind)}
          onLink={() => setLinking(kind)}
        />
      ) : (
        <div className="flex flex-col">{rows}</div>
      )}
    </AssocSection>
  );

  return (
    <div className="py-[4px]">
      {section(
        "contacts",
        value.contacts.map((c) => (
          <AssocRow
            key={c.id}
            lead={<ToneAvatar name={c.name} tone={toneFor(c.id)} size={26} round />}
            text={contactText(c)}
            onUnlink={() => unlink("contacts", c.id)}
          />
        )),
        newContact ? (
          <div className="pb-[6px]">
            <NewContactForm
              onCancel={() => setNewContact(false)}
              onSave={(c) => {
                setNewContact(false);
                add("contacts", [c], "created and linked");
              }}
            />
          </div>
        ) : undefined,
      )}
      {section(
        "companies",
        value.companies.map((c) => (
          <AssocRow
            key={c.id}
            lead={<ToneAvatar name={c.name} tone={toneFor(c.id)} size={26} />}
            text={companyText(c)}
            onUnlink={() => unlink("companies", c.id)}
          />
        )),
      )}
      {section(
        "properties",
        value.properties.map((p) => (
          <AssocRow
            key={p.id}
            lead={<IconDisc icon={Home} />}
            text={propertyText(p)}
            onUnlink={() => unlink("properties", p.id)}
          />
        )),
      )}

      {creating === "companies" ? (
        <CreateCompanyDrawer
          onClose={() => setCreating(null)}
          onSave={(c) => {
            setCreating(null);
            add("companies", [c], "created and linked");
          }}
        />
      ) : null}
      {creating === "properties" ? (
        <CreatePropertyDrawer
          onClose={() => setCreating(null)}
          onSave={(p) => {
            setCreating(null);
            add("properties", [p], "created and linked");
          }}
        />
      ) : null}
    </div>
  );
}

/** The panel header's trailing link. Settings live elsewhere; this says so. */
export function ManageAssociationsLink() {
  return (
    <button
      type="button"
      onClick={() => showToast("Association settings open in a new tab")}
      className="flex shrink-0 items-center gap-[4px] text-[12.5px] leading-none font-medium text-pg-text-strong motion-tap hover:text-brand"
    >
      <ExternalLink size={13} aria-hidden="true" />
      Manage associations
    </button>
  );
}
