"use client";

import * as React from "react";
import { Lock, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, Chip, SettingRow, Switch } from "./controls";
import { defaultFeatureState, FEATURE_GROUPS, FEATURES } from "./customizer-data";

/**
 * Features: everything the account can have, on or off.
 *
 * Deny-list framing, matching how the backend actually stores this: the plan
 * turns everything on, and this screen records what is taken away. Grouped
 * under the same headings the nav uses, so flipping a switch and finding the
 * row it removes are the same mental map. Turning a product off removes it
 * from the nav, search and quick actions for every user — data is kept.
 */
export function FeaturesSection() {
  const [state, setState] = React.useState<Record<string, boolean>>(defaultFeatureState);
  const [query, setQuery] = React.useState("");

  const toggle = (id: string) => setState((s) => ({ ...s, [id]: !s[id] }));
  const q = query.trim().toLowerCase();
  const visible = FEATURES.filter(
    (f) => q === "" || f.label.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q),
  );
  const total = FEATURES.length;
  const on = FEATURES.filter((f) => state[f.id]).length;

  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-[10px]">
        <label className="flex h-[34px] w-[260px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[10px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1.5px_var(--brand)]">
          <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${total} features`}
            aria-label="Search features"
            className="min-w-0 flex-1 bg-transparent text-[13px] leading-none text-pg-heading placeholder:text-pg-faint focus:outline-none"
          />
        </label>
        <span className="text-[12px] leading-none text-pg-muted">
          {on} of {total} on · everything in the plan is on unless you turn it off
        </span>
      </div>

      {FEATURE_GROUPS.map((group) => {
        const rows = visible.filter((f) => f.group === group);
        if (rows.length === 0) return null;
        const groupOn = rows.filter((f) => state[f.id]).length;
        return (
          <Card key={group} title={group} sub={`${groupOn} of ${rows.length} on`}>
            {rows.map((feature, i) => {
              const featureOn = state[feature.id] === true;
              return (
                <React.Fragment key={feature.id}>
                  <SettingRow
                    label={
                      <span className={cn("flex items-center gap-[9px]", !featureOn && !feature.core && "opacity-55")}>
                        <feature.icon size={15} aria-hidden="true" className="text-pg-muted" />
                        {feature.label}
                        {feature.core ? <Chip tone="locked">Core</Chip> : null}
                      </span>
                    }
                    desc={feature.desc}
                    last={i === rows.length - 1 && !(featureOn && feature.children)}
                  >
                    {feature.core ? (
                      <Lock size={14} aria-hidden="true" className="text-pg-faint" />
                    ) : (
                      <Switch on={featureOn} onToggle={() => toggle(feature.id)} label={feature.label} />
                    )}
                  </SettingRow>
                  {featureOn && feature.children
                    ? feature.children.map((child, j) => (
                        <SettingRow
                          key={child.id}
                          indent
                          label={child.label}
                          desc={child.desc}
                          last={i === rows.length - 1 && j === (feature.children?.length ?? 0) - 1}
                        >
                          <Switch on={state[child.id] === true} onToggle={() => toggle(child.id)} label={child.label} />
                        </SettingRow>
                      ))
                    : null}
                </React.Fragment>
              );
            })}
          </Card>
        );
      })}

      <p className="px-[4px] text-[11.5px] leading-[16px] text-pg-faint">
        Turning a feature off removes its nav rows, search results and quick actions immediately, for every user in this
        account. Nothing is deleted — turning it back on restores everything.
      </p>
    </div>
  );
}
