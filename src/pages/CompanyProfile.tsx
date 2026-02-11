import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  FileText, 
  Building2, 
  Globe, 
  Shield,
  Target,
  CheckCircle,
  Phone,
  MessageCircle,
  Clock,
  MapPin,
  Mail,
  Briefcase,
  Eye,
  Heart,
  Home,
  TrendingUp,
  Key,
  HardHat,
  ChevronRight,
  User,
  BookOpen
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { CONTACT_INFO, getWhatsAppUrl } from "@/constants/stats";
import { toast } from "sonner";
import { FounderContent } from "@/components/FounderContent";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";

import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import founderCompanyProfile from "@/assets/founder-company-profile.jpg";

function SectionShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`py-12 md:py-16 bg-black ${className ?? ""}`.trim()}>
      <div className="jj-layer-2">
        <div className="w-full px-4 sm:px-6 lg:px-8">{children}</div>
      </div>
    </section>
  );
}

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

// Exact content from Section 2 - DO NOT MODIFY
const PROFILE_CONTENT = {
  coverPage: {
    title: "JBJ Global Real Estate",
    subtitle: "Founder & CEO, Jane Bou Jaoude",
    subtitleFallback: "Company Profile"
  },
  executiveSummary: `JBJ Global Real Estate is a Dubai-based real estate brokerage built on precision, transparency, and long-term client relationships. Operating across Dubai's most active residential and investment markets, the firm provides structured advisory for buying, selling, leasing, and investing in property.

Our approach is defined by clarity rather than volume. Every engagement begins with understanding the client's objective, risk profile, and timeline, followed by data-driven market evaluation and disciplined execution. We work with homeowners, landlords, investors, and institutional buyers who value informed decision-making and professional representation.

JBJ Global Real Estate combines on-ground market expertise with modern intelligence tools, ensuring each recommendation is grounded in verifiable information, not assumptions. From first consultation to completion and beyond, clients receive direct access, responsive communication, and accountability at every stage.`,

  brandStory: `JBJ Global Real Estate was founded with a clear mandate: to elevate the standard of real estate advisory in Dubai by replacing transactional brokerage with structured, client-centric representation.

The Dubai property market is dynamic, fast-moving, and opportunity-rich — but it also demands discipline, accurate information, and local expertise. JBJ was established to guide clients through this complexity with confidence and clarity. The firm's foundation is built on experience across residential sales, leasing, investment structuring, and developer-led projects.

Founder-led and strategically focused, JBJ Global Real Estate operates with the understanding that real estate decisions have long-term financial and lifestyle impact. Our role is not to sell inventory, but to interpret the market, present clear options, and support informed decisions aligned with each client's goals.

Today, JBJ Global Real Estate serves local and international clients seeking reliable representation, transparent processes, and premium service delivery in Dubai's evolving property landscape.`,

  vision: "To be a trusted reference for real estate advisory in Dubai through clarity, discipline, and client confidence.",
  mission: "To provide structured, transparent real estate guidance that protects client interests and supports informed decision-making.",
  
  values: [
    { title: "Clarity", description: "Information presented accurately, without exaggeration." },
    { title: "Integrity", description: "Advice aligned with client objectives, not incentives." },
    { title: "Discipline", description: "Consistent processes and risk-aware execution." },
    { title: "Responsiveness", description: "Direct access and timely communication." },
    { title: "Loyalty", description: "Long-term commitment to client success and trust." },
    { title: "Accountability", description: "Responsibility throughout the transaction lifecycle." }
  ],

  services: [
    {
      title: "Residential Sales Advisory",
      description: "Advisory support for primary and secondary market purchases.",
      idealFor: "Homeowners and investors.",
      deliverables: "Market evaluation, property shortlisting, transaction coordination.",
      icon: Home
    },
    {
      title: "Premium Leasing (Rentals)",
      description: "Structured leasing for residential properties.",
      idealFor: "Tenants and landlords.",
      deliverables: "Rental valuation, tenant sourcing, contract coordination.",
      icon: Key
    },
    {
      title: "Seller Representation & Pricing Strategy",
      description: "Professional representation for property owners.",
      idealFor: "Homeowners and investors selling assets.",
      deliverables: "Pricing strategy, marketing coordination, negotiation support.",
      icon: TrendingUp
    },
    {
      title: "Landlord Services / Property Management",
      description: "Operational support for rental assets.",
      idealFor: "Portfolio landlords.",
      deliverables: "Leasing oversight, tenant coordination, renewal management.",
      icon: Building2
    },
    {
      title: "Investment Advisory",
      description: "Data-driven advisory for property investment decisions.",
      idealFor: "Yield-focused investors.",
      deliverables: "Market analysis, risk assessment, scenario comparison.",
      icon: Briefcase
    },
    {
      title: "New Developments / Off-Plan Advisory",
      description: "Guidance on developer-led projects.",
      idealFor: "Investors and early buyers.",
      deliverables: "Project evaluation, payment plan analysis, booking coordination.",
      icon: HardHat
    }
  ],

  process: [
    { step: 1, title: "Consultation", description: "Understand objectives and constraints." },
    { step: 2, title: "Market Review", description: "Data-based evaluation of options." },
    { step: 3, title: "Shortlisting", description: "Curated selection aligned with goals." },
    { step: 4, title: "Execution", description: "Viewing, negotiation, coordination." },
    { step: 5, title: "Transaction", description: "Documentation and closing support." },
    { step: 6, title: "After-Care", description: "Post-transaction guidance and follow-up." }
  ],

  differentiators: [
    "Objective-driven advisory",
    "Clear pricing and market logic",
    "Curated property selection",
    "Strong developer and landlord network",
    "Negotiation discipline",
    "Transparent communication",
    "End-to-end coordination",
    "Client confidentiality"
  ],

  areas: [
    "Downtown Dubai",
    "Business Bay",
    "Dubai Marina",
    "Palm Jumeirah",
    "JBR",
    "City Walk",
    "DIFC",
    "Meydan",
    "Dubai Hills Estate",
    "Jumeirah Islands",
    "Jumeirah Village Circle",
    "Arabian Ranches"
  ],

  clientExperience: [
    "Clear expectations from day one",
    "Verified information only",
    "Timely updates",
    "Single point of contact",
    "Confidential handling of data",
    "No pressure-based selling",
    "Structured documentation",
    "Post-transaction support"
  ],

  trustCompliance: `All information is provided for guidance and is subject to change. JBJ Global Real Estate does not guarantee outcomes, returns, or timelines. Property data may be updated by developers, owners, or authorities. Client information is handled in accordance with applicable data protection standards.`,

  founderProfile: {
    name: "Jane Bou Jaoude",
    title: "Founder & CEO",
    bio: `Jane Bou Jaoude is the Founder & CEO of JBJ Global Real Estate. Her leadership philosophy centers on clarity, accountability, and long-term client trust. With hands-on involvement in advisory strategy and client engagement, she ensures that every transaction reflects disciplined market understanding rather than speculation.

Clients working with JBJ can expect direct oversight, transparent communication, and advice grounded in practical market realities. Jane's approach prioritizes alignment with client objectives, risk awareness, and execution quality.`,
    quote: "Real estate decisions deserve clarity, not pressure."
  },

  companySnapshot: {
    headquarters: "Dubai, UAE",
    serviceAreas: "GCC & Globally",
    languages: "English",
    contact: CONTACT_INFO.phone,
    email: CONTACT_INFO.email,
    website: "WWW.JBJ.AE",
    whatsapp: CONTACT_INFO.phone,
    workingHours: "Monday–Sunday, 9:00 AM – 9:00 PM"
  },

  ctas: [
    { title: "Request a Private Consultation", description: "Book a confidential advisory session.", action: "consultation" },
    { title: "List Your Property", description: "Receive a structured pricing strategy.", action: "list" },
    { title: "Get a Curated Shortlist", description: "Access verified opportunities.", action: "shortlist" }
  ]
};

