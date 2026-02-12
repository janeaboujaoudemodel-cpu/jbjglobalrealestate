import { Link, useLocation } from "react-router-dom";
import { Building2, BarChart3, BookOpen, Briefcase, Users, Phone } from "lucide-react";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";

const NAV_ITEMS = [
  { label: "Off-plan", href: "/properties", icon: Building2 },
  { label: "Market", href: "/market-intelligence", icon: BarChart3 },
  { label: "Guides", href: "/guides", icon: BookOpen },
  { label: "Services", href: "/services", icon: Briefcase },
  { label: "About", href: "/about", icon: Users },
  { label: "Contact", href: "/contact", icon: Phone },
];

export default function PropertiesVerticalNav() {
  const location = useLocation();

  return (
    <div className="w-[200px] flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-gold/30 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gold/20 flex items-center gap-2">
        <img src={jbjMonogramLightBg} alt="JBJ" className="w-8 h-8 object-contain" />
        <span className="text-xs font-bold text-black tracking-wide" style={{ fontFamily: "Poppins, sans-serif" }}>
          JBJ GLOBAL
        </span>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href || (item.href === "/properties" && location.pathname.startsWith("/properties"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-gradient-to-r from-gold/20 to-gold/10 text-black border border-gold/40 font-bold"
                  : "text-black/70 hover:bg-white/60 hover:text-black"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-gold" : "text-black/50"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gold/20 text-center">
        <a
          href="mailto:info@jbjglobal.com"
          className="text-[10px] text-black/50 hover:text-gold transition-colors block mb-2"
        >
          Contact Support
        </a>
        <img src={jbjMonogramLightBg} alt="JBJ" className="w-6 h-6 object-contain mx-auto opacity-40" />
      </div>
    </div>
  );
}
