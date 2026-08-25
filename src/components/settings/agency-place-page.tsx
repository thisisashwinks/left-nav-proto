"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { AgencyChild } from "@/components/nav/agency-config";

/**
 * The canvas behind any agency destination.
 *
 * Agency rows used to lead nowhere: only Sub-accounts had a page, so eleven of
 * the thirteen buckets highlighted and left the canvas on whatever was there
 * before. That made the tree impossible to read as navigation — you could not
 * tell a working row from a dead one.
 *
 * Deliberately thin. It is the same argument `product-page.tsx` makes with its
 * skeleton rows: this exists so the nav has somewhere real to go and so the
 * breadcrumb has something to name, not to propose a design for twenty-odd
 * agency screens nobody has asked for yet.
 *
 * The sheet's third level becomes the tab strip here — which is where L3 was
 * always going to land once the flyout stopped being the only place it could
 * live.
 */
export function AgencyPlacePage({
  title,
  description,
  tabs,
}: {
  title: string;
  description?: string;
  /** The place's L3, if it has any. */
  tabs?: readonly string[];
}) {
  const [active, setActive] = React.useState(0);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-[var(--page-inset)]">
        <h1 className="text-[20px] leading-[28px] font-semibold text-pg-heading">
          {title}
        </h1>
        {description ? (
          <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
            {description}
          </p>
        ) : null}

        {tabs && tabs.length > 0 ? (
          <nav
            aria-label={`${title} sections`}
            className="mt-[16px] flex gap-[18px] overflow-x-auto shadow-[inset_0_-1px_0_0_var(--pg-border)]"
          >
            {tabs.map((tab, i) => (
              <button
                key={tab}
                type="button"
                aria-current={i === active ? "page" : undefined}
                onClick={() => setActive(i)}
                className={cn(
                  "motion-tap shrink-0 pb-[10px] text-[14px] leading-[20px] font-medium whitespace-nowrap",
                  i === active
                    ? "text-brand shadow-[inset_0_-2px_0_0_var(--brand)]"
                    : "text-pg-muted hover:text-pg-text",
                )}
              >
                {tab}
              </button>
            ))}
          </nav>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--page-inset)] pt-[16px]">
        {/* Skeleton rows, not fake data — see the note above. */}
        <div className="rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="flex h-[52px] items-center gap-[12px] px-[16px] not-last:shadow-[inset_0_-1px_0_0_var(--pg-border)]"
            >
              <span className="size-[16px] shrink-0 rounded-[4px] bg-pg-bg" />
              <span
                className="h-[10px] rounded-full bg-pg-bg"
                style={{ width: `${34 - ((i * 7) % 18)}%` }}
              />
            </div>
          ))}
        </div>
        <p className="py-[12px] text-[12px] leading-[16px] text-pg-faint">
          Demo stage — {tabs && tabs.length > 0 ? `${title} · ${tabs[active]}` : title}
        </p>
      </div>
    </div>
  );
}

/** The tab labels for a place, when the mapping gave it a third level. */
export function tabsFor(parent: AgencyChild | undefined): readonly string[] {
  return (parent?.l3 ?? []).map((x) => x.label);
}
