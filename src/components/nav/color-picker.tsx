"use client";

import * as React from "react";
import { Check, Pipette, X } from "lucide-react";
import {
  COLOR_FORMATS,
  formatColor,
  hsvToRgb,
  parseColor,
  parseHex,
  rgbToHex,
  rgbToHsv,
  type ColorFormat,
  type Hsv,
} from "@/lib/color";
import { cn } from "@/lib/utils";

/**
 * The accent picker, mimicking HighRise's HLColorPicker board.
 *
 * HighRise is not a dependency of this prototype and the brief was not to add
 * one, so this reproduces the component's behaviour rather than importing it:
 * a saturation/brightness board, a hue slider, a format dropdown over an input
 * field, an eyedropper where the browser has one, and Save / Cancel.
 *
 * One deliberate omission: no alpha. HLColorPicker offers it, but the panel this
 * sits in measures the accent's contrast against the nav surface and says the
 * ratio out loud — and that number stops meaning anything the moment the colour
 * is translucent. The rest of the board is faithful; the slider that would make
 * the panel lie is not there.
 */

/** The board's own working value. Hue survives greys, which a hex cannot. */
function useHsvState(hex: string) {
  /*
   * HSV is the state, not the hex.
   *
   * Round-tripping through hex on every drag loses information the board needs:
   * at zero saturation every hue is the same grey, so dragging to the left edge
   * and back would snap the hue to red. Keeping HSV means the hue slider stays
   * where the user put it while they explore the greys under it.
   */
  const [hsv, setHsv] = React.useState<Hsv>(() => {
    const rgb = parseHex(hex);
    return rgb ? rgbToHsv(rgb) : { h: 220, s: 87, v: 94 };
  });
  return [hsv, setHsv] as const;
}

/** Where a pointer landed inside an element, as 0-1 on both axes. */
function ratioWithin(el: HTMLElement, e: React.PointerEvent | PointerEvent) {
  const r = el.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
    y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
  };
}

