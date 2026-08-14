"use client";

import type { Account } from "@/components/accounts/accounts-data";
import {
  GROUPING_BLURBS,
  GROUPING_LABELS,
  GROUPING_MODES,
  seedCustomGroups,
  type GroupingMode,
} from "@/components/nav/grouping";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import { cn } from "@/lib/utils";
import { Card } from "./controls";

/**
 * Which tree the account is on.
 *
 * The mode only — what the tree contains is the next card's job. Bound to the
 * edited account's layout profile rather than the session nav, so customizing
 * one client never rearranges another; when that account is also the active
 * session, updateProfile writes the live store and the real nav moves with it.
 */
export function NavOrganisationCard({ account }: { account: Account }) {
  const layout = useNavLayout();
  const state = layout.profileFor(account.id);

  return (
    <Card
      title="How the nav is organised"
      sub="Four views of one catalogue. Switching is lossless — nothing has to be re-filed."
    >
      <div className="grid grid-cols-2 gap-[10px] pt-[4px] xl:grid-cols-4">
        {GROUPING_MODES.map((mode) => (
          <ModeCard
            key={mode}
            mode={mode}
            selected={state.grouping === mode}
            onSelect={() =>
              layout.updateProfile(account.id, (s) =>
                s.grouping === mode
                  ? s
                  : {
                      ...s,
                      grouping: mode,
                      customGroups:
                        mode === "custom" ? seedCustomGroups(s) : s.customGroups,
                    },
              )
            }
          />
        ))}
      </div>

      {/*
        Says which of the four is editable, because that is the question the
        cards raise and cannot answer: three are views of what ships, one is
        this account's own.
      */}
      <p className="mt-[12px] text-[11.5px] leading-[16px] text-pg-faint">
        {state.grouping === "custom"
          ? "This account has its own tree. Edit it in Groups and rows below — move products, add groups, pull rows out of groups."
          : `${GROUPING_LABELS[state.grouping]} is the tree that ships. Renaming and icons work on it as-is; moving products or adding groups makes this account a custom copy of it, seeded from what you see.`}
      </p>
    </Card>
  );
}

function ModeCard({
  mode,
  selected,
  onSelect,
}: {
  mode: GroupingMode;
  selected: boolean;
  onSelect: () => void;
}) {
  const lines = mode === "flat" ? 6 : 3;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "motion-tap flex flex-col gap-[8px] rounded-[10px] p-[11px] text-left",
        selected
          ? "bg-[color-mix(in_oklab,var(--brand)_6%,var(--pg-surface))] shadow-[inset_0_0_0_1.5px_var(--brand)]"
          : "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      <span className="flex h-[52px] w-full flex-col justify-center gap-[4px] overflow-hidden rounded-[7px] bg-pg-bg px-[9px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {Array.from({ length: lines }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-[4px] shrink-0 rounded-full",
              i % 3 === 0 && lines < 6 ? "w-full bg-[color-mix(in_oklab,var(--brand)_35%,var(--pg-border))]" : "w-2/3 bg-pg-border",
            )}
          />
        ))}
      </span>
      <span className="text-[12.5px] leading-[16px] font-semibold text-pg-heading">
        {GROUPING_LABELS[mode]}
      </span>
      <span className="text-[11px] leading-[15px] text-pg-muted">
        {GROUPING_BLURBS[mode]}
      </span>
    </button>
  );
}
