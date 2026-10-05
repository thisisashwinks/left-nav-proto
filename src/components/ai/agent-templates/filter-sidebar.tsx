"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/page/form-controls";
import { cn } from "@/lib/utils";
import { FACETS, type AgentChannel, type FacetId } from "./data";

export type Picked = Partial<Record<FacetId, string[]>>;

const CHANNELS: { id: AgentChannel; label: string }[] = [
  { id: "voice", label: "Voice AI" },
  { id: "conversation", label: "Conversation AI" },
];

/**
 * The marketplace's filter column: one radio question, then stacked checkbox
 * facets, each an accordion section on a hairline.
 *
 * The channel is a radio because an agent has exactly one; everything else is
 * a checkbox list because an agent has any number of them (OR within a
 * section, AND across sections). Only the channel starts open, as on the live
 * page — the other seven are there to narrow, not to read.
 */
export function FilterSidebar({
  channel,
  onChannel,
  picked,
  onToggle,
}: {
  channel: AgentChannel;
  onChannel: (c: AgentChannel) => void;
  picked: Picked;
  onToggle: (facet: FacetId, option: string) => void;
}) {
  return (
    <aside
      aria-label="Filters"
      className="flex shrink-0 flex-col lg:w-[300px] lg:overflow-y-auto lg:pb-[16px]"
    >
      <Section label="AI agents" defaultOpen>
        <div role="radiogroup" aria-label="AI agents" className="flex flex-col gap-[12px]">
          {CHANNELS.map((c) => (
            <Radio
              key={c.id}
              label={c.label}
              checked={c.id === channel}
              onSelect={() => onChannel(c.id)}
            />
          ))}
        </div>
      </Section>

      {FACETS.map((facet) => {
        const on = picked[facet.id] ?? [];
        return (
          <Section key={facet.id} label={facet.label} count={on.length}>
            <div className="flex flex-col gap-[12px]">
              {facet.options.map((option) => (
                <Checkbox
                  key={option}
                  checked={on.includes(option)}
                  onChange={() => onToggle(facet.id, option)}
                  label={option}
                />
              ))}
            </div>
          </Section>
        );
      })}
    </aside>
  );
}

function Section({
  label,
  count = 0,
  defaultOpen = false,
  children,
}: {
  label: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const id = React.useId();
  return (
    <section className="border-b border-pg-row-border">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex w-full items-center gap-[8px] py-[14px] pr-[4px] text-left"
      >
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
          {label}
        </span>
        {/* A ticked facet says so while folded, so an empty grid is never
            explained by a filter hidden in a closed section. */}
        {count > 0 ? (
          <span className="shrink-0 rounded-full bg-brand-soft px-[6px] py-[1px] text-[12px] leading-[16px] font-semibold text-brand tabular-nums">
            {count}
          </span>
        ) : null}
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={cn("shrink-0 text-pg-muted motion-move", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div id={id} className="pb-[16px]">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function Radio({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className="motion-tap flex items-center gap-[8px] text-left"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[16px] shrink-0 items-center justify-center rounded-full",
          checked
            ? "bg-brand"
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {checked ? <span className="size-[6px] rounded-full bg-brand-fg" /> : null}
      </span>
      <span className="text-[14px] leading-[20px] text-pg-text">{label}</span>
    </button>
  );
}
