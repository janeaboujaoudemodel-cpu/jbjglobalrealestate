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
import { JJLogo } from "@/components/JJLogo";
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
import BackNavButton from "@/components/BackNavButton";
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
  name: "JJ Global Capital",
  tagline: "Your Gateway to UAE's Premier Real Estate Investment",
  founded: "2018",
  headquarters: "Downtown Dubai, UAE",
  ceo: "Jane Abou Jaoude",
  about: `JJ Global Capital is the UAE's premier investment advisory firm, specializing in luxury real estate and comprehensive wealth management solutions. Founded by visionary entrepreneur Jane Abou Jaoude, we have established ourselves as the trusted partner for ultra-high-net-worth individuals seeking exceptional investment opportunities in the UAE.

Our founder-led approach ensures that every client receives personalized attention and strategic guidance, backed by our extensive market knowledge and exclusive network of developers, legal experts, and luxury service providers.

With a portfolio exceeding AED 2 Billion and over 3,900 properties sold, we continue to set the standard for excellence in the UAE real estate market.`,
  mission: "To provide discerning investors with unparalleled access to the UAE's most exclusive investment opportunities, delivered with the highest standards of integrity, expertise, and personalized service.",
  vision: "To be the definitive choice for global investors seeking premium real estate and lifestyle investments in the UAE, recognized for our exceptional track record and commitment to client success.",
  services: [
    "Premium Real Estate Investment Advisory",
    "Luxury Concierge & Lifestyle Management",
    "Legal Services & Property Conveyancing",
    "Interior Design & Architecture",
    "Mortgage & Financial Advisory",
    "Golden Visa Assistance"
  ],
  values: [
    { title: "Trust & Integrity", description: "Building lasting relationships through transparency and honesty" },
    { title: "Excellence", description: "Delivering exceptional outcomes with meticulous attention to detail" },
    { title: "Global Reach", description: "Connecting investors worldwide to exclusive UAE opportunities" },
  ],
  stats: {
    portfolioValue: "AED 2B+",
    yearsExperience: "12+",
    propertiesSold: "3,900+",
    propertiesManaged: "4,200+",
    countriesServed: "92+",
    clientSatisfaction: "98%"
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
      page1.drawText("J | J", {
        x: pageWidth / 2 - 60,
        y: pageHeight - 200,
        size: 72,
        font: helveticaBold,
        color: goldColor,
      });

      page1.drawText("GLOBAL     CAPITAL", {
        x: pageWidth / 2 - 115,
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

      page1.drawText("2024", {
        x: pageWidth / 2 - 25,
        y: pageHeight - 400,
        size: 18,
        font: helvetica,
        color: grayColor,
      });

      // Tagline
      page1.drawText("Your Gateway to UAE's Premier", {
        x: pageWidth / 2 - 135,
        y: pageHeight - 500,
        size: 16,
        font: helvetica,
        color: whiteColor,
      });
      page1.drawText("Real Estate Investment", {
        x: pageWidth / 2 - 100,
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

      page2.drawText("J | J GLOBAL CAPITAL", {
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
        "JJ Global Capital is the UAE's premier investment advisory firm,",
        "specializing in luxury real estate and comprehensive wealth",
        "management solutions. Founded by visionary entrepreneur Jane Abou",
        "Jaoude, we have established ourselves as the trusted partner for",
        "ultra-high-net-worth individuals seeking exceptional investment",
        "opportunities in the UAE.",
        "",
        "Our founder-led approach ensures that every client receives",
        "personalized attention and strategic guidance, backed by our",
        "extensive market knowledge and exclusive network of developers,",
        "legal experts, and luxury service providers.",
        "",
        "With a portfolio exceeding AED 2 Billion and over 3,900 properties",
        "sold, we continue to set the standard for excellence in the UAE",
        "real estate market."
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
        "To provide discerning investors with unparalleled access to the",
        "UAE's most exclusive investment opportunities, delivered with the",
        "highest standards of integrity, expertise, and personalized service."
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
        "To be the definitive choice for global investors seeking premium",
        "real estate and lifestyle investments in the UAE, recognized for",
        "our exceptional track record and commitment to client success."
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
      page2.drawText("www.jjglobalcapital.com", {
        x: pageWidth / 2 - 60,
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

      page3.drawText("J | J GLOBAL CAPITAL", {
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

      // Stats grid
      const statsData = [
        { label: "Portfolio Value", value: "AED 2B+" },
        { label: "Years Experience", value: "12+" },
        { label: "Properties Sold", value: "3,900+" },
        { label: "Properties Managed", value: "4,200+" },
        { label: "Countries Served", value: "92+" },
        { label: "Client Satisfaction", value: "98%" },
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
        "Premium Real Estate Investment Advisory",
        "Luxury Concierge & Lifestyle Management",
        "Legal Services & Property Conveyancing",
        "Interior Design & Architecture",
        "Mortgage & Financial Advisory",
        "Golden Visa Assistance"
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
      page3.drawText("www.jjglobalcapital.com", {
        x: pageWidth / 2 - 60,
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
      page4.drawText("J | J", {
        x: pageWidth / 2 - 50,
        y: pageHeight - 150,
        size: 56,
        font: helveticaBold,
        color: goldColor,
      });

      page4.drawText("GLOBAL     CAPITAL", {
        x: pageWidth / 2 - 100,
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
        { label: "Email", value: "Invest@JJGlobalCapital.com" },
        { label: "Website", value: "www.jjglobalcapital.com" },
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
      page4.drawText("Powered by JJ Holding Group", {
        x: pageWidth / 2 - 75,
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
      "Check out JJ Global Capital - UAE's Premier Real Estate Investment Advisory. Download their company profile at: https://jjglobalcapital.com/company-profile"
    );
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent("JJ Global Capital - Company Profile");
    const body = encodeURIComponent(
      "I wanted to share with you the company profile of JJ Global Capital, UAE's Premier Real Estate Investment Advisory.\n\nVisit: https://jjglobalcapital.com/company-profile"
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText("https://jjglobalcapital.com/company-profile");
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
            alt="JJ Global Capital" 
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
          <motion.div variants={fadeInUp} className="mb-6">
            <BackNavButton />
          </motion.div>
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
              JJ Global Capital
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
              className="bg-gradient-to-r from-gold to-gold-dark text-black font-bold px-8 py-6 text-lg hover:opacity-90"
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
              Download our comprehensive company profile to learn more about JJ Global Capital
            </p>
            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="bg-gradient-to-r from-gold to-gold-dark text-black font-bold px-10 py-6 text-lg hover:opacity-90"
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
              JJ Global Capital - Company Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6">
            {/* PDF Preview Card */}
            <div className="bg-black rounded-xl p-8 border border-gold/20 mb-6">
              <div className="flex items-center justify-center mb-6">
                <JJLogo size="lg" />
              </div>
              <div className="text-center">
                <p className="text-gold text-sm uppercase tracking-[0.3em] mb-2">Company Profile</p>
                <p className="text-white text-2xl font-bold mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
                  JJ Global Capital
                </p>
                <p className="text-zinc-500 text-sm">4 Pages • PDF Document</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-gold to-gold-dark text-black font-bold py-6 hover:opacity-90"
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