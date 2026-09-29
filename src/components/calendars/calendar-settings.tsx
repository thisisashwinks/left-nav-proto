"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  CALENDAR_TYPES,
  ME_ID,
  STAFF,
  TYPE_SHORT,
  activateGroup,
  calendarById,
  calendarsInGroup,
  formatDuration,
  setCalendarActive,
  useCalendarGroups,
  useCalendars,
  type BuilderTarget,
  type CalendarType,
  type SettingsCalendar,
} from "./settings/cal-settings-store";
import {
  ChooseTypeModal,
  DeactivateCalendarModal,
  DeleteCalendarModal,
  DuplicateCalendarModal,
  MoveToGroupModal,
  NewCalendarModal,
} from "./settings/calendar-modals";
import {
  DeactivateGroupModal,
  DeleteGroupModal,
  GroupFormModal,
  RearrangeCalendarsModal,
  ShareGroupModal,
} from "./settings/group-modals";
import { FilterSelect } from "./settings/list-menu";
import { ListRail, type GroupAction, type RailScope } from "./settings/list-rail";
import { ListTable, PAGE_SIZE, type RowAction } from "./settings/list-table";
import { ShareCalendarModal } from "./settings/share-calendar-modal";
import { TroubleshootView } from "./settings/troubleshoot-view";

/** The top row of the settings surface — the four product lines. */
const LINES = [
  { id: "meetings", label: "Meetings" },
  { id: "services", label: "Services", badge: "New" },
  { id: "rentals", label: "Rentals", badge: "New" },
  { id: "connections", label: "Connections" },
];

/**
 * The second row, which is NOT the same kind of control as the first.
 *
 * The line above picks a product; this picks a page within it. Two strips
 * because that is what the live screen does, and the review has to be able
 * to see the cost of two rows of tabs above a table.
 */
const PAGES = [
  { id: "calendars", label: "Calendars" },
  { id: "service-v1", label: "Service calendars (v1)" },
  { id: "preferences", label: "Preferences" },
  { id: "availability", label: "My availability" },
];

type StatusFilter = "all" | "active" | "inactive";
type TypeFilter = "all" | CalendarType;
/** "all" or a staff id — ME_ID is "me", so the default reads naturally. */
type OwnerFilter = string;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const TYPE_OPTIONS: { value: TypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  ...CALENDAR_TYPES.map((t) => ({ value: t.id as TypeFilter, label: TYPE_SHORT[t.id] })),
];

const OWNER_OPTIONS: { value: OwnerFilter; label: string }[] = [
  { value: ME_ID, label: "Me" },
  { value: "all", label: "All" },
  ...STAFF.filter((s) => s.id !== ME_ID).map((s) => ({ value: s.id, label: s.name })),
];

/** Every modal the list can open, one at a time. */
type Dialog =
  | { kind: "choose-type" }
  | { kind: "new"; type: CalendarType }
  | { kind: "share" | "duplicate" | "move" | "deactivate" | "delete"; calendarId: string }
  | { kind: "group-form"; groupId?: string }
  | {
      kind: "group-share" | "group-rearrange" | "group-deactivate" | "group-delete";
      groupId: string;
    };

export interface CalendarSettingsProps {
  /** Which product line the nav asked for, when it named one. */
  initialLine?: string | null;
  /** Which page within it, likewise. */
  initialPage?: string | null;
  /** Open the builder — an existing calendar, or a new one with its draft. */
  onOpen: (target: BuilderTarget) => void;
}

/**
 * Calendar settings — the product lines, their pages, and the calendar list.
 *
 * Settings for a product, inside the product: the sub-tabs are the same rows
 * the Settings nav used to draw, now drawn on the page they configure. Only
 * Meetings ▸ Calendars is built; the other tabs hold a placeholder so a
 * click never lands on a broken page.
 */
