"use client";

import * as React from "react";
import {
  Check,
  Clock,
  GitBranch,
  History,
  Mail,
  MessageSquare,
  Play,
  Plus,
  Redo2,
  Share2,
  Tag,
  Undo2,
  Users,
  Workflow as WorkflowGlyph,
  Zap,
} from "lucide-react";
import { WorkflowCanvas } from "@/components/automation/workflow-canvas";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { ViewBar } from "@/components/page/view-bar";
import {
  CollabIsland,
  FloatingLayer,
  IdentityIsland,
  Island,
  IslandGlyph,
  IslandRule,
  IslandTabs,
  ToolPalette,
  ZoomIsland,
  type PaletteGroup,
} from "@/components/shell/floating-chrome";
import { useShellChrome } from "@/components/shell/full-bleed";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, type Workflow } from "./workflows-data";
import { BuilderTrail } from "@/components/shell/builder-trail";

/**
 * The facets of one workflow.
 *
 * These pass the view-bar test for a record rather than a collection: each one
 * is an aspect of THIS workflow, not another object. Enrollment history is the
 * borderline case and stays because it is this workflow's own runs — a list
 * scoped to the record, the way a contact's opportunities are.
 */
/**
 * The canvas's eight step categories, as the floating palette — in four
 * clusters, because a workflow palette is not a whiteboard's.
 *
 * WHAT THIS IS NOT, as of Sep 23. It used to sit under a properties strip of
 * cursor / hand / connector-style / colour / "Font", copied off a ClickUp
 * whiteboard screenshot that was only ever an EXAMPLE of the floating-island
 * idea. Nothing on a workflow canvas is drawn freehand, there is no stroke to
 * colour and no text object to set a typeface on; the strip was a picture of a
 * different product's tools. It is gone, and what is left is the only thing a
 * workflow canvas arms a click with: which kind of step lands next.
 *
 * Still the same eight the Standard canvas draws down its left rail, and still
 * in that order, because this style's claim is that it MOVES a builder's
 * controls rather than editing them — a palette that quietly dropped
 * Integrations would make the two screenshots incomparable, which is all they
 * are for. What is new is the grouping: the entry point, then the three that
 * reach the contact, then the two that shape the run, then the two that touch
 * something outside it. Four clusters separated by hairlines rather than eight
 * glyphs in an undifferentiated row, which is how every canvas app eventually
 * has to split a palette this long.
 *
 * The 1–8 hints survive as TOOLTIP text. They used to be printed above each
 * glyph as a permanent row of numerals, which is the thing the review called
 * out: eight pieces of 9.5px type competing with the icons, on chrome that
 * sits on top of the user's work. See ToolPalette for the argument it replaced.
 */
const STEP_TOOLS: readonly PaletteGroup[] = [
  [{ id: "triggers", label: "Triggers", icon: Zap, hint: "1" }],
  [
    { id: "contacts", label: "Contact actions", icon: Users, hint: "2" },
    { id: "conversations", label: "Conversations", icon: MessageSquare, hint: "3" },
    { id: "email", label: "Email", icon: Mail, hint: "4" },
  ],
  [
    { id: "wait", label: "Wait", icon: Clock, hint: "5" },
    { id: "conditions", label: "Conditions", icon: GitBranch, hint: "6" },
  ],
  [
    { id: "data", label: "Data", icon: Tag, hint: "7" },
    { id: "integrations", label: "Integrations", icon: Share2, hint: "8" },
  ],
];

const FACETS = [
  { id: "builder", label: "Builder" },
  { id: "enrollment", label: "Enrollment history", count: "1,204" },
  { id: "settings", label: "Settings" },
];

/**
 * The workflow's status, as a pill.
 *
 * Lifted out of the header it used to live in because the chrome above it is
 * now a set of switches rather than a fixed row — in three of the four retain
 * combinations the builder draws its own top band, and in one it draws two —
 * and the status of the thing you are editing is not what any of them are
 * arguing about. It rides with the artifact, wherever the artifact's row is.
 */
