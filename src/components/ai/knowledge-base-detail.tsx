"use client";

import * as React from "react";
import {
  FileUp,
  Globe,
  MessageCircleQuestion,
  Plus,
  Sparkles,
  Table2,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  knowledgeGaps,
  type KnowledgeBaseRow,
  type SourceKind,
} from "./knowledge-base-data";

/**
 * What a base can be made of, in the order the product lists it.
 *
 * One table rather than a switch in three places: the tab strip, the cards and
 * the empty state all need the same five names, glyphs and counts, and the
 * three drifting apart is how "Rich text" ends up called "Text" on one of them.
 */
const SOURCES: {
  kind: SourceKind;
  label: string;
  /** What the card counts, plural — "Links", not "Link". */
  unit: string;
  icon: LucideIcon;
  of: (base: KnowledgeBaseRow) => number;
}[] = [
  {
    kind: "crawler",
    label: "Web crawler",
    unit: "Links",
    icon: Globe,
    of: (b) => b.sources.links,
  },
  {
    kind: "faq",
    label: "FAQ",
    unit: "FAQs",
    icon: MessageCircleQuestion,
    of: (b) => b.sources.faqs,
  },
  {
    kind: "richText",
    label: "Rich text",
    unit: "Rich text",
    icon: Type,
    of: (b) => b.sources.richText,
  },
  {
    kind: "tables",
    label: "Tables",
    unit: "Tables",
    icon: Table2,
    of: (b) => b.sources.tables,
  },
  {
    kind: "files",
    label: "File upload",
    unit: "File uploads",
    icon: FileUp,
    of: (b) => b.sources.files,
  },
];

/**
 * One knowledge base, opened: what is in it, and what it could not answer.
 *
 * No title row, for the reason `funnel-detail.tsx` gives: the record crumb one
 * line above already says "Knowledge base ▸ WhatsApp" and carries the way out,
 * so a heading here would be the duplication the crumb was adopted to retire.
 * The strip below the trail carries what the trail cannot — how much is in the
 * base, and the switch between its two halves.
 *
 * Sources and gaps are two READINGS of one object rather than two places, which
 * is why they are a segmented control on this page and not tabs in the nav: a
 * gap is a question this base failed to answer, it exists only because the base
 * does, and it disappears the moment someone adds the source that answers it.
 */
