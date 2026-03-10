import { Link, useLocation } from "react-router-dom";
import {
  Building2, BarChart3, BookOpen, Briefcase, Users, Home, Tag, Key, PlusCircle,
  Building, Layers, Cpu, Heart, GitCompare, Calculator, Headphones, MapPin,
  Lightbulb, ChevronRight, Search, User, Settings, Castle, FileText,
  DollarSign, TrendingUp, ClipboardCheck, Shield, Sparkles, Bot, Video, Image,
  Mic, Stamp, CreditCard, Palette, Pen, Award, Globe, Brain, MessageSquare,
  Phone, Languages, FileSearch, FilePlus, UserCheck, CalendarClock, Mail,
  Share2, PenTool, Megaphone, GraduationCap, Briefcase as BriefcaseIcon,
  LayoutDashboard, FolderOpen, ListChecks, Bell, Zap, Menu, X,
} from "lucide-react";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";
import React, { useState, useCallback, useEffect, useRef } from "react";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";

/* ─── TYPES ─── */
type MegaMenuKey = 'buy' | 'sell' | 'rent' | 'developers' | 'areas' | 'insights' | 'ai-tools' | 'creative' | 'shortcuts';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  highlight?: boolean;
  megaMenu?: MegaMenuKey;
}

/* ─── NAV ITEMS (flat, like PropertiesVerticalNav) ─── */
const NAV_ITEMS: NavItem[] = [
  // Highlighted hubs
  { label: "Buy Properties", href: "/properties", icon: Building2, highlight: true },
  { label: "AI Tools Hub", href: "/ai-hub", icon: Cpu, highlight: true, megaMenu: 'ai-tools' },
  { label: "Listing Portal", href: "/listing-portal", icon: ClipboardCheck, highlight: true },
  { label: "Careers & Join", href: "/join", icon: GraduationCap, highlight: true },
  { label: "Resale Properties", href: "/resale-properties", icon: DollarSign, highlight: true },
  // Properties
  { label: "Off-plan", href: "/properties", icon: Building2 },
  { label: "Buy", href: "/buy", icon: Home, megaMenu: 'buy' },
  { label: "Sell", href: "/sell", icon: Tag, megaMenu: 'sell' },
  { label: "Rent", href: "/rent", icon: Key, megaMenu: 'rent' },
  { label: "List Property", href: "/list-property", icon: PlusCircle },
  { label: "Developers", href: "/developers", icon: Building, megaMenu: 'developers' },
  { label: "Areas", href: "/areas", icon: MapPin, megaMenu: 'areas' },
  { label: "Map", href: "/map", icon: MapPin },
  // Creative
  { label: "Royal Tools Hub", href: "/toolkit", icon: Sparkles, megaMenu: 'creative' },
  // Insights
  { label: "Market Intelligence", href: "/market-intelligence", icon: BarChart3 },
  { label: "Insights", href: "/insights", icon: Lightbulb, megaMenu: 'insights' },
  { label: "Guides", href: "/guides", icon: BookOpen },
  { label: "News", href: "/news", icon: Megaphone },
  // Company
  { label: "About", href: "/about", icon: Users },
  { label: "Services", href: "/services", icon: Briefcase },
  { label: "Team", href: "/team", icon: Users },
  { label: "Contact", href: "/contact", icon: Phone },
  // Account
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Compare", href: "/compare", icon: GitCompare },
  { label: "Mortgage Calculator", href: "/mortgage-calculator", icon: Calculator },
  { label: "My Dashboard", href: "/my-dashboard", icon: User },
];

