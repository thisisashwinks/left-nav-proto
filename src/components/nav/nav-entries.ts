import { Link2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { childById, productById } from "./catalogue";
import type { CatalogueChild } from "./catalogue-types";
import {
  childrenFor,
  glyphFor,
  applyOrder,
  iconForProduct,
  labelForProduct,
  NAV_VOLUME_EXTRA_LINKS,
  UNGROUPED_ID,
  type NavLayoutState,
  type ResolvedGroup,
} from "./grouping";
import { GET_APP_FLYOUT_ID } from "@/components/flyout/get-app-flyout";
import { chromePlace, isChromePlace } from "./chrome-places";
import { PROPOSED_SETTINGS_ID } from "./proposed-ia";
import type { NavEntry, NavItem } from "./types";

/**
 * The custom links the volume switch piles on.
 *
 * Named like the real thing rather than "Item 7" — an agency's nav fills up with
 * links to their own tools, and a nav full of placeholder text does not read like
 * the problem it is standing in for. They carry no flyout, because a custom link is
 * a destination.
 */
const CUSTOM_LINK_NAMES = [
  "Client portal",
  "Onboarding hub",
  "Support desk",
  "Billing portal",
  "Brand assets",
  "Training library",
  "Partner directory",
  "Status page",
  "Release notes",
  "Community",
  "Referral program",
  "Templates vault",
  "Reporting exports",
  "Compliance centre",
  "Vendor invoices",
];

function volumeLinks(count: number): NavItem[] {
  return Array.from({ length: count }, (_, i) => ({
    // Wraps rather than running out, so `overloaded` can exceed the name list.
    id: `custom-link-${i + 1}`,
    label:
      i < CUSTOM_LINK_NAMES.length
        ? (CUSTOM_LINK_NAMES[i] as string)
        : `${CUSTOM_LINK_NAMES[i % CUSTOM_LINK_NAMES.length]} ${
            Math.floor(i / CUSTOM_LINK_NAMES.length) + 1
          }`,
    icon: Link2,
  }));
}

/**
 * The account's own links — its portals, wikis and supplier tools.
 *
 * Real per tenant rather than generated, because the point they make is
 * different from the volume switch's: these are the handful of links a
 * roofing company genuinely has, and they are what makes one account's nav
 * read as a different business from its neighbour's.
 */
function accountLinks(labels: string[]): NavItem[] {
  return labels.map((label, i) => ({
    id: `account-link-${i + 1}`,
    label,
    icon: Link2,
  }));
}

/**
 * The middle of the nav, derived from the active grouping.
 *
 * One function for both nav faces so the rail and the expanded nav can never
 * disagree about what the nav contains — they only differ in how they draw it.
 * That includes the volume switch's custom links, which is why it belongs here
 * rather than in either face.
 */
/**
 * The tail's rows, in the account's own order.
 *
 * Products no category claims and the account's own links are one list here,
 * because on screen they are one run of rows — and because a drag has to be able
 * to put a product between two links. The volume switch's generated links stay at
 * the end: they are stress-test scaffolding, not something anyone arranges.
 */
/**
 * Tail rows that are chrome rather than catalogue.
 *
 * A set rather than a check per id, because the next one — whatever the nav
 * grows next — should be a line here and nothing else.
 */
export const CHROME_TAIL_IDS: ReadonlySet<string> = new Set([
  GET_APP_FLYOUT_ID,
]);

/**
 * `glyphFor`'s answer, in the shape a NavItem wants.
 *
 * One rename — `badge` to `badgeIcon` — and it exists because spreading the
 * two together would have compiled and done nothing: a spread skips the
 * excess-property check, so the badge would have been dropped silently and
 * the composed icon would simply never have appeared. The adapter makes the
 * mismatch a thing the compiler can see.
 */
function navGlyph(
  state: NavLayoutState,
  id: string,
): { icon: LucideIcon; badgeIcon?: LucideIcon } {
  const { icon, badge } = glyphFor(state, id);
  return badge ? { icon, badgeIcon: badge } : { icon };
}

export function tailRowsFor(
  state: NavLayoutState,
  looseIds: readonly string[],
  /**
   * Rows that are in the tail without being products or links.
   *
   * Desktop & mobile apps is the case, and the reason this parameter exists
   * rather than the row being spliced in after the fact: a row the tail does
   * not know about cannot be ORDERED by it. Renaming and re-iconing are
   * per-row overrides and worked either way, but "move up" needs the row to be
   * a member of the list whose positions it is moving through — see
   * `placeInTail`, which computes indices over exactly this array.
   *
   * Their default place is ahead of the account's own links: the links are the
   * tail's own tail, and a row buried under six portals is a row nobody finds.
   * `state.tailOrder` overrides that the moment anyone drags it.
   */
  extras: readonly NavItem[] = [],
): NavItem[] {
  const links = accountLinks(state.customLinks);
  const byId = new Map<string, NavItem>();
  for (const id of looseIds) {
    byId.set(id, {
      id,
      label: labelForProduct(state, id),
      /*
        `glyphFor`, not the row's own icon.

        A lifted row whose name had to be qualified — "Conversations ›
        Settings" — gets its PARENT's mark as the base and its own as a badge
        on the corner. That is the right way round: the shared thing
        identifies the family, so it takes the size, and the part you are
        scanning for is the part that differs. The pinned dock has drawn these
        this way since it shipped; this is the column catching up. The helper
        omits the badge entirely for an unqualified row, so the spread is a
        no-op for almost every row in the nav.
      */
      ...navGlyph(state, id),
      /*
       * A lifted row keeps its own children — see `liftedChildren`.
       *
       * Stated here as well as in `productRow` because the tail is built twice
       * by two different branches: the proposed tree orders its loose rows
       * through this function, every other tree maps them straight. Fixing
       * only the second left the promoted row a dead end on the one tree most
       * of this prototype runs.
       */
      ...(liftedChildren(state, id).length > 0 ? { hasFlyout: true } : {}),
    });
  }
  for (const extra of extras) byId.set(extra.id, extra);
  /*
   * Children the account has lifted to the top level.
   *
   * `looseProductIds` walks `allProducts`, so it can only ever name a PRODUCT
   * — which meant "Move to top level" on an L3 wrote the id into `tailOrder`
   * and then nothing drew it: the row was filtered out one line below, and the
   * verb silently did nothing. (Found Oct 9, checking the L3 menu rather than
   * trusting it.)
   *
   * `tailOrder` is itself the record of which children have been lifted — no
   * new state. A child id is only in it because someone put it there, so
   * resolving those ids here is reading the decision back rather than
   * inventing one. The catalogue is untouched: the child still belongs to its
   * product, and this is the account saying where it wants the row drawn.
   */
  const lifted: string[] = [];
  for (const id of state.tailOrder) {
    if (byId.has(id)) continue;
    /*
     * A CHROME row the account has dragged up here, resolved the same way.
     *
     * Download apps' two installers are the case. They are neither products
     * nor children, so `looseIds` never names them and the `childById` guard
     * below skipped them — which meant dropping one on an L1 seam wrote the
     * id into `tailOrder`, `byId` never got an entry, and the `known` filter
     * at the foot of this function dropped it again. The nav reported the
     * move because the move HAD happened; the row simply had nothing to draw
     * itself with. Ashwin reported it twice, which it deserved: the first
     * fix kept the id in state and still never built a row.
     *
     * `labelForProduct` and `iconForProduct` both already fall through to
     * `chromePlace`, so the row renames and re-icons like any other — the
     * only thing missing was somewhere for it to exist. Ashwin, Oct 16.
     */
    if (isChromePlace(id)) {
      lifted.push(id);
      byId.set(id, {
        id,
        label: labelForProduct(state, id),
        ...navGlyph(state, id),
        /*
          The badge comes up with the row.

          "New" and "Beta" were properties of the FLYOUT's config, so a row
          dragged out of it arrived at L1 bare — the same row, one level up,
          missing the one thing on it that was time-sensitive. They live on
          the chrome registry now, which is what every other resolver
          already reads. Ashwin, Oct 16.
        */
        ...(chromePlace(id)?.badge ? { badge: chromePlace(id)!.badge } : {}),
      });
      continue;
    }
    const hit = childById(id);
    if (!hit) continue;
    lifted.push(id);
    byId.set(id, {
      id,
      label: labelForProduct(state, id),
      // See the note on the loose rows above. A lifted CHILD is the case this
      // was written for: its name collides with its siblings' by definition.
      ...navGlyph(state, id),
      // And a catalogue child's badge travels for the same reason a chrome
      // row's does — it describes the destination, not the panel.
      ...(hit.child.badge ? { badge: hit.child.badge } : {}),
      ...(liftedChildren(state, id).length > 0 ? { hasFlyout: true } : {}),
    });
  }
  for (const link of links) byId.set(link.id, link);
  const defaults = [
    ...looseIds,
    ...lifted,
    ...extras.map((e) => e.id),
    ...links.map((l) => l.id),
  ];
  const known = state.tailOrder.filter((id) => byId.has(id));
  const missing = defaults.filter((id) => !known.includes(id));
  return [...known, ...missing]
    .map((id) => byId.get(id))
    .filter((item): item is NavItem => item !== undefined);
}

/*
 * `withMiddleTailRow` used to splice a chrome row into the entry list here.
 *
 * Replaced by `tailRowsFor`'s `extras` (Sep 10). Splicing put the row on
 * screen but not in the tail, so it could be renamed and re-iconed and not
 * MOVED — "move up" computes indices over the tail array, and a row that is
 * not in that array has no index to move through.
 */

/**
 * The nav's top-level rows, in the order the account put them.
 *
 * One definition, three callers — the entry list that draws them, `moveGroup`
 * which reorders them, and the face that works out which seam a row was dropped
 * into. They have to agree on what "position 3" means or a drag lands somewhere
 * nobody aimed.
 *
 * Chrome rows are IN this list. Desktop & mobile apps used to live in the tail,
 * ordered by `tailOrder` alongside the account's links — which on a nav with no
 * links left it alone in a list of one, with a drag grip that could not move it
 * anywhere and a drop target that was a category offering to swallow it. It is
 * an L1 row like the categories beside it and it reorders like one. Its DEFAULT
 * place is still last, because that is where it belongs until somebody moves
 * it; `groupOrder` overrides that the moment anyone drags it.
 *
 * `applyOrder` drops ids it does not recognise, so a stored order that names a
 * category this account no longer has — or a chrome row a later build removed —
 * simply loses that entry rather than drawing a ghost.
 */
export function l1IdsFor(
  state: NavLayoutState,
  groups: readonly ResolvedGroup[],
  chromeIds: readonly string[] = [...CHROME_TAIL_IDS],
): string[] {
  /*
   * Flat has no L1 run at all.
   *
   * Its whole claim is that a row is a destination rather than a door, so there
   * are no shelves to order against — every row, the chrome one included, is in
   * the tail and reorders by `tailOrder` like the products beside it. Saying so
   * here keeps the face from offering a "move up" that writes an order the flat
   * tree never reads.
   */
  if (state.grouping === "flat") return [];
  const loose = groups.find((g) => g.id === UNGROUPED_ID)?.productIds ?? [];
  const shelves = groups
    .filter(
      (g) =>
        g.id !== PROPOSED_SETTINGS_ID &&
        (loose.length === 0 || g.id !== UNGROUPED_ID),
    )
    .map((g) => g.id);
  /*
   * ONE list, categories and lifted rows alike (Oct 9).
   *
   * It used to be shelves plus chrome, with everything else — the products no
   * category claims, the account's own links — ordered separately by
   * `tailOrder` and concatenated after. That is the two-list model, and the
   * thing it made impossible is the thing Ashwin asked for: a product dropped
   * BETWEEN two categories had nowhere to land, because "between two
   * categories" was not a position the data could express. Every seam in the
   * nav could only offer the head of the tail.
   *
   * No new state. `groupOrder[mode]` is already an ordered list of ids and
   * `applyOrder` has never cared what KIND of id it holds — it keeps the ones
   * the defaults mention, in the stored order, and appends the rest in their
   * authored order. So widening the defaults is the whole change: an account
   * that has never dragged renders byte-for-byte as before, because the
   * appended order is still categories, then chrome, then tail.
   */
  const tail = tailRowsFor(state, loose).map((r) => r.id);
  return applyOrder(state.groupOrder[state.grouping], [
    ...shelves,
    ...chromeIds,
    ...tail.filter((id) => !chromeIds.includes(id)),
  ]);
}

export function navEntriesFor(
  state: NavLayoutState,
  groups: ResolvedGroup[],
  /**
   * Headings instead of rules.
   *
   * Each band gets the small caps label Recent already wears, and the label is
   * what folds it — see `left-nav.tsx`, which owns the fold state because it is
   * a property of the face rather than of the tree.
   */
  sectionHeadings = false,
  /** Tail rows that are neither products nor links. See tailRowsFor. */
  extras: readonly NavItem[] = [],
): NavEntry[] {
  /** A band opener: a heading when they are on, otherwise the rule we shipped. */
  const band = (id: string, text: string): NavEntry =>
    sectionHeadings
      ? { kind: "label", id: `sec-${id}`, text }
      : { kind: "divider", id: `div-${id}` };
  const extra = volumeLinks(NAV_VOLUME_EXTRA_LINKS[state.navVolume]);
  const extraEntries: NavEntry[] =
    extra.length === 0
      ? []
      : [
          ...extra.map((item): NavEntry => ({ kind: "item", item })),
          // With headings the band is opened by its label, so a closing rule
          // would draw a line between it and Settings for no reason.
          ...(sectionHeadings
            ? []
            : [{ kind: "divider" as const, id: "div-custom" }]),
        ];

  /*
   * `extraRows` is gone (Sep 15), and with it the last tree that mapped the
   * extras straight instead of through `tailRowsFor`. Every branch builds its
   * tail the same way now, which is the only way a chrome row can be ordered
   * by the same drag that orders the products beside it.
   */

  /** A row that is only ever a destination. See the flat branch. */
  const flatRow = (id: string): NavEntry => ({
    kind: "item",
    item: {
      id,
      label: labelForProduct(state, id),
      icon: iconForProduct(state, id),
    },
  });

  /*
   * `productRow` is gone with it: the loose rows it built are built by
   * `tailRowsFor` now, lifted children and all — see the note on its `extras`
   * parameter, which carries the same reasoning.
   */

  const shelfRow = (group: ResolvedGroup): NavEntry => ({
    kind: "item",
    item: {
      id: group.id,
      label: group.label,
      icon: group.icon,
      hasFlyout: true,
      flyoutId: group.id,
      /*
       * No AI mark (Sep 15).
       *
       * The bucket used to wear the purple sparkle and a purple label, on the
       * argument that it was a different KIND of row. It is not: it is a
       * bucket of products, it renames and reorders like the twelve around it,
       * and the one row in the nav painted a different colour read as an advert
       * sitting in the tree. The AI products behind it are what make it AI —
       * and the promo in its panel is where the pitch belongs. Grey like
       * everything else.
       */
    },
  });

  /*
   * The L1 run: shelves and chrome rows, in one stored order.
   *
   * Built once here and used by both trees below. A chrome row is drawn exactly
   * like a shelf that has no panel — because that is what it is from the list's
   * point of view, and the moment it was drawn from somewhere else it stopped
   * being reorderable with its neighbours.
   */
  const l1Run = (
    shelves: readonly ResolvedGroup[],
    /*
     * The rows that are not shelves: loose products, chrome, account links.
     *
     * Passed in rather than rebuilt, because the caller already has them and
     * because `l1IdsFor` orders ALL of it in one list now — so this function
     * stopped being "the shelves" and became the whole column. See the note
     * in `l1IdsFor`.
     */
    tailItems: readonly NavItem[] = [],
  ): NavEntry[] => {
    const byId = new Map(shelves.map((g) => [g.id, g] as const));
    const chromeById = new Map(extras.map((e) => [e.id, e] as const));
    const tailById = new Map(tailItems.map((i) => [i.id, i] as const));
    return l1IdsFor(
      state,
      groups,
      extras.map((e) => e.id),
    ).flatMap((id): NavEntry[] => {
      const shelf = byId.get(id);
      if (shelf) return [shelfRow(shelf)];
      const chrome = chromeById.get(id);
      if (chrome) return [{ kind: "item", item: chrome }];
      const tail = tailById.get(id);
      return tail ? [{ kind: "item", item: tail }] : [];
    });
  };

  if (state.grouping === "proposed") {
    /*
     * The proposal's band order, which is authored rather than derived: the
     * buckets that own products, a rule, the two destinations that own none, a
     * rule, then the account's own links. Settings is absent on purpose — it is
     * a bucket whose products fill the nav's existing bottom-anchored Settings
     * row, so putting it in this list would draw it twice.
     */
    const loose = groups.find((g) => g.id === UNGROUPED_ID)?.productIds ?? [];
    const buckets = groups.filter(
      (g) => g.id !== UNGROUPED_ID && g.id !== PROPOSED_SETTINGS_ID,
    );
    return [
      /*
       * No Launchpad row. The card above Recent is its only nav affordance — a
       * row as well would be the same door twice, which is what it looked like.
       * It still appears in the breadcrumb's top-level menu, since from AI or CRM
       * you have to be able to get back to it.
       */
      ...(sectionHeadings ? [band("ia-buckets", "Products")] : []),
      /*
       * One run, buckets and lifted rows together — the same change the other
       * tree got on Oct 9, and missing here until Oct 12.
       *
       * This branch kept the old shape: buckets first, then the tail appended
       * after them. So a row dropped between two buckets committed correctly
       * — `groupOrder` held it in the right place, and the store said so —
       * and then rendered at the bottom anyway, because this list put every
       * tail row after every bucket no matter what the order said. The nav
       * disagreed with its own state, which is why the drop looked broken
       * while every test of the drop handler passed.
       *
       * It matters more here than anywhere: `proposed` is the tree the
       * prototype opens on.
       */
      ...l1Run(buckets, tailRowsFor(state, loose)),
      /*
       * One "More" band, not three.
       *
       * Mobile, the account's own links and Settings were a heading each, which
       * gave the tail of the nav more headings than rows. They are all the same
       * kind of thing — the stuff that is not a product — so they share a band.
       * Settings is appended by `left-nav`, since it is the face that owns the
       * bottom anchor.
       */
      /*
       * No rule between the categories and the tail.
       *
       * They read as one list because they behave as one: a row can be dragged
       * out of a category into the tail and back, and a line across the middle
       * made that look like a boundary the drag was not allowed to cross. The
       * heading survives for the arrangement that names its bands — a label is a
       * name for what follows, which a rule is not.
       */
      // The tail is drawn by `l1Run` above now, in the one order — appending
      // it here as well would draw every loose row twice.
      ...extraEntries,
    ];
  }

  if (state.grouping === "flat") {
    // No headings and no chevrons: in flat mode a row is a destination, not a
    // door to a panel, which is the whole point of the mode.
    const products = groups[0]?.productIds ?? [];
    return [
      ...(sectionHeadings ? [band("flat", "Products")] : []),
      /*
       * Deliberately NOT `productRow`: that one hands a row with children a
       * chevron, and this mode's whole claim is that a row is a destination
       * rather than a door. Flat with panels hanging off it is just the
       * grouped tree with the groups taken out.
       */
      ...products.map(flatRow),
      ...(sectionHeadings ? [band("flat-more", "More")] : []),
      ...tailRowsFor(state, [], extras).map((item): NavEntry => ({
        kind: "item",
        item,
      })),
      ...extraEntries,
    ];
  }

  /*
   * Products the custom tree leaves unfiled are rows, not a group.
   *
   * Drawing them under an "Everything else" heading made the nav lie twice: it
   * implied a shelf the user never built, and it buried the two or three things
   * they had deliberately pulled out of every group behind a chevron. As rows
   * they read as what they are — top level, no heading, one click.
   */
  const loose = groups.find((g) => g.id === UNGROUPED_ID)?.productIds ?? [];
  /*
   * The Settings bucket never becomes a row here either.
   *
   * Its products fill the nav's bottom-anchored Settings row, so drawing it as
   * a shelf as well is the same door twice. That exclusion lived only in the
   * `proposed` branch above — but the rule belongs to the TREE, not to the
   * mode: applying a template converts an account to `custom`, this branch
   * takes over, and Settings appeared as a bucket AND as the anchor.
   */
  const shelves = groups.filter(
    (g) =>
      g.id !== PROPOSED_SETTINGS_ID &&
      (loose.length === 0 || g.id !== UNGROUPED_ID),
  );

  /*
   * One run for the whole column, Oct 9.
   *
   * The two lists are gone: `l1IdsFor` now orders the shelves, the chrome rows
   * and the tail together, so what used to be "categories, then a band, then
   * the tail" is one ordered pass. A product can therefore sit between two
   * categories, which is the position the nav could not express before.
   *
   * The "More" band is the one casualty, and deliberately. It marked the line
   * where the categories stopped and the tail began, and with the rows
   * interleaved there is no such line to mark — a heading over a boundary
   * that has moved is worse than no heading. "Products" stays as the column's
   * own title.
   */
  const tailItems = tailRowsFor(state, loose);

  return [
    ...(sectionHeadings ? [band("groups", "Products")] : []),
    ...l1Run(shelves, tailItems),
    /*
     * No rule, and the tail built the same way the proposed tree builds it.
     *
     * Both halves of this were one bug wearing two faces. The rule said the
     * categories and the tail were separate lists, when a row drags out of a
     * category into the tail and back — and the extras were mapped straight
     * rather than run through `tailRowsFor`, so Desktop & mobile apps landed
     * under that rule as a fixed row: renameable, re-iconable, and impossible
     * to MOVE, because "move up" walks indices over the tail array and this
     * row was not in it.
     *
     * One consequence worth stating: the account's own links come out of
     * `tailRowsFor` too, so trees that never called it were the one place they
     * did not appear — while `placeInTail` had been computing positions as
     * though they did. These two branches now agree with the store.
     */
    // The tail is drawn by `l1Run` above now — see the note on it. Nothing is
    // appended here, or every loose row would be drawn twice.
    ...extraEntries,
  ];
}

/**
 * The children a promoted row still owns, or none.
 *
 * Answers for a product and for an L2 alike, because either can be lifted: the
 * tail holds whatever was dragged out, and a row that came from two levels
 * down resolves through `childById` rather than the catalogue's top level.
 *
 * STILL OWNS is the whole of it, and for a long time this function could not
 * tell. It read the catalogue and nothing else, so a promoted row re-grew
 * every child the catalogue ever gave it — including the ones the account had
 * since moved somewhere else. Lift Smart lists to the top level, then lift
 * Contacts after it, and Contacts opened with Smart lists inside it: the row
 * was in two places at once, and the flyout was the one inventing the second.
 *
 * `childrenFor` has always known the answer. The fix is to ask it rather than
 * keep a second, frozen opinion beside it. Ashwin, Oct 12.
 */
export function liftedChildren(
  state: NavLayoutState,
  id: string,
): readonly CatalogueChild[] {
  const node = productById(id) ?? childById(id)?.child;
  if (!node || node.tabs) return [];
  return childrenFor(state, id);
}

/** Which of a row's ids the override maps are keyed by, or null if it is chrome. */
/**
 * Why this row's label cannot be renamed, or null if it can.
 *
 * `editTargetFor` answers "what would a rename WRITE", which is a different
 * question from "may this be renamed at all" — and conflating the two is what
 * let a product be renamed from the nav in the first place. A category is the
 * account's own word for a shelf it invented, so renaming it is exactly the
 * personalization edit mode exists for. A product's name is the platform's:
 * it is what the docs, the support macros and every other account call that
 * screen, and an account that renames Opportunities to "Deals" has made its
 * own support tickets unanswerable. Ashwin settled this on Sep 28.
 *
 * The moved-to-L1 case is why this returns a REASON rather than a boolean.
 * Promoting a product out of its category makes it a top-level row sitting
 * among categories that CAN be renamed, so the row has to say why it is the
 * exception — see the disabled affordance in nav-item-row.
 *
 * Chrome tail rows (Desktop & mobile apps and friends) are deliberately not
 * caught: they name no catalogue product, so there is no platform name to
 * protect, and CHROME_TAIL_IDS is already the list that says so.
 */
export function renameBlockedFor(
  state: NavLayoutState,
  groups: ResolvedGroup[],
  itemId: string,
): string | null {
  const target = editTargetFor(state, groups, itemId);
  if (!target || target.kind !== "product") return null;
  if (CHROME_TAIL_IDS.has(itemId)) return null;
  return "Product names can't be renamed";
}

export function editTargetFor(
  state: NavLayoutState,
  groups: ResolvedGroup[],
  itemId: string,
): { kind: "group" | "product"; id: string } | null {
  if (groups.some((g) => g.id === itemId)) return { kind: "group", id: itemId };
  /*
   * The chrome rows that live in the tail edit like products.
   *
   * They name no catalogue product, which is what used to disqualify them —
   * but the override maps are keyed by id and hold any id at all, so the only
   * thing standing between Desktop & mobile apps and a rename was this
   * function not recognising it. `kind: "product"` is exactly right: the
   * writers it selects are `setProductLabel` and `resetProductLabel`.
   */
  if (CHROME_TAIL_IDS.has(itemId)) return { kind: "product", id: itemId };
  /*
   * A page the account has pulled out of its product and stood in the nav.
   *
   * Same argument as the chrome rows above, and the same answer: the override
   * maps are keyed by id and hold any id at all, so the only thing standing
   * between a lifted page and the affordances every other row has was this
   * function not recognising it. Without the clause `editFor` returned null,
   * and the row lost its inline icon trigger — "Change icon" worked from the
   * kebab while clicking the glyph, which is how every other row in the nav
   * does it, did nothing. Ashwin, Oct 12, found by looking at the row rather
   * than at the menu.
   *
   * `kind: "product"` because that selects the right writers —
   * `setProductLabel` and `resetProductLabel` — and `labelForProduct`
   * already answers for a child. Whether the NAME may be changed is a
   * separate question, and `renameBlockedFor` answers it.
   */
  if (state.tailOrder.includes(itemId) && childById(itemId)) {
    return { kind: "product", id: itemId };
  }
  if (state.grouping === "flat" && groups[0]?.productIds.includes(itemId)) {
    return { kind: "product", id: itemId };
  }
  // Top-level rows are products, so renaming one in the nav writes the product
  // override rather than doing nothing.
  if (
    (state.grouping === "custom" || state.grouping === "proposed") &&
    groups.find((g) => g.id === UNGROUPED_ID)?.productIds.includes(itemId)
  ) {
    return { kind: "product", id: itemId };
  }
  /*
   * And a product filed in a category, which is a row only the tree draws.
   *
   * The clause above says "top level" because until Sep 24 that was the only
   * place a grouped catalogue product could BE a row: in the flyout
   * arrangement it lives in a panel, which renames it through the panel's own
   * state rather than through this. The tree hosts edit mode now, so the row
   * exists in the nav, and `editFor` was returning null for it — the kebab's
   * Rename set a renaming id that no row was watching, so the field never
   * opened.
   *
   * `kind: "product"` is the same answer the ungrouped clause gives, because it
   * is the same write: the override map is keyed by product id and knows
   * nothing about which category the row is currently filed in.
   */
  if (groups.some((g) => g.productIds.includes(itemId))) {
    return { kind: "product", id: itemId };
  }
  return null;
}
