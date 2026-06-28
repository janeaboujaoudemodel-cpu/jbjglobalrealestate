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
let headObserver: MutationObserver | null = null;
let unsubscribeTranslationEvents: (() => void) | null = null;
let scheduled = false;
// Roots queued for the next scoped sweep. If the set contains document.body
// we treat that as a full sweep request.
const dirtyRoots = new Set<Node>();

function stopDomObservers() {
  observer?.disconnect();
  observer = null;
  headObserver?.disconnect();
  headObserver = null;
}

function startDomObservers() {
  if (typeof document === 'undefined') return;
  if (observer) observer.disconnect();
  observer = new MutationObserver((mutations) => {
    if (currentLang === 'en') return;
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE || n.nodeType === Node.TEXT_NODE) {
            scheduleSweep(n);
          }
        });
      } else if (m.type === 'characterData') {
        scheduleSweep(m.target);
      } else if (m.type === 'attributes') {
        scheduleSweep(m.target);
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: TRANSLATABLE_ATTRS,
  });

  if (headObserver) headObserver.disconnect();
  headObserver = new MutationObserver(() => {
    if (currentLang !== 'en') scheduleSweep();
  });
  if (document.head) {
    headObserver.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['content'],
    });
  }
}

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
    const current = node.nodeValue ?? '';
    if (lang === 'en') {
      // React may have updated this text since first capture (e.g. live
      // recalculations like the mortgage calculator). If the DOM already
      // differs from the captured original, treat the new value as the
      // new "original" instead of clobbering React's update. We only
      // restore the captured original if the node still matches a known
      // translated value (i.e. we previously swapped it ourselves).
      if (current !== orig) {
        owned[ORIG_TEXT_KEY] = current;
      }
      continue;
    }
    const translated = getTranslationSync(orig, lang, 'ui');
    // If the DOM text is neither the original nor our last translation,
    // React updated it — re-stamp orig and re-translate from the new text.
    if (current !== orig && current !== translated) {
      owned[ORIG_TEXT_KEY] = current;
      const reTranslated = getTranslationSync(current, lang, 'ui');
      if (node.nodeValue !== reTranslated) node.nodeValue = reTranslated;
      continue;
    }
    if (node.nodeValue !== translated) node.nodeValue = translated;
  }
  for (const { el, attr, orig } of attrTargets) {
    const owned = el as unknown as NodeWithOrig;
    const current = el.getAttribute(attr) ?? '';
    if (lang === 'en') {
      if (current !== orig) {
        if (owned[ORIG_ATTR_KEY]) owned[ORIG_ATTR_KEY]![attr] = current;
      }
      continue;
    }
    const translated = getTranslationSync(orig, lang, 'ui');
    if (current !== orig && current !== translated) {
      if (owned[ORIG_ATTR_KEY]) owned[ORIG_ATTR_KEY]![attr] = current;
      const reTranslated = getTranslationSync(current, lang, 'ui');
      if (el.getAttribute(attr) !== reTranslated) el.setAttribute(attr, reTranslated);
      continue;
    }
    if (el.getAttribute(attr) !== translated) el.setAttribute(attr, translated);
  }
}

function scheduleSweep(root?: Node) {
  if (root) dirtyRoots.add(root);
  else dirtyRoots.add(document.body);
  if (scheduled) return;
  scheduled = true;
  const run = () => {
    scheduled = false;
    sweep();
  };
  const ric = (window as any).requestIdleCallback as undefined | ((cb: () => void) => number);
  if (ric) ric(run);
  else requestAnimationFrame(run);
}

