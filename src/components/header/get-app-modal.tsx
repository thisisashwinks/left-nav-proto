"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Apple, Monitor, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Get the app — one modal, two apps.
 *
 * Modelled on the pattern komoot uses for the same job: the pitch and the way
 * to act on it in a left column, a picture of the thing on the right. It stays
 * a modal rather than a new tab because the whole point is to hand the user a
 * download and put them back where they were — sending someone to a marketing
 * page to install a companion app loses the thing they were doing.
 *
 * Both apps share this surface. They differ only in how you get the file: a
 * phone needs the store, and a desktop is already the machine you would install
 * on, so a QR code there would be asking you to scan your own screen.
 */

export type AppKind = "mobile" | "desktop";

/**
 * What the two entry points are called, wherever they stand.
 *
 * One constant because the offer now appears in three exclusive places — the app
 * bar, the avatar menu and the sidebar, at both nav widths — and copy repeated
 * across five files is copy that ends up saying five things. "Get" is doing work
 * here: "Mobile app" alone reads like a place in the product, which is exactly
 * what the row it replaced in the nav used to be.
 */
/**
 * The short names, for the surfaces where one row is the whole offer.
 *
 * Sentence case, which is the house rule and which title case was quietly
 * breaking on three surfaces at once. The platform-qualified versions live in
 * `get-app-flyout.ts`: a list of two rows can afford to say which platforms
 * each covers, and an avatar menu cannot.
 */
export const GET_APP_LABELS: Record<AppKind, string> = {
  mobile: "Get Android & iOS app",
  desktop: "Get Windows & macOS app",
};

/*
 * Real store URLs, and deliberately searches rather than app ids.
 *
 * A guessed numeric App Store id is a 404 in front of a customer. These resolve
 * for certain, and swapping in the exact listings later is a one-line change per
 * platform. The desktop pair points at the marketing site for the same reason —
 * see the note in DESKTOP_TARGETS.
 */
const STORE_LINKS = {
  ios: "https://apps.apple.com/search?term=highlevel",
  android: "https://play.google.com/store/search?q=highlevel&c=apps",
} as const;

/**
 * Placeholder until the real installers exist.
 *
 * Both point at the live marketing site rather than a `/download/mac` path that
 * has never been checked — a button that 404s is worse than one that lands a
 * step short of where it should.
 */
const DESKTOP_TARGETS = {
  mac: "https://www.gohighlevel.com",
  windows: "https://www.gohighlevel.com",
} as const;

