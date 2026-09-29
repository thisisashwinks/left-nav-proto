"use client";

import * as React from "react";
import {
  ArrowLeft,
  Columns2,
  Columns3,
  Folder,
  Info,
  Lock,
  Minus,
  Pencil,
  Plus,
  Redo2,
  RotateCcw,
  Undo2,
  User,
  X,
} from "lucide-react";
import { Modal } from "@/components/page/modal";
import { OutlineButton, PrimaryButton } from "@/components/page/page-header";
import { showToast } from "@/components/page/toast";
import { cn } from "@/lib/utils";
import {
  MODULES,
  defaultLayout,
  saveViewLayout,
  useDetailViews,
  type FieldFolder,
  type ModuleId,
  type ViewLayout,
} from "./object-settings-store";
import { ViewNameModal } from "./view-modals";
import { EditCardDrawer, EditTabsDrawer } from "./view-builder-drawers";
import { ViewBuilderTour, type TourStep } from "./view-builder-tour";
import {
  AddMenu,
  CARD,
  Grip,
  ICON_BUTTON,
  MODULE_ICON,
  Segmented,
  moduleLabel,
  type AddItem,
} from "./view-builder-parts";

/**
 * The detail-view builder — "Edit view" on a detail view card.
 *
 * Everything here edits a DRAFT of the view's layout. Each edit pushes a new
 * draft onto a history stack, so undo and redo walk real states rather than
 * replaying operations, and dirty is simply "the draft is not what the store
 * holds". Save commits the draft with saveViewLayout; Back with a dirty draft
 * asks before throwing it away.
 *
 * Modules live in exactly one place: the center panel, the right panel, or —
 * when on neither — the Actions tab of the Edit tabs card. That is what "each
 * module can appear only once on the page" means in practice, and it is why
 * removing a module from a panel is a move rather than a delete.
 */

type Zone = "center" | "right" | "actions";
type Drag = { kind: "module"; id: ModuleId } | { kind: "folder"; id: string } | null;

// Once per session, the way the product shows it on first open.
let tourSeen = false;

const same = (a: ViewLayout, b: ViewLayout) => JSON.stringify(a) === JSON.stringify(b);

/** Lift a module out of wherever it sits and drop it into a zone, before `before`. */
function placeModule(l: ViewLayout, id: ModuleId, to: Zone, before: ModuleId | null): ViewLayout {
  if (id === "conversations") return l;
  const center = l.center.filter((m) => m !== id);
  const right = l.right.filter((m) => m !== id);
  if (to !== "actions") {
    const list = to === "center" ? center : right;
    let at = before ? list.indexOf(before) : list.length;
    if (at < 0) at = list.length;
    // Conversations holds the first slot; nothing lands in front of it.
    if (to === "center" && list[0] === "conversations") at = Math.max(at, 1);
    list.splice(at, 0, id);
  }
  return { ...l, center, right };
}

const folderStatus = (f: FieldFolder) =>
  f.total === 0
    ? "No fields"
    : f.shown === f.total
      ? "All fields shown"
      : `${f.shown.toLocaleString("en-US")} of ${f.total.toLocaleString("en-US")} fields`;

