"use client";

import { ExternalLink, Plus, TriangleAlert } from "lucide-react";
import { Card, Chip, SettingRow } from "./controls";

/**
 * Custom links — the nav rows an agency adds itself.
 *
 * Prototype-only data: production's menu-link editor has no audience field and
 * no destination group, which is what the warning strip is about.
 */
export function NavLinksCard() {
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
      {(
        [
          ["Client portal", "portal.wpp-clients.com", "Everyone"],
          ["Support desk", "help.wpp.com", "Everyone"],
          ["Billing portal", "billing.wpp.com", "Admins only"],
        ] as const
      ).map(([name, url, who], i, arr) => (
        <SettingRow
          key={name}
          label={
            <span className="flex items-center gap-[8px]">
              <ExternalLink size={14} aria-hidden="true" className="text-pg-muted" />
              {name}
            </span>
          }
          desc={url}
          last={i === arr.length - 1}
        >
          <Chip tone="inherit">{who}</Chip>
        </SettingRow>
      ))}
      <div className="mt-[12px] flex items-center gap-[9px] rounded-[9px] bg-[color-mix(in_oklab,#f59e0b_10%,var(--pg-surface))] px-[12px] py-[9px]">
        <TriangleAlert size={14} aria-hidden="true" className="shrink-0 text-[#8a5a00]" />
        <p className="flex-1 text-[12px] leading-[16px] text-[#8a5a00]">
          2 links migrated from the old menu editor have no destination group. They show at the bottom of the nav until filed.
        </p>
        <button type="button" className="motion-tap shrink-0 text-[12px] leading-none font-semibold text-[#8a5a00] hover:underline">
          Review
        </button>
      </div>
    </Card>
  );
}
