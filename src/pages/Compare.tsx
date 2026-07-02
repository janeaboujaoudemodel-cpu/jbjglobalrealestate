import { useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import UnitCompareShell from "@/components/compare/units/UnitCompareShell";
import CompareModeToggle from "@/components/compare/CompareModeToggle";
import CompareAccessGate from "@/components/compare/units/CompareAccessGate";
import { useCompareAccess } from "@/hooks/useCompareAccess";
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
  ArrowLeft, ArrowUpRight, Heart, ListChecks, Layers, Brain, ThumbsUp, ThumbsDown
} from "lucide-react";
import AIPropertyAnalyzer from "@/components/ai-tools/AIPropertyAnalyzer";
import { Button } from "@/components/ui/button";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PaymentModal } from "@/components/PaymentModal";
import { Badge } from "@/components/ui/badge";
// Founder block removed — replaced by "Powered by JBJ Global Real Estate" lockup

import ActiveLeadBanner from "@/components/crm/ActiveLeadBanner";
import { useActiveLead } from "@/contexts/ActiveLeadContext";
import { useConsVisibility } from "@/contexts/ConsVisibilityContext";
import { ToolAnimatedFrame } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";
import AddProjectDialog, { type ExtractedProject } from "@/components/compare/AddProjectDialog";
import CompareAIShell, { GradientText } from "@/components/compare/CompareAIShell";
import AnimatedStepLine from "@/components/compare/AnimatedStepLine";
import SampleComparisonPreview from "@/components/compare/SampleComparisonPreview";
import CompareCTA from "@/components/compare/CompareCTA";
import MarketContextStrip from "@/components/compare/MarketContextStrip";
import RiskScoreGauge from "@/components/compare/RiskScoreGauge";

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
  // --- Compare mode router (Projects vs Units) ---------------------------
  // Hooks must run unconditionally on every render. We do all routing-level
  // hooks here, then delegate to a child component for each mode so each
  // child can declare its own full set of hooks without violating Rules of Hooks.
  const [searchParams, setSearchParams] = useSearchParams();
  const compareMode: "projects" | "units" =
    searchParams.get("mode") === "units" ? "units" : "projects";
  const setCompareMode = (m: "projects" | "units") => {
    const next = new URLSearchParams(searchParams);
    if (m === "units") next.set("mode", "units");
    else next.delete("mode");
    setSearchParams(next, { replace: true });
  };
  const access = useCompareAccess();

  if (access.isLoading) return null;
  if (!access.allowed) return <CompareAccessGate />;

  if (compareMode === "units") {
    return <UnitCompareShell onModeChange={setCompareMode} />;
  }
  return <ProjectsCompare onModeChange={setCompareMode} />;
};

interface ProjectsCompareProps {
  onModeChange: (m: "projects" | "units") => void;
}

