"use client";

import * as React from "react";

/**
 * Who is on the new navigation, as Labs decides it.
 *
 * This is the rollout, not a preference. Switchyard ships behind a beta
 * flag, and the flag has two scopes that answer separately: the agency
 * switches it on for its own sidebar, and then decides, account by account,
 * which of its sub-accounts get it. Until Oct 8 the prototype modelled that
 * as one global `navGeneration` axis in the tuning panel — which is the
 * right control for "show me the old one" and the wrong model for "how does
 * this actually reach people".
 *
 * Held above the shell rather than inside the Labs page, because the page is
 * not the only reader: the shell builds a different sidebar depending on the
 * answer. A page that owned this state could change its own switches and
 * nothing else.
 *
 * Session-only, like every other store here. A rollout that survived a
 * reload would be claiming a backend this prototype does not have.
 */

/** One sub-account's two answers about the flag. */
export interface AccountAccess {
  /** Whether the account can see the beta exists. */
  visible: boolean;
  /** Whether it is on for them. Only ever true where `visible` is. */
  enabled: boolean;
}

export interface LabsState {
  /** The agency's own sidebar. On, it is the new nav. */
  agencyOn: boolean;
  setAgencyOn: (on: boolean) => void;
  /** Per sub-account, by account id. Absent means the default below. */
  access: Record<string, AccountAccess>;
  setAccess: (next: Record<string, AccountAccess>) => void;
  /**
   * What the sub-account's own admin has since chosen, by account id.
   *
   * Separate from `access` because they are different people's answers.
   * The agency sets the two columns; the sub-account then decides for
   * itself, inside the room the agency left it. Merging them into one
   * boolean would lose the thing the two columns exist to express — an
   * agency that has made a beta available but not taken it would be
   * indistinguishable from one that has forbidden it.
   */
  userOn: Record<string, boolean>;
  setUserOn: (id: string, on: boolean) => void;
  /** Whether a sub-account may see the flag in its own Labs at all. */
  accountVisible: (id: string) => boolean;
  /**
   * The scope currently running the new nav on trial, if any.
   *
   * Test mode, in the sense Stripe and Razorpay use it: the real workspace
   * with the new nav switched on over it, a band across the top saying so,
   * and one control to leave. Separate from `agencyOn` and `access`
   * because it is a DIFFERENT KIND of answer — those are a rollout
   * decision that outlives the session, this is a look that is expected to
   * end. Folding a trial into the rollout would mean someone who glanced
   * at the nav on Tuesday being counted as having adopted it.
   */
  trial: "agency" | "account" | null;
  startTrial: (scope: "agency" | "account") => void;
  endTrial: () => void;
  /** Whether this account is on the new nav. The shell's one question. */
  accountOn: (id: string) => boolean;
}

/**
 * What an account not named in `access` gets.
 *
 * Visible and enabled: a fleet mid-rollout is mostly ON, with a handful
 * left behind, not the other way round. Seeding the opposite would have
 * opened the prototype on the legacy nav — technically a faithful "day one
 * of a rollout" and useless as the default view of a prototype whose whole
 * subject is the new one.
 */
const DEFAULT_ACCESS: AccountAccess = { visible: true, enabled: true };

/**
 * The accounts deliberately left on the old nav.
 *
 * Two, and both on the rail, so the Sub-Account tab opens on a list that
 * has something to do. A table where every row already says Enabled
 * demonstrates the control and not the decision — the interesting state is
 * the partial rollout, which is where every real agency actually lives.
 *
 * `brightpath` and `fadeco` rather than the account the session starts in:
 * the first thing anyone sees has to be the thing being proposed, and
 * landing on the legacy nav would make Switchyard look like the variant.
 *
 * Exported because White Label reads it: its custom CSS/JS demo needs an
 * account that starts on the OLD nav, so that enabling Switchyard for it
 * reveals code written against a sidebar that is no longer there. Sharing
 * the constant rather than the string is what keeps that demo pointed at a
 * legacy account if this list is ever reseeded — a duplicated "brightpath"
 * would go on compiling while quietly aiming at an account now on the new
 * nav, which is the worst kind of fixture drift: silent, and only visible
 * to whoever is giving the demo.
 */
