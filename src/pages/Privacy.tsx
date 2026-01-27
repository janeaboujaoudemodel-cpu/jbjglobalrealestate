import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Footer from "@/components/Footer";

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
                  JBJ Global Real Estate is committed to protecting personal and transactional data. 
                  This Privacy Policy explains how information is collected, used, stored, and protected 
                  when you interact with our platform, services, and tools.
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
                  <li>Provide, maintain, and improve our brokerage services</li>
                  <li>Send you property recommendations and market insights</li>
                  <li>Respond to your inquiries and provide customer support</li>
                  <li>Send newsletters and marketing communications (with your consent)</li>
                  <li>Analyze usage patterns to improve our website and services</li>
                  <li>Comply with legal obligations under UAE law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">4. Data Protection</h2>
                <p>
                  We use reasonable technical and organizational measures to protect your personal information 
                  from unauthorized access, loss, or misuse. These measures include:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>Encryption:</strong> Data transmissions are encrypted using industry-standard protocols.</li>
                  <li><strong>Access Controls:</strong> Access to personal data is restricted to authorized personnel only.</li>
                  <li><strong>Secure Storage:</strong> Personal data is stored on secure, access-controlled systems.</li>
                </ul>
                <p className="mt-4 text-zinc-400">
                  We implement industry-standard technical and organizational safeguards to protect data. 
                  While no digital system can guarantee absolute security, access controls, monitoring, 
                  and protection mechanisms are applied to minimize risk and unauthorized access.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">5. Broker Toolkit Security</h2>
                <p>
                  For Broker Toolkit subscribers, we implement additional security measures to protect 
                  your account and content access, including session management and activity monitoring.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">6. Sharing Your Information</h2>
                <p>
                  We do not sell personal data. Information is shared only where required to deliver 
                  brokerage services, comply with legal obligations, or introduce licensed partners 
                  at the user's request, in accordance with applicable data protection laws.
                </p>
                <ul className="list-disc pl-6 mt-4 space-y-2">
                  <li>Licensed partners for services you request (e.g., mortgage, legal, visa)</li>
                  <li>Real estate developers and partners for property inquiries</li>
                  <li>Service providers who assist in our operations</li>
                  <li>Legal authorities when required by law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">7. Your Rights</h2>
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
                  All client information and property inquiries are treated as confidential and are:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Accessed only by authorized personnel</li>
                  <li>Protected against unauthorized use</li>
                  <li>Never sold or distributed for third-party marketing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">9. Cookies</h2>
                <p>
                  We use cookies and similar technologies to enhance your browsing experience. 
                  For detailed information about our use of cookies, please see our{" "}
                  <Link to="/cookies" className="text-gold hover:underline">Cookies Policy</Link>.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">10. Data Collection & Storage</h2>
                <p>
                  JBJ Global Real Estate collects and stores user-submitted information, including business cards, 
                  contact details, and activity data, for the purpose of enhancing user experience, improving 
                  platform performance, and assisting with account access or password recovery. All data is 
                  securely encrypted and used solely for operational and service improvement purposes.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Business card data scanned through our AI-powered scanner</li>
                  <li>User activity and interaction data for analytics</li>
                  <li>Session tracking for improved user experience</li>
                  <li>Form submissions and inquiry data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">11. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy, please contact us at:
                </p>
                <p className="mt-4">
                  <strong>JBJ Global Real Estate</strong><br />
                  Real Estate Brokerage<br />
                  Downtown Dubai, United Arab Emirates<br />
                  General Inquiries: <a href="mailto:Contact@JBJ.ae" className="text-gold hover:underline">Contact@JBJ.ae</a><br />
                  Phone: <a href="tel:+971565911000" className="text-gold hover:underline">+971 56 591 1000</a><br />
                  Data Protection: <a href="mailto:Privacy@JBJ.ae" className="text-gold hover:underline">Privacy@JBJ.ae</a>
                </p>
                <p className="mt-4 text-zinc-500 text-sm">
                  © {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
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