import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ClipboardCheck,
  Camera,
  FileText,
  CheckCircle2,
  ArrowRight,
  Building2,
  Wrench,
  Phone,
  AlertTriangle,
  Eye,
  Send,
  Paintbrush,
  DoorOpen,
  Droplets,
  Zap,
  Shield,
  Calendar,
  XCircle,
  Users,
  Home,
  Briefcase,
  Star,
  Lock,
  Award,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

/* ─── Section wrapper ─── */
const Section = ({
  children,
  className = "",
  ivory = false,
}: {
  children: React.ReactNode;
  className?: string;
  ivory?: boolean;
}) => (
  <section
    className={`py-16 md:py-24 ${
      ivory
        ? "bg-gradient-to-br from-[#FAF6EE] via-[#F5EBD7]/30 to-[#FAF6EE]"
        : "bg-gradient-to-b from-white to-[#FDFBF7]"
    } ${className}`}
  >
    <div className="max-w-6xl mx-auto px-4 sm:px-6">{children}</div>
  </section>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2
    className="text-3xl md:text-4xl font-bold text-[#1a1a1a] text-center mb-3 border-b-2 border-[#C8A766]/30 pb-4 max-w-xl mx-auto"
    style={{ fontFamily: "Playfair Display, serif" }}
  >
    {children}
  </h2>
);

const GoldDivider = () => (
  <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
);

/* ─── Data ─── */
const inspectionCoverage = [
  {
    icon: Building2,
    title: "Structural Inspection",
    items: [
      "Wall alignment",
      "Cracks and surface irregularities",
      "Ceiling finishing",
      "Tile leveling",
    ],
  },
  {
    icon: Zap,
    title: "Mechanical & Electrical",
    items: [
      "Electrical socket testing",
      "Switch panel safety",
      "Air conditioning output",
      "Water pressure testing",
    ],
  },
  {
    icon: Droplets,
    title: "Plumbing & Sanitary",
    items: [
      "Leak detection",
      "Drainage functionality",
      "Water heater inspection",
      "Sealant verification",
    ],
  },
  {
    icon: DoorOpen,
    title: "Doors, Windows & Joinery",
    items: [
      "Door alignment",
      "Lock functionality",
      "Window sealing",
      "Cabinet installation quality",
    ],
  },
  {
    icon: Shield,
    title: "Balcony & External Areas",
    items: [
      "Drainage slope",
      "Railing security",
      "Surface cracks",
      "Waterproofing integrity",
    ],
  },
];

const withoutInspection = [
  "Hidden construction defects",
  "Water leakage risk",
  "Electrical irregularities",
  "Improper finishing alignment",
  "Warranty disputes",
];

const withInspection = [
  "Documented defect list",
  "Evidence-based reporting",
  "Developer rectification follow-up",
  "Legal protection documentation",
  "Handover risk mitigation",
];

const processSteps = [
  { step: 1, title: "Booking Confirmation", icon: Calendar },
  { step: 2, title: "Property Access Coordination", icon: Home },
  { step: 3, title: "On-Site Technical Inspection", icon: Camera },
  { step: 4, title: "Report Delivery Within 24–48 Hours", icon: FileText },
  { step: 5, title: "Developer Rectification Follow-Up", icon: Send },
  { step: 6, title: "Final Clearance Review", icon: ClipboardCheck },
];

const whoShouldRequest = [
  { icon: Building2, label: "Off-plan buyers before key collection" },
  { icon: Eye, label: "Overseas investors unable to inspect personally" },
  { icon: Users, label: "Landlords before tenant occupancy" },
  { icon: Briefcase, label: "Commercial unit owners" },
  { icon: Star, label: "Buyers in luxury developments" },
];

const inspectionTypes = [
  {
    title: "Pre-Handover Snagging",
    desc: "Before final payment release.",
  },
  {
    title: "Post-Handover Inspection",
    desc: "Within warranty period.",
  },
  {
    title: "Secondary Market Inspection",
    desc: "Before transfer completion.",
  },
  {
    title: "Rental Move-In Inspection",
    desc: "Tenant condition verification.",
  },
];

