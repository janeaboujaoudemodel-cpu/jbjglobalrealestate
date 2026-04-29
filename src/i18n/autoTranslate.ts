// AutoTranslator: walks the live DOM and translates every visible text node
// into the active language, then keeps it in sync with future renders.
//
// This complements <T> / useT(): you don't have to wrap every string by hand —
// any English text node, attribute, or alt/placeholder is auto-translated
// once a non-English language is selected. Translations are cached forever
// in IndexedDB + DB, so subsequent visits are instant.
//
// Strategy:
//  1. On language switch (or first paint in a non-English locale), traverse
//     <body>, queue every text node and translatable attribute.
//  2. Submit unique strings to the batch translator.
//  3. As translations resolve, swap the DOM in place; remember each node's
//     original English so we can re-translate cleanly when the language
//     changes again.
//  4. A MutationObserver picks up new nodes added by React renders and
//     translates them too.

import type { Language } from '@/translations';
import {
  getTranslationSync,
  shouldTranslate,
  subscribeTranslations,
} from './translateClient';
import { LATIN_LOCKED_STRINGS } from '@/translations/proper-nouns';

// Tags whose textual content must NEVER be translated.
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'TEXTAREA',
  'svg', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO',
]);

// Attributes that contain user-visible text and should be translated.
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];

// Marker we stamp on each node so we know its original English text.
const ORIG_TEXT_KEY = '__jbjOrigText__';
const ORIG_ATTR_KEY = '__jbjOrigAttrs__';

interface NodeWithOrig extends Node {
  [ORIG_TEXT_KEY]?: string;
  [ORIG_ATTR_KEY]?: Record<string, string>;
}

let currentLang: Language = 'en';
let observer: MutationObserver | null = null;
let scheduled = false;

function isInsideSkippedAncestor(node: Node): boolean {
  let p: Node | null = node.parentNode;
  while (p) {
    if (p instanceof HTMLElement) {
      if (SKIP_TAGS.has(p.tagName)) return true;
      // Honor user opt-out: data-no-translate or translate="no"
      if (p.hasAttribute('data-no-translate')) return true;
      const tr = p.getAttribute('translate');
      if (tr === 'no') return true;
      // Inputs the user is typing into shouldn't be retranslated mid-edit
      if (p.tagName === 'INPUT' && (p as HTMLInputElement).value) {
        // We only translate placeholder/aria-label, not value
      }
    }
    p = p.parentNode;
  }
  return false;
}

