"use client";

import * as React from "react";
import { Grip, X } from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import type { Account } from "./accounts-data";
import { RailTooltip } from "@/components/nav/rail-tooltip";
import { RailDirectory } from "./rail-switcher";
import type { AccountsSession } from "./use-accounts";

/** The rail's widths — the shell adds the live one to panel offsets. */
export const ACCOUNT_RAIL_WIDTH = 56;
export const ACCOUNT_RAIL_EXPANDED_WIDTH = 216;
/** The width the strip grows to when it becomes the accounts directory. */
export const ACCOUNT_RAIL_DIRECTORY_WIDTH = 340;

interface AccountRailProps {
  session: AccountsSession;
  theme: SurfaceTheme;
  /** Expanded shows full account names — for the logos that don't earn recognition. */
  expanded: boolean;
  /** Owned by the shell — panel offsets follow the live width. */
  onExpandedChange: (expanded: boolean) => void;
  /** Whether the strip has morphed into the accounts directory. */
  switcherOpen: boolean;
  /** Mount/phase from the shell's exit transition — content outlives the flag. */
  switcherMounted: boolean;
  switcherPhase: TransitionPhase;
  onToggleSwitcher: () => void;
  onCloseSwitcher: () => void;
}

/**
 * Hover intent for the auto-expanding rail. Entering waits a beat so a
 * pointer crossing the strip on its way to the nav doesn't pop the names
 * open; leaving waits a little longer so a brief overshoot doesn't slam
 * them shut.
 */
const EXPAND_DELAY_MS = 150;
const COLLAPSE_DELAY_MS = 250;

/**
 * Model C: the account rail.
 *
 * The agency is not a mode — it is the first row, sitting on its own neutral
 * plate. The plate is the whole differentiator: no AGENCY label (cramped,
 * and redundant next to a name like "Johnson Agency"), and no shape tricks —
 * per the Aug 7 review, a zone survives even the case where a sub-account
 * carries the agency's own name, because it isn't a string.
 *
 * The rail expands to show full names: many real tenant logos are too poor
 * to be recognisable at 28px, so readable names are one toggle away. The
 * active account is a filled row plus the edge bar — the earlier ring read
 * as too subtle in review.
 *
 * Clicking the waffle MORPHS the strip into the directory (Aug 13 ask):
 * the same overlay widens to panel width and swaps its tiles for the
 * search-and-pin list, instead of docking a second surface beside itself.
 */
