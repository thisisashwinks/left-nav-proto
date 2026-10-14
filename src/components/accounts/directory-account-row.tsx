"use client";

import { Pin } from "lucide-react";
import { usePinnedInk } from "@/components/nav/pin-button";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { AccountLogo } from "./account-logo";
import { SelectBox } from "./select-box";
import type { Account } from "./accounts-data";

/**
 * One sub-account, in whichever panel is listing them.
 *
 * This is the directory's row, lifted out of RailDirectory so the header
 * dropdown can use it too. The two panels are arrangements of ONE list — the
 * same forty accounts, the same ticking, the same pin — and they had drifted
 * into two row components with two mark sizes, two name sizes and two ideas
 * of where a checkbox sits. Select mode made the drift impossible to ignore:
 * the same gesture produced visibly different rows depending on which surface
 * you started from. Ashwin, Oct 14: reuse this, do not reinvent it.
 *
 * What genuinely differs between the panels is injected rather than branched
 * on, because the differences are real and neither is a special case:
 *
 *   - the JUMP. The directory adds the account to the rail on the way in (you
 *     are working in it now, so it has earned a tile); the dropdown just
 *     switches. `onSelect` carries that.
 *   - the PIN. The directory's pin is rail membership; the dropdown's is the
 *     session's pinned set. Same glyph, same treatment, different store, so
 *     both arrive as `pinned` + `onTogglePinned`.
 *   - the keyboard CURSOR. Only the dropdown has one — it is a combobox with
 *     ↑↓↵ — so `active`/`onActivate`/`index` are optional and the directory
 *     simply omits them.
 */
