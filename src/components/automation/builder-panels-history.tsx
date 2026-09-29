"use client";

import * as React from "react";
import {
  Copy,
  EllipsisVertical,
  ExternalLink,
  ListFilter,
  Plus,
  Search,
  SearchX,
  Trash2,
  X,
} from "lucide-react";
import {
  AnchoredPopover,
  FIELD_BOX,
  MenuOption,
  Select,
} from "@/components/contacts/book-appointment-modal";
import {
  useBuilderState,
  type RailPanelProps,
  type SwitcherWorkflow,
} from "@/components/automation/builder-state";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";

/**
 * The two rail panels that are about *which* workflow is on the canvas rather
 * than what is in it: the workflow switcher and version history.
 *
 * Both render inside the rail's host card (about 300px wide, full height,
 * 16px padding) and draw their own header — title, one-line subtitle, the
 * actions at top right — over a body that scrolls on its own. Everything they
 * change goes through the builder state, so the canvas and the page title
 * follow without either panel knowing about them.
 */

/* ─── Shared pieces ─────────────────────────────────────────────────────── */

const ICON_BUTTON =
  "motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-heading";

/** A bordered 8px card; the selected one trades its hairline for a brand ring. */
const CARD =
  "flex w-full cursor-pointer flex-col gap-[6px] rounded-[8px] bg-pg-surface px-[12px] py-[10px] text-left motion-tap outline-none focus-visible:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]";
const CARD_IDLE =
  "shadow-[inset_0_0_0_1px_var(--pg-border)] hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]";
const CARD_ACTIVE = "shadow-[inset_0_0_0_1.5px_var(--brand),0_0_0_3px_var(--brand-soft)]";

function PanelHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <header className="flex shrink-0 items-start gap-[8px] pb-[12px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <h2 className="text-[16px] leading-[22px] font-semibold text-pg-heading">{title}</h2>
        <p className="text-[13px] leading-[18px] text-pg-muted">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-[2px]">{children}</div>
    </header>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="pt-[4px] text-[13px] leading-[18px] font-medium text-pg-faint">{children}</h3>
  );
}

function StatusPill({ status }: { status: "published" | "draft" }) {
  return status === "published" ? (
    <span className="shrink-0 rounded-full border border-[var(--hr-success-600)] px-[8px] py-[1px] text-[12px] leading-[16px] font-medium text-[var(--hr-success-700)]">
      Published
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-pg-bg px-[8px] py-[1px] text-[12px] leading-[16px] font-medium text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]">
      Draft
    </span>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center gap-[6px] px-[8px] py-[32px] text-center">
      <SearchX size={20} aria-hidden="true" className="text-pg-faint" />
      <p className="text-[14px] leading-[20px] font-medium text-pg-heading">{title}</p>
      <p className="text-[13px] leading-[18px] text-pg-muted">{hint}</p>
    </div>
  );
}

/**
 * A card that is itself the click target but still holds its own buttons
 * (kebab, Restore). A div with a button role, because a real button cannot
 * nest the kebab; Enter and Space act like a click.
 */
function PickCard({
  active,
  label,
  onPick,
  children,
}: {
  active: boolean;
  label: string;
  onPick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={active}
      aria-label={label}
      onClick={onPick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onPick();
        }
      }}
      className={cn(CARD, active ? CARD_ACTIVE : CARD_IDLE)}
    >
      {children}
    </div>
  );
}

/** The card's kebab and its menu. Clicks stop here so the card does not also pick. */
function CardMenu({
  label,
  items,
}: {
  label: string;
  items: { label: string; icon: React.ReactNode; onSelect: () => void }[];
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [open, setOpen] = React.useState(false);
  const close = React.useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => e.stopPropagation()}
        className="motion-tap -mr-[4px] flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-faint hover:bg-pg-bg hover:text-pg-heading"
      >
        <EllipsisVertical size={15} aria-hidden="true" />
      </button>
      {open ? (
        <AnchoredPopover anchorRef={ref} onClose={close} align="end" width={264}>
          <div role="menu" aria-label={label} className="flex flex-col p-[4px]">
            {items.map((item) => (
              <MenuOption
                key={item.label}
                onClick={() => {
                  close();
                  item.onSelect();
                }}
              >
                <span className="shrink-0 text-pg-muted">{item.icon}</span>
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
              </MenuOption>
            ))}
          </div>
        </AnchoredPopover>
      ) : null}
    </>
  );
}

/* ─── Workflow switcher ─────────────────────────────────────────────────── */

/**
 * Workflow switcher — jump to another workflow without going back to the list.
 *
 * The current workflow is pinned in its own section so it never scrolls away
 * behind the recents; the search narrows both. "+" makes a blank draft and
 * opens it, which moves it into "Current" and the old one into the recents.
 */
