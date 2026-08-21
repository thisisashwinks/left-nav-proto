"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { UNGROUPED_ID, type ResolvedGroup } from "./grouping";

/**
 * Removing a category asks where its rows go.
 *
 * The alternative — drop the heading and let everything under it fall to top
 * level — is what `withGroupDeleted` does on its own, and it is the wrong default
 * for a category holding fourteen products: the admin deletes one row and gets
 * fourteen, with no obvious way back except an undo they may already have missed.
 * So deletion is a two-part decision stated in one place, and the products are
 * listed by name because "and its 14 items" is not something anyone can check.
 *
 * A real dialog, not an inline confirm. It is the only destructive edit in the
 * nav and the only one that needs a second answer before it can run.
 */
export function DeleteGroupDialog({
  group,
  destinations,
  labelFor,
  onConfirm,
  onCancel,
}: {
  group: ResolvedGroup;
  /** Every other category, plus nothing else — top level is offered separately. */
  destinations: ResolvedGroup[];
  labelFor: (productId: string) => string;
  /** `null` means top level: keep the rows, lose the heading. */
  onConfirm: (destinationId: string | null) => void;
  onCancel: () => void;
}) {
  const [target, setTarget] = React.useState<string>(
    destinations[0]?.id ?? UNGROUPED_ID,
  );
  const { navTheme } = useTheme();
  const count = group.productIds.length;

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // The flyout and the row menu behind this both listen for Escape.
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
        aria-label="Cancel"
        tabIndex={-1}
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-[#10182899]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Remove ${group.label}`}
        // 8px radius and the xl shadow the modal spec asks for.
        className="motion-panel-in relative flex w-[380px] max-w-full flex-col gap-[8px] rounded-[8px] bg-nav p-[16px] shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--fly-border)]"
      >
        <h2 className="text-[16px] leading-[normal] font-semibold text-nav-fg">
          Remove {group.label}?
        </h2>

        {count === 0 ? (
          <p className="text-[13px] leading-[18px] text-nav-fg-subtle">
            It&rsquo;s empty, so nothing moves.
          </p>
        ) : (
          <>
            <p className="text-[13px] leading-[18px] text-nav-fg-subtle">
              {count === 1 ? "1 item needs" : `${count} items need`} somewhere to
              go.
            </p>
            <ul className="flex max-h-[120px] flex-col gap-[2px] overflow-y-auto rounded-[6px] p-[8px] shadow-[inset_0_0_0_1px_var(--nav-divider)]">
              {group.productIds.map((id) => (
                <li
                  key={id}
                  className="truncate text-[13px] leading-[18px] text-nav-fg"
                >
                  {labelFor(id)}
                </li>
              ))}
            </ul>

            <label
              htmlFor="delete-group-destination"
              className="mt-[4px] flex items-center gap-[6px] text-[13px] leading-[18px] text-nav-fg-subtle"
            >
              <ArrowRight size={13} aria-hidden="true" />
              Move them to
            </label>
            <select
              id="delete-group-destination"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-[36px] w-full rounded-[6px] bg-nav px-[8px] text-[14px] leading-[20px] text-nav-fg shadow-[inset_0_0_0_1px_var(--nav-divider)] focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--brand)]"
            >
              {destinations.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
              {/* Last, and named for what it is: the rows stay in the nav as
                  rows of their own rather than going anywhere. */}
              <option value={UNGROUPED_ID}>Top level (no category)</option>
            </select>
          </>
        )}

        <div className="mt-[8px] flex justify-end gap-[12px]">
          <button
            type="button"
            onClick={onCancel}
            className="motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={() =>
              onConfirm(
                count === 0 || target === UNGROUPED_ID ? null : target,
              )
            }
            className={cn(
              "motion-tap flex h-[36px] items-center rounded-[6px] px-[12px] text-[14px] leading-[20px] font-medium",
              "bg-destructive text-white hover:opacity-90 active:scale-[0.98]",
            )}
          >
            Remove category
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
