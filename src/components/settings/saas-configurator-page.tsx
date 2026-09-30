"use client";

import * as React from "react";
import { ChevronDown, Copy, ExternalLink, Plus, Search } from "lucide-react";
import { usePageChrome } from "@/components/page/page-header";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import {
  DEFAULT_TEMPLATE_ID,
  patchForArrangement,
  useNavTemplates,
} from "@/components/nav/nav-templates";
import type { SaasTier } from "@/design/plans";
import { cn } from "@/lib/utils";
import { SaasPlanEditor } from "./saas-plan-editor";
import { SAAS_TABS, saasPlans, type SaasPlan, type SaasTab } from "./saas-plans-data";
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
 * REBUILT Sep 30 against production. The first cut was three tier cards with
 * a navigation-layout picker on each — a sketch of the model rather than of
 * the screen, and it put the template decision somewhere production has no
 * control at all. The real shape is a plan LIST whose rows open a seven-tab
 * editor, and the navigation template belongs on the Features tab beside the
 * two attachments already there (see `saas-plan-editor.tsx`).
 *
 * The rule the page has to carry, because it is the one people get wrong: a
 * plan is a way to APPLY a template, not a state. Attaching hands the layout
 * to everyone on the plan and to everyone who joins later, and that is the
 * end of the plan's involvement — an account that leaves keeps the layout it
 * has.
 */
