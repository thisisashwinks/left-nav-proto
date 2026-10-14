"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { cn } from "@/lib/utils";
import { AccountLogo } from "@/components/accounts/account-logo";
import { useTheme } from "@/components/theme/theme-provider";
import { BrandMark } from "./brand-mark";

interface WorkspaceTriggerProps {
  account: Account;
  logoSrc?: string;
  logoAlt: string;
  open: boolean;
  onToggle: () => void;
  /** Agency scope: the marked case — AGENCY eyebrow, squircle, taller chip. */
  agency?: boolean;
  /** Draw this identity's logo in place of the account's. See BrandMark. */
  markAccount?: Account | null;
  /**
   * Break the trigger into three items spread across the full width.
   *
   * See NAV_IDENTITY_ALIGNS. Equal gaps are a property of SIBLINGS under
   * `justify-between` — there is no way to get them while the chevron is
   * nested inside a button that also holds the name, because the space then
   * divides between two boxes rather than three. So this mode lays the mark,
   * the name and the chevron out as peers.
   */
  spread?: boolean;
  /**
   * Collapses the nav in place.
   *
   * When present, the logo mark peels off into its own button wired to this,
   * and only the NAME keeps the switcher. The mark never moves when the nav
   * changes width — unlike the drawer toggle, which travels with the right
   * edge — so it is the one target you can toggle repeatedly without chasing
   * (Khoi, Aug 24). The drawer toggle stays; this is supplemental.
   */
  onToggleCollapsed?: () => void;
  /**
   * False at agency scope when the account rail beside this one is already
   * drawing the same logo. The name stays and the disc goes — including the
   * split collapse button, which IS the disc. See AGENCY_NAV_MARK_DEFAULT.
   */
  mark?: boolean;
}

/**
 * The account name and its switcher affordance, as one target.
 *
 * The chevron used to be a separate always-visible button sitting ~90px past the
 * end of the name. Here the whole chip is the trigger: at rest it is just the
 * logo and the name, and hover or keyboard focus brings up a surface behind the
 * pair and fades the chevron in beside the name. The chevron keeps its space in
 * the layout while hidden, so nothing shifts when it appears.
 */
