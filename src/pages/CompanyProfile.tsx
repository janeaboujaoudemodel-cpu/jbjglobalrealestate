import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  Share2, 
  FileText, 
  Building2, 
  Globe, 
  Users, 
  Award, 
  Shield,
  Target,
  CheckCircle,
  MessageCircle,
  Mail,
  Copy,
  Check
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { JJLogoImage } from "@/components/JJLogoImage";
import { COMPANY_STATS, CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const companyInfo = {
  name: "JBJ Global Real Estate",
  tagline: "Buy. Sell. Rent. Delivered with Intelligence.",
  founded: "2025",
  headquarters: "Downtown Dubai, UAE",
  ceo: "Founder & CEO Jane Abou Jaoude",
  about: `JBJ Global Real Estate is a Dubai-based real estate brokerage licensed to BUY, SELL, and RENT properties across the UAE. Founded by Founder & CEO Jane Abou Jaoude, we provide brokerage support and partner introductions for discerning clients seeking exceptional properties in the UAE.

Our founder-led approach ensures that every client receives personalized attention and professional guidance, backed by our extensive market knowledge and exclusive network of developers, legal partners, and service providers.

We serve UAE-based and international clients interested in UAE real estate, offering expert brokerage services with a commitment to excellence.`,
  mission: "To provide discerning clients with professional brokerage support for buying, selling, and renting, along with access to the UAE's most exclusive properties, delivered with the highest standards of integrity, expertise, and personalized service.",
  vision: "To be the trusted choice for clients seeking premium real estate brokerage services in the UAE, recognized for our commitment to client success.",
  services: [
    "Property Sales & Rental Brokerage",
    "Legal Partner Introductions",
    "Interior Design & Architecture Partners",
    "Mortgage Partner Introductions",
    "Golden Visa Assistance (via Partners)",
    "Holiday Homes Management"
  ],
  values: [
    { title: "Trust & Integrity", description: "Building lasting relationships through transparency and honesty" },
    { title: "Excellence", description: "Delivering exceptional outcomes with meticulous attention to detail" },
    { title: "UAE Focus", description: "Serving UAE-based and international clients interested in UAE real estate" },
  ],
  stats: {
    yearsInDubai: "5+",
    brokersTrainedBy: "2,800+",
    socialFollowers: "1M+",
    teamManaged: "495+"
  }
};

const CompanyProfile = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [copied, setCopied] = useState(false);

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdfDoc = await PDFDocument.create();
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Page dimensions
      const pageWidth = 612;
      const pageHeight = 792;
      const margin = 50;
      
      // Colors
      const goldColor = rgb(0.66, 0.57, 0.35); // #A8925A
      const blackColor = rgb(0.05, 0.05, 0.05);
      const grayColor = rgb(0.4, 0.4, 0.4);
      const whiteColor = rgb(1, 1, 1);

      // === PAGE 1: Cover ===
      const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
      
      // Black background
      page1.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: blackColor,
      });

      // Gold accent line at top
      page1.drawRectangle({
        x: 0,
        y: pageHeight - 8,
        width: pageWidth,
        height: 8,
        color: goldColor,
      });

      // Logo text
      page1.drawText("JBJ", {
        x: pageWidth / 2 - 45,
        y: pageHeight - 200,
        size: 72,
        font: helveticaBold,
        color: goldColor,
      });

      page1.drawText("GLOBAL REAL ESTATE", {
        x: pageWidth / 2 - 130,
        y: pageHeight - 250,
        size: 20,
        font: helveticaBold,
        color: whiteColor,
      });

      // Decorative line
      page1.drawRectangle({
        x: margin,
        y: pageHeight - 280,
        width: pageWidth - margin * 2,
        height: 1,
        color: goldColor,
      });

      // Company Profile title
      page1.drawText("COMPANY PROFILE", {
        x: pageWidth / 2 - 120,
        y: pageHeight - 360,
        size: 28,
        font: helveticaBold,
        color: goldColor,
      });

      page1.drawText("2025", {
        x: pageWidth / 2 - 25,
        y: pageHeight - 400,
        size: 18,
        font: helvetica,
        color: grayColor,
      });

      // Tagline
      page1.drawText("Buy. Sell. Rent.", {
        x: pageWidth / 2 - 70,
        y: pageHeight - 500,
        size: 18,
        font: helveticaBold,
        color: goldColor,
      });
      page1.drawText("Delivered with Intelligence.", {
        x: pageWidth / 2 - 105,
        y: pageHeight - 525,
        size: 16,
        font: helvetica,
        color: whiteColor,
      });

      // Bottom gold accent
      page1.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: 8,
        color: goldColor,
      });

      // === PAGE 2: About Us ===
      const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
      
      page2.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: whiteColor,
      });

      // Header
      page2.drawRectangle({
        x: 0,
        y: pageHeight - 60,
        width: pageWidth,
        height: 60,
        color: blackColor,
      });

      page2.drawText("JBJ GLOBAL REAL ESTATE", {
        x: margin,
        y: pageHeight - 40,
        size: 14,
        font: helveticaBold,
        color: goldColor,
      });

      // Section title
      page2.drawText("ABOUT US", {
        x: margin,
        y: pageHeight - 110,
        size: 24,
        font: helveticaBold,
        color: blackColor,
      });

      page2.drawRectangle({
        x: margin,
        y: pageHeight - 120,
        width: 80,
        height: 3,
        color: goldColor,
      });

      // About text (wrapped)
      const aboutLines = [
        "JBJ Global Real Estate is a Dubai-based real estate brokerage",
        "licensed to BUY, SELL, and RENT properties across the UAE.",
        "Founded by entrepreneur Jane Abou Jaoude, we provide brokerage",
        "support and partner introductions for discerning clients seeking",
        "exceptional properties in the UAE.",
        "",
        "Our founder-led approach ensures that every client receives",
        "personalized attention and professional guidance, backed by our",
        "extensive market knowledge and exclusive network of developers,",
        "legal experts, and luxury service providers.",
        "",
        "Mortgage, legal, visa, and corporate services are provided",
        "through licensed partners."
      ];

      let yPos = pageHeight - 160;
      aboutLines.forEach((line) => {
        page2.drawText(line, {
          x: margin,
          y: yPos,
          size: 11,
          font: helvetica,
          color: grayColor,
        });
        yPos -= 18;
      });

      // Mission & Vision
      yPos -= 20;
      page2.drawText("OUR MISSION", {
        x: margin,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: blackColor,
      });
      
      yPos -= 25;
      const missionLines = [
        "To provide discerning clients with professional brokerage support",
        "and access to the UAE's most exclusive properties, delivered with",
        "the highest standards of integrity, expertise, and service."
      ];
      missionLines.forEach((line) => {
        page2.drawText(line, {
          x: margin,
          y: yPos,
          size: 10,
          font: helvetica,
          color: grayColor,
        });
        yPos -= 15;
      });

      yPos -= 20;
      page2.drawText("OUR VISION", {
        x: margin,
        y: yPos,
        size: 14,
        font: helveticaBold,
        color: blackColor,
      });
      
      yPos -= 25;
      const visionLines = [
        "To be the trusted choice for clients seeking premium real estate",
        "brokerage services in the UAE, recognized for our commitment",
        "to client success and exceptional service."
      ];
      visionLines.forEach((line) => {
        page2.drawText(line, {
          x: margin,
          y: yPos,
          size: 10,
          font: helvetica,
          color: grayColor,
        });
        yPos -= 15;
      });

      // Footer
      page2.drawText("www.jbj.ae", {
        x: pageWidth / 2 - 30,
        y: 30,
        size: 10,
        font: helvetica,
        color: goldColor,
      });

      // === PAGE 3: Stats & Services ===
      const page3 = pdfDoc.addPage([pageWidth, pageHeight]);
      
      page3.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: whiteColor,
      });

      // Header
      page3.drawRectangle({
        x: 0,
        y: pageHeight - 60,
        width: pageWidth,
        height: 60,
        color: blackColor,
      });

      page3.drawText("JBJ GLOBAL REAL ESTATE", {
        x: margin,
        y: pageHeight - 40,
        size: 14,
        font: helveticaBold,
        color: goldColor,
      });

      // Stats section
      page3.drawText("OUR ACHIEVEMENTS", {
        x: margin,
        y: pageHeight - 110,
        size: 24,
        font: helveticaBold,
        color: blackColor,
      });

      page3.drawRectangle({
        x: margin,
        y: pageHeight - 120,
        width: 130,
        height: 3,
        color: goldColor,
      });

      // Stats grid - Verified figures only
      const statsData = [
        { label: "Industry Experience", value: "12+ Years" },
        { label: "Brokers Trained By Founder", value: "2,800+" },
        { label: "Social Followers (All Platforms)", value: "1M+" },
        { label: "Team Members", value: "10+" },
      ];

      let statX = margin;
      let statY = pageHeight - 180;
      const statWidth = (pageWidth - margin * 2) / 3;

      statsData.forEach((stat, index) => {
        if (index > 0 && index % 3 === 0) {
          statX = margin;
          statY -= 80;
        }

        page3.drawText(stat.value, {
          x: statX,
          y: statY,
          size: 28,
          font: helveticaBold,
          color: goldColor,
        });

        page3.drawText(stat.label, {
          x: statX,
          y: statY - 20,
          size: 10,
          font: helvetica,
          color: grayColor,
        });

        statX += statWidth;
      });

      // Services section
      page3.drawText("OUR SERVICES", {
        x: margin,
        y: pageHeight - 360,
        size: 24,
        font: helveticaBold,
        color: blackColor,
      });

      page3.drawRectangle({
        x: margin,
        y: pageHeight - 370,
        width: 100,
        height: 3,
        color: goldColor,
      });

      const services = [
        "Property Sales & Rental Brokerage",
        "Legal Partner Introductions",
        "Interior Design & Architecture Partners",
        "Mortgage Partner Introductions",
        "Golden Visa Assistance (via Partners)",
        "Holiday Homes Management"
      ];

      yPos = pageHeight - 410;
      services.forEach((service) => {
        page3.drawText("•", {
          x: margin,
          y: yPos,
          size: 12,
          font: helveticaBold,
          color: goldColor,
        });
        page3.drawText(service, {
          x: margin + 15,
          y: yPos,
          size: 12,
          font: helvetica,
          color: blackColor,
        });
        yPos -= 25;
      });

      // Footer
      page3.drawText("www.jbj.ae", {
        x: pageWidth / 2 - 30,
        y: 30,
        size: 10,
        font: helvetica,
        color: goldColor,
      });

      // === PAGE 4: Contact ===
      const page4 = pdfDoc.addPage([pageWidth, pageHeight]);
      
      page4.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: blackColor,
      });

      // Gold accent at top
      page4.drawRectangle({
        x: 0,
        y: pageHeight - 8,
        width: pageWidth,
        height: 8,
        color: goldColor,
      });

      // Logo
      page4.drawText("JBJ", {
        x: pageWidth / 2 - 35,
        y: pageHeight - 150,
        size: 56,
        font: helveticaBold,
        color: goldColor,
      });

      page4.drawText("GLOBAL REAL ESTATE", {
        x: pageWidth / 2 - 110,
        y: pageHeight - 195,
        size: 18,
        font: helveticaBold,
        color: whiteColor,
      });

      // Contact section
      page4.drawText("CONTACT US", {
        x: pageWidth / 2 - 70,
        y: pageHeight - 300,
        size: 24,
        font: helveticaBold,
        color: goldColor,
      });

      page4.drawRectangle({
        x: pageWidth / 2 - 50,
        y: pageHeight - 310,
        width: 100,
        height: 2,
        color: goldColor,
      });

      const contactDetails = [
        { label: "Location", value: "Downtown Dubai, UAE" },
        { label: "Phone", value: "+971 56 591 1000" },
        { label: "Email", value: "Contact@JBJ.ae" },
        { label: "Website", value: "www.jbj.ae" },
      ];

      yPos = pageHeight - 370;
      contactDetails.forEach((contact) => {
        page4.drawText(contact.label, {
          x: pageWidth / 2 - 80,
          y: yPos,
          size: 10,
          font: helvetica,
          color: grayColor,
        });
        page4.drawText(contact.value, {
          x: pageWidth / 2 - 80,
          y: yPos - 18,
          size: 14,
          font: helveticaBold,
          color: whiteColor,
        });
        yPos -= 55;
      });

      // CTA
      page4.drawText("Schedule a Consultation Today", {
        x: pageWidth / 2 - 110,
        y: 150,
        size: 14,
        font: helveticaBold,
        color: goldColor,
      });

      // Bottom text
      page4.drawText("Real Estate Brokerage | Dubai, UAE", {
        x: pageWidth / 2 - 90,
        y: 50,
        size: 10,
        font: helvetica,
        color: grayColor,
      });

      // Gold accent at bottom
      page4.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: 8,
        color: goldColor,
      });

      // === PAGE 5: Legal Disclaimer ===
      const page5 = pdfDoc.addPage([pageWidth, pageHeight]);
      
      page5.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: whiteColor,
      });

      // Header
      page5.drawRectangle({
        x: 0,
        y: pageHeight - 60,
        width: pageWidth,
        height: 60,
        color: blackColor,
      });

      page5.drawText("JBJ GLOBAL REAL ESTATE", {
        x: margin,
        y: pageHeight - 40,
        size: 14,
        font: helveticaBold,
        color: goldColor,
      });

      // Section title
      page5.drawText("LEGAL DISCLAIMER", {
        x: margin,
        y: pageHeight - 110,
        size: 24,
        font: helveticaBold,
        color: blackColor,
      });

      page5.drawRectangle({
        x: margin,
        y: pageHeight - 120,
        width: 120,
        height: 3,
        color: goldColor,
      });

      // Disclaimer text
      const disclaimerLines = [
        "IMPORTANT NOTICE:",
        "",
        "JBJ Global Real Estate is a Dubai-based real estate brokerage",
        "specializing in property sales, rentals, and holiday homes.",
        "",
        "We are NOT a financial institution, law firm, or mortgage provider.",
        "We do NOT provide legal, mortgage, or financial advice.",
        "",
        "Legal, mortgage, and property management services are provided",
        "through introductions to independent licensed third parties who",
        "contract directly with clients.",
        "",
        "All information in this document is provided for general informational",
        "purposes only and should not be relied upon as professional advice.",
        "",
        "Statistics and figures shown are based on founder experience and",
        "company records. Past performance is not indicative of future results.",
        "",
        "For regulatory compliance, please consult with licensed professionals",
        "in your jurisdiction before making any property decisions.",
        "",
        "Licensed by: Dubai Land Department (DLD)",
        "Regulated by: Real Estate Regulatory Agency (RERA)",
        "",
        "© 2025 JBJ Global Real Estate. All rights reserved.",
      ];

      yPos = pageHeight - 160;
      disclaimerLines.forEach((line) => {
        const isHeader = line === "IMPORTANT NOTICE:" || line.startsWith("Licensed by:") || line.startsWith("Regulated by:");
        page5.drawText(line, {
          x: margin,
          y: yPos,
          size: isHeader ? 11 : 10,
          font: isHeader ? helveticaBold : helvetica,
          color: isHeader ? blackColor : grayColor,
        });
        yPos -= line === "" ? 10 : 16;
      });

      // Footer
      page5.drawText("www.jbj.ae", {
        x: pageWidth / 2 - 30,
        y: 30,
        size: 10,
        font: helvetica,
        color: goldColor,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      setPdfBlob(blob);
      setShowPreview(true);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBlob) return;
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "JJ-Global-Capital-Company-Profile.pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Company Profile downloaded successfully!");
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      "Check out JBJ Global Real Estate - UAE's Premier Real Estate Brokerage. Download their company profile at: https://jbj.ae/company-profile"
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent("JBJ Global Real Estate - Company Profile");
    const body = encodeURIComponent(
      "I wanted to share with you the company profile of JBJ Global Real Estate, UAE's Premier Real Estate Brokerage.\n\nVisit: https://jbj.ae/company-profile"
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText("https://jbj.ae/company-profile");
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={luxuryVillaHero} 
            alt="JBJ Global Real Estate" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        </div>
        
        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.span
            className="inline-block text-gold text-xs uppercase tracking-[0.4em] mb-6"
            variants={fadeInUp}
          >
            Company Profile
          </motion.span>
          <motion.h1 
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              JBJ Global Real Estate
            </span>
          </motion.h1>
          <motion.p 
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            {companyInfo.tagline}
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              variant="primary"
              className="px-8 py-6 text-lg"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating...
                </div>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download Company Profile
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Company Overview Section */}
      <section className="py-20 relative overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, hsl(40 32% 51% / 0.08) 0%, transparent 60%)",
          }}
        />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">About Us</span>
              <h2 
                className="text-white text-3xl md:text-4xl font-bold mb-6"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                A Legacy of Excellence
              </h2>
            </div>
            
            <div className="space-y-6 text-zinc-400 leading-relaxed text-center md:text-left">
              <p>{companyInfo.about}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-16 bg-zinc-900/30">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {Object.entries(companyInfo.stats).map(([key, value]) => (
              <motion.div 
                key={key}
                className="text-center p-6 bg-black/50 rounded-xl border border-zinc-800"
                variants={fadeInUp}
              >
                <p className="text-gold text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: "Poppins, sans-serif" }}>
                  {value}
                </p>
                <p className="text-zinc-500 text-xs uppercase tracking-wider">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"
            >
              <Target className="w-12 h-12 text-gold mb-4" />
              <h3 className="text-white text-xl font-bold mb-4">Our Mission</h3>
              <p className="text-zinc-400 leading-relaxed">{companyInfo.mission}</p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8"
            >
              <Globe className="w-12 h-12 text-gold mb-4" />
              <h3 className="text-white text-xl font-bold mb-4">Our Vision</h3>
              <p className="text-zinc-400 leading-relaxed">{companyInfo.vision}</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">What We Offer</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Our Services
            </h2>
          </div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {companyInfo.services.map((service, index) => (
              <motion.div 
                key={service}
                className="flex items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-gold/30 transition-colors"
                variants={fadeInUp}
              >
                <CheckCircle className="w-6 h-6 text-gold flex-shrink-0" />
                <span className="text-white">{service}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Values</span>
            <h2 
              className="text-white text-3xl md:text-4xl font-bold"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              The Pillars of Our Success
            </h2>
          </div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {companyInfo.values.map((value) => (
              <motion.div 
                key={value.title}
                className="text-center p-8 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-gold/30 transition-colors"
                variants={fadeInUp}
              >
                <Shield className="w-12 h-12 text-gold mx-auto mb-4" />
                <h3 className="text-white text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-zinc-400">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Legal Disclaimer Section */}
      <section className="py-12 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto p-8 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
            <div className="flex items-start gap-4">
              <Shield className="w-8 h-8 text-amber-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-amber-400 font-bold text-lg mb-3">Important Disclaimer</h3>
                <div className="space-y-3 text-sm text-zinc-400">
                  <p>
                    JBJ Global Real Estate is a Dubai-based <strong className="text-zinc-300">real estate brokerage</strong> specializing 
                    in property sales, rentals, and holiday homes. We are NOT a financial institution, law firm, or mortgage provider.
                  </p>
                  <p>
                    We do NOT provide legal, mortgage, or financial advice. Legal, mortgage, and property management 
                    services are provided through introductions to independent licensed third parties who contract directly with clients.
                  </p>
                  <p className="text-zinc-500 text-xs">
                    Licensed by Dubai Land Department (DLD) • Regulated by Real Estate Regulatory Agency (RERA)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="py-20 bg-gradient-to-b from-zinc-900/50 to-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-3xl p-12 border border-gold/20"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <FileText className="w-16 h-16 text-gold mx-auto mb-6" />
            <h2 
              className="text-white text-3xl md:text-4xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Get Our Company Profile
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              Download our comprehensive company profile to learn more about JBJ Global Real Estate
            </p>
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              variant="primary"
              className="px-10 py-6 text-lg"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating PDF...
                </div>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download PDF
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white text-xl flex items-center gap-2">
              <FileText className="w-5 h-5 text-gold" />
              JBJ Global Real Estate - Company Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            {/* PDF Preview Card */}
            <div className="bg-black rounded-xl p-8 border border-gold/20 mb-6">
              <div className="flex items-center justify-center mb-6">
                <JJLogoImage variant="dark" size="lg" />
              </div>
              <div className="text-center">
                <p className="text-gold text-sm uppercase tracking-[0.3em] mb-2">Company Profile</p>
                <p className="text-white text-2xl font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                  JBJ Global Real Estate
                </p>
                <p className="text-zinc-500 text-sm">5 Pages • PDF Document</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleDownload}
                variant="primary"
                className="w-full py-6"
              >
                <Download className="w-5 h-5 mr-2" />
                Save to Device
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-white hover:bg-zinc-800 py-6"
                  >
                    <Share2 className="w-5 h-5 mr-2" />
                    Share Profile
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-zinc-900 border-zinc-800 w-64">
                  <DropdownMenuItem
                    onClick={handleShareWhatsApp}
                    className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer py-3"
                  >
                    <MessageCircle className="w-5 h-5 mr-3 text-green-500" />
                    Share via WhatsApp
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleShareEmail}
                    className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer py-3"
                  >
                    <Mail className="w-5 h-5 mr-3 text-gold" />
                    Share via Email
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleCopyLink}
                    className="text-zinc-300 hover:text-white hover:bg-zinc-800 cursor-pointer py-3"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 mr-3 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 mr-3" />
                    )}
                    Copy Link
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CompanyProfile;