function walkAndCollect(
  root: Node,
  textNodes: Text[],
  attrTargets: { el: HTMLElement; attr: string; orig: string }[],
) {
  if (!(root instanceof HTMLElement) && !(root instanceof DocumentFragment) && !(root instanceof Document)) {
    if (root instanceof Text) {
      collectTextNode(root, textNodes);
    }
    return;
  }
  // Element-level checks
  if (root instanceof HTMLElement) {
    if (SKIP_TAGS.has(root.tagName)) return;
    if (root.hasAttribute('data-no-translate')) return;
    if (root.getAttribute('translate') === 'no') return;
    // Attributes
    for (const attr of TRANSLATABLE_ATTRS) {
      const val = root.getAttribute(attr);
      if (val && shouldTranslate(val) && !LATIN_LOCKED_STRINGS.has(val.trim())) {
        const node = root as unknown as NodeWithOrig;
        if (!node[ORIG_ATTR_KEY]) node[ORIG_ATTR_KEY] = {};
        if (node[ORIG_ATTR_KEY]![attr] == null) {
          node[ORIG_ATTR_KEY]![attr] = val;
        }
        attrTargets.push({ el: root, attr, orig: node[ORIG_ATTR_KEY]![attr]! });
      }
    }
  }
  // Walk children
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
    acceptNode(n) {
      if (n.nodeType === Node.ELEMENT_NODE) {
        const el = n as HTMLElement;
        if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
        if (el.hasAttribute('data-no-translate')) return NodeFilter.FILTER_REJECT;
        if (el.getAttribute('translate') === 'no') return NodeFilter.FILTER_REJECT;
        // Collect attrs on element
        for (const attr of TRANSLATABLE_ATTRS) {
          const val = el.getAttribute(attr);
          if (val && shouldTranslate(val) && !LATIN_LOCKED_STRINGS.has(val.trim())) {
            const node = el as unknown as NodeWithOrig;
            if (!node[ORIG_ATTR_KEY]) node[ORIG_ATTR_KEY] = {};
            if (node[ORIG_ATTR_KEY]![attr] == null) node[ORIG_ATTR_KEY]![attr] = val;
            attrTargets.push({ el, attr, orig: node[ORIG_ATTR_KEY]![attr]! });
          }
        }
        return NodeFilter.FILTER_SKIP; // keep walking into children
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) {
    if (n.nodeType === Node.TEXT_NODE) collectTextNode(n as Text, textNodes);
  }
}

function collectTextNode(node: Text, out: Text[]) {
  if (isInsideSkippedAncestor(node)) return;
  const owned = node as unknown as NodeWithOrig;
  // Capture original on first sight
  if (owned[ORIG_TEXT_KEY] == null) {
    const txt = node.nodeValue ?? '';
    if (!shouldTranslate(txt)) return;
    if (LATIN_LOCKED_STRINGS.has(txt.trim())) return;
    owned[ORIG_TEXT_KEY] = txt;
  }
  if (!shouldTranslate(owned[ORIG_TEXT_KEY]!)) return;
  out.push(node);
}

function applyTranslations(textNodes: Text[], attrTargets: { el: HTMLElement; attr: string; orig: string }[], lang: Language) {
  for (const node of textNodes) {
    const owned = node as unknown as NodeWithOrig;
    const orig = owned[ORIG_TEXT_KEY];
    if (orig == null) continue;
    if (lang === 'en') {
      if (node.nodeValue !== orig) node.nodeValue = orig;
      continue;
    }
    const translated = getTranslationSync(orig, lang, 'ui');
    if (node.nodeValue !== translated) node.nodeValue = translated;
  }
  for (const { el, attr, orig } of attrTargets) {
    if (lang === 'en') {
      if (el.getAttribute(attr) !== orig) el.setAttribute(attr, orig);
      continue;
    }
    const translated = getTranslationSync(orig, lang, 'ui');
    if (el.getAttribute(attr) !== translated) el.setAttribute(attr, translated);
  }
}

function scheduleSweep() {
  if (scheduled) return;
  scheduled = true;
  // requestIdleCallback if available, otherwise next frame
  const run = () => {
    scheduled = false;
    sweep();
  };
  const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void) => number);
  if (ric) ric(run);
  else requestAnimationFrame(run);
}

function sweep() {
  if (typeof document === 'undefined') return;
  const textNodes: Text[] = [];
  const attrTargets: { el: HTMLElement; attr: string; orig: string }[] = [];
  walkAndCollect(document.body, textNodes, attrTargets);
  applyTranslations(textNodes, attrTargets, currentLang);
}

export function startAutoTranslator(initialLang: Language) {
  if (typeof document === 'undefined') return;
  currentLang = initialLang;

  // Initial sweep
  scheduleSweep();

  // Re-apply when batch translations land
  subscribeTranslations(() => scheduleSweep());

  // Watch for new DOM nodes (React renders, route changes)
  if (observer) observer.disconnect();
  observer = new MutationObserver((mutations) => {
    let dirty = false;
    for (const m of mutations) {
      if (m.type === 'childList' && m.addedNodes.length > 0) dirty = true;
      else if (m.type === 'characterData') dirty = true;
      else if (m.type === 'attributes') dirty = true;
      if (dirty) break;
    }
    if (dirty) scheduleSweep();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: TRANSLATABLE_ATTRS,
  });
}

export function setAutoTranslatorLanguage(lang: Language) {
  currentLang = lang;
  scheduleSweep();
}
