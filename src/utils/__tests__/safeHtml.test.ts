import { describe, expect, it } from 'vitest';
import { sanitizeDocumentHtml, sanitizeRichHtml, sanitizeSvgMarkup } from '../safeHtml';

describe('sanitizeRichHtml', () => {
  it('keeps ordinary formatting and links', () => {
    const out = sanitizeRichHtml('<p>Hello <strong>Jane</strong> <a href="https://jbj.ae">link</a></p>');
    expect(out).toContain('<strong>Jane</strong>');
    expect(out).toContain('href="https://jbj.ae"');
  });

  it('strips script tags', () => {
    const out = sanitizeRichHtml('<p>hi</p><script>alert(1)</script>');
    expect(out).not.toContain('<script');
    expect(out).toContain('<p>hi</p>');
  });

  it('strips inline event handlers', () => {
    const out = sanitizeRichHtml('<img src="x" onerror="alert(1)">');
    expect(out).not.toContain('onerror');
  });

  it('strips framing and form elements', () => {
    const out = sanitizeRichHtml(
      '<iframe src="https://evil.example"></iframe><form action="/x"><input></form><object></object>',
    );
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<object');
  });

  it('strips javascript: hrefs', () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });

  it('returns empty string for empty/nullish input', () => {
    expect(sanitizeRichHtml('')).toBe('');
    expect(sanitizeRichHtml(null)).toBe('');
    expect(sanitizeRichHtml(undefined)).toBe('');
  });
});

describe('sanitizeSvgMarkup', () => {
  const stamp =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
    '<circle cx="100" cy="100" r="90" fill="#B89555"/>' +
    '<text x="100" y="95" letter-spacing="3" direction="rtl" unicode-bidi="bidi-override" text-anchor="middle">JBJ</text>' +
    '</svg>';

  it('preserves the attributes the stamp/logo generators depend on', () => {
    const out = sanitizeSvgMarkup(stamp);
    expect(out).toContain('letter-spacing');
    expect(out).toContain('unicode-bidi');
    expect(out).toContain('direction');
    expect(out).toContain('text-anchor');
  });

  it('preserves data: image hrefs for uploaded logos', () => {
    const out = sanitizeSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="data:image/png;base64,iVBORw0KGgo=" width="10" height="10"/></svg>',
    );
    expect(out).toContain('data:image/png;base64');
  });

  it('strips script and event handlers from SVG', () => {
    const out = sanitizeSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle onload="alert(1)" r="5"/></svg>',
    );
    expect(out).not.toContain('<script');
    expect(out).not.toContain('onload');
  });

  it('strips foreignObject, which can smuggle HTML into an SVG', () => {
    const out = sanitizeSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><iframe src="x"></iframe></foreignObject></svg>',
    );
    expect(out).not.toContain('foreignObject');
    expect(out).not.toContain('<iframe');
  });

  it('neutralizes an injected name field that closes the text element', () => {
    // How the stamp builders actually get attacked: an unescaped company name.
    const injected = stamp.replace('JBJ', '</text><script>alert(1)</script><text>');
    const out = sanitizeSvgMarkup(injected);
    expect(out).not.toContain('<script');
  });

  it('returns empty string for empty/nullish input', () => {
    expect(sanitizeSvgMarkup('')).toBe('');
    expect(sanitizeSvgMarkup(null)).toBe('');
  });
});

describe('sanitizeDocumentHtml', () => {
  const doc =
    '<!DOCTYPE html><html><head><title>Report</title><style>body{margin:0}</style></head>' +
    '<body><h1>Report</h1><script>alert(1)</script></body></html>';

  it('keeps the document scaffolding and stylesheet a print window needs', () => {
    const out = sanitizeDocumentHtml(doc);
    expect(out).toContain('<style>');
    expect(out).toContain('body{margin:0}');
    expect(out).toContain('<h1>Report</h1>');
  });

  it('still removes scripts and event handlers', () => {
    const out = sanitizeDocumentHtml(doc.replace('<h1>Report</h1>', '<h1 onclick="alert(1)">Report</h1>'));
    expect(out).not.toContain('<script');
    expect(out).not.toContain('onclick');
  });

  it('returns empty string for empty/nullish input', () => {
    expect(sanitizeDocumentHtml('')).toBe('');
    expect(sanitizeDocumentHtml(null)).toBe('');
  });
});
