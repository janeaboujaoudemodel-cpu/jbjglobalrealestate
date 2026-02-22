import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  GraduationCap,
  BookOpen,
  Video,
  FileText,
  Download,
  Shield,
  Phone,
  Target,
  Headphones,
  Brain,
  Award,
  Clock,
  Play
} from "lucide-react";

const LEARNING_CATEGORIES = [
  {
    category: "Objection Handling",
    icon: Shield,
    description: "Turn client objections into closing opportunities",
    modules: [
      { title: "Price Objections Masterclass", duration: "45 min", type: "video" },
      { title: "Location Concerns Response", duration: "30 min", type: "guide" },
      { title: "Timing Objections Playbook", duration: "25 min", type: "pdf" },
      { title: "Competition Comparisons", duration: "35 min", type: "video" },
    ]
  },
  {
    category: "Cold Calling",
    icon: Phone,
    description: "Master phone-based prospecting",
    modules: [
      { title: "Opening Scripts That Work", duration: "30 min", type: "pdf" },
      { title: "Gatekeeper Navigation", duration: "25 min", type: "video" },
      { title: "Voicemail Strategies", duration: "20 min", type: "guide" },
      { title: "Follow-Up Call Sequences", duration: "40 min", type: "video" },
    ]
  },
  {
    category: "Lead Qualification",
    icon: Target,
    description: "Identify and prioritize lead sources",
    modules: [
      { title: "Hot vs Warm vs Cold Leads", duration: "35 min", type: "video" },
      { title: "Online Lead Qualification", duration: "25 min", type: "guide" },
      { title: "Referral Lead Handling", duration: "30 min", type: "pdf" },
      { title: "Developer Lead Processing", duration: "40 min", type: "video" },
    ]
  },
  {
    category: "Call Scenarios",
    icon: Headphones,
    description: "Handle every conversation type",
    modules: [
      { title: "Initial Inquiry Calls", duration: "30 min", type: "video" },
      { title: "Post-Viewing Follow-Up", duration: "25 min", type: "guide" },
      { title: "Price Negotiation Calls", duration: "40 min", type: "video" },
      { title: "Contract Discussion Calls", duration: "35 min", type: "pdf" },
    ]
  },
  {
    category: "Buyer Psychology",
    icon: Brain,
    description: "Understand buying decisions",
    modules: [
      { title: "First-Time Buyer Mindset", duration: "35 min", type: "video" },
      { title: "Buyer Decision Timeline", duration: "30 min", type: "guide" },
      { title: "Emotional vs Logical Buyers", duration: "40 min", type: "video" },
      { title: "Trust Building Techniques", duration: "25 min", type: "pdf" },
    ]
  },
  {
    category: "Closing Techniques",
    icon: Award,
    description: "Master the art of closing",
    modules: [
      { title: "Trial Close Methods", duration: "30 min", type: "video" },
      { title: "Assumptive Close Technique", duration: "25 min", type: "guide" },
      { title: "Urgency Creation", duration: "35 min", type: "video" },
      { title: "Final Walkthrough & Handover", duration: "40 min", type: "pdf" },
    ]
  },
];

const FREE_BOOKS = [
  {
    title: "Objection Handling Guide",
    pages: 85,
    description: "Complete guide to handling every objection in UAE real estate",
  },
  {
    title: "Cold Calling Scripts Book",
    pages: 45,
    description: "Word-for-word scripts for every cold calling scenario",
  },
  {
    title: "Buyer Psychology Guide",
    pages: 62,
    description: "Understanding and influencing buyer decisions",
  },
  {
    title: "Lead Conversion Manual",
    pages: 78,
    description: "Turn every lead type into closed deals",
  },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video className="w-3 h-3" />;
    case 'pdf': return <FileText className="w-3 h-3" />;
    default: return <BookOpen className="w-3 h-3" />;
  }
};

export function BrokerToolkitEducation() {
  return (
    <>
      {/* Training & Education Section - Blue Theme with Layer */}
      <section id="section-education" className="py-8 md:py-10 bg-black">
        <div className="container mx-auto px-4">
          {/* Active Blue Layer */}
          <div className="bg-gradient-to-br from-blue-900/90 via-blue-900/80 to-blue-950/90 border border-blue-500/30 rounded-2xl p-6 md:p-8 shadow-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <Badge className="bg-blue-500/30 text-blue-200 border-blue-400/50 mb-4">
                <GraduationCap className="w-3 h-3 mr-1" />
                Training & Education
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                24 Trainings Modules to <span className="text-blue-300">Master Real Estate</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Comprehensive video courses, guides, and playbooks to accelerate your career.
              </p>
            </motion.div>

            {/* Learning Categories Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {LEARNING_CATEGORIES.map((category, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-blue-900/60 border border-blue-500/30 hover:border-blue-400 hover:bg-blue-900/80 transition-all h-full shadow-lg shadow-blue-500/10">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-blue-500/30 rounded-lg flex items-center justify-center">
                          <category.icon className="w-5 h-5 text-blue-200" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{category.category}</h3>
                          <p className="text-blue-300/70 text-xs">{category.modules.length} modules</p>
                        </div>
                      </div>
                      <p className="text-blue-200/70 text-sm mb-4">{category.description}</p>
                      <div className="space-y-2">
                        {category.modules.map((module, j) => (
                          <div key={j} className="flex items-center justify-between text-xs py-1.5 border-b border-blue-500/20 last:border-0">
                            <div className="flex items-center gap-2 text-blue-200/80">
                              {getTypeIcon(module.type)}
                              <span className="truncate">{module.title}</span>
                            </div>
                            <span className="text-blue-300/60 flex items-center gap-1 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              {module.duration}
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Free Books Section - Emerald Theme with Layer */}
      <section className="py-8 md:py-10 bg-black">
        <div className="container mx-auto px-4">
          {/* Active Emerald Layer */}
          <div className="bg-gradient-to-br from-emerald-900/90 via-emerald-900/80 to-emerald-950/90 border border-emerald-500/30 rounded-2xl p-6 md:p-8 shadow-lg">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-8"
            >
              <Badge className="bg-emerald-500/30 text-emerald-200 border-emerald-400/50 mb-4">
                <Download className="w-3 h-3 mr-1" />
                Free PDF Books
              </Badge>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                4 Free Books <span className="text-emerald-300">to Download</span>
              </h3>
              <p className="text-zinc-400">
                Exclusive guides written for UAE real estate professionals.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {FREE_BOOKS.map((book, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-400 hover:scale-105 transition-all cursor-pointer h-full shadow-lg shadow-emerald-500/10">
                    <CardContent className="p-5 text-center">
                      <div className="w-16 h-20 bg-emerald-500/30 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-emerald-200" />
                      </div>
                      <h4 className="text-white font-semibold mb-1">{book.title}</h4>
                      <p className="text-emerald-300/70 text-xs mb-2">{book.pages} pages</p>
                      <p className="text-emerald-200/60 text-xs">{book.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
