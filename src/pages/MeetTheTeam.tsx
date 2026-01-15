import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  allTeamMembers,
  teamByDepartment,
  TeamMember,
} from "@/config/team-members";
import {
  Users,
  Mail,
  ArrowRight,
  Sparkles,
  Building2,
} from "lucide-react";

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

const TeamMemberCard = ({ member }: { member: TeamMember }) => (
  <motion.div variants={fadeInUp}>
    <Card className="bg-zinc-900/60 border-zinc-800 hover:border-gold/40 transition-all duration-300 overflow-hidden group h-full">
      <CardContent className="p-0">
        {/* Photo */}
        <div className="relative overflow-hidden">
          <img
            src={member.avatar}
            alt={member.name}
            className="w-full aspect-square object-cover object-top group-hover:scale-105 transition-transform duration-500"
          />
          {/* Photo overlay gradient only - no AI badge */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
        </div>

        {/* Info */}
        <div className="p-5 -mt-16 relative z-10">
          <h3 className="text-white font-semibold text-lg mb-1">
            {member.name}
          </h3>
          <p className="text-gold text-sm mb-2">{member.role}</p>
          <p className="text-zinc-500 text-sm mb-3">{member.department}</p>

          {member.bio && (
            <p className="text-zinc-400 text-xs line-clamp-3 mb-3">
              {member.bio}
            </p>
          )}

          {member.languages && member.languages.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {member.languages.slice(0, 3).map((lang) => (
                <Badge
                  key={lang}
                  variant="outline"
                  className="text-xs border-zinc-700 text-zinc-400"
                >
                  {lang}
                </Badge>
              ))}
              {member.languages.length > 3 && (
                <Badge
                  variant="outline"
                  className="text-xs border-zinc-700 text-zinc-400"
                >
                  +{member.languages.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const MeetTheTeam = () => {
  const departmentOrder = [
    "Leadership",
    "Property Operations",
    "Sales & Marketing",
    "Client Relations",
    "Human Resources",
    "Creative & Media",
    "Finance",
    "Operations",
    "Technology",
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

              {/* Stats */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap justify-center gap-8"
              >
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold">
                    {allTeamMembers.length}+
                  </p>
                  <p className="text-zinc-500 text-sm">Team Members</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold">9</p>
                  <p className="text-zinc-500 text-sm">Departments</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold">15+</p>
                  <p className="text-zinc-500 text-sm">Languages Spoken</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />

        {/* Team Sections by Department */}
        <section className="py-16">
          <div className="container mx-auto px-4">
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
                  className="mb-16"
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

                  {/* Team Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {members.map((member) => (
                      <TeamMemberCard key={member.id} member={member} />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
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
                Join Our Team
              </h3>
              <p className="text-zinc-400 max-w-xl mx-auto mb-8">
                We're always looking for talented individuals who share our
                passion for excellence in real estate. Explore career
                opportunities with JBJ Global.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/careers">
                  <Button className="bg-gold hover:bg-gold-dark text-black font-semibold px-6">
                    View Open Positions
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button
                    variant="outline"
                    className="border-gold/50 text-gold hover:bg-gold/10"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default MeetTheTeam;
