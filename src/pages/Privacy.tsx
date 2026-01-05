import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Footer from "@/components/Footer";

const JJ_HOLDING_URL = "https://jjholdinggroup.com";

const Privacy = () => {
  return (
    <section className="min-h-screen bg-zinc-950">
      <div className="container mx-auto px-4 py-12">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-8"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to Home</span>
        </Link>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-white text-4xl font-bold mb-8" style={{ fontFamily: "Poppins, sans-serif" }}>
            Privacy Policy
          </h1>

          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-zinc-400 text-lg mb-8">
              Last updated: January 2026
            </p>

            <div className="space-y-8 text-zinc-300">
              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">1. Introduction</h2>
                <p>
                  JJ Global Capital ("we," "our," or "us"), a division of{" "}
                  <a href={JJ_HOLDING_URL} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                    JJ Holding Group
                  </a>
                  , is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our services.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">2. Information We Collect</h2>
                <p>We may collect information about you in a variety of ways, including:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>Personal Data:</strong> Name, email address, phone number, nationality, and other contact information you provide when inquiring about properties or services.</li>
                  <li><strong>Usage Data:</strong> Information about how you access and use our website, including your IP address, browser type, pages visited, and time spent on pages.</li>
                  <li><strong>Property Preferences:</strong> Information about your property preferences collected through our AI Property Matcher and other tools.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">3. How We Use Your Information</h2>
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Send you property recommendations and market insights</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Send newsletters and marketing communications (with your consent)</li>
                  <li>Analyze usage patterns to improve our website and services</li>
                  <li>Comply with legal obligations under UAE law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">4. Data Protection & Encryption</h2>
                <p>
                  We implement enterprise-grade security measures to protect your personal information:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>End-to-End Encryption:</strong> All data transmissions are encrypted using TLS 1.3 or higher.</li>
                  <li><strong>Database Encryption:</strong> Personal data is encrypted at rest using AES-256 encryption.</li>
                  <li><strong>Access Controls:</strong> Strict role-based access controls limit data access to authorized personnel only.</li>
                  <li><strong>Audit Logging:</strong> All data access is logged and monitored for security compliance.</li>
                  <li><strong>Developer Isolation:</strong> Your personal data is not accessible to web developers or third-party contractors.</li>
                </ul>
                <p className="mt-4">
                  These measures comply with UAE Federal Law No. 45 of 2021 on Personal Data Protection and international best practices including GDPR standards.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">5. Broker Toolkit Security</h2>
                <p>
                  For Broker Toolkit subscribers, we implement additional security measures:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>Device Fingerprinting:</strong> Your session is linked to a specific device to prevent unauthorized access.</li>
                  <li><strong>Session Management:</strong> Active sessions are monitored and suspicious activity triggers automatic security alerts.</li>
                  <li><strong>Content Watermarking:</strong> Educational materials are watermarked with your unique identifier for traceability.</li>
                  <li><strong>IP Address Logging:</strong> Login locations are recorded for security verification.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">5. Sharing Your Information</h2>
                <p>We may share your information with:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Our affiliated companies within JJ Holding Group</li>
                  <li>Real estate developers and partners for property inquiries</li>
                  <li>Service providers who assist in our operations</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">6. Your Rights</h2>
                <p>Under applicable UAE and international data protection laws, you have the right to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Access your personal data</li>
                  <li>Request correction of inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Withdraw consent for marketing communications</li>
                  <li>Lodge a complaint with relevant authorities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">8. Confidentiality Commitment</h2>
                <p>
                  JJ Global Capital is committed to maintaining the highest standards of data confidentiality. Your personal information, investment inquiries, and financial details are treated with strict confidentiality and are:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Never sold to third parties</li>
                  <li>Encrypted and secured from unauthorized access</li>
                  <li>Accessible only to authorized personnel on a need-to-know basis</li>
                  <li>Protected by legal non-disclosure agreements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">9. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy, please contact us at:
                </p>
                <p className="mt-4">
                  <strong>JJ Global Capital</strong><br />
                  Downtown Dubai, United Arab Emirates<br />
                  Email: <a href="mailto:Invest@JJGlobalCapital.com" className="text-gold hover:underline">Invest@JJGlobalCapital.com</a><br />
                  Phone: <a href="tel:+971565911000" className="text-gold hover:underline">+971 56 591 1000</a><br />
                  Data Protection: <a href="mailto:privacy@jjglobalcapital.com" className="text-gold hover:underline">privacy@jjglobalcapital.com</a>
                </p>
                <p className="mt-4 text-zinc-500 text-sm">
                  © {new Date().getFullYear()} JJ Global Capital. All Rights Reserved.<br />
                  Your data is encrypted and strictly confidential.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </section>
  );
};

export default Privacy;