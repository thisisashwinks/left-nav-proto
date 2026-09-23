"use client";

import * as React from "react";
import {
  ArrowUpDown,
  CircleHelp,
  Plus,
  Search,
  Trash2,
  Pencil,
  Sparkles,
} from "lucide-react";
import {
  OutlineButton,
  PageHeader,
  usePageChrome,
} from "@/components/page/page-header";
import { useListShape } from "@/components/page/list-shape";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { KnowledgeBaseDetail } from "./knowledge-base-detail";
import {
  KNOWLEDGE_QUOTA,
  knowledgeBases,
  type KnowledgeBaseRow,
} from "./knowledge-base-data";

const COLS = "2.6fr 0.7fr 1.2fr 1.2fr 76px";

type Sort = "updated" | "created" | "name" | "gaps";

const SORTS: { id: Sort; label: string }[] = [
  { id: "updated", label: "Last updated" },
  { id: "created", label: "Created at" },
  { id: "name", label: "Name" },
  { id: "gaps", label: "Most gaps" },
];

/**
 * AI ▸ Knowledge Base — the list of bases, and one base opened.
 *
 * Two states in one component, the way funnels-page holds its list and its
 * detail: opening a base is not a PLACE the nav knows about. You are still in
 * Knowledge Base, the sidebar selection does not move, and the trail grows a
 * record crumb from inside the detail view.
 *
 * Reached from product-page's REAL_PAGES on the proposed tree's
 * `ia-ai-knowledge`. The shipped catalogue's `ai-knowledge` is deliberately not
 * routed here: it is an L2 of the AI Agents product, and claiming that id would
 * take the product's own landing stage with it — the same trap voice-ai-page
 * documented when it claimed every id in its chain.
 */
export function KnowledgeBasePage() {
  const { effective } = useTheme();
  const chrome = usePageChrome();
  const { showFilters } = useListShape();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<Sort>("updated");

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const hits = q
      ? knowledgeBases.filter((b) => b.name.toLowerCase().includes(q))
      : knowledgeBases;
    if (sort === "updated") return hits;
    const sorted = [...hits];
    if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "gaps") sorted.sort((a, b) => b.gaps - a.gaps);
    if (sort === "created") sorted.reverse();
    return sorted;
  }, [query, sort]);

  const open = knowledgeBases.find((b) => b.id === openId) ?? null;

  if (open) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <KnowledgeBaseDetail base={open} onBack={() => setOpenId(null)} />
      </div>
    );
  }

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Knowledge base"
        count={`${knowledgeBases.length}`}
        description="Create and manage multiple knowledge bases for your business"
        /*
         * The quota rides in `aside` — left of the buttons, on the commitment
         * side of the row — because it is the thing that decides whether the
         * button beside it can be pressed. Under the header's own count, which
         * says how many there are; this says how many there may be.
         */
        aside={<QuotaMeter used={knowledgeBases.length} />}
        secondary={[{ label: "Create with AI", icon: Sparkles }]}
        primary={{ label: "Create knowledge base", icon: Plus }}
      />

      {/*
        The announcement strip, which is the one piece of this screen that is
        not about the collection under it.

        Kept as a dismissible band rather than a card in the table's own
        surface: it advertises a capability, and a notice filed inside the list
        would be a row that is not a knowledge base. Dots rather than a
        carousel that moves on its own — a strip that animates while someone is
        reading the table below is chrome competing with content.
      */}
      <AnnouncementStrip />

      <div className="flex shrink-0 items-center gap-[10px]">
        <SortMenu value={sort} onChange={setSort} />

        {/*
          Create with AI keeps a home when slot 05 is off, for the reason
          funnels-page gives its own AI button one: every other action in the
          header has a second route, and the newest path in the product should
          not be the one that disappears when a reviewer switches the title off.
        */}
        {chrome.header ? null : (
          <OutlineButton onClick={() => undefined}>
            <Sparkles size={15} aria-hidden="true" className="text-brand" />
            Create with AI
          </OutlineButton>
        )}

        <span aria-hidden="true" className="min-w-[16px] flex-1" />

        {showFilters ? (
          <div className="flex h-[34px] w-[320px] shrink-0 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search knowledge base"
              aria-label="Search knowledge base"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div
          style={{ gridTemplateColumns: COLS }}
          className="sticky top-0 z-10 grid h-[38px] items-center gap-[16px] border-b border-pg-head-border bg-pg-surface px-[16px]"
        >
          {["Name", "KB gaps", "Last updated", "Created at", "Actions"].map(
            (h) => (
              <span
                key={h}
                className={cn(
                  "text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted",
                  h === "Actions" && "text-right",
                )}
              >
                {h}
              </span>
            ),
          )}
        </div>

        {rows.map((row) => (
          <BaseRow key={row.id} row={row} onOpen={() => setOpenId(row.id)} />
        ))}

        {rows.length === 0 ? (
          <p className="px-[16px] py-[28px] text-center text-[13px] leading-[18px] text-pg-muted">
            No knowledge base matches “{query}”.
          </p>
        ) : null}
      </div>

      <div className="flex h-[30px] shrink-0 items-center">
        <span className="text-[13px] leading-[normal] text-pg-muted">
          Showing {rows.length} of {knowledgeBases.length} knowledge bases
        </span>
      </div>
    </div>
  );
}

