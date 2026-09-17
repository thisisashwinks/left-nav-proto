"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Pin } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";

/**
 * Saying where a pinned row went.
 *
 * Pinning is the only action in this nav whose result lands somewhere other
 * than where the click happened: press the pin on a flyout row, and the thing
 * that changes is a list in the sidebar behind the panel you are looking at.
 * The state was always correct and always silent, so people pressed it twice.
 *
 * Held above the nav rather than inside any one surface, because the surfaces
 * that raise it — flyouts, the Recents panel, search, the nav's own rows — are
 * not ancestors of the list it lands in, and two of them unmount as part of the
 * interaction.
 */
interface PinFeedbackValue {
  /**
   * Fired by the pin button, on pin only.
   *
   * Unpinning is deliberately silent: the row leaves a list you are already
   * looking at, so there is no destination to point at and nothing to explain.
   */
  announce: (productId: string, from: HTMLElement) => void;
  /**
   * The row that just landed, for the treatments that animate the destination.
   *
   * An id plus a token: the token changes on every pin so re-pinning the same
   * row replays the animation instead of being swallowed as "no change".
   */
  landed: { productId: string; token: number } | null;
}

const PinFeedbackContext = React.createContext<PinFeedbackValue>({
  announce: () => {},
  landed: null,
});

export function usePinFeedback(): PinFeedbackValue {
  return React.useContext(PinFeedbackContext);
}

/**
 * The class a destination row wears while it is the one that just landed.
 *
 * Returns "" for every treatment that does not animate the destination, so the
 * caller can spread it unconditionally.
 */
export function usePinLanded(productId: string): string {
  const { pinFeedback } = useTheme().effective;
  const { landed } = usePinFeedback();
  if (landed?.productId !== productId) return "";
  if (pinFeedback === "mark") return "pin-landed-mark";
  if (pinFeedback === "settle") return "pin-landed-settle";
  return "";
}

/** How long the ghost takes to cross, and how long a landing stays marked. */
const FLIGHT_MS = 420;
const LANDED_MS = 700;

interface Flight {
  token: number;
  label: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

export function PinFeedbackProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { pinFeedback } = useTheme().effective;
  const [landed, setLanded] = React.useState<{
    productId: string;
    token: number;
  } | null>(null);
  const [flight, setFlight] = React.useState<Flight | null>(null);
  const token = React.useRef(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    const held = timers.current;
    return () => held.forEach(clearTimeout);
  }, []);

  const announce = React.useCallback(
    (productId: string, from: HTMLElement) => {
      if (pinFeedback === "off") return;
      token.current += 1;
      const id = token.current;

      /*
       * Where it is going, asked at the moment of the press.
       *
       * The destination is a list that is about to gain a row, so its geometry
       * changes in the same tick. Reading it now targets the slot the row is
       * arriving INTO — one row-height above where it will end up — which is
       * close enough to read as correct and avoids waiting a frame to find out.
       */
      const target = document.querySelector("[data-pin-target]");
      const fromBox = from.getBoundingClientRect();

      if (pinFeedback === "flight" && target) {
        const toBox = target.getBoundingClientRect();
        setFlight({
          token: id,
          label:
            from.closest("[data-pin-row]")?.textContent?.trim().slice(0, 28) ??
            "Pinned",
          from: {
            x: fromBox.left + fromBox.width / 2,
            y: fromBox.top + fromBox.height / 2,
          },
          to: { x: toBox.left + 26, y: toBox.top + 18 },
        });
        timers.current.push(
          setTimeout(() => {
            setFlight((f) => (f?.token === id ? null : f));
            setLanded({ productId, token: id });
          }, FLIGHT_MS),
        );
      } else {
        setLanded({ productId, token: id });
      }

      timers.current.push(
        setTimeout(
          () => setLanded((l) => (l?.token === id ? null : l)),
          FLIGHT_MS + LANDED_MS,
        ),
      );
    },
    [pinFeedback],
  );

  const value = React.useMemo(() => ({ announce, landed }), [announce, landed]);

  return (
    <PinFeedbackContext value={value}>
      {children}
      {flight ? <PinGhost key={flight.token} flight={flight} /> : null}
    </PinFeedbackContext>
  );
}

/**
 * The thing that crosses the screen.
 *
 * A pin glyph and the row's name rather than a copy of the row: a full row
 * flying over the canvas reads as the row leaving the list it is still in, and
 * at flyout width it is a slab. The mark is what the destination will show, so
 * the mark is what travels.
 *
 * Two renders: the first paints it at the source, the second — one frame later
 * — moves it, which is what gives the transition something to animate from.
 * Setting both in one pass lands it at the destination instantly.
 */
function PinGhost({ flight }: { flight: Flight }) {
  const [moved, setMoved] = React.useState(false);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setMoved(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const at = moved ? flight.to : flight.from;

  return createPortal(
    <div
      aria-hidden="true"
      style={{
        left: at.x,
        top: at.y,
        transitionDuration: `${FLIGHT_MS}ms`,
        // The fade runs on the same clock as the travel, so the chip is gone
        // exactly as it arrives rather than sitting on the destination.
        ["--flight" as string]: `${FLIGHT_MS}ms`,
        // Out and over rather than straight: a chip sliding along the shortest
        // line reads as a scrollbar, where an arc reads as something being put
        // somewhere.
        transitionTimingFunction: "cubic-bezier(0.3, 0.9, 0.35, 1)",
      }}
      className="pointer-events-none fixed z-[95] flex -translate-x-1/2 -translate-y-1/2 items-center gap-[6px] rounded-full bg-pg-overlay px-[10px] py-[5px] text-[12px] leading-none whitespace-nowrap text-pg-surface shadow-[0_8px_24px_0_rgba(15,23,42,0.28)] transition-[left,top,opacity,scale] [animation:pin-flight-out_var(--flight)_ease-in_forwards] motion-reduce:hidden"
    >
      <Pin size={11} aria-hidden="true" />
      {flight.label}
    </div>,
    document.body,
  );
}
