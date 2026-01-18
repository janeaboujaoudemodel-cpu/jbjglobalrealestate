// Area Guides Data - Phase 1: Downtown Dubai, Dubai Marina, Business Bay

export interface AreaGuide {
  slug: string;
  name: string;
  heroImage: string;
  shortDescription: string;
  overview: string;
  lifestyle: string;
  location: {
    landmarks: string[];
    connectivity: string[];
  };
  amenities: {
    dining: string;
    retail: string;
    leisure: string;
    wellness: string;
  };
  propertyTypes: string[];
  residents: string[];
  seo: {
    title: string;
    description: string;
    keywords: string;
  };
}

export const AREA_GUIDES: AreaGuide[] = [
  {
    slug: "downtown-dubai",
    name: "Downtown Dubai",
    heroImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80",
    shortDescription: "The iconic heart of Dubai, home to the world's tallest tower and vibrant urban living.",
    overview: `Downtown Dubai stands as the city's most prestigious address, a masterfully planned urban district that seamlessly blends world-class architecture with cosmopolitan living. Centered around the iconic Burj Khalifa, this neighborhood offers an unparalleled lifestyle where luxury residences overlook the famous Dubai Fountain and the sprawling Dubai Mall.

The district attracts discerning residents who appreciate being at the center of Dubai's cultural and social scene while enjoying the convenience of having world-class dining, entertainment, and retail at their doorstep.`,
    lifestyle: "Urban sophistication meets cultural vibrancy in Downtown Dubai. Residents enjoy morning jogs along the Boulevard, leisurely afternoons exploring art galleries, and evenings watching the spectacular fountain shows. The area caters to professionals, families, and those who appreciate the energy of city living without compromising on elegance.",
    location: {
      landmarks: [
        "Burj Khalifa — World's tallest building",
        "The Dubai Mall — Premier shopping destination",
        "Dubai Opera — Cultural landmark",
        "Souk Al Bahar — Traditional-style marketplace",
        "Dubai Fountain — Iconic water show"
      ],
      connectivity: [
        "Direct access to Sheikh Zayed Road",
        "Burj Khalifa / Dubai Mall Metro Station",
        "15 minutes to Dubai International Airport",
        "20 minutes to Palm Jumeirah",
        "10 minutes to DIFC"
      ]
    },
    amenities: {
      dining: "From Michelin-starred restaurants to trendy cafés, Downtown offers over 200 dining venues including At.mosphere (world's highest restaurant), Zuma, and LPM.",
      retail: "The Dubai Mall houses over 1,200 retail outlets, alongside the boutique shops of Souk Al Bahar and the Boulevard's designer stores.",
      leisure: "Dubai Opera hosts world-class performances, while the area features an aquarium, ice rink, VR parks, and the stunning Burj Park.",
      wellness: "Premium fitness centers, spa retreats, and jogging tracks along the Boulevard cater to health-conscious residents."
    },
    propertyTypes: [
      "Luxury high-rise apartments",
      "Premium penthouses with Burj Khalifa views",
      "Serviced residences in five-star hotels",
      "Branded residences (Address, Armani)"
    ],
    residents: [
      "Business executives and entrepreneurs",
      "International professionals",
      "Families seeking premium urban living",
      "Those who prioritize convenience and prestige"
    ],
    seo: {
      title: "Downtown Dubai Area Guide",
      description: "Explore Downtown Dubai — home to Burj Khalifa, Dubai Mall, and the city's most prestigious addresses. Discover lifestyle, amenities, and property options with JBJ Global Real Estate.",
      keywords: "Downtown Dubai, Burj Khalifa area, Dubai Mall neighborhood, luxury apartments Downtown Dubai, property Downtown Dubai"
    }
  },
  {
    slug: "dubai-marina",
    name: "Dubai Marina",
    heroImage: "https://images.unsplash.com/photo-1518684079-3c830dcef090?w=1920&q=80",
    shortDescription: "A stunning waterfront community with vibrant marina life and coastal sophistication.",
    overview: `Dubai Marina is one of the world's largest man-made marinas, a breathtaking waterfront community that stretches along a 3-kilometer canal. This vibrant neighborhood combines the allure of coastal living with the excitement of urban convenience, featuring gleaming towers that frame a picturesque waterway filled with luxury yachts.

The Marina Walk promenade comes alive day and night with cafés, restaurants, and boutiques, creating an atmosphere reminiscent of the world's finest waterfront destinations. Residents enjoy stunning views, sea breezes, and a lifestyle that celebrates the best of Dubai's coastal charm.`,
    lifestyle: "Life in Dubai Marina revolves around the water. Morning yoga on the beach, afternoon coffee at Marina Walk, sunset strolls along JBR, and evening dining with marina views define the rhythm here. The community attracts those who seek an active, social lifestyle with the sea as their backdrop.",
    location: {
      landmarks: [
        "Marina Walk — Waterfront promenade",
        "JBR Beach — Popular public beach",
        "Ain Dubai — World's largest observation wheel",
        "Marina Mall — Community shopping center",
        "Bluewaters Island — Entertainment destination"
      ],
      connectivity: [
        "Dubai Marina Metro Station",
        "DMCC Metro Station",
        "25 minutes to Dubai International Airport",
        "10 minutes to Palm Jumeirah",
        "Direct access to Sheikh Zayed Road"
      ]
    },
    amenities: {
      dining: "Over 300 restaurants and cafés line Marina Walk and JBR, from casual beachside venues to fine dining at Pier 7's seven-floor culinary tower.",
      retail: "Marina Mall, JBR's The Walk, and boutique shops offer diverse shopping from everyday essentials to designer fashion.",
      leisure: "Beach clubs, yacht charters, water sports, and Ain Dubai provide endless entertainment. The area hosts regular markets and outdoor events.",
      wellness: "Beach fitness classes, premium gyms, spa retreats, and the Marina's jogging tracks support an active lifestyle."
    },
    propertyTypes: [
      "High-rise apartments with marina views",
      "Beachfront residences at JBR",
      "Luxury penthouses with private pools",
      "Serviced apartments and hotel residences"
    ],
    residents: [
      "Young professionals and expats",
      "Couples seeking waterfront living",
      "Fitness and beach enthusiasts",
      "Those who value social, vibrant communities"
    ],
    seo: {
      title: "Dubai Marina Area Guide",
      description: "Discover Dubai Marina — a stunning waterfront community with marina living, JBR beach access, and vibrant nightlife. Explore properties with JBJ Global Real Estate.",
      keywords: "Dubai Marina, waterfront apartments Dubai, JBR properties, marina living Dubai, Dubai Marina real estate"
    }
  },
  {
    slug: "business-bay",
    name: "Business Bay",
    heroImage: "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1920&q=80",
    shortDescription: "Dubai's dynamic business and residential hub along the Dubai Water Canal.",
    overview: `Business Bay represents the new face of Dubai's commercial and residential landscape. This expansive district stretches along the Dubai Water Canal, combining corporate towers with residential developments in a dynamic urban environment. Once purely a business district, it has evolved into a thriving mixed-use community that offers excellent value and modern living.

The area benefits from its strategic location between Downtown Dubai and DIFC, making it ideal for professionals who want to be close to the action while enjoying more competitive property options. The Dubai Water Canal adds a waterfront dimension with promenades, dining, and leisure facilities.`,
    lifestyle: "Business Bay suits ambitious professionals who appreciate efficiency and modern living. The neighborhood offers a straightforward, no-frills urban experience with easy access to Dubai's major business hubs. Canal-side cafés, contemporary gyms, and a growing food scene add lifestyle appeal to this practical location.",
    location: {
      landmarks: [
        "Dubai Water Canal — Waterfront promenade",
        "Bay Avenue — Retail and dining hub",
        "Marasi Business Bay — Waterfront development",
        "Walking distance to Downtown Dubai",
        "Adjacent to DIFC"
      ],
      connectivity: [
        "Business Bay Metro Station",
        "Direct canal connection to Dubai Creek",
        "5 minutes to Downtown Dubai",
        "10 minutes to DIFC",
        "20 minutes to Dubai International Airport"
      ]
    },
    amenities: {
      dining: "Bay Avenue and the Canal boardwalk host a growing selection of restaurants and cafés, from casual eateries to upscale waterfront dining.",
      retail: "Bay Avenue mall provides everyday shopping, while the nearby Dubai Mall offers comprehensive retail options.",
      leisure: "The Dubai Water Canal offers kayaking, boardwalk strolls, and waterfront parks. The area is close to Downtown's entertainment options.",
      wellness: "Modern residential towers include gym facilities, while dedicated fitness centers and the canal promenade support active living."
    },
    propertyTypes: [
      "Modern high-rise apartments",
      "Canal-view residences",
      "Serviced apartments for professionals",
      "Office-residence combinations"
    ],
    residents: [
      "Business professionals and executives",
      "Young professionals starting their careers",
      "Those seeking proximity to Downtown at better value",
      "Entrepreneurs and startup founders"
    ],
    seo: {
      title: "Business Bay Area Guide",
      description: "Explore Business Bay — Dubai's dynamic canal-side district offering modern living near Downtown and DIFC. Find properties with JBJ Global Real Estate.",
      keywords: "Business Bay Dubai, Dubai Water Canal, apartments Business Bay, property Business Bay, Dubai business district"
    }
  },
  {
    slug: "palm-jumeirah",
    name: "Palm Jumeirah",
    heroImage: "https://images.unsplash.com/photo-1512632578888-169bbbc64f33?w=1920&q=80",
    shortDescription: "The world's most iconic man-made island offering ultra-luxury beachfront living.",
    overview: `Palm Jumeirah is Dubai's most recognizable landmark, a stunning man-made island shaped like a palm tree that has redefined waterfront living. This exclusive community offers ultra-luxury villas, premium apartments, and world-class hotels along pristine private beaches.

Residents enjoy unparalleled privacy, stunning sea views, and access to some of the world's finest resorts and dining establishments. The Palm represents the pinnacle of Dubai's ambition and remains one of the most sought-after addresses in the world.`,
    lifestyle: "Life on the Palm is defined by exclusivity and resort-style living. Private beaches, yacht clubs, and five-star amenities create an environment of refined leisure. The community attracts high-net-worth individuals seeking privacy, luxury, and the prestige of an iconic address.",
    location: {
      landmarks: [
        "Atlantis, The Palm — Iconic resort",
        "The Pointe — Dining and entertainment",
        "Nakheel Mall — Premium shopping",
        "Palm West Beach — Beach promenade",
        "The View at The Palm — Observation deck"
      ],
      connectivity: [
        "Palm Monorail connection",
        "15 minutes to Dubai Marina",
        "25 minutes to Downtown Dubai",
        "30 minutes to Dubai International Airport",
        "Direct access to Sheikh Zayed Road"
      ]
    },
    amenities: {
      dining: "World-class restaurants at Atlantis, The Pointe, and exclusive beach clubs offer diverse culinary experiences from celebrity chefs.",
      retail: "Nakheel Mall provides luxury shopping, while The Pointe offers boutique retail and entertainment options.",
      leisure: "Private beaches, water parks, yacht clubs, and luxury spa retreats define the leisure experience on the Palm.",
      wellness: "Five-star hotel spas, private fitness facilities, and beachfront wellness programs cater to health-conscious residents."
    },
    propertyTypes: [
      "Ultra-luxury beachfront villas",
      "Premium waterfront apartments",
      "Penthouse residences with panoramic views",
      "Hotel-branded residences"
    ],
    residents: [
      "High-net-worth individuals and families",
      "International investors",
      "Celebrities and public figures",
      "Those seeking the ultimate in luxury living"
    ],
    seo: {
      title: "Palm Jumeirah Area Guide",
      description: "Discover Palm Jumeirah — Dubai's iconic island offering ultra-luxury beachfront living, world-class resorts, and exclusive amenities. Explore properties with JBJ Global Real Estate.",
      keywords: "Palm Jumeirah, Dubai Palm Island, luxury villas Palm Jumeirah, beachfront property Dubai, Palm Jumeirah real estate"
    }
  },
  {
    slug: "jumeirah-village-circle",
    name: "Jumeirah Village Circle (JVC)",
    heroImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80",
    shortDescription: "A family-friendly community offering affordable luxury with excellent connectivity.",
    overview: `Jumeirah Village Circle has emerged as one of Dubai's most popular residential communities, offering an exceptional balance of affordability, quality, and lifestyle. This master-planned development features a mix of apartments, townhouses, and villas arranged around landscaped parks and community facilities.

The community attracts families, young professionals, and investors seeking quality living at competitive prices. Its central location provides easy access to major business districts while maintaining a peaceful, suburban atmosphere.`,
    lifestyle: "JVC offers a relaxed, family-oriented lifestyle with tree-lined streets, parks, and community centers. Residents enjoy a strong sense of community, with regular events, accessible retail, and dining options catering to diverse tastes and budgets.",
    location: {
      landmarks: [
        "Circle Mall — Community shopping center",
        "JVC Community Park — Green spaces",
        "Multiple landscaped gardens",
        "Community sports facilities",
        "Walking and cycling paths"
      ],
      connectivity: [
        "Central location with highway access",
        "15 minutes to Dubai Marina",
        "20 minutes to Downtown Dubai",
        "25 minutes to Dubai International Airport",
        "Easy access to Al Khail Road"
      ]
    },
    amenities: {
      dining: "A growing selection of restaurants, cafés, and fast-food outlets cater to diverse tastes within the community.",
      retail: "Circle Mall and numerous community retail outlets provide convenient shopping for daily needs.",
      leisure: "Parks, playgrounds, community pools, and sports courts offer recreation for all ages.",
      wellness: "Multiple gyms, fitness studios, and jogging tracks support an active lifestyle within the community."
    },
    propertyTypes: [
      "Affordable apartments",
      "Spacious townhouses",
      "Family villas",
      "Studio and one-bedroom units for investors"
    ],
    residents: [
      "Young families seeking space and value",
      "First-time buyers and renters",
      "Investors seeking rental yields",
      "Professionals working in central Dubai"
    ],
    seo: {
      title: "JVC Area Guide",
      description: "Explore Jumeirah Village Circle — a family-friendly community offering affordable luxury, excellent connectivity, and strong rental yields. Find properties with JBJ Global Real Estate.",
      keywords: "JVC Dubai, Jumeirah Village Circle, affordable apartments Dubai, family community Dubai, JVC real estate"
    }
  },
  {
    slug: "dubai-hills-estate",
    name: "Dubai Hills Estate",
    heroImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80",
    shortDescription: "A premium master-planned community with an 18-hole golf course and upscale amenities.",
    overview: `Dubai Hills Estate is a prestigious master-planned community developed by Emaar and Meraas, featuring an 18-hole championship golf course at its heart. This expansive development offers a range of premium properties from apartments to mansions, all set within beautifully landscaped surroundings.

The community has become one of Dubai's most sought-after addresses, attracting families and professionals who appreciate quality construction, green spaces, and a complete lifestyle offering including Dubai Hills Mall, international schools, and healthcare facilities.`,
    lifestyle: "Life in Dubai Hills Estate revolves around outdoor living, with cycling paths, jogging tracks, and the golf course providing endless recreation opportunities. The community offers a refined suburban lifestyle with the convenience of world-class retail and dining at Dubai Hills Mall.",
    location: {
      landmarks: [
        "Dubai Hills Golf Club — Championship course",
        "Dubai Hills Mall — Premium shopping",
        "Dubai Hills Park — 180-hectare green space",
        "International schools",
        "Healthcare facilities"
      ],
      connectivity: [
        "Direct access to Al Khail Road",
        "15 minutes to Downtown Dubai",
        "20 minutes to Dubai Marina",
        "25 minutes to Dubai International Airport",
        "Easy access to Umm Suqeim Road"
      ]
    },
    amenities: {
      dining: "Dubai Hills Mall hosts numerous restaurants and cafés, with additional dining options throughout the community.",
      retail: "Dubai Hills Mall offers comprehensive shopping from luxury brands to everyday essentials.",
      leisure: "The 18-hole golf course, parks, and recreational facilities provide diverse leisure options for all ages.",
      wellness: "Premium fitness centers, wellness spas, and extensive outdoor facilities support healthy living."
    },
    propertyTypes: [
      "Modern apartments",
      "Golf course villas",
      "Premium townhouses",
      "Luxury mansions"
    ],
    residents: [
      "Affluent families",
      "Golf enthusiasts",
      "Professionals seeking premium living",
      "Those who value green spaces and community"
    ],
    seo: {
      title: "Dubai Hills Estate Area Guide",
      description: "Discover Dubai Hills Estate — a premium community with an 18-hole golf course, Dubai Hills Mall, and upscale family living. Explore properties with JBJ Global Real Estate.",
      keywords: "Dubai Hills Estate, golf course villas Dubai, Emaar Dubai Hills, premium community Dubai, Dubai Hills real estate"
    }
  },
  {
    slug: "arabian-ranches",
    name: "Arabian Ranches",
    heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80",
    shortDescription: "A prestigious gated community offering villa living with desert landscapes and golf courses.",
    overview: `Arabian Ranches is one of Dubai's most established villa communities, offering a serene desert lifestyle within a secure, family-friendly environment. Developed by Emaar, this master-planned community features spacious villas, championship golf courses, and extensive green spaces.

The community attracts families seeking space, privacy, and a close-knit neighborhood feel while remaining connected to Dubai's urban centers.`,
    lifestyle: "Life in Arabian Ranches revolves around outdoor activities, family, and community. Residents enjoy horse riding, golf, tennis, and weekend brunches at the community clubhouse. The relaxed pace and strong community bonds make it ideal for families.",
    location: {
      landmarks: [
        "Arabian Ranches Golf Club",
        "Dubai Polo & Equestrian Club",
        "JESS Arabian Ranches",
        "Ranches Souk — Community retail",
        "Multiple parks and playgrounds"
      ],
      connectivity: [
        "Direct access to Emirates Road",
        "20 minutes to Downtown Dubai",
        "25 minutes to Dubai Marina",
        "30 minutes to Dubai International Airport",
        "Near Global Village"
      ]
    },
    amenities: {
      dining: "The Ranches Souk offers various restaurants and cafés catering to families with diverse culinary options.",
      retail: "Community retail centers provide daily essentials, while larger malls are a short drive away.",
      leisure: "Golf courses, polo club, tennis courts, swimming pools, and community parks offer recreation.",
      wellness: "Community gyms, yoga studios, and extensive walking paths support an active lifestyle."
    },
    propertyTypes: [
      "Spacious family villas",
      "Golf course homes",
      "Townhouses",
      "Premium estates"
    ],
    residents: [
      "Established families",
      "Golf and equestrian enthusiasts",
      "Those seeking space and privacy",
      "Executives preferring suburban living"
    ],
    seo: {
      title: "Arabian Ranches Area Guide",
      description: "Explore Arabian Ranches — Dubai's premier villa community with golf courses, polo club, and family-friendly living. Find properties with JBJ Global Real Estate.",
      keywords: "Arabian Ranches Dubai, villa community Dubai, Emaar Arabian Ranches, golf course villas, family villas Dubai"
    }
  },
  {
    slug: "emirates-hills",
    name: "Emirates Hills",
    heroImage: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80",
    shortDescription: "Dubai's most exclusive gated community offering ultra-luxury mansions and privacy.",
    overview: `Emirates Hills is Dubai's answer to Beverly Hills — an ultra-exclusive gated community that houses the city's most prestigious addresses. This Emaar development features sprawling mansions, many overlooking the Montgomerie Golf Course, with unparalleled privacy and security.

The community is home to royalty, business titans, and celebrities who value discretion and the finest quality of life.`,
    lifestyle: "Emirates Hills offers the ultimate in private, luxurious living. Residents enjoy their own pools, gardens, and entertainment spaces while having access to world-class golf and the prestigious Emirates Hills Clubhouse.",
    location: {
      landmarks: [
        "Montgomerie Golf Club",
        "Emirates Hills Clubhouse",
        "Emirates Golf Club",
        "Views of Dubai Marina skyline",
        "Lakes and landscaped gardens"
      ],
      connectivity: [
        "Adjacent to Sheikh Zayed Road",
        "10 minutes to Dubai Marina",
        "15 minutes to Downtown Dubai",
        "25 minutes to Dubai International Airport",
        "Close to Media City"
      ]
    },
    amenities: {
      dining: "Private dining at home with chef services; exclusive restaurants at nearby hotels and Marina.",
      retail: "Convenient access to Mall of the Emirates and Dubai Marina Mall.",
      leisure: "Two championship golf courses, private pools, home cinemas, and exclusive clubhouse facilities.",
      wellness: "Private gyms, spa services, and the tranquility of gated living."
    },
    propertyTypes: [
      "Ultra-luxury mansions",
      "Golf course estates",
      "Custom-built villas",
      "Trophy properties"
    ],
    residents: [
      "Ultra-high-net-worth individuals",
      "Business leaders and entrepreneurs",
      "Celebrities and public figures",
      "Those seeking ultimate privacy"
    ],
    seo: {
      title: "Emirates Hills Area Guide",
      description: "Discover Emirates Hills — Dubai's most exclusive gated community with ultra-luxury mansions and golf course living. Explore properties with JBJ Global Real Estate.",
      keywords: "Emirates Hills Dubai, luxury mansions Dubai, gated community Dubai, golf course mansions, ultra-luxury Dubai"
    }
  },
  {
    slug: "dubai-creek-harbour",
    name: "Dubai Creek Harbour",
    heroImage: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1920&q=80",
    shortDescription: "A futuristic waterfront development with iconic towers and sustainable design.",
    overview: `Dubai Creek Harbour is Emaar's visionary waterfront development set to become a new landmark destination. Home to the future Dubai Creek Tower (designed to surpass Burj Khalifa), this master-planned community offers contemporary living with stunning views of the historic Dubai Creek.

The development combines residential, retail, and leisure in a sustainably designed environment that honors Dubai's maritime heritage while embracing its future.`,
    lifestyle: "Residents enjoy a blend of waterfront living and urban convenience. The Creek promenade, parks, and marinas offer endless recreation, while the proximity to Dubai's historic areas adds cultural richness.",
    location: {
      landmarks: [
        "Dubai Creek Tower (under development)",
        "Ras Al Khor Wildlife Sanctuary",
        "Creek Marina",
        "Retail District",
        "Historic Dubai Creek"
      ],
      connectivity: [
        "Direct access to Ras Al Khor Road",
        "15 minutes to Downtown Dubai",
        "10 minutes to Dubai Festival City",
        "15 minutes to Dubai International Airport",
        "Future Metro connection planned"
      ]
    },
    amenities: {
      dining: "Waterfront restaurants and cafés with views of the Creek and marina.",
      retail: "Retail district with diverse shopping options from boutiques to major brands.",
      leisure: "Marinas, promenades, parks, and proximity to the Ras Al Khor flamingo sanctuary.",
      wellness: "Modern fitness facilities, waterfront jogging paths, and green spaces."
    },
    propertyTypes: [
      "Waterfront apartments",
      "Creek-view residences",
      "Premium penthouses",
      "Branded residences"
    ],
    residents: [
      "Young professionals",
      "Investors in emerging areas",
      "Those seeking waterfront living",
      "Families appreciating nature proximity"
    ],
    seo: {
      title: "Dubai Creek Harbour Area Guide",
      description: "Explore Dubai Creek Harbour — a futuristic waterfront development with iconic architecture and sustainable living. Find properties with JBJ Global Real Estate.",
      keywords: "Dubai Creek Harbour, waterfront apartments Dubai, Emaar Creek Harbour, Dubai Creek Tower, new developments Dubai"
    }
  },
  {
    slug: "jumeirah-beach-residence",
    name: "Jumeirah Beach Residence (JBR)",
    heroImage: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80",
    shortDescription: "Dubai's premier beachfront community with vibrant lifestyle and stunning sea views.",
    overview: `Jumeirah Beach Residence (JBR) is Dubai's first and most popular beachfront community, featuring 40 residential towers along a stunning stretch of beach. The Walk and Beach promenades create a vibrant atmosphere with endless dining, shopping, and entertainment options.

JBR offers the ultimate beach lifestyle with direct access to pristine sands and views of the Arabian Gulf.`,
    lifestyle: "JBR is for those who love beach life, outdoor dining, and a vibrant social scene. Morning beach runs, afternoon café hopping on The Walk, and sunset dining define daily life here.",
    location: {
      landmarks: [
        "JBR Beach — Public beach",
        "The Walk — Outdoor shopping and dining",
        "The Beach — Entertainment complex",
        "Ain Dubai views",
        "Bluewaters Island access"
      ],
      connectivity: [
        "Adjacent to Dubai Marina",
        "DMCC Metro Station nearby",
        "25 minutes to Downtown Dubai",
        "10 minutes to Palm Jumeirah",
        "Direct access to Sheikh Zayed Road"
      ]
    },
    amenities: {
      dining: "Over 100 restaurants and cafés along The Walk and Beach promenade.",
      retail: "The Walk offers extensive shopping from fashion to homeware.",
      leisure: "Beach activities, water sports, outdoor cinema, and regular markets.",
      wellness: "Beach fitness classes, yoga sessions, and premium residential gyms."
    },
    propertyTypes: [
      "Beachfront apartments",
      "Sea-view residences",
      "Penthouses with terraces",
      "Studio to 4-bedroom units"
    ],
    residents: [
      "Beach lifestyle enthusiasts",
      "Young professionals",
      "Tourists seeking short-term rentals",
      "Those who value walkability"
    ],
    seo: {
      title: "JBR Area Guide",
      description: "Discover JBR — Dubai's premier beachfront community with The Walk, stunning beaches, and vibrant lifestyle. Find properties with JBJ Global Real Estate.",
      keywords: "JBR Dubai, Jumeirah Beach Residence, beachfront apartments Dubai, The Walk JBR, beach living Dubai"
    }
  },
  {
    slug: "difc",
    name: "DIFC (Dubai International Financial Centre)",
    heroImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80",
    shortDescription: "The Middle East's premier financial hub with luxury living and world-class dining.",
    overview: `DIFC is the beating heart of the Middle East's financial industry, a purpose-built district that combines prestigious offices with luxury residences. Gate Village offers art galleries, fine dining, and cultural experiences, creating a sophisticated urban environment.

Living in DIFC means being at the center of regional finance, surrounded by the finest restaurants, galleries, and professionals.`,
    lifestyle: "DIFC attracts ambitious professionals who appreciate the synergy of work and lifestyle. Art exhibitions, fine dining, and networking events define the social scene.",
    location: {
      landmarks: [
        "Gate Building — Iconic landmark",
        "Gate Village — Art and dining",
        "DIFC Courts and Registry",
        "Numerous art galleries",
        "Premium office towers"
      ],
      connectivity: [
        "DIFC Metro Station",
        "5 minutes to Downtown Dubai",
        "15 minutes to Dubai International Airport",
        "Adjacent to Sheikh Zayed Road",
        "Walking distance to World Trade Centre"
      ]
    },
    amenities: {
      dining: "Some of Dubai's finest restaurants including Zuma, La Petite Maison, and Roberto's.",
      retail: "Boutique shopping in Gate Village with focus on art and luxury goods.",
      leisure: "Art galleries, cultural events, and proximity to Opera District.",
      wellness: "Premium fitness centers within residential towers and nearby hotels."
    },
    propertyTypes: [
      "Luxury apartments",
      "Serviced residences",
      "Penthouses",
      "High-end studios for professionals"
    ],
    residents: [
      "Finance professionals",
      "Legal and consulting experts",
      "Art enthusiasts",
      "Those seeking premium urban living"
    ],
    seo: {
      title: "DIFC Area Guide",
      description: "Explore DIFC — Dubai's premier financial district with luxury residences, fine dining, and art galleries. Find properties with JBJ Global Real Estate.",
      keywords: "DIFC Dubai, financial centre Dubai, Gate Village, luxury apartments DIFC, Dubai finance district"
    }
  },
  {
    slug: "mirdif",
    name: "Mirdif",
    heroImage: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=80",
    shortDescription: "A family-friendly freehold community with villas and excellent schools.",
    overview: `Mirdif is one of Dubai's most established family communities, offering a mix of villas and townhouses in a quiet, residential setting. The area is known for its tree-lined streets, excellent schools, and Mirdif City Centre mall.

Mirdif provides a suburban lifestyle with easy access to the airport and central Dubai, making it popular with families and long-term residents.`,
    lifestyle: "Mirdif is all about family life — schools, parks, community centers, and weekend outings to Mushrif Park. The pace is relaxed, neighbors know each other, and children play safely in the streets.",
    location: {
      landmarks: [
        "Mirdif City Centre — Major mall",
        "Mushrif Park — Green oasis",
        "Uptown Mirdif — Dining and retail",
        "Multiple international schools",
        "Community mosques"
      ],
      connectivity: [
        "Close to Dubai International Airport",
        "Mirdif Metro Station (proposed)",
        "25 minutes to Downtown Dubai",
        "20 minutes to Festival City",
        "Easy access to Al Khawaneej"
      ]
    },
    amenities: {
      dining: "Mirdif City Centre and Uptown Mirdif offer diverse dining from casual to family restaurants.",
      retail: "Mirdif City Centre provides comprehensive shopping with Carrefour hypermarket.",
      leisure: "Mushrif Park, community pools, and family entertainment at the mall.",
      wellness: "Community gyms, parks with walking paths, and family sports facilities."
    },
    propertyTypes: [
      "Family villas",
      "Townhouses",
      "Compound living",
      "Shorooq community homes"
    ],
    residents: [
      "Established families with children",
      "Long-term UAE residents",
      "Those working near the airport",
      "Families valuing community living"
    ],
    seo: {
      title: "Mirdif Area Guide",
      description: "Discover Mirdif — a family-friendly villa community near the airport with excellent schools and Mirdif City Centre. Find properties with JBJ Global Real Estate.",
      keywords: "Mirdif Dubai, family villas Dubai, Mirdif City Centre, residential community Dubai, villas near airport Dubai"
    }
  },
  {
    slug: "al-barsha",
    name: "Al Barsha",
    heroImage: "https://images.unsplash.com/photo-1582672060674-bc2bd808a8b5?w=1920&q=80",
    shortDescription: "A central residential area with Mall of the Emirates and excellent connectivity.",
    overview: `Al Barsha is a strategically located residential area centered around Mall of the Emirates, one of Dubai's premier shopping destinations. The area offers a mix of villas and apartments, making it accessible to various budgets while maintaining excellent connectivity.

Its central location makes Al Barsha ideal for those who need quick access to multiple parts of the city.`,
    lifestyle: "Al Barsha offers convenience-focused living with everything within reach. Residents enjoy easy access to shopping, dining, Ski Dubai, and quick commutes to business hubs.",
    location: {
      landmarks: [
        "Mall of the Emirates",
        "Ski Dubai",
        "Al Barsha Pond Park",
        "Various international schools",
        "Mix of villas and apartments"
      ],
      connectivity: [
        "Mall of the Emirates Metro Station",
        "Central location on Sheikh Zayed Road",
        "15 minutes to Dubai Marina",
        "15 minutes to Downtown Dubai",
        "25 minutes to Dubai International Airport"
      ]
    },
    amenities: {
      dining: "Extensive dining options at Mall of the Emirates and local restaurants throughout.",
      retail: "Mall of the Emirates offers comprehensive luxury and mainstream shopping.",
      leisure: "Ski Dubai, VOX Cinemas, and Al Barsha Pond Park for outdoor activities.",
      wellness: "Multiple gyms, salons, and wellness centers throughout the area."
    },
    propertyTypes: [
      "Apartments",
      "Villas",
      "Townhouses",
      "Hotel apartments"
    ],
    residents: [
      "Professionals seeking central location",
      "Families with varied budgets",
      "Those prioritizing connectivity",
      "Retail and hospitality workers"
    ],
    seo: {
      title: "Al Barsha Area Guide",
      description: "Explore Al Barsha — a central Dubai community with Mall of the Emirates, Ski Dubai, and excellent connectivity. Find properties with JBJ Global Real Estate.",
      keywords: "Al Barsha Dubai, Mall of the Emirates area, central apartments Dubai, Al Barsha villas, Dubai residential"
    }
  }
];

