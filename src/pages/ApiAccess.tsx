import SEOHead from '@/components/SEOHead';
import { Shield, Lock, Mail, Phone, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ApiAccess() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title="API Access | JBJ Global Real Estate"
        description="Request authorized API access to JBJ Global Real Estate platform. All API access requires an approved API key."
      />

      {/* Hero */}
      <section className="relative py-28 px-6 bg-gradient-to-br from-card via-background to-card border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-6">
            <Shield className="w-4 h-4 text-gold" />
            <span className="text-sm font-medium text-gold">Protected Platform</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">API Access</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            JBJ Global Real Estate's platform, data, algorithms, and APIs are proprietary. 
            All API access requires an approved API key issued by JBJ Global Real Estate.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-4xl mx-auto px-6 py-16 space-y-12">
        {/* Notice */}
        <div className="bg-card border border-gold/30 rounded-2xl p-8">
          <div className="flex items-start gap-4">
            <Lock className="w-8 h-8 text-gold flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold mb-3">Authorized Access Only</h2>
              <p className="text-muted-foreground leading-relaxed">
                JBJ Global Real Estate's software, proprietary algorithms, AI models, property data, and all digital assets 
                are exclusively owned and protected under UAE Federal Law No. 38 of 2021 (Copyright and Neighboring Rights), 
                UAE Federal Decree-Law No. 34 of 2021 (Combating Rumours and Cybercrime), and international intellectual property treaties.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Unauthorized access, scraping, reverse-engineering, replication, or redistribution of any part of this platform 
                is strictly prohibited and will be pursued under the full extent of UAE and international law.
              </p>
            </div>
          </div>
        </div>

        {/* How to Request */}
        <div className="bg-card border border-border rounded-2xl p-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            How to Request API Access
          </h2>
          <ol className="space-y-4 text-muted-foreground">
            <li className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
              <p>Contact our team via the details below with your company name, use case, and expected API usage volume.</p>
            </li>
            <li className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
              <p>Our legal team will review your request and share the API Terms of Use agreement for signing.</p>
            </li>
            <li className="flex gap-3">
              <span className="w-7 h-7 rounded-full bg-gold/20 text-gold flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
              <p>Upon approval, you'll receive a time-limited API key with defined rate limits and scope restrictions.</p>
            </li>
          </ol>
        </div>

        {/* Contact */}
        <div className="bg-card border border-gold/30 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold mb-4">Contact the Team</h2>
          <p className="text-muted-foreground mb-6">For API access requests, partnership inquiries, or data licensing:</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="mailto:contact@jbj.ae" className="inline-flex items-center gap-2 px-6 py-3 bg-gold hover:bg-gold/90 text-black rounded-xl font-semibold transition-colors">
              <Mail className="w-4 h-4" /> contact@jbj.ae
            </a>
            <a href="tel:+971565911000" className="inline-flex items-center gap-2 px-6 py-3 border border-gold/30 hover:bg-gold/10 text-foreground rounded-xl font-semibold transition-colors">
              <Phone className="w-4 h-4" /> +971 56 591 1000
            </a>
          </div>
        </div>

        {/* Legal Warning */}
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-destructive mb-2">Legal Notice</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Any unauthorized attempt to access, scrape, copy, reverse-engineer, or replicate JBJ Global Real Estate's 
                platform, software, AI models, or data will result in immediate legal action under UAE Federal Cybercrime Law 
                and applicable international intellectual property statutes. Violators will be subject to criminal prosecution 
                and civil damages.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
