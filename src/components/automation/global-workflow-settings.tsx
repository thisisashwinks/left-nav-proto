"use client";

import * as React from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  GitBranch,
  Mail,
  Network,
  Plus,
  Search,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { Modal } from "@/components/page/modal";
import { Checkbox, StatusTag, TextInput, Toggle } from "@/components/page/form-controls";
import { OutlineButton, PageHeader, PrimaryButton } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { showToast } from "@/components/page/toast";
import { useTheme } from "@/components/theme/theme-provider";
import {
  AnchoredPopover,
  FIELD_BOX,
  MenuOption,
  NOW_ISO,
  clock,
} from "@/components/contacts/book-appointment-modal";
import { ME, TEAMMATES } from "@/components/product/conversations/conversations-data";
import type { AvatarTone } from "@/components/contacts/contacts-data";
import { SWITCHER_WORKFLOWS } from "./builder-state";
import { cn } from "@/lib/utils";

/**
 * Workflows ▸ Settings — the account's defaults, not one workflow's.
 *
 * The per-workflow page (workflow-settings.tsx) saves every control as it
 * changes, and most of this page does too: a toggle here is one switch with
 * one meaning, so a Save button beside it would only be a second click. The
 * two exceptions are the cards whose value is a set someone builds up over
 * several moves — who gets error emails, and the pause calendar. Those carry
 * a footer Save, because half a recipient list or a range with no end yet is
 * not a state anyone meant to commit.
 */

/** The page-header buttons are 34px; a settings form sits at the 36px sm height. */
const BTN = "h-[36px] text-[14px] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:brightness-100 disabled:active:scale-100";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const MAX_PAUSE_DATES = 15;
const MAX_PAUSE_DAYS = 15;

/* ─── Plans ─────────────────────────────────────────────────────────────── */

type PlanId = "starter" | "growth" | "scale";

interface Plan {
  id: PlanId;
  name: string;
  price: number;
  executions: number;
  features: string[];
  chip?: "recommended" | "savings";
}

const SHARED_FEATURES = ["All premium actions", "Marketplace apps", "LC apps"];

/** In tier order, so "is this an upgrade" is an index comparison. */
const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 11,
    executions: 10_000,
    features: [...SHARED_FEATURES, "Economical overage rates", "Overage rate $0.008"],
  },
  {
    id: "growth",
    name: "Growth",
    price: 136,
    executions: 30_000,
    chip: "recommended",
    features: [...SHARED_FEATURES, "Improved overage pricing for scale", "Overage rate $0.006"],
  },
  {
    id: "scale",
    name: "Scale",
    price: 273,
    executions: 65_000,
    chip: "savings",
    features: [...SHARED_FEATURES, "Lowest overage rates for high-volume usage", "Overage rate $0.004"],
  },
];

const tier = (id: PlanId) => PLANS.findIndex((p) => p.id === id);
const count = (n: number) => n.toLocaleString("en-US");

/* ─── Recipients ────────────────────────────────────────────────────────── */

interface PickOption {
  value: string;
  label: string;
  hint?: string;
  tone?: AvatarTone;
}

/** Everyone the error email can go to without typing an address. Keyed by email. */
const USER_OPTIONS: PickOption[] = [ME, ...TEAMMATES].map((u) => ({
  value: u.email,
  label: u.name,
  hint: u.email,
  tone: u.tone,
}));

const WORKFLOW_OPTIONS: PickOption[] = SWITCHER_WORKFLOWS.map((w) => ({
  value: w.id,
  label: w.name,
}));

/* ─── Pause dates ───────────────────────────────────────────────────────── */

interface PauseRow {
  id: string;
  /** "YYYY-MM-DDTHH:MM", wall clock — what a datetime-local input speaks. */
  start: string;
  end: string;
  workflows: string[];
  annually: boolean;
}

/** One range already on the books, so the card opens looking used. */
const INITIAL_ROWS: PauseRow[] = [
  {
    id: "p-holidays",
    start: "2026-12-24T18:00",
    end: "2026-12-27T09:00",
    workflows: ["wa-oct", "pm-beta"],
    annually: true,
  },
];

/**
 * Minutes since the epoch, read as wall-clock parts in UTC. No zone, so a
 * range that crosses a daylight-saving change is not an hour short.
 */
function toMinutes(iso: string): number {
  const [d, t = "00:00"] = iso.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  return Date.UTC(y, mo - 1, da, h, mi) / 60_000;
}

function shiftYears(iso: string, years: number): string {
  const y = Number(iso.slice(0, 4)) + years;
  return `${String(y).padStart(4, "0")}${iso.slice(4)}`;
}

