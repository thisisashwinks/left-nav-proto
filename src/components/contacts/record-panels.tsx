"use client";

import * as React from "react";
import {
  Calendar,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Keyboard,
  PenLine,
  Plus,
  RotateCcw,
  Share2,
  Sparkles,
  UserRound,
  Target,
  type LucideIcon,
} from "lucide-react";
import { SideDrawer } from "@/components/page/side-drawer";
import { useRecordSlice } from "./record-store";
import { ActivityBody, ActivityFooter, seedActivity } from "./activity-panel";
import { AssociationsBody, ManageAssociationsLink } from "./associations-panel";
import { EMPTY_ASSOCIATIONS, LINKABLE, type Associations } from "./associations-data";
import { OpportunitiesBody, seedOpportunities } from "./opportunities-panel";
import { TasksBody, seedTasks } from "./tasks-panel";
import { NotesBody, seedNotes } from "./notes-panel";
import { DocumentsBody, seedDocuments } from "./documents-panel";
import {
  PaymentsBody,
  PaymentsHeaderActions,
  seedPayments,
  type PaymentActionId,
} from "./payments-panel";
import { AgentLogsBody } from "./agent-logs-panel";
import { AppointmentsBody, seedAppointments, type Appointment } from "./appointments-panel";
import { NewBookingPage } from "./new-booking-page";
import { cn } from "@/lib/utils";

/**
 * The record rail — one column of icons, one panel at a time.
 *
 * These are all the SAME record seen from a different side, which is why they
 * are a rail of panels rather than tabs: tabs would claim they re-cut the
 * page, and they do not. The page keeps showing what it was showing; a panel
 * lays an aspect of the record over the right edge and takes it away again.
 */
export interface RecordPanelDef {
  id: string;
  label: string;
  icon: LucideIcon;
  /** A count on the rail — the AI agent's unread log, for instance. */
  badge?: string;
}

export const RECORD_PANELS: RecordPanelDef[] = [
  { id: "contact", label: "Contact details", icon: UserRound },
  { id: "activity", label: "Activity", icon: RotateCcw },
  { id: "associations", label: "Associations", icon: Share2 },
  { id: "opportunities", label: "Opportunities", icon: Target },
  { id: "tasks", label: "Tasks", icon: ClipboardCheck },
  { id: "notes", label: "Notes", icon: PenLine },
  { id: "appointments", label: "Appointments", icon: Calendar },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "payments", label: "Payments", icon: CircleDollarSign },
  { id: "ai", label: "AI agent logs", icon: Sparkles, badge: "1" },
];

