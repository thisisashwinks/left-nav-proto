"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { PageTitle, usePageChrome } from "@/components/page/page-header";
import { useCurrentAccountId } from "@/components/accounts/accounts-context";
import { BetaBanner, FlagCard } from "./labs-page";
import { SUB_ACCOUNT_FLAGS, type LabsFlag } from "./labs-data";
import { useLabs } from "./labs-state";

/**
 * Settings › Labs, inside a sub-account.
 *
 * The same beta programme from the other end. The agency's Labs decides
 * what is ON OFFER to each account; this is where the account answers.
 *
 * THE TWO COLUMNS, from down here. Visibility is the gate: a flag the
 * agency has not made visible does not appear on this page at all, and the
 * account has no way to know it exists — which is the point of having a
 * visibility column separate from an enable one. Enablement is the state
 * the agency hands over: it is what the switch below reads on first sight,
 * and from then on the account's own answer wins. So an agency can make a
 * beta available without taking it, and the account can take it; or the
 * agency can take it on the account's behalf, and the account can give it
 * back. Neither of those is expressible with one boolean, which is why
 * there are two.
 *
 * Deliberately NOT a roles model. There is no sub-account admin versus
 * sub-account user here, no permission checks, no "who may see Labs" —
 * Ashwin was explicit that the interesting mechanism is the agency's two
 * columns and not the org chart beneath them. Anyone looking at this page
 * is the person the agency was deciding about.
 *
 * One flag is real, as on the agency page: Switchyard's switch moves this
 * account between the two navigations and the sidebar changes beside you.
 * The rest are pictures.
 */
export function SubAccountLabsPage() {
  const { title: showTitle, description: showDesc } = usePageChrome();
  const [query, setQuery] = React.useState("");
  const { accountVisible, accountOn, setUserOn, startTrial } = useLabs();

  const id = useCurrentAccountId();
  const q = query.trim().toLowerCase();

  /*
   * What this account is allowed to see.
   *
   * Only Switchyard carries real per-account visibility, because it is the
   * only flag the agency page can actually set it on. The pictured ones
   * are always listed — a fixture that hid itself would read as the agency
   * having made a decision nobody made.
   */
  const flags = SUB_ACCOUNT_FLAGS.filter((f) => {
    if (f.id === "switchyard" && !accountVisible(id)) return false;
    return (
      q === "" ||
      f.name.toLowerCase().includes(q) ||
      f.headline.toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto w-full max-w-[1160px] px-[var(--page-inset)] pb-[24px]">
      <header>
        {showTitle ? (
          <>
            <PageTitle
              title="Labs"
              className="text-[20px] leading-[28px] font-semibold text-pg-heading"
            />
            {showDesc ? (
              <p className="mt-[2px] text-[13px] leading-[18px] text-pg-muted">
                Test out the new features before everyone else
              </p>
            ) : null}
          </>
        ) : null}

        <BetaBanner className={showTitle ? "mt-[16px]" : undefined} />

        {/*
          No tabs. The agency page has two because it is deciding for two
          audiences; from inside one account there is only this account,
          and a tab strip of one is a control that cannot be used.
        */}
        <div className="mt-[20px] flex justify-end">
          <div className="flex h-[36px] w-[230px] items-center gap-[9px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search features"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-[16px] pt-[16px]">
        {flags.map((flag: LabsFlag) => (
          <FlagCard
            key={flag.id}
            flag={flag}
            /*
              No `sub` prop, and that is the difference between the two
              pages rather than an omission. `sub` carries the agency's
              visibility line and its reach pill — facts about a DECISION
              the agency made about other people. From inside the account
              being decided about, the only thing left to show is the
              switch.
            */
            {...(flag.live
              ? {
                  on: accountOn(id),
                  onToggle: (next: boolean) => setUserOn(id, next),
                  onTry: () => startTrial("account"),
                }
              : {})}
          />
        ))}

        {flags.length === 0 ? (
          <p className="py-[32px] text-center text-[13px] leading-[18px] text-pg-muted">
            {q
              ? `No features match “${query}”`
              : "Your agency has not made any beta features available yet."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
