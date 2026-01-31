import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Globe,
  Mic,
  Radio,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";

import episode1Thumbnail from "@/assets/podcast-episode-1-thumbnail.jpg";

// Episode 1 full script
const episode1FullScript = `INTRO (≈1 minute)

Jane:
Dubai didn't grow by accident.
It wasn't luck, and it wasn't coincidence.
Dubai was designed — deliberately, strategically, and with long-term vision.

When people look at Dubai today, they see the skyline, the lifestyle, the architecture. What they don't immediately see is the system behind it — the structure, the clarity, and the intent.

Welcome to The JBJ Perspective. I'm Jane, and today we're unpacking why Dubai has become the capital of global investors — not just financially, but strategically.

Alex, let's start simple. Why Dubai?

SECTION 1 — WHY INVESTORS TRUST DUBAI (≈2 minutes)

Alex:
Dubai positioned itself early as a global platform, not just a city.
From a regulatory standpoint, it removed friction before most markets even acknowledged it.

Clear ownership laws, tax efficiency, fast decision-making, and leadership alignment — these are fundamentals investors look for globally.

Jane:
Exactly. Investors don't fear volatility — they fear uncertainty.
And Dubai offers certainty: clear rules, respected timelines, and consistent direction.

Lina, from an investor's point of view, what matters most?

Lina:
Certainty and accessibility.
Dubai doesn't ask where you come from — it asks what you bring. Capital, ideas, experience.

That mindset alone makes investors feel welcomed rather than restricted.

SECTION 2 — REAL ESTATE AS A STRATEGIC ASSET (≈2.5 minutes)

Jane:
Let's talk real estate, because here it's not just about buying property.

In Dubai, real estate is a strategy. It's about anchoring presence, residency, mobility, and long-term positioning.

Alex:
That's a critical distinction.
In many countries, property is isolated. In Dubai, it's integrated.

Property connects directly to visas, lifestyle, business setup, and wealth planning.

Lina:
And that's why smart capital comes here.
Investors aren't buying square meters — they're buying optionality.

Jane:
Exactly. One asset serving multiple purposes attracts sophisticated investors.

SECTION 3 — SPEED, STRUCTURE & EXECUTION (≈2 minutes)

Jane:
Another defining factor is execution speed — but controlled speed.

Dubai builds infrastructure before demand peaks.
Policies are adjusted ahead of pressure.
Growth is managed, not chased.

Alex:
Most global cities react. Dubai anticipates.
That proactive approach creates confidence.

Lina:
Safety doesn't mean being conservative — it means being prepared.
Dubai creates options, and options reduce risk.

SECTION 4 — INVESTOR PSYCHOLOGY (≈1.5 minutes)

Jane:
There's also a psychological aspect investors often underestimate.

Capital is emotional. Investors must not be.

Dubai removes emotional noise by offering structure, transparency, and choice. When people feel secure, they make better decisions.

Alex:
And better decisions compound over time.

Lina:
That's why long-term thinkers thrive here.
This city is built for decades, not quarters.

SECTION 5 — WHY NOW (≈1 minute)

Jane:
So why is Dubai attracting even more global capital today?

Because the world is fragmenting.
Mobility is shrinking.
Regulation is tightening.

Dubai is doing the opposite.

Alex:
It's positioning itself as neutral, stable, and globally connected.

Lina:
For investors, that's no longer a luxury — it's a necessity.

CLOSING (≈1 minute)

Jane:
Dubai became the capital of global investors because it understands one fundamental truth:

Vision without execution is useless.
Execution without structure is dangerous.

Here, vision meets structure.
Ambition meets clarity.
And long-term thinking is the standard, not the exception.

This is what we'll explore throughout The JBJ Perspective —
Not just where to invest, but how to think, how to structure, and how to position yourself intelligently in a global market that never stops evolving.

Thank you for listening.
This is just the beginning.`;

interface Episode {
  id: number;
  title: string;
  characters: string[];
  script: {
    speaker: string;
    text: string;
  }[];
  duration: string;
  thumbnail?: string;
}

