import { useState } from "react";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { allBrokers, Broker } from "@/config/brokers-data";
import { Users, Search, Globe, Building2 } from "lucide-react";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const BrokerCard = ({ broker }: { broker: Broker }) => (
  <motion.div variants={fadeInUp}>
    <Card className="bg-zinc-900/60 border-zinc-800 hover:border-gold/40 transition-all duration-300 h-full">
      <CardContent className="p-5">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center text-gold font-bold text-lg">
            {broker.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{broker.name}</h3>
            <p className="text-zinc-500 text-sm">{broker.nationality}</p>
          </div>
        </div>
        <p className="text-zinc-400 text-xs line-clamp-2 mb-3">{broker.bio}</p>
        <div className="flex flex-wrap gap-1 mb-2">
          {broker.specializations.slice(0, 2).map((spec) => (
            <Badge key={spec} variant="outline" className="text-xs border-gold/30 text-gold/80">
              {spec}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {broker.languages.slice(0, 3).map((lang) => (
            <Badge key={lang} variant="outline" className="text-xs border-zinc-700 text-zinc-400">
              {lang}
            </Badge>
          ))}
        </div>
        <p className="text-zinc-600 text-xs mt-2">{broker.yearsExperience} years experience</p>
      </CardContent>
    </Card>
  </motion.div>
);

const OurBrokers = () => {
  const [search, setSearch] = useState("");
  const [nationality, setNationality] = useState<string | null>(null);

  const nationalities = [...new Set(allBrokers.map(b => b.nationality))];

  const filteredBrokers = allBrokers.filter(broker => {
    const matchesSearch = broker.name.toLowerCase().includes(search.toLowerCase()) ||
      broker.specializations.some(s => s.toLowerCase().includes(search.toLowerCase()));
    const matchesNationality = !nationality || broker.nationality === nationality;
    return matchesSearch && matchesNationality;
  });

  return (
    <>
      <SEOHead
        title="Our Brokers | JBJ Global Real Estate"
        description="Meet our team of 128+ professional real estate brokers from around the world, ready to help you find your dream property in Dubai."
        keywords="Dubai brokers, real estate agents, property consultants, JBJ brokers"
        canonicalPath="/brokers"
      />
      <div className="min-h-screen bg-[#0D0D0D]">
        {/* Hero */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[100px]" />
          </div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <Badge className="bg-gold/15 text-gold border-gold/30 px-4 py-1.5 mb-6">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              {allBrokers.length}+ Professional Brokers
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Our <span className="text-gold">Brokers</span>
            </h1>
            <p className="text-zinc-400 max-w-2xl mx-auto mb-8">
              A diverse team of international real estate professionals speaking multiple languages and specializing in every aspect of Dubai property.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-center">
              <div><p className="text-2xl font-bold text-gold">{nationalities.length}</p><p className="text-zinc-500 text-sm">Nationalities</p></div>
              <div><p className="text-2xl font-bold text-gold">15+</p><p className="text-zinc-500 text-sm">Languages</p></div>
              <div><p className="text-2xl font-bold text-gold">500+</p><p className="text-zinc-500 text-sm">Years Combined</p></div>
            </div>
          </div>
        </section>

        {/* Filters */}
        <section className="py-6 border-y border-zinc-800">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  placeholder="Search by name or specialization..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-zinc-900 border-zinc-700"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={nationality === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setNationality(null)}
                  className={nationality === null ? "bg-gold text-black" : "border-zinc-700"}
                >
                  All
                </Button>
                {nationalities.map(nat => (
                  <Button
                    key={nat}
                    variant={nationality === nat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNationality(nat)}
                    className={nationality === nat ? "bg-gold text-black" : "border-zinc-700 text-zinc-400"}
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
            <p className="text-zinc-500 mb-6">{filteredBrokers.length} brokers found</p>
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

        <Footer />
      </div>
    </>
  );
};

export default OurBrokers;
