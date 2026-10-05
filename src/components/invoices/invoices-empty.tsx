"use client";

import * as React from "react";
import { Info, Plus, Search, X } from "lucide-react";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";

/*
 * Dismissed once, gone for the session. A module flag rather than component
 * state, so leaving Invoices and coming back does not bring it back — but a
 * reload does, which is what "for now" means in a prototype.
 */
let gatewayBannerDismissed = false;

/**
 * The new account's one blocker: nothing can be paid until a gateway is
 * connected. Brand-tinted rather than warning-yellow — it is the next step,
 * not a fault — and mixed over the surface so it still reads as a card on a
 * tinted canvas and in dark mode.
 */
export function GatewayBanner() {
  const [dismissed, setDismissed] = React.useState(() => gatewayBannerDismissed);
  if (dismissed) return null;
  return (
    <div
      role="status"
      className="flex shrink-0 items-start gap-[10px] rounded-[10px] bg-[color-mix(in_srgb,var(--brand)_6%,var(--pg-surface))] px-[16px] py-[12px] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--brand)_22%,transparent)]"
    >
      <Info size={16} aria-hidden="true" className="mt-[2px] shrink-0 text-brand" />
      <div className="flex min-w-0 flex-1 flex-col items-start gap-[10px]">
        <p className="text-[14px] leading-[20px] font-medium text-brand">
          Connect at least one payment gateway to start receiving payments
        </p>
        <OutlineButton onClick={() => showToast("Opening payment integrations…")}>
          Integrate payment gateway
        </OutlineButton>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => {
          gatewayBannerDismissed = true;
          setDismissed(true);
        }}
        className="motion-tap -mt-[2px] -mr-[6px] flex size-[28px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg hover:text-pg-text-strong"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * The table body of an account with no invoices yet.
 *
 * Under the column headers rather than instead of them, so the first-run
 * screen already shows what the list will hold. The mark is drawn from the
 * brand token — no image, no fixed white — so it sits on any surface.
 */
export function InvoicesEmptyBody({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-[6px] px-[16px] py-[40px] text-center">
      <span className="mb-[8px] flex size-[56px] items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] text-brand">
        <Search size={22} aria-hidden="true" />
      </span>
      <p className="text-[16px] leading-[22px] font-semibold text-pg-heading">
        No invoices to show yet
      </p>
      <p className="text-[13px] leading-[18px] text-pg-muted">
        Create your first invoice to bill a customer.
      </p>
      <div className="mt-[12px]">
        <PrimaryButton onClick={onCreate}>
          <Plus size={16} aria-hidden="true" />
          New invoice
        </PrimaryButton>
      </div>
    </div>
  );
}
