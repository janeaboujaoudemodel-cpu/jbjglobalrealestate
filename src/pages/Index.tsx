import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NavigationTabs from "@/components/NavigationTabs";
import DeveloperGrid from "@/components/DeveloperGrid";
import { Settings, Heart, Sparkles, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Index = () => {
  const { user, isAdmin, signOut } = useAuth();

  return (
    <section className="relative w-full min-h-screen py-16 md:py-24 bg-zinc-950">
      {/* Subtle gradient */}
      <div className="absolute top-0 left-0 right-0 h-[400px] pointer-events-none bg-gradient-to-b from-zinc-900/50 to-transparent" />

      {/* Header */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
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

        {/* Quiz CTA */}
        <Link to="/quiz">
          <Button className="mb-10 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-light hover:to-gold text-gold-foreground px-6 py-3 h-auto shadow-lg shadow-gold/20">
            <Sparkles className="w-5 h-5 mr-2" />
            Take the Property Quiz
            <span className="ml-2 text-xs opacity-70">~30 sec</span>
          </Button>
        </Link>

        <NavigationTabs />
        <DeveloperGrid />
      </div>
    </section>
  );
};

export default Index;