// 3D Book Preview Component
const BookPreview3D = ({ onClick, isGenerating }: { onClick: () => void; isGenerating: boolean }) => {
  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {/* 3D Book Container */}
      <div className="relative w-64 h-80 mx-auto perspective-1000">
        {/* Book wrapper with 3D transform */}
        <div className="relative w-full h-full transform-style-3d transition-transform duration-500 group-hover:rotate-y-[-15deg]">
          {/* Front Cover */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black rounded-r-lg shadow-2xl border border-gold/30 overflow-hidden">
            {/* Gold accent top */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gold via-gold-light to-gold" />
            
            {/* JBJ Logo */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 text-center">
              <span className="text-5xl font-bold text-gold" style={{ fontFamily: "Poppins, sans-serif" }}>JBJ</span>
              <p className="text-white text-xs tracking-[0.3em] mt-2">GLOBAL REAL ESTATE</p>
            </div>
            
            {/* Title */}
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-center w-full px-4">
              <div className="h-px w-3/4 mx-auto bg-gradient-to-r from-transparent via-gold to-transparent mb-4" />
              <p className="text-gold text-lg font-semibold tracking-wider">COMPANY PROFILE</p>
              <p className="text-white/60 text-xs mt-2">2025 Edition</p>
            </div>
            
            {/* Gold accent bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-gold via-gold-light to-gold" />
          </div>
          
          {/* Book Spine */}
          <div className="absolute top-0 left-0 w-4 h-full bg-gradient-to-r from-zinc-800 to-black transform origin-left rotate-y-[-90deg] translate-x-[-8px] rounded-l">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gold" />
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-gold" />
          </div>
          
          {/* Pages peek */}
          <div className="absolute top-1 right-0 bottom-1 w-2 bg-gradient-to-r from-zinc-200 to-zinc-100 transform origin-right translate-x-1 rounded-r-sm">
            <div className="absolute inset-0 flex flex-col justify-evenly px-0.5">
              {[...Array(20)].map((_, i) => (
                <div key={i} className="h-px bg-zinc-300" />
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Download overlay on hover */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg">
        <div className="text-center">
          {isGenerating ? (
            <div className="w-12 h-12 border-4 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
          ) : (
            <>
              <Download className="w-12 h-12 text-gold mx-auto mb-2" />
              <p className="text-white font-semibold">Download PDF</p>
            </>
          )}
        </div>
      </div>
      
      {/* Shadow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-4 bg-black/30 blur-lg rounded-full" />
    </div>
  );
};

const CompanyProfile = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { isFounderVisible } = useFounderVisibility();

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const pdfDoc = await PDFDocument.create();
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // A4 Landscape dimensions
      const pageWidth = 842;
      const pageHeight = 595;
      const margin = 50;
      
      // Colors
      const goldColor = rgb(0.66, 0.57, 0.35);
      const blackColor = rgb(0.05, 0.05, 0.05);
      const grayColor = rgb(0.4, 0.4, 0.4);
      const whiteColor = rgb(1, 1, 1);

      // Helper function to wrap text
      const wrapText = (text: string, maxWidth: number, fontSize: number, font: typeof helvetica): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';
        
        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const width = font.widthOfTextAtSize(testLine, fontSize);
          
          if (width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // Track page numbers for TOC
      let currentPageNumber = 1;
      const tocItems: { title: string; page: number }[] = [];

      // === PAGE 1: Cover ===
      const page1 = pdfDoc.addPage([pageWidth, pageHeight]);
      page1.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: blackColor });
      page1.drawRectangle({ x: 0, y: pageHeight - 8, width: pageWidth, height: 8, color: goldColor });
      
      page1.drawText("JBJ", {
        x: pageWidth / 2 - 60,
        y: pageHeight / 2 + 80,
        size: 96,
        font: helveticaBold,
        color: goldColor,
      });
      page1.drawText("GLOBAL REAL ESTATE", {
        x: pageWidth / 2 - 140,
        y: pageHeight / 2 + 20,
        size: 24,
        font: helveticaBold,
        color: whiteColor,
      });
      page1.drawRectangle({ x: margin, y: pageHeight / 2 - 10, width: pageWidth - margin * 2, height: 1, color: goldColor });
      page1.drawText("COMPANY PROFILE", {
        x: pageWidth / 2 - 100,
        y: pageHeight / 2 - 60,
        size: 28,
        font: helveticaBold,
        color: goldColor,
      });
      
      // Only show founder subtitle if visible
      if (isFounderVisible) {
        page1.drawText("Founder & CEO, Jane Bou Jaoude", {
          x: pageWidth / 2 - 120,
          y: pageHeight / 2 - 100,
          size: 14,
          font: helvetica,
          color: grayColor,
        });
      }
      
      page1.drawText("2025 Edition", {
        x: pageWidth / 2 - 40,
        y: 60,
        size: 12,
        font: helvetica,
        color: grayColor,
      });
      page1.drawRectangle({ x: 0, y: 0, width: pageWidth, height: 8, color: goldColor });
      currentPageNumber++;

      // === PAGE 2: Table of Contents ===
      const tocPage = pdfDoc.addPage([pageWidth, pageHeight]);
      tocPage.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      tocPage.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      tocPage.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      
      tocPage.drawText("TABLE OF CONTENTS", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
      tocPage.drawRectangle({ x: margin, y: pageHeight - 108, width: 180, height: 3, color: goldColor });
      
      // TOC entries
      const tocEntries = [
        { title: "Executive Summary", page: 3 },
        { title: "Brand Story", page: 4 },
        { title: "Vision, Mission & Values", page: 5 },
        { title: "Services", page: 6 },
        { title: "Our Process", page: 7 },
        { title: "Why JBJ", page: 8 },
        { title: "Areas of Focus", page: 9 },
        { title: "Client Experience Standards", page: 10 },
        { title: "Trust & Compliance", page: 11 },
        ...(isFounderVisible ? [{ title: "Founder Profile", page: 12 }] : []),
        { title: "Company Snapshot & Contact", page: isFounderVisible ? 13 : 12 },
      ];
      
      let tocY = pageHeight - 160;
      tocEntries.forEach((entry, index) => {
        tocPage.drawText(`${index + 1}.`, { x: margin, y: tocY, size: 12, font: helveticaBold, color: goldColor });
        tocPage.drawText(entry.title, { x: margin + 30, y: tocY, size: 12, font: helvetica, color: blackColor });
        tocPage.drawText(`${entry.page}`, { x: pageWidth - margin - 20, y: tocY, size: 12, font: helvetica, color: grayColor });
        tocY -= 28;
      });
      
      tocPage.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });
      currentPageNumber++;

      // === PAGE 3: Executive Summary ===
      const page2 = pdfDoc.addPage([pageWidth, pageHeight]);
      page2.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      page2.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      page2.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      page2.drawText("Page 3", { x: pageWidth - margin - 30, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page2.drawText("EXECUTIVE SUMMARY", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
      page2.drawRectangle({ x: margin, y: pageHeight - 108, width: 140, height: 3, color: goldColor });
      
      const summaryLines = wrapText(PROFILE_CONTENT.executiveSummary.replace(/\n\n/g, ' '), pageWidth - margin * 2 - 50, 10, helvetica);
      let yPos = pageHeight - 140;
      summaryLines.forEach((line) => {
        page2.drawText(line, { x: margin, y: yPos, size: 10, font: helvetica, color: grayColor });
        yPos -= 16;
      });
      page2.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

      // === PAGE 4: Brand Story ===
      const page3 = pdfDoc.addPage([pageWidth, pageHeight]);
      page3.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      page3.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      page3.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      page3.drawText("Page 4", { x: pageWidth - margin - 30, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page3.drawText("BRAND STORY", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
      page3.drawRectangle({ x: margin, y: pageHeight - 108, width: 100, height: 3, color: goldColor });
      
      const storyLines = wrapText(PROFILE_CONTENT.brandStory.replace(/\n\n/g, ' '), pageWidth - margin * 2 - 50, 10, helvetica);
      yPos = pageHeight - 140;
      storyLines.forEach((line) => {
        page3.drawText(line, { x: margin, y: yPos, size: 10, font: helvetica, color: grayColor });
        yPos -= 16;
      });
      page3.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

      // === PAGE 5: Vision / Mission / Values ===
      const page4 = pdfDoc.addPage([pageWidth, pageHeight]);
      page4.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      page4.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      page4.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      page4.drawText("Page 5", { x: pageWidth - margin - 30, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page4.drawText("VISION", { x: margin, y: pageHeight - 100, size: 18, font: helveticaBold, color: blackColor });
      page4.drawRectangle({ x: margin, y: pageHeight - 106, width: 50, height: 2, color: goldColor });
      const visionLines = wrapText(PROFILE_CONTENT.vision, pageWidth - margin * 2 - 100, 11, helvetica);
      yPos = pageHeight - 130;
      visionLines.forEach((line) => {
        page4.drawText(line, { x: margin, y: yPos, size: 11, font: helvetica, color: grayColor });
        yPos -= 18;
      });
      
      yPos -= 20;
      page4.drawText("MISSION", { x: margin, y: yPos, size: 18, font: helveticaBold, color: blackColor });
      page4.drawRectangle({ x: margin, y: yPos - 6, width: 60, height: 2, color: goldColor });
      yPos -= 30;
      const missionLines = wrapText(PROFILE_CONTENT.mission, pageWidth - margin * 2 - 100, 11, helvetica);
      missionLines.forEach((line) => {
        page4.drawText(line, { x: margin, y: yPos, size: 11, font: helvetica, color: grayColor });
        yPos -= 18;
      });
      
      yPos -= 20;
      page4.drawText("VALUES", { x: margin, y: yPos, size: 18, font: helveticaBold, color: blackColor });
      page4.drawRectangle({ x: margin, y: yPos - 6, width: 50, height: 2, color: goldColor });
      yPos -= 35;
      PROFILE_CONTENT.values.forEach((value) => {
        page4.drawText(`• ${value.title}`, { x: margin, y: yPos, size: 11, font: helveticaBold, color: blackColor });
        page4.drawText(` — ${value.description}`, { x: margin + 80, y: yPos, size: 10, font: helvetica, color: grayColor });
        yPos -= 22;
      });
      page4.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

      // === PAGE 6: Services ===
      const page5 = pdfDoc.addPage([pageWidth, pageHeight]);
      page5.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      page5.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      page5.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      page5.drawText("Page 6", { x: pageWidth - margin - 30, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page5.drawText("WHAT WE DO — SERVICES", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
      page5.drawRectangle({ x: margin, y: pageHeight - 108, width: 180, height: 3, color: goldColor });
      
      yPos = pageHeight - 140;
      PROFILE_CONTENT.services.forEach((service) => {
        page5.drawText(service.title, { x: margin, y: yPos, size: 12, font: helveticaBold, color: blackColor });
        yPos -= 16;
        page5.drawText(service.description, { x: margin, y: yPos, size: 9, font: helvetica, color: grayColor });
        yPos -= 14;
        page5.drawText(`Ideal for: ${service.idealFor}`, { x: margin, y: yPos, size: 9, font: helvetica, color: grayColor });
        yPos -= 14;
        page5.drawText(`Deliverables: ${service.deliverables}`, { x: margin, y: yPos, size: 9, font: helvetica, color: grayColor });
        yPos -= 28;
      });
      page5.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

      // === PAGE 7: Process ===
      const page6 = pdfDoc.addPage([pageWidth, pageHeight]);
      page6.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      page6.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      page6.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      page6.drawText("Page 7", { x: pageWidth - margin - 30, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page6.drawText("OUR PROCESS", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
      page6.drawRectangle({ x: margin, y: pageHeight - 108, width: 100, height: 3, color: goldColor });
      
      yPos = pageHeight - 160;
      PROFILE_CONTENT.process.forEach((step) => {
        page6.drawText(`${step.step}.`, { x: margin, y: yPos, size: 24, font: helveticaBold, color: goldColor });
        page6.drawText(step.title, { x: margin + 40, y: yPos, size: 14, font: helveticaBold, color: blackColor });
        page6.drawText(step.description, { x: margin + 40, y: yPos - 18, size: 10, font: helvetica, color: grayColor });
        yPos -= 55;
      });
      page6.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

      // === PAGE 8: Why JBJ ===
      const page7 = pdfDoc.addPage([pageWidth, pageHeight]);
      page7.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      page7.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      page7.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      page7.drawText("Page 8", { x: pageWidth - margin - 30, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page7.drawText("WHY JBJ", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
      page7.drawRectangle({ x: margin, y: pageHeight - 108, width: 70, height: 3, color: goldColor });
      
      yPos = pageHeight - 150;
      const leftCol = PROFILE_CONTENT.differentiators.slice(0, 4);
      const rightCol = PROFILE_CONTENT.differentiators.slice(4);
      
      leftCol.forEach((item, i) => {
        page7.drawText("•", { x: margin, y: yPos - (i * 35), size: 14, font: helveticaBold, color: goldColor });
        page7.drawText(item, { x: margin + 20, y: yPos - (i * 35), size: 12, font: helvetica, color: blackColor });
      });
      rightCol.forEach((item, i) => {
        page7.drawText("•", { x: pageWidth / 2, y: yPos - (i * 35), size: 14, font: helveticaBold, color: goldColor });
        page7.drawText(item, { x: pageWidth / 2 + 20, y: yPos - (i * 35), size: 12, font: helvetica, color: blackColor });
      });
      page7.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

      // === PAGE 9: Areas of Focus ===
      const page8 = pdfDoc.addPage([pageWidth, pageHeight]);
      page8.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      page8.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      page8.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      page8.drawText("Page 9", { x: pageWidth - margin - 30, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page8.drawText("AREAS OF FOCUS", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
      page8.drawRectangle({ x: margin, y: pageHeight - 108, width: 120, height: 3, color: goldColor });
      
      yPos = pageHeight - 150;
      const areaLeftCol = PROFILE_CONTENT.areas.slice(0, 6);
      const areaRightCol = PROFILE_CONTENT.areas.slice(6);
      
      areaLeftCol.forEach((area, i) => {
        page8.drawText("•", { x: margin, y: yPos - (i * 30), size: 14, font: helveticaBold, color: goldColor });
        page8.drawText(area, { x: margin + 20, y: yPos - (i * 30), size: 12, font: helvetica, color: blackColor });
      });
      areaRightCol.forEach((area, i) => {
        page8.drawText("•", { x: pageWidth / 2, y: yPos - (i * 30), size: 14, font: helveticaBold, color: goldColor });
        page8.drawText(area, { x: pageWidth / 2 + 20, y: yPos - (i * 30), size: 12, font: helvetica, color: blackColor });
      });
      page8.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

      // === PAGE 10: Client Experience ===
      const page9 = pdfDoc.addPage([pageWidth, pageHeight]);
      page9.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      page9.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      page9.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      page9.drawText("Page 10", { x: pageWidth - margin - 35, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page9.drawText("CLIENT EXPERIENCE STANDARDS", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
      page9.drawRectangle({ x: margin, y: pageHeight - 108, width: 220, height: 3, color: goldColor });
      
      yPos = pageHeight - 150;
      PROFILE_CONTENT.clientExperience.forEach((item) => {
        page9.drawText("✓", { x: margin, y: yPos, size: 14, font: helveticaBold, color: goldColor });
        page9.drawText(item, { x: margin + 25, y: yPos, size: 12, font: helvetica, color: blackColor });
        yPos -= 35;
      });
      page9.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

      // === PAGE 11: Trust & Compliance ===
      const page10 = pdfDoc.addPage([pageWidth, pageHeight]);
      page10.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: whiteColor });
      page10.drawRectangle({ x: 0, y: pageHeight - 50, width: pageWidth, height: 50, color: blackColor });
      page10.drawText("JBJ GLOBAL REAL ESTATE", { x: margin, y: pageHeight - 32, size: 12, font: helveticaBold, color: goldColor });
      page10.drawText("Page 11", { x: pageWidth - margin - 35, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page10.drawText("TRUST & COMPLIANCE", { x: margin, y: pageHeight - 100, size: 22, font: helveticaBold, color: blackColor });
      page10.drawRectangle({ x: margin, y: pageHeight - 108, width: 150, height: 3, color: goldColor });
      
      const trustLines = wrapText(PROFILE_CONTENT.trustCompliance, pageWidth - margin * 2 - 100, 11, helvetica);
      yPos = pageHeight - 150;
      trustLines.forEach((line) => {
        page10.drawText(line, { x: margin, y: yPos, size: 11, font: helvetica, color: grayColor });
        yPos -= 20;
      });
      page10.drawText("www.jbj.ae", { x: pageWidth / 2 - 30, y: 25, size: 10, font: helvetica, color: goldColor });

      // === PAGE 12: Founder Profile (CONDITIONAL) ===
      if (isFounderVisible) {
        const page11 = pdfDoc.addPage([pageWidth, pageHeight]);
        page11.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: blackColor });
        page11.drawRectangle({ x: 0, y: pageHeight - 8, width: pageWidth, height: 8, color: goldColor });
        page11.drawText("Page 12", { x: pageWidth - margin - 35, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
        
        page11.drawText("FOUNDER PROFILE", { x: margin, y: pageHeight - 80, size: 22, font: helveticaBold, color: goldColor });
        page11.drawRectangle({ x: margin, y: pageHeight - 88, width: 130, height: 2, color: goldColor });
        
        page11.drawText(PROFILE_CONTENT.founderProfile.name, { x: margin, y: pageHeight - 130, size: 28, font: helveticaBold, color: whiteColor });
        page11.drawText(PROFILE_CONTENT.founderProfile.title, { x: margin, y: pageHeight - 155, size: 14, font: helvetica, color: goldColor });
        
        const bioLines = wrapText(PROFILE_CONTENT.founderProfile.bio.replace(/\n\n/g, ' '), pageWidth - margin * 2 - 50, 10, helvetica);
        yPos = pageHeight - 200;
        bioLines.forEach((line) => {
          page11.drawText(line, { x: margin, y: yPos, size: 10, font: helvetica, color: grayColor });
          yPos -= 16;
        });
        
        page11.drawText(`"${PROFILE_CONTENT.founderProfile.quote}"`, { x: margin, y: 100, size: 16, font: helveticaBold, color: goldColor });
        page11.drawText("— Jane Bou Jaoude", { x: margin, y: 75, size: 12, font: helvetica, color: grayColor });
        page11.drawRectangle({ x: 0, y: 0, width: pageWidth, height: 8, color: goldColor });
      }

      // === FINAL PAGE: Company Snapshot & Contact (Back Cover) ===
      const pageNumber = isFounderVisible ? 13 : 12;
      const page12 = pdfDoc.addPage([pageWidth, pageHeight]);
      page12.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: blackColor });
      page12.drawRectangle({ x: 0, y: pageHeight - 8, width: pageWidth, height: 8, color: goldColor });
      page12.drawText(`Page ${pageNumber}`, { x: pageWidth - margin - 35, y: pageHeight - 32, size: 10, font: helvetica, color: grayColor });
      
      page12.drawText("COMPANY SNAPSHOT", { x: margin, y: pageHeight - 80, size: 22, font: helveticaBold, color: goldColor });
      page12.drawRectangle({ x: margin, y: pageHeight - 88, width: 150, height: 2, color: goldColor });
      
      const snapshotItems = [
        { label: "Headquarters", value: PROFILE_CONTENT.companySnapshot.headquarters },
        { label: "Service Areas", value: PROFILE_CONTENT.companySnapshot.serviceAreas },
        { label: "Languages", value: PROFILE_CONTENT.companySnapshot.languages },
        { label: "Contact", value: PROFILE_CONTENT.companySnapshot.contact },
        { label: "Email", value: PROFILE_CONTENT.companySnapshot.email },
        { label: "Website", value: PROFILE_CONTENT.companySnapshot.website },
        { label: "Working Hours", value: PROFILE_CONTENT.companySnapshot.workingHours },
      ];
      
      yPos = pageHeight - 130;
      snapshotItems.forEach((item) => {
        page12.drawText(item.label + ":", { x: margin, y: yPos, size: 10, font: helvetica, color: grayColor });
        page12.drawText(item.value, { x: margin + 120, y: yPos, size: 11, font: helveticaBold, color: whiteColor });
        yPos -= 28;
      });
      
      // CTAs
      yPos = 180;
      page12.drawText("READY TO START?", { x: pageWidth / 2 - 80, y: yPos, size: 18, font: helveticaBold, color: goldColor });
      page12.drawRectangle({ x: pageWidth / 2 - 60, y: yPos - 8, width: 120, height: 2, color: goldColor });
      
      PROFILE_CONTENT.ctas.forEach((cta) => {
        yPos -= 35;
        page12.drawText(`• ${cta.title}`, { x: margin + 100, y: yPos, size: 12, font: helveticaBold, color: whiteColor });
        page12.drawText(cta.description, { x: margin + 100, y: yPos - 15, size: 10, font: helvetica, color: grayColor });
      });
      
      page12.drawRectangle({ x: 0, y: 0, width: pageWidth, height: 8, color: goldColor });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "JBJ_Global_Real_Estate_Company_Profile.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Company Profile downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleWhatsApp = () => {
    window.location.href = getWhatsAppUrl("Hello, I would like to request a private consultation.");
  };

  const handleCall = () => {
    window.location.href = `tel:${CONTACT_INFO.phoneRaw}`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Sticky Actions (Desktop) */}
      <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
        <Button
          onClick={handleWhatsApp}
          variant="primary"
          size="icon"
          className="rounded-full"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </Button>
        <Button onClick={handleCall} variant="primary" size="icon" className="rounded-full" aria-label="Call">
          <Phone className="w-5 h-5" />
        </Button>
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          variant="primary"
          size="icon"
          className="rounded-full"
          aria-label="Download Company Profile (PDF)"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </Button>
      </div>

      {/* 1. Hero Section */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={luxuryVillaHero} alt="JBJ Global Real Estate" className="w-full h-full object-cover" />
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
            className="text-white text-4xl md:text-6xl lg:text-7xl font-bold mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              {PROFILE_CONTENT.coverPage.title}
            </span>
          </motion.h1>
          <motion.p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-8" variants={fadeInUp}>
            <FounderContent fallback={PROFILE_CONTENT.coverPage.subtitleFallback}>
              {PROFILE_CONTENT.coverPage.subtitle}
            </FounderContent>
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
            <Button onClick={generatePDF} disabled={isGenerating} variant="primary" size="lg">
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating...
                </div>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Company Profile
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. Executive Summary */}
      <SectionShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Overview</span>
            <h2 className="text-black text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Executive Summary
            </h2>
          </div>

          <div className="jj-card-inner">
            <div className="space-y-6 text-black/70 leading-relaxed">
              {PROFILE_CONTENT.executiveSummary.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </motion.div>
      </SectionShell>

      <FounderContent>
        {/* Company Introduction Video */}
        <SectionShell>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-10">
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Watch</span>
              <h2 className="text-black text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                Company Introduction
              </h2>
              <p className="text-black/60 max-w-xl mx-auto">
                Discover our vision, values, and commitment to excellence in Dubai real estate.
              </p>
            </div>

            <div className="jj-card-inner p-0 overflow-hidden rounded-2xl">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src="https://www.youtube.com/embed/lBXXdJ2kAtQ"
                  title="JBJ Global Real Estate - Company Introduction"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </motion.div>
        </SectionShell>
      </FounderContent>

      {/* 3. Brand Story */}
      <SectionShell>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto"
        >
          <div className="text-center mb-12">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Story</span>
            <h2 className="text-black text-3xl md:text-4xl font-bold mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Brand Story
            </h2>
          </div>

          <div className="jj-card-inner">
            <div className="space-y-6 text-black/70 leading-relaxed">
              {PROFILE_CONTENT.brandStory.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* 4. Vision / Mission / Values */}
      <SectionShell>
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="jj-card-inner"
            >
              <div className="flex items-start gap-4">
                <div className="jj-icon-box-active w-12 h-12">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-black text-xl font-bold mb-2">Vision</h3>
                  <p className="text-black/70 leading-relaxed">{PROFILE_CONTENT.vision}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="jj-card-inner"
            >
              <div className="flex items-start gap-4">
                <div className="jj-icon-box-active w-12 h-12">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-black text-xl font-bold mb-2">Mission</h3>
                  <p className="text-black/70 leading-relaxed">{PROFILE_CONTENT.mission}</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="text-center mb-12">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Foundation</span>
            <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
              Values
            </h2>
          </div>

          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {PROFILE_CONTENT.values.map((value) => (
              <motion.div key={value.title} className="jj-card-inner text-center" variants={fadeInUp}>
                <div className="jj-icon-box-active w-12 h-12 mx-auto mb-3">
                  <Heart className="w-6 h-6" />
                </div>
                <h3 className="text-black text-sm font-bold mb-2">{value.title}</h3>
                <p className="text-black/70 text-xs">{value.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* 5. Services (6-card grid) */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">What We Do</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Services
          </h2>
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.services.map((service) => {
            const Icon = service.icon;
            return (
              <motion.div key={service.title} className="jj-card-inner" variants={fadeInUp}>
                <div className="jj-icon-box-active w-12 h-12 mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-black text-lg font-bold mb-2">{service.title}</h3>
                <p className="text-black/70 text-sm mb-3">{service.description}</p>
                <div className="space-y-1 text-xs text-black/70">
                  <p>
                    <span className="font-semibold text-black">Ideal for:</span> {service.idealFor}
                  </p>
                  <p>
                    <span className="font-semibold text-black">Deliverables:</span> {service.deliverables}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </SectionShell>

      {/* 6. Process (timeline) */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">How We Work</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Our Process
          </h2>
        </div>

        <div className="max-w-5xl mx-auto">
          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/30 hidden md:block" />

            {PROFILE_CONTENT.process.map((step) => (
              <motion.div key={step.step} className="flex items-start gap-6 mb-6 last:mb-0" variants={fadeInUp}>
                <div className="jj-icon-box-active w-12 h-12 rounded-full border border-gold/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-black font-bold">{step.step}</span>
                </div>
                <div className="jj-card-inner flex-1">
                  <h3 className="text-black text-lg font-bold mb-1">{step.title}</h3>
                  <p className="text-black/70">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </SectionShell>

      {/* 7. Differentiators */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Edge</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Why JBJ
          </h2>
        </div>

        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.differentiators.map((item) => (
            <motion.div key={item} className="jj-card-inner flex items-center gap-3" variants={fadeInUp}>
              <div className="jj-icon-box-active w-10 h-10">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-black/80 text-sm">{item}</span>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* 8. Areas of Focus */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Where We Operate</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Areas of Focus
          </h2>
        </div>

        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.areas.map((area) => (
            <motion.div key={area} className="jj-card-inner p-4 flex items-center gap-3" variants={fadeInUp}>
              <div className="jj-icon-box-active w-10 h-10">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-black/80 text-sm">{area}</span>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* 9. Client Experience Standards */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Our Commitment</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Client Experience Standards
          </h2>
        </div>

        <motion.div
          className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.clientExperience.map((item) => (
            <motion.div key={item} className="jj-card-inner flex items-center gap-3" variants={fadeInUp}>
              <div className="jj-icon-box-active w-10 h-10">
                <CheckCircle className="w-5 h-5" />
              </div>
              <span className="text-black/80">{item}</span>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* 10. Trust & Compliance */}
      <SectionShell>
        <div className="max-w-6xl mx-auto">
          <div className="jj-card-inner">
            <div className="flex items-start gap-4">
              <div className="jj-icon-box-active w-12 h-12">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-black font-bold text-lg mb-3">Trust & Compliance</h3>
                <p className="text-black/70 text-sm leading-relaxed">{PROFILE_CONTENT.trustCompliance}</p>
              </div>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* 11. Founder Profile - WRAPPED IN FOUNDER CONTENT */}
      <FounderContent>
        <SectionShell>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Leadership</span>
              <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Founder Profile
              </h2>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="jj-card-inner"
            >
              <div className="flex flex-col md:flex-row items-start gap-8">
                {/* Founder Photo */}
                <div className="w-32 h-40 md:w-40 md:h-52 rounded-xl overflow-hidden border-2 border-gold/30 shadow-xl flex-shrink-0">
                  <img 
                    src={founderCompanyProfile} 
                    alt={PROFILE_CONTENT.founderProfile.name}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-black text-2xl font-bold mb-1">{PROFILE_CONTENT.founderProfile.name}</h3>
                  <p className="text-gold mb-6">{PROFILE_CONTENT.founderProfile.title}</p>
                  <div className="space-y-4 text-black/70 leading-relaxed mb-8">
                    {PROFILE_CONTENT.founderProfile.bio.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                  <blockquote className="border-l-4 border-gold pl-6 py-2">
                    <p className="text-black text-xl italic mb-2">"{PROFILE_CONTENT.founderProfile.quote}"</p>
                    <cite className="text-black/60 text-sm">— {PROFILE_CONTENT.founderProfile.name}</cite>
                  </blockquote>
                </div>
              </div>
            </motion.div>
          </div>
        </SectionShell>
      </FounderContent>

      {/* 12. Company Snapshot */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">At a Glance</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Company Snapshot
          </h2>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto jj-card-inner"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Headquarters</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.headquarters}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Service Areas</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.serviceAreas}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Languages</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.languages}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Contact</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.contact}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Email</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="jj-icon-box-active w-10 h-10">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Website</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.website}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 md:col-span-2">
              <div className="jj-icon-box-active w-10 h-10">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-black/50 text-xs uppercase">Working Hours</p>
                <p className="text-black">{PROFILE_CONTENT.companySnapshot.workingHours}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* 13. Calls to Action */}
      <SectionShell>
        <div className="text-center mb-12">
          <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Get Started</span>
          <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
            Ready to Connect?
          </h2>
        </div>

        <motion.div
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          {PROFILE_CONTENT.ctas.map((cta) => (
            <motion.div
              key={cta.title}
              variants={fadeInUp}
              className="jj-card-inner group cursor-pointer"
              onClick={handleWhatsApp}
            >
              <h3 className="text-black text-lg font-bold mb-2 group-hover:text-gold transition-colors">{cta.title}</h3>
              <p className="text-black/70 text-sm mb-4">{cta.description}</p>
              <div className="flex items-center text-gold text-sm font-semibold">
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </SectionShell>

      {/* 14. PDF Download Module with 3D Book Preview */}
      <SectionShell>
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="text-center mb-8">
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Download</span>
            <h2 className="text-black text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Get the Full Company Profile
            </h2>
            <p className="text-black/70">
              {isFounderVisible ? "13" : "12"}-page A4 Landscape • Professional Format
            </p>
          </div>

          <div className="jj-card-inner py-12">
            {/* 3D Book Preview */}
            <BookPreview3D onClick={generatePDF} isGenerating={isGenerating} />

            <div className="mt-8 flex flex-col items-center gap-4">
              <p className="text-black/60 text-sm">
                JBJ_Global_Real_Estate_Company_Profile.pdf
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button onClick={generatePDF} disabled={isGenerating} variant="primary" size="lg">
                  {isGenerating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Generating...
                    </div>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button onClick={handleWhatsApp} variant="outline" size="lg" className="border-gold text-gold hover:bg-gold hover:text-black">
                  <BookOpen className="w-5 h-5" />
                  Request Print Copy
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </SectionShell>

      {/* Mobile Sticky Actions */}
      <div className="lg:hidden fixed bottom-4 left-4 right-4 z-50 flex gap-2">
        <Button onClick={handleWhatsApp} variant="primary" className="flex-1 rounded-full">
          <MessageCircle className="w-5 h-5" />
          WhatsApp
        </Button>
        <Button onClick={handleCall} variant="primary" className="flex-1 rounded-full">
          <Phone className="w-5 h-5" />
          Call
        </Button>
        <Button
          onClick={generatePDF}
          disabled={isGenerating}
          variant="primary"
          size="icon"
          className="rounded-full"
          aria-label="Download Company Profile (PDF)"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default CompanyProfile;
