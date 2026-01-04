import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { 
  Home, Heart, ListPlus, User, LogOut, Settings, Menu, 
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
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

// Premium Logo Component
const JJLogo = ({ className = "" }: { className?: string }) => (
  <span className={`font-bold tracking-wide ${className}`} style={{ fontFamily: "Poppins, sans-serif" }}>
    <span className="text-gold">J</span>
    <span className="text-gold mx-1">|</span>
    <span className="text-gold">J</span>
    <span className="text-white ml-2">GLOBAL CAPITAL</span>
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

  const mainNavLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#properties", label: "Properties", icon: Building2 },
    { href: "/news", label: "News & Insights", icon: Newspaper },
    { href: INQUIRY_FORM_URL, label: "Contact", icon: Phone, external: true },
  ];

  // Property shortcuts for quick access
  const propertyShortcuts = [
    { href: "/?status=off-plan", label: "Off-Plan", icon: Building2 },
    { href: "/?status=ready", label: "Ready to Move", icon: ClipboardCheck },
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
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 text-sm transition-colors ${
                    isActive(link.href) 
                      ? "text-white bg-zinc-800" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1">
            {/* Favorites - links to both favorites & shortlist page */}
            <Link to="/favorites">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 relative">
                <Heart className="w-4 h-4" />
                {(favCount + shortlistCount) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {favCount + shortlistCount}
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
                        My Favorites
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
              <SheetContent side="right" className="bg-black border-zinc-800 w-[300px] p-0">
                {/* Menu Header with logo background */}
                <div className="relative h-32 bg-gradient-to-b from-zinc-900 to-black border-b border-zinc-800 flex items-end p-6">
                  <JJLogo className="text-lg" />
                </div>
                
                <nav className="flex flex-col p-4">
                  {/* Main Navigation */}
                  {mainNavLinks.map((link) => (
                    link.external ? (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-900 border-l-2 border-transparent hover:border-gold transition-all"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 border-l-2 transition-all ${
                          isActive(link.href)
                            ? "text-gold border-gold bg-gold/5"
                            : "text-zinc-300 border-transparent hover:text-white hover:bg-zinc-900 hover:border-gold"
                        }`}
                      >
                        {link.label}
                      </Link>
                    )
                  ))}

                  <div className="h-px bg-zinc-800 my-4" />

                  {/* Property Shortcuts */}
                  <p className="px-4 py-2 text-xs text-zinc-500 uppercase tracking-wider">Quick Access</p>
                  {propertyShortcuts.map((shortcut) => (
                    <Link
                      key={shortcut.href}
                      to={shortcut.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
                    >
                      <shortcut.icon className="w-4 h-4 text-gold/70" />
                      {shortcut.label}
                    </Link>
                  ))}

                  <div className="h-px bg-zinc-800 my-4" />

                  {/* User Actions */}
                  <Link
                    to="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                  >
                    <Heart className="w-5 h-5" />
                    Favorites
                    {favCount > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {favCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    to="/favorites?tab=shortlist"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
                  >
                    <ListPlus className="w-5 h-5" />
                    Shortlist
                    {shortlistCount > 0 && (
                      <span className="ml-auto bg-gold text-black text-xs px-2 py-0.5 rounded-full">
                        {shortlistCount}
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
                      className="flex items-center gap-3 px-4 py-3 text-gold hover:text-gold-light hover:bg-gold/10 transition-colors"
                    >
                      <User className="w-5 h-5" />
                      Sign In / Create Account
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Desktop Property Shortcuts Bar - No border/divider */}
        <div className="hidden lg:flex items-center gap-4 pb-3 pt-1">
          {propertyShortcuts.filter(s => s.href !== '/quiz').map((shortcut) => (
            <Link
              key={shortcut.href}
              to={shortcut.href}
              className="flex items-center gap-2 text-xs text-zinc-500 hover:text-gold transition-colors"
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
