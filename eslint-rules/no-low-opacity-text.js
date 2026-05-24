/**
 * ESLint rule: jbj/no-low-opacity-text
 *
 * Flags JSX `className` strings (and template literals / classnames-style
 * concatenations) that hard-code a near-invisible text opacity, forcing the
 * developer to either:
 *   - raise the alpha to /60 or higher, OR
 *   - use `text-muted-foreground` / a semantic token, OR
 *   - explicitly opt out with one of:
 *       • inline `{/* contrast-ok *\/}` comment on the JSX element
 *       • `data-decorative="true"` attribute
 *       • `data-no-contrast-guard` attribute
 *       • class `jj-watermark`
 *
 * Mirrors the static scanner at scripts/contrast/check-low-opacity-text.mjs,
 * but runs inside the editor + pre-commit ESLint pass so developers see the
 * fix-it before they ever push.
 *
 * Threshold: anything below 40 (i.e. text-*/30, opacity-[0.2], opacity-25, …)
 * applied to a text-bearing element is treated as a violation.
 *
 * Honors the same baseline as the scanner (scripts/contrast/allowlist.json →
 * lowOpacityTextBaseline.entries) so legacy files don't block work in
 * unrelated areas.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const allowlistPath = path.join(
  repoRoot,
  "scripts",
  "contrast",
  "allowlist.json"
);

const MIN_TEXT_ALPHA = 40;

let BASELINE = new Set();
try {
  const al = JSON.parse(fs.readFileSync(allowlistPath, "utf8"));
  BASELINE = new Set(al.lowOpacityTextBaseline?.entries ?? []);
} catch {
  /* allowlist optional */
}

const TEXT_ALPHA_RE = /(?<![:\w-])text-[a-z][a-z0-9-]*\/(\d{1,3})\b/g;
const OPACITY_BRACKET_RE = /\bopacity-\[0?\.(\d{1,2})\]/g;
const OPACITY_NUM_RE = /\bopacity-(\d{1,3})(?!\w)/g;
const HAS_TEXT_UTIL_RE = /\btext-[a-z][a-z0-9-]*\b/;

const STATE_PREFIX_RE =
  /(?:hover|focus|focus-visible|focus-within|active|disabled|peer-[a-z-]+|group-[a-z-]+|data-\[[^\]]+\]|aria-\w+|open|in|has-\[[^\]]+\]):(?:opacity-(?:\[0?\.\d{1,2}\]|\d{1,3})|text-[a-z][a-z0-9-]*\/\d{1,3})/;

function attributeOptsOut(jsxOpening) {
  if (!jsxOpening || !jsxOpening.attributes) return false;
  for (const attr of jsxOpening.attributes) {
    if (attr.type !== "JSXAttribute" || !attr.name) continue;
    const name = attr.name.name;
    if (name === "data-decorative" || name === "data-no-contrast-guard") {
      return true;
    }
    if (name === "className" && attr.value && attr.value.type === "Literal") {
      if (
        typeof attr.value.value === "string" &&
        /\bjj-watermark\b/.test(attr.value.value)
      ) {
        return true;
      }
    }
  }
  return false;
}

function hasContrastOkComment(node, context) {
  const sourceCode = context.sourceCode || context.getSourceCode();
  // Inline comments on the same line as the className value
  const comments = sourceCode.getAllComments();
  const line = node.loc.start.line;
  return comments.some(
    (c) =>
      /contrast-ok/.test(c.value) &&
      Math.abs(c.loc.start.line - line) <= 1
  );
}

function findEnclosingJSXOpening(node) {
  let n = node.parent;
  while (n) {
    if (n.type === "JSXOpeningElement") return n;
    n = n.parent;
  }
  return null;
}

function scanString(raw) {
  if (!raw) return [];
  const hits = [];
  // Split by likely separators to mimic class-fragment boundaries.
  const segments = raw.split(/['"`]|\?|,|\$\{|\}/);
  for (const seg of segments) {
    if (STATE_PREFIX_RE.test(seg)) continue;
    let m;
    TEXT_ALPHA_RE.lastIndex = 0;
    while ((m = TEXT_ALPHA_RE.exec(seg))) {
      const alpha = Number(m[1]);
      if (alpha < MIN_TEXT_ALPHA) hits.push(`text-*/${alpha}`);
    }
    if (HAS_TEXT_UTIL_RE.test(seg)) {
      OPACITY_BRACKET_RE.lastIndex = 0;
      while ((m = OPACITY_BRACKET_RE.exec(seg))) {
        const alphaPct =
          m[1].length === 1 ? Number(m[1]) * 10 : Number(m[1]);
        if (alphaPct < MIN_TEXT_ALPHA) hits.push(`opacity-[0.${m[1]}]`);
      }
      OPACITY_NUM_RE.lastIndex = 0;
      while ((m = OPACITY_NUM_RE.exec(seg))) {
        const v = Number(m[1]);
        if (v < MIN_TEXT_ALPHA) hits.push(`opacity-${v}`);
      }
    }
  }
  return hits;
}

function reportHits({
  node,
  hits,
  context,
  filename,
}) {
  if (hits.length === 0) return;
  // Skip if explicitly opted out via comment or attribute.
  if (hasContrastOkComment(node, context)) return;
  const jsxOpening = findEnclosingJSXOpening(node);
  if (jsxOpening && attributeOptsOut(jsxOpening)) return;

  const line = node.loc.start.line;
  const relFile = path.relative(repoRoot, filename).split(path.sep).join("/");
  for (const kind of hits) {
    const baselineKey = `${relFile}:${line}:${kind}`;
    if (BASELINE.has(baselineKey)) continue;
    context.report({
      node,
      messageId: "lowOpacity",
      data: { kind },
    });
  }
}

const rule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow near-invisible text utilities (alpha < 40). Use // contrast-ok, data-decorative, or jj-watermark to opt out for genuinely decorative elements.",
    },
    schema: [],
    messages: {
      lowOpacity:
        "Near-invisible text utility `{{kind}}` (alpha < 40). Raise to /60+, use text-muted-foreground, or mark the element decorative with `data-decorative=\"true\"`, `data-no-contrast-guard`, class `jj-watermark`, or an inline `/* contrast-ok */` comment.",
    },
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (!/\.(t|j)sx$/.test(filename)) return {};

    return {
      // className="…"  /  any string literal inside JSX
      Literal(node) {
        if (typeof node.value !== "string") return;
        // Only consider literals that could be a className value or argument.
        const parent = node.parent;
        if (!parent) return;
        const isJsxStringAttr =
          parent.type === "JSXAttribute" && parent.value === node;
        const isCallArg =
          parent.type === "CallExpression" && parent.arguments?.includes(node);
        if (!isJsxStringAttr && !isCallArg) return;
        const hits = scanString(node.value);
        reportHits({ node, hits, context, filename });
      },
      // className={`...${x}...`}  — scan each quasi
      TemplateLiteral(node) {
        const hits = node.quasis.flatMap((q) => scanString(q.value.raw));
        reportHits({ node, hits, context, filename });
      },
    };
  },
};

export default {
  rules: {
    "no-low-opacity-text": rule,
  },
};
