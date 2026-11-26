"use client";

import * as React from "react";
import { useBranding } from "@/components/branding/branding-provider";
import { Eye, ImageUp, Trash2, UploadCloud, Wand2 } from "lucide-react";
import { useLogoFixNote, useLogoFixes, useSurfaceLuminance } from "@/components/nav/brand-mark";
import { LOGO_MAX_HEIGHT, type FixNoteStyle } from "@/design/branding";
import { AccountLogo } from "@/components/accounts/account-logo";
import type { AccountLogoSpec } from "@/components/accounts/account-logo";
import { cn } from "@/lib/utils";
import { LogoChecklist } from "@/components/settings/logo-checks";
import { LogoCropModal } from "@/components/settings/logo-crop-modal";
import { useBrandOptional } from "@/components/accounts/brand-store";
import {
  GuideAccordion,
  LogoGuidelines,
  LogoGuidelinesButton,
  LogoGuidelinesModal,
} from "@/components/branding/logo-guidelines";

/**
 * One logo upload.
 *
 * Two of these sit together — the wide logo and the square mark — because the
 * nav needs both and production already asks for both, in two different places
 * and with two different sets of copy. Putting them side by side is most of the
 * fix: the pair is one decision about how the brand appears, not two unrelated
 * fields on two unrelated pages.
 *
 * Production's version of this is a bare dropzone with the constraints written
 * as a sentence underneath and no indication of where the asset ends up. This
 * one previews the result at the size the nav will actually draw it, which is
 * the only question an agency has when uploading: what will this look like?
 */
