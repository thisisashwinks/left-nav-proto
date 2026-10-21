"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronRight, LogOut, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnchored } from "@/lib/use-anchored";
import { UserAvatar } from "./user-avatar";
import { type AppKind } from "./get-app-modal";
import {
  GET_APP_MENU_LABELS,
  GET_APP_ROW_BADGES,
} from "@/components/flyout/get-app-flyout";
import { BADGE_TONE } from "@/components/flyout/types";
import type { FlyoutBadge } from "@/components/flyout/types";

const WIDTH = 268;
const GAP = 8;

/**
 * The signed-in user's menu, hung off the avatar in the app bar.
 *
 * The avatar has been a button with no menu behind it since the bar was built —
 * a target that highlights on hover and does nothing. This is production's own
 * menu, plus the two rows that hand you the companion apps.
 *
 * Anchored and portalled like every other menu in the shell, so it escapes the
 * bar's own overflow and cannot be clipped by it.
 */
export function AccountMenu({
  anchor,
  name,
  email,
  initials,
  showApps,
  onOpenApp,
  onClose,
}: {
  anchor: HTMLElement;
  name: string;
  email: string;
  initials: string;
  /**
   * Whether the two companion-app rows live here.
   *
   * Off when the placement axis has moved them to the app bar or the sidebar.
   * The offer stands in exactly one place at a time — two copies of it a click
   * apart is the duplication the review objects to everywhere else.
   */
  showApps: boolean;
  onOpenApp: (kind: AppKind) => void;
  onClose: () => void;
}) {
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
      role="menu"
      aria-label="Account"
      data-page-theme="light"
      style={{ top, left, width: WIDTH }}
      className="motion-panel-in fixed z-[72] overflow-hidden rounded-[10px] bg-pg-surface py-[4px] shadow-[0_12px_32px_0_rgba(16,24,40,0.16),inset_0_0_0_1px_var(--pg-border)]"
    >
      {/*
        Who you are signed in as, stated rather than implied.
        
        The email is the useful half: agencies keep several logins and the name
        on two of them is often the same person.
      */}
      <div className="flex items-center gap-[10px] px-[14px] py-[12px]">
        <UserAvatar size={38} initials={initials} />
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] leading-[18px] font-semibold text-pg-heading">
            {name}
          </span>
          <span className="block truncate text-[12.5px] leading-[17px] text-pg-muted">
            {email}
          </span>
        </span>
      </div>

      <Rule />

      {/*
        Inert, and carrying its chevron anyway.
        
        Login As opens an account picker in production. It is drawn here because
        the menu is recognisable without it and wrong without it, but nothing is
        wired: this prototype is about the nav, and building a second account
        switcher beside the rail would be building the thing under review.
      */}
      <Row
        icon={ChevronRight}
        label="Login As"
        trailing
        disabled
        onSelect={() => {}}
      />

      {showApps ? (
        <>
          <Rule />
          {/*
            The sidebar panel's words and its pills, not a second set.

            These rows used to read "Get Android & iOS app" / "Get Windows &
            macOS app" — the platform-qualified names, written for a surface
            where one row stands alone and has to answer "is my phone in
            there?". That argument was about the app bar. Here the two rows
            sit together under a rule, exactly as they do in the Download
            apps panel, and a reader who has seen one surface should not have
            to work out that the other is the same offer. So: one pair of
            names, and the Beta and New tags travel with them, because the
            maturity of the two apps is the same fact wherever it is read.
            Ashwin, Oct 21.
          */}
          <Row
            icon={Smartphone}
            label={GET_APP_MENU_LABELS.mobile}
            badge={GET_APP_ROW_BADGES.mobile}
            onSelect={() => {
              onOpenApp("mobile");
              onClose();
            }}
          />
          <Row
            icon={Monitor}
            label={GET_APP_MENU_LABELS.desktop}
            badge={GET_APP_ROW_BADGES.desktop}
            onSelect={() => {
              onOpenApp("desktop");
              onClose();
            }}
          />
        </>
      ) : null}

      <Rule />

      <Row icon={LogOut} label="Signout" onSelect={onClose} />
    </div>,
    document.body,
  );
}

function Rule() {
  return (
    <span
      aria-hidden="true"
      className="my-[4px] block h-px w-full bg-pg-border"
    />
  );
}

function Row({
  icon: Icon,
  label,
  badge,
  trailing = false,
  disabled = false,
  onSelect,
}: {
  icon: typeof LogOut;
  label: string;
  /**
   * An editorial tag after the label — Beta, New.
   *
   * The nav's own pill, through the nav's own tokens, so the tag on "Mobile
   * apps" is the same object here as it is in the Download apps panel. A
   * second set of badge colours for a menu that shows the same two rows is
   * how one fact ends up looking like two.
   */
  badge?: FlyoutBadge;
  /** The chevron sits on the right; the icon prop is that chevron. */
  trailing?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "motion-tap flex w-full items-center gap-[10px] px-[14px] py-[9px] text-left text-[13.5px] leading-[18px] text-pg-text",
        disabled
          ? "cursor-default text-pg-muted"
          : "hover:bg-pg hover:text-pg-heading",
      )}
    >
      {trailing ? null : (
        <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
      )}
      <span className="min-w-0 truncate">{label}</span>
      {badge ? (
        <span
          className={cn(
            "shrink-0 rounded-[2px] px-[4px] py-[2px] text-[10px] leading-[normal] font-semibold whitespace-nowrap",
            BADGE_TONE[badge.tone],
          )}
        >
          {badge.label}
        </span>
      ) : null}
      <span className="flex-1" />
      {trailing ? (
        <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
      ) : null}
    </button>
  );
}
