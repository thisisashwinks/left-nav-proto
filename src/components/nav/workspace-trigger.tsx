"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { cn } from "@/lib/utils";
import { AccountLogo } from "@/components/accounts/account-logo";
import { BrandMark } from "./brand-mark";

interface WorkspaceTriggerProps {
  account: Account;
  logoSrc?: string;
  logoAlt: string;
  open: boolean;
  onToggle: () => void;
  /** Agency scope: the marked case — AGENCY eyebrow, squircle, taller chip. */
  agency?: boolean;
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
  onToggleCollapsed,
}: WorkspaceTriggerProps) {
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

  const trigger = (markInside: boolean) => (
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
        markInside ? "-mx-[6px]" : "-my-0 -mr-[6px] -ml-[2px]",
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
      />

      <ChevronsUpDown
        size={14}
        aria-hidden="true"
        className={cn(
          "motion-tap shrink-0",
          open
            ? "translate-x-0 text-nav-fg opacity-100"
            : cn(
                "-translate-x-[3px] text-nav-fg-subtle opacity-0",
                "group-hover/ws:translate-x-0 group-hover/ws:opacity-100",
                "group-focus-visible/ws:translate-x-0 group-focus-visible/ws:opacity-100",
              ),
        )}
      />
    </button>
  );

  if (!onToggleCollapsed) return trigger(true);

  return (
    <span className="flex min-w-0 items-center gap-[7px]">
      <button
        type="button"
        aria-label="Collapse navigation"
        title="Collapse navigation"
        onClick={onToggleCollapsed}
        className="motion-tap -m-[3px] flex shrink-0 items-center justify-center rounded-full p-[3px] outline-none hover:bg-nav-hover focus-visible:ring-[1.5px] focus-visible:ring-brand active:scale-95"
      >
        <AccountLogo
          logo={account.logo}
          src={logoSrc ?? account.logoSrc}
          size={20}
          radius={999}
        />
      </button>
      {trigger(false)}
    </span>
  );
}