export function GetAppModal({
  kind,
  onClose,
}: {
  kind: AppKind;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const mobile = kind === "mobile";

  return createPortal(
    <div
      data-page-theme="light"
      className="fixed inset-0 z-[80] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={mobile ? "Get the mobile app" : "Get the desktop app"}
        className="motion-panel-in relative flex max-h-[calc(100vh-32px)] w-[880px] max-w-full overflow-hidden rounded-[12px] bg-pg shadow-[0_24px_48px_-12px_rgba(16,24,40,0.18)]"
      >
        {/*
          The cross alone. Square rather than the pill a label needed, so the
          target stays the same size in both directions.
          
          With no visible word left, the accessible name has to be written down:
          an icon-only control with nothing but a glyph inside reads as an
          unnamed button to a screen reader.
        */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          title="Close"
          className="motion-tap absolute top-[14px] right-[14px] z-10 flex size-[30px] items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <GetAppContent kind={kind} />
      </div>
    </div>,
    document.body,
  );
}

/**
 * The offer itself — the column of copy and downloads, and the picture beside it.
 *
 * Lifted out of the modal so the page can be the same thing without being a
 * second copy of it. The sub-account's `flyout` placement opens this in the
 * canvas rather than over it, and a page and a sheet that drift apart on their
 * store links is exactly the bug this prevents.
 *
 * Two siblings rather than one wrapper: the modal lays them out as a row inside
 * its own dialog box and the page frames them differently, so the flex parent
 * belongs to the caller.
 */
export function GetAppContent({ kind }: { kind: AppKind }) {
  const mobile = kind === "mobile";

  return (
    <>
        <div className="flex min-w-0 flex-1 flex-col items-center overflow-y-auto px-[40px] py-[44px] text-center">
          <span
            aria-hidden="true"
            className="flex size-[52px] items-center justify-center rounded-[12px] bg-brand-soft text-brand shadow-[inset_0_0_0_1px_var(--brand-soft-2)]"
          >
            {mobile ? <PhoneGlyph /> : <Monitor size={24} />}
          </span>

          <h2 className="mt-[18px] max-w-[300px] text-[26px] leading-[32px] font-semibold tracking-[-0.4px] text-pg-heading">
            {mobile
              ? "Run your business from your pocket"
              : "Work faster with the desktop app"}
          </h2>
          <p className="mt-[8px] max-w-[320px] text-[13.5px] leading-[19px] text-pg-muted">
            {mobile
              ? "Reply to conversations, check your pipeline and take payments wherever you are."
              : "A dedicated window, global shortcuts and native notifications — without a browser tab in the way."}
          </p>

          <div className="mt-[24px] w-full max-w-[330px] rounded-[12px] bg-pg-surface p-[20px] shadow-[0_1px_2px_0_rgba(16,24,40,0.06),inset_0_0_0_1px_var(--pg-border)]">
            {mobile ? (
              <>
                <p className="text-[14px] leading-[20px] font-semibold text-brand">
                  Scan the QR code to download
                </p>
                <QrPlaceholder />
              </>
            ) : (
              <p className="text-[14px] leading-[20px] font-semibold text-brand">
                Download for your machine
              </p>
            )}

            <div className="mt-[14px] flex items-center justify-center gap-[6px]">
              <span aria-hidden="true" className="flex items-center gap-[1px]">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className="fill-[var(--hr-warning-400,#fdb022)] text-[var(--hr-warning-400,#fdb022)]"
                  />
                ))}
              </span>
              <span className="text-[13px] leading-none font-semibold text-pg-heading">
                4.7/5
              </span>
            </div>

            <div
              className={cn(
                "mt-[14px] flex gap-[8px]",
                mobile ? "flex-row justify-center" : "flex-col",
              )}
            >
              {mobile ? (
                <>
                  <StoreButton
                    href={STORE_LINKS.ios}
                    lead="Download on the"
                    name="App Store"
                    glyph={<Apple size={20} aria-hidden="true" />}
                  />
                  <StoreButton
                    href={STORE_LINKS.android}
                    lead="Get it on"
                    name="Google Play"
                    glyph={<PlayGlyph />}
                  />
                </>
              ) : (
                <>
                  <StoreButton
                    href={DESKTOP_TARGETS.mac}
                    lead="Download for"
                    name="macOS"
                    glyph={<Apple size={20} aria-hidden="true" />}
                    wide
                  />
                  <StoreButton
                    href={DESKTOP_TARGETS.windows}
                    lead="Download for"
                    name="Windows"
                    glyph={<WindowsGlyph />}
                    wide
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/*
          The picture, and the first thing to go when the window narrows. It
          carries no information the left column does not — losing it costs
          nothing, where losing a download button costs the whole modal.
        */}
        <div className="relative hidden w-[380px] shrink-0 overflow-hidden bg-brand-soft md:block">
          <AppArtwork mobile={mobile} />
        </div>
    </>
  );
}

function StoreButton({
  href,
  lead,
  name,
  glyph,
  wide = false,
}: {
  href: string;
  lead: string;
  name: string;
  glyph: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      // noreferrer as well as noopener: the target gets no window handle AND no
      // referrer, which is the pair you want on anything leaving the product.
      rel="noopener noreferrer"
      className={cn(
        "motion-tap flex items-center gap-[8px] rounded-[8px] bg-[#101828] px-[12px] py-[7px] text-left text-white hover:opacity-90 active:scale-[0.98]",
        wide && "justify-center",
      )}
    >
      <span aria-hidden="true" className="shrink-0">
        {glyph}
      </span>
      <span className="leading-none">
        <span className="block text-[8.5px] leading-[11px] tracking-[0.3px] uppercase opacity-80">
          {lead}
        </span>
        <span className="block text-[14px] leading-[17px] font-semibold">
          {name}
        </span>
      </span>
    </a>
  );
}

/**
 * A QR that looks like a QR and is not one.
 *
 * Encoding a real code needs a full QR implementation — Reed–Solomon, masking,
 * the lot — which is a lot of correctness to get wrong for a prototype. This is
 * deterministic noise inside three real finder patterns, so it reads correctly
 * at a glance in a screenshot and in a walkthrough.
 *
 * It will not scan. That is the one thing to fix before this goes near a
 * customer, and the reason this comment exists.
 */
