// HtmlT — render sanitized DB-sourced HTML and translate every text node inside
// it into the active language. Solves the gap where `dangerouslySetInnerHTML`
// repeatedly re-creates DOM nodes that bypass the global text-node walker's
// already-translated state.
//
// The block is marked with `data-jbj-html-block` so the global MutationObserver
// in autoTranslate.ts re-sweeps it on language switches as well.

import { useEffect, useLayoutEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getTranslationSync,
  shouldTranslate,
  subscribeTranslations,
} from './translateClient';
import { LATIN_LOCKED_STRINGS } from '@/translations/proper-nouns';

type HtmlTTag = 'div' | 'span' | 'section' | 'article' | 'aside' | 'p';

interface HtmlTProps {
  html: string;
  className?: string;
  as?: HtmlTTag;
  domain?: string;
}

const SKIP = new Set([
  'SCRIPT', 'STYLE', 'CODE', 'PRE', 'NOSCRIPT', 'TEXTAREA',
  'svg', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO',
]);

function translateSubtree(root: HTMLElement, lang: string, domain: string) {
  if (lang === 'en') return; // text already in source language
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      let p: Node | null = n.parentNode;
      while (p) {
        if (p instanceof HTMLElement && SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT;
        p = p.parentNode;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) nodes.push(n as Text);
  for (const t of nodes) {
    const orig = t.nodeValue ?? '';
    if (!shouldTranslate(orig)) continue;
    if (LATIN_LOCKED_STRINGS.has(orig.trim())) continue;
    const translated = getTranslationSync(orig, lang as any, domain);
    if (translated && translated !== t.nodeValue) t.nodeValue = translated;
  }
}

export function HtmlT({ html, className, as: As = 'div', domain = 'content' }: HtmlTProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const { language } = useLanguage();

  // Inject HTML once per change (preserves any existing sanitization performed
  // upstream by callers — they pass already-sanitized strings).
  useLayoutEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = html;
    translateSubtree(ref.current, language, domain);
  }, [html, language, domain]);

  // Re-translate when new translations land in the cache.
  useEffect(() => {
    return subscribeTranslations(() => {
      if (ref.current) translateSubtree(ref.current, language, domain);
    });
  }, [language, domain]);

  const Tag = As as any;
  return <Tag ref={ref} className={className} data-jbj-html-block="" />;
}