const ProjectsCompare = ({ onModeChange }: ProjectsCompareProps) => {
  const { user } = useAuth();

  const { isConsVisible } = useConsVisibility();
  const navigate = useNavigate();
  const { activeLead } = useActiveLead();
  const { hasActiveMembership } = useMembership();
  const { data: authShortlist } = useShortlist();
  const { shortlist: guestShortlist } = useGuestShortlist();
  const { getBadge } = useShortlistBadges();
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiAddOpen, setAiAddOpen] = useState(false);

  const handleExtractedToManual = (e: ExtractedProject) => {
    setAiAddOpen(false);
    navigate("/compare-manual", { state: { prefill: e } });
  };
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
          developer:developers(name, slug, logo_url),
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
    .rating-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 15px; }
    .rating-item { text-align: center; background: #252525; padding: 10px; border-radius: 8px; }
    .rating-item-label { font-size: 11px; color: #888; }
    .rating-item-value { color: #A8925A; margin-top: 5px; }
    .score-bar-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .score-bar-label { font-size: 11px; color: #888; width: 90px; text-align: right; flex-shrink: 0; }
    .score-bar-track { flex: 1; height: 6px; background: #333; border-radius: 4px; overflow: hidden; }
    .score-bar-fill { height: 100%; border-radius: 4px; }
    .score-bar-value { font-size: 12px; font-weight: 700; width: 24px; text-align: right; }
    .pros-cons { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .pros, .cons { padding: 15px; border-radius: 8px; }
    .pros { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); }
    .cons { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); }
    .pros h4 { color: #22c55e; } .cons h4 { color: #dc2626; }
    .pros li, .cons li { margin: 5px 0; font-size: 14px; color: #ccc; }
    
    .recommendation-box { background: linear-gradient(135deg, #A8925A, #8B7744); border-radius: 12px; padding: 30px; margin: 30px 0; }
    .recommendation-box h3 { color: #000; font-size: 22px; margin-bottom: 10px; }
    .recommendation-box p { color: #222; font-size: 16px; line-height: 1.6; }
    .best-for { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px; }
    .best-for-item { background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; }
    .best-for-label { font-size: 12px; color: #333; font-weight: 600; }
    .best-for-value { color: #000; margin-top: 5px; }
    
    .risk-section { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 12px; padding: 20px; margin: 30px 0; }
    .risk-section h4 { color: #dc2626; margin-bottom: 15px; }
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

    <h2>Property Details Comparison</h2>
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

    <h2>Ratings & Analysis</h2>
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
        <div class="rating-item"><div class="rating-item-label">Construction</div><div class="rating-item-value">${renderStars(Math.round((r.developerRating + r.valueRating) / 2))}</div></div>
        <div class="rating-item"><div class="rating-item-label">Handover</div><div class="rating-item-value">${renderStars(Math.round((r.investmentRating + r.locationRating) / 2))}</div></div>
        <div class="rating-item"><div class="rating-item-label">Payment Plan</div><div class="rating-item-value">${renderStars(Math.round((r.valueRating + r.investmentRating) / 2))}</div></div>
      </div>
      ${[
        { label: 'Location', score: Math.min(10, r.locationRating * 2) },
        { label: 'Value', score: Math.min(10, r.valueRating * 2) },
        { label: 'Amenities', score: Math.min(10, r.amenitiesRating * 2) },
        { label: 'Investment', score: Math.min(10, r.investmentRating * 2) },
        { label: 'Developer', score: Math.min(10, r.developerRating * 2) },
        { label: 'Construction', score: Math.min(10, Math.round((r.developerRating + r.valueRating) / 2) * 2) },
        { label: 'Handover', score: Math.min(10, Math.round((r.investmentRating + r.locationRating) / 2) * 2) },
        { label: 'Payment Plan', score: Math.min(10, Math.round((r.valueRating + r.investmentRating) / 2) * 2) },
      ].map(b => {
        const color = b.score >= 8 ? '#22C55E' : b.score >= 6 ? '#F59E0B' : '#DC2626';
        return `<div class="score-bar-row"><span class="score-bar-label">${b.label}</span><div class="score-bar-track"><div class="score-bar-fill" style="width:${(b.score/10)*100}%;background:${color}"></div></div><span class="score-bar-value" style="color:${color}">${b.score}</span></div>`;
      }).join('')}
      <div class="pros-cons" style="${isConsVisible ? '' : 'grid-template-columns: 1fr;'}">
        <div class="pros"><h4>Pros</h4><ul>${r.pros?.map(p => `<li>${escapeHtml(p)}</li>`).join('') || ''}</ul></div>
        ${isConsVisible ? `<div class="cons"><h4>Cons</h4><ul>${r.cons?.map(c => `<li>${escapeHtml(c)}</li>`).join('') || ''}</ul></div>` : ''}
      </div>
    </div>
    `).join('')}

    <div class="recommendation-box">
      <h3>Our Recommendation: ${escapeHtml(aiAnalysis.recommendation.topChoice)}</h3>
      <p>${escapeHtml(aiAnalysis.recommendation.reasoning)}</p>
      <div class="best-for">
        <div class="best-for-item"><div class="best-for-label">Best for Investors</div><div class="best-for-value">${escapeHtml(aiAnalysis.recommendation.bestFor.investors)}</div></div>
        <div class="best-for-item"><div class="best-for-label">Best for Families</div><div class="best-for-value">${escapeHtml(aiAnalysis.recommendation.bestFor.families)}</div></div>
        <div class="best-for-item"><div class="best-for-label">Best for First-Time Buyers</div><div class="best-for-value">${escapeHtml(aiAnalysis.recommendation.bestFor.firstTimeBuyers)}</div></div>
        <div class="best-for-item"><div class="best-for-label">Best for Luxury Buyers</div><div class="best-for-value">${escapeHtml(aiAnalysis.recommendation.bestFor.luxuryBuyers)}</div></div>
      </div>
      <p style="margin-top:20px; background:rgba(0,0,0,0.2); padding:15px; border-radius:8px;">
        <strong>Investment Advice:</strong> ${escapeHtml(aiAnalysis.recommendation.investmentAdvice)}
      </p>
    </div>

    ${aiAnalysis.recommendation.riskFactors?.length ? `
    <div class="risk-section">
      <h4>Risk Factors to Consider</h4>
      <ul>${aiAnalysis.recommendation.riskFactors.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>JBJ Global Real Estate</strong> — Real Estate Brokerage</p>
      <p>Contact@JBJ.ae | +971 54 716 7107</p>
      <p>www.JBJ.ae</p>
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
      <span className="text-[#1A1A1A]">
        {"★".repeat(rating)}
        <span className="text-[#1A1A1A]/70">{"☆".repeat(5 - rating)}</span>
      </span>
    );
  };

  // Convert 5-star to 10-point score
  const toScore = (rating: number) => Math.min(10, rating * 2);

  const renderScoreBar = (rating: number, label: string) => {
    const score = toScore(rating);
    const pct = (score / 10) * 100;
    const color = score >= 8 ? '#22C55E' : score >= 6 ? '#F59E0B' : '#DC2626';
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/90 w-20 shrink-0 text-right">{label}</span>
        <div className="flex-1 h-1.5 bg-[#F7F2EA] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
        <span className="text-xs font-bold w-6 text-right" style={{ color }}>{score.toFixed(0)}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <section className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/70 animate-spin" />
      </section>
    );
  }

  if (!projects?.length) {
    return (
      <CompareAIShell>
        <div className="container mx-auto px-4 py-12 md:py-16">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 transition-colors mb-10"
            style={{ color: "rgba(26,26,26,0.7)" }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="max-w-5xl mx-auto">
            <div className="flex justify-center mb-6">
              <CompareModeToggle mode="projects" onChange={onModeChange} />
            </div>

            {/* Eyebrow — champagne + gold */}
            <div className="flex justify-center mb-6">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: "#F7F2EA",
                  border: "1px solid rgba(184,149,85,0.55)",
                }}
              >
                <Brain className="w-4 h-4" style={{ color: "#B89555" }} />
                <span
                  className="text-[11px] uppercase tracking-[0.2em] font-semibold"
                  style={{ color: "#1A1A1A" }}
                >
                  AI Property Intelligence
                </span>
              </div>
            </div>

            {/* Headline */}
            <h1
              className="text-center text-4xl md:text-6xl font-bold leading-[1.05] mb-5"
              style={{ color: "#1A1A1A" }}
            >
              Compare. <GradientText>Decide.</GradientText> Win.
            </h1>
            <p
              className="text-center text-lg max-w-2xl mx-auto mb-12"
              style={{ color: "rgba(26,26,26,0.7)" }}
            >
              Drop in any 2–5 Dubai projects. Our AI engine ranks them by yield,
              risk, developer tier and market context — and tells you which one to buy.
            </p>

            {/* Step line */}
            <div className="mb-12">
              <AnimatedStepLine />
            </div>

            {/* Live sample preview */}
            <div className="mb-10">
              <SampleComparisonPreview />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
              <Link to="/properties">
                <CompareCTA variant="gradient" icon={<Building className="w-4 h-4" />}>
                  Browse properties
                </CompareCTA>
              </Link>
              <CompareCTA
                variant="glass"
                onClick={() => setAiAddOpen(true)}
                icon={<Sparkles className="w-4 h-4" style={{ color: "#B89555" }} />}
              >
                Add via link / PDF (AI fill)
              </CompareCTA>
              <Link to="/compare-manual">
                <CompareCTA variant="outline">Compare manually</CompareCTA>
              </Link>
            </div>

            <p
              className="text-sm text-center"
              style={{ color: "rgba(26,26,26,0.6)" }}
            >
              Need help? Our team is available 24/7.
            </p>
          </div>
        </div>
        <AddProjectDialog open={aiAddOpen} onOpenChange={setAiAddOpen} onAdd={handleExtractedToManual} />
      </CompareAIShell>
    );
  }

  // ============================================================
  //  PROPERTY COMPARISON — JBJ BRAND LOCK (matches home ToolkitShowcaseCard)
  //  Hero band: balanced dark emerald + white ink. Body: gold wrapper + emerald cards.
  //  Primary CTA: emerald metallic + white. Secondary: dark emerald glass.
  //  Zero gold-gradient buttons. Zero white ink on champagne.
  // ============================================================
  const EMERALD_INK = "linear-gradient(135deg, #032820 0%, #021611 54%, #000000 100%)";
  const EMERALD_CARD = "linear-gradient(135deg, #043527 0%, #021F18 52%, #000000 100%)";
  const CHAMPAGNE = "#F7F2EA";
  const GOLD_HAIRLINE = "1px solid rgba(6,78,59,0.24)";

  return (
    <section data-compare-page data-surface="emerald" data-on-dark="true" className="min-h-screen" style={{ background: EMERALD_INK }}>
      {/* =============== HERO — EMERALD OMBRÉ =============== */}
      <div
        data-ink-emerald
        data-no-contrast-guard
        className="relative overflow-hidden"
        style={{ backgroundImage: EMERALD_INK, backgroundColor: "#021611" }}
      >
        <div className="container mx-auto px-4 py-14 md:py-16 relative z-10">
          <button
            onClick={() => navigate(-1)}
            data-no-contrast-guard
            className="allow-white inline-flex items-center gap-2 mb-8 text-sm font-medium"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            <ArrowLeft className="w-5 h-5" style={{ color: "#FFFFFF" }} />
            <span className="allow-white" style={{ color: "#FFFFFF" }}>Back to Previous Page</span>
          </button>

          <div className="max-w-3xl">
            {/* Eyebrow pill — white on white/10 */}
            <div
              data-no-contrast-guard
                data-compare-ai-label
              className="allow-white inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
                style={{ background: EMERALD_CARD, border: "1px solid rgba(255,255,255,0.30)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }}
            >
              <BarChart3 className="w-3.5 h-3.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              <span className="allow-white text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: "#FFFFFF" }}>
                AI-Powered
              </span>
            </div>

            <h1
              data-no-contrast-guard
              className="allow-white text-4xl md:text-5xl font-bold tracking-tight mb-4"
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              Property Comparison
            </h1>
            <p
              data-no-contrast-guard
              className="allow-white text-base md:text-lg leading-relaxed max-w-2xl"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              Compare projects dynamically with AI-powered analysis including valuation, ROI, and market insights.
            </p>

            <div className="flex items-center gap-3 mt-5">
              <div className="h-px w-12" style={{ background: "rgba(255,255,255,0.55)" }} />
              <span className="allow-white text-[10px] uppercase tracking-[0.22em] font-semibold" style={{ color: "rgba(255,255,255,0.75)" }}>
                Powered by
              </span>
              <span className="allow-white text-xs font-bold tracking-[0.14em]" style={{ color: "#FFFFFF" }}>
                JBJ GLOBAL REAL ESTATE
              </span>
            </div>

            {/* Mode toggle */}
            <div className="mt-8">
              <CompareModeToggle mode="projects" onChange={onModeChange} />
            </div>

            {/* Feature tiles — white ink on white/8 over emerald */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
              {[
                { icon: BarChart3, title: "Compare 2–5 Projects", sub: "Side-by-side analysis" },
                { icon: TrendingUp, title: "ROI Projections", sub: "Investment returns" },
                { icon: Award, title: "Smart Ratings", sub: "Location, value & more" },
              ].map((f) => (
                <div
                  key={f.title}
                  data-no-contrast-guard
                  className="allow-white flex items-center gap-3 rounded-xl p-4"
                    style={{ background: EMERALD_CARD, border: "1px solid rgba(255,255,255,0.22)" }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.28)" }}
                  >
                    <f.icon className="w-5 h-5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="allow-white font-semibold text-sm leading-tight" style={{ color: "#FFFFFF" }}>{f.title}</p>
                    <p className="allow-white text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.78)" }}>{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA row — primary emerald metallic (white ink), secondary champagne (black ink) */}
            <div className="flex flex-wrap gap-3 mt-8">
              <button
                onClick={generateSmartAnalysis}
                disabled={isGenerating || projects.length < 2}
                data-no-contrast-guard
                data-allow-dark-cta
                data-compare-hero-cta="start"
                className="allow-white jj-pill-emerald-metallic inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundImage: EMERALD_CARD,
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.35)",
                  boxShadow: "0 10px 28px rgba(4,120,87,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
                }}
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin allow-white" style={{ color: "#FFFFFF" }} /><span className="allow-white" style={{ color: "#FFFFFF" }}>Analyzing…</span></>
                ) : (
                  <><Sparkles className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} /><span className="allow-white" style={{ color: "#FFFFFF" }}>Start Comparing</span></>
                )}
              </button>

              <button
                onClick={() => setAiAddOpen(true)}
                data-no-contrast-guard
                data-allow-dark-cta
                data-compare-hero-cta="ai-add"
                className="allow-white inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl"
                style={{ backgroundImage: EMERALD_INK, color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 10px 28px rgba(4,120,87,0.32)" }}
              >
                <Sparkles className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Add via link / PDF (AI fill)</span>
              </button>

              <Link to="/compare-manual">
                <button
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.35)" }}
                  data-no-contrast-guard
                >
                  <span className="allow-white" style={{ color: "#FFFFFF" }}>Compare manually</span>
                </button>
              </Link>

              {aiAnalysis && (
                <>
                  <button
                    onClick={downloadComprehensiveReport}
                    data-no-contrast-guard
                    data-allow-dark-cta
                    className="allow-white inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl"
                    style={{ backgroundImage: EMERALD_INK, color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.35)" }}
                  >
                    <Download className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    <span className="allow-white" style={{ color: "#FFFFFF" }}>Download Report</span>
                  </button>
                  <button
                    onClick={() => {
                      import("@/utils/exportXlsx").then(({ exportPremiumXlsx }) => {
                        const rows = (aiAnalysis.projectDetailsTable || []).map((row: any) => ({
                          project: row.projectName, developer: row.developer, location: row.location,
                          price_range: row.priceRange, price_per_sqft: row.pricePerSqft,
                          bedrooms: row.bedrooms, size_range: row.sizeRange, handover: row.handover,
                          payment_plan: row.paymentPlan, views: (row.views || []).join(", "),
                          amenities: (row.keyAmenities || []).join(", "),
                          usps: (row.uniqueSellingPoints || []).join(", "),
                          investment_type: row.investmentType, target_buyer: row.targetBuyer,
                        }));
                        exportPremiumXlsx(rows, {
                          filename: "JBJ-Property-Comparison", sheetName: "Comparison",
                          title: "JBJ GLOBAL REAL ESTATE", subtitle: "AI Property Comparison",
                        });
                      });
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl"
                    style={{ background: CHAMPAGNE, color: "#1A1A1A", border: GOLD_HAIRLINE }}
                  >
                    <Download className="w-4 h-4" style={{ color: "#064E3B" }} />
                    Download Excel
                  </button>
                  <button
                    onClick={() => {
                      const projectSummary = projects.map(p => `- ${p.name} | ${p.developer?.name || 'N/A'} | ${p.location || 'Dubai'} | ${p.price_from ? `AED ${(p.price_from/1000000).toFixed(1)}M` : 'Price on request'}`).join('\n');
                      const shareText = `JBJ GLOBAL REAL ESTATE\nAI Property Comparison Report\n\n${projectSummary}\n\nPrepared by JBJ Global Real Estate\n+971 54 716 7107 | www.JBJ.ae\n\nView: ${window.location.href}`;
                      window.location.href = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl"
                    style={{ background: CHAMPAGNE, color: "#1A1A1A", border: GOLD_HAIRLINE }}
                  >
                    <Send className="w-4 h-4" style={{ color: "#064E3B" }} />
                    Share via WhatsApp
                  </button>
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent(`JBJ Global Real Estate — Property Comparison: ${projects.map(p => p.name).join(' vs ')}`);
                      const projectLines = projects.map(p => `• ${p.name} — ${p.developer?.name || ''} — ${p.location || 'Dubai'} — ${p.price_from ? `AED ${(p.price_from/1000000).toFixed(1)}M` : 'Price on request'}`).join('\n');
                      const body = encodeURIComponent(`Dear Investor,\n\nPlease find the AI-powered property comparison analysis:\n\n${projectLines}\n\nFor full details and AI recommendations, view the comparison:\n${window.location.href}\n\nBest regards,\nJBJ Global Real Estate\n+971 54 716 7107\nContact@JBJ.ae | www.JBJ.ae`);
                      window.location.href = `mailto:?subject=${subject}&body=${body}`;
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold rounded-xl"
                    style={{ background: CHAMPAGNE, color: "#1A1A1A", border: GOLD_HAIRLINE }}
                  >
                    <Mail className="w-4 h-4" style={{ color: "#064E3B" }} />
                    Share via Email
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =============== BODY — GOLD WRAPPER + EMERALD CARDS =============== */}
      <div className="container mx-auto px-4 py-10 md:py-14">
        <div
          data-compare-content-frame
          data-surface="emerald"
          data-on-dark="true"
          className="rounded-2xl p-5 md:p-7 flex flex-col gap-8"
          style={{ background: "linear-gradient(135deg, rgba(184,149,85,0.18) 0%, rgba(184,149,85,0.10) 54%, rgba(184,149,85,0.06) 100%)", border: "1px solid rgba(184,149,85,0.48)", boxShadow: "0 24px 60px -30px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.10)" }}
        >
          {/* Counter */}
          <div className="flex items-center gap-2" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
            <span className="text-lg font-bold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{projects.length}</span>
            <span className="text-sm" style={{ color: "rgba(255,255,255,0.88)", WebkitTextFillColor: "rgba(255,255,255,0.88)" }}>properties in comparison</span>
          </div>

          {/* Comparison Table */}
          <div
            ref={tableRef}
            data-compare-project-table
            className="overflow-x-auto rounded-2xl"
            style={{ background: EMERALD_CARD, border: "1px solid rgba(255,255,255,0.22)" }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.06)" }}>
                  <th
                    className="text-left py-4 px-4 font-semibold text-sm sticky left-0 z-10"
                    style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", background: "#031F18", borderBottom: "1px solid rgba(255,255,255,0.18)" }}
                  >
                    Feature
                  </th>
                  {projects.map((project) => {
                    const badge = getBadge(project.id);
                    const isFav = shortlistIds.includes(project.id);
                    return (
                      <th
                        key={project.id}
                        className="text-left py-4 px-4"
                        style={{ width: `${100 / (projects.length + 1)}%`, minWidth: '220px', borderBottom: "1px solid rgba(255,255,255,0.18)" }}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between gap-2">
                            {badge && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide"
                                style={{ background: "#064E3B", color: "#FFFFFF" }}
                              >
                                {badge === 'top1' ? 'Top 1' : badge === 'top2' ? 'Top 2' : 'Top 3'}
                              </span>
                            )}
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                              style={{
                                background: "rgba(255,255,255,0.10)",
                                color: "#FFFFFF",
                                WebkitTextFillColor: "#FFFFFF",
                                border: "1px solid rgba(255,255,255,0.24)",
                              }}
                            >
                              <Heart className="w-2.5 h-2.5" fill={isFav ? "currentColor" : "none"} />
                              {isFav ? 'In Favorites' : 'Not Saved'}
                            </span>
                          </div>
                          <div className="aspect-[16/9] h-40 overflow-hidden rounded-lg">
                            <img
                              src={project.images?.[0]?.image_url || "/placeholder.svg"}
                              alt={project.name}
                              className="w-full h-full object-cover"
                              loading="lazy" decoding="async"
                            />
                          </div>
                          <h3 className="font-bold text-base" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>{project.name}</h3>
                          <p data-developer-name className="text-sm font-medium whitespace-normal break-words [overflow-wrap:anywhere] leading-snug" style={{ color: "rgba(255,255,255,0.82)", WebkitTextFillColor: "rgba(255,255,255,0.82)" }}>
                            {project.developer?.name}
                          </p>
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
                    const min = p.bedrooms_min; const max = p.bedrooms_max;
                    if (min != null && max != null && (min !== max)) return `${min} – ${max} BR`;
                    if (min != null) return `${min} BR`;
                    if (max != null) return `${max} BR`;
                    return "Studio / Various";
                  }},
                  { label: "Size Range", format: (_: any, p: any) => {
                    const min = p.size_min; const max = p.size_max;
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
                ].map((row, idx) => (
                  <tr key={row.label} style={{ background: idx % 2 === 0 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
                    <td className="py-3.5 px-4 text-sm font-semibold sticky left-0" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", background: idx % 2 === 0 ? "#053D2F" : "#032820" }}>
                      {row.label}
                    </td>
                    {projects.map((project) => (
                      <td key={project.id} className="py-3.5 px-4 text-sm" style={{ color: "rgba(255,255,255,0.90)", WebkitTextFillColor: "rgba(255,255,255,0.90)" }}>
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
            <div className="space-y-8" data-surface="emerald" data-on-dark="true">
              {/* Summary — emerald ombré card */}
              <div
                data-ink-emerald
                data-no-contrast-guard
                className="allow-white rounded-2xl p-6"
                  style={{ backgroundImage: EMERALD_CARD, backgroundColor: "#031F18", border: "1px solid rgba(255,255,255,0.22)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.14)", border: "1px solid rgba(255,255,255,0.28)" }}>
                    <Sparkles className="w-5 h-5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  </div>
                  <div>
                    <h3 className="allow-white font-bold text-lg" style={{ color: "#FFFFFF" }}>Executive Summary</h3>
                    <p className="allow-white text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>AI-Generated Analysis</p>
                  </div>
                </div>
                <p className="allow-white leading-relaxed text-sm md:text-base" style={{ color: "rgba(255,255,255,0.92)" }}>{aiAnalysis.summary}</p>
              </div>

              {Array.isArray((aiAnalysis as any).marketContext) && (aiAnalysis as any).marketContext.length > 0 && (
                <MarketContextStrip data={(aiAnalysis as any).marketContext} />
              )}
              {Array.isArray((aiAnalysis as any).riskScores) && (aiAnalysis as any).riskScores.length > 0 && (
                <RiskScoreGauge data={(aiAnalysis as any).riskScores} />
              )}

              {/* Negotiation Leverage */}
              {Array.isArray((aiAnalysis as any).negotiationLeverage) && (aiAnalysis as any).negotiationLeverage.length > 0 && (
                <div>
                  <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                    <Zap className="w-5 h-5" style={{ color: "#064E3B" }} />
                    Negotiation Leverage
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(aiAnalysis as any).negotiationLeverage.map((n: any, i: number) => (
                      <div key={i} className="rounded-2xl p-5" style={{ background: "#FDFBF7", border: GOLD_HAIRLINE }}>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold" style={{ color: "#1A1A1A" }}>{n.projectName}</h4>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText((n.talkingPoints || []).map((t: string, idx: number) => `${idx + 1}. ${t}`).join("\n"));
                              toast.success("Talking points copied");
                            }}
                            className="text-xs px-3 py-1.5 rounded-md font-semibold"
                            style={{ background: "#064E3B", color: "#FFFFFF" }}
                            data-no-contrast-guard data-allow-dark-cta
                          >
                            <span className="allow-white" style={{ color: "#FFFFFF" }}>Copy</span>
                          </button>
                        </div>
                        <ul className="space-y-2">
                          {(n.talkingPoints || []).map((t: string, ti: number) => (
                            <li key={ti} className="text-sm leading-relaxed flex gap-2" style={{ color: "#1A1A1A" }}>
                              <span className="font-bold" style={{ color: "#064E3B" }}>{ti + 1}.</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ratings */}
              <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                  <Star className="w-5 h-5" style={{ color: "#064E3B" }} />
                  Property Ratings
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiAnalysis.ratings.map((rating, index) => (
                    <div key={index} className="rounded-xl p-5" style={{ background: "#FDFBF7", border: GOLD_HAIRLINE }}>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold" style={{ color: "#1A1A1A" }}>{rating.projectName}</h4>
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold" style={{ color: "#064E3B" }}>{toScore(rating.overallRating)}</span>
                          <span className="text-xs" style={{ color: "#1A1A1A", opacity: 0.65 }}>/10</span>
                        </div>
                      </div>
                      <div className="text-sm mb-3" style={{ color: "#B89555" }}>
                        {"★".repeat(rating.overallRating)}<span style={{ color: "rgba(26,26,26,0.25)" }}>{"☆".repeat(5 - rating.overallRating)}</span>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        {[
                          { r: rating.locationRating, l: "Location" },
                          { r: rating.valueRating, l: "Value" },
                          { r: rating.amenitiesRating, l: "Amenities" },
                          { r: rating.investmentRating, l: "Investment" },
                          { r: rating.developerRating, l: "Developer" },
                        ].map(({ r, l }) => {
                          const score = toScore(r);
                          const pct = (score / 10) * 100;
                          const color = score >= 8 ? '#22C55E' : score >= 6 ? '#F59E0B' : '#DC2626';
                          return (
                            <div key={l} className="flex items-center gap-2">
                              <span className="text-[10px] w-20 shrink-0 text-right" style={{ color: "#1A1A1A", opacity: 0.7 }}>{l}</span>
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(184,149,85,0.18)" }}>
                                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                              </div>
                              <span className="text-xs font-bold w-6 text-right" style={{ color }}>{score.toFixed(0)}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className={isConsVisible ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 gap-3"}>
                        <div className="rounded-lg p-3" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.28)" }}>
                          <div className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: "#16A34A" }}>
                            <ThumbsUp className="w-3 h-3" /> Pros
                          </div>
                          <ul className="text-xs space-y-1" style={{ color: "#1A1A1A" }}>
                            {rating.pros?.slice(0, 3).map((pro, i) => (<li key={i}>• {pro}</li>))}
                          </ul>
                        </div>
                        {isConsVisible && (
                          <div className="rounded-lg p-3" style={{ background: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.28)" }}>
                            <div className="text-xs font-bold mb-2 flex items-center gap-1" style={{ color: "#DC2626" }}>
                              <ThumbsDown className="w-3 h-3" /> Cons
                            </div>
                            <ul className="text-xs space-y-1" style={{ color: "#1A1A1A" }}>
                              {rating.cons?.slice(0, 3).map((con, i) => (<li key={i}>• {con}</li>))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation — emerald ombré */}
              <div
                data-ink-emerald
                data-no-contrast-guard
                className="allow-white rounded-2xl p-6"
                style={{ backgroundImage: EMERALD_INK, backgroundColor: "#064E3B", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Award className="w-8 h-8 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  <div>
                    <h3 className="allow-white font-bold text-xl" style={{ color: "#FFFFFF" }}>Our Recommendation</h3>
                    <p className="allow-white text-base" style={{ color: "rgba(255,255,255,0.9)" }}>{aiAnalysis.recommendation.topChoice}</p>
                  </div>
                </div>
                <p className="allow-white mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.88)" }}>{aiAnalysis.recommendation.reasoning}</p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { icon: TrendingUp, label: "For Investors", value: aiAnalysis.recommendation.bestFor.investors },
                    { icon: Home, label: "For Families", value: aiAnalysis.recommendation.bestFor.families },
                    { icon: Users, label: "First-Time Buyers", value: aiAnalysis.recommendation.bestFor.firstTimeBuyers },
                    { icon: Crown, label: "Luxury Buyers", value: aiAnalysis.recommendation.bestFor.luxuryBuyers },
                  ].map((item) => (
                    <div key={item.label} className="allow-white rounded-lg p-3" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.22)" }}>
                      <div className="allow-white flex items-center gap-1.5 text-xs font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.85)" }}>
                        <item.icon className="w-3.5 h-3.5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} /> {item.label}
                      </div>
                      <p className="allow-white text-sm" style={{ color: "#FFFFFF" }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="allow-white rounded-lg p-4" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.22)" }}>
                  <div className="allow-white flex items-center gap-2 mb-2" style={{ color: "#FFFFFF" }}>
                    <Zap className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    <span className="allow-white font-semibold text-sm" style={{ color: "#FFFFFF" }}>Investment Advice</span>
                  </div>
                  <p className="allow-white text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.9)" }}>{aiAnalysis.recommendation.investmentAdvice}</p>
                </div>

                {aiAnalysis.recommendation.riskFactors?.length > 0 && (
                  <div className="mt-4 rounded-lg p-4" style={{ background: "rgba(220,38,38,0.18)", border: "1px solid rgba(220,38,38,0.35)" }}>
                    <div className="allow-white flex items-center gap-2 mb-2" style={{ color: "#FCA5A5" }}>
                      <AlertTriangle className="w-4 h-4" style={{ color: "#FCA5A5" }} />
                      <span className="font-semibold text-sm">Risk Factors to Consider</span>
                    </div>
                    <ul className="allow-white text-sm space-y-1" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {aiAnalysis.recommendation.riskFactors.map((risk, i) => (<li key={i}>• {risk}</li>))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : isGenerating ? (
            <div data-compare-ai-ready-card data-surface="emerald" data-on-dark="true" className="rounded-2xl p-10 text-center" style={{ background: EMERALD_CARD, border: "1px solid rgba(255,255,255,0.22)" }}>
              <div className="relative w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <Sparkles className="w-10 h-10 animate-pulse" style={{ color: "#FFFFFF" }} />
                <div className="absolute inset-0 rounded-full animate-ping" style={{ border: "2px solid rgba(4,78,59,0.4)" }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Analyzing Property Intelligence…</h3>
              <p className="max-w-md mx-auto mb-6 text-sm" style={{ color: "rgba(255,255,255,0.82)", WebkitTextFillColor: "rgba(255,255,255,0.82)" }}>
                Our AI is comparing locations, pricing, ROI potential, developer track records, and generating investment recommendations.
              </p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.70)", WebkitTextFillColor: "rgba(255,255,255,0.70)" }}>This may take 15-30 seconds</p>
            </div>
          ) : (
            <div data-compare-ai-ready-card data-surface="emerald" data-on-dark="true" className="rounded-2xl p-8 text-center" style={{ background: EMERALD_CARD, border: "1px solid rgba(255,255,255,0.22)", boxShadow: "0 22px 52px -30px rgba(0,0,0,0.72)" }}>
              <div data-surface="emerald" data-on-dark="true" data-no-contrast-guard className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <Sparkles className="w-8 h-8 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>AI Analysis Ready</h3>
              <p className="max-w-md mx-auto mb-6 text-sm" style={{ color: "rgba(255,255,255,0.82)", WebkitTextFillColor: "rgba(255,255,255,0.82)" }}>
                Click <strong style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Start Comparing</strong> above to generate a detailed AI comparison with ratings, investment advice, and recommendations.
              </p>
              <button
                onClick={generateSmartAnalysis}
                disabled={projects.length < 2}
                data-no-contrast-guard data-allow-dark-cta
                className="allow-white inline-flex items-center justify-center gap-2 px-7 py-3.5 text-sm font-bold rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundImage: EMERALD_INK, color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.35)", boxShadow: "0 10px 28px rgba(4,120,87,0.35)" }}
              >
                <Sparkles className="w-4 h-4 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                <span className="allow-white" style={{ color: "#FFFFFF" }}>Generate AI Analysis</span>
                {!hasActiveMembership && !hasUsedFreeCompare && (
                  <span className="allow-white ml-1 px-2 py-0.5 rounded text-[10px] font-bold" style={{ background: "rgba(255,255,255,0.18)", color: "#FFFFFF" }}>FREE</span>
                )}
              </button>
              {projects.length < 2 && (
                <p className="text-sm mt-4" style={{ color: "rgba(255,255,255,0.70)", WebkitTextFillColor: "rgba(255,255,255,0.70)" }}>Add at least 2 properties to enable AI comparison</p>
              )}
            </div>
          )}

          {/* Contact Advisor */}
          <div data-compare-expert-card data-surface="emerald" data-on-dark="true" className="rounded-2xl p-6" style={{ background: EMERALD_CARD, border: "1px solid rgba(255,255,255,0.22)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div data-surface="emerald" data-on-dark="true" data-no-contrast-guard className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <Users className="w-5 h-5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Need Expert Guidance?</h3>
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.78)", WebkitTextFillColor: "rgba(255,255,255,0.78)" }}>Speak with our property consultants</p>
              </div>
            </div>

            {requestSent ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 mx-auto mb-4" style={{ color: "#22C55E" }} />
                <h4 className="text-lg font-bold mb-2" style={{ color: "#1A1A1A" }}>Request Sent!</h4>
                <p className="text-sm" style={{ color: "#1A1A1A", opacity: 0.7 }}>Our advisor will contact you within 24 hours.</p>
              </div>
            ) : showRequestForm ? (
              <div className="space-y-4">
                <Input placeholder="Your Name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  style={{ background: "#FFFFFF", color: "#1A1A1A", border: GOLD_HAIRLINE }} />
                <Input type="email" placeholder="Email Address" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  style={{ background: "#FFFFFF", color: "#1A1A1A", border: GOLD_HAIRLINE }} />
                <Input type="tel" placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  style={{ background: "#FFFFFF", color: "#1A1A1A", border: GOLD_HAIRLINE }} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => submitRequest.mutate()}
                    disabled={!formData.email || submitRequest.isPending}
                    data-no-contrast-guard data-allow-dark-cta
                className="allow-white w-full min-w-0 min-h-12 inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-bold rounded-xl disabled:opacity-60 whitespace-nowrap text-center leading-tight overflow-hidden"
                    style={{ backgroundImage: EMERALD_INK, color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.3)" }}
                  >
                    {submitRequest.isPending ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#FFFFFF" }} /> : (
                      <><Send className="w-4 h-4 shrink-0 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} /><span className="allow-white min-w-0 truncate" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Request Consultation</span></>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRequestForm(false)}
                    className="min-h-12 px-6 py-3 text-sm font-bold rounded-xl"
                    style={{ background: CHAMPAGNE, color: "#1A1A1A", border: GOLD_HAIRLINE }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <button
                  onClick={() => setShowRequestForm(true)}
                  data-no-contrast-guard data-allow-dark-cta
                  className="allow-white w-full min-w-0 min-h-12 inline-flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap text-center leading-tight overflow-hidden"
                  style={{ backgroundImage: EMERALD_INK, color: "#FFFFFF", border: "1px solid rgba(255,255,255,0.3)" }}
                >
                  <Mail className="w-4 h-4 shrink-0 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  <span className="allow-white min-w-0 truncate" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Request Consultation</span>
                </button>
                <a href="tel:+971547167107" className="w-full">
                  <button data-no-contrast-guard data-allow-dark-cta className="allow-white w-full min-w-0 min-h-12 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl whitespace-normal text-center leading-tight"
                    style={{ backgroundImage: EMERALD_INK, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", border: "1px solid rgba(255,255,255,0.30)" }}>
                    <Phone className="w-4 h-4 shrink-0 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    <span className="allow-white min-w-0" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Call Now</span>
                  </button>
                </a>
                <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer" className="w-full">
                  <button data-no-contrast-guard data-allow-dark-cta className="allow-white w-full min-w-0 min-h-12 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold rounded-xl whitespace-normal text-center leading-tight"
                    style={{ backgroundImage: EMERALD_INK, color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", border: "1px solid rgba(255,255,255,0.30)" }}>
                    <BadgeCheck className="w-4 h-4 shrink-0 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                    <span className="allow-white min-w-0" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Inquiry Form</span>
                  </button>
                </a>
              </div>
            )}
          </div>

          {/* Deep Area Analyzer */}
          <div data-compare-deep-area-shell data-surface="emerald" data-on-dark="true" data-no-contrast-guard className="rounded-2xl p-5 md:p-6" style={{ backgroundImage: EMERALD_CARD, backgroundColor: "#031F18", border: "1px solid rgba(255,255,255,0.24)", boxShadow: "0 18px 48px rgba(0,0,0,0.34)" }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.28)" }}>
                <Brain className="w-5 h-5 allow-white" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </div>
              <div>
                <h2 className="allow-white text-2xl font-bold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Deep Area Analysis</h2>
                <p className="allow-white text-sm" style={{ color: "rgba(255,255,255,0.78)" }}>Analyze specific areas with government data sources</p>
              </div>
            </div>
            <AIPropertyAnalyzer />
          </div>

          <LegalDisclaimer variant="ai-tools" className="mt-2" />
        </div>

        <div data-compare-powered-strip data-surface="emerald" data-on-dark="true" className="text-center text-sm py-6 rounded-2xl mt-6" style={{ background: EMERALD_INK, border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.82)", WebkitTextFillColor: "rgba(255,255,255,0.82)" }}>
          Powered &amp; Made by <span className="font-bold" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>JBJ Global Real Estate</span> — Real Estate Brokerage
        </div>
        <LegalDisclaimer variant="compact" className="pb-4" />
      </div>

      <PaymentModal
        open={showVipModal}
        onOpenChange={setShowVipModal}
        onSuccess={() => { setShowVipModal(false); generateSmartAnalysis(); }}
        userInfo={{
          fullName: formData.name || user?.email?.split("@")[0] || "",
          email: formData.email || user?.email || "",
          phone: formData.phone || "",
        }}
        mode="vip"
      />

      <ActiveLeadBanner showAddToShortlist={false} />
      <AddProjectDialog open={aiAddOpen} onOpenChange={setAiAddOpen} onAdd={handleExtractedToManual} />
    </section>
  );
};

export default Compare;
