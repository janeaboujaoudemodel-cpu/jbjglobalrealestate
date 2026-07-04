/**
 * Data for premium community landing pages.
 * Each entry powers an SEO-optimized landing page at /communities/<slug>-guide
 * targeting high-intent keywords (buy/rent + community name).
 */

export interface CommunityHighlight {
  label: string;
  value: string;
}

export interface CommunityFAQ {
  question: string;
  answer: string;
}

export interface CommunityLanding {
  slug: string;
  name: string;
  emirate: "Dubai" | "Abu Dhabi" | "Sharjah";
  wikidata?: string;
  heroImage: string;
  tagline: string;
  intro: string;
  // 4 SEO H2 sections
  livingHere: string;
  investment: string;
  transport: string;
  amenities: string;
  highlights: CommunityHighlight[];
  priceFrom: string;        // AED
  rentFrom: string;         // AED / year
  grossYield: string;       // %
  faqs: CommunityFAQ[];
  keywords: string;
}

export const COMMUNITY_LANDINGS: CommunityLanding[] = [
  {
    slug: "palm-jumeirah",
    name: "Palm Jumeirah",
    emirate: "Dubai",
    wikidata: "Q334515",
    heroImage: "https://images.unsplash.com/photo-1548783294-2b6db77d532e?w=1920&q=80",
    tagline: "The world's most iconic waterfront address",
    intro: "Palm Jumeirah is Dubai's man-made island — a 5-km trunk with 16 fronds lined by beachfront villas, luxury apartment towers, and Atlantis-anchored hospitality. It's the postcode where global HNW buyers land first, and it holds Dubai's strongest brand equity for prestige waterfront living.",
    livingHere: "Life on Palm Jumeirah is defined by private beaches, marina views, and a genuine resort-community feel. Frond villas offer 100 m of private shoreline; Shoreline and Tiara apartments face open sea; and Palm Tower + One&Only residences at the tip deliver ultra-prime hotel-branded living. Nakheel Mall, Aura Skypool, and 30+ beach clubs cover daily and lifestyle needs.",
    investment: "Palm Jumeirah trades at Dubai's highest AED/sq ft premium (AED 3,000–8,000+ for prime beachfront) but rewards owners with the strongest long-term capital appreciation in the emirate. Gross yields sit at 4.5–5.5% — lower than JVC or Business Bay, but demand is inelastic. Off-plan branded residences (Six Senses, Como) routinely deliver 30–60% appreciation between launch and handover.",
    transport: "Connected by the Palm Monorail to the mainland at Gateway station, plus a 4-km road link to Sheikh Zayed Road. DXB Airport is 30 minutes; DWC Airport 40 minutes. The upcoming Palm Jumeirah Metro Link (Blue Line, 2029) will add three stations.",
    amenities: "Nakheel Mall (350+ stores), Golden Mile Galleria, Atlantis The Palm, Atlantis The Royal, W Dubai, Waldorf Astoria, The View at The Palm, Aquaventure Waterpark, Kite Beach access, 5 international schools within 15 minutes.",
    highlights: [
      { label: "Freehold", value: "Yes" },
      { label: "Prime price", value: "AED 3,000–8,000/sqft" },
      { label: "Gross yield", value: "4.5–5.5%" },
      { label: "Handover era", value: "2006 – ongoing branded" },
    ],
    priceFrom: "1,800,000",
    rentFrom: "150,000",
    grossYield: "5.0",
    keywords: "Palm Jumeirah apartments for sale, Palm Jumeirah villas, buy property Palm Jumeirah, Palm Jumeirah rent, Palm Jumeirah investment, branded residences Palm Jumeirah, Signature Villas, Six Senses Palm Jumeirah",
    faqs: [
      { question: "How much does an apartment on Palm Jumeirah cost?", answer: "Studios start around AED 1.8M in Shoreline; 1-beds AED 2.5–4M; 2-beds AED 4–8M; 3-bed sea-view AED 7–15M. Branded residences (Six Senses, One&Only) start at AED 12M." },
      { question: "Is Palm Jumeirah freehold for foreigners?", answer: "Yes. Palm Jumeirah is a designated freehold zone. Foreign nationals can own apartments and villas outright, with title deeds issued by the Dubai Land Department." },
      { question: "What rental yield does Palm Jumeirah offer?", answer: "Gross yields range 4.5–5.5% on apartments and 4.0–4.8% on frond villas — below JVC or Business Bay but with far stronger capital appreciation." },
      { question: "Which developers are active on Palm Jumeirah?", answer: "Nakheel is the master developer. Recent and upcoming towers come from Omniyat, Ellington, Alpago, Serenia, and hotel-branded partnerships with Six Senses, Como, and One&Only." },
    ],
  },
  {
    slug: "downtown-dubai",
    name: "Downtown Dubai",
    emirate: "Dubai",
    wikidata: "Q1245187",
    heroImage: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?w=1920&q=80",
    tagline: "Live at the center of the city that never stops",
    intro: "Downtown Dubai is Emaar's flagship master community — home to Burj Khalifa, Dubai Mall, Dubai Opera, and the Dubai Fountain. It is the emirate's cultural and financial center of gravity, and the most globally-recognized postcode after Palm Jumeirah.",
    livingHere: "The community wraps around Burj Lake and Old Town's Arabian-inspired plazas. Living here means walking to Dubai Mall, the Opera, and Boulevard restaurants. Address, Vida, and Armani hotel-branded residences dominate the tower stock, alongside Burj Vista, Act One | Act Two, IL Primo, and Grande.",
    investment: "Downtown blends prestige with liquidity — units resell fast and short-term rental demand (Ejari + DTCM licensed) is among Dubai's strongest. Prices sit at AED 2,200–4,500/sqft. Gross yields of 5.5–6.5% for standard apartments; branded residences trade at 15–25% premiums with slightly lower yield but stronger appreciation.",
    transport: "Two Metro Red Line stations (Burj Khalifa/Dubai Mall, Financial Centre) plus direct Sheikh Zayed Road access. DXB Airport 15 minutes; DIFC 5 minutes; Business Bay 5 minutes. Walkable to Dubai Mall and Opera District.",
    amenities: "Dubai Mall (1,300+ stores), Burj Khalifa, Dubai Opera, Dubai Fountain, Dubai Aquarium, Souk Al Bahar, KidZania, 20+ 5-star hotels, Address Boulevard Beach Club shuttle, GEMS Wellington Primary, Blossom Nursery.",
    highlights: [
      { label: "Freehold", value: "Yes" },
      { label: "Prime price", value: "AED 2,200–4,500/sqft" },
      { label: "Gross yield", value: "5.5–6.5%" },
      { label: "Master developer", value: "Emaar Properties" },
    ],
    priceFrom: "1,650,000",
    rentFrom: "95,000",
    grossYield: "5.7",
    keywords: "Downtown Dubai apartments, buy Downtown Dubai, Downtown Dubai rent, Burj Khalifa apartments, Address Residences, Downtown Dubai investment, Emaar apartments Downtown",
    faqs: [
      { question: "How much does a 1-bedroom in Downtown Dubai cost?", answer: "A ready 1-bedroom in standard towers starts at AED 1.65M; premium and branded (Address, Armani) start at AED 2.5–4M." },
      { question: "What's the rental yield in Downtown Dubai?", answer: "Long-term rental yields sit at 5.5–6.5%. Short-term (DTCM-licensed) can push effective yields to 7–9% depending on occupancy and pricing strategy." },
      { question: "Is Downtown Dubai well-served by Metro?", answer: "Yes — two Red Line stations (Burj Khalifa/Dubai Mall, Financial Centre) and direct pedestrian bridges into Dubai Mall." },
      { question: "Which are the best Downtown Dubai buildings?", answer: "For prestige: Burj Khalifa, Address Sky View, Armani Residences, IL Primo, Grande. For value: Boulevard Central, Standpoint, Burj Views, 29 Boulevard, Boulevard Point." },
    ],
  },
  {
    slug: "dubai-marina",
    name: "Dubai Marina",
    emirate: "Dubai",
    wikidata: "Q1093254",
    heroImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80",
    tagline: "Dubai's largest waterfront residential district",
    intro: "Dubai Marina is a 3-km artificial canal city with 200+ residential towers, a public beach, and the world's tallest block of buildings. It combines walkable urban living, marina views, and consistent 6–7% rental yields — making it Dubai's most-searched apartment community year after year.",
    livingHere: "Life revolves around the 7-km Marina Walk promenade, JBR Beach, and The Beach at JBR. Towers range from 1990s originals (Marina Terrace, Al Sahab) to premium recent stock (Marina Gate, LIV, 5242, Cavalli Tower). Yacht slots, beachfront jogging tracks, and 60+ restaurants define daily life.",
    investment: "Dubai Marina is the deepest liquidity pool in Dubai's apartment market. Prices AED 1,500–2,800/sqft, gross yields 6.0–7.0% (higher for smaller units and older stock). Short-term rental (Airbnb/DTCM) demand is exceptional thanks to JBR beach proximity — top hosts see 75–85% occupancy year-round.",
    transport: "Two Metro Red Line stations (DMCC, Sobha Realty), Marina Tram loop, direct Sheikh Zayed Road access. DXB Airport 30 minutes; DWC 25 minutes; Bluewaters Island 5 minutes.",
    amenities: "Marina Walk, JBR Beach, The Beach at JBR, The Walk JBR, Marina Mall, 5-star waterfront hotels (Address, Grosvenor House, Le Royal Meridien), Skydive Dubai, DIFC 15 min, GEMS Wellington International School.",
    highlights: [
      { label: "Freehold", value: "Yes" },
      { label: "Prime price", value: "AED 1,500–2,800/sqft" },
      { label: "Gross yield", value: "6.0–7.0%" },
      { label: "Tower count", value: "200+" },
    ],
    priceFrom: "1,100,000",
    rentFrom: "72,000",
    grossYield: "6.6",
    keywords: "Dubai Marina apartments for sale, Dubai Marina rent, buy Dubai Marina, Marina Gate, Cavalli Tower, LIV Marina, Dubai Marina investment yield, JBR apartments",
    faqs: [
      { question: "Is Dubai Marina a good investment in 2026?", answer: "Yes — gross yields of 6.0–7.0%, exceptional liquidity, and consistent short-term rental demand from JBR beach proximity make it Dubai's most reliable apartment investment community." },
      { question: "What's the price per sqft in Dubai Marina?", answer: "Older 1990s stock trades at AED 1,500–1,900/sqft; premium 2015+ towers (Marina Gate, 5242, Cavalli) command AED 2,200–2,800/sqft." },
      { question: "Can I do short-term rentals in Dubai Marina?", answer: "Yes, with a DTCM Holiday Home permit. Most Marina buildings allow it. Owners work with licensed operators (Frank Porter, HiGuests, Airhosts) for 6–8% net yield." },
      { question: "What are the best Marina towers?", answer: "For yield: Marina Diamond, Torch, Ocean Heights. For prestige: Marina Gate, 5242, LIV Residence, Cavalli Tower, Stella Maris. For families: Marina Promenade, Trident Grand." },
    ],
  },
  {
    slug: "business-bay",
    name: "Business Bay",
    emirate: "Dubai",
    wikidata: "Q2937847",
    heroImage: "https://images.unsplash.com/photo-1582672060674-bc2bd808a8f5?w=1920&q=80",
    tagline: "Dubai's central business & residential canal district",
    intro: "Business Bay is the commercial extension of Downtown Dubai — a canal-side district of 200+ high-rises housing Fortune 500 offices, Burj Khalifa-view residences, and Dubai's densest concentration of hotel-branded apartments (Paramount, DAMAC Maison, SLS, Bugatti).",
    livingHere: "Positioned between Downtown, Al Wasl, and DIFC, Business Bay is where finance professionals live steps from Burj Khalifa. The Dubai Canal promenade adds waterfront jogging and Marasi Marina yacht slips. Buildings range from mid-tier (Executive Towers) to ultra-branded (Bugatti Residences by Binghatti, SLS Dubai).",
    investment: "Business Bay offers the best price-to-quality ratio near Downtown — AED 1,800–3,200/sqft with 6.5–7.0% gross yields, well above Downtown's 5.5–6.5%. Short-term rental demand is strong (business travelers, Downtown tourists spilling over). Off-plan branded projects (Bugatti, SLS, Peninsula) routinely deliver 40%+ appreciation to handover.",
    transport: "Two Metro Red Line stations (Business Bay, Burj Khalifa/Dubai Mall), Dubai Canal water taxi, direct Sheikh Zayed Road and Al Khail Road access. DXB Airport 15 min; DIFC 5 min; Downtown 5 min.",
    amenities: "Dubai Canal Walk, Bay Avenue Mall, Marasi Business Bay, JW Marriott Marquis, Renaissance Downtown Hotel, Paramount Hotel, 200+ office towers (Ubora, The Prism, Binary), GEMS Wellington School 10 min.",
    highlights: [
      { label: "Freehold", value: "Yes" },
      { label: "Prime price", value: "AED 1,800–3,200/sqft" },
      { label: "Gross yield", value: "6.5–7.0%" },
      { label: "Character", value: "Mixed-use canal district" },
    ],
    priceFrom: "950,000",
    rentFrom: "65,000",
    grossYield: "6.7",
    keywords: "Business Bay apartments, Business Bay for sale, Business Bay rent, DAMAC Maison, Bugatti Residences Dubai, SLS Business Bay, Executive Towers, Business Bay investment",
    faqs: [
      { question: "Is Business Bay better than Downtown Dubai for investment?", answer: "Business Bay offers higher yield (6.5–7.0% vs Downtown's 5.5–6.5%) and lower entry prices, while Downtown offers stronger prestige and short-term rental premium. Investors seeking cash-flow prefer Business Bay; those seeking capital-preservation and prestige prefer Downtown." },
      { question: "How much is a studio in Business Bay?", answer: "Studios start around AED 700K in Executive Towers and Iris Bay; premium branded studios (Paramount, Bugatti launch prices) range AED 1.2–2.5M." },
      { question: "Is Business Bay served by Metro?", answer: "Yes — two Red Line stations (Business Bay, Burj Khalifa/Dubai Mall) plus water taxi via the Dubai Canal." },
      { question: "Which Business Bay projects are worth watching?", answer: "Bugatti Residences by Binghatti, SLS Dubai Hotel & Residences, Peninsula by Select Group, DAMAC Volta, and Sobha Verde are the strongest recent launches." },
    ],
  },
];

export const getCommunityLanding = (slug: string) =>
  COMMUNITY_LANDINGS.find((c) => c.slug === slug);
