import * as React from "react";
import { AccountLogo } from "@/components/accounts/account-logo";
import { cn } from "@/lib/utils";
import type { Account } from "@/components/accounts/accounts-data";
import { useBrandOptional } from "@/components/accounts/brand-store";
import { useBrandingOptional } from "@/components/branding/branding-provider";
import { useSurfacesDark } from "@/components/branding/branding-applier";
import { LOGO_MAX_HEIGHT, TEST_LOGO_SRC, type SubHeaderShows } from "@/design/branding";
import {
  cssColorToRgb,
  inkLuminance,
  logoTraits,
  lowContrast,
  luminance,
  darkBgOptedOut,
  darkBgSnapshot,
  darkModeBackdrop,
  lightBgFor,
  failsDarkMode,
  subscribeDarkBg,
  type LogoTraits,
} from "@/lib/logo-traits";

interface BrandMarkProps {
  account: Account;
  /**
   * A logo set on the nav config, which overrides the account's own. Lets a demo
   * point the header at one fixed asset regardless of which account is current.
   */
  logoSrc?: string;
  alt: string;
  /**
   * False when the caller draws the mark itself — the split header makes the
   * logo its own collapse button and this then renders only the name.
   */
  withMark?: boolean;
  /**
   * Draw THIS identity's logo instead of the account's, keeping the account's
   * name beside it.
   *
   * The agency, when the header is asked to carry it in the trigger rather
   * than on a row of its own — see HEADER_AGENCY_MARKS. It also forces the
   * square-mark rung: the wordmark rung draws a logo that already contains a
   * name, and that name would be the wrong one.
   */
  markAccount?: Account | null;
}

/**
 * The account's identity in the nav header.
 *
 * Three rungs, in order (Aug 25). Production asks agencies for two assets — a
 * wide 350×180 logo and a square one — and which appears is decided by what
 * they actually uploaded, not by a setting. A picker here would be a question
 * with an obvious answer, and a wrong answer available.
 *
 *   1. Wide logo   drawn on its own, no name beside it. The artwork already
 *                  contains the name; setting it twice is the mistake this
 *                  rung exists to avoid.
 *   2. Square mark plus the account name as text. What most accounts have.
 *   3. Neither     the drawn initials tile, plus the name. `account-logo.tsx`
 *                  already owns this fallback, so it needs nothing here.
 *
 * The collapsed rail never reaches rung 1: at 26px a wordmark is illegible, so
 * it always takes the square mark or the initials.
 *
 * The Pencil file gives this a fixed 116px box, which left the switcher chevron
 * stranded ~90px from the end of a short name. It hugs its content instead, so
 * the chevron lands directly beside the name whatever the name's length; long
 * names truncate rather than pushing the header's search button off the edge.
 */
/**
 * A full logo in the nav row, sized by visual weight rather than a fixed
 * height (Nov 23).
 *
 * A fixed 22px height makes a very wide logo long and thin and a compact one
 * a postage stamp. Holding the AREA roughly constant instead — height =
 * sqrt(area / aspect), clamped to the row — gives every logo about the same
 * presence: wide ones a little shorter, squarer ones a little taller, never
 * past the 30px row or the width cap. Pairs with trimLogo, which removes
 * the empty margin that made uploads read small in the first place.
 */
export function Wordmark({
  src,
  alt,
  maxWidth,
  className,
}: {
  src: string;
  alt: string;
  maxWidth?: number;
  className?: string;
}) {
  const [aspect, setAspect] = React.useState<number | null>(null);
  const fixes = useLogoFixes(src);
  const ref = React.useRef<HTMLSpanElement>(null);
  const surface = useSurfaceLuminance(ref, fixes.enabled);
  const fix = fixes.resolve(surface);
  /*
   * "Logo width" (Nov 26, 2026): a fixed box the logo fills by width, its
   * height following the aspect up to LOGO_MAX_HEIGHT — so a wide logo
   * reaches the full width and a squarer one stops at the height cap.
   * A caller's smaller maxWidth (side by side) still wins.
   */
  const logoWidth = useBrandingOptional()?.proto.logoWidth ?? "auto";
  const box = logoWidth === "auto" ? null : Math.min(Number(logoWidth), maxWidth ?? Infinity);
  const cap = box ?? maxWidth ?? 168;
  // A tall or square logo gets a taller row so its name stays readable.
  const height = fix.tall
    ? 40
    : box
      ? aspect
        ? Math.round(Math.min(LOGO_MAX_HEIGHT, box / aspect))
        : 24
      : aspect
        ? Math.round(Math.min(28, Math.max(16, Math.sqrt(2600 / aspect))))
        : 22;
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex min-w-0 shrink items-center",
        fix.plate && "rounded-[6px] px-[8px] py-[3px]",
        fix.box && "overflow-hidden rounded-[6px] shadow-[0_0_0_1px_rgba(16,24,40,0.14)]",
      )}
      style={fix.plate ? { background: fix.plate } : undefined}
    >
      <img
        src={src}
        alt={alt}
        onLoad={(e) => {
          const i = e.currentTarget;
          if (i.naturalWidth && i.naturalHeight) setAspect(i.naturalWidth / i.naturalHeight);
        }}
        style={{ height, maxWidth: cap }}
        className={cn("w-auto object-contain object-left", className)}
      />
    </span>
  );
}

