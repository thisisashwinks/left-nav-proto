"use client";

import * as React from "react";
import { Image, Plus, RotateCcw, X } from "lucide-react";

import { AGENCY_L2_MIME, L2_MIME } from "@/components/nav/nav-drag";
import { agencyBuckets } from "@/components/nav/agency-config";
import { useAgencyLayout } from "@/components/nav/agency-layout";
import { childById } from "@/components/nav/catalogue";
import { UNGROUPED_ID } from "@/components/nav/grouping";
import { PROPOSED_SETTINGS_ID } from "@/components/nav/proposed-ia";
import {
  productMenuActions,
  productTreeOptions,
} from "@/components/nav/product-options";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import {
  RowMenu,
  useRowMenu,
  type RowMenuAction,
  type RowMenuOption,
} from "@/components/nav/row-menu";
import { RowSeam } from "@/components/nav/row-seam";
import { GET_APP_FLYOUT_ID, getAppFlyout } from "./get-app-flyout";
import type { SurfaceTheme } from "@/design/theme";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useDragTypes } from "@/lib/use-drag-active";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import { BottomSlot } from "./bottom-slot";
import { FlyoutActionRow } from "./flyout-action-row";
import { IconPicker, useIconPicker } from "@/components/nav/icon-picker";
import { nameForIcon } from "@/components/nav/icon-catalogue";
import {
  FlyoutRow,
  PANEL_HEADER_PL,
  PANEL_HEADER_PR,
  type FlyoutChildEdit,
  type FlyoutRowEdit,
  FlyoutChildRows,
} from "./flyout-row";
import { FlyoutCascade } from "./flyout-cascade";
import { useHoverDwell } from "@/lib/use-hover-dwell";
import type { FlyoutChildItem, FlyoutConfig } from "./types";

interface FlyoutPanelProps {
  config: FlyoutConfig;
  /** Distance from the viewport's left edge — 272 when open, 64 when collapsed. */
  offsetLeft: number;
  /**
   * Distance from the row's top edge — the canvas gap, so the panel's top lines
   * up with the nav card's.
   *
   * It briefly cleared the app bar as well in the joined arrangement, so the
   * breadcrumb stayed uncovered. That was wrong: it left the panel 48px shorter
   * than the nav it docks against, and the two are meant to read as one
   * surface. Matching the nav wins; the bar is a transient thing to cover.
   */
  offsetTop: number;
  theme: SurfaceTheme;
  phase: TransitionPhase;
  /** Keeps the panel alive while the pointer is inside it. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onClose: () => void;
  /** Fired for row and L2-child clicks — the shell routes them to pages. */
  /**
   * Fired for a row's page. `keepOpen` is set when the click opened a
   * disclosure and landed on its first child — the panel has to survive that,
   * because picking from the list it just opened is the next thing you do.
   */
  onNavigate?: (id: string, keepOpen?: boolean) => void;
}

/**
 * Rows past this point animate with the same delay as the last one. Without a
 * cap, Everything-sized lists would still be cascading seconds after the panel
 * has settled.
 */
const MAX_STAGGERED_ROWS = 12;

/**
 * A chrome row's name with the platforms dropped, for the editing mode.
 *
 * A rename wins outright — someone who has called it "Apps" gets "Apps",
 * brackets or no brackets, because the qualifier is ours and the name is
 * theirs. Only the shipped label is shortened, and only by taking the bracket
 * off the end.
 */
function shortChromeLabel(
  layout: ReturnType<typeof useNavLayout>,
  id: string,
): string {
  const label = layout.productLabelFor(id);
  const at = label.indexOf(" (");
  return at > 0 ? label.slice(0, at) : label;
}

/** The seam menu's one view, opened directly rather than via a menu entry. */
const ADD_VIEW = "add";

/**
 * The 360px flyout from left-nav.pen: absolutely positioned against the nav's
 * right edge, padded 14px with 16px at the bottom, 10px between blocks, and a
 * flex spacer that pins the bottom slot to the base of the panel.
 */
