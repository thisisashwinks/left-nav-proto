"use client";

import * as React from "react";
import {
  Check,
  ChevronDown,
  CircleOff,
  Plus,
  Search,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import type { ListHeaderVariant } from "@/components/page/header-variants";
import type { PageView } from "@/components/page/view-bar";
import { cn } from "@/lib/utils";

/**
 * The list axis, read once, for every page that is a list of records.
 *
 * Lifted here on Sep 22 after Ashwin's "make it consistent for all pages,
 * meaning similar pattern pages": one variant has to drive Contacts, Funnels,
 * Workflows and the Voice AI agent list alike, and the way that stops being
 * true is each page deriving its own booleans from `listHeaderVariant` and
 * then disagreeing about what L-B means. Contacts got there first and got it
 * right (see contacts-page.tsx, Sep 22) — this is that derivation with the
 * contact-specific parts taken out, so the next list to adopt the axis copies
 * a hook rather than a comment.
 *
 * Deliberately NOT a component that draws a header. A list page's header is
 * still PageHeader; what differs between the four variants is WHERE the saved
 * -view scope stands and whether the actions ride the header or the canvas,
 * and those are two booleans plus a picker, not a new layout engine. A
 * wrapper component would have had to accept every prop PageHeader already
 * accepts to earn its place, and the pages that hand-roll a lead row would
 * have been shut out of it.
 */
export interface ListShape {
  /**
   * The raw pick, for a page that needs to say something about a fifth case.
   *
   * Typed off ListHeaderVariant rather than restated as a literal union.
   *
   * It was restated once — `"L-C" | "L-B" | "L-E" | "L-D"` — and on Sep 23,
   * when L-C was retired and L-F added, this line was the only thing in the
   * repo that still believed in L-C. The compiler caught it, which is luck:
   * the same hand-copied union with an id ADDED and none removed would have
   * compiled and quietly widened nothing. The axis is declared in exactly one
   * file, and this is how that stays true.
   */
  variant: ListHeaderVariant;
  /**
   * L-B: the header's row stops repeating the trail's last crumb and carries
   * the scope picker and the page's own controls instead.
   */
  mergedRow: boolean;
  /**
   * L-E: the scope becomes the trail's last crumb and the page draws no
   * header at all — so the actions have to ride the in-canvas toolbar, or the
   * page loses its only way to create a record.
   */
  scopeInTrail: boolean;
  /**
   * L-F: the saved-view tabs and the filter controls share ONE row.
   *
   * Orthogonal to `scopeInTabs` rather than a third value of it, because the
   * tabs do not move in L-F — they stay exactly where L-D put them, and what
   * changes is that the row beneath them is deleted and its contents are
   * pushed onto the tab row's right edge as glyphs. A page that draws tabs
   * therefore reads `scopeInTabs` for WHETHER and `oneRow` for WHERE the
   * filters go, and a page with no saved views can ignore `oneRow` entirely:
   * with nothing to merge into, L-F has no second row to buy back. See the
   * note in funnels-page.tsx, which is that page.
   *
   * False whenever either band is switched off (Sep 23) — see `showViews`.
   */
  oneRow: boolean;
  /**
   * Whether the tab strip of saved views is still the scope control.
   *
   * True for L-D and L-F. Derived here rather than written out at each call
   * site as `!mergedRow && !scopeInTrail`, because that expression is where a
   * new variant silently gets the wrong answer: a new id would fall through
   * to "draw the tabs" on some pages and "draw nothing" on others, which is
   * the divergence this file exists to stop.
   */
  scopeInTabs: boolean;
  /**
   * Whether the collection offers its saved views at all (`listShowViews`).
   *
   * The Sep 23 ask, and the mirror of what the page-header knobs already do
   * for the title, the description and the count: the two bands under the
   * header get a switch each, independent of which variant arranges them.
   * Off, the collection shows whichever cut is lit and the others are simply
   * unreachable from the page — which is a real product, not a broken one:
   * a list nobody has ever re-cut is spending a 38px band on a row of one.
   *
   * It governs the saved-view SCOPE CONTROL rather than the tab strip
   * specifically, because three of the four variants do not draw a strip —
   * L-B has a picker on the header's row, L-E and the board's K-C hand the
   * scope up as the trail's last crumb. Reading it as "no tabs" would have
   * made the switch a no-op on exactly the variants that moved the control,
   * and a knob that does nothing on three settings of a neighbouring knob is
   * a knob nobody can review. So every page un-publishes its page crumb here
   * too, and the trail stops one level short.
   *
   * A page with nothing to show — Funnels, whose folders are rows in the
   * table — ignores this rather than erroring: there is no control to take
   * away. See the note in funnels-page.tsx.
   */
  showViews: boolean;
  /**
   * Whether the collection offers its filter controls (`listShowFilters`).
   *
   * Filters, sort, search and the column/field picker — everything that cuts
   * the collection or finds inside the cut. NOT the renderer switch: board
   * versus table, and Funnels' List versus Recent, draw the SAME rows a
   * different way, so they survive the filters leaving. That distinction is
   * the whole reason the board is interesting here — see opportunities-page,
   * where switching the filters off empties the row above the columns and the
   * renderer toggle is all that is left to rehouse.
   */
  showFilters: boolean;
  /**
   * Whether a labelled filter row exists anywhere on the page.
   *
   * `showFilters && !oneRow` — the filters are on, and L-F has not taken them
   * up onto the tab strip as glyphs. WHERE that row goes is still the page's
   * own answer, because the variants genuinely disagree: Contacts and
   * Workflows let L-B pull the controls into the header's row, Appointments
   * keeps its row under L-B, and L-E drops them into the canvas toolbar with
   * the page's actions. So this says whether there is a row to place, never
   * where — the one part every list agrees on.
   */
  filterRow: boolean;
}

export function useListShape(): ListShape {
  const { effective } = useTheme();
  const variant = effective.listHeaderVariant;
  const mergedRow = variant === "L-B";
  const scopeInTrail = variant === "L-E";
  const showViews = effective.listShowViews;
  const showFilters = effective.listShowFilters;
  /*
   * L-F only merges when there are two bands to merge.
   *
   * The variant's entire claim is that a saved-view row and a filter row are
   * one row's worth of content wearing two rows of chrome, and it pays for
   * that in labels — four controls reduced to glyphs and a 220px search field
   * reduced to a magnifier. With either band switched off there is no second
   * row left to buy back, so the payment buys nothing: L-F with no views
   * would be a 46px band holding a right-aligned glyph cluster and a great
   * deal of empty canvas, and L-F with no filters would be a tab strip made
   * 8px taller for controls that are not there.
   *
   * So each switch collapses L-F onto the arrangement that survives it: with
   * views off it is L-D's labelled filter row, with filters off it is L-D's
   * 38px tab strip. In both cases the page draws what it would have drawn
   * under L-D, which is the honest answer — the variant is a bargain between
   * two rows, and with one row there is no bargain to strike.
   */
  const oneRow = variant === "L-F" && showViews && showFilters;
  return {
    variant,
    mergedRow,
    scopeInTrail,
    oneRow,
    scopeInTabs: !mergedRow && !scopeInTrail && showViews,
    showViews,
    showFilters,
    filterRow: showFilters && !oneRow,
  };
}

/**
 * The saved view as a 34px picker, for the variant where the row carries scope.
 *
 * A tab strip and a dropdown answer the same question at very different
 * heights: seven tabs need their own 38px row, one button needs none. The
 * trade is that a closed menu shows one view instead of seven — which is the
 * whole of what L-B is here to be judged on — so the button states the view
 * AND its size, and the menu is one press away with the counts on every row.
 *
 * Generic over `PageView` rather than over one page's list type, because the
 * four list pages disagree about what a view IS (smart lists, folders, status
 * cuts, agent groupings) and agree completely about what it looks like. That
 * is the same shape ViewBar already takes for the tab strip this replaces, so
 * a page swaps one for the other without re-describing its own views.
 *
 * Hand-rolled like every other menu in this prototype: an absolutely
 * positioned card over a full-screen click-catcher, so the anchor stays in
 * normal flow and the row keeps its height whether the menu is open or shut.
 */
export function ScopePicker({
  views,
  activeId,
  onSelect,
  label,
  showCount,
  onCreate,
  createLabel = "Create view",
}: {
  views: readonly PageView[];
  activeId: string;
  onSelect: (id: string) => void;
  /** Names the set for screen readers: "Smart lists", "Workflow views". */
  label: string;
  /**
   * Follows the page-header count knob — the same number, wherever it lands.
   *
   * The raw knob, not usePageChrome's `count`. That hook makes the count
   * depend on the title, because in slot 05 the count hangs off the title and
   * has nothing to attach to without one. Here it attaches to the picker,
   * which is present — so the dependency does not apply, and the knob keeps
   * doing something on the one variant that has no title.
   */
  showCount: boolean;
  onCreate?: () => void;
  createLabel?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const active = views.find((v) => v.id === activeId) ?? views[0]!;
  const ActiveIcon = active.icon;

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex h-[34px] shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface pr-[10px] pl-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]"
      >
        {ActiveIcon ? (
          <ActiveIcon
            size={15}
            aria-hidden="true"
            className="shrink-0 text-brand"
          />
        ) : null}
        <span className="text-[13px] leading-[normal] font-semibold whitespace-nowrap text-pg-heading">
          {active.label}
        </span>
        {showCount && active.count ? (
          <span className="text-[12.5px] leading-[normal] font-medium tabular-nums whitespace-nowrap text-pg-muted">
            {active.count}
          </span>
        ) : null}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className="shrink-0 text-pg-faint"
        />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label={`Close ${label.toLowerCase()}`}
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label={label}
            className="absolute top-[calc(100%+8px)] left-0 z-40 w-[248px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            {views.map((view) => {
              const on = view.id === activeId;
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={on}
                  onClick={() => {
                    onSelect(view.id);
                    setOpen(false);
                  }}
                  className="motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[8px] text-left hover:bg-pg-bg"
                >
                  {Icon ? (
                    <Icon
                      size={15}
                      aria-hidden="true"
                      className={cn(
                        "shrink-0",
                        on ? "text-brand" : "text-pg-muted",
                      )}
                    />
                  ) : null}
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[13.5px] leading-[18px]",
                      on ? "font-semibold text-pg-heading" : "text-pg-text",
                    )}
                  >
                    {view.label}
                  </span>
                  {view.count ? (
                    <span className="shrink-0 text-[12px] leading-[18px] tabular-nums text-pg-faint">
                      {view.count}
                    </span>
                  ) : null}
                  {on ? (
                    <Check
                      size={14}
                      aria-hidden="true"
                      className="shrink-0 text-brand"
                    />
                  ) : null}
                </button>
              );
            })}

            {/*
              Creating a view is not one of the views, so it sits under a rule
              rather than at the end of the radio group — a menu whose last row
              does something else is how you pick the wrong one.
            */}
            {onCreate ? (
              <>
                <span
                  aria-hidden="true"
                  className="my-[4px] block h-px bg-[var(--pg-border)]"
                />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onCreate();
                    setOpen(false);
                  }}
                  className="motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[8px] text-left text-brand hover:bg-pg-bg"
                >
                  <Plus size={15} aria-hidden="true" className="shrink-0" />
                  <span className="text-[13.5px] leading-[18px] font-medium">
                    {createLabel}
                  </span>
                </button>
              </>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}


