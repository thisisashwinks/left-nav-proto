"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, TriangleAlert } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useAnchored } from "@/lib/use-anchored";
import { cn } from "@/lib/utils";

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
  const override = theme.accountThemeFor(accountId);
  const navTheme = override.navTheme ?? theme.effective.navTheme;
  const accentHex = override.customAccent ?? "#155eef";

  // The surface the accent has to hold up against, which is the whole reason
  // the two controls are in one popover rather than two places.
  const surface = navTheme === "dark" ? "#0c111d" : "#ffffff";
  const ratio = contrastRatio(accentHex, surface);
  const weak = ratio < 3;

  const { ref, top, left } = useAnchored(anchor, WIDTH, GAP);
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
      style={{ top, left, width: WIDTH }}
      className="motion-panel-in fixed z-[71] rounded-[10px] bg-nav p-[12px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
    >
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
                onClick={() =>
                  theme.setAccountTheme(accountId, {
                    accent: "custom",
                    customAccent: s.hex,
                  })
                }
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
