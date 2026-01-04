import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useShortlist } from "@/hooks/useFavorites";
import { useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useMembership } from "@/hooks/useMembership";
import { 
  ChevronLeft, Sparkles, Send, Loader2, CheckCircle, Download, Star, 
  Users, Crown, Gift, TrendingUp, MapPin, Building, Home, 
  BadgeCheck, AlertTriangle, Zap, Award, Phone, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PaymentModal } from "@/components/PaymentModal";
import { Badge } from "@/components/ui/badge";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";
const COMPARE_FREE_KEY = "jj_compare_free_used";

interface AIAnalysis {
  projectDetailsTable: Array<{
    projectName: string;
    developer: string;
    developerTier: string;
    location: string;
    areaType: string;
    trafficLevel: string;
    priceRange: string;
    pricePerSqft: number;
    bedrooms: string;
    sizeRange: string;
    handover: string;
    paymentPlan: string;
    furnishedStatus: string;
    views: string[];
    keyAmenities: string[];
    keyFacilities: string[];
    uniqueSellingPoints: string[];
    investmentType: string;
    targetBuyer: string;
  }>;
  comparisonTable: {
    categories: Array<{
      name: string;
      metrics: Array<{
        metric: string;
        values: Record<string, string>;
      }>;
    }>;
  };
  ratings: Array<{
    projectName: string;
    overallRating: number;
    locationRating: number;
    valueRating: number;
    amenitiesRating: number;
    investmentRating: number;
    developerRating: number;
    pros: string[];
    cons: string[];
  }>;
  recommendation: {
    topChoice: string;
    reasoning: string;
    bestFor: {
      investors: string;
      families: string;
      firstTimeBuyers: string;
      luxuryBuyers: string;
    };
    investmentAdvice: string;
    riskFactors: string[];
  };
  summary: string;
}

