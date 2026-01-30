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

// Episode data with scripts (as provided)
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
    duration: "12:45"
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

  // Note: Audio generation and playback will be implemented via ElevenLabs
  // This is the UI shell - audio files need to be generated separately

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    // TODO: Implement actual audio playback when audio files are generated
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
    <section className="py-16 md:py-24 bg-black">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gold/20 to-gold/10 border border-gold/40 rounded-full text-xs uppercase tracking-[0.2em] font-semibold text-gold mb-4">
            <Radio className="w-4 h-4" />
            Exclusive Content
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            JBJ <span className="text-gold">Podcast</span>
          </h2>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto">
            The JBJ Perspective: Real Estate, Power & Global Opportunity
          </p>
        </motion.div>

        {/* Main Player Container */}
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video/Visual Player */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2"
            >
              <div 
                className="relative rounded-2xl overflow-hidden aspect-video bg-zinc-900"
                style={{
                  boxShadow: '0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 1px rgba(200,167,102,0.3)'
                }}
              >
                {/* Background Video/Image */}
                <video
                  className="absolute inset-0 w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  <source src="/videos/dubai-skyline-podcast.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                {/* Episode Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <span className="inline-flex items-center gap-2 px-3 py-1 bg-gold/20 border border-gold/40 rounded-full text-xs text-gold mb-3">
                    <Mic className="w-3 h-3" />
                    Episode {selectedEpisode.id}
                  </span>
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                    {selectedEpisode.title}
                  </h3>
                  <p className="text-sm text-zinc-400">
                    Featuring: {selectedEpisode.characters.join(", ")}
                  </p>
                </div>

                {/* Play Button Overlay */}
                <button
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center group"
                >
                  <div className="w-20 h-20 rounded-full bg-gold/90 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                    {isPlaying ? (
                      <Pause className="w-8 h-8 text-black" />
                    ) : (
                      <Play className="w-8 h-8 text-black ml-1" />
                    )}
                  </div>
                </button>
              </div>

              {/* Audio Controls */}
              <div className="mt-4 bg-zinc-900/80 backdrop-blur-sm rounded-xl border border-gold/20 p-4">
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
                <div className="flex items-center justify-between">
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

                  {/* Language Selector */}
                  <div className="flex items-center gap-4">
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

                    {/* Speed Control */}
                    <button
                      onClick={cyclePlaybackSpeed}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-gold transition-colors"
                    >
                      {playbackSpeed}x
                    </button>

                    {/* Volume */}
                    <div className="hidden md:flex items-center gap-2 w-32">
                      <Volume2 className="w-4 h-4 text-zinc-400" />
                      <Slider
                        value={volume}
                        max={100}
                        step={1}
                        onValueChange={setVolume}
                        className="w-full"
                      />
                    </div>
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
              <div className="bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-gold/20 overflow-hidden h-full">
                <div className="p-4 border-b border-gold/20">
                  <h4 className="text-lg font-bold text-white">All Episodes</h4>
                  <p className="text-xs text-zinc-500">{episodes.length} episodes available</p>
                </div>
                <ScrollArea className="h-[400px] lg:h-[calc(100%-60px)]">
                  <div className="p-2">
                    {episodes.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => {
                          setSelectedEpisode(episode);
                          setProgress(0);
                          setIsPlaying(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${
                          selectedEpisode.id === episode.id
                            ? "bg-gold/20 border border-gold/40"
                            : "bg-zinc-800/50 hover:bg-zinc-800 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                            selectedEpisode.id === episode.id
                              ? "bg-gold text-black"
                              : "bg-zinc-700 text-white"
                          }`}>
                            {episode.id}
                          </span>
                          <div className="min-w-0">
                            <h5 className={`text-sm font-medium truncate ${
                              selectedEpisode.id === episode.id ? "text-gold" : "text-white"
                            }`}>
                              {episode.title}
                            </h5>
                            <p className="text-xs text-zinc-500 mt-0.5">{episode.duration}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          </div>

          {/* Script Preview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-8"
          >
            <div className="bg-zinc-900/60 backdrop-blur-sm rounded-2xl border border-gold/20 p-6">
              <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-gold" />
                Episode Script Preview
              </h4>
              <div className="space-y-4">
                {selectedEpisode.script.map((line, index) => (
                  <div key={index} className="flex gap-4">
                    <span className={`shrink-0 w-16 text-sm font-semibold ${
                      line.speaker === "Jane" ? "text-gold" :
                      line.speaker === "Alex" ? "text-blue-400" :
                      "text-purple-400"
                    }`}>
                      {line.speaker}:
                    </span>
                    <p className="text-zinc-300 text-sm italic">"{line.text}"</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Admin Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/60 border border-zinc-700 rounded-full text-xs text-zinc-400">
              <Lock className="w-3 h-3" />
              Audio download available for admin only
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default JBJPodcastSection;
