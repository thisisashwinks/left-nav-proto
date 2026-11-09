"use client";

import * as React from "react";
import type { Account } from "@/components/accounts/accounts-data";
import { useBrand } from "@/components/accounts/brand-store";
import { BrandAssetRow } from "./logo-upload-field";
import { cn } from "@/lib/utils";

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

      {/*
        The same two rows the sub-account's Business profile draws, from the
        same component. Ashwin, Nov 6: "Do the same for agency as well."
        
        Worth stating because the two pages are edited by different people:
        an agency admin setting the agency's own brand and a sub-account
        admin setting theirs are doing one job, and the field should not
        change shape depending on which chair you are in.
      */}
      <div className="flex flex-col gap-[20px] p-[16px]">
        {/*
          Side by side on the agency's full-width page. Ashwin, Nov 6.
        
          Stacked, each row spans the whole tab — so the preview sits at the
          far left and its own Upload and Remove end up most of a screen away
          at the far right, with nothing in between. The buttons stop reading
          as belonging to the asset beside them.
        
          Two columns put each asset's controls back within reach of its
          preview, and the pair reads as one decision taken twice rather than
          two stacked settings. One column under `lg`, where half a tab is no
          longer wide enough to hold the row without wrapping.
        
          The sub-account's Business profile stays stacked: that card shares
          its page with a second column already, so it is never full width.
        */}
        <div
          className={cn(
            "grid grid-cols-1 gap-y-[20px] lg:grid-cols-2",
            /*
              A rule between the columns, drawn by the SECOND one.
        
              The gap goes to zero and each column pads itself instead, so the
              line lands exactly halfway between them. Left as a 24px gap with a
              border laid on top of it, the rule would sit hard against the right
              column and read as that column's edge rather than as the seam
              between two.
        
              Only at `lg`, where the two columns exist. Stacked below that, a
              vertical rule would be a line down the side of a single column.
            */
            "lg:gap-x-0 lg:[&>*:first-child]:pr-[28px]",
            "lg:[&>*+*]:border-l lg:[&>*+*]:border-pg-border lg:[&>*+*]:pl-[28px]",
            /* And a little air before whatever follows the pair. */
            "mb-[12px]",
          )}
        >
          <BrandAssetRow
            label="Full logo"
            hint="Your primary logo, displayed in emails and the classic sidebar."
            spec="Ideal: 350 × 180 px · Max 2.5 MB"
            aspect="wide"
            {...(account.wordmarkSrc ? { src: account.wordmarkSrc } : {})}
            onPick={(src) => set(account.id, "wordmarkSrc", src)}
            onRemove={() => clear(account.id, "wordmarkSrc")}
          />

          <BrandAssetRow
            label="Sidebar icon"
            hint="A compact version of your logo, displayed in the new sidebar."
            spec="Square · Min 128 × 128 px · Max 2.5 MB"
            aspect="square"
            {...(account.logoSrc ? { src: account.logoSrc } : {})}
            fallback={account.logo}
            onPick={(src) => set(account.id, "logoSrc", src)}
            onRemove={() => clear(account.id, "logoSrc")}
          />
        </div>

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
