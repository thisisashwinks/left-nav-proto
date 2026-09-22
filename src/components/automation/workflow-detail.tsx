"use client";

import * as React from "react";
import { Check, History, Play } from "lucide-react";
import { WorkflowCanvas } from "@/components/automation/workflow-canvas";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { ViewBar } from "@/components/page/view-bar";
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
  } = effective;

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
      */}
      {builderExit === "close" ? exit : null}
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
  const artifactMeta = (
    <div className="flex min-w-0 items-center gap-[8px]">
      <StatusPill status={workflow.status} />
      <span className="truncate text-[13px] leading-[normal] text-pg-muted">
        {workflow.folder} · {workflow.enrolled} enrolled · edited{" "}
        {workflow.updated} by {workflow.updatedBy}
      </span>
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
  const chrome = !barHidden ? (
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

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      {chrome}

      <ViewBar
        label="Workflow facets"
        views={FACETS}
        activeId={facet}
        onSelect={setFacet}
      />

      {facet === "builder" ? (
        /*
         * The canvas is its own module as of Sep 22 (workflow-canvas), because
         * the chrome study and the canvas study are two different arguments and
         * they were being edited over each other. This file owns everything
         * above this line; below it, the canvas answers only to its own knob.
         */
        <WorkflowCanvas variant={builderCanvas} />
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
    </div>
  );
}
