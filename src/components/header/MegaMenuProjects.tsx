import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, Calendar, Check, Sparkles, Eye, ArrowRight } from 'lucide-react';
import menuOffplanProject from '@/assets/menu-offplan-project.jpg';
import menuDubaiSkyline from '@/assets/menu-dubai-skyline.jpg';

interface MegaMenuProjectsProps {
  onClose: () => void;
}

const MegaMenuProjects: React.FC<MegaMenuProjectsProps> = ({ onClose }) => {
  const projectCategories = [
    { label: 'Off-Plan Projects', href: '/properties?status=off-plan', icon: Building2 },
    { label: 'Ready Projects', href: '/properties?status=ready', icon: Check },
    { label: 'New Launches', href: '/properties?sort=newest', icon: Sparkles },
    { label: 'Handover Soon', href: '/properties?handover=2025', icon: Calendar },
    { label: 'View All Projects', href: '/properties', icon: Eye },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-t-4 border-gold shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] z-50">
      {/* Top gold shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
      
      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <div className="grid grid-cols-12 gap-8">
          {/* Featured Card - All Projects */}
          <div className="col-span-4">
            <Link 
              to="/properties" 
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
                <p className="text-gold text-xs font-bold tracking-[0.25em] uppercase mb-2">OFF-PLAN</p>
                <h3 className="text-white text-xl font-bold mb-2">Dubai Off-Plan Projects</h3>
                <p className="text-white/80 text-sm mb-4">Invest in Dubai's most promising developments</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  View All Projects
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* New Launch Card */}
          <div className="col-span-4">
            <Link 
              to="/properties?sort=newest" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl aspect-[4/3] transform transition-all duration-500 hover:scale-[1.02]"
              style={{ 
                perspective: '1000px',
                boxShadow: '0 20px 50px -15px rgba(0,0,0,0.4), 0 0 0 2px rgba(200,167,102,0.3)'
              }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                style={{ backgroundImage: `url(${menuDubaiSkyline})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="absolute inset-0 border-2 border-gold/40 rounded-2xl group-hover:border-gold transition-colors" />
              <div className="absolute top-4 right-4">
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full tracking-wider">NEW</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-xs font-bold tracking-[0.25em] uppercase mb-2">LATEST</p>
                <h3 className="text-white text-xl font-bold mb-2">New Project Launches</h3>
                <p className="text-white/80 text-sm mb-4">Be first to discover upcoming opportunities</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  See New Launches
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </div>

          {/* Project Categories */}
          <div className="col-span-4">
            <h4 className="text-black font-bold text-xs tracking-[0.2em] uppercase mb-5 flex items-center gap-2 pb-2 border-b border-gold/30">
              <Building2 className="w-4 h-4 text-gold" />
              Project Categories
            </h4>
            <div className="space-y-1">
              {projectCategories.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-black hover:text-white hover:bg-black transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-black border border-gold/50 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all shadow-lg">
                    <item.icon className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                  </div>
                  <span className="font-medium text-sm group-hover:text-gold">{item.label}</span>
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

export default MegaMenuProjects;
