import { 
  CreditCard, Video, Calculator, Stamp, CreditCard as BusinessCard, 
  FileText, Briefcase, Image, Pen, Globe, Award, UserCheck, Palette, Sparkles
} from "lucide-react";
import BusinessSuiteToolCard from "@/components/business-suite/BusinessSuiteToolCard";

const corporateTools = [
  {
    icon: Stamp,
    title: "AI Stamp Generator",
    description: "Create bilingual professional company stamps and seals with AI. Export as SVG, PNG, or PDF.",
    href: "/toolkit/stamp-generator",
    colorClass: "text-gold",
    borderColorClass: "border-gold/40",
    gradientFrom: "from-amber-700",
    gradientTo: "to-yellow-600",
  },
  {
    icon: BusinessCard,
    title: "Business Card Designer",
    description: "Design premium digital and print-ready business cards with 7 shapes and custom branding.",
    href: "/toolkit/corporate-suite/business-card",
    colorClass: "text-gold",
    borderColorClass: "border-gold/40",
    gradientFrom: "from-gold",
    gradientTo: "to-amber-600",
  },
  {
    icon: Palette,
    title: "Logo Maker",
    description: "Generate AI-powered company logos with custom colors, fonts, and export options.",
    href: "/toolkit/corporate-suite/logo",
    colorClass: "text-purple-600",
    borderColorClass: "border-purple-400/40",
    gradientFrom: "from-purple-600",
    gradientTo: "to-indigo-600",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Build professional CVs with 12 international templates and AI-powered summary generation.",
    href: "/toolkit/corporate-suite/cv-builder",
    colorClass: "text-emerald-700",
    borderColorClass: "border-emerald-400/40",
    gradientFrom: "from-emerald-600",
    gradientTo: "to-teal-600",
  },
  {
    icon: Pen,
    title: "Cover Letter Generator",
    description: "AI-crafted cover letters tailored to any role, with branded export and e-signature support.",
    href: "/toolkit/corporate-suite/cover-letter",
    colorClass: "text-sky-700",
    borderColorClass: "border-sky-400/40",
    gradientFrom: "from-sky-600",
    gradientTo: "to-blue-600",
  },
  {
    icon: Award,
    title: "Company Profile",
    description: "Create multi-page A4 company profiles with Smart URL scan, branding, and PDF export.",
    href: "/toolkit/corporate-suite/company-profile",
    colorClass: "text-rose-700",
    borderColorClass: "border-rose-400/40",
    gradientFrom: "from-rose-600",
    gradientTo: "to-pink-600",
  },
  {
    icon: Pen,
    title: "Signature Pad",
    description: "Draw, upload, or type your digital signature. Save as transparent PNG for documents.",
    href: "/toolkit/corporate-suite/signature",
    colorClass: "text-indigo-700",
    borderColorClass: "border-indigo-400/40",
    gradientFrom: "from-indigo-600",
    gradientTo: "to-violet-600",
  },
  {
    icon: Globe,
    title: "JBJ E-Sign",
    description: "Professional contract signing with multi-signer support and full audit trail.",
    href: "/e-signature",
    colorClass: "text-cyan-700",
    borderColorClass: "border-cyan-400/40",
    gradientFrom: "from-cyan-600",
    gradientTo: "to-blue-600",
  },
  {
    icon: Image,
    title: "Scan & Sign",
    description: "Camera scan any document, add signature, and export as a polished PDF instantly.",
    href: "/toolkit/scan-sign",
    colorClass: "text-orange-700",
    borderColorClass: "border-orange-400/40",
    gradientFrom: "from-orange-600",
    gradientTo: "to-red-600",
  },
];

const productivityTools = [
  {
    icon: CreditCard,
    title: "Business Card Scanner",
    description: "Scan and digitize business cards instantly with AI-powered OCR and contact extraction.",
    href: "/business-card-scanner",
    colorClass: "text-gold",
    borderColorClass: "border-gold/40",
    gradientFrom: "from-gold",
    gradientTo: "to-amber-600",
  },
  {
    icon: Video,
    title: "Video Meet",
    description: "Professional video conferencing with AI meeting summaries and action item extraction.",
    href: "/video-meeting",
    colorClass: "text-cyan-700",
    borderColorClass: "border-cyan-400/40",
    gradientFrom: "from-cyan-600",
    gradientTo: "to-blue-600",
  },
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    description: "Calculate mortgage payments, affordability, and compare financing options.",
    href: "/mortgage-calculator",
    colorClass: "text-gold",
    borderColorClass: "border-gold/40",
    gradientFrom: "from-gold",
    gradientTo: "to-amber-600",
  },
];

// Champagne card override for light backgrounds
const ChampagneToolCard = ({
  icon: Icon,
  title,
  description,
  href,
  colorClass,
  borderColorClass,
  gradientFrom,
  gradientTo,
}: typeof corporateTools[0]) => {
  const { Link } = require("react-router-dom");
  return (
    <a
      href={href}
      className={`flex flex-col h-full p-5 rounded-2xl bg-white/70 border-2 ${borderColorClass} hover:border-gold/70 hover:shadow-[0_8px_32px_rgba(200,167,102,0.3)] hover:-translate-y-1 transition-all duration-300 group backdrop-blur-sm`}
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className={`text-base font-bold ${colorClass} mb-2 text-zinc-900 group-hover:text-gold transition-colors`}>
        {title}
      </h3>
      <p className="text-sm text-zinc-600 leading-relaxed flex-grow">
        {description}
      </p>
      <div className="mt-4 text-sm font-semibold text-gold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
        Open Tool →
      </div>
    </a>
  );
};

const ProductivitySuite = () => {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #F5EBD7 0%, #EDE0C8 40%, #DDD0B8 100%)' }}>
      {/* Hero Section - Champagne premium */}
      <div className="relative py-14 px-4 overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(200,167,102,0.12) 0%, transparent 60%)' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-32 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center top, rgba(200,167,102,0.18) 0%, transparent 70%)' }} />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-gold/50 bg-white/60 backdrop-blur-sm mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-zinc-800 font-semibold text-sm tracking-wide">JBJ AI Tools Hub</span>
          </div>
          
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Corporate & <span style={{ background: 'linear-gradient(135deg, #C8A766 0%, #D4AF37 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Productivity</span> Suite
          </h1>
          
          <p className="text-base md:text-lg text-zinc-600 max-w-2xl mx-auto mb-8">
            Everything you need to create, brand, sign, and manage — stamps, business cards, logos, 
            resumes, cover letters, and more. All in one premium hub.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-gold rounded-full" />
              {corporateTools.length + productivityTools.length} Tools Included
            </span>
            <span className="text-zinc-300">|</span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Free Access
            </span>
          </div>
        </div>
      </div>

      {/* Corporate Identity Tools */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
          <span className="text-xs font-bold text-zinc-700 tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border border-gold/40 bg-white/50">Corporate Identity & Documents</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {corporateTools.map((tool) => (
            <BusinessSuiteToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>

      {/* Productivity Tools */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
          <span className="text-xs font-bold text-zinc-700 tracking-[0.2em] uppercase px-4 py-1.5 rounded-full border border-cyan-400/40 bg-white/50">Productivity</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {productivityTools.map((tool) => (
            <BusinessSuiteToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductivitySuite;