/** "12/24/2026, 6:00 PM" — MM/DD/YYYY, because this is data, not a heading. */
function formatStamp(iso: string): string {
  const [d, t = "00:00"] = iso.split("T");
  const [y, mo, da] = d.split("-");
  const [h, mi] = t.split(":").map(Number);
  return `${mo}/${da}/${y}, ${clock(h, mi)}`;
}

const complete = (r: PauseRow) => r.start !== "" && r.end !== "" && r.workflows.length > 0;

/**
 * Whether two ranges share a moment.
 *
 * An annual range is every year's copy of itself, so it is tried against the
 * other range at that range's year and the years either side — a Dec 30 to
 * Jan 3 window straddles two, and an annual row set in 2026 still collides
 * with a one-off in 2027.
 */
function rangesOverlap(a: PauseRow, b: PauseRow): boolean {
  const hit = (s1: string, e1: string, s2: string, e2: string) =>
    toMinutes(s1) < toMinutes(e2) && toMinutes(s2) < toMinutes(e1);
  if (!a.annually && !b.annually) return hit(a.start, a.end, b.start, b.end);
  const [rep, other] = a.annually ? [a, b] : [b, a];
  const delta = Number(other.start.slice(0, 4)) - Number(rep.start.slice(0, 4));
  return [delta - 1, delta, delta + 1].some((d) =>
    hit(shiftYears(rep.start, d), shiftYears(rep.end, d), other.start, other.end),
  );
}

/**
 * The inline message for each row, or nothing.
 *
 * Only the two stated rules and the one they both assume (an end after the
 * start) are errors. A row that is simply unfinished is not wrong yet, so it
 * gets no red — it only keeps Save disabled, and the footer says why.
 */
function pauseErrors(rows: PauseRow[]): Map<string, string> {
  const errors = new Map<string, string>();
  rows.forEach((r) => {
    if (!r.start || !r.end) return;
    const span = toMinutes(r.end) - toMinutes(r.start);
    if (span <= 0) errors.set(r.id, "End date needs to be after the start date.");
    else if (span > MAX_PAUSE_DAYS * 24 * 60)
      errors.set(r.id, `Pick an end date within ${MAX_PAUSE_DAYS} days of the start date.`);
  });
  rows.forEach((r, i) => {
    if (errors.has(r.id) || !r.start || !r.end) return;
    for (let j = 0; j < rows.length; j++) {
      const o = rows[j];
      if (j === i || errors.has(o.id) || !o.start || !o.end) continue;
      const shared = r.workflows.find((w) => o.workflows.includes(w));
      if (!shared || !rangesOverlap(r, o)) continue;
      const name = WORKFLOW_OPTIONS.find((w) => w.value === shared)?.label ?? "A workflow";
      errors.set(
        r.id,
        `"${name}" is also in date ${j + 1}, and the 2 ranges overlap. Change the dates or remove it from one.`,
      );
      break;
    }
  });
  return errors;
}

let rowSeq = 0;
const newRowId = () => `p-${Date.now().toString(36)}-${rowSeq++}`;

/**
 * One toast per burst. The permission checkboxes save as they are clicked,
 * and ticking both in a row should say so once.
 */
