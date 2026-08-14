"use client";

import { ExternalLink } from "lucide-react";

/**
 * Every production tab this proposal does not touch.
 *
 * Drawn as a stub on purpose: the point of the page is that ten tabs stay
 * exactly as they ship and one is added, so a reviewer should see the tab
 * present and unchanged rather than a redesigned version of it.
 */
export function ProductionStubTab({ label }: { label: string }) {
  return (
    <section className="w-full rounded-[12px] bg-pg-surface px-[24px] py-[40px] text-center shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">{label}</h3>
      <p className="mx-auto mt-[6px] max-w-[440px] text-[13px] leading-[18px] text-pg-muted">
        Unchanged from production. This proposal adds the Navigation tab and
        leaves the rest of this page as it ships.
      </p>
      <span className="mt-[12px] inline-flex items-center gap-[6px] text-[13px] leading-none font-medium text-pg-faint">
        <ExternalLink size={13} aria-hidden="true" />
        Lives in the live app today
      </span>
    </section>
  );
}
