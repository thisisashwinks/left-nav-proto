"use client";

import * as React from "react";
import {
  BookOpen,
  ChevronRight,
  Gauge,
  Hash,
  Mic,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { CaretDown } from "@/components/icons/caret-down";
import { useTheme } from "@/components/theme/theme-provider";
import { usePageCrumb, type PageCrumbSegment } from "@/components/page/page-crumb";
import type { DeepHeaderVariant } from "@/components/page/header-variants";
import { cn } from "@/lib/utils";

/**
 * The L4/L5 furniture the five deep variants are argued over.
 *
 * Why it lives here and not in the catalogue: the chain the Sep 22 research
 * actually filmed someone getting lost in is AI Agents ▸ Voice AI ▸ Dashboard
 * & logs ▸ Inbound, and neither tree carries it. The shipped catalogue stops
 * at Voice AI as a leaf L3; the proposed one gives it two tabs (Dashboard,
 * Agents List) and no fifth level at all. Both files are settled and off
 * limits, and they should stay that way — this is one page's stage furniture
 * for a header review, not a claim about the IA. So the chain is declared
 * here, applied to whichever tree is showing, and the variants get something
 * real to disagree about.
 *
 * The counts are invented but the shape is not: Voice AI in the live app does
 * have a section that is a dashboard AND a log, and that section is split by
 * call direction. That split is the genuine either/or the variants keep
 * arguing about — it is the one level that really is a filter rather than a
 * place, which is why X-6 can leave it as the last tab bar standing while
 * every level above it moves into the trail.
 */

export interface DeepSub {
  id: string;
  label: string;
  /** Pre-formatted, like every other count in this prototype. */
  count?: string;
}

export interface DeepSection {
  id: string;
  label: string;
  icon: LucideIcon;
  count?: string;
  /** The L5 either/or, where this section has one. */
  subs: DeepSub[];
}

export const VOICE_AI_SECTIONS: readonly DeepSection[] = [
  {
    id: "agents",
    label: "Agents",
    icon: Mic,
    count: "6",
    subs: [],
  },
  {
    id: "dashboard-logs",
    label: "Dashboard & logs",
    icon: Gauge,
    count: "1,284",
    subs: [
      { id: "inbound", label: "Inbound", count: "842" },
      { id: "outbound", label: "Outbound", count: "442" },
    ],
  },
  { id: "numbers", label: "Phone numbers", icon: Hash, count: "3", subs: [] },
  { id: "prompts", label: "Prompts", icon: BookOpen, count: "12", subs: [] },
  { id: "settings", label: "Settings", icon: SlidersHorizontal, subs: [] },
];

/**
 * Where every variant opens.
 *
 * All five have to be compared standing on the SAME spot, or the screenshots
 * are measuring the landing place rather than the header. Dashboard & logs ▸
 * Inbound is that spot because it is the one the research recorded.
 */
const DEFAULT_SECTION = "dashboard-logs";

/**
 * The one page this chain belongs to, under either tree.
 *
 * Shipped files Voice AI as an L3 of the AI Agents product; the proposed tree
 * promotes it to a product of its own. Matching on the deepest id the shell
 * knows about covers both without either catalogue being touched.
 */
/*
 * Only `ai-voice` now — the SHIPPED tree's Voice AI, which is the one the
 * research's own path names (AI Agents ▸ Voice AI ▸ Dashboard & logs ▸
 * Inbound). `ia-ai-voice` is left in place but is matched by `REAL_PAGES`
 * first and renders the agent list instead; see the note there for why the two
 * trees deliberately show two different screens under the same product name.
 * It stays listed rather than being deleted so that if the agent list ever
 * moves, this page comes back rather than a bare stage appearing.
 */
const DEEP_PAGE_IDS = new Set(["ai-voice", "ia-ai-voice"]);

export function isDeepPage(productId: string, childId: string | null) {
  return DEEP_PAGE_IDS.has(childId ?? productId);
}

export interface DeepPlace {
  variant: DeepHeaderVariant;
  /**
   * Whether the page-scoped trail owns L4/L5 instead of whatever the variant
   * would have drawn. See the note on `inlineCrumb` inside useDeepPlace.
   */
  inlineCrumb: boolean;
  sections: readonly DeepSection[];
  section: DeepSection;
  sub: DeepSub | null;
  setSection: (id: string) => void;
  setSub: (id: string) => void;
}

/**
 * The deep page's state, plus whatever of it the variant wants in the trail.
 *
 * One hook for both because the two cannot be allowed to disagree: a variant
 * that puts Inbound in the app bar and a page that still thinks Outbound is
 * selected is exactly the bug this whole review is trying to avoid shipping.
 *
 * Called unconditionally, with `active` false on every page that is not the
 * Voice AI chain — a hook cannot be skipped, and publishing null is how a page
 * says it has nothing for the trail.
 */
export function useDeepPlace(active: boolean): DeepPlace {
  const { effective } = useTheme();
  const variant = effective.deepHeaderVariant;
  /*
   * The inline-crumb override, and why it outranks all five variants.
   *
   * `deepInlineCrumb` is not a sixth variant, it is an answer to the question
   * the five are arguing about: however this page would have drawn L4 and L5 —
   * two stacked tab bars, one bar, crumb menus in the app trail, a rail beside
   * the card — when this is on they render as ONE page-scoped trail under the
   * page header, and the bar keeps only the page.
   *
   * It applies across the axis rather than only to the two tab-bar variants,
   * which was the other reading of "L4/L5/L6 stop rendering as stacked tab
   * bars". Scoped that narrowly, what the switch did would depend on which
   * variant you happened to be parked on when you flipped it — and the whole
   * point of this Sep 22 pass is one answer per page kind, not one answer per
   * combination. A knob that means something different on X-3 than on X-2 is
   * the divergence, wearing a checkbox.
   *
   * The bar going quiet is the load-bearing half. X-2 states all four levels
   * up there; drawing the same chain again 60px lower is EXACTLY the failure
   * the research named — a second trail read as a broken continuation of the
   * first. So the page-scoped trail only exists where the bar has stopped at
   * Voice AI, which is why `published` stays null below whenever this is on.
   *
   * X-5 and this therefore look identical, and should: X-5 is the variant that
   * argues for this shape against four others, and the knob is that shape
   * imposed regardless of which argument won.
   */
  const inlineCrumb = effective.deepInlineCrumb;

  const [sectionId, setSectionId] = React.useState(DEFAULT_SECTION);
  const [subId, setSubId] = React.useState<string | null>(null);

  const section =
    VOICE_AI_SECTIONS.find((s) => s.id === sectionId) ?? VOICE_AI_SECTIONS[0]!;
  const sub = section.subs.find((s) => s.id === subId) ?? section.subs[0] ?? null;

  const setSection = React.useCallback((id: string) => {
    setSectionId(id);
    // A new L4 has its own L5s, and carrying the old id across would leave the
    // sub-level resolving to first-child anyway — dropping it says so honestly.
    setSubId(null);
  }, []);

  /*
   * What each variant hands the bar.
   *
   * The trail is the only part of the app header a variant may move, so this
   * is the whole of the difference between X-2, X-6 and X-4 up there — two
   * plain segments, one plain segment, and two switching ones. X-3 and X-5
   * publish nothing: both deliberately stop the bar at Voice AI and answer the
   * depth problem inside the canvas instead, which is the thing being judged.
   */
  const sectionOptions = VOICE_AI_SECTIONS.map((s) => ({
    id: s.id,
    label: s.label,
    icon: s.icon,
    selected: s.id === section.id,
  }));
  const subOptions = section.subs.map((s) => ({
    id: s.id,
    label: s.label,
    selected: s.id === sub?.id,
  }));

  const head: PageCrumbSegment = { label: section.label, icon: section.icon };
  const tail: PageCrumbSegment[] = sub ? [{ label: sub.label }] : [];

  let published = null as null | (PageCrumbSegment & {
    tail?: readonly PageCrumbSegment[];
  });
  if (active && !inlineCrumb) {
    if (variant === "X-2") published = { ...head, tail };
    else if (variant === "X-6") {
      /*
       * Switchable, even though the variant is described by what it MOVES.
       *
       * X-6 takes the L4 strip away, so a plain label there would leave the
       * other four sections with no door anywhere on the screen. A crumb that
       * absorbs a level has to absorb its siblings too — that is the deal the
       * trail makes everywhere else in this shell, and breaking it here would
       * be testing a shape nobody would ship rather than the one we argued.
       */
      published = { ...head, options: sectionOptions, onSelect: setSection };
    } else if (variant === "X-4") {
      published = {
        ...head,
        options: sectionOptions,
        onSelect: setSection,
        tail: sub
          ? [{ label: sub.label, options: subOptions, onSelect: setSubId }]
          : [],
      };
    }
  }
  usePageCrumb(published);

  return {
    variant,
    inlineCrumb,
    sections: VOICE_AI_SECTIONS,
    section,
    sub,
    setSection,
    setSub: setSubId,
  };
}

/* ── the L4 strip ───────────────────────────────────────────────────────── */

/**
 * The same underlined strip ProductPage already draws for catalogue tabs.
 *
 * Copied rather than shared: ProductPage's strip is driven by CatalogueChild
 * and threading a second shape through it would make the generic page carry a
 * special case for one review. When the deep chain earns a place in the tree
 * these two collapse into one; until then the duplication is cheaper than the
 * abstraction.
 */
export function DeepTabs({
  sections,
  activeId,
  onSelect,
}: {
  sections: readonly DeepSection[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Voice AI sections"
      className="-mt-[4px] flex shrink-0 items-center gap-[2px] overflow-x-auto border-b border-[var(--pg-border)]"
    >
      {sections.map((s) => {
        const on = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(s.id)}
            className={cn(
              "motion-tap relative shrink-0 px-[11px] pt-[2px] pb-[9px] text-[13.5px] leading-[18px] whitespace-nowrap",
              on
                ? "font-semibold text-pg-heading"
                : "font-medium text-pg-muted hover:text-pg-text",
            )}
          >
            {s.label}
            <span
              aria-hidden="true"
              className={cn(
                "motion-move absolute inset-x-[6px] -bottom-[1px] h-[2px] rounded-full",
                on ? "bg-brand" : "bg-transparent",
              )}
            />
          </button>
        );
      })}
    </div>
  );
}

