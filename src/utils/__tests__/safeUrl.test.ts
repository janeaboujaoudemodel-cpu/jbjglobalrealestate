import { describe, expect, it, vi, afterEach } from 'vitest';
import { isSafeUrl, safeNavigate, safeOpen, toSafeUrl } from '../safeUrl';

describe('toSafeUrl', () => {
  it('accepts ordinary http(s) URLs unchanged', () => {
    expect(toSafeUrl('https://jbj.ae/broker')).toBe('https://jbj.ae/broker');
    expect(toSafeUrl('http://example.com/a?b=1#c')).toBe('http://example.com/a?b=1#c');
  });

  it('accepts the contact schemes the app actually uses', () => {
    expect(toSafeUrl('mailto:a@b.com?subject=Hi')).toBe('mailto:a@b.com?subject=Hi');
    expect(toSafeUrl('tel:+971541515015')).toBe('tel:+971541515015');
    expect(toSafeUrl('sms:+971541515015')).toBe('sms:+971541515015');
  });

  it('accepts in-app relative paths', () => {
    expect(toSafeUrl('/owner/crm/leads')).toBe('/owner/crm/leads');
    expect(toSafeUrl('#section')).toBe('#section');
    expect(toSafeUrl('?tab=notes')).toBe('?tab=notes');
  });

  it('rejects javascript: however it is spelled', () => {
    expect(toSafeUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeUrl('JaVaScRiPt:alert(1)')).toBeNull();
    // The WHATWG parser drops embedded tabs/newlines before resolving the
    // scheme, exactly as the browser does — so must we.
    expect(toSafeUrl('jav\tascript:alert(1)')).toBeNull();
    expect(toSafeUrl('jav\nascript:alert(1)')).toBeNull();
    expect(toSafeUrl('  javascript:alert(1)')).toBeNull();
  });

  it('rejects other dangerous schemes', () => {
    expect(toSafeUrl('data:text/html;base64,PHNjcmlwdD4=')).toBeNull();
    expect(toSafeUrl('vbscript:msgbox(1)')).toBeNull();
    expect(toSafeUrl('file:///etc/passwd')).toBeNull();
  });

  it('treats protocol-relative and backslash-smuggled paths as unsafe', () => {
    expect(toSafeUrl('//evil.example/steal')).toBeNull();
    expect(toSafeUrl('/\\evil.example/steal')).toBeNull();
  });

  it('rejects blob: unless explicitly allowed', () => {
    const blob = 'blob:https://jbj.ae/2b0d-4f11';
    expect(toSafeUrl(blob)).toBeNull();
    expect(toSafeUrl(blob, { allowBlob: true })).toBe(blob);
  });

  it('rejects bare hostnames rather than guessing a scheme', () => {
    expect(toSafeUrl('evil.example/path')).toBeNull();
  });

  it('rejects empty and nullish input', () => {
    expect(toSafeUrl('')).toBeNull();
    expect(toSafeUrl('   ')).toBeNull();
    expect(toSafeUrl(null)).toBeNull();
    expect(toSafeUrl(undefined)).toBeNull();
  });

  it('enforces an allowedHosts list on http(s) targets', () => {
    const opts = { allowedHosts: ['jbj.ae', 'supabase.co'] };
    expect(toSafeUrl('https://jbj.ae/x', opts)).toBe('https://jbj.ae/x');
    // Subdomains of an allowed host pass.
    expect(toSafeUrl('https://mdafrewypkkrildjgtey.supabase.co/x', opts)).toBe(
      'https://mdafrewypkkrildjgtey.supabase.co/x',
    );
    expect(toSafeUrl('https://evil.example/x', opts)).toBeNull();
    // A lookalike suffix must not slip through the endsWith check.
    expect(toSafeUrl('https://notjbj.ae/x', opts)).toBeNull();
  });
});

describe('isSafeUrl', () => {
  it('mirrors toSafeUrl as a boolean', () => {
    expect(isSafeUrl('https://jbj.ae')).toBe(true);
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
  });
});

describe('safeNavigate', () => {
  afterEach(() => vi.restoreAllMocks());

  it('navigates for a safe URL and reports true', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // jsdom refuses real navigation; assert on the assignment attempt instead.
    const href = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { set href(v: string) { href(v); }, get href() { return ''; } },
    });

    expect(safeNavigate('/owner/crm')).toBe(true);
    expect(href).toHaveBeenCalledWith('/owner/crm');
    expect(warn).not.toHaveBeenCalled();
  });

  it('refuses an unsafe URL without navigating', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const href = vi.fn();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { set href(v: string) { href(v); }, get href() { return ''; } },
    });

    expect(safeNavigate('javascript:alert(1)')).toBe(false);
    expect(href).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
  });
});

describe('safeOpen', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens safe URLs with noopener,noreferrer', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    safeOpen('https://jbj.ae/report');
    expect(open).toHaveBeenCalledWith('https://jbj.ae/report', '_blank', 'noopener,noreferrer');
  });

  it('allows blob: by default (generated PDFs) but not javascript:', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    safeOpen('blob:https://jbj.ae/abc');
    expect(open).toHaveBeenCalledTimes(1);

    safeOpen('javascript:alert(1)');
    expect(open).toHaveBeenCalledTimes(1);
  });
});
