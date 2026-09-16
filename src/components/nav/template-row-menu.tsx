"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CopyPlus, Pencil, Save, Trash2, TriangleAlert } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useAnchored } from "@/lib/use-anchored";
import type { NavTemplate } from "./nav-templates";

/** Wide enough for "Duplicate template" on one line. */
export const ROW_MENU_WIDTH = 196;
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
  onUpdate,
  onResolve,
  onRename,
  onDuplicate,
  onDelete,
  onClose,
}: {
  template: NavTemplate;
  anchor: HTMLElement;
  /**
   * "Update to match this nav" — absent where it makes no sense.
   *
   * The verb that makes the list-first menu work, and the one a paragraph-style
   * menu is built around: you arrange the thing, then tell the style to match
   * it. Given only when this account is actually on this template, because
   * updating one you are not on would overwrite it with an arrangement it has
   * never held.
   */
  onUpdate?: () => void;
  /** Present only while this account is unresolved against this template. */
  onResolve?: () => void;
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
  /*
   * The default refuses duplication as well.
   *
   * A preset holds an arrangement, so copying it gives you that arrangement to
   * work on. The default holds none — it means "whatever this tenant ships
   * with" — so a copy of it would be a copy of nothing, named "HighLevel
   * default (copy)" and arranging zero rows.
   */
  const immutable = template.immutable === true;

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
      {onResolve ? (
        <RowMenuItem
          icon={<TriangleAlert size={13} aria-hidden="true" />}
          onClick={onResolve}
        >
          Resolve divergence
        </RowMenuItem>
      ) : null}
      {onUpdate ? (
        <RowMenuItem
          icon={<Save size={13} aria-hidden="true" />}
          onClick={onUpdate}
        >
          Update to match
        </RowMenuItem>
      ) : null}
      {/*
        Absent, not greyed.

        A preset cannot be renamed and the default cannot be touched at all —
        and a menu that opens onto three dead rows and a paragraph explaining
        why is a menu that has wasted the press. What you can do to this
        template is what the menu lists; the rest is not mentioned, and the
        kebab itself does not appear when nothing is left. See `verbs` in the
        caller.
      */}
      {locked ? null : (
        <RowMenuItem
          icon={<Pencil size={13} aria-hidden="true" />}
          onClick={onRename}
        >
          Rename template
        </RowMenuItem>
      )}
      {immutable ? null : (
        <RowMenuItem
          icon={<CopyPlus size={13} aria-hidden="true" />}
          onClick={onDuplicate}
        >
          Duplicate template
        </RowMenuItem>
      )}
      {locked ? null : (
        <RowMenuItem
          icon={<Trash2 size={13} aria-hidden="true" />}
          onClick={onDelete}
        >
          Delete template
        </RowMenuItem>
      )}
    </div>,
    document.body,
  );
}

/**
 * Whether this template has any verbs at all.
 *
 * Read by the list so it can leave the ⋯ off entirely. The default has none —
 * it cannot be renamed, duplicated or deleted, and you are not on it in a way
 * that could be updated — so a kebab there opens an empty box.
 */
export function templateHasActions(
  template: NavTemplate,
  opts: { canUpdate: boolean; canResolve: boolean },
): boolean {
  if (opts.canUpdate || opts.canResolve) return true;
  if (template.immutable) return false;
  // A preset can still be duplicated, which is the whole way to get your own.
  return true;
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
