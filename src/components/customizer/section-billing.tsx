"use client";

import * as React from "react";
import { Wallet } from "lucide-react";
import { Card, Chip, LimitField, SettingRow, Stepper, Switch } from "./controls";
import { MARKUPS, RESELL_ADDONS } from "./customizer-data";

/**
 * Billing & markups: production spreads this over five tabs — SaaS, Payments,
 * Rebilling, Usage Billing, Reselling — for what is really three decisions:
 * the wallet that pays for usage, the multiplier you charge on it, and the
 * flat add-ons you resell. One section, three cards, in that order.
 */
export function BillingSection() {
  const [markups, setMarkups] = React.useState(MARKUPS);
  const [resell, setResell] = React.useState(RESELL_ADDONS);
  const [autoRecharge, setAutoRecharge] = React.useState(10);

  return (
    <div className="flex flex-col gap-[14px]">
      <Card
        title="Wallet"
        sub="Usage across every service draws from this balance; markups below refill it from the client."
        aside={
          <button type="button" className="motion-tap h-[30px] shrink-0 rounded-[8px] bg-brand px-[12px] text-[12.5px] leading-none font-medium text-brand-fg active:scale-[0.98]">
            Add balance
          </button>
        }
      >
        <div className="flex items-center gap-[14px] py-[6px]">
          <span className="flex size-[38px] items-center justify-center rounded-[10px] bg-pg-bg shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <Wallet size={17} aria-hidden="true" className="text-pg-muted" />
          </span>
          <div className="flex-1">
            <div className="text-[22px] leading-[26px] font-semibold text-pg-heading tabular-nums">$88.71</div>
            <div className="text-[12px] leading-[16px] text-pg-muted">
              $140.46 complimentary credits · −$51.75 balance
            </div>
          </div>
        </div>
        <SettingRow label="Auto-recharge" desc="Top up when the balance falls to $0, so sending never stops mid-campaign." last>
          <span className="text-[12px] text-pg-muted">with</span>
          <Stepper label="Auto-recharge amount" value={autoRecharge} onChange={setAutoRecharge} min={10} max={500} step={10} unit="$" />
        </SettingRow>
      </Card>

      <Card
        title="Usage markups"
        sub="What this client pays over your cost, per service. The hint under each row is production's own framing: what $10 buys them at this markup."
      >
        {markups.map((m, i) => (
          <SettingRow
            key={m.id}
            label={
              <span className="flex items-center gap-[8px]">
                {m.label}
                {m.on ? <Chip tone="metered">×{m.markup} on cost</Chip> : null}
              </span>
            }
            desc={`${m.desc} · $10 buys ${m.tenBuys}`}
            last={i === markups.length - 1}
          >
            <Stepper
              label={`${m.label} markup`}
              value={m.markup}
              onChange={(v) => setMarkups((s) => s.map((x) => (x.id === m.id ? { ...x, markup: Math.round(v * 100) / 100 } : x)))}
              min={1}
              max={10}
              step={0.5}
              unit="×"
              disabled={!m.on}
            />
            <Switch
              on={m.on}
              onToggle={() => setMarkups((s) => s.map((x) => (x.id === m.id ? { ...x, on: !x.on } : x)))}
              label={`Rebill ${m.label}`}
            />
          </SettingRow>
        ))}
        <p className="mt-[10px] text-[11.5px] leading-[16px] text-pg-faint">
          A service that is off is billed to your wallet at cost and never appears on the client&apos;s invoice. A2P
          registration and call transcription are never rebilled.
        </p>
      </Card>

      <Card title="Resell add-ons" sub="Flat monthly products you deploy under your price. Profit is computed, not typed.">
        {resell.map((r, i) => {
          const profit = r.customerPays - r.youPay;
          return (
            <SettingRow
              key={r.id}
              label={r.label}
              desc={`${r.desc} · you pay $${r.youPay}/mo`}
              last={i === resell.length - 1}
            >
              <span className="text-[12px] text-pg-muted">client pays</span>
              <LimitField
                label={`${r.label} price`}
                value={r.customerPays}
                onChange={(v) =>
                  setResell((s) => s.map((x) => (x.id === r.id ? { ...x, customerPays: v ?? x.youPay } : x)))
                }
                placeholder={`${r.youPay}`}
                unit="$/mo"
                disabled={!r.on}
              />
              <Chip tone={r.on && profit > 0 ? "metered" : "inherit"}>
                {r.on ? `+$${Math.max(0, profit)}/mo` : "Off"}
              </Chip>
              <Switch
                on={r.on}
                onToggle={() => setResell((s) => s.map((x) => (x.id === r.id ? { ...x, on: !x.on } : x)))}
                label={`Resell ${r.label}`}
              />
            </SettingRow>
          );
        })}
      </Card>
    </div>
  );
}
