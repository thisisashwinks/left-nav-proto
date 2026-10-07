"use client";

/*
 * The checkpoint list under Inbox build → Staging fixed.
 *
 * Multi-select: tick any mix of checkpoints and "Staging fixed" draws staging
 * plus exactly those. A parent's box ticks or clears everything under it; a
 * group of variants (`oneOf` in design/staging-fixes.ts) is a choice, where
 * picking one drops its siblings and picking the lit one clears it.
 */

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  STAGING_FIX_TREE,
  fixDefaults,
  fixLeaves,
  oneOfSiblings,
  type StagingFixNode,
} from "@/design/staging-fixes";

type Tri = "on" | "off" | "some";

function stateOf(node: StagingFixNode, on: ReadonlySet<string>): Tri {
  if (!node.children) return on.has(node.id) ? "on" : "off";
  const kids = node.children.map((c) => stateOf(c, on));
  // A variant group is on once any one variant is picked.
  if (node.oneOf) return kids.some((k) => k !== "off") ? "on" : "off";
  if (kids.every((k) => k === "on")) return "on";
  if (kids.every((k) => k === "off")) return "off";
  return "some";
}

function Box({ state, round = false }: { state: Tri; round?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-px flex size-[12px] shrink-0 items-center justify-center border",
        round ? "rounded-full" : "rounded-[3px]",
        state === "off" ? "border-pg-border-strong bg-pg-surface" : "border-brand bg-brand text-brand-fg",
      )}
    >
      {state === "on" && round ? <span className="size-[4px] rounded-full bg-current" /> : null}
      {state === "on" && !round ? (
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      ) : null}
      {state === "some" ? <span className="h-[2px] w-[6px] rounded-full bg-current" /> : null}
    </span>
  );
}

export function StagingFixTree({
  value,
  onChange,
}: {
  value: readonly string[];
  onChange: (next: string[]) => void;
}) {
  const on = React.useMemo(() => new Set(value), [value]);

  const toggleGroup = (node: StagingFixNode) => {
    const next = new Set(on);
    if (stateOf(node, on) === "off") fixDefaults(node).forEach((id) => next.add(id));
    else fixLeaves(node).forEach((id) => next.delete(id));
    onChange([...next]);
  };

  const toggleLeaf = (id: string) => {
    const next = new Set(on);
    if (next.has(id)) next.delete(id);
    else {
      next.add(id);
      oneOfSiblings(id).forEach((s) => next.delete(s));
    }
    onChange([...next]);
  };

  const all: StagingFixNode = { id: "all", label: "All checkpoints", children: STAGING_FIX_TREE };

  const render = (node: StagingFixNode, depth: number, inOneOf: boolean): React.ReactNode => {
    const leaf = !node.children;
    const state = stateOf(node, on);
    return (
      <div key={node.id} className="flex flex-col gap-[6px]">
        <button
          type="button"
          role={inOneOf ? "radio" : "checkbox"}
          aria-checked={state === "on" ? true : state === "some" ? "mixed" : false}
          onClick={() => (leaf ? toggleLeaf(node.id) : toggleGroup(node))}
          className="motion-tap flex items-start gap-[6px] text-left"
          style={{ paddingLeft: depth * 12 }}
        >
          <Box state={state} round={inOneOf} />
          <span className="flex min-w-0 flex-col gap-[2px]">
            <span
              className={cn(
                "text-[11px] leading-[14px]",
                depth <= 1 ? "font-medium text-pg-text" : "text-pg-muted",
              )}
            >
              {node.label}
              {node.oneOf ? <span className="text-pg-faint"> · variants</span> : null}
            </span>
            {node.note ? (
              <span className="text-[10px] leading-[13px] text-pg-faint">{node.note}</span>
            ) : null}
          </span>
        </button>
        {node.children?.map((c) => render(c, depth + 1, !!node.oneOf))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-[6px] rounded-[6px] border border-pg-border p-[8px]">
      {render(all, 0, false)}
    </div>
  );
}
