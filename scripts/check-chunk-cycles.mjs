#!/usr/bin/env node
/**
 * Fails if the production build contains a circular dependency between
 * emitted chunks.
 *
 * Why this exists (JBJ-029): `react-is` was left unrouted by
 * `manualChunks`, so Rollup put it in `charts-vendor` — and `react-vendor`
 * then had to import back out of `charts-vendor`. A circular chunk edge is
 * not a performance nit. `charts-vendor` is modulepreloaded first, so it
 * evaluated before React was initialised and threw
 * `Cannot read properties of undefined (reading 'useState')` at module
 * scope. #root stayed empty: the entire site rendered blank, in production,
 * for anyone who loaded it.
 *
 * Nothing caught that. Every unit test passed, the build exited 0, and the
 * contrast sweep reported 0 violations on all 56 routes — because those
 * checks run against the dev server, not the built bundle. This script
 * closes that specific gap by reading the actual emitted output.
 *
 * Usage: node scripts/check-chunk-cycles.mjs [distDir]
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const distAssets = join(process.argv[2] ?? "dist", "assets");

if (!existsSync(distAssets)) {
  console.error(`✗ ${distAssets} not found — run the build first.`);
  process.exit(1);
}

const files = readdirSync(distAssets).filter((f) => f.endsWith(".js"));
if (files.length === 0) {
  console.error(`✗ No JS chunks found in ${distAssets}.`);
  process.exit(1);
}

// Static `import ... from "./chunk.js"` and re-export forms only. Dynamic
// `import()` is deliberately ignored: it defers evaluation, so a dynamic
// cycle is not a boot hazard.
const STATIC_IMPORT = /(?:^|[;}\s])(?:import|export)\s*(?:[^"'()]*?\bfrom\s*)?["']\.\/([^"']+\.js)["']/g;

const graph = new Map();
for (const file of files) {
  const src = readFileSync(join(distAssets, file), "utf8");
  const deps = new Set();
  for (const m of src.matchAll(STATIC_IMPORT)) deps.add(basename(m[1]));
  graph.set(file, deps);
}

// Iterative DFS with an explicit stack so a large graph can't blow the call
// stack, recording the path so the error names the actual cycle.
const cycles = [];
const UNVISITED = 0, ACTIVE = 1, DONE = 2;
const state = new Map(files.map((f) => [f, UNVISITED]));

for (const root of files) {
  if (state.get(root) !== UNVISITED) continue;
  const stack = [{ node: root, iter: (graph.get(root) ?? new Set()).values() }];
  const path = [root];
  state.set(root, ACTIVE);

  while (stack.length) {
    const top = stack[stack.length - 1];
    const next = top.iter.next();
    if (next.done) {
      state.set(top.node, DONE);
      stack.pop();
      path.pop();
      continue;
    }
    const dep = next.value;
    if (!graph.has(dep)) continue;
    if (state.get(dep) === ACTIVE) {
      const start = path.indexOf(dep);
      cycles.push([...path.slice(start), dep]);
      continue;
    }
    if (state.get(dep) === DONE) continue;
    state.set(dep, ACTIVE);
    path.push(dep);
    stack.push({ node: dep, iter: (graph.get(dep) ?? new Set()).values() });
  }
}

// Collapse rotations of the same cycle so one problem reports once.
const seen = new Set();
const unique = cycles.filter((cycle) => {
  const key = [...cycle.slice(0, -1)].sort().join("|");
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

if (unique.length === 0) {
  console.log(`✓ No circular chunk dependencies (${files.length} chunks checked).`);
  process.exit(0);
}

console.error(`✗ ${unique.length} circular chunk dependenc${unique.length === 1 ? "y" : "ies"} found.\n`);
for (const cycle of unique) {
  console.error(`  ${cycle.join("\n    → ")}\n`);
}
console.error(
  "A static import cycle between chunks means one of them runs before its\n" +
  "dependency is initialised. That is a blank-page boot failure in\n" +
  "production, not a warning. Fix it by routing the shared module\n" +
  "explicitly in `manualChunks` (vite.config.ts) so the edge is one-way.",
);
process.exit(1);
