"use client";

import * as React from "react";
import { LayoutTemplate, X } from "lucide-react";

/**
 * Telling a sub-account that its navigation moved without it.
 *
 * A managed template is the only thing in the nav whose edit lands somewhere
 * the editor is not standing: fifty navs change, and the first anyone in those
 * accounts hears of it is their sidebar being different.
 *
 * This used to be one of a pair. The other went to the AGENCY at the instant
 * they pressed save — the version, the account count, and a bullet list of
 * every product added, removed and regrouped. That one is gone (Sep 15): a
 * receipt for work you have just done deliberately does not need five lines,
 * and the save now says what it reached in one, like every other confirmation
 * in the feature.
 *
 * This half stays, because its reader is in the opposite position — they did
 * not do this, and "what changed" is the whole question rather than a detail.
 * It does not block: the nav rearranged, and a modal fired at fifty accounts is
 * fifty support tickets. Off unless asked for; see `templatePushNotice`.
 */
export function TemplateNoticeCard({
  templateName,
  version,
  changes,
  kept,
  onDismiss,
}: {
  templateName: string;
  version: number;
  changes: readonly string[];
  kept: boolean;
  onDismiss: () => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="mx-[12px] mb-[8px] shrink-0 rounded-[9px] bg-nav-hover p-[10px]">
      <div className="flex items-start gap-[8px]">
        <LayoutTemplate
          size={14}
          aria-hidden="true"
          className="mt-[2px] shrink-0 text-nav-fg-subtle"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] leading-[17px] font-medium text-nav-fg">
            This nav was updated
          </p>
          <p className="mt-[1px] text-[11.5px] leading-[15px] text-nav-fg-subtle">
            {templateName} v{version}
            {/*
              Said on the account, not only in the agency's report. The person
              opening this nav is the one who would otherwise assume their own
              tuning had been thrown away — and telling them it survived is
              worth more here than anywhere else.
            */}
            {kept ? " · your changes to this account were kept" : ""}
          </p>
          {open ? (
            <ul className="mt-[7px] flex flex-col gap-[3px]">
              {changes.map((line) => (
                <li
                  key={line}
                  className="flex gap-[6px] text-[11.5px] leading-[15px] text-nav-fg-muted"
                >
                  <span aria-hidden="true" className="text-nav-fg-subtle">
                    ·
                  </span>
                  <span className="min-w-0">{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-[7px] flex items-center gap-[6px]">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="motion-tap rounded-[6px] px-[7px] py-[4px] text-[11.5px] leading-none font-medium text-nav-fg shadow-[inset_0_0_0_1px_var(--nav-divider)] hover:bg-nav"
            >
              {open ? "Hide changes" : "See what changed"}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="motion-tap rounded-[6px] px-[7px] py-[4px] text-[11.5px] leading-none font-medium text-nav-fg-subtle hover:text-nav-fg"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
