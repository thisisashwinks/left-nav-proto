"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Building2,
  Check,
  CircleDollarSign,
  Info,
  Plus,
  Search,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import { ToneAvatar } from "@/components/page/avatar";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * "Associated objects" — the block the note and task forms share for linking
 * what they are writing to other records.
 *
 * A note written on one contact is often about a deal or a company too, and
 * the point of associating it is that it then shows up on THOSE records'
 * rails as well. So the block reads as a short list of chips grouped by kind,
 * each kind with its own cap, and the record the panel is open on is already
 * in the list and cannot be taken out — writing a note on Sukarto that is not
 * on Sukarto is not a thing anyone means to do.
 */

export interface AssociatedObject {
  id: string;
  kind: "contacts" | "companies" | "opportunities";
  name: string;
  initials: string;
}

type Kind = AssociatedObject["kind"];

const KINDS: { kind: Kind; one: string; many: string; icon: LucideIcon }[] = [
  { kind: "contacts", one: "Contact", many: "Contacts", icon: UserRound },
  { kind: "companies", one: "Company", many: "Companies", icon: Building2 },
  { kind: "opportunities", one: "Opportunity", many: "Opportunities", icon: CircleDollarSign },
];

/*
 * What the picker offers. Local and invented — the prototype has no join
 * between the rail and the contacts store, and five or six per kind is enough
 * to search, fill a cap, and see the chips wrap.
 */
const OPTIONS: Record<Kind, AssociatedObject[]> = {
  contacts: [
    { id: "c-vishnupriya", kind: "contacts", name: "vishnupriya poduval", initials: "VP" },
    { id: "c-nikhil", kind: "contacts", name: "nikhil satish", initials: "NS" },
    { id: "c-samrina", kind: "contacts", name: "Samrina Shabha", initials: "SS" },
    { id: "c-johnny", kind: "contacts", name: "Johnny Niumata", initials: "JN" },
    { id: "c-mei", kind: "contacts", name: "mei lin tan", initials: "MT" },
    { id: "c-oscar", kind: "contacts", name: "Oscar Delgado", initials: "OD" },
  ],
  companies: [
    { id: "co-golden", kind: "companies", name: "Golden Boost", initials: "GB" },
    { id: "co-clearview", kind: "companies", name: "Clearview Window Cleaning", initials: "CW" },
    { id: "co-harding", kind: "companies", name: "Harding & Sons Joinery", initials: "HS" },
    { id: "co-rapid", kind: "companies", name: "24/7 Rapid Plumbing", initials: "RP" },
    { id: "co-northwind", kind: "companies", name: "Northwind Dental", initials: "ND" },
  ],
  opportunities: [
    { id: "op-annual", kind: "opportunities", name: "Annual retainer renewal", initials: "AR" },
    { id: "op-website", kind: "opportunities", name: "Website redesign", initials: "WR" },
    { id: "op-seo", kind: "opportunities", name: "Local SEO package", initials: "LS" },
    { id: "op-ads", kind: "opportunities", name: "Google Ads setup", initials: "GA" },
    { id: "op-launch", kind: "opportunities", name: "Spring launch campaign", initials: "SL" },
    { id: "op-upsell", kind: "opportunities", name: "Pro plan upsell", initials: "PU" },
  ],
};

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

