"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  EllipsisVertical,
  ExternalLink,
  GripVertical,
  Info,
  Pencil,
  Plus,
  Search,
  SquarePen,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { Select, TextInput } from "@/components/page/form-controls";
import { TableCard } from "@/components/page/table-card";
import { showToast } from "@/components/page/toast";
import { ViewBar } from "@/components/page/view-bar";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import {
  STAGE_COLORS,
  formatUpdated,
  makeStage,
  newId,
  upsertPipeline,
  usePipelines,
  type PipelineConfig,
  type PipelineStage,
  type SmartTag,
} from "./pipelines-store";
import {
  ColorModeCard,
  ProbabilityInput,
  ProbabilityToggleCard,
  ReportVisibility,
  StageColorSwatch,
} from "./pipeline-settings-parts";
import { PREBUILT_TAGS, SmartTagDrawer } from "./smart-tag-drawer";

/**
 * One pipeline's settings: its stages and its smart tags.
 *
 * No Save button. Every edit is written to the store the moment it happens,
 * and a single "Changes saved" toast follows a beat after the last one — so a
 * run of keystrokes in a probability field confirms once, not per digit.
 */
export function PipelineDetail({
  pipelineId,
  onBack,
}: {
  pipelineId: string;
  onBack: () => void;
}) {
  const pipelines = usePipelines();
  const pipeline = pipelines.find((p) => p.id === pipelineId);
  const [tab, setTab] = React.useState<"stages" | "tags">("stages");

  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const commit = React.useCallback(
    (next: PipelineConfig, toast: string | null = "Changes saved") => {
      upsertPipeline(next);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (toast) {
        toastTimer.current = setTimeout(() => showToast(toast), 600);
      }
    },
    [],
  );

  if (!pipeline) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-[12px] p-[32px] text-center">
        <p className="text-[14px] leading-[20px] text-pg-muted">
          This pipeline no longer exists.
        </p>
        <OutlineButton onClick={onBack}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to pipelines
        </OutlineButton>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-[16px] overflow-y-auto">
      <DetailHeader pipeline={pipeline} onBack={onBack} commit={commit} />

      <ViewBar
        label="Pipeline settings"
        views={[
          { id: "stages", label: "Stages", count: String(pipeline.stages.length) },
          {
            id: "tags",
            label: "Smart tags",
            count: pipeline.smartTags.length ? String(pipeline.smartTags.length) : undefined,
          },
        ]}
        activeId={tab}
        onSelect={(id) => setTab(id as "stages" | "tags")}
      />

      {tab === "stages" ? (
        <StagesTab pipeline={pipeline} commit={commit} />
      ) : (
        <SmartTagsTab pipeline={pipeline} commit={commit} />
      )}
    </div>
  );
}

