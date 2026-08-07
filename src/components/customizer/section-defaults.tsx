"use client";

import * as React from "react";
import type { Account } from "@/components/accounts/accounts-data";
import { catalogue } from "@/components/nav/catalogue";
import {
  GROUPING_LABELS,
  GROUPING_MODES,
  type GroupingMode,
  type NavLayoutState,
} from "@/components/nav/grouping";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { cn } from "@/lib/utils";
import { Card, SelectField, SettingRow } from "./controls";

const LANDING_OPTIONS = ["launchpad", "dashboard", "conversations", "contacts"] as const;

const LANDING_LABELS: Record<(typeof LANDING_OPTIONS)[number], string> = {
  launchpad: "Launchpad",
  dashboard: "Dashboard",
  conversations: "Conversations",
  contacts: "Contacts",
};

/**
 * Defaults: what a fresh user in this account starts with. Everything here
 * is a starting point, not a cage — users change their own pins and the nav
 * remembers their own recents from day one.
 */
export function DefaultsSection({ account }: { account: Account }) {
  const layout = useNavLayout();
  const state = layout.profileFor(account.id);
  const patch = (recipe: (s: NavLayoutState) => NavLayoutState) =>
    layout.updateProfile(account.id, recipe);
  // Prototype-only: not yet part of the account profile store.
  const [landing, setLanding] = React.useState<(typeof LANDING_OPTIONS)[number]>("launchpad");

  return (
    <div className="flex flex-col gap-[14px]">
      <Card
        title="Starter favourites"
        sub="The dock a new user gets on day one. They can change it — this only decides the first impression. Live: the dock on the left is showing this set."
      >
        <div className="flex flex-wrap gap-[8px] pt-[4px]">
          {catalogue.map((product) => {
            const pinned = state.pinned.includes(product.id);
            return (
              <button
                key={product.id}
                type="button"
                aria-pressed={pinned}
                onClick={() =>
                  patch((s) => ({
                    ...s,
                    pinned: s.pinned.includes(product.id)
                      ? s.pinned.filter((id) => id !== product.id)
                      : [...s.pinned, product.id],
                  }))
                }
                className={cn(
                  "motion-tap flex items-center gap-[7px] rounded-full px-[11px] py-[6px] text-[12.5px] leading-none font-medium",
                  pinned
                    ? "bg-[color-mix(in_oklab,var(--brand)_10%,var(--pg-surface))] text-brand shadow-[inset_0_0_0_1.5px_var(--brand)]"
                    : "text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                )}
              >
                <product.icon size={13} aria-hidden="true" />
                {product.label}
              </button>
            );
          })}
        </div>
        <p className="mt-[10px] text-[11.5px] leading-[16px] text-pg-faint">
          {state.pinned.length} pinned. The dock shows five at a time; the rest sit behind its chevron.
        </p>
      </Card>

      <Card title="First screen" sub="Where a user lands when they open the account.">
        <SettingRow label="Landing page" desc="Launchpad until setup is complete is the usual choice." last>
          <SelectField
            label="Landing page"
            options={LANDING_OPTIONS}
            value={landing}
            onChange={setLanding}
            format={(v) => LANDING_LABELS[v]}
          />
        </SettingRow>
      </Card>

      <Card title="Default organisation" sub="The grouping a new user starts on. Anyone allowed to regroup can change their own copy.">
        <SettingRow label="Grouping" desc="Jobs is the recommendation; Product mirrors what ships today." last>
          <SelectField<GroupingMode>
            label="Default grouping"
            options={GROUPING_MODES}
            value={state.grouping}
            onChange={(mode) =>
              patch((s) => (s.grouping === mode ? s : { ...s, grouping: mode }))
            }
            format={(v) => GROUPING_LABELS[v]}
          />
        </SettingRow>
      </Card>
    </div>
  );
}