/**
 * "Fix logo edge cases" (proto `logoAutoFix`, Nov 25, 2026): what the header
 * does with a full logo that breaks the guidelines.
 *  tall   aspect under 1.4 (stacked, portrait, square) → a 40px row.
 *  plate  ink too close to the sidebar colour → a contrasting rounded plate.
 *  box    the file carries its own solid background → rounded, with a
 *         hairline, so the box reads as deliberate.
 */
export function useLogoFixes(src: string | undefined) {
  const proto = useBrandingOptional()?.proto;
  const auto = proto?.logoAutoFix ?? false;
  /*
   * Smart upload checks (proto logoChecks, Nov 26, 2026): a logo that fails
   * dark mode gets a backdrop on dark sidebars — its own box colour, else
   * white — unless "Add background in dark mode" is off, in the proto or
   * for this logo.
   */
  const checksBg = (proto?.logoChecks ?? false) && (proto?.logoCheckBg ?? true);
  React.useSyncExternalStore(subscribeDarkBg, darkBgSnapshot, darkBgSnapshot);
  const checksOn = proto?.logoChecks ?? false;
  const enabled = auto || checksBg || checksOn;
  const [traits, setTraits] = React.useState<{ src: string; t: LogoTraits | null } | null>(null);
  React.useEffect(() => {
    if (!enabled || !src) return;
    let live = true;
    void logoTraits(src).then((t) => {
      if (live) setTraits({ src, t });
    });
    return () => {
      live = false;
    };
  }, [enabled, src]);
  const t = enabled && traits && traits.src === src ? traits.t : null;
  return {
    enabled,
    traits: t,
    resolve(surface: number | null): { tall: boolean; plate: string | null; box: boolean } {
      // The user's own background for a too-light logo, on light sidebars.
      const userPlate = checksOn && src && surface !== null && surface >= 0.2 ? lightBgFor(src) : null;
      if (!t) return { tall: false, plate: userPlate, box: false };
      const autoPlate =
        auto && surface !== null && lowContrast(t, surface)
          ? inkLuminance(t) > 0.5
            ? "#1d2939"
            : "#ffffff"
          : null;
      const darkPlate =
        checksBg && src && !darkBgOptedOut(src) && surface !== null && surface < 0.2 && failsDarkMode(t)
          ? darkModeBackdrop(t)
          : null;
      return { tall: auto && t.aspect < 1.4, plate: userPlate ?? autoPlate ?? darkPlate, box: auto && t.opaqueBg };
    },
  };
}

/** Luminance of the sidebar surface where `ref` sits (its --nav-bg). */
export function useSurfaceLuminance(ref: React.RefObject<HTMLElement | null> | null, enabled: boolean): number | null {
  const [lum, setLum] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    if (!enabled) return;
    const el = ref?.current ?? document.querySelector("[data-nav-column]") ?? document.documentElement;
    const css = getComputedStyle(el).getPropertyValue("--nav-bg").trim();
    const rgb = cssColorToRgb(css || "#ffffff");
    const next = rgb ? Math.round(luminance(...rgb) * 1000) / 1000 : null;
    if (next !== lum) setLum(next);
  });
  return lum;
}

/**
 * The same plate and border fixes as the header, around any logo img — for
 * sketches of the sidebar outside the nav, like onboarding (Nov 26, 2026).
 * Reads the surface from the nearest painted ancestor, not the live nav.
 */
