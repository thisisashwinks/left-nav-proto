"use client";

import * as React from "react";
import type { Account } from "@/components/accounts/accounts-data";
import type { AccountsSession } from "@/components/accounts/use-accounts";
import { AccountsIndexPage } from "@/components/settings/accounts-index";
import { SubAccountPage } from "@/components/settings/subaccount-page";
import { accountColorFor } from "@/lib/account-color";
import { BusinessLookupPage } from "./business-lookup-page";
import {
  MCDONALDS_LOGO,
  QUICK_SNAPSHOTS,
  type BusinessPlace,
} from "./flow-data";
import { NewAccountFormPage, type NewAccountValues } from "./new-account-form-page";
import type { AccountKind } from "./parts";
import { ReadyTour, type TourStep } from "./ready-tour";
import { SnapshotDialog } from "./snapshot-dialog";
import { StartDialog, type StartPick } from "./start-dialog";

/**
 * Sub-accounts ▸ Accounts, end to end.
 *
 * The table, the Create sub-account flow that starts from it, and the settings
 * page a row (or a freshly made account) opens. The flow's step is owned by the
 * shell — the breadcrumb has to name it — and everything that only this area
 * draws is owned here: the two dialogs and the tour.
 *
 *   table ─ Create ─▶ start dialog ─┬─ industry ─────────────▶ lookup ─▶ form
 *                                   └─ Browse all ─▶ snapshots ─┘           │
 *   settings ◀───────────────────── Create (account made, tour starts) ─────┘
 */

export interface FlowStart {
  kind: "industry" | "snapshot";
  /** "Restaurant", or the snapshot's own name. */
  label: string;
  /** Whether the account will be a restaurant — decides the form's last card. */
  restaurant: boolean;
}

export type CreateFlow =
  | { step: "lookup"; start: FlowStart }
  | { step: "form"; start: FlowStart; place: BusinessPlace | null };

