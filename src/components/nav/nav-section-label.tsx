/**
 * Section heading, e.g. "RECENT". Padding 2px 8px 6px 8px in the Pencil file,
 * 11px semibold with 0.4px tracking, always uppercased.
 *
 * Presentational only — the group's flyout is opened by the "More" row beneath
 * it, not by the label.
 */
export function NavSectionLabel({ text }: { text: string }) {
  return (
    <div className="flex w-full shrink-0 items-start justify-between pt-[2px] pr-[8px] pb-[6px] pl-[8px]">
      {/*
        Explicit 13px line-height, not `normal`: as a flex item the span is
        blockified and takes its 14px font box rather than the 13px line box
        Pencil lays out, which would make the row 1px too tall.
      */}
      <span className="text-[11px] leading-[13px] font-semibold tracking-[0.4px] whitespace-nowrap text-nav-fg-subtle uppercase">
        {text}
      </span>
    </div>
  );
}
