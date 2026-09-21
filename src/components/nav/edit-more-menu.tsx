"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  LayoutTemplate,
  List,
  ListTree,
  Package,
  PanelLeft,
  Save,
  Copy,
  CopyPlus,
  TriangleAlert,
  EllipsisVertical,
  Trash2,
  FilePlus2,
  SquareMenu,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  AffectedAccounts,
  TemplateMessage,
  TemplateMessageActions,
  TemplateMessageBody,
  TemplateMessageButton,
  TemplateMessageTitle,
  TemplatePicker,
} from "./template-message";
import { TemplateRowMenu, templateHasActions } from "./template-row-menu";
import { TemplateSaveDialog } from "./template-save-dialog";
import { useNavLayout } from "./nav-layout-provider";
import {
  NAV_GENERATIONS,
  NAV_GENERATION_LABELS,
  type NavGeneration,
} from "@/design/theme";
import { cn } from "@/lib/utils";
import { useAnchored } from "@/lib/use-anchored";
import { DEFAULT_TEMPLATE_ID, useNavTemplates } from "./nav-templates";

/*
 * One glyph per row, and the pairs chosen to depict the difference.
 *
 * All six of these were the same two icons repeated — the parent and both its
 * children shared one, so a drilled-in view showed two identical marks against
 * two opposite choices and the icon column carried no information at all.
 *
 * The pairs now say what the choice IS. A nested list against a flat one is
 * precisely what separates the two navigations, and it is legible at 14px in a
 * way that any two abstract marks would not be. Yours against as-shipped is a
 * person against a sealed box.
 */
const LAYOUT_ICON = PanelLeft;
const OWN_LAYOUT_ICON = UserRound;
const DEFAULT_LAYOUT_ICON = Package;
const NAVIGATION_ICON = SquareMenu;
const NEW_NAV_ICON = ListTree;
const OLD_NAV_ICON = List;

const WIDTH = 244;
const GAP = 6;

type View =
  | "root"
  | "apply"
  | "save"
  | "create"
  /** The library: rename, duplicate, delete. See TEMPLATE_ACTION_HOMES. */
  | "manage"
  | "layout"
  | "navigation";

/**
 * The edit card's overflow menu: templates, which layout, which navigation.
 *
 * These three were four icons on a 232px row, and the row had run out — adding
 * the fifth clipped the card's own label mid-word. But the count was the symptom.
 * The two that stayed as icons, Show / hide and Colours, change what you are
 * looking at while you arrange it, and get reached for repeatedly in one
 * sitting. These three are decisions you make once and leave: which saved
 * arrangement to use, whose layout to look at, which navigation to run. A
 * control used once per session does not deserve the same real estate as one
 * used once per minute.
 *
 * Drilling down rather than opening submenus beside itself. RowMenu already
 * argued this out for the per-row kebab and the reasoning holds harder here: the
 * card sits at the NAV'S FOOT, so a submenu would have to fly upward across the
 * list it is about, and the pointer would have to travel diagonally to reach it
 * without falling off. One box that stays where it opened, with a back arrow,
 * survives every position the card can be in.
 */
