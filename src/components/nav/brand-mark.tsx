import * as React from "react";
import { AccountLogo } from "@/components/accounts/account-logo";
import { cn } from "@/lib/utils";
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
  /**
   * Draw THIS identity's logo instead of the account's, keeping the account's
   * name beside it.
   *
   * The agency, when the header is asked to carry it in the trigger rather
   * than on a row of its own — see HEADER_AGENCY_MARKS. It also forces the
   * square-mark rung: the wordmark rung draws a logo that already contains a
   * name, and that name would be the wrong one.
   */
  markAccount?: Account | null;
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
/**
 * A full logo in the nav row, sized by visual weight rather than a fixed
 * height (Nov 23).
 *
 * A fixed 22px height makes a very wide logo long and thin and a compact one
 * a postage stamp. Holding the AREA roughly constant instead — height =
 * sqrt(area / aspect), clamped to the row — gives every logo about the same
 * presence: wide ones a little shorter, squarer ones a little taller, never
 * past the 30px row or the width cap. Pairs with trimLogo, which removes
 * the empty margin that made uploads read small in the first place.
 */
export function Wordmark({
  src,
  alt,
  maxWidth = 168,
  className,
}: {
  src: string;
  alt: string;
  maxWidth?: number;
  className?: string;
}) {
  const [aspect, setAspect] = React.useState<number | null>(null);
  const height = aspect ? Math.round(Math.min(28, Math.max(16, Math.sqrt(2600 / aspect)))) : 22;
  return (
    <img
      src={src}
      alt={alt}
      onLoad={(e) => {
        const i = e.currentTarget;
        if (i.naturalWidth && i.naturalHeight) setAspect(i.naturalWidth / i.naturalHeight);
      }}
      style={{ height, maxWidth }}
      className={cn("w-auto object-contain object-left", className)}
    />
  );
}

export function BrandMark({
  account,
  logoSrc,
  alt,
  withMark = true,
  markAccount = null,
}: BrandMarkProps) {
  // `logoSrc` from the nav config pins the header to one asset for a demo, so
  // it outranks the account's own pair — including the wordmark.
  const wordmark = logoSrc ? undefined : account.wordmarkSrc;

  // The agency's full logo replaces its NAME, with or without the square
  // mark beside it (Nov 20). Sub-accounts keep their name as text for now
  // (Ashwin, Nov 23) unless the header shows its mark.
  if (wordmark && !markAccount && (withMark || account.id === "agency" || account.wordmarkUploaded)) {
    return (
      <span className="flex min-w-0 items-center" title={alt}>
        {/*
          Height-bound, width free: these are 350×180 in production but nobody
          crops to exactly that, so constraining the height and letting the
          width follow is what keeps a tall logo and a wide one the same
          visual weight in the row.
        */}
        <Wordmark src={wordmark} alt={account.name} />
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-[7px]" title={alt}>
      {withMark ? (
        markAccount ? (
          // The agency's own mark, and never the config's demo override —
          // that asset stands in for the ACCOUNT's logo.
          <AccountLogo
            logo={markAccount.logo}
            src={markAccount.logoSrc}
            size={20}
            radius={999}
          />
        ) : (
          <AccountLogo
            logo={account.logo}
            src={logoSrc ?? account.logoSrc}
            size={20}
            radius={999}
          />
        )
      ) : null}
      <span className="truncate text-[14px] leading-[20px] font-semibold text-nav-fg">
        {account.name}
      </span>
    </span>
  );
}
