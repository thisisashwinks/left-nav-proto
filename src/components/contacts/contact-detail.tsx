"use client";

import * as React from "react";
import { useNoPageCanvas } from "@/components/shell/page-canvas";
import {
  ArrowLeft,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Mail,
  Merge,
  MessageSquare,
  Phone,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { PageHeader } from "@/components/page/page-header";
import { ToneAvatar } from "@/components/page/avatar";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type Contact } from "./contacts-data";
import { useRecordCrumb } from "@/components/page/record-crumb";
import { PanelRail, RECORD_PANELS, RecordPanelDrawer } from "./record-panels";
import { ContactRecordCard } from "./contact-record-card";
import { ContactConversation } from "./contact-conversation";






/**
 * The record's status, as a pill.
 *
 * Lifted out of the header on Sep 22 because D-D needs the same pill the full
 * header drew: the two record shapes disagree about the NAME, not about how a
 * status looks, and two copies of this markup would have drifted the first
 * time one of them was tweaked.
 */
/**
 * The record's own way out, drawn beside whatever names the record.
 *
 * Icon-only and 24px: it sits next to a heading in both variants, and a
 * labelled "Back to contacts" button there would outweigh the thing it is
 * standing beside. The label lives in the tooltip and the accessible name,
 * which is where a control this conventional can afford to keep it.
 */
function BackToList({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      title="Back to contacts"
      aria-label="Back to contacts"
      className="motion-tap flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg-bg hover:text-pg-text-strong"
    >
      <ArrowLeft size={15} aria-hidden="true" />
    </button>
  );
}

function StatusPill({ status }: { status: Contact["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-[5px] rounded-[6px] bg-pg-surface px-[8px] text-[12px] leading-[normal] font-medium shadow-[inset_0_0_0_1px_var(--pg-border)]",
        status === "subscribed"
          ? "text-[var(--pg-status-subscribed-fg)]"
          : "text-[var(--pg-status-inquiry-fg)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-[6px] rounded-full",
          status === "subscribed"
            ? "bg-[var(--pg-status-subscribed-dot)]"
            : "bg-[var(--pg-status-inquiry-dot)]",
        )}
      />
      {STATUS_LABELS[status]}
    </span>
  );
}

/**
 * Who the record belongs to, as a control.
 *
 * In the strip this is the one field that earns page level: owner is the
 * question asked ABOUT a record from outside it ("whose is this?"), and the
 * answer is a reassignment, not a read. It repeats the owner field in the
 * panel, which is fine in a way repeating the NAME is not — a duplicated
 * control still only has one value, whereas a duplicated title is just the
 * same word three times.
 */
function OwnerChip({ name }: { name: string }) {
  return (
    <button
      type="button"
      aria-label={`Owner: ${name}`}
      className="flex h-[28px] shrink-0 items-center gap-[6px] rounded-[7px] px-[8px] text-pg-text shadow-[inset_0_0_0_1px_var(--pg-border)] motion-tap hover:shadow-[inset_0_0_0_1px_var(--pg-border-strong)]"
    >
      <ToneAvatar name={name} tone="teal" size={18} />
      <span className="max-w-[140px] truncate text-[12.5px] leading-none">
        {name}
      </span>
      <ChevronDown size={12} aria-hidden="true" className="shrink-0 text-pg-faint" />
    </button>
  );
}



/**
 * A contact, committed to.
 *
 * Three columns, and each is a different kind of thing: the record's own
 * fields on the left, whichever facet you asked for in the middle, and the
 * rail on the right for aspects you dip into without leaving. The middle is
 * the only one the view bar governs, which is the honest arrangement — the
 * fields do not change when you switch facet, so they must not move.
 */
