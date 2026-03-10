import { Link, useLocation } from "react-router-dom";
import {
  Building2, BarChart3, BookOpen, Briefcase, Users, Home, Tag, Key, PlusCircle,
  Building, Layers, Cpu, Heart, GitCompare, Calculator, Headphones, MapPin,
  Lightbulb, ChevronRight, ChevronLeft, Search, User, Settings, Castle, FileText,
  DollarSign, TrendingUp, ClipboardCheck, Shield, Sparkles, Bot, Video, Image,
  Mic, Stamp, CreditCard, Palette, Pen, Award, Globe, Brain, MessageSquare,
  Phone, Languages, FileSearch, FilePlus, UserCheck, CalendarClock, Mail,
  Share2, PenTool, Megaphone, GraduationCap, Briefcase as BriefcaseIcon,
  LayoutDashboard, FolderOpen, ListChecks, Bell, Zap, Menu, X,
  Scale, Eye, Ticket, Compass, HandCoins, Handshake, Lock, Accessibility,
  ShieldCheck, Newspaper, BookMarked, Landmark, Camera,
} from "lucide-react";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";
import React, { useState, useCallback, useEffect } from "react";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";

/* ─── TYPES ─── */
type MegaMenuKey =
  | 'buy' | 'sell' | 'rent' | 'developers' | 'areas'
  | 'insights' | 'ai-tools' | 'creative' | 'shortcuts'
  | 'services' | 'company' | 'legal' | 'guides';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  highlight?: boolean;
  megaMenu?: MegaMenuKey;
  section?: string;
}

