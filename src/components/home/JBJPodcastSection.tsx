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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PodcastSlider } from "@/components/ui/podcast-slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { T } from "@/components/ui/T";
import { SafeImage } from "@/components/SafeImage";
import { podcastEpisodes, podcastLanguages } from "@/content/podcast/episodes";

const PLAYBACK_SPEEDS = [
  { value: 0.5, label: "0.5x" },
  { value: 1, label: "1x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
];

const parseDurationToSeconds = (label: string) => {
  // expected: mm:ss
  const [mRaw, sRaw] = label.split(":");
  const m = Number(mRaw);
  const s = Number(sRaw);
  if (!Number.isFinite(m) || !Number.isFinite(s)) return 0;
  return Math.max(0, m * 60 + s);
};

const JBJPodcastSection = () => {
  const [selectedEpisode, setSelectedEpisode] = useState(podcastEpisodes[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(75);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(() => parseDurationToSeconds(podcastEpisodes[0].duration));
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

      // Check if response is JSON (error) or binary audio (success)
      const contentType = response.headers.get("content-type") || "";
      
      if (contentType.includes("application/json")) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate audio");
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Get streamed audio as blob
      const audioBlob = await response.blob();
      const audioBlobUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(audioBlobUrl);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = audioBlobUrl;
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
    const currentIndex = podcastEpisodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex > 0) {
      setSelectedEpisode(podcastEpisodes[currentIndex - 1]);
      setProgress(0);
      setCurrentTime(0);
      setDuration(parseDurationToSeconds(podcastEpisodes[currentIndex - 1].duration));
      setAudioUrl(null);
      setIsPlaying(false);
    }
  };

  const handleNext = () => {
    const currentIndex = podcastEpisodes.findIndex(ep => ep.id === selectedEpisode.id);
    if (currentIndex < podcastEpisodes.length - 1) {
      setSelectedEpisode(podcastEpisodes[currentIndex + 1]);
      setProgress(0);
      setCurrentTime(0);
      setDuration(parseDurationToSeconds(podcastEpisodes[currentIndex + 1].duration));
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
      const effectiveDuration =
        Number.isFinite(audio.duration) && audio.duration > 0
          ? audio.duration
          : duration;
      if (effectiveDuration > 0) setProgress((audio.currentTime / effectiveDuration) * 100);
    };

    const handleLoadedMetadata = () => {
      // Some stitched/concatenated audio sources may report Infinity/NaN.
      // In that case we keep our (mm:ss) fallback duration so the UI isn't stuck at 0.
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
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
  }, [duration]);

  // When the selected episode changes, reset the duration fallback (so UI never shows 0:00).
  useEffect(() => {
    setDuration(parseDurationToSeconds(selectedEpisode.duration));
  }, [selectedEpisode]);

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
            <T>JBJ Podcast</T>
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
                  <SafeImage
                    src={selectedEpisode.thumbnail}
                    alt={selectedEpisode.title}
                    className="absolute inset-0 w-full h-full object-cover"
                    fallbackSrc="/placeholder.svg"
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
                      className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm border-2 border-gold flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300 disabled:opacity-50"
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
                  <PodcastSlider
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
                      className="w-14 h-14 rounded-full border-2 border-gold bg-transparent flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 group"
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
                      <SelectTrigger className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {podcastLanguages.map((lang) => (
                          <SelectItem 
                            key={lang.code} 
                            value={lang.code}
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
                    <PodcastSlider
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
                    {podcastEpisodes.map((episode) => (
                      <button
                        key={episode.id}
                        onClick={() => {
                          setSelectedEpisode(episode);
                          setProgress(0);
                          setCurrentTime(0);
                          setDuration(parseDurationToSeconds(episode.duration));
                          setAudioUrl(null);
                          setIsPlaying(false);
                        }}
                        className={`w-full p-3 rounded-xl text-left transition-all mb-1 ${
                          selectedEpisode.id === episode.id
                            ? "bg-gold/10 border border-gold/40"
                            : "bg-pearl/60 hover:bg-pearl border border-transparent"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            <SafeImage
                              src={episode.thumbnail}
                              alt={episode.title}
                              className="w-full h-full object-cover object-center"
                              fallbackSrc="/placeholder.svg"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium leading-snug line-clamp-2 break-words ${
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
