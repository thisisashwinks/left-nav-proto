"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { SWITCH_SLOW_MS } from "@/components/accounts/use-accounts";

/**
 * What a switch looks like while it is happening.
 *
 * Production takes 2–3 seconds to change account and sometimes longer, which
 * rules out the two easy answers. A spinner over the whole app is a stall you
 * are asked to watch; swapping instantly to an empty shell reads as a broken
 * page. What works at that duration is keeping the parts that do not change —
 * the nav's shape, the rail, the header — and admitting only the parts that do.
 *
 * So the chrome holds and wears the ARRIVING account immediately, and only the
 * two regions whose contents genuinely differ per account go to skeleton: the
 * nav's scrolling middle and the canvas. You are somewhere new that is loading
 * rather than somewhere old that is stuck.
 */

/** Rows in the nav's scrolling middle, at the widths real rows land on. */
export function NavRowsSkeleton({ rows = 9 }: { rows?: number }) {
  return (
    <div
      aria-hidden="true"
      className="motion-fade-in flex flex-col gap-[2px] px-[8px] pt-[6px]"
    >
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex h-[38px] items-center gap-[10px] px-[8px]">
          <span className="size-[16px] shrink-0 rounded-[4px] bg-nav-hover" />
          <span
            className="h-[9px] rounded-full bg-nav-hover"
            // Varied, and deterministic: a column of identical bars reads as a
            // loading GRAPHIC, where uneven ones read as text that has not
            // arrived. Same reason the canvas rows below vary.
            style={{ width: `${44 + ((i * 13) % 38)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * The same wait, at rail width.
 *
 * Not NavRowsSkeleton narrowed: that one pairs an icon with a text bar, and in a
 * 64px rail there is no label to stand in for — a bar beside the square would be
 * drawing something the real rows do not have. Squares alone, centred like the
 * icons they replace.
 */
export function RailRowsSkeleton({ rows = 9 }: { rows?: number }) {
  return (
    <div
      aria-hidden="true"
      className="motion-fade-in flex w-full flex-col items-center gap-[6px] pt-[6px]"
    >
      {Array.from({ length: rows }, (_, i) => (
        <span
          key={i}
          className="size-[16px] shrink-0 rounded-[4px] bg-nav-hover"
        />
      ))}
    </div>
  );
}

/** The page, while the arriving account's is on its way. */
export function CanvasSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="motion-fade-in flex h-full min-h-0 flex-col px-[var(--page-inset)]"
    >
      <div className="h-[28px] w-[220px] rounded-[6px] bg-pg-surface" />
      <div className="mt-[8px] h-[14px] w-[300px] rounded-[6px] bg-pg-surface" />
      <div className="mt-[20px] min-h-0 flex-1 rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]">
        {Array.from({ length: 9 }, (_, i) => (
          <div
            key={i}
            className="flex h-[52px] items-center gap-[12px] px-[16px] not-last:shadow-[inset_0_-1px_0_0_var(--pg-border)]"
          >
            <span className="size-[16px] shrink-0 rounded-[4px] bg-pg-bg" />
            <span
              className="h-[10px] rounded-full bg-pg-bg"
              style={{ width: `${28 + ((i * 11) % 26)}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * The determinate bar across the top of the canvas, and the line that appears
 * when the wait runs long.
 *
 * Determinate on purpose. An indeterminate bar says "something is happening";
 * over three seconds people want to know whether it is nearly done, and we
 * know the duration. It is an estimate, so it eases toward 92% and waits there
 * rather than sitting full while nothing has changed.
 */
export function SwitchProgress({
  label,
  duration,
}: {
  /** The account being switched to. */
  label: string;
  duration: number;
}) {
  const [elapsed, setElapsed] = React.useState(0);

  /*
   * An interval reading the clock, not requestAnimationFrame.
   *
   * rAF does not fire in a hidden tab, and a switch keeps running in one — its
   * commit is a setTimeout. Driven by rAF the bar froze at 0% the moment you
   * tabbed away and then jumped on return, which is worse than not animating.
   * A timer is throttled when hidden but still fires, and because the value is
   * computed from the clock rather than accumulated per tick, sparse ticks lose
   * smoothness and never accuracy.
   */
  React.useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => setElapsed(Date.now() - started), 50);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(92, (elapsed / duration) * 100);
  const slow = elapsed > SWITCH_SLOW_MS;

  return (
    <>
      <div
        role="progressbar"
        aria-label={`Opening ${label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(pct)}
        className="absolute inset-x-0 top-0 z-40 h-[2px] overflow-hidden bg-transparent"
      >
        <div
          className="h-full rounded-r-full bg-brand"
          // Width is driven per frame, not by a CSS transition: a transition
          // would still be easing toward the old value when the switch lands,
          // and the bar would visibly rewind as it unmounted.
          style={{ width: `${pct}%` }}
        />
      </div>

      {slow ? (
        <div
          className="motion-fade-in absolute inset-x-0 top-[10px] z-40 flex justify-center"
          role="status"
        >
          <span className="rounded-[8px] bg-pg-surface px-[10px] py-[6px] text-[12.5px] leading-[16px] text-pg-muted shadow-[var(--shell-canvas-shadow),inset_0_0_0_1px_var(--pg-border)]">
            Still opening {label} — larger accounts take a few seconds.
          </span>
        </div>
      ) : null}
    </>
  );
}
