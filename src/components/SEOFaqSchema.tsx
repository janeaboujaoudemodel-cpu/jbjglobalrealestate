import { useEffect } from 'react';

interface FaqItem {
  question: string;
  answer: string;
}

interface SEOFaqSchemaProps {
  faqs: FaqItem[];
}

/**
 * Injects FAQPage JSON-LD structured data for Google rich snippets.
 * Use on FAQ pages: /faq, /buyer-faq, /seller-faq, /investor-faq, /landlord-faq, /tenant-faq
 */
export const SEOFaqSchema = ({ faqs }: SEOFaqSchemaProps) => {
  useEffect(() => {
    if (!faqs || faqs.length === 0) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-faq-schema', 'true');
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => { script.remove(); };
  }, [faqs]);

  return null;
};

export default SEOFaqSchema;