/* ─── The quota ─────────────────────────────────────────────────────────── */

/**
 * How many of the account's bases are spent.
 *
 * The rule under the numbers is the whole control: "15 / 15" as text is
 * something you read, and a bar you have watched fill is something you have
 * already noticed. It turns danger-red only at the limit, because an amber
 * warning at 12 of 15 is a page crying wolf about a number nobody was near.
 */
function QuotaMeter({ used }: { used: number }) {
  const full = used >= KNOWLEDGE_QUOTA;
  return (
    <span className="flex shrink-0 flex-col gap-[5px]">
      <span className="flex items-baseline gap-[6px] text-[13px] leading-[18px] whitespace-nowrap text-pg-muted">
        Knowledge base quota
        <span
          className={cn(
            "font-semibold tabular-nums",
            full ? "text-pg-danger" : "text-pg-heading",
          )}
        >
          {used}
        </span>
        <span className="tabular-nums">/ {KNOWLEDGE_QUOTA}</span>
      </span>
      <span className="h-[3px] w-full overflow-hidden rounded-full bg-pg-row-border">
        <span
          className={cn(
            "block h-full rounded-full motion-move",
            full ? "bg-pg-danger" : "bg-brand",
          )}
          style={{ width: `${Math.min(100, (used / KNOWLEDGE_QUOTA) * 100)}%` }}
        />
      </span>
    </span>
  );
}

/* ─── The strip ─────────────────────────────────────────────────────────── */

const NOTICES = [
  {
    id: "search",
    title: "AI search across your knowledge base",
    body: "Ask a question and get the answer pulled from every article — no folder hunting.",
  },
  {
    id: "gaps",
    title: "Gaps are found for you",
    body: "Every question an agent could not answer is collected here, sorted by how often it is asked.",
  },
  {
    id: "crawler",
    title: "Recrawl on a schedule",
    body: "Point the crawler at a site once and let it pick up the pages you publish afterwards.",
  },
];

