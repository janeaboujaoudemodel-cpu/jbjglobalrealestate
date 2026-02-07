import { useState } from "react";
import { Link } from "react-router-dom";
import { Video, Phone, Calendar, FileText, Filter, Search, Plus, Clock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data - in production, this would come from the database
const mockMeetingSummaries = [
  {
    id: "1",
    type: "meeting",
    clientName: "Ahmed Al Rashid",
    date: "2026-02-06",
    summary: "Discussed Palm Jumeirah penthouse options. Client interested in 4BR with sea view.",
    actionItems: ["Send property shortlist", "Schedule viewing for Feb 10"],
  },
  {
    id: "2",
    type: "meeting",
    clientName: "Sarah Johnson",
    date: "2026-02-05",
    summary: "First-time buyer consultation. Budget AED 2-3M, Downtown or Marina preferred.",
    actionItems: ["Prepare mortgage pre-approval checklist", "Send buyer guide"],
  },
];

const mockCallSummaries = [
  {
    id: "3",
    type: "call",
    clientName: "Mohammed Hassan",
    date: "2026-02-06",
    summary: "Follow-up on Emaar Beachfront viewing. Client loved the property, wants to negotiate.",
    actionItems: ["Prepare offer letter", "Check developer incentives"],
  },
  {
    id: "4",
    type: "call",
    clientName: "Lisa Chen",
    date: "2026-02-04",
    summary: "Investment inquiry. Looking for off-plan with high ROI. Budget USD 500K.",
    actionItems: ["Send investment comparison report", "Schedule call with developer"],
  },
];

const MeetingCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const allSummaries = [...mockMeetingSummaries, ...mockCallSummaries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredSummaries = allSummaries.filter((item) => {
    const matchesSearch = item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || item.type === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/40 via-black to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-600/20 via-transparent to-transparent opacity-50" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/30 rounded-full mb-6">
            <Calendar className="w-5 h-5 text-violet-400" />
            <span className="text-violet-400 font-medium text-sm">Meeting & Call Center</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Meeting <span className="text-violet-400">Center</span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Central hub for all your meeting and call summaries. Quick access to action items, 
            follow-ups, and client communication history.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/ai-meeting-summarizer">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white">
                <Video className="w-4 h-4 mr-2" />
                New Meeting Summary
              </Button>
            </Link>
            <Link to="/ai-call-summarizer">
              <Button variant="outline" className="border-violet-500/50 text-violet-400 hover:bg-violet-500/10">
                <Phone className="w-4 h-4 mr-2" />
                New Call Summary
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name or content..."
              className="pl-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              All
            </TabsTrigger>
            <TabsTrigger value="meeting" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Video className="w-4 h-4 mr-2" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="call" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Phone className="w-4 h-4 mr-2" />
              Calls
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredSummaries.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No summaries found</h3>
                <p className="text-zinc-400 mb-6">Start by summarizing a meeting or call</p>
                <div className="flex justify-center gap-4">
                  <Link to="/ai-meeting-summarizer">
                    <Button className="bg-violet-600 hover:bg-violet-500">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Meeting
                    </Button>
                  </Link>
                  <Link to="/ai-call-summarizer">
                    <Button variant="outline" className="border-violet-500/50 text-violet-400">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Call
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSummaries.map((item) => (
                  <div
                    key={item.id}
                    className="bg-zinc-900/80 border border-zinc-800 hover:border-violet-500/30 rounded-xl p-6 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.type === "meeting" 
                            ? "bg-violet-500/20 text-violet-400" 
                            : "bg-orange-500/20 text-orange-400"
                        }`}>
                          {item.type === "meeting" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            <User className="w-4 h-4 text-zinc-500" />
                            {item.clientName}
                          </h3>
                          <p className="text-sm text-zinc-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(item.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.type === "meeting"
                          ? "bg-violet-500/20 text-violet-400"
                          : "bg-orange-500/20 text-orange-400"
                      }`}>
                        {item.type === "meeting" ? "Meeting" : "Call"}
                      </span>
                    </div>

                    <p className="text-zinc-300 mb-4">{item.summary}</p>

                    {item.actionItems.length > 0 && (
                      <div className="pt-4 border-t border-zinc-800">
                        <h4 className="text-sm font-medium text-zinc-400 mb-2">Action Items:</h4>
                        <ul className="space-y-1">
                          {item.actionItems.map((action, i) => (
                            <li key={i} className="text-sm text-zinc-300 flex items-center gap-2">
                              <ArrowRight className="w-3 h-3 text-violet-400" />
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MeetingCenter;
