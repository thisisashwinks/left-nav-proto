"use client";

import * as React from "react";

/**
 * A record the page has opened, published to the trail.
 *
 * Detail views are in-page state here, not routes, so the shell cannot know
 * it is looking at one contact rather than the list of them. A page that
 * opens a record says so through this, and the breadcrumb grows one crumb —
 * which is what a back button was standing in for. The trail is the way out,
 * so the page does not need to draw a second one.
 */
export interface RecordCrumb {
  label: string;
  /** Run when the trail leaves the record, so the page can close it. */
  onExit?: () => void;
}

type Ctx = readonly [RecordCrumb | null, (crumb: RecordCrumb | null) => void];

export const RecordCrumbContext = React.createContext<Ctx>([
  null,
  () => undefined,
]);

export function useRecordCrumbState() {
  return React.useContext(RecordCrumbContext);
}

/**
 * Publishes a crumb for as long as the component is mounted.
 *
 * `onExit` is held in a ref so a fresh closure each render does not
 * re-publish the crumb, which would loop.
 */
export function useRecordCrumb(label: string | null, onExit?: () => void) {
  const [, setCrumb] = useRecordCrumbState();
  const exitRef = React.useRef(onExit);
  React.useEffect(() => {
    exitRef.current = onExit;
  });

  React.useEffect(() => {
    if (!label) return;
    setCrumb({ label, onExit: () => exitRef.current?.() });
    return () => setCrumb(null);
  }, [label, setCrumb]);
}
