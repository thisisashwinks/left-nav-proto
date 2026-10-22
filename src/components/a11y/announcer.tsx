"use client";

import { useEffect, useState } from "react";
import { subscribeAnnouncer } from "@/lib/a11y";

/*
  The one always-mounted polite live region. Screen readers only announce
  text that changes inside a region that already existed, so this stays in
  the tree and `announce()` swaps its text. Clearing first lets the same
  message be announced twice in a row.
*/
export function Announcer() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    let frame = 0;
    const unsubscribe = subscribeAnnouncer((next) => {
      setMessage("");
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setMessage(next));
    });
    return () => {
      cancelAnimationFrame(frame);
      unsubscribe();
    };
  }, []);

  return (
    <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
