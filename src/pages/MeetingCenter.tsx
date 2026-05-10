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
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Button variant="outline" size="sm" onClick={() => window.history.back()} className="border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
          <Calendar className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative py-12 px-4 overflow-hidden">
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full mb-6">
            <Calendar className="w-5 h-5 text-[#1A1A1A]" />
            <span className="text-[#1A1A1A]-dark font-medium text-sm">Communication Hub</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
            Meeting <span className="text-[#1A1A1A]">Center</span>
          </h1>
          
          <p className="text-lg text-[#1A1A1A]/70 max-w-2xl mx-auto mb-8">
            Central hub for all your meeting summaries, call notes, and voice AI interactions. 
            Track action items and client communications in one place.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/ai-meeting-summarizer">
              <Button className="bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/40 hover:brightness-105">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A1A1A]/70" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name or content..."
              className="pl-10 bg-[#FDFBF7] border-[#B89555]/20 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#FDFBF7]/80 border-2 border-[#B89555]/30 mb-6 flex-wrap h-auto p-1">
            <TabsTrigger value="all" className="tab-trigger-champagne text-[#1A1A1A]">
              <Calendar className="w-4 h-4 mr-2" />
              All
            </TabsTrigger>
            <TabsTrigger value="meeting" className="tab-trigger-champagne text-[#1A1A1A]">
              <Video className="w-4 h-4 mr-2" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="call" className="tab-trigger-champagne text-[#1A1A1A]">
              <Phone className="w-4 h-4 mr-2" />
              Phone Calls
            </TabsTrigger>
            <TabsTrigger value="voice" className="tab-trigger-champagne text-[#1A1A1A]">
              <Mic className="w-4 h-4 mr-2" />
              Voice AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="text-center py-16 bg-[#FDFBF7]/60 rounded-2xl border border-[#B89555]/20">
                <Loader2 className="w-8 h-8 text-[#1A1A1A] mx-auto mb-4 animate-spin" />
                <p className="text-[#1A1A1A]/70">Loading summaries...</p>
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="text-center py-16 bg-[#FDFBF7]/60 rounded-2xl border border-[#B89555]/20">
                <Calendar className="w-12 h-12 text-[#1A1A1A]/70 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No summaries yet</h3>
                <p className="text-[#1A1A1A]/70 mb-6">
                  {activeTab === "all" 
                    ? "Start by summarizing a meeting or call"
                    : `No ${activeTab === "voice" ? "voice AI calls" : activeTab + "s"} recorded yet`
                  }
                </p>
                <div className="flex justify-center gap-4">
                  <Link to="/ai-meeting-summarizer">
                    <Button className="bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] text-[#1A1A1A] border border-[#B89555]/40">
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
