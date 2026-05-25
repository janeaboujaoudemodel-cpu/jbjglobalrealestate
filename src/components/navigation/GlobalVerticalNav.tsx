import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Building2, BarChart3, BookOpen, Briefcase, Users, Home, Tag, Key, PlusCircle,
  Building, Layers, Cpu, Heart, GitCompare, Calculator, Headphones, MapPin,
  Lightbulb, ChevronRight, ChevronLeft, ChevronDown, PanelLeftClose, Search, User, Settings, Castle, FileText,
  DollarSign, TrendingUp, ClipboardCheck, Shield, Sparkles, Bot, Video, Image,
  Mic, Stamp, CreditCard, Palette, Pen, Award, Globe, Brain, MessageSquare,
  Phone, Languages, FileSearch, FilePlus, UserCheck, CalendarClock, Mail,
  Share2, PenTool, Megaphone, GraduationCap, Briefcase as BriefcaseIcon,
  LayoutDashboard, FolderOpen, ListChecks, Bell, Zap, Menu, X, Star,
  Scale, Eye, Ticket, Compass, HandCoins, Handshake, Lock, Accessibility,
  ShieldCheck, Newspaper, BookMarked, Landmark, Camera, Ruler,
  LogOut, Wrench, Package, Hammer, Gavel, PaintBucket, Scissors, ScanLine,
  Wallet, Truck, BadgeCheck, SmilePlus, MessageCircle, Monitor,
  Database, Cog, HardHat, UserPlus, Presentation,
  QrCode, FileSignature, MailOpen, MessagesSquare,
  Workflow, BellRing, Crown, Boxes, Store, Gem, Receipt, Banknote,
  Podcast, NotebookPen, BookText, HelpCircle, ScrollText, Inbox,
} from "lucide-react";
import jbjMonogramLightBg from "@/assets/jbj-monogram-nobuffer.png";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import CurrencySwitcher from "@/components/CurrencySwitcher";
import { useDevelopers } from "@/hooks/useProjects";
import { useAreas } from "@/hooks/useAreas";
import { useLanguage, getLanguageInfo } from "@/contexts/LanguageContext";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { prefetchAITool } from "@/utils/aiToolPrefetch";
import { ACCOUNT_SHORTCUTS_SIDEBAR } from "@/config/accountShortcuts";

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
  | 'services' | 'company' | 'legal' | 'guides'
  | 'broker' | 'investor' | 'productivity' | 'account' | 'suites';

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
  
  { label: "AI Home Finder", href: "/quiz", icon: Home, highlight: true },
  { label: "List Your Property", href: "/list-property", icon: ClipboardCheck, highlight: true },
  { label: "Careers", href: "/join", icon: GraduationCap, highlight: true },
  { label: "Resale Properties", href: "/resale-properties", icon: DollarSign, highlight: true },

  // ── Properties ──
  { label: "Buy / Off-Plan", href: "/properties", icon: Building2, section: "PROPERTIES", megaMenu: 'buy' },
  { label: "All Projects", href: "/properties", icon: Building },
  { label: "List for Sale / Rent", href: "/list-property", icon: PlusCircle },
  { label: "Developers", href: "/developers", icon: Building, megaMenu: 'developers' },
  { label: "Areas", href: "/areas", icon: MapPin, megaMenu: 'areas' },
  { label: "Communities", href: "/communities", icon: Users },
  { label: "Map", href: "/map", icon: MapPin },

  // ── Creative & Tools ──
  { label: "Royal Tools Hub", href: "/ai-hub", icon: Sparkles, section: "TOOLS" },
  { label: "Corporate Suite", href: "/toolkit/corporate-suite", icon: Building },
  { label: "Real Estate Suite", href: "/toolkit/property-suite", icon: Home },
  { label: "Video Suite", href: "/toolkit/video-suite", icon: Video },
  { label: "Photo Suite", href: "/toolkit/photo-suite", icon: Image },
  { label: "Voice & Audio", href: "/toolkit/voice-suite", icon: Mic },
  { label: "PDF & Documents", href: "/toolkit/pdf-suite", icon: FileText },
  { label: "Stamp Generator", href: "/toolkit/stamp-generator", icon: Stamp },
  { label: "Business Card", href: "/toolkit/corporate-suite/business-card", icon: CreditCard },
  { label: "Logo Maker", href: "/toolkit/corporate-suite/logo-creator", icon: Palette },
  { label: "CV Builder", href: "/toolkit/corporate-suite/cv-resume", icon: FileSearch },
  { label: "Cover Letter", href: "/toolkit/corporate-suite/cover-letter", icon: Pen },
  { label: "Company Profile Builder", href: "/toolkit/corporate-suite/company-profile", icon: Award },
  { label: "Landing Page Builder", href: "/toolkit/corporate-suite/landing-page", icon: Globe },
  { label: "E-Sign", href: "/e-signature", icon: FileSignature },
  { label: "Scan & Sign", href: "/toolkit/scan-sign", icon: ScanLine },
  { label: "Brand Palette", href: "/brand-palette", icon: Palette },
  { label: "Video Resize Pack", href: "/toolkit/video-resize-pack", icon: Video },
  { label: "PDF from Photos", href: "/toolkit/pdf-from-photos", icon: FilePlus },
  { label: "Image Resize", href: "/toolkit/image-resize", icon: Image },
  { label: "Voice Studio", href: "/toolkit/voice-studio", icon: Mic },
  { label: "Voice Studio Pro", href: "/toolkit/voice-studio-pro", icon: Mic },
  { label: "AI Video Studio", href: "/toolkit/ai-video-studio", icon: Video },
  { label: "Captions & Translate", href: "/toolkit/captions-translate", icon: Languages },
  { label: "Background AI", href: "/toolkit/background-ai", icon: PaintBucket },
  { label: "Beauty Filters", href: "/toolkit/beauty-filters", icon: Sparkles },
  { label: "PDF Editor", href: "/toolkit/pdf-editor", icon: FileText },

  // ── AI Tools (merged into TOOLS section) ──
  { label: "AI Personal Shopper", href: "/ai-personal-shopper", icon: Store },
  { label: "AI Investment Report", href: "/ai-investment-report", icon: TrendingUp },
  { label: "Voice Agent Settings", href: "/voice-settings", icon: Mic },
  { label: "AI Calendar", href: "/ai-calendar", icon: CalendarClock },
  { label: "AI Budget Planner", href: "/ai-budget-planner", icon: Wallet },
  { label: "AI Property Analyzer", href: "/ai-property-analyzer", icon: Building },
  { label: "AI Price Predictor", href: "/ai-price-predictor", icon: TrendingUp },
  { label: "AI Neighborhood", href: "/ai-neighborhood-insights", icon: MapPin },
  { label: "Interior Design AI", href: "/interior-design-ai", icon: Palette },
  { label: "AI Lead Qualification", href: "/ai-lead-qualification", icon: UserCheck },
  { label: "AI Follow-up Scheduler", href: "/ai-followup-scheduler", icon: CalendarClock },
  { label: "AI Objection Handler", href: "/ai-objection-handler", icon: MessageSquare },
  { label: "AI Client Matcher", href: "/ai-client-matcher", icon: Users },
  { label: "AI Competitor Analysis", href: "/ai-competitor-analysis", icon: Eye },
  { label: "AI Market Report", href: "/ai-market-report", icon: FileText },
  { label: "AI ROI Calculator", href: "/ai-roi-calculator", icon: Calculator },
  { label: "AI Email Generator", href: "/ai-email-generator", icon: Mail },
  { label: "AI Translation Hub", href: "/ai-translation-hub", icon: Languages },
  { label: "AI Video Tour Script", href: "/toolkit/video-suite", icon: Video },
  { label: "AI Social Media", href: "/ai-social-media", icon: Share2 },
  { label: "AI Description Writer", href: "/ai-description-writer", icon: PenTool },
  { label: "AI Meeting Summarizer", href: "/ai-meeting-summarizer", icon: Mic },
  { label: "AI Call Summarizer", href: "/ai-call-summarizer", icon: Phone },
  { label: "AI Contract Reviewer", href: "/ai-contract-reviewer", icon: FileSearch },
  { label: "AI Document Generator", href: "/ai-document-generator", icon: FilePlus },
  { label: "AI History", href: "/my-ai-history", icon: Bot },

  // ── Insights ──
  { label: "Market Intelligence", href: "/market-intelligence", icon: BarChart3, section: "INSIGHTS" },
  { label: "Insights", href: "/insights", icon: Lightbulb, megaMenu: 'insights' },
  { label: "News", href: "/news", icon: Megaphone },
  { label: "Market Report", href: "/market-report", icon: FileText },
  { label: "Market Overview", href: "/market-intelligence/overview", icon: BarChart3 },
  { label: "Area Intelligence", href: "/market-intelligence/areas", icon: MapPin },
  { label: "Reports Archive", href: "/market-intelligence/reports", icon: FolderOpen },
  { label: "Methodology", href: "/market-intelligence/methodology", icon: BookOpen },

  // ── Guides ──
  { label: "Guides Library", href: "/guides", icon: BookOpen, megaMenu: 'guides', section: "GUIDES" },
  { label: "Buyer's Guide", href: "/buyer-guide", icon: FileText },
  { label: "Seller's Guide", href: "/seller-guide", icon: FileText },
  { label: "Rental Guide", href: "/rent-guide", icon: FileText },
  { label: "Tenant Guide", href: "/tenant-guide", icon: FileText },
  { label: "Landlord Guide", href: "/landlord-guide", icon: FileText },
  { label: "Investor Education", href: "/investor-education", icon: GraduationCap },
  { label: "Broker Learning", href: "/broker/learning", icon: GraduationCap },
  { label: "Golden Visa Guide", href: "/guides/golden-visa-uae", icon: Award },
  { label: "Books Library", href: "/education-hub", icon: BookMarked },
  { label: "FAQ Hub", href: "/faq", icon: HelpCircle },

  // ── Services ──
  { label: "All Services", href: "/services", icon: Briefcase, megaMenu: 'services', section: "SERVICES" },
  { label: "Property Management", href: "/services/property-management", icon: Key },
  { label: "Golden Visa", href: "/guides/golden-visa-uae", icon: Award },
  { label: "Mortgage Advisory", href: "/partners/mortgage", icon: Landmark },
  { label: "Legal Services", href: "/partners/legal", icon: Gavel },
  { label: "Visa Services", href: "/partners/visa-services", icon: Globe },
  { label: "Company Setup", href: "/partners/company-setup", icon: Building },
  { label: "Valuation", href: "/sell/valuation", icon: DollarSign },
  { label: "Selling Advisory", href: "/services/selling-advisory", icon: TrendingUp },
  { label: "Short-term Rentals", href: "/services/short-term-rentals", icon: CalendarClock },
  { label: "Concierge", href: "/services/concierge", icon: Handshake },
  { label: "Architecture", href: "/services/architecture", icon: HardHat },
  { label: "Interior Design", href: "/services/interior-design", icon: PaintBucket },
  { label: "Fit-Out", href: "/services/fit-out", icon: Hammer },
  { label: "Design & Build", href: "/services/design-build", icon: Wrench },
  { label: "Law Firm", href: "/services/law-firm", icon: Gavel },
  { label: "Buying Advisory", href: "/services/buying-advisory", icon: Briefcase },
  { label: "Rental Advisory", href: "/services/rental-advisory", icon: Key },
  { label: "Investment Advisory", href: "/services/investment-advisory", icon: TrendingUp },
  { label: "Snagging", href: "/services/snagging", icon: ClipboardCheck },
  { label: "Currency Exchange", href: "/services/currency-exchange", icon: HandCoins },
  { label: "Signature Collection", href: "/services/signature-collection", icon: FileSignature },
  { label: "AI Tools Service", href: "/services/ai-tools", icon: Bot },
  { label: "Broker Certification", href: "/services/broker-certification", icon: BadgeCheck },
  { label: "Complaint Procedures", href: "/services/complaint-procedures", icon: ScrollText },
  { label: "Customer Happiness", href: "/services/customer-happiness-center", icon: SmilePlus },
  { label: "Testimonials", href: "/services/testimonials", icon: Heart },
  { label: "Referral Partner", href: "/referral-partner", icon: Handshake },

  // ── Broker & Academy ──
  { label: "Broker Portal", href: "/broker-portal", icon: BriefcaseIcon, section: "BROKER & ACADEMY", megaMenu: 'broker' },
  { label: "Broker Toolkit", href: "/broker-toolkit", icon: Wrench },
  { label: "Broker Resources", href: "/broker-resources", icon: FolderOpen },
  { label: "Broker Learning", href: "/broker/learning", icon: GraduationCap },
  { label: "Broker Hub", href: "/broker-hub", icon: Compass },
  // Note: "Broker Dashboard" removed from this section — it's the user's personal dashboard, not a broker-only tool.
  { label: "JBJ Academy", href: "/jbj-academy", icon: GraduationCap },
  { label: "Academy Graduates", href: "/academy/graduates", icon: Award },
  { label: "AI Broker Workspace", href: "/ai-broker-workspace", icon: Bot },

  // ── Investor ──
  { label: "Investor Hub", href: "/investor-hub", icon: TrendingUp, section: "INVESTOR", megaMenu: 'investor' },
  { label: "Investor Services", href: "/investors", icon: Briefcase },
  { label: "Join Investor List", href: "/investors/join", icon: UserPlus },
  { label: "Investor Dashboard", href: "/investor-dashboard", icon: LayoutDashboard },
  { label: "Portfolio Views", href: "/investor-dashboard/portfolio", icon: Gem },

  // ── Company ──
  { label: "About", href: "/about", icon: Users, megaMenu: 'company', section: "COMPANY" },
  { label: "Team", href: "/team", icon: Users },
  { label: "Founder", href: "/founder", icon: Crown },
  { label: "Contact", href: "/contact", icon: Phone },
  { label: "Awards", href: "/awards", icon: Award },
  { label: "Press Kit", href: "/press-kit", icon: Newspaper },
  { label: "Company Profile", href: "/company-profile", icon: Building },
  { label: "Philanthropy", href: "/philanthropy", icon: Heart },
  
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Career Portal", href: "/join", icon: GraduationCap },
  { label: "Partner Governance", href: "/governance/partners", icon: Shield },

  // ── Legal ──
  { label: "Terms of Service", href: "/terms", icon: Scale, megaMenu: 'legal', section: "LEGAL" },
  { label: "Privacy Policy", href: "/privacy", icon: Lock },
  { label: "Cookie Policy", href: "/cookies", icon: Shield },
  { label: "Disclaimers", href: "/disclaimers", icon: FileText },
  { label: "Intellectual Property", href: "/intellectual-property", icon: ShieldCheck },
  { label: "AML / KYC", href: "/aml-kyc", icon: Shield },
  { label: "Accessibility", href: "/accessibility", icon: Accessibility },
  { label: "Trust Center", href: "/trust-and-audit-center", icon: ShieldCheck },
  { label: "Trust & Compliance", href: "/trust-compliance", icon: ShieldCheck },
  

  // ── Productivity ──
  { label: "Spreadsheet", href: "/spreadsheet", icon: BarChart3, section: "PRODUCTIVITY", megaMenu: 'productivity' },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "QR Generator", href: "/qr-generator", icon: QrCode },
  { label: "Contract Forms", href: "/contract-forms", icon: FileSignature },
  { label: "Video Meeting", href: "/video-meeting", icon: Video },
  { label: "Presentations", href: "/presentations", icon: Presentation },
  { label: "Sitemap", href: "/sitemap", icon: MapPin },
  { label: "Pricing", href: "/pricing", icon: DollarSign },
  { label: "Onboarding", href: "/onboarding", icon: UserPlus },
  { label: "Client Portal", href: "/client-portal", icon: Users },
  { label: "Meeting Center", href: "/meeting-center", icon: Users },

  // ── Account ──
  { label: "My Dashboard", href: "/my-dashboard", icon: LayoutDashboard, section: "MY ACCOUNT", megaMenu: 'account' },
  { label: "My Tasks", href: "/my-dashboard#tasks", icon: ListChecks },
  { label: "Notifications", href: "/my-dashboard#notifications", icon: Bell },
  { label: "Inbox", href: "/my-dashboard#inbox", icon: Inbox },
  { label: "My Calendar", href: "/ai-calendar", icon: CalendarClock },
  { label: "Activity Log", href: "/my-dashboard#activity", icon: Eye },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Shortlisted", href: "/favorites?tab=shortlist", icon: Star },
  { label: "Saved Filters", href: "/favorites?tab=saved-filters", icon: Sparkles },
  { label: "Compare", href: "/compare", icon: GitCompare },
  { label: "Books Library", href: "/education-hub", icon: BookMarked },
  { label: "Mortgage Calculator", href: "/mortgage-calculator", icon: Calculator },
  { label: "My Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/profile?tab=settings", icon: Settings },
  { label: "My Tickets", href: "/my-tickets", icon: Ticket },
  { label: "Ticket Hub", href: "/ticket-hub", icon: Ticket },


  // ── Business Suites ──
  { label: "Suites Hub", href: "/suites", icon: Boxes, section: "BUSINESS SUITES", megaMenu: 'suites' },
  { label: "All Tools Suite", href: "/business-suite/all", icon: Package },
  { label: "Real Estate Suite", href: "/business-suite/real-estate", icon: Building2 },
  { label: "Broker Suite", href: "/business-suite/broker", icon: BriefcaseIcon },
  { label: "Creative Suite", href: "/business-suite/creative", icon: Palette },
  { label: "Productivity Suite", href: "/business-suite/productivity", icon: Cog },

  // ── Admin & Owner (shown conditionally) ──
  { label: "Command Center", href: "/owner", icon: Crown, section: "ADMIN & OWNER" },
  { label: "Admin Panel", href: "/admin", icon: Lock },
  { label: "Admin CRM", href: "/admin/crm", icon: Users },
  { label: "Admin Inquiries", href: "/admin/inquiries", icon: MailOpen },
  { label: "Admin Chat", href: "/admin/chat-conversations", icon: MessagesSquare },
  { label: "Admin Onboarding", href: "/admin/onboarding", icon: UserPlus },
  { label: "Admin Roles", href: "/admin/roles", icon: Shield },
  { label: "Admin Intelligence", href: "/admin/intelligence", icon: Brain },
  { label: "Admin Developers", href: "/admin/developers", icon: Building },
  { label: "Marketing Hub", href: "/admin/marketing-hub", icon: Megaphone },
  { label: "Media Ingestion", href: "/admin/media-ingestion", icon: Inbox },
  { label: "Admin Training Guide", href: "/admin/training-guide", icon: BookOpen },
  { label: "Admin Legal Center", href: "/admin/legal-center", icon: Gavel },
  { label: "HR Dashboard", href: "/hr-dashboard", icon: Users },
  { label: "HR Agent", href: "/hr-agent", icon: Bot },
  { label: "Employee Hub", href: "/employee-hub", icon: Users },
  { label: "Employee Chat", href: "/employee-chat", icon: MessageCircle },
  { label: "Employee Management", href: "/employee-management", icon: Cog },
  { label: "Customer Happiness", href: "/customer-happiness", icon: SmilePlus },
  { label: "Security Console", href: "/security-console", icon: Shield },
  { label: "Company Comm", href: "/company-comm", icon: Mail },
  { label: "Developer Hub", href: "/developer-portal", icon: Building },
  { label: "Executive Assistant", href: "/executive-assistant", icon: Bot },
  { label: "Call Review", href: "/call-review", icon: Phone },
  { label: "Video Builder", href: "/video-builder", icon: Video },
  { label: "Business Card Scanner", href: "/business-card-scanner", icon: ScanLine },
  { label: "JBJ Analytics", href: "/jbj-analytics", icon: BarChart3 },
  { label: "JBJ Design Studio", href: "/jbj-design-studio", icon: Palette },
  { label: "JBJ Broker Admin", href: "/jbj-broker-admin", icon: BriefcaseIcon },
  { label: "Broker Messages", href: "/jbj-broker-messages", icon: MessageSquare },
  { label: "Broker Reports", href: "/jbj-broker-reports", icon: FileText },
  { label: "Broker Admin Assistant", href: "/broker-admin-assistant", icon: Bot },
  { label: "Referral Admin", href: "/referral-admin", icon: Handshake },
  { label: "E-Signature Suite", href: "/e-signature", icon: FileSignature },
  { label: "Whiteboard", href: "/whiteboard", icon: PenTool },
  { label: "Mind Map", href: "/mindmap", icon: Brain },
  { label: "Form Builder", href: "/form-builder", icon: ClipboardCheck },
  { label: "Kanban Board", href: "/kanban", icon: LayoutDashboard },
  { label: "Email Client", href: "/email-client", icon: Mail },
  { label: "Team Chat", href: "/team-chat", icon: MessagesSquare },
  { label: "Automations", href: "/owner/automations", icon: Workflow },
  { label: "Alerts Demo", href: "/alerts-demo", icon: BellRing },
  { label: "Internal MI Dashboard", href: "/internal/market-intelligence/dashboard", icon: Database },
  { label: "AI Governance", href: "/governance/ai", icon: Shield },
];

