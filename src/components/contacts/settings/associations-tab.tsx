"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowRight,
  EllipsisVertical,
  Info,
  Laptop,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { TextInput } from "@/components/page/form-controls";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { TableCard, usePagination } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import { useObjectNames } from "./object-settings-store";
import {
  deleteAssociation,
  limitText,
  objectsFor,
  useAssociations,
  type AssociationDef,
} from "./associations-settings-data";
import { AssociationDrawer } from "./associations-drawer";

const COLS = "1.25fr 1fr 1.25fr 0.55fr 32px";
const HEAD = "text-[12px] leading-[normal] font-medium whitespace-nowrap text-pg-muted";
const CARD =
  "rounded-[12px] bg-pg-surface shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03),inset_0_0_0_1px_var(--pg-card-border)]";

type SortKey = "label" | "object";
type Sort = { key: SortKey; dir: "asc" | "desc" } | null;

/** "Many to 25" / "25 to Many" — printed once when both directions agree. */
function limitLines(a: AssociationDef): string[] {
  const there = `${limitText(a.contactLimit)} to ${limitText(a.objectLimit)}`;
  const back = `${limitText(a.objectLimit)} to ${limitText(a.contactLimit)}`;
  return there === back ? [there] : [there, back];
}

/**
 * Associations — the object's relationship definitions.
 *
 * System rows ship with the platform and cannot be changed, so they carry no
 * menu at all rather than a menu of disabled items. The drawer is mounted
 * only while open, so each opening starts from its own row (or from empty).
 */