function StatusPill({ status }: { status: Workflow["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-[5px] rounded-[6px] px-[8px] text-[12px] leading-[normal] font-medium",
        status === "live"
          ? "bg-pg-bg text-[var(--pg-status-subscribed-fg)]"
          : status === "review"
            ? "bg-pg-bg text-[var(--pg-status-inquiry-fg)]"
            : "bg-pg-bg text-pg-muted",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-[6px] rounded-full",
          status === "live"
            ? "bg-[var(--pg-status-subscribed-dot)]"
            : status === "review"
              ? "bg-[var(--pg-status-inquiry-dot)]"
              : "bg-pg-disabled",
        )}
      />
      {STATUS_LABEL[status]}
    </span>
  );
}


/**
 * A workflow, opened — and the Sep 22 builder chrome, wired.
 *
 * The axis stopped being three named variants and became two retain switches:
 * does the platform sidebar survive into the builder, and does the app bar?
 * They are independent and all four combinations are real screens, because the
 * named variants turned out to be three points on those two axes and the two
 * they skipped (sidebar without bar, bar without sidebar) are the ones the
 * review kept asking to see.
 *
 * This page's job is only ever the second half of each answer. It asks the
 * shell to stand chrome down and then draws what the shell is no longer
 * drawing — never the other way round. The nav is settled and untouched; the
 * bar is settled and untouched; what changes is how much of the trail and the
 * exit this page is holding.
 *
 * The rule all four obey, from the Sep 22 research: the LEFT of a row is
 * navigation — moves that cost nothing and say where you are — and the RIGHT
 * is commitment, where a control implies a decision about the work. So Test
 * and Publish are always right and the trail is always left. The ✕ exit is the
 * one thing that breaks it, on purpose, and see its comment below for why it
 * is kept where a reviewer can look at it.
 */