const PUBLIC_TOOLS_WORKSPACE_ITEMS: NavItem[] = [
  { label: "AI Home Finder", href: "/quiz", icon: Home, section: "TOOLS" },
  { label: "Property Comparison", href: "/compare", icon: GitCompare },
  { label: "Mortgage Calculator", href: "/mortgage-calculator", icon: Calculator },
  { label: "Rental Index", href: "/rental-index", icon: TrendingUp },
  { label: "Property Evaluator", href: "/property-evaluator", icon: BarChart3 },
  { label: "List Property for Sale", href: "/list-property?purpose=sale&mode=manual", icon: ClipboardCheck },
  { label: "List Property for Rent", href: "/list-property?purpose=rent&mode=manual", icon: Key },
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
    { label: 'List Your Property for Sale', icon: ClipboardCheck, href: '/list-property?purpose=sale&mode=manual' },
  ],
  rent: [
    { label: 'Apartments for Rent', icon: Building2, href: '/properties?type=apartment&transaction=rent' },
    { label: 'Villas for Rent', icon: Home, href: '/properties?type=villa&transaction=rent' },
    { label: "Tenant's Guide", icon: FileText, href: '/tenant-guide' },
    { label: "Landlord Guide", icon: FileText, href: '/landlord-guide' },
    { label: 'Property Management', icon: Shield, href: '/services/property-management' },
    { label: 'Rental Index', icon: TrendingUp, href: '/rental-index' },
    { label: 'List Your Property for Rent', icon: ClipboardCheck, href: '/list-property?purpose=rent&mode=manual' },
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
    { label: 'Broker Learning', icon: BookOpen, href: '/broker/learning' },
  ],
  guides: [
    { label: 'Buyer Guide', icon: FileText, href: '/buyer-guide' },
    { label: 'Seller Guide', icon: FileText, href: '/seller-guide' },
    { label: 'Rent Guide', icon: FileText, href: '/rent-guide' },
    { label: "Tenant Guide", icon: FileText, href: '/tenant-guide' },
    { label: "Landlord Guide", icon: FileText, href: '/landlord-guide' },
    { label: 'Investor Education', icon: BookOpen, href: '/investor-education' },
    { label: 'Broker Learning', icon: BookOpen, href: '/broker/learning' },
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
    { label: 'Careers', icon: GraduationCap, href: '/join' },
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
    { label: 'AI Home Finder', icon: Home, href: '/quiz' },
    { label: 'Property Comparison', icon: GitCompare, href: '/compare' },
    { label: 'Mortgage Calculator', icon: Calculator, href: '/mortgage-calculator' },
    { label: 'Rental Index', icon: TrendingUp, href: '/rental-index' },
    { label: 'Property Evaluator', icon: BarChart3, href: '/property-evaluator' },
    { label: 'List Property for Sale', icon: ClipboardCheck, href: '/list-property?purpose=sale&mode=manual' },
    { label: 'List Property for Rent', icon: Key, href: '/list-property?purpose=rent&mode=manual' },
  ],
  creative: [
    { label: 'AI Home Finder', icon: Home, href: '/quiz' },
    { label: 'Property Comparison', icon: GitCompare, href: '/compare' },
    { label: 'Mortgage Calculator', icon: Calculator, href: '/mortgage-calculator' },
    { label: 'Rental Index', icon: TrendingUp, href: '/rental-index' },
    { label: 'Property Evaluator', icon: BarChart3, href: '/property-evaluator' },
    { label: 'List Property for Sale', icon: ClipboardCheck, href: '/list-property?purpose=sale&mode=manual' },
    { label: 'List Property for Rent', icon: Key, href: '/list-property?purpose=rent&mode=manual' },
  ],
  shortcuts: [
    { label: 'My Dashboard', icon: LayoutDashboard, href: '/my-dashboard' },
    { label: 'AI Tools', icon: Sparkles, href: '/ai-hub' },
    { label: 'CRM Dashboard', icon: Users, href: '/crm' },
    { label: 'Customer Happiness', icon: Users, href: '/admin?tab=customer-happiness' },
    { label: 'My Tasks', icon: ListChecks, href: '/my-dashboard#tasks' },
    { label: 'Notifications', icon: Bell, href: '/my-dashboard#notifications' },
    { label: 'AI Calendar & Notes', icon: CalendarClock, href: '/ai-calendar' },
    { label: 'Owner Command Center', icon: Shield, href: '/owner' },
    { label: 'Admin Panel', icon: Lock, href: '/admin' },
    { label: 'CP Center', icon: Compass, href: '/owner' },
    { label: 'Inbox Inquiries', icon: Mail, href: '/owner/inbox' },
    { label: 'Listing Admin', icon: FolderOpen, href: '/listing-admin' },
    { label: 'Broker Dashboard', icon: BriefcaseIcon, href: '/broker-dashboard' },
    { label: 'My Assistant', icon: Bot, href: '/founder-assistant' },
    { label: 'Support Tickets', icon: Ticket, href: '/my-tickets' },
    { label: 'My Profile', icon: User, href: '/profile' },
    { label: 'Settings', icon: Settings, href: '/profile' },
    { label: 'Favorites', icon: Heart, href: '/favorites' },
    { label: 'AI History', icon: Bot, href: '/my-ai-history' },
  ],
  broker: [
    { label: 'Broker Portal', icon: BriefcaseIcon, href: '/broker-portal' },
    { label: 'Broker Toolkit', icon: Wrench, href: '/broker-toolkit' },
    { label: 'Broker Learning', icon: GraduationCap, href: '/broker/learning' },
    { label: 'JBJ Academy', icon: GraduationCap, href: '/jbj-academy' },
    { label: 'Academy Graduates', icon: Award, href: '/academy/graduates' },
    { label: 'Broker Dashboard', icon: LayoutDashboard, href: '/broker-dashboard' },
    { label: 'Broker Resources', icon: FolderOpen, href: '/broker-resources' },
    { label: 'AI Broker Workspace', icon: Bot, href: '/ai-broker-workspace' },
  ],
  investor: [
    { label: 'Investor Hub', icon: TrendingUp, href: '/investor-hub' },
    { label: 'Investor Services', icon: Briefcase, href: '/investors' },
    { label: 'Join Investor List', icon: UserPlus, href: '/investors/join' },
    { label: 'Investor Dashboard', icon: LayoutDashboard, href: '/investor-dashboard' },
    { label: 'Portfolio Views', icon: Gem, href: '/investor-dashboard/portfolio' },
  ],
  productivity: [
    { label: 'Spreadsheet', icon: BarChart3, href: '/spreadsheet' },
    { label: 'Documents', icon: FileText, href: '/documents' },
    { label: 'QR Generator', icon: QrCode, href: '/qr-generator' },
    { label: 'Contract Forms', icon: FileSignature, href: '/contract-forms' },
    { label: 'Video Meeting', icon: Video, href: '/video-meeting' },
    { label: 'Presentations', icon: Presentation, href: '/presentations' },
    { label: 'Meeting Center', icon: Users, href: '/meeting-center' },
    { label: 'Client Portal', icon: Users, href: '/client-portal' },
  ],
  account: ACCOUNT_SHORTCUTS_SIDEBAR.map(s => ({ label: s.label, icon: s.icon, href: s.href })),
  suites: [
    { label: 'Suites Hub', icon: Boxes, href: '/suites' },
    { label: 'All Tools Suite', icon: Package, href: '/business-suite/all' },
    { label: 'Real Estate Suite', icon: Building2, href: '/business-suite/real-estate' },
    { label: 'Broker Suite', icon: BriefcaseIcon, href: '/business-suite/broker' },
    { label: 'Creative Suite', icon: Palette, href: '/business-suite/creative' },
    { label: 'Productivity Suite', icon: Cog, href: '/business-suite/productivity' },
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
  broker: 'Broker & Academy',
  investor: 'Investor Hub',
  productivity: 'Productivity',
  account: 'My Account',
  suites: 'Business Suites',
};

