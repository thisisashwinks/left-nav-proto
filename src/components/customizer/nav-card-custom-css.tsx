"use client";

import * as React from "react";
import type { Account } from "@/components/accounts/accounts-data";
import { Chip, CodeArea } from "./controls";
import { usePlanFor, useCustomizerProfiles } from "./customizer-profiles";
import { GatedCard } from "./gated";

/** Shown as placeholder, not inserted — a hint at the shape, not a starting value. */
const EXAMPLE = `[data-nav-theme="dark"] {
  --nav: #101828;
  --nav-fg: #f9fafb;
}`;

/**
 * The top tier's escape hatch.
 *
 * Last card in the tab on purpose: it loads after every setting above it and
 * overrides them, so it reads in the order it applies. The card states that
 * rather than trying to grey out the other six — telling the truth about
 * precedence is both cheaper and more honest than pretending the cards above
 * have been disabled.
 *
 * Only the account you are *inside* has its stylesheet injected. The provider
 * explains why: this settings page wears the same tokens as the nav it
 * configures, so applying the edited account's CSS here would let a rule delete
 * the textarea you are typing into.
 */
export function NavCustomCssCard({ account }: { account: Account }) {
  const profiles = useCustomizerProfiles();
  const { has } = usePlanFor(account.id);
  const stored = profiles.profileFor(account.id).customCss;

  /*
   * Local while typing, committed on a short delay. Writing every keystroke into
   * the store would re-render the whole tab per character, and on the active
   * account it would push a new stylesheet down with every letter — including the
   * half-finished selectors you pass through on the way to a valid one.
   *
   * Seeded once from the store, which is safe because the card is keyed by
   * account at the call site: arriving at a different account remounts it rather
   * than needing an effect to reset the draft.
   */
  const [draft, setDraft] = React.useState(stored);
  const dirty = draft !== stored;

  React.useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      profiles.updateProfile(account.id, (p) => ({ ...p, customCss: draft }));
    }, 300);
    return () => clearTimeout(timer);
  }, [draft, dirty, account.id, profiles]);

  return (
    <GatedCard
      cap="customCss"
      accountId={account.id}
      title="Custom CSS"
      sub="Loads last, so it wins. The way out when a setting above does not go far enough."
    >
      {draft.trim() !== "" ? (
        <div className="mb-[10px] flex items-center gap-[8px]">
          <Chip tone="metered">Active</Chip>
          <p className="min-w-0 flex-1 text-[12px] leading-[16px] text-pg-text">
            Custom CSS is active. It overrides the settings above.
          </p>
        </div>
      ) : null}

      <CodeArea
        label="Custom CSS"
        value={draft}
        onChange={setDraft}
        placeholder={EXAMPLE}
        disabled={!has("customCss")}
      />

      <p className="mt-[10px] text-[11.5px] leading-[16px] text-pg-faint">
        Target the nav&apos;s own attributes — <code>[data-nav-theme]</code>,{" "}
        <code>[data-scroll-region]</code> — rather than utility classes, which are
        generated and will change. Applies inside this sub-account&apos;s
        workspace: switch into the account to see it.
      </p>
    </GatedCard>
  );
}
