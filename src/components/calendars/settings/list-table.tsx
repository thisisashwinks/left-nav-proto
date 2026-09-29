"use client";

import * as React from "react";
import {
  ArrowRight,
  Copy,
  CopyPlus,
  EllipsisVertical,
  Forward,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  TYPE_SHORT,
  formatDuration,
  formatUpdated,
  type CalendarGroup,
  type SettingsCalendar,
} from "./cal-settings-store";
import { AnchoredMenu } from "./list-menu";

export type RowAction =
  | "edit"
  | "share"
  | "troubleshoot"
  | "duplicate"
  | "move"
  | "toggle-active"
  | "delete";

/**
 * Name, Group, Duration, Type, Status, Date updated, Actions.
 *
 * Actions is fixed rather than a fraction: four 32px glyphs and their gaps,
 * and a fractional column would squeeze them into three and a half at
 * narrow widths.
 */
const COLS = "minmax(200px,2.2fr) minmax(90px,1.1fr) minmax(72px,0.8fr) minmax(90px,1fr) minmax(80px,0.8fr) minmax(150px,1.3fr) 148px";

const HEADERS = ["Calendar name", "Group", "Duration", "Type", "Status", "Date updated", "Actions"];

export const PAGE_SIZE = 10;

/**
 * The calendar table in its 12px card, with the pager under the rows.
 *
 * The header row stays up in the empty states too (85): the card keeps its
 * shape whether or not there is anything in it, so an empty group reads as
 * empty rather than as a page that failed to load.
 */
