"use client";

import * as React from "react";
import {
  Check,
  Funnel,
  Phone,
  RotateCcw,
  Search,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { PanelMenu } from "@/components/contacts/payments-panel";
import { cn } from "@/lib/utils";

/**
 * The AI agent logs panel of the record rail.
 *
 * What the account's agents did on this one person — every reply they
 * drafted, sent, or had thrown out. Off by default, so the top card is the
 * switch; once it is on the list below starts filling, and search and the
 * filter menu cut it the way the Conversation AI dashboard does.
 */

type AgentKind = "conversation" | "voice";
type LogStatus = "suggested" | "sent" | "dismissed";

interface AgentLog {
  id: string;
  agent: string;
  kind: AgentKind;
  action: string;
  excerpt: string;
  time: string;
  status: LogStatus;
}

const KIND_LABEL: Record<AgentKind, string> = {
  conversation: "Conversation AI",
  voice: "Voice AI",
};

const STATUS_LABEL: Record<LogStatus, string> = {
  suggested: "Suggested",
  sent: "Sent",
  dismissed: "Dismissed",
};

function seedLogs(recordId: string): AgentLog[] {
  const p = recordId.toLowerCase();
  return [
    {
      id: `${p}-log-1`,
      agent: "Front desk assistant",
      kind: "conversation",
      action: "Suggested reply",
      excerpt:
        "Thanks for reaching out! We have openings Thursday at 10:00 AM and 2:30 PM. Which works best for you?",
      time: "1:12 PM",
      status: "suggested",
    },
    {
      id: `${p}-log-2`,
      agent: "Front desk assistant",
      kind: "conversation",
      action: "Suggested reply",
      excerpt:
        "Your technician is on the way and should arrive in about 20 minutes.",
      time: "11:48 AM",
      status: "sent",
    },
    {
      id: `${p}-log-3`,
      agent: "After-hours line",
      kind: "voice",
      action: "Call summary",
      excerpt:
        "Caller asked about the annual service plan and requested a quote for 2 units.",
      time: "9:05 AM",
      status: "sent",
    },
    {
      id: `${p}-log-4`,
      agent: "Front desk assistant",
      kind: "conversation",
      action: "Suggested reply",
      excerpt: "I can help with that. Could you share your address so I can check coverage?",
      time: "Yesterday",
      status: "dismissed",
    },
  ];
}

function LogStatusPill({ status }: { status: LogStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-[21px] w-fit shrink-0 items-center rounded-full px-[9px] text-[11.5px] leading-[normal] font-medium whitespace-nowrap",
        status === "sent" &&
          "text-[var(--pg-status-paid-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-paid-border)]",
        status === "suggested" &&
          "text-[var(--pg-status-sent-fg)] shadow-[inset_0_0_0_1px_var(--pg-status-sent-border)]",
        status === "dismissed" &&
          "text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/* ─── Filter menu ───────────────────────────────────────────────────────── */

type AgentFilter = "all" | AgentKind;
type StatusFilter = "all" | LogStatus;

function MenuHeading({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-[9px] pt-[8px] pb-[4px] text-[12px] leading-[16px] font-semibold tracking-[0.04em] text-pg-muted uppercase">
      {children}
    </span>
  );
}

function MenuOption({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={selected}
      onClick={onSelect}
      className="flex h-[36px] w-full items-center gap-[8px] rounded-[6px] px-[9px] text-left text-[14px] leading-[20px] text-pg-text motion-tap hover:bg-pg"
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected ? <Check size={15} aria-hidden="true" className="shrink-0 text-brand" /> : null}
    </button>
  );
}

/* ─── Body ──────────────────────────────────────────────────────────────── */

export function AgentLogsBody({ recordId }: { recordId: string }) {
  const [on, setOn] = React.useState(false);
  /** Seeded the first time the agent is turned on; kept as history after. */
  const [logs, setLogs] = React.useState<AgentLog[]>([]);
  const [query, setQuery] = React.useState("");
  const [agent, setAgent] = React.useState<AgentFilter>("all");
  const [status, setStatus] = React.useState<StatusFilter>("all");
  const [anchor, setAnchor] = React.useState<HTMLButtonElement | null>(null);
  const [spinning, setSpinning] = React.useState(false);
  const spinTimer = React.useRef<number | undefined>(undefined);
  const closeMenu = React.useCallback(() => setAnchor(null), []);

  React.useEffect(() => () => window.clearTimeout(spinTimer.current), []);

  const turnOn = () => {
    setOn(true);
    setLogs((prev) => (prev.length ? prev : seedLogs(recordId)));
    showToast("AI agent turned on");
  };
  const turnOff = () => {
    setOn(false);
    showToast("AI agent turned off");
  };
  const refresh = () => {
    setSpinning(true);
    window.clearTimeout(spinTimer.current);
    spinTimer.current = window.setTimeout(() => setSpinning(false), 700);
  };
  const setLogStatus = (id: string, next: LogStatus) => {
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, status: next } : l)));
    showToast(next === "sent" ? "Reply sent" : "Suggestion dismissed");
  };

  const q = query.trim().toLowerCase();
  const visible = logs.filter(
    (l) =>
      (agent === "all" || l.kind === agent) &&
      (status === "all" || l.status === status) &&
      (!q ||
        l.agent.toLowerCase().includes(q) ||
        KIND_LABEL[l.kind].toLowerCase().includes(q) ||
        l.excerpt.toLowerCase().includes(q)),
  );
  const filtered = agent !== "all" || status !== "all";

  return (
    <div className="flex flex-col py-[12px]">
      {/* The switch */}
      <div className="flex gap-[10px] rounded-[12px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[7px] bg-brand-soft text-brand">
          <Sparkles size={15} aria-hidden="true" />
        </span>
        {on ? (
          <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
            <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-semibold text-pg-heading">
              <span
                aria-hidden="true"
                className="size-[7px] shrink-0 rounded-full bg-[var(--pg-status-subscribed-dot)]"
              />
              AI agent is on
              <span className="font-normal text-pg-muted">· Suggestive mode</span>
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Suggestions appear in the conversation for you to review.{" "}
              <button
                type="button"
                onClick={turnOff}
                className="font-medium text-brand motion-tap hover:brightness-110"
              >
                Turn off
              </button>
            </span>
          </div>
        ) : (
          <div className="flex min-w-0 flex-col gap-[8px]">
            <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
              Let AI draft your replies
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Get AI reply suggestions for every inbound message. You approve
              before anything is sent.{" "}
              <button
                type="button"
                onClick={() => showToast("Opens the AI agent guide")}
                className="font-medium text-brand motion-tap hover:brightness-110"
              >
                Learn more
              </button>
            </span>
            <PrimaryButton onClick={turnOn} className="h-[36px] self-start px-[14px]">
              <Sparkles size={14} aria-hidden="true" />
              Turn on AI agent
            </PrimaryButton>
          </div>
        )}
      </div>

      {/* Count + refresh */}
      <div className="flex items-center justify-between py-[12px]">
        <span className="text-[13px] leading-[18px] text-pg-muted">
          {visible.length.toLocaleString("en-US")} {visible.length === 1 ? "item" : "items"}
        </span>
        <button
          type="button"
          onClick={refresh}
          className="flex items-center gap-[5px] text-[13px] leading-[18px] font-medium text-pg-text-strong motion-tap hover:text-brand"
        >
          <RotateCcw
            size={13}
            aria-hidden="true"
            className={cn(spinning && "animate-[spin_700ms_linear_reverse]")}
          />
          Refresh
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-[8px]">
        <div className="flex h-[36px] min-w-0 flex-1 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            aria-label="Search messages or agent"
            placeholder="Search messages or agent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="flex size-[20px] shrink-0 items-center justify-center rounded-[4px] text-pg-faint motion-tap hover:text-pg-text"
            >
              <X size={13} aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <OutlineButton
          aria-label="Filter logs"
          title="Filter"
          aria-haspopup="menu"
          aria-expanded={anchor !== null}
          onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}
          className={cn(
            "relative h-[36px] w-[36px] justify-center px-0",
            filtered && "text-brand shadow-[inset_0_0_0_1px_var(--brand)]",
          )}
        >
          <Funnel size={15} aria-hidden="true" />
          {filtered ? (
            <span
              aria-hidden="true"
              className="absolute top-[6px] right-[6px] size-[6px] rounded-full bg-brand"
            />
          ) : null}
        </OutlineButton>
        <PanelMenu anchor={anchor} onClose={closeMenu} label="Filter logs" width={220}>
          <MenuHeading>Agent</MenuHeading>
          <MenuOption label="All" selected={agent === "all"} onSelect={() => setAgent("all")} />
          <MenuOption
            label="Conversation AI"
            selected={agent === "conversation"}
            onSelect={() => setAgent("conversation")}
          />
          <MenuOption label="Voice AI" selected={agent === "voice"} onSelect={() => setAgent("voice")} />
          <span aria-hidden="true" className="mx-[4px] my-[4px] h-px bg-pg-row-border" />
          <MenuHeading>Status</MenuHeading>
          <MenuOption label="All" selected={status === "all"} onSelect={() => setStatus("all")} />
          <MenuOption
            label="Suggested"
            selected={status === "suggested"}
            onSelect={() => setStatus("suggested")}
          />
          <MenuOption label="Sent" selected={status === "sent"} onSelect={() => setStatus("sent")} />
          <MenuOption
            label="Dismissed"
            selected={status === "dismissed"}
            onSelect={() => setStatus("dismissed")}
          />
          {filtered ? (
            <>
              <span aria-hidden="true" className="mx-[4px] my-[4px] h-px bg-pg-row-border" />
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setAgent("all");
                  setStatus("all");
                  closeMenu();
                }}
                className="flex h-[36px] w-full items-center rounded-[6px] px-[9px] text-left text-[14px] leading-[20px] font-medium text-brand motion-tap hover:bg-pg"
              >
                Clear filters
              </button>
            </>
          ) : null}
        </PanelMenu>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-[7px] px-[20px] py-[40px] text-center">
          <Workflow size={22} aria-hidden="true" className="text-pg-disabled" />
          <span className="text-[13px] leading-[18px] font-medium text-pg-text-strong">
            No agent logs found
          </span>
          {logs.length > 0 ? (
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Try a different search or filter.
            </span>
          ) : null}
        </div>
      ) : (
        <ul className={cn("flex flex-col gap-[8px] pt-[12px]", spinning && "opacity-60 transition-opacity")}>
          {visible.map((l) => {
            const KindIcon = l.kind === "voice" ? Phone : Sparkles;
            return (
              <li
                key={l.id}
                className="flex flex-col gap-[8px] rounded-[12px] bg-pg-surface p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
              >
                <div className="flex items-center gap-[8px]">
                  <span className="flex size-[24px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <KindIcon size={13} aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[14px] leading-[20px] font-medium text-pg-text-strong">
                      {l.agent}
                    </span>
                    <span className="truncate text-[13px] leading-[18px] text-pg-muted">
                      {KIND_LABEL[l.kind]} · {l.action}
                    </span>
                  </div>
                  <span className="shrink-0 self-start text-[13px] leading-[18px] text-pg-faint">
                    {l.time}
                  </span>
                </div>
                <p className="line-clamp-3 rounded-[8px] bg-pg px-[10px] py-[8px] text-[14px] leading-[20px] text-pg-text">
                  {l.excerpt}
                </p>
                <div className="flex items-center gap-[12px]">
                  <LogStatusPill status={l.status} />
                  <span className="flex-1" />
                  {l.status === "suggested" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setLogStatus(l.id, "dismissed")}
                        className="text-[13px] leading-[18px] font-medium text-pg-muted motion-tap hover:text-pg-text"
                      >
                        Dismiss
                      </button>
                      <button
                        type="button"
                        onClick={() => setLogStatus(l.id, "sent")}
                        className="text-[13px] leading-[18px] font-medium text-brand motion-tap hover:brightness-110"
                      >
                        Send reply
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
