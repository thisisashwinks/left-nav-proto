"use client";

import * as React from "react";

/**
 * What kinds of payload are in flight, page-wide. Empty when nothing is.
 *
 * The seams between rows do two jobs and have to know which one is wanted: a drop
 * line while something is in flight, a plus when nothing is. And they have to
 * know whether THIS drag is one they would accept, so every seam that could take
 * it can show a track before the pointer gets there — a drop target that only
 * appears once you are already on it is a target you have to find by feel.
 *
 * Read from the document rather than from the component that started the drag,
 * because the two ends of the gesture live in different trees: a row leaving a
 * flyout and a category taking its place in the nav. Neither sees the other's
 * dragstart.
 *
 * The types come from `dragstart`, which is the one event whose dataTransfer is
 * fully readable. `dragover` only keeps the flag alive.
 */
export function useDragTypes(): readonly string[] {
  const [types, setTypes] = React.useState<readonly string[]>([]);

  React.useEffect(() => {
    const onStart = (e: DragEvent) => {
      setTypes(e.dataTransfer ? [...e.dataTransfer.types] : ["unknown"]);
    };
    const onOver = (e: DragEvent) => {
      // A drag that began outside the page never fired dragstart here, so the
      // types arrive with the first dragover instead.
      setTypes((prev) =>
        prev.length > 0 ? prev : e.dataTransfer ? [...e.dataTransfer.types] : [],
      );
    };
    const off = () => setTypes([]);
    document.addEventListener("dragstart", onStart);
    document.addEventListener("dragover", onOver);
    document.addEventListener("dragend", off);
    document.addEventListener("drop", off);
    return () => {
      document.removeEventListener("dragstart", onStart);
      document.removeEventListener("dragover", onOver);
      document.removeEventListener("dragend", off);
      document.removeEventListener("drop", off);
    };
  }, []);

  return types;
}
