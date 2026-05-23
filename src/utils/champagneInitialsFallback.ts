/**
 * Branded broken-image fallback: champagne tile with project/brand initials.
 * Returns inline SVG data URIs. Results are memoized.
 */

const cache = new Map<string, string>();

const STOPWORDS = new Set([
  "the", "a", "an", "of", "and", "or", "by", "for", "to", "in", "on", "at",
  "image", "photo", "picture", "cover", "gallery", "thumbnail", "logo",
]);

export function getInitialsFromAlt(alt?: string | null): string {
  if (!alt) return "JBJ";
  // strip emoji + non-letter chars, keep letters/digits/space
  const cleaned = alt
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();
  if (!cleaned) return "JBJ";
  const words = cleaned.split(/\s+/).filter((w) => !STOPWORDS.has(w.toLowerCase()));
  const source = words.length ? words : cleaned.split(/\s+/);
  const initials = source.slice(0, 3).map((w) => w[0]?.toUpperCase() ?? "").join("");
  return (initials || "JBJ").slice(0, 3);
}

export interface ChampagneFallbackOpts {
  alt?: string | null;
  initials?: string;
  width?: number;
  height?: number;
}

export function buildChampagneInitialsDataUri(opts: ChampagneFallbackOpts = {}): string {
  const initials = (opts.initials || getInitialsFromAlt(opts.alt)).slice(0, 3);
  const w = Math.max(64, Math.round(opts.width || 400));
  const h = Math.max(64, Math.round(opts.height || 300));
  const key = `${initials}|${w}|${h}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const min = Math.min(w, h);
  const fontSize = Math.round(min * (initials.length === 1 ? 0.5 : initials.length === 2 ? 0.38 : 0.3));
  const stroke = 1;
  const inset = 0.5;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice"><rect width="${w}" height="${h}" fill="#F7F2EA"/><rect x="${inset}" y="${inset}" width="${w - 1}" height="${h - 1}" fill="none" stroke="#B89555" stroke-opacity="0.4" stroke-width="${stroke}"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central" font-family="Inter, system-ui, -apple-system, sans-serif" font-weight="600" font-size="${fontSize}" fill="#1A1A1A" letter-spacing="${Math.round(fontSize * 0.04)}">${initials}</text></svg>`;

  const uri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  cache.set(key, uri);
  return uri;
}
