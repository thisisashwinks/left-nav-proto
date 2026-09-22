"use client";

import * as React from "react";
import { usePageChrome } from "@/components/page/page-header";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import {
  DEFAULT_TEMPLATE_ID,
  patchForArrangement,
  useNavTemplates,
} from "@/components/nav/nav-templates";
import { areasAddedBy } from "@/components/nav/saas-tiers";
import { useTheme } from "@/components/theme/theme-provider";
import {
  SAAS_TIERS,
  SAAS_TIER_BLURBS,
  SAAS_TIER_LABELS,
  SAAS_TIER_PRICES,
  type SaasTier,
} from "@/design/plans";
import { cn } from "@/lib/utils";
import { Card, Picker, SettingRow } from "./controls";
import { ProductionStubTab } from "./tab-production-stub";

/**
 * Agency › SaaS › SaaS configurator.
 *
 * Journey 4 lives here rather than in the nav's own ⋯ menu, which is where it
 * was first built and the wrong room for it. Everything else in that menu is
 * about the nav in front of you; this is about what a PLAN hands out, to
 * accounts you are not looking at and to accounts that do not exist yet. An
 * agency reasoning about plans is on the plans screen, and this is it.
 *
 * The rule the page has to carry, because it is the one people get wrong: a
 * plan is a way to APPLY a template, not a state. Attaching hands the layout to
 * everyone on the plan and to everyone who joins later, and that is the end of
 * the plan's involvement — an account that leaves keeps the layout it has. So
 * each card says what the plan does on the way IN, and the page says once, at
 * the top, what it does not do on the way out.
 */
const TABS = ["Plans", "Pricing", "Rebilling", "Trials"] as const;

export function SaasConfiguratorPage() {
  const [tab, setTab] = React.useState<(typeof TABS)[number]>("Plans");
  const { title: showTitle, description: showDesc } = usePageChrome();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-[var(--page-inset)]">
        {showTitle ? (
          <>
            <h1 className="text-[20px] leading-[28px] font-semibold text-pg-heading">
              SaaS configurator
            </h1>
            {showDesc ? (
              <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
                Plans, pricing and re-billing.
              </p>
            ) : null}
          </>
        ) : null}
        <nav
          aria-label="SaaS configurator sections"
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

      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--page-inset)] pt-[16px] pb-[24px]">
        {tab === "Plans" ? <PlansTab /> : <ProductionStubTab label={tab} />}
      </div>
    </div>
  );
}

function PlansTab() {
  const { templateSaasPlans } = useTheme().effective;
  const {
    templates,
    templateForTier,
    attachToTier,
    accountsOnTier,
    link,
    notify,
    strict,
  } = useNavTemplates();
  const layout = useNavLayout();

  /*
   * Attaching applies, to everyone already on the plan.
   *
   * The alternative — attach now, apply to joiners only — would leave one plan
   * with two populations on it, which is exactly the "how did it get here"
   * state the model exists to rule out. So the press does the whole thing, and
   * the count that comes back says how far it reached.
   */
  const attach = (tier: SaasTier, templateId: string) => {
    attachToTier(tier, templateId);
    const on = accountsOnTier(tier);
    if (templateId === DEFAULT_TEMPLATE_ID) {
      notify(
        `${SAAS_TIER_LABELS[tier]} has no template — sub-accounts keep their layout`,
      );
      return;
    }
    const chosen = templates.find((t) => t.id === templateId);
    if (!chosen) return;
    for (const id of on) {
      const applied = patchForArrangement(chosen.arrangement, layout.profileFor(id), {
        whole: strict,
      });
      layout.applyToAccounts([id], `Applied ${chosen.name}`, (l) => ({
        ...l,
        ...applied,
      }));
      link(id, templateId, applied);
    }
    notify(
      on.length === 0
        ? `${chosen.name} attached to ${SAAS_TIER_LABELS[tier]}`
        : `${chosen.name} applied to ${on.length} ${on.length === 1 ? "sub-account" : "sub-accounts"} on ${SAAS_TIER_LABELS[tier]}`,
    );
  };

  return (
    <div className="flex w-full max-w-[720px] flex-col gap-[16px]">
      {templateSaasPlans ? (
        <p className="text-[13px] leading-[18px] text-pg-muted">
          A plan hands its navigation layout to every sub-account on it, and to
          every one that joins later. Leaving a plan never changes a layout —
          only you can move a sub-account off one.
        </p>
      ) : null}

      {SAAS_TIERS.map((tier) => {
        const on = accountsOnTier(tier);
        const attached = templateForTier(tier);
        return (
          <Card
            key={tier}
            title={SAAS_TIER_LABELS[tier]}
            sub={SAAS_TIER_BLURBS[tier]}
            aside={
              <span className="shrink-0 text-right">
                <span className="block text-[14px] leading-[20px] font-semibold text-pg-heading">
                  {SAAS_TIER_PRICES[tier]}
                  <span className="text-[12px] font-normal text-pg-muted">/mo</span>
                </span>
                <span className="block text-[12px] leading-[16px] text-pg-muted tabular-nums">
                  {on.length} {on.length === 1 ? "sub-account" : "sub-accounts"}
                </span>
              </span>
            }
          >
            <SettingRow
              label="Includes"
              desc="What this plan entitles the client to, over the one below it."
              last={!templateSaasPlans}
            >
              <span className="text-[13px] leading-[18px] text-pg-muted">
                {areasAddedBy(tier).join(", ")}
              </span>
            </SettingRow>

            {/*
              Behind the axis, so the page can be reviewed as a pricing screen
              with no navigation in it at all — which is what it is today.
            */}
            {templateSaasPlans ? (
              <SettingRow
                label="Navigation layout"
                desc={
                  attached
                    ? on.length === 0
                      ? `New sub-accounts on this plan start on ${attached.name}.`
                      : `${on.length} ${on.length === 1 ? "sub-account is" : "sub-accounts are"} on ${attached.name}, and joiners get it too.`
                    : "No template — sub-accounts keep the layout they arrive with."
                }
                last
              >
                <Picker
                  label={`Navigation layout for ${SAAS_TIER_LABELS[tier]}`}
                  value={attached?.id ?? DEFAULT_TEMPLATE_ID}
                  options={templates.map((t) => t.id)}
                  format={(id) =>
                    templates.find((t) => t.id === id)?.name ?? "HighLevel default"
                  }
                  onChange={(id) => attach(tier, id)}
                />
              </SettingRow>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
