"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Compass, Pencil, Users, type LucideIcon } from "lucide-react";
import { useAnchored } from "@/lib/use-anchored";
import { cn } from "@/lib/utils";
import {
  NAV_TOUR_RESTART_FLOWS,
  startNavTour,
  useNavTourRestart,
  type RestartableFlowId,
} from "./nav-tour";

const WIDTH = 300;

/** Every row in the shell's menus carries an icon; these are the flows'. */
const FLOW_ICONS: Record<RestartableFlowId, LucideIcon> = {
  getStarted: Compass,
  subAccounts: Users,
  editing: Pencil,
};

/**
 * The flows, as menu rows under a "Navigation tour" header — the one choice
 * every restart entry point offers. Picking one closes whatever holds the
 * rows and starts that flow from its first step. Ashwin, Oct 28.
 */
export function NavTourFlowRows({ onPicked }: { onPicked: () => void }) {
  return (
    <>
      <p className="px-[14px] pt-[8px] pb-[4px] text-[12px] leading-[16px] font-medium text-[var(--hr-gray-500)]">
        Navigation tour
      </p>
      {NAV_TOUR_RESTART_FLOWS.map((flow) => {
        const Icon = FLOW_ICONS[flow.id];
        return (
          <button
            key={flow.id}
            type="button"
            role="menuitem"
            onClick={() => {
              onPicked();
              startNavTour(flow.id);
            }}
            className="motion-tap flex w-full items-start gap-[10px] px-[14px] py-[8px] text-left text-pg-text hover:bg-pg hover:text-pg-heading"
          >
            <Icon size={16} aria-hidden="true" className="mt-[2px] shrink-0 text-pg-muted" />
            <span className="min-w-0">
              <span className="block truncate text-[14px] leading-[20px]">{flow.label}</span>
              <span className="block truncate text-[13px] leading-[18px] text-[var(--hr-gray-500)]">
                {flow.hint}
              </span>
            </span>
          </button>
        );
      })}
    </>
  );
}

/**
 * "Take the tour", at the sidebar's foot by Edit — the restart axis's footer
 * option. Draws nothing under any other option or outside sub-account scope;
 * the nav hides it in edit mode and when collapsed. See NAV_TOUR_RESTARTS.
 */
export function NavTourFooterRow() {
  const on = useNavTourRestart("footer");
  const [anchor, setAnchor] = React.useState<HTMLElement | null>(null);
  const close = React.useCallback(() => setAnchor(null), []);
  if (!on) return null;
  return (
    <div className="flex w-full shrink-0 px-[12px] pt-[4px]">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={anchor !== null}
        onClick={(e) => {
          const trigger = e.currentTarget;
          setAnchor((open) => (open ? null : trigger));
        }}
        className={cn(
          // Hugs its label: Edit's pill hangs off the same line to the right.
          "motion-tap flex h-[32px] items-center gap-[8px] rounded-[6px] px-[8px] text-[13px] leading-[18px] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
          anchor && "bg-nav-hover text-nav-fg",
        )}
      >
        <Compass size={16} aria-hidden="true" className="shrink-0" />
        Take the tour
      </button>
      {anchor ? <NavTourMenu anchor={anchor} onClose={close} /> : null}
    </div>
  );
}

/**
 * The flows as a menu hung off `anchor` — the sidebar's "Take the tour", and
 * the app bar's Help in its dropdown form, which puts its own rows `before`.
 * The account menu's shape, anchored and portalled like it.
 */
export function NavTourMenu({
  anchor,
  label = "Navigation tour",
  before,
  onClose,
}: {
  anchor: HTMLElement;
  label?: string;
  /** Rows above the flows, divided from them. */
  before?: React.ReactNode;
  onClose: () => void;
}) {
  const { ref, top, left } = useAnchored(anchor, WIDTH, 8);

  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      // The trigger toggles itself; closing here too would reopen it.
      if (!ref.current?.contains(t) && !anchor.contains(t)) onClose();
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [anchor, onClose, ref]);

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={label}
      data-page-theme="light"
      style={{ top, left, width: WIDTH }}
      className="motion-panel-in fixed z-[72] overflow-hidden rounded-[10px] bg-pg-surface py-[4px] shadow-[0_12px_32px_0_rgba(16,24,40,0.16),inset_0_0_0_1px_var(--pg-border)]"
    >
      {before ? (
        <>
          {before}
          <span aria-hidden="true" className="my-[4px] block h-px w-full bg-pg-border" />
        </>
      ) : null}
      <NavTourFlowRows onPicked={onClose} />
    </div>,
    document.body,
  );
}