/* ─── NAV ITEMS ─── */
const NAV_ITEMS: NavItem[] = [
  // ── Highlighted Hubs ──
  { label: "Buy Properties", href: "/properties", icon: Building2, highlight: true, megaMenu: 'buy' },
  { label: "AI Tools Hub", href: "/ai-hub", icon: Cpu, highlight: true, megaMenu: 'ai-tools' },
  { label: "Listing Portal", href: "/listing-portal", icon: ClipboardCheck, highlight: true },
  { label: "Careers & Join", href: "/join", icon: GraduationCap, highlight: true },
  { label: "Resale Properties", href: "/resale-properties", icon: DollarSign, highlight: true },

  // ── Properties ──
  { label: "Off-plan", href: "/properties", icon: Building2, section: "PROPERTIES" },
  { label: "Sell", href: "/sell", icon: Tag, megaMenu: 'sell' },
  { label: "Rent", href: "/rent", icon: Key, megaMenu: 'rent' },
  { label: "List Property", href: "/listing-portal", icon: PlusCircle },
  { label: "Developers", href: "/developers", icon: Building, megaMenu: 'developers' },
  { label: "Areas", href: "/areas", icon: MapPin, megaMenu: 'areas' },
  { label: "Map", href: "/map", icon: MapPin },

  // ── Creative & Tools ──
  { label: "Royal Tools Hub", href: "/toolkit", icon: Sparkles, megaMenu: 'creative', section: "TOOLS" },

  // ── Insights & Guides ──
  { label: "Market Intelligence", href: "/market-intelligence", icon: BarChart3, section: "INSIGHTS" },
  { label: "Insights", href: "/insights", icon: Lightbulb, megaMenu: 'insights' },
  { label: "Guides", href: "/guides", icon: BookOpen, megaMenu: 'guides' },
  { label: "News", href: "/news", icon: Megaphone },

  // ── Services ──
  { label: "Services", href: "/services", icon: Briefcase, megaMenu: 'services', section: "SERVICES" },

  // ── Company ──
  { label: "About", href: "/about", icon: Users, megaMenu: 'company', section: "COMPANY" },
  { label: "Team", href: "/team", icon: Users },
  { label: "Contact", href: "/contact", icon: Phone },
  { label: "Legal", href: "/terms", icon: Scale, megaMenu: 'legal' },

  // ── Account ──
  { label: "Favorites", href: "/favorites", icon: Heart, section: "MY ACCOUNT" },
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
    { label: 'Apartments for Rent', icon: Building2, href: '/properties?type=apartment&transaction=rent' },
    { label: 'Villas for Rent', icon: Home, href: '/properties?type=villa&transaction=rent' },
    { label: "Tenant's Guide", icon: FileText, href: '/tenant-guide' },
    { label: "Landlord Guide", icon: FileText, href: '/landlord-guide' },
    { label: 'Property Management', icon: Shield, href: '/services/property-management' },
    { label: 'Rental Index', icon: TrendingUp, href: '/rental-index' },
  ],
  developers: [
    { label: 'All Developers', icon: Building, href: '/developers' },
  ],
  areas: [
    { label: 'All Areas', icon: MapPin, href: '/areas' },
    { label: 'Area Guides', icon: BookOpen, href: '/areas' },
  ],
  insights: [
    { label: 'Market Intelligence', icon: BarChart3, href: '/market-intelligence' },
    { label: 'Market Report', icon: FileText, href: '/market-report' },
    { label: 'Rental Index', icon: TrendingUp, href: '/rental-index' },
    { label: 'Investor Education', icon: BookOpen, href: '/investor-education' },
    { label: 'Broker Education', icon: BookOpen, href: '/broker-education' },
  ],
  guides: [
    { label: 'Buyer Guide', icon: FileText, href: '/buyer-guide' },
    { label: 'Seller Guide', icon: FileText, href: '/seller-guide' },
    { label: 'Rent Guide', icon: FileText, href: '/rent-guide' },
    { label: "Tenant Guide", icon: FileText, href: '/tenant-guide' },
    { label: "Landlord Guide", icon: FileText, href: '/landlord-guide' },
    { label: 'Investor Education', icon: BookOpen, href: '/investor-education' },
    { label: 'Broker Education', icon: BookOpen, href: '/broker-education' },
    { label: 'Golden Visa Guide', icon: Award, href: '/guides/golden-visa-uae' },
    { label: 'Books Library', icon: BookMarked, href: '/education-hub' },
  ],
  services: [
    { label: 'All Services', icon: Briefcase, href: '/services' },
    { label: 'Property Management', icon: Key, href: '/services/property-management' },
    { label: 'Golden Visa', icon: Award, href: '/guides/golden-visa-uae' },
    { label: 'Mortgage Advisory', icon: Landmark, href: '/partners/mortgage' },
    { label: 'Property Valuation', icon: DollarSign, href: '/sell/valuation' },
    { label: 'Selling Advisory', icon: TrendingUp, href: '/services/selling-advisory' },
    { label: 'Short-term Rentals', icon: CalendarClock, href: '/services/short-term-rentals' },
    { label: 'Currency Exchange', icon: HandCoins, href: '/services/currency-exchange' },
    { label: 'Concierge Services', icon: Handshake, href: '/services/concierge' },
    { label: 'Company Setup', icon: Building, href: '/services/company-setup' },
    { label: 'Snagging & Inspection', icon: ClipboardCheck, href: '/services/snagging' },
    { label: 'Signature Collection', icon: FileText, href: '/services/signature-collection' },
  ],
  company: [
    { label: 'About JBJ', icon: Users, href: '/about' },
    { label: 'Our Team', icon: Users, href: '/team' },
    { label: 'The Founder', icon: User, href: '/founder' },
    { label: 'Contact Us', icon: Phone, href: '/contact' },
    { label: 'Careers & Join', icon: GraduationCap, href: '/join' },
    { label: 'Career Portal', icon: Briefcase, href: '/career-portal' },
    { label: 'JBJ Email', icon: Mail, href: '/crm/employees' },
    { label: 'Press Kit', icon: Newspaper, href: '/press-kit' },
    { label: 'Testimonials', icon: Heart, href: '/services/testimonials' },
  ],
  legal: [
    { label: 'Terms of Service', icon: Scale, href: '/terms' },
    { label: 'Privacy Policy', icon: Lock, href: '/privacy' },
    { label: 'Cookie Policy', icon: Shield, href: '/cookies' },
    { label: 'Disclaimers', icon: FileText, href: '/disclaimers' },
    { label: 'Intellectual Property', icon: ShieldCheck, href: '/intellectual-property' },
    { label: 'AML / KYC', icon: Shield, href: '/aml-kyc' },
    { label: 'Accessibility', icon: Accessibility, href: '/accessibility' },
    { label: 'Trust Center', icon: ShieldCheck, href: '/trust-and-audit-center' },
  ],
  'ai-tools': [
    { label: 'Property Analyzer', icon: Building, href: '/ai-property-analyzer' },
    { label: 'Price Predictor', icon: TrendingUp, href: '/ai-price-predictor' },
    { label: 'Neighborhood Insights', icon: MapPin, href: '/ai-neighborhood-insights' },
    { label: 'Interior Design AI', icon: Palette, href: '/interior-design-ai' },
    { label: 'Virtual Staging', icon: Camera, href: '/interior-design-ai' },
    { label: 'Lead Qualification', icon: UserCheck, href: '/ai-lead-qualification' },
    { label: 'Follow-up Scheduler', icon: CalendarClock, href: '/ai-followup-scheduler' },
    { label: 'Objection Handler', icon: MessageSquare, href: '/ai-objection-handler' },
    { label: 'Client Matcher', icon: Users, href: '/ai-client-matcher' },
    { label: 'Competitor Analysis', icon: Eye, href: '/ai-competitor-analysis' },
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
    { label: 'Real Estate Suite', icon: Home, href: '/toolkit/property-suite' },
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
    { label: 'Scan & Sign', icon: FileSearch, href: '/toolkit/scan-sign' },
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
    { label: 'Support Tickets', icon: Headphones, href: '/my-tickets' },
    { label: 'My Profile', icon: User, href: '/profile' },
    { label: 'Settings', icon: Settings, href: '/profile' },
    { label: 'Favorites', icon: Heart, href: '/favorites' },
    { label: 'AI History', icon: Bot, href: '/my-ai-history' },
  ],
};

