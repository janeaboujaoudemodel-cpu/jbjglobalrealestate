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
    gradientFrom: "from-purple-600",
    gradientTo: "to-violet-600",
  },
  {
    icon: MessageSquare,
    title: "Objection Handler",
    description: "Get AI-generated responses to common client objections with persuasion techniques.",
    href: "/ai-objection-handler",
    colorClass: "text-rose-400",
    borderColorClass: "border-rose-500/30",
    gradientFrom: "from-rose-600",
    gradientTo: "to-pink-600",
  },
  {
    icon: Calendar,
    title: "Follow-up Scheduler",
    description: "AI-optimized follow-up scheduling with best timing and channel recommendations.",
    href: "/ai-followup-scheduler",
    colorClass: "text-cyan-400",
    borderColorClass: "border-cyan-500/30",
    gradientFrom: "from-cyan-600",
    gradientTo: "to-teal-600",
  },
  {
    icon: Video,
    title: "Meeting Summarizer",
    description: "Automatically summarize meetings with action items, key points, and next steps.",
    href: "/ai-meeting-summarizer",
    colorClass: "text-violet-400",
    borderColorClass: "border-violet-500/30",
    gradientFrom: "from-violet-600",
    gradientTo: "to-purple-600",
  },
  {
    icon: FileCheck,
    title: "Contract Reviewer",
    description: "AI analysis of contracts highlighting risks, missing clauses, and recommendations.",
    href: "/ai-contract-reviewer",
    colorClass: "text-red-400",
    borderColorClass: "border-red-500/30",
    gradientFrom: "from-red-600",
    gradientTo: "to-rose-600",
  },
];

const BrokerSuite = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      {/* Hero Section */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-950/40 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6">
            <Users className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-medium text-sm">Broker Intelligence Suite</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Broker <span className="text-purple-400">Intelligence</span> Suite
          </h1>
          
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            AI-powered tools for lead management, client communication, and deal closing. 
            Accelerate your sales pipeline with intelligent automation.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-sm text-white/60">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-purple-400 rounded-full" />
              5 Tools Included
            </span>
            <span>•</span>
            <span>Broker Access Required</span>
          </div>
        </div>
      </div>
      
      {/* Tools Grid */}
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
