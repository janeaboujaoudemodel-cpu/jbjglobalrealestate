import { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, VolumeX, X } from "lucide-react";
import jbjMonogramLightOnDark from "@/assets/jbj-monogram-light-on-dark.png";

const STORAGE_KEY = "jj_intro_seen";
const SPLASH_DURATION = 4000; // 4 seconds total

/**
 * BrandIntroSplash — Premium JBJ intro splash with auto-play music.
 * Shows once per session. Auto-plays audio with fallback play button.
 */
export default function BrandIntroSplash() {
  const [visible, setVisible] = useState(() => {
    try {
      return !sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  });
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const dismiss = useCallback(() => {
    setFadeOut(true);
    try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch {}
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setTimeout(() => setVisible(false), 600);
  }, []);

  // Check prefers-reduced-motion
  const prefersReducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (!visible || prefersReducedMotion) {
      if (prefersReducedMotion && visible) dismiss();
      return;
    }

    // Try auto-play
    const audio = new Audio("/audio/jbj-intro-sting.mp3");
    audio.volume = 0.6;
    audioRef.current = audio;

    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => {
          setAudioPlaying(true);
          setAudioBlocked(false);
        })
        .catch(() => {
          setAudioBlocked(true);
          setAudioPlaying(false);
        });
    }

    // Auto-dismiss after duration
    const timer = setTimeout(dismiss, SPLASH_DURATION);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handlePlayAudio = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setAudioPlaying(true);
        setAudioBlocked(false);
      }).catch(() => {});
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center transition-opacity duration-600 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo animation */}
      <div className="relative animate-in zoom-in-50 fade-in duration-700">
        <img
          src={jbjMonogramLightOnDark}
          alt="JBJ Global Real Estate"
          className="w-28 h-28 md:w-40 md:h-40 object-contain"
          style={{
            filter: "drop-shadow(0 0 40px rgba(200,167,102,0.5))",
            animation: "splashPulse 2s ease-in-out infinite",
          }}
        />
      </div>

      {/* Wordmark */}
      <div
        className="mt-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        <p className="text-lg md:text-2xl font-bold text-white tracking-[0.2em] uppercase">
          JBJ Global
        </p>
        <p className="text-sm md:text-base font-semibold text-[#D4B896] tracking-[0.25em] uppercase mt-1">
          Real Estate
        </p>
      </div>

      {/* Audio blocked fallback */}
      {audioBlocked && (
        <button
          onClick={handlePlayAudio}
          className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full border border-gold/40 bg-gold/10 text-gold text-sm font-medium hover:bg-gold/20 transition-all animate-in fade-in duration-500"
        >
          <Volume2 className="w-4 h-4" />
          Enable Sound
        </button>
      )}

      {/* Skip button */}
      <button
        onClick={dismiss}
        className="absolute top-6 right-6 flex items-center gap-1.5 text-white/40 hover:text-white/80 text-xs font-medium tracking-wider uppercase transition-colors"
      >
        Skip
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Audio indicator */}
      {audioPlaying && (
        <div className="absolute bottom-6 right-6 flex items-center gap-1.5 text-gold/50 text-[10px] tracking-wider uppercase">
          <Volume2 className="w-3 h-3" />
          <span>♪</span>
        </div>
      )}

      <style>{`
        @keyframes splashPulse {
          0%, 100% { filter: drop-shadow(0 0 24px rgba(200,167,102,0.3)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 48px rgba(200,167,102,0.6)); transform: scale(1.03); }
        }
      `}</style>
    </div>
  );
}
