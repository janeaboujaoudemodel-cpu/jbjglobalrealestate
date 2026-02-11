import { useEffect, useRef, useState, useCallback } from "react";
import { Play } from "lucide-react";
import jbjMonogramDarkBg from "@/assets/jbj-monogram-dark-bg.png";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface YouTubeVideoPlayerProps {
  videoId: string;
  title?: string;
  className?: string;
}

let apiLoaded = false;
let apiReady = false;
const readyCallbacks: (() => void)[] = [];

function loadYouTubeAPI() {
  if (apiReady) return;
  if (apiLoaded) return;
  apiLoaded = true;

  const prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    apiReady = true;
    prev?.();
    readyCallbacks.forEach((cb) => cb());
    readyCallbacks.length = 0;
  };

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

function onAPIReady(cb: () => void) {
  if (apiReady) {
    cb();
  } else {
    readyCallbacks.push(cb);
  }
}

export default function YouTubeVideoPlayer({
  videoId,
  title = "Video",
  className = "",
}: YouTubeVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [ended, setEnded] = useState(false);
  const iframeId = useRef(`yt-player-${videoId}-${Math.random().toString(36).slice(2, 8)}`);

  useEffect(() => {
    loadYouTubeAPI();

    onAPIReady(() => {
      if (!containerRef.current) return;
      playerRef.current = new window.YT.Player(iframeId.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          enablejsapi: 1,
        },
        events: {
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              setEnded(true);
            }
          },
        },
      });
    });

    return () => {
      playerRef.current?.destroy?.();
    };
  }, [videoId]);

  const handleReplay = useCallback(() => {
    const player = playerRef.current;
    if (player?.seekTo) {
      player.seekTo(0, true);
      player.playVideo();
    }
    setEnded(false);
  }, []);

  return (
    <div className={`relative w-full ${className}`} style={{ paddingBottom: "56.25%" }} ref={containerRef}>
      {/* YouTube player target div */}
      <div
        id={iframeId.current}
        className="absolute inset-0 w-full h-full"
        title={title}
      />

      {/* Logo overlay when video ends */}
      {ended && (
        <button
          onClick={handleReplay}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black cursor-pointer transition-opacity duration-500 group"
          aria-label="Replay video"
        >
          <img
            src={jbjMonogramDarkBg}
            alt="JBJ Global Real Estate"
            className="w-40 h-40 md:w-52 md:h-52 object-contain mb-12 opacity-90"
          />
          <div className="flex items-center gap-2 text-gold/80 group-hover:text-gold transition-colors">
            <Play className="w-5 h-5" fill="currentColor" />
            <span className="text-sm font-medium tracking-wider uppercase">Replay</span>
          </div>
        </button>
      )}
    </div>
  );
}
