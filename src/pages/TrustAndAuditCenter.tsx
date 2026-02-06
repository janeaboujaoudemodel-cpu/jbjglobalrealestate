import React from "react";
import { Link } from "react-router-dom";
import { Shield, Users, Bot, Database, Lock, FileCheck, Building2, Handshake, Eye, Scale, Server, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import ComplianceDisclaimer from "@/components/ComplianceDisclaimer";

const TrustAndAuditCenter = () => {
  return (
    <>
      <title>Trust, Audit & Compliance Center | JBJ Global Real Estate</title>
      <meta 
        name="description" 
        content="Learn about JBJ Global Real Estate's licensing, compliance standards, AI transparency, data integrity, and privacy practices. Regulator-ready and partnership-ready." 
      />

      <div className="min-h-screen bg-black">
        {/* Hero Section - Premium Champagne */}
        <section className="relative py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-full px-5 py-2.5 mb-6 shadow-sm transition-all hover:shadow-md cursor-default">
                <Shield className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                <span className="text-black font-semibold tracking-wide">TRUST & COMPLIANCE</span>
              </button>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Trust, Audit & Compliance Center
              </h1>
              <p className="text-zinc-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
                Transparency, integrity, and regulatory compliance are at the core of everything we do. 
                This page outlines our licensing, partner relationships, AI policies, and data practices.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-5xl mx-auto space-y-12">

            {/* Section 1: Licensed Activities */}
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gold/20 rounded-xl border border-gold/40">
                    <Building2 className="w-6 h-6 text-gold" />
                  </div>
                  <CardTitle className="text-2xl text-black">1. Licensed Activities</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/50 border-2 border-gold/30 rounded-xl p-6">
                  <p className="text-black text-lg font-medium mb-4">
                    JBJ GLOBAL REAL ESTATE is a licensed real estate brokerage in Dubai, UAE.
                  </p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    {["BUY", "SELL", "RENT"].map((activity) => (
                      <span 
                        key={activity}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 text-black font-semibold rounded-lg border border-gold/40"
                      >
                        <CheckCircle2 className="w-4 h-4 text-gold" />
                        {activity}
                      </span>
                    ))}
                  </div>
                  <p className="text-zinc-600 text-sm">
                    Our brokerage license permits us to facilitate property transactions across the United Arab Emirates, 
                    including off-plan developments, ready properties, and residential/commercial rentals.
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-white/40 rounded-lg border border-gold/20">
                    <p className="text-zinc-600 text-sm">
                      <span className="text-black font-medium">Legal Entity:</span> JBJ Global Real Estate L.L.C S.O.C
                    </p>
                  </div>
                  <div className="p-4 bg-white/40 rounded-lg border border-gold/20">
                    <p className="text-zinc-600 text-sm">
                      <span className="text-black font-medium">Jurisdiction:</span> Dubai Mainland, UAE
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Partner-Delivered Services */}
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-xl border border-blue-500/40">
                    <Handshake className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl text-black">2. Partner-Delivered Services</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <ComplianceDisclaimer variant="short" className="mb-4" />
                
                <p className="text-zinc-600 mb-6">
                  The following services are provided <span className="text-black font-medium">exclusively</span> through 
                  independent licensed partners. JBJ Global Real Estate facilitates introductions only:
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { service: "Mortgage & Financing", desc: "Licensed mortgage brokers and banks" },
                    { service: "Legal Services", desc: "Licensed law firms and legal consultants" },
                    { service: "Visa Services", desc: "PRO services and immigration consultants" },
                    { service: "Company Setup", desc: "Business setup consultants and free zone authorities" },
                  ].map((item) => (
                    <div key={item.service} className="p-4 bg-white/40 border border-gold/20 rounded-lg">
                      <p className="text-black font-medium mb-1">{item.service}</p>
                      <p className="text-zinc-500 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-100/50 border-2 border-amber-500/30 rounded-lg p-4 mt-6">
                  <p className="text-amber-800 text-sm flex items-start gap-2">
                    <Scale className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      Clients contract and transact directly with the partner under the partner's own terms, 
                      licenses, and regulatory obligations. JBJ Global Real Estate does not provide legal, 
                      financial, or immigration advice.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 3: AI Transparency Policy */}
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/40">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl text-black">3. AI Transparency Policy</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-zinc-600">
                  JBJ Global Real Estate uses AI technology to enhance client and broker experiences. 
                  We are committed to full transparency in how AI is deployed:
                </p>

                <div className="space-y-4">
                  {[
                    {
                      icon: Eye,
                      title: "Clear Identification",
                      desc: "All AI agents are clearly identified as AI assistants. Users always know when they are interacting with an AI."
                    },
                    {
                      icon: Users,
                      title: "Human Escalation Available",
                      desc: "Human support is always available. Users can request to speak with a human agent at any time during AI interactions."
                    },
                    {
                      icon: Shield,
                      title: "No Autonomous Decisions",
                      desc: "AI agents never make legal, financial, regulatory, or binding decisions. They provide information and assistance only."
                    },
                    {
                      icon: FileCheck,
                      title: "Compliance-First Design",
                      desc: "AI systems are designed to comply with UAE real estate regulations and never provide unauthorized advice."
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 p-4 bg-white/40 rounded-lg border border-gold/20">
                      <div className="p-2 bg-purple-500/20 rounded-lg h-fit border border-purple-500/30">
                        <item.icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-black font-medium mb-1">{item.title}</p>
                        <p className="text-zinc-600 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-purple-100/50 border-2 border-purple-500/30 rounded-lg p-4">
                  <p className="text-purple-800 text-sm">
                    <strong>AI Usage Statement:</strong> "I'm an AI assistant for JBJ GLOBAL REAL ESTATE. 
                    I can help you with property information and connect you with our team. 
                    For legal, mortgage, or visa matters, I can introduce you to our licensed partners."
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 4: Data Lineage & Integrity */}
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/40">
                    <Database className="w-6 h-6 text-emerald-600" />
                  </div>
                  <CardTitle className="text-2xl text-black">4. Data Lineage & Integrity</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-zinc-600">
                  We maintain the highest standards of data integrity and transparency in our property listings 
                  and market information:
                </p>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-5 bg-white/40 rounded-lg space-y-3 border border-gold/20">
                    <h4 className="text-black font-medium">Data Sources</h4>
                    <ul className="space-y-2 text-zinc-600 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Official developer feeds and APIs
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Licensed broker submissions
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Government open datasets (DLD, RERA)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Authorized data partnerships
                      </li>
                    </ul>
                  </div>
                  <div className="p-5 bg-white/40 rounded-lg space-y-3 border border-gold/20">
                    <h4 className="text-black font-medium">Data Integrity Practices</h4>
                    <ul className="space-y-2 text-zinc-600 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Timestamped updates with attribution
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Regular verification cycles
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Audit trails for all changes
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Source documentation retained
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-red-100/50 border-2 border-red-500/30 rounded-lg p-4">
                  <p className="text-red-800 text-sm flex items-start gap-2">
                    <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Zero Scraping Policy:</strong> We do not scrape, copy, or harvest data from 
                      third-party platforms. All property data is obtained through authorized channels with 
                      proper licensing and attribution.
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Section 5: Privacy & Security */}
            <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/40">
                    <Lock className="w-6 h-6 text-red-600" />
                  </div>
                  <CardTitle className="text-2xl text-black">5. Privacy & Security</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-zinc-600">
                  Protecting your data is our priority. We implement enterprise-grade security measures 
                  and follow privacy-by-design principles:
                </p>

                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: Users,
                      title: "Minimal PII Collection",
                      desc: "We only collect personal information necessary for the services you request."
                    },
                    {
                      icon: Shield,
                      title: "Role-Based Access",
                      desc: "Strict access controls ensure only authorized personnel can view sensitive data."
                    },
                    {
                      icon: FileCheck,
                      title: "Comprehensive Audit Logs",
                      desc: "All data access and changes are logged for security and compliance purposes."
                    },
                  ].map((item) => (
                    <div key={item.title} className="p-5 bg-white/40 rounded-lg text-center border border-gold/20">
                      <div className="p-3 bg-red-500/20 rounded-xl w-fit mx-auto mb-3 border border-red-500/30">
                        <item.icon className="w-6 h-6 text-red-600" />
                      </div>
                      <p className="text-black font-medium mb-2">{item.title}</p>
                      <p className="text-zinc-500 text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>

                <Separator className="bg-gold/20" />

                <div className="space-y-4">
                  <h4 className="text-black font-medium flex items-center gap-2">
                    <Server className="w-5 h-5 text-zinc-600" />
                    Technical Security Measures
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {[
                      "TLS/SSL encryption for all data in transit",
                      "Encrypted data storage at rest",
                      "Row-Level Security (RLS) on all databases",
                      "Regular security audits and penetration testing",
                      "Multi-factor authentication for owner access",
                      "Automated threat detection and monitoring",
                    ].map((measure) => (
                      <div key={measure} className="flex items-center gap-2 text-zinc-600 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {measure}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/40 border-2 border-gold/30 rounded-lg p-4">
                  <p className="text-zinc-600 text-sm">
                    For detailed information about how we handle your personal data, please review our{" "}
                    <a href="/privacy" className="text-gold hover:underline font-medium">Privacy Policy</a>.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Regulator & Partnership Ready */}
            <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-2xl p-8 text-center">
              <Shield className="w-12 h-12 text-gold mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-black mb-3">
                Regulator-Ready. Bank-Ready. Partnership-Ready.
              </h3>
              <p className="text-zinc-600 max-w-2xl mx-auto mb-6">
                This Trust & Compliance Center is designed to meet the requirements of regulators, 
                financial institutions, and prospective partners. All documentation is available upon request.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/contact">
                  <Button variant="primary" className="px-6 py-3">
                    Request Documentation
                  </Button>
                </Link>
                <Link to="/company-profile">
                  <Button variant="secondary" className="px-6 py-3">
                    View Company Profile
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default TrustAndAuditCenter;
