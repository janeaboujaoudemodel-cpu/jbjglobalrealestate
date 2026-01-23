/**
 * GlobalTranslator - Automatically translates ALL text content in the app
 * 
 * This component intercepts all text nodes in the React tree and translates them
 * automatically based on the current language setting. No manual wrapping required.
 * 
 * CRITICAL RULES:
 * - When language is ENGLISH: ALL content must be in ENGLISH (Western numerals)
 * - When language is ARABIC: Apply Arabic text + Arabic-Indic numerals
 * - No mixing allowed - English mode = 100% English
 */

import { useEffect, useCallback, useRef, useContext } from 'react';
import { LanguageContext } from '@/contexts/LanguageContext';

// Arabic-Indic numerals mapping
const ARABIC_NUMERALS: Record<string, string> = {
  '0': '٠', '1': '١', '2': '٢', '3': '٣', '4': '٤',
  '5': '٥', '6': '٦', '7': '٧', '8': '٨', '9': '٩',
};

// Reverse mapping: Arabic-Indic to Western
const WESTERN_NUMERALS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
};

// Convert Western numerals to Arabic-Indic numerals
const toArabicNumerals = (text: string): string => {
  return text.replace(/[0-9]/g, (digit) => ARABIC_NUMERALS[digit] || digit);
};

// Convert Arabic-Indic numerals back to Western numerals
const toWesternNumerals = (text: string): string => {
  return text.replace(/[٠-٩]/g, (digit) => WESTERN_NUMERALS[digit] || digit);
};

// Preserve leading/trailing whitespace from original to avoid "glued words"
const preserveOuterWhitespace = (original: string, translated: string): string => {
  const leading = (original.match(/^\s+/) ?? [""])[0];
  const trailing = (original.match(/\s+$/) ?? [""])[0];
  return `${leading}${translated.trim()}${trailing}`;
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
    
    const currentText = node.textContent || '';
    if (!currentText || shouldSkipText(currentText)) return;

    // Get or determine the original English text
    let originalText = originalTexts.current.get(node);
    
    if (!originalText) {
      // If we don't have the original, try to extract it
      // by converting any Arabic numerals back to Western
      originalText = toWesternNumerals(currentText);
      originalTexts.current.set(node, originalText);
    }

    // CRITICAL: If English, ALWAYS restore to original English (Western numerals)
    if (language === 'en') {
      // Convert any Arabic numerals back to Western numerals
      const westernText = toWesternNumerals(currentText);
      if (node.textContent !== westernText) {
        node.textContent = westernText;
      }
      return;
    }

    // For non-English languages (e.g., Arabic), apply translation
    // Get translation first
    let translated = translateText(originalText);

    // Preserve spacing from original (prevents words/titles being concatenated)
    if (translated) {
      translated = preserveOuterWhitespace(originalText, translated);
    }
    
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
      
      // Force immediate reprocessing to restore/convert numerals
      // Run multiple times to catch dynamic content
      processAllNodes();
      setTimeout(processAllNodes, 50);
      setTimeout(processAllNodes, 150);
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
