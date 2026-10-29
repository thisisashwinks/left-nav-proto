"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Play, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import type { NavTourWatchCut } from "@/design/theme";
import { cn } from "@/lib/utils";

/**
 * The launch video, opened from "Watch the tour" on the first coach mark.
 *
 * The HighRise modal (8px radius, shadow/xl, 12px-top header, 16px body) at
 * 880 wide, above the coach mark: the card is z 81, this is z 95, the same
 * layer as the page Modal. Its own copy rather than that Modal because the
 * scrim here is the tour's 50%, not the page's 60%, and the footer has to
 * know when the video ends.
 *
 * Plays with sound. The click on "Watch the tour" is the gesture that allows
 * it, but a browser can still refuse — then a play button sits over the
 * frame, rather than a video that looks broken. "Take the guided tour" gets a
 * slow pulse once the video is over, the one moment it is the obvious next
 * thing to press. Ashwin, Oct 28.
 *
 * Escape is caught in the capture phase and stopped there, so it closes the
 * modal and leaves the tour on its step.
 */
export function NavTourVideo({
  cut,
  onClose,
  onTour,
}: {
  cut: NavTourWatchCut;
  /** Maybe later, X, Esc or the scrim: back to the coach mark as it was. */
  onClose: () => void;
  /** Take the guided tour: close, and the tour moves on to step 2. */
  onTour: () => void;
}) {
  const { effective } = useTheme();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const closeRef = React.useRef<HTMLButtonElement>(null);
  /** The browser refused to start it with sound. */
  const [blocked, setBlocked] = React.useState(false);
  const [ended, setEnded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  // Focus moves into the modal, and back to whatever opened it on the way out.
  React.useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => opener?.focus?.({ preventScroll: true });
  }, []);

  // `autoPlay` alone fails silently when it is refused; play() says so.
  React.useEffect(() => {
    const video = videoRef.current;
    video?.play().catch(() => setBlocked(true));
    // Stopped on the way out, not left to finish unseen.
    return () => video?.pause();
  }, [cut]);

  const play = () => {
    setBlocked(false);
    videoRef.current?.play().catch(() => setBlocked(true));
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      data-page-theme={effective.appTheme}
      className="fixed inset-0 z-[95] flex items-center justify-center p-[16px]"
    >
      <style>{`
        @keyframes nav-tour-watch-pulse {
          0% { box-shadow: 0 0 0 0 color-mix(in oklab, var(--hr-primary-600) 45%, transparent); }
          70%, 100% { box-shadow: 0 0 0 8px color-mix(in oklab, var(--hr-primary-600) 0%, transparent); }
        }
        .nav-tour-watch-pulse { animation: nav-tour-watch-pulse 1.6s ease-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .nav-tour-watch-pulse { animation: none; box-shadow: 0 0 0 3px var(--hr-primary-100); }
        }
      `}</style>
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[rgba(16,24,40,0.5)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Meet the new sidebar"
        className="motion-panel-in relative flex max-h-[calc(100dvh-32px)] w-[880px] max-w-[90vw] flex-col overflow-hidden rounded-[8px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03)]"
      >
        <header className="flex shrink-0 items-center gap-[12px] px-[16px] pt-[12px]">
          <h2 className="min-w-0 flex-1 text-[16px] leading-[24px] font-semibold text-pg-heading">
            Meet the new sidebar
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-col p-[16px]">
          <div
            className={cn(
              "relative aspect-video w-full overflow-hidden rounded-[6px]",
              failed ? "bg-[var(--hr-gray-100)]" : "bg-[var(--hr-gray-900)]",
            )}
          >
            {failed ? (
              <p className="absolute inset-0 flex items-center justify-center px-[16px] text-center text-[14px] leading-[20px] text-[var(--hr-gray-500)]">
                Video coming soon
              </p>
            ) : (
              <video
                ref={videoRef}
                key={cut}
                src={`/tour/launch-${cut}.mp4`}
                controls
                autoPlay
                playsInline
                preload="auto"
                onPlay={() => {
                  setBlocked(false);
                  setEnded(false);
                }}
                onEnded={() => setEnded(true)}
                onError={() => setFailed(true)}
                className="block size-full"
              />
            )}
            {blocked && !failed ? (
              <button
                type="button"
                onClick={play}
                aria-label="Play video"
                className="motion-tap absolute top-1/2 left-1/2 flex size-[64px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[var(--hr-primary-600)] shadow-[0_4px_12px_rgba(16,24,40,0.24)] hover:bg-white"
              >
                <Play size={28} fill="currentColor" strokeWidth={0} className="ml-[3px]" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-[12px] px-[16px] pb-[16px]">
          <button
            type="button"
            onClick={onClose}
            className="motion-tap h-[36px] rounded-[6px] border border-[var(--hr-gray-300)] bg-white px-[14px] text-[14px] leading-[20px] font-semibold text-[var(--hr-gray-700)] shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[var(--hr-gray-50)] active:scale-[0.98]"
          >
            Maybe later
          </button>
          <button
            type="button"
            onClick={onTour}
            className={cn(
              "motion-tap h-[36px] rounded-[6px] bg-[var(--hr-primary-600)] px-[14px] text-[14px] leading-[20px] font-semibold text-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:bg-[var(--hr-primary-700)] active:scale-[0.98]",
              ended && "nav-tour-watch-pulse",
            )}
          >
            Take the guided tour
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
