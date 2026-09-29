"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  CalendarPlus,
  FileText,
  MessageSquareMore,
  PhoneCall,
  SquareCheck,
  Tag,
  UserRoundX,
  type LucideIcon,
} from "lucide-react";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import { ToneAvatar } from "@/components/page/avatar";
import { Checkbox } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import {
  CARD_FIELD_LABEL,
  DEFAULT_CARD_CONFIG,
  type CardConfig,
  type CardFieldId,
  type QuickActionId,
} from "./card-config";
import { stages, type Opportunity } from "./opportunities-data";

/* ------------------------------------------------------------------ */
/* List tooltip                                                        */
/* ------------------------------------------------------------------ */

/** Past this many lines the list stops and says how many it left out. */
const TOOLTIP_MAX_LINES = 15;
const TOOLTIP_GAP = 6;
const VIEWPORT_PAD = 8;

/**
 * A dark list, one item per line, above whatever it wraps.
 *
 * Near-black in BOTH themes on purpose: a tooltip is a transient layer over
 * the page, not part of it, and a light one in light mode reads as another
 * card sitting on the board. Portalled so the column's scroll and the
 * board's overflow cannot clip it, and flipped below when there is no room
 * above — the first card in a column sits right under the stage header.
 *
 * It opens on focus as well as hover, so the list a keyboard user tabs to is
 * the same list a mouse user points at.
 */