/* ─── COLOR-CODED SHORTCUT GROUPS ─── */
// Now imported from canonical config
import { SHORTCUT_GROUPS as CANONICAL_SHORTCUT_GROUPS, filterShortcutGroups } from "@/config/shortcutsConfig";


/* ─── SECTION KEYS ─── */
const SECTION_KEYS = [
  "TOOLS & WORKSPACE",
  "PROPERTIES",
  "INSIGHTS & GUIDES",
  "SERVICES",
  "BROKER & ACADEMY",
  "INVESTOR",
  "COMPANY & LEGAL",
  "MY ACCOUNT",
  "ADMIN & OWNER",
] as const;
type SectionKey = typeof SECTION_KEYS[number];

/* ─── Map raw item.section values onto consolidated section keys ─── */
const SECTION_ALIAS: Record<string, SectionKey> = {
  "PROPERTIES": "PROPERTIES",
  "TOOLS": "TOOLS & WORKSPACE",
  "PRODUCTIVITY": "TOOLS & WORKSPACE",
  "BUSINESS SUITES": "TOOLS & WORKSPACE",
  "INSIGHTS": "INSIGHTS & GUIDES",
  "GUIDES": "INSIGHTS & GUIDES",
  "SERVICES": "SERVICES",
  "BROKER & ACADEMY": "BROKER & ACADEMY",
  "INVESTOR": "INVESTOR",
  "COMPANY": "COMPANY & LEGAL",
  "LEGAL": "COMPANY & LEGAL",
  "MY ACCOUNT": "MY ACCOUNT",
  "ADMIN & OWNER": "ADMIN & OWNER",
};