// Emirates filter for UAE-wide expansion
export const UAE_EMIRATES = [
  { id: "dubai", name: "Dubai", areas: ["downtown-dubai", "dubai-marina", "business-bay", "palm-jumeirah", "jumeirah-village-circle", "dubai-hills-estate", "arabian-ranches", "emirates-hills", "dubai-creek-harbour", "jumeirah-beach-residence", "difc", "mirdif", "al-barsha"] },
  { id: "abu-dhabi", name: "Abu Dhabi", areas: [] },
  { id: "sharjah", name: "Sharjah", areas: [] },
  { id: "ajman", name: "Ajman", areas: [] },
  { id: "ras-al-khaimah", name: "Ras Al Khaimah", areas: [] },
  { id: "fujairah", name: "Fujairah", areas: [] },
  { id: "umm-al-quwain", name: "Umm Al Quwain", areas: [] },
];

export const getAreaBySlug = (slug: string): AreaGuide | undefined => {
  return AREA_GUIDES.find(area => area.slug === slug);
};

export const getAreasByEmirate = (emirateId: string): AreaGuide[] => {
  const emirate = UAE_EMIRATES.find(e => e.id === emirateId);
  if (!emirate) return [];
  return AREA_GUIDES.filter(area => emirate.areas.includes(area.slug));
};
