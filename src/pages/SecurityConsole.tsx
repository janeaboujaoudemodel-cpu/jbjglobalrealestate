/**
 * Security Console Page
 * Main entry point for the AI Compliance, Ethics & Security Intelligence Layer
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Bot, Activity, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SecurityDashboard from '@/components/compliance/SecurityDashboard';
import EnhancedAishaAssistant from '@/components/compliance/EnhancedAishaAssistant';
import { useAuth } from '@/contexts/AuthContext';

const SecurityConsole: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 lg:top-[48px] z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold">Security Console</h1>
                <p className="text-xs text-muted-foreground">
                  AI Compliance, Ethics & Security Intelligence
                </p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="dashboard" className="gap-2">
                <Activity className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="aisha" className="gap-2">
                <Bot className="h-4 w-4" />
                Aisha AI
              </TabsTrigger>
              <TabsTrigger value="reports" className="gap-2">
                <FileText className="h-4 w-4" />
                Reports
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsContent value="dashboard" className="m-0">
            <SecurityDashboard />
          </TabsContent>

          <TabsContent value="aisha" className="m-0 p-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="mb-6">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Bot className="h-6 w-6 text-purple-500" />
                    Aisha - Compliance Assistant
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    Your dedicated AI for security monitoring, compliance auditing, and ethics enforcement
                  </p>
                </div>
                <EnhancedAishaAssistant />
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="m-0 p-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Compliance Reports</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <ReportCard
                  title="Daily Security Summary"
                  description="Automated daily security report"
                  icon={Shield}
                  frequency="Daily at 8 PM"
                />
                <ReportCard
                  title="Weekly Compliance Audit"
                  description="Comprehensive compliance status"
                  icon={FileText}
                  frequency="Every Sunday"
                />
                <ReportCard
                  title="Monthly Ethics Review"
                  description="Team behavior analysis"
                  icon={Bot}
                  frequency="1st of each month"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="m-0 p-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6">Security Settings</h2>
              <div className="space-y-6">
                <SettingSection
                  title="Alert Thresholds"
                  description="Configure when to trigger security alerts"
                />
                <SettingSection
                  title="Lockdown Parameters"
                  description="Emergency lockdown configuration"
                />
                <SettingSection
                  title="AI Ethics Rules"
                  description="Customize AI behavior monitoring rules"
                />
                <SettingSection
                  title="Data Access Policies"
                  description="Role-based access control settings"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

const ReportCard: React.FC<{
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  frequency: string;
}> = ({ title, description, icon: Icon, frequency }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow cursor-pointer"
  >
    <Icon className="h-8 w-8 text-gold mb-4" />
    <h3 className="font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground mt-1">{description}</p>
    <p className="text-xs text-gold mt-4">{frequency}</p>
  </motion.div>
);

const SettingSection: React.FC<{
  title: string;
  description: string;
}> = ({ title, description }) => (
  <div className="p-6 rounded-lg border bg-card">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button variant="outline">Configure</Button>
    </div>
  </div>
);

export default SecurityConsole;
