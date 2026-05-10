/**
 * Institutional Lock Dashboard
 * Displays the complete governance status of JBJ GLOBAL REAL ESTATE
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Lock, Shield, CheckCircle2, XCircle, AlertTriangle, 
  ArrowLeft, Building, Bot, Database, Users, FileText,
  Scale, Eye, Fingerprint
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  BRAND_LOCK, 
  SERVICE_SCOPE, 
  CHANGE_CONTROL, 
  AI_GOVERNANCE, 
  DATA_LOCK, 
  PARTNER_LOCK, 
  SECURITY_LOCK, 
  AUDIT_READINESS,
  BEHAVIOR_RULES,
  SYSTEM_STATUS 
} from '@/config/master-lock';

const InstitutionalLock: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Lock className="h-8 w-8 text-[#1A1A1A]" />
              Institutional Lock
            </h1>
            <p className="text-muted-foreground mt-1">
              Non-negotiable foundation for {BRAND_LOCK.COMPANY_NAME}
            </p>
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30 text-lg px-4 py-2">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            {SYSTEM_STATUS.STATUS}
          </Badge>
        </div>

        {/* System Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-[#B89555]/30 bg-gradient-to-r from-gold/5 to-transparent">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.entries(SYSTEM_STATUS.CHECKS).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    {value ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                    )}
                    <span className="text-xs font-medium">
                      {key.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="brand" className="space-y-6">
          <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            <TabsTrigger value="brand" className="gap-2">
              <Building className="h-4 w-4" />
              Brand
            </TabsTrigger>
            <TabsTrigger value="services" className="gap-2">
              <Scale className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="data" className="gap-2">
              <Database className="h-4 w-4" />
              Data
            </TabsTrigger>
            <TabsTrigger value="partners" className="gap-2">
              <Users className="h-4 w-4" />
              Partners
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Brand Lock */}
          <TabsContent value="brand">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#1A1A1A]" />
                    Immutable Constants
                  </CardTitle>
                  <CardDescription>These values are constants, not content</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(BRAND_LOCK).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="text-sm font-medium text-muted-foreground">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <code className="text-sm font-mono bg-background px-2 py-1 rounded">
                        {value}
                      </code>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Change Control Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-green-600 mb-2">Allowed Changes</h4>
                      <div className="space-y-1">
                        {CHANGE_CONTROL.ALLOWED.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            {item.replace(/_/g, ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-red-600 mb-2">Forbidden Changes</h4>
                      <div className="space-y-1">
                        {CHANGE_CONTROL.FORBIDDEN.map((item, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-red-500" />
                            {item.replace(/_/g, ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <p className="text-sm font-medium text-amber-700">{CHANGE_CONTROL.RULE}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Lock */}
          <TabsContent value="services">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Licensed Activities (ONLY)
                  </CardTitle>
                  <CardDescription>JBJ GLOBAL REAL ESTATE executes directly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {SERVICE_SCOPE.LICENSED.map((service, i) => (
                      <div
                        key={i}
                        className="flex-1 p-6 rounded-lg bg-green-500/10 border border-green-500/30 text-center"
                      >
                        <span className="text-2xl font-bold text-green-700">{service}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-500" />
                    Partner-Only Services
                  </CardTitle>
                  <CardDescription>Introductions only - not executed by JBJ</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_SCOPE.PARTNER_ONLY.map((service, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
                      >
                        <span className="text-sm font-medium text-amber-700">{service}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 rounded-lg bg-muted border">
                    <p className="text-sm text-muted-foreground">
                      <strong>Mandatory Disclaimer:</strong> {SERVICE_SCOPE.PARTNER_DISCLAIMER}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Lock */}
          <TabsContent value="ai">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    AI Governance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-green-600 mb-2">AI May</h4>
                    <div className="flex flex-wrap gap-2">
                      {AI_GOVERNANCE.ALLOWED_ACTIONS.map((action, i) => (
                        <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-red-600 mb-2">AI May NOT</h4>
                    <div className="flex flex-wrap gap-2">
                      {AI_GOVERNANCE.FORBIDDEN_ACTIONS.map((action, i) => (
                        <Badge key={i} variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    Mandatory Disclosure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-sm font-medium">{AI_GOVERNANCE.MANDATORY_DISCLOSURE}</p>
                  </div>
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">AI Modes</h4>
                    <div className="space-y-2">
                      {Object.entries(AI_GOVERNANCE.MODES).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between p-2 rounded bg-muted">
                          <span className="text-sm">{key}</span>
                          <Badge variant="secondary">{value}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Data Lock */}
          <TabsContent value="data">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Allowed Data Sources
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {DATA_LOCK.ALLOWED_SOURCES.map((source, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                      <span className="text-sm font-medium">{source.replace(/_/g, ' ')}</span>
                      <Badge variant="outline">
                        {DATA_LOCK.SOURCE_RESTRICTIONS[source as keyof typeof DATA_LOCK.SOURCE_RESTRICTIONS]?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    Forbidden Practices
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {DATA_LOCK.FORBIDDEN_PRACTICES.map((practice, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                        <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        <span className="text-sm">{practice.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Partners Lock */}
          <TabsContent value="partners">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-[#1A1A1A]" />
                    JBJ Owns (Non-Negotiable)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {PARTNER_LOCK.JBJ_OWNS.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/30">
                        <CheckCircle2 className="h-4 w-4 text-[#1A1A1A] shrink-0" />
                        <span className="text-sm font-medium">{item.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-primary" />
                    Revenue Models
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {PARTNER_LOCK.ALLOWED_REVENUE_MODELS.map((model, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-sm">{model.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="text-sm font-medium text-amber-700">
                      50% commission: Only with exclusive, measurable, trackable upside
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Lock */}
          <TabsContent value="security">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-green-500" />
                    Security Enforcement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {SECURITY_LOCK.ENFORCED.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        <span className="text-sm">{item.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-muted">
                    <span className="text-sm text-muted-foreground">
                      RLS Review: <strong>{SECURITY_LOCK.REVIEW_FREQUENCY}</strong>
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Breach Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {SECURITY_LOCK.BREACH_RESPONSE.map((step, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                        <span className="h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold shrink-0">
                          {i + 1}
                        </span>
                        <span className="text-sm">{step.replace(/_/g, ' ')}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Fingerprint className="h-5 w-5 text-primary" />
                    Developer & AI Behavior Rules
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold mb-3">If Uncertain:</h4>
                      <div className="flex gap-2">
                        {BEHAVIOR_RULES.IF_UNCERTAIN.map((rule, i) => (
                          <div key={i} className="flex-1 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                            <span className="font-bold text-amber-700">{rule.replace(/_/g, ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-3 text-red-600">Never Do:</h4>
                      <div className="space-y-1">
                        {BEHAVIOR_RULES.NEVER_DO.map((rule, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <XCircle className="h-4 w-4 text-red-500" />
                            {rule.replace(/_/g, ' ')}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/30 text-center">
                    <p className="font-bold text-[#1A1A1A]">{BEHAVIOR_RULES.AUTHORITY}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/30">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-bold text-green-700">{BRAND_LOCK.COMPANY_NAME}</span>
            <span className="text-green-600">•</span>
            <span className="text-green-600">Fully Locked</span>
            <span className="text-green-600">•</span>
            <span className="text-green-600">Institution-Ready</span>
            <span className="text-green-600">•</span>
            <span className="text-green-600">Scalable</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Version {SYSTEM_STATUS.VERSION} • Locked {SYSTEM_STATUS.LOCK_DATE}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default InstitutionalLock;
