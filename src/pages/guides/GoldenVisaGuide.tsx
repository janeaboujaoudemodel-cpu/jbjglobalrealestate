import { useState, useEffect, useRef } from "react";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import {
  Shield, Home, Users, FileText, CheckCircle2, AlertCircle,
  Building2, Globe, Briefcase, Clock, HelpCircle, Phone,
  MessageCircle, Scale, GraduationCap, Lightbulb, Stethoscope,
  Send, ChevronRight, BookOpen, Clipboard, RefreshCw, Heart,
  CreditCard, Landmark, UserPlus, BadgeCheck, ArrowDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GuideNavigation, GUIDE_LINKS } from "@/components/guides/GuideNavigation";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// ─── TOC sections ───
const tocSections = [
  { id: "overview", title: "Program Overview", icon: Shield },
  { id: "benefits", title: "Core Benefits", icon: Heart },
  { id: "categories", title: "Eligibility Categories", icon: BadgeCheck },
  { id: "real-estate", title: "Real Estate Investor Pathway", icon: Building2 },
  { id: "entrepreneurs", title: "Entrepreneurs & Business Owners", icon: Lightbulb },
  { id: "professionals", title: "Specialized Professionals", icon: Stethoscope },
  { id: "students", title: "Students & Academic Excellence", icon: GraduationCap },
  { id: "documents", title: "Required Documentation", icon: Clipboard },
  { id: "process", title: "Application Process", icon: FileText },
  { id: "family", title: "Family Sponsorship", icon: Users },
  { id: "renewal", title: "Renewal & Compliance", icon: RefreshCw },
  { id: "faq", title: "Frequently Asked Questions", icon: HelpCircle },
  { id: "assessment", title: "Eligibility Assessment", icon: Send },
];

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

// ─── Reusable section wrapper ───
const Section = ({ id, children, ivory = false }: { id: string; children: React.ReactNode; ivory?: boolean }) => (
  <section id={id} className="scroll-mt-24">
    <div className={`py-16 md:py-20 ${ivory ? "bg-[#FAF6EE]" : "bg-white"}`}>
      <div className="max-w-5xl mx-auto px-4 md:px-8">{children}</div>
    </div>
    {/* Gold divider */}
    <div className="h-px bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />
  </section>
);

const SectionHeader = ({ icon: Icon, title, gold }: { icon: any; title: string; gold: string }) => (
  <div className="flex items-center gap-4 mb-8">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] border border-[#C8A766]/40 flex items-center justify-center flex-shrink-0">
      <Icon className="w-6 h-6 text-[#8B7340]" />
    </div>
    <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1A1A1A]">
      {title} <span className="text-[#C8A766]">{gold}</span>
    </h2>
  </div>
);

const CheckItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex items-start gap-3 py-2">
    <CheckCircle2 className="w-5 h-5 text-[#C8A766] flex-shrink-0 mt-0.5" />
    <span className="text-[#3D3D3D] leading-relaxed">{children}</span>
  </li>
);

