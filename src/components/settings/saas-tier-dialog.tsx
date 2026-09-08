"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Check, X } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { areasAddedBy } from "@/components/nav/saas-tiers";
import { useTheme } from "@/components/theme/theme-provider";
import {
  SAAS_TIERS,
  SAAS_TIER_BLURBS,
  SAAS_TIER_LABELS,
  SAAS_TIER_PRICES,
  type SaasTier,
} from "@/design/plans";
import { cn } from "@/lib/utils";

/**
 * Which package a client is resold on.
 *
 * The second pricing layer, and the one that is easy to confuse with the first
 * — so this dialog never shows an agency price, never uses the agency plan's
 * names, and says out loud whose money it is about. An agency reading it should
 * not have to work out which of the two ladders they are looking at.
 *
 * Upgrade only. Taking products away from a live client is a billing
 * conversation with a migration behind it, not a row in a picker — see
 * `saas-tiers.ts`.
 */
export function SaasTierDialog({
  account,
  current,
  onChoose,
  onClose,
}: {
  account: Account;
  current: SaasTier;
  onChoose: (tier: SaasTier) => void;
  onClose: () => void;
}) {
  const { effective } = useTheme();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const rank = SAAS_TIERS.indexOf(current);

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[90] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Change ${account.name}'s plan`}
        className="motion-panel-in relative flex w-[520px] max-w-full flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <header className="flex items-start gap-[12px] px-[16px] pt-[12px] pb-[10px]">
          <div className="min-w-0 flex-1">
            <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
              {account.name}&rsquo;s plan
            </h2>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              What you resell this client on, and what you charge them. Separate
              from your own HighLevel plan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-row-border hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex flex-col gap-[6px] px-[16px] pb-[16px]">
          {SAAS_TIERS.map((tier, i) => {
            const isCurrent = tier === current;
            const isDowngrade = i < rank;
            return (
              <button
                key={tier}
                type="button"
                disabled={isCurrent || isDowngrade}
                onClick={() => {
                  onChoose(tier);
                  onClose();
                }}
                className={cn(
                  "motion-tap flex items-start gap-[10px] rounded-[8px] px-[12px] py-[10px] text-left",
                  isCurrent
                    ? "bg-pg-row-selected shadow-[inset_0_0_0_1.5px_var(--brand)]"
                    : isDowngrade
                      ? "cursor-not-allowed bg-pg opacity-45"
                      : "bg-pg shadow-[inset_0_0_0_1px_var(--pg-card-border)] hover:bg-pg-row-border",
                )}
              >
                <span className="mt-[2px] flex size-[18px] shrink-0 items-center justify-center">
                  {isCurrent ? (
                    <Check size={15} aria-hidden="true" className="text-brand" />
                  ) : isDowngrade ? null : (
                    <ArrowUp size={15} aria-hidden="true" className="text-pg-muted" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-[8px]">
                    <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                      {SAAS_TIER_LABELS[tier]}
                    </span>
                    <span className="text-[13px] leading-[18px] text-pg-muted">
                      {SAAS_TIER_PRICES[tier]}/mo
                    </span>
                    {isCurrent ? (
                      <span className="rounded-[5px] bg-[color-mix(in_oklab,var(--brand)_12%,transparent)] px-[6px] py-[2px] text-[11px] leading-none font-semibold text-brand">
                        Current
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-[2px] block text-[13px] leading-[18px] text-pg-text">
                    {SAAS_TIER_BLURBS[tier]}
                  </span>
                  {/*
                    What the client actually gains, in the nav's own words: the
                    areas that appear in their sidebar. A tier described only by
                    price is a number nobody can check.
                  */}
                  <span className="mt-[3px] block text-[12px] leading-[16px] text-pg-faint">
                    Adds {areasAddedBy(tier).join(", ")}
                  </span>
                </span>
              </button>
            );
          })}
          <p className="mt-[4px] text-[12px] leading-[16px] text-pg-faint">
            Downgrades aren&rsquo;t offered here — taking products away from a
            live client is a migration, not a toggle.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
