import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  GraduationCap,
  PlayCircle,
  CheckCircle2,
  Lock,
  Clock,
  BookOpen,
  Target,
  Users,
  TrendingUp,
  Zap,
  Award,
  ChevronRight,
  Phone,
  Mail,
} from "lucide-react";

interface Subscription {
  id: string;
  tier: string;
  status: string;
}

interface BrokerCoursesProps {
  subscription: Subscription;
}

const COURSE_MODULES = [
  {
    id: "closing-techniques",
    icon: Target,
    title: "Closing Techniques",
    description: "Master the art of closing deals with proven techniques used by top performers",
    lessons: [
      { id: "ct-1", title: "Introduction to Closing", duration: "15 min", free: true },
      { id: "ct-2", title: "Building Urgency", duration: "20 min", free: true },
      { id: "ct-3", title: "The Assumptive Close", duration: "25 min", free: false },
      { id: "ct-4", title: "Handling Last-Minute Objections", duration: "30 min", free: false },
      { id: "ct-5", title: "The Alternative Choice Close", duration: "20 min", free: false },
      { id: "ct-6", title: "Creating Win-Win Scenarios", duration: "25 min", free: false },
      { id: "ct-7", title: "Closing in Different Cultures", duration: "35 min", free: false },
      { id: "ct-8", title: "Advanced Closing Scripts", duration: "40 min", free: false },
    ],
    tier: "starter",
    color: "from-blue-500/20 to-blue-500/5",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
  },
  {
    id: "objection-handling",
    icon: Users,
    title: "Objection Handling",
    description: "Turn every objection into an opportunity to close the deal",
    lessons: [
      { id: "oh-1", title: "Understanding Objections", duration: "20 min", free: true },
      { id: "oh-2", title: "Price Objections", duration: "30 min", free: false },
      { id: "oh-3", title: "Timing Objections", duration: "25 min", free: false },
      { id: "oh-4", title: "Competition Objections", duration: "25 min", free: false },
      { id: "oh-5", title: "Location Concerns", duration: "20 min", free: false },
      { id: "oh-6", title: "Trust Building Techniques", duration: "30 min", free: false },
    ],
    tier: "starter",
    color: "from-green-500/20 to-green-500/5",
    borderColor: "border-green-500/30",
    iconColor: "text-green-400",
  },
  {
    id: "lead-generation",
    icon: TrendingUp,
    title: "Lead Generation Mastery",
    description: "Build a consistent pipeline of qualified leads using modern strategies",
    lessons: [
      { id: "lg-1", title: "Lead Generation Fundamentals", duration: "25 min", free: true },
      { id: "lg-2", title: "Social Media Strategies", duration: "35 min", free: false },
      { id: "lg-3", title: "Content Marketing for Brokers", duration: "40 min", free: false },
      { id: "lg-4", title: "Networking Excellence", duration: "30 min", free: false },
      { id: "lg-5", title: "Referral Systems", duration: "25 min", free: false },
      { id: "lg-6", title: "Digital Advertising Basics", duration: "35 min", free: false },
      { id: "lg-7", title: "Email Marketing Campaigns", duration: "30 min", free: false },
      { id: "lg-8", title: "Lead Qualification Process", duration: "25 min", free: false },
    ],
    tier: "professional",
    color: "from-purple-500/20 to-purple-500/5",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-400",
  },
  {
    id: "lead-management",
    icon: BookOpen,
    title: "Lead Management System",
    description: "Organize and nurture your leads for maximum conversion",
    lessons: [
      { id: "lm-1", title: "CRM Fundamentals", duration: "20 min", free: false },
      { id: "lm-2", title: "Lead Scoring", duration: "25 min", free: false },
      { id: "lm-3", title: "Follow-up Sequences", duration: "30 min", free: false },
      { id: "lm-4", title: "Pipeline Management", duration: "25 min", free: false },
      { id: "lm-5", title: "Automation Tools", duration: "35 min", free: false },
    ],
    tier: "professional",
    color: "from-amber-500/20 to-amber-500/5",
    borderColor: "border-amber-500/30",
    iconColor: "text-[#1A1A1A]",
  },
  {
    id: "prospecting",
    icon: Zap,
    title: "Prospecting Mastery",
    description: "Find and qualify potential clients with proven prospecting methods",
    lessons: [
      { id: "pm-1", title: "Prospecting Mindset", duration: "20 min", free: false },
      { id: "pm-2", title: "Cold Calling Excellence", duration: "35 min", free: false },
      { id: "pm-3", title: "Door-to-Door Strategies", duration: "30 min", free: false },
      { id: "pm-4", title: "Database Mining", duration: "25 min", free: false },
      { id: "pm-5", title: "Event Prospecting", duration: "20 min", free: false },
      { id: "pm-6", title: "Online Prospecting", duration: "30 min", free: false },
    ],
    tier: "professional",
    color: "from-pink-500/20 to-pink-500/5",
    borderColor: "border-pink-500/30",
    iconColor: "text-pink-400",
  },
  {
    id: "market-expertise",
    icon: Award,
    title: "UAE Market Expertise",
    description: "Deep dive into the UAE real estate market and regulations",
    lessons: [
      { id: "me-1", title: "UAE Real Estate Overview", duration: "30 min", free: false },
      { id: "me-2", title: "Dubai Market Analysis", duration: "40 min", free: false },
      { id: "me-3", title: "Abu Dhabi Market Analysis", duration: "35 min", free: false },
      { id: "me-4", title: "Legal Framework", duration: "45 min", free: false },
      { id: "me-5", title: "Investment Zones", duration: "30 min", free: false },
      { id: "me-6", title: "Developer Rankings", duration: "25 min", free: false },
      { id: "me-7", title: "Future Developments", duration: "35 min", free: false },
      { id: "me-8", title: "Market Trends 2024-2025", duration: "30 min", free: false },
    ],
    tier: "enterprise",
    color: "from-gold/20 to-gold/5",
    borderColor: "border-[#B89555]/30",
    iconColor: "text-[#1A1A1A]",
  },
];

