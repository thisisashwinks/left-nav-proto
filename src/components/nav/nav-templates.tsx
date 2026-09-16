"use client";

import * as React from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { resolveOwned } from "./catalogue-equivalents";
import {
  customTreeFor,
  type GroupingMode,
  type NavLayoutState,
} from "./grouping";

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
  /**
   * The account it was captured from, so a list says where each came from.
   * Empty for the shipped presets, which came from nobody's account.
   */
  fromAccount: string;
  /** A shipped starting point rather than something this agency saved. */
  builtIn?: boolean;
  /**
   * The one template nothing may be done to — see DEFAULT_TEMPLATE_ID.
   *
   * Stronger than `builtIn`, which only refuses renames and deletes: this also
   * refuses being saved into. An agency that could overwrite the default would
   * have no default, and every account created after that would inherit
   * whatever they happened to be looking at the day they pressed it.
   */
  immutable?: boolean;
  /** How many products it arranges, as a rough size for the list. */
  productCount: number;
  /**
   * Bumped on every save. This is what makes a template a thing that CHANGES
   * rather than a snapshot that only ever gets replaced.
   *
   * A link stores the version it took, so "on Dental practice v4" and "still on
   * v3" are different sentences — and the second one is the only way an agency
   * can be told that an account missed a push.
   */
  version: number;
  /** When it was last saved, for the "updated Jan 14" line. */
  updatedAt: string;
  arrangement: NavArrangement;
}

/**
 * What an account's link remembers.
 *
 * `base` is the arrangement the template held WHEN IT WAS APPLIED, and it is
 * the whole reason a push can be non-destructive. Without it, "what has this
 * account changed since?" is unanswerable — the account's nav is just a nav,
 * with no record of which parts were the template's idea and which were the
 * agency's own tuning of this one client. Holding the base turns that into
 * arithmetic: whatever differs from it is theirs, and theirs survives.
 */
export interface TemplateLink {
  templateId: string;
  base: NavArrangement;
}

/**
 * One account's unresolved collision with its template.
 *
 * Holds the arrangement it had BEFORE the push as well as the lines, because
 * two of the three ways out need it: "keep mine" restores it, and "save as new
 * template" captures it. Without it the only resolvable answer would be the one
 * that throws the account's work away.
 */
export interface TemplateDivergence {
  templateId: string;
  templateName: string;
  version: number;
  lines: readonly string[];
  /** What this account looked like before the push landed. */
  mine: NavArrangement;
  /** What the template now holds, for "use the template's version". */
  theirs: NavArrangement;
}

/** One account's news, held until it is looked at. See `noticeFor`. */
export interface TemplateNotice {
  templateName: string;
  version: number;
  changes: readonly string[];
  /** Whether this account had tweaks that the push preserved. */
  kept: boolean;
}

interface TemplatesValue {
  templates: readonly NavTemplate[];
  /** Creates a template and returns its id, so the caller can link to it. */
  save: (
    name: string,
    fromAccount: string,
    state: NavLayoutState,
  ) => NavTemplate | null;
  /**
   * Overwrites an existing template's arrangement, keeping its name and id.
   *
   * The counterpart to `save`, and the reason the menu can offer two verbs
   * instead of one ambiguous "Save as template". Editing the nav of an account
   * that is on a template and pressing save should mean "the template was
   * wrong, this is what it should be" — not "here is a fourteenth template
   * called Dental practice (2)".
   */
  update: (
    id: string,
    fromAccount: string,
    state: NavLayoutState,
  ) => NavTemplate | null;
  remove: (id: string) => void;
  /**
   * A new name on the same template, links and version untouched.
   *
   * Renaming is not a version: nothing about the arrangement moved, so an
   * account on v2 is still on v2 and nothing gets pushed. Refused on `builtIn`
   * presets, whose names are the platform's rather than this agency's — the way
   * to get "the dental one, but ours" is still `duplicate`.
   */
  rename: (id: string, name: string) => void;
  /**
   * A second template holding the same arrangement, on nobody.
   *
   * The safe half of every template edit. Updating one is the only destructive
   * act in this feature — fifty navs move — so the agency needs a way to say
   * "I want to rework this, but not yet, and not on them". A duplicate carries
   * the arrangement and NOT the links, which is exactly that: somewhere to
   * work, with a blast radius of zero until they apply it themselves.
   *
   * It is also the only way to get at a preset. `builtIn` templates are
   * overwritten the moment they are saved into, so an agency wanting "the
   * dental one, but ours" had to choose between defacing the shipped preset and
   * rebuilding it by hand. The copy is never `builtIn`: it is theirs from the
   * first press.
   */
  duplicate: (id: string) => NavTemplate | null;
  /** The patch to apply, already intersected with what this account owns. */
  patchFor: (id: string, target: NavLayoutState) => Partial<NavLayoutState> | null;

