"use client";

import * as React from "react";
import { Check, Minus, ShieldCheck } from "lucide-react";
import { LABEL_MAX, useNavLayout, type LabelScope } from "@/components/nav/nav-layout-provider";
import { Card, Seg, SettingRow, Switch } from "./controls";

interface MatrixRow {
  label: string;
  desc: string;
  /** Per column: fixed yes/no, or a policy the agency flips. */
  user: "yes" | "no" | "policy";
  admin: "yes" | "no" | "policy";
}

const MATRIX: MatrixRow[] = [
  { label: "Pin and reorder favourites", desc: "Their own dock only — never governed.", user: "yes", admin: "yes" },
  { label: "Rename for themselves", desc: "Personal labels nobody else sees.", user: "policy", admin: "yes" },
  { label: "Rename for the whole account", desc: "Writes the override every user sees.", user: "no", admin: "policy" },
  { label: "Change grouping and icons", desc: "Jobs, product, flat or custom; icon swaps.", user: "no", admin: "policy" },
  { label: "Build custom groups", desc: "Their own tree, seeded from the mode they left.", user: "no", admin: "policy" },
  { label: "Add custom links", desc: "Still gated by the link rules.", user: "no", admin: "policy" },
  { label: "Turn features on or off", desc: "Entitlement itself — never delegated below you.", user: "no", admin: "no" },
];

/**
 * Who can change what: three layers — the product curates, the agency
 * configures, the user personalises. Fixed cells are the architecture;
 * switches are this agency's policy, and flipping one is the whole edit.
 */
export function AccessSection() {
  const layout = useNavLayout();
  const [policies, setPolicies] = React.useState<Record<string, boolean>>({
    "Rename for themselves:user": true,
    "Rename for the whole account:admin": true,
    "Change grouping and icons:admin": true,
    "Build custom groups:admin": true,
    "Add custom links:admin": true,
  });
  const [hipaa, setHipaa] = React.useState(false);

  const cell = (row: MatrixRow, col: "user" | "admin") => {
    const kind = row[col];
    if (kind === "yes") return <Check size={15} aria-hidden="true" className="text-[#0b6b4f]" />;
    if (kind === "no") return <Minus size={14} aria-hidden="true" className="text-pg-faint" />;
    const key = `${row.label}:${col}`;
    return (
      <Switch
        on={policies[key] === true}
        onToggle={() => setPolicies((s) => ({ ...s, [key]: !s[key] }))}
        label={`${row.label} — ${col}`}
      />
    );
  };

  return (
    <div className="flex flex-col gap-[14px]">
      <Card
        title="Who can change what"
        sub="Ticks and dashes are the architecture. Switches are your policy — this account's users get exactly what you leave on."
      >
        <div className="flex items-center gap-[16px] py-[8px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
          <span className="min-w-0 flex-1" />
          {["Client user", "Client admin", "Agency"].map((col) => (
            <span key={col} className="w-[76px] text-center text-[10.5px] leading-none font-semibold tracking-[0.04em] text-pg-muted uppercase">
              {col}
            </span>
          ))}
        </div>
        {MATRIX.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center gap-[16px] py-[10px] ${i === MATRIX.length - 1 ? "" : "shadow-[inset_0_-1px_0_0_var(--pg-border)]"}`}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[13px] leading-[18px] font-medium text-pg-heading">{row.label}</div>
              <div className="text-[12px] leading-[16px] text-pg-muted">{row.desc}</div>
            </div>
            <span className="flex w-[76px] justify-center">{cell(row, "user")}</span>
            <span className="flex w-[76px] justify-center">{cell(row, "admin")}</span>
            <span className="flex w-[76px] justify-center">
              <Check size={15} aria-hidden="true" className="text-[#0b6b4f]" />
            </span>
          </div>
        ))}
      </Card>

      <Card title="Rename scope" sub={`Where a rename made in the nav lands. Labels cap at ${LABEL_MAX} characters either way.`}>
        <SettingRow label="Renames apply to" desc="Every account writes the default all your accounts inherit." last>
          <Seg<LabelScope>
            label="Rename scope"
            options={["account", "agency"]}
            value={layout.state.labelScope}
            onChange={layout.setLabelScope}
            format={(v) => (v === "account" ? "This account" : "Every account")}
          />
        </SettingRow>
      </Card>

      <Card title="Guardrails" sub="Compliance switches from production's Advanced Settings. These bind the account, not one user.">
        <SettingRow
          label={
            <span className="flex items-center gap-[8px]">
              <ShieldCheck size={15} aria-hidden="true" className="text-pg-muted" />
              HIPAA mode
            </span>
          }
          desc={hipaa ? "On. This cannot be turned off — that is the point of it." : "One-way: once on, it cannot be disabled, to maintain compliance."}
          last
        >
          <Switch on={hipaa} onToggle={() => setHipaa(true)} disabled={hipaa} label="HIPAA mode" />
        </SettingRow>
      </Card>
    </div>
  );
}