function AnnouncementStrip() {
  const [i, setI] = React.useState(0);
  const notice = NOTICES[i]!;
  return (
    <div className="relative flex shrink-0 items-center gap-[14px] overflow-hidden rounded-[12px] bg-[linear-gradient(90deg,var(--brand-soft)_0%,transparent_60%)] px-[16px] py-[14px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <span className="flex size-[40px] shrink-0 items-center justify-center rounded-[10px] bg-[linear-gradient(135deg,var(--ai-from),var(--ai-to))] text-white">
        <Search size={19} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <span className="truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
          {notice.title}
        </span>
        <span className="truncate text-[13px] leading-[18px] text-pg-muted">
          {notice.body}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-[5px]">
        {NOTICES.map((n, index) => (
          <button
            key={n.id}
            type="button"
            aria-label={`Show: ${n.title}`}
            aria-current={index === i}
            onClick={() => setI(index)}
            className={cn(
              "motion-move h-[5px] rounded-full",
              index === i ? "w-[18px] bg-brand" : "w-[5px] bg-pg-border-strong",
            )}
          />
        ))}
      </span>
    </div>
  );
}

/* ─── The rows ──────────────────────────────────────────────────────────── */

function SortMenu({
  value,
  onChange,
}: {
  value: Sort;
  onChange: (v: Sort) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const active = SORTS.find((s) => s.id === value)!;
  return (
    <div className="relative shrink-0">
      <OutlineButton aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <ArrowUpDown size={15} aria-hidden="true" className="text-pg-muted" />
        Sort by: {active.label}
      </OutlineButton>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute top-[38px] left-0 z-50 w-[180px] overflow-hidden rounded-[10px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]">
            {SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onChange(s.id);
                  setOpen(false);
                }}
                className={cn(
                  "motion-tap flex w-full items-center rounded-[7px] px-[9px] py-[7px] text-left text-[13px] leading-[normal] hover:bg-pg-row-border",
                  s.id === value
                    ? "font-semibold text-pg-heading"
                    : "text-pg-text",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

function BaseRow({
  row,
  onOpen,
}: {
  row: KnowledgeBaseRow;
  onOpen: () => void;
}) {
  return (
    <div
      style={{ gridTemplateColumns: COLS }}
      className="group grid min-h-[44px] items-center gap-[16px] border-b border-pg-row-border px-[16px] last:border-b-0 hover:bg-pg-row-border/60"
    >
      {/*
        The name is the only thing that opens the base.

        Not the whole row: the row ends in two icon buttons, and a row that
        navigates on click makes every miss of the pencil a navigation you did
        not ask for. A link-shaped target, because that is what it does.
      */}
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 items-center gap-[6px] py-[10px] text-left"
      >
        <span className="truncate text-[13.5px] leading-[18px] font-medium text-pg-text-strong group-hover:text-brand">
          {row.name}
        </span>
        {row.seeded ? (
          <CircleHelp
            size={13}
            aria-label="Created with your account"
            className="shrink-0 text-pg-faint"
          />
        ) : null}
      </button>

      {/*
        A gap count of zero is not a warning, so it is not painted like one.
        Only a base that is losing questions gets the amber.
      */}
      <span
        className={cn(
          "text-[13px] leading-[18px] tabular-nums",
          row.gaps > 0
            ? "font-semibold text-[var(--hr-warning-600)]"
            : "text-pg-muted",
        )}
      >
        {row.gaps}
      </span>

      <span className="truncate text-[13px] leading-[18px] text-pg-muted">
        {row.updated}
      </span>
      <span className="truncate text-[13px] leading-[18px] text-pg-muted">
        {row.created}
      </span>

      <span className="flex items-center justify-end gap-[2px]">
        <RowAction label={`Rename ${row.name}`} icon={Pencil} onClick={onOpen} />
        <RowAction label={`Delete ${row.name}`} icon={Trash2} danger />
      </span>
    </div>
  );
}

function RowAction({
  label,
  icon: Icon,
  danger = false,
  onClick,
}: {
  label: string;
  icon: typeof Pencil;
  danger?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "motion-tap flex size-[28px] items-center justify-center rounded-[7px] text-pg-faint hover:bg-pg-bg",
        danger ? "hover:text-pg-danger" : "hover:text-pg-text-strong",
      )}
    >
      <Icon size={15} aria-hidden="true" />
    </button>
  );
}
