"use client";

import type { Account } from "@/components/accounts/accounts-data";
import type { LabelScope, NavLayoutState } from "@/components/nav/grouping";
import { LABEL_MAX, useNavLayout } from "@/components/nav/nav-layout-provider";
import { Card, Seg } from "./controls";
import { GatedRow } from "./gated";

/**
 * Where a rename lands: this account, or every account under the agency.
 *
 * All that is left of what used to be a permissions card. The matrix above it —
 * a Client user / Client admin / Agency grid of ticks, dashes and policy
 * switches — is gone: role governance is not what this tab is for, and the tab
 * is long enough without restating an architecture nobody was editing here.
 * Role behaviour still exists in the nav itself, driven by `permissionsFor`.
 */
export function NavRenameScopeCard({ account }: { account: Account }) {
  const layout = useNavLayout();
  const state = layout.profileFor(account.id);
  const patchLayout = (recipe: (s: NavLayoutState) => NavLayoutState) =>
    layout.updateProfile(account.id, recipe);

  return (
    <Card
      title="Rename scope"
      sub={`Where a rename made in the nav lands. Labels cap at ${LABEL_MAX} characters either way.`}
    >
      <GatedRow
        cap="renameAllAccounts"
        accountId={account.id}
        label="Renames apply to"
        desc="All accounts writes the default every account inherits — and an account override still wins over it, so one client can keep its own word for something."
        last
      >
        {(locked) => (
          <Seg<LabelScope>
            label="Rename scope"
            /*
              Locked collapses to one option rather than showing a disabled
              second one: a single option reads as a statement of where renames
              land, where a greyed-out choice beside it reads as a tease.
            */
            options={locked ? ["account"] : ["account", "agency"]}
            value={locked ? "account" : state.labelScope}
            onChange={(scope) =>
              patchLayout((s) => (s.labelScope === scope ? s : { ...s, labelScope: scope }))
            }
            format={(v) => (v === "account" ? "This account only" : "All accounts")}
          />
        )}
      </GatedRow>
    </Card>
  );
}
