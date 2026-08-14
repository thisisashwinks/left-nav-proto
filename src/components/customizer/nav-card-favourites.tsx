"use client";

import type { Account } from "@/components/accounts/accounts-data";
import { catalogue } from "@/components/nav/catalogue";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { cn } from "@/lib/utils";
import { Card } from "./controls";

/**
 * Starter favourites: the dock a new user in this account gets on day one.
 * A starting point, not a cage — users repin their own from there.
 */
export function NavFavouritesCard({ account }: { account: Account }) {
  const layout = useNavLayout();
  const state = layout.profileFor(account.id);

  return (
    <Card
      title="Starter favourites"
      sub="The dock a new user gets on day one. They can change it — this only decides the first impression."
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
              {product.label}
            </button>
          );
        })}
      </div>
      <p className="mt-[10px] text-[11.5px] leading-[16px] text-pg-faint">
        {state.pinned.length} pinned. The dock shows five at a time; the rest sit behind its chevron.
      </p>
    </Card>
  );
}
