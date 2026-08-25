"use client";

import * as React from "react";
import { planFor } from "@/components/nav/account-nav-profiles";
import {
  hasCapability,
  minPlanFor,
  type NavCapability,
  type PlanTier,
} from "@/design/plans";

/**
 * Per-account nav policy: which plan an account is on, and therefore what its
 * nav is allowed to do.
 *
 * This used to be the customizer's profile store, and carried a per-account
 * `customCss` string that the provider injected into <head>. When the Navigation
 * tab went (Aug 25) it took `CodeArea` with it — the only writer that store ever
 * had — so the profiles map could never be anything but empty and the injection
 * effects could never fire. The dead half is gone rather than left dormant; the
 * `customCss` capability stays declared in `plans.ts`, so restoring the feature
 * is a matter of adding an editor, not of rebuilding the gate.
 */

interface NavProfilesValue {
  /**
   * A prototype control: force every account onto one plan, or `null` to let each
   * account use the plan it is seeded with.
   */
  demoPlan: PlanTier | null;
  setDemoPlan: (plan: PlanTier | null) => void;
  planForAccount: (accountId: string) => PlanTier;
}

const NavProfilesContext = React.createContext<NavProfilesValue | null>(null);

export function useNavProfiles(): NavProfilesValue {
  const ctx = React.useContext(NavProfilesContext);
  if (!ctx) {
    throw new Error("useNavProfiles must be used inside <NavProfilesProvider>");
  }
  return ctx;
}

/**
 * What one account's plan lets it change.
 *
 * Takes an account id rather than reading an ambient "current account". That was
 * originally because the Navigation tab gated a client the operator was not
 * inside; in-place editing always edits the current account, but agency scope
 * still asks for "agency" while a sub-account is loaded, so the argument earns
 * its keep.
 */
export function usePlanFor(accountId: string): {
  plan: PlanTier;
  has: (cap: NavCapability) => boolean;
  min: (cap: NavCapability) => PlanTier;
} {
  const { planForAccount } = useNavProfiles();
  const plan = planForAccount(accountId);
  return {
    plan,
    has: (cap) => hasCapability(plan, cap),
    min: minPlanFor,
  };
}

export function NavProfilesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [demoPlan, setDemoPlan] = React.useState<PlanTier | null>(null);

  const planForAccount = React.useCallback(
    (accountId: string) => demoPlan ?? planFor(accountId),
    [demoPlan],
  );

  const value = React.useMemo<NavProfilesValue>(
    () => ({ demoPlan, setDemoPlan, planForAccount }),
    [demoPlan, planForAccount],
  );

  return <NavProfilesContext value={value}>{children}</NavProfilesContext>;
}
