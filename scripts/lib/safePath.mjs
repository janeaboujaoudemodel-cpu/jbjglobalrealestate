/**
 * Confine a CLI-supplied path to the repository.
 *
 * Several build/QA scripts accept file paths on the command line — `--css=…`
 * for a guard fixture, the file list lint-staged appends, a report output
 * directory. Those arguments are resolved and read/written without any bound,
 * so `--css=../../../../etc/passwd` reads outside the repo, and a hook or CI
 * step that ever forwards a filename it did not construct itself turns into a
 * file-disclosure primitive.
 *
 * Every read of a caller-supplied path should go through
 * {@link resolveWithinRoot}. It preserves the legitimate use (any path inside
 * the repo, absolute or relative) and rejects everything else, including
 * symlink hops out of the tree.
 */
import fs from "node:fs";
import path from "node:path";

function contains(dir, target) {
  const withSep = dir.endsWith(path.sep) ? dir : dir + path.sep;
  return target === dir || target.startsWith(withSep);
}

/**
 * Resolve `candidate` against `root` and require the result to stay inside an
 * allowed directory.
 *
 * @param {string} root      Absolute directory relative paths resolve against,
 *                           and the primary directory the result must stay in.
 * @param {string} candidate Caller-supplied path, absolute or relative.
 * @param {{ mustExist?: boolean, alsoAllow?: string[] }} [options]
 *        `alsoAllow` names extra permitted roots — pass `os.tmpdir()` where a
 *        script legitimately accepts a generated fixture or scratch file.
 * @returns {string} the resolved absolute path.
 * @throws {Error} when the path escapes every allowed root, or when
 * `mustExist` is set and it does not exist.
 */
export function resolveWithinRoot(root, candidate, options = {}) {
  if (typeof candidate !== "string" || candidate.length === 0) {
    throw new Error("Path argument is required");
  }

  const rootReal = fs.realpathSync(path.resolve(root));
  const resolved = path.resolve(rootReal, candidate);

  // Resolve symlinks where possible so a link inside an allowed root cannot
  // point out of it. A path that does not exist yet (an output file) is
  // checked in its lexical form against the nearest existing ancestor.
  let probe = resolved;
  while (!fs.existsSync(probe) && path.dirname(probe) !== probe) {
    probe = path.dirname(probe);
  }
  const realBase = fs.existsSync(probe) ? fs.realpathSync(probe) : probe;
  const real = path.join(realBase, path.relative(probe, resolved));

  const allowed = [rootReal, ...(options.alsoAllow ?? [])].map((d) => {
    const abs = path.resolve(d);
    return fs.existsSync(abs) ? fs.realpathSync(abs) : abs;
  });

  if (!allowed.some((dir) => contains(dir, real))) {
    throw new Error(
      `Refusing to use path outside ${allowed.join(" or ")}: ${candidate} -> ${real}`,
    );
  }

  if (options.mustExist && !fs.existsSync(real)) {
    throw new Error(`Path does not exist: ${candidate}`);
  }

  return real;
}

/**
 * Non-throwing form: returns the resolved path, or `null` if it escapes `root`
 * (or does not exist when `mustExist` is set).
 *
 * Use this where the script filters a list of candidates rather than failing
 * the whole run — e.g. the lint-staged file arguments.
 */
export function tryResolveWithinRoot(root, candidate, options = {}) {
  try {
    return resolveWithinRoot(root, candidate, options);
  } catch {
    return null;
  }
}
