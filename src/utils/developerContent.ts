import { sanitizeForDisplay } from "@/utils/contentSanitizer";

const UNSAFE_DEVELOPER_COPY = /\b(404|page\s+not\s+found|returned\s+(?:a\s+)?(?:'|")?404|returned\s+.*error|time\s+of\s+extraction|inquiry\s+metadata|provident\s+estate|reelly)\b/i;

const VERIFIED_DEVELOPER_COPY: Record<string, string> = {
  "majid-al-futtaim":
    "Majid Al Futtaim is a Dubai-headquartered group founded in 1992, with real estate and community development activity including landmark destinations and residential communities such as Tilal Al Ghaf.",
};

/**
 * Market sources sometimes deliver a multilingual map instead of plain text, e.g.
 * `{'en': "...", 'tr': "...", 'az': "..."}`. Public pages must only ever render the
 * English string — never the raw map.
 */
export function extractEnglishCopy(raw?: string | null): string {
  const text = (raw || "").trim();
  if (!text) return "";
  if (!/^[[{]/.test(text)) return text;
  const asJson = (value: string) => {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const map = parsed as Record<string, unknown>;
        const pick = map.en ?? map.EN ?? map["en-US"] ?? Object.values(map)[0];
        return typeof pick === "string" ? pick.trim() : "";
      }
    } catch {
      return "";
    }
    return "";
  };
  // Straight JSON first, then Python-style single-quoted maps.
  const direct = asJson(text);
  if (direct) return direct;
  const requoted = asJson(text.replace(/'([A-Za-z-]{2,10})'\s*:/g, '"$1":').replace(/:\s*'((?:[^'\\]|\\.)*)'/g, (_m, inner) => `: ${JSON.stringify(String(inner).replace(/\\'/g, "'"))}`));
  if (requoted) return requoted;
  // Last resort: pull the English value out with a regex.
  const match = text.match(/['"]en['"]\s*:\s*['"]([\s\S]*?)['"]\s*(?:,\s*['"][a-z-]{2,10}['"]\s*:|[}\]]\s*$)/i);
  return match ? match[1].trim() : "";
}

export function hasUnsafeDeveloperCopy(text?: string | null) {
  return !!text && UNSAFE_DEVELOPER_COPY.test(text);
}

export function getSafeDeveloperDescription(developer: {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
}) {
  const slug = developer.slug || "";
  const clean = sanitizeForDisplay(extractEnglishCopy(developer.description));
  if (clean && !hasUnsafeDeveloperCopy(clean)) return clean;
  if (VERIFIED_DEVELOPER_COPY[slug]) return VERIFIED_DEVELOPER_COPY[slug];
  // LOCKED (no placeholder status copy): never surface "profile information is
  // being verified" on a public card or page — the slot stays silent instead.
  return "";
}