export function AccentPicker({
  initial,
  onCancel,
  onSave,
}: {
  /** The colour the picker opens on. */
  initial: string;
  onCancel: () => void;
  /** Commits the mixed colour and adds it to the account's custom row. */
  onSave: (hex: string) => void;
}) {
  const [hsv, setHsv] = useHsvState(initial);
  const [format, setFormat] = React.useState<ColorFormat>("HEX");
  const hex = rgbToHex(hsvToRgb(hsv));

  /*
   * The field shows a rendering of `hex` until it is typed in, and then shows
   * exactly what was typed until it parses.
   *
   * Both halves matter. Echoing the formatted value back on every keystroke
   * makes the field impossible to edit — deleting a character reformats it — and
   * writing the field's own rendering back into the colour drifts: HSB rounds to
   * whole degrees and percents, so #155EEF displayed and re-read returns
   * #165EF0. `draft` is null whenever the field is not being edited, which is
   * what keeps the hex authoritative.
   */
  const [draft, setDraft] = React.useState<string | null>(null);
  const shown = draft ?? formatColor(hex, format);
  const draftInvalid = draft !== null && parseColor(draft, format) === null;

  const commitDraft = (text: string) => {
    setDraft(text);
    const parsed = parseColor(text, format);
    if (!parsed) return;
    const rgb = parseHex(parsed);
    if (!rgb) return;
    const next = rgbToHsv(rgb);
    // Typed greys carry no hue, so the slider keeps the one it had rather than
    // jumping to red — the same reason the board's state is HSV.
    setHsv((h) => (next.s === 0 ? { ...next, h: h.h } : next));
  };

  const boardRef = React.useRef<HTMLDivElement>(null);
  const hueRef = React.useRef<HTMLDivElement>(null);

  const dragBoard = (e: React.PointerEvent | PointerEvent) => {
    if (!boardRef.current) return;
    const { x, y } = ratioWithin(boardRef.current, e);
    setDraft(null);
    setHsv((h) => ({ ...h, s: x * 100, v: (1 - y) * 100 }));
  };

  const dragHue = (e: React.PointerEvent | PointerEvent) => {
    if (!hueRef.current) return;
    const { x } = ratioWithin(hueRef.current, e);
    setDraft(null);
    setHsv((h) => ({ ...h, h: x * 360 }));
  };


  // Chromium-only at the time of writing, so the button is absent rather than
  // present-and-broken elsewhere — HighRise's own docs say "where available".
  const hasDropper =
    typeof window !== "undefined" && "EyeDropper" in window;

  const pickFromScreen = () => {
    const Ctor = (
      window as unknown as {
        EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> };
      }
    ).EyeDropper;
    if (!Ctor) return;
    new Ctor()
      .open()
      .then(({ sRGBHex }) => {
        const rgb = parseHex(sRGBHex);
        if (!rgb) return;
        setDraft(null);
        setHsv(rgbToHsv(rgb));
      })
      // Cancelling the dropper rejects; that is a user action, not a fault.
      .catch(() => {});
  };

  return (
    <div className="flex flex-col gap-[8px]">
      <div
        ref={boardRef}
        /*
         * Pointer capture, so a drag that leaves the board keeps working.
         *
         * Without it the value freezes the instant the pointer crosses the
         * edge, which is exactly what people do when reaching for full
         * saturation — they overshoot deliberately and expect the value to pin
         * to the corner.
         *
         * Written out on each element rather than shared through a factory: a
         * factory called during render reads as ref access during render to the
         * compiler, and these have to run at event time.
         */
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragBoard(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) dragBoard(e);
        }}
        onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
        role="application"
        aria-label="Saturation and brightness"
        className="relative h-[124px] w-full cursor-crosshair touch-none overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--nav-divider)]"
        style={{
          background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-[12px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_#fff,0_1px_3px_0_rgba(0,0,0,0.45)]"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            background: hex,
          }}
        />
      </div>

      <div
        ref={hueRef}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          dragHue(e);
        }}
        onPointerMove={(e) => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) dragHue(e);
        }}
        onPointerUp={(e) => e.currentTarget.releasePointerCapture(e.pointerId)}
        role="slider"
        aria-label="Hue"
        aria-valuemin={0}
        aria-valuemax={360}
        aria-valuenow={Math.round(hsv.h)}
        tabIndex={0}
        onKeyDown={(e) => {
          const step = e.key === "ArrowLeft" ? -2 : e.key === "ArrowRight" ? 2 : 0;
          if (step === 0) return;
          e.preventDefault();
          setDraft(null);
          setHsv((h) => ({ ...h, h: (h.h + step + 360) % 360 }));
        }}
        className="relative h-[12px] w-full cursor-pointer touch-none rounded-full shadow-[inset_0_0_0_1px_var(--nav-divider)] focus:outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--nav-divider),0_0_0_2px_var(--nav-fg-subtle)]"
        style={{
          background:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 size-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_0_2px_#fff,0_1px_3px_0_rgba(0,0,0,0.45)]"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            background: `hsl(${hsv.h} 100% 50%)`,
          }}
        />
      </div>

      <div className="flex items-center gap-[6px]">
        <label className="sr-only" htmlFor="accent-format">
          Colour notation
        </label>
        <select
          id="accent-format"
          value={format}
          onChange={(e) => {
            // Dropping the draft on a format change is what stops a half-typed
            // hex being re-read as RGB the moment the notation flips.
            setDraft(null);
            setFormat(e.target.value as ColorFormat);
          }}
          className="h-[28px] shrink-0 rounded-[6px] bg-nav px-[4px] text-[11px] leading-none font-medium text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-divider)] focus:outline-none"
        >
          {COLOR_FORMATS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={shown}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          aria-label={`Colour value in ${format}`}
          aria-invalid={draftInvalid}
          onChange={(e) => commitDraft(e.target.value)}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !draftInvalid) {
              setDraft(null);
              onSave(hex);
            }
          }}
          className={cn(
            "h-[28px] min-w-0 flex-1 rounded-[6px] bg-nav px-[8px] font-mono text-[11.5px] leading-none text-nav-fg shadow-[inset_0_0_0_1px_var(--nav-divider)] focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--nav-fg-subtle)]",
            draftInvalid &&
              "shadow-[inset_0_0_0_1.5px_var(--hr-error-500,#f04438)]",
          )}
        />

        {hasDropper ? (
          <button
            type="button"
            onClick={pickFromScreen}
            aria-label="Pick a colour from the screen"
            title="Pick from screen"
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg"
          >
            <Pipette size={13} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-[6px]">
        <span
          aria-hidden="true"
          className="size-[28px] shrink-0 rounded-[6px] shadow-[inset_0_0_0_1px_var(--nav-divider)]"
          style={{ background: hex }}
        />
        <button
          type="button"
          onClick={onCancel}
          className="motion-tap flex h-[28px] flex-1 items-center justify-center rounded-[6px] text-[12px] leading-none font-medium text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={draftInvalid}
          onClick={() => onSave(hex)}
          className="motion-tap flex h-[28px] flex-1 items-center justify-center gap-[4px] rounded-[6px] bg-nav-fg text-[12px] leading-none font-medium text-nav hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check size={12} aria-hidden="true" />
          Save
        </button>
      </div>
    </div>
  );
}

/**
 * A saved custom colour, with the × that removes it.
 *
 * The remove target only appears under the pointer or on focus: ten tiles each
 * carrying a permanent close button would read as a list of things to delete
 * rather than a palette to choose from.
 */
export function CustomSwatch({
  hex,
  selected,
  contrast,
  onSelect,
  onRemove,
}: {
  hex: string;
  selected: boolean;
  /** Shown in the tooltip beside the value, as HighRise's `showTooltip: both`. */
  contrast: string;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <span className="group/sw relative block size-[30px]">
      <button
        type="button"
        onClick={onSelect}
        aria-label={`Custom ${hex}`}
        aria-pressed={selected}
        title={`${hex.toUpperCase()} — ${contrast}`}
        className={cn(
          "motion-tap flex size-[30px] items-center justify-center rounded-[7px]",
          selected && "shadow-[0_0_0_2px_var(--nav),0_0_0_4px_var(--nav-fg)]",
        )}
        style={{ background: hex }}
      >
        {selected ? (
          <Check size={13} aria-hidden="true" className="text-white" />
        ) : null}
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${hex}`}
        className="absolute -top-[5px] -right-[5px] flex size-[15px] items-center justify-center rounded-full bg-nav-fg text-nav opacity-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.4)] group-hover/sw:opacity-100 focus-visible:opacity-100"
      >
        <X size={9} aria-hidden="true" strokeWidth={3} />
      </button>
    </span>
  );
}