  /**
   * Which template an account is ON.
   *
   * Set when a template is applied to it — one at a time from the edit menu, or
   * in a bulk run — and when an arrangement is saved from it. Without this the
   * menu has no way to tell "save" from "save as", because there is no such
   * thing as the current template.
   *
   * A link is a claim about provenance, not a subscription: updating the
   * template does not reach back into the accounts on it. That is what Apply
   * is for, and keeping the two separate is what stops one agency's edit from
   * silently rewriting forty navs.
   */
  linkedIdFor: (accountId: string) => string | null;
  /**
   * Takes an account off whatever template it was on.
   *
   * Applying the default is the one "apply" that leaves an account on nothing:
   * being on the default is the same as being on no template, and a link to it
   * would make "Save to HighLevel default" look like a thing you could press.
   */
  unlink: (accountId: string) => void;
  /**
   * Moves every account on one template onto another.
   *
   * For deleting a template that is in use: the accounts keep the navigation
   * they have — nothing is re-arranged — and simply start taking updates from
   * somewhere else. Their base stays what it was, so the first push from the
   * new template rebases against what they actually have rather than against an
   * arrangement they were never on.
   */
  reassign: (fromTemplateId: string, toTemplateId: string) => void;
  linkedFor: (accountId: string) => NavTemplate | null;
  /** The base an account took, which is what a later push measures against. */
  linkFor: (accountId: string) => TemplateLink | null;
  /**
   * Whether an account holds the template's current arrangement.
   *
   * False either because a push has not reached it — `copy` propagation, or an
   * account added since — or because someone has since edited it directly.
   */
  isCurrent: (accountId: string) => boolean;
  link: (accountId: string, templateId: string, base: NavArrangement) => void;
  /** How many accounts are on a template. Shown before an update overwrites it. */
  accountsOn: (templateId: string) => number;
  /** Who is on it — the push needs the ids, not just the count. */
  accountsOnIds: (templateId: string) => readonly string[];

  /**
   * Park the news for accounts a push just moved, to be read when next opened.
   *
   * A nav that rearranged itself between two visits is indistinguishable from a
   * bug unless something says otherwise, and the person who caused it was
   * standing in a different account at the time. So the notice waits where the
   * change is — one account, one card, dismissed once.
   */
  markPushed: (
    entries: readonly { accountId: string; kept: boolean }[],
    templateName: string,
    version: number,
    changes: readonly string[],
  ) => void;
  noticeFor: (accountId: string) => TemplateNotice | null;
  dismissNotice: (accountId: string) => void;

  /**
   * Say that something happened, for the toast.
   *
   * On the store rather than in each surface because the surfaces that DO these
   * things are three different popovers, and the toast has to outlive every one
   * of them: duplicating from the templates drill closes the drill, so a toast
   * owned by the drill would be unmounted in the same tick it was raised. The
   * store is the thing that survives.
   *
   * Creating, applying, saving, duplicating, renaming and deleting a template
   * all pass through here. Without it the only action in the feature that said
   * anything was apply — and only because the layout's own undo offer happened
   * to catch it.
   */
  /**
   * Accounts whose own edits collided with the template's.
   *
   * Recorded at push time, because that is the only moment both sides of the
   * comparison exist: afterwards the account holds the merged result and the
   * question "what did I have before this landed" has no answer. See
   * `collisionsBetween`.
   */
  divergedFor: (accountId: string) => TemplateDivergence | null;
  markDiverged: (accountId: string, divergence: TemplateDivergence) => void;
  clearDivergence: (accountId: string) => void;

  notify: (message: string) => void;
  /** The message on screen, with an id so a repeat replays rather than sits. */
  toast: { id: number; message: string } | null;
  dismissToast: () => void;
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
  /*
   * Materialise the tree before capturing it.
   *
   * `customGroups` is EMPTY unless the account is already in a structural
   * custom mode — every other mode derives its groups from the catalogue at
   * render time and stores nothing. So saving a template from an account on
   * `default`, `job` or `proposed` captured the mode NAME and an empty tree,
   * and applying it elsewhere re-derived that mode against the target's own
   * products. From the proposed tree that was close to nothing, because its
   * buckets are built over a product set most accounts do not own — which is
   * the "only a few links come across" this fixes.
   *
   * `customTreeFor` is the same seeding the editor uses when you first
   * restructure an authored mode. A template is therefore always a concrete
   * tree, whatever mode it was authored in.
   */
  const tree = customTreeFor(state);
  return {
    grouping: "custom",
    customGroups: tree.customGroups,
    groupOrder: tree.groupOrder,
    agencyLabels: tree.agencyLabels,
    agencyProductLabels: tree.agencyProductLabels,
    icons: tree.icons,
    pinned: tree.pinned,
    hiddenBlocks: tree.hiddenBlocks,
    hiddenRows: tree.hiddenRows,
    tailOrder: tree.tailOrder,
  };
}


/**
 * Five shipped presets.
 *
 * An empty templates panel teaches nothing: an agency opening it sees a feature
 * with no examples and has to imagine both what a template is and why they
 * would want one. Five verticals answer both at once — and they are the actual
 * starting points most agencies would otherwise build by hand, since a dental
 * practice and a gym genuinely do want different navs.
 *
 * Built from real catalogue ids, so applying one is a real rearrangement rather
 * than a demo that looks right and does nothing. Each is deliberately partial:
 * `patchFor` filters every product against what the target account owns, so a
 * preset naming twenty products lands correctly on an account with five.
 */
const preset = (
  id: string,
  name: string,
  groups: Array<[string, string, string[]]>,
  pinned: string[],
): NavTemplate => ({
  id,
  name,
  fromAccount: "",
  builtIn: true,
  productCount: new Set(groups.flatMap(([, , ids]) => ids)).size,
  // A fixed stamp, not today's date: these ship with the product, and a preset
  // claiming it was updated this morning is a lie the list would be telling on
  // every load. It is also the same string on the server and the client, which
  // is what keeps hydration quiet.
  version: 1,
  updatedAt: "Jan 14, 2026",
  arrangement: {
    grouping: "custom",
    customGroups: groups.map(([gid, label, productIds]) => ({
      id: gid,
      label,
      iconName: GROUP_ICONS[gid] ?? "Folder",
      productIds,
    })),
    groupOrder: {},
    agencyLabels: {},
    agencyProductLabels: {},
    icons: {},
    pinned,
    hiddenBlocks: [],
    hiddenRows: [],
    tailOrder: [],
  },
});

