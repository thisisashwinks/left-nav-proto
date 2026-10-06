"use client";

import type * as React from "react";
import type { Account } from "@/components/accounts/accounts-data";
import { AccountLogo } from "@/components/accounts/account-logo";
import { BrandMark } from "./brand-mark";
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
   * False for a plain sub-account user: there is nothing to switch TO, so the
   * identity renders as a static mark-and-name rather than a trigger.
   */
  canSwitch?: boolean;
  /**
   * What sits at the row's right edge.
   *
   * A slot rather than a fixed search button: what belongs here depends on where
   * search lives. With search in this row it is the search icon; with search moved
   * down into its own control it is the drawer toggle, which otherwise had a whole
   * empty footer to itself.
   */
  trailing?: React.ReactNode;
  /** Collapses the nav in place — the logo mark's second job. */
  onToggleCollapsed?: () => void;
  /**
   * Whether this row draws the logo at all.
   *
   * False only at agency scope, and only when the account rail beside it is
   * already showing the same mark. The name always stays — it is the half of
   * the identity the rail cannot state. See AGENCY_NAV_MARK_DEFAULT.
   */
  mark?: boolean;
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
  canSwitch = true,
  trailing,
  onToggleCollapsed,
  mark = true,
}: NavHeaderProps) {
  // A config `logoSrc` pins the header to one asset for a demo, so it outranks
  // the account's own pair — the wide logo included.
  const wordmark = logoSrc ? undefined : account.wordmarkSrc;
  // 9 + 30 + 9 = 48: the identity row centres on the app header's own
  // midline (48px tall, content at 24), so mark, name, collapse, breadcrumb
  // and header icons all sit on ONE line across the top of the screen.
  return (
    <div /*
        The header shares the column's gutter — see `navPadX`.

        +2 on each side, which is the offset it has always carried: the rows
        below sit in a 10px gutter and then pad themselves another 8 inside
        their own hover fill, where the header's contents have no fill to pad
        them. Holding the difference as a calc keeps the two moving together
        when the slider moves, rather than the header staying put while the
        list slides out from under it.
      */
      className="flex w-full shrink-0 flex-col items-start gap-[10px] pt-[9px] pb-[9px] px-[calc(var(--t-nav-pad,10px)+2px)]">
      <div className="flex w-full items-center gap-[6px]">
        <div className="flex min-w-0 flex-1 items-center">
          {canSwitch ? (
            <WorkspaceTrigger
              account={account}
              logoSrc={logoSrc}
              logoAlt={logoAlt}
              open={switcherOpen}
              onToggle={onToggleSwitcher}
              agency={agency}
              mark={mark}
              {...(onToggleCollapsed ? { onToggleCollapsed } : {})}
            />
          ) : (
            <span className="flex h-[30px] min-w-0 items-center gap-[7px]">
              {onToggleCollapsed && mark ? (
                wordmark ? (
                  /*
                    A wide logo takes the whole header row.
                    
                    The split header makes the square mark its own collapse
                    button and sets the name beside it — but a wide logo already
                    contains the name, and the uploads are two crops of one
                    brand, so showing both put the same glyph on screen twice.
                    The wordmark becomes the button instead. It is a larger
                    target than the 20px disc it replaces, not a smaller one.
                  */
                  <button
                    type="button"
                    aria-label="Collapse navigation"
                    title={logoAlt}
                    onClick={onToggleCollapsed}
                    className="motion-tap -mx-[4px] flex min-w-0 items-center rounded-[7px] px-[4px] py-[2px] hover:bg-nav-hover active:scale-[0.98]"
                  >
                    {/*
                      Height-bound, width free, capped at 168px.
                      
                      Production proposes 350×180 for this asset, which is a
                      1.94:1 box — bound to a 22px row that comes out ~43px
                      wide, far too small to read. Real agency wordmarks are
                      nearer 4:1 or 5:1 and land around 100px, which is the case
                      this is tuned for. Worth raising: the 350×180 guidance
                      suits a login screen, not a nav row, and an agency that
                      follows it literally will not like the result.
                    */}
                    <img
                      src={wordmark}
                      alt={account.name}
                      className="h-[22px] w-auto max-w-[168px] object-contain object-left"
                    />
                  </button>
                ) : (
                <>
                  <button
                    type="button"
                    aria-label="Collapse navigation"
                    title="Collapse navigation"
                    onClick={onToggleCollapsed}
                    className="motion-tap -m-[3px] flex shrink-0 items-center justify-center rounded-full p-[3px] hover:bg-nav-hover active:scale-95"
                  >
                    <AccountLogo
                      logo={account.logo}
                      src={logoSrc ?? account.logoSrc}
                      size={20}
                      radius={999}
                    />
                  </button>
                  <BrandMark
                    account={account}
                    logoSrc={logoSrc}
                    alt={logoAlt}
                    withMark={false}
                  />
                </>
                )
              ) : (
                <BrandMark
                  account={account}
                  logoSrc={logoSrc}
                  alt={logoAlt}
                  withMark={mark}
                />
              )}
            </span>
          )}
        </div>

        {trailing}
      </div>
    </div>
  );
}
