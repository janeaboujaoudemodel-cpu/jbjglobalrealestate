import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  Home,
  TrendingUp,
  DollarSign,
  MapPin,
  Search,
  AlertCircle,
  Sparkles,
  ArrowUpRight,
  FileText,
  CheckCircle,
  Info,
  Database,
  Shield,
  MessageCircle,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { PrimaryCTA } from "@/components/tools/PrimaryCTA";
import { PoweredByJBJ } from "@/components/tools/PoweredByJBJ";
import { PremiumToolShell } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";
import { AnimatedShineCTA } from "@/components/tools/AnimatedShineCTA";
import { useGuidedRequiredFields } from "@/hooks/useGuidedRequiredFields";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";

const theme = toolThemes.burgundy;

const dubaiCommunities = [
  "Downtown Dubai",
  "Dubai Marina",
  "Palm Jumeirah",
  "Business Bay",
  "Jumeirah Beach Residence (JBR)",
  "Dubai Hills Estate",
  "Arabian Ranches",
  "Jumeirah Village Circle (JVC)",
  "Dubai Silicon Oasis",
  "DIFC",
  "Al Barsha",
  "Jumeirah Lakes Towers (JLT)",
  "Motor City",
  "Sports City",
  "Town Square",
  "Mirdif",
  "Al Nahda",
  "International City",
  "Discovery Gardens",
  "Deira",
  "Bur Dubai",
  "Karama",
  "Al Quoz",
  "Dubai South",
  "Damac Hills",
  "Dubai Creek Harbour",
  "Bluewaters Island",
  "City Walk",
  "La Mer",
  "Sobha Hartland",
];

const propertyTypes = [
  { value: "studio", label: "Studio" },
  { value: "1br", label: "1 Bedroom" },
  { value: "2br", label: "2 Bedroom" },
  { value: "3br", label: "3 Bedroom" },
  { value: "4br", label: "4 Bedroom" },
  { value: "5br+", label: "5+ Bedroom" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
];

interface RentalAnalysis {
  community: string;
  propertyType: string;
  estimatedRentMin: number;
  estimatedRentMax: number;
  averageRent: number;
  pricePerSqft: number;
  yearlyIncrease: string;
  marketTrend: string;
  demandLevel: string;
  insights: string[];
  disclaimer: string;
}

const WHITE_ICON_STYLE: React.CSSProperties = {
  color: "#FFFFFF",
  stroke: "#FFFFFF",
};

const FormLabel = ({
  icon: Icon,
  children,
  required,
}: {
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <Label
    className="flex items-center gap-2 mb-2 text-sm font-semibold"
    style={{ color: "#FFFFFF" }}
  >
    {Icon && (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-md"
        style={{
          background: theme.accentSoft,
          border: `1px solid ${theme.accentBorder}`,
        }}
      >
        <Icon className="w-3.5 h-3.5 allow-white ri-white-icon" data-no-contrast-guard style={WHITE_ICON_STYLE} />
      </span>
    )}
    <span>
      {children}
      {required && (
        <span style={{ color: theme.accent }} className="ml-0.5">
          *
        </span>
      )}
    </span>
  </Label>
);

const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  subtitle?: string;
}) => (
  <div className="flex items-center gap-3 mb-6">
    <span
      className="inline-flex items-center justify-center w-11 h-11 rounded-xl"
      style={{
        background: theme.accentSoft,
        border: `1px solid ${theme.accentBorder}`,
      }}
    >
      <Icon className="w-5 h-5 allow-white ri-white-icon" data-no-contrast-guard style={WHITE_ICON_STYLE} />
    </span>
    <div>
      <h2 className="text-xl font-bold" style={{ color: "#FFFFFF" }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm ri-dim" style={{ color: "rgba(255,255,255,0.82)" }}>
          {subtitle}
        </p>
      )}
    </div>
  </div>
);