/* ── L-F: the controls, once the row has no width left for their labels ──── */

/**
 * A filter control with its label taken away — 34px square, glyph only.
 *
 * This is the whole of what L-F spends. The variant's claim is that the
 * saved-view row and the filter row are one row's worth of content wearing
 * two rows of chrome, and the only way to test that claim honestly is to make
 * the filters fit NEXT to the tabs rather than shrinking the type until they
 * technically do. So the label leaves and the glyph stays, at the same 34px
 * height and the same outline as the OutlineButton it replaces — the control
 * is recognisably the same control, one word lighter.
 *
 * `title` AND `aria-label`, both carrying the label that was removed: the
 * first is the only way a sighted person recovers it, the second is the only
 * way anyone else does. A glyph button with neither is not a compact control,
 * it is a puzzle, and that is a fair thing to hold against L-F — but it
 * should be held against the variant, not against a bug in it.
 */
export function GlyphButton({
  icon: Icon,
  label,
  count,
  onClick,
}: {
  icon: LucideIcon;
  /** The word the row could not afford. Shown on hover, read by AT. */
  label: string;
  /**
   * How many of this control are applied, if any.
   *
   * The one thing a glyph genuinely cannot say. With the word gone, the badge
   * is all that distinguishes "sorted by three fields" from "a sort button" —
   * so it is the one piece of the labelled control that survives the collapse
   * rather than the first thing dropped for room.
   */
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={count ? `${label} (${count} applied)` : label}
      className="motion-tap relative flex size-[34px] shrink-0 items-center justify-center rounded-[8px] bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_3px_0_rgba(15,23,42,0.06)] active:scale-[0.94]"
    >
      <Icon size={16} aria-hidden="true" className="text-pg-text-strong" />
      {count ? (
        /*
         * Hung off the corner rather than sitting inside the button, because
         * the button is now square and a badge in the flow would make it a
         * pill again — which is the labelled control with the label deleted,
         * the one shape L-F must not accidentally draw.
         */
        <span className="absolute -top-[5px] -right-[5px] flex size-[15px] items-center justify-center rounded-full bg-brand text-[10px] leading-none font-semibold tabular-nums text-brand-fg shadow-[0_0_0_2px_var(--pg-bg)]">
          {count}
        </span>
      ) : null}
    </button>
  );
}

