import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, FileText, Activity, Linkedin, Building2, DollarSign, Briefcase, Wallet, TrendingUp, UserCheck, Brain, Calendar, AlertTriangle, CheckSquare, Target } from "lucide-react";
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
import { 
  PremiumBackendLayout, 
  PremiumPageHeader, 
  PremiumContainer,
  PremiumStatCard,
  PremiumGrid,
  PremiumSection,
  AIIndicator,
  QuickActionButton
} from "@/components/ui/premium-backend-layout";

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState("performance");

  return (
    <PremiumBackendLayout>
      {/* Premium Header */}
      <PremiumPageHeader
        title="HR Command Center"
        subtitle="Employee performance, recruitment, salary benchmarks & competitive intelligence"
        icon={Briefcase}
        badge="Premium"
        actions={
          <div className="flex items-center gap-3">
            <AIIndicator />
            <QuickActionButton
              icon={UserCheck}
              label="New Hire"
              variant="primary"
            />
          </div>
        }
      />

      {/* Stats Section */}
      <PremiumSection variant="cream" className="py-6">
        <PremiumContainer>
          <PremiumGrid cols={4} gap="md">
            <PremiumStatCard
              title="Active Employees"
              value="147"
              subtitle="Team members"
              icon={Users}
              trend="up"
              trendValue="+12 this month"
              accentColor="gold"
            />
            <PremiumStatCard
              title="Open Positions"
              value="8"
              subtitle="Hiring now"
              icon={Briefcase}
              accentColor="blue"
            />
            <PremiumStatCard
              title="Avg. Performance"
              value="94%"
              subtitle="Team score"
              icon={TrendingUp}
              trend="up"
              trendValue="+3% vs last month"
              accentColor="green"
            />
            <PremiumStatCard
              title="AI Insights"
              value="23"
              subtitle="New recommendations"
              icon={Brain}
              accentColor="purple"
            />
          </PremiumGrid>
        </PremiumContainer>
      </PremiumSection>

      {/* Main Content */}
      <PremiumSection variant="white" className="py-8">
        <PremiumContainer>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gradient-to-r from-[#F5EBD7] to-[#E8DCC8] border-2 border-gold/30 p-1.5 h-auto flex-wrap rounded-xl shadow-sm">
              <TabsTrigger 
                value="performance" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <Activity className="h-4 w-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger 
                value="hunting" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <Target className="h-4 w-4" />
                Hunting
              </TabsTrigger>
              <TabsTrigger 
                value="leave" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <Calendar className="h-4 w-4" />
                Leave
              </TabsTrigger>
              <TabsTrigger 
                value="approvals" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <CheckSquare className="h-4 w-4" />
                Approvals
              </TabsTrigger>
              <TabsTrigger 
                value="warnings" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <AlertTriangle className="h-4 w-4" />
                Warnings
              </TabsTrigger>
              <TabsTrigger 
                value="job-offers" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <FileText className="h-4 w-4" />
                Job Offers
              </TabsTrigger>
              <TabsTrigger 
                value="payroll" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <Wallet className="h-4 w-4" />
                Payroll
              </TabsTrigger>
              <TabsTrigger 
                value="salary" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <DollarSign className="h-4 w-4" />
                Benchmarks
              </TabsTrigger>
              <TabsTrigger 
                value="linkedin" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </TabsTrigger>
              <TabsTrigger 
                value="competitors" 
                className="gap-2 rounded-lg data-[state=active]:bg-gold data-[state=active]:text-black data-[state=active]:shadow-sm"
              >
                <Building2 className="h-4 w-4" />
                Competitors
              </TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="mt-6">
              <EmployeePerformanceDashboard />
            </TabsContent>

            <TabsContent value="hunting" className="mt-6">
              <HuntingDashboard />
            </TabsContent>

            <TabsContent value="leave" className="mt-6">
              <LeaveManagementPanel />
            </TabsContent>

            <TabsContent value="approvals" className="mt-6">
              <ApprovalWorkflowPanel />
            </TabsContent>

            <TabsContent value="warnings" className="mt-6">
              <WarningsPanel />
            </TabsContent>

            <TabsContent value="job-offers" className="mt-6">
              <JobOfferManager />
            </TabsContent>

            <TabsContent value="payroll" className="mt-6">
              <EmployeeSalaryCommissionPanel />
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
        </PremiumContainer>
      </PremiumSection>
    </PremiumBackendLayout>
  );
}
