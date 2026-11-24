"use client";

/**
 * The Edit pill as a speed dial (Nov 19, prototype control `editEntry`,
 * on by default).
 *
 * Pressing Edit offers two actions instead of going straight into edit mode:
 *
 *   Edit layout       the existing nav edit mode
 *   Customize theme   the theme door (see useOpenThemeDoor)
 *
 * In Switchyard's own language, not Material's (Ashwin, Nov 19): squared 8px
 * corners, nav row type and ink, and kept INSIDE the sidebar column — never
 * spilling over its edge. Painted with the nav's tokens (it carries the
 * nav's `data-nav-theme`), so dark nav and agency branding reach it too.
 *
 * Two looks (`speedDialStyle`): one dropdown menu (default, Nov 20), or stacked buttons.
 * Direction (`speedDialDir`): above if there is room, always above, always below.
 */

import * as React from "react";
import { createPortal } from "react-dom";
import { LayoutTemplate, Palette } from "lucide-react";
import { useBranding } from "@/components/branding/branding-provider";
import { useBrandingAccess, useOpenThemeDoor } from "@/components/branding/branding-entry";
import { cn } from "@/lib/utils";

const ROW_H = 29;
const BTN_H = 26;
const GAP = 6;
const INSET = 8;

/** True when the speed dial is on and this viewer may pick a theme. */
export function useEditSpeedDial(): boolean {
  const { proto } = useBranding();
  const { visible } = useBrandingAccess();
  return visible && proto.editEntry === "speed-dial";
}

export function EditSpeedDial({
  anchor,
  onEditLayout,
  onClose,
}: {
  anchor: HTMLElement;
  onEditLayout: () => void;
  onClose: () => void;
}) {
  const { proto } = useBranding();
  const openTheme = useOpenThemeDoor();
  const ref = React.useRef<HTMLDivElement>(null);
  const menu = proto.speedDialStyle === "menu";

  // Taken once: where the pill is, and the column it lives in.
  const [pos] = React.useState(() => {
    const r = anchor.getBoundingClientRect();
    const col = (anchor.closest("[data-nav-column]") as HTMLElement | null)?.getBoundingClientRect();
    const navTheme = (anchor.closest("[data-nav-theme]") as HTMLElement | null)?.dataset.navTheme ?? "light";
    const colLeft = col ? col.left + INSET : r.left;
    const colWidth = col ? col.width - INSET * 2 : 240;
    const need = (menu ? 2 * ROW_H + 10 : 2 * BTN_H + GAP) + GAP;
    const above =
      proto.speedDialDir === "above" ? true : proto.speedDialDir === "below" ? false : r.top > need + 8;
    return {
      above,
      navTheme,
      // Both looks sit beside the pill: lined up on its right edge, hugging
      // their contents and growing left, so they stay inside the column
      // wherever the pill sits (Ashwin, Nov 19).
      right: window.innerWidth - r.right,
      maxWidth: Math.min(colWidth, r.right - colLeft),
      top: above ? r.top - GAP : r.bottom + GAP,
    };
  });

  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || anchor.contains(t)) return;
      onClose();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [anchor, onClose]);

  const items = [
    { key: "layout", label: "Edit layout", Icon: LayoutTemplate, run: onEditLayout },
    { key: "theme", label: "Customize theme", Icon: Palette, run: () => openTheme(anchor) },
  ];
  // Nearest the pill first: above, the list reads bottom-up.
  const ordered = pos.above ? [...items].reverse() : items;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const rows = [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const i = rows.indexOf(document.activeElement as HTMLElement);
    const next = rows[(i + (e.key === "ArrowDown" ? 1 : rows.length - 1)) % rows.length];
    next?.focus();
  };

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label="Edit"
      data-nav-theme={pos.navTheme}
      onKeyDown={onKeyDown}
      style={{
        right: pos.right,
        maxWidth: pos.maxWidth,
        top: pos.above ? undefined : pos.top,
        bottom: pos.above ? window.innerHeight - pos.top : undefined,
      }}
      className={cn(
        "fixed z-[80] flex flex-col font-sans",
        menu
          ? // The nav's own menu panel (the edit card's ⋯ menu).
            "speed-dial-in w-max rounded-[10px] bg-nav p-[5px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border,var(--nav-divider))]"
          : "items-end gap-[6px]",
      )}
    >
      {ordered.map((it, i) => {
        const step = pos.above ? ordered.length - 1 - i : i;
        return (
          <button
            key={it.key}
            type="button"
            role="menuitem"
            onClick={() => {
              onClose();
              it.run();
            }}
            style={menu ? undefined : { animationDelay: `${step * 40}ms` }}
            className={cn(
              "motion-tap flex max-w-full min-w-0 items-center text-left text-nav-fg outline-none",
              "hover:bg-nav-hover focus-visible:bg-nav-hover",
              menu
                ? // The ⋯ menu's row: 12.5px medium label, 14px glyph, 7px corners.
                  "w-full gap-[8px] rounded-[7px] py-[6px] pr-[12px] pl-[8px] text-[12.5px] leading-[17px] font-medium"
                : // The Edit pill's own size (Ashwin, Nov 19): 26px tall,
                  // 12px medium label, 13px glyph, 8px sides.
                  "speed-dial-in h-[26px] gap-[6px] rounded-[8px] bg-nav px-[8px] text-[12px] leading-none font-medium shadow-[0_2px_8px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border,var(--nav-divider))]",
            )}
          >
            <it.Icon
              size={menu ? 14 : 13}
              aria-hidden="true"
              className={cn("shrink-0", menu ? "text-nav-fg-subtle" : "text-nav-fg-muted")}
            />
            <span className="min-w-0 truncate">{it.label}</span>
          </button>
        );
      })}
      <style>{`
        @keyframes speed-dial-in {
          from { opacity: 0; transform: translate3d(0, ${pos.above ? 6 : -6}px, 0); }
          to { opacity: 1; transform: none; }
        }
        .speed-dial-in { animation: speed-dial-in var(--dur-base) var(--ease-out) both; }
      `}</style>
    </div>,
    document.body,
  );
}
