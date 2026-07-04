/**
 * AI Client Matcher Page
 * Match clients to properties using AI preferences analysis
 */

import { useState } from "react";
import { Users, Target, MapPin, Home, DollarSign, Sparkles, Send, Building } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import AIToolPremiumLayout from "@/components/ai-tools/AIToolPremiumLayout";
import AIToolGuide from "@/components/ai-tools/AIToolGuide";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { Wand2, Sliders } from "lucide-react";

interface MatchResult {
  clientProfile?: {
    summary: string;
    buyerType: string;
    priorityFactors: string[];
  };
  recommendedAreas?: {
    area: string;
    matchScore: number;
    reason: string;
    priceRange: string;
    highlights: string[];
  }[];
  propertyRecommendations?: {
    type: string;
    idealSize: string;
    targetPrice: string;
    features: string[];
    investmentPotential: string;
    rentalYield: string;
  }[];
  matchingStrategy?: {
    searchApproach: string;
    negotiationTips: string[];
    redFlags: string[];
  };
  nextSteps?: string[];
}

export default function AIClientMatcherPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [bedroomsMin, setBedroomsMin] = useState("1");
  const [bedroomsMax, setBedroomsMax] = useState("3");
  const [features, setFeatures] = useState("");
  const [investmentGoal, setInvestmentGoal] = useState("personal-use");
  const [timeline, setTimeline] = useState("3-6-months");

  const dubaiAreas = [
    "Downtown Dubai", "Dubai Marina", "Palm Jumeirah", "Business Bay",
    "Dubai Hills Estate", "Arabian Ranches", "JBR", "DIFC",
    "Jumeirah Village Circle", "Dubai Creek Harbour"
  ];

  const propertyTypeOptions = [
    "Apartment", "Villa", "Townhouse", "Penthouse", "Studio", "Duplex"
  ];

  const handleSubmit = async () => {
    if (!budgetMin || !budgetMax) {
      toast.error("Please enter budget range");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-client-matcher", {
        body: {
          clientPreferences: {
            budget: { min: parseInt(budgetMin), max: parseInt(budgetMax), currency: "AED" },
            location: locations,
            propertyType: propertyTypes,
            bedrooms: { min: parseInt(bedroomsMin), max: parseInt(bedroomsMax) },
            features: features.split(",").map(f => f.trim()).filter(Boolean),
            investmentGoal,
            timeline,
          },
        },
      });

      if (error) throw error;
      if (data?.success) {
        setResult(data);
        toast.success("Client matching analysis complete!");
      } else {
        throw new Error(data?.error || "Failed to analyze");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to match client preferences");
    } finally {
      setLoading(false);
    }
  };

  const toggleLocation = (area: string) => {
    setLocations(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const togglePropertyType = (type: string) => {
    setPropertyTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <AIToolStartGate
      headline="How would you like to match clients?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Match from Preferences", Icon: Wand2, desc: "Enter buyer preferences — AI ranks the best-fit listings from your inventory.", bullets: ["Ranked matches", "Fit scores", "Ready to share"], cta: "Match with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Manual Filters", Icon: Sliders, desc: "Set community, size and budget filters yourself for full control.", bullets: ["Custom filters", "Edit criteria", "Save preset"], cta: "Filter manually" },
      ]}
    >
    <AIToolPremiumLayout
      title="AI Client Matcher"
      subtitle="Match clients to ideal properties using AI-powered preferences analysis"
      icon={<Users className="w-8 h-8" />}
      accentColor="purple"
      gradientFrom="from-purple-500"
    >
      <AIToolGuide
        description="Intelligently match your clients with their perfect property based on preferences, budget, and investment goals."
        steps={[
          "Enter client's budget range in AED",
          "Select preferred locations and property types",
          "Specify bedroom requirements and must-have features",
          "Choose investment goal and timeline",
          "Get AI-powered matching recommendations"
        ]}
        benefits={[
          "Save hours of manual property searching",
          "Get data-driven area recommendations",
          "Understand client buyer profile",
          "Receive negotiation tips and red flags"
        ]}
        accentColor="purple"
      />

      <div className="space-y-8">
        {/* Input Form */}
        <Card className="bg-[#FDFBF7]/90 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-400" />
              Client Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Budget Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/85">Min Budget (AED)</Label>
                <Input
                  type="number"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="500,000"
                  className="bg-[#F7F2EA] border-purple-500/30 text-white"
                />
              </div>
              <div>
                <Label className="text-white/85">Max Budget (AED)</Label>
                <Input
                  type="number"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="2,000,000"
                  className="bg-[#F7F2EA] border-purple-500/30 text-white"
                />
              </div>
            </div>

            {/* Locations */}
            <div>
              <Label className="text-white/85 mb-2 block">Preferred Locations</Label>
              <div className="flex flex-wrap gap-2">
                {dubaiAreas.map(area => (
                  <Badge
                    key={area}
                    variant={locations.includes(area) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      locations.includes(area) 
                        ? "bg-purple-500 text-[#1A1A1A] hover:bg-purple-400" 
                        : "border-purple-500/30 text-white/85 hover:bg-purple-500/20"
                    }`}
                    onClick={() => toggleLocation(area)}
                  >
                    {area}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Property Types */}
            <div>
              <Label className="text-white/85 mb-2 block">Property Types</Label>
              <div className="flex flex-wrap gap-2">
                {propertyTypeOptions.map(type => (
                  <Badge
                    key={type}
                    variant={propertyTypes.includes(type) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      propertyTypes.includes(type) 
                        ? "bg-purple-500 text-[#1A1A1A] hover:bg-purple-400" 
                        : "border-purple-500/30 text-white/85 hover:bg-purple-500/20"
                    }`}
                    onClick={() => togglePropertyType(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Bedrooms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/85">Min Bedrooms</Label>
                <Select value={bedroomsMin} onValueChange={setBedroomsMin}>
                  <SelectTrigger className="bg-[#F7F2EA] border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n === 0 ? "Studio" : n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/85">Max Bedrooms</Label>
                <Select value={bedroomsMax} onValueChange={setBedroomsMax}>
                  <SelectTrigger className="bg-[#F7F2EA] border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}+</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Features */}
            <div>
              <Label className="text-white/85">Must-Have Features (comma-separated)</Label>
              <Textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="Sea view, private pool, gym, parking..."
                className="bg-[#F7F2EA] border-purple-500/30 text-white"
              />
            </div>

            {/* Investment Goal & Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/85">Investment Goal</Label>
                <Select value={investmentGoal} onValueChange={setInvestmentGoal}>
                  <SelectTrigger className="bg-[#F7F2EA] border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal-use">Personal Use</SelectItem>
                    <SelectItem value="rental-income">Rental Income</SelectItem>
                    <SelectItem value="capital-appreciation">Capital Appreciation</SelectItem>
                    <SelectItem value="mixed">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/85">Timeline</Label>
                <Select value={timeline} onValueChange={setTimeline}>
                  <SelectTrigger className="bg-[#F7F2EA] border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate</SelectItem>
                    <SelectItem value="1-3-months">1-3 Months</SelectItem>
                    <SelectItem value="3-6-months">3-6 Months</SelectItem>
                    <SelectItem value="6-12-months">6-12 Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-purple-500 hover:bg-purple-600 text-[#1A1A1A] font-semibold"
            >
              {loading ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Preferences...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Match Properties
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Client Profile */}
            {result.clientProfile && (
              <Card className="bg-[#FDFBF7]/90 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-400" />
                    Client Profile Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-white/85">{result.clientProfile.summary}</p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      {result.clientProfile.buyerType}
                    </Badge>
                  </div>
                  {result.clientProfile.priorityFactors && (
                    <div className="flex flex-wrap gap-2">
                      {result.clientProfile.priorityFactors.map((factor, i) => (
                        <Badge key={i} variant="outline" className="border-[#1A1A1A] text-white/85">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recommended Areas */}
            {result.recommendedAreas && result.recommendedAreas.length > 0 && (
              <Card className="bg-[#FDFBF7]/90 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    Recommended Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {result.recommendedAreas.map((area, i) => (
                      <div key={i} className="bg-[#F7F2EA]/50 rounded-lg p-4 border border-purple-500/20">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-white font-semibold">{area.area}</h4>
                          <Badge className="bg-purple-500 text-[#1A1A1A]">{area.matchScore}% Match</Badge>
                        </div>
                        <p className="text-white/70 text-sm mb-2">{area.reason}</p>
                        <p className="text-purple-300 text-sm">{area.priceRange}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Property Recommendations */}
            {result.propertyRecommendations && result.propertyRecommendations.length > 0 && (
              <Card className="bg-[#FDFBF7]/90 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-purple-400" />
                    Property Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {result.propertyRecommendations.map((prop, i) => (
                      <div key={i} className="bg-[#F7F2EA]/50 rounded-lg p-4 border border-purple-500/20">
                        <h4 className="text-white font-semibold mb-2">{prop.type}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-white/90">Size:</span>
                            <span className="text-white/85 ml-1">{prop.idealSize}</span>
                          </div>
                          <div>
                            <span className="text-white/90">Price:</span>
                            <span className="text-white/85 ml-1">{prop.targetPrice}</span>
                          </div>
                          <div>
                            <span className="text-white/90">Potential:</span>
                            <span className="text-purple-300 ml-1">{prop.investmentPotential}</span>
                          </div>
                          <div>
                            <span className="text-white/90">Yield:</span>
                            <span className="text-green-400 ml-1">{prop.rentalYield}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Next Steps */}
            {result.nextSteps && result.nextSteps.length > 0 && (
              <Card className="bg-[#FDFBF7]/90 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-400" />
                    Recommended Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {result.nextSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3 text-white/85">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">
                          {i + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Placeholder when no results */}
        {!result && !loading && (
          <div className="bg-[#FDFBF7]/50 border border-purple-500/20 rounded-xl py-12 text-center">
            <Users className="w-12 h-12 text-purple-400/50 mx-auto mb-4" />
            <p className="text-white/70">Enter client preferences above to get AI-powered property matches</p>
          </div>
        )}
      </div>
    </AIToolPremiumLayout>
  );
}
