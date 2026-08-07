"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import type { Account } from "./accounts-data";
import { RailTooltip } from "@/components/nav/rail-tooltip";
import type { AccountsSession } from "./use-accounts";

/** The rail's width — the shell adds this to every panel's dock offset. */
export const ACCOUNT_RAIL_WIDTH = 56;

interface AccountRailProps {
  session: AccountsSession;
  theme: SurfaceTheme;
  /** Whether the Accounts panel is open — the + tile shows as pressed. */
  switcherOpen: boolean;
  onToggleSwitcher: () => void;
}

/**
 * Model C: the account rail.
 *
 * The agency is not a mode — it is the first tile, squircle where the
 * accounts are circles, separated by a rule. Below it, the open accounts:
 * the ones the user has chosen to keep on the rail, capped at the session's
 * limit and managed from the panel behind the + tile.
 *
 * Where-am-I is answered by position and shape, not colour: the selected
 * tile carries a bar on the rail's edge, a ring around the mark, and full
 * opacity — three redundant cues, because the review's finding was that one
 * was not enough. The tiles themselves keep each account's real logo; that
 * is the tenant's brand, not a signal we invented.
 */
export function AccountRail({
  session,
  theme,
  switcherOpen,
  onToggleSwitcher,
}: AccountRailProps) {
  const railAccounts = session.railIds
    .map((id) => session.accounts.find((a) => a.id === id))
    .filter((a): a is Account => a !== undefined);

  return (
    <nav
      data-nav-theme={theme}
      aria-label="Accounts"
      data-cursor="menu"
      className="flex h-full shrink-0 flex-col items-center gap-[7px] overflow-hidden bg-nav-rail py-[10px] shadow-[inset_-1px_0_0_0_var(--nav-border)]"
      style={{ width: ACCOUNT_RAIL_WIDTH }}
    >
      <RailTile
        label={`${session.agency.name} — agency`}
        selected={session.scope === "agency"}
        onClick={session.switchToAgency}
        squircle
      >
        {/* Squircle: the agency's shape, never used by an account tile. */}
        <AccountLogo
          logo={session.agency.logo}
          src={session.agency.logoSrc}
          size={34}
          radius={10}
        />
      </RailTile>

      <div aria-hidden="true" className="w-[26px] shrink-0 border-t border-nav-divider" />

      {railAccounts.map((account) => (
        <RailTile
          key={account.id}
          label={account.name}
          selected={session.scope === "account" && account.id === session.current.id}
          onClick={() => session.switchTo(account.id)}
        >
          <AccountLogo logo={account.logo} src={account.logoSrc} size={32} radius={999} />
        </RailTile>
      ))}

      <RailTooltip label="Open another account">
        <button
          type="button"
          aria-label="Open another account"
          aria-haspopup="dialog"
          aria-expanded={switcherOpen}
          onClick={onToggleSwitcher}
          className={cn(
            "motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-full border border-dashed border-nav-divider text-nav-fg-subtle",
            switcherOpen
              ? "bg-nav-active text-nav-fg"
              : "hover:border-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted",
          )}
        >
          <Plus size={15} aria-hidden="true" />
        </button>
      </RailTooltip>
    </nav>
  );
}

/**
 * One tile. Selection is three redundant cues — the edge bar, a ring around
 * the mark, and full opacity against everyone else's rest state — because
 * the tenant's logo itself must never be repainted to say "you are here".
 */
function RailTile({
  label,
  selected,
  onClick,
  squircle = false,
  children,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  /** The agency's shape — the selection ring has to follow it. */
  squircle?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex w-full shrink-0 items-center justify-center">
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 w-[3px] rounded-r-[2px] bg-nav-fg motion-move",
          selected ? "h-[26px] opacity-100" : "h-[8px] opacity-0",
        )}
      />
      <RailTooltip label={label}>
        <button
          type="button"
          aria-label={label}
          aria-current={selected ? "page" : undefined}
          onClick={onClick}
          className={cn(
            "motion-tap flex items-center justify-center outline-none focus-visible:ring-[1.5px] focus-visible:ring-brand",
            squircle ? "rounded-[12px]" : "rounded-full",
            selected
              ? "opacity-100 ring-2 ring-nav-fg ring-offset-2 ring-offset-nav-rail"
              : "opacity-55 grayscale-[0.2] hover:scale-105 hover:opacity-100 hover:grayscale-0 active:scale-95",
          )}
        >
          {children}
        </button>
      </RailTooltip>
    </div>
  );
}
