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
    heroImage: "https://images.unsplash.com/photo-1546412414-e1885259563a?w=1920&q=80",
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
  }
];

export const getAreaBySlug = (slug: string): AreaGuide | undefined => {
  return AREA_GUIDES.find(area => area.slug === slug);
};
