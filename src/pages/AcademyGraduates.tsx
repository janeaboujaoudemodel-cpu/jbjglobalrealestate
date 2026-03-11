import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { JJLogoImage } from "@/components/JJLogoImage";
import {
  GraduationCap,
  Award,
  Search,
  Hash,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Shield,
} from "lucide-react";

interface GraduateCertificate {
  id: string;
  certificate_number: string;
  full_name: string;
  track: string;
  combined_score: number;
  issued_at: string;
  is_revoked: boolean;
  verification_token: string;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function AcademyGraduates() {
  const [certificates, setCertificates] = useState<GraduateCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [lookupNumber, setLookupNumber] = useState("");
  const [lookupResult, setLookupResult] = useState<GraduateCertificate | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    fetchGraduates();
  }, []);

  const fetchGraduates = async () => {
    try {
      const { data, error } = await supabase
        .from("hr_certificates")
        .select("id, certificate_number, full_name, track, combined_score, issued_at, is_revoked, verification_token")
        .eq("is_revoked", false)
        .order("issued_at", { ascending: false });

      if (error) throw error;
      setCertificates((data as GraduateCertificate[]) || []);
    } catch (err) {
      console.error("Error fetching graduates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async () => {
    if (!lookupNumber.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const { data, error } = await supabase
        .from("hr_certificates")
        .select("id, certificate_number, full_name, track, combined_score, issued_at, is_revoked, verification_token")
        .eq("certificate_number", lookupNumber.trim().toUpperCase())
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setLookupError("No certificate found with this number.");
      } else {
        setLookupResult(data as GraduateCertificate);
      }
    } catch (err) {
      setLookupError("Failed to look up certificate.");
    } finally {
      setLookupLoading(false);
    }
  };

  const filteredCerts = certificates.filter((c) =>
    c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.certificate_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SEOHead
        title="Academy Graduates | JBJ Global Real Estate"
        description="View certified graduates of the JBJ Academy Broker Training Program. Verify certificates by number or QR code."
        canonicalPath="/academy/graduates"
      />

      <div className="min-h-screen bg-gradient-to-b from-[hsl(40,33%,98%)] via-[hsl(38,30%,95%)] to-[hsl(36,25%,92%)]">
        {/* Hero */}
        <section className="py-16 md:py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <Badge className="bg-gold/20 text-gold border-gold/30 px-4 py-1.5 mb-6">
              <GraduationCap className="w-4 h-4 mr-2" />
              Certified Professionals
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-black mb-4">
              JBJ Academy <span className="text-gold">Graduates</span>
            </h1>
            <p className="text-black/60 max-w-2xl mx-auto">
              Our certified brokers have completed rigorous training in real estate fundamentals, market knowledge, and professional sales techniques.
            </p>
          </div>
        </section>

        {/* Certificate Lookup */}
        <section className="pb-12">
          <div className="max-w-2xl mx-auto px-4">
            <Card className="border-2 border-gold/30 bg-white/90">
              <CardContent className="p-6">
                <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gold" />
                  Verify a Certificate
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter certificate number (e.g. JBJ-CERT-001)"
                    value={lookupNumber}
                    onChange={(e) => setLookupNumber(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                    className="border-gold/20"
                  />
                  <Button onClick={handleLookup} disabled={lookupLoading} className="bg-gold text-black hover:bg-gold/90">
                    {lookupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  </Button>
                </div>

                {lookupError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <XCircle className="w-4 h-4" />
                    {lookupError}
                  </div>
                )}

                {lookupResult && (
                  <div className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      {lookupResult.is_revoked ? (
                        <Badge className="bg-red-500 text-white"><XCircle className="w-3 h-3 mr-1" /> REVOKED</Badge>
                      ) : (
                        <Badge className="bg-emerald-500 text-white"><CheckCircle className="w-3 h-3 mr-1" /> ACTIVE</Badge>
                      )}
                    </div>
                    <p className="font-semibold text-black">{lookupResult.full_name}</p>
                    <p className="text-sm text-black/60">Track: {lookupResult.track} · Score: {lookupResult.combined_score}%</p>
                    <p className="text-xs text-black/40 mt-1">
                      Issued {new Date(lookupResult.issued_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <Button asChild size="sm" variant="outline" className="mt-2 border-gold/40 text-gold text-xs">
                      <Link to={`/verify-certificate/${lookupResult.verification_token}`}>
                        View Full Certificate
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Graduates Grid */}
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-black">All Graduates</h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/30" />
                <Input
                  placeholder="Search by name or certificate #"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gold/20"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
              </div>
            ) : filteredCerts.length === 0 ? (
              <Card className="border-gold/20 bg-white/80">
                <CardContent className="p-8 text-center">
                  <GraduationCap className="w-12 h-12 text-gold/30 mx-auto mb-3" />
                  <p className="text-black/50">
                    {searchQuery ? "No graduates match your search." : "No graduates yet. Complete the certification program to be the first!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
                className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {filteredCerts.map((cert) => (
                  <motion.div key={cert.id} variants={fadeInUp}>
                    <Link to={`/verify-certificate/${cert.verification_token}`}>
                      <Card className="border border-gold/20 bg-white/90 hover:border-gold/50 hover:shadow-lg hover:shadow-gold/5 transition-all h-full group">
                        <CardContent className="p-5 text-center">
                          <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                            <Award className="w-7 h-7 text-gold" />
                          </div>
                          <h3 className="font-semibold text-black text-sm">{cert.full_name.split(" ")[0]}</h3>
                          <p className="text-black/40 text-xs mt-1">{cert.track}</p>
                          <div className="flex items-center justify-center gap-1.5 mt-2">
                            <Hash className="w-3 h-3 text-gold/60" />
                            <span className="text-xs text-gold/80 font-mono">{cert.certificate_number}</span>
                          </div>
                          <div className="flex items-center justify-center gap-1.5 mt-1.5">
                            <Calendar className="w-3 h-3 text-black/30" />
                            <span className="text-xs text-black/40">
                              {new Date(cert.issued_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </section>

        <div className="text-center pb-12">
          <Button asChild variant="ghost" className="text-black/50">
            <Link to="/jbj-academy">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to JBJ Academy
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
