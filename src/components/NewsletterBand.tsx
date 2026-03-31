/**
 * NewsletterBand Component - Global "Stay in the Loop" Section
 * Displays above the footer on ALL pages
 */

import { NewsletterBrevo } from "@/components/marketing/NewsletterBrevo";

interface NewsletterBandProps {
  className?: string;
}

const NewsletterBand = ({ className = "" }: NewsletterBandProps) => {
  return (
     <section className={`py-12 md:py-16 bg-gray-50 ${className}`}>
       <div className="mx-1 sm:mx-2 md:mx-3 lg:mx-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        {/* Premium Title */}
        <h3 className="text-center text-2xl md:text-3xl font-bold mb-3 uppercase tracking-[0.15em] text-black">
          ✦ Stay in the Loop ✦
        </h3>
        <p className="text-center text-gray-500 text-sm md:text-base mb-6 max-w-xl mx-auto">
          Be the first to access new listings, market updates, and personalized brokerage guidance.
        </p>
        <div className="max-w-lg mx-auto">
          <NewsletterBrevo variant="compact" source="newsletter_band" />
        </div>
      </div>
    </section>
  );
};

export default NewsletterBand;