export function LogoUploadField({
  label,
  hint,
  aspect,
  src,
  fallback,
  onPick,
  onRemove,
}: {
  label: string;
  hint: string;
  /** Shape of the drop target, so wide and square read as different things. */
  aspect: "wide" | "square";
  src?: string;
  /** Drawn when nothing is uploaded — the square field shows the real fallback. */
  fallback?: AccountLogoSpec;
  onPick: (dataUrl: string) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [over, setOver] = React.useState(false);

  const read = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    // A data URL, not an object URL: this is a prototype with no server, and an
    // object URL dies with the page while the value has to survive a re-render.
    reader.onload = () => onPick(String(reader.result));
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-[4px]">
      <span className="text-[13px] leading-[18px] font-medium text-pg-text">
        {label}
      </span>

      <div className="flex items-start gap-[12px]">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            read(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-pg-bg",
            "shadow-[inset_0_0_0_1px_var(--pg-border)]",
            aspect === "wide" ? "h-[72px] w-[168px]" : "size-[72px]",
            over && "shadow-[inset_0_0_0_2px_var(--brand)]",
          )}
        >
          {src ? (
            <img
              src={src}
              alt=""
              className="max-h-full max-w-full object-contain p-[8px]"
            />
          ) : aspect === "square" && fallback ? (
            // The square field shows what the nav draws today, so "no logo" is
            // visibly a state with a result rather than an empty box.
            <AccountLogo logo={fallback} size={44} radius={999} />
          ) : (
            <ImageUp size={20} aria-hidden="true" className="text-pg-faint" />
          )}
        </div>

        <div className="flex min-w-0 flex-col items-start gap-[6px]">
          <p className="text-[12.5px] leading-[17px] text-pg-muted">{hint}</p>
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="motion-tap flex h-[32px] items-center rounded-[8px] bg-pg-surface px-[12px] text-[13px] leading-none font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg"
            >
              {src ? "Replace" : "Upload"}
            </button>
            {src ? (
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove ${label}`}
                className="motion-tap flex size-[32px] items-center justify-center rounded-[8px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)] hover:text-[color:var(--hr-error-600)]"
              >
                <Trash2 size={14} aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => read(e.target.files?.[0])}
      />
    </div>
  );
}

/**
 * One brand asset, as a settings ROW rather than a stacked field.
 *
 * The shape Ashwin drew on Nov 6, and the reason it is worth having over
 * `LogoUploadField`: the wide logo and the square mark are the same kind of
 * decision, and the two were being drawn as two different controls — one with
 * a 190×120 preview, a sentence of sizing and a worded Remove; the other with
 * a 72px preview, a hint and a trash glyph. An agency looking at both saw two
 * fields and had to work out they were a pair.
 *
 * Here they are one row repeated: preview on the left, name and what it is
 * for in the middle, the two buttons hard right. Scanning down, the only
 * things that differ between the two rows are the words and the shape of the
 * preview — which is exactly what does differ about them.
 *
 * `spec` is split out of `hint` on purpose. "Shown in the expanded navigation
 * and emails" answers WHERE it goes; "350 × 180 px · up to 2.5 MB" answers
 * what to supply. They are read at different moments — the first when
 * deciding whether to bother, the second with a file picker already open —
 * and running them together as one paragraph buries the second.
 */
export function BrandAssetRow({
  label,
  hint,
  spec,
  aspect,
  src,
  fallback,
  onPick,
  onRemove,
  error,
  compact = false,
  guide = false,
  owner = "agency",
  darkFor,
  footer,
}: {
  /** A strip under the tiles, inside the card (e.g. the sidebar avatar). */
  footer?: React.ReactNode;
  /**
   * Light and dark versions (proto darkLogosAgency / darkLogosSub, Nov 26,
   * 2026): which account and asset the dark slot writes to. The dark version
   * goes straight to the brand store.
   */
  darkFor?: { accountId: string; kind: "wordmark" | "logo" };
  /** Whose sidebar icon this is — picks the agency or sub-account shape. */
  owner?: "agency" | "sub";
  /**
   * Full logo rows: a "Logo guidelines" button under the spec (Nov 24, 2026)
   * — a modal, or an accordion under the row (proto `logoGuide`). Compact
   * rows always use the modal.
   */
  guide?: boolean;
  /**
   * One line, never wrapped (Nov 24): smaller preview and 36px buttons, for
   * a modal column. Both rows keep Replace / Remove beside the copy.
   */
  compact?: boolean;
  label: string;
  /** Shown under the spec when an upload is refused (Nov 23). */
  error?: string;
  /** Where the asset is used. */
  hint: string;
  /** What to supply: ratio, size, weight. */
  spec: string;
  aspect: "wide" | "square";
  src?: string;
  fallback?: AccountLogoSpec;
  onPick: (dataUrl: string, fileName?: string) => void;
  onRemove: () => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { proto } = useBranding();
  const brand = useBrandOptional();
  // Dark slot: on for this owner and wired to an account.
  const darkOn = Boolean(darkFor && brand) && (owner === "sub" ? proto.darkLogosSub : proto.darkLogosAgency);
  const darkKey = darkFor?.kind === "wordmark" ? "wordmarkDarkSrc" : "logoDarkSrc";
  const darkSrc = darkOn && darkFor ? brand?.uploads[darkFor.accountId]?.[darkKey] : undefined;
  // Which slot the next file is for, and the crop modal while it is open.
  const target = React.useRef<"light" | "dark">("light");
  const [cropFor, setCropFor] = React.useState<{ to: "light" | "dark"; file?: File } | null>(null);
  const crop = proto.logoCrop;

  const take = (src: string, name: string | undefined, to: "light" | "dark") => {
    if (to === "dark" && darkFor) brand?.set(darkFor.accountId, darkKey, src);
    else onPick(src, name);
  };
  const read = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    const to = target.current;
    const reader = new FileReader();
    reader.onload = () => take(String(reader.result), file.name, to);
    reader.readAsDataURL(file);
  };
  /**
   * A file dropped on a tile. Crop on (the default, Nov 26, 2026): the crop
   * modal opens with the dropped file already in it — drag and drop stays,
   * cropping still happens.
   */
  const dropTo = (to: "light" | "dark", f: File | undefined) => {
    if (crop) {
      if (f && f.type.startsWith("image/")) setCropFor({ to, file: f });
      return;
    }
    target.current = to;
    read(f);
  };
  /**
   * Upload: the file picker, always. With crop on, the chosen file then opens
   * in the crop modal — pick first, crop second, the way GitHub, Square,
   * Zoho, Uxcel, and Contra do it (Nov 26, 2026 research).
   */
  const pick = (to: "light" | "dark") => {
    target.current = to;
    inputRef.current?.click();
  };

  // The square asset previews as a circle by default (Nov 24, 2026) — it is
  // the account's avatar. See IconShape.
  /*
   * Sidebar icon shape (Nov 25, 2026): agency square (its rail mark is
   * square), sub-account circle (rail avatars are circles). Separate proto
   * controls. Either way a dashed drop target with the icon cropped inside.
   */
  const shape = aspect === "square" ? (owner === "sub" ? proto.subIconShape : proto.agencyIconShape) : null;
  const round = shape === "circle";
  /*
   * Smart upload checks (proto logoChecks, Nov 26, 2026): once a full logo
   * is uploaded, a checklist drawn with that file replaces the sample
   * guidelines.
   */
  const checks = proto.logoChecks && aspect === "wide" && Boolean(src);
  // Logo guidelines can be switched off (proto logoGuides, Nov 25, 2026).
  // Guidelines stay after upload, next to the checks (Nov 26, 2026).
  guide = guide && proto.logoGuides;
  const asAccordion = guide && !compact && proto.logoGuide === "accordion";
  // What the header did to an awkward full logo (proto logoAutoFix).
  const fixNote = useLogoFixNote(aspect === "wide" ? src : undefined);
  // The preview shows the same backdrop the header uses.
  const fixes = useLogoFixes(aspect === "wide" ? src : undefined);
  const previewPlate = fixes.resolve(useSurfaceLuminance(null, fixes.enabled)).plate;
  const [guideOpen, setGuideOpen] = React.useState(false);

  /*
   * Upload tiles (Nov 26, 2026, Ashwin): one tile per version, each with its
   * own upload, replace, and remove — no shared Upload / Remove buttons that
   * have to guess which version you meant. The shape every common upload
   * component settles on: click or drop on the tile, then act on the file
   * from the tile itself.
   */

  /*
   * One card per asset (Nov 26, 2026, layout C), with the light and dark
   * tiles in labelled columns (layout A). Before upload the card's footer
   * holds the guidelines; after upload, the checks — the guidelines move
   * behind an info icon on the check's heading.
   */
  const showChecks = checks && Boolean(src);
  const framed = proto.assetFrame === "cards";
  const showGuide = guide && !showChecks && aspect === "wide";
  return (
    <section
      aria-label={label}
      className={cn(
        "@container flex w-full flex-col",
        // Cards: a bordered card. Dividers (default): open rows; the page
        // draws a rule between assets (proto assetFrame).
        framed
          ? "overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]"
          : "gap-[12px] py-[20px] first:pt-0 last:pb-0",
      )}
    >
      {/*
        One row, layout A (Nov 26, 2026): what the asset is on the left, then
        a column per sidebar — header over tile. Stacks when the card is too
        narrow for the row (container query, so the onboarding modal stacks
        while the settings page does not).
      */}
      <div
        className={cn(
          // Copy up to 400px, tiles right after it — not pushed to the edge.
          // The copy gives way first; the tiles keep their slot size.
          "flex flex-col gap-y-[12px] @[620px]:flex-row @[620px]:items-start @[620px]:gap-x-[32px]",
          !framed ? "" : compact ? "px-[12px] py-[12px]" : "px-[16px] py-[14px]",
        )}
      >
        <div className="flex min-w-0 flex-col gap-[2px] @[620px]:max-w-[400px] @[620px]:flex-1">
          <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">{label}</span>
          <p className="text-[13px] leading-[18px] text-pg-muted">{hint}</p>
          <p className="text-[12px] leading-[16px] text-pg-faint">{spec}</p>
          {fixNote && proto.fixNotePlacement === "text" ? (
            <FixNote note={fixNote} style={proto.fixNoteStyle} className="mt-[4px]" />
          ) : null}
          {error ? (
            <p role="alert" className="text-[13px] leading-[18px] text-[var(--hr-error-600,#d92d20)]">
              {error}
            </p>
          ) : null}
        </div>
        {/* The tiles sit together, 16px apart (Nov 26, 2026). */}
        <div className="flex flex-wrap items-start gap-[16px] @[620px]:shrink-0 @[620px]:flex-nowrap">
        {(darkOn ? (["light", "dark"] as const) : (["light"] as const)).map((slot) => {
          const light = slot === "light";
          return (
            <div key={slot} className="flex min-w-0 flex-col gap-[6px]">
              {/* Same style as a form field's label (Nov 26, 2026). */}
              <span className="text-[13px] leading-[18px] text-pg-text">
                {aspect === "wide" ? (light ? "Light logo" : "Dark logo") : light ? "Light icon" : "Dark icon"}
              </span>
              <UploadTile
                slot={slot}
                showSlot={darkOn}
                assetLabel={label}
                src={light ? src : darkSrc}
                wide={aspect === "wide"}
                round={round}
                compact={compact}
                {...(light && fallback && aspect === "square" ? { fallback } : {})}
                {...(light && previewPlate ? { plate: previewPlate } : {})}
                badge={light && fixNote && (proto.fixBadge || proto.fixTooltip) ? <FixBadge note={fixNote} tooltip={proto.fixTooltip} round={false} /> : null}
                onPick={() => pick(slot)}
                onDrop={(f) => dropTo(slot, f)}
                onRemove={() => (light ? onRemove() : darkFor && brand?.clear(darkFor.accountId, darkKey))}
              />
            </div>
          );
        })}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (crop && f && f.type.startsWith("image/")) setCropFor({ to: target.current, file: f });
          else read(f);
          e.target.value = "";
        }}
      />

      {guide && !asAccordion && guideOpen ? <LogoGuidelinesModal onClose={() => setGuideOpen(false)} /> : null}
      {cropFor ? (
        <LogoCropModal
          kind={aspect}
          round={round}
          surface={cropFor.to === "dark" ? DARK_TILE : navSurface()}
          title={`${cropFor.to === "dark" ? "Dark sidebar version · " : ""}${label}`}
          {...(cropFor.file ? { initialFile: cropFor.file } : {})}
          onClose={() => setCropFor(null)}
          onDone={(src, name) => {
            take(src, name, cropFor.to);
            setCropFor(null);
          }}
        />
      ) : null}

      {footer ? (
        <div className={cn(framed && "border-t border-pg-border", !framed ? "pt-[4px]" : compact ? "px-[12px] py-[12px]" : "px-[16px] py-[14px]")}>{footer}</div>
      ) : null}

      {(fixNote && proto.fixNotePlacement === "row") || showChecks || showGuide ? (
        <div
          className={cn(
            "flex flex-col gap-[12px]",
            framed && "border-t border-pg-border bg-[color-mix(in_oklab,var(--pg-bg)_60%,transparent)]",
            !framed ? "" : compact ? "px-[12px] py-[12px]" : "px-[16px] py-[14px]",
          )}
        >
          {/* "We adjusted your logo" (proto fixNotePlacement). */}
          {fixNote && proto.fixNotePlacement === "row" ? <FixNote note={fixNote} style={proto.fixNoteStyle} /> : null}

          {showChecks && src ? (
            <LogoChecklist
              src={src}
              compact={compact}
              bare={framed}
              {...(darkSrc ? { darkSrc } : {})}
              {...(darkOn && darkFor && !darkSrc
                ? {
                    onUseAsDark: () => {
                      brand?.set(darkFor.accountId, darkKey, src);
                      onRemove();
                    },
                  }
                : {})}
            />
          ) : null}

          {showGuide ? (
            asAccordion || compact ? (
              <GuideAccordion
                bare={framed}
                title="Show logo guidelines"
                openTitle="Hide logo guidelines"
                icon={<Eye size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />}
              >
                <LogoGuidelines compact={compact} />
              </GuideAccordion>
            ) : (
              <LogoGuidelinesButton onClick={() => setGuideOpen((o) => !o)} />
            )
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

const DARK_TILE = "#1d2939";

/** The live sidebar colour, for the crop preview. */
function navSurface(): string {
  const el = document.querySelector("[data-nav-column]");
  const bg = el ? getComputedStyle(el).getPropertyValue("--nav-bg").trim() : "";
  return bg || "#ffffff";
}

/**
 * One version of an asset as an upload tile (Nov 26, 2026): the preview on
 * the surface it is for (white for light sidebars, gray 800 for dark), a
 * dashed drop zone while empty, and the file's own actions in the footer.
 * Crop on: no drag and drop; the tile opens the crop modal.
 */
function UploadTile({
  slot,
  showSlot,
  assetLabel,
  src,
  wide,
  round,
  fallback,
  plate,
  badge,
  onPick,
  onDrop,
  onRemove,
}: {
  slot: "light" | "dark";
  /** Name the slot (Light / Dark) — only when there are two. */
  showSlot: boolean;
  assetLabel: string;
  src?: string;
  wide: boolean;
  round: boolean;
  compact: boolean;
  fallback?: AccountLogoSpec;
  plate?: string;
  badge?: React.ReactNode;
  onPick: () => void;
  onDrop: (f: File | undefined) => void;
  onRemove: () => void;
}) {
  const [over, setOver] = React.useState(false);
  const dark = slot === "dark";
  const what = `${showSlot ? (dark ? "dark " : "light ") : ""}${assetLabel.toLowerCase()}`;
  const surface = dark ? DARK_TILE : "#ffffff";
  /*
   * Sized to what the sidebar draws (Nov 26, 2026): the full logo's box
   * (Logo width × 28) or the 32px icon, plus 16px padding all round — so
   * the tile is the slot, not a full-width banner.
   */
  const logoWidth = useBranding().proto.logoWidth;
  const boxW = wide ? (logoWidth === "auto" ? 168 : Number(logoWidth)) : 32;
  const boxH = wide ? LOGO_MAX_HEIGHT : 32;
  return (
    /*
     * No footer: an empty tile says "Click to upload", a filled one shows
     * Replace on hover, and Remove is a small secondary icon button on the
     * preview's top-right corner.
     */
    <div className="relative flex max-w-full flex-col items-start gap-[6px]">
      <div className="relative">
        <button
          type="button"
          onClick={onPick}
          aria-label={src ? `Replace ${what}` : `Upload ${what}`}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            onDrop(e.dataTransfer.files[0]);
          }}
          className={cn(
            "group/tile motion-tap relative box-content flex items-center justify-center gap-[6px] overflow-hidden rounded-[8px] p-[16px] text-center",
            !src
              ? dark
                ? "border border-dashed border-white/25"
                : "border border-dashed border-pg-border-strong"
              : "shadow-[inset_0_0_0_1px_rgba(16,24,40,0.08)]",
            over && "outline-2 outline-offset-0 outline-[var(--hr-primary-600)]",
          )}
          style={{ width: boxW, height: boxH, background: over ? (dark ? "#26324a" : "var(--hr-primary-25,#f5f8ff)") : surface }}
        >
          {src ? (
            wide ? (
              <span
                className={cn("inline-flex max-w-full items-center", plate && "rounded-[6px] px-[8px] py-[4px]")}
                style={plate ? { background: plate } : undefined}
              >
                <img src={src} alt="" style={{ maxHeight: boxH, maxWidth: boxW }} className="object-contain" />
              </span>
            ) : (
              <img
                src={src}
                alt=""
                className={cn("size-[32px] object-cover", round ? "rounded-full" : "rounded-[8px]")}
                style={{ outline: "1px solid var(--icon-edge, transparent)", outlineOffset: -1 }}
              />
            )
          ) : (
            <>
              <UploadCloud size={16} aria-hidden="true" className={cn("shrink-0", dark ? "text-white/80" : "text-[var(--hr-primary-600)]")} />
              {wide ? (
                <span className={cn("text-[13px] leading-[18px] font-semibold whitespace-nowrap", dark ? "text-white" : "text-[var(--hr-primary-600)]")}>
                  Click to upload
                </span>
              ) : null}
            </>
          )}
          {/* Hover hint on a filled tile: the whole tile replaces. */}
          {src ? (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#101828]/55 text-[12px] font-semibold text-white opacity-0 transition-opacity group-hover/tile:opacity-100 group-focus-visible/tile:opacity-100">
              {src ? "Replace" : "Upload"}
            </span>
          ) : null}
        </button>
        {src ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${what}`}
            title="Remove"
            className="motion-tap absolute -top-[8px] -right-[8px] flex size-[24px] items-center justify-center rounded-[6px] bg-pg-surface text-pg-muted shadow-[0_1px_2px_rgba(16,24,40,0.05),inset_0_0_0_1px_var(--pg-border)] hover:bg-pg hover:text-[var(--hr-error-600)]"
          >
            <Trash2 size={12} aria-hidden="true" />
          </button>
        ) : null}
        {badge}
      </div>
      <span className="text-[12px] leading-[16px] text-pg-faint">
        {src ? `Shows at ${boxW} × ${boxH} px` : fallback ? "Showing your initials" : `Drop a file or click · ${boxW} × ${boxH} px`}
      </span>
    </div>
  );
}

