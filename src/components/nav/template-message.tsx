"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import { AccountLogo } from "@/components/accounts/account-logo";
import { accounts } from "@/components/accounts/accounts-data";
import { useNavTemplates } from "./nav-templates";
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
 * How far a top-centred message sits from the top of the window.
 *
 * One number, exported, because four surfaces place a toast there — this
 * file's own notices, the template toast, the undo offer and the push report —
 * and at 16px they cleared the app bar by so little that they read as attached
 * to it rather than floating over the page.
 */
export const TOAST_TOP = 32;

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
   * Escape, the scrim, and whatever the footer calls it — all three, for both
   * kinds.
   *
   * A decision's scrim used to be inert, on the reasoning that a question you
   * can click away from is a question that will be lost. That is the right rule
   * for a question whose answer is needed; it is the wrong one here, because
   * every decision in this feature has "do nothing" as its safe answer and
   * walking away IS that answer. Inert, the delete dialog had no way out that
   * anyone found — Escape works, and nobody reaches for Escape.
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
          onClick={onDismiss}
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
            : decision
              ? { width }
              : { width, top: TOAST_TOP }
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
                "left-1/2 -translate-x-1/2",
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
  /**
   * For a decision that cannot be taken yet.
   *
   * The delete dialog under `one-template` asks where the accounts go and
   * offers no default answer, so its primary action is unreachable until one is
   * picked. A dialog that let you press through it would be back to being a
   * warning you can dismiss.
   */
  disabled = false,
  children,
}: {
  tone?: "primary" | "quiet";
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const { templateMessagePlacement: placement } = useTheme().effective;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "motion-tap flex h-[32px] items-center justify-center gap-[7px] rounded-[7px]",
        // Full width stacked, content width in a footer row.
        placement === "nav" ? "w-full" : "px-[14px]",
        "text-[12.5px] leading-none font-medium active:scale-[0.99]",
        "disabled:pointer-events-none disabled:opacity-40",
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
      : { top: TOAST_TOP, left: "50%" },
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

/**
 * Which sub-accounts a decision reaches, a click away.
 *
 * Both dialogs that move other people's navigation — updating a template and
 * deleting one — carry a count in their body, and a count is the fact that
 * stops someone. It is not the fact that tells them whether they were right to
 * be stopped: "8" is reassuring until one of the eight is a client nobody meant
 * to touch. So the names are here, and folded, because eight of them unfolded
 * push the decision itself off the bottom of the box.
 *
 * Shared rather than written twice: the two dialogs ask the same question about
 * the same set, and a disclosure that said "Which ones?" in one and "Show the 8
 * sub-accounts" in the other would read as two different controls.
 */
export function AffectedAccounts({
  ids,
  /** Where every one of them ends up. Omit for a list with no destination. */
  to,
}: {
  ids: readonly string[];
  to?: string;
}) {
  const [showing, setShowing] = React.useState(false);
  // Membership is the table's business now — this only decides whether there is
  // anything to disclose at all.
  if (!accounts.some((a) => ids.includes(a.id))) return null;

  return (
    <div className="mt-[6px] flex flex-col gap-[4px]">
      {/*
        "Which ones?", not "Show the 8 sub-accounts".

        The count is in the sentence directly above and usually on the button
        below, so a third copy here is the same number three times in four
        lines. What this control has to say is the question the reader is
        holding — not how many, but which.
      */}
      <button
        type="button"
        aria-expanded={showing}
        onClick={() => setShowing((o) => !o)}
        className="motion-tap flex items-center gap-[4px] self-start rounded-[6px] px-[6px] py-[4px] text-[11.5px] leading-[15px] font-medium text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
      >
        {showing ? "Hide" : "Which ones?"}
        <ChevronDown
          size={12}
          aria-hidden="true"
          className={cn("motion-move", showing && "rotate-180")}
        />
      </button>
      {showing ? <AffectedAccountsTable ids={ids} {...(to ? { to } : {})} /> : null}
    </div>
  );
}

/**
 * Who moves, what they are on, and what they will be on.
 *
 * The same shape the bulk modal uses. It was a wrap of tags here and a
 * three-column table there — two presentations of one fact, which is the
 * inconsistency the review caught. The table is the one that survives, because
 * it can carry what the tags could not: not just WHO moves but what each of
 * them is on now and what they will be on after. A name on its own leaves the
 * reader to remember the second half.
 *
 * Exported bare as well as behind the disclosure, because the accordion save
 * dialog already has a header to hang it under — its own radio row — and a
 * second "Which ones?" inside that would be two doors to one table.
 */
export function AffectedAccountsTable({
  ids,
  to,
}: {
  ids: readonly string[];
  to?: string;
}) {
  const { linkedFor } = useNavTemplates();
  const reached = accounts.filter((a) => ids.includes(a.id));
  if (reached.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-[7px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
      <div className="flex items-center gap-[8px] bg-nav-hover px-[9px] py-[5px] text-[10px] leading-[14px] font-semibold tracking-[0.4px] text-nav-fg-subtle uppercase">
        <span className="min-w-0 flex-1">Sub-account</span>
        <span className="min-w-0 flex-1">Current template</span>
        {to ? <span className="min-w-0 flex-1">New template</span> : null}
      </div>
      <div className="flex max-h-[148px] flex-col overflow-y-auto">
        {reached.map((a) => {
          const from = linkedFor(a.id);
          const same = to !== undefined && from?.name === to;
          return (
            <div
              key={a.id}
              className="flex items-center gap-[8px] px-[9px] py-[6px] not-last:shadow-[inset_0_-1px_0_0_var(--nav-divider)]"
            >
              <span className="flex min-w-0 flex-1 items-center gap-[6px]">
                <AccountLogo
                  logo={a.logo}
                  {...(a.logoSrc ? { src: a.logoSrc } : {})}
                  size={15}
                  radius={999}
                />
                <span className="truncate text-[12px] leading-[16px] font-medium text-nav-fg">
                  {a.name}
                </span>
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] leading-[16px] text-nav-fg-subtle">
                {from?.name ?? "No template"}
              </span>
              {to ? (
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[12px] leading-[16px]",
                    same ? "text-nav-fg-subtle" : "font-medium text-nav-fg",
                  )}
                >
                  {same ? "No change" : to}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * A picker, rather than the browser's.
 *
 * A native `<select>` in a dialog opens the platform's own list — a grey sheet
 * in the OS's font, drawn over the dialog with none of its theming, and on
 * macOS it lands on top of the option you last chose rather than below the
 * control. Everything else here is a menu the product drew; this was the one
 * place it handed off.
 */
export function TemplatePicker({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: readonly { id: string; name: string }[];
  onChange: (id: string) => void;
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const chosen = options.find((o) => o.id === value);

  React.useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="motion-tap flex h-[32px] w-full items-center gap-[8px] rounded-[7px] bg-nav-hover px-[10px] text-left text-[12.5px] leading-none text-nav-fg"
      >
        <span className="min-w-0 flex-1 truncate">
          {chosen?.name ?? "Choose a template"}
        </span>
        <ChevronDown
          size={13}
          aria-hidden="true"
          className={cn("shrink-0 text-nav-fg-subtle motion-move", open && "rotate-180")}
        />
      </button>
      {open ? (
        /*
          Drawn in flow above the footer rather than floating over it: this sits
          inside a dialog that is already the topmost thing on screen, and a
          second portalled layer over it only exists to be mis-stacked.
        */
        <div
          role="listbox"
          aria-label={label}
          className="motion-menu-in absolute top-[calc(100%+4px)] right-0 left-0 z-10 flex max-h-[180px] flex-col gap-[1px] overflow-y-auto rounded-[8px] bg-nav p-[4px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
        >
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="option"
              aria-selected={o.id === value}
              onClick={() => {
                onChange(o.id);
                setOpen(false);
              }}
              className={cn(
                "motion-tap flex items-center gap-[8px] rounded-[6px] px-[8px] py-[6px] text-left text-[12.5px] leading-[16px]",
                o.id === value
                  ? "bg-nav-hover text-nav-fg"
                  : "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{o.name}</span>
              {o.id === value ? (
                <Check size={13} aria-hidden="true" className="shrink-0" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
