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
  EllipsisVertical,
  Trash2,
  FilePlus2,
  SquareMenu,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import {
  TemplateMessage,
  TemplateMessageActions,
  TemplateMessageBody,
  TemplateMessageButton,
  TemplateMessageTitle,
} from "./template-message";
import { TemplateRowMenu } from "./template-row-menu";
import { useNavLayout } from "./nav-layout-provider";
import {
  NAV_GENERATIONS,
  NAV_GENERATION_LABELS,
  type NavGeneration,
} from "@/design/theme";
import { cn } from "@/lib/utils";
import { useAnchored } from "@/lib/use-anchored";
import { useNavTemplates } from "./nav-templates";

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

type View = "root" | "apply" | "save" | "create" | "layout" | "navigation";

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
  } = useNavTemplates();
  const { revertAccounts } = useNavLayout();
  const { templateDeleteMode } = effective;
  const [view, setView] = React.useState<View>("root");
  const [draft, setDraft] = React.useState(`${accountName} nav`);
  /** Which row's kebab is open, and the button it hangs off. */
  const [menuFor, setMenuFor] = React.useState<string | null>(null);
  const [menuAt, setMenuAt] = React.useState<HTMLElement | null>(null);
  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [renameDraft, setRenameDraft] = React.useState("");
  /** The template a delete confirmation is open for. */
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const deletingTemplate = deleting
    ? (templates.find((t) => t.id === deleting) ?? null)
    : null;
  const onIt = deleting ? accountsOn(deleting) : 0;
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
  const linked = linkedFor(accountId);

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
                  onSelect={() => {
                    onApplyTemplate(t.id);
                    onClose();
                  }}
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
                      icon={<CopyPlus size={13} aria-hidden="true" />}
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
        */}
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
          onRename={() => {
            const t = templates.find((x) => x.id === menuFor);
            if (t) {
              setRenameDraft(t.name);
              setRenamingId(t.id);
            }
            setMenuFor(null);
          }}
          onDuplicate={() => {
            if (menuFor) onDuplicateTemplate(menuFor);
            setMenuFor(null);
          }}
          onDelete={() => {
            setDeleting(menuFor);
            setMenuFor(null);
          }}
          onClose={() => setMenuFor(null)}
        />
      ) : null}
      {deletingTemplate ? (
        <TemplateMessage
          kind="decision"
          label={`Delete ${deletingTemplate.name}`}
          onDismiss={() => setDeleting(null)}
        >
          <TemplateMessageTitle icon={<Trash2 size={15} aria-hidden="true" />}>
            Delete {deletingTemplate.name}?
          </TemplateMessageTitle>
          <TemplateMessageBody>
            {/*
              What happens to the accounts on it, in accounts — the one fact
              that decides whether to press the button. See
              TEMPLATE_DELETE_MODES for why there are two answers.
            */}
            {onIt === 0 ? (
              <>No accounts are on it. This cannot be undone.</>
            ) : templateDeleteMode === "revert" ? (
              <>
                <span className="font-medium text-nav-fg">
                  {onIt} {onIt === 1 ? "account goes" : "accounts go"}
                </span>{" "}
                back to the default navigation. This cannot be undone.
              </>
            ) : (
              <>
                <span className="font-medium text-nav-fg">
                  {onIt} {onIt === 1 ? "account keeps" : "accounts keep"}
                </span>{" "}
                the navigation {onIt === 1 ? "it has" : "they have"} and stops
                receiving updates. This cannot be undone.
              </>
            )}
          </TemplateMessageBody>
          <TemplateMessageActions
            dismiss={
              <TemplateMessageButton onClick={() => setDeleting(null)}>
                Keep it
              </TemplateMessageButton>
            }
            actions={[
              <TemplateMessageButton
                key="delete"
                tone="primary"
                onClick={() => {
                  const id = deleting;
                  if (!id) return;
                  if (templateDeleteMode === "revert") {
                    revertAccounts(
                      accountsOnIds(id),
                      `Reverted to default — ${deletingTemplate.name} deleted`,
                    );
                  }
                  remove(id);
                  notify(`Deleted ${deletingTemplate.name}`);
                  setDeleting(null);
                }}
              >
                Delete template
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
      <span className="group/row flex items-center gap-[2px]">
        <MenuRow
          icon={Icon}
          label={label}
          {...(note ? { note } : {})}
          {...(checked === undefined ? {} : { checked })}
          branch={branch}
          disabled={disabled}
          onSelect={onSelect}
        />
        <button
          type="button"
          aria-label={actionLabel}
          title={actionLabel}
          onClick={(e) => onAction(e.currentTarget)}
          className="motion-tap flex size-[26px] shrink-0 items-center justify-center rounded-[6px] text-nav-fg-subtle opacity-0 group-hover/row:opacity-100 focus-visible:opacity-100 hover:bg-nav-hover hover:text-nav-fg"
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
          : checked
            ? "bg-nav-hover"
            : "hover:bg-nav-hover",
      )}
    >
      <Icon
        size={14}
        aria-hidden="true"
        className="mt-[2px] shrink-0 text-nav-fg-subtle"
      />
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
      {checked ? (
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
