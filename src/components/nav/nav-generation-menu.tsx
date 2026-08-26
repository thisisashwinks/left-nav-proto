"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  NAV_GENERATIONS,
  NAV_GENERATION_LABELS,
  type NavGeneration,
} from "@/design/theme";
import { cn } from "@/lib/utils";
import { useAnchored } from "@/lib/use-anchored";

const WIDTH = 232;
const GAP = 6;

/** What each choice actually puts on screen, under its name. */
const BLURBS: Record<NavGeneration, string> = {
  new: "This proposal — grouped, with flyouts, pinning and editing.",
  legacy: "What ships today — one flat list, no second level.",
};

/**
 * Which navigation to draw, as a menu rather than a control on the card.
 *
 * It was a segmented New / Old pair sitting on the card's bottom row, beside
 * Discard and Done. Two problems with that: it spent a third of the row on a
 * choice nobody makes twice in a session, and sitting in the row of exits it
 * read as a third way out — you leave the mode by pressing one of these three,
 * and one of them meant something entirely different.
 *
 * As an icon in the toolbar it costs 26px and reads as what it is: another thing
 * the toolbar can open, beside Show / hide and Colours. The names move inside,
 * where there is room to say what each one means — which the two-word segments
 * never had.
 */
export function NavGenerationMenu({
  anchor,
  onClose,
}: {
  /** The control that opened it, so the panel can stay attached to it. */
  anchor: HTMLElement;
  onClose: () => void;
}) {
  const { navGeneration, setNavGeneration, effective } = useTheme();
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
  }, [onClose, ref]);

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="Which navigation to show"
      // Portalled, so it carries its own nav theme — see the icon picker.
      data-nav-theme={effective.navTheme}
      style={{ top, left, width: WIDTH }}
      className="motion-panel-in fixed z-[71] flex flex-col rounded-[10px] bg-nav p-[8px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
    >
      <span className="mb-[6px] block px-[2px] text-[10.5px] leading-[14px] font-semibold tracking-[0.5px] text-nav-fg-subtle uppercase">
        Navigation
      </span>

      <div role="radiogroup" aria-label="Navigation" className="flex flex-col gap-[2px]">
        {NAV_GENERATIONS.map((generation) => {
          const active = generation === navGeneration;
          return (
            <button
              key={generation}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                setNavGeneration(generation);
                // Closes either way. Picking the one already showing is still a
                // decision, and leaving the panel up would read as it not having
                // registered.
                onClose();
              }}
              className={cn(
                "motion-tap flex w-full items-start gap-[8px] rounded-[7px] px-[7px] py-[6px] text-left",
                active ? "bg-nav-hover" : "hover:bg-nav-hover",
              )}
            >
              <span className="flex size-[15px] shrink-0 items-center justify-center pt-[1px]">
                {active ? (
                  <Check
                    size={14}
                    aria-hidden="true"
                    className="text-nav-fg"
                  />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13px] leading-[17px] font-medium text-nav-fg">
                  {NAV_GENERATION_LABELS[generation]}
                </span>
                <span className="block text-[11.5px] leading-[15px] text-nav-fg-subtle">
                  {BLURBS[generation]}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  );
}
