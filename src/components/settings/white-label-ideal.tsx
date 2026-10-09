"use client";

import * as React from "react";
import { useTheme } from "@/components/theme/theme-provider";
import { useLabs } from "./labs-state";
import { accounts as ALL_ACCOUNTS } from "@/components/accounts/accounts-data";
import { useCustomCode } from "./custom-code-store";
import { CodeEditorField } from "./code-editor-field";
import { Section } from "./white-label-parts";
import { cn } from "@/lib/utils";

/**
 * The ideal state: code grouped by the navigation it is written for.
 *
 * Every other approach on this page is a way of coping with one set of
 * custom-code fields having to serve two navigations. This one stops coping.
 * Each navigation gets its own CSS and its own JS, in its own group, headed
 * with the navigation's name and the number of sub-accounts it reaches. There
 * is no toggle, because there is no longer a question to answer — code
 * written for the old sidebar stays on the old sidebar, and the new one gets
 * code written for it.
 *
 * WHICH GROUP APPEARS. One at a time, off the Labs switch — Ashwin, Oct 9.
 * Switchyard off, and the page is the old navigation’s: CSS, JS and the
 * theme. Switchyard on, and it is the new navigation’s: CSS and JS. Never
 * both.
 *
 * The first cut drew both whenever the fleet was mixed, on the grounds that a
 * rollout is the state an agency spends months in. That was the wrong read of
 * the page. White Label is the AGENCY’s settings, and the agency is on one
 * navigation at a time; two groups asked them to hold a fleet-wide rollout in
 * their head in order to edit their own CSS. The switch they already threw in
 * Labs is the answer, so this just reads it.
 *
 * The cost is worth naming: with Switchyard on, the old navigation’s code is
 * off screen while sub-accounts may still be running it. It is not deleted
 * and it comes back the moment the switch does — but it is not visible here,
 * and a rollout page in Labs is the right place to surface that, not this one.
 *
 * THE THEME TRAVELS WITH THE OLD GROUP. It is a property of the old sidebar
 * and always was. Putting it inside that group rather than in a section of
 * its own says so without a sentence, and when the last account leaves the
 * old navigation the picker leaves with it rather than sitting there
 * explaining that it no longer does anything.
 */

export function WhiteLabelIdealCode() {
  return <NavCodeGroups />;
}

/**
 * The two groups, each in production's section shell with its own Save.
 *
 * The whole-tab redesign draws the same two groups and the same editors but
 * NOT this shell — it has one Save for the page, so a group cannot carry a
 * button of its own. The leaves are shared (`CodeBlock`, `ThemeChoice`) and
 * the shells are not, which is the honest split: the two options disagree
 * about the page, not about the idea.
 */
export function NavCodeGroups() {
  const labs = useLabs();
  const code = useCustomCode();

  /*
   * `agencyOn` is the agency's own Switchyard switch in Labs, which is the
   * one this page answers to. `accountOn` is the per-sub-account rollout and
   * would be the wrong question here: it would make the agency's own CSS
   * editor change shape because a client they administer moved.
   */
  if (labs.agencyOn) {
    const newCount = ALL_ACCOUNTS.filter((a) => labs.accountOn(a.id)).length;
    return <NewNavGroup code={code} count={newCount} />;
  }

  return <OldNavGroup code={code} count={ALL_ACCOUNTS.length} />;
}

/** "2 sub-accounts", or "1 sub-account". */
function reach(n: number): string {
  return `${n} sub-account${n === 1 ? "" : "s"}`;
}

/**
 * The old navigation's code, and its theme.
 *
 * This is the agency's existing work, untouched and still running. Nothing
 * here warns, qualifies or asks for a decision — the code is where it has
 * always been and does what it has always done. That is the whole argument
 * for this shape: the awkward conversation the other approaches have to hold
 * only exists because one field was being asked to serve two navigations.
 */
function OldNavGroup({
  code,
  count,
}: {
  code: ReturnType<typeof useCustomCode>;
  count: number;
}) {
  const { navTheme, setNavTheme } = useTheme();

  const [css, setCss] = React.useState(code.css);
  const [js, setJs] = React.useState(code.js);
  const [theme, setTheme] = React.useState(navTheme);

  // The picker is also driven from the prototype's own controls; adjust
  // during render rather than in an effect, which would paint the stale
  // draft first and correct it after.
  const [seen, setSeen] = React.useState(navTheme);
  if (seen !== navTheme) {
    setSeen(navTheme);
    setTheme(navTheme);
  }

  const dirty = css !== code.css || js !== code.js || theme !== navTheme;

  return (
    <Section
      title="Old navigation"
      sub={`${reach(count)} · CSS, JS, and theme`}
      dirty={dirty}
      onCancel={() => {
        setCss(code.css);
        setJs(code.js);
        setTheme(navTheme);
      }}
      onSave={() => {
        code.setCss(css);
        code.setJs(js);
        setNavTheme(theme);
      }}
    >
      {/*
        Three fields, three sub-sections.

        They were stacked on one gap, which read as one long form rather than
        as CSS, then JS, then the theme — three separate things an agency
        edits on separate days. A rule and a name above each is the cheapest
        way to say where one ends; `Part` carries the rule for every block
        after the first so the group does not open with a stray line.
      */}
      <div className="flex flex-col">
        <Part title="Custom CSS" first>
          <CodeEditorField label="Custom CSS" value={css} onChange={setCss} />
        </Part>
        <Part title="Custom JS">
          <CodeEditorField label="Custom JS" value={js} onChange={setJs} />
        </Part>
        <Part title="Theme">
          <ThemeChoice value={theme} onChange={setTheme} />
        </Part>
      </div>
    </Section>
  );
}

