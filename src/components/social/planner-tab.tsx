"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleUserRound,
  Columns3Cog,
  Copy,
  Filter,
  Image as ImageIcon,
  List,
  ListFilter,
  Pencil,
  Search,
  Tag,
  Trash2,
  Type,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { Checkbox } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, OverflowMenu, PrimaryButton } from "@/components/page/page-header";
import { DrawerCheckRow, SideDrawer } from "@/components/page/side-drawer";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  ACCOUNTS,
  STATUS_LABEL,
  TYPE_LABEL,
  accountById,
  deletePosts,
  duplicatePost,
  formatPostDate,
  usePosts,
  type PostStatus,
  type PostType,
  type SocialPost,
} from "./social-data";
import { AccountAvatar, MediaTile, StatusChip } from "./social-ui";

type ColumnId = "media" | "status" | "type" | "date" | "social";

const COLUMNS: { id: ColumnId | "caption"; label: string; icon: LucideIcon; width: string }[] = [
  { id: "caption", label: "Caption", icon: Type, width: "minmax(220px,2.6fr)" },
  { id: "media", label: "Media", icon: ImageIcon, width: "minmax(90px,0.9fr)" },
  { id: "status", label: "Status", icon: CircleCheck, width: "minmax(130px,1.3fr)" },
  { id: "type", label: "Type", icon: Tag, width: "minmax(130px,1.5fr)" },
  { id: "date", label: "Date", icon: CalendarDays, width: "minmax(120px,1.4fr)" },
  { id: "social", label: "Social", icon: CircleUserRound, width: "minmax(100px,1.1fr)" },
];

/** Filter views — the saved cuts the live "Filter views ▾" offers. */
const VIEWS: { id: "all" | PostStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Published" },
  { id: "scheduled", label: "Scheduled" },
  { id: "draft", label: "Drafts" },
  { id: "failed", label: "Failed" },
];

const PER_PAGE = [10, 25, 50];

const dayStart = (v: string) => (v ? new Date(`${v}T00:00:00`).getTime() : null);
const dayEnd = (v: string) => (v ? new Date(`${v}T23:59:59.999`).getTime() : null);

/**
 * Social Planner ▸ Planner — every post across the connected accounts, as a
 * table or a month.
 *
 * The date range and the account picker scope BOTH views; Filter views and
 * Filters narrow further. Search only kicks in at three characters, as the
 * live placeholder promises, so a stray keystroke doesn't blank the table.
 */
