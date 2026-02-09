import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, Activity, Linkedin, Building2, DollarSign, Briefcase, Wallet, TrendingUp, UserCheck, Brain, Calendar, AlertTriangle, CheckSquare, Target, Plus, FolderOpen } from "lucide-react";
import JobOfferManager from "@/components/hr/JobOfferManager";
import { EmployeePerformanceDashboard } from "@/components/hr/EmployeePerformanceDashboard";
import { LinkedInInsightsPanel } from "@/components/hr/LinkedInInsightsPanel";
import { CompetitorTrackingPanel } from "@/components/hr/CompetitorTrackingPanel";
import { SalaryBenchmarkPanel } from "@/components/hr/SalaryBenchmarkPanel";
import { EmployeeSalaryCommissionPanel } from "@/components/employee-hub/EmployeeSalaryCommissionPanel";
import { LeaveManagementPanel } from "@/components/hr/LeaveManagementPanel";
import { WarningsPanel } from "@/components/hr/WarningsPanel";
import { ApprovalWorkflowPanel } from "@/components/hr/ApprovalWorkflowPanel";
import { HuntingDashboard } from "@/components/hr/hunting/HuntingDashboard";
import { OpenPositionsPanel } from "@/components/hr/OpenPositionsPanel";
import CVCenter from "@/components/crm/CVCenter";
import { useHRStats } from "@/hooks/useHRStats";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";

export function EmbeddedHRDashboard() {
  const [activeTab, setActiveTab] = useState("performance");
  const { data: stats, isLoading: statsLoading } = useHRStats();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-white border-2 border-gold/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Active Employees</p>
                <p className="text-2xl font-bold text-black">{statsLoading ? "..." : String(stats?.activeEmployees || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-blue-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Open Positions</p>
                <p className="text-2xl font-bold text-blue-600">{statsLoading ? "..." : String(stats?.openPositions || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-green-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">New Hires</p>
                <p className="text-2xl font-bold text-green-600">{statsLoading ? "..." : String(stats?.newHires || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-amber-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">CVs Collected</p>
                <p className="text-2xl font-bold text-amber-600">{statsLoading ? "..." : String(stats?.totalCVs || 0)}</p>
                <p className="text-[10px] text-zinc-400">{stats?.pendingCVs || 0} pending</p>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-2 border-purple-500/30">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">AI Insights</p>
                <p className="text-2xl font-bold text-purple-600">{statsLoading ? "..." : String(stats?.aiInsights || 0)}</p>
              </div>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gradient-to-r from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 p-1.5 h-auto flex-wrap rounded-xl shadow-sm">
          <TabsTrigger 
            value="performance" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <Activity className="h-3.5 w-3.5" />
            Performance
          </TabsTrigger>
          <TabsTrigger 
            value="hunting" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <Target className="h-3.5 w-3.5" />
            Hunting
          </TabsTrigger>
          <TabsTrigger 
            value="cv-center" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            CV Center
          </TabsTrigger>
          <TabsTrigger 
            value="positions" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Positions
          </TabsTrigger>
          <TabsTrigger 
            value="leave" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <Calendar className="h-3.5 w-3.5" />
            Leave
          </TabsTrigger>
          <TabsTrigger 
            value="approvals" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5" />
            Approvals
          </TabsTrigger>
          <TabsTrigger 
            value="warnings" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Warnings
          </TabsTrigger>
          <TabsTrigger 
            value="job-offers" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <FileText className="h-3.5 w-3.5" />
            Job Offers
          </TabsTrigger>
          <TabsTrigger 
            value="payroll" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <Wallet className="h-3.5 w-3.5" />
            Payroll
          </TabsTrigger>
          <TabsTrigger 
            value="salary" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <DollarSign className="h-3.5 w-3.5" />
            Benchmarks
          </TabsTrigger>
          <TabsTrigger 
            value="linkedin" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <Linkedin className="h-3.5 w-3.5" />
            LinkedIn
          </TabsTrigger>
          <TabsTrigger 
            value="competitors" 
            className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 data-[state=active]:shadow-sm text-xs"
          >
            <Building2 className="h-3.5 w-3.5" />
            Competitors
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="mt-4">
          <EmployeePerformanceDashboard />
        </TabsContent>

        <TabsContent value="hunting" className="mt-4">
          <HuntingDashboard />
        </TabsContent>

        <TabsContent value="cv-center" className="mt-4">
          <CVCenter userId={user?.id || ''} />
        </TabsContent>

        <TabsContent value="positions" className="mt-4">
          <OpenPositionsPanel />
        </TabsContent>

        <TabsContent value="leave" className="mt-4">
          <LeaveManagementPanel />
        </TabsContent>

        <TabsContent value="approvals" className="mt-4">
          <ApprovalWorkflowPanel />
        </TabsContent>

        <TabsContent value="warnings" className="mt-4">
          <WarningsPanel />
        </TabsContent>

        <TabsContent value="job-offers" className="mt-4">
          <JobOfferManager />
        </TabsContent>

        <TabsContent value="payroll" className="mt-4">
          <EmployeeSalaryCommissionPanel />
        </TabsContent>

        <TabsContent value="salary" className="mt-4">
          <SalaryBenchmarkPanel />
        </TabsContent>

        <TabsContent value="linkedin" className="mt-4">
          <LinkedInInsightsPanel />
        </TabsContent>

        <TabsContent value="competitors" className="mt-4">
          <CompetitorTrackingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
