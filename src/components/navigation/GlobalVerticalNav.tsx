import { Link, useLocation } from "react-router-dom";
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
import SidebarModePortalBlock from "@/components/navigation/SidebarModePortalBlock";
import { SidebarItem } from "@/components/ui/ds/SidebarItem";

import { useTeamVisibility } from "@/hooks/useTeamVisibility";
import { useCompareAccess } from "@/hooks/useCompareAccess";
import { useGatedToolAccess } from "@/hooks/useGatedToolAccess";

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
  
  { label: "AI Home Finder", href: "/ai-home-finder", icon: Home, highlight: true },
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
  { label: "CV Builder", href: "/cv-builder", icon: FileSearch },
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
  { label: "AI Tools Service", href: "/ai-hub", icon: Bot },
  { label: "Broker Certification", href: "/services/broker-certification", icon: BadgeCheck },
  { label: "Complaint Procedures", href: "/services/complaint-procedures", icon: ScrollText },
  { label: "Customer Happiness", href: "/services/customer-happiness-center", icon: SmilePlus },
  { label: "Testimonials", href: "/services/testimonials", icon: Heart },
  { label: "Referral Partner", href: "/referral-partner", icon: Handshake },

  // ── Broker & Academy ──
  { label: "Broker Portal", href: "/broker/portal", icon: BriefcaseIcon, section: "BROKER & ACADEMY", megaMenu: 'broker' },
  { label: "Broker Toolkit", href: "/broker-toolkit", icon: Wrench },
  // Broker Hub removed — duplicates Broker Portal.
  // Note: "Broker Dashboard" removed from this section — it's the user's personal dashboard, not a broker-only tool.
  { label: "JBJ Academy", href: "/jbj-academy", icon: GraduationCap },

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
  
  { label: "Company Profile", href: "/company-profile", icon: Building },
  { label: "Career Portal", href: "/join", icon: GraduationCap },

  // ── Legal ──
  { label: "Terms of Service", href: "/terms", icon: Scale, megaMenu: 'legal', section: "LEGAL" },
  { label: "Privacy Policy", href: "/privacy", icon: Lock },
  { label: "Cookie Policy", href: "/cookies", icon: Shield },
  { label: "Disclaimers", href: "/disclaimers", icon: FileText },
  { label: "Intellectual Property", href: "/intellectual-property", icon: ShieldCheck },
  { label: "AML / KYC", href: "/aml-kyc", icon: Shield },
  

  // ── Productivity ──
  { label: "Spreadsheet", href: "/spreadsheet", icon: BarChart3, section: "PRODUCTIVITY", megaMenu: 'productivity' },
  { label: "Documents", href: "/documents", icon: FileText },
  { label: "QR Generator", href: "/qr-generator", icon: QrCode },
  { label: "Contract Forms", href: "/contract-forms", icon: FileSignature },
  { label: "Video Meeting", href: "/video-meeting", icon: Video },
  // { label: "Presentations", href: "/presentations", icon: Presentation }, // REMOVED — broken tool retired per owner directive
  { label: "Sitemap", href: "/sitemap", icon: MapPin },
  { label: "Pricing", href: "/pricing", icon: DollarSign },
  { label: "Onboarding", href: "/onboarding", icon: UserPlus },
  { label: "Client Portal", href: "/client-portal", icon: Users },
  { label: "Meeting Center", href: "/meeting-center", icon: Users },

  // ── Account ──
  { label: "My Dashboard", href: "/my-dashboard", icon: LayoutDashboard, section: "MY ACCOUNT", megaMenu: 'account' },
  { label: "Billing & Subscriptions", href: "/account/billing", icon: CreditCard },
  { label: "Brand Update", href: "/my-dashboard#brand-update", icon: Palette },
  { label: "My Tasks", href: "/my-dashboard#tasks", icon: ListChecks },
  { label: "Notifications", href: "/my-dashboard#notifications", icon: Bell },
  { label: "Inbox", href: "/my-dashboard#inbox", icon: Inbox },
  { label: "My Calendar", href: "/ai-calendar", icon: CalendarClock },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Shortlisted", href: "/favorites?tab=shortlist", icon: Star },
  { label: "Saved Filters", href: "/favorites?tab=saved-filters", icon: Sparkles },
  { label: "Settings", href: "/profile?tab=settings", icon: Settings },
  { label: "My Tickets", href: "/my-tickets", icon: Ticket },


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
  { label: "News Admin Hub", href: "/owner/news", icon: Megaphone },
  { label: "Books Library", href: "/owner/books", icon: BookOpen },
  { label: "Market Data Ingestion", href: "/owner/market-intel", icon: Database },
  { label: "AI Governance", href: "/governance/ai", icon: Shield },
];

