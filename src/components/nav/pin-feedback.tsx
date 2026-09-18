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
/** Which half of the action is being told: the arrival or the departure. */
export type PinEvent = "pin" | "unpin";

interface PinFeedbackValue {
  /**
   * Fired by the pin button, both ways now.
   *
   * Unpinning used to be silent, on the argument that the row leaves a list
   * you are already looking at. That holds for the treatments that point at a
   * DESTINATION — there is no destination in an unpin — but not for the two
   * that animate the row itself: a list that slides rows in and then blinks
   * them out tells half the story, and the half it drops is the one where
   * something you had is gone. What each treatment does with an unpin is
   * `usePinLanded`'s business; see PIN_FEEDBACKS for which ignore it.
   */
  announce: (productId: string, from: HTMLElement, event?: PinEvent) => void;
  /**
   * The row this is currently about, for the treatments that animate it.
   *
   * An id plus a token: the token changes on every press so pinning the same
   * row twice replays the animation instead of being swallowed as "no change".
   */
  landed: { productId: string; token: number; event: PinEvent } | null;
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
  const leaving = landed.event === "unpin";
  /*
    The wash does not care which way the press went.

    Pinning and unpinning are the same event seen twice — a row's membership
    changed — and the whole argument for this treatment is that it says WHICH
    row without claiming anything about where it went. Two animations here
    would be inventing a distinction the colour cannot carry.
  */
  if (pinFeedback === "hilite") {
    return leaving ? "pin-leaving-hilite" : "pin-landed-hilite";
  }
  if (pinFeedback === "settle") {
    return leaving ? "pin-leaving-settle" : "pin-landed-settle";
  }
  // The rest are about a destination, and an unpin has none — see PinEvent.
  if (leaving) return "";
  if (pinFeedback === "mark") return "pin-landed-mark";
  /*
    Flight lands too, and this is the half that makes it land.

    The row is already in the list while the chip is still travelling — the pin
    is instant, only the telling of it takes time — so the destination is not
    entering, it is receiving. A chip that dissolves over a list which does not
    react has been thrown at it rather than put into it. `landed` is set at the
    end of the flight, so this fires as the chip disappears.
  */
  if (pinFeedback === "flight") return "pin-landed-catch";
  return "";
}

/**
 * How long the chip takes to cross, and how long a landing stays marked.
 *
 * 520 rather than 420: the path is a curve now, and a curve travelled too fast
 * is indistinguishable from a straight line. This is the longest it can be
 * before it starts costing something — the pin itself already happened, so
 * every millisecond here is spent explaining rather than doing.
 */
const FLIGHT_MS = 520;
const LANDED_MS = 700;
/**
 * How long a leaving row is held in the slot it is vacating.
 *
 * The store removes the pin on the click, so by the time anything could be
 * animated the row has already moved — the list is the source of truth and it
 * has told the truth immediately. The hold puts it back for exactly the length
 * of its exit, which is `--dur-slow`; a hold longer than the animation leaves
 * an invisible row holding a gap open, which reads as the list stuttering.
 */
const EXIT_MS = 300;
/*
 * `hilite` holds for exactly as long as `settle` does — it IS `settle`, with a
 * wash riding on it, and the two options have to be comparable at the speed
 * they are compared at.
 */

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
    event: PinEvent;
  } | null>(null);
  const [flight, setFlight] = React.useState<Flight | null>(null);
  const token = React.useRef(0);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  React.useEffect(() => {
    const held = timers.current;
    return () => held.forEach(clearTimeout);
  }, []);

  const announce = React.useCallback(
    (productId: string, from: HTMLElement, event: PinEvent = "pin") => {
      if (pinFeedback === "off") return;
      // Nothing to say about a departure under the destination treatments —
      // and saying it anyway would hold the row in a slot for no animation.
      if (event === "unpin" && pinFeedback !== "settle" && pinFeedback !== "hilite") {
        return;
      }
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

      if (event === "unpin") {
        setLanded({ productId, token: id, event });
        timers.current.push(
          setTimeout(
            () => setLanded((l) => (l?.token === id ? null : l)),
            EXIT_MS,
          ),
        );
        return;
      }

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
            setLanded({ productId, token: id, event });
          }, FLIGHT_MS),
        );
      } else {
        setLanded({ productId, token: id, event });
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
 * The thing that crosses the screen, on a path that is actually curved.
 *
 * A pin glyph and the row's name rather than a copy of the row: a full row
 * flying over the canvas reads as the row leaving the list it is still in, and
 * at flyout width it is a slab. The mark is what the destination will show, so
 * the mark is what travels.
 *
 * THE CURVE. This used to transition `left` and `top` together and call itself
 * an arc in a comment. Interpolating two coordinates on one clock is a straight
 * line by definition, whatever easing it is given — the easing changes the
 * speed along the line, never the line.
 *
 * So the two axes are separated onto two elements with two different easings,
 * which is the oldest trick there is and the only one that needs no path
 * maths: the outer box carries the horizontal move on a curve that is fast then
 * slow, the inner box carries the vertical one on a curve that is slow then
 * fast. At every instant the chip is further along in x than it is in y, and
 * the shape that traces is a bow — out across the canvas first, then up into
 * the list. Which is the motion of putting something somewhere rather than
 * sliding it there.
 *
 * Three renders' worth of state in two: the first paints it at the source, the
 * second — one frame later — releases both transforms. Setting them in one pass
 * would land it instantly, because there would be nothing to transition from.
 */
function PinGhost({ flight }: { flight: Flight }) {
  const [moved, setMoved] = React.useState(false);

  React.useEffect(() => {
    // Two frames, not one. A single rAF still lands inside the same paint in
    // Chrome often enough that the chip occasionally teleports.
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setMoved(true));
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, []);

  const dx = flight.to.x - flight.from.x;
  const dy = flight.to.y - flight.from.y;

  return createPortal(
    <div
      aria-hidden="true"
      // The anchor never moves: it is the source, and everything below it is
      // expressed as a distance from here.
      style={{ left: flight.from.x, top: flight.from.y }}
      className="pointer-events-none fixed z-[95] motion-reduce:hidden"
    >
      <div
        style={{
          transform: `translateX(${moved ? dx : 0}px)`,
          transitionProperty: "transform",
          transitionDuration: `${FLIGHT_MS}ms`,
          // Out of the gate, then settling — the horizontal is where the
          // momentum is.
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          style={{
            transform: `translateY(${moved ? dy : 0}px)`,
            transitionProperty: "transform",
            transitionDuration: `${FLIGHT_MS}ms`,
            // Hangs, then drops in. Against the horizontal's easing this is
            // what bends the path.
            transitionTimingFunction: "cubic-bezier(0.55, 0, 0.85, 0.35)",
          }}
        >
          <div
            /*
              Longhands, not the `animation` shorthand in a class.

              The shorthand carries a duration of its own, and one of them has
              to win — which is exactly the kind of thing that works until
              somebody tunes FLIGHT_MS and nothing moves.
            */
            style={{
              animationName: "pin-flight-chip",
              animationDuration: `${FLIGHT_MS}ms`,
              animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
              animationFillMode: "forwards",
            }}
            className="flex -translate-x-1/2 -translate-y-1/2 items-center gap-[6px] rounded-full bg-pg-overlay px-[10px] py-[5px] text-[12px] leading-none whitespace-nowrap text-pg-surface shadow-[0_10px_28px_0_rgba(15,23,42,0.32)]"
          >
            <Pin size={11} aria-hidden="true" />
            {flight.label}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