type Commit = (next: PipelineConfig, toast?: string | null) => void;

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function DetailHeader({
  pipeline,
  onBack,
  commit,
}: {
  pipeline: PipelineConfig;
  onBack: () => void;
  commit: Commit;
}) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(pipeline.name);

  const save = () => {
    const name = draft.trim();
    setEditing(false);
    if (name && name !== pipeline.name) commit({ ...pipeline, name });
  };

  return (
    <div className="flex min-w-0 items-center gap-[8px]">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back to pipelines"
        className="motion-tap flex size-[32px] shrink-0 items-center justify-center rounded-[8px] text-pg-text-strong hover:bg-pg"
      >
        <ArrowLeft size={18} aria-hidden="true" />
      </button>

      {editing ? (
        <TextInput
          autoFocus
          aria-label="Pipeline name"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.currentTarget.select()}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") {
              e.stopPropagation();
              setEditing(false);
            }
          }}
          className="max-w-[360px] text-[16px] font-semibold"
        />
      ) : (
        <>
          <h1 className="min-w-0 truncate text-[20px] leading-[28px] font-semibold tracking-[-0.2px] text-brand">
            {pipeline.name}
          </h1>
          <button
            type="button"
            aria-label="Rename pipeline"
            onClick={() => {
              setDraft(pipeline.name);
              setEditing(true);
            }}
            className="motion-tap flex size-[28px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading"
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Shared table bits                                                   */
/* ------------------------------------------------------------------ */

const TH =
  "h-[40px] border-b border-pg-head-border bg-pg px-[12px] text-left text-[13px] leading-[18px] font-medium whitespace-nowrap text-pg-muted";
const TD = "border-b border-pg-row-border px-[12px] py-[10px] align-middle";

function HeadInfo({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="inline-flex items-center gap-[4px]">
      {label}
      <span title={hint} aria-label={hint} className="inline-flex cursor-help">
        <Info size={13} aria-hidden="true" className="text-pg-faint" />
      </span>
    </span>
  );
}

interface MenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

/**
 * A row's kebab, with its menu portalled to the body.
 *
 * Portalled because the table card scrolls its own body and would clip a
 * menu opened on the last rows; positioned from the trigger's rect and
 * re-stamped with the page theme since the portal leaves the subtree that
 * carries it.
 */
function RowMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const { effective } = useTheme();
  const btnRef = React.useRef<HTMLButtonElement>(null);
  const [pos, setPos] = React.useState<{ top: number; right: number } | null>(null);

  React.useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    document.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [pos]);

  const open = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const menuH = items.length * 36 + 12;
    const below = r.bottom + 4 + menuH <= window.innerHeight;
    setPos({
      top: below ? r.bottom + 4 : Math.max(8, r.top - 4 - menuH),
      right: window.innerWidth - r.right,
    });
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={!!pos}
        onClick={() => (pos ? setPos(null) : open())}
        className={cn(
          "motion-tap flex size-[28px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading",
          pos && "bg-pg text-pg-heading",
        )}
      >
        <EllipsisVertical size={16} aria-hidden="true" />
      </button>
      {pos && typeof document !== "undefined"
        ? createPortal(
            <div data-page-theme={effective.appTheme}>
              <button
                type="button"
                aria-label="Close menu"
                tabIndex={-1}
                onClick={() => setPos(null)}
                className="fixed inset-0 z-[90] cursor-default"
              />
              <div
                role="menu"
                aria-label={label}
                style={{ position: "fixed", top: pos.top, right: pos.right }}
                className="motion-panel-in z-[91] w-[184px] rounded-[10px] bg-pg-surface p-[6px] shadow-[0_16px_32px_-8px_rgba(15,23,42,0.18),0_4px_8px_-4px_rgba(15,23,42,0.12),inset_0_0_0_1px_var(--pg-border)]"
              >
                {items.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      setPos(null);
                      item.onClick();
                    }}
                    className={cn(
                      "motion-tap flex h-[36px] w-full items-center gap-[10px] rounded-[7px] px-[10px] text-left text-[13px] leading-[18px]",
                      item.disabled
                        ? "cursor-not-allowed text-pg-disabled"
                        : item.danger
                          ? "text-pg-danger hover:bg-pg"
                          : "text-pg-text hover:bg-pg",
                    )}
                  >
                    <item.icon
                      size={15}
                      aria-hidden="true"
                      className={cn(
                        "shrink-0",
                        item.disabled
                          ? "text-pg-disabled"
                          : item.danger
                            ? "text-pg-danger"
                            : "text-pg-muted",
                      )}
                    />
                    {item.label}
                  </button>
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function DangerButton({ children, ...rest }: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      className="motion-tap flex h-[34px] shrink-0 items-center gap-[7px] rounded-[8px] bg-[var(--pg-danger)] px-[16px] text-[13px] leading-[normal] font-semibold whitespace-nowrap text-white hover:brightness-110 active:scale-[0.97]"
      {...rest}
    >
      {children}
    </button>
  );
}