export function ListTooltip({
  items,
  title,
  children,
}: {
  items: string[];
  title?: string;
  children: React.ReactElement;
}) {
  const id = React.useId();
  const anchorRef = React.useRef<HTMLSpanElement>(null);
  const tipRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);

  /*
   * Measure after the tip renders (hidden, at 0,0), then place it by writing
   * the node's style directly. Layout effect so the first painted frame is
   * already in the right spot, and no second render just to move it.
   */
  React.useLayoutEffect(() => {
    if (!open) return;
    const anchor = anchorRef.current;
    const tip = tipRef.current;
    if (!anchor || !tip) return;
    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const above = a.top - TOOLTIP_GAP - t.height;
    const top = above >= VIEWPORT_PAD ? above : a.bottom + TOOLTIP_GAP;
    const left = Math.min(
      Math.max(VIEWPORT_PAD, a.left + a.width / 2 - t.width / 2),
      window.innerWidth - VIEWPORT_PAD - t.width,
    );
    tip.style.top = `${top}px`;
    tip.style.left = `${left}px`;
    tip.style.visibility = "visible";
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const close = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    // A scrolled column moves the trigger out from under a fixed tip.
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const shown = items.slice(0, TOOLTIP_MAX_LINES);
  const rest = items.length - shown.length;

  const child = React.cloneElement(
    children as React.ReactElement<{ "aria-describedby"?: string }>,
    { "aria-describedby": open ? id : undefined },
  );

  return (
    <span
      ref={anchorRef}
      className="inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {child}
      {open && items.length > 0
        ? createPortal(
            <div
              ref={tipRef}
              id={id}
              role="tooltip"
              style={{ position: "fixed", top: 0, left: 0, visibility: "hidden" }}
              className="pointer-events-none z-[9500] max-w-[260px] rounded-[6px] bg-[#101828] px-[10px] py-[8px] text-[13px] leading-[18px] text-white shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
            >
              {title ? <p className="mb-[4px] font-semibold">{title}</p> : null}
              <ul>
                {shown.map((item, i) => (
                  <li key={`${item}-${i}`} className="break-words">
                    {item}
                  </li>
                ))}
              </ul>
              {rest > 0 ? <p className="mt-[4px] text-white/70">+{rest} more</p> : null}
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const TONES: AvatarTone[] = ["blue", "pink", "green", "orange", "purple", "yellow", "teal"];

/**
 * The owner's tone, from their name.
 *
 * The record's own `tone` belongs to its CONTACT — the table's avatar column
 * — so borrowing it would paint the same owner a different color on every
 * card. Hashing the name keeps Samrina one color across the whole board.
 */
function toneFor(name: string): AvatarTone {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

function plural(n: number, one: string, many: string): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-09-30T15:00" → "Sep 30, 3:00 PM".
 *
 * Parsed by hand rather than through `Date`, so the server and the browser
 * cannot disagree about a timezone and trip hydration.
 */
function formatAppointment(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
  if (!m) return iso;
  const day = `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}`;
  if (!m[4]) return day;
  const h = Number(m[4]);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${day}, ${hour}:${m[5]} ${h < 12 ? "AM" : "PM"}`;
}

/** "2026-10-14" → "10/14/2026"; anything else is shown as stored. */
function formatDate(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return m ? `${m[2]}/${m[3]}/${m[1]}` : value;
}

const STATUS_LABEL: Record<NonNullable<Opportunity["status"]>, string> = {
  open: "Open",
  won: "Won",
  lost: "Lost",
  abandoned: "Abandoned",
};

/** Drawn in the top rows, so the field list below skips them. */
const HEADER_FIELDS: CardFieldId[] = ["name", "owner", "smartTags"];

/** A field's printable value, or null when the record does not have one. */
function fieldValue(record: Opportunity, field: CardFieldId): string | null {
  switch (field) {
    case "business":
      return record.business || null;
    case "source":
      return record.source || null;
    case "value":
      return record.value || null;
    case "lostReason":
      return record.lostReason || null;
    case "contact":
      return record.contact || null;
    case "phone":
      return record.phone || null;
    case "stage":
      return stages.find((s) => s.id === record.stageId)?.label ?? null;
    case "status":
      return record.status ? STATUS_LABEL[record.status] : null;
    case "expectedClose":
      return record.expectedClose ? formatDate(record.expectedClose) : null;
    case "updated":
      return record.updated || null;
    case "followers":
      return record.followers?.length ? record.followers.join(", ") : null;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Quick actions                                                       */
/* ------------------------------------------------------------------ */

function ActionIcon({
  icon: Icon,
  label,
  count,
  withTitle = true,
}: {
  icon: LucideIcon;
  label: string;
  count?: number;
  /** Off when a ListTooltip already explains the button. */
  withTitle?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={withTitle ? label : undefined}
      // The icons are their own targets; the card behind them opens the record.
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="relative flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted motion-tap hover:bg-pg hover:text-pg-heading focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none"
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      {count ? (
        <span
          aria-hidden="true"
          className="absolute top-[-2px] right-[-3px] flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-brand px-[3px] text-[10px] leading-none font-semibold text-white tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}

function QuickAction({ id, record }: { id: QuickActionId; record: Opportunity }) {
  switch (id) {
    case "call":
      // No number, nothing to dial: the icon would be a promise it can't keep.
      return record.phone ? (
        <ActionIcon icon={PhoneCall} label={`Call ${record.phone}`} />
      ) : null;
    case "unread": {
      const n = record.unread ?? 0;
      return (
        <ActionIcon
          icon={MessageSquareMore}
          label={n ? plural(n, "unread conversation", "unread conversations") : "No unread conversations"}
          count={n}
        />
      );
    }
    case "tags": {
      const tags = record.tags ?? [];
      const label = tags.length ? plural(tags.length, "tag", "tags") : "No tags";
      return tags.length ? (
        <ListTooltip items={tags} title="Tags">
          <ActionIcon icon={Tag} label={label} count={tags.length} withTitle={false} />
        </ListTooltip>
      ) : (
        <ActionIcon icon={Tag} label={label} />
      );
    }
    case "notes": {
      const n = record.notes ?? 0;
      return (
        <ActionIcon icon={FileText} label={n ? plural(n, "note", "notes") : "No notes"} count={n} />
      );
    }
    case "tasks": {
      const n = record.tasks ?? 0;
      return (
        <ActionIcon icon={SquareCheck} label={n ? plural(n, "task", "tasks") : "No tasks"} count={n} />
      );
    }
    case "appointment": {
      if (!record.nextAppointment) {
        return <ActionIcon icon={CalendarPlus} label="Book appointment" />;
      }
      const when = formatAppointment(record.nextAppointment);
      /*
       * A booked appointment is worth its words: the date is what someone
       * scanning the column wants, and an icon would make them hover for it.
       */
      return (
        <button
          type="button"
          title={`Next appointment: ${when}`}
          aria-label={`Next appointment: ${when}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          className="flex h-[24px] min-w-0 items-center gap-[4px] rounded-[6px] bg-brand-soft px-[6px] text-[12px] leading-[16px] font-medium whitespace-nowrap text-brand motion-tap focus-visible:shadow-[0_0_0_2px_var(--brand)] focus-visible:outline-none"
        >
          <CalendarPlus size={14} strokeWidth={1.75} aria-hidden="true" />
          {when}
        </button>
      );
    }
  }
}

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

/**
 * One opportunity on the board, drawn from a CardConfig.
 *
 * The same component renders the Customize card drawer's preview, with
 * `preview` switching off everything that answers the pointer — so what the
 * drawer shows is this card, not a drawing of it that can drift.
 *
 * Not a <button>: it holds a checkbox and icon buttons, and buttons do not
 * nest. It takes the button's role and keys instead, and the inner controls
 * stop their clicks so only the card's own surface opens the record.
 */
export function OpportunityCard({
  record,
  config = DEFAULT_CARD_CONFIG,
  selected = false,
  selectionMode = false,
  onToggleSelect,
  onOpen,
  draggable = false,
  onDragStart,
  onDragEnd,
  dragging = false,
  preview = false,
}: {
  record: Opportunity;
  config?: CardConfig;
  selected?: boolean;
  /** Checkbox always visible; otherwise it shows on hover and focus. */
  selectionMode?: boolean;
  onToggleSelect?: () => void;
  onOpen?: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
  /** Preview in the Customize card drawer: no hover affordances, not clickable. */
  preview?: boolean;
}) {
  const showOwner = config.fields.includes("owner");
  const unassigned = record.owner === "Unassigned";
  // "1 week ago", "2 weeks ago": a week without a touch is what stale means here.
  const stale = config.fields.includes("smartTags") && record.updated.includes("week");

  const rows = config.fields
    .filter((f) => !HEADER_FIELDS.includes(f))
    .map((f) => ({ id: f, label: CARD_FIELD_LABEL[f], value: fieldValue(record, f) }))
    .filter((r): r is { id: CardFieldId; label: string; value: string } => r.value !== null);

  const actions = config.actions
    .map((id) => ({ id, node: <QuickAction key={id} id={id} record={record} /> }))
    // `call` without a phone renders nothing; don't hold a row open for it.
    .filter((a) => !(a.id === "call" && !record.phone));

  const interactive = !preview;
  const checkboxVisible = selectionMode || selected;

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Open ${record.name}` : undefined}
      draggable={interactive && draggable}
      onDragStart={interactive ? onDragStart : undefined}
      onDragEnd={interactive ? onDragEnd : undefined}
      onClick={interactive ? onOpen : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.target !== e.currentTarget) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onOpen?.();
              }
            }
          : undefined
      }
      className={cn(
        "group/card flex w-full flex-col gap-[8px] rounded-[8px] p-[12px] text-left",
        selected
          ? "bg-brand-soft shadow-[inset_0_0_0_1px_var(--brand)]"
          : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border),0_1px_2px_rgba(16,24,40,0.05)]",
        interactive &&
          "cursor-pointer motion-tap focus-visible:outline-none focus-visible:shadow-[0_0_0_2px_var(--brand)]",
        interactive &&
          !selected &&
          "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_2px_8px_-2px_rgba(15,23,42,0.10)]",
        preview && "pointer-events-none select-none",
        dragging && "opacity-40",
      )}
    >
      {/* Name, owner, select. */}
      <div className="flex items-start gap-[8px]">
        <div className="flex min-w-0 flex-1 flex-col items-start gap-[4px]">
          <span className="w-full truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
            {record.name}
          </span>
          {stale ? (
            <span className="rounded-full px-[6px] py-[1px] text-[11px] leading-[14px] font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
              Stale
            </span>
          ) : null}
        </div>
        {showOwner ? (
          <span title={unassigned ? "Unassigned" : `Owner: ${record.owner}`} className="flex shrink-0">
            {unassigned ? (
              <span className="flex size-[24px] items-center justify-center rounded-full text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
                <UserRoundX size={13} strokeWidth={1.75} aria-hidden="true" />
              </span>
            ) : (
              <ToneAvatar name={record.owner} tone={toneFor(record.owner)} size={24} round />
            )}
          </span>
        ) : null}
        {onToggleSelect && !preview ? (
          <Checkbox
            checked={selected}
            onChange={() => onToggleSelect()}
            className={cn(
              "h-[24px]",
              !checkboxVisible &&
                "opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100",
            )}
          />
        ) : null}
      </div>

      {/* Fields, per the chosen layout. */}
      {rows.length > 0 ? (
        config.layout === "default" ? (
          <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-[8px] gap-y-[4px] text-[13px] leading-[18px]">
            {rows.map((r) => (
              <React.Fragment key={r.id}>
                <dt className="font-semibold whitespace-nowrap text-pg-muted">{r.label}:</dt>
                <dd className="truncate text-pg-text">{r.value}</dd>
              </React.Fragment>
            ))}
          </dl>
        ) : config.layout === "compact" ? (
          /*
           * Compact trades labels for density: the values are distinct enough
           * in shape ("$4,200", a phone number, a company) to be told apart.
           */
          <p className="flex flex-wrap gap-x-[12px] gap-y-[2px] text-[13px] leading-[18px] text-pg-text">
            {rows.map((r) => (
              <span key={r.id} title={r.label} className="min-w-0 break-words">
                {r.value}
              </span>
            ))}
          </p>
        ) : (
          <div className="flex flex-col gap-[2px] text-[13px] leading-[18px] text-pg-text">
            {rows.map((r) => (
              <span key={r.id} title={r.label} className="truncate">
                {r.value}
              </span>
            ))}
          </div>
        )
      ) : null}

      {/* Quick actions. */}
      {actions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-[4px]">{actions.map((a) => a.node)}</div>
      ) : null}
    </div>
  );
}
