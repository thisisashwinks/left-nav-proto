"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Check, Plus, TriangleAlert } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useAnchored } from "@/lib/use-anchored";
import { cn } from "@/lib/utils";
import { AccentPicker, CustomSwatch } from "./color-picker";

/**
 * How an account colours its own nav.
 *
 * Per account, not per agency: the answer to "who picks the colour" was that
 * each account picks its own, so this writes to that account's theme override
 * and nothing inherits.
 *
 * It lives in the editing surface rather than a settings page because that is
 * where changing the nav already happens — you are looking at the thing you are
 * changing, and the preview is the nav itself rather than a thumbnail of one.
 *
 * Free colour choice is the version that most easily produces something
 * unreadable, so the contrast between the accent and the surface it lands on is
 * measured and said out loud. It warns rather than blocks: an agency's brand is
 * theirs, and a tool that refuses their colour outright gets worked around with
 * custom CSS, which is worse than a warning they chose to ignore.
 */

const WIDTH = 248;
/*
 * The board needs more room than the swatch grid.
 *
 * HighRise's picker defaults to 298px and the saturation area is the reason —
 * at 224px of usable width the crosshair has too little travel to place a
 * colour precisely. The panel widens for the board and narrows again on the way
 * back, so the resting state is not paying for a view it is not showing.
 */
const PICKER_WIDTH = 288;
const GAP = 6;

/** The accents on offer, from the HighRise ramps already in tokens.css. */
const SWATCHES = [
  { id: "primary", label: "HighRise blue", hex: "#155eef" },
  { id: "indigo", label: "Indigo", hex: "#444ce7" },
  { id: "teal", label: "Teal", hex: "#0e9384" },
  { id: "success", label: "Green", hex: "#039855" },
  { id: "warning", label: "Amber", hex: "#dc6803" },
  { id: "orange", label: "Orange", hex: "#e04f16" },
  { id: "error", label: "Red", hex: "#d92d20" },
  { id: "rose", label: "Rose", hex: "#e31b54" },
  { id: "fuchsia", label: "Fuchsia", hex: "#ba24d5" },
  { id: "gray", label: "Neutral", hex: "#475467" },
] as const;

function luminance(hex: string): number {
  const v = hex.replace("#", "");
  const parts = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
  const lin = parts.map((c) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * lin[0]! + 0.7152 * lin[1]! + 0.0722 * lin[2]!;
}

/** WCAG contrast ratio between two hexes. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

export function NavAppearance({
  accountId,
  anchor,
  onClose,
}: {
  accountId: string;
  /** The control that opened it, so the panel can stay attached to it. */
  anchor: HTMLElement;
  onClose: () => void;
}) {
  const theme = useTheme();
  // Only what the portal itself needs: the nav theme for its own scope, since
  // everything else moved into NavColours with the controls that read it.
  const navTheme =
    theme.accountThemeFor(accountId).navTheme ?? theme.effective.navTheme;

  /*
   * The board replaces the panel's contents rather than opening beside it —
   * the drill pattern RowMenu and the edit card's menu already use here. One
   * box that stays where it opened survives being anchored near the nav's foot,
   * which a second popover flying upward does not.
   */
  const [picking, setPicking] = React.useState(false);

  const { ref, top, left } = useAnchored(
    anchor,
    picking ? PICKER_WIDTH : WIDTH,
    GAP,
  );
  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="Navigation appearance"
      // Portalling to the body puts this outside every [data-nav-theme] scope,
      // so it carries its own — same as the icon picker and the row menu.
      // Without it `bg-nav` resolves against the root and the panel paints
      // nothing, which is exactly what happened first time.
      data-nav-theme={navTheme}
      style={{ top, left, width: picking ? PICKER_WIDTH : WIDTH }}
      className="motion-panel-in fixed z-[71] rounded-[10px] bg-nav p-[12px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
    >
      <NavColours accountId={accountId} picking={picking} onPicking={setPicking} />
    </div>,
    document.body,
  );
}

