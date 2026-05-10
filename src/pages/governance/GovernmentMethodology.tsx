/**
 * Government-Safe Market Intelligence Methodology Page
 * Comprehensive disclosure of data sources, methods, and legal positioning
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, Database, Shield, Bot, FileText, 
  Clock, ExternalLink, CheckCircle2, AlertTriangle,
  Building, Scale, Eye, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GovernmentDataDisclosure from '@/components/compliance/GovernmentDataDisclosure';
import { 
  GOVERNMENT_POSTURE, 
  APPROVED_DATA_SOURCES, 
  DATA_USAGE_RULES,
  VISUAL_RULES,
  COMPLIANCE_STATUS
} from '@/config/government-cobranding';
import { BRAND_LOCK } from '@/config/master-lock';

const GovernmentMethodology: React.FC = () => {
  const navigate = useNavigate();
  const currentDate = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Market Intelligence Methodology</h1>
            <p className="text-muted-foreground mt-1">
              Data Sources, Aggregation Logic & Legal Positioning
            </p>
          </div>
        </div>

        {/* Primary Disclosure */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <GovernmentDataDisclosure 
            variant="primary" 
            lastUpdated={currentDate}
            sources={['Dubai Land Department', 'UAE Open Data Portal', 'RERA']}
          />
        </motion.div>

        {/* Official Posture */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-[#B89555]/30 bg-gradient-to-r from-gold/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-[#1A1A1A]" />
                Official Positioning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <blockquote className="text-lg font-medium border-l-4 border-[#B89555] pl-4 py-2">
                "{GOVERNMENT_POSTURE.OFFICIAL_STATEMENT}"
              </blockquote>
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Our Approach (Key Terms)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {GOVERNMENT_POSTURE.APPROVED_TERMS.map((term, i) => (
                      <Badge key={i} variant="outline" className="bg-green-500/10 text-green-700 border-green-500/30">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    We Do Not
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {GOVERNMENT_POSTURE.FORBIDDEN_TERMS.map((term, i) => (
                      <Badge key={i} variant="outline" className="bg-red-500/10 text-red-700 border-red-500/30">
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Tabs defaultValue="sources" className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            <TabsTrigger value="sources" className="gap-2">
              <Database className="h-4 w-4" />
              Data Sources
            </TabsTrigger>
            <TabsTrigger value="aggregation" className="gap-2">
              <Scale className="h-4 w-4" />
              Aggregation
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-2">
              <Bot className="h-4 w-4" />
              AI Usage
            </TabsTrigger>
            <TabsTrigger value="updates" className="gap-2">
              <Clock className="h-4 w-4" />
              Updates
            </TabsTrigger>
            <TabsTrigger value="legal" className="gap-2">
              <Shield className="h-4 w-4" />
              Legal
            </TabsTrigger>
          </TabsList>

          {/* Data Sources */}
          <TabsContent value="sources">
            <Card>
              <CardHeader>
                <CardTitle>Approved Government Data Sources</CardTitle>
                <CardDescription>
                  Official UAE government Open Data portals used for market intelligence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {APPROVED_DATA_SOURCES.map((source) => (
                    <div key={source.id} className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{source.name}</h3>
                            <Badge variant="secondary">{source.shortName}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{source.dataType}</p>
                          <p className="text-sm">{source.usage}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={source.website} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-muted-foreground font-medium mb-1">Restrictions:</p>
                        <div className="flex flex-wrap gap-1">
                          {source.restrictions.map((restriction, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {restriction}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aggregation Logic */}
          <TabsContent value="aggregation">
            <Card>
              <CardHeader>
                <CardTitle>Data Aggregation Methodology</CardTitle>
                <CardDescription>
                  How we process and present government Open Data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Core Principles</h3>
                  <ul className="space-y-2">
                    {DATA_USAGE_RULES.RULES.map((rule, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-green-600">Data May Appear In:</h3>
                    <ul className="space-y-1">
                      {DATA_USAGE_RULES.ALLOWED_LOCATIONS.map((location, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {location.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-red-600">Data Will Not Appear In:</h3>
                    <ul className="space-y-1">
                      {DATA_USAGE_RULES.FORBIDDEN_LOCATIONS.map((location, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          {location.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted">
                  <h3 className="font-semibold mb-2">Aggregation Process</h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                      <span>Data is collected from official government Open Data portals</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                      <span>Raw data is aggregated by area, time period, and property type</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                      <span>Statistical summaries are generated (averages, medians, trends)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
                      <span>Descriptive narratives are created for context (not advice)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center shrink-0 mt-0.5">5</span>
                      <span>All outputs include source attribution and timestamps</span>
                    </li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Usage */}
          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Usage Disclosure
                </CardTitle>
                <CardDescription>
                  How artificial intelligence is used in market intelligence
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <GovernmentDataDisclosure variant="ai" />

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-green-600">AI Is Used To:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Summarize data trends
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Generate descriptive narratives
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Translate content
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Format reports
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Answer informational queries
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-red-600">AI Is Not Used To:</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Predict future prices
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Make investment recommendations
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Provide financial advice
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Rank properties as "best"
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        Create urgency or pressure
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm font-medium">
                    All AI-generated content is reviewed for accuracy and compliance before publication. 
                    AI outputs are logged and auditable.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Update Cadence */}
          <TabsContent value="updates">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Data Update Cadence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border text-center">
                    <div className="text-3xl font-bold text-primary mb-2">Daily</div>
                    <p className="text-sm text-muted-foreground">Transaction data refresh</p>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <div className="text-3xl font-bold text-primary mb-2">Weekly</div>
                    <p className="text-sm text-muted-foreground">Market trend analysis</p>
                  </div>
                  <div className="p-4 rounded-lg border text-center">
                    <div className="text-3xl font-bold text-primary mb-2">Monthly</div>
                    <p className="text-sm text-muted-foreground">Comprehensive reports</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold">Update Schedule</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between p-3 rounded bg-muted">
                      <span className="text-sm">Transaction statistics</span>
                      <Badge>Daily by 10:00 GST</Badge>
                    </div>
                    <div className="flex justify-between p-3 rounded bg-muted">
                      <span className="text-sm">Area intelligence</span>
                      <Badge>Weekly (Sunday)</Badge>
                    </div>
                    <div className="flex justify-between p-3 rounded bg-muted">
                      <span className="text-sm">Monthly market brief</span>
                      <Badge>5th of each month</Badge>
                    </div>
                    <div className="flex justify-between p-3 rounded bg-muted">
                      <span className="text-sm">Quarterly review</span>
                      <Badge>15th after quarter end</Badge>
                    </div>
                    <div className="flex justify-between p-3 rounded bg-muted">
                      <span className="text-sm">Annual summary</span>
                      <Badge>January 31st</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal Positioning */}
          <TabsContent value="legal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Legal Positioning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 rounded-lg border-2 border-[#B89555]/30 bg-[#EFE6D6]/5">
                  <h3 className="font-semibold mb-2">Entity Status</h3>
                  <p className="text-sm">
                    <strong>{BRAND_LOCK.COMPANY_NAME}</strong> is a licensed private real estate brokerage 
                    operating in the United Arab Emirates. We are licensed to provide brokerage services 
                    for <strong>{BRAND_LOCK.CORE_SERVICES}</strong>.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3 text-green-600">We Are:</h3>
                    <ul className="space-y-2">
                      {COMPLIANCE_STATUS.READY_FOR.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          Ready for {item.toLowerCase()}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Protected Against:</h3>
                    <ul className="space-y-2">
                      {COMPLIANCE_STATUS.PROTECTED_AGAINST.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Shield className="h-4 w-4 text-primary" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Key Legal Statements</h3>
                  <div className="p-4 rounded-lg bg-muted space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">NOT A GOVERNMENT ENTITY</p>
                      <p className="text-sm">We are not affiliated with, endorsed by, or acting on behalf of any government authority.</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">INFORMATIONAL ONLY</p>
                      <p className="text-sm">All market intelligence is provided for informational purposes only and does not constitute advice.</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">PROFESSIONAL CONSULTATION</p>
                      <p className="text-sm">Users should consult licensed professionals for legal or investment decisions.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-muted-foreground">
            This methodology document was last updated on {currentDate}. 
            For questions, contact {BRAND_LOCK.PRIMARY_EMAIL}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default GovernmentMethodology;
