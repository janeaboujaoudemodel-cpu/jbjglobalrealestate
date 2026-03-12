/**
 * Centralized content sanitizer for stripping HTML tags, competitor references,
 * and source attribution from user-facing content.
 */

// Blocked competitor domains and names
const BLOCKED_DOMAINS = [
  'providentestate.com',
  'provident.ae',
  'reelly.io',
  'reelly.com',
  'reelly.ai',
];

const BLOCKED_NAMES_REGEX = /\b(Provident\s*Estate|Provident|Reelly)\b/gi;

const ATTRIBUTION_REGEX = /\b(source\s*:|extracted\s+from|via\s+|reference\s+link\s*:|data\s+from\s*:)\s*/gi;

const BLOCKED_URL_REGEX = new RegExp(
  `https?://[^\\s"'<>)]*(?:${BLOCKED_DOMAINS.map(d => d.replace(/\./g, '\\.')).join('|')})[^\\s"'<>)]*`,
  'gi'
);

/**
 * Strip all HTML tags from text, preserving inner text content.
 */
export function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Remove competitor URLs from text.
 */
export function stripCompetitorUrls(text: string): string {
  return text.replace(BLOCKED_URL_REGEX, '');
}

/**
 * Remove competitor name mentions from text.
 */
export function stripCompetitorNames(text: string): string {
  return text.replace(BLOCKED_NAMES_REGEX, '');
}

/**
 * Remove source attribution patterns.
 */
export function stripAttribution(text: string): string {
  return text.replace(ATTRIBUTION_REGEX, '');
}

/**
 * Full sanitization for plain-text display contexts (cards, snippets, truncated previews).
 * Strips HTML, competitor refs, attribution, and cleans whitespace.
 */
export function sanitizeForDisplay(text: string | null | undefined): string {
  if (!text) return '';
  let clean = text;
  // Strip HTML tags first (preserves inner text)
  clean = stripHtmlTags(clean);
  // Remove competitor URLs
  clean = stripCompetitorUrls(clean);
  // Remove competitor names
  clean = stripCompetitorNames(clean);
  // Remove attribution patterns
  clean = stripAttribution(clean);
  // Clean up leftover artifacts
  clean = clean
    .replace(/\(\s*\)/g, '')        // empty parens
    .replace(/\[\s*\]/g, '')        // empty brackets
    .replace(/\s{2,}/g, ' ')        // multiple spaces
    .replace(/\n{3,}/g, '\n\n')     // excessive newlines
    .trim();
  return clean;
}

/**
 * Sanitize HTML content for rich display (detail pages).
 * Converts competitor <a> tags to plain text, removes competitor refs.
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';
  let clean = html;
  // Convert <a> tags pointing to blocked domains into their inner text
  const blockedDomainPattern = BLOCKED_DOMAINS.map(d => d.replace(/\./g, '\\.')).join('|');
  const anchorRegex = new RegExp(
    `<a\\s+[^>]*href=["'][^"']*(?:${blockedDomainPattern})[^"']*["'][^>]*>(.*?)</a>`,
    'gi'
  );
  clean = clean.replace(anchorRegex, '$1');
  // Remove competitor URLs in text
  clean = stripCompetitorUrls(clean);
  // Remove competitor names
  clean = stripCompetitorNames(clean);
  // Remove attribution
  clean = stripAttribution(clean);
  // Clean whitespace
  clean = clean.replace(/\s{2,}/g, ' ').trim();
  return clean;
}
