"use client";

import * as React from "react";
import {
  ArrowRight,
  ArrowUp,
  ChevronDown,
  Globe,
  House,
  LayoutGrid,
  Maximize2,
  Plus,
  Star,
  X,
} from "lucide-react";
import { OutlineButton } from "@/components/page/page-header";
import { accountColorFor } from "@/lib/account-color";
import { useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import type { SurfaceTheme } from "@/design/theme";
import { projectTint } from "./ai-studio-chrome";
import {
  STUDIO_PROJECTS,
  STUDIO_RECENTS,
  STUDIO_TABS,
  type StudioProject,
} from "./ai-studio-data";

/**
 * AI Studio's home, and the sidebar that is the whole argument.
 *
 * Read the block at the top of `ai-studio-page.tsx` before changing anything
 * here: this screen is in the prototype as EVIDENCE, and the parts of it that
 * look like mistakes — a nav that names projects but not products, one
 * unlabelled arrow as the only door — are the findings, drawn accurately.
 *
 * The one thing on this screen that the real product does not have is
 * `onRestore`: the control that hands the platform its chrome back. It exists
 * because the counter-example is only useful next to the alternative, and
 * flipping between the two in one click is how a reviewer sees what the
 * takeover bought and what it cost without alt-tabbing between screenshots.
 * It is a REVIEW instrument, not a proposal — if this pattern ever shipped,
 * the fix would be keeping the platform rail, not adding a restore button.
 */

/** The account the session is in, named so the chip is not a lie. */
const STUDIO_ACCOUNT = { id: "fieldstone", name: "Fieldstone Group" };

interface AiStudioHomeProps {
  /**
   * Whether the shell actually stood down — `navHidden`, never the page's own
   * wish. Nav edit mode outranks the request, and a home that drew its own
   * sidebar on the strength of having ASKED would put two sidebars side by
   * side, which is the one arrangement this study exists to argue against.
   */
  takeover: boolean;
  /** The exit the shell built, or null when there was no chrome to drop. */
  exit: React.ReactNode | null;
  /** Light or dark, for the two derived tints that cannot be one relative colour. */
  theme: SurfaceTheme;
  onOpenProject: (project: StudioProject) => void;
  /** Re-enter the takeover after the back arrow surrendered it. Review-only. */
  onRestore: () => void;
}

export function AiStudioHome({
  takeover,
  exit,
  theme,
  onOpenProject,
  onRestore,
}: AiStudioHomeProps) {
  const [banner, setBanner] = React.useState(true);
  const [tab, setTab] = React.useState<string>(STUDIO_TABS[0]);

  return (
    <div className="flex h-full min-h-0">
      {takeover ? <StudioSidebar exit={exit} /> : null}

      <div className="relative min-h-0 min-w-0 flex-1 overflow-y-auto bg-pg-surface">
        <StudioWash />

        {/* `relative` so the content sits over the wash rather than under it;
            the wash is a sibling rather than a background on this scroller
            because it must stay at the TOP of the page while the grid scrolls
            past, and a background-image would scroll with it. */}
        <div className="relative flex flex-col items-center px-[32px] pt-[16px] pb-[40px]">
          <div className="flex w-full max-w-[1000px] flex-col">
            <div className="flex items-start gap-[10px]">
              {banner ? (
                <StudioBanner onDismiss={() => setBanner(false)} />
              ) : (
                <div className="min-w-0 flex-1" />
              )}
              {/*
                Only while the shell is standing. See the note at the top of
                the file: this is the way BACK INTO the takeover, and it has no
                business being on screen while the takeover is already on —
                there would be nothing for it to do.
              */}
              {takeover ? null : (
                <OutlineButton
                  onClick={onRestore}
                  className="h-[30px] px-[11px] text-[12.5px]"
                  title="Show AI Studio the way the product ships it — full screen, no platform chrome"
                >
                  <Maximize2 size={14} aria-hidden="true" className="text-pg-muted" />
                  Full screen
                </OutlineButton>
              )}
            </div>

            <div className="flex flex-col items-center gap-[16px] pt-[44px] pb-[46px]">
              {/*
                The announcement pill. A link dressed as a chip, which is the
                convention every one of these builders landed on — it is news,
                not an action, and a button-shaped thing that only reads would
                be the fourth control competing with the prompt box below it.
              */}
              <button
                type="button"
                className="motion-tap flex h-[28px] items-center gap-[7px] rounded-full bg-pg-surface pr-[11px] pl-[5px] text-[12.5px] leading-[normal] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-pg-heading"
              >
                <span className="flex h-[18px] items-center rounded-full bg-brand px-[8px] text-[11px] font-semibold text-brand-fg">
                  New
                </span>
                Migrate existing projects to SSR
                <ArrowRight size={13} aria-hidden="true" className="text-pg-faint" />
              </button>

              <h1 className="text-center text-[36px] leading-[44px] font-semibold tracking-[-0.8px] text-pg-heading">
                Let&rsquo;s build so
                <BlinkCaret />
              </h1>

              {/*
                The prompt box. One field, two affordances, and nothing else —
                the attachment and the send. Model pickers and mode toggles all
                belong to the builder, where there is a project for them to
                apply to; putting them here would make the home a settings
                screen you have to get through before you can type.
              */}
              <div className="w-full max-w-[680px] rounded-[16px] bg-pg-surface p-[14px] shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_8px_24px_-12px_rgba(16,24,40,0.18)]">
                <p className="px-[2px] pb-[14px] text-[14px] leading-[20px] text-pg-faint">
                  Describe what you want to build…
                </p>
                <div className="flex items-center gap-[8px]">
                  <button
                    type="button"
                    aria-label="Add context"
                    title="Add context"
                    className="motion-tap flex size-[30px] items-center justify-center rounded-[9px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg hover:text-pg-heading"
                  >
                    <Plus size={16} aria-hidden="true" />
                  </button>
                  <div className="min-w-0 flex-1" />
                  <button
                    type="button"
                    aria-label="Send"
                    title="Send"
                    className="motion-tap flex size-[32px] items-center justify-center rounded-full bg-brand text-brand-fg hover:brightness-110 active:scale-95"
                  >
                    <ArrowUp size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-[4px] pb-[14px]">
              {STUDIO_TABS.map((t) => {
                const on = t === tab;
                return (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(t)}
                    className={cn(
                      "motion-tap h-[30px] rounded-[8px] px-[11px] text-[13px] leading-[normal]",
                      on
                        ? "bg-pg font-semibold text-pg-heading"
                        : "font-medium text-pg-muted hover:text-pg-text",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
              <div className="min-w-0 flex-1" />
              <button
                type="button"
                className="motion-tap flex h-[30px] items-center gap-[5px] rounded-[8px] px-[9px] text-[13px] leading-[normal] font-medium text-pg-muted hover:text-pg-heading"
              >
                Browse all
                <ArrowRight size={13} aria-hidden="true" />
              </button>
            </div>

            {/*
              auto-fill rather than a fixed column count: the grid has to hold
              its shape in BOTH chrome states, and the takeover is ~280px wider
              than the same page with the platform nav beside it. A hard
              `grid-cols-4` would have made every screenshot of the restored
              state look cramped for a reason that has nothing to do with the
              chrome being compared.
            */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(212px,1fr))] gap-[16px]">
              {STUDIO_PROJECTS.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  theme={theme}
                  onOpen={() => onOpenProject(p)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * The studio's own left sidebar — the counter-example, drawn straight.
 *
 * Everything in this column is about PROJECTS. Nothing in it is about the
 * platform: no products, no sub-account switcher that reaches anywhere else,
 * no search over anything but this tool. The account chip is the closest it
 * comes, and it names the tenant rather than the platform — which under
 * white-labelling is precisely the problem, because the tenant's name and mark
 * are the agency's, so the one piece of identity on screen tells you whose
 * agency you are in and not whose software.
 *
 * Drawn at 236px against the platform nav's 280px. Not an accident: a takeover
 * that was also WIDER would be trading two arguments at once, and the only one
 * under review is what happens to orientation.
 */
function StudioSidebar({ exit }: { exit: React.ReactNode | null }) {
  const account = accountColorFor(STUDIO_ACCOUNT.id);
  return (
    <div className="flex w-[236px] shrink-0 flex-col border-r border-[var(--as-rail-line)] bg-[var(--as-rail)]">
      <div className="flex shrink-0 items-center gap-[8px] px-[12px] pt-[12px] pb-[10px]">
        {/*
          The entire way out, and it is this. Built by the shell — see
          full-bleed.tsx — so the page cannot invent one and cannot suppress
          one. Left exactly as the shell hands it over, unlabelled, because a
          label here would be this prototype quietly fixing the finding.
        */}
        {exit}
        <button
          type="button"
          className="motion-tap flex min-w-0 flex-1 items-center gap-[7px] rounded-[8px] px-[5px] py-[4px] hover:bg-[var(--as-rail-hover)]"
        >
          <span
            aria-hidden="true"
            className="size-[20px] shrink-0 rounded-[6px]"
            style={{
              background: `linear-gradient(135deg, ${account.from}, ${account.to})`,
            }}
          />
          <span className="min-w-0 flex-1 truncate text-left text-[13px] leading-[normal] font-medium text-pg-heading">
            {STUDIO_ACCOUNT.name}
          </span>
          <ChevronDown size={13} aria-hidden="true" className="shrink-0 text-pg-faint" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[2px] overflow-y-auto px-[8px] pb-[12px]">
        <RailRow icon={House} label="Home" on />

        <RailHeading>Projects</RailHeading>
        <RailRow icon={LayoutGrid} label="All projects" />
        <RailRow icon={Star} label="Starred" />

        <RailHeading>Recents</RailHeading>
        {STUDIO_RECENTS.map((name) => (
          <RailRow key={name} icon={Globe} label={name} />
        ))}
      </div>
    </div>
  );
}

function RailHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-[8px] pt-[14px] pb-[5px] text-[11px] leading-[normal] font-semibold tracking-[0.5px] text-pg-faint uppercase">
      {children}
    </div>
  );
}

function RailRow({
  icon: Icon,
  label,
  on,
}: {
  icon: React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean }>;
  label: string;
  on?: boolean;
}) {
  return (
    <button
      type="button"
      aria-current={on ? "page" : undefined}
      className={cn(
        "motion-tap flex h-[30px] shrink-0 items-center gap-[8px] rounded-[8px] px-[8px] text-[13px] leading-[normal]",
        on
          ? "bg-[var(--as-rail-on)] font-semibold text-pg-heading shadow-[inset_0_0_0_1px_var(--pg-border)]"
          : "font-medium text-pg-text hover:bg-[var(--as-rail-hover)] hover:text-pg-heading",
      )}
    >
      <Icon size={15} aria-hidden className="shrink-0 text-pg-muted" />
      <span className="min-w-0 truncate">{label}</span>
    </button>
  );
}

/**
 * The gradient wash across the top of the content.
 *
 * Three hue-stepped lobes under a 70px blur rather than one authored image:
 * an asset would be a fixed set of colours sitting on a page whose accent and
 * theme both move, and the first version of this screen used one — it went on
 * looking spring-green after the accent was switched to rose, which is exactly
 * the failure the tuning panel exists to catch.
 *
 * Inert and inset ABOVE the content: it is decoration, and a decoration that
 * can swallow a pointer is a bug report waiting to be filed against the banner
 * it covers.
 */
function StudioWash() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[320px] overflow-hidden"
    >
      <div
        className="absolute inset-[-80px] blur-[70px]"
        style={{
          background: [
            "radial-gradient(42% 70% at 16% 8%, var(--as-wash-green) 0%, transparent 72%)",
            "radial-gradient(46% 76% at 52% 0%, var(--as-wash-accent) 0%, transparent 74%)",
            "radial-gradient(44% 72% at 86% 6%, var(--as-wash-warm) 0%, transparent 72%)",
          ].join(","),
        }}
      />
      {/* The fade into the page. Without it the blurred block has a visible
          horizontal edge at 320px, which reads as a banner rather than as a
          wash. */}
      <div className="absolute inset-x-0 bottom-0 h-[160px] bg-[linear-gradient(to_bottom,transparent,var(--pg-surface))]" />
    </div>
  );
}

/**
 * The enablement banner.
 *
 * Dismissible and nothing more: the X sets local state, which is the honest
 * depth for a prototype — a banner that remembered its dismissal would need a
 * store, and the review is not asking whether this comes back tomorrow.
 */
function StudioBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-[10px] rounded-[10px] bg-pg-surface px-[12px] py-[8px] shadow-[inset_0_0_0_1px_var(--pg-border),0_1px_2px_0_rgba(16,24,40,0.05)]">
      <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-text">
        Enable AI Studio for sub-account users
      </span>
      <OutlineButton className="h-[28px] px-[10px] text-[12.5px]">
        Configure
      </OutlineButton>
      <button
        type="button"
        aria-label="Dismiss"
        title="Dismiss"
        onClick={onDismiss}
        className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[7px] text-pg-faint hover:bg-pg hover:text-pg-text"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * The caret at the end of the headline.
 *
 * A JS interval rather than a keyframe, which is the wrong default and is
 * deliberate here: `motion.css` and `ai.css` are shared by every surface in
 * the app and two other pairs of hands are in them this week, so a global
 * `@keyframes studio-caret` for one ornament on one screen is a shared-file
 * edit bought with nothing. Held in its own component so the 530ms tick
 * re-renders three spans and not the card grid.
 *
 * Solid under `prefers-reduced-motion`, rather than absent: the caret is what
 * makes the headline read as something being typed, and that meaning should
 * not be the thing a motion preference takes away.
 */
function BlinkCaret() {
  const still = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [lit, setLit] = React.useState(true);

  React.useEffect(() => {
    if (still) return;
    const id = setInterval(() => setLit((v) => !v), 530);
    return () => clearInterval(id);
  }, [still]);

  return (
    <span
      aria-hidden="true"
      className={cn(
        "ml-[4px] inline-block h-[30px] w-[3px] translate-y-[3px] rounded-[2px] bg-pg-heading",
        !lit && "opacity-0",
      )}
    />
  );
}

/** One project in the grid: a picture of it, who owns it, and when it moved. */
function ProjectCard({
  project,
  theme,
  onOpen,
}: {
  project: StudioProject;
  theme: SurfaceTheme;
  onOpen: () => void;
}) {
  const owner = accountColorFor(project.id);
  return (
    <button
      type="button"
      onClick={onOpen}
      style={projectTint(project.id, theme)}
      className="motion-tap group flex flex-col gap-[9px] rounded-[12px] bg-pg-surface p-[8px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong),0_8px_20px_-12px_rgba(16,24,40,0.28)]"
    >
      {/*
        A tinted rectangle with three bars in it, not a screenshot. The real
        product renders a live thumbnail of the project; eight of those would
        be eight iframes on a screen whose subject is the sidebar, and the
        grid only has to establish that a card IS a picture of a page.
      */}
      <span
        aria-hidden="true"
        className="flex aspect-[16/10] w-full flex-col justify-end gap-[5px] overflow-hidden rounded-[8px] bg-[linear-gradient(140deg,var(--as-thumb-from),var(--as-thumb-to))] p-[12px]"
      >
        <span className="h-[6px] w-[62%] rounded-full bg-pg-surface opacity-80" />
        <span className="h-[6px] w-[40%] rounded-full bg-pg-surface opacity-60" />
        <span className="h-[6px] w-[50%] rounded-full bg-pg-surface opacity-40" />
      </span>

      <span className="flex min-w-0 items-center gap-[7px] px-[3px]">
        <span
          aria-hidden="true"
          className="flex size-[18px] shrink-0 items-center justify-center rounded-full text-[8px] leading-none font-semibold text-brand-fg"
          style={{
            background: `linear-gradient(135deg, ${owner.from}, ${owner.to})`,
          }}
        >
          {project.owner}
        </span>
        <span className="min-w-0 flex-1 truncate text-[13px] leading-[normal] font-medium text-pg-heading">
          {project.name}
        </span>
      </span>
      <span className="px-[3px] pb-[2px] text-[12px] leading-[normal] text-pg-faint">
        {project.edited}
      </span>
    </button>
  );
}
