"use client";

import type * as React from "react";
import type { Account } from "@/components/accounts/accounts-data";
import { AccountLogo } from "@/components/accounts/account-logo";
import { AGENCY_WORDMARK_SRC } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
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
  /**
   * The agency to name above the account trigger, or null for none.
   *
   * Only ever set while the rail is down — see HEADER_AGENCY_PLATE_DEFAULT.
   * The rail states agency and account together; the dropdown states only the
   * account, so this is the row that puts the other half back, stacked above
   * rather than beside so the two read in the rail's own order.
   */
  agencyPlate?: Account | null;
  /**
   * The agency in the trigger's logo slot instead of on a row of its own.
   * Only one of this and `agencyPlate` is ever set. See HEADER_AGENCY_MARKS.
   */
  agencyMark?: Account | null;
  /** Makes the plate a way INTO the agency, not just a label. */
  onSwitchToAgency?: () => void;
  /**
   * The drawer toggle, when the agency row is the one carrying it.
   *
   * Passed as a node rather than a flag because the caller already owns the
   * collapsed state and the handler, and this row has no reason to learn
   * either. See COLLAPSE_SPOTS.
   */
  collapseSlot?: React.ReactNode;
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
  agencyPlate = null,
  agencyMark = null,
  onSwitchToAgency,
  collapseSlot = null,
}: NavHeaderProps) {
  // Read here rather than threaded through LeftNav: these are properties of
  // the PLATE, and nothing between the shell and this row has another reason
  // to know which sample brand is on or how it is aligned.
  const {
    agencyWordmark,
    agencyPlateAlign,
    agencyPlateSize,
    agencyPlateName,
    navIdentityAlign,
  } = useTheme().effective;
  const agencyWordmarkSrc = AGENCY_WORDMARK_SRC[agencyWordmark];
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
      {/*
        The agency, above the account — the rail's own order, kept.

        A button rather than a label because an identity you cannot act on is
        the thing that started this: a control that looks live and does
        nothing reads as broken. It goes where the rail's agency plate went,
        so the gesture is the same one — press the agency, land at agency
        scope — and the row below stays the account switcher it already was.

        `-mb-[4px]` against the column's 10px gap: the plate and the trigger
        are one identity block, not two rows of the header, and at a full 10
        they read as unrelated.

        No rule under it. A divider here drew a line across the nav four
        pixels below a 26px row, which cut the identity block in half to
        separate two things that belong together — the agency and the account
        you are in under it. The size and ink difference already says which is
        which. Ashwin, Oct 14.
      */}
      {agencyPlate ? (
        <div className="relative -mb-[4px] flex w-full items-center gap-[6px]">
          <div
            className={cn(
              "flex min-w-0 flex-1",
              /*
                The artwork either joins the column everything below starts
                on, or owns the full width as a masthead. See
                AGENCY_PLATE_ALIGNS.

                Centred means centred on the COLUMN, not on whatever is left
                over after the collapse toggle has taken its 28px. The first
                attempt let the toggle eat flex space, which put the logo
                34px left of true centre whenever it was in this row —
                measurably off, and Ashwin read it as off before anyone
                measured it. A control parked on one edge must not move what
                is centred between both.

                So the toggle leaves the flow (absolute, below) and this
                container reserves the SAME room on each side instead. The
                reserve is symmetric, so the midpoint it centres on is the
                row's own, and the logo still cannot run under the toggle.
              */
              agencyPlateAlign === "center"
                ? cn("justify-center", collapseSlot ? "px-[34px]" : null)
                : "justify-start",
            )}
          >
          <button
            type="button"
            onClick={onSwitchToAgency}
            aria-label={`${agencyPlate.name} — agency, all accounts`}
            className={cn(
              "motion-tap flex min-w-0 items-center rounded-[7px] hover:bg-nav-hover active:scale-[0.98]",
              /*
                Left-aligned means aligned with the ROWS, not with the header's
                own edge.

                The rows below sit in a box 10px from the nav's left, and
                this button's box now starts there too — `-ml-[2px]` against
                the header's 12px gutter — so the two share an edge.

                No padding inside it, which is the part that took two passes.
                Matching the rows' inner 8px as well put the mark at 18, level
                with the product glyphs, and that is right for a DISC: a 20px
                circle with its own even margins. It is wrong for a wordmark,
                because an uploaded lockup carries its own whitespace inside
                the artwork — so 8px of ours on top read as the logo sitting
                further in than everything under it, which is what Ashwin saw.
                The artwork's own left edge is the thing to align, so the box
                hugs it. Oct 14.

                Centred keeps the symmetric inset it had: there is nothing to
                line up with, and uneven margins would shift the midpoint the
                alignment is measured against.
              */
              agencyPlateAlign === "center"
                ? "-mx-[4px] max-w-[calc(100%+8px)] px-[4px]"
                : "-ml-[2px] -mr-[4px] max-w-[calc(100%+6px)] pr-[4px]",
            )}
          >
            {/*
              The agency's artwork, and nothing else.

              No name beside it: these lockups already contain the agency's
              name — that is what a wordmark IS — so setting it again in text
              is the same mistake BrandMark's own wide-logo rung exists to
              avoid, one level up. Ashwin, Oct 14.

              Height-bound with the width free, exactly as the account
              wordmark below it — the height is the slider's, see
              AGENCY_PLATE_SIZE_DEFAULT: these assets are drawn at wildly different
              aspect ratios and constraining the height is what keeps a tall
              illustrative mark and a flat typographic one at the same visual
              weight in the column.
            */}
            {agencyWordmarkSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={agencyWordmarkSrc}
                alt={agencyPlate.name}
                style={{ height: agencyPlateSize }}
                className="w-auto max-w-[200px] object-contain object-left"
              />
            ) : (
              /*
                No uploaded lockup: the agency's own mark and name, the way
                the rail's plate states it. This is the state every agency is
                in before it brands anything, so it is the one the row has to
                look right in first.
              */
              <span
                style={{ height: agencyPlateSize }}
                className="flex min-w-0 items-center gap-[7px]"
              >
                {/*
                  The mark follows the slider, the NAME does not. Scaling type
                  with artwork is how a 56px lockup ends up with a 30px agency
                  name shouting over the account below it — the row is the
                  agency's logo at whatever size suits it, plus a label.
                */}
                <AccountLogo
                  logo={agencyPlate.logo}
                  size={Math.round(agencyPlateSize * 0.62)}
                  radius={999}
                />
                {agencyPlateName ? (
                  <span className="min-w-0 truncate text-[13px] leading-[18px] font-medium text-nav-fg-muted">
                    {agencyPlate.name}
                  </span>
                ) : null}
              </span>
            )}
            </button>
          </div>
          {collapseSlot ? (
            <div
              className={
                agencyPlateAlign === "center"
                  ? "absolute top-1/2 right-0 -translate-y-1/2"
                  : "contents"
              }
            >
              {collapseSlot}
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="relative flex w-full items-center gap-[6px]">
        <div
          className={cn(
            "flex min-w-0 flex-1 items-center",
            /*
              Centred on the column by the same reserve the plate uses — see
              NAV_IDENTITY_ALIGNS. `trailing` is the collapse toggle when it
              is in this row, and it leaves the flow below so it cannot drag
              the midpoint with it.
            */
            navIdentityAlign === "center"
              ? cn("justify-center", trailing ? "px-[34px]" : null)
              : // Spread needs the full width to divide; the trigger does its
                // own distributing inside it. See NAV_IDENTITY_ALIGNS.
                null,
          )}
        >
          {canSwitch ? (
            <WorkspaceTrigger
              account={account}
              logoSrc={logoSrc}
              logoAlt={logoAlt}
              open={switcherOpen}
              onToggle={onToggleSwitcher}
              agency={agency}
              mark={mark}
              markAccount={agencyMark}
              spread={navIdentityAlign === "between"}
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

        {trailing ? (
          <div
            className={
              navIdentityAlign === "center"
                ? "absolute top-1/2 right-0 -translate-y-1/2 flex items-center gap-[6px]"
                : "contents"
            }
          >
            {trailing}
          </div>
        ) : null}
      </div>
    </div>
  );
}
