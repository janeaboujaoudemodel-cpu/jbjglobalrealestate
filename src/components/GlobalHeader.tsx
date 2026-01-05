import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Home, Heart, User, LogOut, Settings, Menu, 
  Phone, Building2, Newspaper, ClipboardCheck, FileText,
  Sparkles, Search
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
import { JJLogoHeader } from "@/components/JJLogo";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import GlobalSearchModal from "@/components/GlobalSearchModal";

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

  // Updated navigation order: Home, Founder, About, Properties, Services, Awards, News, Contact
  const mainNavLinks = [
    { href: "/", label: t('nav.home'), icon: Home },
    { href: "/founder", label: t('nav.founder'), icon: User },
    { href: "/about", label: t('nav.about'), icon: Building2 },
    { href: "/properties", label: t('nav.properties'), icon: Building2 },
    { href: "/#services", label: t('nav.services'), icon: Building2 },
    { href: "/awards", label: t('nav.awards'), icon: Building2 },
    { href: "/news", label: t('nav.news'), icon: Newspaper },
    { href: "/contact", label: t('nav.contact'), icon: Phone },
  ];

  // Property shortcuts for quick access
  const propertyShortcuts = [
    { href: "/properties?status=off-plan", label: "Off-Plan", icon: Building2 },
    { href: "/properties?status=ready", label: "Ready to Move", icon: ClipboardCheck },
    { href: "/quiz", label: "AI Home Finder", icon: Sparkles },
    { href: "/market-report", label: "Market Report", icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-b from-black via-black/98 to-black/95 backdrop-blur-xl border-b border-gold/10 shadow-lg shadow-black/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo - Premium with separation from menu, clickable to home */}
          <Link to="/" className="flex items-center pr-8 lg:pr-12 hover:opacity-90 transition-opacity">
            <JJLogoHeader />
          </Link>

          {/* Desktop Navigation - Single line items with gold underline hover */}
          <nav className="hidden md:flex items-center flex-1 justify-center">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 xl:px-4 py-2 text-[13px] xl:text-[14px] font-medium whitespace-nowrap transition-all relative group ${
                  isActive(link.href) 
                    ? "text-gold" 
                    : "text-zinc-300 hover:text-gold"
                }`}
              >
                {link.label}
                {/* Gold underline for active/hover */}
                <span className={`absolute bottom-0 left-3 right-3 h-[2px] bg-gradient-to-r from-gold/80 to-gold transition-transform origin-left ${
                  isActive(link.href) ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                }`} />
              </Link>
            ))}
          </nav>

          {/* Right Side Actions - Gold icons */}
          <div className="flex items-center gap-2">
            {/* Search Icon - Opens Global Search Modal */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gold hover:text-gold/80 hover:bg-gold/10"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Favorites - Gold icon */}
            <Link to="/favorites">
              <Button variant="ghost" size="sm" className="text-gold hover:text-gold/80 hover:bg-gold/10 relative">
                <Heart className="w-5 h-5" />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-black rounded-full text-[10px] font-semibold flex items-center justify-center">
                    {totalCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* User Menu - Desktop */}
            <div className="hidden md:block">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                      <User className="w-4 h-4 mr-2" />
                      {user.email?.split("@")[0]}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-black border-zinc-800">
                    <DropdownMenuItem asChild>
                      <Link to="/favorites" className="flex items-center gap-2 text-zinc-300">
                        <Heart className="w-4 h-4" />
                        My Favorites & Shortlist
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2 text-zinc-300">
                          <Settings className="w-4 h-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-zinc-800" />
                    <DropdownMenuItem onClick={() => signOut()} className="text-zinc-300">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" className="text-zinc-400 hover:text-white hover:bg-zinc-800">
                    Sign In
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white ml-1">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black/95 backdrop-blur-xl border-zinc-800/50 w-[300px] p-0 flex flex-col h-full">
                {/* Menu Header with glassmorphism */}
                <div className="relative h-28 bg-gradient-to-b from-zinc-900/80 to-black/90 border-b border-gold/20 flex items-end p-5 shrink-0 backdrop-blur-sm">
                  <JJLogoHeader />
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
                    {propertyShortcuts.filter(s => s.href !== '/quiz').map((shortcut) => (
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
                      <span>Favorites</span>
                      <span className="text-zinc-600">|</span>
                      <span>Shortlist</span>
                      {totalCount > 0 && (
                        <span className="ml-auto bg-gold text-black text-xs px-2 py-0.5 rounded-full font-medium">
                          {totalCount}
                        </span>
                      )}
                    </Link>

                    <div className="h-px bg-zinc-800 my-4" />

                    {user ? (
                      <>
                        <div className="px-4 py-2 text-zinc-500 text-sm">
                          Signed in as {user.email?.split("@")[0]}
                        </div>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                          >
                            <Settings className="w-5 h-5" />
                            Admin Panel
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
                          Sign Out
                        </button>
                      </>
                    ) : (
                      <Link
                        to="/auth"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gold hover:text-gold/80 hover:bg-gold/10 transition-colors"
                      >
                        <User className="w-5 h-5" />
                        Sign In / Create Account
                      </Link>
                    )}
                  </nav>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>
        </div>

      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
};

export default GlobalHeader;
