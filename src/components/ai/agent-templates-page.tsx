"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/page/page-header";
import { usePrototypeEmpty } from "@/components/page/empty-state-axis";
import { useTheme } from "@/components/theme/theme-provider";
import { AgentCard } from "./agent-templates/agent-card";
import { AgentDetail } from "./agent-templates/agent-detail";
import {
  AGENT_TEMPLATES,
  FACETS,
  facetValues,
  type AgentChannel,
} from "./agent-templates/data";
import { FilterSidebar, type Picked } from "./agent-templates/filter-sidebar";
import { NoAgentsFound } from "./agent-templates/no-agents-found";

/**
 * AI ▸ Agent templates — the marketplace.
 *
 * A gallery rather than a table: these are things the account might install,
 * chosen on a persona, a maker and a rating, none of which survive a 13px cell.
 * The layout follows the live marketplace — search top-right, a filter column
 * on the left, a 3-up grid that drops to 2 and 1 with its container's width.
 *
 * The page paints no ground of its own; the canvas does, so the white cards
 * read on every Canvas background setting.
 */
export function AgentTemplatesPage() {
  const empty = usePrototypeEmpty("agent-templates");
  const { effective } = useTheme();
  const [channel, setChannel] = React.useState<AgentChannel>("voice");
  const [query, setQuery] = React.useState("");
  const [picked, setPicked] = React.useState<Picked>({});
  const [openId, setOpenId] = React.useState<string | null>(null);

  const toggle = (facet: keyof Picked, option: string) =>
    setPicked((current) => {
      const on = current[facet] ?? [];
      return {
        ...current,
        [facet]: on.includes(option) ? on.filter((o) => o !== option) : [...on, option],
      };
    });

  // Resets what narrows the grid, not the channel — the channel is which
  // catalogue you are in, and "clear filters" should not move you out of it.
  const clear = () => {
    setPicked({});
    setQuery("");
  };

  const rows = React.useMemo(() => {
    // A brand-new account sees the empty marketplace whatever it has ticked.
    if (empty) return [];
    const q = query.trim().toLowerCase();
    return AGENT_TEMPLATES.filter((a) => {
      if (a.channel !== channel) return false;
      if (q && !`${a.title} ${a.persona} ${a.author} ${a.description}`.toLowerCase().includes(q)) {
        return false;
      }
      // OR within a facet, AND across facets.
      return FACETS.every((facet) => {
        const on = picked[facet.id] ?? [];
        return on.length === 0 || facetValues(a, facet.id).some((v) => on.includes(v));
      });
    });
  }, [empty, channel, query, picked]);

  const open = AGENT_TEMPLATES.find((a) => a.id === openId) ?? null;

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[16px] px-[var(--page-inset)]"
    >
      <PageHeader title="Agent templates" count={`${rows.length}`} />

      <div className="flex min-h-0 flex-1 flex-col gap-[24px] overflow-y-auto lg:flex-row lg:overflow-hidden">
        <FilterSidebar
          channel={channel}
          onChannel={setChannel}
          picked={picked}
          onToggle={toggle}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-[16px] lg:overflow-y-auto">
          <div className="flex shrink-0 justify-end">
            <label className="flex h-[44px] w-full max-w-[420px] items-center gap-[10px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
              <Search size={18} aria-hidden="true" className="shrink-0 text-pg-faint" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for agents..."
                aria-label="Search for agents"
                className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
              />
            </label>
          </div>

          <div className="@container flex min-h-0 flex-1 flex-col pb-[16px]">
            {rows.length === 0 ? (
              <NoAgentsFound onClear={clear} />
            ) : (
              <div className="grid grid-cols-1 gap-[16px] @min-[540px]:grid-cols-2 @min-[820px]:grid-cols-3">
                {rows.map((a) => (
                  <AgentCard key={a.id} agent={a} onOpen={() => setOpenId(a.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {open ? <AgentDetail agent={open} onClose={() => setOpenId(null)} /> : null}
    </div>
  );
}
