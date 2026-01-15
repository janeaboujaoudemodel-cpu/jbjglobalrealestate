import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
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
}

const TeamMemberCard = ({ member, onReadMore }: TeamMemberCardProps) => {
  // Get reporting manager info
  const reportsToMember = member.reportsTo ? getTeamMemberById(member.reportsTo) : null;

  // Show up to 4 languages, only +X if more than 4
  const maxLanguages = 4;
  const displayLanguages = member.languages?.slice(0, maxLanguages) || [];
  const remainingLanguages = (member.languages?.length || 0) - maxLanguages;

  return (
    <motion.div variants={fadeInUp}>
      <Card className="bg-zinc-900/60 border-zinc-800 hover:border-gold/50 transition-all duration-300 overflow-hidden group h-full">
        <CardContent className="p-0">
          {/* Photo */}
          <div className="relative overflow-hidden">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-full aspect-square object-cover object-top group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Photo overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
          </div>

          {/* Info - Fixed height for symmetry */}
          <div className="p-5 -mt-16 relative z-10 flex flex-col h-[280px]">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{member.name}</h3>

              {/* Premium shiny job title */}
              <p
                className="text-sm font-medium mb-1 line-clamp-1"
                style={{
                  background:
                    "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 40%, #F5ECD7 50%, #E8D5A3 60%, #CBA64B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {member.role}
              </p>

              <div className="flex items-center gap-2 text-zinc-500 text-xs mb-1">
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
                <div className="flex items-center gap-1.5 text-zinc-500 text-[11px] mb-2">
                  <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                  <span>Reports to {reportsToMember.name}</span>
                </div>
              )}

              {/* Short Bio */}
              {member.bio && (
                <p className="text-zinc-500 text-xs line-clamp-2 mb-2">
                  {member.bio}
                </p>
              )}
            </div>

            {/* Bottom actions pinned for perfect card symmetry */}
            <div className="mt-auto pt-2 border-t border-zinc-800/50">
              <button
                type="button"
                onClick={() => onReadMore(member)}
                className="text-gold hover:text-gold-light text-xs font-medium transition-colors"
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
                      className="text-[10px] border-zinc-700 text-zinc-400 px-2 py-0.5"
                    >
                      {lang}
                    </Badge>
                  ))}
                  {remainingLanguages > 0 && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-zinc-700 text-zinc-400 px-2 py-0.5"
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

const MeetTheTeam = () => {
  const location = useLocation();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [detailMember, setDetailMember] = useState<TeamMember | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

      <div className="min-h-screen bg-[#0D0D0D]">
        {/* Hero Section */}
        <section className="relative py-20 md:py-28 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gold/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="text-center max-w-4xl mx-auto"
            >
              <motion.div variants={fadeInUp} className="mb-6">
                <Badge className="bg-gold/15 text-gold border-gold/30 px-4 py-1.5">
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Our Team
                </Badge>
              </motion.div>

              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4"
                variants={fadeInUp}
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                <span className="text-white">Meet the </span>
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Experts
                </span>
              </motion.h1>

              <motion.p
                className="text-zinc-400 text-lg max-w-2xl mx-auto mb-8"
                variants={fadeInUp}
              >
                A world-class team of professionals dedicated to delivering
                exceptional real estate experiences in Dubai and beyond.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="w-24 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mb-8"
              />

              {/* Contact Us Button - Before employees */}
              <motion.div variants={fadeInUp}>
                <Button
                  onClick={handleOpenContactForm}
                  className="bg-gold hover:bg-gold-dark text-black font-semibold px-8"
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
                    className="flex items-center gap-3 mb-8"
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

                  {/* Team Grid - 4 columns for perfect alignment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {members.map((member) => (
                      <TeamMemberCard 
                        key={member.id} 
                        member={member} 
                        onReadMore={handleReadMore}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section with Contact Us */}
        <section className="py-16 border-t border-zinc-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 rounded-2xl border border-zinc-800 p-8 md:p-12 text-center max-w-4xl mx-auto"
            >
              <div className="w-16 h-16 bg-gold/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-gold" />
              </div>
              <h3 className="text-white text-2xl md:text-3xl font-bold mb-4">
                Get in Touch
              </h3>
              <p className="text-zinc-400 max-w-xl mx-auto mb-8">
                Ready to work with our exceptional team? Whether you're looking to buy, sell, or invest in luxury real estate, we're here to help.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button 
                  onClick={handleOpenContactForm}
                  className="bg-gold hover:bg-gold-dark text-black font-semibold px-6"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Us
                </Button>
                <Link to="/careers">
                  <Button
                    variant="outline"
                    className="border-gold/50 text-gold hover:bg-gold/10"
                  >
                    View Open Positions
                    <ArrowRight className="w-4 h-4 ml-2" />
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

      {/* Detail Dialog - No contact button inside */}
      <TeamMemberDetailDialog
        member={detailMember}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onContact={() => {
          setIsDetailOpen(false);
          setIsContactFormOpen(true);
        }}
      />
    </>
  );
};

export default MeetTheTeam;