const Compare = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { hasActiveMembership } = useMembership();
  const { data: authShortlist } = useShortlist();
  const { shortlist: guestShortlist, getBadge } = useGuestShortlist();
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
  });
  const [requestSent, setRequestSent] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Track free comparison usage
  const [hasUsedFreeCompare, setHasUsedFreeCompare] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(COMPARE_FREE_KEY) === "true";
    }
    return false;
  });

  const markFreeCompareUsed = () => {
    localStorage.setItem(COMPARE_FREE_KEY, "true");
    setHasUsedFreeCompare(true);
  };

  // Use auth shortlist if logged in, otherwise guest shortlist
  const shortlist = user ? authShortlist : guestShortlist;
  const shortlistIds = shortlist?.map((s) => s.project_id) || [];

  // Fetch project details
  const { data: projects, isLoading } = useQuery({
    queryKey: ["compare-projects", shortlistIds],
    queryFn: async () => {
      if (!shortlistIds.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(name, slug),
          images:project_images(image_url, alt_text, display_order),
          community:communities(name, slug),
          documents:project_documents(file_url, file_name, document_type)
        `)
        .in("id", shortlistIds);

      if (error) throw error;
      return data;
    },
    enabled: shortlistIds.length > 0,
  });

  // Check if user can use free or needs VIP
  const needsVipForCompare = hasUsedFreeCompare && !hasActiveMembership;

  // Generate Smart AI Analysis
  const generateSmartAnalysis = async () => {
    if (!projects?.length || projects.length < 2) {
      toast.error("Please add at least 2 properties to compare");
      return;
    }
    
    if (needsVipForCompare) {
      setShowVipModal(true);
      return;
    }
    
    setIsGenerating(true);
    try {
      const projectData = projects.map((p) => ({
        id: p.id,
        name: p.name,
        developer: p.developer?.name || "Unknown",
        location: p.location || "",
        emirate: p.emirate || "Dubai",
        community: p.community?.name || "",
        priceFrom: p.price_from || 0,
        priceTo: p.price_to,
        bedroomsMin: p.bedrooms_min || 0,
        bedroomsMax: p.bedrooms_max || 0,
        sizeMin: p.size_min || 0,
        sizeMax: p.size_max || 0,
        handover: p.handover_date,
        paymentPlan: p.payment_plan,
        amenities: p.amenities || [],
        facilities: p.facilities || [],
        views: p.views || [],
        furnishedStatus: p.furnished_status,
        floors: p.floors,
        serviceCharge: p.service_charge,
        description: p.description,
      }));

      const response = await supabase.functions.invoke("smart-ai-analysis", {
        body: { projects: projectData },
      });

      if (response.error) {
        if (response.error.message?.includes("429")) {
          toast.error("Too many requests. Please wait a moment and try again.");
          return;
        }
        throw response.error;
      }
      
      setAiAnalysis(response.data.analysis);
      toast.success("AI Analysis generated successfully!");
      
      if (!hasActiveMembership) {
        markFreeCompareUsed();
      }
    } catch (error) {
      console.error("Failed to generate analysis:", error);
      toast.error("Failed to generate AI analysis. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download comprehensive report
  const downloadComprehensiveReport = async () => {
    if (!projects?.length || !aiAnalysis) return;
    
    const userName = formData.name || user?.email?.split("@")[0] || "Investor";
    const dateStr = new Date().toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const renderStars = (rating: number) => "★".repeat(rating) + "☆".repeat(5 - rating);

    const reportHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Property Comparison Report - JJ Global Capital</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #fff; padding: 40px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #A8925A; padding-bottom: 30px; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; }
    .gold { color: #A8925A; }
    .subtitle { color: #888; margin-top: 10px; }
    .user-info { margin-top: 15px; font-size: 14px; color: #666; }
    
    h2 { color: #A8925A; font-size: 20px; margin: 30px 0 20px; border-bottom: 1px solid #333; padding-bottom: 10px; }
    
    .summary-box { background: linear-gradient(135deg, rgba(168,146,90,0.15), transparent); border: 1px solid rgba(168,146,90,0.3); border-radius: 12px; padding: 25px; margin-bottom: 30px; }
    .summary-text { font-size: 16px; line-height: 1.8; color: #ccc; }
    
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; background: #1a1a1a; border-radius: 12px; overflow: hidden; }
    th { background: #252525; color: #A8925A; padding: 15px; text-align: left; font-weight: 600; }
    td { padding: 12px 15px; border-bottom: 1px solid #333; color: #ddd; }
    tr:last-child td { border-bottom: none; }
    
    .rating-card { background: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .rating-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
    .rating-name { font-size: 18px; font-weight: 600; }
    .rating-stars { color: #A8925A; font-size: 24px; }
    .rating-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 15px; }
    .rating-item { text-align: center; background: #252525; padding: 10px; border-radius: 8px; }
    .rating-item-label { font-size: 11px; color: #888; }
    .rating-item-value { color: #A8925A; margin-top: 5px; }
    .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .pros, .cons { padding: 15px; border-radius: 8px; }
    .pros { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); }
    .cons { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); }
    .pros h4 { color: #22c55e; } .cons h4 { color: #ef4444; }
    .pros li, .cons li { margin: 5px 0; font-size: 14px; color: #ccc; }
    
    .recommendation-box { background: linear-gradient(135deg, #A8925A, #8B7744); border-radius: 12px; padding: 30px; margin: 30px 0; }
    .recommendation-box h3 { color: #000; font-size: 22px; margin-bottom: 10px; }
    .recommendation-box p { color: #222; font-size: 16px; line-height: 1.6; }
    .best-for { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px; }
    .best-for-item { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; }
    .best-for-label { font-size: 12px; color: #333; font-weight: 600; }
    .best-for-value { color: #000; margin-top: 5px; }
    
    .risk-section { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 20px; margin: 30px 0; }
    .risk-section h4 { color: #ef4444; margin-bottom: 15px; }
    .risk-section li { color: #ccc; margin: 8px 0; }
    
    .footer { text-align: center; margin-top: 50px; padding-top: 30px; border-top: 1px solid #333; color: #666; }
    .footer p { margin: 5px 0; }
    
    .tag { display: inline-block; background: #252525; color: #A8925A; padding: 4px 10px; border-radius: 15px; font-size: 12px; margin: 3px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><span class="gold">J | J</span> GLOBAL CAPITAL</div>
      <p class="subtitle">Premium Property Investment Advisory • AI-Powered Comparison Report</p>
      <p class="user-info">Prepared for: <strong>${userName}</strong> | Date: ${dateStr}</p>
    </div>

    <div class="summary-box">
      <p class="summary-text">${aiAnalysis.summary}</p>
    </div>

    <h2>📊 Property Details Comparison</h2>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          ${aiAnalysis.projectDetailsTable.map(p => `<th>${p.projectName}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>Developer</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.developer}<br><small style="color:#888">${p.developerTier}</small></td>`).join('')}</tr>
        <tr><td><strong>Location</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.location}</td>`).join('')}</tr>
        <tr><td><strong>Area Type</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.areaType}</td>`).join('')}</tr>
        <tr><td><strong>Traffic Level</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.trafficLevel}</td>`).join('')}</tr>
        <tr><td><strong>Price Range</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.priceRange}</td>`).join('')}</tr>
        <tr><td><strong>Price/sqft</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>AED ${p.pricePerSqft?.toLocaleString() || 'N/A'}</td>`).join('')}</tr>
        <tr><td><strong>Bedrooms</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.bedrooms}</td>`).join('')}</tr>
        <tr><td><strong>Size Range</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.sizeRange}</td>`).join('')}</tr>
        <tr><td><strong>Handover</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.handover}</td>`).join('')}</tr>
        <tr><td><strong>Payment Plan</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.paymentPlan}</td>`).join('')}</tr>
        <tr><td><strong>Investment Type</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.investmentType}</td>`).join('')}</tr>
        <tr><td><strong>Target Buyer</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.targetBuyer}</td>`).join('')}</tr>
        <tr><td><strong>Views</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.views?.join(', ') || '-'}</td>`).join('')}</tr>
        <tr><td><strong>Key Amenities</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.keyAmenities?.slice(0,5).join(', ') || '-'}</td>`).join('')}</tr>
        <tr><td><strong>Unique Selling Points</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.uniqueSellingPoints?.join(', ') || '-'}</td>`).join('')}</tr>
      </tbody>
    </table>

    <h2>⭐ Ratings & Analysis</h2>
    ${aiAnalysis.ratings.map(r => `
    <div class="rating-card">
      <div class="rating-header">
        <span class="rating-name">${r.projectName}</span>
        <span class="rating-stars">${renderStars(r.overallRating)}</span>
      </div>
      <div class="rating-grid">
        <div class="rating-item"><div class="rating-item-label">Location</div><div class="rating-item-value">${renderStars(r.locationRating)}</div></div>
        <div class="rating-item"><div class="rating-item-label">Value</div><div class="rating-item-value">${renderStars(r.valueRating)}</div></div>
        <div class="rating-item"><div class="rating-item-label">Amenities</div><div class="rating-item-value">${renderStars(r.amenitiesRating)}</div></div>
        <div class="rating-item"><div class="rating-item-label">Investment</div><div class="rating-item-value">${renderStars(r.investmentRating)}</div></div>
        <div class="rating-item"><div class="rating-item-label">Developer</div><div class="rating-item-value">${renderStars(r.developerRating)}</div></div>
      </div>
      <div class="pros-cons">
        <div class="pros"><h4>✅ Pros</h4><ul>${r.pros?.map(p => `<li>${p}</li>`).join('') || ''}</ul></div>
        <div class="cons"><h4>⚠️ Cons</h4><ul>${r.cons?.map(c => `<li>${c}</li>`).join('') || ''}</ul></div>
      </div>
    </div>
    `).join('')}

    <div class="recommendation-box">
      <h3>🏆 Our Recommendation: ${aiAnalysis.recommendation.topChoice}</h3>
      <p>${aiAnalysis.recommendation.reasoning}</p>
      <div class="best-for">
        <div class="best-for-item"><div class="best-for-label">Best for Investors</div><div class="best-for-value">${aiAnalysis.recommendation.bestFor.investors}</div></div>
        <div class="best-for-item"><div class="best-for-label">Best for Families</div><div class="best-for-value">${aiAnalysis.recommendation.bestFor.families}</div></div>
        <div class="best-for-item"><div class="best-for-label">Best for First-Time Buyers</div><div class="best-for-value">${aiAnalysis.recommendation.bestFor.firstTimeBuyers}</div></div>
        <div class="best-for-item"><div class="best-for-label">Best for Luxury Buyers</div><div class="best-for-value">${aiAnalysis.recommendation.bestFor.luxuryBuyers}</div></div>
      </div>
      <p style="margin-top:20px; background:rgba(0,0,0,0.2); padding:15px; border-radius:8px;">
        <strong>💡 Investment Advice:</strong> ${aiAnalysis.recommendation.investmentAdvice}
      </p>
    </div>

    ${aiAnalysis.recommendation.riskFactors?.length ? `
    <div class="risk-section">
      <h4>⚠️ Risk Factors to Consider</h4>
      <ul>${aiAnalysis.recommendation.riskFactors.map(r => `<li>${r}</li>`).join('')}</ul>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>JJ Global Capital</strong> - Premium Property Investment Advisory</p>
      <p>📧 invest@jjglobalcapital.com | 📞 +971 56 591 1000</p>
      <p>🌐 www.jjglobalcapital.com</p>
      <p style="margin-top:15px; font-size:12px;">Powered & Made by JJ Global Capital — Part of JJ Holding Group</p>
      <p style="margin-top:10px; font-size:11px; font-style:italic;">
        This report is for informational purposes only. Investment decisions should be made after consulting with our advisors.
      </p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JJ-Global-Capital-AI-Comparison-${userName.replace(/\s+/g, '-')}-${dateStr.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("AI Comparison Report downloaded!");
  };

  // Submit evaluation request
  const submitRequest = useMutation({
    mutationFn: async () => {
      if (!projects?.length) throw new Error("No projects to compare");

      const { error } = await supabase.from("evaluation_requests").insert({
        user_id: user?.id || null,
        project_ids: projects.map((p) => p.id),
        user_email: formData.email,
        user_name: formData.name,
        user_phone: formData.phone,
        ai_comparison: aiAnalysis ? JSON.stringify(aiAnalysis) : null,
        status: "pending",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setRequestSent(true);
      toast.success("Consultation request sent! Our advisor will contact you shortly.");
    },
    onError: (error) => {
      console.error(error);
      toast.error("Failed to submit request. Please try again.");
    },
  });

  const renderStars = (rating: number) => {
    return (
      <span className="text-gold">
        {"★".repeat(rating)}
        <span className="text-zinc-600">{"☆".repeat(5 - rating)}</span>
      </span>
    );
  };

  if (isLoading) {
    return (
      <section className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </section>
    );
  }

  if (!projects?.length) {
    return (
      <section className="min-h-screen bg-zinc-950 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white text-3xl font-bold mb-4">No Properties to Compare</h1>
          <p className="text-zinc-400 mb-8">
            Add 2-5 properties to your shortlist to compare them with AI analysis.
          </p>
          <Link to="/properties">
            <Button className="bg-gold text-black hover:bg-gold-light">
              Browse Properties
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-950 py-8 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Properties</span>
        </Link>

        <div className="flex flex-col gap-8">
          {/* Title */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-white text-3xl font-bold">
                  Smart Property Comparison
                </h1>
                <Badge className="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
              </div>
              <p className="text-zinc-400">
                Compare {projects.length} properties with intelligent AI analysis
              </p>
            </div>
            <div className="flex gap-3">
              {aiAnalysis && (
                <Button
                  onClick={downloadComprehensiveReport}
                  variant="outline"
                  className="border-gold text-gold hover:bg-gold/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              )}
              <Button
                onClick={generateSmartAnalysis}
                disabled={isGenerating || projects.length < 2}
                className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-500 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {aiAnalysis ? "Regenerate Analysis" : "Generate AI Analysis"}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Basic Comparison Table */}
          <div ref={tableRef} className="overflow-x-auto bg-zinc-900 rounded-2xl border border-zinc-800">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left py-4 px-4 text-zinc-500 font-medium border-b border-zinc-800 sticky left-0 bg-zinc-900 z-10">
                    Feature
                  </th>
                  {projects.map((project) => {
                    const badge = !user ? getBadge(project.id) : null;
                    return (
                      <th
                        key={project.id}
                        className="text-left py-4 px-4 border-b border-zinc-800 min-w-[250px]"
                      >
                        <div className="flex flex-col gap-2">
                          {badge && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold w-fit ${
                              badge === 'top1' ? 'bg-yellow-500/20 text-yellow-400' :
                              badge === 'top2' ? 'bg-gray-400/20 text-gray-300' :
                              'bg-orange-600/20 text-orange-400'
                            }`}>
                              {badge === 'top1' ? '🥇 Top 1' : badge === 'top2' ? '🥈 Top 2' : '🥉 Top 3'}
                            </span>
                          )}
                          <img
                            src={project.images?.[0]?.image_url || "/placeholder.svg"}
                            alt={project.name}
                            className="w-full aspect-video object-cover rounded-lg"
                          />
                          <h3 className="text-white font-semibold">{project.name}</h3>
                          <p className="text-zinc-500 text-sm">{project.developer?.name}</p>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Location", icon: MapPin, key: "location" },
                  { label: "Community", key: "community", format: (_: any, p: any) => p.community?.name || "-" },
                  { label: "Emirate", key: "emirate" },
                  { label: "Price From", key: "price_from", format: (v: number) => `AED ${(v / 1000000).toFixed(2)}M` },
                  { label: "Price To", key: "price_to", format: (v: number) => v ? `AED ${(v / 1000000).toFixed(2)}M` : "-" },
                  { label: "Bedrooms", key: "bedrooms", format: (_: any, p: any) => `${p.bedrooms_min} - ${p.bedrooms_max} BR` },
                  { label: "Size Range", key: "size", format: (_: any, p: any) => `${p.size_min?.toLocaleString() || "-"} - ${p.size_max?.toLocaleString() || "-"} sqft` },
                  { label: "Price/sqft", key: "pricesqft", format: (_: any, p: any) => p.size_min && p.price_from ? `AED ${Math.round(p.price_from / p.size_min).toLocaleString()}` : "-" },
                  { label: "Handover", key: "handover_date", format: (v: string) => v || "Ready/TBD" },
                  { label: "Payment Plan", key: "payment_plan", format: (v: string) => v || "-" },
                  { label: "Furnished", key: "furnished_status" },
                  { label: "Views", key: "views", format: (v: string[]) => v?.join(", ") || "-" },
                  { label: "Key Amenities", key: "amenities", format: (v: string[]) => v?.slice(0, 5).join(", ") || "-" },
                ].map((row) => (
                  <tr key={row.label} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-4 px-4 text-zinc-400 sticky left-0 bg-zinc-900 font-medium">
                      {row.label}
                    </td>
                    {projects.map((project) => {
                      const value = project[row.key as keyof typeof project];
                      const displayValue = row.format 
                        ? row.format(value as any, project)
                        : (value as string) || "-";
                      return (
                        <td key={project.id} className="py-4 px-4 text-white text-sm">
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Analysis Section */}
          {aiAnalysis ? (
            <div className="space-y-8">
              {/* Summary */}
              <div className="bg-gradient-to-br from-purple-950/50 to-zinc-900 rounded-2xl border border-purple-800/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Executive Summary</h3>
                    <p className="text-purple-400 text-sm">AI-Generated Analysis</p>
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed">{aiAnalysis.summary}</p>
              </div>

              {/* Ratings Cards */}
              <div>
                <h2 className="text-white text-xl font-semibold mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-gold" />
                  Property Ratings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiAnalysis.ratings.map((rating, index) => (
                    <div key={index} className="bg-zinc-900 rounded-xl border border-zinc-800 p-5">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-white font-semibold">{rating.projectName}</h4>
                        <div className="text-2xl">{renderStars(rating.overallRating)}</div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-2 mb-4">
                        <div className="text-center">
                          <div className="text-xs text-zinc-500 mb-1">Location</div>
                          <div className="text-gold text-sm">{renderStars(rating.locationRating)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-zinc-500 mb-1">Value</div>
                          <div className="text-gold text-sm">{renderStars(rating.valueRating)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-zinc-500 mb-1">Amenities</div>
                          <div className="text-gold text-sm">{renderStars(rating.amenitiesRating)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-zinc-500 mb-1">Invest</div>
                          <div className="text-gold text-sm">{renderStars(rating.investmentRating)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-zinc-500 mb-1">Developer</div>
                          <div className="text-gold text-sm">{renderStars(rating.developerRating)}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-950/30 border border-green-900/30 rounded-lg p-3">
                          <div className="text-green-400 text-xs font-semibold mb-2 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Pros
                          </div>
                          <ul className="text-xs text-zinc-400 space-y-1">
                            {rating.pros?.slice(0, 3).map((pro, i) => (
                              <li key={i}>• {pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-950/30 border border-red-900/30 rounded-lg p-3">
                          <div className="text-red-400 text-xs font-semibold mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Cons
                          </div>
                          <ul className="text-xs text-zinc-400 space-y-1">
                            {rating.cons?.slice(0, 3).map((con, i) => (
                              <li key={i}>• {con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-gradient-to-r from-gold/20 to-gold-light/10 rounded-2xl border border-gold/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-gold" />
                  <div>
                    <h3 className="text-white font-bold text-xl">Our Recommendation</h3>
                    <p className="text-gold text-lg">{aiAnalysis.recommendation.topChoice}</p>
                  </div>
                </div>
                <p className="text-zinc-300 mb-6">{aiAnalysis.recommendation.reasoning}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                      <TrendingUp className="w-4 h-4" /> For Investors
                    </div>
                    <p className="text-white text-sm">{aiAnalysis.recommendation.bestFor.investors}</p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                      <Home className="w-4 h-4" /> For Families
                    </div>
                    <p className="text-white text-sm">{aiAnalysis.recommendation.bestFor.families}</p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                      <Users className="w-4 h-4" /> First-Time Buyers
                    </div>
                    <p className="text-white text-sm">{aiAnalysis.recommendation.bestFor.firstTimeBuyers}</p>
                  </div>
                  <div className="bg-zinc-900/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-zinc-400 text-sm mb-2">
                      <Crown className="w-4 h-4" /> Luxury Buyers
                    </div>
                    <p className="text-white text-sm">{aiAnalysis.recommendation.bestFor.luxuryBuyers}</p>
                  </div>
                </div>

                <div className="bg-zinc-900/70 rounded-lg p-4 border border-zinc-700">
                  <div className="flex items-center gap-2 text-gold mb-2">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold">Investment Advice</span>
                  </div>
                  <p className="text-zinc-300 text-sm">{aiAnalysis.recommendation.investmentAdvice}</p>
                </div>

                {aiAnalysis.recommendation.riskFactors?.length > 0 && (
                  <div className="mt-4 bg-red-950/20 border border-red-900/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-semibold">Risk Factors to Consider</span>
                    </div>
                    <ul className="text-zinc-400 text-sm space-y-1">
                      {aiAnalysis.recommendation.riskFactors.map((risk, i) => (
                        <li key={i}>• {risk}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* CTA to Generate Analysis */
            <div className="bg-gradient-to-br from-purple-950/50 to-zinc-900 rounded-2xl border border-purple-800/30 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">Unlock AI Analysis</h3>
              <p className="text-zinc-400 max-w-md mx-auto mb-6">
                Get detailed property comparisons, ratings, investment recommendations, and personalized advice powered by advanced AI.
              </p>
              <Button
                onClick={generateSmartAnalysis}
                disabled={isGenerating || projects.length < 2}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:from-purple-500 hover:to-purple-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating Analysis...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate AI Analysis
                    {!hasActiveMembership && !hasUsedFreeCompare && (
                      <Badge className="ml-2 bg-green-500 text-white text-xs">FREE</Badge>
                    )}
                  </>
                )}
              </Button>
              {projects.length < 2 && (
                <p className="text-zinc-500 text-sm mt-4">Add at least 2 properties to enable AI comparison</p>
              )}
            </div>
          )}

          {/* Contact Advisor Section */}
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center">
                <Users className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Need Expert Guidance?</h3>
                <p className="text-zinc-400 text-sm">Speak with our investment advisors</p>
              </div>
            </div>

            {requestSent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h4 className="text-white text-lg font-semibold mb-2">Request Sent!</h4>
                <p className="text-zinc-400">Our advisor will contact you within 24 hours.</p>
              </div>
            ) : showRequestForm ? (
              <div className="space-y-4">
                <Input
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <Input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="bg-zinc-800 border-zinc-700 text-white"
                />
                <div className="flex gap-3">
                  <Button
                    onClick={() => submitRequest.mutate()}
                    disabled={!formData.email || submitRequest.isPending}
                    className="flex-1 bg-gold text-black hover:bg-gold-light"
                  >
                    {submitRequest.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Request Consultation
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowRequestForm(false)}
                    className="border-zinc-700 text-zinc-400"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-gold text-black hover:bg-gold-light"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Request Callback
                </Button>
                <a href="tel:+971565911000">
                  <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </a>
                <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full border-zinc-700 text-white hover:bg-zinc-800">
                    <BadgeCheck className="w-4 h-4 mr-2" />
                    Full Inquiry Form
                  </Button>
                </a>
              </div>
            )}
          </div>

          {/* Footer Branding */}
          <div className="text-center text-zinc-600 text-sm py-4">
            Powered & Made by <span className="text-gold">JJ Global Capital</span> — Part of JJ Holding Group
          </div>
        </div>
      </div>

      {/* VIP Modal */}
      <PaymentModal
        open={showVipModal}
        onOpenChange={setShowVipModal}
        onSuccess={() => {
          setShowVipModal(false);
          generateSmartAnalysis();
        }}
        userInfo={{
          fullName: formData.name || user?.email?.split("@")[0] || "",
          email: formData.email || user?.email || "",
          phone: formData.phone || "",
        }}
        mode="vip"
      />
    </section>
  );
};

export default Compare;