export function DirectoryAccountRow({
  account,
  current,
  picking = false,
  selectRows = false,
  ticked = false,
  onToggle,
  onSelect,
  showPin = true,
  pinned = false,
  onTogglePinned,
  index,
  active = false,
  onActivate,
  label,
  showLogo = true,
  trailing = null,
}: {
  account: Account;
  /** The account this session is in — wears the nav's selected-row treatment. */
  current: boolean;
  picking?: boolean;
  /** The row itself ticks rather than jumping. See the note on the button. */
  selectRows?: boolean;
  ticked?: boolean;
  onToggle?: () => void;
  /** What pressing the row does when it is not ticking. */
  onSelect: () => void;
  /** Off while a guided selection is in progress — see the pin's own note. */
  showPin?: boolean;
  /** Optional: a row with `showPin` off — the agency entry — pins nothing. */
  pinned?: boolean;
  onTogglePinned?: () => void;
  /** Position in the flat list, for the entrance stagger. Dropdown only. */
  index?: number;
  /** Highlighted by the keyboard or the pointer — one highlight, either source. */
  active?: boolean;
  onActivate?: () => void;
  /**
   * Shown instead of the account's name.
   *
   * For the agency entry, which is a row in this list but not an account —
   * under AGENCY_ENTRIES it reads as an action rather than a place. Using
   * this row rather than a lookalike is what keeps the two the same height,
   * the same inset and the same hover, which is the whole reason a reader
   * can run down the column without re-reading it.
   */
  label?: string;
  /** False for an entry with no artwork to show. See AGENCY_ENTRIES. */
  showLogo?: boolean;
  /** Takes the pin's place — the agency entry states its action here. */
  trailing?: React.ReactNode;
}) {
  /*
    The same ink a set pin wears in the nav, through the same axis — a pinned
    account and a pinned product are one gesture, and a mark that is grey in
    one list and branded in the other would be two.
  */
  const pinnedInk = usePinnedInk();
  // See ACCOUNT_ROW_META_DEFAULT. Read here rather than threaded from the
  // panel: the axis is a property of the ROW, and the panel has no other
  // reason to know about it.
  const { accountRowMeta } = useTheme().effective;

  return (
    <div
      data-active={active || undefined}
      {...(onActivate ? { onPointerEnter: onActivate } : {})}
      {...(index === undefined
        ? {}
        : { style: { "--row-index": index } as React.CSSProperties })}
      className={cn(
        "group/row flex w-full items-center gap-[10px] rounded-[8px] px-[7px] py-[6px]",
        index === undefined ? null : "motion-row-in",
        /*
          The current account wears the NAV's selected row, exactly.

          It used to be a flat `bg-nav-active` plus a "Current" pill — the pill
          because, as the note here said, the tint alone failed a review. That
          review was looking at the tint alone; the selected row has since
          grown an edge and a lift, and the same three tokens that mark "the
          page you are on" mark "the account you are in" without a word. They
          are the same claim about the same reader, and two different-looking
          answers to it is how a shell ends up with two vocabularies.

          It follows the two row-state switches with it — see
          NAV_ROW_RING_DEFAULT and NAV_ROW_SHADOW_DEFAULT. Off the plane both
          resolve to nothing and this is the flat tint it always was.

          A TICKED row keeps the plain fill: that is a selection, which is
          about what an action will reach, and borrowing the "you are here"
          treatment for it would say the wrong thing on every row a reader
          ticks.
        */
        ticked
          ? "bg-nav-active"
          : current
            ? "bg-nav-selected shadow-[inset_0_0_0_1px_var(--nav-selected-ring),var(--nav-selected-shadow)]"
            : cn(
                "hover:bg-nav-hover hover:shadow-[inset_0_0_0_1px_var(--nav-hover-ring)]",
                // The keyboard cursor borrows the hover fill, so one highlight
                // serves both sources rather than two competing on one row.
                "data-active:bg-nav-hover",
              ),
      )}
    >
      {picking ? (
        <SelectBox
          checked={ticked}
          onClick={() => onToggle?.()}
          label={`Select ${account.name}`}
        />
      ) : null}
      {/*
        What the row means depends on whether a mode is running.

        Under `always` the checkbox is a separate target and the row is still
        the jump, ticked or not — a panel whose rows mean "go" until you tick
        something and then mean "tick" is how you land in the wrong account
        halfway through choosing four.

        Under `button` that ambiguity cannot arise, because the mode is
        declared before any of it: you pressed Select, so every row ticks and
        nothing jumps until you Cancel. That is the whole reason the iOS
        pattern works, and taking the mode without taking this would be the
        worst of both — a button announcing a mode that the rows then do not
        honour. Ashwin, Oct 5.
      */}
      <button
        type="button"
        onClick={() => (selectRows ? onToggle?.() : onSelect())}
        {...(onActivate ? { onFocus: onActivate } : {})}
        aria-current={current ? "true" : undefined}
        className="flex min-w-0 flex-1 items-center gap-[10px] text-left outline-none"
      >
        {/*
          One step down across the row (Aug 28): 24px mark, 13px name, 11px
          address. The panel is a LIST — forty rows you scan for a name — and
          at 28/13.5 it was drawn at the weight of the strip it replaces, where
          there are eleven tiles and no words at all. Smaller fits more of the
          directory on screen without the rows losing their hierarchy.
        */}
        {showLogo ? (
          <AccountLogo logo={account.logo} src={account.logoSrc} size={24} radius={999} />
        ) : null}
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] leading-[17px] font-medium text-nav-fg">
            {label ?? account.name}
          </span>
          {/* Off by default — see ACCOUNT_ROW_META_DEFAULT. */}
          {accountRowMeta ? (
            <span className="truncate text-[11px] leading-[14px] text-nav-fg-subtle">
              {account.meta}
            </span>
          ) : null}
        </span>
      </button>
      {trailing}
      {showPin ? (
        /*
          The nav's pin, on an account row — see PinButton, which this
          deliberately mirrors rather than imports (that one pins a PRODUCT
          through the nav layout store; this pins an account through the
          session).

          Two things changed here (Sep 16). The state is now in the GLYPH
          rather than in which glyph: a filled pin is pinned, an outline pin is
          not, the way the pin reads everywhere else in the nav. Pin/PinOff put
          the state in a diagonal slash that is 13px wide and easy to miss, and
          worse, showed every row the icon for what pressing it would DO — so a
          column of pinned accounts wore "unpin" marks and read as the unpinned
          ones.

          And an unpinned row only shows it on hover. Drawn at rest on every
          row, forty identical outlined boxes ran down the panel as a second
          column competing with the logos — which made the four that mattered
          impossible to pick out. Pinned stays visible, because that one is not
          an affordance, it is the row telling you what it is.
        */
        <button
          type="button"
          aria-label={pinned ? `Unpin ${account.name}` : `Pin ${account.name}`}
          aria-pressed={pinned}
          title={pinned ? "Unpin" : "Pin"}
          onClick={() => onTogglePinned?.()}
          className={cn(
            "motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px]",
            "hover:bg-nav-active active:scale-90 motion-press",
            pinned
              ? cn(pinnedInk, "opacity-100")
              : "text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 hover:text-nav-fg focus-visible:opacity-100",
          )}
        >
          <Pin
            /*
              12, matching the pin on a pinned row in the nav — see
              merged-recents, which made the same cut for the same reason. A
              trailing mark that approaches the size of the row's LEADING glyph
              reads as a second icon rather than as a state, and here the
              leading glyph is a 24px account tile. One pin, one size, wherever
              a row carries one.
            */
            size={12}
            fill={pinned ? "currentColor" : "none"}
            aria-hidden="true"
          />
        </button>
      ) : null}
    </div>
  );
}
