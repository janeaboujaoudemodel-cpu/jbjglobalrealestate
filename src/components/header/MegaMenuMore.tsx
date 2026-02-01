import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, Users, Briefcase, Award, Phone, FileText, 
  AlertCircle, Heart, MessageSquare 
} from 'lucide-react';

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
    { name: 'Real Estate Guides', href: '/guides', icon: FileText },
    { name: 'Complaint Procedure', href: '/complaint', icon: AlertCircle },
    { name: 'Philanthropy', href: '/philanthropy', icon: Heart },
    { name: 'Testimonials', href: '/testimonials', icon: MessageSquare },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-t-2 border-gold/40 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* About Card */}
          <div className="col-span-4">
            <Link 
              to="/about" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl h-full min-h-[260px]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-sm font-medium tracking-wider uppercase mb-2">Company</p>
                <h3 className="text-white text-xl font-bold mb-2">About JBJ Global</h3>
                <p className="text-white/70 text-sm mb-4">Excellence in Dubai real estate since 2015</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Learn More
                  <span className="text-lg">→</span>
                </span>
              </div>
            </Link>
          </div>

          {/* About Links */}
          <div className="col-span-4">
            <h4 className="text-gold font-semibold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              About JBJ
            </h4>
            <div className="space-y-1">
              {aboutLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <item.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Resource Links */}
          <div className="col-span-4">
            <h4 className="text-gold font-semibold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resources
            </h4>
            <div className="space-y-1">
              {resourceLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-white/5 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center group-hover:bg-gold/20 transition-colors">
                    <item.icon className="w-4 h-4 text-gold" />
                  </div>
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom gold accent */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
    </div>
  );
};

export default MegaMenuMore;
