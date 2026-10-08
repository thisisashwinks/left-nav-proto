"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { TriangleAlert, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { ResolvedIcon } from "./resolved-icon";
import { usePinShortcuts } from "./pin-shortcuts";
import { ShortcutChip } from "./shortcut-chip";
import type { LucideIcon } from "lucide-react";

export interface ShortcutRow {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** The trail under the name, so three rows called Settings can be told apart. */
  detail?: string;
}

/**
 * Every pinned row and the key it answers to, in one table.
 *
 * The chip on a row is the right place to change the shortcut you are looking
 * at; this is the right place to change the one you are not. Nine bindings are
 * a SET — the interesting question is which combos are spoken for and whether
 * the order still makes sense — and that question cannot be asked of a nav one
 * hovered row at a time.
 *
 * Reached from the kebab on a pinned row in edit mode, which is the only place
 * in this nav where a row admits to having settings.
 */
export function ShortcutModal({
  rows,
  onClose,
}: {
  rows: readonly ShortcutRow[];
  onClose: () => void;
}) {
  const { appTheme } = useTheme().effective;
  const shortcuts = usePinShortcuts();
  /*
   * Staged, not written through.
   *
   * The chip in the NAV binds the moment you press a combination, and that is
   * right there: one row, one gesture, no surface to confirm on. A table is
   * the other case — you come here to look at all five and you may well
   * rebind three of them, so the escape hatch has to be "close it" rather
   * than "undo each one". A draft is what gives the footer something to save
   * and the ✕ something to discard.
   *
   * `null` in the draft is a real value: it means this row was cleared.
   * `undefined` means untouched, which is why the lookup below distinguishes
   * them rather than using `??`.
   */
  const [draft, setDraft] = React.useState<Record<string, string | null>>({});
  /** A row is mid-capture. Drives the caution, which is about typing. */
  const [capturing, setCapturing] = React.useState(false);

  const comboFor = (id: string) =>
    id in draft ? (draft[id] ?? "") : shortcuts.comboFor(id);
  const changed = Object.keys(draft).length > 0;

  const save = () => {
    for (const [id, combo] of Object.entries(draft)) {
      if (combo === null) shortcuts.clear(id);
      else shortcuts.bind(id, combo);
    }
    onClose();
  };

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return createPortal(
    <div
      data-page-theme={appTheme}
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
        aria-label="Configure shortcut keys"
        className="motion-panel-in relative flex max-h-[80vh] w-[560px] max-w-full flex-col rounded-[12px] bg-pg-surface p-[24px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]"
      >
        {/*
          No icon tile. The attachment modals wear one because they are three
          sibling surfaces reached from three buttons on one tab, and the tile
          is what tells you which of the three opened — this one is reached
          from a menu item that already named it, so the glyph would be
          decoration repeating the title underneath it.
        */}
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="motion-tap absolute top-[22px] right-[22px] flex size-[28px] items-center justify-center rounded-full text-pg-muted hover:bg-pg-bg hover:text-pg-heading"
        >
          <X size={17} aria-hidden="true" />
        </button>

        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          Configure shortcut keys
        </h2>
        <p className="mt-[4px] text-[13px] leading-[19px] text-pg-muted">
          Each pinned item answers to one combination. Click a key to change it,
          Esc to cancel, Backspace to clear.
        </p>

        {rows.length === 0 ? (
          <p className="mt-[18px] rounded-[10px] px-[16px] py-[28px] text-center text-[13px] leading-[19px] text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
            Nothing is pinned yet. Pin a row and it takes the next key in the
            sequence.
          </p>
        ) : (
          <div className="mt-[18px] min-h-0 flex-1 overflow-y-auto rounded-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <div className="sticky top-0 z-10 grid grid-cols-[1fr_120px] items-center gap-[10px] border-b border-pg-head-border bg-pg-bg px-[14px] py-[9px]">
              <span className="text-[12px] leading-[16px] font-medium text-pg-muted">
                Pinned item
              </span>
              <span className="text-[12px] leading-[16px] font-medium text-pg-muted">
                Shortcut
              </span>
            </div>
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_120px] items-center gap-[10px] border-b border-pg-row-border px-[14px] py-[10px] last:border-b-0"
              >
                <span className="flex min-w-0 items-center gap-[9px]">
                  {row.icon ? (
                    <ResolvedIcon
                      icon={row.icon}
                      size={15}
                      className="shrink-0 text-pg-muted"
                    />
                  ) : null}
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[13.5px] leading-[19px] font-medium text-pg-text-strong">
                      {row.label}
                    </span>
                    {row.detail ? (
                      <span className="truncate text-[12px] leading-[16px] text-pg-muted">
                        {row.detail}
                      </span>
                    ) : null}
                  </span>
                </span>
                {/*
                  The same chip the row wears, always editable here and always
                  drawn — hover is how the nav keeps quiet, and this table is
                  the surface where the whole set is the subject.
                */}
                <span className="flex items-center">
                  <ShortcutChip
                    combo={comboFor(row.id)}
                    editable
                    onListeningChange={setCapturing}
                    onBind={(combo) =>
                      setDraft((d) => ({ ...d, [row.id]: combo }))
                    }
                    onClear={() =>
                      setDraft((d) => ({ ...d, [row.id]: null }))
                    }
                  />
                </span>
              </div>
            ))}
          </div>
        )}

        {/*
          The caution, while a key is being captured and not before.

          It is advice about what you are ABOUT to press, so a modal that
          opens wearing it is warning you off a thing you have not tried to
          do — and a banner that is always there is a banner nobody reads by
          the third visit. It appears with the listening state and goes with
          it.

          Nothing here can know what ⌃⌥N means in the browser this is running
          in, let alone what the OS or an extension has taken, so saying so is
          the honest alternative to implying a validation that does not exist.
        */}
        {capturing ? (
          <p className="motion-fade-in mt-[14px] flex items-start gap-[8px] rounded-[8px] bg-[var(--pg-av-yellow-bg)] px-[12px] py-[9px] text-[12.5px] leading-[18px] text-[var(--pg-av-yellow-fg)]">
            <TriangleAlert size={14} aria-hidden="true" className="mt-[2px] shrink-0" />
            <span>
              Do not clash with browser shortcuts, or with other shortcuts that
              might already be present.
            </span>
          </p>
        ) : null}

        {/*
          A footer only once there is something to commit.

          With nothing changed the ✕ is the whole of what this modal needs —
          a Done button that does exactly what closing does is a second name
          for the same action, and putting one under a read-only table
          implies the table was waiting on it.
        */}
        {changed ? (
          <div className="motion-fade-in mt-[16px] flex shrink-0 items-center justify-end gap-[10px]">
            <button
              type="button"
              onClick={onClose}
              className="motion-tap flex h-[36px] items-center rounded-[8px] px-[14px] text-[13.5px] leading-[20px] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border-strong)] hover:bg-pg-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              className="motion-tap flex h-[36px] items-center rounded-[8px] bg-[var(--admin-action)] px-[14px] text-[13.5px] leading-[20px] font-medium text-[var(--admin-action-fg)] hover:bg-[var(--admin-action-hover)] active:scale-[0.98]"
            >
              Save
            </button>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
