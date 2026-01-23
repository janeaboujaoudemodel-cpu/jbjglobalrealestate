/**
 * GlobalTranslator - Automatically translates ALL text content in the app
 * 
 * This component intercepts all text nodes in the React tree and translates them
 * automatically based on the current language setting. No manual wrapping required.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

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

// Skip patterns (English words that should remain English)
const SKIP_PATTERNS = [
  /^[\d\s.,!?@#$%^&*()_+=\-\[\]{}|\\:";'<>?,./`~]*$/, // Only numbers/symbols
  /^https?:\/\//, // URLs
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Emails
  /^\+?\d[\d\s\-()]+$/, // Phone numbers
  /^AED\s*[\d,]+/, // Currency
  /^[\d,]+\s*(sq\.?\s*ft|sqft|m²|sqm)/, // Measurements
];

// Check if text should be skipped
const shouldSkipText = (text: string): boolean => {
  if (!text || text.trim().length < 2) return true;
  return SKIP_PATTERNS.some(pattern => pattern.test(text.trim()));
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
  const { language, translateText } = useLanguage();
  const originalTexts = useRef<WeakMap<Text, string>>(new WeakMap());
  const translatedNodes = useRef<Set<Text>>(new Set());
  const observerRef = useRef<MutationObserver | null>(null);
  const processingRef = useRef(false);
  const lastLanguageRef = useRef(language);

  // Translate a single text node
  const translateNode = useCallback(async (node: Text) => {
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

    // Get translation
    const translated = translateText(originalText);
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
        // Debounce processing
        setTimeout(processAllNodes, 50);
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
  }, [processAllNodes]);

  // Re-process when language changes
  useEffect(() => {
    if (lastLanguageRef.current !== language) {
      lastLanguageRef.current = language;
      
      // Clear translated nodes tracking for fresh translation
      translatedNodes.current.clear();
      
      // Process all nodes with new language
      processAllNodes();
    }
  }, [language, processAllNodes]);

  // Re-process periodically to catch any missed content
  useEffect(() => {
    const interval = setInterval(processAllNodes, 2000);
    return () => clearInterval(interval);
  }, [processAllNodes]);

  return null; // This component doesn't render anything
};

export default GlobalTranslator;