/**
 * The navigation every account ships with, as a row in the template list.
 *
 * It used to be a drill of its own — "My layout" against "HighLevel default
 * layout" — which asked the same question the template list asks, in different
 * words, one menu away. A person comparing arrangements had two places to look
 * and no way to see them side by side.
 *
 * Special in two ways, and only two. It cannot be changed: not renamed, not
 * deleted, and not saved into, because "the default" that an agency can
 * overwrite is not a default. And it carries no stored arrangement — applying
 * it resets the account to the profile it shipped with, which differs per
 * tenant, so there is nothing to keep here that would be true for all of them.
 */
export const DEFAULT_TEMPLATE_ID = "hl-default";

const DEFAULT_TEMPLATE: NavTemplate = {
  id: DEFAULT_TEMPLATE_ID,
  name: "HighLevel default",
  fromAccount: "",
  builtIn: true,
  immutable: true,
  // Nothing reads this: `patchFor` returns the account's own shipped profile
  // for this id rather than an arrangement held here. Zero rather than a
  // made-up number, and the list says "what we ship" instead of a count.
  productCount: 0,
  version: 1,
  updatedAt: "Jan 14, 2026",
  arrangement: {
    grouping: "custom",
    customGroups: [],
    groupOrder: {},
    agencyLabels: {},
    agencyProductLabels: {},
    icons: {},
    pinned: [],
    hiddenBlocks: [],
    hiddenRows: [],
    tailOrder: [],
  },
};

/** Group id to Lucide name, kept beside the presets that use them. */
const GROUP_ICONS: Record<string, string> = {
  "t-front-desk": "Stethoscope",
  "t-patients": "Users",
  "t-get-booked": "Megaphone",
  "t-money": "CreditCard",
  "t-jobs": "Wrench",
  "t-talk": "MessageCircle",
  "t-win-work": "Megaphone",
  "t-paid": "CreditCard",
  "t-clients": "Scale",
  "t-matters": "FileText",
  "t-billing": "CreditCard",
  "t-growth": "Megaphone",
  "t-members": "Dumbbell",
  "t-schedule": "CalendarDays",
  "t-sell": "ShoppingCart",
  "t-marketing": "Megaphone",
  "t-audience": "GraduationCap",
  "t-programmes": "CalendarDays",
  "t-launch": "Megaphone",
  "t-automate": "Workflow",
  "t-insight": "ChartLine",
};

const SEED_TEMPLATES: readonly NavTemplate[] = [
  // First, always: it is what an account has before anyone chooses anything,
  // so it is the row a list of alternatives is read against.
  DEFAULT_TEMPLATE,
  preset(
    "tpl-dental",
    "Dental practice",
    [
      ["t-front-desk", "Front desk", ["conversations", "calendars", "meetings"]],
      ["t-patients", "Patients", ["contacts", "companies", "tasks", "documents"]],
      ["t-get-booked", "Get booked", ["sites", "reputation", "email-campaigns", "social-planner"]],
      ["t-money", "Billing", ["invoices", "payments", "subscriptions"]],
      ["t-insight", "Reporting", ["reporting", "dashboards"]],
    ],
    ["conversations", "calendars", "contacts", "payments"],
  ),
  preset(
    "tpl-home-services",
    "Home services",
    [
      ["t-jobs", "Jobs", ["calendars", "tasks", "opportunities"]],
      ["t-talk", "Customers", ["conversations", "contacts", "reputation"]],
      ["t-win-work", "Win work", ["sites", "ad-manager", "email-campaigns", "prospecting"]],
      ["t-paid", "Get paid", ["invoices", "payments", "documents"]],
      ["t-insight", "Reporting", ["reporting", "dashboards"]],
    ],
    ["conversations", "calendars", "opportunities", "invoices"],
  ),
  preset(
    "tpl-law",
    "Law firm",
    [
      ["t-clients", "Clients", ["contacts", "companies", "conversations"]],
      ["t-matters", "Matters", ["tasks", "documents", "calendars", "meetings"]],
      ["t-billing", "Billing", ["invoices", "payments", "subscriptions"]],
      ["t-growth", "Growth", ["sites", "email-campaigns", "reputation"]],
      ["t-insight", "Reporting", ["reporting"]],
    ],
    ["contacts", "conversations", "documents", "invoices"],
  ),
  preset(
    "tpl-fitness",
    "Fitness studio",
    [
      ["t-members", "Members", ["memberships", "contacts", "conversations"]],
      ["t-schedule", "Schedule", ["calendars", "events", "meetings"]],
      ["t-sell", "Sell", ["products", "stores", "payments", "subscriptions"]],
      ["t-marketing", "Marketing", ["social-planner", "email-campaigns", "reputation", "sites"]],
      ["t-insight", "Reporting", ["reporting", "dashboards"]],
    ],
    ["memberships", "calendars", "conversations", "payments"],
  ),
  preset(
    "tpl-coaching",
    "Coaching & courses",
    [
      ["t-audience", "Audience", ["contacts", "conversations", "memberships"]],
      ["t-programmes", "Programmes", ["events", "webinars", "meetings", "calendars"]],
      ["t-sell", "Sell", ["products", "stores", "payments", "subscriptions", "invoices"]],
      ["t-launch", "Market", ["email-campaigns", "social-planner", "sites", "ad-manager"]],
      ["t-automate", "Automate", ["automation", "ai-agents-product"]],
    ],
    ["conversations", "memberships", "events", "payments"],
  ),
];