function ConfirmDelete({
  title,
  body,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal
      title={title}
      width={440}
      onClose={onCancel}
      footer={
        <>
          <OutlineButton onClick={onCancel}>Cancel</OutlineButton>
          <DangerButton onClick={onConfirm}>Delete</DangerButton>
        </>
      }
    >
      <p className="text-[14px] leading-[20px] text-pg-text">{body}</p>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Stages                                                              */
/* ------------------------------------------------------------------ */

function StagesTab({ pipeline, commit }: { pipeline: PipelineConfig; commit: Commit }) {
  const [query, setQuery] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [overId, setOverId] = React.useState<string | null>(null);
  // Only the grip arms a row for dragging, so text in the row's inputs can
  // still be selected with the pointer.
  const [armedId, setArmedId] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<PipelineStage | null>(null);

  const stages = pipeline.stages;
  const q = query.trim().toLowerCase();
  const shown = q ? stages.filter((s) => s.name.toLowerCase().includes(q)) : stages;
  const showColor = pipeline.colorMode !== "none";

  const setStages = (next: PipelineStage[]) => commit({ ...pipeline, stages: next });
  const patchStage = (id: string, patch: Partial<PipelineStage>) =>
    setStages(stages.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const move = (id: string, to: number) => {
    const from = stages.findIndex((s) => s.id === id);
    if (from < 0 || to < 0 || to >= stages.length || from === to) return;
    const next = [...stages];
    const [row] = next.splice(from, 1);
    next.splice(to, 0, row!);
    setStages(next);
  };

  const startEdit = (s: PipelineStage) => {
    setEditingId(s.id);
    setDraft(s.name);
  };
  const saveEdit = () => {
    if (!editingId) return;
    const name = draft.trim();
    const current = stages.find((s) => s.id === editingId);
    setEditingId(null);
    if (current && name && name !== current.name) patchStage(editingId, { name });
  };

  const addStage = () => {
    const stage = makeStage("New stage", 0, STAGE_COLORS[stages.length % STAGE_COLORS.length]);
    setQuery("");
    setStages([...stages, stage]);
    setEditingId(stage.id);
    setDraft(stage.name);
  };

  return (
    <div className="flex flex-col gap-[16px]">
      <ProbabilityToggleCard
        value={pipeline.opportunityProbability}
        onChange={(v) => commit({ ...pipeline, opportunityProbability: v })}
      />
      <ColorModeCard
        value={pipeline.colorMode}
        onChange={(v) => commit({ ...pipeline, colorMode: v })}
      />

      <TableCard className="flex-none">
        <div className="flex items-center justify-between gap-[12px] px-[16px] py-[12px]">
          <div className="relative w-[240px]">
            <Search
              size={15}
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-[11px] -translate-y-1/2 text-pg-faint"
            />
            <TextInput
              aria-label="Search stages"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-[32px]"
            />
          </div>
          <PrimaryButton onClick={addStage}>
            <Plus size={15} aria-hidden="true" />
            Add stage
          </PrimaryButton>
        </div>

        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th className={cn(TH, "w-[40px] px-0")}>
                <span className="sr-only">Reorder</span>
              </th>
              <th className={TH}>Stage name</th>
              {showColor ? <th className={cn(TH, "w-[120px]")}>Stage color</th> : null}
              <th className={cn(TH, "w-[180px]")}>
                <HeadInfo
                  label="Probability (%)"
                  hint="How likely an opportunity in this stage is to close. Used to weight forecasts."
                />
              </th>
              <th className={cn(TH, "w-[220px]")}>
                <HeadInfo
                  label="Show in reports"
                  hint="Choose which report charts include this stage."
                />
              </th>
              <th className={cn(TH, "w-[64px] text-right")}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((stage) => {
              const index = stages.findIndex((s) => s.id === stage.id);
              const isEditing = editingId === stage.id;
              return (
                <tr
                  key={stage.id}
                  draggable={armedId === stage.id && !isEditing}
                  onDragStart={(e) => {
                    setDragId(stage.id);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", stage.id);
                  }}
                  onDragOver={(e) => {
                    if (!dragId) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    if (overId !== stage.id) setOverId(stage.id);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragId) move(dragId, index);
                    setDragId(null);
                    setOverId(null);
                    setArmedId(null);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                    setArmedId(null);
                  }}
                  className={cn(
                    "group bg-pg-surface",
                    dragId === stage.id && "opacity-50",
                    overId === stage.id && dragId !== stage.id && "bg-brand-soft",
                  )}
                >
                  <td className={cn(TD, "w-[40px] px-0 text-center")}>
                    <span
                      aria-hidden="true"
                      onPointerDown={() => setArmedId(stage.id)}
                      onPointerUp={() => setArmedId(null)}
                      className="inline-flex cursor-grab text-pg-faint group-hover:text-pg-muted active:cursor-grabbing"
                    >
                      <GripVertical size={16} />
                    </span>
                  </td>
                  <td className={TD}>
                    {isEditing ? (
                      <TextInput
                        autoFocus
                        aria-label="Stage name"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onFocus={(e) => e.currentTarget.select()}
                        onBlur={saveEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") {
                            e.stopPropagation();
                            setEditingId(null);
                          }
                        }}
                        className="max-w-[320px]"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(stage)}
                        title="Click to rename"
                        className="motion-tap -mx-[8px] max-w-full truncate rounded-[6px] px-[8px] py-[4px] text-left text-[14px] leading-[20px] text-pg-text-strong hover:bg-pg"
                      >
                        {stage.name}
                      </button>
                    )}
                  </td>
                  {showColor ? (
                    <td className={TD}>
                      <StageColorSwatch
                        value={stage.color}
                        onChange={(c) => patchStage(stage.id, { color: c })}
                      />
                    </td>
                  ) : null}
                  <td className={TD}>
                    <ProbabilityInput
                      value={stage.probability}
                      disabled={!pipeline.opportunityProbability}
                      onChange={(n) => patchStage(stage.id, { probability: n })}
                    />
                  </td>
                  <td className={TD}>
                    <ReportVisibility
                      funnel={stage.showInFunnel}
                      pie={stage.showInPie}
                      onChange={(v) =>
                        patchStage(stage.id, { showInFunnel: v.funnel, showInPie: v.pie })
                      }
                    />
                  </td>
                  <td className={cn(TD, "text-right")}>
                    <div className="flex justify-end">
                      <RowMenu
                        label={`Actions for ${stage.name}`}
                        items={[
                          { label: "Rename", icon: SquarePen, onClick: () => startEdit(stage) },
                          {
                            label: "Move up",
                            icon: ArrowUp,
                            disabled: index === 0,
                            onClick: () => move(stage.id, index - 1),
                          },
                          {
                            label: "Move down",
                            icon: ArrowDown,
                            disabled: index === stages.length - 1,
                            onClick: () => move(stage.id, index + 1),
                          },
                          {
                            label: "Delete",
                            icon: Trash2,
                            danger: true,
                            disabled: stages.length <= 1,
                            onClick: () => setConfirm(stage),
                          },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
            {shown.length === 0 ? (
              <tr>
                <td
                  colSpan={showColor ? 6 : 5}
                  className="px-[16px] py-[32px] text-center text-[14px] leading-[20px] text-pg-muted"
                >
                  {q ? `No stages match “${query.trim()}”.` : "No stages yet."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </TableCard>

      {confirm ? (
        <ConfirmDelete
          title={`Delete stage “${confirm.name}”?`}
          body="Opportunities in this stage move to the first stage."
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            setStages(stages.filter((s) => s.id !== confirm.id));
            setConfirm(null);
          }}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Smart tags                                                          */
/* ------------------------------------------------------------------ */

type DrawerState = { initial?: SmartTag; prebuiltId?: string } | null;

function TagPill({ name, color }: { name: string; color: string }) {
  return (
    <span
      style={{ color, backgroundColor: `${color}1f`, boxShadow: `inset 0 0 0 1px ${color}40` }}
      className="inline-flex h-[22px] max-w-full items-center rounded-full px-[8px] text-[12px] leading-[16px] font-medium whitespace-nowrap"
    >
      <span className="truncate">{name}</span>
    </span>
  );
}

function SmartTagsTab({ pipeline, commit }: { pipeline: PipelineConfig; commit: Commit }) {
  const [drawer, setDrawer] = React.useState<DrawerState>(null);
  const [confirm, setConfirm] = React.useState<SmartTag | null>(null);
  const tags = pipeline.smartTags;

  const saveTag = (t: SmartTag) => {
    const stamped = { ...t, modifiedAt: new Date().toISOString() };
    const exists = tags.some((x) => x.id === t.id);
    commit(
      {
        ...pipeline,
        smartTags: exists
          ? tags.map((x) => (x.id === t.id ? stamped : x))
          : [...tags, stamped],
      },
      "Smart tag saved",
    );
    setDrawer(null);
  };

  const duplicate = (t: SmartTag) => {
    const copy: SmartTag = {
      ...t,
      id: newId("tag"),
      name: `${t.name} (copy)`,
      groups: t.groups.map((g) => g.map((r) => ({ ...r }))),
      modifiedAt: new Date().toISOString(),
    };
    const i = tags.findIndex((x) => x.id === t.id);
    const next = [...tags];
    next.splice(i + 1, 0, copy);
    commit({ ...pipeline, smartTags: next });
  };

  return (
    <div className="flex flex-col gap-[16px]">
      {tags.length === 0 ? (
        <SmartTagsEmpty onAdd={(prebuiltId) => setDrawer({ prebuiltId })} />
      ) : (
        <TableCard className="flex-none">
          <div className="flex items-center justify-between gap-[12px] px-[16px] py-[12px]">
            <p className="text-[13px] leading-[18px] text-pg-muted">
              {tags.length} {tags.length === 1 ? "smart tag" : "smart tags"}
            </p>
            <PrimaryButton onClick={() => setDrawer({})}>
              <Plus size={15} aria-hidden="true" />
              Add smart tag
            </PrimaryButton>
          </div>
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className={cn(TH, "pl-[16px]")}>Label name</th>
                <th className={cn(TH, "w-[180px]")}>Color</th>
                <th className={TH}>Description</th>
                <th className={cn(TH, "w-[180px]")}>Last modified</th>
                <th className={cn(TH, "w-[64px]")}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tags.map((t) => {
                const when = formatUpdated(t.modifiedAt);
                return (
                  <tr key={t.id} className="bg-pg-surface">
                    <td className={cn(TD, "pl-[16px]")}>
                      <button
                        type="button"
                        onClick={() => setDrawer({ initial: t })}
                        className="max-w-full truncate text-left text-[14px] leading-[20px] font-medium text-pg-text-strong hover:text-brand"
                      >
                        {t.name}
                      </button>
                    </td>
                    <td className={TD}>
                      <TagPill name={t.name} color={t.color} />
                    </td>
                    <td className={cn(TD, "max-w-[360px]")}>
                      <p className="line-clamp-2 text-[13px] leading-[18px] text-pg-muted">
                        {t.description || "—"}
                      </p>
                    </td>
                    <td className={TD}>
                      <p className="text-[14px] leading-[20px] text-pg-text">{when.date}</p>
                      <p className="text-[13px] leading-[18px] text-pg-muted">{when.time}</p>
                    </td>
                    <td className={TD}>
                      <div className="flex justify-end">
                        <RowMenu
                          label={`Actions for ${t.name}`}
                          items={[
                            { label: "Edit", icon: SquarePen, onClick: () => setDrawer({ initial: t }) },
                            { label: "Duplicate", icon: Copy, onClick: () => duplicate(t) },
                            {
                              label: "Delete",
                              icon: Trash2,
                              danger: true,
                              onClick: () => setConfirm(t),
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      )}

      {drawer ? (
        <SmartTagDrawer
          pipelineName={pipeline.name}
          initial={drawer.initial}
          prebuiltId={drawer.prebuiltId}
          onClose={() => setDrawer(null)}
          onSave={saveTag}
        />
      ) : null}

      {confirm ? (
        <ConfirmDelete
          title={`Delete smart tag “${confirm.name}”?`}
          body="Opportunities lose this tag. This can't be undone."
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            commit({ ...pipeline, smartTags: tags.filter((x) => x.id !== confirm.id) });
            setConfirm(null);
          }}
        />
      ) : null}
    </div>
  );
}

function SmartTagsEmpty({ onAdd }: { onAdd: (prebuiltId?: string) => void }) {
  const [prebuilt, setPrebuilt] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col items-center rounded-[12px] bg-pg-surface px-[24px] py-[48px] text-center shadow-[inset_0_0_0_1px_var(--pg-card-border)]">
      <EmptyIllustration />
      <h2 className="mt-[20px] text-[16px] leading-[22px] font-semibold text-pg-heading">
        No smart tags yet
      </h2>
      <p className="mt-[6px] max-w-[440px] text-[14px] leading-[20px] text-pg-muted">
        Add rule-based tags to help you prioritize faster and take action at the right
        time — without manual effort.
      </p>
      <div className="mt-[20px] flex flex-wrap items-center justify-center gap-[12px]">
        <Select
          aria-label="Select prebuilt tags"
          placeholder="Select prebuilt tags"
          value={prebuilt}
          options={PREBUILT_TAGS.map((t: { id: string; name: string }) => ({
            value: t.id,
            label: t.name,
          }))}
          onChange={setPrebuilt}
          className="w-[240px] text-left"
        />
        <PrimaryButton className="h-[36px]" onClick={() => onAdd(prebuilt ?? undefined)}>
          <Plus size={15} aria-hidden="true" />
          Add smart tag
        </PrimaryButton>
      </div>
      <button
        type="button"
        onClick={() => showToast("Help article opens in a new tab")}
        className="mt-[16px] inline-flex items-center gap-[6px] text-[14px] leading-[20px] font-medium text-brand hover:underline"
      >
        Read how smart tagging boosts pipeline focus
        <ExternalLink size={14} aria-hidden="true" />
      </button>
    </div>
  );
}

/** A tag board in miniature: a menu line and three dots over a grid, two cells lit. */
function EmptyIllustration() {
  const cols = 5;
  const rows = 3;
  const lit = new Set(["1-1", "3-2"]);
  return (
    <svg
      width="168"
      height="112"
      viewBox="0 0 168 112"
      fill="none"
      aria-hidden="true"
      className="text-pg-border"
    >
      <rect x="0.5" y="0.5" width="167" height="111" rx="10" className="fill-pg stroke-pg-border" />
      <circle cx="14" cy="14" r="3" className="fill-pg-faint" />
      <circle cx="24" cy="14" r="3" className="fill-pg-faint" />
      <circle cx="34" cy="14" r="3" className="fill-pg-faint" />
      <rect x="48" y="11" width="56" height="6" rx="3" fill="currentColor" />
      <rect x="140" y="11" width="16" height="6" rx="3" fill="currentColor" />
      {Array.from({ length: rows }).map((_, r) =>
        Array.from({ length: cols }).map((__, c) => {
          const on = lit.has(`${c}-${r}`);
          return (
            <rect
              key={`${c}-${r}`}
              x={12 + c * 30}
              y={30 + r * 26}
              width="24"
              height="20"
              rx="4"
              className={on ? "fill-brand" : "fill-pg-surface stroke-pg-border"}
            />
          );
        }),
      )}
    </svg>
  );
}
