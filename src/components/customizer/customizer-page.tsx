"use client";

import * as React from "react";
import {
  ArrowLeft,
  Layers,
  ListTree,
  Lock,
  Palette,
  Ruler,
  Star,
  ToggleRight,
  Wallet2,
  type LucideIcon,
} from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { Account } from "@/components/accounts/accounts-data";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { AccessSection } from "./section-access";
import { AppearanceSection } from "./section-appearance";
import { BillingSection } from "./section-billing";
import { BrandSection } from "./section-brand";
import { DefaultsSection } from "./section-defaults";
import { FeaturesSection } from "./section-features";
import { LimitsSection } from "./section-limits";
import { NavigationSection } from "./section-navigation";
import { PreviewPane } from "./preview-pane";

type SectionId =
  | "brand"
  | "navigation"
  | "features"
  | "limits"
  | "billing"
  | "appearance"
  | "defaults"
  | "access";

const SECTIONS: { id: SectionId; label: string; icon: LucideIcon; blurb: string }[] = [
  { id: "brand", label: "Brand", icon: Palette, blurb: "Logo, accent and surfaces" },
  { id: "navigation", label: "Navigation", icon: ListTree, blurb: "Grouping, groups and links" },
  { id: "features", label: "Features", icon: ToggleRight, blurb: "Everything on or off" },
  { id: "limits", label: "Limits", icon: Layers, blurb: "Seats, contacts and sending" },
  { id: "billing", label: "Billing & markups", icon: Wallet2, blurb: "Wallet, rebilling, reselling" },
  { id: "appearance", label: "Appearance", icon: Ruler, blurb: "Density and layout" },
  { id: "defaults", label: "Defaults", icon: Star, blurb: "What a new user starts with" },
  { id: "access", label: "Who can change what", icon: Lock, blurb: "Policies and guardrails" },
];

/**
 * The customizer, replacing production's ten sub-account settings tabs with
 * eight jobs. Deliberately rendered inside the shell rather than as its own
 * page: the real nav sits on the left, live-bound to half these controls,
 * so the preview problem solves itself — you watch the actual product change.
 *
 * Layout is edge-to-edge chrome (section rail | canvas | live preview), not
 * inset mockup cards — each column stretches the full content height.
 */
export function CustomizerPage({
  account,
  onBack,
}: {
  /** The account being shaped — chosen on the Sub-accounts page, not implied. */
  account: Account;
  onBack: () => void;
}) {
  const { effective } = useTheme();
  const appTheme = effective.appTheme;
  const [section, setSection] = React.useState<SectionId>("brand");
  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0];

  return (
    <div data-page-theme={appTheme} className="flex h-full min-h-0 flex-col bg-pg-bg">
      <header className="flex shrink-0 items-center gap-[12px] px-[24px] pt-[18px] pb-[14px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <button
          type="button"
          aria-label="Back to sub-accounts"
          onClick={onBack}
          className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[7px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading"
        >
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <AccountLogo logo={account.logo} src={account.logoSrc} size={30} radius={999} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[17px] leading-[22px] font-semibold text-pg-heading">
            Customize {account.name}
          </h1>
          <p className="text-[12px] leading-[16px] text-pg-muted">
            What this account gets, and what it looks like getting it.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-[8px]">
          <button type="button" className="motion-tap h-[32px] rounded-[8px] px-[12px] text-[12.5px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]">
            Discard
          </button>
          <button type="button" className="motion-tap h-[32px] rounded-[8px] bg-brand px-[12px] text-[12.5px] leading-none font-medium text-brand-fg active:scale-[0.98]">
            Publish changes
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 items-stretch">
        <nav
          aria-label="Customizer sections"
          className="flex h-full w-[218px] shrink-0 flex-col shadow-[inset_-1px_0_0_0_var(--pg-border)]"
        >
          <ul className="flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto px-[8px] py-[12px]">
            {SECTIONS.map((s) => {
              const selected = s.id === section;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    aria-current={selected ? "true" : undefined}
                    onClick={() => setSection(s.id)}
                    className={cn(
                      "motion-tap flex w-full items-start gap-[9px] rounded-[9px] px-[10px] py-[8px] text-left",
                      selected
                        ? "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]"
                        : "hover:bg-pg-surface/70",
                    )}
                  >
                    <s.icon size={15} aria-hidden="true" className={cn("mt-[2px] shrink-0", selected ? "text-brand" : "text-pg-muted")} />
                    <span className="min-w-0">
                      <span className={cn("block text-[13px] leading-[18px] font-medium", selected ? "text-pg-heading" : "text-pg-text")}>
                        {s.label}
                      </span>
                      <span className="block truncate text-[11px] leading-[15px] text-pg-faint">{s.blurb}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <main aria-label={active.label} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-[24px] pt-[16px] pb-[24px]">
          {section === "brand" ? <BrandSection editing={account} /> : null}
          {section === "navigation" ? <NavigationSection key={account.id} account={account} /> : null}
          {section === "features" ? <FeaturesSection key={account.id} account={account} /> : null}
          {section === "limits" ? <LimitsSection key={account.id} account={account} /> : null}
          {section === "billing" ? <BillingSection key={account.id} account={account} /> : null}
          {section === "appearance" ? <AppearanceSection key={account.id} account={account} /> : null}
          {section === "defaults" ? <DefaultsSection key={account.id} account={account} /> : null}
          {section === "access" ? <AccessSection key={account.id} account={account} /> : null}
        </main>

        <div className="hidden h-full min-h-0 w-[260px] shrink-0 flex-col shadow-[inset_1px_0_0_0_var(--pg-border)] xl:flex">
          <PreviewPane account={account} />
        </div>
      </div>
    </div>
  );
}