export function AccountRail({
  session,
  theme,
  expanded,
  onExpandedChange,
  switcherOpen,
  switcherMounted,
  switcherPhase,
  onToggleSwitcher,
  onCloseSwitcher,
}: AccountRailProps) {
  const railAccounts = session.railIds
    .map((id) => session.accounts.find((a) => a.id === id))
    .filter((a): a is Account => a !== undefined);

  // No expand/collapse control anymore (Aug 11 ask): the rail widens itself
  // under the pointer and narrows when it leaves — GoCollab's browse pattern.
  const hoverTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const setHover = React.useCallback(
    (next: boolean) => {
      if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(
        () => {
          hoverTimer.current = null;
          onExpandedChange(next);
        },
        next ? EXPAND_DELAY_MS : COLLAPSE_DELAY_MS,
      );
    },
    [onExpandedChange],
  );
  React.useEffect(() => {
    return () => {
      if (hoverTimer.current !== null) clearTimeout(hoverTimer.current);
    };
  }, []);

  const width = switcherOpen
    ? ACCOUNT_RAIL_DIRECTORY_WIDTH
    : expanded
      ? ACCOUNT_RAIL_EXPANDED_WIDTH
      : ACCOUNT_RAIL_WIDTH;

  return (
    <>
      {/* Click-away while morphed — the directory is a modal choice. */}
      {switcherMounted ? (
        <button
          type="button"
          aria-label="Close accounts directory"
          tabIndex={-1}
          onClick={onCloseSwitcher}
          className="absolute inset-0 z-30 cursor-default"
        />
      ) : null}

      <nav
        data-nav-theme={theme}
        aria-label="Accounts"
        data-cursor="menu"
        onPointerLeave={() => setHover(false)}
        // An overlay, not a flow column: the shell holds a fixed 56px slot and
        // this widens OVER the nav — the page never moves under the pointer.
        // Expansion is triggered from the account tiles themselves: resting on
        // an account is when its name matters. The waffle stays a plain click
        // target for the directory.
        className={cn(
          // pt 4: the agency plate is 40px tall (4 + 32 + 4 with the 24px
          // logo), so 4px above centres its tile on y=24 — the header's midline.
          "motion-move absolute inset-y-0 left-0 z-30 flex flex-col gap-[7px] overflow-hidden bg-nav-rail pt-[4px] pb-[8px]",
          expanded || switcherOpen
            ? "shadow-[inset_-1px_0_0_0_var(--nav-border),16px_0_40px_-20px_rgba(15,23,42,0.45)]"
            : "shadow-[inset_-1px_0_0_0_var(--nav-border)]",
        )}
        style={{ width }}
      >
        {switcherMounted ? (
          /*
            The morphed face. Fixed at directory width inside the animating
            frame, so the rows never squish while the strip is still growing
            or already shrinking — the nav's overflow-hidden does the reveal.
          */
          <div
            role="dialog"
            aria-label="Accounts"
            style={{ width: ACCOUNT_RAIL_DIRECTORY_WIDTH }}
            className={cn(
              "flex min-h-0 flex-1 flex-col",
              switcherPhase === "entering" ? "motion-menu-in" : "motion-menu-out",
            )}
          >
            {/*
              The panel header: title and close only. The waffle glyph is
              gone (Aug 13 ask) — once the strip has morphed, the title
              carries the identity and the icon just repeated it.
            */}
            {/* 44px under the rail's 2px top pad — centred on y=24 like the header. */}
            <div className="flex h-[44px] shrink-0 items-center gap-[9px] px-[12px]">
              <span className="min-w-0 flex-1 truncate text-[13.5px] leading-[18px] font-semibold text-nav-fg">
                All accounts
              </span>
              <button
                type="button"
                aria-label="Close accounts directory"
                onClick={onCloseSwitcher}
                className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>

            <RailDirectory session={session} onClose={onCloseSwitcher} />
          </div>
        ) : (
          <>
            {/*
              The agency zone: a neutral plate the agency row sits on, ending at
              nothing — the plate's own edge is the boundary. Same tile shape as
              every account below it.
            */}
            <div className="mx-[6px] shrink-0 rounded-[10px] bg-nav-rail-disc p-[4px]">
              {/*
                The strip wears the PLATFORM's mark, not the agency's (Aug 13
                ask): the rail is HighLevel-owned chrome that holds every
                tenant, so its top tile says whose product this is — the nav
                beside it keeps the agency's own brand.
              */}
              <RailRow
                label={`${session.agency.name} — agency`}
                name={session.agency.name}
                expanded={expanded}
                selected={session.scope === "agency"}
                onClick={session.switchToAgency}
                onHover={() => setHover(true)}
                account={{ ...session.agency, logoSrc: "/hl-logo.png" }}
                // Rounded square, not the tenant circle: platform mark ≠ account.
                logoRadius={9}
              />
            </div>

            {/*
              Uncapped, so the open set scrolls rather than clipping. The agency
              plate above stays put — the fixed point.

              "All accounts" rides at the tail of the list rather than the footer:
              it is the directory the list is a slice of, so it belongs with the
              accounts — the footer is rail chrome, and putting an account action
              down there read as chrome. The waffle, not a +: the panel behind it
              is every account you have, so the icon should say "browse", not
              "create".
            */}
            <div className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto px-[6px] py-[2px] [scrollbar-width:none]">
              {/*
                Auto margins, not justify-center: the tiles sit in the strip's
                vertical centre (the agency plate alone holds the top), and when
                the list outgrows the strip the margins collapse to zero so
                everything stays scrollable — justify-center would clip the top.

                pb 43: the scroll area starts BELOW the agency block (4px pad
                + 40px plate + 7px gap = 51) but ends 8px above the strip's
                foot, so its own centre sits (51-8)/2 = 21.5px below the
                strip's. The padding makes the wrapper that much taller under
                the tiles, lifting the visible group onto the TRUE centre.
              */}
              <div className="my-auto flex w-full flex-col gap-[4px] pb-[43px]">
                {railAccounts.map((account) => (
                  <RailRow
                    key={account.id}
                    label={account.name}
                    name={account.name}
                    expanded={expanded}
                    selected={session.scope === "account" && account.id === session.current.id}
                    onClick={() => session.switchTo(account.id)}
                    onHover={() => setHover(true)}
                    account={account}
                  />
                ))}

                <Tooltipped label="All accounts" show={!expanded}>
                  <button
                    type="button"
                    aria-label="All accounts"
                    aria-haspopup="dialog"
                    aria-expanded={switcherOpen}
                    onClick={onToggleSwitcher}
                    className={cn(
                      "motion-tap flex h-[36px] w-full shrink-0 items-center gap-[9px] rounded-[9px] p-[4px] text-nav-fg-subtle",
                      !expanded && "justify-center",
                      "hover:bg-nav-hover hover:text-nav-fg-muted",
                    )}
                  >
                    {/* A 24px stage, so the glyph centres exactly under the logos above. */}
                    <span className="flex size-[24px] shrink-0 items-center justify-center">
                      <Grip size={16} aria-hidden="true" />
                    </span>
                    {expanded ? (
                      <span className="truncate text-[12.5px] leading-none font-medium">
                        All accounts
                      </span>
                    ) : null}
                  </button>
                </Tooltipped>
              </div>
            </div>
          </>
        )}
      </nav>
    </>
  );
}

