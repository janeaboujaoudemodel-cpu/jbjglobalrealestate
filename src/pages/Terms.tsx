import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Footer from "@/components/Footer";

const JJ_HOLDING_URL = "https://jjholdinggroup.com";

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
                <h2 className="text-gold text-xl font-semibold mb-4">1. Agreement to Terms</h2>
                <p>
                  By accessing or using the JJ Global Capital website and services, you agree to be bound by these Terms of Service. JJ Global Capital is a division of{" "}
                  <a href={JJ_HOLDING_URL} target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
                    JJ Holding Group
                  </a>
                  , registered and operating in the United Arab Emirates.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">2. Our Services</h2>
                <p>JJ Global Capital provides:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Real estate brokerage and advisory services</li>
                  <li>AI-powered property matching and recommendations</li>
                  <li>Property management services</li>
                  <li>Investment advisory services</li>
                  <li>Mortgage advisory services</li>
                  <li>Legal real estate services</li>
                  <li>Design, architecture, and fit-out services</li>
                  <li>Luxury concierge and lifestyle services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">3. Property Information</h2>
                <p>
                  While we strive to ensure accuracy, property information, prices, availability, and specifications are subject to change without notice. All property details should be verified directly with the developer or through our advisors before making any investment decisions.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">4. AI Property Matcher</h2>
                <p>
                  Our AI Property Matcher is provided as a complimentary service to help identify potential properties based on your stated preferences. Recommendations are algorithmic suggestions and do not constitute professional investment advice. We recommend consulting with our advisors for comprehensive guidance.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">5. Intellectual Property</h2>
                <p>
                  All content, trademarks, and intellectual property on this website belong to JJ Global Capital and JJ Holding Group. The AI Property Matcher technology and methodology are proprietary and exclusive to JJ Global Capital. Unauthorized reproduction, distribution, or use is prohibited.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">6. Broker Toolkit & Educational Content License</h2>
                <p>
                  Access to the Broker Toolkit, training courses, and educational materials is granted on a personal, non-transferable license basis. By subscribing to or accessing these services, you agree to the following:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>Personal Use Only:</strong> Content is licensed for your individual professional development and may not be shared, redistributed, or sublicensed.</li>
                  <li><strong>Single Device Policy:</strong> Your subscription is limited to one active device at a time. Access from multiple devices may result in account suspension.</li>
                  <li><strong>No Copying or Distribution:</strong> Downloading, screen recording, photographing, or redistributing course materials is strictly prohibited.</li>
                  <li><strong>Watermarking & Tracking:</strong> All content is watermarked with your unique user ID for traceability.</li>
                  <li><strong>Credential Security:</strong> You are responsible for maintaining the confidentiality of your login credentials. Sharing credentials with third parties is prohibited.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">7. Copyright Violations & Legal Consequences</h2>
                <p>
                  Violation of the content license terms constitutes copyright infringement under UAE law. Violators may be subject to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Immediate account termination without refund</li>
                  <li>Civil liability for damages under UAE Federal Law No. 38 of 2021 (Copyright and Related Rights)</li>
                  <li>Criminal prosecution under UAE Federal Decree-Law No. 5 of 2012 (Combating Cybercrimes)</li>
                  <li>Fines up to AED 500,000 and/or imprisonment for up to 2 years</li>
                </ul>
                <p className="mt-4">
                  Our systems employ advanced security monitoring including device fingerprinting, IP tracking, and content access logging. Any unauthorized sharing will be detected and traced back to the originating account.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">8. User Conduct</h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Use our services for any unlawful purpose</li>
                  <li>Submit false or misleading information</li>
                  <li>Attempt to access restricted areas of our systems</li>
                  <li>Reproduce or redistribute our proprietary content</li>
                  <li>Interfere with the proper functioning of our website</li>
                  <li>Share your account credentials with others</li>
                  <li>Use automated tools to scrape or download content</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
                <p>
                  Our services are provided "as is" without warranties of any kind. We do not guarantee uninterrupted access to our website or that property transactions will be successful. Investment in real estate involves risks, and past performance does not guarantee future results.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">10. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by UAE law, JJ Global Capital shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">11. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">12. Copyright Registration</h2>
                <p>
                  All original content, training materials, and educational resources provided by JJ Global Capital are registered with the UAE Ministry of Economy under Copyright Registration. For intellectual property inquiries, contact:
                </p>
                <p className="mt-2">
                  Email: <a href="mailto:legal@jjglobalcapital.com" className="text-gold hover:underline">legal@jjglobalcapital.com</a>
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">13. Contact Us</h2>
                <p>
                  For questions about these Terms, please contact us at:
                </p>
                <p className="mt-4">
                  <strong>JJ Global Capital</strong><br />
                  Downtown Dubai, United Arab Emirates<br />
                  Email: <a href="mailto:Invest@JJGlobalCapital.com" className="text-gold hover:underline">Invest@JJGlobalCapital.com</a><br />
                  Phone: <a href="tel:+971565911000" className="text-gold hover:underline">+971 56 591 1000</a>
                </p>
                <p className="mt-4 text-zinc-500 text-sm">
                  © {new Date().getFullYear()} JJ Global Capital. All Rights Reserved.<br />
                  Developed and Created by Founder Jane Abou Jaoude
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
                <p>
                  Our services are provided "as is" without warranties of any kind. We do not guarantee uninterrupted access to our website or that property transactions will be successful. Investment in real estate involves risks, and past performance does not guarantee future results.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">8. Limitation of Liability</h2>
                <p>
                  To the maximum extent permitted by UAE law, JJ Global Capital shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">9. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the United Arab Emirates. Any disputes shall be subject to the exclusive jurisdiction of the courts of Dubai, UAE.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">10. Contact Us</h2>
                <p>
                  For questions about these Terms, please contact us at:
                </p>
                <p className="mt-4">
                  <strong>JJ Global Capital</strong><br />
                  Downtown Dubai, United Arab Emirates<br />
                  Email: <a href="mailto:Invest@JJGlobalCapital.com" className="text-gold hover:underline">Invest@JJGlobalCapital.com</a><br />
                  Phone: <a href="tel:+971565911000" className="text-gold hover:underline">+971 56 591 1000</a>
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