function Group({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-[10px] last:mb-0">
      <span className="mb-[6px] block text-[10.5px] leading-[14px] font-semibold tracking-[0.5px] text-nav-fg-subtle uppercase">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * The colour controls themselves, with no surface of their own.
 *
 * Split out of NavAppearance so two places can host them: the edit card's
 * anchored popover, and the prototype controls — which is where the accents and
 * the custom picker live when the card is set to show only a light/dark icon.
 * One implementation, because two would drift and the contrast reading is the
 * kind of thing that drifts silently.
 *
 * `picking` is owned by the caller rather than here: the popover has to widen
 * for the picker board, so it needs to know which view is up.
 */
export function NavColours({
  accountId,
  picking,
  onPicking,
}: {
  accountId: string;
  picking: boolean;
  onPicking: (picking: boolean) => void;
}) {
  const theme = useTheme();
  const override = theme.accountThemeFor(accountId);
  const navTheme = override.navTheme ?? theme.effective.navTheme;
  const accentHex = override.customAccent ?? "#155eef";

  // The surface the accent has to hold up against, which is the whole reason
  // the two controls are in one popover rather than two places.
  const surface = navTheme === "dark" ? "#0c111d" : "#ffffff";
  const ratio = contrastRatio(accentHex, surface);
  const weak = ratio < 3;
  const custom = override.customSwatches ?? [];

  const setAccentTo = (hex: string) =>
    theme.setAccountTheme(accountId, { accent: "custom", customAccent: hex });

  const saveCustom = (hex: string) => {
    const value = hex.toLowerCase();
    /*
     * A colour already on offer is selected, not copied.
     *
     * HLColorPicker refuses a duplicate outright — "Color already in palette" —
     * because a swatch is identified by its value, so two tiles holding one
     * colour are indistinguishable. Mixing your way to a colour that happens to
     * be one of the ten presets used to tick it in both rows at once, which
     * reads as two separate selections.
     */
    const isPreset = SWATCHES.some((s) => s.hex === value);
    theme.setAccountTheme(accountId, {
      accent: "custom",
      customAccent: value,
      // Newest first, so a colour just mixed is the first tile in the row.
      ...(isPreset
        ? {}
        : { customSwatches: [value, ...custom.filter((c) => c !== value)] }),
    });
    onPicking(false);
  };

  const removeCustom = (hex: string) =>
    theme.setAccountTheme(accountId, {
      customSwatches: custom.filter((c) => c !== hex),
    });


  return (
    <>
      {picking ? (
        <>
          <button
            type="button"
            onClick={() => onPicking(false)}
            className="motion-tap mb-[8px] flex h-[24px] items-center gap-[5px] rounded-[6px] pr-[6px] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
          >
            <ChevronLeft size={14} aria-hidden="true" className="shrink-0" />
            <span className="text-[10.5px] leading-none font-semibold tracking-[0.5px] uppercase">
              Custom colour
            </span>
          </button>
          <AccentPicker
            initial={accentHex}
            onCancel={() => onPicking(false)}
            onSave={saveCustom}
          />
        </>
      ) : (
      <>
      <Group label="Surface">
        <div className="flex gap-[6px]">
          {(["light", "dark"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => theme.setAccountTheme(accountId, { navTheme: mode })}
              className={cn(
                "motion-tap flex h-[30px] flex-1 items-center justify-center gap-[6px] rounded-[7px] text-[12px] leading-none font-medium capitalize",
                navTheme === mode
                  ? "bg-nav-active text-nav-fg shadow-[inset_0_0_0_1px_var(--nav-fg-subtle)]"
                  : "text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover",
              )}
            >
              <span
                aria-hidden="true"
                className="size-[12px] rounded-full shadow-[inset_0_0_0_1px_var(--nav-divider)]"
                style={{ background: mode === "dark" ? "#0c111d" : "#ffffff" }}
              />
              {mode}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Accent">
        <div className="grid grid-cols-5 gap-[6px]">
          {SWATCHES.map((s) => {
            const on = accentHex.toLowerCase() === s.hex;
            return (
              <button
                key={s.id}
                type="button"
                title={`${s.label} — ${contrastRatio(s.hex, surface).toFixed(1)}:1`}
                aria-label={s.label}
                aria-pressed={on}
                onClick={() => setAccentTo(s.hex)}
                className={cn(
                  "motion-tap flex size-[30px] items-center justify-center rounded-[7px]",
                  on && "shadow-[0_0_0_2px_var(--nav)_,0_0_0_4px_var(--nav-fg)]",
                )}
                style={{ background: s.hex }}
              >
                {on ? (
                  <Check size={13} aria-hidden="true" className="text-white" />
                ) : null}
              </button>
            );
          })}
        </div>
      </Group>

      {/*
        The account's own colours, kept under the presets.

        HighRise groups swatches into labelled sections with their own add
        button, and the split earns itself here: the ten above are ours and
        never change, these are the tenant's and can be removed. One flat grid
        would make a brand colour look like something we shipped.
      */}
      <Group label="Custom">
        <div className="grid grid-cols-5 gap-[6px]">
          {custom.map((hex) => (
            <CustomSwatch
              key={hex}
              hex={hex}
              selected={accentHex.toLowerCase() === hex}
              contrast={`${contrastRatio(hex, surface).toFixed(1)}:1`}
              onSelect={() => setAccentTo(hex)}
              onRemove={() => removeCustom(hex)}
            />
          ))}
          <button
            type="button"
            onClick={() => onPicking(true)}
            aria-label="Mix a custom colour"
            title="Mix a custom colour"
            className="motion-tap flex size-[30px] items-center justify-center rounded-[7px] text-nav-fg-subtle shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg"
          >
            <Plus size={14} aria-hidden="true" />
          </button>
        </div>
      </Group>

      {/*
        Measured, not guessed. 3:1 is the large-text and UI-component threshold,
        which is what an accent is used for here — row highlights, buttons and
        the like, never body copy.
      */}
      <p
        className={cn(
          "mt-[10px] flex items-start gap-[6px] text-[11.5px] leading-[16px]",
          weak ? "text-[var(--hr-warning-500)]" : "text-nav-fg-subtle",
        )}
      >
        {weak ? (
          <TriangleAlert size={12} aria-hidden="true" className="mt-[2px] shrink-0" />
        ) : null}
        <span>
          {ratio.toFixed(1)}:1 against the {navTheme} nav.
          {weak
            ? " Under 3:1 — buttons and selected rows will be hard to pick out."
            : " Clears 3:1 for buttons and selected rows."}
        </span>
      </p>
      </>
      )}
    </>
  );
}
