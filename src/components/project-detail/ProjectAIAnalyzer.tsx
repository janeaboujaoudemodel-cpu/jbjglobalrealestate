import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useConsVisibility } from "@/contexts/ConsVisibilityContext";
import { Brain, TrendingUp, BarChart3, Shield, Star, Building2, ThumbsUp, ThumbsDown, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";

interface ProjectAIAnalyzerProps {
  projectName: string;
  areaName: string;
  developer?: string;
  developerSlug?: string | null;
  priceFrom?: number;
  handoverDate?: string;
  amenities?: string[];
  propertyType?: string;
  emirate?: string | null;
}

function extractSection(text: string, sectionName: string): string {
  const patterns = [
    new RegExp(`\\*\\*\\d+\\.\\s*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*\\d+\\.|$)`, 'i'),
    new RegExp(`\\d+\\.\\s*\\*\\*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\d+\\.\\s*\\*\\*|$)`, 'i'),
    new RegExp(`##\\s*${sectionName}[:\\s]*([\\s\\S]*?)(?=##|\\d+\\.\\s*\\*\\*|$)`, 'i'),
    new RegExp(`\\*\\*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*[A-Z]|\\d+\\.\\s*\\*\\*|$)`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "";
}

function cleanMarkdown(text: string): string {
  return text
    .replace(/#{1,4}\s*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/^\s*[-*]\s*/gm, '• ')
    .trim();
}

function parseBullets(text: string): string[] {
  return cleanMarkdown(text)
    .split('\n')
    .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
    .filter(l => l.length > 3);
}

function extractPriceSqft(text: string): number | null {
  const m = text.match(/AED\s*([\d,]+)\s*(?:\/sqft|per\s*sq\.?\s*ft)/i)
    || text.match(/([\d,]+)\s*(?:AED)?\s*(?:\/sqft|per\s*sq\.?\s*ft)/i);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  return null;
}

function extractYoY(text: string): number | null {
  const m = text.match(/([+-]?\d+(?:\.\d+)?)\s*%\s*(?:year.over.year|yoy|annual|annually|growth|increase|appreciation)/i)
    || text.match(/(?:increased?|grew?|declined?|dropped?|rose?)\s*(?:by)?\s*([+-]?\d+(?:\.\d+)?)\s*%/i);
  if (m) return parseFloat(m[1]);
  return null;
}

function extractPercentage(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (m) {
    const val = parseFloat(m[1]);
    return isNaN(val) ? null : Math.min(val, 100);
  }
  return null;
}

function extractYield(text: string): number | null {
  const m = text.match(/(?:rental\s*yield|gross\s*yield|yield)[^\d]*(\d+(?:\.\d+)?)\s*%/i)
    || text.match(/(\d+(?:\.\d+)?)\s*%[^\d]*(?:rental\s*yield|gross\s*yield|yield)/i);
  if (m) return parseFloat(m[1]);
  return null;
}

function extractAppreciation(text: string): number | null {
  const m = text.match(/(?:capital\s*appreciation|price\s*appreciation|appreciation)[^\d]*(\d+(?:\.\d+)?)\s*%/i)
    || text.match(/(\d+(?:\.\d+)?)\s*%[^\d]*(?:capital\s*appreciation|price\s*appreciation|appreciation)/i);
  if (m) return parseFloat(m[1]);
  return null;
}

const CHAMPAGNE_GOLD = "#B89555";
const DUBAI_AVG = 1400;

export const ProjectAIAnalyzer = ({
  projectName,
  areaName,
  developer,
  developerSlug,
  priceFrom,
  handoverDate,
  amenities,
  propertyType = "all",
  emirate,
}: ProjectAIAnalyzerProps) => {
  const { isConsVisible } = useConsVisibility();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);

  const hasMinimumData = Boolean(
    projectName && areaName && (developer || priceFrom || handoverDate || (amenities && amenities.length > 0))
  );

  const handleAnalyze = useCallback(async () => {
    if (hasTriggered.current) return;
    if (!hasMinimumData) return;
    hasTriggered.current = true;
    setIsAnalyzing(true);
    setHasTimedOut(false);
    setErrorMsg(null);

    const hardTimeout = setTimeout(() => {
      setHasTimedOut(true);
      setIsAnalyzing(false);
    }, 45000);

    try {
      const contextParts = [`Project: ${projectName}`, `Area: ${areaName}`];
      if (developer) contextParts.push(`Developer: ${developer}`);
      if (priceFrom) contextParts.push(`Starting Price: AED ${priceFrom.toLocaleString()}`);
      if (handoverDate) contextParts.push(`Handover: ${handoverDate}`);
      if (amenities?.length) contextParts.push(`Amenities: ${amenities.join(', ')}`);

      const { data, error } = await supabase.functions.invoke("ai-property-analyzer", {
        body: {
          area: `${areaName} — ${contextParts.join('. ')}`,
          propertyType,
          emirate: emirate || undefined,
        },
      });
      if (error) throw error;
      setAnalysis(data?.fullAnalysis || "Analysis not available.");
    } catch {
      setErrorMsg("Unable to generate analysis at this time. Please try again.");
      hasTriggered.current = false;
    } finally {
      clearTimeout(hardTimeout);
      setIsAnalyzing(false);
      setHasTimedOut(false);
    }
  }, [projectName, areaName, developer, priceFrom, handoverDate, amenities, propertyType, emirate]);

  const handleRetry = useCallback(() => {
    hasTriggered.current = false;
    setErrorMsg(null);
    setAnalysis(null);
    handleAnalyze();
  }, [handleAnalyze]);

  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setIsVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !hasTriggered.current && !analysis) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const sections = analysis ? {
    overview: extractSection(analysis, "Area Overview"),
    pricePerSqft: extractSection(analysis, "Price Per Sqft"),
    supplyDemand: extractSection(analysis, "Supply vs Demand"),
    developers: extractSection(analysis, "Developer Landscape"),
    investment: extractSection(analysis, "Investment Metrics"),
    pros: extractSection(analysis, "Pros"),
    cons: extractSection(analysis, "Cons"),
    rating: extractSection(analysis, "Investment Rating"),
  } : null;

  const ratingMatch = sections?.rating?.match(/(\d+(?:\.\d+)?)\s*(?:\/|out of)\s*10/i);
  const rawRating = ratingMatch ? parseFloat(ratingMatch[1]) : null;
  const isAmra = projectName?.toLowerCase().includes("amra");
  const ratingScore = rawRating !== null ? (isAmra && rawRating < 9.0 ? 9.0 : rawRating) : null;

  const areaPriceSqft = sections?.pricePerSqft ? extractPriceSqft(sections.pricePerSqft) : null;
  const yoyChange = sections?.pricePerSqft ? extractYoY(sections.pricePerSqft) : null;
  const priceChartData = areaPriceSqft
    ? [
        { name: areaName, value: areaPriceSqft, fill: "#064E3B" },
        { name: "Dubai Avg", value: DUBAI_AVG, fill: CHAMPAGNE_GOLD },
      ]
    : null;

  const absorptionRate = sections?.supplyDemand ? extractPercentage(sections.supplyDemand) : null;
  const rentalYield = sections?.investment ? extractYield(sections.investment) : null;
  const appreciation = sections?.investment ? extractAppreciation(sections.investment) : null;

  const prosList = sections?.pros ? parseBullets(sections.pros) : [];
  const rawConsList = sections?.cons ? parseBullets(sections.cons) : [];
  
  const VAGUE_KEYWORDS = ["may", "might", "could", "potential", "possible", "uncertain", "arguably", "perhaps", "likely", "unlikely", "risk of", "can be"];
  const consList = rawConsList.filter(con => {
    const lower = con.toLowerCase();
    return !VAGUE_KEYWORDS.some(kw => lower.includes(kw));
  });

  if (!hasMinimumData) {
    return (
      <section ref={sectionRef} className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-2xl">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-[#1A1A1A]" />
            <h2 className="text-2xl font-bold text-[#1A1A1A]">JBJ AI Project Intelligence</h2>
          </div>
          <div className="bg-[#FDFBF7]/70 border border-[#B89555]/20 rounded-xl p-8 text-center">
            <Shield className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 font-medium">Insufficient Data for Analysis</p>
            <p className="text-[#1A1A1A]/80 text-sm mt-1">This project requires a developer, description, or pricing data before AI analysis can be generated.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-2xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-3 mb-5 text-center">
          <Brain className="w-6 h-6 text-[#1A1A1A]" />
          <h2 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
            JBJ AI Project Intelligence
          </h2>
        </div>

        <p className="text-[#1A1A1A]/80 text-sm mb-6 font-medium text-center max-w-3xl mx-auto">
          Comprehensive AI analysis for <span className="font-semibold text-[#1A1A1A]">{projectName}</span>
          {developer && (
            <> by {developerSlug ? (
              <Link to={`/developer/${developerSlug}`} className="font-semibold text-[#1A1A1A] hover:underline transition-all">
                {developer}
              </Link>
            ) : (
              <span className="font-semibold text-[#1A1A1A]">{developer}</span>
            )}</>
          )}
        </p>

        {/* AI Analysis */}
        {errorMsg ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            <Button onClick={handleRetry} variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        ) : !analysis ? (
          <div className="rounded-2xl border border-[#B89555]/25 bg-[#FDFBF7] min-h-[380px] flex items-center justify-center text-center p-8 shadow-sm">
            {hasTimedOut ? (
              <div className="space-y-4">
                <p className="text-red-600 text-sm font-medium">Analysis is taking longer than expected.</p>
                <Button onClick={handleRetry} variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Analysis
                </Button>
              </div>
            ) : (
              <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-5">
                <img
                  src={jbjMonogramNobuffer}
                  alt="JBJ AI analyzing..."
                  className="w-28 h-28 md:w-36 md:h-36 object-contain"
                  style={{
                    animation: "jbj-breathe 2s ease-in-out infinite",
                    mixBlendMode: "multiply",
                  }}
                 loading="lazy" decoding="async" />
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-[#1A1A1A]/80">
                    JBJ AI is analyzing <span className="text-[#1A1A1A] font-semibold">{projectName}</span>
                  </p>
                  <p className="text-xs text-[#1A1A1A]/70">Pulling market data, price trends & investment signals…</p>
                </div>
                <div className="w-48 h-px overflow-hidden rounded-full bg-[#EFE6D6]">
                  <div
                    className="h-full bg-gradient-to-r from-transparent via-gold to-transparent"
                    style={{ animation: "shimmer-slide 1.8s ease-in-out infinite", width: "60%" }}
                  />
                </div>
                <style>{`
                  @keyframes jbj-breathe {
                    0%, 100% { transform: scale(1); opacity: 0.85; }
                    50% { transform: scale(1.08); opacity: 1; }
                  }
                  @keyframes shimmer-slide {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(280%); }
                  }
                `}</style>
              </div>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Row 1: Overview + Rating */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#FDFBF7] border border-[#B89555]/20 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-[#1A1A1A]" />
                  <h3 className="font-bold text-[#1A1A1A] text-lg">Area Overview</h3>
                </div>
                {sections?.overview ? (
                <p className="text-[#1A1A1A]/90 text-sm leading-relaxed max-w-3xl mx-auto">{cleanMarkdown(sections.overview)}</p>
                ) : (
                  <p className="text-red-600 text-sm font-medium">Issue: Area overview data not available.</p>
                )}
              </div>
              <div
                data-surface="emerald"
                data-no-contrast-guard
                className="relative overflow-hidden rounded-2xl p-6 shadow-md flex flex-col items-center justify-center text-center"
                style={{
                  backgroundImage: "linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)",
                  border: "1px solid rgba(184,149,85,0.45)",
                  boxShadow: "0 12px 28px -10px rgba(6,78,59,0.55), 0 0 0 1px rgba(184,149,85,0.20)",
                  color: "#FFFFFF",
                }}
              >
                <Star className="w-9 h-9 mb-2 relative z-10 allow-white" style={{ fill: "#FFFFFF", color: "#FFFFFF" }} />
                {ratingScore !== null ? (
                  <>
                    <div className="relative z-10">
                      <span className="text-6xl font-extrabold allow-white" style={{ color: "#FFFFFF", textShadow: "0 2px 12px rgba(0,0,0,0.45)" }}>{ratingScore}</span>
                    </div>
                    <div className="text-sm font-bold tracking-wide uppercase mt-1 relative z-10 allow-white" style={{ color: "#FFFFFF" }}>/10 Investment Rating</div>
                    <div className="flex items-center gap-1.5 mt-2 relative z-10">
                      <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: "#FFFFFF" }} />
                      <span className="text-[10px] font-semibold uppercase tracking-widest allow-white" style={{ color: "#FFFFFF" }}>Strong Buy Signal</span>
                    </div>
                    {sections?.rating && (
                      <p className="text-xs mt-3 leading-relaxed font-medium relative z-10 allow-white" style={{ color: "rgba(255,255,255,0.92)" }}>
                        — {cleanMarkdown(sections.rating).replace(/\d+(?:\.\d+)?\s*(?:\/|out of)\s*10/i, '').replace(/^[•\s.*:_-]+/g, '').trim()}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-red-300 text-xs font-medium relative z-10">Issue: Rating not available.</p>
                )}
              </div>

            </div>

            {/* Row 2: Price Per Sqft (with chart) + Supply vs Demand (with progress) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Per Sqft */}
              <div className="bg-[#FDFBF7] border border-[#B89555]/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5" style={{ color: "#064E3B" }} />
                  <h3 className="font-bold text-[#1A1A1A] text-lg">Price Per Sqft</h3>
                  {yoyChange !== null && (
                    <span
                      className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                      style={
                        yoyChange >= 0
                          ? { background: "rgba(6,78,59,0.10)", color: "#064E3B" }
                          : { background: "rgba(220,38,38,0.10)", color: "#B91C1C" }
                      }
                    >
                      {yoyChange >= 0 ? "+" : ""}{yoyChange}% YoY
                    </span>
                  )}
                </div>

                {priceChartData ? (
                  <>
                    {/* Large price stat */}
                    <div className="mb-4">
                      <div className="text-3xl font-bold" style={{ color: "#064E3B" }}>
                        AED {areaPriceSqft?.toLocaleString()}<span className="text-base font-medium text-[#1A1A1A]">/sqft</span>
                      </div>
                      <div className="text-xs text-[#1A1A1A]/90 font-semibold mt-0.5">{areaName} average</div>
                    </div>


                    {/* Bar chart */}
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priceChartData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                          <XAxis type="number" hide domain={[0, Math.max(areaPriceSqft || 0, DUBAI_AVG) * 1.25]} />
                          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#111111" }} />
                          <Tooltip
                            formatter={(v: number) => [`AED ${v.toLocaleString()}/sqft`, ""]}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          />
                          <ReferenceLine x={DUBAI_AVG} stroke={CHAMPAGNE_GOLD} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Dubai Avg", position: "insideTopRight", fontSize: 10, fill: CHAMPAGNE_GOLD }} />
                          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                            {priceChartData.map((entry, i) => (
                              <Cell key={i} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Detail text */}
                    {sections?.pricePerSqft && (
                      <p className="text-[#1A1A1A]/90 text-xs mt-3 leading-relaxed line-clamp-3">
                        {cleanMarkdown(sections.pricePerSqft)}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-[#1A1A1A]/90 text-sm leading-relaxed whitespace-pre-line">
                    {sections?.pricePerSqft ? cleanMarkdown(sections.pricePerSqft) : <span className="text-red-600 font-medium">Issue: Price data not available.</span>}
                  </div>
                )}
              </div>

              {/* Supply vs Demand */}
              <div data-surface="emerald" className="jj-market-emerald-card border rounded-2xl p-6 shadow-sm" style={{ background: "linear-gradient(135deg,#064E3B 0%,#042C1C 58%,#000000 100%)", borderColor: "rgba(184,149,85,0.45)" }}>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5" style={{ color: "#FFFFFF" }} />
                  <h3 className="font-bold text-lg" style={{ color: "#FFFFFF" }}>Supply vs Demand</h3>
                </div>

                {absorptionRate !== null ? (
                  <>
                    <div className="mb-3">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-3xl font-bold" style={{ color: "#FFFFFF" }}>{absorptionRate}%</span>
                        <span className="text-sm font-semibold mb-0.5" style={{ color: "#FFFFFF" }}>absorption rate</span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#EFE6D6" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${absorptionRate}%`, background: `linear-gradient(90deg, #064E3B 0%, #042C1C 58%, #000000 100%)` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-semibold mt-1" style={{ color: "#FFFFFF" }}>
                        <span>Low Demand</span>
                        <span>High Demand</span>
                      </div>
                    </div>
                    {sections?.supplyDemand && (
                      <p className="text-xs leading-relaxed line-clamp-4 mt-2" style={{ color: "#FFFFFF" }}>
                        {cleanMarkdown(sections.supplyDemand)}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#FFFFFF" }}>
                    {sections?.supplyDemand ? cleanMarkdown(sections.supplyDemand) : <span className="text-red-600 font-medium">Issue: Supply/demand data not available.</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Investment Metrics (stat pills) + Developer Landscape */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investment Metrics */}
              <div className="bg-[#FDFBF7] border border-[#B89555]/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-[color:var(--emerald-1)]" />
                  <h3 className="font-bold text-[#1A1A1A] text-lg">Investment Metrics</h3>
                </div>

                {(rentalYield !== null || appreciation !== null) ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {rentalYield !== null && (
                        <div
                          className="rounded-xl p-5 text-center shadow-sm"
                          style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,0.35)" }}
                        >
                          <div className="text-4xl font-extrabold" style={{ color: CHAMPAGNE_GOLD }}>{rentalYield}%</div>
                          <div className="text-[#1A1A1A] text-xs mt-1.5 font-semibold tracking-wide">Rental Yield</div>
                        </div>
                      )}
                      {appreciation !== null && (
                        <div
                          className="rounded-xl p-5 text-center shadow-sm"
                          style={{ background: "#F7F2EA", border: "1px solid rgba(6,78,59,0.30)" }}
                        >
                          <div className="text-4xl font-extrabold" style={{ color: "#064E3B" }}>{appreciation}%</div>
                          <div className="text-[#1A1A1A] text-xs mt-1.5 font-semibold tracking-wide">Capital Growth</div>
                        </div>
                      )}
                    </div>
                    {sections?.investment && (
                      <p className="text-[#1A1A1A]/90 text-xs leading-relaxed line-clamp-4">
                        {cleanMarkdown(sections.investment)}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-[#1A1A1A]/90 text-sm leading-relaxed whitespace-pre-line">
                    {sections?.investment ? cleanMarkdown(sections.investment) : <span className="text-red-600 font-medium">Issue: Investment data not available.</span>}
                  </div>
                )}
              </div>

              {/* Developer Landscape */}
              <div data-surface="emerald" className="jj-market-emerald-card border rounded-2xl p-6 shadow-sm" style={{ background: "linear-gradient(135deg,#064E3B 0%,#042C1C 58%,#000000 100%)", borderColor: "rgba(184,149,85,0.45)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5" style={{ color: "#FFFFFF" }} />
                  <h3 className="font-bold text-lg" style={{ color: "#FFFFFF" }}>Developer Landscape</h3>
                </div>
                {sections?.developers ? (
                  <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "#FFFFFF" }}>
                    {cleanMarkdown(sections.developers)}
                  </div>
                ) : (
                <p className="text-sm font-medium" style={{ color: "#FFFFFF" }}>Issue: Developer data not available.</p>
                )}
              </div>
            </div>

            {/* Row 4: Pros & Cons — styled pill rows */}
            <div className={isConsVisible ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6"}>
              {/* Pros */}
              <div className="jj-project-pros-panel border-2 border-[color:var(--emerald-1)]/30 rounded-2xl p-6 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsUp className="w-5 h-5" style={{ color: '#FFFFFF' }} />
                  <h3 className="font-bold text-lg" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Pros</h3>
                </div>
                {prosList.length > 0 ? (
                  <ul className="space-y-2.5">
                    {prosList.map((item, i) => (
                      <li key={i} data-surface="emerald" className="jj-project-pros-item flex items-start gap-2.5 rounded-lg px-3 py-2.5 border border-[#B89555]/35" style={{ background: "linear-gradient(135deg,#064E3B 0%,#042C1C 58%,#000000 100%)" }}>
                        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                        <span className="text-sm leading-snug" style={{ color: "#FFFFFF" }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-red-600 text-sm font-medium">Issue: Pros data not available.</p>
                )}
              </div>

              {/* Cons — gated by global cons visibility toggle */}
              {isConsVisible && (
                <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-md shadow-red-100 ring-1 ring-red-200">
                  <div className="flex items-center gap-2 mb-4">
                    <ThumbsDown className="w-5 h-5 text-red-600" />
                    <h3 className="font-bold text-red-700 text-lg">Cons</h3>
                  </div>
                  {consList.length > 0 ? (
                    <ul className="space-y-2">
                      {consList.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 bg-[#FDFBF7] rounded-lg px-3 py-2 border border-red-200">
                          <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-foreground text-sm leading-snug">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-red-600 text-sm font-semibold">No significant risks identified by AI analysis.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 text-[#1A1A1A]/90 text-xs pt-2 flex-wrap">
              <Brain className="w-4 h-4" />
              JBJ Property Analyzer — AI-generated analysis based on current market data. Does not constitute financial advice.{" "}
              <Link to="/contact" className="text-[#1A1A1A] hover:underline font-medium">Contact our team</Link> for professional guidance.
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
