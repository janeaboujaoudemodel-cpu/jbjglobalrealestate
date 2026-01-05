import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://jjglobalcapital.com",
  "https://www.jjglobalcapital.com",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
  );
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Dubai rental data - approximate averages by community (AED/year)
const rentalData: Record<string, Record<string, { min: number; max: number; avgPsf: number }>> = {
  "Downtown Dubai": {
    studio: { min: 55000, max: 85000, avgPsf: 140 },
    "1br": { min: 75000, max: 130000, avgPsf: 135 },
    "2br": { min: 120000, max: 200000, avgPsf: 130 },
    "3br": { min: 180000, max: 300000, avgPsf: 125 },
    "4br": { min: 280000, max: 450000, avgPsf: 120 },
    "5br+": { min: 400000, max: 700000, avgPsf: 115 },
    villa: { min: 500000, max: 1200000, avgPsf: 110 },
    townhouse: { min: 350000, max: 600000, avgPsf: 105 },
    penthouse: { min: 500000, max: 2000000, avgPsf: 150 },
  },
  "Dubai Marina": {
    studio: { min: 50000, max: 80000, avgPsf: 130 },
    "1br": { min: 70000, max: 120000, avgPsf: 125 },
    "2br": { min: 100000, max: 180000, avgPsf: 120 },
    "3br": { min: 160000, max: 280000, avgPsf: 115 },
    "4br": { min: 250000, max: 400000, avgPsf: 110 },
    "5br+": { min: 350000, max: 600000, avgPsf: 105 },
    villa: { min: 400000, max: 800000, avgPsf: 100 },
    townhouse: { min: 300000, max: 500000, avgPsf: 95 },
    penthouse: { min: 400000, max: 1500000, avgPsf: 140 },
  },
  "Palm Jumeirah": {
    studio: { min: 60000, max: 95000, avgPsf: 150 },
    "1br": { min: 90000, max: 150000, avgPsf: 145 },
    "2br": { min: 140000, max: 250000, avgPsf: 140 },
    "3br": { min: 220000, max: 380000, avgPsf: 135 },
    "4br": { min: 350000, max: 550000, avgPsf: 130 },
    "5br+": { min: 500000, max: 900000, avgPsf: 125 },
    villa: { min: 700000, max: 3000000, avgPsf: 150 },
    townhouse: { min: 500000, max: 900000, avgPsf: 120 },
    penthouse: { min: 800000, max: 4000000, avgPsf: 180 },
  },
  "Business Bay": {
    studio: { min: 45000, max: 70000, avgPsf: 120 },
    "1br": { min: 60000, max: 100000, avgPsf: 115 },
    "2br": { min: 90000, max: 150000, avgPsf: 110 },
    "3br": { min: 140000, max: 220000, avgPsf: 105 },
    "4br": { min: 200000, max: 350000, avgPsf: 100 },
    "5br+": { min: 300000, max: 500000, avgPsf: 95 },
    villa: { min: 350000, max: 600000, avgPsf: 90 },
    townhouse: { min: 280000, max: 450000, avgPsf: 88 },
    penthouse: { min: 350000, max: 1200000, avgPsf: 130 },
  },
  "Jumeirah Beach Residence (JBR)": {
    studio: { min: 55000, max: 85000, avgPsf: 135 },
    "1br": { min: 75000, max: 125000, avgPsf: 130 },
    "2br": { min: 110000, max: 180000, avgPsf: 125 },
    "3br": { min: 170000, max: 280000, avgPsf: 120 },
    "4br": { min: 260000, max: 420000, avgPsf: 115 },
    "5br+": { min: 380000, max: 650000, avgPsf: 110 },
    villa: { min: 450000, max: 900000, avgPsf: 105 },
    townhouse: { min: 350000, max: 550000, avgPsf: 100 },
    penthouse: { min: 450000, max: 1800000, avgPsf: 145 },
  },
  "Dubai Hills Estate": {
    studio: { min: 40000, max: 60000, avgPsf: 110 },
    "1br": { min: 55000, max: 90000, avgPsf: 105 },
    "2br": { min: 85000, max: 140000, avgPsf: 100 },
    "3br": { min: 130000, max: 200000, avgPsf: 95 },
    "4br": { min: 190000, max: 300000, avgPsf: 90 },
    "5br+": { min: 280000, max: 450000, avgPsf: 85 },
    villa: { min: 350000, max: 800000, avgPsf: 95 },
    townhouse: { min: 250000, max: 400000, avgPsf: 85 },
    penthouse: { min: 320000, max: 900000, avgPsf: 115 },
  },
  "Jumeirah Village Circle (JVC)": {
    studio: { min: 30000, max: 45000, avgPsf: 80 },
    "1br": { min: 40000, max: 65000, avgPsf: 75 },
    "2br": { min: 60000, max: 95000, avgPsf: 70 },
    "3br": { min: 85000, max: 130000, avgPsf: 65 },
    "4br": { min: 120000, max: 180000, avgPsf: 60 },
    "5br+": { min: 170000, max: 250000, avgPsf: 55 },
    villa: { min: 200000, max: 350000, avgPsf: 65 },
    townhouse: { min: 150000, max: 250000, avgPsf: 60 },
    penthouse: { min: 180000, max: 400000, avgPsf: 85 },
  },
  "DIFC": {
    studio: { min: 65000, max: 95000, avgPsf: 160 },
    "1br": { min: 90000, max: 150000, avgPsf: 155 },
    "2br": { min: 140000, max: 230000, avgPsf: 150 },
    "3br": { min: 220000, max: 350000, avgPsf: 145 },
    "4br": { min: 320000, max: 500000, avgPsf: 140 },
    "5br+": { min: 450000, max: 750000, avgPsf: 135 },
    villa: { min: 550000, max: 1100000, avgPsf: 130 },
    townhouse: { min: 400000, max: 700000, avgPsf: 125 },
    penthouse: { min: 600000, max: 2500000, avgPsf: 170 },
  },
  "Jumeirah Lakes Towers (JLT)": {
    studio: { min: 38000, max: 55000, avgPsf: 95 },
    "1br": { min: 50000, max: 80000, avgPsf: 90 },
    "2br": { min: 75000, max: 120000, avgPsf: 85 },
    "3br": { min: 110000, max: 170000, avgPsf: 80 },
    "4br": { min: 160000, max: 250000, avgPsf: 75 },
    "5br+": { min: 230000, max: 380000, avgPsf: 70 },
    villa: { min: 280000, max: 500000, avgPsf: 75 },
    townhouse: { min: 200000, max: 350000, avgPsf: 70 },
    penthouse: { min: 280000, max: 700000, avgPsf: 100 },
  },
  "Arabian Ranches": {
    studio: { min: 35000, max: 50000, avgPsf: 85 },
    "1br": { min: 50000, max: 75000, avgPsf: 80 },
    "2br": { min: 75000, max: 110000, avgPsf: 75 },
    "3br": { min: 110000, max: 160000, avgPsf: 70 },
    "4br": { min: 160000, max: 240000, avgPsf: 65 },
    "5br+": { min: 240000, max: 380000, avgPsf: 60 },
    villa: { min: 280000, max: 550000, avgPsf: 70 },
    townhouse: { min: 180000, max: 300000, avgPsf: 65 },
    penthouse: { min: 250000, max: 500000, avgPsf: 85 },
  },
};

