"use client";

import * as React from "react";
import { ListChecks, Plus } from "lucide-react";

/**
 * A picture of the to-do app the assistant says it built. Not a to-do app.
 *
 * Same rule, and the same reasons, as `funnel-ai-preview.tsx`: no state, no
 * handlers, no list. The builder screen is in the prototype so the Sep 22
 * chrome review can judge a takeover against a two-column AI layout, and the
 * moment this column accepts a task it starts collecting bug reports ("the
 * filter does not filter") about software nobody proposed writing. A reviewer
 * who types into the field here gets what they would get typing into a
 * screenshot, which is the honest answer about how finished this is.
 *
 * The empty state is load-bearing rather than lazy. `0 left · 0 done` under
 * the filters says the generated app is real and untouched — a preview
 * pre-filled with "Buy milk" would invite exactly the wrong question, which is
 * whether the tasks are yours.
 *
 * On `--pv-*` rather than `--pg-*`, like the funnel preview and for its
 * reason: this is a customer's app being shown inside the tool, and the app's
 * own surfaces must not invert because the operator put the PLATFORM into dark
 * mode. Derived from `--brand` so it still follows the accent.
 */
const APP_PALETTE: React.CSSProperties = {
  "--pv-card": "oklch(from var(--brand) 0.995 calc(c * 0.01) h)",
  "--pv-card-2": "oklch(from var(--brand) 0.975 calc(c * 0.035) h)",
  "--pv-line": "oklch(from var(--brand) 0.92 calc(c * 0.06) h)",
  "--pv-title": "oklch(from var(--brand) 0.24 calc(c * 0.12) h)",
  "--pv-body": "oklch(from var(--brand) 0.5 calc(c * 0.08) h)",
  "--pv-faint": "oklch(from var(--brand) 0.68 calc(c * 0.06) h)",
  "--pv-accent": "var(--brand)",
  "--pv-on-accent": "var(--brand-fg)",
} as React.CSSProperties;

const FILTERS = ["All", "Active", "Completed"] as const;

export function AiStudioPreview() {
  return (
    <div
      style={APP_PALETTE}
      className="mx-auto w-full max-w-[560px] rounded-[16px] bg-[var(--pv-card)] p-[26px] shadow-[0_1px_2px_0_rgba(16,24,40,0.06),0_12px_32px_-16px_rgba(16,24,40,0.25)]"
    >
      <div className="flex items-center gap-[12px]">
        {/* The icon tile. Every generated app in the Sep 22 screenshots opens
            with one, and it is the only place the generated page uses the
            accent at full strength — so it reads as the app's mark rather than
            as a control you could press. */}
        <span
          aria-hidden="true"
          className="flex size-[40px] shrink-0 items-center justify-center rounded-[11px] bg-[var(--pv-accent)] text-[var(--pv-on-accent)]"
        >
          <ListChecks size={21} />
        </span>
        <div className="flex min-w-0 flex-col">
          <h2 className="text-[21px] leading-[26px] font-semibold tracking-[-0.3px] text-[var(--pv-title)]">
            Tasks
          </h2>
          <p className="text-[13px] leading-[18px] text-[var(--pv-body)]">
            Stay organized. Get things done.
          </p>
        </div>
      </div>

      {/*
        A div wearing a field's clothes, not an <input>. Deliberate: an input
        that accepts text and then loses it on the next render is worse than
        one that never invited the typing, and a `readOnly` input still takes
        focus and still looks like a promise.
      */}
      <div className="mt-[20px] flex items-center gap-[9px]">
        <div className="flex h-[40px] min-w-0 flex-1 items-center rounded-[10px] bg-[var(--pv-card-2)] px-[13px] text-[13.5px] leading-[normal] text-[var(--pv-faint)] shadow-[inset_0_0_0_1px_var(--pv-line)]">
          Add a new task…
        </div>
        <span className="flex h-[40px] shrink-0 items-center gap-[6px] rounded-[10px] bg-[var(--pv-accent)] px-[15px] text-[13.5px] leading-[normal] font-semibold text-[var(--pv-on-accent)]">
          <Plus size={15} aria-hidden="true" />
          Add
        </span>
      </div>

      <div className="mt-[18px] flex items-center gap-[7px]">
        {FILTERS.map((f, i) => (
          <span
            key={f}
            className={
              i === 0
                ? "flex h-[28px] items-center rounded-[8px] bg-[var(--pv-accent)] px-[12px] text-[12.5px] leading-[normal] font-semibold text-[var(--pv-on-accent)]"
                : "flex h-[28px] items-center rounded-[8px] px-[12px] text-[12.5px] leading-[normal] font-medium text-[var(--pv-body)] shadow-[inset_0_0_0_1px_var(--pv-line)]"
            }
          >
            {f}
          </span>
        ))}
        <div className="min-w-0 flex-1" />
        <span className="text-[12.5px] leading-[normal] text-[var(--pv-faint)]">
          0 left · 0 done
        </span>
      </div>

      <div className="mt-[16px] flex h-[124px] items-center justify-center rounded-[12px] border border-dashed border-[var(--pv-line)] px-[16px] text-center text-[13px] leading-[19px] text-[var(--pv-faint)]">
        No tasks yet. Add one above to get started.
      </div>
    </div>
  );
}
