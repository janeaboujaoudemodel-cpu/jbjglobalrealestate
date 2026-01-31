import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

import burjAlArabVideo from "@/assets/videos/why-dubai-burj-al-arab.mp4";
import dubaiFrameVideo from "@/assets/videos/why-dubai-dubai-frame.mp4";
import burjKhalifaVideo from "@/assets/videos/why-dubai-burj-khalifa.mp4";
import atlantisPalmVideo from "@/assets/videos/why-dubai-atlantis-palm.mp4";

const videoTiles = [
  { src: burjAlArabVideo, label: "Burj Al Arab" },
  { src: dubaiFrameVideo, label: "Dubai Frame" },
  { src: burjKhalifaVideo, label: "Burj Khalifa" },
  { src: atlantisPalmVideo, label: "Atlantis / Palm Jumeirah" },
];

export default function WhyDubaiCapitalSection() {
  return (
    <section className="py-16 md:py-24 bg-black">
      <div className="mx-1 sm:mx-2 md:mx-3 lg:mx-4">
        <div className="rounded-3xl overflow-hidden border border-gold/30 bg-black">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Content */}
            <div className="relative p-6 md:p-10 lg:p-12">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,hsl(var(--gold)/0.14),transparent_60%)]" />
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/40 bg-black/50 backdrop-blur-sm text-xs uppercase tracking-[0.2em] font-semibold text-gold">
                  <Globe className="w-4 h-4" />
                  Global Investment Hub
                </span>

                <h2
                  className="mt-5 text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  Why Dubai Became the Capital of{" "}
                  <span className="text-gold">Global Investors</span>
                </h2>

                <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl">
                  Strategic location, world-class infrastructure, and long-term government execution make Dubai the most
                  investable city in the region.
                </p>

                <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { value: "0%", label: "Income Tax" },
                    { value: "10Y", label: "Golden Visa" },
                    { value: "#1", label: "Safety Rank" },
                    { value: "200+", label: "Nationalities" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl border border-gold/25 bg-black/45 backdrop-blur-sm px-4 py-4 text-center"
                    >
                      <div className="text-2xl md:text-3xl font-bold text-gold leading-none">{s.value}</div>
                      <div className="mt-1 text-[10px] md:text-xs uppercase tracking-wider text-muted-foreground">
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-center lg:justify-start">
                  <Button asChild variant="primary" size="lg" className="w-full sm:w-auto">
                    <Link to="/guides/investment">
                      Explore Investment Opportunities
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>

            {/* Video mosaic */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-l from-black/40 via-transparent to-transparent pointer-events-none" />
              <div className="grid grid-cols-2 gap-px bg-black/70">
                {videoTiles.map((tile) => (
                  <div key={tile.label} className="relative aspect-video lg:aspect-[4/3] overflow-hidden">
                    <video
                      className="absolute inset-0 w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="metadata"
                    >
                      <source src={tile.src} type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <span className="inline-flex items-center rounded-full border border-gold/30 bg-black/45 backdrop-blur-sm px-3 py-1 text-[10px] md:text-xs font-semibold tracking-wide text-primary-foreground">
                        {tile.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
