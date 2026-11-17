"use client";

import * as React from "react";
import { BadgePercent, Bot, Check, Crown, Rocket, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * Holiday Promos: the dummy landing page a promo row or card opens.
 *
 * A promo banner across the top of the page, then the offers. Placeholder
 * copy and prices — the real offers live in Rajat's "BF/CM/Holiday/EOY Offer
 * Details – 2026" sheet. Ashwin, Nov 17.
 */
const OFFERS = [
  {
    icon: Crown,
    name: "Agency Pro, annual",
    price: "$2,982",
    was: "$4,970",
    save: "40% off",
    points: ["Unlimited sub-accounts", "SaaS mode included", "Priority support"],
  },
  {
    icon: Bot,
    name: "AI Employee bundle",
    price: "$59",
    was: "$97",
    save: "39% off",
    points: ["Voice AI and Conversation AI", "Reviews AI replies", "Per sub-account, per month"],
  },
  {
    icon: Rocket,
    name: "Priority onboarding",
    price: "$499",
    was: "$997",
    save: "50% off",
    points: ["1:1 setup with a specialist", "Snapshot migration", "30 days of check-ins"],
  },
] as const;

export function HolidayPromosPage() {
  const { effective } = useTheme();
  const [banner, setBanner] = React.useState(true);
  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[16px] overflow-y-auto px-[var(--page-inset)] pb-[24px]"
    >
      {banner ? (
        <div
          role="status"
          className="flex items-center gap-[12px] rounded-[8px] bg-[var(--hr-primary-600)] px-[16px] py-[12px] text-white"
        >
          <BadgePercent size={20} aria-hidden="true" className="shrink-0" />
          <p className="min-w-0 flex-1 text-[14px] leading-[20px]">
            <span className="font-semibold">Black Friday–Cyber Monday:</span> up to 40% off plans and add-ons.
            Offers end Dec 6, 2026.
          </p>
          <a
            href="#offers"
            className="shrink-0 rounded-[4px] bg-white px-[12px] py-[6px] text-[13px] leading-[18px] font-semibold text-[var(--hr-primary-700)] hover:bg-[var(--hr-primary-50)]"
          >
            See offers
          </a>
          <button
            type="button"
            aria-label="Dismiss banner"
            onClick={() => setBanner(false)}
            className="grid size-[28px] shrink-0 place-items-center rounded-[4px] hover:bg-white/15"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <header className="flex flex-col gap-[4px]">
        <h1 className="text-[16px] leading-[24px] font-semibold text-[var(--hr-gray-900)]">Holiday Promos</h1>
        <p className="text-[13px] leading-[18px] text-[var(--hr-gray-600)]">
          Limited-time offers for your agency, Nov 23–Dec 6, 2026.
        </p>
      </header>

      <section id="offers" aria-label="Offers" className="grid grid-cols-1 gap-[16px] md:grid-cols-3">
        {OFFERS.map((o) => {
          const Icon = o.icon;
          return (
            <article
              key={o.name}
              className="flex flex-col gap-[12px] rounded-[12px] border border-[var(--hr-gray-200)] bg-white p-[16px] shadow-[0_1px_2px_rgba(16,24,40,0.05)]"
            >
              <div className="flex items-center justify-between gap-[8px]">
                <span className="grid size-[36px] place-items-center rounded-[8px] bg-[var(--hr-primary-50)] text-[var(--hr-primary-600)]">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="rounded-[2px] bg-[var(--hr-success-50,#ECFDF3)] px-[6px] py-[2px] text-[12px] leading-[16px] font-semibold text-[var(--hr-success-700,#067647)]">
                  {o.save}
                </span>
              </div>
              <div className="flex flex-col gap-[2px]">
                <h2 className="text-[14px] leading-[20px] font-semibold text-[var(--hr-gray-900)]">{o.name}</h2>
                <p className="flex items-baseline gap-[6px]">
                  <span className="text-[20px] leading-[28px] font-semibold text-[var(--hr-gray-900)]">{o.price}</span>
                  <span className="text-[13px] leading-[18px] text-[var(--hr-gray-500)] line-through">{o.was}</span>
                </p>
              </div>
              <ul className="flex flex-col gap-[6px]">
                {o.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-[8px] text-[13px] leading-[18px] text-[var(--hr-gray-700)]">
                    <Check size={14} aria-hidden="true" className="shrink-0 text-[var(--hr-primary-600)]" />
                    {pt}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="mt-auto h-[36px] rounded-[4px] bg-[var(--hr-primary-600)] px-[12px] text-[14px] leading-[20px] font-semibold text-white hover:bg-[var(--hr-primary-700)]"
              >
                Claim offer
              </button>
            </article>
          );
        })}
      </section>
    </div>
  );
}
