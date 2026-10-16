"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

/**
 * "Setting up McDonald's" — the first time a new account is opened.
 *
 * Full window, on purpose: the account is not there yet, so there is no nav
 * and no canvas to keep on screen. The checklist says what is being built, one
 * line at a time, so a five-second wait reads as work rather than a stall —
 * and the last line ticks only as the workspace opens.
 */

export const PREPARING_MS = 4600;

export function PreparingScreen({
  name,
  restaurant,
  snapshot,
  onDone,
}: {
  name: string;
  /** Restaurant workspaces list the restaurant steps. */
  restaurant: boolean;
  /** The snapshot being applied, on the snapshot path. */
  snapshot?: string;
  onDone: () => void;
}) {
  const steps = restaurant
    ? [
        "Restaurant profile, hours and branding from the listing",
        "Navigation and tools set up for how this restaurant runs",
        "Launchpad set up for dine-in, pickup and reservations",
        "Final checks and opening the workspace",
      ]
    : [
        "Business profile and branding from the listing",
        snapshot ? `Applying the ${snapshot} snapshot` : "Setting up the standard workspace",
        "Launchpad set up for your client's first steps",
        "Final checks and opening the workspace",
      ];
  const [done, setDone] = React.useState(0);
  const onDoneRef = React.useRef(onDone);
  React.useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  React.useEffect(() => {
    const per = PREPARING_MS / (steps.length + 0.5);
    const timers = steps.map((_, i) =>
      window.setTimeout(() => setDone(i + 1), per * (i + 1)),
    );
    const finish = window.setTimeout(() => onDoneRef.current(), PREPARING_MS);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
    // The step count is fixed for the life of the screen.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-label={`Setting up ${name}`}
      className="motion-fade-in fixed inset-0 z-[200] bg-white"
    >
      <style>{`
        @keyframes preparing-indeterminate {
          0% { transform: translateX(-60px); }
          100% { transform: translateX(520px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .preparing-bar { animation: none !important; transform: translateX(229px); }
        }
      `}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="HighLevel"
        src="/create-account/highlevel-logo.svg"
        width={125}
        height={28}
        className="absolute top-[44px] left-[24px] sm:left-[120px]"
      />
      <div className="absolute top-1/2 left-1/2 flex w-[min(508px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col gap-[20px]">
        <h1 className="text-[28px] leading-[34px] font-bold text-[#101828]">
          Setting up {name}
        </h1>
        <p className="max-w-[393px] text-[15px] leading-[18px] text-[#667085]">
          {restaurant
            ? "Building the restaurant workspace your client will open."
            : "Building the workspace your client will open."}{" "}
          This takes a few seconds.
        </p>
        <div
          role="progressbar"
          aria-label="Setting up"
          className="relative h-[8px] w-full overflow-hidden rounded-[64px] bg-[#eaecf0]"
        >
          <span
            className="preparing-bar absolute top-0 left-0 h-[8px] w-[50px] rounded-[64px] bg-[#155eef]"
            style={{ animation: "preparing-indeterminate 1.4s ease-in-out infinite" }}
          />
        </div>
        <ul className="flex flex-col gap-[16px]">
          {steps.map((label, i) => {
            const complete = i < done;
            return (
              <li key={label} className="flex items-center gap-[10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  aria-hidden="true"
                  src={complete ? "/create-account/check-done.svg" : "/create-account/check-pending.svg"}
                  width={20}
                  height={20}
                  className="shrink-0"
                />
                <span
                  className={cn(
                    "text-[18px] leading-[22px] motion-move",
                    complete ? "font-medium text-[#101828]" : "font-normal text-[#667085]",
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
