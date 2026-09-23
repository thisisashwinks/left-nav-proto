"use client";

import * as React from "react";
import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ListFilter,
  Paperclip,
  Plus,
  Rows3,
  Ruler,
  Search,
  Sparkles,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { PageHeader } from "@/components/page/page-header";
import { GlyphButton } from "@/components/calendars/calendar-chrome";
import { cn } from "@/lib/utils";
import { layoutPresets, invoiceLayouts, type InvoiceLayout } from "./invoices-data";

/** The prompt's cap, and the counter under the field reads against it. */
const PROMPT_MAX = 1000;

/**
 * Commerce ▸ Invoices & Estimates ▸ Layouts.
 *
 * The newest L3 in the product — it carries the `New` badge in both trees —
 * and the one screen in this study where the AI surface is the PAGE rather
 * than a panel bolted to one. That is what makes it worth building here: the
 * funnel AI builder puts a prompt inside a builder, Ask AI puts one in a
 * drawer, and this puts one at the top of a collection page, above the list
 * of things it makes. Three placements of the same idea, and only with all
 * three on screen can a review say which of them a person actually reaches
 * for.
 *
 * The hero collapses. Not as a nicety: someone who already has fifteen
 * layouts comes here to open one, and a 380px generator standing between
 * them and the grid every single visit is the cost of putting the AI first.
 * The chevron is the admission that the placement has a cost, and the
 * collapsed state is what the tenth visit should look like.
 */