// Translatable elements inside <head> — title text, meta descriptions, OG/Twitter cards.
function sweepHead() {
  if (typeof document === 'undefined') return;
  const head = document.head;
  if (!head) return;

  // <title> text node
  const titleEl = head.querySelector('title');
  if (titleEl) {
    // Treat as a normal text node
    const t = titleEl.firstChild;
    if (t && t.nodeType === Node.TEXT_NODE) {
      const owned = t as unknown as NodeWithOrig;
      if (owned[ORIG_TEXT_KEY] == null) {
        const txt = t.nodeValue ?? '';
        if (shouldTranslate(txt) && !LATIN_LOCKED_STRINGS.has(txt.trim())) {
          owned[ORIG_TEXT_KEY] = txt;
        }
      }
      const orig = owned[ORIG_TEXT_KEY];
      if (orig != null) {
        if (currentLang === 'en') {
          if (t.nodeValue !== orig) t.nodeValue = orig;
        } else {
          const translated = getTranslationSync(orig, currentLang, 'ui');
          if (t.nodeValue !== translated) t.nodeValue = translated;
        }
      }
    }
  }

  // meta description, og:*, twitter:* — translate the `content` attribute
  const metas = head.querySelectorAll<HTMLMetaElement>(
    'meta[name="description"], meta[property^="og:"], meta[name^="twitter:"]'
  );
  metas.forEach((m) => {
    const prop = (m.getAttribute('property') || m.getAttribute('name') || '').toLowerCase();
    // Skip non-text meta values: og:image, og:url, og:type, og:site_name (brand), twitter:card, twitter:site
    if (
      prop.endsWith(':image') || prop.endsWith(':url') || prop === 'og:type' ||
      prop === 'og:site_name' || prop === 'twitter:card' || prop === 'twitter:site' ||
      prop === 'twitter:creator' || prop.endsWith(':locale')
    ) {
      return;
    }
    const val = m.getAttribute('content');
    if (!val || !shouldTranslate(val) || LATIN_LOCKED_STRINGS.has(val.trim())) return;
    const owned = m as unknown as NodeWithOrig;
    if (!owned[ORIG_ATTR_KEY]) owned[ORIG_ATTR_KEY] = {};
    if (owned[ORIG_ATTR_KEY]!['content'] == null) owned[ORIG_ATTR_KEY]!['content'] = val;
    const orig = owned[ORIG_ATTR_KEY]!['content']!;
    if (currentLang === 'en') {
      if (m.getAttribute('content') !== orig) m.setAttribute('content', orig);
    } else {
      const translated = getTranslationSync(orig, currentLang, 'ui');
      if (m.getAttribute('content') !== translated) m.setAttribute('content', translated);
    }
  });
}

function sweep() {
  if (typeof document === 'undefined') return;
  // Always refresh head — cheap, small set
  sweepHead();

  const roots = Array.from(dirtyRoots);
  dirtyRoots.clear();
  // If body is in the set, do a single full sweep and skip the rest.
  const fullSweep = roots.includes(document.body);
  const targets: Node[] = fullSweep ? [document.body] : roots;
  const textNodes: Text[] = [];
  const attrTargets: { el: HTMLElement; attr: string; orig: string }[] = [];
  for (const r of targets) {
    // Skip nodes detached from the tree
    if (!document.contains(r)) continue;
    walkAndCollect(r, textNodes, attrTargets);
  }
  applyTranslations(textNodes, attrTargets, currentLang);
}

export function startAutoTranslator(initialLang: Language) {
  if (typeof document === 'undefined') return;
  currentLang = initialLang;

  unsubscribeTranslationEvents?.();
  unsubscribeTranslationEvents = subscribeTranslations(() => {
    if (currentLang !== 'en') scheduleSweep();
  });

  // English is the default DOM language. Do not attach a body-wide
  // MutationObserver or run TreeWalker sweeps while no translation is needed;
  // this was a major source of slow dropdown/menu opening after React renders.
  if (currentLang === 'en') {
    stopDomObservers();
    return;
  }

  // Initial full sweep
  scheduleSweep();

  // Watch for new DOM nodes (React renders, route changes) — scoped to mutation targets.
  startDomObservers();
}

export function setAutoTranslatorLanguage(lang: Language) {
  currentLang = lang;
  if (lang !== 'en' && !observer) startDomObservers();
  // Force a full sweep on language change so previously translated nodes
  // are re-translated into the new language.
  dirtyRoots.add(document.body);
  scheduleSweep();
  if (lang === 'en') stopDomObservers();
}
