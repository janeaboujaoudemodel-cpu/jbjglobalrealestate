import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { allTeamMembers, TeamMember } from "@/config/team-members";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";

/**
 * Premium Animated Team Collage Component
 * Displays actual team members in a dynamic, floating grid layout
 * for the Meet the Team hero section
 */

interface CollageItemProps {
  member: TeamMember;
  index: number;
  size: "lg" | "md" | "sm";
  delay: number;
}

const CollageItem: React.FC<CollageItemProps> = ({ member, index, size, delay }) => {
  const sizeClasses = {
    lg: "w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40",
    md: "w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28",
    sm: "w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20",
  };

  // Create a unique floating animation for each item
  const floatVariants = {
    initial: { 
      opacity: 0, 
      scale: 0.8,
      y: 20 
    },
    animate: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        delay: delay,
        duration: 0.6,
        ease: "easeOut"
      }
    },
  };

  // Gentle floating animation
  const floatAnimation = {
    y: [0, -8, 0, 8, 0],
    transition: {
      duration: 4 + (index % 3),
      repeat: Infinity,
      ease: "easeInOut",
      delay: delay + (index * 0.2),
    },
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-[#B89555]/40 shadow-lg shadow-gold/20 flex-shrink-0`}
      variants={floatVariants}
      initial="initial"
      animate="animate"
      whileHover={{ scale: 1.1, zIndex: 50 }}
    >
      <motion.div
        className="w-full h-full"
        animate={floatAnimation}
      >
        <img
          src={member.avatar}
          alt={member.name}
          className="w-full h-full object-cover"
          style={{ objectPosition: "center 25%" }}
          loading="eager"
         decoding="async" />
      </motion.div>
    </motion.div>
  );
};

const TeamHeroCollage: React.FC = () => {
  const { isFounderVisible } = useFounderVisibility();

  // Select diverse team members for the collage (mix of departments and roles)
  const collageMembers = useMemo(() => {
    // Priority: Leadership first, then mix from different departments
    const leadership = allTeamMembers.filter(m => m.department === "Leadership").slice(0, 4);
    const sales = allTeamMembers.filter(m => m.department === "Sales").slice(0, 6);
    const marketing = allTeamMembers.filter(m => m.department === "Marketing & Content").slice(0, 3);
    const creative = allTeamMembers.filter(m => m.department === "Creative & Media").slice(0, 3);
    const clientRelations = allTeamMembers.filter(m => m.department === "Client Relations" || m.department === "VIP Client Relations").slice(0, 4);
    const operations = allTeamMembers.filter(m => m.department === "Operations").slice(0, 2);
    const hr = allTeamMembers.filter(m => m.department === "Human Resources").slice(0, 2);
    const software = allTeamMembers.filter(m => m.department === "Software Engineering").slice(0, 2);
    
    // Combine and limit to ~24 members for optimal display
    const combined = [...leadership, ...sales, ...marketing, ...creative, ...clientRelations, ...operations, ...hr, ...software].slice(0, 24);

    // Hard block founder identity from any public collage when disabled
    if (!isFounderVisible) {
      return combined.filter((m) => m.id !== "jane-bou-jaoude");
    }

    return combined;
  }, [isFounderVisible]);

  // Arrange members in rows with varying sizes for visual interest
  const rows = useMemo(() => {
    return [
      // Row 1: 5 members (md, lg, lg, lg, md)
      { 
        members: collageMembers.slice(0, 5), 
        sizes: ["md", "lg", "lg", "lg", "md"] as const,
        offset: "translate-x-4"
      },
      // Row 2: 6 members (sm, md, lg, lg, md, sm)
      { 
        members: collageMembers.slice(5, 11), 
        sizes: ["sm", "md", "lg", "lg", "md", "sm"] as const,
        offset: "-translate-x-8"
      },
      // Row 3: 7 members (sm, sm, md, lg, md, sm, sm)
      { 
        members: collageMembers.slice(11, 18), 
        sizes: ["sm", "sm", "md", "lg", "md", "sm", "sm"] as const,
        offset: "translate-x-2"
      },
      // Row 4: 6 members (sm, md, md, md, md, sm)
      { 
        members: collageMembers.slice(18, 24), 
        sizes: ["sm", "md", "md", "md", "md", "sm"] as const,
        offset: "-translate-x-4"
      },
    ];
  }, [collageMembers]);

  return (
    <div className="relative w-full py-6 pb-12 overflow-visible">
      {/* Gradient overlays for seamless edges */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black via-black/60 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black via-black/60 to-transparent z-10 pointer-events-none" />
      
      {/* Collage Grid - ensure all rows visible */}
      <div className="flex flex-col items-center gap-2 md:gap-3">
        {rows.map((row, rowIndex) => (
          <motion.div
            key={rowIndex}
            className={`flex items-center justify-center gap-2 md:gap-3 ${row.offset}`}
            initial={{ opacity: 0, x: rowIndex % 2 === 0 ? -50 : 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: rowIndex * 0.15, duration: 0.6 }}
          >
            {row.members.map((member, memberIndex) => (
              <CollageItem
                key={member.id}
                member={member}
                index={rowIndex * 7 + memberIndex}
                size={row.sizes[memberIndex] || "md"}
                delay={rowIndex * 0.1 + memberIndex * 0.05}
              />
            ))}
          </motion.div>
        ))}
      </div>

      {/* Subtle glow effect behind collage */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#EFE6D6]/10 rounded-full blur-[100px]" />
      </div>
    </div>
  );
};

export default TeamHeroCollage;