/**
 * The template's groups, then whatever the account already had for the rest.
 *
 * A template names a handful of products — sixteen for the dental one — and an
 * account can own a hundred. Filing only the named ones and letting the rest
 * fall loose produced five groups above eighty ungrouped rows, which is a flat
 * list with a header on it: the opposite of what applying a grouping is for.
 *
 * So the unclaimed products keep the shape they already had. The account's own
 * tree is materialised, stripped of anything the template just claimed, and
 * appended — groups it empties are dropped. The template leads, the account's
 * existing structure carries the tail, and nothing ends up loose that was not
 * loose before.
 */
function mergedGroups(
  a: NavArrangement,
  target: NavLayoutState,
  owns: ReadonlySet<string>,
) {
  const fromTemplate = a.customGroups
    .map((g) => ({
      ...g,
      productIds: g.productIds
        .map((p) => resolveOwned(p, owns))
        .filter((p): p is string => p !== undefined),
    }))
    .filter((g) => g.productIds.length > 0);

  const claimed = new Set(fromTemplate.flatMap((g) => g.productIds));

  const byLabel = (label: string) => label.trim().toLowerCase();
  const templateLabels = new Map(
    fromTemplate.map((g) => [byLabel(g.label), g] as const),
  );

  const remaining: typeof fromTemplate = [];
  for (const group of customTreeFor(target).customGroups) {
    const left = group.productIds.filter((p) => !claimed.has(p));
    if (left.length === 0) continue;
    // Same id only when the template came from this account; same LABEL
    // happens all the time, because both sides call a thing "Reporting". Two
    // rows with one name is worse than either arrangement on its own, so the
    // leftovers join the template's group instead of starting a rival.
    if (fromTemplate.some((t) => t.id === group.id)) continue;
    const twin = templateLabels.get(byLabel(group.label));
    if (twin) {
      twin.productIds = [...twin.productIds, ...left];
      continue;
    }
    remaining.push({ ...group, productIds: left });
  }

  return [...fromTemplate, ...remaining];
}

/**
 * The patch one arrangement makes on one target, independent of the store.
 *
 * Split out of `patchFor` so a template that has just been created — and is
 * therefore not in `templates` yet this tick — can still be applied.
 *
 * Returns a NavArrangement rather than a loose patch, because it builds every
 * one of those fields and callers need that guarantee: this result IS what the
 * account ends up arranged as, so it is also the honest thing to record as the
 * link's base. Recording the template's own arrangement instead made every
 * account look edited the instant it was applied — the template names products
 * the account may not own, those get filtered out on the way in, and the
 * difference between "what the template says" and "what landed here" is not
 * something a person did.
 */
export function patchForArrangement(
  a: NavArrangement,
  target: NavLayoutState,
): NavArrangement {
    const owns = new Set(target.enabledProducts);

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
      // Each id is translated to whatever this account calls the same
      // product before being filtered, so the two catalogues do not read as
      // "owns nothing" to one another.
      customGroups: mergedGroups(a, target, owns),
      /*
       * Never hand back an empty dock.
       *
       * A template's pins are its author's, and an account that owns none of
       * them would have had its favourites silently emptied by applying a
       * grouping — which is not what "apply a grouping" promises, and is
       * destructive in a way the rest of the patch is not. So: the
       * template's pins where the account owns them, and its own if that
       * leaves nothing.
       */
      pinned: (() => {
        const kept = a.pinned
          .map((p) => resolveOwned(p, owns))
          .filter((p): p is string => p !== undefined);
        return kept.length > 0 ? kept : target.pinned;
      })(),
      hiddenRows: a.hiddenRows
        .map((p) => resolveOwned(p, owns))
        .filter((p): p is string => p !== undefined),
      // The tail also holds the account's OWN links, which the template knows
      // nothing about — so template order first, then anything of the
      // account's it did not mention, rather than discarding them.
      tailOrder: [
        ...a.tailOrder
          .map((p) => resolveOwned(p, owns))
          .filter((p): p is string => p !== undefined),
        ...target.tailOrder.filter((p) => !a.tailOrder.includes(p)),
      ],
    };
}

/**
 * "Jan 14, 2026", for the line under a template's name.
 *
 * Only ever called from an event handler — a save or a duplicate — so it never
 * runs during a render and can never disagree between the server's HTML and the
 * browser's first paint.
 */
