"use client";

import { Check, ChevronsUpDown, Ellipsis, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COLUMNS,
  STATUS_LABELS,
  type AvatarTone,
  type Contact,
  type ContactStatus,
} from "./contacts-data";

const TONE_STYLE: Record<AvatarTone, string> = {
  blue: "bg-[var(--pg-av-blue-bg)] text-[var(--pg-av-blue-fg)]",
  pink: "bg-[var(--pg-av-pink-bg)] text-[var(--pg-av-pink-fg)]",
  green: "bg-[var(--pg-av-green-bg)] text-[var(--pg-av-green-fg)]",
  orange: "bg-[var(--pg-av-orange-bg)] text-[var(--pg-av-orange-fg)]",
  purple: "bg-[var(--pg-av-purple-bg)] text-[var(--pg-av-purple-fg)]",
  yellow: "bg-[var(--pg-av-yellow-bg)] text-[var(--pg-av-yellow-fg)]",
  teal: "bg-[var(--pg-av-teal-bg)] text-[var(--pg-av-teal-fg)]",
};

const STATUS_STYLE: Record<ContactStatus, { dot: string; text: string }> = {
  inquiry: {
    dot: "bg-[var(--pg-status-inquiry-dot)]",
    text: "text-[var(--pg-status-inquiry-fg)]",
  },
  subscribed: {
    dot: "bg-[var(--pg-status-subscribed-dot)]",
    text: "text-[var(--pg-status-subscribed-fg)]",
  },
};

/** 17px box, 5px radius, 1.5px border — same in the head and the rows. */
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-[17px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
        "motion-tap",
        checked
          ? "border-brand bg-brand text-white"
          : "border-pg-disabled bg-pg-surface group-hover:border-pg-muted",
      )}
    >
      {checked ? <Check size={12} aria-hidden="true" /> : null}
    </span>
  );
}

function HeadCell({
  label,
  width,
  sortable = true,
}: {
  label: string;
  width?: number;
  sortable?: boolean;
}) {
  return (
    <div
      style={width ? { width } : undefined}
      className={cn(
        "group/head flex h-full items-center gap-[6px] px-[16px]",
        width ? "shrink-0" : "flex-1",
      )}
    >
      <span className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted">
        {label}
      </span>
      {sortable ? (
        <ChevronsUpDown
          size={13}
          aria-hidden="true"
          className="shrink-0 text-pg-disabled motion-tap group-hover/head:text-pg-muted"
        />
      ) : null}
    </div>
  );
}

/**
 * The contacts table from left-nav.pen: a 10px-radius card, a 38px head and
 * 44px rows, with columns 52 / flex / 260 / 150 / 160 / 170 / 56 and 16px
 * horizontal cell padding throughout.
 */
