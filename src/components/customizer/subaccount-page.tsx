"use client";

import * as React from "react";
import { ArrowLeft, ChevronDown, Pencil } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { BasicDetailsTab } from "./tab-basic-details";
import { NavigationTab } from "./tab-navigation";
import { ProductionStubTab } from "./tab-production-stub";

/**
 * The sub-account settings page, shaped exactly as production shapes it:
 * back arrow, account name, the note chip, Switch to Sub-Account and Actions,
 * then the tab strip.
 *
 * The proposal is one tab wide. Navigation is the only new entry in that strip
 * and the only tab this prototype draws in full — every other tab is
 * production's, named in production's order, and left alone. Keeping the page
 * that people already use means the nav work can ship as an addition rather
 * than a migration.
 */

/** Production's tabs, in production's order. */
const TABS = [
  { id: "basic", label: "Basic Details" },
  { id: "navigation", label: "Navigation", isNew: true },
  { id: "saas", label: "SaaS" },
  { id: "features", label: "Features and Limits" },
  { id: "payments", label: "Payments" },
  { id: "rebilling", label: "Rebilling" },
  { id: "usage", label: "Usage Billing" },
  { id: "reselling", label: "Reselling" },
  { id: "marketplace", label: "Marketplace" },
  { id: "advanced", label: "Advanced Settings" },
  { id: "calendar", label: "Calendar Settings" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function SubAccountPage({
  account,
  onBack,
}: {
  /** The account being edited — chosen on the Sub-accounts page, not implied. */
  account: Account;
  onBack: () => void;
}) {
  const { effective } = useTheme();
  // The nav tab is the reason this page exists in the prototype, so it opens
  // there; Basic Details is one click away and shows the page it was added to.
  const [tab, setTab] = React.useState<TabId>("navigation");
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div
      data-page-theme={effective.appTheme}
      className="flex h-full min-h-0 flex-col bg-pg-bg"
    >
      <header className="shrink-0 px-[16px] pt-[16px]">
        <div className="flex items-center gap-[12px]">
          <button
            type="button"
            aria-label="Back to sub-accounts"
            onClick={onBack}
            className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <h1 className="min-w-0 shrink truncate text-[20px] leading-[28px] font-semibold text-pg-heading">
            {account.name}
          </h1>
          <span className="flex h-[32px] shrink-0 items-center gap-[8px] rounded-[8px] px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <span className="size-[8px] shrink-0 rounded-full bg-brand" aria-hidden="true" />
            <span className="text-[13px] leading-none text-pg-text">{account.meta}</span>
            <button
              type="button"
              aria-label="Edit the account note"
              className="motion-tap flex size-[20px] items-center justify-center rounded-[5px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
            >
              <Pencil size={12} aria-hidden="true" />
            </button>
          </span>
          <div className="flex flex-1 items-center justify-end gap-[8px]">
            <button
              type="button"
              className="motion-tap h-[36px] shrink-0 rounded-[8px] bg-[color-mix(in_oklab,var(--brand)_14%,transparent)] px-[14px] text-[14px] leading-none font-medium text-brand"
            >
              Switch to Sub-Account
            </button>
            <button
              type="button"
              className="motion-tap flex h-[36px] shrink-0 items-center gap-[6px] rounded-[8px] bg-brand px-[14px] text-[14px] leading-none font-medium text-brand-fg active:scale-[0.98]"
            >
              Actions
              <ChevronDown size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        <nav
          aria-label="Sub-account settings"
          className="mt-[14px] flex items-end gap-[24px] overflow-x-auto shadow-[inset_0_-1px_0_0_var(--pg-border)]"
        >
          {TABS.map((t) => {
            const selected = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={selected ? "page" : undefined}
                onClick={() => setTab(t.id)}
                className={cn(
                  "motion-tap flex shrink-0 items-center gap-[6px] whitespace-nowrap pb-[10px] text-[14px] leading-[20px] font-medium",
                  selected
                    ? "text-brand shadow-[inset_0_-2px_0_0_var(--brand)]"
                    : "text-pg-muted hover:text-pg-text",
                )}
              >
                {t.label}
                {"isNew" in t && t.isNew ? (
                  <span className="rounded-[5px] bg-[color-mix(in_oklab,var(--brand)_14%,transparent)] px-[5px] py-[2px] text-[10px] leading-none font-semibold text-brand">
                    New
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </header>

      <main
        aria-label={active.label}
        className="min-h-0 flex-1 overflow-y-auto p-[16px]"
      >
        {tab === "basic" ? <BasicDetailsTab key={account.id} account={account} /> : null}
        {tab === "navigation" ? <NavigationTab key={account.id} account={account} /> : null}
        {tab !== "basic" && tab !== "navigation" ? (
          <ProductionStubTab label={active.label} />
        ) : null}
      </main>
    </div>
  );
}