export function SaasConfiguratorPage() {
  const [tab, setTab] = React.useState<SaasTab>("Plans & pricing");
  const { title: showTitle, description: showDesc } = usePageChrome();

  /*
   * The plans, held in state because the editor edits them.
   *
   * Seeded from `saasPlans` rather than read straight off it, so renaming a
   * plan or attaching a template sticks for the length of a demo. Nothing
   * persists — a fake that survived a reload would be claiming a backend
   * this prototype does not have.
   */
  const [plans, setPlans] = React.useState(saasPlans);
  const [openTier, setOpenTier] = React.useState<SaasTier | null>(null);
  const open = plans.find((p) => p.tier === openTier) ?? null;

  const patch = (tier: SaasTier, next: Partial<SaasPlan>) =>
    setPlans((all) => all.map((p) => (p.tier === tier ? { ...p, ...next } : p)));

  const { templates, accountsOnTier, link, notify, strict, attachToTier } =
    useNavTemplates();
  const layout = useNavLayout();

  /*
   * Attaching does the real thing, not a label change.
   *
   * The modal is a picture until the press moves navigations, so this runs
   * the same store calls the model already had: patch every account on the
   * plan to the template's arrangement, link them so a later template save
   * can find them, and report how far it reached. A configurator whose
   * template button only set a chip would demo perfectly and teach the wrong
   * model — which is the failure mode this whole feature is about.
   */
  const attachTemplate = (plan: SaasPlan, templateId: string | null) => {
    patch(plan.tier, { templateId });
    attachToTier(plan.tier, templateId ?? DEFAULT_TEMPLATE_ID);

    if (!templateId) {
      notify(`${plan.name} has no template — sub-accounts keep their layout`);
      return;
    }
    const chosen = templates.find((t) => t.id === templateId);
    if (!chosen) return;
    const on = accountsOnTier(plan.tier);
    for (const id of on) {
      const applied = patchForArrangement(
        chosen.arrangement,
        layout.profileFor(id),
        { whole: strict },
      );
      layout.applyToAccounts([id], `Applied ${chosen.name}`, (l) => ({
        ...l,
        ...applied,
      }));
      link(id, templateId, applied);
    }
    notify(
      on.length === 0
        ? `${chosen.name} attached to ${plan.name}`
        : `${chosen.name} applied to ${on.length} sub-account${on.length === 1 ? "" : "s"} on ${plan.name}`,
    );
  };

  if (open) {
    return (
      <div className="flex h-full min-h-0 flex-col px-[var(--page-inset)] pt-[6px] pb-[24px]">
        <SaasPlanEditor
          plan={open}
          onBack={() => setOpenTier(null)}
          onRename={(name, description) =>
            patch(open.tier, { name, description })
          }
          onAttachTemplate={(id) => attachTemplate(open, id)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 px-[var(--page-inset)]">
        {showTitle ? (
          <>
            <h1 className="text-[20px] leading-[28px] font-semibold text-pg-heading">
              SaaS dashboard
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
          {SAAS_TABS.map((t) => (
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
        {tab === "Plans & pricing" ? (
          <PlansTab plans={plans} onOpen={setOpenTier} />
        ) : (
          <ProductionStubTab label={tab} />
        )}
      </div>
    </div>
  );
}

function PlansTab({
  plans,
  onOpen,
}: {
  plans: readonly SaasPlan[];
  onOpen: (tier: SaasTier) => void;
}) {
  const { templates } = useNavTemplates();

  return (
    <div className="flex flex-col gap-[16px]">
      <div className="flex flex-wrap items-start justify-between gap-[12px]">
        <div className="flex min-w-0 flex-col gap-[2px]">
          <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            Plans &amp; pricing
          </h2>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            You can either offer our recommended plans or build your own
            packages.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-[10px]">
          <button
            type="button"
            className="motion-tap flex h-[36px] items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
          >
            Categories
            <ChevronDown size={15} aria-hidden="true" className="text-pg-faint" />
          </button>
          <div className="flex h-[36px] w-[230px] items-center gap-[9px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="search"
              placeholder="Search plans by name"
              aria-label="Search plans by name"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="motion-tap flex h-[36px] items-center gap-[7px] rounded-[8px] bg-brand px-[14px] text-[13px] leading-[normal] font-medium text-brand-fg hover:opacity-90 active:scale-[0.98]"
          >
            <Plus size={16} aria-hidden="true" />
            Add your plan
          </button>
        </div>
      </div>

      {plans.map((plan) => {
        const template = templates.find((t) => t.id === plan.templateId);
        return (
          <article
            key={plan.tier}
            className="overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-[16px] p-[20px]">
              <div className="flex min-w-0 flex-col gap-[10px]">
                <span className="flex flex-wrap items-center gap-[10px]">
                  <h3 className="text-[22px] leading-[28px] font-semibold tracking-[-0.3px] text-pg-heading">
                    {plan.name}
                  </h3>
                  <span className="flex h-[22px] items-center rounded-full bg-pg-bg px-[10px] text-[12px] leading-none font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
                    {plan.category}
                  </span>
                </span>
                <span className="flex items-center gap-[6px] text-[12.5px] leading-[17px] text-pg-muted">
                  Product ID
                  <button
                    type="button"
                    aria-label={`Copy the product ID for ${plan.name}`}
                    className="motion-tap flex size-[20px] items-center justify-center rounded-[5px] text-pg-faint hover:bg-pg-bg hover:text-brand"
                  >
                    <Copy size={13} aria-hidden="true" />
                  </button>
                </span>
                <span className="flex flex-col gap-[3px]">
                  <span className="text-[13.5px] leading-[19px] font-medium text-pg-text-strong">
                    Features
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpen(plan.tier)}
                    className="motion-tap w-fit text-[13px] leading-[18px] font-medium text-brand hover:underline"
                  >
                    View all features →
                  </button>
                </span>
              </div>

              {/*
                The two prices as boxes rather than a row of numbers.

                Each is a separate purchasable thing with its own sale link,
                so each gets a box — a monthly and an annual figure side by
                side with one link under them would leave the link ambiguous,
                which on a payment page is the one thing it cannot be.
              */}
              <div className="flex shrink-0 gap-[14px]">
                <PriceBox label="Monthly" amount={plan.monthly} />
                <PriceBox label="Annual" amount={plan.annual} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-[20px] gap-y-[10px] border-t border-pg-row-border bg-pg-bg px-[20px] py-[12px]">
              <Fact>
                <strong className="font-semibold text-pg-text-strong">
                  {plan.trialDays}
                </strong>{" "}
                Days trial period
              </Fact>
              <Fact>
                <strong className="font-semibold text-pg-text-strong">
                  {plan.credits}
                </strong>{" "}
                Complimentary credits
              </Fact>

              <span aria-hidden="true" className="min-w-[8px] flex-1" />

              {/*
                What this plan hands out, read out on the row.

                Both attachments, because the list is where an agency
                compares plans and "which of these gives the client a nav" is
                exactly the sort of thing that is invisible until you open
                all three. The editor is where they are changed; this is
                where they are seen.
              */}
              <Fact>
                {plan.snapshot ?? "No snapshot attached"}
              </Fact>
              <Fact>
                {template ? template.name : "No template attached"}
              </Fact>

              <button
                type="button"
                onClick={() => onOpen(plan.tier)}
                className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-[normal] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
              >
                Edit details
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PriceBox({ label, amount }: { label: string; amount: string }) {
  return (
    <div className="flex w-[150px] flex-col gap-[6px] rounded-[10px] px-[14px] py-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <span className="flex items-center justify-between gap-[8px]">
        <span className="text-[13px] leading-[18px] font-medium text-brand">
          {label}
        </span>
        <ExternalLink size={14} aria-hidden="true" className="text-brand" />
      </span>
      <span className="text-[22px] leading-[28px] font-semibold text-pg-heading tabular-nums">
        {amount}
      </span>
      <button
        type="button"
        className="motion-tap flex items-center gap-[6px] border-t border-pg-row-border pt-[8px] text-[12.5px] leading-[17px] font-medium text-brand hover:underline"
      >
        <Copy size={13} aria-hidden="true" />
        Sale link
      </button>
    </div>
  );
}

function Fact({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex shrink-0 items-center gap-[6px] text-[12.5px] leading-[17px] text-pg-muted">
      {children}
    </span>
  );
}
