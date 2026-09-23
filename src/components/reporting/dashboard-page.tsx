"use client";

import * as React from "react";
import {
  CalendarDays,
  ChevronDown,
  Copy,
  Download,
  EllipsisVertical,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  BarChart,
  Donut,
  Legend,
  LineChart,
  RankBars,
  SERIES,
  Sparkline,
} from "./chart-kit";
import {
  channelVolume,
  conversationVolume,
  DAYS,
  dashboards,
  recentThreads,
  responseMinutes,
  statusSplit,
  tiles,
  topAgents,
} from "./dashboard-data";

/* ─── Furniture ─────────────────────────────────────────────────────────── */

function Widget({
  title,
  hint,
  span = 6,
  children,
  aside,
}: {
  title: string;
  hint?: string;
  /** Columns out of 12. */
  span?: number;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section
      style={{ gridColumn: `span ${span} / span ${span}` }}
      className="flex min-w-0 flex-col gap-[12px] rounded-[12px] bg-pg-surface p-[14px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
    >
      <header className="flex min-w-0 items-start gap-[10px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <h3 className="truncate text-[13.5px] leading-[18px] font-semibold text-pg-heading">
            {title}
          </h3>
          {hint ? (
            <p className="truncate text-[12px] leading-[16px] text-pg-muted">
              {hint}
            </p>
          ) : null}
        </div>
        {aside}
        <button
          type="button"
          aria-label={`${title} options`}
          className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-pg-faint motion-tap hover:bg-pg-bg hover:text-pg-text"
        >
          <EllipsisVertical size={15} aria-hidden="true" />
        </button>
      </header>
      {children}
    </section>
  );
}

function FilterChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex h-[30px] max-w-[170px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[10px] text-[12.5px] leading-none text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
    >
      <span className="truncate">{label}</span>
      <ChevronDown size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
    </button>
  );
}

