"use client";

import * as React from "react";
import { saasTierFor as seededTierFor } from "@/components/nav/account-nav-profiles";
import {
  CUSTOM_NAV_SEATS,
  DEFAULT_AGENCY_PLAN,
  hasCapability,
  minPlanFor,
  type AgencyPlan,
  type NavCapability,
  type SaasTier,
} from "@/design/plans";

/**
 * The two pricing layers, and the one seat that sits between them.
 *
 *   The AGENCY PLAN is the workspace's own HighLevel subscription — one value
 *   for the whole session. It decides whether an agency admin may edit
 *   navigation at all, and on how many sub-accounts.
 *
 *   The SAAS TIER is what the agency resells each client on. One per
 *   sub-account. It decides what that client's own workspace holds.
 *
 * They used to be one field called `plan`, seeded per account, which made the
 * ladder unreadable: a per-tenant value cannot express "this agency may
 * customise one navigation", because the limit is about the agency and the
 * value lived on the tenant.
 */

/**
 * Why an account cannot be edited right now. `null` means it can.
 *
 * Returned rather than thrown, and specific rather than boolean, because the
 * two refusals need different words and a different way out: one is a tier you
 * do not have, the other is a seat you have already spent.
 */
/**
 * Whether the Edit nav control appears at all, and in what state.
 *
 * Three states rather than two, because who is refused decides HOW they are
 * refused. An agency admin meets a wall: the control stays, wears a lock and
 * opens the pricing modal — they are the one who can clear it, so hiding the
 * feature from them would be hiding the thing they might buy. A sub-account
 * admin cannot buy anything; the agency's plan is not theirs to change. Showing
 * them a lock would be advertising an upgrade to somebody with no way to make
 * it and no bill to pay it from, so for them the control is simply absent.
 *
 *   open    the pill edits
 *   locked  the pill wears a lock and opens the modal — agency only
 *   hidden  no pill at all — sub-account roles under any refusal
 */
export type EditAccess =
  | { kind: "open" }
  | { kind: "locked"; block: EditBlock }
  | { kind: "hidden" };

export type EditBlock =
  | { kind: "plan"; needs: AgencyPlan }
  | { kind: "seat"; holder: string };

interface NavProfilesValue {
  /** The workspace's own HighLevel plan. One per session. */
  agencyPlan: AgencyPlan;
  setAgencyPlan: (plan: AgencyPlan) => void;
  /** Whether the agency plan carries a capability at all. */
  has: (cap: NavCapability) => boolean;
  /** The lowest plan that would unlock it, for the upsell's copy. */
  min: (cap: NavCapability) => AgencyPlan;

  /**
   * The sub-account holding the agency's customised navigation, if any.
   *
   * One seat on $297, none on $97, unlimited on $497 — so this is only ever
   * consulted in the middle tier. Locked once claimed, per the Sep 8 decision:
   * the way to a second customised nav is the upgrade, not a reshuffle.
   */
  seatHolder: string | null;
  /** Claims the seat for an account, or no-ops if it already holds it. */
  claimSeat: (accountId: string) => void;
  /** Gives the seat back — what Discard does when nothing was kept. */
  releaseSeat: (accountId: string) => void;
  /** Null when this account may be edited; otherwise why not. */
  editBlockFor: (accountId: string) => EditBlock | null;

  /**
   * The whole question, answered once: does this person get the control?
   *
   * Takes the role because the answer is not a property of the plan alone —
   * see EditAccess. `isAgencyRole` rather than the NavRole union so this file
   * does not have to import the nav's own role model to ask one boolean.
   */
  editAccessFor: (accountId: string, isAgencyRole: boolean) => EditAccess;

