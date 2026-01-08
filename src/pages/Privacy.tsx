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
                  JBJ Global Real Estate ("we," "our," or "us"), a Dubai-based real estate brokerage, 
                  is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                  use, disclose, and safeguard your information when you visit our website or use our services.
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
                  While we strive to protect your information, no method of transmission over the Internet 
                  or electronic storage is 100% secure. We cannot guarantee absolute security.
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
                <p>We may share your information with:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Our partner service providers and affiliated services</li>
                  <li>Real estate developers and partners for property inquiries</li>
                  <li>Service providers who assist in our operations</li>
                  <li>Legal authorities when required by law</li>
                </ul>
                <p className="mt-4 text-zinc-400">
                  We do not sell your personal data to third parties. Any sharing is done in accordance 
                  with applicable data protection laws.
                </p>
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
                  JBJ Global Real Estate is committed to maintaining the highest standards of data confidentiality. 
                  Your personal information and property inquiries are treated with strict confidentiality and are:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Never sold to third parties</li>
                  <li>Protected from unauthorized access</li>
                  <li>Accessible only to authorized personnel on a need-to-know basis</li>
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
                <h2 className="text-gold text-xl font-semibold mb-4">10. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy, please contact us at:
                </p>
                <p className="mt-4">
                  <strong>JBJ Global Real Estate</strong><br />
                  Real Estate Brokerage<br />
                  Downtown Dubai, United Arab Emirates<br />
                  General Inquiries: <a href="mailto:contact@jbj.ae" className="text-gold hover:underline">contact@jbj.ae</a><br />
                  Phone: <a href="tel:+971565911000" className="text-gold hover:underline">+971 56 591 1000</a><br />
                  Data Protection: <a href="mailto:privacy@jbj.ae" className="text-gold hover:underline">privacy@jbj.ae</a>
                </p>
                <p className="mt-4 text-zinc-500 text-sm">
                  © {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.
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