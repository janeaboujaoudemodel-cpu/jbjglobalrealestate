import { motion } from "framer-motion";
import { Scale, Sparkles, Mail } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const tocItems = [
  { id: "definitions", label: "1. Definitions" },
  { id: "scope", label: "2. Scope of Services" },
  { id: "eligibility", label: "3. Eligibility" },
  { id: "responsibilities", label: "4. User Responsibilities" },
  { id: "listings", label: "5. Property Listings Disclaimer" },
  { id: "golden-visa", label: "6. Golden Visa & Immigration Disclaimer" },
  { id: "third-party", label: "7. Third-Party Services" },
  { id: "ip", label: "8. Intellectual Property" },
  { id: "liability", label: "9. Limitation of Liability" },
  { id: "indemnification", label: "10. Indemnification" },
  { id: "privacy-ref", label: "11. Privacy" },
  { id: "termination", label: "12. Termination of Access" },
  { id: "governing-law", label: "13. Governing Law" },
  { id: "amendments", label: "14. Amendments" },
  { id: "contact-info", label: "15. Contact Information" },
];

const GoldDivider = () => (
  <div className="py-6">
    <div className="flex items-center gap-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" />
      <Sparkles className="w-3 h-3 text-[#C8A766]/40" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#C8A766]/30 to-transparent" />
    </div>
  </div>
);