/**
 * One account row. Active is a filled row plus the edge bar — said twice, in
 * fill and in position, without ever repainting the tenant's logo. Expanded,
 * the name rides along and the fill gets a whole row to work with.
 */
function RailRow({
  label,
  name,
  expanded,
  selected,
  onClick,
  onHover,
  account,
  logoRadius = 999,
}: {
  label: string;
  name: string;
  expanded: boolean;
  selected: boolean;
  onClick: () => void;
  /** Resting on a tile is what opens the names out. */
  onHover?: () => void;
  account: Account;
  /** Tenant tiles are discs; the platform mark wears a rounded square. */
  logoRadius?: number;
}) {
  return (
    <div className="relative w-full shrink-0">
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1/2 -left-[6px] w-[3px] -translate-y-1/2 rounded-r-[2px] bg-nav-fg motion-move",
          selected ? "h-[24px] opacity-100" : "h-[8px] opacity-0",
        )}
      />
      <Tooltipped label={label} show={!expanded}>
        <button
          type="button"
          aria-label={label}
          aria-current={selected ? "page" : undefined}
          onPointerEnter={onHover}
          onClick={onClick}
          className={cn(
            "motion-tap flex w-full items-center gap-[9px] rounded-[9px] p-[4px] outline-none focus-visible:ring-[1.5px] focus-visible:ring-brand",
            !expanded && "justify-center",
            selected ? "bg-nav shadow-[0_1px_2px_0_rgba(15,23,42,0.08),inset_0_0_0_1px_var(--nav-border)]" : "hover:bg-nav-hover",
          )}
        >
          {/* 24, not 28 (Aug 13): the tenant tiles read oversized in the strip. */}
          <AccountLogo logo={account.logo} src={account.logoSrc} size={24} radius={logoRadius} />
          {expanded ? (
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-left text-[13px] leading-[17px]",
                selected ? "font-semibold text-nav-fg" : "font-medium text-nav-fg-muted",
              )}
            >
              {name}
            </span>
          ) : null}
        </button>
      </Tooltipped>
    </div>
  );
}

/** Tooltip only while collapsed — expanded rows carry their own names. */
function Tooltipped({
  label,
  show,
  children,
}: {
  label: string;
  show: boolean;
  children: React.ReactNode;
}) {
  return show ? <RailTooltip label={label}>{children}</RailTooltip> : <>{children}</>;
}