export function ContactDetail({
  contact,
  onBack,
  onPrev,
  onNext,
  position,
  siblings,
  onOpenSibling,
  onDelete,
}: {
  contact: Contact;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  position?: string;
  /**
   * The other contacts in the lit smart list, for the trail's last crumb.
   *
   * The same set the pager walks, handed in by the page that owns the cut —
   * this component is given one contact and could not otherwise know whether
   * its siblings are the smart list's 40 or the account's 4,000. See
   * `RecordCrumb.options`.
   */
  siblings?: { id: string; name: string }[];
  onOpenSibling?: (id: string) => void;
  /** Runs after the Delete contact modal confirms; the page removes the row. */
  onDelete: () => void;
}) {
  // A row of column cards: each column is its own canvas.
  useNoPageCanvas();
  /*
   * The record page's header is off by default.
   *
   * Everything it carried has a better home: the trail names the record, the
   * pager sits on the card that holds the record's own fields, and the
   * actions belong to the panes that own them. What was left was a title
   * repeating the crumb above it. The knob keeps the full header one click
   * away, because the question is worth showing both ways.
   */
  const { effective } = useTheme();
  /*
   * The three record shapes, all of them on the picker (Sep 23).
   *
   * D-B is what ships: nothing between the bar and the record, so this page
   * draws no row of its own at all.
   *
   * D-D is the argument against it: one row that carries what the panel and
   * the trail cannot ask of the page — the record's state, who owns it, and
   * the actions on the record as a whole.
   *
   * D-A is the full header — the same slot 05 a list page draws, with the
   * record's name in it. It was `recordPageHeader` until today: a toggle at the
   * foot of the section that only did anything under D-B, which meant the
   * picker offered two answers while the page had three and the third looked
   * like it was missing. It is a variant now, read the same way as the other
   * two, and the toggle is gone rather than kept beside it.
   */
  const metaStrip = effective.recordHeaderVariant === "D-D";
  /*
   * The page's own exit, independent of which shape is on.
   *
   * Independent because the argument is about the trail versus the page, not
   * about the strip versus the panel — so turning it off has to take both
   * placements with it, or the knob would only mean something in one variant.
   */
  const backButton = effective.recordBackButton;
  /*
   * The full header, which is now simply one of the three answers.
   *
   * Mutually exclusive with the strip by construction rather than by a guard:
   * a variant is one value, so two page headers on one record — the state the
   * old `!metaStrip &&` existed to prevent — is no longer reachable.
   */
  const fullHeader = effective.recordHeaderVariant === "D-A";
  /*
   * Where that exit stands, once it exists.
   *
   * Split out of the on/off knob on Sep 23 on Ashwin's ask, because until then
   * the VARIANT chose the placement and the knob only chose whether to draw
   * it — which made "back button on" a statement about D-B versus D-D rather
   * than about the exit, and left the trail placement unarguable since no
   * variant offered it. The three readings now sit side by side under one
   * switch, which is the only way to find out which of them is right.
   *
   * `header` is the one placement that can have nowhere to go: under D-B the
   * record draws no row of its own at all. In that state this draws NOTHING — deliberately, and not by falling back to the
   * inline spot. A silent fallback would mean the picker said "header" while
   * the canvas showed the inline answer, and the comparison the axis exists
   * for would be quietly reading the wrong variant. The panel's Note already
   * warns that this placement "only exists while the record draws a header";
   * an empty result is that sentence being true, not a bug.
   *
   * `crumb` draws nothing here on purpose: the app bar's trail carries the
   * control in that mode, and a page that also drew one would put two exits
   * on screen — the exact duplication the whole axis is trying to settle.
   */
  const backPlace = effective.recordBackPlace;
  const headerBack =
    backButton && backPlace === "header" && (metaStrip || fullHeader);
  /*
   * Inline means the first column's heading row in BOTH variants.
   *
   * It used to mean "wherever the strip isn't", which is why the old reading
   * was `backButton && !metaStrip`: D-D unconditionally took the exit up into
   * the strip. With a placement axis that is no longer the strip's call to
   * make — someone asking for the canvas placement while running D-D is
   * asking precisely to see the strip WITHOUT it.
   */
  const inlineBack = backButton && backPlace === "inline";
  /*
   * One set of record actions, drawn by whichever shape is on.
   *
   * Three secondaries is exactly PageHeader's ladder budget once a primary is
   * declared, so all three keep a button and a fourth would collapse the lot
   * into the kebab. The page does not get to decide that; PageHeader does —
   * and it has to decide it the same way in both variants, or the strip and
   * the header stop being two answers to the same question.
   */
  const secondary = [
    { label: "Call", icon: Phone },
    { label: "Message", icon: MessageSquare },
    { label: "Email", icon: Mail },
  ];
  const primary = { label: "Add to workflow", icon: Plus };
  const overflow = [
    { label: "Add tag", icon: Tag },
    { label: "Merge contact", icon: Merge },
    { label: "Delete contact", icon: Trash2, danger: true },
  ];
  /*
   * The third column is furniture, not a drawer.
   *
   * On the record page this column is always there — the rail beside it picks
   * WHICH aspect it shows, the way a tab strip does, so there is nothing to
   * dismiss and no shadow to cast. The same panels open as an overlay on the
   * list, because there they arrive over a page that was already complete.
   */
  const [panel, setPanel] = React.useState("activity");
  // The record page IS the contact card, so the rail drops that panel here.
  const panels = RECORD_PANELS.filter((p) => p.id !== "contact");
  /*
   * Contacts ▸ Smart lists ▸ Jatin. Leaving by any crumb above it closes the
   * record.
   *
   * Both readings, because the page is the only thing that knows it opened a
   * CONTACT — the tuning panel's `recordCrumbLabel` chooses between "Jatin"
   * and "Contact details" in the shell, and a noun list living up there would
   * be the shell keeping a private catalogue of what every page contains.
   * "Contact details" rather than "Contact": the crumb names the screen you
   * are on, the way every other crumb in the trail does, and "Contact" would
   * read as a filter of the list above it.
   */
  /*
   * And the siblings, so the last crumb is a switcher like every other.
   *
   * Which makes `crumbLeaf` mean something here: the caret, the dots and the
   * page-title menu all need a menu to carry, and until Sep 28 this crumb
   * had none — so three of the five values drew plain text on the one kind
   * of page where the sideways move is most useful. Walking 40 contacts by
   * the pager is 39 clicks; the menu is one.
   */
  useRecordCrumb(
    {
      name: contact.name,
      kind: "Contact details",
      ...(siblings && onOpenSibling
        ? {
            options: siblings.map((c) => ({
              id: c.id,
              label: c.name,
              selected: c.id === contact.id,
            })),
            onSelect: onOpenSibling,
          }
        : {}),
    },
    onBack,
  );

  /*
   * The card's heading row stays here, not in the card: the back button's
   * placement is this page's axis (see `inlineBack`), and the pager is the
   * list's, so the card is handed a finished row rather than both knobs.
   */
  const heading = (
    <div className="flex items-center gap-[8px] pt-[11px]">
      {/*
        The inline placement, and now the only thing that draws here:
        the heading row is the first place a hand already down in the
        record can reach, which is the whole case for it. It no longer
        defers to D-D's strip — the strip and this row are two answers
        to one question, and the axis above is where that question is
        now asked. Only one of them can be true at a time, so the two
        exits 60px apart the old reading was guarding against cannot
        occur.
      */}
      {inlineBack ? <BackToList onBack={onBack} /> : null}
      <span className="min-w-0 flex-1 truncate text-[13px] leading-none font-semibold text-pg-heading">
        Contact details
      </span>
      {position ? (
        <>
          <span className="shrink-0 text-[12px] leading-none whitespace-nowrap text-pg-muted tabular-nums">
            {position}
          </span>
          <button
            type="button"
            aria-label="Previous contact"
            onClick={onPrev}
            disabled={!onPrev}
            className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-text-strong motion-tap hover:bg-pg-bg disabled:text-pg-disabled disabled:hover:bg-transparent"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next contact"
            onClick={onNext}
            disabled={!onNext}
            className="flex size-[24px] shrink-0 items-center justify-center rounded-[6px] text-pg-text-strong motion-tap hover:bg-pg-bg disabled:text-pg-disabled disabled:hover:bg-transparent"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </>
      ) : null}
    </div>
  );

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-[14px] px-[var(--page-inset)]">
      {metaStrip ? (
        /*
         * D-D — the compact meta strip.
         *
         * 52px, full-bleed to the canvas edges so the rule under it reads as a
         * strip belonging to the page rather than as a card with no fill. The
         * height is the row's own, not PageHeader's 34px: the strip has to be
         * worth its space at a glance or the variant has already lost.
         */
        <div className="mx-[calc(var(--page-inset)*-1)] flex h-[52px] shrink-0 items-center gap-[8px] border-b border-pg-head-border px-[var(--page-inset)]">
          {/*
            Leading edge of the strip: navigation, before any of the record's
            own state. The strip reads left to right as "out of here, then what
            this is, then what you can do to it". This IS the header placement
            under D-D — the strip is the record's own header row, so there is
            nowhere else on it the exit could mean.
          */}
          {headerBack ? <BackToList onBack={onBack} /> : null}
          <div className="flex min-w-0 flex-1 flex-col">
            <PageHeader
              /*
               * `chrome="own"` — the strip is switched by the variant picker
               * above it, not by the global page-header axis.
               *
               * Without this the whole strip went empty the moment anyone
               * picked a variant whose chrome is `noHeader` (D-B itself, L-E,
               * K-C), because `setHeaderVariant` writes that into the shared
               * `pageHeader` knob and PageHeader returned null. The status,
               * the owner and every action vanished while the 52px rule stayed
               * — a strip with nothing in it, caused by a picker for a
               * different page kind. Ashwin hit the same root cause on the
               * record header knob on Sep 23.
               */
              chrome="own"
              /*
               * The record's name is NOT passed in.
               *
               * This is the whole point of D-D. The trail already names the
               * record and the panel names it again beside the avatar; a strip
               * that named it a third time would be the thing this variant was
               * built to disprove. Withholding it here rather than relying on
               * the title knob being off means the failure cannot come back by
               * accident when someone hand-edits the knobs afterwards — the
               * empty string is the seam where PageHeader's required `title`
               * meets a header that has no title to give it.
               */
              title=""
              status={<StatusPill status={contact.status} />}
              /*
               * Owner rides in `aside` — "anything the page needs left of the
               * buttons" — rather than being stuffed into `status`. It is a
               * control, so it belongs on the commitment side of the row with
               * the other controls; the pill on the left is a read.
               */
              aside={<OwnerChip name="Samrina Shabha" />}
              secondary={secondary}
              primary={primary}
              overflow={overflow}
            />
          </div>
        </div>
      ) : null}

      {fullHeader ? (
        <PageHeader
          /*
           * `chrome="own"` — the variant is this header's switch, and it has to
           * be the only one. Every picker writes the global page-header knobs
           * (see setHeaderVariant), so a record sitting under `chrome="axis"`
           * would lose its header the moment someone chose a LIST variant that
           * draws none — the picker would still say "Full page header" while
           * the canvas showed nothing, which is the failure this page already
           * had once when the switch was a checkbox.
           */
          chrome="own"
          title={contact.name}
          status={<StatusPill status={contact.status} />}
          /*
           * The header placement under D-B, in the slot that starts the row.
           * `lead` rather than a second thing crammed into `aside`: aside is
           * the commitment side, next to the pager and the buttons, and an
           * exit that sits beside "Add to workflow" is a click away from the
           * wrong one.
           */
          lead={headerBack ? <BackToList onBack={onBack} /> : undefined}
          description={`${contact.handle} · created ${contact.created} · owner Samrina Shabha`}
          /*
           * No "All contacts" button.
           *
           * The breadcrumb now carries this record as its last crumb, so the
           * trail IS the way out — and one exit that always agrees with where
           * you are beats two that can drift apart.
           */
          aside={
            position ? (
              <span className="flex shrink-0 items-center gap-[2px]">
                <button
                  type="button"
                  aria-label="Previous contact"
                  onClick={onPrev}
                  disabled={!onPrev}
                  className="flex size-[28px] items-center justify-center rounded-[7px] text-pg-text-strong motion-tap hover:bg-pg-surface disabled:text-pg-disabled disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                </button>
                <span className="text-[12.5px] leading-[normal] whitespace-nowrap text-pg-muted">
                  {position}
                </span>
                <button
                  type="button"
                  aria-label="Next contact"
                  onClick={onNext}
                  disabled={!onNext}
                  className="flex size-[28px] items-center justify-center rounded-[7px] text-pg-text-strong motion-tap hover:bg-pg-surface disabled:text-pg-disabled disabled:hover:bg-transparent"
                >
                  <ChevronRight size={15} aria-hidden="true" />
                </button>
              </span>
            ) : undefined
          }
          secondary={secondary}
          primary={primary}
          overflow={overflow}
        />
      ) : null}

      <div className="flex min-h-0 flex-1 gap-[10px] pb-[2px]">
        <ContactRecordCard contact={contact} heading={heading} onDelete={onDelete} />

        <ContactConversation contact={contact} />

        <RecordPanelDrawer panelId={panel} inline width={320} />

        <PanelRail
          panels={panels}
          activeId={panel}
          // Clicking the lit icon keeps it lit: the column cannot be emptied.
          onSelect={(id) => setPanel(id ?? panel)}
        />
      </div>
    </div>
  );
}
