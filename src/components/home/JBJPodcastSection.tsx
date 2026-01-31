import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Globe,
  Mic,
  Radio,
  Lock,
  Loader2
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
import { useToast } from "@/hooks/use-toast";

import episode1Thumbnail from "@/assets/podcast-episode-1-thumbnail.jpg";

// Episode 1 full script segments for TTS generation
const episode1Segments = [
  // INTRO
  { speaker: "jane" as const, text: "Dubai didn't grow by accident. It wasn't luck, and it wasn't coincidence. Dubai was designed — deliberately, strategically, and with long-term vision." },
  { speaker: "jane" as const, text: "When people look at Dubai today, they see the skyline, the lifestyle, the architecture. What they don't immediately see is the system behind it — the structure, the clarity, and the intent." },
  { speaker: "jane" as const, text: "Welcome to The JBJ Perspective. I'm Jane, and today we're unpacking why Dubai has become the capital of global investors — not just financially, but strategically. Alex, let's start simple. Why Dubai?" },
  
  // SECTION 1
  { speaker: "alex" as const, text: "Dubai positioned itself early as a global platform, not just a city. From a regulatory standpoint, it removed friction before most markets even acknowledged it. Clear ownership laws, tax efficiency, fast decision-making, and leadership alignment — these are fundamentals investors look for globally." },
  { speaker: "jane" as const, text: "Exactly. Investors don't fear volatility — they fear uncertainty. And Dubai offers certainty: clear rules, respected timelines, and consistent direction. Lina, from an investor's point of view, what matters most?" },
  { speaker: "lina" as const, text: "Certainty and accessibility. Dubai doesn't ask where you come from — it asks what you bring. Capital, ideas, experience. That mindset alone makes investors feel welcomed rather than restricted." },
  
  // SECTION 2
  { speaker: "jane" as const, text: "Let's talk real estate, because here it's not just about buying property. In Dubai, real estate is a strategy. It's about anchoring presence, residency, mobility, and long-term positioning." },
  { speaker: "alex" as const, text: "That's a critical distinction. In many countries, property is isolated. In Dubai, it's integrated. Property connects directly to visas, lifestyle, business setup, and wealth planning." },
  { speaker: "lina" as const, text: "And that's why smart capital comes here. Investors aren't buying square meters — they're buying optionality." },
  { speaker: "jane" as const, text: "Exactly. One asset serving multiple purposes attracts sophisticated investors." },
  
  // SECTION 3
  { speaker: "jane" as const, text: "Another defining factor is execution speed — but controlled speed. Dubai builds infrastructure before demand peaks. Policies are adjusted ahead of pressure. Growth is managed, not chased." },
  { speaker: "alex" as const, text: "Most global cities react. Dubai anticipates. That proactive approach creates confidence." },
  { speaker: "lina" as const, text: "Safety doesn't mean being conservative — it means being prepared. Dubai creates options, and options reduce risk." },
  
  // SECTION 4
  { speaker: "jane" as const, text: "There's also a psychological aspect investors often underestimate. Capital is emotional. Investors must not be. Dubai removes emotional noise by offering structure, transparency, and choice. When people feel secure, they make better decisions." },
  { speaker: "alex" as const, text: "And better decisions compound over time." },
  { speaker: "lina" as const, text: "That's why long-term thinkers thrive here. This city is built for decades, not quarters." },
  
  // SECTION 5
  { speaker: "jane" as const, text: "So why is Dubai attracting even more global capital today? Because the world is fragmenting. Mobility is shrinking. Regulation is tightening. Dubai is doing the opposite." },
  { speaker: "alex" as const, text: "It's positioning itself as neutral, stable, and globally connected." },
  { speaker: "lina" as const, text: "For investors, that's no longer a luxury — it's a necessity." },
  
  // CLOSING
  { speaker: "jane" as const, text: "Dubai became the capital of global investors because it understands one fundamental truth: Vision without execution is useless. Execution without structure is dangerous. Here, vision meets structure. Ambition meets clarity. And long-term thinking is the standard, not the exception." },
  { speaker: "jane" as const, text: "This is what we'll explore throughout The JBJ Perspective — Not just where to invest, but how to think, how to structure, and how to position yourself intelligently in a global market that never stops evolving. Thank you for listening. This is just the beginning." },
];

interface Episode {
  id: number;
  title: string;
  characters: string[];
  duration: string;
  segments?: typeof episode1Segments;
}

