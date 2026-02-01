import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, Briefcase, Award, Phone, FileText, 
  AlertCircle, Heart, MessageSquare, BookOpen, BarChart3,
  GraduationCap, TrendingUp, UserCircle, ArrowRight
} from 'lucide-react';
import menuCorporateOffice from '@/assets/menu-corporate-office.jpg';

interface MegaMenuMoreProps {
  onClose: () => void;
}

const MegaMenuMore: React.FC<MegaMenuMoreProps> = ({ onClose }) => {
  const aboutLinks = [
    { name: 'About Us', href: '/about', icon: Building2 },
    { name: 'Meet the Team', href: '/team', icon: Users },
    { name: 'Careers', href: '/join', icon: Briefcase },
    { name: 'Our Awards', href: '/awards', icon: Award },
    { name: 'Contact Us', href: '/contact', icon: Phone },
  ];

  const resourceLinks = [
    { name: 'Real Estate Guides', href: '/guides', icon: BookOpen },
    { name: 'Complaint Procedure', href: '/complaint', icon: AlertCircle },
    { name: 'Philanthropy', href: '/philanthropy', icon: Heart },
    { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
  ];

  const guidesLinks = [
    { name: "Buyer's Guide", href: '/buyer-guide', icon: FileText },
    { name: "Seller's Guide", href: '/seller-guide', icon: FileText },
    { name: "Landlord Guide", href: '/landlord-guide', icon: FileText },
    { name: "Tenant's Guide", href: '/tenant-guide', icon: FileText },
    { name: "Golden Visa Guide", href: '/guides/golden-visa-uae', icon: Award },
    { name: "Investor Education", href: '/investor-education', icon: GraduationCap },
  ];

  const hubLinks = [
    { name: 'Investor Hub', href: '/my-account', icon: TrendingUp, description: 'Dashboard & Tools' },
    { name: 'Broker Hub', href: '/broker-dashboard', icon: UserCircle, description: 'Broker Resources' },
    { name: 'Market Intelligence', href: '/market-intelligence/overview', icon: BarChart3, description: 'Data & Reports' },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-black via-[#0a0a0a] to-black border-t-2 border-gold/50 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] z-50">
      {/* Top gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent animate-pulse" />
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* About Card - SQUARE */}
          <div className="col-span-4">
            <Link 
              to="/about" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl aspect-square transform transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(200,167,102,0.3)]"
              style={{ perspective: '1000px' }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${menuCorporateOffice})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
              <div className="absolute inset-0 border-2 border-gold/20 rounded-2xl group-hover:border-gold/50 transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <p className="text-gold text-xs font-bold tracking-[0.2em] uppercase mb-2">COMPANY</p>
                <h3 className="text-white text-lg font-bold mb-2">JBJ Global Real Estate</h3>
                <p className="text-white/70 text-sm mb-4 line-clamp-2">Excellence in Dubai real estate since 2015</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* About & Guides Combined */}
          <div className="col-span-4">
            <h4 className="text-gold font-bold text-xs tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              About JBJ Global
            </h4>
            <div className="space-y-1 mb-5">
              {aboutLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 transition-all shadow-lg">
                    <item.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
            
            <h4 className="text-gold font-bold text-xs tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resources
            </h4>
            <div className="space-y-1">
              {resourceLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 transition-all shadow-lg">
                    <item.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Guides & Hubs */}
          <div className="col-span-4">
            <h4 className="text-gold font-bold text-xs tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Guides & Education
            </h4>
            <div className="space-y-1 mb-5">
              {guidesLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/30 flex items-center justify-center group-hover:from-gold/30 group-hover:to-gold/10 transition-all shadow-lg">
                    <item.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              ))}
            </div>

            <h4 className="text-gold font-bold text-xs tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Hubs & Intelligence
            </h4>
            <div className="space-y-2">
              {hubLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-gold/10 transition-all group bg-gradient-to-br from-white/5 to-transparent border border-gold/20 hover:border-gold/40"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/40 flex items-center justify-center group-hover:from-gold/40 group-hover:to-gold/20 transition-all shadow-lg">
                    <item.icon className="w-5 h-5 text-gold" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm block">{item.name}</span>
                    <span className="text-xs text-white/50">{item.description}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gold accent with 3D effect */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/80 to-transparent shadow-[0_-5px_20px_rgba(200,167,102,0.3)]" />
    </div>
  );
};

export default MegaMenuMore;
