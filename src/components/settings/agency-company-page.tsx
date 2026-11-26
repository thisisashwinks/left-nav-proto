"use client";

import * as React from "react";
import { PageTitle, usePageChrome } from "@/components/page/page-header";
import type { Account } from "@/components/accounts/accounts-data";
import { cn } from "@/lib/utils";
import { WhiteLabelTab } from "./white-label-tab";
import { ProductionStubTab } from "./tab-production-stub";
import { useBranding } from "@/components/branding/branding-provider";
import { clearCompanyTabRequest, useCompanyTabRequest } from "@/components/branding/branding-entry";
import { BrandingThemeSection, requestLeave } from "@/components/branding/customize-panel";

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

type CompanyTab = (typeof TABS)[number] | "Branding";

export function AgencyCompanyPage({ agency }: { agency: Account }) {
  // Opens on White label: it is the tab this page exists to show.
  const [tab, setTab] = React.useState<CompanyTab>("White label");
  const { title: showTitle, description: showDesc } = usePageChrome();

  /*
   * Branding and theme (Nov 19), placed by proto.customizeTarget: a section
   * under White label, or its own tab beside it. Any other target: neither.
   */
  const { proto } = useBranding();
  const brandingTab = proto.customizeTarget === "branding-tab";
  const brandingSection = proto.customizeTarget === "white-label-section";
  const tabs: readonly CompanyTab[] = brandingTab
    ? [TABS[0], TABS[1], "Branding", ...TABS.slice(2)]
    : TABS;
  const shownTab: CompanyTab = tab === "Branding" && !brandingTab ? "White label" : tab;

  // "Customize theme" / "Logo, CSS, and more" land here on a named tab.
  const req = useCompanyTabRequest();
  React.useEffect(() => {
    if (!req) return;
    const want = req.tab === "Branding" && !brandingTab ? "White label" : (req.tab as CompanyTab);
    setTab(want); // eslint-disable-line react-hooks/set-state-in-effect
    const anchorId = req.anchorId;
    clearCompanyTabRequest();
    if (anchorId) {
      requestAnimationFrame(() =>
        document.getElementById(anchorId)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
  }, [req, brandingTab]);

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
     * No max width. The design system's 1160px body measure was here and was
     * removed on Ashwin's call (Oct 9): production's own White Label page
     * runs the full width of the window, and a prototype that narrows it is
     * comparing two different pages. The cost is real — the Logo card's three
     * fields stretch out at 1900px and the Save that commits them sits a
     * hand's width away — and it is production's cost to show, not ours to
     * quietly fix.
     */
    <div className="w-full px-[var(--page-inset)] pb-[24px]">
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
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              aria-current={t === shownTab ? "page" : undefined}
              // An unapplied theme asks first (Nov 24, 2026).
              onClick={() => (t === shownTab ? undefined : requestLeave(() => setTab(t)))}
              className={cn(
                "motion-tap shrink-0 pb-[10px] text-[14px] leading-[20px] font-medium whitespace-nowrap",
                t === shownTab
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
        {shownTab === "White label" ? (
          <>
            {/* Theme sits right under the logos (Nov 26, 2026). */}
            <WhiteLabelTab
              agency={agency}
              themeSlot={brandingSection ? <BrandingThemeSection embedded /> : null}
            />
          </>
        ) : shownTab === "Branding" ? (
          <BrandingThemeSection asTab />
        ) : (
          <ProductionStubTab label={shownTab} />
        )}
      </div>
    </div>
  );
}