/** A stable tone per id, so a chip keeps its colour across renders and screens. */
export function toneFor(id: string): AvatarTone {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

/* ─── Anchored popover ──────────────────────────────────────────────────── */

/**
 * A card that hangs off a trigger, portalled out of whatever scrolls.
 *
 * The record rail's body is a scroll container, and an absolutely positioned
 * menu inside it gets clipped at the drawer's edge — so this one is fixed to
 * the viewport from the trigger's rect and stamped with the page theme, the
 * same trick the modal uses. z-[90] puts it over the drawer (80) and under
 * the modal (95).
 *
 * Positioned imperatively in a layout effect rather than through state: the
 * card has to be measured before it knows whether it fits below the trigger,
 * and writing the result straight to its style lands before paint without a
 * second render. Scroll and resize re-run the same function.
 *
 * Escape is caught in the capture phase and stopped, so it closes the
 * popover and leaves the drawer under it open.
 */
export function AnchoredPopover({
  anchor,
  onClose,
  children,
  width,
  align = "start",
  caret = false,
  className,
  label,
}: {
  /** The trigger. Held in state by the caller from the click's currentTarget. */
  anchor: HTMLElement;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  align?: "start" | "end";
  /** A small notch pointing at the trigger — the kebab menus. */
  caret?: boolean;
  className?: string;
  label?: string;
}) {
  const { effective } = useTheme();
  const ref = React.useRef<HTMLDivElement>(null);
  const caretRef = React.useRef<HTMLSpanElement>(null);

  React.useLayoutEffect(() => {
    const place = () => {
      const el = ref.current;
      if (!el) return;
      const a = anchor.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const gap = caret ? 8 : 4;
      const below = a.bottom + gap + h <= window.innerHeight - 8 || a.top - gap - h < 8;
      const top = below ? a.bottom + gap : a.top - gap - h;
      let left = align === "end" ? a.right - w : a.left;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      el.style.top = `${Math.round(top)}px`;
      el.style.left = `${Math.round(left)}px`;
      el.style.visibility = "visible";
      const c = caretRef.current;
      if (c) {
        const x = a.left + a.width / 2 - left - 5;
        c.style.left = `${Math.round(Math.max(8, Math.min(x, w - 18)))}px`;
        c.style.top = below ? "-5px" : "";
        c.style.bottom = below ? "" : "-5px";
      }
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    const ro = new ResizeObserver(place);
    if (ref.current) ro.observe(ref.current);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
      ro.disconnect();
    };
  }, [anchor, align, caret]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor.contains(t)) return;
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [anchor, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div data-page-theme={effective.appTheme} className="contents">
      <div
        ref={ref}
        role="dialog"
        aria-label={label}
        style={{ width, visibility: "hidden" }}
        className={cn(
          "motion-fade-in fixed top-0 left-0 z-[90] flex flex-col rounded-[8px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]",
          className,
        )}
      >
        {caret ? (
          <span
            ref={caretRef}
            aria-hidden="true"
            className="absolute size-[10px] rotate-45 bg-pg-surface shadow-[inset_1px_1px_0_0_var(--pg-border)]"
          />
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** One row of a popover menu. */
export function MenuRow({
  icon: Icon,
  label,
  onClick,
  danger,
  trailing,
}: {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "relative flex h-[36px] w-full items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] motion-tap hover:bg-pg",
        danger ? "text-[var(--pg-status-overdue-fg)]" : "text-pg-text",
      )}
    >
      {Icon ? (
        <Icon
          size={15}
          aria-hidden="true"
          className={cn("shrink-0", danger ? "" : "text-pg-muted")}
        />
      ) : null}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing}
    </button>
  );
}

/* ─── The block ─────────────────────────────────────────────────────────── */

type Open =
  | { what: "kinds"; anchor: HTMLElement }
  | { what: "picker"; kind: Kind; anchor: HTMLElement }
  | null;

export function AssociatedObjects({
  value,
  onChange,
  limits,
  locked = [],
}: {
  value: AssociatedObject[];
  onChange: (next: AssociatedObject[]) => void;
  /** Per-kind max, e.g. { contacts: 10 } for tasks, { contacts: 1 } for notes. */
  limits: Partial<Record<Kind, number>>;
  /** Ids that can't be removed (the record the panel is open on). */
  locked?: string[];
}) {
  const [open, setOpen] = React.useState<Open>(null);
  const close = React.useCallback(() => setOpen(null), []);

  // Only the kinds the caller gave a cap to are on offer at all.
  const offered = KINDS.filter((k) => (limits[k.kind] ?? 0) > 0);
  const countOf = (kind: Kind) => value.filter((v) => v.kind === kind).length;
  const hasRoom = (kind: Kind) => countOf(kind) < (limits[kind] ?? 0);
  const withRoom = offered.filter((k) => hasRoom(k.kind));

  const remove = (id: string) => onChange(value.filter((v) => v.id !== id));

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex items-center gap-[6px]">
        <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
          Associated objects
        </span>
        <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-pg px-[6px] text-[12px] leading-none font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {value.length}
        </span>
        <span
          title="Link this to other records so it shows up on each of them."
          className="flex text-pg-faint"
        >
          <Info size={14} aria-label="Link this to other records so it shows up on each of them." />
        </span>
        <span className="flex-1" />
        <button
          type="button"
          aria-label="Add association"
          aria-haspopup="menu"
          aria-expanded={open?.what === "kinds"}
          disabled={withRoom.length === 0}
          onClick={(e) => {
            const anchor = e.currentTarget;
            setOpen((o) => (o?.what === "kinds" ? null : { what: "kinds", anchor }));
          }}
          className={cn(
            "flex size-[32px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap",
            withRoom.length === 0
              ? "cursor-not-allowed opacity-50"
              : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-90",
          )}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>

      {offered.map((k) => {
        const items = value.filter((v) => v.kind === k.kind);
        if (items.length === 0) return null;
        const limit = limits[k.kind] ?? 0;
        return (
          <div key={k.kind} className="flex flex-col gap-[6px]">
            <span className="text-[13px] leading-[18px] text-pg-muted">
              {k.many} ({items.length}/{limit})
            </span>
            <div className="flex flex-wrap items-center gap-[6px]">
              {items.length < limit ? (
                <button
                  type="button"
                  aria-label={`Add ${k.one.toLowerCase()}`}
                  onClick={(e) => {
                    const anchor = e.currentTarget;
                    setOpen({ what: "picker", kind: k.kind, anchor });
                  }}
                  className="flex size-[28px] shrink-0 items-center justify-center rounded-[6px] bg-brand-soft text-brand motion-tap hover:brightness-95 active:scale-90"
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              ) : null}
              {items.map((item) => {
                const isLocked = locked.includes(item.id);
                return (
                  <span
                    key={item.id}
                    className="flex h-[28px] max-w-full min-w-0 items-center gap-[6px] rounded-full bg-pg-surface pr-[8px] pl-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
                  >
                    <ToneAvatar
                      name={item.name}
                      initials={item.initials}
                      tone={toneFor(item.id)}
                      size={22}
                      round
                    />
                    <span className="min-w-0 truncate text-[13px] leading-[18px] text-pg-text-strong">
                      {item.name}
                    </span>
                    {isLocked ? null : (
                      <button
                        type="button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => remove(item.id)}
                        className="-mr-[3px] flex size-[18px] shrink-0 items-center justify-center rounded-full text-pg-faint motion-tap hover:bg-pg hover:text-pg-text"
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}

      {open?.what === "kinds" ? (
        <AnchoredPopover anchor={open.anchor} onClose={close} width={200} align="end" label="Add association">
          <div role="menu" className="flex flex-col p-[4px]">
            {withRoom.map((k) => (
              <MenuRow
                key={k.kind}
                icon={k.icon}
                label={k.one}
                onClick={() => setOpen({ what: "picker", kind: k.kind, anchor: open.anchor })}
              />
            ))}
          </div>
        </AnchoredPopover>
      ) : null}

      {open?.what === "picker" ? (
        <AnchoredPopover
          key={open.kind}
          anchor={open.anchor}
          onClose={close}
          width={260}
          align={open.anchor.getAttribute("aria-haspopup") ? "end" : "start"}
          label={`Choose ${KINDS.find((k) => k.kind === open.kind)?.many.toLowerCase()}`}
        >
          <Picker
            kind={open.kind}
            value={value}
            locked={locked}
            limit={limits[open.kind] ?? 0}
            onChange={(next) => {
              onChange(next);
              // At the cap there is nothing more to pick, so the list goes.
              if (next.filter((v) => v.kind === open.kind).length >= (limits[open.kind] ?? 0)) {
                close();
              }
            }}
          />
        </AnchoredPopover>
      ) : null}
    </div>
  );
}

/** The searchable list behind one kind. Picking toggles; locked rows stay on. */
function Picker({
  kind,
  value,
  locked,
  limit,
  onChange,
}: {
  kind: Kind;
  value: AssociatedObject[];
  locked: string[];
  limit: number;
  onChange: (next: AssociatedObject[]) => void;
}) {
  const [query, setQuery] = React.useState("");
  const def = KINDS.find((k) => k.kind === kind)!;
  // The picked items that are not in the invented list (the record itself)
  // still show, so the list says what is already on and what is not.
  const extra = value.filter((v) => v.kind === kind && !OPTIONS[kind].some((o) => o.id === v.id));
  const all = [...extra, ...OPTIONS[kind]];
  const q = query.trim().toLowerCase();
  const shown = q ? all.filter((o) => o.name.toLowerCase().includes(q)) : all;
  const full = value.filter((v) => v.kind === kind).length >= limit;

  return (
    <div className="flex max-h-[300px] flex-col">
      <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${def.many.toLowerCase()}`}
          aria-label={`Search ${def.many.toLowerCase()}`}
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <div role="listbox" aria-multiselectable="true" className="min-h-0 flex-1 overflow-y-auto p-[4px]">
        {shown.length === 0 ? (
          <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
            No {def.many.toLowerCase()} match your search
          </p>
        ) : null}
        {shown.map((o) => {
          const on = value.some((v) => v.id === o.id);
          const isLocked = locked.includes(o.id);
          const disabled = isLocked || (!on && full);
          return (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={on}
              disabled={disabled}
              onClick={() =>
                onChange(on ? value.filter((v) => v.id !== o.id) : [...value, o])
              }
              className={cn(
                "flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[6px] text-left motion-tap",
                disabled ? "cursor-default" : "hover:bg-pg",
                !on && full && "opacity-50",
              )}
            >
              <ToneAvatar name={o.name} initials={o.initials} tone={toneFor(o.id)} size={24} round />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                  on ? "font-medium text-pg-heading" : "text-pg-text",
                )}
              >
                {o.name}
              </span>
              {on ? <Check size={14} aria-hidden="true" className="shrink-0 text-brand" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
