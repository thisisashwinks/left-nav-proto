"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  Eye,
  Moon,
  MoreHorizontal,
  PanelsTopLeft,
  Palette,
  Search,
  Sun,
  Lock,
  SquarePen,
  TriangleAlert,
} from "lucide-react";
import { AiMark } from "@/components/ai/ai-mark";
import { NavIntroCard } from "./nav-intro-card";
import { AGENCY_PLAN_PRICES } from "@/design/plans";
import type { EditBlock } from "./nav-profiles";
import type { AiSession } from "@/components/ai/use-ai-session";
import { Kbd } from "@/components/search/kbd";
import { cn } from "@/lib/utils";
import { RailTooltip } from "./rail-tooltip";
import { EditMoreMenu } from "./edit-more-menu";
import { NavGenerationModal } from "./nav-generation-modal";
import { useTheme } from "@/components/theme/theme-provider";

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
  searchEnabled = true,
}: {
  onSearch: () => void;
  session: AiSession;
  edit?: EditNavProps;
  /**
   * Whether the pill is a search field as well as an AI entrance.
   *
   * False at agency scope by default — see AGENCY_SEARCH_DEFAULT. The orb and
   * the label stay; the magnifier and the keycap go, and the whole pill becomes
   * the one target it still has. A field that opens nothing is worse than no
   * field.
   */
  searchEnabled?: boolean;
}) {
  return (
    // 22px under the pill, not 12: hugging the nav's foot read as an
    // afterthought — the lift gives the entry the margin a primary control
    // deserves (Aug 13 ask).
    <div className="flex w-full shrink-0 px-[12px] pb-[22px]">
      <EntryPill
        onSearch={onSearch}
        session={session}
        searchEnabled={searchEnabled}
        {...(edit ? { edit } : {})}
      />
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
  /* ---- What the overflow menu needs. See EditMoreMenu. ---- */
  /**
   * Locked by the agency plan, and why.
   *
   * The control STAYS — greyed, badged with the tier that would unlock it, and
   * opening the wall instead of the editor. Hiding it would make the two tiers
   * look like two products rather than one product at two prices, and an
   * agency on $97 would never learn the feature exists.
   */
  planLock?: EditBlock;
  /** Seeds the template name. */
  accountName: string;
  /** Whose template link the menu reads, to tell Save from Create. */
  accountId: string;
  /** Whether the shipped default is what is on screen. */
  viewingDefault: boolean;
  /** Goes through the warning first; the shell owns that dialog. */
  onShowDefault: () => void;
  onRestoreOwn: () => void;
  onApplyTemplate: (templateId: string) => void;
  onCreateTemplate: (name: string) => void;
  onUpdateTemplate: (templateId: string) => void;
  /** Copies a template onto a new one nobody is on. See EditMoreMenu. */
  onDuplicateTemplate: (templateId: string) => void;
  /** Whether the account has changed since it took its template. */
  templateDirty: boolean;
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
  planLock,
  revealed = false,
  atFoot = false,
  editing,
  onStart,
  onSave,
  onDiscard,
  dirty,
  blocked,
  onOpenBlocks,
  onOpenAppearance,
  onOpenTemplates,
  accountName,
  accountId,
  viewingDefault,
  onShowDefault,
  onRestoreOwn,
  onApplyTemplate,
  onCreateTemplate,
  onUpdateTemplate,
  onDuplicateTemplate,
  templateDirty,
  showIntro = false,
  onDismissIntro,
}: EditNavProps & {
  revealed?: boolean;
  /**
   * There is no pill under this one — the entry has moved to the app bar.
   *
   * The control hangs ABOVE the pill normally, which is a measurement taken
   * from something that is no longer there. At the foot it grows up from the
   * nav's bottom edge instead, overlaying the rows above it exactly as it
   * always did.
   */
  atFoot?: boolean;
}) {
  /*
   * The trigger for the Navigation menu, held as the element rather than a rect.
   *
   * Declared here, above the early returns, because it is a hook — and kept in
   * this component rather than lifted to the shell like the other three panels
   * because nothing outside the card needs to know the menu is open. The other
   * three are lifted only because they outlive the card's own layout.
   */
  const [moreAnchor, setMoreAnchor] = React.useState<HTMLElement | null>(null);
  const [navModalOpen, setNavModalOpen] = React.useState(false);

  /*
   * Read here rather than threaded through EditNavProps.
   *
   * The light/dark tool writes the same per-account override the colours panel
   * writes, so it needs the store either way — and adding three more props to an
   * interface that already carries fourteen would be worse than one hook call.
   */
  const themeCtx = useTheme();
  const { setAccountTheme } = themeCtx;
  const colourControl = themeCtx.effective.navColourControl;
  const { navSwitchButton, darkMode } = themeCtx.effective;
  const navTheme =
    themeCtx.accountThemeFor(accountId).navTheme ?? themeCtx.effective.navTheme;

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
          {...(planLock ? { planLock } : {})}
          editing={editing}
          dirty={dirty}
          blocked={blocked}
          onStart={onStart}
          onSave={onSave}
          onDiscard={onDiscard}
          onOpenBlocks={onOpenBlocks}
          onOpenAppearance={onOpenAppearance}
          accountName={accountName}
          accountId={accountId}
          viewingDefault={viewingDefault}
          onShowDefault={onShowDefault}
          onRestoreOwn={onRestoreOwn}
          onApplyTemplate={onApplyTemplate}
          onCreateTemplate={onCreateTemplate}
          onUpdateTemplate={onUpdateTemplate}
          onDuplicateTemplate={onDuplicateTemplate}
          templateDirty={templateDirty}
          {...(onOpenTemplates ? { onOpenTemplates } : {})}
          atFoot={atFoot}
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
      <>
      {moreAnchor ? (
        <EditMoreMenu
          anchor={moreAnchor}
          accountName={accountName}
          accountId={accountId}
          viewingDefault={viewingDefault}
          onShowDefault={onShowDefault}
          onRestoreOwn={onRestoreOwn}
          onApplyTemplate={onApplyTemplate}
          onCreateTemplate={onCreateTemplate}
          onUpdateTemplate={onUpdateTemplate}
          onDuplicateTemplate={onDuplicateTemplate}
          templateDirty={templateDirty}
          onClose={() => setMoreAnchor(null)}
          onOpenNavModal={() => setNavModalOpen(true)}
        />
      ) : null}
      {/*
        Outlives the menu on purpose — the menu closes as the modal opens, and a
        dropdown left hanging behind a modal reads as two surfaces fighting.
      */}
      {navModalOpen ? (
        <NavGenerationModal onClose={() => setNavModalOpen(false)} />
      ) : null}
      <div
        className={cn(
          "absolute right-0 left-0 z-20 flex flex-col gap-[6px] rounded-[10px] bg-nav p-[8px] shadow-[0_4px_12px_0_var(--fly-shadow),inset_0_0_0_1px_var(--nav-border,var(--nav-divider))]",
          atFoot ? "bottom-0" : "-top-[74px]",
        )}
      >
        {/*
          The tools get the top line to themselves.
          
          They used to share it with the mode label, which worked at two and
          broke at three: Templates ran off the card's right edge, clipped
          mid-word. Three named controls need the full 256px, so the label moved
          down beside the two exits — where it still says which mode you are in,
          next to the buttons that end it.
        */}
        {/*
          Tools in their own group, spaced tighter than the row.

          At five icons the row's 6px gaps pushed the total past 232px and
          "Editing nav" clipped mid-word — the same failure its own note records
          at three labelled controls. 4px between icons buys back the 8px the
          fifth one costs, and the icons read as one cluster rather than five
          separate controls, which is what they are.
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
          <span className="flex shrink-0 items-center gap-[4px]">
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
          {/*
            One control, two shapes — see NAV_COLOUR_CONTROLS.
            
            Light-or-dark is the only colour decision most admins make, and the
            only one they make repeatedly; the accents and the custom picker are
            a once-ever choice. So the default spends the card's one colour slot
            on the repeated decision and does it in a single click, with the rest
            reachable from the prototype controls. `panel` puts the whole surface
            back on this icon for comparison.
          */}
          {colourControl === "panel" ? (
            <EditTool
              label="Change the navigation's colours"
              short="Colours"
              icon={Palette}
              onOpen={onOpenAppearance}
            />
          ) : !darkMode ? (
            /*
              Nothing to offer.

              On this setting the tool IS the light/dark switch — it has no
              second job to fall back to — so with dark mode off it would be a
              control that toggles between one state. The card shows one fewer
              icon rather than a dead one. The `panel` setting above keeps its
              button, because that panel still does accent and contrast.
            */
            null
          ) : (
            <EditTool
              label={
                navTheme === "dark"
                  ? "Switch the navigation to light"
                  : "Switch the navigation to dark"
              }
              // The icon shows the destination, not the current state: a sun on
              // a dark nav reads as "go light", where a moon there reads as a
              // label for where you already are.
              short={navTheme === "dark" ? "Light" : "Dark"}
              icon={navTheme === "dark" ? Sun : Moon}
              onOpen={() =>
                setAccountTheme(accountId, {
                  navTheme: navTheme === "dark" ? "light" : "dark",
                })
              }
            />
          )}
          {/*
            Everything reached once a session, behind one control.

            Templates, which layout and which navigation were three more icons on
            a row that had already run out of width — and they are a different
            kind of thing from the two that stayed. Show / hide and Colours change
            what you are looking at while you arrange it, so they are worth a
            click each; these are decisions you make once and leave.

            The `navSwitchInEditCard` axis still gates the navigation entry, but
            it now hides one row inside a menu rather than an icon on the card, so
            switching it off no longer changes the card's shape.
          */}
          <EditTool
            label="More editing options — templates, layout, navigation"
            short="More"
            icon={MoreHorizontal}
            onOpen={(trigger) => setMoreAnchor(trigger)}
          />
          </span>
        </div>

        <div className="flex items-center justify-end gap-[6px]">
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
      </>
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
    /*
      Two controls, side by side, both hidden until the nav is hovered.

      Switching navigation is not an editing tool and it was living inside one —
      three levels into the edit card's overflow, behind a mode that the Starter
      plan cannot open at all. Out here it is a peer of Edit nav rather than a
      leaf of it: same size, same reveal, same grow-on-hover, and reachable
      whatever the plan says about restructuring.

      A flex row rather than two absolute boxes: they have to sit beside each
      other without either of them knowing how wide the other's label is when it
      opens.
    */
    <div
      className={cn(
        "absolute right-0 z-20 flex items-center gap-[6px]",
        atFoot ? "bottom-0" : "-top-[34px]",
      )}
    >
      {/*
        Scaffolding, and off unless someone asks for it.

        The button exists so a reviewer can cross between the two navs, which
        the prototype panel already does from outside the surface under review.
        A real account has one nav and no reason for a door to the other, so
        leaving it standing made the proposal slightly not the thing it is
        proposing. See NAV_SWITCH_BUTTON_DEFAULT.
      */}
      {navSwitchButton ? (
        <SwitchNavButton
          revealed={revealed}
          onOpen={() => setNavModalOpen(true)}
        />
      ) : null}
      {/*
        Rendered here as well as in the editing branch above, because that is
        where it was and this is where the button is.

        `navModalOpen` is one piece of state on a component with three returns —
        the intro card, the editing card, and this — and the modal was only
        mounted by the second of them. So the button set a flag nothing was
        listening to and clicking it did nothing at all, silently, which is the
        worst shape this bug could take.
      */}
      {navModalOpen ? (
        <NavGenerationModal onClose={() => setNavModalOpen(false)} />
      ) : null}
    <button
      type="button"
      aria-label="Edit navigation"
      onClick={onStart}
      data-revealed={revealed ? "" : undefined}
      className={cn(
        "group/edit relative flex h-[26px] shrink-0 items-center overflow-hidden rounded-full",
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
        /*
          Symmetric padding, and a width that fits what is in the pill.
          
          It grew to a flat 92px with padding on the LEFT only, so the label
          finished ~19px short of the right edge and the pill read as
          off-centre. The open width is stated per content instead — the locked
          pill carries a second glyph and needs the room for it — and the
          padding is the same on both sides, which is the only way the gap
          before the label and the gap after it can agree.
        */
        planLock
          ? "data-revealed:w-[104px]"
          : "data-revealed:w-[86px]",
        "data-revealed:justify-start data-revealed:gap-[6px]",
        "data-revealed:bg-nav-hover data-revealed:px-[8px] data-revealed:opacity-100",
        // A hairline the same colour as the row dividers was invisible against the
        // nav's own surface. The stronger ring and the row-level ink are what make
        // a white circle on a white nav read as a control.
        "bg-nav text-nav-fg shadow-[0_2px_8px_0_var(--fly-shadow),inset_0_0_0_1px_var(--nav-border,var(--nav-divider))]",
        "transition-[width,gap,padding,opacity,color,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
        planLock
          ? "hover:w-[104px] focus-visible:w-[104px]"
          : "hover:w-[86px] focus-visible:w-[86px]",
        "hover:justify-start hover:gap-[6px] hover:px-[8px] hover:bg-nav-hover",
        "focus-visible:justify-start focus-visible:gap-[6px] focus-visible:px-[8px]",
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
        {/*
          The verb, at every tier.
          
          It briefly read as the PRICE when locked, which turned the control
          into an advert and stopped it saying what it is. The label names the
          feature; the padlock beside it says you cannot have it yet; the
          tooltip says what to do about it. Three jobs, three elements — rather
          than one word doing all three and none of them well.
        */}
        Edit nav
      </span>
      {planLock ? (
        /*
          The padlock carries its own tooltip, naming the tier.
          
          The label says what the control is and the padlock says you cannot
          have it — but neither says what it would take, and a lock with no
          price is a dead end. It sits on the GLYPH rather than on the button
          because the button's hover is already spoken for: that gesture opens
          the pill, and a tooltip riding on it would fire every time anyone
          brushed the control.
          
          Reachable only once the pill is open, which is the right sequence:
          the padlock has no width at rest, so there is nothing to point at
          until the control has named itself.
        */
        <RailTooltip
          label={`Upgrade to ${AGENCY_PLAN_PRICES[planLock.kind === "plan" ? planLock.needs : "elite"]} to edit`}
        >
          <Lock
            size={12}
            aria-hidden="true"
            // Trailing, and fading in with the label: at rest the pill is a
            // 26px circle with the pencil dead centre, and a padlock crammed in
            // beside it would make the resting state unreadable to say
            // something the hover state says better.
            className="w-0 shrink-0 overflow-hidden opacity-0 transition-opacity duration-[var(--dur-base)] ease-[var(--ease-out)] group-hover/edit:w-auto group-hover/edit:opacity-100 group-hover/edit:delay-[90ms] group-focus-visible/edit:w-auto group-focus-visible/edit:opacity-100 group-data-revealed/edit:w-auto group-data-revealed/edit:opacity-100"
          />
        </RailTooltip>
      ) : null}
    </button>
    </div>
  );
}

/**
 * The way out of this navigation, beside the way into editing it.
 *
 * The same pill Edit nav is — a 26px circle that grows into a named control on
 * hover — because they are peers and the pair has to read as one cluster rather
 * than as a control and an afterthought.
 *
 * `PanelsTopLeft`, not `Replace`: the two-arrows glyph says "swap" without
 * saying what for, and at 13px it read as a pair of tally marks beside a
 * pencil. This one draws a window with a left panel and a top bar, which is
 * both what is being chosen and what the modal's own sketches show. The legacy
 * nav uses the same mark for the same trip in the other direction.
 *
 * Deliberately not plan-gated. Editing a nav is a $297 capability; choosing
 * which nav you have is not, and putting this behind the same lock left Starter
 * agencies with no route back at all.
 */
function SwitchNavButton({
  revealed,
  onOpen,
}: {
  revealed: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      aria-label="Switch navigation"
      onClick={onOpen}
      data-revealed={revealed ? "" : undefined}
      className={cn(
        "group/edit relative flex h-[26px] shrink-0 items-center overflow-hidden rounded-full",
        "w-[26px] justify-center gap-0 px-0",
        "data-revealed:w-[104px] data-revealed:justify-start data-revealed:gap-[6px]",
        "data-revealed:bg-nav-hover data-revealed:px-[8px] data-revealed:opacity-100",
        "bg-nav text-nav-fg shadow-[0_2px_8px_0_var(--fly-shadow),inset_0_0_0_1px_var(--nav-border,var(--nav-divider))]",
        "transition-[width,gap,padding,opacity,color,transform] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
        "hover:w-[104px] hover:justify-start hover:gap-[6px] hover:px-[8px] hover:bg-nav-hover",
        "focus-visible:w-[104px] focus-visible:justify-start focus-visible:gap-[6px] focus-visible:px-[8px]",
        "active:scale-95",
        "opacity-0 group-hover/nav:opacity-100 focus-visible:opacity-100",
      )}
    >
      <PanelsTopLeft size={13} aria-hidden="true" className="shrink-0" />
      {/* Zero-width at rest, for the reason spelled out on Edit nav's label. */}
      <span
        aria-hidden="true"
        className="w-0 overflow-hidden text-[12px] leading-none font-medium whitespace-nowrap opacity-0 transition-opacity duration-[var(--dur-base)] ease-[var(--ease-out)] group-hover/edit:w-auto group-hover/edit:opacity-100 group-hover/edit:delay-[90ms] group-focus-visible/edit:w-auto group-focus-visible/edit:opacity-100 group-data-revealed/edit:w-auto group-data-revealed/edit:opacity-100"
      >
        Switch nav
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
  disabled = false,
}: {
  label: string;
  /** The tooltip. Shorter than the accessible name, which says the action. */
  short: string;
  icon: LucideIcon;
  onOpen: (trigger: HTMLElement) => void;
  /**
   * Really disabled, not just faded.
   *
   * Reset has nothing to do on a nav already at its default, and a live control
   * that silently does nothing teaches less than one that says why. A faded
   * button would still be tab-reachable and Enter-activatable.
   */
  disabled?: boolean;
}) {
  const button = (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => onOpen(e.currentTarget)}
      className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
  /*
   * A real tooltip, not the native `title`.
   *
   * Every control on this row is a bare glyph — that was the deliberate call
   * once there were five of them and labels would not fit — which makes the
   * name the only thing saying what each one does. A browser tooltip arrives a
   * second late, in the OS's own styling, on a toolbar you are sweeping across;
   * by the time it appears the pointer has usually moved on.
   *
   * Above, not right and not below.
   *
   * Below is off the bottom of the window — the card sits at the nav's foot.
   * Right was worse and is what this fixes: `right` anchors to the NAV's edge
   * rather than to the glyph, which is correct for a 56px rail and wrong here,
   * so the pill flew out past the nav and hung in the canvas beside a control
   * it was supposed to be naming. Above puts it over the glyph it belongs to,
   * where there is always room: the card is 34px up from the nav's foot and the
   * nav is the full height of the window.
   */
  return (
    <RailTooltip label={short} placement="above">
      {button}
    </RailTooltip>
  );
}

/**
 * The edit control with no pill under it.
 *
 * What the nav's foot holds when the entry has moved to the app bar: a
 * zero-height line for the control to hang off, so the nav keeps its way into
 * edit mode without keeping a 36px hole where the pill used to be.
 */
export function EditNavAnchor({ edit }: { edit: EditNavProps }) {
  return (
    <div className="relative h-0 w-full">
      <EditNavButton {...edit} atFoot />
    </div>
  );
}

export function EntryPill({
  onSearch,
  session,
  edit,
  tone = "nav",
  searchEnabled = true,
}: {
  onSearch: () => void;
  session: AiSession;
  edit?: EditNavProps;
  /**
   * Whether the pill is a search field as well as an AI entrance.
   *
   * False at agency scope by default — see AGENCY_SEARCH_DEFAULT. The orb and
   * the label stay; the magnifier and the keycap go, and the whole pill becomes
   * the one target it still has. A field that opens nothing is worse than no
   * field.
   */
  searchEnabled?: boolean;

  /**
   * Which surface's tokens to wear.
   *
   * The pill is the same control in the nav and in the app bar, but the bar has
   * its own theme axis — it can be dark over a light nav — so the ring and the
   * placeholder have to read against whichever surface it is standing on.
   */
  tone?: "nav" | "header";
}) {
  const header = tone === "header";
  // The hook runs unconditionally; only the ANSWER is conditional. Reading it
  // inside the `&&` made it a conditional hook call.
  const { aiButtonStyle } = useTheme().effective;
  // Only consulted where the pill is a button — see AI_BUTTON_STYLES.
  const outlined = !searchEnabled && aiButtonStyle === "outline";
  return (
    // Relative, so the edit control has something to hang off. `w-full` keeps it
    // the same flex child the pill used to be in both arrangements.
    <div className={cn("relative", searchEnabled ? "w-full" : "w-auto")}>
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
          "ai-entry motion-tap flex items-center gap-[6px] rounded-full focus-within:shadow-[inset_0_0_0_1px_var(--brand)]",
          /*
            A field fills its column; a button is the size of what it says.
            
            `w-full` and 36px are what an input wants — room to type into, and
            the platform's control height so it lines up with the other fields
            on the screen. Neither is true of a button whose whole content is an
            orb and two words: stretched to the column it went on reading as a
            search bar however it was painted, which was the objection. So it
            hugs, and it drops to 32 — a touch under the input height, which is
            what stops it competing with the 26px utility glyphs beside it in
            the bar.
          */
          searchEnabled
            ? "h-[36px] w-full pr-[10px] pl-[4px]"
            : "h-[32px] w-auto pr-[12px] pl-[4px]",
          /*
            With search, a field. Without it, a button.
            
            The hairline ring is what says "type here" — an empty box with a
            faint edge is the shape of an input, whatever is inside it. Once the
            magnifier and the keycap are gone that shape is a promise the pill
            cannot keep, so the treatment changes with the job: the same tinted
            surface the Ask AI dock and the composer wear, which is this app's
            standing answer to "this is the AI, and it is a thing you press".
            
            Same height and same radius either way, so switching the axis moves
            no geometry — only the fill.
          */
          !searchEnabled &&
            !outlined &&
            /*
              Fill only, no ring.

              Root-scoped tokens, not the nav's --ai-soft trio: in the app bar
              those resolve to nothing at all. See --ai-btn-* in tokens.css.

              The hairline was carried over from the field, where an edge is the
              whole affordance — a box with nothing in it has to be drawn. A
              filled shape already has an edge, and outlining it was the same
              boundary stated twice.
            */
            "bg-[linear-gradient(135deg,var(--ai-btn-from),var(--ai-btn-to))] hover:brightness-[0.97] active:scale-[0.98] motion-press",
          outlined &&
            /*
              The other way round: the field's edge, and no fill.

              Deliberately the SAME hairline the search field wears rather than
              a quieter one of its own — the point of the option is that the
              assistant's entrance can be as plain as any other control on the
              surface, and inventing a third border weight would be answering a
              question nobody asked. Hover fills faintly, so the target still
              acknowledges the pointer without the resting state shouting.
            */
            cn(
              "bg-transparent active:scale-[0.98] motion-press",
              header
                ? "shadow-[inset_0_0_0_1px_var(--hdr-entry-border)] hover:bg-hdr-chip"
                : "shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover",
            ),
          searchEnabled &&
            (header
              ? // Its own token, not the bar's hairline: see --hdr-entry-border.
                "shadow-[inset_0_0_0_1px_var(--hdr-entry-border)]"
              : "shadow-[inset_0_0_0_1px_var(--nav-divider)]"),
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
          className={cn(
            "motion-tap relative flex shrink-0 items-center justify-center rounded-full hover:scale-105 active:scale-95",
            searchEnabled ? "size-[28px]" : "size-[24px]",
          )}
        >
          {session.open ? (
            <span
              aria-hidden="true"
              className="motion-ai-pulse absolute inset-0 rounded-full ring-2 ring-[var(--ai-ring)]"
            />
          ) : null}
          <AiMark size={searchEnabled ? 26 : 22} />
        </button>

        {/*
          The rest of the pill: search where there is something to search, and
          the AI entrance where there is not. Either way it stays one target the
          width of the control — a pill with a dead half reads as broken, and a
          pill that is all orb reads as a button pretending to be a field.
        */}
        <button
          type="button"
          title={searchEnabled ? "Search" : "Ask AI"}
          onClick={searchEnabled ? onSearch : () => session.launch()}
          className={cn(
            "motion-tap flex h-full min-w-0 items-center gap-[8px] text-left",
            searchEnabled ? "flex-1" : "shrink-0",
          )}
        >
          <span
            className={cn(
              "min-w-0 truncate text-[13px] leading-[normal]",
              // Only a field's placeholder has a column to fill.
              searchEnabled ? "flex-1" : "shrink-0",
              /*
                A placeholder is muted because it is a prompt for text that is
                not there yet. A button's label is the button, so as a button it
                takes the AI ink and a medium weight — the same step of weight
                that separates a control from a caption anywhere else in here.
              */
              searchEnabled
                ? header
                  ? "text-hdr-fg-muted"
                  : "text-nav-fg-subtle"
                : "font-medium text-[var(--ai-btn-fg)]",
            )}
          >
            Ask AI
          </span>
          {searchEnabled ? (
            <Search
              size={16}
              aria-hidden="true"
              className={cn(
                "shrink-0",
                header ? "text-hdr-fg-muted" : "text-nav-fg-subtle",
              )}
            />
          ) : null}
        </button>

        {/* The keycap is the shortcut's label, so it goes with the shortcut. */}
        {searchEnabled ? <Kbd>⌘K</Kbd> : null}
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
  searchEnabled = true,
}: {
  onSearch: () => void;
  session: AiSession;
  /**
   * Whether the pill is a search field as well as an AI entrance.
   *
   * False at agency scope by default — see AGENCY_SEARCH_DEFAULT. The orb and
   * the label stay; the magnifier and the keycap go, and the whole pill becomes
   * the one target it still has. A field that opens nothing is worse than no
   * field.
   */
  searchEnabled?: boolean;
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

      {searchEnabled ? (
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
      ) : null}
      </div>
    </div>
  );
}