export function InvoiceLayoutsPage() {
  const { effective } = useTheme();
  const [prompt, setPrompt] = React.useState("");
  const [heroOpen, setHeroOpen] = React.useState(true);
  const [dense, setDense] = React.useState(false);

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Invoice layouts"
        count={String(invoiceLayouts.length)}
        description="Create custom layouts that match your brand and control how every invoice you send looks."
        primary={{ label: "New layout", icon: Plus }}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-auto">
        <GeneratorHero
          prompt={prompt}
          onPrompt={setPrompt}
          open={heroOpen}
          onToggle={() => setHeroOpen((v) => !v)}
        />

        {/*
          The toolbar, and the one row on this page that is not the AI's.

          Filter and sort on the left, find and render-mode on the right —
          the split every collection in this prototype uses: what CUTS the
          set is on the leading edge, what LOOKS AT it is on the trailing one.
        */}
        <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
          <button
            type="button"
            className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg active:scale-[0.98]"
          >
            <Plus size={15} aria-hidden="true" />
            Add filter
          </button>
          <button
            type="button"
            className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg active:scale-[0.98]"
          >
            <ListFilter size={15} aria-hidden="true" />
            Sort by
          </button>

          <span aria-hidden="true" className="min-w-[16px] flex-1" />

          <div className="flex h-[34px] w-[260px] min-w-0 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="search"
              placeholder="Search by layout name"
              aria-label="Search by layout name"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>

          {/*
            Grid or rows. A segmented pair rather than one toggling glyph,
            because a single button that swaps its own icon never says which
            mode you are IN — it shows the mode you would get, and half the
            people read it the other way.
          */}
          <div className="flex h-[34px] shrink-0 items-center gap-[2px] rounded-[8px] bg-pg-surface p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            {[
              { id: false, icon: LayoutGrid, label: "Grid view" },
              { id: true, icon: Rows3, label: "List view" },
            ].map((m) => (
              <button
                key={m.label}
                type="button"
                aria-label={m.label}
                aria-pressed={dense === m.id}
                onClick={() => setDense(m.id)}
                className={cn(
                  "motion-tap flex size-[26px] items-center justify-center rounded-[6px] active:scale-95",
                  dense === m.id
                    ? "bg-brand-soft text-brand"
                    : "text-pg-faint hover:bg-pg-bg",
                )}
              >
                <m.icon size={15} aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>

        {dense ? (
          <div className="shrink-0 overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            {invoiceLayouts.map((l) => (
              <LayoutRow key={l.id} layout={l} />
            ))}
          </div>
        ) : (
          <div className="grid shrink-0 grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-[14px] pb-[14px]">
            {invoiceLayouts.map((l) => (
              <LayoutCard key={l.id} layout={l} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The generator, as the page's opening move.
 *
 * The gradient is the AI family's own — `--ai-btn-*`, the root-scoped pair
 * the funnel builder already uses — and NOT the brand accent. That is the
 * rule the tokens file states outright: every AI surface reads off
 * `--ai-base` so that recolouring the account does not recolour the AI, and
 * an agency that picks a purple brand does not end up with a page where the
 * generator and the primary button are indistinguishable.
 */
function GeneratorHero({
  prompt,
  onPrompt,
  open,
  onToggle,
}: {
  prompt: string;
  onPrompt: (v: string) => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <section
      className={cn(
        "relative shrink-0 overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]",
        // The wash is painted on the card, fading DOWN into the surface, so
        // the prompt sits in colour and the chips below it sit on paper. A
        // flat tint across the whole card would have made the chips look like
        // part of the generated result rather than inputs to it.
        open &&
          "bg-[linear-gradient(180deg,var(--ai-btn-from)_0%,var(--ai-btn-to)_38%,var(--pg-surface)_92%)]",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Collapse the layout generator" : "Expand the layout generator"}
        onClick={onToggle}
        className="motion-tap absolute top-[12px] right-[12px] z-10 flex size-[28px] items-center justify-center rounded-full bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading active:scale-95"
      >
        {open ? (
          <ChevronUp size={16} aria-hidden="true" />
        ) : (
          <ChevronDown size={16} aria-hidden="true" />
        )}
      </button>

      {open ? (
        <div className="flex flex-col items-center gap-[18px] px-[24px] pt-[26px] pb-[22px]">
          <span className="flex h-[30px] items-center gap-[7px] rounded-full bg-pg-surface px-[13px] text-[13px] leading-[normal] font-semibold text-[var(--ai-btn-fg)] shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
            <Sparkles size={15} aria-hidden="true" />
            Layout AI
          </span>

          {/*
            One italic word, and it is the adjective.

            The sentence is a promise about the RESULT, and the only part of
            it that is a choice is "professional" — everything else is
            scaffolding. Italicising the choosable word is what makes the
            headline read as a setting you could change rather than as
            marketing copy, which is the difference between a hero people use
            and a hero people scroll past.
          */}
          <h2 className="text-center text-[26px] leading-[34px] font-semibold tracking-[-0.4px] text-pg-heading">
            Let&rsquo;s create a layout that feels{" "}
            <em className="font-serif text-[var(--ai-btn-fg)] italic">professional</em>
          </h2>

          <div className="flex w-full max-w-[760px] flex-col gap-[10px] rounded-[12px] bg-pg-surface p-[14px] shadow-[0_2px_8px_rgba(16,24,40,0.06),inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[0_2px_8px_rgba(16,24,40,0.06),inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <textarea
              rows={2}
              value={prompt}
              maxLength={PROMPT_MAX}
              onChange={(e) => onPrompt(e.target.value)}
              aria-label="Describe the layout you want"
              placeholder="Create a clean invoice layout with my logo, itemized services, taxes, discounts, and payment terms"
              className="w-full resize-none bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
            <div className="flex items-center gap-[8px]">
              <GlyphButton icon={Paperclip} label="Attach a reference file" size={30} />
              {/*
                Page size belongs in the composer, not in a settings screen:
                A4 and Letter produce different documents, and choosing after
                the layout is generated means regenerating it.
              */}
              <button
                type="button"
                className="motion-tap flex h-[30px] items-center gap-[7px] rounded-[8px] bg-pg-surface px-[10px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg active:scale-[0.98]"
              >
                <Ruler size={15} aria-hidden="true" className="text-pg-muted" />
                A4
                <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
              </button>
              <span aria-hidden="true" className="min-w-[8px] flex-1" />
              <span className="shrink-0 text-[12px] leading-[normal] text-pg-faint tabular-nums">
                {prompt.length}/{PROMPT_MAX}
              </span>
              <button
                type="button"
                aria-label="Generate this layout"
                disabled={prompt.length === 0}
                className="motion-tap flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[var(--ai-base)] text-white active:scale-95 disabled:opacity-40"
              >
                <ArrowUp size={16} aria-hidden="true" />
              </button>
            </div>
          </div>

          {/*
            Starters, not examples. Each one fills the field rather than
            generating outright — a chip that skipped straight to a result
            would spend the account's credits on a mis-tap.
          */}
          <div className="flex flex-wrap items-center justify-center gap-[10px]">
            {layoutPresets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPrompt(p.prompt)}
                className="motion-tap flex h-[34px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[0_1px_2px_rgba(16,24,40,0.05),inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg active:scale-[0.98]"
              >
                <p.icon size={15} aria-hidden="true" className="text-[var(--ai-btn-fg)]" />
                {p.label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /*
          Collapsed: one row that still accepts a prompt.

          Not a bare "Generate with AI" button, which would make expanding the
          hero a step before typing. The point of collapsing is to get the
          grid above the fold, not to take the generator away.
        */
        <button
          type="button"
          onClick={onToggle}
          className="motion-tap flex h-[52px] w-full items-center gap-[10px] pr-[52px] pl-[16px] text-left"
        >
          <Sparkles size={16} aria-hidden="true" className="shrink-0 text-[var(--ai-btn-fg)]" />
          <span className="text-[13px] leading-[normal] font-semibold text-pg-heading">
            Layout AI
          </span>
          <span className="truncate text-[13px] leading-[normal] text-pg-muted">
            Describe a layout and it gets built for you.
          </span>
        </button>
      )}
    </section>
  );
}

/**
 * A layout as a card, and the thumbnail is a skeleton on purpose.
 *
 * A real rendered mini-invoice at 200px wide is unreadable — the type
 * bottoms out around 4px — so what a thumbnail can honestly convey is
 * STRUCTURE: where the logo block sits, how many columns the item table has,
 * whether there is a totals panel. Grey blocks say exactly that and nothing
 * they cannot back up, which is the same reason the production screen ships
 * them rather than tiny type.
 */
function LayoutCard({ layout }: { layout: InvoiceLayout }) {
  return (
    <button
      type="button"
      className="motion-tap group flex flex-col overflow-hidden rounded-[12px] bg-pg-surface text-left shadow-[inset_0_0_0_1px_var(--pg-card-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_4px_10px_-4px_rgba(16,24,40,0.12)] active:scale-[0.99]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-pg-bg p-[14px]">
        <SkeletonSheet />
        {/*
          The two chips sit ON the sheet rather than in the caption, because
          they describe the DOCUMENT — this layout is a draft, and it is for
          invoices rather than estimates. In the caption they would have read
          as metadata about the file.
        */}
        <span className="absolute top-[22px] right-[22px] flex items-center gap-[6px]">
          <Chip tone="muted">{layout.state}</Chip>
          <Chip tone="brand">{layout.kind}</Chip>
        </span>
      </div>
      <span className="flex items-center gap-[7px] px-[14px] py-[11px]">
        <span className="truncate text-[13.5px] leading-[normal] font-medium text-pg-text-strong">
          {layout.name}
        </span>
        <span aria-hidden="true" className="text-pg-faint">
          ·
        </span>
        <span className="shrink-0 text-[12.5px] leading-[normal] text-pg-muted">
          {layout.size}
        </span>
      </span>
    </button>
  );
}

function LayoutRow({ layout }: { layout: InvoiceLayout }) {
  return (
    <button
      type="button"
      className="motion-tap flex h-[52px] w-full items-center gap-[12px] border-b border-pg-row-border px-[14px] text-left last:border-b-0 hover:bg-pg-bg"
    >
      <span className="flex h-[34px] w-[26px] shrink-0 flex-col gap-[2px] overflow-hidden rounded-[4px] bg-pg-bg p-[3px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <span className="h-[4px] w-[60%] rounded-[1px] bg-pg-border-strong" />
        <span className="h-[3px] w-full rounded-[1px] bg-pg-border" />
        <span className="h-[3px] w-full rounded-[1px] bg-pg-border" />
        <span className="h-[3px] w-[70%] rounded-[1px] bg-pg-border" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] font-medium text-pg-text-strong">
        {layout.name}
      </span>
      <Chip tone="muted">{layout.state}</Chip>
      <Chip tone="brand">{layout.kind}</Chip>
      <span className="w-[54px] shrink-0 text-[12.5px] leading-[normal] text-pg-muted">
        {layout.size}
      </span>
      <span className="w-[100px] shrink-0 truncate text-[12.5px] leading-[normal] text-pg-muted">
        {layout.updated}
      </span>
    </button>
  );
}

/** The grey wireframe of an invoice: letterhead, two blocks, a table, totals. */
function SkeletonSheet() {
  return (
    <span
      aria-hidden="true"
      className="flex size-full flex-col gap-[8px] rounded-[4px] bg-pg-surface p-[10px] shadow-[0_1px_3px_rgba(16,24,40,0.08)]"
    >
      <span className="h-[26px] w-full rounded-[3px] bg-pg-row-border" />
      <span className="flex flex-1 gap-[8px]">
        <span className="flex w-[38%] flex-col gap-[6px]">
          <span className="h-[40%] w-full rounded-[3px] bg-pg-row-border" />
          <span className="h-[22%] w-full rounded-[3px] bg-pg-row-border" />
          <span className="h-[22%] w-full rounded-[3px] bg-pg-row-border" />
        </span>
        <span className="flex flex-1 flex-col gap-[5px]">
          <span className="h-[7px] w-full rounded-[2px] bg-pg-row-border" />
          <span className="h-[7px] w-[80%] rounded-[2px] bg-pg-row-border" />
          <span className="mt-[4px] h-[7px] w-full rounded-[2px] bg-pg-row-border" />
          <span className="h-[7px] w-full rounded-[2px] bg-pg-row-border" />
          <span className="h-[7px] w-[64%] rounded-[2px] bg-pg-row-border" />
          <span className="mt-auto h-[7px] w-[46%] self-end rounded-[2px] bg-pg-row-border" />
          <span className="h-[7px] w-[46%] self-end rounded-[2px] bg-pg-row-border" />
        </span>
      </span>
    </span>
  );
}

function Chip({
  tone,
  children,
}: {
  tone: "muted" | "brand";
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "flex h-[22px] shrink-0 items-center rounded-[6px] px-[8px] text-[11.5px] leading-[normal] font-medium whitespace-nowrap",
        tone === "brand"
          ? "bg-brand-soft text-brand"
          : "bg-pg-bg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      {children}
    </span>
  );
}
