import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, FileText, Scale, Eye, AlertTriangle, Copyright, Fingerprint } from "lucide-react";
import Footer from "@/components/Footer";

const IntellectualProperty = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-b from-zinc-900 to-black border-b border-gold/20">
        <div className="container mx-auto px-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gold hover:text-gold/80 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-gold" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white" style={{ fontFamily: "Poppins, sans-serif" }}>
                Intellectual Property
              </h1>
              <p className="text-gold text-lg">Legal Protection & Copyright Notice</p>
            </div>
          </div>

          <p className="text-zinc-400 max-w-3xl text-lg">
            This page outlines the comprehensive intellectual property protections governing the JBJ Global Real Estate platform, 
            its proprietary AI tools, designs, and all associated digital assets.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-4xl">
          
          {/* Copyright Statement */}
          <div className="bg-gradient-to-br from-gold/10 to-transparent rounded-2xl p-8 border border-gold/30 mb-12">
            <div className="flex items-start gap-4">
              <Copyright className="w-8 h-8 text-gold flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Official Copyright Statement
                </h2>
                <p className="text-white text-lg leading-relaxed">
                  © {currentYear} <span className="text-gold font-semibold">JBJ Global Real Estate</span>. All Rights Reserved.
                </p>
                <p className="text-zinc-300 mt-4 leading-relaxed">
                  This platform, including but not limited to all software code, AI algorithms, user interface designs, 
                  branding elements, written content, graphics, and digital assets, is the exclusive intellectual property 
                  of <span className="text-white font-medium">Jane Abou Jaoude</span>, Founder & CEO of JBJ Global Real Estate.
                </p>
              </div>
            </div>
          </div>

          {/* Protected Assets */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Poppins, sans-serif" }}>
              <Lock className="w-6 h-6 text-gold" />
              Protected Assets & Technologies
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
                <div key={index} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 hover:border-gold/30 transition-colors">
                  <h3 className="text-white font-medium">{item.title}</h3>
                  <p className="text-zinc-500 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Framework */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Poppins, sans-serif" }}>
              <Scale className="w-6 h-6 text-gold" />
              Legal Framework & Jurisdiction
            </h2>
            
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-4">
              <p className="text-zinc-300 leading-relaxed">
                All intellectual property rights are protected under the laws of the <span className="text-white font-medium">United Arab Emirates</span>, 
                including but not limited to:
              </p>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span><span className="text-white">UAE Federal Law No. 38 of 2021</span> - Concerning Copyrights and Related Rights</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span><span className="text-white">UAE Trademark Law</span> - Federal Law No. 37 of 1992 (as amended)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span><span className="text-white">DIFC Intellectual Property Law</span> - Law No. 4 of 2019</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span><span className="text-white">International WIPO Treaties</span> - Berne Convention & Paris Convention</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Prohibited Actions */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Poppins, sans-serif" }}>
              <AlertTriangle className="w-6 h-6 text-red-500" />
              Strictly Prohibited Actions
            </h2>
            
            <div className="bg-red-950/20 rounded-xl p-6 border border-red-900/30 space-y-4">
              <p className="text-zinc-300 leading-relaxed">
                The following activities are <span className="text-red-400 font-semibold">strictly prohibited</span> and will result in legal action:
              </p>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="text-red-500">✕</span>
                  <span>Copying, reproducing, or cloning any part of this platform or its features</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500">✕</span>
                  <span>Reverse engineering AI algorithms or proprietary systems</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500">✕</span>
                  <span>Unauthorized distribution of platform content, documents, or materials</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500">✕</span>
                  <span>Removing watermarks, copyright notices, or attribution statements</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500">✕</span>
                  <span>Creating derivative works without explicit written consent</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500">✕</span>
                  <span>Commercial use of any platform assets without licensing agreement</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Digital Protection */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Poppins, sans-serif" }}>
              <Fingerprint className="w-6 h-6 text-gold" />
              Digital Protection Measures
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <Eye className="w-8 h-8 text-gold mb-4" />
                <h3 className="text-white font-semibold mb-2">Dynamic Watermarking</h3>
                <p className="text-zinc-400 text-sm">
                  All downloadable documents and PDFs contain unique, traceable watermarks linking content to the downloading user.
                </p>
              </div>
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <Lock className="w-8 h-8 text-gold mb-4" />
                <h3 className="text-white font-semibold mb-2">Session Security</h3>
                <p className="text-zinc-400 text-sm">
                  Content access is monitored with device fingerprinting and session validation to prevent unauthorized sharing.
                </p>
              </div>
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <FileText className="w-8 h-8 text-gold mb-4" />
                <h3 className="text-white font-semibold mb-2">Access Logging</h3>
                <p className="text-zinc-400 text-sm">
                  All content access is logged and can be audited to trace any unauthorized distribution back to its source.
                </p>
              </div>
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <Shield className="w-8 h-8 text-gold mb-4" />
                <h3 className="text-white font-semibold mb-2">Copy Protection</h3>
                <p className="text-zinc-400 text-sm">
                  Platform implements measures to prevent unauthorized copying, screenshots, and screen recording of protected content.
                </p>
              </div>
            </div>
          </div>

          {/* Legal Remedies */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3" style={{ fontFamily: "Poppins, sans-serif" }}>
              <Scale className="w-6 h-6 text-gold" />
              Enforcement & Legal Remedies
            </h2>
            
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800 space-y-4">
              <p className="text-zinc-300 leading-relaxed">
                JBJ Global Real Estate reserves the right to pursue all available legal remedies against infringers, including but not limited to:
              </p>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>Injunctive relief to immediately cease infringing activities</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>Monetary damages including actual damages and disgorgement of profits</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>Statutory damages as provided under UAE copyright law</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>Recovery of attorney fees and litigation costs</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-gold">•</span>
                  <span>Criminal prosecution where applicable under UAE law</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-br from-gold/10 to-transparent rounded-2xl p-8 border border-gold/30">
            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Licensing & Legal Inquiries
            </h2>
            <p className="text-zinc-300 mb-6">
              For licensing requests, partnership inquiries, or to report intellectual property violations, please contact our legal department:
            </p>
            <div className="space-y-2 text-zinc-400">
              <p><span className="text-white">Email:</span> privacy@jbj.ae</p>
              <p><span className="text-white">Legal Representative:</span> Jane Abou Jaoude, Founder & CEO</p>
              <p><span className="text-white">Jurisdiction:</span> Dubai, United Arab Emirates</p>
            </div>
          </div>

          {/* Final Notice */}
          <div className="mt-12 text-center">
            <p className="text-zinc-500 text-sm">
              Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-gold text-sm mt-2">
              © {currentYear} JBJ Global Real Estate. Developed & Created by Founder Jane Abou Jaoude.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IntellectualProperty;