function today(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Which group a product sits in, by label — the only stable handle across two trees. */
function groupLabelOf(a: NavArrangement, productId: string): string | null {
  for (const g of a.customGroups) if (g.productIds.includes(productId)) return g.label;
  return null;
}

function productsOf(a: NavArrangement): Set<string> {
  return new Set(a.customGroups.flatMap((g) => g.productIds));
}

const sameList = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * What changed between two versions of a template, in a sentence a person reads.
 *
 * The whole argument for this: a nav that rearranged itself is a bug until
 * somebody names the change. "Added Payments, moved Reporting into Growth" is
 * the difference between a support ticket and a shrug — and it is computable,
 * which is the only reason the version stamp is worth carrying.
 *
 * Deliberately short and deliberately incomplete. A full structural diff of two
 * trees is a wall of text nobody finishes; five lines and a tail count is what
 * a person will actually read before pressing on.
 */
export function describeChanges(
  before: NavArrangement,
  after: NavArrangement,
): string[] {
  const out: string[] = [];
  const was = productsOf(before);
  const now = productsOf(after);

  const added = [...now].filter((p) => !was.has(p));
  const removed = [...was].filter((p) => !now.has(p));
  if (added.length > 0) out.push(`Added ${added.length === 1 ? added[0] : `${added.length} products`}`);
  if (removed.length > 0)
    out.push(`Removed ${removed.length === 1 ? removed[0] : `${removed.length} products`}`);

  const moved = [...now].filter(
    (p) => was.has(p) && groupLabelOf(before, p) !== groupLabelOf(after, p),
  );
  if (moved.length > 0)
    out.push(
      moved.length === 1
        ? `Moved ${moved[0]} into ${groupLabelOf(after, moved[0])}`
        : `Moved ${moved.length} products between groups`,
    );

  const groupsBefore = before.customGroups.map((g) => g.label);
  const groupsAfter = after.customGroups.map((g) => g.label);
  const newGroups = groupsAfter.filter((g) => !groupsBefore.includes(g));
  const goneGroups = groupsBefore.filter((g) => !groupsAfter.includes(g));
  if (newGroups.length > 0) out.push(`New group ${newGroups.join(", ")}`);
  if (goneGroups.length > 0) out.push(`Dropped group ${goneGroups.join(", ")}`);

  const renamed = Object.keys(after.agencyProductLabels).filter(
    (k) => after.agencyProductLabels[k] !== before.agencyProductLabels[k],
  );
  if (renamed.length > 0)
    out.push(
      renamed.length === 1
        ? `Renamed ${renamed[0]} to ${after.agencyProductLabels[renamed[0]]}`
        : `Renamed ${renamed.length} rows`,
    );

  if (!sameList(before.pinned, after.pinned)) out.push("Changed the pinned set");
  if (!sameList(before.hiddenRows, after.hiddenRows)) out.push("Changed which rows are hidden");

  if (out.length === 0) out.push("No visible change to the arrangement");
  return out.length > 5 ? [...out.slice(0, 5), `…and ${out.length - 5} more`] : out;
}

const sameMap = (
  a: Readonly<Record<string, string>>,
  b: Readonly<Record<string, string>>,
) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) if (a[k] !== b[k]) return false;
  return true;
};

/**
 * Whether an account has moved away from the template it took.
 *
 * EVERY field, not the interesting-looking ones. This started as a handful of
 * checks — pins, hidden rows, renames, icons, which group a product is in — on
 * the reasoning that those are the edits people make. They are not the only
 * ones: reordering rows inside a group, reordering the groups themselves,
 * renaming a group, adding one, hiding a block. An account that did any of
 * those was reported as untouched, so "Save template" stayed dead over a nav
 * that had genuinely diverged, and the only way to find out was to notice the
 * button never came back.
 *
 * The honest question is "is this arrangement the one we handed it", and that
 * is a comparison of the whole thing. It is also what keeps the answer correct
 * as the editor grows: a new arrangement field is caught here the day it is
 * added to NavArrangement, rather than the day somebody reports the button.
 *
 * Cheap enough to run every render — a couple of hundred strings — and it only
 * runs at all for an account that is on a template.
 */
export function hasLocalChanges(
  base: NavArrangement,
  current: NavArrangement,
): boolean {
  if (base.grouping !== current.grouping) return true;

  // Order matters in all four: a dock reordered is a dock changed, and a tail
  // reordered is the agency deciding what sits at the bottom of this nav.
  if (!sameList(base.pinned, current.pinned)) return true;
  if (!sameList(base.hiddenRows, current.hiddenRows)) return true;
  if (!sameList(base.hiddenBlocks, current.hiddenBlocks)) return true;
  if (!sameList(base.tailOrder, current.tailOrder)) return true;

  if (!sameMap(base.agencyLabels, current.agencyLabels)) return true;
  if (!sameMap(base.agencyProductLabels, current.agencyProductLabels)) return true;
  if (!sameMap(base.icons, current.icons)) return true;

  // groupOrder holds per-group row order in the non-custom modes, so it is as
  // much a part of the arrangement as the tree is.
  // Keyed by grouping mode, so the keys are typed rather than free strings.
  const orderKeys = new Set<GroupingMode>([
    ...(Object.keys(base.groupOrder) as GroupingMode[]),
    ...(Object.keys(current.groupOrder) as GroupingMode[]),
  ]);
  for (const k of orderKeys)
    if (!sameList(base.groupOrder[k] ?? [], current.groupOrder[k] ?? [])) return true;

  if (base.customGroups.length !== current.customGroups.length) return true;
  for (let i = 0; i < base.customGroups.length; i += 1) {
    const was = base.customGroups[i];
    const now = current.customGroups[i];
    // Compared positionally, because the order of the groups IS the nav.
    if (was.id !== now.id) return true;
    if (was.label !== now.label) return true;
    if (was.iconName !== now.iconName) return true;
    if (!sameList(was.productIds, now.productIds)) return true;
  }

  return false;
}