export function SubAccountsArea({
  session,
  manageAccount,
  onManage,
  flow,
  onFlow,
  onSwitch,
}: {
  session: AccountsSession;
  manageAccount: Account | null;
  onManage: (accountId: string | null) => void;
  flow: CreateFlow | null;
  onFlow: (flow: CreateFlow | null) => void;
  /** Opens a sub-account from its settings page. */
  onSwitch: (accountId: string) => void;
}) {
  const [dialog, setDialog] = React.useState<"start" | "snapshots" | null>(null);
  const [accountKind, setAccountKind] = React.useState<AccountKind>("saas");
  /** The account whose "you can open it from here" tour is running. */
  const [tourFor, setTourFor] = React.useState<string | null>(null);

  const startFrom = (pick: StartPick) => {
    setDialog(null);
    if (pick.kind === "industry") {
      onFlow({ step: "lookup", start: { kind: "industry", label: "Restaurant", restaurant: true } });
      return;
    }
    const quick = QUICK_SNAPSHOTS.find((s) => s.id === pick.id);
    onFlow({
      step: "lookup",
      start: { kind: "snapshot", label: quick?.label ?? "Blank snapshot", restaurant: false },
    });
  };

  const create = (start: FlowStart, place: BusinessPlace | null, v: NewAccountValues) => {
    const slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "account";
    const id = `new-${slug}-${Date.now().toString(36)}`;
    const initials =
      v.name
        .replace(/[^A-Za-z0-9 ]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]!.toUpperCase())
        .join("") || "NA";
    const account: Account = {
      id,
      name: v.name.trim(),
      meta: [v.street, v.city, v.state].filter(Boolean).join(", "),
      logo: { initials, ...accountColorFor(id) },
      // The listing's own mark when there is one to take.
      ...(place && place.name === "McDonald's" ? { logoSrc: MCDONALDS_LOGO } : {}),
      // A snapshot copies a setup into the standard workspace; only the
      // industry path builds the restaurant's own.
      ...(start.kind === "industry" && start.restaurant ? { workspace: "restaurant" as const } : {}),
      profile: {
        firstName: v.firstName.trim(),
        lastName: v.lastName.trim(),
        email: v.email.trim(),
        phone: v.phone.trim(),
        street: v.street.trim(),
        city: v.city.trim(),
        state: v.state.trim(),
        zip: v.zip.trim(),
        country: v.country,
        source: { kind: start.kind, label: start.label },
      },
    };
    session.createAccount(account);
    onFlow(null);
    onManage(id);
    setTourFor(id);
  };

  const tourAccount =
    tourFor && manageAccount?.id === tourFor ? manageAccount : null;
  const tourSteps = React.useMemo<TourStep[]>(
    () =>
      tourAccount
        ? [
            {
              target: () =>
                document.querySelector<HTMLElement>(
                  `[data-account-rail] button[aria-label="${CSS.escape(tourAccount.name)}"]`,
                ),
              title: `Open ${tourAccount.name} from here`,
              body: "Your sub-accounts sit in this rail, so you can switch in from any page.",
              side: "right",
              shape: "circle",
            },
            {
              target: () =>
                document.querySelector<HTMLElement>('[data-tour="continue-to-sub-account"]'),
              title: "You can also access it here",
              body: `Go straight from these settings into ${possessive(tourAccount.name)} sub-account.`,
              side: "bottom",
              shape: "rounded",
            },
          ]
        : [],
    [tourAccount],
  );

  let page: React.ReactNode;
  if (manageAccount) {
    page = (
      <SubAccountPage
        key={manageAccount.id}
        account={manageAccount}
        onBack={() => onManage(null)}
        onSwitch={() => {
          setTourFor(null);
          onSwitch(manageAccount.id);
        }}
      />
    );
  } else if (flow?.step === "lookup") {
    page = (
      <BusinessLookupPage
        key={`lookup-${flow.start.label}`}
        title={flow.start.kind === "industry" ? `${flow.start.label} Industry` : "Snapshot"}
        onBack={() => {
          onFlow(null);
          setDialog(flow.start.kind === "industry" ? "start" : "snapshots");
        }}
        onPick={(place) => onFlow({ step: "form", start: flow.start, place })}
        onAddManually={() => onFlow({ step: "form", start: flow.start, place: null })}
      />
    );
  } else if (flow?.step === "form") {
    page = (
      <NewAccountFormPage
        key={`form-${flow.place?.id ?? "manual"}`}
        variant={flow.start.kind}
        restaurant={flow.start.restaurant}
        place={flow.place}
        onBack={() => onFlow({ step: "lookup", start: flow.start })}
        onCancel={() => onFlow(null)}
        onCreate={(values) => create(flow.start, flow.place, values)}
      />
    );
  } else {
    page = (
      <AccountsIndexPage
        session={session}
        onManage={(id) => onManage(id)}
        onCreate={() => setDialog("start")}
      />
    );
  }

  return (
    <>
      {page}
      {dialog === "start" ? (
        <StartDialog
          accountKind={accountKind}
          onAccountKind={setAccountKind}
          onClose={() => setDialog(null)}
          onContinue={startFrom}
          onBrowseSnapshots={() => setDialog("snapshots")}
        />
      ) : null}
      {dialog === "snapshots" ? (
        <SnapshotDialog
          accountKind={accountKind}
          onAccountKind={setAccountKind}
          onBack={() => setDialog("start")}
          onClose={() => setDialog(null)}
          onContinue={(t) => {
            setDialog(null);
            onFlow({
              step: "lookup",
              start: {
                kind: "snapshot",
                label: t.label,
                restaurant: t.industry === "restaurant",
              },
            });
          }}
        />
      ) : null}
      {tourAccount && tourSteps.length > 0 ? (
        <ReadyTour steps={tourSteps} onClose={() => setTourFor(null)} />
      ) : null}
    </>
  );
}

/** "McDonald's" stays as it is; "Bistro" becomes "Bistro's". */
function possessive(name: string): string {
  return /['’]s$/i.test(name) ? name : `${name}'s`;
}