export function KnowledgeBaseDetail({
  base,
  onBack,
}: {
  base: KnowledgeBaseRow;
  onBack: () => void;
}) {
  const { effective } = useTheme();
  const [half, setHalf] = React.useState<"sources" | "gaps">("sources");
  const [kind, setKind] = React.useState<SourceKind | "all">("all");

  useRecordCrumb({ name: base.name, kind: "Knowledge base" }, onBack);

  const total = SOURCES.reduce((n, s) => n + s.of(base), 0);
  const shown = SOURCES.filter((s) => kind === "all" || s.kind === kind);

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      {/* The meta strip: left is what this base IS, right is which half of it
          you are reading. The same split funnel-detail's row obeys. */}
      <div className="flex h-[38px] shrink-0 items-center justify-between gap-[16px]">
        <span className="truncate text-[13px] leading-[normal] text-pg-muted">
          {total} {total === 1 ? "source" : "sources"} · last updated{" "}
          {base.updated}
        </span>
        <div
          role="tablist"
          aria-label="Knowledge base views"
          className="flex shrink-0 items-center gap-[2px] rounded-[9px] bg-pg-surface p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
        >
          <HalfTab
            on={half === "sources"}
            onClick={() => setHalf("sources")}
            label="Knowledge sources"
          />
          <HalfTab
            on={half === "gaps"}
            onClick={() => setHalf("gaps")}
            label="Knowledge gaps"
            count={base.gaps}
          />
        </div>
      </div>

      {half === "sources" ? (
        <>
          {/*
            A filter over the cards below, not a set of places.

            Underline tabs rather than the pill group above, and that difference
            is doing work: the pill group switches what the page is ABOUT, this
            switches how much of one list you are looking at. Two identical
            controls stacked would read as one nav that had broken in half.
          */}
          <div
            role="tablist"
            aria-label="Source types"
            className="flex shrink-0 items-center gap-[2px] border-b border-pg-head-border"
          >
            <KindTab
              on={kind === "all"}
              onClick={() => setKind("all")}
              label="All"
            />
            {SOURCES.map((s) => (
              <KindTab
                key={s.kind}
                on={kind === s.kind}
                onClick={() => setKind(s.kind)}
                label={s.label}
              />
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-auto pb-[16px]">
            <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2 xl:grid-cols-3">
              {shown.map((s) => (
                <SourceCard key={s.kind} source={s} base={base} />
              ))}
            </div>
          </div>
        </>
      ) : (
        <GapsTable />
      )}

      <TestRetrievalPill />
    </div>
  );
}

/* ─── The two halves ────────────────────────────────────────────────────── */

function HalfTab({
  on,
  onClick,
  label,
  count,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={onClick}
      className={cn(
        "motion-tap flex h-[26px] items-center gap-[6px] rounded-[7px] px-[10px] text-[12.5px] leading-[normal] whitespace-nowrap",
        on
          ? "bg-pg-bg font-semibold text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]"
          : "font-medium text-pg-muted hover:text-pg-text",
      )}
    >
      {label}
      {count ? (
        <span className="rounded-[5px] bg-[color-mix(in_oklab,var(--hr-warning-600)_14%,transparent)] px-[5px] py-[1px] text-[11px] leading-[14px] font-semibold text-[var(--hr-warning-600)] tabular-nums">
          {count}
        </span>
      ) : null}
    </button>
  );
}

function KindTab({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={on}
      onClick={onClick}
      className={cn(
        "motion-tap -mb-px flex h-[32px] items-center border-b-2 px-[12px] text-[13px] leading-[normal] whitespace-nowrap",
        on
          ? "border-brand font-semibold text-brand"
          : "border-transparent font-medium text-pg-muted hover:text-pg-text",
      )}
    >
      {label}
    </button>
  );
}

/* ─── The sources ───────────────────────────────────────────────────────── */

function SourceCard({
  source,
  base,
}: {
  source: (typeof SOURCES)[number];
  base: KnowledgeBaseRow;
}) {
  const count = source.of(base);
  return (
    <section className="flex flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <header className="flex items-center gap-[10px] px-[16px] py-[14px]">
        <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] bg-brand-soft text-brand">
          <source.icon size={15} aria-hidden="true" />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
          {source.label}
        </h3>
        <button
          type="button"
          aria-label={`Add ${source.label.toLowerCase()}`}
          title={`Add ${source.label.toLowerCase()}`}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg-bg hover:text-pg-text-strong"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </header>
      {/*
        The count sits on the page grey rather than the card's white, so the
        card reads as a header over a figure — the shape the real screen uses,
        and the reason an empty source still looks like a place to put things
        instead of a card that failed to load.
      */}
      <div className="flex flex-col gap-[3px] border-t border-pg-row-border bg-pg px-[16px] py-[12px]">
        <span className="text-[13px] leading-[18px] text-pg-muted">
          {source.unit}
        </span>
        <span
          className={cn(
            "text-[15px] leading-[20px] font-semibold tabular-nums",
            count > 0 ? "text-pg-heading" : "text-pg-faint",
          )}
        >
          {count}
        </span>
      </div>
    </section>
  );
}

/* ─── The gaps ──────────────────────────────────────────────────────────── */

const GAP_COLS = "2.8fr 0.7fr 1fr 130px";

/**
 * The questions this base could not answer, most-asked first.
 *
 * Sorted by volume rather than by date, which is the one decision on this
 * screen: a gaps list in date order is a log, and a log of forty-four questions
 * is a thing nobody finishes reading. In volume order the top three rows are
 * the afternoon's work.
 */
function GapsTable() {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <div
        style={{ gridTemplateColumns: GAP_COLS }}
        className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
      >
        {["Question", "Asked", "Last asked", ""].map((h, i) => (
          <span
            key={h || `blank-${i}`}
            className="text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted"
          >
            {h}
          </span>
        ))}
      </div>

      {knowledgeGaps.map((gap) => (
        <div
          key={gap.id}
          style={{ gridTemplateColumns: GAP_COLS }}
          className="grid min-h-[46px] items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0 hover:bg-pg-row-border/60"
        >
          <span className="flex min-w-0 items-center gap-[8px]">
            <span className="truncate text-[13.5px] leading-[18px] text-pg-text-strong">
              {gap.question}
            </span>
            {gap.status === "drafted" ? (
              <span className="shrink-0 rounded-[5px] bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] px-[6px] py-[2px] text-[11px] leading-[14px] font-semibold text-[var(--pg-av-green-fg)]">
                Answer drafted
              </span>
            ) : null}
          </span>
          <span className="text-[13px] leading-[18px] text-pg-muted tabular-nums">
            {gap.asked}
          </span>
          <span className="truncate text-[13px] leading-[18px] text-pg-muted">
            {gap.lastAsked}
          </span>
          <span className="flex justify-end">
            <OutlineButton className="h-[28px] px-[10px] text-[12.5px]">
              <Sparkles size={13} aria-hidden="true" className="text-brand" />
              Answer it
            </OutlineButton>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── The tester ────────────────────────────────────────────────────────── */

/**
 * Ask the base something, from wherever you are on the page.
 *
 * A floating pill rather than a tab, because testing retrieval is what you do
 * WHILE editing sources — a tab would mean leaving the thing you just changed
 * to find out whether the change worked. Absolute to the page rather than
 * fixed to the window: the canvas is an inset card with its own rounded
 * corners, and a fixed pill would hang over the shell's plane outside it.
 */
function TestRetrievalPill() {
  return (
    <div className="pointer-events-none absolute right-[var(--page-inset)] bottom-[16px] flex justify-end">
      <div className="pointer-events-auto flex items-center gap-[12px] rounded-[12px] bg-pg-surface py-[8px] pr-[8px] pl-[12px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.12),0_4px_6px_-2px_rgba(16,24,40,0.04),inset_0_0_0_1px_var(--pg-card-border)]">
        <span className="flex size-[28px] shrink-0 items-center justify-center rounded-[8px] bg-brand-soft text-brand">
          <Sparkles size={15} aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-[13px] leading-[18px] font-semibold text-pg-heading">
            Test retrieval
          </span>
          <span className="text-[12px] leading-[16px] text-pg-muted">
            Ask anything your customers might ask
          </span>
        </span>
        <PrimaryButton className="h-[30px] px-[12px] text-[12.5px]">
          Open
          <kbd className="rounded-[4px] bg-white/20 px-[4px] py-[1px] text-[11px] leading-[14px] font-medium">
            ⌘K
          </kbd>
        </PrimaryButton>
      </div>
    </div>
  );
}