/** The quieter L5 row — pills, the way the sub-tab level already reads. */
export function DeepSubTabs({
  subs,
  activeId,
  onSelect,
  label,
}: {
  subs: readonly DeepSub[];
  activeId: string | null;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="-mt-[6px] flex shrink-0 items-center gap-[6px] overflow-x-auto"
    >
      {subs.map((s) => {
        const on = s.id === activeId;
        return (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(s.id)}
            className={cn(
              "motion-tap shrink-0 rounded-[7px] px-[10px] py-[4px] text-[12.5px] leading-[17px] whitespace-nowrap",
              on
                ? "bg-pg-surface font-semibold text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]"
                : "font-medium text-pg-muted hover:bg-pg-surface hover:text-pg-text",
            )}
          >
            {s.label}
            {s.count ? (
              <span
                className={cn(
                  "ml-[6px] text-[11.5px] tabular-nums",
                  on ? "text-brand" : "text-pg-faint",
                )}
              >
                {s.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ── X-3: the side rail ─────────────────────────────────────────────────── */

/**
 * The L4/L5 levels as a column inside the content, not as page chrome.
 *
 * The claim X-3 is making: depth costs nothing vertically if it runs the other
 * way. A rail is also the only one of the five shapes with room for counts
 * beside every sibling, not just the open one — which is most of the reason
 * someone opens a logs section in the first place.
 *
 * It is drawn as part of the canvas, on the plane beside the card, so it reads
 * as belonging to the content rather than to the header. That is the whole
 * distinction under test, so it has to survive the screenshot.
 */
export function DeepRail({
  sections,
  section,
  sub,
  onSection,
  onSub,
}: {
  sections: readonly DeepSection[];
  section: DeepSection;
  sub: DeepSub | null;
  onSection: (id: string) => void;
  onSub: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Voice AI sections"
      className="flex w-[224px] shrink-0 flex-col gap-[2px] overflow-y-auto pr-[14px]"
    >
      {sections.map((s) => {
        const on = s.id === section.id;
        return (
          <React.Fragment key={s.id}>
            <button
              type="button"
              aria-current={on ? "page" : undefined}
              onClick={() => onSection(s.id)}
              className={cn(
                "motion-tap flex h-[30px] shrink-0 items-center gap-[8px] rounded-[7px] px-[9px] text-left text-[13px] leading-none",
                on
                  ? "bg-pg-surface font-semibold text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]"
                  : "font-medium text-pg-muted hover:bg-pg-surface hover:text-pg-text",
              )}
            >
              <s.icon
                size={14}
                aria-hidden="true"
                className={cn("shrink-0", on ? "text-brand" : "text-pg-faint")}
              />
              <span className="min-w-0 flex-1 truncate">{s.label}</span>
              {s.count ? (
                <span className="shrink-0 text-[11.5px] tabular-nums text-pg-faint">
                  {s.count}
                </span>
              ) : null}
            </button>

            {/*
              The L5s only under the open L4. Every sibling's count is already
              on the row above, so showing all of them at once would be a
              second tree rather than a rail.
            */}
            {on && s.subs.length > 0
              ? s.subs.map((child) => {
                  const lit = child.id === sub?.id;
                  return (
                    <button
                      key={child.id}
                      type="button"
                      aria-current={lit ? "page" : undefined}
                      onClick={() => onSub(child.id)}
                      className={cn(
                        "motion-tap ml-[18px] flex h-[26px] shrink-0 items-center gap-[8px] rounded-[7px] px-[9px] text-left text-[12.5px] leading-none",
                        lit
                          ? "font-semibold text-brand"
                          : "font-medium text-pg-muted hover:text-pg-text",
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-[5px] shrink-0 rounded-full",
                          lit ? "bg-brand" : "bg-pg-border-strong",
                        )}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {child.label}
                      </span>
                      {child.count ? (
                        <span className="shrink-0 text-[11px] tabular-nums text-pg-faint">
                          {child.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })
              : null}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/* ── X-5: the second, page-scoped trail ─────────────────────────────────── */

/**
 * A trail that is deliberately NOT the app bar's trail.
 *
 * X-5's whole risk is that two trails on one screen read as one chain with a
 * hole in it, and the only way to judge that risk is to build the version that
 * tries hardest not to: page tokens instead of header tokens, a surface the
 * bar never has, segments that are visibly buttons, a smaller size (12.5px
 * against the bar's 13), and a leading label that names whose path this is. If
 * it still reads as a broken continuation of the bar after all that, the
 * variant has answered its own question.
 *
 * Two callers since Sep 22: X-5, which argues for this shape against the other
 * four, and `deepInlineCrumb`, which imposes it whichever variant is picked.
 * One component rather than two so the knob cannot quietly end up being judged
 * on a different row than the variant was.
 */
export function DeepPageTrail({
  section,
  sub,
  sections,
  onSection,
  onSub,
}: {
  section: DeepSection;
  sub: DeepSub | null;
  sections: readonly DeepSection[];
  onSection: (id: string) => void;
  onSub: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Voice AI path"
      className="-mt-[2px] flex h-[32px] shrink-0 items-center gap-[4px] self-start rounded-[9px] bg-pg-surface px-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      <span className="shrink-0 pr-[2px] text-[11px] leading-none font-semibold tracking-[0.4px] text-pg-faint uppercase">
        In Voice AI
      </span>
      <PathSegment
        label={section.label}
        options={sections.map((s) => ({ id: s.id, label: s.label }))}
        activeId={section.id}
        onSelect={onSection}
      />
      {sub ? (
        <>
          <ChevronRight
            size={12}
            aria-hidden="true"
            className="shrink-0 text-pg-faint"
          />
          <PathSegment
            label={sub.label}
            options={section.subs.map((s) => ({ id: s.id, label: s.label }))}
            activeId={sub.id}
            onSelect={onSub}
          />
        </>
      ) : null}
    </nav>
  );
}

/**
 * One switchable segment of the page trail.
 *
 * Hand-rolled over an absolute card and a full-screen click-catcher, which is
 * what every other menu in this prototype is — the row keeps its height open
 * or shut, and the anchor never leaves normal flow.
 */
function PathSegment({
  label,
  options,
  activeId,
  onSelect,
}: {
  label: string;
  options: { id: string; label: string }[];
  activeId: string;
  onSelect: (id: string) => void;
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
        className={cn(
          "motion-tap flex items-center gap-[3px] rounded-[6px] px-[6px] py-[3px] text-[12.5px] leading-none font-medium text-pg-text hover:bg-pg-bg",
          open && "bg-pg-bg",
        )}
      >
        {label}
        <CaretDown
          size={10}
          className={cn(
            "shrink-0 text-pg-faint motion-move",
            open ? "rotate-180" : "",
          )}
        />
      </button>

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
            aria-label={`Switch ${label}`}
            className="absolute top-[calc(100%+6px)] left-0 z-40 w-[200px] rounded-[10px] bg-pg-surface p-[5px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="menuitemradio"
                aria-checked={o.id === activeId}
                onClick={() => {
                  onSelect(o.id);
                  setOpen(false);
                }}
                className={cn(
                  "motion-tap flex w-full items-center rounded-[7px] px-[9px] py-[7px] text-left text-[12.5px] leading-[18px] hover:bg-pg-bg",
                  o.id === activeId
                    ? "font-semibold text-pg-heading"
                    : "font-medium text-pg-muted",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
