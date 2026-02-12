import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  allTeamMembers,
  teamByDepartment,
  TeamMember,
  getTeamMemberById,
} from "@/config/team-members";
import { useFounderVisibility } from "@/contexts/FounderVisibilityContext";
import { useSalesHierarchy } from "@/hooks/useSalesHierarchy";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Users,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
  MessageSquare,
  ArrowUpRight,
} from "lucide-react";
import TeamContactForm from "@/components/TeamContactForm";
import TeamMemberDetailDialog from "@/components/TeamMemberDetailDialog";
import CEOLeadershipShowcase from "@/components/CEOLeadershipShowcase";
import DepartmentInfoSection from "@/components/DepartmentInfoSection";
import { companySummary } from "@/config/department-metadata";
import TeamHeroCollage from "@/components/TeamHeroCollage";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

interface TeamMemberCardProps {
  member: TeamMember;
  onReadMore: (member: TeamMember) => void;
  isInternalUser?: boolean;
  onDirectClick?: (member: TeamMember) => void;
}

const TeamMemberCard = ({ member, onReadMore, isInternalUser, onDirectClick }: TeamMemberCardProps) => {
  // Get reporting manager info
  const reportsToMember = member.reportsTo ? getTeamMemberById(member.reportsTo) : null;

  // Show up to 4 languages, only +X if more than 4
  const maxLanguages = 4;
  const displayLanguages = member.languages?.slice(0, maxLanguages) || [];
  const remainingLanguages = (member.languages?.length || 0) - maxLanguages;

  const handleCardClick = () => {
    if (isInternalUser && onDirectClick) {
      onDirectClick(member);
    }
  };

  return (
    <motion.div variants={fadeInUp} className="min-w-[280px]">
      <Card 
        className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold shadow-[0_0_20px_rgba(200,167,102,0.2)] hover:shadow-[0_0_25px_rgba(200,167,102,0.35),0_22px_60px_rgba(0,0,0,0.45)] hover:-translate-y-2 hover:scale-[1.02] transition-all duration-300 overflow-hidden group h-full ${isInternalUser ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
      >
        <CardContent className="p-0">
          {/* Photo */}
          <div className="relative overflow-hidden">
            {/* GLOBAL IMAGE RULE - LOCKED (FINAL):
                - object-fit: cover = fills frame completely, no gaps
                - object-position: center 15% = focus on face, crop from bottom (suit area)
                - Maximum zoom while preserving head & shoulders
                - NEVER crop head or shoulders, CAN crop suit from bottom */}
            <img
              src={member.avatar}
              alt={member.name}
              className="w-full aspect-[4/5] group-hover:scale-105 transition-transform duration-500"
              style={{
                objectFit: "cover",
                objectPosition: "center 15%",
              }}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </div>

          {/* Info - Positioned below photo, not overlapping */}
          <div className="p-5 flex flex-col bg-gradient-to-b from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
            <h3 className="text-black font-semibold text-lg mb-1">{member.name}</h3>

            {/* Premium shiny job title - allow wrapping */}
            <p className="text-sm font-medium mb-1 text-gold">
              {member.role}
            </p>

            {/* Department and details - allow text wrapping, no truncation */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-zinc-600 text-xs mb-2">
              <span className="whitespace-normal">{member.department}</span>
              {typeof member.yearsExperience === "number" && (
                <>
                  <span>•</span>
                  <span>{member.yearsExperience} yrs</span>
                </>
              )}
              {member.nationality && (
                <>
                  <span>•</span>
                  <span>{member.nationality}</span>
                </>
              )}
            </div>

            {/* Short Bio */}
            {member.bio && (
              <p className="text-zinc-600 text-xs line-clamp-2 mb-3">
                {member.bio}
              </p>
            )}

            {/* Read More - Above divider */}
            <button
              type="button"
              onClick={() => onReadMore(member)}
              className="text-gold hover:text-black text-xs font-medium transition-colors mb-3 text-left"
            >
              Read more →
            </button>

            {/* Divider between Read More and Languages */}
            <div className="border-t border-gold/30 pt-3">
              {/* Languages - Below divider */}
              {displayLanguages.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {displayLanguages.map((lang) => (
                    <Badge
                      key={lang}
                      variant="outline"
                      className="text-[10px] border-gold/30 text-black bg-gold/10 px-2 py-0.5"
                    >
                      {lang}
                    </Badge>
                  ))}
                  {remainingLanguages > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-gold/30 text-black bg-gold/10 px-2 py-0.5"
                    >
                      +{remainingLanguages}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const MeetTheTeam: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isFounderVisible } = useFounderVisibility();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<TeamMember | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInternalUser, setIsInternalUser] = useState(false);
  const salesHierarchy = useSalesHierarchy();

  const isFounderMember = (member: TeamMember) =>
    member.id === "jane-bou-jaoude" ||
    member.name === "Jane Bou Jaoude" ||
    /founder/i.test(member.role);

  const filterFounder = (members: TeamMember[]) =>
    isFounderVisible ? members : members.filter((m) => !isFounderMember(m));

  // Check if user is an internal employee (has hr_user_roles or admin/owner)
  useEffect(() => {
    const checkInternalUser = async () => {
      if (!user) {
        setIsInternalUser(false);
        return;
      }

      try {
        // Check for HR roles
        const { data: hrRole } = await supabase
          .from("hr_user_roles")
          .select("role, is_active")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        // Check for admin/owner roles
        const [adminResult, ownerResult] = await Promise.all([
          supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
          supabase.rpc("has_role", { _user_id: user.id, _role: "owner" }),
        ]);

        const isOwnerRole = Boolean(adminResult.data) || Boolean(ownerResult.data);
        const hasHrRole = hrRole?.is_active;

        setIsInternalUser(isOwnerRole || hasHrRole);
      } catch (error) {
        console.error("Error checking internal user status:", error);
        setIsInternalUser(false);
      }
    };

    checkInternalUser();
  }, [user]);

  // Scroll to top when navigating to this page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  const handleOpenContactForm = () => {
    setSelectedMember(null);
    setIsContactFormOpen(true);
  };

  const handleReadMore = (member: TeamMember) => {
    setDetailMember(member);
    setIsDetailOpen(true);
  };

  // For internal users, clicking the card opens the detail dialog directly
  const handleDirectClick = (member: TeamMember) => {
    setDetailMember(member);
    setIsDetailOpen(true);
  };

  const departmentOrder = [
    "Leadership",
    "Legal",
    "Sales",
    "After Sales",
    "Marketing & Content",
    "Client Relations",
    "VIP Client Relations",
    "Human Resources",
    "Creative & Media",
    "Finance",
    "Operations",
    "Software Engineering",
    "Project Management",
    "IT",
    "Administration",
    "Customer Happiness",
  ];

  return (
    <>
      <SEOHead
        title="Meet Our Team | JBJ Global Real Estate"
        description="Meet the exceptional professionals behind JBJ Global Real Estate. Our diverse team of experts is dedicated to delivering premium real estate services in Dubai and the UAE."
        keywords="JBJ team, real estate professionals Dubai, luxury property experts, JBJ Global Real Estate staff"
        canonicalPath="/team"
      />

        <div className="min-h-screen bg-black">
          {/* Hero Section with Premium Animated Team Collage */}
          <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
          {/* Background Video */}
          <div className="absolute inset-0 z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/team-hero-dubai-landmarks.mp4" type="video/mp4" />
            </video>
            {/* Overlay gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/70 to-black" />
          </div>
          
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gold/5 rounded-full blur-[100px]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gold/5 rounded-full blur-[150px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10 pt-24 md:pt-32 lg:pt-36 pb-16 md:pb-24">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex flex-col items-center"
            >
              {/* Badge at top */}
              <motion.div variants={fadeInUp} className="mb-6 text-center">
                <Badge className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-gold border-gold/40 px-4 py-1.5 shadow-md">
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Our Team
                </Badge>
              </motion.div>

              {/* PHOTO COLLAGE FIRST - Above title */}
              <motion.div
                variants={fadeInUp}
                className="w-full mb-10"
              >
                <TeamHeroCollage />
              </motion.div>

              {/* THEN Title + Description + CTA - Below collage */}
              <motion.div className="text-center max-w-4xl mx-auto">
                <motion.h1
                  className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
                  variants={fadeInUp}
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  <span className="text-white">Meet the </span>
                  <span className="text-gold">Experts</span>
                </motion.h1>

                <motion.p
                  className="text-zinc-300 text-lg max-w-2xl mx-auto mb-4"
                  variants={fadeInUp}
                >
                  A world-class team of professionals dedicated to delivering
                  exceptional real estate experiences in Dubai and beyond.
                </motion.p>

                {/* Company Summary */}
                <motion.p
                  className="text-zinc-400 text-sm max-w-3xl mx-auto mb-6 italic"
                  variants={fadeInUp}
                >
                  {companySummary}
                </motion.p>

                <motion.div
                  variants={fadeInUp}
                  className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-6"
                />

                {/* Contact Us Button */}
                <motion.div variants={fadeInUp}>
                  <Button
                    onClick={handleOpenContactForm}
                    variant="media"
                    size="lg"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Us
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CEO Leadership Showcase */}
        {isFounderVisible ? <CEOLeadershipShowcase /> : null}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Team Sections by Department - Each wrapped in Active Champagne Layer */}
        <section className="py-12 bg-black">
          <div className="container mx-auto px-4 space-y-12">
            {departmentOrder.map((deptName) => {
              if (deptName === "Sales") {
                const total = salesHierarchy.totalCount;
                if (total === 0) return null;

                  return (
                    <motion.div
                      key={deptName}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-50px" }}
                      variants={staggerContainer}
                      className="mb-8"
                    >
                      {/* Active Champagne Layer - Starts from Department Title */}
                      <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-6">
                        {/* Department Header - Inside Active Layer */}
                        <motion.div
                          variants={fadeInUp}
                          className="flex items-center gap-3 mb-4"
                        >
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border border-gold/40 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-gold" />
                          </div>
                          <div>
                            <h2 className="text-black text-2xl font-semibold">
                            {deptName}
                          </h2>
                          <p className="text-zinc-600 text-sm">
                            {total} member{total > 1 ? "s" : ""}
                          </p>
                        </div>
                      </motion.div>

                      {/* Department Info Section - Inside Active Layer */}
                      <DepartmentInfoSection departmentName={deptName} />

                      {/* Cards Grid - Inside Active Layer */}
                      <div className="space-y-10 mt-4">
                        {salesHierarchy.activeCategories.map((category) => {
                          const categoryMembers = filterFounder(
                            salesHierarchy.getMembersByCategory(category)
                          );
                          if (categoryMembers.length === 0) return null;

                            return (
                            <div key={category}>
                              <div className="flex items-center justify-between gap-4 mb-4">
                                <h3 className="text-black text-lg font-semibold">
                                  {category}
                                </h3>
                                <p className="text-zinc-600 text-sm">
                                  {categoryMembers.length} member
                                  {categoryMembers.length > 1 ? "s" : ""}
                                </p>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                                {categoryMembers.map((member) => (
                                  <TeamMemberCard
                                    key={member.id}
                                    member={member}
                                    onReadMore={handleReadMore}
                                    isInternalUser={isInternalUser}
                                    onDirectClick={handleDirectClick}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                );
              }

              const members =
                teamByDepartment[deptName as keyof typeof teamByDepartment];
              const visibleMembers = members ? filterFounder(members) : [];
              if (!visibleMembers || visibleMembers.length === 0) return null;

              return (
                <motion.div
                  key={deptName}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={staggerContainer}
                  className="mb-8"
                >
                  {/* Active Champagne Layer - Starts from Department Title */}
                  <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl p-4 sm:p-6">
                    {/* Department Header - Inside Active Layer */}
                    <motion.div
                      variants={fadeInUp}
                      className="flex items-center gap-3 mb-4"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-[#FDFBF7] to-[#EDE4D3] border border-gold/40 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gold" />
                      </div>
                      <div>
                        <h2 className="text-black text-2xl font-semibold">
                          {deptName}
                        </h2>
                        <p className="text-zinc-600 text-sm">
                          {visibleMembers.length} member{visibleMembers.length > 1 ? "s" : ""}
                        </p>
                      </div>
                    </motion.div>

                    {/* Department Info Section - Inside Active Layer */}
                    <DepartmentInfoSection departmentName={deptName} />

                    {/* Cards Grid - Inside Active Layer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 mt-4">
                      {visibleMembers.map((member) => (
                        <TeamMemberCard
                          key={member.id}
                          member={member}
                          onReadMore={handleReadMore}
                          isInternalUser={isInternalUser}
                          onDirectClick={handleDirectClick}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section - 3-Layer System: Black > Active Champagne > Pearl */}
        <section className="py-16 sm:py-20 bg-black">
          <div className="container mx-auto px-3 sm:px-4 md:px-6">
            <div className="max-w-[1200px] mx-auto">
              {/* OUTER CARD - Active Champagne Layer - Larger padding for visible contrast */}
              <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
                {/* INNER CARD - Pearl Layer - Smaller for balance */}
                <motion.div 
                  className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                >
                  {/* Badge */}
                  <motion.div 
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-gold/20 via-[#F5F0E6] to-gold/20 border border-gold/50 rounded-full text-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-4 sm:mb-6 shadow-lg shadow-gold/20"
                    variants={fadeInUp}
                  >
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gold" />
                    Join Our Team
                  </motion.div>

                  {/* Title */}
                  <motion.h3 
                    className="text-black text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold mb-3 sm:mb-4 leading-tight"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                    variants={fadeInUp}
                  >
                    Ready to Work With Our Experts?
                  </motion.h3>
                  <motion.p 
                    className="text-zinc-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-10 leading-relaxed"
                    variants={fadeInUp}
                  >
                    Whether you're looking to buy, sell, or invest in luxury real estate, we're here to help.
                  </motion.p>

                  {/* CTA Buttons */}
                  <motion.div 
                    className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 sm:gap-4"
                    variants={fadeInUp}
                  >
                    {/* Primary Button - Get in Touch */}
                    <button 
                      onClick={handleOpenContactForm}
                      className="relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                        boxShadow: `
                          0 10px 30px rgba(200,167,102,0.4),
                          0 6px 15px rgba(0,0,0,0.2),
                          inset 0 2px 4px rgba(255,255,255,0.9),
                          inset 0 -2px 4px rgba(200,167,102,0.2),
                          0 0 20px rgba(200,167,102,0.3)
                        `,
                      }}
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                      <span className="relative flex items-center justify-center gap-2">
                        <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-gold group-hover:text-black transition-colors" />
                        <span className="text-black group-hover:text-gold transition-colors">Get in</span>
                        <span className="text-gold group-hover:text-black transition-colors">Touch</span>
                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-black group-hover:text-gold transition-colors" />
                      </span>
                    </button>

                    {/* Secondary Button - View Careers */}
                    <Link to="/careers" className="w-full sm:w-auto">
                      <button 
                        className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white"
                      >
                        View Open Positions
                        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Contact Form Modal */}
      <TeamContactForm
        member={selectedMember}
        isOpen={isContactFormOpen}
        onClose={() => setIsContactFormOpen(false)}
      />

      {/* Detail Dialog - Contact options for internal users */}
      <TeamMemberDetailDialog
        member={detailMember}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onContact={() => {
          setIsDetailOpen(false);
          setIsContactFormOpen(true);
        }}
        isInternalUser={isInternalUser}
      />
    </>
  );
};

export default MeetTheTeam;