const faqData = [
  {
    q: "When should snagging be done?",
    a: "Snagging should be conducted immediately upon receiving a handover notice from the developer — ideally before signing the final handover form or releasing any final payment. For secondary market purchases, it is recommended before the transfer is completed.",
  },
  {
    q: "How long does inspection take?",
    a: "A standard apartment inspection takes approximately 2–3 hours. Villas and larger properties may require 4–6 hours depending on size, number of rooms, and external areas. The booking confirmation will include an estimated duration.",
  },
  {
    q: "Will developers accept third-party reports?",
    a: "Most reputable developers in the UAE accept professionally structured snagging reports. Our reports are formatted for direct submission to developer handover teams with categorized defect lists and photographic evidence.",
  },
  {
    q: "Is inspection required for secondary market purchases?",
    a: "While not legally mandatory, a pre-transfer inspection is strongly recommended. It protects the buyer from inheriting hidden defects and provides documented evidence of the property's condition at the time of purchase.",
  },
  {
    q: "What happens after defects are reported?",
    a: "The structured report is submitted to the developer's handover team. Defects are tracked through a closure checklist. A follow-up re-inspection can be arranged to verify that all identified issues have been resolved.",
  },
  {
    q: "Can inspection support warranty claims?",
    a: "Yes. Our inspection documentation — including timestamped photographs and severity gradings — serves as evidence for warranty claims and formal communications with developers or property management entities.",
  },
];

const snaggingAppliesTo = [
  "Off-plan property handover",
  "Secondary market purchases",
  "Rental pre-occupancy inspections",
  "Villa and apartment deliveries",
  "Commercial property acceptance",
];

