interface BrandMarkProps {
  src?: string;
  alt: string;
}

/**
 * The account logo slot.
 *
 * The slot geometry matches left-nav.pen exactly: a 116px-wide box inside a
 * 222x26 clipped container. When a real image is supplied it is rendered
 * 116x36 and cover-cropped, which is what the design does; the built-in
 * placeholder is drawn at the visible 26px height so it is not cropped.
 *
 * The Pencil file uses a third-party brand image as a stand-in for whatever
 * the account has uploaded. Pass `src` to point this at a real asset.
 */
export function BrandMark({ src, alt }: BrandMarkProps) {
  if (src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="h-[36px] w-[116px] shrink-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${src})` }}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={alt}
      className="flex h-[26px] w-[116px] shrink-0 items-center gap-[7px]"
    >
      <svg
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
        className="size-[20px] shrink-0"
        aria-hidden="true"
      >
        <rect width="20" height="20" rx="5" className="fill-nav-fg" />
        <path
          d="M6.2 14.4 10 5.6l3.8 8.8h-2.1l-.72-1.76H9.02L8.3 14.4H6.2Zm3.42-3.28h.76L10 9.3l-.38 1.82Z"
          className="fill-nav"
        />
      </svg>
      <span className="text-[14px] leading-none font-semibold tracking-[0.12em] whitespace-nowrap text-nav-fg">
        ACME
      </span>
    </div>
  );
}
