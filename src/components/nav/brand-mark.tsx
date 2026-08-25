import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";

interface BrandMarkProps {
  account: Account;
  /**
   * A logo set on the nav config, which overrides the account's own. Lets a demo
   * point the header at one fixed asset regardless of which account is current.
   */
  logoSrc?: string;
  alt: string;
  /**
   * False when the caller draws the mark itself — the split header makes the
   * logo its own collapse button and this then renders only the name.
   */
  withMark?: boolean;
}

/**
 * The account's identity in the nav header.
 *
 * Three rungs, in order (Aug 25). Production asks agencies for two assets — a
 * wide 350×180 logo and a square one — and which appears is decided by what
 * they actually uploaded, not by a setting. A picker here would be a question
 * with an obvious answer, and a wrong answer available.
 *
 *   1. Wide logo   drawn on its own, no name beside it. The artwork already
 *                  contains the name; setting it twice is the mistake this
 *                  rung exists to avoid.
 *   2. Square mark plus the account name as text. What most accounts have.
 *   3. Neither     the drawn initials tile, plus the name. `account-logo.tsx`
 *                  already owns this fallback, so it needs nothing here.
 *
 * The collapsed rail never reaches rung 1: at 26px a wordmark is illegible, so
 * it always takes the square mark or the initials.
 *
 * The Pencil file gives this a fixed 116px box, which left the switcher chevron
 * stranded ~90px from the end of a short name. It hugs its content instead, so
 * the chevron lands directly beside the name whatever the name's length; long
 * names truncate rather than pushing the header's search button off the edge.
 */
export function BrandMark({
  account,
  logoSrc,
  alt,
  withMark = true,
}: BrandMarkProps) {
  // `logoSrc` from the nav config pins the header to one asset for a demo, so
  // it outranks the account's own pair — including the wordmark.
  const wordmark = logoSrc ? undefined : account.wordmarkSrc;

  if (wordmark && withMark) {
    return (
      <span className="flex min-w-0 items-center" title={alt}>
        {/*
          Height-bound, width free: these are 350×180 in production but nobody
          crops to exactly that, so constraining the height and letting the
          width follow is what keeps a tall logo and a wide one the same
          visual weight in the row.
        */}
        <img
          src={wordmark}
          alt={account.name}
          className="h-[22px] w-auto max-w-[168px] object-contain object-left"
        />
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-[7px]" title={alt}>
      {withMark ? (
        <AccountLogo
          logo={account.logo}
          src={logoSrc ?? account.logoSrc}
          size={20}
          radius={999}
        />
      ) : null}
      <span className="truncate text-[14px] leading-[20px] font-semibold text-nav-fg">
        {account.name}
      </span>
    </span>
  );
}
