import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import NavigationTabs from "@/components/NavigationTabs";
import DeveloperGrid from "@/components/DeveloperGrid";
import { Settings } from "lucide-react";

const Index = () => {
  const { user, isAdmin } = useAuth();

  return (
    <section
      className="relative w-full min-h-screen py-16 md:py-24"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #0d0d0d 50%, #080808 100%)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[40%] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 0%, rgba(212, 160, 23, 0.08) 0%, transparent 60%)",
        }}
      />

      {/* Admin Link */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        {isAdmin && (
          <Link
            to="/admin"
            className="flex items-center gap-2 px-4 py-2 bg-[#D4A017]/20 text-[#D4A017] rounded-lg hover:bg-[#D4A017]/30 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Admin Panel
          </Link>
        )}
        {!user && (
          <Link
            to="/auth"
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
        )}
      </div>

      <div className="relative z-10 container mx-auto px-4">
        <h1
          className="text-white font-bold mb-4"
          style={{
            fontFamily: "Poppins, sans-serif",
            fontSize: "clamp(32px, 5vw, 64px)",
            lineHeight: "1.1",
          }}
        >
          UAE Real Estate
        </h1>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl" style={{ fontFamily: "Poppins, sans-serif" }}>
          Discover premium properties from the UAE's top developers across exclusive communities
        </p>

        <NavigationTabs />
        <DeveloperGrid />
      </div>
    </section>
  );
};

export default Index;
