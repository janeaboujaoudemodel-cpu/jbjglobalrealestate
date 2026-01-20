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

const GlobalHeader = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { t } = useLanguage();
  
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

  // Properties dropdown
  const propertiesLinks = [
    { href: "/properties?transaction=buy", label: "Buy Properties", icon: Home },
    { href: "/properties?transaction=rent", label: "Rent Properties", icon: Building2 },
    { href: "/seller-listing", label: "List Your Property", icon: ClipboardCheck },
  ];

  // Services dropdown
  const servicesLinks = [
    { href: "/services/buyer-advisory", label: "Buyer Advisory", icon: UserCircle },
    { href: "/services/seller-advisory", label: "Seller Advisory", icon: ClipboardCheck },
    { href: "/services/leasing-advisory", label: "Leasing Advisory", icon: Building2 },
    { href: "/services/investment-advisory", label: "Investment Advisory", icon: BarChart3 },
  ];

  // Investor Hub dropdown
  const investorHubLinks = [
    { href: "/investor-education", label: "Investor Education", icon: GraduationCap },
    { href: "/investor-faq", label: "Investor FAQs", icon: ClipboardCheck },
    { href: "/investment-playbooks", label: "Investment Playbooks", icon: FileText },
  ];

  // Broker Hub dropdown
  const brokerHubLinks = [
    { href: "/broker-toolkit", label: "Broker Tools", icon: Briefcase },
    { href: "/broker-education", label: "Broker Education", icon: GraduationCap },
    { href: "/broker-faq", label: "Broker FAQs", icon: ClipboardCheck },
  ];

  // Guides dropdown (CLEANED - no investor/broker content)
  const guidesLinks = [
    { href: "/buyer-guide", label: "Buyer Guide", icon: FileText },
    { href: "/seller-guide", label: "Seller Guide", icon: FileText },
    { href: "/landlord-guide", label: "Landlord Guide", icon: FileText },
    { href: "/tenant-guide", label: "Tenant Guide", icon: FileText },
    { href: "/areas", label: "Area Guides", icon: MapPin },
    { href: "/faq", label: "General FAQs", icon: ClipboardCheck },
  ];

  // Market Intelligence dropdown
  const marketIntelLinks = [
    { href: "/market-intelligence/overview", label: "Market Overview", icon: BarChart3 },
    { href: "/market-intelligence/areas", label: "Area Intelligence", icon: MapPin },
    { href: "/market-intelligence/reports", label: "Market Reports", icon: FileText },
    { href: "/market-intelligence/methodology", label: "Methodology & Data Sources", icon: ClipboardCheck },
  ];

  // About dropdown
  const aboutLinks = [
    { href: "/about", label: "About JBJ", icon: Building2 },
    { href: "/founder", label: "Founder & Leadership", icon: UserCircle },
    { href: "/team", label: "Meet the Team", icon: Users },
    { href: "/awards", label: "Awards & Recognition", icon: Award },
    { href: "/news", label: "News & Insights", icon: Newspaper },
    { href: "/join", label: "Careers", icon: UserPlus },
  ];

  const isActive = (path: string) => location.pathname === path;

  // Render dropdown menu helper
  const renderDropdown = (label: string, links: typeof propertiesLinks, isActiveCheck?: () => boolean) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={`flex items-center gap-0.5 px-2.5 xl:px-3 py-1.5 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all rounded-full ${
          isActiveCheck?.() ? 'text-gold bg-gold/10' : 'text-black hover:text-gold hover:bg-gold/10'
        }`}>
          {label}
          <ChevronDown className="w-3 h-3 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        sideOffset={12}
        className="bg-gradient-to-b from-white to-zinc-50 border border-gold/30 min-w-[240px] shadow-2xl shadow-black/30 py-4 rounded-xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="flex flex-col gap-1.5 px-2">
          {links.map((link) => (
            <DropdownMenuItem key={link.href} asChild className="p-0 focus:bg-gold/10 rounded-lg">
              <Link to={link.href} className="flex items-center gap-3 text-gold hover:text-zinc-800 hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                <div className="w-7 h-7 rounded-md bg-transparent border border-black group-hover:bg-black flex items-center justify-center transition-colors">
                  <link.icon className="w-3.5 h-3.5 text-black group-hover:text-gold transition-colors" />
                </div>
                <span className="font-medium text-sm">{link.label}</span>
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-gold/20 shadow-2xl shadow-black/50">
      {/* Solid black background across entire header - no transparency */}
      <div className="absolute inset-0 bg-black" />
      {/* Premium top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent z-10" />
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex items-center h-20 lg:h-24">
          
          {/* LEFT: Brand Logo - Monogram + Text - LOCKED (only size can change) */}
          <Link 
            to="/" 
            className="flex items-center gap-4 shrink-0 group transition-all duration-300"
            style={{ fontFamily: "Poppins, sans-serif" }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative">
              <img 
                src={jbjMonogramDarkBg} 
                alt="JBJ" 
                className="w-12 h-12 lg:w-14 lg:h-14 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 rounded-full bg-gold/0 group-hover:bg-gold/10 transition-colors duration-300 blur-xl" />
            </div>
            <span className="text-white font-semibold text-xs lg:text-sm tracking-[0.1em] uppercase whitespace-nowrap hidden sm:inline drop-shadow-sm">
              JBJ Global Real Estate
            </span>
          </Link>

          {/* CENTER: Desktop Navigation - Premium styling with elegant dropdowns - STRETCHED */}
          <nav className="hidden lg:flex items-center justify-center flex-1 mx-1">
            <div className="flex items-center gap-0.5 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] backdrop-blur-sm rounded-full px-3 xl:px-4 py-1.5 border border-gold/30 shadow-lg">
              
              {/* 1. Home - No dropdown */}
              <Link
                to="/"
                className={`px-2.5 xl:px-3 py-1.5 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all relative group rounded-full ${
                  isActive("/")
                    ? "text-gold bg-gold/10"
                    : "text-black hover:text-gold hover:bg-gold/10"
                }`}
              >
                Home
              </Link>

              {/* 2. Properties Dropdown */}
              {renderDropdown("Properties", propertiesLinks, () => location.pathname === '/properties')}

              {/* 3. Services Dropdown */}
              {renderDropdown("Services", servicesLinks, () => location.pathname.startsWith('/services'))}

              {/* 4. Investor Hub Dropdown */}
              {renderDropdown("Investor Hub", investorHubLinks, () => 
                location.pathname.includes('investor') || location.pathname === '/ai-hub'
              )}

              {/* 5. Broker Hub Dropdown */}
              {renderDropdown("Broker Hub", brokerHubLinks, () => 
                location.pathname.includes('broker') && !location.pathname.includes('faq') && !location.pathname.includes('education')
              )}

              {/* 6. Guides Dropdown */}
              {renderDropdown("Guides", guidesLinks, () => 
                ['/buyer-guide', '/seller-guide', '/landlord-guide', '/tenant-guide', '/areas', '/faq'].some(p => location.pathname.startsWith(p))
              )}

              {/* 7. Market Intelligence Dropdown */}
              {renderDropdown("Market Intelligence", marketIntelLinks, () => 
                location.pathname.startsWith('/market-intelligence') || location.pathname === '/market-report'
              )}

              {/* 8. About Dropdown */}
              {renderDropdown("About", aboutLinks, () => 
                ['/about', '/founder', '/team', '/awards', '/news', '/join'].some(p => location.pathname.startsWith(p))
              )}

              {/* 9. Contact - No dropdown */}
              <Link
                to="/contact"
                className={`px-2.5 xl:px-3 py-1.5 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all relative group rounded-full ${
                  isActive("/contact")
                    ? "text-gold bg-gold/10"
                    : "text-black hover:text-gold hover:bg-gold/10"
                }`}
              >
                Contact
              </Link>
            </div>
          </nav>

          {/* RIGHT: Actions - Compact premium icon buttons with inverted hover */}
          <div className="flex items-center gap-1 lg:gap-1.5 shrink-0 ml-auto">
            {/* Search Icon - White bg with gold icon normally, inverted on hover */}
            <Button
              variant="ghost"
              size="sm"
              className="relative w-7 h-7 p-0 rounded-full bg-white border border-gold/30 hover:bg-transparent hover:border-gold/50 transition-all duration-300 group"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-3 h-3 text-gold group-hover:text-gold-light transition-colors" />
            </Button>

            {/* Language Switcher - Inverted style */}
            <div className="shrink-0">
              <LanguageSwitcher variant="compact" />
            </div>

            {/* Mobile Menu Trigger (visible under lg) */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gold hover:text-gold-light hover:bg-gold/10 shrink-0 w-10 h-10 p-0"
                  aria-label="Open menu"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-black/95 backdrop-blur-xl border-zinc-800/50 w-[300px] p-0 flex flex-col h-full"
              >
                {/* Menu Header with glassmorphism */}
                <div className="relative h-28 bg-gradient-to-b from-zinc-900/80 to-black/90 border-b border-gold/20 flex items-end p-5 shrink-0 backdrop-blur-sm">
                  <BrandMonogram variant="dark" size="sm" layout="horizontal" />
                </div>

                {/* Scrollable Navigation */}
                <ScrollArea className="flex-1">
                  <nav className="flex flex-col p-4">
                    {/* 1. Home */}
                    <Link
                      to="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 border-l-2 transition-all ${
                        isActive("/")
                          ? "text-gold border-gold bg-gold/10"
                          : "text-zinc-300 border-transparent hover:text-white hover:bg-zinc-900/80 hover:border-gold/50"
                      }`}
                    >
                      Home
                    </Link>

                    <div className="h-px bg-zinc-800 my-2" />
                    
                    {/* 2. Properties */}
                    <p className="px-4 py-2 text-xs text-gold/60 uppercase tracking-wider">Properties</p>
                    {propertiesLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors"
                      >
                        <link.icon className="w-4 h-4 text-gold/70" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-zinc-800 my-2" />

                    {/* 3. Services */}
                    <p className="px-4 py-2 text-xs text-gold/60 uppercase tracking-wider">Services</p>
                    {servicesLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors"
                      >
                        <link.icon className="w-4 h-4 text-gold/70" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-zinc-800 my-2" />

                    {/* 4. Investor Hub */}
                    <p className="px-4 py-2 text-xs text-gold/60 uppercase tracking-wider">Investor Hub</p>
                    {investorHubLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors"
                      >
                        <link.icon className="w-4 h-4 text-gold/70" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-zinc-800 my-2" />

                    {/* 5. Broker Hub */}
                    <p className="px-4 py-2 text-xs text-gold/60 uppercase tracking-wider">Broker Hub</p>
                    {brokerHubLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors"
                      >
                        <link.icon className="w-4 h-4 text-gold/70" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-zinc-800 my-2" />

                    {/* 6. Guides */}
                    <p className="px-4 py-2 text-xs text-gold/60 uppercase tracking-wider">Guides</p>
                    {guidesLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors"
                      >
                        <link.icon className="w-4 h-4 text-gold/70" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-zinc-800 my-2" />

                    {/* 7. Market Intelligence */}
                    <p className="px-4 py-2 text-xs text-gold/60 uppercase tracking-wider">Market Intelligence</p>
                    {marketIntelLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors"
                      >
                        <link.icon className="w-4 h-4 text-gold/70" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-zinc-800 my-2" />

                    {/* 8. About */}
                    <p className="px-4 py-2 text-xs text-gold/60 uppercase tracking-wider">About</p>
                    {aboutLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors"
                      >
                        <link.icon className="w-4 h-4 text-gold/70" />
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-zinc-800 my-2" />

                    {/* 9. Contact */}
                    <Link
                      to="/contact"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 border-l-2 transition-all ${
                        isActive("/contact")
                          ? "text-gold border-gold bg-gold/10"
                          : "text-zinc-300 border-transparent hover:text-white hover:bg-zinc-900/80 hover:border-gold/50"
                      }`}
                    >
                      <Phone className="w-4 h-4 text-gold/70" />
                      Contact
                    </Link>

                    <div className="h-px bg-zinc-800 my-4" />

                    {/* Favorites & Shortlist */}
                    <Link
                      to="/favorites"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-900/80 transition-colors"
                    >
                      <Heart className="w-5 h-5" />
                      <span>{t('nav.favorites')}</span>
                      {totalCount > 0 && (
                        <span className="ml-auto bg-gold text-black text-xs px-2 py-0.5 rounded-full font-medium">
                          {totalCount}
                        </span>
                      )}
                    </Link>

                    <div className="h-px bg-zinc-800 my-4" />

                    {user ? (
                      <>
                        <div className="px-4 py-3 text-gold font-medium border-l-2 border-gold bg-gold/5">
                          {t('nav.myAccount')}
                        </div>
                        <div className="px-4 py-2 text-zinc-500 text-sm">{user.email?.split("@")[0]}</div>
                        {hasCRMAccess && (
                          <Link
                            to="/crm"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-gold hover:text-gold/80 hover:bg-gold/10 transition-colors"
                          >
                            <Users className="w-5 h-5" />
                            {t('nav.crm') || 'CRM Dashboard'}
                          </Link>
                        )}
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
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
                          className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors w-full text-left"
                        >
                          <LogOut className="w-5 h-5" />
                          {t('nav.signOut')}
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/auth"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gold hover:text-gold/80 hover:bg-gold/10 transition-colors"
                      >
                        <User className="w-5 h-5" />
                        {t('nav.signIn')}
                      </Link>
                    )}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            {/* User Menu - Desktop - Premium profile dropdown matching nav style */}
            <div className="hidden lg:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="relative text-gold hover:text-gold-light w-7 h-7 p-0 rounded-full border border-gold/20 hover:border-gold/50 hover:bg-gold/10 transition-all duration-300 group"
                      aria-label={t('nav.myAccount')}
                    >
                      <User className="w-3 h-3 group-hover:scale-110 transition-transform" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    sideOffset={12}
                    className="bg-gradient-to-b from-white to-zinc-50 border border-gold/30 min-w-[260px] shadow-2xl shadow-black/30 py-3 rounded-xl overflow-hidden"
                  >
                    {/* Premium header matching nav dropdown style */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                    <div className="px-5 py-3 border-b border-gold/20 bg-gradient-to-r from-gold/5 to-transparent">
                      <p className="text-gold font-semibold text-sm tracking-wide">{t('nav.myAccount')}</p>
                      <p className="text-black text-xs mt-1 truncate">{user.email}</p>
                    </div>
                    
                    <div className="py-2">
                      <DropdownMenuItem asChild className="py-0 px-0 focus:bg-gold/10">
                        <Link to="/my-account" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-5 transition-all w-full group">
                          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                            <UserCircle className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <span className="font-medium text-sm">Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="py-0 px-0 focus:bg-gold/10">
                        <Link to="/favorites" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-5 transition-all w-full group">
                          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                            <Heart className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <span className="font-medium text-sm">{t('nav.favorites')}</span>
                        </Link>
                      </DropdownMenuItem>
                      
                      {/* Admin/Founder shortcuts */}
                      {(isAdmin || hasCRMAccess) && (
                        <>
                          <DropdownMenuSeparator className="bg-gold/20 my-2" />
                          <p className="px-5 py-1.5 text-[10px] uppercase tracking-wider text-gold font-medium">Admin Shortcuts</p>
                          
                          {/* My Assistant - Always show for admin/founder */}
                          <DropdownMenuItem asChild className="py-0 px-0 focus:bg-gold/10">
                            <Link to="/founder-assistant" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-5 transition-all w-full group">
                              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                <Sparkles className="w-3.5 h-3.5 text-gold" />
                              </div>
                              <span className="font-medium text-sm">My Assistant</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          {/* Employee Hub */}
                          <DropdownMenuItem asChild className="py-0 px-0 focus:bg-gold/10">
                            <Link to="/employee-hub" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-5 transition-all w-full group">
                              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                <Briefcase className="w-3.5 h-3.5 text-gold" />
                              </div>
                              <span className="font-medium text-sm">Employee Hub</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          {/* Listing Admin */}
                          <DropdownMenuItem asChild className="py-0 px-0 focus:bg-gold/10">
                            <Link to="/listing-admin" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-5 transition-all w-full group">
                              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                <FolderOpen className="w-3.5 h-3.5 text-gold" />
                              </div>
                              <span className="font-medium text-sm">Listing Admin</span>
                            </Link>
                          </DropdownMenuItem>
                          
                          {/* IT Department */}
                          <DropdownMenuItem asChild className="py-0 px-0 focus:bg-gold/10">
                            <Link to="/it-department" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-5 transition-all w-full group">
                              <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                                <Monitor className="w-3.5 h-3.5 text-gold" />
                              </div>
                              <span className="font-medium text-sm">IT Department</span>
                            </Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      
                      {hasCRMAccess && (
                        <DropdownMenuItem asChild className="py-0 px-0 focus:bg-gold/10">
                          <Link to="/crm" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-5 transition-all w-full group">
                            <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                              <Users className="w-3.5 h-3.5 text-gold" />
                            </div>
                            <span className="font-medium text-sm">{t('nav.crm') || 'CRM Dashboard'}</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {isAdmin && (
                        <DropdownMenuItem asChild className="py-0 px-0 focus:bg-gold/10">
                          <Link to="/admin" className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-5 transition-all w-full group">
                            <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                              <Settings className="w-3.5 h-3.5 text-gold" />
                            </div>
                            <span className="font-medium text-sm">{t('nav.admin')}</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </div>
                    
                    <DropdownMenuSeparator className="bg-gold/20" />
                    <div className="py-2">
                      <DropdownMenuItem onClick={() => signOut()} className="py-0 px-0 cursor-pointer focus:bg-red-500/10">
                        <div className="flex items-center gap-3 text-zinc-600 hover:text-red-500 py-3 px-5 transition-all w-full group">
                          <div className="w-7 h-7 rounded-md bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                            <LogOut className="w-3.5 h-3.5 text-red-500" />
                          </div>
                          <span className="font-medium text-sm">{t('nav.signOut')}</span>
                        </div>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative text-gold hover:text-gold-light w-10 h-10 lg:w-11 lg:h-11 p-0 rounded-full border border-gold/20 hover:border-gold/50 hover:bg-gold/10 transition-all duration-300 group"
                  >
                    <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </Button>
                </Link>
              )}
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
