"use client";

import * as React from "react";
import { Check, ChevronDown, Lock, Play } from "lucide-react";
import { headerConfig } from "@/components/header/header-config";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  LAUNCHPAD_SECTIONS,
  sectionPercent,
  type LaunchpadSection,
  type LaunchpadTask,
} from "./launchpad-data";

/**
 * The account's setup guide: what is left to do, and the order to do it in.
 *
 * The one page in the prototype whose job is to be finished with. Everything
 * about it follows from that: the sections are a short list rather than a nav,
 * the rows say how far through each step you are rather than offering a filter
 * over them, and the whole screen is one column of prose — a setup guide that
 * needs its own explaining has already failed.
 *
 * It draws no slot 05, and that is not the page-header axis being ignored. The
 * greeting IS this page's header, it is addressed to a person rather than
 * naming a collection, and a title above it saying "Launchpad" would be the
 * third place in the window carrying that word — the nav's card and the trail's
 * last crumb being the first two.
 */
export function LaunchpadPage({
  sections: authored = LAUNCHPAD_SECTIONS,
  greeting,
  intro,
  progressNote,
}: {
  /** Whose guide this is. Defaults to the shipped sub-account guide. */
  sections?: LaunchpadSection[];
  /** Replaces the default greeting line. */
  greeting?: string;
  /** One line under the greeting. */
  intro?: string;
  /** One line under the progress bar. */
  progressNote?: string;
} = {}) {
  const { effective } = useTheme();
  /*
   * Steps finished from this page with "Mark as done".
   *
   * Held here rather than in the list because the section's bar has to move
   * the moment a row is ticked off, and the bar is a sibling of the list.
   */
  const [marked, setMarked] = React.useState<ReadonlySet<string>>(new Set());
  const sections = React.useMemo(
    () =>
      authored.map((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (marked.has(t.id) ? { ...t, percent: 100 } : t)),
      })),
    [authored, marked],
  );
  const [sectionId, setSectionId] = React.useState(sections[0]!.id);
  const section = sections.find((s) => s.id === sectionId) ?? sections[0]!;
  const firstName = headerConfig.userName.split(" ")[0];

  return (
    <div
      data-page-theme={effective.appTheme}
      className="flex h-full min-h-0 gap-[24px] overflow-y-auto px-[var(--page-inset)] py-[16px]"
    >
      <SectionRail
        sections={sections}
        activeId={section.id}
        onSelect={setSectionId}
      />

      {/*
        1160px is the HighRise body width, and this column is the body: the
        rows are one line of prose each, and prose measured across a 27-inch
        canvas is a line nobody's eye can return from.
      */}
      <div className="flex min-w-0 max-w-[1160px] flex-1 flex-col gap-[16px] pb-[24px]">
        <div className="flex flex-col gap-[2px]">
          <h1 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
            {greeting ?? (
              <>
                Hey {firstName}, here&rsquo;s your setup list with everything
                you need to get started.
              </>
            )}
          </h1>
          {intro ? (
            <p className="text-[13px] leading-[18px] text-pg-muted">{intro}</p>
          ) : null}
        </div>

        <SectionProgress section={section} note={progressNote} />

        {/*
          One card, not one card per task.

          The steps are a sequence — each is only worth doing because the one
          above it is done — and six cards with six shadows says six unrelated
          things. Hairlines between rows keep the sequence and let the open row
          grow without the list coming apart.

          Keyed by section so opening a step, switching section and coming back
          does not find the other list's row open underneath.
        */}
        <TaskList
          key={section.id}
          section={section}
          onMarkDone={(id) => setMarked((prev) => new Set(prev).add(id))}
        />
      </div>
    </div>
  );
}

/* ─── The sections ──────────────────────────────────────────────────────── */

/**
 * Two sections, listed rather than tabbed.
 *
 * A tab strip says "two views of one thing"; these are two stretches of one
 * sequence, and the left column is where the eye goes back to see how much of
 * the whole is left. It is also where a third and fourth section can land
 * without the row above reflowing, which a tab strip cannot promise.
 */