export function ListTable({
  rows,
  groups,
  page,
  pageCount,
  onPage,
  empty,
  onRowAction,
  onCreate,
  onClearFilters,
}: {
  rows: SettingsCalendar[];
  groups: CalendarGroup[];
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
  /** "none" when there is nothing at all; "filtered" when filters hid it all. */
  empty: "none" | "filtered" | null;
  onRowAction: (action: RowAction, calendarId: string) => void;
  onCreate: () => void;
  onClearFilters: () => void;
}) {
  const [menu, setMenu] = React.useState<{ id: string; rect: DOMRect } | null>(null);
  const closeMenu = React.useCallback(() => setMenu(null), []);
  const menuRow = menu ? rows.find((r) => r.id === menu.id) : undefined;
  const groupName = (id: string | null) => (id ? groups.find((g) => g.id === id)?.name : undefined);

  return (
    <div className="flex min-w-0 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div className="overflow-x-auto">
        <div role="table" aria-label="Calendars" className="min-w-[920px]">
          <div
            role="row"
            style={{ gridTemplateColumns: COLS }}
            className="grid h-[40px] items-center gap-[12px] border-b border-pg-head-border bg-[color-mix(in_srgb,var(--pg-border)_22%,var(--pg-surface))] px-[20px]"
          >
            {HEADERS.map((h) => (
              <span
                key={h}
                role="columnheader"
                className="truncate text-[13px] leading-[18px] font-medium text-pg-text-strong"
              >
                {h}
              </span>
            ))}
          </div>

          {rows.map((row) => {
            const updated = formatUpdated(row.updatedAt);
            const name = row.draft.name || "Untitled calendar";
            return (
              <div
                key={row.id}
                role="row"
                style={{ gridTemplateColumns: COLS }}
                className="grid min-h-[60px] items-center gap-[12px] border-b border-pg-row-border px-[20px] py-[10px] hover:bg-[color-mix(in_srgb,var(--pg-border)_14%,var(--pg-surface))]"
              >
                <span role="cell" className="flex min-w-0 flex-col gap-[2px]">
                  <button
                    type="button"
                    onClick={() => onRowAction("edit", row.id)}
                    className="w-fit max-w-full truncate text-left text-[14px] leading-[20px] font-medium text-pg-heading hover:text-brand"
                  >
                    {name}
                  </button>
                  <span className="flex min-w-0 items-center gap-[4px] text-[12px] leading-[16px] text-pg-faint">
                    <span className="truncate">Id: {row.ref}</span>
                    <button
                      type="button"
                      aria-label={`Copy id for ${name}`}
                      title="Copy id"
                      onClick={() => {
                        navigator.clipboard?.writeText(row.ref).catch(() => {});
                        showToast("Id copied");
                      }}
                      className="motion-tap flex size-[18px] shrink-0 items-center justify-center rounded-[4px] hover:bg-pg hover:text-pg-text-strong"
                    >
                      <Copy size={12} aria-hidden="true" />
                    </button>
                  </span>
                </span>
                <Cell>{groupName(row.draft.groupId) ?? ""}</Cell>
                <Cell>{formatDuration(row.draft)}</Cell>
                <Cell>{TYPE_SHORT[row.type]}</Cell>
                <span role="cell">
                  <StatusPill active={row.active} />
                </span>
                <span role="cell" className="flex min-w-0 flex-col gap-[2px]">
                  <span suppressHydrationWarning className="truncate text-[14px] leading-[20px] text-pg-text-strong">
                    {updated.date}
                  </span>
                  <span suppressHydrationWarning className="truncate text-[13px] leading-[18px] text-pg-muted">
                    {updated.time}
                  </span>
                </span>
                <span role="cell" className="flex items-center justify-end gap-[4px]">
                  <IconButton icon={Pencil} label="Edit calendar" onClick={() => onRowAction("edit", row.id)} />
                  <IconButton icon={Forward} label="Share calendar" onClick={() => onRowAction("share", row.id)} />
                  <IconButton
                    icon={Wrench}
                    label="Troubleshoot calendar"
                    onClick={() => onRowAction("troubleshoot", row.id)}
                  />
                  <IconButton
                    icon={EllipsisVertical}
                    label="More actions"
                    pressed={menu?.id === row.id}
                    onClick={(rect) => setMenu(menu?.id === row.id ? null : { id: row.id, rect })}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {empty === "none" ? (
        <EmptyNone onCreate={onCreate} />
      ) : empty === "filtered" ? (
        <div className="flex flex-col items-center gap-[4px] px-[24px] py-[56px] text-center">
          <p className="text-[16px] leading-[22px] font-medium text-pg-heading">No calendars match</p>
          <p className="text-[14px] leading-[20px] text-pg-muted">
            Try another name or{" "}
            <button
              type="button"
              onClick={onClearFilters}
              className="font-medium text-brand hover:underline"
            >
              clear filters
            </button>
            .
          </p>
        </div>
      ) : (
        <Pager page={page} pageCount={pageCount} onPage={onPage} />
      )}

      {menu && menuRow ? (
        <AnchoredMenu
          anchor={menu.rect}
          width={200}
          side="top"
          align="end"
          label={`Actions for ${menuRow.draft.name}`}
          onClose={closeMenu}
          items={[
            { label: "Duplicate", icon: CopyPlus, onSelect: () => onRowAction("duplicate", menuRow.id) },
            { label: "Move to group", icon: ArrowRight, onSelect: () => onRowAction("move", menuRow.id) },
            {
              label: menuRow.active ? "Deactivate calendar" : "Activate calendar",
              icon: menuRow.active ? ToggleLeft : ToggleRight,
              onSelect: () => onRowAction("toggle-active", menuRow.id),
            },
            {
              label: "Delete calendar",
              icon: Trash2,
              danger: true,
              onSelect: () => onRowAction("delete", menuRow.id),
            },
          ]}
        />
      ) : null}
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return (
    <span role="cell" className="truncate text-[14px] leading-[20px] text-pg-text-strong">
      {children}
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full px-[8px] text-[12px] leading-[16px] font-medium",
        active
          ? "bg-[color-mix(in_srgb,var(--hr-success-500)_12%,transparent)] text-[var(--pg-status-subscribed-fg)]"
          : "bg-[color-mix(in_srgb,var(--pg-border)_60%,transparent)] text-pg-muted",
      )}
    >
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/** `title` as well as `aria-label`: four bare glyphs need a sighted name too. */
function IconButton({
  icon: Icon,
  label,
  pressed,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  pressed?: boolean;
  onClick: (rect: DOMRect) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-expanded={pressed}
      onClick={(e) => onClick(e.currentTarget.getBoundingClientRect())}
      className={cn(
        "motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-full text-pg-text-strong hover:bg-pg hover:text-pg-heading active:scale-95",
        pressed && "bg-pg",
      )}
    >
      <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
    </button>
  );
}

function Pager({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (p: number) => void;
}) {
  const edge =
    "motion-tap flex h-[36px] items-center rounded-[8px] px-[12px] text-[14px] leading-[20px] shadow-[inset_0_0_0_1px_var(--pg-border)]";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-end gap-[8px] px-[20px] py-[10px]">
      <button
        type="button"
        disabled={page === 0}
        onClick={() => onPage(page - 1)}
        className={cn(edge, page === 0 ? "text-pg-faint" : "text-pg-text-strong hover:bg-pg")}
      >
        Previous
      </button>
      {Array.from({ length: pageCount }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-current={i === page ? "page" : undefined}
          onClick={() => onPage(i)}
          className={cn(
            "motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-[14px] leading-none tabular-nums",
            i === page
              ? "font-medium text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
              : "text-pg-text hover:bg-pg",
          )}
        >
          {i + 1}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pageCount - 1}
        onClick={() => onPage(page + 1)}
        className={cn(edge, page >= pageCount - 1 ? "text-pg-faint" : "text-pg-text-strong hover:bg-pg")}
      >
        Next
      </button>
    </nav>
  );
}

function EmptyNone({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center gap-[8px] px-[24px] pt-[72px] pb-[64px] text-center">
      <DeskIllustration />
      <h2 className="mt-[16px] text-[16px] leading-[22px] font-semibold text-pg-heading">
        No calendars yet – set one up!
      </h2>
      <p className="text-[14px] leading-[20px] text-pg-text">
        Create your first calendar to start scheduling effortlessly.
      </p>
      <PrimaryButton onClick={onCreate} className="mt-[8px] h-[36px] text-[14px]">
        Create calendar
      </PrimaryButton>
    </div>
  );
}

/**
 * The live empty state's desk, chair, cat and pin board, drawn inline.
 *
 * Inline rather than an <img> so it is painted from --pg-* and follows the
 * page theme and the accent without a light and a dark asset.
 */
function DeskIllustration() {
  const line = "var(--pg-border-strong)";
  const soft = "var(--pg-border)";
  const fill = "var(--pg-surface)";
  return (
    <svg width="184" height="112" viewBox="0 0 184 112" fill="none" aria-hidden="true">
      {/* floor */}
      <path d="M4 104h176" stroke={soft} strokeWidth="1.5" strokeLinecap="round" />
      {/* pin board */}
      <rect x="72" y="4" width="92" height="62" rx="3" fill={fill} stroke={line} strokeWidth="1.5" />
      <rect x="80" y="12" width="7" height="6" rx="1" stroke={soft} strokeWidth="1.2" />
      <rect x="90" y="12" width="7" height="6" rx="1" stroke={soft} strokeWidth="1.2" />
      <path d="M80 26h28M80 32h28M80 38h22M80 44h26" stroke={soft} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="116" y="11" width="9" height="9" rx="1" fill="color-mix(in srgb, var(--hr-warning-300) 80%, transparent)" />
      <rect x="136" y="14" width="18" height="14" rx="1.5" fill="color-mix(in srgb, var(--hr-warning-300) 90%, transparent)" stroke="var(--hr-warning-500)" strokeWidth="1" />
      <rect x="140" y="38" width="14" height="18" rx="1.5" fill={fill} stroke={soft} strokeWidth="1.2" />
      <path d="M143 43h8M143 47h8M143 51h5" stroke="var(--brand)" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      {/* chair */}
      <path d="M14 40c0-4 3-6 7-6h22c4 0 6 2 6 6v34H14z" fill={fill} stroke={line} strokeWidth="1.5" />
      <path d="M10 74h42M16 74v30M48 74v30" stroke={line} strokeWidth="1.5" strokeLinecap="round" />
      {/* desk */}
      <rect x="34" y="60" width="72" height="5" rx="1.5" fill={fill} stroke="var(--pg-heading)" strokeWidth="1.5" />
      <path d="M40 65v39M100 65v39M40 78h60" stroke="var(--pg-heading)" strokeWidth="1.5" strokeLinecap="round" />
      {/* cat */}
      <path
        d="M63 59c-6-1-9-6-8-12 1-5 5-8 10-8s9 3 10 8c1 6-2 11-8 12z"
        fill={fill}
        stroke="var(--pg-heading)"
        strokeWidth="1.4"
      />
      <path d="M60 41l-1-6 5 4M70 41l1-6-5 4" stroke="var(--pg-heading)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M62 46h0M68 46h0" stroke="var(--pg-heading)" strokeWidth="2" strokeLinecap="round" />
      <path d="M57 70c-4 4-2 11 5 11s10-4 7-8" stroke="var(--pg-heading)" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M58 59c0 3 2 5 7 5s7-2 7-5" stroke={line} strokeWidth="1.2" />
      {/* plant */}
      <path d="M150 104l2-12h10l2 12z" fill={fill} stroke={line} strokeWidth="1.4" strokeLinejoin="round" />
      <path
        d="M157 92c0-6-1-10-5-14M157 92c0-6 2-11 6-14M157 92c-1-4-4-7-8-8M157 92c1-4 4-6 9-7"
        stroke={line}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
