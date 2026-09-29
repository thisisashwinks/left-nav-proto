"use client";

import * as React from "react";
import {
  ArrowUpDown,
  Calendar,
  CalendarClock,
  CalendarX2,
  Columns3,
  EllipsisVertical,
  House,
  ListFilter,
  Pencil,
  Plus,
  Search,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  OutlineButton,
  PageHeader,
  PrimaryButton,
} from "@/components/page/page-header";
import { usePageCrumb } from "@/components/page/page-crumb";
import {
  ListToolbar,
  useListToolbar,
  type ListToolbarModel,
} from "@/components/page/list-toolbar";
import {
  CollapsingSearch,
  GlyphButton,
  ScopePicker,
  useListShape,
} from "@/components/page/list-shape";
import { ViewBar, type PageView } from "@/components/page/view-bar";
import { ToneAvatar } from "@/components/page/avatar";
import { StatusTag } from "@/components/page/form-controls";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import {
  AnchoredPopover,
  MenuOption,
} from "@/components/contacts/book-appointment-modal";
import { SelectButton } from "./calendar-chrome";
import {
  APPOINTMENT_STATUSES,
  appointments,
  appointmentViews,
  rentalBookings,
  rentalViews,
  serviceAppointments,
  serviceViews,
  type Appointment,
  type BookingRowBase,
  type PaymentStatus,
  type RentalBooking,
  type RentalStatus,
  type ServiceAppointment,
} from "./calendars-data";
import {
  AdvancedFiltersDrawer,
  CustomizeListDrawer,
  ManageColumnsDrawer,
  SortByDrawer,
  countFilters,
  matchesFilters,
  newFilterId,
  type ColumnDescriptor,
  type ColumnPref,
  type FilterField,
  type FilterGroup,
  type ListConfig,
  type SortOption,
} from "./appointments-drawers";
import { CALENDAR_SCOPES, scopeLabel, type CalendarScope } from "./scope";

export interface AppointmentsListProps {
  onNew?: () => void;
  scope: CalendarScope;
  onScopeChange: (s: CalendarScope) => void;
}

/* ── what a scope is, as far as the table is concerned ──────────────────── */

interface CellCtx {
  /** The row's status after any edit from its own status menu. */
  status: string;
  onStatus: (next: string) => void;
}

interface ColumnDef<R> extends ColumnDescriptor {
  /** A grid track — `fr` for everything but the fixed `#` and kebab. */
  width: string;
  /** Off until Manage columns turns it on. */
  hidden?: boolean;
  render: (row: R, cell: CellCtx) => React.ReactNode;
}

interface ViewDef<R> {
  id: string;
  label: string;
  icon?: LucideIcon;
  match: (row: R, status: string) => boolean;
}

/**
 * One booking scope, described once: its tabs, its columns, the fields it
 * filters on, what search reads, and what its empty Upcoming says.
 *
 * Meetings, Services and Rentals share every piece of machinery on this
 * screen and no column. Three copies of the table would have been three
 * copies of the L-B/L-D/L-E/L-F branching below, and that branching is the
 * part of this file that is being reviewed — so the scopes are data and the
 * table is written once over them.
 */
interface ScopeConfig<R extends BookingRowBase> {
  views: readonly ViewDef<R>[];
  rows: readonly R[];
  columns: readonly ColumnDef<R>[];
  filterFields: readonly FilterField[];
  read: (row: R, fieldId: string, status: string) => string;
  search: { placeholder: string; label: string; of: (row: R) => string };
  /** "Appointment time" or "Start time" — what the time sort is called. */
  timeLabel: string;
  /** The primary action — "New appointment", "Create booking". */
  primary: string;
  description: string;
  noun: string;
  nouns: string;
  /** Names a row for screen readers and toasts. */
  nameOf: (row: R) => string;
  /** Whether the row's status is a menu (appointments) or a pill (stays). */
  editableStatus: boolean;
  empty: { title: string; body: string; cta: string };
}

/* ── cells ──────────────────────────────────────────────────────────────── */

const TEXT = "truncate text-[13px] leading-[normal] text-pg-text";

function TitleCell({ title }: { title: string }) {
  return (
    <span className="flex min-w-0 items-center gap-[8px]">
      <Calendar size={15} aria-hidden="true" className="shrink-0 text-brand" />
      <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">
        {title}
      </span>
    </span>
  );
}

function PersonCell({
  name,
  tone,
  extra = 0,
}: {
  name: string;
  tone: BookingRowBase["tone"];
  /** Invitees beyond this one, drawn as `+N`. */
  extra?: number;
}) {
  return (
    <span className="flex min-w-0 items-center gap-[7px]">
      <ToneAvatar name={name} tone={tone} size={24} />
      <span className={TEXT}>{name}</span>
      {extra > 0 ? (
        <span className="shrink-0 rounded-[5px] bg-pg px-[5px] py-[1px] text-[11.5px] leading-[15px] font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
          +{extra}
        </span>
      ) : null}
    </span>
  );
}

function TimeCell({ time, rescheduledTo }: { time: string; rescheduledTo?: string }) {
  return (
    <span className="flex min-w-0 flex-col gap-[2px]">
      {rescheduledTo ? (
        <span className="w-fit rounded-[5px] bg-brand-soft px-[6px] py-[1px] text-[11px] leading-[15px] font-semibold text-brand">
          {rescheduledTo}
        </span>
      ) : null}
      <span className="truncate text-[12.5px] leading-[17px] text-pg-text">
        {time} <span className="text-pg-faint">(CST)</span>
      </span>
    </span>
  );
}

