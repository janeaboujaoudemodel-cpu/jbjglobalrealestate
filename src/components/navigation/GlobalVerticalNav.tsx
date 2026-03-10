import { Link, useLocation } from "react-router-dom";
import {
  Building2, BarChart3, BookOpen, Briefcase, Users, Home, Tag, Key, PlusCircle,
  Building, Layers, Cpu, Heart, GitCompare, Calculator, Headphones, MapPin,
  Lightbulb, ChevronRight, ChevronLeft, ChevronDown, Search, User, Settings, Castle, FileText,
  DollarSign, TrendingUp, ClipboardCheck, Shield, Sparkles, Bot, Video, Image,
  Mic, Stamp, CreditCard, Palette, Pen, Award, Globe, Brain, MessageSquare,
  Phone, Languages, FileSearch, FilePlus, UserCheck, CalendarClock, Mail,
  Share2, PenTool, Megaphone, GraduationCap, Briefcase as BriefcaseIcon,
  LayoutDashboard, FolderOpen, ListChecks, Bell, Zap, Menu, X,
  Scale, Eye, Ticket, Compass, HandCoins, Handshake, Lock, Accessibility,
  ShieldCheck, Newspaper, BookMarked, Landmark, Camera, Ruler,
} from "lucide-react";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { useDevelopers } from "@/hooks/useProjects";
import { useAreas } from "@/hooks/useAreas";
import { useLanguage, getLanguageInfo } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

/* ─── CURATED TOP ENTRIES (matching horizontal mega menus) ─── */
const FEATURED_DEVELOPER_SLUGS = [
  'emaar', 'damac', 'nakheel', 'meraas', 'sobha', 'aldar',
  'omniyat', 'select-group', 'ellington', 'azizi-developments',
  'dubai-properties', 'danube-properties',
];

const FEATURED_AREA_SLUGS = [
  'downtown-dubai', 'palm-jumeirah', 'dubai-marina', 'dubai-hills',
  'business-bay', 'dubai-islands', 'jvc-jumeirah-village-circle',
  'dubai-creek-harbour', 'emaar-beachfront', 'al-marjan-island',
  'meydan-nad-al-sheba-1', 'jumeirah-beach-residence',
];

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
  { label: "AI Tools Hub", href: "/ai-hub", icon: Cpu, highlight: true, megaMenu: 'ai-tools' },
  { label: "AI Home Finder", href: "/quiz", icon: Home, highlight: true },
  { label: "Listing Portal", href: "/listing-portal", icon: ClipboardCheck, highlight: true },
  { label: "Careers & Join", href: "/join", icon: GraduationCap, highlight: true },
  { label: "Resale Properties", href: "/resale-properties", icon: DollarSign, highlight: true },

  // ── Properties ──
  { label: "Buy / Off-Plan", href: "/properties", icon: Building2, section: "PROPERTIES", megaMenu: 'buy' },
  { label: "Sell", href: "/sell", icon: Tag, megaMenu: 'sell' },
  { label: "Rent", href: "/rent", icon: Key, megaMenu: 'rent' },
  { label: "List Property", href: "/listing-portal", icon: PlusCircle },
  { label: "Developers", href: "/developers", icon: Building, megaMenu: 'developers' },
  { label: "Areas", href: "/areas", icon: MapPin, megaMenu: 'areas' },
  { label: "Map", href: "/map", icon: MapPin },

  // ── Creative & Tools ──
  { label: "Royal Tools Hub", href: "/toolkit", icon: Sparkles, megaMenu: 'creative', section: "TOOLS" },

  // ── Insights (no more Guides here) ──
  { label: "Market Intelligence", href: "/market-intelligence", icon: BarChart3, section: "INSIGHTS" },
  { label: "Insights", href: "/insights", icon: Lightbulb, megaMenu: 'insights' },
  { label: "News", href: "/news", icon: Megaphone },

  // ── Guides (standalone hub) ──
  { label: "Guides Library", href: "/guides", icon: BookOpen, megaMenu: 'guides', section: "GUIDES" },
  { label: "Buyer's Guide", href: "/buyer-guide", icon: FileText },
  { label: "Seller's Guide", href: "/seller-guide", icon: FileText },
  { label: "Rental Guide", href: "/rent-guide", icon: FileText },
  { label: "Tenant Guide", href: "/tenant-guide", icon: FileText },
  { label: "Landlord Guide", href: "/landlord-guide", icon: FileText },
  { label: "Investor Education", href: "/investor-education", icon: GraduationCap },
  { label: "Broker Education", href: "/broker-education", icon: GraduationCap },
  { label: "Golden Visa Guide", href: "/guides/golden-visa-uae", icon: Award },
  { label: "Books Library", href: "/education-hub", icon: BookMarked },
  { label: "FAQ Hub", href: "/faq", icon: Lightbulb },

  // ── Services ──
  { label: "All Services", href: "/services", icon: Briefcase, megaMenu: 'services', section: "SERVICES" },
  { label: "Property Management", href: "/services/property-management", icon: Key },
  { label: "Golden Visa", href: "/guides/golden-visa-uae", icon: Award },
  { label: "Mortgage Advisory", href: "/partners/mortgage", icon: Landmark },
  { label: "Valuation", href: "/sell/valuation", icon: DollarSign },
  { label: "Selling Advisory", href: "/services/selling-advisory", icon: TrendingUp },
  { label: "Short-term Rentals", href: "/services/short-term-rentals", icon: CalendarClock },
  { label: "Concierge", href: "/services/concierge", icon: Handshake },
  { label: "Company Setup", href: "/services/company-setup", icon: Building },

  // ── Company ──
  { label: "About", href: "/about", icon: Users, megaMenu: 'company', section: "COMPANY" },
  { label: "Team", href: "/team", icon: Users },
  { label: "Contact", href: "/contact", icon: Phone },

  // ── Legal ──
  { label: "Terms of Service", href: "/terms", icon: Scale, megaMenu: 'legal', section: "LEGAL" },
  { label: "Privacy Policy", href: "/privacy", icon: Lock },
  { label: "Cookie Policy", href: "/cookies", icon: Shield },
  { label: "Disclaimers", href: "/disclaimers", icon: FileText },
  { label: "Intellectual Property", href: "/intellectual-property", icon: ShieldCheck },
  { label: "AML / KYC", href: "/aml-kyc", icon: Shield },
  { label: "Accessibility", href: "/accessibility", icon: Accessibility },
  { label: "Trust Center", href: "/trust-and-audit-center", icon: ShieldCheck },

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
    { label: 'Brand Palette', icon: Palette, href: '/owner/brand-palette' },
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
    { label: 'CP Center', icon: Compass, href: '/owner' },
    { label: 'Inbox Inquiries', icon: Mail, href: '/owner/inbox' },
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
  developers: 'Top Developers',
  areas: 'Prime Locations',
  insights: 'Market Insights',
  'ai-tools': 'AI Tools',
  creative: 'Creative Suites',
  shortcuts: 'My Shortcuts',
  services: 'Services',
  company: 'Company',
  legal: 'Legal & Compliance',
  guides: 'Guides & Education',
};

