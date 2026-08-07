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
   * The agency treatment from the round-2 board: a small AGENCY word above the
   * name, and a squircle mark where accounts get a circle. Shape and one word
   * carry the scope — never colour, and never anything on the account side.
   */
  agency?: boolean;
}

/**
 * The account mark and name.
 *
 * The Pencil file gives this a fixed 116px box, which left the switcher chevron
 * stranded ~90px from the end of a short name. It hugs its content instead, so
 * the chevron lands directly beside the name whatever the name's length; long
 * names truncate rather than pushing the header's search button off the edge.
 */
export function BrandMark({ account, logoSrc, alt, agency = false }: BrandMarkProps) {
  return (
    <span className="flex min-w-0 items-center gap-[7px]" title={alt}>
      <AccountLogo
        logo={account.logo}
        src={logoSrc ?? account.logoSrc}
        size={agency ? 22 : 20}
        radius={agency ? 7 : 999}
      />
      {agency ? (
        // items-start + text-left: this sits inside a <button>, whose default
        // text-align: center floated the eyebrow off the name's left edge.
        <span className="flex min-w-0 flex-col items-start text-left">
          <span className="text-[9px] leading-[11px] font-bold tracking-[0.08em] text-nav-fg-muted">
            AGENCY
          </span>
          <span className="w-full truncate text-[13.5px] leading-[16px] font-semibold text-nav-fg">
            {account.name}
          </span>
        </span>
      ) : (
        <span className="truncate text-[14px] leading-[20px] font-semibold text-nav-fg">
          {account.name}
        </span>
      )}
    </span>
  );
}