/** "2026-09-14" → "09/14/2026", the data-cell date format. */
function formatAdded(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

const plain = (v: string) => <span className={TEXT}>{v}</span>;

/* ── the three scopes ───────────────────────────────────────────────────── */

const notCancelled = (s: string) => s !== "Cancelled";
const awaiting = (s: string) => s === "Confirmed" || s === "Unconfirmed";

/** The columns every appointment scope can switch on, after its own. */
function auditColumns<R extends BookingRowBase>(): ColumnDef<R>[] {
  return [
    { id: "createdBy", label: "Created by", width: "1.2fr", hidden: true, render: (r) => plain(r.createdBy) },
    { id: "dateAdded", label: "Date added", width: "1fr", hidden: true, render: (r) => plain(formatAdded(r.dateAdded)) },
    { id: "source", label: "Source", width: "1.1fr", hidden: true, render: (r) => plain(r.source) },
  ];
}

const statusColumn = <R extends Appointment | ServiceAppointment>(): ColumnDef<R> => ({
  id: "status",
  label: "Status",
  width: "1.2fr",
  /*
    A select per row, not a pill.

    Status is the one column an operator EDITS from the table — it is how a
    no-show gets marked — so it gets the control that says so. A coloured
    pill would have been prettier and would have hidden the only write action
    on the screen.
  */
  render: (r, cell) => (
    <StatusMenu label={`Status for ${r.title}`} value={cell.status} onChange={cell.onStatus} />
  ),
});

const unique = (xs: readonly string[]) => [...new Set(xs)];

/**
 * Meetings: the table this screen was built as.
 *
 * `#` is 44px and not a checkbox column: the live table numbers its rows and
 * has no bulk actions on them, and swapping the ordinal for a tickbox would
 * have been the prototype proposing a CRUD bar the product does not have.
 * Appointment time is the widest non-title column because one row in ten
 * carries two lines in it — see `rescheduledTo` in calendars-data.
 */
const MEETINGS: ScopeConfig<Appointment> = {
  views: appointmentViews.map((v) => ({
    ...v,
    match: (r: Appointment, s: string) =>
      v.id === "upcoming"
        ? notCancelled(s)
        : v.id === "cancelled"
          ? s === "Cancelled"
          : v.id === "moltclaw"
            ? r.calendar === "MoltClaw Demos"
            : v.id === "saas"
              ? r.calendar === "Saas onboarding"
              : true,
  })),
  rows: appointments,
  columns: [
    { id: "title", label: "Title", width: "2.1fr", locked: true, render: (r) => <TitleCell title={r.title} /> },
    { id: "invitees", label: "Invitees", width: "1.4fr", render: (r) => <PersonCell name={r.contact} tone={r.tone} extra={r.invitees.length} /> },
    statusColumn<Appointment>(),
    { id: "time", label: "Appointment time", width: "1.5fr", render: (r) => <TimeCell time={r.time} rescheduledTo={r.rescheduledTo} /> },
    { id: "calendar", label: "Calendar", width: "1.2fr", render: (r) => plain(r.calendar) },
    { id: "owner", label: "Appointment owner", width: "1.2fr", render: (r) => plain(r.owner) },
    ...auditColumns<Appointment>(),
  ],
  filterFields: [
    { id: "time", label: "Appointment time", kind: "date" },
    { id: "status", label: "Status", kind: "select", options: APPOINTMENT_STATUSES },
    { id: "calendar", label: "Calendar", kind: "select", options: unique(appointments.map((a) => a.calendar)) },
  ],
  read: (r, f, s) => (f === "time" ? r.startsAt : f === "status" ? s : f === "calendar" ? r.calendar : ""),
  search: { placeholder: "Search by title", label: "Search appointments by title", of: (r) => r.title },
  timeLabel: "Appointment time",
  primary: "New appointment",
  description: "Everything booked across this account's calendars",
  noun: "appointment",
  nouns: "appointments",
  nameOf: (r) => r.title,
  editableStatus: true,
  empty: {
    title: "No upcoming appointments",
    body: "You don't have any upcoming appointments right now.",
    cta: "See all appointments",
  },
};

/**
 * Services: Upcoming is empty, which is the point.
 *
 * Upcoming means "still to happen" — Confirmed or Unconfirmed — and none of
 * the three rows is, so the tab the scope opens on shows the empty state and
 * All shows the history. Marking one Confirmed from its status menu moves it
 * into Upcoming, which is the tab behaving like a cut rather than a caption.
 */
const SERVICES: ScopeConfig<ServiceAppointment> = {
  views: serviceViews.map((v) => ({
    ...v,
    match: (_r: ServiceAppointment, s: string) =>
      v.id === "upcoming" ? awaiting(s) : v.id === "cancelled" ? s === "Cancelled" : true,
  })),
  rows: serviceAppointments,
  columns: [
    { id: "title", label: "Title", width: "2fr", locked: true, render: (r) => <TitleCell title={r.title} /> },
    { id: "contact", label: "Contact", width: "1.4fr", render: (r) => <PersonCell name={r.contact} tone={r.tone} /> },
    statusColumn<ServiceAppointment>(),
    { id: "time", label: "Appointment time", width: "1.5fr", render: (r) => <TimeCell time={r.time} /> },
    { id: "service", label: "Service", width: "1.3fr", render: (r) => plain(r.service) },
    { id: "owner", label: "Appointment owner", width: "1.2fr", render: (r) => plain(r.owner) },
    ...auditColumns<ServiceAppointment>(),
  ],
  filterFields: [
    { id: "time", label: "Appointment time", kind: "date" },
    { id: "status", label: "Status", kind: "select", options: APPOINTMENT_STATUSES },
    { id: "service", label: "Service", kind: "select", options: unique(serviceAppointments.map((a) => a.service)) },
  ],
  read: (r, f, s) => (f === "time" ? r.startsAt : f === "status" ? s : f === "service" ? r.service : ""),
  search: { placeholder: "Search by title", label: "Search appointments by title", of: (r) => r.title },
  timeLabel: "Appointment time",
  primary: "New appointment",
  description: "Every service booked across this account",
  noun: "appointment",
  nouns: "appointments",
  nameOf: (r) => r.title,
  editableStatus: true,
  empty: {
    title: "No upcoming appointments",
    body: "You don't have any upcoming appointments right now.",
    cta: "See all appointments",
  },
};

const RENTAL_STATUSES: readonly RentalStatus[] = ["Upcoming", "Active", "Completed", "Cancelled"];
const PAYMENT_STATUSES: readonly PaymentStatus[] = ["Paid", "Pending", "Partially paid", "Refunded"];

const rentalTone = (s: string) =>
  s === "Active" ? "brand" : s === "Completed" ? "success" : s === "Cancelled" ? "danger" : "neutral";
const paymentTone = (s: string) =>
  s === "Paid" ? "success" : s === "Refunded" ? "neutral" : "warning";

/**
 * Rentals: a stay, not a slot — two times and a payment, and no title.
 *
 * With no Title, Contact is the column that cannot be hidden: a row of
 * listings and dates with nobody's name on it is a calendar, not a list of
 * bookings. Status is a pill here rather than a menu, because a stay's status
 * follows its dates — nobody marks a cabin "Active" by hand.
 */
const RENTALS: ScopeConfig<RentalBooking> = {
  views: rentalViews.map((v) => ({
    ...v,
    match: (_r: RentalBooking, s: string) => (v.id === "all" ? true : s.toLowerCase() === v.id),
  })),
  rows: rentalBookings,
  columns: [
    { id: "contact", label: "Contact", width: "1.6fr", locked: true, render: (r) => <PersonCell name={r.contact} tone={r.tone} /> },
    {
      id: "listing",
      label: "Listing",
      width: "1.5fr",
      render: (r) => (
        <span className="flex min-w-0 items-center gap-[8px]">
          <House size={15} aria-hidden="true" className="shrink-0 text-brand" />
          <span className="truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">{r.listing}</span>
        </span>
      ),
    },
    { id: "start", label: "Start time", width: "1.5fr", render: (r) => <TimeCell time={r.start} /> },
    { id: "end", label: "End time", width: "1.5fr", render: (r) => <TimeCell time={r.end} /> },
    { id: "status", label: "Status", width: "1fr", render: (_r, c) => <StatusTag tone={rentalTone(c.status)}>{c.status}</StatusTag> },
    { id: "payment", label: "Payment status", width: "1.1fr", render: (r) => <StatusTag tone={paymentTone(r.payment)}>{r.payment}</StatusTag> },
    ...auditColumns<RentalBooking>(),
  ],
  filterFields: [
    { id: "time", label: "Start time", kind: "date" },
    { id: "status", label: "Status", kind: "select", options: RENTAL_STATUSES },
    { id: "listing", label: "Listing", kind: "select", options: unique(rentalBookings.map((b) => b.listing)) },
    { id: "payment", label: "Payment status", kind: "select", options: PAYMENT_STATUSES },
  ],
  read: (r, f, s) =>
    f === "time" ? r.startsAt : f === "status" ? s : f === "listing" ? r.listing : f === "payment" ? r.payment : "",
  search: {
    placeholder: "Search by listing / contact name",
    label: "Search bookings by listing or contact name",
    of: (r) => `${r.listing} ${r.contact}`,
  },
  timeLabel: "Start time",
  primary: "Create booking",
  description: "Every stay booked across this account's listings",
  noun: "booking",
  nouns: "bookings",
  nameOf: (r) => `${r.listing} for ${r.contact}`,
  editableStatus: false,
  empty: {
    title: "No upcoming bookings",
    body: "You don't have any upcoming bookings right now.",
    cta: "See all bookings",
  },
};

/* ── list config: filters, sort, columns ────────────────────────────────── */

function sortOptionsFor(timeLabel: string): SortOption[] {
  return [
    { id: "added-asc", label: "Date added – Ascending" },
    { id: "added-desc", label: "Date added – Descending" },
    { id: "time-asc", label: `${timeLabel} – Ascending` },
    { id: "time-desc", label: `${timeLabel} – Descending` },
  ];
}

/**
 * The one filter every list opens with.
 *
 * It is the `1` the badge has always shown, made real: after Sep 1, which
 * every row in all three scopes passes, so the seed changes the count and not
 * the table. Moving the date to Sep 28 empties Meetings, which is the filter
 * proving it does something.
 */
function seedFilters(): FilterGroup[] {
  return [
    {
      id: newFilterId("g"),
      conditions: [
        { id: newFilterId("c"), fieldId: "time", operator: "is", mode: "after", value: "2026-09-01" },
      ],
    },
  ];
}

function defaultConfig<R extends BookingRowBase>(cfg: ScopeConfig<R>): ListConfig {
  return {
    filters: seedFilters(),
    sort: "time-asc",
    columns: cfg.columns.map((c) => ({ id: c.id, visible: !c.hidden })),
  };
}

interface SavedList extends ListConfig {
  id: string;
  label: string;
  /** The built-in tab it was cut from — its rows before the filters. */
  base: string;
}

type DrawerState =
  | { kind: "filters" }
  | { kind: "sort" }
  | { kind: "columns" }
  | { kind: "customize"; isNew: boolean }
  | null;

/**
 * Screen 2: Appointments as a table.
 *
 * This is the screen that obeys `listHeaderVariant`, and it obeys it the way
 * contacts-page does rather than the way funnels-page does — because it is the
 * shape the axis was drawn for: a saved-view row over one collection. The four
 * page-header knobs are already written when a variant is picked, so the title,
 * count and description need nothing here. What a boolean cannot say is WHERE
 * the saved view lives once the title stops naming the page:
 *
 *   L-D        the ViewBar under the header, which is where it has always been
 *   L-F        the same ViewBar, one row taller, with the filter row folded
 *              onto its right edge as glyphs
 *   L-B        a picker on the header's own row, no second count
 *   L-E        the last crumb in the trail, and the actions drop into the
 *              toolbar because a header that is gone cannot carry them
 *
 * The week grid next door sits the axis out, and deliberately: it has no
 * saved views and its own toolbar states the scope (Sep 21 – 27) better than
 * a title could. See the note on its toolbar.
 *
 * The scope (`Meetings ▾`) is owned by calendars-page so the grid and this
 * table agree on it. Everything below the scope — the tab, the filters, the
 * sort, the columns — belongs to one scope's list and is thrown away when the
 * scope changes, which is why the list is keyed by it. Two things survive the
 * switch because they are facts rather than view state: smart lists someone
 * saved, and a status someone set.
 */
export function AppointmentsList({ onNew, scope, onScopeChange }: AppointmentsListProps) {
  const [saved, setSaved] = React.useState<Record<CalendarScope, SavedList[]>>({
    meetings: [],
    services: [],
    rentals: [],
  });
  const [statuses, setStatuses] = React.useState<Record<string, string>>({});

  const common = {
    onNew,
    scope,
    onScopeChange,
    saved: saved[scope],
    onSave: (list: SavedList) =>
      setSaved((s) => ({ ...s, [scope]: [...s[scope], list] })),
    statuses,
    onStatus: (id: string, next: string) => setStatuses((s) => ({ ...s, [id]: next })),
  };

  if (scope === "services") return <ScopeList key="services" config={SERVICES} {...common} />;
  if (scope === "rentals") return <ScopeList key="rentals" config={RENTALS} {...common} />;
  return <ScopeList key="meetings" config={MEETINGS} {...common} />;
}

function ScopeList<R extends BookingRowBase & { status: string }>({
  config,
  onNew,
  scope,
  onScopeChange,
  saved,
  onSave,
  statuses,
  onStatus,
}: {
  config: ScopeConfig<R>;
  onNew?: () => void;
  scope: CalendarScope;
  onScopeChange: (s: CalendarScope) => void;
  saved: SavedList[];
  onSave: (list: SavedList) => void;
  statuses: Record<string, string>;
  onStatus: (id: string, next: string) => void;
}) {
  const { effective } = useTheme();
  const [view, setView] = React.useState("upcoming");
  // Built once per mount so Customize list's Discard has a stable baseline.
  const [defaults] = React.useState(() => defaultConfig(config));
  const [list, setList] = React.useState<ListConfig>(defaults);
  const [query, setQuery] = React.useState("");
  /** The list toolbar's Status quick filter. Empty = every status. */
  const [statusFilter, setStatusFilter] = React.useState<string[]>([]);
  const toolbar = useListToolbar();
  const [drawer, setDrawer] = React.useState<DrawerState>(null);
  const close = React.useCallback(() => setDrawer(null), []);
  const sortOptions = React.useMemo(() => sortOptionsFor(config.timeLabel), [config.timeLabel]);

  /*
   * Through the hook, not hand-derived.
   *
   * These three lines were a copy of the same three in contacts-page, which is
   * the duplication page/list-shape.tsx was written to end and which survived
   * here because copies are cheap until the thing they copy grows a fifth
   * field. L-F is that field.
   */
  const shape = useListShape();
  const { mergedRow, scopeInTrail, oneRow, showViews, showFilters } = shape;

  const statusOf = (r: R) => statuses[r.id] ?? r.status;

  /*
   * A saved list is its base tab's rows through its own filters, sort and
   * columns. Picking any tab loads that tab's config — the built-ins share the
   * seeded default — so the table never shows one list's filters under
   * another list's name.
   */
  const configFor = (id: string): ListConfig => {
    if (id === view) return list;
    const s = saved.find((x) => x.id === id);
    return s ?? defaults;
  };
  const baseOf = (id: string) => {
    const baseId = saved.find((x) => x.id === id)?.base ?? id;
    return config.views.find((v) => v.id === baseId) ?? config.views[0]!;
  };
  const rowsFor = (id: string, cfg: ListConfig, q: string, only: readonly string[] = []) => {
    const base = baseOf(id);
    const inView = config.rows.filter((r) => base.match(r, statusOf(r)));
    const needle = q.trim().toLowerCase();
    const shown = inView
      .filter((r) =>
        matchesFilters(cfg.filters, config.filterFields, (f) => config.read(r, f, statusOf(r))),
      )
      .filter((r) => !needle || config.search.of(r).toLowerCase().includes(needle))
      .filter((r) => only.length === 0 || only.includes(statusOf(r)));
    const [key, dir] = cfg.sort.split("-");
    const sign = dir === "desc" ? -1 : 1;
    shown.sort((a, b) => {
      const av = key === "added" ? a.dateAdded : a.startsAt;
      const bv = key === "added" ? b.dateAdded : b.startsAt;
      return av < bv ? -sign : av > bv ? sign : 0;
    });
    return { inView, shown };
  };

  const { inView, shown } = rowsFor(view, list, query, statusFilter);

  const views: PageView[] = [
    ...config.views.map((v) => ({ id: v.id, label: v.label, icon: v.icon })),
    ...saved.map((s) => ({ id: s.id, label: s.label })),
  ];
  const active = views.find((v) => v.id === view) ?? views[0]!;

  const selectView = (id: string) => {
    if (id === view) return;
    setView(id);
    setList(saved.find((s) => s.id === id) ?? defaults);
  };

  const filterCount = countFilters(list.filters);
  const visibleCols = list.columns
    .map((p) => ({ pref: p, def: config.columns.find((c) => c.id === p.id) }))
    .filter((x): x is { pref: ColumnPref; def: ColumnDef<R> } => !!x.def && (x.pref.visible || !!x.def.locked))
    .map((x) => x.def);
  const cols = `44px ${visibleCols.map((c) => c.width).join(" ")} 36px`;

  /*
   * Only in L-E, and unconditionally within it — including while the calendar
   * settings tab is showing, because the tab is in-page state and the trail
   * has no business flickering when you switch one.
   *
   * `showViews` is the exception, and it belongs here rather than in the bar:
   * under L-E this crumb IS the saved-view control, so switching the views
   * off has to reach it or the knob would mean "no tabs" on two variants and
   * nothing at all on the two that have no tabs.
   */
  usePageCrumb(
    !toolbar.shared && scopeInTrail && showViews
      ? {
          label: active.label,
          options: views.map((v) => ({
            id: v.id,
            label: v.label,
            icon: v.icon,
            selected: v.id === view,
          })),
          onSelect: selectView,
        }
      : null,
  );

  /*
   * Built once and placed three ways, which is what keeps the three variants
   * a question about POSITION rather than three toolbars that drifted apart.
   */
  const scopeMenu = <ScopeMenu scope={scope} onChange={onScopeChange} />;
  const newButton = (
    <PrimaryButton onClick={onNew}>
      <Plus size={16} aria-hidden="true" />
      {config.primary}
    </PrimaryButton>
  );

  /*
   * The filter row's four controls with their labels sold off — L-F only.
   *
   * One-to-one with the labelled row below and in its order, which is not the
   * order Contacts uses: this page leads with search because its filter row
   * does. Normalising the two would have made the clusters match and the
   * pages stop matching themselves, and L-F is a claim about a row's width,
   * not about a house order for toolbars.
   *
   * Sort keeps its `1`, Advanced filters keeps its count. They are the only
   * thing left saying that this list is not the plain "Upcoming" it claims to
   * be — the labels that used to carry that news are gone.
   */
  const glyphControls = (
    <>
      <CollapsingSearch placeholder={config.search.placeholder} label={config.search.label} />
      <GlyphButton
        icon={ListFilter}
        label="Advanced filters"
        count={filterCount || undefined}
        onClick={() => setDrawer({ kind: "filters" })}
      />
      <GlyphButton icon={ArrowUpDown} label="Sort by" count={1} onClick={() => setDrawer({ kind: "sort" })} />
      <GlyphButton icon={Columns3} label="Manage columns" onClick={() => setDrawer({ kind: "columns" })} />
    </>
  );

  const [sortKey, sortDir] = list.sort.split("-") as [string, "asc" | "desc"];
  const statusOptions = config.filterFields.find((f) => f.id === "status")?.options ?? [];
  const toolbarModel: ListToolbarModel = {
    views: {
      items: views.map((v) => ({ id: v.id, label: v.label, icon: v.icon })),
      activeId: view,
      onSelect: selectView,
      onCreate: () => setDrawer({ kind: "customize", isNew: true }),
      noun: "smart list",
    },
    search: { value: query, onChange: setQuery, placeholder: config.search.placeholder },
    quickFilters: [
      {
        id: "status",
        label: "Status",
        options: statusOptions.map((o) => ({ value: o, label: o })),
        value: statusFilter,
        multiple: true,
        onChange: setStatusFilter,
      },
    ],
    advanced: {
      count: filterCount,
      onOpen: () => setDrawer({ kind: "filters" }),
      onClear: () => setList((l) => ({ ...l, filters: [] })),
      chips: list.filters.flatMap((g) =>
        g.conditions
          .filter((c) => c.value !== "")
          .map((c) => {
            const field = config.filterFields.find((f) => f.id === c.fieldId);
            const verb =
              field?.kind === "date" ? c.mode : c.operator === "is-not" ? "is not" : "is";
            const value = field?.kind === "date" ? formatAdded(c.value) : c.value;
            return {
              id: c.id,
              label: `${field?.label ?? c.fieldId} ${verb} ${value}`,
              onRemove: () =>
                setList((l) => ({
                  ...l,
                  filters: l.filters
                    .map((x) => ({ ...x, conditions: x.conditions.filter((y) => y.id !== c.id) }))
                    .filter((x) => x.conditions.length > 0),
                })),
            };
          }),
      ),
    },
    sort: {
      fields: [
        { value: "time", label: config.timeLabel },
        { value: "added", label: "Date added" },
      ],
      value: { field: sortKey, dir: sortDir },
      onChange: (v) =>
        setList((l) => ({ ...l, sort: v ? `${v.field}-${v.dir}` : defaults.sort })),
    },
    columns: {
      items: list.columns.flatMap((p) => {
        const def = config.columns.find((c) => c.id === p.id);
        return def
          ? [{ id: def.id, label: def.label, visible: p.visible || !!def.locked, locked: def.locked }]
          : [];
      }),
      onChange: (items) =>
        setList((l) => ({ ...l, columns: items.map((c) => ({ id: c.id, visible: c.visible })) })),
    },
    resultCount: { value: shown.length, noun: shown.length === 1 ? config.noun : config.nouns },
  };

  const seeAll = () => selectView("all");
  const emptyView = inView.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[12px]">
      <PageHeader
        title="Appointments"
        count={mergedRow && !toolbar.shared ? undefined : String(shown.length)}
        description={config.description}
        lead={
          !toolbar.shared && mergedRow && showViews ? (
            <ScopePicker
              views={views.map((v) =>
                v.id === view
                  ? { ...v, count: String(shown.length) }
                  : { ...v, count: String(rowsFor(v.id, configFor(v.id), "").shown.length) },
              )}
              activeId={view}
              onSelect={selectView}
              label="Appointment views"
              showCount={effective.pageHeader && effective.pageCount}
              onCreate={() => setDrawer({ kind: "customize", isNew: true })}
              createLabel="Smart list"
            />
          ) : undefined
        }
        /*
          Calendar type is a filter, not a renderer: "Meetings" decides which
          appointments are in the table, the way Filters and Sort do, and it
          only sits up here because L-B's row had the space for it. So it
          leaves with the rest of them under `listShowFilters` rather than
          clinging on as the last control of a band that is gone.
        */
        aside={toolbar.shared ? scopeMenu : mergedRow || !showFilters ? undefined : scopeMenu}
        primary={
          scopeInTrail && !toolbar.shared
            ? undefined
            : { label: config.primary, icon: Plus, onClick: onNew }
        }
      />

      {/*
        The saved-view row leaves the page entirely in the two variants that
        moved it. Hiding it rather than dimming it: a tab strip that is still
        drawn while the trail also switches views is two controls for one
        choice, which is the exact duplication the axis exists to price.

        ViewBar owns the overflow (`N more ▾`) in the order the live row has —
        tabs, then the rest, then the button that makes a new one — and the
        chip is not a tab there either.
      */}
      {!toolbar.shared && shape.scopeInTabs ? (
        <ViewBar
          label="Appointment views"
          views={views}
          activeId={view}
          onSelect={selectView}
          onCreate={() => setDrawer({ kind: "customize", isNew: true })}
          createLabel="Smart list"
          maxVisible={4}
          className={oneRow ? "h-[46px]" : undefined}
          trailing={
            oneRow ? (
              /*
                L-F: the filter row below is deleted and arrives here as four
                glyphs. Customize list goes with it — on a row this full the
                one control that is neither a view nor a filter is the one to
                drop, and `+ Smart list` still reaches the same drawer.
              */
              <span className="flex shrink-0 items-center gap-[8px]">
                {glyphControls}
              </span>
            ) : showFilters ? (
              /*
                Customize list is the column picker wearing a verb, so it
                answers to `listShowFilters` like Manage columns below it
                rather than to the views it happens to sit beside. With the
                filters off the strip's right edge is simply empty, which is
                the tab strip this page had before either band was invented.
              */
              <button
                type="button"
                onClick={() => setDrawer({ kind: "customize", isNew: false })}
                className="motion-tap flex items-center gap-[6px] px-[8px] text-[12.5px] leading-none font-medium text-pg-muted hover:text-pg-text"
              >
                <Columns3 size={14} aria-hidden="true" />
                Customize list
              </button>
            ) : undefined
          }
        />
      ) : null}

      {/*
        Gone under L-F — this is the row L-F buys back. Every other variant
        keeps it, including L-B, whose header row took the scope picker but
        not these four.

        `listShowFilters: false` takes it away everywhere, and the row itself
        goes with its contents — EXCEPT under L-E, where it is also carrying
        the scope menu and the primary action, and a page you cannot book from
        is not a variant. `shape.filterRow` is "there is a labelled filter row
        somewhere"; the `|| scopeInTrail` is this page saying it needs the row
        for a second reason.
      */}
      {!toolbar.shared && (shape.filterRow || scopeInTrail) ? (
        <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
          {showFilters ? (
            <>
              <div className="flex h-[34px] min-w-[220px] flex-1 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
                <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={config.search.placeholder}
                  aria-label={config.search.label}
                  className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
                />
              </div>
              <OutlineButton onClick={() => setDrawer({ kind: "filters" })}>
                <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
                Advanced filters
                {filterCount ? <CountBadge n={filterCount} /> : null}
              </OutlineButton>
              <OutlineButton onClick={() => setDrawer({ kind: "sort" })}>
                <ArrowUpDown size={15} aria-hidden="true" className="text-pg-text-strong" />
                Sort by
                <CountBadge n={1} />
              </OutlineButton>
              <OutlineButton onClick={() => setDrawer({ kind: "columns" })}>
                <Columns3 size={15} aria-hidden="true" className="text-pg-text-strong" />
                Manage columns
              </OutlineButton>
            </>
          ) : (
            /*
              The slack the search field was taking. Without it the two actions
              below would sit at the left edge of an otherwise empty row, which
              reads as a toolbar that failed to load rather than as a page with
              its filters switched off.
            */
            <span aria-hidden="true" className="min-w-[16px] flex-1" />
          )}
          {/*
            With no header the scope menu and the primary action ride here, on
            the right edge they held when there was one. An appointments page
            you cannot book from is not a header variant, it is a broken page.
          */}
          {scopeInTrail ? (
            <>
              {showFilters ? scopeMenu : null}
              {newButton}
            </>
          ) : null}
        </div>
      ) : null}

      {(() => {
        const table = (
      <div className="flex min-h-0 flex-1 flex-col overflow-auto rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div
          style={{ gridTemplateColumns: cols }}
          className="sticky top-0 z-10 grid h-[38px] shrink-0 items-center gap-[12px] border-b border-pg-head-border bg-pg-surface px-[14px]"
        >
          {["#", ...visibleCols.map((c) => c.label), ""].map((h, i) => (
            <span
              key={h || `blank-${i}`}
              className="truncate text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
            >
              {h}
            </span>
          ))}
        </div>

        {/*
          The empty state lives INSIDE the card, under the header row, rather
          than replacing the card. The columns are still the answer to "what
          would be here", and a table that vanishes when it is empty makes the
          next booking look like it arrived on a different screen.
        */}
        {shown.length === 0 ? (
          emptyView ? (
            <EmptyState
              title={view === "upcoming" ? config.empty.title : `No ${config.nouns} in ${active.label}`}
              body={
                view === "upcoming"
                  ? config.empty.body
                  : `There aren't any ${config.nouns} in this list right now.`
              }
              cta={view === "all" ? undefined : config.empty.cta}
              onCta={seeAll}
            />
          ) : (
            <EmptyState
              title={`No ${config.nouns} match`}
              body="Try a different search, or clear the filters to see everything in this list."
              cta="Clear filters"
              onCta={() => {
                setQuery("");
                setStatusFilter([]);
                setList((l) => ({ ...l, filters: [] }));
              }}
            />
          )
        ) : null}

        {shown.map((r) => {
          const status = statusOf(r);
          const cell: CellCtx = {
            status,
            onStatus: (next) => {
              onStatus(r.id, next);
              showToast(`Status changed to ${next}`);
            },
          };
          return (
            <div
              key={r.id}
              style={{ gridTemplateColumns: cols }}
              className="group grid min-h-[52px] w-full shrink-0 items-center gap-[12px] border-b border-pg-row-border px-[14px] last:border-b-0 hover:bg-pg-bg"
            >
              <span className="text-[12.5px] leading-[normal] text-pg-faint tabular-nums">
                {r.num}
              </span>
              {visibleCols.map((c) => (
                <React.Fragment key={c.id}>{c.render(r, cell)}</React.Fragment>
              ))}
              <RowActions
                name={config.nameOf(r)}
                noun={config.noun}
                cancelled={status === "Cancelled"}
                onCancel={() => {
                  onStatus(r.id, "Cancelled");
                  showToast(`${config.noun === "booking" ? "Booking" : "Appointment"} cancelled`);
                }}
                onReschedule={() => showToast(`Reschedule link sent to ${r.contact}`)}
                onEdit={() => showToast(`Editing ${config.nameOf(r)}`)}
              />
            </div>
          );
        })}
      </div>
        );
        return toolbar.shared ? (
          <ListToolbar model={toolbarModel}>
            <div className="flex min-h-0 flex-1 flex-col">{table}</div>
          </ListToolbar>
        ) : (
          table
        );
      })()}

      {drawer?.kind === "filters" ? (
        <AdvancedFiltersDrawer
          fields={config.filterFields}
          applied={list.filters}
          onApply={(filters) => setList((l) => ({ ...l, filters }))}
          onClose={close}
        />
      ) : null}
      {drawer?.kind === "sort" ? (
        <SortByDrawer
          options={sortOptions}
          value={list.sort}
          onApply={(sort) => setList((l) => ({ ...l, sort }))}
          onClose={close}
        />
      ) : null}
      {drawer?.kind === "columns" ? (
        <ManageColumnsDrawer
          columns={config.columns}
          value={list.columns}
          onApply={(columns) => setList((l) => ({ ...l, columns }))}
          onClose={close}
        />
      ) : null}
      {drawer?.kind === "customize" ? (
        <CustomizeListDrawer
          key={drawer.isNew ? "new" : view}
          initialName={drawer.isNew ? "New smart list" : active.label}
          initial={list}
          fields={config.filterFields}
          sortOptions={sortOptions}
          columns={config.columns}
          onClose={close}
          onSaveAsNew={({ label, ...next }) => {
            const id = newFilterId("list");
            onSave({ id, label, base: baseOf(view).id, ...next });
            setView(id);
            setList(next);
            close();
            showToast("Smart list saved");
          }}
        />
      ) : null}
    </div>
  );
}