export function AssociationsTab() {
  const names = useObjectNames();
  const rows = useAssociations();
  const objects = objectsFor(names);
  const objectName = (a: AssociationDef) =>
    objects.find((o) => o.id === a.object)?.plural ?? a.object;

  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<Sort>(null);
  const [drawer, setDrawer] = React.useState<{ editing?: AssociationDef } | null>(null);
  const [deleting, setDeleting] = React.useState<AssociationDef | null>(null);

  // Recomputed each render: five-odd rows, and the object names follow the
  // Details tab, so there is nothing worth memoising against.
  const q = query.trim().toLowerCase();
  const matched = q
    ? rows.filter((r) => `${r.contactLabel} ${r.objectLabel}`.toLowerCase().includes(q))
    : rows;
  const text = (r: AssociationDef) => (sort?.key === "object" ? objectName(r) : r.contactLabel);
  const sign = sort?.dir === "desc" ? -1 : 1;
  const shown = sort ? [...matched].sort((a, b) => sign * text(a).localeCompare(text(b))) : matched;

  const pager = usePagination(shown);

  // Unsorted → ascending → descending → unsorted, the live table's cycle.
  const cycle = (key: SortKey) =>
    setSort((s) =>
      s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null,
    );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[16px]">
      <div className={cn(CARD, "flex shrink-0 items-center gap-[16px] px-[20px] py-[14px]")}>
        <p className="min-w-0 flex-1 text-[14px] leading-[20px] text-pg-text-strong">
          Use associations to identify and track the connections between your objects{" "}
          <button
            type="button"
            onClick={() => showToast("Opens the associations help article.")}
            className="inline-flex items-center gap-[2px] font-medium text-brand motion-tap hover:underline"
          >
            Learn more
            <ArrowRight size={14} aria-hidden="true" />
          </button>
        </p>
        <PrimaryButton onClick={() => setDrawer({})} className="h-[36px]">
          <Plus size={16} aria-hidden="true" />
          Create association
        </PrimaryButton>
      </div>

      <TableCard pager={pager} className={cn(CARD, "flex-none")}>
        <div className="flex h-[56px] items-center gap-[16px] px-[16px]">
          <h2 className="min-w-0 flex-1 truncate text-[16px] leading-[24px] font-medium text-brand">
            Association details ({shown.length})
          </h2>
          <label className="relative w-[240px] shrink-0">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-[12px] -translate-y-1/2 text-pg-faint"
            />
            <TextInput
              type="search"
              aria-label="Search label"
              placeholder="Search label"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-[34px]"
            />
          </label>
        </div>

        <div
          style={{ gridTemplateColumns: COLS }}
          className="sticky top-0 z-10 grid h-[40px] items-center gap-[16px] border-y border-pg-head-border bg-pg px-[16px]"
        >
          <SortHead
            label="Association label"
            info="The labels each side of the association shows."
            sort={sort?.key === "label" ? sort.dir : null}
            onSort={() => cycle("label")}
          />
          <span className={cn(HEAD, "flex items-center gap-[4px]")}>
            Limit
            <InfoTip text="How many records each side can be associated with." />
          </span>
          <SortHead
            label="Associated objects"
            info={`The object ${names.plural} are associated with.`}
            sort={sort?.key === "object" ? sort.dir : null}
            onSort={() => cycle("object")}
          />
          <span className={cn(HEAD, "flex items-center gap-[4px]")}>
            Created by
            <InfoTip text="System associations come with the platform and can't be changed." />
          </span>
          <span />
        </div>

        {shown.length === 0 ? (
          <div className="flex h-[160px] flex-col items-center justify-center gap-[4px]">
            <p className="text-[14px] leading-[20px] font-semibold text-pg-heading">
              No associations found
            </p>
            <p className="text-[13px] leading-[18px] text-pg-muted">
              Try a different label.
            </p>
          </div>
        ) : (
          pager.pageRows.map((r) => (
            <div
              key={r.id}
              style={{ gridTemplateColumns: COLS }}
              className="grid min-h-[72px] items-center gap-[16px] border-b border-pg-row-border px-[16px] py-[14px] last:border-b-0 hover:bg-pg"
            >
              <span className="flex min-w-0 flex-col text-[14px] leading-[22px] text-pg-heading">
                <span className="truncate">{r.contactLabel}</span>
                {r.kind === "pair" ? <span className="truncate">{r.objectLabel}</span> : null}
              </span>
              <span className="flex min-w-0 flex-col text-[14px] leading-[22px] text-pg-muted">
                {limitLines(r).map((l) => (
                  <span key={l} className="truncate">
                    {l}
                  </span>
                ))}
              </span>
              <span className="truncate text-[14px] leading-[20px] text-pg-muted">
                {objectName(r)}
              </span>
              <span
                title={r.createdBy === "system" ? "System" : "User"}
                className="flex text-pg-muted"
              >
                {r.createdBy === "system" ? (
                  <Laptop size={16} aria-label="System" />
                ) : (
                  <UserRound size={16} aria-label="User" />
                )}
              </span>
              {r.createdBy === "user" ? (
                <RowMenu
                  label={r.contactLabel}
                  onEdit={() => setDrawer({ editing: r })}
                  onDelete={() => setDeleting(r)}
                />
              ) : (
                <span />
              )}
            </div>
          ))
        )}
      </TableCard>

      {drawer ? (
        <AssociationDrawer editing={drawer.editing} onClose={() => setDrawer(null)} />
      ) : null}

      {deleting ? (
        <DeleteModal association={deleting} onClose={() => setDeleting(null)} />
      ) : null}
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span title={text} className="flex text-pg-faint">
      <Info size={13} aria-label={text} />
    </span>
  );
}