/* ─── MEGA MENU LINK SETS ─── */
const MEGA_MENU_LINKS: Record<MegaMenuKey, Array<{ label: string; href: string; icon: any }>> = {
  buy: [
    { label: 'Apartments', icon: Building2, href: '/properties?type=apartment&transaction=buy' },
    { label: 'Villas', icon: Home, href: '/properties?type=villa&transaction=buy' },
    { label: 'Townhouses', icon: Castle, href: '/properties?type=townhouse&transaction=buy' },
    { label: 'Penthouses', icon: Building, href: '/properties?type=penthouse&transaction=buy' },
    { label: "Buyer's Guide", icon: FileText, href: '/buyer-guide' },
    { label: 'Mortgage Calculator', icon: Calculator, href: '/mortgage-calculator' },
  ],
  sell: [
    { label: "Seller's Guide", icon: FileText, href: '/seller-guide' },
    { label: 'Property Valuation', icon: DollarSign, href: '/sell/valuation' },
    { label: 'Selling Advisory', icon: TrendingUp, href: '/services/selling-advisory' },
    { label: 'Listing Portal', icon: ClipboardCheck, href: '/listing-portal' },
  ],
  rent: [
    { label: 'Apartments', icon: Building2, href: '/properties?type=apartment&transaction=rent' },
    { label: 'Villas', icon: Home, href: '/properties?type=villa&transaction=rent' },
    { label: "Tenant's Guide", icon: FileText, href: '/tenant-guide' },
    { label: 'Property Management', icon: Shield, href: '/services/property-management' },
  ],
  developers: [
    { label: 'All Developers', icon: Building, href: '/developers' },
  ],
  areas: [
    { label: 'All Areas', icon: MapPin, href: '/areas' },
    { label: 'Area Guides', icon: BookOpen, href: '/area-guides' },
  ],
  insights: [
    { label: 'Market Intelligence', icon: BarChart3, href: '/market-intelligence' },
    { label: 'Market Report', icon: FileText, href: '/market-report' },
    { label: 'Guides', icon: BookOpen, href: '/guides' },
    { label: 'Buyer Guide', icon: FileText, href: '/buyer-guide' },
    { label: 'Seller Guide', icon: FileText, href: '/seller-guide' },
    { label: 'Rent Guide', icon: FileText, href: '/rent-guide' },
    { label: 'Investor Education', icon: BookOpen, href: '/investor-education' },
    { label: 'Broker Education', icon: BookOpen, href: '/broker-education' },
  ],
  'ai-tools': [
    { label: 'Property Analyzer', icon: Building, href: '/ai-property-analyzer' },
    { label: 'Price Predictor', icon: TrendingUp, href: '/ai-price-predictor' },
    { label: 'Neighborhood Insights', icon: MapPin, href: '/ai-neighborhood-insights' },
    { label: 'Interior Design AI', icon: Palette, href: '/interior-design-ai' },
    { label: 'Lead Qualification', icon: UserCheck, href: '/ai-lead-qualification' },
    { label: 'Follow-up Scheduler', icon: CalendarClock, href: '/ai-followup-scheduler' },
    { label: 'Objection Handler', icon: MessageSquare, href: '/ai-objection-handler' },
    { label: 'Client Matcher', icon: Users, href: '/ai-client-matcher' },
    { label: 'Market Report', icon: FileText, href: '/ai-market-report' },
    { label: 'ROI Calculator', icon: Calculator, href: '/ai-roi-calculator' },
    { label: 'Email Generator', icon: Mail, href: '/ai-email-generator' },
    { label: 'Translation Hub', icon: Languages, href: '/ai-translation-hub' },
    { label: 'Video Tour Script', icon: Video, href: '/ai-video-tour-script' },
    { label: 'Social Media', icon: Share2, href: '/ai-social-media' },
    { label: 'Description Writer', icon: PenTool, href: '/ai-description-writer' },
    { label: 'Meeting Summarizer', icon: Mic, href: '/ai-meeting-summarizer' },
    { label: 'Call Summarizer', icon: Phone, href: '/ai-call-summarizer' },
    { label: 'Contract Reviewer', icon: FileSearch, href: '/ai-contract-reviewer' },
    { label: 'Document Generator', icon: FilePlus, href: '/ai-document-generator' },
    { label: 'AI Calendar', icon: CalendarClock, href: '/ai-calendar' },
    { label: 'Budget Planner', icon: DollarSign, href: '/ai-budget-planner' },
    { label: 'AI Home Finder', icon: Home, href: '/quiz' },
  ],
  creative: [
    { label: 'Corporate Suite', icon: Building, href: '/toolkit/corporate-suite' },
    { label: 'Video Suite', icon: Video, href: '/toolkit/video-suite' },
    { label: 'Photo Suite', icon: Image, href: '/toolkit/photo-suite' },
    { label: 'Voice & Audio', icon: Mic, href: '/toolkit/voice-suite' },
    { label: 'PDF & Documents', icon: FileText, href: '/toolkit/pdf-suite' },
    { label: 'Stamp Generator', icon: Stamp, href: '/toolkit/stamp-generator' },
    { label: 'Business Card', icon: CreditCard, href: '/toolkit/corporate-suite/business-card' },
    { label: 'Logo Maker', icon: Palette, href: '/toolkit/corporate-suite/logo-creator' },
    { label: 'CV Builder', icon: FileText, href: '/toolkit/corporate-suite/cv-resume' },
    { label: 'Cover Letter', icon: Pen, href: '/toolkit/corporate-suite/cover-letter' },
    { label: 'Company Profile', icon: Award, href: '/toolkit/corporate-suite/company-profile' },
    { label: 'E-Sign', icon: Globe, href: '/e-signature' },
  ],
  shortcuts: [
    { label: 'My Dashboard', icon: LayoutDashboard, href: '/my-dashboard' },
    { label: 'AI Tools', icon: Sparkles, href: '/ai-hub' },
    { label: 'CRM Dashboard', icon: Users, href: '/crm' },
    { label: 'Customer Happiness', icon: Headphones, href: '/admin?tab=customer-happiness' },
    { label: 'My Tasks', icon: ListChecks, href: '/my-dashboard#tasks' },
    { label: 'Notifications', icon: Bell, href: '/my-dashboard#notifications' },
    { label: 'AI Calendar & Notes', icon: CalendarClock, href: '/ai-calendar' },
    { label: 'Owner Command Center', icon: Shield, href: '/owner' },
    { label: 'Admin Panel', icon: Shield, href: '/admin' },
    { label: 'Listing Admin', icon: FolderOpen, href: '/listing-admin' },
    { label: 'Broker Dashboard', icon: BriefcaseIcon, href: '/broker-dashboard' },
    { label: 'My Assistant', icon: Bot, href: '/founder-assistant' },
    { label: 'Support Tickets', icon: Headphones, href: '/support-tickets' },
    { label: 'My Profile', icon: User, href: '/profile' },
    { label: 'Settings', icon: Settings, href: '/profile' },
    { label: 'Favorites', icon: Heart, href: '/favorites' },
    { label: 'AI History', icon: Bot, href: '/my-ai-history' },
  ],
};

