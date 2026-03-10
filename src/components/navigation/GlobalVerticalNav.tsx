import { Link, useLocation } from "react-router-dom";
import {
  Building2, BarChart3, BookOpen, Briefcase, Users, Home, Tag, Key, PlusCircle,
  Building, Layers, Cpu, Heart, GitCompare, Calculator, Headphones, MapPin,
  Lightbulb, ChevronRight, ChevronDown, Search, User, Settings, Castle, FileText,
  DollarSign, TrendingUp, ClipboardCheck, Shield, Sparkles, Bot, Video, Image,
  Mic, Stamp, CreditCard, Palette, Pen, Award, Globe, Brain, MessageSquare,
  Phone, Languages, FileSearch, FilePlus, UserCheck, CalendarClock, Mail,
  Share2, PenTool, Megaphone, GraduationCap, Briefcase as BriefcaseIcon,
} from "lucide-react";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";
import React, { useState, useCallback, useEffect } from "react";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";

/* ─── NAV STRUCTURE ─── */

interface NavItem {
  label: string;
  href: string;
  icon: any;
  highlight?: boolean; // gold accent hub
  children?: NavItem[];
}

const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  {
    title: "HUBS",
    items: [
      { label: "Buy Properties", href: "/properties", icon: Building2, highlight: true },
      { label: "AI Tools Hub", href: "/ai-hub", icon: Cpu, highlight: true },
      { label: "Listing Portal", href: "/listing-portal", icon: ClipboardCheck, highlight: true },
      { label: "Careers & Join", href: "/join", icon: GraduationCap, highlight: true },
      { label: "Broker Hub", href: "/broker-hub", icon: BriefcaseIcon, highlight: true },
      { label: "Investor Hub", href: "/investor-hub", icon: TrendingUp, highlight: true },
    ],
  },
  {
    title: "PROPERTIES",
    items: [
      { label: "Off-plan", href: "/properties", icon: Building2 },
      { label: "Buy", href: "/buy", icon: Home },
      { label: "Sell", href: "/sell", icon: Tag },
      { label: "Rent", href: "/rent", icon: Key },
      { label: "List Property", href: "/list-property", icon: PlusCircle },
      { label: "Developers", href: "/developers", icon: Building },
      { label: "Areas", href: "/areas", icon: MapPin },
      { label: "Map", href: "/map", icon: MapPin },
    ],
  },
  {
    title: "AI TOOLS",
    items: [
      {
        label: "Property Intelligence", href: "#", icon: Brain, children: [
          { label: "Property Analyzer", href: "/ai-property-analyzer", icon: Building },
          { label: "Price Predictor", href: "/ai-price-predictor", icon: TrendingUp },
          { label: "Neighborhood Insights", href: "/ai-neighborhood-insights", icon: MapPin },
          { label: "Interior Design AI", href: "/interior-design-ai", icon: Palette },
          { label: "Rental Index", href: "/rental-index", icon: BarChart3 },
          { label: "Property Evaluator", href: "/property-evaluator", icon: Calculator },
        ],
      },
      {
        label: "Lead & Sales", href: "#", icon: UserCheck, children: [
          { label: "Lead Qualification", href: "/ai-lead-qualification", icon: UserCheck },
          { label: "Follow-up Scheduler", href: "/ai-followup-scheduler", icon: CalendarClock },
          { label: "Objection Handler", href: "/ai-objection-handler", icon: MessageSquare },
          { label: "Client Matcher", href: "/ai-client-matcher", icon: Users },
        ],
      },
      {
        label: "Analytics", href: "#", icon: BarChart3, children: [
          { label: "Market Report", href: "/ai-market-report", icon: FileText },
          { label: "ROI Calculator", href: "/ai-roi-calculator", icon: Calculator },
          { label: "Competitor Analysis", href: "/ai-competitor-analysis", icon: Users },
          { label: "Investment Report", href: "/ai-investment-report", icon: TrendingUp },
        ],
      },
      {
        label: "Communication", href: "#", icon: MessageSquare, children: [
          { label: "Email Generator", href: "/ai-email-generator", icon: Mail },
          { label: "Translation Hub", href: "/ai-translation-hub", icon: Languages },
          { label: "Video Tour Script", href: "/ai-video-tour-script", icon: Video },
          { label: "Social Media", href: "/ai-social-media", icon: Share2 },
          { label: "Description Writer", href: "/ai-description-writer", icon: PenTool },
          { label: "Meeting Summarizer", href: "/ai-meeting-summarizer", icon: Mic },
          { label: "Call Summarizer", href: "/ai-call-summarizer", icon: Phone },
        ],
      },
      {
        label: "Documents", href: "#", icon: FileSearch, children: [
          { label: "Contract Reviewer", href: "/ai-contract-reviewer", icon: FileSearch },
          { label: "Document Generator", href: "/ai-document-generator", icon: FilePlus },
        ],
      },
      {
        label: "Utility AI", href: "#", icon: Bot, children: [
          { label: "AI Calendar", href: "/ai-calendar", icon: CalendarClock },
          { label: "Budget Planner", href: "/ai-budget-planner", icon: DollarSign },
          { label: "Personal Shopper", href: "/ai-personal-shopper", icon: Heart },
          { label: "AI Home Finder", href: "/quiz", icon: Home },
        ],
      },
    ],
  },
  {
    title: "CREATIVE SUITES",
    items: [
      { label: "Corporate Suite", href: "/toolkit/corporate-suite", icon: Building },
      { label: "Video Suite", href: "/toolkit/video-suite", icon: Video },
      { label: "Photo Suite", href: "/toolkit/photo-suite", icon: Image },
      { label: "Voice & Audio", href: "/toolkit/voice-suite", icon: Mic },
      { label: "PDF & Documents", href: "/toolkit/pdf-suite", icon: FileText },
      { label: "Stamp Generator", href: "/toolkit/stamp-generator", icon: Stamp },
      { label: "Business Card", href: "/toolkit/corporate-suite/business-card", icon: CreditCard },
      { label: "Logo Maker", href: "/toolkit/corporate-suite/logo-creator", icon: Palette },
      { label: "CV Builder", href: "/toolkit/corporate-suite/cv-resume", icon: FileText },
      { label: "Cover Letter", href: "/toolkit/corporate-suite/cover-letter", icon: Pen },
      { label: "Company Profile", href: "/toolkit/corporate-suite/company-profile", icon: Award },
      { label: "E-Sign", href: "/e-signature", icon: Globe },
      { label: "Scan & Sign", href: "/toolkit/scan-sign", icon: FileText },
    ],
  },
  {
    title: "INSIGHTS",
    items: [
      { label: "Market Intelligence", href: "/market-intelligence", icon: BarChart3 },
      { label: "Market Report", href: "/market-report", icon: FileText },
      { label: "Guides", href: "/guides", icon: BookOpen },
      { label: "News", href: "/news", icon: Megaphone },
      { label: "Buyer Guide", href: "/buyer-guide", icon: FileText },
      { label: "Seller Guide", href: "/seller-guide", icon: FileText },
      { label: "Rent Guide", href: "/rent-guide", icon: FileText },
      { label: "Tenant Guide", href: "/tenant-guide", icon: FileText },
      { label: "Landlord Guide", href: "/landlord-guide", icon: FileText },
      { label: "Investor Education", href: "/investor-education", icon: BookOpen },
      { label: "Broker Education", href: "/broker-education", icon: BookOpen },
    ],
  },
  {
    title: "COMPANY",
    items: [
      { label: "About", href: "/about", icon: Users },
      { label: "Services", href: "/services", icon: Briefcase },
      { label: "Team", href: "/team", icon: Users },
      { label: "Founder", href: "/founder", icon: Award },
      { label: "Awards", href: "/awards", icon: Award },
      { label: "Partners", href: "/partners", icon: Users },
      { label: "Contact", href: "/contact", icon: Phone },
      { label: "FAQ", href: "/faq", icon: Lightbulb },
    ],
  },
  {
    title: "MY ACCOUNT",
    items: [
      { label: "Favorites", href: "/favorites", icon: Heart },
      { label: "Compare", href: "/compare", icon: GitCompare },
      { label: "My Dashboard", href: "/my-dashboard", icon: User },
      { label: "Mortgage Calc", href: "/mortgage-calculator", icon: Calculator },
      { label: "AI History", href: "/my-ai-history", icon: Bot },
    ],
  },
];