/** The dashboard switcher — a menu, because the list grows without limit. */
function DashboardMenu({
  activeId,
  onSelect,
}: {
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const active = dashboards.find((d) => d.id === activeId) ?? dashboards[0]!;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[32px] max-w-[280px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
      >
        <span className="truncate text-[13px] leading-none font-medium text-pg-text">
          {active.label}
        </span>
        <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close dashboard list"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[60] cursor-default"
          />
          <div
            role="menu"
            className="motion-slot-in absolute top-[36px] left-0 z-[61] flex w-[300px] flex-col rounded-[10px] bg-pg-surface p-[5px] shadow-[0_12px_32px_-8px_rgba(15,23,42,0.28),0_0_0_1px_var(--pg-card-border)]"
          >
            {dashboards.map((d) => (
              <button
                key={d.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  onSelect(d.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex flex-col gap-[2px] rounded-[7px] px-[9px] py-[7px] text-left motion-tap",
                  d.id === activeId ? "bg-brand-soft" : "hover:bg-pg-bg",
                )}
              >
                <span
                  className={cn(
                    "truncate text-[13px] leading-[17px]",
                    d.id === activeId
                      ? "font-semibold text-brand"
                      : "font-medium text-pg-text",
                  )}
                >
                  {d.label}
                </span>
                <span className="truncate text-[11.5px] leading-[15px] text-pg-muted">
                  {d.meta}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

/* ─── The page ──────────────────────────────────────────────────────────── */

/**
 * Reporting ▸ Dashboards.
 *
 * The one page in the prototype that is taller than the window, which is the
 * whole reason it exists: it is where the sticky question gets answered. The
 * page header, the dashboard bar and the quick filters stay put while the
 * widgets run under them, so at any scroll depth you can still see WHICH
 * dashboard you are reading and over WHAT range — the two facts that make
 * every number below them mean something.
 *
 * The alternative, letting the whole thing scroll away, is what the app does
 * today: three screens down, a number with no date range attached to it.
 */
export function ReportingDashboardPage() {
  const [dashboardId, setDashboardId] = React.useState(dashboards[0]!.id);
  // Whether this page's own bar holds its place, or only the app bar does.
  const sticky = useTheme().effective.stickyDashboardBar;
  const active = dashboards.find((d) => d.id === dashboardId) ?? dashboards[0]!;

  return (
    // The page itself scrolls, rather than a pane inside it — that is what
    // makes the sticky chrome above worth testing.
    <div className="flex h-full min-h-0 flex-col overflow-y-auto px-[var(--page-inset)]">
      <div
        className={cn(
          "flex shrink-0 flex-col gap-[10px] pb-[10px]",
          // The backdrop only exists to stop widgets showing through a
          // pinned bar, so it goes when the bar stops being pinned.
          sticky && "sticky top-0 z-30 bg-pg",
        )}
      >
        <PageHeader
          title="Dashboards"
          description={active.meta}
          secondary={[{ label: "Share", icon: Share2 }]}
          primary={{ label: "Edit dashboard", icon: Pencil }}
          overflow={[
            { label: "Duplicate dashboard", icon: Copy },
            { label: "Export as PDF", icon: Download },
            { label: "Delete dashboard", icon: Trash2, danger: true },
          ]}
        />

        {/*
          The dashboard bar: which dashboard, over what range.
          It is a control bar rather than a view bar — the dashboards are not
          cuts of one collection, they are different sets of widgets, and a
          list that grows without limit cannot be a row of tabs.
        */}
        <div className="flex h-[40px] shrink-0 items-center gap-[10px] border-b border-pg-head-border pb-[8px]">
          <DashboardMenu activeId={dashboardId} onSelect={setDashboardId} />
          <button
            type="button"
            className="flex h-[32px] shrink-0 items-center gap-[5px] rounded-[8px] px-[9px] text-[12.5px] leading-none font-medium text-brand motion-tap hover:bg-brand-soft"
          >
            <Plus size={14} aria-hidden="true" />
            New
          </button>

          <span className="flex-1" />

          <OutlineButton className="h-[32px] px-[10px] text-[12.5px]">
            <CalendarDays size={14} aria-hidden="true" className="text-pg-muted" />
            Last 30 days
            <ChevronDown size={13} aria-hidden="true" className="text-pg-faint" />
          </OutlineButton>
          <OutlineButton
            aria-label="Summarise this dashboard with AI"
            className="h-[32px] w-[32px] justify-center px-0"
          >
            <Sparkles size={15} aria-hidden="true" className="text-brand" />
          </OutlineButton>
          <PrimaryButton className="h-[32px] px-[12px] text-[12.5px]">
            <Pencil size={14} aria-hidden="true" />
            Edit dashboard
          </PrimaryButton>
        </div>
      </div>

      <div className="flex flex-col gap-[10px] pt-[10px] pb-[16px]">
        {/* Quick filters: they act on every widget below, so they sit above
            all of them and nowhere else. */}
        <div className="flex flex-wrap items-center gap-[8px] rounded-[12px] bg-pg-surface p-[10px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <button
            type="button"
            className="flex h-[30px] shrink-0 items-center gap-[6px] rounded-[8px] px-[8px] text-[12.5px] leading-none font-medium text-brand motion-tap hover:bg-brand-soft"
          >
            <SlidersHorizontal size={14} aria-hidden="true" />
            Quick filters
          </button>
          <span aria-hidden="true" className="h-[18px] w-px shrink-0 bg-pg-border" />
          <FilterChip label="Conversation type" />
          <FilterChip label="Last message channel" />
          <FilterChip label="Last outbound owner" />
          <FilterChip label="Tag" />
        </div>

        <h2 className="pt-[4px] text-[14px] leading-[20px] font-semibold text-pg-heading">
          Unread conversations overview
        </h2>

        <div className="grid grid-cols-12 gap-[10px]">
          {tiles.map((t, i) => (
            <section
              key={t.label}
              className="col-span-3 flex min-w-0 flex-col gap-[6px] rounded-[12px] bg-pg-surface p-[14px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
            >
              <span className="truncate text-[12.5px] leading-[16px] text-pg-muted">
                {t.label}
              </span>
              <div className="flex items-end justify-between gap-[8px]">
                <span className="text-[24px] leading-[30px] font-semibold tracking-[-0.3px] text-pg-heading tabular-nums">
                  {t.value}
                </span>
                <Sparkline values={t.spark} colourIndex={i} />
              </div>
              <span
                className={cn(
                  "flex items-center gap-[4px] text-[12px] leading-none font-medium",
                  t.up ? "text-[var(--pg-status-subscribed-fg)]" : "text-brand",
                )}
              >
                {t.up ? (
                  <TrendingUp size={13} aria-hidden="true" />
                ) : (
                  <TrendingDown size={13} aria-hidden="true" />
                )}
                {t.delta}
                <span className="font-normal text-pg-faint">vs previous 30 days</span>
              </span>
            </section>
          ))}

          <Widget
            title="Conversation volume"
            hint="Inbound and outbound messages, by day"
            span={8}
            aside={
              <Legend
                items={[
                  { label: "Inbound", colour: SERIES[0] },
                  { label: "Outbound", colour: SERIES[1] },
                ]}
              />
            }
          >
            <LineChart
              series={conversationVolume}
              labels={DAYS}
              height={220}
              format={(v) => v.toLocaleString()}
            />
          </Widget>

          <Widget title="Status split" hint="Where the queue stands right now" span={4}>
            <Donut data={statusSplit} />
          </Widget>

          <Widget title="Messages by channel" hint="Last 30 days" span={5}>
            <BarChart
              data={channelVolume}
              colourIndex={0}
              format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v))}
            />
          </Widget>

          <Widget title="Resolved by owner" hint="Conversations closed, last 30 days" span={4}>
            <RankBars data={topAgents} />
          </Widget>

          <Widget title="SLA" hint="Against a 30-minute first-response target" span={3}>
            <div className="flex flex-col gap-[10px] pt-[2px]">
              <span className="text-[32px] leading-[36px] font-semibold tracking-[-0.5px] text-pg-heading tabular-nums">
                94.2%
              </span>
              <span className="text-[12.5px] leading-[17px] text-pg-muted">
                6,418 of 6,812 conversations answered inside the window.
              </span>
              <span className="h-[10px] overflow-hidden rounded-[5px] bg-pg-bg">
                <span
                  className="block h-full rounded-[5px]"
                  style={{ width: "94.2%", background: SERIES[1] }}
                />
              </span>
            </div>
          </Widget>

          <Widget
            title="Response and resolution time"
            hint="Median minutes, by day"
            span={8}
            aside={
              <Legend
                items={[
                  { label: "First response", colour: SERIES[0] },
                  { label: "Resolution", colour: SERIES[1] },
                ]}
              />
            }
          >
            <LineChart
              series={responseMinutes}
              labels={DAYS}
              height={200}
              format={(v) => `${v}m`}
            />
          </Widget>

          <Widget title="Oldest waiting" hint="Longest unanswered, right now" span={4}>
            <div className="flex flex-col">
              {recentThreads.slice(0, 5).map((t) => (
                <div
                  key={t.contact}
                  className="flex items-center gap-[8px] border-b border-pg-row-border py-[9px] last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate text-[12.5px] leading-[17px] text-pg-text">
                    {t.contact}
                  </span>
                  <span className="shrink-0 text-[11.5px] leading-none text-pg-faint">
                    {t.channel}
                  </span>
                  <span className="w-[54px] shrink-0 text-right text-[12px] leading-none font-semibold text-pg-text-strong tabular-nums">
                    {t.waiting}
                  </span>
                </div>
              ))}
            </div>
          </Widget>

          <Widget title="Conversations needing attention" span={12}>
            <div className="flex flex-col">
              <div className="flex h-[32px] items-center gap-[10px] border-b border-pg-head-border text-[11.5px] leading-none font-medium text-pg-muted">
                <span className="min-w-0 flex-1">Contact</span>
                <span className="w-[110px] shrink-0">Channel</span>
                <span className="w-[110px] shrink-0">Waiting</span>
                <span className="w-[160px] shrink-0">Owner</span>
                <span className="w-[130px] shrink-0">Status</span>
              </div>
              {recentThreads.map((t) => (
                <div
                  key={t.contact}
                  className="flex h-[40px] items-center gap-[10px] border-b border-pg-row-border text-[12.5px] leading-none text-pg-text last:border-b-0"
                >
                  <span className="min-w-0 flex-1 truncate font-medium text-pg-text-strong">
                    {t.contact}
                  </span>
                  <span className="w-[110px] shrink-0">{t.channel}</span>
                  <span className="w-[110px] shrink-0 tabular-nums">{t.waiting}</span>
                  <span className="w-[160px] shrink-0 truncate">{t.owner}</span>
                  <span className="w-[130px] shrink-0">
                    <span className="inline-flex h-[22px] items-center rounded-[6px] bg-pg-surface px-[8px] text-[11.5px] font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
                      {t.status}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </Widget>

          <Widget title="Volume by weekday" hint="Where the week lands" span={6}>
            <BarChart
              data={[
                { label: "Mon", value: 1840 },
                { label: "Tue", value: 2120 },
                { label: "Wed", value: 2380 },
                { label: "Thu", value: 2240 },
                { label: "Fri", value: 1960 },
                { label: "Sat", value: 910 },
                { label: "Sun", value: 640 },
              ]}
              colourIndex={3}
              format={(v) => `${(v / 1000).toFixed(1)}K`}
            />
          </Widget>

          <Widget title="Tags on unread" hint="Top five, last 30 days" span={6}>
            <RankBars
              data={[
                { label: "whatsapp_webhook", value: 612 },
                { label: "onboarding_fail", value: 448 },
                { label: "pricing_question", value: 331 },
                { label: "renewal", value: 208 },
                { label: "refund", value: 142 },
              ]}
            />
          </Widget>
        </div>
      </div>
    </div>
  );
}
