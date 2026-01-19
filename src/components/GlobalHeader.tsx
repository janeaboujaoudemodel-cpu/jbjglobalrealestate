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
  Sparkles, Search, Users, BookOpen, ChevronDown, Briefcase, UserCircle, FolderOpen, Monitor
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

  // Simplified navigation with Guides dropdown
  const mainNavLinks = [
    { href: "/", label: t('nav.home'), icon: Home },
    { href: "/services", label: t('nav.services'), icon: Building2 },
    { href: "/ai-hub", label: "Investor Hub", icon: Sparkles },
    { href: "/broker-toolkit", label: "Broker Hub", icon: Briefcase },
    { href: "/about", label: t('nav.about'), icon: Building2 },
    { href: "/contact", label: t('nav.contact'), icon: Phone },
  ];

  // Properties submenu items for Buy / Rent / List Property
  const propertiesLinks = [
    { href: "/properties?transaction=buy", label: "Buy Properties", icon: Home },
    { href: "/seller-listing", label: "List Your Property", icon: ClipboardCheck },
    { href: "/properties?transaction=rent", label: "Rent Properties", icon: Building2 },
  ];

  // Guides submenu items - INCLUDES ALL GUIDES
  const guidesLinks = [
    { href: "/buyer-guide", label: t('nav.buyerGuide') || 'Buyer Guide', icon: FileText },
    { href: "/seller-guide", label: t('nav.sellerGuide') || 'Seller Guide', icon: FileText },
    { href: "/rent-guide", label: 'Rent Guide', icon: FileText },
    { href: "/tenant-guide", label: 'Tenant Guide', icon: FileText },
    { href: "/landlord-guide", label: 'Landlord Guide', icon: FileText },
    { href: "/areas", label: t('nav.areaGuides') || 'Area Guides', icon: Building2 },
    { href: "/faq", label: 'FAQ', icon: ClipboardCheck },
  ];

  // Market Intelligence submenu
  const marketIntelLinks = [
    { href: "/market-intelligence/overview", label: 'Market Overview', icon: Building2 },
    { href: "/market-intelligence/areas", label: 'Area Intelligence', icon: Building2 },
    { href: "/market-intelligence/reports", label: 'Market Reports', icon: FileText },
    { href: "/market-intelligence/methodology", label: 'Methodology', icon: ClipboardCheck },
  ];

  // More links for dropdown
  const moreLinks = [
    { href: "/team", label: "Meet the Team", icon: Users },
    { href: "/founder", label: t('nav.founder'), icon: User },
    { href: "/awards", label: t('nav.awards'), icon: Building2 },
    { href: "/news", label: t('nav.news'), icon: Newspaper },
    { href: "/join", label: t('nav.join') || 'Join Our Team', icon: User },
  ];

  // Property shortcuts for quick access
  const propertyShortcuts = [
    { href: "/properties?status=off-plan", label: "Off-Plan", icon: Building2 },
    { href: "/properties?status=ready", label: "Ready to Move", icon: ClipboardCheck },
    { href: "/quiz", label: "JBJ AI Home Finder", icon: Sparkles },
    { href: "/market-report", label: "Market Report", icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] border-b border-gold/20 shadow-2xl shadow-black/50 overflow-hidden">
      {/* Split background: Black for upper portion, transparent from nav pill bottom line down */}
      <div className="absolute inset-0">
        {/* Upper part of header is solid black (above the navigation pill bottom line) */}
        <div className="absolute left-0 top-0 right-0 h-12 lg:h-14 bg-black" />
        {/* Gradient fade from black to transparent below that */}
        <div className="absolute left-0 top-12 lg:top-14 right-0 h-8 bg-gradient-to-b from-black to-transparent" />
        {/* Rest is transparent with subtle backdrop blur */}
        <div className="absolute left-0 top-20 lg:top-22 right-0 bottom-0 bg-black/30 backdrop-blur-xl" />
      </div>
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
            <span className="text-white font-semibold text-base lg:text-xl tracking-[0.14em] uppercase whitespace-nowrap hidden sm:inline drop-shadow-sm">
              JBJ Global Real Estate
            </span>
          </Link>

          {/* CENTER: Desktop Navigation - Premium styling with elegant dropdowns - STRETCHED */}
          <nav className="hidden lg:flex items-center justify-center flex-1 mx-6">
            <div className="flex items-center gap-1 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] backdrop-blur-sm rounded-full px-5 py-2 border border-gold/30 shadow-lg">
              {mainNavLinks.slice(0, 1).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 xl:px-4 py-2 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all relative group rounded-full ${
                    isActive(link.href)
                      ? "text-gold bg-gold/10"
                      : "text-black hover:text-gold hover:bg-gold/10"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Properties Dropdown - Premium styling */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-1 px-3 xl:px-4 py-2 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all rounded-full ${
                    location.pathname === '/properties' ? 'text-gold bg-gold/10' : 'text-black hover:text-gold hover:bg-gold/10'
                  }`}>
                    {t('nav.properties')}
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
                    {propertiesLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild className="p-0 focus:bg-gold/10 rounded-lg">
                        <Link to={link.href} className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-3 px-3 transition-all w-full group rounded-lg">
                          <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                            <link.icon className="w-4 h-4 text-gold" />
                          </div>
                          <span className="font-medium">{link.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {mainNavLinks.slice(1).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 xl:px-4 py-2 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all relative group rounded-full ${
                    isActive(link.href)
                      ? "text-gold bg-gold/10"
                      : "text-black hover:text-gold hover:bg-gold/10"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Guides Dropdown - Premium styling */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 xl:px-4 py-2 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all text-black hover:text-gold hover:bg-gold/10 rounded-full">
                    Guides
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="center" 
                  sideOffset={12}
                  className="bg-gradient-to-b from-white to-zinc-50 border border-gold/30 min-w-[220px] shadow-2xl shadow-black/30 py-4 rounded-xl overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <div className="flex flex-col gap-1.5 px-2">
                    {guidesLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild className="p-0 focus:bg-gold/10 rounded-lg">
                        <Link to={link.href} className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                            <link.icon className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <span className="font-medium text-sm">{link.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Market Intelligence Dropdown - Premium styling */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-1 px-3 xl:px-4 py-2 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all rounded-full ${
                    location.pathname.startsWith('/market-intelligence') ? 'text-gold bg-gold/10' : 'text-black hover:text-gold hover:bg-gold/10'
                  }`}>
                    Market
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="center" 
                  sideOffset={12}
                  className="bg-gradient-to-b from-white to-zinc-50 border border-gold/30 min-w-[220px] shadow-2xl shadow-black/30 py-4 rounded-xl overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <div className="flex flex-col gap-1.5 px-2">
                    {marketIntelLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild className="p-0 focus:bg-gold/10 rounded-lg">
                        <Link to={link.href} className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                            <link.icon className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <span className="font-medium text-sm">{link.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Dropdown - Premium styling */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-3 xl:px-4 py-2 text-[12px] xl:text-[13px] font-semibold whitespace-nowrap transition-all text-black hover:text-gold hover:bg-gold/10 rounded-full">
                    More
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="center" 
                  sideOffset={12}
                  className="bg-gradient-to-b from-white to-zinc-50 border border-gold/30 min-w-[200px] shadow-2xl shadow-black/30 py-4 rounded-xl overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
                  <div className="flex flex-col gap-1.5 px-2">
                    {moreLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild className="p-0 focus:bg-gold/10 rounded-lg">
                        <Link to={link.href} className="flex items-center gap-3 text-zinc-800 hover:text-gold hover:bg-gold/10 py-2.5 px-3 transition-all w-full group rounded-lg">
                          <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                            <link.icon className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <span className="font-medium text-sm">{link.label}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          {/* RIGHT: Actions - Smaller premium icon buttons with inverted hover */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            {/* Search Icon - White bg with gold icon normally, inverted on hover */}
            <Button
              variant="ghost"
              size="sm"
              className="relative w-9 h-9 p-0 rounded-full bg-white border border-gold/30 hover:bg-transparent hover:border-gold/50 transition-all duration-300 group"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-4 h-4 text-gold group-hover:text-gold-light transition-colors" />
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
                    {/* Main Navigation */}
                    {mainNavLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 border-l-2 transition-all ${
                          isActive(link.href)
                            ? "text-gold border-gold bg-gold/10"
                            : "text-zinc-300 border-transparent hover:text-white hover:bg-zinc-900/80 hover:border-gold/50"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}

                    <div className="h-px bg-zinc-800 my-4" />

                    {/* AI Home Finder CTA */}
                    <Link
                      to="/quiz"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/30 rounded-lg mb-4 text-white hover:from-gold/15 transition-all backdrop-blur-sm"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-gold to-gold-light rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-black" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">AI Home Finder</p>
                        <p className="text-gold/80 text-xs">Complimentary</p>
                      </div>
                    </Link>

                    {/* Property Shortcuts */}
                    <p className="px-4 py-2 text-xs text-gold/60 uppercase tracking-wider">Quick Access</p>
                    {propertyShortcuts.filter((s) => s.href !== "/quiz").map((shortcut) => (
                      <Link
                        key={shortcut.href}
                        to={shortcut.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors"
                      >
                        <shortcut.icon className="w-4 h-4 text-gold/70" />
                        {shortcut.label}
                      </Link>
                    ))}

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
                      className="relative text-gold hover:text-gold-light w-9 h-9 p-0 rounded-full border border-gold/20 hover:border-gold/50 hover:bg-gold/10 transition-all duration-300 group"
                      aria-label={t('nav.myAccount')}
                    >
                      <User className="w-4 h-4 group-hover:scale-110 transition-transform" />
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
