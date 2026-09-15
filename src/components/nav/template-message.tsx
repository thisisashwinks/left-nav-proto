"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * One place that decides where every template message appears.
 *
 * The feature had four of them — apply, save, the receipt, the client notice —
 * each placed where whoever built it happened to be looking, which is how one
 * feature ends up reading as four. This is the single rule, and the axis that
 * argues with it; see TEMPLATE_MESSAGE_PLACEMENTS.
 *
 * Two kinds, and the distinction is the whole of the default rule:
 *
 *   decision  Nothing has happened yet and nothing will until it is answered.
 *             Carries a scrim, takes focus, and cannot be dismissed by clicking
 *             away — a question you can lose behind a panel is a question that
 *             will be lost.
 *   notice    Something already happened. No scrim, no focus, dismissible, and
 *             it must not stand in the way of the next thing.
 */
export type TemplateMessageKind = "decision" | "notice";

/**
 * How far the nav-anchored placement sits from the nav's right edge, and how
 * far off the floor.
 *
 * The same figures the undo toast already used, so switching the axis to `nav`
 * lands these where that one has always been rather than near it.
 */
const NAV_GAP = 12;
const NAV_BOTTOM = 74;

/**
 * The nav column's right edge, live.
 *
 * Measured rather than passed down. The alternative is threading an offset from
 * the shell through the edit card, the templates menu and every message inside
 * it — five components that have no other reason to know the nav's width — and
 * the number changes under all of them anyway when the rail expands or the nav
 * collapses. A resize observer on the one element that actually knows is both
 * shorter and more correct.
 */
export function useNavRight(): number {
  const [right, setRight] = React.useState(0);
  React.useEffect(() => {
    const nav = document.querySelector('nav[aria-label="Main"]');
    if (!nav) return;
    const read = () => setRight(nav.getBoundingClientRect().right);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(nav);
    window.addEventListener("resize", read);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", read);
    };
  }, []);
  return right;
}

export function TemplateMessage({
  kind,
  label,
  onDismiss,
  width = 380,
  children,
}: {
  kind: TemplateMessageKind;
  /** Names the dialog for screen readers. */
  label: string;
  /**
   * Closing without answering.
   *
   * A notice takes it on the scrim-less backdrop and on Escape. A decision
   * takes it on Escape ONLY — clicking away from a question you have not
   * answered should do nothing, or the question is optional and should not have
   * been asked this way.
   */
  onDismiss: () => void;
  width?: number;
  children: React.ReactNode;
}) {
  const { templateMessagePlacement: placement, navTheme } = useTheme().effective;
  const navRight = useNavRight();

  /*
   * Three placements, two kinds, and the grid is small enough to state.
   *
   *              decision            notice
   *   by-kind    centre of page      on the nav
   *   centred    centre of page      top centre
   *   nav        on the nav          on the nav
   *
   * A decision is centred VERTICALLY as well — it is the thing you are being
   * asked about and nothing else is happening until it is answered. A notice is
   * top-centre instead: it reports something already done, and the middle of
   * the screen is where the work is.
   */
  const onNav =
    placement === "nav" || (placement === "by-kind" && kind === "notice");

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onDismiss();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onDismiss]);

  const decision = kind === "decision";

  return createPortal(
    <>
      {/*
        The scrim belongs to the kind, not to the placement.

        A decision hung off the nav is still a decision — it still stops the
        session until it is answered — so the `nav` placement moves the box and
        leaves the scrim exactly where it was. Without that, switching the axis
        would quietly turn a blocking question into a dismissible one, which is
        a behaviour change dressed up as a layout preference.
      */}
      {decision ? (
        <button
          type="button"
          aria-label="Close"
          tabIndex={-1}
          // Deliberately inert: see `onDismiss`.
          onClick={() => {}}
          data-template-message=""
          className="fixed inset-0 z-[88] cursor-default bg-[#10182899]"
        />
      ) : null}

      <div
        role={decision ? "dialog" : "status"}
        {...(decision ? { "aria-modal": true } : {})}
        aria-label={label}
        /*
          The same flag the row menu carries, for the same reason.

          This box is portalled to the body, so it is not inside the panel that
          raised it — and those panels close on any pointerdown outside their
          own ref. Unflagged, pressing "Delete template" tore the menu down on
          pointerdown and the button's click handler never ran: the dialog
          vanished and nothing was deleted.
        */
        data-template-message=""
        data-nav-theme={navTheme}
        style={
          onNav
            ? { left: navRight + NAV_GAP, bottom: NAV_BOTTOM, width }
            : { width }
        }
        className={cn(
          "motion-panel-in fixed z-[89] flex flex-col",
          "rounded-[10px] bg-nav p-[14px]",
          "shadow-[0_16px_40px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]",
          "max-w-[calc(100vw-32px)]",
          onNav
            ? // Anchored: the shell's own inline left/bottom place it.
              ""
            : kind === "decision"
              ? // Dead centre, both axes.
                "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              : // Top centre, clear of the app bar.
                "top-[16px] left-1/2 -translate-x-1/2",
        )}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

/** The title row every template message opens with. */
export function TemplateMessageTitle({
  icon,
  children,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-[9px]">
      {icon ? (
        <span className="mt-[1px] shrink-0 text-nav-fg-subtle">{icon}</span>
      ) : null}
      <h2 className="min-w-0 flex-1 text-[13.5px] leading-[18px] font-semibold text-nav-fg">
        {children}
      </h2>
    </div>
  );
}

/** The explanatory paragraph under the title. */
export function TemplateMessageBody({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mt-[6px] text-[12.5px] leading-[17px] text-nav-fg-muted">
      {children}
    </p>
  );
}

/**
 * The button row, in the two shapes the two placements need.
 *
 * Centred, this is a modal and wears a modal's footer: a horizontal row with
 * the way out on the left and the ways through on the right, primary last —
 * the arrangement every dialog in the product uses, and the reason a stack of
 * three full-width buttons read as a menu rather than as a decision.
 *
 * With only two buttons there is nothing to separate, so both go right
 * together. A lone "Cancel" pinned to the far left of a 380px box, with one
 * button opposite it, is a gap pretending to be structure.
 *
 * Anchored to the nav the row stays stacked: the box is narrow, it sits in the
 * corner of the screen, and three buttons side by side there would each be too
 * small to read.
 */
export function TemplateMessageActions({
  dismiss,
  actions,
}: {
  /** The way out — Cancel, Keep it. */
  dismiss: React.ReactNode;
  /** The ways through, least to most committing: primary goes last. */
  actions: React.ReactNode[];
}) {
  const { templateMessagePlacement: placement } = useTheme().effective;
  const stacked = placement === "nav";
  const all = [...actions, dismiss];

  if (stacked) {
    return (
      <div className="mt-[14px] flex flex-col gap-[6px]">
        {actions}
        {dismiss}
      </div>
    );
  }

  // Three or more: the way out separates from the ways through.
  if (all.length > 2) {
    return (
      <div className="mt-[16px] flex items-center gap-[8px]">
        {dismiss}
        <span className="ml-auto flex items-center gap-[8px]">{actions}</span>
      </div>
    );
  }

  return (
    <div className="mt-[16px] flex items-center justify-end gap-[8px]">
      {dismiss}
      {actions}
    </div>
  );
}

/**
 * One button, in the two weights these messages need.
 *
 * Grey for everything, destructive included — see the templates menu. A red
 * Delete in a list of five presets makes the list feel like a place where
 * mistakes are waiting, and the confirmation is what carries the weight here.
 */
export function TemplateMessageButton({
  tone = "quiet",
  icon,
  onClick,
  children,
}: {
  tone?: "primary" | "quiet";
  icon?: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const { templateMessagePlacement: placement } = useTheme().effective;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "motion-tap flex h-[32px] items-center justify-center gap-[7px] rounded-[7px]",
        // Full width stacked, content width in a footer row.
        placement === "nav" ? "w-full" : "px-[14px]",
        "text-[12.5px] leading-none font-medium active:scale-[0.99]",
        tone === "primary"
          ? "bg-nav-fg text-nav hover:opacity-90"
          : "text-nav-fg-muted shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav-hover hover:text-nav-fg",
      )}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </button>
  );
}

