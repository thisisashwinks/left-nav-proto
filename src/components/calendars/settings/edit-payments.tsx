"use client";

import { DollarSign } from "lucide-react";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import type { CalendarDraft } from "./cal-settings-store";
import {
  FIELD,
  FIELD_ERROR,
  Field,
  InfoTip,
  PlainSelect,
  SectionCard,
  SwitchRow,
  type SectionProps,
} from "./edit-controls";
import { RadioRow } from "./advanced-controls";

/** 94 — Advanced settings ▸ Payments. */

type Currency = NonNullable<CalendarDraft["paymentCurrency"]>;
const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
  { value: "USD", label: "USD — US dollar", symbol: "$" },
  { value: "EUR", label: "EUR — Euro", symbol: "€" },
  { value: "GBP", label: "GBP — British pound", symbol: "£" },
  { value: "INR", label: "INR — Indian rupee", symbol: "₹" },
];

export function PaymentsSection({ draft, patch, errors }: SectionProps) {
  const currency = draft.paymentCurrency ?? "USD";
  const symbol = CURRENCIES.find((c) => c.value === currency)?.symbol ?? "$";
  const mode = draft.paymentMode ?? "full";
  const amount = draft.paymentAmount ?? null;
  const deposit = draft.paymentDeposit ?? null;

  const amountError =
    errors?.paymentAmount ??
    (draft.acceptPayments && amount !== null && amount <= 0
      ? "Enter an amount greater than 0."
      : undefined);
  const depositError =
    errors?.paymentDeposit ??
    (mode === "deposit" && deposit !== null && amount !== null && deposit > amount
      ? "The deposit can't be more than the full amount."
      : undefined);

  return (
    <SectionCard
      title="Payments"
      description="Enable and manage payments, rules, and charge models."
    >
      <div className="flex flex-col gap-[16px]">
        <SwitchRow
          label="Accept payments"
          info="Contacts pay when they book. The booking is confirmed once payment succeeds."
          checked={draft.acceptPayments}
          onChange={(v) => patch({ acceptPayments: v })}
        />
        <div className="flex flex-wrap items-center justify-between gap-[12px]">
          <div className="flex items-center gap-[8px]">
            <span className="flex size-[20px] items-center justify-center rounded-[4px] bg-brand text-brand-fg">
              <DollarSign size={13} strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="rounded-[6px] bg-brand-soft px-[8px] py-[2px] text-[13px] leading-[18px] font-medium text-brand">
              Default
            </span>
          </div>
          <span className="flex items-center gap-[6px]">
            <button
              type="button"
              onClick={() => showToast("Payment providers are managed in Settings ▸ Payments.")}
              className="text-[14px] leading-[20px] font-medium text-brand hover:underline"
            >
              Manage payment providers
            </button>
            <InfoTip text="Connect Stripe, PayPal, and other providers. The default provider takes calendar payments." />
          </span>
        </div>
      </div>

      {draft.acceptPayments ? (
        <div className="grid grid-cols-1 gap-[16px] border-t border-pg-head-border pt-[20px] sm:grid-cols-2">
          <Field label="Amount" required error={amountError}>
            <div
              className={cn(
                "flex h-[36px] items-center rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
                amountError && FIELD_ERROR,
              )}
            >
              <span className="pl-[12px] text-[14px] leading-[20px] text-pg-muted">{symbol}</span>
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                aria-label="Amount"
                placeholder="0"
                value={amount ?? ""}
                onChange={(e) =>
                  patch({
                    paymentAmount: e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                  })
                }
                className="min-w-0 flex-1 bg-transparent px-[6px] text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </Field>
          <Field label="Currency">
            <PlainSelect
              aria-label="Currency"
              value={currency}
              onChange={(v) => patch({ paymentCurrency: v as Currency })}
              options={CURRENCIES}
            />
          </Field>
          <Field label="Payment mode" className="sm:col-span-2">
            <RadioRow
              name="payment-mode"
              value={mode}
              onChange={(v) => patch({ paymentMode: v })}
              options={[
                { value: "full", label: "Collect full amount" },
                { value: "deposit", label: "Deposit" },
              ]}
            />
          </Field>
          {mode === "deposit" ? (
            <Field
              label="Deposit amount"
              error={depositError}
              hint="The rest is collected outside the booking flow."
            >
              <div className="flex h-[36px] items-center rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
                <span className="pl-[12px] text-[14px] leading-[20px] text-pg-muted">{symbol}</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                  aria-label="Deposit amount"
                  placeholder="0"
                  value={deposit ?? ""}
                  onChange={(e) =>
                    patch({
                      paymentDeposit:
                        e.target.value === "" ? null : Math.max(0, Number(e.target.value)),
                    })
                  }
                  className={cn(
                    FIELD,
                    "h-full bg-transparent px-[6px] shadow-none focus:shadow-none",
                  )}
                />
              </div>
            </Field>
          ) : null}
        </div>
      ) : null}
    </SectionCard>
  );
}
