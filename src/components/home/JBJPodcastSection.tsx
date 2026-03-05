import { useState, useEffect } from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";
import { usePodcastPlayback } from "@/features/podcast/usePodcastPlayback";

const PLAYBACK_SPEEDS = [
  { value: 0.5, label: "0.5x" },
  { value: 1, label: "1x" },
  { value: 1.5, label: "1.5x" },
  { value: 2, label: "2x" },
];

const SKIP_SECONDS = 15;

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
  const [volume, setVolume] = useState([75]);
  const [isMuted, setIsMuted] = useState(false);
  const [previousVolume, setPreviousVolume] = useState(75);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playbackNote, setPlaybackNote] = useState<string | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubProgress, setScrubProgress] = useState(0);
  
  const { toast } = useToast();
  const { language, setLanguage } = useLanguage();

  const playback = usePodcastPlayback({
    episodeId: selectedEpisode.id,
    segments: selectedEpisode.segments,
    language,
    playbackRate: playbackSpeed,
    volume: Math.max(0, Math.min(1, volume[0] / 100)),
    muted: isMuted || volume[0] === 0,
  });

  const handlePlayPause = async () => {
    setErrorMessage(null);
    setPlaybackNote(null);

    if (!selectedEpisode.segments) {
      toast({
        title: "Episode not ready",
        description: "This episode script is not available yet.",
        variant: "default",
      });
      return;
    }

    await playback.toggle();
  };

  const handleSkipBack = () => {
    void playback.seek(Math.max(0, playback.currentTime - SKIP_SECONDS));
  };

  const handleSkipForward = () => {
    const d = playback.duration || parseDurationToSeconds(selectedEpisode.duration);
    void playback.seek(Math.min(d, playback.currentTime + SKIP_SECONDS));
  };

  const cyclePlaybackSpeed = () => {
    const currentIndex = PLAYBACK_SPEEDS.findIndex(s => s.value === playbackSpeed);
    const nextIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
    const newSpeed = PLAYBACK_SPEEDS[nextIndex].value;
    setPlaybackSpeed(newSpeed);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (value[0] > 0) {
      setIsMuted(false);
      setPreviousVolume(value[0]);
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      // Unmute - restore previous volume
      setVolume([previousVolume]);
      setIsMuted(false);
    } else {
      // Mute - save current volume and set to 0
      setPreviousVolume(volume[0]);
      setVolume([0]);
      setIsMuted(true);
    }
  };

  const handleProgressChange = (value: number[]) => {
    setIsScrubbing(true);
    setScrubProgress(value[0] ?? 0);
  };

  const handleProgressCommit = (value: number[]) => {
    const newProgress = value[0] ?? 0;
    const d = playback.duration || parseDurationToSeconds(selectedEpisode.duration);
    setIsScrubbing(false);
    setScrubProgress(newProgress);
    if (!d) return;
    void playback.seek((newProgress / 100) * d);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Surface hook error in existing error panel.
    if (playback.status === "error" && playback.error) {
      setErrorMessage(playback.error);
    }
  }, [playback.error, playback.status]);

  useEffect(() => {
    if (playback.status === "loading" && playback.loadingStep) {
      setPlaybackNote(`Preparing audio… ${playback.loadingStep.current}/${playback.loadingStep.total}`);
    } else {
      setPlaybackNote(null);
    }
  }, [playback.loadingStep, playback.status]);

  const effectiveDuration = playback.duration || parseDurationToSeconds(selectedEpisode.duration);
  const displayTimeSeconds = isScrubbing && effectiveDuration
    ? (Math.max(0, Math.min(100, scrubProgress)) / 100) * effectiveDuration
    : playback.currentTime;

  return (
    <section className="relative py-20 md:py-28 overflow-hidden jj-layer-2">
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
                    loading="eager"
                    fetchPriority="high"
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
                  {/* IMPORTANT: the old full-frame button blocked scrolling/touch interactions.
                      We keep only the circle clickable so scroll + controls always work. */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <button
                      onClick={handlePlayPause}
                      disabled={playback.status === "loading"}
                      className="group pointer-events-auto"
                      aria-label={playback.status === "playing" ? "Pause" : "Play"}
                    >
                      <div 
                        className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm border-2 border-gold flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-all duration-300 disabled:opacity-50"
                        style={{ boxShadow: '0 0 40px rgba(200,167,102,0.3)' }}
                      >
                        {playback.status === "loading" ? (
                          <Loader2 className="w-8 h-8 text-gold group-hover:text-black animate-spin" />
                        ) : playback.status === "playing" ? (
                          <Pause className="w-8 h-8 text-gold group-hover:text-black" />
                        ) : (
                          <Play className="w-8 h-8 text-gold group-hover:text-black ml-1" />
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Captions (translated to selected language) */}
                  {playback.caption ? (
                    <div
                      className="absolute bottom-0 left-0 right-0 px-4 pb-4 pointer-events-none"
                      data-no-translate
                    >
                      <div className="jj-card-inner/90 backdrop-blur-sm border border-gold/30 rounded-lg px-4 py-3">
                        {playback.captionSpeaker ? (
                          <p className="text-[10px] uppercase tracking-[0.25em] text-black/60 mb-1">
                            {playback.captionSpeaker}
                          </p>
                        ) : null}
                        <p className="text-sm md:text-base text-black leading-relaxed line-clamp-3">
                          {playback.caption}
                        </p>
                      </div>
                    </div>
                  ) : null}
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

                {playbackNote ? (
                  <p className="mt-2 text-xs text-black/70">{playbackNote}</p>
                ) : null}

                {errorMessage ? (
                  <div className="mt-3 jj-card-inner rounded-lg border border-gold/30 px-4 py-3">
                    <p className="text-sm text-black/80 leading-relaxed">{errorMessage}</p>
                  </div>
                ) : null}
              </div>

              {/* Audio Controls Bar - Pearl/Champagne card */}
              <div className="mt-4 jj-card-inner rounded-xl border border-gold/30 p-4">
                {/* Progress Bar - 0 on LEFT, duration on RIGHT */}
                <div className="mb-4">
                  <PodcastSlider
                    value={[isScrubbing ? scrubProgress : playback.progress]}
                    max={100}
                    step={0.1}
                    onValueChange={handleProgressChange}
                    onValueCommit={handleProgressCommit}
                    className="w-full [direction:ltr]"
                  />
                  <div className="flex justify-between text-xs text-black/60 mt-1">
                      <span>{formatTime(displayTimeSeconds)}</span>
                      <span>
                        {playback.duration > 0 ? formatTime(playback.duration) : selectedEpisode.duration}
                      </span>
                  </div>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSkipBack}
                      className="w-10 h-10 rounded-full bg-black/10 hover:bg-black/20 border border-gold/30 flex items-center justify-center transition-colors"
                    >
                      <SkipBack className="w-5 h-5 text-black" />
                    </button>
                    <button
                      onClick={handlePlayPause}
                      disabled={playback.status === "loading"}
                      className="w-14 h-14 rounded-full border-2 border-gold bg-transparent flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 group"
                    >
                      {playback.status === "loading" ? (
                        <Loader2 className="w-6 h-6 text-gold group-hover:text-black animate-spin" />
                      ) : playback.status === "playing" ? (
                        <Pause className="w-6 h-6 text-gold group-hover:text-black" />
                      ) : (
                        <Play className="w-6 h-6 text-gold group-hover:text-black ml-0.5" />
                      )}
                    </button>
                    <button
                      onClick={handleSkipForward}
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
                    <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
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
                    {podcastEpisodes.map((episode, index) => (
                      <button
                        key={episode.id}
                        onClick={() => {
                          setSelectedEpisode(episode);
                          setErrorMessage(null);
                          setPlaybackNote(null);
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
                              loading={index < 6 ? "eager" : "lazy"}
                              fetchPriority={index < 3 ? "high" : "auto"}
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
