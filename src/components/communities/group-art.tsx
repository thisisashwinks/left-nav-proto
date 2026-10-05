import type { GroupCover } from "@/components/communities/groups-store";

/**
 * Every picture on the groups screen, drawn inline from tokens.
 *
 * No image files: the covers, avatars and the empty illustration have to hold
 * up in light, dark and the tinted canvases, and a PNG cannot follow a token.
 */

/** The product's default cover — magenta/violet into amber, on the diagonal. */
const DEFAULT_GRADIENT =
  "linear-gradient(135deg, color-mix(in oklab, var(--hr-violet-500) 75%, var(--hr-error-400)) 0%, var(--hr-error-400) 52%, var(--hr-warning-400) 100%)";

/** A brand cover is always dark, whatever the theme — it is someone's artwork. */
const BRAND_NAVY =
  "linear-gradient(160deg, color-mix(in oklab, var(--hr-primary-900) 70%, var(--hr-gray-900)) 0%, var(--hr-gray-900) 100%)";

export function GroupCoverArt({ cover }: { cover: GroupCover }) {
  if (cover.kind === "upload") {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- a local data URL from the file input
      <img src={cover.src} alt="" className="size-full object-cover" />
    );
  }
  if (cover.kind === "default") {
    return <div aria-hidden="true" className="size-full" style={{ background: DEFAULT_GRADIENT }} />;
  }
  return (
    <div aria-hidden="true" className="relative size-full overflow-hidden" style={{ background: BRAND_NAVY }}>
      <span className="absolute top-[16px] left-[18px] text-[15px] leading-none font-bold tracking-[-0.2px] text-white">
        High<span style={{ color: "var(--hr-warning-400)" }}>Level</span>
      </span>
      <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        {/* Cloud */}
        <path
          d="M196 118c-14 0-24-10-24-22 0-11 9-20 20-21 4-14 17-24 32-24 16 0 29 11 32 26 11 1 20 10 20 21 0 11-9 20-21 20z"
          fill="color-mix(in oklab, white 10%, transparent)"
        />
        {/* Robot */}
        <g transform="translate(212 58)">
          <line x1="22" y1="0" x2="22" y2="10" stroke="var(--hr-warning-400)" strokeWidth="2" />
          <circle cx="22" cy="-2" r="3" fill="var(--hr-warning-400)" />
          <rect x="4" y="10" width="36" height="28" rx="8" fill="color-mix(in oklab, white 88%, transparent)" />
          <circle cx="15" cy="24" r="4" fill="var(--hr-primary-600)" />
          <circle cx="29" cy="24" r="4" fill="var(--hr-primary-600)" />
          <rect x="10" y="42" width="24" height="18" rx="5" fill="color-mix(in oklab, white 70%, transparent)" />
        </g>
        {/* Sparkles */}
        <circle cx="60" cy="130" r="2.5" fill="color-mix(in oklab, white 40%, transparent)" />
        <circle cx="110" cy="96" r="1.8" fill="color-mix(in oklab, white 30%, transparent)" />
        <circle cx="150" cy="140" r="2" fill="var(--hr-warning-400)" opacity="0.7" />
      </svg>
    </div>
  );
}

/** The default group avatar: a violet disc with interlocking rings. */
export function RingsAvatar() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="size-full">
      <circle cx="50" cy="50" r="50" fill="var(--hr-violet-500)" />
      <g fill="none" stroke="white" strokeWidth="4.5">
        <circle cx="40" cy="42" r="14" />
        <circle cx="60" cy="42" r="14" />
        <circle cx="50" cy="60" r="14" />
      </g>
    </svg>
  );
}

/** A custom avatar someone uploaded — an illustrated face. */
export function FaceAvatar() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className="size-full">
      <circle cx="50" cy="50" r="50" fill="var(--hr-warning-200)" />
      <path d="M18 100c2-20 16-30 32-30s30 10 32 30z" fill="var(--brand)" />
      <rect x="44" y="58" width="12" height="14" rx="5" fill="var(--hr-orange-200)" />
      <ellipse cx="50" cy="38" rx="22" ry="22" fill="var(--hr-gray-800)" />
      <circle cx="50" cy="44" r="17" fill="var(--hr-orange-200)" />
      <path d="M33 38c4-12 30-14 34 0-8-5-26-5-34 0z" fill="var(--hr-gray-800)" />
      <circle cx="44" cy="45" r="1.8" fill="var(--hr-gray-800)" />
      <circle cx="56" cy="45" r="1.8" fill="var(--hr-gray-800)" />
      <path d="M45 52q5 4 10 0" stroke="var(--hr-gray-800)" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** One figure: grey halo, dark head, brand-coloured shoulders. */
function Person({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const head = r * 0.3;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="color-mix(in oklab, var(--hr-gray-400) 16%, transparent)" />
      <clipPath id={`halo-${cx}`}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <g clipPath={`url(#halo-${cx})`}>
        <path
          d={`M${cx - r * 0.62} ${cy + r}c0-${r * 0.5} ${r * 0.28}-${r * 0.72} ${r * 0.62}-${r * 0.72}s${r * 0.62} ${r * 0.22} ${r * 0.62} ${r * 0.72}z`}
          fill="var(--brand)"
        />
      </g>
      <circle cx={cx} cy={cy - r * 0.12} r={head} fill="var(--hr-gray-800)" />
    </g>
  );
}

/**
 * The empty-state picture: three people and a conversation between them.
 * Transparent ground, so it sits on whatever the canvas is painted.
 */
export function CommunityIllustration() {
  return (
    <svg viewBox="0 0 360 230" aria-hidden="true" className="h-auto w-[320px] max-w-full">
      {/* Leaf swooshes */}
      <path d="M28 182c18-30 46-38 70-30-22 2-46 14-70 30z" fill="color-mix(in oklab, var(--hr-success-400) 55%, transparent)" />
      <path d="M332 70c-12-24-36-34-58-28 20 4 40 14 58 28z" fill="color-mix(in oklab, var(--hr-violet-400) 50%, transparent)" />

      <Person cx={86} cy={118} r={52} />
      <Person cx={274} cy={118} r={52} />
      <Person cx={180} cy={168} r={46} />

      {/* Chat bubble between them */}
      <g transform="translate(150 34)">
        <path
          d="M10 0h40a10 10 0 0 1 10 10v24a10 10 0 0 1-10 10H26l-10 10v-10h-6A10 10 0 0 1 0 34V10A10 10 0 0 1 10 0z"
          fill="color-mix(in oklab, var(--brand) 14%, transparent)"
          stroke="var(--brand)"
          strokeWidth="2"
        />
        <circle cx="18" cy="22" r="3" fill="var(--brand)" />
        <circle cx="30" cy="22" r="3" fill="var(--brand)" />
        <circle cx="42" cy="22" r="3" fill="var(--brand)" />
      </g>

      {/* Dots */}
      <circle cx="132" cy="44" r="4" fill="var(--hr-warning-400)" />
      <circle cx="232" cy="30" r="3" fill="var(--hr-violet-400)" />
      <circle cx="40" cy="64" r="3" fill="var(--hr-error-300)" />
      <circle cx="318" cy="196" r="4" fill="var(--hr-warning-300)" />
      <circle cx="122" cy="206" r="2.5" fill="var(--hr-gray-400)" />
    </svg>
  );
}
