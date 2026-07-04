const COSTLY_SELECTOR_MARKERS = [":is(", ":where(", ":has("];
const KEEP_MARKERS = [
  "data-advanced-filter-panel",
  "data-currency-menu-content",
  "data-mode-switcher-panel",
  "data-account-menu-content",
  "data-global-search-modal",
  "role=\"switch\"",
  "role='switch'",
];

const shouldPruneSelector = (selector: string, cssText: string) => {
  if (!selector.includes("html body")) return false;
  if (KEEP_MARKERS.some((marker) => selector.includes(marker))) return false;
  if (cssText.length < 520) return false;
  return COSTLY_SELECTOR_MARKERS.some((marker) => selector.includes(marker));
};

const pruneRuleList = (owner: CSSStyleSheet | CSSGroupingRule): number => {
  let rules: CSSRuleList;
  try {
    rules = owner.cssRules;
  } catch {
    return 0;
  }

  let removed = 0;
  for (let index = rules.length - 1; index >= 0; index -= 1) {
    const rule = rules[index] as CSSStyleRule & CSSGroupingRule;

    if ("cssRules" in rule && rule.cssRules) {
      removed += pruneRuleList(rule);
      continue;
    }

    const selector = "selectorText" in rule ? rule.selectorText || "" : "";
    if (selector && shouldPruneSelector(selector, rule.cssText || "")) {
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
  window.setTimeout(run, 750);
};