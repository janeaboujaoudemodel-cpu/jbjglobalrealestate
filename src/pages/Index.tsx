import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NavigationTabs from "@/components/NavigationTabs";
import DeveloperGrid from "@/components/DeveloperGrid";
import WelcomeModal from "@/components/WelcomeModal";
import { Settings, Heart, ListPlus, Sparkles, User, LogOut, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites, useShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const INQUIRY_FORM_URL = "https://jjglobalcapital.com/form/property-investment-inquiry-form/";

const Index = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { data: favorites } = useFavorites();
  const { data: shortlist } = useShortlist();
  const { favorites: guestFavorites } = useGuestFavorites();
  const { shortlist: guestShortlist } = useGuestShortlist();

  const favCount = user ? (favorites?.length || 0) : guestFavorites.length;
  const shortlistCount = user ? (shortlist?.length || 0) : guestShortlist.length;

  return (
    <section className="relative w-full min-h-screen py-16 md:py-24 bg-zinc-950">
      {/* Welcome Modal for first-time visitors */}
      <WelcomeModal />

      {/* Subtle gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none bg-gradient-to-b from-zinc-900/50 to-transparent" />

      {/* Header with Favorites & Shortlist shortcuts */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        {/* Favorites Shortcut */}
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

        {/* Shortlist Shortcut */}
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

      <div className="relative z-10 container mx-auto px-4">
        <h1 className="text-white text-4xl md:text-6xl font-bold mb-4">
          UAE Real Estate
        </h1>
        <p className="text-zinc-400 text-lg mb-8 max-w-2xl">
          Discover premium properties from the UAE's top developers across exclusive communities
        </p>

        {/* Quiz CTA - Purple/Violet theme with arrow */}
        <Link to="/quiz">
          <Button className="mb-10 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-6 py-3 h-auto shadow-lg shadow-purple-500/30 group">
            <Sparkles className="w-5 h-5 mr-2" />
            Take the Property Quiz
            <ArrowDown className="w-4 h-4 ml-2 group-hover:translate-y-0.5 transition-transform" />
            <span className="ml-2 text-xs opacity-70">~30 sec</span>
          </Button>
        </Link>

        <NavigationTabs />
        <DeveloperGrid />

        {/* Contact CTA Section */}
        <div className="mt-20 text-center py-16 border-t border-zinc-800">
          <h3 className="text-2xl font-semibold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Ready to Invest?
          </h3>
          <p className="text-zinc-400 mb-6 max-w-xl mx-auto">
            Get personalized investment advice from our expert team
          </p>
          <a href={INQUIRY_FORM_URL} target="_blank" rel="noopener noreferrer">
            <Button className="bg-gradient-to-r from-gold to-gold-dark text-black hover:opacity-90 px-8 py-3 h-auto font-semibold">
              Contact Us
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Index;