/* ─── COLOR-CODED SHORTCUT GROUPS ─── */
interface ShortcutGroup {
  label: string;
  colorBorder: string;
  colorText: string;
  colorBg: string;
  items: Array<{ label: string; href: string; icon: any }>;
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: "My Tasks",
    colorBorder: "border-l-emerald-500",
    colorText: "text-emerald-700",
    colorBg: "bg-emerald-50",
    items: [
      { label: 'My Tasks', icon: ListChecks, href: '/my-dashboard#tasks' },
      { label: 'Notifications', icon: Bell, href: '/my-dashboard#notifications' },
      { label: 'Alerts', icon: Bell, href: '/my-dashboard#alerts' },
      { label: 'Books', icon: BookMarked, href: '/education-hub' },
      { label: 'Favorites', icon: Heart, href: '/favorites' },
      { label: 'Shortlisted', icon: ListChecks, href: '/favorites?tab=shortlist' },
    ],
  },
  {
    label: "CRM",
    colorBorder: "border-l-blue-500",
    colorText: "text-blue-700",
    colorBg: "bg-blue-50",
    items: [
      { label: 'CRM Dashboard', icon: Users, href: '/crm' },
      { label: 'Customer Happiness', icon: Headphones, href: '/admin?tab=customer-happiness' },
    ],
  },
  {
    label: "Owner Command Center",
    colorBorder: "border-l-[#C9A84C]",
    colorText: "text-[#C9A84C]",
    colorBg: "bg-gold/5",
    items: [
      { label: 'Owner Command Center', icon: Shield, href: '/owner' },
      { label: 'Admin Panel', icon: Shield, href: '/admin' },
      { label: 'CP Center', icon: Compass, href: '/owner' },
      { label: 'Inbox Inquiries', icon: Mail, href: '/owner/inbox' },
      { label: 'Listing Admin', icon: FolderOpen, href: '/listing-admin' },
    ],
  },
  {
    label: "AI & Tools",
    colorBorder: "border-l-purple-500",
    colorText: "text-purple-700",
    colorBg: "bg-purple-50",
    items: [
      { label: 'AI Tools', icon: Sparkles, href: '/ai-hub' },
      { label: 'AI Calendar & Notes', icon: CalendarClock, href: '/ai-calendar' },
      { label: 'My Assistant', icon: Bot, href: '/founder-assistant' },
      { label: 'AI History', icon: Bot, href: '/my-ai-history' },
    ],
  },
  {
    label: "Dashboards",
    colorBorder: "border-l-rose-500",
    colorText: "text-rose-700",
    colorBg: "bg-rose-50",
    items: [
      { label: 'My Dashboard', icon: LayoutDashboard, href: '/my-dashboard' },
      { label: 'Broker Dashboard', icon: BriefcaseIcon, href: '/broker-dashboard' },
    ],
  },
  {
    label: "Account",
    colorBorder: "border-l-zinc-400",
    colorText: "text-zinc-600",
    colorBg: "bg-zinc-50",
    items: [
      { label: 'My Profile', icon: User, href: '/profile' },
      { label: 'Settings', icon: Settings, href: '/profile' },
      { label: 'Favorites', icon: Heart, href: '/favorites' },
      { label: 'Support Tickets', icon: Headphones, href: '/my-tickets' },
    ],
  },
];

