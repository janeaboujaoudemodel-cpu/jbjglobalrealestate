import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Footer from "@/components/Footer";



const Terms = () => {
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
            Terms of Service
          </h1>

          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-zinc-400 text-lg mb-8">
              Last updated: January 2026
            </p>

            <div className="space-y-8 text-zinc-300">
              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">1. Who We Are</h2>
                <p>
                  This website is operated by JBJ Global Real Estate (the "Company", "we", "us", "our"). 
                  We are a Dubai-based real estate brokerage and provide real estate brokerage support 
                  for property sales and leasing, and (where applicable) holiday homes support subject 
                  to relevant approvals and permits.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">2. Scope of Our Services</h2>
                <p>We provide:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Real estate brokerage support (property sales and leasing)</li>
                  <li>Property search and introductions to listings/projects</li>
                  <li>Coordination support for viewings, documentation and transaction process (as applicable)</li>
                  <li>Holiday homes support (short-term rental support) only where permitted and subject to relevant approvals/permits</li>
                  <li>Tools and calculators (including AI-enabled tools) for informational use</li>
                  <li>Introductions to independent licensed third parties (for example: law firms, banks/mortgage specialists, conveyancing providers, and licensed property management providers)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">3. What We Do NOT Do (Important)</h2>
                <p className="mb-4">We do NOT provide:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>Legal advice or legal services</strong></li>
                  <li><strong>Mortgage advice, mortgage brokerage, or banking services</strong></li>
                  <li><strong>Financial advice or any regulated financial service</strong></li>
                  <li><strong>Third-party long-term property management services</strong> unless expressly stated and licensed for that activity</li>
                </ul>
                <p className="mt-4 text-zinc-400">
                  If you need legal, mortgage, or other regulated services, we may introduce you to 
                  independent licensed providers. Those providers offer services under their own licences/employers 
                  and you contract directly with them.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">4. Third-Party Introductions and Partner Services</h2>
                <p>
                  Any third-party professional or partner displayed on our website (including legal, mortgage, 
                  and property management partners) is an independent party. We do not control and are not 
                  responsible for their advice, services, fees, timelines, licensing, or outcomes. You must 
                  conduct your own checks and agree terms directly with them.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">5. Tools, Calculators, and AI Features</h2>
                <p className="mb-4">
                  Our tools (including any AI-enabled features such as quizzes, comparisons, evaluators, 
                  reports, and calculators) are provided for general informational purposes only.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Outputs are estimates and may be incomplete, outdated, or inaccurate.</li>
                  <li>You should not rely on these tools as legal, mortgage, or financial advice.</li>
                  <li>You remain responsible for verifying all information with qualified licensed professionals and/or official sources.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">6. Property Information and Listings</h2>
                <p>
                  Property information, imagery, brochures, floor plans, prices, availability, and descriptions 
                  may be provided by developers/owners or third parties and may change at any time. We do not 
                  guarantee accuracy, completeness, or availability. Final terms are subject to official contracts 
                  and approvals.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">7. Consultations, Booking, and Communications</h2>
                <p className="mb-4">When you book a consultation or submit an inquiry, you agree that:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>The consultation is focused on real estate brokerage guidance and introductions only</li>
                  <li>We may contact you via phone, email, or messaging apps regarding your inquiry</li>
                  <li>Marketing communications (if any) will be sent only where you have provided the required consent or where permitted by applicable law</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">8. User Accounts (Where Applicable)</h2>
                <p>
                  If you create an account, you are responsible for keeping your login credentials secure. 
                  You must not use the site unlawfully or attempt to access restricted areas without authorization.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">9. Acceptable Use</h2>
                <p className="mb-4">You agree not to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Misuse the site or attempt to disrupt its functionality</li>
                  <li>Upload unlawful, misleading, or infringing content</li>
                  <li>Copy, scrape, or republish our content without permission</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">10. Intellectual Property</h2>
                <p>
                  All website content, branding, logos, design elements, and software are owned by or licensed 
                  to us and are protected by applicable laws. You may not reproduce, modify, distribute, or 
                  create derivative works without written permission.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">11. Disclaimers</h2>
                <p className="mb-4">To the fullest extent permitted by applicable law:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>The site and services are provided "as is" and "as available"</li>
                  <li>We make no warranties regarding outcomes of any transaction</li>
                  <li>We are not liable for third-party services, delays, losses, or indirect damages</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">12. Limitation of Liability</h2>
                <p>
                  Our total liability to you for any claim related to the website or services will be limited 
                  to the maximum extent permitted by applicable law.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">13. Indemnity</h2>
                <p>
                  You agree to indemnify and hold us harmless from claims arising from your misuse of the website, 
                  violation of these Terms, or infringement of any rights.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">14. Governing Law</h2>
                <p>
                  These Terms are governed by the laws applicable in the United Arab Emirates. Any disputes 
                  will be subject to the competent courts, as applicable.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">15. Contact</h2>
                <p>
                  For questions about these Terms:
                </p>
                <p className="mt-4">
                  <strong>JBJ Global Real Estate</strong><br />
                  Real Estate Brokerage<br />
                  Dubai, United Arab Emirates<br />
                  Email: <a href="mailto:privacy@jbj.ae" className="text-gold hover:underline">privacy@jbj.ae</a>
                </p>
                <p className="mt-6 text-zinc-500 text-sm">
                  © {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.<br />
                  Developed and Created by Founder Jane Abou Jaoude
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

export default Terms;
