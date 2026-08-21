"use client";

import * as React from "react";
import { FolderInput, Pencil, Plus, Trash2, X } from "lucide-react";

import { L2_MIME } from "@/components/nav/nav-drag";
import { UNGROUPED_ID } from "@/components/nav/grouping";
import { PROPOSED_SETTINGS_ID } from "@/components/nav/proposed-ia";
import { productTreeOptions } from "@/components/nav/product-options";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import {
  RowMenu,
  useRowMenu,
  type RowMenuAction,
  type RowMenuOption,
} from "@/components/nav/row-menu";
import { RowSeam } from "@/components/nav/row-seam";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import { useDragTypes } from "@/lib/use-drag-active";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import { BottomSlot } from "./bottom-slot";
import { FlyoutActionRow } from "./flyout-action-row";
import { FlyoutRow, type FlyoutRowEdit } from "./flyout-row";
import type { FlyoutConfig } from "./types";

interface FlyoutPanelProps {
  config: FlyoutConfig;
  /** Distance from the viewport's left edge — 272 when open, 64 when collapsed. */
  offsetLeft: number;
  theme: SurfaceTheme;
  phase: TransitionPhase;
  /** Keeps the panel alive while the pointer is inside it. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onClose: () => void;
  /** Fired for row and L2-child clicks — the shell routes them to pages. */
  onNavigate?: (id: string) => void;
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
  const editing = navEditing && category !== undefined;
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [lifted, setLifted] = React.useState<string | null>(null);
  const [over, setOver] = React.useState<string | null>(null);
  const menu = useRowMenu();
  /** Which seam's add-picker is open, anchored to the plus that opened it. */
  const [adding, setAdding] = React.useState<{
    index: number;
    anchor: DOMRect;
  } | null>(null);

  /** Where every other category is, for this panel's Move-to lists. */
  const destinations = layout.groups.filter(
    (g) => g.id !== UNGROUPED_ID && g.id !== PROPOSED_SETTINGS_ID,
  );

  const editFor = (productId: string): FlyoutRowEdit | undefined => {
    if (!editing || !category) return undefined;
    return {
      renaming: renamingId === productId,
      onStartRename: () => setRenamingId(productId),
      onCommitRename: (next) => {
        layout.setProductLabel(productId, next);
        setRenamingId(null);
      },
      onCancelRename: () => setRenamingId(null),
      onOpenMenu: (trigger) => menu.open(productId, trigger),
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

  const dragTypes = useDragTypes();

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
    for (let i = config.entries.length - 1; i >= 0; i -= 1) {
      const e = config.entries[i];
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

  const menuActions = (productId: string): RowMenuAction[] => [
    {
      id: "rename",
      label: "Rename",
      icon: Pencil,
      onSelect: () => setRenamingId(productId),
    },
    {
      id: "move",
      label: "Move to",
      icon: FolderInput,
      options: destinations.map((g) => ({
        id: g.id,
        label: g.label,
        icon: g.icon,
        current: g.id === category?.id,
      })),
      onPick: (groupId) => layout.moveProductToGroup(productId, groupId),
    },
    {
      id: "remove",
      label: "Remove from the nav",
      icon: Trash2,
      danger: true,
      onSelect: () => layout.removeProductFromNav(productId),
    },
  ];

  /*
   * A panel whose only row is expandable opens it.
   *
   * Automation is the case: one product, Workflows, with everything real one
   * level down. Collapsed, the panel is a single row whose only job is to reveal
   * the panel's actual contents — a click that carries no decision. Expanded, the
   * panel says what is in it.
   */
  const itemRows = config.entries.filter((e) => e.kind === "item");
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
      style={{ left: offsetLeft }}
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
        "absolute top-[var(--shell-canvas-gap)] bottom-[var(--shell-canvas-gap)] z-30 flex w-[360px] flex-col items-start overflow-hidden rounded-r-[var(--shell-canvas-radius)] bg-nav pt-[14px] pb-[16px] outline-none",
        // Editing, the panel completes the nav's ring rather than wearing its
        // own border — top, right and bottom in brand, nothing on the left, so
        // the two boxes read as one surface with one stroke around it.
        navEditing
          ? "shadow-[var(--shell-canvas-shadow),inset_0_1.5px_0_0_var(--brand),inset_-1.5px_0_0_0_var(--brand),inset_0_-1.5px_0_0_var(--brand)]"
          : "shadow-[var(--shell-canvas-shadow),inset_0_1px_0_0_var(--fly-border),inset_-1px_0_0_0_var(--fly-border),inset_0_-1px_0_0_var(--fly-border)]",
        // `left` animates too, so the panel follows the nav edge when the rail
        // collapses underneath an open panel instead of jumping.
        "motion-move",
        phase === "entering" ? "motion-panel-in" : "motion-panel-out",
      )}
    >
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

      {config.entries.map((entry, i) =>
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
            {editing && category ? seam(rowIndexOf(entry.item.id)) : null}
          <FlyoutRow
            key={entry.item.id}
            item={entry.item}
            variant={config.variant}
            active={entry.item.id === activeId}
            defaultOpen={soleExpandable}
            rowIndex={Math.min(i, MAX_STAGGERED_ROWS)}
            onSelect={(id) => {
              setActiveId(id);
              onNavigate?.(id);
            }}
            {...(() => {
              const edit = editFor(entry.item.id);
              return edit ? { edit } : {};
            })()}
          />
            {editing && category && entry.item.id === lastRowId
              ? seam(category.productIds.length)
              : null}
          </React.Fragment>
        ),
      )}

      {config.cta ? (
        <div
          style={
            {
              "--row-index": Math.min(config.entries.length, MAX_STAGGERED_ROWS),
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
              "--row-index": Math.min(config.entries.length + 2, MAX_STAGGERED_ROWS + 2),
            } as React.CSSProperties
          }
          className="motion-row-in w-full shrink-0 px-[14px] pt-[var(--t-fly-block-gap,10px)]"
        >
          <BottomSlot slot={config.bottom} />
        </div>
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