  /** The tier this client is resold on. */
  saasTierFor: (accountId: string) => SaasTier;
  setSaasTier: (accountId: string, tier: SaasTier) => void;
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
 * The agency's own scope key.
 *
 * The agency editing ITS own nav never consumes a seat: the seat is the right
 * to customise a client's navigation, and the agency is not one of its own
 * clients. Without this the first thing an admin does — tidy their own nav —
 * would spend the allowance meant for the work they bought it for.
 */
export const AGENCY_SCOPE_ID = "agency";

export function NavProfilesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [agencyPlan, setAgencyPlan] =
    React.useState<AgencyPlan>(DEFAULT_AGENCY_PLAN);
  const [seatHolder, setSeatHolder] = React.useState<string | null>(null);
  /** Upgrades made in this session, over the seeded tier. */
  const [tierOverrides, setTierOverrides] = React.useState<
    Record<string, SaasTier>
  >({});

  const has = React.useCallback(
    (cap: NavCapability) => hasCapability(agencyPlan, cap),
    [agencyPlan],
  );

  const editBlockFor = React.useCallback(
    (accountId: string): EditBlock | null => {
      // The agency's own nav is outside the allowance entirely — see the note
      // on AGENCY_SCOPE_ID.
      if (!hasCapability(agencyPlan, "editNav")) {
        return { kind: "plan", needs: minPlanFor("editNav") };
      }
      if (accountId === AGENCY_SCOPE_ID) return null;
      if (CUSTOM_NAV_SEATS[agencyPlan] === Number.POSITIVE_INFINITY) return null;
      if (seatHolder === null || seatHolder === accountId) return null;
      return { kind: "seat", holder: seatHolder };
    },
    [agencyPlan, seatHolder],
  );

  const editAccessFor = React.useCallback(
    (accountId: string, isAgencyRole: boolean): EditAccess => {
      const block = editBlockFor(accountId);
      // The agency is the one who can clear a block, so it is shown the block.
      if (isAgencyRole) return block ? { kind: "locked", block } : { kind: "open" };
      if (block !== null) return { kind: "hidden" };
      /*
       * One more refusal that only exists for a client, and it is the reason
       * this cannot just read `editBlockFor`.
       *
       * On $297 with the seat still UNCLAIMED that function returns null — no
       * block — because from the agency's side there is nothing stopping them:
       * clicking Edit nav is how the seat gets claimed. A client clicking the
       * same control would be taking the agency's single allowance for
       * themselves, first-come-first-served, and the agency would find its one
       * customised navigation spent on whichever tenant happened to open the
       * nav first. So a client sees the control only once the seat is already
       * theirs. Granting it stays the agency's move.
       */
      const seats = CUSTOM_NAV_SEATS[agencyPlan];
      if (seats === Number.POSITIVE_INFINITY) return { kind: "open" };
      if (accountId === AGENCY_SCOPE_ID) return { kind: "open" };
      return seatHolder === accountId ? { kind: "open" } : { kind: "hidden" };
    },
    [agencyPlan, editBlockFor, seatHolder],
  );

  const claimSeat = React.useCallback(
    (accountId: string) => {
      if (accountId === AGENCY_SCOPE_ID) return;
      setSeatHolder((held) => held ?? accountId);
    },
    [],
  );

  const releaseSeat = React.useCallback((accountId: string) => {
    setSeatHolder((held) => (held === accountId ? null : held));
  }, []);

  const saasTierFor = React.useCallback(
    (accountId: string): SaasTier =>
      tierOverrides[accountId] ?? seededTierFor(accountId),
    [tierOverrides],
  );

  const setSaasTier = React.useCallback(
    (accountId: string, tier: SaasTier) =>
      setTierOverrides((all) => ({ ...all, [accountId]: tier })),
    [],
  );

  const value = React.useMemo<NavProfilesValue>(
    () => ({
      agencyPlan,
      setAgencyPlan,
      has,
      min: minPlanFor,
      seatHolder,
      claimSeat,
      releaseSeat,
      editBlockFor,
      editAccessFor,
      saasTierFor,
      setSaasTier,
    }),
    [
      agencyPlan,
      has,
      seatHolder,
      claimSeat,
      releaseSeat,
      editBlockFor,
      editAccessFor,
      saasTierFor,
      setSaasTier,
    ],
  );

  return (
    <NavProfilesContext value={value}>{children}</NavProfilesContext>
  );
}
