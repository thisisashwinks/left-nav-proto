"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { SearchX, UserRound, X } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { ToneAvatar } from "@/components/page/avatar";
import { Checkbox, StatusTag } from "@/components/page/form-controls";
import { TablePager, usePagination } from "@/components/page/table-card";
import { cn } from "@/lib/utils";
import {
  drillMeta,
  drillRows,
  fmtCount,
  fmtUSD2,
  type DrillTarget,
  type ForecastRow,
} from "./forecast-data";

/**
 * The list behind a risk bucket or a data-quality row.
 *
 * A wide overlay rather than the working-alongside SideDrawer: this is a
 * table of nine columns you came to read, not a panel you consult while the
 * summary stays live, so it takes a scrim and most of the window. Portalled
 * and re-stamped with the page theme for the same reason the modal is — the
 * portal leaves the subtree that carries it.
 */

const HEAD =
  "sticky top-0 z-[1] h-[40px] border-b border-pg-head-border bg-pg-surface px-[12px] text-[12px] leading-[16px] font-medium whitespace-nowrap text-pg-muted";
const CELL = "h-[44px] px-[12px] text-[13px] leading-[18px] whitespace-nowrap";

const STATUS_TONE: Record<ForecastRow["status"], "brand" | "success" | "danger" | "neutral"> = {
  Open: "brand",
  Won: "success",
  Lost: "danger",
  Abandoned: "neutral",
};

export function ForecastDrilldownDrawer({
  target,
  onClose,
  onOpenRecord,
}: {
  target: DrillTarget;
  onClose: () => void;
  onOpenRecord?: (id: string) => void;
}) {
  const { effective } = useTheme();
  const { rows, total } = drillRows(target);
  const { title, subtitle } = drillMeta(target);
  const pager = usePagination(rows, 10);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  if (typeof document === "undefined") return <></>;

  const isRisk = target.kind === "risk";
  const showClose = target.kind === "quality" && target.id === "missing-close";
  const allOn = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const someOn = !allOn && rows.some((r) => selected.has(r.id));

  const toggle = (id: string, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });

  const name = (r: ForecastRow) =>
    onOpenRecord ? (
      <button
        type="button"
        onClick={() => onOpenRecord(r.id)}
        className="motion-tap max-w-[220px] truncate text-left font-medium text-brand hover:underline"
      >
        {r.name}
      </button>
    ) : (
      <span className="block max-w-[220px] truncate font-medium text-brand">{r.name}</span>
    );

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-[#10182866]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="motion-slot-in absolute top-[8px] right-[8px] bottom-[8px] flex w-[1040px] max-w-[calc(100vw-16px)] flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),0_0_0_1px_var(--pg-card-border)]"
      >
        <header className="flex shrink-0 items-start gap-[12px] border-b border-pg-head-border px-[16px] pt-[12px] pb-[12px]">
          <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <h2 className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">
              {title}
            </h2>
            <p className="truncate text-[13px] leading-[18px] text-pg-muted">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto">
          {rows.length === 0 ? (
            <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-[12px] px-[16px] py-[48px]">
              <span
                aria-hidden="true"
                className="flex size-[72px] items-center justify-center rounded-full bg-pg text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border)]"
              >
                <SearchX size={32} strokeWidth={1.5} />
              </span>
              <p className="text-[16px] leading-[22px] font-semibold text-pg-heading">
                No opportunities found
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[960px] border-separate border-spacing-0">
              <thead>
                <tr>
                  {isRisk ? null : (
                    <th className={cn(HEAD, "w-[44px] pr-0 pl-[16px]")}>
                      <Checkbox
                        checked={allOn}
                        mixed={someOn}
                        onChange={() =>
                          setSelected(allOn ? new Set() : new Set(rows.map((r) => r.id)))
                        }
                      />
                    </th>
                  )}
                  {(isRisk
                    ? ["Opportunity name", "Value", "Days slipped", "Times slipped", "Original close", "New close", "Pipeline", "Stage", "Owner"]
                    : ["Opportunity name", "Value", "Status", "Pipeline", "Stage", "Owner", ...(showClose ? ["Expected close"] : [])]
                  ).map((h, i) => (
                    <th
                      key={h}
                      className={cn(
                        HEAD,
                        isRisk && i === 0 && "pl-[16px]",
                        ["Value", "Days slipped", "Times slipped"].includes(h)
                          ? "text-right"
                          : "text-left",
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pager.pageRows.map((r) => {
                  const on = selected.has(r.id);
                  const td = cn(CELL, "border-b border-pg-row-border");
                  return (
                    <tr key={r.id} className={cn("hover:bg-pg", on && "bg-pg-row-selected")}>
                      {isRisk ? null : (
                        <td className={cn(td, "pr-0 pl-[16px]")}>
                          <Checkbox checked={on} onChange={(v) => toggle(r.id, v)} />
                        </td>
                      )}
                      <td className={cn(td, isRisk && "pl-[16px]")}>{name(r)}</td>
                      <td className={cn(td, "text-right font-medium text-pg-text-strong tabular-nums")}>
                        {fmtUSD2(r.value)}
                      </td>
                      {isRisk ? (
                        <>
                          <td className={cn(td, "text-right text-pg-text tabular-nums")}>{r.daysSlipped ?? "—"}</td>
                          <td className={cn(td, "text-right text-pg-text tabular-nums")}>{r.timesSlipped ?? "—"}</td>
                          <td className={cn(td, "text-pg-muted tabular-nums")}>{r.originalClose ?? "—"}</td>
                          <td className={cn(td, "text-pg-text tabular-nums")}>{r.newClose ?? "—"}</td>
                        </>
                      ) : (
                        <td className={td}>
                          <StatusTag tone={STATUS_TONE[r.status]}>{r.status}</StatusTag>
                        </td>
                      )}
                      <td className={cn(td, "text-pg-text")}>{r.pipeline}</td>
                      <td className={cn(td, "text-pg-text")}>{r.stage}</td>
                      <td className={td}>
                        <Owner row={r} />
                      </td>
                      {showClose ? (
                        <td className={cn(td, "text-pg-faint")}>{r.expectedClose ?? "—"}</td>
                      ) : null}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <footer className="flex shrink-0 items-center gap-[12px] border-t border-pg-head-border">
          <span className="pl-[16px] text-[13px] leading-[18px] whitespace-nowrap text-pg-muted tabular-nums">
            {fmtCount(total)} {total === 1 ? "opportunity" : "opportunities"}
            {selected.size > 0 ? (
              <span className="text-pg-text-strong"> · {fmtCount(selected.size)} selected</span>
            ) : null}
          </span>
          <div className="min-w-0 flex-1 [&>div]:border-t-0">
            {rows.length > 0 ? (
              <TablePager state={pager} />
            ) : (
              <div className="h-[52px]" />
            )}
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}

function Owner({ row }: { row: ForecastRow }) {
  if (!row.owner) {
    return (
      <span className="flex items-center gap-[8px] text-pg-muted">
        <span
          aria-hidden="true"
          className="flex size-[24px] shrink-0 items-center justify-center rounded-full text-pg-faint shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
        >
          <UserRound size={13} />
        </span>
        Unassigned
      </span>
    );
  }
  return (
    <span className="flex min-w-0 items-center gap-[8px] text-pg-text">
      <ToneAvatar
        name={row.owner}
        tone={row.ownerTone ?? "blue"}
        initials={row.ownerInitials}
        size={24}
        round
      />
      <span className="truncate">{row.owner}</span>
    </span>
  );
}
