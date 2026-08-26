"use client";

import type { LucideIcon } from "lucide-react";
import {
  Check,
  Eye,
  LayoutTemplate,
  Palette,
  Search,
  SquarePen,
  TriangleAlert,
} from "lucide-react";
import { AiMark } from "@/components/ai/ai-mark";
import { NavIntroCard } from "./nav-intro-card";
import type { AiSession } from "@/components/ai/use-ai-session";
import { Kbd } from "@/components/search/kbd";
import { cn } from "@/lib/utils";
import { RailTooltip } from "./rail-tooltip";
import { useTheme } from "@/components/theme/theme-provider";
import { NAV_GENERATIONS, NAV_GENERATION_LABELS } from "@/design/theme";

/**
 * Search and Ask AI together, directly under the logo.
 *
 * The review's open question: should Ask AI be the very first thing a user meets
 * on entry, above Favorites, rather than holding the nav's bottom edge? And
 * separately — should search come down out of the logo row and sit next to it?
 * This answers both at once, because the two only make sense together: search in
 * the header and AI at the bottom are the *same* job at opposite ends of the nav,
 * which is exactly the overlap the review flagged.
 *
 * They stay two controls rather than one merged input. Merging is the long-term
 * direction, but a single field that is sometimes a filter and sometimes a
 * conversation is a bigger question than placement, and answering both at once
 * would make the placement test unreadable.
 */

/** 36px row plus 12px below it. The nav's absolute geometry needs this exact. */
export const ENTRY_CLUSTER_HEIGHT = 48;

/**
 * What the rail's cluster adds over the single 38px search button it replaces:
 * the capsule is 3 + 38 + 2 + 38 + 3 = 84px tall, plus 8px of clearance below
 * so the orb never sits directly against the favourites capsule.
 */
export const ENTRY_CLUSTER_RAIL_HEIGHT = 84 + 8 - 38;

export function EntryCluster({
  onSearch,
  session,
  edit,
}: {
  onSearch: () => void;
  session: AiSession;
  edit?: EditNavProps;
}) {
  return (
    // 22px under the pill, not 12: hugging the nav's foot read as an
    // afterthought — the lift gives the entry the margin a primary control
    // deserves (Aug 13 ask).
    <div className="flex w-full shrink-0 px-[12px] pb-[22px]">
      <EntryPill onSearch={onSearch} session={session} {...(edit ? { edit } : {})} />
    </div>
  );
}

/** What the nav's edit control offers. Absent for roles that may not restructure. */
export interface EditNavProps {
  editing: boolean;
  /** Opens the session. */
  onStart: () => void;
  /** Closes it, keeping everything. */
  onSave: () => void;
  /** Closes it, putting the nav back — via a confirmation when it would lose work. */
  onDiscard: () => void;
  /** Whether anything has changed, which is what makes Save worth pressing. */
  dirty: boolean;
  /** Opens the colour controls, anchored on the button that asked. */
  onOpenAppearance: (trigger: HTMLElement) => void;
  /** Opens saved groupings — save this one, or apply another. */
  onOpenTemplates?: (trigger: HTMLElement) => void;
  /** First run: the card announcing the mode has not been dismissed yet. */
  showIntro?: boolean;
  onDismissIntro?: () => void;
  /**
   * How many categories are still empty.
   *
   * An empty category is a heading over nothing: it opens a panel with no rows
   * in it, and it tells the account it owns something it does not. So it is a
   * legal state to be IN while building — you make the shelf, then you fill it —
   * and an illegal state to leave behind, which is why the count blocks saving
   * rather than blocking the edit that created it.
   */
  blocked: number;
  /**
   * Opens the show/hide menu for the nav's non-tree blocks.
   *
   * On the mode's own control rather than on a row, because Recent, Quick Actions
   * and the favourites dock are not rows in the tree — they are conveniences over
   * it, and switching one off is a different kind of decision from moving a
   * product.
   */
  onOpenBlocks: (trigger: HTMLElement) => void;
}

/**
 * The way into editing the nav, hung above the pill.
 *
 * Absolutely positioned rather than a row of its own, which is what lets it
 * appear on hover without the nav's geometry moving: the entry cluster's height
 * is load-bearing — the floating favourites capsule is placed against it — and a
 * control that reflowed the nav every time the pointer entered it would shift
 * the capsule and every row under it.
 *
 * Hidden until the nav is hovered, and then only for admins. Editing is rare and
 * consequential, and a pencil sitting permanently over the search field would
 * make the nav read as a thing you maintain rather than a thing you use. Once
 * editing it stays put and becomes the way out, because a mode you can only
 * leave by finding the control that started it is a trap.
 */