function CountBadge({ n }: { n: number }) {
  return (
    <span className="flex size-[17px] shrink-0 items-center justify-center rounded-full bg-brand text-[11px] leading-none font-semibold text-brand-fg">
      {n}
    </span>
  );
}

/* ── menus ──────────────────────────────────────────────────────────────── */

/**
 * `Meetings ▾` — which kind of booking the table lists.
 *
 * A real menu now, where every other `▾` on these screens is still static:
 * this one changes the columns, the tabs and the primary action, which is the
 * difference between a caption and a control.
 */
function ScopeMenu({
  scope,
  onChange,
}: {
  scope: CalendarScope;
  onChange: (s: CalendarScope) => void;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <>
      <span ref={ref} className="inline-flex shrink-0">
        <SelectButton
          label="Calendar type"
          value={scopeLabel(scope)}
          onClick={() => setOpen((v) => !v)}
        />
      </span>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={180} align="end">
          <div role="listbox" aria-label="Calendar type" className="flex flex-col p-[4px]">
            {CALENDAR_SCOPES.map((s) => (
              <MenuOption
                key={s.id}
                selected={s.id === scope}
                onClick={() => {
                  close();
                  if (s.id !== scope) onChange(s.id);
                }}
              >
                {s.label}
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

function StatusMenu({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <>
      <span ref={ref} className="inline-flex w-fit">
        <SelectButton
          label={label}
          value={value}
          onClick={() => setOpen((v) => !v)}
          className="h-[30px] w-fit px-[10px] text-[12.5px]"
        />
      </span>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={170}>
          <div role="listbox" aria-label={label} className="flex flex-col p-[4px]">
            {APPOINTMENT_STATUSES.map((s) => (
              <MenuOption
                key={s}
                selected={s === value}
                onClick={() => {
                  close();
                  if (s !== value) onChange(s);
                }}
              >
                {s}
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/**
 * The row kebab: Edit, Reschedule, Cancel.
 *
 * Cancel is the only item that changes the table — the row's status becomes
 * Cancelled, so it leaves Upcoming and shows up under Cancelled. The other two
 * would open flows this screen does not own, so they confirm and stop.
 */
function RowActions({
  name,
  noun,
  cancelled,
  onEdit,
  onReschedule,
  onCancel,
}: {
  name: string;
  noun: string;
  cancelled: boolean;
  onEdit: () => void;
  onReschedule: () => void;
  onCancel: () => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const run = (fn: () => void) => () => {
    close();
    fn();
  };
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={`Actions for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={
          "motion-tap flex size-[28px] items-center justify-center rounded-[7px] text-pg-faint group-hover:opacity-100 hover:bg-pg-surface hover:text-pg-text focus-visible:opacity-100 " +
          (open ? "bg-pg-surface text-pg-text opacity-100" : "opacity-0")
        }
      >
        <EllipsisVertical size={15} aria-hidden="true" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={200} align="end">
          <div role="menu" aria-label={`Actions for ${name}`} className="flex flex-col p-[4px]">
            <MenuOption onClick={run(onEdit)}>
              <Pencil size={14} aria-hidden="true" className="shrink-0 text-pg-muted" />
              Edit
            </MenuOption>
            <MenuOption onClick={run(onReschedule)} disabled={cancelled}>
              <CalendarClock size={14} aria-hidden="true" className="shrink-0 text-pg-muted" />
              Reschedule
            </MenuOption>
            <MenuOption onClick={run(onCancel)} danger disabled={cancelled}>
              <CalendarX2 size={14} aria-hidden="true" className="shrink-0" />
              Cancel {noun}
            </MenuOption>
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/* ── empty ──────────────────────────────────────────────────────────────── */

function EmptyState({
  title,
  body,
  cta,
  onCta,
}: {
  title: string;
  body: string;
  cta?: string;
  onCta: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-[6px] px-[24px] py-[56px] text-center">
      <CalendarIllustration />
      <p className="mt-[12px] text-[16px] leading-[22px] font-semibold text-pg-heading">{title}</p>
      <p className="max-w-[360px] text-[13px] leading-[18px] text-pg-muted">{body}</p>
      {cta ? (
        <PrimaryButton onClick={onCta} className="mt-[12px]">
          {cta}
        </PrimaryButton>
      ) : null}
    </div>
  );
}

/**
 * A calendar page with nothing on it, drawn in the page's own tokens so it
 * recolours with the theme. The one filled day is today; the sparkle is the
 * only ornament, and it is there so the drawing reads as "nothing yet" rather
 * than "something broke".
 */
function CalendarIllustration() {
  return (
    <span className="relative flex">
      <svg viewBox="0 0 120 104" className="h-[96px] w-[112px]" aria-hidden="true">
        <ellipse cx="60" cy="98" rx="42" ry="4" className="fill-pg-border" opacity="0.6" />
        <rect x="14" y="14" width="92" height="78" rx="10" className="fill-pg-surface stroke-pg-border" strokeWidth="2" />
        <path d="M14 24a10 10 0 0 1 10-10h72a10 10 0 0 1 10 10v10H14z" className="fill-brand-soft" />
        <rect x="36" y="6" width="6" height="16" rx="3" className="fill-brand" />
        <rect x="78" y="6" width="6" height="16" rx="3" className="fill-brand" />
        {[0, 1, 2].map((row) =>
          [0, 1, 2, 3, 4].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={24 + col * 15}
              y={44 + row * 14}
              width="10"
              height="8"
              rx="2"
              className={row === 1 && col === 2 ? "fill-brand" : "fill-pg-border"}
              opacity={row === 1 && col === 2 ? 1 : 0.7}
            />
          )),
        )}
      </svg>
      <Sparkles size={16} aria-hidden="true" className="absolute -top-[2px] -right-[6px] text-brand" />
    </span>
  );
}