function SectionRail({
  sections,
  activeId,
  onSelect,
}: {
  sections: LaunchpadSection[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Setup guide"
      className="sticky top-0 hidden w-[232px] shrink-0 flex-col gap-[8px] pt-[2px] lg:flex"
    >
      <h2 className="px-[10px] text-[16px] leading-[22px] font-semibold text-pg-heading">
        Setup guide
      </h2>
      <ul className="flex flex-col gap-[2px]">
        {sections.map((s) => {
          const active = s.id === activeId;
          return (
            <li key={s.id}>
              <button
                type="button"
                aria-current={active ? "page" : undefined}
                onClick={() => onSelect(s.id)}
                className={cn(
                  "motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left",
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-pg-text hover:bg-pg-row-border",
                )}
              >
                <s.icon
                  size={16}
                  aria-hidden="true"
                  className={cn("shrink-0", active ? "text-brand" : "text-pg-muted")}
                />
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[14px] leading-[20px]",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {s.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * The section's own meter, stated in the words of the section it measures.
 *
 * "Your foundational setup progress" rather than "Progress": the number is the
 * average of the steps below it and nothing else on the page, and a bar
 * labelled generically on a page with two section totals is a bar you have to
 * work out.
 */
function SectionProgress({
  section,
  note,
}: {
  section: LaunchpadSection;
  note?: string;
}) {
  const percent = sectionPercent(section);
  return (
    <div className="flex flex-col gap-[8px]">
      <p className="text-[13px] leading-[18px] text-pg-muted">
        Your {inSentence(section.label)} progress
      </p>
      <div className="flex items-center gap-[12px]">
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${section.label} progress`}
          className="h-[8px] min-w-0 flex-1 overflow-hidden rounded-full bg-pg-row-border"
        >
          <div
            className="h-full rounded-full bg-brand motion-move"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="shrink-0 text-[14px] leading-[20px] font-semibold text-pg-heading tabular-nums">
          {percent}%
        </span>
      </div>
      {note ? (
        <p className="text-[13px] leading-[18px] text-pg-muted">{note}</p>
      ) : null}
    </div>
  );
}

/* ─── The steps ─────────────────────────────────────────────────────────── */

function TaskList({
  section,
  onMarkDone,
}: {
  section: LaunchpadSection;
  onMarkDone: (id: string) => void;
}) {
  /*
   * Open on the first thing left to do.
   *
   * Not the first row: three finished steps expanding a tutorial for work
   * already done is the guide congratulating itself at the top of the page.
   * With everything finished nothing opens, which is the honest end state —
   * there is no next step to show.
   */
  const [openId, setOpenId] = React.useState<string | null>(
    () => section.tasks.find((t) => t.percent < 100)?.id ?? null,
  );

  return (
    <div className="overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      {section.tasks.map((task, i) => {
        const blocker = task.lockedBy
          ? section.tasks.find((t) => t.id === task.lockedBy)
          : undefined;
        return (
          <TaskRow
            key={task.id}
            task={task}
            first={i === 0}
            open={openId === task.id}
            locked={blocker !== undefined && blocker.percent < 100 ? blocker : null}
            onToggle={() =>
              setOpenId((current) => (current === task.id ? null : task.id))
            }
            onMarkDone={() => {
              onMarkDone(task.id);
              // On to the next thing left, the same rule the list opened on.
              setOpenId(
                section.tasks.find((t) => t.id !== task.id && t.percent < 100)?.id ??
                  null,
              );
            }}
          />
        );
      })}
    </div>
  );
}

function TaskRow({
  task,
  first,
  open,
  locked,
  onToggle,
  onMarkDone,
}: {
  task: LaunchpadTask;
  /** No rule above the first row — the card's own edge is already there. */
  first: boolean;
  open: boolean;
  /** The unfinished step this one waits on, if any. */
  locked: LaunchpadTask | null;
  onToggle: () => void;
  onMarkDone: () => void;
}) {
  const bodyId = `launchpad-${task.id}`;
  const done = task.percent === 100;
  /*
   * An actionable guide reads its titles as links: the steps still to do are
   * the brand colour, the finished ones step back to body text. The tutorial
   * guide keeps every title in heading ink, as it shipped.
   */
  const actionable = task.action !== undefined || (done && task.tutorial === undefined);
  return (
    <section
      className={cn(
        !first && "border-t border-pg-row-border",
        // The open row takes the page grey, so an expanded step reads as one
        // block rather than as a header with loose furniture under it.
        open && "bg-pg",
      )}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={onToggle}
          className="motion-tap flex w-full items-start gap-[12px] px-[16px] py-[14px] text-left hover:bg-pg-row-border"
        >
          <task.icon
            size={18}
            aria-hidden="true"
            className="mt-[1px] shrink-0 text-pg-muted"
          />
          <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
            <span className="flex flex-wrap items-center gap-x-[8px] gap-y-[4px]">
              <span
                className={cn(
                  "text-[14px] leading-[20px]",
                  !actionable
                    ? "font-semibold text-pg-heading"
                    : done || locked
                      ? "font-medium text-pg-text"
                      : "font-medium text-brand",
                )}
              >
                {task.title}
              </span>
              {task.recommended && !done ? (
                <span className="rounded-[4px] bg-brand-soft px-[6px] py-[1px] text-[12px] leading-[18px] font-medium text-brand">
                  Recommended
                </span>
              ) : null}
            </span>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              {task.blurb}
            </span>
            {locked ? (
              <span className="mt-[2px] flex items-center gap-[4px] text-[12px] leading-[17px] text-pg-muted">
                <Lock size={11} aria-hidden="true" />
                Finish &ldquo;{locked.title}&rdquo; first
              </span>
            ) : null}
          </span>
          {locked ? (
            <span className="mt-[1px] flex shrink-0 items-center gap-[7px] text-pg-muted">
              <Lock size={15} aria-hidden="true" />
              <span className="text-[13px] leading-[18px] font-semibold tabular-nums">
                {task.percent}%
              </span>
            </span>
          ) : (
            <TaskProgress percent={task.percent} done={done} />
          )}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={cn(
              "mt-[2px] shrink-0 text-pg-faint motion-move",
              open && "rotate-180",
            )}
          />
        </button>
      </h3>

      {/*
        Unmounted rather than hidden when it is shut: the body is a poster and
        a heading, nothing is typed into it, and there is no state to preserve
        across an open and a close.
      */}
      {open ? (
        <div id={bodyId} className="flex flex-col gap-[10px] px-[16px] pb-[16px] pl-[46px]">
          {task.action ? (
            locked ? (
              <p className="text-[13px] leading-[18px] text-pg-muted">
                This step opens once &ldquo;{locked.title}&rdquo; is finished.
              </p>
            ) : done ? (
              <p className="text-[13px] leading-[18px] text-pg-muted">
                Done. You can come back and change it anytime.
              </p>
            ) : (
              <div className="flex items-center gap-[16px]">
                <button
                  type="button"
                  onClick={() => showToast(`${task.action} — ${task.title}`)}
                  className="motion-tap text-[13px] leading-[18px] font-medium text-brand hover:underline"
                >
                  {task.action}
                </button>
                <button
                  type="button"
                  onClick={onMarkDone}
                  className="motion-tap text-[13px] leading-[18px] font-medium text-pg-text hover:text-pg-heading"
                >
                  Mark as done
                </button>
              </div>
            )
          ) : task.tutorial ? (
            <>
              <p className="text-[13px] leading-[18px] font-semibold text-pg-heading">
                Watch the tutorial
              </p>
              <TutorialPoster
                title={task.tutorial.title}
                poster={task.tutorial.poster}
              />
            </>
          ) : (
            <p className="text-[13px] leading-[18px] text-pg-muted">
              No tutorial for this one — it is two fields and a save.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

/**
 * How far through the step you are, said once.
 *
 * A finished step gets the tick AND the number rather than the tick alone: the
 * column is a column of percentages, and one row answering a different question
 * from the five under it is a column the eye has to read twice.
 */
function TaskProgress({ percent, done }: { percent: number; done: boolean }) {
  return (
    <span className="mt-[1px] flex shrink-0 items-center gap-[7px]">
      {done ? (
        <span
          aria-hidden="true"
          className="flex size-[17px] items-center justify-center rounded-full bg-[var(--pg-av-green-bg)] text-[var(--pg-av-green-fg)]"
        >
          <Check size={11} strokeWidth={3} />
        </span>
      ) : (
        <PercentRing percent={percent} />
      )}
      <span
        className={cn(
          "text-[13px] leading-[18px] font-semibold tabular-nums",
          done ? "text-[var(--pg-av-green-fg)]" : "text-pg-muted",
        )}
      >
        {percent}%
      </span>
    </span>
  );
}

/**
 * The unfinished step's own dial.
 *
 * A conic gradient rather than an SVG arc: one element, no viewBox to keep in
 * step with the size, and the 0% case comes out as the empty ring on its own
 * — which is exactly what "not started" should look like beside five ticks.
 */
function PercentRing({ percent }: { percent: number }) {
  return (
    <span
      aria-hidden="true"
      className="size-[17px] rounded-full"
      style={{
        background: `conic-gradient(var(--brand) ${percent}%, var(--pg-row-border) 0)`,
        // The hole, punched with a mask so the ring sits on whatever the row's
        // own background happens to be — page grey when the row is open, the
        // card's white when it is not.
        WebkitMask: "radial-gradient(circle, transparent 54%, black 56%)",
        mask: "radial-gradient(circle, transparent 54%, black 56%)",
      }}
    />
  );
}

/**
 * The tutorial, as a poster.
 *
 * No <video>: a prototype that ships a file has a loading state, a codec and a
 * download to argue about, and none of those are what this screen is for. The
 * gradient and the title are what a reader needs to believe there is a video
 * here — and the play button is a real control, so the poster reads as
 * something you press rather than as decoration.
 */
function TutorialPoster({ title, poster }: { title: string; poster: string }) {
  return (
    <button
      type="button"
      aria-label={`Play the tutorial: ${title}`}
      style={{ backgroundImage: poster }}
      className="motion-tap group relative flex h-[92px] w-[168px] shrink-0 flex-col justify-between overflow-hidden rounded-[8px] p-[10px] text-left shadow-[inset_0_0_0_1px_var(--pg-card-border)] active:scale-[0.99]"
    >
      <span className="line-clamp-2 text-[12px] leading-[16px] font-semibold text-white">
        {title}
      </span>
      <span className="flex size-[22px] items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-[2px] group-hover:bg-black/60">
        <Play size={11} fill="currentColor" aria-hidden="true" />
      </span>
    </button>
  );
}

/**
 * A section name mid-sentence: "Foundational setup" reads "foundational
 * setup", but "AI & automations" keeps its acronym.
 */
function inSentence(label: string): string {
  return /^[A-Z]{2}/.test(label) ? label : label.charAt(0).toLowerCase() + label.slice(1);
}
