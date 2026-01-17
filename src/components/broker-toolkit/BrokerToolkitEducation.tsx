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
    color: "from-red-500 to-rose-500",
    textColor: "text-red-400",
    bgColor: "bg-red-500/10",
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
    color: "from-blue-500 to-cyan-500",
    textColor: "text-blue-400",
    bgColor: "bg-blue-500/10",
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
    color: "from-green-500 to-emerald-500",
    textColor: "text-green-400",
    bgColor: "bg-green-500/10",
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
    color: "from-purple-500 to-fuchsia-500",
    textColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
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
    color: "from-amber-500 to-orange-500",
    textColor: "text-amber-400",
    bgColor: "bg-amber-500/10",
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
    color: "from-gold to-gold-dark",
    textColor: "text-gold",
    bgColor: "bg-gold/10",
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
    title: "Objection Handling Bible",
    pages: 85,
    description: "Complete guide to handling every objection in UAE real estate",
    color: "from-red-500/20 to-rose-500/20",
    borderColor: "border-red-500/30",
    textColor: "text-red-400",
  },
  {
    title: "Cold Calling Scripts",
    pages: 45,
    description: "Word-for-word scripts for every cold calling scenario",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
  },
  {
    title: "Buyer Psychology Playbook",
    pages: 62,
    description: "Understanding and influencing buyer decisions",
    color: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
  },
  {
    title: "Lead Conversion Manual",
    pages: 78,
    description: "Turn every lead type into closed deals",
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
    textColor: "text-green-400",
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
    <section id="section-education" className="py-16 md:py-20 bg-zinc-900/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 mb-4">
            <GraduationCap className="w-3 h-3 mr-1" />
            Training & Education
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            24 Training Modules to <span className="text-blue-400">Master Real Estate</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Comprehensive video courses, guides, and playbooks to accelerate your career.
          </p>
        </motion.div>

        {/* Learning Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {LEARNING_CATEGORIES.map((category, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="bg-white border border-zinc-200 hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all h-full">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 ${category.bgColor} rounded-lg flex items-center justify-center`}>
                      <category.icon className={`w-5 h-5 ${category.textColor}`} />
                    </div>
                    <div>
                      <h3 className="text-black font-semibold">{category.category}</h3>
                      <p className="text-zinc-500 text-xs">{category.modules.length} modules</p>
                    </div>
                  </div>
                  <p className="text-zinc-600 text-sm mb-4">{category.description}</p>
                  <div className="space-y-2">
                    {category.modules.map((module, j) => (
                      <div key={j} className="flex items-center justify-between text-xs py-1.5 border-b border-zinc-200 last:border-0">
                        <div className="flex items-center gap-2 text-zinc-700">
                          {getTypeIcon(module.type)}
                          <span className="truncate">{module.title}</span>
                        </div>
                        <span className="text-zinc-500 flex items-center gap-1 flex-shrink-0">
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

        {/* Free Books Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4">
            <Download className="w-3 h-3 mr-1" />
            Free PDF Books
          </Badge>
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
            4 Free Books to Download
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
              <Card className={`bg-gradient-to-br ${book.color} border ${book.borderColor} hover:scale-105 transition-transform cursor-pointer h-full`}>
                <CardContent className="p-5 text-center">
                  <div className="w-16 h-20 bg-white/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                    <BookOpen className={`w-8 h-8 ${book.textColor}`} />
                  </div>
                  <h4 className="text-white font-semibold mb-1">{book.title}</h4>
                  <p className="text-zinc-400 text-xs mb-2">{book.pages} pages</p>
                  <p className="text-zinc-500 text-xs">{book.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