/**
 * Search as a magnifier that becomes a field, for the one row that has no
 * room for a field.
 *
 * The field is the thing L-F cannot keep: Filters, Sort and Manage fields give
 * up a word each, and search gives up 220px, which is most of what the variant
 * buys back. Expanding on click rather than on hover — hover-to-expand moves
 * the row's contents under a cursor that was aimed at something else, and on a
 * row this dense that means mis-clicks on the tab next door.
 *
 * It collapses again on blur ONLY when empty. A field that folded away with a
 * query still in it would hide an active filter behind an icon, which is the
 * same failure as a filter chip you cannot see — and this row already asks
 * enough of memory.
 */
export function CollapsingSearch({
  placeholder,
  label,
}: {
  placeholder: string;
  /** e.g. "Search contacts" — the accessible name in both states. */
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <GlyphButton icon={Search} label={label} onClick={() => setOpen(true)} />
    );
  }

  return (
    <div className="flex h-[34px] w-[220px] shrink-0 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
      <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => {
          if (value === "") setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          setValue("");
          setOpen(false);
        }}
        className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
      />
    </div>
  );
}

/**
 * "Unsaved changes ▾" — the saved view has been edited and not written back.
 *
 * Amber, and the only non-grey control on the row. The live product paints it
 * this way and it is right to: everything else in the saved-view row is a
 * navigation, and this one is the only thing that can lose work. Error red was
 * the obvious alternative and is wrong — a dirty list is a state you are meant
 * to sit in while you tune a filter, and a page that shouts at you the whole
 * time you are working is a page you stop reading.
 *
 * Exactly two items, and no more. "Save" — meaning overwrite the list you
 * started from — is deliberately absent, because on `All` there is nothing to
 * overwrite and on a shared list the overwrite is someone else's list. The
 * product's own menu makes the same call.
 *
 * Hand-rolled like every other menu here: an absolutely positioned card over a
 * full-screen click-catcher, so the anchor stays in normal flow and the row
 * keeps its height whether the menu is open or shut.
 */
