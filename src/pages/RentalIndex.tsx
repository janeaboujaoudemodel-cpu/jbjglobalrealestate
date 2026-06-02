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
} from "lucide-react";
import { toast } from "sonner";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import { PrimaryCTA } from "@/components/tools/PrimaryCTA";
import { PoweredByJBJ } from "@/components/tools/PoweredByJBJ";
import { PremiumToolShell } from "@/components/tools/PremiumToolShell";
import { ToolSectionDivider } from "@/components/tools/ToolSectionDivider";
import { toolThemes, TOOL_INK } from "@/components/tools/toolThemes";
import { AnimatedShineCTA } from "@/components/tools/AnimatedShineCTA";
import { useGuidedRequiredFields } from "@/hooks/useGuidedRequiredFields";

const theme = toolThemes.emerald;

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
    style={{ color: TOOL_INK }}
  >
    {Icon && (
      <span
        className="inline-flex items-center justify-center w-6 h-6 rounded-md"
        style={{
          background: theme.accentSoft,
          border: `1px solid ${theme.accentBorder}`,
        }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: theme.accent }} />
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
      <Icon className="w-5 h-5" style={{ color: theme.accent }} />
    </span>
    <div>
      <h2 className="text-xl font-bold" style={{ color: TOOL_INK }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm" style={{ color: "rgba(26,26,26,0.65)" }}>
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
      title={
        <>
          Dubai <span style={{ color: "#FFFFFF", textShadow: `0 0 24px ${theme.accent}` }}>Rental Index</span> Evaluator
        </>
      }
      subtitle="AI-powered rental estimates for any Dubai property. Live market rates, trends and investment context — sourced from DLD, RERA and our internal data fabric."
    >
      <div className="flex justify-center mb-8">
        <PoweredByJBJ />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Form (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <SectionHeader
            icon={Search}
            title="Property Details"
            subtitle="Enter property information for rental analysis"
          />

          <div className="grid md:grid-cols-2 gap-5 mb-6">
            <div>
              <FormLabel icon={MapPin} required>
                Community / Area
              </FormLabel>
              <Select value={community} onValueChange={setCommunity}>
                <SelectTrigger id="ri-community" className="h-12 rounded-xl bg-white">
                  <SelectValue placeholder="Select community" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {dubaiCommunities.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <FormLabel icon={Home} required>
                Property Type
              </FormLabel>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="h-12 rounded-xl bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
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
                className="h-12 rounded-xl bg-white"
                style={{ color: TOOL_INK }}
              />
            </div>

            <div>
              <FormLabel>Furnished Status — Optional</FormLabel>
              <Select value={furnished} onValueChange={setFurnished}>
                <SelectTrigger className="h-12 rounded-xl bg-white">
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

          <PrimaryCTA
            theme={theme}
            onClick={handleAnalyze}
            disabled={isLoading || !community || !propertyType}
            icon={isLoading ? Sparkles : TrendingUp}
          >
            {isLoading ? "Analysing Rental Data…" : "Get Rental Estimate"}
          </PrimaryCTA>

          {/* Results */}
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <ToolSectionDivider theme={theme} />

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
                  <div
                    key={m.label}
                    className="rounded-xl p-5 text-center"
                    style={{
                      background: m.highlight ? theme.accentSoft : "#FFFFFF",
                      border: `1px solid ${m.highlight ? theme.accentBorder : "rgba(0,0,0,0.06)"}`,
                    }}
                  >
                    <p className="text-xs uppercase tracking-wider mb-2" style={{ color: theme.accent }}>
                      {m.label}
                    </p>
                    <p className="text-2xl md:text-3xl font-bold" style={{ color: TOOL_INK }}>
                      {m.value}
                    </p>
                    <p className="text-xs mt-1" style={{ color: "rgba(26,26,26,0.55)" }}>
                      / year
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                {[
                  { label: "Price per Sq.Ft", value: `AED ${analysis.pricePerSqft}` },
                  { label: "Yearly Increase", value: analysis.yearlyIncrease },
                  { label: "Market Trend", value: analysis.marketTrend },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl p-4"
                    style={{ background: "#FFFFFF", border: `1px solid ${theme.accentBorder}` }}
                  >
                    <p
                      className="text-[10px] uppercase tracking-wider mb-1 font-semibold"
                      style={{ color: theme.accent }}
                    >
                      {m.label}
                    </p>
                    <p className="text-base font-semibold" style={{ color: TOOL_INK }}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              <div
                className="rounded-xl p-5"
                style={{ background: "#FFFFFF", border: `1px solid ${theme.accentBorder}` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4" style={{ color: theme.accent }} />
                  <h4 className="font-semibold" style={{ color: TOOL_INK }}>
                    AI Market Insights
                  </h4>
                </div>
                <ul className="space-y-2">
                  {analysis.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle
                        className="w-4 h-4 mt-0.5 flex-shrink-0"
                        style={{ color: theme.accent }}
                      />
                      <span className="text-sm" style={{ color: "rgba(26,26,26,0.85)" }}>
                        {insight}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className="rounded-xl p-5"
                style={{ background: theme.accentSoft, border: `1px solid ${theme.accentBorder}` }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle
                    className="w-5 h-5 mt-0.5 flex-shrink-0"
                    style={{ color: theme.accent }}
                  />
                  <div>
                    <h4 className="font-semibold mb-1" style={{ color: TOOL_INK }}>
                      Important Disclaimer
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(26,26,26,0.75)" }}>
                      {analysis.disclaimer}
                    </p>
                    <p className="text-xs mt-2" style={{ color: "rgba(26,26,26,0.55)" }}>
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
                      background: "#FFFFFF",
                      color: TOOL_INK,
                      border: `1px solid ${theme.accent}`,
                    }}
                  >
                    <FileText className="w-4 h-4" style={{ color: theme.accent }} />
                    Consult an Expert
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right: Side cards (1/3) */}
        <aside className="space-y-5">
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
            <div
              key={c.title}
              className="rounded-xl p-5"
              style={{
                background: "#FFFFFF",
                border: `1px solid ${theme.accentBorder}`,
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="inline-flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                  style={{
                    background: theme.accentSoft,
                    border: `1px solid ${theme.accentBorder}`,
                  }}
                >
                  <c.icon className="w-5 h-5" style={{ color: theme.accent }} />
                </span>
                <div>
                  <h3 className="font-semibold mb-1" style={{ color: TOOL_INK }}>
                    {c.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(26,26,26,0.72)" }}>
                    {c.body}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <LegalDisclaimer variant="ai-tools" />
        </aside>
      </div>
    </PremiumToolShell>
  );
};

export default RentalIndex;
