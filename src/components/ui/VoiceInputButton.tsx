import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TranscriptResult {
  original: string;
  translated?: string | null;
  detectedLanguage?: string;
  languageName?: string;
  isEnglish?: boolean;
}

interface VoiceInputButtonProps {
  /** Called with the text to insert. If auto-translation is enabled, receives the original text. */
  onTranscript: (text: string) => void;
  /** Called with full result including original + translated text. */
  onTranscriptResult?: (result: TranscriptResult) => void;
  disabled?: boolean;
  language?: string;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "outline" | "default" | "ghost" | "destructive";
}

/**
 * Unified voice input button for record + transcribe functionality.
 * Supports auto-detection of language, transcription, and translation to English.
 */
export function VoiceInputButton({
  onTranscript,
  onTranscriptResult,
  disabled,
  language = "auto",
  className,
  size = "icon",
  variant = "outline"
}: VoiceInputButtonProps) {
  const [status, setStatus] = useState<"idle" | "recording" | "processing">("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true 
        }
      });
      
      streamRef.current = stream;
      
      // Determine best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : 'audio/mp4';
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setStatus("processing");
        
        // Create blob from recorded chunks
        const audioBlob = new Blob(chunksRef.current, { type: mimeType.split(';')[0] });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            const { data, error } = await supabase.functions.invoke('voice-to-text', {
              body: { audio: base64Audio, language }
            });
            
            if (error) throw error;
            
            if (data?.text) {
              // Build result
              const result: TranscriptResult = {
                original: data.text,
                translated: data.translated_text || null,
                detectedLanguage: data.detected_language,
                languageName: data.language_name,
                isEnglish: data.is_english,
              };

              // Call callbacks
              onTranscript(data.text);
              onTranscriptResult?.(result);

              // Show appropriate toast
              if (data.translated_text && !data.is_english) {
                toast.success(`Transcribed from ${data.language_name || 'detected language'}`, {
                  description: "Original + English translation added",
                  duration: 3000,
                });
              } else {
                toast.success("Voice transcribed!");
              }
            } else {
              toast.error(data?.error || "No speech detected");
            }
          } catch (err) {
            console.error("Transcription error:", err);
            toast.error("Failed to transcribe audio");
          } finally {
            setStatus("idle");
          }
        };
        
        reader.readAsDataURL(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };

      mediaRecorder.start();
      setStatus("recording");
      toast.info("🎙️ Recording... Speak in any language. Click to stop.", { duration: 3000 });
    } catch (err: any) {
      console.error("Recording error:", err);
      if (err.name === 'NotAllowedError') {
        toast.error("Microphone access denied. Please allow in browser settings.");
      } else if (err.name === 'NotFoundError') {
        toast.error("Microphone not found. Please check your device.");
      } else {
        toast.error("Could not access microphone");
      }
      setStatus("idle");
    }
  }, [language, onTranscript, onTranscriptResult]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && status === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, [status]);

  const handleClick = () => {
    if (status === "recording") {
      stopRecording();
    } else if (status === "idle") {
      startRecording();
    }
    // Do nothing if processing
  };

  const getIcon = () => {
    if (status === "processing") {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (status === "recording") {
      return <Square className="h-4 w-4 fill-current" />;
    }
    return <Mic className="h-4 w-4" />;
  };

  const getButtonClasses = () => {
    if (status === "recording") {
      return "bg-red-500 hover:bg-red-600 text-white border-red-500 animate-pulse";
    }
    return "";
  };

  return (
    <Button
      type="button"
      variant={status === "recording" ? "destructive" : variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || status === "processing"}
      className={`${getButtonClasses()} ${className || ""}`}
      title={
        status === "recording" ? "Stop recording" :
        status === "processing" ? "Transcribing & translating..." :
        "🎙️ Speak in any language — auto-translated"
      }
    >
      {getIcon()}
    </Button>
  );
}

export default VoiceInputButton;
