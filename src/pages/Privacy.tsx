import { motion } from "framer-motion";
import { Shield, Sparkles, Lock, Mail } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

const tocItems = [
  { id: "definitions", label: "1. Definitions" },
  { id: "scope", label: "2. Scope of Policy" },
  { id: "collect", label: "3. Information We Collect" },
  { id: "how-collect", label: "4. How We Collect Information" },
  { id: "legal-basis", label: "5. Legal Basis for Processing" },
  { id: "use", label: "6. How We Use Your Information" },
  { id: "sharing", label: "7. Data Sharing & Third Parties" },
  { id: "transfers", label: "8. International Transfers" },
  { id: "retention", label: "9. Data Retention" },
  { id: "security", label: "10. Data Security" },
  { id: "rights", label: "11. Your Rights" },
  { id: "cookies", label: "12. Cookies & Tracking" },
  { id: "children", label: "13. Children's Privacy" },
  { id: "changes", label: "14. Changes to This Policy" },
  { id: "contact-info", label: "15. Contact Information" },
];

const GoldDivider = () => (
  <div className="py-6">
    <div className="flex items-center gap-6">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      <Sparkles className="w-3 h-3 text-gold/30" />
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </div>
  </div>
);

const ClauseTitle = ({ id, number, children }: { id: string; number: number; children: React.ReactNode }) => (
  <h2 id={id} className="scroll-mt-24 text-2xl md:text-3xl font-bold text-black mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
    <span className="text-gold mr-2">{number}.</span>{children}
  </h2>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 ml-1">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3 text-zinc-700 leading-relaxed text-[15px]">
        <span className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0 mt-2" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const Privacy = () => {
  return (
    <>
      <SEOHead
        title="Privacy Policy | JBJ Global Real Estate"
        description="Learn how JBJ Global Real Estate collects, uses, processes, and protects your personal data in accordance with UAE data protection principles."
        canonicalPath="/privacy"
      />

      {/* HERO */}
      <section className="relative py-28 md:py-36 overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F8F4EC] to-[#EDE4D3]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-gold/8 via-transparent to-transparent" />
        <div className="absolute top-20 right-20 w-72 h-72 bg-gold/6 rounded-full blur-[100px]" />

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6 border border-gold/30 bg-white/60 backdrop-blur-sm">
              <Shield className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">Legal</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 tracking-tight" style={{ fontFamily: "Playfair Display, serif" }}>
              Privacy Policy
            </h1>

            <p className="text-lg md:text-xl text-gold/80 font-medium mb-6" style={{ fontFamily: "Playfair Display, serif" }}>
              Your Data. Your Rights. Our Responsibility.
            </p>

            <p className="text-zinc-700 text-base md:text-lg max-w-3xl leading-relaxed mb-2">
              This Privacy Policy explains how we collect, use, process, and protect personal data when you interact with our website and services.
            </p>
            <p className="text-zinc-600 text-base max-w-3xl leading-relaxed">
              We are committed to safeguarding your information in accordance with applicable UAE data protection principles.
            </p>
          </motion.div>
        </div>
      </section>

      {/* LAYOUT: Sidebar TOC + Content */}
      <div className="bg-gradient-to-br from-[#FDFBF7] via-white to-[#F8F4EC]">
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 flex gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 p-5 rounded-2xl border border-gold/20 bg-white/80 backdrop-blur-sm">
              <p className="text-xs text-gold font-semibold uppercase tracking-widest mb-4">Contents</p>
              <nav className="space-y-1">
                {tocItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="block w-full text-left text-sm text-zinc-600 hover:text-black hover:bg-gold/5 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">

            {/* Mobile TOC */}
            <div className="lg:hidden mb-10 p-5 rounded-2xl border border-gold/20 bg-white">
              <p className="text-xs text-gold font-semibold uppercase tracking-widest mb-4">Table of Contents</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                {tocItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="text-left text-sm text-zinc-600 hover:text-black px-3 py-1.5 rounded-lg hover:bg-gold/5 transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 1. DEFINITIONS */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="definitions" number={1}>Definitions</ClauseTitle>
              <div className="p-6 rounded-xl bg-white border border-gold/15 space-y-4">
                <p className="text-zinc-700 leading-relaxed">
                  <strong className="text-black">"Personal Data"</strong> means any information that identifies or can identify an individual.
                </p>
                <p className="text-zinc-700 leading-relaxed">
                  <strong className="text-black">"Processing"</strong> means collection, storage, usage, disclosure, or deletion of personal data.
                </p>
                <p className="text-zinc-700 leading-relaxed">
                  <strong className="text-black">"User"</strong> refers to any website visitor or service client.
                </p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 2. SCOPE */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="scope" number={2}>Scope of Policy</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">This Policy applies to:</p>
              <BulletList items={[
                "Website visitors",
                "Clients",
                "Inquiry form submissions",
                "Newsletter subscribers",
                "Service applicants",
              ]} />
            </motion.div>
            <GoldDivider />

            {/* 3. INFORMATION WE COLLECT */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="collect" number={3}>Information We Collect</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-6">We may collect the following categories of personal data:</p>
              <div className="space-y-5">
                {[
                  { title: "A. Identity Information", items: ["Full name", "Nationality", "Passport copy (where required)"] },
                  { title: "B. Contact Information", items: ["Email address", "Phone number", "Mailing address"] },
                  { title: "C. Financial Information", items: ["Investment preferences", "Budget range", "Payment method data (where applicable via secure providers)"] },
                  { title: "D. Technical Information", items: ["IP address", "Browser type", "Device type", "Usage analytics"] },
                  { title: "E. Transaction Information", items: ["Property interests", "Service requests", "Consultation notes"] },
                ].map((cat, i) => (
                  <div key={i} className="p-5 rounded-xl bg-white border border-gold/15">
                    <h3 className="font-semibold text-black mb-3" style={{ fontFamily: "Playfair Display, serif" }}>{cat.title}</h3>
                    <BulletList items={cat.items} />
                  </div>
                ))}
              </div>
            </motion.div>
            <GoldDivider />

            {/* 4. HOW WE COLLECT */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="how-collect" number={4}>How We Collect Information</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">We collect data:</p>
              <BulletList items={[
                "When you submit inquiry forms",
                "When you request services",
                "When you subscribe to updates",
                "Through cookies and analytics tools",
                "Through direct communication",
              ]} />
            </motion.div>
            <GoldDivider />

            {/* 5. LEGAL BASIS */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="legal-basis" number={5}>Legal Basis for Processing</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">We process personal data based on:</p>
              <BulletList items={[
                "Consent",
                "Contractual necessity",
                "Legal obligations",
                "Legitimate business interests",
              ]} />
            </motion.div>
            <GoldDivider />

            {/* 6. HOW WE USE */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="use" number={6}>How We Use Your Information</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">We use data to:</p>
              <BulletList items={[
                "Provide real estate services",
                "Facilitate Golden Visa applications (via licensed partners)",
                "Provide property management services",
                "Conduct valuations",
                "Respond to inquiries",
                "Improve website functionality",
                "Send relevant communications (if consented)",
              ]} />
              <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-gold/5 border border-gold/15">
                <Shield className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <p className="text-sm text-zinc-700 font-medium">We do not sell personal data.</p>
              </div>
            </motion.div>
            <GoldDivider />

            {/* 7. DATA SHARING */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="sharing" number={7}>Data Sharing & Third Parties</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">We may share data with:</p>
              <BulletList items={[
                "Licensed immigration consultants",
                "Real estate developers",
                "Legal advisors",
                "Government authorities (where required)",
                "Technology service providers",
              ]} />
              <p className="text-zinc-600 text-sm mt-4 leading-relaxed">
                All sharing is done only as necessary and under appropriate safeguards.
              </p>
            </motion.div>
            <GoldDivider />

            {/* 8. INTERNATIONAL TRANSFERS */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="transfers" number={8}>International Transfers</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">If data is transferred outside the UAE:</p>
              <BulletList items={[
                "Reasonable safeguards will be applied",
                "Transfers will comply with applicable laws",
              ]} />
            </motion.div>
            <GoldDivider />

            {/* 9. DATA RETENTION */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="retention" number={9}>Data Retention</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">We retain personal data only for as long as:</p>
              <BulletList items={[
                "Necessary to provide services",
                "Required by law",
                "Required for dispute resolution",
              ]} />
              <p className="text-zinc-600 text-sm mt-4 leading-relaxed">
                Afterward, data will be securely deleted.
              </p>
            </motion.div>
            <GoldDivider />

            {/* 10. DATA SECURITY */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="security" number={10}>Data Security</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">We implement:</p>
              <div className="p-6 rounded-xl bg-white border border-gold/15">
                <BulletList items={[
                  "Secure servers",
                  "Encrypted communications",
                  "Access controls",
                  "Internal confidentiality protocols",
                ]} />
              </div>
              <p className="text-zinc-500 text-sm mt-4 leading-relaxed">
                No online transmission is 100% secure, but we apply reasonable protection measures.
              </p>
            </motion.div>
            <GoldDivider />

            {/* 11. YOUR RIGHTS */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="rights" number={11}>Your Rights</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">Users may have the right to:</p>
              <BulletList items={[
                "Access their personal data",
                "Request correction",
                "Request deletion (where legally permissible)",
                "Withdraw consent",
                "Request restriction of processing",
              ]} />
              <p className="text-zinc-600 text-sm mt-4 leading-relaxed">
                Requests may be submitted via official contact channels.
              </p>
            </motion.div>
            <GoldDivider />

            {/* 12. COOKIES */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="cookies" number={12}>Cookies & Tracking</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">This website uses cookies for:</p>
              <BulletList items={[
                "Functionality",
                "Analytics",
                "Performance optimization",
              ]} />
              <p className="text-zinc-600 text-sm mt-4 leading-relaxed">
                Users may manage cookie preferences via browser settings. A detailed <Link to="/cookies" className="text-gold hover:underline">Cookie Policy</Link> page provides further breakdown.
              </p>
            </motion.div>
            <GoldDivider />

            {/* 13. CHILDREN */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="children" number={13}>Children's Privacy</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed">
                This website is not intended for individuals under 18 years of age. We do not knowingly collect personal data from minors.
              </p>
            </motion.div>
            <GoldDivider />

            {/* 14. CHANGES */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="changes" number={14}>Changes to This Policy</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed">
                We may update this Privacy Policy periodically. Updated versions will be posted on this page.
              </p>
            </motion.div>
            <GoldDivider />

            {/* 15. CONTACT */}
            <motion.div variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <ClauseTitle id="contact-info" number={15}>Contact Information</ClauseTitle>
              <p className="text-zinc-700 leading-relaxed mb-4">For privacy-related inquiries:</p>
              <div className="p-6 rounded-xl bg-white border border-gold/15">
                <BulletList items={[
                  "Data protection requests",
                  "Access requests",
                  "Deletion requests",
                  "Complaints",
                ]} />
                <div className="mt-6 flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gold" />
                  <Link to="/contact" className="text-gold font-medium hover:underline">
                    Submit a Privacy Inquiry
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Footer note */}
            <div className="mt-12 pt-8 border-t border-gold/15 text-center">
              <p className="text-xs text-zinc-400">
                This Privacy Policy is provided for informational purposes and reflects our commitment to data protection principles applicable in the UAE.
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default Privacy;
