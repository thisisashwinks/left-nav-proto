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

  const value = React.useMemo<LabsState>(
    () => ({
      agencyOn,
      setAgencyOn,
      access,
      setAccess,
      /*
       * Both switches, not either.
       *
       * An account that cannot see the beta is not on it, whatever the
       * enable column says — which the sheet already enforces on write, so
       * this is a second line of defence rather than the rule's only home.
       * Worth having both: the rule is what the SHELL acts on, and a shell
       * that trusted a single flag would hand someone a nav they were never
       * shown the switch for.
       */
      accountOn: (id) => {
        const row = access[id] ?? DEFAULT_ACCESS;
        return row.visible && row.enabled;
      },
    }),
    [agencyOn, access],
  );

  return <LabsContext value={value}>{children}</LabsContext>;
}

export function useLabs(): LabsState {
  return React.useContext(LabsContext);
}
