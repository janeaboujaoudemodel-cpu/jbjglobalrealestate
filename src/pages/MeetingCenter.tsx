import { useState } from "react";
import { Link } from "react-router-dom";
import { Video, Phone, Calendar, Search, Plus, Mic, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMeetingCenterData } from "@/hooks/useMeetingCenterData";
import InlineCallSummarizer from "@/components/meeting-center/InlineCallSummarizer";
import SummaryCard from "@/components/meeting-center/SummaryCard";

const MeetingCenter = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { summaries, isLoading, refetch } = useMeetingCenterData();

  const filteredSummaries = summaries.filter((item) => {
    const matchesSearch = item.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesTab = activeTab === "all";
    if (activeTab === "meeting") matchesTab = item.type === 'meeting';
    if (activeTab === "call") matchesTab = item.type === 'call';
    if (activeTab === "voice") matchesTab = item.type === 'voice-ai';
    
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
            <span className="text-violet-400 font-medium text-sm">Communication Hub</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Meeting <span className="text-violet-400">Center</span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-8">
            Central hub for all your meeting summaries, call notes, and voice AI interactions. 
            Track action items and client communications in one place.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/ai-meeting-summarizer">
              <Button className="bg-violet-600 hover:bg-violet-500 text-white">
                <Video className="w-4 h-4 mr-2" />
                New Meeting Summary
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 pb-20">
        {/* Inline Call Summarizer */}
        <div className="mb-6">
          <InlineCallSummarizer onSuccess={refetch} />
        </div>

        {/* Search */}
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
          <TabsList className="bg-zinc-900 border border-zinc-800 mb-6 flex-wrap h-auto p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger value="meeting" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
              <Video className="w-4 h-4 mr-2" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="call" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              <Phone className="w-4 h-4 mr-2" />
              Phone Calls
            </TabsTrigger>
            <TabsTrigger value="voice" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40">
              <Mic className="w-4 h-4 mr-2" />
              Voice AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <Loader2 className="w-8 h-8 text-violet-400 mx-auto mb-4 animate-spin" />
                <p className="text-zinc-400">Loading summaries...</p>
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No summaries found</h3>
                <p className="text-zinc-400 mb-6">
                  {activeTab === "all" 
                    ? "Start by summarizing a meeting or call"
                    : `No ${activeTab === "voice" ? "voice AI calls" : activeTab + "s"} recorded yet`
                  }
                </p>
                <div className="flex justify-center gap-4">
                  <Link to="/ai-meeting-summarizer">
                    <Button className="bg-violet-600 hover:bg-violet-500">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Meeting
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSummaries.map((item) => (
                  <SummaryCard key={item.id} item={item} />
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
