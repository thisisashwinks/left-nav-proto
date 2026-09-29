"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CircleCheck, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * A one-line confirmation that dismisses itself.
 *
 * A module store rather than a context, so anything can call `showToast` —
 * a modal's confirm handler, a store tick — without the caller having to be
 * under a provider. One toast at a time: a second replaces the first, which
 * is what you want when three restores land in a row.
 */
type ToastState = { id: number; message: string } | null;

let current: ToastState = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

function emit(next: ToastState) {
  current = next;
  listeners.forEach((l) => l());
}

export function showToast(message: string) {
  if (timer) clearTimeout(timer);
  emit({ id: Date.now(), message });
  timer = setTimeout(() => emit(null), 4000);
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function Toaster() {
  const { effective } = useTheme();
  const toast = React.useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
  if (!toast) return null;

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="pointer-events-none fixed inset-x-0 bottom-[24px] z-[9000] flex justify-center px-[16px]"
    >
      <div
        key={toast.id}
        role="status"
        className="motion-slot-in pointer-events-auto flex max-w-[480px] items-center gap-[10px] rounded-[10px] bg-pg-overlay py-[10px] pr-[10px] pl-[14px] shadow-[0_8px_24px_0_rgba(16,24,40,0.28)]"
      >
        <CircleCheck
          size={16}
          aria-hidden="true"
          className="shrink-0 text-[var(--hr-success-500)]"
        />
        <span className="min-w-0 flex-1 text-[14px] leading-[20px] font-medium text-pg-surface">
          {toast.message}
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => emit(null)}
          className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint motion-tap hover:text-pg-overlay-fg"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
