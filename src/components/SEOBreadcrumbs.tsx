import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const BASE_URL = 'https://jbj.ae';

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/properties': 'Properties',
  '/communities': 'Communities',
  '/areas': 'Area Guides',
  '/developers': 'Developers',
  '/about': 'About',
  '/founder': 'Founder',
  '/services': 'Services',
  '/contact': 'Contact',
  '/news': 'News',
  '/awards': 'Awards',
  '/faq': 'FAQ',
  '/buyer-guide': 'Buyer Guide',
  '/seller-guide': 'Seller Guide',
  '/rent-guide': 'Rent Guide',
  '/mortgage-calculator': 'Mortgage Calculator',
  '/ai-hub': 'Broker Hub',
  '/team': 'Our Team',
  '/company-profile': 'Company Profile',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Service',
  '/cookies': 'Cookie Policy',
  '/customer-happiness': 'Customer Happiness',
  '/quiz': 'AI Home Finder',
  '/investor-hub': 'Investor Hub',
  '/market-intelligence': 'Market Intelligence',
  '/reviews': 'Reviews',
  '/sitemap': 'Sitemap',
};

/**
 * Injects BreadcrumbList JSON-LD structured data based on current route
 */
export const SEOBreadcrumbs = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const segments = path.split('/').filter(Boolean);

    const items = [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
    ];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label = ROUTE_LABELS[currentPath] || segment.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      items.push({
        '@type': 'ListItem',
        position: index + 2,
        name: label,
        item: `${BASE_URL}${currentPath}`,
      });
    });

    if (items.length < 2) return; // Don't add breadcrumbs for homepage alone

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items,
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-breadcrumbs', 'true');
    script.textContent = JSON.stringify(schema);

    // Remove old one
    document.querySelector('script[data-seo-breadcrumbs]')?.remove();
    document.head.appendChild(script);

    return () => { script.remove(); };
  }, [location.pathname]);

  return null;
};

export default SEOBreadcrumbs;
