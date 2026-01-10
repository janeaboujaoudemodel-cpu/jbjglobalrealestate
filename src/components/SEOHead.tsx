import { useEffect } from 'react';

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

/**
 * SEO Head Component - Sets document title and meta tags for each page
 * Usage: <SEOHead title="Properties" description="Browse luxury properties..." />
 */
export const SEOHead = ({
  title,
  description = 'Premium real estate brokerage in Dubai offering property sales, leasing, and holiday homes services across the UAE.',
  keywords = 'Dubai real estate, UAE property, luxury apartments, off-plan properties, JBJ Global Real Estate',
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  noIndex = false,
}: SEOHeadProps) => {
  const fullTitle = title === 'Home' 
    ? `${BRAND_NAME} | Premium UAE Real Estate Brokerage`
    : `${title} | ${BRAND_NAME}`;

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

    // Basic SEO meta tags
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('author', BRAND_NAME);

    // Open Graph meta tags
    setMetaTag('og:title', fullTitle, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', ogImage, true);
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:site_name', BRAND_NAME, true);
    setMetaTag('og:locale', 'en_US', true);

    // Twitter meta tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', fullTitle);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', ogImage);

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

    // Robots meta tag
    if (noIndex) {
      setMetaTag('robots', 'noindex, nofollow');
    } else {
      setMetaTag('robots', 'index, follow');
    }

    // Cleanup on unmount - restore defaults
    return () => {
      document.title = `${BRAND_NAME} | Premium UAE Real Estate Brokerage`;
    };
  }, [fullTitle, description, keywords, canonicalPath, ogImage, ogType, noIndex]);

  return null; // This component doesn't render anything
};

// Pre-configured SEO for common pages
export const pagesSEO = {
  home: {
    title: 'Home',
    description: 'JBJ Global Real Estate - Premium real estate brokerage in Dubai. Explore luxury properties, off-plan developments, and exclusive listings across the UAE.',
    keywords: 'Dubai real estate, UAE property brokerage, luxury apartments Dubai, off-plan properties, Palm Jumeirah, Downtown Dubai, JBJ Global Real Estate',
    canonicalPath: '/',
  },
  properties: {
    title: 'Properties',
    description: 'Browse our exclusive collection of luxury properties in Dubai and the UAE. From waterfront villas to premium apartments and off-plan developments.',
    keywords: 'Dubai properties, UAE real estate listings, luxury villas Dubai, apartments for sale, off-plan projects UAE',
    canonicalPath: '/properties',
  },
  founder: {
    title: 'Founder & Leadership',
    description: 'Meet Jane Abou Jaoude, Founder & CEO of JBJ Global Real Estate. Discover the vision and leadership behind Dubai\'s trusted real estate brokerage.',
    keywords: 'Jane Abou Jaoude, JBJ founder, Dubai real estate leader, real estate brokerage CEO, JBJ Global Real Estate founder',
    canonicalPath: '/founder',
  },
  about: {
    title: 'About Us',
    description: 'Learn about JBJ Global Real Estate - Dubai\'s trusted real estate brokerage serving UAE-based and international clients with expert property services.',
    keywords: 'about JBJ, Dubai real estate company, UAE brokerage, real estate services Dubai',
    canonicalPath: '/about',
  },
  services: {
    title: 'Services',
    description: 'Comprehensive real estate services including property sales, leasing, holiday homes, and partner introductions for legal, mortgage, and design services.',
    keywords: 'real estate services Dubai, property sales UAE, leasing services, holiday homes Dubai, property management',
    canonicalPath: '/services',
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with JBJ Global Real Estate for property inquiries, consultations, and partnership opportunities. Located in Dubai, UAE.',
    keywords: 'contact JBJ, Dubai real estate contact, property consultation Dubai, real estate inquiry UAE',
    canonicalPath: '/contact',
  },
  aiHub: {
    title: 'JBJ AI Assistant Hub',
    description: 'Access powerful AI-powered real estate tools for property search, market analysis, document generation, and more.',
    keywords: 'AI real estate tools, property finder AI, market analysis Dubai, JBJ AI assistant',
    canonicalPath: '/ai-hub',
  },
  awards: {
    title: 'Awards & Recognition',
    description: 'Discover the awards and recognition received by JBJ Global Real Estate for excellence in Dubai real estate brokerage services.',
    keywords: 'real estate awards Dubai, JBJ awards, property brokerage recognition UAE',
    canonicalPath: '/awards',
  },
  news: {
    title: 'News & Insights',
    description: 'Stay updated with the latest Dubai real estate news, market insights, and property trends from JBJ Global Real Estate.',
    keywords: 'Dubai real estate news, UAE property market, real estate insights, market trends Dubai',
    canonicalPath: '/news',
  },
  communities: {
    title: 'Communities',
    description: 'Explore premier residential communities across Dubai and the UAE. Find your ideal neighborhood with JBJ Global Real Estate.',
    keywords: 'Dubai communities, UAE residential areas, best neighborhoods Dubai, property communities',
    canonicalPath: '/communities',
  },
  areaGuides: {
    title: 'Dubai Communities & Area Guides',
    description: 'Explore Dubai\'s most desirable neighborhoods with expert local insights. Comprehensive area guides for Downtown Dubai, Dubai Marina, Business Bay, and more.',
    keywords: 'Dubai area guides, Dubai neighborhoods, Dubai communities, where to live in Dubai, Downtown Dubai guide, Dubai Marina guide, Business Bay guide',
    canonicalPath: '/areas',
  },
  mortgageCalculator: {
    title: 'Mortgage Calculator',
    description: 'Calculate your property mortgage payments with our free Dubai mortgage calculator. Estimate monthly payments for UAE properties.',
    keywords: 'Dubai mortgage calculator, UAE home loan calculator, property payment estimator, mortgage rates Dubai',
    canonicalPath: '/mortgage-calculator',
  },
};

export default SEOHead;
