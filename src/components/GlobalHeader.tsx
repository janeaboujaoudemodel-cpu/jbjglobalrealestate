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
  Sparkles, Search, Users, BookOpen, ChevronDown
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
    { href: "/ai-hub", label: "Broker Hub", icon: Sparkles },
    { href: "/about", label: t('nav.about'), icon: Building2 },
    { href: "/contact", label: t('nav.contact'), icon: Phone },
  ];

  // Properties submenu items for Buy / Rent / New Projects
  const propertiesLinks = [
    { href: "/properties?transaction=buy", label: "Buy Properties", icon: Home },
    { href: "/properties?transaction=rent", label: "Rent Properties", icon: Building2 },
    { href: "/properties?status=off-plan", label: "New Projects (Off-Plan)", icon: Building2 },
    { href: "/properties", label: "All Properties", icon: Building2 },
  ];

  // Guides submenu items
  const guidesLinks = [
    { href: "/buyer-guide", label: t('nav.buyerGuide') || 'Buyer Guide', icon: FileText },
    { href: "/seller-guide", label: t('nav.sellerGuide') || 'Seller Guide', icon: FileText },
    { href: "/areas", label: t('nav.areaGuides') || 'Area Guides', icon: Building2 },
    { href: "/faq", label: 'FAQ', icon: ClipboardCheck },
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
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-b from-black via-black/98 to-black/95 backdrop-blur-xl border-b border-gold/10 shadow-lg shadow-black/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center h-16 lg:h-[72px]">
          
          {/* LEFT: Brand Logo - Monogram + Text */}
          <Link 
            to="/" 
            className="flex items-center gap-3 shrink-0 hover:opacity-90 transition-opacity"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <img 
              src={jbjMonogramDarkBg} 
              alt="JBJ" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-white font-semibold text-sm sm:text-base lg:text-lg tracking-[0.12em] uppercase whitespace-nowrap hidden sm:inline">
              JBJ Global Real Estate
            </span>
          </Link>

          {/* CENTER: Desktop Navigation - Compact with Properties & Guides dropdowns */}
          <nav className="hidden lg:flex items-center justify-center flex-1 mx-2">
            <div className="flex items-center gap-0">
              {mainNavLinks.slice(0, 1).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-2 xl:px-2.5 py-2 text-[12px] xl:text-[13px] font-medium whitespace-nowrap transition-all relative group ${
                    isActive(link.href) 
                      ? "text-gold" 
                      : "text-zinc-300 hover:text-gold"
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-gold/80 to-gold transition-transform origin-left ${
                    isActive(link.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`} />
                </Link>
              ))}

              {/* Properties Dropdown - Buy / Rent / New Projects */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-1 px-2 xl:px-2.5 py-2 text-[12px] xl:text-[13px] font-medium whitespace-nowrap transition-all ${
                    location.pathname === '/properties' ? 'text-gold' : 'text-zinc-300 hover:text-gold'
                  }`}>
                    <Building2 className="w-3 h-3" />
                    {t('nav.properties')}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-black border-zinc-800 min-w-[200px]">
                  {propertiesLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href} className="flex items-center gap-2 text-zinc-300 hover:text-gold">
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {mainNavLinks.slice(1).map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-2 xl:px-2.5 py-2 text-[12px] xl:text-[13px] font-medium whitespace-nowrap transition-all relative group ${
                    isActive(link.href) 
                      ? "text-gold" 
                      : "text-zinc-300 hover:text-gold"
                  }`}
                >
                  {link.label}
                  <span className={`absolute bottom-0 left-2 right-2 h-[2px] bg-gradient-to-r from-gold/80 to-gold transition-transform origin-left ${
                    isActive(link.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`} />
                </Link>
              ))}

              {/* Guides Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-2 xl:px-2.5 py-2 text-[12px] xl:text-[13px] font-medium whitespace-nowrap transition-all text-zinc-300 hover:text-gold">
                    <BookOpen className="w-3 h-3" />
                    Guides
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-black border-zinc-800 min-w-[160px]">
                  {guidesLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href} className="flex items-center gap-2 text-zinc-300 hover:text-gold">
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* More Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1 px-2 xl:px-2.5 py-2 text-[12px] xl:text-[13px] font-medium whitespace-nowrap transition-all text-zinc-300 hover:text-gold">
                    More
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="bg-black border-zinc-800 min-w-[160px]">
                  {moreLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link to={link.href} className="flex items-center gap-2 text-zinc-300 hover:text-gold">
                        <link.icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          {/* RIGHT: Actions (search, favorites, language, menu, user) - Gold themed */}
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {/* Search Icon - Gold */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gold hover:text-gold-light hover:bg-gold/10 shrink-0 w-8 h-8 lg:w-9 lg:h-9 p-0"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-4 h-4 lg:w-5 lg:h-5" />
            </Button>

            {/* Favorites - Gold icon */}
            <Link to="/favorites" className="shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="text-gold hover:text-gold-light hover:bg-gold/10 relative w-8 h-8 lg:w-9 lg:h-9 p-0"
              >
                <Heart className="w-4 h-4 lg:w-5 lg:h-5" />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-black rounded-full text-[10px] font-semibold flex items-center justify-center">
                    {totalCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Language Switcher - Gold themed */}
            <div className="shrink-0">
              <LanguageSwitcher />
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

            {/* User Menu - Desktop (Icon only, no email shown) */}
            <div className="hidden lg:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-gold hover:text-gold-light hover:bg-gold/10 w-9 h-9"
                      aria-label={t('nav.myAccount')}
                    >
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black border-zinc-800 min-w-[180px]">
                    <div className="px-3 py-2 text-gold font-semibold border-b border-zinc-800">
                      {t('nav.myAccount')}
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/my-account" className="flex items-center gap-2 text-zinc-300">
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center gap-2 text-zinc-300">
                        <Heart className="w-4 h-4" />
                        {t('nav.favorites')}
                      </Link>
                    </DropdownMenuItem>
                    {hasCRMAccess && (
                      <DropdownMenuItem asChild>
                        <Link to="/crm" className="flex items-center gap-2 text-zinc-300">
                          <Users className="w-4 h-4" />
                          {t('nav.crm') || 'CRM Dashboard'}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 text-zinc-300">
                          <Settings className="w-4 h-4" />
                          {t('nav.admin')}
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem onClick={() => signOut()} className="text-zinc-300">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('nav.signOut')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="icon" className="text-gold hover:text-gold-light hover:bg-gold/10 w-9 h-9">
                    <User className="w-5 h-5" />
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