const episodes: Episode[] = [
  {
    id: 1,
    title: "Why Dubai Became the Capital of Global Investors",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Dubai didn't grow by accident. It was designed for global capital, clarity, and speed." },
      { speaker: "Alex", text: "What truly differentiates Dubai is regulatory clarity combined with execution speed." },
      { speaker: "Lina", text: "From an investor's perspective, Dubai removes friction that exists in most global cities." }
    ],
    duration: "10:00"
  },
  {
    id: 2,
    title: "Buying Property Smartly in a Global Market",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Buying property today isn't about price alone, it's about timing, structure, and intent." },
      { speaker: "Alex", text: "Most buyers lose money by ignoring market cycles and liquidity." },
      { speaker: "Lina", text: "Smart investors plan five moves ahead, not one." }
    ],
    duration: "14:20"
  },
  {
    id: 3,
    title: "The Truth About Off-Plan vs Ready Properties",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Off-plan works when risk is understood, not ignored." },
      { speaker: "Alex", text: "Liquidity is the conversation most people avoid." },
      { speaker: "Lina", text: "Different strategies exist for different investor profiles." }
    ],
    duration: "11:30"
  },
  {
    id: 4,
    title: "How High-Net-Worth Investors Protect Capital",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Wealth is built by opportunity but preserved by structure." },
      { speaker: "Alex", text: "Asset allocation quietly determines outcomes." },
      { speaker: "Lina", text: "Risk is managed, not eliminated." }
    ],
    duration: "13:15"
  },
  {
    id: 5,
    title: "Golden Visa Strategy Through Real Estate",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "A Golden Visa isn't a lifestyle benefit, it's a strategic tool." },
      { speaker: "Alex", text: "Residency directly affects financial leverage." },
      { speaker: "Lina", text: "Mobility has become a modern form of currency." }
    ],
    duration: "10:50"
  },
  {
    id: 6,
    title: "The Psychology of Successful Investors",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Emotions are the most expensive mistake in investing." },
      { speaker: "Alex", text: "Discipline always beats intelligence." },
      { speaker: "Lina", text: "Long-term thinking separates winners from noise." }
    ],
    duration: "12:00"
  },
  {
    id: 7,
    title: "Why Secondary Market Deals Matter",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "The best opportunities are rarely advertised." },
      { speaker: "Alex", text: "Information asymmetry creates real advantage." },
      { speaker: "Lina", text: "Timing the exit matters as much as the entry." }
    ],
    duration: "11:45"
  },
  {
    id: 8,
    title: "Luxury Real Estate vs Mass Market Returns",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Luxury behaves differently during market shifts." },
      { speaker: "Alex", text: "Scarcity protects long-term value." },
      { speaker: "Lina", text: "End-users buy emotionally, investors buy structurally." }
    ],
    duration: "13:30"
  },
  {
    id: 9,
    title: "Mistakes First-Time Investors Always Make",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Everyone pays tuition in the market." },
      { speaker: "Alex", text: "Ignoring fundamentals is the biggest error." },
      { speaker: "Lina", text: "Chasing trends is rarely sustainable." }
    ],
    duration: "14:10"
  },
  {
    id: 10,
    title: "Building a Global Property Portfolio",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "One country is never enough for real diversification." },
      { speaker: "Alex", text: "Geographic spread reduces exposure." },
      { speaker: "Lina", text: "Currency plays a larger role than most realize." }
    ],
    duration: "15:00"
  },
  {
    id: 11,
    title: "How Developers Really Price Projects",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Pricing is driven by positioning, not cost alone." },
      { speaker: "Alex", text: "Developers price perception as much as product." },
      { speaker: "Lina", text: "Understanding launch strategy reveals true value." }
    ],
    duration: "12:20"
  },
  {
    id: 12,
    title: "Rental Yield vs Capital Appreciation",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Yield feeds today, appreciation builds tomorrow." },
      { speaker: "Alex", text: "Balance is the key metric." },
      { speaker: "Lina", text: "Different phases demand different priorities." }
    ],
    duration: "11:00"
  },
  {
    id: 13,
    title: "Investor Onboarding: What Professionals Look For",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Professional investors assess people before numbers." },
      { speaker: "Alex", text: "Process signals seriousness." },
      { speaker: "Lina", text: "Clarity builds confidence." }
    ],
    duration: "10:30"
  },
  {
    id: 14,
    title: "Real Estate as a Wealth Transfer Tool",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Property quietly transfers wealth across generations." },
      { speaker: "Alex", text: "Structure determines continuity." },
      { speaker: "Lina", text: "Planning today avoids conflict tomorrow." }
    ],
    duration: "13:45"
  },
  {
    id: 15,
    title: "Exit Strategies Nobody Explains",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "The exit should be planned before the entry." },
      { speaker: "Alex", text: "Liquidity defines freedom." },
      { speaker: "Lina", text: "Optionality is power." }
    ],
    duration: "12:30"
  },
  {
    id: 16,
    title: "Legal Structures Every Investor Should Know",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Ownership structure shapes outcomes." },
      { speaker: "Alex", text: "Compliance protects longevity." },
      { speaker: "Lina", text: "Legal clarity reduces hidden risk." }
    ],
    duration: "14:00"
  },
  {
    id: 17,
    title: "The Future of Global Real Estate",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Real estate is becoming borderless." },
      { speaker: "Alex", text: "Technology is reshaping access." },
      { speaker: "Lina", text: "Capital will follow stability." }
    ],
    duration: "11:15"
  },
  {
    id: 18,
    title: "Building Trust in High-Value Transactions",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Trust is the real currency of premium deals." },
      { speaker: "Alex", text: "Reputation compounds over time." },
      { speaker: "Lina", text: "Consistency creates confidence." }
    ],
    duration: "10:45"
  },
  {
    id: 19,
    title: "Why Most Investors Fail to Scale",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Scaling requires systems, not luck." },
      { speaker: "Alex", text: "Repetition builds leverage." },
      { speaker: "Lina", text: "Discipline sustains growth." }
    ],
    duration: "12:50"
  },
  {
    id: 20,
    title: "The JBJ Investment Philosophy",
    characters: ["Jane", "Alex", "Lina"],
    script: [
      { speaker: "Jane", text: "Our philosophy is built on clarity, structure, and long-term vision." },
      { speaker: "Alex", text: "Strategy beats speculation." },
      { speaker: "Lina", text: "Smart capital always seeks alignment." }
    ],
    duration: "15:30"
  }
];

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "ar", name: "Arabic", flag: "🇦🇪" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "fa", name: "Persian", flag: "🇮🇷" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" }
];