const TIER_ORDER = ["starter", "professional", "enterprise"];

export default function BrokerCourses({ subscription }: BrokerCoursesProps) {
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const tierIndex = TIER_ORDER.indexOf(subscription.tier);
  
  const canAccessModule = (moduleTier: string) => {
    const moduleTierIndex = TIER_ORDER.indexOf(moduleTier);
    return tierIndex >= moduleTierIndex;
  };

  const canAccessLesson = (moduleTier: string, lessonFree: boolean) => {
    if (lessonFree) return true;
    return canAccessModule(moduleTier);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-gold/10 to-gold/5 border border-[#B89555]/30 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#EFE6D6]/20 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-[#1A1A1A]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Guides & Resources</h2>
            <p className="text-white/70">
              {subscription.tier === "enterprise" 
                ? "You have access to all courses and future releases"
                : subscription.tier === "professional"
                ? "You have access to most courses. Upgrade for full access."
                : "You have access to basic courses. Upgrade for more content."}
            </p>
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="space-y-4">
        {COURSE_MODULES.map((module, index) => {
          const hasAccess = canAccessModule(module.tier);
          const isExpanded = expandedModule === module.id;
          const completedLessons = 0; // Would come from database
          const progress = (completedLessons / module.lessons.length) * 100;

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${module.color} border ${module.borderColor} rounded-xl overflow-hidden`}
            >
              {/* Module Header */}
              <button
                onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                className="w-full p-6 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-[#FDFBF7]/50 flex items-center justify-center`}>
                    <module.icon className={`w-6 h-6 ${module.iconColor}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">{module.title}</h3>
                      {!hasAccess && (
                        <Badge className="bg-[#1A1A1A] text-white/70">
                          <Lock className="w-3 h-3 mr-1" />
                          {module.tier.charAt(0).toUpperCase() + module.tier.slice(1)}
                        </Badge>
                      )}
                    </div>
                    <p className="text-white/70 text-sm">{module.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/90">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {module.lessons.length} Lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {module.lessons.reduce((acc, l) => acc + parseInt(l.duration), 0)} min
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {hasAccess && (
                    <div className="hidden md:block w-32">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs text-white/90 mt-1 text-right">
                        {completedLessons}/{module.lessons.length} completed
                      </p>
                    </div>
                  )}
                  <ChevronRight className={`w-5 h-5 text-white/70 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </div>
              </button>

              {/* Lessons List */}
              {isExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="border-t border-[#1A1A1A]/50"
                >
                  <div className="p-4 space-y-2">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const lessonAccess = canAccessLesson(module.tier, lesson.free);
                      
                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            lessonAccess 
                              ? "bg-[#FDFBF7]/50 hover:bg-[#1A1A1A] cursor-pointer" 
                              : "bg-[#FDFBF7]/20 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] flex items-center justify-center text-sm text-white/70">
                              {lessonIndex + 1}
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{lesson.title}</p>
                              <p className="text-white/90 text-xs">{lesson.duration}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {lesson.free && (
                              <Badge className="bg-green-500/20 text-green-400 text-xs">
                                Free
                              </Badge>
                            )}
                            {lessonAccess ? (
                              <PlayCircle className="w-5 h-5 text-[#1A1A1A]" />
                            ) : (
                              <Lock className="w-4 h-4 text-[#1A1A1A]/70" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Upgrade CTA */}
      {subscription.tier !== "enterprise" && (
        <div className="bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/30 rounded-xl p-6 text-center">
          <GraduationCap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Unlock All Courses</h3>
          <p className="text-white/70 mb-6">
            Upgrade to Enterprise for unlimited access to all courses, including new releases.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://wa.me/971565911000?text=Hi%2C%20I%20want%20to%20upgrade%20to%20Enterprise%20for%20full%20course%20access"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-gradient-to-r from-purple-600 to-purple-800 text-white hover:brightness-110">
                <Phone className="w-4 h-4 mr-2" />
                Contact to Upgrade
              </Button>
            </a>
            <a href="mailto:CONTACT@JBJ.AE">
              <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10">
                <Mail className="w-4 h-4 mr-2" />
                Email Us
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
