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
  'bayut.com',
  'propertyfinder.ae',
  'dubizzle.com',
  'propertymonitor.ae',
  'propertymonitor.com',
  'knightfrank.ae',
  'knightfrank.com',
];

const BLOCKED_NAMES_REGEX = /\b(Provident\s*Estate|Provident|Reelly|Bayut|Property\s*Finder|Dubizzle|Property\s*Monitor|Knight\s*Frank)\b/gi;

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
/**
 * Strip boilerplate section headers that brochures dump at the start of the
 * description ("Project general facts", "Finishing and materials", etc.) so
 * the card opens with the actual narrative sentence.
 */
const BOILERPLATE_HEADERS_REGEX = new RegExp(
  '(?:^|\\.\\s+|\\n+)\\s*(?:' + [
    'Project\\s+general\\s+facts',
    'General\\s+facts',
    'Project\\s+overview',
    'Overview',
    'Finishing\\s+and\\s+materials',
    'Kitchen\\s+and\\s+appliances',
    'Furnishing',
    'Location\\s+description\\s+and\\s+benefits',
    'Location\\s+description',
    'Amenities',
    'Payment\\s+plan',
    'Handover',
  ].join('|') + ')\\s*[:\\.\\-–—]?\\s*',
  'gi'
);

export function stripBoilerplateHeaders(text: string): string {
  // Replace each header with a sentence break so surrounding prose still flows.
  return text.replace(BOILERPLATE_HEADERS_REGEX, ' ').replace(/^\s*[\.\-–—:]\s*/, '');
}

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
  // Drop brochure section headers so the description starts with real prose
  clean = stripBoilerplateHeaders(clean);
  // Clean up leftover artifacts
  clean = clean
    .replace(/\(\s*\)/g, '')        // empty parens
    .replace(/\[\s*\]/g, '')        // empty brackets
    .replace(/\s{2,}/g, ' ')        // multiple spaces
    .replace(/\n{3,}/g, '\n\n')     // excessive newlines
    .replace(/^\s*[\.\-–—:]\s*/, '') // leading punctuation left behind
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
