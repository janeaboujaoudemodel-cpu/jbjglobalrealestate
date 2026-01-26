import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, Heart, User, LogOut, Settings, Menu, 
  Phone, Building2, Newspaper, ClipboardCheck, FileText,
  Sparkles, Search, Users, BookOpen, ChevronDown, Briefcase, UserCircle, FolderOpen, Monitor,
  GraduationCap, BarChart3, MapPin, Award, UserPlus, Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLayoutEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BrandMonogram } from "@/components/BrandMonogram";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import { useIsTouchLayout } from "@/hooks/use-touch-layout";
import jbjMonogramDarkBg from "@/assets/jbj-monogram-dark-bg.png";
import jbjMonogramTransparent from "@/assets/jbj-monogram-transparent.png";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";

const GlobalHeader = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useLanguage();
  const isTouchLayout = useIsTouchLayout();

  // Locked rule:
  // - Desktop header (pill nav) must show on desktop-width screens.
  // - Only when the screen is reduced (below lg) do we switch to the mobile header.
  // - Touch/coarse-pointer devices always use the mobile header.
  const headerViewportRef = useRef<HTMLElement | null>(null);
  const headerContentRef = useRef<HTMLDivElement | null>(null);
  const [isDesktopWidth, setIsDesktopWidth] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 1024;
  });

  useLayoutEffect(() => {
    const getViewportWidth = () =>
      headerViewportRef.current?.clientWidth ?? window.innerWidth;

    const recompute = () => {
      setIsDesktopWidth(getViewportWidth() >= 1024);
    };

    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, []);

  const shouldUseMobileHeader = isTouchLayout || !isDesktopWidth;

  const mobileHeaderIconButtonClassName =
    "inline-flex h-7 w-7 items-center justify-center p-0 bg-transparent border-0 rounded-none appearance-none transition-colors duration-300 focus:outline-none focus-visible:outline-none focus-visible:ring-0";
  
  const { data: favorites } = useFavorites();
  const { data: shortlist } = useShortlist();
  const { favorites: guestFavorites } = useGuestFavorites();
  const { shortlist: guestShortlist } = useGuestShortlist();

  const favCount = user ? (favorites?.length || 0) : guestFavorites.length;
  const shortlistCount = user ? (shortlist?.length || 0) : guestShortlist.length;
  const totalCount = favCount + shortlistCount;

  // Check if user has CRM access (owner_admin or broker_member)
  const { data: crmProfile } = useQuery({
    queryKey: ['crm-profile-header', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('crm_users_profile')
        .select('crm_role, is_active, display_name, photo_url, job_title')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const hasCRMAccess = crmProfile?.is_active && 
    ['owner_admin', 'broker_member', 'sales_director', 'admin', 'founder'].includes(crmProfile?.crm_role || '');

  const authHref = `/auth?redirect=${encodeURIComponent(`${location.pathname}${location.search || ""}`)}`;
  const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const accountDisplayName =
    (crmProfile as any)?.display_name ||
    (typeof userMeta.full_name === "string" ? userMeta.full_name : null) ||
    (typeof userMeta.name === "string" ? userMeta.name : null) ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "My Account";
  const accountPhotoUrl =
    (crmProfile as any)?.photo_url ||
    (typeof (userMeta as any).avatar_url === "string" ? (userMeta as any).avatar_url : null) ||
    (typeof (userMeta as any).picture === "string" ? (userMeta as any).picture : null) ||
    null;

  // Properties dropdown (execution-only)
  const propertiesLinks = [
    { href: "/properties?transaction=buy", label: t('header.buyProperties') || "Buy Properties", icon: Home },
    { href: "/properties?transaction=rent", label: t('header.rentProperties') || "Rent Properties", icon: Building2 },
    { href: "/developers", label: "Developers", icon: Building2 },
    { href: "/seller-listing", label: t('header.listProperty') || "List Your Property", icon: ClipboardCheck },
  ];

  // Services dropdown
  const servicesLinks = [
    { href: "/services/buying-advisory", label: t('header.buyingAdvisory') || "Buying Advisory", icon: UserCircle },
    { href: "/services/selling-advisory", label: t('header.sellingAdvisory') || "Selling Advisory", icon: ClipboardCheck },
    { href: "/services/rental-advisory", label: t('header.rentalAdvisory') || "Rental Advisory", icon: Building2 },
    { href: "/services/investment-advisory", label: t('header.investmentAdvisory') || "Investment Advisory", icon: BarChart3 },
    { href: "/partners", label: t('header.partnerIntroductions') || "Partner Introductions", icon: Users },
  ];

  // Guides dropdown (education-only, client-facing)
  const guidesLinks = [
    { href: "/buyer-guide", label: t('guides.buyer') || "Buyer Guide", icon: FileText },
    { href: "/seller-guide", label: t('guides.seller') || "Seller Guide", icon: FileText },
    { href: "/landlord-guide", label: t('guides.landlord') || "Landlord Guide", icon: FileText },
    { href: "/tenant-guide", label: t('guides.tenant') || "Tenant Guide", icon: FileText },
    { href: "/areas", label: t('areas.title') || "Area Guides", icon: MapPin },
    { href: "/investor-education", label: t('header.investorEducation') || "Investor Education", icon: GraduationCap },
    { href: "/faq", label: t('header.generalFaq') || "General FAQ", icon: ClipboardCheck },
    { href: "/investor-faq", label: t('header.investorFaq') || "Investor FAQ", icon: ClipboardCheck },
    { href: "/broker-faq", label: t('header.brokerFaq') || "Broker FAQ", icon: ClipboardCheck },
  ];

  // Market Intelligence dropdown (data-led, descriptive)
  const marketIntelLinks = [
    { href: "/market-intelligence/overview", label: t('intelligence.overview') || "Market Overview", icon: BarChart3 },
    { href: "/market-intelligence/areas", label: t('intelligence.areas') || "Area Intelligence", icon: MapPin },
    { href: "/market-intelligence/reports", label: t('intelligence.reports') || "Market Reports", icon: FileText },
    { href: "/market-intelligence/methodology", label: t('intelligence.methodology') || "Methodology & Sources", icon: ClipboardCheck },
  ];

  // Investor Hub dropdown (tools + dashboard)
  const investorHubLinks = [
    { href: "/my-account", label: t('header.investorDashboard') || "Investor Dashboard", icon: UserCircle },
    { href: "/ai-hub", label: t('header.investorTools') || "Investor Tools", icon: Briefcase },
    { href: "/favorites", label: t('header.portfolioViews') || "Portfolio Views", icon: Heart },
    { href: "/market-intelligence/reports", label: t('header.reportsAccess') || "Reports Access", icon: FileText },
  ];

  // Broker Hub dropdown (internal)
  const brokerHubLinks = [
    { href: "/broker-dashboard", label: t('header.brokerDashboard') || "Broker Dashboard", icon: UserCircle },
    { href: "/broker-toolkit#tools", label: t('header.brokerTools') || "Broker Tools", icon: Briefcase },
    { href: "/broker-education", label: t('header.brokerEducation') || "Broker Education", icon: GraduationCap },
    { href: "/broker-resources", label: t('header.brokerResources') || "Broker Resources", icon: FolderOpen },
    { href: "/broker-faq", label: t('header.brokerFaq') || "Broker FAQ", icon: ClipboardCheck },
  ];

  // About dropdown
  const aboutLinks = [
    { href: "/about", label: t('about.title') || "About JBJ", icon: Building2 },
    { href: "/founder", label: t('nav.founder') || "Founder & Leadership", icon: UserCircle },
    { href: "/team", label: t('header.meetTeam') || "Meet the Team", icon: Users },
    { href: "/awards", label: t('awards.title') || "Awards & Recognition", icon: Award },
  ];

  // More dropdown
  const moreLinks = [
    { href: "/news", label: t('nav.news') || "News & Insights", icon: Newspaper },
    { href: "/join", label: t('nav.join') || "Join Our Team", icon: UserPlus },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Render dropdown menu helper - Premium styling with pill background
  const renderDropdown = (label: string, links: typeof propertiesLinks, isActiveCheck?: () => boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`flex items-center gap-0.5 px-2 xl:px-3 py-1.5 text-[10px] xl:text-[11px] font-bold whitespace-nowrap transition-all rounded-full ${
            isActiveCheck?.() ? 'text-gold bg-gold/15' : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
          }`}
          style={{ letterSpacing: '0.03em' }}
        >
          {label}
          <ChevronDown className="w-2.5 h-2.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        sideOffset={16}
        className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border-2 border-gold/40 min-w-[260px] shadow-2xl py-5 rounded-2xl overflow-hidden"
        style={{
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.5), 0 0 0 1px rgba(200,167,102,0.3), 0 0 60px -20px rgba(200,167,102,0.3)',
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="flex flex-col gap-2 px-3">
          {links.map((link) => (
            <DropdownMenuItem key={link.href} asChild className="p-0 focus:bg-gold/10 rounded-xl">
              <Link to={link.href} className="flex items-center gap-4 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-4 transition-all w-full group rounded-xl">
                <div 
                  className="w-9 h-9 rounded-lg bg-black/90 border border-gold/30 flex items-center justify-center transition-all group-hover:bg-black group-hover:border-gold/50"
                  style={{
                    boxShadow: '0 4px 12px -4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
                  }}
                >
                  <link.icon className="w-4 h-4 text-gold transition-colors" />
                </div>
                <span className="font-semibold text-sm">{link.label}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header
      ref={headerViewportRef}
      className="fixed top-0 left-0 right-0 z-[9999] h-20 sm:h-24 lg:h-28 overflow-visible"
    >
      {/* Ultra Premium Multi-Layer Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(8,8,8,0.99) 50%, rgba(0,0,0,1) 100%)',
        }}
      />
      
      {/* Subtle ambient gold glow at top */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-24 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center top, rgba(200,167,102,0.08) 0%, transparent 70%)',
        }}
      />
      
      {/* Premium Bottom Border - 3D Effect */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] z-10">
        {/* Main gold gradient line */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
        {/* Highlight on top */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-gold/80 to-transparent" />
      </div>
      
      {/* Inner shadow for depth */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: 'inset 0 -20px 40px -20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.03)'
        }}
      />
      
      {/* HEADER CONTENT (no cropping): desktop stays fixed; if it can't fit we switch to mobile */}
      <div
        ref={headerContentRef}
        className="relative z-10 h-full flex items-center justify-between px-4 xl:px-8 2xl:px-12"
      >
        {/* LEFT: Premium Brand Logo - LOCKED */}
        <div className="shrink-0">
          <Link 
            to="/" 
            className="flex items-center gap-3 xl:gap-4 shrink-0 group transition-all duration-300"
            style={{ fontFamily: "Poppins, sans-serif" }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative shrink-0">
              {/* Logo glow backdrop */}
              <div 
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: 'radial-gradient(circle, rgba(200,167,102,0.3) 0%, transparent 70%)',
                  transform: 'scale(1.5)',
                  filter: 'blur(10px)'
                }}
              />
              <img 
                src={jbjMonogramDarkBg} 
                alt="JBJ" 
                className="w-12 h-12 md:w-14 md:h-14 xl:w-16 xl:h-16 object-contain relative z-10"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(200,167,102,0.15))'
                }}
              />
            </div>
            {/* Premium Typography - always visible on desktop */}
            <div className="flex flex-col shrink-0">
              <span 
                className="font-bold text-sm xl:text-base tracking-[0.12em] uppercase whitespace-nowrap leading-none"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #F5F5F5 30%, #C8A766 70%, #D4AF37 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 10px rgba(200,167,102,0.3)',
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))'
                }}
              >
                JBJ Global Real Estate
              </span>
              <span 
                className="text-[9px] tracking-[0.25em] uppercase mt-1"
                style={{
                  background: 'linear-gradient(90deg, #C8A766 0%, #D4AF37 50%, #C8A766 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Excellence in Real Estate
              </span>
            </div>
          </Link>
        </div>

          {/* MOBILE HEADER: touch devices OR when desktop can't fit */}
          {shouldUseMobileHeader && (
            <div className="flex items-center gap-2 ml-auto shrink-0">
              {/* Mobile Menu Trigger - Larger hamburger */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center bg-transparent border-0 rounded-none appearance-none transition-colors duration-300 focus:outline-none group"
                    aria-label="Open menu"
                  >
                    <Menu className="w-6 h-6 text-gold group-hover:text-gold-light transition-colors" />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="bg-gradient-to-b from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-l border-gold/30 w-[320px] p-0 flex flex-col h-full pt-16"
                >
                {/* Menu Header - transparent monogram, proper spacing */}
                <div className="relative border-b border-gold/30 flex items-center gap-4 px-5 py-4 shrink-0">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  {/* Monogram - transparent background version */}
                  <img 
                    src={jbjMonogramTransparent}
                    alt="JBJ"
                    className="w-16 h-16 shrink-0 object-contain"
                  />
                  <span 
                    className="text-black font-bold text-sm tracking-[0.06em] uppercase leading-tight"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    JBJ Global Real Estate
                  </span>
                </div>

                {/* Quick Actions Row - All aligned, all black, no shadows */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gold/20">
                  <button
                    className="flex flex-col items-center gap-1.5 text-black hover:text-gold py-2 px-3 transition-colors"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSearchOpen(true);
                    }}
                  >
                    <Search className="w-5 h-5 text-black" />
                    <span className="text-[9px] text-black font-medium">Search</span>
                  </button>
                  <Link
                    to={user ? "/my-account" : authHref}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-1.5 text-black hover:text-gold py-2 px-3 transition-colors"
                  >
                    <User className="w-5 h-5 text-black" />
                    <span className="text-[9px] text-black font-medium">{user ? "My Account" : "Sign In"}</span>
                  </Link>
                  <LanguageSwitcher variant="mobile" />
                </div>

                {/* Scrollable Navigation */}
                <ScrollArea className="flex-1">
                  <nav className="flex flex-col p-4">
                    {/* 1. Home */}
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all ${
                        isActive("/")
                          ? "text-gold border-gold bg-gold/10"
                          : "text-black border-transparent hover:text-gold hover:bg-gold/5 hover:border-gold/50"
                      }`}
                    >
                      <Home className="w-4 h-4" />
                      {t('nav.home')}
                    </Link>

                    <div className="h-px bg-gold/20 my-2" />
                    
                    {/* 2. Properties */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">{t('nav.properties')}</p>
                    {propertiesLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                      >
                        <link.icon className="w-4 h-4 text-gold" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 3. Services */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">Services</p>
                    {servicesLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                      >
                        <link.icon className="w-4 h-4 text-gold" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 4. Guides */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">Guides</p>
                    {guidesLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                      >
                        <link.icon className="w-4 h-4 text-gold" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 5. Market Intel */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">Market Intel</p>
                    {marketIntelLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                      >
                        <link.icon className="w-4 h-4 text-gold" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 6. Investor Hub */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">Investor Hub</p>
                    {investorHubLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                      >
                        <link.icon className="w-4 h-4 text-gold" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 7. Broker Hub */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">Broker Hub</p>
                    {brokerHubLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                      >
                        <link.icon className="w-4 h-4 text-gold" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 8. About */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">About</p>
                    {aboutLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                      >
                        <link.icon className="w-4 h-4 text-gold" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 9. Contact */}
                    <Link
                      to="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-2 transition-all ${
                        isActive("/contact")
                          ? "text-gold border-gold bg-gold/10"
                          : "text-black border-transparent hover:text-gold hover:bg-gold/5 hover:border-gold/50"
                      }`}
                    >
                      <Phone className="w-4 h-4" />
                      Contact
                    </Link>

                    <div className="h-px bg-gold/20 my-2" />

                    {/* 10. More */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">More</p>
                    {moreLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                      >
                        <link.icon className="w-4 h-4 text-gold" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-gold/20 my-4" />

                    {/* User Section */}
                    {user ? (
                      <>
                        <div className="px-4 py-3 bg-gold/5 rounded-lg mb-2">
                          <p className="text-xs text-zinc-500 uppercase tracking-wider">Signed in as</p>
                          <p className="text-sm font-medium text-black truncate">{user.email}</p>
                        </div>
                        {hasCRMAccess && (
                          <Link
                            to="/crm"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 mt-2 text-gold hover:bg-gold/10 transition-colors rounded-lg"
                          >
                            <Users className="w-5 h-5" />
                            {t('nav.crm') || 'CRM Dashboard'}
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                          >
                            <Settings className="w-5 h-5" />
                            {t('nav.admin')}
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            signOut();
                            setMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-zinc-700 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left rounded-lg"
                        >
                          <LogOut className="w-5 h-5" />
                          {t('nav.signOut')}
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/auth"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gold hover:bg-gold/10 transition-colors rounded-lg"
                      >
                        <User className="w-5 h-5" />
                        {t('nav.signIn')}
                      </Link>
                    )}
                  </nav>
                </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          )}

          {/* DESKTOP HEADER (lg+): pill nav + right icons, never cropped */}
          {!shouldUseMobileHeader && (
            <nav className="min-w-0 flex-1 mx-4 xl:mx-6" aria-label="Primary">
              <div className="w-full overflow-x-auto">
                <div className="w-fit mx-auto">
                  <div 
                    className="flex items-center gap-0.5 xl:gap-1 rounded-full px-4 xl:px-6 py-2 border-2 border-gold/40"
                    style={{
                      background: 'linear-gradient(135deg, rgba(245,235,215,0.98) 0%, rgba(232,220,200,0.95) 50%, rgba(212,196,168,0.98) 100%)',
                      boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,167,102,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Home */}
                    <Link
                      to="/"
                      className={`px-2 xl:px-3 py-1.5 text-[10px] xl:text-[11px] font-bold whitespace-nowrap transition-all rounded-full ${
                        isActive("/") ? "text-gold bg-gold/15" : "text-zinc-800 hover:text-gold hover:bg-gold/10"
                      }`}
                      style={{ letterSpacing: '0.03em' }}
                    >
                      Home
                    </Link>

                    {renderDropdown("Properties", propertiesLinks, () => location.pathname === '/properties')}
                    {renderDropdown("Services", servicesLinks, () => location.pathname.startsWith('/services'))}
                    {renderDropdown("Guides", guidesLinks, () => 
                      ['/buyer-guide', '/seller-guide', '/landlord-guide', '/tenant-guide', '/areas', '/faq', '/investor-education', '/investor-faq', '/broker-faq'].some(p => location.pathname.startsWith(p))
                    )}
                    {renderDropdown("Market Intel", marketIntelLinks, () => 
                      location.pathname.startsWith('/market-intelligence') || location.pathname === '/market-report'
                    )}
                    {renderDropdown("Investor Hub", investorHubLinks, () => 
                      location.pathname.includes('ai-hub') || location.pathname === '/favorites'
                    )}
                    {renderDropdown("Broker Hub", brokerHubLinks, () => 
                      location.pathname.includes('broker-toolkit') || location.pathname.includes('broker-education')
                    )}
                    {renderDropdown("About", aboutLinks, () => 
                      ['/about', '/founder', '/team', '/awards'].some(p => location.pathname.startsWith(p))
                    )}

                    <Link
                      to="/contact"
                      className={`px-2 xl:px-3 py-1.5 text-[10px] xl:text-[11px] font-bold whitespace-nowrap transition-all rounded-full ${
                        isActive("/contact") ? "text-gold bg-gold/15" : "text-zinc-800 hover:text-gold hover:bg-gold/10"
                      }`}
                      style={{ letterSpacing: '0.03em' }}
                    >
                      Contact
                    </Link>

                    {renderDropdown("More", moreLinks, () => 
                      ['/news', '/join'].some(p => location.pathname.startsWith(p))
                    )}
                  </div>
                </div>
              </div>
            </nav>
          )}

          {!shouldUseMobileHeader && (
            <div 
              className="flex items-center gap-1 px-4 py-2 rounded-full border border-gold/30 shrink-0 mr-3 xl:mr-4"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.9) 100%)',
                boxShadow: '0 4px 16px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px -10px rgba(200,167,102,0.15)'
              }}
            >
              {/* Search Icon */}
              <button
                className="w-9 h-9 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-gold/10"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search 
                  className="w-5 h-5 text-gold group-hover:text-white transition-colors duration-300" 
                  style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }} 
                />
              </button>

              {/* Divider */}
              <div className="w-px h-5 bg-gradient-to-b from-transparent via-gold/40 to-transparent" />

              {/* Language Switcher */}
              <LanguageSwitcher variant="icon-only" />

              {/* Divider */}
              <div className="w-px h-5 bg-gradient-to-b from-transparent via-gold/40 to-transparent" />

              {/* Account Icon */}
              <div className="w-9 h-9 flex items-center justify-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button 
                      className="w-9 h-9 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-gold/10"
                      aria-label={user ? t('nav.myAccount') : t('nav.signIn')}
                    >
                      <User 
                        className="w-5 h-5 text-gold group-hover:text-white transition-colors duration-300" 
                        style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }} 
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    sideOffset={12}
                    className="bg-gradient-to-b from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 min-w-[280px] shadow-2xl shadow-black/30 py-3 rounded-xl overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />

                    {user ? (
                      <div className="px-5 py-3 border-b border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-gold/30">
                            <AvatarImage src={accountPhotoUrl ?? ""} alt={`${accountDisplayName} profile photo`} />
                            <AvatarFallback className="bg-black text-gold text-xs font-bold">
                              {String(accountDisplayName).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-black font-semibold text-sm truncate">{accountDisplayName}</p>
                            <p className="text-black/70 text-xs truncate">{user.email}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 py-3 border-b border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
                        <p className="text-gold font-semibold text-sm tracking-wide">{t('nav.myAccount')}</p>
                        <p className="text-black text-xs mt-1">{t('nav.signIn')}</p>
                      </div>
                    )}

                    <div className="py-2 flex flex-col gap-1 px-2">
                      {user ? (
                        <>
                          {/* Profile */}
                          <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                            <Link to="/broker-account" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                <User className="w-3.5 h-3.5 text-gold" />
                              </div>
                              <span className="font-medium text-sm">Profile</span>
                            </Link>
                          </DropdownMenuItem>
                          {/* Favorites */}
                          <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                            <Link to="/favorites" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                <Heart className="w-3.5 h-3.5 text-gold" />
                              </div>
                              <span className="font-medium text-sm">Favorites</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                          <Link to={authHref} className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                            <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                              <User className="w-3.5 h-3.5 text-gold" />
                            </div>
                            <span className="font-medium text-sm">Sign In / Create Account</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      
                      {/* Admin/Founder shortcuts */}
                      {user && (isAdmin || hasCRMAccess) && (
                        <>
                          <DropdownMenuSeparator className="bg-gold/20 my-2 mx-2" />
                          <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gold font-medium">Admin Shortcuts</p>
                          <div className="flex flex-col gap-1">
                            {/* My Assistant - Always show for admin/founder */}
                            <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                              <Link to="/founder-assistant" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                                <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                                </div>
                                <span className="font-medium text-sm">My Assistant</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            {/* Employee Hub */}
                            <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                              <Link to="/employee-hub" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                                <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                  <Briefcase className="w-3.5 h-3.5 text-gold" />
                                </div>
                                <span className="font-medium text-sm">Employee Hub</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            {/* Listing Admin */}
                            <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                              <Link to="/listing-admin" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                                <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                  <FolderOpen className="w-3.5 h-3.5 text-gold" />
                                </div>
                                <span className="font-medium text-sm">Listing Admin</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            {/* IT Department */}
                            <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                              <Link to="/it-department" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                                <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                  <Monitor className="w-3.5 h-3.5 text-gold" />
                                </div>
                                <span className="font-medium text-sm">IT Department</span>
                              </Link>
                            </DropdownMenuItem>
                            
                            {/* CRM Dashboard */}
                            {hasCRMAccess && (
                              <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                                <Link to="/crm" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                                  <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                    <Users className="w-3.5 h-3.5 text-gold" />
                                  </div>
                                  <span className="font-medium text-sm">{t('nav.crm') || 'CRM Dashboard'}</span>
                                </Link>
                              </DropdownMenuItem>
                            )}
                            
                            {/* Admin Panel */}
                            {isAdmin && (
                              <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                                <Link to="/admin" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                                  <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                    <Settings className="w-3.5 h-3.5 text-gold" />
                                  </div>
                                  <span className="font-medium text-sm">Admin Panel</span>
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    {user && (
                      <>
                        <DropdownMenuSeparator className="bg-gold/20 mx-2" />
                        <div className="py-2 px-2">
                          <DropdownMenuItem onClick={() => signOut()} className="p-0 cursor-pointer focus:bg-gold/10 rounded-lg">
                            <div className="flex items-center gap-3 text-zinc-600 hover:text-black py-2.5 px-3 transition-all w-full group rounded-lg">
                              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 flex items-center justify-center group-hover:border-gold transition-colors">
                                <LogOut className="w-3.5 h-3.5 text-black" />
                              </div>
                              <span className="font-medium text-sm text-black">{t('nav.signOut')}</span>
                            </div>
                          </DropdownMenuItem>
                        </div>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default GlobalHeader;
