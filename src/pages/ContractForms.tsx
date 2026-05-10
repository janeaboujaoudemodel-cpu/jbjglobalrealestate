/**
 * ContractForms - Professional UAE Real Estate Document Templates Hub
 * Premium grid of contract templates with DLD/RERA references
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  FileSignature,
  Home,
  Key,
  Building2,
  ClipboardCheck,
  ScrollText,
  Stamp,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/SEOHead";

interface ContractTemplate {
  id: string;
  name: string;
  arabicName: string;
  description: string;
  category: "sales" | "rentals" | "agency" | "developer";
  icon: React.ElementType;
  reraReference?: string;
  dldReference?: string;
  status: "available" | "coming_soon";
  downloadUrl?: string;
}

const contractTemplates: ContractTemplate[] = [
  {
    id: "mou",
    name: "Memorandum of Understanding (MoU)",
    arabicName: "مذكرة تفاهم",
    description: "Initial agreement between buyer and seller outlining terms, price, and conditions before the official sale contract.",
    category: "sales",
    icon: FileSignature,
    reraReference: "Form F",
    dldReference: "DLD Standard",
    status: "available",
  },
  {
    id: "form-f",
    name: "Form F - Listing Agreement",
    arabicName: "نموذج ف - اتفاقية التسويق",
    description: "RERA standard listing agreement between property owner and real estate brokerage for exclusive or non-exclusive marketing.",
    category: "agency",
    icon: ClipboardCheck,
    reraReference: "Form F",
    status: "available",
  },
  {
    id: "tenancy-ejari",
    name: "Tenancy Contract (Ejari)",
    arabicName: "عقد الإيجار",
    description: "Standard rental agreement registered with Ejari system. Required for all residential and commercial leases in Dubai.",
    category: "rentals",
    icon: Key,
    dldReference: "Ejari Standard",
    status: "available",
  },
  {
    id: "form-a",
    name: "Form A - Buyer Registration",
    arabicName: "نموذج أ - تسجيل المشتري",
    description: "Developer registration form for off-plan property purchases. Required for booking and SPA signing.",
    category: "developer",
    icon: Building2,
    reraReference: "Form A",
    status: "available",
  },
  {
    id: "noc-request",
    name: "No Objection Certificate (NOC)",
    arabicName: "شهادة عدم ممانعة",
    description: "Request form for NOC from developer or community management. Required for property transfer and mortgage.",
    category: "sales",
    icon: Stamp,
    dldReference: "DLD Transfer",
    status: "available",
  },
  {
    id: "reservation-form",
    name: "Property Reservation Form",
    arabicName: "نموذج حجز العقار",
    description: "Off-plan booking form to reserve a unit with the developer. Includes booking amount and unit details.",
    category: "developer",
    icon: Home,
    status: "available",
  },
  {
    id: "spa",
    name: "Sale & Purchase Agreement (SPA)",
    arabicName: "اتفاقية البيع والشراء",
    description: "Official contract between buyer and developer for off-plan properties. Registered with Oqood.",
    category: "developer",
    icon: ScrollText,
    reraReference: "Oqood",
    status: "coming_soon",
  },
  {
    id: "form-b",
    name: "Form B - Seller Agreement",
    arabicName: "نموذج ب - اتفاقية البائع",
    description: "RERA standard agreement between seller and agent for property listing and marketing.",
    category: "agency",
    icon: FileText,
    reraReference: "Form B",
    status: "coming_soon",
  },
];

const categoryLabels: Record<string, { label: string; color: string }> = {
  sales: { label: "Sales", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  rentals: { label: "Rentals", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  agency: { label: "Agency", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  developer: { label: "Developer", color: "bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30" },
};

export default function ContractForms() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredTemplates = selectedCategory
    ? contractTemplates.filter((t) => t.category === selectedCategory)
    : contractTemplates;

  const categories = ["sales", "rentals", "agency", "developer"];

  return (
    <>
      <SEOHead
        title="Contract Forms | UAE Real Estate Templates"
        description="Professional UAE real estate contract templates including MoU, Form F, Tenancy Contracts, and more. DLD and RERA compliant."
        canonicalPath="/contract-forms"
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 md:pt-40 md:pb-24 bg-gradient-to-b from-black via-black/95 to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(200,167,102,0.15),transparent_50%)]" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-[#EFE6D6]/20 text-[#1A1A1A] border-[#B89555]/30">
              <FileSignature className="w-3 h-3 mr-1" />
              Professional Templates
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Contract Forms Hub
            </h1>
            <p className="text-lg text-white/70 mb-8 leading-relaxed">
              Access professional UAE real estate document templates. All forms are 
              compliant with DLD and RERA standards for Dubai property transactions.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="https://dubailand.gov.ae" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  DLD Official
                </Button>
              </a>
              <a href="https://www.rera.gov.ae" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  RERA Portal
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 md:py-16 jj-layer-2">
        <div className="container mx-auto px-4 md:px-8">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className={selectedCategory === null ? "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90" : "border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"}
            >
              All Templates
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className={selectedCategory === cat ? "bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90" : "border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"}
              >
                {categoryLabels[cat].label}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
              >
                <div className="jj-card-inner h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EFE6D6]/10 border border-[#B89555]/20 flex items-center justify-center">
                      <template.icon className="w-6 h-6 text-[#1A1A1A]" />
                    </div>
                    <Badge className={categoryLabels[template.category].color}>
                      {categoryLabels[template.category].label}
                    </Badge>
                  </div>

                  {/* Title & Arabic */}
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {template.name}
                  </h3>
                  <p className="text-sm text-[#1A1A1A] font-arabic mb-3" dir="rtl">
                    {template.arabicName}
                  </p>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-4 flex-1">
                    {template.description}
                  </p>

                  {/* References */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.reraReference && (
                      <span className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        RERA: {template.reraReference}
                      </span>
                    )}
                    {template.dldReference && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {template.dldReference}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    {template.status === "available" ? (
                      <>
                        <Button variant="outline" size="sm" className="flex-1 border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" className="flex-1 bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90">
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      </>
                    ) : (
                      <Button disabled size="sm" className="flex-1 opacity-50">
                        Coming Soon
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-16 jj-card-inner text-center">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Need Help With Your Documents?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our team can assist you with document preparation, review, and submission. 
              Contact us for professional guidance on your real estate transactions.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/contact">
                <Button className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90">
                  <FileSignature className="w-4 h-4 mr-2" />
                  Request Assistance
                </Button>
              </Link>
              <Link to="/services">
                <Button variant="outline" className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                  View All Services
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
