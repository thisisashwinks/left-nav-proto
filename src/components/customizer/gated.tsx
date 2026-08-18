"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { PLAN_PRICES, type NavCapability } from "@/design/plans";
import { Card, Chip, SettingRow } from "./controls";
import { usePlanFor } from "./customizer-profiles";

/**
 * What a setting above this account's plan looks like.
 *
 * Three shapes, because a plan gate lands in three places: on one row, on a
 * whole card, and on one choice inside a picker. All three compose the existing
 * kit rather than forking it, so a locked row is the same row with one chip in
 * it — the agency can still read what they would get, which is the only reason
 * to draw a locked control at all instead of hiding it.
 *
 * Gating is read-side only. A locked row renders the value the account has
 * *stored*, disabled — it never writes a reset, so downgrading an account and
 * upgrading it again restores what it had. The one exception is custom CSS,
 * where the gate also has to suppress the effect, or a downgraded account keeps
 * its stylesheet applied; that lives in the provider.
 */

/** The tier chip a locked control carries. Null when the account has the plan. */
export function LockBadge({
  cap,
  accountId,
}: {
  cap: NavCapability;
  accountId: string;
}) {
  const { has, min } = usePlanFor(accountId);
  if (has(cap)) return null;
  return <Chip tone="locked">{PLAN_PRICES[min(cap)]} plan</Chip>;
}

/**
 * A `SettingRow` whose control locks below a plan.
 *
 * `children` is a render prop rather than a node so the caller threads `locked`
 * into whichever control it uses. The alternative — injecting `disabled` via
 * `cloneElement` — is invisible and breaks the moment a caller wraps its control
 * in a fragment.
 */
export function GatedRow({
  cap,
  accountId,
  label,
  desc,
  children,
  last = false,
  indent = false,
}: {
  cap: NavCapability;
  accountId: string;
  label: React.ReactNode;
  desc?: React.ReactNode;
  children: (locked: boolean) => React.ReactNode;
  last?: boolean;
  indent?: boolean;
}) {
  const { has, min } = usePlanFor(accountId);
  const locked = !has(cap);
  return (
    <SettingRow
      label={label}
      desc={
        locked ? (
          <>
            {desc}
            {desc ? " " : null}
            Available on the {PLAN_PRICES[min(cap)]} plan.
          </>
        ) : (
          desc
        )
      }
      last={last}
      indent={indent}
    >
      {/* Chip left of the control, so the controls stay in one right-aligned
          column down the card. */}
      {locked ? <Chip tone="locked">{PLAN_PRICES[min(cap)]}</Chip> : null}
      {children(locked)}
    </SettingRow>
  );
}

/**
 * A whole card that locks below a plan.
 *
 * The header stays; the body is replaced by the same inset strip the tree card
 * uses when structure needs a custom tree, so "you need something you do not
 * have yet" looks the same whether the blocker is a grouping mode or a plan.
 * One upgrade action per card, never per row.
 */
export function GatedCard({
  cap,
  accountId,
  title,
  sub,
  aside,
  children,
}: {
  cap: NavCapability;
  accountId: string;
  title: string;
  sub?: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { has, min } = usePlanFor(accountId);
  const price = PLAN_PRICES[min(cap)];

  if (has(cap)) {
    return (
      <Card title={title} sub={sub} aside={aside}>
        {children}
      </Card>
    );
  }

  return (
    <Card title={title} sub={sub} aside={<Chip tone="locked">{price} plan</Chip>}>
      <div className="flex items-center gap-[10px] rounded-[10px] bg-pg-bg px-[12px] py-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
        <Lock size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
        <p className="min-w-0 flex-1 text-[12px] leading-[16px] text-pg-text">
          Custom CSS is on the {price} plan. It loads after every setting in this
          tab and overrides them.
        </p>
        <button
          type="button"
          className="motion-tap h-[30px] shrink-0 rounded-[8px] bg-brand px-[11px] text-[12.5px] leading-none font-medium text-brand-fg active:scale-[0.98]"
        >
          Upgrade this account
        </button>
      </div>
    </Card>
  );
}

/**
 * The faint closing line a card uses to explain a locked choice.
 *
 * Both the organisation and density cards already end with exactly this element,
 * so a locked tile explains itself in the slot readers already look at.
 */
export function PlanNote({
  cap,
  accountId,
  children,
}: {
  cap: NavCapability;
  accountId: string;
  children: React.ReactNode;
}) {
  const { has } = usePlanFor(accountId);
  if (has(cap)) return null;
  return (
    <p className="mt-[12px] text-[11.5px] leading-[16px] text-pg-faint">
      {children}
    </p>
  );
}