export function FlyoutPanel({
  config,
  offsetLeft,
  offsetTop,
  theme,
  phase,
  onPointerEnter,
  onPointerLeave,
  onClose,
  onNavigate,
}: FlyoutPanelProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  /*
   * Whether this panel's rows are editable, worked out here rather than passed
   * in.
   *
   * Everything the answer needs is already to hand: the store says the nav is
   * being edited and who may, and `config.id` says which category this panel
   * belongs to. Threading it down from the shell would add a prop to every
   * caller for a fact this component can read for itself — and would have to be
   * remembered by the panels that are NOT categories (Recent, Favorites, the
   * agency's own), which get no editing precisely because there is no tree
   * behind them.
   */
  const layout = useNavLayout();
  const category = layout.groups.find(
    (g) =>
      g.id === config.id &&
      g.id !== UNGROUPED_ID &&
      /*
       * Settings is not an editable category.
       *
       * It is a bucket in the tree, which is why it resolves as a group at all —
       * but in the nav it is the bottom-anchored row, and what is in it is the
       * platform's own surface rather than the account's arrangement of its
       * products. An admin reordering Billing above My Profile is not customising
       * their nav, they are editing a settings page from the wrong place.
       */
      g.id !== PROPOSED_SETTINGS_ID,
  );
  /**
   * The nav is in edit mode, whether or not THIS panel's rows can be edited.
   *
   * The ring follows the mode: Recent and Quick Actions are not categories and
   * their rows stay read-only, but they still dock into the nav's right edge, so a
   * panel wearing its ordinary border while the nav wears the mode's ring would
   * break the outline in the middle.
   */
  const navEditing = layout.state.editing && layout.can.customise;
  const { editTreatment, l3Disclosure, flyoutTrigger } = useTheme().effective;
  // The same axis the rows read for themselves; the cascade renders them from
  // out here, so it has to answer the question too.
  const { tabsInNav } = useTheme();

  /*
   * The cascade stack: one entry per open dropdown, outermost first.
   *
   * Held here rather than in the rows because a level REPLACES everything below
   * it — opening a sibling's dropdown has to close the one that was up, and a
   * row that owned its own open flag could not know about its siblings. The
   * panel is the smallest thing that can see them all.
   */
  const [cascade, setCascade] = React.useState<
    { id: string; label: string; nodes: readonly FlyoutChildItem[]; anchor: { top: number; right: number } }[]
  >([]);

  /*
   * Cleared whenever the panel itself changes.
   *
   * The dropdowns are portalled to <body>, so nothing about unmounting this
   * panel takes them with it — switch category with one open and its rows would
   * hang in space over a panel they no longer belong to.
   *
   * Adjusted during render rather than in an effect, which is the pattern the
   * rest of this codebase uses for derived state: an effect would paint one
   * frame of the old cascade over the new panel, and lint rightly refuses
   * setState in one.
   */
  const [cascadeOwner, setCascadeOwner] = React.useState(config.id);
  if (cascadeOwner !== config.id) {
    setCascadeOwner(config.id);
    if (cascade.length > 0) setCascade([]);
  }

  /*
   * The same dwell the L1 rows use, one level in — see use-hover-dwell.ts.
   *
   * The cascade sits to the right of this panel exactly as this panel sits to
   * the right of the nav, so reaching it means cutting the corner across two or
   * three sibling L2 rows. Swapping on contact rewrote the dropdown the pointer
   * was travelling towards, which is the same bug at a smaller scale and reads
   * worse here: the L3 list is what you were already looking at.
   */
  const { defer: deferCascade, cancel: cancelCascade } = useHoverDwell();

  /*
   * Hover only moves a cascade that is already open.
   *
   * Nothing opens on a rollover — that is the whole difference between sticky
   * and hover mode. A row with no children closes the stack at its level,
   * because leaving the last dropdown up while the pointer sits on a leaf would
   * attach it to a row it does not belong to.
   */
  const hoverCascade = React.useCallback(
    (
      id: string,
      label: string,
      nodes: readonly FlyoutChildItem[],
      el: HTMLElement,
      level: number,
    ) => {
      /*
       * The box is measured NOW, not when the timer fires.
       *
       * By then the pointer has moved on and the element may have scrolled;
       * reading it late would anchor the dropdown to wherever the row had got
       * to rather than to the row that was hovered.
       */
      const box = el.getBoundingClientRect();
      const anchor = { top: box.top, right: box.right };
      /*
       * Closing is immediate; opening waits.
       *
       * A leaf row says "close the stack at my level", and that is not a switch
       * anyone has to be protected from — holding it would leave a dropdown
       * hanging off a row with no children while the pointer sat on it.
       */
      if (nodes.length === 0) {
        cancelCascade();
        setCascade((c) => (c.length <= level ? c : c.slice(0, level)));
        return;
      }
      deferCascade(`${level}:${id}`, () => {
        setCascade((c) => {
          if (c.length <= level) return c;
          if (c[level]?.id === id) return c;
          return [...c.slice(0, level), { id, label, nodes, anchor }];
        });
      });
    },
    [deferCascade, cancelCascade],
  );

  const openCascade = React.useCallback(
    (
      id: string,
      label: string,
      nodes: readonly FlyoutChildItem[],
      el: HTMLElement,
      level: number,
    ) => {
      // An empty node list is how a row says "close mine" — see the rows'
      // onClick. Truncating at `level` drops it and everything under it.
      /*
       * A click beats its own pending hover.
       *
       * Clicking a row means having crossed it, so a deferred switch for that
       * very row — or for a sibling passed on the way — may still be armed. Let
       * it fire and it lands a few hundred milliseconds after the click and
       * silently replaces what the click opened.
       */
      cancelCascade();
      if (nodes.length === 0) {
        setCascade((c) => c.slice(0, level));
        return;
      }
      const box = el.getBoundingClientRect();
      setCascade((c) => [
        ...c.slice(0, level),
        { id, label, nodes, anchor: { top: box.top, right: box.right } },
      ]);
    },
    [cancelCascade],
  );
  const editing = navEditing && category !== undefined;
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [lifted, setLifted] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<string | null>(null);
  const menu = useRowMenu();
  /**
   * The kebab the open menu came out of.
   *
   * `useRowMenu` keeps a rect, which is all a menu needs — but the icon picker
   * anchors to an element, and "Change icon" opens one from inside the menu. So
   * the element is held here as well, as the nav's own rows already do.
   */
  const [menuTrigger, setMenuTrigger] = React.useState<HTMLElement | null>(
    null,
  );
  /** Which seam's add-picker is open, anchored to the plus that opened it. */
  const [adding, setAdding] = React.useState<{
    index: number;
    anchor: DOMRect;
  } | null>(null);

  /** Where every other category is, for this panel's Move-to lists. */
  const destinations = layout.groups.filter(
    (g) => g.id !== UNGROUPED_ID && g.id !== PROPOSED_SETTINGS_ID,
  );

  const picker = useIconPicker();

  /*
   * A category holding one product has nothing to reorder.
   *
   * The menu already knows — `onMoveUp` and `onMoveDown` are both omitted at
   * a list of one, so both entries render greyed. The grip did not, and it
   * was the louder of the two: a handle that appears on hover, lifts the row
   * and then has nowhere to put it down. Both seams in a one-row panel are
   * the same position, so the drag was always a no-op dressed as a gesture.
   * Ashwin, Sep 24.
   *
   * It costs nothing real. Dragging out of a panel was never how a product
   * changes category — only one panel is open at a time, so the only drop
   * targets a lifted row has are this panel's own seams. "Move to" on the
   * row's menu is the way across, and it is unaffected.
   */
  const lonely = (category?.productIds.length ?? 0) < 2;

  const editFor = (productId: string): FlyoutRowEdit | undefined => {
    if (!editing || !category) return undefined;
    return {
      renaming: renamingId === productId,
      renameValue: layout.productBaseLabelFor(productId),
      onStartRename: () => setRenamingId(productId),
      onCommitRename: (next) => {
        layout.setProductLabel(productId, next);
        setRenamingId(null);
      },
      onCancelRename: () => setRenamingId(null),
      onOpenMenu: (trigger) => {
        setMenuTrigger(trigger);
        menu.open(productId, trigger);
      },
      // Icons are governance, so they follow `regroup` — the same gate the
      // nav's own rows use, rather than a second rule for the same action.
      ...(layout.can.regroup
        ? { onPickIcon: (trigger: HTMLElement) => picker.open(productId, trigger) }
        : {}),
      hidden: layout.isRowHidden(productId),
      onToggleHidden: () => layout.toggleRowHidden(productId),
      /*
        No grip on a lone row — see `lonely`. `FlyoutRowEdit` draws the handle
        from the presence of `onDragStart`, so withholding it is how the row
        stops advertising a move it cannot make.
      */
      ...(lonely
        ? {}
        : {
            onDragStart: (e: React.DragEvent) => {
              e.dataTransfer.setData(L2_MIME, productId);
              e.dataTransfer.setData(
                "text/plain",
                layout.productLabelFor(productId),
              );
              e.dataTransfer.effectAllowed = "move";
              setLifted(productId);
            },
          }),
      /*
       * A row here is not a drop target.
       *
       * Reordering asks "between which two?", and the answer is a line in the
       * seam it would land in — the same gesture the nav's categories use. A
       * highlighted row would say "inside this one", and a row inside a row is
       * not something the nav has. Refusing is simply never calling
       * preventDefault, which is how the browser says no.
       */
      onDragOver: () => {},
      onDragLeave: () => {},
      onDrop: () => {},
      onDragEnd: () => {
        setLifted(null);
        setOver(null);
      },
      over: over === productId,
      lifted: lifted === productId,
    };
  };

  /**
   * Editing for the rows inside a row.
   *
   * Icons only, and behind `regroup` like every other icon in the nav: an L3's
   * glyph is often inferred from its label rather than authored, so it is the
   * one property of a sub-page an account has a real reason to correct.
   */
  const childEdit: FlyoutChildEdit | undefined =
    editing && layout.can.regroup
      ? {
          onPickIcon: (childId, trigger) => picker.open(childId, trigger),
          onOpenMenu: (childId, trigger) => {
            setMenuTrigger(trigger);
            menu.open(childId, trigger);
          },
        }
      : undefined;

  const dragTypes = useDragTypes();

  /*
   * The agency tree's panels, which are a second thing this component draws.
   *
   * Nothing above knows the difference — the shell hands over a FlyoutConfig
   * either way — so the panel asks the agency store directly, exactly as it
   * already asks the catalogue store whether `config.id` is one of its
   * categories. What comes back is narrower: these rows reorder and do nothing
   * else, because a bucket's contents are platform IA rather than an
   * arrangement of products the agency owns.
   */
  const agency = useAgencyLayout();
  const agencyBucket = agencyBuckets.find(
    (b) => b.id === config.id && b.children.length > 0,
  );
  const agencyEditing = navEditing && agencyBucket !== undefined;

  /*
   * The nav's own panel: authored rows, but an account's to arrange.
   *
   * Neither a category nor an agency bucket, so neither branch above claims it
   * — and yet its two rows are destinations like any other: you can keep one,
   * call it something else, give it a glyph, put them in the order you use them
   * in, or switch one off. All four are per-row facts the store already holds,
   * keyed by id; the only thing missing was a panel willing to offer them.
   */
  const chromePanel = config.id === GET_APP_FLYOUT_ID;
  const chromeEditing = navEditing && chromePanel;

  /** The authored order, which a saved one is a diff against. */
  const chromeDefaults = React.useMemo(
    () =>
      chromePanel
        ? getAppFlyout.entries.flatMap((e) =>
            e.kind === "item" ? [e.item.id] : [],
          )
        : [],
    [chromePanel],
  );
  const panelRowsFor = layout.panelRowsFor;
  const chromeOrder = React.useMemo(
    () => (chromePanel ? panelRowsFor(GET_APP_FLYOUT_ID, chromeDefaults) : []),
    [chromePanel, chromeDefaults, panelRowsFor],
  );

  /** The authored panel order, as ids — what a saved order is a diff against. */
  const agencyDefaults = React.useMemo(
    () => (agencyBucket ? agencyBucket.children.map((c) => c.id) : []),
    [agencyBucket],
  );
  /*
   * Memoised, not merely computed: it is a fresh array every call, and the
   * entry list below keys off it — an unmemoised order would rebuild the rows
   * on every render and restart their entrance animation mid-panel.
   */
  const agencyBucketId = agencyBucket?.id;
  const childOrderFor = agency.childOrderFor;
  const agencyOrder = React.useMemo(
    () =>
      agencyBucketId ? childOrderFor(agencyBucketId, agencyDefaults) : [],
    [agencyBucketId, agencyDefaults, childOrderFor],
  );

  /*
   * The rows this panel actually draws, in this agency's order.
   *
   * Applied here rather than in `agencyFlyouts` because that map is a module
   * constant built once at import — a projection of the authored config, with
   * no store to read. Rebuilding it per render in the shell would push the
   * agency's edits through three components that have no other reason to know
   * about them.
   */
  const entries = React.useMemo(() => {
    if (chromePanel) {
      const byId = new Map(
        config.entries.flatMap((e) => (e.kind === "item" ? [[e.item.id, e]] : [])),
      );
      return chromeOrder.flatMap((id) => {
        const entry = byId.get(id);
        if (!entry || entry.kind !== "item") return [];
        // Switched-off rows stay on screen while editing, faded, because the
        // eye that brings one back is on the row itself.
        if (layout.isRowHidden(id) && !chromeEditing) return [];
        return [
          {
            ...entry,
            item: {
              ...entry.item,
              /*
                Through the store: a renamed or re-iconed row has to look
                renamed everywhere, and the dock is already reading these.

                And short while editing. The mode adds a grip, an eye and a
                kebab to a row whose name already carries four platform names
                in brackets — the label won, the controls were pushed off the
                panel's edge, and reaching the kebab meant scrolling sideways
                in a 360px panel. The brackets answer "which platforms", which
                is a browsing question; arranging is a different job and does
                not need them.
              */
              label: chromeEditing
                ? shortChromeLabel(layout, id)
                : layout.productLabelFor(id),
              icon: layout.productIconFor(id),
            },
          },
        ];
      });
    }
    if (!agencyBucket) return config.entries;
    const byId = new Map(
      config.entries.flatMap((e) => (e.kind === "item" ? [[e.item.id, e]] : [])),
    );
    // An agency panel is item rows and nothing else. If that ever stops being
    // true, the authored order stands rather than the headings being sorted
    // into the middle of the list.
    if (byId.size !== config.entries.length) return config.entries;
    return agencyOrder.flatMap((id) => {
      const entry = byId.get(id);
      return entry ? [entry] : [];
    });
  }, [
    agencyBucket,
    agencyOrder,
    config.entries,
    chromePanel,
    chromeOrder,
    chromeEditing,
    layout,
  ]);

  /** Where a row dropped into seam `index` lands, in the panel's own order. */
  const dropAgencyRowAt = (rowId: string, index: number) => {
    if (!agencyBucket) return;
    const from = agencyOrder.indexOf(rowId);
    if (from < 0) return;
    // The seams are positions BETWEEN rows, so seam 2 means "third". A row
    // travelling down leaves everything below it one place higher, which is
    // why the target index comes down by one in that direction.
    const to = from < index ? index - 1 : index;
    agency.moveChildTo(agencyBucket.id, agencyDefaults, rowId, to);
  };

  /** Where a row dropped into seam `index` lands, in this panel's own order. */
  const dropChromeRowAt = (rowId: string, index: number) => {
    const from = chromeOrder.indexOf(rowId);
    if (from < 0) return;
    // Same arithmetic as everywhere else: a row travelling down leaves
    // everything below it one place higher.
    const to = from < index ? index - 1 : index;
    layout.movePanelRow(GET_APP_FLYOUT_ID, chromeDefaults, rowId, to);
  };

  /**
   * The full set, for the nav's own rows: rename, icon, hide, reorder.
   *
   * Everything a category's row gets except moving to another category and
   * being removed from the nav — there is no category to move to, and what
   * puts these rows on screen is an axis rather than a list they could be
   * taken out of. Hiding is the reversible version of removal and is the one
   * these rows can honour.
   */
  const chromeEditFor = (rowId: string): FlyoutRowEdit | undefined => {
    if (!chromeEditing) return undefined;
    return {
      renaming: renamingId === rowId,
      renameValue: layout.productLabelFor(rowId),
      onStartRename: () => setRenamingId(rowId),
      onCommitRename: (next) => {
        layout.setProductLabel(rowId, next);
        setRenamingId(null);
      },
      onCancelRename: () => setRenamingId(null),
      ...(layout.can.regroup
        ? {
            onPickIcon: (trigger: HTMLElement) => picker.open(rowId, trigger),
          }
        : {}),
      hidden: layout.isRowHidden(rowId),
      onToggleHidden: () => layout.toggleRowHidden(rowId),
      // The same verbs the drag and the glyph offer, reachable by keyboard —
      // which is the kebab's whole job on the rows one level up.
      onOpenMenu: (trigger) => {
        setMenuTrigger(trigger);
        menu.open(rowId, trigger);
      },
      onDragStart: (e) => {
        e.dataTransfer.setData(L2_MIME, rowId);
        e.dataTransfer.effectAllowed = "move";
        setLifted(rowId);
      },
      // A row is not a drop target; the seam between two rows is. Same rule as
      // every other list in here.
      onDragOver: () => {},
      onDragLeave: () => {},
      onDrop: () => {},
      onDragEnd: () => {
        setLifted(null);
        setOver(null);
      },
      over: false,
      lifted: lifted === rowId,
    };
  };

  /** A seam between the nav's own rows. Drop-only: the pair is authored. */
  const chromeSeam = (index: number) => (
    <RowSeam
      key={`chrome-seam-${index}`}
      dragTypes={dragTypes}
      accepts={[L2_MIME]}
      onDrop={(id) => dropChromeRowAt(id, index)}
      reach={12}
    />
  );

  const agencyEditFor = (rowId: string): FlyoutRowEdit | undefined => {
    if (!agencyEditing || !agencyBucket) return undefined;
    return {
      onDragStart: (e) => {
        e.dataTransfer.setData(AGENCY_L2_MIME, rowId);
        e.dataTransfer.effectAllowed = "move";
        setLifted(rowId);
      },
      /*
       * A row here is not a drop target, at either scope.
       *
       * Reordering asks "between which two?", and the seam is where that is
       * answered. A highlighted row would promise nesting, and an agency panel
       * has no nesting to offer.
       */
      onDragOver: () => {},
      onDragLeave: () => {},
      onDrop: () => {},
      onDragEnd: () => {
        setLifted(null);
        setOver(null);
      },
      over: false,
      lifted: lifted === rowId,
    };
  };

  /**
   * A seam between two agency rows. Drop-only: there is nothing to add.
   *
   * The sub-account seam doubles as "+ add here" because a category is filled
   * from a catalogue. A bucket is not — its contents ship with the platform —
   * so the plus would open a picker with nothing to pick.
   */
  const agencySeam = (index: number) => (
    <RowSeam
      key={`agency-seam-${index}`}
      dragTypes={dragTypes}
      accepts={[AGENCY_L2_MIME]}
      onDrop={(id) => dropAgencyRowAt(id, index)}
      reach={12}
    />
  );

  /** Where a row dropped into seam `index` lands, in the group's own order. */
  const dropRowAt = (productId: string, index: number) => {
    if (!category) return;
    const from = category.productIds.indexOf(productId);
    if (from < 0) {
      // From another category: it arrives here rather than moves within.
      layout.moveProductToGroup(productId, category.id, index);
      return;
    }
    const to = from < index ? index - 1 : index;
    if (to !== from) layout.moveProductWithinGroup(category.id, from, to);
  };

  /**
   * Everything that could go in this category, as the nav's own tree.
   *
   * Categories to walk into, products to pick — the same shape as the nav, so
   * finding one is the same act as knowing where it lives. Rows already in this
   * category are left out, since the list is for adding and they are already here.
   */
  const addable: RowMenuOption[] = category
    ? productTreeOptions(layout.state, (id) =>
        category.productIds.includes(id),
      )
    : [];

  const addActions = (index: number): RowMenuAction[] => [
    {
      id: ADD_VIEW,
      label: category ? `Add to ${category.label}` : "Add an item",
      icon: Plus,
      options: addable,
      emptyNote: "Everything is already in here.",
      onPick: (id) => {
        if (category) layout.addProductToGroup(id, category.id, index);
      },
    },
  ];

  /** This row's place in the category's own order, which is what a drop uses. */
  const rowIndexOf = (productId: string) =>
    Math.max(0, category?.productIds.indexOf(productId) ?? 0);

  /** The last row the panel draws, so the closing seam knows where to go. */
  const lastRowId = (() => {
    for (let i = entries.length - 1; i >= 0; i -= 1) {
      const e = entries[i];
      if (e?.kind === "item") return e.item.id;
    }
    return null;
  })();

  const seam = (index: number) => (
    <RowSeam
      key={`seam-${index}`}
      dragTypes={dragTypes}
      accepts={[L2_MIME]}
      onDrop={(id) => dropRowAt(id, index)}
      onAdd={(trigger) =>
        setAdding({ index, anchor: trigger.getBoundingClientRect() })
      }
      addLabel="Add an item here"
      // The rows sit on the nav's own 2px now, so the seam cancels that
      // instead — its default. Reach stays wider than the nav's: the panel is
      // 360px and a seam you have to hit within 8px of is a seam you miss.
      reach={12}
    />
  );

  const menuActions = (productId: string): RowMenuAction[] => {
    /*
     * The nav's own rows: everything a product row offers except the two verbs
     * that need a tree behind them — see `chromeEditFor`.
     */
    if (chromePanel && chromeDefaults.includes(productId)) {
      const at = chromeOrder.indexOf(productId);
      return productMenuActions({
        productId,
        // In no category until someone files it — which they can now: a
        // category holds products and the nav's own rows alike, and both draw
        // from the same resolvers. See `withProductFiled`.
        currentGroupId: null,
        categories: destinations,
        onMoveToGroup: (groupId) => layout.moveProductToGroup(productId, groupId),
        onMoveToTopLevel: () => layout.placeInTail(productId, 0),
        onRename: () => setRenamingId(productId),
        ...(layout.can.regroup
          ? {
              onPickIcon: () => {
                if (menuTrigger) picker.open(productId, menuTrigger);
              },
            }
          : {}),
        ...(at > 0
          ? {
              onMoveUp: () =>
                layout.movePanelRow(
                  GET_APP_FLYOUT_ID,
                  chromeDefaults,
                  productId,
                  at - 1,
                ),
            }
          : {}),
        ...(at >= 0 && at < chromeOrder.length - 1
          ? {
              onMoveDown: () =>
                layout.movePanelRow(
                  GET_APP_FLYOUT_ID,
                  chromeDefaults,
                  productId,
                  at + 1,
                ),
            }
          : {}),
        /*
          Remove, and what it can honestly mean here.

          A product row's Remove takes it out of the nav — it is the account's
          list and the row was in it. These two are put here by an axis, so a
          removal that deleted them would be undone by the next render. Hiding
          is the same outcome from the reader's side and the only one that
          survives: the row goes, and edit mode still shows it faded with the
          eye that brings it back. The menu says "Remove from the nav" because
          that is what it does to the nav you are looking at.
        */
        onRemove: () => layout.toggleRowHidden(productId),
      });
    }

    /*
     * An L3's menu is not a product's menu.
     *
     * Rename, move-to, remove — none of them mean anything for a page that
     * belongs to a product rather than to the account's tree, and offering
     * them would be four entries where one applies. So the child's menu
     * carries exactly what the child's glyph does, plus the way back to the
     * shipped one.
     */
    if (childById(productId)) {
      return [
        {
          id: "icon",
          label: "Change icon",
          icon: Image,
          onSelect: () => {
            if (menuTrigger) picker.open(productId, menuTrigger);
          },
        },
        ...(layout.hasIconOverride(productId)
          ? [
              {
                id: "reset-icon",
                label: "Reset icon",
                icon: RotateCcw,
                onSelect: () => layout.resetIcon(productId),
              },
            ]
          : []),
      ];
    }

    // Where this row sits in its category, so the menu can offer a nudge and
    // know when not to. Absent for a panel with no category behind it.
    const order = category?.productIds ?? [];
    const at = order.indexOf(productId);
    const canMove = category !== undefined && at !== -1;

    // The shared builder, so a product's menu is the same object wherever the
    // row is — in this panel or sitting at the nav's top level.
    return productMenuActions({
      productId,
      currentGroupId: category?.id ?? null,
      categories: destinations,
      onRename: () => setRenamingId(productId),
      // The same gate the row's own glyph is behind, so the two ways in agree.
      ...(layout.can.regroup
        ? {
            onPickIcon: () => {
              if (menuTrigger) picker.open(productId, menuTrigger);
            },
          }
        : {}),
      onMoveToGroup: (groupId) => layout.moveProductToGroup(productId, groupId),
      onMoveToTopLevel: () => layout.placeInTail(productId, 0),
      onRemove: () => layout.removeProductFromNav(productId),
      ...(canMove && at > 0
        ? {
            onMoveUp: () =>
              layout.moveProductWithinGroup(category.id, at, at - 1),
          }
        : {}),
      ...(canMove && at < order.length - 1
        ? {
            onMoveDown: () =>
              layout.moveProductWithinGroup(category.id, at, at + 1),
          }
        : {}),
    });
  };

  /*
   * A panel whose only row is expandable opens it.
   *
   * Automation is the case: one product, Workflows, with everything real one
   * level down. Collapsed, the panel is a single row whose only job is to reveal
   * the panel's actual contents — a click that carries no decision. Expanded, the
   * panel says what is in it.
   */
  const itemRows = entries.filter((e) => e.kind === "item");
  const soleExpandable =
    itemRows.length === 1 &&
    (itemRows[0]?.kind === "item"
      ? (itemRows[0].item.children?.length ?? 0) > 0
      : false);

  // Escape closes, and focus moves into the panel so keyboard users land here
  // rather than back at the top of the document.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    panelRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(scrollRef);

  return (
    <div
      ref={panelRef}
      data-nav-theme={theme}
      role="dialog"
      aria-label={config.title}
      data-cursor="menu"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      tabIndex={-1}
      style={{ left: offsetLeft, top: offsetTop }}
      className={cn(
        // The panel itself no longer scrolls — its middle does.
        //
        // As one scrolling box with a `flex-1` spacer pushing the bottom slot down,
        // a short screen collapsed the spacer to 0 and scrolled the featured block
        // and contextual help clean out of sight. Whatever is in that slot is the
        // reason the panel is 360px wide; it should be the last thing to go, not the
        // first. So the title and the slot are pinned and only the list moves.
        // Inset to match the nav card it docks against — a panel that ran the full
        // page height overhung the card by the gap at both ends. Left stays flush
        // rather than gapped: the pointer travels from a nav row into this panel,
        // and a dead strip between them would close it on the way.
        //
        // Rounded on the right only, and no border on the left. Both are the same
        // idea: this is the nav continuing, not a second card. A left radius would
        // cut a notch out of the seam, and a left border would sit against the
        // card's right border and read as one 2px line.
        "absolute bottom-[var(--shell-canvas-gap)] z-30 flex w-[360px] flex-col items-start overflow-hidden rounded-r-[var(--shell-canvas-radius)] bg-nav pt-[14px] pb-[16px] outline-none",
        // Editing, the panel completes the nav's ring rather than wearing its
        // own border — top, right and bottom in brand, nothing on the left, so
        // the two boxes read as one surface with one stroke around it.
        /*
         * The panel completes the nav's outline, so it follows whichever
         * treatment the nav is wearing. Only `ring` puts a stroke here; under
         * `dim` the panel keeps its ordinary hairline, because the mode is
         * being carried by the surround and a heavy edge on the panel alone
         * would read as the panel being selected.
         */
        navEditing && editTreatment === "ring"
          /*
           * Hairlines only — no drop shadow. The canvas-sized shadow this panel
           * used to wear spilled left over the nav and read as a dark seam
           * BETWEEN L1 and L2, when the panel is supposed to be the nav
           * continuing (Khoi, Aug 24). The card behind both already carries the
           * float; the panel needs only its edges.
           */
          ? "shadow-[inset_0_1.5px_0_0_var(--nav-edit-ring),inset_-1.5px_0_0_0_var(--nav-edit-ring),inset_0_-1.5px_0_0_var(--nav-edit-ring)]"
          : "shadow-[inset_0_1px_0_0_var(--fly-border),inset_-1px_0_0_0_var(--fly-border),inset_0_-1px_0_0_var(--fly-border)]",
        // `left` animates too, so the panel follows the nav edge when the rail
        // collapses underneath an open panel instead of jumping.
        "motion-move",
        phase === "entering" ? "motion-panel-in" : "motion-panel-out",
      )}
    >
      {/*
        The header pads to the ROWS, not to the panel.

        16px a side put the title 6px left of the icon column under it and the
        close button 6px right of the chevrons — close enough to look like a
        mistake and not close enough to look deliberate. Both edges now come
        from the row's own numbers; see PANEL_HEADER_PL.
      */}
      <div
        className={cn(
          "flex w-full shrink-0 items-center gap-[8px] pt-0 pb-[4px]",
          PANEL_HEADER_PL,
          PANEL_HEADER_PR,
        )}
      >
        <div className="flex h-fit flex-1 items-center justify-between">
          <h2 className="text-[15px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
            {config.title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            /*
              `justify-end`, not centre: the target keeps its 22px so it stays
              easy to hit, and grows LEFTWARD, which puts the glyph's own right
              edge on the same line the rows' chevrons end on. Centring it
              would leave the two marks 4px apart with nothing visible
              explaining why.

              The glyph therefore has to sit off the button's centre — and two
              things follow from that, both handled here rather than by moving
              the glyph back.

              The spin is on the GLYPH, not the button: a rotation turns about
              the box's own centre, so rotating the button swung the X down and
              left through an arc instead of turning it in place. The app's other
              close buttons rotate their button and look right only because they
              are `justify-center`, where the two centres coincide.

              And the hover plate is re-centred by moving the BOX, not its
              contents: `justify-center` puts the glyph on the box's centre, and
              -3.5px of right margin — (22 - 15) / 2, the slack the glyph used to
              absorb on one side — slides the box back out so the glyph lands
              exactly where `justify-end` had it. The plate ends up concentric
              with the X and overhanging the header's right padding by those same
              3.5px, which is a fill bleeding into 22px of whitespace and costs
              nothing. Centring the glyph in a stationary box would have been the
              -4px correction this file already rejected, in the other direction.
            */
            className="group/close -mr-[3.5px] flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle motion-tap hover:bg-nav-hover hover:text-nav-fg-muted active:scale-90"
          >
            <X
              size={15}
              aria-hidden="true"
              className="motion-tap group-hover/close:rotate-90"
            />
          </button>
        </div>
      </div>

      <div
        data-scroll-shell=""
        className="relative flex min-h-0 w-full flex-1 flex-col"
      >
        <div aria-hidden="true" data-scroll-fade="top" />
        <div
          ref={scrollRef}
          data-scroll-region=""
          /*
            The nav's row spacing, not the flyout's block gap.

            10px between rows made an L2 list read as a set of cards where the
            nav's own list reads as a list — the rows are the same height and
            the same treatment now, so the space between them was the last
            thing making the two levels look like different kinds of thing. The
            block gap stays what it is: it still spaces the panel's TOP inset
            and whatever sits below the rows.
          */
          className="flex w-full flex-1 flex-col items-start gap-[var(--t-nav-space,2px)] overflow-y-auto px-[14px] pt-[var(--t-fly-block-gap,10px)]"
        >
      {/*
        An empty category's panel still offers a seam.
        
        The seams are drawn around rows, so a category with none had nowhere to
        add one — and an empty category is exactly the case that needs it, since
        it is the one state the nav refuses to save.
      */}
      {editing && category && lastRowId === null ? seam(0) : null}

      {entries.map((entry, i) =>
        entry.kind === "label" ? (
          <div
            key={entry.id}
            style={{ "--row-index": Math.min(i, MAX_STAGGERED_ROWS) } as React.CSSProperties}
            className={cn(
              "motion-row-in flex w-full shrink-0 items-start pt-[6px] pr-[2px] pl-[2px]",
              config.spaciousLabels ? "pb-[4px]" : "pb-[2px]",
            )}
          >
            {/*
              Explicit 13px line-height, not `normal`. As a flex item the span
              is blockified and takes its 14px font box rather than the 13px
              line box Pencil lays out, which would make the row 1px too tall.
            */}
            <span className="text-[11px] leading-[13px] font-semibold tracking-[0.5px] whitespace-nowrap text-nav-fg-subtle uppercase">
              {entry.text}
            </span>
          </div>
        ) : (
          <React.Fragment key={entry.item.id}>
            {/* A seam above every row and one below the last, so a row can be
                dropped at either end of the list as well as between two. */}
            {editing && category
              ? seam(rowIndexOf(entry.item.id))
              : agencyEditing
                ? agencySeam(i)
                : chromeEditing
                  ? chromeSeam(i)
                  : null}
          <FlyoutRow
            key={entry.item.id}
            item={entry.item}
            variant={config.variant}
            /*
              The same rule one level in — see the note on the nav's own rows.

              A row with a dropdown is lit while that dropdown is up and not
              otherwise, so moving the cascade along the list moves the fill
              with it instead of leaving one behind on whichever row was
              clicked first. Only when the cascade is a PANEL: disclosed
              inline, the open state is the row's own and the list below it is
              already saying which row it belongs to.
            */
            active={
              l3Disclosure === "panel" &&
              (entry.item.children?.length ?? 0) > 0 &&
              (tabsInNav || !entry.item.tabs)
                ? cascade[0]?.id === entry.item.id
                : entry.item.id === activeId
            }
            // Not the same question as `active`: that asks whether THIS row is
            // the page, this asks which row under it is — the dropdown needs the
            // id to mark one of its own.
            activeId={activeId}
            defaultOpen={soleExpandable}
            rowIndex={Math.min(i, MAX_STAGGERED_ROWS)}
            {...(l3Disclosure === "panel"
              ? {
                  cascade: {
                    open: openCascade,
                    /*
                      Sticky, one level down.
                      
                      With a dropdown already up, crossing a sibling row swaps
                      it — the same rule the nav follows at L1. Absent unless
                      the mode is on, so a row has nothing to call rather than a
                      handler that decides to do nothing.
                    */
                    ...(flyoutTrigger === "sticky"
                      ? { hover: hoverCascade }
                      : {}),
                    openIds: cascade.map((c) => c.id),
                    level: 0,
                  },
                }
              : {})}
            onSelect={(id, keepOpen) => {
              setActiveId(id);
              onNavigate?.(id, keepOpen);
            }}
            {...(() => {
              const edit =
                editFor(entry.item.id) ??
                agencyEditFor(entry.item.id) ??
                chromeEditFor(entry.item.id);
              return edit ? { edit } : {};
            })()}
            {...(childEdit ? { childEdit } : {})}
          />
            {entry.item.id === lastRowId
              ? editing && category
                ? seam(category.productIds.length)
                : agencyEditing
                  ? agencySeam(entries.length)
                  : chromeEditing
                    ? chromeSeam(entries.length)
                    : null
              : null}
          </React.Fragment>
        ),
      )}

      {config.cta ? (
        <div
          style={
            {
              "--row-index": Math.min(entries.length, MAX_STAGGERED_ROWS),
            } as React.CSSProperties
          }
          className="motion-row-in w-full shrink-0"
        >
          <FlyoutActionRow row={config.cta} />
        </div>
      ) : null}
        </div>
        <div aria-hidden="true" data-scroll-fade="bottom" />
      </div>

      {/*
        Pinned below the scroll region, so it survives a short screen. Lands last,
        after the list has settled.
      */}
      {config.bottom ? (
        <div
          style={
            {
              "--row-index": Math.min(entries.length + 2, MAX_STAGGERED_ROWS + 2),
            } as React.CSSProperties
          }
          className="motion-row-in w-full shrink-0 px-[14px] pt-[var(--t-fly-block-gap,10px)]"
        >
          <BottomSlot slot={config.bottom} />
        </div>
      ) : null}

      {picker.targetId && picker.anchor ? (
        <IconPicker
          anchor={picker.anchor}
          // The effective icon, so the shipped glyph reads as selected before
          // anything has been overridden.
          selected={nameForIcon(layout.productIconFor(picker.targetId))}
          onPick={(name) => layout.setIcon(picker.targetId!, name)}
          {...(layout.hasIconOverride(picker.targetId)
            ? { onReset: () => layout.resetIcon(picker.targetId!) }
            : {})}
          onClose={picker.close}
        />
      ) : null}
      {menu.openId && menu.anchor ? (
        <RowMenu
          anchor={menu.anchor}
          title={layout.productLabelFor(menu.openId)}
          actions={menuActions(menu.openId)}
          onClose={menu.close}
        />
      ) : null}
      {adding && category ? (
        <RowMenu
          anchor={adding.anchor}
          title={category.label}
          actions={addActions(adding.index)}
          // Straight into the list: the seam offers exactly one thing, so a menu
          // whose only entry had to be clicked first would be a click carrying
          // no decision.
          initialView={ADD_VIEW}
          // The plus sits mid-panel, so lining the menu's right edge up with a
          // 16px button would throw it two hundred pixels to the left.
          align="start"
          onClose={() => setAdding(null)}
        />
      ) : null}

      {/*
        The cascade, rendered from the panel rather than from the rows.
        
        Each level's rows are the SAME component the inline mode uses, so a row
        in a dropdown drags, renames, pins and menus exactly as it does in the
        list — there is one L3 row in this codebase, seen in two places.
      */}
      {cascade.length > 0 ? (
        <FlyoutCascade
          theme={theme}
          onPointerEnter={() => {
            // Reaching the dropdown cancels any pending switch — the rows the
            // pointer crossed on the way were en route, not destinations.
            cancelCascade();
            onPointerEnter?.();
          }}
          onPointerLeave={onPointerLeave}
          levels={cascade.map((level, i) => ({
            id: level.id,
            anchor: level.anchor,
            body: (
              <FlyoutChildRows
                nodes={level.nodes}
                depth={i}
                activeId={activeId}
                onSelect={(id: string, keepOpen?: boolean) => {
                  setActiveId(id);
                  onNavigate?.(id, keepOpen);
                }}
                tabsInNav={tabsInNav}
                cascade={{
                  open: openCascade,
                  ...(flyoutTrigger === "sticky"
                    ? { hover: hoverCascade }
                    : {}),
                  openIds: cascade.map((c) => c.id),
                  level: i,
                }}
                {...(childEdit ? { edit: childEdit } : {})}
              />
            ),
          }))}
        />
      ) : null}
    </div>
  );
}