export function PanelRail({
  panels = RECORD_PANELS,
  activeId,
  onSelect,
  onShortcuts,
}: {
  panels?: RecordPanelDef[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
  /** Opens the keyboard shortcuts sheet; without it the key is decoration. */
  onShortcuts?: () => void;
}) {
  return (
    <div className="flex w-[42px] shrink-0 flex-col items-center gap-[2px] py-[6px]">
      {panels.map((p) => {
        const on = p.id === activeId;
        return (
          <button
            key={p.id}
            type="button"
            title={p.label}
            aria-label={p.label}
            aria-pressed={on}
            onClick={() => onSelect(on ? null : p.id)}
            className={cn(
              "relative flex size-[32px] shrink-0 items-center justify-center rounded-[8px] motion-tap active:scale-90",
              on
                ? "bg-pg-surface text-brand shadow-[0_1px_3px_0_rgba(15,23,42,0.12)]"
                : "text-pg-muted hover:bg-pg-surface hover:text-pg-text",
            )}
          >
            <p.icon size={17} aria-hidden="true" />
            {p.badge ? (
              <span className="absolute -right-[1px] -bottom-[1px] flex size-[14px] items-center justify-center rounded-full bg-pg-danger text-[9px] leading-none font-semibold text-white">
                {p.badge}
              </span>
            ) : null}
          </button>
        );
      })}
      <span className="flex-1" />
      <button
        type="button"
        title="Keyboard shortcuts"
        aria-label="Keyboard shortcuts"
        onClick={onShortcuts}
        disabled={!onShortcuts}
        className="flex size-[32px] items-center justify-center rounded-[8px] bg-pg-surface text-pg-muted shadow-[0_1px_3px_0_rgba(15,23,42,0.12)] motion-tap enabled:hover:text-pg-text enabled:active:scale-90"
      >
        <Keyboard size={17} aria-hidden="true" />
      </button>
    </div>
  );
}

/* ─── Panel bodies ──────────────────────────────────────────────────────── */

/** The contact a drawer is open on. */
export interface PanelRecord {
  id: string;
  name: string;
  initials: string;
  email?: string;
  phone?: string;
}

/** For hosts that have not said which record they are — the prototype's Jatin. */
const FALLBACK_RECORD: PanelRecord = {
  id: "jatin",
  name: "Jatin Sharma",
  initials: "JS",
  email: "jatin@example.com",
};

/** The header's "+ Add" — each panel that creates things opens its form from here. */
function HeaderAdd({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 items-center gap-[3px] text-[12.5px] leading-none font-medium text-pg-text-strong motion-tap hover:text-brand"
    >
      <Plus size={13} aria-hidden="true" />
      Add
    </button>
  );
}

/*
 * One small reader per panel, so each pulls only its own slice of the record
 * store — and so the seed runs the first time that panel is looked at, not
 * for every panel the moment the drawer opens.
 */

function ActivityPanel({ record }: { record: PanelRecord }) {
  const entries = React.useMemo(() => seedActivity(record.id), [record.id]);
  return <ActivityBody key={record.id} entries={entries} />;
}

function AssociationsPanel({ record }: { record: PanelRecord }) {
  const [value, set] = useRecordSlice<Associations>(record.id, "associations", () =>
    // The seeded contacts keep the company the static panel always showed.
    record.id === FALLBACK_RECORD.id || record.id === "sukarto"
      ? { ...EMPTY_ASSOCIATIONS, companies: [LINKABLE.companies[0]!] }
      : EMPTY_ASSOCIATIONS,
  );
  return (
    <AssociationsBody key={record.id} recordName={record.name} value={value} onChange={set} />
  );
}

function OpportunitiesPanel({ record, addSignal }: { record: PanelRecord; addSignal: number }) {
  const [value, set] = useRecordSlice(record.id, "opportunities", () =>
    seedOpportunities(record.id),
  );
  return <OpportunitiesBody record={record} value={value} onChange={set} addSignal={addSignal} />;
}

function TasksPanel({ record, addSignal }: { record: PanelRecord; addSignal: number }) {
  const [tasks, set] = useRecordSlice(record.id, "tasks", () => seedTasks(record.id, record));
  return <TasksBody record={record} tasks={tasks} onChange={set} addSignal={addSignal} />;
}

function NotesPanel({ record, addSignal }: { record: PanelRecord; addSignal: number }) {
  const [notes, set] = useRecordSlice(record.id, "notes", () => seedNotes(record.id, record));
  return <NotesBody record={record} notes={notes} onChange={set} addSignal={addSignal} />;
}

function PaymentsPanel({
  record,
  actionSignal,
}: {
  record: PanelRecord;
  actionSignal?: { id: PaymentActionId; n: number };
}) {
  const [value, set] = useRecordSlice(record.id, "payments", () => seedPayments(record.id));
  return (
    <PaymentsBody
      recordId={record.id}
      recordName={record.name}
      value={value}
      onChange={set}
      actionSignal={actionSignal}
    />
  );
}

function AppointmentsPanel({ record, addSignal }: { record: PanelRecord; addSignal: number }) {
  const [value, set] = useRecordSlice(record.id, "appointments", () =>
    seedAppointments(record.id),
  );
  // Services and rentals book on a full page of their own, over everything.
  const [booking, setBooking] = React.useState<"service" | "rental" | null>(null);
  return (
    <>
      <AppointmentsBody
        record={record}
        value={value}
        onChange={set}
        addSignal={addSignal}
        onOpenBooking={setBooking}
      />
      {booking ? (
        <NewBookingPage
          kind={booking}
          record={record}
          onClose={() => setBooking(null)}
          onCreate={(r) => {
            const appt: Appointment = {
              id: `ap-${Date.now()}`,
              kind: r.kind,
              calendar: r.kind === "service" ? "Services" : "Rentals",
              title: r.title,
              // The panel reads local wall-clock times, without a zone.
              start: r.start.slice(0, 16),
              end: r.end.slice(0, 16),
              status: "confirmed",
              teamMember: r.items[0]?.staff,
            };
            set([appt, ...value]);
          }}
        />
      ) : null}
    </>
  );
}

function DocumentsPanel({ record, addSignal }: { record: PanelRecord; addSignal: number }) {
  const [docs, set] = useRecordSlice(record.id, "documents", () => seedDocuments(record.id));
  return <DocumentsBody recordId={record.id} value={docs} onChange={set} addSignal={addSignal} />;
}

/**
 * One panel of the rail, in the shared drawer.
 *
 * `contact` is handled by the caller — on the inbox it is the contact card,
 * on the record page the page already IS that, so the rail there drops it.
 */
export function RecordPanelDrawer({
  panelId,
  record = FALLBACK_RECORD,
  onClose,
  className,
  inline,
  width = 340,
}: {
  panelId: string;
  /** Whose panels these are. Each record keeps its own notes, tasks and links. */
  record?: PanelRecord;
  /** Omit on the record page, where the column is permanent furniture. */
  onClose?: () => void;
  /** Lets the host park the card clear of its rail. */
  className?: string;
  inline?: boolean;
  width?: number;
}) {
  const def = RECORD_PANELS.find((p) => p.id === panelId);
  const title = def?.label ?? "Panel";
  /*
   * The header's "+ Add" is a pulse, not a state: each click bumps the
   * number and the open panel opens its form. Keyed to the panel and record
   * below, so a new body never inherits a click meant for the last one.
   */
  const [addSignal, setAddSignal] = React.useState(0);
  const bump = () => setAddSignal((n) => n + 1);
  const [paySignal, setPaySignal] = React.useState<
    { id: PaymentActionId; n: number } | undefined
  >();
  const bodyKey = `${panelId}:${record.id}`;

  const trailing =
    panelId === "associations" ? (
      <ManageAssociationsLink />
    ) : panelId === "payments" ? (
      <PaymentsHeaderActions
        onAction={(id) => setPaySignal((p) => ({ id, n: (p?.n ?? 0) + 1 }))}
      />
    ) : ["opportunities", "tasks", "notes", "appointments", "documents"].includes(panelId) ? (
      <HeaderAdd onClick={bump} />
    ) : undefined;

  return (
    <SideDrawer
      width={width}
      inline={inline}
      className={className}
      onClose={onClose}
      title={
        <span className="truncate text-[14px] leading-[18px] font-semibold text-pg-heading">
          {title}
          {panelId === "activity" ? (
            <span className="font-normal text-pg-muted"> (IST)</span>
          ) : null}
        </span>
      }
      trailing={trailing}
      footer={panelId === "activity" ? <ActivityFooter /> : undefined}
    >
      <React.Fragment key={bodyKey}>
        {panelId === "activity" ? <ActivityPanel record={record} /> : null}
        {panelId === "associations" ? <AssociationsPanel record={record} /> : null}
        {panelId === "opportunities" ? (
          <OpportunitiesPanel record={record} addSignal={addSignal} />
        ) : null}
        {panelId === "tasks" ? <TasksPanel record={record} addSignal={addSignal} /> : null}
        {panelId === "notes" ? <NotesPanel record={record} addSignal={addSignal} /> : null}
        {panelId === "documents" ? (
          <DocumentsPanel record={record} addSignal={addSignal} />
        ) : null}
        {panelId === "ai" ? <AgentLogsBody recordId={record.id} /> : null}
        {panelId === "appointments" ? (
          <AppointmentsPanel record={record} addSignal={addSignal} />
        ) : null}
        {panelId === "payments" ? (
          <PaymentsPanel record={record} actionSignal={paySignal} />
        ) : null}
      </React.Fragment>
    </SideDrawer>
  );
}
