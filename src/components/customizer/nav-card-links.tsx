"use client";

import { ExternalLink, Plus, TriangleAlert } from "lucide-react";
import type { Account } from "@/components/accounts/accounts-data";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { Card, Chip, SettingRow } from "./controls";

/**
 * Custom links — the nav rows an agency adds itself.
 *
 * Per account, like everything else in this tab: a roofer's nav carries a
 * supplier price list and a hotel group's carries the PMS, and a card that
 * listed the same three links for every client would be the one place in the
 * tab still pretending accounts are interchangeable.
 *
 * Destinations and audiences are prototype-only: production's menu-link editor
 * has neither, which is what the warning strip is about.
 */
export function NavLinksCard({ account }: { account: Account }) {
  const layout = useNavLayout();
  const links = layout.profileFor(account.id).customLinks;

  /** A plausible host for a link named like this. Demo dressing, not data. */
  const hostFor = (label: string) =>
    `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.${
      account.id
    }.com`;

  return (
    <Card
      title="Custom links"
      sub="A link must declare a name, destination and audience before it can be saved — the rule production never had."
      aside={
        <button
          type="button"
          className="motion-tap flex h-[30px] shrink-0 items-center gap-[6px] rounded-[8px] px-[10px] text-[12.5px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
        >
          <Plus size={13} aria-hidden="true" />
          Add link
        </button>
      }
    >
      {links.length === 0 ? (
        <p className="py-[6px] text-[12.5px] leading-[17px] text-pg-muted">
          No custom links. This account works entirely inside the products —
          nothing is bolted onto the bottom of its nav.
        </p>
      ) : (
        links.map((name, i) => (
          <SettingRow
            key={name}
            label={
              <span className="flex items-center gap-[8px]">
                <ExternalLink size={14} aria-hidden="true" className="text-pg-muted" />
                {name}
              </span>
            }
            desc={hostFor(name)}
            last={i === links.length - 1}
          >
            {/* Admin-only for the money and back-office links, as an agency
                would actually set them. */}
            <Chip tone="inherit">
              {/billing|compliance|supplier|pricing|dms|rate/i.test(name)
                ? "Admins only"
                : "Everyone"}
            </Chip>
          </SettingRow>
        ))
      )}

      {links.length > 0 ? (
        <div className="mt-[12px] flex items-center gap-[9px] rounded-[9px] bg-[color-mix(in_oklab,#f59e0b_10%,var(--pg-surface))] px-[12px] py-[9px]">
          <TriangleAlert size={14} aria-hidden="true" className="shrink-0 text-[#8a5a00]" />
          <p className="flex-1 text-[12px] leading-[16px] text-[#8a5a00]">
            Links migrated from the old menu editor have no destination group.
            They show at the bottom of the nav until filed.
          </p>
          <button type="button" className="motion-tap shrink-0 text-[12px] leading-none font-semibold text-[#8a5a00] hover:underline">
            Review
          </button>
        </div>
      ) : null}
    </Card>
  );
}