/* ─── COMPONENT ─── */
export default function GlobalVerticalNav() {
  const location = useLocation();
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("jj-vertical-nav-active");
    return () => document.body.classList.remove("jj-vertical-nav-active");
  }, []);

  const handleNavClick = useCallback((megaMenu?: MegaMenuKey, e?: React.MouseEvent) => {
    if (megaMenu) {
      e?.preventDefault();
      setActiveMegaMenu(prev => prev === megaMenu ? null : megaMenu);
    }
  }, []);

  const closeMegaMenu = useCallback(() => setActiveMegaMenu(null), []);

  useEffect(() => { closeMegaMenu(); setMobileOpen(false); }, [location.pathname, closeMegaMenu]);

  const isActive = (href: string) => {
    if (href === "#") return false;
    if (href === "/properties") return location.pathname === "/properties" || location.pathname.startsWith("/properties/");
    return location.pathname === href;
  };

  const renderMegaMenu = () => {
    if (!activeMegaMenu) return null;
    const links = MEGA_MENU_LINKS[activeMegaMenu] || [];
    return (
      <>
        <div
          className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm"
          style={{ left: '200px' }}
          onClick={closeMegaMenu}
        />
        <div
          className="fixed z-[10000] flex items-start justify-center pointer-events-none"
          style={{ left: '200px', top: 0, bottom: 0, right: 0 }}
        >
          <div
            className="pointer-events-auto max-w-[400px] w-full max-h-[70vh] overflow-y-auto jj-scrollbar-gold mt-8 rounded-2xl shadow-2xl border-2 border-gold/40 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6]"
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={closeMegaMenu}
          >
            <div className="p-4 space-y-0.5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-gold font-bold px-3 pb-2 mb-1 border-b border-gold/20">
                {activeMegaMenu === 'shortcuts' ? 'My Shortcuts' :
                 activeMegaMenu === 'ai-tools' ? 'AI Tools' :
                 activeMegaMenu === 'creative' ? 'Creative Suites' :
                 activeMegaMenu.charAt(0).toUpperCase() + activeMegaMenu.slice(1)}
              </p>
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href + link.label}
                    to={link.href}
                    onClick={closeMegaMenu}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-black/80 hover:bg-gold/10 hover:text-black transition-all"
                  >
                    <Icon className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderNavContent = () => (
    <>
      {/* Logo */}
      <Link to="/" className="p-4 border-b border-gold/20 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img src={jbjMonogramLightBg} alt="JBJ" className="w-16 h-16 object-contain" />
        <div className="flex flex-col" style={{ fontFamily: "Poppins, sans-serif" }}>
          <span className="text-[11px] font-bold text-black tracking-wide leading-tight">JBJ GLOBAL</span>
          <span className="text-[11px] font-bold text-gold tracking-wide leading-tight">REAL ESTATE</span>
        </div>
      </Link>

      {/* My Shortcuts - premium flyout trigger */}
      <div className="px-2 pt-3 pb-1">
        <button
          onClick={(e) => handleNavClick('shortcuts', e as any)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-bold w-full transition-all ${
            activeMegaMenu === 'shortcuts'
              ? "bg-gradient-to-r from-gold/25 to-gold/15 text-black border border-gold/50"
              : "text-gold hover:bg-gold/10 border border-gold/30"
          }`}
        >
          <Zap className="w-4 h-4 text-gold flex-shrink-0" />
          <span className="flex-1 text-left">My Shortcuts</span>
          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeMegaMenu === 'shortcuts' ? "rotate-90 text-gold" : "text-gold/50"}`} />
        </button>
      </div>

      {/* Nav Items */}
      <nav
        className="flex-1 py-2 px-2 space-y-0.5 overflow-y-scroll jj-scrollbar-gold"
        style={{ scrollbarGutter: "stable" }}
      >
        {NAV_ITEMS.map((item, i) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const hasMega = !!item.megaMenu;
          const isMenuOpen = activeMegaMenu === item.megaMenu;
          return (
            <Link
              key={item.href + item.label + i}
              to={item.href}
              onClick={(e) => {
                if (hasMega) handleNavClick(item.megaMenu, e);
              }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
                item.highlight
                  ? active || isMenuOpen
                    ? "bg-gradient-to-r from-gold/25 to-gold/15 text-black border border-gold/50 font-bold"
                    : "text-gold font-semibold hover:bg-gold/10"
                  : active || isMenuOpen
                    ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black border border-gold/40 font-bold"
                    : "text-black/70 hover:bg-white/60 hover:text-black"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active || isMenuOpen || item.highlight ? "text-gold" : "text-black/50"}`} />
              <span className="flex-1">{item.label}</span>
              {hasMega && (
                <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${isMenuOpen ? "rotate-90 text-gold" : "text-black/30"}`} />
              )}
              {item.highlight && !active && !isMenuOpen && (
                <Sparkles className="w-3 h-3 text-gold/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Utility Section */}
      <div className="px-3 py-2 border-t border-gold/20 space-y-1">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-black/70 hover:bg-white/60 hover:text-black transition-all w-full"
        >
          <Search className="w-4 h-4 text-black/50" />
          Search
        </button>
        <div className="flex items-center gap-1 px-1">
          <LanguageSwitcher variant="icon-only" />
          <CurrencySwitcher variant="icon-only" />
        </div>
      </div>

      {/* Bottom */}
      <div className="p-4 border-t border-gold/20 space-y-2">
        <a
          href="mailto:info@jbjglobal.com"
          className="flex items-center gap-2 text-sm font-bold text-gold hover:text-gold/80 transition-colors"
        >
          <Headphones className="w-4 h-4" />
          Contact Support
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-[200px] flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-gold/30 flex-col h-full">
        {renderNavContent()}
      </div>

      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[10050] w-10 h-10 rounded-lg bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border border-gold/40 flex items-center justify-center shadow-lg"
        aria-label="Open navigation"
      >
        <Menu className="w-5 h-5 text-gold" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[10100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center hover:bg-gold/20 transition-colors"
            >
              <X className="w-4 h-4 text-gold" />
            </button>
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Mega Menu Panels (desktop) */}
      {renderMegaMenu()}

      {/* Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />
    </>
  );
}
