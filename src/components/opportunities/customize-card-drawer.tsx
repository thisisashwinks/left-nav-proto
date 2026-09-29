"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  CalendarPlus,
  ChevronRight,
  ExternalLink,
  FileText,
  GripVertical,
  Info,
  Lock,
  MessageSquareMore,
  PhoneCall,
  Search,
  SquareCheck,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { Checkbox } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { ViewBar } from "@/components/page/view-bar";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  CARD_FIELD_GROUPS,
  CARD_FIELD_LABEL,
  DEFAULT_CARD_CONFIG,
  QUICK_ACTION_LABEL,
  type CardConfig,
  type CardFieldId,
  type CardLayout,
  type QuickActionId,
} from "./card-config";
import type { Opportunity } from "./opportunities-data";
import { OpportunityCard } from "./opportunity-card";
import { UnsavedChangesModal } from "./opportunity-delete-modal";

/**
 * Customize card — the right-hand drawer that edits what a board card shows.
 *
 * The preview at the top is the real OpportunityCard fed the draft config,
 * so what you see while editing is exactly what Apply will paint on the
 * board. Nothing leaves the drawer until Apply; closing a dirty drawer asks
 * first.
 */

/** The fields the "chosen" list always offers, whether on or off. */
const BASE_FIELDS: CardFieldId[] = [
  "name",
  "smartTags",
  "owner",
  "business",
  "source",
  "value",
  "lostReason",
];

const ALL_ACTIONS: QuickActionId[] = ["call", "unread", "tags", "notes", "tasks", "appointment"];

const ACTION_ICON: Record<QuickActionId, LucideIcon> = {
  call: PhoneCall,
  unread: MessageSquareMore,
  tags: Tag,
  notes: FileText,
  tasks: SquareCheck,
  appointment: CalendarPlus,
};

const LAYOUTS: { id: CardLayout; label: string }[] = [
  { id: "default", label: "Default" },
  { id: "compact", label: "Compact" },
  { id: "unlabeled", label: "Unlabeled" },
];

/** A record that carries every field, so each toggle visibly changes the card. */
const SAMPLE: Opportunity = {
  id: "preview",
  name: "Opportunity name",
  contact: "Jane Doe",
  owner: "Jane Doe",
  business: "Tech Innovators Inc.",
  source: "Referral",
  value: "$50,000",
  lostReason: "Budget constraints",
  stageId: "new",
  updated: "2 weeks ago",
  tone: "blue",
  phone: "(415) 555-0100",
  tags: ["hot lead", "referral"],
  unread: 1,
  nextAppointment: "2026-09-06T00:30",
};

interface Draft {
  layout: CardLayout;
  /** Every row the chosen list draws, in order; `name` is always first. */
  fieldOrder: CardFieldId[];
  fieldOn: CardFieldId[];
  actionOrder: QuickActionId[];
  actionOn: QuickActionId[];
}

function toDraft(config: CardConfig): Draft {
  const fields: CardFieldId[] = [
    "name",
    ...config.fields.filter((f) => f !== "name"),
  ];
  return {
    layout: config.layout,
    fieldOrder: [...fields, ...BASE_FIELDS.filter((f) => !fields.includes(f))],
    fieldOn: fields,
    actionOrder: [
      ...config.actions,
      ...ALL_ACTIONS.filter((a) => !config.actions.includes(a)),
    ],
    actionOn: config.actions,
  };
}

function fromDraft(d: Draft): CardConfig {
  return {
    layout: d.layout,
    fields: d.fieldOrder.filter((f) => d.fieldOn.includes(f)),
    actions: d.actionOrder.filter((a) => d.actionOn.includes(a)),
  };
}

function sameConfig(a: CardConfig, b: CardConfig): boolean {
  return (
    a.layout === b.layout &&
    a.fields.join() === b.fields.join() &&
    a.actions.join() === b.actions.join()
  );
}

