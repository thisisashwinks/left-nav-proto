"use client";

/**
 * Switchyard onboarding (Nov 20, polished Nov 23).
 *
 * An existing agency turning Switchyard on usually has a full logo and no
 * square icon, and has never picked a sidebar theme. This walks the agency
 * owner through both before the coachmarks start, so their agency and every
 * sub-account look like them from the first screen. Agency only — sub-account
 * users never see it.
 *
 *   0  Welcome   what's coming, and that it reaches every sub-account
 *   1  Logos     full logo (kept if already uploaded) and sidebar icon;
 *                without an icon, initials on a colour from the logo
 *   2  Theme     suggestions from the logo, then every theme; the old
 *                sidebar CSS notice
 *   ✓  Done      a closing beat, then the coachmarks
 *
 * Two looks (proto `onboardingStyle`):
 *   stepper  step list + live mini sidebar on the left, the step on the right
 *   split    a white card on the left (big two-tone title, full-width
 *            actions), a large live preview of the app on the right
 *
 * No scrim: every change also previews on the real chrome behind it. The
 * theme is kept only on Finish setup; "Skip for now" puts it back.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Clock,
  Compass,
  Check,
  ImagePlus,
  Info,
  LayoutGrid,
  Palette,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { useBranding } from "@/components/branding/branding-provider";
import { useBrand } from "@/components/accounts/brand-store";
import { accounts as ALL_ACCOUNTS, agency } from "@/components/accounts/accounts-data";
import { AccountLogo } from "@/components/accounts/account-logo";
import { useLabs } from "@/components/settings/labs-state";
import { useNavLayout } from "@/components/nav/nav-layout-provider";
import {
  ThemePicker,
  useAgencyLogoColors,
  useLogoThemeSuggestions,
} from "@/components/branding/branding-controls";
import { useModeFor } from "@/components/branding/branding-applier";
import {
  Btn,
  useCoachmarkFrame,
  useEscape,
  usePageTheme,
  useThemeDoor,
  type BrandingScope,
} from "@/components/branding/customize-panel";
import {
  avatarColorFrom,
  avatarTile,
  BRANDING_PRESETS,
  deriveChrome,
  themeFromPreset,
  type BrandingTheme,
} from "@/design/branding";
import { cn } from "@/lib/utils";
import { brandInitials, logoName, trimLogo } from "@/lib/logo-trim";

const AGENCY_ID = agency.id;
const SAMPLE_FULL_LOGO = "/wordmark-acme-agency.svg";
const SAMPLE_ICON = "/icon-acme-agency.svg";
const NEUTRAL = "#475467";
const SUBS = ALL_ACCOUNTS.length.toLocaleString("en-US");

const STEPS = [
  { title: "Welcome", hint: "What's changing" },
  { title: "Logos", hint: "Full logo and icon" },
  { title: "Theme", hint: "Your sidebar colors" },
] as const;

/** Same rule as the rail's (account-rail initialsFor), kept local to avoid the import. */
function initialsFor(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[1]![0]!).toUpperCase();
}

/**
 * The agency's full logo, set the way an upload should land (Nov 23): empty
 * margin trimmed so it reads at sidebar size, and the brand name read off it
 * so the agency — and its initials avatar — take that name.
 */
export async function setAgencyFullLogo(
  brand: ReturnType<typeof useBrand>,
  src: string,
  fileName?: string,
) {
  const [trimmed, name] = await Promise.all([trimLogo(src), logoName(src, fileName)]);
  brand.set(AGENCY_ID, "wordmarkSrc", trimmed);
  if (name) {
    brand.setName(AGENCY_ID, { name, initials: brandInitials(name.split(/\s+/)[0]!) });
  }
}

export function clearAgencyFullLogo(brand: ReturnType<typeof useBrand>) {
  brand.clear(AGENCY_ID, "wordmarkSrc");
  brand.setName(AGENCY_ID, null);
}

/* ---------------------------------------------------------------------- */
/* Host: trigger, prior-logo demo state, avatar colour from the logo        */
/* ---------------------------------------------------------------------- */

export function SwitchyardOnboardingHost() {
  const { proto, onboardingOpen, setOnboardingOpen } = useBranding();
  const { agencyOn } = useLabs();
  const { state } = useNavLayout();
  const agencyUser = state.role === "agency";

  // Labs › Switchyard turned on (off → on) by the agency owner: onboard.
  const was = React.useRef(agencyOn);
  React.useEffect(() => {
    if (!was.current && agencyOn && agencyUser && proto.onboarding && proto.access === "edit") {
      setOnboardingOpen(true);
    }
    was.current = agencyOn;
  }, [agencyOn, agencyUser, proto.onboarding, proto.access, setOnboardingOpen]);

  return (
    <>
      <AvatarFromLogo />
      {onboardingOpen && agencyUser ? <OnboardingModal onClose={() => setOnboardingOpen(false)} /> : null}
    </>
  );
}

/**
 * No square icon: the initials avatar takes its colour from the full logo,
 * and follows it when the logo changes — until someone picks a colour.
 */
