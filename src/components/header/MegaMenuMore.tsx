import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, Briefcase, Award, Phone, FileText, 
  AlertCircle, Heart, MessageSquare, BookOpen, BarChart3,
  GraduationCap, ArrowRight, Globe, MapPin
} from 'lucide-react';
import menuCorporateOffice from '@/assets/menu-corporate-office.jpg';

interface MegaMenuMoreProps {
  onClose: () => void;
}

const MegaMenuMore: React.FC<MegaMenuMoreProps> = ({ onClose }) => {
  const companyLinks = [
    { name: 'About JBJ Global Real Estate', href: '/about', icon: Building2 },
    { name: 'Meet the Team', href: '/team', icon: Users },
    { name: 'Careers', href: '/join', icon: Briefcase },
    { name: 'Awards & Recognition', href: '/awards', icon: Award },
    { name: 'Contact Us', href: '/contact', icon: Phone },
    { name: 'Philanthropy', href: '/philanthropy', icon: Heart },
    { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
    { name: 'Complaint Procedure', href: '/complaint', icon: AlertCircle },
  ];

  const guidesEducationLinks = [
    { name: 'All Guides', href: '/guides', icon: BookOpen, description: 'Browse all real estate guides' },
    { name: "Buyer's Guide", href: '/buyer-guide', icon: FileText },
    { name: "Seller's Guide", href: '/seller-guide', icon: FileText },
    { name: "Landlord Guide", href: '/landlord-guide', icon: FileText },
    { name: "Tenant's Guide", href: '/tenant-guide', icon: FileText },
    { name: "Golden Visa Guide", href: '/guides/golden-visa-uae', icon: Globe },
    { name: "Investor Education", href: '/investor-education', icon: GraduationCap },
  ];

  const marketIntelligenceLinks = [
    { name: 'Market Overview', href: '/market-intelligence/overview', icon: BarChart3, description: 'Dubai market trends & data' },
    { name: 'Area Intelligence', href: '/market-intelligence/areas', icon: MapPin, description: 'Location-specific insights' },
    { name: 'Market Reports', href: '/market-intelligence/reports', icon: FileText, description: 'In-depth analysis' },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-t-4 border-gold shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] z-50">
      {/* Top gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
      
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Featured Card - Company */}
          <div className="col-span-4">
            <Link 
              to="/about" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl aspect-[4/3] transform transition-all duration-500 hover:scale-[1.02]"
              style={{ 
                perspective: '1000px',
                boxShadow: '0 20px 50px -15px rgba(0,0,0,0.4), 0 0 0 2px rgba(200,167,102,0.3)'
              }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${menuCorporateOffice})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 border-2 border-gold/40 rounded-2xl group-hover:border-gold transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-xs font-bold tracking-[0.25em] uppercase mb-2">COMPANY</p>
                <h3 className="text-white text-xl font-bold mb-2">JBJ Global Real Estate</h3>
                <p className="text-white/80 text-sm mb-4">Excellence in Dubai real estate since 2015</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* Company Links */}
          <div className="col-span-3">
            <h4 className="text-black font-bold text-xs tracking-[0.2em] uppercase mb-5 flex items-center gap-2 pb-2 border-b border-gold/30">
              <Building2 className="w-4 h-4 text-gold" />
              Company
            </h4>
            <div className="space-y-0.5">
              {companyLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl text-black hover:text-white hover:bg-black transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-black border border-gold/50 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all shadow-lg">
                    <item.icon className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                  </div>
                  <span className="font-medium text-sm group-hover:text-gold">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Guides & Education */}
          <div className="col-span-2">
            <h4 className="text-black font-bold text-xs tracking-[0.2em] uppercase mb-5 flex items-center gap-2 pb-2 border-b border-gold/30">
              <BookOpen className="w-4 h-4 text-gold" />
              Guides
            </h4>
            <div className="space-y-0.5">
              {guidesEducationLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-2 py-2 px-2 rounded-xl text-black hover:text-white hover:bg-black transition-all group"
                >
                  <div className="w-7 h-7 rounded-lg bg-black border border-gold/50 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all shadow-lg shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-gold group-hover:text-black transition-colors" />
                  </div>
                  <span className="font-medium text-xs group-hover:text-gold">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Market Intelligence */}
          <div className="col-span-3">
            <h4 className="text-black font-bold text-xs tracking-[0.2em] uppercase mb-5 flex items-center gap-2 pb-2 border-b border-gold/30">
              <BarChart3 className="w-4 h-4 text-gold" />
              Market Intelligence
            </h4>
            <div className="space-y-2">
              {marketIntelligenceLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-3 px-3 rounded-xl text-black hover:text-white hover:bg-black transition-all group border border-gold/20 hover:border-gold/50"
                >
                  <div className="w-10 h-10 rounded-lg bg-black border border-gold/50 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all shadow-lg shrink-0">
                    <item.icon className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm block group-hover:text-gold">{item.name}</span>
                    <span className="text-xs text-black/60 group-hover:text-white/70">{item.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gold accent */}
      <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
    </div>
  );
};

export default MegaMenuMore;