export function ViewBuilder({ viewId, onExit }: { viewId: string; onExit: () => void }) {
  const views = useDetailViews();
  const view = views.find((v) => v.id === viewId);
  const saved = view?.layout ?? defaultLayout();

  const [history, setHistory] = React.useState(() => ({
    stack: [structuredClone(saved)],
    at: 0,
  }));
  const draft = history.stack[history.at];
  const dirty = !same(draft, saved);
  const atDefault = same(draft, defaultLayout());
  const canUndo = history.at > 0;
  const canRedo = history.at < history.stack.length - 1;

  const commit = (next: ViewLayout) => {
    if (same(next, draft)) return;
    setHistory((h) => ({ stack: [...h.stack.slice(0, h.at + 1), next], at: h.at + 1 }));
  };
  const undo = () => setHistory((h) => ({ ...h, at: Math.max(0, h.at - 1) }));
  const redo = () => setHistory((h) => ({ ...h, at: Math.min(h.stack.length - 1, h.at + 1) }));

  // ⌘Z / ⇧⌘Z, except while typing somewhere.
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable='true']")) return;
      e.preventDefault();
      setHistory((h) => ({
        ...h,
        at: e.shiftKey ? Math.min(h.stack.length - 1, h.at + 1) : Math.max(0, h.at - 1),
      }));
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const [renaming, setRenaming] = React.useState(false);
  const [confirmLeave, setConfirmLeave] = React.useState(false);
  const [drawer, setDrawer] = React.useState<"card" | "tabs" | null>(null);
  const [segment, setSegment] = React.useState<"fields" | "actions">("fields");
  const [openFolder, setOpenFolder] = React.useState<string | null>(null);
  const [tourOpen, setTourOpen] = React.useState(() => !tourSeen);
  React.useEffect(() => {
    tourSeen = true;
  }, []);

  /*
   * The last 3-column split, so 2 → 3 puts modules back where they were. It
   * remembers membership only — which modules sat in the center — and keeps
   * whatever order the merged list was given in the meantime.
   */
  const [lastCenter, setLastCenter] = React.useState<ModuleId[] | null>(null);

  const setColumns = (columns: 3 | 2) => {
    if (columns === draft.columns) return;
    if (columns === 2) {
      setLastCenter(draft.center);
      commit({ ...draft, columns, center: [...draft.center, ...draft.right], right: [] });
      return;
    }
    const merged = draft.center.filter((m) => m !== "conversations");
    const inCenter = (m: ModuleId) => lastCenter?.includes(m) ?? false;
    commit({
      ...draft,
      columns,
      center: ["conversations", ...merged.filter(inCenter)],
      right: merged.filter((m) => !inCenter(m)),
    });
  };

  /* ─── Drag and drop ─── */

  const [drag, setDrag] = React.useState<Drag>(null);
  const [over, setOver] = React.useState<string | null>(null);
  const endDrag = () => {
    setDrag(null);
    setOver(null);
  };

  const dropModule = (to: Zone, before: ModuleId | null) => {
    if (drag?.kind === "module") commit(placeModule(draft, drag.id, to, before));
    endDrag();
  };

  const moveFolder = (id: string, to: number) => {
    const next = draft.folders.filter((f) => f.id !== id);
    const f = draft.folders.find((x) => x.id === id);
    if (!f) return;
    next.splice(Math.max(0, Math.min(to, next.length)), 0, f);
    commit({ ...draft, folders: next });
  };

  const setFolderShown = (id: string, shown: number) =>
    commit({
      ...draft,
      folders: draft.folders.map((f) =>
        f.id === id ? { ...f, shown: Math.max(0, Math.min(shown, f.total)) } : f,
      ),
    });

  /* ─── Derived lists ─── */

  const placed = new Set<ModuleId>([...draft.center, ...draft.right]);
  const unplaced = MODULES.map((m) => m.id).filter((m) => !placed.has(m));
  const item = (id: ModuleId, hint?: string): AddItem => ({
    id,
    label: moduleLabel(id),
    icon: MODULE_ICON[id],
    hint,
  });
  // The center can also pull a module across from the right panel.
  const centerAdds = [
    ...unplaced.map((m) => item(m)),
    ...(draft.columns === 3 ? draft.right.map((m) => item(m, "Right panel")) : []),
  ];

  /* ─── Tour anchors ─── */

  const cardRef = React.useRef<HTMLDivElement>(null);
  const tabsRef = React.useRef<HTMLDivElement>(null);
  const displayRef = React.useRef<HTMLDivElement>(null);
  const centerRef = React.useRef<HTMLDivElement>(null);
  const rightRef = React.useRef<HTMLDivElement>(null);
  const layoutRef = React.useRef<HTMLDivElement>(null);
  const saveRef = React.useRef<HTMLButtonElement>(null);

  const steps = React.useMemo<TourStep[]>(
    () => [
      {
        title: "Customize contact card",
        body: "Pick the fields and actions on the contact card, and select up to 2 custom fields to show. Tags highlight what matters most.",
        targets: [cardRef],
      },
      {
        title: "Edit tabs",
        body: "Show, hide, or reorder field folders, and add a module as its own tab between All fields and Actions.",
        targets: [tabsRef],
      },
      {
        title: "Display mode",
        body: "Choose whether users switch between modules with tabs or a dropdown.",
        targets: [displayRef],
      },
      {
        title: "Center panel",
        body: "Drag modules in from the Actions tab or the right panel. Conversations always stays in the center.",
        targets: [centerRef],
      },
      {
        title: "Right panel",
        body: "Reorder modules for quick access, or drag them into the center panel.",
        targets: [rightRef, centerRef],
      },
      {
        title: "Layout switch",
        body: "Switch between 3 columns and 2 columns. In 2 columns, every module shares one panel.",
        targets: [layoutRef],
      },
      {
        title: "Save your view",
        body: "Save to apply this layout to everyone on the view. Undo, redo, or reset anytime before you save.",
        targets: [saveRef],
      },
    ],
    [],
  );
  const closeTour = React.useCallback(() => setTourOpen(false), []);

  if (!view) return null;

  const save = () => {
    saveViewLayout(view.id, draft);
    showToast(`${view.name} saved`);
  };
  const back = () => (dirty ? setConfirmLeave(true) : onExit());

  /* ─── Module rows ─── */

  const moduleList = (zone: Exclude<Zone, "actions">, ids: ModuleId[]) => (
    <div
      onDragOver={(e) => {
        if (drag?.kind !== "module") return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (over !== `${zone}:end`) setOver(`${zone}:end`);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dropModule(zone, null);
      }}
      className="flex min-h-0 flex-1 flex-col gap-[10px] overflow-y-auto px-[16px] pb-[16px]"
    >
      {ids.map((id, i) => (
        <ModuleRow
          key={id}
          id={id}
          dragging={drag?.kind === "module" && drag.id === id}
          over={over === `${zone}:${id}` && !(drag?.kind === "module" && drag.id === id)}
          onDragStart={() => setDrag({ kind: "module", id })}
          onDragEnd={endDrag}
          onDragOver={() => {
            if (drag?.kind === "module" && over !== `${zone}:${id}`) setOver(`${zone}:${id}`);
          }}
          onDrop={() => dropModule(zone, id)}
          onMove={(d) => {
            const target = ids[i + d + (d > 0 ? 1 : 0)] ?? null;
            if (d < 0 && i + d < 0) return;
            commit(placeModule(draft, id, zone, target));
          }}
          onRemove={() => commit(placeModule(draft, id, "actions", null))}
        />
      ))}
      <div
        aria-hidden="true"
        className={cn(
          "min-h-[24px] flex-1 rounded-[8px]",
          over === `${zone}:end` && "shadow-[inset_0_2px_0_0_var(--brand)]",
        )}
      />
    </div>
  );

  const actionsModules = (
    <div
      onDragOver={(e) => {
        if (drag?.kind !== "module") return;
        e.preventDefault();
        if (over !== "actions") setOver("actions");
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dropModule("actions", null);
      }}
      className={cn(
        "flex min-h-[120px] flex-col gap-[10px] rounded-[8px]",
        over === "actions" && "bg-brand-soft shadow-[inset_0_0_0_1px_var(--brand)]",
      )}
    >
      {unplaced.length === 0 ? (
        <p className="px-[12px] py-[24px] text-center text-[13px] leading-[18px] text-pg-muted">
          Every module is on the page. Drag one here to move it to the Actions tab.
        </p>
      ) : (
        unplaced.map((id) => (
          <ModuleRow
            key={id}
            id={id}
            dragging={drag?.kind === "module" && drag.id === id}
            onDragStart={() => setDrag({ kind: "module", id })}
            onDragEnd={endDrag}
          />
        ))
      )}
    </div>
  );

  const threeCol = draft.columns === 3;

  return (
    <div className="flex h-full min-h-0 flex-col px-[var(--page-inset)]">
      {/* ─── Top bar ─── */}
      <div className="grid h-[52px] shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-[12px] border-b border-pg-head-border">
        <button
          type="button"
          onClick={back}
          className="flex h-[36px] w-fit items-center gap-[6px] rounded-[8px] px-[8px] text-[14px] leading-[20px] text-pg-heading motion-tap hover:bg-pg-surface"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back
        </button>

        <div className="flex min-w-0 items-center gap-[6px]">
          <h1 className="truncate text-[16px] leading-[22px] font-semibold text-pg-heading">{view.name}</h1>
          <button type="button" aria-label="Rename view" onClick={() => setRenaming(true)} className={ICON_BUTTON}>
            <Pencil size={15} aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center justify-end gap-[8px]">
          <button type="button" aria-label="Undo" title="Undo" disabled={!canUndo} onClick={undo} className={ICON_BUTTON}>
            <Undo2 size={16} aria-hidden="true" />
          </button>
          <button type="button" aria-label="Redo" title="Redo" disabled={!canRedo} onClick={redo} className={ICON_BUTTON}>
            <Redo2 size={16} aria-hidden="true" />
          </button>
          <span aria-hidden="true" className="mx-[4px] h-[16px] w-px bg-pg-border" />
          <div
            ref={layoutRef}
            role="radiogroup"
            aria-label="Layout"
            className="flex h-[32px] items-center gap-[2px] rounded-[8px] bg-pg p-[3px]"
          >
            {(
              [
                [3, Columns3, "3 columns"],
                [2, Columns2, "2 columns"],
              ] as const
            ).map(([n, Icon, label]) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={draft.columns === n}
                aria-label={label}
                title={label}
                onClick={() => setColumns(n)}
                className={cn(
                  "flex h-[26px] w-[32px] items-center justify-center rounded-[6px] motion-tap",
                  draft.columns === n
                    ? "bg-pg-surface text-pg-heading shadow-[0_1px_2px_0_rgba(16,24,40,0.08)]"
                    : "text-pg-muted hover:text-pg-heading",
                )}
              >
                <Icon size={16} aria-hidden="true" />
              </button>
            ))}
          </div>
          <span aria-hidden="true" className="mx-[4px] h-[16px] w-px bg-pg-border" />
          <button
            type="button"
            disabled={atDefault}
            onClick={() => commit(defaultLayout())}
            className="flex h-[36px] items-center gap-[6px] rounded-[8px] px-[8px] text-[14px] leading-[20px] text-pg-text motion-tap hover:bg-pg-surface disabled:cursor-not-allowed disabled:text-pg-disabled disabled:hover:bg-transparent"
          >
            <RotateCcw size={15} aria-hidden="true" />
            Reset to default
          </button>
          <PrimaryButton
            ref={saveRef}
            disabled={!dirty}
            onClick={save}
            className="h-[36px] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:shadow-none disabled:hover:brightness-100 disabled:active:scale-100"
          >
            Save
          </PrimaryButton>
        </div>
      </div>

      {/* ─── Canvas ─── */}
      <div
        className={cn(
          "grid min-h-0 flex-1 gap-[12px] pt-[16px]",
          threeCol
            ? "grid-cols-[minmax(260px,1fr)_minmax(320px,2fr)_minmax(240px,1fr)]"
            : "grid-cols-[minmax(260px,1fr)_minmax(0,3fr)]",
        )}
      >
        {/* Left column */}
        <div className="flex min-h-0 flex-col gap-[12px]">
          <section className={cn(CARD, "flex shrink-0 flex-col gap-[12px] p-[24px]")}>
            <h2 className="text-[16px] leading-[22px] font-medium text-pg-heading">Contact</h2>
            <div ref={cardRef} className="flex flex-col gap-[12px]">
              <div className="flex items-center gap-[10px]">
                <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
                  <User size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] font-medium text-pg-heading">
                  Contact name
                </span>
                <button
                  type="button"
                  aria-label="Edit contact card"
                  onClick={() => setDrawer("card")}
                  className={ICON_BUTTON}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
              </div>
              {draft.card.fields.length === 0 ? (
                <p className="text-[13px] leading-[18px] text-pg-faint">No fields on the card</p>
              ) : (
                <ul className="flex flex-col gap-[8px]">
                  {draft.card.fields.map((f) => (
                    <li key={f} className="text-[14px] leading-[20px] text-pg-muted">
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className={cn(CARD, "flex min-h-0 flex-1 flex-col")}>
            <div ref={tabsRef} className="flex shrink-0 flex-col gap-[16px] px-[24px] pt-[24px] pb-[12px]">
              <div className="flex items-center gap-[6px]">
                <h2 className="text-[16px] leading-[22px] font-medium text-pg-heading">Edit tabs</h2>
                <span title="The tabs users see on the left side of a contact." className="flex text-pg-faint">
                  <Info size={15} aria-label="About edit tabs" />
                </span>
                <button
                  type="button"
                  aria-label="Edit tabs"
                  onClick={() => setDrawer("tabs")}
                  className={cn(ICON_BUTTON, "ml-auto")}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
              </div>
              <Segmented
                variant="boxed"
                aria-label="Tab"
                value={segment}
                onChange={(v) => setSegment(v === "actions" ? "actions" : "fields")}
                options={[
                  { value: "fields", label: "All fields" },
                  ...(draft.dynamicTab
                    ? [
                        {
                          value: "dynamic",
                          label: draft.dynamicTab,
                          disabled: true,
                          title: `${draft.dynamicTab} is set up in its own module.`,
                        },
                      ]
                    : []),
                  { value: "actions", label: "Actions" },
                ]}
              />
              <div className="flex justify-end">
                {segment === "fields" ? (
                  <AddMenu items={[]} onPick={() => {}} emptyTitle="Folders come from your custom fields" />
                ) : (
                  <AddMenu
                    items={[...draft.center, ...draft.right]
                      .filter((m) => m !== "conversations")
                      .map((m) => item(m, draft.center.includes(m) ? (threeCol ? "Center panel" : "Modules") : "Right panel"))}
                    onPick={(id) => commit(placeModule(draft, id as ModuleId, "actions", null))}
                    emptyTitle="Every module is already in Actions"
                  />
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-[24px] pb-[24px]">
              {segment === "actions" ? (
                actionsModules
              ) : (
                <div className="flex flex-col gap-[10px]">
                  {draft.folders.map((f, i) => (
                    <FolderCard
                      key={f.id}
                      folder={f}
                      open={openFolder === f.id}
                      onToggle={() => setOpenFolder(openFolder === f.id ? null : f.id)}
                      onShown={(n) => setFolderShown(f.id, n)}
                      dragging={drag?.kind === "folder" && drag.id === f.id}
                      over={over === `folder:${f.id}` && !(drag?.kind === "folder" && drag.id === f.id)}
                      onDragStart={() => setDrag({ kind: "folder", id: f.id })}
                      onDragEnd={endDrag}
                      onDragOver={() => {
                        if (drag?.kind === "folder" && over !== `folder:${f.id}`) setOver(`folder:${f.id}`);
                      }}
                      onDrop={() => {
                        if (drag?.kind === "folder" && drag.id !== f.id) moveFolder(drag.id, i);
                        endDrag();
                      }}
                      onMove={(d) => moveFolder(f.id, i + d)}
                      acceptsDrag={drag?.kind === "folder"}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Center, or the merged modules card in 2 columns */}
        <section className={cn(CARD, "flex min-h-0 flex-col")}>
          <div ref={centerRef} className="flex shrink-0 flex-col gap-[4px] border-b border-pg-head-border px-[24px] pt-[24px] pb-[20px]">
            <h2 className="text-[16px] leading-[22px] font-medium text-pg-heading">
              {threeCol ? "Center panel" : "Modules"}
            </h2>
            <p className="text-[14px] leading-[20px] text-pg-muted">
              {threeCol
                ? "Drag and drop modules from the actions tab or the right panel to customize your layout. The conversations module will always remain fixed in the center and cannot be removed."
                : "Drag to reorder. Users will see a dropdown to switch between modules."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-[12px] px-[16px] pt-[16px] pb-[12px]">
            <div ref={displayRef} className="flex items-center gap-[10px]">
              <span className="text-[13px] leading-[18px] text-pg-muted">Display mode</span>
              <Segmented
                aria-label="Display mode"
                value={draft.displayMode}
                onChange={(displayMode) => commit({ ...draft, displayMode })}
                options={[
                  { value: "tabs", label: "Tabs" },
                  { value: "dropdown", label: "Dropdown" },
                ]}
              />
            </div>
            <div className="ml-auto">
              <AddMenu
                items={centerAdds}
                onPick={(id) => commit(placeModule(draft, id as ModuleId, "center", null))}
                emptyTitle="Every module is on the page"
              />
            </div>
          </div>
          {moduleList("center", draft.center)}
        </section>

        {threeCol ? (
          <section className={cn(CARD, "flex min-h-0 flex-col")}>
            <div ref={rightRef} className="flex shrink-0 flex-col gap-[4px] border-b border-pg-head-border px-[24px] pt-[24px] pb-[20px]">
              <h2 className="text-[16px] leading-[22px] font-medium text-pg-heading">Right panel</h2>
              <p className="text-[14px] leading-[20px] text-pg-muted">Reorder modules for quick access</p>
            </div>
            <div className="flex shrink-0 justify-end px-[16px] pt-[16px] pb-[12px]">
              <AddMenu
                items={unplaced.map((m) => item(m))}
                onPick={(id) => commit(placeModule(draft, id as ModuleId, "right", null))}
                emptyTitle="Every module is on the page"
              />
            </div>
            {moduleList("right", draft.right)}
          </section>
        ) : null}
      </div>

      <p className="shrink-0 py-[10px] text-center text-[14px] leading-[20px] text-pg-muted">
        Each module can appear only once on the page.
      </p>

      {/* ─── Overlays ─── */}
      {drawer === "card" ? (
        <EditCardDrawer
          card={draft.card}
          onClose={() => setDrawer(null)}
          onApply={(card) => {
            commit({ ...draft, card });
            setDrawer(null);
          }}
        />
      ) : null}
      {drawer === "tabs" ? (
        <EditTabsDrawer
          dynamicTab={draft.dynamicTab}
          onClose={() => setDrawer(null)}
          onApply={(dynamicTab) => {
            commit({ ...draft, dynamicTab });
            setDrawer(null);
          }}
          onEditTab={(dynamicTab, tab) => {
            commit({ ...draft, dynamicTab });
            setSegment(tab);
            setDrawer(null);
          }}
        />
      ) : null}
      {renaming ? <ViewNameModal mode="rename" view={view} onClose={() => setRenaming(false)} /> : null}
      {confirmLeave ? (
        <Modal
          title="Discard unsaved changes?"
          onClose={() => setConfirmLeave(false)}
          footer={
            <>
              <OutlineButton className="h-[36px]" onClick={() => setConfirmLeave(false)}>
                Keep editing
              </OutlineButton>
              <PrimaryButton className="h-[36px] bg-pg-danger hover:shadow-none" onClick={onExit}>
                Discard changes
              </PrimaryButton>
            </>
          }
        >
          <p className="text-[14px] leading-[20px] text-pg-text">
            Your changes to {view.name} aren&apos;t saved. If you leave now, they&apos;ll be lost.
          </p>
        </Modal>
      ) : null}
      {tourOpen ? <ViewBuilderTour steps={steps} onClose={closeTour} /> : null}
    </div>
  );
}

/* ─── Rows ──────────────────────────────────────────────────────────────── */

function ModuleRow({
  id,
  dragging,
  over,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onMove,
  onRemove,
}: {
  id: ModuleId;
  dragging?: boolean;
  over?: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
  onMove?: (delta: -1 | 1) => void;
  onRemove?: () => void;
}) {
  const locked = id === "conversations";
  const Icon = MODULE_ICON[id];
  const label = moduleLabel(id);

  return (
    <div
      draggable={!locked}
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        if (!onDragOver) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDrop={(e) => {
        if (!onDrop) return;
        e.preventDefault();
        e.stopPropagation();
        onDrop();
      }}
      className={cn(
        "group flex h-[40px] shrink-0 items-center gap-[10px] rounded-[8px] bg-pg px-[12px]",
        !locked && "cursor-grab active:cursor-grabbing",
        dragging && "opacity-40",
        over && "shadow-[inset_0_2px_0_0_var(--brand)]",
      )}
    >
      <Grip label={label} disabled={locked} onMove={onMove} />
      <Icon size={16} aria-hidden="true" className="shrink-0 text-pg-text" />
      <span className="min-w-0 flex-1 truncate text-[14px] leading-[20px] text-pg-heading">{label}</span>
      {locked ? (
        <span title="Conversations always stays in the center" className="flex text-pg-muted">
          <Lock size={15} aria-label="Locked" />
        </span>
      ) : onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          title="Move to the Actions tab"
          onClick={onRemove}
          className={cn(ICON_BUTTON, "size-[24px] opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
        >
          <X size={14} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * A field folder. Clicking it opens a small stepper for how many of its
 * fields users see — the prototype tracks counts, not the fields themselves.
 */
function FolderCard({
  folder,
  open,
  onToggle,
  onShown,
  dragging,
  over,
  acceptsDrag,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onMove,
}: {
  folder: FieldFolder;
  open: boolean;
  onToggle: () => void;
  onShown: (n: number) => void;
  dragging: boolean;
  over: boolean;
  acceptsDrag: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onMove: (delta: -1 | 1) => void;
}) {
  const empty = folder.total === 0;
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", folder.id);
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        if (!acceptsDrag) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop();
      }}
      className={cn(
        "shrink-0 rounded-[8px] bg-pg-surface shadow-[inset_0_0_0_1px_var(--pg-border)]",
        dragging && "opacity-40",
        over && "shadow-[inset_0_0_0_1px_var(--pg-border),inset_0_2px_0_0_var(--brand)]",
      )}
    >
      <div className="flex items-center gap-[10px] px-[12px] py-[12px]">
        <Grip label={folder.name} onMove={onMove} />
        <button
          type="button"
          aria-expanded={open}
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-[10px] text-left"
        >
          <Folder size={16} aria-hidden="true" className="shrink-0 text-pg-muted" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-[14px] leading-[20px] text-pg-heading">{folder.name}</span>
            <span className="truncate text-[13px] leading-[18px] text-pg-muted">{folderStatus(folder)}</span>
          </span>
        </button>
      </div>
      {open ? (
        <div className="flex items-center gap-[8px] border-t border-pg-row-border px-[12px] py-[10px]">
          {empty ? (
            <span className="text-[13px] leading-[18px] text-pg-muted">This folder has no fields yet.</span>
          ) : (
            <>
              <span className="text-[13px] leading-[18px] text-pg-muted">Fields shown</span>
              <div className="ml-auto flex items-center gap-[4px]">
                <button
                  type="button"
                  aria-label="Show one fewer field"
                  disabled={folder.shown <= 0}
                  onClick={() => onShown(folder.shown - 1)}
                  className={ICON_BUTTON}
                >
                  <Minus size={14} aria-hidden="true" />
                </button>
                <span className="min-w-[72px] text-center text-[13px] leading-[18px] text-pg-heading tabular-nums">
                  {folder.shown.toLocaleString("en-US")} of {folder.total.toLocaleString("en-US")}
                </span>
                <button
                  type="button"
                  aria-label="Show one more field"
                  disabled={folder.shown >= folder.total}
                  onClick={() => onShown(folder.shown + 1)}
                  className={ICON_BUTTON}
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => onShown(folder.shown === folder.total ? 0 : folder.total)}
                className="ml-[4px] text-[13px] leading-[18px] font-medium text-brand hover:underline"
              >
                {folder.shown === folder.total ? "Hide all" : "Show all"}
              </button>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
