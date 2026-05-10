import React from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  CheckCircle2, 
  Clock, 
  Cpu, 
  Globe,
  Sparkles 
} from 'lucide-react';
import { getDepartmentMetadata, ProjectHighlight } from '@/config/department-metadata';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface DepartmentInfoSectionProps {
  departmentName: string;
}

const statusConfig = {
  Active: {
    icon: Rocket,
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  Planned: {
    icon: Clock,
    bgColor: 'bg-amber-500/10',
    textColor: 'text-[#1A1A1A]',
    borderColor: 'border-amber-500/30',
  },
  Completed: {
    icon: CheckCircle2,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
};

const ProjectHighlightCard = ({ highlight }: { highlight: ProjectHighlight }) => {
  const config = statusConfig[highlight.status];
  const StatusIcon = config.icon;

  return (
    <div className="p-4 rounded-lg border-2 border-[#B89555] bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] shadow-[0_0_15px_rgba(200,167,102,0.22)] hover:shadow-[0_0_25px_rgba(200,167,102,0.28),0_18px_50px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-[#1A1A1A] text-sm font-medium line-clamp-1">{highlight.title}</h4>
        <Badge 
          variant="outline" 
          className={`text-[10px] ${config.textColor} ${config.borderColor} shrink-0`}
        >
          <StatusIcon className="w-3 h-3 mr-1" />
          {highlight.status}
        </Badge>
      </div>
      <p className="text-[#1A1A1A]/70 text-xs line-clamp-2">{highlight.description}</p>
    </div>
  );
};

const DepartmentInfoSection: React.FC<DepartmentInfoSectionProps> = ({ departmentName }) => {
  const metadata = getDepartmentMetadata(departmentName);

  if (!metadata) return null;

  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="mb-6"
    >
      {/* OUTER: Active Champagne Layer */}
      <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-[#B89555]/30 rounded-2xl p-3 shadow-[0_0_40px_rgba(200,167,102,0.18)]">
        {/* INNER: Pearl Layer */}
        <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 rounded-xl p-5 shadow-[0_0_15px_rgba(200,167,102,0.22)]">
          {/* Department Summary */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A] text-xs font-medium uppercase tracking-wider">Overview</span>
            </div>
            <p className="text-[#1A1A1A]/70 text-sm leading-relaxed">{metadata.summary}</p>
          </div>

          {/* Tech Stack */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A] text-xs font-medium uppercase tracking-wider">Tech Stack</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {metadata.techStack.map((tech) => (
                <Badge
                  key={tech}
                  variant="outline"
                  className="text-xs border-[#B89555]/30 text-[#1A1A1A] bg-[#EFE6D6]/10 px-3 py-1"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Regional Coverage (if applicable) */}
          {metadata.regionalCoverage && metadata.regionalCoverage.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-[#1A1A1A]" />
                <span className="text-[#1A1A1A] text-xs font-medium uppercase tracking-wider">Regional Coverage</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {metadata.regionalCoverage.map((region) => (
                  <Badge
                    key={region}
                    variant="outline"
                    className="text-xs border-[#B89555]/30 text-[#1A1A1A] bg-[#EFE6D6]/5 px-3 py-1"
                  >
                    {region}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Project Highlights */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-4 h-4 text-[#1A1A1A]" />
              <span className="text-[#1A1A1A] text-xs font-medium uppercase tracking-wider">Project Highlights</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {metadata.projectHighlights.map((highlight) => (
                <ProjectHighlightCard key={highlight.title} highlight={highlight} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DepartmentInfoSection;
