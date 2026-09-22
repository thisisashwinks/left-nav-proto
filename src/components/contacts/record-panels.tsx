"use client";

import * as React from "react";
import {
  Calendar,
  CircleDollarSign,
  ClipboardCheck,
  ExternalLink,
  FileText,
  Keyboard,
  MousePointerClick,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  Share2,
  Sparkles,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { SideDrawer } from "@/components/page/side-drawer";
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
  { id: "relations", label: "Relations", icon: UsersRound },
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
}: {
  panels?: RecordPanelDef[];
  activeId: string | null;
  onSelect: (id: string | null) => void;
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
      <span
        aria-hidden="true"
        className="flex size-[32px] items-center justify-center rounded-[8px] bg-pg-surface text-pg-muted shadow-[0_1px_3px_0_rgba(15,23,42,0.12)]"
      >
        <Keyboard size={17} />
      </span>
    </div>
  );
}

/* ─── Panel bodies ──────────────────────────────────────────────────────── */

function Empty({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-[7px] px-[20px] py-[40px] text-center">
      <Icon size={22} aria-hidden="true" className="text-pg-disabled" />
      <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
        {title}
      </span>
      {hint ? (
        <span className="text-[12.5px] leading-[17px] text-pg-muted">{hint}</span>
      ) : null}
    </div>
  );
}