function AvatarFromLogo() {
  const { proto } = useBranding();
  const { uploads, avatars, setAvatar } = useBrand();
  const colors = useAgencyLogoColors();
  const tile = avatars[AGENCY_ID];
  const hasLogo = Boolean(uploads[AGENCY_ID]?.wordmarkSrc);
  const first = colors[0];

  React.useEffect(() => {
    if (tile?.custom) {
      // A picked colour keeps its hue; only the style follows the control.
      const next = avatarTile(tile.color, proto.avatarStyle);
      if (next.to !== tile.to) setAvatar(AGENCY_ID, { ...tile, ...next });
      return;
    }
    if (!hasLogo || !first) {
      if (tile) setAvatar(AGENCY_ID, null);
      return;
    }
    const color = avatarColorFrom(first);
    const next = avatarTile(color, proto.avatarStyle);
    if (tile?.from !== next.from || tile?.to !== next.to) {
      setAvatar(AGENCY_ID, { ...next, color, custom: false });
    }
  }, [tile, hasLogo, first, proto.avatarStyle, setAvatar]);
  return null;
}

/* ---------------------------------------------------------------------- */
/* The modal: shared state, two looks                                      */
/* ---------------------------------------------------------------------- */

interface Flow {
  step: number;
  done: boolean;
  theme: BrandingTheme;
  setTheme: (t: BrandingTheme) => void;
  next: () => void;
  back: () => void;
  later: () => void;
  close: () => void;
}

function OnboardingModal({ onClose }: { onClose: () => void }) {
  const { proto } = useBranding();
  const brand = useBrand();
  const scope = React.useMemo<BrandingScope>(() => ({ accountId: null }), []);
  const door = useThemeDoor(scope);
  const [step, setStep] = React.useState(0);
  const [done, setDone] = React.useState(false);

  // An existing agency arrives with the full logo it already uploaded.
  const seeded = React.useRef(false);
  React.useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    if (proto.priorLogos === "full" && !brand.uploads[AGENCY_ID]?.wordmarkSrc) {
      void setAgencyFullLogo(brand, SAMPLE_FULL_LOGO);
    }
  }, [proto.priorLogos, brand]);

  const { revert, changed } = door;
  const later = React.useCallback(() => {
    if (!done && changed) revert();
    onClose();
  }, [done, changed, revert, onClose]);
  useEscape(later);

  const flow: Flow = {
    step,
    done,
    theme: door.value,
    setTheme: door.write,
    next: () => {
      if (step < STEPS.length - 1) return setStep(step + 1);
      door.save("You're all set. Your logo and theme are live.");
      setDone(true);
    },
    back: () => setStep((s) => Math.max(0, s - 1)),
    later,
    close: onClose,
  };

  return proto.onboardingStyle === "split" ? <SplitLook flow={flow} /> : <StepperLook flow={flow} />;
}