export function QrPlaceholder() {
  const CELLS = 21;
  const inFinder = (r: number, c: number) => {
    const near = (br: number, bc: number) =>
      r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return near(0, 0) || near(0, CELLS - 7) || near(CELLS - 7, 0);
  };
  const finderOn = (r: number, c: number) => {
    const local = (br: number, bc: number) => {
      const y = r - br;
      const x = c - bc;
      const ring = Math.max(Math.abs(y - 3), Math.abs(x - 3));
      return ring !== 2;
    };
    if (r < 7 && c < 7) return local(0, 0);
    if (r < 7 && c >= CELLS - 7) return local(0, CELLS - 7);
    return local(CELLS - 7, 0);
  };

  return (
    <span className="mt-[14px] flex justify-center">
      <svg
        viewBox={`0 0 ${CELLS} ${CELLS}`}
        role="img"
        aria-label="QR code to download the app"
        className="size-[168px] rounded-[8px] p-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)]"
      >
        {Array.from({ length: CELLS }, (_, r) =>
          Array.from({ length: CELLS }, (_, c) => {
            // Deterministic so the code never flickers between renders — a QR
            // that reshuffles on every paint reads as a loading state.
            const on = inFinder(r, c)
              ? finderOn(r, c)
              : ((r * 7 + c * 13 + ((r * c) % 5)) % 3 === 0);
            return on ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                className="fill-brand"
              />
            ) : null;
          }),
        )}
      </svg>
    </span>
  );
}

/** A phone, drawn rather than borrowed — lucide's is too thin at 24px. */
function PhoneGlyph() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" aria-hidden="true">
      <rect
        x="6"
        y="2"
        width="12"
        height="20"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="18" r="1" fill="currentColor" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg width={18} height={20} viewBox="0 0 20 22" aria-hidden="true">
      <path d="M1 1.5 11.5 11 1 20.5a1.6 1.6 0 0 1-.6-1.3V2.8A1.6 1.6 0 0 1 1 1.5Z" fill="#00d4ff" />
      <path d="M11.5 11 1 1.5c.2-.2.6-.2.9 0l12.4 7-2.8 2.5Z" fill="#00f076" />
      <path d="M11.5 11 14.3 8.5l3.6 2c.7.4.7 1.6 0 2l-3.6 2L11.5 11Z" fill="#ffc900" />
      <path d="M11.5 11 14.3 13.5l-12.4 7c-.3.2-.7.2-.9 0L11.5 11Z" fill="#ff3a44" />
    </svg>
  );
}

function WindowsGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 20 20" aria-hidden="true" fill="currentColor">
      <path d="M0 3.2 8.1 2v7.7H0V3.2Zm9.1-1.3L20 .4v9.3H9.1V1.9ZM0 10.7h8.1v7.7L0 17.2v-6.5Zm9.1 0H20V20l-10.9-1.5v-7.8Z" />
    </svg>
  );
}

/**
 * The right-hand picture.
 *
 * Drawn rather than an asset: a screenshot of the app would date the moment the
 * app changed, and this only has to say "there is a thing, it is on a device".
 */
function AppArtwork({ mobile }: { mobile: boolean }) {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute -top-[60px] -right-[70px] size-[240px] rounded-full bg-brand-soft-2 opacity-70"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-[80px] -left-[60px] size-[220px] rounded-full bg-brand-soft-2 opacity-50"
      />
      <span
        className={cn(
          "relative flex flex-col overflow-hidden bg-pg-surface shadow-[0_20px_40px_-12px_rgba(16,24,40,0.28)]",
          mobile
            ? "h-[380px] w-[190px] rounded-[26px] p-[8px]"
            : "h-[240px] w-[320px] rounded-[12px] p-[8px]",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "flex items-center gap-[4px] pb-[8px]",
            mobile ? "justify-center" : "justify-start",
          )}
        >
          {mobile ? (
            <span className="h-[4px] w-[44px] rounded-full bg-pg-border" />
          ) : (
            <>
              <span className="size-[7px] rounded-full bg-pg-border" />
              <span className="size-[7px] rounded-full bg-pg-border" />
              <span className="size-[7px] rounded-full bg-pg-border" />
            </>
          )}
        </span>
        <span className="flex min-h-0 flex-1 flex-col gap-[7px] rounded-[10px] bg-pg p-[10px]">
          <span className="h-[9px] w-[62%] rounded-full bg-brand opacity-80" />
          <span className="h-[7px] w-[86%] rounded-full bg-pg-border" />
          {Array.from({ length: mobile ? 6 : 4 }, (_, i) => (
            <span
              key={i}
              className="mt-[3px] flex items-center gap-[7px] rounded-[7px] bg-pg-surface p-[7px]"
            >
              <span className="size-[16px] shrink-0 rounded-[5px] bg-brand-soft-2" />
              <span
                className="h-[6px] rounded-full bg-pg-border"
                style={{ width: `${46 + ((i * 17) % 34)}%` }}
              />
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}
