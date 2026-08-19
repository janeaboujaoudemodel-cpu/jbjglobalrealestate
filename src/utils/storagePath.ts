/**
 * Build Supabase Storage object paths from untrusted file names.
 *
 * A browser `File.name` is attacker-controlled: a renamed upload can carry
 * `../`, a leading `/`, a NUL, or a name long enough to trip the storage API.
 * Interpolating it straight into an object key —
 * `` `${userId}/${Date.now()}-${file.name}` `` — lets the object escape the
 * per-user prefix that the bucket's RLS policies are written against, which
 * turns "upload a CV" into "write anywhere in the bucket".
 *
 * The extension shortcut has the same hole in a less obvious place:
 * `"evil./../../pwn.png".split(".").pop()` returns `"/../../pwn.png"`, so an
 * `ext` variable is no safer than the raw name.
 *
 * Use {@link safeStorageFileName} for the whole name, {@link safeFileExtension}
 * when only the extension is interpolated, and {@link safeStorageSegment} for
 * any other dynamic path segment.
 *
 * @see src/utils/__tests__/storagePath.test.ts
 */

/** Characters that are safe in an object key: word chars, dot, dash. */
// eslint-disable-next-line no-control-regex
const UNSAFE_CHARS = /[^\w.-]+/g;

const MAX_SEGMENT_LENGTH = 120;

/**
 * Reduce an arbitrary string to a single safe path segment.
 *
 * Path separators, `..`, control characters and leading dots are removed
 * outright rather than escaped — there is no legitimate reason for any of them
 * in a generated object key.
 */
export function safeStorageSegment(value: string | null | undefined, fallback = 'file'): string {
  if (!value) return fallback;

  const cleaned = String(value)
    .normalize('NFKD')
    .replace(UNSAFE_CHARS, '_')
    // Collapse any run of dots so `..` can never survive.
    .replace(/\.{2,}/g, '.')
    // A leading dot makes a hidden file and confuses extension parsing.
    .replace(/^\.+/, '')
    .replace(/_{2,}/g, '_')
    .slice(0, MAX_SEGMENT_LENGTH)
    .replace(/[._-]+$/, '');

  return cleaned || fallback;
}

/**
 * Extract a file extension that is safe to interpolate into a path.
 *
 * Returns the extension without a leading dot, lowercased, letters and digits
 * only, capped at 10 characters. Anything else yields `fallback`.
 */
export function safeFileExtension(fileName: string | null | undefined, fallback = 'bin'): string {
  if (!fileName) return fallback;

  const base = String(fileName).split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return fallback;

  const ext = base.slice(dot + 1).toLowerCase();
  return /^[a-z0-9]{1,10}$/.test(ext) ? ext : fallback;
}

/**
 * Turn an untrusted file name into a safe `name.ext` object-key segment,
 * preserving a recognisable name for the user.
 */
export function safeStorageFileName(
  fileName: string | null | undefined,
  fallback = 'file',
): string {
  if (!fileName) return fallback;

  const base = String(fileName).split(/[\\/]/).pop() ?? '';
  const ext = safeFileExtension(base, '');
  const stem = ext ? base.slice(0, base.length - ext.length - 1) : base;
  const safeStem = safeStorageSegment(stem, fallback);

  return ext ? `${safeStem}.${ext}` : safeStem;
}

/**
 * Join path segments into an object key, sanitizing each one.
 *
 * Segments that are already trusted (a UUID, a timestamp) pass through
 * unchanged in practice, because they contain only safe characters.
 */
export function buildStoragePath(...segments: Array<string | number | null | undefined>): string {
  return segments
    .filter((s) => s !== null && s !== undefined && s !== '')
    .map((s) => safeStorageSegment(String(s)))
    .join('/');
}