/** The dialog frame both looks share: centred, no scrim, coachmark edge. */
function Frame({
  width,
  height,
  className,
  children,
}: {
  width: number;
  height?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const pageTheme = usePageTheme();
  const frame = useCoachmarkFrame(pageTheme === "dark");
  return createPortal(
    <div data-page-theme={pageTheme} className="fixed inset-0 z-[95] flex items-center justify-center p-[16px] font-sans">
      <div aria-hidden="true" className="absolute inset-0" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Set up Switchyard"
        style={{
          width,
          ...(height ? { height: `min(${height}px, calc(100dvh - 32px))` } : { maxHeight: "calc(100dvh - 32px)" }),
          borderColor: frame.edge,
          boxShadow: frame.shadow,
        }}
        className={cn(
          "motion-panel-in relative flex max-w-full overflow-hidden rounded-[12px] border border-solid bg-pg-surface",
          className,
        )}
      >
        {children}
      </div>
      <style>{`
        @keyframes ob-in { from { opacity: 0; transform: translate3d(0, 6px, 0); } to { opacity: 1; transform: none; } }
        .ob-in { animation: ob-in 240ms var(--ease-out, ease-out) both; }
        @keyframes ob-pop { 0% { transform: scale(.6); opacity: 0; } 60% { transform: scale(1.08); opacity: 1; } 100% { transform: scale(1); } }
        .ob-pop { animation: ob-pop 420ms var(--ease-out, ease-out) both; }
        @keyframes ob-burst { 0% { transform: translate(0, 0) scale(.4); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(var(--bx), var(--by)) scale(1); opacity: 0; } }
        .ob-burst { animation: ob-burst 900ms var(--ease-out, ease-out) both; }
        @keyframes ob-float { 0%, 100% { transform: rotate(3deg) translateY(0); } 50% { transform: rotate(3deg) translateY(-5px); } }
        .ob-float { animation: ob-float 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .ob-in, .ob-pop, .ob-burst, .ob-float { animation: none !important; } .ob-burst { opacity: 0; } }
      `}</style>
    </div>,
    document.body,
  );
}

/* ---------------------------------------------------------------------- */
/* Look 1 — stepper                                                        */
/* ---------------------------------------------------------------------- */

const STEP_COPY = [
  { title: "Welcome to Switchyard", sub: "Make the new sidebar yours in about 2 minutes." },
  { title: "Add your logos", sub: "They show in your sidebar right away." },
  { title: "Pick a theme", sub: "Each theme previews live, here and behind this window." },
];

function StepperLook({ flow }: { flow: Flow }) {
  const { step, done } = flow;
  return (
    <Frame width={880} height={620}>
      {/* Left: steps + live preview */}
      <aside className="flex w-[248px] shrink-0 flex-col gap-[20px] bg-[linear-gradient(170deg,var(--hr-primary-50),var(--pg-bg)_70%)] p-[20px] shadow-[inset_-1px_0_0_0_var(--pg-border)]">
        <div className="flex items-center gap-[8px]">
          <span className="flex size-[28px] items-center justify-center rounded-[8px] bg-[var(--hr-primary-600)] text-white">
            <Sparkles size={15} aria-hidden="true" />
          </span>
          <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Set up Switchyard</span>
        </div>
        <ol className="flex flex-col">
          {STEPS.map((s, i) => {
            const state = done || i < step ? "done" : i === step ? "now" : "next";
            return (
              <li key={s.title} className="relative flex gap-[10px] pb-[16px] last:pb-0">
                {i < STEPS.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-[26px] bottom-[2px] left-[11px] w-[2px] rounded-full transition-colors",
                      state === "done" ? "bg-[var(--hr-primary-600)]" : "bg-[var(--pg-border)]",
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative flex size-[24px] shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                    state === "done" && "bg-[var(--hr-primary-600)] text-white",
                    state === "now" && "bg-pg-surface text-[var(--hr-primary-600)] shadow-[inset_0_0_0_2px_var(--hr-primary-600)]",
                    state === "next" && "bg-pg-surface text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                  )}
                >
                  {state === "done" ? <Check size={13} strokeWidth={3} aria-hidden="true" /> : i + 1}
                </span>
                <span className="flex min-w-0 flex-col pt-[2px]">
                  <span className={cn("text-[13px] leading-[18px] font-medium", state === "next" ? "text-pg-muted" : "text-pg-heading")}>
                    {s.title}
                  </span>
                  <span className="text-[12px] leading-[16px] text-pg-muted">{s.hint}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-auto flex flex-col gap-[6px] text-[12px] leading-[16px] text-pg-muted">
          <span className="flex items-center gap-[6px]">
            <Clock size={12} aria-hidden="true" />
            About 2 minutes
          </span>
          <span className="flex items-center gap-[6px]">
            <Building2 size={12} aria-hidden="true" />
            Applies to all {SUBS} sub-accounts
          </span>
        </div>
      </aside>

      {/* Right: the step */}
      <section className="flex min-w-0 flex-1 flex-col">
        {done ? (
          <DoneView flow={flow} />
        ) : step === 0 ? (
          <>
            <div className="ob-in relative min-h-0 flex-1 overflow-y-auto">
              <div className="absolute top-[12px] right-[12px] z-[1]">
                <CloseButton onClick={flow.later} />
              </div>
              <WelcomeHero />
            </div>
            <footer className="flex shrink-0 items-center gap-[12px] px-[24px] py-[14px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
              <span className="flex-1" />
              <Btn tone="ghost" onClick={flow.later}>Skip for now</Btn>
              <Btn tone="primary" autoFocus onClick={flow.next}>Get started</Btn>
            </footer>
          </>
        ) : (
          <>
            <header className="flex shrink-0 items-start gap-[12px] px-[24px] pt-[20px] pb-[12px]">
              <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                <h2 className="text-[18px] leading-[26px] font-semibold text-pg-heading">{STEP_COPY[step]!.title}</h2>
                <p className="text-[13px] leading-[18px] text-pg-muted">{STEP_COPY[step]!.sub}</p>
              </div>
              <CloseButton onClick={flow.later} />
            </header>
            <div key={step} className="ob-in min-h-0 flex-1 overflow-y-auto px-[24px] pb-[16px]">
              <StepBody flow={flow} columns={3} />
            </div>
            <footer className="flex shrink-0 items-center gap-[12px] px-[24px] py-[14px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
              {step > 0 ? (
                <Btn tone="ghost" onClick={flow.back}>
                  <ArrowLeft size={15} aria-hidden="true" />
                  Back
                </Btn>
              ) : null}
              <span className="flex-1" />
              <Btn tone="ghost" onClick={flow.later}>Skip for now</Btn>
              <Btn tone="primary" autoFocus onClick={flow.next}>
                {step === 0 ? "Get started" : step === STEPS.length - 1 ? "Finish setup" : "Continue"}
              </Btn>
            </footer>
          </>
        )}
      </section>
    </Frame>
  );
}

/* ---------------------------------------------------------------------- */
/* Look 2 — split (card + big preview)                                     */
/* ---------------------------------------------------------------------- */

const SPLIT_COPY = [
  { a: "Your sidebar,", b: "your brand." },
  { a: "Add your logos.", b: "Shown everywhere." },
  { a: "Pick a theme.", b: "See it live." },
];

function SplitLook({ flow }: { flow: Flow }) {
  const { step, done } = flow;
  const { uploads } = useBrand();
  const up = uploads[AGENCY_ID] ?? {};
  return (
    <Frame width={1040} height={640} className="bg-pg p-[8px]">
      {/* Left: the white card */}
      <section className="relative flex w-[420px] shrink-0 flex-col rounded-[10px] bg-pg-surface shadow-[0_1px_2px_rgba(16,24,40,0.06),inset_0_0_0_1px_var(--pg-border)]">
        <div className="absolute top-[12px] right-[12px]">
          <CloseButton onClick={flow.later} />
        </div>
        {done ? (
          <DoneView flow={flow} narrow />
        ) : (
          <div key={step} className="ob-in flex min-h-0 flex-1 flex-col px-[32px] pt-[32px] pb-[24px]">
            <div className="flex h-[36px] items-center">
              {up.wordmarkSrc ? (
                <img src={up.wordmarkSrc} alt="" className="h-[32px] w-auto max-w-[200px] object-contain object-left" />
              ) : (
                <span className="flex size-[36px] items-center justify-center rounded-[10px] bg-[var(--hr-primary-600)] text-white">
                  <Sparkles size={18} aria-hidden="true" />
                </span>
              )}
            </div>
            <h2 className="mt-[24px] text-[28px] leading-[34px] font-semibold tracking-[-0.02em] text-pg-heading">
              {SPLIT_COPY[step]!.a}
              <br />
              <span className="text-pg-faint">{SPLIT_COPY[step]!.b}</span>
            </h2>
            <div className="mt-[20px] min-h-0 flex-1 overflow-y-auto">
              <StepBody flow={flow} columns={2} narrow />
            </div>
            <div className="mt-[16px] flex flex-col gap-[8px]">
              <button
                type="button"
                autoFocus
                onClick={flow.next}
                className="motion-tap h-[40px] w-full rounded-[8px] bg-pg-heading text-[14px] font-medium text-pg-surface hover:opacity-90 active:scale-[0.99]"
              >
                {step === 0 ? "Get started" : step === STEPS.length - 1 ? "Finish setup" : "Continue"}
              </button>
              <div className="flex items-center gap-[8px]">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={flow.back}
                    className="motion-tap h-[36px] flex-1 rounded-[8px] bg-pg text-[14px] font-medium text-pg-text hover:bg-pg"
                  >
                    Back
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={flow.later}
                  className="motion-tap h-[36px] flex-1 rounded-[8px] bg-pg text-[14px] font-medium text-pg-muted hover:bg-pg hover:text-pg-text"
                >
                  Skip for now
                </button>
              </div>
              <div className="mt-[4px] flex justify-center gap-[6px]" aria-hidden="true">
                {STEPS.map((s, i) => (
                  <span
                    key={s.title}
                    className={cn(
                      "h-[6px] rounded-full transition-all",
                      i === step ? "w-[18px] bg-pg-heading" : "w-[6px] bg-[var(--pg-border-strong)]",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Right: the big live preview */}
      <div className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden pl-[24px]">
        <div className="w-full translate-x-[24px]">
          <PreviewMock theme={flow.theme} height={470} full />
        </div>
      </div>
    </Frame>
  );
}

/* ---------------------------------------------------------------------- */
/* Step bodies (shared)                                                    */
/* ---------------------------------------------------------------------- */

function StepBody({ flow, columns, narrow = false }: { flow: Flow; columns: number; narrow?: boolean }) {
  if (flow.step === 0) return <WelcomeStep narrow={narrow} />;
  if (flow.step === 1) return <LogosStep narrow={narrow} />;
  return (
    <div className="flex flex-col gap-[16px]">
      <Callout icon={<Info size={15} aria-hidden="true" />}>
        Your custom sidebar CSS won&apos;t apply to the new sidebar. Your theme replaces it.
      </Callout>
      <ThemePicker value={flow.theme} onChange={flow.setTheme} columns={columns} />
    </div>
  );
}

function WelcomeStep({ narrow }: { narrow: boolean }) {
  const items = [
    { Icon: LayoutGrid, title: "A new sidebar", body: "Products grouped into categories, with search and pins." },
    { Icon: ImagePlus, title: "Your logos", body: "Your full logo up top, your icon in the rail." },
    { Icon: Palette, title: "Your colors", body: "A theme suggested from your logo, or one you pick." },
  ];
  if (narrow) {
    return (
      <div className="flex flex-col gap-[14px]">
        {items.map(({ Icon, title }) => (
          <div key={title} className="flex items-center gap-[10px] text-[15px] leading-[22px] text-pg-heading">
            <Icon size={17} aria-hidden="true" className="text-pg-muted" />
            {title}
          </div>
        ))}
        <p className="mt-[6px] text-[13px] leading-[18px] text-pg-muted">
          Applies to your agency and all {SUBS} sub-accounts under it.
        </p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-[16px]">
      <div className="grid grid-cols-3 gap-[12px]">
        {items.map(({ Icon, title, body }) => (
          <div key={title} className="flex flex-col gap-[10px] rounded-[10px] bg-pg p-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <span className="flex size-[32px] items-center justify-center rounded-[8px] bg-pg-surface text-[var(--hr-primary-600)] shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
              <Icon size={16} aria-hidden="true" />
            </span>
            <span className="text-[14px] leading-[20px] font-medium text-pg-heading">{title}</span>
            <span className="text-[13px] leading-[18px] text-pg-muted">{body}</span>
          </div>
        ))}
      </div>
      <Callout icon={<Building2 size={15} aria-hidden="true" />}>
        Applies to your agency and all {SUBS} sub-accounts under it.
      </Callout>
    </div>
  );
}

function LogosStep({ narrow }: { narrow: boolean }) {
  const { proto } = useBranding();
  const brand = useBrand();
  const { uploads, set, clear, avatars, setAvatar } = brand;
  const up = uploads[AGENCY_ID] ?? {};
  const tile = avatars[AGENCY_ID];
  const colors = useAgencyLogoColors();
  const [iconError, setIconError] = React.useState<string | null>(null);
  const initials = useAgencyInitials();

  const logo = { ...agency.logo, ...(tile ? { from: tile.from, to: tile.to, brandTile: true } : {}) };
  const swatches = React.useMemo(() => [...new Set([...colors.map(avatarColorFrom), NEUTRAL])], [colors]);
  const pick = (color: string) =>
    setAvatar(AGENCY_ID, { ...avatarTile(color, proto.avatarStyle), color, custom: true });

  const pickIcon = (dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth, h = img.naturalHeight;
      if (Math.abs(w - h) > 2) return setIconError("Use a square image, like 512 × 512 px.");
      if (w < 128) return setIconError("Use an image at least 128 × 128 px.");
      setIconError(null);
      set(AGENCY_ID, "logoSrc", dataUrl);
    };
    img.src = dataUrl;
  };

  return (
    <div className={cn("grid gap-[12px]", narrow ? "grid-cols-1" : "grid-cols-2")}>
      <UploadTile
        label="Full logo"
        hint="Replaces your agency name at the top of the sidebar."
        spec="Wide · 350 × 180 px · Max 2.5 MB"
        src={up.wordmarkSrc}
        onPick={(src, fileName) => void setAgencyFullLogo(brand, src, fileName)}
        onRemove={() => clearAgencyFullLogo(brand)}
        onSample={() => void setAgencyFullLogo(brand, SAMPLE_FULL_LOGO)}
        preview={
          up.wordmarkSrc ? (
            <img src={up.wordmarkSrc} alt="Full logo" className="max-h-[44px] max-w-[85%] object-contain" />
          ) : null
        }
      />
      <UploadTile
        label="Sidebar icon"
        hint={up.logoSrc ? "Shows in the rail and the collapsed sidebar." : "Optional. Without one, we use your initials."}
        spec="Square · Min 128 × 128 px · Max 2.5 MB"
        src={up.logoSrc}
        error={iconError}
        onPick={pickIcon}
        onRemove={() => {
          setIconError(null);
          clear(AGENCY_ID, "logoSrc");
        }}
        onSample={() => set(AGENCY_ID, "logoSrc", SAMPLE_ICON)}
        preview={
          <AccountLogo
            logo={logo}
            src={up.logoSrc}
            initials={up.logoSrc ? undefined : initials}
            tint
            fit="cover"
            size={52}
            radius={14}
          />
        }
        filled
      >
        {up.logoSrc ? null : (
          <div className="flex flex-wrap items-center gap-[8px]">
            <span className="text-[12px] leading-[16px] text-pg-muted">Background</span>
            {swatches.map((c, i) => {
              const on = (tile?.color ?? NEUTRAL).toLowerCase() === c.toLowerCase();
              const t = avatarTile(c, proto.avatarStyle);
              return (
                <button
                  key={c}
                  type="button"
                  aria-label={i < colors.length ? `Color ${i + 1} from your logo` : "Gray"}
                  aria-pressed={on}
                  onClick={() => pick(c)}
                  className={cn(
                    "motion-tap size-[22px] rounded-full",
                    on
                      ? "shadow-[0_0_0_2px_var(--pg-surface),0_0_0_4px_var(--pg-heading)]"
                      : "shadow-[inset_0_0_0_1px_rgba(16,24,40,0.12)]",
                  )}
                  style={{ background: t.from === t.to ? c : `linear-gradient(135deg, ${t.from}, ${t.to})` }}
                />
              );
            })}
            <label
              title="Custom color"
              className="motion-tap relative flex size-[22px] cursor-pointer items-center justify-center rounded-full text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg"
            >
              <Plus size={13} aria-hidden="true" />
              <span className="sr-only">Custom color</span>
              <input
                type="color"
                value={tile?.color ?? NEUTRAL}
                onChange={(e) => pick(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </div>
        )}
      </UploadTile>
    </div>
  );
}

function DoneView({ flow, narrow = false }: { flow: Flow; narrow?: boolean }) {
  const agencyInitials = useAgencyInitials();
  const { uploads, avatars } = useBrand();
  const suggested = useLogoThemeSuggestions();
  const up = uploads[AGENCY_ID] ?? {};
  const tile = avatars[AGENCY_ID];
  const logo = { ...agency.logo, ...(tile ? { from: tile.from, to: tile.to, brandTile: true } : {}) };
  const preset = [...suggested, ...BRANDING_PRESETS].find((p) => p.id === flow.theme.presetId);
  const themeName = preset?.label ?? "Custom theme";
  const mode = useModeFor(flow.theme);
  const d = deriveChrome(flow.theme, mode);

  const rows = [
    {
      key: "logo",
      label: "Full logo",
      value: up.wordmarkSrc ? "Added" : "Using your agency name",
      art: up.wordmarkSrc ? (
        <img src={up.wordmarkSrc} alt="" className="max-h-[20px] w-auto max-w-[52px] object-contain" />
      ) : (
        <span className="text-[12px] font-semibold text-pg-heading">Aa</span>
      ),
    },
    {
      key: "icon",
      label: "Sidebar icon",
      value: up.logoSrc ? "Added" : "Initials on your color",
      art: (
        <AccountLogo
          logo={logo}
          src={up.logoSrc}
          initials={up.logoSrc ? undefined : agencyInitials}
          tint
          fit="cover"
          size={24}
          radius={7}
        />
      ),
    },
    {
      key: "theme",
      label: "Theme",
      value: themeName,
      art: (
        <span
          className="size-[22px] rounded-full shadow-[inset_0_0_0_1px_rgba(16,24,40,0.12)]"
          style={{ background: `linear-gradient(135deg, ${d.sidebar.bg} 0 50%, ${d.accent} 50% 100%)` }}
        />
      ),
    },
  ];

  return (
    <div className={cn("ob-in relative flex flex-1 flex-col items-center justify-center overflow-hidden text-center", narrow ? "px-[28px] py-[32px]" : "px-[48px] py-[32px]")}>
      {/* Soft glow + a burst of the theme's own colours */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-[-120px] left-1/2 size-[360px] -translate-x-1/2 rounded-full opacity-60 blur-[60px]"
        style={{ background: `radial-gradient(circle, ${d.accent}55, transparent 70%)` }}
      />
      <div className="relative mb-[20px] flex size-[72px] items-center justify-center">
        {Array.from({ length: 10 }, (_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          return (
            <span
              key={i}
              aria-hidden="true"
              className="ob-burst absolute size-[6px] rounded-full"
              style={{
                background: i % 2 ? d.accent : d.sidebar.bg === "#ffffff" ? "var(--hr-primary-600)" : d.sidebar.bg,
                ["--bx" as string]: `${Math.cos(angle) * 54}px`,
                ["--by" as string]: `${Math.sin(angle) * 54}px`,
                animationDelay: `${120 + i * 12}ms`,
              }}
            />
          );
        })}
        <span className="ob-pop flex size-[64px] items-center justify-center rounded-full bg-[var(--hr-success-500,#17b26a)] text-white shadow-[0_0_0_8px_var(--hr-success-50,#ecfdf3),0_12px_24px_-6px_rgba(23,178,106,0.45)]">
          <Check size={30} strokeWidth={3} aria-hidden="true" />
        </span>
      </div>
      <h2 className="relative text-[22px] leading-[30px] font-semibold tracking-[-0.01em] text-pg-heading">You&apos;re all set</h2>
      <p className="relative mt-[6px] max-w-[360px] text-[14px] leading-[20px] text-pg-muted">
        Your agency and all {SUBS} sub-accounts now use your brand.
      </p>

      <ul className="relative mt-[20px] flex w-full max-w-[380px] flex-col overflow-hidden rounded-[10px] text-left shadow-[inset_0_0_0_1px_var(--pg-border)] [&>li+li]:shadow-[inset_0_1px_0_0_var(--pg-border)]">
        {rows.map((r, i) => (
          <li key={r.key} className="ob-in flex items-center gap-[12px] px-[14px] py-[10px]" style={{ animationDelay: `${200 + i * 70}ms` }}>
            <span className="flex h-[32px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-[6px] bg-pg">{r.art}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] leading-[18px] font-medium text-pg-heading">{r.label}</span>
              <span className="truncate text-[12px] leading-[16px] text-pg-muted">{r.value}</span>
            </span>
            <Check size={16} strokeWidth={2.5} aria-hidden="true" className="shrink-0 text-[var(--hr-success-600,#079455)]" />
          </li>
        ))}
      </ul>

      <div className="relative mt-[24px] flex w-full max-w-[380px]">
        <Btn tone="primary" autoFocus className="h-[40px] w-full" onClick={flow.close}>
          Explore Switchyard
        </Btn>
      </div>
      <p className="relative mt-[10px] text-[12px] leading-[16px] text-pg-faint">
        Change any of this later in Settings › Company › White label.
      </p>
    </div>
  );
}

/** The first screen (stepper): a before → after of the sidebar, then the plan. */
function WelcomeHero() {
  const { uploads } = useBrand();
  const up = uploads[AGENCY_ID] ?? {};
  const suggested = useLogoThemeSuggestions();
  const after = suggested.find((p) => p.id === "logo-bold") ?? BRANDING_PRESETS.find((p) => p.id === "royal-velvet")!;
  const afterChrome = deriveChrome(themeFromPreset(after), "light");
  const plan = [
    { Icon: ImagePlus, title: "Add your logos", body: "Full logo up top, icon in the rail", time: "1 min" },
    { Icon: Palette, title: "Pick a theme", body: "We suggest colors from your logo", time: "1 min" },
    { Icon: Compass, title: "Take a quick tour", body: "See what's new in the sidebar", time: "After setup" },
  ];
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <div className="relative flex h-[208px] items-center justify-center gap-[20px] overflow-hidden bg-[radial-gradient(120%_120%_at_50%_0%,var(--hr-primary-50),var(--pg-surface)_70%)] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(var(--pg-border)_1px,transparent_1px)] [background-size:14px_14px] opacity-60 [mask-image:radial-gradient(70%_70%_at_50%_40%,#000,transparent)]" />
        <SidebarSketch bg="#ffffff" fg="#98a2b3" sel="#e8efff" selFg="#155eef" label="HighLevel" muted className="relative -rotate-[4deg] opacity-80" />
        <span className="relative flex size-[32px] items-center justify-center rounded-full bg-pg-surface text-pg-muted shadow-[0_2px_6px_rgba(16,24,40,0.12)]">
          <ArrowRight size={16} aria-hidden="true" />
        </span>
        <SidebarSketch
          bg={afterChrome.sidebar.bg}
          fg={afterChrome.sidebar.muted}
          sel={afterChrome.sidebar.selBg}
          selFg={afterChrome.sidebar.selFg}
          logoSrc={up.wordmarkSrc}
          label={agency.name}
          className="ob-float relative rotate-[3deg]"
        />
      </div>
      {/* Copy + plan */}
      <div className="flex flex-col gap-[16px] px-[24px] pt-[20px] pb-[16px]">
        <div className="flex flex-col gap-[6px]">
          <span className="inline-flex items-center gap-[4px] self-start rounded-full bg-[var(--hr-primary-50)] px-[8px] py-[2px] text-[12px] leading-[16px] font-medium text-[var(--hr-primary-700)]">
            <Sparkles size={12} aria-hidden="true" />
            Switchyard is on
          </span>
          <h2 className="text-[22px] leading-[30px] font-semibold tracking-[-0.01em] text-pg-heading">Make the new sidebar yours</h2>
          <p className="text-[14px] leading-[20px] text-pg-muted">
            Two quick steps and your agency and all {SUBS} sub-accounts look like your brand.
          </p>
        </div>
        <ol className="flex flex-col overflow-hidden rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] [&>li+li]:shadow-[inset_0_1px_0_0_var(--pg-border)]">
          {plan.map(({ Icon, title, body, time }, i) => (
            <li key={title} className="ob-in flex items-center gap-[12px] px-[14px] py-[10px]" style={{ animationDelay: `${120 + i * 60}ms` }}>
              <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] bg-[var(--hr-primary-50)] text-[var(--hr-primary-600)]">
                <Icon size={15} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[14px] leading-[20px] font-medium text-pg-heading">{title}</span>
                <span className="text-[13px] leading-[18px] text-pg-muted">{body}</span>
              </span>
              <span className="shrink-0 text-[12px] leading-[16px] text-pg-faint">{time}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** The agency's initials: from its logo's name when there is one. */
function useAgencyInitials(): string {
  const { names } = useBrand();
  return names[AGENCY_ID]?.initials ?? initialsFor(agency.name);
}

/** A tiny static sidebar for the welcome hero. */
function SidebarSketch({
  bg,
  fg,
  sel,
  selFg,
  label,
  logoSrc,
  muted = false,
  className,
}: {
  bg: string;
  fg: string;
  sel: string;
  selFg: string;
  label: string;
  logoSrc?: string;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("flex h-[150px] w-[150px] flex-col gap-[6px] rounded-[12px] p-[10px] shadow-[0_12px_28px_-8px_rgba(16,24,40,0.28),0_0_0_1px_rgba(16,24,40,0.08)]", className)}
      style={{ background: bg }}
    >
      <div className="flex h-[18px] items-center">
        {logoSrc ? (
          <span className="rounded-[4px] bg-white/90 px-[4px] py-[1px]">
            <img src={logoSrc} alt="" className="h-[12px] w-auto max-w-[110px] object-contain" />
          </span>
        ) : (
          <span className={cn("truncate text-[10px] font-semibold", muted && "opacity-70")} style={{ color: muted ? "#475467" : selFg }}>
            {label}
          </span>
        )}
      </div>
      {[64, 48, 72, 56, 40].map((w, i) => (
        <div key={i} className="flex h-[16px] items-center gap-[5px] rounded-[5px] px-[5px]" style={{ background: i === 1 ? sel : undefined }}>
          <span className="size-[7px] rounded-[2px]" style={{ background: i === 1 ? selFg : fg, opacity: i === 1 ? 1 : 0.6 }} />
          <span className="h-[4px] rounded-full" style={{ width: `${w}%`, background: i === 1 ? selFg : fg, opacity: i === 1 ? 0.9 : 0.45 }} />
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Pieces                                                                  */
/* ---------------------------------------------------------------------- */

/** A drop zone that is also the preview; Replace/Remove under it. */
function UploadTile({
  label,
  hint,
  spec,
  src,
  preview,
  filled = false,
  error,
  onPick,
  onRemove,
  onSample,
  children,
}: {
  label: string;
  hint: string;
  spec: string;
  src?: string;
  preview: React.ReactNode;
  /** The preview always has something in it (the initials), even with no upload. */
  filled?: boolean;
  error?: string | null;
  onPick: (dataUrl: string, fileName?: string) => void;
  onRemove: () => void;
  onSample: () => void;
  children?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);
  const read = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onPick(String(reader.result), file.name);
    reader.readAsDataURL(file);
  };
  return (
    <div className="flex flex-col gap-[10px] rounded-[10px] p-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex items-center justify-between gap-[8px]">
        <span className="flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-pg-heading">
          {label}
          {src ? (
            <span className="inline-flex items-center gap-[2px] rounded-full bg-[var(--hr-success-50,#ecfdf3)] px-[7px] text-[11px] leading-[18px] font-medium text-[var(--hr-success-700,#067647)]">
              <Check size={11} strokeWidth={3} aria-hidden="true" />
              Added
            </span>
          ) : null}
        </span>
        {src ? (
          <span className="flex items-center gap-[10px] text-[12px] leading-[16px] font-medium">
            <button type="button" onClick={() => ref.current?.click()} className="motion-tap text-[var(--hr-primary-600)] hover:underline">
              Replace
            </button>
            <button type="button" onClick={onRemove} className="motion-tap text-pg-muted hover:text-pg-heading hover:underline">
              Remove
            </button>
          </span>
        ) : (
          <button type="button" onClick={onSample} className="motion-tap text-[12px] leading-[16px] font-medium text-[var(--hr-primary-600)] hover:underline">
            Use a sample
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          read(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "motion-tap group relative flex h-[96px] w-full flex-col items-center justify-center gap-[6px] overflow-hidden rounded-[8px] transition-colors",
          src || filled
            ? "bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
            : "border-[1.5px] border-dashed border-[var(--pg-border-strong)] text-pg-muted hover:border-[var(--hr-primary-600)] hover:text-[var(--hr-primary-600)]",
          over && "border-[var(--hr-primary-600)] bg-[var(--hr-primary-50)]",
        )}
      >
        {preview ?? (
          <>
            <ImagePlus size={20} aria-hidden="true" />
            <span className="text-[12px] leading-[16px] font-medium">Drop or click to upload</span>
          </>
        )}
        {src || filled ? (
          <span className="absolute right-[6px] bottom-[6px] rounded-[6px] bg-pg-surface/90 px-[6px] py-[2px] text-[11px] leading-[14px] font-medium text-pg-text opacity-0 shadow-[0_1px_2px_rgba(16,24,40,0.1)] transition-opacity group-hover:opacity-100">
            {src ? "Replace" : "Upload"}
          </span>
        ) : null}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          read(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="flex flex-col gap-[2px]">
        <span className="text-[12px] leading-[16px] text-pg-muted">{hint}</span>
        <span className="text-[12px] leading-[16px] text-pg-faint">{spec}</span>
        {error ? (
          <span role="alert" className="text-[12px] leading-[16px] text-[var(--hr-error-600,#d92d20)]">
            {error}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/**
 * The agency's chrome in miniature, painted from the theme being edited and
 * the logos just uploaded. `full` adds the top bar and a canvas.
 */
function PreviewMock({ theme, height, full = false }: { theme: BrandingTheme; height: number; full?: boolean }) {
  const agencyInitials = useAgencyInitials();
  const { proto } = useBranding();
  const { uploads, avatars } = useBrand();
  const up = uploads[AGENCY_ID] ?? {};
  const tile = avatars[AGENCY_ID];
  const mode = useModeFor(theme);
  const d = React.useMemo(
    () => deriveChrome(theme, mode, { railStep: proto.railStep, darkStrength: proto.darkStrength }),
    [theme, mode, proto.railStep, proto.darkStrength],
  );
  const logo = { ...agency.logo, ...(tile ? { from: tile.from, to: tile.to, brandTile: true } : {}) };
  const ground = d.gradient ? { backgroundImage: d.gradient } : { background: d.sidebar.bg };
  const rows = full ? 8 : 5;
  const rail = full ? 44 : 30;
  const avatar = full ? 28 : 20;

  return (
    <div
      aria-hidden="true"
      className="flex overflow-hidden rounded-[10px] shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18),0_0_0_1px_rgba(16,24,40,0.08)] transition-[background] duration-300"
      style={{ height, ...ground }}
    >
      {/* Rail */}
      <div className="flex shrink-0 flex-col items-center gap-[8px] pt-[10px]" style={{ width: rail, ...(d.gradient ? {} : { background: d.rail.bg }) }}>
        <AccountLogo
          logo={logo}
          src={up.logoSrc}
          initials={up.logoSrc ? undefined : agencyInitials}
          tint
          fit="cover"
          size={avatar}
          radius={6}
        />
        <span className="h-px w-[60%]" style={{ background: d.rail.line }} />
        {Array.from({ length: full ? 6 : 4 }, (_, i) => (
          <span key={i} className="rounded-full" style={{ width: avatar - 4, height: avatar - 4, background: d.rail.muted, opacity: 0.35 }} />
        ))}
      </div>
      {/* Sidebar */}
      <div className="flex min-w-0 shrink-0 flex-col gap-[6px] px-[8px] pt-[10px]" style={{ width: full ? 190 : undefined, flex: full ? undefined : 1 }}>
        <div className="flex items-center px-[4px]" style={{ height: avatar }}>
          {up.wordmarkSrc ? (
            <img src={up.wordmarkSrc} alt="" className="w-auto max-w-full object-contain object-left" style={{ height: full ? 20 : 14 }} />
          ) : (
            <span className="truncate font-semibold" style={{ color: d.sidebar.fg, fontSize: full ? 13 : 11 }}>
              {agency.name}
            </span>
          )}
        </div>
        {Array.from({ length: rows }, (_, i) => {
          const sel = i === 1;
          return (
            <div
              key={i}
              className="flex items-center gap-[6px] rounded-[6px] px-[6px]"
              style={{ height: full ? 26 : 18, background: sel ? d.sidebar.selBg : undefined }}
            >
              <span className="shrink-0 rounded-[3px]" style={{ width: full ? 12 : 9, height: full ? 12 : 9, background: sel ? d.sidebar.selFg : d.sidebar.muted, opacity: sel ? 1 : 0.6 }} />
              <span className="h-[5px] rounded-full" style={{ width: `${[62, 48, 70, 54, 40, 66, 50, 58][i]}%`, background: sel ? d.sidebar.selFg : d.sidebar.muted, opacity: sel ? 0.9 : 0.45 }} />
            </div>
          );
        })}
      </div>
      {/* Top bar + canvas */}
      {full ? (
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[44px] shrink-0 items-center gap-[8px] px-[12px]" style={d.gradient ? {} : { background: d.topbar.bg }}>
            <span className="h-[6px] w-[80px] rounded-full" style={{ background: d.topbar.muted, opacity: 0.5 }} />
            <span className="flex-1" />
            <span className="h-[24px] w-[140px] rounded-[6px]" style={{ background: d.topbar.hover }} />
            <span className="size-[20px] rounded-full" style={{ background: d.topbar.muted, opacity: 0.4 }} />
          </div>
          <div className="mr-[8px] mb-[8px] flex flex-1 flex-col gap-[10px] rounded-[8px] bg-white p-[16px] shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
            <span className="h-[10px] w-[40%] rounded-full bg-[#e4e7ec]" />
            <span className="h-[6px] w-[60%] rounded-full bg-[#f2f4f7]" />
            <div className="mt-[6px] grid grid-cols-3 gap-[8px]">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-[64px] rounded-[8px] bg-[#f9fafb] shadow-[inset_0_0_0_1px_#eaecf0]" />
              ))}
            </div>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-[28px] rounded-[6px] bg-[#f9fafb] shadow-[inset_0_0_0_1px_#f2f4f7]" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Skip for now"
      onClick={onClick}
      className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
    >
      <X size={16} aria-hidden="true" />
    </button>
  );
}

function Callout({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-[8px] rounded-[8px] bg-[var(--hr-primary-50)] px-[12px] py-[10px] text-[13px] leading-[18px] text-[var(--hr-primary-700)]">
      <span className="mt-[1px] shrink-0">{icon}</span>
      <span>{children}</span>
    </div>
  );
}
