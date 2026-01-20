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

  // Properties dropdown (execution-only)
  const propertiesLinks = [
    { href: "/properties?transaction=buy", label: "Buy Properties", icon: Home },
    { href: "/properties?transaction=rent", label: "Rent Properties", icon: Building2 },
    { href: "/seller-listing", label: "List Your Property", icon: ClipboardCheck },
  ];

  // Services dropdown (execution + advisory)
  const servicesLinks = [
    { href: "/services/buyer-advisory", label: "Buying Advisory", icon: UserCircle },
    { href: "/services/seller-advisory", label: "Selling Advisory", icon: ClipboardCheck },
    { href: "/services/leasing-advisory", label: "Rental Advisory", icon: Building2 },
    { href: "/services/investment-advisory", label: "Investment Advisory", icon: BarChart3 },
    { href: "/services/partners", label: "Partner Introductions", icon: Users },
  ];

  // Guides dropdown (education-only, client-facing)
  const guidesLinks = [
    { href: "/buyer-guide", label: "Buyer Guide", icon: FileText },
    { href: "/seller-guide", label: "Seller Guide", icon: FileText },
    { href: "/landlord-guide", label: "Landlord Guide", icon: FileText },
    { href: "/tenant-guide", label: "Tenant Guide", icon: FileText },
    { href: "/areas", label: "Area Guides", icon: MapPin },
    { href: "/investor-education", label: "Investor Education", icon: GraduationCap },
    { href: "/faq", label: "General FAQ", icon: ClipboardCheck },
    { href: "/investor-faq", label: "Investor FAQ", icon: ClipboardCheck },
    { href: "/broker-faq", label: "Broker FAQ", icon: ClipboardCheck },
  ];

  // Market Intelligence dropdown (data-led, descriptive)
  const marketIntelLinks = [
    { href: "/market-intelligence/overview", label: "Market Overview", icon: BarChart3 },
    { href: "/market-intelligence/areas", label: "Area Intelligence", icon: MapPin },
    { href: "/market-intelligence/reports", label: "Market Reports", icon: FileText },
    { href: "/market-intelligence/methodology", label: "Methodology & Sources", icon: ClipboardCheck },
  ];

  // Investor Hub dropdown (tools + dashboard)
  const investorHubLinks = [
    { href: "/my-account", label: "Investor Dashboard", icon: UserCircle },
    { href: "/investment-playbooks", label: "Investor Tools", icon: Briefcase },
    { href: "/favorites", label: "Portfolio Views", icon: Heart },
    { href: "/market-intelligence/reports", label: "Reports Access", icon: FileText },
  ];

  // Broker Hub dropdown (internal)
  const brokerHubLinks = [
    { href: "/broker-toolkit", label: "Broker Dashboard", icon: UserCircle },
    { href: "/broker-toolkit#tools", label: "Broker Tools", icon: Briefcase },
    { href: "/broker-education", label: "Broker Education", icon: GraduationCap },
    { href: "/broker-toolkit#resources", label: "Broker Resources", icon: FolderOpen },
    { href: "/broker-faq", label: "Broker FAQ", icon: ClipboardCheck },
  ];

  // About dropdown
  const aboutLinks = [
    { href: "/about", label: "About JBJ", icon: Building2 },
    { href: "/founder", label: "Founder & Leadership", icon: UserCircle },
    { href: "/team", label: "Meet the Team", icon: Users },
    { href: "/awards", label: "Awards & Recognition", icon: Award },
  ];

  // More dropdown
  const moreLinks = [
    { href: "/news", label: "News & Insights", icon: Newspaper },
    { href: "/join", label: "Join Our Team", icon: UserPlus },
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
      
      <div className="relative z-10 mx-auto w-full max-w-7xl px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-20 lg:h-24 w-full">
          {/* LEFT: Brand Logo - Monogram only on mobile */}
          <Link 
            to="/" 
            className="flex items-center gap-3 shrink-0 group transition-all duration-300"
            style={{ fontFamily: "Poppins, sans-serif" }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative">
              <img 
                src={jbjMonogramDarkBg} 
                alt="JBJ" 
                className="w-10 h-10 lg:w-12 lg:h-12 object-contain transition-transform duration-300 group-hover:scale-105"
              />
              {/* Subtle glow on hover */}
              <div className="absolute inset-0 rounded-full bg-gold/0 group-hover:bg-gold/10 transition-colors duration-300 blur-xl" />
            </div>
            <span className="text-white font-semibold text-xs lg:text-sm tracking-[0.1em] uppercase whitespace-nowrap hidden lg:inline drop-shadow-sm">
              JBJ Global Real Estate
            </span>
          </Link>

          {/* MOBILE RIGHT ICONS: Search, Language, Menu - visible on mobile only */}
          <div className="flex items-center gap-1.5 ml-auto lg:hidden">
            {/* Search Icon */}
            <Button
              variant="ghost"
              size="sm"
              className="relative w-9 h-9 p-0 rounded-full bg-white border border-gold/30 hover:bg-transparent hover:border-gold/50 transition-all duration-300 group"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-4 h-4 text-gold group-hover:text-gold-light transition-colors" />
            </Button>

            {/* Language Switcher */}
            <div className="shrink-0">
              <LanguageSwitcher variant="compact" />
            </div>

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative w-9 h-9 p-0 rounded-full bg-white border border-gold/30 hover:bg-transparent hover:border-gold/50 transition-all duration-300 group"
                  aria-label="Open menu"
                >
                  <Menu className="w-4 h-4 text-gold group-hover:text-gold-light transition-colors" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="bg-gradient-to-b from-white via-[#FDFBF7] to-[#F5F0E6] border-l border-gold/30 w-[320px] p-0 flex flex-col h-full pt-20"
              >
                {/* Menu Header with white pearl styling */}
                <div className="relative h-20 bg-gradient-to-b from-white to-[#FDFBF7] border-b border-gold/30 flex items-center px-5 shrink-0">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <BrandMonogram variant="light" size="sm" layout="horizontal" />
                </div>

                {/* AI Home Finder Banner - Purple & White */}
                <Link
                  to="/ai-home-finder"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 border border-purple-400/50 shadow-lg hover:shadow-purple-500/30 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">AI Home Finder</p>
                      <p className="text-purple-200 text-xs">Find your perfect match</p>
                    </div>
                  </div>
                </Link>

                {/* Quick Actions Row */}
                <div className="flex items-center justify-around px-4 py-3 mt-3 border-b border-gold/20">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex flex-col items-center gap-1 text-black hover:text-gold h-auto py-2 px-3"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSearchOpen(true);
                    }}
                  >
                    <Search className="w-5 h-5" />
                    <span className="text-[10px]">Search</span>
                  </Button>
                  <Link
                    to="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-1 text-black hover:text-gold py-2 px-3"
                  >
                    <div className="relative">
                      <Heart className="w-5 h-5" />
                      {totalCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-gold text-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                          {totalCount}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px]">Favorites</span>
                  </Link>
                  <Link
                    to={user ? "/my-account" : "/auth"}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-col items-center gap-1 text-black hover:text-gold py-2 px-3"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-[10px]">{user ? "Account" : "Sign In"}</span>
                  </Link>
                  <div className="shrink-0">
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
                      Home
                    </Link>

                    <div className="h-px bg-gold/20 my-2" />
                    
                    {/* 2. Properties */}
                    <p className="px-4 py-2 text-xs uppercase tracking-wider font-semibold text-gold">Properties</p>
                    {propertiesLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:text-gold hover:bg-gold/5 transition-colors rounded-lg"
                      >
                        <div className="w-7 h-7 rounded-md bg-transparent border border-gold/50 flex items-center justify-center">
                          <link.icon className="w-3.5 h-3.5 text-gold" />
                        </div>
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
                        <div className="w-7 h-7 rounded-md bg-transparent border border-gold/50 flex items-center justify-center">
                          <link.icon className="w-3.5 h-3.5 text-gold" />
                        </div>
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
                        <div className="w-7 h-7 rounded-md bg-transparent border border-gold/50 flex items-center justify-center">
                          <link.icon className="w-3.5 h-3.5 text-gold" />
                        </div>
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
                        <div className="w-7 h-7 rounded-md bg-transparent border border-gold/50 flex items-center justify-center">
                          <link.icon className="w-3.5 h-3.5 text-gold" />
                        </div>
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
                        <div className="w-7 h-7 rounded-md bg-transparent border border-gold/50 flex items-center justify-center">
                          <link.icon className="w-3.5 h-3.5 text-gold" />
                        </div>
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
                        <div className="w-7 h-7 rounded-md bg-transparent border border-gold/50 flex items-center justify-center">
                          <link.icon className="w-3.5 h-3.5 text-gold" />
                        </div>
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
                        <div className="w-7 h-7 rounded-md bg-transparent border border-gold/50 flex items-center justify-center">
                          <link.icon className="w-3.5 h-3.5 text-gold" />
                        </div>
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
                        <div className="w-7 h-7 rounded-md bg-transparent border border-gold/50 flex items-center justify-center">
                          <link.icon className="w-3.5 h-3.5 text-gold" />
                        </div>
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

          {/* CENTER: Desktop Navigation - Premium styling with elegant dropdowns - STRETCHED */}
          <nav className="hidden lg:flex items-center justify-center flex-1 min-w-0 mx-2">
            <div className="flex items-center gap-0 min-w-0 max-w-full overflow-x-auto bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] backdrop-blur-sm rounded-full px-2 xl:px-3 py-1.5 border border-gold/30 shadow-lg [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              
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
                location.pathname.includes('investment-playbooks') || location.pathname === '/favorites'
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
                className={`px-2.5 xl:px-3 py-1.5 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all relative group rounded-full ${
                  isActive("/contact")
                    ? "text-gold bg-gold/10"
                    : "text-black hover:text-gold hover:bg-gold/10"
                }`}
              >
                Contact
              </Link>

              {/* 10. More Dropdown */}
              {renderDropdown("More", moreLinks, () => 
                ['/news', '/join'].some(p => location.pathname.startsWith(p))
              )}
            </div>
          </nav>

          {/* RIGHT: Actions - Desktop only - Compact premium icon buttons with inverted hover */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 ml-4 pr-2">
            {/* Search Icon - White bg with gold icon normally, inverted on hover */}
            <Button
              variant="ghost"
              size="sm"
              className="relative w-8 h-8 p-0 rounded-full bg-white border border-gold/30 hover:bg-transparent hover:border-gold/50 transition-all duration-300 group"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-3.5 h-3.5 text-gold group-hover:text-gold-light transition-colors" />
            </Button>

            {/* Language Switcher - Inverted style */}
            <div className="shrink-0">
              <LanguageSwitcher variant="compact" />
            </div>

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
