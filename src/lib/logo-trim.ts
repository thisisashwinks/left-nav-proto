/**
 * Making an uploaded full logo usable in a 22px nav row (Nov 23).
 *
 * Most logo files carry empty margin around the artwork — a 350×180 canvas
 * whose mark and name fill half of it. Bound to the row's height, all that
 * air is what makes the logo read tiny. `trimLogo` crops to the visible
 * pixels (transparent margin only — a logo drawn on its own coloured plate
 * keeps its plate) and hands back a high-resolution PNG.
 *
 * `logoName` reads the brand name a logo carries: an SVG's aria-label or
 * <title>, else its first line of text, else the file name. The agency's
 * initials avatar follows it.
 */

export async function trimLogo(src: string): Promise<string> {
  try {
    const img = await load(src);
    const w0 = img.naturalWidth || 360;
    const h0 = img.naturalHeight || 80;
    // Rasterise big enough to stay crisp at 2x after the crop.
    const scale = Math.min(4, Math.max(1, 1200 / w0));
    const w = Math.round(w0 * scale), h = Math.round(h0 * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return src;
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    let top = h, left = w, right = -1, bottom = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3]! > 10) {
          if (x < left) left = x;
          if (x > right) right = x;
          if (y < top) top = y;
          if (y > bottom) bottom = y;
        }
      }
    }
    if (right < 0) return src;
    const pad = Math.round(2 * scale);
    left = Math.max(0, left - pad);
    top = Math.max(0, top - pad);
    right = Math.min(w - 1, right + pad);
    bottom = Math.min(h - 1, bottom + pad);
    const cw = right - left + 1, ch = bottom - top + 1;
    // Nothing worth cropping (an opaque plate, or already tight).
    if (cw * ch > w * h * 0.94) return src;
    const out = document.createElement("canvas");
    out.width = cw;
    out.height = ch;
    out.getContext("2d")!.drawImage(canvas, left, top, cw, ch, 0, 0, cw, ch);
    return out.toDataURL("image/png");
  } catch {
    return src;
  }
}

export async function logoName(src: string, fileName?: string): Promise<string | null> {
  const svg = await svgText(src);
  if (svg) {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    const root = doc.documentElement;
    const label = root.getAttribute("aria-label") ?? doc.querySelector("title")?.textContent;
    if (label?.trim()) return tidy(label);
    const text = doc.querySelector("text")?.textContent;
    if (text?.trim()) return tidy(text);
  }
  if (fileName) {
    const base = fileName
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[-_ ]?(wordmark|logo|full|icon|square|mark|light|dark|final|v\d+|@\dx)$/gi, "")
      .replace(/[-_]+/g, " ")
      .trim();
    // File names are usually lower-case: give each word a capital.
    if (base) return tidy(base.replace(/\b[a-z]/g, (c) => c.toUpperCase()));
  }
  return null;
}

function tidy(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => (w === w.toUpperCase() && w.length > 3 ? w[0] + w.slice(1).toLowerCase() : w))
    .join(" ");
}

async function svgText(src: string): Promise<string | null> {
  try {
    if (src.startsWith("data:image/svg+xml")) {
      const [head, body = ""] = src.split(",", 2);
      return head!.includes(";base64") ? atob(body) : decodeURIComponent(body);
    }
    if (/\.svg(\?|$)/i.test(src)) {
      const r = await fetch(src);
      return r.ok ? await r.text() : null;
    }
  } catch {
    /* fall through */
  }
  return null;
}

function load(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Two letters for an avatar. Two words or more: their first letters ("Acme
 * Agency" → AA). One word: its first letter and the next consonant, which
 * reads more like the brand than the first two letters do ("Pixelforge" → PX).
 */
export function brandInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length > 1) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  const w = words[0]!;
  const next = w.slice(1).match(/[bcdfghjklmnpqrstvwxz]/i)?.[0] ?? w[1] ?? "";
  return (w[0]! + next).toUpperCase();
}
