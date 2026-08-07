"use client";

import type * as React from "react";
import type { Account } from "@/components/accounts/accounts-data";
import { WorkspaceTrigger } from "./workspace-trigger";

interface NavHeaderProps {
  account: Account;
  logoSrc?: string;
  logoAlt: string;
  switcherOpen: boolean;
  onToggleSwitcher: () => void;
  /** Agency scope — the trigger takes the marked treatment. */
  agency?: boolean;
  /**
   * What sits at the row's right edge.
   *
   * A slot rather than a fixed search button: what belongs here depends on where
   * search lives. With search in this row it is the search icon; with search moved
   * down into its own control it is the drawer toggle, which otherwise had a whole
   * empty footer to itself.
   */
  trailing?: React.ReactNode;
}

/**
 * Logo row. From left-nav.pen: header padded 14px 12px 10px, with the account
 * trigger at the left and one action at the right.
 *
 * The design's fixed 222px mark box is gone — it existed to hold a 116px logo
 * slot plus a chevron pinned to its far end, and the switcher trigger now hugs
 * the name instead. The trailing slot keeps the right edge either way.
 */
export function NavHeader({
  account,
  logoSrc,
  logoAlt,
  switcherOpen,
  onToggleSwitcher,
  agency = false,
  trailing,
}: NavHeaderProps) {
  return (
    <div className="flex w-full shrink-0 flex-col items-start gap-[10px] pt-[14px] pr-[12px] pb-[10px] pl-[12px]">
      <div className="flex w-full items-center gap-[6px]">
        <div className="flex min-w-0 flex-1 items-center">
          <WorkspaceTrigger
            account={account}
            logoSrc={logoSrc}
            logoAlt={logoAlt}
            open={switcherOpen}
            onToggle={onToggleSwitcher}
            agency={agency}
          />
        </div>

        {trailing}
      </div>
    </div>
  );
}
