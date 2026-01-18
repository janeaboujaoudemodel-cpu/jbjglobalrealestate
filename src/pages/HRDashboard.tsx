import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Activity, Linkedin, Building2, DollarSign, Briefcase } from "lucide-react";
import JobOfferManager from "@/components/hr/JobOfferManager";
import { EmployeePerformanceDashboard } from "@/components/hr/EmployeePerformanceDashboard";
import { LinkedInInsightsPanel } from "@/components/hr/LinkedInInsightsPanel";
import { CompetitorTrackingPanel } from "@/components/hr/CompetitorTrackingPanel";
import { SalaryBenchmarkPanel } from "@/components/hr/SalaryBenchmarkPanel";

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("performance");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-primary/10 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5">
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">HR Command Center</h1>
              <p className="text-muted-foreground">
                Employee performance, recruitment, salary benchmarks & competitive intelligence
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card/50 backdrop-blur-sm border border-primary/10 p-1 h-auto flex-wrap">
            <TabsTrigger 
              value="performance" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger 
              value="job-offers" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-4 w-4" />
              Job Offers
            </TabsTrigger>
            <TabsTrigger 
              value="salary" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <DollarSign className="h-4 w-4" />
              Salary Benchmarks
            </TabsTrigger>
            <TabsTrigger 
              value="linkedin" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn Intel
            </TabsTrigger>
            <TabsTrigger 
              value="competitors" 
              className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Building2 className="h-4 w-4" />
              Competitors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="mt-6">
            <EmployeePerformanceDashboard />
          </TabsContent>

          <TabsContent value="job-offers" className="mt-6">
            <JobOfferManager />
          </TabsContent>

          <TabsContent value="salary" className="mt-6">
            <SalaryBenchmarkPanel />
          </TabsContent>

          <TabsContent value="linkedin" className="mt-6">
            <LinkedInInsightsPanel />
          </TabsContent>

          <TabsContent value="competitors" className="mt-6">
            <CompetitorTrackingPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
