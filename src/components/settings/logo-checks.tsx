"use client";

/**
 * Smart upload checks (proto `logoChecks`, Nov 26, 2026, Ashwin).
 *
 * After a full logo upload, a pass/fail checklist drawn with the file the
 * user actually uploaded. Every check carries its own picture (Nov 26,
 * Version 1 + 2 of the logo upload flow): the logo where that check is about
 * — in the sidebar's slot, magnified, on a tinted surface, on a light
 * sidebar, on a dark one — so people see what works and what fails instead
 * of reading about it. The logo guidelines stay beside this, not replaced.
 *
 * Fixes live on the failing row:
 *  - too light for light sidebars → "Add a background behind the logo",
 *    black by default, any colour; or move the file to the dark slot.
 *  - fails dark mode → "Add background in dark mode" (proto `logoCheckBg`).
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/components/theme/theme-provider";
import { AlertTriangle, Check, ChevronDown, Eye, Info, X } from "lucide-react";
import { LogoGuidelines, LogoGuidelinesModal } from "@/components/branding/logo-guidelines";
import { useBranding } from "@/components/branding/branding-provider";
import { Switch } from "@/components/settings/controls";
import { cn } from "@/lib/utils";
import {
  DARK_SIDEBAR,
  HEADER_LOGO_BOX,
  LIGHT_BG_DEFAULT,
  darkBgOptedOut,
  darkBgSnapshot,
  darkModeBackdrop,
  failsDarkMode,
  headerLogoSize,
  inkLuminance,
  lightBgFor,
  logoChecks,
  logoTraits,
  setDarkBgOptOut,
  setLightBg,
  subscribeDarkBg,
  type LogoCheck,
  type LogoCheckStatus,
  type LogoTraits,
} from "@/lib/logo-traits";

const MARK: Record<LogoCheckStatus, { icon: React.ReactNode; bg: string; ring: string; sr: string }> = {
  pass: { icon: <Check size={11} strokeWidth={3} />, bg: "bg-[var(--hr-success-600)]", ring: "var(--pg-border)", sr: "Pass: " },
  warn: { icon: <AlertTriangle size={10} strokeWidth={3} />, bg: "bg-[var(--hr-warning-500)]", ring: "color-mix(in oklab, var(--hr-warning-500) 55%, transparent)", sr: "Warning: " },
  fail: { icon: <X size={11} strokeWidth={3} />, bg: "bg-[var(--hr-error-600)]", ring: "color-mix(in oklab, var(--hr-error-600) 55%, transparent)", sr: "Fail: " },
};

const SWATCHES = [
  { c: LIGHT_BG_DEFAULT, name: "Black" },
  { c: "#101828", name: "Gray 900" },
  { c: "#155eef", name: "Blue" },
  { c: "#6e56cf", name: "Purple" },
  { c: "#067647", name: "Green" },
];

function useTraits(src: string | undefined) {
  const [traits, setTraits] = React.useState<{ src: string; t: LogoTraits | null } | null>(null);
  React.useEffect(() => {
    if (!src) return;
    let live = true;
    void logoTraits(src).then((t) => {
      if (live) setTraits({ src, t });
    });
    return () => {
      live = false;
    };
  }, [src]);
  return src && traits?.src === src ? traits.t : null;
}

/** The picture for one check: the logo where that check is about. */
function Shot({
  check,
  src,
  t,
  backdrop,
  compact,
}: {
  check: LogoCheck;
  src: string;
  t: LogoTraits;
  backdrop: string | null;
  compact: boolean;
}) {
  const size = headerLogoSize(t.aspect);
  const scale = compact ? 0.62 : 0.78;
  const w = Math.round(size.width * scale);
  const h = Math.round(size.height * scale);
  // Shape, size, and background are about the file, not the surface: draw
  // them where the logo's own ink shows (a white logo on dark).
  const lightInk = inkLuminance(t) > 0.5;
  const surface =
    check.id === "dark"
      ? DARK_SIDEBAR
      : check.id === "light"
        ? "#ffffff"
        : check.id === "background"
          ? lightInk ? "#344054" : "#eef2f6"
          : lightInk ? DARK_SIDEBAR : "#ffffff";
  let art: React.ReactNode;
  if (check.id === "shape") {
    // The slot the sidebar gives it, dashed, with the logo at its real share.
    art = (
      <span
        className="flex items-center outline-1 outline-offset-0 outline-dashed outline-[#98a2b3]"
        style={{ width: Math.round(HEADER_LOGO_BOX.width * scale), height: Math.round(HEADER_LOGO_BOX.height * scale) }}
      >
        <img src={src} alt="" style={{ width: w, height: h }} className="object-contain object-left" />
      </span>
    );
  } else if (check.id === "size") {
    // The whole logo, enlarged to fill the frame, so a soft file looks soft
    // without being cropped (Nov 26, 2026).
    art = (
      <img src={src} alt="" className="h-full max-h-[40px] w-auto max-w-full object-contain" />
    );
  } else {
    art = (
      <span
        className={cn("inline-flex items-center", backdrop && "rounded-[5px] px-[6px] py-[2px]")}
        style={backdrop ? { background: backdrop } : undefined}
      >
        <img src={src} alt="" style={{ width: w, height: h }} className="object-contain object-left" />
      </span>
    );
  }
  return (
    <div
      className={cn(
        "flex shrink-0 items-center overflow-hidden rounded-[8px]",
        compact ? "h-[56px] w-full px-[10px]" : "h-[64px] w-full px-[12px]",
        check.id === "size" && "justify-center",
      )}
      style={{ background: surface, boxShadow: `inset 0 0 0 1px ${MARK[check.status].ring}` }}
    >
      {art}
    </div>
  );
}