export function EditMoreMenu({
  anchor,
  accountName,
  accountId,
  onApplyTemplateTo,
  viewingDefault,
  onShowDefault,
  onRestoreOwn,
  onApplyTemplate,
  onCreateTemplate,
  onUpdateTemplate,
  onDuplicateTemplate,
  templateDirty,
  onClose,
  onOpenNavModal,
}: {
  anchor: HTMLElement;
  /**
   * Hands the choice to the modal instead of drilling into it here.
   *
   * Owned by the caller because this menu unmounts the moment a row is picked,
   * and a modal that dies with the thing that opened it never appears.
   */
  onOpenNavModal: () => void;
  /** Seeds the template name, so saving is one keystroke less. */
  accountName: string;
  /** Whose template link is being read — which decides if Save is live. */
  accountId: string;
  /**
   * Land a template's arrangement on a set of accounts.
   *
   * For the delete dialog's "move them to another template": the shell owns
   * `applyToAccounts` and the per-account patching, so the decision is made
   * here and the work happens there.
   */
  onApplyTemplateTo: (accountIds: readonly string[], templateId: string) => void;
  viewingDefault: boolean;
  onShowDefault: () => void;
  onRestoreOwn: () => void;
  onApplyTemplate: (templateId: string) => void;
  /** Creates a template from this arrangement and puts the account on it. */
  onCreateTemplate: (name: string) => void;
  /** Overwrites the template the account is already on. */
  onUpdateTemplate: (templateId: string) => void;
  /** Copies a template's arrangement onto a new one that nobody is on. */
  onDuplicateTemplate: (templateId: string) => void;
  /**
   * Whether this account has changed since it took its template.
   *
   * Computed by the caller, which is the only place that holds both the link's
   * base and the live arrangement. Without it Save is a standing offer: apply a
   * template, and the menu immediately invites you to save it back over itself.
   */
  templateDirty: boolean;
  onClose: () => void;
}) {
  const { navGeneration, setNavGeneration, effective } = useTheme();
  /** What saving reaches. See TEMPLATE_PROPAGATIONS. */
  const propagation = effective.templatePropagation;
  /*
   * Both rows are behind their own axis, so the menu can be seen without either.
   * Read off `effective` like the rest of the card's chrome.
   */
  const { navSwitchInEditCard, layoutSwitchInEditCard, navSwitchSurface } =
    effective;
  const {
    templates,
    linkedFor,
    accountsOn,
    accountsOnIds,
    linkFor,
    remove,
    rename,
    notify,
    divergedFor,
    clearDivergence,
    reassign,
    unlink,
    strict,
    newProductsFor,
  } = useNavTemplates();
  const { revertAccounts } = useNavLayout();
  const {
    templateDeleteMode,
    templateMenuShape: menuShape,
    templateConflict,
    templateSaveShape,
    templateActionHome,
  } = effective;
  /** This account's unresolved collision, if the axis records them. */
  const divergence = templateConflict === "silent" ? null : divergedFor(accountId);
  /** Whether the divergence dialog is up. */
  const [resolving, setResolving] = React.useState(false);
  /** The save dialog, and which of its two answers is selected. */
  const [duplicating, setDuplicating] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [view, setView] = React.useState<View>("root");
  const [draft, setDraft] = React.useState(`${accountName} nav`);
  /** Which row's kebab is open, and the button it hangs off. */
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [menuAt, setMenuAt] = React.useState<HTMLElement | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameDraft, setRenameDraft] = React.useState("");
  /** The template a delete confirmation is open for. */
  const [deleting, setDeleting] = React.useState<string | null>(null);
  /*
   * What happens to the accounts on a template being deleted.
   *
   * Seeded from the prototype axis so the two agree on open, then owned by the
   * dialog — the axis says which answer is offered first, the person deleting
   * says which one happens.
   */
  const [fate, setFate] = React.useState<"unlink" | "move">("unlink");
  const [moveTo, setMoveTo] = React.useState("");
  const duplicatingTemplate = duplicating
    ? (templates.find((t) => t.id === duplicating) ?? null)
    : null;
  const deletingTemplate = deleting
    ? (templates.find((t) => t.id === deleting) ?? null)
    : null;
  const onIt = deleting ? accountsOn(deleting) : 0;
  /**
   * Somewhere to move them to: anything but the one being deleted.
   *
   * The default is in here, which is what collapsed three options into two —
   * "revert them to the HighLevel default" was only ever "move them to the
   * default", and a separate radio for one destination in a list of
   * destinations was the same choice asked twice.
   */
  const movableTemplates = templates.filter((t) => t.id !== deleting);
  const { ref, top, left } = useAnchored(anchor, WIDTH, GAP);

  React.useEffect(() => {
    const away = (e: PointerEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      // The row menu is portalled out of this panel but belongs to it — see
      // data-template-row-menu.
      if (
        target instanceof Element &&
        target.closest("[data-template-row-menu], [data-template-message]")
      ) {
        return;
      }
      onClose();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      // Escape steps back through the views before it closes the menu — one
      // level of drilling should not cost the whole panel.
      setView((v) => (v === "root" ? (onClose(), "root") : "root"));
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc, true);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc, true);
    };
  }, [onClose, ref]);

  /*
   * Switching an axis off while its view is open would leave the menu showing a
   * choice the card no longer offers. Adjusted during render rather than in an
   * effect, as elsewhere in this codebase.
   */
  const hidden =
    (view === "layout" && !layoutSwitchInEditCard) ||
    (view === "navigation" && !navSwitchInEditCard);
  const [wasHidden, setWasHidden] = React.useState(hidden);
  if (wasHidden !== hidden) {
    setWasHidden(hidden);
    if (hidden) setView("root");
  }

  /**
   * The template this account is on, if any. Everything the two save rows say
   * hangs off it: with a link there is a template to update, and without one
   * the only honest verb is "create".
   */
  const onTemplate = linkedFor(accountId);
  /*
   * The template there is something to SAVE INTO, which is not always the one
   * the account is on.
   *
   * Under `one-template` an account with no named template is on the default,
   * and the default cannot be written to — so every question downstream that
   * asks "is there a template to update" has to answer no here, or the save
   * dialog offers to overwrite the one thing in the product that must not move.
   * Which is also the rule the flow diagram states outright: from the default
   * there is one outcome, a new template, and the fork never appears.
   */
  const linked = onTemplate && !onTemplate.immutable ? onTemplate : null;

  /**
   * Whether this row is the arrangement the account is already on.
   *
   * `linked` is null on the default — it holds the template there is something
   * to SAVE INTO, and the default is not one — so being on the default is
   * tested as the absence of a link rather than as a link to it. Same question
   * the tick asks, asked once.
   */
  const isCurrent = (templateId: string) =>
    templateId === DEFAULT_TEMPLATE_ID ? linked === null : linked?.id === templateId;

  /**
   * Applying the template you are already on.
   *
   * Nothing to do, so nothing is done: the menu closes and that is the whole
   * gesture. It used to run the full apply — a confirmation to answer, a patch
   * that landed identically, a toast, and an undo offer for a change nobody
   * made. Every one of those describes something happening, over a press whose
   * honest answer is "you are already here".
   */
  const applyRow = (templateId: string) => {
    if (!isCurrent(templateId)) onApplyTemplate(templateId);
    onClose();
  };

  const body = (() => {
    if (view === "apply") {
      return (
        <Drill title="Apply a template" onBack={() => setView("root")}>
          {templates.length === 0 ? (
            <p className="px-[7px] py-[6px] text-[12px] leading-[16px] text-nav-fg-subtle">
              Nothing saved yet. Arrange this nav, then save it as a template to
              reuse on other accounts.
            </p>
          ) : (
            templates.map((t) =>
              /*
                Renaming happens on the row, not in a dialog over it — the same
                move the nav's own rows make. It is also the answer to the
                question this started from: where do I fix "(copy)".
              */
              renamingId === t.id ? (
                <input
                  key={t.id}
                  autoFocus
                  value={renameDraft}
                  onChange={(e) => setRenameDraft(e.target.value)}
                  onBlur={() => {
                    rename(t.id, renameDraft);
                    if (renameDraft.trim() !== "" && renameDraft !== t.name) {
                      notify(`Renamed to ${renameDraft.trim()}`);
                    }
                    setRenamingId(null);
                  }}
                  onKeyDown={(e) => {
                    /*
                      Enter blurs rather than committing itself.

                      Both keys and the blur used to commit, which meant two
                      paths to keep in step — and once the commit also raised a
                      toast, two chances to raise it twice. One committer.
                    */
                    if (e.key === "Enter") e.currentTarget.blur();
                    if (e.key === "Escape") {
                      e.stopPropagation();
                      setRenamingId(null);
                    }
                  }}
                  aria-label={`Rename ${t.name}`}
                  className="mx-[5px] min-w-0 rounded-[7px] bg-nav-hover px-[8px] py-[7px] text-[12.5px] leading-[16px] font-medium text-nav-fg outline-none"
                />
              ) : (
                /*
                  One kebab, not a bare glyph.

                  The row carried a single `Copy` icon for duplicate — which is
                  literally the copy-to-clipboard picture, and was read as such.
                  There are three verbs now, and a menu is the only way
                  "duplicate" stops being a guess at an icon.
                */
                <MenuRow
                  key={t.id}
                  icon={LayoutTemplate}
                  label={t.name}
                  note={`${t.builtIn ? "Preset" : `From ${t.fromAccount}`} · v${t.version} · ${accountsOn(t.id) === 0 ? "no accounts" : `${accountsOn(t.id)} ${accountsOn(t.id) === 1 ? "account" : "accounts"}`}`}
                  action={{
                    icon: EllipsisVertical,
                    label: `More for ${t.name}`,
                    onSelect: (el) => {
                      setMenuFor(t.id);
                      setMenuAt(el);
                    },
                  }}
                  onSelect={() => applyRow(t.id)}
                />
              ),
            )
          )}
        </Drill>
      );
    }

    if (view === "save" && linked) {
      const others = accountsOn(linked.id) - 1;
      /*
        A decision, so it goes wherever decisions go.

        It used to be a drill-down inside this popover — the same surface that
        holds "Change icon" — which put "fifty navs are about to move" at the
        same weight as a colour picker, in a panel you can dismiss by clicking
        anywhere. It is now the shared message shell, so it sits beside the
        apply and delete confirmations rather than in a third place of its own.
        See TEMPLATE_MESSAGE_PLACEMENTS.
      */
      return (
        <TemplateMessage
          kind="decision"
          label="Save template"
          /*
            Wide enough for three buttons on one line.

            At 380 "Duplicate instead" and "Update 5 accounts" each broke across
            two lines, which turned a footer into a paragraph of buttons.
          */
          width={520}
          onDismiss={() => setView("root")}
        >
          <TemplateMessageTitle
            icon={<Save size={15} aria-hidden="true" />}
          >
            Save this arrangement to {linked.name}?
          </TemplateMessageTitle>
          <TemplateMessageBody>
            Replaces what{" "}
            <span className="font-medium text-nav-fg">{linked.name}</span> holds
            with this arrangement, as v{linked.version + 1}.
            {/*
              Said before the overwrite, not after. A managed template is the
              only edit in this nav that lands somewhere you are not standing,
              and the number of navs it will move is the one fact that decides
              whether to press the button — so it is stated in accounts, above
              the button, every time.

              Under `copy` the sentence flips to what is NOT about to happen,
              rather than disappearing. "Nothing else changes" is a promise
              worth making explicitly; silence would read the same as the
              managed case to anyone who has seen both.
            */}
            {others === 0
              ? " No other account is on it yet."
              : propagation === "managed"
                ? ` ${others === 1 ? "1 other account is" : `${others} other accounts are`} on it and will be re-arranged now, keeping any changes made to them directly.`
                : ` ${others === 1 ? "1 other account is" : `${others} other accounts are`} on it — they keep what they have until you apply it to them.`}
          </TemplateMessageBody>
          <TemplateMessageActions
            dismiss={
              <TemplateMessageButton onClick={() => setView("root")}>
                Cancel
              </TemplateMessageButton>
            }
            /*
              Least to most committing, so the primary lands last.

              "Duplicate instead" is the safe half of this decision — the same
              work landing on a template nobody is on, which is what half the
              people who reach this screen actually wanted. It sits BESIDE the
              destructive one rather than under it, so a button with no
              neighbour stops being the only one there.
            */
            actions={[
              ...(others > 0 && propagation === "managed"
                ? [
                    <TemplateMessageButton
                      key="dup"
                      /*
                        No icon. It was the only button in any of these
                        footers wearing one, which made it read as a different
                        class of control rather than as the second option.
                      */
                      onClick={() => {
                        onDuplicateTemplate(linked.id);
                        onClose();
                      }}
                    >
                      Duplicate instead
                    </TemplateMessageButton>,
                  ]
                : []),
              <TemplateMessageButton
                key="update"
                tone="primary"
                onClick={() => {
                  onUpdateTemplate(linked.id);
                  onClose();
                }}
              >
                {others > 0 && propagation === "managed"
                  ? `Update ${others + 1} accounts`
                  : `Update ${linked.name}`}
              </TemplateMessageButton>,
            ]}
          />
        </TemplateMessage>
      );
    }

    if (view === "manage") {
      return (
        <Drill title="Manage templates" onBack={() => setView("root")}>
          {templates.map((t) =>
            renamingId === t.id ? (
              <input
                key={t.id}
                autoFocus
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={() => {
                  rename(t.id, renameDraft);
                  if (renameDraft.trim() !== "" && renameDraft !== t.name) {
                    notify(`Renamed to ${renameDraft.trim()}`);
                  }
                  setRenamingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setRenamingId(null);
                  }
                }}
                aria-label={`Rename ${t.name}`}
                /*
                  The row's own height, held.

                  A two-line row becoming a one-line field made every row below
                  it jump up as the rename opened and back down as it closed —
                  the list moving under the pointer at the moment somebody is
                  reading it. `min-h` is the label plus the note plus the row's
                  padding: 17 + 15 + 12.
                */
                className="mx-[5px] min-h-[44px] min-w-0 rounded-[7px] bg-nav-hover px-[8px] text-[12.5px] leading-[16px] font-medium text-nav-fg outline-none"
              />
            ) : (
              <MenuRow
                key={t.id}
                icon={LayoutTemplate}
                label={t.name}
                /*
                  Here the version and the reach ARE the point — this is the
                  surface for looking after templates, where the picker is for
                  choosing between them.
                */
                note={(() => {
                  if (t.immutable) return "Can't be changed";
                  const on = accountsOn(t.id);
                  const arrived = newProductsFor(t.id).length;
                  /*
                    What arrived after it was saved, on the row that is FOR
                    detail.

                    A product added to the catalogue lands wherever the default
                    puts it, in every template — which is the only answer that
                    does not leave a template permanently blind to new products.
                    The agency should still be told: they chose this
                    arrangement, and something has been filed into it on their
                    behalf. The picker's rows stay one fact each; this is the
                    surface where the second fact belongs.
                  */
                  return [
                    `v${t.version}`,
                    on === 0
                      ? "no accounts"
                      : `${on} ${on === 1 ? "account" : "accounts"}`,
                    ...(arrived > 0
                      ? [`${arrived} added since`]
                      : []),
                  ].join(" · ");
                })()}
                {...(templateHasActions(t, {
                  canUpdate: false,
                  canResolve: false,
                })
                  ? {
                      action: {
                        icon: EllipsisVertical,
                        label: `More for ${t.name}`,
                        onSelect: (el: HTMLElement) => {
                          setMenuFor(t.id);
                          setMenuAt(el);
                        },
                      },
                    }
                  : {})}
                // The row itself does nothing here: managing is the ⋯, and a
                // row that applied a template from inside "Manage" would be the
                // picker hiding in the file manager.
                onSelect={() => {}}
              />
            ),
          )}
        </Drill>
      );
    }

    if (view === "create") {
      const named = draft.trim();
      return (
        <Drill title="Create new template" onBack={() => setView("root")}>
          <p className="px-[7px] pb-[6px] text-[12px] leading-[16px] text-nav-fg-subtle">
            Keeps this arrangement so you can put it on another account. This
            account moves onto the new template.
          </p>
          <input
            type="text"
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter" || named === "") return;
              onCreateTemplate(named);
              onClose();
            }}
            aria-label="Template name"
            className="mx-[5px] h-[32px] rounded-[7px] bg-nav px-[9px] text-[12.5px] leading-none text-nav-fg shadow-[inset_0_0_0_1px_var(--nav-divider)] focus:outline-none focus:shadow-[inset_0_0_0_1.5px_var(--nav-fg-subtle)]"
          />
          <button
            type="button"
            disabled={named === ""}
            onClick={() => {
              onCreateTemplate(named);
              onClose();
            }}
            className="motion-tap mx-[5px] mt-[6px] flex h-[30px] items-center justify-center rounded-[7px] bg-nav-fg text-[12.5px] leading-none font-medium text-nav hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Create template
          </button>
        </Drill>
      );
    }

    if (view === "layout") {
      return (
        <Drill title="Layout" onBack={() => setView("root")}>
          <MenuRow
            icon={OWN_LAYOUT_ICON}
            label="My layout"
            // Short enough not to truncate: a note that needs a tooltip to be
            // read is a note that has stopped being one.
            note="What I have now"
            checked={!viewingDefault}
            onSelect={() => {
              if (viewingDefault) onRestoreOwn();
              onClose();
            }}
          />
          <MenuRow
            icon={DEFAULT_LAYOUT_ICON}
            label="HighLevel default layout"
            note="What we ship"
            checked={viewingDefault}
            onSelect={() => {
              if (!viewingDefault) onShowDefault();
              onClose();
            }}
          />
        </Drill>
      );
    }

    if (view === "navigation") {
      return (
        <Drill title="Navigation" onBack={() => setView("root")}>
          {NAV_GENERATIONS.map((generation) => (
            <MenuRow
              key={generation}
              icon={generation === "legacy" ? OLD_NAV_ICON : NEW_NAV_ICON}
              label={NAV_GENERATION_LABELS[generation]}
              note={
                generation === "legacy"
                  ? "What ships today — one flat list, no second level."
                  : "This proposal — grouped, with flyouts and pinning."
              }
              checked={generation === navGeneration}
              onSelect={() => {
                setNavGeneration(generation);
                onClose();
              }}
            />
          ))}
        </Drill>
      );
    }

    /*
      Templates first, operations second — the paragraph-styles model.

      The verbs-first menu below answers "what can I do", and then asks you to
      pick the noun inside whichever verb you chose. Most people arrive with the
      noun: they know which arrangement they want and are looking for it. So the
      list IS the menu, applying is the row itself, and everything else you can
      do to a template lives on that template's own ⋯ — where a Google Doc puts
      "update to match" and a rename.

      One row at the foot saves what is on screen as a new one, which is the
      only operation that is not about a template that already exists.
    */
    if (menuShape === "list-first") {
      return (
        <>
          <span className="mb-[4px] block px-[7px] pt-[3px] text-[10.5px] leading-[14px] font-semibold tracking-[0.5px] text-nav-fg-subtle uppercase">
            Navigation templates
          </span>
          {templates.map((t) =>
            renamingId === t.id ? (
              <input
                key={t.id}
                autoFocus
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={() => {
                  rename(t.id, renameDraft);
                  if (renameDraft.trim() !== "" && renameDraft !== t.name) {
                    notify(`Renamed to ${renameDraft.trim()}`);
                  }
                  setRenamingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    setRenamingId(null);
                  }
                }}
                aria-label={`Rename ${t.name}`}
                /*
                  The row's own height, held.

                  A two-line row becoming a one-line field made every row below
                  it jump up as the rename opened and back down as it closed —
                  the list moving under the pointer at the moment somebody is
                  reading it. `min-h` is the label plus the note plus the row's
                  padding: 17 + 15 + 12.
                */
                className="mx-[5px] min-h-[44px] min-w-0 rounded-[7px] bg-nav-hover px-[8px] text-[12.5px] leading-[16px] font-medium text-nav-fg outline-none"
              />
            ) : (
              <MenuRow
                key={t.id}
                // Unused while `tickLeads` is on, and required by the type.
                icon={LayoutTemplate}
                tickLeads
                label={t.name}
                /*
                  The row says where this account stands in relation to it —
                  on it, on it with changes, or not on it — because "which of
                  these am I using" is the question the list is opened with.
                */
                /*
                  One fact, not three.

                  "In use · v3 · changed since" is a version nobody is tracking
                  and a state, run together in a line too long to scan down a
                  list. The row says WHERE THIS ACCOUNT STANDS, in a word; the
                  version and the rest are detail, and detail belongs where you
                  go when a word is not enough.
                */
                note={
                  t.id === DEFAULT_TEMPLATE_ID
                    ? "What we ship"
                    : linked?.id === t.id
                      ? divergence?.templateId === t.id
                        ? "Diverged"
                        : templateDirty
                          ? "Edited"
                          : "In use"
                      : t.builtIn
                        ? "Preset"
                        : `From ${t.fromAccount}`
                }
                // The same question the row's press asks — see `isCurrent`.
                checked={isCurrent(t.id)}
                {...(templateActionHome === "on-row" &&
                templateHasActions(t, {
                  canUpdate:
                    templateSaveShape === "split" &&
                    linked?.id === t.id &&
                    templateDirty,
                  canResolve:
                    templateConflict === "resolve" &&
                    divergence?.templateId === t.id,
                })
                  ? {
                      action: {
                        icon: EllipsisVertical,
                        label: `More for ${t.name}`,
                        onSelect: (el: HTMLElement) => {
                          setMenuFor(t.id);
                          setMenuAt(el);
                        },
                      },
                    }
                  : {})}
                onSelect={() => applyRow(t.id)}
              />
            ),
          )}
          <Rule />
          {/*
            Saving is not a menu errand under `one-template`.

            There, editing IS editing a template: Save on the card asks which
            one this belongs to and files it. A second way in from the menu
            would be a row that opens the dialog you are already going to meet,
            and the two would disagree about whether an edit had landed yet.

            Under `local-edits` it stays, because there the two really are
            different acts — the card commits to this account, and this row is
            how that arrangement reaches the template and everyone on it.
          */}
          {strict ? null : templateSaveShape === "unified" ? (
            <MenuRow
              icon={Save}
              label="Save template"
              note={
                linked
                  ? templateDirty
                    ? `Update ${linked.name}, or keep a new one`
                    : `${linked.name} already matches`
                  : `From ${accountName}'s arrangement`
              }
              /*
                Mounted on open, not kept alive behind the menu: the account it
                would name and the template it would update both change as you
                move around, and a dialog that outlives the visit carries a name
                nobody typed for this account.
              */
              onSelect={() => setSaving(true)}
            />
          ) : (
            <MenuRow
              icon={FilePlus2}
              label="Save as new template"
              note={`From ${accountName}'s arrangement`}
              onSelect={() => setView("create")}
              branch
            />
          )}
          {/*
            Library work, out of the picker.

            Renaming and deleting a template are things you do twice a month;
            applying one is something you do all day. Keeping them on the same
            rows made the everyday list carry the rare controls.
          */}
          {templateActionHome === "manage" ? (
            <MenuRow
              icon={LayoutTemplate}
              label="Manage templates"
              note={
                templates.length === 1
                  ? "Rename, duplicate, delete"
                  : `${templates.length} templates`
              }
              onSelect={() => setView("manage")}
              branch
            />
          ) : null}
          {templateConflict === "resolve" && divergence ? (
            /*
              The one per-account errand that has nowhere else to go once the ⋯
              is off the rows. It is about this nav, not about the library, so
              it sits with the other things you do to this nav.
            */
            <MenuRow
              icon={TriangleAlert}
              label="Resolve divergence"
              note={`${divergence.lines.length} ${divergence.lines.length === 1 ? "conflict" : "conflicts"} with ${divergence.templateName}`}
              onSelect={() => setResolving(true)}
              branch
            />
          ) : null}
          {navSwitchInEditCard ? (
            <>
              <Rule />
              <MenuRow
                icon={SquareMenu}
                label="Navigation"
                note={
                  navGeneration === "legacy" ? "Old navigation" : "New navigation"
                }
                onSelect={() => setView("navigation")}
                branch
              />
            </>
          ) : null}
        </>
      );
    }

    return (
      <>
        {/*
          Two verbs, not one.
          
          This was a single "Save as template" that always made a new one, which
          left an agency with three copies of the same dental nav after three
          rounds of tidying and no way to say "the template was wrong". Save
          means the template this account is ON; Create means a new one. The
          first is dead unless there is something to save into, and it says so
          rather than silently doing the second thing.

          The first is also the one `one-template` takes away — see the note on
          the list-first row. Create survives it: a template made from an
          arrangement you have not edited is still a thing an agency wants, and
          removing it would leave this menu shape with no way to make one.
        */}
        {strict ? null : (
        <MenuRow
          icon={Save}
          label="Save template"
          note={
            linked && !templateDirty
              ? // The row stays, greyed, and says which template it would have
                // saved into. Hiding it would make the menu change shape between
                // two visits for a reason nobody could see.
                `${linked.name} · no changes to save`
              : linked
              ? /*
                  The row carries the version and the reach, because "Save
                  template" is the only row in this menu whose consequences are
                  not on screen. Two accounts on it is a different press from
                  fifty, and that should be legible before the drill-in.
                */
                `${linked.name} · v${linked.version}${
                  propagation === "managed" && accountsOn(linked.id) > 1
                    ? ` · ${accountsOn(linked.id)} accounts`
                    : ""
                }`
              : "This account isn't on a template"
          }
          disabled={!linked || !templateDirty}
          onSelect={() => setView("save")}
          branch
        />
        )}
        <MenuRow
          icon={FilePlus2}
          label="Create new template"
          note={`From ${accountName}'s arrangement`}
          onSelect={() => setView("create")}
          branch
        />
        <MenuRow
          icon={LayoutTemplate}
          label="Apply a template"
          note={
            templates.length === 1 ? "1 saved" : `${templates.length} saved`
          }
          onSelect={() => setView("apply")}
          branch
        />
        {/*
          The rule only earns its place when there is something under it — with
          both axes off it would close a section that is not there.
        */}
        {layoutSwitchInEditCard || navSwitchInEditCard ? <Rule /> : null}
        {layoutSwitchInEditCard ? (
          <MenuRow
            icon={LAYOUT_ICON}
            label="Layout"
            // The current answer on the row that opens the choice, so the menu
            // says which layout is up without being drilled into.
            note={viewingDefault ? "HighLevel default layout" : "My layout"}
            onSelect={() => setView("layout")}
            branch
          />
        ) : null}
        {navSwitchInEditCard ? (
          /*
            The one row in this menu that is not about the nav you have.
            
            Everything else here adjusts an arrangement; this replaces it. Which
            is also why it is worth asking whether an overflow menu inside edit
            mode is the only place it should live — on the Starter plan editing
            is locked, so this row is unreachable and the switch has no route at
            all. See NAV_SWITCH_SURFACES.
          */
          <MenuRow
            icon={NAVIGATION_ICON}
            label="Navigation"
            note={NAV_GENERATION_LABELS[navGeneration]}
            onSelect={() => {
              if (navSwitchSurface === "modal") {
                onClose();
                onOpenNavModal();
                return;
              }
              setView("navigation");
            }}
            branch={navSwitchSurface === "menu"}
          />
        ) : null}
      </>
    );
  })();

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-label="More editing options"
      // Portalled, so it carries its own nav theme — see the icon picker.
      data-nav-theme={effective.navTheme}
      style={{ top, left, width: WIDTH }}
      className="motion-panel-in fixed z-[71] flex max-h-[360px] flex-col overflow-y-auto rounded-[10px] bg-nav p-[5px] shadow-[0_12px_32px_0_var(--fly-shadow),inset_0_0_0_1px_var(--fly-border)]"
    >
      {body}
      {menuFor !== null && menuAt !== null ? (
        <TemplateRowMenu
          template={templates.find((t) => t.id === menuFor)!}
          anchor={menuAt}
          /*
            Only on the template this account is on, and only when there is
            something to save — the same two conditions the verbs-first menu
            puts on its "Save template" row, moved onto the row they are about.
          */
          {...(templateConflict === "resolve" && divergence?.templateId === menuFor
            ? {
                onResolve: () => {
                  setMenuFor(null);
                  setResolving(true);
                },
              }
            : {})}
          {...(linked?.id === menuFor && templateDirty
            ? {
                /*
                  No note under it. "Re-arranges 5 accounts" sat between two
                  menu rows reading as a heading for the one below, and the
                  confirmation it opens already says the same thing in a
                  sentence — with the number in the button.
                */
                onUpdate: () => {
                  setMenuFor(null);
                  setView("save");
                },
              }
            : {})}
          onRename={() => {
            const t = templates.find((x) => x.id === menuFor);
            if (t) {
              setRenameDraft(t.name);
              setRenamingId(t.id);
            }
            setMenuFor(null);
          }}
          onDuplicate={() => {
            /*
              Asked, not done.

              Duplicating is the one verb here that is silently additive: it
              makes a sixth row named "(copy)" and nothing else changes, so the
              press that did it and the list that grew were the only evidence
              either way. It is also the wrong half of the pair when what you
              meant was Rename — two rows apart in the same menu.
            */
            setDuplicating(menuFor);
            setMenuFor(null);
          }}
          onDelete={() => {
            // Fresh every time: a choice left over from the last deletion is a
            // choice nobody made about these accounts.
            /*
              The axis seeds which answer is offered first. "Revert" is now
              "move them to the default" — the default is a row in the picker
              like any other, which is what let the third option go.
            */
            setFate(templateDeleteMode === "revert" ? "move" : "unlink");
            setMoveTo(
              templateDeleteMode === "revert"
                ? DEFAULT_TEMPLATE_ID
                : (templates.find(
                    (t) => t.id !== menuFor && t.id !== DEFAULT_TEMPLATE_ID,
                  )?.id ?? DEFAULT_TEMPLATE_ID),
            );
            setDeleting(menuFor);
            setMenuFor(null);
          }}
          onClose={() => setMenuFor(null)}
        />
      ) : null}
      {resolving && divergence ? (
        <TemplateMessage
          kind="decision"
          label={`Diverged from ${divergence.templateName}`}
          width={420}
          onDismiss={() => setResolving(false)}
        >
          <TemplateMessageTitle
            icon={<TriangleAlert size={15} aria-hidden="true" />}
          >
            {accountName} diverged from {divergence.templateName} v
            {divergence.version}
          </TemplateMessageTitle>
          <TemplateMessageBody>
            {/*
              The collisions themselves, not a count.

              "3 conflicts" is a number you cannot act on. Which rows, and what
              each side called them, is the whole of what decides which button
              to press — so the list is the body of the dialog rather than
              something behind a disclosure.
            */}
            Both this account and the template changed the same things. Yours
            were kept.
          </TemplateMessageBody>
          <ul className="mt-[8px] flex flex-col gap-[4px]">
            {divergence.lines.map((line) => (
              <li
                key={line}
                className="flex gap-[6px] text-[12px] leading-[16px] text-nav-fg-muted"
              >
                <span aria-hidden="true" className="text-nav-fg-subtle">
                  ·
                </span>
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
          <TemplateMessageActions
            dismiss={
              <TemplateMessageButton
                onClick={() => {
                  clearDivergence(accountId);
                  notify("Kept this account's version");
                  setResolving(false);
                  onClose();
                }}
              >
                Keep mine
              </TemplateMessageButton>
            }
            actions={[
              <TemplateMessageButton
                key="split"
                icon={<CopyPlus size={13} aria-hidden="true" />}
                onClick={() => {
                  /*
                    Split off = create from what is on screen.

                    Which is exactly `onCreateTemplate`: it captures this
                    account's arrangement and links the account to the result,
                    so it stops receiving the old template's pushes. That is
                    the whole difference between this and "Keep mine", which
                    leaves the account on the template and diverging again next
                    time.
                  */
                  onCreateTemplate(`${accountName} nav`);
                  clearDivergence(accountId);
                  setResolving(false);
                  onClose();
                }}
              >
                Save as new template
              </TemplateMessageButton>,
              <TemplateMessageButton
                key="take"
                tone="primary"
                onClick={() => {
                  // Taking theirs IS applying it again — same path, same
                  // confirmation, no second way to land an arrangement.
                  onApplyTemplate(divergence.templateId);
                  clearDivergence(accountId);
                  notify(`Took ${divergence.templateName}'s version`);
                  setResolving(false);
                  onClose();
                }}
              >
                Use the template&rsquo;s
              </TemplateMessageButton>,
            ]}
          />
        </TemplateMessage>
      ) : null}
      {duplicatingTemplate ? (
        <TemplateMessage
          kind="decision"
          label={`Duplicate ${duplicatingTemplate.name}`}
          onDismiss={() => setDuplicating(null)}
        >
          <TemplateMessageTitle icon={<CopyPlus size={15} aria-hidden="true" />}>
            Duplicate {duplicatingTemplate.name}?
          </TemplateMessageTitle>
          <TemplateMessageBody>
            A second template holding the same arrangement, on no accounts. Your
            own to rename and change — {duplicatingTemplate.name} is untouched.
          </TemplateMessageBody>
          <TemplateMessageActions
            dismiss={
              <TemplateMessageButton onClick={() => setDuplicating(null)}>
                Cancel
              </TemplateMessageButton>
            }
            actions={[
              <TemplateMessageButton
                key="dup"
                tone="primary"
                onClick={() => {
                  if (duplicating) onDuplicateTemplate(duplicating);
                  setDuplicating(null);
                }}
              >
                Duplicate
              </TemplateMessageButton>,
            ]}
          />
        </TemplateMessage>
      ) : null}
      {saving ? (
        <TemplateSaveDialog
          accountName={accountName}
          linked={linked}
          templateDirty={templateDirty}
          onCreate={(name) => {
            onCreateTemplate(name);
            setSaving(false);
            onClose();
          }}
          onUpdate={(id) => {
            onUpdateTemplate(id);
            setSaving(false);
            onClose();
          }}
          onClose={() => setSaving(false)}
        />
      ) : null}
      {deletingTemplate ? (
        <TemplateMessage
          kind="decision"
          label={`Delete ${deletingTemplate.name}`}
          width={onIt === 0 ? 380 : 420}
          onDismiss={() => setDeleting(null)}
        >
          <TemplateMessageTitle icon={<Trash2 size={15} aria-hidden="true" />}>
            Delete {deletingTemplate.name}?
          </TemplateMessageTitle>
          <TemplateMessageBody>
            {onIt === 0 ? (
              <>No accounts are on it. This cannot be undone.</>
            ) : (
              <>
                <span className="font-medium text-nav-fg">
                  {onIt} {onIt === 1 ? "account is" : "accounts are"}
                </span>{" "}
                on it. {strict
                  ? `Every sub-account is on exactly one layout, so ${onIt === 1 ? "it needs" : "they need"} somewhere to go.`
                  : `Choose where ${onIt === 1 ? "it goes" : "they go"}.`}{" "}
                This cannot be undone.
              </>
            )}
          </TemplateMessageBody>
          {/*
            The count alone is not a decision.

            Deleting a template in use has three honest outcomes and the menu
            used to take one of them silently, chosen by a prototype axis the
            person deleting could not see. The axis now sets which is
            PRE-SELECTED; the choice itself is on screen, because it is about
            other people's navigation.
          */}
          {/*
            Who is on it, by name.

            The body says how many and the picker says where they go; between
            the two sits the question neither answers — which clients. Same
            control as the save dialog's, because it is the same question about
            the same kind of set.
          */}
          {onIt > 0 && deleting ? (
            <AffectedAccounts
              ids={accountsOnIds(deleting)}
              /*
                Named once a destination is chosen, so the table answers the
                dialog's own question: these accounts, off this template, onto
                that one. Before the pick there is nothing truthful to put in
                the column.
              */
              {...(moveTo
                ? {
                    to:
                      templates.find((t) => t.id === moveTo)?.name ??
                      "HighLevel default",
                  }
                : {})}
            />
          ) : null}
          {onIt > 0 && strict ? (
            /*
              One question, and it has to be answered.

              `local-edits` can leave an account holding a nav that belongs to
              no template, so deleting offers that as one of two outcomes. Here
              it is not a state that exists: the only thing a delete can do is
              move them, and the only decision left is where. So there is no
              radio pair and nothing is pre-selected — a mandatory choice with a
              default answer is a dismissible warning wearing a radio.
            */
            <div className="mt-[10px] flex flex-col gap-[4px]">
              {/*
                A visible label, and the same word the table under it uses.

                The picker carried its name in `aria-label` only, so the one
                mandatory decision in the dialog was an unlabelled control
                reading "Choose a template" — which is a placeholder, not a
                question. "New template" is what the column beneath it is
                headed, so the choice and its consequence are named the same
                thing rather than each inventing their own.
              */}
              <span className="text-[11px] leading-[15px] font-medium text-nav-fg-subtle">
                New template
              </span>
              <TemplatePicker
                label={onIt === 1 ? "Move it to" : `Move all ${onIt} to`}
                value={moveTo}
                options={movableTemplates}
                onChange={setMoveTo}
              />
            </div>
          ) : onIt > 0 ? (
            <div className="mt-[10px] flex flex-col gap-[2px]">
              {(
                [
                  ["unlink", "Keep their nav, stop updates"],
                  ["move", "Move them to another template"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={fate === value}
                  disabled={value === "move" && movableTemplates.length === 0}
                  onClick={() => setFate(value)}
                  className={cn(
                    "motion-tap flex items-center gap-[8px] rounded-[7px] px-[8px] py-[7px] text-left text-[12.5px] leading-[16px]",
                    "disabled:pointer-events-none disabled:opacity-40",
                    fate === value
                      ? "bg-nav-hover text-nav-fg"
                      : "text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-[14px] shrink-0 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_var(--nav-fg-subtle)]",
                      fate === value && "bg-nav-fg",
                    )}
                  >
                    {fate === value ? (
                      <span className="size-[5px] rounded-full bg-nav" />
                    ) : null}
                  </span>
                  {label}
                </button>
              ))}
              {fate === "move" ? (
                <div className="mt-[4px] ml-[30px]">
                  <TemplatePicker
                    label="Move them to"
                    value={moveTo}
                    options={movableTemplates}
                    onChange={setMoveTo}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
          <TemplateMessageActions
            dismiss={
              <TemplateMessageButton onClick={() => setDeleting(null)}>
                Cancel
              </TemplateMessageButton>
            }
            actions={[
              <TemplateMessageButton
                key="delete"
                tone="primary"
                disabled={strict && onIt > 0 && moveTo === ""}
                onClick={() => {
                  const id = deleting;
                  if (!id) return;
                  const ids = accountsOnIds(id);
                  const moving = strict ? moveTo !== "" : fate === "move" && moveTo !== "";
                  if (onIt > 0 && moving) {
                    /*
                      Moving them means moving them.

                      `reassign` only re-points the link, which left every
                      account still wearing the deleted template's arrangement
                      and claiming to be on a different one — including the
                      account you were looking at, whose nav did not move.

                      The default is a destination like any other in the picker,
                      and the one that cannot be landed as an arrangement: it
                      means "whatever this tenant ships with", so those accounts
                      are reset and left on no template at all.
                    */
                    if (moveTo === DEFAULT_TEMPLATE_ID) {
                      revertAccounts(
                        ids,
                        `Reset to default — ${deletingTemplate.name} deleted`,
                      );
                      for (const accountId of ids) unlink(accountId);
                    } else {
                      onApplyTemplateTo(ids, moveTo);
                      reassign(id, moveTo);
                    }
                  }
                  remove(id);
                  notify(
                    onIt > 0 && (strict ? moveTo !== "" : fate === "move")
                      ? `Deleted ${deletingTemplate.name} — ${onIt} moved to ${templates.find((t) => t.id === moveTo)?.name ?? "another template"}`
                      : `Deleted ${deletingTemplate.name}`,
                  );
                  setDeleting(null);
                }}
              >
                {/*
                  Names the whole action, not half of it.

                  "Delete template" beside a radio that also moves five accounts
                  describes the smaller half of what the button does. Three
                  words at most: past that it stops being a label and starts
                  being the sentence the body already carried.
                */}
                {onIt === 0 || (!strict && fate === "unlink")
                  ? "Delete template"
                  : moveTo === DEFAULT_TEMPLATE_ID
                    ? "Reset and delete"
                    : "Move and delete"}
              </TemplateMessageButton>,
            ]}
          />
        </TemplateMessage>
      ) : null}
    </div>,
    document.body,
  );
}

/** A drilled-in view: its own title, and the way back. */
function Drill({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="motion-tap mb-[2px] flex h-[26px] shrink-0 items-center gap-[5px] rounded-[7px] px-[5px] text-left text-nav-fg-muted hover:bg-nav-hover hover:text-nav-fg"
      >
        <ChevronLeft size={14} aria-hidden="true" className="shrink-0" />
        <span className="truncate text-[11px] leading-none font-semibold tracking-[0.4px] uppercase">
          {title}
        </span>
      </button>
      <div className="flex flex-col">{children}</div>
    </>
  );
}

function Rule() {
  return (
    <span
      aria-hidden="true"
      className="my-[4px] h-px w-full shrink-0 bg-nav-divider"
    />
  );
}

function MenuRow({
  icon: Icon,
  label,
  note,
  checked,
  branch = false,
  disabled = false,
  bare = false,
  tickLeads = false,
  action,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  /** The current answer, or what the row means. Second line, quieter. */
  note?: string;
  /** Ticked, for the rows that are a choice rather than an action. */
  checked?: boolean;
  /** Opens another view rather than acting, so it gets a chevron. */
  branch?: boolean;
  /** Nothing to act on. The row stays, and its note says why. */
  disabled?: boolean;
  /** Draws no fill of its own — the wrapper above carries it. See `action`. */
  bare?: boolean;
  /**
   * The leading slot becomes the tick rather than a glyph.
   *
   * For the template list, where every row carried the same generic
   * `LayoutTemplate` mark — six identical icons down a column, distinguishing
   * nothing, while the one mark that DID mean something sat at the far end of
   * the row. The tick moves into the slot the icons were wasting, and a row
   * that is not selected simply leaves it empty so the names still line up.
   */
  tickLeads?: boolean;
  /**
   * A second verb on the row, revealed on hover.
   *
   * Its own element rather than a prop on the main button, because a button
   * inside a button is invalid and the browser resolves it by ignoring one of
   * them — which reads as a control that works everywhere except where you
   * pressed it.
   */
  /**
   * The trailing control on the row.
   *
   * Handed its own element, because what it opens now is a menu and a menu has
   * to hang off the button that opened it.
   */
  action?: {
    icon: LucideIcon;
    label: string;
    onSelect: (el: HTMLElement) => void;
  };
  onSelect: () => void;
}) {
  if (action) {
    const { icon: ActionIcon, label: actionLabel, onSelect: onAction } = action;
    return (
      /*
        The fill moves to the WRAPPER, and the row inside it draws none.

        The two used to be siblings, each with its own hover: the row lit up and
        the ⋯ sat outside the lit area, as if it belonged to whatever was next
        in the list. A trailing control that is part of the row has to be inside
        the thing that says which row you are on — so the selected and hover
        states live out here now, and the button within is transparent.
      */
      <span
        className={cn(
          "group/row motion-tap flex items-center gap-[2px] rounded-[7px] pr-[4px]",
          checked ? "bg-nav-hover" : "hover:bg-nav-hover",
        )}
      >
        <MenuRow
          icon={Icon}
          label={label}
          {...(note ? { note } : {})}
          {...(checked === undefined ? {} : { checked })}
          branch={branch}
          disabled={disabled}
          bare
          tickLeads={tickLeads}
          onSelect={onSelect}
        />
        <button
          type="button"
          aria-label={actionLabel}
          title={actionLabel}
          onClick={(e) => onAction(e.currentTarget)}
          className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 hover:bg-nav-active hover:text-nav-fg"
        >
          <ActionIcon size={13} aria-hidden="true" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      role={checked === undefined ? undefined : "menuitemradio"}
      aria-checked={checked}
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "motion-tap flex w-full items-start gap-[8px] rounded-[7px] px-[7px] py-[6px] text-left",
        disabled
          ? "cursor-not-allowed opacity-40"
          : bare
            ? ""
            : checked
              ? "bg-nav-hover"
              : "hover:bg-nav-hover",
      )}
    >
      {tickLeads ? (
        <span
          aria-hidden="true"
          className="mt-[2px] flex size-[14px] shrink-0 items-center justify-center"
        >
          {checked ? <Check size={13} className="text-nav-fg" /> : null}
        </span>
      ) : (
        <Icon
          size={14}
          aria-hidden="true"
          className="mt-[2px] shrink-0 text-nav-fg-subtle"
        />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] leading-[17px] font-medium text-nav-fg">
          {label}
        </span>
        {note ? (
          <span className="block truncate text-[11px] leading-[15px] text-nav-fg-subtle">
            {note}
          </span>
        ) : null}
      </span>
      {checked && !tickLeads ? (
        <Check size={13} aria-hidden="true" className="mt-[2px] shrink-0 text-nav-fg" />
      ) : branch && !disabled ? (
        <ChevronRight
          size={13}
          aria-hidden="true"
          className="mt-[2px] shrink-0 text-nav-fg-subtle"
        />
      ) : null}
    </button>
  );
}