/* ─── SECTION KEYS ─── */
const SECTION_KEYS = ["PROPERTIES", "TOOLS", "INSIGHTS", "GUIDES", "SERVICES", "COMPANY", "LEGAL", "MY ACCOUNT"] as const;
type SectionKey = typeof SECTION_KEYS[number];

/* ─── SECTION ICONS ─── */
const SECTION_ICONS: Record<SectionKey, any> = {
  "PROPERTIES": Building2,
  "TOOLS": Sparkles,
  "INSIGHTS": Lightbulb,
  "GUIDES": BookOpen,
  "SERVICES": Briefcase,
  "COMPANY": Users,
  "LEGAL": Scale,
  "MY ACCOUNT": User,
};

/* ─── UTILITY BAR SUB-COMPONENT ─── */
function VerticalNavUtilityBar({ onSearchOpen }: { onSearchOpen: () => void }) {
  const { language } = useLanguage();
  const currentLang = getLanguageInfo(language);
  
  const [areaUnit, setAreaUnit] = useState<'sqft' | 'sqm'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('jj_area_unit') as 'sqft' | 'sqm') || 'sqft';
    }
    return 'sqft';
  });

  // Listen for area unit changes from other components
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail === 'sqft' || detail === 'sqm') setAreaUnit(detail);
    };
    window.addEventListener('areaUnitChange', handler);
    return () => window.removeEventListener('areaUnitChange', handler);
  }, []);

  const toggleAreaUnit = () => {
    const next = areaUnit === 'sqft' ? 'sqm' : 'sqft';
    setAreaUnit(next);
    localStorage.setItem('jj_area_unit', next);
    window.dispatchEvent(new CustomEvent('areaUnitChange', { detail: next }));
  };

  const divider = <div className="w-px h-5 bg-gold/25 flex-shrink-0" />;

  return (
    <div className="px-2 py-2 border-b border-gold/20 bg-gradient-to-b from-transparent to-[#EDE4D3]/30">
      <div className="flex items-center justify-between gap-0.5">
        {/* Search */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSearchOpen}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gold/15 transition-all group"
              aria-label="Search ⌘K"
            >
              <Search className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Search ⌘K</TooltipContent>
        </Tooltip>

        {divider}

        {/* Favorites */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              to="/favorites"
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gold/15 transition-all group"
              aria-label="Favorites"
            >
              <Heart className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Favorites</TooltipContent>
        </Tooltip>

        {divider}

        {/* Area Unit Toggle — sqft / sqm */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleAreaUnit}
              className="h-7 flex items-center rounded-lg hover:bg-gold/15 transition-all px-1 gap-0.5"
              aria-label="Toggle area unit"
            >
              <span className={`text-[9px] font-bold px-1 py-0.5 rounded transition-all ${areaUnit === 'sqft' ? 'bg-gold/20 text-gold' : 'text-black/40'}`}>
                ft²
              </span>
              <span className={`text-[9px] font-bold px-1 py-0.5 rounded transition-all ${areaUnit === 'sqm' ? 'bg-gold/20 text-gold' : 'text-black/40'}`}>
                m²
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            {areaUnit === 'sqft' ? 'Square Feet (active)' : 'Square Meters (active)'}
          </TooltipContent>
        </Tooltip>

        {divider}

        {/* Language — show active flag */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <LanguageSwitcher variant="icon-only" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Language: {currentLang.flag} {currentLang.nativeName}
          </TooltipContent>
        </Tooltip>

        {divider}

        {/* Currency */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <CurrencySwitcher variant="icon-only" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">Currency</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}


export default function GlobalVerticalNav() {
  const location = useLocation();
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('jj_nav_collapsed') === '1'; } catch { return false; }
  });

  // Collapsible sections state — accordion: only one open at a time
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  // Data hooks for rich flyouts
  const { data: developers } = useDevelopers(false);
  const { data: areas } = useAreas();

  // Curated developers for flyout
  const curatedDevelopers = useMemo(() => {
    if (!developers || developers.length === 0) return [];
    const slugMap = new Map(developers.map(d => [d.slug, d]));
    const ordered: { name: string; slug: string }[] = [];
    for (const slug of FEATURED_DEVELOPER_SLUGS) {
      const d = slugMap.get(slug);
      if (d) ordered.push({ name: d.name, slug: d.slug });
    }
    return ordered.slice(0, 12);
  }, [developers]);

  // Curated areas for flyout
  const curatedAreas = useMemo(() => {
    if (!areas || areas.length === 0) return [];
    const slugMap = new Map(areas.map(a => [a.slug, a]));
    const ordered: { name: string; slug: string }[] = [];
    for (const slug of FEATURED_AREA_SLUGS) {
      const a = slugMap.get(slug);
      if (a) ordered.push({ name: a.name, slug: a.slug });
    }
    return ordered.slice(0, 12);
  }, [areas]);

  // ── Auto-reveal on homepage: hidden initially, show after 3s or scroll ──
  const isHomepage = location.pathname === "/" || location.pathname === "";
  const [navRevealed, setNavRevealed] = useState(() => {
    try { return sessionStorage.getItem('jj_nav_revealed') === '1'; } catch { return false; }
  });

  useEffect(() => {
    if (!isHomepage) {
      if (!navRevealed) {
        setNavRevealed(true);
        try { sessionStorage.setItem('jj_nav_revealed', '1'); } catch {}
      }
      return;
    }
    if (navRevealed) return;
    const timer = setTimeout(() => {
      setNavRevealed(true);
      try { sessionStorage.setItem('jj_nav_revealed', '1'); } catch {}
    }, 3000);
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setNavRevealed(true);
        try { sessionStorage.setItem('jj_nav_revealed', '1'); } catch {}
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isHomepage, navRevealed]);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('jj_nav_collapsed', next ? '1' : '0'); } catch {}
      return next;
    });
    setActiveMegaMenu(null);
  }, []);

  useEffect(() => {
    if (!navRevealed) {
      document.body.classList.remove("jj-vertical-nav-active");
      document.body.classList.remove("jj-vertical-nav-collapsed");
      return;
    }
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
  }, [collapsed, navRevealed]);

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

  // Group nav items by section
  const { highlightItems, sectionGroups } = useMemo(() => {
    const highlights: NavItem[] = [];
    const sections: Record<string, NavItem[]> = {};
    let currentSection: string | null = null;

    for (const item of NAV_ITEMS) {
      if (item.highlight) {
        highlights.push(item);
        continue;
      }
      if (item.section) {
        currentSection = item.section;
        if (!sections[currentSection]) sections[currentSection] = [];
      }
      if (currentSection) {
        sections[currentSection].push(item);
      }
    }
    return { highlightItems: highlights, sectionGroups: sections };
  }, []);

  // Auto-open section containing active route on mount
  useEffect(() => {
    for (const [section, items] of Object.entries(sectionGroups)) {
      if (items.some(item => isRouteActive(item.href))) {
        setOpenSection(section as SectionKey);
        break;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Accordion toggle — only one section open at a time
  const toggleSection = (section: SectionKey) => {
    const opening = openSection !== section;
    setOpenSection(prev => prev === section ? null : section);
    // Dual-action: also open the first mega menu flyout in this section
    if (opening) {
      const items = sectionGroups[section];
      const firstMega = items?.find(item => item.megaMenu);
      if (firstMega?.megaMenu) {
        setActiveMegaMenu(firstMega.megaMenu);
      }
    }
  };

  // Check if a section contains the active mega menu
  const sectionHasActiveMega = (sectionKey: string) => {
    const items = sectionGroups[sectionKey];
    if (!items || !activeMegaMenu) return false;
    return items.some(item => item.megaMenu === activeMegaMenu);
  };

  /* FIX: When a mega menu is open, ONLY highlight the item whose megaMenu matches.
     Items without a megaMenu should NOT highlight based on route when a mega menu is open. */
  const getItemStyle = (item: NavItem, sectionKey?: string) => {
    const isThisMenuOpen = item.megaMenu ? activeMegaMenu === item.megaMenu : false;
    const routeActive = isRouteActive(item.href);
    // When a mega menu is open, only the item that owns it should highlight
    const shouldHighlight = activeMegaMenu
      ? isThisMenuOpen
      : routeActive;

    if (item.href === '/join') {
      return shouldHighlight
        ? "bg-emerald-500 text-white border border-emerald-400 font-bold"
        : "bg-emerald-400/10 text-emerald-600 font-semibold hover:bg-emerald-400/20 border border-emerald-400/20";
    }
    if (item.href === '/quiz') {
      return shouldHighlight
        ? "bg-purple-600 text-white border border-purple-500 font-bold"
        : "bg-purple-500/15 text-purple-700 font-semibold hover:bg-purple-500/25 border border-purple-500/30";
    }
    if (sectionKey === 'MY ACCOUNT') {
      return shouldHighlight
        ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black border border-gold/40 font-bold"
        : "text-black/80 font-semibold hover:bg-gold/10 border border-gold/20";
    }
    if (item.highlight) {
      return shouldHighlight
        ? "bg-gradient-to-r from-gold/25 to-gold/15 text-black border border-gold/50 font-bold"
        : "text-black font-semibold hover:bg-gold/10";
    }
    return shouldHighlight
      ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black border border-gold/40 font-bold"
      : "text-black/90 hover:bg-white/60 hover:text-black";
  };

  const getIconStyle = (item: NavItem, sectionKey?: string) => {
    const isThisMenuOpen = item.megaMenu ? activeMegaMenu === item.megaMenu : false;
    const routeActive = isRouteActive(item.href);
    const shouldHighlight = activeMegaMenu ? isThisMenuOpen : routeActive;
    if (item.href === '/join') return shouldHighlight ? 'text-white' : 'text-emerald-500';
    if (item.href === '/quiz') return shouldHighlight ? 'text-white' : 'text-purple-600';
    // Sidebar items: icons are black/60 (inactive) or gold (active)
    if (sectionKey === 'MY ACCOUNT') return shouldHighlight ? 'text-gold' : 'text-black/60';
    return shouldHighlight ? "text-gold" : "text-black/60";
  };

  /* ─── RENDER MEGA MENU ─── */
  const renderMegaMenu = () => {
    if (!activeMegaMenu || collapsed) return null;
    const sidebarWidth = '200px';
    const title = MEGA_MENU_TITLES[activeMegaMenu] || activeMegaMenu;

    // Color-coded shortcuts view
    if (activeMegaMenu === 'shortcuts') {
      return (
        <>
          <div
            className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm"
            style={{ left: sidebarWidth }}
            onClick={closeMegaMenu}
          />
          <div
            className="fixed z-[10000] flex items-start justify-start pointer-events-none"
            style={{ left: sidebarWidth, top: 0, bottom: 0, right: 0 }}
          >
            <div
              className="pointer-events-auto w-[min(440px,calc(100vw-240px))] overflow-hidden mt-4 ml-3 rounded-2xl shadow-2xl border-2 border-gold/40 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6] animate-in slide-in-from-left-2 fade-in duration-200 max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gold/20 bg-gradient-to-r from-[#E8DCC8]/50 to-transparent">
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-gold" />
                  <h3 className="text-sm font-bold text-black tracking-tight">{title}</h3>
                </div>
                <button
                  onClick={closeMegaMenu}
                  className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center hover:bg-gold/20 transition-colors"
                >
                  <X className="w-3 h-3 text-gold" />
                </button>
              </div>
              <div className="overflow-y-auto jj-scrollbar-gold p-3 pb-6 space-y-3">
                {SHORTCUT_GROUPS.map((group) => (
                  <div key={group.label} className={`border-l-4 ${group.colorBorder} rounded-lg ${group.colorBg} p-2`}>
                    <p className={`text-[10px] uppercase tracking-wider font-bold ${group.colorText} px-2 pb-1.5`}>
                      {group.label}
                    </p>
                    <div className="space-y-0.5">
                      {group.items.map((link) => {
                        const Icon = link.icon;
                        const linkActive = isRouteActive(link.href);
                        return (
                          <Link
                            key={link.href + link.label}
                            to={link.href}
                            onClick={closeMegaMenu}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              linkActive
                                ? "bg-white/80 text-black font-bold border border-gold/40 shadow-sm"
                                : "text-black/80 hover:bg-white/60 hover:text-black"
                            }`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${linkActive ? 'text-gold' : group.colorText}`} />
                            <span className="flex-1">{link.label}</span>
                            <ChevronRight className="w-3 h-3 text-black/20 flex-shrink-0" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      );
    }

    // Rich flyouts for developers and areas
    if (activeMegaMenu === 'developers' || activeMegaMenu === 'areas') {
      const isDev = activeMegaMenu === 'developers';
      const curatedItems = isDev ? curatedDevelopers : curatedAreas;
      const viewAllHref = isDev ? '/developers' : '/areas';
      const viewAllLabel = isDev ? 'View All Developers' : 'View All Areas';
      const ItemIcon = isDev ? Building : MapPin;

      return (
        <>
          <div
            className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm"
            style={{ left: sidebarWidth }}
            onClick={closeMegaMenu}
          />
          <div
            className="fixed z-[10000] flex items-start justify-start pointer-events-none"
            style={{ left: sidebarWidth, top: 0, bottom: 0, right: 0 }}
          >
            <div
              className="pointer-events-auto w-[min(440px,calc(100vw-240px))] overflow-hidden mt-4 ml-3 rounded-2xl shadow-2xl border-2 border-gold/40 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6] animate-in slide-in-from-left-2 fade-in duration-200 max-h-[80vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-gold/20 bg-gradient-to-r from-[#E8DCC8]/50 to-transparent">
                <div className="flex items-center gap-2.5">
                  <ItemIcon className="w-4 h-4 text-gold" />
                  <h3 className="text-sm font-bold text-black tracking-tight">{title}</h3>
                  <span className="text-[10px] text-black/40 font-medium">({curatedItems.length})</span>
                </div>
                <button
                  onClick={closeMegaMenu}
                  className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center hover:bg-gold/20 transition-colors"
                >
                  <X className="w-3 h-3 text-gold" />
                </button>
              </div>

              {/* Curated list */}
              <div className="overflow-y-auto jj-scrollbar-gold p-3 space-y-0.5">
                {curatedItems.map((entry) => {
                  const entryHref = isDev ? `/developer/${entry.slug}` : `/area/${entry.slug}`;
                  const linkActive = isRouteActive(entryHref);
                  return (
                    <Link
                      key={entry.slug}
                      to={entryHref}
                      onClick={closeMegaMenu}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        linkActive
                          ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black font-bold border border-gold/40"
                          : "text-black/80 hover:bg-gold/10 hover:text-black"
                      }`}
                    >
                      <ItemIcon className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="flex-1">{entry.name}</span>
                      <ChevronRight className="w-3 h-3 text-black/20 flex-shrink-0" />
                    </Link>
                  );
                })}

                {/* Divider + View All CTA */}
                <hr className="border-gold/20 my-2" />
                <Link
                  to={viewAllHref}
                  onClick={closeMegaMenu}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-bold text-gold hover:bg-gold/10 transition-all border border-gold/30"
                >
                  <Eye className="w-4 h-4 text-gold flex-shrink-0" />
                  <span className="flex-1">{viewAllLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-gold" />
                </Link>
                {!isDev && (
                  <Link
                    to="/guides"
                    onClick={closeMegaMenu}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-black/70 hover:bg-gold/10 transition-all"
                  >
                    <BookOpen className="w-4 h-4 text-gold/70 flex-shrink-0" />
                    <span className="flex-1">Read Area Guides</span>
                    <ChevronRight className="w-3 h-3 text-black/20 flex-shrink-0" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      );
    }

    // Default mega menu
    const links = MEGA_MENU_LINKS[activeMegaMenu] || [];
    const isLargeMenu = links.length > 12;

    return (
      <>
        <div
          className="fixed inset-0 z-[9999] bg-black/30 backdrop-blur-sm"
          style={{ left: sidebarWidth }}
          onClick={closeMegaMenu}
        />
        <div
          className="fixed z-[10000] flex items-start justify-start pointer-events-none"
          style={{ left: sidebarWidth, top: 0, bottom: 0, right: 0 }}
        >
          <div
            className={`pointer-events-auto w-[min(440px,calc(100vw-240px))] overflow-hidden mt-4 ml-3 rounded-2xl shadow-2xl border-2 border-gold/40 bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6] animate-in slide-in-from-left-2 fade-in duration-200 ${isLargeMenu ? 'max-h-[80vh]' : 'max-h-[60vh]'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gold/20 bg-gradient-to-r from-[#E8DCC8]/50 to-transparent">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-gold" />
                <h3 className="text-sm font-bold text-black tracking-tight">{title}</h3>
              </div>
              <button
                onClick={closeMegaMenu}
                className="w-6 h-6 rounded-full bg-gold/10 flex items-center justify-center hover:bg-gold/20 transition-colors"
              >
                <X className="w-3 h-3 text-gold" />
              </button>
            </div>
            <div className={`overflow-y-auto jj-scrollbar-gold p-3 ${isLargeMenu ? 'columns-2 gap-1' : 'space-y-0.5'}`}>
              {links.map((link) => {
                const Icon = link.icon;
                const linkActive = isRouteActive(link.href);
                return (
                  <Link
                    key={link.href + link.label}
                    to={link.href}
                    onClick={closeMegaMenu}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all break-inside-avoid ${
                      linkActive
                        ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black font-bold border border-gold/40"
                        : "text-black/80 hover:bg-gold/10 hover:text-black"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-gold flex-shrink-0" />
                    <span className="flex-1">{link.label}</span>
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
    <div className="flex flex-col h-full">
      {/* Logo — larger since minimizer moved to horizontal bar */}
      <div className="p-4 border-b border-gold/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Link to="/" onClick={() => setActiveMegaMenu(null)} className="flex-shrink-0">
            <img src={jbjMonogramLightBg} alt="JBJ" className="w-11 h-11 object-contain" />
          </Link>
          <Link to="/" onClick={() => setActiveMegaMenu(null)} className="flex flex-col flex-1 min-w-0 hover:opacity-80 transition-opacity" style={{ fontFamily: "Poppins, sans-serif" }}>
            <span className="text-[12px] font-bold text-black tracking-wide leading-tight">JBJ GLOBAL</span>
            <span className="text-[11px] font-bold text-gold tracking-wide leading-tight">REAL ESTATE</span>
          </Link>
        </div>
      </div>

      {/* Utility Bar — moved under monogram */}
      <VerticalNavUtilityBar onSearchOpen={() => setSearchOpen(true)} />

      {/* Scrollable area: shortcuts + hubs + sections */}
      <nav
        className="flex-1 overflow-y-auto jj-scrollbar-gold jj-scrollbar-always-visible overscroll-contain min-h-0"
        style={{ scrollbarGutter: "stable" }}
      >
        {/* My Shortcuts — premium flyout trigger */}
        <div className="px-2 pt-3 pb-1">
          <button
            onClick={(e) => handleNavClick('shortcuts', e as any)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-bold w-full transition-all ${
              activeMegaMenu === 'shortcuts'
                ? "bg-gradient-to-r from-gold/30 to-gold/20 text-black border-2 border-gold/60 shadow-md shadow-gold/15"
                : "text-gold hover:bg-gold/15 border-2 border-gold/50 bg-gold/10"
            }`}
          >
            <Zap className="w-4 h-4 text-gold flex-shrink-0" />
            <span className="flex-1 text-left">My Shortcuts</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeMegaMenu === 'shortcuts' ? "rotate-90 text-gold" : "text-gold/50"}`} />
          </button>
        </div>

        {/* Highlighted Hubs */}
        <div className="px-2 py-1 space-y-0.5">
          {highlightItems.map((item, i) => {
            const hasMega = !!item.megaMenu;
            const isMenuOpen = activeMegaMenu === item.megaMenu;
            const Icon = item.icon;
            return (
              <Link
                key={item.href + item.label + i}
                to={item.href}
                onClick={(e) => {
                  if (hasMega) handleNavClick(item.megaMenu, e);
                  else handleNavClick(undefined);
                }}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${getItemStyle(item)}`}
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
            );
          })}
        </div>

        {/* Collapsible Section Nav */}
        <div className="py-2 px-2 space-y-0.5">
          {SECTION_KEYS.map((sectionKey, sectionIdx) => {
            const items = sectionGroups[sectionKey];
            if (!items || items.length === 0) return null;
            const isOpen = openSection === sectionKey;
            const hasActiveChild = items.some(item => isRouteActive(item.href));
            const hasMegaActive = sectionHasActiveMega(sectionKey);
            const sectionHighlighted = isOpen || hasActiveChild || hasMegaActive;
            const SectionIcon = SECTION_ICONS[sectionKey];

            return (
              <React.Fragment key={sectionKey}>
                {sectionIdx > 0 && <hr className="border-gold/15 mx-1 my-1" />}

                <div>
                  <button
                    onClick={() => toggleSection(sectionKey)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] uppercase tracking-[0.15em] font-bold transition-all border ${
                      sectionHighlighted
                        ? "text-gold bg-gold/15 border-gold/40"
                        : "text-gold/80 hover:text-gold hover:bg-gold/5 border-transparent hover:border-gold/20"
                    }`}
                  >
                    <SectionIcon className={`w-3.5 h-3.5 flex-shrink-0 ${sectionHighlighted ? 'text-black' : 'text-gold'}`} />
                    <span className="flex-1 text-left">{sectionKey}</span>
                    <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'} ${sectionHighlighted ? 'text-gold' : 'text-black/40'}`} />
                    {!isOpen && hasActiveChild && (
                      <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                    )}
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="ml-3 pl-3 border-l-2 border-gold/20 space-y-0.5 pt-0.5 pb-1">
                      {items.map((item, i) => {
                        const hasMega = !!item.megaMenu;
                        const isMenuOpen = activeMegaMenu === item.megaMenu;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href + item.label + i}
                            to={item.href}
                            onClick={(e) => {
                              if (hasMega) handleNavClick(item.megaMenu, e);
                              else handleNavClick(undefined);
                            }}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${getItemStyle(item, sectionKey)}`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${getIconStyle(item, sectionKey)}`} />
                            <span className="flex-1">{item.label}</span>
                            {hasMega && (
                              <ChevronRight className={`w-3 h-3 flex-shrink-0 transition-transform ${isMenuOpen ? "rotate-90 text-gold" : "text-black/30"}`} />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </nav>

      {/* Bottom pinned section — SUPPORT hub */}
      <div className="mt-auto flex-shrink-0">
        <div className="px-3 py-4 border-t border-gold/20 space-y-2.5 bg-gradient-to-b from-[#EDE4D3]/50 to-[#EDE4D3]">
          <a
            href="mailto:info@jbjglobal.com"
            className="flex items-center gap-2.5 text-xs font-bold text-gold hover:text-gold/80 transition-colors px-2 py-2.5 rounded-lg border border-gold/20 hover:border-gold/40 hover:bg-gold/5"
          >
            <Headphones className="w-4 h-4" />
            Contact Support
          </a>
          <hr className="border-gold/15" />
          <Link
            to="/my-tickets"
            className="flex items-center gap-2.5 text-xs font-bold text-gold hover:text-gold/80 transition-colors px-2 py-2.5 rounded-lg border border-gold/20 hover:border-gold/40 hover:bg-gold/5"
          >
            <Ticket className="w-4 h-4" />
            Create Ticket Support
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — slides in after reveal */}
      <div
        className={`h-full transition-all duration-500 ease-out ${navRevealed ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        style={{ willChange: 'transform, opacity' }}
      >
      {collapsed ? (
        <div className="hidden lg:flex w-[48px] flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-gold/30 flex-col h-full items-center py-4 gap-3">
          <Link to="/" className="mb-2">
            <img src={jbjMonogramLightBg} alt="JBJ" className="w-9 h-9 object-contain" />
          </Link>

          {/* Section icons in collapsed state */}
          {SECTION_KEYS.map((sectionKey) => {
            const SectionIcon = SECTION_ICONS[sectionKey];
            const items = sectionGroups[sectionKey];
            const hasActiveChild = items?.some(item => isRouteActive(item.href)) || false;
            const hasMegaActive = sectionHasActiveMega(sectionKey);
            const isActive = hasActiveChild || hasMegaActive;

            return (
              <Tooltip key={sectionKey}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => {
                      setCollapsed(false);
                      try { localStorage.setItem('jj_nav_collapsed', '0'); } catch {}
                      setOpenSection(sectionKey);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-gold/15 text-gold'
                        : 'text-black/60 hover:text-gold hover:bg-gold/10'
                    }`}
                  >
                    <SectionIcon className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="text-xs">{sectionKey}</TooltipContent>
              </Tooltip>
            );
          })}

          <div className="flex-1" />

          <button
            onClick={toggleCollapse}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold/20 via-gold/10 to-gold/5 border border-gold/50 flex items-center justify-center hover:from-gold/30 hover:to-gold/15 transition-all shadow-lg shadow-gold/15"
            aria-label="Expand navigation"
            title="Expand navigation"
          >
            <ChevronRight className="w-5 h-5 text-gold" />
          </button>
        </div>
      ) : (
        <div className="hidden lg:flex w-[200px] flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-gold/30 h-full relative overscroll-contain">
          {renderNavContent()}
        </div>
      )}
      </div>

      {/* Mega Menu Panels (desktop — compact floating) */}
      {renderMegaMenu()}

      {/* Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} initialQuery="" onClose={() => setSearchOpen(false)} />
    </>
  );
}
