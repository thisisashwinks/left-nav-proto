"use client";

import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The same 17px box the tables draw, in the nav's own colours — the panels
 * that use it are nav surfaces, and a page-token checkbox on one goes
 * invisible in dark.
 *
 * Shared rather than local to the directory, which is where it started. Once
 * the header dropdown grew a selection mode too, a second copy would have
 * meant two checkboxes answering one question for the same reader — the exact
 * thing the row treatment beside it is written to avoid. One box, both panels.
 */
export function SelectBox({
  checked,
  mixed = false,
  onClick,
  label,
}: {
  checked: boolean;
  mixed?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={mixed ? "mixed" : checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "motion-tap flex size-[17px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px]",
        /*
          One ink for the whole selection layer, with the Actions button
          beside it — and which ink is now an axis. See ADMIN_ACCENTS.

          It went near-black, then primary blue on Oct 5 (the argument being
          that blue is the PRODUCT's colour and does not move per account,
          unlike the accent), and is neutral again by default on Oct 8 with
          blue one click away. The newer argument is not about which blue: a
          tick that feeds a bulk run across forty sub-accounts belongs to the
          agency operating on them, and the admin layer reads better when it
          is visibly not part of any one tenant's product.
        */
        checked || mixed
          ? "border-[var(--admin-action)] bg-[var(--admin-action)] text-[var(--admin-action-fg)]"
          : "border-[var(--fly-border)] hover:border-nav-fg-subtle",
      )}
    >
      {mixed ? (
        <Minus size={12} aria-hidden="true" />
      ) : checked ? (
        <Check size={12} aria-hidden="true" />
      ) : null}
    </button>
  );
}