function move<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function CustomizeCardDrawer({
  value,
  onClose,
  onApply,
}: {
  value: CardConfig;
  onClose: () => void;
  onApply: (next: CardConfig) => void;
}) {
  const { effective } = useTheme();
  const [draft, setDraft] = React.useState<Draft>(() => toDraft(value));
  const [tab, setTab] = React.useState<"fields" | "actions">("fields");
  const [confirming, setConfirming] = React.useState(false);

  const next = React.useMemo(() => fromDraft(draft), [draft]);
  const dirty = !sameConfig(next, value);

  const requestClose = React.useCallback(() => {
    if (dirty) setConfirming(true);
    else onClose();
  }, [dirty, onClose]);

  React.useEffect(() => {
    if (confirming) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      requestClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [confirming, requestClose]);

  const apply = () => {
    onApply(next);
    showToast("Card updated");
    onClose();
  };

  if (typeof document === "undefined") return <></>;

  const fieldCount = `Fields (${next.fields.length} of ${draft.fieldOrder.length})`;

  return createPortal(
    <div data-page-theme={effective.appTheme} className="fixed inset-0 z-[80]">
      <button
        type="button"
        aria-label="Close"
        tabIndex={-1}
        onClick={requestClose}
        className="motion-fade-in absolute inset-0 cursor-default bg-[#10182866]"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Customize card"
        className="motion-slot-in absolute top-0 right-0 bottom-0 flex w-[420px] max-w-full flex-col bg-pg-surface shadow-[0_20px_24px_-4px_rgba(16,24,40,0.08),0_8px_8px_-4px_rgba(16,24,40,0.03),0_0_0_1px_var(--pg-card-border)]"
      >
        <header className="flex shrink-0 items-center gap-[12px] px-[16px] pt-[12px] pb-[12px]">
          <h2 className="min-w-0 flex-1 truncate text-[18px] leading-[26px] font-semibold text-pg-heading">
            Customize card
          </h2>
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
          <section aria-label="Card preview" className="bg-pg p-[16px]">
            <p className="mb-[8px] text-[13px] leading-[18px] font-medium text-pg-muted">
              Card preview
            </p>
            <OpportunityCard record={SAMPLE} config={next} preview />
          </section>

          <div className="flex flex-col gap-[16px] px-[16px] pt-[16px] pb-[16px]">
            <fieldset className="flex flex-col gap-[8px]">
              <legend className="mb-[8px] text-[14px] leading-[20px] font-medium text-pg-text-strong">
                Card layout
              </legend>
              <div role="radiogroup" aria-label="Card layout" className="flex flex-wrap gap-[20px]">
                {LAYOUTS.map((l) => (
                  <Radio
                    key={l.id}
                    label={l.label}
                    checked={draft.layout === l.id}
                    onSelect={() => setDraft((d) => ({ ...d, layout: l.id }))}
                  />
                ))}
              </div>
            </fieldset>

            <div className="flex flex-col gap-[12px]">
              <ViewBar
                label="Card settings"
                size="md"
                views={[
                  { id: "fields", label: fieldCount },
                  { id: "actions", label: "Quick actions" },
                ]}
                activeId={tab}
                onSelect={(id) => setTab(id as "fields" | "actions")}
              />
              {tab === "fields" ? (
                <FieldsTab draft={draft} setDraft={setDraft} />
              ) : (
                <ActionsTab draft={draft} setDraft={setDraft} />
              )}
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 items-center gap-[12px] border-t border-pg-head-border px-[16px] py-[12px]">
          <button
            type="button"
            onClick={() => setDraft(toDraft(DEFAULT_CARD_CONFIG))}
            className="motion-tap text-[14px] leading-[20px] font-medium text-brand hover:brightness-110"
          >
            Reset to default
          </button>
          <div className="flex-1" />
          <OutlineButton className="h-[36px]" onClick={requestClose}>
            Cancel
          </OutlineButton>
          <PrimaryButton
            className="h-[36px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100"
            disabled={!dirty}
            onClick={apply}
          >
            Apply
          </PrimaryButton>
        </footer>
      </aside>

      {confirming ? (
        <UnsavedChangesModal
          onKeepEditing={() => setConfirming(false)}
          onDiscard={() => {
            setConfirming(false);
            onClose();
          }}
        />
      ) : null}
    </div>,
    document.body,
  );
}

function Radio({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className="motion-tap flex items-center gap-[8px] text-left"
    >
      <span
        aria-hidden="true"
        className={cn(
          "flex size-[16px] shrink-0 items-center justify-center rounded-full",
          checked
            ? "bg-brand"
            : "bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border-strong)]",
        )}
      >
        {checked ? <span className="size-[6px] rounded-full bg-brand-fg" /> : null}
      </span>
      <span className="text-[14px] leading-[20px] text-pg-text">{label}</span>
    </button>
  );
}

type SetDraft = React.Dispatch<React.SetStateAction<Draft>>;

function FieldsTab({ draft, setDraft }: { draft: Draft; setDraft: SetDraft }) {
  const [query, setQuery] = React.useState("");
  const [openGroups, setOpenGroups] = React.useState<string[]>([]);
  const q = query.trim().toLowerCase();
  const matches = (f: CardFieldId) => !q || CARD_FIELD_LABEL[f].toLowerCase().includes(q);

  const toggle = (f: CardFieldId, on: boolean) =>
    setDraft((d) => {
      if (on) {
        return {
          ...d,
          fieldOrder: d.fieldOrder.includes(f) ? d.fieldOrder : [...d.fieldOrder, f],
          fieldOn: d.fieldOn.includes(f) ? d.fieldOn : [...d.fieldOn, f],
        };
      }
      return {
        ...d,
        // Base fields keep their row; an added field goes back to its group.
        fieldOrder: BASE_FIELDS.includes(f) ? d.fieldOrder : d.fieldOrder.filter((x) => x !== f),
        fieldOn: d.fieldOn.filter((x) => x !== f),
      };
    });

  const shown = draft.fieldOrder.filter(matches);

  return (
    <div className="flex flex-col gap-[12px]">
      <label className="flex h-[36px] items-center gap-[8px] rounded-[8px] bg-pg-surface px-[12px] shadow-[inset_0_0_0_1px_var(--pg-border)] focus-within:shadow-[inset_0_0_0_1px_var(--brand),0_0_0_3px_var(--brand-soft)]">
        <Search size={15} aria-hidden="true" className="shrink-0 text-pg-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search fields"
          aria-label="Search fields"
          className="min-w-0 flex-1 bg-transparent text-[14px] leading-[20px] text-pg-text placeholder:text-pg-faint focus:outline-none"
        />
      </label>

      {shown.length > 0 ? (
        <SortableList
          label="Card fields"
          items={shown}
          // Reordering a filtered list would scramble the hidden rows.
          disabled={!!q}
          locked={(f) => f === "name"}
          onMove={(from, to) =>
            setDraft((d) => {
              const fromIdx = d.fieldOrder.indexOf(shown[from]);
              const toIdx = Math.max(1, d.fieldOrder.indexOf(shown[to]));
              return { ...d, fieldOrder: move(d.fieldOrder, fromIdx, toIdx) };
            })
          }
          renderRow={(f) => {
            const locked = f === "name";
            return (
              <>
                <Checkbox
                  checked={locked || draft.fieldOn.includes(f)}
                  disabled={locked}
                  onChange={(on) => toggle(f, on)}
                  label={CARD_FIELD_LABEL[f]}
                />
                {locked ? (
                  <Lock size={13} aria-label="Always shown" className="shrink-0 text-pg-faint" />
                ) : null}
                {f === "smartTags" ? (
                  <>
                    <span className="flex h-[18px] shrink-0 items-center rounded-full bg-brand-soft px-[6px] text-[11px] leading-none font-semibold text-brand">
                      New
                    </span>
                    <span className="flex-1" />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        showToast("Smart tags opens in Settings");
                      }}
                      className="motion-tap flex shrink-0 items-center gap-[4px] text-[13px] leading-[18px] font-medium text-brand hover:brightness-110"
                    >
                      Create
                      <ExternalLink size={13} aria-hidden="true" />
                    </button>
                  </>
                ) : null}
              </>
            );
          }}
        />
      ) : null}

      <div className="flex flex-col gap-[4px] pt-[4px]">
        <h3 className="text-[14px] leading-[20px] font-medium text-pg-text-strong">Add fields</h3>
        {CARD_FIELD_GROUPS.map((g) => {
          const open = openGroups.includes(g.label) || !!q;
          const fields = g.fields.filter(matches);
          if (q && fields.length === 0) return null;
          return (
            <div key={g.label} className="flex flex-col">
              <button
                type="button"
                aria-expanded={open}
                onClick={() =>
                  setOpenGroups((o) =>
                    o.includes(g.label) ? o.filter((x) => x !== g.label) : [...o, g.label],
                  )
                }
                className="motion-tap flex h-[36px] items-center gap-[6px] rounded-[6px] text-left text-[14px] leading-[20px] text-pg-text hover:text-pg-heading"
              >
                <ChevronRight
                  size={15}
                  aria-hidden="true"
                  className={cn("motion-move shrink-0 text-pg-muted", open && "rotate-90")}
                />
                {g.label}
              </button>
              {open ? (
                <div className="flex flex-col pl-[21px]">
                  {fields.length === 0 ? (
                    <p className="py-[8px] text-[13px] leading-[18px] text-pg-muted">
                      No fields available
                    </p>
                  ) : (
                    fields.map((f) => (
                      <div key={f} className="flex h-[36px] items-center">
                        <Checkbox
                          checked={draft.fieldOn.includes(f)}
                          onChange={(on) => toggle(f, on)}
                          label={CARD_FIELD_LABEL[f]}
                        />
                      </div>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionsTab({ draft, setDraft }: { draft: Draft; setDraft: SetDraft }) {
  return (
    <div className="flex flex-col gap-[12px]">
      <p className="flex items-center gap-[6px] text-[13px] leading-[18px] text-pg-muted">
        <Info size={14} aria-hidden="true" className="shrink-0" />
        Counts show on the card wherever they apply.
      </p>
      <SortableList
        label="Quick actions"
        items={draft.actionOrder}
        onMove={(from, to) =>
          setDraft((d) => ({ ...d, actionOrder: move(d.actionOrder, from, to) }))
        }
        renderRow={(a) => {
          const Icon = ACTION_ICON[a];
          return (
            <>
              <Checkbox
                checked={draft.actionOn.includes(a)}
                onChange={(on) =>
                  setDraft((d) => ({
                    ...d,
                    actionOn: on ? [...d.actionOn, a] : d.actionOn.filter((x) => x !== a),
                  }))
                }
                label={QUICK_ACTION_LABEL[a]}
              />
              <span className="flex-1" />
              <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
            </>
          );
        }}
      />
    </div>
  );
}

/**
 * A reorderable list: native HTML5 drag from any unlocked row, and
 * Alt+ArrowUp/Down on a focused row. Locked rows stay put and nothing can be
 * dropped above them.
 */
function SortableList<T extends string>({
  label,
  items,
  onMove,
  renderRow,
  locked = () => false,
  disabled = false,
}: {
  label: string;
  items: T[];
  onMove: (from: number, to: number) => void;
  renderRow: (item: T) => React.ReactNode;
  locked?: (item: T) => boolean;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = React.useState<T | null>(null);
  const [over, setOver] = React.useState<{ id: T; after: boolean } | null>(null);
  const rowRefs = React.useRef(new Map<T, HTMLLIElement>());
  const refocus = React.useRef<T | null>(null);
  const firstFree = items.findIndex((i) => !locked(i));

  // Moving a DOM node drops its focus; put it back after the reorder paints.
  React.useLayoutEffect(() => {
    if (!refocus.current) return;
    rowRefs.current.get(refocus.current)?.focus();
    refocus.current = null;
  }, [items]);

  const clamp = (to: number) => Math.min(items.length - 1, Math.max(firstFree, to));

  const drop = () => {
    if (dragging && over && dragging !== over.id) {
      const from = items.indexOf(dragging);
      let to = items.indexOf(over.id) + (over.after ? 1 : 0);
      if (from < to) to -= 1;
      to = clamp(to);
      if (to !== from) onMove(from, to);
    }
    setDragging(null);
    setOver(null);
  };

  return (
    <ul aria-label={label} className="flex flex-col">
      {items.map((item, index) => {
        const isLocked = locked(item);
        const canDrag = !disabled && !isLocked;
        const indicator = over?.id === item && dragging && dragging !== item;
        return (
          <li
            key={item}
            ref={(el) => {
              if (el) rowRefs.current.set(item, el);
              else rowRefs.current.delete(item);
            }}
            tabIndex={canDrag ? 0 : -1}
            draggable={canDrag}
            aria-roledescription={canDrag ? "Sortable item" : undefined}
            title={canDrag ? "Drag, or press Alt+Arrow keys, to reorder" : undefined}
            onDragStart={(e) => {
              if (!canDrag) return;
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", item);
              setDragging(item);
            }}
            onDragOver={(e) => {
              if (!dragging) return;
              e.preventDefault();
              const r = e.currentTarget.getBoundingClientRect();
              const after = isLocked || e.clientY > r.top + r.height / 2;
              if (over?.id !== item || over.after !== after) setOver({ id: item, after });
            }}
            onDrop={(e) => {
              e.preventDefault();
              drop();
            }}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            onKeyDown={(e) => {
              if (!canDrag || !e.altKey) return;
              if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
              e.preventDefault();
              const to = clamp(index + (e.key === "ArrowUp" ? -1 : 1));
              if (to === index) return;
              refocus.current = item;
              onMove(index, to);
            }}
            className={cn(
              "relative flex h-[36px] items-center gap-[8px] rounded-[6px] pr-[4px] focus-visible:shadow-[0_0_0_2px_var(--brand-soft),inset_0_0_0_1px_var(--brand)] focus-visible:outline-none",
              canDrag && "hover:bg-pg",
              dragging === item && "opacity-40",
            )}
          >
            {indicator ? (
              <span
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-x-0 h-[2px] rounded-full bg-brand",
                  over.after ? "-bottom-px" : "-top-px",
                )}
              />
            ) : null}
            <GripVertical
              size={15}
              aria-hidden="true"
              className={cn(
                "shrink-0",
                canDrag ? "cursor-grab text-pg-faint" : "text-pg-faint opacity-30",
              )}
            />
            {renderRow(item)}
          </li>
        );
      })}
    </ul>
  );
}
