"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { SurfaceTheme } from "@/design/theme";
import { cn } from "@/lib/utils";
import type { TransitionPhase } from "@/lib/use-exit-transition";
import { useScrollEdges } from "@/lib/use-scroll-edges";
import type { CatalogueChild } from "./catalogue-types";
import { childById, productById } from "./catalogue";
import { GROUPING_LABELS, type ResolvedGroup } from "./grouping";
import { nameForIcon } from "./icon-catalogue";
import { IconPicker, useIconPicker } from "./icon-picker";
import { InlineRename } from "./inline-rename";
import { useNavLayout } from "./nav-layout-provider";
import { PinButton } from "./pin-button";
import { ResolvedIcon } from "./resolved-icon";

/**
 * The grid launcher — Option C from the spec board, grown into the full manage
 * surface.
 *
 * "Pinned first, then everything the account owns, each row pinning in place."
 * There is still no modal anywhere in this flow: it reuses the 360px flyout shell
 * the nav already has, so there is no new surface to learn, and every edit
 * happens on the row it affects.
 *
 * Why the heavy editing lives here rather than in the nav: these are full-width
 * rows with room for a grip, two nudge buttons and a star, where the nav's rows
 * are 40px chips. The nav gets renaming and icons — the edits that are about one
 * row — and the launcher gets structure.
 */
