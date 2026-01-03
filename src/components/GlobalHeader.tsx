import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { Home, Heart, ListPlus, User, LogOut, Settings, Menu, X, Phone, Info, Building2 } from "lucide-react";
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

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/#properties", label: "Browse Properties", icon: Building2 },
    { href: INQUIRY_FORM_URL, label: "Contact Us", icon: Phone, external: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
              JJ <span className="text-gold">Global Capital</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800/50"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    isActive(link.href) 
                      ? "text-gold bg-gold/10" 
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                  }`}
                >
                  {link.label}
                </Link>
              )
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Favorites */}
            <Link to="/favorites">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 relative">
                <Heart className="w-4 h-4" />
                {favCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                    {favCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Shortlist */}
            <Link to="/favorites?tab=shortlist">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 relative">
                <ListPlus className="w-4 h-4" />
                {shortlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full text-[10px] text-black flex items-center justify-center">
                    {shortlistCount}
                  </span>
                )}
              </Button>
            </Link>

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
                  <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
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
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-zinc-950 border-zinc-800 w-[280px]">
                <SheetHeader>
                  <SheetTitle className="text-white text-left">
                    JJ <span className="text-gold">Global Capital</span>
                  </SheetTitle>
                </SheetHeader>
                
                <nav className="flex flex-col gap-2 mt-8">
                  {navLinks.map((link) => (
                    link.external ? (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
                      >
                        <link.icon className="w-5 h-5" />
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive(link.href)
                            ? "text-gold bg-gold/10"
                            : "text-zinc-300 hover:text-white hover:bg-zinc-800/50"
                        }`}
                      >
                        <link.icon className="w-5 h-5" />
                        {link.label}
                      </Link>
                    )
                  ))}

                  <div className="h-px bg-zinc-800 my-4" />

                  <Link
                    to="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
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
                    className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
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
                          className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors"
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
                        className="flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-lg transition-colors w-full text-left"
                      >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gold hover:text-gold-light hover:bg-gold/10 rounded-lg transition-colors"
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
      </div>
    </header>
  );
};

export default GlobalHeader;
