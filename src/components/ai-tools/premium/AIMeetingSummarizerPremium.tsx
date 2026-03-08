import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileAudio, Loader2, Copy, Check, Sparkles, 
  ListChecks, Users, Clock, Target, Calendar,
  Home, Calculator, Brain, Send, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAITool } from "../AIToolsProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import AIToolPremiumLayout from "../AIToolPremiumLayout";

const AIMeetingSummarizerPremium = () => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    meetingTitle: "",
    participants: "",
    notes: "",
    duration: "",
  });
  const [copied, setCopied] = useState(false);
  const [creatingTasks, setCreatingTasks] = useState(false);
  const [tasksCreated, setTasksCreated] = useState(false);
  const [propertyResults, setPropertyResults] = useState<any[]>([]);
  const [searchingProperties, setSearchingProperties] = useState(false);
  const [mortgageResult, setMortgageResult] = useState<any>(null);
  const [mortgagePrice, setMortgagePrice] = useState("");

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.notes.trim()) {
      toast.error("Please enter meeting notes");
      return;
    }
    const result = await invokeTool("ai-meeting-summarizer", formData);
    if (result.success) {
      toast.success("Meeting summarized successfully!");
    }
  };

  const copyToClipboard = (text?: string) => {
    const content = text || response?.summary || "";
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  // --- CRM: Create all action items as tasks ---
  const handleCreateAllTasks = async () => {
    const items = response?.actionItems;
    if (!items?.length) return;
    setCreatingTasks(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in"); return; }
      const tasks = items.map((item: any) => ({
        title: typeof item === "string" ? item : item.task || item.title || String(item),
        description: `From meeting: ${formData.meetingTitle || "Untitled"}\nParticipants: ${formData.participants || "N/A"}`,
        priority: typeof item === "object" ? item.priority || "medium" : "medium",
        due_date: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
        status: "pending",
        category: "follow-up",
        user_id: user.id,
      }));
      const { error } = await supabase.from("admin_tasks").insert(tasks);
      if (error) throw error;
      setTasksCreated(true);
      toast.success(`${tasks.length} tasks created in CRM`);
    } catch (e: any) {
      toast.error("Failed to create tasks: " + e.message);
    } finally {
      setCreatingTasks(false);
    }
  };

  // --- Property Recommendations ---
  const handlePropertySearch = async () => {
    setSearchingProperties(true);
    try {
      const notesLower = formData.notes.toLowerCase();
      let query = supabase
        .from("projects")
        .select("id, name, slug, price_from, area_name, developer_name, property_type_label, bedrooms_min, bedrooms_max, construction_status")
        .order("price_from", { ascending: false })
        .limit(6);

      // Extract budget hints from notes
      const budgetMatch = formData.notes.match(/[\d,]+(?:\s*(?:aed|AED|million|m))/);
      if (budgetMatch) {
        let budget = parseInt(budgetMatch[0].replace(/[^0-9]/g, ""));
        if (budgetMatch[0].toLowerCase().includes("million") || budgetMatch[0].toLowerCase().includes("m")) budget *= 1000000;
        query = query.lte("price_from", budget * 1.3);
      }

      if (notesLower.includes("villa")) query = query.ilike("property_type_label", "%villa%");
      else if (notesLower.includes("apartment")) query = query.ilike("property_type_label", "%apartment%");
      if (notesLower.includes("marina")) query = query.ilike("area_name", "%marina%");
      else if (notesLower.includes("downtown")) query = query.ilike("area_name", "%downtown%");
      else if (notesLower.includes("palm")) query = query.ilike("area_name", "%palm%");

      const { data, error } = await query;
      if (error) throw error;
      setPropertyResults(data || []);
      if (!data?.length) toast.info("No matching properties found. Try broadening your search.");
    } catch (e: any) {
      toast.error("Property search failed: " + e.message);
    } finally {
      setSearchingProperties(false);
    }
  };

  // --- Mortgage Calculator ---
  const handleMortgageCalc = () => {
    const price = parseInt(mortgagePrice.replace(/[^0-9]/g, "")) || 2000000;
    const downPct = 20;
    const down = price * (downPct / 100);
    const loan = price - down;
    const rate = 4.5 / 100 / 12;
    const n = 25 * 12;
    const monthly = (loan * rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    setMortgageResult({ price, down, loan, monthly: Math.round(monthly), rate: 4.5, years: 25 });
  };

  return (
    <AIToolPremiumLayout
      title="AI Meeting Summarizer & CRM Assistant"
      subtitle="Summarize meetings, extract action items, recommend properties, and sync with CRM — all in one place"
      icon={<Brain className="h-8 w-8 text-violet-400" />}
      accentColor="violet"
      gradientFrom="violet"
      badge="Meeting Intelligence + CRM"
    >
      <div className="space-y-8">
        {/* Input Section */}
        <Card className="bg-violet-900/20 border-violet-500/30">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 text-violet-400 mb-4">
              <FileAudio className="h-5 w-5" />
              <span className="font-semibold">Meeting Details</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-violet-400" />
                  Meeting Title
                </Label>
                <Input
                  placeholder="Client Discovery Call - Palm Jumeirah"
                  value={formData.meetingTitle}
                  onChange={(e) => handleChange("meetingTitle", e.target.value)}
                  className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-400" />
                  Duration
                </Label>
                <Input
                  placeholder="45 minutes"
                  value={formData.duration}
                  onChange={(e) => handleChange("duration", e.target.value)}
                  className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-violet-400" />
                Participants
              </Label>
              <Input
                placeholder="John Smith (Client), Sarah Ahmed (Agent)"
                value={formData.participants}
                onChange={(e) => handleChange("participants", e.target.value)}
                className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Meeting Notes / Transcript *</Label>
              <Textarea
                placeholder="Paste your meeting notes, transcript, or key discussion points here..."
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                rows={10}
                className="bg-zinc-900/50 border-violet-500/30 text-white hover:border-violet-500/50 focus:border-violet-400 transition-colors"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 text-white font-semibold py-6"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Summarizing Meeting...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Summary & Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {response ? (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Action Items with CRM Sync */}
              {response.actionItems && response.actionItems.length > 0 && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                  <Card className="bg-violet-500/10 border-violet-500/30 p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ListChecks className="h-5 w-5 text-violet-400" />
                        <h4 className="font-semibold text-white">Action Items</h4>
                        <Badge className="bg-violet-500/20 text-violet-400 border-0">
                          {response.actionItems.length} items
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={handleCreateAllTasks}
                        disabled={creatingTasks || tasksCreated}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
                      >
                        {tasksCreated ? (
                          <><Check className="h-3 w-3 mr-1" /> Synced to CRM</>
                        ) : creatingTasks ? (
                          <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Creating...</>
                        ) : (
                          <><Plus className="h-3 w-3 mr-1" /> Create All Tasks</>
                        )}
                      </Button>
                    </div>
                    <ul className="space-y-2">
                      {response.actionItems.map((item: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-3 text-sm">
                          <span className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center flex-shrink-0 text-xs text-violet-400 font-semibold">
                            {idx + 1}
                          </span>
                          <span className="text-zinc-300">{typeof item === "string" ? item : item.task || JSON.stringify(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}

              {/* Key Decisions */}
              {response.keyDecisions && response.keyDecisions.length > 0 && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}>
                  <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Target className="h-5 w-5 text-emerald-400" />
                      <h4 className="font-semibold text-white">Key Decisions</h4>
                    </div>
                    <ul className="space-y-2">
                      {response.keyDecisions.map((decision: any, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-zinc-300">
                          <span className="text-emerald-400">✓</span>
                          {typeof decision === "string" ? decision : decision.decision || JSON.stringify(decision)}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}

              {/* Follow-ups */}
              {response.followUps && response.followUps.length > 0 && (
                <Card className="bg-violet-900/20 border-violet-500/30 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="h-5 w-5 text-violet-400" />
                    <h4 className="font-semibold text-white">Follow-ups Required</h4>
                  </div>
                  <ul className="space-y-2">
                    {response.followUps.map((followUp: string, idx: number) => (
                      <li key={idx} className="text-sm text-zinc-300 flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 text-violet-400 flex-shrink-0" />
                        {followUp}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Full Summary */}
              <Card className="bg-violet-900/20 border-violet-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">Full Summary</h4>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard()}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="bg-zinc-800/50 p-4 rounded-lg text-zinc-300 whitespace-pre-wrap text-sm max-h-[300px] overflow-y-auto">
                    {response.summary || response.executiveSummary || "No summary generated."}
                  </div>
                </CardContent>
              </Card>

              {/* CRM Tools Tabs */}
              <Card className="bg-zinc-900/50 border-violet-500/20">
                <CardContent className="p-4">
                  <Tabs defaultValue="properties">
                    <TabsList className="bg-zinc-800 border-zinc-700 w-full">
                      <TabsTrigger value="properties" className="flex-1 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                        <Home className="h-4 w-4 mr-1" /> Properties
                      </TabsTrigger>
                      <TabsTrigger value="mortgage" className="flex-1 data-[state=active]:bg-violet-600 data-[state=active]:text-white">
                        <Calculator className="h-4 w-4 mr-1" /> Mortgage
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="properties" className="mt-4 space-y-3">
                      <p className="text-zinc-400 text-xs">Auto-detect property preferences from meeting notes:</p>
                      <Button onClick={handlePropertySearch} disabled={searchingProperties} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white">
                        {searchingProperties ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Home className="h-4 w-4 mr-1" />}
                        Find Matching Properties
                      </Button>
                      {propertyResults.length > 0 && (
                        <div className="space-y-2 mt-2">
                          {propertyResults.map((p) => (
                            <a key={p.id} href={`/project/${p.slug}`} target="_blank" rel="noopener noreferrer"
                              className="block bg-zinc-800 rounded-lg p-3 hover:bg-zinc-700 transition-colors">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="text-white text-sm font-medium">{p.name}</p>
                                  <p className="text-zinc-400 text-xs">{p.area_name} · {p.property_type_label} · {p.bedrooms_min}-{p.bedrooms_max} BR</p>
                                </div>
                                <Badge className="bg-violet-500/20 text-violet-400 border-0 text-xs">
                                  AED {(p.price_from || 0).toLocaleString()}
                                </Badge>
                              </div>
                            </a>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="mortgage" className="mt-4 space-y-3">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Property price (AED)"
                          value={mortgagePrice}
                          onChange={(e) => setMortgagePrice(e.target.value)}
                          className="bg-zinc-800 border-zinc-700 text-white text-sm"
                        />
                        <Button onClick={handleMortgageCalc} size="sm" className="bg-violet-600 hover:bg-violet-500 text-white">
                          Calculate
                        </Button>
                      </div>
                      {mortgageResult && (
                        <div className="bg-zinc-800 rounded-lg p-3 space-y-1 text-sm">
                          <p className="text-white font-medium">Mortgage Estimate</p>
                          <p className="text-zinc-400">Property: <span className="text-white">AED {mortgageResult.price.toLocaleString()}</span></p>
                          <p className="text-zinc-400">Down Payment (20%): <span className="text-white">AED {mortgageResult.down.toLocaleString()}</span></p>
                          <p className="text-zinc-400">Loan: <span className="text-white">AED {mortgageResult.loan.toLocaleString()}</span></p>
                          <p className="text-zinc-400">Monthly: <span className="text-emerald-400 font-semibold">AED {mortgageResult.monthly.toLocaleString()}</span></p>
                          <p className="text-zinc-500 text-xs mt-1">Rate: {mortgageResult.rate}% · {mortgageResult.years} years · Estimate only</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div className="p-6 rounded-full bg-violet-500/10 mb-4">
                <Brain className="h-12 w-12 text-violet-400/50" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-400">Meeting Intelligence + CRM</h3>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">
                Paste meeting notes to get AI summaries, action items synced to CRM, property recommendations, and mortgage calculations
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AIToolPremiumLayout>
  );
};

export default AIMeetingSummarizerPremium;
