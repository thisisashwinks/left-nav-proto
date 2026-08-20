/**
 * The dropdown caret: a small solid triangle, not a stroked chevron.
 *
 * A hairline chevron at 11–14px reads as a decorative tick rather than "this
 * opens" — it is the same weight as the text beside it, so it disappears into
 * the label. A filled caret is the platform convention for a menu trigger and
 * survives being that small, which is why every dropdown affordance in the
 * header and the page title uses this instead of `ChevronDown`.
 *
 * Disclosure rows inside a list keep the stroked chevron: those indicate state
 * on a row you are reading, not a control you are about to open.
 */
export function CaretDown({
  size = 12,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M6 8.4 2.9 4.9h6.2L6 8.4Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
