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

// Sample featured listings data - in production this would come from API/database
const sampleListings: Listing[] = [
  {
    id: "1",
    status: "available",
    purpose: "buy",
    title: "Luxury 3BR Apartment in Downtown Dubai",
    description: "Stunning views of Burj Khalifa with modern finishes",
    price: 3500000,
    currency: "AED",
    location: { area: "Downtown Dubai", community: "Boulevard Point", address: "", lat: 25.1972, lng: 55.2744 },
    propertyType: "apartment",
    bedrooms: 3,
    bathrooms: 4,
    sizeSqFt: 2150,
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"],
    videoUrl: null,
    virtualTourUrl: null,
    amenities: ["Pool", "Gym", "Parking"],
    developer: "Emaar",
    projectName: "Boulevard Point",
    agent: { id: "a1", name: "Sarah Johnson", photoUrl: "", phone: CONTACT_INFO.phoneRaw, whatsapp: CONTACT_INFO.whatsappNumber, email: CONTACT_INFO.email, languages: ["English", "Arabic"] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referenceCode: "JBJ-DT-001",
  },
  {
    id: "2",
    status: "available",
    purpose: "buy",
    title: "5BR Villa with Private Pool in Emirates Hills",
    description: "Exclusive golf course views with premium finishes",
    price: 18500000,
    currency: "AED",
    location: { area: "Emirates Hills", community: "Sector E", address: "", lat: 25.0657, lng: 55.1713 },
    propertyType: "villa",
    bedrooms: 5,
    bathrooms: 6,
    sizeSqFt: 8500,
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"],
    videoUrl: null,
    virtualTourUrl: null,
    amenities: ["Private Pool", "Garden", "Maid's Room"],
    developer: null,
    projectName: null,
    agent: { id: "a1", name: "Sarah Johnson", photoUrl: "", phone: CONTACT_INFO.phoneRaw, whatsapp: CONTACT_INFO.whatsappNumber, email: CONTACT_INFO.email, languages: ["English", "Arabic"] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referenceCode: "JBJ-EH-002",
  },
  {
    id: "3",
    status: "available",
    purpose: "buy",
    title: "2BR Marina View Apartment",
    description: "Modern apartment with stunning marina views",
    price: 2200000,
    currency: "AED",
    location: { area: "Dubai Marina", community: "Marina Gate", address: "", lat: 25.0805, lng: 55.1403 },
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 3,
    sizeSqFt: 1450,
    images: ["https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800"],
    videoUrl: null,
    virtualTourUrl: null,
    amenities: ["Pool", "Gym", "Concierge"],
    developer: "Select Group",
    projectName: "Marina Gate",
    agent: { id: "a1", name: "Sarah Johnson", photoUrl: "", phone: CONTACT_INFO.phoneRaw, whatsapp: CONTACT_INFO.whatsappNumber, email: CONTACT_INFO.email, languages: ["English", "Arabic"] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referenceCode: "JBJ-DM-003",
  },
  {
    id: "4",
    status: "available",
    purpose: "buy",
    title: "4BR Townhouse in Arabian Ranches",
    description: "Family-friendly community with excellent amenities",
    price: 4800000,
    currency: "AED",
    location: { area: "Arabian Ranches", community: "Samara", address: "", lat: 25.0486, lng: 55.2614 },
    propertyType: "townhouse",
    bedrooms: 4,
    bathrooms: 5,
    sizeSqFt: 3200,
    images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"],
    videoUrl: null,
    virtualTourUrl: null,
    amenities: ["Garden", "Parking", "Community Pool"],
    developer: "Emaar",
    projectName: "Samara",
    agent: { id: "a1", name: "Sarah Johnson", photoUrl: "", phone: CONTACT_INFO.phoneRaw, whatsapp: CONTACT_INFO.whatsappNumber, email: CONTACT_INFO.email, languages: ["English", "Arabic"] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referenceCode: "JBJ-AR-004",
  },
  // Rental listings
  {
    id: "5",
    status: "available",
    purpose: "rent",
    title: "1BR Furnished Apartment in JBR",
    description: "Beach access with full sea views",
    price: 120000,
    currency: "AED",
    location: { area: "JBR", community: "Rimal", address: "", lat: 25.0772, lng: 55.1323 },
    propertyType: "apartment",
    bedrooms: 1,
    bathrooms: 2,
    sizeSqFt: 850,
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
    videoUrl: null,
    virtualTourUrl: null,
    amenities: ["Beach Access", "Pool", "Gym"],
    developer: "Meraas",
    projectName: "Rimal",
    agent: { id: "a1", name: "Sarah Johnson", photoUrl: "", phone: CONTACT_INFO.phoneRaw, whatsapp: CONTACT_INFO.whatsappNumber, email: CONTACT_INFO.email, languages: ["English", "Arabic"] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referenceCode: "JBJ-JBR-005",
  },
  {
    id: "6",
    status: "available",
    purpose: "rent",
    title: "2BR Apartment in Business Bay",
    description: "Modern apartment with canal views",
    price: 95000,
    currency: "AED",
    location: { area: "Business Bay", community: "Bay Square", address: "", lat: 25.1844, lng: 55.2639 },
    propertyType: "apartment",
    bedrooms: 2,
    bathrooms: 2,
    sizeSqFt: 1200,
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
    videoUrl: null,
    virtualTourUrl: null,
    amenities: ["Pool", "Gym", "Parking"],
    developer: null,
    projectName: "Bay Square",
    agent: { id: "a1", name: "Sarah Johnson", photoUrl: "", phone: CONTACT_INFO.phoneRaw, whatsapp: CONTACT_INFO.whatsappNumber, email: CONTACT_INFO.email, languages: ["English", "Arabic"] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referenceCode: "JBJ-BB-006",
  },
  {
    id: "7",
    status: "available",
    purpose: "rent",
    title: "3BR Villa in Jumeirah",
    description: "Private garden with modern interiors",
    price: 280000,
    currency: "AED",
    location: { area: "Jumeirah", community: "Jumeirah 2", address: "", lat: 25.2145, lng: 55.2539 },
    propertyType: "villa",
    bedrooms: 3,
    bathrooms: 4,
    sizeSqFt: 3500,
    images: ["https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800"],
    videoUrl: null,
    virtualTourUrl: null,
    amenities: ["Private Garden", "Parking", "Maid's Room"],
    developer: null,
    projectName: null,
    agent: { id: "a1", name: "Sarah Johnson", photoUrl: "", phone: CONTACT_INFO.phoneRaw, whatsapp: CONTACT_INFO.whatsappNumber, email: CONTACT_INFO.email, languages: ["English", "Arabic"] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referenceCode: "JBJ-JUM-007",
  },
  {
    id: "8",
    status: "available",
    purpose: "rent",
    title: "Studio in Dubai Hills",
    description: "Brand new with park views",
    price: 55000,
    currency: "AED",
    location: { area: "Dubai Hills", community: "Collective", address: "", lat: 25.1018, lng: 55.2392 },
    propertyType: "apartment",
    bedrooms: 0,
    bathrooms: 1,
    sizeSqFt: 450,
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800"],
    videoUrl: null,
    virtualTourUrl: null,
    amenities: ["Pool", "Gym", "Retail"],
    developer: "Emaar",
    projectName: "Collective",
    agent: { id: "a1", name: "Sarah Johnson", photoUrl: "", phone: CONTACT_INFO.phoneRaw, whatsapp: CONTACT_INFO.whatsappNumber, email: CONTACT_INFO.email, languages: ["English", "Arabic"] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    referenceCode: "JBJ-DH-008",
  },
];

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

  return (
    <section className="py-16 md:py-24 bg-black">
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
                ? 'bg-gold text-black shadow-lg'
                : 'bg-black/5 text-black hover:bg-black/10'
            }`}
          >
            <Home className="w-4 h-4" />
            {t('featured.buy', 'Buy')}
          </button>
          <button
            onClick={() => setActiveTab('rent')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === 'rent'
                ? 'bg-gold text-black shadow-lg'
                : 'bg-black/5 text-black hover:bg-black/10'
            }`}
          >
            <Key className="w-4 h-4" />
            {t('featured.rent', 'Rent')}
          </button>
        </div>

        {/* Listings Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          >
            {filteredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </motion.div>
        </AnimatePresence>

        {/* View All CTA */}
        <div className="text-center mt-10">
          <Link
            to={activeTab === 'buy' ? '/properties?transaction=buy' : '/properties?transaction=rent'}
            className="inline-flex items-center gap-2 px-6 py-3 bg-black text-gold hover:bg-gold hover:text-black border-2 border-gold rounded-full font-medium transition-all duration-300"
          >
            {t('featured.viewAll', 'View All Properties')}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
