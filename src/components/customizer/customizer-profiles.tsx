"use client";

import * as React from "react";
import { planFor } from "@/components/nav/account-nav-profiles";
import {
  hasCapability,
  minPlanFor,
  type NavCapability,
  type PlanTier,
} from "@/design/plans";

/** Who may change what about the nav — the policies the agency flips. */
export interface AccessProfile {
  policies: Record<string, boolean>;
}

export interface CustomizerProfile {
  access: AccessProfile;
  /**
   * The account's own stylesheet. Top tier only, and it overrides every setting
   * in the Navigation tab — which is the whole point of it.
   */
  customCss: string;
  /** Agency intent: hand this account's dock to every new sub-account. */
  favoritesAsDefault: boolean;
}

const DEFAULT_ACCESS_POLICIES: Record<string, boolean> = {
  "Rename for themselves:user": true,
  "Rename for the whole account:admin": true,
  "Change grouping and icons:admin": true,
  "Build custom groups:admin": true,
  "Add custom links:admin": true,
};

export function defaultCustomizerProfile(): CustomizerProfile {
  return {
    access: { policies: { ...DEFAULT_ACCESS_POLICIES } },
    customCss: "",
    favoritesAsDefault: false,
  };
}

interface CustomizerProfilesValue {
  profileFor: (accountId: string) => CustomizerProfile;
  updateProfile: (
    accountId: string,
    recipe: (p: CustomizerProfile) => CustomizerProfile,
  ) => void;
  /**
   * Whose nav is on screen. Only this account's custom CSS is injected — see the
   * provider for why editing another account's stylesheet must not apply here.
   */
  setActiveAccount: (accountId: string) => void;
  /**
   * A prototype control: force every account onto one plan, or `null` to let each
   * account use the plan it is seeded with.
   */
  demoPlan: PlanTier | null;
  setDemoPlan: (plan: PlanTier | null) => void;
  planForAccount: (accountId: string) => PlanTier;
}

const CustomizerProfilesContext =
  React.createContext<CustomizerProfilesValue | null>(null);

export function useCustomizerProfiles(): CustomizerProfilesValue {
  const ctx = React.useContext(CustomizerProfilesContext);
  if (!ctx) {
    throw new Error(
      "useCustomizerProfiles must be used inside <CustomizerProfilesProvider>",
    );
  }
  return ctx;
}

/**
 * What one account's plan lets it change.
 *
 * Takes an account id rather than reading an ambient "current account" because
 * the Navigation tab edits an account the operator is *not* inside: every card
 * is handed an `account` prop and writes through `profileFor(account.id)`. A
 * no-argument hook would gate one client's settings by another's plan.
 */
export function usePlanFor(accountId: string): {
  plan: PlanTier;
  has: (cap: NavCapability) => boolean;
  min: (cap: NavCapability) => PlanTier;
} {
  const { planForAccount } = useCustomizerProfiles();
  const plan = planForAccount(accountId);
  return {
    plan,
    has: (cap) => hasCapability(plan, cap),
    min: minPlanFor,
  };
}

/**
 * Account-keyed nav policy — the one part of the Navigation tab that theme,
 * tuning and nav-layout do not already own.
 */
export function CustomizerProfilesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profiles, setProfiles] = React.useState<
    Record<string, CustomizerProfile>
  >({});
  const [activeAccountId, setActiveAccount] = React.useState<string>("");
  const [demoPlan, setDemoPlan] = React.useState<PlanTier | null>(null);

  const updateProfile = React.useCallback(
    (
      accountId: string,
      recipe: (p: CustomizerProfile) => CustomizerProfile,
    ) =>
      setProfiles((all) => {
        const current = all[accountId] ?? defaultCustomizerProfile();
        return { ...all, [accountId]: recipe(current) };
      }),
    [],
  );

  const planForAccount = React.useCallback(
    (accountId: string) => demoPlan ?? planFor(accountId),
    [demoPlan],
  );

  /*
   * Only the ACTIVE account's stylesheet is injected — never the one being
   * edited.
   *
   * The sub-account settings page is styled with the same `--pg-*` tokens as the
   * nav it configures, so injecting the edited account's CSS would restyle the
   * editor you are typing into: `.bg-pg-surface { display: none }` would delete
   * the textarea mid-keystroke. Switching into the account is how you see its
   * CSS, which is what the card's footer says.
   *
   * Read as extracted strings, not as the profile object: `profileFor` builds a
   * fresh default for any unseeded account, so an effect depending on the object
   * would re-run on every render forever.
   */
  const activeCss = profiles[activeAccountId]?.customCss ?? "";
  const cssActive =
    activeCss.trim() !== "" &&
    hasCapability(planForAccount(activeAccountId), "customCss");

  const styleRef = React.useRef<HTMLStyleElement | null>(null);
  /*
   * The latest CSS, readable by the effect that builds the node without being in
   * its dependency list. Without it, a node rebuilt because the account or the
   * plan changed — rather than because the text did — mounts empty and stays
   * empty, since the sync effect below has no reason to re-run.
   */
  const cssRef = React.useRef(activeCss);

  /*
   * Two effects on purpose. One effect owning both the node and its content
   * would tear the node down and rebuild it on every keystroke — a visible flash
   * and hundreds of node churns per edit. One effect mutating textContent with no
   * cleanup would leak the node on unmount and on every account switch. Split,
   * the node's lifetime follows the account and the plan, and content is a cheap
   * assignment.
   */
  React.useEffect(() => {
    if (!cssActive) return;
    const el = document.createElement("style");
    el.dataset.accountCss = activeAccountId;
    el.textContent = cssRef.current;
    // Last in head, so it wins against Tailwind's utilities at equal specificity.
    document.head.append(el);
    styleRef.current = el;
    return () => {
      el.remove();
      styleRef.current = null;
    };
  }, [cssActive, activeAccountId]);

  React.useEffect(() => {
    cssRef.current = activeCss;
    // textContent, never innerHTML: a stray `</style>` in the textarea must not
    // be able to break out of the element.
    if (styleRef.current) styleRef.current.textContent = activeCss;
  }, [activeCss]);

  const value = React.useMemo<CustomizerProfilesValue>(
    () => ({
      profileFor: (accountId) =>
        profiles[accountId] ?? defaultCustomizerProfile(),
      updateProfile,
      setActiveAccount,
      demoPlan,
      setDemoPlan,
      planForAccount,
    }),
    [profiles, updateProfile, demoPlan, planForAccount],
  );

  return (
    <CustomizerProfilesContext value={value}>
      {children}
    </CustomizerProfilesContext>
  );
}
