import { useEffect } from 'react';
import { useFounderVisibility } from '@/contexts/FounderVisibilityContext';

interface SEOHeadProps {
  title: string;
  description?: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  noIndex?: boolean;
}

const BASE_URL = 'https://jbj.ae';
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.jpg`;
const BRAND_NAME = 'JBJ Global Real Estate';

// Core keywords without founder name - founder name added conditionally
const CORE_KEYWORDS_BASE = 'JBJ, JBJ Global Real Estate, Dubai real estate, buy property Dubai, sell property Dubai, rent Dubai, UAE property, real estate brokerage Dubai';
const FOUNDER_KEYWORDS = ', Jane Bou Jaoude';

/**
 * SEO Head Component - Sets document title and meta tags for each page
 * Respects founder visibility toggle for all founder-related SEO content
 */
export const SEOHead = ({
  title,
  description,
  keywords,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const { isFounderVisible } = useFounderVisibility();
  
  // Build dynamic description based on founder visibility
  const defaultDescription = isFounderVisible
    ? 'JBJ Global Real Estate, founded by Jane Bou Jaoude, offers premium property brokerage in Dubai. Buy, sell, or rent luxury apartments, villas, and off-plan properties across the UAE.'
    : 'JBJ Global Real Estate offers premium property brokerage in Dubai. Buy, sell, or rent luxury apartments, villas, and off-plan properties across the UAE.';
  
  const finalDescription = description || defaultDescription;
  
  // Build keywords with or without founder name
  const coreKeywords = isFounderVisible 
    ? CORE_KEYWORDS_BASE + FOUNDER_KEYWORDS 
    : CORE_KEYWORDS_BASE;
  
  const finalKeywords = keywords || coreKeywords;
  
  // Build title with or without founder name
  const fullTitle = title === 'Home' 
    ? isFounderVisible
      ? `${BRAND_NAME} | Dubai Property Brokerage | Buy, Sell, Rent | Jane Bou Jaoude`
      : `${BRAND_NAME} | Dubai Property Brokerage | Buy, Sell, Rent`
    : `${title} | ${BRAND_NAME} Dubai`;

  useEffect(() => {
    // Set document title
    document.title = fullTitle;

    // Helper to set or create meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Enhanced keywords with core terms
    const enhancedKeywords = `${finalKeywords}, ${coreKeywords}`;
    
    // Author field - conditionally include founder
    const authorField = isFounderVisible 
      ? `Jane Bou Jaoude - ${BRAND_NAME}`
      : BRAND_NAME;

    // Basic SEO meta tags
    setMetaTag('description', finalDescription);
    setMetaTag('keywords', enhancedKeywords);
    setMetaTag('author', authorField);
    
    // Additional SEO tags
    setMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('googlebot', 'index, follow');
    setMetaTag('bingbot', 'index, follow');
    setMetaTag('revisit-after', '3 days');
    setMetaTag('rating', 'general');
    setMetaTag('distribution', 'global');

    // Open Graph meta tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', finalDescription, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:image:width', '1200', true);
    setMetaTag('og:image:height', '630', true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:site_name', BRAND_NAME, true);
    setMetaTag('og:locale', 'en_US', true);

    // Twitter meta tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', finalDescription);
    setMetaTag('twitter:image', ogImage);
    setMetaTag('twitter:site', '@jbjglobalrealestate');

    // Canonical URL
    if (canonicalPath) {
      let canonicalElement = document.querySelector('link[rel="canonical"]');
      if (!canonicalElement) {
        canonicalElement = document.createElement('link');
        canonicalElement.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.setAttribute('href', `${BASE_URL}${canonicalPath}`);
    }

    // Cleanup on unmount - restore defaults
    return () => {
      document.title = `${BRAND_NAME} | Dubai Property Brokerage | Buy, Sell, Rent`;
    };
  }, [fullTitle, finalDescription, finalKeywords, coreKeywords, isFounderVisible, canonicalPath, ogImage, ogType, noIndex]);

  return null; // This component doesn't render anything
};

// Pre-configured SEO for common pages - Optimized for Google visibility
export const pagesSEO = {
  home: {
    title: 'Home',
    description: 'JBJ Global Real Estate, founded by Founder & CEO Jane Bou Jaoude, is Dubai\'s premier property brokerage. Buy, sell, or rent luxury apartments, villas, and off-plan properties in Palm Jumeirah, Downtown Dubai, Marina & across UAE.',
    keywords: 'JBJ, JBJ Global Real Estate, Jane Bou Jaoude, Jane Lebanese Dubai, Dubai real estate, buy property Dubai, sell property Dubai, rent apartment Dubai, UAE property brokerage, luxury apartments Dubai, off-plan properties, Palm Jumeirah, Downtown Dubai, Dubai Marina, Business Bay, real estate agent Dubai',
    canonicalPath: '/',
  },
  properties: {
    title: 'Properties for Sale & Rent in Dubai',
    description: 'Browse exclusive luxury properties in Dubai and UAE. Apartments, villas, penthouses for sale or rent in Palm Jumeirah, Downtown Dubai, Marina. JBJ Global Real Estate by Founder & CEO Jane Bou Jaoude.',
    keywords: 'Dubai properties for sale, apartments for rent Dubai, villas Dubai, penthouse Dubai, off-plan projects UAE, Palm Jumeirah properties, Downtown Dubai apartments, Dubai Marina rentals, buy property Dubai, rent Dubai',
    canonicalPath: '/properties',
  },
  founder: {
    title: 'Jane Bou Jaoude - Founder & CEO',
    description: 'Meet Jane Bou Jaoude, Lebanese entrepreneur and Founder of JBJ Global Real Estate Dubai. Visionary leader in UAE real estate with award-winning brokerage services.',
    keywords: 'Jane Bou Jaoude, Jane Lebanese Dubai, Jane Dubai real estate, JBJ founder, Lebanese entrepreneur Dubai, UAE real estate leader, JBJ Global Real Estate founder, Jane CEO Dubai',
    canonicalPath: '/founder',
  },
  about: {
    title: 'About JBJ Global Real Estate Dubai',
    description: 'JBJ Global Real Estate is UAE\'s trusted property brokerage founded by Founder & CEO Jane Bou Jaoude. Expert services for buying, selling, and renting properties across Dubai and UAE.',
    keywords: 'about JBJ, JBJ Global Real Estate company, UAE real estate brokerage, Dubai property company, Jane Bou Jaoude company, real estate services Dubai, trusted property agent Dubai',
    canonicalPath: '/about',
  },
  services: {
    title: 'Real Estate Services - Buy, Sell, Rent Dubai',
    description: 'Comprehensive real estate services by JBJ Global Real Estate. Buy properties, sell your home, rent apartments, holiday homes, off-plan investments in Dubai UAE.',
    keywords: 'buy property Dubai, sell property Dubai, rent apartment Dubai, holiday homes Dubai, off-plan investment UAE, property management Dubai, real estate services UAE, JBJ services',
    canonicalPath: '/services',
  },
  contact: {
    title: 'Contact JBJ Global Real Estate Dubai',
    description: 'Contact JBJ Global Real Estate for property inquiries in Dubai. Founded by Founder & CEO Jane Bou Jaoude. Call +971 56 591 1000 or email contact@JBJ.ae for expert assistance.',
    keywords: 'contact JBJ, JBJ phone number, Dubai real estate contact, property consultation Dubai, Jane Bou Jaoude contact, JBJ Global Real Estate email, real estate inquiry Dubai',
    canonicalPath: '/contact',
  },
  aiHub: {
    title: 'JBJ Broker Hub - Free AI Tools & Training',
    description: 'Access free AI tools, broker training, and operations support at JBJ Broker Hub. Your complete command center for real estate success by JBJ Global Real Estate.',
    keywords: 'JBJ Broker Hub, broker tools Dubai, real estate AI tools, property tools, broker training UAE, JBJ Global Real Estate tools, free broker resources',
    canonicalPath: '/ai-hub',
  },
  awards: {
    title: 'Awards & Recognition - JBJ Global Real Estate',
    description: 'Discover awards received by JBJ Global Real Estate and Founder & CEO Jane Bou Jaoude. Excellence in UAE real estate brokerage services.',
    keywords: 'JBJ awards, Jane Bou Jaoude awards, real estate awards Dubai, property brokerage recognition UAE, GCA awards, III-A awards, Dubai real estate excellence',
    canonicalPath: '/awards',
  },
  news: {
    title: 'Dubai Real Estate News & Market Insights',
    description: 'Latest Dubai real estate news and market insights from JBJ Global Real Estate. Stay updated on property trends, new developments, and investment opportunities.',
    keywords: 'Dubai real estate news, UAE property market, real estate insights Dubai, market trends UAE, property news, JBJ news, Dubai property updates',
    canonicalPath: '/news',
  },
  communities: {
    title: 'Dubai Communities & Neighborhoods Guide',
    description: 'Explore premier residential communities in Dubai. Find your ideal neighborhood in Palm Jumeirah, Downtown, Marina, and more with JBJ Global Real Estate.',
    keywords: 'Dubai communities, Dubai neighborhoods, where to live Dubai, Palm Jumeirah area, Downtown Dubai living, Dubai Marina community, best areas Dubai, property communities UAE',
    canonicalPath: '/communities',
  },
  areaGuides: {
    title: 'Dubai Area Guides - Best Neighborhoods',
    description: 'Comprehensive Dubai area guides by JBJ Global Real Estate. Expert insights on Downtown Dubai, Dubai Marina, Business Bay, Palm Jumeirah and more.',
    keywords: 'Dubai area guides, Dubai neighborhoods guide, Downtown Dubai guide, Dubai Marina guide, Business Bay guide, Palm Jumeirah guide, where to buy Dubai, best neighborhoods Dubai',
    canonicalPath: '/areas',
  },
  buyerGuide: {
    title: 'How to Buy Property in Dubai - Buyer Guide',
    description: 'Complete guide to buying property in Dubai by JBJ Global Real Estate. Step-by-step process, costs, and documentation for UAE property purchase.',
    keywords: 'how to buy property Dubai, Dubai property buying guide, buy apartment Dubai, purchase property UAE, property buying process Dubai, foreigner buy Dubai, JBJ buyer guide',
    canonicalPath: '/buyer-guide',
  },
  sellerGuide: {
    title: 'How to Sell Property in Dubai - Seller Guide',
    description: 'Expert guide to selling property in Dubai by JBJ Global Real Estate. Pricing, marketing, documentation, and transfer process for UAE property sales.',
    keywords: 'sell property Dubai, how to sell house Dubai, Dubai property selling guide, property sale process UAE, sell apartment Dubai, JBJ seller guide, selling property UAE',
    canonicalPath: '/seller-guide',
  },
  mortgageCalculator: {
    title: 'Dubai Mortgage Calculator - Property Payments',
    description: 'Free Dubai mortgage calculator by JBJ Global Real Estate. Calculate monthly payments, interest rates, and affordability for UAE property purchases.',
    keywords: 'Dubai mortgage calculator, UAE home loan calculator, property payment calculator, mortgage rates Dubai, home loan Dubai, property finance UAE, JBJ mortgage tool',
    canonicalPath: '/mortgage-calculator',
  },
  faq: {
    title: 'Frequently Asked Questions - Dubai Real Estate',
    description: 'Find answers to common questions about buying, selling, and renting property in Dubai. Expert guidance from JBJ Global Real Estate.',
    keywords: 'Dubai real estate FAQ, property questions Dubai, buying property FAQ UAE, renting Dubai questions, real estate answers, JBJ FAQ, Dubai property help',
    canonicalPath: '/faq',
  },
  team: {
    title: 'Meet Our Expert Real Estate Team',
    description: 'Meet the professionals behind JBJ Global Real Estate Dubai. Our diverse team led by Jane Bou Jaoude delivers premium property services.',
    keywords: 'JBJ team, real estate professionals Dubai, property agents UAE, JBJ Global Real Estate team, Jane Bou Jaoude team, Dubai property experts',
    canonicalPath: '/team',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'JBJ Global Real Estate privacy policy. How we collect, use, and protect your personal information.',
    keywords: 'JBJ privacy policy, real estate privacy Dubai, data protection UAE',
    canonicalPath: '/privacy',
    noIndex: false,
  },
  terms: {
    title: 'Terms of Service',
    description: 'JBJ Global Real Estate terms of service. Terms and conditions for using our website and services.',
    keywords: 'JBJ terms of service, real estate terms Dubai, website terms UAE',
    canonicalPath: '/terms',
    noIndex: false,
  },
  cookies: {
    title: 'Cookie Policy',
    description: 'JBJ Global Real Estate cookie policy. Information about cookies used on our website.',
    keywords: 'JBJ cookie policy, website cookies, cookie preferences',
    canonicalPath: '/cookies',
    noIndex: false,
  },
};

export default SEOHead;
