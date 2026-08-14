"use client";

import type { Account } from "@/components/accounts/accounts-data";
import { NavDensityCard } from "./nav-card-density";
import { NavFavouritesCard } from "./nav-card-favourites";
import { NavLayoutCard } from "./nav-card-layout";
import { NavLinksCard } from "./nav-card-links";
import { NavGroupsCard, NavOrganisationCard } from "./nav-card-organisation";
import { NavPermissionsCard } from "./nav-card-permissions";
import { PreviewPane } from "./preview-pane";

/**
 * The one tab this proposal adds to production's sub-account settings:
 * everything about the left nav, and nothing else.
 *
 * Production already owns features, limits, billing, branding and the rest in
 * their own tabs — this tab does not restate them. Reading order runs from
 * what the nav contains, through what it looks like, to who may change it,
 * with the live nav on the right so every control has a visible consequence.
 */
export function NavigationTab({ account }: { account: Account }) {
  return (
    <div className="flex items-start gap-[16px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
        <NavOrganisationCard account={account} />
        <NavGroupsCard account={account} />
        <NavLinksCard />
        <NavFavouritesCard account={account} />
        <NavLayoutCard account={account} />
        <NavDensityCard account={account} />
        <NavPermissionsCard account={account} />
      </div>

      <aside className="sticky top-0 hidden w-[300px] shrink-0 overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] xl:block">
        <div className="h-[560px]">
          <PreviewPane account={account} />
        </div>
      </aside>
    </div>
  );
}
