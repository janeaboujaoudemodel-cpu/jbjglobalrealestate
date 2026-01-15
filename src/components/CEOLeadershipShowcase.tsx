import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Award, Mic, Users, Trophy, Sparkles, Star } from "lucide-react";

// Import CEO event photos
import ceoAwardCeremony from "@/assets/ceo/ceo-award-ceremony.jpg";
import ceoPanelSpeaking from "@/assets/ceo/ceo-panel-speaking.jpg";
import ceoPanelDiscussion from "@/assets/ceo/ceo-panel-discussion.jpg";
import ceoAwardTrophy from "@/assets/ceo/ceo-award-trophy.jpg";
import ceoLeadershipAward from "@/assets/ceo/ceo-leadership-award.jpg";
import ceoMediaInterview from "@/assets/ceo/ceo-media-interview.jpg";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const achievements = [
  { icon: Trophy, label: "Leadership Excellence Awards 2025", type: "award" },
  { icon: Mic, label: "Global Real Estate Summit Speaker", type: "speaking" },
  { icon: Award, label: "GCA Leadership Award 2025", type: "award" },
  { icon: Users, label: "Industry Panel Moderator", type: "speaking" },
  { icon: Star, label: "Woman of the Universe UAE - Guest of Honor", type: "honor" },
];

const galleryImages = [
  { src: ceoLeadershipAward, caption: "Leadership Excellence Award 2025", category: "Awards" },
  { src: ceoAwardTrophy, caption: "IIA 11th Edition Award Ceremony", category: "Awards" },
  { src: ceoPanelSpeaking, caption: "Industry Panel Discussion", category: "Speaking" },
  { src: ceoPanelDiscussion, caption: "Global Summit Panel", category: "Speaking" },
  { src: ceoMediaInterview, caption: "Media Interview - NewsTime HDTV", category: "Media" },
  { src: ceoAwardCeremony, caption: "International Business Awards", category: "Awards" },
];

const CEOLeadershipShowcase = () => {
  return (
    <section className="py-20 border-t border-zinc-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-gold/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={staggerContainer}
          className="max-w-6xl mx-auto"
        >
          {/* Section Header */}
          <motion.div variants={fadeInUp} className="text-center mb-12">
            <Badge className="bg-gold/15 text-gold border-gold/30 px-4 py-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Visionary Leadership
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Jamila Abou Jaoude
              </span>
            </h2>
            <p className="text-xl text-zinc-400 mb-2">Founder & CEO</p>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              A global innovator, award-winning entrepreneur, and visionary leader
              shaping the future of luxury real estate in the Middle East.
            </p>
          </motion.div>

          {/* Achievements Pills */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800 rounded-full"
              >
                <achievement.icon className="w-4 h-4 text-gold" />
                <span className="text-sm text-zinc-300">{achievement.label}</span>
              </div>
            ))}
          </motion.div>

          {/* Photo Gallery */}
          <motion.div variants={fadeInUp}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((image, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="group relative overflow-hidden rounded-xl aspect-[4/5] cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <img
                    src={image.src}
                    alt={image.caption}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Caption */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <Badge className="bg-gold/20 text-gold border-gold/30 mb-2 text-xs">
                      {image.category}
                    </Badge>
                    <p className="text-white text-sm font-medium">
                      {image.caption}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Leadership Quote */}
          <motion.div
            variants={fadeInUp}
            className="mt-12 text-center max-w-3xl mx-auto"
          >
            <div className="relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-6xl text-gold/20">"</div>
              <p className="text-xl md:text-2xl text-zinc-300 italic leading-relaxed pt-8">
                Innovation and excellence are not just goals—they are the foundation
                of everything we build. At JBJ Global, we're not just selling properties;
                we're crafting futures and shaping skylines.
              </p>
              <p className="mt-6 text-gold font-semibold">— Jamila Abou Jaoude</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CEOLeadershipShowcase;