const RentalIndex = () => {
  const [community, setCommunity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [size, setSize] = useState("");
  const [furnished, setFurnished] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RentalAnalysis | null>(null);
  const guide = useGuidedRequiredFields();

  const handleAnalyze = async () => {
    if (!guide.check([
      { id: "ri-community", label: "Community / Area", value: community },
      { id: "ri-propertyType", label: "Property Type", value: propertyType },
    ])) return;

    setIsLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("rental-index-analysis", {
        body: {
          community,
          propertyType,
          size: size ? parseInt(size) : null,
          furnished,
        },
      });

      if (error) {
        console.error("Function error:", error);
        toast.error("Failed to get rental analysis. Please try again.");
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setAnalysis(data);
      toast.success("Rental analysis complete!");
    } catch (err) {
      console.error("Error:", err);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <PremiumToolShell
      theme={theme}
      eyebrowIcon={TrendingUp}
      eyebrow="AI Rental Index"
      darkBody
      title={
        <>
          Dubai <span style={{ color: "#FFFFFF", textShadow: `0 0 24px ${theme.accent}` }}>Rental Index</span> Evaluator
        </>
      }
      subtitle="AI-powered rental estimates for any Dubai property. Live market rates, trends and investment context — sourced from DLD, RERA and our internal data fabric."
    >
      {/* Page-local hard contrast lock — mirrors /property-measurement pattern */}
      <style>{`
        .ri-root, .ri-root * { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
        .ri-root label, .ri-root p, .ri-root span, .ri-root h1, .ri-root h2, .ri-root h3, .ri-root h4, .ri-root a, .ri-root button, .ri-root div { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
        .ri-root .ri-dim { color: rgba(255,255,255,0.82) !important; -webkit-text-fill-color: rgba(255,255,255,0.82) !important; }
        .ri-root .ri-accent, .ri-root .ri-white-lock, .ri-root .ri-white-lock * { color: #FFFFFF !important; -webkit-text-fill-color: #FFFFFF !important; }
        /* Brighten icon tiles + svg icons (white over burgundy) */
        .ri-root [class*="rounded-md"][class*="w-6"][class*="h-6"],
        .ri-root [class*="rounded-xl"][class*="w-11"][class*="h-11"] {
          background: rgba(255,255,255,0.10) !important;
          border-color: rgba(255,255,255,0.45) !important;
        }
        .ri-root svg, .ri-root svg *, .ri-root .lucide, .ri-root [class*="lucide-"] {
          color: #FFFFFF !important;
          stroke: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          opacity: 1 !important;
        }
        .ri-root svg path, .ri-root svg circle, .ri-root svg line, .ri-root svg polyline, .ri-root svg rect {
          stroke: #FFFFFF !important;
        }
        .ri-card {
          background: linear-gradient(135deg, #3a0a14 0%, #1f0509 55%, #08020300 100%), #110204;
          border: 1px solid rgba(139,30,46,0.55) !important;
          border-radius: 1rem;
        }
        .ri-card-soft {
          background: linear-gradient(135deg, #2a070f 0%, #160305 100%);
          border: 1px solid rgba(139,30,46,0.45) !important;
          border-radius: 1rem;
        }
        .ri-input, .ri-root [data-radix-select-trigger], .ri-root input, .ri-root [role="combobox"] {
          background: rgba(10,2,4,0.65) !important;
          border: 1px solid rgba(255,255,255,0.30) !important;
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
        }
        .ri-input::placeholder, .ri-root input::placeholder { color: rgba(255,255,255,0.55) !important; -webkit-text-fill-color: rgba(255,255,255,0.55) !important; }
        .ri-input:focus, .ri-root input:focus, .ri-root [data-radix-select-trigger]:focus {
          border-color: rgba(255,255,255,0.70) !important;
          box-shadow: 0 0 0 3px rgba(139,30,46,0.45) !important;
          outline: none !important;
        }
        .ri-root .ri-tile {
          background: rgba(10,2,4,0.55);
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 0.75rem;
        }
        .ri-root .ri-tile-strong {
          background: linear-gradient(135deg, rgba(139,30,46,0.45), rgba(139,30,46,0.15));
          border: 1px solid rgba(255,255,255,0.55);
          border-radius: 0.75rem;
        }
        .ri-root .ri-disclaimer-wrap, .ri-root .ri-disclaimer-wrap *,
        .ri-root .ri-disclaimer-wrap :is(h1,h2,h3,h4,p,span,a,button,div) {
          color: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          opacity: 1 !important;
        }
        .ri-root .ri-disclaimer-wrap svg, .ri-root .ri-disclaimer-wrap svg * {
          color: #FFFFFF !important;
          stroke: #FFFFFF !important;
          -webkit-text-fill-color: #FFFFFF !important;
          opacity: 1 !important;
        }
      `}</style>

      <div className="ri-root max-w-5xl mx-auto space-y-8">
        <div className="flex justify-center">
          <PoweredByJBJ />
        </div>

        {/* Main form card — full width, no aside */}
        <div className="ri-card p-6 md:p-8 space-y-6">
          <SectionHeader
            icon={Search}
            title="Property Details"
            subtitle="Enter property information for rental analysis"
          />

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <FormLabel icon={MapPin} required>Community / Area</FormLabel>
              <Select value={community} onValueChange={setCommunity}>
                <SelectTrigger id="ri-community" className="ri-input h-12 rounded-xl">
                  <SelectValue placeholder="Select community" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {dubaiCommunities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FormLabel icon={Home} required>Property Type</FormLabel>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger id="ri-propertyType" className="ri-input h-12 rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FormLabel icon={Building}>Size (sq.ft) — Optional</FormLabel>
              <Input
                type="number"
                value={size}
                onChange={(e) => setSize(e.target.value)}
                placeholder="e.g., 1200"
                className="ri-input h-12 rounded-xl"
              />
            </div>

            <div>
              <FormLabel>Furnished Status — Optional</FormLabel>
              <Select value={furnished} onValueChange={setFurnished}>
                <SelectTrigger className="ri-input h-12 rounded-xl">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  <SelectItem value="furnished">Furnished</SelectItem>
                  <SelectItem value="semi-furnished">Semi-Furnished</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <AnimatedShineCTA
            tone="burgundy"
            onClick={handleAnalyze}
            loading={isLoading}
            fullWidth
          >
            {isLoading ? "Analysing Rental Data…" : "Get Rental Estimate"}
          </AnimatedShineCTA>
        </div>

        {/* Results */}
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="ri-card p-6 md:p-8 space-y-6"
          >
            <SectionHeader
              icon={DollarSign}
              title="Estimated Annual Rent"
              subtitle={`${analysis.community} • ${propertyTypes.find((t) => t.value === analysis.propertyType)?.label}`}
            />

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Minimum", value: formatCurrency(analysis.estimatedRentMin), highlight: false },
                { label: "Average", value: formatCurrency(analysis.averageRent), highlight: true },
                { label: "Maximum", value: formatCurrency(analysis.estimatedRentMax), highlight: false },
              ].map((m) => (
                <div key={m.label} className={`p-5 text-center ${m.highlight ? "ri-tile-strong" : "ri-tile"}`}>
                  <p className="text-xs uppercase tracking-wider mb-2 ri-accent">{m.label}</p>
                  <p className="text-2xl md:text-3xl font-bold">{m.value}</p>
                  <p className="text-xs mt-1 ri-dim">/ year</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {[
                { label: "Price per Sq.Ft", value: `AED ${analysis.pricePerSqft}` },
                { label: "Yearly Increase", value: analysis.yearlyIncrease },
                { label: "Market Trend", value: analysis.marketTrend },
              ].map((m) => (
                <div key={m.label} className="ri-tile p-4">
                  <p className="text-[10px] uppercase tracking-wider mb-1 font-semibold ri-accent">{m.label}</p>
                  <p className="text-base font-semibold">{m.value}</p>
                </div>
              ))}
            </div>

            <div className="ri-tile p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 ri-accent" />
                <h4 className="font-semibold">AI Market Insights</h4>
              </div>
              <ul className="space-y-2">
                {analysis.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0 ri-accent" />
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="ri-tile-strong p-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 ri-accent" />
                <div>
                  <h4 className="font-semibold mb-1">Important Disclaimer</h4>
                  <p className="text-sm leading-relaxed ri-dim">{analysis.disclaimer}</p>
                  <p className="text-xs mt-2 ri-dim">
                    For accurate official records, verify with Dubai Land Department (DLD), RERA and DXB Interact.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link to="/properties">
                <PrimaryCTA theme={theme} icon={ArrowUpRight} className="!w-auto">
                  Browse Properties
                </PrimaryCTA>
              </Link>
              <Link to="/contact">
                <button
                  className="inline-flex items-center gap-2 px-7 py-5 rounded-xl text-base font-bold transition-all"
                  style={{
                    background: "rgba(10,2,4,0.65)",
                    color: "#FBEAEC",
                    border: `1px solid ${theme.accent}`,
                  }}
                >
                  <FileText className="w-4 h-4" style={{ color: "#FFFFFF" }} />
                  Consult an Expert
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* Info cards — moved below form (no aside) */}
        <div className="grid md:grid-cols-2 gap-5">
          {[
            {
              icon: Info,
              title: "How It Works",
              body:
                "Our AI analyses current rental trends, historical data and market conditions to provide estimates. It considers location, property type, size and amenities to calculate rental ranges.",
            },
            {
              icon: Database,
              title: "Data Sources",
              body:
                "Estimates aggregate market signals from across the UAE. For official records, refer to Dubai Land Department (DLD) and RERA.",
            },
          ].map((c) => (
            <div key={c.title} className="ri-card-soft p-5">
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{
                    background: "rgba(139,30,46,0.35)",
                    border: "1px solid rgba(242,165,174,0.55)",
                  }}
                >
                  <c.icon className="w-5 h-5" style={{ color: "#FFFFFF" }} />
                </span>
                <div>
                  <h3 className="font-semibold mb-1">{c.title}</h3>
                  <p className="text-sm leading-relaxed ri-dim">{c.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="ri-disclaimer-wrap ri-card-soft p-5 md:p-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 border border-white/45 bg-white/10">
              <Shield className="w-5 h-5 allow-white ri-white-icon" data-no-contrast-guard style={WHITE_ICON_STYLE} />
            </span>
            <div>
              <p className="text-sm font-semibold mb-1">AI Tool Disclaimer</p>
              <p className="text-xs leading-relaxed ri-dim">
                AI outputs support information and comparisons based on available data and inputs.
                They are not guarantees and do not replace official documents or registration records.
              </p>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <p className="text-xs leading-relaxed ri-dim mb-3">
              For legal, mortgage, or visa guidance, contact our team to connect you with our licensed partners.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={getWhatsAppUrl("Hello, I used your AI tool and would like expert guidance.")}
                target="_blank"
                rel="noopener noreferrer"
                data-no-contrast-guard
                className="allow-white inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border border-white/45 bg-white/10 hover:bg-white/15"
              >
                <MessageCircle className="w-3.5 h-3.5 allow-white ri-white-icon" data-no-contrast-guard style={WHITE_ICON_STYLE} />
                WhatsApp Us
              </a>
              <a
                href={`tel:${CONTACT_INFO.phone}`}
                data-no-contrast-guard
                className="allow-white inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors border border-white/45 bg-white/10 hover:bg-white/15"
              >
                <Phone className="w-3.5 h-3.5 allow-white ri-white-icon" data-no-contrast-guard style={WHITE_ICON_STYLE} />
                {CONTACT_INFO.phone}
              </a>
            </div>
          </div>
        </div>
      </div>
    </PremiumToolShell>

  );
};

export default RentalIndex;