/**
 * "We adjusted your logo" (Nov 25, 2026), in one of five treatments —
 * proto `fixNoteStyle`:
 *  text     plain primary text with the wand
 *  tag      a pill
 *  callout  an info box, primary tint
 *  success  a green alert with a title
 *  neutral  a grey note
 */
function FixNote({ note, style, className }: { note: string; style: FixNoteStyle; className?: string }) {
  const body = note.replace(/^We adjusted your logo: /, "").replace(/\.$/, "");
  const sentence = body.charAt(0).toUpperCase() + body.slice(1);
  if (style === "text") {
    return (
      <p className={cn("flex items-start gap-[6px] text-[13px] leading-[18px] text-[var(--hr-primary-600)]", className)}>
        <Wand2 size={14} aria-hidden="true" className="mt-[2px] shrink-0" />
        {note}
      </p>
    );
  }
  if (style === "tag") {
    return (
      <span
        title={note}
        className={cn(
          "inline-flex max-w-full items-center gap-[6px] self-start rounded-full bg-[var(--hr-primary-50)] px-[10px] py-[3px] text-[12px] leading-[16px] font-medium text-[var(--hr-primary-700)] shadow-[inset_0_0_0_1px_var(--hr-primary-200)]",
          className,
        )}
      >
        <Wand2 size={12} aria-hidden="true" className="shrink-0" />
        <span className="truncate">Adjusted for readability · {sentence}</span>
      </span>
    );
  }
  const tone = {
    callout: {
      box: "bg-[var(--hr-primary-50)] shadow-[inset_0_0_0_1px_var(--hr-primary-200)]",
      icon: "text-[var(--hr-primary-600)]",
      title: "text-[var(--hr-primary-700)]",
      body: "text-[var(--hr-primary-700)]",
    },
    success: {
      box: "bg-[var(--hr-success-50)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--hr-success-600)_30%,transparent)]",
      icon: "text-[var(--hr-success-600)]",
      title: "text-[color:color-mix(in_oklab,var(--hr-success-600)_70%,black)]",
      body: "text-[color:color-mix(in_oklab,var(--hr-success-600)_60%,black)]",
    },
    neutral: {
      box: "bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]",
      icon: "text-pg-muted",
      title: "text-pg-heading",
      body: "text-pg-muted",
    },
  }[style];
  return (
    <div role="status" className={cn("flex items-start gap-[10px] rounded-[8px] px-[12px] py-[10px]", tone.box, className)}>
      <Wand2 size={16} aria-hidden="true" className={cn("mt-[2px] shrink-0", tone.icon)} />
      <div className="flex min-w-0 flex-col gap-[2px]">
        <span className={cn("text-[14px] leading-[20px] font-medium", tone.title)}>We adjusted your logo</span>
        <span className={cn("text-[13px] leading-[18px]", tone.body)}>{sentence}.</span>
      </div>
    </div>
  );
}