function EditNavButton({
  revealed = false,
  editing,
  onStart,
  onSave,
  onDiscard,
  dirty,
  blocked,
  onOpenBlocks,
  onOpenAppearance,
  onOpenTemplates,
  showIntro = false,
  onDismissIntro,
}: EditNavProps & { revealed?: boolean }) {
  if (!editing && showIntro && onDismissIntro) {
    return (
      <>
        <NavIntroCard
          onDismiss={onDismissIntro}
          onStartEditing={() => {
            onDismissIntro();
            onStart();
          }}
        />
        <EditNavButton
          editing={editing}
          dirty={dirty}
          blocked={blocked}
          onStart={onStart}
          onSave={onSave}
          onDiscard={onDiscard}
          onOpenBlocks={onOpenBlocks}
          onOpenAppearance={onOpenAppearance}
          {...(onOpenTemplates ? { onOpenTemplates } : {})}
          revealed
        />
      </>
    );
  }

  if (editing) {
    const blockedNote =
      blocked === 1
        ? "1 category is empty — put something in it first"
        : `${blocked} categories are empty — put something in them first`;
    /*
     * Two controls while editing, because the session has two endings.
     *
     * A single "Done" is fine when every edit is its own undoable step, but
     * restructuring is a rename, three drags and a deletion — and the toast only
     * ever holds the last of them. Discard is the way out of the whole session,
     * so it has to be as visible as the way to keep it.
     */
    return (
      /*
       * Two rows, not one.
       *
       * Four things — the mode, what the nav shows, and the two ways out — do not
       * fit across 272px, and the one that gave way was the label saying which
       * mode you are in. So the card states the mode and what is showing on the
       * top line, and keeps the bottom line for the two decisions that end the
       * session. A card rather than a pill, because a pill two rows tall is just a
       * card with the wrong corners.
       *
       * Absolutely positioned, so none of it can move a row.
       */
      <div className="absolute -top-[74px] right-0 left-0 z-20 flex flex-col gap-[6px] rounded-[10px] bg-nav p-[8px] shadow-[0_4px_12px_0_var(--fly-shadow),inset_0_0_0_1px_var(--nav-border,var(--nav-divider))]">
        {/*
          The tools get the top line to themselves.
          
          They used to share it with the mode label, which worked at two and
          broke at three: Templates ran off the card's right edge, clipped
          mid-word. Three named controls need the full 256px, so the label moved
          down beside the two exits — where it still says which mode you are in,
          next to the buttons that end it.
        */}
        <div className="flex items-center gap-[6px]">
          <span
            role="status"
            // Neutral ink, not brand (Aug 21 review): the mode label is chrome,
            // and brand here competed with semantic states and the AI's own hue.
            className="flex min-w-0 flex-1 items-center gap-[5px] truncate text-[11.5px] leading-[15px] font-semibold whitespace-nowrap text-nav-fg"
          >
            <SquarePen size={11} aria-hidden="true" className="shrink-0" />
            Editing nav
          </span>
          {/*
            A named control, not a bare eye.

            What it opens is a list of the four blocks the nav can show —
            Launchpad, Recent, Quick Actions, Favourites — and an unlabelled glyph
            beside "Discard" read as a third exit rather than as a menu about
            contents. "Show / hide" rather than "What shows": the label has to name
            the ACTION, since the thing being shown or hidden is whatever you pick
            in the menu, and a control named after its subject reads as a status.
          */}
          <EditTool
            label="Show or hide parts of the nav"
            short="Show / hide"
            icon={Eye}
            onOpen={onOpenBlocks}
          />
          {/*
            Beside Show / hide, because they are the same kind of decision:
            what the nav contains, and what it looks like. Both are the
            account's own, and both are only reachable while editing it.
          */}
          <EditTool
            label="Change the navigation's colours"
            short="Colours"
            icon={Palette}
            onOpen={onOpenAppearance}
          />
          {onOpenTemplates ? (
            <EditTool
              label="Save or apply a grouping template"
              short="Templates"
              icon={LayoutTemplate}
              onOpen={onOpenTemplates}
            />
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-[6px]">
          {/*
            The comparison, on the row with the exits rather than up with the
            tools.

            The tools row is already full — its own comment records Templates
            being clipped mid-word at three controls — and this is not a tool
            anyway: Show / hide, Colours and Templates all edit the nav you are
            in, where this one replaces it wholesale with production's. It
            belongs beside the buttons that end the session, because choosing the
            old nav ends it too.
          */}
          <GenerationToggle />
          <span className="flex shrink-0 items-center gap-[6px]">
          <button
            type="button"
            onClick={onDiscard}
            className="motion-tap flex h-[26px] shrink-0 items-center rounded-[7px] px-[10px] text-[12px] leading-none font-medium text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg active:scale-95"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={blocked > 0}
            // The reason lives on the control that is refusing, because the rows
            // it is refusing over may be scrolled out of sight. They carry the
            // amber ring; this says how many and why.
            title={blocked > 0 ? blockedNote : undefined}
            className={cn(
              "motion-tap flex h-[26px] shrink-0 items-center gap-[5px] rounded-[7px] px-[10px] text-[12px] leading-none font-medium",
              blocked > 0
                ? "cursor-not-allowed text-nav-fg-subtle shadow-[inset_0_0_0_1px_var(--hr-warning-300)]"
                : // Inverted ink rather than brand — still unmistakably the
                  // primary action, without borrowing the accent (Aug 21).
                  "bg-nav-fg text-nav hover:opacity-90 active:scale-95",
            )}
          >
            {blocked > 0 ? (
              <TriangleAlert
                size={13}
                aria-hidden="true"
                className="text-[var(--hr-warning-500)]"
              />
            ) : (
              <Check size={13} aria-hidden="true" />
            )}
            {/* With two rows there is room to say it properly again. An admin who
                opened the mode to look around is not told they are saving. */}
            {blocked > 0
              ? "Empty category"
              : dirty
                ? "Save changes"
                : "Done"}
          </button>
          </span>
        </div>
      </div>
    );
  }

  /*
   * A circle until hovered, then a pill that says what it does.
   *
   * A pencil on its own is not self-explanatory — it could mean "rename this
   * account" as easily as "restructure the nav" — but a permanent label sitting
   * over the search field would make the nav look like something you administer.
   * Growing on hover is the compromise: it costs nothing until you look at it,
   * and because the control is absolutely positioned the growth cannot move the
   * rows below it.
   *
   * It grows to a FIXED width rather than to `auto`, because auto does not
   * animate — the label would snap out at full width and the whole gesture would
   * read as a glitch rather than as the control opening. The label's own fade is
   * held back a beat so the box leads and the text follows it out, which is what
   * makes 300ms feel deliberate instead of slow.
   */
  return (
    <button
      type="button"
      aria-label="Edit navigation"
      onClick={onStart}
      data-revealed={revealed ? "" : undefined}
      className={cn(
        "group/edit absolute -top-[34px] right-0 z-20 flex h-[26px] items-center overflow-hidden rounded-full",
        // Square while it is a glyph: 26 by 26, the icon dead centre.
        "w-[26px] justify-center gap-0 px-0",
        /*
         * Held open while the first-run card is pointing at it.
         *
         * The card explains a control that is a 26px circle at rest and only
         * names itself on hover — so pointing at it while it is still an
         * anonymous dot asks the reader to take the introduction on trust. Held
         * open, the thing being described is legible at the moment it is
         * described, and it closes to its resting state when the card goes.
         */
        /*
         * The `data-revealed:` variant, not plain classes.
         *
         * `opacity-0` and `opacity-100` are both single classes, so which one
         * won came down to stylesheet order rather than intent — the button
         * duly expanded to 92px and stayed completely invisible. An attribute
         * selector outranks a class, so the held-open state actually holds.
         */
        "data-revealed:w-[92px] data-revealed:justify-start data-revealed:gap-[6px]",
        "data-revealed:bg-nav-hover data-revealed:pl-[7px] data-revealed:opacity-100",
        // A hairline the same colour as the row dividers was invisible against the
        // nav's own surface. The stronger ring and the row-level ink are what make
        // a white circle on a white nav read as a control.
        "bg-nav text-nav-fg shadow-[0_2px_8px_0_var(--fly-shadow),inset_0_0_0_1px_var(--nav-border,var(--nav-divider))]",
        "transition-[width,gap,padding,opacity,color,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
        "hover:w-[92px] hover:justify-start hover:gap-[6px] hover:pl-[7px] hover:bg-nav-hover",
        "focus-visible:w-[92px] focus-visible:justify-start focus-visible:gap-[6px] focus-visible:pl-[7px]",
        "active:scale-95",
        // Focus-visible as well as hover, so the control is reachable from the
        // keyboard by something other than luck.
        "opacity-0 group-hover/nav:opacity-100 focus-visible:opacity-100",
      )}
    >
      <SquarePen size={13} aria-hidden="true" className="shrink-0" />
      {/*
        Zero-width until hovered, or the icon is pushed out of the circle.

        The label is `whitespace-nowrap`, so as a flex item it claims its natural
        52px — inside a 26px box with `justify-center` that overflows equally on
        both sides, pushing the glyph past the left edge and clipping it. Which is
        why the button looked empty: the pencil was outside it. Collapsing the
        span is what keeps the icon centred; the button's own width animates the
        growth, and the text fades in a beat later so it arrives inside a box
        that is already open.
      */}
      <span
        aria-hidden="true"
        className="w-0 overflow-hidden text-[12px] leading-none font-medium whitespace-nowrap opacity-0 transition-opacity duration-[var(--dur-base)] ease-[var(--ease-out)] group-hover/edit:w-auto group-hover/edit:opacity-100 group-hover/edit:delay-[90ms] group-focus-visible/edit:w-auto group-focus-visible/edit:opacity-100 group-data-revealed/edit:w-auto group-data-revealed/edit:opacity-100"
      >
        Edit nav
      </span>
    </button>
  );
}

/**
 * The pill itself, placement-free.
 *
 * Both arrangements now show the same merged control — the review landed on the
 * pill being the answer regardless of edge, so top vs bottom is purely a
 * placement question and the two variants must not drift apart visually. The
 * caller owns padding: the top cluster wraps it, the nav footer lays it beside
 * the drawer toggle.
 */
/**
 * One tool in the editing card's top row.
 *
 * The glyph carries it, with the name in a tooltip and on the accessible name.
 * That reverses the Aug 21 "a named control, not a bare eye" call, and the
 * reason it can: that argument was about a lone eye sitting BESIDE Discard,
 * where an unlabelled glyph read as a third way out. Three same-sized glyphs on
 * a row of their own read as a toolbar instead.
 *
 * The forcing function was width. Three labelled controls measured 248px inside
 * a 232px row, so "Templates" clipped mid-word — and that is in English, which
 * is the shortest this copy will ever be. A label that only fits in one
 * language is not a label.
 */
function EditTool({
  label,
  short,
  icon: Icon,
  onOpen,
}: {
  label: string;
  /** The tooltip. Shorter than the accessible name, which says the action. */
  short: string;
  icon: LucideIcon;
  onOpen: (trigger: HTMLElement) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={short}
      onClick={(e) => onOpen(e.currentTarget)}
      className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95"
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

/**
 * New nav / Old nav, as a two-state segmented control.
 *
 * A segmented pair rather than a switch: a switch needs a label saying what it
 * switches, and "Old nav" as a caption beside a toggle reads as though something
 * is being turned off. Two named segments say what both answers are and which
 * one you are looking at, in the same width.
 *
 * Reads the theme directly instead of taking props. The generation is a
 * platform-wide review axis living in ThemeState, so threading it down through
 * LeftNav's props to reach the one card that sets it would add a parameter to
 * two components that have no other use for it.
 */
function GenerationToggle() {
  const { navGeneration, setNavGeneration } = useTheme();

  return (
    <span
      role="radiogroup"
      aria-label="Which navigation to show"
      className="flex shrink-0 rounded-[7px] bg-nav-hover p-[2px]"
    >
      {NAV_GENERATIONS.map((generation) => {
        const active = generation === navGeneration;
        return (
          <button
            key={generation}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setNavGeneration(generation)}
            title={
              generation === "legacy"
                ? "Show the navigation that ships today"
                : "Show the proposed navigation"
            }
            className={cn(
              "motion-tap rounded-[5px] px-[8px] py-[4px] text-[11px] leading-none font-medium whitespace-nowrap",
              active
                ? "bg-nav text-nav-fg shadow-[inset_0_0_0_1px_var(--nav-divider)]"
                : "text-nav-fg-subtle hover:text-nav-fg-muted",
            )}
          >
            {NAV_GENERATION_LABELS[generation]}
          </button>
        );
      })}
    </span>
  );
}

export function EntryPill({
  onSearch,
  session,
  edit,
}: {
  onSearch: () => void;
  session: AiSession;
  edit?: EditNavProps;
}) {
  return (
    // Relative, so the edit control has something to hang off. `w-full` keeps it
    // the same flex child the pill used to be in both arrangements.
    <div className="relative w-full">
      {edit ? <EditNavButton {...edit} /> : null}
      {/*
        One control, two targets.

        A field and a separate orb beside it read as two features that happen to
        be adjacent, which is the overlap the review wanted closed. Sharing one
        border makes them one thing you can either type into or ask — the "smart
        unified input" direction, without yet merging the *behaviours*, which is a
        much bigger question than placement.

        A div, not a button: it holds two controls, and nesting buttons is invalid
        markup that browsers resolve inconsistently.
      */}
      <div
        className={cn(
          "ai-entry motion-tap flex h-[36px] w-full items-center gap-[6px] rounded-full pr-[10px] pl-[4px] shadow-[inset_0_0_0_1px_var(--nav-divider)] focus-within:shadow-[inset_0_0_0_1px_var(--brand)]",
          // Both stay live while editing (Aug 25).
          //
          // They were locked out on the grounds that they are not part of the
          // tree, which is true and beside the point: arranging a nav is
          // exactly when you need to find a product you half-remember, or ask
          // where something lives. Refusing the two ways to look things up
          // during the one task that is about what the nav contains made the
          // mode feel like a trap rather than a mode.
        )}
      >
        {/*
          Reads as one field you can talk to.

          The orb and the placeholder are the AI target and they fill the pill, so
          the thing that looks like an input says what it does — which was the
          review's objection to the orb on its own, since there is no established
          icon for an AI assistant to trade on. No separator: a rule down the middle
          made it two controls sharing a border rather than one control.

          Fully rounded, because a pill reads as somewhere to type where a 10px
          radius read as a button.
        */}
        {/*
          The orb ALONE opens the assistant panel (Aug 11 ask) — everywhere
          else on the pill, label included, is search. One control, but the
          AI entrance is exactly the AI-shaped part of it.
        */}
        <button
          type="button"
          title="Ask AI"
          aria-label="Ask AI"
          onClick={() => session.launch()}
          className="motion-tap relative flex size-[28px] shrink-0 items-center justify-center rounded-full hover:scale-105 active:scale-95"
        >
          {session.open ? (
            <span
              aria-hidden="true"
              className="motion-ai-pulse absolute inset-0 rounded-full ring-2 ring-[var(--ai-ring)]"
            />
          ) : null}
          <AiMark size={26} />
        </button>

        <button
          type="button"
          title="Search"
          onClick={onSearch}
          className="motion-tap flex h-full min-w-0 flex-1 items-center gap-[8px] text-left"
        >
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] text-nav-fg-subtle">
            Ask AI
          </span>
          <Search
            size={16}
            aria-hidden="true"
            className="shrink-0 text-nav-fg-subtle"
          />
        </button>

        <Kbd>⌘K</Kbd>
      </div>
    </div>
  );
}

/**
 * The same pair for the 64px rail, stacked because two 38px buttons will not sit
 * side by side in it.
 */
export function EntryClusterRail({
  onSearch,
  session,
}: {
  onSearch: () => void;
  session: AiSession;
}) {
  return (
    // Same lift as the expanded pill: 18px of clearance under the capsule.
    <div className="flex shrink-0 flex-col items-center pb-[18px]">
      {/*
        The same ring the expanded pill wears, stood upright — so the pair
        reads as ONE control seen at rail width, not two round things that
        happen to be stacked. Same reasoning as the favourites capsule.
      */}
      <div className="ai-entry flex w-[44px] flex-col items-center gap-[2px] rounded-full p-[3px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
      {/*
        AI first here too, so the order survives collapsing. The rail has no room
        for the label, so the tooltip carries the name — which is why AI keeps the
        leading position: it is the one of the two whose glyph does not explain
        itself, and being first is the only ordering cue left.
      */}
      <RailTooltip label="Ask AI">
        <button
          type="button"
          aria-label="Ask AI"
          onClick={() => session.launch()}
          className="motion-tap relative flex size-[38px] shrink-0 items-center justify-center rounded-full hover:scale-105 active:scale-95 motion-press"
        >
          {session.open ? (
            <span
              aria-hidden="true"
              className="motion-ai-pulse absolute inset-[-3px] rounded-full ring-2 ring-[var(--ai-ring)]"
            />
          ) : null}
          <AiMark size={32} />
        </button>
      </RailTooltip>

      <RailTooltip label="Search">
        <button
          type="button"
          aria-label="Search"
          onClick={onSearch}
          className="motion-tap flex size-[38px] shrink-0 items-center justify-center rounded-full text-nav-fg-subtle hover:scale-105 hover:bg-nav-hover hover:text-nav-fg-muted active:scale-95"
        >
          <Search size={16} aria-hidden="true" />
        </button>
      </RailTooltip>
      </div>
    </div>
  );
}