function Section({
  label,
  count,
  onAdd,
  children,
}: {
  label: string;
  count: number;
  onAdd?: boolean;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(count > 0);
  return (
    <div className="border-b border-pg-row-border py-[10px] last:border-b-0">
      <div className="flex items-center gap-[8px]">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="min-w-0 flex-1 text-left text-[13px] leading-[18px] font-semibold text-pg-heading motion-tap"
        >
          {label} ({count})
        </button>
        {onAdd ? (
          <button
            type="button"
            className="flex items-center gap-[3px] text-[12.5px] leading-none font-medium text-brand motion-tap hover:brightness-110"
          >
            <Plus size={13} aria-hidden="true" />
            Add
          </button>
        ) : null}
      </div>
      {open ? <div className="pt-[8px]">{children}</div> : null}
    </div>
  );
}

const ACTIVITY = [
  {
    day: "Jun 19, 2026",
    entries: [
      {
        what: "Trigger link visited",
        source: "Trigger Link",
        detail: "mmlite_template_ver_a",
        path: "/links/r/2/eyJhbGciOiJIU…",
        when: "Jun 19 at 5:25 PM",
      },
    ],
  },
  {
    day: "Mar 26, 2026",
    entries: [
      {
        what: "Trigger link visited",
        source: "Trigger Link",
        detail: "mmlite_template_ver_a",
        path: "/links/r/2/eyJhbGciOiJI…",
        when: "Mar 26 at 11:25 PM",
      },
    ],
  },
];

function ActivityBody() {
  return (
    <div className="flex flex-col py-[10px]">
      {ACTIVITY.map((group) => (
        <div key={group.day} className="pb-[14px]">
          <span className="text-[11.5px] leading-[16px] font-semibold tracking-[0.04em] text-pg-muted uppercase">
            {group.day}
          </span>
          {group.entries.map((e) => (
            <div key={e.when} className="flex gap-[9px] pt-[10px]">
              <span className="mt-[2px] flex size-[24px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                <MousePointerClick size={13} aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
                  {e.what}
                </span>
                <div className="flex flex-col gap-[2px] rounded-[8px] bg-pg-surface px-[9px] py-[7px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
                  <span className="w-fit rounded-[4px] bg-brand-soft px-[5px] text-[12px] leading-[18px] font-medium text-brand">
                    Source: {e.source}
                  </span>
                  <span className="truncate text-[13px] leading-[18px] text-pg-text">
                    {e.detail}
                  </span>
                </div>
                <span className="flex items-center gap-[5px] text-[12px] leading-[16px] text-pg-faint">
                  <span className="min-w-0 truncate">{e.path}</span>
                  <ExternalLink size={11} aria-hidden="true" className="shrink-0" />
                  <span className="shrink-0">{e.when}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function AiBody() {
  return (
    <div className="flex flex-col py-[12px]">
      <div className="flex gap-[10px] rounded-[10px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px] bg-brand-soft text-brand">
          <Sparkles size={15} aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-[7px]">
          <span className="text-[13.5px] leading-[18px] font-semibold text-pg-heading">
            Let AI draft your replies
          </span>
          <span className="text-[12.5px] leading-[17px] text-pg-muted">
            Get AI reply suggestions for every inbound message. You approve
            before anything is sent.{" "}
            <span className="font-medium text-brand">Learn more</span>
          </span>
          <PrimaryButton className="h-[30px] self-start px-[12px] text-[12.5px]">
            <Sparkles size={14} aria-hidden="true" />
            Turn on AI agent
          </PrimaryButton>
        </div>
      </div>

      <div className="flex items-center justify-between py-[12px]">
        <span className="text-[13px] leading-none text-pg-muted">0 items</span>
        <button
          type="button"
          className="flex items-center gap-[5px] text-[12.5px] leading-none font-medium text-pg-text-strong motion-tap hover:text-brand"
        >
          <RotateCcw size={13} aria-hidden="true" />
          Refresh
        </button>
      </div>
      <div className="flex h-[34px] items-center gap-[8px] rounded-[8px] px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          aria-label="Search messages or agent"
          placeholder="Search messages or agent"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </div>
      <Empty icon={Sparkles} title="No agent logs found" />
    </div>
  );
}

/**
 * One panel of the rail, in the shared drawer.
 *
 * `contact` is handled by the caller — on the inbox it is the contact card,
 * on the record page the page already IS that, so the rail there drops it.
 */
export function RecordPanelDrawer({
  panelId,
  onClose,
  className,
  inline,
  width = 340,
}: {
  panelId: string;
  /** Omit on the record page, where the column is permanent furniture. */
  onClose?: () => void;
  /** Lets the host park the card clear of its rail. */
  className?: string;
  inline?: boolean;
  width?: number;
}) {
  const def = RECORD_PANELS.find((p) => p.id === panelId);
  const title = def?.label ?? "Panel";

  const footer =
    panelId === "activity" ? (
      <div className="flex min-w-0 flex-col gap-[3px]">
        <span className="truncate text-[12px] leading-[16px] text-pg-muted">
          First attribution source:{" "}
          <span className="font-medium text-pg-text">CRM UI</span>
        </span>
        <span className="truncate text-[12px] leading-[16px] text-pg-muted">
          Latest attribution source:{" "}
          <span className="font-medium text-pg-text">Direct traffic</span>
        </span>
      </div>
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
      trailing={
        panelId === "associations" ? (
          <button
            type="button"
            className="flex shrink-0 items-center gap-[4px] text-[12.5px] leading-none font-medium text-pg-text-strong motion-tap hover:text-brand"
          >
            <ExternalLink size={13} aria-hidden="true" />
            Manage
          </button>
        ) : undefined
      }
      footer={footer}
    >
      {panelId === "activity" ? <ActivityBody /> : null}
      {panelId === "ai" ? <AiBody /> : null}
      {panelId === "associations" ? (
        <div className="py-[4px]">
          <Section label="Contacts" count={0} onAdd>
            <div className="flex flex-col items-center gap-[9px] py-[6px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">
                No contact associated
              </span>
              <span className="flex gap-[8px]">
                <OutlineButton className="h-[30px] px-[11px] text-[12.5px]">
                  Create new
                </OutlineButton>
                <button
                  type="button"
                  className="text-[12.5px] leading-none font-medium text-brand motion-tap hover:brightness-110"
                >
                  Link existing
                </button>
              </span>
            </div>
          </Section>
          <Section label="Companies" count={1}>
            <div className="rounded-[8px] bg-pg-surface px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
              Golden Boost
            </div>
          </Section>
          <Section label="Properties" count={0} onAdd />
        </div>
      ) : null}
      {panelId === "relations" ? (
        <Empty icon={UsersRound} title="No relations yet" hint="Link people who share a household or an account." />
      ) : null}
      {panelId === "tasks" ? (
        <Empty icon={ClipboardCheck} title="No tasks yet" hint="Tasks assigned on this record show up here." />
      ) : null}
      {panelId === "notes" ? (
        <Empty icon={PenLine} title="No notes yet" hint="Notes are private to your team." />
      ) : null}
      {panelId === "appointments" ? (
        <Empty icon={Calendar} title="No appointments yet" hint="Bookings on this record show up here." />
      ) : null}
      {panelId === "documents" ? (
        <Empty icon={FileText} title="No documents yet" hint="Proposals, estimates, and contracts land here." />
      ) : null}
      {panelId === "payments" ? (
        <Empty icon={CircleDollarSign} title="No payments yet" hint="Invoices and transactions land here." />
      ) : null}
    </SideDrawer>
  );
}
