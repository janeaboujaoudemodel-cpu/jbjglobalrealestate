import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  DollarSign, Calculator, TrendingUp, PiggyBank, Home, Building2, 
  Save, FolderOpen, Plus, Loader2, Lightbulb, Target, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface FinancialData {
  monthlyIncome: number;
  rent: number;
  utilities: number;
  groceries: number;
  transportation: number;
  entertainment: number;
  insurance: number;
  savings: number;
  otherExpenses: number;
  existingLoans: number;
}

interface AnalysisResult {
  netAffordability: number;
  maxPropertyBudget: number;
  recommendedMonthlyPayment: number;
  savingsRate: number;
  recommendations: string[];
  propertyMatches: {
    type: string;
    priceRange: string;
    paymentPlan: string;
    developer: string;
  }[];
  investmentStrategy: string;
}

interface SavedProject {
  id: string;
  name: string;
  financialData: FinancialData;
  analysis: AnalysisResult | null;
  createdAt: Date;
  updatedAt: Date;
}

const AIFinancialAdvisor = () => {
  const [financialData, setFinancialData] = useState<FinancialData>({
    monthlyIncome: 0,
    rent: 0,
    utilities: 0,
    groceries: 0,
    transportation: 0,
    entertainment: 0,
    insurance: 0,
    savings: 0,
    otherExpenses: 0,
    existingLoans: 0
  });
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_financial_projects');
    if (saved) {
      const parsed = JSON.parse(saved);
      setProjects(parsed.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt)
      })));
    }
  }, []);

  const saveProjects = (updated: SavedProject[]) => {
    localStorage.setItem('ai_financial_projects', JSON.stringify(updated));
    setProjects(updated);
  };

  const totalExpenses = 
    financialData.rent + 
    financialData.utilities + 
    financialData.groceries + 
    financialData.transportation + 
    financialData.entertainment + 
    financialData.insurance + 
    financialData.savings +
    financialData.otherExpenses +
    financialData.existingLoans;

  const disposableIncome = financialData.monthlyIncome - totalExpenses;

  const runAnalysis = async () => {
    if (financialData.monthlyIncome === 0) {
      toast.error("Please enter your monthly income");
      return;
    }

    setIsAnalyzing(true);
    toast.loading("AI analyzing your financial profile...");

    // Simulate AI analysis (in production, this would call the AI gateway)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const netAffordability = disposableIncome;
    const maxPropertyBudget = netAffordability * 12 * 15; // 15 years worth
    const recommendedMonthlyPayment = netAffordability * 0.4; // 40% of disposable for mortgage
    const savingsRate = (financialData.savings / financialData.monthlyIncome) * 100;

    const result: AnalysisResult = {
      netAffordability,
      maxPropertyBudget,
      recommendedMonthlyPayment,
      savingsRate,
      recommendations: [
        netAffordability > 10000 
          ? "Your strong disposable income positions you well for premium property investments."
          : "Consider focusing on off-plan properties with attractive payment plans.",
        savingsRate < 20 
          ? "Aim to increase your savings rate to 20% for a healthier financial buffer."
          : "Excellent savings discipline! You have room for investment expansion.",
        financialData.existingLoans > financialData.monthlyIncome * 0.3
          ? "Consider consolidating existing loans before taking on new property obligations."
          : "Your debt-to-income ratio is healthy for property investment.",
        "Explore developer payment plans with 60/40 or 70/30 structures to minimize initial outlay.",
        "Consider properties in emerging areas for higher ROI potential."
      ],
      propertyMatches: [
        {
          type: maxPropertyBudget > 2000000 ? "Luxury Villa" : maxPropertyBudget > 1000000 ? "Premium Apartment" : "Studio/1BR Apartment",
          priceRange: `AED ${(maxPropertyBudget * 0.7).toLocaleString()} - ${maxPropertyBudget.toLocaleString()}`,
          paymentPlan: "60/40 - 60% during construction, 40% on handover",
          developer: maxPropertyBudget > 2000000 ? "Emaar, DAMAC, Sobha" : "Danube, Azizi, Binghatti"
        },
        {
          type: maxPropertyBudget > 1500000 ? "Townhouse" : "1-2BR Apartment",
          priceRange: `AED ${(maxPropertyBudget * 0.5).toLocaleString()} - ${(maxPropertyBudget * 0.8).toLocaleString()}`,
          paymentPlan: "10/90 - 10% down, 90% on handover",
          developer: "Nakheel, Dubai Properties, MAG"
        },
        {
          type: "Investment Property",
          priceRange: `AED ${(maxPropertyBudget * 0.4).toLocaleString()} - ${(maxPropertyBudget * 0.6).toLocaleString()}`,
          paymentPlan: "Post-handover payment plans available",
          developer: "Various developers with rental guarantee options"
        }
      ],
      investmentStrategy: netAffordability > 15000
        ? "Premium Strategy: Focus on prime locations (Dubai Marina, Downtown, Palm) with strong capital appreciation. Consider portfolio diversification across 2-3 properties over 5 years."
        : netAffordability > 8000
        ? "Growth Strategy: Target emerging communities (JVC, Dubai South, MBR City) with high rental yields. Off-plan purchases can maximize your budget with developer payment plans."
        : "Entry Strategy: Start with a studio or 1BR in affordable communities. Build equity through mortgage payments and consider upgrading in 3-5 years."
    };

    setAnalysis(result);
    toast.dismiss();
    toast.success("Analysis complete!");
    setIsAnalyzing(false);
  };

  // Project management
  const createProject = () => {
    if (!newProjectName.trim()) {
      toast.error("Please enter a project name");
      return;
    }

    const newProject: SavedProject = {
      id: Date.now().toString(),
      name: newProjectName,
      financialData,
      analysis,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updated = [...projects, newProject];
    saveProjects(updated);
    setCurrentProject(newProject);
    setNewProjectName('');
    setShowProjectModal(false);
    toast.success(`Project "${newProjectName}" created!`);
  };

  const saveCurrentProject = () => {
    if (!currentProject) {
      setShowProjectModal(true);
      return;
    }

    const updated = projects.map(p =>
      p.id === currentProject.id
        ? { ...p, financialData, analysis, updatedAt: new Date() }
        : p
    );
    saveProjects(updated);
    toast.success("Project saved!");
  };

  const loadProject = (project: SavedProject) => {
    setCurrentProject(project);
    setFinancialData(project.financialData);
    setAnalysis(project.analysis);
    toast.success(`Project "${project.name}" loaded!`);
  };

  const formatCurrency = (value: number) => `AED ${value.toLocaleString()}`;

  return (
    <section className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900/30 via-emerald-800/20 to-emerald-900/30 border-b border-emerald-500/20">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-1 mb-4">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">AI-Powered Budget Planning</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              AI Budget <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">Planner</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Budget analysis and property affordability insights based on your financial profile. Informational only.
            </p>
            <p className="text-xs text-gold mt-2">Developed by Founder and CEO Jane Bou Jaoude</p>
            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-xl mx-auto">
              <p className="text-amber-200 text-xs text-center">
                <strong>Disclaimer:</strong> AI outputs are informational estimates. For legal or mortgage matters, we can connect you with our licensed partners.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Project Bar */}
        <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-emerald-400" />
            <span className="text-white font-medium">
              {currentProject ? currentProject.name : "Untitled Analysis"}
            </span>
          </div>
          <div className="flex-1" />
          <Button size="sm" variant="outline" onClick={saveCurrentProject} className="text-xs">
            <Save className="w-3 h-3 mr-1" /> Save Project
          </Button>
          <Dialog open={showProjectModal} onOpenChange={setShowProjectModal}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="text-xs">
                <Plus className="w-3 h-3 mr-1" /> New Project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-700">
              <DialogHeader>
                <DialogTitle className="text-white">Create New Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-zinc-400">Project Name</Label>
                  <Input
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="My Investment Plan"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <Button onClick={createProject} className="w-full bg-emerald-600">
                  Create Project
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {projects.length > 0 && (
            <Select onValueChange={(id) => {
              const project = projects.find(p => p.id === id);
              if (project) loadProject(project);
            }}>
              <SelectTrigger className="w-40 bg-zinc-800 border-zinc-700 text-sm">
                <SelectValue placeholder="Load Project" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id} className="text-white">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Income
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label className="text-zinc-400">Monthly Income (AED)</Label>
                  <Input
                    type="number"
                    value={financialData.monthlyIncome || ''}
                    onChange={(e) => setFinancialData(prev => ({ ...prev, monthlyIncome: parseFloat(e.target.value) || 0 }))}
                    placeholder="25,000"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-red-400" />
                  Monthly Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'rent', label: 'Rent / Housing', placeholder: '5,000' },
                  { key: 'utilities', label: 'Utilities (DEWA, Internet, etc.)', placeholder: '800' },
                  { key: 'groceries', label: 'Groceries & Food', placeholder: '2,000' },
                  { key: 'transportation', label: 'Transportation', placeholder: '1,500' },
                  { key: 'entertainment', label: 'Entertainment & Lifestyle', placeholder: '1,000' },
                  { key: 'insurance', label: 'Insurance', placeholder: '500' },
                  { key: 'savings', label: 'Current Savings', placeholder: '3,000' },
                  { key: 'existingLoans', label: 'Existing Loan Payments', placeholder: '0' },
                  { key: 'otherExpenses', label: 'Other Expenses', placeholder: '500' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <Label className="text-xs text-zinc-400">{label}</Label>
                    <Input
                      type="number"
                      value={(financialData as any)[key] || ''}
                      onChange={(e) => setFinancialData(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
                      placeholder={placeholder}
                      className="h-9 bg-zinc-800 border-zinc-700 text-sm"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total Income</span>
                    <span className="text-white">{formatCurrency(financialData.monthlyIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-400">Total Expenses</span>
                    <span className="text-red-400">{formatCurrency(totalExpenses)}</span>
                  </div>
                  <div className="h-px bg-zinc-700 my-2" />
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-zinc-300">Disposable Income</span>
                    <span className={disposableIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatCurrency(disposableIncome)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={runAnalysis} 
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4 mr-2" /> Generate AI Analysis
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-2 space-y-6">
            {analysis ? (
              <>
                {/* Key Metrics */}
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-emerald-900/30 to-black border-emerald-500/30">
                    <CardContent className="p-4 text-center">
                      <PiggyBank className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{formatCurrency(analysis.netAffordability)}</p>
                      <p className="text-xs text-zinc-400">Net Monthly Affordability</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-blue-900/30 to-black border-blue-500/30">
                    <CardContent className="p-4 text-center">
                      <Home className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{formatCurrency(analysis.maxPropertyBudget)}</p>
                      <p className="text-xs text-zinc-400">Max Property Budget</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-purple-900/30 to-black border-purple-500/30">
                    <CardContent className="p-4 text-center">
                      <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white">{analysis.savingsRate.toFixed(1)}%</p>
                      <p className="text-xs text-zinc-400">Current Savings Rate</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Investment Strategy */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-gold" />
                      Your Investment Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-300 leading-relaxed">{analysis.investmentStrategy}</p>
                  </CardContent>
                </Card>

                {/* Property Recommendations */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-emerald-400" />
                      Recommended Properties
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analysis.propertyMatches.map((property, index) => (
                        <div key={index} className="p-4 bg-zinc-800/50 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-white font-medium">{property.type}</h4>
                              <p className="text-emerald-400 text-sm mt-1">{property.priceRange}</p>
                            </div>
                            <Link to="/properties">
                              <Button size="sm" variant="outline" className="text-xs">
                                View Properties <ArrowRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-zinc-500">Payment Plan:</span>
                              <p className="text-zinc-300">{property.paymentPlan}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500">Developers:</span>
                              <p className="text-zinc-300">{property.developer}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="bg-zinc-900/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">AI Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-emerald-400 text-xs">{index + 1}</span>
                          </div>
                          <p className="text-zinc-300 text-sm">{rec}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* CTA */}
                <div className="flex flex-wrap gap-4">
                  <Link to="/mortgage-advisory" className="flex-1">
                    <button 
                      className="w-full relative inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
                      style={{
                        background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                        boxShadow: `
                          0 10px 30px rgba(200,167,102,0.4),
                          0 6px 15px rgba(0,0,0,0.2),
                          inset 0 2px 4px rgba(255,255,255,0.9),
                          inset 0 -2px 4px rgba(200,167,102,0.2),
                          0 0 20px rgba(200,167,102,0.3)
                        `,
                      }}
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                      <span className="relative flex items-center justify-center gap-2">
                        <span className="text-gold">Speak with</span>
                        <span className="text-black">Mortgage Advisor</span>
                      </span>
                    </button>
                  </Link>
                  <Link to="/properties" className="flex-1">
                    <button className="w-full relative inline-flex items-center justify-center gap-2 px-6 py-4 text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white">
                      Browse Properties
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <Card className="bg-zinc-900/50 border-zinc-800 h-full min-h-[500px] flex items-center justify-center">
                <CardContent className="text-center">
                  <Calculator className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-white text-lg font-medium mb-2">Enter Your Financial Details</h3>
                  <p className="text-zinc-500 text-sm max-w-md">
                    Fill in your income and expenses on the left, then click "Generate AI Analysis" 
                    to receive personalized investment recommendations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Financial Disclaimer */}
        <div className="mt-8 p-4 bg-zinc-900/60 border border-gold/20 rounded-xl">
          <p className="text-zinc-400 text-sm leading-relaxed">
            <strong className="text-zinc-300">Disclaimer:</strong> This AI-generated analysis is for informational purposes only. Does not constitute financial, investment, or legal advice.{" "}
            <Link to="/contact" className="text-gold hover:underline">Contact our team</Link> for professional guidance.
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AIFinancialAdvisor;