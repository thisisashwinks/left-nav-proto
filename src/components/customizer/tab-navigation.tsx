"use client";

import type { Account } from "@/components/accounts/accounts-data";
import { NavTreeCard } from "./nav-card-tree";
import { PreviewPane } from "./preview-pane";

/**
 * The one tab this proposal adds to production's sub-account settings:
 * everything about the left nav, and nothing else.
 *
 * Down to a single card. The tab used to carry eight — the grouping-mode picker,
 * top-level rows, custom links, starter favourites, layout, density and custom
 * CSS — and every one of them has been cut back to this: the tree itself, which
 * is what an agency actually configures. Group names, icons, order and where a
 * product is filed. Everything else was either a decision already made by the
 * default, or an axis the team compares in the prototype-controls panel rather
 * than something an agency should be asked about.
 *
 * The live nav stays on the right, so every edit here has a visible consequence.
 */
export function NavigationTab({ account }: { account: Account }) {
  return (
    <div className="flex items-start gap-[16px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
        <NavTreeCard account={account} />
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
