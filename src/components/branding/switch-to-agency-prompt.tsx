"use client";

/**
 * "Switch to agency?" (Ashwin, Nov 20).
 *
 * The theme is an agency setting, so the doors that land in Agency settings
 * (White label section, Branding tab, Settings › Branding) can't just yank a
 * sub-account user up a level. From a sub-account they ask first; Switch runs
 * the held move (scope switch + land on the page), Cancel drops it.
 *
 * Compact buttons on purpose — 32px, 13px — so the CTA doesn't shout.
 */

import * as React from "react";
import { Modal } from "@/components/page/modal";

const BTN =
  "motion-tap flex h-[32px] items-center rounded-[8px] px-[12px] text-[13px] leading-[18px] font-medium whitespace-nowrap active:scale-[0.98]";

export function SwitchToAgencyPrompt({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      title="Switch to agency?"
      width={420}
      onClose={onCancel}
      footer={
        <>
          <button
            type="button"
            onClick={onCancel}
            className={`${BTN} bg-pg-surface text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] hover:bg-pg-bg`}
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={`${BTN} bg-brand text-white hover:brightness-95`}
          >
            Switch and customize
          </button>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        The theme can only be customized from the agency, and it applies to all sub-accounts.
        Switch to your agency to continue.
      </p>
    </Modal>
  );
}
