/**
 * Section heading, e.g. "RECENT". Padding 2px 8px 6px 8px in the Pencil file,
 * 11px semibold with 0.4px tracking, always uppercased.
 */
export function NavSectionLabel({ text }: { text: string }) {
  return (
    <div className="flex w-full shrink-0 items-start justify-between pt-[2px] pr-[8px] pb-[6px] pl-[8px]">
      <span className="text-[11px] leading-[normal] font-semibold tracking-[0.4px] whitespace-nowrap text-nav-fg-subtle uppercase">
        {text}
      </span>
    </div>
  );
}
