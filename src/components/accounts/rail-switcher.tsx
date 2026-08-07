"use client";

import * as React from "react";
import { Info, Minus, Plus, Search } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import { matchAccounts, type Account } from "./accounts-data";
import type { AccountsSession } from "./use-accounts";

interface RailSwitcherProps {
  session: AccountsSession;
  /** Docked past the rail's right edge, like every other panel. */
  offsetLeft: number;
  theme: SurfaceTheme;
  phase: TransitionPhase;
  onClose: () => void;
}

const PANEL_WIDTH = 340;

/**
 * The Accounts panel behind the rail's + tile.
 *
 * One panel, two jobs: curate the rail (add, remove, see the cap) and jump
 * to any account that has not earned a tile. Grouped the way the decision
 * actually reads — what is on the rail, what you touched recently, then
 * everything — with the same search the old switcher had.
 */
export function RailSwitcher({
  session,
  offsetLeft,
  theme,
  phase,
  onClose,
}: RailSwitcherProps) {
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const matches = matchAccounts(query, session.accounts);
  const searching = query.trim() !== "";

  const onRail = matches.filter((a) => session.onRail(a.id));
  const recent = matches.filter(
    (a) => !session.onRail(a.id) && session.recentIds.includes(a.id),
  );
  const rest = matches.filter(
    (a) => !session.onRail(a.id) && !session.recentIds.includes(a.id),
  );

  const railFull = session.railIds.length >= session.railLimit;

  return (
    <>
      <button
        type="button"
        aria-label="Close accounts panel"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 z-40 cursor-default"
      />

      <div
        role="dialog"
        aria-label="Accounts"
        data-nav-theme={theme}
        data-cursor="menu"
        style={{ left: offsetLeft + 8, width: PANEL_WIDTH }}
        className={cn(
          "absolute top-[10px] bottom-[10px] z-50 flex flex-col overflow-hidden rounded-[12px] bg-nav p-[8px]",
          "shadow-[0_16px_32px_-8px_var(--fly-shadow),0_4px_8px_-4px_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]",
          phase === "entering" ? "motion-menu-in" : "motion-menu-out",
        )}
      >
        <div className="motion-tap flex h-[34px] shrink-0 items-center gap-[8px] rounded-[9px] px-[9px] shadow-[inset_0_0_0_1px_var(--fly-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
          <Search size={15} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${session.accounts.length} accounts`}
            aria-label="Search accounts"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg caret-[var(--brand)] placeholder:text-nav-fg-subtle focus:outline-none"
          />
        </div>

        <div className="-mx-[2px] mt-[6px] min-h-0 flex-1 overflow-y-auto px-[2px]">
          {matches.length === 0 ? (
            <p className="px-[7px] py-[16px] text-[13px] leading-[18px] text-nav-fg-subtle">
              No accounts match “{query.trim()}”.
            </p>
          ) : null}

          <Group
            label={`OPEN · ${session.railIds.length} OF ${session.railLimit}`}
            accounts={onRail}
            session={session}
            action="remove"
            onClose={onClose}
          />
          {/* While searching, recency stops mattering — one flat list reads faster. */}
          {searching ? (
            <Group label="EVERYTHING ELSE" accounts={[...recent, ...rest]} session={session} action="add" onClose={onClose} />
          ) : (
            <>
              <Group label="RECENT" accounts={recent} session={session} action="add" onClose={onClose} />
              <Group label="ALL ACCOUNTS" accounts={rest} session={session} action="add" onClose={onClose} />
            </>
          )}
        </div>

        <div className="mt-[8px] flex shrink-0 items-start gap-[8px] px-[7px] pt-[8px] shadow-[inset_0_1px_0_0_var(--fly-border)]">
          <Info size={13} aria-hidden="true" className="mt-[1px] shrink-0 text-nav-fg-subtle" />
          <p className="text-[11.5px] leading-[16px] text-nav-fg-subtle">
            {railFull
              ? `All ${session.railLimit} slots are in use — close an account to open another. Everything stays one search away.`
              : `Keep up to ${session.railLimit} accounts open on the left. Everything else stays one search away.`}
          </p>
        </div>
      </div>
    </>
  );
}

function Group({
  label,
  accounts,
  session,
  action,
  onClose,
}: {
  label: string;
  accounts: Account[];
  session: AccountsSession;
  action: "add" | "remove";
  onClose: () => void;
}) {
  if (accounts.length === 0) return null;
  const railFull = session.railIds.length >= session.railLimit;

  return (
    <>
      <div className="sticky top-0 z-10 bg-nav px-[7px] pt-[8px] pb-[4px]">
        <span className="text-[10.5px] leading-[14px] font-semibold tracking-[0.6px] text-nav-fg-subtle uppercase">
          {label}
        </span>
      </div>
      {accounts.map((account) => {
        const current =
          session.scope === "account" && account.id === session.current.id;
        return (
          <div
            key={account.id}
            className={cn(
              "group/row flex w-full items-center gap-[10px] rounded-[8px] px-[7px] py-[6px]",
              current ? "bg-nav-active" : "hover:bg-nav-hover",
            )}
          >
            {/* The row is the jump; the trailing button is the curation. */}
            <button
              type="button"
              onClick={() => {
                session.switchTo(account.id);
                onClose();
              }}
              className="flex min-w-0 flex-1 items-center gap-[10px] text-left outline-none"
            >
              <AccountLogo logo={account.logo} src={account.logoSrc} size={28} radius={999} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[13.5px] leading-[18px] font-medium text-nav-fg">
                  {account.name}
                </span>
                <span className="truncate text-[11.5px] leading-[15px] text-nav-fg-subtle">
                  {account.meta}
                </span>
              </span>
            </button>
            {/* Said, not implied: the tinted row alone failed the review. */}
            {current ? (
              <span className="shrink-0 rounded-[5px] bg-nav-hover px-[6px] py-[2px] text-[10px] leading-[14px] font-semibold text-nav-fg-muted">
                Current
              </span>
            ) : null}
            <button
              type="button"
              aria-label={
                action === "remove"
                  ? `Close ${account.name}`
                  : `Keep ${account.name} open`
              }
              title={action === "remove" ? "Close" : "Keep open"}
              disabled={action === "add" && railFull}
              onClick={() =>
                action === "remove"
                  ? session.removeFromRail(account.id)
                  : session.addToRail(account.id)
              }
              className={cn(
                // Visible at rest — a hover-only affordance made the panel
                // read as a plain list until you happened to mouse a row.
                "motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle",
                "shadow-[inset_0_0_0_1px_var(--fly-border)]",
                action === "add" && railFull
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-nav-active hover:text-nav-fg",
              )}
            >
              {action === "remove" ? (
                <Minus size={14} aria-hidden="true" />
              ) : (
                <Plus size={14} aria-hidden="true" />
              )}
            </button>
          </div>
        );
      })}
    </>
  );
}
