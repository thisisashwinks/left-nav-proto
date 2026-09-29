"use client";

import * as React from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { StatusTag } from "@/components/page/form-controls";
import { TablePager, usePagination } from "@/components/page/table-card";
import { ToneAvatar } from "@/components/page/avatar";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { showToast } from "@/components/page/toast";
import { formatCount, formatStamp } from "./contacts-jobs";
import {
  RULE_LABELS,
  mergeGroup,
  startScan,
  useDuplicateGroups,
  useScan,
  type DuplicateGroup,
  type DuplicateRecord,
  type DuplicateRule,
} from "./duplicates-data";

const RULES: DuplicateRule[] = ["email", "phone", "name"];

/* ─── Find duplicates modal ─────────────────────────────────────────────── */

export function FindDuplicatesModal({
  onClose,
  onFind,
}: {
  onClose: () => void;
  onFind: (rule: DuplicateRule) => void;
}) {
  const [rule, setRule] = React.useState<DuplicateRule>("email");
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Arrow keys move AND select, the native radio behavior; Tab leaves the
  // group from the checked option, which is why only it is tabbable.
  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const step =
      e.key === "ArrowRight" || e.key === "ArrowDown"
        ? 1
        : e.key === "ArrowLeft" || e.key === "ArrowUp"
          ? -1
          : 0;
    if (!step) return;
    e.preventDefault();
    const next = (i + step + RULES.length) % RULES.length;
    setRule(RULES[next]);
    refs.current[next]?.focus();
  };

  return (
    <Modal
      title="Find duplicates"
      width={520}
      onClose={onClose}
      footer={
        <>
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton onClick={() => onFind(rule)}>Find duplicates</PrimaryButton>
        </>
      }
    >
      <p className="-mt-[6px] text-[13px] leading-[18px] text-pg-muted">
        Scans records for potential duplicates using the chosen rule.
      </p>
      <div className="mt-[12px] flex flex-col gap-[8px]">
        <span id="find-by-label" className="text-[13px] leading-[18px] text-pg-muted">
          Find by
        </span>
        <div
          role="radiogroup"
          aria-labelledby="find-by-label"
          className="flex items-center gap-[24px]"
        >
          {RULES.map((r, i) => {
            const on = r === rule;
            return (
              <button
                key={r}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setRule(r)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className="group flex items-center gap-[8px] rounded-[6px] motion-tap focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_var(--brand-soft)]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-[16px] shrink-0 items-center justify-center rounded-full motion-tap",
                    on
                      ? "bg-brand"
                      : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)] group-hover:shadow-[inset_0_0_0_1px_var(--brand)]",
                  )}
                >
                  {on ? <span className="size-[6px] rounded-full bg-brand-fg" /> : null}
                </span>
                <span className="text-[14px] leading-[20px] text-pg-text">
                  {RULE_LABELS[r]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {/* The divider the live modal draws above its footer. */}
      <div aria-hidden="true" className="-mx-[16px] mt-[12px] h-px bg-pg-head-border" />
    </Modal>
  );
}

/* ─── Manage duplicates page ────────────────────────────────────────────── */

const oldest = (records: DuplicateRecord[]) =>
  records.reduce((a, b) => (b.created < a.created ? b : a)).id;

function matches(group: DuplicateGroup, q: string) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return (
    group.value.toLowerCase().includes(needle) ||
    group.records.some((r) =>
      [r.name, r.email, r.phone].some((v) => v?.toLowerCase().includes(needle)),
    )
  );
}

