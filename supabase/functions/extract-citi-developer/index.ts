import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ============================================================================
// CITI DEVELOPERS — HARDCODED EXTRACTED DATA
// ============================================================================

const DEVELOPER = {
  name: "Citi Developers",
  slug: "citi-developers",
  description:
    "Citi Developers is a leading real estate development company with 18+ projects across 3 countries, delivering over 350,000 homes to 500,000+ customers and developing more than 1,000 million sq ft. Their portfolio spans luxury residential, hospitality-grade wellness resorts, and innovative smart-living communities. Known for integrating IoT technology, personal assistant robots, and premium European fixtures (Miele, SMEG, Villeroy & Boch) into every project, Citi Developers represents the future of neo-luxury living.",
  logo_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Flogo%2Fciti-logo.svg&w=384&q=75",
  feature_image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Farya-banner.webp&w=3840&q=75",
  source_url: "https://citideveloper.com",
};

const PROJECTS = [
  // ========== 1. ARYA RESIDENCES ==========
  {
    name: "ARYA Residences",
    slug: "arya-residences",
    source_url: "https://citideveloper.com/projects/arya",
    developer_name: "Citi Developers",
    emirate: "Dubai",
    location: "Dubai Islands",
    area_name: "Dubai Islands",
    description:
      "Experience the perfect blend of modern design and timeless elegance with ARYA Residences — neo luxury apartments on Dubai Islands. Every space is crafted to redefine urban living, offering unmatched comfort, style, and innovation. From stunning interiors to world-class amenities, these residences are more than just homes — they are an elevated lifestyle curated for those who value sophistication and exclusivity. Building configuration: Ground + 2 Podiums + 10 Residential Floors + Roof. Premium features include IoT-enabled apartments, personal assistant robots, fully furnished interiors with custom furniture, sky pools, Miele appliances, and Villeroy & Boch cutlery.",
    short_description: "Neo luxury apartments on Dubai Islands with IoT-enabled living, personal robots, sky pools, and Miele appliances.",
    price_from: 1900000,
    bedrooms_min: 0,
    bedrooms_max: 5,
    floors: 13,
    total_units: null,
    payment_plan: "60/40",
    handover_date: null,
    construction_status: "Under Construction",
    sale_status: "On Sale",
    property_type_label: "Apartments",
    amenities: [
      "Lobby & Concierge", "Executive Business Center", "Cigar Lounge",
      "Roman Bath", "Spa (Men & Women)", "Hammams", "Sauna & Steam",
      "Lap Pool", "Fitness Pavilion", "Game Room", "Private Cinema",
      "Infinity Pool (Rooftop)", "Sky Cabanas", "Sunken Pool Bar",
      "IoT-Enabled Building", "Personal Assistant Robot", "Sky Pools"
    ],
    amenities_list: [
      { zone: "The Galore", floor: "Ground Floor", description: "A refined threshold where art, hospitality, and utility converge. Features concierge services and a fully equipped executive business center.", amenities: ["Lobby", "Concierge", "Business Center"] },
      { zone: "The Under Canvas", floor: "Mezzanine Floor", description: "ARYA's cigar lounge offers a space of cultivated indulgence with warm tones, plush textures, and thoughtfully arranged seating.", amenities: ["Cigar Lounge"] },
      { zone: "The Forte", floor: "First Floor", description: "ARYA's complete wellness and leisure level dedicated to restoration, movement, and vitality. Brings together ancient rituals and modern wellness.", amenities: ["Roman Bath", "Spa", "Hammams", "Sauna & Steam", "Lap Pool", "Fitness Pavilion", "Game Room", "Private Cinema"] },
      { zone: "The Eleventh Sky", floor: "Rooftop", description: "The rooftop crown with panoramic views of the marina and skyline. Captures the spirit of rooftop living with a refined, contemporary edge.", amenities: ["Infinity Pool", "Cabanas", "Sunken Pool Bar"] }
    ],
    highlights: [
      "IoT-Enabled Building & Apartments",
      "Personal Assistant Robot in Every Apartment",
      "Fully Furnished with Custom Furniture",
      "Sky Pools in All Apartments",
      "Miele Appliances | Villeroy & Boch Cutlery"
    ],
    location_distances: [
      { label: "Walk to the Marina", time: "1 Minute" },
      { label: "Drive to the Beach", time: "2 Minutes" },
      { label: "Walk to the Retail Boulevard", time: "3 Minutes" },
      { label: "Drive to Airport", time: "10 Minutes" },
      { label: "Drive to Downtown Dubai", time: "15 Minutes" }
    ],
    location_headline: "Dubai Islands — Coastal Luxury",
    location_description: "Dubai Islands epitomize coastal luxury with 21 km beachfront, 9 world-class marinas, 86 resorts and hotels, and 2 championship-level golf courses.",
    unit_types: [
      { type: "Studio", label: "Studio Apartments" },
      { type: "1BR", label: "One-Bedroom Apartments" },
      { type: "2BR", label: "Two-Bedroom Apartments" },
      { type: "3BR", label: "Three-Bedroom Apartments" },
      { type: "4BR Duplex", label: "Four-Bedroom Duplex Apartments" },
      { type: "5BR Penthouse", label: "Five-Bedroom Penthouse Apartments" }
    ],
    payment_breakdown: [
      { milestone: "Booking", percent: 60, note: "60% during construction" },
      { milestone: "Handover", percent: 40, note: "40% on handover" }
    ],
    images: [
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Farya-banner.webp&w=3840&q=75", alt_text: "ARYA Residences Banner", display_order: 0 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Farya-hands.webp&w=1920&q=75", alt_text: "ARYA Dubai luxury apartment", display_order: 1 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Flobby.webp&w=3840&q=50", alt_text: "ARYA Lobby", display_order: 2 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Farya-unit-types.webp&w=3840&q=75", alt_text: "ARYA Unit Types", display_order: 3 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Farya-1.png&w=3840&q=75", alt_text: "ARYA Lobby View", display_order: 4 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Flobby-2.webp&w=3840&q=60", alt_text: "ARYA Lobby Interior", display_order: 5 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Fbusiness-center-2.webp&w=3840&q=60", alt_text: "ARYA Business Center", display_order: 6 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Farya-2.webp&w=3840&q=75", alt_text: "ARYA Cigar Lounge", display_order: 7 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Fcigar-lounge-2.webp&w=3840&q=60", alt_text: "ARYA Cigar Lounge Detail", display_order: 8 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Farya-3.png&w=3840&q=75", alt_text: "ARYA The Forte Infinity Pool", display_order: 9 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Froman-bath-3.jpg&w=3840&q=60", alt_text: "ARYA Roman Bath", display_order: 10 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Fspa.jpg&w=3840&q=60", alt_text: "ARYA Spa", display_order: 11 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Fhammams-2.jpg&w=3840&q=60", alt_text: "ARYA Hammams", display_order: 12 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Fsauna-steam-2.jpg&w=3840&q=60", alt_text: "ARYA Sauna & Steam", display_order: 13 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Flap-pool-2.webp&w=3840&q=60", alt_text: "ARYA Lap Pool", display_order: 14 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Ffirness-pavilion-2.jpg&w=3840&q=60", alt_text: "ARYA Fitness Pavilion", display_order: 15 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Fgame-room-2.webp&w=3840&q=60", alt_text: "ARYA Game Room", display_order: 16 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Fprivate-cinema-2.jpg&w=3840&q=60", alt_text: "ARYA Private Cinema", display_order: 17 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Finfinity-pool-2.jpg&w=3840&q=60", alt_text: "ARYA Rooftop Infinity Pool", display_order: 18 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Fcabanas-2.webp&w=3840&q=60", alt_text: "ARYA Sky Cabanas", display_order: 19 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Famenities%2Fsunken-pool-bar-2.webp&w=3840&q=60", alt_text: "ARYA Sunken Pool Bar", display_order: 20 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Farya%2Farya-map.webp&w=3840&q=75", alt_text: "ARYA Location Map", display_order: 21 }
    ],
    documents: [
      { type: "factsheet", url: "https://citideveloper.com/files/Arya-FACTSHEET.pdf", name: "ARYA Factsheet" }
    ],
    review_notes: "AREA DRAFT — Dubai Islands: Dubai Islands epitomize coastal luxury with 21 km beachfront, 9 world-class marinas, 86 resorts and hotels, and 2 championship-level golf courses. A prime waterfront destination offering unparalleled island living in Dubai."
  },

  // ========== 2. AGUA RESIDENCES ==========
  {
    name: "AGUA Residences",
    slug: "agua-residences",
    source_url: "https://citideveloper.com/projects/agua",
    developer_name: "Citi Developers",
    emirate: "Dubai",
    location: "Dubai Islands",
    area_name: "Dubai Islands",
    description:
      "Experience the art of island luxury apartments in Dubai with AGUA Residences, offering modern design, waterfront views, and premium living redefined. Building configuration: Ground + 2 Podiums + 8 Residential Floors + Roof. An exclusive collection of 122 residences designed for island living, each crafted with modern layouts, premium finishes, and stunning waterfront views. Premium features include IoT-enabled apartments, personal assistant robots, fully furnished interiors with luxurious décor, sky pools, SMEG appliances, Villeroy & Boch cutlery, and park-facing views.",
    short_description: "Island luxury apartments on Dubai Islands with 122 residences, IoT-enabled living, personal robots, and SMEG appliances.",
    price_from: 1750000,
    bedrooms_min: 1,
    bedrooms_max: 4,
    floors: 11,
    total_units: 122,
    payment_plan: "10% Booking / 14% Down Payment / 1% Monthly / 50% Handover",
    handover_date: null,
    construction_status: "Under Construction",
    sale_status: "On Sale",
    property_type_label: "Apartments",
    amenities: [
      "Lobby & Concierge", "Business Center", "Cigar Lounge",
      "Roman Bath", "Spa (Men & Women)", "Sauna & Steam",
      "Yoga Studios (Indoor & Outdoor)", "Infinity Pool", "Kids' Pool & Play Area",
      "Poolside Restaurant & Bar", "Private Cinema", "Game Room",
      "Fitness Studio", "Infinity Deck (Rooftop)", "Floating Sun Loungers",
      "Sky Cabanas", "Main Pool Bar",
      "IoT-Enabled Building", "Personal Assistant Robot", "Sky Pools"
    ],
    amenities_list: [
      { zone: "The Base", floor: "Ground Floor", description: "Sets the tone for AGUA's hospitality-driven experience with a luxurious lobby, business center, exclusive cigar lounge, and dedicated concierge.", amenities: ["Lobby", "Business Center", "Cigar Lounge", "Concierge"] },
      { zone: "The One", floor: "Level One", description: "A full-level wellness and leisure zone for all ages. Includes Roman bath, spas, sauna, yoga studios, infinity pool, kids' area, cinema, game room, and fitness studio.", amenities: ["Roman Bath", "Spa", "Sauna & Steam", "Yoga Studios", "Infinity Pool", "Kids' Pool", "Cinema", "Game Room", "Fitness Studio", "Restaurant & Bar"] },
      { zone: "Cloud 9", floor: "Rooftop", description: "A rooftop escape with expansive infinity pool, sun-drenched deck, floating loungers, main pool bar, and private and public sky cabanas against panoramic views.", amenities: ["Infinity Deck", "Floating Sun Loungers", "Sky Cabanas", "Pool Bar"] }
    ],
    highlights: [
      "IoT-Enabled Building & Apartments",
      "Personal Assistant Robot in Every Apartment",
      "Fully Furnished with Luxurious Décor Pieces",
      "Sky Pools in All Apartments",
      "SMEG Appliances",
      "Villeroy & Boch Cutlery",
      "Park Facing"
    ],
    location_distances: [
      { label: "Walk to Mall", time: "2 Minutes" },
      { label: "Walk to the Marina", time: "5 Minutes" },
      { label: "Walk to the Beach", time: "5 Minutes" },
      { label: "From Airport", time: "10 Minutes" }
    ],
    location_headline: "Dubai Islands — Island Living",
    location_description: "Dubai Islands epitomize coastal luxury with 21 km beachfront, 9 world-class marinas, 86 resorts and hotels, and 2 championship-level golf courses.",
    unit_types: [
      { type: "1BR", label: "One-Bedroom Apartments" },
      { type: "2BR", label: "Two-Bedroom Apartments" },
      { type: "2BR Duplex", label: "Two-Bedroom Duplex Apartments" },
      { type: "3BR", label: "Three-Bedroom Apartments" },
      { type: "4BR", label: "Four-Bedroom Apartments" }
    ],
    payment_breakdown: [
      { milestone: "Booking", percent: 10 },
      { milestone: "Down Payment", percent: 14 },
      { milestone: "Monthly Installments", percent: 26, note: "1% monthly" },
      { milestone: "Handover", percent: 50 }
    ],
    images: [
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Fagua-banner.webp&w=3840&q=75", alt_text: "AGUA Residences Banner", display_order: 0 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Fagua-girl.webp&w=1920&q=75", alt_text: "AGUA Duplex Apartments", display_order: 1 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Finterior%2Fagua-inter-1.webp&w=3840&q=50", alt_text: "AGUA Interior", display_order: 2 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Fagua-unit-type.webp&w=3840&q=75", alt_text: "AGUA Unit Types", display_order: 3 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Fthe-base.webp&w=3840&q=75", alt_text: "AGUA The Base", display_order: 4 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Flobby.webp&w=3840&q=60", alt_text: "AGUA Lobby", display_order: 5 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Fbusiness-center.jpg&w=3840&q=60", alt_text: "AGUA Business Center", display_order: 6 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Fcigar-lounge.webp&w=3840&q=60", alt_text: "AGUA Cigar Lounge", display_order: 7 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Fthe-one.jpg&w=3840&q=75", alt_text: "AGUA The One Wellness Zone", display_order: 8 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Froman-bath.webp&w=3840&q=60", alt_text: "AGUA Roman Bath", display_order: 9 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Fspa.jpg&w=3840&q=60", alt_text: "AGUA Spa", display_order: 10 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Flap-pool.webp&w=3840&q=60", alt_text: "AGUA Lap Pool", display_order: 11 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Fyoga-studio.webp&w=3840&q=60", alt_text: "AGUA Yoga Studio", display_order: 12 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Ffitness-studio.webp&w=3840&q=60", alt_text: "AGUA Fitness Studio", display_order: 13 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Fcloud-9.webp&w=3840&q=75", alt_text: "AGUA Cloud 9 Rooftop", display_order: 14 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Finfinity-deck.jpg&w=3840&q=60", alt_text: "AGUA Infinity Deck", display_order: 15 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Ffloating-sun-loungers.webp&w=3840&q=60", alt_text: "AGUA Floating Sun Loungers", display_order: 16 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Famenities%2Fcabanas.webp&w=3840&q=60", alt_text: "AGUA Sky Cabanas", display_order: 17 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Fagua%2Fagua-map.webp&w=3840&q=75", alt_text: "AGUA Location Map", display_order: 18 }
    ],
    documents: [
      { type: "factsheet", url: "https://citideveloper.com/files/AGUAFactSheet.pdf", name: "AGUA Factsheet" }
    ],
    review_notes: "AREA DRAFT — Dubai Islands: Dubai Islands epitomize coastal luxury with 21 km beachfront, 9 world-class marinas, 86 resorts and hotels, and 2 championship-level golf courses."
  },

  // ========== 3. AVELINE RESIDENCES ==========
  {
    name: "AVELINE Residences",
    slug: "aveline-residences",
    source_url: "https://citideveloper.com/projects/aveline",
    developer_name: "Citi Developers",
    emirate: "Dubai",
    location: "JVC (Jumeirah Village Circle)",
    area_name: "Jumeirah Village Circle",
    description:
      "Aveline Dubai luxury residences bring together sophistication, comfort, and modern design in one of the city's most sought-after locations — JVC (Jumeirah Village Circle). Building configuration: Ground + 3 Podiums + 17 Residential Floors + Roof. A total of 263 apartments featuring stylish studios, spacious 1-bedroom layouts, elegant 2-bedroom residences, and expansive 3-bedroom apartments. Each unit is designed with premium finishes and modern functionality, providing residents with the perfect blend of comfort and sophistication.",
    short_description: "Luxury residences in JVC with 263 apartments, starting from AED 595K with Q2 2026 handover.",
    price_from: 595000,
    bedrooms_min: 0,
    bedrooms_max: 3,
    floors: 21,
    total_units: 263,
    payment_plan: "Attractive payment plan available",
    handover_date: "Q2 2026",
    handover_display: "Q2 2026",
    construction_status: "Under Construction",
    sale_status: "On Sale",
    property_type_label: "Apartments",
    amenities: [
      "Lobby", "Beach-Style Pool", "Mini Cinema", "State-of-the-Art Gym",
      "Spa & Sauna", "Kids' Pool & Play Area", "Games Area",
      "Yoga Area", "Jogging Track", "Padel Court", "Mini Golf",
      "Lap Pool (13th Floor)"
    ],
    amenities_list: [
      { zone: "Ground Floor", floor: "Ground Floor", description: "Designed for active lifestyles and family-friendly moments. Features state-of-the-art gym, serene spa and sauna, spacious beach-style pool, kids' pool and play area, games area, and cozy mini cinema.", amenities: ["Lobby", "Gym", "Spa & Sauna", "Beach Pool", "Kids' Pool", "Play Area", "Games Area", "Mini Cinema"] },
      { zone: "11th Floor", floor: "11th Floor", description: "Wellness takes center stage with a tranquil yoga area, scenic jogging track, padel court, and mini golf — all against elevated city views.", amenities: ["Yoga Area", "Jogging Track", "Padel Court", "Mini Golf"] },
      { zone: "13th Floor", floor: "13th Floor", description: "A sophisticated lap pool elevated for privacy and panoramic views, ideal for morning swims or winding down the day.", amenities: ["Lap Pool"] }
    ],
    highlights: [
      "263 Total Apartments",
      "Starting from AED 595,000",
      "Q2 2026 Handover",
      "Ground + 3 Podiums + 17 Residential Floors",
      "Premium Finishes & Modern Functionality"
    ],
    location_distances: [
      { label: "Circle Mall", time: "2 Minutes" },
      { label: "Dubai Hills Mall", time: "9 Minutes" },
      { label: "Jebel Ali Racecourse", time: "9 Minutes" },
      { label: "Sufouh Beach", time: "10 Minutes" },
      { label: "Al Khail Metro Station", time: "10 Minutes" },
      { label: "Mall of the Emirates", time: "15 Minutes" },
      { label: "Dubai Marina", time: "15 Minutes" },
      { label: "Downtown Dubai", time: "25 Minutes" }
    ],
    location_headline: "JVC — Jumeirah Village Circle",
    location_description: "JVC (Jumeirah Village Circle) is one of Dubai's most sought-after neighborhoods, offering modern design, lush green surroundings, and convenient connectivity. A vibrant community for families and professionals seeking elegance, functionality, and a thriving lifestyle.",
    unit_types: [
      { type: "Studio", label: "Studio Apartments" },
      { type: "1BR", label: "One-Bedroom Apartments" },
      { type: "2BR", label: "Two-Bedroom Apartments" },
      { type: "3BR", label: "Three-Bedroom Apartments" }
    ],
    payment_breakdown: null,
    images: [
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2Faveline-banner.jpg&w=1920&q=75", alt_text: "AVELINE Residences Banner", display_order: 0 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2Faveline-art.webp&w=1080&q=75", alt_text: "AVELINE Architecture", display_order: 1 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2Fcrafting.webp&w=3840&q=75", alt_text: "AVELINE Crafting Details", display_order: 2 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FApartment%2F3%20BEDROOM%20APARTMENT%2FLiving%20Room%2F1_View02_Post.webp&w=3840&q=75", alt_text: "AVELINE 3BR Living Room", display_order: 3 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-right-side-11.webp&w=3840&q=75", alt_text: "AVELINE Ground Floor Amenities", display_order: 4 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-lobby-33.webp&w=3840&q=60", alt_text: "AVELINE Lobby", display_order: 5 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-beach-pool-1.webp&w=3840&q=60", alt_text: "AVELINE Beach Pool", display_order: 6 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-cinema-1.jpg&w=3840&q=60", alt_text: "AVELINE Cinema", display_order: 7 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-gym-11.webp&w=3840&q=60", alt_text: "AVELINE Gym", display_order: 8 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-game-room-1.webp&w=3840&q=60", alt_text: "AVELINE Game Room", display_order: 9 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-spa-1.webp&w=3840&q=60", alt_text: "AVELINE Spa", display_order: 10 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-right-side-22.webp&w=3840&q=75", alt_text: "AVELINE 11th Floor Overview", display_order: 11 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-yoga-1.webp&w=3840&q=60", alt_text: "AVELINE Yoga Area", display_order: 12 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-padel-court-1.jpg&w=3840&q=60", alt_text: "AVELINE Padel Court", display_order: 13 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-right-side-3.webp&w=3840&q=75", alt_text: "AVELINE 13th Floor Overview", display_order: 14 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-lap-pool-11.webp&w=3840&q=60", alt_text: "AVELINE Lap Pool", display_order: 15 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2FAmenities%2Faveline-lap-pool-2.webp&w=3840&q=60", alt_text: "AVELINE Lap Pool View", display_order: 16 },
      { image_url: "https://citideveloper.com/_next/image?url=%2Fimages%2Faveline%2Faveline-map.png&w=3840&q=75", alt_text: "AVELINE Location Map", display_order: 17 }
    ],
    documents: [],
    review_notes: "AREA DRAFT — JVC (Jumeirah Village Circle): One of Dubai's most sought-after neighborhoods offering modern design, lush green surroundings, and convenient connectivity. A vibrant community for families and professionals seeking elegance, functionality, and a thriving lifestyle."
  },

  // ========== 4. AMRA INTEGRATIVE WELLNESS RESORT ==========
  {
    name: "AMRA Integrative Wellness Resort",
    slug: "amra-integrative-wellness-resort",
    source_url: "https://amraresorts.com",
    developer_name: "Citi Developers",
    emirate: "Umm Al Quwain",
    location: "Blue Carbon Zone, Umm Al Quwain",
    area_name: "Umm Al Quwain",
    description:
      "AMRA is the world's first integrative wellness resort, located in Umm Al Quwain's Blue Carbon Zone. An integrative wellness development existing across sea-facing towers, blending hospitality-grade living with longevity-focused wellness and sustainability. A sanctuary for those seeking balance by the lagoon. Fully furnished serviced apartments designed with color psychology — lighter, softer hues (beige, cream, light wood, warm white) that help your body rest, relax, and recover. Calming views of both the sea and lagoon activate the brain's natural relaxation response, lowering stress, uplifting mood, and restoring focus and clarity. Expansive sea-front balconies designed for true beachfront living. Features SMEG appliances, IoT-enabled building, personal assistant robots, and complete operational support. The resort philosophy is built on 7 Pillars of Integrative Wellness: Mental & Emotional, Physical, Spiritual, Social, Intellectual, Environmental, and Occupational & Financial. The resort experience spans 11 curated zones: First Light (Ground Floor lobby), The Gathering (Food & Beverage), New Moon (Wellness & Longevity), Celestial Cycle (Mind & Movement), Full Moon (Games), Sunrise (Business), Sunset (Entertainment), Crescent Garden (Running Track), Horizon (Beach Clubs), Solar Flare (Active Sports), and Lunar Living (Residences).",
    short_description: "The world's first integrative wellness resort in Umm Al Quwain's Blue Carbon Zone with fully serviced apartments and 7 Pillars of Wellness.",
    price_from: null,
    bedrooms_min: 0,
    bedrooms_max: 4,
    floors: null,
    total_units: null,
    payment_plan: null,
    handover_date: null,
    construction_status: "Under Construction",
    sale_status: "On Sale",
    property_type_label: "Resort Apartments",
    amenities: [
      "Lobby (First Light)", "Restaurants & Cafés (The Gathering)",
      "Wellness & Longevity Zone (New Moon)", "Mind & Movement Zone (Celestial Cycle)",
      "Games Zone (Full Moon)", "Business Zone (Sunrise)",
      "Entertainment Zone (Sunset)", "Running Track (Crescent Garden)",
      "Beach Clubs (Horizon)", "Active Sports (Solar Flare)",
      "Infinity Pools", "Sea View", "Private Balconies",
      "SMEG Appliances", "IoT-Enabled Building", "Personal Assistant Robot",
      "Complete Operational Support", "Yoga Studios", "Galleries",
      "Yacht Clubs & Marinas", "Waterfront Dining & Retail Promenades",
      "Green Parks & Shaded Walkways"
    ],
    amenities_list: [
      { zone: "First Light", floor: "Ground Floor", description: "An opening of elegance, welcome into AMRA's world of wellness." },
      { zone: "The Gathering", floor: "Food & Beverage", description: "A table of flavours and fellowship, where taste and memory linger." },
      { zone: "New Moon", floor: "Wellness & Longevity Zone", description: "Where wellness treatments inspire a fresh beginning — a sanctuary for revitalisation, longevity, and vitality." },
      { zone: "Celestial Cycle", floor: "Mind & Movement Zone", description: "Mind and body wellness combine to create a holistic environment enhanced by breathtaking sea views." },
      { zone: "Full Moon", floor: "Games Zone", description: "A place of energy, joy, and connection built for rest, relaxation, communal activities, and fine dining." },
      { zone: "Sunrise", floor: "Business Zone", description: "A place geared towards clarity, creativity, and professional progress." },
      { zone: "Sunset", floor: "Entertainment Zone", description: "The golden hour of leisure, where guests and residents unwind after a day of wellness and personal exploration." },
      { zone: "Crescent Garden", floor: "Running Track", description: "A suspended landscape in the sky for active recovery, outdoor socialisation, and immersion in nature." },
      { zone: "Horizon", floor: "Beach Clubs", description: "Infinity pools meet the sun's horizon with drinks, views, and comfort mode." },
      { zone: "Solar Flare", floor: "Active Sports", description: "Stay active and energised — powered brightly by the endless energy of the sun." },
      { zone: "Lunar Living", floor: "Residences", description: "Wellbeing, sustainability, and nature combine with luxurious residences delivering calming balance." }
    ],
    highlights: [
      "World's First Integrative Wellness Resort",
      "7 Pillars of Integrative Wellness",
      "11 Curated Resort Experience Zones",
      "Blue Carbon Zone — Mangrove, Seagrass, Coral Reefs",
      "Fully Serviced & Furnished Apartments",
      "Color Psychology-Based Interior Design",
      "100% Sea View",
      "SMEG Appliances, IoT-Enabled, Personal Robot"
    ],
    location_distances: [
      { label: "Blue Carbon Zone", time: "Direct" },
      { label: "Al Khor Mangrove One", time: "Direct Access" },
      { label: "Yacht Clubs and Marinas", time: "Adjacent" }
    ],
    location_headline: "Umm Al Quwain's Coastal Sanctuary",
    location_description: "Located in the heart of Umm Al Quwain's Blue Carbon Zone. Key locations include direct access to Al Khor Mangrove One, biodiversity haven with living ecosystem (Mangrove, Seagrass, Coral Reefs, Oyster Beds), waterfront dining and retail promenades, green parks, shaded walkways, sports zones, socialising places, and yacht clubs and marinas.",
    unit_types: [
      { type: "Studio", label: "Studio Apartments" },
      { type: "1BR", label: "One-Bedroom Apartments" },
      { type: "2BR", label: "Two-Bedroom Apartments" },
      { type: "3BR", label: "Three-Bedroom Apartments" },
      { type: "4BR", label: "Four-Bedroom Apartments" }
    ],
    payment_breakdown: null,
    images: [
      // Hero & general images
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2Fresidences-hero.webp&w=3840&q=75", alt_text: "AMRA Residences Hero", display_order: 0 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Famra-vision.webp&w=3840&q=85", alt_text: "AMRA Vision - Wellness Sanctuary", display_order: 1 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Famra-plan-new.webp&w=3840&q=85", alt_text: "AMRA Master Plan", display_order: 2 },
      // General apartment interiors
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fapartment%2Fbedroom-new.webp&w=3840&q=75", alt_text: "AMRA Apartment Bedroom", display_order: 3 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fapartment%2Fliving-room-3-new.webp&w=3840&q=75", alt_text: "AMRA Apartment Living Room", display_order: 4 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fapartment%2Fliving-room-2-new.webp&w=3840&q=75", alt_text: "AMRA Apartment Living Room 2", display_order: 5 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fapartment%2Fliving-room-new.webp&w=3840&q=75", alt_text: "AMRA Apartment Living Room 3", display_order: 6 },
      // 4BR gallery
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F4bd%2F4bd-gallery%2Famra-4bd-new.webp&w=3840&q=75", alt_text: "AMRA 4BR Apartment", display_order: 7 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F4bd%2F4bd-gallery%2Famra-4bd-1.webp&w=3840&q=75", alt_text: "AMRA 4BR Interior 1", display_order: 8 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F4bd%2F4bd-gallery%2Famra-4bd-5.webp&w=3840&q=75", alt_text: "AMRA 4BR Interior 2", display_order: 9 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F4bd%2F4bd-gallery%2Fbalcony-vertical.webp&w=3840&q=75", alt_text: "AMRA 4BR Balcony", display_order: 10 },
      // 3BR gallery
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F3bd%2F3bd-gallery%2Famra-3bd-8.webp&w=3840&q=75", alt_text: "AMRA 3BR Apartment", display_order: 11 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F3bd%2F3bd-gallery%2Famra-3bd-1.webp&w=3840&q=75", alt_text: "AMRA 3BR Interior", display_order: 12 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F3bd%2F3bd-1.webp&w=3840&q=75", alt_text: "AMRA 3BR Lifestyle", display_order: 13 },
      // 2BR gallery
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F2bd%2F2bd-gallery%2Famra-2bd-7.webp&w=3840&q=75", alt_text: "AMRA 2BR Apartment", display_order: 14 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F2bd%2F2bd-gallery%2Famra-2bd-1.webp&w=3840&q=75", alt_text: "AMRA 2BR Interior", display_order: 15 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F2bd%2F2bd-1.webp&w=3840&q=75", alt_text: "AMRA 2BR Lifestyle", display_order: 16 },
      // 1BR gallery
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F1bd%2F1bd-gallery%2Famra-1bd-5.webp&w=3840&q=75", alt_text: "AMRA 1BR Apartment", display_order: 17 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F1bd%2F1bd-gallery%2Famra-1bd-1.webp&w=3840&q=75", alt_text: "AMRA 1BR Interior", display_order: 18 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2F1bd%2F1bd-1.webp&w=3840&q=75", alt_text: "AMRA 1BR Lifestyle", display_order: 19 },
      // Studio gallery
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2Fstudio%2Fstudio-gallery%2Famra-studio-1.webp&w=3840&q=75", alt_text: "AMRA Studio Apartment", display_order: 20 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2Fstudio%2Fstudio-gallery%2Famra-studio-2.webp&w=3840&q=75", alt_text: "AMRA Studio Interior", display_order: 21 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fresidences%2Fstudio%2Fstudio-1.webp&w=3840&q=75", alt_text: "AMRA Studio Lifestyle", display_order: 22 },
      // Resort experience zones
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Ffirst-lightt.webp&w=3840&q=75", alt_text: "AMRA First Light - Ground Floor", display_order: 23 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fthe-gathering.webp&w=3840&q=75", alt_text: "AMRA The Gathering - Restaurant", display_order: 24 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fnew-moon-new.webp&w=3840&q=75", alt_text: "AMRA New Moon - Wellness Zone", display_order: 25 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fcelestial-cyclee.webp&w=3840&q=75", alt_text: "AMRA Celestial Cycle - Mind & Movement", display_order: 26 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fgaming-roomm.webp&w=3840&q=75", alt_text: "AMRA Full Moon - Games Zone", display_order: 27 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fsunrise.webp&w=3840&q=75", alt_text: "AMRA Sunrise - Business Zone", display_order: 28 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fsunset.webp&w=3840&q=75", alt_text: "AMRA Sunset - Entertainment", display_order: 29 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fcrescent-gardenn.webp&w=3840&q=75", alt_text: "AMRA Crescent Garden", display_order: 30 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fhorizon.webp&w=3840&q=75", alt_text: "AMRA Horizon - Beach Club", display_order: 31 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fsolar-flaree.webp&w=3840&q=75", alt_text: "AMRA Solar Flare - Active Sports", display_order: 32 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Flunar-livingg.webp&w=3840&q=75", alt_text: "AMRA Lunar Living - Residences", display_order: 33 },
      // Wellness pillars images
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fmental-emotional.webp&w=3840&q=75", alt_text: "AMRA Mental & Emotional Wellness", display_order: 34 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fphysical-wellness.webp&w=3840&q=75", alt_text: "AMRA Physical Wellness", display_order: 35 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fsocial-wellness.webp&w=3840&q=75", alt_text: "AMRA Social Wellness", display_order: 36 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fintellectual-wellnesss.webp&w=3840&q=75", alt_text: "AMRA Intellectual Wellness", display_order: 37 },
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Fenvironmental-wellness.webp&w=3840&q=75", alt_text: "AMRA Environmental Wellness", display_order: 38 },
      // Map
      { image_url: "https://amraresorts.com/_next/image?url=%2Fimages%2Fshared%2Famra-map.webp&w=3840&q=75", alt_text: "AMRA Location Map - UAQ", display_order: 39 }
    ],
    documents: [],
    review_notes: "AREA DRAFT — Umm Al Quwain: Located in the heart of Umm Al Quwain's Blue Carbon Zone — a coastal sanctuary with direct access to Al Khor Mangrove One, a biodiversity haven with living ecosystems including mangrove, seagrass, coral reefs, and oyster beds. Features waterfront dining and retail promenades, green parks, shaded walkways, sports zones, and yacht clubs and marinas."
  }
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results = { developer: null as any, projects: [] as any[] };

    // 1. Insert Developer
    const { data: devData, error: devError } = await supabase
      .from("pending_developer_imports")
      .insert({
        name: DEVELOPER.name,
        slug: DEVELOPER.slug,
        description: DEVELOPER.description,
        logo_url: DEVELOPER.logo_url,
        feature_image_url: DEVELOPER.feature_image_url,
        source: "manual",
        provident_link: DEVELOPER.source_url,
        status: "pending",
        admin_notes: "Auto-extracted from citideveloper.com and amraresorts.com. Developer profile: 18+ projects, 3 countries, 350K+ homes, 500K+ customers, 1,000M+ sq ft developed.",
      })
      .select()
      .single();

    if (devError) {
      console.error("Developer insert error:", devError);
      // Continue even if developer already exists
    }
    results.developer = devData || { note: "May already exist", error: devError?.message };

    // 2. Insert Projects
    for (const project of PROJECTS) {
      const { data: projData, error: projError } = await supabase
        .from("pending_project_imports")
        .insert({
          name: project.name,
          slug: project.slug,
          source_url: project.source_url,
          developer_name: project.developer_name,
          emirate: project.emirate,
          location: project.location,
          area_name: project.area_name,
          description: project.description,
          short_description: project.short_description,
          price_from: project.price_from,
          bedrooms_min: project.bedrooms_min,
          bedrooms_max: project.bedrooms_max,
          floors: project.floors,
          total_units: project.total_units,
          payment_plan: project.payment_plan,
          handover_date: project.handover_date,
          handover_display: (project as any).handover_display || null,
          construction_status: project.construction_status,
          sale_status: project.sale_status,
          property_type_label: project.property_type_label,
          amenities: project.amenities,
          amenities_list: project.amenities_list,
          highlights: project.highlights,
          location_distances: project.location_distances,
          location_headline: project.location_headline,
          location_description: project.location_description,
          unit_types: project.unit_types,
          payment_breakdown: project.payment_breakdown,
          images: project.images,
          documents: project.documents,
          is_new_project: true,
          status: "pending",
          enrichment_source: "manual",
          review_notes: project.review_notes,
        })
        .select()
        .single();

      if (projError) {
        console.error(`Project insert error (${project.name}):`, projError);
        results.projects.push({ name: project.name, error: projError.message });
      } else {
        results.projects.push({ name: project.name, id: projData.id, status: "pending" });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Inserted 1 developer and ${PROJECTS.length} projects into pending approval queues.`,
        results,
        instructions: "Go to Listing Admin → Approvals to review and approve each item individually."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
