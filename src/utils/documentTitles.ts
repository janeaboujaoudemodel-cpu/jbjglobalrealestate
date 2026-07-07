const NOISE_WORDS = new Set([
  "final",
  "finalll",
  "finale",
  "finall",
  "latest",
  "last",
  "new",
  "copy",
  "draft",
  "revised",
  "revision",
  "rev",
  "version",
  "ver",
  "pdf",
]);

const ACRONYMS = new Set(["pdf", "spa", "uae", "uaq", "dld", "g", "m", "bnb"]);

export function cleanDocumentTitle(rawName: string | null | undefined, fallback = "Document"): string {
  const raw = (rawName || fallback || "Document").trim();
  let cleaned = decodeURIComponent(raw)
    .replace(/\?.*$/, "")
    .replace(/\.[a-z0-9]{2,6}$/i, "")
    .replace(/[()[\]{}]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const tokens = cleaned.split(" ").filter(Boolean);
  while (tokens.length) {
    const last = tokens[tokens.length - 1].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!last || NOISE_WORDS.has(last) || /^v?\d{1,3}$/.test(last)) {
      tokens.pop();
      continue;
    }
    break;
  }

  cleaned = tokens
    .filter((token) => {
      const normalized = token.toLowerCase().replace(/[^a-z0-9]/g, "");
      return normalized && !NOISE_WORDS.has(normalized) && !/^v\d{1,3}$/.test(normalized);
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) cleaned = fallback;

  return cleaned
    .split(" ")
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      if (/^[a-z]\d*$/i.test(word) && word.length <= 2) return word.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ")
    .replace(/\bCiti Buddy\b/i, "Citi Buddy")
    .replace(/\bAmrah\b/i, "Amrah")
    .trim();
}