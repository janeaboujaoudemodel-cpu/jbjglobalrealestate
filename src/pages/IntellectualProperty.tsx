import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Copyright as CopyrightIcon, Shield, Lock, FileText, Scale, Eye, AlertTriangle, Fingerprint } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-10">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/60" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
  </div>
);

const CCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 rounded-xl p-6 ${className}`}>{children}</div>
);

const tocItems = [
  { id: "copyright", label: "Copyright Statement", icon: CopyrightIcon },
  { id: "protected", label: "Protected Assets", icon: Lock },
  { id: "legal-framework", label: "Legal Framework", icon: Scale },
  { id: "prohibited", label: "Prohibited Actions", icon: AlertTriangle },
  { id: "digital-protection", label: "Digital Protection", icon: Fingerprint },
  { id: "enforcement", label: "Enforcement & Remedies", icon: Scale },
  { id: "contact", label: "Licensing Inquiries", icon: FileText },
];

const IntellectualProperty = () => {
  const currentYear = new Date().getFullYear();
  const [activeSection, setActiveSection] = useState("copyright");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.1 }
    );
    tocItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <SEOHead title="Intellectual Property | JBJ Global Real Estate" description="Legal protection, copyright notice, and intellectual property rights for JBJ Global Real Estate platform and digital assets." canonicalPath="/intellectual-property" />

      <div className="min-h-screen bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        {/* Hero */}
        <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
          <div className="relative max-w-6xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#C8A766]/10 border border-[#C8A766]/25 rounded-full mb-6">
              <Shield className="w-4 h-4 text-[#C8A766]" />
              <span className="text-xs font-semibold text-[#C8A766] tracking-widest uppercase">Legal</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Intellectual Property</h1>
            <p className="text-lg md:text-xl text-[#C8A766] font-medium mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Legal Protection & Copyright Notice</p>
            <p className="text-zinc-400 leading-relaxed max-w-3xl mx-auto text-[15px]">
              This page outlines the comprehensive intellectual property protections governing the JBJ Global Real Estate platform, its proprietary AI tools, designs, and all associated digital assets.
            </p>
          </div>
        </section>

        {/* 2-column layout */}
        <div className="max-w-6xl mx-auto px-6 pb-20 pt-12 flex gap-10">
          {/* Sidebar TOC — desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-1">
              <p className="text-xs uppercase tracking-widest text-[#C8A766]/60 font-bold mb-3 px-3">Table of Contents</p>
              {tocItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                      activeSection === item.id
                        ? "text-[#C8A766] font-semibold border-l-2 border-[#C8A766] bg-[#C8A766]/5"
                        : "text-zinc-500 hover:text-zinc-300 border-l-2 border-transparent"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 space-y-8 min-w-0">
            {/* Copyright */}
            <div id="copyright">
              <CCard className="!p-8">
                <div className="flex items-start gap-4">
                  <CopyrightIcon className="w-8 h-8 text-[#C8A766] flex-shrink-0 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Official Copyright Statement</h2>
                    <p className="text-black text-lg leading-relaxed">© {currentYear} <span className="text-[#C8A766] font-semibold">JBJ Global Real Estate</span>. All Rights Reserved.</p>
                    <p className="text-zinc-700 mt-4 leading-relaxed">
                      This platform, including but not limited to all software code, AI algorithms, user interface designs, branding elements, written content, graphics, and digital assets, is the exclusive intellectual property of <span className="text-black font-medium">JBJ Global Real Estate</span>.
                    </p>
                  </div>
                </div>
              </CCard>
            </div>

            <GoldDivider />

            {/* Protected Assets */}
            <div id="protected">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <Lock className="w-6 h-6 text-[#C8A766]" />Protected Assets & Technologies
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { title: "JBJ AI Property Evaluator", desc: "Proprietary valuation algorithms" },
                  { title: "JBJ AI Rental Index", desc: "Market analysis technology" },
                  { title: "JBJ AI Budget Planner", desc: "Affordability analysis engine" },
                  { title: "JBJ Scan & Sign Documents", desc: "Intelligent parsing system" },
                  { title: "JBJ AI Interior Designer", desc: "Design generation technology" },
                  { title: "JBJ Property Comparison", desc: "Multi-property analysis tool" },
                  { title: "JBJ Broker Toolkit", desc: "Professional tools suite" },
                  { title: "JBJ Guides & Resources", desc: "Educational content library" },
                  { title: "JBJ Platform UI/UX Design", desc: "Interface designs & layouts" },
                ].map((item, index) => (
                  <CCard key={index} className="hover:border-[#C8A766]/60 transition-colors">
                    <h3 className="text-black font-medium">{item.title}</h3>
                    <p className="text-zinc-600 text-sm">{item.desc}</p>
                  </CCard>
                ))}
              </div>
            </div>

            <GoldDivider />

            {/* Legal Framework */}
            <div id="legal-framework">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <Scale className="w-6 h-6 text-[#C8A766]" />Legal Framework & Jurisdiction
              </h2>
              <CCard className="space-y-4">
                <p className="text-zinc-700 leading-relaxed">All intellectual property rights are protected under the laws of the <span className="text-black font-medium">United Arab Emirates</span>, including but not limited to:</p>
                <ul className="space-y-3 text-zinc-700">
                  {[
                    { law: "UAE Federal Law No. 38 of 2021", desc: "Concerning Copyrights and Related Rights" },
                    { law: "UAE Trademark Law", desc: "Federal Law No. 37 of 1992 (as amended)" },
                    { law: "DIFC Intellectual Property Law", desc: "Law No. 4 of 2019" },
                    { law: "International WIPO Treaties", desc: "Berne Convention & Paris Convention" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8A766] mt-2 shrink-0" />
                      <span><strong className="text-black">{item.law}</strong> — {item.desc}</span>
                    </li>
                  ))}
                </ul>
              </CCard>
            </div>

            <GoldDivider />

            {/* Prohibited Actions */}
            <div id="prohibited">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <AlertTriangle className="w-6 h-6 text-[#C8A766]" />Strictly Prohibited Actions
              </h2>
              <CCard className="space-y-4">
                <p className="text-zinc-700 leading-relaxed">The following activities are <span className="text-red-700 font-semibold">strictly prohibited</span> and will result in legal action:</p>
                <ul className="space-y-3 text-zinc-700">
                  {[
                    "Copying, reproducing, or cloning any part of this platform or its features",
                    "Reverse engineering AI algorithms or proprietary systems",
                    "Unauthorized distribution of platform content, documents, or materials",
                    "Removing watermarks, copyright notices, or attribution statements",
                    "Creating derivative works without explicit written consent",
                    "Commercial use of any platform assets without licensing agreement",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-red-600 mt-0.5 shrink-0 font-bold">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CCard>
            </div>

            <GoldDivider />

            {/* Digital Protection */}
            <div id="digital-protection">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <Fingerprint className="w-6 h-6 text-[#C8A766]" />Digital Protection Measures
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Eye, title: "Dynamic Watermarking", desc: "All downloadable documents and PDFs contain unique, traceable watermarks linking content to the downloading user." },
                  { icon: Lock, title: "Session Security", desc: "Content access is monitored with device fingerprinting and session validation to prevent unauthorized sharing." },
                  { icon: FileText, title: "Access Logging", desc: "All content access is logged and can be audited to trace any unauthorized distribution back to its source." },
                  { icon: Shield, title: "Copy Protection", desc: "Platform implements measures to prevent unauthorized copying, screenshots, and screen recording of protected content." },
                ].map((item, i) => (
                  <CCard key={i}>
                    <item.icon className="w-8 h-8 text-[#C8A766] mb-4" />
                    <h3 className="text-black font-semibold mb-2">{item.title}</h3>
                    <p className="text-zinc-600 text-sm">{item.desc}</p>
                  </CCard>
                ))}
              </div>
            </div>

            <GoldDivider />

            {/* Enforcement */}
            <div id="enforcement">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <Scale className="w-6 h-6 text-[#C8A766]" />Enforcement & Legal Remedies
              </h2>
              <CCard className="space-y-4">
                <p className="text-zinc-700 leading-relaxed">JBJ Global Real Estate reserves the right to pursue all available legal remedies against infringers, including but not limited to:</p>
                <ul className="space-y-3 text-zinc-700">
                  {[
                    "Injunctive relief to immediately cease infringing activities",
                    "Monetary damages including actual damages and disgorgement of profits",
                    "Statutory damages as provided under UAE copyright law",
                    "Recovery of attorney fees and litigation costs",
                    "Criminal prosecution where applicable under UAE law",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C8A766] mt-2 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CCard>
            </div>

            <GoldDivider />

            {/* Contact */}
            <div id="contact">
              <CCard className="!p-8">
                <h2 className="text-2xl font-bold text-black mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>Licensing & Legal Inquiries</h2>
                <p className="text-zinc-700 mb-6">For licensing requests, partnership inquiries, or to report intellectual property violations, please contact our legal department:</p>
                <div className="bg-[#C8A766]/10 border border-[#C8A766]/20 rounded-lg p-5 space-y-2 text-zinc-700">
                  <p><strong className="text-black">Email:</strong> PRIVACY@JBJ.AE</p>
                  <p><strong className="text-black">Legal Representative:</strong> JBJ Global Real Estate</p>
                  <p><strong className="text-black">Jurisdiction:</strong> Dubai, United Arab Emirates</p>
                </div>
              </CCard>
            </div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-[#C8A766]/15 text-center">
              <p className="text-zinc-500 text-sm">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
              <p className="text-[#C8A766] text-sm mt-2">© {currentYear} JBJ Global Real Estate. All Rights Reserved.</p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <Link to="/privacy" className="text-[#C8A766] hover:underline">Privacy Policy</Link>
                <span className="text-zinc-600">|</span>
                <Link to="/terms" className="text-[#C8A766] hover:underline">Terms of Service</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IntellectualProperty;