export function PinnedLauncher({
  offsetLeft,
  theme,
  phase,
  agencyScope,
  onPointerEnter,
  onPointerLeave,
  onClose,
}: {
  offsetLeft: number;
  theme: SurfaceTheme;
  /** Drives the enter/exit animation, as for the product flyouts. */
  phase: TransitionPhase;
  /**
   * Whether the panel is open at agency scope. The note under Pinned names the
   * agency view, which is a lie in a sub-account — the same panel serves both.
   */
  agencyScope: boolean;
  /** Keeps the panel alive while the pointer is inside it. */
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onClose: () => void;
}) {
  const layout = useNavLayout();
  const { state, groups, can } = layout;
  const [query, setQuery] = React.useState("");
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const picker = useIconPicker();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Escape empties the field before it closes the panel. A typed query is
      // work, and taking the whole surface away with it is the wrong first
      // answer — the second Escape still closes.
      if (searching) {
        setQuery("");
        inputRef.current?.focus();
        return;
      }
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, searching]);

  /*
    Searching replaces the panel rather than filtering it.

    Filtering left both headings standing over one or two survivors each, so the
    structure you were reading through kept rearranging itself under the query.
    A search is a different question — "where is this" rather than "what is
    there" — and it gets its own flat answer, sub-items included. The sections
    come back intact the moment the field is empty.
  */
  const hits = searching ? searchHits(layout, groups, q) : [];

  const pinnedIds = state.pinned.filter(
    (id) =>
      // A pin can name an L3 row as well as a product now, so the guard asks
      // whether the id resolves to anything the nav can draw rather than
      // whether it is a product. It stayed a product check for one revision
      // after L3 became pinnable, which silently dropped those pins.
      productById(id) !== undefined || childById(id) !== undefined,
  );

  // Resolved up front so the "All products" heading knows whether anything
  // is under it before it commits to rendering.
  const visibleGroups = groups
    .map((group) => ({ group, productIds: group.productIds }))
    .filter(({ productIds }) => productIds.length > 0);

  /**
   * Reordering is off while a filter is applied. The nudge buttons and drops work
   * on positions in the group, and a filtered list's positions are not the
   * group's — "move down" would move the row past something it cannot see.
   */
  const reorderable = state.grouping === "custom" && can.customise && !q;
  /*
   * Renaming belongs to the mode, here as everywhere else.
   *
   * The launcher offered a pencil on every row all the time, so a product could
   * be renamed from a panel you opened to LAUNCH something — no mode entered,
   * no Save, no Discard, and the change landing in a nav you were not looking
   * at. The nav's own rows have been behind the mode since it shipped; this was
   * the one surface that never got the gate.
   */
  const editable = state.editing && can.renameForSelf;

  const scrollRef = React.useRef<HTMLDivElement>(null);
  useScrollEdges(scrollRef);

  const pickerTarget = picker.targetId;

  return (
    <>
      <button
        type="button"
        aria-label="Close all products"
        tabIndex={-1}
        onClick={onClose}
        style={{ left: offsetLeft }}
        className="absolute top-0 right-0 bottom-0 z-30 cursor-default"
      />

      <div
        role="dialog"
        aria-label="All products"
        data-nav-theme={theme}
        data-cursor="menu"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        style={{ left: offsetLeft }}
        className={cn(
          // Header and filter pinned, list scrolling, "New group" pinned at the
          // bottom — same reasoning as the flyout panel: on a short screen the
          // whole thing scrolled and the create affordance went with it.
          "absolute top-0 bottom-0 z-40 flex w-[360px] flex-col items-start overflow-hidden bg-nav pt-[14px] pb-[16px] shadow-[8px_0_24px_0_var(--fly-shadow),inset_-1px_0_0_0_var(--fly-border)]",
          phase === "entering" ? "motion-panel-in" : "motion-panel-out",
        )}
      >
        <div className="flex w-full shrink-0 items-center justify-between px-[16px] pb-[4px]">
          <h2 className="text-[15px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
            All products
          </h2>
          <div className="flex items-center gap-[6px]">
            {/*
              States which grouping is showing. The panel lists the same groups
              as the nav, so without this it is not obvious why they changed.
            */}
            <span className="rounded-[5px] bg-nav-hover px-[6px] py-[3px] text-[10px] leading-none text-nav-fg-subtle">
              {GROUPING_LABELS[state.grouping]}
            </span>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:rotate-90 hover:bg-nav-hover hover:text-nav-fg-muted"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Same index the spotlight uses, so typing here and there agree. */}
        <div className="mx-[14px] flex h-[36px] w-[calc(100%-28px)] shrink-0 items-center gap-[9px] rounded-[9px] px-[10px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
          <Search size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-nav-fg placeholder:text-nav-fg-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {/*
            The way back out. Escape does the same thing, but the panel opens
            under the pointer and stays there — a keyboard-only exit from a
            state this visible is not an exit most people will find.
          */}
          {searching ? (
            <button
              type="button"
              aria-label="Clear search"
              title="Clear search"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="motion-tap flex size-[20px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
            >
              <X size={14} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div
          data-scroll-shell=""
          className="relative flex min-h-0 w-full flex-1 flex-col"
        >
          <div aria-hidden="true" data-scroll-fade="top" />
          <div
            ref={scrollRef}
            data-scroll-region=""
            className="flex w-full flex-1 flex-col items-start gap-[10px] overflow-y-auto px-[14px] pt-[10px]"
          >
        {searching ? (
          hits.length > 0 ? (
            hits.map((hit) => (
              <SearchRow key={hit.id} productId={hit.id} context={hit.context} />
            ))
          ) : (
            <p className="w-full px-[2px] py-[14px] text-[13px] text-nav-fg-subtle">
              No products match “{query}”
            </p>
          )
        ) : (
          <>
          {pinnedIds.length > 0 ? (
            <>
              <SectionHeading count={state.pinned.length}>Pinned</SectionHeading>
              {agencyScope ? <PinnedScopeNote /> : null}
              {pinnedIds.map((id) => {
                const index = state.pinned.indexOf(id);
                return (
                  <ProductRow
                    key={`pin-${id}`}
                    productId={id}
                    gripReplacesIcon
                    reorder={{
                      onUp: () => layout.movePin(index, index - 1),
                      onDown: () => layout.movePin(index, index + 1),
                      upDisabled: index === 0,
                      downDisabled: index === state.pinned.length - 1,
                    }}
                    drag={{
                      key: `pin:${index}`,
                      onDrop: (from) => {
                        const fromIndex = Number(from.split(":")[1]);
                        if (!Number.isNaN(fromIndex)) layout.movePin(fromIndex, index);
                      },
                    }}
                  />
                );
              })}
            </>
          ) : state.pinned.length === 0 ? (
            // Only when there are genuinely none — a filter that hides them all
            // is not an empty pin list, so it drops the section instead.
            <>
              <SectionHeading>Pinned</SectionHeading>
              {agencyScope ? <PinnedScopeNote /> : null}
              <p className="w-full px-[2px] pb-[4px] text-[12.5px] leading-[17px] text-nav-fg-subtle">
                No pinned items yet. Pin anything below and it appears at the top
                of the nav.
              </p>
            </>
          ) : null}

          {visibleGroups.length > 0 ? (
            <SectionHeading divider>All products</SectionHeading>
          ) : null}

          {visibleGroups.map(({ group, productIds }, groupIndex) => (
            <React.Fragment key={group.id}>
              <GroupHeader
                group={group}
                index={groupIndex}
                groupCount={groups.length}
                renaming={renamingId === group.id}
                {...(editable
                  ? {
                      onStartRename: () => setRenamingId(group.id),
                      onPickIcon: (el: HTMLElement) => picker.open(group.id, el),
                    }
                  : {})}
                onEndRename={() => setRenamingId(null)}
              />
              {productIds.map((id, i) => (
                <ProductRow
                  key={`${group.id}-${id}`}
                  productId={id}
                  renaming={renamingId === `${group.id}:${id}`}
                  {...(editable
                    ? {
                        onStartRename: () => setRenamingId(`${group.id}:${id}`),
                        onPickIcon: (el: HTMLElement) => picker.open(id, el),
                      }
                    : {})}
                  onEndRename={() => setRenamingId(null)}
                  {...(reorderable
                    ? {
                        reorder: {
                          onUp: () => nudge(layout, groups, group, i, -1),
                          onDown: () => nudge(layout, groups, group, i, 1),
                          // Never disabled in custom mode: at a boundary the nudge
                          // crosses into the neighbouring group instead of
                          // stopping, which is what makes the whole list one axis.
                          upDisabled: groupIndex === 0 && i === 0,
                          downDisabled:
                            groupIndex === groups.length - 1 &&
                            i === productIds.length - 1,
                        },
                        drag: {
                          key: `${group.id}:${i}`,
                          onDrop: (from) => dropInto(layout, from, group, i),
                        },
                      }
                    : {})}
                />
              ))}
            </React.Fragment>
          ))}
          </>
        )}

          </div>
          <div aria-hidden="true" data-scroll-fade="bottom" />
        </div>

        {can.customise && !q ? (
          <div className="mx-[14px] mt-[6px] w-[calc(100%-28px)] shrink-0 pt-[12px] shadow-[inset_0_1px_0_0_var(--nav-divider)]">
            {creating ? (
              <div className="flex w-full items-center gap-[10px] rounded-[9px] px-[8px] py-[8px]">
                <Plus size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
                <InlineRename
                  value=""
                  ariaLabel="Name the new group"
                  onCommit={(label) => {
                    layout.createGroup(label);
                    setCreating(false);
                  }}
                  onCancel={() => setCreating(false)}
                  className="text-[14px] leading-[normal]"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="motion-tap flex w-full items-center gap-[10px] rounded-[9px] px-[8px] py-[8px] text-left hover:bg-nav-hover"
              >
                <Plus size={16} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
                <span className="text-[14px] leading-[normal] text-nav-fg-muted">
                  New group
                </span>
                {state.grouping !== "custom" ? (
                  <span className="ml-auto text-[11px] leading-none text-nav-fg-subtle">
                    switches to custom
                  </span>
                ) : null}
              </button>
            )}
          </div>
        ) : null}
      </div>

      {pickerTarget && picker.anchor ? (
        <IconPicker
          anchor={picker.anchor}
          selected={nameForIcon(
            groups.some((g) => g.id === pickerTarget)
              ? layout.iconFor(pickerTarget)
              : layout.productIconFor(pickerTarget),
          )}
          onPick={(iconName) => layout.setIcon(pickerTarget, iconName)}
          {...(layout.hasIconOverride(pickerTarget)
            ? { onReset: () => layout.resetIcon(pickerTarget) }
            : {})}
          onClose={picker.close}
        />
      ) : null}
    </>
  );
}

interface SearchHit {
  id: string;
  /** Where it lives: the group for a product, the product for a sub-item. */
  context: string;
  /** 0 when the label opens with the query, 1 when it merely contains it. */
  rank: number;
}

/**
 * Everything the query names, flat — products and the sub-places inside them.
 *
 * Sub-items are in because the panel is the only place that lists them all, and
 * a search that can find Contacts but not Smart Lists sends you hunting through
 * a product you already named. They pin like anything else, so a result row
 * needs no special case beyond the line saying where it came from.
 *
 * Order: prefix matches first, and the catalogue's own order within each rank.
 * `sort` is stable, so results settle rather than reshuffling as you type.
 */
function searchHits(
  layout: ReturnType<typeof useNavLayout>,
  groups: ResolvedGroup[],
  q: string,
): SearchHit[] {
  const hits: SearchHit[] = [];
  // A product can sit in one group and a child under one parent, but the
  // proposed IA files some ids twice — one row each, not two.
  const seen = new Set<string>();

  const add = (id: string, context: string) => {
    if (seen.has(id)) return;
    const at = layout.productLabelFor(id).toLowerCase().indexOf(q);
    if (at === -1) return;
    seen.add(id);
    hits.push({ id, context, rank: at === 0 ? 0 : 1 });
  };

  const walk = (kids: readonly CatalogueChild[], trail: string[]) => {
    for (const child of kids) {
      add(child.id, trail.join(" · "));
      // `tabs` means this row's children are views on its page rather than
      // places of their own. They never appear in a flyout, so they never
      // appear here either — the rule the whole nav is built on.
      if (child.children?.length && !child.tabs) {
        walk(child.children, [...trail, layout.productLabelFor(child.id)]);
      }
    }
  };

  for (const group of groups) {
    for (const id of group.productIds) {
      add(id, group.label);
      const product = productById(id);
      if (product?.children?.length && !product.tabs) {
        walk(product.children, [layout.productLabelFor(id)]);
      }
    }
  }

  return hits.sort((a, b) => a.rank - b.rank);
}

/**
 * One search result: what it is, where it lives, and whether it is pinned.
 *
 * Deliberately not `ProductRow`. A result has no position to nudge — the list
 * is the query's order, not the nav's — and renaming a product you have only
 * just found, from a list that disappears when you clear the field, is an edit
 * made somewhere you cannot see its effect. Pinning is the one thing that still
 * makes sense here, and it is the reason most people search this panel at all.
 */
function SearchRow({
  productId,
  context,
}: {
  productId: string;
  context: string;
}) {
  const layout = useNavLayout();
  const icon = layout.productIconFor(productId);
  const label = layout.productLabelFor(productId);

  return (
    <div
      className={cn(
        // Same geometry as ProductRow, pin column included, so a result and a
        // list row are recognisably the same object.
        "group/row motion-tap relative flex w-full shrink-0 items-center gap-[10px] rounded-[9px] py-[6px] pl-[8px]",
        "pr-[calc(8px+22px+10px)] hover:bg-nav-hover",
      )}
    >
      <ResolvedIcon icon={icon} size={18} className="text-nav-fg-muted" />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[14px] leading-[18px] text-nav-fg">
          {label}
        </span>
        {context ? (
          <span className="truncate text-[12px] leading-[16px] text-nav-fg-subtle">
            {context}
          </span>
        ) : null}
      </span>
      <span className="absolute top-1/2 right-[8px] z-10 -translate-y-1/2">
        <PinButton productId={productId} />
      </span>
    </div>
  );
}

/**
 * Moves a product one step along the whole list, crossing group boundaries.
 *
 * The click equivalent of dragging, and the reason there is one: dragging across
 * a scrolling 360px panel is the least reliable interaction in the whole surface,
 * so nothing may depend on it. Stepping off the end of a group lands you at the
 * near edge of the next, which is what the same drag would have done.
 */
function nudge(
  layout: ReturnType<typeof useNavLayout>,
  groups: ResolvedGroup[],
  group: ResolvedGroup,
  index: number,
  dir: -1 | 1,
) {
  const productId = group.productIds[index];
  if (!productId) return;
  const next = index + dir;
  if (next >= 0 && next < group.productIds.length) {
    layout.moveProductWithinGroup(group.id, index, next);
    return;
  }
  const groupIndex = groups.findIndex((g) => g.id === group.id);
  const neighbour = groups[groupIndex + dir];
  if (!neighbour) return;
  layout.moveProductToGroup(
    productId,
    neighbour.id,
    // Moving down enters the next group at the top; moving up enters the
    // previous one at the bottom. Either way it stays adjacent to where it was.
    dir === 1 ? 0 : neighbour.productIds.length,
  );
}

/** Resolves a drop onto a row, whether it came from this group or another. */
function dropInto(
  layout: ReturnType<typeof useNavLayout>,
  from: string,
  group: ResolvedGroup,
  index: number,
) {
  const [fromGroupId, fromIndexRaw] = from.split(":");
  const fromIndex = Number(fromIndexRaw);
  if (!fromGroupId || Number.isNaN(fromIndex)) return;
  if (fromGroupId === group.id) {
    layout.moveProductWithinGroup(group.id, fromIndex, index);
    return;
  }
  const productId = layout.groups.find((g) => g.id === fromGroupId)?.productIds[
    fromIndex
  ];
  if (productId) layout.moveProductToGroup(productId, group.id, index);
}

interface ReorderControls {
  onUp: () => void;
  onDown: () => void;
  upDisabled: boolean;
  downDisabled: boolean;
}

interface DragControls {
  /** `groupId:index`, so a drop knows where the row came from. */
  key: string;
  onDrop: (fromKey: string) => void;
}

/**
 * A group's heading, and everything you can do to the group itself.
 *
 * The icon is the picker's trigger, matching the nav — the thing you want to
 * change is the thing you click, and a separate button next to it would be a
 * second control for one property.
 */
function GroupHeader({
  group,
  index,
  groupCount,
  renaming,
  onStartRename,
  onEndRename,
  onPickIcon,
}: {
  group: ResolvedGroup;
  index: number;
  groupCount: number;
  renaming: boolean;
  /** Absent outside edit mode, which is what removes the affordances. */
  onStartRename?: () => void;
  onEndRename: () => void;
  onPickIcon?: (trigger: HTMLElement) => void;
}) {
  const layout = useNavLayout();
  const { can } = layout;
  const Icon = group.icon;
  const renamed = layout.isRenamed(group.id);

  return (
    <div className="group/row flex w-full shrink-0 items-center gap-[8px] pt-[10px] pr-[2px] pb-[2px] pl-[2px]">
      {can.regroup && onPickIcon ? (
        <button
          type="button"
          aria-label={`Change the ${group.label} icon`}
          title="Change icon"
          onClick={(e) => onPickIcon(e.currentTarget)}
          className="motion-tap flex size-[18px] shrink-0 items-center justify-center rounded-[5px] text-nav-fg-subtle outline-[1px] outline-offset-0 outline-transparent group-hover/row:outline-dashed group-hover/row:outline-[var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg"
        >
          <Icon size={13} aria-hidden="true" />
        </button>
      ) : (
        <Icon size={13} aria-hidden="true" className="shrink-0 text-nav-fg-subtle" />
      )}

      {renaming ? (
        <InlineRename
          value={group.label}
          ariaLabel={`Rename ${group.label}`}
          onCommit={(next) => {
            layout.setLabel(group.id, next);
            onEndRename();
          }}
          onCancel={onEndRename}
          className="text-[11px] leading-[13px] font-semibold tracking-[0.5px] uppercase"
        />
      ) : onStartRename ? (
        /*
          The label IS the rename target while editing.

          A pencil beside it was a second control for the thing the text
          already names — and every other surface in the nav renames by
          clicking the words. Outside the mode this is a plain span again, so
          the panel reads as a launcher rather than an editor.
        */
        <button
          type="button"
          onClick={onStartRename}
          aria-label={`Rename ${group.label}`}
          className="motion-tap min-w-0 flex-1 truncate rounded-[4px] text-left text-[11px] leading-[13px] font-semibold tracking-[0.5px] whitespace-nowrap text-nav-fg-subtle uppercase outline-[1px] outline-offset-2 outline-transparent hover:outline-dashed hover:outline-[var(--nav-divider)]"
        >
          {group.label}
        </button>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[11px] leading-[13px] font-semibold tracking-[0.5px] whitespace-nowrap text-nav-fg-subtle uppercase">
          {group.label}
        </span>
      )}

      {!renaming ? (
        <span className="flex shrink-0 items-center gap-[1px] opacity-0 group-hover/row:opacity-100 focus-within:opacity-100">
          {renamed && onStartRename ? (
            <TinyButton
              label={`Reset ${group.label} to the shipped name`}
              onClick={() => layout.resetLabel(group.id)}
            >
              <RotateCcw size={10} aria-hidden="true" />
            </TinyButton>
          ) : null}
          {can.regroup ? (
            <>
              <TinyButton
                label={`Move ${group.label} up`}
                disabled={index === 0}
                onClick={() => layout.moveGroup(index, index - 1)}
              >
                <ArrowUp size={10} aria-hidden="true" />
              </TinyButton>
              <TinyButton
                label={`Move ${group.label} down`}
                disabled={index === groupCount - 1}
                onClick={() => layout.moveGroup(index, index + 1)}
              >
                <ArrowDown size={10} aria-hidden="true" />
              </TinyButton>
            </>
          ) : null}
          {group.custom && can.customise ? (
            <TinyButton
              label={`Delete ${group.label}`}
              onClick={() => layout.deleteGroup(group.id)}
            >
              <Trash2 size={10} aria-hidden="true" />
            </TinyButton>
          ) : null}
        </span>
      ) : null}
    </div>
  );
}

/**
 * One product, in Favorites or under a group.
 *
 * The same row either way, so a product looks like itself wherever it appears —
 * only the reorder controls differ, because reordering means different things in
 * the two places (your dock order vs. the nav's structure).
 */
function ProductRow({
  productId,
  renaming = false,
  gripReplacesIcon = false,
  onStartRename,
  onEndRename,
  onPickIcon,
  reorder,
  drag,
}: {
  productId: string;
  renaming?: boolean;
  /**
   * The grip takes the icon's place on hover instead of standing in a column of
   * its own. See the icon slot below for why only Pinned asks for this.
   */
  gripReplacesIcon?: boolean;
  onStartRename?: () => void;
  onEndRename?: () => void;
  onPickIcon?: (trigger: HTMLElement) => void;
  reorder?: ReorderControls;
  drag?: DragControls;
}) {
  const layout = useNavLayout();
  const { can } = layout;
  const [dragging, setDragging] = React.useState(false);
  const icon = layout.productIconFor(productId);
  const label = layout.productLabelFor(productId);
  const renamed = layout.isProductRenamed(productId);

  return (
    <div
      {...(drag
        ? {
            draggable: true,
            onDragStart: (e: React.DragEvent) => {
              e.dataTransfer.setData("text/plain", drag.key);
              e.dataTransfer.effectAllowed = "move";
              setDragging(true);
            },
            onDragEnd: () => setDragging(false),
            onDragOver: (e: React.DragEvent) => e.preventDefault(),
            onDrop: (e: React.DragEvent) => {
              e.preventDefault();
              const from = e.dataTransfer.getData("text/plain");
              setDragging(false);
              if (from && from !== drag.key) drag.onDrop(from);
            },
          }
        : {})}
      className={cn(
        /*
         * `relative`, and the pin's column reserved — the same treatment
         * `WithPin` gives a flyout row.
         *
         * The pin used to be a flex child here, which made it the one surface
         * where it participated in layout: it shifted with the row's other
         * controls instead of holding a fixed column, so the same button sat in
         * a different place depending on which surface you were looking at. Now
         * it is an overlay at the row's trailing edge in both, and the text
         * gives up exactly the width it occupies.
         */
        "group/row motion-tap relative flex w-full shrink-0 items-center gap-[10px] rounded-[9px] py-[8px] pl-[8px]",
        "pr-[calc(8px+22px+10px)]",
        dragging ? "opacity-40" : "hover:bg-nav-hover",
      )}
    >
      {drag && !gripReplacesIcon ? (
        <GripVertical
          size={14}
          aria-hidden="true"
          className="shrink-0 cursor-grab text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 active:cursor-grabbing"
        />
      ) : null}

      {drag && gripReplacesIcon ? (
        /*
          The grip stands in the icon's place rather than beside it.

          A leading grip column only exists while the pointer is on the row, but
          it holds its width always — so Pinned's icons sat one column right of
          every icon under All products, and the panel read as two lists rather
          than one. Swapping in place keeps a single icon column down the whole
          panel, and costs nothing: the row itself has always been the drag
          target, so the grip was only ever saying so.

          Only Pinned asks for this. A row under All products can carry the icon
          picker on the same glyph while custom grouping is on, and a picker you
          cannot hover without it turning into something else is not a picker.
        */
        <span className="relative flex size-[18px] shrink-0 cursor-grab items-center justify-center active:cursor-grabbing">
          <ResolvedIcon
            icon={icon}
            size={18}
            className="text-nav-fg-muted transition-opacity duration-100 group-hover/row:opacity-0"
          />
          <GripVertical
            size={15}
            aria-hidden="true"
            className="absolute inset-0 m-auto text-nav-fg-subtle opacity-0 transition-opacity duration-100 group-hover/row:opacity-100"
          />
        </span>
      ) : onPickIcon && can.regroup ? (
        <button
          type="button"
          aria-label={`Change the ${label} icon`}
          title="Change icon"
          onClick={(e) => onPickIcon(e.currentTarget)}
          className="motion-tap flex size-[22px] shrink-0 items-center justify-center rounded-[5px] text-nav-fg-muted outline-[1px] outline-offset-0 outline-transparent group-hover/row:outline-dashed group-hover/row:outline-[var(--nav-divider)] hover:bg-nav-hover"
        >
          <ResolvedIcon icon={icon} size={18} />
        </button>
      ) : (
        <ResolvedIcon icon={icon} size={18} className="text-nav-fg-muted" />
      )}

      {renaming && onEndRename ? (
        <InlineRename
          value={label}
          ariaLabel={`Rename ${label}`}
          onCommit={(next) => {
            layout.setProductLabel(productId, next);
            onEndRename();
          }}
          onCancel={onEndRename}
          className="text-[14px] leading-[normal]"
        />
      ) : onStartRename ? (
        // Click the words to rename, as the nav's own rows do. Only in the
        // mode — outside it this row exists to launch the product.
        <button
          type="button"
          onClick={onStartRename}
          aria-label={`Rename ${label}`}
          className="motion-tap min-w-0 flex-1 truncate rounded-[5px] text-left text-[14px] leading-[normal] text-nav-fg outline-[1px] outline-offset-2 outline-transparent hover:outline-dashed hover:outline-[var(--nav-divider)]"
        >
          {label}
        </button>
      ) : (
        <span className="min-w-0 flex-1 truncate text-[14px] leading-[normal] text-nav-fg">
          {label}
        </span>
      )}

      {!renaming ? (
        <span className="flex shrink-0 items-center gap-[1px] opacity-0 group-hover/row:opacity-100 focus-within:opacity-100">
          {renamed && onStartRename ? (
            <TinyButton
              label={`Reset ${label} to the shipped name`}
              onClick={() => layout.resetProductLabel(productId)}
            >
              <RotateCcw size={10} aria-hidden="true" />
            </TinyButton>
          ) : null}
          {/* Every drag has a click equivalent — a settled decision. */}
          {reorder ? (
            <>
              <TinyButton
                label="Move up"
                disabled={reorder.upDisabled}
                onClick={reorder.onUp}
              >
                <ArrowUp size={10} aria-hidden="true" />
              </TinyButton>
              <TinyButton
                label="Move down"
                disabled={reorder.downDisabled}
                onClick={reorder.onDown}
              >
                <ArrowDown size={10} aria-hidden="true" />
              </TinyButton>
            </>
          ) : null}
        </span>
      ) : null}

      {/*
        Absolutely positioned and vertically centred, matching a flyout row's
        single-line variants. The row's own `pr` above is the space it stands in.
      */}
      {!renaming ? (
        <span className="absolute top-1/2 right-[8px] z-10 -translate-y-1/2">
          <PinButton productId={productId} />
        </span>
      ) : null}
    </div>
  );
}

function TinyButton({
  label,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="motion-tap flex size-[19px] items-center justify-center rounded-[5px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg disabled:opacity-25"
    >
      {children}
    </button>
  );
}

/**
 * Says who a pin belongs to, under the Pinned heading at agency scope.
 *
 * Pins read as global from inside this panel: nothing on the surface says the
 * arrangement is the agency's own, so an admin curating it here can reasonably
 * expect every sub-account to inherit it. They do not — each account and user
 * carries its own pin list — and the correction is cheaper as a line of copy
 * here than as a surprise later.
 */
function PinnedScopeNote() {
  return (
    // Sits 4px under the heading. The scroll column spaces its children 10px
    // apart and the heading carries 2px of its own bottom padding, so reaching
    // 4px means pulling 8px back rather than setting a margin outright.
    <p className="mt-[-8px] w-full px-[2px] pb-[2px] text-[12.5px] leading-[17px] text-nav-fg-subtle">
      Pins here apply to this agency view only. Sub-accounts and users keep
      their own pinned items.
    </p>
  );
}

/**
 * A top-level section of the panel — Favorites, then All products.
 *
 * Heavier than a group heading on purpose: the group labels inside All products
 * are subordinate to it, and two headings at the same weight would read as a flat
 * list of peers rather than two sections.
 */
function SectionHeading({
  children,
  count,
  divider,
}: {
  children: React.ReactNode;
  count?: number;
  /** Rules off the section above. Not on the first one, which needs no rule. */
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full shrink-0 items-baseline gap-[6px] px-[2px] pt-[6px] pb-[2px]",
        divider &&
          "mt-[6px] pt-[16px] shadow-[inset_0_1px_0_0_var(--nav-divider)]",
      )}
    >
      <h3 className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-nav-fg">
        {children}
      </h3>
      {count !== undefined ? (
        <span className="text-[12px] leading-none text-nav-fg-subtle tabular-nums">
          {count}
        </span>
      ) : null}
    </div>
  );
}