export function WorkflowSwitcherPanel({ onClose }: RailPanelProps) {
  const state = useBuilderState();
  const [query, setQuery] = React.useState("");
  if (!state) return null;

  const q = query.trim().toLowerCase();
  const matches = (w: SwitcherWorkflow) => !q || w.name.toLowerCase().includes(q);
  const current = matches(state.current) ? state.current : null;
  const recents = state.recents.filter((w) => w.id !== state.current.id && matches(w));

  const card = (w: SwitcherWorkflow) => {
    const isCurrent = w.id === state.current.id;
    return (
      <PickCard
        key={w.id}
        active={isCurrent}
        label={isCurrent ? `${w.name}, current workflow` : `Switch to ${w.name}`}
        onPick={() => {
          if (isCurrent) return;
          state.openWorkflow(w);
          showToast(`Switched to ${w.name}`);
        }}
      >
        <div className="flex min-w-0 items-center gap-[8px]">
          <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-pg-heading">
            {w.name}
          </span>
          <CardMenu
            label={`More actions for ${w.name}`}
            items={[
              {
                label: "Duplicate workflow",
                icon: <Copy size={14} aria-hidden="true" />,
                onSelect: () => {
                  state.createWorkflow({ name: w.name, graph: w.graph });
                  showToast("Workflow duplicated");
                },
              },
              {
                label: "Open in new tab",
                icon: <ExternalLink size={14} aria-hidden="true" />,
                onSelect: () => showToast("Opened in a new tab"),
              },
            ]}
          />
        </div>
        <div className="flex min-w-0 items-center gap-[8px]">
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-muted">
            Edited: {w.edited}
          </span>
          <StatusPill status={w.status} />
        </div>
      </PickCard>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader
        title="Workflow switcher"
        subtitle="Quickly switch or search workflows without leaving your build."
      >
        <button
          type="button"
          aria-label="Create workflow"
          title="Create workflow"
          onClick={() => {
            state.createWorkflow();
            setQuery("");
            showToast("Workflow created");
          }}
          className={ICON_BUTTON}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
        <button type="button" aria-label="Close" onClick={onClose} className={ICON_BUTTON}>
          <X size={16} aria-hidden="true" />
        </button>
      </PanelHeader>

      <label className={cn(FIELD_BOX, "mb-[12px] shrink-0")}>
        <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search workflow name"
          aria-label="Search workflow name"
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text outline-none placeholder:text-pg-faint"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="motion-tap -mr-[4px] flex size-[20px] shrink-0 items-center justify-center rounded-[4px] text-pg-faint hover:text-pg-heading"
          >
            <X size={13} aria-hidden="true" />
          </button>
        ) : null}
      </label>

      <div className="-mx-[4px] flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[4px] pt-[2px] pb-[4px]">
        {!current && recents.length === 0 ? (
          <EmptyState
            title="No workflows found"
            hint={`Nothing matches "${query.trim()}". Try a different name.`}
          />
        ) : (
          <>
            {current ? (
              <>
                <SectionLabel>Current workflow</SectionLabel>
                {card(current)}
              </>
            ) : null}
            {recents.length > 0 ? (
              <>
                <SectionLabel>Recent workflows</SectionLabel>
                {recents.map(card)}
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Version history ───────────────────────────────────────────────────── */

const AUTHORS = ["Anyone", "Ashwin K S", "Abhishek Chauhan", "Uday"] as const;
type AuthorFilter = (typeof AUTHORS)[number];

interface Version {
  n: number;
  author: Exclude<AuthorFilter, "Anyone">;
  at: string;
  status: "published" | "draft";
}

/**
 * v8 is the published head; v7–v1 are the drafts before it. Uday wrote most
 * of them and Abhishek two, so "Updated by" has something to take away.
 */
const VERSIONS: Version[] = [8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({
  n,
  author: n === 3 || n === 5 ? "Abhishek Chauhan" : "Uday",
  at: n === 1 ? "24 Sep 2026, 9:41 PM" : "28 Sep 2026, 4:39 PM",
  status: n === 8 ? "published" : "draft",
}));

const CURRENT_VERSION = 8;

/**
 * Version history — every saved version of the workflow on the canvas.
 *
 * Picking a previous version puts the canvas into view-only mode on it (the
 * builder state strips the page down while it is there); picking the current
 * one comes back. Restore asks first, because it overwrites the draft. The
 * list is named after `state.current`, so switching workflows relabels it.
 */
export function VersionHistoryPanel({ onClose }: RailPanelProps) {
  const state = useBuilderState();
  const filterRef = React.useRef<HTMLButtonElement>(null);
  const [filterOpen, setFilterOpen] = React.useState(false);
  const closeFilter = React.useCallback(() => setFilterOpen(false), []);
  const [author, setAuthor] = React.useState<AuthorFilter>("Anyone");
  const [restoring, setRestoring] = React.useState<number | null>(null);
  const closeRestore = React.useCallback(() => setRestoring(null), []);
  if (!state) return null;

  const { current, viewingVersion } = state;
  const shown = VERSIONS.filter((v) => author === "Anyone" || v.author === author);
  const head = shown.find((v) => v.n === CURRENT_VERSION);
  const previous = shown.filter((v) => v.n !== CURRENT_VERSION);
  const filtered = author !== "Anyone";

  const card = (v: Version) => {
    const isHead = v.n === CURRENT_VERSION;
    const active = isHead ? viewingVersion === null : viewingVersion === v.n;
    return (
      <PickCard
        key={v.n}
        active={active}
        label={isHead ? `Current version ${v.n}` : `View version ${v.n}`}
        onPick={() => state.viewVersion(isHead ? null : v.n)}
      >
        <div className="flex min-w-0 items-center gap-[6px]">
          <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-pg-heading">
            {current.name}
          </span>
          <span className="shrink-0 rounded-[4px] bg-pg-bg px-[5px] py-[1px] text-[12px] leading-[16px] font-medium text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)]">
            v{v.n}
          </span>
          {!isHead ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRestoring(v.n);
              }}
              onKeyDown={(e) => e.stopPropagation()}
              className="motion-tap shrink-0 rounded-[4px] px-[4px] text-[13px] leading-[18px] font-medium text-pg-muted hover:text-pg-heading"
            >
              Restore
            </button>
          ) : null}
          <CardMenu
            label={`More actions for version ${v.n}`}
            items={[
              {
                label: "Create new workflow from this version",
                icon: <Plus size={14} aria-hidden="true" />,
                onSelect: () => {
                  state.createWorkflow({ name: current.name, graph: current.graph });
                  showToast(`Workflow created from version ${v.n}`);
                },
              },
            ]}
          />
        </div>
        <div className="flex min-w-0 items-center gap-[8px]">
          <span
            aria-hidden="true"
            className={cn(
              "flex size-[18px] shrink-0 items-center justify-center rounded-full text-[10px] leading-none font-semibold",
              v.n === 1
                ? "bg-pg-bg text-pg-muted shadow-[inset_0_0_0_1px_var(--pg-border)]"
                : "bg-[var(--hr-error-500)] text-white",
            )}
          >
            {v.author.charAt(0)}
          </span>
          <span className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-pg-muted">
            <span className="sr-only">{v.author}, </span>
            {v.at}
          </span>
          <StatusPill status={v.status} />
        </div>
      </PickCard>
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PanelHeader
        title="Version history"
        subtitle="Version history is kept for 30 days, or the last 10 versions if older."
      >
        <button
          ref={filterRef}
          type="button"
          aria-label="Filter versions"
          aria-haspopup="dialog"
          aria-expanded={filterOpen}
          onClick={() => setFilterOpen((o) => !o)}
          className={cn(ICON_BUTTON, "relative", filtered && "text-brand hover:text-brand")}
        >
          <ListFilter size={16} aria-hidden="true" />
          {filtered ? (
            <span
              aria-hidden="true"
              className="absolute top-[5px] right-[5px] size-[6px] rounded-full bg-brand"
            />
          ) : null}
        </button>
        <button type="button" aria-label="Close" onClick={onClose} className={ICON_BUTTON}>
          <X size={16} aria-hidden="true" />
        </button>
      </PanelHeader>

      {filterOpen ? (
        <AnchoredPopover anchorRef={filterRef} onClose={closeFilter} align="end" width={264}>
          <div role="dialog" aria-label="Filters" className="flex flex-col gap-[12px] p-[12px]">
            <div className="flex items-center justify-between gap-[8px]">
              <span className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                Filters
              </span>
              <button
                type="button"
                onClick={() => setAuthor("Anyone")}
                className="motion-tap flex items-center gap-[4px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
              >
                <Trash2 size={13} aria-hidden="true" />
                Clear
              </button>
            </div>
            <div className="flex flex-col gap-[4px]">
              <span className="text-[13px] leading-[18px] font-medium text-pg-text">
                Updated by
              </span>
              <Select<AuthorFilter>
                value={author}
                label="Updated by"
                options={AUTHORS.map((a) => ({ value: a, label: a }))}
                onChange={setAuthor}
              />
            </div>
          </div>
        </AnchoredPopover>
      ) : null}

      <div className="-mx-[4px] flex min-h-0 flex-1 flex-col gap-[8px] overflow-y-auto px-[4px] pt-[2px] pb-[4px]">
        {shown.length === 0 ? (
          <EmptyState
            title="No versions found"
            hint={`${author} hasn't updated this workflow. Try a different filter.`}
          />
        ) : (
          <>
            {head ? (
              <>
                <SectionLabel>Current version</SectionLabel>
                {card(head)}
              </>
            ) : null}
            {previous.length > 0 ? (
              <>
                <SectionLabel>Previous versions</SectionLabel>
                {previous.map(card)}
              </>
            ) : null}
          </>
        )}
      </div>

      {restoring !== null ? (
        <Modal
          title={`Restore version ${restoring}?`}
          width={400}
          onClose={closeRestore}
          footer={
            <>
              <OutlineButton onClick={closeRestore}>Cancel</OutlineButton>
              <PrimaryButton
                onClick={() => {
                  const n = restoring;
                  setRestoring(null);
                  state.viewVersion(null);
                  showToast(`Version ${n} restored`);
                }}
              >
                Restore version
              </PrimaryButton>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            This replaces the current draft with version {restoring}. You can still go back to any
            version.
          </p>
        </Modal>
      ) : null}
    </div>
  );
}
