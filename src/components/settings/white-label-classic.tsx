"use client";

import * as React from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { useCustomCode } from "./custom-code-store";
import { CodeEditorField } from "./code-editor-field";
import { Section } from "./white-label-parts";
import { cn } from "@/lib/utils";

/**
 * White label, left as production has it — plus one checkbox.
 *
 * The other approaches on this page all rearrange the custom-code settings to
 * make the two-navigation problem legible. This one refuses to. Custom JS,
 * Custom CSS and Theme stay exactly where an agency last saw them: three
 * separate sections, three separate Save buttons, each owning its own slice
 * of one form. Nothing is grouped, nothing is gated, nothing is explained in
 * a new place.
 *
 * What it adds is the smallest honest change: a sentence on each description
 * saying the setting reaches the old navigation only for now, and one section
 * of its own at the top holding the opt-in. Ashwin, Oct 9.
 *
 * The case for it is shipping cost. It touches three strings and adds one
 * checkbox, so it cannot break a page every agency uses daily and needs no
 * re-learning. The case against is that it never says the two navigations
 * exist until you read the fine print under a heading you have scrolled past
 * a hundred times — and the checkbox that matters most sits above the code it
 * governs, with nothing between them to connect the two.
 *
 * Both halves of that are worth seeing, which is why it is drawn rather than
 * argued about.
 */

/**
 * The chip the code sections carry.
 *
 * Custom CSS and JS keep production's description word for word — the
 * fields do the same thing they always did — and the fact that the new
 * navigation is not covered yet is a notice beside them, not a clause
 * inside them. Ashwin, Oct 9.
 *
 * The copy has to finish the heading rather than stand alone. "New
 * navigation coming soon" reads as though the NAVIGATION were the thing
 * arriving, which is the opposite of true — it is already here, and this
 * field is what has not caught up. Read as a continuation of the title it
 * sits under, "Custom JS — coming soon for the new navigation" says exactly
 * what is missing without naming the field twice.
 */
const SOON = "Coming soon for the new navigation";

/** The theme picker's scope, which is a limit rather than a wait. */
const THEME_SCOPE = "Old navigation only for now.";

export function WhiteLabelClassic() {
  const code = useCustomCode();

  return (
    <>
      <NewNavOptIn code={code} />
      <CustomJsSection code={code} />
      <CustomCssSection code={code} />
      <ClassicThemeSection />
    </>
  );
}

/**
 * The opt-in, as a section of its own.
 *
 * Its own card and its own Save, because that is this approach's whole
 * grammar: one section, one decision, one button. Putting the checkbox inside
 * the Custom CSS card would have been tidier and would also have been a
 * different approach — it would imply the choice is about CSS, when it
 * governs the JS and the theme too.
 *
 * Sitting above the three sections it governs is deliberate and is also its
 * weakness. A reader meets the decision before they have seen the code it
 * applies to, which is the opposite order from the one the grouped approach
 * uses. Shown rather than fixed.
 */
function NewNavOptIn({ code }: { code: ReturnType<typeof useCustomCode> }) {
  const [draft, setDraft] = React.useState(code.onNewNav);
  const dirty = draft !== code.onNewNav;

  return (
    <Section
      title="New navigation"
      sub="Where your customizations apply"
      dirty={dirty}
      onCancel={() => setDraft(code.onNewNav)}
      onSave={() => code.setOnNewNav(draft)}
    >
      <label className="flex cursor-pointer items-start gap-[10px]">
        <input
          type="checkbox"
          checked={draft}
          onChange={(e) => setDraft(e.target.checked)}
          className="mt-[2px] size-[16px] shrink-0 accent-[var(--brand)]"
        />
        <span className="min-w-0">
          <span className="block text-[14px] leading-[20px] text-pg-text">
            Run the same custom CSS and JS on the new navigation
          </span>
          <span className="mt-[2px] block text-[13px] leading-[18px] text-pg-muted">
            Your code was written for the old navigation, so turning this on
            may break it.
          </span>
        </span>
      </label>
    </Section>
  );
}

/** Custom JS — production's section, with the scope sentence added. */
function CustomJsSection({ code }: { code: ReturnType<typeof useCustomCode> }) {
  const [draft, setDraft] = React.useState(code.js);
  const dirty = draft !== code.js;

  return (
    <Section
      title="Custom JS"
      sub="Customize the platform with JS."
      tag={SOON}
      dirty={dirty}
      onCancel={() => setDraft(code.js)}
      onSave={() => code.setJs(draft)}
    >
      <CodeEditorField label="Custom JS" value={draft} onChange={setDraft} />
    </Section>
  );
}

/** Custom CSS — production's section, with the scope sentence added. */
function CustomCssSection({ code }: { code: ReturnType<typeof useCustomCode> }) {
  const [draft, setDraft] = React.useState(code.css);
  const dirty = draft !== code.css;

  return (
    <Section
      title="Custom CSS"
      sub="Customize the platform with CSS."
      tag={SOON}
      dirty={dirty}
      onCancel={() => setDraft(code.css)}
      onSave={() => code.setCss(draft)}
    >
      <CodeEditorField label="Custom CSS" value={draft} onChange={setDraft} />
    </Section>
  );
}

/**
 * Theme — production's picker, with the scope sentence added.
 *
 * Drafted like the others rather than applied on click. In production the
 * theme is a form field with a Save under it, and this approach's whole claim
 * is that it leaves production's shape alone, so a picker that took effect
 * immediately would be a different approach wearing this one's description.
 */
function ClassicThemeSection() {
  const { navTheme, setNavTheme } = useTheme();
  const [draft, setDraft] = React.useState(navTheme);

  /*
   * The picker is also driven from the prototype's own controls, so a change
   * made there has to show up here rather than being silently overwritten by
   * a stale draft the next time this card is saved.
   *
   * Adjusted during render rather than in an effect: an effect would paint
   * the stale draft first and then correct it, and React treats this exact
   * shape as the supported way to reset state from a value above it.
   */
  const [seen, setSeen] = React.useState(navTheme);
  if (seen !== navTheme) {
    setSeen(navTheme);
    setDraft(navTheme);
  }

  const dirty = draft !== navTheme;

  return (
    <Section
      title="Theme"
      sub={`Choose the sidebar theme. ${THEME_SCOPE}`}
      dirty={dirty}
      onCancel={() => setDraft(navTheme)}
      onSave={() => setNavTheme(draft)}
    >
      <div className="flex flex-wrap gap-[16px]">
        {(["light", "dark"] as const).map((t) => (
          <label
            key={t}
            className="flex min-w-[220px] flex-1 cursor-pointer flex-col gap-[8px]"
          >
            <span className="flex items-center gap-[8px]">
              <input
                type="radio"
                name="wl-classic-theme"
                checked={draft === t}
                onChange={() => setDraft(t)}
                className="size-[16px] accent-[var(--brand)]"
              />
              <span className="text-[14px] font-medium text-pg-heading">
                {t === "light" ? "Light Theme" : "Dark Theme"}
              </span>
            </span>
            <span
              className={cn(
                "flex h-[130px] overflow-hidden rounded-[8px]",
                draft === t
                  ? "shadow-[0_0_0_2px_var(--brand)]"
                  : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
              )}
            >
              <span
                className={cn(
                  "w-[76px] shrink-0",
                  t === "light" ? "bg-[#f8fafc]" : "bg-[#101828]",
                )}
              />
              <span className="min-w-0 flex-1 bg-pg" />
            </span>
          </label>
        ))}
      </div>
    </Section>
  );
}
