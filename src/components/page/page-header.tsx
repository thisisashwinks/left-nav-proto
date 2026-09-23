"use client";

import * as React from "react";
import { usePageHeading } from "@/components/page/page-heading";
import { EllipsisVertical, type LucideIcon } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * One entry in the page's action zone.
 *
 * The same shape whether it ends up as a button or a row in the overflow, so
 * the ladder below can move an action between the two without the page that
 * declared it knowing which side it landed on.
 */
export interface PageAction {
  label: string;
  icon?: LucideIcon;
  onClick?: () => void;
  /** Painted in --pg-danger and sorted last, per the fixed action order. */
  danger?: boolean;
}

/** Outlined 34px button — the secondary rung: Import, Filters, Sort, Columns. */
export function OutlineButton({
  children,
  className,
  ...rest
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-surface px-[14px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]",
        "motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_1px_3px_0_rgba(15,23,42,0.06)] active:scale-[0.97]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Filled 34px button — the one default action a page is allowed to have. */
export function PrimaryButton({
  children,
  className,
  ...rest
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-brand px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-brand-fg",
        "motion-tap hover:brightness-110 hover:shadow-[0_2px_10px_0_rgba(21,94,239,0.35)] active:scale-[0.97]",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * The kebab, and the menu the ladder spills into.
 *
 * Hand-rolled rather than the shadcn primitive, because every other menu in
 * this prototype is — an absolutely positioned card over a full-screen
 * click-catcher, so the anchor stays in normal flow and the header keeps its
 * height whether the menu is open or shut.
 *
 * Exported since Sep 22: the board variants can move a page's actions off the
 * header and into a toolbar inside the canvas, and the settings and export
 * items have to travel with them. A second hand-rolled kebab in the
 * opportunities page would be the third menu in this prototype that looks
 * almost like this one — so the header lends this one out rather than being
 * the only place allowed to own it.
 */
export function OverflowMenu({ items }: { items: PageAction[] }) {
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
      <OutlineButton
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-[34px] justify-center px-0"
      >
        <EllipsisVertical
          size={16}
          aria-hidden="true"
          className="text-pg-text-strong"
        />
      </OutlineButton>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label="More actions"
            className="absolute top-[calc(100%+8px)] right-0 z-40 w-[232px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  item.onClick?.();
                  setOpen(false);
                }}
                className={cn(
                  "motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left hover:bg-pg-bg",
                  item.danger ? "text-pg-danger" : "text-pg-text",
                )}
              >
                {item.icon ? (
                  <item.icon
                    size={15}
                    aria-hidden="true"
                    className={cn(
                      "shrink-0",
                      item.danger ? "text-pg-danger" : "text-pg-muted",
                    )}
                  />
                ) : null}
                <span className="text-[13.5px] leading-[18px]">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export interface PageHeaderProps {
  /**
   * A plain heading, not a navigator.
   *
   * The breadcrumb grew cascading menus and took switching with it, so two
   * surfaces no longer offer the same move. The title's only job is to name
   * where you are — which also means it can never disagree with the trail.
   */
  title: string;
  /** Sits beside the title, because the count is a property of the collection. */
  count?: string;
  /** A status pill for record pages, rendered after the count. */
  status?: React.ReactNode;
  /** One line under the title. Optional: a list of six views does not need one. */
  description?: string;
  /** The single default action. Filled, and always rightmost. */
  primary?: PageAction;
  /** Outlined actions, shown inline until the ladder runs out of room. */
  secondary?: PageAction[];
  /** Always in the kebab, whatever the count — settings, destructive items. */
  overflow?: PageAction[];
  /** Anything the page needs left of the buttons, e.g. a record pager. */
  aside?: React.ReactNode;
  /**
   * The page's own controls, on the header's row rather than under it.
   *
   * For the merged variants (L-B and its siblings), where the row stops
   * repeating the trail's last crumb and carries scope and filters instead.
   * It sits where the title would be and takes the free width, so the row
   * still starts at the canvas inset and the actions keep the right edge —
   * one row doing two jobs, not a header with a toolbar bolted to it.
   */
  lead?: React.ReactNode;
  /**
   * Who decides whether this header draws at all.
   *
   * "axis" — the default, and what every collection page uses: the theme's
   * page-header knobs decide, so a titleless app is titleless everywhere.
   *
   * "own" — the page already asked the question itself and got an answer, so
   * the global axis must not veto it. Exactly one page needs this and the
   * reason is worth writing down: a record's header is switched by its own
   * variant (D-A), but picking ANY variant whose chrome is `noHeader` writes
   * `pageHeader: false` across the whole theme (see setHeaderVariant) — and
   * both the other record shapes and one of the LIST shapes are among them. So
   * the record's own answer was being silently overruled by a picker sitting a
   * few rows away in the same panel: you turned the header on, nothing
   * happened, and nothing in the UI said why. Ashwin hit that on Sep 23, when
   * the switch was still the `recordPageHeader` checkbox.
   *
   * The fix is not to stop the variant writing the knobs — that coupling is
   * what keeps the picker and the knobs from disagreeing — but to let a page
   * that owns a dedicated switch say so. "own" is therefore narrow on purpose:
   * it means "my switch IS the answer", not "ignore the theme".
   */
  chrome?: "axis" | "own";
}

/**
 * Slot 05 of the page anatomy: title, count, description, action zone.
 *
 * Every page in the four Phase 2 products fills this in rather than drawing
 * its own — the header is the thing that diverged worst across the shipped
 * product, and a component with no prop for "a gear button here" is the only
 * reliable way for it to stop diverging.
 */
/**
 * What a page is allowed to draw of its own header.
 *
 * Exported because slot 05 is not the only place a page names itself: the
 * settings pages, the product stage and the sub-account record each write
 * their own heading, and the axis is about the DUPLICATE — the trail already
 * naming the page — not about this component. One hook, so a page cannot
 * half-obey it.
 *
 * The dependency is resolved here rather than in the panel: the description
 * explains the title and the count counts what the title names, so with no
 * title neither has anything to attach to. Turning the title off takes them
 * with it, and turning it back on restores whatever they were set to — the
 * knobs keep their own value instead of being rewritten behind the user.
 */
export function usePageChrome() {
  const { effective } = useTheme();
  const title = effective.pageHeader && effective.pageTitle;
  return {
    /** The whole of slot 05 — off means the page draws no header at all. */
    header: effective.pageHeader,
    title,
    description: title && effective.pageDescription,
    count: title && effective.pageCount,
  };
}

/** The common case: does this page write its own heading? */
export function usePageTitleShown() {
  return usePageChrome().title;
}

export function PageHeader({
  title,
  count,
  status,
  description,
  primary,
  secondary = [],
  overflow = [],
  aside,
  lead,
  chrome: chromeMode = "axis",
}: PageHeaderProps) {
  /*
   * The overflow ladder, borrowed from Cloudscape.
   *
   * Under five actions they all get a button; past that everything but the
   * default collapses, so a page can grow a seventh action without the header
   * silently becoming a toolbar. Declared overflow is always in the menu, and
   * danger items sort last so the destructive one never moves under a cursor
   * aimed at something else.
   */
  const budget = primary ? 3 : 4;
  const inline = secondary.length > budget ? [] : secondary;
  const collapsed = secondary.length > budget ? secondary : [];
  const menu = [...collapsed, ...overflow].sort(
    (a, b) => Number(a.danger ?? false) - Number(b.danger ?? false),
  );

  /*
   * Titleless is a whole-app choice, not a per-page one.
   *
   * A page cannot be allowed to decide it is the one that skips the heading —
   * that is how two pages end up looking like two products. The knob lives in
   * the theme, every header reads it, and what survives without the title is
   * the part the trail cannot say: the count, the status and the actions.
   */
  const axis = usePageChrome();
  const { effective } = useTheme();
  /*
   * The heading goes UP instead of being drawn here.
   *
   * Both halves of the condition matter. `barPageHeading` is the ask; the
   * `!crumbShown` half is what keeps the bar honest — with a trail standing,
   * a title beside it is the duplicate the whole Sep 22 research was about,
   * and the one arrangement nobody argued for. So the move is only available
   * in the state that created room for it, and flipping the trail back on
   * hands the heading back to the page rather than stacking the two.
   *
   * Published unconditionally rather than only when the move is on, so the
   * bar has the heading the instant someone flips the switch. A publish is
   * three strings into a context; gating it would trade nothing for a frame
   * of empty bar on every toggle.
   */
  const headingInBar = !effective.crumbShown && effective.barPageHeading;
  usePageHeading(
    chromeMode === "own" || !axis.header
      ? null
      : { title, count, description },
  );
  // A page that owns its own switch has already answered all four questions by
  // deciding to render at all, and by which props it passed: an empty `title`
  // means no title, an absent `description` means no description. Consulting
  // the axis on top of that would be asking twice and taking the stricter
  // answer, which is precisely the bug this mode exists to fix.
  /*
   * The lift folds into `chrome` rather than into the JSX.
   *
   * The first cut tested `!liftHeading` beside the title and left the count
   * and the description on their own `chrome.*` flags, so the bar drew the
   * whole heading while the page went on drawing the count pill and the
   * sentence under it — the exact duplication the move exists to remove, and
   * caught only because it was on screen. Three strings, one decision: every
   * part of the heading leaves together or none does.
   */
  const liftHeading = headingInBar && chromeMode !== "own";
  const chrome =
    chromeMode === "own"
      ? { header: true, title: title !== "", description: true, count: true }
      : liftHeading
        ? { ...axis, title: false, description: false, count: false }
        : axis;
  /*
   * `liftHeading` is computed below the early return, so the flag the render
   * reads is folded in here rather than being a second condition sprinkled
   * through the JSX: one name, one place it can be wrong.
   */
  const showTitle = chrome.title;

  // Nothing at all: the trail names the page and the control bar does the
  // work. The actions go with it, which is the point of the setting.
  //
  // Note this is NOT the lifted case: a heading that moved into the bar leaves
  // the row standing, because the actions are the page's rather than the
  // heading's and a page that lost its primary button because its title moved
  // would be a different, worse option than the one asked for.
  if (!chrome.header) return null;


  return (
    <div
      className={cn(
        // justify-between in BOTH states: without the title the left side is
        // empty or a lone count, and the actions still belong on the right
        // edge — they are the page's actions either way, and moving them
        // would make the two settings read as two different headers.
        "flex shrink-0 justify-between gap-[16px]",
        // min-h rather than h on the titleless branch: 34px is the floor the
        // actions need, not a ceiling the row must hold to. Opportunities puts
        // its own heading inside `lead` (its title has to stand LEFT of the
        // pipeline picker, and `lead` renders before the h1), so on that page
        // the titleless row carries two lines and a fixed 34px clipped the
        // description. Every existing titleless row is under 34px and is
        // unmoved by this.
        showTitle ? "items-start" : "min-h-[34px] items-center",
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-col items-start gap-[3px]",
          // The lead owns the free width; without one the column is only as
          // wide as the heading, which is what keeps justify-between putting
          // the actions on the right edge.
          lead && "flex-1",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center",
            lead ? "w-full gap-[10px]" : "gap-[8px]",
          )}
        >
          {lead}
          {showTitle ? (
            <h1 className="truncate text-[20px] leading-[normal] font-semibold tracking-[-0.2px] text-pg-heading">
              {title}
            </h1>
          ) : null}
          {count && chrome.count ? (
            <span className="shrink-0 rounded-[6px] bg-pg-bg px-[8px] py-[2px] text-[12.5px] leading-[18px] font-medium whitespace-nowrap text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
              {count}
            </span>
          ) : null}
          {status}
        </div>
        {description && chrome.description ? (
          <p className="truncate text-[13px] leading-[normal] text-pg-muted">
            {description}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-[10px]">
        {aside}
        {inline.map((action) => (
          <OutlineButton key={action.label} onClick={action.onClick}>
            {action.icon ? (
              <action.icon
                size={15}
                aria-hidden="true"
                className="text-pg-text-strong"
              />
            ) : null}
            {action.label}
          </OutlineButton>
        ))}
        {primary ? (
          <PrimaryButton onClick={primary.onClick}>
            {primary.icon ? (
              <primary.icon size={16} aria-hidden="true" />
            ) : null}
            {primary.label}
          </PrimaryButton>
        ) : null}
        {menu.length > 0 ? <OverflowMenu items={menu} /> : null}
      </div>
    </div>
  );
}
