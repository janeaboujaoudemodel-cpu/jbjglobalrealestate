import * as React from "react";

// ============================================================
// EDITABLE DATA - Edit the arrays below to add/change listings
// ============================================================

interface Listing {
  id: number;
  image: string; // URL or imported image path
  title: string;
  location: string;
  price: string;
  bedrooms: string;
  description: string;
}

interface Developer {
  id: string;
  name: string;
  logo: string; // URL or imported image path
  listings: Listing[];
}

// Edit this array to add developers and their listings
// Empty fields (image="", title="") will be automatically hidden from viewers
const developersData: Developer[] = [
  {
    id: "emaar",
    name: "EMAAR",
    logo: "", // Add logo URL here
    listings: [
      { id: 1, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 2, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 3, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 4, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 5, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 6, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 7, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 8, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 9, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
    ],
  },
  {
    id: "damac",
    name: "DAMAC",
    logo: "", // Add logo URL here
    listings: [
      { id: 1, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 2, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 3, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 4, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 5, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 6, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 7, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 8, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 9, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
    ],
  },
  {
    id: "meraas",
    name: "MERAAS",
    logo: "", // Add logo URL here
    listings: [
      { id: 1, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 2, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 3, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 4, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 5, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 6, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 7, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 8, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 9, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
    ],
  },
  {
    id: "sobha",
    name: "SOBHA",
    logo: "", // Add logo URL here
    listings: [
      { id: 1, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 2, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 3, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 4, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 5, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 6, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 7, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 8, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 9, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
    ],
  },
  {
    id: "nakheel",
    name: "NAKHEEL",
    logo: "", // Add logo URL here
    listings: [
      { id: 1, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 2, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 3, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 4, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 5, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 6, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 7, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 8, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 9, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
    ],
  },
  {
    id: "aldar",
    name: "ALDAR",
    logo: "", // Add logo URL here
    listings: [
      { id: 1, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 2, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 3, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 4, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 5, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 6, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 7, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 8, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 9, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
    ],
  },
];

// ============================================================
// COMPONENT CODE - No need to edit below this line
// ============================================================

const isListingComplete = (listing: Listing): boolean => {
  return !!(listing.image && listing.title);
};

const ListingCard = ({ listing }: { listing: Listing }) => (
  <div className="group relative overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4A017]/50 transition-all duration-300">
    {/* Image */}
    <div className="aspect-[4/3] overflow-hidden">
      <img
        src={listing.image}
        alt={listing.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>

    {/* Content */}
    <div className="p-4">
      <h4
        className="text-white text-lg font-semibold mb-1 line-clamp-1"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {listing.title}
      </h4>

      {listing.location && (
        <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {listing.location}
        </p>
      )}

      {listing.bedrooms && (
        <p className="text-gray-500 text-sm mb-2">
          {listing.bedrooms}
        </p>
      )}

      {listing.description && (
        <p className="text-gray-500 text-sm line-clamp-2 mb-3">
          {listing.description}
        </p>
      )}

      {listing.price && (
        <p className="text-[#D4A017] font-semibold text-lg">
          {listing.price}
        </p>
      )}
    </div>

    {/* Hover overlay */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
  </div>
);

const DeveloperSection = ({ developer }: { developer: Developer }) => {
  const visibleListings = developer.listings.filter(isListingComplete);

  // Don't render section if no listings are complete
  if (visibleListings.length === 0) {
    return null;
  }

  return (
    <div className="mb-16">
      {/* Developer Header */}
      <div className="flex items-center gap-4 mb-8">
        {developer.logo && (
          <img
            src={developer.logo}
            alt={developer.name}
            className="h-12 w-auto object-contain"
          />
        )}
        <h3
          className="text-[#D4A017] text-2xl md:text-3xl font-semibold"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {developer.name}
        </h3>
        <div className="flex-1 h-px bg-gradient-to-r from-[#D4A017]/50 to-transparent" />
      </div>

      {/* Listings Grid - 3x3 responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleListings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
};

const DeveloperListings = () => {
  const developersWithListings = developersData.filter(
    (dev) => dev.listings.some(isListingComplete)
  );

  return (
    <section
      className="relative w-full py-16 md:py-24"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)",
      }}
    >
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(212, 160, 23, 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-16">
          <p
            className="text-[#D4A017] text-sm tracking-[0.2em] uppercase mb-3"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            PROPERTIES
          </p>
          <h2
            className="text-white text-3xl md:text-4xl lg:text-5xl font-semibold mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Curated Listings. Global Standard.
          </h2>
          <p
            className="text-gray-400 text-base md:text-lg max-w-2xl mx-auto"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Exclusive investment-grade properties with trusted advisory.
          </p>
        </div>

        {/* Developer Sections */}
        {developersWithListings.length > 0 ? (
          developersWithListings.map((developer) => (
            <DeveloperSection key={developer.id} developer={developer} />
          ))
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg" style={{ fontFamily: "Poppins, sans-serif" }}>
              No listings available yet. Edit the data in{" "}
              <code className="text-[#D4A017] bg-[#1a1a1a] px-2 py-1 rounded">
                src/components/DeveloperListings.tsx
              </code>{" "}
              to add properties.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default DeveloperListings;