/** The half of `changed` that `base` never said — i.e. what the agency did here. */
function localKeys(
  base: Record<string, string>,
  current: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const k of Object.keys(current)) if (current[k] !== base[k]) out[k] = current[k];
  return out;
}

/**
 * The new template arrangement, with this account's own tuning put back on top.
 *
 * The single most important function in the feature, because the alternative is
 * a choice between two bad answers: overwrite, and an agency loses the hour it
 * spent tuning one client's nav; or skip, and the account it spent that hour on
 * is the one account that never gets a fix again. Neither is what anyone means
 * by "update the template".
 *
 * So the account's nav is treated as `base + delta`, and only the BASE is
 * replaced. Anything the account differs from its base on is, by definition,
 * something a person deliberately did to this account, and it is re-applied
 * afterwards.
 *
 * Where the template wins: the shape. Groups, their order, and where untouched
 * products live are the template's whole reason for existing, and an account
 * that never moved a row has no opinion to defend.
 *
 * Where the account wins: rows it actually touched — a product it moved to a
 * different group, a rename, an icon, its pins, its hidden rows.
 *
 * Where NOBODY wins: a row the template removed that this account had moved.
 * The delta has nowhere to land, so it is dropped rather than resurrecting a
 * row the agency just deliberately deleted. That is a real loss, which is why
 * `describeChanges` names removals on the notice.
 */
/**
 * Where the template and the account changed the same thing.
 *
 * `rebase` already answers this question implicitly and then forgets it: for
 * every property it keeps the local value, whether the template left that
 * property alone or moved it too. The first case is a clean merge — two people
 * edited different things. The second is a decision being taken on somebody's
 * behalf, and it is the only one worth telling anyone about.
 *
 * So a collision is three-way: the value the account started from, what it has
 * now, and what the template now holds — all different. Two of them matching
 * means one side did not move.
 */
export function collisionsBetween(
  base: NavArrangement,
  current: NavArrangement,
  next: NavArrangement,
): string[] {
  const out: string[] = [];

  const mapClash = (
    label: (key: string) => string,
    pick: (a: NavArrangement) => Record<string, string>,
  ) => {
    for (const key of Object.keys(pick(current))) {
      const was = pick(base)[key];
      const mine = pick(current)[key];
      const theirs = pick(next)[key];
      if (mine === was) continue; // the account did not touch it
      if (theirs === undefined || theirs === was) continue; // nor did the template
      if (mine === theirs) continue; // both landed on the same answer
      out.push(label(key));
    }
  };

  mapClash(
    (key) => `Both renamed ${key} — yours “${current.agencyProductLabels[key]}”, the template’s “${next.agencyProductLabels[key]}”`,
    (a) => a.agencyProductLabels,
  );
  mapClash(
    (key) => `Both renamed the ${key} group`,
    (a) => a.agencyLabels,
  );
  mapClash((key) => `Both changed the icon on ${key}`, (a) => a.icons);

  if (!sameList(base.pinned, current.pinned) && !sameList(base.pinned, next.pinned)) {
    out.push("Both changed the pinned set");
  }

  // Where a product lives, which is the change people notice first.
  for (const productId of productsOf(current)) {
    const was = groupLabelOf(base, productId);
    const mine = groupLabelOf(current, productId);
    const theirs = groupLabelOf(next, productId);
    if (mine === was || theirs === null || theirs === was || mine === theirs) continue;
    out.push(`Both moved ${productId} — yours to ${mine}, the template’s to ${theirs}`);
  }

  return out;
}

export function rebase(
  base: NavArrangement,
  current: NavArrangement,
  next: NavArrangement,
): NavArrangement {
  const groups = next.customGroups.map((g) => ({ ...g, productIds: [...g.productIds] }));
  const live = new Set(groups.flatMap((g) => g.productIds));

  for (const productId of productsOf(current)) {
    const wasIn = groupLabelOf(base, productId);
    const isIn = groupLabelOf(current, productId);
    // Untouched here, or touched but no longer in the template at all.
    if (wasIn === isIn || isIn === null || !live.has(productId)) continue;
    for (const g of groups) {
      const at = g.productIds.indexOf(productId);
      if (at !== -1) g.productIds.splice(at, 1);
    }
    const home = groups.find((g) => g.label === isIn);
    if (home) home.productIds.push(productId);
    // The group they moved it to is one the template does not have. Rebuilding
    // a whole group from a single row would be inventing structure; the row
    // takes the template's placement instead, and the notice says so.
    else {
      const original = next.customGroups.find((g) => g.productIds.includes(productId));
      const back = groups.find((g) => g.id === original?.id);
      if (back) back.productIds.push(productId);
    }
  }

  return {
    ...next,
    customGroups: groups.filter((g) => g.productIds.length > 0),
    agencyLabels: { ...next.agencyLabels, ...localKeys(base.agencyLabels, current.agencyLabels) },
    agencyProductLabels: {
      ...next.agencyProductLabels,
      ...localKeys(base.agencyProductLabels, current.agencyProductLabels),
    },
    icons: { ...next.icons, ...localKeys(base.icons, current.icons) },
    // Whole-list fields: an account that reordered its dock at all owns its dock.
    pinned: sameList(base.pinned, current.pinned) ? next.pinned : current.pinned,
    hiddenRows: sameList(base.hiddenRows, current.hiddenRows)
      ? next.hiddenRows
      : current.hiddenRows,
  };
}

