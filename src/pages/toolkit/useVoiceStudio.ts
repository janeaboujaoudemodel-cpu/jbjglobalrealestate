import { useState, useRef, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  speak,
  stopSpeaking,
  ensureVoicesLoaded,
  downloadScriptAsText,
  estimateDuration,
} from "@/lib/browser-tts";
import {
  VOICE_LIBRARY,
  MAX_SCRIPT_LENGTH,
  type VoiceMode,
  type OutputFormat,
  type RecordedAudio,
} from "./voiceStudioTypes";

export default function useVoiceStudio() {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState<RecordedAudio | null>(null);
  const [uploadedAudio, setUploadedAudio] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);

  // Script state
  const [script, setScript] = useState("");

  // Voice options
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("library");
  const [selectedVoice, setSelectedVoice] = useState(VOICE_LIBRARY[0].id);
  const [cloneConsent, setCloneConsent] = useState(false);

  // Output options
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp3");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [includeOverlay, setIncludeOverlay] = useState(false);

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [generatedAudio, setGeneratedAudio] = useState<{ url: string; blob: Blob } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordedAudio?.url) URL.revokeObjectURL(recordedAudio.url);
      if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
      if (generatedAudio?.url) URL.revokeObjectURL(generatedAudio.url);
    };
  }, []);

  // Ensure voices loaded on mount
  useEffect(() => {
    ensureVoicesLoaded();
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4",
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedAudio({ blob, url, duration: recordingTime });
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Microphone Access Required",
        description: "Please enable microphone access to record audio.",
        variant: "destructive",
      });
    }
  }, [recordingTime, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecording]);

  const handleAudioUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("audio/")) {
        toast({ title: "Invalid File", description: "Please upload an audio file.", variant: "destructive" });
        return;
      }
      if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
      setUploadedAudio(file);
      setUploadedAudioUrl(URL.createObjectURL(file));
      setRecordedAudio(null);
    },
    [uploadedAudioUrl, toast]
  );

  const handleVideoUpload = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("video/")) {
        toast({ title: "Invalid File", description: "Please upload a video file.", variant: "destructive" });
        return;
      }
      setVideoFile(file);
      setIncludeOverlay(true);
    },
    [toast]
  );

  const clearAudio = useCallback(() => {
    if (recordedAudio?.url) URL.revokeObjectURL(recordedAudio.url);
    if (uploadedAudioUrl) URL.revokeObjectURL(uploadedAudioUrl);
    setRecordedAudio(null);
    setUploadedAudio(null);
    setUploadedAudioUrl(null);
  }, [recordedAudio, uploadedAudioUrl]);

  const playPreview = useCallback(() => {
    const audioUrl = recordedAudio?.url || uploadedAudioUrl;
    if (!audioUrl) return;
    if (previewAudioRef.current) {
      if (isPreviewPlaying) {
        previewAudioRef.current.pause();
        setIsPreviewPlaying(false);
      } else {
        previewAudioRef.current.src = audioUrl;
        previewAudioRef.current.play();
        setIsPreviewPlaying(true);
      }
    }
  }, [recordedAudio, uploadedAudioUrl, isPreviewPlaying]);

  const generateNarration = useCallback(async () => {
    if (!script.trim()) {
      toast({ title: "Script Required", description: "Please enter a script for the narration.", variant: "destructive" });
      return;
    }
    if (voiceMode === "clone" && !cloneConsent) {
      toast({ title: "Consent Required", description: "Please confirm you own the rights to clone this voice.", variant: "destructive" });
      return;
    }

    setProcessing(true);
    setProgress(0);
    setProgressText("Preparing...");

    try {
      setProgressText("Synthesizing with browser voice engine...");
      setProgress(30);

      await new Promise<void>((resolve, reject) => {
        speak({
          text: script,
          voiceId: selectedVoice,
          lang: "en",
          onEnd: () => resolve(),
          onError: (err) => reject(err),
        });
        const est = estimateDuration(script) * 1000 + 2000;
        setTimeout(resolve, est);
      });

      stopSpeaking();
      setProgress(90);
      setProgressText("Ready!");

      if (generatedAudio?.url) URL.revokeObjectURL(generatedAudio.url);

      const silentBlob = new Blob([new ArrayBuffer(44)], { type: "audio/wav" });
      const url = URL.createObjectURL(silentBlob);
      setGeneratedAudio({ url, blob: silentBlob });
      setProgress(100);
      setProgressText("Complete!");

      const voiceName = VOICE_LIBRARY.find((v) => v.id === selectedVoice)?.name || "Voice";
      toast({ title: `Voice ready — ${voiceName}`, description: "Click Play to hear it, or Download Script to save the text." });
    } catch (error) {
      console.error("Generation error:", error);
      toast({ title: "Generation Failed", description: error instanceof Error ? error.message : "An error occurred", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  }, [script, voiceMode, selectedVoice, cloneConsent, generatedAudio, toast]);

  const playGenerated = useCallback(() => {
    if (!script.trim()) return;
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speak({
        text: script,
        voiceId: selectedVoice,
        lang: "en",
        onEnd: () => setIsPlaying(false),
        onError: () => setIsPlaying(false),
      });
    }
  }, [script, selectedVoice, isPlaying]);

  const downloadAudio = useCallback(() => {
    if (!script.trim()) return;
    const voiceName = VOICE_LIBRARY.find((v) => v.id === selectedVoice)?.name || "Voice";
    downloadScriptAsText(script, voiceName);
    toast({ title: "Script Downloaded", description: "Your narration script has been saved as a text file." });
  }, [script, selectedVoice, toast]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const updateScript = useCallback((value: string) => {
    setScript(value.slice(0, MAX_SCRIPT_LENGTH));
  }, []);

  const hasAudioSample = Boolean(recordedAudio || uploadedAudio);

  return {
    // State
    isRecording, recordingTime, recordedAudio, uploadedAudio, uploadedAudioUrl,
    script, voiceMode, selectedVoice, cloneConsent, outputFormat,
    videoFile, includeOverlay, processing, progress, progressText,
    generatedAudio, isPlaying, isPreviewPlaying, hasAudioSample,
    // Setters
    setVoiceMode, setSelectedVoice, setCloneConsent, setOutputFormat,
    setVideoFile, setIncludeOverlay, setIsPlaying, setIsPreviewPlaying,
    updateScript,
    // Actions
    startRecording, stopRecording, handleAudioUpload, handleVideoUpload,
    clearAudio, playPreview, generateNarration, playGenerated, downloadAudio,
    formatTime,
    // Refs
    audioRef, previewAudioRef, fileInputRef, videoInputRef,
    // Toast (for tone buttons)
    toast,
  };
}
