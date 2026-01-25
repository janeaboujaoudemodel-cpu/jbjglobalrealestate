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
  GraduationCap, BarChart3, MapPin, Award, UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
import { BrandMonogram } from "@/components/BrandMonogram";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import jbjMonogramDarkBg from "@/assets/jbj-monogram-dark-bg.png";
import jbjMonogramTransparent from "@/assets/jbj-monogram-transparent.png";
import jbjMonogramNobuffer from "@/assets/jbj-monogram-nobuffer.png";

const GlobalHeader = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useLanguage();

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
        .select('crm_role, is_active')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
    enabled: !!user?.id,
  });

  const hasCRMAccess = crmProfile?.is_active && 
    ['owner_admin', 'broker_member', 'sales_director', 'admin', 'founder'].includes(crmProfile?.crm_role || '');

  // Properties dropdown (execution-only)
  const propertiesLinks = [
    { href: "/properties?transaction=buy", label: t('header.buyProperties') || "Buy Properties", icon: Home },
    { href: "/properties?transaction=rent", label: t('header.rentProperties') || "Rent Properties", icon: Building2 },
    { href: "/developers", label: "Developers", icon: Building2 },
    { href: "/seller-listing", label: t('header.listProperty') || "List Your Property", icon: ClipboardCheck },
  ];

  // Services dropdown - all redirect to main /services page
  const servicesLinks = [
    { href: "/services", label: t('header.buyingAdvisory') || "Buying Advisory", icon: UserCircle },
    { href: "/services", label: t('header.sellingAdvisory') || "Selling Advisory", icon: ClipboardCheck },
    { href: "/services", label: t('header.rentalAdvisory') || "Rental Advisory", icon: Building2 },
    { href: "/services", label: t('header.investmentAdvisory') || "Investment Advisory", icon: BarChart3 },
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
    { href: "/broker-toolkit", label: t('header.brokerDashboard') || "Broker Dashboard", icon: UserCircle },
    { href: "/broker-toolkit#tools", label: t('header.brokerTools') || "Broker Tools", icon: Briefcase },
    { href: "/broker-education", label: t('header.brokerEducation') || "Broker Education", icon: GraduationCap },
    { href: "/broker-toolkit#resources", label: t('header.brokerResources') || "Broker Resources", icon: FolderOpen },
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

  // Render dropdown menu helper - Premium styling
  const renderDropdown = (label: string, links: typeof propertiesLinks, isActiveCheck?: () => boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`flex items-center gap-0.5 px-1.5 lg:px-2 xl:px-2.5 2xl:px-3 py-1 lg:py-1.5 text-[9px] lg:text-[10px] xl:text-[10px] 2xl:text-[11px] font-bold whitespace-nowrap transition-all rounded-full ${
            isActiveCheck?.() ? 'text-gold bg-gold/15' : 'text-zinc-800 hover:text-gold hover:bg-gold/10'
          }`}
          style={{ letterSpacing: '0.03em' }}
        >
          {label}
          <ChevronDown className="w-2 h-2 lg:w-2.5 lg:h-2.5 transition-transform duration-200 group-data-[state=open]:rotate-180" />
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
    <header className="fixed top-0 left-0 right-0 z-[9999] h-24 lg:h-28">
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
        {/* Base shadow layer */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black to-transparent" style={{ transform: 'translateY(2px)', filter: 'blur(4px)' }} />
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
      
      <div className="relative z-10 mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-10 xl:px-14 h-full">
        <div className="flex items-center justify-between h-full w-full">
          {/* LEFT: Premium Brand Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-3 sm:gap-4 shrink-0 group transition-all duration-300"
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
                className="w-16 h-16 sm:w-16 sm:h-16 lg:w-14 lg:h-14 object-contain transition-transform duration-300 group-hover:scale-110 relative z-10"
                style={{
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 20px rgba(200,167,102,0.15))'
                }}
              />
            </div>
            {/* Premium Typography */}
            <div className="flex flex-col">
              <span 
                className="font-bold text-base sm:text-lg lg:text-sm tracking-[0.15em] uppercase whitespace-nowrap leading-none"
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
                className="hidden lg:block text-[9px] tracking-[0.25em] uppercase mt-1"
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

          {/* MOBILE RIGHT ICONS: Search, Language, Menu - visible on mobile only */}
          <div className="flex items-center gap-1 ml-auto lg:hidden">
            {/* Search Icon - smaller */}
            <button
              type="button"
              className={`${mobileHeaderIconButtonClassName} group`}
              aria-label="Open search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-3 h-3 text-gold group-hover:text-gold-light transition-colors" />
            </button>

            {/* Language Switcher */}
            <div className="shrink-0">
              <LanguageSwitcher variant="compact" />
            </div>

            {/* Mobile Menu Trigger - smaller */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={`${mobileHeaderIconButtonClassName} group`}
                  aria-label="Open menu"
                >
                  <Menu className="w-3 h-3 text-gold group-hover:text-gold-light transition-colors" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-gradient-to-b from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-l border-gold/30 w-[320px] p-0 flex flex-col h-full pt-14"
              >
                {/* Menu Header - larger monogram with transparent bg (black J letters), one-line company name */}
                <div className="relative border-b border-gold/30 flex items-center gap-3 px-4 py-3 shrink-0">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  {/* Monogram - larger for mobile menu */}
                  <img 
                     src={jbjMonogramNobuffer}
                    alt="JBJ"
                     className="w-24 h-24 shrink-0 object-contain scale-110"
                  />
                  <span 
                    className="text-black font-bold text-sm tracking-[0.06em] uppercase whitespace-nowrap leading-none"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    JBJ Global Real Estate
                  </span>
                </div>

                {/* Quick Actions Row - much smaller */}
                <div className="flex items-center justify-around px-2 py-0.5 border-b border-gold/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center gap-0 text-black hover:text-gold h-auto py-0.5 px-1"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSearchOpen(true);
                    }}
                  >
                    <Search className="w-2.5 h-2.5" />
                    <span className="text-[6px]">Search</span>
                  </Button>
                  <Link
                    to="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-0 text-black hover:text-gold py-0.5 px-1"
                  >
                    <div className="relative">
                      <Heart className="w-2.5 h-2.5" />
                      {totalCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 bg-gold text-black text-[5px] w-2 h-2 rounded-full flex items-center justify-center font-bold">
                          {totalCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[6px]">Favorites</span>
                  </Link>
                  <Link
                    to={user ? "/my-account" : "/auth"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-0 text-black hover:text-gold py-0.5 px-1"
                  >
                    <User className="w-2.5 h-2.5" />
                    <span className="text-[6px]">{user ? "Account" : "Sign In"}</span>
                  </Link>
                  <div className="shrink-0 scale-75">
                    <LanguageSwitcher variant="compact" />
                  </div>
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

                    {/* 5. Market Intelligence */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">Market Intelligence</p>
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

          {/* CENTER: Ultra Premium Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-2 xl:mx-4">
            <div 
              className="flex items-center gap-0.5 lg:gap-1 xl:gap-1.5 2xl:gap-2 rounded-full px-3 lg:px-4 xl:px-6 2xl:px-8 py-2 border-2 border-gold/40 relative"
              style={{
                background: 'linear-gradient(135deg, rgba(245,235,215,0.98) 0%, rgba(232,220,200,0.95) 50%, rgba(212,196,168,0.98) 100%)',
                boxShadow: '0 8px 32px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(200,167,102,0.2), inset 0 2px 0 rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.05), 0 0 40px -10px rgba(200,167,102,0.2)',
              }}
            >
              
              {/* 1. Home - No dropdown */}
              <Link
                to="/"
                className={`px-1.5 lg:px-2 xl:px-2.5 2xl:px-3 py-1 lg:py-1.5 text-[9px] lg:text-[10px] xl:text-[10px] 2xl:text-[11px] font-bold whitespace-nowrap transition-all relative group rounded-full ${
                  isActive("/")
                    ? "text-gold bg-gold/15"
                    : "text-zinc-800 hover:text-gold hover:bg-gold/10"
                }`}
                style={{ letterSpacing: '0.03em' }}
              >
                Home
              </Link>

              {/* 2. Properties Dropdown */}
              {renderDropdown("Properties", propertiesLinks, () => location.pathname === '/properties')}

              {/* 3. Services Dropdown */}
              {renderDropdown("Services", servicesLinks, () => location.pathname.startsWith('/services'))}

              {/* 4. Guides Dropdown */}
              {renderDropdown("Guides", guidesLinks, () => 
                ['/buyer-guide', '/seller-guide', '/landlord-guide', '/tenant-guide', '/areas', '/faq', '/investor-education', '/investor-faq', '/broker-faq'].some(p => location.pathname.startsWith(p))
              )}

              {/* 5. Market Intelligence Dropdown */}
              {renderDropdown("Market Intelligence", marketIntelLinks, () => 
                location.pathname.startsWith('/market-intelligence') || location.pathname === '/market-report'
              )}

              {/* 6. Investor Hub Dropdown */}
              {renderDropdown("Investor Hub", investorHubLinks, () => 
                location.pathname.includes('ai-hub') || location.pathname === '/favorites'
              )}

              {/* 7. Broker Hub Dropdown */}
              {renderDropdown("Broker Hub", brokerHubLinks, () => 
                location.pathname.includes('broker-toolkit') || location.pathname.includes('broker-education')
              )}

              {/* 8. About Dropdown */}
              {renderDropdown("About", aboutLinks, () => 
                ['/about', '/founder', '/team', '/awards'].some(p => location.pathname.startsWith(p))
              )}

              {/* 9. Contact - No dropdown */}
              <Link
                to="/contact"
                className={`px-1.5 lg:px-2 xl:px-2.5 2xl:px-3 py-1 lg:py-1.5 text-[9px] lg:text-[10px] xl:text-[10px] 2xl:text-[11px] font-bold whitespace-nowrap transition-all relative group rounded-full ${
                  isActive("/contact")
                    ? "text-gold bg-gold/15"
                    : "text-zinc-800 hover:text-gold hover:bg-gold/10"
                }`}
                style={{ letterSpacing: '0.03em' }}
              >
                Contact
              </Link>

              {/* 10. More Dropdown */}
              {renderDropdown("More", moreLinks, () => 
                ['/news', '/join'].some(p => location.pathname.startsWith(p))
              )}
            </div>
          </nav>

          {/* RIGHT: Premium Action Icons - Desktop only */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Premium Icon Container */}
            <div 
              className="flex items-center gap-1 px-4 py-2 rounded-full border border-gold/30"
              style={{
                background: 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.9) 100%)',
                boxShadow: '0 4px 16px -4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 30px -10px rgba(200,167,102,0.15)'
              }}
            >
              {/* Search Icon */}
              <button
                className="w-8 h-8 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-gold/10"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
              >
                <Search 
                  className="w-4 h-4 text-gold group-hover:text-white group-hover:scale-110 transition-all duration-300" 
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
              <div className="w-8 h-8 flex items-center justify-center">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button 
                        className="w-8 h-8 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-gold/10"
                        aria-label={t('nav.myAccount')}
                      >
                        <User 
                          className="w-4 h-4 text-gold group-hover:text-white group-hover:scale-110 transition-all duration-300" 
                          style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }} 
                        />
                      </button>
                    </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    sideOffset={12}
                    className="bg-gradient-to-b from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/30 min-w-[260px] shadow-2xl shadow-black/30 py-3 rounded-xl overflow-hidden"
                  >
                    {/* Premium header matching nav dropdown style */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                    <div className="px-5 py-3 border-b border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
                      <p className="text-gold font-semibold text-sm tracking-wide">{t('nav.myAccount')}</p>
                      <p className="text-black text-xs mt-1 truncate">{user.email}</p>
                    </div>
                    
                    <div className="py-2 flex flex-col gap-1 px-2">
                      <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                        <Link to="/my-account" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                            <UserCircle className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <span className="font-medium text-sm">Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                        <Link to="/favorites" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                            <Heart className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <span className="font-medium text-sm">{t('nav.favorites')}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {/* Admin/Founder shortcuts */}
                      {(isAdmin || hasCRMAccess) && (
                        <>
                          <DropdownMenuSeparator className="bg-gold/20 my-2 mx-2" />
                          <p className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-gold font-medium">Admin Shortcuts</p>
                          <div className="flex flex-col gap-1 px-2">
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
                          </div>
                        </>
                      )}
                      
                      <div className="flex flex-col gap-1 px-2">
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
                        {isAdmin && (
                          <DropdownMenuItem asChild className="p-0 focus:bg-gold/10 rounded-lg">
                            <Link to="/admin" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                <Settings className="w-3.5 h-3.5 text-gold" />
                              </div>
                              <span className="font-medium text-sm">{t('nav.admin')}</span>
                            </Link>
                          </DropdownMenuItem>
                        )}
                      </div>
                    </div>
                    
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
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <button 
                    className="w-8 h-8 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-gold/10"
                  >
                    <User 
                      className="w-4 h-4 text-gold group-hover:text-white group-hover:scale-110 transition-all duration-300" 
                      style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }} 
                    />
                  </button>
                </Link>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default GlobalHeader;