export function CalendarSettings({ initialLine, initialPage, onOpen }: CalendarSettingsProps) {
  const [line, setLine] = React.useState(
    LINES.some((l) => l.id === initialLine) ? initialLine! : "meetings",
  );
  const [page, setPage] = React.useState(
    PAGES.some((p) => p.id === initialPage) ? initialPage! : "calendars",
  );

  const lineLabel = LINES.find((l) => l.id === line)?.label ?? "";
  const pageLabel = PAGES.find((p) => p.id === page)?.label ?? "";

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[12px]">
      <div
        role="tablist"
        aria-label="Calendar settings sections"
        className="flex shrink-0 items-end gap-[4px] overflow-x-auto border-b border-pg-head-border"
      >
        {LINES.map((l) => {
          const on = l.id === line;
          return (
            <button
              key={l.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setLine(l.id)}
              className={cn(
                "motion-tap relative flex shrink-0 items-center px-[10px] pt-[14px] pb-[9px] text-[14px] leading-[20px] whitespace-nowrap",
                on ? "font-medium text-brand" : "text-pg-text hover:text-pg-heading",
              )}
            >
              <span className="relative">
                {l.label}
                {l.badge ? (
                  <span className="absolute -top-[12px] -right-[10px] rounded-[4px] bg-[var(--hr-warning-200)] px-[4px] text-[9.5px] leading-[13px] font-semibold text-[var(--hr-warning-900)]">
                    {l.badge}
                  </span>
                ) : null}
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "motion-move absolute inset-x-[4px] -bottom-px h-[2px] rounded-full",
                  on ? "bg-brand" : "bg-transparent",
                )}
              />
            </button>
          );
        })}
      </div>

      {line === "meetings" ? (
        <div
          role="tablist"
          aria-label="Meetings settings pages"
          className="flex shrink-0 items-center gap-[6px] overflow-x-auto"
        >
          {PAGES.map((p) => {
            const on = p.id === page;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setPage(p.id)}
                className={cn(
                  "motion-tap flex h-[36px] shrink-0 items-center rounded-[8px] px-[10px] text-[14px] leading-[20px] whitespace-nowrap",
                  on ? "bg-brand-soft font-medium text-brand" : "text-pg-text hover:bg-pg",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {line !== "meetings" ? (
        <Placeholder name={lineLabel} />
      ) : page !== "calendars" ? (
        <Placeholder name={pageLabel} />
      ) : (
        <CalendarsList onOpen={onOpen} />
      )}
    </div>
  );
}

function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center gap-[4px] rounded-[12px] bg-pg-surface px-[24px] py-[48px] text-center shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">{name}</h2>
      <p className="text-[14px] leading-[20px] text-pg-muted">{name} settings live here.</p>
    </div>
  );
}

/**
 * Meetings ▸ Calendars: the group rail, the toolbar and the table.
 *
 * Everything is derived from the store at render, so a calendar created,
 * moved or deleted from any modal is reflected in the counts and the rows on
 * the next tick. The rail's counts follow Owned by only — the live screen
 * opens on "All calendars (0)" under Owned by: Me even though teammates'
 * calendars exist — while Status, Type and search narrow just the table.
 */
function CalendarsList({ onOpen }: { onOpen: (target: BuilderTarget) => void }) {
  const calendars = useCalendars();
  const groups = useCalendarGroups();

  const [scopeState, setScope] = React.useState<RailScope>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [type, setType] = React.useState<TypeFilter>("all");
  const [owner, setOwner] = React.useState<OwnerFilter>(ME_ID);
  const [query, setQuery] = React.useState("");
  const [pageState, setPageState] = React.useState(0);
  const [dialog, setDialog] = React.useState<Dialog | null>(null);
  const [troubleshoot, setTroubleshoot] = React.useState<string | null>(null);
  const close = React.useCallback(() => setDialog(null), []);

  const groupIds = new Set(groups.map((g) => g.id));
  // A deleted group's id can linger in state; fall back rather than show nothing.
  const scope: RailScope =
    scopeState === "all" || scopeState === "ungrouped" || groupIds.has(scopeState)
      ? scopeState
      : "all";
  const isUngrouped = (c: SettingsCalendar) => !c.draft.groupId || !groupIds.has(c.draft.groupId);

  const owned = calendars.filter((c) => owner === "all" || c.ownerId === owner);
  const counts = {
    all: owned.length,
    ungrouped: owned.filter(isUngrouped).length,
    byGroup: Object.fromEntries(
      groups.map((g) => [g.id, owned.filter((c) => c.draft.groupId === g.id).length]),
    ),
  };

  const inScope =
    scope === "all"
      ? owned
      : scope === "ungrouped"
        ? owned.filter(isUngrouped)
        : calendarsInGroup(scope, owned);

  const q = query.trim().toLowerCase();
  const groupName = (c: SettingsCalendar) => groups.find((g) => g.id === c.draft.groupId)?.name ?? "";
  const filtered = inScope.filter(
    (c) =>
      (status === "all" || c.active === (status === "active")) &&
      (type === "all" || c.type === type) &&
      (!q || c.draft.name.toLowerCase().includes(q) || groupName(c).toLowerCase().includes(q)),
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pageState, pageCount - 1);
  const rows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const narrowed = status !== "all" || type !== "all" || q !== "";
  const empty = filtered.length > 0 ? null : inScope.length === 0 && !narrowed ? "none" : "filtered";

  // Any filter change starts the table over at page 1.
  const refilter =
    <T,>(set: (v: T) => void) =>
    (v: T) => {
      set(v);
      setPageState(0);
    };

  const clearFilters = () => {
    setStatus("all");
    setType("all");
    setQuery("");
    setPageState(0);
  };

  /** A calendar just created must be on screen — undo whatever would hide it. */
  const reveal = (id: string) => {
    const cal = calendarById(id);
    if (!cal) return;
    if (status === "inactive" && cal.active) setStatus("all");
    if (type !== "all" && type !== cal.type) setType("all");
    if (owner !== "all" && owner !== cal.ownerId) setOwner("all");
    if (scope !== "all" && scope !== (cal.draft.groupId ?? "ungrouped")) setScope("all");
    setQuery("");
    setPageState(0);
  };

  const onRowAction = (action: RowAction, id: string) => {
    const cal = calendarById(id);
    if (!cal) return;
    switch (action) {
      case "edit":
        onOpen({ calendarId: id });
        return;
      case "troubleshoot":
        setTroubleshoot(id);
        return;
      case "toggle-active":
        if (cal.active) setDialog({ kind: "deactivate", calendarId: id });
        else {
          setCalendarActive(id, true);
          showToast("Calendar activated");
        }
        return;
      default:
        setDialog({ kind: action, calendarId: id });
    }
  };

  const onGroupAction = (action: GroupAction, id: string) => {
    const group = groups.find((g) => g.id === id);
    if (!group) return;
    switch (action) {
      case "edit":
        setDialog({ kind: "group-form", groupId: id });
        return;
      case "share":
        setDialog({ kind: "group-share", groupId: id });
        return;
      case "rearrange":
        setDialog({ kind: "group-rearrange", groupId: id });
        return;
      case "delete":
        setDialog({ kind: "group-delete", groupId: id });
        return;
      case "toggle-active":
        if (group.active) {
          setDialog({ kind: "group-deactivate", groupId: id });
        } else {
          // The menu says "Activate all calendars in group", so the calendars
          // come back with it — the store's activateGroup flips only the group.
          activateGroup(id);
          calendars.filter((c) => c.draft.groupId === id).forEach((c) => setCalendarActive(c.id, true));
          showToast("Group activated");
        }
    }
  };

  const troubleshootCal = troubleshoot ? calendars.find((c) => c.id === troubleshoot) : undefined;
  if (troubleshootCal) {
    // Full height of the page, in place of the list, so closing it lands on
    // the same list, filters and page the operator left.
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <TroubleshootView
          name={troubleshootCal.draft.name}
          durationLabel={formatDuration(troubleshootCal.draft)}
          onClose={() => setTroubleshoot(null)}
        />
      </div>
    );
  }

  const shareCal = dialog?.kind === "share" ? calendars.find((c) => c.id === dialog.calendarId) : undefined;

  return (
    <div className="-mx-[var(--page-inset)] min-h-0 flex-1 overflow-y-auto px-[var(--page-inset)] pb-[16px]">
      <div className="flex min-w-0 items-start gap-[24px] pt-[4px]">
        <ListRail
          groups={groups}
          scope={scope}
          counts={counts}
          onScope={refilter(setScope)}
          onGroupAction={onGroupAction}
          onNewGroup={() => setDialog({ kind: "group-form" })}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
          <div className="flex flex-wrap items-center gap-[10px]">
            <FilterSelect label="Status" value={status} options={STATUS_OPTIONS} onChange={refilter(setStatus)} width={160} />
            <FilterSelect label="Type" value={type} options={TYPE_OPTIONS} onChange={refilter(setType)} width={180} />
            <FilterSelect label="Owned by" value={owner} options={OWNER_OPTIONS} onChange={refilter(setOwner)} width={200} />
            <div className="ml-auto flex items-center gap-[10px]">
              <label className="flex h-[36px] w-[204px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]">
                <Search size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => refilter(setQuery)(e.target.value)}
                  placeholder="Calendar/group name"
                  aria-label="Search calendars and groups"
                  className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text-strong outline-none placeholder:text-pg-faint"
                />
              </label>
              <PrimaryButton onClick={() => setDialog({ kind: "choose-type" })} className="h-[36px] text-[14px]">
                <Plus size={16} aria-hidden="true" />
                New calendar
              </PrimaryButton>
            </div>
          </div>

          <ListTable
            rows={rows}
            groups={groups}
            page={page}
            pageCount={pageCount}
            onPage={setPageState}
            empty={empty}
            onRowAction={onRowAction}
            onCreate={() => setDialog({ kind: "choose-type" })}
            onClearFilters={clearFilters}
          />
        </div>
      </div>

      {dialog?.kind === "choose-type" ? (
        <ChooseTypeModal onClose={close} onChoose={(t) => setDialog({ kind: "new", type: t })} />
      ) : null}
      {dialog?.kind === "new" ? (
        <NewCalendarModal
          type={dialog.type}
          onClose={close}
          onCreated={(id) => {
            setDialog(null);
            reveal(id);
            showToast("Calendar created");
          }}
          onAdvanced={(t, draft) => {
            setDialog(null);
            onOpen({ calendarId: null, type: t, draft });
          }}
        />
      ) : null}
      {shareCal ? (
        <ShareCalendarModal
          calendarId={shareCal.id}
          name={shareCal.draft.name}
          slug={shareCal.draft.slug}
          durationLabel={formatDuration(shareCal.draft)}
          typeLabel={TYPE_SHORT[shareCal.type]}
          onClose={close}
        />
      ) : null}
      {dialog?.kind === "duplicate" ? <DuplicateCalendarModal calendarId={dialog.calendarId} onClose={close} /> : null}
      {dialog?.kind === "move" ? <MoveToGroupModal calendarId={dialog.calendarId} onClose={close} /> : null}
      {dialog?.kind === "deactivate" ? <DeactivateCalendarModal calendarId={dialog.calendarId} onClose={close} /> : null}
      {dialog?.kind === "delete" ? <DeleteCalendarModal calendarId={dialog.calendarId} onClose={close} /> : null}

      {dialog?.kind === "group-form" ? (
        <GroupFormModal
          groupId={dialog.groupId}
          onClose={close}
          onSaved={(id) => {
            // A new group is selected so its (empty) state is what you see next.
            if (!dialog.groupId) setScope(id);
          }}
        />
      ) : null}
      {dialog?.kind === "group-share" ? <ShareGroupModal groupId={dialog.groupId} onClose={close} /> : null}
      {dialog?.kind === "group-rearrange" ? (
        <RearrangeCalendarsModal groupId={dialog.groupId} onClose={close} />
      ) : null}
      {dialog?.kind === "group-deactivate" ? (
        <DeactivateGroupModal groupId={dialog.groupId} onClose={close} />
      ) : null}
      {dialog?.kind === "group-delete" ? (
        <DeleteGroupModal
          groupId={dialog.groupId}
          onClose={close}
          onDeleted={() => {
            if (scope === dialog.groupId) setScope("all");
          }}
        />
      ) : null}
    </div>
  );
}
