"use client";

import * as React from "react";
import { GripVertical, Info, Plus, Trash2 } from "lucide-react";
import { Modal } from "@/components/page/modal";
import { TextInput } from "@/components/page/form-controls";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { UnsavedChangesModal } from "@/components/opportunities/opportunity-delete-modal";
import { cn } from "@/lib/utils";
import {
  makeStage,
  newId,
  STAGE_COLORS,
  type PipelineConfig,
  type PipelineStage,
} from "./pipelines-store";
import {
  ColorModeCard,
  HoverTip,
  ProbabilityInput,
  ProbabilityToggleCard,
  ReportVisibility,
  StageColorSwatch,
} from "./pipeline-settings-parts";

/**
 * Create, duplicate or edit a pipeline — name, probability source, colour
 * mode and the stage table — in one tall modal.
 *
 * The draft is local; nothing reaches the store until the caller's onSave.
 * Closing a dirty draft by any route (×, Escape, Cancel, scrim) asks first.
 */

type Mode = "create" | "duplicate" | "edit";

interface Draft {
  name: string;
  opportunityProbability: boolean;
  colorMode: PipelineConfig["colorMode"];
  stages: PipelineStage[];
}

const TITLES: Record<Mode, string> = {
  create: "Create pipeline",
  duplicate: "Duplicate pipeline",
  edit: "Edit pipeline",
};

const SUBMIT: Record<Mode, string> = {
  create: "Create",
  duplicate: "Duplicate",
  edit: "Save changes",
};

const BTN = "h-[36px] text-[14px]";

function initialDraft(mode: Mode, source?: PipelineConfig): Draft {
  if (mode === "create" || !source) {
    return {
      name: "",
      opportunityProbability: false,
      colorMode: "none",
      stages: [
        makeStage("New lead", 20, STAGE_COLORS[0]),
        makeStage("Contacted", 40, STAGE_COLORS[1]),
        makeStage("Proposal sent", 60, STAGE_COLORS[2]),
        makeStage("Closed", 80, STAGE_COLORS[3]),
      ],
    };
  }
  return {
    name: mode === "duplicate" ? `${source.name} (copy)` : source.name,
    opportunityProbability: source.opportunityProbability,
    colorMode: source.colorMode,
    stages: source.stages.map((s) => ({ ...s })),
  };
}

function ColumnHead({ children, tip }: { children: React.ReactNode; tip?: string }) {
  return (
    <span className="inline-flex items-center gap-[4px] text-[13px] leading-[18px] font-medium text-pg-muted">
      {children}
      {tip ? (
        <HoverTip content={tip}>
          <span tabIndex={0} aria-label={tip} className="inline-flex text-pg-faint">
            <Info size={14} aria-hidden="true" />
          </span>
        </HoverTip>
      ) : null}
    </span>
  );
}

