import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Wallet } from "lucide-react";
import { Calculator, TrendingUp, Calendar, Percent, DollarSign, Info, Building2, Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import MortgageAIAssistant from "@/components/mortgage/MortgageAIAssistant";
import MortgageParityPanel from "@/components/mortgage/MortgageParityPanel";

interface MortgageProject {
  id: string;
  name: string;
  slug: string | null;
  location: string | null;
  area_name?: string | null;
  price_from: number | null;
  developer_name: string | null;
  developer?: { id: string; name: string; logo_url: string | null } | null;
}

interface MortgageCalculatorProps {
  defaultPrice?: number;
  compact?: boolean;
  showAssistant?: boolean;
  showHeading?: boolean;
  themeVariant?: "default" | "navy";
  context?: {
    projectName?: string;
    location?: string;
  };
}

const getRangePercent = (value: number, min: number, max: number) => {
  if (max <= min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
};

const PROPERTY_PRICE_MIN = 500_000;
const PROPERTY_PRICE_MAX = 500_000_000;
const PROPERTY_PRICE_STEP = 500_000;

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};

const clampPropertyPrice = (value: number) => {
  const stepped = Math.round(value / PROPERTY_PRICE_STEP) * PROPERTY_PRICE_STEP;
  return clampNumber(stepped, PROPERTY_PRICE_MIN, PROPERTY_PRICE_MAX);
};

interface MortgageRangeProps {
  value: number;
  min: number;
  max: number;
  step: number;
  ariaLabel: string;
  isNavy: boolean;
  onChange: (value: number) => void;
}

const MortgageRange = ({ value, min, max, step, ariaLabel, isNavy, onChange }: MortgageRangeProps) => {
  const progress = getRangePercent(value, min, max);
  const fill = "linear-gradient(90deg, #064E3B 0%, #042C1C 58%, #000000 100%)";
  const track = isNavy ? "rgba(255,255,255,0.12)" : "#EFE6D6";

  return (
    <input
      type="range"
      data-mortgage-slider={ariaLabel}
      data-no-contrast-guard
      min={min}
      max={max}
      step={step}
      value={value}
      aria-label={ariaLabel}
      aria-valuetext={`${value}`}
      onInput={(event) => onChange(clampNumber(event.currentTarget.valueAsNumber, min, max))}
      onChange={(event) => onChange(clampNumber(event.currentTarget.valueAsNumber, min, max))}
      className="mortgage-range-input w-full"
      style={
        {
          ["--mortgage-range-progress" as any]: `${progress}%`,
          ["--mortgage-range-fill" as any]: fill,
          ["--mortgage-range-track" as any]: track,
          ["--mortgage-range-thumb" as any]: "#FFFFFF",
          ["--mortgage-range-thumb-shadow" as any]: "0 0 0 1px rgba(255,255,255,0.72), 0 0 18px rgba(6,78,59,0.65), 0 4px 14px rgba(4,44,28,0.45)",
        } as CSSProperties
      }
    />
  );
};

const MortgageCalculator = ({
  defaultPrice = 2000000,
  compact = false,
  showAssistant = false,
  showHeading = true,
  themeVariant = "default",
  context,
}: MortgageCalculatorProps) => {
  const [propertyPrice, setPropertyPrice] = useState(() => clampPropertyPrice(defaultPrice));
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [interestRate, setInterestRate] = useState(4.5);
  const [loanTermYears, setLoanTermYears] = useState(25);
  const [userTouchedPrice, setUserTouchedPrice] = useState(false);
  const [projectQuery, setProjectQuery] = useState("");
  const [projectSearchOpen, setProjectSearchOpen] = useState(false);
  const [projectResults, setProjectResults] = useState<MortgageProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState<MortgageProject | null>(null);
  const isNavy = themeVariant === "navy";

  // Dark slider wrapper style — injects emerald CSS vars so every slider
  // primitive picks up the matching emerald glow used by
  // the Monthly card. CSS custom properties inherit through the DOM and
  // are resolved by the inline `style="background: var(--slider-range-bg, …)"`
  // on the Slider Range/Thumb.
  const navySliderWrapperStyle = {
    background:
      "linear-gradient(135deg, #064E3B 0%, #042c1c 62%, #000000 100%)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "inset 0 0 22px rgba(6,78,59,0.18)",
    // Slider theme overrides (cascade into <Slider />)
    ["--slider-track-bg" as any]: "rgba(255,255,255,0.10)",
    ["--slider-range-bg" as any]:
      "linear-gradient(90deg, #064E3B 0%, #042c1c 100%)",
    ["--slider-thumb-bg" as any]:
      "#FFFFFF",
    ["--slider-thumb-shadow" as any]:
      "0 0 0 2px #064E3B inset, 0 0 0 1px rgba(255,255,255,0.65), 0 0 18px rgba(6,78,59,0.65), 0 4px 14px rgba(4,44,28,0.45)",
  } as CSSProperties;

  useEffect(() => {
    if (!projectSearchOpen) return;

    let cancelled = false;
    const loadProjects = async () => {
      setProjectsLoading(true);
      const cleanedQuery = projectQuery.trim().replace(/[,%()]/g, " ");
      let query = supabase
        .from("projects")
        .select("id,name,slug,location,area_name,price_from,developer_name,developer:developers(id,name,logo_url)")
        .eq("is_published", true)
        .or("listing_kind.is.null,listing_kind.neq.leasing")
        .not("price_from", "is", null);

      if (cleanedQuery.length > 0) {
        query = query.or(`name.ilike.%${cleanedQuery}%,developer_name.ilike.%${cleanedQuery}%`);
      }

      const { data, error } = await query.order("name", { ascending: true }).limit(12);
      if (!cancelled) {
        setProjectResults(error ? [] : ((data || []) as unknown as MortgageProject[]));
        setProjectsLoading(false);
      }
    };

    const timer = window.setTimeout(loadProjects, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [projectQuery, projectSearchOpen]);

  // Sync propertyPrice when defaultPrice becomes available from async prop
  // (e.g., project.price_from loads after the first render). Stops syncing
  // once the user has touched the slider so we never overwrite their input.
  useEffect(() => {
    const nextDefaultPrice = clampPropertyPrice(defaultPrice);
    if (!userTouchedPrice && defaultPrice && nextDefaultPrice !== propertyPrice) {
      setPropertyPrice(nextDefaultPrice);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultPrice]);

  const handlePriceChange = (value: number) => {
    setUserTouchedPrice(true);
    setPropertyPrice(clampPropertyPrice(value));
  };

  const handleProjectSelect = (project: MortgageProject) => {
    setSelectedProject(project);
    setProjectSearchOpen(false);
    setProjectQuery("");
    if (project.price_from) {
      setUserTouchedPrice(false);
      setPropertyPrice(clampPropertyPrice(Number(project.price_from)));
    }
  };

  const calculations = useMemo(() => {
    const downPayment = (propertyPrice * downPaymentPercent) / 100;
    const loanAmount = propertyPrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;

    let monthlyPayment = 0;
    if (monthlyRate > 0) {
      monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                       (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    } else {
      monthlyPayment = loanAmount / numberOfPayments;
    }

    const totalPayment = monthlyPayment * numberOfPayments;
    const totalInterest = totalPayment - loanAmount;
    const interestPercentOfLoan = loanAmount > 0 ? (totalInterest / loanAmount) * 100 : 0;

    return {
      downPayment,
      loanAmount,
      monthlyPayment,
      totalPayment,
      totalInterest,
      interestPercentOfLoan,
    };
  }, [propertyPrice, downPaymentPercent, interestRate, loanTermYears]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyAbbreviated = (value: number) => {
    if (value >= 1_000_000_000) return `AED ${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `AED ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `AED ${(value / 1_000).toFixed(0)}K`;
    return `AED ${value}`;
  };

  const formatNumberWithCommas = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  const parseFormattedNumber = (value: string) => {
    const parsed = parseInt(value.replace(/,/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const projectLocation = selectedProject?.area_name || selectedProject?.location;

  const projectSelector = isNavy ? (
    <div className="relative mb-5 md:mb-6" data-allow-dark-cta data-no-contrast-guard>
      <p className="allow-white text-xs font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: "rgba(255,255,255,0.72)" }}>
        Check payments by project
      </p>
      {selectedProject ? (
        <div
          className="allow-white flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{
            background: "linear-gradient(135deg, rgba(30,78,140,0.52), rgba(8,21,43,0.92))",
            border: "1px solid rgba(147,197,253,0.55)",
            boxShadow: "0 0 24px rgba(184,149,85,0.18)",
          }}
        >
          {selectedProject.developer?.logo_url ? (
            <img src={selectedProject.developer.logo_url} alt="" className="w-10 h-10 rounded-xl object-contain bg-white/90 p-1"  loading="lazy" decoding="async" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(184,149,85,0.18)" }}>
              <Building2 className="w-5 h-5 allow-white" style={{ color: "#BFDBFE" }} />
            </div>
          )}
          <div className="flex-1 min-w-0 text-left">
            <p className="allow-white font-semibold truncate" style={{ color: "#FFFFFF" }}>{selectedProject.name}</p>
            <p className="allow-white text-xs truncate" style={{ color: "rgba(255,255,255,0.68)" }}>
              {selectedProject.developer?.name || selectedProject.developer_name || "Developer"}{projectLocation ? ` · ${projectLocation}` : ""} · {formatCurrencyAbbreviated(Number(selectedProject.price_from || propertyPrice))}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedProject(null)}
            className="allow-white p-2 rounded-full transition-colors hover:bg-white/10"
            style={{ color: "#FFFFFF" }}
            aria-label="Change selected project"
          >
            <X className="w-4 h-4 allow-white" />
          </button>
        </div>
      ) : (
        <>
          <div
            className="allow-white flex items-center gap-3 px-1 py-1"
            style={{ background: "transparent", border: 0, boxShadow: "none" }}
          >
            <Search className="w-5 h-5 allow-white" style={{ color: "#BFDBFE" }} />
            <input
              value={projectQuery}
              onChange={(e) => { setProjectQuery(e.target.value); setProjectSearchOpen(true); }}
              onFocus={() => setProjectSearchOpen(true)}
              placeholder="Search by project or developer name"
              data-no-contrast-guard
              className="allow-white flex-1 bg-transparent outline-none text-sm placeholder:!text-white/65"
              style={{ color: "#FFFFFF", border: 0, boxShadow: "none", outline: "none", background: "transparent" }}
            />

            {projectsLoading && <Loader2 className="w-4 h-4 animate-spin allow-white" style={{ color: "#BFDBFE" }} />}
          </div>
          {projectSearchOpen && (
            <div
              className="absolute z-30 mt-2 w-full rounded-2xl overflow-hidden"
              style={{
                background: "rgba(4,13,28,0.98)",
                border: "1px solid rgba(147,197,253,0.35)",
                boxShadow: "0 20px 50px rgba(0,0,0,0.45), 0 0 24px rgba(184,149,85,0.20)",
              }}
            >
              {!projectsLoading && projectResults.length === 0 && (
                <div className="allow-white p-4 text-sm" style={{ color: "rgba(255,255,255,0.62)" }}>No projects found.</div>
              )}
              {projectResults.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleProjectSelect(project)}
                  className="allow-white w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-white/10"
                  data-no-contrast-guard
                >
                  {project.developer?.logo_url ? (
                    <img src={project.developer.logo_url} alt="" className="w-9 h-9 rounded-lg object-contain bg-white/90 p-1"  loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(184,149,85,0.16)" }}>
                      <Building2 className="w-4 h-4 allow-white" style={{ color: "#BFDBFE" }} />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="allow-white text-sm font-medium truncate" style={{ color: "#FFFFFF" }}>{project.name}</p>
                    <p className="allow-white text-xs truncate" style={{ color: "rgba(255,255,255,0.62)" }}>
                      {project.developer?.name || project.developer_name || "Developer"}{project.area_name || project.location ? ` · ${project.area_name || project.location}` : ""} · {formatCurrencyAbbreviated(Number(project.price_from || 0))}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  ) : null;

  if (compact) {
    return (
      <div className="max-w-5xl mx-auto" data-mortgage-variant={themeVariant}>
        {showHeading && (
        <div className="text-center mb-6 md:mb-8">
          <h3 className="text-[#0A0A0A] text-2xl sm:text-3xl md:text-4xl font-bold whitespace-nowrap">
            Mortgage <span className={isNavy ? "text-transparent bg-clip-text" : ""} style={isNavy ? { backgroundImage: "linear-gradient(135deg, #FFFFFF 0%, #6EE7B7 45%, #10B981 100%)", WebkitBackgroundClip: "text" } : undefined}>Calculator</span>
          </h3>
          <p className="text-[#1A1A1A]/70 mt-2 md:mt-3 max-w-lg mx-auto text-sm md:text-base">
            Estimate your monthly payments and explore financing options.
          </p>
        </div>
        )}

        {projectSelector}

        {/* Interactive Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Property Price Slider */}
          <div className="bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 p-4" style={isNavy ? navySliderWrapperStyle : undefined}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                Property Price
              </span>
              <span className="text-[#1A1A1A] font-bold text-sm">{formatCurrencyAbbreviated(propertyPrice)}</span>
            </div>
            <MortgageRange value={propertyPrice} onChange={handlePriceChange} min={PROPERTY_PRICE_MIN} max={PROPERTY_PRICE_MAX} step={PROPERTY_PRICE_STEP} ariaLabel="Property Price" isNavy={isNavy} />
            <div className="flex justify-between text-[10px] text-[#1A1A1A]/70 mt-1">
              <span>AED 500K</span>
              <span>AED 500M</span>
            </div>
          </div>

          {/* Down Payment Slider */}
          <div className="bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 p-4" style={isNavy ? navySliderWrapperStyle : undefined}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                Down Payment
              </span>
              <span className="text-[#1A1A1A] font-bold text-sm">{downPaymentPercent}% — {formatCurrencyAbbreviated(calculations.downPayment)}</span>
            </div>
            <MortgageRange value={downPaymentPercent} onChange={setDownPaymentPercent} min={5} max={80} step={5} ariaLabel="Down Payment" isNavy={isNavy} />
            <div className="flex justify-between text-[10px] text-[#1A1A1A]/70 mt-1">
              <span>5%</span>
              <span>80%</span>
            </div>
          </div>

          {/* Interest Rate Slider */}
          <div className="bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 p-4" style={isNavy ? navySliderWrapperStyle : undefined}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                Interest Rate
              </span>
              <span className="text-[#1A1A1A] font-bold text-sm">{interestRate}%</span>
            </div>
            <MortgageRange value={interestRate} onChange={setInterestRate} min={2} max={10} step={0.25} ariaLabel="Interest Rate" isNavy={isNavy} />
            <div className="flex justify-between text-[10px] text-[#1A1A1A]/70 mt-1">
              <span>2%</span>
              <span>10%</span>
            </div>
          </div>

          {/* Loan Term Slider */}
          <div className="bg-[#F7F2EA] rounded-xl border border-[#B89555]/30 p-4" style={isNavy ? navySliderWrapperStyle : undefined}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#1A1A1A]/70" />
                Loan Term
              </span>
              <span className="text-[#1A1A1A] font-bold text-sm">{loanTermYears} Years</span>
            </div>
            <MortgageRange value={loanTermYears} onChange={setLoanTermYears} min={5} max={30} step={5} ariaLabel="Loan Term" isNavy={isNavy} />
            <div className="flex justify-between text-[10px] text-[#1A1A1A]/70 mt-1">
              <span>5 Years</span>
              <span>30 Years</span>
            </div>
          </div>
        </div>

        {/* Results — single premium horizontal row at all breakpoints */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 items-stretch max-w-4xl mx-auto">
          {/* Monthly Payment — featured */}
          <div
            className="rounded-xl p-3 md:p-4 text-center flex flex-col justify-center md:scale-[1.03]"
            style={{
              background: isNavy
                ? "linear-gradient(135deg, #FFFFFF 0%, #D1FAE5 18%, #047857 58%, #031B12 100%)"
                : "linear-gradient(135deg, #FDFBF7 0%, #F7F1E6 50%, #ECE2D2 100%)",
              border: isNavy ? "1px solid rgba(52,211,153,0.78)" : "1px solid rgba(184,149,85,0.55)",
              boxShadow: isNavy
                ? "0 0 0 1px rgba(52,211,153,0.35), 0 12px 36px rgba(4,120,87,0.42), inset 0 1px 0 rgba(255,255,255,0.55)"
                : "0 6px 20px rgba(184,149,85,0.18), inset 0 1px 0 rgba(255,255,255,0.9)",
            }}
          >
            <p className="text-[9px] md:text-[10px] mb-1 uppercase tracking-[0.14em] text-[#1A1A1A]/60 font-semibold leading-tight" style={isNavy ? { color: "rgba(255,255,255,0.82)" } : undefined}>
              Monthly
            </p>
            <p className="font-bold text-lg md:text-2xl text-[#1A1A1A] tabular-nums leading-tight break-words" style={isNavy ? { color: "#FFFFFF", textShadow: "0 2px 14px rgba(0,0,0,0.55)" } : undefined}>
              {formatCurrencyAbbreviated(calculations.monthlyPayment)}
            </p>
            <p className="text-[9px] md:text-[10px] mt-0.5 text-[#1A1A1A]/60" style={isNavy ? { color: "rgba(255,255,255,0.76)" } : undefined}>
              {loanTermYears}y
            </p>
          </div>

          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-3 md:p-4 text-center shadow-sm flex flex-col justify-center">
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mb-1 uppercase tracking-wider leading-tight">Down Payment</p>
            <p className="text-[#1A1A1A] font-bold text-[13px] md:text-lg tabular-nums break-words">{formatCurrencyAbbreviated(calculations.downPayment)}</p>
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mt-0.5">{downPaymentPercent}%</p>
          </div>

          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-3 md:p-4 text-center shadow-sm flex flex-col justify-center">
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mb-1 uppercase tracking-wider leading-tight">Loan Amount</p>
            <p className="text-[#1A1A1A] font-bold text-[13px] md:text-lg tabular-nums break-words">{formatCurrencyAbbreviated(calculations.loanAmount)}</p>
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mt-0.5">{100 - downPaymentPercent}% fin.</p>
          </div>

          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-xl p-3 md:p-4 text-center shadow-sm flex flex-col justify-center">
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mb-1 uppercase tracking-wider leading-tight">Total Cost</p>
            <p className="text-[#1A1A1A] font-bold text-[13px] md:text-lg tabular-nums break-words">{formatCurrencyAbbreviated(calculations.totalPayment)}</p>
            <p className="text-[#1A1A1A]/60 text-[9px] md:text-[10px] mt-0.5 tabular-nums">+{formatCurrencyAbbreviated(calculations.totalInterest)}</p>
          </div>
        </div>

        <MortgageParityPanel
          propertyPrice={propertyPrice}
          loanAmount={calculations.loanAmount}
          monthlyPayment={calculations.monthlyPayment}
          downPaymentPercent={downPaymentPercent}
          interestRate={interestRate}
          loanTermYears={loanTermYears}
          isNavy={isNavy}
        />

      </div>
    );
  }


  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
      {/* Header - Gold Premium Style - Centered & Bigger */}
      {!compact && (
        <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 border-b border-[#B89555]/30 p-6 lg:p-8">
          <div className="flex flex-col items-center text-center">
            <div data-emerald-action="true" className="jj-emerald-action w-14 h-14 lg:w-16 lg:h-16 rounded-xl flex items-center justify-center mb-4">
              <Calculator className="w-7 h-7 lg:w-8 lg:h-8" style={{ color: '#FFFFFF' }} />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-foreground">
              Mortgage Calculator
            </h3>
            <p className="text-muted-foreground text-sm lg:text-base mt-2">Estimate your monthly payments</p>
          </div>
        </div>
      )}

      <div className="p-4 lg:p-6">
        <div className="grid lg:grid-cols-[2fr_3fr] gap-6 lg:gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            {/* Property Price */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#1A1A1A]" />
                  Property Price
                </Label>
                <span className="text-[#1A1A1A] font-semibold">{formatCurrency(propertyPrice)}</span>
              </div>
              <Input
                type="text"
                value={formatNumberWithCommas(propertyPrice)}
                onChange={(e) => handlePriceChange(parseFormattedNumber(e.target.value))}
                className="bg-[#FDFBF7] border border-[#B89555]/55 text-[#1A1A1A] focus:border-[#B89555]"
              />

              <div className="py-4">
                <MortgageRange value={propertyPrice} onChange={handlePriceChange} min={PROPERTY_PRICE_MIN} max={PROPERTY_PRICE_MAX} step={PROPERTY_PRICE_STEP} ariaLabel="Property Price" isNavy={isNavy} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground -mt-1">
                <span>AED 500K</span>
                <span>AED 500M</span>
              </div>
            </div>

            {/* Down Payment */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground flex items-center gap-2">
                  <Percent className="w-4 h-4 text-[#1A1A1A]" />
                  Down Payment
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="bg-popover border-border text-popover-foreground">
                        <p>UAE typically requires 20-25% for residents</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <span className="text-[#1A1A1A] font-semibold">{downPaymentPercent}%</span>
              </div>
              <div className="py-4">
                <MortgageRange value={downPaymentPercent} onChange={setDownPaymentPercent} min={5} max={80} step={5} ariaLabel="Down Payment" isNavy={isNavy} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground -mt-1">
                <span>5%</span>
                <span>{formatCurrency(calculations.downPayment)}</span>
                <span>80%</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#1A1A1A]" />
                  Interest Rate (Annual)
                </Label>
                <span className="text-[#1A1A1A] font-semibold">{interestRate}%</span>
              </div>
              <div className="py-4">
                <MortgageRange value={interestRate} onChange={setInterestRate} min={2} max={10} step={0.25} ariaLabel="Interest Rate" isNavy={isNavy} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground -mt-1">
                <span>2%</span>
                <span>10%</span>
              </div>
            </div>

            {/* Loan Term */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#1A1A1A]" />
                  Loan Term
                </Label>
                <span className="text-[#1A1A1A] font-semibold">{loanTermYears} Years</span>
              </div>
              <div className="py-4">
                <MortgageRange value={loanTermYears} onChange={setLoanTermYears} min={5} max={30} step={5} ariaLabel="Loan Term" isNavy={isNavy} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground -mt-1">
                <span>5 Years</span>
                <span>30 Years</span>
              </div>
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-4 lg:space-y-6">
            {/* Monthly Payment - Featured Gold Style - Responsive sizing */}
            <div className="bg-gradient-to-br from-gold/20 via-gold/10 to-transparent border border-[#B89555]/30 rounded-xl p-3 lg:p-6 text-center">
              <p className="text-muted-foreground text-xs lg:text-sm mb-1 lg:mb-2">Estimated Monthly Payment</p>
              <p 
                className="text-xl sm:text-2xl lg:text-4xl xl:text-5xl font-bold text-[#1A1A1A] break-words"
              >
                {formatCurrency(calculations.monthlyPayment)}
              </p>
              <p className="text-muted-foreground text-[10px] lg:text-xs mt-1 lg:mt-2">per month for {loanTermYears} years</p>
            </div>

            {/* 6 Champagne Summary Cards - 3x2 Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-5">
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div data-emerald-action="true" className="jj-emerald-action w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Property Price (100%)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(propertyPrice)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div data-emerald-action="true" className="jj-emerald-action w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <Percent className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Down Payment ({downPaymentPercent}%)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.downPayment)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div data-emerald-action="true" className="jj-emerald-action w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Loan Amount ({100 - downPaymentPercent}%)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.loanAmount)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div data-emerald-action="true" className="jj-emerald-action w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <Calculator className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Monthly Payment</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.monthlyPayment)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div data-emerald-action="true" className="jj-emerald-action w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Interest ({interestRate}% · {loanTermYears}yr)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.totalInterest)}</p>
              </div>
              <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border border-[#B89555]/40 rounded-xl p-4 lg:p-5 text-center shadow-md min-w-0">
                <div data-emerald-action="true" className="jj-emerald-action w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <Wallet className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                </div>
                <p className="text-[#1A1A1A]/60 text-[10px] lg:text-xs mb-2 uppercase tracking-wider">Total Cost (All-In)</p>
                <p className="text-[#1A1A1A] font-bold text-xs lg:text-sm xl:text-base whitespace-nowrap">{formatCurrency(calculations.totalPayment)}</p>
              </div>
            </div>

            {/* Payment Visualization */}
            <div className="space-y-2 pt-2">
              <p className="text-muted-foreground text-sm">Payment Breakdown</p>
              <div className="h-4 rounded-full overflow-hidden bg-muted/30 flex border border-[#B89555]/20">
                <div 
                  className="transition-all duration-500"
                  style={{ 
                    width: `${(calculations.loanAmount / calculations.totalPayment) * 100}%`,
                    background: 'linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)'
                  }}
                />
                <div 
                  className="transition-all duration-500 bg-[#EFE6D6]/40"
                  style={{ width: `${(calculations.totalInterest / calculations.totalPayment) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span 
                    className="w-2.5 h-2.5 rounded-full border border-[#B89555]/30" 
                    style={{ background: 'linear-gradient(135deg, #F7F1E6 0%, #ECE2D2 50%, #D8C7A6 100%)' }}
                  />
                  <span className="text-muted-foreground">Principal ({((calculations.loanAmount / calculations.totalPayment) * 100).toFixed(0)}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EFE6D6]/40 border border-[#B89555]/30" />
                  <span className="text-muted-foreground">Interest ({((calculations.totalInterest / calculations.totalPayment) * 100).toFixed(0)}%)</span>
                </span>
              </div>
            </div>

            <MortgageParityPanel
              propertyPrice={propertyPrice}
              loanAmount={calculations.loanAmount}
              monthlyPayment={calculations.monthlyPayment}
              downPaymentPercent={downPaymentPercent}
              interestRate={interestRate}
              loanTermYears={loanTermYears}
              isNavy={isNavy}
            />



            <p className="text-muted-foreground text-xs text-center pt-2">
              *Estimates are for illustrative purposes only. Actual rates may vary based on bank policies and eligibility.
            </p>

            {/* Request Mortgage Introduction CTA */}
            <div className="mt-6 pt-4 border-t border-[#B89555]/20">
              <p className="text-center text-muted-foreground text-sm mb-3">Prefer a Mortgage Advisor Through Our Licensed Partners?</p>
              <a
                href="/contact"
                data-emerald-action="true"
                data-surface="emerald"
                data-emerald="true"
                className="jj-emerald-action w-full h-12 inline-flex items-center justify-center gap-2 rounded-md text-base font-semibold transition-colors shadow-sm"
                style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              >
                <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Request Mortgage Introduction</span>
              </a>
            </div>

          </div>
        </div>

        {showAssistant && (
          <div className="mt-6">
            <MortgageAIAssistant
              context={{
                propertyPrice,
                downPaymentPercent,
                interestRate,
                loanTermYears,
                downPayment: calculations.downPayment,
                loanAmount: calculations.loanAmount,
                monthlyPayment: calculations.monthlyPayment,
                totalInterest: calculations.totalInterest,
                totalPayment: calculations.totalPayment,
                projectName: context?.projectName,
                location: context?.location,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MortgageCalculator;