/** A header cell whose arrow sits at the column's far edge, as in the live table. */
function SortHead({
  label,
  info,
  sort,
  onSort,
}: {
  label: string;
  info: string;
  sort: "asc" | "desc" | null;
  onSort: () => void;
}) {
  return (
    <span className={cn(HEAD, "flex min-w-0 items-center gap-[4px]")}>
      {label}
      <InfoTip text={info} />
      <button
        type="button"
        onClick={onSort}
        aria-label={`Sort by ${label.toLowerCase()}${sort ? ` (${sort === "asc" ? "ascending" : "descending"})` : ""}`}
        className={cn(
          "ml-auto flex size-[24px] items-center justify-center rounded-[6px] motion-tap hover:bg-pg-surface",
          sort ? "text-brand" : "text-pg-faint hover:text-pg-muted",
        )}
      >
        <ArrowDown
          size={14}
          aria-hidden="true"
          className={cn("transition-transform duration-150", sort === "asc" && "rotate-180")}
        />
      </button>
    </span>
  );
}

/**
 * The row kebab. Fixed to the viewport rather than to the row, because the
 * table body scrolls and clips — and it opens upward when the row sits low,
 * which is where the live product draws it.
 */
function RowMenu({
  label,
  onEdit,
  onDelete,
}: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null);

  React.useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", close);
    document.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", close);
      document.removeEventListener("scroll", close, true);
    };
  }, [pos]);

  const toggle = () => {
    if (pos) return setPos(null);
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const menuHeight = 2 * 38 + 12;
    const above = r.top - 4 - menuHeight > 8;
    setPos({
      top: above ? r.top - 4 - menuHeight : r.bottom + 4,
      right: window.innerWidth - r.right,
    });
  };

  const items = [
    { label: "Edit", icon: Pencil, onClick: onEdit, danger: false },
    { label: "Delete", icon: Trash2, onClick: onDelete, danger: true },
  ];

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={pos != null}
        onClick={toggle}
        className={cn(
          "motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-surface hover:text-pg-heading",
          pos && "bg-pg-surface text-pg-heading",
        )}
      >
        <EllipsisVertical size={16} aria-hidden="true" />
      </button>
      {pos ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setPos(null)}
            className="fixed inset-0 z-30 cursor-default"
          />
          <div
            role="menu"
            aria-label={`Actions for ${label}`}
            style={{ top: pos.top, right: pos.right }}
            className="fixed z-40 w-[140px] rounded-[12px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setPos(null);
                  item.onClick();
                }}
                className={cn(
                  "motion-tap flex w-full items-center gap-[10px] rounded-[8px] px-[10px] py-[9px] text-left text-[14px] leading-[20px] hover:bg-pg",
                  item.danger ? "text-pg-danger" : "text-pg-text",
                )}
              >
                <item.icon
                  size={15}
                  aria-hidden="true"
                  className={item.danger ? "text-pg-danger" : "text-pg-muted"}
                />
                {item.label}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

function DeleteModal({
  association,
  onClose,
}: {
  association: AssociationDef;
  onClose: () => void;
}) {
  const name =
    association.kind === "pair"
      ? `${association.contactLabel} / ${association.objectLabel}`
      : association.contactLabel;
  return (
    <Modal
      width={520}
      onClose={onClose}
      title={
        <span className="flex items-center gap-[10px]">
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--pg-danger)_12%,transparent)] text-pg-danger">
            <Trash2 size={16} aria-hidden="true" />
          </span>
          <span className="min-w-0 break-words">Delete association?</span>
        </span>
      }
      footer={
        <div className="-mx-[16px] flex flex-1 justify-end gap-[12px] border-t border-pg-head-border px-[16px] pt-[16px]">
          <OutlineButton onClick={onClose} className="h-[36px]">
            Cancel
          </OutlineButton>
          <button
            type="button"
            onClick={() => {
              deleteAssociation(association.id);
              showToast("Association deleted.");
              onClose();
            }}
            className="motion-tap flex h-[36px] shrink-0 items-center gap-[7px] rounded-[8px] bg-pg-danger px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-white hover:brightness-110 active:scale-[0.97]"
          >
            Delete
          </button>
        </div>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">
        Are you sure you want to delete &ldquo;{name}&rdquo;? Records linked with it will no
        longer be associated. This action can&rsquo;t be undone.
      </p>
    </Modal>
  );
}
