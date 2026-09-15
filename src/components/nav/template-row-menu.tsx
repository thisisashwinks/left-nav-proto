"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CopyPlus, Pencil, Trash2 } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useAnchored } from "@/lib/use-anchored";
import type { NavTemplate } from "./nav-templates";

/** Wide enough for "Duplicate template" on one line. */
export const ROW_MENU_WIDTH = 186;
const GAP = 6;

/**
 * Rename, duplicate, delete — in words, on the row they belong to.
 *
 * Every entry keeps the nav's own muted ink, destructive included. A red Delete
 * in a list whose other five rows are presets makes the list read as a place
 * where mistakes are waiting, and it is the confirmation behind it that carries
 * the weight — not the colour of the row that opens it.
 */
export function TemplateRowMenu({
  template,
  anchor,
  onRename,
  onDuplicate,
  onDelete,
  onClose,
}: {
  template: NavTemplate;
  anchor: HTMLElement;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const navTheme = useTheme().effective.navTheme;
  const { ref, top, left } = useAnchored(anchor, ROW_MENU_WIDTH, GAP);

  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    // Capture, so it beats the panel's own away-handler to the event and this
    // menu closes without taking the panel behind it.
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc, true);
    };
  }, [onClose, ref]);

  /*
   * A preset is HighLevel's, so its name and its existence are too.
   *
   * Both verbs that would alter it are refused; Duplicate stays live, and is
   * the documented way to get "the dental one, but ours" — the copy is never
   * `builtIn`, so everything is available on it from the first press.
   */
  const locked = template.builtIn === true;

  return createPortal(
    <div
      ref={ref}
      role="menu"
      aria-label={`Actions for ${template.name}`}
      /*
        The flag the surfaces above look for.

        This menu is portalled to the body, so it is not inside the panel that
        opened it — and every one of those panels closes on a pointerdown that
        lands outside its own ref. Without something to recognise it by, picking
        "Duplicate template" shut the list it belonged to before the click had
        finished.
      */
      data-template-row-menu=""
      data-nav-theme={navTheme}
      style={{ top, left, width: ROW_MENU_WIDTH }}
      className="motion-panel-in fixed z-[72] flex flex-col gap-[1px] rounded-[9px] bg-nav p-[5px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
    >
      <RowMenuItem
        icon={<Pencil size={13} aria-hidden="true" />}
        disabled={locked}
        onClick={onRename}
      >
        Rename template
      </RowMenuItem>
      <RowMenuItem
        icon={<CopyPlus size={13} aria-hidden="true" />}
        onClick={onDuplicate}
      >
        Duplicate template
      </RowMenuItem>
      <RowMenuItem
        icon={<Trash2 size={13} aria-hidden="true" />}
        disabled={locked}
        onClick={onDelete}
      >
        Delete template
      </RowMenuItem>
      {locked ? (
        // Why the two rows are dead, said once. A disabled control with no
        // reason beside it reads as broken rather than as not-yours.
        <p className="px-[8px] pt-[5px] pb-[3px] text-[11px] leading-[15px] text-nav-fg-subtle">
          Presets can&rsquo;t be renamed or deleted. Duplicate it to get your
          own.
        </p>
      ) : null}
    </div>,
    document.body,
  );
}

function RowMenuItem({
  icon,
  disabled = false,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className="motion-tap flex w-full items-center gap-[8px] rounded-[6px] px-[8px] py-[6px] text-left text-[12.5px] leading-[16px] font-medium text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg disabled:pointer-events-none disabled:opacity-40"
    >
      <span className="shrink-0 text-nav-fg-subtle">{icon}</span>
      {children}
    </button>
  );
}