export function LogoFixFrame({ src, children }: { src: string; children: React.ReactNode }) {
  const fixes = useLogoFixes(src);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [surface, setSurface] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    if (!fixes.enabled) return;
    let el: HTMLElement | null = ref.current?.parentElement ?? null;
    let bg = "";
    while (el) {
      const c = getComputedStyle(el).backgroundColor;
      if (c && c !== "transparent" && !/rgba\(.*,\s*0\)$/.test(c)) { bg = c; break; }
      el = el.parentElement;
    }
    const rgb = cssColorToRgb(bg || "#ffffff");
    const next = rgb ? Math.round(luminance(...rgb) * 1000) / 1000 : null;
    if (next !== surface) setSurface(next);
  });
  const fix = fixes.resolve(surface);
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex min-w-0 shrink items-center",
        fix.plate && "rounded-[5px] px-[6px] py-[2px]",
        fix.box && "overflow-hidden rounded-[5px] shadow-[0_0_0_1px_rgba(16,24,40,0.14)]",
      )}
      style={fix.plate ? { background: fix.plate } : undefined}
    >
      {children}
    </span>
  );
}

/** One line on what the header did to this logo, or null. */
export function useLogoFixNote(src: string | undefined): string | null {
  const fixes = useLogoFixes(src);
  const surface = useSurfaceLuminance(null, fixes.enabled);
  if (!fixes.enabled || !src) return null;
  const f = fixes.resolve(surface);
  const notes: string[] = [];
  if (f.tall) notes.push("it's tall, so we show it larger in the sidebar");
  if (f.plate) notes.push(`it's ${f.plate === "#ffffff" ? "dark" : "light"}, so we put it on a ${f.plate === "#ffffff" ? "light" : "dark"} backdrop to keep it readable`);
  if (f.box) notes.push("it has its own background, so we rounded its corners and added a thin border");
  if (!notes.length) return null;
  const text = notes.length > 1 ? notes.slice(0, -1).join(", ") + ", and " + notes.at(-1) : notes[0]!;
  return `We adjusted your logo: ${text}.`;
}

/**
 * The agency's uploaded full logo, for a sub-account header that has none of
 * its own (proto subAgencyLogo, Nov 25, 2026) — shown with the sub-account
 * name under it. Null for the agency itself, or when the sub-account has its
 * own logo showing.
 */
export function useAgencyLogoFallback(account: Account, logoSrc?: string): string | null {
  const proto = useBrandingOptional()?.proto;
  const up = useBrandOptional()?.uploads.agency;
  // Dark sidebar + agency dark logos on: the dark version (Nov 26, 2026).
  const sidebarDark = useSurfacesDark().sidebar;
  const agencySrc =
    sidebarDark && (proto?.darkLogosAgency ?? true) && up?.wordmarkDarkSrc ? up.wordmarkDarkSrc : up?.wordmarkSrc;
  // "Agency logo" (default): the agency's, whatever the sub-account uploaded.
  if (proto?.subHeaderLogo !== "agency" || !agencySrc || logoSrc || account.id === "agency") return null;
  return agencySrc;
}

/**
 * How a sub-account's header shows its uploaded full logo (proto
 * `subHeaderShows`, Nov 25, 2026). The agency, and any account without an
 * uploaded full logo, always answer "logo".
 */
export function useSubHeaderShows(account: Account): SubHeaderShows {
  const shows = useBrandingOptional()?.proto.subHeaderShows ?? "both";
  return account.id !== "agency" && account.wordmarkUploaded ? shows : "logo";
}

/**
 * The full logo with the account name (Nov 25, 2026). Stacked — logo over
 * name or name over logo, 6px apart — or side by side, where the name
 * truncates and the full name shows on hover (proto subHeaderLayout).
 */
