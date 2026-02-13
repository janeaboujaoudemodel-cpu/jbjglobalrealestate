import { Link, useLocation } from "react-router-dom";
import { Building2, BarChart3, BookOpen, Briefcase, Users, Home, Tag, Key, PlusCircle, Building, Layers, Cpu, Heart, GitCompare, Calculator, Headphones } from "lucide-react";
import jbjMonogramLightBg from "@/assets/jbj-monogram-light-bg.png";

const NAV_ITEMS = [
  { label: "Off-plan", href: "/properties", icon: Building2 },
  { label: "Buy", href: "/buy", icon: Home },
  { label: "Sell", href: "/sell", icon: Tag },
  { label: "Rent", href: "/rent", icon: Key },
  { label: "List Property", href: "/list-property", icon: PlusCircle },
  { label: "Developers", href: "/developers", icon: Building },
  { label: "Projects", href: "/projects", icon: Layers },
  { label: "AI Tools", href: "/toolkit", icon: Cpu },
  { label: "Market Intel", href: "/market-intelligence", icon: BarChart3 },
  { label: "Guides", href: "/guides", icon: BookOpen },
  { label: "Services", href: "/services", icon: Briefcase },
  { label: "About", href: "/about", icon: Users },
  { label: "Favorites", href: "/favorites", icon: Heart },
  { label: "Compare", href: "/compare", icon: GitCompare },
  { label: "Mortgage Calc", href: "/mortgage-calculator", icon: Calculator },
];

export default function PropertiesVerticalNav() {
  const location = useLocation();

  return (
    <div className="w-[200px] flex-shrink-0 bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-r border-gold/30 flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-gold/20 flex items-center gap-3">
        <img src={jbjMonogramLightBg} alt="JBJ" className="w-12 h-12 object-contain" />
        <div className="flex flex-col" style={{ fontFamily: "Poppins, sans-serif" }}>
          <span className="text-[11px] font-bold text-black tracking-wide leading-tight">JBJ GLOBAL</span>
          <span className="text-[11px] font-bold text-gold tracking-wide leading-tight">REAL ESTATE</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.href || (item.href === "/properties" && location.pathname.startsWith("/properties"));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all ${
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
      <div className="p-4 border-t border-gold/20 space-y-2">
        <a
          href="mailto:info@jbjglobal.com"
          className="flex items-center gap-2 text-sm font-bold text-gold hover:text-gold-dark transition-colors"
        >
          <Headphones className="w-4 h-4" />
          Contact Support
        </a>
        <a
          href="/support"
          className="text-xs text-black/60 hover:text-gold transition-colors block pl-6"
        >
          Raise a Support Ticket
        </a>
      </div>
    </div>
  );
}