export default function GlobalVerticalNav() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["HUBS"]));

  useEffect(() => {
    document.body.classList.add("jj-vertical-nav-active");
    return () => document.body.classList.remove("jj-vertical-nav-active");
  }, []);

  const toggleSection = useCallback((title: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }, []);

  const [expandedChildren, setExpandedChildren] = useState<Set<string>>(new Set());
  const toggleChildren = useCallback((label: string) => {
    setExpandedChildren((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const isActive = (href: string) => {
    if (href === "#") return false;
    if (href === "/properties") return location.pathname === "/properties" || location.pathname.startsWith("/properties/");
    return location.pathname === href;
  };

  return (
    <>
      <div className="w-[200px] flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-gold/30 flex flex-col h-full">
        {/* Logo */}
        <Link to="/" className="p-3 border-b border-gold/20 flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={jbjMonogramLightBg} alt="JBJ" className="w-12 h-12 object-contain" />
          <div className="flex flex-col" style={{ fontFamily: "Poppins, sans-serif" }}>
            <span className="text-[10px] font-bold text-black tracking-wide leading-tight">JBJ GLOBAL</span>
            <span className="text-[10px] font-bold text-gold tracking-wide leading-tight">REAL ESTATE</span>
          </div>
        </Link>

        {/* Scrollable Nav */}
        <nav className="flex-1 py-2 px-1.5 overflow-y-scroll jj-scrollbar-gold" style={{ scrollbarGutter: "stable" }}>
          {NAV_SECTIONS.map((section) => {
            const title = section.title || "NAV";
            const isExpanded = expandedSections.has(title);
            return (
              <div key={title} className="mb-1">
                {section.title && (
                  <button
                    onClick={() => toggleSection(title)}
                    className="flex items-center justify-between w-full px-2 py-1.5 text-[9px] font-bold tracking-[0.15em] text-gold/80 uppercase hover:text-gold transition-colors"
                  >
                    <span>{section.title}</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "" : "-rotate-90"}`} />
                  </button>
                )}
                {isExpanded && (
                  <div className="space-y-px">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      const hasChildren = item.children && item.children.length > 0;
                      const childExpanded = expandedChildren.has(item.label);

                      return (
                        <div key={item.label + item.href}>
                          {hasChildren ? (
                            <button
                              onClick={() => toggleChildren(item.label)}
                              className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                                childExpanded
                                  ? "bg-gold/10 text-black font-semibold"
                                  : "text-black/65 hover:bg-white/50 hover:text-black"
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${childExpanded ? "text-gold" : "text-black/40"}`} />
                              <span className="flex-1 text-left">{item.label}</span>
                              <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${childExpanded ? "" : "-rotate-90"} ${childExpanded ? "text-gold" : "text-black/30"}`} />
                            </button>
                          ) : (
                            <Link
                              to={item.href}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                                item.highlight
                                  ? active
                                    ? "bg-gradient-to-r from-gold/25 to-gold/15 text-black border border-gold/50 font-bold"
                                    : "text-gold font-semibold hover:bg-gold/10"
                                  : active
                                    ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black border border-gold/40 font-bold"
                                    : "text-black/65 hover:bg-white/50 hover:text-black"
                              }`}
                            >
                              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${active || item.highlight ? "text-gold" : "text-black/40"}`} />
                              <span className="flex-1">{item.label}</span>
                              {item.highlight && !active && (
                                <Sparkles className="w-3 h-3 text-gold/60" />
                              )}
                            </Link>
                          )}

                          {/* Children */}
                          {hasChildren && childExpanded && (
                            <div className="ml-4 mt-0.5 mb-1 space-y-px border-l border-gold/20 pl-2">
                              {item.children!.map((child) => {
                                const CIcon = child.icon;
                                const cActive = isActive(child.href);
                                return (
                                  <Link
                                    key={child.href}
                                    to={child.href}
                                    className={`flex items-center gap-2 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                                      cActive
                                        ? "bg-gold/15 text-black font-bold"
                                        : "text-black/55 hover:bg-white/40 hover:text-black"
                                    }`}
                                  >
                                    <CIcon className={`w-3 h-3 flex-shrink-0 ${cActive ? "text-gold" : "text-black/35"}`} />
                                    <span>{child.label}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Utility Section */}
        <div className="px-2 py-2 border-t border-gold/20 space-y-0.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-black/65 hover:bg-white/50 hover:text-black transition-all w-full"
          >
            <Search className="w-3.5 h-3.5 text-black/40" />
            Search
          </button>
          <div className="flex items-center gap-1 px-1">
            <LanguageSwitcher variant="icon-only" />
            <CurrencySwitcher variant="icon-only" />
          </div>
          <Link to="/my-dashboard" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-black/65 hover:bg-white/50 hover:text-black transition-all">
            <User className="w-3.5 h-3.5 text-black/40" />
            Dashboard
          </Link>
          <Link to="/profile" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-medium text-black/65 hover:bg-white/50 hover:text-black transition-all">
            <Settings className="w-3.5 h-3.5 text-black/40" />
            Settings
          </Link>
        </div>

        {/* Bottom */}
        <div className="p-3 border-t border-gold/20 space-y-1">
          <a href="mailto:info@jbjglobal.com" className="flex items-center gap-2 text-[11px] font-bold text-gold hover:text-gold/80 transition-colors">
            <Headphones className="w-3.5 h-3.5" />
            Contact Support
          </a>
        </div>
      </div>

      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />
    </>
  );
}
