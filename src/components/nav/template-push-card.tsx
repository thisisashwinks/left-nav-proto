"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { LayoutTemplate, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { useNavRight } from "./template-message";

/**
 * The two halves of telling someone a template moved.
 *
 * A managed template is the only thing in the nav whose edit lands somewhere
 * the editor is not standing. Fifty navs change, and every piece of evidence
 * for it is in fifty places the agency is not looking — so without these two
 * cards the loudest act in the feature is also its most invisible one, and the
 * first anyone hears of it is a client asking why their sidebar moved.
 *
 * So it is said twice, to two different readers, at the two moments each of
 * them can act on it:
 *
 *   PushCard    to the agency, at the instant they press save. What it reached,
 *               and which accounts it had to work around. Read once, dismissed.
 *   NoticeCard  in each account the push touched, whenever it is next opened.
 *               Beside the nav that changed, which is the only place the news
 *               is checkable against the thing it is about.
 *
 * Neither of them blocks. The nav rearranged; nobody's work should stop for
 * that, and a modal fired at fifty accounts is fifty support tickets.
 */
export interface TemplatePush {
  name: string;
  version: number;
  /** How many other accounts it reached. */
  accounts: number;
  /** How many of those had their own tuning preserved through the merge. */
  kept: number;
  changes: readonly string[];
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** What just happened, to the person who caused it. */
export function TemplatePushCard({
  push,
  onClose,
}: {
  push: TemplatePush;
  onClose: () => void;
}) {
  const { templateMessagePlacement } = useTheme().effective;
  const navRight = useNavRight();
  // A finished report is a notice, so `by-kind` puts it on the nav with the
  // other notices — see TemplateMessage for the kinds.
  const onNav = templateMessagePlacement !== "centred";
  return createPortal(
    <div
      role="status"
      /*
       * Dark whatever the nav is wearing, and top centre rather than bottom.
       *
       * Every other floating surface here follows the nav's theme because it
       * belongs to the nav — a menu, a picker, a flyout. This one does not: it
       * reports on work that has just left this account for six others, and it
       * is the only notice in the product that is about somewhere else. Holding
       * one appearance is what separates a report from another panel, and dark
       * reads as system-level against both nav themes rather than dissolving
       * into the light one.
       *
       * Top centre for the same reason. The bottom edge belongs to the nav's
       * own foot — the edit card, the undo offers — so a push landing there
       * queued up behind the controls that caused it, in the corner the eye had
       * just left. The top is empty and is where the canvas is looked at.
       */
      data-nav-theme="dark"
      /*
        Placed by the shared rule now, not by this file.
        
        Top-centre was the right answer to "where does a report go" asked in
        isolation — and asking it in isolation is how the feature ended up with
        four messages in four coordinate systems. `by-kind` still lands a
        finished report off the nav rather than over the canvas; the axis is
        what lets the other two answers be seen. See TEMPLATE_MESSAGE_PLACEMENTS.
      */
      style={
        onNav ? { left: navRight + 12, bottom: 74 } : { top: 16, left: "50%" }
      }
      className={cn(
        "motion-panel-in fixed z-[80] w-[360px] rounded-[10px] bg-nav p-[12px] shadow-[0_16px_40px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]",
        !onNav && "-translate-x-1/2",
      )}
    >
      <div className="flex items-start gap-[9px]">
        <LayoutTemplate
          size={15}
          aria-hidden="true"
          className="mt-[2px] shrink-0 text-nav-fg-subtle"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-[18px] font-medium text-nav-fg">
            {push.name} saved as v{push.version}
          </p>
          <p className="mt-[1px] text-[12px] leading-[16px] text-nav-fg-subtle">
            {/*
              The blast radius first, and in accounts rather than a percentage:
              the number a person checks against what they thought they were
              doing is "how many navs did I just move".
            */}
            Updated {plural(push.accounts, "other account")}.
            {push.kept > 0
              ? ` ${plural(push.kept, "account")} kept their own changes.`
              : ""}
          </p>
          <ul className="mt-[8px] flex flex-col gap-[3px]">
            {push.changes.map((line) => (
              <li
                key={line}
                className="flex gap-[6px] text-[12px] leading-[16px] text-nav-fg-muted"
              >
                <span aria-hidden="true" className="text-nav-fg-subtle">
                  ·
                </span>
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="motion-tap -mt-[2px] -mr-[2px] flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle hover:bg-nav-hover hover:text-nav-fg"
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  );
}

/**
 * What happened here, to whoever opens this account next.
 *
 * Inline in the nav rather than a toast, and that is the point: it sits against
 * the list it is describing, so "moved Reporting into Growth" can be checked by
 * looking down. A toast would have floated over the canvas, which is the one
 * part of the screen the news is not about.
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