export function UnsavedChanges({
  onSaveAsNew,
  onDiscard,
}: {
  onSaveAsNew: () => void;
  onDiscard: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="motion-tap flex h-[28px] shrink-0 items-center gap-[6px] rounded-[7px] bg-[var(--pg-warn-bg)] px-[10px] text-[12.5px] leading-none font-semibold whitespace-nowrap text-[var(--pg-warn-fg)] shadow-[inset_0_0_0_1px_var(--pg-warn-border)] hover:brightness-[0.98] active:scale-[0.97]"
      >
        <TriangleAlert
          size={14}
          aria-hidden="true"
          className="shrink-0 text-[var(--pg-warn-icon)]"
        />
        Unsaved changes
        <ChevronDown size={13} aria-hidden="true" className="shrink-0" />
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close unsaved changes"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label="Unsaved changes"
            /*
             * Right-aligned, unlike the scope menus above, because this button
             * is pinned to the row's right edge and a left-aligned card would
             * hang off the canvas. The menus that open from the LEFT end of a
             * row stay left-aligned for the mirror-image reason.
             */
            className="absolute top-[calc(100%+8px)] right-0 z-40 w-[236px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onSaveAsNew();
                setOpen(false);
              }}
              className="motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left text-brand hover:bg-pg-bg"
            >
              <Plus size={15} aria-hidden="true" className="shrink-0" />
              <span className="text-[13.5px] leading-[18px] font-medium">
                Save as new smart list
              </span>
            </button>
            {/*
              Discard is not painted in --pg-danger, though it is the
              destructive one.

              Red here would be the third alarm colour in a 38px row that
              already has an amber button and a brand-blue create link, and
              the thing it would be shouting about is the loss of a filter you
              set thirty seconds ago — recoverable by setting it again. The
              weight it does carry is position: last, under nothing, so a
              cursor aimed at Save cannot land on it.
            */}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onDiscard();
                setOpen(false);
              }}
              className="motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left text-pg-text hover:bg-pg-bg"
            >
              <CircleOff size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
              <span className="text-[13.5px] leading-[18px]">Discard changes</span>
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
