"use client";

import { cn } from "@/lib/utils";

/**
 * Keycap. From the design: 18px tall inline, 16px in footers, 3–4px radius,
 * 1px border and a 10–11px medium label.
 */
export function Kbd({
  children,
  small = false,
  onClick,
}: {
  children: React.ReactNode;
  small?: boolean;
  onClick?: () => void;
}) {
  const shell = cn(
    "flex shrink-0 items-center justify-center bg-sr-kbd whitespace-nowrap text-sr-muted shadow-[inset_0_0_0_1px_var(--sr-kbd-border)]",
    small
      ? "h-[16px] rounded-[3px] px-[4px] text-[10px] font-medium"
      : "h-[18px] rounded-[4px] px-[5px] text-[11px]",
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(shell, "motion-tap hover:text-sr-fg")}>
        {children}
      </button>
    );
  }

  return (
    <span aria-hidden="true" className={shell}>
      {children}
    </span>
  );
}
