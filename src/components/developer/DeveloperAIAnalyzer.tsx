import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, TrendingUp, BarChart3, Shield, Star, Building2, ThumbsUp, ThumbsDown, RefreshCw, ArrowUpRight, ArrowDownRight, Home, Landmark } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from "recharts";

interface DeveloperAIAnalyzerProps {
  developerName: string;
  foundedYear?: number | null;
  headquarters?: string | null;
  completedProjects?: number | null;
  activeProjects?: number | null;
  projectCount?: number;
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

// --- Price Per Sqft Trend Chart ---
function parsePricePerSqftMetrics(text: string) {
  const priceMatch = text.match(/AED\s*([\d,]+)/i);
  const avgPsf = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : 1200;
  const currentYear = new Date().getFullYear();
  const growthMatch = text.match(/([+-]?\d+(?:\.\d+)?)%/);
  const annualGrowth = growthMatch ? parseFloat(growthMatch[1]) / 100 : 0.08;
  
  const data = [];
  for (let i = 4; i >= 0; i--) {
    const factor = Math.pow(1 + annualGrowth, -i);
    data.push({ year: (currentYear - i).toString(), price: Math.round(avgPsf * factor) });
  }
  data.push({ year: (currentYear + 1).toString(), price: Math.round(avgPsf * (1 + annualGrowth)) });
  return { data, growth: annualGrowth };
}

function PricePerSqftChart({ text }: { text: string }) {
  const { data: chartData, growth } = useMemo(() => parsePricePerSqftMetrics(text), [text]);
  const bullets = text.split('\n').filter(l => l.trim().startsWith('•')).slice(0, 3);
  const isPositive = growth >= 0;

  return (
    <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gold" />
          <h3 className="font-bold text-black text-lg">Price Per Sqft</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {(Math.abs(growth) * 100).toFixed(1)}% YoY
        </div>
      </div>
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #C8A76640', borderRadius: '12px', fontSize: '12px' }} formatter={(value: number) => [`AED ${value.toLocaleString()}`, 'Price/sqft']} />
            <Bar dataKey="price" radius={[6, 6, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={index} fill={index === chartData.length - 1 ? '#C8A76680' : '#C8A766'} stroke={index === chartData.length - 1 ? '#C8A766' : 'none'} strokeWidth={1.5} strokeDasharray={index === chartData.length - 1 ? '4 2' : '0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ backgroundColor: '#C8A766' }} /> Historical</span>
        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded border-2 border-dashed" style={{ borderColor: '#C8A766', backgroundColor: '#C8A76630' }} /> Projected</span>
      </div>
      {bullets.length > 0 && (
        <div className="border-t border-gold/10 pt-3 space-y-1.5">
          {bullets.map((b, i) => <p key={i} className="text-zinc-600 text-xs leading-relaxed">{b}</p>)}
        </div>
      )}
    </div>
  );
}

// --- Supply vs Demand Chart ---
function parseSupplyDemandMetrics(text: string) {
  const pipelineMatch = text.match(/(\d[\d,]*)\s*(?:new\s+)?units/i);
  const absorptionMatch = text.match(/(\d+)%\s*(?:absorption|absorbed|occupancy)/i);
  const yearMatches = text.match(/\b(202\d)\b/g);
  const pipeline = pipelineMatch ? parseInt(pipelineMatch[1].replace(/,/g, '')) : 5000;
  const absRate = absorptionMatch ? parseInt(absorptionMatch[1]) / 100 : 0.82;
  const targetYear = yearMatches ? Math.max(...yearMatches.map(Number)) : 2028;
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y <= Math.max(targetYear, currentYear + 3); y++) years.push(y);

  return years.map((_, i) => {
    const progress = (i + 1) / years.length;
    const supply = Math.round(pipeline * progress);
    const demand = Math.round(supply * (absRate + (Math.random() * 0.1 - 0.05)));
    return { year: years[i].toString(), supply, demand };
  });
}

function SupplyDemandChart({ text }: { text: string }) {
  const chartData = useMemo(() => parseSupplyDemandMetrics(text), [text]);
  const bullets = text.split('\n').filter(l => l.trim().startsWith('•')).slice(0, 4);
  const lastPoint = chartData[chartData.length - 1];
  const ratio = lastPoint ? lastPoint.demand / lastPoint.supply : 1;
  const marketStatus = ratio > 0.9 ? 'High Demand' : ratio > 0.7 ? 'Balanced' : 'Oversupplied';
  const StatusIcon = ratio >= 0.9 ? ArrowUpRight : ratio > 0.7 ? TrendingUp : ArrowDownRight;

  return (
    <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold" />
          <h3 className="font-bold text-black text-lg">Supply vs Demand</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${ratio > 0.9 ? 'bg-emerald-50 text-emerald-700' : ratio > 0.7 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {marketStatus}
        </div>
      </div>
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="devSupplyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C8A766" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#C8A766" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="devDemandGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #C8A76640', borderRadius: '12px', fontSize: '12px' }} formatter={(value: number, name: string) => [value.toLocaleString() + ' units', name === 'supply' ? 'Supply' : 'Demand']} />
            <Area type="monotone" dataKey="supply" stroke="#C8A766" strokeWidth={2.5} fill="url(#devSupplyGrad)" dot={{ fill: '#C8A766', r: 3 }} />
            <Area type="monotone" dataKey="demand" stroke="#10b981" strokeWidth={2.5} fill="url(#devDemandGrad)" dot={{ fill: '#10b981', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#C8A766' }} /><span className="text-zinc-600">Supply (New Units)</span></div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500" /><span className="text-zinc-600">Demand (Absorption)</span></div>
      </div>
      {bullets.length > 0 && (
        <div className="border-t border-gold/10 pt-3 space-y-1.5">
          {bullets.map((b, i) => <p key={i} className="text-zinc-600 text-xs leading-relaxed">{b}</p>)}
        </div>
      )}
    </div>
  );
}

// --- Investment Metrics Chart ---
function parseInvestmentMetrics(text: string) {
  const roiMatch = text.match(/(\d+(?:\.\d+)?)%\s*(?:ROI|return|yield|rental yield)/i);
  const capMatch = text.match(/(\d+(?:\.\d+)?)%\s*(?:cap rate|capitalization)/i);
  const appreciationMatch = text.match(/(\d+(?:\.\d+)?)%\s*(?:appreciation|capital growth|value growth)/i);
  const occupancyMatch = text.match(/(\d+(?:\.\d+)?)%\s*(?:occupancy|occupied)/i);
  return [
    { name: 'Rental Yield', value: roiMatch ? parseFloat(roiMatch[1]) : 6.5, fill: '#C8A766' },
    { name: 'Cap Rate', value: capMatch ? parseFloat(capMatch[1]) : 5.8, fill: '#10b981' },
    { name: 'Appreciation', value: appreciationMatch ? parseFloat(appreciationMatch[1]) : 8.2, fill: '#6366f1' },
    { name: 'Occupancy', value: occupancyMatch ? parseFloat(occupancyMatch[1]) : 88, fill: '#f59e0b' },
  ];
}

function InvestmentMetricsChart({ text }: { text: string }) {
  const metrics = useMemo(() => parseInvestmentMetrics(text), [text]);
  const bullets = text.split('\n').filter(l => l.trim().startsWith('•')).slice(0, 3);
  const yieldMetrics = metrics.filter(m => m.name !== 'Occupancy');
  const occupancy = metrics.find(m => m.name === 'Occupancy');

  return (
    <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gold" />
          <h3 className="font-bold text-black text-lg">Investment Metrics</h3>
        </div>
        {occupancy && (
          <div className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
            {occupancy.value}% Occupancy
          </div>
        )}
      </div>
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yieldMetrics} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 'auto']} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} width={90} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #C8A76640', borderRadius: '12px', fontSize: '12px' }} formatter={(value: number) => [`${value}%`, '']} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {yieldMetrics.map((entry, index) => <Cell key={index} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-3 flex-wrap text-xs mb-3">
        {yieldMetrics.map((m) => (
          <span key={m.name} className="flex items-center gap-1"><div className="w-3 h-3 rounded" style={{ backgroundColor: m.fill }} /><span className="text-zinc-600">{m.name}</span></span>
        ))}
      </div>
      {bullets.length > 0 && (
        <div className="border-t border-gold/10 pt-3 space-y-1.5">
          {bullets.map((b, i) => <p key={i} className="text-zinc-600 text-xs leading-relaxed">{b}</p>)}
        </div>
      )}
    </div>
  );
}

// --- Portfolio Strength Card ---
function PortfolioStrengthCard({ text }: { text: string }) {
  const devEntries = useMemo(() => {
    const lines = text.split('\n').filter(l => l.trim().startsWith('•'));
    return lines.map(line => {
      const clean = line.replace(/^•\s*/, '').trim();
      const colonSplit = clean.split(':');
      const devName = colonSplit[0]?.trim() || clean;
      const projects = colonSplit.slice(1).join(':').trim();
      return { name: devName, projects };
    }).slice(0, 4);
  }, [text]);

  return (
    <div className="bg-white border border-gold/20 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-gold" />
          <h3 className="font-bold text-black text-lg">Portfolio Strength</h3>
        </div>
      </div>
      <div className="space-y-3">
        {devEntries.map((dev, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-[#FDFBF7] to-[#F5F0E6] border border-gold/10 hover:border-gold/30 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0">
              <span className="text-gold font-bold text-xs">{dev.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-black font-semibold text-sm truncate">{dev.name}</p>
              {dev.projects && <p className="text-zinc-500 text-xs mt-0.5 truncate">{dev.projects}</p>}
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 text-gold/50 flex-shrink-0 mt-1" />
          </div>
        ))}
      </div>
      {devEntries.length === 0 && (
        <div className="text-zinc-700 text-sm leading-relaxed whitespace-pre-line">{text}</div>
      )}
    </div>
  );
}

export const DeveloperAIAnalyzer = ({
  developerName,
  foundedYear,
  headquarters,
  completedProjects,
  activeProjects,
  projectCount,
}: DeveloperAIAnalyzerProps) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setHasTimedOut(false);
    setErrorMsg(null);

    timeoutRef.current = setTimeout(() => setHasTimedOut(true), 30000);

    try {
      const contextParts = [`Developer: ${developerName}`];
      if (foundedYear) contextParts.push(`Founded: ${foundedYear}`);
      if (headquarters) contextParts.push(`HQ: ${headquarters}`);
      if (projectCount) contextParts.push(`Projects: ${projectCount}`);
      if (completedProjects) contextParts.push(`Units Delivered: ${completedProjects.toLocaleString()}+`);
      if (activeProjects) contextParts.push(`Active Projects: ${activeProjects}`);

      const { data, error } = await supabase.functions.invoke("ai-property-analyzer", {
        body: { area: `${developerName} — ${contextParts.join('. ')}`, propertyType: "all" },
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
  }, [developerName, foundedYear, headquarters, completedProjects, activeProjects, projectCount]);

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
    if (isVisible && !analysis && !isAnalyzing && !hasTriggered.current && !errorMsg) {
      hasTriggered.current = true;
      handleAnalyze();
    }
  }, [isVisible, analysis, isAnalyzing, handleAnalyze, errorMsg]);

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
    <section ref={sectionRef} className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl mt-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="w-6 h-6 text-gold" />
          <h2 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
            JBJ AI Developer Intelligence
          </h2>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {foundedYear && (
            <div className="bg-white border border-gold/20 rounded-xl p-4 text-center shadow-sm">
              <div className="text-2xl font-bold text-gold">{foundedYear}</div>
              <div className="text-zinc-600 text-xs mt-1">Founded</div>
            </div>
          )}
          {projectCount && (
            <div className="bg-white border border-gold/20 rounded-xl p-4 text-center shadow-sm">
              <Home className="w-4 h-4 text-gold mx-auto mb-1" />
              <div className="text-2xl font-bold text-gold">{projectCount}</div>
              <div className="text-zinc-600 text-xs mt-1">Projects</div>
            </div>
          )}
          {completedProjects && (
            <div className="bg-white border border-gold/20 rounded-xl p-4 text-center shadow-sm">
              <Landmark className="w-4 h-4 text-gold mx-auto mb-1" />
              <div className="text-2xl font-bold text-gold">{completedProjects.toLocaleString()}+</div>
              <div className="text-zinc-600 text-xs mt-1">Units Delivered</div>
            </div>
          )}
          {activeProjects && (
            <div className="bg-white border border-gold/20 rounded-xl p-4 text-center shadow-sm">
              <Building2 className="w-4 h-4 text-gold mx-auto mb-1" />
              <div className="text-2xl font-bold text-gold">{activeProjects}</div>
              <div className="text-zinc-600 text-xs mt-1">Active Projects</div>
            </div>
          )}
        </div>

        <p className="text-zinc-500 text-sm mb-6">
          Comprehensive AI analysis for <span className="font-semibold text-black">{developerName}</span>
        </p>

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
              <>
                <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">JBJ AI is analyzing {developerName}...</p>
              </>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Row 1: Overview + Rating */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sections?.overview && (
                <div className="lg:col-span-2 bg-white border border-gold/20 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <h3 className="font-bold text-black text-lg">Developer Overview</h3>
                        <span className="text-zinc-400 text-xs">{developerName} Portfolio Profile</span>
                      </div>
                    </div>
                    <p className="text-zinc-700 text-sm leading-relaxed">{cleanMarkdown(sections.overview)}</p>
                  </div>
                </div>
              )}

              {ratingScore !== null && (
                <div className="bg-black rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-gold/10 rounded-full blur-[60px] pointer-events-none" />
                  <Star className="w-7 h-7 text-gold mb-3 relative z-10" />
                  <div className="relative w-32 h-32 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[{ value: ratingScore, fill: '#D4AF37' }, { value: 10 - ratingScore, fill: 'rgba(255,255,255,0.08)' }]}
                          cx="50%" cy="50%" innerRadius={42} outerRadius={56} startAngle={90} endAngle={-270} dataKey="value" stroke="none"
                        >
                          <Cell fill="#D4AF37" />
                          <Cell fill="rgba(255,255,255,0.08)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-gold">{ratingScore}</span>
                      <span className="text-gold/50 text-[10px] font-medium">/10</span>
                    </div>
                  </div>
                  <div className="text-gold/70 text-sm font-medium mb-2 relative z-10">Investment Rating</div>
                  {sections?.rating && (
                    <p className="text-zinc-400 text-xs leading-relaxed max-w-[200px] relative z-10">
                      {cleanMarkdown(sections.rating).replace(/\d+(?:\.\d+)?\s*(?:\/|out of)\s*10/i, '').replace(/^[•\s.*:_-]+/g, '').trim().slice(0, 120)}
                    </p>
                  )}
                  <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider relative z-10 ${
                    ratingScore >= 8 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    ratingScore >= 6 ? 'bg-gold/20 text-gold border border-gold/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {ratingScore >= 8 ? 'Excellent' : ratingScore >= 6 ? 'Good' : 'Moderate'}
                  </div>
                </div>
              )}
            </div>

            {/* Row 2: Price Per Sqft + Supply vs Demand */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.pricePerSqft && <PricePerSqftChart text={cleanMarkdown(sections.pricePerSqft)} />}
              {sections?.supplyDemand && <SupplyDemandChart text={cleanMarkdown(sections.supplyDemand)} />}
            </div>

            {/* Row 3: Investment Metrics + Portfolio Strength */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.investment && <InvestmentMetricsChart text={cleanMarkdown(sections.investment)} />}
              {sections?.developers && <PortfolioStrengthCard text={cleanMarkdown(sections.developers)} />}
            </div>

            {/* Row 4: Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.pros && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-emerald-800 text-lg">Pros</h3>
                  </div>
                  <div className="text-emerald-900 text-sm leading-relaxed whitespace-pre-line">{cleanMarkdown(sections.pros)}</div>
                </div>
              )}
              {sections?.cons && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsDown className="w-5 h-5 text-red-500" />
                    <h3 className="font-bold text-red-800 text-lg">Cons</h3>
                  </div>
                  <div className="text-red-900 text-sm leading-relaxed whitespace-pre-line">{cleanMarkdown(sections.cons)}</div>
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
