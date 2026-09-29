"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * The centred modal, in the HighRise shape: 8px radius, shadow/xl, a 12px-top
 * header with a 16px inset, a 16px body and a footer whose buttons sit 12px
 * apart.
 *
 * Portalled to the body so no page's overflow can clip it, and re-stamped
 * with the page theme because the portal leaves the subtree that carries it.
 * Escape is caught in the capture phase and stopped there, so a modal opened
 * over a drawer closes on its own and leaves the drawer standing.
 */
export function Modal({
  title,
  icon,
  width = 480,
  onClose,
  footer,
  children,
  bodyClassName,
}: {
  title?: React.ReactNode;
  /** A feature glyph above the title — the "Import started" tile. */
  icon?: React.ReactNode;
  width?: number;
  onClose: () => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  bodyClassName?: string;
}) {
  const { effective } = useTheme();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  // Modals open from a click, never on first paint, so there is no server
  // render to match — the guard only keeps SSR from touching `document`.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[95] flex items-center justify-center p-[16px]"
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
        aria-label={typeof title === "string" ? title : "Dialog"}
        style={{ width }}
        className="motion-panel-in relative flex max-h-[calc(100dvh-32px)] max-w-full flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <header className="flex shrink-0 items-start gap-[12px] px-[16px] pt-[12px] pb-[4px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[12px] pt-[4px]">
            {icon}
            {title ? (
              <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
                {title}
              </h2>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div
          className={cn(
            "flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[16px] pt-[8px] pb-[16px]",
            bodyClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <footer className="flex shrink-0 items-center justify-end gap-[12px] px-[16px] pb-[16px]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
