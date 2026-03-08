import { useNavigate } from "react-router-dom";
import { 
  FileText, Stamp, PenTool, QrCode, CreditCard, UserRound, Mail, 
  Sparkles, ArrowRight, Building2, Palette, FileSpreadsheet 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const tools = [
  {
    icon: FileText,
    title: "Documents & Spreadsheets",
    description: "Rich text editor with AI OCR scanning, find & replace, QR codes, stamps, and ombré colors.",
    href: "/documents",
    color: "from-amber-600 to-yellow-600",
    badge: "OCR + AI",
  },
  {
    icon: PenTool,
    title: "E-Signature (DocuSign)",
    description: "Create, sign, and manage contracts with AI-designed signatures, stamps, and QR verification.",
    href: "/e-signature",
    color: "from-blue-600 to-indigo-600",
    badge: "Contracts",
  },
  {
    icon: Stamp,
    title: "AI Stamp Generator",
    description: "Generate professional bilingual company stamps with logo, monogram, and compliance text.",
    href: "/broker-toolkit/stamp",
    color: "from-emerald-600 to-teal-600",
    badge: "Branding",
  },
  {
    icon: QrCode,
    title: "QR Code Generator",
    description: "Create custom QR codes for URLs, contacts, WiFi, email, phone — with color customization.",
    href: "/qr-generator",
    color: "from-violet-600 to-purple-600",
    badge: "Universal",
  },
  {
    icon: CreditCard,
    title: "Business Card Designer",
    description: "Design premium business cards with QR codes, multiple shapes, and digital export.",
    href: "/toolkit/corporate-suite/business-card",
    color: "from-pink-600 to-rose-600",
    badge: "Design",
  },
  {
    icon: UserRound,
    title: "CV / Resume Builder",
    description: "Build professional CVs with photo, QR code, accent colors, and multiple templates.",
    href: "/toolkit/corporate-suite/cv-builder",
    color: "from-cyan-600 to-sky-600",
    badge: "Career",
  },
  {
    icon: Mail,
    title: "Cover Letter Generator",
    description: "AI-generated cover letters tailored to job descriptions with professional formatting.",
    href: "/toolkit/corporate-suite/cover-letter",
    color: "from-orange-600 to-amber-600",
    badge: "AI",
  },
  {
    icon: Building2,
    title: "Company Profile",
    description: "Create branded company profiles with services, team, and contact sections.",
    href: "/toolkit/corporate-suite/company-profile",
    color: "from-teal-600 to-emerald-600",
    badge: "Corporate",
  },
  {
    icon: Palette,
    title: "Logo Maker",
    description: "Create unique logos with AI-powered design suggestions and customizable templates.",
    href: "/toolkit/corporate-suite/logo",
    color: "from-fuchsia-600 to-pink-600",
    badge: "Branding",
  },
  {
    icon: FileSpreadsheet,
    title: "Job Offer Templates",
    description: "Generate job offers with auto-filled company info, stamps, signatures, and current date.",
    href: "/owner/job-offer-template",
    color: "from-lime-600 to-green-600",
    badge: "Templates",
  },
];

const OwnerCreativeSuite = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Hero */}
      <div className="border-b-2 border-gold/30">
        <div className="container mx-auto px-4 py-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 rounded-full px-5 py-1.5 mb-5">
              <Sparkles className="w-4 h-4 text-[#8B7355]" />
              <span className="text-black text-sm font-semibold tracking-wide">Owner Creative Suite</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-3">Creative Suite</h1>
            <p className="text-zinc-600 text-lg">Your unified hub for documents, stamps, signatures, QR codes, business cards, CVs, and templates — all interconnected.</p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="container mx-auto px-4 py-10 max-w-6xl">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {tools.map((tool) => (
            <button
              key={tool.href}
              onClick={() => navigate(tool.href)}
              className="group text-left bg-white/80 hover:bg-white border border-gold/20 hover:border-gold/40 rounded-2xl p-6 transition-all hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tool.color} flex items-center justify-center flex-shrink-0`}>
                  <tool.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-black text-sm">{tool.title}</h3>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gold/20 text-[#8B7355]">{tool.badge}</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">{tool.description}</p>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <ArrowRight className="h-4 w-4 text-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OwnerCreativeSuite;