/* ─── Page Component ─── */
const Snagging = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    propertyType: "",
    developer: "",
    community: "",
    unitNumber: "",
    handoverDate: "",
    inspectionType: "",
    accessAvailability: "",
  });
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast.error("Please confirm your authorization.");
      return;
    }
    setIsSubmitting(true);
    try {
      await supabase.functions.invoke("capture-lead", {
        body: {
          email: formData.email.toLowerCase().trim(),
          fullName: formData.fullName,
          phone: formData.phone,
          source: "snagging_inspection_form",
          pageSource: "/services/snagging",
          contactType: "client",
        },
      });
      toast.success("Inspection request submitted! Our team will contact you shortly.");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        propertyType: "",
        developer: "",
        community: "",
        unitNumber: "",
        handoverDate: "",
        inspectionType: "",
        accessAvailability: "",
      });
      setConsent(false);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <>
      <SEOHead
        title="Snagging & Property Inspection Services | JBJ Global Real Estate"
        description="Protect your investment before handover with professional property snagging and inspection services. Structured defect documentation, severity grading, and developer follow-up support."
        canonicalPath="/services/snagging"
      />

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F5EBD7] to-[#E8DCC8] py-20 md:py-32">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#C8A766]/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 border border-[#C8A766]/40 bg-white/60 backdrop-blur-sm">
              <ClipboardCheck className="w-4 h-4 text-[#C8A766]" />
              <span className="text-[#C8A766] font-semibold text-xs uppercase tracking-[0.2em]">
                Property Advisory
              </span>
            </div>

            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1a1a] mb-6 tracking-[-0.02em]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Snagging & Property Inspection Advisory
            </h1>

            <p className="text-[#1a1a1a]/70 text-base md:text-lg max-w-3xl mx-auto leading-relaxed mb-4 font-medium">
              Protecting Your Investment Before Handover
            </p>

            <p className="text-[#1a1a1a]/60 text-sm md:text-base max-w-2xl mx-auto leading-relaxed mb-10">
              Property snagging is the most critical stage before taking possession of a newly handed-over property. Our structured inspection process ensures that construction quality, finishing standards, and compliance details meet contractual and developer specifications — protecting your investment and preventing future liability.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="h-14 px-10 bg-gradient-to-r from-[#C8A766] to-[#B8944A] hover:from-[#B8944A] hover:to-[#A8843A] text-white font-bold text-base rounded-xl shadow-lg shadow-[#C8A766]/20"
              >
                <a href="#book-inspection">
                  <Calendar className="w-5 h-5 mr-2" />
                  Book Inspection
                </a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-14 px-10 border-2 border-[#C8A766] text-[#1a1a1a] hover:bg-[#C8A766]/10 font-bold text-base rounded-xl"
              >
                <Link to="/contact?service=snagging">
                  <Phone className="w-5 h-5 mr-2" />
                  Speak to Inspection Advisor
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <GoldDivider />

      {/* ═══ WHAT IS SNAGGING ═══ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
          <SectionTitle>What Is Snagging?</SectionTitle>
          <motion.div variants={fadeInUp} className="mt-8 bg-white/80 rounded-2xl border border-[#C8A766]/20 p-8">
            <p className="text-[#1a1a1a]/80 leading-relaxed mb-6">
              Snagging is a professional inspection conducted before property handover to identify construction defects, finishing inconsistencies, mechanical issues, and contractual deviations.
            </p>
            <p className="text-[#1a1a1a]/70 font-semibold mb-4">It applies to:</p>
            <ul className="space-y-3">
              {snaggingAppliesTo.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#1a1a1a]/70">
                  <CheckCircle2 className="w-4 h-4 text-[#C8A766] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ WHY PROFESSIONAL INSPECTION ═══ */}
      <Section ivory>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <SectionTitle>Why Professional Inspection Is Essential</SectionTitle>
          <div className="grid md:grid-cols-2 gap-8 mt-10 max-w-5xl mx-auto">
            {/* Without */}
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-red-200/60 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-400" />
                </div>
                <h3 className="font-bold text-[#1a1a1a] text-lg">Without Professional Inspection</h3>
              </div>
              <ul className="space-y-3">
                {withoutInspection.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#1a1a1a]/70">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
            {/* With */}
            <motion.div variants={fadeInUp} className="bg-white rounded-2xl border border-[#C8A766]/30 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#C8A766]/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#C8A766]" />
                </div>
                <h3 className="font-bold text-[#1a1a1a] text-lg">With Structured Snagging</h3>
              </div>
              <ul className="space-y-3">
                {withInspection.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#1a1a1a]/70">
                    <CheckCircle2 className="w-4 h-4 text-[#C8A766] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ INSPECTION COVERAGE ═══ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <SectionTitle>Our Inspection Coverage</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
            {inspectionCoverage.map((area, idx) => (
              <motion.div
                key={idx}
                variants={fadeInUp}
                className="bg-white rounded-2xl border border-[#C8A766]/20 p-6 hover:shadow-lg hover:shadow-[#C8A766]/10 transition-shadow"
              >
                <div className="w-12 h-12 mb-4 rounded-xl bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] flex items-center justify-center">
                  <area.icon className="w-6 h-6 text-[#C8A766]" />
                </div>
                <h3 className="font-bold text-[#1a1a1a] mb-3">{area.title}</h3>
                <ul className="space-y-2">
                  {area.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#1a1a1a]/70">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C8A766] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ INSPECTION REPORT FORMAT ═══ */}
      <Section ivory>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
          <SectionTitle>Inspection Report Format</SectionTitle>
          <motion.div variants={fadeInUp} className="mt-8 bg-white/80 rounded-2xl border border-[#C8A766]/20 p-8">
            <p className="text-[#1a1a1a]/70 mb-6">
              Clients receive a professional digital inspection report including:
            </p>
            <ul className="space-y-4">
              {[
                "High-resolution photographic evidence",
                "Categorized defect list",
                "Severity grading (Minor / Major / Critical)",
                "Developer responsibility clarification",
                "Repair priority ranking",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-[#1a1a1a]/70">
                  <FileText className="w-5 h-5 text-[#C8A766] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ HANDOVER SUPPORT PROCESS ═══ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <SectionTitle>Handover Support Process</SectionTitle>
          <div className="max-w-3xl mx-auto mt-10">
            <div className="relative">
              <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#C8A766]/40 via-[#C8A766]/20 to-transparent hidden md:block" />
              <div className="space-y-5">
                {processSteps.map((s, i) => (
                  <motion.div key={i} variants={fadeInUp} className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] flex items-center justify-center shrink-0 z-10 border-2 border-[#C8A766]/40">
                      <span className="text-[#C8A766] font-bold text-sm">{s.step}</span>
                    </div>
                    <div className="flex-1 bg-white rounded-xl border border-[#C8A766]/20 p-4 flex items-center gap-3">
                      <s.icon className="w-5 h-5 text-[#C8A766] shrink-0" />
                      <span className="font-semibold text-[#1a1a1a] text-sm">{s.title}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ WHO SHOULD REQUEST ═══ */}
      <Section ivory>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <SectionTitle>Who Should Request Snagging?</SectionTitle>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 max-w-5xl mx-auto">
            {whoShouldRequest.map((w, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white rounded-xl border border-[#C8A766]/20 p-5 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] flex items-center justify-center shrink-0">
                  <w.icon className="w-5 h-5 text-[#C8A766]" />
                </div>
                <span className="text-sm font-medium text-[#1a1a1a]/80">{w.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ INSPECTION TYPES ═══ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
          <SectionTitle>Inspection Types Offered</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-6 mt-10 max-w-4xl mx-auto">
            {inspectionTypes.map((t, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white rounded-2xl border border-[#C8A766]/20 p-6"
              >
                <h3 className="font-bold text-[#1a1a1a] mb-2">{t.title}</h3>
                <p className="text-sm text-[#1a1a1a]/60">{t.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ RISK MITIGATION ═══ */}
      <Section ivory>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
          <SectionTitle>Risk Mitigation & Legal Protection</SectionTitle>
          <motion.div variants={fadeInUp} className="mt-8 bg-white/80 rounded-2xl border-l-4 border-l-[#C8A766] border border-[#C8A766]/20 p-8">
            <p className="text-[#1a1a1a]/70 leading-relaxed mb-4">
              Professional snagging documentation reduces disputes and provides evidence in case of warranty claims or legal disagreement regarding construction defects.
            </p>
            <p className="text-[#1a1a1a]/70 leading-relaxed">
              Our inspection reports are structured for formal communication with developers and property management entities.
            </p>
          </motion.div>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ BOOK INSPECTION FORM ═══ */}
      <Section>
        <motion.div
          id="book-inspection"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-3xl mx-auto scroll-mt-24"
        >
          <SectionTitle>Book an Inspection</SectionTitle>
          <p className="text-center text-[#1a1a1a]/60 text-sm mt-2 mb-8">
            Complete the form below and our inspection team will contact you within 24 hours.
          </p>

          <motion.form
            variants={fadeInUp}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-[#C8A766]/20 p-6 md:p-8 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Full Name *</Label>
                <Input
                  required
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  maxLength={100}
                />
              </div>
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Email *</Label>
                <Input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="your@email.com"
                  maxLength={255}
                />
              </div>
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Phone *</Label>
                <Input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="+971 XX XXX XXXX"
                  maxLength={20}
                />
              </div>
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Property Type</Label>
                <Select value={formData.propertyType} onValueChange={(v) => updateField("propertyType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="townhouse">Townhouse</SelectItem>
                    <SelectItem value="penthouse">Penthouse</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Developer</Label>
                <Input
                  value={formData.developer}
                  onChange={(e) => updateField("developer", e.target.value)}
                  placeholder="e.g. Emaar, DAMAC"
                  maxLength={100}
                />
              </div>
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Community</Label>
                <Input
                  value={formData.community}
                  onChange={(e) => updateField("community", e.target.value)}
                  placeholder="e.g. Downtown Dubai"
                  maxLength={100}
                />
              </div>
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Unit Number</Label>
                <Input
                  value={formData.unitNumber}
                  onChange={(e) => updateField("unitNumber", e.target.value)}
                  placeholder="e.g. 1204"
                  maxLength={50}
                />
              </div>
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Handover Date</Label>
                <Input
                  type="date"
                  value={formData.handoverDate}
                  onChange={(e) => updateField("handoverDate", e.target.value)}
                />
              </div>
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Inspection Type</Label>
                <Select value={formData.inspectionType} onValueChange={(v) => updateField("inspectionType", v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pre_handover">Pre-Handover Snagging</SelectItem>
                    <SelectItem value="post_handover">Post-Handover Inspection</SelectItem>
                    <SelectItem value="secondary_market">Secondary Market Inspection</SelectItem>
                    <SelectItem value="rental_movein">Rental Move-In Inspection</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#1a1a1a] text-sm font-medium mb-1.5 block">Access Availability</Label>
                <Input
                  value={formData.accessAvailability}
                  onChange={(e) => updateField("accessAvailability", e.target.value)}
                  placeholder="e.g. Weekdays 9am–5pm"
                  maxLength={100}
                />
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(c) => setConsent(c === true)}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="text-sm text-[#1a1a1a]/70 leading-relaxed cursor-pointer">
                I confirm I am authorized to request inspection for this property.
              </Label>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 bg-gradient-to-r from-[#C8A766] to-[#B8944A] hover:from-[#B8944A] hover:to-[#A8843A] text-white font-bold text-base rounded-xl shadow-lg shadow-[#C8A766]/20"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
              ) : (
                <><ClipboardCheck className="w-5 h-5 mr-2" /> Schedule Property Inspection</>
              )}
            </Button>
          </motion.form>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ PREMIUM ASSURANCE ═══ */}
      <section className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] py-16 md:py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-3xl mx-auto px-4 sm:px-6 text-center"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-[#1a1a1a] mb-4"
            style={{ fontFamily: "Playfair Display, serif" }}
          >
            Protect Your Capital Before Acceptance
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-[#1a1a1a]/70 leading-relaxed mb-8">
            A property handover is a financial milestone. Structured inspection ensures your asset meets quality expectations before final acceptance.
          </motion.p>
          <motion.div variants={fadeInUp}>
            <Button
              asChild
              className="h-14 px-10 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white font-bold text-base rounded-xl"
            >
              <a href="#book-inspection">
                <ArrowRight className="w-5 h-5 mr-2" />
                Request Inspection Today
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      <GoldDivider />

      {/* ═══ FAQ ═══ */}
      <Section>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-3xl mx-auto">
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <motion.div variants={fadeInUp} className="mt-10">
            <Accordion type="single" collapsible className="space-y-3">
              {faqData.map((faq, i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="bg-white rounded-xl border border-[#C8A766]/20 px-6 overflow-hidden"
                >
                  <AccordionTrigger className="text-[#1a1a1a] font-semibold text-left py-5 hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#1a1a1a]/70 leading-relaxed pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </Section>

      <GoldDivider />

      {/* ═══ TRUST ═══ */}
      <Section ivory>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="max-w-4xl mx-auto">
          <SectionTitle>Our Commitment to You</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-6 mt-10">
            {[
              { icon: Lock, title: "Confidentiality Assurance", desc: "All inspection data and property information remain strictly confidential." },
              { icon: Award, title: "Professional Standards", desc: "Inspections conducted following established quality assessment methodologies." },
              { icon: FileText, title: "Structured Reporting", desc: "Developer-ready reports with categorized defects, photographic evidence, and severity grading." },
              { icon: Shield, title: "Independent Advisory", desc: "Unbiased, independent inspection not affiliated with any developer or contractor." },
            ].map((t, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white rounded-xl border border-[#C8A766]/20 p-6 flex items-start gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] flex items-center justify-center shrink-0">
                  <t.icon className="w-5 h-5 text-[#C8A766]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a1a] mb-1">{t.title}</h3>
                  <p className="text-sm text-[#1a1a1a]/60">{t.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* ═══ COMPLIANCE FOOTER NOTE ═══ */}
      <div className="bg-[#FDFBF7] border-t border-[#C8A766]/20 py-6">
        <p className="text-center text-xs text-[#1a1a1a]/40 max-w-3xl mx-auto px-4">
          Inspection services are advisory in nature and conducted within permitted professional real estate consultancy activities. This service does not include repair works, structural engineering assessments, or certified technical testing.
        </p>
      </div>
    </>
  );
};

export default Snagging;
