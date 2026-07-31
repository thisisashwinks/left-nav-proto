"use client";

import { Search } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { WorkspaceTrigger } from "./workspace-trigger";

interface NavHeaderProps {
  account: Account;
  logoSrc?: string;
  logoAlt: string;
  switcherOpen: boolean;
  onToggleSwitcher: () => void;
  onSearch?: () => void;
}

/**
 * Logo row. From left-nav.pen: header padded 14px 12px 10px, with the account
 * trigger at the left and search at the right.
 *
 * The design's fixed 222px mark box is gone — it existed to hold a 116px logo
 * slot plus a chevron pinned to its far end, and the switcher trigger now hugs
 * the name instead. Search keeps the right edge either way.
 */
export function NavHeader({
  account,
  logoSrc,
  logoAlt,
  switcherOpen,
  onToggleSwitcher,
  onSearch,
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
          />
        </div>

        <button
          type="button"
          title="Search"
          aria-label="Search"
          onClick={onSearch}
          className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg-muted active:scale-95"
        >
          <Search size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
