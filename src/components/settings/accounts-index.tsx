"use client";

import * as React from "react";
import { ChevronRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import { matchAccounts } from "@/components/accounts/accounts-data";
import type { AccountsSession } from "@/components/accounts/use-accounts";
import { industryFor } from "@/components/nav/account-nav-profiles";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * The Sub-accounts page: pick an account, then manage it. Mirrors production's
 * Sub-Accounts table — name, status, a per-row action — minus the twelve
 * columns of admin that belong to the account detail, not to choosing one.
 *
 * It used to be the door to the nav customizer, and the row action said
 * "Customize" because the page behind it could reshape a client's navigation.
 * That tab is gone (Aug 25 — editing happens in place, in the account), so the
 * action promises only what the page still delivers: its settings.
 */
export function AccountsIndexPage({
  session,
  onManage,
}: {
  session: AccountsSession;
  onManage: (accountId: string) => void;
}) {
  const { effective } = useTheme();
  const layout = useNavLayout();
  const appTheme = effective.appTheme;
  const [query, setQuery] = React.useState("");
  const accounts = matchAccounts(query, session.accounts);

  return (
    <div data-page-theme={appTheme} className="flex h-full min-h-0 flex-col bg-pg-bg">
      <header className="flex shrink-0 items-center gap-[12px] px-[24px] pt-[18px] pb-[14px]">
        <div className="min-w-0 flex-1">
          <h1 className="text-[17px] leading-[22px] font-semibold text-pg-heading">
            Sub-accounts
          </h1>
          <p className="text-[12px] leading-[16px] text-pg-muted">
            {session.accounts.length} accounts · pick one to manage its details and settings.
          </p>
        </div>
        <label className="flex h-[32px] w-[240px] shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or address"
            aria-label="Search sub-accounts"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-none text-pg-heading placeholder:text-pg-faint focus:outline-none"
          />
        </label>
        <button
          type="button"
          className="motion-tap flex h-[32px] shrink-0 items-center gap-[6px] rounded-[8px] bg-brand px-[12px] text-[12.5px] leading-none font-medium text-brand-fg active:scale-[0.98]"
        >
          <Plus size={13} aria-hidden="true" />
          Create sub-account
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-[24px] pb-[24px]">
        <div className="overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
          <div className="flex items-center gap-[14px] px-[16px] py-[9px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
            <span className="w-[300px] text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Name
            </span>
            <span className="flex-1 text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Address
            </span>
            {/*
              The two columns that decide what an operator opens: what trade
              this client is in, and how much of the catalogue they are on.
              Both are what makes their nav look the way it does.
            */}
            <span className="w-[170px] text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Industry
            </span>
            <span className="w-[80px] text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Products
            </span>
            <span className="w-[70px] text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              Status
            </span>
            <span className="w-[110px]" />
          </div>
          {accounts.length === 0 ? (
            <p className="px-[16px] py-[18px] text-[13px] text-pg-muted">
              No accounts match “{query.trim()}”.
            </p>
          ) : null}
          {accounts.map((account, i) => (
            <button
              key={account.id}
              type="button"
              onClick={() => onManage(account.id)}
              className={`group/row flex w-full items-center gap-[14px] px-[16px] py-[10px] text-left hover:bg-pg-bg ${
                i === accounts.length - 1 ? "" : "shadow-[inset_0_-1px_0_0_var(--pg-border)]"
              }`}
            >
              <span className="flex w-[300px] items-center gap-[10px]">
                <AccountLogo logo={account.logo} src={account.logoSrc} size={26} radius={999} />
                <span className="truncate text-[13.5px] leading-[18px] font-medium text-pg-heading">
                  {account.name}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-pg-muted">
                {account.meta}
              </span>
              <span className="w-[170px] truncate text-[12.5px] text-pg-muted">
                {industryFor(account.id) ?? "—"}
              </span>
              <span className="w-[80px] text-[12.5px] text-pg-muted tabular-nums">
                {layout.profileFor(account.id).enabledProducts.length}
              </span>
              <span className="w-[70px]">
                <span className="rounded-[5px] bg-[color-mix(in_oklab,#16a34a_12%,transparent)] px-[6px] py-[3px] text-[10.5px] leading-none font-semibold text-[#15803d]">
                  Active
                </span>
              </span>
              <span className="flex w-[110px] items-center justify-end gap-[5px] text-[12.5px] leading-none font-medium text-brand opacity-0 group-hover/row:opacity-100">
                <SlidersHorizontal size={13} aria-hidden="true" />
                Manage
                <ChevronRight size={13} aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
