// <T> primitive: wraps a static English string and renders it in the
// currently-selected language. Backed by translateClient (in-memory + IDB
// cache + batched edge-function fallback).
//
// Usage:
//   <T>Welcome to JBJ Global Real Estate</T>
//   <T domain="property.title">Marina Bay Residences</T>
//
// For attribute strings (placeholder, alt, aria-label, title) use the
// `useT` hook instead.

import { useSyncExternalStore } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getTranslationSync, subscribeTranslations } from './translateClient';

interface TProps {
  children: string;
  domain?: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}

function useTick(): number {
  return useSyncExternalStore(
    (cb) => subscribeTranslations(cb),
    () => translationTick,
    () => 0,
  );
}

let translationTick = 0;
subscribeTranslations(() => {
  translationTick++;
});

export function T({ children, domain = 'ui', as: As = 'span', className }: TProps) {
  const { language } = useLanguage();
  useTick(); // re-render when new translations land
  const text = typeof children === 'string' ? children : String(children ?? '');
  const translated = getTranslationSync(text, language, domain);
  if (As === 'span' && !className) {
    // Avoid wrapping in a span when no styling needed — return raw string.
    return <>{translated}</>;
  }
  return <As className={className}>{translated}</As>;
}

/**
 * Hook form for attributes / dynamic strings.
 *   const t = useT();
 *   <input placeholder={t('Search properties')} />
 *   <img alt={t(project.name, 'project.title')}  loading="lazy" decoding="async" />
 */
export function useT(domain: string = 'ui') {
  const { language } = useLanguage();
  useTick();
  return (text: string | null | undefined, overrideDomain?: string): string => {
    if (text == null) return '';
    return getTranslationSync(String(text), language, overrideDomain ?? domain);
  };
}

/**
 * Component that translates DB-backed long-form content.
 * Looks up curated content_translations first; falls back to AI.
 */
export function TR({
  children,
  domain = 'content',
}: {
  children: string | null | undefined;
  domain?: string;
}) {
  const { language } = useLanguage();
  useTick();
  const text = (children ?? '').toString();
  if (!text.trim()) return null;
  const translated = getTranslationSync(text, language, domain);
  return <>{translated}</>;
}

// Attribute helper: converts an English string straight to its current
// language equivalent. Use in JSX only when you can't use <T>.
export function tx(text: string, language: import('@/translations').Language, domain: string = 'ui'): string {
  return getTranslationSync(text, language, domain);
}
