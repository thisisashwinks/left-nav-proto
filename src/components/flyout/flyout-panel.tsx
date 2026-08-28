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
  type FlyoutChildEdit,
  type FlyoutRowEdit,
} from "./flyout-row";
import type { FlyoutConfig } from "./types";

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
  const { editTreatment } = useTheme().effective;
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
      onDragStart: (e) => {
        e.dataTransfer.setData(L2_MIME, productId);
        e.dataTransfer.setData("text/plain", layout.productLabelFor(productId));
        e.dataTransfer.effectAllowed = "move";
        setLifted(productId);
      },
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
  }, [agencyBucket, agencyOrder, config.entries]);

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
      pull="var(--t-fly-block-gap,10px)"
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
      // The flyout's rows sit a block-gap apart, which is roomier than the nav's
      // two pixels — so the seam cancels that gap instead, and can reach further.
      pull="var(--t-fly-block-gap,10px)"
      reach={12}
    />
  );

  const menuActions = (productId: string): RowMenuAction[] => {
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
         * The panel completes the nav's outline, so it has to follow whichever
         * treatment the nav is wearing. Only `ring` puts a stroke here; under
         * `hatch` the striped band continues instead (below), and under `dim`
         * and `band` the panel keeps its ordinary hairline — the mode is being
         * carried somewhere else entirely, and a brand-weight edge on the panel
         * alone would read as the panel being selected.
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
      {/* The nav's hatched edge, continued round the panel's own three sides.
          Nothing on the left: that seam is where the two boxes join. */}
      {navEditing && editTreatment === "hatch" ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 z-40">
          <span className="nav-edit-hatch absolute inset-x-0 top-0 h-[4px]" />
          <span className="nav-edit-hatch absolute inset-x-0 bottom-0 h-[4px]" />
          <span className="nav-edit-hatch absolute inset-y-0 right-0 w-[4px]" />
        </span>
      ) : null}

      <div className="flex w-full shrink-0 items-center gap-[8px] px-[16px] pt-0 pb-[4px]">
        <div className="flex h-fit flex-1 items-center justify-between">
          <h2 className="text-[15px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
            {config.title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle motion-tap hover:bg-nav-hover hover:text-nav-fg-muted hover:rotate-90 active:scale-90"
          >
            <X size={15} aria-hidden="true" />
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
          className="flex w-full flex-1 flex-col items-start gap-[var(--t-fly-block-gap,10px)] overflow-y-auto px-[14px] pt-[var(--t-fly-block-gap,10px)]"
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
                : null}
          <FlyoutRow
            key={entry.item.id}
            item={entry.item}
            variant={config.variant}
            active={entry.item.id === activeId}
            // Not the same question as `active`: that asks whether THIS row is
            // the page, this asks which row under it is — the dropdown needs the
            // id to mark one of its own.
            activeId={activeId}
            defaultOpen={soleExpandable}
            rowIndex={Math.min(i, MAX_STAGGERED_ROWS)}
            onSelect={(id, keepOpen) => {
              setActiveId(id);
              onNavigate?.(id, keepOpen);
            }}
            {...(() => {
              const edit =
                editFor(entry.item.id) ?? agencyEditFor(entry.item.id);
              return edit ? { edit } : {};
            })()}
            {...(childEdit ? { childEdit } : {})}
          />
            {entry.item.id === lastRowId
              ? editing && category
                ? seam(category.productIds.length)
                : agencyEditing
                  ? agencySeam(entries.length)
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
    </div>
  );
}