export function WorkspaceTrigger({
  account,
  logoSrc,
  logoAlt,
  open,
  onToggle,
  agency = false,
  markAccount = null,
  spread = false,
  onToggleCollapsed,
  mark = true,
}: WorkspaceTriggerProps) {
  const { workspaceChevron } = useTheme().effective;
  const ref = React.useRef<HTMLButtonElement>(null);
  const wasOpen = React.useRef(open);

  // Closing the panel returns focus here rather than dropping it on the body,
  // so the keyboard picks up where it left off. Only on the true -> false edge.
  React.useEffect(() => {
    if (wasOpen.current && !open) ref.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const switcherLabel = agency
    ? `Switch workspace. Current scope: ${account.name}, all accounts`
    : `Switch sub-account. Current account: ${account.name}`;

  const trigger = (markInside: boolean, withoutChevron = false) => (
    <button
      ref={ref}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-label={switcherLabel}
      onClick={onToggle}
      className={cn(
        // Negative margin cancels the padding, so the hover surface extends
        // around the logo instead of pushing it in from the nav's 12px edge.
        "group/ws motion-tap flex h-[30px] min-w-0 items-center gap-[5px] rounded-[8px] px-[6px] outline-none active:scale-[0.99]",
        // Flush to the nav's edge whenever nothing precedes the name —
        // whether that is because the mark is inside the chip or because
        // there is no mark at all. The middle value only makes sense with a
        // separate disc sitting 7px to the left of it.
        markInside || !mark ? "-mx-[6px]" : "-my-0 -mr-[6px] -ml-[2px]",
        open
          ? "bg-nav-active"
          : "hover:bg-nav-hover focus-visible:ring-[1.5px] focus-visible:ring-brand",
      )}
    >
      <BrandMark
        account={account}
        logoSrc={logoSrc}
        alt={logoAlt}
        withMark={markInside}
        markAccount={markAccount}
      />

      {withoutChevron ? null : (
      <ChevronsUpDown
        size={14}
        aria-hidden="true"
        className={cn(
          "motion-tap shrink-0",
          /*
            Standing by default — see WORKSPACE_CHEVRONS.

            Open always wins: whatever the axis says at rest, a panel that is
            up gets the full-ink glyph, because that is the state saying "this
            is the thing you opened".
          */
          open || workspaceChevron === "always"
            ? "translate-x-0 opacity-100"
            : cn(
                "-translate-x-[3px] opacity-0",
                "group-hover/ws:translate-x-0 group-hover/ws:opacity-100",
                "group-focus-visible/ws:translate-x-0 group-focus-visible/ws:opacity-100",
              ),
          // Ink is the OPEN question, not the visibility one. A resting
          // chevron that is always on screen would shout at full ink, so it
          // stays subtle until the panel it belongs to is up.
          open ? "text-nav-fg" : "text-nav-fg-subtle",
        )}
      />
      )}
    </button>
  );

  /*
   * The identity stays put; only the affordance travels.
   *
   * See NAV_IDENTITY_ALIGNS. Mark and name keep exactly the arrangement they
   * have in `left` — including the split, where the disc is its own collapse
   * button — and the chevrons are lifted out of the trigger to sit at the
   * column's right edge.
   *
   * The chevron is `aria-hidden` and out of the tab order because it opens
   * the same panel as the name: it is the same control, not a second one, and
   * a keyboard reader should find one way into this menu rather than two at
   * opposite ends of a row.
   */
  if (spread) {
    const split = mark && onToggleCollapsed !== undefined;
    return (
      <span className="flex w-full min-w-0 items-center justify-between gap-[6px]">
        <span className="flex min-w-0 items-center gap-[7px]">
          {split ? (
            <button
              type="button"
              aria-label="Collapse navigation"
              title="Collapse navigation"
              onClick={onToggleCollapsed}
              className="motion-tap -m-[3px] flex shrink-0 items-center justify-center rounded-full p-[3px] outline-none hover:bg-nav-hover focus-visible:ring-[1.5px] focus-visible:ring-brand active:scale-95"
            >
              <AccountLogo
                logo={(markAccount ?? account).logo}
                src={markAccount ? markAccount.logoSrc : (logoSrc ?? account.logoSrc)}
                size={20}
                radius={999}
              />
            </button>
          ) : null}
          {trigger(mark && !split, true)}
        </span>

        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={onToggle}
          className="motion-tap -mr-[4px] flex shrink-0 items-center justify-center rounded-[6px] p-[4px] outline-none hover:bg-nav-hover active:scale-95"
        >
          <ChevronsUpDown
            size={14}
            aria-hidden="true"
            className={cn("shrink-0", open ? "text-nav-fg" : "text-nav-fg-subtle")}
          />
        </button>
      </span>
    );
  }

  if (!onToggleCollapsed) return trigger(mark);
  // No mark means no split: the split exists to give the DISC its own job.
  if (!mark) return trigger(false);

  return (
    <span className="flex min-w-0 items-center gap-[7px]">
      <button
        type="button"
        aria-label="Collapse navigation"
        title="Collapse navigation"
        onClick={onToggleCollapsed}
        className="motion-tap -m-[3px] flex shrink-0 items-center justify-center rounded-full p-[3px] outline-none hover:bg-nav-hover focus-visible:ring-[1.5px] focus-visible:ring-brand active:scale-95"
      >
        {/*
          The agency's mark when one has been placed here, the account's
          otherwise — see HEADER_AGENCY_MARKS.

          The split header draws this disc ITSELF rather than through
          BrandMark, because the disc is a collapse button in its own right
          and BrandMark has no business owning a second job. That is why
          `markAccount` has to be honoured twice: handing it only to BrandMark
          left the "beside the name" placement silently drawing the
          sub-account's logo in every arrangement that splits — which is the
          default one. The config's demo `logoSrc` stands in for the ACCOUNT's
          asset, so an agency placed here outranks it.
        */}
        <AccountLogo
          logo={(markAccount ?? account).logo}
          src={markAccount ? markAccount.logoSrc : (logoSrc ?? account.logoSrc)}
          size={20}
          radius={999}
        />
      </button>
      {trigger(false)}
    </span>
  );
}
