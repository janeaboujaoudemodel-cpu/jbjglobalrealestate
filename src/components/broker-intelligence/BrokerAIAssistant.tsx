import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContentDark, SelectItemDark, SelectTriggerDark, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Loader2, MessageSquare, MapPin, Shield, AlertTriangle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { DUBAI_AREAS_MARKET_DATA } from "@/config/open-data-config";

type AssistantType = "market_explanation" | "objection_handling" | "area_narrative" | "conversation_frame";

interface AIResponse {
  response: string;
  type: string;
  area?: string;
  transactionType?: string;
  timestamp: string;
  disclaimer: string;
}

export function BrokerAIAssistant() {
  const [selectedType, setSelectedType] = useState<AssistantType>("market_explanation");
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [transactionType, setTransactionType] = useState<"buy" | "sell" | "rent">("buy");
  const [context, setContext] = useState("");
  const [clientObjection, setClientObjection] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);

  const handleSubmit = async () => {
    if (!selectedArea && selectedType !== "conversation_frame") {
      toast.error("Please select an area");
      return;
    }

    setIsLoading(true);
    setAiResponse(null);

    try {
      const { data, error } = await supabase.functions.invoke("broker-ai-assistant", {
        body: {
          type: selectedType,
          area: selectedArea,
          context,
          clientObjection,
          transactionType,
        },
      });

      if (error) throw error;
      
      setAiResponse(data as AIResponse);
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      if (error.message?.includes("429") || error.message?.includes("rate limit")) {
        toast.error("Rate limit reached. Please wait and try again.");
      } else if (error.message?.includes("402")) {
        toast.error("AI credits exhausted. Contact admin.");
      } else {
        toast.error("Failed to get AI response. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeDescription = (type: AssistantType): string => {
    switch (type) {
      case "market_explanation":
        return "Get a market summary and talking points for client conversations";
      case "objection_handling":
        return "Handle client concerns with data-backed responses";
      case "area_narrative":
        return "Generate a compliant market narrative for a specific area";
      case "conversation_frame":
        return "Frame a professional conversation structure";
    }
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Bot className="w-5 h-5 text-gold" />
          AI Broker Assistant
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs ml-2">
            Internal Only
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type Selection */}
        <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as AssistantType)}>
          <TabsList className="grid grid-cols-4 bg-zinc-800">
            <TabsTrigger value="market_explanation" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Explain
            </TabsTrigger>
            <TabsTrigger value="objection_handling" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Objection
            </TabsTrigger>
            <TabsTrigger value="area_narrative" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              Narrative
            </TabsTrigger>
            <TabsTrigger value="conversation_frame" className="text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Frame
            </TabsTrigger>
          </TabsList>

          <p className="text-zinc-500 text-xs mt-2">{getTypeDescription(selectedType)}</p>

          {/* Common Controls */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Select value={selectedArea} onValueChange={setSelectedArea}>
              <SelectTriggerDark>
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

            <Select value={transactionType} onValueChange={(v) => setTransactionType(v as "buy" | "sell" | "rent")}>
              <SelectTriggerDark>
                <SelectValue />
              </SelectTriggerDark>
              <SelectContentDark>
                <SelectItemDark value="buy">BUY</SelectItemDark>
                <SelectItemDark value="sell">SELL</SelectItemDark>
                <SelectItemDark value="rent">RENT</SelectItemDark>
              </SelectContentDark>
            </Select>
          </div>

          {/* Type-specific inputs */}
          <TabsContent value="market_explanation" className="mt-3">
            <Textarea
              placeholder="Add context about the client's inquiry (optional)..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
            />
          </TabsContent>

          <TabsContent value="objection_handling" className="mt-3">
            <Textarea
              placeholder="What objection has the client raised? e.g., 'The prices seem too high'"
              value={clientObjection}
              onChange={(e) => setClientObjection(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
            />
          </TabsContent>

          <TabsContent value="area_narrative" className="mt-3">
            <p className="text-zinc-500 text-sm">
              Generate a compliant narrative for {selectedArea || "selected area"} focused on {transactionType.toUpperCase()} transactions.
            </p>
          </TabsContent>

          <TabsContent value="conversation_frame" className="mt-3">
            <Textarea
              placeholder="Describe the meeting context, e.g., 'First meeting with investor looking for rental yield'"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[80px]"
            />
          </TabsContent>
        </Tabs>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          variant="ai-gold"
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Get AI Guidance
            </>
          )}
        </Button>

        {/* Response */}
        {aiResponse && (
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot className="w-4 h-4 text-gold" />
              <span className="text-gold text-sm font-medium">AI Response</span>
              <Badge variant="outline" className="text-zinc-400 border-zinc-600 text-xs ml-auto">
                {new Date(aiResponse.timestamp).toLocaleTimeString()}
              </Badge>
            </div>
            
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-zinc-300 whitespace-pre-wrap text-sm">
                {aiResponse.response}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-700/50 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-zinc-500 text-xs">{aiResponse.disclaimer}</p>
            </div>
          </div>
        )}

        {/* Compliance Reminder */}
        <div className="bg-zinc-800/30 rounded-lg p-3 flex items-start gap-2">
          <Shield className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
          <p className="text-zinc-600 text-xs">
            AI guidance is descriptive only. Never use predictions, guarantees, or investment advice language with clients.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default BrokerAIAssistant;
