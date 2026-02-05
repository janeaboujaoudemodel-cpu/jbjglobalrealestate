/**
 * FeaturedListings Component - Master Blueprint Specification
 * Displays 8 featured listing cards with Buy/Rent tabs
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Key, Bed, Bath, Maximize, MapPin, MessageCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import type { Listing } from "@/types/blueprint";

// Empty listings array - no fake data, will be populated from database
const sampleListings: Listing[] = [];

const formatPrice = (price: number, purpose: 'buy' | 'rent'): string => {
  if (price >= 1000000) {
    return `AED ${(price / 1000000).toFixed(1)}M${purpose === 'rent' ? '/yr' : ''}`;
  }
  return `AED ${price.toLocaleString()}${purpose === 'rent' ? '/yr' : ''}`;
};

interface ListingCardProps {
  listing: Listing;
}

const ListingCard = ({ listing }: ListingCardProps) => {
  const whatsappMessage = `Hi, I'm interested in ${listing.title} (Ref: ${listing.referenceCode}) in ${listing.location.area}. Please share more details.`;
  const whatsappUrl = getWhatsAppUrl(whatsappMessage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="group"
    >
      <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl overflow-hidden border-2 border-gold/30 hover:border-gold transition-all duration-300 hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold ${
              listing.purpose === 'buy' 
                ? 'bg-gold text-black' 
                : 'bg-black text-gold'
            }`}>
              {listing.purpose === 'buy' ? 'For Sale' : 'For Rent'}
            </span>
          </div>
          {/* Price Badge */}
          <div className="absolute bottom-3 right-3">
            <span className="px-3 py-1.5 bg-black/80 backdrop-blur-sm text-gold font-bold text-sm rounded-lg">
              {formatPrice(listing.price, listing.purpose)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Location */}
          <div className="flex items-center gap-1.5 text-zinc-600 text-xs mb-2">
            <MapPin className="w-3.5 h-3.5 text-gold" />
            <span>{listing.location.area}</span>
          </div>

          {/* Title */}
          <h3 className="text-black font-semibold text-sm mb-3 line-clamp-2 group-hover:text-gold transition-colors" style={{ fontFamily: "Poppins, sans-serif" }}>
            {listing.title}
          </h3>

          {/* Key Facts */}
          <div className="flex items-center gap-4 text-zinc-600 text-xs mb-4">
            <div className="flex items-center gap-1">
              <Bed className="w-3.5 h-3.5" />
              <span>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} Bed`}</span>
            </div>
            <div className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" />
              <span>{listing.bathrooms} Bath</span>
            </div>
            <div className="flex items-center gap-1">
              <Maximize className="w-3.5 h-3.5" />
              <span>{listing.sizeSqFt.toLocaleString()} sqft</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
              onClick={() => {
                // Track event: listing_card_whatsapp_click
                if (typeof window !== 'undefined' && (window as any).gtag) {
                  (window as any).gtag('event', 'listing_card_whatsapp_click', {
                    listing_id: listing.id,
                    reference_code: listing.referenceCode,
                  });
                }
              }}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
            <Link
              to={`/property/${listing.referenceCode}`}
              className="flex-1 flex items-center justify-center gap-1.5 bg-black hover:bg-gold text-white hover:text-black text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              View Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const FeaturedListings = () => {
  const [activeTab, setActiveTab] = useState<'buy' | 'rent'>('buy');
  const { t } = useLanguage();

  const filteredListings = sampleListings.filter(l => l.purpose === activeTab).slice(0, 4);
  const hasListings = filteredListings.length > 0;

  return (
    <section className="py-12 md:py-16 bg-black">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-xs uppercase tracking-[0.2em] font-semibold mb-4">
            <Home className="w-3.5 h-3.5 text-gold" />
            <span className="text-black">{t('featured.title', 'Featured Properties')}</span>
          </span>
          <h2 
            className="text-2xl md:text-3xl font-bold text-black"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t('featured.heading', 'Handpicked For You')}
          </h2>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('buy')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === 'buy'
                ? 'bg-white/90 text-black shadow-lg border-2 border-gold/60 backdrop-blur-sm'
                : 'bg-gradient-to-r from-[#F5EBD7]/40 via-[#E8DCC8]/40 to-[#D4C4A8]/40 text-black hover:bg-white/60 border border-gold/30'
            }`}
          >
            <Home className="w-4 h-4" />
            {t('featured.buy', 'Buy')}
          </button>
          <button
            onClick={() => setActiveTab('rent')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === 'rent'
                ? 'bg-white/90 text-black shadow-lg border-2 border-gold/60 backdrop-blur-sm'
                : 'bg-gradient-to-r from-[#F5EBD7]/40 via-[#E8DCC8]/40 to-[#D4C4A8]/40 text-black hover:bg-white/60 border border-gold/30'
            }`}
          >
            <Key className="w-4 h-4" />
            {t('featured.rent', 'Rent')}
          </button>
        </div>

        {/* Listings Grid or Empty State */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {hasListings ? (
              filteredListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))
            ) : (
              // Empty placeholder cards
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl overflow-hidden border-2 border-gold/40 hover:border-gold transition-colors">
                  <div className="aspect-[4/3] bg-gradient-to-br from-gold/5 to-gold/10 flex items-center justify-center">
                    <Home className="w-10 h-10 text-gold/30" />
                  </div>
                  <div className="p-4">
                    <div className="h-3 bg-gold/10 rounded w-2/3 mb-3" />
                    <div className="h-4 bg-gold/10 rounded w-full mb-2" />
                    <div className="h-4 bg-gold/10 rounded w-3/4 mb-4" />
                    <div className="flex gap-3">
                      <div className="h-3 bg-gold/10 rounded w-16" />
                      <div className="h-3 bg-gold/10 rounded w-16" />
                    </div>
                    <p className="text-xs text-zinc-500 mt-4 text-center">Listings coming soon</p>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        </AnimatePresence>

        {/* View All CTA - 3D Premium Button */}
        <div className="text-center mt-10">
          <Link
            to={activeTab === 'buy' ? '/properties?transaction=buy' : '/properties?transaction=rent'}
            className="relative inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold rounded-xl transition-all duration-300 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 hover:scale-[1.02] transform active:scale-95 group"
            style={{
              boxShadow: `
                0 10px 30px rgba(200,167,102,0.4),
                0 6px 15px rgba(0,0,0,0.2),
                inset 0 2px 4px rgba(255,255,255,0.9),
                inset 0 -2px 4px rgba(200,167,102,0.2),
                0 0 20px rgba(200,167,102,0.3)
              `,
            }}
          >
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
            <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
            <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
            <span className="relative flex items-center gap-2">
              <span className="text-black">{t('featured.viewAll', 'View All Properties')}</span>
              <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
