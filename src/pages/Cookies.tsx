import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import Footer from "@/components/Footer";

const Cookies = () => {
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
            Cookies Policy
          </h1>

          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="text-zinc-400 text-lg mb-8">
              Last updated: January 2026
            </p>

            <div className="space-y-8 text-zinc-300">
              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">1. What Are Cookies</h2>
                <p>
                  Cookies are small text files that are placed on your device when you visit our website. 
                  They help us provide you with a better experience by remembering your preferences and 
                  understanding how you use our site.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">2. Types of Cookies We Use</h2>
                <p className="mb-4">We use the following types of cookies:</p>
                
                <h3 className="text-white text-lg font-medium mt-4 mb-2">Essential Cookies (Required)</h3>
                <p className="mb-4">
                  These cookies are necessary for the website to function properly. They enable core 
                  functionality such as security, network management, and accessibility. You cannot 
                  opt out of these cookies.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Session management and authentication</li>
                  <li>Security and fraud prevention</li>
                  <li>Load balancing and site performance</li>
                  <li>Cookie consent preferences</li>
                </ul>

                <h3 className="text-white text-lg font-medium mt-6 mb-2">Analytics Cookies (Optional)</h3>
                <p className="mb-4">
                  These cookies help us understand how visitors interact with our website by collecting 
                  and reporting information anonymously. This helps us improve our site and services.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Page views and navigation patterns</li>
                  <li>Time spent on pages</li>
                  <li>Error tracking and debugging</li>
                  <li>Feature usage statistics</li>
                </ul>

                <h3 className="text-white text-lg font-medium mt-6 mb-2">Marketing Cookies (Optional)</h3>
                <p className="mb-4">
                  These cookies are used to track visitors across websites. The intention is to display 
                  ads that are relevant and engaging for the individual user.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Advertising effectiveness measurement</li>
                  <li>Retargeting and remarketing</li>
                  <li>Social media integration</li>
                </ul>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">3. Your Cookie Choices</h2>
                <p className="mb-4">
                  When you first visit our website, you will be presented with a cookie consent banner 
                  that allows you to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Accept All:</strong> Enable all cookies including analytics and marketing</li>
                  <li><strong>Reject Non-Essential:</strong> Only allow essential cookies required for the site to function</li>
                  <li><strong>Manage Preferences:</strong> Choose which optional cookie categories to enable</li>
                </ul>
                <p className="mt-4">
                  You can change your cookie preferences at any time by clearing your browser cookies 
                  and revisiting our site, or by contacting us.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">4. Browser Cookie Settings</h2>
                <p>
                  Most web browsers allow you to control cookies through their settings. You can set 
                  your browser to refuse cookies or delete certain cookies. However, if you block or 
                  delete cookies, some features of our website may not function properly.
                </p>
                <p className="mt-4">
                  To learn more about how to manage cookies in your browser, visit your browser's help section.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">5. Third-Party Cookies</h2>
                <p>
                  We may use third-party services that set their own cookies on your device. These 
                  third parties have their own privacy policies governing the use of cookies. We 
                  recommend reviewing the privacy policies of these third parties.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">6. Data Protection</h2>
                <p>
                  Information collected through cookies is processed in accordance with our Privacy Policy 
                  and applicable data protection laws, including UAE Federal Law No. 45 of 2021 on Personal 
                  Data Protection and GDPR where applicable.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">7. Updates to This Policy</h2>
                <p>
                  We may update this Cookies Policy from time to time to reflect changes in our practices 
                  or for other operational, legal, or regulatory reasons. We encourage you to review this 
                  policy periodically.
                </p>
              </section>

              <section>
                <h2 className="text-gold text-xl font-semibold mb-4">8. Contact Us</h2>
                <p>
                  If you have questions about our use of cookies, please contact us at:
                </p>
                <p className="mt-4">
                  <strong>JBJ Global Real Estate</strong><br />
                  Real Estate Brokerage<br />
                  Dubai, United Arab Emirates<br />
                  Email: <a href="mailto:privacy@jbj.ae" className="text-gold hover:underline">privacy@jbj.ae</a>
                </p>
                <p className="mt-6 text-zinc-500 text-sm">
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

export default Cookies;
