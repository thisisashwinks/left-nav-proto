"use client";

import * as React from "react";
import { PageTitle, usePageChrome } from "@/components/page/page-header";
import type { Account } from "@/components/accounts/accounts-data";
import { cn } from "@/lib/utils";
import { WhiteLabelTab } from "./white-label-tab";
import { CustomCodeProvider } from "./custom-code-store";
import { ProductionStubTab } from "./tab-production-stub";

/**
 * Agency › Settings › Company.
 *
 * The sheet gives Company five L3 rows, and White Label is where an agency's
 * logo actually lives — so this is the one agency settings page drawn in full
 * rather than left as a place-holder. Everything else on it stays a stub, for
 * the same reason the sub-account settings page keeps production's other tabs:
 * the proposal is the branding pair and the nav that consumes it, not a
 * redesign of agency settings.
 *
 * Production's version of this page is why it is worth drawing. The logo field
 * sits in a card with a red delete button and a disabled Save, above an
 * unrelated Domains block, above Policies, each with its own Save — three
 * commit buttons on one screen and no indication which one owns the logo. Here
 * the branding card owns its own state and says what the nav will do with it.
 */
const TABS = [
  "Basic details",
  "White label",
  "Advanced settings",
  "Single sign-on (SSO)",
  "Compliance",
] as const;

export function AgencyCompanyPage({ agency }: { agency: Account }) {
  // Opens on White label: it is the tab this page exists to show.
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("White label");
  const { title: showTitle, description: showDesc } = usePageChrome();

  return (
    /*
     * One scroller, and it is the canvas's.
     *
     * This page used to pin its header and scroll a region under the tabs,
     * which put a second scrollbar inside the canvas's own and reserved a
     * gutter for it. The canvas body already scrolls at page level, with the
     * bar at the window's edge and overlaid rather than reserved — so the
     * page's job is to be tall, not to scroll itself.
     *
     * Max width is the design system's body measure. Without it the Logo
     * card's three fields stretch the width of a 1900px window and the
     * Save that commits them ends up a hand's width from them.
     */
    <div className="mx-auto w-full max-w-[1160px] px-[var(--page-inset)] pb-[24px]">
      <header>
        {showTitle ? (
          <>
            <PageTitle title="Company" className="text-[20px] leading-[28px] font-semibold text-pg-heading" />
            {showDesc ? (
              <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
                Who the agency is, and how it is branded.
              </p>
            ) : null}
          </>
        ) : null}
        <nav
          aria-label="Company sections"
          className={cn(
            "flex gap-[18px] overflow-x-auto shadow-[inset_0_-1px_0_0_var(--pg-border)]",
            showTitle && "mt-[16px]",
          )}
        >
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-current={t === tab ? "page" : undefined}
              onClick={() => setTab(t)}
              className={cn(
                "motion-tap shrink-0 pb-[10px] text-[14px] leading-[20px] font-medium whitespace-nowrap",
                t === tab
                  ? "text-brand shadow-[inset_0_-2px_0_0_var(--brand)]"
                  : "text-pg-muted hover:text-pg-text",
              )}
            >
              {t}
            </button>
          ))}
        </nav>
      </header>

      <div className="pt-[16px]">
        {tab === "White label" ? (
          <CustomCodeProvider>
            <WhiteLabelTab agency={agency} />
          </CustomCodeProvider>
        ) : (
          <ProductionStubTab label={tab} />
        )}
      </div>
    </div>
  );
}
