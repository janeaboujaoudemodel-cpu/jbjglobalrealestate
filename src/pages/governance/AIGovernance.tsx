/**
 * AI Governance, Risk & Ethics Page
 * Documents and visualizes AI governance framework
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Bot, Shield, Eye, AlertTriangle, Lock, FileText, 
  Users, Database, CheckCircle2, XCircle, ArrowLeft,
  Scale, Fingerprint, History, AlertOctagon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AIDisclosure from '@/components/ai-governance/AIDisclosure';

const AIGovernance: React.FC = () => {
  const navigate = useNavigate();

  const aiRoles = [
    { label: 'Descriptive Intelligence Layer', allowed: true },
    { label: 'Summarization Engine', allowed: true },
    { label: 'Support Assistant', allowed: true },
    { label: 'Compliance-Aware Explainer', allowed: true },
    { label: 'Human Replacement', allowed: false },
    { label: 'Licensed Broker', allowed: false },
    { label: 'Financial Advisor', allowed: false },
    { label: 'Legal Advisor', allowed: false },
    { label: 'Decision-Maker', allowed: false }
  ];

  const aiModes = [
    {
      id: 'public',
      name: 'Public AI (Authority Mode)',
      icon: Eye,
      color: 'bg-blue-500',
      usage: ['Market Intelligence pages', 'Reports', 'Media explanations'],
      rules: [
        'Aggregated Open Data only',
        'No CRM data',
        'No personalization',
        'Neutral tone'
      ]
    },
    {
      id: 'client',
      name: 'Client AI (Advisory Mode)',
      icon: Users,
      color: 'bg-green-500',
      usage: ['Client portals', 'Property pages', 'Consultations'],
      rules: [
        'Educational explanations only',
        'No recommendations',
        'No urgency language',
        'Mandatory disclaimer'
      ]
    },
    {
      id: 'internal',
      name: 'Internal AI (Execution Mode)',
      icon: Lock,
      color: 'bg-purple-500',
      usage: ['Brokers', 'Management', 'Internal dashboards'],
      rules: [
        'Can use internal data',
        'Must stay descriptive',
        'Logged and auditable',
        'Never public'
      ]
    }
  ];

  const blockedOutputs = [
    'Predict prices',
    'Promise returns',
    'Recommend actions',
    'Compare "best investments"',
    'Use certainty language'
  ];

  const dataEthics = {
    allowed: [
      'Use anonymized trends',
      'Use aggregated Open Data',
      'Use role-permitted internal data'
    ],
    forbidden: [
      'Train on client PII',
      'Export data externally',
      'Retain conversations beyond policy',
      'Cross-share data between modes'
    ]
  };

  const auditFields = [
    'Timestamp',
    'AI mode',
    'Data source type',
    'User role',
    'Prompt category'
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bot className="h-8 w-8 text-primary" />
              AI Governance, Risk & Ethics
            </h1>
            <p className="text-muted-foreground mt-1">
              Compliant, auditable, transparent AI framework for JBJ GLOBAL REAL ESTATE
            </p>
          </div>
        </div>

        {/* Mandatory Disclosure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Mandatory AI Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AIDisclosure variant="banner" mode="internal" />
              <p className="text-sm text-muted-foreground mt-4">
                This disclosure must appear on every AI interface. No exceptions.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="roles" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-6 gap-2">
            <TabsTrigger value="roles" className="gap-2">
              <Scale className="h-4 w-4" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="modes" className="gap-2">
              <Shield className="h-4 w-4" />
              Modes
            </TabsTrigger>
            <TabsTrigger value="risks" className="gap-2">
              <AlertOctagon className="h-4 w-4" />
              Risks
            </TabsTrigger>
            <TabsTrigger value="ethics" className="gap-2">
              <Fingerprint className="h-4 w-4" />
              Ethics
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <History className="h-4 w-4" />
              Audit
            </TabsTrigger>
            <TabsTrigger value="oversight" className="gap-2">
              <Users className="h-4 w-4" />
              Oversight
            </TabsTrigger>
          </TabsList>

          {/* AI Role Definition */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>AI Role Definition (Non-Negotiable)</CardTitle>
                <CardDescription>
                  Clear boundaries on what AI is and is not within the organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-green-600 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      AI IS:
                    </h3>
                    <ul className="space-y-2">
                      {aiRoles.filter(r => r.allowed).map((role, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                            ✓
                          </Badge>
                          {role.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      AI IS NOT:
                    </h3>
                    <ul className="space-y-2">
                      {aiRoles.filter(r => !r.allowed).map((role, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
                            ✗
                          </Badge>
                          {role.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Mode Separation */}
          <TabsContent value="modes">
            <div className="grid lg:grid-cols-3 gap-6">
              {aiModes.map((mode) => (
                <motion.div
                  key={mode.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="h-full">
                    <CardHeader>
                      <div className={`h-10 w-10 rounded-lg ${mode.color} flex items-center justify-center mb-2`}>
                        <mode.icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg">{mode.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Used For:</h4>
                        <ul className="space-y-1">
                          {mode.usage.map((use, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                              {use}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Rules:</h4>
                        <ul className="space-y-1">
                          {mode.rules.map((rule, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-500" />
                              {rule}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Risk Controls */}
          <TabsContent value="risks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertOctagon className="h-5 w-5 text-amber-500" />
                  Risk Controls & Suppression Rules
                </CardTitle>
                <CardDescription>
                  AI outputs are automatically blocked if they contain prohibited content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-red-600 mb-4">Blocked Output Types:</h3>
                    <ul className="space-y-3">
                      {blockedOutputs.map((output, i) => (
                        <li key={i} className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                          <span className="text-sm">{output}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">When Blocked:</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <Database className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-sm">Logged in audit trail</span>
                      </li>
                      <li className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                        <span className="text-sm">Flagged for review</span>
                      </li>
                      <li className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                        <span className="text-sm">Reviewed internally</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Ethics */}
          <TabsContent value="ethics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5 text-primary" />
                  Data Ethics & Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-green-600 mb-4 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      AI May:
                    </h3>
                    <ul className="space-y-2">
                      {dataEthics.allowed.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-green-500/5">
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                            ✓
                          </Badge>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
                      <XCircle className="h-5 w-5" />
                      AI May NOT:
                    </h3>
                    <ul className="space-y-2">
                      {dataEthics.forbidden.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm p-2 rounded bg-red-500/5">
                          <Badge variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
                            ✗
                          </Badge>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit & Traceability */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Audit & Traceability
                </CardTitle>
                <CardDescription>
                  Every AI output is logged with complete traceability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold mb-4">Logged for Every Output:</h3>
                    <div className="space-y-2">
                      {auditFields.map((field, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{field}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-4">Retention Policy:</h3>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Eye className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">Public AI</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Archival retention</p>
                      </div>
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                          <Lock className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">Internal AI</span>
                        </div>
                        <p className="text-sm text-muted-foreground">Compliance-defined window</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Human Oversight */}
          <TabsContent value="oversight">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Human Oversight (Required)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <p className="font-medium text-amber-700">AI never acts alone</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Humans Approve:</h4>
                    <ul className="space-y-2">
                      <li className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Reports
                      </li>
                      <li className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        External communications
                      </li>
                      <li className="text-sm flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Strategic narratives
                      </li>
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <p className="text-sm font-medium">Escalation Rule:</p>
                    <p className="text-sm text-muted-foreground">
                      Any ambiguity → human review
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertOctagon className="h-5 w-5 text-red-500" />
                    Failure & Incident Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    If AI produces a risky output:
                  </p>
                  <ol className="space-y-3">
                    <li className="flex items-center gap-3 p-3 rounded-lg bg-red-500/5">
                      <span className="h-6 w-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">1</span>
                      <span className="text-sm">Suppress immediately</span>
                    </li>
                    <li className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5">
                      <span className="h-6 w-6 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">2</span>
                      <span className="text-sm">Log incident</span>
                    </li>
                    <li className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5">
                      <span className="h-6 w-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">3</span>
                      <span className="text-sm">Review prompt & rules</span>
                    </li>
                    <li className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5">
                      <span className="h-6 w-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-bold">4</span>
                      <span className="text-sm">Patch safeguards</span>
                    </li>
                    <li className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5">
                      <span className="h-6 w-6 rounded-full bg-purple-500 text-white text-xs flex items-center justify-center font-bold">5</span>
                      <span className="text-sm">Document resolution</span>
                    </li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIGovernance;