/* ─── SECTION ICONS ─── */
const SECTION_ICONS: Record<SectionKey, any> = {
  "TOOLS & WORKSPACE": Sparkles,
  "PROPERTIES": Building2,
  "INSIGHTS & GUIDES": Lightbulb,
  "SERVICES": Briefcase,
  "BROKER & ACADEMY": GraduationCap,
  "INVESTOR": TrendingUp,
  "COMPANY & LEGAL": Users,
  "MY ACCOUNT": User,
  "ADMIN & OWNER": Crown,
};

/* VerticalNavUtilityBar removed — these controls now live in HorizontalUtilityBar */



export default function GlobalVerticalNav() {
  const location = useLocation();
  const { session } = useAuth();
  const { role, isBroker, isInvestor, isOwner } = useUserRole();
  const { isDeveloperMode, mode } = useUserModeContext();
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('jj_nav_collapsed');
      if (stored === '0') return false;
      if (stored === null) {
        // Default: collapsed on first visit so the page stays clean.
        try { localStorage.setItem('jj_nav_collapsed', '1'); } catch {}
      }
      return true;
    } catch { return true; }
  });
  const [showExpandPulse, setShowExpandPulse] = useState(() => {
    try { return sessionStorage.getItem('jj_sidebar_expand_seen_session') !== '1'; }
    catch { return true; }
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

  // ── Always reveal immediately on all routes ──
  const [navRevealed, setNavRevealed] = useState(true);

  useEffect(() => {
    if (!navRevealed) {
      setNavRevealed(true);
      try { sessionStorage.setItem('jj_nav_revealed', '1'); } catch {}
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem('jj_nav_collapsed', next ? '1' : '0'); } catch {}
      return next;
    });
    setActiveMegaMenu(null);
  }, []);

  const collapseAfterNavigation = useCallback(() => {
    setCollapsed(true);
    try { localStorage.setItem('jj_nav_collapsed', '1'); } catch {}
    setActiveMegaMenu(null);
    setMobileOpen(false);
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

  // Listen for toggle events from horizontal utility bar
  useEffect(() => {
    const handler = () => {
      setCollapsed(prev => {
        const next = !prev;
        try { localStorage.setItem('jj_nav_collapsed', next ? '1' : '0'); } catch {}
        return next;
      });
      setActiveMegaMenu(null);
    };
    window.addEventListener('jj_nav_toggle', handler);
    return () => window.removeEventListener('jj_nav_toggle', handler);
  }, []);

  const handleNavClick = useCallback((megaMenu?: MegaMenuKey, e?: React.MouseEvent) => {
    if (megaMenu) {
      e?.preventDefault();
      setActiveMegaMenu((prev) => (prev === megaMenu ? null : megaMenu));
      return;
    }
    collapseAfterNavigation();
  }, [collapseAfterNavigation]);

  const [shortcutsExpanded, setShortcutsExpanded] = useState(false);

  const closeMegaMenu = useCallback(() => setActiveMegaMenu(null), []);

  // Close mega menu and auto-expand active section on route change
  useEffect(() => {
    closeMegaMenu();
    setMobileOpen(false);
    // Auto-close My Account section on any navigation to prevent stuck state
    if (openSection === 'MY ACCOUNT') {
      setOpenSection(null);
    }
     // Auto-expand the section containing the active route
     for (const [section, items] of Object.entries(sectionGroups)) {
       if (items.some(item => isRouteActive(item.href))) {
         setOpenSection(section as SectionKey);
         break;
       }
     }
   }, [location.pathname, closeMegaMenu]);

  const isRouteActive = (href: string) => {
    if (href === "#") return false;
    if (href === "/properties") return location.pathname === "/properties" || location.pathname.startsWith("/properties/");
    // Prefix matching for toolkit sub-routes (stamp-generator, corporate-suite, etc.)
    if (href.startsWith("/toolkit/")) return location.pathname === href || location.pathname.startsWith(href + "/");
    return location.pathname === href;
  };

  // Group nav items by section (with consolidated aliases)
  const { highlightItems, sectionGroups } = useMemo(() => {
    const highlights: NavItem[] = [];
    const sections: Record<string, NavItem[]> = {};
    let currentSection: SectionKey | null = null;

    for (const item of NAV_ITEMS) {
      if (item.highlight) {
        highlights.push(item);
        continue;
      }
      if (item.section) {
        const mapped = SECTION_ALIAS[item.section];
        if (mapped) {
          currentSection = mapped;
          if (!sections[currentSection]) sections[currentSection] = [];
        }
      }
      if (currentSection) {
        sections[currentSection].push(item);
      }
    }
    sections["TOOLS & WORKSPACE"] = PUBLIC_TOOLS_WORKSPACE_ITEMS;
    return { highlightItems: highlights, sectionGroups: sections };
  }, []);

  // Auto-open is now handled by the route-change effect above

  const navigate = useNavigate();

  // Accordion toggle — only one section open at a time (instant open/close, no forced scroll)
  const toggleSection = (section: SectionKey, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setOpenSection(prev => prev === section ? null : section);
    // Always close any active mega menu — sections should only expand vertically inline,
    // never open the full-screen mega drop-down overlay.
    setActiveMegaMenu(null);
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
    const shouldHighlight = activeMegaMenu ? isThisMenuOpen : routeActive;

    // Top highlighted hubs (AI Home Finder, List Your Property, Careers, Resale Properties)
    // — premium GOLD label to match the main section headers.
    if (
      item.href === '/join' ||
      item.href === '/quiz' ||
      (item.href === '/list-property' && item.highlight) ||
      item.href === '/resale-properties'
    ) {
      return shouldHighlight
        ? "font-bold"
        : "font-semibold";
    }
    if (sectionKey === 'MY ACCOUNT') {
      return shouldHighlight
        ? "text-[#B89555] font-bold"
        : "text-[#B89555] font-semibold";
    }
    if (item.highlight) {
      return shouldHighlight
        ? "text-[#B89555] font-bold"
        : "text-[#B89555] font-semibold";
    }
    return shouldHighlight
      ? "text-[#B89555] font-bold"
      : "text-[#B89555]";
  };

  // Saturated colored rows where the row background is a vivid fill (not champagne).
  // On those rows, icon glyphs go white for contrast and the tile uses translucent white.
  const isSaturatedColorRow = (item: NavItem) =>
    item.href === '/join' ||
    item.href === '/quiz' ||
    (item.href === '/list-property' && (item as any).highlight) ||
    item.href === '/resale-properties';

  const getIconStyle = (item: NavItem, sectionKey?: string) => {
    const isThisMenuOpen = item.megaMenu ? activeMegaMenu === item.megaMenu : false;
    const routeActive = isRouteActive(item.href);
    const shouldHighlight = activeMegaMenu ? isThisMenuOpen : routeActive;
    // (Highlighted hubs were previously saturated; now unified to gold — no white-on-color override.)
    // Active on champagne row → deeper gold for stronger contrast.
    if (shouldHighlight) return 'text-[hsl(var(--gold-dark))]';
    // Resting state → premium gold.
    return 'text-[hsl(var(--gold))]';
  };

  // Premium gold-bordered icon tile shared across nav rows.
  const getIconTileClass = (item: NavItem) => {
    const isThisMenuOpen = item.megaMenu ? activeMegaMenu === item.megaMenu : false;
    const routeActive = isRouteActive(item.href);
    const shouldHighlight = activeMegaMenu ? isThisMenuOpen : routeActive;
    // (Saturated-row override removed — all rows now share the gold tile.)
    if (shouldHighlight) {
      return 'bg-[hsl(var(--gold))]/20 border border-[hsl(var(--gold))]/80 shadow-[0_0_0_1px_rgba(217,194,146,0.35)]';
    }
    return 'bg-[hsl(var(--gold))]/[0.06] border border-[hsl(var(--gold))]/45 group-hover:bg-[hsl(var(--gold))]/15 group-hover:border-[hsl(var(--gold))]/70';
  };


  /* ─── RENDER MEGA MENU ─── */
  const renderMegaMenu = () => {
    if (!activeMegaMenu || collapsed) return null;
    const sidebarWidth = '200px';
    const title = MEGA_MENU_TITLES[activeMegaMenu] || activeMegaMenu;

    // Shortcuts now render inline (accordion) inside the sidebar — never as a popout panel.
    if (activeMegaMenu === 'shortcuts') {
      return null;
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
            className="fixed inset-0 z-[9999] bg-[#1A1A1A]/30 backdrop-blur-sm"
            style={{ left: sidebarWidth }}
            onClick={closeMegaMenu}
          />
          <div
            className="fixed z-[10000] flex items-start justify-start pointer-events-none"
style={{ left: sidebarWidth, top: '88px', bottom: 0, right: 0 }}
          >
            <div
              className="pointer-events-auto relative w-[min(600px,calc(100vw-240px))] overflow-hidden mt-4 ml-3 rounded-2xl border border-[#B89555]/70 bg-gradient-to-b from-[#FFFCF6] via-[#F7EFDF] to-[#EFE3C9] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.45),0_0_0_1px_rgba(217,194,146,0.35)_inset] animate-in slide-in-from-left-2 fade-in duration-200 max-h-[calc(100vh-100px)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gold to-gold-dark" aria-hidden />
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#B89555]/40 bg-gradient-to-r from-[#EADBB6] to-[#D8C7A6]">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-sm">
                    <ItemIcon className="w-3.5 h-3.5 text-white" />
                  </span>
                  <h3 className="text-sm font-bold text-[#1A1A1A] tracking-tight">{title}</h3>
                  <span className="text-[10px] text-[#1A1A1A]/50 font-medium">({curatedItems.length})</span>
                </div>
                <button
                  onClick={closeMegaMenu}
                  className="w-6 h-6 rounded-full bg-[#FDFBF7] border border-[hsl(var(--gold))]/70 flex items-center justify-center hover:bg-[hsl(var(--gold))]/10 transition-colors shadow-sm"
                >
                  <X className="w-3 h-3 text-[#1A1A1A]" />
                </button>
              </div>

              {/* Curated list */}
              <div className="overflow-y-auto jj-scrollbar-gold p-3 space-y-1">
                {curatedItems.map((entry) => {
                  const entryHref = isDev ? `/developer/${entry.slug}` : `/area/${entry.slug}`;
                  const linkActive = isRouteActive(entryHref);
                  return (
                    <Link
                      key={entry.slug}
                      to={entryHref}
                      onClick={collapseAfterNavigation}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                        linkActive
                          ? "bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] font-bold border-[#B89555] shadow-sm"
                          : "bg-[#FDFBF7]/70 border-[#B89555]/25 text-[#1A1A1A]/85 hover:bg-[#EFE6D6]/15 hover:border-[#B89555]/60"
                      }`}
                    >
                      <ItemIcon className={`w-4 h-4 flex-shrink-0 ${linkActive ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]'}`} />
                      <span className="flex-1">{entry.name}</span>
                      <ChevronRight className={`w-3 h-3 flex-shrink-0 ${linkActive ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/70'}`} />
                    </Link>
                  );
                })}

                {/* Divider + View All CTA */}
                <hr className="border-[#B89555]/30 my-2" />
                <Link
                  to={viewAllHref}
                  onClick={collapseAfterNavigation}
                  className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-bold text-[#1A1A1A] bg-gradient-to-r from-gold to-gold-dark hover:opacity-95 transition-all border border-[#B89555] shadow-sm"
                >
                  <Eye className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="flex-1">{viewAllLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-white" />
                </Link>
                {!isDev && (
                  <Link
                    to="/guides"
                    onClick={collapseAfterNavigation}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold border bg-[#FDFBF7]/70 border-[#B89555]/25 text-[#1A1A1A]/85 hover:bg-[#EFE6D6]/15 hover:border-[#B89555]/60 transition-all"
                  >
                    <BookOpen className="w-4 h-4 text-[#1A1A1A] flex-shrink-0" />
                    <span className="flex-1">Read Area Guides</span>
                    <ChevronRight className="w-3 h-3 text-[#1A1A1A]/70 flex-shrink-0" />
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
          className="fixed inset-0 z-[9999] bg-[#1A1A1A]/30 backdrop-blur-sm"
          style={{ left: sidebarWidth }}
          onClick={closeMegaMenu}
        />
        <div
          className="fixed z-[10000] flex items-start justify-start pointer-events-none"
style={{ left: sidebarWidth, top: '88px', bottom: 0, right: 0 }}
        >
          <div
            className={`pointer-events-auto relative w-[min(600px,calc(100vw-240px))] overflow-hidden mt-4 ml-3 rounded-2xl border border-[#B89555]/70 bg-gradient-to-b from-[#FFFCF6] via-[#F7EFDF] to-[#EFE3C9] shadow-[0_24px_60px_-18px_rgba(0,0,0,0.45),0_0_0_1px_rgba(217,194,146,0.35)_inset] animate-in slide-in-from-left-2 fade-in duration-200 ${isLargeMenu ? 'max-h-[calc(100vh-100px)]' : 'max-h-[calc(100vh-160px)]'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-gold to-gold-dark" aria-hidden />
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#B89555]/40 bg-gradient-to-r from-[#EADBB6] to-[#D8C7A6]">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </span>
                <h3 className="text-sm font-bold text-[#1A1A1A] tracking-tight">{title}</h3>
              </div>
              <button
                onClick={closeMegaMenu}
                className="w-6 h-6 rounded-full bg-[#FDFBF7] border border-[hsl(var(--gold))]/70 flex items-center justify-center hover:bg-[hsl(var(--gold))]/10 transition-colors shadow-sm"
              >
                <X className="w-3 h-3 text-[#1A1A1A]" />
              </button>
            </div>
            <div className={`overflow-y-auto jj-scrollbar-gold p-3 ${isLargeMenu ? 'columns-2 gap-1.5' : 'space-y-1'}`}>
              {links.map((link) => {
                const Icon = link.icon;
                const linkActive = isRouteActive(link.href);
                return (
                  <Link
                    key={link.href + link.label}
                    to={link.href}
                    onClick={collapseAfterNavigation}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all break-inside-avoid border mb-1 ${
                      linkActive
                        ? "bg-gradient-to-r from-gold to-gold-dark text-[#1A1A1A] font-bold border-[#B89555] shadow-sm"
                        : "bg-[#FDFBF7]/70 border-[#B89555]/25 text-[#1A1A1A]/85 hover:bg-[#EFE6D6]/15 hover:border-[#B89555]/60"
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${linkActive ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]'}`} />
                    <span className="flex-1">{link.label}</span>
                    <ChevronRight className={`w-3 h-3 flex-shrink-0 ${linkActive ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/70'}`} />
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
      {/* ━━━ LOGO HEADER (88px) — clean, no collapse control ━━━ */}
      <div className="h-[88px] shrink-0 flex flex-row items-center px-2.5 bg-[#FDFBF7] relative after:content-[''] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-[#B89555] after:to-transparent after:shadow-[0_1px_0_rgba(184,149,85,0.35)] before:content-[''] before:absolute before:top-3 before:bottom-3 before:right-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-[#B89555] before:to-transparent before:shadow-[1px_0_0_rgba(184,149,85,0.25)]">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity ml-1">
          <img src={jbjMonogramLightBg} alt="JBJ" className="w-14 h-14 object-contain shrink-0" />
          <div className="flex flex-col mt-1">
            <span className="text-[11px] font-extrabold text-[#1A1A1A] tracking-[0.13em] leading-tight whitespace-nowrap">JBJ GLOBAL</span>
            <span className="text-[9px] font-bold text-[#1A1A1A]/70 tracking-[0.16em] leading-tight mt-0.5 whitespace-nowrap">REAL ESTATE</span>
          </div>
        </Link>
      </div>

      {/* ━━━ SCROLLABLE NAV ━━━ */}
      <nav
        className="flex-1 overflow-y-auto jj-scrollbar-gold jj-scrollbar-always-visible overscroll-contain min-h-0 flex flex-col"
        style={{ scrollbarGutter: "stable" }}
      >
        {/* My Shortcuts removed — items reorganized into MY ACCOUNT section */}




        {/* ── Unified Nav Card — Highlight Hubs + Section Accordion balanced as ONE list ── */}
        <div className="px-2.5 pt-1.5 pb-3 flex-1 flex flex-col">
          {/* All categories (highlights + sections) share one flex-column with justify-between
              so spacing between AI Home Finder → MY ACCOUNT is visually balanced. */}
          <div className="flex-1 flex flex-col justify-between gap-1">
          {/* Highlight hubs (gold labels) */}
          {highlightItems.map((item, i) => {
              const hasMega = !!item.megaMenu;
              const isMenuOpen = activeMegaMenu === item.megaMenu;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href + item.label + i}
                  to={item.href}
                  onMouseEnter={() => prefetchAITool(item.href)}
                  onFocus={() => prefetchAITool(item.href)}
                  onClick={(e) => {
                    if (hasMega) handleNavClick(item.megaMenu, e);
                    else handleNavClick(undefined);
                  }}
                  data-no-contrast-guard
                  style={{ color: '#B89555' }}
                    className={`group flex items-center gap-2 px-2.5 py-[7px] text-[12px] font-semibold transition-all duration-200 !text-[#B89555] ${getItemStyle(item)}`}
                >
                  <span className="w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-200 shrink-0 border bg-[hsl(var(--gold))]/[0.06] border-[hsl(var(--gold))]/40 group-hover:bg-[hsl(var(--gold))]/15 group-hover:border-[hsl(var(--gold))]/65">
                    <Icon className="w-3 h-3" style={{ color: '#B89555' }} />
                  </span>
                  <span data-no-contrast-guard style={{ color: '#B89555' }} className="flex-1 text-left relative inline-block !text-[#B89555] after:content-[''] after:absolute after:bottom-[-3px] after:left-0 after:h-[1.5px] after:bg-[#B89555] after:rounded-full after:transition-all after:duration-300 after:w-0 group-hover:after:w-full">{item.label}</span>
                  {hasMega && (
                    <ChevronRight data-no-contrast-guard style={{ color: '#B89555' }} className={`w-3 h-3 flex-shrink-0 transition-transform ${isMenuOpen ? "rotate-90" : "opacity-60"}`} />
                  )}
                </Link>
              );
            })}

          {SECTION_KEYS.map((sectionKey, sectionIdx) => {
            if (sectionKey === 'ADMIN & OWNER' && (!isOwner || isDeveloperMode)) return null;
            if (sectionKey === 'BROKER & ACADEMY' && !isBroker && !isOwner) return null;
            if (sectionKey === 'INVESTOR' && !isInvestor && !isOwner) return null;
            const items = sectionGroups[sectionKey];
            if (!items || items.length === 0) return null;
            const isOpen = openSection === sectionKey;
            const hasActiveChild = items.some(item => isRouteActive(item.href));
            const hasMegaActive = sectionHasActiveMega(sectionKey);
            const sectionHighlighted = isOpen || hasActiveChild || hasMegaActive;
            const SectionIcon = SECTION_ICONS[sectionKey];

            return (
              <React.Fragment key={sectionKey}>
                <div id={`nav-section-${sectionKey.replace(/\s+/g, '-').toLowerCase()}`}>
                  <button
                    onClick={(e) => toggleSection(sectionKey, e)}
                    data-no-contrast-guard
                    style={{ color: '#B89555' }}
                    className="w-full flex items-center gap-2 px-2.5 py-[7px] text-[10px] uppercase tracking-[0.18em] font-bold transition-all duration-200 group"
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors border ${sectionHighlighted ? 'bg-[hsl(var(--gold))]/20 border-[hsl(var(--gold))]/70' : 'bg-[hsl(var(--gold))]/[0.06] border-[hsl(var(--gold))]/40 group-hover:bg-[hsl(var(--gold))]/15 group-hover:border-[hsl(var(--gold))]/65'}`}>
                      <SectionIcon className="w-3 h-3" style={{ color: '#B89555' }} />
                    </div>
                    <span
                      data-no-contrast-guard
                      style={{ color: '#B89555' }}
                      className="flex-1 text-left relative inline-block !text-[#B89555] after:content-[''] after:absolute after:bottom-[-3px] after:left-0 after:h-[1.5px] after:bg-[#B89555] after:rounded-full after:transition-all after:duration-300 after:w-0 group-hover:after:w-full"
                    >{sectionKey}</span>
                    <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} style={{ color: '#B89555' }} />
                    {!isOpen && hasActiveChild && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B89555] animate-pulse" />
                    )}
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-250 ease-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="ml-4 pl-2.5 border-l border-[#B89555]/15 space-y-1 pt-1 pb-1.5">
                      {sectionKey === 'TOOLS & WORKSPACE' && (
                        <>
                          <Link
                            to="/ai-hub"
                            onClick={collapseAfterNavigation}
                            data-no-contrast-guard
                            className="group flex items-center gap-2 px-2.5 py-[7px] rounded-lg text-[12px] font-bold transition-all duration-150 border border-[#B89555]/60 bg-[#FDFBF7] hover:bg-[#EFE6D6]/40"
                            style={{ color: '#1A1A1A' }}
                          >
                            <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 border border-[#B89555]/60 bg-[#EFE6D6]/40">
                              <Eye className="w-3 h-3" style={{ color: '#B89555' }} />
                            </span>
                            <span className="flex-1">View All Tools</span>
                            <ChevronRight className="w-3 h-3" style={{ color: '#B89555' }} />
                          </Link>
                          <div
                            className="my-1.5 mx-1 h-px"
                            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(184,149,85,0.35) 50%, transparent 100%)' }}
                            aria-hidden="true"
                          />
                        </>
                      )}
                      {items.map((item, i) => {
                        const hasMega = !!item.megaMenu;
                        const isMenuOpen = activeMegaMenu === item.megaMenu;
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.href + item.label + i}
                            to={item.href}
                            onMouseEnter={() => prefetchAITool(item.href)}
                            onFocus={() => prefetchAITool(item.href)}
                            onClick={(e) => {
                              // Never open the full-screen mega drop-down overlay from inside
                              // an expanded section — just navigate.
                              collapseAfterNavigation();
                              if (sectionKey === 'MY ACCOUNT') {
                                setOpenSection(null);
                              }
                            }}
                            className={`group flex items-center gap-2 px-2.5 py-[6px] rounded-lg text-[12px] font-medium transition-all duration-150 ${getItemStyle(item, sectionKey)}`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-200 shrink-0 ${getIconTileClass(item)}`}>
                              <Icon className={`w-3 h-3 ${getIconStyle(item, sectionKey)}`} />
                            </span>
                            <span className="flex-1 relative after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:h-[1.5px] after:bg-[#B89555] after:rounded-full after:transition-all after:duration-300 after:w-0 group-hover:after:w-10">{item.label}</span>
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
        </div>
      </nav>

      {/* ━━━ BOTTOM — Support + Sign Out ━━━ */}
      <div className="mt-auto flex-shrink-1">
        <div className="h-px mb-1.5 mt-0" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(184,149,85,0) 8%, rgba(184,149,85,0.4) 50%, rgba(184,149,85,0) 92%, transparent 100%)" }} aria-hidden="true" />
        <div className="px-2 py-1.5 bg-gradient-to-t from-[#F0E8D8]/50 to-transparent rounded-xl overflow-hidden">
          <div className="flex gap-1.5 mb-1">
            <Link
              to="/contact"
              data-no-contrast-guard
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold tracking-wide leading-none transition-all duration-200 px-1 py-1 rounded-lg border will-change-transform"
              style={{ color: '#1A1A1A', borderColor: '#D4B896', backgroundColor: '#F7F2EA' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FDFBF7';
                e.currentTarget.style.borderColor = '#E2C9A0';
                e.currentTarget.style.boxShadow = '0 10px 24px -10px rgba(212,184,150,0.55), 0 0 0 1px rgba(226,201,160,0.50)';
                e.currentTarget.style.transform = 'perspective(700px) rotateX(2deg) translateY(-3px) scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F7F2EA';
                e.currentTarget.style.borderColor = '#D4B896';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Headphones className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#C9A86A' }} />
              <span style={{ color: 'inherit' }}>Contact</span>
            </Link>
            <Link
              to="/ticket-hub"
              data-no-contrast-guard
              className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold tracking-wide leading-none transition-all duration-200 px-1 py-1 rounded-lg border will-change-transform"
              style={{ color: '#1A1A1A', borderColor: '#D4B896', backgroundColor: '#F7F2EA' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#FDFBF7';
                e.currentTarget.style.borderColor = '#E2C9A0';
                e.currentTarget.style.boxShadow = '0 10px 24px -10px rgba(212,184,150,0.55), 0 0 0 1px rgba(226,201,160,0.50)';
                e.currentTarget.style.transform = 'perspective(700px) rotateX(2deg) translateY(-3px) scale(1.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F7F2EA';
                e.currentTarget.style.borderColor = '#D4B896';
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <Ticket className="w-3.5 h-3.5" strokeWidth={2} style={{ color: '#C9A86A' }} />
              <span style={{ color: 'inherit' }}>Support</span>
            </Link>
          </div>
          {session ? (
            <button
              data-no-contrast-guard
              onClick={() => { supabase.auth.signOut(); }}
              className="flex items-center justify-center gap-1.5 text-[10px] font-semibold transition-all px-2 py-[4px] rounded-lg border w-full group"
              style={{ color: '#B91C1C', borderColor: 'rgba(185,28,28,0.35)', backgroundColor: 'rgba(185,28,28,0.04)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#B91C1C'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = '#B91C1C'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(185,28,28,0.04)'; e.currentTarget.style.color = '#B91C1C'; e.currentTarget.style.borderColor = 'rgba(185,28,28,0.35)'; }}
            >
              <LogOut className="w-3 h-3" style={{ color: 'inherit' }} />
              <span style={{ color: 'inherit' }}>Sign Out</span>
            </button>
          ) : (
            <Link
              to="/auth"
              data-no-contrast-guard
              className="flex items-center justify-center gap-1.5 text-[10px] font-semibold transition-all px-2 py-[4px] rounded-lg border w-full group"
              style={{ color: '#000000', borderColor: 'rgba(0,0,0,0.25)', backgroundColor: '#ffffff' }}
            >
              <User className="w-3 h-3" style={{ color: '#000000' }} />
              <span style={{ color: '#000000' }}>Sign In</span>
            </Link>
          )}

          {/* Collapse — gold pill, glow + 3D lift on hover */}
          <button
            data-no-contrast-guard
            data-sidebar-collapse-control
            onClick={toggleCollapse}
            aria-label="Collapse navigation"
            className="jbj-sidebar-collapse-control group mt-1.5 flex items-center justify-center gap-2 w-full px-3 py-[5px] rounded-lg text-[10px] font-extrabold tracking-[0.22em] uppercase transition-all duration-200 will-change-transform"
            style={{
              color: '#B89555',
              background: 'transparent',
              border: '1px solid rgba(184,149,85,0.35)',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(247,242,234,0.9), rgba(239,230,214,0.9))';
              e.currentTarget.style.borderColor = '#B89555';
              e.currentTarget.style.boxShadow = '0 10px 24px -10px rgba(184,149,85,0.7), 0 0 0 1px rgba(184,149,85,0.55), 0 0 12px rgba(184,149,85,0.35)';
              e.currentTarget.style.transform = 'perspective(700px) rotateX(2deg) translateY(-2px) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(184,149,85,0.35)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <PanelLeftClose className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2} style={{ color: '#B89555' }} />
            <span data-no-contrast-guard style={{ color: '#B89555' }}>Collapse</span>
          </button>

        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — slides in after reveal */}
      <div
        className={`h-full transition-[transform,opacity] duration-100 ease-out ${navRevealed ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
        style={{ willChange: 'transform, opacity' }}
      >
      {collapsed ? (
        <div className="hidden sm:flex w-[48px] flex-shrink-0 flex-col h-full items-center overflow-y-auto overflow-x-visible relative bg-[#FDFBF7] after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-gradient-to-b after:from-transparent after:via-[#B89555] after:to-transparent after:shadow-[1px_0_0_rgba(184,149,85,0.28)] after:pointer-events-none after:z-10">
          {/* Logo header (88px) — collapsed: just icon */}
          <div className="h-[48px] w-full shrink-0 flex items-center justify-center bg-[#FDFBF7] relative after:content-[''] after:absolute after:left-2 after:right-2 after:bottom-0 after:h-px after:bg-[#B89555]/35 after:pointer-events-none">
            <Link to="/">
              <img src={jbjMonogramLightBg} alt="JBJ" className="w-7 h-7 object-contain" />
            </Link>
          </div>
          {/* Section icons — solid champagne body, no silver cast */}
          <div className="flex-1 flex flex-col items-center pt-2 pb-2 gap-1 bg-[#FDFBF7] w-full">
            {SECTION_KEYS.map((sectionKey) => {
              if (sectionKey === 'ADMIN & OWNER' && (!isOwner || isDeveloperMode)) return null;
              if (sectionKey === 'BROKER & ACADEMY' && !isBroker && !isOwner) return null;
              if (sectionKey === 'INVESTOR' && !isInvestor && !isOwner) return null;
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
                        const firstItem = items?.[0];
                        if (firstItem?.href && firstItem.href !== '#') {
                          navigate(firstItem.href);
                        }
                      }}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 border ${
                        isActive
                          ? 'bg-[hsl(var(--gold))]/20 border-[hsl(var(--gold))]/80 shadow-sm shadow-gold/15'
                          : 'bg-[hsl(var(--gold))]/[0.06] border-[hsl(var(--gold))]/45 hover:bg-[hsl(var(--gold))]/15 hover:border-[hsl(var(--gold))]/70'
                      }`}
                    >
                      <SectionIcon className="w-3.5 h-3.5 text-[hsl(var(--gold))]" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]">{sectionKey}</TooltipContent>
                </Tooltip>
              );
            })}

            <div className="flex-1" />

            {/* Bottom pinned */}
            <div className="flex flex-col items-center gap-1 pt-1">
              <div className="h-1 mb-1" aria-hidden="true" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/contact"
                    onClick={collapseAfterNavigation}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 border bg-[hsl(var(--gold))]/[0.06] border-[hsl(var(--gold))]/45 hover:bg-[hsl(var(--gold))]/15 hover:border-[hsl(var(--gold))]/70"
                  >
                    <Headphones className="w-3.5 h-3.5 text-[hsl(var(--gold))]" strokeWidth={2} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]">Contact Us</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/ticket-hub"
                    onClick={collapseAfterNavigation}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 border bg-[hsl(var(--gold))]/[0.06] border-[hsl(var(--gold))]/45 hover:bg-[hsl(var(--gold))]/15 hover:border-[hsl(var(--gold))]/70"
                  >
                    <Ticket className="w-3.5 h-3.5 text-[hsl(var(--gold))]" strokeWidth={2} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]">Support</TooltipContent>
              </Tooltip>
              {session ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => { supabase.auth.signOut(); }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 border text-[#DC2626] border-[#DC2626]/45 bg-[#DC2626]/[0.06] hover:text-white hover:bg-[#DC2626] hover:border-[#DC2626]"
                    >
                      <LogOut className="w-3.5 h-3.5" strokeWidth={2.25} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]">Sign Out</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/auth" className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1A1A1A] hover:bg-[#EFE6D6]/10 transition-all">
                      <User className="w-3.5 h-3.5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]">Sign In</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Expand button — instant tooltip, soft pulse until first use */}
            <TooltipProvider delayDuration={0} skipDelayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    data-no-contrast-guard
                    data-sidebar-collapse-control
                    data-tour-target="sidebar-expand"
                    onClick={() => {
                      setShowExpandPulse(false);
                      try {
                        sessionStorage.setItem('jj_sidebar_expand_seen_session', '1');
                        localStorage.setItem('jj_sidebar_expand_seen', '1');
                      } catch {}
                      toggleCollapse();
                    }}
                    className="jbj-sidebar-collapse-control group relative w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 border bg-[hsl(var(--gold))]/[0.06] border-[hsl(var(--gold))]/45 hover:bg-[hsl(var(--gold))]/15 hover:border-[hsl(var(--gold))]/70"
                    aria-label="Expand navigation"
                  >
                    {/* Soft teaching pulse only — no extra visible border */}
                    {collapsed && showExpandPulse && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -inset-[4px] rounded-lg jbj-sidebar-teaching-pulse"
                      />
                    )}
                    <PanelLeftClose className="w-3.5 h-3.5 rotate-180 transition-transform duration-200 group-hover:translate-x-0.5 text-[hsl(var(--gold))]" strokeWidth={2} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={10} className="text-xs z-[10100]">
                  Expand navigation
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

          </div>
        </div>
      ) : (
        <div className="hidden sm:flex w-[200px] flex-shrink-0 bg-[#FDFBF7] h-full relative overscroll-contain [&_button>span]:!text-[#B89555] [&_button_svg]:!text-[#B89555] after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-gradient-to-b after:from-transparent after:via-[#B89555] after:to-transparent after:shadow-[1px_0_0_rgba(184,149,85,0.28)] after:pointer-events-none after:z-10">
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