export function PlannerTab({ onEdit }: { onEdit: (post: SocialPost) => void }) {
  const posts = usePosts();
  const [view, setView] = React.useState<(typeof VIEWS)[number]["id"]>("all");
  const [statuses, setStatuses] = React.useState<PostStatus[]>([]);
  const [types, setTypes] = React.useState<PostType[]>([]);
  const [from, setFrom] = React.useState("2026-05-01");
  const [to, setTo] = React.useState("2026-11-01");
  const [accounts, setAccounts] = React.useState<string[]>(ACCOUNTS.map((a) => a.id));
  const [mode, setMode] = React.useState<"list" | "calendar">("list");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [perPage, setPerPage] = React.useState(10);
  const [selected, setSelected] = React.useState<ReadonlySet<string>>(() => new Set());
  const [hidden, setHidden] = React.useState<ReadonlySet<ColumnId>>(() => new Set());
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState<string[] | null>(null);

  const q = query.trim().toLowerCase();
  const rows = React.useMemo(() => {
    const lo = dayStart(from);
    const hi = dayEnd(to);
    return posts.filter(
      (p) =>
        (view === "all" || p.status === view) &&
        (statuses.length === 0 || statuses.includes(p.status)) &&
        (types.length === 0 || types.includes(p.type)) &&
        (lo === null || p.at >= lo) &&
        (hi === null || p.at <= hi) &&
        p.accountIds.some((id) => accounts.includes(id)) &&
        (q.length < 3 || p.caption.toLowerCase().includes(q)),
    );
  }, [posts, view, statuses, types, from, to, accounts, q]);

  const pageCount = Math.max(1, Math.ceil(rows.length / perPage));
  if (page > pageCount) setPage(pageCount);
  const current = Math.min(page, pageCount);
  const pageRows = rows.slice((current - 1) * perPage, current * perPage);

  // Any change to what's in the list starts you back on page 1.
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  const cols = ["56px", ...COLUMNS.filter((c) => c.id === "caption" || !hidden.has(c.id)).map((c) => c.width), "64px"].join(" ");
  const pageIds = pageRows.map((p) => p.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someOnPage = pageIds.some((id) => selected.has(id));
  const filterCount = statuses.length + types.length;

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      {/* Toolbar */}
      <div className="flex shrink-0 flex-wrap items-center gap-[10px] px-[16px] py-[16px]">
        <MenuButton
          label={
            <>
              <ListFilter size={15} aria-hidden="true" className="text-pg-text-strong" />
              Filter views <span className="font-medium text-brand">{VIEWS.find((v) => v.id === view)!.label}</span>
            </>
          }
        >
          {(close) =>
            VIEWS.map((v) => (
              <MenuItem
                key={v.id}
                selected={v.id === view}
                onClick={() => {
                  reset(setView)(v.id);
                  close();
                }}
              >
                {v.label}
              </MenuItem>
            ))
          }
        </MenuButton>
        <OutlineButton onClick={() => setFiltersOpen(true)} className="h-[36px]">
          <Filter size={15} aria-hidden="true" className="text-pg-text-strong" />
          Filters
          {filterCount ? (
            <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-[5px] text-[11px] leading-none font-semibold text-brand-fg">
              {filterCount}
            </span>
          ) : null}
        </OutlineButton>

        <div className="ml-auto flex h-[36px] shrink-0 items-stretch overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          <DateSlot label="From" value={from} max={to} onChange={reset(setFrom)} />
          <span aria-hidden="true" className="w-px bg-[var(--pg-border)]" />
          <DateSlot label="To" value={to} min={from} onChange={reset(setTo)} />
        </div>

        <AccountPicker value={accounts} onChange={reset(setAccounts)} />

        <div role="group" aria-label="Planner view" className="flex h-[36px] shrink-0 overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
          {(
            [
              { id: "list", icon: List, label: "List view" },
              { id: "calendar", icon: CalendarDays, label: "Calendar view" },
            ] as const
          ).map((m, i) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mode === m.id}
              aria-label={m.label}
              title={m.label}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex w-[40px] items-center justify-center motion-tap",
                i > 0 && "border-l border-pg-border",
                mode === m.id
                  ? "bg-brand-soft text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                  : "text-pg-text-strong hover:bg-pg",
              )}
            >
              <m.icon size={17} aria-hidden="true" />
            </button>
          ))}
        </div>

        <label className="flex h-[36px] max-w-[300px] min-w-[150px] flex-1 basis-[150px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
          <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
          <input
            type="search"
            value={query}
            onChange={(e) => reset(setQuery)(e.target.value)}
            placeholder="Search by caption (min 3 chars)"
            aria-label="Search by caption"
            className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
          />
        </label>
      </div>

      {selected.size > 0 && mode === "list" ? (
        <div className="mx-[16px] mb-[12px] flex h-[44px] shrink-0 items-center gap-[12px] rounded-[8px] bg-brand-soft px-[14px]">
          <span className="text-[14px] leading-[20px] font-medium text-pg-heading">
            {selected.size} selected
          </span>
          <span className="flex-1" />
          <OutlineButton onClick={() => setSelected(new Set())}>Clear selection</OutlineButton>
          <OutlineButton
            onClick={() => setConfirmDelete([...selected])}
            className="text-[var(--hr-error-600)]"
          >
            <Trash2 size={15} aria-hidden="true" />
            Delete
          </OutlineButton>
        </div>
      ) : null}

      {mode === "calendar" ? (
        <PlannerCalendar posts={rows} anchor={rows[0]?.at ?? (to ? new Date(`${to}T00:00:00`).getTime() : null)} onOpen={onEdit} />
      ) : (
        <>
          <div className="mx-[16px] min-h-0 flex-1 overflow-auto rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
            <div role="table" aria-label="Posts" className="min-w-[900px]">
              <div
                role="row"
                style={{ gridTemplateColumns: cols }}
                className="sticky top-0 z-10 grid h-[48px] items-stretch border-b border-pg-border bg-[color-mix(in_srgb,var(--pg-border)_22%,var(--pg-surface))]"
              >
                <span className="flex items-center justify-center border-r border-pg-border">
                  <Checkbox
                    checked={allOnPage}
                    mixed={!allOnPage && someOnPage}
                    onChange={() =>
                      setSelected((s) => {
                        const n = new Set(s);
                        pageIds.forEach((id) => (allOnPage ? n.delete(id) : n.add(id)));
                        return n;
                      })
                    }
                  />
                </span>
                {COLUMNS.filter((c) => c.id === "caption" || !hidden.has(c.id)).map((c) => (
                  <span
                    key={c.id}
                    role="columnheader"
                    className="flex items-center gap-[8px] border-r border-pg-border px-[16px] text-[14px] leading-[20px] font-semibold text-pg-heading"
                  >
                    <c.icon size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
                    {c.label}
                  </span>
                ))}
                <span className="flex items-center justify-center">
                  <ColumnsMenu hidden={hidden} onChange={setHidden} />
                </span>
              </div>

              {pageRows.map((p) => (
                <PostRow
                  key={p.id}
                  post={p}
                  cols={cols}
                  hidden={hidden}
                  checked={selected.has(p.id)}
                  onCheck={() => toggle(p.id)}
                  onEdit={() => onEdit(p)}
                  onDelete={() => setConfirmDelete([p.id])}
                />
              ))}

              {rows.length === 0 ? (
                <div className="flex h-[240px] flex-col items-center justify-center gap-[6px] text-center">
                  <p className="text-[14px] leading-[20px] font-medium text-pg-heading">No posts match</p>
                  <p className="text-[13px] leading-[18px] text-pg-muted">
                    Try a wider date range, more accounts, or fewer filters.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <Pager
            total={rows.length}
            page={current}
            perPage={perPage}
            pageCount={pageCount}
            onPage={setPage}
            onPerPage={(n) => {
              setPerPage(n);
              setPage(1);
            }}
          />
        </>
      )}

      {filtersOpen ? (
        <FiltersDrawer
          statuses={statuses}
          types={types}
          onApply={(s, t) => {
            setStatuses(s);
            setTypes(t);
            setPage(1);
            setFiltersOpen(false);
          }}
          onClose={() => setFiltersOpen(false)}
        />
      ) : null}

      {confirmDelete ? (
        <Modal
          title={confirmDelete.length === 1 ? "Delete this post?" : `Delete ${confirmDelete.length} posts?`}
          width={440}
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <OutlineButton onClick={() => setConfirmDelete(null)}>Cancel</OutlineButton>
              <button
                type="button"
                onClick={() => {
                  deletePosts(confirmDelete);
                  setSelected((s) => new Set([...s].filter((id) => !confirmDelete.includes(id))));
                  showToast(confirmDelete.length === 1 ? "Post deleted" : `${confirmDelete.length} posts deleted`);
                  setConfirmDelete(null);
                }}
                className="flex h-[36px] items-center rounded-[8px] bg-[var(--hr-error-600)] px-[14px] text-[14px] leading-[20px] font-medium text-white motion-tap hover:bg-[var(--hr-error-700)]"
              >
                Delete
              </button>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            Published posts stay live on each network. This only removes them from the planner.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}

/* ─── Rows ──────────────────────────────────────────────────────────────── */

function PostRow({
  post,
  cols,
  hidden,
  checked,
  onCheck,
  onEdit,
  onDelete,
}: {
  post: SocialPost;
  cols: string;
  hidden: ReadonlySet<ColumnId>;
  checked: boolean;
  onCheck: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { date, time } = formatPostDate(post.at);
  const cell = "flex min-w-0 items-center border-r border-pg-row-border px-[16px]";
  return (
    <div
      role="row"
      style={{ gridTemplateColumns: cols }}
      className={cn(
        "grid h-[64px] items-stretch border-b border-pg-row-border last:border-b-0",
        checked ? "bg-[color-mix(in_oklab,var(--brand)_5%,var(--pg-surface))]" : "hover:bg-[color-mix(in_srgb,var(--pg-border)_14%,var(--pg-surface))]",
      )}
    >
      <span className="flex items-center justify-center border-r border-pg-row-border">
        <Checkbox checked={checked} onChange={onCheck} />
      </span>
      <span className={cell}>
        <button
          type="button"
          onClick={onEdit}
          title={post.caption}
          className="min-w-0 truncate text-left text-[14px] leading-[20px] text-pg-text hover:text-brand"
        >
          {post.caption}
        </button>
      </span>
      {hidden.has("media") ? null : (
        <span className={cn(cell, "justify-center")}>
          <MediaTile media={post.media} />
        </span>
      )}
      {hidden.has("status") ? null : (
        <span className={cell}>
          <StatusChip status={post.status} />
        </span>
      )}
      {hidden.has("type") ? null : (
        <span className={cell}>
          <span className="inline-flex h-[28px] items-center rounded-[6px] bg-pg px-[10px] text-[14px] leading-none text-pg-text">
            {TYPE_LABEL[post.type]}
          </span>
        </span>
      )}
      {hidden.has("date") ? null : (
        <span className={cn(cell, "flex-col items-start justify-center")}>
          <span className="text-[14px] leading-[20px] text-pg-heading">{date}</span>
          <span className="text-[13px] leading-[18px] text-pg-muted">{time}</span>
        </span>
      )}
      {hidden.has("social") ? null : (
        <span className={cn(cell, "gap-[4px]")}>
          {post.accountIds.map((id) => {
            const a = accountById(id);
            return a ? <AccountAvatar key={id} account={a} size={26} /> : null;
          })}
        </span>
      )}
      <span className="flex items-center justify-center">
        <OverflowMenu
          items={[
            { label: post.status === "published" ? "View post" : "Edit post", icon: Pencil, onClick: onEdit },
            {
              label: "Duplicate",
              icon: Copy,
              onClick: () => {
                duplicatePost(post.id);
                showToast("Post duplicated as a draft");
              },
            },
            { label: "Delete", icon: Trash2, danger: true, onClick: onDelete },
          ]}
        />
      </span>
    </div>
  );
}

/* ─── Pager ─────────────────────────────────────────────────────────────── */

/** 1 2 3 4 5 … 24 — the live pager, which keeps the ends and your neighbours. */
function pageList(current: number, count: number): (number | "gap")[] {
  if (count <= 7) return Array.from({ length: count }, (_, i) => i + 1);
  const set = new Set([1, count, current - 1, current, current + 1]);
  if (current <= 4) [2, 3, 4, 5].forEach((n) => set.add(n));
  if (current >= count - 3) [count - 4, count - 3, count - 2, count - 1].forEach((n) => set.add(n));
  const nums = [...set].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1]! > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

function Pager({
  total,
  page,
  perPage,
  pageCount,
  onPage,
  onPerPage,
}: {
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
  onPage: (n: number) => void;
  onPerPage: (n: number) => void;
}) {
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(total, page * perPage);
  const fmt = (n: number) => n.toLocaleString("en-US");
  const btn =
    "flex h-[36px] min-w-[36px] items-center justify-center rounded-[8px] px-[10px] text-[14px] leading-[20px] motion-tap disabled:cursor-not-allowed disabled:text-pg-disabled";
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-[12px] px-[24px] py-[16px]">
      <span className="text-[14px] leading-[20px] text-pg-text">
        {fmt(first)} to {fmt(last)} of {fmt(total)} result(s)
      </span>
      <span className="flex-1" />
      <label className="flex items-center gap-[8px] text-[14px] leading-[20px] text-pg-text">
        Rows per page
        <span className="relative flex">
          <select
            value={perPage}
            onChange={(e) => onPerPage(Number(e.target.value))}
            className="h-[36px] cursor-pointer appearance-none rounded-[8px] bg-pg-surface pr-[30px] pl-[10px] text-[14px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] focus:outline-none"
          >
            {PER_PAGE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute top-[11px] right-[10px] text-pg-faint" />
        </span>
      </label>
      <span className="text-[14px] leading-[20px] text-pg-text tabular-nums">
        {fmt(first)}–{fmt(last)} of {fmt(total)}
      </span>
      <nav aria-label="Pagination" className="flex items-center gap-[4px]">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className={cn(btn, "shadow-[inset_0_0_0_1px_var(--pg-border)] enabled:hover:bg-pg")}
        >
          Previous
        </button>
        {pageList(page, pageCount).map((n, i) =>
          n === "gap" ? (
            <span key={`gap-${i}`} className={cn(btn, "shadow-[inset_0_0_0_1px_var(--pg-border)] text-pg-muted")}>
              …
            </span>
          ) : (
            <button
              key={n}
              type="button"
              aria-current={n === page ? "page" : undefined}
              onClick={() => onPage(n)}
              className={cn(
                btn,
                n === page
                  ? "font-medium text-brand shadow-[inset_0_0_0_1px_var(--brand)]"
                  : "text-pg-text hover:bg-pg",
              )}
            >
              {n}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
          className={cn(btn, "shadow-[inset_0_0_0_1px_var(--pg-border)] enabled:hover:bg-pg")}
        >
          Next
        </button>
      </nav>
    </div>
  );
}

/* ─── Toolbar pieces ────────────────────────────────────────────────────── */

function DateSlot({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: string;
  min?: string;
  max?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-[6px] bg-pg-surface px-[10px] focus-within:bg-brand-soft">
      <CalendarDays size={15} aria-hidden="true" className="shrink-0 text-pg-muted" />
      <input
        type="date"
        aria-label={label}
        value={value}
        min={min || undefined}
        max={max || undefined}
        onChange={(e) => onChange(e.target.value)}
        className="w-[100px] bg-transparent text-[14px] leading-[20px] text-pg-heading focus:outline-none [&::-webkit-calendar-picker-indicator]:opacity-60"
      />
    </label>
  );
}

/** A button whose menu is portalled so the card's overflow can't clip it. */
function MenuButton({
  label,
  children,
  className,
  align = "left",
  "aria-label": ariaLabel,
  width = 220,
}: {
  label: React.ReactNode;
  children: (close: () => void) => React.ReactNode;
  className?: string;
  align?: "left" | "right";
  "aria-label"?: string;
  width?: number;
}) {
  const { effective } = useTheme();
  const [rect, setRect] = React.useState<DOMRect | null>(null);
  const close = () => setRect(null);
  React.useEffect(() => {
    if (!rect) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setRect(null);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
    };
  }, [rect]);
  return (
    <>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={!!rect}
        aria-label={ariaLabel}
        onClick={(e) => setRect(rect ? null : e.currentTarget.getBoundingClientRect())}
        className={cn(
          "flex h-[36px] shrink-0 items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] text-[14px] leading-[20px] font-medium text-pg-text-strong shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:bg-pg",
          className,
        )}
      >
        {label}
      </button>
      {rect && typeof document !== "undefined"
        ? createPortal(
            <div data-page-theme={effective.appTheme}>
              <button type="button" aria-label="Close menu" onClick={close} className="fixed inset-0 z-[90] cursor-default" />
              <div
                role="menu"
                style={{
                  top: rect.bottom + 6,
                  width,
                  ...(align === "right" ? { left: rect.right - width } : { left: rect.left }),
                }}
                className="fixed z-[91] flex max-h-[360px] flex-col overflow-auto rounded-[8px] bg-pg-surface p-[4px] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),0_0_0_1px_var(--pg-border)]"
              >
                {children(close)}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function MenuItem({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={!!selected}
      onClick={onClick}
      className="flex h-[36px] items-center gap-[8px] rounded-[6px] px-[10px] text-left text-[14px] leading-[20px] text-pg-text hover:bg-pg"
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {selected ? <Check size={15} aria-hidden="true" className="shrink-0 text-brand" /> : null}
    </button>
  );
}

/** The account stack — first five, then "+3" — opening a checklist. */
function AccountPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const shown = ACCOUNTS.filter((a) => value.includes(a.id));
  const head = shown.slice(0, 5);
  const rest = shown.length - head.length;
  const all = value.length === ACCOUNTS.length;
  return (
    <MenuButton
      aria-label="Choose social accounts"
      width={280}
      align="right"
      className="h-[44px] gap-[4px] px-[8px]"
      label={
        <>
          {head.length === 0 ? (
            <span className="px-[4px] text-pg-muted">No accounts</span>
          ) : (
            head.map((a, i) => (
              <span key={a.id} className={i > 0 ? "-ml-[9px]" : undefined}>
                <AccountAvatar account={a} size={28} />
              </span>
            ))
          )}
          {rest > 0 ? (
            <span className="-ml-[2px] flex size-[28px] items-center justify-center rounded-full bg-pg text-[12px] leading-none font-medium text-pg-text">
              +{rest}
            </span>
          ) : null}
          <ChevronDown size={16} aria-hidden="true" className="ml-[4px] text-pg-muted" />
        </>
      }
    >
      {() => (
        <>
          <MenuItem selected={all} onClick={() => onChange(all ? [] : ACCOUNTS.map((a) => a.id))}>
            All accounts
          </MenuItem>
          <span className="my-[4px] h-px bg-[var(--pg-border)]" />
          {ACCOUNTS.map((a) => {
            const on = value.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                role="menuitemcheckbox"
                aria-checked={on}
                onClick={() => onChange(on ? value.filter((v) => v !== a.id) : [...value, a.id])}
                className="flex h-[40px] items-center gap-[10px] rounded-[6px] px-[10px] text-left hover:bg-pg"
              >
                <AccountAvatar account={a} size={24} />
                <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-text">{a.name}</span>
                {/* Drawn, not a Checkbox: that is a button, and this row already is one. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-[16px] shrink-0 items-center justify-center rounded-[4px]",
                    on ? "bg-brand text-brand-fg" : "shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
                  )}
                >
                  {on ? <Check size={11} strokeWidth={3} /> : null}
                </span>
              </button>
            );
          })}
        </>
      )}
    </MenuButton>
  );
}

function ColumnsMenu({
  hidden,
  onChange,
}: {
  hidden: ReadonlySet<ColumnId>;
  onChange: (h: ReadonlySet<ColumnId>) => void;
}) {
  return (
    <MenuButton
      aria-label="Manage columns"
      align="right"
      className="size-[32px] justify-center p-0 shadow-none"
      label={<Columns3Cog size={16} aria-hidden="true" className="text-pg-muted" />}
    >
      {() =>
        COLUMNS.filter((c) => c.id !== "caption").map((c) => {
          const id = c.id as ColumnId;
          const on = !hidden.has(id);
          return (
            <button
              key={id}
              type="button"
              role="menuitemcheckbox"
              aria-checked={on}
              onClick={() => {
                const n = new Set(hidden);
                if (on) n.add(id);
                else n.delete(id);
                onChange(n);
              }}
              className="flex h-[36px] items-center gap-[10px] rounded-[6px] px-[10px] text-left hover:bg-pg"
            >
              <c.icon size={15} aria-hidden="true" className="text-pg-muted" />
              <span className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text">{c.label}</span>
              {on ? <Check size={15} aria-hidden="true" className="text-brand" /> : null}
            </button>
          );
        })
      }
    </MenuButton>
  );
}

function FiltersDrawer({
  statuses,
  types,
  onApply,
  onClose,
}: {
  statuses: PostStatus[];
  types: PostType[];
  onApply: (s: PostStatus[], t: PostType[]) => void;
  onClose: () => void;
}) {
  const [s, setS] = React.useState(statuses);
  const [t, setT] = React.useState(types);
  const flip = <T,>(l: T[], v: T) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v]);
  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="fixed inset-0 z-[79] cursor-default bg-[rgba(16,24,40,0.24)]"
      />
      <SideDrawer
        title="Filters"
        width={360}
        onClose={onClose}
        footer={
          <>
            <button
              type="button"
              disabled={s.length + t.length === 0}
              onClick={() => {
                setS([]);
                setT([]);
              }}
              className="text-[14px] leading-[20px] font-medium text-pg-muted enabled:hover:text-pg-heading disabled:text-pg-disabled"
            >
              Clear all
            </button>
            <span className="flex-1" />
            <OutlineButton onClick={onClose}>Cancel</OutlineButton>
            <PrimaryButton onClick={() => onApply(s, t)}>Apply</PrimaryButton>
          </>
        }
      >
        <div className="flex flex-col gap-[16px] py-[14px]">
          <section>
            <h3 className="pb-[4px] text-[13px] leading-[18px] font-semibold text-pg-heading">Status</h3>
            {(Object.keys(STATUS_LABEL) as PostStatus[]).map((k) => (
              <DrawerCheckRow key={k} label={STATUS_LABEL[k]} checked={s.includes(k)} onToggle={() => setS((l) => flip(l, k))} />
            ))}
          </section>
          <section className="border-t border-pg-head-border pt-[14px]">
            <h3 className="pb-[4px] text-[13px] leading-[18px] font-semibold text-pg-heading">Post type</h3>
            {(Object.keys(TYPE_LABEL) as PostType[]).map((k) => (
              <DrawerCheckRow key={k} label={TYPE_LABEL[k]} checked={t.includes(k)} onToggle={() => setT((l) => flip(l, k))} />
            ))}
          </section>
        </div>
      </SideDrawer>
    </>
  );
}

/* ─── Calendar view ─────────────────────────────────────────────────────── */

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * The same filtered posts as a month. It opens on the month of the newest
 * post in scope, and steps freely from there.
 */
function PlannerCalendar({
  posts,
  anchor,
  onOpen,
}: {
  posts: SocialPost[];
  /** Epoch ms of the newest post in scope — the month the view opens on. */
  anchor: number | null;
  onOpen: (p: SocialPost) => void;
}) {
  const [month, setMonth] = React.useState(() => {
    const start = new Date(anchor ?? Date.now());
    return new Date(start.getFullYear(), start.getMonth(), 1);
  });
  const first = new Date(month);
  const lead = (first.getDay() + 6) % 7;
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((lead + daysIn) / 7) * 7 }, (_, i) => {
    const d = i - lead + 1;
    return d >= 1 && d <= daysIn ? d : null;
  });
  const byDay = new Map<number, SocialPost[]>();
  posts.forEach((p) => {
    const d = new Date(p.at);
    if (d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth()) {
      const list = byDay.get(d.getDate()) ?? [];
      list.push(p);
      byDay.set(d.getDate(), list);
    }
  });
  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth() && today.getDate() === d;

  return (
    <div className="mx-[16px] mb-[16px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
      <div className="flex h-[52px] shrink-0 items-center gap-[8px] border-b border-pg-border px-[16px]">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="flex size-[32px] items-center justify-center rounded-[8px] text-pg-text-strong hover:bg-pg"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="flex size-[32px] items-center justify-center rounded-[8px] text-pg-text-strong hover:bg-pg"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
        <h3 className="text-[16px] leading-[22px] font-semibold text-pg-heading">
          {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </h3>
        <span className="flex-1" />
        <OutlineButton onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>Today</OutlineButton>
      </div>
      <div className="grid shrink-0 grid-cols-7 border-b border-pg-border">
        {WEEKDAYS.map((w) => (
          <span key={w} className="px-[10px] py-[8px] text-[13px] leading-[18px] font-medium text-pg-muted">
            {w}
          </span>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 auto-rows-fr grid-cols-7 overflow-auto">
        {cells.map((d, i) => {
          const list = d ? (byDay.get(d) ?? []) : [];
          return (
            <div
              key={i}
              className={cn(
                "flex min-h-[104px] min-w-0 flex-col gap-[4px] border-r border-b border-pg-row-border p-[6px] [&:nth-child(7n)]:border-r-0",
                !d && "bg-[color-mix(in_srgb,var(--pg-border)_18%,var(--pg-surface))]",
              )}
            >
              {d ? (
                <span
                  className={cn(
                    "flex size-[24px] items-center justify-center rounded-full text-[13px] leading-none",
                    isToday(d) ? "bg-brand font-semibold text-brand-fg" : "text-pg-text",
                  )}
                >
                  {d}
                </span>
              ) : null}
              {list.slice(0, 3).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onOpen(p)}
                  title={p.caption}
                  className={cn(
                    "flex min-w-0 items-center gap-[4px] rounded-[4px] px-[6px] py-[2px] text-left text-[12px] leading-[16px]",
                    p.status === "published"
                      ? "bg-[color-mix(in_oklab,var(--hr-success-500)_10%,transparent)] text-[var(--hr-success-700)]"
                      : p.status === "failed"
                        ? "bg-[color-mix(in_oklab,var(--hr-error-500)_10%,transparent)] text-[var(--hr-error-700)]"
                        : p.status === "scheduled"
                          ? "bg-brand-soft text-brand"
                          : "bg-pg text-pg-text",
                  )}
                >
                  <span className="truncate">{p.caption}</span>
                </button>
              ))}
              {list.length > 3 ? (
                <span className="px-[6px] text-[12px] leading-[16px] text-pg-muted">+{list.length - 3} more</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

