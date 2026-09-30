# Spec: SaaS Configurator — navigation template config

Agency › SaaS › SaaS configurator › **Plans**. How a SaaS plan hands a
navigation layout to the sub-accounts on it.

Surfaces:
- `settings/saas-configurator-page.tsx` — the SaaS dashboard and plan list.
- `settings/saas-plan-editor.tsx` — one plan, seven tabs. The template
  attaches on **Features**, beside Attach snapshot and Custom menu links.
- `settings/attach-template-modal.tsx` — the picker.
- `settings/saas-plans-data.ts` — plans and feature areas.

Store: `src/components/nav/nav-templates.tsx`. Axes: `src/design/theme.ts`.

**Rebuilt Sep 30 against production screenshots.** The first cut put the
decision on three tier cards with a layout picker on each — a sketch of the
model rather than of the screen, and a control production does not have. The
shape below is the real one.

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
| 9 | **Attaching states its reach before the press** | `AttachTemplateModal` | The count of accounts it rewrites sits next to the Save button. See below. |
| 10 | **New products appear in every template, and are marked** | `templateNewProductMark: true` | A product added to the catalogue lands in every template at its default position — the alternative is a template that silently never shows new products. The row carries a count so the agency can look once and decide. |

## Where the template attaches (#9)

On the plan editor's **Features** tab, as a third attachment button beside
Attach snapshot and Custom menu links. To the agency it is the same errand as
those two — decide what a new sub-account on this plan arrives holding — so it
is the same control in the same row, and the modal wears the same header.

Three differences from the two beside it, each deliberate:

1. **Single select.** A plan hands out one navigation, so the list is radios,
   not the links modal's checkboxes. "HighLevel default" is a row in that list
   rather than a Remove button, because detaching is a choice between
   arrangements, not a destructive act needing its own control.
2. **It reaches accounts that already exist.** A snapshot is copied into an
   account once at creation and never touched again. A template keeps being
   managed — saving it later re-arranges every account on it. So attaching is
   not only a decision about joiners.
3. **It states its reach.** When the pick would change accounts already on the
   plan, a line above the footer names how many, warns it cannot be undone,
   and repeats that leaving the plan later restores nothing.

**Reach** is counted three ways — `replaced` (on another layout, or none),
`drifted` (on this template but edited since), `unchanged`. The split is the
point: "applies to 41 sub-accounts" reads as 41 accounts being helped; the
number that decides the press is how many have a nav somebody deliberately
changed.

**No second confirm dialog.** The Sep 29 cut had one, because there the
gesture was a `<select>` firing on change — a press nobody had agreed to.
Here the agency is already inside a modal they opened on purpose and will
press a button labelled with what it does, so a dialog over it would be
confirming a confirmation. The count moved next to the button instead.

**Attached state.** The button becomes a chip naming the template with a
remove beside it — production's own pattern on the snapshot button. The plan
list also reads both attachments out on each row, because that is where plans
get compared and "which of these gives the client a nav" is otherwise
invisible until you open all three.

## Scope

- SaaS dashboard: seven tabs, **Plans & pricing** built.
- Plan list: name, category, product ID, prices, trial, credits, both
  attachments, Edit details.
- Plan editor: seven tabs, **Plan details** and **Features** built.
- Features tab: entitlement table with per-area counts and Enable all, search,
  and the three attachment controls.
- Templates modal: single select, reach warning, attached chip with remove.
- Attach applies to everyone on the plan + arms the plan for joiners.
- Detach (→ HighLevel default) with no warning; it changes nobody's nav.
- Zero state when the agency has no templates.
- Toast reporting how far an attach reached.

## Non-goals

- **Ten of the fourteen tabs are `ProductionStubTab`**: five dashboard tabs
  (Advanced settings, Security, Configure, Cancellation settings, Downgrade
  settings, Automatic Tax) and five plan tabs (Pricing, Addons, Marketplace
  apps, Trial and credits, Rebilling). If the P0 covers them, that is most of
  the work and a separate spec.
- The feature table does not expand to individual features, and its toggles
  are read-only. It is context for where the template button lives, not the
  entitlement editor.
- Attach snapshot and Custom menu links open nothing — they are drawn so the
  Templates button has neighbours to be consistent with.
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
