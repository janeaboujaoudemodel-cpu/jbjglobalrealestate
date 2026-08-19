/**
 * URL validation for anything that ends up in `window.location`,
 * `window.open`, an `<a href>` or an `<iframe src>`.
 *
 * The pre-existing `sanitizeUrl` in `src/config/security-standards.ts` is a
 * *blocklist* (`javascript:`, `data:`, …) applied to the raw string. Blocklists
 * lose here, because the browser normalizes a URL before resolving its scheme:
 * `"javascript:alert(1)"` and `"jav\tascript:alert(1)"` both execute, yet
 * neither starts with a blocked prefix. This module instead parses the URL with
 * the same WHATWG parser the browser uses and checks the *resulting* scheme
 * against an allowlist, so anything not explicitly permitted is rejected
 * however it is spelled.
 *
 * @see src/utils/__tests__/safeUrl.test.ts
 */

/** Schemes a navigation target may use. Everything else is rejected. */
const ALLOWED_SCHEMES = new Set([
  'http:',
  'https:',
  'mailto:',
  'tel:',
  'sms:',
]);

/**
 * Schemes allowed only for resources this document created itself — an object
 * URL for a generated PDF or an exported image. Off unless `allowBlob` is set.
 */
const RESOURCE_SCHEMES = new Set(['blob:']);

/**
 * True when `url` is an in-app relative target (`/broker/leads`, `#anchor`,
 * `?tab=x`). Protocol-relative (`//evil.example`) is deliberately excluded —
 * it navigates cross-origin.
 */
function isRelativePath(url: string): boolean {
  if (url.startsWith('//') || url.startsWith('/\\')) return false;
  return url.startsWith('/') || url.startsWith('#') || url.startsWith('?');
}

export interface SafeUrlOptions {
  /** Permit `blob:` URLs (generated PDFs, exported images). Default false. */
  allowBlob?: boolean;
  /**
   * Restrict absolute http(s) targets to these hostnames — exact match, or a
   * subdomain of one. Omit to allow any host.
   */
  allowedHosts?: readonly string[];
}

function hostAllowed(hostname: string, allowedHosts?: readonly string[]): boolean {
  if (!allowedHosts || allowedHosts.length === 0) return true;
  const host = hostname.toLowerCase();
  return allowedHosts.some((allowed) => {
    const a = allowed.toLowerCase();
    return host === a || host.endsWith(`.${a}`);
  });
}

/**
 * Validate a URL, returning it unchanged when safe and `null` when not.
 *
 * Returns `null` rather than coercing to `'#'` so callers must decide what a
 * rejected URL means instead of silently navigating somewhere unexpected.
 */
export function toSafeUrl(
  raw: string | null | undefined,
  options: SafeUrlOptions = {},
): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (isRelativePath(trimmed)) return trimmed;

  let parsed: URL;
  try {
    // No base: a bare `evil.example/path` must not be silently accepted as a
    // relative path. Callers pass either a real absolute URL or an in-app path.
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const scheme = parsed.protocol;

  if (RESOURCE_SCHEMES.has(scheme)) {
    return options.allowBlob ? trimmed : null;
  }

  if (!ALLOWED_SCHEMES.has(scheme)) return null;

  if (
    (scheme === 'http:' || scheme === 'https:') &&
    !hostAllowed(parsed.hostname, options.allowedHosts)
  ) {
    return null;
  }

  return trimmed;
}

/** Convenience predicate wrapping {@link toSafeUrl}. */
export function isSafeUrl(raw: string | null | undefined, options?: SafeUrlOptions): boolean {
  return toSafeUrl(raw, options) !== null;
}

/**
 * Validate, then navigate. Returns false (and warns) when the URL is rejected,
 * leaving the user on the current page.
 */
export function safeNavigate(raw: string | null | undefined, options?: SafeUrlOptions): boolean {
  const url = toSafeUrl(raw, options);
  if (!url) {
    console.warn('[security] blocked navigation to unsafe URL:', raw);
    return false;
  }
  window.location.href = url;
  return true;
}

/**
 * Validate, then `window.open`. Always passes `noopener,noreferrer` so the
 * opened document cannot reach back through `window.opener`.
 */
export function safeOpen(
  raw: string | null | undefined,
  target = '_blank',
  options?: SafeUrlOptions,
): Window | null {
  const url = toSafeUrl(raw, { allowBlob: true, ...options });
  if (!url) {
    console.warn('[security] blocked window.open of unsafe URL:', raw);
    return null;
  }
  return window.open(url, target, 'noopener,noreferrer');
}
