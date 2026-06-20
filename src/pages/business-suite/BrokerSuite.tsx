import { Users, MessageSquare, Calendar, Video, FileCheck } from "lucide-react";
import BusinessSuiteToolCard from "@/components/business-suite/BusinessSuiteToolCard";

const tools = [
  {
    icon: Users,
    title: "Lead Qualification",
    description: "AI-powered lead scoring with conversion probability and channel optimization recommendations.",
    href: "/ai-lead-qualification",
    colorClass: "text-purple-400",
    borderColorClass: "border-purple-500/30",
    gradientFrom: "from-[#B89555]",
    gradientTo: "to-[#8a6f3f]",
  },
  {
    icon: MessageSquare,
    title: "Objection Handler",
    description: "Get AI-generated responses to common client objections with persuasion techniques.",
    href: "/ai-objection-handler",
    colorClass: "text-rose-400",
    borderColorClass: "border-rose-500/30",
    gradientFrom: "from-[#B89555]",
    gradientTo: "to-[#8a6f3f]",
  },
  {
    icon: Calendar,
    title: "Follow-up Scheduler",
    description: "AI-optimized follow-up scheduling with best timing and channel recommendations.",
    href: "/ai-followup-scheduler",
    colorClass: "text-cyan-400",
    borderColorClass: "border-cyan-500/30",
    gradientFrom: "from-[#B89555]",
    gradientTo: "to-[#8a6f3f]",
  },
  {
    icon: Video,
    title: "Meeting Summarizer",
    description: "Automatically summarize meetings with action items, key points, and next steps.",
    href: "/ai-meeting-summarizer",
    colorClass: "text-violet-400",
    borderColorClass: "border-violet-500/30",
    gradientFrom: "from-[#B89555]",
    gradientTo: "to-[#8a6f3f]",
  },
  {
    icon: FileCheck,
    title: "Contract Reviewer",
    description: "AI analysis of contracts highlighting risks, missing clauses, and recommendations.",
    href: "/ai-contract-reviewer",
    colorClass: "text-red-400",
    borderColorClass: "border-red-500/30",
    gradientFrom: "from-[#B89555]",
    gradientTo: "to-[#8a6f3f]",
  },
];

const BrokerSuite = () => {
  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <div className="relative py-16 px-4">
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFE6D6] border border-[#B89555]/40 rounded-full mb-6">
            <Users className="w-5 h-5 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A] font-medium text-sm">Broker Intelligence Suite</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Broker Intelligence Suite
          </h1>
          <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto mb-8">
            AI-powered tools for lead management, client communication, and deal closing.
            Accelerate your sales pipeline with intelligent automation.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-[#1A1A1A]/70">
            <span>5 Tools Included</span>
            <span>•</span>
            <span>Broker Access Required</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <BusinessSuiteToolCard key={tool.href} {...tool} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BrokerSuite;
