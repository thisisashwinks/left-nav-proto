/**
 * Colour conversion for the accent picker.
 *
 * Its own module because the picker needs round-tripping in four notations and
 * a saturation/brightness board needs HSV specifically — none of which belongs
 * in a component, and all of which is worth being able to reason about (and
 * fix) without opening any JSX.
 *
 * Everything here is alpha-free on purpose. The accent lands on buttons,
 * selected rows and focus rings, and the panel measures its contrast against
 * the nav surface; a translucent accent would make that number a guess. See the
 * picker's own note.
 */

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

/** Hue 0-360, saturation and value 0-100 — the board's own coordinates. */
export interface Hsv {
  h: number;
  s: number;
  v: number;
}

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

/** Colour notations the picker can read and write. See COLOR_FORMATS. */
export const COLOR_FORMATS = ["HEX", "RGB", "HSL", "HSB"] as const;

export type ColorFormat = (typeof COLOR_FORMATS)[number];

const clamp = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

const hex2 = (n: number) =>
  clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");

/**
 * Accepts `#abc`, `#aabbcc` and the same without the hash.
 *
 * Returns null rather than a fallback colour: the input field needs to know the
 * difference between "not a colour yet" and "black", or every partially typed
 * value would slam the board to the corner mid-keystroke.
 */
export function parseHex(input: string): Rgb | null {
  const v = input.trim().replace(/^#/, "");
  if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v)) return null;
  const full =
    v.length === 3
      ? v
          .split("")
          .map((c) => c + c)
          .join("")
      : v;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255] as const;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : (d / max) * 100, v: max * 100 };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const sn = s / 100;
  const vn = v / 100;
  const c = vn * sn;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = vn - c;

  const [r1, g1, b1] =
    hh < 1
      ? [c, x, 0]
      : hh < 2
        ? [x, c, 0]
        : hh < 3
          ? [0, c, x]
          : hh < 4
            ? [0, x, c]
            : hh < 5
              ? [x, 0, c]
              : [c, 0, x];

  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255] as const;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const sn = s / 100;
  const ln = l / 100;
  const c = (1 - Math.abs(2 * ln - 1)) * sn;
  const hh = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  const m = ln - c / 2;

  const [r1, g1, b1] =
    hh < 1
      ? [c, x, 0]
      : hh < 2
        ? [x, c, 0]
        : hh < 3
          ? [0, c, x]
          : hh < 4
            ? [0, x, c]
            : hh < 5
              ? [x, 0, c]
              : [c, 0, x];

  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

const round = (n: number) => Math.round(n);

/** A hex rendered in the notation the format dropdown is showing. */
export function formatColor(hex: string, format: ColorFormat): string {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  if (format === "RGB") {
    return `rgb(${round(rgb.r)}, ${round(rgb.g)}, ${round(rgb.b)})`;
  }
  if (format === "HSL") {
    const { h, s, l } = rgbToHsl(rgb);
    return `hsl(${round(h)}, ${round(s)}%, ${round(l)}%)`;
  }
  if (format === "HSB") {
    const { h, s, v } = rgbToHsv(rgb);
    return `hsb(${round(h)}, ${round(s)}%, ${round(v)}%)`;
  }
  return hex.toUpperCase();
}

/**
 * Read a typed value in whatever notation the field is set to.
 *
 * Lenient about shape — `rgb(1,2,3)`, `1 2 3` and `1, 2, 3` all parse — because
 * the field is for pasting a brand value out of a spec, and specs are written
 * by people rather than by CSS.
 */
export function parseColor(input: string, format: ColorFormat): string | null {
  const text = input.trim();
  if (format === "HEX") {
    const rgb = parseHex(text);
    return rgb ? rgbToHex(rgb) : null;
  }

  const nums = text.match(/-?\d+(\.\d+)?/g)?.map(Number);
  if (!nums || nums.length < 3) return null;
  const [a, b, c] = nums as [number, number, number];

  if (format === "RGB") {
    if ([a, b, c].some((n) => n < 0 || n > 255)) return null;
    return rgbToHex({ r: a, g: b, b: c });
  }
  if ([b, c].some((n) => n < 0 || n > 100)) return null;
  if (format === "HSL") return rgbToHex(hslToRgb({ h: a, s: b, l: c }));
  return rgbToHex(hsvToRgb({ h: a, s: b, v: c }));
}