const episodes: Episode[] = [
  {
    id: 1,
    title: "Why Dubai Became the Capital of Global Investors",
    characters: ["Jane", "Alex", "Lina"],
    duration: "10:00",
    segments: episode1Segments,
  },
  { id: 2, title: "Buying Property Smartly in a Global Market", characters: ["Jane", "Alex", "Lina"], duration: "14:20" },
  { id: 3, title: "The Truth About Off-Plan vs Ready Properties", characters: ["Jane", "Alex", "Lina"], duration: "11:30" },
  { id: 4, title: "How High-Net-Worth Investors Protect Capital", characters: ["Jane", "Alex", "Lina"], duration: "13:15" },
  { id: 5, title: "Golden Visa Strategy Through Real Estate", characters: ["Jane", "Alex", "Lina"], duration: "10:50" },
  { id: 6, title: "The Psychology of Successful Investors", characters: ["Jane", "Alex", "Lina"], duration: "12:00" },
  { id: 7, title: "Why Secondary Market Deals Matter", characters: ["Jane", "Alex", "Lina"], duration: "11:45" },
  { id: 8, title: "Luxury Real Estate vs Mass Market Returns", characters: ["Jane", "Alex", "Lina"], duration: "13:30" },
  { id: 9, title: "Mistakes First-Time Investors Always Make", characters: ["Jane", "Alex", "Lina"], duration: "14:10" },
  { id: 10, title: "Building a Global Property Portfolio", characters: ["Jane", "Alex", "Lina"], duration: "15:00" },
  { id: 11, title: "How Developers Really Price Projects", characters: ["Jane", "Alex", "Lina"], duration: "12:20" },
  { id: 12, title: "Rental Yield vs Capital Appreciation", characters: ["Jane", "Alex", "Lina"], duration: "11:00" },
  { id: 13, title: "Investor Onboarding: What Professionals Look For", characters: ["Jane", "Alex", "Lina"], duration: "10:30" },
  { id: 14, title: "Real Estate as a Wealth Transfer Tool", characters: ["Jane", "Alex", "Lina"], duration: "13:45" },
  { id: 15, title: "Exit Strategies Nobody Explains", characters: ["Jane", "Alex", "Lina"], duration: "12:30" },
  { id: 16, title: "Legal Structures Every Investor Should Know", characters: ["Jane", "Alex", "Lina"], duration: "14:00" },
  { id: 17, title: "The Future of Global Real Estate", characters: ["Jane", "Alex", "Lina"], duration: "11:15" },
  { id: 18, title: "Building Trust in High-Value Transactions", characters: ["Jane", "Alex", "Lina"], duration: "10:45" },
  { id: 19, title: "Why Most Investors Fail to Scale", characters: ["Jane", "Alex", "Lina"], duration: "12:50" },
  { id: 20, title: "The JBJ Investment Philosophy", characters: ["Jane", "Alex", "Lina"], duration: "15:30" },
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
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [volume, setVolume] = useState([75]);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Generate podcast audio
  const generatePodcastAudio = async () => {
    if (!selectedEpisode.segments) {
      toast({
        title: "Coming Soon",
        description: "This episode is not yet available.",
        variant: "default",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-podcast-tts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ 
            segments: selectedEpisode.segments,
            language: selectedLanguage 
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to generate audio");
      }

      // Create audio URL from base64
      const audioDataUrl = `data:audio/mpeg;base64,${data.audioContent}`;
      setAudioUrl(audioDataUrl);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = audioDataUrl;
        audioRef.current.playbackRate = playbackSpeed;
        await audioRef.current.play();
        setIsPlaying(true);
      }

      toast({
        title: "Podcast Ready",
        description: "Episode generated with Jane's voice.",
      });

    } catch (error) {
      console.error("Error generating podcast:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Could not generate podcast audio.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (audioUrl) {
      await audioRef.current.play();
      setIsPlaying(true);
    } else {
      await generatePodcastAudio();
    }
  };

  const handlePrevious = () => {
    const currentIndex = episodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex > 0) {
      setSelectedEpisode(episodes[currentIndex - 1]);
      setProgress(0);
      setCurrentTime(0);
      setAudioUrl(null);
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    const currentIndex = episodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex < episodes.length - 1) {
      setSelectedEpisode(episodes[currentIndex + 1]);
      setProgress(0);
      setCurrentTime(0);
      setAudioUrl(null);
      setIsPlaying(false);
    }
  };

  const cyclePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.findIndex(s => s.value === playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    const newSpeed = PLAYBACK_SPEEDS[nextIndex].value;
    setPlaybackSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress);
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = (newProgress / 100) * duration;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration > 0) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" />

      {/* Premium Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-black to-zinc-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--gold)/0.08),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--gold)/0.05),transparent_50%)]" />
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
                {/* Episode Thumbnail - Clean, no text overlay */}
                <div className="relative aspect-video">
                  <img 
                    src={episode1Thumbnail}
                    alt="JBJ Podcast"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
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
                    disabled={isLoading}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div 
                      className="w-24 h-24 rounded-full bg-gold/95 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300 disabled:opacity-50"
                      style={{ boxShadow: '0 0 60px rgba(200,167,102,0.4)' }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-10 h-10 text-black animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-10 h-10 text-black" />
                      ) : (
                        <Play className="w-10 h-10 text-black ml-1" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Episode Title - Outside the frame */}
              <div className="mt-4 mb-2">
                <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
                  {selectedEpisode.title}
                </h3>
                <p className="text-sm text-gold/80 mt-1">
                  Featuring: {selectedEpisode.characters.join(" • ")}
                </p>
              </div>

              {/* Audio Controls Bar */}
              <div className="mt-4 bg-zinc-900/90 backdrop-blur-sm rounded-xl border border-gold/20 p-4">
                {/* Progress Bar - LEFT to RIGHT */}
                <div className="mb-4">
                  <Slider
                    value={[progress]}
                    max={100}
                    step={0.1}
                    onValueChange={handleProgressChange}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{duration > 0 ? formatTime(duration) : selectedEpisode.duration}</span>
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
                      disabled={isLoading}
                      className="w-14 h-14 rounded-full bg-gold hover:bg-gold-light flex items-center justify-center transition-colors shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 text-black animate-spin" />
                      ) : isPlaying ? (
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

                  {/* Language Selector - BLACK TEXT */}
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-zinc-400" />
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-36 bg-zinc-800 border-zinc-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-pearl border-gold/30">
                        {languages.map((lang) => (
                          <SelectItem 
                            key={lang.code} 
                            value={lang.code}
                            className="text-black hover:bg-gold/20 focus:bg-gold/20 focus:text-black"
                          >
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span className="text-black">{lang.name}</span>
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
                      onValueChange={handleVolumeChange}
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
                          setCurrentTime(0);
                          setAudioUrl(null);
                          setIsPlaying(false);
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
