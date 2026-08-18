"use client";

import {
  enabledProducts,
  iconForProduct,
  labelForProduct,
} from "@/components/nav/grouping";
import type { Account } from "@/components/accounts/accounts-data";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { cn } from "@/lib/utils";
import { Card, Switch } from "./controls";
import { usePlanFor, useCustomizerProfiles } from "./customizer-profiles";
import { GatedRow, PlanNote } from "./gated";
import { NudgeButtons } from "./nav-tree-parts";

/**
 * Starter favourites: the dock a new user in this account gets on day one.
 * A starting point, not a cage — users repin their own from there.
 *
 * Offers this account's products under this account's names — pinning
 * something they are not on is not a choice anyone should be able to make
 * here, and "Patients" is what the row will say in the nav.
 *
 * Which products are in the dock is a base-plan decision. The order they sit in,
 * and handing this dock to every new sub-account, are the two governance
 * questions on top of it, so both carry the $297 gate.
 */
export function NavFavouritesCard({ account }: { account: Account }) {
  const layout = useNavLayout();
  const profiles = useCustomizerProfiles();
  const { has } = usePlanFor(account.id);
  const state = layout.profileFor(account.id);
  const profile = profiles.profileFor(account.id);
  const canOrder = has("favoritesOrder");

  const movePin = (id: string, delta: number) =>
    layout.updateProfile(account.id, (s) => {
      const from = s.pinned.indexOf(id);
      const to = from + delta;
      if (from === -1 || to < 0 || to >= s.pinned.length) return s;
      const pinned = [...s.pinned];
      const [moved] = pinned.splice(from, 1);
      pinned.splice(to, 0, moved as string);
      return { ...s, pinned };
    });

  return (
    <Card
      title="Starter favourites"
      sub="The dock a new user gets on day one. They can change it — this only decides the first impression."
    >
      <div className="flex flex-wrap gap-[8px] pt-[4px]">
        {enabledProducts(state).map((product) => {
          const pinned = state.pinned.includes(product.id);
          return (
            <button
              key={product.id}
              type="button"
              aria-pressed={pinned}
              onClick={() =>
                layout.updateProfile(account.id, (s) => ({
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
              {labelForProduct(state, product.id)}
            </button>
          );
        })}
      </div>
      <p className="mt-[10px] text-[11.5px] leading-[16px] text-pg-faint">
        {state.pinned.length} pinned. The dock shows five at a time; the rest sit behind its chevron.
      </p>

      {/*
        The ordered list only appears where it can be acted on. On the base plan
        the row below states the rule and the dock keeps the order things were
        pinned in, which is a defensible default and not a broken control.
      */}
      {canOrder && state.pinned.length > 1 ? (
        <>
        <p className="mt-[14px] text-[13px] leading-[18px] font-medium text-pg-heading">
          Dock order
        </p>
        <p className="mt-[1px] mb-[8px] text-[12px] leading-[16px] text-pg-muted">
          The first five are the ones the dock shows.
        </p>
        <div className="rounded-[10px] bg-pg-bg px-[12px] py-[4px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {state.pinned.map((id, i) => {
            const Icon = iconForProduct(state, id);
            return (
              <div
                key={id}
                className={cn(
                  "flex items-center gap-[9px] py-[7px]",
                  i === state.pinned.length - 1
                    ? ""
                    : "shadow-[inset_0_-1px_0_0_var(--pg-border)]",
                )}
              >
                <span className="w-[16px] shrink-0 text-[11px] leading-none font-medium text-pg-faint tabular-nums">
                  {i + 1}
                </span>
                <Icon size={14} aria-hidden="true" className="shrink-0 text-pg-muted" />
                <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-text">
                  {labelForProduct(state, id)}
                </span>
                <NudgeButtons
                  label={labelForProduct(state, id)}
                  onMove={(delta) => movePin(id, delta)}
                  canUp={i > 0}
                  canDown={i < state.pinned.length - 1}
                />
              </div>
            );
          })}
        </div>
        </>
      ) : null}

      <div className="mt-[6px]">
        {/*
          Only rendered when locked, where it states the rule the missing list
          would otherwise leave implicit. Unlocked, the ordered list above *is*
          the control, and a second row with an empty right-hand side beside it
          reads as a control that failed to load.
        */}
        {canOrder ? null : (
          <GatedRow
            cap="favoritesOrder"
            accountId={account.id}
            label="Dock order"
            desc="The dock follows the order products were pinned in."
          >
            {() => null}
          </GatedRow>
        )}
        <GatedRow
          cap="defaultFavoritesForNew"
          accountId={account.id}
          label="Use for new sub-accounts"
          desc="Every sub-account created from now on starts with this dock instead of the shipped five."
          last
        >
          {(locked) => (
            <Switch
              on={profile.favoritesAsDefault}
              onToggle={() =>
                profiles.updateProfile(account.id, (p) => ({
                  ...p,
                  favoritesAsDefault: !p.favoritesAsDefault,
                }))
              }
              disabled={locked}
              label="Use for new sub-accounts"
            />
          )}
        </GatedRow>
      </div>

      <PlanNote cap="favoritesOrder" accountId={account.id}>
        Reordering the dock and handing it to new sub-accounts are on the $297
        plan. Choosing what is in it is on every plan.
      </PlanNote>
    </Card>
  );
}
