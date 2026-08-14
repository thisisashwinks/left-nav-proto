"use client";

import * as React from "react";
import { Check } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { industryFor, noteFor } from "@/components/nav/account-nav-profiles";
import { catalogue, catalogueJobs } from "@/components/nav/catalogue";
import {
  densityFor,
  labelForProduct,
  withProduct,
} from "@/components/nav/grouping";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { cn } from "@/lib/utils";
import { Card, Chip } from "./controls";

const DENSITY_NOTE: Record<ReturnType<typeof densityFor>, string> = {
  flat: "few enough to be a flat list — grouping would add a click to every row",
  mixed: "the mixed band: groups help, but the nav still fits on one screen",
  grouped: "enough that the nav needs groups to stay scannable",
};

/**
 * What this account is on.
 *
 * The first card in the tab, because it is the first question: the nav can only
 * ever show what the agency provisioned, so every control below it — grouping,
 * favourites, density — is downstream of this list. A dentist is on seven
 * products and a barbershop on five; the nav has to be theirs, not the
 * catalogue's.
 *
 * Turning one off removes it from the nav, the launcher, search and the dock in
 * the same motion — which is why it lives here and not in a features grid that
 * the nav does not read.
 */
export function NavProductsCard({ account }: { account: Account }) {
  const layout = useNavLayout();
  const state = layout.profileFor(account.id);
  const enabled = new Set(state.enabledProducts);
  const industry = industryFor(account.id);
  const note = noteFor(account.id);
  const density = densityFor(state.enabledProducts.length);

  return (
    <Card
      title="Products in this account"
      sub={
        note ??
        "What the agency provisioned. The nav can only show what is turned on here."
      }
      aside={industry ? <Chip tone="inherit">{industry}</Chip> : undefined}
    >
      <div className="flex flex-col gap-[14px] pt-[4px]">
        {catalogueJobs.map((job) => {
          const products = catalogue.filter((p) => p.jobId === job.id);
          const onCount = products.filter((p) => enabled.has(p.id)).length;
          return (
            <div key={job.id} className="flex flex-col gap-[8px]">
              <div className="flex items-baseline gap-[7px]">
                <span className="text-[11px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
                  {job.defaultLabel}
                </span>
                <span className="text-[11px] leading-none text-pg-faint tabular-nums">
                  {onCount}/{products.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-[8px]">
                {products.map((product) => {
                  const on = enabled.has(product.id);
                  // The account's own name for it, so this list reads like the
                  // nav beside it rather than like the price sheet.
                  const label = on
                    ? labelForProduct(state, product.id)
                    : product.label;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() =>
                        layout.updateProfile(account.id, (s) =>
                          withProduct(s, product.id, !on),
                        )
                      }
                      className={cn(
                        "motion-tap flex items-center gap-[7px] rounded-full px-[11px] py-[6px] text-[12.5px] leading-none font-medium",
                        on
                          ? "bg-[color-mix(in_oklab,var(--brand)_10%,var(--pg-surface))] text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]"
                          : "text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-text hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                      )}
                    >
                      {on ? (
                        <Check size={13} aria-hidden="true" />
                      ) : (
                        <product.icon size={13} aria-hidden="true" />
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-[14px] text-[11.5px] leading-[16px] text-pg-faint">
        {state.enabledProducts.length} of {catalogue.length} products — {DENSITY_NOTE[density]}.
      </p>
    </Card>
  );
}
