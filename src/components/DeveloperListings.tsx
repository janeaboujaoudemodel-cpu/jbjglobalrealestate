import * as React from "react";

// ============================================================
// EDITABLE DATA - Edit the arrays below to add/change listings
// Developers ordered from top UAE developers to newest
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
  listings: Listing[];
}

// Create 12 empty listing slots
const createEmptyListings = (): Listing[] => [
  { id: 1, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 2, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 3, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 4, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 5, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 6, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 7, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 8, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 9, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 10, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 11, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
  { id: 12, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
];

// Developers ordered from top UAE developers to newest
const developersData: Developer[] = [
  { 
    id: "emaar", 
    name: "EMAAR", 
    listings: [
      { id: 1, image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800", title: "The Valley Phase 2", location: "Dubai Land", price: "AED 1,200,000", bedrooms: "3 Bedrooms", description: "Modern townhouses with premium finishes and community amenities" },
      { id: 2, image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800", title: "Dubai Hills Estate", location: "Dubai Hills", price: "AED 2,500,000", bedrooms: "4 Bedrooms", description: "Luxury villas overlooking the championship golf course" },
      { id: 3, image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800", title: "Creek Harbour Residences", location: "Dubai Creek", price: "AED 1,800,000", bedrooms: "2 Bedrooms", description: "Waterfront apartments with stunning creek views" },
      { id: 4, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800", title: "Arabian Ranches III", location: "Arabian Ranches", price: "AED 3,200,000", bedrooms: "5 Bedrooms", description: "Exclusive family homes in a gated community" },
      { id: 5, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 6, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 7, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 8, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 9, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 10, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 11, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
      { id: 12, image: "", title: "", location: "", price: "", bedrooms: "", description: "" },
    ]
  },
  { id: "nakheel", name: "NAKHEEL", listings: createEmptyListings() },
  { id: "dubai-holding", name: "DUBAI HOLDING", listings: createEmptyListings() },
  { id: "damac", name: "DAMAC", listings: createEmptyListings() },
  { id: "meraas", name: "MERAAS", listings: createEmptyListings() },
  { id: "sobha", name: "SOBHA", listings: createEmptyListings() },
  { id: "aldar", name: "ALDAR", listings: createEmptyListings() },
  { id: "deyaar", name: "DEYAAR", listings: createEmptyListings() },
  { id: "azizi", name: "AZIZI", listings: createEmptyListings() },
  { id: "danube", name: "DANUBE", listings: createEmptyListings() },
  { id: "binghatti", name: "BINGHATTI", listings: createEmptyListings() },
  { id: "omniyat", name: "OMNIYAT", listings: createEmptyListings() },
  { id: "ellington", name: "ELLINGTON", listings: createEmptyListings() },
  { id: "select-group", name: "SELECT GROUP", listings: createEmptyListings() },
  { id: "samana", name: "SAMANA", listings: createEmptyListings() },
];

// ============================================================
// COMPONENT CODE - No need to edit below this line
// ============================================================

const isListingComplete = (listing: Listing): boolean => {
  return !!(listing.image && listing.title);
};

const ListingCard = ({ listing }: { listing: Listing }) => (
  <div className="group relative overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#D4A017]/50 transition-all duration-300">
    <div className="aspect-[4/3] overflow-hidden">
      <img
        src={listing.image}
        alt={listing.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
    </div>
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
        <p className="text-gray-500 text-sm mb-2">{listing.bedrooms}</p>
      )}
      {listing.description && (
        <p className="text-gray-500 text-sm line-clamp-2 mb-3">{listing.description}</p>
      )}
      {listing.price && (
        <p className="text-[#D4A017] font-semibold text-lg">{listing.price}</p>
      )}
    </div>
    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
  </div>
);

const DeveloperSection = ({ developer }: { developer: Developer }) => {
  const visibleListings = developer.listings.filter(isListingComplete);

  if (visibleListings.length === 0) {
    return null;
  }

  return (
    <div className="mb-20">
      {/* Developer Name - H2, Poppins, 56px, line-height 1.2 */}
      <h2
        className="text-white font-semibold mb-10"
        style={{
          fontFamily: "Poppins, sans-serif",
          fontSize: "56px",
          lineHeight: "1.2",
        }}
      >
        {developer.name}
      </h2>

      {/* Listings Grid - 4 columns on desktop, 2 on tablet, 1 on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
      <div
        className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(212, 160, 23, 0.08) 0%, transparent 60%)",
        }}
      />

      <div className="relative z-10 container mx-auto px-4">
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