export function PipelineEditorModal({
  mode,
  source,
  onClose,
  onSave,
}: {
  mode: "create" | "duplicate" | "edit";
  source?: PipelineConfig;
  onClose: () => void;
  onSave: (p: PipelineConfig) => void;
}) {
  const [initial] = React.useState(() => initialDraft(mode, source));
  const [draft, setDraft] = React.useState<Draft>(initial);
  const [nameTouched, setNameTouched] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [armedId, setArmedId] = React.useState<string | null>(null);

  const dirty = React.useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial],
  );
  const nameEmpty = draft.name.trim() === "";
  const stagesNamed = draft.stages.every((s) => s.name.trim() !== "");
  const canSubmit = !nameEmpty && stagesNamed && (mode !== "edit" || dirty);
  const showColor = draft.colorMode !== "none";

  const requestClose = React.useCallback(() => {
    if (confirmOpen) return;
    if (dirty) setConfirmOpen(true);
    else onClose();
  }, [confirmOpen, dirty, onClose]);

  const patchStage = (id: string, patch: Partial<PipelineStage>) =>
    setDraft((d) => ({
      ...d,
      stages: d.stages.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));

  const addStage = () =>
    setDraft((d) => ({
      ...d,
      stages: [
        ...d.stages,
        makeStage("", 0, STAGE_COLORS[d.stages.length % STAGE_COLORS.length]),
      ],
    }));

  const removeStage = (id: string) =>
    setDraft((d) =>
      d.stages.length <= 1 ? d : { ...d, stages: d.stages.filter((s) => s.id !== id) },
    );

  const moveStage = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setDraft((d) => {
      const from = d.stages.findIndex((s) => s.id === fromId);
      const to = d.stages.findIndex((s) => s.id === toId);
      if (from < 0 || to < 0) return d;
      const next = [...d.stages];
      const [row] = next.splice(from, 1);
      next.splice(to, 0, row!);
      return { ...d, stages: next };
    });
  };

  const submit = () => {
    setNameTouched(true);
    if (!canSubmit) return;
    const name = draft.name.trim();
    const stages = draft.stages.map((s) => ({ ...s, name: s.name.trim() }));
    const now = new Date().toISOString();

    let config: PipelineConfig;
    if (mode === "edit" && source) {
      config = { ...source, ...draft, name, stages, updatedAt: now };
    } else {
      config = {
        id: newId("pl"),
        name,
        opportunityProbability: draft.opportunityProbability,
        colorMode: draft.colorMode,
        stages: stages.map((s) => ({ ...s, id: newId("st") })),
        smartTags:
          mode === "duplicate" && source
            ? source.smartTags.map((t) => ({
                ...t,
                id: newId("tag"),
                groups: t.groups.map((g) => g.map((r) => ({ ...r }))),
              }))
            : [],
        permissions:
          mode === "duplicate" && source
            ? { ...source.permissions, userIds: [...source.permissions.userIds] }
            : { mode: "all", level: "view", userIds: [] },
        updatedAt: now,
      };
    }
    onSave(config);
    onClose();
  };

  const gridCols = showColor
    ? "grid-cols-[minmax(0,1fr)_96px_132px_120px_36px]"
    : "grid-cols-[minmax(0,1fr)_132px_120px_36px]";

  return (
    <>
      <Modal
        width={860}
        title={TITLES[mode]}
        onClose={requestClose}
        bodyClassName="gap-[16px]"
        footer={
          <>
            <OutlineButton onClick={requestClose} className={BTN}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              onClick={submit}
              disabled={!canSubmit}
              className={cn(BTN, "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none disabled:hover:brightness-100")}
            >
              {SUBMIT[mode]}
            </PrimaryButton>
          </>
        }
      >
        <form
          className="flex min-h-[min(640px,calc(100dvh-200px))] flex-col gap-[16px]"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {mode === "duplicate" ? (
            <div className="-mt-[4px] flex flex-col text-[13px] leading-[18px] text-pg-muted">
              <span>Stages, permissions, colored smart tags, and chart visibility will be copied.</span>
              <span>Records, automations, reports, and custom fields won&apos;t be copied.</span>
            </div>
          ) : null}

          <div className="flex flex-col gap-[4px]">
            <label
              htmlFor="pipeline-name"
              className="text-[14px] leading-[20px] font-medium text-pg-text"
            >
              Pipeline name<span className="text-[var(--hr-error-500)]">*</span>
            </label>
            <TextInput
              id="pipeline-name"
              autoFocus
              placeholder="Marketing pipeline"
              value={draft.name}
              aria-invalid={nameTouched && nameEmpty}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              onBlur={() => setNameTouched(true)}
              className={cn(
                nameTouched &&
                  nameEmpty &&
                  "shadow-[inset_0_0_0_1px_var(--hr-error-500)] focus:shadow-[inset_0_0_0_1px_var(--hr-error-500),0_0_0_3px_color-mix(in_oklab,var(--hr-error-500)_18%,transparent)]",
              )}
            />
            {nameTouched && nameEmpty ? (
              <span className="text-[13px] leading-[18px] text-[var(--hr-error-500)]">
                Enter a pipeline name
              </span>
            ) : (
              <span className="text-[13px] leading-[18px] text-pg-muted">
                Use a unique, descriptive name so you can find this pipeline later
              </span>
            )}
          </div>

          <ProbabilityToggleCard
            value={draft.opportunityProbability}
            onChange={(v) => setDraft((d) => ({ ...d, opportunityProbability: v }))}
          />
          <ColorModeCard
            value={draft.colorMode}
            onChange={(v) => setDraft((d) => ({ ...d, colorMode: v }))}
          />

          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] leading-[20px] font-semibold text-pg-heading">
                Pipeline stages ({draft.stages.length})
              </h3>
              <button
                type="button"
                onClick={addStage}
                className="motion-tap inline-flex items-center gap-[4px] rounded-[6px] px-[4px] text-[14px] leading-[20px] font-medium text-brand hover:underline"
              >
                <Plus size={16} aria-hidden="true" />
                Add stage
              </button>
            </div>

            <div className="min-h-[220px] overflow-hidden rounded-[8px] shadow-[inset_0_0_0_1px_var(--pg-border)]">
              <div
                className={cn(
                  "grid items-center gap-[12px] border-b border-pg-border bg-pg py-[8px] pr-[12px] pl-[40px]",
                  gridCols,
                )}
              >
                <ColumnHead>Stage name</ColumnHead>
                {showColor ? <ColumnHead>Stage color</ColumnHead> : null}
                <ColumnHead tip="Choose which report charts include this stage">
                  Show in reports
                </ColumnHead>
                <ColumnHead tip="The likelihood that an opportunity in this stage closes as won">
                  Probability (%)
                </ColumnHead>
                <span aria-hidden="true" />
              </div>

              <ul>
                {draft.stages.map((stage) => (
                  <li
                    key={stage.id}
                    draggable={armedId === stage.id}
                    onDragStart={(e) => {
                      setDragId(stage.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", stage.id);
                    }}
                    onDragOver={(e) => {
                      if (!dragId) return;
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                      moveStage(dragId, stage.id);
                    }}
                    onDrop={(e) => e.preventDefault()}
                    onDragEnd={() => {
                      setDragId(null);
                      setArmedId(null);
                    }}
                    className={cn(
                      "flex items-center border-b border-pg-row-border py-[8px] pr-[12px] last:border-b-0",
                      dragId === stage.id && "opacity-50",
                    )}
                  >
                    <span
                      aria-label="Drag to reorder"
                      onMouseDown={() => setArmedId(stage.id)}
                      onMouseUp={() => setArmedId(null)}
                      className="flex w-[40px] shrink-0 cursor-grab items-center justify-center text-pg-faint hover:text-pg-muted active:cursor-grabbing"
                    >
                      <GripVertical size={16} aria-hidden="true" />
                    </span>
                    <div className={cn("grid min-w-0 flex-1 items-center gap-[12px]", gridCols)}>
                      <div className="relative flex min-w-0 items-center">
                        {showColor ? (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute left-[12px] size-[8px] rounded-full"
                            style={{ background: stage.color }}
                          />
                        ) : null}
                        <TextInput
                          aria-label="Stage name"
                          placeholder="Stage name"
                          value={stage.name}
                          onChange={(e) => patchStage(stage.id, { name: e.target.value })}
                          className={cn(showColor && "pl-[28px]")}
                        />
                      </div>
                      {showColor ? (
                        <StageColorSwatch
                          value={stage.color}
                          onChange={(c) => patchStage(stage.id, { color: c })}
                        />
                      ) : null}
                      <ReportVisibility
                        funnel={stage.showInFunnel}
                        pie={stage.showInPie}
                        onChange={(v) =>
                          patchStage(stage.id, { showInFunnel: v.funnel, showInPie: v.pie })
                        }
                      />
                      {draft.opportunityProbability ? (
                        <HoverTip content="Probability comes from each opportunity while opportunity-level probability is on">
                          <ProbabilityInput
                            value={stage.probability}
                            onChange={(n) => patchStage(stage.id, { probability: n })}
                            disabled
                          />
                        </HoverTip>
                      ) : (
                        <ProbabilityInput
                          value={stage.probability}
                          onChange={(n) => patchStage(stage.id, { probability: n })}
                        />
                      )}
                      <button
                        type="button"
                        aria-label="Delete stage"
                        disabled={draft.stages.length <= 1}
                        onClick={() => removeStage(stage.id)}
                        className="motion-tap flex size-[36px] items-center justify-center rounded-[8px] text-pg-muted hover:bg-pg hover:text-[var(--hr-error-500)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-pg-muted"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <button type="submit" hidden aria-hidden="true" tabIndex={-1} />
        </form>
      </Modal>

      {confirmOpen ? (
        <UnsavedChangesModal
          onKeepEditing={() => setConfirmOpen(false)}
          onDiscard={() => {
            setConfirmOpen(false);
            onClose();
          }}
        />
      ) : null}
    </>
  );
}
