/**
 * The colours a logo is made of (Nov 20).
 *
 * Feeds two things: the theme suggestions ("Suggested from your logo") and
 * the initials avatar's background when an agency has a full logo but no
 * square icon. Read off pixels, so it works the same for the seeded SVGs and
 * for an uploaded PNG's data URL.
 *
 * Method: draw at 64px, drop transparent pixels, bucket the rest by 4 bits a
 * channel, and rank the buckets by count. Near-white and near-black lose to
 * anything with colour in it — a logo's white ground and black text say
 * nothing about its brand — but come back when they are all there is.
 * Buckets that land within a short distance of a better one fold into it,
 * so one orange drawn with anti-aliased edges reads as one colour, not five.
 */

const cache = new Map<string, Promise<string[]>>();

export function logoColors(src: string): Promise<string[]> {
  let p = cache.get(src);
  if (!p) {
    p = read(src).catch(() => []);
    cache.set(src, p);
  }
  return p;
}

const hex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

function read(src: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const w = 64;
      const h = Math.max(1, Math.round((64 * (img.naturalHeight || 64)) / (img.naturalWidth || 64)));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(rank(ctx.getImageData(0, 0, w, h).data));
    };
    img.onerror = reject;
    img.src = src;
  });
}

interface Bucket {
  n: number;
  r: number;
  g: number;
  b: number;
}

function rank(px: Uint8ClampedArray): string[] {
  const buckets = new Map<number, Bucket>();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3]! < 128) continue;
    const r = px[i]!, g = px[i + 1]!, b = px[i + 2]!;
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4);
    const k = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    k.n += 1;
    k.r += r;
    k.g += g;
    k.b += b;
    buckets.set(key, k);
  }
  const all = [...buckets.values()].map((k) => {
    const r = k.r / k.n, g = k.g / k.n, b = k.b / k.n;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const light = (max + min) / 510;
    const chroma = (max - min) / 255;
    const plain = chroma < 0.12 || light > 0.93 || light < 0.08;
    return { n: k.n, r, g, b, plain };
  });
  const coloured = all.filter((c) => !c.plain);
  const pool = (coloured.length ? coloured : all).sort((a, b) => b.n - a.n);

  const picked: typeof pool = [];
  for (const c of pool) {
    const near = picked.find(
      (p) => Math.hypot(p.r - c.r, p.g - c.g, p.b - c.b) < 64,
    );
    if (near) continue;
    picked.push(c);
    if (picked.length === 3) break;
  }
  return picked.map((c) => hex(c.r, c.g, c.b));
}
