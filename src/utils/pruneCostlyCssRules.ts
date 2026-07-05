const COSTLY_SELECTOR_MARKERS = [":is(", ":where(", ":has("];
const KEEP_MARKERS = [
  "data-advanced-filter-panel",
  "data-currency-menu-content",
  "data-mode-switcher-panel",
  "data-account-menu-content",
  "data-global-search-modal",
];

// Only prune truly pathological selectors (extremely long combinators). Do NOT
// blanket-prune every `:has(...)` rule — the project relies on many intentional
// `html body:has(#root ...)` scopes for page shells, hero heights, dropdown
// ink/hover contrast, etc.
const shouldPruneSelector = (selector: string, _cssText: string) => {
  if (KEEP_MARKERS.some((marker) => selector.includes(marker))) return false;
  if (selector.length > 2400) return true;
  if (selector.length > 1800 && COSTLY_SELECTOR_MARKERS.some((marker) => selector.includes(marker))) return true;
  return false;
};

const pruneRuleList = (owner: any): number => {
  let removed = 0;
  let rules: CSSRule[] = [];
  try {
    rules = Array.from(owner.cssRules || []);
  } catch {
    return 0;
  }

  for (let index = rules.length - 1; index >= 0; index -= 1) {
    const rule: any = rules[index];
    if (rule?.cssRules) {
      removed += pruneRuleList(rule);
    }

    const selector = String(rule?.selectorText || "");
    const cssText = String(rule?.cssText || "");
    if (selector && shouldPruneSelector(selector, cssText)) {
      try {
        owner.deleteRule(index);
        removed += 1;
      } catch {
        // Ignore stylesheet mutation races during HMR/dev injection.
      }
    }
  }
  return removed;
};

export const installInteractionCssPruner = () => {
  if (typeof document === "undefined") return;
  const win = window as unknown as { __JBJ_CSS_PRUNER_INSTALLED__?: boolean; __JBJ_CSS_PRUNED__?: number };
  if (win.__JBJ_CSS_PRUNER_INSTALLED__) return;
  win.__JBJ_CSS_PRUNER_INSTALLED__ = true;

  const run = () => {
    let removed = 0;
    for (const sheet of Array.from(document.styleSheets)) {
      removed += pruneRuleList(sheet as CSSStyleSheet);
    }
    (window as unknown as { __JBJ_CSS_PRUNED__?: number }).__JBJ_CSS_PRUNED__ =
      ((window as unknown as { __JBJ_CSS_PRUNED__?: number }).__JBJ_CSS_PRUNED__ || 0) + removed;
  };

  run();
  requestAnimationFrame(run);
  window.setTimeout(run, 250);
  window.setTimeout(run, 1000);
  window.setTimeout(run, 2500);
};