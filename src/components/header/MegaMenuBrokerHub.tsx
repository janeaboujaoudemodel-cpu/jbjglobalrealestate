import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserCircle, Briefcase, GraduationCap, FolderOpen, 
  ClipboardCheck, Users, Award, ArrowRight
} from 'lucide-react';
import menuOffplanProject from '@/assets/menu-offplan-project.jpg';

interface MegaMenuBrokerHubProps {
  onClose: () => void;
}

const MegaMenuBrokerHub: React.FC<MegaMenuBrokerHubProps> = ({ onClose }) => {
  const brokerDashboardLinks = [
    { name: 'Broker Dashboard', href: '/broker-dashboard', icon: UserCircle, description: 'Your broker control center' },
    { name: 'Broker Toolkit', href: '/broker-toolkit#tools', icon: Briefcase, description: 'Professional tools & resources' },
    { name: 'Partner Program', href: '/partners', icon: Users, description: 'Join our partner network' },
  ];

  const educationLinks = [
    { name: 'Broker Education', href: '/broker-education', icon: GraduationCap },
    { name: 'Broker Resources', href: '/broker-resources', icon: FolderOpen },
    { name: 'Broker FAQ', href: '/broker-faq', icon: ClipboardCheck },
    { name: 'Certifications', href: '/broker-certifications', icon: Award },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-t-4 border-gold shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] z-50">
      {/* Top gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
      
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Featured Card */}
          <div className="col-span-5">
            <Link 
              to="/broker-dashboard" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl aspect-[4/3] transform transition-all duration-500 hover:scale-[1.02]"
              style={{ 
                perspective: '1000px',
                boxShadow: '0 20px 50px -15px rgba(0,0,0,0.4), 0 0 0 2px rgba(200,167,102,0.3)'
              }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${menuOffplanProject})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 border-2 border-gold/40 rounded-2xl group-hover:border-gold transition-colors" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-xs font-bold tracking-[0.25em] uppercase mb-2">BROKER HUB</p>
                <h3 className="text-white text-xl font-bold mb-2">Your Broker Dashboard</h3>
                <p className="text-white/80 text-sm mb-4">Access tools, education, and resources for brokers</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* Dashboard & Tools */}
          <div className="col-span-4">
            <h4 className="text-black font-bold text-xs tracking-[0.2em] uppercase mb-5 flex items-center gap-2 pb-2 border-b border-gold/30">
              <Briefcase className="w-4 h-4 text-gold" />
              Dashboard & Tools
            </h4>
            <div className="space-y-2">
              {brokerDashboardLinks.map((item) => (
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

          {/* Education & Resources */}
          <div className="col-span-3">
            <h4 className="text-black font-bold text-xs tracking-[0.2em] uppercase mb-5 flex items-center gap-2 pb-2 border-b border-gold/30">
              <GraduationCap className="w-4 h-4 text-gold" />
              Education & Resources
            </h4>
            <div className="space-y-1">
              {educationLinks.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-black hover:text-white hover:bg-black transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-black border border-gold/50 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all shadow-lg">
                    <item.icon className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                  </div>
                  <span className="font-medium text-sm group-hover:text-gold">{item.name}</span>
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

export default MegaMenuBrokerHub;
