import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  VolumeX,
  Globe,
  Mic,
  Radio,
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
import { T } from "@/components/ui/T";

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
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(75);
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
      // Generate full podcast audio (testMode: false for full episode)
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
            language: selectedLanguage,
            testMode: false // Full episode generation
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
    if (value[0] > 0) {
      setIsMuted(false);
      setPreviousVolume(value[0]);
    }
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
      audioRef.current.muted = value[0] === 0;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // Unmute - restore previous volume
      setVolume([previousVolume]);
      setIsMuted(false);
      if (audioRef.current) {
        audioRef.current.volume = previousVolume / 100;
        audioRef.current.muted = false;
      }
    } else {
      // Mute - save current volume and set to 0
      setPreviousVolume(volume[0]);
      setVolume([0]);
      setIsMuted(true);
      if (audioRef.current) {
        audioRef.current.muted = true;
      }
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
    <section className="relative py-20 md:py-28 overflow-hidden jj-layer-2">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" />

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
            <T>Exclusive Content</T>
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            <T>The JBJ</T> <span className="text-gold"><T>Perspective</T></span>
          </h2>
          <p className="text-lg md:text-xl text-black/70 max-w-2xl mx-auto">
            <T>Real Estate, Power & Global Opportunity</T>
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
              {/* Premium Frame Container - FULL PHOTO, NO BORDERS */}
              <div className="relative rounded-xl overflow-hidden">
                {/* Episode Thumbnail - Full frame, no border */}
                <div className="relative aspect-video">
                  <img 
                    src={episode1Thumbnail}
                    alt="JBJ Podcast"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Episode Badge - Top Left - Using proper gold, no yellow */}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black/60 backdrop-blur-sm border border-gold/40 text-gold rounded-full text-xs font-bold uppercase tracking-wider">
                      <Mic className="w-3 h-3" />
                      <T>Episode</T> {selectedEpisode.id}
                    </span>
                  </div>

                  {/* Center Play Button - Using border style instead of solid fill */}
                  <button
                    onClick={handlePlayPause}
                    disabled={isLoading}
                    className="absolute inset-0 flex items-center justify-center group"
                  >
                    <div 
                      className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm border-2 border-gold flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:bg-gold transition-all duration-300 disabled:opacity-50"
                      style={{ boxShadow: '0 0 40px rgba(200,167,102,0.3)' }}
                    >
                      {isLoading ? (
                        <Loader2 className="w-8 h-8 text-gold group-hover:text-black animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-8 h-8 text-gold group-hover:text-black" />
                      ) : (
                        <Play className="w-8 h-8 text-gold group-hover:text-black ml-1" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Episode Title - Outside the frame */}
              <div className="mt-4 mb-2">
                <h3 className="text-xl md:text-2xl font-bold text-black leading-tight">
                  <T>{selectedEpisode.title}</T>
                </h3>
                <p className="text-sm text-gold mt-1">
                  <T>Featuring</T>: {selectedEpisode.characters.join(" • ")}
                </p>
              </div>

              {/* Audio Controls Bar - Pearl/Champagne card */}
              <div className="mt-4 jj-card-inner rounded-xl border border-gold/30 p-4">
                {/* Progress Bar - 0 on LEFT, duration on RIGHT */}
                <div className="mb-4">
                  <Slider
                    value={[progress]}
                    max={100}
                    step={0.1}
                    onValueChange={handleProgressChange}
                    className="w-full [direction:ltr]"
                  />
                  <div className="flex justify-between text-xs text-black/60 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{duration > 0 ? formatTime(duration) : selectedEpisode.duration}</span>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrevious}
                      className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 border border-gold/30 flex items-center justify-center transition-colors"
                    >
                      <SkipBack className="w-5 h-5 text-black" />
                    </button>
                    <button
                      onClick={handlePlayPause}
                      disabled={isLoading}
                      className="w-14 h-14 rounded-full border-2 border-gold bg-transparent hover:bg-gold flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 group"
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 text-gold group-hover:text-black animate-spin" />
                      ) : isPlaying ? (
                        <Pause className="w-6 h-6 text-gold group-hover:text-black" />
                      ) : (
                        <Play className="w-6 h-6 text-gold group-hover:text-black ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={handleNext}
                      className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 border border-gold/30 flex items-center justify-center transition-colors"
                    >
                      <SkipForward className="w-5 h-5 text-black" />
                    </button>
                  </div>

                  {/* Playback Speed */}
                  <button
                    onClick={cyclePlaybackSpeed}
                    className="px-3 py-1.5 bg-black/10 hover:bg-black/20 border border-gold/30 rounded-lg text-sm font-medium text-black transition-colors"
                  >
                    {playbackSpeed}x
                  </button>

                  {/* Language Selector - BLACK TEXT */}
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-black/60" />
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-36 bg-black/10 border-gold/30 text-black text-sm">
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

                  {/* Volume Control with Mute Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 border border-gold/30 flex items-center justify-center transition-colors"
                      title={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted || volume[0] === 0 ? (
                        <VolumeX className="w-4 h-4 text-black/60" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-black/60" />
                      )}
                    </button>
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

            {/* Episode List - Pearl/Champagne card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-1"
            >
              <div className="jj-card-inner rounded-2xl border border-gold/30 overflow-hidden h-full">
                <div className="p-4 border-b border-gold/20">
                  <h3 className="text-lg font-semibold text-black"><T>All Episodes</T></h3>
                  <p className="text-sm text-black/60"><T>20 episodes available</T></p>
                </div>

                <ScrollArea className="h-[400px] lg:h-[480px]">
                  <div className="p-2">
                    {episodes.map((episode) => (
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
                            : "bg-black/5 hover:bg-black/10 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${
                            selectedEpisode.id === episode.id 
                              ? "border-gold bg-gold text-black" 
                              : "border-gold/40 bg-transparent text-gold"
                          }`}>
                            <Play className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              selectedEpisode.id === episode.id ? "text-gold" : "text-black"
                            }`}>
                              <T>{episode.title}</T>
                            </p>
                            <p className="text-xs text-black/50 mt-0.5">
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
