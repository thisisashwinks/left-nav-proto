"use client";

import * as React from "react";
import type { NavLayoutState } from "./grouping";

/**
 * Saved groupings, kept at agency level and applied to any account.
 *
 * This is the capability the Navigation tab's removal cost. Editing in place
 * means you can only shape the account you are in, and an agency running
 * forty dentists does not want to shape forty navs — it wants to shape one and
 * say "the rest like that". A template is the better answer than cross-account
 * editing, because the thing being reused becomes a named object an agency can
 * reason about rather than an invisible copy-paste.
 *
 * WHAT A TEMPLATE CARRIES is the whole design, and most of it is what it
 * leaves behind:
 *
 *   carried    the arrangement — grouping mode, custom groups, order, icons,
 *              the agency's own renames, pins, hidden rows and blocks.
 *   left out   `enabledProducts`, which is what the account BOUGHT. A dentist
 *              template applied to a roofer must not grant or revoke a single
 *              product; entitlement is a billing fact, not a layout one.
 *   left out   `customLinks` and the account-scope renames, which are the
 *              tenant's own content and naming rather than the agency's.
 *
 * Applying therefore intersects: any product the template arranges that the
 * target does not own is dropped on the way in, so a template built on a rich
 * account degrades to a sensible subset instead of referencing rows that
 * cannot exist.
 */

/** The arranged half of a layout — everything a template is allowed to move. */
export type NavArrangement = Pick<
  NavLayoutState,
  | "grouping"
  | "customGroups"
  | "groupOrder"
  | "agencyLabels"
  | "agencyProductLabels"
  | "icons"
  | "pinned"
  | "hiddenBlocks"
  | "hiddenRows"
  | "tailOrder"
>;

export interface NavTemplate {
  id: string;
  name: string;
  /** The account it was captured from, so a list of templates says where each came from. */
  fromAccount: string;
  /** How many products it arranges, as a rough size for the list. */
  productCount: number;
  arrangement: NavArrangement;
}

interface TemplatesValue {
  templates: readonly NavTemplate[];
  save: (name: string, fromAccount: string, state: NavLayoutState) => void;
  remove: (id: string) => void;
  /** The patch to apply, already intersected with what this account owns. */
  patchFor: (id: string, target: NavLayoutState) => Partial<NavLayoutState> | null;
}

const TemplatesContext = React.createContext<TemplatesValue | null>(null);

export function useNavTemplates(): TemplatesValue {
  const ctx = React.useContext(TemplatesContext);
  if (!ctx) {
    throw new Error("useNavTemplates must be used inside <NavTemplatesProvider>");
  }
  return ctx;
}

export function captureArrangement(state: NavLayoutState): NavArrangement {
  return {
    grouping: state.grouping,
    customGroups: state.customGroups,
    groupOrder: state.groupOrder,
    agencyLabels: state.agencyLabels,
    agencyProductLabels: state.agencyProductLabels,
    icons: state.icons,
    pinned: state.pinned,
    hiddenBlocks: state.hiddenBlocks,
    hiddenRows: state.hiddenRows,
    tailOrder: state.tailOrder,
  };
}

export function NavTemplatesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [templates, setTemplates] = React.useState<readonly NavTemplate[]>([]);
  const seq = React.useRef(0);

  const save = React.useCallback(
    (name: string, fromAccount: string, state: NavLayoutState) => {
      const trimmed = name.trim();
      if (trimmed === "") return;
      seq.current += 1;
      setTemplates((all) => [
        ...all,
        {
          id: `tpl-${seq.current}`,
          name: trimmed,
          fromAccount,
          productCount: state.enabledProducts.length,
          arrangement: captureArrangement(state),
        },
      ]);
    },
    [],
  );

  const remove = React.useCallback(
    (id: string) => setTemplates((all) => all.filter((t) => t.id !== id)),
    [],
  );

  const patchFor = React.useCallback(
    (id: string, target: NavLayoutState): Partial<NavLayoutState> | null => {
      const tpl = templates.find((t) => t.id === id);
      if (!tpl) return null;
      const owns = new Set(target.enabledProducts);
      const a = tpl.arrangement;

      return {
        grouping: a.grouping,
        groupOrder: a.groupOrder,
        agencyLabels: a.agencyLabels,
        agencyProductLabels: a.agencyProductLabels,
        icons: a.icons,
        hiddenBlocks: a.hiddenBlocks,
        // Every product reference is filtered to what this account owns. A
        // group left empty by that filter is dropped rather than drawn as a
        // heading over nothing.
        customGroups: a.customGroups
          .map((g) => ({ ...g, productIds: g.productIds.filter((p) => owns.has(p)) }))
          .filter((g) => g.productIds.length > 0),
        pinned: a.pinned.filter((p) => owns.has(p)),
        hiddenRows: a.hiddenRows.filter((p) => owns.has(p)),
        // The tail also holds the account's OWN links, which the template knows
        // nothing about — so template order first, then anything of the
        // account's it did not mention, rather than discarding them.
        tailOrder: [
          ...a.tailOrder.filter((p) => owns.has(p)),
          ...target.tailOrder.filter((p) => !a.tailOrder.includes(p)),
        ],
      };
    },
    [templates],
  );

  const value = React.useMemo<TemplatesValue>(
    () => ({ templates, save, remove, patchFor }),
    [templates, save, remove, patchFor],
  );

  return <TemplatesContext value={value}>{children}</TemplatesContext>;
}
