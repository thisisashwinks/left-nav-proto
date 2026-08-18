"use client";

import type { Account } from "@/components/accounts/accounts-data";
import { NavCustomCssCard } from "./nav-card-custom-css";
import { NavDensityCard } from "./nav-card-density";
import { NavFavouritesCard } from "./nav-card-favourites";
import { NavLayoutCard } from "./nav-card-layout";
import { NavLinksCard } from "./nav-card-links";
import { NavOrganisationCard } from "./nav-card-organisation";
import { NavPermissionsCard } from "./nav-card-permissions";
import { NavTreeCard } from "./nav-card-tree";
import { PreviewPane } from "./preview-pane";

/**
 * The one tab this proposal adds to production's sub-account settings:
 * everything about the left nav, and nothing else.
 *
 * Production already owns features, limits, billing, branding and the rest in
 * their own tabs — this tab does not restate them. Reading order runs from
 * what the nav contains, through what it looks like, to who may change it,
 * with the live nav on the right so every control has a visible consequence.
 *
 * What each card offers depends on the account's plan: the base tier gets a nav
 * it can organise, name and theme, the middle tier adds the governance controls,
 * and the top tier adds the CSS escape hatch at the bottom. Locked rows stay
 * visible and readable — an agency should be able to see what the next tier buys.
 */
export function NavigationTab({ account }: { account: Account }) {
  return (
    <div className="flex items-start gap-[16px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
        <NavOrganisationCard account={account} />
        {/* Tree before links and favourites: both are decisions about rows this
            card decides the shape of. */}
        <NavTreeCard account={account} />
        <NavLinksCard account={account} />
        <NavFavouritesCard account={account} />
        <NavLayoutCard account={account} />
        <NavDensityCard account={account} />
        <NavPermissionsCard account={account} />
        {/* Last, because it loads last and overrides everything above it. Keyed
            by account so the textarea's draft belongs to one account and never
            follows the operator into the next one. */}
        <NavCustomCssCard key={account.id} account={account} />
      </div>

      {/*
        Sticky so the nav being described stays on screen through a tab this
        long. Height tracks the viewport rather than the column, or the preview
        would stretch to the full scroll height and never be visible whole.
      */}
      <aside className="sticky top-0 hidden h-[calc(100vh-190px)] max-h-[760px] min-h-[420px] w-[300px] shrink-0 overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] xl:block">
        <PreviewPane account={account} />
      </aside>
    </div>
  );
}
