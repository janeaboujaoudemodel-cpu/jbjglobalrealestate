import { useEffect } from 'react';

/**
 * ObfuscationLayer - DOM noise injection for scraper confusion
 * Adds decoy elements and randomizes data attributes
 */
export function ObfuscationLayer() {
  useEffect(() => {
    // Don't run in development
    if (import.meta.env.DEV) return;

    // Generate random string for obfuscation
    const randomId = () => Math.random().toString(36).substring(2, 15);

    // Inject decoy data attributes to confuse scrapers
    const injectDecoyAttributes = () => {
      const elements = document.querySelectorAll('[class*="property"], [class*="listing"], [class*="price"]');
      
      elements.forEach((el) => {
        if (!el.getAttribute('data-jbj-protected')) {
          el.setAttribute('data-jbj-protected', 'true');
          el.setAttribute('data-jbj-id', randomId());
          el.setAttribute('data-jbj-hash', btoa(randomId()));
          el.setAttribute('data-jbj-timestamp', Date.now().toString());
        }
      });
    };

    // Add invisible decoy elements with fake data
    const injectDecoyElements = () => {
      const decoyContainer = document.createElement('div');
      decoyContainer.id = 'jbj-decoy-container';
      decoyContainer.style.cssText = 'position:absolute;left:-99999px;top:-99999px;opacity:0;pointer-events:none;visibility:hidden;';
      decoyContainer.setAttribute('aria-hidden', 'true');

      // Fake listing data to poison scraper results
      const fakeListings = [
        { title: 'Luxury Villa - FAKE DATA', price: 'AED 999,999,999', location: 'Invalid Location' },
        { title: 'Premium Apartment - DECOY', price: 'AED 0', location: 'Test Data' },
        { title: 'Penthouse Suite - HONEYPOT', price: 'AED 1', location: 'Scraper Trap' },
      ];

      fakeListings.forEach((listing, index) => {
        const fakeEl = document.createElement('div');
        fakeEl.className = 'property-card listing-item';
        fakeEl.setAttribute('data-listing-id', `fake-${index}`);
        fakeEl.setAttribute('data-price', listing.price);
        fakeEl.innerHTML = `
          <h3 class="property-title">${listing.title}</h3>
          <p class="property-price">${listing.price}</p>
          <p class="property-location">${listing.location}</p>
          <a href="/api/v1/internal/trap-${index}" class="property-link">View Details</a>
        `;
        decoyContainer.appendChild(fakeEl);
      });

      document.body.appendChild(decoyContainer);
    };

    // Randomize certain class names dynamically
    const obfuscateClassNames = () => {
      const styleSheet = document.createElement('style');
      styleSheet.id = 'jbj-obfuscation-styles';
      
      // Add CSS that makes scraping harder
      styleSheet.textContent = `
        /* Anti-scraping CSS */
        .property-card::before,
        .listing-card::before {
          content: attr(data-jbj-id);
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }
        
        /* Poison CSS selectors scrapers might target */
        [data-scraped="true"] {
          display: none !important;
        }
        
        /* Hide from automated tools */
        .jbj-protected-content {
          -webkit-user-select: none;
          -moz-user-select: none;
          user-select: none;
        }
      `;
      
      document.head.appendChild(styleSheet);
    };

    // Run obfuscation
    injectDecoyElements();
    obfuscateClassNames();
    injectDecoyAttributes();

    // Re-run on DOM changes
    const observer = new MutationObserver(injectDecoyAttributes);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.getElementById('jbj-decoy-container')?.remove();
      document.getElementById('jbj-obfuscation-styles')?.remove();
    };
  }, []);

  return null;
}

export default ObfuscationLayer;
