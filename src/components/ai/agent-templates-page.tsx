"use client";

import * as React from "react";
import {
  Check,
  ChevronRight,
  Headphones,
  Play,
  Search,
  Star,
} from "lucide-react";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  agentTemplates,
  FACETS,
  type AgentChannel,
  type AgentTemplate,
} from "./agent-templates-data";

/**
 * AI ▸ Agent Templates — the marketplace, and one listing opened.
 *
 * A gallery rather than a table, and that is the one structural decision worth
 * writing down: every other collection in this prototype is a list of things
 * the account owns, where a row of facts is the right shape. These are things
 * the account might BUY, chosen on a persona, a maker's reputation and a rating
 * — none of which survive being put in a 13px cell. So: poster, name, maker,
 * one line, then the two numbers a buyer actually compares.
 *
 * No slot 05 title on the gallery half either. The trail says Agent Templates,
 * and the screen's own first row is the search field the marketplace is used
 * through — a heading above it would push the thing everyone came for below
 * the fold on a laptop. The header axis still governs it, via `usePageChrome`
 * inside PageHeader, so a reviewer switching titles off sees this page answer
 * like every other.
 */
export function AgentTemplatesPage() {
  const { effective } = useTheme();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [channel, setChannel] = React.useState<AgentChannel>("voice");
  const [query, setQuery] = React.useState("");
  /** Facet id → the options ticked under it. Empty means the facet is off. */
  const [picked, setPicked] = React.useState<Record<string, string[]>>({});

  const toggle = (facet: string, option: string) =>
    setPicked((current) => {
      const on = current[facet] ?? [];
      return {
        ...current,
        [facet]: on.includes(option)
          ? on.filter((o) => o !== option)
          : [...on, option],
      };
    });

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return agentTemplates.filter((t) => {
      if (t.channel !== channel) return false;
      if (
        q &&
        !`${t.title} ${t.persona} ${t.maker}`.toLowerCase().includes(q)
      ) {
        return false;
      }
      return FACETS.every((facet) => {
        const on = picked[facet.id] ?? [];
        if (on.length === 0) return true;
        if (facet.id === "pricing") {
          return on.includes(t.paid ? "Paid" : "Free");
        }
        return on.includes(t[facet.id]);
      });
    });
  }, [channel, query, picked]);

  const open = agentTemplates.find((t) => t.id === openId) ?? null;

  if (open) {
    return (
      <div data-page-theme={effective.appTheme} className="h-full min-h-0">
        <AgentTemplateDetail
          template={open}
          onBack={() => setOpenId(null)}
        />
      </div>
    );
  }

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]"
    >
      <PageHeader
        title="Agent templates"
        count={`${rows.length}`}
        description="Prebuilt agents from HighLevel and the marketplace"
        primary={{ label: "Submit an agent", icon: Play }}
      />

      <div className="flex min-h-0 flex-1 gap-[20px]">
        <FacetRail
          channel={channel}
          onChannel={setChannel}
          picked={picked}
          onToggle={toggle}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-[14px]">
          <div className="flex shrink-0 items-center gap-[10px]">
            <span aria-hidden="true" className="min-w-[16px] flex-1" />
            <div className="flex h-[34px] w-[360px] shrink-0 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for agents"
                aria-label="Search for agents"
                className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto pb-[16px]">
            {rows.length === 0 ? (
              <p className="rounded-[12px] bg-pg-surface px-[16px] py-[40px] text-center text-[13px] leading-[18px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
                No agent matches those filters. Clear one and try again.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2 2xl:grid-cols-3">
                {rows.map((t) => (
                  <TemplateCard
                    key={t.id}
                    template={t}
                    onOpen={() => setOpenId(t.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── The rail ──────────────────────────────────────────────────────────── */

/**
 * The facets, open at the one that matters and shut everywhere else.
 *
 * Channel is not in a disclosure: it halves the catalogue, every listing has
 * exactly one, and a filter that decides what the other six facets even mean
 * cannot be the one you have to open a drawer to find.
 */
function FacetRail({
  channel,
  onChannel,
  picked,
  onToggle,
}: {
  channel: AgentChannel;
  onChannel: (c: AgentChannel) => void;
  picked: Record<string, string[]>;
  onToggle: (facet: string, option: string) => void;
}) {
  return (
    <aside className="hidden w-[232px] shrink-0 overflow-y-auto pb-[16px] lg:block">
      <h2 className="px-[4px] pb-[8px] text-[14px] leading-[20px] font-semibold text-pg-heading">
        AI agents
      </h2>
      <div className="flex flex-col gap-[2px] border-b border-pg-row-border pb-[10px]">
        {(
          [
            { id: "voice", label: "Voice AI" },
            { id: "conversation", label: "Conversation AI" },
          ] as const
        ).map((c) => {
          const on = c.id === channel;
          return (
            <label
              key={c.id}
              className="motion-tap flex cursor-pointer items-center gap-[10px] rounded-[8px] px-[8px] py-[7px] hover:bg-pg-row-border"
            >
              <input
                type="radio"
                name="agent-channel"
                checked={on}
                onChange={() => onChannel(c.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-[16px] shrink-0 items-center justify-center rounded-full",
                  on
                    ? "bg-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                    : "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                )}
              >
                {on ? <span className="size-[5px] rounded-full bg-white" /> : null}
              </span>
              <span
                className={cn(
                  "text-[14px] leading-[20px]",
                  on ? "font-semibold text-pg-heading" : "text-pg-text",
                )}
              >
                {c.label}
              </span>
            </label>
          );
        })}
      </div>

      {FACETS.map((facet) => (
        <Facet
          key={facet.id}
          label={facet.label}
          options={facet.options}
          picked={picked[facet.id] ?? []}
          onToggle={(option) => onToggle(facet.id, option)}
        />
      ))}
    </aside>
  );
}

function Facet({
  label,
  options,
  picked,
  onToggle,
}: {
  label: string;
  options: string[];
  picked: string[];
  onToggle: (option: string) => void;
}) {
  /*
   * A facet with something ticked opens itself.
   *
   * Otherwise clearing a filter means remembering which drawer you set it in —
   * the marketplace failure everyone has met, where the grid is empty and the
   * reason is folded away three sections down.
   */
  const [open, setOpen] = React.useState(picked.length > 0);
  return (
    <div className="border-b border-pg-row-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex w-full items-center gap-[8px] px-[4px] py-[11px] text-left"
      >
        <ChevronRight
          size={14}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-faint motion-move", open && "rotate-90")}
        />
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
          {label}
        </span>
        {picked.length > 0 ? (
          <span className="shrink-0 rounded-full bg-brand-soft px-[6px] py-[1px] text-[11px] leading-[14px] font-semibold text-brand tabular-nums">
            {picked.length}
          </span>
        ) : null}
      </button>
      {open ? (
        <ul className="flex flex-col gap-[2px] pb-[8px]">
          {options.map((option) => {
            const on = picked.includes(option);
            return (
              <li key={option}>
                <label className="motion-tap flex cursor-pointer items-center gap-[10px] rounded-[8px] px-[8px] py-[6px] hover:bg-pg-row-border">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onToggle(option)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-[15px] shrink-0 items-center justify-center rounded-[4px]",
                      on
                        ? "bg-brand text-white"
                        : "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                    )}
                  >
                    {on ? <Check size={10} strokeWidth={3} /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-text">
                    {option}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

/* ─── The cards ─────────────────────────────────────────────────────────── */

function TemplateCard({
  template,
  onOpen,
}: {
  template: AgentTemplate;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="motion-tap group flex flex-col overflow-hidden rounded-[12px] bg-pg-surface text-left shadow-[inset_0_0_0_1px_var(--pg-card-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_8px_16px_-6px_rgba(16,24,40,0.12)] active:scale-[0.995]"
    >
      <AgentPoster template={template} />

      <div className="flex flex-1 flex-col gap-[6px] p-[16px]">
        <div className="flex items-start gap-[10px]">
          <h3 className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
            {template.title}
          </h3>
          {/*
            The listen count, beside the name rather than under it: it is the
            one number on the card that says how many other people bothered,
            and a buyer reads it in the same glance as the title.
          */}
          <span className="flex shrink-0 items-center gap-[4px] text-[12.5px] leading-[18px] text-pg-muted tabular-nums">
            <Headphones size={13} aria-hidden="true" />
            {template.listens}
          </span>
        </div>
        <p className="truncate text-[13px] leading-[18px] text-pg-muted">
          By {template.maker}
        </p>
        <p className="line-clamp-2 text-[13px] leading-[18px] text-pg-text">
          {template.blurb}
        </p>

        <Rating rating={template.rating} reviews={template.reviews} />

        <div className="flex items-center gap-[6px] pt-[2px]">
          <Tag>{template.paid ? "Paid" : "Free"}</Tag>
          {template.installed ? <Tag tone="installed">Installed</Tag> : null}
        </div>
      </div>
    </button>
  );
}

/**
 * The listing's artwork: a tinted field, the persona's name, and a portrait.
 *
 * No photographs. The marketplace's own cards are makers' headshots and this
 * prototype ships none, so the ring carries initials on the maker's gradient
 * instead — which keeps the card's SHAPE (a face at the right, a name at the
 * left) without pretending to a library of stock people we do not have.
 */
function AgentPoster({ template }: { template: AgentTemplate }) {
  return (
    <div className="relative flex h-[120px] shrink-0 items-center gap-[12px] overflow-hidden bg-brand-soft px-[16px]">
      <span className="min-w-0 flex-1 text-[13.5px] leading-[18px] font-semibold text-brand">
        {template.persona}
      </span>
      <span
        style={{ backgroundImage: template.poster }}
        className="flex size-[76px] shrink-0 items-center justify-center rounded-full text-[19px] leading-none font-semibold text-white shadow-[0_0_0_4px_var(--pg-surface),0_0_0_6px_color-mix(in_oklab,var(--brand)_25%,transparent)] motion-move group-hover:scale-[1.03]"
      >
        {template.initials}
      </span>
    </div>
  );
}

function Rating({ rating, reviews }: { rating: number; reviews: number }) {
  if (reviews === 0) {
    return (
      <span className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-faint">
        <Star size={14} aria-hidden="true" />
        No reviews yet
      </span>
    );
  }
  return (
    <span className="flex items-center gap-[6px]">
      <span aria-hidden="true" className="flex items-center gap-[1px]">
        {[0, 1, 2, 3, 4].map((i) => (
          <Star
            key={i}
            size={14}
            className={cn(
              // Half stars would need a clip path per star for a tenth of a
              // point nobody reads off the glyphs — the number beside them is
              // where the precision lives.
              i < Math.round(rating)
                ? "fill-[var(--hr-warning-400,#fdb022)] text-[var(--hr-warning-400,#fdb022)]"
                : "text-pg-border-strong",
            )}
          />
        ))}
      </span>
      <span className="text-[13px] leading-[18px] text-pg-text tabular-nums">
        {rating}({reviews})
      </span>
    </span>
  );
}

function Tag({
  children,
  tone = "plain",
}: {
  children: React.ReactNode;
  tone?: "plain" | "installed";
}) {
  return (
    <span
      className={cn(
        "rounded-[6px] px-[7px] py-[2px] text-[11.5px] leading-[16px] font-semibold",
        tone === "installed"
          ? "bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] text-[var(--pg-av-green-fg)]"
          : "text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      {children}
    </span>
  );
}

/* ─── One listing ───────────────────────────────────────────────────────── */

/**
 * The listing, opened.
 *
 * Same rule as every other detail view in the prototype: no title row, because
 * the record crumb above says the agent's name and carries the way back. What
 * this screen adds to the card is the part a card cannot hold — what the agent
 * does step by step, and the two decisions (install, or listen first).
 */
function AgentTemplateDetail({
  template,
  onBack,
}: {
  template: AgentTemplate;
  onBack: () => void;
}) {
  const { effective } = useTheme();
  useRecordCrumb({ name: template.title, kind: "Agent template" }, onBack);

  const facts = [
    { label: "Maker", value: template.maker },
    { label: "Channel", value: template.channel === "voice" ? "Voice AI" : "Conversation AI" },
    { label: "Category", value: template.category },
    { label: "Best for", value: template.useCase },
    { label: "Niche", value: template.niche },
    { label: "Price", value: template.paid ? "Paid" : "Free" },
  ];

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px] overflow-y-auto px-[var(--page-inset)] pb-[16px]"
    >
      <div className="flex shrink-0 items-center justify-between gap-[16px] py-[6px]">
        <Rating rating={template.rating} reviews={template.reviews} />
        <div className="flex shrink-0 items-center gap-[10px]">
          <OutlineButton>
            <Play size={14} aria-hidden="true" className="text-pg-text-strong" />
            Hear a demo call
          </OutlineButton>
          <PrimaryButton>
            {template.installed ? "Open in Agent Studio" : "Install agent"}
          </PrimaryButton>
        </div>
      </div>

      <div className="grid min-h-0 grid-cols-1 gap-[16px] xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-[16px]">
          <div className="overflow-hidden rounded-[12px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            <AgentPoster template={template} />
          </div>

          <section className="flex flex-col gap-[8px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
            <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
              What this agent does
            </h3>
            <p className="text-[13px] leading-[18px] text-pg-text">
              {template.blurb}
            </p>
            <ol className="flex flex-col gap-[6px] pt-[4px]">
              {[
                "Answers on the first ring and greets the caller by your business name.",
                "Asks the qualifying questions you set, and writes the answers onto the contact.",
                "Offers the next three open slots from the calendar you point it at.",
                "Hands off to a human the moment it is asked to, with the transcript attached.",
              ].map((step, i) => (
                <li key={step} className="flex gap-[10px]">
                  <span className="mt-[1px] flex size-[18px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-[11px] leading-none font-semibold text-brand tabular-nums">
                    {i + 1}
                  </span>
                  <span className="text-[13px] leading-[18px] text-pg-text">
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="flex flex-col gap-[10px] rounded-[12px] bg-pg-surface p-[16px] shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
            Details
          </h3>
          <dl className="flex flex-col gap-[8px]">
            {facts.map((f) => (
              <div key={f.label} className="flex items-baseline gap-[10px]">
                <dt className="w-[74px] shrink-0 text-[12.5px] leading-[18px] text-pg-muted">
                  {f.label}
                </dt>
                <dd className="min-w-0 flex-1 text-[13px] leading-[18px] text-pg-text-strong">
                  {f.value}
                </dd>
              </div>
            ))}
            <div className="flex items-baseline gap-[10px]">
              <dt className="w-[74px] shrink-0 text-[12.5px] leading-[18px] text-pg-muted">
                Demos played
              </dt>
              <dd className="min-w-0 flex-1 text-[13px] leading-[18px] text-pg-text-strong tabular-nums">
                {template.listens}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
