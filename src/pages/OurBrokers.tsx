import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { allBrokers, Broker } from "@/config/brokers-data";
import { Users, Search, Crown } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const isSeniorBroker = (broker: Broker) => broker.yearsExperience >= 10;

const BrokerCard = ({ broker }: { broker: Broker }) => {
  const senior = isSeniorBroker(broker);

  return (
    <motion.div variants={fadeInUp}>
      <Card
        className={
          "bg-[#FDFBF7]/60 border-[#1A1A1A] transition-all duration-300 h-full " +
          (senior
            ? "hover:border-[#B89555]/60 ring-1 ring-gold/20"
            : "hover:border-[#B89555]/40")
        }
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center text-[#1A1A1A] font-bold text-lg">
              {broker.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-white font-semibold truncate">{broker.name}</h3>
                {senior && (
                  <Badge className="bg-[#EFE6D6]/15 text-[#1A1A1A] border-[#B89555]/30 text-xs">
                    <Crown className="w-3 h-3 mr-1" />
                    Senior
                  </Badge>
                )}
              </div>
              <p className="text-white/90 text-sm">{broker.nationality}</p>
            </div>
          </div>

          <p className="text-white/70 text-xs line-clamp-2 mb-3">{broker.bio}</p>

          <div className="flex flex-wrap gap-1 mb-2">
            {broker.specializations.slice(0, 2).map((spec) => (
              <Badge
                key={spec}
                variant="outline"
                className="text-xs border-[#B89555]/30 text-[#1A1A1A]"
              >
                {spec}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-1">
            {broker.languages.slice(0, 3).map((lang) => (
              <Badge
                key={lang}
                variant="outline"
                className="text-xs border-[#1A1A1A] text-white/70"
              >
                {lang}
              </Badge>
            ))}
          </div>

          <p className="text-[#1A1A1A]/70 text-xs mt-2">
            {broker.yearsExperience} years experience
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const OurBrokers = () => {
  const [search, setSearch] = useState("");
  const [nationality, setNationality] = useState<string | null>(null);
  const [tier, setTier] = useState<"all" | "senior" | "broker">("all");

  const nationalities = useMemo(
    () => [...new Set(allBrokers.map((b) => b.nationality))],
    []
  );

  const filteredBrokers = useMemo(() => {
    return allBrokers.filter((broker) => {
      const matchesSearch =
        broker.name.toLowerCase().includes(search.toLowerCase()) ||
        broker.specializations.some((s) =>
          s.toLowerCase().includes(search.toLowerCase())
        );

      const matchesNationality = !nationality || broker.nationality === nationality;

      const senior = isSeniorBroker(broker);
      const matchesTier =
        tier === "all" ? true : tier === "senior" ? senior : !senior;

      return matchesSearch && matchesNationality && matchesTier;
    });
  }, [search, nationality, tier]);

  const seniorCount = useMemo(
    () => allBrokers.filter(isSeniorBroker).length,
    []
  );

  return (
    <>
      <SEOHead
        title="Our Brokers | JBJ Global Real Estate"
        description="Meet our international team of professional brokers—senior and specialist advisors—ready to support your Dubai property goals."
        keywords="Dubai brokers, senior brokers, real estate agents, property consultants"
        canonicalPath="/brokers"
      />
      <div className="min-h-screen bg-[#0D0D0D]">
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-[#EFE6D6]/10 rounded-full blur-[100px]" />
          </div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <Badge className="bg-[#EFE6D6]/15 text-[#1A1A1A] border-[#B89555]/30 px-4 py-1.5 mb-6">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {allBrokers.length}+ Professional Brokers
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our <span className="text-[#1A1A1A]">Brokers</span>
            </h1>
            <p className="text-white/70 max-w-2xl mx-auto mb-8">
              Explore our team by experience level and specialization.
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Button
                variant={tier === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setTier("all")}
                className={tier === "all" ? "bg-[#EFE6D6] text-[#1A1A1A]" : "border-[#1A1A1A]"}
              >
                All ({allBrokers.length})
              </Button>
              <Button
                variant={tier === "senior" ? "default" : "outline"}
                size="sm"
                onClick={() => setTier("senior")}
                className={
                  tier === "senior" ? "bg-[#EFE6D6] text-[#1A1A1A]" : "border-[#1A1A1A] text-white/70"
                }
              >
                Senior ({seniorCount})
              </Button>
              <Button
                variant={tier === "broker" ? "default" : "outline"}
                size="sm"
                onClick={() => setTier("broker")}
                className={
                  tier === "broker" ? "bg-[#EFE6D6] text-[#1A1A1A]" : "border-[#1A1A1A] text-white/70"
                }
              >
                Brokers ({allBrokers.length - seniorCount})
              </Button>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-y border-[#1A1A1A]">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/90" />
                <Input
                  placeholder="Search by name or specialization..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-[#FDFBF7] border-[#1A1A1A]"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={nationality === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNationality(null)}
                  className={
                    nationality === null
                      ? "bg-[#EFE6D6] text-[#1A1A1A]"
                      : "border-[#1A1A1A]"
                  }
                >
                  All
                </Button>
                {nationalities.map((nat) => (
                  <Button
                    key={nat}
                    variant={nationality === nat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNationality(nat)}
                    className={
                      nationality === nat
                        ? "bg-[#EFE6D6] text-[#1A1A1A]"
                        : "border-[#1A1A1A] text-white/70"
                    }
                  >
                    {nat}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Brokers Grid */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <p className="text-white/90 mb-6">
              {filteredBrokers.length} broker{filteredBrokers.length === 1 ? "" : "s"} found
            </p>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.02 } } }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
            >
              {filteredBrokers.map((broker) => (
                <BrokerCard key={broker.id} broker={broker} />
              ))}
            </motion.div>
          </div>
        </section>
      </div>
    </>
  );
};

export default OurBrokers;
