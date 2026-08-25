"use client";

import * as React from "react";
import type { Account } from "@/components/accounts/accounts-data";
import { useBrand } from "@/components/accounts/brand-store";
import { LogoUploadField } from "./logo-upload-field";

/**
 * Both logos, in one card, with what the nav will do with them written down.
 *
 * Production splits these across two pages with different copy and no
 * statement of consequence: White Label asks an agency for a 350×180 logo, and
 * Business Profile asks a sub-account for a "Business Logo" of the same size,
 * and neither says where it goes. An agency uploading a square crop into a
 * field captioned 350×180 finds out what happened by looking at the nav.
 *
 * So the pair sits together and the rule is stated. There is no picker: which
 * asset appears follows from which ones exist, and the ladder below is the
 * whole specification.
 */
export function BrandCard({ account }: { account: Account }) {
  const { set, clear } = useBrand();

  return (
    <section className="w-full rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <header className="px-[16px] pt-[16px]">
        <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          Logo
        </h3>
        <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
          Upload both. The navigation picks whichever fits the space it has.
        </p>
      </header>

      <div className="flex flex-col gap-[20px] p-[16px]">
        <LogoUploadField
          label="Wide logo"
          hint="Shown in the navigation header. Around 4:1 reads best — a square crop here comes out small."
          aspect="wide"
          {...(account.wordmarkSrc ? { src: account.wordmarkSrc } : {})}
          onPick={(src) => set(account.id, "wordmarkSrc", src)}
          onRemove={() => clear(account.id, "wordmarkSrc")}
        />

        <LogoUploadField
          label="Square mark"
          hint="Shown in the account rail and the collapsed navigation, where a wide logo will not fit."
          aspect="square"
          {...(account.logoSrc ? { src: account.logoSrc } : {})}
          fallback={account.logo}
          onPick={(src) => set(account.id, "logoSrc", src)}
          onRemove={() => clear(account.id, "logoSrc")}
        />

        <FallbackLadder account={account} />
      </div>
    </section>
  );
}

/**
 * What the nav header will show, given what is uploaded right now.
 *
 * Live rather than a static help paragraph: the interesting moment is removing
 * an asset and watching the answer change, which is exactly when someone
 * wonders whether they have broken something.
 */
function FallbackLadder({ account }: { account: Account }) {
  const rungs = [
    {
      active: Boolean(account.wordmarkSrc),
      title: "Wide logo, on its own",
      body: "The artwork already carries the name, so no text is set beside it.",
    },
    {
      active: !account.wordmarkSrc && Boolean(account.logoSrc),
      title: "Square mark, plus the name as text",
      body: "What most accounts show.",
    },
    {
      active: !account.wordmarkSrc && !account.logoSrc,
      title: "Initials, plus the name as text",
      body: "Drawn from the account name. Nothing to upload for this to work.",
    },
  ];

  return (
    <div className="rounded-[10px] bg-pg-bg p-[12px]">
      <span className="text-[12px] leading-[16px] font-semibold tracking-[0.4px] text-pg-faint uppercase">
        In the navigation
      </span>
      <ul className="mt-[8px] flex flex-col gap-[6px]">
        {rungs.map((rung) => (
          <li key={rung.title} className="flex items-start gap-[8px]">
            <span
              aria-hidden="true"
              className={
                rung.active
                  ? "mt-[6px] size-[6px] shrink-0 rounded-full bg-brand"
                  : "mt-[6px] size-[6px] shrink-0 rounded-full bg-pg-border"
              }
            />
            <span className="min-w-0">
              <span
                className={
                  rung.active
                    ? "text-[13px] leading-[18px] font-medium text-pg-heading"
                    : "text-[13px] leading-[18px] text-pg-faint"
                }
              >
                {rung.title}
                {rung.active ? " — now" : null}
              </span>
              <span className="block text-[12.5px] leading-[17px] text-pg-muted">
                {rung.body}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