export function WorkflowDetail({
  workflow,
  onBack,
}: {
  workflow: Workflow;
  onBack: () => void;
}) {
  const [facet, setFacet] = React.useState("builder");
  const { effective } = useTheme();
  const {
    builderKeepSidebar,
    builderKeepTopBar,
    builderControls,
    builderExit,
    builderCanvas,
    builderChromeStyle,
    builderToolPalette,
  } = effective;
  /*
   * The Sep 23 axis, read once and named once.
   *
   * `floating` is not a fourth value of `builderControls` and it is not read
   * next to it: that axis says where the trail and the publish row go when
   * they are ROWS, and under this style there are no rows for it to place them
   * in. So every `builderControls` branch below lives inside the `rows` half,
   * and a reviewer who flips it while floating is selected correctly sees
   * nothing move. See the note at the top of floating-chrome.tsx.
   */
  const floating = builderChromeStyle === "floating";
  /*
   * Whether the palette is asked for at all — off unless a reviewer turns it
   * on, and only ever read inside the `floating` branch. See the axis's own
   * comment in theme.ts: a workflow canvas was the screen that proved the
   * first cut had copied a whiteboard's footer rather than built a builder's.
   */
  const palette = floating && builderToolPalette;
  /* The palette's current tool. Local and lost on remount, like everything
     else on this canvas — a builder that remembered which glyph the last
     reviewer pressed would start every session mid-gesture. */
  const [tool, setTool] = React.useState("triggers");

  /*
   * What this page asks the shell to withdraw, and what it gets back.
   *
   * `collapseSidebar` is the half of the default that is easy to miss: when
   * the nav is retained it arrives as the rail, not the tree. A builder
   * session is minutes long inside a much longer CRM session, so the nav
   * should still be there — it should just not be the widest thing on screen
   * while you are drawing. The shell imposes it once on arrival and the expand
   * toggle keeps working; see app-shell for why that is a shell decision and
   * not something reached into nav/.
   *
   * `exit` is a NODE the shell built, not a flag. Getting one is the shell
   * saying the sidebar is genuinely gone — nav edit mode, for one, refuses the
   * whole ask — so there is no arrangement in which this page can put an exit
   * on screen beside a retained sidebar. It chooses the side, never the
   * existence.
   */
  const { barHidden, exit, trail } = useShellChrome({
    sidebar: builderKeepSidebar ? "keep" : "drop",
    topBar: builderKeepTopBar ? "keep" : "drop",
    exit: builderExit,
    onExit: onBack,
    backLabel: "Back to Workflows",
    collapseSidebar: true,
  });

  /*
   * Automation ▸ Workflows ▸ this one.
   *
   * Published unconditionally, even when the app bar is gone: the crumb is
   * what the shell folds into the trail, and the trail comes straight back
   * down to BuilderTrail above when there is no bar to hold it. One trail,
   * two possible renderers — the page never decides what the trail SAYS.
   *
   * Both readings travel: the shell picks the name or the kind per
   * `recordCrumbLabel`, and only this page knows that what it opened is a
   * workflow. "Workflow details" and not "Builder" — the crumb has to hold
   * still whether the canvas is being read or edited, and the builder is what
   * this screen IS rather than a second place inside it.
   */
  useRecordCrumb({ name: workflow.name, kind: "Workflow details" }, onBack);

  /*
   * The commitment side. Identical in all four combinations, which is the
   * finding rather than an economy: the combinations disagree about the chrome
   * AROUND the builder, not about the builder. Whatever the way out turns out
   * to be, the work is still committed by the same three controls.
   *
   * Version history is a button rather than a kebab row: it is the control
   * that makes Publish survivable, and burying the undo under a ⋯ while the
   * irreversible thing beside it is a filled button is the wrong pair of
   * weights.
   */
  const commitActions = (
    <div className="flex shrink-0 items-center gap-[10px]">
      <OutlineButton>
        <History size={15} aria-hidden="true" className="text-pg-text-strong" />
        Version history
      </OutlineButton>
      <OutlineButton>
        <Play size={15} aria-hidden="true" className="text-pg-text-strong" />
        Test
      </OutlineButton>
      <PrimaryButton>
        <Check size={15} aria-hidden="true" />
        Publish
      </PrimaryButton>
      {/*
        EVIDENCE AGAINST ITSELF, and the only control on this page that sits on
        the wrong side on purpose. Not an endorsed pattern.

        The shell hands a ✕ down only under "Close" (see BUILDER_EXITS), and
        this is where it lands: on the RIGHT, among the commitment controls,
        directly beside Publish. Operators read a ✕ next to a Save as "discard
        my work", not as "go up a level" — so the one control that costs
        nothing is wearing the clothes of the one that costs everything, and
        people hesitate over it or avoid it entirely. It is built so the review
        can look at the thing being argued about instead of at a description of
        it.

        If you want the full-viewport builder without this, the exit you want
        is "Back arrow": same viewport, an arrow on the navigation side, and
        the trail still saying where you are.

        Under `floating` this cluster does NOT carry it. Both exits go to the
        end of the collaboration island instead, because an island has no
        leading edge for an arrow to claim — see CollabIsland, which keeps this
        argument and records what changes when a ✕ ends a row that also holds
        an expand glyph rather than sitting flush against Publish.
      */}
      {!floating && builderExit === "close" ? exit : null}
    </div>
  );

  /*
   * The exit's side, decided once.
   *
   * An arrow is a navigation move, so it goes leftmost of the topmost row —
   * wherever that row turns out to be in this combination. `exit` is null
   * whenever the sidebar was retained (or the shell has already hung the arrow
   * in a bar it kept), so both of these are frequently nothing at all, and
   * that is the invariant doing its job rather than a case to handle.
   */
  const leadingExit = builderExit === "back" ? exit : null;

  /*
   * The artifact's own strip: what it is called by, and how it stands.
   *
   * Reused as the left of whichever row is the builder's own, so the meta line
   * is not something the "two rows" arrangement gains and the others lose.
   */
  const metaLine = (
    <span className="truncate text-[13px] leading-[normal] text-pg-muted">
      {workflow.folder} · {workflow.enrolled} enrolled · edited {workflow.updated}{" "}
      by {workflow.updatedBy}
    </span>
  );

  const artifactMeta = (
    <div className="flex min-w-0 items-center gap-[8px]">
      <StatusPill status={workflow.status} />
      {metaLine}
    </div>
  );

  /* The builder's own row: the artifact on the left, the commitment right. */
  const builderToolbar = (leading?: React.ReactNode) => (
    <div className="flex h-[38px] shrink-0 items-center justify-between gap-[16px]">
      <div className="flex min-w-0 items-center gap-[10px]">
        {leading}
        {artifactMeta}
      </div>
      {commitActions}
    </div>
  );

  /*
   * The chrome, which is only ever one of four shapes.
   *
   * Gated on `barHidden` — what the shell actually did — rather than on the
   * theme flag, because the two disagree whenever the shell refuses the ask.
   * Nav edit mode is the live case: it puts the bar and the nav back, and a
   * page that trusted its own flag would draw a second trail directly under
   * the real one, which is the exact duplication this study exists to remove.
   */
  const chrome = floating ? null : !barHidden ? (
    /*
     * The bar is up, so the trail is already somewhere and this row carries
     * only what the bar cannot: the artifact and the controls that commit it.
     * `builderControls` has nothing to say here, which is why the tuning panel
     * hides it in this combination.
     */
    builderToolbar()
  ) : builderControls === "back-only" ? (
    /*
     * No trail at all. The most canvas of the three and the least context:
     * one exit, and the builder's own toolbar promoted to the top row. What it
     * costs is that nothing on screen says this workflow is in Automation.
     */
    builderToolbar(leadingExit)
  ) : builderControls === "split-rows" ? (
    <div className="flex shrink-0 flex-col gap-[6px]">
      {/*
        The trail keeps its own row, which is the point of this arrangement:
        a long artifact name gets the full width instead of competing with
        three buttons. It costs a second band, and that is the trade the panel
        is asking the reviewer to price.
      */}
      <div className="flex h-[28px] shrink-0 items-center gap-[10px]">
        {leadingExit}
        <BuilderTrail trail={trail} onLeave={onBack} />
      </div>
      {builderToolbar()}
    </div>
  ) : (
    /*
     * One row. Trail on the left, Test and Publish on the right — the shape
     * the rule describes, with nothing between them. The artifact's meta line
     * is what this arrangement gives up: the trail already names the workflow,
     * so what goes is the folder and the edited-by, not the identity.
     */
    <div className="flex h-[38px] shrink-0 items-center justify-between gap-[16px]">
      <div className="flex min-w-0 items-center gap-[10px]">
        {leadingExit}
        <BuilderTrail trail={trail} onLeave={onBack} />
        <StatusPill status={workflow.status} />
      </div>
      {commitActions}
    </div>
  );

  /*
   * The islands, and the box they are anchored to.
   *
   * `inset-0` of the FACET, not of the window. The trail and the publish
   * controls belong to the artifact, and the artifact on this page is whatever
   * the facet is showing — so under Enrollment history the identity and the
   * commit island are still there, over a stage instead of over a canvas,
   * which is the same promise `rows` makes when it keeps its toolbar across
   * all three facets.
   *
   * The bottom three are the canvas's own furniture in island form, so they
   * appear only where there is a canvas. A zoom cluster over an enrollment
   * table would be chrome describing something that is not on screen.
   */
  const islands = floating ? (
    <FloatingLayer
      topLeft={
        <IdentityIsland
          icon={WorkflowGlyph}
          name={workflow.name}
          trail={trail}
          onLeave={onBack}
          exit={exit}
          trailing={<StatusPill status={workflow.status} />}
        >
          {/*
            The meta line as a second tier inside the island rather than as a
            line the style drops. `rows` shows the folder and the edited-by in
            three of its four combinations, and a floating arrangement that
            won its screenshot by carrying less information would be winning
            the wrong comparison.
          */}
          <div className="flex min-w-0 items-center pt-[2px] pl-[33px]">
            {metaLine}
          </div>
        </IdentityIsland>
      }
      /*
        The facets, as an island instead of the full-width ViewBar below.

        Under `rows` they are a band and that is correct — there is already a
        band above them. Under `floating` a band across the top is the thing
        that stops the style from being the style: the screen reads as a bar
        with islands hanging under it, and the canvas stops at the bar instead
        of running behind everything. See IslandTabs.
      */
      topCentre={
        <IslandTabs
          label="Workflow facets"
          tabs={FACETS}
          activeId={facet}
          onSelect={setFacet}
        />
      }
      topRight={<CollabIsland commit={commitActions} />}
      bottomLeft={facet === "builder" ? <ZoomIsland percent={100} /> : null}
      bottomCentre={
        /*
          Nothing at all unless the reviewer asked for a palette. That is the
          default, and on THIS builder it is very nearly the permanent answer:
          arming "the next step is an Email" is a thing you do once per step
          from the node you are extending, not a mode you hold between
          gestures the way a pen is held on a whiteboard. The palette is here
          so the question can be looked at, not because the canvas lost a
          control without it — Add moved to the island below.
        */
        palette && facet === "builder" ? (
          <ToolPalette groups={STEP_TOOLS} active={tool} onPick={setTool} />
        ) : null
      }
      bottomRight={
        facet === "builder" ? (
          <Island className="py-[5px]">
            {/*
              THE `+ Add` ORPHAN, resolved.

              It used to be a lone brand button pushed down to `top-[62px]` by
              the canvas to get clear of the collaboration island — floating
              under an island it did not belong to, touching neither the
              islands nor anything on the canvas, which is how a reviewer ends
              up asking what the third thing is. It is a canvas ACTION, so it
              belongs with the canvas's other actions, which is this island.

              Only when the palette is off. With the palette up, the eight
              step categories ARE how a step gets added, and a filled + beside
              a palette that does the same job is two affordances for one act.
            */}
            {palette ? null : (
              <>
                <button
                  type="button"
                  className="motion-tap flex h-[28px] shrink-0 items-center gap-[5px] rounded-[8px] bg-brand px-[10px] text-[12.5px] leading-[normal] font-medium text-brand-fg hover:brightness-[1.06] active:scale-[0.97]"
                >
                  <Plus size={14} aria-hidden="true" />
                  Add step
                </button>
                <IslandRule />
              </>
            )}
            <IslandGlyph icon={Undo2} label="Undo" />
            <IslandGlyph icon={Redo2} label="Redo" />
          </Island>
        ) : null
      }
    />
  ) : null;

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col",
        /*
          The page's own gutter goes under `floating`. It is the last band on
          the screen — a 20px strip of page showing down both sides of a canvas
          that is supposed to be the surface the islands sit ON — and a canvas
          that stops short of the edge is a pane, which is the shape this style
          exists to stop being. Kept in every other arrangement, where the
          canvas genuinely is one pane among rows.
        */
        floating ? "" : "gap-[14px] px-[var(--page-inset)]",
      )}
    >
      {chrome}

      {/*
        The facet band, and the one place it is NOT a band. Under `floating`
        the same three facets are the top-centre island — see `islands` — so
        this row would be a second copy of the control, drawn as the exact
        full-width strip that arrangement is arguing against.
      */}
      {floating ? null : (
        <ViewBar
          label="Workflow facets"
          views={FACETS}
          activeId={facet}
          onSelect={setFacet}
        />
      )}

      {/*
        The relative box the islands hang off. Always drawn, even under `rows`
        where it holds nothing: a wrapper that appears only in one style is a
        wrapper that can change the canvas's measured height between the two
        screenshots being compared, and a 1px difference there is exactly the
        noise this study keeps failing to ignore.
      */}
      <div className="relative flex min-h-0 flex-1 flex-col">
        {facet === "builder" ? (
          /*
           * The canvas is its own module as of Sep 22 (workflow-canvas), because
           * the chrome study and the canvas study are two different arguments and
           * they were being edited over each other. This file owns everything
           * above this line; below it, the canvas answers only to its own knob —
           * and to `overlays`, which is this page telling it that the floating
           * islands have taken the corners its rafts were sitting in.
           */
          <WorkflowCanvas
            variant={builderCanvas}
            overlays={floating ? "page" : "canvas"}
          />
        ) : (
          /*
           * The two facets that are not the canvas.
           *
           * Deliberately a stage: this prototype is about the header and the
           * shape of the page, and drawing a fake enrollment table here would
           * only invite review of the wrong thing.
           */
          <div className="flex min-h-0 flex-1 items-center justify-center rounded-[11px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <p className="text-[13px] leading-[normal] text-pg-faint">
              {FACETS.find((f) => f.id === facet)?.label} — same page, same header.
            </p>
          </div>
        )}
        {islands}
      </div>
    </div>
  );
}