export const SEEDED_LEGACY = ["brightpath", "fadeco"] as const;

const LabsContext = React.createContext<LabsState>({
  agencyOn: true,
  setAgencyOn: () => {},
  access: {},
  setAccess: () => {},
  trial: null,
  startTrial: () => {},
  endTrial: () => {},
  userOn: {},
  setUserOn: () => {},
  accountVisible: () => true,
  accountOn: () => true,
});

export function LabsProvider({ children }: { children: React.ReactNode }) {
  const [agencyOn, setAgencyOn] = React.useState(true);
  const [access, setAccess] = React.useState<Record<string, AccountAccess>>(
    () =>
      Object.fromEntries(
        SEEDED_LEGACY.map((id) => [id, { visible: true, enabled: false }]),
      ),
  );
  /*
   * Empty: nobody has overridden their agency yet.
   *
   * Absent means "has not decided", which is not the same as "decided to
   * leave it as the agency set it" — the first follows the agency if the
   * agency later changes its mind, and the second would not. Only the
   * sub-account's own Labs writes here.
   */
  const [userOn, setUserOnState] = React.useState<Record<string, boolean>>({});
  const [trial, setTrial] = React.useState<"agency" | "account" | null>(null);
  const setUserOn = React.useCallback(
    (id: string, on: boolean) =>
      setUserOnState((prev) => ({ ...prev, [id]: on })),
    [],
  );

  const value = React.useMemo<LabsState>(
    () => ({
      /*
       * A trial reads as ON, and does not write it down.
       *
       * The shell asks one question — which nav does this scope get — so
       * the trial has to answer it here rather than every reader checking
       * two things. What it must NOT do is set `agencyOn`, or leaving the
       * trial would leave the rollout behind it.
       */
      agencyOn: agencyOn || trial === "agency",
      setAgencyOn,
      access,
      setAccess,
      userOn,
      setUserOn,
      accountVisible: (id) => (access[id] ?? DEFAULT_ACCESS).visible,
      trial,
      startTrial: setTrial,
      endTrial: () => setTrial(null),
      /*
       * Visibility is the gate; after it, the sub-account has the say.
       *
       * An account that cannot SEE the beta is not on it, whatever else is
       * set — the sheet enforces that on write too, so this is a second
       * line of defence rather than the rule's only home. Worth having
       * both: this is what the SHELL acts on, and a shell that trusted a
       * single flag would hand someone a nav they were never shown the
       * switch for.
       *
       * Past the gate, the sub-account's own answer wins over the agency's
       * — which is what the two columns are FOR. The agency decides
       * whether a beta is on offer and what it starts as; the account
       * decides whether to keep it. Falling back to the agency's value
       * where the account has not answered is what makes "available, not
       * taken" a state the model can hold.
       */
      accountOn: (id) => {
        if (trial === "account") return true;
        const row = access[id] ?? DEFAULT_ACCESS;
        if (!row.visible) return false;
        return userOn[id] ?? row.enabled;
      },
    }),
    [agencyOn, access, userOn, setUserOn, trial],
  );

  return <LabsContext value={value}>{children}</LabsContext>;
}

export function useLabs(): LabsState {
  return React.useContext(LabsContext);
}

/**
 * Whether this window was opened as a preview. See SWITCHYARD_PREVIEW.
 *
 * `useSyncExternalStore` and not a lazy `useState`, for the reason
 * `use-accounts` records at length: this app prerenders to static HTML, so
 * the server has no URL and a client that read one on its first render
 * disagreed with that HTML and threw the tree away. The server snapshot is
 * `false`; the client reads the query string straight after, with no
 * mismatch and no wasted frame. Nothing changes the URL at runtime, so
 * `subscribe` has nothing to listen to.
 */
function noUrlChanges(): () => void {
  return () => {};
}

function previewFromUrl(): boolean {
  return new URLSearchParams(window.location.search).get("preview") === "1";
}

function previewOnServer(): boolean {
  return false;
}

export function useIsPreviewTab(): boolean {
  return React.useSyncExternalStore(
    noUrlChanges,
    previewFromUrl,
    previewOnServer,
  );
}