/**
 * The corner badge on an adjusted logo's preview (proto `fixBadge`), with
 * the note as a hover tooltip when `fixTooltip` is on (Nov 25, 2026).
 */
function FixBadge({ note, tooltip, round }: { note: string; tooltip: boolean; round: boolean }) {
  return (
    <span
      tabIndex={tooltip ? 0 : -1}
      aria-label={note}
      className={cn(
        "group/fix absolute flex size-[22px] items-center justify-center rounded-full bg-[var(--hr-primary-600)] text-white shadow-[0_0_0_2px_var(--pg-surface),0_2px_4px_rgba(16,24,40,0.16)] outline-none",
        round ? "top-[0px] left-[0px]" : "-top-[8px] -left-[8px]",
        tooltip && "cursor-help",
      )}
    >
      <Wand2 size={12} aria-hidden="true" />
      {tooltip ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute top-1/2 left-[calc(100%+8px)] z-20 w-[240px] -translate-y-1/2 rounded-[8px] bg-[#101828] px-[10px] py-[8px] text-[12px] leading-[17px] font-normal text-white opacity-0 shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08)] transition-opacity group-hover/fix:opacity-100 group-focus-visible/fix:opacity-100"
        >
          {note}
        </span>
      ) : null}
    </span>
  );
}