/**
 * The new navigation's code, written against the new navigation.
 *
 * Empty to begin with, and that emptiness is accurate: this is the future
 * state in which the support exists, not one in which the agency's old code
 * has been migrated for them. Nobody can write Switchyard CSS before
 * Switchyard ships, so an agency arriving here has a blank field and a
 * sidebar that is simply unstyled — which is the honest worst case, and a far
 * better one than the half-applied theme every other approach produces.
 *
 * No theme picker. The new navigation ships light and has no dark variant, so
 * there is nothing to choose; saying that out loud in a disabled control
 * would be a sentence about an absence. The group just does not have one.
 */
function NewNavGroup({
  code,
  count,
}: {
  code: ReturnType<typeof useCustomCode>;
  count: number;
}) {
  const [css, setCss] = React.useState(code.newCss);
  const [js, setJs] = React.useState(code.newJs);

  const dirty = css !== code.newCss || js !== code.newJs;

  return (
    <Section
      title="New navigation"
      sub={`${reach(count)} · CSS and JS`}
      dirty={dirty}
      onCancel={() => {
        setCss(code.newCss);
        setJs(code.newJs);
      }}
      onSave={() => {
        code.setNewCss(css);
        code.setNewJs(js);
      }}
    >
      <div className="flex flex-col">
        <Part title="Custom CSS" first>
          <CodeEditorField label="Custom CSS" value={css} onChange={setCss} />
        </Part>
        <Part title="Custom JS">
          <CodeEditorField label="Custom JS" value={js} onChange={setJs} />
        </Part>
      </div>
    </Section>
  );
}

/**
 * One named sub-section inside a group.
 *
 * The rule sits ABOVE the heading rather than below the block before it, so
 * adding or removing a part never leaves a line with nothing under it — and
 * `first` suppresses it, because a group's own header is already the line
 * above the first part.
 */
function Part({
  title,
  hint,
  first = false,
  children,
}: {
  title: string;
  hint?: string;
  first?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-[8px]",
        first ? "" : "mt-[20px] border-t border-pg-border pt-[20px]",
      )}
    >
      <div>
        <p className="text-[13px] leading-[18px] font-medium text-pg-heading">
          {title}
        </p>
        {hint ? (
          <p className="mt-[2px] text-[12px] leading-[17px] text-pg-muted">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** A labelled editor, for the whole-tab redesign's own grouping. */
export function CodeBlock({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-[6px]">
      <span className="text-[13px] leading-[18px] font-medium text-pg-text">
        {label}
      </span>
      <CodeEditorField label={label} value={value} onChange={onChange} />
    </div>
  );
}

/** Production's two theme cards, at the size a sub-field can carry. */
export function ThemeChoice({
  value,
  onChange,
}: {
  value: "light" | "dark";
  onChange: (v: "light" | "dark") => void;
}) {
  return (
    <div className="flex flex-wrap gap-[12px]">
      {(["light", "dark"] as const).map((t) => (
        <label
          key={t}
          className="flex min-w-[200px] flex-1 cursor-pointer flex-col gap-[8px]"
        >
          <span className="flex items-center gap-[8px]">
            <input
              type="radio"
              name="wl-ideal-theme"
              checked={value === t}
              onChange={() => onChange(t)}
              className="size-[16px] accent-[var(--brand)]"
            />
            <span className="text-[14px] font-medium text-pg-heading">
              {t === "light" ? "Light" : "Dark"}
            </span>
          </span>
          <span
            className={cn(
              "flex h-[96px] overflow-hidden rounded-[8px]",
              value === t
                ? "shadow-[0_0_0_2px_var(--brand)]"
                : "shadow-[inset_0_0_0_1px_var(--pg-border)]",
            )}
          >
            <span
              className={cn(
                "w-[60px] shrink-0",
                t === "light" ? "bg-[#f8fafc]" : "bg-[#101828]",
              )}
            />
            <span className="min-w-0 flex-1 bg-pg" />
          </span>
        </label>
      ))}
    </div>
  );
}
