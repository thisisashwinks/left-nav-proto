"use client";

import * as React from "react";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import type { Account } from "./accounts-data";

interface AccountRowProps {
  account: Account;
  /** Position in the flat list. Drives the entrance stagger. */
  index: number;
  /** Highlighted by the keyboard or the pointer — one highlight, either source. */
  active: boolean;
  current: boolean;
  favorite: boolean;
  onActivate: () => void;
  onSelect: () => void;
  onToggleFavorite: () => void;
}

/**
 * One sub-account.
 *
 * A wrapper div holds the hover surface with the row button and the favourite
 * toggle as siblings inside it — nesting the toggle inside the row button would
 * be invalid HTML, and putting the hover state on the row button alone would
 * drop it whenever the pointer crossed onto the star.
 */
export function AccountRow({
  account,
  index,
  active,
  current,
  favorite,
  onActivate,
  onSelect,
  onToggleFavorite,
}: AccountRowProps) {
  // Replays the pop on every toggle. A CSS transition can't express it, and an
  // always-on class would fire once on mount and never again.
  const [popping, setPopping] = React.useState(false);

  return (
    <div
      data-active={active || undefined}
      onPointerEnter={onActivate}
      style={{ "--row-index": index } as React.CSSProperties}
      className="motion-row-in motion-tap group/row relative w-full rounded-[8px] data-active:bg-nav-hover"
    >
      <button
        type="button"
        onClick={onSelect}
        onFocus={onActivate}
        aria-current={current ? "true" : undefined}
        className="flex w-full items-center gap-[10px] rounded-[8px] py-[7px] pr-[34px] pl-[7px] text-left outline-none focus-visible:ring-[1.5px] focus-visible:ring-brand"
      >
        {/*
          The logo grows a hair on row hover. It is the only thing in the row
          that moves, which is enough to say "this row" without a border or a
          colour change fighting the mark's own palette.
        */}
        <AccountLogo
          logo={account.logo}
          src={account.logoSrc}
          size={28}
          radius={8}
          className="motion-tap group-hover/row:scale-[1.06]"
        />

        <span className="flex min-w-0 flex-1 flex-col items-start gap-[1px]">
          <span className="flex w-full min-w-0 items-center gap-[6px]">
            <span className="truncate text-[13.5px] leading-[18px] font-medium text-nav-fg">
              {account.name}
            </span>
            {current ? (
              <Check
                size={13}
                strokeWidth={2.75}
                aria-label="Current account"
                className="shrink-0 text-brand"
              />
            ) : null}
          </span>
          <span className="w-full truncate text-[12px] leading-[16px] text-nav-fg-subtle">
            {account.meta}
          </span>
        </span>
      </button>

      <button
        type="button"
        aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={favorite}
        onClick={() => {
          setPopping(true);
          onToggleFavorite();
        }}
        onAnimationEnd={() => setPopping(false)}
        className={cn(
          "motion-tap absolute top-1/2 right-[6px] flex size-[24px] -translate-y-1/2 items-center justify-center rounded-[6px] outline-none hover:bg-nav-active focus-visible:opacity-100",
          popping && "motion-star-pop",
          // Unfavourited stars stay out of the way until the row is hovered;
          // favourited ones are the group's only marker, so they always show.
          favorite
            ? "text-brand opacity-100"
            : "text-nav-fg-subtle opacity-0 hover:text-nav-fg group-hover/row:opacity-100",
        )}
      >
        <Star size={14} fill={favorite ? "currentColor" : "none"} aria-hidden="true" />
      </button>
    </div>
  );
}
