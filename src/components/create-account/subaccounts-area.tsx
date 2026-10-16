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

export type CreateDialog = "start" | "snapshots";

/** What the first screen picked, as the lookup that follows needs it. */
export function startFromPick(pick: StartPick): FlowStart {
  if (pick.kind === "industry") return { kind: "industry", label: "Restaurant", restaurant: true };
  const quick = QUICK_SNAPSHOTS.find((s) => s.id === pick.id);
  return { kind: "snapshot", label: quick?.label ?? "Blank snapshot", restaurant: false };
}

/**
 * The two create dialogs, owned by the shell rather than by the Accounts page.
 *
 * Create sub-account is reachable from the rail on every page, so the dialogs
 * have to open over whatever page you are on. Only once a start is chosen does
 * the flow move to Sub-accounts ▸ Accounts — that is where its steps live.
 */
export function CreateDialogs({
  open,
  onOpen,
  onClose,
  onStart,
}: {
  open: CreateDialog | null;
  onOpen: (dialog: CreateDialog) => void;
  onClose: () => void;
  onStart: (start: FlowStart) => void;
}) {
  // Held across both dialogs, so Back from the library keeps the choice.
  const [accountKind, setAccountKind] = React.useState<AccountKind>("saas");
  if (open === "start") {
    return (
      <StartDialog
        accountKind={accountKind}
        onAccountKind={setAccountKind}
        onClose={onClose}
        onContinue={(pick) => onStart(startFromPick(pick))}
        onBrowseSnapshots={() => onOpen("snapshots")}
      />
    );
  }
  if (open === "snapshots") {
    return (
      <SnapshotDialog
        accountKind={accountKind}
        onAccountKind={setAccountKind}
        onBack={() => onOpen("start")}
        onClose={onClose}
        onContinue={(t) =>
          onStart({ kind: "snapshot", label: t.label, restaurant: t.industry === "restaurant" })
        }
      />
    );
  }
  return null;
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
  onOpenDialog,
  onSwitch,
}: {
  session: AccountsSession;
  manageAccount: Account | null;
  onManage: (accountId: string | null) => void;
  flow: CreateFlow | null;
  onFlow: (flow: CreateFlow | null) => void;
  /** Opens one of the shell-owned create dialogs. See `CreateDialogs`. */
  onOpenDialog: (dialog: CreateDialog) => void;
  /** Opens a sub-account from its settings page. */
  onSwitch: (accountId: string) => void;
}) {
  /** The account whose "you can open it from here" tour is running. */
  const [tourFor, setTourFor] = React.useState<string | null>(null);
  const endTour = () => {
    setTourFor(null);
    session.setSpotlightId(null);
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
    session.setSpotlightId(id);
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
          endTour();
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
          onOpenDialog(flow.start.kind === "industry" ? "start" : "snapshots");
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
        onCreate={() => onOpenDialog("start")}
      />
    );
  }

  return (
    <>
      {page}
      {tourAccount && tourSteps.length > 0 ? (
        <ReadyTour steps={tourSteps} onClose={endTour} />
      ) : null}
    </>
  );
}

/** "McDonald's" stays as it is; "Bistro" becomes "Bistro's". */
function possessive(name: string): string {
  return /['’]s$/i.test(name) ? name : `${name}'s`;
}
