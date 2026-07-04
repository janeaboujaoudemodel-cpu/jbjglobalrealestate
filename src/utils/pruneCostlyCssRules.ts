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

const pruneSheet = (sheet: CSSStyleSheet) => {
  let rules: CSSRuleList;
  try {
    rules = sheet.cssRules;
  } catch {
    return;
  }

  for (let index = rules.length - 1; index >= 0; index -= 1) {
    const rule = rules[index] as CSSStyleRule & CSSGroupingRule;

    if ("cssRules" in rule && rule.cssRules) {
      pruneSheet(rule as unknown as CSSStyleSheet);
      continue;
    }

    const selector = "selectorText" in rule ? rule.selectorText || "" : "";
    if (selector && shouldPruneSelector(selector, rule.cssText || "")) {
      try {
        sheet.deleteRule(index);
      } catch {
        // Ignore stylesheet mutation races during HMR/dev injection.
      }
    }
  }
};

export const installInteractionCssPruner = () => {
  if (typeof document === "undefined") return;

  const run = () => {
    for (const sheet of Array.from(document.styleSheets)) {
      pruneSheet(sheet as CSSStyleSheet);
    }
  };

  run();
  requestAnimationFrame(run);
  window.setTimeout(run, 750);
};