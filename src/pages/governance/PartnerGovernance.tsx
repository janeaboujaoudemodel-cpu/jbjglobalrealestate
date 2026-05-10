import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Database,
  Building2,
  Handshake,
  Layers,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Lock,
  Link as LinkIcon,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Partner & Data Governance Framework
 * Part 13 - Owner-first framework for partner integration
 * Protects independence, avoids vendor lock-in, maintains execution authority
 */
const PartnerGovernance = () => {
  const partnerClasses = [
    {
      id: "data-providers",
      title: "Data Providers",
      subtitle: "Non-Executing",
      status: "safe",
      icon: Database,
      description: "Read-only data sources with no execution involvement",
      examples: ["Government Open Data portals", "Statistical bureaus", "Market registries", "Mapping datasets"],
      rules: [
        { allowed: true, text: "Read-only ingestion" },
        { allowed: true, text: "Attribution required" },
        { allowed: false, text: "No branding dominance" },
        { allowed: false, text: "No dependency risk" },
      ],
    },
    {
      id: "inventory-sources",
      title: "Inventory Sources",
      subtitle: "Listing Originators",
      status: "conditional",
      icon: Building2,
      description: "External property listing and inventory data providers",
      examples: ["Listing aggregators", "Inventory platforms", "Developer feeds", "Multi-broker listing systems"],
      rules: [
        { allowed: true, text: "Data sync via API or feed" },
        { allowed: true, text: "JBJ controls presentation" },
        { allowed: true, text: "Source disclosed where required" },
        { allowed: false, text: "No UI mirroring" },
        { allowed: false, text: "No content copying beyond listing data" },
      ],
    },
    {
      id: "execution-partners",
      title: "Execution Partners",
      subtitle: "Licensed Services",
      status: "safe-disclosed",
      icon: Handshake,
      description: "Licensed professionals for mortgage, legal, visa services",
      examples: ["Mortgage firms", "Legal firms", "Visa consultants", "Corporate service providers"],
      rules: [
        { allowed: true, text: "Introductions only" },
        { allowed: true, text: "Clear disclaimer required" },
        { allowed: true, text: "Separate contracts" },
        { allowed: false, text: "No JBJ revenue dependency" },
      ],
    },
    {
      id: "strategic-partners",
      title: "Strategic Platform Partners",
      subtitle: "Optional Integration",
      status: "scrutiny",
      icon: Layers,
      description: "Platform-level integrations requiring careful evaluation",
      examples: ["Property data platforms", "Mapping systems", "Intelligence providers"],
      rules: [
        { allowed: true, text: "Non-exclusive agreements" },
        { allowed: true, text: "Exit-ready clauses" },
        { allowed: false, text: "No control over JBJ roadmap" },
        { allowed: false, text: "Clear data ownership required" },
      ],
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "safe":
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Always Safe</Badge>;
      case "conditional":
        return <Badge className="bg-amber-500/20 text-[#1A1A1A] border-amber-500/30">Conditional</Badge>;
      case "safe-disclosed":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Safe When Disclosed</Badge>;
      case "scrutiny":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">High Scrutiny</Badge>;
      default:
        return null;
    }
  };

  return (
    <>
      <SEOHead
        title="Partner & Data Governance | JBJ Global Real Estate"
        description="Our framework for partner integration, data governance, and vendor management across BUY · SELL · RENT operations."
        keywords="partner governance, data governance, vendor management, real estate compliance"
      />
      <section className="min-h-screen bg-background py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Shield className="w-3 h-3 mr-1" />
              Governance Framework
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Partner & Data Governance
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A controlled, owner-first framework ensuring JBJ GLOBAL REAL ESTATE maintains 
              independence, avoids vendor lock-in, and retains full execution authority across 
              <span className="text-primary font-medium"> BUY · SELL · RENT</span>.
            </p>
          </div>

          {/* Core Principles */}
          <Card className="mb-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="py-6">
              <div className="grid md:grid-cols-4 gap-6 text-center">
                <div>
                  <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium text-foreground">UI/UX Control</h3>
                  <p className="text-xs text-muted-foreground">Always retained</p>
                </div>
                <div>
                  <Handshake className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium text-foreground">Client Ownership</h3>
                  <p className="text-xs text-muted-foreground">Never transferred</p>
                </div>
                <div>
                  <Database className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium text-foreground">Lead Ownership</h3>
                  <p className="text-xs text-muted-foreground">Always retained</p>
                </div>
                <div>
                  <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-medium text-foreground">Analytics Ownership</h3>
                  <p className="text-xs text-muted-foreground">Always retained</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="classification" className="space-y-6">
            <TabsList className="bg-muted/50 w-full flex-wrap h-auto gap-1 p-1">
              <TabsTrigger value="classification">Partner Classification</TabsTrigger>
              <TabsTrigger value="data-ownership">Data Ownership</TabsTrigger>
              <TabsTrigger value="inventory">Inventory Rules</TabsTrigger>
              <TabsTrigger value="commercial">Commercial Models</TabsTrigger>
              <TabsTrigger value="exit">Exit Planning</TabsTrigger>
            </TabsList>

            {/* Partner Classification Tab */}
            <TabsContent value="classification" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {partnerClasses.map((partnerClass) => (
                  <Card key={partnerClass.id} className="border-border/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <partnerClass.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{partnerClass.title}</CardTitle>
                            <CardDescription>{partnerClass.subtitle}</CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(partnerClass.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{partnerClass.description}</p>
                      
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Examples</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {partnerClass.examples.map((example, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {example}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wide">Rules</span>
                        <ul className="mt-2 space-y-1">
                          {partnerClass.rules.map((rule, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm">
                              {rule.allowed ? (
                                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                              )}
                              <span className={rule.allowed ? "text-foreground" : "text-muted-foreground"}>
                                {rule.text}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Data Ownership Tab */}
            <TabsContent value="data-ownership" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" />
                    Non-Negotiable Data Ownership
                  </CardTitle>
                  <CardDescription>
                    JBJ GLOBAL REAL ESTATE must always retain control over these elements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Always Retained
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "UI/UX control",
                          "Client relationship ownership",
                          "Lead ownership",
                          "Analytics ownership",
                          "AI output ownership",
                        ].map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        Never Allowed
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "Mandatory branding overlays",
                          "Forced redirection",
                          "Exclusive clauses",
                          "Revenue share without tracking transparency",
                        ].map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-red-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Inventory Rules Tab */}
            <TabsContent value="inventory" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    Inventory Integration Rules
                  </CardTitle>
                  <CardDescription>
                    Guidelines for syncing properties from external sources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Allowed Data
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "Property attributes",
                          "Prices",
                          "Availability",
                          "Location",
                          "Developer info (factual)",
                        ].map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        Forbidden
                      </h4>
                      <ul className="space-y-2">
                        {[
                          "Brochures copied verbatim",
                          "Images mirrored without rights",
                          "UI replication",
                          "Marketing language reuse",
                        ].map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-red-400" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Rationale
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• IP protection</li>
                      <li>• Brand differentiation</li>
                      <li>• Legal safety</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Commercial Models Tab */}
            <TabsContent value="commercial" className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="border-emerald-500/30">
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      Preferred
                    </Badge>
                    <CardTitle>Model A: Data Fee</CardTitle>
                    <CardDescription>Fixed fee, full control</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Fixed monthly or annual fee
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        No revenue sharing
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Full execution control
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Clean accounting
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                      Best when: Platform is a pure data source
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-blue-500/30">
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-blue-500/20 text-blue-400 border-blue-500/30">
                      Alternative
                    </Badge>
                    <CardTitle>Model B: Tracked Referral</CardTitle>
                    <CardDescription>Performance-based revenue share</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-400" />
                        Unique referral identifiers
                      </li>
                      <li className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-400" />
                        Source tagging
                      </li>
                      <li className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-400" />
                        Deal-level attribution
                      </li>
                      <li className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-blue-400" />
                        Revenue share per closed deal
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                      Typical range: 15%–30% of net commission<br />
                      <span className="text-[#1A1A1A]">50% is too high unless exclusivity granted</span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-purple-500/30">
                  <CardHeader>
                    <Badge className="w-fit mb-2 bg-purple-500/20 text-purple-400 border-purple-500/30">
                      Advanced
                    </Badge>
                    <CardTitle>Model C: Hybrid</CardTitle>
                    <CardDescription>Combined fee and revenue share</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="text-sm text-muted-foreground space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                        Reduced data fee
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                        Lower commission share
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-purple-400" />
                        Performance-based upside
                      </li>
                    </ul>
                    <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                      Best when: Aligned incentives with growth potential
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-muted/30">
                <CardContent className="py-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Attribution & Tracking (Mandatory)</h4>
                      <p className="text-sm text-muted-foreground">
                        All revenue-share partnerships require: unique source IDs, UTM-style tracking, 
                        referral contracts, CRM tagging, and deal audit trails.
                        <span className="block mt-1 text-[#1A1A1A] font-medium">
                          No tracking = no revenue share.
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Exit Planning Tab */}
            <TabsContent value="exit" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    Exit & Contingency Planning
                  </CardTitle>
                  <CardDescription>
                    Every partner agreement must include these provisions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground">Required Clauses</h4>
                      <ul className="space-y-3">
                        {[
                          { label: "Termination clause", desc: "Clear exit terms without penalty" },
                          { label: "Data portability", desc: "Export all JBJ data on request" },
                          { label: "Sync shutoff", desc: "Immediate disconnection capability" },
                          { label: "Graceful fallback", desc: "Continuity without partner" },
                        ].map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5" />
                            <div>
                              <span className="text-sm font-medium text-foreground">{item.label}</span>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
                      <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        Core Principle
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        JBJ GLOBAL REAL ESTATE must continue operating at 
                        <span className="text-primary font-semibold"> 100%</span> if any partner exits.
                        No partner is mission-critical. All data sources are replaceable.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted/30 border-border/50">
                <CardContent className="py-4">
                  <p className="text-xs text-muted-foreground text-center">
                    This governance framework ensures compliance, IP safety, and operational independence 
                    across all <span className="text-primary">BUY · SELL · RENT</span> activities.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Related Links */}
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            <Link to="/trust-and-audit-center" className="block">
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardContent className="py-4 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">Trust & Audit Center</span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/partners" className="block">
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardContent className="py-4 flex items-center gap-3">
                  <Handshake className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">Partner Services</span>
                </CardContent>
              </Card>
            </Link>
            <Link to="/market-intelligence/methodology" className="block">
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardContent className="py-4 flex items-center gap-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-foreground">Data Methodology</span>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default PartnerGovernance;
