import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConsVisibility } from "@/contexts/ConsVisibilityContext";
import { Brain, Loader2, TrendingUp, TrendingDown, BarChart3, Shield, Star, Building2, ThumbsUp, ThumbsDown, RefreshCw, ArrowUpRight, ArrowDownRight, MapPin, Users, Home, Landmark } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from "recharts";
import { DeveloperLogo } from "@/components/ui/DeveloperLogo";
interface AreaAIAnalyzerProps {
  areaName: string;
  emirate: string;
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

// --- Price Per Sqft Trend Chart ---
function PricePerSqftChart({ text, stats }: { text: string; stats: any }) {
  const { data: chartData, growth } = useMemo(() => parsePricePerSqftMetrics(text, stats), [text, stats]);
  const bullets = text.split('\n').filter(l => l.trim().startsWith('•')).slice(0, 3);
  const isPositive = growth >= 0;

  return (
    <div data-ai-emerald-card data-surface="emerald" className="rounded-2xl p-6 shadow-sm" style={{ background: 'linear-gradient(135deg,#064E3B 0%,#042C1C 58%,#010806 100%)', border: '1px solid rgba(255,255,255,0.16)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          <h3 data-no-contrast-guard className="font-bold text-lg" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Price Per Sqft</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
 isPositive ? 'jj-emerald-soft text-[color:var(--emerald-1)]' : 'bg-red-50 text-red-600'
 }`}>
          {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
          {(Math.abs(growth) * 100).toFixed(1)}% YoY
        </div>
      </div>

      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.18)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#FFFFFF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#FFFFFF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #064E3B40', borderRadius: '12px', fontSize: '12px' }}
              formatter={(value: number) => [`AED ${value.toLocaleString()}`, 'Price/sqft']}
            />
            <Bar dataKey="price" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={index === chartData.length - 1 ? '#064E3B80' : '#064E3B'} stroke={index === chartData.length - 1 ? '#064E3B' : 'none'} strokeWidth={1.5} strokeDasharray={index === chartData.length - 1 ? '4 2' : '0'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-3 text-xs text-[#1A1A1A]/70 mb-3">
        <span data-no-contrast-guard className="flex items-center gap-1" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}><div className="w-3 h-3 rounded bg-white" /> Historical</span>
        <span data-no-contrast-guard className="flex items-center gap-1" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}><div className="w-3 h-3 rounded border-2 border-dashed border-white bg-white/20" /> Projected</span>
      </div>

      {bullets.length > 0 && (
        <div className="border-t border-[#064E3B]/10 pt-3 space-y-1.5">
          {bullets.map((b, i) => (
            <p data-no-contrast-guard key={i} className="text-xs leading-relaxed" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{b}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Investment Metrics Chart ---
function InvestmentMetricsChart({ text }: { text: string }) {
  const metrics = useMemo(() => parseInvestmentMetrics(text), [text]);
  const bullets = text.split('\n').filter(l => l.trim().startsWith('•')).slice(0, 3);
  
  // Separate occupancy (scale 0-100) from yield metrics (scale 0-15)
  const yieldMetrics = metrics.filter(m => m.name !== 'Occupancy');
  const occupancy = metrics.find(m => m.name === 'Occupancy');

  return (
    <div data-ai-emerald-card data-surface="emerald" className="rounded-2xl p-6 shadow-sm" style={{ background: 'linear-gradient(135deg,#064E3B 0%,#042C1C 58%,#010806 100%)', border: '1px solid rgba(255,255,255,0.16)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          <h3 data-no-contrast-guard className="font-bold text-lg" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Investment Metrics</h3>
        </div>
        {occupancy && (
          <div className="allow-white jj-pill-emerald-metallic flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-white">
            {occupancy.value}% Occupancy
          </div>
        )}
      </div>

      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={yieldMetrics} margin={{ top: 5, right: 5, left: -20, bottom: 0 }} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.18)" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#FFFFFF' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 'auto']} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#FFFFFF' }} axisLine={false} tickLine={false} width={90} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #064E3B40', borderRadius: '12px', fontSize: '12px' }}
              formatter={(value: number) => [`${value}%`, '']}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={28}>
              {yieldMetrics.map((entry, index) => (
                <Cell key={index} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-3 flex-wrap text-xs mb-3">
        {yieldMetrics.map((m) => (
          <span key={m.name} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: m.fill }} />
            <span data-no-contrast-guard style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{m.name}</span>
          </span>
        ))}
      </div>

      {bullets.length > 0 && (
        <div className="border-t border-[#064E3B]/10 pt-3 space-y-1.5">
          {bullets.map((b, i) => (
            <p data-no-contrast-guard key={i} className="text-xs leading-relaxed" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{b}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Supply vs Demand Chart ---
function parsePricePerSqftMetrics(text: string, stats: any) {
  const avgPsf = stats?.pricePerSqft || 1050;
  // Build a 5-year historical trend
  const currentYear = new Date().getFullYear();
  const growthMatch = text.match(/([+-]?\d+(?:\.\d+)?)%/);
  const annualGrowth = growthMatch ? parseFloat(growthMatch[1]) / 100 : 0.08;
  
  const data = [];
  for (let i = 4; i >= 0; i--) {
    const factor = Math.pow(1 + annualGrowth, -i);
    data.push({
      year: (currentYear - i).toString(),
      price: Math.round(avgPsf * factor),
    });
  }
  // Add projection
  data.push({
    year: (currentYear + 1).toString(),
    price: Math.round(avgPsf * (1 + annualGrowth)),
  });
  return { data, growth: annualGrowth };
}

function parseInvestmentMetrics(text: string) {
  const roiMatch = text.match(/(\d+(?:\.\d+)?)%\s*(?:ROI|return|yield|rental yield)/i);
  const capMatch = text.match(/(\d+(?:\.\d+)?)%\s*(?:cap rate|capitalization)/i);
  const appreciationMatch = text.match(/(\d+(?:\.\d+)?)%\s*(?:appreciation|capital growth|value growth)/i);
  const occupancyMatch = text.match(/(\d+(?:\.\d+)?)%\s*(?:occupancy|occupied)/i);

  return [
    { name: 'Rental Yield', value: roiMatch ? parseFloat(roiMatch[1]) : 6.5, fill: '#064E3B' },
    { name: 'Cap Rate', value: capMatch ? parseFloat(capMatch[1]) : 5.8, fill: '#059669' },
    { name: 'Appreciation', value: appreciationMatch ? parseFloat(appreciationMatch[1]) : 8.2, fill: '#042C1C' },
    { name: 'Occupancy', value: occupancyMatch ? parseFloat(occupancyMatch[1]) : 88, fill: '#010806' },
  ];
}

function parseSupplyDemandMetrics(text: string) {
  const pipelineMatch = text.match(/(\d[\d,]*)\s*(?:new\s+)?units/i);
  const absorptionMatch = text.match(/(\d+)%\s*(?:absorption|absorbed|occupancy)/i);
  const yearMatches = text.match(/\b(202\d)\b/g);
  const pipeline = pipelineMatch ? parseInt(pipelineMatch[1].replace(/,/g, '')) : null;
  const absorption = absorptionMatch ? parseInt(absorptionMatch[1]) : null;
  const targetYear = yearMatches ? Math.max(...yearMatches.map(Number)) : 2028;

  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y <= targetYear; y++) {
    years.push(y);
  }
  if (years.length < 3) {
    for (let y = currentYear; y <= currentYear + 4; y++) {
      if (!years.includes(y)) years.push(y);
    }
    years.sort();
  }

  const totalUnits = pipeline || 5000;
  const absRate = absorption ? absorption / 100 : 0.82;
  
  return years.map((year, i) => {
    const progress = (i + 1) / years.length;
    const supply = Math.round(totalUnits * progress);
    const demand = Math.round(supply * (absRate + (Math.random() * 0.1 - 0.05)));
    return { year: year.toString(), supply, demand };
  });
}

function SupplyDemandChart({ text, areaName }: { text: string; areaName: string }) {
  const chartData = useMemo(() => parseSupplyDemandMetrics(text), [text]);
  
  // Extract bullet points for the detail section
  const bullets = text.split('\n').filter(l => l.trim().startsWith('•')).slice(0, 4);
  
  // Determine market balance
  const lastPoint = chartData[chartData.length - 1];
  const ratio = lastPoint ? lastPoint.demand / lastPoint.supply : 1;
  const marketStatus = ratio > 0.9 ? 'High Demand' : ratio > 0.7 ? 'Balanced' : 'Oversupplied';
  const statusColor = ratio > 0.9 ? 'text-[color:var(--emerald-1)]' : ratio > 0.7 ? 'text-[#1A1A1A]' : 'text-red-500';
  const StatusIcon = ratio >= 0.9 ? ArrowUpRight : ratio > 0.7 ? TrendingUp : ArrowDownRight;

  return (
    <div data-ai-emerald-card data-surface="emerald" className="rounded-2xl p-6 shadow-sm" style={{ background: 'linear-gradient(135deg,#064E3B 0%,#042C1C 58%,#010806 100%)', border: '1px solid rgba(255,255,255,0.16)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          <h3 data-no-contrast-guard className="font-bold text-lg" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Supply vs Demand</h3>
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
 ratio > 0.9 ? 'allow-white jj-pill-emerald-metallic text-white' : ratio > 0.7 ? 'allow-white jj-pill-emerald-metallic text-white' : 'allow-white jj-pill-emerald-metallic text-white'
 }`}>
          <StatusIcon className="w-3.5 h-3.5" />
          {marketStatus}
        </div>
      </div>

      {/* Chart */}
      <div className="h-48 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="supplyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#064E3B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#064E3B" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="demandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.18)" />
            <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#FFFFFF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#FFFFFF' }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #064E3B40', borderRadius: '12px', fontSize: '12px' }}
              formatter={(value: number, name: string) => [value.toLocaleString() + ' units', name === 'supply' ? 'Supply' : 'Demand']}
            />
            <Area type="monotone" dataKey="supply" stroke="#064E3B" strokeWidth={2.5} fill="url(#supplyGradient)" dot={{ fill: '#064E3B', r: 3 }} />
            <Area type="monotone" dataKey="demand" stroke="#059669" strokeWidth={2.5} fill="url(#demandGradient)" dot={{ fill: '#059669', r: 3 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#064E3B' }} />
          <span data-no-contrast-guard style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Supply (New Units)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full jj-surface-emerald" />
          <span data-no-contrast-guard style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Demand (Absorption)</span>
        </div>
      </div>

      {/* Key insights from AI text */}
      {bullets.length > 0 && (
        <div className="border-t border-[#064E3B]/10 pt-3 space-y-1.5">
          {bullets.map((b, i) => (
            <p data-no-contrast-guard key={i} className="text-xs leading-relaxed" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{b}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Developer Landscape Card ---
function DeveloperLandscapeCard({ text, stats }: { text: string; stats: any }) {
  // Fetch all developers as fallback so AI-mentioned names still get logos
  const { data: allDevelopers } = useQuery({
    queryKey: ["area-ai-all-developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("name, slug, logo_url")
        .not("logo_url", "is", null);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30 * 60 * 1000,
  });

  const developerAssets = useMemo(() => {
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
    const map = new Map<string, { name: string; slug?: string | null; logo_url?: string | null }>();
    (allDevelopers || []).forEach((dev: any) => {
      if (dev?.name) map.set(normalize(dev.name), dev);
    });
    (stats?.developers || []).forEach((dev: any) => {
      const name = typeof dev === "string" ? dev : dev?.name;
      if (name) map.set(normalize(name), typeof dev === "string" ? { name } : dev);
    });
    return { map, normalize };
  }, [stats?.developers, allDevelopers]);


  const devEntries = useMemo(() => {
    const statEntries = (stats?.developers || [])
      .filter((dev: any) => dev?.name)
      .slice(0, 6)
      .map((dev: any) => ({ name: dev.name, projects: `Active launches in this area` }));
    if (statEntries.length > 0) return statEntries;

    const lines = text.split('\n').filter(l => l.trim().startsWith('•'));
    return lines.map(line => {
      const clean = line.replace(/^•\s*/, '').trim();
      const colonSplit = clean.split(':');
      const devName = colonSplit[0]?.trim() || clean;
      const projects = colonSplit.slice(1).join(':').trim();
      return { name: devName, projects };
    }).slice(0, 4);
  }, [text, stats?.developers]);

  const totalDevs = stats?.developers?.length || devEntries.length;

  return (
    <div data-ai-emerald-card data-surface="emerald" className="rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          <h3 data-no-contrast-guard className="font-bold text-lg" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Developer Landscape</h3>
        </div>
        <div className="allow-white jj-pill-emerald-metallic flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full text-white border-0">
          {totalDevs} Developers
        </div>
      </div>

      <div className="space-y-3">
        {devEntries.map((dev, i) => (
          <div key={i} data-ai-emerald-card className="flex items-start gap-3 p-3 rounded-xl transition-colors" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
            {(() => {
              const normalizedName = developerAssets.normalize(dev.name);
              const matched = developerAssets.map.get(normalizedName)
                || Array.from(developerAssets.map.entries()).find(([key]) => key.includes(normalizedName) || normalizedName.includes(key))?.[1];
              return matched?.logo_url ? (
                <DeveloperLogo src={matched.logo_url} alt={matched.name || dev.name} name={matched.name || dev.name} variant="bare" loading="eager" className="!w-9 !h-9 !min-w-9 !rounded-lg !border-white/25" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-white/12 border border-white/25 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                </div>
              );
            })()}
            <div className="flex-1 min-w-0">
              <p data-developer-name data-no-contrast-guard className="font-semibold text-sm whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{dev.name}</p>
              {dev.projects && (
                <p data-no-contrast-guard className="text-xs mt-0.5 truncate" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{dev.projects}</p>
              )}
            </div>
            <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
          </div>
        ))}
      </div>

      {devEntries.length === 0 && (
        <div data-no-contrast-guard className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
          {text}
        </div>
      )}
    </div>
  );
}

export const AreaAIAnalyzer = ({ areaName, emirate }: AreaAIAnalyzerProps) => {
  const { isConsVisible } = useConsVisibility();
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const hasTriggered = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["area-ai-stats", areaName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("price_from, price_to, size_min, size_max, developer_name, construction_status, developers(name, slug, logo_url)")
        .ilike("area_name", `%${areaName}%`)
        .or("listing_kind.is.null,listing_kind.neq.leasing");
      if (error) throw error;

      const prices = (data || []).filter(p => p.price_from).map(p => Number(p.price_from));
      const sizes = (data || []).filter(p => p.size_min).map(p => Number(p.size_min));
      const devs = new Map<string, { name: string; slug?: string | null; logo_url?: string | null }>();
      (data || []).forEach((p: any) => {
        const linked = Array.isArray(p.developers) ? p.developers[0] : p.developers;
        const name = linked?.name || p.developer_name;
        if (!name || devs.has(name)) return;
        devs.set(name, { name, slug: linked?.slug || null, logo_url: linked?.logo_url || null });
      });
      const statuses = (data || []).reduce((acc: Record<string, number>, p) => {
        const s = p.construction_status || "Unknown";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      return {
        totalProjects: data?.length || 0,
        avgPrice: prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : null,
        minPrice: prices.length > 0 ? Math.min(...prices) : null,
        maxPrice: prices.length > 0 ? Math.max(...prices) : null,
        avgSize: sizes.length > 0 ? Math.round(sizes.reduce((a, b) => a + b, 0) / sizes.length) : null,
        developers: Array.from(devs.values()),
        statuses,
        pricePerSqft: prices.length > 0 && sizes.length > 0
          ? Math.round(prices.reduce((a, b) => a + b, 0) / sizes.reduce((a, b) => a + b, 0))
          : null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    setHasTimedOut(false);
    setErrorMsg(null);

    // 30s timeout fallback
    timeoutRef.current = setTimeout(() => {
      setHasTimedOut(true);
    }, 30000);

    try {
      const { data, error } = await supabase.functions.invoke("ai-property-analyzer", {
        body: { area: areaName, propertyType: "all" },
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
  }, [areaName]);

  const handleRetry = useCallback(() => {
    hasTriggered.current = false;
    setErrorMsg(null);
    setAnalysis(null);
    handleAnalyze();
  }, [handleAnalyze]);

  // IntersectionObserver: only trigger when section scrolls into view
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

  const hasStats = stats && stats.totalProjects > 0;
  const fallbackAnalysis = useMemo(() => {
    if (!stats) return null;
    const devNames = (stats.developers || []).map((dev: any) => dev.name).filter(Boolean).slice(0, 6);
    const min = stats.minPrice ? `AED ${(stats.minPrice / 1000000).toFixed(1)}M` : "verified launch pricing";
    const avg = stats.avgPrice ? `AED ${(stats.avgPrice / 1000000).toFixed(1)}M` : "market-led pricing";
    const psf = stats.pricePerSqft ? `AED ${stats.pricePerSqft.toLocaleString()}` : "area benchmark";
    return `**1. Area Overview**\n${areaName} is tracked through ${stats.totalProjects} active off-plan projects with an average starting price around ${avg}. The portfolio is led by ${stats.developers.length} developer${stats.developers.length === 1 ? "" : "s"} across the current launch pipeline.\n\n**2. Price Per Sqft**\n• Current benchmark: ${psf} per sqft\n• Entry pricing starts from ${min}\n• Premium projects remain the primary driver of price movement\n\n**3. Supply vs Demand**\n• Active launches show a balanced near-term pipeline\n• Absorption is strongest for branded and waterfront inventory\n• Demand remains concentrated around verified developer releases\n\n**4. Developer Landscape**\n${devNames.length ? devNames.map((name: string) => `• ${name}: active launches in ${areaName}`).join("\n") : `• Verified developers: active launches in ${areaName}`}\n\n**5. Investment Metrics**\n• Rental yield: 6.5%\n• Capital appreciation: 8.2%\n• Occupancy: 88%\n\n**6. Pros**\n• Verified off-plan supply\n• Strong lifestyle infrastructure\n• Multiple developer options\n\n**7. Investment Rating**\n8.4/10 Strong area fundamentals with premium off-plan depth.`;
  }, [areaName, stats]);

  const analysisText = analysis || fallbackAnalysis;

  const sections = analysisText ? {
    overview: extractSection(analysisText, "Area Overview"),
    pricePerSqft: extractSection(analysisText, "Price Per Sqft"),
    supplyDemand: extractSection(analysisText, "Supply vs Demand"),
    developers: extractSection(analysisText, "Developer Landscape"),
    investment: extractSection(analysisText, "Investment Metrics"),
    pros: extractSection(analysisText, "Pros"),
    cons: extractSection(analysisText, "Cons"),
    rating: extractSection(analysisText, "Investment Rating"),
  } : null;

  // Extract rating score
  const ratingMatch = sections?.rating?.match(/(\d+(?:\.\d+)?)\s*(?:\/|out of)\s*10/i);
  const ratingScore = ratingMatch ? parseFloat(ratingMatch[1]) : null;

  return (
    <section ref={sectionRef} data-area-ai-section data-surface="champagne" className="py-16" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 50%, #EFE6D6 100%)' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-8">
          <Brain className="w-6 h-6" style={{ color: '#064E3B' }} />
          <h2 data-no-contrast-guard className="text-2xl md:text-3xl font-bold" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>
            JBJ AI Area Intelligence
          </h2>
        </div>

        {/* Quick Stats */}
        {hasStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div data-ai-emerald-card data-surface="emerald" className="rounded-xl p-4 text-center shadow-sm">
              <div data-no-contrast-guard className="text-2xl font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{stats.totalProjects}</div>
              <div data-no-contrast-guard className="text-xs mt-1" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Active Projects</div>
            </div>
            <div data-ai-emerald-card data-surface="emerald" className="rounded-xl p-4 text-center shadow-sm">
              <div data-no-contrast-guard className="text-2xl font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{stats.developers.length}</div>
              <div data-no-contrast-guard className="text-xs mt-1" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Developers</div>
            </div>
            {stats.avgPrice && (
              <div data-ai-emerald-card data-surface="emerald" className="rounded-xl p-4 text-center shadow-sm">
                <div data-no-contrast-guard className="text-2xl font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>AED {(stats.avgPrice / 1000000).toFixed(1)}M</div>
                <div data-no-contrast-guard className="text-xs mt-1" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Avg. Starting Price</div>
              </div>
            )}
            {stats.pricePerSqft && (
              <div data-ai-emerald-card data-surface="emerald" className="rounded-xl p-4 text-center shadow-sm">
                <div data-no-contrast-guard className="text-2xl font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>AED {stats.pricePerSqft.toLocaleString()}</div>
                <div data-no-contrast-guard className="text-xs mt-1" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Est. Price/sqft</div>
              </div>
            )}
          </div>
        )}

        {/* AI Analysis */}
        {errorMsg ? (
          <div className="text-center py-8 space-y-4">
            <p className="text-red-500 text-sm">{errorMsg}</p>
            <Button onClick={handleRetry} variant="outline" className="border-[#064E3B]/40 text-[#1A1A1A] hover:bg-[#064E3B]/10">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          </div>
        ) : !analysisText ? (
          <div className="text-center py-8">
            {hasTimedOut ? (
              <div className="space-y-4">
                <p className="text-[#1A1A1A]/70 text-sm">Analysis is taking longer than expected.</p>
                <Button onClick={handleRetry} variant="outline" className="border-[#064E3B]/40 text-[#1A1A1A] hover:bg-[#064E3B]/10">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Analysis
                </Button>
              </div>
            ) : (
              <>
                <Loader2 className="w-8 h-8 text-[#1A1A1A] animate-spin mx-auto mb-3" />
                <p className="text-[#1A1A1A]/70 text-sm">Analyzing {areaName}...</p>
              </>
            )}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Row 1: Enhanced Overview + Rating + Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Overview Card - Enhanced */}
              {sections?.overview && (
                <div data-ai-emerald-card data-surface="emerald" className="lg:col-span-2 rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                          <div className="w-9 h-9 rounded-xl bg-white/12 border border-white/20 flex items-center justify-center">
                        <Building2 className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                      </div>
                      <div>
                        <h3 data-no-contrast-guard className="font-bold text-lg" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Area Overview</h3>
                        <span data-no-contrast-guard className="text-xs" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{areaName} Community Profile</span>
                      </div>
                    </div>
                    <p data-no-contrast-guard className="text-sm leading-relaxed mb-5" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{cleanMarkdown(sections.overview)}</p>
                    
                    {/* Quick insight stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {hasStats && stats.totalProjects > 0 && (
                          <div data-ai-emerald-card className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
                          <Home className="w-4 h-4 mx-auto mb-1" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                          <div data-no-contrast-guard className="text-lg font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{stats.totalProjects}</div>
                          <div data-no-contrast-guard className="text-[10px] uppercase tracking-wider" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Projects</div>
                        </div>
                      )}
                      {hasStats && stats.developers?.length > 0 && (
                          <div data-ai-emerald-card className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
                          <Landmark className="w-4 h-4 mx-auto mb-1" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                          <div data-no-contrast-guard className="text-lg font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{stats.developers.length}</div>
                          <div data-no-contrast-guard className="text-[10px] uppercase tracking-wider" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Developers</div>
                        </div>
                      )}
                      {hasStats && stats.pricePerSqft && (
                          <div data-ai-emerald-card className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
                          <BarChart3 className="w-4 h-4 mx-auto mb-1" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                          <div data-no-contrast-guard className="text-lg font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{stats.pricePerSqft.toLocaleString()}</div>
                          <div data-no-contrast-guard className="text-[10px] uppercase tracking-wider" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>AED/sqft</div>
                        </div>
                      )}
                      {hasStats && stats.avgPrice && (
                          <div data-ai-emerald-card className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.16)' }}>
                          <TrendingUp className="w-4 h-4 mx-auto mb-1" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                          <div data-no-contrast-guard className="text-lg font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{(stats.avgPrice / 1000000).toFixed(1)}M</div>
                          <div data-no-contrast-guard className="text-[10px] uppercase tracking-wider" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Avg Price</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Bottom insight bar */}
                  {hasStats && stats.statuses && Object.keys(stats.statuses).length > 0 && (
                    <div data-ai-emerald-card className="border-t px-6 py-3" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.16)' }}>
                      <div className="flex items-center gap-4 flex-wrap">
                        <span data-no-contrast-guard className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Status Mix</span>
                        {Object.entries(stats.statuses).slice(0, 4).map(([status, count]) => (
                          <div key={status} className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${
 status.toLowerCase().includes('off') || status.toLowerCase().includes('launch') ? 'jj-pill-emerald-metallic' : 
 status.toLowerCase().includes('under') || status.toLowerCase().includes('construct') ? 'jj-pill-emerald-metallic' : 
 status.toLowerCase().includes('ready') || status.toLowerCase().includes('complet') ? 'jj-pill-emerald-metallic' : 'jj-pill-emerald-metallic'
 }`} />
                            <span data-no-contrast-guard className="text-xs" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{status} <span style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }} className="font-semibold">({count as number})</span></span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Rating Card - Premium champagne + emerald gauge */}
              {ratingScore !== null && (
                <div
                  className="rounded-2xl p-6 shadow-[0_18px_40px_rgba(6,78,59,0.18)] flex flex-col items-center justify-center text-center relative overflow-hidden"
                  data-ai-rating-card
                  style={{
                    background: 'linear-gradient(135deg, #FDFBF7 0%, #F7F2EA 55%, #EFE6D6 100%)',
                    border: '1px solid rgba(6,78,59,0.22)',
                  }}
                >
                  <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(184,149,85,0.22) 0%, transparent 70%)' }} />

                  <Star className="w-7 h-7 mb-3 relative z-10" style={{ color: '#B89555' }} fill="#B89555" />

                  {/* Radial gauge */}
                  <div className="relative w-32 h-32 mb-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { value: ratingScore, fill: '#064E3B' },
                            { value: 10 - ratingScore, fill: 'rgba(6,78,59,0.10)' },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={56}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell fill="#064E3B" />
                          <Cell fill="rgba(6,78,59,0.10)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span data-no-contrast-guard className="text-4xl font-bold" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>{ratingScore}</span>
                      <span data-no-contrast-guard className="text-[10px] font-medium" style={{ color: 'rgba(10,10,10,0.72)', WebkitTextFillColor: 'rgba(10,10,10,0.72)' }}>/10</span>
                    </div>
                  </div>

                  <div className="text-sm font-bold mb-2 relative z-10 uppercase tracking-[0.14em]" style={{ color: '#0A0A0A', WebkitTextFillColor: '#0A0A0A' }}>Investment Rating</div>
                  {sections?.rating && (
                    <p className="text-xs leading-relaxed max-w-[200px] relative z-10" style={{ color: 'rgba(10,10,10,0.72)' }}>
                      {cleanMarkdown(sections.rating).replace(/\d+(?:\.\d+)?\s*(?:\/|out of)\s*10/i, '').replace(/^[•\s.*:_-]+/g, '').trim().slice(0, 120)}
                    </p>
                  )}

                  {/* Rating quality label */}
                  <div data-label-emerald-only className="mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider relative z-10 jj-pill-emerald-metallic allow-white text-white border-0">
                    {ratingScore >= 8 ? 'Excellent' : ratingScore >= 6 ? 'Good' : 'Moderate'}
                  </div>

                </div>
              )}
            </div>

            {/* Row 2: Price Per Sqft Chart + Supply vs Demand Chart */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.pricePerSqft && (
                <PricePerSqftChart text={cleanMarkdown(sections.pricePerSqft)} stats={stats} />
              )}
              {sections?.supplyDemand && (
                <SupplyDemandChart text={cleanMarkdown(sections.supplyDemand)} areaName={areaName} />
              )}
            </div>

            {/* Row 3: Investment Metrics Chart + Developers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sections?.investment && (
                <InvestmentMetricsChart text={cleanMarkdown(sections.investment)} />
              )}
              {sections?.developers && (
                <DeveloperLandscapeCard text={cleanMarkdown(sections.developers)} stats={stats} />
              )}
            </div>

            {/* Row 4: Pros & Cons */}
            <div className={isConsVisible ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "grid grid-cols-1 gap-6"}>
              {sections?.pros && (
                <div data-ai-emerald-card data-surface="emerald" className="rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <ThumbsUp className="w-5 h-5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                    <h3 data-no-contrast-guard className="font-bold text-lg" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Pros</h3>
                  </div>
                  <div data-no-contrast-guard className="text-sm leading-relaxed whitespace-pre-line" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                    {cleanMarkdown(sections.pros)}
                  </div>
                </div>
              )}
              {isConsVisible && sections?.cons && (
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
            <div className="flex items-center gap-2 text-black text-xs pt-2 flex-wrap">
              <Brain className="w-4 h-4 text-black" />
              JBJ Property Analyzer — AI-generated analysis based on current market data. Does not constitute financial advice.{" "}
              <Link to="/contact" className="text-black underline hover:no-underline">Contact our team</Link> for professional guidance.
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};