export function ManageDuplicatesPage({
  rule,
  onExit,
  onChangeRule,
}: {
  rule: DuplicateRule;
  onExit: () => void;
  onChangeRule: (rule: DuplicateRule) => void;
}) {
  useRecordCrumb({ name: "Manage duplicates", kind: "Manage duplicates" }, onExit);

  React.useEffect(() => {
    startScan(rule);
  }, [rule]);

  const groups = useDuplicateGroups(rule);
  const scan = useScan();
  // A scan for another rule (or one not yet started this mount) counts as
  // still scanning, so the previous rule's groups never flash under this one.
  const scanning = scan.scanning || scan.rule !== rule;

  const [query, setQuery] = React.useState("");
  const [masters, setMasters] = React.useState<Record<string, string>>({});
  const [confirming, setConfirming] = React.useState<DuplicateGroup | null>(null);

  const shown = React.useMemo(
    () => groups.filter((g) => matches(g, query.trim())),
    [groups, query],
  );
  const pager = usePagination(shown, 10);

  const recordCount = scanning
    ? 0
    : groups.reduce((sum, g) => sum + g.records.length, 0);

  const masterOf = (g: DuplicateGroup) => masters[g.id] ?? oldest(g.records);

  const confirmMerge = () => {
    if (!confirming) return;
    const masterId = masterOf(confirming);
    const master = confirming.records.find((r) => r.id === masterId);
    const merged = mergeGroup(rule, confirming.id, masterId);
    setConfirming(null);
    if (merged && master) {
      showToast(`${merged} contacts merged into ${master.name}.`);
    }
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      <div className="flex shrink-0 items-start gap-[16px]">
        <div className="flex min-w-0 flex-1 items-start gap-[10px]">
          <button
            type="button"
            onClick={onExit}
            aria-label="Back to contacts"
            className="mt-[-1px] flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-brand motion-tap hover:bg-brand-soft active:scale-90"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div className="flex min-w-0 flex-col gap-[4px]">
            <div className="flex min-w-0 items-center gap-[8px]">
              <h1 className="truncate text-[20px] leading-[normal] font-semibold tracking-[-0.2px] text-pg-heading">
                Manage duplicate records
              </h1>
              <span className="shrink-0 rounded-full bg-brand-soft px-[8px] py-[2px] text-[12px] leading-[18px] font-medium whitespace-nowrap text-brand tabular-nums">
                {formatCount(recordCount)} records
              </span>
            </div>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              Duplicates found by {RULE_LABELS[rule]}. Showing the first 10,000
              records. Refresh the list to see the latest updates.
              {scan.lastCheck ? ` Last check: ${formatStamp(scan.lastCheck)}.` : null}
            </p>
          </div>
        </div>
        <OutlineButton onClick={() => startScan(rule)}>
          <RefreshCw
            size={15}
            aria-hidden="true"
            className={cn("text-pg-text-strong", scanning && "motion-safe:animate-spin")}
          />
          Refresh
        </OutlineButton>
      </div>

      <div className="mb-[16px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
        <div className="flex h-[54px] shrink-0 items-center gap-[10px] px-[12px] shadow-[inset_0_-1px_0_0_var(--pg-head-border)]">
          <RuleChip rule={rule} onChange={onChangeRule} />
          <span aria-hidden="true" className="min-w-[16px] flex-1" />
          <div className="flex h-[34px] w-[260px] shrink-0 items-center gap-[9px] rounded-[8px] bg-pg-surface px-[14px] shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
            <Search size={16} aria-hidden="true" className="shrink-0 text-pg-faint" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search duplicates"
              className="min-w-0 flex-1 bg-transparent text-[13px] leading-[normal] text-pg-text placeholder:text-pg-faint focus:outline-none"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {scanning ? (
            <ScanningState />
          ) : shown.length === 0 ? (
            <FinishedState rule={rule} />
          ) : (
            <div className="flex flex-col gap-[16px] p-[16px]">
              {pager.pageRows.map((g) => (
                <GroupCard
                  key={g.id}
                  group={g}
                  masterId={masterOf(g)}
                  onMaster={(id) => setMasters((m) => ({ ...m, [g.id]: id }))}
                  onMerge={() => setConfirming(g)}
                />
              ))}
            </div>
          )}
        </div>

        {!scanning && pager.pageCount > 1 ? <TablePager state={pager} /> : null}
      </div>

      {confirming ? (
        <Modal
          title={`Merge ${confirming.records.length} contacts?`}
          width={440}
          onClose={() => setConfirming(null)}
          footer={
            <>
              <OutlineButton onClick={() => setConfirming(null)}>Cancel</OutlineButton>
              <PrimaryButton onClick={confirmMerge}>Merge contacts</PrimaryButton>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            The records will be merged into{" "}
            <span className="font-semibold text-pg-heading">
              {confirming.records.find((r) => r.id === masterOf(confirming))?.name}
            </span>
            . Their conversations, notes, tasks, and opportunities move to that
            record. This can&apos;t be undone.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}

/** The "Find by email" pill, which switches the rule in place. */
function RuleChip({
  rule,
  onChange,
}: {
  rule: DuplicateRule;
  onChange: (rule: DuplicateRule) => void;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-[30px] items-center gap-[6px] rounded-full bg-pg-surface pr-[10px] pl-[12px] text-[13px] leading-[normal] font-medium whitespace-nowrap text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)] active:scale-[0.97]",
          open && "shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]",
        )}
      >
        Find by {RULE_LABELS[rule].toLowerCase()}
        <ChevronDown size={14} aria-hidden="true" className="text-pg-faint" />
      </button>
      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            className="absolute top-[calc(100%+6px)] left-0 z-40 w-[180px] rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-border)]"
          >
            {RULES.map((r) => (
              <button
                key={r}
                type="button"
                role="menuitemradio"
                aria-checked={r === rule}
                onClick={() => {
                  setOpen(false);
                  if (r !== rule) onChange(r);
                }}
                className="flex w-full items-center gap-[8px] rounded-[6px] px-[10px] py-[7px] text-left motion-tap hover:bg-pg"
              >
                <span
                  className={cn(
                    "min-w-0 flex-1 text-[14px] leading-[20px]",
                    r === rule ? "font-medium text-pg-heading" : "text-pg-text",
                  )}
                >
                  {RULE_LABELS[r]}
                </span>
                {r === rule ? (
                  <Check size={14} aria-hidden="true" className="text-brand" />
                ) : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

const TH =
  "px-[12px] py-[8px] text-left text-[12px] leading-[16px] font-medium whitespace-nowrap text-pg-muted shadow-[inset_0_-1px_0_0_var(--pg-row-border)]";
const TD =
  "px-[12px] py-[8px] text-[14px] leading-[20px] whitespace-nowrap text-pg-text";

function GroupCard({
  group,
  masterId,
  onMaster,
  onMerge,
}: {
  group: DuplicateGroup;
  masterId: string;
  onMaster: (id: string) => void;
  onMerge: () => void;
}) {
  return (
    <section
      aria-label={group.value}
      className="overflow-hidden rounded-[10px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]"
    >
      <header className="flex items-center gap-[10px] bg-pg px-[16px] py-[10px] shadow-[inset_0_-1px_0_0_var(--pg-border)]">
        <h2 className="min-w-0 truncate text-[14px] leading-[20px] font-semibold text-pg-heading">
          {group.value}
        </h2>
        <StatusTag tone="neutral">{group.records.length} records</StatusTag>
        <span aria-hidden="true" className="flex-1" />
        <PrimaryButton onClick={onMerge}>Merge</PrimaryButton>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={cn(TH, "w-[56px]")}>Keep</th>
              <th className={TH}>Name</th>
              <th className={TH}>Email</th>
              <th className={TH}>Phone</th>
              <th className={TH}>Created</th>
              <th className={TH}>Last activity</th>
              <th className={TH}>Tags</th>
            </tr>
          </thead>
          <tbody>
            {group.records.map((r, i) => {
              const master = r.id === masterId;
              const last = i === group.records.length - 1;
              return (
                <tr
                  key={r.id}
                  onClick={() => onMaster(r.id)}
                  className={cn(
                    "cursor-pointer motion-tap",
                    master ? "bg-pg-row-selected" : "hover:bg-pg",
                    !last && "shadow-[inset_0_-1px_0_0_var(--pg-row-border)]",
                  )}
                >
                  <td className={TD}>
                    <input
                      type="radio"
                      name={`keep-${group.id}`}
                      checked={master}
                      onChange={() => onMaster(r.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Keep ${r.name}`}
                      className="size-[16px] cursor-pointer accent-brand"
                    />
                  </td>
                  <td className={TD}>
                    <span className="flex items-center gap-[8px]">
                      <ToneAvatar name={r.name} tone={r.tone} size={26} round />
                      <span className="max-w-[200px] truncate font-medium text-pg-heading">
                        {r.name}
                      </span>
                    </span>
                  </td>
                  <td className={TD}>
                    {r.email ?? <span className="text-pg-faint">–</span>}
                  </td>
                  <td className={cn(TD, "tabular-nums")}>
                    {r.phone ?? <span className="text-pg-faint">–</span>}
                  </td>
                  <td className={cn(TD, "tabular-nums")}>{formatStamp(r.created)}</td>
                  <td className={TD}>{r.lastActivity}</td>
                  <td className={TD}>
                    {r.tags.length ? (
                      <span className="flex gap-[4px]">
                        {r.tags.map((t) => (
                          <span
                            key={t}
                            className="inline-flex h-[20px] items-center rounded-[4px] bg-pg px-[6px] text-[12px] leading-none text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]"
                          >
                            {t}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="text-pg-faint">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ScanningState() {
  return (
    <div
      role="status"
      className="flex h-full min-h-[360px] flex-col items-center justify-center gap-[8px] px-[16px] py-[32px] text-center"
    >
      <DetectiveIllustration />
      <h2 className="mt-[12px] text-[16px] leading-[24px] font-semibold text-pg-text-strong">
        We&apos;re working on fetching the duplicates
      </h2>
      <p className="max-w-[420px] text-[14px] leading-[20px] text-pg-muted">
        Searching through your contacts and identifying duplicates might take
        some time.
      </p>
    </div>
  );
}

function FinishedState({ rule }: { rule: DuplicateRule }) {
  return (
    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-[8px] px-[16px] py-[32px] text-center">
      <span className="mb-[4px] flex size-[48px] items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--hr-success-600)_12%,transparent)] text-[var(--pg-status-paid-fg)]">
        <CircleCheck size={24} aria-hidden="true" />
      </span>
      <h2 className="text-[16px] leading-[24px] font-semibold text-pg-heading">
        No duplicates found
      </h2>
      <p className="text-[14px] leading-[20px] text-pg-muted">
        Every contact is unique by {RULE_LABELS[rule].toLowerCase()}.
      </p>
    </div>
  );
}

/**
 * A detective with a magnifying glass in front of a faint brick wall.
 *
 * Drawn from tokens, not a raster, so it follows the page theme into dark
 * mode. The magnifier bobs; the keyframes sit in the SVG so the component
 * carries its own motion, and reduced motion stops it.
 */
function DetectiveIllustration() {
  const bricks: { x: number; y: number }[] = [];
  for (let row = 0; row < 5; row++) {
    const offset = row % 2 ? -22 : 0;
    for (let col = 0; col < 6; col++) {
      bricks.push({ x: 8 + offset + col * 44, y: 20 + row * 22 });
    }
  }

  return (
    <svg
      width="240"
      height="170"
      viewBox="0 0 240 170"
      aria-hidden="true"
      className="shrink-0"
    >
      <style>{`
        @keyframes dup-bob {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50% { transform: translate(4px, -5px) rotate(-4deg); }
        }
        .dup-magnifier {
          transform-box: fill-box;
          transform-origin: 0% 100%;
          animation: dup-bob 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .dup-magnifier { animation: none; }
        }
      `}</style>

      <defs>
        <clipPath id="dup-wall">
          <rect x="10" y="18" width="220" height="112" rx="10" />
        </clipPath>
      </defs>

      {/* Brick wall */}
      <g clipPath="url(#dup-wall)" opacity="0.7">
        {bricks.map((b, i) => (
          <rect
            key={i}
            x={b.x}
            y={b.y}
            width="40"
            height="18"
            rx="3"
            className="fill-pg stroke-pg-border"
            strokeWidth="1"
          />
        ))}
      </g>

      {/* Floor */}
      <ellipse cx="120" cy="156" rx="78" ry="8" className="fill-pg-border" opacity="0.6" />

      {/* Coat */}
      <path
        d="M88 156 L94 104 Q120 90 146 104 L152 156 Z"
        className="fill-pg-faint"
      />
      <path d="M120 98 L112 124 L120 156 L128 124 Z" className="fill-pg-muted" opacity="0.55" />

      {/* Head */}
      <circle cx="120" cy="80" r="16" className="fill-pg-border-strong" />

      {/* Hat */}
      <ellipse cx="120" cy="68" rx="28" ry="6" className="fill-pg-muted" />
      <path d="M104 68 Q104 46 120 46 Q136 46 136 68 Z" className="fill-pg-muted" />
      <rect x="104" y="61" width="32" height="5" className="fill-pg-text-strong" opacity="0.5" />

      {/* Arm and magnifier */}
      <g className="dup-magnifier">
        <path
          d="M142 112 L166 96"
          className="stroke-pg-faint"
          strokeWidth="9"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M170 92 L178 84"
          className="stroke-pg-text-strong"
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="190" cy="72" r="16" className="fill-brand-soft stroke-pg-text-strong" strokeWidth="4" />
        <path
          d="M182 66 Q186 60 192 60"
          className="stroke-pg-surface"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>
    </svg>
  );
}