export function WordmarkWithName({ src, name, alt }: { src: string; name: string; alt?: string }) {
  const layout = useBrandingOptional()?.proto.subHeaderLayout ?? "logo-top";
  /*
   * Stacked, the header's trailing controls (the collapse toggle) line up
   * with the FIRST row, not the middle of both (Nov 25, 2026). Publish that
   * row's midline on the header row; globals.css pins the trailing slot to it.
   */
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    const row = el?.closest<HTMLElement>("[data-nav-header-row]");
    if (!el || !row || layout === "side") return;
    const measure = () => {
      const first = el.firstElementChild as HTMLElement | null;
      if (!first) return;
      const r = row.getBoundingClientRect(), f = first.getBoundingClientRect();
      row.style.setProperty("--hdr-first-mid", `${Math.round(f.top - r.top + f.height / 2)}px`);
      row.dataset.firstMid = "";
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      ro.disconnect();
      row.style.removeProperty("--hdr-first-mid");
      delete row.dataset.firstMid;
    };
  }, [layout, src, name]);
  const label = (
    <span className="max-w-full min-w-0 truncate text-[15px] leading-[20px] font-semibold text-nav-fg" title={name}>
      {name}
    </span>
  );
  if (layout === "side") {
    return (
      <span className="flex min-w-0 items-center gap-[8px]" title={alt}>
        <span className="flex shrink-0">
          <Wordmark src={src} alt={name} maxWidth={110} />
        </span>
        <span aria-hidden="true" className="h-[16px] w-px shrink-0 bg-nav-divider" />
        {label}
      </span>
    );
  }
  return (
    <span ref={ref} className="flex min-w-0 flex-col items-start gap-[10px] py-[4px]" title={alt}>
      {layout === "name-top" ? label : null}
      <Wordmark src={src} alt={name} />
      {layout === "logo-top" ? label : null}
    </span>
  );
}

export function BrandMark({
  account,
  logoSrc,
  alt,
  withMark = true,
  markAccount = null,
}: BrandMarkProps) {
  // `logoSrc` from the nav config pins the header to one asset for a demo, so
  // it outranks the account's own pair — including the wordmark.
  const wordmark = logoSrc ? undefined : account.wordmarkSrc;
  const subShows = useSubHeaderShows(account);
  const agencyFallback = useAgencyLogoFallback(account, logoSrc);
  /*
   * "Test logo" (Nov 26, 2026): a sample full logo in every sub-account
   * header, to judge "Logo width" against real shapes. Follows "Sub-account
   * header shows" as an upload would. Prototype only.
   */
  const proto = useBrandingOptional()?.proto;
  const testLogo = proto?.testLogo ?? "off";
  if (testLogo !== "off" && account.id !== "agency" && !markAccount) {
    const src = TEST_LOGO_SRC[testLogo];
    const shows = proto?.subHeaderShows ?? "both";
    if (shows === "both") return <WordmarkWithName src={src} name={account.name} alt={alt} />;
    if (shows === "logo")
      return (
        <span className="flex min-w-0 items-center" title={alt}>
          <Wordmark src={src} alt={account.name} />
        </span>
      );
  }
  if (agencyFallback && !markAccount) {
    return <WordmarkWithName src={agencyFallback} name={account.name} alt={alt} />;
  }

  // The agency's full logo replaces its NAME, with or without the square
  // mark beside it (Nov 20). Sub-accounts keep their name as text for now
  // (Ashwin, Nov 23) unless the header shows its mark.
  if (
    wordmark &&
    subShows !== "name" &&
    !markAccount &&
    (withMark || account.id === "agency" || account.wordmarkUploaded)
  ) {
    if (subShows === "both") return <WordmarkWithName src={wordmark} name={account.name} alt={alt} />;
    return (
      <span className="flex min-w-0 items-center" title={alt}>
        {/*
          Height-bound, width free: these are 350×180 in production but nobody
          crops to exactly that, so constraining the height and letting the
          width follow is what keeps a tall logo and a wide one the same
          visual weight in the row.
        */}
        <Wordmark src={wordmark} alt={account.name} />
      </span>
    );
  }

  return (
    <span className="flex min-w-0 items-center gap-[7px]" title={alt}>
      {withMark ? (
        markAccount ? (
          // The agency's own mark, and never the config's demo override —
          // that asset stands in for the ACCOUNT's logo.
          <AccountLogo
            logo={markAccount.logo}
            src={markAccount.logoSrc}
            size={20}
            radius={999}
          />
        ) : (
          <AccountLogo
            logo={account.logo}
            src={logoSrc ?? account.logoSrc}
            size={20}
            radius={999}
          />
        )
      ) : null}
      {/* Agency and sub-account names: 15px semibold (Nov 26, 2026). */}
      <span className="truncate text-[15px] leading-[20px] font-semibold text-nav-fg">
        {account.name}
      </span>
    </span>
  );
}
