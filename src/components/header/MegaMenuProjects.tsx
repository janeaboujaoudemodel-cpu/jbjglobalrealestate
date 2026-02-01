import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, TrendingUp, Calendar, Eye } from 'lucide-react';

interface MegaMenuProjectsProps {
  onClose: () => void;
}

const MegaMenuProjects: React.FC<MegaMenuProjectsProps> = ({ onClose }) => {
  const projectCategories = [
    { label: 'Off-Plan Projects', href: '/properties?status=off-plan', emoji: '🏗️' },
    { label: 'Ready Projects', href: '/properties?status=ready', emoji: '✅' },
    { label: 'New Launches', href: '/properties?sort=newest', emoji: '🆕' },
    { label: 'Handover Soon', href: '/properties?handover=2025', emoji: '📅' },
    { label: 'View All Projects', href: '/properties', emoji: '📋' },
  ];

  return (
    <div className="absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-[#0a0a0a] via-[#111] to-[#0a0a0a] border-t-2 border-gold/40 shadow-2xl z-50">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Featured Card - All Projects */}
          <div className="col-span-4">
            <Link 
              to="/properties" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl h-full min-h-[260px]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-sm font-medium tracking-wider uppercase mb-2">Off-Plan</p>
                <h3 className="text-white text-xl font-bold mb-2">Dubai Off-Plan Projects</h3>
                <p className="text-white/70 text-sm mb-4">Invest in Dubai's most promising developments</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  View All Projects
                  <span className="text-lg">→</span>
                </span>
              </div>
            </Link>
          </div>

          {/* New Launch Card */}
          <div className="col-span-4">
            <Link 
              to="/properties?sort=newest" 
              onClick={onClose}
              className="block group relative overflow-hidden rounded-2xl h-full min-h-[260px]"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                style={{ 
                  backgroundImage: 'url(https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop)',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute top-4 right-4">
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">NEW</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-gold text-sm font-medium tracking-wider uppercase mb-2">Latest</p>
                <h3 className="text-white text-xl font-bold mb-2">New Project Launches</h3>
                <p className="text-white/70 text-sm mb-4">Be first to discover upcoming opportunities</p>
                <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
                  See New Launches
                  <span className="text-lg">→</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Project Categories */}
          <div className="col-span-4">
            <h4 className="text-gold font-semibold text-sm tracking-wider uppercase mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Project Categories
            </h4>
            <div className="space-y-1">
              {projectCategories.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-white/80 hover:text-gold hover:bg-white/5 transition-all group"
                >
                  <span className="text-lg">{item.emoji}</span>
                  <span className="font-medium text-sm">{item.label}</span>
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

export default MegaMenuProjects;
