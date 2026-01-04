import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { 
  Home, Heart, User, LogOut, Settings, Menu, 
  Phone, Building2, Newspaper, ClipboardCheck, FileText,
  Sparkles
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

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

// Premium Logo Component - Thinner divider, closer J letters, improved GLOBAL CAPITAL visibility
const JJLogo = ({ className = "" }: { className?: string }) => (
  <span className={`tracking-wide flex items-center ${className}`} style={{ fontFamily: "Poppins, sans-serif" }}>
    <span className="text-[#A8925A] font-extralight text-xl md:text-2xl">J</span>
    <span className="text-white/95 mx-1.5 font-thin text-2xl md:text-3xl leading-none" style={{ transform: 'scaleY(1.35)' }}>|</span>
    <span className="text-[#A8925A] font-extralight text-xl md:text-2xl">J</span>
    <span className="text-white font-medium tracking-[0.12em] ml-2.5 text-[11px] md:text-xs">GLOBAL CAPITAL</span>
  </span>
);

const GlobalHeader = () => {
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: favorites } = useFavorites();
  const { data: shortlist } = useShortlist();
  const { favorites: guestFavorites } = useGuestFavorites();
  const { shortlist: guestShortlist } = useGuestShortlist();

  const favCount = user ? (favorites?.length || 0) : guestFavorites.length;
  const shortlistCount = user ? (shortlist?.length || 0) : guestShortlist.length;
  const totalCount = favCount + shortlistCount;

  // Updated navigation order as per task
  const mainNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/founder", label: "Founder & Leadership", icon: User },
    { href: "/about", label: "About Us", icon: Building2 },
    { href: "/properties", label: "Properties", icon: Building2 },
    { href: "/awards", label: "Awards", icon: Building2 },
    { href: "/news", label: "News & Insights", icon: Newspaper },
    { href: "/contact", label: "Contact", icon: Phone },
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-black">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <JJLogo className="text-lg md:text-xl" />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-3 py-2 text-sm transition-colors ${
                  isActive(link.href) 
                    ? "text-white bg-zinc-800" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1">
            {/* Favorites - combined count for fav + shortlist, single destination */}
            <Link to="/favorites">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 relative">
                <Heart className="w-4 h-4" />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {totalCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* User Menu - Desktop */}
            <div className="hidden lg:block">
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
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white ml-1">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-black/95 backdrop-blur-xl border-zinc-800/50 w-[300px] p-0 flex flex-col h-full">
                {/* Menu Header with glassmorphism */}
                <div className="relative h-28 bg-gradient-to-b from-zinc-900/80 to-black/90 border-b border-[#A8925A]/20 flex items-end p-5 shrink-0 backdrop-blur-sm">
                  <JJLogo className="text-lg" />
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
                            ? "text-[#A8925A] border-[#A8925A] bg-[#A8925A]/10"
                            : "text-zinc-300 border-transparent hover:text-white hover:bg-zinc-900/80 hover:border-[#A8925A]/50"
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
                      className="flex items-center gap-3 px-4 py-4 bg-gradient-to-r from-[#A8925A]/10 to-[#A8925A]/5 border border-[#A8925A]/30 rounded-lg mb-4 text-white hover:from-[#A8925A]/15 transition-all backdrop-blur-sm"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-[#A8925A] to-[#C4A962] rounded-lg flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-black" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">AI Home Finder</p>
                        <p className="text-[#A8925A]/80 text-xs">Complimentary</p>
                      </div>
                    </Link>

                    {/* Property Shortcuts */}
                    <p className="px-4 py-2 text-xs text-[#A8925A]/60 uppercase tracking-wider">Quick Access</p>
                    {propertyShortcuts.filter(s => s.href !== '/quiz').map((shortcut) => (
                      <Link
                        key={shortcut.href}
                        to={shortcut.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-colors"
                      >
                        <shortcut.icon className="w-4 h-4 text-[#A8925A]/70" />
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
                        <span className="ml-auto bg-[#A8925A] text-black text-xs px-2 py-0.5 rounded-full font-medium">
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
                        className="flex items-center gap-3 px-4 py-3 text-[#A8925A] hover:text-[#A8925A]/80 hover:bg-[#A8925A]/10 transition-colors"
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

        {/* Desktop Property Shortcuts Bar */}
        <div className="hidden lg:flex items-center gap-4 pb-3 pt-1">
          {propertyShortcuts.filter(s => s.href !== '/quiz').map((shortcut) => (
            <Link
              key={shortcut.href}
              to={shortcut.href}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-[#A8925A] transition-colors"
            >
              <shortcut.icon className="w-3.5 h-3.5" />
              {shortcut.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
};

export default GlobalHeader;