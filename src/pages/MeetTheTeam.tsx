import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
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
    <motion.div variants={fadeInUp}>
      <Card 
        className={`bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-2 border-gold/30 hover:border-gold hover:shadow-[0_0_25px_rgba(200,167,102,0.3)] transition-all duration-300 overflow-hidden group h-full ${isInternalUser ? 'cursor-pointer' : ''}`}
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
              className="w-full aspect-square group-hover:scale-105 transition-transform duration-500"
              style={{
                objectFit: "cover",
                objectPosition: "center 15%",
              }}
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
            {/* Photo overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60" />
          </div>

          {/* Info - Fixed height for symmetry */}
          <div className="p-5 -mt-16 relative z-10 flex flex-col h-[280px] bg-gradient-to-t from-white via-[#FDFBF7] to-transparent">
            <div>
              <h3 className="text-black font-semibold text-lg mb-1 line-clamp-1">{member.name}</h3>

              {/* Premium shiny job title */}
              <p
                className="text-sm font-medium mb-1 line-clamp-1 text-gold"
              >
                {member.role}
              </p>

              <div className="flex items-center gap-2 text-zinc-600 text-xs mb-1">
                <span>{member.department}</span>
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

              {/* Reports To - Only show manager name (no hierarchy levels) */}
              {reportsToMember && (
                <div className="flex items-center gap-1.5 text-zinc-600 text-[11px] mb-2">
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                  <span>Reports to {reportsToMember.name}</span>
                </div>
              )}

              {/* Short Bio */}
              {member.bio && (
                <p className="text-zinc-600 text-xs line-clamp-2 mb-2">
                  {member.bio}
                </p>
              )}
            </div>

            {/* Bottom actions pinned for perfect card symmetry */}
            <div className="mt-auto pt-2 border-t border-gold/20">
              <button
                type="button"
                onClick={() => onReadMore(member)}
                className="text-gold hover:text-black text-xs font-medium transition-colors"
              >
                Read more →
              </button>

              {/* Languages - Always at bottom with small gap */}
              {displayLanguages.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
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
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<TeamMember | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isInternalUser, setIsInternalUser] = useState(false);
  const salesHierarchy = useSalesHierarchy();

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

        const isAdmin = Boolean(adminResult.data) || Boolean(ownerResult.data);
        const hasHrRole = hrRole?.is_active;

        setIsInternalUser(isAdmin || hasHrRole);
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

      <div className="min-h-screen bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6]">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gold/3 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <Badge className="bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] text-gold border-gold/40 px-4 py-1.5 shadow-md">
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Our Team
                </Badge>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
                variants={fadeInUp}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="text-black">Meet the </span>
                <span className="text-gold">
                  Experts
                </span>
              </motion.h1>

              <motion.p
                className="text-zinc-600 text-lg max-w-2xl mx-auto mb-6"
                variants={fadeInUp}
              >
                A world-class team of professionals dedicated to delivering
                exceptional real estate experiences in Dubai and beyond.
              </motion.p>

              {/* Company Summary */}
              <motion.p
                className="text-zinc-500 text-sm max-w-3xl mx-auto mb-8 italic"
                variants={fadeInUp}
              >
                {companySummary}
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"
              />

              {/* Contact Us Button - Before employees */}
              <motion.div variants={fadeInUp}>
                <Button
                  onClick={handleOpenContactForm}
                  variant="primary"
                  className="px-8"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* CEO Leadership Showcase */}
        <CEOLeadershipShowcase />

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Team Sections by Department */}
        <section className="py-12">
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
                      {/* Department Header */}
                      <motion.div
                        variants={fadeInUp}
                        className="flex items-center gap-3 mb-4"
                      >
                        <div className="w-10 h-10 bg-black border border-gold rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                          <h2 className="text-white text-2xl font-semibold">
                          {deptName}
                        </h2>
                        <p className="text-zinc-500 text-sm">
                          {total} member{total > 1 ? "s" : ""}
                        </p>
                      </div>
                    </motion.div>

                    {/* Department Info Section */}
                    <DepartmentInfoSection departmentName={deptName} />

                    <div className="space-y-10">
                      {salesHierarchy.activeCategories.map((category) => {
                        const categoryMembers =
                          salesHierarchy.getMembersByCategory(category);
                        if (categoryMembers.length === 0) return null;

                        return (
                          <div key={category}>
                            <div className="flex items-center justify-between gap-4 mb-4">
                              <h3 className="text-white text-lg font-semibold">
                                {category}
                              </h3>
                              <p className="text-zinc-500 text-sm">
                                {categoryMembers.length} member
                                {categoryMembers.length > 1 ? "s" : ""}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
                  </motion.div>
                );
              }

              const members =
                teamByDepartment[deptName as keyof typeof teamByDepartment];
              if (!members || members.length === 0) return null;

              return (
                <motion.div
                  key={deptName}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-50px" }}
                  variants={staggerContainer}
                  className="mb-8"
                >
                  {/* Department Header */}
                  <motion.div
                    variants={fadeInUp}
                    className="flex items-center gap-3 mb-4"
                  >
                    <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h2 className="text-white text-2xl font-semibold">
                        {deptName}
                      </h2>
                      <p className="text-zinc-500 text-sm">
                        {members.length} member{members.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </motion.div>

                  {/* Department Info Section */}
                  <DepartmentInfoSection departmentName={deptName} />

                  {/* Team Grid - 4 columns for perfect alignment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {members.map((member) => (
                      <TeamMemberCard
                        key={member.id}
                        member={member}
                        onReadMore={handleReadMore}
                        isInternalUser={isInternalUser}
                        onDirectClick={handleDirectClick}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section with Contact Us */}
        <section className="py-16 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border-t border-zinc-200">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-zinc-200 p-8 md:p-12 text-center max-w-4xl mx-auto shadow-sm"
            >
              <div className="w-16 h-16 bg-black rounded-xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-black text-2xl md:text-3xl font-bold mb-4">
                Get in Touch
              </h3>
              <p className="text-zinc-600 max-w-xl mx-auto mb-8">
                Ready to work with our exceptional team? Whether you're looking to buy, sell, or invest in luxury real estate, we're here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={handleOpenContactForm}
                  variant="dark"
                  className="px-6"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
                <Link to="/careers">
                  <Button
                    variant="secondary"
                    className="border-black text-black hover:bg-black hover:text-white"
                  >
                    View Open Positions
                    <ArrowUpRight className="w-4 h-4 ml-2 text-gold" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
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
