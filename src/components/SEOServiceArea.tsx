import { useEffect } from 'react';

/**
 * Injects ServiceArea + AreaServed structured data targeting all emirates & key areas.
 * This helps Google associate the brand with geographic search queries like
 * "real estate Sharjah", "property Abu Dhabi", "Dubai Marina apartments", etc.
 */
export const SEOServiceArea = () => {
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'RealEstateAgent',
      '@id': 'https://jbj.ae/#service-area',
      name: 'JBJ Global Real Estate',
      url: 'https://jbj.ae',
      areaServed: [
        // Emirates
        { '@type': 'City', name: 'Dubai', containedInPlace: { '@type': 'Country', name: 'United Arab Emirates' } },
        { '@type': 'City', name: 'Abu Dhabi', containedInPlace: { '@type': 'Country', name: 'United Arab Emirates' } },
        { '@type': 'City', name: 'Sharjah', containedInPlace: { '@type': 'Country', name: 'United Arab Emirates' } },
        { '@type': 'City', name: 'Ajman', containedInPlace: { '@type': 'Country', name: 'United Arab Emirates' } },
        { '@type': 'City', name: 'Ras Al Khaimah', containedInPlace: { '@type': 'Country', name: 'United Arab Emirates' } },
        { '@type': 'City', name: 'Fujairah', containedInPlace: { '@type': 'Country', name: 'United Arab Emirates' } },
        { '@type': 'City', name: 'Umm Al Quwain', containedInPlace: { '@type': 'Country', name: 'United Arab Emirates' } },
        // Key Dubai Areas
        { '@type': 'Place', name: 'Palm Jumeirah, Dubai' },
        { '@type': 'Place', name: 'Downtown Dubai' },
        { '@type': 'Place', name: 'Dubai Marina' },
        { '@type': 'Place', name: 'Business Bay, Dubai' },
        { '@type': 'Place', name: 'Jumeirah Beach Residence, Dubai' },
        { '@type': 'Place', name: 'Dubai Hills Estate' },
        { '@type': 'Place', name: 'Arabian Ranches, Dubai' },
        { '@type': 'Place', name: 'Jumeirah Village Circle, Dubai' },
        { '@type': 'Place', name: 'Dubai Creek Harbour' },
        { '@type': 'Place', name: 'DAMAC Hills, Dubai' },
        { '@type': 'Place', name: 'Mohammed Bin Rashid City, Dubai' },
        { '@type': 'Place', name: 'Dubai South' },
        { '@type': 'Place', name: 'Al Barsha, Dubai' },
        { '@type': 'Place', name: 'Jumeirah Lake Towers, Dubai' },
        { '@type': 'Place', name: 'DIFC, Dubai' },
        { '@type': 'Place', name: 'Motor City, Dubai' },
        { '@type': 'Place', name: 'Dubai Sports City' },
        { '@type': 'Place', name: 'Meydan, Dubai' },
        { '@type': 'Place', name: 'Sobha Hartland, Dubai' },
        { '@type': 'Place', name: 'Emaar Beachfront, Dubai' },
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: 'Real Estate Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Property Sales - Buy & Sell' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Property Rentals' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Off-Plan Property Investment' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Holiday Home Management' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Property Management' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Golden Visa Advisory' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mortgage Advisory' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Interior Design & Fit-Out' } },
        ],
      },
      knowsAbout: [
        'Dubai Real Estate',
        'UAE Property Market',
        'Off-Plan Properties Dubai',
        'Luxury Villas Dubai',
        'Apartments for Sale Dubai',
        'Apartments for Rent Dubai',
        'Palm Jumeirah Properties',
        'Downtown Dubai Apartments',
        'Dubai Marina Real Estate',
        'Business Bay Properties',
        'Golden Visa UAE',
        'Property Investment UAE',
        'Sharjah Real Estate',
        'Abu Dhabi Properties',
        'Emaar Properties',
        'DAMAC Properties',
        'Nakheel Properties',
        'Dubai Properties',
        'Sobha Realty',
        'Omniyat',
        'Meraas',
        'Azizi Developments',
        'Danube Properties',
        'Binghatti',
        'Ellington Properties',
      ],
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-service-area', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => { script.remove(); };
  }, []);

  return null;
};

export default SEOServiceArea;