const MEGA_MENU_TITLES: Record<MegaMenuKey, string> = {
  buy: 'Buy Properties',
  sell: 'Sell Your Property',
  rent: 'Rent',
  developers: 'Developers',
  areas: 'Areas & Locations',
  insights: 'Market Insights',
  'ai-tools': 'AI Tools',
  creative: 'Creative Suites',
  shortcuts: 'My Shortcuts',
  services: 'Services',
  company: 'Company',
  legal: 'Legal & Compliance',
  guides: 'Guides & Education',
};

/* ─── COMPONENT ─── */
export default function GlobalVerticalNav() {
  const location = useLocation();
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('jj_nav_collapsed') === '1'; } catch { return false; }
  });

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('jj_nav_collapsed', next ? '1' : '0'); } catch {}
      return next;
    });
    setActiveMegaMenu(null);
  }, []);

  useEffect(() => {
    if (collapsed) {
      document.body.classList.remove("jj-vertical-nav-active");
      document.body.classList.add("jj-vertical-nav-collapsed");
    } else {
      document.body.classList.add("jj-vertical-nav-active");
      document.body.classList.remove("jj-vertical-nav-collapsed");
    }
    return () => {
      document.body.classList.remove("jj-vertical-nav-active");
      document.body.classList.remove("jj-vertical-nav-collapsed");
    };
  }, [collapsed]);

  const handleNavClick = useCallback((megaMenu?: MegaMenuKey, e?: React.MouseEvent) => {
    if (megaMenu) {
      e?.preventDefault();
      setActiveMegaMenu(prev => prev === megaMenu ? null : megaMenu);
    } else {
      setActiveMegaMenu(null);
    }
  }, []);

  const closeMegaMenu = useCallback(() => setActiveMegaMenu(null), []);

  // Close on route change
  useEffect(() => { closeMegaMenu(); setMobileOpen(false); }, [location.pathname, closeMegaMenu]);

  const isRouteActive = (href: string) => {
    if (href === "#") return false;
    if (href === "/properties") return location.pathname === "/properties" || location.pathname.startsWith("/properties/");
    return location.pathname === href;
  };

  const getItemStyle = (item: NavItem) => {
    const isThisMenuOpen = activeMegaMenu === item.megaMenu;
    const routeActive = isRouteActive(item.href);
    const shouldHighlight = activeMegaMenu ? isThisMenuOpen : routeActive;

    if (item.highlight) {
      return shouldHighlight
        ? "bg-gradient-to-r from-gold/25 to-gold/15 text-black border border-gold/50 font-bold"
        : "text-gold font-semibold hover:bg-gold/10";
    }
    return shouldHighlight
      ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black border border-gold/40 font-bold"
      : "text-black/70 hover:bg-white/60 hover:text-black";
  };

  const getIconStyle = (item: NavItem) => {
    const isThisMenuOpen = activeMegaMenu === item.megaMenu;
    const routeActive = isRouteActive(item.href);
    const shouldHighlight = activeMegaMenu ? isThisMenuOpen : routeActive;
    return shouldHighlight || item.highlight ? "text-gold" : "text-black/50";
  };

  /* ─── COMPACT FLOATING FLYOUT PANEL (PropertiesVerticalNav pattern) ─── */
  const renderMegaMenu = () => {
    if (!activeMegaMenu || collapsed) return null;
    const sidebarWidth = '200px';
    const links = MEGA_MENU_LINKS[activeMegaMenu] || [];
    const title = MEGA_MENU_TITLES[activeMegaMenu] || activeMegaMenu;
    const isLargeMenu = links.length > 12;

    return (
      <>
        {/* Backdrop — only covers area right of sidebar */}
        <div
          className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm"
          style={{ left: sidebarWidth }}
          onClick={closeMegaMenu}
        />
        {/* Floating compact panel */}
        <div
          className="fixed z-[10000] flex items-start justify-start pointer-events-none"
          style={{ left: sidebarWidth, top: 0, bottom: 0, right: 0 }}
        >
          <div
            className={`pointer-events-auto w-[360px] overflow-hidden mt-4 ml-3 rounded-2xl shadow-2xl border-2 border-gold/40 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6] animate-in slide-in-from-left-2 fade-in duration-200 ${isLargeMenu ? 'max-h-[80vh]' : 'max-h-[60vh]'}`}
            onClick={(e) => e.stopPropagation()}
            onMouseLeave={closeMegaMenu}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gold/20 bg-gradient-to-r from-[#E8DCC8]/50 to-transparent">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <h3 className="text-[13px] font-bold text-black tracking-tight">{title}</h3>
              </div>
              <button
                onClick={closeMegaMenu}
                className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center hover:bg-gold/20 transition-colors"
              >
                <X className="w-3 h-3 text-gold" />
              </button>
            </div>

            {/* Scrollable links */}
            <div className={`overflow-y-auto jj-scrollbar-gold p-3 ${isLargeMenu ? 'columns-2 gap-1' : 'space-y-0.5'}`}>
              {links.map((link) => {
                const Icon = link.icon;
                const linkActive = isRouteActive(link.href);
                return (
                  <Link
                    key={link.href + link.label}
                    to={link.href}
                    onClick={closeMegaMenu}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all break-inside-avoid ${
                      linkActive
                        ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black font-bold border border-gold/40"
                        : "text-black/80 hover:bg-gold/10 hover:text-black"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-gold flex-shrink-0" />
                    <span className="flex-1 truncate">{link.label}</span>
                    <ChevronRight className="w-3 h-3 text-black/20 flex-shrink-0" />
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
      <Link to="/" onClick={() => setActiveMegaMenu(null)} className="p-4 border-b border-gold/20 flex items-center gap-3 hover:opacity-80 transition-opacity">
        <img src={jbjMonogramLightBg} alt="JBJ" className="w-16 h-16 object-contain" />
        <div className="flex flex-col" style={{ fontFamily: "Poppins, sans-serif" }}>
          <span className="text-[11px] font-bold text-black tracking-wide leading-tight">JBJ GLOBAL</span>
          <span className="text-[11px] font-bold text-gold tracking-wide leading-tight">REAL ESTATE</span>
        </div>
      </Link>

      {/* My Shortcuts — premium flyout trigger */}
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
        className="flex-1 py-2 px-2 space-y-0.5 overflow-y-auto jj-scrollbar-gold"
        style={{ scrollbarGutter: "stable" }}
      >
        {NAV_ITEMS.map((item, i) => {
          const hasMega = !!item.megaMenu;
          const isMenuOpen = activeMegaMenu === item.megaMenu;
          const Icon = item.icon;
          return (
            <React.Fragment key={item.href + item.label + i}>
              {item.section && (
                <p className="text-[9px] uppercase tracking-[0.2em] text-gold/60 font-bold px-3 pt-3 pb-1">
                  {item.section}
                </p>
              )}
              <Link
                to={item.href}
                onClick={(e) => {
                  if (hasMega) {
                    handleNavClick(item.megaMenu, e);
                  } else {
                    handleNavClick(undefined);
                  }
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${getItemStyle(item)}`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${getIconStyle(item)}`} />
                <span className="flex-1">{item.label}</span>
                {hasMega && (
                  <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${isMenuOpen ? "rotate-90 text-gold" : "text-black/30"}`} />
                )}
                {item.highlight && !isMenuOpen && !activeMegaMenu && !isRouteActive(item.href) && (
                  <Sparkles className="w-3 h-3 text-gold/60" />
                )}
              </Link>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Utility Section */}
      <div className="px-3 py-2 border-t border-gold/20">
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold text-gold hover:bg-gold/10 transition-all w-full group"
        >
          <Search className="w-4 h-4 text-gold flex-shrink-0" />
          <span className="whitespace-nowrap">Quick Search</span>
          <span className="ml-auto text-[9px] bg-gold/15 text-gold border border-gold/30 rounded-full px-1.5 py-0.5 font-bold whitespace-nowrap">⌘K</span>
        </button>
        <div className="flex items-center gap-1 px-1 mt-1">
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
        <Link
          to="/my-tickets"
          className="flex items-center gap-2 text-sm font-bold text-gold hover:text-gold/80 transition-colors"
        >
          <Ticket className="w-4 h-4" />
          Create Ticket Support
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      {collapsed ? (
        /* Collapsed: thin strip with expand button */
        <div className="hidden lg:flex w-[48px] flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-gold/30 flex-col h-full items-center py-4">
          <Link to="/" className="mb-4">
            <img src={jbjMonogramLightBg} alt="JBJ" className="w-9 h-9 object-contain" />
          </Link>
          <button
            onClick={toggleCollapse}
            className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center hover:bg-gold/20 transition-colors"
            aria-label="Expand navigation"
            title="Expand navigation"
          >
            <ChevronRight className="w-4 h-4 text-gold" />
          </button>
        </div>
      ) : (
        /* Full sidebar */
        <div className="hidden lg:flex w-[200px] flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-gold/30 flex-col h-full relative">
          {renderNavContent()}
          {/* Collapse toggle */}
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border border-gold/40 flex items-center justify-center shadow-md hover:bg-gold/20 transition-colors z-[60]"
            aria-label="Minimize navigation"
            title="Minimize navigation"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-gold" />
          </button>
        </div>
      )}

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
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center hover:bg-gold/20 transition-colors z-10"
            >
              <X className="w-4 h-4 text-gold" />
            </button>
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Mega Menu Panels (desktop — compact floating) */}
      {renderMegaMenu()}

      {/* Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />
    </>
  );
}