const PLAYBACK_SPEEDS = [
  { value: 0.5, label: "0.5x" },
  { value: 1, label: "1x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
];

const JBJPodcastSection = () => {
  const [selectedEpisode, setSelectedEpisode] = useState(episodes[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [volume, setVolume] = useState([75]);
  const [progress, setProgress] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handlePrevious = () => {
    const currentIndex = episodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex > 0) {
      setSelectedEpisode(episodes[currentIndex - 1]);
      setProgress(0);
    }
  };

  const handleNext = () => {
    const currentIndex = episodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex < episodes.length - 1) {
      setSelectedEpisode(episodes[currentIndex + 1]);
      setProgress(0);
    }
  };

  const cyclePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.findIndex(s => s.value === playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIndex].value);
  };

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold)/0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--gold)/0.05),transparent_50%)]" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--gold)) 1px, transparent 1px),
                              linear-gradient(90deg, hsl(var(--gold)) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      <div className="relative z-10 container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/40 rounded-full text-xs uppercase tracking-[0.2em] font-semibold text-gold mb-4">
            <Radio className="w-4 h-4" />
            Exclusive Content
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            The JBJ <span className="text-gold">Perspective</span>
          </h2>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto">
            Real Estate, Power & Global Opportunity
          </p>
        </motion.div>

        {/* Main Player Container */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Episode Thumbnail Frame with Player */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              {/* Premium Frame Container */}
              <div 
                className="relative rounded-2xl overflow-hidden"
                style={{
                  boxShadow: '0 30px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px rgba(200,167,102,0.25), inset 0 1px 0 rgba(200,167,102,0.1)'
                }}
              >
                {/* Episode Thumbnail */}
                <div className="relative aspect-video">
                  <img 
                    src={episode1Thumbnail}
                    alt={`Episode ${selectedEpisode.id}: ${selectedEpisode.title}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                  
                  {/* Episode Badge - Top Left */}
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold text-black rounded-full text-xs font-bold uppercase tracking-wider">
                      <Mic className="w-3 h-3" />
                      Episode {selectedEpisode.id}
                    </span>
                  </div>

                  {/* Center Play Button */}
                  <button
                    onClick={handlePlayPause}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div 
                      className="w-24 h-24 rounded-full bg-gold/95 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300"
                      style={{ boxShadow: '0 0 60px rgba(200,167,102,0.4)' }}
                    >
                      {isPlaying ? (
                        <Pause className="w-10 h-10 text-black" />
                      ) : (
                        <Play className="w-10 h-10 text-black ml-1" />
                      )}
                    </div>
                  </button>

                  {/* Episode Title - Bottom */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
                      {selectedEpisode.title}
                    </h3>
                    <p className="text-sm text-gold/80">
                      Featuring: {selectedEpisode.characters.join(" • ")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Audio Controls Bar */}
              <div className="mt-4 bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-gold/20 p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <Slider
                    value={[progress]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setProgress(value[0])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>0:00</span>
                    <span>{selectedEpisode.duration}</span>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrevious}
                      className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    >
                      <SkipBack className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={handlePlayPause}
                      className="w-14 h-14 rounded-full bg-gold hover:bg-gold-light flex items-center justify-center transition-colors shadow-lg"
                    >
                      {isPlaying ? (
                        <Pause className="w-6 h-6 text-black" />
                      ) : (
                        <Play className="w-6 h-6 text-black ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={handleNext}
                      className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                    >
                      <SkipForward className="w-5 h-5 text-white" />
                    </button>
                  </div>

                  {/* Playback Speed */}
                  <button
                    onClick={cyclePlaybackSpeed}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-white transition-colors"
                  >
                    {playbackSpeed}x
                  </button>

                  {/* Language Selector */}
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-400" />
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {languages.map((lang) => (
                          <SelectItem 
                            key={lang.code} 
                            value={lang.code}
                            className="text-white hover:bg-zinc-800"
                          >
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-zinc-400" />
                    <Slider
                      value={volume}
                      max={100}
                      step={1}
                      onValueChange={setVolume}
                      className="w-20"
                    />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Episode List */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-gold/20 overflow-hidden h-full">
                <div className="p-4 border-b border-gold/20">
                  <h3 className="text-lg font-semibold text-white">All Episodes</h3>
                  <p className="text-sm text-zinc-400">20 episodes available</p>
                </div>

                <ScrollArea className="h-[400px] lg:h-[480px]">
                  <div className="p-2">
                    {episodes.map((episode, index) => (
                      <button
                        key={episode.id}
                        onClick={() => {
                          setSelectedEpisode(episode);
                          setProgress(0);
                        }}
                        className={`w-full p-3 rounded-xl text-left transition-all mb-1 ${
                          selectedEpisode.id === episode.id
                            ? "bg-gold/20 border border-gold/40"
                            : "bg-zinc-800/50 hover:bg-zinc-800 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            selectedEpisode.id === episode.id ? "bg-gold text-black" : "bg-zinc-700 text-zinc-300"
                          }`}>
                            {index === 0 ? (
                              <Play className="w-4 h-4" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              selectedEpisode.id === episode.id ? "text-gold" : "text-white"
                            }`}>
                              {episode.title}
                            </p>
                            <p className="text-xs text-zinc-500 mt-0.5">
                              {episode.duration}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default JBJPodcastSection;
