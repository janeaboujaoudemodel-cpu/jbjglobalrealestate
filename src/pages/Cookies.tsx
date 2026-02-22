import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";

const GoldDivider = () => (
  <div className="flex items-center gap-4 my-8">
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(43,45%,54%)]/30 to-transparent" />
    <div className="w-1.5 h-1.5 rounded-full bg-[hsl(43,45%,54%)]/40" />
    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[hsl(43,45%,54%)]/30 to-transparent" />
  </div>
);

const tocItems = [
  { id: "what-are-cookies", label: "What Are Cookies" },
  { id: "types-of-cookies", label: "Types of Cookies We Use" },
  { id: "how-we-use-cookies", label: "How We Use Cookies" },
  { id: "third-party-cookies", label: "Third-Party Cookies" },
  { id: "managing-cookies", label: "Managing Cookies" },
  { id: "data-collected", label: "Data Collected Through Cookies" },
  { id: "changes", label: "Changes to This Policy" },
  { id: "contact", label: "Contact Information" },
];

const Cookies = () => {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );
    tocItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-[hsl(40,30%,96%)] via-[hsl(39,25%,94%)] to-[hsl(38,20%,92%)]">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[hsl(40,30%,96%)] to-[hsl(39,25%,93%)] border-b border-[hsl(43,45%,54%)]/15">
        <div className="max-w-[1200px] mx-auto px-6 pt-8 pb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-[hsl(0,0%,45%)] hover:text-[hsl(0,0%,25%)] transition-colors mb-10">
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <div className="max-w-3xl">
            <p className="text-[hsl(43,45%,54%)] text-sm font-medium tracking-[0.2em] uppercase mb-4">Legal</p>
            <h1 className="text-[hsl(0,0%,15%)] text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Cookie Policy
            </h1>
            <p className="text-[hsl(43,45%,44%)] text-lg md:text-xl mb-6" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
              Transparency in How We Use Technology
            </p>
            <p className="text-[hsl(0,0%,40%)] leading-relaxed max-w-2xl">
              This Cookie Policy explains how our website uses cookies and similar technologies to enhance user experience, analyse performance, and deliver relevant services.
            </p>
            <p className="text-[hsl(0,0%,40%)] leading-relaxed max-w-2xl mt-3">
              By using our website, you consent to the use of cookies as described in this Policy.
            </p>
            <p className="text-[hsl(0,0%,55%)] text-sm mt-6">Last updated: February 2026</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Mobile TOC */}
        <div className="lg:hidden mb-10 bg-white/80 backdrop-blur border border-[hsl(43,45%,54%)]/15 rounded-xl p-6">
          <p className="text-[hsl(43,45%,44%)] text-xs font-semibold tracking-[0.15em] uppercase mb-4">Table of Contents</p>
          <nav className="space-y-2">
            {tocItems.map(({ id, label }) => (
              <button key={id} onClick={() => scrollTo(id)} className="block w-full text-left text-sm text-[hsl(0,0%,40%)] hover:text-[hsl(43,45%,44%)] transition-colors py-1">
                {label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex gap-12">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-8">
              <p className="text-[hsl(43,45%,44%)] text-xs font-semibold tracking-[0.15em] uppercase mb-5">Contents</p>
              <nav className="space-y-1 border-l border-[hsl(43,45%,54%)]/20">
                {tocItems.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => scrollTo(id)}
                    className={`block w-full text-left pl-4 py-1.5 text-sm transition-all border-l-2 -ml-px ${
                      activeSection === id
                        ? "border-[hsl(43,45%,54%)] text-[hsl(43,45%,44%)] font-medium"
                        : "border-transparent text-[hsl(0,0%,50%)] hover:text-[hsl(0,0%,30%)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 max-w-3xl">
            {/* 1. What Are Cookies */}
            <section id="what-are-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">1.</span>What Are Cookies
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>
                  Cookies are small text files placed on your device when you visit a website. They help websites function properly, improve user experience, and gather analytics data.
                </p>
                <p>Cookies may be:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong className="text-[hsl(0,0%,20%)]">Session-based</strong> — deleted when the browser is closed</li>
                  <li><strong className="text-[hsl(0,0%,20%)]">Persistent</strong> — remain on the device for a defined period</li>
                </ul>
              </div>
            </section>

            <GoldDivider />

            {/* 2. Types of Cookies */}
            <section id="types-of-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">2.</span>Types of Cookies We Use
              </h2>

              <div className="space-y-4">
                <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[hsl(0,0%,15%)] mb-3">A. Essential Cookies</h3>
                  <p className="text-[hsl(0,0%,35%)] leading-relaxed mb-3">
                    These cookies are required for basic website functionality, including:
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5 text-[hsl(0,0%,35%)]">
                    <li>Secure login sessions</li>
                    <li>Form submissions</li>
                    <li>Navigation functionality</li>
                  </ul>
                  <p className="text-[hsl(0,0%,45%)] text-sm mt-3 italic">
                    Without these cookies, the website may not function properly.
                  </p>
                </div>

                <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[hsl(0,0%,15%)] mb-3">B. Performance &amp; Analytics Cookies</h3>
                  <p className="text-[hsl(0,0%,35%)] leading-relaxed mb-3">
                    These cookies collect anonymised data to:
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5 text-[hsl(0,0%,35%)]">
                    <li>Understand user behaviour</li>
                    <li>Measure traffic</li>
                    <li>Improve website performance</li>
                  </ul>
                  <p className="text-[hsl(0,0%,45%)] text-sm mt-3">
                    Examples include analytics tools that track page views and interactions.
                  </p>
                </div>

                <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[hsl(0,0%,15%)] mb-3">C. Functional Cookies</h3>
                  <p className="text-[hsl(0,0%,35%)] leading-relaxed mb-3">These cookies allow:</p>
                  <ul className="list-disc pl-6 space-y-1.5 text-[hsl(0,0%,35%)]">
                    <li>Language preferences</li>
                    <li>Saved settings</li>
                    <li>User experience customisation</li>
                  </ul>
                </div>

                <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[hsl(0,0%,15%)] mb-3">D. Marketing / Advertising Cookies</h3>
                  <p className="text-[hsl(0,0%,35%)] leading-relaxed mb-3">
                    If used, these cookies may:
                  </p>
                  <ul className="list-disc pl-6 space-y-1.5 text-[hsl(0,0%,35%)]">
                    <li>Track engagement</li>
                    <li>Provide targeted advertising</li>
                    <li>Measure campaign performance</li>
                  </ul>
                  <div className="mt-4 bg-[hsl(43,45%,54%)]/5 border border-[hsl(43,45%,54%)]/15 rounded-lg p-4">
                    <p className="text-[hsl(0,0%,40%)] text-sm">
                      Marketing cookies are only activated where applicable and with appropriate consent mechanisms in place.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <GoldDivider />

            {/* 3. How We Use Cookies */}
            <section id="how-we-use-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">3.</span>How We Use Cookies
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Cookies are used to:</p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>Ensure website stability</li>
                  <li>Enhance security</li>
                  <li>Improve user navigation</li>
                  <li>Analyse performance</li>
                  <li>Optimise digital services</li>
                </ul>
                <p className="text-[hsl(0,0%,45%)] text-sm mt-2">
                  Cookies do not grant us access to your device beyond stored cookie data.
                </p>
              </div>
            </section>

            <GoldDivider />

            {/* 4. Third-Party Cookies */}
            <section id="third-party-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">4.</span>Third-Party Cookies
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>We may use trusted third-party providers for:</p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>Analytics</li>
                  <li>Security monitoring</li>
                  <li>Hosting infrastructure</li>
                </ul>
                <p>These providers may place their own cookies subject to their respective privacy policies.</p>
                <p className="text-[hsl(0,0%,45%)] text-sm">We do not control third-party cookie practices.</p>
              </div>
            </section>

            <GoldDivider />

            {/* 5. Managing Cookies */}
            <section id="managing-cookies" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">5.</span>Managing Cookies
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Users can:</p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>Accept or reject cookies via browser settings</li>
                  <li>Delete existing cookies</li>
                  <li>Configure cookie alerts</li>
                </ul>
                <div className="mt-4 bg-[hsl(43,45%,54%)]/5 border border-[hsl(43,45%,54%)]/15 rounded-lg p-4">
                  <p className="text-[hsl(0,0%,40%)] text-sm">
                    Please note that disabling certain cookies may impact website functionality and your overall experience.
                  </p>
                </div>
              </div>
            </section>

            <GoldDivider />

            {/* 6. Data Collected */}
            <section id="data-collected" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">6.</span>Data Collected Through Cookies
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>Cookies may collect:</p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>IP address</li>
                  <li>Browser type</li>
                  <li>Device type</li>
                  <li>Session duration</li>
                  <li>Referring URLs</li>
                </ul>
                <p className="text-[hsl(0,0%,45%)] text-sm mt-2">
                  This data is typically aggregated and anonymised.
                </p>
              </div>
            </section>

            <GoldDivider />

            {/* 7. Changes */}
            <section id="changes" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">7.</span>Changes to This Policy
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 space-y-4 text-[hsl(0,0%,35%)] leading-relaxed">
                <p>We may update this Cookie Policy to reflect:</p>
                <ul className="list-disc pl-6 space-y-1.5">
                  <li>Legal updates</li>
                  <li>Technology changes</li>
                  <li>Website functionality updates</li>
                </ul>
                <p>Revisions will be posted on this page.</p>
              </div>
            </section>

            <GoldDivider />

            {/* 8. Contact */}
            <section id="contact" className="scroll-mt-8">
              <h2 className="text-2xl font-bold text-[hsl(0,0%,15%)] mb-4" style={{ fontFamily: "Playfair Display, Georgia, serif" }}>
                <span className="text-[hsl(43,45%,54%)] mr-3">8.</span>Contact Information
              </h2>
              <div className="bg-white/70 border border-[hsl(43,45%,54%)]/10 rounded-xl p-6 text-[hsl(0,0%,35%)] leading-relaxed">
                <p className="mb-4">For questions regarding our use of cookies, please contact us:</p>
                <div className="bg-[hsl(40,30%,96%)] border border-[hsl(43,45%,54%)]/15 rounded-lg p-5">
                  <p className="font-semibold text-[hsl(0,0%,15%)]">JBJ Global Real Estate</p>
                  <p className="text-sm text-[hsl(0,0%,45%)] mt-1">Real Estate Brokerage</p>
                  <p className="text-sm text-[hsl(0,0%,45%)]">Dubai, United Arab Emirates</p>
                  <p className="mt-3">
                    Email:{" "}
                    <a href="mailto:privacy@JBJ.ae" className="text-[hsl(43,45%,44%)] hover:underline">
                      privacy@JBJ.ae
                    </a>
                  </p>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-16 pt-8 border-t border-[hsl(43,45%,54%)]/15 text-center">
              <p className="text-[hsl(0,0%,55%)] text-sm">
                &copy; {new Date().getFullYear()} JBJ Global Real Estate. All Rights Reserved.
              </p>
              <div className="flex justify-center gap-4 mt-3 text-sm">
                <Link to="/privacy" className="text-[hsl(43,45%,44%)] hover:underline">Privacy Policy</Link>
                <span className="text-[hsl(0,0%,75%)]">|</span>
                <Link to="/terms" className="text-[hsl(43,45%,44%)] hover:underline">Terms of Service</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default Cookies;
