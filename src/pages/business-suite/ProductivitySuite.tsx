import { 
  CreditCard, Video, Calculator, Stamp, CreditCard as BusinessCard, 
  FileText, Briefcase, Image, Pen, Globe, Award, UserCheck, Palette
} from "lucide-react";
import BusinessSuiteToolCard from "@/components/business-suite/BusinessSuiteToolCard";

const corporateTools = [
  {
    icon: Stamp,
    title: "AI Stamp Generator",
    description: "Create bilingual professional company stamps and seals with AI. Export as SVG, PNG, or PDF.",
    href: "/toolkit/stamp-generator",
    colorClass: "text-gold",
    borderColorClass: "border-gold/30",
    gradientFrom: "from-amber-700",
    gradientTo: "to-yellow-600",
  },
  {
    icon: BusinessCard,
    title: "Business Card Designer",
    description: "Design premium digital and print-ready business cards with 7 shapes and custom branding.",
    href: "/toolkit/corporate-suite/business-card",
    colorClass: "text-gold",
    borderColorClass: "border-gold/30",
    gradientFrom: "from-gold",
    gradientTo: "to-amber-600",
  },
  {
    icon: Palette,
    title: "Logo Maker",
    description: "Generate AI-powered company logos with custom colors, fonts, and export options.",
    href: "/toolkit/corporate-suite/logo",
    colorClass: "text-purple-400",
    borderColorClass: "border-purple-500/30",
    gradientFrom: "from-purple-600",
    gradientTo: "to-indigo-600",
  },
  {
    icon: FileText,
    title: "Resume Builder",
    description: "Build professional CVs with 12 international templates and AI-powered summary generation.",
    href: "/toolkit/corporate-suite/cv-builder",
    colorClass: "text-emerald-400",
    borderColorClass: "border-emerald-500/30",
    gradientFrom: "from-emerald-600",
    gradientTo: "to-teal-600",
  },
  {
    icon: Pen,
    title: "Cover Letter Generator",
    description: "AI-crafted cover letters tailored to any role, with branded export and e-signature support.",
    href: "/toolkit/corporate-suite/cover-letter",
    colorClass: "text-sky-400",
    borderColorClass: "border-sky-500/30",
    gradientFrom: "from-sky-600",
    gradientTo: "to-blue-600",
  },
  {
    icon: Award,
    title: "Company Profile",
    description: "Create multi-page A4 company profiles with Smart URL scan, branding, and PDF export.",
    href: "/toolkit/corporate-suite/company-profile",
    colorClass: "text-rose-400",
    borderColorClass: "border-rose-500/30",
    gradientFrom: "from-rose-600",
    gradientTo: "to-pink-600",
  },
  {
    icon: Pen,
    title: "Signature Pad",
    description: "Draw, upload, or type your digital signature. Save as transparent PNG for documents.",
    href: "/toolkit/corporate-suite/signature",
    colorClass: "text-indigo-400",
    borderColorClass: "border-indigo-500/30",
    gradientFrom: "from-indigo-600",
    gradientTo: "to-violet-600",
  },
  {
    icon: Globe,
    title: "JBJ E-Sign",
    description: "Professional contract signing with multi-signer support and full audit trail.",
    href: "/e-signature",
    colorClass: "text-cyan-400",
    borderColorClass: "border-cyan-500/30",
    gradientFrom: "from-cyan-600",
    gradientTo: "to-blue-600",
  },
  {
    icon: Image,
    title: "Scan & Sign",
    description: "Camera scan any document, add signature, and export as a polished PDF instantly.",
    href: "/toolkit/scan-sign",
    colorClass: "text-orange-400",
    borderColorClass: "border-orange-500/30",
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
    borderColorClass: "border-gold/30",
    gradientFrom: "from-gold",
    gradientTo: "to-amber-600",
  },
  {
    icon: Video,
    title: "Video Meet",
    description: "Professional video conferencing with AI meeting summaries and action item extraction.",
    href: "/video-meeting",
    colorClass: "text-cyan-400",
    borderColorClass: "border-cyan-500/30",
    gradientFrom: "from-cyan-600",
    gradientTo: "to-blue-600",
  },
  {
    icon: Calculator,
    title: "Mortgage Calculator",
    description: "Calculate mortgage payments, affordability, and compare financing options.",
    href: "/mortgage-calculator",
    colorClass: "text-gold",
    borderColorClass: "border-gold/30",
    gradientFrom: "from-gold",
    gradientTo: "to-amber-600",
  },
];

const ProductivitySuite = () => {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-amber-950/40 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-6">
            <Briefcase className="w-5 h-5 text-gold" />
            <span className="text-gold font-medium text-sm">Productivity & Corporate Suite</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            <span className="text-gold">Corporate</span> & Productivity Tools
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Everything you need to create, brand, sign, and manage — stamps, business cards, logos, 
            resumes, cover letters, and more. All in one place.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-gold rounded-full" />
              {corporateTools.length + productivityTools.length} Tools Included
            </span>
            <span>•</span>
            <span>Free Access</span>
          </div>
        </div>
      </div>

      {/* Corporate Identity Tools */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
          <span className="text-xs font-bold text-gold tracking-[0.2em] uppercase px-3">Corporate Identity & Documents</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {corporateTools.map((tool) => (
            <BusinessSuiteToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>

      {/* Productivity Tools */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
          <span className="text-xs font-bold text-cyan-400 tracking-[0.2em] uppercase px-3">Productivity</span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {productivityTools.map((tool) => (
            <BusinessSuiteToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductivitySuite;