function useSettleToast(delay = 600) {
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return React.useCallback(
    (message: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => showToast(message), delay);
    },
    [delay],
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────── */

export function GlobalWorkflowSettings() {
  const { effective } = useTheme();

  return (
    <div
      data-page-theme={effective.appTheme}
      className="relative flex h-full min-h-0 flex-col gap-[14px]"
    >
      <div className="px-[var(--page-inset)]">
        <PageHeader
          title="Global workflow settings"
          description="Defaults that apply to every workflow in this account"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-[var(--page-inset)] pb-[24px]">
        <div className="flex w-full flex-col gap-[16px]">
          <PlanCard />
          <BuilderCard />
          <NotificationsCard />
          <AutoSaveCard />
          <PauseCard />
          <WorkflowAiCard />
        </div>
      </div>
    </div>
  );
}

/* ─── 1. Plans ──────────────────────────────────────────────────────────── */

function PlanCard() {
  const [plan, setPlan] = React.useState<PlanId | null>(null);
  const [open, setOpen] = React.useState(false);
  const current = PLANS.find((p) => p.id === plan);

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-[16px] py-[16px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">
            {current
              ? `You're on ${current.name} · ${count(current.executions)} premium executions/month`
              : "Save more with Workflow Pro plans"}
          </h2>
          <p className="text-[13px] leading-[18px] text-pg-muted">
            {current
              ? `Billed at $${current.price} per month. Executions past your allowance are charged at the overage rate. (Visible to agency admins only)`
              : "Unlock more workflow premium executions, enjoy better cost efficiency, and scale automations with ease. (Visible to agency admins only)"}
          </p>
        </div>
        {current ? (
          <OutlineButton onClick={() => setOpen(true)} className={BTN}>
            Change plan
          </OutlineButton>
        ) : (
          <PrimaryButton onClick={() => setOpen(true)} className={BTN}>
            View plans
          </PrimaryButton>
        )}
      </div>
      {open ? (
        <PlansModal
          current={plan}
          onClose={() => setOpen(false)}
          onConfirm={(p) => {
            setPlan(p.id);
            setOpen(false);
            showToast(`You're on the ${p.name} plan`);
          }}
        />
      ) : null}
    </Card>
  );
}

/**
 * The plan picker, and its confirm step in the same dialog.
 *
 * The confirm is a step rather than a second modal stacked on the first: a
 * dialog over a dialog reads as the first one having gone wrong, and Cancel
 * here means "back to the plans", not "close everything". The modal narrows
 * for the step so the question is not lost in 830px of empty card.
 */
function PlansModal({
  current,
  onClose,
  onConfirm,
}: {
  current: PlanId | null;
  onClose: () => void;
  onConfirm: (plan: Plan) => void;
}) {
  const [pending, setPending] = React.useState<Plan | null>(null);

  if (pending) {
    const upgrade = current === null || tier(pending.id) > tier(current);
    return (
      <Modal
        width={440}
        onClose={onClose}
        title={upgrade ? `Upgrade to ${pending.name}?` : `Switch to ${pending.name}?`}
        footer={
          <>
            <OutlineButton onClick={() => setPending(null)} className={BTN}>
              Cancel
            </OutlineButton>
            <PrimaryButton autoFocus onClick={() => onConfirm(pending)} className={BTN}>
              {upgrade ? "Confirm upgrade" : "Confirm change"}
            </PrimaryButton>
          </>
        }
      >
        <p className="text-[14px] leading-[20px] text-pg-text">
          <strong className="font-semibold text-pg-heading">${pending.price} per month</strong>{" "}
          for {count(pending.executions)} premium executions, then{" "}
          {pending.features[pending.features.length - 1].replace("Overage rate ", "")} per
          execution. The new plan starts today.
        </p>
      </Modal>
    );
  }

  return (
    <Modal width={830} onClose={onClose} title="Choose your plan" bodyClassName="gap-[16px]">
      <p className="-mt-[4px] text-[14px] leading-[20px] text-pg-muted">
        Flexible pricing that grows with you.
      </p>
      <div className="grid grid-cols-1 gap-[16px] md:grid-cols-3">
        {PLANS.map((p) => (
          <PlanOption
            key={p.id}
            plan={p}
            isCurrent={p.id === current}
            onChoose={() => setPending(p)}
          />
        ))}
      </div>
    </Modal>
  );
}

function PlanOption({
  plan,
  isCurrent,
  onChoose,
}: {
  plan: Plan;
  isCurrent: boolean;
  onChoose: () => void;
}) {
  const recommended = plan.chip === "recommended";
  const Button = recommended ? PrimaryButton : OutlineButton;
  return (
    <div
      className={cn(
        "flex flex-col gap-[16px] rounded-[12px] bg-pg-surface p-[16px]",
        recommended
          ? "shadow-[inset_0_0_0_2px_var(--brand)]"
          : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
      )}
    >
      <div className="flex flex-col gap-[8px]">
        <div className="flex h-[22px] items-center justify-between gap-[8px]">
          <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">{plan.name}</h3>
          {plan.chip === "recommended" ? (
            <span className="inline-flex h-[22px] items-center rounded-[6px] bg-[color-mix(in_oklab,var(--hr-violet-500)_14%,transparent)] px-[8px] text-[12px] leading-none font-medium whitespace-nowrap text-[var(--hr-violet-600)]">
              Recommended 🔥
            </span>
          ) : plan.chip === "savings" ? (
            <StatusTag tone="success">Max savings</StatusTag>
          ) : null}
        </div>
        <p className="flex items-baseline gap-[4px]">
          <span className="text-[28px] leading-[36px] font-semibold text-pg-heading">
            ${plan.price}
          </span>
          <span className="text-[13px] leading-[18px] text-pg-muted">per month</span>
        </p>
        <p className="text-[14px] leading-[20px] font-medium text-pg-text">
          {count(plan.executions)} premium executions
        </p>
      </div>

      <Button
        onClick={onChoose}
        disabled={isCurrent}
        className={cn(BTN, "w-full justify-center")}
      >
        {isCurrent ? "Current plan" : "Choose plan"}
      </Button>

      <div className="flex flex-col gap-[8px] pt-[4px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
        <span className="pt-[12px] text-[12px] leading-[16px] font-semibold tracking-[0.04em] text-pg-faint uppercase">
          Features
        </span>
        <ul className="flex flex-col gap-[8px]">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-[8px] text-[13px] leading-[18px] text-pg-text">
              <Check
                size={14}
                strokeWidth={2.5}
                aria-hidden="true"
                className="mt-[2px] shrink-0 text-[var(--hr-success-600)]"
              />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─── 2. Default builder ────────────────────────────────────────────────── */

type Builder = "standard" | "advanced";

const BUILDERS: { id: Builder; title: string; hint: string; icon: typeof Network }[] = [
  {
    id: "standard",
    title: "Standard builder",
    hint: "Best for simple automations, linear journeys, and quick editing.",
    icon: Network,
  },
  {
    id: "advanced",
    title: "Advanced builder",
    hint: "Best for complex logic, branching paths, and multi-trigger workflows.",
    icon: GitBranch,
  },
];

function BuilderCard() {
  const settle = useSettleToast();
  const [builder, setBuilder] = React.useState<Builder>("standard");
  const [confirming, setConfirming] = React.useState(false);
  const [applyAll, setApplyAll] = React.useState(false);
  const [subAdmins, setSubAdmins] = React.useState(true);
  const [subUsers, setSubUsers] = React.useState(false);

  /*
   * Only the move TO advanced asks first. It changes what every user sees on
   * their next new workflow; going back to standard is the state the account
   * started in, so there is nothing to warn about.
   */
  const pick = (next: Builder) => {
    if (next === builder) return;
    if (next === "advanced") {
      setApplyAll(false);
      setConfirming(true);
      return;
    }
    setBuilder("standard");
    showToast("Default builder set to standard");
  };

  const closeConfirm = React.useCallback(() => setConfirming(false), []);

  return (
    <Card
      title="Default builder for new workflows"
      titleExtra={<StatusTag tone="neutral">Only visible to agency admins and agency users</StatusTag>}
      description="All new workflows will open in the selected builder by default."
    >
      <div className="flex flex-col py-[16px]">
        <div role="radiogroup" aria-label="Default builder" className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
          {BUILDERS.map((b) => {
            const on = b.id === builder;
            const Icon = b.icon;
            return (
              <button
                key={b.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(b.id)}
                className={cn(
                  "motion-tap flex items-start gap-[12px] rounded-[12px] p-[16px] text-left",
                  on
                    ? "bg-[color-mix(in_oklab,var(--brand)_4%,var(--pg-surface))] shadow-[inset_0_0_0_2px_var(--brand)]"
                    : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-[36px] shrink-0 items-center justify-center rounded-[8px]",
                    on ? "bg-brand-soft text-brand" : "bg-pg text-pg-muted",
                  )}
                >
                  <Icon size={18} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
                  <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                    {b.title}
                  </span>
                  <span className="text-[13px] leading-[18px] text-pg-muted">{b.hint}</span>
                </span>
                <RadioDot on={on} />
              </button>
            );
          })}
        </div>

        <div className="my-[16px] h-px bg-pg-border" />

        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[4px]">
            <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
              Who can switch between builders
            </h3>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              Choose which roles can change a workflow&apos;s view between standard and advanced.
              Agency users are enabled by default.
            </p>
          </div>
          <div className="flex flex-col gap-[10px]">
            <Checkbox
              checked={subAdmins}
              label="Sub-account admins"
              onChange={(v) => {
                setSubAdmins(v);
                settle("Builder permissions saved");
              }}
            />
            <Checkbox
              checked={subUsers}
              label="Sub-account users"
              onChange={(v) => {
                setSubUsers(v);
                settle("Builder permissions saved");
              }}
            />
          </div>
        </div>
      </div>

      {confirming ? (
        <Modal
          width={480}
          onClose={closeConfirm}
          icon={
            <WarningTile>
              <TriangleAlert size={18} />
            </WarningTile>
          }
          title="Switch default view to advanced builder?"
          bodyClassName="gap-[16px]"
          footer={
            <>
              <OutlineButton onClick={closeConfirm} className={BTN}>
                Cancel
              </OutlineButton>
              <PrimaryButton
                autoFocus
                onClick={() => {
                  setBuilder("advanced");
                  setConfirming(false);
                  showToast(
                    applyAll
                      ? "Default builder set to advanced for all workflows"
                      : "Default builder set to advanced",
                  );
                }}
                className={BTN}
              >
                Confirm
              </PrimaryButton>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            Setting this as the default will open all new workflows in the advanced builder for all
            users.
          </p>
          <Checkbox
            checked={applyAll}
            onChange={setApplyAll}
            label="Use advanced builder for all workflows (existing and new)"
          />
        </Modal>
      ) : null}
    </Card>
  );
}

function RadioDot({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-[2px] flex size-[16px] shrink-0 items-center justify-center rounded-full",
        on ? "bg-brand" : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
      )}
    >
      {on ? <span className="size-[6px] rounded-full bg-white" /> : null}
    </span>
  );
}

/** The 36px circle every confirmation modal in this prototype leads with. */
function WarningTile({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-[36px] shrink-0 items-center justify-center rounded-full bg-[var(--pg-warn-bg)] text-[var(--pg-warn-icon)]"
    >
      {children}
    </span>
  );
}

/* ─── 3. Notifications ──────────────────────────────────────────────────── */

function NotificationsCard() {
  const [saved, setSaved] = React.useState<{ on: boolean; recipients: string[] }>({
    on: true,
    recipients: [],
  });
  const [on, setOn] = React.useState(saved.on);
  const [recipients, setRecipients] = React.useState<string[]>(saved.recipients);

  /* Order-blind: picking two people in either order is the same list. */
  const dirty =
    on !== saved.on ||
    recipients.length !== saved.recipients.length ||
    recipients.some((r) => !saved.recipients.includes(r));

  return (
    <Card
      lead={<Toggle aria-label="Notifications" checked={on} onChange={setOn} />}
      title="Notifications"
      footer={
        <PrimaryButton
          disabled={!dirty}
          onClick={() => {
            setSaved({ on, recipients });
            showToast("Notification settings saved");
          }}
          className={BTN}
        >
          Save
        </PrimaryButton>
      }
    >
      {/*
        Dimmed, not hidden. With the switch off the recipients are kept, not
        cleared — turning it back on should bring back the list, and a body
        that vanished would say the list was gone.
      */}
      <div
        aria-disabled={!on || undefined}
        className={cn(
          "flex flex-wrap items-start gap-[16px] py-[16px] transition-opacity",
          !on && "opacity-50",
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-[36px] shrink-0 items-center justify-center rounded-[8px] bg-pg text-pg-muted"
        >
          <Mail size={18} />
        </span>
        <div className="flex min-w-[240px] flex-1 flex-col gap-[4px]">
          <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
            Email notification
          </span>
          <p className="max-w-[640px] text-[13px] leading-[18px] text-pg-muted">
            By default, workflow error notifications are sent to all agency and location admin
            users via email, but you can add other email addresses to be notified here.
          </p>
        </div>
        <ChipMultiSelect
          label="Notification recipients"
          placeholder="Select users"
          searchPlaceholder="Search users or type an email"
          options={USER_OPTIONS}
          value={recipients}
          onChange={setRecipients}
          allowEmail
          disabled={!on}
          className="w-full md:w-[360px]"
        />
      </div>
    </Card>
  );
}

/* ─── 4. Auto save ──────────────────────────────────────────────────────── */

function AutoSaveCard() {
  const [on, setOn] = React.useState(false);
  return (
    <Card
      lead={
        <Toggle
          aria-label="Auto save"
          checked={on}
          onChange={(v) => {
            setOn(v);
            showToast(v ? "Auto save turned on" : "Auto save turned off");
          }}
        />
      }
      title="Auto save"
    >
      <p className="py-[16px] text-[14px] leading-[20px] text-pg-text">
        Automatically save changes while editing your draft workflow. Auto save ensures your updates
        are preserved in real time — no need to click &quot;Save&quot; manually.
      </p>
    </Card>
  );
}

/* ─── 5. Pause workflow ─────────────────────────────────────────────────── */

function PauseCard() {
  const [saved, setSaved] = React.useState<PauseRow[]>(INITIAL_ROWS);
  const [rows, setRows] = React.useState<PauseRow[]>(INITIAL_ROWS);

  const errors = pauseErrors(rows);
  const dirty = JSON.stringify(rows) !== JSON.stringify(saved);
  const unfinished = rows.some((r) => !complete(r));
  const canSave = dirty && !unfinished && errors.size === 0;
  const full = rows.length >= MAX_PAUSE_DATES;

  const patch = (id: string, next: Partial<PauseRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...next } : r)));

  /*
   * A copy keeps the workflows and the repeat, and drops the dates. The
   * reason to duplicate a row is the same set of workflows on another
   * window — copying the dates too would be an overlap by construction, and
   * the row would arrive already in red.
   */
  const duplicate = (row: PauseRow) =>
    setRows((prev) => {
      if (prev.length >= MAX_PAUSE_DATES) return prev;
      const at = prev.findIndex((r) => r.id === row.id);
      const copy: PauseRow = { ...row, id: newRowId(), start: "", end: "" };
      return [...prev.slice(0, at + 1), copy, ...prev.slice(at + 1)];
    });

  return (
    <Card
      title="Pause workflow"
      description="Temporarily pause selected workflows, putting them in draft state during a specified time period."
      footer={
        <>
          {dirty && unfinished ? (
            <span className="mr-auto text-[13px] leading-[18px] text-pg-muted">
              Add dates and at least 1 workflow to every row to save.
            </span>
          ) : null}
          <PrimaryButton
            disabled={!canSave}
            onClick={() => {
              setSaved(rows);
              showToast("Pause schedule saved");
            }}
            className={BTN}
          >
            Save
          </PrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-[12px] py-[16px]">
        <div className="flex flex-col rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <div className="flex items-center justify-between gap-[12px] px-[16px] py-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
            <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
              When to pause workflow?
            </h3>
            <span className="text-[13px] leading-[18px] text-pg-muted tabular-nums">
              Pause dates: {rows.length} / {MAX_PAUSE_DATES}
            </span>
          </div>

          <div className="flex flex-col gap-[16px] p-[16px]">
            {rows.length === 0 ? (
              <p className="text-[13px] leading-[18px] text-pg-muted">
                No pause dates yet. Add one to pause workflows for a holiday or a launch freeze.
              </p>
            ) : null}
            {rows.map((r, i) => (
              <PauseDateRow
                key={r.id}
                index={i}
                row={r}
                error={errors.get(r.id) ?? null}
                canDuplicate={!full}
                onChange={(next) => patch(r.id, next)}
                onDuplicate={() => duplicate(r)}
                onRemove={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
              />
            ))}
            <div className="flex items-center gap-[12px]">
              <OutlineButton
                disabled={full}
                onClick={() =>
                  setRows((prev) => [
                    ...prev,
                    { id: newRowId(), start: "", end: "", workflows: [], annually: false },
                  ])
                }
                className={BTN}
              >
                <Plus size={15} aria-hidden="true" />
                Add date
              </OutlineButton>
              {full ? (
                <span className="text-[13px] leading-[18px] text-pg-muted">
                  You&apos;ve reached the limit of {MAX_PAUSE_DATES} pause dates.
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-[2px] text-[13px] leading-[18px] text-pg-muted">
          <p>* Maximum allowed difference between the start and end date is {MAX_PAUSE_DAYS} days.</p>
          <p>* A workflow should not be part of two or more date ranges that are overlapping.</p>
        </div>
      </div>
    </Card>
  );
}

function PauseDateRow({
  index,
  row,
  error,
  canDuplicate,
  onChange,
  onDuplicate,
  onRemove,
}: {
  index: number;
  row: PauseRow;
  error: string | null;
  canDuplicate: boolean;
  onChange: (next: Partial<PauseRow>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const errorId = `${row.id}-error`;
  const n = index + 1;
  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex flex-wrap items-start gap-[8px]">
        <RangeField
          n={n}
          start={row.start}
          end={row.end}
          invalid={Boolean(error)}
          describedBy={error ? errorId : undefined}
          onChange={(start, end) => onChange({ start, end })}
        />
        <ChipMultiSelect
          label={`Workflows for date ${n}`}
          placeholder="Select workflows"
          searchPlaceholder="Search workflows"
          options={WORKFLOW_OPTIONS}
          value={row.workflows}
          onChange={(workflows) => onChange({ workflows })}
          className="min-w-[240px] flex-1"
        />
        <IconButton label={`Duplicate date ${n}`} disabled={!canDuplicate} onClick={onDuplicate}>
          <Copy size={16} />
        </IconButton>
        <IconButton label={`Delete date ${n}`} danger onClick={onRemove}>
          <Trash2 size={16} />
        </IconButton>
      </div>
      <Checkbox
        checked={row.annually}
        onChange={(annually) => onChange({ annually })}
        label="Annually"
        className="self-start"
      />
      {error ? <ErrorText id={errorId}>{error}</ErrorText> : null}
    </div>
  );
}

/**
 * The start → end control: one field, two datetimes in its popover.
 *
 * One field rather than two because the pair is one fact — a window — and
 * the rule on it (15 days at most) is about the pair. The popover writes
 * through as each input changes, so there is no Apply to forget; Done only
 * closes it.
 */
function RangeField({
  n,
  start,
  end,
  invalid,
  describedBy,
  onChange,
}: {
  n: number;
  start: string;
  end: string;
  invalid: boolean;
  describedBy?: string;
  onChange: (start: string, end: string) => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  const startId = `range-${n}-start`;
  const endId = `range-${n}-end`;

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Date ${n}: ${start ? formatStamp(start) : "no start"} to ${end ? formatStamp(end) : "no end"}`}
        aria-describedby={describedBy}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          FIELD_BOX,
          "motion-tap w-full text-left text-[14px] leading-[20px] md:w-[400px]",
          invalid
            ? "shadow-[inset_0_0_0_1px_var(--hr-error-600)]"
            : open
              ? "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]"
              : "hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", start ? "text-pg-text" : "text-pg-faint")}>
          {start ? formatStamp(start) : "Start date and time"}
        </span>
        <ArrowRight size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <span className={cn("min-w-0 flex-1 truncate", end ? "text-pg-text" : "text-pg-faint")}>
          {end ? formatStamp(end) : "End date and time"}
        </span>
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} width={320} maxHeight={320}>
          <div role="dialog" aria-label={`Date ${n}`} className="flex flex-col gap-[12px] p-[12px]">
            <label htmlFor={startId} className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] font-medium text-pg-heading">
                Start date and time
              </span>
              <TextInput
                id={startId}
                type="datetime-local"
                autoFocus
                value={start}
                min={NOW_ISO}
                onChange={(e) => onChange(e.target.value, end)}
              />
            </label>
            <label htmlFor={endId} className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] font-medium text-pg-heading">
                End date and time
              </span>
              <TextInput
                id={endId}
                type="datetime-local"
                value={end}
                min={start || NOW_ISO}
                onChange={(e) => onChange(start, e.target.value)}
              />
            </label>
            <span className="text-[13px] leading-[18px] text-pg-muted">
              Up to {MAX_PAUSE_DAYS} days between start and end.
            </span>
            <PrimaryButton onClick={close} className={cn(BTN, "justify-center")}>
              Done
            </PrimaryButton>
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/* ─── 6. Workflow AI ────────────────────────────────────────────────────── */

function WorkflowAiCard() {
  const [on, setOn] = React.useState(true);
  return (
    <Card title="Workflow AI">
      <div className="flex items-start gap-[24px] py-[16px]">
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-heading">AI builder</span>
          <p className="max-w-[760px] text-[13px] leading-[18px] text-pg-muted">
            Build and edit workflows with AI – describe what you want to automate and AI generates
            the workflow for you.
          </p>
        </div>
        <Toggle
          aria-label="AI builder"
          checked={on}
          onChange={(v) => {
            setOn(v);
            showToast(v ? "AI builder turned on" : "AI builder turned off");
          }}
        />
      </div>
    </Card>
  );
}

/* ─── Shared pieces ─────────────────────────────────────────────────────── */

/**
 * The canvas card: 12px radius, a hairline header, 16px inside.
 *
 * The same card workflow-settings.tsx draws, grown the slots this page needs:
 * `lead` puts a card-wide switch before the title (Notifications, Auto save —
 * the switch IS the card's state, so it sits where the eye starts), and
 * `footer` carries Save for the two cards that do not save as they go.
 */
function Card({
  title,
  titleExtra,
  description,
  lead,
  footer,
  children,
}: {
  title?: string;
  titleExtra?: React.ReactNode;
  description?: string;
  lead?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="w-full rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      {title ? (
        <header className="flex flex-col gap-[4px] px-[16px] py-[12px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
          <div className="flex flex-wrap items-center gap-[12px]">
            {lead}
            <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">{title}</h2>
            {titleExtra}
          </div>
          {description ? (
            <p className="text-[13px] leading-[18px] text-pg-muted">{description}</p>
          ) : null}
        </header>
      ) : null}
      <div className="px-[16px]">{children}</div>
      {footer ? (
        <footer className="flex items-center justify-end gap-[12px] px-[16px] py-[12px] shadow-[inset_0_1px_0_0_var(--pg-border)]">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}

function IconButton({
  label,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "motion-tap flex size-[36px] shrink-0 items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
        danger ? "hover:text-pg-danger" : "hover:text-pg-heading",
      )}
    >
      <span aria-hidden="true" className="flex">
        {children}
      </span>
    </button>
  );
}

function ErrorText({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="text-[13px] leading-[18px] text-[var(--hr-error-600)]">
      {children}
    </p>
  );
}

/**
 * A field of chips with a searchable, checkable menu under it.
 *
 * The search lives in the menu, not the field, so the field can be a plain
 * box of chips whose × buttons are real buttons — an input in the field would
 * sit under the popover's click-catcher and swallow the first click. With
 * `allowEmail`, a typed address that is nobody in the list becomes its own
 * chip on Enter; anything with an @ that is not an address says so instead
 * of silently doing nothing.
 */
function ChipMultiSelect({
  label,
  placeholder,
  searchPlaceholder,
  options,
  value,
  onChange,
  allowEmail = false,
  disabled = false,
  className,
}: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  options: PickOption[];
  value: string[];
  onChange: (next: string[]) => void;
  allowEmail?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const anchor = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const close = React.useCallback(() => {
    setOpen(false);
    setQuery("");
    setError(null);
  }, []);

  const q = query.trim().toLowerCase();
  const shown = q
    ? options.filter(
        (o) => o.label.toLowerCase().includes(q) || (o.hint ?? "").toLowerCase().includes(q),
      )
    : options;
  const typedEmail = allowEmail && EMAIL_RE.test(q) ? q : null;
  const typedIsNew =
    typedEmail !== null && !options.some((o) => o.value === typedEmail) && !value.includes(typedEmail);

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

  const submit = () => {
    if (!allowEmail || q === "") return;
    if (!EMAIL_RE.test(q)) {
      setError(
        q.includes("@")
          ? "That email doesn't look right. Try one like name@company.com."
          : shown.length === 0
            ? "No users match. To add someone else, type their full email."
            : null,
      );
      return;
    }
    if (!value.includes(q)) onChange([...value, q]);
    setQuery("");
    setError(null);
  };

  const labelOf = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <div className={cn("flex min-w-0 flex-col gap-[4px]", className)}>
      <div
        ref={anchor}
        onClick={(e) => {
          if (disabled || (e.target as HTMLElement).closest("[data-chip-remove]")) return;
          setOpen(true);
        }}
        className={cn(
          "flex min-h-[36px] w-full items-center gap-[6px] rounded-[8px] bg-pg-surface py-[5px] pr-[10px] pl-[6px] shadow-[inset_0_0_0_1px_var(--pg-border)]",
          disabled
            ? "cursor-not-allowed bg-pg"
            : open
              ? "cursor-pointer shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]"
              : "cursor-pointer hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-[4px]">
          {value.map((v) => (
            <span
              key={v}
              className="inline-flex h-[24px] max-w-full items-center gap-[4px] rounded-[6px] bg-pg py-0 pr-[4px] pl-[8px] text-[13px] leading-[18px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
            >
              <span className="truncate">{labelOf(v)}</span>
              <button
                type="button"
                data-chip-remove
                disabled={disabled}
                aria-label={`Remove ${labelOf(v)}`}
                onClick={() => toggle(v)}
                className="motion-tap flex size-[16px] shrink-0 items-center justify-center rounded-[4px] text-pg-faint hover:bg-pg-surface hover:text-pg-heading disabled:cursor-not-allowed"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}
          <button
            type="button"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={label}
            className="h-[24px] min-w-[80px] flex-1 truncate px-[6px] text-left text-[14px] leading-[20px] text-pg-faint focus:outline-none disabled:cursor-not-allowed"
          >
            {value.length > 0 ? "" : placeholder}
          </button>
        </div>
        <ChevronDown size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
      </div>

      {open ? (
        <AnchoredPopover anchorRef={anchor} onClose={close} maxHeight={320}>
          <div className="flex shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[10px] py-[8px]">
            <Search size={14} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              autoFocus
              value={query}
              aria-label={searchPlaceholder}
              aria-invalid={error ? true : undefined}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                e.preventDefault();
                submit();
              }}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[18px] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
          {error ? (
            <p role="alert" className="px-[12px] pt-[8px] text-[13px] leading-[18px] text-[var(--hr-error-600)]">
              {error}
            </p>
          ) : null}
          <div role="listbox" aria-multiselectable="true" aria-label={label} className="flex flex-col p-[4px]">
            {typedIsNew && typedEmail ? (
              <MenuOption onClick={submit}>
                <Plus size={14} aria-hidden="true" className="shrink-0 text-brand" />
                <span className="truncate">
                  Add <span className="font-medium text-pg-heading">{typedEmail}</span>
                </span>
              </MenuOption>
            ) : null}
            {shown.length === 0 && !typedIsNew ? (
              <p className="px-[10px] py-[8px] text-[13px] leading-[18px] text-pg-muted">
                {allowEmail ? "No users match. Type a full email to add it." : "No matches"}
              </p>
            ) : null}
            {shown.map((o) => {
              const on = value.includes(o.value);
              return (
                <Checkbox
                  key={o.value}
                  checked={on}
                  onChange={() => toggle(o.value)}
                  className="w-full rounded-[6px] px-[10px] py-[7px] hover:bg-pg"
                  label={
                    <span className="flex min-w-0 items-center gap-[8px]">
                      {o.tone ? <ToneAvatar name={o.label} tone={o.tone} size={22} round /> : null}
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[14px] leading-[20px] text-pg-text">
                          {o.label}
                        </span>
                        {o.hint ? (
                          <span className="truncate text-[12px] leading-[16px] text-pg-faint">
                            {o.hint}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  }
                />
              );
            })}
          </div>
        </AnchoredPopover>
      ) : null}
    </div>
  );
}
