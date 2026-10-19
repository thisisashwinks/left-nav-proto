/**
 * Group separator. The Pencil file wraps a 1px line in a frame padded
 * 7px 8px 8px 8px, which is what gives the asymmetric spacing above/below.
 */
export function NavDivider() {
  return (
    <div
      role="separator"
      className="flex w-full shrink-0 items-start pt-[7px] pr-[8px] pb-[8px] pl-[8px]"
    >
      {/* Shortens to the bar's centred 32px when collapsed. See motion.css. */}
      <div data-nav-rule="" className="h-px flex-1 bg-nav-divider" />
    </div>
  );
}