export function LogoChecklist({
  src,
  compact = false,
  darkSrc,
  onUseAsDark,
  bare = false,
}: {
  /** Inside the asset card's footer: no border of its own (Nov 26, 2026). */
  bare?: boolean;
  src: string;
  compact?: boolean;
  /** The uploaded dark-sidebar version, when there is one: dark mode is checked on it. */
  darkSrc?: string;
  /** Light slot holds a white logo: move it to the dark slot. */
  onUseAsDark?: () => void;
}) {
  const { proto } = useBranding();
  React.useSyncExternalStore(subscribeDarkBg, darkBgSnapshot, darkBgSnapshot);
  const t = useTraits(src);
  const dt = useTraits(darkSrc);
  // An accordion (Nov 26, 2026), open on upload.
  const [open, setOpen] = React.useState(true);
  const [guideOpen, setGuideOpen] = React.useState(false);
  const bodyId = React.useId();
  if (!t) return null;

  const lightColor = lightBgFor(src);
  let checks = logoChecks(t);
  // A dark version decides dark mode.
  if (darkSrc && dt) {
    checks = checks.map((c) =>
      c.id !== "dark"
        ? c
        : failsDarkMode(dt)
          ? { id: "dark", status: "fail", title: "Dark version is hard to read in dark mode", detail: "Use a light-coloured version for dark sidebars." }
          : { id: "dark", status: "pass", title: "Dark version reads in dark mode" },
    );
  }
  // A background the user picked fixes the light check.
  checks = checks.map((c) =>
    c.id === "light" && c.status !== "pass" && lightColor
      ? { ...c, status: "pass", title: "Readable on light sidebars", detail: "With the background you added." }
      : c,
  );
  const needsDarkBg0 = !darkSrc && failsDarkMode(t);
  const darkBgOn0 = needsDarkBg0 && proto.logoCheckBg && !darkBgOptedOut(src);
  // The dark-mode background fixes the dark check, the same way.
  checks = checks.map((c) =>
    c.id === "dark" && c.status !== "pass" && darkBgOn0
      ? { ...c, status: "pass", title: "Readable in dark mode", detail: "With the background you added." }
      : c,
  );
  const issues = checks.filter((c) => c.status !== "pass").length;
  const lightFails = logoChecks(t).find((c) => c.id === "light")?.status === "fail";
  const needsDarkBg = !darkSrc && failsDarkMode(t);
  const darkBgOn = needsDarkBg && proto.logoCheckBg && !darkBgOptedOut(src);
  const hasFix = (id: string) => (id === "light" && lightFails) || (id === "dark" && needsDarkBg && proto.logoCheckBg);

  return (
    <section
      aria-label="Logo check"
      className={cn("flex flex-col", !bare && "rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]")}
    >
      <div
        className={cn(
          "flex items-center gap-[6px]",
          // Same height as the guidelines accordion it replaces (48px).
          bare ? "min-h-[32px]" : "min-h-[48px] px-[12px] py-[8px]",
          !bare && open && "shadow-[inset_0_-1px_0_0_var(--pg-border)]",
        )}
      >
        {/*
          Title, then the result in brackets, then the chevron — one toggle.
          Guidelines (button, the default; or the info tooltip) sit far
          right (Nov 26, 2026).
        */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => setOpen((o) => !o)}
          className="motion-tap flex min-w-0 items-center gap-[8px] rounded-[6px] py-[4px] text-left"
        >
          <span
            aria-hidden="true"
            className={cn("flex size-[16px] shrink-0 items-center justify-center rounded-full text-white", issues === 0 ? MARK.pass.bg : checks.some((c) => c.status === "fail") ? MARK.fail.bg : MARK.warn.bg)}
          >
            {issues === 0 ? MARK.pass.icon : checks.some((c) => c.status === "fail") ? MARK.fail.icon : MARK.warn.icon}
          </span>
          <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">Logo check</span>
          <span
            className={cn(
              "text-[13px] leading-[18px] font-medium",
              issues === 0 ? "text-[var(--hr-success-700,#067647)]" : "text-pg-muted",
            )}
          >
            ({issues === 0 ? "Ready to use" : `${issues} ${issues === 1 ? "issue" : "issues"}`})
          </span>
          <ChevronDown size={16} aria-hidden="true" className={cn("shrink-0 text-pg-muted transition-transform", open && "rotate-180")} />
        </button>
        {proto.checkGuide === "tooltip" ? <GuidelinesTip /> : null}
        {proto.checkGuide === "button" ? (
          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className="motion-tap ml-auto flex h-[28px] shrink-0 items-center gap-[6px] rounded-[6px] px-[10px] text-[13px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg"
          >
            <Eye size={14} aria-hidden="true" className="text-pg-muted" />
            Show guidelines
          </button>
        ) : null}
        {guideOpen ? <LogoGuidelinesModal onClose={() => setGuideOpen(false)} /> : null}
      </div>

      {open ? (
      <ul
        id={bodyId}
        className={cn(
          "motion-panel-in grid gap-x-[16px] gap-y-[20px]",
          bare ? "pt-[12px]" : "p-[12px]",
          compact ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        {checks.map((c) => {
          const shownSrc = c.id === "dark" && darkSrc ? darkSrc : src;
          const shownT = c.id === "dark" && darkSrc && dt ? dt : t;
          const backdrop =
            c.id === "light" ? lightColor : c.id === "dark" && darkBgOn ? darkModeBackdrop(t) : null;
          return (
            /*
              Picture over words, 3 to a row. A check with a fix (a switch)
              takes two columns: the check, then its fix beside it (Nov 26).
            */
            <li
              key={c.id}
              className={cn(
                "min-w-0",
                hasFix(c.id) ? "col-span-2 grid grid-cols-2 items-start gap-x-[16px]" : "flex flex-col gap-[8px]",
              )}
            >
              <div className="flex min-w-0 flex-col gap-[8px]">
                <Shot check={c} src={shownSrc} t={shownT} backdrop={backdrop} compact={compact} />
                <span className="flex min-w-0 items-start gap-[8px]">
                  <span
                    aria-hidden="true"
                    className={cn("mt-[2px] flex size-[16px] shrink-0 items-center justify-center rounded-full text-white", MARK[c.status].bg)}
                  >
                    {MARK[c.status].icon}
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[14px] leading-[20px] text-pg-text">
                      <span className="sr-only">{MARK[c.status].sr}</span>
                      {c.title}
                    </span>
                    {c.detail ? <span className="text-[13px] leading-[18px] text-pg-muted">{c.detail}</span> : null}
                  </span>
                </span>
              </div>

              {hasFix(c.id) ? (
              <div className={cn("flex min-w-0 flex-col justify-center gap-[8px]", compact ? "min-h-[56px]" : "min-h-[64px]")}>
              {/* Centred on the picture beside it (its height). */}
              {/* Too light for light sidebars: a background, black by default. */}
              {c.id === "light" && lightFails ? (
                <div className="flex flex-col gap-[8px]">
                  <div className="flex items-center justify-between gap-[12px]">
                    <span className="text-[13px] leading-[18px] font-medium text-pg-text">Add a background behind the logo</span>
                    <Switch
                      on={Boolean(lightColor)}
                      onToggle={() => setLightBg(src, lightColor ? null : LIGHT_BG_DEFAULT)}
                      label="Add a background behind the logo"
                    />
                  </div>
                  {lightColor ? (
                    <div className="flex flex-wrap items-center gap-[6px]">
                      {SWATCHES.map((s) => (
                        <button
                          key={s.c}
                          type="button"
                          aria-label={s.name}
                          aria-pressed={lightColor.toLowerCase() === s.c}
                          onClick={() => setLightBg(src, s.c)}
                          className={cn(
                            "size-[22px] rounded-[6px] shadow-[inset_0_0_0_1px_rgba(16,24,40,0.12)]",
                            lightColor.toLowerCase() === s.c && "outline-2 outline-offset-2 outline-[var(--hr-primary-600)]",
                          )}
                          style={{ background: s.c }}
                        />
                      ))}
                      <label className="relative flex size-[22px] cursor-pointer items-center justify-center rounded-[6px] text-[13px] leading-none text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
                        <span aria-hidden="true">+</span>
                        <input
                          type="color"
                          aria-label="Custom background colour"
                          value={lightColor}
                          onChange={(e) => setLightBg(src, e.target.value)}
                          className="absolute inset-0 cursor-pointer opacity-0"
                        />
                      </label>
                      <span className="text-[12px] leading-[16px] text-pg-muted">
                        {lightColor.toLowerCase() === LIGHT_BG_DEFAULT ? "Black · recommended" : lightColor.toUpperCase()}
                      </span>
                    </div>
                  ) : null}
                  {onUseAsDark ? (
                    <button
                      type="button"
                      onClick={onUseAsDark}
                      className="self-start text-[13px] leading-[18px] font-medium text-[var(--hr-primary-600)] hover:underline"
                    >
                      Or use this as your dark version
                    </button>
                  ) : null}
                </div>
              ) : null}

              {c.id === "dark" && needsDarkBg && proto.logoCheckBg ? (
                <div className="flex items-start justify-between gap-[12px]">
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[13px] leading-[18px] font-medium text-pg-text">Add background in dark mode</span>
                    <span className="text-[12px] leading-[16px] text-pg-muted">
                      {darkBgOn ? "Shown on a light background on dark sidebars." : "Shown as uploaded on dark sidebars."}
                    </span>
                  </span>
                  <Switch on={darkBgOn} onToggle={() => setDarkBgOptOut(src, darkBgOn)} label="Add background in dark mode" />
                </div>
              ) : null}
              </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      ) : null}
    </section>
  );
}

/**
 * The do's and don'ts behind an info icon on the check's heading (Nov 26,
 * 2026): once a logo is uploaded the checks lead, and the guidelines are a
 * hover or focus away instead of a second block on the page.
 */
function GuidelinesTip() {
  /*
   * Rendered in a portal at fixed coordinates (Nov 26, 2026): inside the
   * asset card it was clipped by the card's rounded overflow. Opens under the
   * icon, or above it when there is no room below; kept inside the viewport.
   */
  const { effective } = useTheme();
  const ref = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ left: number; top?: number; bottom?: number } | null>(null);
  const show = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(560, window.innerWidth - 32);
    const left = Math.max(16, Math.min(r.left - 8, window.innerWidth - w - 16));
    const below = window.innerHeight - r.bottom;
    setPos(below > 480 || below > r.top ? { left, top: r.bottom + 6 } : { left, bottom: window.innerHeight - r.top + 6 });
  };
  const hide = () => setPos(null);
  return (
    <span className="relative flex" onMouseEnter={show} onMouseLeave={hide}>
      <button
        ref={ref}
        type="button"
        aria-label="Logo guidelines"
        aria-expanded={pos ? true : undefined}
        onFocus={show}
        onBlur={hide}
        onKeyDown={(e) => {
          if (e.key === "Escape") hide();
        }}
        className="motion-tap flex size-[24px] items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg hover:text-pg-muted"
      >
        <Info size={15} aria-hidden="true" />
      </button>
      {pos
        ? createPortal(
            <span
              role="tooltip"
              data-page-theme={effective.appTheme}
              className="pointer-events-none fixed z-[140] max-h-[calc(100vh-32px)] w-[min(560px,calc(100vw-32px))] overflow-y-auto rounded-[8px] bg-pg-surface p-[12px] font-sans shadow-[0_12px_16px_-4px_rgba(16,24,40,0.12),0_4px_6px_-2px_rgba(16,24,40,0.05),0_0_0_1px_var(--pg-border)]"
              style={pos}
            >
              <span className="mb-[8px] block text-[13px] leading-[18px] font-semibold text-pg-heading">Logo guidelines</span>
              <LogoGuidelines compact />
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
