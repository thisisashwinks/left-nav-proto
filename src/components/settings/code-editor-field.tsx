"use client";

import * as React from "react";
import { Copy, Check, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The custom-code editor, as production draws it.
 *
 * A gutter of line numbers, a copy button, an expand handle, and a monospace
 * field. Deliberately a textarea underneath rather than a real editor: the
 * subject of this prototype is the navigation, and syntax highlighting would
 * buy a truer screenshot at the price of a dependency that has nothing to do
 * with the argument being made. Ashwin picked this explicitly over pulling an
 * editor in.
 *
 * The gutter scrolls with the field. That is the only fiddly part — two
 * elements showing one scroll position — and it is worth doing rather than
 * faking a single line number, because the seeded code is twenty lines long
 * and a gutter stuck at "1" is the kind of detail that makes a reviewer
 * distrust everything else on the page.
 */
export function CodeEditorField({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = React.useState(false);
  const [big, setBig] = React.useState(false);
  const areaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = React.useRef<HTMLDivElement | null>(null);

  /*
   * At least one line, always. An empty field still shows "1" — the editor
   * is a place code goes, and a gutter with nothing in it reads as broken.
   */
  const lines = Math.max(1, value.split("\n").length);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* Clipboard is permission-gated; failing silently beats an alert. */
    }
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[8px] bg-pg shadow-[inset_0_0_0_1px_var(--pg-border)]",
        disabled && "opacity-60",
      )}
    >
      <div className="flex">
        {/*
          The gutter. aria-hidden because the line numbers are decoration —
          a screen reader meeting them would hear the digits read out between
          every line of code.
        */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="shrink-0 overflow-hidden bg-pg-surface py-[9px] pr-[10px] pl-[12px] text-right font-mono text-[12.5px] leading-[20px] text-pg-faint select-none shadow-[inset_-1px_0_0_0_var(--pg-border)]"
          style={{ height: big ? 480 : 220 }}
        >
          {Array.from({ length: lines }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>

        <textarea
          ref={areaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          // Two elements, one scroll position. See the note above.
          onScroll={(e) => {
            if (gutterRef.current) {
              gutterRef.current.scrollTop = e.currentTarget.scrollTop;
            }
          }}
          aria-label={label}
          placeholder={placeholder}
          disabled={disabled}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          className="min-w-0 flex-1 resize-none bg-transparent py-[9px] pr-[44px] pl-[11px] font-mono text-[12.5px] leading-[20px] text-pg-text outline-none placeholder:text-pg-faint"
          style={{ height: big ? 480 : 220 }}
        />
      </div>

      {/* Copy, top right — production's position. */}
      <button
        type="button"
        onClick={copy}
        disabled={disabled}
        aria-label={copied ? "Copied" : `Copy ${label}`}
        className="motion-tap absolute top-[8px] right-[8px] flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading active:scale-95"
      >
        {copied ? (
          <Check size={14} aria-hidden="true" className="text-pg-heading" />
        ) : (
          <Copy size={14} aria-hidden="true" />
        )}
      </button>

      {/* And expand, bottom right. */}
      <button
        type="button"
        onClick={() => setBig((v) => !v)}
        disabled={disabled}
        aria-label={big ? `Collapse ${label}` : `Expand ${label}`}
        aria-pressed={big}
        className="motion-tap absolute right-[8px] bottom-[8px] flex size-[26px] items-center justify-center rounded-[6px] text-pg-muted hover:bg-pg hover:text-pg-heading active:scale-95"
      >
        {big ? (
          <Minimize2 size={14} aria-hidden="true" />
        ) : (
          <Maximize2 size={14} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