const ClauseTitle = ({ id, number, children }: { id: string; number: number; children: React.ReactNode }) => (
  <h2 id={id} className="scroll-mt-24 text-2xl md:text-3xl font-bold text-white mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
    <span className="text-[#C8A766] mr-2">{number}.</span>{children}
  </h2>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 ml-1">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3 text-zinc-700 leading-relaxed text-[15px]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#C8A766]/60 shrink-0 mt-2" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const Terms = () => {
  return (
    <>
      <SEOHead
        title="Terms of Service | JBJ Global Real Estate"
        description="Terms and conditions governing use of the JBJ Global Real Estate platform, services, and related advisory offerings in the UAE."
        canonicalPath="/terms"
      />

      {/* HERO */}
      <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-b from-[#1a1714] to-[#151210] border-b border-[#C8A766]/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#C8A766]/8 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-[#C8A766]/6 rounded-full blur-[100px]" />

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 border border-[#C8A766]/30 bg-black/30 backdrop-blur-sm">
              <Scale className="w-4 h-4 text-[#C8A766]" />
              <span className="text-[#C8A766] font-semibold text-xs uppercase tracking-[0.2em]">Legal</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              Terms of Service
            </h1>

            <p className="text-lg md:text-xl text-[#C8A766]/80 font-medium mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
              Conditions Governing Use of Our Platform
            </p>

            <p className="text-zinc-300 text-base md:text-lg max-w-3xl leading-relaxed mb-2">
              These Terms of Service ("Terms") govern your access to and use of this website and all related services. By accessing or using the platform, you agree to be legally bound by these Terms.
            </p>
            <p className="text-zinc-400 text-base max-w-3xl leading-relaxed">
              If you do not agree, you must discontinue use immediately.
            </p>
          </motion.div>
        </div>
      </section>

      {/* LAYOUT */}
      <div className="bg-gradient-to-b from-[#151210] via-[#0F0D0B] to-[#0A0908]">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 p-5 rounded-2xl border border-[#C8A766]/20 bg-[#1a1714]/80 backdrop-blur-sm">
              <p className="text-xs text-[#C8A766] font-semibold uppercase tracking-widest mb-4">Contents</p>
              <nav className="space-y-1">
                {tocItems.map(item => (
                  <button key={item.id} onClick={() => scrollTo(item.id)}
                    className="block w-full text-left text-sm text-zinc-400 hover:text-[#C8A766] hover:bg-[#C8A766]/5 px-3 py-1.5 rounded-lg transition-colors"
                  >{item.label}</button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 min-w-0">

            {/* Mobile TOC */}
            <div className="lg:hidden mb-10 p-5 rounded-2xl border border-[#C8A766]/20 bg-[#1a1714]/80">
              <p className="text-xs text-[#C8A766] font-semibold uppercase tracking-widest mb-4">Table of Contents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {tocItems.map(item => (
                  <button key={item.id} onClick={() => scrollTo(item.id)}
                    className="text-left text-sm text-zinc-400 hover:text-[#C8A766] px-3 py-1.5 rounded-lg hover:bg-[#C8A766]/5 transition-colors"
                  >{item.label}</button>
                ))}
              </div>
            </div>

            {/* 1 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="definitions" number={1}>Definitions</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 space-y-4">
                <p className="text-zinc-700 leading-relaxed"><strong className="text-black">"Platform"</strong> refers to this website and all digital services operated by the Company.</p>
                <p className="text-zinc-700 leading-relaxed"><strong className="text-black">"Company"</strong> refers to JBJ Global Real Estate L.L.C. S.O.C, a licensed real estate brokerage registered in the United Arab Emirates.</p>
                <p className="text-zinc-700 leading-relaxed"><strong className="text-black">"User"</strong> refers to any individual or entity accessing or using the Platform.</p>
                <p className="text-zinc-700 leading-relaxed"><strong className="text-black">"Services"</strong> refers to the real estate advisory, consultancy, coordination, and digital tools provided through the Platform.</p>
                <p className="text-zinc-700 leading-relaxed"><strong className="text-black">"Third-Party Providers"</strong> refers to external service providers, developers, legal firms, or government-approved entities engaged in connection with our Services.</p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 2 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="scope" number={2}>Scope of Services</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed mb-4">The Platform provides:</p>
                <BulletList items={[
                  "Real estate listings and property information",
                  "Property consultancy and advisory services",
                  "Developer information and project intelligence",
                  "Property management services",
                  "Valuation coordination",
                  "Golden Visa assistance coordination (via licensed partners)",
                  "Related advisory and digital tools",
                ]} />
                <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-[#C8A766]/10 border border-[#C8A766]/20">
                  <Scale className="w-5 h-5 text-[#C8A766] shrink-0 mt-0.5" />
                  <p className="text-sm text-zinc-700">The Company is a licensed real estate brokerage. It is not a government authority, legal firm, or financial institution.</p>
                </div>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 3 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="eligibility" number={3}>Eligibility</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed mb-4">By using this Platform, you confirm that you:</p>
                <BulletList items={[
                  "Are at least 18 years of age",
                  "Will use the Platform and Services lawfully and in good faith",
                  "Will provide accurate and truthful information in all submissions",
                ]} />
              </div>
            </motion.div>
            <GoldDivider />

            {/* 4 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="responsibilities" number={4}>User Responsibilities</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed mb-4">Users shall not:</p>
                <BulletList items={[
                  "Misuse or interfere with the Platform's functionality or security",
                  "Provide false, misleading, or fraudulent documents or information",
                  "Attempt to deceive the Company, its partners, or other users",
                  "Engage in any activity that violates applicable UAE law or regulations",
                  "Reproduce, redistribute, or commercially exploit Platform content without authorization",
                ]} />
              </div>
            </motion.div>
            <GoldDivider />

            {/* 5 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="listings" number={5}>Property Listings & Information Accuracy</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <BulletList items={[
                  "Property listings are provided for informational purposes only",
                  "Prices, availability, specifications, and imagery may change without notice",
                  "No guarantee of transaction completion is implied or provided",
                  "Final agreements are executed between buyer, seller, and relevant transacting parties",
                  "The Company does not warrant the accuracy of third-party information displayed on the Platform",
                ]} />
              </div>
            </motion.div>
            <GoldDivider />

            {/* 6 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="golden-visa" number={6}>Golden Visa & Immigration Disclaimer</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30 space-y-4">
                <p className="text-zinc-700 leading-relaxed">The Platform does not grant, issue, or approve visas or residency permits.</p>
                <p className="text-zinc-700 leading-relaxed">We coordinate with licensed, government-approved immigration partners to facilitate the application process on behalf of eligible clients.</p>
                <p className="text-zinc-700 leading-relaxed">Final approval of any visa or residency application rests solely with the relevant UAE government authorities, including the Federal Authority for Identity, Citizenship, Customs & Port Security (ICP) and the General Directorate of Residency and Foreigners Affairs (GDRFA).</p>
                <p className="text-zinc-700 leading-relaxed font-medium">We do not guarantee approval of any application.</p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 7 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="third-party" number={7}>Third-Party Services</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed mb-4">In delivering our Services, we may engage or coordinate with:</p>
                <BulletList items={[
                  "Real estate developers",
                  "Licensed legal firms",
                  "Certified valuation companies",
                  "Government processing and immigration partners",
                  "Technology and payment service providers",
                ]} />
                <p className="text-zinc-600 text-sm mt-4 leading-relaxed">
                  The Company is not liable for delays, errors, omissions, or outcomes arising from third-party services.
                </p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 8 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="ip" number={8}>Intellectual Property</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed mb-4">All content on this Platform, including but not limited to:</p>
                <BulletList items={[
                  "Branding, logos, and trademarks",
                  "Website design and user interface",
                  "Written content, reports, and analyses",
                  "Graphics, images, and visual assets",
                  "Platform architecture and proprietary tools",
                ]} />
                <p className="text-zinc-700 leading-relaxed mt-4">
                  is the exclusive property of the Company and is protected under applicable intellectual property laws. Users may not copy, reproduce, distribute, or commercially exploit any content without prior written authorization.
                </p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 9 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="liability" number={9}>Limitation of Liability</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed mb-4">To the maximum extent permitted by applicable law, the Company shall not be held liable for:</p>
                <BulletList items={[
                  "Changes in market conditions or property values",
                  "Developer delays, construction issues, or project cancellations",
                  "Changes in government policy, regulation, or visa requirements",
                  "Rejection or non-approval of visa or residency applications",
                  "Investment losses or financial outcomes arising from property transactions",
                  "Service interruptions, technical errors, or data loss on the Platform",
                ]} />
                <p className="text-zinc-600 text-sm mt-4 leading-relaxed">
                  Users acknowledge that real estate transactions and immigration processes carry inherent risks and should seek independent professional advice where appropriate.
                </p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 10 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="indemnification" number={10}>Indemnification</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed">
                  Users agree to indemnify, defend, and hold harmless the Company, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, or expenses arising from or related to the User's misuse of the Platform, violation of these Terms, or breach of applicable law.
                </p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 11 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="privacy-ref" number={11}>Privacy</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed">
                  Your use of this Platform is also governed by our <Link to="/privacy" className="text-[#C8A766] font-medium hover:underline">Privacy Policy</Link>, which outlines how we collect, use, process, and protect your personal data.
                </p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 12 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="termination" number={12}>Termination of Access</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed mb-4">The Company reserves the right to, at its sole discretion:</p>
                <BulletList items={[
                  "Suspend or terminate user accounts",
                  "Restrict access to the Platform or specific features",
                  "Remove content that violates these Terms or applicable law",
                ]} />
                <p className="text-zinc-600 text-sm mt-4 leading-relaxed">
                  Such actions may be taken without prior notice where reasonably necessary.
                </p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 13 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="governing-law" number={13}>Governing Law</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes arising from or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in the UAE.
                </p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 14 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="amendments" number={14}>Amendments</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed">
                  The Company reserves the right to update or modify these Terms at any time. Updated Terms will be posted on this page. Continued use of the Platform following any changes constitutes acceptance of those changes.
                </p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 15 */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="contact-info" number={15}>Contact Information</ClauseTitle>
              <div className="p-6 rounded-xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-[#C8A766]/30">
                <p className="text-zinc-700 leading-relaxed mb-4">For questions regarding these Terms:</p>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-[#C8A766]/10 border border-[#C8A766]/20">
                  <Mail className="w-5 h-5 text-[#C8A766] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-black font-semibold">JBJ Global Real Estate</p>
                    <p className="text-zinc-600 text-sm">Dubai, United Arab Emirates</p>
                    <p className="text-zinc-600 text-sm mt-1">Email: <a href="mailto:legal@JBJ.ae" className="text-[#C8A766] hover:underline">legal@JBJ.ae</a></p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-[#C8A766]/15 text-center">
              <p className="text-zinc-500 text-sm">
                &copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.
              </p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <Link to="/privacy" className="text-[#C8A766] hover:underline">Privacy Policy</Link>
                <span className="text-zinc-600">|</span>
                <Link to="/cookies" className="text-[#C8A766] hover:underline">Cookie Policy</Link>
              </div>
            </div>

          </main>
        </div>
      </div>
    </>
  );
};

export default Terms;