// Default data for communities not specifically listed
const defaultData = {
  studio: { min: 35000, max: 55000, avgPsf: 90 },
  "1br": { min: 48000, max: 78000, avgPsf: 85 },
  "2br": { min: 70000, max: 115000, avgPsf: 80 },
  "3br": { min: 100000, max: 160000, avgPsf: 75 },
  "4br": { min: 150000, max: 240000, avgPsf: 70 },
  "5br+": { min: 220000, max: 360000, avgPsf: 65 },
  villa: { min: 250000, max: 450000, avgPsf: 70 },
  townhouse: { min: 180000, max: 320000, avgPsf: 65 },
  penthouse: { min: 280000, max: 600000, avgPsf: 95 },
};

// Market insights generator
function generateInsights(community: string, propertyType: string, data: { min: number; max: number; avgPsf: number }): string[] {
  const insights: string[] = [];
  
  const premiumAreas = ["Downtown Dubai", "Palm Jumeirah", "DIFC", "Dubai Marina", "Jumeirah Beach Residence (JBR)"];
  const growingAreas = ["Dubai Hills Estate", "Dubai Creek Harbour", "Damac Hills", "Town Square"];
  const affordableAreas = ["Jumeirah Village Circle (JVC)", "International City", "Discovery Gardens", "Al Nahda"];
  
  if (premiumAreas.includes(community)) {
    insights.push(`${community} is a premium location with high rental demand from professionals and tourists.`);
    insights.push("Properties in this area typically command 15-25% higher rents than city average.");
  } else if (growingAreas.includes(community)) {
    insights.push(`${community} is an emerging community with growing infrastructure and amenities.`);
    insights.push("Rental yields in this area have shown 5-8% year-over-year growth.");
  } else if (affordableAreas.includes(community)) {
    insights.push(`${community} offers competitive rental rates attractive to budget-conscious tenants.`);
    insights.push("High occupancy rates due to affordability and accessibility.");
  }
  
  if (propertyType === "studio" || propertyType === "1br") {
    insights.push("Smaller units tend to have higher rental yields (6-8%) compared to larger properties.");
  } else if (propertyType === "villa" || propertyType === "townhouse") {
    insights.push("Villas and townhouses have seen increased demand post-pandemic as families prioritize space.");
  }
  
  insights.push("Dubai's rental market follows a cycle with peak demand during Q4 and Q1.");
  insights.push("Furnished properties typically command 10-20% premium over unfurnished units.");
  
  return insights;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { community, propertyType, size, furnished } = await req.json();
    
    console.log(`Rental analysis request: ${community}, ${propertyType}, size: ${size}, furnished: ${furnished}`);
    
    if (!community || !propertyType) {
      return new Response(
        JSON.stringify({ error: "Community and property type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Get rental data for the community
    const communityData = rentalData[community] || defaultData;
    const typeData = communityData[propertyType] || defaultData[propertyType as keyof typeof defaultData];
    
    if (!typeData) {
      return new Response(
        JSON.stringify({ error: "Invalid property type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let { min, max, avgPsf } = typeData;
    
    // Adjust for furnished status
    if (furnished === "furnished") {
      min = Math.round(min * 1.15);
      max = Math.round(max * 1.20);
    } else if (furnished === "semi-furnished") {
      min = Math.round(min * 1.08);
      max = Math.round(max * 1.12);
    }
    
    // Calculate average
    const average = Math.round((min + max) / 2);
    
    // Determine market trend and demand
    const premiumAreas = ["Downtown Dubai", "Palm Jumeirah", "DIFC", "Dubai Marina"];
    const marketTrend = premiumAreas.includes(community) ? "Upward" : 
                       ["Dubai Hills Estate", "Dubai Creek Harbour"].includes(community) ? "Strong Growth" : "Stable";
    
    const demandLevel = premiumAreas.includes(community) ? "Very High" :
                       ["Dubai Marina", "JBR", "Business Bay"].includes(community) ? "High" : "Moderate";
    
    // Generate insights
    const insights = generateInsights(community, propertyType, typeData);
    
    // Yearly increase estimate
    const yearlyIncrease = premiumAreas.includes(community) ? "+5-8%" :
                          marketTrend === "Strong Growth" ? "+8-12%" : "+3-5%";
    
    const response = {
      community,
      propertyType,
      estimatedRentMin: min,
      estimatedRentMax: max,
      averageRent: average,
      pricePerSqft: avgPsf,
      yearlyIncrease,
      marketTrend,
      demandLevel,
      insights,
      disclaimer: "These estimates are for informational purposes only and are based on aggregated market data. Actual rental values may vary based on specific property features, building quality, view, floor level, and current market conditions. For accurate rental valuations, please consult official sources such as Dubai Land Department (DLD), RERA, and licensed real estate professionals."
    };
    
    console.log("Rental analysis response:", JSON.stringify(response));
    
    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in rental-index-analysis:", error);
    return new Response(
      JSON.stringify({ error: "An error occurred processing your request" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});