const GoldenVisaGuide = () => {
  const [formData, setFormData] = useState({
    fullName: "", email: "", phone: "", country: "", category: "", budget: "", notes: "",
  });
  const [activeSection, setActiveSection] = useState("overview");

  // Scroll-spy for sticky side nav
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    );
    tocSections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="UAE Golden Visa — Long-Term Residency Program | JBJ Global Real Estate"
        description="Complete guide to the UAE Golden Visa. Eligibility categories, application process, required documentation, and residency advisory. Official UAE regulations."
        keywords="UAE Golden Visa, Golden Visa Dubai, long-term residency UAE, 10-year visa UAE, property investment visa, Golden Visa eligibility"
      />

      {/* ═══════════════════════════════════════════ */}
      {/* 1. HERO — COVER PAGE */}
      {/* ═══════════════════════════════════════════ */}
      <div className="relative bg-gradient-to-b from-[#FAF6EE] via-[#F5EBD7] to-white pt-28 pb-20 overflow-hidden">
        {/* Decorative border */}
        <div className="absolute inset-4 md:inset-8 border border-[#C8A766]/20 rounded-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#C8A766]/10 border border-[#C8A766]/30 mb-6">
              <Shield className="w-4 h-4 text-[#C8A766]" />
              <span className="text-sm font-medium text-[#8B7340]">Official Residency Guide</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold text-[#1A1A1A] mb-4 leading-tight">
              United Arab Emirates{" "}
              <span className="text-[#C8A766]">Golden Visa</span>
            </h1>
            <p className="text-xl md:text-2xl text-[#6B6B6B] font-serif italic mb-8">
              Long-Term Residency Program
            </p>
            <p className="text-lg text-[#6B6B6B] font-light mb-4">
              Secure 5 or 10-Year Renewable Residency in the United Arab Emirates
            </p>

            <div className="max-w-3xl mx-auto text-left bg-white/80 border border-[#C8A766]/20 rounded-2xl p-6 md:p-8 mb-8 backdrop-blur-sm">
              <p className="text-[#3D3D3D] leading-relaxed mb-4">
                The UAE Golden Visa is a long-term residence program introduced in 2019 by the Government of the United Arab Emirates. It grants eligible foreign nationals renewable residency for 5 or 10 years without the requirement of a national sponsor.
              </p>
              <p className="text-[#3D3D3D] leading-relaxed mb-4">
                The program is administered by:
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2 text-[#3D3D3D]">
                  <Landmark className="w-4 h-4 text-[#C8A766] mt-1 flex-shrink-0" />
                  Federal Authority for Identity, Citizenship, Customs & Port Security (ICP)
                </li>
                <li className="flex items-start gap-2 text-[#3D3D3D]">
                  <Landmark className="w-4 h-4 text-[#C8A766] mt-1 flex-shrink-0" />
                  General Directorate of Residency and Foreigners Affairs (GDRFA — Dubai)
                </li>
              </ul>
              <p className="text-[#3D3D3D] leading-relaxed">
                It is designed to attract investors, entrepreneurs, specialized professionals, researchers, scientists, outstanding students, and exceptional talents.
              </p>
            </div>

            {/* Legal notice */}
            <p className="text-xs text-[#999] italic mb-8">
              We operate as licensed facilitators in coordination with authorized government channels. We are not a government authority.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                onClick={() => scrollTo("assessment")}
                className="bg-[#C8A766] hover:bg-[#B89650] text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-[#C8A766]/20"
              >
                <BadgeCheck className="w-4 h-4 mr-2" />
                Check My Eligibility
              </Button>
              <Link to="/contact?type=golden-visa-consultation">
                <Button variant="outline" className="border-[#C8A766]/40 text-[#8B7340] hover:bg-[#C8A766]/10 px-8 py-3 rounded-xl">
                  <Phone className="w-4 h-4 mr-2" />
                  Book Consultation
                </Button>
              </Link>
              <Link to="/contact?type=golden-visa">
                <Button variant="outline" className="border-[#C8A766]/40 text-[#8B7340] hover:bg-[#C8A766]/10 px-8 py-3 rounded-xl">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Speak to Advisor
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Gold divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />

      {/* ═══════════════════════════════════════════ */}
      {/* 2. TABLE OF CONTENTS */}
      {/* ═══════════════════════════════════════════ */}
      <section className="py-16 bg-[#FAF6EE]">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <BookOpen className="w-8 h-8 text-[#C8A766] mx-auto mb-3" />
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#1A1A1A]">
              Table of <span className="text-[#C8A766]">Contents</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tocSections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.id)}
                  className="flex items-center gap-3 p-4 bg-white border border-[#C8A766]/15 rounded-xl hover:border-[#C8A766]/40 hover:shadow-md hover:shadow-[#C8A766]/10 transition-all text-left group"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#C8A766]/10 flex items-center justify-center text-[#C8A766] text-sm font-semibold flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-[#3D3D3D] font-medium group-hover:text-[#C8A766] transition-colors">{section.title}</span>
                  <ChevronRight className="w-4 h-4 text-[#C8A766]/40 ml-auto flex-shrink-0 group-hover:text-[#C8A766] transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      </section>
      <div className="h-px bg-gradient-to-r from-transparent via-[#C8A766]/40 to-transparent" />

      {/* Sticky Side Navigator (desktop) / Top scroll nav (mobile) */}
      <div className="sticky top-20 z-30 lg:hidden bg-[#FAF6EE]/95 backdrop-blur-sm border-b border-[#C8A766]/20 py-2 px-4">
        <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-2">
            {tocSections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollTo(section.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap min-w-fit transition-all ${
                    activeSection === section.id
                      ? "bg-[#C8A766]/20 text-[#C8A766] border border-[#C8A766]/40"
                      : "text-[#6B6B6B] hover:text-[#C8A766] hover:bg-[#C8A766]/10 border border-transparent"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{section.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════ */}
      {/* 3. PROGRAM OVERVIEW */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="overview">
        <SectionHeader icon={Shield} title="Program" gold="Overview" />
        <p className="text-[#3D3D3D] leading-relaxed mb-6">
          The UAE Golden Visa grants long-term renewable residency to qualified applicants under specific eligibility frameworks established by federal regulations.
        </p>
        <div className="bg-[#FAF6EE] border border-[#C8A766]/20 rounded-xl p-6 mb-6">
          <h3 className="font-serif font-semibold text-[#1A1A1A] mb-3">Validity</h3>
          <ul className="space-y-2">
            <CheckItem>10-Year Residency (select categories)</CheckItem>
            <CheckItem>5-Year Residency (select categories)</CheckItem>
            <CheckItem>Renewable upon continued compliance with eligibility criteria</CheckItem>
          </ul>
        </div>
        <div className="bg-[#FAF6EE] border border-[#C8A766]/20 rounded-xl p-6">
          <h3 className="font-serif font-semibold text-[#1A1A1A] mb-3">Golden Visa Holders</h3>
          <ul className="space-y-2">
            <CheckItem>Do not require a UAE national sponsor</CheckItem>
            <CheckItem>May sponsor family members</CheckItem>
            <CheckItem>May remain outside the UAE for extended periods beyond standard residency absence limits</CheckItem>
            <CheckItem>Maintain property or business ownership under UAE law</CheckItem>
          </ul>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 4. CORE BENEFITS */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="benefits" ivory>
        <SectionHeader icon={Heart} title="Core" gold="Benefits" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-[#C8A766]/20 rounded-xl p-6">
            <h3 className="font-serif font-semibold text-[#1A1A1A] mb-4">Residency & Freedom</h3>
            <ul className="space-y-2">
              <CheckItem>Long-term renewable residency</CheckItem>
              <CheckItem>No local sponsor requirement</CheckItem>
              <CheckItem>100% business ownership (subject to activity licensing)</CheckItem>
              <CheckItem>Extended stay outside UAE permitted</CheckItem>
              <CheckItem>Stable residency planning</CheckItem>
            </ul>
          </div>
          <div className="bg-white border border-[#C8A766]/20 rounded-xl p-6">
            <h3 className="font-serif font-semibold text-[#1A1A1A] mb-4">Access & Sponsorship</h3>
            <ul className="space-y-2">
              <CheckItem>Family sponsorship</CheckItem>
              <CheckItem>Property ownership eligibility</CheckItem>
              <CheckItem>Access to UAE banking</CheckItem>
              <CheckItem>Access to education & healthcare</CheckItem>
              <CheckItem>Long-term asset protection</CheckItem>
            </ul>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 5. ELIGIBILITY CATEGORIES */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="categories">
        <SectionHeader icon={BadgeCheck} title="Eligibility" gold="Categories" />
        <p className="text-[#3D3D3D] leading-relaxed mb-6">
          The UAE Golden Visa is available to individuals who meet criteria in one of the following categories. Each category has specific requirements governed by ICP and GDRFA policies.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { icon: Building2, label: "Real Estate Investors", id: "real-estate" },
            { icon: Lightbulb, label: "Entrepreneurs & Business Owners", id: "entrepreneurs" },
            { icon: Stethoscope, label: "Specialized Professionals", id: "professionals" },
            { icon: GraduationCap, label: "Students & Academic Excellence", id: "students" },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => scrollTo(cat.id)}
              className="flex items-center gap-4 p-5 bg-[#FAF6EE] border border-[#C8A766]/20 rounded-xl hover:border-[#C8A766]/50 hover:shadow-md transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#C8A766]/10 flex items-center justify-center flex-shrink-0">
                <cat.icon className="w-5 h-5 text-[#C8A766]" />
              </div>
              <span className="font-medium text-[#3D3D3D] group-hover:text-[#C8A766] transition-colors">{cat.label}</span>
              <ChevronRight className="w-4 h-4 text-[#C8A766]/40 ml-auto" />
            </button>
          ))}
        </div>
      </Section>

      {/* 5A. REAL ESTATE INVESTORS */}
      <Section id="real-estate" ivory>
        <SectionHeader icon={Building2} title="Real Estate" gold="Investor Pathway" />
        <p className="text-[#3D3D3D] leading-relaxed mb-6">
          Eligibility as per current UAE regulations:
        </p>
        <ul className="space-y-2 mb-6">
          <CheckItem>Ownership of property in the UAE meeting minimum investment threshold defined by authorities</CheckItem>
          <CheckItem>Valid title deed issued by relevant land department</CheckItem>
          <CheckItem>Property may be mortgaged subject to specific compliance conditions</CheckItem>
          <CheckItem>Investment must remain active to maintain residency eligibility</CheckItem>
        </ul>
        <div className="p-5 bg-white border-l-4 border-[#C8A766] rounded-r-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#C8A766] flex-shrink-0 mt-0.5" />
            <p className="text-[#3D3D3D] text-sm">
              Investment thresholds and qualification conditions are governed by ICP / GDRFA policies and may be updated periodically. Meeting the threshold qualifies the investor to <strong>apply</strong> for the Golden Visa. Issuance is subject to official government approval.
            </p>
          </div>
        </div>
      </Section>

      {/* 5B. ENTREPRENEURS */}
      <Section id="entrepreneurs">
        <SectionHeader icon={Lightbulb} title="Entrepreneurs &" gold="Business Owners" />
        <p className="text-[#3D3D3D] leading-relaxed mb-6">Eligibility may include:</p>
        <ul className="space-y-2 mb-6">
          <CheckItem>Ownership or partnership in an innovative project</CheckItem>
          <CheckItem>Approval from competent authority in the UAE</CheckItem>
          <CheckItem>Licensed UAE business</CheckItem>
          <CheckItem>Financial viability and operational compliance</CheckItem>
        </ul>
        <p className="text-[#6B6B6B] text-sm italic">
          Applicants may require endorsement from relevant government authorities depending on business activity.
        </p>
      </Section>

      {/* 5C. SPECIALIZED PROFESSIONALS */}
      <Section id="professionals" ivory>
        <SectionHeader icon={Stethoscope} title="Specialized" gold="Professionals" />
        <p className="text-[#3D3D3D] leading-relaxed mb-4">Eligible categories include (subject to official criteria):</p>
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {["Doctors & Medical Specialists", "Engineers", "Scientists & Researchers", "Executive Directors", "Skilled Professionals", "Creative Talents"].map(role => (
            <div key={role} className="flex items-center gap-3 p-3 bg-white border border-[#C8A766]/15 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-[#C8A766] flex-shrink-0" />
              <span className="text-sm text-[#3D3D3D]">{role}</span>
            </div>
          ))}
        </div>
        <p className="text-[#3D3D3D] mb-2 font-medium">Requirements may include:</p>
        <ul className="space-y-2">
          <CheckItem>Accredited degree</CheckItem>
          <CheckItem>Valid employment contract</CheckItem>
          <CheckItem>Minimum salary threshold (as per official regulation)</CheckItem>
          <CheckItem>Ministry or authority endorsement</CheckItem>
        </ul>
      </Section>

      {/* 5D. STUDENTS */}
      <Section id="students">
        <SectionHeader icon={GraduationCap} title="Students &" gold="Academic Excellence" />
        <p className="text-[#3D3D3D] leading-relaxed mb-6">Eligible individuals:</p>
        <ul className="space-y-2 mb-6">
          <CheckItem>Outstanding UAE-based university graduates</CheckItem>
          <CheckItem>International university graduates meeting approved ranking standards</CheckItem>
          <CheckItem>High school students achieving distinction</CheckItem>
        </ul>
        <p className="text-[#6B6B6B] text-sm italic">
          Eligibility subject to Ministry of Education certification.
        </p>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 6. REQUIRED DOCUMENTATION */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="documents" ivory>
        <SectionHeader icon={Clipboard} title="Required" gold="Documentation" />
        <div className="space-y-6">
          <div className="bg-white border border-[#C8A766]/20 rounded-xl p-6">
            <h3 className="font-serif font-semibold text-[#1A1A1A] mb-4">General Documents</h3>
            <ul className="space-y-2">
              <CheckItem>Passport copy</CheckItem>
              <CheckItem>Emirates ID (if applicable)</CheckItem>
              <CheckItem>Passport-size photographs</CheckItem>
              <CheckItem>Medical fitness certificate</CheckItem>
              <CheckItem>Police clearance certificate</CheckItem>
            </ul>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#C8A766]/20 rounded-xl p-6">
              <h3 className="font-serif font-semibold text-[#1A1A1A] mb-4">Investor Pathway</h3>
              <ul className="space-y-2">
                <CheckItem>Title deed</CheckItem>
                <CheckItem>Property valuation (if required)</CheckItem>
                <CheckItem>Bank letter (if applicable)</CheckItem>
              </ul>
            </div>
            <div className="bg-white border border-[#C8A766]/20 rounded-xl p-6">
              <h3 className="font-serif font-semibold text-[#1A1A1A] mb-4">Professional Pathway</h3>
              <ul className="space-y-2">
                <CheckItem>Academic certificates</CheckItem>
                <CheckItem>Employment contract</CheckItem>
                <CheckItem>Salary certificate</CheckItem>
                <CheckItem>Ministry endorsement</CheckItem>
              </ul>
            </div>
          </div>
          <p className="text-[#6B6B6B] text-sm italic text-center">All documents subject to government review.</p>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 7. APPLICATION PROCESS */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="process">
        <SectionHeader icon={FileText} title="Application" gold="Process" />
        <div className="space-y-4 mb-6">
          {[
            { step: 1, title: "Initial Eligibility Assessment" },
            { step: 2, title: "Documentation Preparation" },
            { step: 3, title: "Submission via ICP or GDRFA" },
            { step: 4, title: "Government Pre-Approval" },
            { step: 5, title: "Biometrics & Medical" },
            { step: 6, title: "Residency Issuance" },
          ].map(item => (
            <div key={item.step} className="flex items-center gap-4 p-4 bg-[#FAF6EE] border border-[#C8A766]/15 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-[#C8A766]/15 border border-[#C8A766]/30 flex items-center justify-center flex-shrink-0">
                <span className="text-[#C8A766] font-bold">{item.step}</span>
              </div>
              <span className="text-[#3D3D3D] font-medium">{item.title}</span>
            </div>
          ))}
        </div>
        <p className="text-[#6B6B6B] text-sm italic">
          Processing timelines vary depending on category and compliance. No guaranteed timeframes.
        </p>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 8. FAMILY SPONSORSHIP */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="family" ivory>
        <SectionHeader icon={Users} title="Family" gold="Sponsorship" />
        <p className="text-[#3D3D3D] leading-relaxed mb-6">Golden Visa holders may sponsor:</p>
        <ul className="space-y-2 mb-6">
          <CheckItem>Spouse</CheckItem>
          <CheckItem>Children (subject to age regulations)</CheckItem>
          <CheckItem>Parents (subject to authority approval)</CheckItem>
          <CheckItem>Domestic workers (subject to UAE law)</CheckItem>
        </ul>
        <p className="text-[#6B6B6B] text-sm italic">Family visas typically match primary visa duration.</p>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 9. RENEWAL & COMPLIANCE */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="renewal">
        <SectionHeader icon={RefreshCw} title="Renewal &" gold="Continuity" />
        <p className="text-[#3D3D3D] leading-relaxed mb-6">Golden Visa may be renewed provided:</p>
        <ul className="space-y-2 mb-6">
          <CheckItem>Investment remains valid</CheckItem>
          <CheckItem>Employment remains active</CheckItem>
          <CheckItem>Regulatory compliance maintained</CheckItem>
          <CheckItem>No legal violations recorded</CheckItem>
        </ul>
        <p className="text-[#6B6B6B] text-sm italic">Residency validity tied to maintaining eligibility criteria.</p>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 10. FAQ */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="faq" ivory>
        <SectionHeader icon={HelpCircle} title="Frequently Asked" gold="Questions" />
        <Accordion type="single" collapsible className="space-y-3">
          {[
            { q: "Can I sell my qualifying property after receiving the Golden Visa?", a: "Residency eligibility depends on maintaining qualifying investment. Selling the property may affect your visa status." },
            { q: "Can I stay outside the UAE for extended periods?", a: "Golden Visa holders are not subject to the standard six-month absence rule that applies to regular residency permits." },
            { q: "Is the Golden Visa permanent residency or citizenship?", a: "It is long-term renewable residency, not citizenship. It does not grant UAE nationality." },
            { q: "Does buying property automatically grant a Golden Visa?", a: "No. Owning qualifying property allows the investor to apply for the Golden Visa. Issuance is subject to official government approval." },
            { q: "Can multiple properties be combined to meet the threshold?", a: "Yes, provided the combined registered value meets the minimum investment threshold set by authorities." },
            { q: "Are off-plan properties eligible?", a: "Yes, if officially registered and compliant with current regulations." },
            { q: "Are mortgaged properties accepted?", a: "Financed properties may be accepted if they meet regulatory conditions set by the relevant authorities." },
            { q: "Who issues the Golden Visa?", a: "The UAE government through ICP (Federal Authority for Identity, Citizenship, Customs & Port Security) and GDRFA (General Directorate of Residency and Foreigners Affairs)." },
          ].map((faq, idx) => (
            <AccordionItem key={idx} value={`faq-${idx}`} className="border border-[#C8A766]/20 rounded-xl overflow-hidden bg-white">
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[#FAF6EE] transition-colors">
                <span className="font-medium text-[#1A1A1A]">{faq.q}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 text-[#3D3D3D] leading-relaxed">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* ═══════════════════════════════════════════ */}
      {/* 11. ELIGIBILITY ASSESSMENT FORM */}
      {/* ═══════════════════════════════════════════ */}
      <Section id="assessment">
        <SectionHeader icon={Send} title="Eligibility" gold="Assessment" />
        <p className="text-[#3D3D3D] leading-relaxed mb-8">
          Submit your details for a preliminary Golden Visa eligibility review. Our advisory team will assess your profile and provide guidance.
        </p>
        <form onSubmit={handleSubmit} className="bg-[#FAF6EE] border border-[#C8A766]/20 rounded-2xl p-6 md:p-8 space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-[#3D3D3D] mb-1.5">Full Name</label>
              <Input
                value={formData.fullName}
                onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                placeholder="Enter your full name"
                className="bg-white border-[#C8A766]/20 focus:border-[#C8A766]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D3D3D] mb-1.5">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com"
                className="bg-white border-[#C8A766]/20 focus:border-[#C8A766]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D3D3D] mb-1.5">Phone</label>
              <Input
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                placeholder="+971 XX XXX XXXX"
                className="bg-white border-[#C8A766]/20 focus:border-[#C8A766]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D3D3D] mb-1.5">Country of Residence</label>
              <Input
                value={formData.country}
                onChange={e => setFormData(p => ({ ...p, country: e.target.value }))}
                placeholder="Current country"
                className="bg-white border-[#C8A766]/20 focus:border-[#C8A766]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D3D3D] mb-1.5">Category Interested In</label>
              <Select value={formData.category} onValueChange={v => setFormData(p => ({ ...p, category: v }))}>
                <SelectTrigger className="bg-white border-[#C8A766]/20 focus:border-[#C8A766]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="real-estate">Real Estate Investor</SelectItem>
                  <SelectItem value="entrepreneur">Entrepreneur / Business Owner</SelectItem>
                  <SelectItem value="professional">Specialized Professional</SelectItem>
                  <SelectItem value="student">Student / Academic</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3D3D3D] mb-1.5">Investment Amount (if applicable)</label>
              <Input
                value={formData.budget}
                onChange={e => setFormData(p => ({ ...p, budget: e.target.value }))}
                placeholder="e.g. AED 2,000,000"
                className="bg-white border-[#C8A766]/20 focus:border-[#C8A766]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D3D3D] mb-1.5">Additional Notes</label>
            <Textarea
              value={formData.notes}
              onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Any additional information..."
              className="bg-white border-[#C8A766]/20 focus:border-[#C8A766] min-h-[100px]"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#C8A766] hover:bg-[#B89650] text-white font-medium py-3 rounded-xl shadow-lg shadow-[#C8A766]/20"
          >
            <Send className="w-4 h-4 mr-2" />
            Check My Golden Visa Eligibility
          </Button>
          <p className="text-xs text-[#999] text-center italic">
            Submission does not guarantee approval. Final decisions are issued exclusively by UAE government authorities.
          </p>
        </form>
      </Section>

      {/* Professional guidance link */}
      <div className="py-8 bg-white text-center">
        <Link to="/contact" className="text-[#C8A766] hover:text-[#B89650] text-sm font-medium underline underline-offset-4 transition-colors">
          Contact our team for professional guidance
        </Link>
      </div>

      {/* Guide Navigation */}
      <section className="py-12 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] mx-2 md:mx-4 lg:mx-6 rounded-2xl">
        <div className="container mx-auto px-4">
          <GuideNavigation current="/guides/golden-visa-uae" guides={GUIDE_LINKS} />
        </div>
      </section>
    </div>
  );
};

export default GoldenVisaGuide;
