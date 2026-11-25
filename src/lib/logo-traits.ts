/**
 * What kind of file a full logo is (Nov 25, 2026) — for the prototype
 * control "Fix logo edge cases".
 *
 * People don't read upload guidelines, so the header handles the common bad
 * files itself:
 *  - `aspect`    tall, portrait, or square logos render tiny in a 22px row.
 *  - `opaqueBg`  a logo saved on its own solid box (a JPG, a white plate).
 *  - `ink`       the logo's own pixels (not its box), to test contrast
 *                against whatever the sidebar is painted.
 *
 * Read off pixels, so it works the same for SVGs and uploaded PNG/JPG data
 * URLs. Cached per src.
 */

export interface LogoTraits {
  aspect: number;
  opaqueBg: boolean;
  /** Background colour when `opaqueBg`. */
  bg: [number, number, number] | null;
  /** Relative luminance of each sampled ink pixel, 0–1. */
  ink: number[];
}

const cache = new Map<string, Promise<LogoTraits | null>>();

export function logoTraits(src: string): Promise<LogoTraits | null> {
  let p = cache.get(src);
  if (!p) {
    p = read(src).catch(() => null);
    cache.set(src, p);
  }
  return p;
}

export function luminance(r: number, g: number, b: number): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrast(a: number, b: number): number {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * True when most of the logo's ink is too close to the surface to read
 * (a white logo on a white sidebar, a navy one on a navy sidebar).
 */
export function lowContrast(traits: LogoTraits, surfaceLum: number): boolean {
  if (traits.opaqueBg || traits.ink.length === 0) return false;
  const faint = traits.ink.filter((l) => contrast(l, surfaceLum) < 1.6).length;
  return faint / traits.ink.length > 0.6;
}

/** Mean ink luminance — which way the plate should go. */
export function inkLuminance(traits: LogoTraits): number {
  return traits.ink.length ? traits.ink.reduce((a, b) => a + b, 0) / traits.ink.length : 0;
}

/** Resolve any CSS colour (hex, rgb, oklch, color-mix) to rgb via a canvas. */
export function cssColorToRgb(css: string): [number, number, number] | null {
  if (!css) return null;
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0]!, d[1]!, d[2]!];
}

function read(src: string): Promise<LogoTraits | null> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const nw = img.naturalWidth || 300, nh = img.naturalHeight || 100;
      const w = 120;
      const h = Math.max(1, Math.round((w * nh) / nw));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return resolve(null);
      ctx.drawImage(img, 0, 0, w, h);
      const d = ctx.getImageData(0, 0, w, h).data;
      const at = (x: number, y: number) => (y * w + x) * 4;

      let opaque = 0;
      for (let i = 3; i < d.length; i += 4) if (d[i]! > 240) opaque++;
      const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
      const cornersOpaque = corners.every((i) => d[i + 3]! > 240);
      const opaqueBg = cornersOpaque && opaque / (w * h) > 0.9;
      const bg: [number, number, number] | null = opaqueBg
        ? [0, 1, 2].map((k) => corners.reduce((s, i) => s + d[i + k]!, 0) / 4) as [number, number, number]
        : null;

      const ink: number[] = [];
      for (let i = 0; i < d.length; i += 4) {
        if (d[i + 3]! < 128) continue;
        const r = d[i]!, g = d[i + 1]!, b = d[i + 2]!;
        if (bg && Math.hypot(r - bg[0], g - bg[1], b - bg[2]) < 40) continue;
        ink.push(luminance(r, g, b));
      }
      resolve({ aspect: nw / nh, opaqueBg, bg, ink });
    };
    img.onerror = reject;
    img.src = src;
  });
}