const PUBLIC_TOOLS_WORKSPACE_ITEMS: NavItem[] = [
  { label: "AI Home Finder", href: "/ai-home-finder", icon: Home, section: "TOOLS" },
  { label: "Property Comparison", href: "/compare", icon: GitCompare },
  { label: "Mortgage Calculator", href: "/mortgage-calculator", icon: Calculator },
  { label: "Property Evaluator", href: "/property-evaluator", icon: BarChart3 },
  { label: "Rental Index", href: "/rental-index", icon: TrendingUp },
  { label: "Property Measurement", href: "/property-measurement", icon: Ruler },
  { label: "Interior Design AI", href: "/interior-design-ai", icon: Palette },
  { label: "Business Card Scanner", href: "/business-card-scanner", icon: ScanLine },
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
    { label: 'JBJ Academy', icon: BookOpen, href: '/jbj-academy' },
  ],
  guides: [
    { label: 'Buyer Guide', icon: FileText, href: '/buyer-guide' },
    { label: 'Seller Guide', icon: FileText, href: '/seller-guide' },
    { label: 'Rent Guide', icon: FileText, href: '/rent-guide' },
    { label: "Tenant Guide", icon: FileText, href: '/tenant-guide' },
    { label: "Landlord Guide", icon: FileText, href: '/landlord-guide' },
    { label: 'Investor Education', icon: BookOpen, href: '/investor-education' },
    { label: 'JBJ Academy', icon: BookOpen, href: '/jbj-academy' },
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
    { label: 'The Founder', icon: User, href: '/founder' },
    { label: 'Contact Us', icon: Phone, href: '/contact' },
    { label: 'Careers', icon: GraduationCap, href: '/join' },
    { label: 'JBJ Email', icon: Mail, href: '/crm/employees' },
    
    { label: 'Testimonials', icon: Heart, href: '/services/testimonials' },
  ],
  legal: [
    { label: 'Terms of Service', icon: Scale, href: '/terms' },
    { label: 'Privacy Policy', icon: Lock, href: '/privacy' },
    { label: 'Cookie Policy', icon: Shield, href: '/cookies' },
    { label: 'Disclaimers', icon: FileText, href: '/disclaimers' },
    { label: 'Intellectual Property', icon: ShieldCheck, href: '/intellectual-property' },
    { label: 'AML / KYC', icon: Shield, href: '/aml-kyc' },
  ],
  'ai-tools': [
    { label: 'AI Home Finder', icon: Home, href: '/ai-home-finder' },
    { label: 'Property Comparison', icon: GitCompare, href: '/compare' },
    { label: 'Mortgage Calculator', icon: Calculator, href: '/mortgage-calculator' },
    { label: 'Rental Index', icon: TrendingUp, href: '/rental-index' },
    { label: 'Property Evaluator', icon: BarChart3, href: '/property-evaluator' },
    { label: 'List Property for Sale', icon: ClipboardCheck, href: '/list-property?purpose=sale&mode=manual' },
    { label: 'List Property for Rent', icon: Key, href: '/list-property?purpose=rent&mode=manual' },
  ],
  creative: [
    { label: 'AI Home Finder', icon: Home, href: '/ai-home-finder' },
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
    { label: 'Broker Portal', icon: BriefcaseIcon, href: '/broker/portal' },
    { label: 'Broker Toolkit', icon: Wrench, href: '/broker-toolkit' },
    { label: 'JBJ Academy', icon: GraduationCap, href: '/jbj-academy' },
    { label: 'Broker Dashboard', icon: LayoutDashboard, href: '/broker-dashboard' },
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
    // { label: 'Presentations', icon: Presentation, href: '/presentations' }, // REMOVED — broken tool retired
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
  "MY ACCOUNT",
  "PROPERTIES",
  "INSIGHTS & GUIDES",
  "SERVICES",
  "BROKER & ACADEMY",
  "INVESTOR",
  "COMPANY & LEGAL",
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
  const { isInvestor, isOwner } = useUserRole();
  const { isDeveloperMode, isBrokerMode, isInvestorMode } = useUserModeContext();
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuKey | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [, setMobileOpen] = useState(false);
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

  const showBrokerSurfaces = isBrokerMode;
  const showInvestorSurfaces = isInvestorMode || isInvestor || isOwner;
  const { isPageVisible: isTeamPageVisible } = useTeamVisibility();
  const { allowed: canCompare } = useCompareAccess();
  const { visible: canSeeCardScanner } = useGatedToolAccess("business-card-scanner");

  const shouldShowItem = useCallback((item: NavItem, sectionKey?: SectionKey | null) => {
    // Team page is hidden by default — only shows when owner flips the visibility toggle in Founder Settings.
    if (item.href === "/team" && !isTeamPageVisible) return false;
    // Property Comparison + Business Card Scanner are broker/owner only — hidden from investor/developer.
    if (item.href === "/compare" && !canCompare) return false;
    if (item.href === "/business-card-scanner" && !canSeeCardScanner) return false;
    if (!showBrokerSurfaces && !isOwner) {
      if (item.href === "/join") return false;
      if (sectionKey === "BROKER & ACADEMY") return false;
      if (item.href.startsWith("/broker") || item.href === "/broker-toolkit" || item.href === "/jbj-academy") return false;
      if (item.label === "Career Portal") return false;
    }
    if (!showInvestorSurfaces && sectionKey === "INVESTOR") return false;
    return true;
  }, [showBrokerSurfaces, showInvestorSurfaces, isTeamPageVisible, isOwner, canCompare, canSeeCardScanner]);

  const shouldShowSection = useCallback((sectionKey: SectionKey) => {
    if (sectionKey === 'ADMIN & OWNER' && (!isOwner || isDeveloperMode)) return false;
    if (sectionKey === 'BROKER & ACADEMY' && !showBrokerSurfaces && !isOwner) return false;
    if (sectionKey === 'INVESTOR' && !showInvestorSurfaces) return false;
    return true;
  }, [isDeveloperMode, isOwner, showBrokerSurfaces, showInvestorSurfaces]);

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

  const closeMegaMenu = useCallback(() => setActiveMegaMenu(null), []);

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
        if (shouldShowItem(item, null)) highlights.push(item);
        continue;
      }
      if (item.section) {
        const mapped = SECTION_ALIAS[item.section];
        if (mapped) {
          currentSection = mapped;
          if (!sections[currentSection]) sections[currentSection] = [];
        }
      }
      if (currentSection && shouldShowItem(item, currentSection)) {
        sections[currentSection].push(item);
      }
    }
    sections["TOOLS & WORKSPACE"] = PUBLIC_TOOLS_WORKSPACE_ITEMS.filter(it => shouldShowItem(it, "TOOLS & WORKSPACE"));
    return { highlightItems: highlights, sectionGroups: sections };
  }, [shouldShowItem]);

  // Close mega menu on route change. Only auto-open a section if the
  // current route matches a child item — never force "MY ACCOUNT" open
  // by default on home. The user must click to expand.
  useEffect(() => {
    closeMegaMenu();
    setMobileOpen(false);
    for (const [section, items] of Object.entries(sectionGroups)) {
      if (items.some(item => isRouteActive(item.href))) {
        setOpenSection(section as SectionKey);
        return;
      }
    }
  }, [location.pathname, closeMegaMenu, sectionGroups]);

  // Auto-open is now handled by the route-change effect above

  const passSidebarBoundaryWheelToPage = useCallback((event: React.WheelEvent<HTMLElement>) => {
    const target = event.currentTarget;
    const hasLocalScroll = target.scrollHeight > target.clientHeight + 2;
    const atTop = target.scrollTop <= 0;
    const atBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 2;
    const goingUp = event.deltaY < 0;
    const goingDown = event.deltaY > 0;

    // Fixed desktop chrome must never trap the page. If the sidebar has no
    // local scroll room, or it is already at the edge in the wheel direction,
    // pass the exact native wheel delta to the document once. No boosting.
    if (!hasLocalScroll || (goingUp && atTop) || (goingDown && atBottom)) {
      event.preventDefault();
      window.scrollBy({ top: event.deltaY, left: 0, behavior: "auto" });
    }
  }, []);

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

    if (
      item.href === '/join' ||
      item.href === '/ai-home-finder' ||
      (item.href === '/list-property' && item.highlight) ||
      item.href === '/resale-properties'
    ) {
      return shouldHighlight ? "font-bold text-[#1A1A1A]" : "font-semibold text-[#1A1A1A]";
    }

    return shouldHighlight
      ? "text-[#1A1A1A] font-bold"
      : (sectionKey ? "text-[#1A1A1A] font-medium" : "text-[#1A1A1A]");
  };

  const getIconTileClass = (_item?: NavItem) =>
    'bg-[image:var(--jj-emerald-ombre)] border border-white/20 shadow-[0_8px_18px_-12px_rgba(6,78,59,0.65),inset_0_1px_0_rgba(255,255,255,0.18)]';


  const getIconStyle = () => 'text-white';

  const lockEmeraldGlyphWhite = useCallback((el: SVGSVGElement | null) => {
    if (!el) return;
    el.style.setProperty('color', '#FFFFFF', 'important');
    el.style.setProperty('stroke', '#FFFFFF', 'important');
    el.style.setProperty('-webkit-text-fill-color', '#FFFFFF', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.querySelectorAll('path, line, polyline, polygon, rect, circle, ellipse, use, g').forEach((part) => {
      const svgPart = part as SVGElement;
      svgPart.style.setProperty('color', '#FFFFFF', 'important');
      svgPart.style.setProperty('stroke', '#FFFFFF', 'important');
      svgPart.style.setProperty('opacity', '1', 'important');
    });
  }, []);

  const navHoverUnderline = "group-hover:!text-[#0A0A0A] after:content-[''] after:absolute after:left-0 after:rounded-full after:transition-all after:duration-300 after:w-0 group-hover:after:w-full after:bg-[#0A0A0A]";
  const subNavHoverUnderline = "group-hover:!text-[#0A0A0A] after:content-[''] after:absolute after:left-0 after:rounded-full after:transition-all after:duration-300 after:w-0 group-hover:after:w-[50%] after:bg-[#0A0A0A]";




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
                  data-sidebar-view-all-tools
                  data-emerald-action="true"
                  data-surface="emerald"
                  data-emerald="true"
                  className="jj-emerald-action flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-bold transition-all border border-transparent"
                  style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
                >
                  <Eye className="w-4 h-4 flex-shrink-0" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
                  <span className="flex-1" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>{viewAllLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
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
    const links = (MEGA_MENU_LINKS[activeMegaMenu] || []).filter((link) => shouldShowItem(link as NavItem, null));
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
    <div data-sidebar-emerald className="flex flex-col h-full">
      {/* ━━━ LOGO HEADER (88px) — clean, no collapse control ━━━ */}
      <div className="h-[88px] shrink-0 flex flex-row items-center px-2.5 bg-gradient-to-b from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] relative before:content-[''] before:absolute before:top-3 before:bottom-3 before:right-0 before:w-px before:bg-gradient-to-b before:from-transparent before:via-[#B89555] before:to-transparent before:shadow-[1px_0_0_rgba(184,149,85,0.25)] after:content-[''] after:absolute after:left-3 after:right-3 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[#B89555] after:to-transparent">
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
        onWheel={passSidebarBoundaryWheelToPage}
        className="flex-1 overflow-y-auto jj-scrollbar-gold jj-scrollbar-always-visible overscroll-contain min-h-0 flex flex-col"
        style={{ scrollbarGutter: "stable" }}
      >
        {/* My Shortcuts removed — items reorganized into MY ACCOUNT section */}




        {/* ── Unified Nav Card — Highlight Hubs + Section Accordion balanced as ONE list ── */}
        <div className="px-2.5 pt-1.5 pb-3 flex-1 flex flex-col">
          {/* Mode portal pinned above the highlight hubs (above AI Home Finder) */}
          {!collapsed && <SidebarModePortalBlock />}
          {/* All categories (highlights + sections) share one flex-column with justify-between
              so spacing between AI Home Finder → MY ACCOUNT is visually balanced. */}
          <div className="flex-1 flex flex-col justify-between gap-1">
          {/* Highlight hubs (gold labels) */}

          {highlightItems.map((item, i) => {
              const hasMega = !!item.megaMenu;
              const isMenuOpen = activeMegaMenu === item.megaMenu;
              const routeActive = isRouteActive(item.href);
              const highlightActive = activeMegaMenu ? isMenuOpen : routeActive;
              const Icon = item.icon;
              return (
                <SidebarItem
                  key={item.href + item.label + i}
                  preserveVisual
                  to={item.href}
                  icon={Icon}
                  iconRef={lockEmeraldGlyphWhite}
                  label={item.label}
                  active={highlightActive}
                  onMouseEnter={() => prefetchAITool(item.href)}
                  onFocus={() => prefetchAITool(item.href)}
                  onClick={(e) => {
                    if (hasMega) handleNavClick(item.megaMenu, e as React.MouseEvent<HTMLAnchorElement>);
                    else handleNavClick(undefined);
                  }}
                  data-no-contrast-guard
                  data-sidebar-highlight
                  data-active={highlightActive ? 'true' : undefined}
                  aria-current={highlightActive ? 'page' : undefined}
                  className={`group flex items-center gap-2.5 px-2.5 h-10 text-[12px] transition-all duration-200 rounded-lg ${highlightActive ? '' : 'hover:bg-[#1A1A1A]/[0.045]'} ${getItemStyle(item)}`}
                  style={highlightActive ? { backgroundImage: 'var(--jj-emerald-ombre)', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}
                  iconWrapperData={{ 'data-sidebar-highlight-tile': true, 'data-emerald-icon-surface': true }}
                  iconWrapperClassName="w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-200 shrink-0"
                  iconClassName="w-[18px] h-[18px] transition-colors"
                  iconStrokeWidth={2.1}
                  iconData={{ 'data-sidebar-highlight-icon': true }}
                  labelClassName="flex-1 text-left relative inline-block transition-colors duration-200"
                  labelStyle={highlightActive ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } : undefined}
                  trailing={hasMega ? <ChevronRight data-no-contrast-guard data-sidebar-highlight-chev className={`w-4 h-4 flex-shrink-0 transition-transform ${isMenuOpen ? "rotate-90 opacity-100" : "opacity-60"}`} style={highlightActive ? { color: '#FFFFFF', stroke: '#FFFFFF' } : undefined} /> : undefined}
                  trailingClassName="ml-0"
                />


              );
            })}

          {SECTION_KEYS.map((sectionKey, sectionIdx) => {
            if (!shouldShowSection(sectionKey)) return null;
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
                  <SidebarItem
                    preserveVisual
                    asButton
                    icon={SectionIcon}
                    iconRef={lockEmeraldGlyphWhite}
                    label={sectionKey}
                    active={sectionHighlighted}
                    onClick={(e) => toggleSection(sectionKey, e as React.MouseEvent)}
                    data-sidebar-section
                    data-active={sectionHighlighted ? 'true' : undefined}
                    data-no-contrast-guard
                    style={{
                      color: sectionHighlighted ? '#FFFFFF' : '#1A1A1A',
                      WebkitTextFillColor: sectionHighlighted ? '#FFFFFF' : '#1A1A1A',
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 h-10 text-[10px] uppercase tracking-[0.18em] font-bold transition-all duration-200 group hover:bg-[#EFE6D6]/35 rounded-lg"
                    iconWrapperData={{ 'data-emerald-icon-surface': true }}
                    iconWrapperClassName={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${getIconTileClass()}`}
                    iconClassName="w-[18px] h-[18px] transition-colors"
                    iconStrokeWidth={2.1}
                    iconData={{ 'data-sidebar-section-icon': true }}
                    iconStyle={{ color: '#FFFFFF', stroke: '#FFFFFF' }}
                    labelData={{ 'data-sidebar-section-label': true, 'data-no-contrast-guard': true }}
                    labelClassName={`flex-1 text-left relative inline-block transition-colors duration-200 after:bottom-[-3px] after:h-[1.5px] ${navHoverUnderline}`}
                    labelStyle={{
                      color: sectionHighlighted ? '#FFFFFF' : '#1A1A1A',
                      WebkitTextFillColor: sectionHighlighted ? '#FFFFFF' : '#1A1A1A',
                      background: 'none',
                      backgroundImage: 'none',
                    }}
                    trailing={(
                      <>
                        <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${isOpen ? '' : '-rotate-90'}`} style={{ color: sectionHighlighted ? '#FFFFFF' : '#1A1A1A', stroke: sectionHighlighted ? '#FFFFFF' : '#1A1A1A' }} />
                        {!isOpen && hasActiveChild && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B89555] animate-pulse" />
                        )}
                      </>
                    )}
                    trailingClassName="ml-0"
                  />



                  <div
                    className={`overflow-hidden transition-all duration-250 ease-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    <div className="ml-4 pl-2.5 border-l border-[#B89555]/15 space-y-1 pt-1 pb-1.5">
                      {sectionKey === 'TOOLS & WORKSPACE' && (
                        <SidebarItem
                          preserveVisual
                          to="/ai-hub"
                          icon={Eye}
                          iconRef={lockEmeraldGlyphWhite}
                          label="View All Tools"
                          onClick={collapseAfterNavigation}
                          data-sidebar-subitem
                          data-no-contrast-guard
                          className="group flex items-center gap-2.5 px-2.5 min-h-10 rounded-lg text-[12px] font-medium transition-all duration-150 hover:bg-[#EFE6D6]/40"
                          style={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}
                          iconWrapperData={{ 'data-emerald-icon-surface': true }}
                          iconWrapperClassName={`w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-200 shrink-0 ${getIconTileClass()}`}
                          iconClassName="w-[18px] h-[18px]"
                          iconStrokeWidth={2.1}
                          iconStyle={{ color: '#FFFFFF', stroke: '#FFFFFF' }}
                          labelData={{ 'data-sidebar-subitem-label': true }}
                          labelClassName="flex-1"
                          labelStyle={{ color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}
                        />
                      )}
                      {items.map((item, i) => {
                        const hasMega = !!item.megaMenu;
                        const isMenuOpen = activeMegaMenu === item.megaMenu;
                        const subitemActive = activeMegaMenu ? isMenuOpen : isRouteActive(item.href);
                        const Icon = item.icon;
                        const needsAccountDivider = sectionKey === 'MY ACCOUNT' && ['Favorites', 'Shortlisted', 'My Design'].includes(item.label);
                        return (
                          <React.Fragment key={item.href + item.label + i}>
                            <SidebarItem
                              preserveVisual
                              to={item.href}
                              icon={Icon}
                              iconRef={lockEmeraldGlyphWhite}
                              label={item.label}
                              active={subitemActive}
                              onMouseEnter={() => prefetchAITool(item.href)}
                              onFocus={() => prefetchAITool(item.href)}
                              onClick={() => {
                                // Never open the full-screen mega drop-down overlay from inside
                                // an expanded section — just navigate.
                                collapseAfterNavigation();
                                if (sectionKey === 'MY ACCOUNT') {
                                  setOpenSection('MY ACCOUNT');
                                }
                              }}
                              data-sidebar-subitem
                              data-active={subitemActive ? 'true' : undefined}
                              aria-current={subitemActive ? 'page' : undefined}
                              data-no-contrast-guard
                              className={`group flex items-center gap-2.5 px-2.5 min-h-10 rounded-lg text-[12px] transition-all duration-150 ${subitemActive ? 'font-semibold' : 'font-medium hover:bg-[#1A1A1A]/[0.045]'}`}
                              style={subitemActive
                                ? { backgroundImage: 'var(--jj-emerald-ombre)', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }
                                : { color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}
                              iconWrapperData={{ 'data-emerald-icon-surface': true }}
                              iconWrapperClassName={`w-7 h-7 rounded-md flex items-center justify-center transition-colors duration-200 shrink-0 ${getIconTileClass(item)}`}
                              iconClassName="w-[18px] h-[18px] transition-colors"
                              iconStrokeWidth={2.1}
                              iconData={{ 'data-sidebar-subitem-icon': true }}
                              iconStyle={{ color: '#FFFFFF', stroke: '#FFFFFF' }}
                              labelData={{ 'data-sidebar-subitem-label': true }}
                              labelClassName="flex-1 relative transition-colors"
                              labelStyle={{ color: subitemActive ? '#FFFFFF' : '#1A1A1A', WebkitTextFillColor: subitemActive ? '#FFFFFF' : '#1A1A1A' }}
                            />
                            {needsAccountDivider && (
                              <div className="my-1 mx-2 h-px bg-gradient-to-r from-transparent via-[#047857]/45 to-transparent" aria-hidden="true" />
                            )}
                          </React.Fragment>
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
            {(() => {
              const contactActive = isRouteActive('/contact');
              const supportActive = isRouteActive('/ticket-hub');
              return (
                <>
                  <Link
                    to="/contact"
                    data-no-contrast-guard
                    data-sidebar-bottom-cta
                    data-active={contactActive ? 'true' : undefined}
                    aria-current={contactActive ? 'page' : undefined}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold tracking-wide leading-none transition-all duration-200 px-1 py-1 rounded-lg border will-change-transform"
                  >
                    <span data-emerald-icon-surface className="w-5 h-5 rounded-md flex items-center justify-center">
                      <Headphones className="w-3 h-3" strokeWidth={2.2} />
                    </span>
                    <span>Contact</span>
                  </Link>
                  <Link
                    to="/ticket-hub"
                    data-no-contrast-guard
                    data-sidebar-bottom-cta
                    data-active={supportActive ? 'true' : undefined}
                    aria-current={supportActive ? 'page' : undefined}
                    className="flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold tracking-wide leading-none transition-all duration-200 px-1 py-1 rounded-lg border will-change-transform"
                  >
                    <span data-emerald-icon-surface className="w-5 h-5 rounded-md flex items-center justify-center">
                      <Ticket className="w-3 h-3" strokeWidth={2.2} />
                    </span>
                    <span>Support</span>
                  </Link>
                </>
              );
            })()}

          </div>
          {session ? (
            <button
              data-signout-action
              data-no-contrast-guard
              onClick={() => { supabase.auth.signOut(); }}
              className="flex items-center justify-center gap-1.5 text-[10px] font-semibold transition-all px-2 py-[4px] rounded-lg border w-full group"
              style={{ color: '#DC2626', borderColor: '#B89555', backgroundColor: '#FDFBF7' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#DC2626'; (e.currentTarget.querySelector('[data-signout-icon]') as HTMLElement | null)?.style.setProperty('color', '#DC2626', 'important'); (e.currentTarget.querySelector('[data-signout-icon]') as HTMLElement | null)?.style.setProperty('stroke', '#DC2626', 'important'); }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FDFBF7'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#B89555'; (e.currentTarget.querySelector('[data-signout-icon]') as HTMLElement | null)?.style.setProperty('color', '#DC2626'); (e.currentTarget.querySelector('[data-signout-icon]') as HTMLElement | null)?.style.setProperty('stroke', '#DC2626'); }}
            >
              <LogOut data-signout-icon data-no-contrast-guard className="w-3 h-3 jj-signout-icon !text-[#DC2626]" color="#DC2626" stroke="#DC2626" strokeWidth={2.25} style={{ color: '#DC2626', stroke: '#DC2626' }} />
              <span data-signout-label className="!text-[#DC2626]" style={{ color: '#DC2626' }}>Sign Out</span>
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
            data-sidebar-collapse-control
            data-on-dark
            data-allow-dark-cta
            onClick={toggleCollapse}
            aria-label="Collapse navigation"
            className="allow-white jbj-sidebar-collapse-control group mt-1.5 flex items-center justify-center gap-2 w-full px-3 py-[5px] rounded-lg text-[10px] font-extrabold tracking-[0.22em] uppercase transition-all duration-200 will-change-transform"
            style={{
              color: '#FFFFFF',
              background: 'var(--jj-emerald-ombre)',
              border: '1px solid rgba(255,255,255,0.22)',
              boxShadow: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--jj-emerald-ombre-hover)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)';
              e.currentTarget.style.boxShadow = '0 10px 24px -10px rgba(4,120,87,0.70), 0 0 0 1px rgba(52,211,153,0.42), 0 0 12px rgba(52,211,153,0.30)';
              e.currentTarget.style.transform = 'perspective(700px) rotateX(2deg) translateY(-2px) scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--jj-emerald-ombre)';
              e.currentTarget.style.color = '#FFFFFF';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <PanelLeftClose className="allow-white w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" strokeWidth={2} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            <span className="allow-white" data-on-dark style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>Collapse</span>
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
        <div onWheel={passSidebarBoundaryWheelToPage} className="hidden sm:flex w-[48px] flex-shrink-0 flex-col h-full items-center overflow-y-auto overflow-x-visible relative bg-gradient-to-b from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-gradient-to-b after:from-transparent after:via-[#B89555] after:to-transparent after:shadow-[1px_0_0_rgba(184,149,85,0.28)] after:pointer-events-none after:z-10">
          {/* Logo header (88px) — collapsed: just icon */}
          {/* Logo header — MUST match expanded (88px) so the under-monogram divider lines up exactly with the horizontal header hairline */}
          <div className="h-[48px] w-full shrink-0 flex items-center justify-center bg-gradient-to-b from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] relative after:content-[''] after:absolute after:left-2 after:right-2 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-[#B89555] after:to-transparent">
            <Link to="/">
              <img src={jbjMonogramLightBg} alt="JBJ" className="w-7 h-7 object-contain" />
            </Link>
          </div>

          {/* Section icons — emerald-ombre tiles with white icons */}
          <style>{`
            .jj-side-tile {
              background: var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%)) !important;
              border: 1px solid rgba(255,255,255,0.22) !important;
              color: #FFFFFF !important;
              box-shadow: 0 8px 18px -12px rgba(6,78,59,0.85), inset 0 1px 0 rgba(255,255,255,0.16) !important;
              transition: transform 180ms ease, box-shadow 180ms ease !important;
            }
            .jj-side-tile svg,
            .jj-side-tile svg * { color: #FFFFFF !important; stroke: #FFFFFF !important; transition: color 180ms ease, stroke 180ms ease !important; }
            .jj-side-tile:hover { background: var(--jj-emerald-ombre-hover, linear-gradient(135deg, #0A6B53 0%, #064E3B 52%, #031B12 100%)) !important; transform: translateY(-1px) !important; box-shadow: 0 10px 22px -10px rgba(4,120,87,0.70), 0 0 0 1px rgba(52,211,153,0.42), inset 0 1px 0 rgba(255,255,255,0.24) !important; }
            .jj-side-tile.is-active { box-shadow: 0 0 0 2px rgba(16,185,129,0.55), 0 2px 8px rgba(4,120,87,0.45), inset 0 1px 0 rgba(255,255,255,0.22) !important; }
          `}</style>
          <div className="flex-1 flex flex-col items-center pt-2 pb-2 gap-1 w-full">
            {highlightItems.map((item, i) => {
              const Icon = item.icon;
              const isActive = isRouteActive(item.href);
              return (
                <Tooltip key={item.href + item.label + i}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      onClick={collapseAfterNavigation}
                      data-no-contrast-guard
                      className={`jj-side-tile group w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'is-active' : ''}`}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2.25} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]">{item.label}</TooltipContent>
                </Tooltip>
              );
            })}


            {SECTION_KEYS.map((sectionKey) => {
              if (!shouldShowSection(sectionKey)) return null;
              const SectionIcon = SECTION_ICONS[sectionKey];
              const items = sectionGroups[sectionKey];
              if (!items || items.length === 0) return null;
              const hasActiveChild = items?.some(item => isRouteActive(item.href)) || false;
              const hasMegaActive = sectionHasActiveMega(sectionKey);
              const isActive = hasActiveChild || hasMegaActive;

              return (
                <Tooltip key={sectionKey}>
                  <TooltipTrigger asChild>
                    <button
                      data-no-contrast-guard
                      onClick={() => {
                        setCollapsed(false);
                        try { localStorage.setItem('jj_nav_collapsed', '0'); } catch {}
                        setOpenSection(sectionKey);
                        setActiveMegaMenu(null);
                      }}
                      className={`jj-side-tile group w-9 h-9 rounded-xl flex items-center justify-center ${isActive ? 'is-active' : ''}`}
                    >
                      <SectionIcon className="w-5 h-5" strokeWidth={2.25} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]">{sectionKey}</TooltipContent>
                </Tooltip>
              );
            })}

            <div className="flex-1" />

            {/* Bottom pinned */}
            <div className="flex flex-col items-center gap-1 pt-1 w-full">
              <div className="h-px w-7 mb-2 bg-gradient-to-r from-transparent via-[#B89555] to-transparent" aria-hidden="true" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/contact"
                    onClick={collapseAfterNavigation}
                    data-no-contrast-guard
                    className="jj-side-tile group w-9 h-9 rounded-xl flex items-center justify-center"
                  >
                    <Headphones className="w-5 h-5" strokeWidth={2.25} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]">Contact Us</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/ticket-hub"
                    onClick={collapseAfterNavigation}
                    data-no-contrast-guard
                    className="jj-side-tile group w-9 h-9 rounded-xl flex items-center justify-center"
                  >
                    <Ticket className="w-5 h-5" strokeWidth={2.25} />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]">Support</TooltipContent>
              </Tooltip>


              {session ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      data-signout-action
                      onClick={() => { supabase.auth.signOut(); }}
                      data-no-contrast-guard
                      className="group w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 border border-[#B89555] bg-[#FDFBF7] hover:bg-[#FEE2E2] hover:border-[#DC2626]"
                    >
                      <LogOut data-signout-icon data-no-contrast-guard className="w-5 h-5 jj-signout-icon !text-[#DC2626]" color="#DC2626" stroke="#DC2626" strokeWidth={2.25} style={{ color: '#DC2626', stroke: '#DC2626' }} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8} className="text-xs z-[10100]" style={{ color: '#DC2626' }}>Sign Out</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link to="/auth" data-no-contrast-guard className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[hsl(var(--gold))]/10 transition-all">
                      <User className="w-5 h-5 text-[hsl(var(--gold))]" />
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
                    data-sidebar-collapse-control
                    data-on-dark
                    data-allow-dark-cta
                    data-tour-target="sidebar-expand"
                    onClick={() => {
                      setShowExpandPulse(false);
                      try {
                        sessionStorage.setItem('jj_sidebar_expand_seen_session', '1');
                        localStorage.setItem('jj_sidebar_expand_seen', '1');
                      } catch {}
                      toggleCollapse();
                    }}
                    className="jbj-sidebar-collapse-control jj-side-tile group relative w-9 h-9 rounded-xl flex items-center justify-center"
                    aria-label="Expand navigation"
                  >
                    {/* Soft teaching pulse only — no extra visible border */}
                    {collapsed && showExpandPulse && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -inset-[4px] rounded-lg jbj-sidebar-teaching-pulse"
                      />
                    )}
                    <PanelLeftClose className="allow-white w-4 h-4 rotate-180 transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2.15} style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
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
        <div className="hidden sm:flex w-[200px] flex-shrink-0 bg-gradient-to-b from-[#F7F2EA] via-[#EFE6D6] to-[#F7F2EA] h-full relative overscroll-contain after:content-[''] after:absolute after:top-0 after:bottom-0 after:right-0 after:w-px after:bg-gradient-to-b after:from-transparent after:via-[#B89555] after:to-transparent after:shadow-[1px_0_0_rgba(184,149,85,0.28)] after:pointer-events-none after:z-10">
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
