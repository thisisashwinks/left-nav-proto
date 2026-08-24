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
 * The account mark and name.
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
