/**
 * Unit tests for the edge-function SSRF guard.
 *
 * The guard lives under `supabase/functions/_shared/` (Deno), but it is pure
 * TypeScript over the web `URL`/`fetch` globals, so Vitest can exercise it
 * directly. This repo has no `deno test` harness yet; running it here is what
 * keeps the range tables honest.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  SsrfBlockedError,
  assertPublicHttpUrl,
  isPublicHttpUrl,
  safeFetch,
} from '../../supabase/functions/_shared/ssrf-guard';

describe('assertPublicHttpUrl', () => {
  it('accepts ordinary public https URLs', () => {
    expect(assertPublicHttpUrl('https://example.com/doc.pdf').hostname).toBe('example.com');
    expect(assertPublicHttpUrl('http://example.com:80/x').hostname).toBe('example.com');
    expect(assertPublicHttpUrl('https://example.com:443/x').hostname).toBe('example.com');
  });

  it('rejects non-http schemes', () => {
    for (const u of ['file:///etc/passwd', 'gopher://x/1', 'data:text/plain,hi', 'ftp://x/y']) {
      expect(() => assertPublicHttpUrl(u)).toThrow(SsrfBlockedError);
    }
  });

  it('rejects cloud instance metadata', () => {
    expect(() => assertPublicHttpUrl('http://169.254.169.254/latest/meta-data/')).toThrow(
      /private, loopback or link-local/,
    );
    expect(() => assertPublicHttpUrl('http://metadata.google.internal/')).toThrow(
      /private network/,
    );
  });

  it('rejects loopback and private ranges', () => {
    const blocked = [
      'http://127.0.0.1/',
      'http://127.1.2.3/',
      'http://0.0.0.0/',
      'http://10.0.0.5/',
      'http://172.16.0.1/',
      'http://172.31.255.255/',
      'http://192.168.1.1/',
      'http://100.64.0.1/',
      'http://localhost/',
      'http://foo.internal/',
      'http://db.local/',
    ];
    for (const u of blocked) {
      expect(() => assertPublicHttpUrl(u), u).toThrow(SsrfBlockedError);
    }
  });

  it('does not over-block neighbouring public ranges', () => {
    const allowed = [
      'http://172.15.0.1/',
      'http://172.32.0.1/',
      'http://11.0.0.1/',
      'http://100.63.255.255/',
      'http://100.128.0.1/',
      'http://192.167.1.1/',
    ];
    for (const u of allowed) {
      expect(isPublicHttpUrl(u), u).toBe(true);
    }
  });

  it('rejects IPv6 loopback, link-local and unique-local literals', () => {
    for (const u of ['http://[::1]/', 'http://[fe80::1]/', 'http://[fd00::1]/', 'http://[::ffff:169.254.169.254]/']) {
      expect(() => assertPublicHttpUrl(u), u).toThrow(SsrfBlockedError);
    }
  });

  it('rejects embedded credentials that disguise the real host', () => {
    expect(() => assertPublicHttpUrl('https://example.com@169.254.169.254/')).toThrow(
      SsrfBlockedError,
    );
  });

  it('rejects non-default ports unless explicitly allowed', () => {
    expect(() => assertPublicHttpUrl('http://example.com:8080/')).toThrow(/port 8080/);
    expect(isPublicHttpUrl('http://example.com:8080/', { allowedPorts: [8080] })).toBe(true);
  });

  it('enforces allowedHosts, including subdomains but not lookalikes', () => {
    const opts = { allowedHosts: ['example.com'] };
    expect(isPublicHttpUrl('https://example.com/x', opts)).toBe(true);
    expect(isPublicHttpUrl('https://cdn.example.com/x', opts)).toBe(true);
    expect(isPublicHttpUrl('https://notexample.com/x', opts)).toBe(false);
    expect(isPublicHttpUrl('https://evil.example/x', opts)).toBe(false);
  });

  it('rejects garbage and relative input', () => {
    expect(() => assertPublicHttpUrl('')).toThrow(SsrfBlockedError);
    expect(() => assertPublicHttpUrl('/relative/path')).toThrow(SsrfBlockedError);
    expect(() => assertPublicHttpUrl('not a url')).toThrow(SsrfBlockedError);
  });
});

describe('safeFetch', () => {
  afterEach(() => vi.restoreAllMocks());

  const redirectTo = (location: string) =>
    new Response(null, { status: 302, headers: { location } });

  it('returns a non-redirect response directly', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'));
    const res = await safeFetch('https://example.com/a');
    expect(await res.text()).toBe('ok');
    expect(spy).toHaveBeenCalledWith('https://example.com/a', expect.objectContaining({ redirect: 'manual' }));
  });

  it('follows a redirect to another public host', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(redirectTo('https://cdn.example.com/b'))
      .mockResolvedValueOnce(new Response('final'));
    const res = await safeFetch('https://example.com/a');
    expect(await res.text()).toBe('final');
  });

  it('blocks a redirect that lands on instance metadata', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      redirectTo('http://169.254.169.254/latest/meta-data/'),
    );
    await expect(safeFetch('https://example.com/a')).rejects.toThrow(SsrfBlockedError);
  });

  it('blocks a redirect that leaves the allowlist', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(redirectTo('https://evil.example/x'));
    await expect(
      safeFetch('https://example.com/a', {}, { allowedHosts: ['example.com'] }),
    ).rejects.toThrow(/allowlist/);
  });

  it('gives up rather than looping forever', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(redirectTo('https://example.com/loop'));
    await expect(safeFetch('https://example.com/a', {}, { maxRedirects: 2 })).rejects.toThrow(
      /exceeded 2 redirects/,
    );
  });
});
