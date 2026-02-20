import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembership } from "@/hooks/useMembership";
import { useShortlist } from "@/hooks/useFavorites";
import { useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useShortlistBadges } from "@/hooks/useShortlistBadges";
import { 
  ChevronLeft, Sparkles, Send, Loader2, CheckCircle, Download, Star, 
  Users, Crown, Gift, TrendingUp, MapPin, Building, Home, 
  BadgeCheck, AlertTriangle, Zap, Award, Phone, Mail, BarChart3,
  ArrowLeft, ArrowUpRight, Heart, ListChecks, Layers, Brain
} from "lucide-react";
import AIPropertyAnalyzer from "@/components/ai-tools/AIPropertyAnalyzer";
import { Button } from "@/components/ui/button";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PaymentModal } from "@/components/PaymentModal";
import { Badge } from "@/components/ui/badge";
import { FounderContent } from "@/components/FounderContent";

import ActiveLeadBanner from "@/components/crm/ActiveLeadBanner";
import { useActiveLead } from "@/contexts/ActiveLeadContext";

const INQUIRY_FORM_URL = "https://JBJ.AE/contact";
const COMPARE_FREE_KEY = "jbj_compare_free_used";

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
  const { activeLead } = useActiveLead();
  const { hasActiveMembership } = useMembership();
  const { data: authShortlist } = useShortlist();
  const { shortlist: guestShortlist } = useGuestShortlist();
  const { getBadge } = useShortlistBadges();
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [formData, setFormData] = useState({
    name: activeLead?.full_name || "",
    email: activeLead?.email || user?.email || "",
    phone: activeLead?.phone || "",
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

    // Requires authentication (backend enforces JWT)
    if (!user) {
      toast.error("Please sign in to generate AI analysis.");
      navigate("/auth");
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

    // HTML escape function to prevent XSS
    const escapeHtml = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const reportHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <title>Property Comparison Report - JBJ Global Real Estate</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0a0a0a; color: #fff; padding: 40px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 2px solid #A8925A; padding-bottom: 30px; margin-bottom: 40px; }
    .logo { font-size: 28px; font-weight: bold; }
    .gold { color: #A8925A; }
    .subtitle { color: #888; margin-top: 10px; }
    .user-info { margin-top: 15px; font-size: 14px; color: #666; }
    .disclaimer-box { background: rgba(168,146,90,0.1); border: 1px solid rgba(168,146,90,0.3); border-radius: 8px; padding: 15px; margin-bottom: 30px; text-align: center; }
    .disclaimer-text { font-size: 12px; color: #888; line-height: 1.6; }
    
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
      <div class="logo"><span class="gold">JBJ</span> GLOBAL REAL ESTATE</div>
      <p class="subtitle">Real Estate Brokerage • AI-Powered Property Comparison</p>
      <p class="user-info">Prepared for: <strong>${escapeHtml(userName)}</strong> | Date: ${dateStr}</p>
    </div>

    <div class="disclaimer-box">
      <p class="disclaimer-text">
        <strong>Disclaimer:</strong> This report is for informational purposes only and is not legal, mortgage, financial, or investment advice. 
        Verify all information using official sources and/or independent licensed professionals.
      </p>
    </div>

    <div class="summary-box">
      <p class="summary-text">${escapeHtml(aiAnalysis.summary)}</p>
    </div>

    <h2>📊 Property Details Comparison</h2>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          ${aiAnalysis.projectDetailsTable.map(p => `<th>${escapeHtml(p.projectName)}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        <tr><td><strong>Developer</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.developer)}<br><small style="color:#888">${escapeHtml(p.developerTier)}</small></td>`).join('')}</tr>
        <tr><td><strong>Location</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.location)}</td>`).join('')}</tr>
        <tr><td><strong>Area Type</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.areaType)}</td>`).join('')}</tr>
        <tr><td><strong>Traffic Level</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.trafficLevel)}</td>`).join('')}</tr>
        <tr><td><strong>Price Range</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.priceRange)}</td>`).join('')}</tr>
        <tr><td><strong>Price/sqft</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>AED ${p.pricePerSqft?.toLocaleString() || 'N/A'}</td>`).join('')}</tr>
        <tr><td><strong>Bedrooms</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.bedrooms)}</td>`).join('')}</tr>
        <tr><td><strong>Size Range</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.sizeRange)}</td>`).join('')}</tr>
        <tr><td><strong>Handover</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.handover)}</td>`).join('')}</tr>
        <tr><td><strong>Payment Plan</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.paymentPlan)}</td>`).join('')}</tr>
        <tr><td><strong>Investment Type</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.investmentType)}</td>`).join('')}</tr>
        <tr><td><strong>Target Buyer</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${escapeHtml(p.targetBuyer)}</td>`).join('')}</tr>
        <tr><td><strong>Views</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.views?.map(v => escapeHtml(v)).join(', ') || '-'}</td>`).join('')}</tr>
        <tr><td><strong>Key Amenities</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.keyAmenities?.slice(0,5).map(a => escapeHtml(a)).join(', ') || '-'}</td>`).join('')}</tr>
        <tr><td><strong>Unique Selling Points</strong></td>${aiAnalysis.projectDetailsTable.map(p => `<td>${p.uniqueSellingPoints?.map(u => escapeHtml(u)).join(', ') || '-'}</td>`).join('')}</tr>
      </tbody>
    </table>

    <h2>⭐ Ratings & Analysis</h2>
    ${aiAnalysis.ratings.map(r => `
    <div class="rating-card">
      <div class="rating-header">
        <span class="rating-name">${escapeHtml(r.projectName)}</span>
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
        <div class="pros"><h4>✅ Pros</h4><ul>${r.pros?.map(p => `<li>${escapeHtml(p)}</li>`).join('') || ''}</ul></div>
        <div class="cons"><h4>⚠️ Cons</h4><ul>${r.cons?.map(c => `<li>${escapeHtml(c)}</li>`).join('') || ''}</ul></div>
      </div>
    </div>
    `).join('')}

    <div class="recommendation-box">
      <h3>🏆 Our Recommendation: ${escapeHtml(aiAnalysis.recommendation.topChoice)}</h3>
      <p>${escapeHtml(aiAnalysis.recommendation.reasoning)}</p>
      <div class="best-for">
        <div class="best-for-item"><div class="best-for-label">Best for Investors</div><div class="best-for-value">${escapeHtml(aiAnalysis.recommendation.bestFor.investors)}</div></div>
        <div class="best-for-item"><div class="best-for-label">Best for Families</div><div class="best-for-value">${escapeHtml(aiAnalysis.recommendation.bestFor.families)}</div></div>
        <div class="best-for-item"><div class="best-for-label">Best for First-Time Buyers</div><div class="best-for-value">${escapeHtml(aiAnalysis.recommendation.bestFor.firstTimeBuyers)}</div></div>
        <div class="best-for-item"><div class="best-for-label">Best for Luxury Buyers</div><div class="best-for-value">${escapeHtml(aiAnalysis.recommendation.bestFor.luxuryBuyers)}</div></div>
      </div>
      <p style="margin-top:20px; background:rgba(0,0,0,0.2); padding:15px; border-radius:8px;">
        <strong>💡 Investment Advice:</strong> ${escapeHtml(aiAnalysis.recommendation.investmentAdvice)}
      </p>
    </div>

    ${aiAnalysis.recommendation.riskFactors?.length ? `
    <div class="risk-section">
      <h4>⚠️ Risk Factors to Consider</h4>
      <ul>${aiAnalysis.recommendation.riskFactors.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>JBJ Global Real Estate</strong> — Real Estate Brokerage</p>
      <p>📧 Contact@JBJ.ae | 📞 +971 56 591 1000</p>
      <p>🌐 www.JBJ.ae</p>
      <p style="margin-top:15px; font-size:12px;">Powered & Made by JBJ Global Real Estate — Real Estate Brokerage</p>
      <p style="margin-top:10px; font-size:11px; font-style:italic;">
        This report is for informational purposes only and is not legal, mortgage, financial, or investment advice.
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
      if (!user?.id) {
        toast.error("Please sign in to request a consultation.");
        navigate("/auth");
        return;
      }

      const { error } = await supabase.from("evaluation_requests").insert({
        user_id: user.id,
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
      <section className="min-h-screen bg-gradient-to-br from-[#F5EBD7]/10 via-zinc-950 to-zinc-950">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/3 rounded-full blur-3xl pointer-events-none" />
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          {/* Back link */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors mb-12"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Previous Page</span>
          </button>

          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-8">
              <BarChart3 className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium">AI-Powered Comparison</span>
            </div>

            {/* Welcome Title */}
            <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#E8DCC8]">
                Property Comparison
              </span>
            </h1>
            
            <p className="text-zinc-300 text-lg md:text-xl mb-4 max-w-2xl mx-auto">
              Thank you for exploring our exclusive AI-powered property comparison tool.
              Get detailed insights, ROI projections, and expert recommendations.
            </p>
            <FounderContent>
              <div className="text-center mb-12">
                <p className="text-zinc-300 text-sm font-medium">Jane Bou Jaoude</p>
                <p className="text-gold text-xs mt-0.5">Founder & CEO</p>
                <p className="text-zinc-500 text-xs mt-0.5">JBJ Global Real Estate</p>
              </div>
            </FounderContent>

            {/* Steps Guide */}
            <div className="bg-zinc-900/80 backdrop-blur-sm border border-gold/20 rounded-3xl p-8 md:p-10 mb-10">
              <h2 className="text-white text-2xl font-semibold mb-8 flex items-center justify-center gap-3">
                <Sparkles className="w-6 h-6 text-gold" />
                How to Compare Properties
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { icon: Building, title: "Browse Properties", desc: "Explore our curated collection of premium off-plan properties across Dubai and UAE.", step: 1 },
                  { icon: Heart, title: "Add to Shortlist", desc: "Click the shortlist button on any property to save 2-5 projects for comparison.", step: 2 },
                  { icon: Layers, title: "Generate Comparison", desc: "Return here and let our AI analyze all projects with detailed insights and recommendations.", step: 3 },
                ].map((item) => (
                  <div key={item.step} className="relative group">
                    <div className="bg-gradient-to-br from-gold/5 to-zinc-900 border border-gold/20 rounded-2xl p-6 h-full transition-all duration-300 group-hover:border-gold/40 group-hover:shadow-lg group-hover:shadow-gold/10">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center mb-4 mx-auto shadow-lg shadow-gold/20">
                        <item.icon className="w-7 h-7 text-gold" />
                      </div>
                      <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-gradient-to-br from-gold to-[#E8DCC8] flex items-center justify-center text-black font-bold text-sm shadow-lg">
                        {item.step}
                      </div>
                      <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                      <p className="text-zinc-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              {[
                { icon: BarChart3, label: "Side-by-Side", sub: "Analysis" },
                { icon: TrendingUp, label: "ROI", sub: "Projections" },
                { icon: Star, label: "Smart", sub: "Ratings" },
                { icon: Award, label: "Expert", sub: "Recommendations" },
              ].map((f) => (
                <div key={f.label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                  <f.icon className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-white text-sm font-medium">{f.label}</p>
                  <p className="text-zinc-500 text-xs">{f.sub}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link to="/properties">
              <button 
                className="relative inline-flex items-center justify-center gap-2 px-10 py-6 text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                  boxShadow: '0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.9)',
                }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                <span className="relative flex items-center gap-2">
                  <Building className="w-5 h-5 text-gold" />
                  <span className="text-gold">Browse</span>
                  <span className="text-black">Properties</span>
                  <ArrowUpRight className="w-5 h-5 text-black" />
                </span>
              </button>
            </Link>
            
            <p className="text-zinc-500 text-sm mt-6">
              Need help? Our team is available 24/7 to assist you.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-zinc-950">
      {/* Hero Section - Champagne/Gold Theme */}
      <div className="relative py-16 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-zinc-950 to-zinc-950" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold/3 rounded-full blur-2xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Previous Page</span>
          </button>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-6">
              <BarChart3 className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium">AI-Powered</span>
            </div>
            
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-[#E8DCC8]">Property Comparison</span>
            </h1>
            <p className="text-zinc-300 text-lg md:text-xl mb-4 max-w-2xl">
              Compare projects dynamically with AI-powered analysis including valuation, ROI, and market insights.
            </p>
            <FounderContent>
              <div className="mt-2">
                <p className="text-zinc-300 text-sm font-medium">Jane Bou Jaoude</p>
                <p className="text-gold text-xs mt-0.5">Founder & CEO</p>
                <p className="text-zinc-500 text-xs mt-0.5">JBJ Global Real Estate</p>
              </div>
            </FounderContent>

            {/* Feature Cards - Champagne Theme */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              {[
                { icon: BarChart3, title: "Compare 2-5 Projects", sub: "Side-by-side analysis" },
                { icon: TrendingUp, title: "ROI Projections", sub: "Investment returns" },
                { icon: Award, title: "Smart Ratings", sub: "Location, value & more" },
              ].map((f) => (
                <div key={f.title} className="flex items-center gap-3 bg-gold/5 backdrop-blur-sm border border-gold/20 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <p className="text-white font-medium">{f.title}</p>
                    <p className="text-gold/50 text-sm">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4 mt-8">
              <button
                onClick={generateSmartAnalysis}
                disabled={isGenerating || projects.length < 2}
                className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 50%, #F5F0E6 100%)',
                  border: '2px solid rgba(200,167,102,0.5)',
                  boxShadow: '0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.9)',
                }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                <span className="relative flex items-center justify-center gap-2">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 text-gold animate-spin" />
                      <span className="text-black">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-gold" />
                      <span className="text-gold">Start</span>
                      <span className="text-black">Comparing</span>
                    </>
                  )}
                </span>
              </button>
              {aiAnalysis && (
                <>
                  <button
                    onClick={downloadComprehensiveReport}
                    className="relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-gold/50 text-gold hover:bg-gold/10 group"
                  >
                    <Download className="w-5 h-5" />
                    Download Report
                  </button>
                  <button
                    onClick={() => {
                      const shareText = `Property Comparison Report - JBJ Global Real Estate\n\n${projects.map(p => p.name).join(' vs ')}\n\nView at: ${window.location.href}`;
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-green-600 hover:bg-green-500 text-white group"
                  >
                    <Send className="w-5 h-5" />
                    Share via WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent(`Property Comparison - ${projects.map(p => p.name).join(' vs ')}`);
                      const body = encodeURIComponent(`Hi,\n\nPlease find the property comparison analysis:\n\n${projects.map(p => `• ${p.name} - ${p.developer?.name || ''} - ${p.location || ''}`).join('\n')}\n\nPrepared by JBJ Global Real Estate\nwww.JBJ.ae | +971 56 591 1000\n\nView comparison: ${window.location.href}`);
                      window.location.href = `mailto:?subject=${subject}&body=${body}`;
                    }}
                    className="relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-zinc-800 hover:bg-zinc-700 text-white group"
                  >
                    <Mail className="w-5 h-5" />
                    Share via Email
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        {/* Champagne/gold border wrapper */}
        <div className="rounded-2xl border-2 border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.08)] p-6 bg-zinc-950/60 backdrop-blur-sm flex flex-col gap-8">
          {/* Properties Count */}
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="text-lg font-medium text-white">{projects.length}</span>
            <span>properties in comparison</span>
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
                      const badge = getBadge(project.id);
                      return (
                        <th
                          key={project.id}
                          className="text-left py-4 px-4 border-b border-zinc-800 min-w-[250px]"
                        >
                          <div className="flex flex-col gap-2">
                            {badge && (
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold w-fit ${
                                badge === 'top1' ? 'bg-yellow-500/20 text-yellow-400' :
                                badge === 'top2' ? 'bg-orange-600/20 text-orange-400' :
                                'bg-gray-400/20 text-gray-300'
                              }`}>
                                {badge === 'top1' ? '🥇 Top 1' : badge === 'top2' ? '🥉 Top 2' : '🥈 Top 3'}
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
                  { label: "Location", format: (_: any, p: any) => p.location || p.emirate || "Dubai" },
                  { label: "Community", format: (_: any, p: any) => p.community?.name || p.location || "N/A" },
                  { label: "Emirate", format: (_: any, p: any) => p.emirate || "Dubai" },
                  { label: "Price From", format: (_: any, p: any) => p.price_from ? `AED ${(p.price_from / 1000000).toFixed(2)}M` : "Price on request" },
                  { label: "Price To", format: (_: any, p: any) => p.price_to ? `AED ${(p.price_to / 1000000).toFixed(2)}M` : "Price on request" },
                  { label: "Bedrooms", format: (_: any, p: any) => {
                    const min = p.bedrooms_min;
                    const max = p.bedrooms_max;
                    if (min != null && max != null && (min !== max)) return `${min} – ${max} BR`;
                    if (min != null) return `${min} BR`;
                    if (max != null) return `${max} BR`;
                    return "Studio / Various";
                  }},
                  { label: "Size Range", format: (_: any, p: any) => {
                    const min = p.size_min;
                    const max = p.size_max;
                    if (min && max) return `${min.toLocaleString()} – ${max.toLocaleString()} sqft`;
                    if (min) return `From ${min.toLocaleString()} sqft`;
                    return "Size on request";
                  }},
                  { label: "Price/sqft", format: (_: any, p: any) => {
                    if (p.size_min && p.price_from) return `AED ${Math.round(p.price_from / p.size_min).toLocaleString()}`;
                    if (p.price_per_sqft) return `AED ${p.price_per_sqft.toLocaleString()}`;
                    return "N/A";
                  }},
                  { label: "Handover", format: (_: any, p: any) => p.handover_date || "Ready / TBD" },
                  { label: "Payment Plan", format: (_: any, p: any) => p.payment_plan || "Contact for details" },
                  { label: "Furnished", format: (_: any, p: any) => p.furnished_status || "Unfurnished" },
                  { label: "Views", format: (_: any, p: any) => {
                    const views = p.views;
                    if (Array.isArray(views) && views.length > 0) return views.join(", ");
                    return "Contact for details";
                  }},
                  { label: "Key Amenities", format: (_: any, p: any) => {
                    const amenities = p.amenities;
                    if (Array.isArray(amenities) && amenities.length > 0) return amenities.slice(0, 5).join(", ");
                    return "See project page";
                  }},
                ].map((row) => (
                  <tr key={row.label} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-4 px-4 text-zinc-400 sticky left-0 bg-zinc-900 font-medium">
                      {row.label}
                    </td>
                    {projects.map((project) => (
                      <td key={project.id} className="py-4 px-4 text-white text-sm">
                        {row.format(null, project)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Analysis Section */}
          {aiAnalysis ? (
            <div className="space-y-8">
              {/* Summary */}
              <div className="bg-gradient-to-br from-gold/10 to-zinc-900 rounded-2xl border border-gold/20 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-[#E8DCC8] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">Executive Summary</h3>
                    <p className="text-gold text-sm">AI-Generated Analysis</p>
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

              {/* Recommendation - Champagne Theme */}
              <div className="bg-gradient-to-r from-gold/10 to-[#E8DCC8]/10 rounded-2xl border border-gold/30 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 text-gold" />
                  <div>
                    <h3 className="text-white font-bold text-xl">Our Recommendation</h3>
                    <p className="text-gold text-lg">{aiAnalysis.recommendation.topChoice}</p>
                  </div>
                </div>
                <p className="text-zinc-300 mb-6">{aiAnalysis.recommendation.reasoning}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { icon: TrendingUp, label: "For Investors", value: aiAnalysis.recommendation.bestFor.investors },
                    { icon: Home, label: "For Families", value: aiAnalysis.recommendation.bestFor.families },
                    { icon: Users, label: "First-Time Buyers", value: aiAnalysis.recommendation.bestFor.firstTimeBuyers },
                    { icon: Crown, label: "Luxury Buyers", value: aiAnalysis.recommendation.bestFor.luxuryBuyers },
                  ].map((item) => (
                    <div key={item.label} className="bg-gold/5 border border-gold/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gold text-sm mb-2">
                        <item.icon className="w-4 h-4" /> {item.label}
                      </div>
                      <p className="text-white text-sm">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-gold/5 rounded-lg p-4 border border-gold/20">
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
            <div className="bg-gradient-to-br from-gold/5 to-zinc-900 rounded-2xl border border-gold/20 p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-[#E8DCC8] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-white text-2xl font-bold mb-2">AI Analysis Ready</h3>
              <p className="text-zinc-400 max-w-md mx-auto mb-6">
                Click <strong className="text-gold">Start Comparing</strong> above to generate a detailed AI comparison with ratings, investment advice, and recommendations.
              </p>
              <Button
                onClick={generateSmartAnalysis}
                disabled={isGenerating || projects.length < 2}
                size="lg"
                className="bg-gradient-to-r from-gold to-[#E8DCC8] text-black hover:from-gold/90 hover:to-[#E8DCC8]/90 font-semibold"
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

          {/* Contact Advisor Section - Champagne Theme */}
          <div className="bg-gold/5 rounded-2xl border border-gold/20 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-[#E8DCC8] flex items-center justify-center">
                <Users className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Need Expert Guidance?</h3>
                <p className="text-gold/60 text-sm">Speak with our property consultants</p>
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
                    className="flex-1 bg-gradient-to-r from-gold to-[#E8DCC8] text-black font-semibold hover:from-gold/90 hover:to-[#E8DCC8]/90"
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
                    className="border-gold/50 text-gold hover:bg-gold/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  onClick={() => setShowRequestForm(true)}
                  className="bg-gradient-to-r from-gold to-[#E8DCC8] text-black font-semibold hover:from-gold/90 hover:to-[#E8DCC8]/90"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Request Consultation
                </Button>
                <a href="tel:+971565911000" className="w-full">
                  <Button
                    className="w-full bg-zinc-800 border-2 border-gold/40 text-white font-semibold hover:bg-zinc-700"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Now
                  </Button>
                </a>
                <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button
                    className="w-full bg-zinc-800 border-2 border-gold/40 text-white font-semibold hover:bg-zinc-700"
                  >
                    <BadgeCheck className="w-4 h-4 mr-2" />
                    Inquiry Form
                  </Button>
                </a>
              </div>
            )}
          </div>

          {/* AI Property Analyzer Integration */}
          <div className="border-t border-gold/20 pt-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gold/10 border border-gold/30">
                <Brain className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Deep Area Analysis</h2>
                <p className="text-zinc-400 text-sm">Analyze specific areas with government data sources</p>
              </div>
            </div>
            <AIPropertyAnalyzer />
          </div>

          {/* AI Tool Disclaimer */}
          <LegalDisclaimer variant="ai-tools" className="mt-2" />

        </div>{/* end border wrapper */}

        {/* Footer Branding */}
        <div className="text-center text-zinc-600 text-sm py-6">
          Powered & Made by <span className="text-gold">JBJ Global Real Estate</span> — Real Estate Brokerage
        </div>
        <LegalDisclaimer variant="compact" className="pb-4" />
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
      
      {/* Active Lead Banner for CRM linking */}
      <ActiveLeadBanner showAddToShortlist={false} />
    </section>
  );
};

export default Compare;
