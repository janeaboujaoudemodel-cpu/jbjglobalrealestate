import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Lock, ArrowLeft, Activity, MapPin, Bot, Calendar, FileText, FileSignature } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import { DUBAI_AREAS_MARKET_DATA } from "@/config/open-data-config";

// Import all broker intelligence components
import { TodaysMarketSignals } from "@/components/broker-intelligence/TodaysMarketSignals";
import { LeadMarketContext } from "@/components/broker-intelligence/LeadMarketContext";
import { BrokerAIAssistant } from "@/components/broker-intelligence/BrokerAIAssistant";
import { BrokerCalendarWidget } from "@/components/broker-intelligence/BrokerCalendarWidget";
import { BrokerNotesWidget } from "@/components/broker-intelligence/BrokerNotesWidget";
import { DocuSignIntegration } from "@/components/broker-intelligence/DocuSignIntegration";

const BrokerIntelligence = () => {
  const { user } = useAuth();
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [leadIntent, setLeadIntent] = useState<"buy" | "sell" | "rent">("buy");

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Broker Intelligence Hub | JBJ Global Real Estate"
        description="Unified broker intelligence hub with market signals, AI assistant, calendar, notes, and DocuSign integration."
        canonicalPath="/internal/market-intelligence/brokers"
      />

      {/* Internal Warning Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/30 py-3">
        <div className="container mx-auto px-4 flex items-center justify-center gap-3">
          <Lock className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-sm font-medium">INTERNAL USE ONLY — Broker Intelligence Hub</span>
        </div>
      </div>

      {/* Header */}
      <section className="py-8 border-b border-zinc-900">
        <div className="container mx-auto px-4">
          <Link to="/internal/market-intelligence/dashboard" className="inline-flex items-center gap-2 text-gold hover:text-gold-light mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center">
                <Users className="w-6 h-6 text-gold" />
              </div>
              <div>
                <h1 className="text-white text-2xl md:text-3xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Broker Intelligence Hub
                </h1>
                <p className="text-zinc-500">All tools in one place • Market signals • AI Assistant • Contracts</p>
              </div>
            </div>

            {/* Area & Intent Selectors */}
            <div className="flex items-center gap-3">
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTriggerDark className="w-[180px]">
                  <SelectValue placeholder="Select area" />
                </SelectTriggerDark>
                <SelectContentDark>
                  {DUBAI_AREAS_MARKET_DATA.map((area) => (
                    <SelectItemDark key={area.area} value={area.area}>
                      {area.area}
                    </SelectItemDark>
                  ))}
                </SelectContentDark>
              </Select>

              <Select value={leadIntent} onValueChange={(v) => setLeadIntent(v as "buy" | "sell" | "rent")}>
                <SelectTriggerDark className="w-[120px]">
                  <SelectValue />
                </SelectTriggerDark>
                <SelectContentDark>
                  <SelectItemDark value="buy">BUY</SelectItemDark>
                  <SelectItemDark value="sell">SELL</SelectItemDark>
                  <SelectItemDark value="rent">RENT</SelectItemDark>
                </SelectContentDark>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Tabbed Interface */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="signals" className="w-full">
            <TabsList className="bg-zinc-900 border border-zinc-800 w-full flex flex-wrap justify-start gap-1 h-auto p-1">
              <TabsTrigger 
                value="signals" 
                className="flex items-center gap-2 data-[state=active]:bg-gold/20 data-[state=active]:text-gold"
              >
                <Activity className="w-4 h-4" />
                <span className="hidden sm:inline">Market Signals</span>
                <span className="sm:hidden">Signals</span>
              </TabsTrigger>
              <TabsTrigger 
                value="context" 
                className="flex items-center gap-2 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Lead Context</span>
                <span className="sm:hidden">Context</span>
              </TabsTrigger>
              <TabsTrigger 
                value="assistant" 
                className="flex items-center gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
              >
                <Bot className="w-4 h-4" />
                <span className="hidden sm:inline">AI Assistant</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger 
                value="calendar" 
                className="flex items-center gap-2 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400"
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="flex items-center gap-2 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400"
              >
                <FileText className="w-4 h-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="docusign" 
                className="flex items-center gap-2 data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400"
              >
                <FileSignature className="w-4 h-4" />
                DocuSign
              </TabsTrigger>
            </TabsList>

            {/* Tab Contents */}
            <div className="mt-6">
              <TabsContent value="signals" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <TodaysMarketSignals />
                </motion.div>
              </TabsContent>

              <TabsContent value="context" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LeadMarketContext leadArea={selectedArea} leadIntent={leadIntent} />
                  {!selectedArea && (
                    <div className="mt-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/50 text-center">
                      <MapPin className="w-6 h-6 text-zinc-600 mx-auto mb-2" />
                      <p className="text-zinc-500 text-sm">Select an area from the dropdown above to view market context</p>
                    </div>
                  )}
                </motion.div>
              </TabsContent>

              <TabsContent value="assistant" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <BrokerAIAssistant />
                </motion.div>
              </TabsContent>

              <TabsContent value="calendar" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <BrokerCalendarWidget />
                </motion.div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <BrokerNotesWidget />
                </motion.div>
              </TabsContent>

              <TabsContent value="docusign" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <DocuSignIntegration />
                </motion.div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default BrokerIntelligence;
