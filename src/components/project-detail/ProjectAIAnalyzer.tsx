import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
}

function extractSection(text: string, sectionName: string): string {
  const patterns = [
    // Format: **1. Area Overview** (number inside bold — actual AI output)
    new RegExp(`\\*\\*\\d+\\.\\s*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*\\d+\\.|$)`, 'i'),
    // Format: 1. **Area Overview** (number outside bold)
    new RegExp(`\\d+\\.\\s*\\*\\*${sectionName}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\d+\\.\\s*\\*\\*|$)`, 'i'),
    // Format: ## Area Overview
    new RegExp(`##\\s*${sectionName}[:\\s]*([\\s\\S]*?)(?=##|\\d+\\.\\s*\\*\\*|$)`, 'i'),
    // Format: **Area Overview**
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

/** Parse bullet points from cleaned markdown text into an array of strings */
function parseBullets(text: string): string[] {
  return cleanMarkdown(text)
    .split('\n')
    .map(l => l.replace(/^[•\-\*]\s*/, '').trim())
    .filter(l => l.length > 3);
}

/** Extract a price/sqft number from text like "AED 1,250/sqft" or "1250 per sq ft" */
function extractPriceSqft(text: string): number | null {
  const m = text.match(/AED\s*([\d,]+)\s*(?:\/sqft|per\s*sq\.?\s*ft)/i)
    || text.match(/([\d,]+)\s*(?:AED)?\s*(?:\/sqft|per\s*sq\.?\s*ft)/i);
  if (m) return parseFloat(m[1].replace(/,/g, ''));
  return null;
}

/** Extract YoY % change from text like "+12%" or "-5% year-over-year" */
function extractYoY(text: string): number | null {
  const m = text.match(/([+-]?\d+(?:\.\d+)?)\s*%\s*(?:year.over.year|yoy|annual|annually|growth|increase|appreciation)/i)
    || text.match(/(?:increased?|grew?|declined?|dropped?|rose?)\s*(?:by)?\s*([+-]?\d+(?:\.\d+)?)\s*%/i);
  if (m) return parseFloat(m[1]);
  return null;
}

/** Extract a percentage from text like "85% absorption" */
function extractPercentage(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*%/);
  if (m) {
    const val = parseFloat(m[1]);
    return isNaN(val) ? null : Math.min(val, 100);
  }
  return null;
}

/** Extract rental yield % from investment text */
function extractYield(text: string): number | null {
  const m = text.match(/(?:rental\s*yield|gross\s*yield|yield)[^\d]*(\d+(?:\.\d+)?)\s*%/i)
    || text.match(/(\d+(?:\.\d+)?)\s*%[^\d]*(?:rental\s*yield|gross\s*yield|yield)/i);
  if (m) return parseFloat(m[1]);
  return null;
}

/** Extract capital appreciation % from investment text */
function extractAppreciation(text: string): number | null {
  const m = text.match(/(?:capital\s*appreciation|price\s*appreciation|appreciation)[^\d]*(\d+(?:\.\d+)?)\s*%/i)
    || text.match(/(\d+(?:\.\d+)?)\s*%[^\d]*(?:capital\s*appreciation|price\s*appreciation|appreciation)/i);
  if (m) return parseFloat(m[1]);
  return null;
}

const GOLD = "#B8860B";
const GOLD_LIGHT = "#D4AF37";
const DUBAI_AVG = 1400; // AED/sqft reference benchmark

export const ProjectAIAnalyzer = ({
  projectName,
  areaName,
  developer,
  developerSlug,
  priceFrom,
  handoverDate,
  amenities,
  propertyType = "all",
}: ProjectAIAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);

  const handleAnalyze = useCallback(async () => {
    if (hasTriggered.current) return;
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
  }, [projectName, areaName, developer, priceFrom, handoverDate, amenities, propertyType]);

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
  const ratingScore = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  // Derived visuals
  const areaPriceSqft = sections?.pricePerSqft ? extractPriceSqft(sections.pricePerSqft) : null;
  const yoyChange = sections?.pricePerSqft ? extractYoY(sections.pricePerSqft) : null;
  const priceChartData = areaPriceSqft
    ? [
        { name: areaName, value: areaPriceSqft, fill: GOLD_LIGHT },
        { name: "Dubai Avg", value: DUBAI_AVG, fill: "#9CA3AF" },
      ]
    : null;

  const absorptionRate = sections?.supplyDemand ? extractPercentage(sections.supplyDemand) : null;
  const rentalYield = sections?.investment ? extractYield(sections.investment) : null;
  const appreciation = sections?.investment ? extractAppreciation(sections.investment) : null;

  const prosList = sections?.pros ? parseBullets(sections.pros) : [];
  const consList = sections?.cons ? parseBullets(sections.cons) : [];

  return (
    <section ref={sectionRef} className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="w-6 h-6 text-gold" />
          <h2 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
            JBJ AI Project Intelligence
          </h2>
        </div>

        <p className="text-zinc-500 text-sm mb-6">
          Comprehensive AI analysis for <span className="font-semibold text-gold">{projectName}</span>
          {developer && (
            <> by {developerSlug ? (
              <Link to={`/developer/${developerSlug}`} className="font-semibold text-gold hover:underline transition-all">
                {developer}
              </Link>
            ) : (
              <span className="font-semibold text-gold">{developer}</span>
            )}</>
          )}
        </p>

        {/* AI Analysis */}
        {errorMsg ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 text-sm">{errorMsg}</p>
            <Button onClick={handleRetry} variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        ) : !analysis ? (
          <div className="text-center py-8">
            {hasTimedOut ? (
              <div className="space-y-4">
                <p className="text-zinc-500 text-sm">Analysis is taking longer than expected.</p>
                <Button onClick={handleRetry} variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Analysis
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 py-12">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gold/20 blur-xl animate-pulse scale-150" />
                  <img
                    src={jbjMonogramNobuffer}
                    alt="JBJ AI analyzing..."
                    className="relative w-20 h-20 object-contain"
                    style={{
                      animation: "jbj-breathe 2s ease-in-out infinite",
                      filter: "drop-shadow(0 0 16px rgba(184,134,11,0.6))",
                    }}
                  />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium text-zinc-600">
                    JBJ AI is analyzing <span className="text-gold font-semibold">{projectName}</span>
                  </p>
                  <p className="text-xs text-zinc-400">Pulling market data, price trends & investment signals…</p>
                </div>
                <div className="w-48 h-px overflow-hidden rounded-full bg-zinc-200">
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
              <div className="lg:col-span-2 bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-gold" />
                  <h3 className="font-bold text-black text-lg">Area Overview</h3>
                </div>
                {sections?.overview ? (
                  <p className="text-zinc-700 text-sm leading-relaxed">{cleanMarkdown(sections.overview)}</p>
                ) : (
                  <p className="text-zinc-400 text-sm italic">Area overview data not available.</p>
                )}
              </div>
              <div className="bg-black rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
                <Star className="w-8 h-8 text-gold mb-2" />
                {ratingScore !== null ? (
                  <>
                    <div className="text-5xl font-bold text-gold mb-1">{ratingScore}</div>
                    <div className="text-gold/70 text-sm font-medium">/10 Investment Rating</div>
                    {sections?.rating && (
                      <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                        {cleanMarkdown(sections.rating).replace(/\d+(?:\.\d+)?\s*(?:\/|out of)\s*10/i, '').replace(/^[•\s.*:_-]+/g, '').trim()}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-zinc-500 text-xs">Rating not available.</p>
                )}
              </div>
            </div>

            {/* Row 2: Price Per Sqft (with chart) + Supply vs Demand (with progress) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Price Per Sqft */}
              <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-gold" />
                  <h3 className="font-bold text-black text-lg">Price Per Sqft</h3>
                  {yoyChange !== null && (
                    <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${
                      yoyChange >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                    }`}>
                      {yoyChange >= 0 ? "+" : ""}{yoyChange}% YoY
                    </span>
                  )}
                </div>

                {priceChartData ? (
                  <>
                    {/* Large price stat */}
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gold">
                        AED {areaPriceSqft?.toLocaleString()}<span className="text-base font-normal text-zinc-500">/sqft</span>
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">{areaName} average</div>
                    </div>

                    {/* Bar chart */}
                    <div className="h-28 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={priceChartData} layout="vertical" margin={{ left: 0, right: 24, top: 0, bottom: 0 }}>
                          <XAxis type="number" hide domain={[0, Math.max(areaPriceSqft || 0, DUBAI_AVG) * 1.25]} />
                          <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11, fill: "#71717a" }} />
                          <Tooltip
                            formatter={(v: number) => [`AED ${v.toLocaleString()}/sqft`, ""]}
                            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                          />
                          <ReferenceLine x={DUBAI_AVG} stroke={GOLD} strokeDasharray="4 3" strokeWidth={1.5} label={{ value: "Dubai Avg", position: "insideTopRight", fontSize: 10, fill: GOLD }} />
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
                      <p className="text-zinc-500 text-xs mt-3 leading-relaxed line-clamp-3">
                        {cleanMarkdown(sections.pricePerSqft)}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {sections?.pricePerSqft ? cleanMarkdown(sections.pricePerSqft) : <span className="text-zinc-400 italic">Price data not available.</span>}
                  </div>
                )}
              </div>

              {/* Supply vs Demand */}
              <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-gold" />
                  <h3 className="font-bold text-black text-lg">Supply vs Demand</h3>
                </div>

                {absorptionRate !== null ? (
                  <>
                    <div className="mb-3">
                      <div className="flex items-end gap-1 mb-1">
                        <span className="text-3xl font-bold text-gold">{absorptionRate}%</span>
                        <span className="text-sm text-zinc-500 mb-0.5">absorption rate</span>
                      </div>
                      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${absorptionRate}%`, background: `linear-gradient(90deg, #B8860B, #D4AF37)` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-zinc-400 mt-1">
                        <span>Low Demand</span>
                        <span>High Demand</span>
                      </div>
                    </div>
                    {sections?.supplyDemand && (
                      <p className="text-zinc-500 text-xs leading-relaxed line-clamp-4 mt-2">
                        {cleanMarkdown(sections.supplyDemand)}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {sections?.supplyDemand ? cleanMarkdown(sections.supplyDemand) : <span className="text-zinc-400 italic">Supply/demand data not available.</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Investment Metrics (stat pills) + Developer Landscape */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Investment Metrics */}
              <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-gold" />
                  <h3 className="font-bold text-black text-lg">Investment Metrics</h3>
                </div>

                {(rentalYield !== null || appreciation !== null) ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {rentalYield !== null && (
                        <div className="bg-black rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gold">{rentalYield}%</div>
                          <div className="text-gold/60 text-[11px] mt-1 font-medium">Rental Yield</div>
                        </div>
                      )}
                      {appreciation !== null && (
                        <div className="bg-black rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-gold">{appreciation}%</div>
                          <div className="text-gold/60 text-[11px] mt-1 font-medium">Capital Growth</div>
                        </div>
                      )}
                    </div>
                    {sections?.investment && (
                      <p className="text-zinc-500 text-xs leading-relaxed line-clamp-4">
                        {cleanMarkdown(sections.investment)}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {sections?.investment ? cleanMarkdown(sections.investment) : <span className="text-zinc-400 italic">Investment data not available.</span>}
                  </div>
                )}
              </div>

              {/* Developer Landscape */}
              <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-gold" />
                  <h3 className="font-bold text-black text-lg">Developer Landscape</h3>
                </div>
                {sections?.developers ? (
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.developers)}
                  </div>
                ) : (
                  <p className="text-zinc-400 text-sm italic">Developer data not available.</p>
                )}
              </div>
            </div>

            {/* Row 4: Pros & Cons — styled pill rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pros */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsUp className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-emerald-800 text-lg">Pros</h3>
                </div>
                {prosList.length > 0 ? (
                  <ul className="space-y-2">
                    {prosList.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 bg-white/70 rounded-lg px-3 py-2 border border-emerald-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-emerald-900 text-sm leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-400 text-sm italic">Pros data not available.</p>
                )}
              </div>

              {/* Cons */}
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ThumbsDown className="w-5 h-5 text-red-500" />
                  <h3 className="font-bold text-red-800 text-lg">Cons</h3>
                </div>
                {consList.length > 0 ? (
                  <ul className="space-y-2">
                    {consList.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 bg-white/70 rounded-lg px-3 py-2 border border-red-100">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-red-900 text-sm leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-400 text-sm italic">Cons data not available.</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 text-zinc-500 text-xs pt-2 flex-wrap">
              <Brain className="w-4 h-4" />
              JBJ Property Analyzer — AI-generated analysis based on current market data. Does not constitute financial advice.{" "}
              <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