/**
 * Where a toast goes, for the two that are not this file's own message box.
 *
 * The undo offer and the push report are their own components with their own
 * markup — one of them predates templates entirely — so they take the geometry
 * rather than the shell. Centred means TOP centre for a toast: it reports
 * something already done, and the middle of the screen belongs to the work.
 */
export function useToastPlacement(): {
  onNav: boolean;
  style: React.CSSProperties;
} {
  const { templateMessagePlacement } = useTheme().effective;
  const navRight = useNavRight();
  const onNav = templateMessagePlacement !== "centred";
  return {
    onNav,
    style: onNav
      ? { left: navRight + NAV_GAP, bottom: NAV_BOTTOM }
      : { top: 16, left: "50%" },
  };
}

/**
 * The confirmation every template action now leaves behind.
 *
 * Applying was the only one that said anything, and only by accident — the
 * layout's own undo offer happened to catch it. Saving, creating, duplicating,
 * renaming and deleting were silent, which on a feature whose whole job is to
 * change things somewhere else is the worst possible place to be quiet.
 */
export function TemplateToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const { onNav, style } = useToastPlacement();

  React.useEffect(() => {
    const timer = setTimeout(onDismiss, 4000);
    return () => clearTimeout(timer);
  }, [onDismiss, message]);

  return createPortal(
    <div
      role="status"
      data-nav-theme="dark"
      style={style}
      className={cn(
        "motion-slot-in fixed z-[82] flex h-[38px] max-w-[calc(100vw-32px)] items-center gap-[12px] rounded-[10px] bg-nav px-[14px] shadow-[0_8px_24px_0_rgba(15,23,42,0.28)]",
        !onNav && "-translate-x-1/2",
      )}
    >
      <span className="truncate text-[13px] leading-none whitespace-nowrap text-nav-fg">
        {message}
      </span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onDismiss}
        className="motion-tap shrink-0 text-nav-fg-subtle hover:rotate-90 hover:text-nav-fg"
      >
        <X size={13} aria-hidden="true" />
      </button>
    </div>,
    document.body,
  );
}
