/**
 * Shared DOMPurify wrappers for every `dangerouslySetInnerHTML` call site.
 *
 * Two profiles, deliberately no more:
 *
 *  - `sanitizeRichHtml`  — rich text / email bodies / rendered markdown.
 *  - `sanitizeSvgMarkup` — generated or uploaded SVG (stamps, logos, seals).
 *
 * Both are safe to call during SSR / prerender: DOMPurify needs a DOM, and
 * `scripts/prerender/prerender.mjs` plus any Node-side import would otherwise
 * hit `DOMPurify.sanitize` with no `window`. When there is no DOM we return
 * an empty string rather than the raw input — failing closed, because
 * returning the unsanitized markup is exactly the bug this module exists to
 * prevent.
 *
 * @see src/utils/__tests__/safeHtml.test.ts
 */
import DOMPurify from 'dompurify';

/** True when DOMPurify has a DOM to work against. */
function hasDom(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

/** Tags that must never survive sanitization, in any profile. */
const FORBIDDEN_TAGS = [
  'script',
  'iframe',
  'object',
  'embed',
  'form',
  'base',
  'meta',
  'link',
] as const;

/**
 * Inline event handlers and attributes that can navigate or submit. DOMPurify
 * already strips `on*` by default; listing them keeps the intent explicit and
 * survives a future config change that loosens the defaults.
 */
const FORBIDDEN_ATTR = [
  'onerror',
  'onload',
  'onclick',
  'onmouseover',
  'onmouseenter',
  'onfocus',
  'onblur',
  'onanimationstart',
  'onanimationend',
  'ontoggle',
  'onbegin',
  'formaction',
  'srcdoc',
  'ping',
] as const;

/**
 * Sanitize rich HTML for display: email previews, rendered markdown, stored
 * announcements, provider-supplied message bodies.
 *
 * Keeps ordinary formatting and links but drops scripts, framing, forms and
 * every inline event handler.
 */
export function sanitizeRichHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  if (!hasDom()) return '';

  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: [...FORBIDDEN_TAGS],
    FORBID_ATTR: [...FORBIDDEN_ATTR],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize SVG markup for inline rendering.
 *
 * The stamp/logo generators legitimately need SVG filter primitives, bidi and
 * letter-spacing attributes for Arabic arc text, and `data:` image hrefs for
 * user-uploaded logos — DOMPurify strips all of those by default. Everything
 * outside that list, including `<script>`, `<foreignObject>` and `on*`
 * handlers, is dropped.
 */
export function sanitizeSvgMarkup(dirty: string | null | undefined): string {
  if (!dirty) return '';
  if (!hasDom()) return '';

  return DOMPurify.sanitize(dirty, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: [
      'image',
      'filter',
      'feTurbulence',
      'feColorMatrix',
      'feComponentTransfer',
      'feFuncA',
      'feFuncR',
      'feFuncG',
      'feFuncB',
      'feComposite',
      'feGaussianBlur',
      'feMorphology',
      'feFlood',
      'feMerge',
      'feMergeNode',
    ],
    ADD_ATTR: [
      'clip-path',
      'dominant-baseline',
      'unicode-bidi',
      'direction',
      'bidi-override',
      'letter-spacing',
      'text-anchor',
      'font-weight',
      'font-size',
      'font-family',
      'font-style',
      'href',
      'xlink:href',
      'preserveAspectRatio',
      'textLength',
      'lengthAdjust',
      'filter',
      'flood-color',
      'flood-opacity',
      'stdDeviation',
      'baseFrequency',
      'numOctaves',
      'seed',
      'type',
      'values',
      'operator',
      'radius',
      'in',
      'in2',
      'result',
      'tableValues',
      'x',
      'y',
      'width',
      'height',
      'opacity',
      'data-stamp-element',
    ],
    // Uploaded logos arrive as data: URIs; `<image href="data:image/png;…">`
    // is the only place a data: URI is accepted. ADD_DATA_URI_TAGS scopes
    // that allowance to the `image` tag only — do NOT add ADD_URI_SAFE_ATTR
    // for href/xlink:href, it disables scheme validation (including
    // javascript:) for those attributes on every allowed tag, not just
    // `image`.
    ADD_DATA_URI_TAGS: ['image'],
    FORBID_TAGS: [...FORBIDDEN_TAGS, 'foreignObject'],
    FORBID_ATTR: [...FORBIDDEN_ATTR],
    FORCE_BODY: false,
  });
}

/**
 * Serialize a JSON-LD graph for embedding in a `<script type="application/ld+json">`
 * via `dangerouslySetInnerHTML`.
 *
 * Plain `JSON.stringify` is NOT safe here: the HTML parser terminates the
 * script at the first literal `</script`, so a DB-sourced field such as an
 * article title containing `</script><img src=x onerror=alert(1)>` breaks out
 * of the block and executes. Escaping `<`, `>` and `&` as `\u00xx` keeps the
 * JSON semantically identical (JSON parsers resolve the escapes) while leaving
 * nothing the HTML parser can act on. U+2028/U+2029 are escaped too — they are
 * valid in JSON strings but terminate a line in older JS parsers.
 *
 * Prefer setting `script.textContent` where the element is created
 * imperatively; this helper is for the JSX path where that is not available.
 */
export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Sanitize a full standalone HTML document (`<!DOCTYPE html>…`) that is about
 * to be handed to a print window or an iframe.
 *
 * `sanitizeRichHtml` would strip `<html>`/`<head>`/`<style>` and leave only the
 * body fragment, which breaks print layouts — so this profile keeps the
 * document scaffolding and stylesheet but still removes script execution,
 * framing and event handlers.
 */
export function sanitizeDocumentHtml(dirty: string | null | undefined): string {
  if (!dirty) return '';
  if (!hasDom()) return '';

  return DOMPurify.sanitize(dirty, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style'],
    ADD_ATTR: ['media'],
    FORBID_TAGS: [...FORBIDDEN_TAGS],
    FORBID_ATTR: [...FORBIDDEN_ATTR],
    ALLOW_DATA_ATTR: false,
  });
}
