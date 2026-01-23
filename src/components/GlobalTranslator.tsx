/**
 * GlobalTranslator - Automatically translates ALL text content in the app
 * 
 * This component intercepts all text nodes in the React tree and translates them
 * automatically based on the current language setting. No manual wrapping required.
 * 
 * CRITICAL RULES:
 * - Numbers in English (12, 4800, 1M) → Arabic numerals (١٢, ٤٨٠٠, ١م)
 * - No value changes allowed - only translation of text
 * - Instant language switching - no delays
 */

import { useEffect, useCallback, useRef, useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';

// Arabic-Indic numerals mapping
const ARABIC_NUMERALS: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
};

// Convert Western numerals to Arabic-Indic numerals
const toArabicNumerals = (text: string): string => {
  return text.replace(/[0-9]/g, (digit) => ARABIC_NUMERALS[digit] || digit);
};

// Convert abbreviations (M, K, B) to Arabic equivalents
const localizeAbbreviations = (text: string, lang: string): string => {
  if (lang !== 'ar') return text;
  
  // Convert number abbreviations
  return text
    .replace(/(\d+(?:\.\d+)?)\s*M\+?/gi, (_, num) => `${toArabicNumerals(num)}م+`)
    .replace(/(\d+(?:\.\d+)?)\s*K\+?/gi, (_, num) => `${toArabicNumerals(num)}ألف+`)
    .replace(/(\d+(?:\.\d+)?)\s*B\+?/gi, (_, num) => `${toArabicNumerals(num)}مليار+`);
};

// Text nodes that should NOT be translated
const SKIP_SELECTORS = [
  'script',
  'style',
  'code',
  'pre',
  '[data-no-translate]',
  '[translate="no"]',
  '.notranslate',
  'input',
  'textarea',
  'select',
];

// Skip patterns (preserve structure but still localize numbers)
const SKIP_TEXT_PATTERNS = [
  /^https?:\/\//, // URLs
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Emails
];

// Check if text should be completely skipped (no processing at all)
const shouldSkipText = (text: string): boolean => {
  if (!text || text.trim().length < 1) return true;
  return SKIP_TEXT_PATTERNS.some(pattern => pattern.test(text.trim()));
};

// Check if element should be skipped
const shouldSkipElement = (element: Element): boolean => {
  return SKIP_SELECTORS.some(selector => {
    try {
      return element.matches(selector) || element.closest(selector);
    } catch {
      return false;
    }
  });
};

// Get all text nodes in an element
const getTextNodes = (element: Node): Text[] => {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  
  let node: Text | null;
  while ((node = walker.nextNode() as Text)) {
    if (node.textContent && node.textContent.trim()) {
      textNodes.push(node);
    }
  }
  
  return textNodes;
};

export const GlobalTranslator = () => {
  // Use useContext directly to safely handle missing context
  const context = useContext(LanguageContext);
  
  // Safe defaults when context is not available
  const language = context?.language ?? 'en';
  const translateText = context?.translateText ?? ((text: string) => text);
  const translationVersion = context?.translationVersion ?? 0;
  
  const originalTexts = useRef<WeakMap<Text, string>>(new WeakMap());
  const translatedNodes = useRef<Set<Text>>(new Set());
  const observerRef = useRef<MutationObserver | null>(null);
  const processingRef = useRef(false);
  const lastLanguageRef = useRef(language);
  const lastVersionRef = useRef(translationVersion);

  // Translate a single text node
  const translateNode = useCallback((node: Text) => {
    if (!node.parentElement || shouldSkipElement(node.parentElement)) return;
    
    const originalText = originalTexts.current.get(node) || node.textContent || '';
    if (!originalText || shouldSkipText(originalText)) return;

    // Store original if not already stored
    if (!originalTexts.current.has(node)) {
      originalTexts.current.set(node, originalText);
    }

    // If English, restore original
    if (language === 'en') {
      if (node.textContent !== originalText) {
        node.textContent = originalText;
      }
      return;
    }

    // Get translation first
    let translated = translateText(originalText);
    
    // Apply Arabic numeral conversion for Arabic
    if (language === 'ar' && translated) {
      // First handle abbreviations like "1M+" → "١م+"
      translated = localizeAbbreviations(translated, language);
      // Then convert remaining numerals
      translated = toArabicNumerals(translated);
    }
    
    if (translated && translated !== node.textContent) {
      node.textContent = translated;
      translatedNodes.current.add(node);
    }
  }, [language, translateText]);

  // Process all text nodes in the document
  const processAllNodes = useCallback(() => {
    if (processingRef.current) return;
    processingRef.current = true;

    requestAnimationFrame(() => {
      try {
        const textNodes = getTextNodes(document.body);
        textNodes.forEach(node => translateNode(node));
      } finally {
        processingRef.current = false;
      }
    });
  }, [translateNode]);

  // Set up mutation observer to catch new content
  useEffect(() => {
    // Skip if no context available
    if (!context) return;
    
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new MutationObserver((mutations) => {
      let hasNewText = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
              hasNewText = true;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              hasNewText = true;
            }
          });
        } else if (mutation.type === 'characterData') {
          hasNewText = true;
        }
      }

      if (hasNewText) {
        // Immediate processing for faster response
        setTimeout(processAllNodes, 10);
      }
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Initial processing
    processAllNodes();

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [processAllNodes, context]);

  // Re-process when language changes
  useEffect(() => {
    if (!context) return;
    
    if (lastLanguageRef.current !== language) {
      lastLanguageRef.current = language;
      
      // Clear translated nodes tracking for fresh translation
      translatedNodes.current.clear();
      
      // Process all nodes with new language immediately
      processAllNodes();
    }
  }, [language, processAllNodes, context]);

  // Re-process when translationVersion changes (async translations resolved)
  useEffect(() => {
    if (!context) return;
    
    if (lastVersionRef.current !== translationVersion) {
      lastVersionRef.current = translationVersion;
      // Immediately reprocess to apply newly resolved translations
      processAllNodes();
    }
  }, [translationVersion, processAllNodes, context]);

  // Re-process periodically to catch any missed content (less frequent)
  useEffect(() => {
    if (!context) return;
    
    const interval = setInterval(processAllNodes, 1500);
    return () => clearInterval(interval);
  }, [processAllNodes, context]);

  return null; // This component doesn't render anything
};

export default GlobalTranslator;
