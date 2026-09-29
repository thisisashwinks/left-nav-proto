"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { showToast } from "@/components/page/toast";
import { SectionCard, SwitchRow, type SectionProps } from "./edit-controls";
import { Divider, SubHeading } from "./advanced-controls";

/** 99 — Advanced settings ▸ Booking channels. */
export function BookingChannelsSection({ draft, patch }: SectionProps) {
  return (
    <SectionCard
      title="Booking channels"
      description="Set up how this calendar receives bookings from external platforms."
    >
      <div className="flex flex-col gap-[12px]">
        <h3 className="text-[16px] leading-[22px] text-pg-heading">
          Reserve with Google [Deprecated]
        </h3>
        <div
          role="note"
          className="flex gap-[10px] rounded-[8px] bg-[var(--pg-warn-bg)] px-[16px] py-[14px] text-[14px] leading-[22px] text-[var(--pg-warn-fg)] shadow-[inset_0_0_0_1px_var(--pg-warn-border,color-mix(in_oklab,var(--pg-warn-fg)_25%,transparent))]"
        >
          <AlertTriangle
            size={18}
            aria-hidden="true"
            className="mt-[2px] shrink-0 text-[var(--pg-warn-icon,var(--pg-warn-fg))]"
          />
          <div className="flex flex-col gap-[12px]">
            <p>
              Google has deprecated <strong className="font-semibold">Reserve with Google (Local Services Ads)</strong>.
              New connections or changes to existing connections are no longer supported. To
              continue receiving bookings from Google, use{" "}
              <strong className="font-semibold">Google Organic Booking</strong> instead.
            </p>
            <div className="flex flex-wrap items-center gap-x-[72px] gap-y-[8px] font-semibold">
              <a
                href="https://help.gohighlevel.com/"
                target="_blank"
                rel="noreferrer"
                className="hover:underline"
              >
                View setup instructions
              </a>
              <button
                type="button"
                onClick={() => showToast("Google Organic Booking is set up in Settings ▸ Integrations.")}
                className="group flex items-center gap-[8px] hover:underline"
              >
                Configure
                <ArrowRight
                  size={16}
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-[2px]"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Divider />

      <div className="flex flex-col gap-[16px]">
        <SubHeading description="Allow this calendar to appear in the Client portal booking list.">
          Client portal booking
        </SubHeading>
        <SwitchRow
          label="Client portal booking"
          checked={draft.clientPortalBooking}
          onChange={(v) => patch({ clientPortalBooking: v })}
        />
      </div>
    </SectionCard>
  );
}
