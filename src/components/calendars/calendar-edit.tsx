"use client";

import * as React from "react";
import {
  ArrowLeft,
  CalendarCog,
  ChevronRight,
  Forward,
  Lightbulb,
  LoaderCircle,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import { useShellChrome } from "@/components/shell/full-bleed";
import { BuilderTrail } from "@/components/shell/builder-trail";
import {
  CollabIsland,
  FloatingLayer,
  IdentityIsland,
} from "@/components/shell/floating-chrome";
import { cn } from "@/lib/utils";
import {
  CALENDAR_TYPES,
  calendarById,
  createCalendar,
  emptyDraft,
  formatDuration,
  saveCalendar,
  slugTaken,
  slugify,
  useCalendar,
  type BuilderTarget,
  type CalendarDraft,
} from "./settings/cal-settings-store";
import type { SectionProps } from "./settings/edit-controls";
import { BasicDetailsSection } from "./settings/edit-basic";
import { StaffLocationSection } from "./settings/edit-staff";
import { AvailabilitySection } from "./settings/edit-availability";
import { BookingRulesSection } from "./settings/edit-rules";
import { FormConfirmationSection } from "./settings/edit-form";
import { PaymentsSection } from "./settings/edit-payments";
import { NotificationsSection } from "./settings/edit-notifications";
import { WidgetAppearanceSection } from "./settings/edit-widget";
import { BookingChannelsSection } from "./settings/edit-channels";
import { ShareCalendarModal } from "./settings/share-calendar-modal";
import { TroubleshootView } from "./settings/troubleshoot-view";

export interface CalendarEditProps {
  target: BuilderTarget;
  onBack: () => void;
  /** After Create saves, the builder re-opens itself on the new calendar. */
  onRetarget: (target: BuilderTarget) => void;
}

type SectionId =
  | "basic"
  | "staff"
  | "availability"
  | "rules"
  | "form"
  | "payments"
  | "notifications"
  | "widget"
  | "channels";

interface SectionDef {
  id: SectionId;
  label: string;
  tip: string;
  Body: (p: SectionProps) => React.ReactNode;
}

const CORE: SectionDef[] = [
  {
    id: "basic",
    label: "Basic details",
    tip: "Groups let you share one scheduling link for multiple calendars, allowing customers to choose and book from available options.",
    Body: BasicDetailsSection,
  },
  {
    id: "staff",
    label: "Staff & location",
    tip: "Choose Custom as the meeting location to enter any address or link of your choice.",
    Body: StaffLocationSection,
  },
  {
    id: "availability",
    label: "Availability",
    tip: "The timezone for meetings is set within the selected availability schedule.",
    Body: AvailabilitySection,
  },
  {
    id: "rules",
    label: "Booking rules",
    tip: "Booking rules apply to all meetings on this calendar, regardless of staff availability.",
    Body: BookingRulesSection,
  },
];

const ADVANCED: SectionDef[] = [
  {
    id: "form",
    label: "Form & confirmation",
    tip: "You can include custom contact fields in both form messages and form URLs.",
    Body: FormConfirmationSection,
  },
  {
    id: "payments",
    label: "Payments",
    tip: "Payments are collected during booking and must be completed before the meeting is confirmed.",
    Body: PaymentsSection,
  },
  {
    id: "notifications",
    label: "Notifications & policies",
    tip: "For advanced automation, use Workflows with Appointment Booked trigger.",
    Body: NotificationsSection,
  },
  {
    id: "widget",
    label: "Widget appearance",
    tip: "Language settings for the widget can be changed from Settings → Calendars → Preferences.",
    Body: WidgetAppearanceSection,
  },
  {
    id: "channels",
    label: "Booking channels",
    tip: "Setting up Google Organic Booking allows this calendar to receive bookings directly from Google Search.",
    Body: BookingChannelsSection,
  },
];

const ALL = [...CORE, ...ADVANCED];

type Errors = NonNullable<SectionProps["errors"]>;

/**
 * Calendar settings ▸ Calendars ▸ Create / Edit — the builder.
 *
 * It asks the shell the same five questions every builder in the prototype
 * asks (keep the sidebar, keep the top bar, where the controls go, which
 * exit, rows or floating), so one switch in the tuning panel answers them for
 * this screen too. Inside that chrome it is the live product's shape: a
 * section rail with its quick tip, and one section's card at a time.
 *
 * The draft is local until Save. Every section writes it through one
 * `patch`, the rail only changes which card is visible — all nine stay
 * mounted, so half-typed state inside a section (a revealed label field, a
 * recurrence count) survives a trip to another section and back.
 */
export function CalendarEdit({ target, onBack, onRetarget }: CalendarEditProps) {
  const calendarId = target.calendarId;
  const saved = useCalendar(calendarId);
  const {
    appTheme,
    builderKeepSidebar,
    builderKeepTopBar,
    builderControls,
    builderExit,
    builderChromeStyle,
  } = useTheme().effective;

  const [draft, setDraft] = React.useState<CalendarDraft>(() =>
    target.calendarId === null
      ? target.draft
      : structuredClone(calendarById(target.calendarId)?.draft ?? emptyDraft()),
  );
  const [baseline, setBaseline] = React.useState(draft);
  // A new calendar's slug follows its name until someone edits the slug.
  const [slugTouched, setSlugTouched] = React.useState(
    () => !!target.calendarId || (draft.slug !== "" && draft.slug !== slugify(draft.name)),
  );
  const [errors, setErrors] = React.useState<Errors>({});
  const [section, setSection] = React.useState<SectionId>("basic");
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [sharing, setSharing] = React.useState(false);
  const [troubleshooting, setTroubleshooting] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const dirty = React.useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(baseline),
    [draft, baseline],
  );

  const patch = React.useCallback(
    (p: Partial<CalendarDraft>) => {
      const follow = !slugTouched && !calendarId && p.name !== undefined && p.slug === undefined;
      setDraft((d) => ({ ...d, ...p, ...(follow ? { slug: slugify(p.name!) } : {}) }));
      if (p.slug !== undefined) setSlugTouched(true);
      // Editing a field clears its error; the rest wait for the next Save.
      setErrors((e) => {
        const touched = Object.keys(p).concat(follow ? ["slug"] : []);
        if (!touched.some((k) => k in e)) return e;
        const next = { ...e };
        for (const k of touched) delete next[k as keyof CalendarDraft];
        return next;
      });
    },
    [slugTouched, calendarId],
  );

  const go = (id: SectionId) => {
    setSection(id);
    if (ADVANCED.some((s) => s.id === id)) setAdvancedOpen(true);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const requestBack = () => (dirty ? setConfirmLeave(true) : onBack());

  const save = () => {
    if (saving) return;
    const found: Errors = {};
    if (!draft.name.trim()) found.name = "Please enter a name";
    if (!draft.slug.trim()) found.slug = "Slug is required";
    else if (slugTaken(draft.slug, calendarId ?? undefined)) found.slug = "This URL is already in use";
    if (Object.keys(found).length) {
      setErrors(found);
      go("basic");
      showToast("Fix the highlighted fields to save.");
      return;
    }
    setErrors({});
    setSaving(true);
    // A beat of spinner, as live — an instant save reads as nothing happened.
    window.setTimeout(() => {
      setSaving(false);
      setBaseline(draft);
      if (calendarId) {
        saveCalendar(calendarId, draft);
        showToast("Changes saved");
      } else if (target.calendarId === null) {
        const cal = createCalendar(target.type, draft);
        setSlugTouched(true);
        onRetarget({ calendarId: cal.id });
        showToast("Calendar created");
      }
    }, 450);
  };

  const title = calendarId ? `Edit - ${saved?.draft.name ?? draft.name}` : "Create";
  const type = saved?.type ?? (target.calendarId === null ? target.type : "personal");
  const typeLabel = CALENDAR_TYPES.find((t) => t.id === type)?.label ?? "";

  /*
   * Floating keeps only the two islands that have somewhere safe to sit —
   * identity over the rail, commitment over the gutter beside the form. A
   * form scrolls in a column, so an island anywhere else would sit on a field.
   */
  const floating = builderChromeStyle === "floating";

  const { barHidden, exit, trail } = useShellChrome({
    sidebar: builderKeepSidebar ? "keep" : "drop",
    topBar: builderKeepTopBar ? "keep" : "drop",
    exit: builderExit,
    onExit: requestBack,
    backLabel: "Back to calendars list",
    collapseSidebar: true,
  });

  useRecordCrumb(calendarId ? (saved?.draft.name ?? "Calendar") : "Create", requestBack);

  const commitActions = (
    <div className="flex shrink-0 items-center gap-[12px]">
      <TipButton icon={Forward} label="Share calendar" onClick={() => setSharing(true)} />
      <TipButton
        icon={Wrench}
        label="Troubleshoot calendar"
        onClick={() => setTroubleshooting(true)}
      />
      <PrimaryButton
        onClick={save}
        aria-busy={saving || undefined}
        className="h-[36px] text-[14px] leading-[20px]"
      >
        {saving ? <LoaderCircle size={16} aria-hidden="true" className="animate-spin" /> : null}
        Save changes
      </PrimaryButton>
      {/* The shell hands a ✕ down only under the "Close" exit. */}
      {!floating && builderExit === "close" ? exit : null}
    </div>
  );

  /*
   * The shell hands the page an exit only when it has no bar to hang one in.
   * Under "back" the page draws it as the live product's text link rather
   * than the bare arrow — same move, same gate, just the label spelled out.
   */
  const leadingExit =
    builderExit === "back" && exit ? (
      <button
        type="button"
        onClick={requestBack}
        className="motion-tap flex shrink-0 items-center gap-[8px] rounded-[6px] px-[4px] py-[4px] text-[14px] leading-[20px] text-pg-text hover:text-pg-heading"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to calendars list
      </button>
    ) : null;

  const builderRow = (leading?: React.ReactNode) => (
    <div className="grid h-[56px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-[12px] border-b border-pg-head-border bg-pg-surface px-[16px]">
      <div className="flex min-w-0 items-center gap-[10px]">{leading}</div>
      <h1 className="max-w-[40vw] truncate text-center text-[16px] leading-[24px] font-medium text-pg-heading">
        {title}
      </h1>
      <div className="flex min-w-0 justify-end">{commitActions}</div>
    </div>
  );

  const current = ALL.find((s) => s.id === section)!;
  const advancedLit = ADVANCED.some((s) => s.id === section);

  const railItem = (s: SectionDef) => {
    const on = s.id === section;
    return (
      <button
        key={s.id}
        type="button"
        aria-current={on ? "page" : undefined}
        onClick={() => go(s.id)}
        className={cn(
          "motion-tap flex h-[40px] w-full items-center rounded-[6px] px-[22px] text-left text-[14px] leading-[20px]",
          on ? "bg-brand-soft font-medium text-brand" : "text-pg-text hover:bg-pg-surface",
        )}
      >
        <span className="truncate">{s.label}</span>
      </button>
    );
  };

  return (
    <div data-page-theme={appTheme} className="relative flex h-full min-h-0 flex-col bg-pg">
      {floating ? null : !barHidden ? (
        builderRow()
      ) : builderControls === "back-only" ? (
        builderRow(leadingExit)
      ) : builderControls === "split-rows" ? (
        <>
          <div className="flex h-[34px] shrink-0 items-center gap-[10px] border-b border-pg-border bg-pg-surface px-[14px]">
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={requestBack} />
          </div>
          {builderRow()}
        </>
      ) : (
        builderRow(
          <>
            {leadingExit}
            <BuilderTrail trail={trail} onLeave={requestBack} />
          </>,
        )
      )}

      {floating ? (
        <FloatingLayer
          topLeft={
            <IdentityIsland
              icon={CalendarCog}
              name={title}
              trail={barHidden ? trail : []}
              onLeave={requestBack}
              exit={exit}
            />
          }
          topRight={<CollabIsland commit={commitActions} />}
        />
      ) : null}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
        <div
          className={cn(
            "mx-auto flex w-full max-w-[1360px] gap-[40px] px-[24px] pb-[40px] max-md:flex-col max-md:gap-[16px] max-md:px-[16px]",
            floating ? "pt-[76px]" : "pt-[40px]",
          )}
        >
          <aside className="flex w-[196px] shrink-0 flex-col gap-[4px] self-start md:sticky md:top-0">
            <nav aria-label="Calendar settings sections" className="flex flex-col gap-[4px]">
              {CORE.map(railItem)}
              <button
                type="button"
                aria-expanded={advancedOpen}
                onClick={() => setAdvancedOpen((o) => !o)}
                className={cn(
                  "motion-tap flex h-[40px] w-full items-center gap-[6px] rounded-[6px] pl-[2px] text-left text-[14px] leading-[20px] hover:bg-pg-surface",
                  advancedLit && !advancedOpen ? "font-medium text-brand" : "text-pg-text",
                )}
              >
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  className={cn("shrink-0 transition-transform duration-150", advancedOpen && "rotate-90")}
                />
                Advanced settings
              </button>
              {advancedOpen ? (
                <div className="flex flex-col gap-[4px]">{ADVANCED.map(railItem)}</div>
              ) : null}
            </nav>

            <div className="flex flex-col gap-[6px] pt-[16px] pl-[22px]">
              <span className="flex items-center gap-[8px] text-[14px] leading-[20px] font-medium text-pg-text">
                <Lightbulb size={16} aria-hidden="true" className="text-pg-muted" />
                Quick tip
              </span>
              <p className="text-[13px] leading-[18px] text-pg-muted">{current.tip}</p>
            </div>
          </aside>

          <main className="min-w-0 max-w-[1080px] flex-1">
            {ALL.map(({ id, Body }) => (
              <div key={id} hidden={id !== section}>
                <Body draft={draft} patch={patch} errors={errors} />
              </div>
            ))}
          </main>
        </div>
      </div>

      {confirmLeave ? (
        <Modal
          title="Discard unsaved changes?"
          width={420}
          onClose={() => setConfirmLeave(false)}
          footer={
            <>
              <OutlineButton className="h-[36px] text-[14px]" onClick={() => setConfirmLeave(false)}>
                Keep editing
              </OutlineButton>
              <PrimaryButton
                className="h-[36px] bg-[var(--hr-error-600)] text-[14px] text-white hover:shadow-none"
                onClick={() => {
                  setConfirmLeave(false);
                  onBack();
                }}
              >
                Discard
              </PrimaryButton>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            Your changes to this calendar haven&apos;t been saved. If you go back now, they&apos;ll
            be lost.
          </p>
        </Modal>
      ) : null}

      {sharing ? (
        <ShareCalendarModal
          calendarId={calendarId}
          name={draft.name}
          slug={draft.slug}
          durationLabel={formatDuration(draft)}
          typeLabel={typeLabel}
          onClose={() => setSharing(false)}
        />
      ) : null}

      {troubleshooting ? (
        <TroubleshootView
          name={draft.name || "Untitled calendar"}
          durationLabel={formatDuration(draft)}
          onClose={() => setTroubleshooting(false)}
        />
      ) : null}
    </div>
  );
}

/** A 36px outlined icon button with its name in a dark tooltip below. */
function TipButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <span className="group/tipbtn relative inline-flex">
      <button
        type="button"
        aria-label={label}
        onClick={onClick}
        className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] bg-pg-surface text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg active:scale-95"
      >
        <Icon size={18} aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute top-[calc(100%+8px)] left-1/2 z-50 w-max -translate-x-1/2 rounded-[6px] bg-[var(--hr-gray-900,#101828)] px-[12px] py-[6px] text-[13px] leading-[18px] text-white opacity-0 shadow-lg transition-opacity group-hover/tipbtn:opacity-100 group-focus-within/tipbtn:opacity-100"
      >
        <span
          aria-hidden="true"
          className="absolute -top-[4px] left-1/2 size-[8px] -translate-x-1/2 rotate-45 bg-[var(--hr-gray-900,#101828)]"
        />
        {label}
      </span>
    </span>
  );
}