export function ContactsTable({
  rows,
  onToggleRow,
  onOpenRow,
  activeId,
  toolbar,
}: {
  rows: Contact[];
  onToggleRow: (id: string) => void;
  /** Opens the record beside the list. Omit and rows stay inert. */
  onOpenRow?: (id: string) => void;
  /** The row the drawer is showing, so the list says where you are. */
  activeId?: string | null;
  /**
   * Search, filters and actions, drawn INSIDE the card above the head row.
   *
   * For the variants that draw no page header (L-E): with nothing above the
   * table, a toolbar left floating on the plane reads as page chrome for a
   * page that has none. Inside the card it is plainly the table's own — the
   * controls sit against the rows they cut, one edge above the column names.
   */
  toolbar?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] bg-pg-surface">
      {/*
        The card's 1px ring, drawn as an overlay rather than on the card itself.
        As an inset shadow on the container it was painted over: the header row
        and every body row carry their own background, so they covered the ring
        along the top, left, right and bottom edges and it only survived in the
        gaps. An overlay paints above the rows and costs no layout, which a real
        CSS border would (it would add 2px and shift every measured cell).
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
      />
      {toolbar ? (
        <div className="flex h-[54px] shrink-0 items-center gap-[10px] bg-pg-surface px-[12px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
          {toolbar}
        </div>
      ) : null}
      <div
        role="row"
        className="flex h-[38px] shrink-0 items-center bg-pg-surface shadow-[inset_0_-1px_0_0_var(--pg-head-border)]"
      >
        <div
          style={{ width: COLUMNS.check }}
          className="flex h-full shrink-0 items-center justify-center px-[16px]"
        >
          <Checkbox checked={false} />
        </div>
        <HeadCell label="Name" />
        <HeadCell label="Email" width={COLUMNS.email} />
        <HeadCell label="Created" width={COLUMNS.created} />
        <HeadCell label="Last activity" width={COLUMNS.activity} />
        <HeadCell label="Status" width={COLUMNS.status} sortable={false} />
        <div
          style={{ width: COLUMNS.kebab }}
          className="h-full shrink-0 px-[16px]"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((c) => {
          const status = STATUS_STYLE[c.status];
          return (
            <div
              key={c.id}
              role="row"
              tabIndex={onOpenRow ? 0 : undefined}
              onClick={() => onOpenRow?.(c.id)}
              onKeyDown={(e) => {
                if (!onOpenRow) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onOpenRow(c.id);
                }
              }}
              className={cn(
                // The last row drops its divider: against the card's rounded
                // bottom it read as a line floating short of both corners.
                "group flex h-[44px] cursor-pointer items-center shadow-[inset_0_-1px_0_0_var(--pg-row-border)] last:shadow-none",
                "motion-tap",
                c.selected
                  ? "bg-pg-row-selected"
                  : "bg-pg-surface hover:bg-pg-row-border/60",
                /*
                 * Selected-for-bulk and open-in-the-drawer are different
                 * facts, so they get different marks: a fill for the first,
                 * a ring for the second, and a row can carry both.
                 */
                c.id === activeId &&
                  "relative z-[1] shadow-[inset_0_0_0_1.5px_var(--brand)]",
              )}
            >
              <div
                style={{ width: COLUMNS.check }}
                className="flex h-full shrink-0 items-center justify-center px-[16px]"
              >
                <button
                  type="button"
                  aria-label={`Select ${c.name}`}
                  aria-pressed={!!c.selected}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRow(c.id);
                  }}
                  className="transition-transform motion-press active:scale-90"
                >
                  <Checkbox checked={!!c.selected} />
                </button>
              </div>

              <div className="flex h-full flex-1 items-center gap-[10px] px-[16px]">
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-[26px] shrink-0 items-center justify-center rounded-full text-[11px] leading-[normal] font-semibold",
                    "motion-tap group-hover:scale-110",
                    TONE_STYLE[c.tone],
                  )}
                >
                  {c.name.charAt(0)}
                </span>
                <span className="flex shrink-0 items-center gap-[6px]">
                  <span className="text-[13.5px] leading-[normal] font-medium whitespace-nowrap text-pg-heading">
                    {c.name}
                  </span>
                  <span className="text-[12px] leading-[normal] whitespace-nowrap text-pg-faint">
                    {c.handle}
                  </span>
                </span>
              </div>

              <div
                style={{ width: COLUMNS.email }}
                className="flex h-full shrink-0 items-center gap-[10px] px-[16px]"
              >
                <span
                  className={cn(
                    "truncate text-[13px] leading-[normal]",
                    c.email ? "text-pg-text-strong" : "text-pg-disabled",
                  )}
                >
                  {c.email ?? "—"}
                </span>
              </div>

              <div
                style={{ width: COLUMNS.created }}
                className="flex h-full shrink-0 items-center gap-[10px] px-[16px]"
              >
                <span className="text-[13px] leading-[normal] whitespace-nowrap text-pg-text-strong">
                  {c.created}
                </span>
              </div>

              <div
                style={{ width: COLUMNS.activity }}
                className="flex h-full shrink-0 items-center gap-[10px] px-[16px]"
              >
                <MessageSquare
                  size={14}
                  aria-hidden="true"
                  className="shrink-0 text-pg-faint"
                />
                <span className="text-[13px] leading-[normal] whitespace-nowrap text-pg-muted">
                  {c.lastActivity}
                </span>
              </div>

              <div
                style={{ width: COLUMNS.status }}
                className="flex h-full shrink-0 items-center gap-[10px] px-[16px]"
              >
                <span className="flex shrink-0 items-center gap-[6px]">
                  <span
                    aria-hidden="true"
                    className={cn("size-[6px] shrink-0 rounded-full", status.dot)}
                  />
                  <span
                    className={cn(
                      "text-[12px] leading-[normal] font-medium whitespace-nowrap",
                      status.text,
                    )}
                  >
                    {STATUS_LABELS[c.status]}
                  </span>
                </span>
              </div>

              <div
                style={{ width: COLUMNS.kebab }}
                className="flex h-full shrink-0 items-center justify-center px-[16px]"
              >
                <button
                  type="button"
                  aria-label={`Actions for ${c.name}`}
                  className="text-pg-disabled opacity-0 motion-tap group-hover:opacity-100 hover:text-pg-muted focus-visible:opacity-100"
                >
                  <Ellipsis size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