export function NavTemplatesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { templateSeed } = useTheme().effective;
  const [templates, setTemplates] = React.useState<readonly NavTemplate[]>(
    SEED_TEMPLATES,
  );
  /** accountId → the template it is on, the version it took, and that base. */
  const [links, setLinks] = React.useState<Record<string, TemplateLink>>({});
  /** accountId → what a push did to it, waiting to be read. */
  const [notices, setNotices] = React.useState<Record<string, TemplateNotice>>({});
  const [diverged, setDiverged] = React.useState<
    Record<string, TemplateDivergence>
  >({});
  const seq = React.useRef(0);
  // `update` needs the template it is replacing without taking `templates` as a
  // dependency — the callback is handed to a menu that must not be rebuilt on
  // every save.
  const templatesRef = React.useRef(templates);
  React.useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);

  const save = React.useCallback(
    (name: string, fromAccount: string, state: NavLayoutState) => {
      const trimmed = name.trim();
      if (trimmed === "") return null;
      seq.current += 1;
      const arrangement = captureArrangement(state);
      /*
       * Built here and RETURNED, not just pushed into state.
       *
       * The caller's next move is to put this template on the account it came
       * from, and `setTemplates` has not landed by then — a lookup by id in the
       * same tick finds nothing, so the apply and the link both silently no-op.
       * Handing back the object closes that gap without a effect-and-flag dance.
       */
      const created: NavTemplate = {
        id: `tpl-${seq.current}`,
        name: trimmed,
        fromAccount,
        version: 1,
        updatedAt: today(),
        // What the template ARRANGES, not what the account owns — the two
        // differ the moment a product sits in no group.
        productCount: new Set(arrangement.customGroups.flatMap((g) => g.productIds))
          .size,
        arrangement,
      };
      setTemplates((all) => [...all, created]);
      return created;
    },
    [],
  );

  const update = React.useCallback(
    (id: string, fromAccount: string, state: NavLayoutState) => {
      const arrangement = captureArrangement(state);
      const before = templatesRef.current.find((t) => t.id === id);
      if (!before) return null;
      // The default is not a place to put things. See DEFAULT_TEMPLATE_ID.
      if (before.immutable) return null;
      const after: NavTemplate = {
        ...before,
        builtIn: false,
        fromAccount,
        version: before.version + 1,
        updatedAt: today(),
        productCount: new Set(arrangement.customGroups.flatMap((g) => g.productIds))
          .size,
        arrangement,
      };
      setTemplates((all) =>
        all.map((t) =>
          t.id === id
            ? {
                ...t,
                /*
                 * An overwritten preset stops calling itself a preset.
                 *
                 * `builtIn` means "this is what we shipped", and the moment an
                 * agency saves their own arrangement into one that is no longer
                 * true. Keeping the badge would have the list vouching for a
                 * tree nobody at HighLevel has seen. So the row starts saying
                 * where it actually came from instead.
                 */
                builtIn: false,
                fromAccount,
                version: t.version + 1,
                updatedAt: today(),
                productCount: new Set(
                  arrangement.customGroups.flatMap((g) => g.productIds),
                ).size,
                arrangement,
              }
            : t,
        ),
      );
      return after;
    },
    [],
  );

  const remove = React.useCallback(
    (id: string) => {
      setTemplates((all) =>
        all.filter((t) => t.id !== id || t.immutable === true),
      );
      // Links to a template that no longer exists would leave accounts claiming
      // to be on nothing, and the menu offering to update it.
      setLinks((all) =>
        Object.fromEntries(
          Object.entries(all).filter(([, held]) => held.templateId !== id),
        ),
      );
    },
    [],
  );

  const [toast, setToast] = React.useState<{
    id: number;
    message: string;
  } | null>(null);
  const toastId = React.useRef(0);
  const notify = React.useCallback((message: string) => {
    toastId.current += 1;
    setToast({ id: toastId.current, message });
  }, []);
  const dismissToast = React.useCallback(() => setToast(null), []);

  const rename = React.useCallback((id: string, name: string) => {
    const next = name.trim();
    if (next === "") return;
    setTemplates((all) =>
      all.map((t) =>
        // The guard is here as well as in the menu: a disabled control is a
        // courtesy, and the rule belongs with the data it protects.
        t.id === id && !t.builtIn && !t.immutable ? { ...t, name: next } : t,
      ),
    );
  }, []);

  const link = React.useCallback(
    (accountId: string, templateId: string, base: NavArrangement) =>
      /*
       * No version number on the link, deliberately.
       *
       * It was one, read off `templatesRef` — which only catches up in an
       * effect, so a link written in the same tick as the save that caused it
       * recorded the version it was replacing. The stamp would have been wrong
       * exactly when it mattered.
       *
       * The base makes it unnecessary anyway: an account is current when its
       * base IS the template's arrangement, and stale when it is not. One
       * comparison, no second fact to keep in step.
       */
      setLinks((all) => ({ ...all, [accountId]: { templateId, base } })),
    [],
  );

  const divergedFor = React.useCallback(
    (accountId: string) => diverged[accountId] ?? null,
    [diverged],
  );
  const markDiverged = React.useCallback(
    (accountId: string, divergence: TemplateDivergence) =>
      setDiverged((all) => ({ ...all, [accountId]: divergence })),
    [],
  );
  const clearDivergence = React.useCallback((accountId: string) => {
    setDiverged((all) => {
      if (!(accountId in all)) return all;
      const next = { ...all };
      delete next[accountId];
      return next;
    });
  }, []);

  const unlink = React.useCallback((accountId: string) => {
    setLinks((all) => {
      if (!(accountId in all)) return all;
      const next = { ...all };
      delete next[accountId];
      return next;
    });
  }, []);

  const reassign = React.useCallback(
    (fromTemplateId: string, toTemplateId: string) => {
      setLinks((all) =>
        Object.fromEntries(
          Object.entries(all).map(([accountId, held]) =>
            held.templateId === fromTemplateId
              ? [accountId, { ...held, templateId: toTemplateId }]
              : [accountId, held],
          ),
        ),
      );
    },
    [],
  );

  const linkedIdFor = React.useCallback(
    (accountId: string) => links[accountId]?.templateId ?? null,
    [links],
  );

  const linkedFor = React.useCallback(
    (accountId: string) => {
      const id = links[accountId]?.templateId;
      return (id && templates.find((t) => t.id === id)) || null;
    },
    [links, templates],
  );

  const linkFor = React.useCallback(
    (accountId: string) => links[accountId] ?? null,
    [links],
  );

  const isCurrent = React.useCallback(
    (accountId: string) => {
      const held = links[accountId];
      if (!held) return false;
      const tpl = templates.find((t) => t.id === held.templateId);
      return tpl ? tpl.arrangement === held.base : false;
    },
    [links, templates],
  );

  const duplicate = React.useCallback((id: string) => {
    const from = templatesRef.current.find((t) => t.id === id);
    if (!from) return null;
    seq.current += 1;
    const copy: NavTemplate = {
      ...from,
      id: `tpl-${seq.current}`,
      // "(copy)" rather than "(2)": the list is read by a person deciding which
      // one is the live one, and a numeral does not say which came first.
      name: `${from.name} (copy)`,
      builtIn: false,
      // A duplicated preset has an origin now — this agency's, not HighLevel's.
      fromAccount: from.builtIn ? "Preset" : from.fromAccount,
      version: 1,
      updatedAt: today(),
    };
    setTemplates((all) => [...all, copy]);
    // No `link` call, on purpose. Nobody is on a copy until somebody applies it.
    return copy;
  }, []);

  const markPushed = React.useCallback(
    (
      entries: readonly { accountId: string; kept: boolean }[],
      templateName: string,
      version: number,
      changes: readonly string[],
    ) =>
      setNotices((all) => {
        const next = { ...all };
        for (const e of entries)
          next[e.accountId] = { templateName, version, changes, kept: e.kept };
        return next;
      }),
    [],
  );

  const noticeFor = React.useCallback(
    (accountId: string) => notices[accountId] ?? null,
    [notices],
  );

  const dismissNotice = React.useCallback(
    (accountId: string) =>
      setNotices((all) => {
        if (!(accountId in all)) return all;
        const next = { ...all };
        delete next[accountId];
        return next;
      }),
    [],
  );

  const accountsOn = React.useCallback(
    (templateId: string) =>
      Object.values(links).filter((held) => held.templateId === templateId).length,
    [links],
  );

  const accountsOnIds = React.useCallback(
    (templateId: string) =>
      Object.entries(links)
        .filter(([, held]) => held.templateId === templateId)
        .map(([accountId]) => accountId),
    [links],
  );

  const patchFor = React.useCallback(
    (id: string, target: NavLayoutState): Partial<NavLayoutState> | null => {
      /*
        The default has no stored arrangement to hand back.

        It means "the navigation this tenant ships with", which is a different
        set of rows for every account — so the caller resets from the account's
        own profile instead of patching from here. Null says "nothing to patch"
        and the apply path reads the id to know why.
      */
      if (id === DEFAULT_TEMPLATE_ID) return null;
      const tpl = templates.find((t) => t.id === id);
      return tpl ? patchForArrangement(tpl.arrangement, target) : null;
    },
    [templates],
  );

  /*
   * What the menus see, which is not always what the store holds.
   *
   * Filtered rather than seeded differently, so the axis is reversible: the
   * presets stay in state and come back the moment it is switched, and anything
   * the agency made itself is never touched — only the shipped examples are
   * hidden. The immutable default is `builtIn` too and always stays.
   */
  const visible = React.useMemo(
    () =>
      templateSeed === "presets"
        ? templates
        : templates.filter((t) => !t.builtIn || t.immutable),
    [templates, templateSeed],
  );

  const value = React.useMemo<TemplatesValue>(
    () => ({
      templates: visible,
      save,
      update,
      remove,
      rename,
      duplicate,
      patchFor,
      linkedIdFor,
      linkedFor,
      linkFor,
      isCurrent,
      link,
      unlink,
      reassign,
      accountsOn,
      accountsOnIds,
      markPushed,
      noticeFor,
      dismissNotice,
      divergedFor,
      markDiverged,
      clearDivergence,
      notify,
      toast,
      dismissToast,
    }),
    [
      visible,
      save,
      update,
      remove,
      rename,
      duplicate,
      patchFor,
      linkedIdFor,
      linkedFor,
      linkFor,
      isCurrent,
      link,
      unlink,
      reassign,
      accountsOn,
      accountsOnIds,
      markPushed,
      noticeFor,
      dismissNotice,
      divergedFor,
      markDiverged,
      clearDivergence,
      notify,
      toast,
      dismissToast,
    ],
  );

  return <TemplatesContext value={value}>{children}</TemplatesContext>;
}
