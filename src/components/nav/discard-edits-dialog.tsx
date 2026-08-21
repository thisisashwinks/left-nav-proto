"use client";

import * as React from "react";
import { TriangleAlert } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { createPortal } from "react-dom";

/**
 * The one confirmation in the nav that is worth its weight.
 *
 * Everywhere else the edit is its own undo and the toast is the safety net — but
 * the toast holds one step for five seconds, and an edit session is a rename,
 * three drags and a deletion. Discarding throws all of it away at once, which is
 * the only edit in here that a five-second window cannot cover.
 *
 * Amber, not red: nothing is being destroyed that the admin did not just make,
 * and dressing "go back to how it was" in delete-red would make the safe exit
 * look like the dangerous one.
 */
export function DiscardEditsDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { navTheme } = useTheme();

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The flyout and the row menu behind this both listen for Escape, and
      // Escape here means "never mind", not "discard".
      e.stopPropagation();
      onCancel();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onCancel]);

  return createPortal(
    <div
      data-nav-theme={navTheme}
      data-cursor="menu"
      className="fixed inset-0 z-[80] flex items-center justify-center p-[16px]"
    >
      <button
        type="button"
        aria-label="Keep editing"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Discard your changes?"
        className="motion-panel-in relative flex w-[360px] max-w-full flex-col gap-[8px] rounded-[8px] bg-nav p-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--fly-border)]"
      >
        <span
          aria-hidden="true"
          className="flex size-[36px] items-center justify-center rounded-full bg-[var(--hr-warning-100)] text-[var(--hr-warning-700)]"
        >
          <TriangleAlert size={18} />
        </span>
        <h2 className="text-[16px] leading-[normal] font-semibold text-nav-fg">
          Discard your changes?
        </h2>
        <p className="text-[13px] leading-[18px] text-nav-fg-subtle">
          The nav goes back to how it was when you started editing. This
          can&rsquo;t be undone.
        </p>

        <div className="mt-[8px] flex justify-end gap-[12px]">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
          >
            Keep editing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            // Amber rather than red, and the default focus stays on the safe
            // button — the sequence that gets here is a mis-click away from
            // losing a session's work.
            className="motion-tap flex h-[36px] items-center rounded-[6px] bg-[var(--hr-warning-600)] px-[12px] text-[14px] leading-[20px] font-medium text-white hover:bg-[var(--hr-warning-700)] active:scale-[0.98]"
          >
            Discard changes
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
