import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brain, TrendingUp, BarChart3, Shield, Star, Building2, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import jbjMonogramDark from "@/assets/jbj-monogram-dark.png";

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAnalyze = useCallback(async () => {
    hasTriggered.current = true;
    setIsAnalyzing(true);
    setHasTimedOut(false);
    setErrorMsg(null);

    timeoutRef.current = setTimeout(() => {
      setHasTimedOut(true);
    }, 15000);

    try {
      // Build context string for the AI
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
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
    if (isVisible && !hasTriggered.current && !isAnalyzing && !analysis) {
      handleAnalyze();
    }
  }, [isVisible, isAnalyzing, analysis, handleAnalyze]);

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
              <div className="flex flex-col items-center gap-4 py-8">
                <img
                  src={jbjMonogramDark}
                  alt="Analyzing..."
                  className="w-16 h-16 object-contain animate-pulse"
                  style={{ filter: "drop-shadow(0 0 12px rgba(200,167,102,0.5))" }}
                />
                <p className="text-zinc-500 text-sm">JBJ AI is analyzing {projectName}...</p>
                <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-yellow-600 to-transparent animate-pulse" />
              </div>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Row 1: Overview + Rating */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sections?.overview && (
                <div className="lg:col-span-2 bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Area Overview</h3>
                  </div>
                  <p className="text-zinc-700 text-sm leading-relaxed">{cleanMarkdown(sections.overview)}</p>
                </div>
              )}
              {ratingScore !== null && (
                <div className="bg-black rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center">
                  <Star className="w-8 h-8 text-gold mb-2" />
                  <div className="text-5xl font-bold text-gold mb-1">{ratingScore}</div>
                  <div className="text-gold/70 text-sm font-medium">/10 Investment Rating</div>
                  {sections?.rating && (
                    <p className="text-zinc-400 text-xs mt-3 leading-relaxed">
                      {cleanMarkdown(sections.rating).replace(/\d+(?:\.\d+)?\s*(?:\/|out of)\s*10/i, '').replace(/^[•\s.*:_-]+/g, '').trim()}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Row 2: Price Per Sqft + Supply vs Demand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.pricePerSqft && (
                <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Price Per Sqft</h3>
                  </div>
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.pricePerSqft)}
                  </div>
                </div>
              )}
              {sections?.supplyDemand && (
                <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Supply vs Demand</h3>
                  </div>
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.supplyDemand)}
                  </div>
                </div>
              )}
            </div>

            {/* Row 3: Investment Metrics + Developers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.investment && (
                <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Investment Metrics</h3>
                  </div>
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.investment)}
                  </div>
                </div>
              )}
              {sections?.developers && (
                <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Building2 className="w-5 h-5 text-gold" />
                    <h3 className="font-bold text-black text-lg">Developer Landscape</h3>
                  </div>
                  <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.developers)}
                  </div>
                </div>
              )}
            </div>

            {/* Row 4: Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.pros && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-emerald-800 text-lg">Pros</h3>
                  </div>
                  <div className="text-emerald-900 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.pros)}
                  </div>
                </div>
              )}
              {sections?.cons && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-red-800 text-lg">Cons</h3>
                  </div>
                  <div className="text-red-900 text-sm leading-relaxed whitespace-pre-line">
                    {cleanMarkdown(sections.cons)}
                  </div>
                </div>
              )}
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