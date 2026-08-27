"use client";

import * as React from "react";
import { resolveOwned } from "./catalogue-equivalents";
import { customTreeFor, type NavLayoutState } from "./grouping";

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
  /** How many products it arranges, as a rough size for the list. */
  productCount: number;
  arrangement: NavArrangement;
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
  linkedFor: (accountId: string) => NavTemplate | null;
  link: (accountId: string, templateId: string) => void;
  /** How many accounts are on a template. Shown before an update overwrites it. */
  accountsOn: (templateId: string) => number;
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
 */
export function patchForArrangement(
  a: NavArrangement,
  target: NavLayoutState,
): Partial<NavLayoutState> {
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

export function NavTemplatesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [templates, setTemplates] = React.useState<readonly NavTemplate[]>(
    SEED_TEMPLATES,
  );
  /** accountId → the template it is on. */
  const [links, setLinks] = React.useState<Record<string, string>>({});
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
      const after: NavTemplate = {
        ...before,
        builtIn: false,
        fromAccount,
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
      setTemplates((all) => all.filter((t) => t.id !== id));
      // Links to a template that no longer exists would leave accounts claiming
      // to be on nothing, and the menu offering to update it.
      setLinks((all) =>
        Object.fromEntries(
          Object.entries(all).filter(([, templateId]) => templateId !== id),
        ),
      );
    },
    [],
  );

  const link = React.useCallback(
    (accountId: string, templateId: string) =>
      setLinks((all) => ({ ...all, [accountId]: templateId })),
    [],
  );

  const linkedIdFor = React.useCallback(
    (accountId: string) => links[accountId] ?? null,
    [links],
  );

  const linkedFor = React.useCallback(
    (accountId: string) => {
      const id = links[accountId];
      return (id && templates.find((t) => t.id === id)) || null;
    },
    [links, templates],
  );

  const accountsOn = React.useCallback(
    (templateId: string) =>
      Object.values(links).filter((id) => id === templateId).length,
    [links],
  );

  const patchFor = React.useCallback(
    (id: string, target: NavLayoutState): Partial<NavLayoutState> | null => {
      const tpl = templates.find((t) => t.id === id);
      return tpl ? patchForArrangement(tpl.arrangement, target) : null;
    },
    [templates],
  );

  const value = React.useMemo<TemplatesValue>(
    () => ({
      templates,
      save,
      update,
      remove,
      patchFor,
      linkedIdFor,
      linkedFor,
      link,
      accountsOn,
    }),
    [
      templates,
      save,
      update,
      remove,
      patchFor,
      linkedIdFor,
      linkedFor,
      link,
      accountsOn,
    ],
  );

  return <TemplatesContext value={value}>{children}</TemplatesContext>;
}
