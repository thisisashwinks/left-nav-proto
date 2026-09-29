# Spec: SaaS Configurator — navigation template config

Agency › SaaS › SaaS configurator › **Plans**. How a SaaS plan hands a
navigation layout to the sub-accounts on it.

Surface: `src/components/settings/saas-configurator-page.tsx` (`PlansTab`).
Store: `src/components/nav/nav-templates.tsx`. Axes: `src/design/theme.ts`.

## Goal

An agency attaches a navigation template to a plan tier. Every sub-account on
that tier receives the layout, and so does every account that joins the tier
afterwards. One place to reason about what a plan hands out, including to
accounts that do not exist yet.

## The rule the whole feature turns on

**A plan APPLIES a template. It does not bind one.**

Attaching hands the layout to everyone on the plan now and to everyone who
joins later. That is the end of the plan's involvement. An account that
later leaves the plan **keeps the layout it has** — nothing reverts.

This is the thing implementers get wrong, and it is expensive to discover:
built as a live binding, nothing looks broken until an account downgrades and
unexpectedly loses its navigation. It is stated on the page itself, in the
confirmation dialog, and here.

## Decisions (locked)

Each is an axis in `theme.ts` with both answers built, so any of these can be
flipped in the prototype and looked at rather than argued about. The value
below is the shipped one.

| # | Decision | Value | Why |
|---|---|---|---|
| 1 | **Updating a template reaches the accounts on it** | `templatePropagation: "managed"` | A template is a live standard: fix it once, fixed everywhere. The alternative (`copy`) makes the feature useless at the scale it exists for — forty accounts to re-apply by hand is forty chances to miss one. |
| 2 | **Deleting a template leaves navs alone** | `templateDeleteMode: "unlink"` | Accounts keep what they have and stop receiving updates. Deleting is tidying in the agency's own list; it must not reach into seven other people's workspaces. |
| 3 | **A collision keeps the local edit, and offers a way out** | `templateConflict: "resolve"` | A push rebases onto local changes, so a renamed row stays renamed. Where both sides moved the same property, local wins **and** the account is offered three exits: take the template's version, keep mine, or split into a template of my own. |
| 4 | **The list starts empty** | `templateSeed: "default-only"` | HighLevel default and nothing else. Shipped presets are a guess at somebody else's business. An empty list is the honest zero state and makes "save as new template" the obvious first move. **This is the state most agencies meet first — design for it, not around it.** |
| 5 | **One save verb, not two** | `templateSaveShape: "unified"` | "Save template" opens a dialog asking update-or-new. The two are the same gesture at different scopes, and the dialog is the only place the difference that matters — how many other accounts move — can be stated beside each option. |
| 6 | **Library management sits on each template row** | `templateActionHome: "on-row"` | The picker carrying its own rename/duplicate/delete is the shorter path (Sep 16). The alternative — a pure picker with library work behind "Manage templates" — is one switch away and argued in the axis note. |
| 7 | **Sub-accounts are not notified of a push** | `templatePushNotice: false` | The person seeing that card did not make the change and cannot undo it. The agency manages navigation; the client uses it. |
| 8 | **No undo on the receipt** | `templateUndo: false` | Every destructive move is behind a dialog naming a count, and an undo standing behind the dialog invites the dialog to be skimmed. **This decision depends on #9 existing.** |
| 9 | **Attaching to a plan is confirmed, with its reach broken down** | `AttachTemplateDialog` | Added Sep 29. See below. |
| 10 | **New products appear in every template, and are marked** | `templateNewProductMark: true` | A product added to the catalogue lands in every template at its default position — the alternative is a template that silently never shows new products. The row carries a count so the agency can look once and decide. |

## The attach confirmation (#9)

Attaching is the largest destructive act in the product: one selection
rewrites the navigation of every sub-account on the tier. It previously ran
straight off the picker's `onChange` — no dialog, no count, no way back.

A dialog now stages the pick and reports **reach**, split three ways:

- `replaced` — on a different layout, or none. Overwritten.
- `drifted` — on this template but edited since, or never reached by a push. Reset.
- `unchanged` — already holding it. Untouched.

The split is the point. "Applies to 41 sub-accounts" reads as 41 accounts
being helped; the number that decides the press is how many of those have a
nav somebody deliberately changed. The confirm button names the number it will
change and is painted destructive **only when that number is non-zero**.

**Detaching is not confirmed.** Choosing "HighLevel default" changes nobody's
nav — it only stops the plan handing one out to joiners. A dialog over a
harmless press is how dialogs stop being read.

**An empty plan still confirms**, with different copy: nothing is destroyed,
but the attach is not a no-op either. It arms the plan for joiners.

## Scope

- Per-tier navigation layout picker on the Plans tab.
- Attach applies to everyone on the tier + arms the tier for joiners.
- Attach confirmation with reach breakdown.
- Detach (→ HighLevel default), unconfirmed.
- Zero state when the agency has no templates.
- Toast reporting how far an attach reached.

## Non-goals

- The other three configurator tabs — **Pricing, Rebilling, Trials are
  `ProductionStubTab`**. If the P0 covers them, that is most of the work and a
  separate spec.
- Persistence, real entitlements, billing.
- Per-account override of a plan's layout (that is the nav's own edit mode).
- Scheduling or staged rollout of an attach.

## Open questions

1. **Reach at scale**: the dialog counts accounts one by one. At 400+
   sub-accounts per tier this needs a server-side count, and the dialog needs
   a loading state it does not currently have.
2. **Permissions**: nothing models who may attach a template to a plan. It is
   currently available to anyone who can reach the configurator.
3. **Audit**: `managed` propagation means one save moves forty navs. There is
   no record of who did it or when.
