"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronRight, LogOut, Monitor, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAnchored } from "@/lib/use-anchored";
import { UserAvatar } from "./user-avatar";
import type { AppKind } from "./get-app-modal";

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
  onOpenApp,
  onClose,
}: {
  anchor: HTMLElement;
  name: string;
  email: string;
  initials: string;
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

      <Rule />

      <Row
        icon={Smartphone}
        label="Mobile app"
        onSelect={() => {
          onOpenApp("mobile");
          onClose();
        }}
      />
      <Row
        icon={Monitor}
        label="Desktop app"
        onSelect={() => {
          onOpenApp("desktop");
          onClose();
        }}
      />

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
  trailing = false,
  disabled = false,
  onSelect,
}: {
  icon: typeof LogOut;
  label: string;
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
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {trailing ? (
        <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
      ) : null}
    </button>
  );
}
